// The Inbox section and Capture in the new app: the bar's six sections, with Tasks and Notes tabs (Tasks has its own
// suite, app-tasks); Notes as an Inbox (nothing has to be filed),
// collections to file in later (a suggestion, or "Move to…"), a collection's own list, search across everything,
// editing collections (removing one puts its notes back in the Inbox), writing a note (saved as you type), an empty
// note not left behind, deleting; saved data (notes filed in 1.3.0 stay filed, older data without Notes, export and
// import, the current MyDay keeping Notes); Capture from any screen — a time → the Calendar, an action → Tasks (with its date),
// an idea → a collection, anything else → the Inbox, all only on a tap; and layout on phones and wide screens.
const fs = require('fs');
const T = require('./cdp.js');
const { openAt, ev, click, exists, text, data, setFile, check, sleep, S } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const go = async (hash, y, m, d, h = 9, mi = 0, url = APP) => { T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi); };
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const type = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const blur = sel => ev(`document.querySelector(${JSON.stringify(sel)}).dispatchEvent(new FocusEvent('focusout', { bubbles: true }))`);
const answer = async yes => { await sleep(200); await click(yes ? '[data-action=dialog-confirm]' : '[data-action=dialog-cancel]'); await sleep(250); };
const notes = async () => (await data()).notes;
const catId = async name => (await notes()).categories.find(c => c.name === name).id;
const hash = () => ev('location.hash');
const until = async (js, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(js)) return true; await sleep(100); } return false; };
// Capture: open it, type, and wait until the libraries have read it (the choices then match what was typed).
async function capture(textIn) {
  if (!(await exists('#captureSheet'))) { await click('[data-action=capture-open]'); await sleep(200); }
  await type('#captureText', textIn);
  await until(`!document.querySelector('#captureChoices [role=status]')`);
  await sleep(150);
}
const choices = () => ev(`[...document.querySelectorAll('#captureChoices [data-action^=capture-]')].filter(b => b.dataset.action !== 'capture-cancel').map(b => b.dataset.action.slice(8) + (b.getAttribute('type') === 'submit' ? '*' : ''))`);

(async () => {
  await T.connect();
  await T.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });
  await T.send('Emulation.setLocaleOverride', { locale: 'en-GB' });

  console.log('\n[1] Six sections; Projects and Notes together (the Inbox until 1.12.0), Tasks on Today');
  await go('today', 2026, 10, 15); await reset(); await go('today', 2026, 10, 15);
  check('the bar: Today, Calendar, Projects, Finance, Health, Study', eq(await ev(`[...document.querySelectorAll('#nav .nav-item')].map(a => a.textContent.trim())`), ['Today', 'Calendar', 'Projects', 'Finance', 'Health', 'Study']));
  check('Today no longer has its own Notes card (Capture is on every screen instead)', !(await exists('#notesCard')) && (await exists('[data-action=capture-open]')));
  await click('#nav a[href="#projects"]'); await sleep(300);
  check('Projects opens on your projects, with a Notes tab', (await exists('#projectNew')) && eq(await ev(`[...document.querySelectorAll('.section-tabs [role=tab]')].map(a => a.textContent + (a.getAttribute('aria-selected') === 'true' ? '*' : ''))`), ['Projects*', 'Notes']));
  await click('.section-tabs a[href="#projects/notes"]'); await sleep(300);
  check('the Notes tab: a search, an empty Inbox that says what it\'s for, and the starter collections', (await exists('#noteSearch')) && (await text('#noteInbox')).includes('no need to file it')
    && eq(await ev(`[...document.querySelectorAll('#noteCollections .ncol-row span:first-child')].map(s => s.textContent)`), ['Lifestyle', 'Business ideas', 'Health & fitness', 'Money', 'Study & career', 'Personal']));

  console.log('\n[2] Dumping a note: it goes to the Inbox, no filing needed');
  await click('[data-action=note-new]'); await sleep(300);
  check('"New note" opens a note in the Inbox', /^#projects\/notes\/nt/.test(await hash()) && (await ev(`document.getElementById('noteCat').selectedOptions[0].textContent`)) === 'Inbox');
  await type('#noteText', 'Weekend coffee van at the market — could be a side hustle');
  await sleep(900);
  let n = (await notes()).items[0];
  check('…saved as you type, with no collection', n.text.startsWith('Weekend coffee van') && n.categoryId === '' && (await text('[data-s=note-status]')) === 'Saved');
  await type('#noteText', 'Weekend coffee van at the market — could be a side hustle. Costs: van, machine, licence.');
  await blur('#noteText'); await sleep(100);
  check('leaving the box saves straight away', (await notes()).items[0].text.endsWith('licence.'));
  const id = n.id;
  await ev(`location.hash = 'projects/notes'`); await sleep(300);
  check('it\'s in the Inbox (1), with a one-tap suggestion from its words: "File in Business ideas"', (await text('#inbox-h')).includes('1') && (await text(`#noteInbox [data-action=note-file][data-id="${id}"]`)) === 'File in Business ideas');
  await click(`#noteInbox [data-action=note-file][data-id="${id}"]`); await sleep(300);
  n = (await notes()).items[0];
  check('…one tap files it — without counting as a change to the note', n.categoryId === (await catId('Business ideas')) && n.updatedAt === '2026-10-15T09:00' && (await text('#noteInbox')).includes('Your Inbox is clear'));
  await click(`#noteCollections a[href="#projects/notes/in/${await catId('Business ideas')}"]`); await sleep(300);
  check('the collection shows its notes', (await text('#noteCollection')).includes('Weekend coffee van'));
  await type(`[data-s=note-move][data-id="${id}"]`, '-'); await sleep(300);
  check('"Back to the Inbox" from a collection', (await notes()).items[0].categoryId === '');
  await go('notes', 2026, 10, 15, 9, 10);
  check('an old #notes link still opens Notes (in Projects since 1.12.0)', (await exists('#noteInbox')) && (await ev(`document.querySelector('#nav [aria-current=page]').textContent.trim()`)) === 'Projects' && (await hash()) === '#projects/notes');
  await type(`[data-s=note-move][data-id="${id}"]`, await catId('Money')); await sleep(300);
  check('"File it…" puts it in any collection', (await notes()).items[0].categoryId === (await catId('Money')));

  console.log('\n[3] Search, an empty note, deleting');
  await click('[data-action=note-new]'); await sleep(300);
  const emptyId = (await hash()).split('/')[2];
  await ev(`location.hash = 'projects/notes'`); await sleep(300);
  check('a new note left empty isn\'t kept', !(await notes()).items.some(x => x.id === emptyId));
  await type('#noteSearch', 'LICENCE');
  check('search looks in every note, in any case, and says where each is', (await ev(`document.querySelectorAll('#noteResults .note-row').length`)) === 1 && (await text('#noteResults')).includes('Money ·'));
  await type('#noteSearch', 'nothing like this');
  check('…and says when nothing matches', (await text('#noteResults')).includes('No notes match'));
  await type('#noteSearch', '');
  await go(`projects/notes/${id}`, 2026, 10, 15, 9, 20);
  await click('[data-action=note-delete]'); await answer(false);
  check('deleting asks first ("Keep it" keeps it)', (await notes()).items.some(x => x.id === id));

  console.log('\n[4] Collections: removing one puts its notes back in the Inbox');
  await go('projects/notes/collections', 2026, 10, 15, 9, 25);
  const moneyRow = await ev(`[...document.querySelectorAll('#noteCats .ncat-row')].findIndex(r => r.querySelector('input').value === 'Money') + 1`);
  await click(`#noteCats .ncat-row:nth-child(${moneyRow}) [data-action=ncat-remove]`);
  check('the question says its note goes back to the Inbox', (await ev(`document.querySelector('dialog[open]')?.textContent || ''`)).includes('Its note goes back to your Inbox. No notes are deleted.'));
  await answer(true);
  const nd = await notes();
  check('…it does: the collection goes, the note stays, now in the Inbox', !nd.categories.some(c => c.name === 'Money') && nd.items.find(x => x.id === id).categoryId === '');

  console.log('\n[5] Notes filed in 1.3.0 stay filed');
  await editStorage(`s => { s.notes.categories.push({ id: 'ncOther', name: 'Other' }); s.notes.items.push({ id: 'old1', categoryId: 'ncOther', title: 'Kept from 1.3.0', text: 'x', pinned: false, createdAt: '2026-10-04T10:00', updatedAt: '2026-10-04T10:00' }, { id: 'old2', categoryId: 'gone', title: 'Its collection is gone', text: 'y', pinned: false, createdAt: '2026-10-04T10:00', updatedAt: '2026-10-04T10:00' }); }`);
  await go('projects/notes', 2026, 10, 15, 9, 30);
  check('a note in a collection stays there; one whose collection has gone shows in the Inbox (nothing lost)', !(await text('#noteInbox')).includes('Kept from 1.3.0') && (await text('#noteInbox')).includes('Its collection is gone') && (await text('#noteCollections')).includes('Other'));

  console.log('\n[6] Capture, from any screen');
  await go('calendar', 2026, 10, 15, 10);
  await capture('call GP tomorrow at 10am');
  check('a time → "Add to Calendar — Friday 16 October, 10:00–10:30" first, with the task and Inbox as other choices', eq(await choices(), ['calendar*', 'task', 'note']) && (await text('[data-action=capture-calendar]')).includes('Friday 16 October, 10:00–10:30'), await choices());
  check('…and it shows what it spotted (the date and time)', (await text('[data-s=spotted-when]')).includes('Friday 16 October, 10:00'));
  const before = await data();
  check('nothing is added until you choose', eq(before.commitments, []) && before.queue.length === 0 && before.tasks.items.length === 0);
  await click('[data-action=capture-calendar]'); await sleep(400);
  let dd = await data();
  check('"Add to Calendar": an appointment, "Call GP", 10:00–10:30 tomorrow', dd.commitments.length === 1 && dd.commitments[0].kind === 'appointment' && dd.commitments[0].title === 'Call GP' && dd.commitments[0].start === '2026-10-16T10:00' && dd.commitments[0].end === '2026-10-16T10:30' && !(await exists('#captureSheet')));
  check('…and it says so', (await text('#toast')).includes('Added to your Calendar: Call GP'));
  await capture('renew passport');
  check('an action → "Add as a task — Admin" first', (await choices())[0] === 'task*' && (await text('[data-action=capture-task]')).includes('Admin'));
  await click('[data-s=capture-cat][data-id=health]'); await sleep(100);
  await ev(`document.querySelector('#captureSheet form').requestSubmit()`); await sleep(400);
  dd = await data();
  check('…the kind of task can be changed; Enter adds it to Tasks (with no date)', dd.tasks.items.length === 1 && dd.tasks.items[0].title === 'Renew passport' && dd.tasks.items[0].category === 'health' && dd.tasks.items[0].due === null && dd.queue.length === 0);
  check('…and it says so', (await text('#toast')).includes('Added to your tasks: Renew passport'));
  await capture('pay rent by Friday');
  check('a date: the task choice says when', (await text('[data-action=capture-task]')).includes('Friday 16 October'));
  await click('[data-action=capture-task]'); await sleep(400);
  check('…and the task keeps it as its date (not in its name)', (await data()).tasks.items.some(t => t.title === 'Pay rent' && t.due === '2026-10-16' && t.time === null), (await data()).tasks.items.map(t => [t.title, t.due]));
  await capture('call the bank tomorrow at 9am');
  await click('[data-action=capture-task]'); await sleep(400);
  check('a time, as a task: it has the date and the time', (await data()).tasks.items.some(t => t.title === 'Call the bank' && t.due === '2026-10-16' && t.time === '09:00'), (await data()).tasks.items.map(t => [t.title, t.due, t.time]));
  await capture('app idea: shift-swap finder for nurses');
  check('an idea → "Start a project from this" first (from 1.12.0), with "Save in Business ideas" as another choice', eq(await choices(), ['project*', 'task', 'collection', 'note']) && (await text('[data-action=capture-collection]')).includes('Business ideas'), await choices());
  await click('[data-action=capture-collection]'); await sleep(400);
  const idea = (await notes()).items.find(x => x.text === 'app idea: shift-swap finder for nurses');
  check('…in Business ideas', idea && idea.categoryId === (await catId('Business ideas')));
  await capture('wifi password is in the drawer');
  check('anything else → "Save to Notes inbox" (or start a project from it)', eq(await choices(), ['note*', 'task', 'project']), await choices());
  await click('[data-action=capture-note]'); await sleep(400);
  check('…saved to the Inbox', (await notes()).items.some(x => x.text === 'wifi password is in the drawer' && x.categoryId === ''));
  await capture('dentist on the 14th at 3pm');
  await click('[data-action=capture-cancel]'); await sleep(250);
  check('"Cancel" adds nothing', (await data()).commitments.length === 1 && !(await exists('#captureSheet')));

  console.log('\n[7] Saved data: export and import, and the current MyDay keeping Notes');
  for (const x of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + x);
  await go('projects', 2026, 10, 15, 11);
  await click('[data-action=export]'); await sleep(1200);
  const exported = JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-10-15.json', 'utf8'));
  check('"Export my data" includes Notes', eq(exported.data.notes, await notes()));
  await reset(); await go('today', 2026, 10, 15, 12);
  await setFile(S + '/dl/myday-export-2026-10-15.json'); await sleep(200); await answer(true);
  check('importing it brings Notes back exactly', eq(await notes(), exported.data.notes));
  const savedNew = await ev(`localStorage.getItem('${KEY}')`);
  T.setUrl('index.html#today'); await openAt(2026, 10, 15, 13);
  for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(250); }
  check('the current MyDay keeps Notes exactly when it saves', eq(JSON.parse(await ev(`localStorage.getItem('${KEY}')`)).notes, JSON.parse(savedNew).notes));
  check('…and keeps what Capture added (the appointment and the tasks, exactly)', JSON.parse(await ev(`localStorage.getItem('${KEY}')`)).commitments.some(c => c.title === 'Call GP') && eq(JSON.parse(await ev(`localStorage.getItem('${KEY}')`)).tasks, JSON.parse(savedNew).tasks) && JSON.parse(savedNew).tasks.items.length === 3);

  console.log('\n[8] Layout');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const theme of ['dark', 'light']) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    await go('projects/notes', 2026, 10, 15, 14);
    check(`phone (${theme}): nothing scrolls sideways`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
  }
  const pos = await ev(`(() => { const b = document.querySelector('.capture-btn').getBoundingClientRect(), n = document.getElementById('nav').getBoundingClientRect(), items = [...document.querySelectorAll('#nav .nav-item')].map(a => a.getBoundingClientRect()); return { b: [b.right, b.bottom, b.width, b.height], navTop: n.top, w: innerWidth, minItem: Math.min(...items.map(r => r.width)) }; })()`);
  check('phone: Capture is a 56 px button bottom-right, above the bar; each of the six sections is at least 44 px wide', pos.b[2] === 56 && pos.b[3] === 56 && pos.b[1] <= pos.navTop && pos.b[0] <= pos.w && pos.minItem >= 44, pos);
  await click('[data-action=capture-open]'); await sleep(200);
  check('phone: Capture fits (nothing scrolls sideways)', !(await ev('document.documentElement.scrollWidth > innerWidth')));
  await click('[data-action=capture-cancel]'); await sleep(200);
  const small = await ev(`[...document.querySelectorAll('#app button, #app input, #app select, #app .note-row, #app .ncol-row, .capture-btn')].filter(b => b.offsetParent !== null || b.classList.contains('capture-btn')).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.id || b.className).trim().slice(0, 24), h: Math.round(r.height) }; }).filter(x => x.h < 44)`);
  check('phone: every button, row and field is at least 44 px high', small.length === 0, small.slice(0, 5));
  for (const width of [1024, 1280, 1440, 1600, 1920]) {
    await T.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: false });
    await go('projects', 2026, 9, 30, 15); // "Wednesday 30 September", a long date (wide screens: the side menu, from 1.11.0)
    const h = await ev(`(() => { const d = document.getElementById('date').getBoundingClientRect(), n = document.getElementById('nav').getBoundingClientRect(), c = document.querySelector('.capture-btn').getBoundingClientRect(), t = document.getElementById('themeBtn').getBoundingClientRect(), a = document.getElementById('app').getBoundingClientRect(); return { dl: d.left, dr: d.right, nl: n.left, nr: n.right, nh: n.height, c: c.left, cr: c.right, t: t.left, a: a.left, labels: [...document.querySelectorAll('.nav-label')].every(l => getComputedStyle(l).position !== 'absolute' && l.getBoundingClientRect().width > 0) }; })()`);
    check(`wide (${width} px): the side menu down the left, beside the date and the page; Capture and the theme button never overlap the date; every section shows its name`, h.nl <= 24 && h.nr < h.dl && h.nr < h.a && h.dr + 8 < h.c && h.cr <= h.t && h.labels, h);
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
