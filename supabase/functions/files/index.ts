// Supabase Edge Function "files" (Deno): attached files in Cloudflare R2 (specs/files.md). All the rules are in
// handler.ts; this file only connects it to Supabase and R2:
//   - the signed-in user is checked with Supabase Auth, using the token the app sends (as ai-plan and backup do);
//   - R2 is reached over its S3 API, and the short-lived links are presigned with aws4fetch (signQuery, with every
//     header signed, so R2 refuses an upload whose length, MD5, type or disposition differ). The secrets are
//     R2_ACCOUNT_ID, R2_FILES_ACCESS_KEY_ID, R2_FILES_SECRET_ACCESS_KEY (an Object Read & Write token limited to the
//     files bucket) and R2_FILES_BUCKET, in Supabase's secret store only. Without them every request answers 503.
// Deploy: npx supabase functions deploy files --use-api --project-ref <ref> (see specs/files.md §6).
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
  const account = Deno.env.get('R2_ACCOUNT_ID'), id = Deno.env.get('R2_FILES_ACCESS_KEY_ID'), secret = Deno.env.get('R2_FILES_SECRET_ACCESS_KEY'), bucket = Deno.env.get('R2_FILES_BUCKET');
  if (!account || !id || !secret || !bucket) return null;
  const aws = new AwsClient({ accessKeyId: id, secretAccessKey: secret, service: 's3', region: 'auto' });
  const base = `https://${account}.r2.cloudflarestorage.com/${encodeURIComponent(bucket)}`;
  const at = (key: string) => `${base}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const ok = async (res: Response) => { if (!res.ok) throw new Error(`r2 ${res.status}`); return res; };
  const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? '';
  const unxml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  return {
    // What's stored, from a one-byte read rather than HEAD: Cloudflare compresses text on the way out when the request
    // accepts it (Deno's fetch does), and then sends no length, so a text file would look empty. A ranged answer isn't
    // compressed and gives the whole size in Content-Range. An empty object can't be ranged (416): size 0.
    async head(key) {
      const res = await aws.fetch(at(key), { headers: { Range: 'bytes=0-0' } });
      const type = (res.headers.get('content-type') || '').split(';')[0].trim();
      if (res.status === 404 || res.status === 416) { await res.body?.cancel(); return res.status === 404 ? null : { size: 0, type }; }
      await ok(res);
      const total = Number(/\/(\d+)$/.exec(res.headers.get('content-range') || '')?.[1]);
      await res.body?.cancel();
      return { size: Number.isFinite(total) ? total : 0, type };
    },
    async firstBytes(key, n) {
      const res = await ok(await aws.fetch(at(key), { headers: { Range: `bytes=0-${n - 1}` } }));
      return new Uint8Array(await res.arrayBuffer()).slice(0, n);
    },
    async list(prefix) {
      const out: StoredObject[] = [];
      let token = '';
      do {
        const q = new URLSearchParams({ 'list-type': '2', prefix, ...(token ? { 'continuation-token': token } : {}) });
        const xml = await (await ok(await aws.fetch(`${base}?${q}`))).text();
        for (const c of xml.match(/<Contents>[\s\S]*?<\/Contents>/g) ?? []) out.push({ key: unxml(tag(c, 'Key')), size: Number(tag(c, 'Size')) || 0 });
        token = tag(xml, 'IsTruncated') === 'true' ? unxml(tag(xml, 'NextContinuationToken')) : '';
      } while (token);
      return out;
    },
    async remove(key) {
      const res = await aws.fetch(at(key), { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error(`r2 ${res.status}`);
    },
    async sign(method, key, headers, seconds) {
      const signed = await aws.sign(new Request(`${at(key)}?X-Amz-Expires=${seconds}`, { method, headers }), { aws: { signQuery: true, allHeaders: true } });
      return signed.url.toString();
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
