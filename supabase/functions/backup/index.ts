// Supabase Edge Function "backup" (Deno): automatic backups to Cloudflare R2 (specs/automatic-backups.md). All the
// rules are in handler.ts; this file only connects it to Supabase and R2:
//   - the signed-in user is checked with Supabase Auth, using the token the app sends (as ai-plan does);
//   - R2 is reached over its S3 API with signed requests. The secrets are R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
//     R2_SECRET_ACCESS_KEY (an Object Read & Write token limited to the backups bucket) and R2_BACKUP_BUCKET. They live
//     only in Supabase's secret store. Without all four, every request answers 503 "not-configured".
// Deploy: npx supabase functions deploy backup --use-api --project-ref <ref> (see specs/automatic-backups.md §6).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { AwsClient } from 'npm:aws4fetch@1.0.20';
import { handle, type Store, type StoredObject } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const publicKey = Deno.env.get('MYDAY_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
const asUser = (token: string) => createClient(url, publicKey, {
  global: { headers: { Authorization: `Bearer ${token}` } },
  auth: { persistSession: false, autoRefreshToken: false },
});

function r2(): Store | null {
  const account = Deno.env.get('R2_ACCOUNT_ID'), id = Deno.env.get('R2_ACCESS_KEY_ID'), secret = Deno.env.get('R2_SECRET_ACCESS_KEY'), bucket = Deno.env.get('R2_BACKUP_BUCKET');
  if (!account || !id || !secret || !bucket) return null;
  const aws = new AwsClient({ accessKeyId: id, secretAccessKey: secret, service: 's3', region: 'auto' });
  const base = `https://${account}.r2.cloudflarestorage.com/${encodeURIComponent(bucket)}`;
  const at = (key: string) => `${base}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const ok = async (res: Response) => { if (!res.ok) throw new Error(`r2 ${res.status}`); return res; };
  const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? '';
  const unxml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  return {
    async put(key, body, meta) {
      const headers: Record<string, string> = { 'Content-Type': key.endsWith('.gz') ? 'application/gzip' : 'application/json' };
      for (const [k, v] of Object.entries(meta)) headers[`x-amz-meta-${k}`] = encodeURIComponent(v);
      await ok(await aws.fetch(at(key), { method: 'PUT', body: body as Uint8Array<ArrayBuffer>, headers }));
    },
    async list(prefix) {
      const out: StoredObject[] = [];
      let token = '';
      do {
        const q = new URLSearchParams({ 'list-type': '2', prefix, ...(token ? { 'continuation-token': token } : {}) });
        const xml = await (await ok(await aws.fetch(`${base}?${q}`))).text();
        for (const c of xml.match(/<Contents>[\s\S]*?<\/Contents>/g) ?? []) out.push({ key: unxml(tag(c, 'Key')), size: Number(tag(c, 'Size')) || 0, modified: tag(c, 'LastModified') });
        token = tag(xml, 'IsTruncated') === 'true' ? unxml(tag(xml, 'NextContinuationToken')) : '';
      } while (token);
      return out;
    },
    async get(key) {
      const res = await aws.fetch(at(key));
      if (res.status === 404) return null;
      return new Uint8Array(await (await ok(res)).arrayBuffer());
    },
    async remove(key) {
      const res = await aws.fetch(at(key), { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error(`r2 ${res.status}`);
    },
  };
}

Deno.serve(req => handle(req, {
  env: name => Deno.env.get(name),
  verifyUser: async token => {
    const { data, error } = await asUser(token).auth.getUser(token);
    return error || !data.user ? null : data.user.id;
  },
  // The account's wipe epoch (Delete everything), read as the user; before that migration there's none (0).
  epochOf: async (token, user) => {
    const { data, error } = await asUser(token).rpc('sync_state', { account: user });
    if (error) { if (error.code === 'PGRST202' || /Could not find the function/i.test(error.message)) return 0; throw new Error('state'); }
    return Number((data as { epoch?: unknown } | null)?.epoch) || 0;
  },
  store: r2(),
  log: line => console.log(line),
}));
