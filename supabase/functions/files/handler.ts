// The "files" Edge Function's logic (specs/files.md), without Supabase or R2 so it can be tested as it is: index.ts
// connects the real sign-in check, R2 and its link signing. Every key starts with the user id the sign-in check gives
// (<user>/<area>/<fileId>, and ".thumb" for a photo's preview), never one from the request. All actions are POST
// with a JSON body { action, … }:
//   upload  { fileId, area, name, size, md5 }  → a link to PUT that one file, valid 5 minutes, with its length, MD5,
//                                                type and disposition signed in (R2 refuses anything else)
//   confirm { fileId, area, name }             → checks what was stored (size, type by its first bytes); kept, or
//                                                deleted with the reason
//   thumb   { fileId, area, size, md5 }        → a link to PUT a photo's preview (a small WebP)
//   open    { fileId, area, thumb? }           → a link to GET it (or its preview), valid 5 minutes
//   delete  { files: [{ fileId, area }], knows? } → removes them (and their previews), at most 100 at a time; only
//                                                areas the caller says it knows (`knows`, default project and note),
//                                                so an older MyDay can never delete a newer area's file
//   delete-all                                 → every file of the account (for the true wipe)
//   usage                                      → the account's total, against its limit
//   stored                                     → the account's stored files (id, area, size, when), for finding
//                                                any that nothing in MyDay lists any more (specs/files.md)
// A file over 64 MB (a Content project's video, specs/projects-content.md) goes up in parts instead of `upload`:
//   mp-begin { fileId, area, name, size }      → the same checks as upload; starts R2's multipart upload: its
//                                                uploadId, the part size and how many parts
//   mp-parts { fileId, area, uploadId, size, parts: [{ n, md5 }] } → links to PUT up to 50 parts, valid an hour, each
//                                                with its length and MD5 signed in
//   mp-list  { fileId, area, uploadId }        → the parts R2 already has (number, ETag, size), to carry on
//   mp-done  { fileId, area, uploadId, name, parts: [{ n, etag }] } → completes it, then the confirm check and the
//                                                account's total again (anything wrong: deleted, with the reason)
//   mp-abort { fileId, area, uploadId }        → drops what was sent
// A video opens with a link valid 6 hours (it streams while you watch).
// The logs hold the action, the outcome and the time only: never names, keys, ids or links.
import { ACCOUNT_TOTAL_BYTES, amountLabel, AREA_RULES, disposition, HAS_PREVIEW, isArea, looksLike, MAX_PARTS, PART_BYTES, refusal, SINGLE_PUT_MAX, THUMB_MAX_BYTES, typeOfName, VIDEOS } from '../_shared/files/rules.ts';

export interface StoredObject { key: string; size: number; modified?: string } // modified: when it was stored (ISO), where the store says
export interface Store {
  head(key: string): Promise<{ size: number; type: string } | null>;
  firstBytes(key: string, n: number): Promise<Uint8Array>;
  list(prefix: string): Promise<StoredObject[]>;
  remove(key: string): Promise<void>;
  // A short-lived link for one object and one operation, with these headers (and query, e.g. a part's) signed in.
  sign(method: 'PUT' | 'GET', key: string, headers: Record<string, string>, seconds: number, query?: Record<string, string>): Promise<string>;
  // R2's multipart upload (specs/projects-content.md): start one (its id), the parts it has (null: no such upload),
  // complete it from its parts in order, or drop it.
  mpCreate(key: string, headers: Record<string, string>): Promise<string>;
  mpParts(key: string, uploadId: string): Promise<{ n: number; etag: string; size: number }[] | null>;
  mpComplete(key: string, uploadId: string, parts: { n: number; etag: string }[]): Promise<void>;
  mpAbort(key: string, uploadId: string): Promise<void>;
}
export interface Deps {
  env: (name: string) => string | undefined;
  verifyUser: (token: string) => Promise<string | null>;
  store: Store | null;          // null: not set up (the R2 secrets are missing)
  // The account's wipe epoch (Delete everything, specs/delete-everything.md); absent: never wiped.
  epochOf?: (token: string, user: string) => Promise<number>;
  // The ids of the account's file records still in sync (not deleted), read as the user: a stored file one of them
  // names is never offered as "nothing lists it". Absent: none known (the app's own check still applies).
  liveFileIds?: (token: string, user: string) => Promise<Set<string>>;
  log?: (line: string) => void;
}

const LINK_SECONDS = 300, PART_LINK_SECONDS = 3600, VIDEO_LINK_SECONDS = 6 * 3600;
const UPLOAD_ID = /^[A-Za-z0-9+/=._~-]{8,1024}$/, ETAG = /^"?[A-Za-z0-9-]{1,80}"?$/;
const DEFAULT_ORIGINS = 'https://omar12ahmed.github.io,http://localhost:5173,http://127.0.0.1:5500';
const FILE_ID = /^fl[a-z0-9]{6,40}$/, MD5 = /^[A-Za-z0-9+/]{22}==$/;

function cors(req: Request, env: Deps['env']): Record<string, string> {
  const origin = req.headers.get('Origin');
  const allowed = (env('FILES_ALLOWED_ORIGINS') || DEFAULT_ORIGINS).split(',').map(s => s.trim()).filter(Boolean);
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-myday-epoch',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
  if (origin && allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

// Too big for what's left: say how much is left (rounded down) and how big the file is ('' when it fits). Files in
// Recently deleted are still stored, so making room means Delete now there too.
function roomFor(total: number, used: number, size: number): string {
  if (used + size <= total) return '';
  const left = total - used, of = amountLabel(total);
  return `${left > 0 ? `There’s ${amountLabel(left, Math.floor)} left of ${of}` : `Your ${of} is full`}, and this file is ${amountLabel(size)}. To make room, remove files you don’t need, then use Delete now in Recently deleted.`;
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
  if (Number(req.headers.get('Content-Length')) > 64 * 1024) return done(json(413, { error: 'too-large' }));
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
  // After Delete everything, only a MyDay that knows the account's wipe may add files (an older copy can't).
  const wiped = async () => { const epoch = d.epochOf ? await d.epochOf(token, user) : 0; return epoch > 0 && req.headers.get('x-myday-epoch') !== String(epoch); };
  try {
    switch (action) {
      case 'upload': {
        if (await wiped()) return done(json(409, { error: 'wiped' }));
        const key = keyOf(body.area, body.fileId), name = typeof body.name === 'string' ? body.name : '', size = body.size as number, md5 = body.md5;
        if (!key || typeof md5 !== 'string' || !MD5.test(md5)) return done(json(400, { error: 'bad-request' }));
        const why = refusal(body.area as string, name, size);
        if (why) return done(json(422, { error: 'not-allowed', message: why }));
        if (size > SINGLE_PUT_MAX) return done(json(400, { error: 'bad-request' })); // (in parts: mp-begin)
        const objs = await all(), rule = AREA_RULES[body.area as string];
        if (objs.some(o => o.key === key)) return done(json(409, { error: 'exists' }));
        const full = roomFor(ACCOUNT_TOTAL_BYTES, sizeOf(objs), size) || (rule.totalBytes ? roomFor(rule.totalBytes, sizeOf(objs, body.area as string), size) : '');
        if (full) return done(json(422, { error: 'full', message: full }));
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
        if (await wiped()) return done(json(409, { error: 'wiped' }));
        const key = keyOf(body.area, body.fileId), size = body.size as number, md5 = body.md5;
        if (!key || typeof md5 !== 'string' || !MD5.test(md5) || !Number.isInteger(size) || size < 1 || size > THUMB_MAX_BYTES) return done(json(400, { error: 'bad-request' }));
        const stored = await store.head(key);
        if (!stored) return done(json(404, { error: 'not-found' }));
        if (!HAS_PREVIEW.includes(stored.type)) return done(json(422, { error: 'not-allowed', message: 'Only photos and videos have previews.' }));
        const url = await store.sign('PUT', `${key}.thumb`, { 'Content-Length': String(size), 'Content-MD5': md5, 'Content-Type': 'image/webp', 'Content-Disposition': 'inline' }, LINK_SECONDS);
        return done(json(200, { ok: true, url, headers: { 'Content-MD5': md5, 'Content-Type': 'image/webp', 'Content-Disposition': 'inline' }, seconds: LINK_SECONDS }));
      }
      case 'open': {
        const key = keyOf(body.area, body.fileId);
        if (!key) return done(json(400, { error: 'bad-request' }));
        const target = body.thumb === true ? `${key}.thumb` : key, stored = await store.head(target);
        if (!stored) return done(json(404, { error: 'not-found' }));
        const seconds = body.thumb !== true && VIDEOS.includes(stored.type) ? VIDEO_LINK_SECONDS : LINK_SECONDS; // (a video streams while you watch)
        return done(json(200, { ok: true, url: await store.sign('GET', target, {}, seconds), seconds }));
      }
      case 'delete': {
        const list = Array.isArray(body.files) ? body.files : [];
        if (list.length > 100) return done(json(400, { error: 'bad-request' }));
        // An older MyDay doesn't know a newer area's places, so it can't tell whether such a file is still listed: it
        // may delete only the areas it says it knows (none said: project and note, the areas of 1.68.0).
        const knows = Array.isArray(body.knows) ? body.knows.filter((a): a is string => typeof a === 'string') : ['project', 'note'];
        const areaOf = (f: unknown) => (f && typeof f === 'object' ? (f as Record<string, unknown>).area : undefined);
        if (list.some(f => isArea(areaOf(f)) && !knows.includes(areaOf(f) as string))) return done(json(409, { error: 'unknown-area' }));
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
      case 'stored': {
        // Ids and sizes only (never names, which aren't stored here anyway); previews are counted with their file. A
        // file the account's records still name (in sync, even if this device hasn't pulled it yet) is left out, and
        // the time is the server's, so a device with a wrong clock can't make a fresh upload look old.
        const named = d.liveFileIds ? await d.liveFileIds(token, user) : new Set<string>();
        const files = (await all()).flatMap(o => {
          const parts = o.key.slice(user.length).split('/'), [, area, id] = parts;
          return parts.length === 3 && !o.key.endsWith('.thumb') && isArea(area) && FILE_ID.test(id ?? '') && !named.has(id) ? [{ fileId: id, area, size: o.size, modified: o.modified ?? null }] : [];
        });
        return done(json(200, { ok: true, files, now: new Date().toISOString() }));
      }
      // ---------- In parts (specs/projects-content.md) ----------
      case 'mp-begin': {
        if (await wiped()) return done(json(409, { error: 'wiped' }));
        const key = keyOf(body.area, body.fileId), name = typeof body.name === 'string' ? body.name : '', size = body.size as number;
        if (!key) return done(json(400, { error: 'bad-request' }));
        const why = refusal(body.area as string, name, size);
        if (why) return done(json(422, { error: 'not-allowed', message: why }));
        const count = Math.ceil(size / PART_BYTES);
        if (size <= SINGLE_PUT_MAX || count > MAX_PARTS) return done(json(400, { error: 'bad-request' }));
        const objs = await all(), rule = AREA_RULES[body.area as string];
        if (objs.some(o => o.key === key)) return done(json(409, { error: 'exists' }));
        const full = roomFor(ACCOUNT_TOTAL_BYTES, sizeOf(objs), size) || (rule.totalBytes ? roomFor(rule.totalBytes, sizeOf(objs, body.area as string), size) : '');
        if (full) return done(json(422, { error: 'full', message: full }));
        const type = typeOfName(name)!;
        const uploadId = await store.mpCreate(key, { 'Content-Type': type, 'Content-Disposition': disposition(name, type) });
        return done(json(200, { ok: true, uploadId, partBytes: PART_BYTES, parts: count }));
      }
      case 'mp-parts': {
        if (await wiped()) return done(json(409, { error: 'wiped' }));
        const key = keyOf(body.area, body.fileId), uploadId = body.uploadId, size = body.size as number, parts = Array.isArray(body.parts) ? body.parts : [];
        const rule = isArea(body.area) ? AREA_RULES[body.area] : null;
        if (!key || !rule || typeof uploadId !== 'string' || !UPLOAD_ID.test(uploadId) || !Number.isInteger(size) || size <= SINGLE_PUT_MAX || size > rule.maxBytes || !parts.length || parts.length > 50) return done(json(400, { error: 'bad-request' }));
        const count = Math.ceil(size / PART_BYTES), out: { n: number; url: string; headers: Record<string, string> }[] = [];
        for (const p of parts) {
          const n = (p as Record<string, unknown>)?.n, md5 = (p as Record<string, unknown>)?.md5;
          if (!Number.isInteger(n) || (n as number) < 1 || (n as number) > count || typeof md5 !== 'string' || !MD5.test(md5)) return done(json(400, { error: 'bad-request' }));
          const length = (n as number) < count ? PART_BYTES : size - (count - 1) * PART_BYTES;
          const url = await store.sign('PUT', key, { 'Content-Length': String(length), 'Content-MD5': md5 }, PART_LINK_SECONDS, { partNumber: String(n), uploadId });
          out.push({ n: n as number, url, headers: { 'Content-MD5': md5 } });
        }
        return done(json(200, { ok: true, parts: out, seconds: PART_LINK_SECONDS }));
      }
      case 'mp-list': {
        const key = keyOf(body.area, body.fileId), uploadId = body.uploadId;
        if (!key || typeof uploadId !== 'string' || !UPLOAD_ID.test(uploadId)) return done(json(400, { error: 'bad-request' }));
        const parts = await store.mpParts(key, uploadId);
        if (!parts) return done(json(404, { error: 'not-found' }));
        return done(json(200, { ok: true, parts }));
      }
      case 'mp-done': {
        if (await wiped()) return done(json(409, { error: 'wiped' }));
        const key = keyOf(body.area, body.fileId), uploadId = body.uploadId, name = typeof body.name === 'string' ? body.name : '', parts = Array.isArray(body.parts) ? body.parts : [];
        if (!key || typeof uploadId !== 'string' || !UPLOAD_ID.test(uploadId) || !parts.length || parts.length > MAX_PARTS) return done(json(400, { error: 'bad-request' }));
        const list = parts.map(p => ({ n: (p as Record<string, unknown>)?.n, etag: (p as Record<string, unknown>)?.etag }));
        if (list.some((p, i) => p.n !== i + 1 || typeof p.etag !== 'string' || !ETAG.test(p.etag))) return done(json(400, { error: 'bad-request' }));
        await store.mpComplete(key, uploadId, list as { n: number; etag: string }[]);
        // The same check as confirm, and the account's total again (two uploads at once could both have fitted).
        const stored = await store.head(key), type = typeOfName(name), rule = AREA_RULES[body.area as string];
        if (!stored) return done(json(404, { error: 'not-found' }));
        const ok = !!type && rule.types.includes(type) && stored.type === type && stored.size > SINGLE_PUT_MAX && stored.size <= rule.maxBytes && looksLike(type, await store.firstBytes(key, 32));
        if (!ok) { await store.remove(key); return done(json(422, { error: 'not-allowed', message: rule.summary })); }
        const objs = await all();
        if (sizeOf(objs) > ACCOUNT_TOTAL_BYTES) { await store.remove(key); return done(json(422, { error: 'full', message: roomFor(ACCOUNT_TOTAL_BYTES, sizeOf(objs) - stored.size, stored.size) })); }
        return done(json(200, { ok: true, size: stored.size }));
      }
      case 'mp-abort': {
        const key = keyOf(body.area, body.fileId), uploadId = body.uploadId;
        if (!key || typeof uploadId !== 'string' || !UPLOAD_ID.test(uploadId)) return done(json(400, { error: 'bad-request' }));
        await store.mpAbort(key, uploadId);
        return done(json(200, { ok: true }));
      }
      default: return done(json(400, { error: 'bad-request' }));
    }
  } catch {
    return done(json(502, { error: 'storage' }));
  }
}
