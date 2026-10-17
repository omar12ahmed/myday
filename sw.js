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
const VERSION = "1.31.0-3f2f810-mvct2oik";
const FILES = ["./assets/ArabicQuestion-Dw_sP9Fz.js","./assets/ArabicScreen-DvM3D-OD.js","./assets/CyberQuestion-DPNVpqfr.js","./assets/CyberScreen-C74VPKOS.js","./assets/ExploreScreen-9-Hc1mjl.js","./assets/ExploreScreen-DwXR8RxE.css","./assets/Motion-08O1sAV4.js","./assets/TeachingLesson-JEHPVRjw.js","./assets/answers-B8n1WGMn.js","./assets/answers-CklBaK0K.js","./assets/arabic-a1-integration-BqsCjLSw.js","./assets/arabic-a2-integration-BUfiZFMN.js","./assets/arabic-academic-LU9l4aq8.js","./assets/arabic-argument-Dm78XXdE.js","./assets/arabic-b1-integration-DvUElVkC.js","./assets/arabic-b2-communication-DrLUae72.js","./assets/arabic-b2-independent-Bo4G9lov.js","./assets/arabic-classical-mJU_arYB.js","./assets/arabic-clause-building-ZsVeezlM.js","./assets/arabic-connected-writing-BuVh8vb2.js","./assets/arabic-daily-tasks-Si5R3zrO.js","./assets/arabic-first-sentences-DN46MVN6.js","./assets/arabic-fusha-DmND2Nh0.js","./assets/arabic-grammar-precision-CsD5Bg8F.js","./assets/arabic-independent-reading-CHBpm4Rp.js","./assets/arabic-learning-start-dgUOUXcp.js","./assets/arabic-listening-interaction-TEkCIl4c.js","./assets/arabic-literature-CaTKmHeo.js","./assets/arabic-media-TfqmHCRB.js","./assets/arabic-morphology-lookup-CEqDJvBo.js","./assets/arabic-noun-phrases-Tx6kliQE.js","./assets/arabic-past-stories-DftrybPn.js","./assets/arabic-plans-negation-DfEjHnHz.js","./assets/arabic-present-actions-DkKPH2TY.js","./assets/arabic-quranic-BcdoytZZ.js","./assets/arabic-relationships-case-Bgcz_F_W.js","./assets/arabic-script-oDjOJshr.js","./assets/arabic-sound-obTbqTAZ.js","./assets/arabic-technology-CmCXVlp1.js","./assets/arabic-translation-CcjHaRmy.js","./assets/arabic-verb-expansion-B9NRAkyM.js","./assets/ask-CPJUV-Xw.js","./assets/cards-BjVTXoQ5.js","./assets/cybersecurity-CnOJeDrX.js","./assets/dist-DvjAMUvs.js","./assets/esm-CCmcOyJ8.js","./assets/explain-DcmY9dYF.js","./assets/index-BKkcgR7H.js","./assets/index-Bx8pLalg.css","./assets/mock-BNFfXDAT.js","./assets/noto-naskh-arabic-arabic-wght-normal-DIN-4rtF.woff2","./assets/noto-naskh-arabic-latin-ext-wght-normal-CJtFhxZA.woff2","./assets/noto-naskh-arabic-latin-wght-normal-B_CzjACR.woff2","./assets/noto-naskh-arabic-math-wght-normal-Cgl1D-No.woff2","./assets/noto-naskh-arabic-symbols-wght-normal-DTaB7Hqz.woff2","./assets/parts-ZOGscHt4.js","./assets/plus-jakarta-sans-latin-ext-wght-normal-DmpS2jIq.woff2","./assets/plus-jakarta-sans-latin-wght-normal-eXO_dkmS.woff2","./assets/plus-jakarta-sans-vietnamese-wght-normal-qRpaaN48.woff2","./assets/preload-helper-DnsD7lJP.js","./assets/react-BkAXpnfr.js","./assets/rolldown-runtime-BpQH8Ho1.js","./assets/texts-BoszoLMp.css","./assets/texts-cgUq_nkP.js","./assets/three-CECukPHQ.js","./assets/tutor-VOJF2c8v.js","./assets/tutor-lessons-CId4f0D8.js","./cybersecurity/README.md","./cybersecurity/synthetic_auth.csv","./cybersecurity/synthetic_host_events.json","./cybersecurity/synthetic_web.jsonl","./explore/cash-handover.webp","./explore/hargeisa-fruit-market.webp","./explore/market-aerial.webp","./explore/market-crowd.webp","./explore/packed-shop.webp","./explore/parcel-handover.webp","./icon-maskable.svg","./icon.svg","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./index.html","./manifest.webmanifest"];
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
