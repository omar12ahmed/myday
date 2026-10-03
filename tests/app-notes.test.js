// Notes in the new app: reached from Today (the bar stays at five sections), the starter categories, writing a note
// (saved as you type, kept after a reload), an empty note left behind removed, search, categories (rename, add,
// reorder, remove — notes move to "Other", never deleted), pinning, deleting, saved data (older data without Notes,
// damaged entries counted, export/import, the current MyDay keeping Notes), and layout.
const fs = require('fs');
const T = require('./cdp.js');
const { openAt, ev, click, exists, text, data, setFile, check, sleep, S } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const go = async (hash, y, m, d, h = 9, mi = 0, url = APP) => { T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi); };
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
// Types into a field the way a person does (React sees each keystroke as input).
const type = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
// Leaving a box the way a person does: the cursor was in it, then goes elsewhere.
// (Headless Chrome has no focused window, so it sends the event a browser sends then — "focusout" — itself.)
const blur = sel => ev(`document.querySelector(${JSON.stringify(sel)}).dispatchEvent(new FocusEvent('focusout', { bubbles: true }))`);
const dialogText = async () => { await sleep(250); return ev(`(document.querySelector('[data-action=dialog-confirm]')?.closest('dialog, [role=dialog], [aria-modal]') || document.body).textContent`); };
const answer = async yes => { await sleep(150); await click(yes ? '[data-action=dialog-confirm]' : '[data-action=dialog-cancel]'); await sleep(200); };
const notes = async () => (await data()).notes;
const catId = async name => (await notes()).categories.find(c => c.name === name).id;
const hash = () => ev('location.hash');

(async () => {
  await T.connect();
  await T.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });
  await T.send('Emulation.setLocaleOverride', { locale: 'en-GB' });

  console.log('\n[1] On Today, and the bar stays at five sections');
  await go('today', 2026, 10, 15); await reset(); await go('today', 2026, 10, 15);
  check('the bar is unchanged (Today, Calendar, Finance, Health, Study)', eq(await ev(`[...document.querySelectorAll('#nav .nav-item')].map(a => a.textContent.trim())`), ['Today', 'Calendar', 'Finance', 'Health', 'Study']));
  check('Today has a Notes card with "New note" and "All notes"', (await exists('#notesCard [data-action=note-new]')) && (await exists('#notesCard [data-action=notes-open]')));
  await click('#notesCard [data-action=notes-open]'); await sleep(300);
  check('"All notes" opens the Notes screen, with Today still marked in the bar', (await hash()) === '#notes' && (await ev(`document.querySelector('#nav [aria-current=page]').textContent.trim()`)) === 'Today');
  check('the starter categories: Lifestyle, Business ideas, Health & fitness, Money, Study & career, Personal',
    eq(await ev(`[...document.querySelectorAll('[data-s=note-cat]')].map(b => b.firstChild.textContent.trim())`), ['All', 'Lifestyle', 'Business ideas', 'Health & fitness', 'Money', 'Study & career', 'Personal']));
  check('an empty list says what goes here', (await text('#app')).includes('Nothing here yet'));

  console.log('\n[2] Writing a note: saved as you type, kept after a reload');
  await click('[data-s=note-cat][data-id="' + (await catId('Business ideas')) + '"]'); await sleep(150);
  await click('[data-action=note-new]'); await sleep(300);
  check('"New note" (from Business ideas) opens an empty note in that category', /^#notes\/nt/.test(await hash()) && (await ev(`document.getElementById('noteCat').selectedOptions[0].textContent`)) === 'Business ideas');
  await type('#noteTitle', 'Coffee van');
  await type('#noteText', 'Weekend coffee van at the market.\nCosts: van, machine, licence.');
  check('…it says "Saving…" while you type', (await text('[data-s=note-status]')) === 'Saving…');
  await sleep(900);
  let n = (await notes()).items[0];
  check('…and is saved a moment after you stop', n && n.title === 'Coffee van' && n.text.startsWith('Weekend coffee van') && (await text('[data-s=note-status]')) === 'Saved', n);
  check('…with when it was written and changed', n.createdAt === '2026-10-15T09:00' && n.updatedAt === '2026-10-15T09:00');
  await type('#noteText', 'Weekend coffee van at the market.\nCosts: van, machine, licence, insurance.');
  await blur('#noteText'); await sleep(100);
  check('leaving the box saves straight away', (await notes()).items[0].text.endsWith('insurance.'));
  const id = n.id;
  await go(`notes/${id}`, 2026, 10, 15, 9, 5);
  check('after a reload the note is exactly as written', (await ev(`document.getElementById('noteTitle').value`)) === 'Coffee van' && (await ev(`document.getElementById('noteText').value`)).endsWith('insurance.'));
  await type('#noteCat', await catId('Money'));
  check('changing its category saves it', (await notes()).items[0].categoryId === (await catId('Money')));
  await click('[data-action=note-pin]'); await sleep(200);
  check('pinning saves it (and doesn\'t count as changing the note)', (await notes()).items[0].pinned === true && (await notes()).items[0].updatedAt === '2026-10-15T09:05');

  console.log('\n[3] An empty note isn\'t left behind');
  await go('notes', 2026, 10, 15, 10);
  await click('[data-action=note-new]'); await sleep(300);
  const emptyId = (await hash()).split('/')[1];
  check('"New note" makes a note', (await notes()).items.some(x => x.id === emptyId));
  await ev(`location.hash = 'notes'`); await sleep(300);
  check('…leaving it empty removes it', !(await notes()).items.some(x => x.id === emptyId) && (await notes()).items.length === 1);

  console.log('\n[4] Finding notes: categories, search, pinned first');
  await go('today', 2026, 10, 15, 11);
  await click('#notesCard [data-action=note-new]'); await sleep(300);
  check('"New note" on Today goes straight to a new note (in the first category)', (await ev(`document.getElementById('noteCat').selectedOptions[0].textContent`)) === 'Lifestyle');
  await type('#noteText', 'Morning walk before work, 20 minutes');
  await ev(`location.hash = 'notes'`); await sleep(400);
  check('the list shows both, pinned first', eq(await ev(`[...document.querySelectorAll('#noteList .note-row')].map(a => a.querySelector('.font-semibold').textContent)`), ['Coffee van', 'Morning walk before work, 20 minutes']));
  check('…each with its category and when it changed', (await text('#noteList')).includes('Money · today 09:05') && (await text('#noteList')).includes('Lifestyle · today 11:00'));
  await type('#noteSearch', 'LICENCE');
  check('search finds words in the text, in any case', (await ev(`document.querySelectorAll('#noteList .note-row').length`)) === 1);
  await type('#noteSearch', 'nothing like this');
  check('…and says when nothing matches', (await text('#app')).includes('No notes match'));
  await type('#noteSearch', '');
  await click('[data-s=note-cat][data-id="' + (await catId('Lifestyle')) + '"]'); await sleep(150);
  check('a category shows only its notes, with counts on each', (await ev(`document.querySelectorAll('#noteList .note-row').length`)) === 1 && (await text('[data-s=note-cat][data-id=all]')).includes('2'));

  console.log('\n[5] Categories: rename, add, reorder, remove (notes move to "Other", never deleted)');
  await click('[data-action=note-categories]'); await sleep(300);
  check('"Edit categories" opens them', (await hash()) === '#notes/categories' && (await ev(`document.querySelectorAll('#noteCats .ncat-row').length`)) === 6);
  await type('#noteCats .ncat-row:nth-child(2) input', 'Side hustles'); await sleep(150);
  check('renaming saves', (await notes()).categories[1].name === 'Side hustles');
  await type('#ncatNew', 'Travel'); await click('[data-action=ncat-add]'); await sleep(200);
  check('adding one puts it at the end', (await notes()).categories.at(-1).name === 'Travel');
  await type('#ncatNew', 'travel'); await click('[data-action=ncat-add]'); await sleep(200);
  check('…the same name twice is refused', (await notes()).categories.filter(c => /travel/i.test(c.name)).length === 1 && (await text('#toast')).includes('already used'));
  await click('#noteCats .ncat-row:nth-child(7) [data-action=ncat-up]'); await sleep(150);
  check('moving one up', (await notes()).categories[5].name === 'Travel');
  const before = (await notes()).items.length;
  await click('#noteCats .ncat-row:nth-child(4) [data-action=ncat-remove]'); // Money (has the coffee van note)
  check('removing a category with notes says where they go', (await dialogText()).includes('Its note moves to “Other”. No notes are deleted.'));
  await answer(true);
  const after = await notes();
  check('…they move to "Other" (made for them); no note is deleted', !after.categories.some(c => c.name === 'Money') && after.categories.at(-1).name === 'Other' && after.items.length === before && after.items.find(x => x.title === 'Coffee van').categoryId === after.categories.at(-1).id);

  console.log('\n[6] Deleting a note asks first');
  await go(`notes/${id}`, 2026, 10, 15, 12);
  await click('[data-action=note-delete]'); await answer(false);
  check('"Keep it" keeps it', (await notes()).items.some(x => x.id === id));
  await click('[data-action=note-delete]'); await answer(true);
  check('"Delete" deletes it, and goes back to the list', !(await notes()).items.some(x => x.id === id) && (await hash()) === '#notes');

  console.log('\n[7] Saved data: older data, damaged entries, export/import, and the current MyDay keeping Notes');
  await go('today', 2026, 10, 15, 13); await reset();
  await go('today', 2026, 10, 15, 13);
  await click('#themeBtn'); await sleep(250); // a first save, so there's saved data to edit
  await editStorage(`s => { delete s.notes; }`);
  await go('notes', 2026, 10, 15, 13, 1);
  check('data saved before Notes existed opens with the starter categories (nothing reported as unreadable)', (await ev(`document.querySelectorAll('[data-s=note-cat]').length`)) === 7 && !(await exists('.load-issue')));
  await click('[data-action=note-new]'); await sleep(300); await type('#noteText', 'Ask about the Spanish evening class'); await blur('#noteText'); await sleep(100);
  await editStorage(`s => { s.notes.items.push({ id: 'bad1' }, 'nonsense', { title: 'no id' }); s.notes.categories.push({ id: 'c-x' }); s.notes.futureField = { kept: true }; }`);
  await go('notes', 2026, 10, 15, 13, 2);
  check('damaged note entries are counted, never left out silently', (await text('#load-issue-h')).includes("couldn't be read") && (await ev(`document.querySelectorAll('#noteList .note-row').length`)) === 2, await text('#load-issue-h'));
  await click('#themeBtn'); await sleep(250); await click('#themeBtn'); await sleep(250); await click('#themeBtn'); await sleep(250); // the next saves
  let nd = await notes();
  check('…after the next save: good notes kept, unknown Notes fields kept', nd.items.some(x => x.text === 'Ask about the Spanish evening class') && eq(nd.futureField, { kept: true }));
  for (const x of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + x);
  await click('[data-action=export]'); await sleep(1200);
  const exported = JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-10-15.json', 'utf8'));
  check('"Export my data" includes Notes', eq(exported.data.notes, (await notes())));
  await reset(); await go('today', 2026, 10, 15, 14);
  await setFile(S + '/dl/myday-export-2026-10-15.json'); await sleep(200); await answer(true);
  check('importing it brings Notes back exactly', eq((await notes()), exported.data.notes));
  const savedNew = await ev(`localStorage.getItem('${KEY}')`);
  T.setUrl('index.html#today'); await openAt(2026, 10, 15, 15);
  await click('#themeBtn'); await sleep(250); await click('#themeBtn'); await sleep(250); await click('#themeBtn'); await sleep(250); // the current MyDay saves three times
  const savedLive = JSON.parse(await ev(`localStorage.getItem('${KEY}')`));
  check('the current MyDay opens and saves this data, keeping Notes exactly as they were', eq(savedLive.notes, JSON.parse(savedNew).notes));

  console.log('\n[8] Layout');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const [where, theme] of [['notes', 'dark'], ['notes', 'light'], ['notes/categories', 'dark']]) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    await go(where, 2026, 10, 15, 16);
    check(`phone, ${where} (${theme}): nothing scrolls sideways`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
  }
  await go('notes', 2026, 10, 15, 16, 1);
  const noteId = (await notes()).items[0].id;
  for (const where of ['notes', `notes/${noteId}`, 'notes/categories']) {
    await go(where, 2026, 10, 15, 16, 2);
    const small = await ev(`[...document.querySelectorAll('#app button, #app input, #app select, #app textarea, #app .note-row, #app a[data-action]')].filter(b => b.offsetParent !== null).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.id || b.className).trim().slice(0, 24), h: Math.round(r.height), w: Math.round(r.width) }; }).filter(x => x.h < 44 || x.w < 44)`);
    check(`phone, ${where}: every button, link and field is at least 44 px`, small.length === 0, small.slice(0, 5));
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
