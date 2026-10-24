// The "files" Edge Function's logic (specs/files.md), without Supabase or R2 so it can be tested as it is: index.ts
// connects the real sign-in check, R2 and its link signing. Every key starts with the user id the sign-in check gives
// (<user>/<area>/<fileId>, and ".thumb" for a photo's preview), never one from the request. All actions are POST
// with a JSON body { action, … }:
//   upload  { fileId, area, name, size, md5 }  → a link to PUT that one file, valid 5 minutes, with its length, MD5,
//                                                type and disposition signed in (R2 refuses anything else)
//   confirm { fileId, area, name }             → checks what was stored (size, type by its first bytes); kept, or
//                                                deleted with the reason
//   thumb   { fileId, area, size, md5 }        → a link to PUT its preview (a small WebP)
//   open    { fileId, area, thumb? }           → a link to GET it (or its preview), valid 5 minutes
//   delete  { files: [{ fileId, area }] }      → removes them (and their previews)
//   delete-all                                 → every file of the account (for the true wipe)
//   usage                                      → the account's total, against its limit
// The logs hold the action, the outcome and the time only: never names, keys, ids or links.
import { ACCOUNT_TOTAL_BYTES, AREA_RULES, disposition, isArea, looksLike, refusal, THUMB_MAX_BYTES, typeOfName } from '../_shared/files/rules.ts';

export interface StoredObject { key: string; size: number }
export interface Store {
  head(key: string): Promise<{ size: number; type: string } | null>;
  firstBytes(key: string, n: number): Promise<Uint8Array>;
  list(prefix: string): Promise<StoredObject[]>;
  remove(key: string): Promise<void>;
  // A short-lived link for one object and one operation, with these headers signed in.
  sign(method: 'PUT' | 'GET', key: string, headers: Record<string, string>, seconds: number): Promise<string>;
}
export interface Deps {
  env: (name: string) => string | undefined;
  verifyUser: (token: string) => Promise<string | null>;
  store: Store | null;          // null: not set up (the R2 secrets are missing)
  log?: (line: string) => void;
}

const LINK_SECONDS = 300;
const DEFAULT_ORIGINS = 'https://omar12ahmed.github.io,http://localhost:5173,http://127.0.0.1:5500';
const FILE_ID = /^fl[a-z0-9]{6,40}$/, MD5 = /^[A-Za-z0-9+/]{22}==$/;

function cors(req: Request, env: Deps['env']): Record<string, string> {
  const origin = req.headers.get('Origin');
  const allowed = (env('FILES_ALLOWED_ORIGINS') || DEFAULT_ORIGINS).split(',').map(s => s.trim()).filter(Boolean);
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
  if (origin && allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

async function removeAll(store: Store, keys: string[]) {
  for (let i = 0; i < keys.length; i += 8) await Promise.all(keys.slice(i, i + 8).map(k => store.remove(k)));
}

export async function handle(req: Request, d: Deps): Promise<Response> {
  const started = Date.now(), log = d.log ?? (() => {});
  const h = cors(req, d.env);
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...h, 'Content-Type': 'application/json' } });
  let action = 'unknown';
  const done = (r: Response) => { log(`files ${action} ${r.status} ${Date.now() - started}ms`); return r; };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return done(json(405, { error: 'method' }));
  // Signed in first (a sign-in token, not the public key), so nobody else learns anything.
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const looksLikeJwt = /^[\w-]+\.[\w-]+\.[\w-]+$/.test(token) && !/^sb_/.test(token);
  const user = looksLikeJwt ? await d.verifyUser(token).catch(() => null) : null;
  if (!user || !/^[0-9a-f-]{8,64}$/i.test(user)) return done(json(401, { error: 'signed-out' }));
  const store = d.store;
  if (!store) return done(json(503, { error: 'not-configured' }));
  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > 64 * 1024) return done(json(413, { error: 'too-large' }));
    body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('shape');
  } catch { return done(json(400, { error: 'bad-request' })); }
  action = typeof body.action === 'string' && /^[a-z-]{2,12}$/.test(body.action) ? body.action : 'unknown';
  const keyOf = (area: unknown, fileId: unknown) => (isArea(area) && typeof fileId === 'string' && FILE_ID.test(fileId) ? `${user}/${area}/${fileId}` : null);
  const all = async () => (await store.list(`${user}/`)).filter(o => o.key.startsWith(`${user}/`));
  const sizeOf = (objs: StoredObject[], area?: string) => objs.filter(o => !o.key.endsWith('.thumb') && (!area || o.key.startsWith(`${user}/${area}/`))).reduce((n, o) => n + o.size, 0);
  try {
    switch (action) {
      case 'upload': {
        const key = keyOf(body.area, body.fileId), name = typeof body.name === 'string' ? body.name : '', size = body.size as number, md5 = body.md5;
        if (!key || typeof md5 !== 'string' || !MD5.test(md5)) return done(json(400, { error: 'bad-request' }));
        const why = refusal(body.area as string, name, size);
        if (why) return done(json(422, { error: 'not-allowed', message: why }));
        const objs = await all(), rule = AREA_RULES[body.area as string];
        if (objs.some(o => o.key === key)) return done(json(409, { error: 'exists' }));
        if (sizeOf(objs) + size > ACCOUNT_TOTAL_BYTES || (rule.totalBytes && sizeOf(objs, body.area as string) + size > rule.totalBytes)) return done(json(422, { error: 'full', message: 'Your files are full. Remove some to make room.' }));
        const type = typeOfName(name)!;
        const headers = { 'Content-Length': String(size), 'Content-MD5': md5, 'Content-Type': type, 'Content-Disposition': disposition(name, type) };
        const url = await store.sign('PUT', key, headers, LINK_SECONDS);
        return done(json(200, { ok: true, url, headers: { 'Content-MD5': md5, 'Content-Type': type, 'Content-Disposition': headers['Content-Disposition'] }, seconds: LINK_SECONDS }));
      }
      case 'confirm': {
        const key = keyOf(body.area, body.fileId), name = typeof body.name === 'string' ? body.name : '';
        if (!key) return done(json(400, { error: 'bad-request' }));
        const stored = await store.head(key);
        if (!stored) return done(json(404, { error: 'not-found' }));
        const type = typeOfName(name), rule = AREA_RULES[body.area as string];
        const ok = !!type && rule.types.includes(type) && stored.type === type && stored.size > 0 && stored.size <= rule.maxBytes
          && looksLike(type, await store.firstBytes(key, type.startsWith('text/') ? 1024 : 32));
        if (!ok) { await store.remove(key); return done(json(422, { error: 'not-allowed', message: rule.summary })); }
        return done(json(200, { ok: true, size: stored.size }));
      }
      case 'thumb': {
        const key = keyOf(body.area, body.fileId), size = body.size as number, md5 = body.md5;
        if (!key || typeof md5 !== 'string' || !MD5.test(md5) || !Number.isInteger(size) || size < 1 || size > THUMB_MAX_BYTES) return done(json(400, { error: 'bad-request' }));
        if (!(await store.head(key))) return done(json(404, { error: 'not-found' }));
        const url = await store.sign('PUT', `${key}.thumb`, { 'Content-Length': String(size), 'Content-MD5': md5, 'Content-Type': 'image/webp', 'Content-Disposition': 'inline' }, LINK_SECONDS);
        return done(json(200, { ok: true, url, headers: { 'Content-MD5': md5, 'Content-Type': 'image/webp', 'Content-Disposition': 'inline' }, seconds: LINK_SECONDS }));
      }
      case 'open': {
        const key = keyOf(body.area, body.fileId);
        if (!key) return done(json(400, { error: 'bad-request' }));
        const target = body.thumb === true ? `${key}.thumb` : key;
        if (!(await store.head(target))) return done(json(404, { error: 'not-found' }));
        return done(json(200, { ok: true, url: await store.sign('GET', target, {}, LINK_SECONDS), seconds: LINK_SECONDS }));
      }
      case 'delete': {
        const list = Array.isArray(body.files) ? body.files.slice(0, 100) : [];
        const keys = list.map(f => (f && typeof f === 'object' ? keyOf((f as Record<string, unknown>).area, (f as Record<string, unknown>).fileId) : null));
        if (!keys.length || keys.some(k => !k)) return done(json(400, { error: 'bad-request' }));
        await removeAll(store, (keys as string[]).flatMap(k => [k, `${k}.thumb`]));
        return done(json(200, { ok: true, deleted: keys.length }));
      }
      case 'delete-all': {
        const objs = await all();
        await removeAll(store, objs.map(o => o.key));
        return done(json(200, { ok: true, deleted: objs.filter(o => !o.key.endsWith('.thumb')).length }));
      }
      case 'usage': {
        const objs = await all();
        return done(json(200, { ok: true, bytes: sizeOf(objs), limit: ACCOUNT_TOTAL_BYTES }));
      }
      default: return done(json(400, { error: 'bad-request' }));
    }
  } catch {
    return done(json(502, { error: 'storage' }));
  }
}
