// MyDay's service worker: lets MyDay — the installed app on a phone, or the website — open without a connection.
// Written by hand, with no library. The build fills in VERSION and FILES (every file of this release); see the
// plugin in vite.config.ts.
//
// - Installing: every file of this release goes into a cache named after the release, so the whole app is there
//   offline. A new release installs alongside, takes over, and removes the older release's cache.
// - Opening MyDay (a page load): from the network first, so you always get the latest release when you're online;
//   offline, or if the site doesn't answer, the cached page.
// - The release's own files (scripts, styles, fonts, icons): from the cache — their names change with each release,
//   so a cached one is never out of date. Anything not cached is fetched as usual.
// - Everything else — your account (Supabase), AI help, recipes, bank holidays, other sites, the classic MyDay —
//   isn't touched: it goes to the network as if this weren't here. Nothing about your data is stored by this (your
//   MyDay data stays in the browser's own storage, which this never reads or changes).
const VERSION = "1.11.0-b9c5f58-muud2pmv";
const FILES = ["./assets/dist-DvjAMUvs.js","./assets/esm-DOX8t1d2.js","./assets/index-CAEe2L7l.css","./assets/index-D4HDap4Z.js","./assets/mock-DhwrYhqx.js","./assets/plus-jakarta-sans-latin-ext-wght-normal-DmpS2jIq.woff2","./assets/plus-jakarta-sans-latin-wght-normal-eXO_dkmS.woff2","./assets/plus-jakarta-sans-vietnamese-wght-normal-qRpaaN48.woff2","./assets/three-CECukPHQ.js","./icon-maskable.svg","./icon.svg","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./index.html","./manifest.webmanifest"];
const CACHE = 'myday-' + VERSION;
const scopeUrl = () => new URL(self.registration.scope);
const INDEX = () => new URL('index.html', scopeUrl()).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES.map(f => new Request(new URL(f, scopeUrl()).href, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('myday-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Is this MyDay's own page (the folder itself, or its index.html) — not, say, the classic MyDay in a sub-folder?
function isAppPage(url) {
  const base = scopeUrl().pathname;
  return url.pathname === base || url.pathname === base + 'index.html';
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(scopeUrl().pathname)) return;
  if (req.mode === 'navigate') {
    if (!isAppPage(url)) return;
    event.respondWith(
      fetch(req).then(res => (res.ok ? res : caches.match(INDEX()).then(hit => hit || res)))
        .catch(() => caches.match(INDEX()).then(hit => hit || Response.error())),
    );
    return;
  }
  event.respondWith(caches.open(CACHE).then(cache => cache.match(req, { ignoreSearch: true })).then(hit => hit || fetch(req)));
});
