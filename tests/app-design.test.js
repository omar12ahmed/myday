// Shared design checks in the runner's disposable browser; captures are synthetic, never the user's data.
const T = require('./cdp.js');
const fs = require('fs'), os = require('os'), path = require('path');
const { pathToFileURL } = require('url');
const { ev, check, sleep, send, click } = T;
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const go = async route => { T.setUrl('app/dist/index.html#' + route); await T.openAt(2026, 10, 5, 9); await sleep(200); };
const capture = async name => fs.writeFileSync('/tmp/myday-design-' + name + '.png', Buffer.from((await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data, 'base64'));
const theme = async value => { await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.settings.theme = ${JSON.stringify(value)}; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`); };
const tealAction = () => ev(`(() => {
  const b = document.querySelector('[data-action="build"]');
  const probe = document.createElement('span'); probe.style.color = 'var(--primary)'; document.body.append(probe);
  const expected = getComputedStyle(probe).color; probe.remove();
  return !!b && getComputedStyle(b).backgroundColor === expected;
})()`);
(async () => {
  await T.connect(); await go('today'); await ev('localStorage.clear()'); await go('today');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
  await theme('light');
  for (const route of ['today', 'study', 'calendar', 'projects', 'finance', 'health/workout', 'study/cybersecurity', 'study/cybersecurity/practice']) {
    await go(route);
    check('desktop fits: ' + route, !await ev('document.documentElement.scrollWidth > innerWidth'));
    check('one readable page title: ' + route, await ev(`(() => { const hs = [...document.querySelectorAll('h1')].filter(h => h.getClientRects().length); return hs.length === 1 && getComputedStyle(hs[0]).opacity === '1'; })()`));
    check('header controls do not overlap: ' + route, await ev(`(() => { const a = document.querySelector('.capture-btn').getBoundingClientRect(), b = document.querySelector('#themeBtn').getBoundingClientRect(), h = document.querySelector('.appbar-card').getBoundingClientRect(); return a.right <= b.left && a.top >= h.top && a.bottom <= h.bottom; })()`));
    await capture(route.replaceAll('/', '-'));
  }
  await go('today');
  check('light theme uses the established teal for the main action', await tealAction());
  await go('study');
  await click('.nav-shortcuts a[href="#today/tasks"]'); await sleep(200);
  check('the workspace task shortcut opens the existing task screen', await ev('location.hash === "#today/tasks" && !!document.querySelector("#screenName")'));
  await click('.nav-shortcuts a[href="#projects/notes"]'); await sleep(200);
  check('the workspace note shortcut opens the existing notes screen', await ev('location.hash === "#projects/notes"'));
  await go('study');
  await click('.skip-link');
  check('Skip to content focuses the workspace without changing the route', await ev('document.activeElement.id === "app" && location.hash === "#study"'));
  await click('[data-action=capture-open]'); await sleep(100);
  check('Capture still opens its dialog from the new header position', await ev('!!document.querySelector("dialog[open]")'));
  await go('study/cybersecurity/practice');
  check('workshop tabs identify the current destination', await ev(`document.querySelector('nav[aria-label="Cybersecurity"] [aria-current="page"]').textContent === 'Practice'`));
  await theme('dark'); await go('study'); await capture('study-dark');
  await go('today'); await capture('today-dark');
  check('dark theme uses the established teal for the main action', await tealAction());
  // Use the real importer to exercise a populated subject dashboard as well as the first-run screen.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-design-fixture-'));
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  fs.writeFileSync(path.join(dir, 'fixture.ts'), `export { freshState } from ${JSON.stringify(path.join(ROOT, 'app/src/data/normalize'))}; export { importPath } from ${JSON.stringify(path.join(ROOT, 'app/src/study/cybersecurity/learning'))};`);
  const C = await import(pathToFileURL(await bundle(path.join(dir, 'fixture.ts'), path.join(dir, 'out'))).href);
  const d = C.freshState(); C.importPath(d, 'path.core'); d.settings.theme = 'light';
  await ev(`localStorage.setItem('myday.data.v4', ${JSON.stringify(JSON.stringify(d))})`);
  await go('study'); await capture('study-populated');
  await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 1, mobile: true });
  for (const route of ['today', 'study', 'calendar', 'projects', 'finance', 'health/workout', 'study/cybersecurity/practice']) {
    await go(route);
    check('small phone fits: ' + route, !await ev('document.documentElement.scrollWidth > innerWidth'));
    check('navigation remains touchable: ' + route, await ev(`[...document.querySelectorAll('#nav .nav-item')].every(a => { const r = a.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; })`));
    check('Capture stays visible above the phone navigation: ' + route, await ev(`(() => { const a = document.querySelector('.capture-btn').getBoundingClientRect(), n = document.querySelector('#nav').getBoundingClientRect(); return a.width >= 44 && a.height >= 44 && a.top >= 0 && a.right <= innerWidth && a.bottom <= n.top && a.bottom > innerHeight / 2; })()`));
    await capture(route.replaceAll('/', '-') + '-phone');
  }
  await click('[data-action=capture-open]'); await sleep(100);
  check('phone Capture opens a visible dialog', await ev(`(() => { const d = document.querySelector('dialog[open]'); if (!d) return false; const r = d.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; })()`));
  await theme('dark'); await go('study'); await capture('study-phone-dark');
  const unchanged = await T.data();
  check('visual navigation preserves the imported learning records', require('node:util').isDeepStrictEqual(unchanged.study, d.study) && unchanged.cybersecurity.attempts.length === 0);
  fs.rmSync(dir, { recursive: true, force: true });
  const s = T.summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
