// Tasks in the new app (Inbox → Tasks): adding a task in your own words (dates and times read from them), the groups
// (From earlier, Today, Coming up, Any time, Done), editing one, your own lists (removing one keeps its tasks), the
// "Due today" card on Today (one tap adds a task to today's plan, only while there's room for your energy; ticking it
// off on the plan ticks it off here too), rest days, saved data (broken entries, unknown fields, export and import,
// the current MyDay keeping Tasks), and layout on phones.
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
const commit = async (sel, v) => { await type(sel, v); await blur(sel); await sleep(250); };
const answer = async yes => { await sleep(200); await click(yes ? '[data-action=dialog-confirm]' : '[data-action=dialog-cancel]'); await sleep(250); };
const tasks = async () => (await data()).tasks;
const byTitle = async title => (await tasks()).items.find(t => t.title === title);
const hash = () => ev('location.hash');
const until = async (js, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(js)) return true; await sleep(100); } return false; };
const rows = sel => ev(`[...document.querySelectorAll('${sel} .task-row')].map(a => a.querySelector('span').textContent)`);
// Adding from the box at the top: wait until it's saved (the date libraries load the first time).
async function add(words) {
  const n = (await tasks()).items.length;
  await type('#taskNew', words); await click('[data-action=task-add]');
  await until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.length > ${n}`);
  await sleep(200);
}
const K = '2026-10-15'; // a Thursday
const day = (energy, rest = false) => `s => { s.days['${K}'] = { energy: ${energy}, rest: ${rest}, builtAt: '${K}T08:00', checkedIn: false, tasks: [] }; }`;

(async () => {
  await T.connect();
  await T.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });
  await T.send('Emulation.setLocaleOverride', { locale: 'en-GB' });

  console.log('\n[1] Adding tasks in your own words');
  await go('inbox', 2026, 10, 15); await reset(); await go('inbox', 2026, 10, 15);
  check('Tasks starts empty, and says how to add one', (await text('#tasksEmpty')).includes('Add a task above') && eq(await tasks(), { lists: [], items: [] }));
  check('the Add button waits for some words', await ev(`document.querySelector('[data-action=task-add]').disabled`));
  await add('pay rent by Friday');
  let t = await byTitle('Pay rent');
  check('"pay rent by Friday" → "Pay rent", due Friday 16 October, no time', t && t.due === '2026-10-16' && t.time === null && !t.done && t.listId === '' && t.minutes === 15, t);
  check('…and it says when', (await text('#toast')).includes('Added — Friday 16 October.'));
  check('…the box empties', (await ev(`document.getElementById('taskNew').value`)) === '');
  await add('call GP tomorrow at 10am');
  check('"call GP tomorrow at 10am" → "Call GP", due tomorrow at 10:00', eq([(await byTitle('Call GP'))?.due, (await byTitle('Call GP'))?.time], ['2026-10-16', '10:00']));
  await add('buy stamps');
  check('no date → "Any time"', (await byTitle('Buy stamps'))?.due === null && eq(await rows('#tasks-anytime'), ['Buy stamps']));
  await add('send the form today');
  check('"today" → due today, in "Today"', (await tasks()).items.some(x => x.due === K) && (await rows('#tasks-today')).length === 1);
  check('"Coming up": earliest first, timed before untimed on the same day, with "tomorrow 10:00"', eq(await rows('#tasks-upcoming'), ['Call GP', 'Pay rent'])
    && (await text('#tasks-upcoming [data-s=task-due]')).includes('tomorrow 10:00'));
  await editStorage(`s => { s.tasks.items.push({ id: 'tkOld', title: 'Renew car tax', listId: '', category: 'admin', minutes: 20, due: '2026-10-12', time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-10T10:00' }); }`);
  await go('inbox/tasks', 2026, 10, 15, 9, 5);
  check('a date that has passed → "From earlier", gently ("no rush")', eq(await rows('#tasks-earlier'), ['Renew car tax']) && (await text('#tasks-earlier')).includes('no rush'));
  check('search appears with more than four tasks, and looks in titles and notes', await exists('#taskSearch'));
  await type('#taskSearch', 'RENT');
  check('…in any case', eq(await ev(`[...document.querySelectorAll('.task-row')].map(a => a.querySelector('span').textContent)`), ['Pay rent']));
  await type('#taskSearch', 'nothing like this');
  check('…and says when nothing matches', (await text('#tasksEmpty')).includes('No tasks match'));
  await type('#taskSearch', '');

  console.log('\n[2] Editing a task');
  const stamps = (await byTitle('Buy stamps')).id;
  await click(`.task-row[data-id="${stamps}"]`); await sleep(300);
  check('tapping a task opens it', (await hash()) === `#inbox/tasks/${stamps}` && (await exists('#taskEditor')));
  check('the time waits for a date', await ev(`document.getElementById('tTime').disabled`));
  await commit('#tDue', '2026-10-20');
  await commit('#tTime', '18:30');
  await commit('#tMin', '30');
  await click('[data-s=task-cat][data-id=health]'); await sleep(200);
  await commit('#tNotes', 'First class, book of 8');
  await commit('#tTitle', 'Buy stamps at the post office');
  t = (await tasks()).items.find(x => x.id === stamps);
  check('each change is saved as you finish it: date, time, length, kind, notes, words', t.due === '2026-10-20' && t.time === '18:30' && t.minutes === 30 && t.category === 'health' && t.notes === 'First class, book of 8' && t.title === 'Buy stamps at the post office', t);
  await commit('#tTitle', '   ');
  check('an empty title isn\'t saved (the old one stays)', (await tasks()).items.find(x => x.id === stamps).title === 'Buy stamps at the post office');
  await commit('#tDue', '');
  t = (await tasks()).items.find(x => x.id === stamps);
  check('clearing the date clears the time too', t.due === null && t.time === null);
  await click('[data-action=task-tomorrow]'); await sleep(250);
  check('"Tomorrow" gives it tomorrow\'s date', (await tasks()).items.find(x => x.id === stamps).due === '2026-10-16');
  check('"Add to today\'s plan" waits until the day is built, and says so', (await ev(`document.querySelector('[data-action=task-plan]').disabled`)) && (await text('[data-s=plan-note]')).includes('build your day on Today first'));
  await click('[data-action=task-toggle]'); await sleep(250);
  t = (await tasks()).items.find(x => x.id === stamps);
  check('"Mark done" → done, today', t.done && t.doneOn === K && (await text('[data-action=task-toggle]')).includes('Done'));
  await click('[data-action=task-toggle]'); await sleep(250);
  check('…and back', !(await tasks()).items.find(x => x.id === stamps).done);
  await click('[data-action=task-delete]'); await answer(false);
  check('deleting asks first ("Keep it" keeps it)', (await tasks()).items.some(x => x.id === stamps));
  await go('inbox/tasks/nope', 2026, 10, 15, 9, 10);
  check('a task that isn\'t there says so, kindly', (await text('#app')).includes("This task isn't here"));

  console.log('\n[3] Your own lists');
  await go('inbox/tasks', 2026, 10, 15, 9, 15);
  check('"+ Make a list" when there are none', (await text('[data-action=task-lists]')) === '+ Make a list');
  await click('[data-action=task-lists]'); await sleep(300);
  await type('#tlNew', 'Moving house'); await click('[data-action=tl-add]'); await sleep(250);
  await type('#tlNew', 'Car'); await click('[data-action=tl-add]'); await sleep(250);
  await type('#tlNew', 'car'); await click('[data-action=tl-add]'); await sleep(250);
  check('lists are added; the same name twice isn\'t', eq((await tasks()).lists.map(l => l.name), ['Moving house', 'Car']));
  await click('#taskLists .tl-row:nth-child(2) [data-action=tl-up]'); await sleep(250);
  check('…and can be reordered', eq((await tasks()).lists.map(l => l.name), ['Car', 'Moving house']));
  const moving = (await tasks()).lists.find(l => l.name === 'Moving house').id;
  await go(`inbox/tasks/list/${moving}`, 2026, 10, 15, 9, 20);
  check('a list has its own page', (await text('#tasks-h')) === 'Moving house' && (await text('#tasksEmpty')).includes('Nothing in this list yet'));
  await add('book a removal van on Saturday');
  t = await byTitle('Book a removal van');
  check('adding from a list puts the task in it (with its date)', t && t.listId === moving && t.due === '2026-10-17', t || (await tasks()).items.map(x => x.title));
  await go('inbox/tasks', 2026, 10, 15, 9, 25);
  check('all tasks show the list\'s name, and the lists are chips at the top', (await text(`.task-row[data-id="${t.id}"]`)).includes('Moving house') && eq(await ev(`[...document.querySelectorAll('[data-s=task-list]')].map(b => b.textContent)`), ['All', 'Car', 'Moving house']));
  await go('inbox/tasks/lists', 2026, 10, 15, 9, 30);
  await commit('#taskLists .tl-row:nth-child(2) input', 'Moving flat');
  check('a list can be renamed', (await tasks()).lists.find(l => l.id === moving).name === 'Moving flat');
  await click('#taskLists .tl-row:nth-child(2) [data-action=tl-remove]');
  check('removing one says its task stays', (await ev(`document.querySelector('dialog[open]')?.textContent || ''`)).includes('Its task stays, with no list. No tasks are deleted.'));
  await answer(true);
  check('…it does: the list goes, the task stays, with no list', !(await tasks()).lists.some(l => l.id === moving) && (await byTitle('Book a removal van')).listId === '');

  console.log('\n[4] "Due today" on Today');
  await editStorage(`s => { s.tasks.items.push({ id: 'tkTimed', title: 'Hand in forms', listId: '', category: 'admin', minutes: 30, due: '${K}', time: '14:00', notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-14T10:00' }); }`);
  await go('today', 2026, 10, 15, 9, 35);
  const dueRows = () => ev(`[...document.querySelectorAll('#dueToday .due-li a > span:first-child')].map(s => s.textContent)`);
  check('before the day is built: the tasks due today and from earlier, earliest first (timed before untimed)', eq(await dueRows(), ['Renew car tax', 'Hand in forms', 'Send the form']), await dueRows());
  check('…"from Mon 12 Oct" for the earlier one, the time for the timed one', (await text('#dueToday .due-li[data-id=tkOld]')).includes('from Mon 12 Oct') && (await text('#dueToday .due-li[data-id=tkTimed]')).includes('14:00'));
  check('…nothing to add until the day is built, and it says so', !(await exists('[data-action=due-plan]')) && (await text('[data-s=due-note]')).includes('Build your day, then add any of these to it.'));
  check('…and nothing was added to a plan by itself', !(await data()).days[K]);
  await editStorage(day(3)); // energy 3: room for 2 tasks
  await go('today', 2026, 10, 15, 9, 40);
  check('with the day built at energy 3: "Room for 2 more", and an "Add to plan" for each', (await text('[data-s=due-note]')).includes('Room for 2 more') && (await ev(`document.querySelectorAll('[data-action=due-plan]').length`)) === 3);
  await click('[data-action=due-plan][data-id=tkTimed]'); await sleep(300);
  let dd = await data(), pt = dd.days[K].tasks[0];
  t = dd.tasks.items.find(x => x.id === 'tkTimed');
  check('one tap adds it to today\'s plan, at its time (14:00–14:30), linked to the task', pt.title === 'Hand in forms' && pt.category === 'admin' && pt.scheduledStart === `${K}T14:00` && pt.scheduledEnd === `${K}T14:30` && t.plannedOn === K && t.planUid === pt.uid, pt);
  check('…it leaves "Due today", and it says so', !(await exists('#dueToday .due-li[data-id=tkTimed]')) && (await text('#toast')).includes("Added to today's plan") && (await text('[data-s=due-note]')).includes('Room for 1 more'));
  const sendForm = (await tasks()).items.find(x => x.due === K && x.id !== 'tkTimed').id;
  await click(`[data-action=due-plan][data-id="${sendForm}"]`); await sleep(300);
  check('a second one fills the plan (2 for energy 3): no more "Add to plan", and it says why, kindly', (await data()).days[K].tasks.length === 2 && !(await exists('[data-action=due-plan]')) && (await text('[data-s=due-note]')).includes("Today's plan is full for your energy (2 tasks)"));
  await go('inbox/tasks/tkOld', 2026, 10, 15, 9, 45);
  check('the task\'s own "Add to today\'s plan" waits too, and offers "Tomorrow"', (await ev(`document.querySelector('[data-action=task-plan]').disabled`)) && (await text('[data-s=plan-note]')).includes('"Tomorrow" moves it on'));
  await go('inbox/tasks', 2026, 10, 15, 9, 50);
  check('Tasks shows "On today\'s plan" on the two', (await text('.task-row[data-id=tkTimed]')).includes("On today's plan") && (await text(`.task-row[data-id="${sendForm}"]`)).includes("On today's plan"));
  await go('today', 2026, 10, 15, 15);
  await click(`[data-action=toggle][data-uid="${pt.uid}"]`); await sleep(300);
  dd = await data();
  check('ticking it off on the plan…', dd.days[K].tasks.find(x => x.uid === pt.uid).done);
  await ev(`location.hash = 'inbox/tasks'`); await sleep(300);
  check('…ticks it off in Tasks too (one task, not two): it\'s under Done there', (await text('#tasks-done')).includes('1') && !(await exists('.task-row[data-id=tkTimed]')));
  await click('[data-action=tasks-done-toggle]'); await sleep(200);
  await click('[data-s=task-done][data-id=tkTimed]'); await sleep(300);
  dd = await data();
  check('…and unticking it in Tasks unticks it on the plan too', !dd.days[K].tasks.find(x => x.uid === pt.uid).done && !dd.tasks.items.find(x => x.id === 'tkTimed').done);
  await go('today', 2026, 10, 15, 15, 5);
  await click('[data-s=due-done][data-id=tkOld]'); await sleep(300);
  t = await byTitle('Renew car tax');
  check('the tick on "Due today" marks a task done, and it leaves the card', t.done && t.doneOn === K && !(await exists('#dueToday')));

  console.log('\n[5] A rest day');
  await editStorage(`s => { s.tasks.items.find(x => x.id === 'tkOld').done = false; s.tasks.items.find(x => x.id === 'tkOld').doneOn = null; }`);
  await editStorage(day(1, true));
  await go('today', 2026, 10, 15, 15, 10);
  check('on a rest day: no "Add to plan", and "these can wait"', !(await exists('[data-action=due-plan]')) && (await text('[data-s=due-note]')).includes("It's a rest day — these can wait"));

  console.log('\n[6] Saved data');
  await editStorage(`s => { s.tasks.futurePart = { kept: true }; s.tasks.items.push({ id: 'bad1' }, { id: 'bad2', title: '   ' }, 'nonsense', { id: 'tkOld', title: 'A second task with the same id', due: 'not a date', time: '25:99', category: 'gardening', minutes: 9999, done: 'yes' }); s.tasks.lists.push({ id: 'tlBad' }); }`);
  await go('inbox/tasks', 2026, 10, 15, 16);
  check('the screen opens and shows the good tasks (it tidies saved data at its next save)', (await exists('#tasks-earlier')) && !(await text('#app')).includes('25:99'));
  await click('#themeBtn'); await sleep(300); // any change saves
  const td = await tasks();
  const dup = td.items.find(x => x.title === 'A second task with the same id');
  check('broken entries are left out; a repeated id gets a new one; odd values are made safe; unknown parts are kept', !td.items.some(x => x.id === 'bad1' || x.id === 'bad2') && dup && dup.id !== 'tkOld' && dup.due === null && dup.time === null && dup.category === 'admin' && dup.minutes === 15 && dup.done === false && eq(td.futurePart, { kept: true }) && !td.lists.some(l => l.id === 'tlBad'), dup);
  for (const x of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + x);
  await click('[data-action=export]'); await sleep(1200);
  const exported = JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-10-15.json', 'utf8'));
  check('"Export my data" includes Tasks', eq(exported.data.tasks, await tasks()));
  await reset(); await go('today', 2026, 10, 15, 16, 5);
  await setFile(S + '/dl/myday-export-2026-10-15.json'); await sleep(200); await answer(true);
  check('importing it brings Tasks back exactly', eq(await tasks(), exported.data.tasks));
  const savedNew = await ev(`localStorage.getItem('${KEY}')`);
  T.setUrl('index.html#today'); await openAt(2026, 10, 15, 16, 10);
  await click('#themeBtn'); await sleep(300); // one change, so it saves
  check('the current MyDay keeps Tasks exactly when it saves (a theme change, saved)', eq(JSON.parse(await ev(`localStorage.getItem('${KEY}')`)).tasks, JSON.parse(savedNew).tasks) && JSON.parse(await ev(`localStorage.getItem('${KEY}')`)).settings.theme !== JSON.parse(savedNew).settings.theme);
  await editStorage(`s => { delete s.tasks; }`);
  await go('inbox/tasks', 2026, 10, 15, 16, 15);
  check('saved data from before Tasks opens with no tasks (nothing else changes)', (await text('#tasksEmpty')).includes('Add a task above'));

  console.log('\n[7] Layout');
  await go('inbox/tasks', 2026, 10, 15, 17); await reset(); await go('inbox/tasks', 2026, 10, 15, 17);
  await add('call the council about the bins tomorrow at 9am');
  await add('a much longer task with a lot of words in it so that it has to wrap onto a second line on a phone');
  await add('submit expenses today');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const theme of ['dark', 'light']) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    for (const h of ['inbox/tasks', 'inbox/tasks/lists', `inbox/tasks/${(await tasks()).items[0].id}`, 'today']) {
      await go(h, 2026, 10, 15, 17, 5);
      check(`phone (${theme}), #${h.split('/').slice(0, 3).join('/').replace(/tk\w+$/, '<task>')}: nothing scrolls sideways`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
    }
  }
  await go(`inbox/tasks/${(await tasks()).items[0].id}`, 2026, 10, 15, 17, 8);
  const dt = await ev(`(() => { const a = document.getElementById('tDue').getBoundingClientRect(), b = document.getElementById('tTime').getBoundingClientRect(), c = document.getElementById('taskEditor').getBoundingClientRect(); return { dueRight: a.right, timeLeft: b.left, timeRight: b.right, card: c.right }; })()`);
  check('phone: a task\'s date and time boxes sit side by side without overlapping', dt.dueRight <= dt.timeLeft && dt.timeRight <= dt.card, dt);
  await go('inbox/tasks', 2026, 10, 15, 17, 10);
  const small = await ev(`[...document.querySelectorAll('#app button, #app input:not([type=checkbox]), #app select, #app .task-row, #app label.tick')].filter(b => b.offsetParent !== null).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.id || b.className).trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.h < 44 || x.w < 44)`);
  check('phone: every button, row, field and tick box is at least 44 × 44 px', small.length === 0, small.slice(0, 5));
  await go('today', 2026, 10, 15, 17, 15);
  const smallDue = await ev(`[...document.querySelectorAll('#dueToday button, #dueToday label.tick, #dueToday .due-li a')].map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.className).trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.h < 44 || x.w < 44)`);
  check('phone: "Due today" — the tick boxes and rows are at least 44 × 44 px', (await exists('#dueToday')) && smallDue.length === 0, smallDue.slice(0, 5));
  await T.send('Emulation.clearDeviceMetricsOverride');

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
