// Understand & connect in the new app (1.13.0, part 1 — on the device, no AI): MyDay putting notes that clearly
// belong to a project into it by itself (only links; nothing you wrote changes), "MyDay connected these" with Keep,
// Undo (never put back in that project) and Keep all, the note you have open left until you leave it, Capture saying
// where a note went, the note editor (who connected it and why, "Looks like it belongs in…", related notes, choosing a
// project yourself, Keep private), the project page ("connected by MyDay", "Might belong here"), the Notes Inbox (notes
// in a project have been put somewhere), saved data (the current MyDay keeping the new fields) and phone layout.
const T = require('./cdp.js');
const { openAt, ev, click, exists, text, data, check, sleep } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const go = async (hash, y, m, d, h = 9, mi = 0, url = APP) => { T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi); };
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const type = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const until = async (js, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(js)) return true; await sleep(100); } return false; };
const note = async id => (await data()).notes.items.find(n => n.id === id);
const toast = () => text('#toast');
const CONNECT_WAIT = 2600; // MyDay connects a moment (1.5 s) after things settle
const P = (id, title, summary) => ({ id, title, summary, stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00' });
const N = (id, text) => ({ id, categoryId: '', title: '', text, pinned: false, createdAt: '2026-10-02T09:00', updatedAt: '2026-10-02T09:00' });
const seed = `s => {
  s.projects = { items: [${JSON.stringify(P('pjCoffee', 'Coffee subscription for offices', 'Fresh coffee beans delivered to small offices every fortnight, priced per kilo.'))},
    ${JSON.stringify(P('pjArabic', 'Learn Arabic for travel', 'Basic Arabic conversation and the alphabet before the trip to Jordan.'))}] };
  s.notes.items = [${[N('n1', 'Competitors: Pact coffee and Grind deliver coffee to offices'), N('n2', 'Roasters: two local roasters sell beans per kilo for about £12'),
    N('n3', 'The office coffee machine broke again'), N('n4', 'Coffee with Sam on Friday'), N('n5', 'Arabic alphabet: 28 letters, practise writing them before Jordan'),
    N('n6', 'Wifi password is in the kitchen drawer')].map(x => JSON.stringify(x)).join(',')}];
}`;

(async () => {
  await T.connect();
  await T.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });
  await T.send('Emulation.setLocaleOverride', { locale: 'en-GB' });

  console.log('\n[1] MyDay connects notes that clearly belong to a project, by itself');
  await go('today', 2026, 10, 15); await reset(); await go('today', 2026, 10, 15);
  await editStorage(seed);
  const before = (await data()).notes.items;
  await go('projects/notes', 2026, 10, 15, 9, 5); await sleep(CONNECT_WAIT);
  let d = await data();
  const linked = Object.fromEntries(d.notes.items.filter(n => n.projectId).map(n => [n.id, n.projectId]));
  check('the clear ones are linked (competitors, roasters, coffee machine → coffee; alphabet → Arabic)', eq(linked, { n1: 'pjCoffee', n2: 'pjCoffee', n3: 'pjCoffee', n5: 'pjArabic' }), linked);
  check('…"Coffee with Sam" (one word in common) and the wifi password aren\'t', !d.notes.items.find(n => n.id === 'n4').projectId && !d.notes.items.find(n => n.id === 'n6').projectId);
  check('each says MyDay linked it, and why in the note\'s own words', (await note('n1')).linkedBy === 'rules' && (await note('n1')).linkWhy === 'coffee · offices · deliver', await note('n1'));
  check('only links: every note\'s words, place and "changed" time are as they were', d.notes.items.every(n => { const b = before.find(x => x.id === n.id); return b.text === n.text && b.title === n.title && b.categoryId === n.categoryId && b.updatedAt === n.updatedAt; }));
  check('…and no project is marked as changed', d.projects.items.every(p => p.updatedAt === '2026-10-01T09:00'));
  check('"MyDay connected these" lists all four, each with where and why', (await ev(`document.querySelectorAll('#noteConnected [data-s=connected]').length`)) === 4 && (await text('#noteConnected')).includes('→ Coffee subscription for offices') && (await text('#noteConnected')).includes('both mention “coffee”, “offices” and “deliver”'));
  check('…and says nothing you wrote was changed', (await text('#noteConnected')).includes('Only links: nothing you wrote was changed.'));
  check('notes in a project have been put somewhere: the Inbox keeps the other two', (await text('#inbox-h')).includes('2'), await text('#inbox-h'));

  console.log('\n[2] Undo, Keep, Keep all');
  await click('#noteConnected [data-action=connected-undo][data-id=n3]'); await sleep(300);
  let n3 = await note('n3');
  check('Undo: out of the project, and MyDay remembers not to put it back', !n3.projectId && !n3.linkedBy && eq(n3.notProjects, ['pjCoffee']) && (await toast()).includes("won't put it back"));
  await sleep(CONNECT_WAIT);
  check('…a moment later it\'s still out', !(await note('n3')).projectId);
  await click('#noteConnected [data-action=connected-keep][data-id=n5]'); await sleep(300);
  check('Keep: the link stays and is yours; it leaves the list', (await note('n5')).projectId === 'pjArabic' && !(await note('n5')).linkedBy && (await ev(`document.querySelectorAll('#noteConnected [data-s=connected]').length`)) === 2);
  await click('[data-action=connected-keep-all]'); await sleep(300);
  check('Keep all: all kept; the card goes', !(await exists('#noteConnected')) && (await note('n1')).projectId === 'pjCoffee' && !(await note('n1')).linkedBy);

  console.log('\n[3] The note you have open is left until you leave it');
  await editStorage(`s => { s.notes.items.push(${JSON.stringify(N('n7', 'Ask the roasters if they deliver beans to offices'))}); }`);
  await go('projects/notes/n7', 2026, 10, 15, 9, 10); await sleep(CONNECT_WAIT);
  check('while it\'s open: not linked, but it says where it looks like it belongs', !(await note('n7')).projectId && (await text('[data-s=note-maybe]')).includes('Looks like it belongs in “Coffee subscription for offices”'));
  await ev(`location.hash = 'projects/notes'`); await sleep(CONNECT_WAIT);
  check('once you\'ve left it, MyDay connects it', (await note('n7')).projectId === 'pjCoffee' && (await note('n7')).linkedBy === 'rules');

  console.log('\n[4] In a note: who connected it, Undo; suggestions; related notes; choosing yourself');
  await go('projects/notes/n7', 2026, 10, 15, 9, 15);
  check('a note MyDay connected says so, with why', (await text('[data-s=note-linked]')).includes('MyDay connected this to “Coffee subscription for offices” — both mention'));
  await click('[data-action=note-link-undo]'); await sleep(300);
  check('Undo from the note', !(await note('n7')).projectId && eq((await note('n7')).notProjects, ['pjCoffee']) && !(await exists('[data-s=note-linked]')));
  check('…and the coffee project is no longer suggested for it', !(await exists('[data-s=note-maybe]')) || !(await text('[data-s=note-maybe]')).includes('Coffee subscription'));
  check('related notes: the ones sharing its words, with which words', (await ev(`[...document.querySelectorAll('#noteRelated [data-s=related-note]')].map(a => a.dataset.id)`)).includes('n2') && (await text('#noteRelated')).includes('both mention'), await ev(`[...document.querySelectorAll('#noteRelated [data-s=related-note]')].map(a => a.dataset.id)`));
  await type('#noteProject', 'pjCoffee'); await sleep(300);
  n3 = await note('n7');
  check('choosing the project yourself puts it back (your choice wins over Undo), as your link', n3.projectId === 'pjCoffee' && !n3.linkedBy && !('notProjects' in n3));
  await type('#noteProject', 'pjArabic'); await sleep(300);
  n3 = await note('n7');
  check('moving it to another project yourself: MyDay won\'t move it back', n3.projectId === 'pjArabic' && eq(n3.notProjects, ['pjCoffee']));
  await go('projects/notes/n4', 2026, 10, 15, 9, 20);
  check('a near-miss offers its project ("Might belong in…")', (await text('[data-s=note-maybe]')).includes('Might belong in “Coffee subscription for offices”') && (await text('[data-s=note-maybe]')).includes('both mention “coffee”'));
  await click('[data-action=note-maybe-add]'); await sleep(300);
  check('…one tap adds it (your link)', (await note('n4')).projectId === 'pjCoffee' && !(await note('n4')).linkedBy);

  console.log('\n[5] Private');
  await click('[data-action=note-private]'); await sleep(300);
  check('"Keep private": saved, said plainly — AI help never reads it; it still syncs with your account', (await note('n4')).private === true && (await toast()).includes('AI help will never read this note') && (await text('#noteEditor')).includes('still saved to your account'));
  check('…the words and "changed" time stay as they were', (await note('n4')).text === 'Coffee with Sam on Friday' && (await note('n4')).updatedAt === '2026-10-02T09:00');
  await click('[data-action=note-private]'); await sleep(300);
  check('…and off again', !('private' in (await note('n4'))));

  console.log('\n[6] Capture says where a note went');
  await go('calendar', 2026, 10, 15, 10);
  await click('[data-action=capture-open]'); await sleep(200);
  await type('#captureText', 'Alphabet flashcards for the Jordan trip: practise Arabic letters daily');
  await until(`!document.querySelector('#captureChoices [role=status]')`); await sleep(150);
  await click('[data-action=capture-note]'); await sleep(400);
  const fresh = (await data()).notes.items.find(n => n.text.startsWith('Alphabet flashcards'));
  check('a note that clearly belongs to a project is connected straight away, and the message says so', fresh && fresh.projectId === 'pjArabic' && fresh.linkedBy === 'rules' && (await toast()).includes('connected to “Learn Arabic for travel”'), [fresh, await toast()]);

  console.log('\n[7] On the project');
  await editStorage(`s => { s.notes.items.push(${JSON.stringify(N('n10', 'Compare coffee beans prices for small offices'))}); }`);
  await go('projects/p/pjCoffee', 2026, 10, 15, 10, 5); await sleep(CONNECT_WAIT);
  check('notes MyDay connected are marked on the project', (await note('n10')).linkedBy === 'rules' && (await exists('#projectNotes [data-s=by-myday]')) && (await text('#projectNotes')).includes('connected by MyDay'));
  await editStorage(`s => { s.notes.items.push(${JSON.stringify(N('n8', 'Bought a new coffee grinder'))}); }`);
  await go('projects/p/pjCoffee', 2026, 10, 15, 10, 10); await sleep(400);
  check('"Might belong here": a near-miss, with one tap to add', (await ev(`[...document.querySelectorAll('#projectMaybe [data-s=maybe]')].map(li => li.dataset.id)`)).includes('n8'));
  await click('#projectMaybe [data-action=maybe-add][data-id=n8]'); await sleep(300);
  check('…added (your link)', (await note('n8')).projectId === 'pjCoffee' && !(await note('n8')).linkedBy);

  console.log('\n[8] Saved data');
  const savedNew = await ev(`localStorage.getItem('${KEY}')`);
  T.setUrl('index.html#today'); await openAt(2026, 10, 15, 11);
  await click('#themeBtn'); await sleep(300); // one change, so the current MyDay saves
  const afterClassic = JSON.parse(await ev(`localStorage.getItem('${KEY}')`));
  check('the current MyDay keeps every note exactly, with its links, reasons, "not in" list and private mark', eq(afterClassic.notes, JSON.parse(savedNew).notes) && afterClassic.settings.theme !== JSON.parse(savedNew).settings.theme);

  console.log('\n[9] Layout');
  await go('projects/notes', 2026, 10, 15, 12); await reset(); await go('projects/notes', 2026, 10, 15, 12);
  await editStorage(seed); await editStorage(`s => { s.notes.items.push(${JSON.stringify(N('n9', 'A much longer note about coffee beans for offices, with plenty of words so that the reasons and the names have to wrap onto more lines on a narrow phone'))}); }`);
  await T.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 740, deviceScaleFactor: 2, mobile: true });
  for (const theme of ['dark', 'light']) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    for (const h of ['projects/notes', 'projects/notes/n1', 'projects/p/pjCoffee']) {
      await go(h, 2026, 10, 15, 12, 5); await sleep(CONNECT_WAIT);
      check(`phone 360 px (${theme}), #${h}: nothing scrolls sideways`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
    }
  }
  for (const h of ['projects/notes', 'projects/notes/n1']) {
    await go(h, 2026, 10, 15, 12, 10); await sleep(CONNECT_WAIT);
    const small = await ev(`[...document.querySelectorAll('#app button, #app a, #app select, #app input')].filter(b => b.getClientRects().length).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.id).trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.h < 44 || x.w < 44)`);
    check(`phone: every button, link and field on #${h} is at least 44 × 44 px`, small.length === 0, small.slice(0, 5));
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
