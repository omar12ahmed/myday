// Automatic backups, the server side (specs/automatic-backups.md): the backup Edge Function's real rules
// (supabase/functions/backup/handler.ts) with an in-memory store and a fixed clock, so no R2 and no Supabase is used;
// and the app's pure helpers (app/src/sync/backup.ts) on the app's own code bundled for Node. Made-up accounts only.
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  const H = await import(pathToFileURL(path.join(ROOT, 'supabase/functions/backup/handler.ts')).href);
  const A = 'aaaaaaaa-1111-4222-8333-aaaaaaaaaaaa', B = 'bbbbbbbb-2222-4333-9444-bbbbbbbbbbbb';
  const DEV1 = 'phonedevice1', DEV2 = 'macdevice002';
  let clock = new Date('2026-10-24T12:00:00Z');
  const memory = () => {
    const objects = new Map();
    return {
      objects,
      async put(key, body) { objects.set(key, { body: Buffer.from(body), modified: clock.toISOString() }); },
      async list(prefix) { return [...objects].filter(([k]) => k.startsWith(prefix)).map(([key, o]) => ({ key, size: o.body.length, modified: o.modified })); },
      async get(key) { const o = objects.get(key); return o ? new Uint8Array(o.body) : null; },
      async remove(key) { objects.delete(key); },
    };
  };
  let store = memory(), logs = [], origins;
  const gz = text => zlib.gzipSync(text);
  const tokens = { 'h.tok-a.s': A, 'h.tok-b.s': B, 'h.tok-odd.s': 'not a user id' }; // sign-in tokens look like a JWT: three parts
  const deps = (over = {}) => ({
    env: n => (n === 'BACKUP_ALLOWED_ORIGINS' ? origins : undefined),
    verifyUser: async t => { if (t === 'h.tok-throws.s') throw new Error('auth down'); return tokens[t] ?? null; },
    store, now: () => clock, log: l => logs.push(l), ...over,
  });
  const call = (method, query = '', { token = 'h.tok-a.s', body, headers = {}, over } = {}) =>
    H.handle(new Request('http://standin/functions/v1/backup' + query, { method, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, body }), deps(over));
  const put = (day, device = DEV1, body = gz('{"data":1}'), headers = {}, token = 'h.tok-a.s') => call('PUT', `?day=${day}&device=${device}`, { body, headers, token });
  const keysOf = prefix => [...store.objects.keys()].filter(k => k.startsWith(prefix)).sort();
  const body = async r => r.json();

  console.log('\n[1] Who may call, CORS and not being set up');
  let r = await call('OPTIONS', '', { headers: { Origin: 'https://omar12ahmed.github.io' }, token: null });
  check('OPTIONS answers 204 with the site origin allowed by default, and the methods and headers', r.status === 204 && r.headers.get('Access-Control-Allow-Origin') === 'https://omar12ahmed.github.io' && /PUT/.test(r.headers.get('Access-Control-Allow-Methods')) && /authorization/.test(r.headers.get('Access-Control-Allow-Headers')), [r.status, [...r.headers]]);
  r = await call('OPTIONS', '', { headers: { Origin: 'http://localhost:5173' }, token: null });
  check('…the local development origins too', r.headers.get('Access-Control-Allow-Origin') === 'http://localhost:5173');
  r = await call('OPTIONS', '', { headers: { Origin: 'https://evil.example' }, token: null });
  check('another origin gets no Allow-Origin header (and Vary: Origin)', r.status === 204 && !r.headers.has('Access-Control-Allow-Origin') && r.headers.get('Vary') === 'Origin');
  origins = 'https://a.example, https://b.example';
  r = await call('OPTIONS', '', { headers: { Origin: 'https://b.example' }, token: null });
  const r2 = await call('OPTIONS', '', { headers: { Origin: 'https://omar12ahmed.github.io' }, token: null });
  check('BACKUP_ALLOWED_ORIGINS replaces the default list (comma separated, spaces ignored)', r.headers.get('Access-Control-Allow-Origin') === 'https://b.example' && !r2.headers.has('Access-Control-Allow-Origin'));
  r = await call('GET', '', { headers: { Origin: 'https://a.example' } });
  check('real answers carry the allowed origin, and none for others', r.headers.get('Access-Control-Allow-Origin') === 'https://a.example' && !(await call('GET', '', { headers: { Origin: 'https://evil.example' } })).headers.has('Access-Control-Allow-Origin'));
  origins = undefined;
  check('other methods get 405', (await Promise.all(['POST', 'PATCH', 'HEAD'].map(m => call(m)))).every(x => x.status === 405) && (await body(await call('PATCH'))).error === 'method');
  r = await call('GET', '', { over: { store: null } });
  check('with no store (the R2 secrets missing) every action answers 503 "not-configured"', r.status === 503 && (await body(r)).error === 'not-configured' && (await call('PUT', `?day=2026-10-24&device=${DEV1}`, { body: gz('{}'), over: { store: null } })).status === 503 && (await call('DELETE', '', { over: { store: null } })).status === 503);
  check('a missing token, an unknown one, a failing sign-in check, a token that does not look like a JWT, and the public "sb_" key all answer 401 "signed-out"', (await Promise.all([call('GET', '', { token: null }), call('GET', '', { token: 'h.unknown.s' }), call('GET', '', { token: 'h.tok-throws.s' }), call('GET', '', { token: 'tok-a' }), call('GET', '', { token: 'sb_pub.lic.key' }), call('GET', '', { token: 'a.b.c.d' })])).every(x => x.status === 401));
  check('sign-in comes first: with no store, a signed-out caller still gets 401 (not 503, so nobody learns whether backups are set up)', (await call('GET', '', { token: null, over: { store: null } })).status === 401 && (await call('GET', '', { token: 'sb_pub.lic.key', over: { store: null } })).status === 401);
  r = await call('GET', '', { token: 'h.tok-odd.s' });
  check('a user id that is not uuid-like is refused (401), whatever the sign-in check said', r.status === 401);
  check('nothing is stored or listed for a refused caller', store.objects.size === 0);

  console.log('\n[2] Saving a backup');
  clock = new Date('2026-10-24T12:00:00Z');
  r = await put('2026-10-24', DEV1, gz('{"data":1}'), { 'x-myday-device-label': 'iPhone', 'x-myday-version': '1.62.0' });
  check('a backup is saved under <user>/<device>/<day>.json.gz', r.status === 200 && eq(keysOf(`${A}/`), [`${A}/${DEV1}/2026-10-24.json.gz`, `${A}/${DEV1}/device.json`]) && (await body(r)).key === `${A}/${DEV1}/2026-10-24.json.gz`, keysOf(''));
  check('device.json holds the device\'s label', JSON.parse(store.objects.get(`${A}/${DEV1}/device.json`).body.toString()).label === 'iPhone');
  await call('PUT', `?day=2026-10-24&device=${DEV2}`, { body: gz('{"x":1}'), headers: { 'x-myday-device-label': '  Ma<c>"; drop table ' + 'x'.repeat(60) } });
  const lab = JSON.parse(store.objects.get(`${A}/${DEV2}/device.json`).body.toString()).label;
  check('a label is cleaned: only letters, digits, spaces and a little punctuation, trimmed and at most 40 characters', /^Mac drop table x+$/.test(lab) && lab.length === 40, lab);
  await call('PUT', `?day=2026-10-24&device=somedevice01`, { body: gz('{}') });
  check('a missing label becomes "A device"', JSON.parse(store.objects.get(`${A}/somedevice01/device.json`).body.toString()).label === 'A device');
  const bads = [['a day that is not a calendar day', '2026-02-31', DEV1], ['a malformed day', '24-10-2026', DEV1], ['a day more than 2 days before the server\'s today', '2026-10-21', DEV1], ['a day more than 2 days after it', '2026-10-27', DEV1],
    ['a device id with "../"', '2026-10-24', '../x'], ['a device id that is too short', '2026-10-24', 'abc'], ['a device id in capitals', '2026-10-24', 'ABCDEFGH12'], ['a device id with a slash', '2026-10-24', 'abcdefgh/12']];
  for (const [why, day, dev] of bads) { const x = await put(day, dev); check(`refused with 400: ${why}`, x.status === 400 && (await body(x)).error === 'bad-request', x.status); }
  check('the days two before and two after today are accepted', (await put('2026-10-22', 'edgedevice01')).status === 200 && (await put('2026-10-26', 'edgedevice01')).status === 200);
  r = await put('2026-10-24', 'notgzipdevice', Buffer.from('{"plain":"json"}   padding padding'));
  check('a body that is not gzip is refused (400 "not-gzip")', r.status === 400 && (await body(r)).error === 'not-gzip');
  check('…and one too short to be gzip', (await put('2026-10-24', 'notgzipdevice', Buffer.from([0x1f, 0x8b, 1, 2]))).status === 400);
  check('nothing was stored for the refused ones', keysOf(`${A}/notgzipdevice`).length === 0 && keysOf(`${A}/abcdefgh`).length === 0);
  const big = Buffer.alloc(10 * 1024 * 1024 + 1, 1); big[0] = 0x1f; big[1] = 0x8b;
  r = await put('2026-10-24', 'bigdevice001', big);
  check('a body over 10 MB (by its real size) is refused with 413', r.status === 413 && (await body(r)).error === 'too-large');
  r = await H.handle({ method: 'PUT', url: `http://standin/functions/v1/backup?day=2026-10-24&device=bigdevice002`, headers: new Headers({ Authorization: 'Bearer h.tok-a.s', 'Content-Length': String(10 * 1024 * 1024 + 1) }), arrayBuffer: async () => { throw new Error('should not read the body'); } }, deps());
  check('…and one that declares over 10 MB in Content-Length is refused without reading the body', r.status === 413);
  check('exactly 10 MB is accepted', (await put('2026-10-24', 'tenmbdevice1', (() => { const b = Buffer.alloc(10 * 1024 * 1024, 2); b[0] = 0x1f; b[1] = 0x8b; return b; })())).status === 200);

  console.log('\n[3] The 60-second rule');
  clock = new Date('2026-10-24T12:00:00Z'); store = memory();
  check('the first save of a day works', (await put('2026-10-24')).status === 200);
  clock = new Date('2026-10-24T12:00:30Z');
  r = await put('2026-10-24');
  check('a second save of the same day and device within 60 seconds answers 429 "too-fast", and changes nothing', r.status === 429 && (await body(r)).error === 'too-fast' && store.objects.get(`${A}/${DEV1}/2026-10-24.json.gz`).body.equals(gz('{"data":1}')));
  check('another device or another day is not held back', (await put('2026-10-24', DEV2)).status === 200 && (await put('2026-10-25')).status === 200);
  clock = new Date('2026-10-24T12:01:01Z');
  r = await put('2026-10-24', DEV1, gz('{"data":"newer"}'));
  check('after 60 seconds the same day is replaced', r.status === 200 && store.objects.get(`${A}/${DEV1}/2026-10-24.json.gz`).body.equals(gz('{"data":"newer"}')));

  console.log('\n[4] Keeping 14 days, plus one a month for 12 months');
  const D = H.daysToKeep;
  const run = (from, n) => Array.from({ length: n }, (_, i) => new Date(Date.parse(from + 'T00:00:00Z') + i * 86400000).toISOString().slice(0, 10));
  const sixty = run('2026-08-26', 60);
  const k60 = [...D(sixty, '2026-10-24')].sort();
  check('60 daily backups over three months keep the newest 14 and the first day of each month: 17 in all', k60.length === 17 && k60.includes('2026-10-24') && k60.includes('2026-10-11') && !k60.includes('2026-10-10') && k60.includes('2026-10-01') && k60.includes('2026-09-01') && k60.includes('2026-08-26') && !k60.includes('2026-09-02'), k60);
  const yearEnd = [...run('2027-01-01', 15), '2026-12-20', '2026-12-05', '2026-02-20', '2026-02-10', '2026-01-30', '2026-01-05', '2025-12-31'];
  const kYear = [...D(yearEnd, '2027-01-15')].sort();
  check('across a year end: the newest 14, the earliest of January, December and February (the 12th month back), and nothing from before the last 12 months', eq(kYear, [...run('2027-01-01', 15), '2026-02-10', '2026-12-05'].sort()) , kYear);
  check('nothing from before the last 12 calendar months is kept, not even among the newest 14', D(['2024-05-01', '2024-05-02'], '2026-10-24').size === 0 && !D([...run('2026-10-01', 14), '2025-09-15'], '2026-10-24').has('2025-09-15') && D(['2025-11-30', '2025-11-02'], '2026-10-24').size === 2 && D(['2025-10-31'], '2026-10-24').size === 0);
  check('the earliest of a month is kept even when that month has many days, and only that one', (() => { const k = D([...run('2026-03-01', 31), ...run('2026-10-11', 14)], '2026-10-24'); return k.has('2026-03-01') && !k.has('2026-03-02') && k.size === 15; })());
  check('duplicates and an empty list are fine', D([], '2026-10-24').size === 0 && D(['2026-10-24', '2026-10-24'], '2026-10-24').size === 1);
  // Through the function: 60 daily saves, each on its own day.
  store = memory();
  for (const day of sixty) { clock = new Date(day + 'T20:00:00Z'); const x = await put(day); if (x.status !== 200) throw new Error('save ' + day + ' ' + x.status); }
  const left = keysOf(`${A}/${DEV1}/`).filter(k => k.endsWith('.json.gz')).map(k => k.slice(-18, -8));
  check('after 60 daily saves exactly the expected set is left: 17 backups (and device.json)', eq(left, k60) && keysOf(`${A}/${DEV1}/`).length === 18, left);
  check('a save that pushes the oldest of the newest 14 out says one was removed', (await body(await put('2026-10-25', DEV1, gz('{}'), {}, 'h.tok-a.s'))).removed === 1 && !keysOf(`${A}/${DEV1}/`).some(k => k.includes('2026-10-11')));
  // Every device of the account is tidied on each save; other accounts are never touched.
  store = memory(); clock = new Date('2026-10-24T12:00:00Z');
  for (const day of run('2026-09-01', 24)) store.objects.set(`${A}/${DEV2}/${day}.json.gz`, { body: gz('{}'), modified: '2026-10-01T00:00:00Z' });
  store.objects.set(`${A}/${DEV2}/device.json`, { body: Buffer.from('{"label":"Mac"}'), modified: '2026-10-01T00:00:00Z' });
  for (const day of ['2025-01-01', '2025-01-02']) store.objects.set(`${A}/stoppeddev01/${day}.json.gz`, { body: gz('{}'), modified: '2025-01-02T00:00:00Z' });
  store.objects.set(`${A}/stoppeddev01/device.json`, { body: Buffer.from('{"label":"Old"}'), modified: '2025-01-02T00:00:00Z' });
  for (const day of run('2026-09-01', 24)) store.objects.set(`${B}/${DEV1}/${day}.json.gz`, { body: gz('{}'), modified: '2026-10-01T00:00:00Z' });
  for (const day of run('2026-10-01', 22)) { clock = new Date(day + 'T12:00:00Z'); await put(day, DEV1); }
  const dev2 = keysOf(`${A}/${DEV2}/`).filter(k => k.endsWith('.json.gz')).map(k => k.slice(-18, -8));
  check('on each save every device of the account is tidied by the same rule: another device\'s 24 September days become the newest 14 plus the first of the month', dev2.length === 15 && dev2[0] === '2026-09-01' && dev2[1] === '2026-09-11' && keysOf(`${A}/${DEV2}/`).includes(`${A}/${DEV2}/device.json`), dev2);
  check('a device that stopped over a year ago is cleared, and its device.json goes with its last backup', keysOf(`${A}/stoppeddev01/`).length === 0, keysOf(`${A}/stoppeddev01/`));
  check('another account is never touched', keysOf(`${B}/${DEV1}/`).length === 24);
  check('the saving device keeps the expected set (the newest 14 and the first of October)', keysOf(`${A}/${DEV1}/`).filter(k => k.endsWith('.json.gz')).length === 15, keysOf(`${A}/${DEV1}/`).length);

  console.log('\n[4b] Ten devices at most, and a body that is too large without saying so');
  store = memory(); clock = new Date('2026-10-24T12:00:00Z');
  for (let i = 0; i < 10; i++) { const x = await put('2026-10-24', 'device' + String(i).padStart(4, '0')); if (x.status !== 200) throw new Error('device ' + i + ' ' + x.status); }
  r = await put('2026-10-24', 'device0011');
  check('an 11th new device answers 409 "too-many-devices" and stores nothing', r.status === 409 && (await body(r)).error === 'too-many-devices' && keysOf(`${A}/device0011`).length === 0);
  clock = new Date('2026-10-24T12:05:00Z');
  check('a device the account already has still saves, and another account has its own ten', (await put('2026-10-24', 'device0003')).status === 200 && (await put('2026-10-24', 'device0011', gz('{}'), {}, 'h.tok-b.s')).status === 200);
  const chunk = Buffer.alloc(1024 * 1024, 3); chunk[0] = 0x1f; chunk[1] = 0x8b;
  const stream = n => new ReadableStream({ pull(c) { if (n-- > 0) c.enqueue(new Uint8Array(chunk)); else c.close(); } });
  const streamed = n => H.handle(new Request(`http://standin/functions/v1/backup?day=2026-10-24&device=device0005`, { method: 'PUT', headers: { Authorization: 'Bearer h.tok-a.s' }, body: stream(n), duplex: 'half' }), deps());
  clock = new Date('2026-10-24T12:10:00Z');
  r = await streamed(11);
  check('a streamed body over 10 MB with no Content-Length is refused (413) as soon as it is too large', r.status === 413 && keysOf(`${A}/device0005/`).filter(k => k.includes('2026-10-24')).length === 1);
  check('…and a streamed body of exactly 10 MB is accepted', (await streamed(10)).status === 200);

  console.log('\n[5] Listing, downloading and deleting');
  store = memory(); clock = new Date('2026-10-24T12:00:00Z');
  await put('2026-10-23', DEV1, gz('{"n":"A1"}'), { 'x-myday-device-label': 'iPhone' });
  await put('2026-10-24', DEV1, gz('{"n":"A2"}'), { 'x-myday-device-label': 'iPhone' });
  await put('2026-10-24', DEV2, gz('{"n":"A3"}'), { 'x-myday-device-label': 'Mac' });
  await put('2026-10-24', DEV1, gz('{"n":"B1"}'), { 'x-myday-device-label': 'Windows' }, 'h.tok-b.s');
  store.objects.set(`${A}/${DEV1}/readme.txt`, { body: Buffer.from('x'), modified: clock.toISOString() });
  store.objects.set(`${A}/dev/2026-10-01.json.gz`, { body: gz('{}'), modified: clock.toISOString() });
  store.objects.set(`${A}/${DEV1}/2026-13-01.json.gz`, { body: gz('{}'), modified: clock.toISOString() });
  store.objects.set(`${A}/${DEV1}/nested/2026-10-01.json.gz`, { body: gz('{}'), modified: clock.toISOString() });
  r = await call('GET'); const list = (await body(r)).backups;
  check('the list is this account\'s backups only, newest day first, each with its device\'s label', r.status === 200 && list.length === 3 && eq(list.map(b => b.day), ['2026-10-24', '2026-10-24', '2026-10-23']) && eq(list.map(b => b.label).sort(), ['Mac', 'iPhone', 'iPhone']), list);
  check('…with a key, device, size in bytes and a time', list.every(b => b.key.startsWith(A + '/') && /^[a-z0-9]{8,40}$/.test(b.device) && b.size > 18 && !Number.isNaN(Date.parse(b.at))) && list.find(b => b.device === DEV2).label === 'Mac', list[0]);
  check('device.json and odd keys (a short device id, a bad day, a nested path, a stray file) are not listed', list.every(b => /\/\d{4}-\d{2}-\d{2}\.json\.gz$/.test(b.key)) && !list.some(b => /readme|nested|2026-13|\/dev\//.test(b.key)));
  check('another account sees only its own', eq((await body(await call('GET', '', { token: 'h.tok-b.s' }))).backups.map(b => b.label), ['Windows']));
  const own = list.find(b => b.day === '2026-10-23');
  r = await call('GET', '', { headers: { 'x-myday-key': own.key } });
  check('a backup of your own comes back as its gzip bytes', r.status === 200 && r.headers.get('Content-Type') === 'application/gzip' && Buffer.from(await r.arrayBuffer()).equals(gz('{"n":"A1"}')));
  const theirs = (await body(await call('GET', '', { token: 'h.tok-b.s' }))).backups[0].key;
  check('another account\'s key answers 404 (and says nothing about whether it exists)', (await call('GET', '', { headers: { 'x-myday-key': theirs } })).status === 404);
  check('a key in the address (?key=) is ignored: it is just the list', await (async () => { const x = await call('GET', '?key=' + encodeURIComponent(own.key)); return x.status === 200 && Array.isArray((await body(x)).backups); })());
  const trav = [`${A}/../${B}/${DEV1}/2026-10-24.json.gz`, `${A}%2F..%2F${B}%2F${DEV1}%2F2026-10-24.json.gz`, `${B}/${DEV1}/2026-10-24.json.gz`, `../${B}/${DEV1}/2026-10-24.json.gz`, `${A}/${DEV1}/../../${B}/${DEV1}/2026-10-24.json.gz`, ''];
  const travResults = []; for (const k of trav) travResults.push((await call('GET', '', { headers: { 'x-myday-key': k } })).status);
  check('traversal, encoded slashes, another account\'s key and an empty key all answer 404', travResults.every(s => s === 404), travResults);
  check('device.json cannot be fetched, nor a key that does not exist', (await call('GET', '', { headers: { 'x-myday-key': `${A}/${DEV1}/device.json` } })).status === 404 && (await call('GET', '', { headers: { 'x-myday-key': `${A}/${DEV1}/2026-01-01.json.gz` } })).status === 404);
  check('a key without a token is refused (401)', (await call('GET', '', { headers: { 'x-myday-key': own.key }, token: null })).status === 401);
  r = await call('DELETE');
  const del = await body(r);
  check('Delete all removes every object of this account (device.json and strays too) and counts the backups only', r.status === 200 && del.deleted === 3 && keysOf(`${A}/`).length === 0, [del, keysOf(`${A}/`)]);
  check('…and none of another account\'s', keysOf(`${B}/`).length === 2);
  check('deleting again deletes 0, and a signed-out caller deletes nothing', (await body(await call('DELETE'))).deleted === 0 && (await call('DELETE', '', { token: null })).status === 401 && keysOf(`${B}/`).length === 2);

  console.log('\n[6] When the store fails, and what the logs hold');
  const boom = { async put() { throw new Error('r2 down'); }, async list() { throw new Error('r2 down https://secret.example/bucket'); }, async get() { throw new Error('x'); }, async remove() { throw new Error('x'); } };
  const failed = await Promise.all([call('GET', '', { over: { store: boom } }), call('DELETE', '', { over: { store: boom } }), put('2026-10-24', DEV1, gz('{}'), {}, 'h.tok-a.s').then(() => call('PUT', `?day=2026-10-24&device=${DEV1}`, { body: gz('{}'), over: { store: boom } })), call('GET', '', { headers: { 'x-myday-key': `${A}/${DEV1}/2026-10-24.json.gz` }, over: { store: boom } })]);
  const fb = await Promise.all(failed.map(x => x.text()));
  check('a store that throws answers 502 "storage" for list, save, delete and get, without its message', failed.every(x => x.status === 502) && fb.every(t => JSON.parse(t).error === 'storage' && !/r2 down|secret\.example/.test(t)), fb);
  logs = []; store = memory(); clock = new Date('2026-10-24T12:00:00Z');
  const secretLabel = 'MyPrivateLabel';
  await put('2026-10-24', DEV1, gz('{"secret":"SECRET-CONTENT"}'), { 'x-myday-device-label': secretLabel });
  await put('2026-10-24', DEV1); await call('GET'); await call('GET', '', { headers: { 'x-myday-key': `${A}/${DEV1}/2026-10-24.json.gz` } }); await call('GET', '', { headers: { 'x-myday-key': 'x' } }); await call('DELETE'); await call('GET', '', { token: null }); await call('POST'); await call('GET', '', { over: { store: null } }); await call('GET', '', { over: { store: boom } });
  check('every log line is "backup <action> <status> <n>ms"', logs.length >= 9 && logs.every(l => /^backup [a-z-]+ \d{3} \d+ms$/.test(l)), logs.filter(l => !/^backup [a-z-]+ \d{3} \d+ms$/.test(l)));
  check('…and holds no user id, device id, key, label or content', logs.every(l => !l.includes(A) && !l.includes(DEV1) && !l.includes(secretLabel) && !/SECRET|json\.gz|2026-10/.test(l)));
  check('the actions logged are save, list, get and delete-all, with their outcomes', ['backup save 200', 'backup save 429', 'backup list 200', 'backup get 200', 'backup get 404', 'backup delete-all 200', 'backup list 401', 'backup list 405', 'backup list 503', 'backup list 502'].every(p => logs.some(l => l.startsWith(p))), logs);

  console.log('\n[7] The app\'s helpers (app/src/sync/backup.ts)');
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const dir = path.join(os.tmpdir(), `myday-backup-rules-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'kit.ts'), `export { deviceLabel, backupDue } from ${JSON.stringify(path.join(ROOT, 'app/src/sync/backup'))};`);
  let Kit = null;
  globalThis.__APP_VERSION__ = '0.0.0-test'; globalThis.__APP_COMMIT__ = 'test'; globalThis.__APP_BUILT__ = '2026-10-24'; // the app's build-time constants (Vite defines them)
  try { Kit = await import(pathToFileURL(await bundle(path.join(dir, 'kit.ts'), path.join(dir, 'out'))).href); } catch (e) { console.log('  (bundle failed: ' + String(e.message).slice(0, 200) + ')'); }
  check('the app\'s backup helpers can be bundled for Node', !!Kit);
  if (Kit) {
    const UA = { iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', ipad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15', android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
      windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36', cros: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 Chrome/120' };
    const dl = (ua, touch = false) => Kit.deviceLabel(ua, touch);
    check('deviceLabel names an iPhone, an iPad, an Android phone, a Mac, Windows and Linux (Chromebooks too)', eq([dl(UA.iphone), dl(UA.ipad), dl(UA.android), dl(UA.mac), dl(UA.windows), dl(UA.linux), dl(UA.cros)], ['iPhone', 'iPad', 'Android', 'Mac', 'Windows', 'Linux', 'Linux']), [dl(UA.iphone), dl(UA.ipad), dl(UA.android), dl(UA.mac), dl(UA.windows), dl(UA.linux)]);
    check('an iPad that says it is a Mac (it has a touch screen) is an iPad, and a Mac without touch is a Mac', dl(UA.mac, true) === 'iPad' && dl(UA.mac, false) === 'Mac');
    check('anything else, or nothing, is "This browser"', dl('SomethingElse/1.0') === 'This browser' && dl('') === 'This browser');
    check('Android is not mistaken for Linux, though its agent says both', dl(UA.android) === 'Android');
    const due = Kit.backupDue;
    check('a backup is due when signed in and syncing, the data is readable and none was made today', due({ lastDay: null }, '2026-10-24', true, true) && due({ lastDay: '2026-10-23' }, '2026-10-24', true, true));
    check('…not when one was made today, when signed out, or when the data is not readable', !due({ lastDay: '2026-10-24' }, '2026-10-24', true, true) && !due({ lastDay: null }, '2026-10-24', false, true) && !due({ lastDay: null }, '2026-10-24', true, false));
  }
  fs.rmSync(dir, { recursive: true, force: true });

  const s = summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
