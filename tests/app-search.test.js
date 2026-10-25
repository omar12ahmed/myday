// Search everywhere in the new app (specs/search-everywhere.md): the header's Search button and the / key, the one
// field (focused, its words kept in the address, Back returning to the results), the results in their fixed section
// order with counts and the heading read out, each kind of link opening its item (a task, the calendar on its day, a
// kept word brought into view, the Finance expenses card, a course lesson), private projects and notes never found
// (and the page saying so), Escape clearing the field, phones (no sideways scroll, 44 px targets), no page errors; and
// with MYDAY_SHOTS set to a folder, screenshots of the results for design review (light and dark, desktop and phone).
const fs = require('fs');
const T = require('./cdp.js');
const { openAt, ev, click, exists, text, check, sleep, send } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const SHOTS = process.env.MYDAY_SHOTS || ''; // (only when asked for: a folder outside the repository)
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const go = async (hash, y = 2026, m = 10, d = 25, h = 9, mi = 0) => { T.setUrl(APP + '#' + hash); await openAt(y, m, d, h, mi); };
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const type = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
const until = async (js, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(js)) return true; await sleep(100); } return false; };
const hash = () => ev('location.hash');
const key = async (k, code, vk, txt) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, ...(txt && type === 'keyDown' ? { text: txt } : {}) }); await sleep(150); };
const slash = () => key('/', 'Slash', 191, '/');
const active = () => ev(`(() => { const a = document.activeElement; return a ? (a.id || a.tagName) : ''; })()`);
const sections = () => ev(`[...document.querySelectorAll('[data-s=search-section]')].map(s => ({ section: s.dataset.section, head: s.querySelector('h3').textContent.trim(), n: s.querySelectorAll('[data-s=search-hit]').length }))`);
const hits = () => ev(`document.querySelectorAll('[data-s=search-hit]').length`);
const searchFor = async word => { await go('search'); await type('#searchAll', word); await until(`document.querySelectorAll('[data-s=search-hit]').length > 0`); };
const shot = async name => { fs.mkdirSync(SHOTS, { recursive: true }); fs.writeFileSync(`${SHOTS}/${name}.png`, Buffer.from((await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })).data, 'base64')); };

const AT = '2026-10-01T09:00';
const P = (id, title, x = {}) => ({ id, title, summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: AT, updatedAt: AT, ...x });
const TK = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: AT, postponed: 0, blockers: [], letGoOn: null, ...x });
const world = s => {
  s.tasks.lists = [{ id: 'tlH', name: 'Home jobs' }];
  s.projects.items = [
    P('pjShed', 'Garden shed', { summary: 'Lighting the shed with a lantern' }),
    P('pjHush', 'Hush plans', { private: true, summary: 'Order quokka paint' }),
  ];
  s.tasks.items = [
    TK('tkOil', 'Buy lantern oil', { listId: 'tlH' }),
    TK('tkPaid', 'Pay lantern deposit', { done: true, doneOn: '2026-10-10' }),
    TK('tkHang', 'Hang the lantern', { projectId: 'pjShed' }),
    TK('tkHush', 'Order quokka paint', { projectId: 'pjHush' }),
    TK('tkA', 'Water the plants'), TK('tkB', 'Post a letter'), TK('tkC', 'Book a haircut'),
  ];
  s.notes.items = [
    { id: 'nFest', title: 'Lantern festival', text: 'Meet by the bridge at dusk', categoryId: 'inbox', createdAt: AT, updatedAt: AT },
    { id: 'nPriv', title: 'Quokka plans', text: 'Keep it quiet', categoryId: 'inbox', private: true, createdAt: AT, updatedAt: AT },
  ];
  s.commitments = [{ id: 'cmFest', kind: 'appointment', title: 'Lantern festival tickets', start: '2026-11-03T18:00', end: '2026-11-03T19:00' }];
  s.arabic.words = [{ id: 'kwlantern1', ar: 'فَانُوس', meaning: 'lantern', addedOn: '2026-10-01', recognise: { reps: 0, interval: 0, lapses: 0, due: '2026-10-02' }, write: null }];
  s.finance.expenses = [{ id: 'exL', name: 'Lantern insurance', amount: 12 }];
  s.health.workout.exercises = [{ id: 'exCarry', name: 'Lantern carry', type: 'bodyweight', archived: false }];
};
const seed = async () => { const s = await T.data(); world(s); await ev(`localStorage.setItem('${KEY}', ${JSON.stringify(JSON.stringify(s))})`); };
const WORD = 'lantern';

(async () => {
  await T.connect();
  await T.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });
  await T.send('Emulation.setLocaleOverride', { locale: 'en-GB' });

  await go('today'); // (the browser profile is new and empty; the app writes its starting data on opening)
  await until(`!!localStorage.getItem('${KEY}')`);
  await seed();
  await go('today');

  console.log('\n[1] The header button');
  for (const s of ['today', 'projects', 'calendar', 'study', 'finance', 'health']) {
    await go(s);
    const b = await ev(`(() => { const a = document.querySelector('[data-action=search-open]'); if (!a) return null; const r = a.getBoundingClientRect(); return { label: a.getAttribute('aria-label'), w: r.width, h: r.height }; })()`);
    check(`on #${s} there is a "Search MyDay" button at least 44 × 44`, !!b && b.label === 'Search MyDay' && b.w >= 44 && b.h >= 44, b);
  }
  await go('today');
  await click('[data-action=search-open]');
  check('clicking it goes to #search', await until(`location.hash === '#search'`), await hash());
  check('the header says "Search"', (await text('#screenName')).trim() === 'Search', await text('#screenName'));
  check('the search field is focused', await until(`document.activeElement && document.activeElement.id === 'searchAll'`), await active());

  console.log('\n[2] The / key');
  await go('today');
  await ev('document.activeElement && document.activeElement.blur()');
  await slash();
  check('on Today, with nothing focused, / goes to #search with the field focused', (await hash()) === '#search' && (await until(`document.activeElement && document.activeElement.id === 'searchAll'`)), [await hash(), await active()]);
  await go('today/tasks');
  await ev(`document.getElementById('taskSearch').focus()`);
  await slash();
  check('typing in the Tasks search field, / types a slash and the page stays', (await ev(`document.getElementById('taskSearch').value`)) === '/' && (await hash()) === '#today/tasks', [await ev(`document.getElementById('taskSearch').value`), await hash()]);
  await go('today');
  await click('[data-action=capture-open]');
  await until(`!!document.getElementById('captureText')`);
  await ev(`document.getElementById('captureText').focus()`);
  await slash();
  check('typing in + Capture\'s text area, / types a slash and the page stays', (await ev(`document.getElementById('captureText').value`)) === '/' && (await hash()) === '#today', [await ev(`document.getElementById('captureText').value`), await hash()]);

  console.log('\n[3] Results');
  await go('search');
  const h0 = await ev('history.length');
  for (const part of ['l', 'la', 'lan', 'lant', 'lante', 'lanter', 'lantern']) await type('#searchAll', part);
  await until(`document.querySelectorAll('[data-s=search-hit]').length > 0`);
  check('the heading counts every match and quotes the word', (await text('#searchCount')).trim() === '9 matches for “lantern”', await text('#searchCount'));
  const secs = await sections();
  check('sections come in the fixed order, only those with matches', eq(secs.map(s => s.section), ['tasks', 'projects', 'notes', 'calendar', 'study', 'finance', 'health']), secs);
  check('each heading reads like "Tasks · 3"', eq(secs.map(s => s.head), ['Tasks · 3', 'Projects · 1', 'Notes · 1', 'Calendar · 1', 'Study · 1', 'Finance · 1', 'Health · 1']), secs);
  check('the address becomes #search?q=lantern', (await hash()) === '#search?q=lantern', await hash());
  check('typing several letters added no history entries', (await ev('history.length')) === h0, [h0, await ev('history.length')]);

  console.log('\n[4] Opening a result, and Back');
  await click('[data-s=search-hit] a[href="#today/tasks/tkOil"]');
  check('clicking a task result opens that task\'s page', await until(`location.hash === '#today/tasks/tkOil'`), await hash());
  check('…and its page shows', await until(`!!document.getElementById('taskEditor')`));
  await ev('history.back()');
  check('Back returns to #search?q=lantern', await until(`location.hash === '#search?q=lantern'`), await hash());
  check('…the field holds the word and the results are shown again', await until(`document.getElementById('searchAll') && document.getElementById('searchAll').value === 'lantern' && document.querySelectorAll('[data-s=search-hit]').length === 9`), [await ev(`(document.getElementById('searchAll')||{}).value`), await hits()]);

  console.log('\n[5] Calendar');
  await click('[data-s=search-hit] a[href="#calendar/2026-11-03"]');
  check('the appointment result opens #calendar/2026-11-03', await until(`location.hash === '#calendar/2026-11-03'`), await hash());
  check('…with that day selected: the day panel shows the appointment\'s title', await until(`(document.getElementById('detailsCard') || { textContent: '' }).textContent.includes('Lantern festival tickets')`), (await text('#detailsCard')).slice(0, 200));

  console.log('\n[6] Kept word');
  await searchFor(WORD);
  await click('[data-s=search-hit][data-kind="Kept word"] a');
  check('the kept-word result opens #study/arabic/vocabulary', await until(`location.hash === '#study/arabic/vocabulary'`), await hash());
  check('…and that word\'s row is focused', await until(`document.activeElement && document.activeElement.getAttribute('data-ar-kept') === 'kwlantern1'`, 4500), await ev(`document.activeElement ? document.activeElement.outerHTML.slice(0, 120) : ''`));

  console.log('\n[7] Finance');
  await searchFor(WORD);
  await click('[data-s=search-hit][data-kind="Monthly expense"] a');
  check('the expense result opens #finance', await until(`location.hash === '#finance'`), await hash());
  check('…and the monthly expenses card is focused', await until(`document.activeElement && document.activeElement.id === 'expensesCard'`, 4500), await active());

  console.log('\n[8] Private');
  await go('search'); await type('#searchAll', 'quokka');
  await until(`/Nothing in MyDay/.test(document.getElementById('searchCount').textContent)`);
  check('searching a private word finds nothing and says so', (await text('#searchCount')).trim() === 'Nothing in MyDay matches “quokka”', await text('#searchCount'));
  check('…no result mentions it', (await hits()) === 0 && !(await ev(`/quokka/i.test([...document.querySelectorAll('[data-s=search-hit]')].map(h => h.textContent).join(' '))`)));
  check('the page says private projects and notes aren\'t searched here', await ev(`document.getElementById('search').innerText.includes('Private projects and notes aren’t searched here')`));
  check('…and that line is marked [data-s=search-private]', await exists('[data-s=search-private]'));
  await editStorage(`s => { s.projects.items = s.projects.items.filter(p => !p.private); s.tasks.items = s.tasks.items.filter(t => t.projectId !== 'pjHush'); s.notes.items = s.notes.items.filter(n => !n.private); }`);
  await go('search?q=quokka');
  check('in a world with nothing private, that line is not shown', !(await exists('[data-s=search-private]')) && !(await ev(`document.getElementById('search').innerText.includes('aren’t searched here')`)) && (await text('#searchCount')).includes('Nothing in MyDay'), await text('#searchCount'));
  await seed();

  console.log('\n[9] Course lessons');
  await go('search');
  await type('#searchAll', 'What Fuṣḥā means and where it is used');
  check('a real Arabic lesson\'s title finds an "Arabic lesson" result once the course index has loaded', await until(`!!document.querySelector('[data-s=search-hit][data-kind="Arabic lesson"]')`, 15000), await sections());
  await click('[data-s=search-hit][data-kind="Arabic lesson"] a');
  check('clicking it opens that lesson', await until(`location.hash === '#study/arabic/lesson.arabic-fusha-register'`), await hash());

  console.log('\n[10] Escape');
  await searchFor(WORD);
  await ev(`document.getElementById('searchAll').focus()`);
  await key('Escape', 'Escape', 27);
  check('Escape in the field clears it', await until(`document.getElementById('searchAll').value === ''`), await ev(`document.getElementById('searchAll').value`));
  check('…and the results go', (await hits()) === 0 && (await sections()).length === 0 && (await hash()) === '#search', [await hits(), await hash()]);

  console.log('\n[11] Phones');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await go(`search?q=${WORD}`);
  await until(`document.querySelectorAll('[data-s=search-hit]').length === 9`);
  const w = await ev(`({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })`);
  check('phone: with results on screen nothing scrolls sideways', w.sw <= w.cw, w);
  const small = await ev(`[...document.querySelectorAll('[data-s=search-hit] a')].map(a => ({ t: a.textContent.trim().slice(0, 30), h: Math.round(a.getBoundingClientRect().height) })).filter(x => x.h < 44)`);
  check('phone: every result link is at least 44 px tall', (await hits()) === 9 && small.length === 0, small);

  if (SHOTS) console.log('\n[screenshots] (not checks)');
  if (SHOTS) for (const [name, w2, h2, dsf, mobile] of [['desktop', 1366, 900, 1, false], ['phone', 390, 844, 2, true]]) {
    await T.send('Emulation.setDeviceMetricsOverride', { width: w2, height: h2, deviceScaleFactor: dsf, mobile });
    for (const theme of ['light', 'dark']) {
      await editStorage(`s => { s.settings.theme = '${theme}'; }`);
      await go(`search?q=${WORD}`);
      await until(`document.querySelectorAll('[data-s=search-hit]').length === 9`);
      await shot(`${name}-${theme}`);
      console.log(`  saved ${SHOTS}/${name}-${theme}.png`);
    }
  }
  await editStorage(`s => { s.settings.theme = 'light'; }`);
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[12] Page errors');
  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no page errors during the whole test', errs.length === 0, errs.slice(0, 3));

  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const sm = T.summary(); console.log(`${sm.pass} passed, ${sm.fail} failed before the error`); process.exit(2); });
