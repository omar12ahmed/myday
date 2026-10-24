// The "backup" Edge Function's logic (specs/automatic-backups.md), without Supabase or R2 so it can be tested as it is:
// index.ts connects the real sign-in check and the R2 bucket. Each signed-in account reaches only its own backups —
// every key starts with the user id the sign-in check gives, never one from the request.
//   PUT    ?day=YYYY-MM-DD&device=<id>   save this device's backup for that day (gzip, at most 10 MB; at most 10 devices
//                                       an account), then keep, for every device, only the newest 14 days plus the
//                                       earliest of each of the last 12 months
//   GET                                 list the account's backups
//   GET    (header x-myday-key: <key>)   one backup (gzip); the key goes in a header so it isn't in request addresses
//   DELETE                              every backup of the account
// The logs hold the action, the outcome and the time only: never keys, sizes or content.

export interface StoredObject { key: string; size: number; modified: string }
export interface Store {
  put(key: string, body: Uint8Array, meta: Record<string, string>): Promise<void>;
  list(prefix: string): Promise<StoredObject[]>;
  get(key: string): Promise<Uint8Array | null>;
  remove(key: string): Promise<void>;
}
export interface Deps {
  env: (name: string) => string | undefined;
  verifyUser: (token: string) => Promise<string | null>;
  store: Store | null;          // null: not set up (the R2 secrets are missing)
  now?: () => Date;
  log?: (line: string) => void;
}

export const MAX_BYTES = 10 * 1024 * 1024;
export const KEEP_DAYS = 14, KEEP_MONTHS = 12, MIN_SECONDS = 60, MAX_DEVICES = 10;
const DEFAULT_ORIGINS = 'https://omar12ahmed.github.io,http://localhost:5173,http://127.0.0.1:5500';
const DEVICE = /^[a-z0-9]{8,40}$/, DAY = /^\d{4}-\d{2}-\d{2}$/;

function cors(req: Request, env: Deps['env']): Record<string, string> {
  const origin = req.headers.get('Origin');
  const allowed = (env('BACKUP_ALLOWED_ORIGINS') || DEFAULT_ORIGINS).split(',').map(s => s.trim()).filter(Boolean);
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-myday-device-label, x-myday-version, x-myday-key',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
  if (origin && allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

// A real calendar day (not "2026-02-31").
export function isDay(s: string | null): s is string {
  if (!s || !DAY.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
const shiftDay = (day: string, n: number) => new Date(Date.parse(day + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const monthsBack = (day: string, n: number) => { const [y, m] = day.split('-').map(Number); const t = y * 12 + (m - 1) - n; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, '0')}`; };

// Which days to keep for one device: the newest 14, plus the earliest of each of the last 12 calendar months (counting
// the month of `today`) — and nothing from before those 12 months, so a device that stopped is cleared within a year.
export function daysToKeep(days: string[], today: string): Set<string> {
  const months = new Set(Array.from({ length: KEEP_MONTHS }, (_, i) => monthsBack(today, i)));
  const newest = [...new Set(days)].filter(d => months.has(d.slice(0, 7))).sort().reverse();
  const keep = new Set(newest.slice(0, KEEP_DAYS));
  const first = new Map<string, string>();
  for (const d of [...newest].reverse()) if (months.has(d.slice(0, 7)) && !first.has(d.slice(0, 7))) first.set(d.slice(0, 7), d);
  for (const d of first.values()) keep.add(d);
  return keep;
}

// A label for a device, as the app sends it: letters, digits, spaces and a little punctuation, at most 40 characters.
const cleanLabel = (s: string | null) => (s || '').normalize('NFC').replace(/[^\p{L}\p{N} ._()-]/gu, '').trim().slice(0, 40) || 'A device';

// Reads a body, stopping as soon as it's over the limit (Content-Length can't be trusted). Null when too large.
async function readCapped(req: Request): Promise<Uint8Array | null> {
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) { await reader.cancel().catch(() => {}); return null; }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}
// Removes keys a few at a time, side by side, so deleting a whole account's backups doesn't take one call after another.
async function removeAll(store: Store, keys: string[]) {
  for (let i = 0; i < keys.length; i += 8) await Promise.all(keys.slice(i, i + 8).map(k => store.remove(k)));
}

// Keys: <user>/<device>/<day>.json.gz, and <user>/<device>/device.json holding its label.
const parseKey = (user: string, key: string) => {
  const m = key.match(/^([^/]+)\/([a-z0-9]{8,40})\/(\d{4}-\d{2}-\d{2})\.json\.gz$/);
  return m && m[1] === user && isDay(m[3]) ? { device: m[2], day: m[3] } : null;
};

export async function handle(req: Request, d: Deps): Promise<Response> {
  const started = Date.now(), log = d.log ?? (() => {}), now = d.now ?? (() => new Date());
  const h = cors(req, d.env);
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...h, 'Content-Type': 'application/json' } });
  let action = req.method === 'PUT' ? 'save' : req.method === 'DELETE' ? 'delete-all' : 'list';
  const done = (r: Response) => { log(`backup ${action} ${r.status} ${Date.now() - started}ms`); return r; };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (!['GET', 'PUT', 'DELETE'].includes(req.method)) return done(json(405, { error: 'method' }));
  // Signed in first (a sign-in token, not the public key), so nobody else learns whether backups are set up.
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const looksLikeJwt = /^[\w-]+\.[\w-]+\.[\w-]+$/.test(token) && !/^sb_/.test(token);
  const user = looksLikeJwt ? await d.verifyUser(token).catch(() => null) : null;
  if (!user || !/^[0-9a-f-]{8,64}$/i.test(user)) return done(json(401, { error: 'signed-out' }));
  const store = d.store;
  if (!store) return done(json(503, { error: 'not-configured' }));
  const url = new URL(req.url), prefix = `${user}/`;
  try {
    if (req.method === 'GET' && req.headers.has('x-myday-key')) {
      action = 'get';
      const key = req.headers.get('x-myday-key') || '';
      if (!parseKey(user, key)) return done(json(404, { error: 'not-found' }));
      const body = await store.get(key);
      return done(body ? new Response(body as BodyInit, { status: 200, headers: { ...h, 'Content-Type': 'application/gzip' } }) : json(404, { error: 'not-found' }));
    }
    if (req.method === 'GET') {
      const all = await store.list(prefix);
      const labels = new Map<string, string>();
      for (const device of new Set(all.map(o => o.key.split('/')[1]))) {
        if (!DEVICE.test(device)) continue;
        const raw = await store.get(`${user}/${device}/device.json`).catch(() => null);
        try { labels.set(device, cleanLabel(raw ? JSON.parse(new TextDecoder().decode(raw)).label : null)); } catch { labels.set(device, 'A device'); }
      }
      const backups = all.flatMap(o => { const k = parseKey(user, o.key); return k ? [{ key: o.key, device: k.device, label: labels.get(k.device) ?? 'A device', day: k.day, size: o.size, at: o.modified }] : []; })
        .sort((a, b) => b.day.localeCompare(a.day) || b.at.localeCompare(a.at));
      return done(json(200, { ok: true, backups }));
    }
    if (req.method === 'DELETE') {
      const all = await store.list(prefix);
      await removeAll(store, all.map(o => o.key));
      return done(json(200, { ok: true, deleted: all.filter(o => parseKey(user, o.key)).length }));
    }
    // PUT: save.
    const day = url.searchParams.get('day'), device = url.searchParams.get('device') || '';
    const today = now().toISOString().slice(0, 10);
    if (!isDay(day) || day < shiftDay(today, -2) || day > shiftDay(today, 2) || !DEVICE.test(device)) return done(json(400, { error: 'bad-request' }));
    const declared = Number(req.headers.get('Content-Length') || '0');
    if (declared > MAX_BYTES) return done(json(413, { error: 'too-large' }));
    const body = await readCapped(req);
    if (!body) return done(json(413, { error: 'too-large' }));
    if (body.length < 18 || body[0] !== 0x1f || body[1] !== 0x8b) return done(json(400, { error: 'not-gzip' }));
    const devicePrefix = `${user}/${device}/`, key = `${devicePrefix}${day}.json.gz`;
    const existing = await store.list(prefix);
    const devices = new Set(existing.map(o => o.key.split('/')[1]).filter(x => DEVICE.test(x)));
    if (!devices.has(device) && devices.size >= MAX_DEVICES) return done(json(409, { error: 'too-many-devices' }));
    const same = existing.find(o => o.key === key);
    if (same && now().getTime() - Date.parse(same.modified) < MIN_SECONDS * 1000) return done(json(429, { error: 'too-fast' }));
    const label = cleanLabel(req.headers.get('x-myday-device-label'));
    await store.put(key, body, { label, version: (req.headers.get('x-myday-version') || '').slice(0, 40) });
    await store.put(`${devicePrefix}device.json`, new TextEncoder().encode(JSON.stringify({ label })), {});
    // For every device of the account (one that has stopped too): keep the newest 14 days and the earliest of each of
    // the last 12 months; delete the rest.
    const byDevice = new Map<string, { key: string; day: string }[]>();
    for (const o of existing) { const k = parseKey(user, o.key); if (k) byDevice.set(k.device, [...(byDevice.get(k.device) ?? []), { key: o.key, day: k.day }]); }
    byDevice.set(device, [...(byDevice.get(device) ?? []).filter(x => x.key !== key), { key, day }]);
    const drop: string[] = [];
    for (const [dev, list] of byDevice) {
      const keep = daysToKeep(list.map(x => x.day), today);
      for (const x of list) if (!keep.has(x.day)) drop.push(x.key);
      if (!list.some(x => keep.has(x.day))) drop.push(`${user}/${dev}/device.json`); // nothing left: its label goes too
    }
    await removeAll(store, drop);
    return done(json(200, { ok: true, key, day, removed: drop.length }));
  } catch {
    return done(json(502, { error: 'storage' }));
  }
}
