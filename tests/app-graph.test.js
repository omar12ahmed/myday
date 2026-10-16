// Connections — the knowledge graph in the new app (milestone 4, #projects/connections): the tab beside Projects and
// Notes, nothing-yet, the drawing (projects, notes, the three kinds of line, names that never overlap and stay at
// reading size, drawn at the screen's real width), choosing a dot (by tap and by keyboard; Escape lets go) and its
// details (where a note is and why, related notes, a project's notes and "might belong here"), Keep and Undo for a
// link MyDay made, "What goes together", notes not connected yet, nothing saved by looking, the dark theme, and phones.
// Made-up notes and projects only.
const T = require('./cdp.js');
const { openAt, ev, click, exists, text, data, check, sleep, send } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const go = async (hash, h = 9) => { T.setUrl(APP + '#' + hash); await openAt(2026, 10, 16, h); await sleep(250); };
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const CONNECT_WAIT = 2600; // MyDay connects notes a moment (1.5 s) after things settle
// A real tap at the middle of an element (SVG dots have no .click()).
async function tap(sel) {
  const at = await ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; el.scrollIntoView({ block: 'center' });
    const r = (el.querySelector('circle:last-of-type') || el).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  if (!at) throw new Error('missing ' + sel);
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: at.x, y: at.y, button: 'left', clickCount: 1 });
  await sleep(200);
}
const key = async k => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code: k === ' ' ? 'Space' : k, windowsVirtualKeyCode: k === 'Enter' ? 13 : k === 'Escape' ? 27 : 32 }); await sleep(150); };
const P = (id, title, summary, status = 'active') => ({ id, title, summary, stage: 'explore', status, nextTaskId: null, commitmentIds: [], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00' });
const N = (id, text, extra = {}) => ({ id, categoryId: '', title: '', text, pinned: false, createdAt: '2026-10-02T09:00', updatedAt: '2026-10-02T09:00', ...extra });
const seed = `s => {
  s.projects = { items: ${JSON.stringify([P('pjC', 'Coffee subscription for offices', 'Fresh coffee beans delivered to small offices every fortnight, priced per kilo.'),
    P('pjA', 'Learn Arabic for travel', 'Arabic conversation and the alphabet before the trip to Jordan.'), P('pjM', 'Move to a bigger flat', 'A two-bedroom flat near the station.', 'paused')])} };
  s.notes.items = ${JSON.stringify([
    N('n1', 'Competitors: Pact coffee and Grind deliver coffee to offices', { projectId: 'pjC' }),
    N('n2', 'Roasters: two local roasters sell coffee beans per kilo for about £12', { projectId: 'pjC', linkedBy: 'rules', linkWhy: 'roasters · beans' }),
    N('n3', 'Arabic alphabet: 28 letters, practise writing them before Jordan', { projectId: 'pjA' }),
    N('n4', 'Useful Arabic phrases for taxis and markets in Amman', { projectId: 'pjA', linkedBy: 'rules', linkWhy: 'Arabic' }),
    N('n5', 'Morning routine: sleep, water, a short walk along the canal'),
    N('n6', 'Walk: the canal route is quieter for a morning walk'),
    N('n7', 'Wifi password is in the kitchen drawer'),
    N('n8', 'A very long note title that goes on and on about the delivery van, the roasting schedule and the coffee beans', { projectId: 'pjC' }),
  ])};
}`;

(async () => {
  await T.connect();
  await send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });
  await send('Emulation.setLocaleOverride', { locale: 'en-GB' });

  console.log('\n[1] The tab, and nothing to connect yet');
  await go('today'); await reset(); await go('today');
  await go('projects');
  check('Projects has a third tab, Connections', (await text('[role=tablist]')).includes('Connections') && (await exists('a[href="#projects/connections"]')));
  await click('a[href="#projects/connections"]'); await sleep(300);
  check('…which opens Connections, marked as the current tab', (await ev('location.hash')) === '#projects/connections' && (await ev(`document.querySelector('a[href="#projects/connections"]').getAttribute('aria-selected')`)) === 'true' && (await text('#kg-h')) === 'Connections');
  check('nothing yet: a friendly note, no drawing', (await exists('#kg-empty')) && !(await exists('[data-s=kg-drawing]')) && (await text('#kg-empty')).includes('Nothing connects yet'));

  console.log('\n[2] The drawing');
  await editStorage(seed); await go('projects/connections'); await sleep(CONNECT_WAIT);
  const saved = await data();
  const nodes = () => ev(`[...document.querySelectorAll('[data-s=kg-node]')].map(n => n.dataset.kind[0] + ':' + n.dataset.id).sort()`);
  check('projects and connected notes are drawn (the lone note isn\'t)', eq(await nodes(), ['n:n1', 'n:n2', 'n:n3', 'n:n4', 'n:n5', 'n:n6', 'n:n8', 'p:pjA', 'p:pjC', 'p:pjM']), await nodes());
  const kinds = await ev(`[...new Set([...document.querySelectorAll('[data-s=kg-edge]')].map(e => e.dataset.kind))].sort()`);
  check('three kinds of line: in a project, put there by MyDay, related', eq(kinds, ['in', 'myday', 'related']), kinds);
  check('drawn at the space\'s real width (not scaled down)', await ev(`(() => { const s = document.querySelector('[data-s=kg-drawing] svg'); return Math.abs(s.getBoundingClientRect().width - Number(s.getAttribute('width'))) < 1 && Math.abs(s.getBoundingClientRect().width - document.querySelector('[data-s=kg-drawing]').clientWidth) < 1; })()`));
  const labelCheck = () => ev(`(() => { const svg = document.querySelector('[data-s=kg-drawing] svg'), box = svg.getBoundingClientRect();
    const ls = [...svg.querySelectorAll('.kg-label')].map(t => t.getBoundingClientRect());
    const dots = [...svg.querySelectorAll('[data-s=kg-node]')].map(g => { const c = g.querySelectorAll('circle'); return { g, r: c[c.length - 1].getBoundingClientRect() }; });
    const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    let n = 0; for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) if (hit(ls[i], ls[j])) n++;
    const onDots = [...svg.querySelectorAll('[data-s=kg-node]')].filter(g => g.querySelector('.kg-label')).reduce((a, g) => { const l = g.querySelector('.kg-label').getBoundingClientRect(); return a + dots.filter(d => d.g !== g && hit(l, d.r)).length; }, 0);
    const out = ls.filter(r => r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1).length;
    const sizes = [...svg.querySelectorAll('.kg-label')].map(t => parseFloat(getComputedStyle(t).fontSize));
    return { labels: ls.length, overlaps: n, onDots, out, small: sizes.filter(s => s < 13).length }; })()`);
  const L = await labelCheck();
  check('names never overlap each other or another dot, never run off the drawing, and are at least 13 px', L.labels >= 6 && L.overlaps === 0 && L.onDots === 0 && L.out === 0 && L.small === 0, L);
  check('every project is named', await ev(`[...document.querySelectorAll('[data-s=kg-node][data-kind=project]')].every(g => g.querySelector('.kg-label'))`));
  check('a long name is shortened in the drawing; its full name is the dot\'s title', await ev(`(() => { const g = document.querySelector('[data-s=kg-node][data-id=n8]'); const l = g.querySelector('.kg-label'); return g.querySelector('title').textContent.startsWith('A very long note title that goes on and on') && (!l || l.textContent.endsWith('…')); })()`));
  check('the key and a count of what\'s drawn', (await text('[data-s=kg-key]')).includes('Put there by MyDay') && (await text('#kg-hint')) === '7 notes and 3 projects drawn. Tap one to see its connections.', await text('#kg-hint'));
  check('a paused project is drawn differently from an active one', await ev(`(() => { const f = id => getComputedStyle(document.querySelector('[data-s=kg-node][data-id=' + id + '] g circle')).fill; return f('pjC') !== f('pjM'); })()`));
  check('"What goes together" lists each group', (await ev(`document.querySelectorAll('[data-s=kg-group]').length`)) === 4 && (await text('#kg-groups')).includes('Coffee subscription for offices') && (await text('#kg-groups')).includes('2 related notes'));
  check('the note that connects to nothing is counted, with a way to your notes', (await text('#kg-loose')).includes("1 note isn't connected to anything yet") && (await exists('#kg-loose a[href="#projects/notes"]')));

  console.log('\n[3] Choosing a dot');
  await tap('[data-s=kg-node][data-id=n2]');
  check('tapping a note shows where it is and why MyDay put it there', (await ev(`document.querySelector('#kg-panel')?.dataset.id`)) === 'n2' && (await text('#kg-where')).includes('In Coffee subscription for offices') && (await text('#kg-where')).includes('MyDay put it there: both mention “roasters” and “beans”'), await text('#kg-panel'));
  check('…marked as chosen, with everything not linked to it faded', (await ev(`document.querySelector('[data-s=kg-node][data-id=n2]').getAttribute('aria-pressed')`)) === 'true' && (await ev(`[...document.querySelectorAll('[data-s=kg-edge]')].some(e => +e.style.opacity < 1)`)));
  check('…with Keep and Undo for MyDay\'s link, and a way to open the note', (await exists('[data-action=kg-keep]')) && (await exists('[data-action=kg-undo]')) && (await ev(`document.querySelector('[data-action=kg-open]').getAttribute('href')`)) === '#projects/notes/n2');
  await click('#kg-panel [data-action=kg-pick][data-key="p:pjC"]'); await sleep(200);
  check('the project\'s name in the details chooses the project: its notes, MyDay\'s marked', (await ev(`document.querySelector('#kg-panel').dataset.id`)) === 'pjC' && (await text('#kg-panel')).includes('Its notes (3)') && (await text('#kg-notes')).includes('put here by MyDay'));
  await ev(`document.querySelector('[data-s=kg-node][data-id=pjC]').focus()`); await key('Escape');
  check('Escape lets go', !(await exists('#kg-panel')) && (await exists('#kg-hint')));
  await ev(`document.querySelector('[data-s=kg-node][data-id=n5]').focus()`); await key('Enter');
  check('a dot can be chosen from the keyboard (Enter); related notes are listed with the words they share', (await ev(`document.querySelector('#kg-panel')?.dataset.id`)) === 'n5' && (await text('#kg-where')) === 'Not in a project yet.' && (await text('#kg-related')).includes('Walk: the canal route') && (await text('#kg-related')).includes('both mention'), await text('#kg-panel'));
  await tap('[data-s=kg-node][data-id=n5]');
  check('tapping the chosen dot again lets go', !(await exists('#kg-panel')));
  check('nothing was saved by looking', eq(saved, await data()));

  console.log('\n[4] Keep and Undo');
  await tap('[data-s=kg-node][data-id=n2]'); await click('[data-action=kg-keep]'); await sleep(300);
  let n2 = (await data()).notes.items.find(n => n.id === 'n2');
  check('Keep: the link becomes yours (still in the project), the line becomes a plain one', n2.projectId === 'pjC' && !n2.linkedBy && !n2.linkWhy && (await text('#toast')) === 'Kept.' &&
    (await ev(`[...document.querySelectorAll('[data-s=kg-edge][data-kind=myday]')].length`)) === 1 && !(await exists('[data-action=kg-keep]')));
  await tap('[data-s=kg-node][data-id=n4]'); await click('[data-action=kg-undo]'); await sleep(300);
  const n4 = (await data()).notes.items.find(n => n.id === 'n4');
  check('Undo: the note leaves the project, and MyDay won\'t put it back there', !n4.projectId && eq(n4.notProjects, ['pjA']) && (await text('#toast')).includes("won't put it back"));
  check('…and the drawing follows (no MyDay lines left)', !(await exists('[data-s=kg-edge][data-kind=myday]')));

  console.log('\n[5] Dark theme');
  const contrast = () => ev(`(() => {
    const lum = c => { const [r, g, b] = c.match(/[0-9.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const card = getComputedStyle(document.querySelector('[data-s=kg-drawing]').closest('section')).backgroundColor;
    const r = [...document.querySelectorAll('.kg-label')].map(t => ratio(getComputedStyle(t).fill, card));
    const fills = [...document.querySelectorAll('[data-s=kg-node] g circle')].map(c => getComputedStyle(c).fill);
    return { min: Math.min(...r), black: fills.filter(f => f === 'rgb(0, 0, 0)').length, white: fills.filter(f => f === 'rgb(255, 255, 255)').length, card }; })()`);
  const light = await contrast();
  check('light theme: every name passes AA (4.5:1)', light.min >= 4.5, light);
  await editStorage(`s => { s.settings.theme = 'dark'; }`); await go('projects/connections');
  const dark = await contrast();
  check('dark theme: every name passes AA on the dark card; no dot drawn black or white', dark.min >= 4.5 && dark.black === 0 && dark.white === 0 && dark.card !== light.card, dark);
  await editStorage(`s => { s.settings.theme = 'light'; }`);

  console.log('\n[6] Phones');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await go('projects/connections');
  check('phone: no sideways scrolling', !(await ev('document.documentElement.scrollWidth > innerWidth')));
  const LP = await labelCheck();
  check('phone: names still don\'t overlap and stay at least 13 px', LP.overlaps === 0 && LP.onDots === 0 && LP.out === 0 && LP.small === 0, LP);
  check('phone: the three tabs fit, each at least 44 px tall', await ev(`[...document.querySelectorAll('[role=tab]')].every(t => t.getBoundingClientRect().height >= 44 && t.scrollWidth <= t.clientWidth + 1)`));
  await ev('scrollTo(0, 0)');
  await tap('[data-s=kg-node][data-id=pjA]'); await sleep(700);
  check('phone: choosing a dot brings its details into view', await ev(`(() => { const r = document.getElementById('kg-panel')?.getBoundingClientRect(); return !!r && r.top >= 0 && r.top < innerHeight - 120; })()`));
  check('phone: every dot is easy to tap (at least 24 px)', await ev(`[...document.querySelectorAll('[data-s=kg-node]')].every(g => g.querySelector('circle').getBoundingClientRect().width >= 24)`));
  await send('Emulation.clearDeviceMetricsOverride');

  const s = T.summary();
  console.log(`\n${s.pass} passed, ${s.fail} failed`);
  process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
