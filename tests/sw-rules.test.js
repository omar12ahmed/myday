// MyDay's service worker (app/sw/sw.js), its rules run in Node with a stand-in for the browser's caches and network:
// installing caches every file of the release (fresh from the network); a new release removes the older one's cache
// (and nothing else's); opening MyDay online gets the latest page, offline (or with no answer) the cached one; the
// release's files come from the cache; your account, other sites, the classic MyDay and anything that isn't a GET are
// never touched. No browser.
const fs = require('fs');
const path = require('path');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const SCOPE = 'https://example.test/myday/';
const FILES = ['./index.html', './assets/index-abc.js', './assets/index-abc.css', './icons/icon-192.png', './manifest.webmanifest'];

// A stand-in browser for one service worker.
function load(version, net, store = new Map()) {
  const handlers = {};
  const fetched = [];
  const self = {
    addEventListener: (type, fn) => { handlers[type] = fn; },
    registration: { scope: SCOPE },
    location: { origin: 'https://example.test' },
    skipWaiting: async () => {}, clients: { claim: async () => {} },
  };
  const key = r => (typeof r === 'string' ? r : r.url);
  const cacheOf = name => {
    if (!store.has(name)) store.set(name, new Map());
    const m = store.get(name);
    return {
      addAll: async reqs => { for (const r of reqs) { fetched.push({ url: r.url, cache: r.cache }); const res = await fakeFetch(r); if (!res.ok) throw new Error('bad'); m.set(r.url, res); } },
      match: async (r, o = {}) => { let u = key(r); if (o.ignoreSearch) u = u.split('?')[0]; const hit = m.get(u); return hit ? hit.clone() : undefined; },
    };
  };
  const caches = {
    open: async name => cacheOf(name),
    keys: async () => [...store.keys()],
    delete: async name => store.delete(name),
    match: async r => { for (const m of store.values()) { const hit = m.get(key(r)); if (hit) return hit.clone(); } return undefined; },
  };
  const fakeFetch = async r => {
    const url = key(r);
    if (net.mode === 'offline') throw new TypeError('Failed to fetch');
    if (net.mode === 'down') return new Response('unavailable', { status: 503 });
    net.calls.push(url);
    return new Response(`${net.tag}:${url}`, { status: 200 });
  };
  const code = fs.readFileSync(path.join(ROOT, 'app/sw/sw.js'), 'utf8').replace('__VERSION__', JSON.stringify(version)).replace('__FILES__', JSON.stringify(FILES));
  new Function('self', 'caches', 'fetch', 'Request', 'Response', 'URL', code)(self, caches, fakeFetch, Request, Response, URL);
  const lifecycle = async type => { let p; handlers[type]({ waitUntil: x => { p = x; } }); await p; };
  // A request as the page makes it. Returns null if the service worker leaves it alone (it goes to the network as usual).
  const request = async (url, { mode = 'no-cors', method = 'GET' } = {}) => {
    let responded = null;
    const req = { url, method, mode };
    handlers.fetch({ request: req, respondWith: p => { responded = p; } });
    if (!responded) return null;
    const res = await responded;
    return { status: res.status, text: res.type === 'error' ? null : await res.text() };
  };
  return { lifecycle, request, store, fetched };
}

(async () => {
  console.log('\n[1] Installing: every file of this release, fresh from the network');
  const net = { mode: 'online', tag: 'v1', calls: [] };
  const sw = load('1.0-a', net);
  await sw.lifecycle('install');
  check('all of the release\'s files are cached, under the release\'s name', eq([...sw.store.keys()], ['myday-1.0-a']) && eq([...sw.store.get('myday-1.0-a').keys()].sort(), FILES.map(f => new URL(f, SCOPE).href).sort()));
  check('…fetched past the browser\'s own cache (so a new release never gets an old file)', sw.fetched.every(f => f.cache === 'reload'));

  console.log('\n[2] A new release replaces the old one');
  sw.store.set('someone-else', new Map());
  const net2 = { mode: 'online', tag: 'v2', calls: [] };
  const sw2 = load('2.0-b', net2, sw.store);
  await sw2.lifecycle('install');
  await sw2.lifecycle('activate');
  check('the older release\'s cache is removed; another site\'s cache is left alone', eq([...sw2.store.keys()].sort(), ['myday-2.0-b', 'someone-else']));

  console.log('\n[3] Opening MyDay');
  net2.calls.length = 0;
  let r = await sw2.request(SCOPE + 'index.html', { mode: 'navigate' });
  check('online: the latest page, from the network', r.status === 200 && r.text === `v2:${SCOPE}index.html` && net2.calls.length === 1);
  r = await sw2.request(SCOPE, { mode: 'navigate' });
  check('…the folder itself (…/myday/) too', r.text === `v2:${SCOPE}`);
  net2.mode = 'offline';
  r = await sw2.request(SCOPE + 'index.html', { mode: 'navigate' });
  check('offline: the cached page, so MyDay still opens', r.status === 200 && r.text === `v2:${SCOPE}index.html`);
  net2.mode = 'down';
  r = await sw2.request(SCOPE, { mode: 'navigate' });
  check('the site not answering (503): the cached page', r.status === 200 && r.text === `v2:${SCOPE}index.html`);
  check('the classic MyDay (a sub-folder) isn\'t touched', (await sw2.request(SCOPE + 'classic/index.html', { mode: 'navigate' })) === null);

  console.log('\n[4] The release\'s own files, and everything else');
  net2.mode = 'online'; net2.calls.length = 0;
  r = await sw2.request(SCOPE + 'assets/index-abc.js');
  check('a file of this release comes from the cache (no network)', r.text === `v2:${SCOPE}assets/index-abc.js` && net2.calls.length === 0);
  r = await sw2.request(SCOPE + 'assets/index-abc.js?r=3');
  check('…whatever is added after "?"', r.text === `v2:${SCOPE}assets/index-abc.js` && net2.calls.length === 0);
  r = await sw2.request(SCOPE + 'assets/new-chunk.js');
  check('a file that isn\'t cached is fetched as usual', r.text === `v2:${SCOPE}assets/new-chunk.js` && net2.calls.length === 1);
  check('your account (another site: Supabase) is never touched', (await sw2.request('https://abc.supabase.co/rest/v1/rpc/sync_pull')) === null);
  check('…nor recipes, bank holidays or any other site', (await sw2.request('https://www.themealdb.com/api/json/v1/1/random.php')) === null && (await sw2.request('https://www.gov.uk/bank-holidays.json')) === null);
  check('…nor anything that isn\'t a plain GET', (await sw2.request(SCOPE + 'index.html', { method: 'POST' })) === null);
  check('…nor anything outside MyDay\'s folder on the same site', (await sw2.request('https://example.test/other/page.js')) === null);

  console.log('\n[5] What it never reads or writes');
  const src = fs.readFileSync(path.join(ROOT, 'app/sw/sw.js'), 'utf8');
  check('it never reads or writes your MyDay data (no storage or database code at all)', !/localStorage|indexedDB|myday\.data|myday\.sync/.test(src.replace(/\/\/.*$/gm, '')));
  check('the build fills in this release and its files (placeholders in the source)', src.includes('const VERSION = __VERSION__;') && src.includes('const FILES = __FILES__;'));

  const s = summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
