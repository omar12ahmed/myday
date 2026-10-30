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

  // [Restyle review fixes] Short desktop screens, the floating Capture button, phone tabs, disabled buttons, the phone bar and the focus ring.
  console.log('\n[Restyle review fixes]');
  {
    const at = '2026-10-05T08:00';
    const op = (id, text) => ({ id, text, pros: [], cons: [] });
    const PJ = { id: 'pjSoup', title: 'Made-up soup van', summary: 'A van that sells soup', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at, template: 'business',
      model: { problem: 'Lunch is dull', who: 'Office workers', how: 'Soup from a van', assumptions: [] }, milestones: [],
      decisions: [{ id: 'dcSoup', question: 'Which pitch?', options: [op('opS1', 'Market square'), op('opS2', 'Station')], chosen: null, why: '', decidedOn: null, createdAt: at, updatedAt: at }] };
    const TASKS = Array.from({ length: 40 }, (_, i) => ({ id: 'tkL' + i, title: 'Made-up soup job ' + i, listId: '', category: 'admin', minutes: 15, due: '2026-10-05', time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null }));
    await go('today');
    await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.settings.theme = 'light'; d.projects.items.push(${JSON.stringify(PJ)}); d.tasks.items.push(...${JSON.stringify(TASKS)}); localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
    const press = async (key, code, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }); await sleep(40); };

    // 1. Wide but short screen: the sidebar scrolls to its last link.
    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 650, deviceScaleFactor: 1, mobile: false });
    await go('today');
    const nav = await ev(`(() => { const n = document.querySelector('.nav'); n.scrollTop = n.scrollHeight; const l = [...n.querySelectorAll('.nav-utilities a')].pop(); const r = l.getBoundingClientRect(); return { overflowY: getComputedStyle(n).overflowY, sh: n.scrollHeight, ch: n.clientHeight, text: l.textContent.trim(), bottom: r.bottom, ih: innerHeight }; })()`);
    check('on a wide but short screen the sidebar has more content than fits, so it needs to scroll', nav.sh > nav.ch, nav);
    check('on a wide but short screen the sidebar can scroll (overflow-y is auto)', nav.overflowY === 'auto', nav);
    check('on a wide but short screen, scrolled to the end, the last sidebar link "What MyDay knows" is fully inside the window', /What MyDay knows/.test(nav.text) && nav.bottom <= nav.ih, nav);

    // 2. Wide screen, long page: Capture stays in view and the header is sticky.
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await go('today/tasks');
    const far = await ev(`(() => { window.scrollTo({ top: 3000, behavior: 'instant' }); return new Promise(res => setTimeout(() => { const r = document.querySelector('.capture-btn').getBoundingClientRect(); res({ y: scrollY, top: r.top, bottom: r.bottom, ih: innerHeight, pos: getComputedStyle(document.querySelector('.appbar')).position }); }, 200)); })()`);
    check('a long task list is long enough to scroll down at least 1200 px', far.y >= 1200, far);
    check('after scrolling a long task list down, the Capture button is still fully inside the window', far.top >= 0 && far.bottom <= far.ih, far);
    check('the header stays in place while scrolling (position is sticky)', far.pos === 'sticky', far);

    // 3. Phone: the four project tabs fit their row.
    await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 740, deviceScaleFactor: 2, mobile: true });
    await go('projects/p/pjSoup');
    const tabs = await ev(`(() => { const row = [...document.querySelectorAll('.seg')].find(s => s.getClientRects().length); const rr = row.getBoundingClientRect(); const links = [...row.querySelectorAll('a')].map(a => { const r = a.getBoundingClientRect(); return { t: a.textContent.trim(), l: r.left, r: r.right }; }); return { names: links.map(x => x.t), rowL: rr.left, rowR: rr.right, links, sw: row.scrollWidth, cw: row.clientWidth, docSw: document.documentElement.scrollWidth, iw: innerWidth }; })()`);
    check('the business project shows five tabs: Overview, Model, Money, Milestones, Decisions', tabs.names.join(',') === 'Overview,Model,Money,Milestones,Decisions', tabs.names);
    check('on a phone every project tab is fully inside the tab row', tabs.links.every(x => x.l >= tabs.rowL - 1 && x.r <= tabs.rowR + 1), tabs);
    check('on a phone the project tab row does not scroll sideways', tabs.sw <= tabs.cw + 1, tabs);
    check('on a phone the project page does not scroll sideways', tabs.docSw <= tabs.iw, tabs);

    // 4. Disabled buttons do not look like working ones.
    await go('projects/p/pjSoup/decisions');
    const btns = await ev(`(() => { const vis = e => e.getClientRects().length > 0; const pick = e => { if (!e) return null; const c = getComputedStyle(e); return { text: e.textContent.trim(), bg: c.backgroundColor, bs: c.borderTopStyle }; }; return { dis: pick([...document.querySelectorAll('button[data-variant]:disabled')].find(vis)), tonal: pick([...document.querySelectorAll('button[data-variant="tonal"]:not(:disabled)')].find(vis)) }; })()`);
    check('a disabled button has no fill (transparent background)', !!btns.dis && btns.dis.bg === 'rgba(0, 0, 0, 0)', btns);
    check('a disabled button has a dashed outline', !!btns.dis && btns.dis.bs === 'dashed', btns);
    check('an enabled tonal button still has a filled background', !!btns.tonal && btns.tonal.bg !== 'rgba(0, 0, 0, 0)' && btns.tonal.bg !== 'transparent', btns);

    // 5. Phone bar: the current section uses the primary colours (light, then dark).
    const bar = () => ev(`(() => { const rgb = (prop, v) => { const p = document.createElement('span'); p.style[prop] = 'var(' + v + ')'; document.body.append(p); const c = getComputedStyle(p)[prop]; p.remove(); return c; }; const it = document.querySelector('.nav-item[aria-current="page"]'); const icon = it.querySelector('.nav-icon'); return { bg: getComputedStyle(it).backgroundColor, wantBg: rgb('backgroundColor', '--primary-container'), icon: getComputedStyle(icon).color, wantIcon: rgb('color', '--primary') }; })()`);
    for (const mode of ['light', 'dark']) {
      await theme(mode); await go('today');
      const b = await bar();
      check(`on a phone in the ${mode} theme the current section in the bottom bar has the primary-container background`, b.bg === b.wantBg && b.bg !== 'rgba(0, 0, 0, 0)', b);
      check(`on a phone in the ${mode} theme the current section's icon is in the primary colour`, b.icon === b.wantIcon, b);
    }
    await theme('light');

    // 6. Tab focus ring is drawn inside the tab.
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await go('projects/p/pjSoup');
    let landed = false;
    for (let i = 0; i < 60 && !landed; i++) { await press('Tab', 'Tab', 9); landed = await ev(`!!document.activeElement && document.activeElement.matches('.workspace-main .seg-link')`); }
    const ring = await ev(`(() => { const a = document.activeElement, c = getComputedStyle(a); return { on: a.matches('.workspace-main .seg-link'), focusVisible: a.matches(':focus-visible'), offset: c.outlineOffset, style: c.outlineStyle }; })()`);
    check('pressing Tab reaches a project tab', landed && ring.on, ring);
    check('a keyboard-focused tab draws its focus ring inside (negative outline offset)', parseFloat(ring.offset) < 0, ring);
    check('a keyboard-focused tab has a visible focus outline', ring.style !== 'none' && ring.focusVisible, ring);
    await send('Emulation.clearDeviceMetricsOverride');
  }
  const s = T.summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
