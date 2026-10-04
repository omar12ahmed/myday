// MyDay as an installable app, in the browser (a copy of the built app this test may change): the manifest (name,
// full-screen, start page, icons at the right sizes, the maskable one), Chrome's own installability check, the
// service worker taking charge and caching every file of the release, MyDay opening from that cache when the site
// doesn't answer, the footer's "Install MyDay as an app" (only when the browser offers it), and the phone's status
// bar following the theme.
const fs = require('fs');
const path = require('path');
const T = require('./cdp.js');
const { openAt, ev, click, exists, text, check, sleep, send } = T;
const KEY = 'myday.data.v4';
const COPY = path.join(__dirname, 'srv', 'install');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const open = async (h = 9, mi = 0) => { T.setUrl('install/index.html#today'); await openAt(2026, 10, 15, h, mi); };
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);

(async () => {
  fs.rmSync(COPY, { recursive: true, force: true });
  fs.cpSync(path.join(__dirname, 'srv', 'app', 'dist'), COPY, { recursive: true });
  await T.connect();
  await send('Network.enable');
  await open();

  console.log('\n[1] The manifest and icons');
  const m = await ev(`fetch(document.querySelector('link[rel=manifest]').href).then(r => r.json())`);
  const base = await ev(`new URL('./', document.querySelector('link[rel=manifest]').href).href`);
  check('it\'s linked from the page, named MyDay, opening full screen (no browser bar)', m.name === 'MyDay' && m.short_name === 'MyDay' && m.display === 'standalone');
  check('…starting at Today, inside its own folder (so it works under /myday/ on the website)', new URL(m.start_url, base).href === base + '#today' && new URL(m.scope, base).href === base);
  check('…with the app\'s colours for its splash screen and status bar', m.background_color === '#101315' && m.theme_color === '#101315');
  const icons = await ev(`Promise.all(${JSON.stringify(m.icons)}.map(i => new Promise(res => { const im = new Image(); im.onload = () => res({ ...i, w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => res({ ...i, w: 0 }); im.src = new URL(i.src, ${JSON.stringify(base)}).href; })))`);
  check('icons at 192 and 512 px load, at the sizes they say', icons.filter(i => i.purpose === 'any').map(i => `${i.w}x${i.h}`).join() === '192x192,512x512' && icons.every(i => i.sizes === `${i.w}x${i.h}`), icons);
  check('…and a maskable one (512 px, filling the square, for Android\'s own icon shapes)', icons.some(i => i.purpose === 'maskable' && i.w === 512));
  check('an Apple touch icon (180 px) for "Add to Home Screen" / "Add to Dock"', (await ev(`new Promise(res => { const im = new Image(); im.onload = () => res(im.naturalWidth); im.onerror = () => res(0); im.src = document.querySelector('link[rel=apple-touch-icon]').href; })`)) === 180);

  console.log('\n[2] The service worker');
  const scope = await ev(`navigator.serviceWorker.ready.then(r => r.scope)`);
  check('it registers, for MyDay\'s own folder', scope === base, scope);
  await open(9, 1);
  check('…and takes charge of MyDay once it\'s opened again', await ev(`!!navigator.serviceWorker.controller`));
  const files = JSON.parse(fs.readFileSync(path.join(COPY, 'sw.js'), 'utf8').match(/const FILES = (\[.*?\]);/)[1]);
  const cached = await ev(`caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('myday-')).map(k => caches.open(k).then(c => c.keys())))).then(all => all.flat().map(r => r.url))`);
  check('every file of this release is cached (the app, its scripts, styles, fonts, icons and manifest)', files.length > 10 && files.every(f => cached.includes(new URL(f, base).href)), files.filter(f => !cached.includes(new URL(f, base).href)));
  check('…in one cache, named after this release', (await ev(`caches.keys()`)).filter(k => k.startsWith('myday-')).length === 1);
  const inst = await send('Page.getInstallabilityErrors');
  check('Chrome finds nothing stopping it from being installed', eq(inst.installabilityErrors, []), inst.installabilityErrors);

  console.log('\n[3] Opening when the site doesn\'t answer');
  await editStorage(`s => { s.lists.admin[0].title = 'Kept on this device'; }`);
  fs.renameSync(path.join(COPY, 'index.html'), path.join(COPY, 'index.html.away'));
  const seen = [];
  T.setHandler(d => { if (d.method === 'Network.responseReceived' && d.params.type === 'Document') seen.push(d.params.response); });
  await open(9, 2);
  T.setHandler(null);
  check('with the page gone from the server, MyDay still opens — from the cache', (await exists('#nav')) && (await text('#app')).length > 0 && seen.some(r => r.fromServiceWorker), seen.map(r => [r.status, r.fromServiceWorker]));
  check('…with your data as it was on this device', await ev(`JSON.parse(localStorage.getItem('${KEY}')).lists.admin[0].title === 'Kept on this device'`));
  fs.renameSync(path.join(COPY, 'index.html.away'), path.join(COPY, 'index.html'));

  console.log('\n[4] "Install MyDay as an app"');
  check('Chrome itself offers to install MyDay, so the footer shows "Install MyDay as an app"', await exists('[data-action=install]'));
  await ev(`(() => { window.__prompted = 0; const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = async () => { window.__prompted++; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); })()`);
  await sleep(200);
  check('(the button uses the browser\'s latest offer)', await exists('[data-action=install]'));
  await click('[data-action=install]'); await sleep(300);
  check('…opens the browser\'s own install question, then says it\'s done', (await ev('window.__prompted')) === 1 && (await text('#toast')).includes('MyDay is installed') && !(await exists('[data-action=install]')));

  console.log('\n[5] The phone\'s status bar follows the theme');
  await editStorage(`s => { s.settings.theme = 'light'; }`); await open(9, 3);
  check('light theme → a light status bar', (await ev(`document.querySelector('meta[name=theme-color]').content`)) === '#f4f6f4');
  await editStorage(`s => { s.settings.theme = 'dark'; }`); await open(9, 4);
  check('dark theme → a dark one', (await ev(`document.querySelector('meta[name=theme-color]').content`)) === '#101315');

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  await ev(`navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister())))`);
  fs.rmSync(COPY, { recursive: true, force: true });
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
