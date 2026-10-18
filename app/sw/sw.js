// MyDay's service worker: lets MyDay — the installed app on a phone, or the website — open without a connection.
// Written by hand, with no library. The build fills in VERSION, FILES (every file of this release) and AUDIO (the
// Arabic clips it plays); see the plugin in vite.config.ts.
//
// - Installing: every file of this release goes into a cache named after the release, so the whole app is there
//   offline. A new release installs alongside, takes over, and removes the older release's cache.
// - Opening MyDay (a page load): from the network first, so you always get the latest release when you're online;
//   offline, or if the site doesn't answer, the cached page.
// - The release's own files (scripts, styles, fonts, icons): from the cache — their names change with each release,
//   so a cached one is never out of date. Anything not cached is fetched as usual.
// - The Arabic starter words' audio (arabic-audio/, from 1.39.0): kept out of the release's files, so a new release
//   doesn't download every clip again. A clip is fetched the first time it's played and kept in its own cache,
//   which outlives releases; a clip's name changes with its contents, so a kept one is never out of date. A release
//   removes the clips it no longer plays.
// - Everything else — your account (Supabase), AI help, recipes, bank holidays, other sites, the classic MyDay —
//   isn't touched: it goes to the network as if this weren't here. Nothing about your data is stored by this (your
//   MyDay data stays in the browser's own storage, which this never reads or changes).
const VERSION = __VERSION__;
const FILES = __FILES__;
const AUDIO = __AUDIO__;
const CACHE = 'myday-' + VERSION;
const SOUNDS = 'myday-audio';
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
      .then(keys => Promise.all(keys.filter(k => k.startsWith('myday-') && k !== CACHE && k !== SOUNDS).map(k => caches.delete(k))))
      // Clips this release no longer plays (only if a clip has ever been played here: no empty cache is made).
      .then(() => caches.has(SOUNDS))
      .then(played => played && caches.open(SOUNDS).then(sounds => {
        const kept = new Set(AUDIO.map(f => new URL(f, scopeUrl()).href));
        return sounds.keys().then(reqs => Promise.all(reqs.filter(r => !kept.has(r.url)).map(r => sounds.delete(r))));
      }))
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
  if (url.pathname.startsWith(scopeUrl().pathname + 'arabic-audio/')) {
    // MyDay fetches a clip whole (never a byte range); anything else goes to the network as usual.
    if (req.headers?.has?.('range')) return;
    const clip = url.origin + url.pathname;
    event.respondWith(caches.open(SOUNDS).then(sounds => sounds.match(clip).then(hit => hit || fetch(req).then(res => {
      if (res.status === 200) return sounds.put(clip, res.clone()).then(() => res, () => res);
      return res;
    }))));
    return;
  }
  event.respondWith(caches.open(CACHE).then(cache => cache.match(req, { ignoreSearch: true })).then(hit => hit || fetch(req)));
});
