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
  await go('today/tasks', 2026, 10, 15); await reset(); await go('today/tasks', 2026, 10, 15);
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
  await go('today/tasks', 2026, 10, 15, 9, 5);
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
  check('tapping a task opens it', (await hash()) === `#today/tasks/${stamps}` && (await exists('#taskEditor')));
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
  await go('today/tasks/nope', 2026, 10, 15, 9, 10);
  check('a task that isn\'t there says so, kindly', (await text('#app')).includes("This task isn't here"));

  console.log('\n[3] Your own lists');
  await go('today/tasks', 2026, 10, 15, 9, 15);
  check('"+ Make a list" when there are none', (await text('[data-action=task-lists]')) === '+ Make a list');
  await click('[data-action=task-lists]'); await sleep(300);
  await type('#tlNew', 'Moving house'); await click('[data-action=tl-add]'); await sleep(250);
  await type('#tlNew', 'Car'); await click('[data-action=tl-add]'); await sleep(250);
  await type('#tlNew', 'car'); await click('[data-action=tl-add]'); await sleep(250);
  check('lists are added; the same name twice isn\'t', eq((await tasks()).lists.map(l => l.name), ['Moving house', 'Car']));
  await click('#taskLists .tl-row:nth-child(2) [data-action=tl-up]'); await sleep(250);
  check('…and can be reordered', eq((await tasks()).lists.map(l => l.name), ['Car', 'Moving house']));
  const moving = (await tasks()).lists.find(l => l.name === 'Moving house').id;
  await go(`today/tasks/list/${moving}`, 2026, 10, 15, 9, 20);
  check('a list has its own page', (await text('#tasks-h')) === 'Moving house' && (await text('#tasksEmpty')).includes('Nothing in this list yet'));
  await add('book a removal van on Saturday');
  t = await byTitle('Book a removal van');
  check('adding from a list puts the task in it (with its date)', t && t.listId === moving && t.due === '2026-10-17', t || (await tasks()).items.map(x => x.title));
  await go('today/tasks', 2026, 10, 15, 9, 25);
  check('all tasks show the list\'s name, and the lists are chips at the top', (await text(`.task-row[data-id="${t.id}"]`)).includes('Moving house') && eq(await ev(`[...document.querySelectorAll('[data-s=task-list]')].map(b => b.textContent)`), ['All', 'Car', 'Moving house']));
  await go('today/tasks/lists', 2026, 10, 15, 9, 30);
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
  await go('today/tasks/tkOld', 2026, 10, 15, 9, 45);
  check('the task\'s own "Add to today\'s plan" waits too, and offers "Tomorrow"', (await ev(`document.querySelector('[data-action=task-plan]').disabled`)) && (await text('[data-s=plan-note]')).includes('"Tomorrow" moves it on'));
  await go('today/tasks', 2026, 10, 15, 9, 50);
  check('Tasks shows "On today\'s plan" on the two', (await text('.task-row[data-id=tkTimed]')).includes("On today's plan") && (await text(`.task-row[data-id="${sendForm}"]`)).includes("On today's plan"));
  await go('today', 2026, 10, 15, 15);
  await click(`[data-action=toggle][data-uid="${pt.uid}"]`); await sleep(300);
  dd = await data();
  check('ticking it off on the plan…', dd.days[K].tasks.find(x => x.uid === pt.uid).done);
  const tkDone = dd.tasks.items.find(x => x.id === 'tkTimed');
  check('…marks the task itself done, dated the plan\'s day (so Your week counts it)', tkDone.done === true && tkDone.doneOn === K, tkDone);
  await ev(`location.hash = 'today/tasks'`); await sleep(300);
  check('…ticks it off in Tasks too (one task, not two): it\'s under Done there', (await text('#tasks-done')).includes('1') && !(await exists('.task-row[data-id=tkTimed]')));
  await click('[data-action=tasks-done-toggle]'); await sleep(200);
  await click('[data-s=task-done][data-id=tkTimed]'); await sleep(300);
  dd = await data();
  check('…and unticking it in Tasks unticks it on the plan too', !dd.days[K].tasks.find(x => x.uid === pt.uid).done && !dd.tasks.items.find(x => x.id === 'tkTimed').done);
  // The other way round: ticked in Tasks, then unticked on the plan.
  await click('[data-s=task-done][data-id=tkTimed]'); await sleep(300);
  await go('today', 2026, 10, 15, 15, 2);
  await click(`[data-action=toggle][data-uid="${pt.uid}"]`); await sleep(300);
  dd = await data();
  const tkOpen = dd.tasks.items.find(x => x.id === 'tkTimed');
  check('ticked in Tasks, then unticked on the plan: open in both places again, not left done in Tasks', !dd.days[K].tasks.find(x => x.uid === pt.uid).done && tkOpen.done === false && tkOpen.doneOn === null, tkOpen);
  await go('today', 2026, 10, 15, 15, 5);
  await click('[data-s=due-done][data-id=tkOld]'); await sleep(300);
  t = await byTitle('Renew car tax');
  check('the tick on "Due today" marks a task done, and it leaves the card', t.done && t.doneOn === K && !(await exists('#dueToday')));
  await go(`today/tasks/${sendForm}`, 2026, 10, 15, 15, 7);
  check('a task on today\'s plan says a later day takes it off the plan', (await text('#taskEditor')).includes('Moving it to a later day takes it off today\'s plan'));
  const otherUid = (await data()).days[K].tasks.find(x => x.uid !== (dd.tasks.items.find(y => y.id === sendForm) || {}).planUid)?.uid;
  await click('[data-action=task-tomorrow]'); await sleep(300);
  dd = await data();
  check('"Tomorrow" on it: tomorrow\'s date, off today\'s plan (the other one stays), and it says so', dd.tasks.items.find(x => x.id === sendForm).due === '2026-10-16' && dd.tasks.items.find(x => x.id === sendForm).plannedOn === null
    && eq(dd.days[K].tasks.map(x => x.uid), [otherUid]) && (await text('#toast')).includes("Moved to tomorrow, and off today's plan"), [dd.days[K].tasks.map(x => x.uid), otherUid, await text('#toast')]);

  await editStorage(`s => { s.tasks.items.push({ id: 'tkWaitDue', title: 'Ask about the armchair', listId: '', category: 'admin', minutes: 15, due: '${K}', time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-14T10:00', postponed: 0, blockers: [], letGoOn: null, waiting: { on: 'Priya', since: '2026-10-12', until: '2026-10-20' } }); }`);
  await go('today', 2026, 10, 15, 15, 8);
  check('a task waiting on someone that is due today shows its waiting line on "Due today": "Waiting on Priya · expected Tue 20 Oct"', (await exists('#dueToday .due-li[data-id=tkWaitDue]')) && (await text('#dueToday .due-li[data-id=tkWaitDue] [data-s=task-waiting]')).replace(/\s+/g, ' ').trim() === 'Waiting on Priya · expected Tue 20 Oct', await text('#dueToday'));
  check('…and it is the only row with a waiting line', (await ev(`document.querySelectorAll('#dueToday [data-s=task-waiting]').length`)) === 1);
  await editStorage(`s => { s.tasks.items.find(x => x.id === 'tkWaitDue').done = true; s.tasks.items.find(x => x.id === 'tkWaitDue').doneOn = '${K}'; }`);
  await go('today', 2026, 10, 15, 15, 9);
  check('once it is ticked done it is no longer on "Due today", so no waiting line shows', !(await exists('#dueToday [data-s=task-waiting]')));
  await editStorage(`s => { s.tasks.items = s.tasks.items.filter(x => x.id !== 'tkWaitDue'); }`);

  // "Start today over" after ticking off a task from Your tasks: it stays done there.
  await editStorage(`s => { s.tasks.items.push({ id: 'tkKeep', title: 'Post the parcel', listId: '', category: 'admin', minutes: 15, due: '${K}', time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-14T10:00', postponed: 0, blockers: [], letGoOn: null }); }`);
  await editStorage(day(4));
  await go('today', 2026, 10, 15, 15, 7);
  await click('[data-action=due-plan][data-id=tkKeep]'); await sleep(300);
  const keepUid = (await tasks()).items.find(x => x.id === 'tkKeep').planUid;
  await click(`[data-action=toggle][data-uid="${keepUid}"]`); await sleep(300);
  await click('[data-action=restart]'); await sleep(250);
  const restartBody = await ev(`document.querySelector('dialog[open]')?.textContent || ''`);
  check('"Start today over" says that what you ticked off from Your tasks stays done there', restartBody.includes("Today's plan will be cleared so you can choose your energy again. Anything from Your tasks that you ticked off stays done there."), restartBody);
  await answer(true);
  const kept = (await tasks()).items.find(x => x.id === 'tkKeep');
  check('…and it does: still done, dated today, no longer linked to the cleared plan', kept.done === true && kept.doneOn === K && kept.plannedOn === null && kept.planUid === null && !(await data()).days[K], kept);
  await editStorage(`s => { s.tasks.items = s.tasks.items.filter(x => x.id !== 'tkKeep'); }`);

  // Rolled to tomorrow in the evening check-in, then tomorrow's plan built: the task follows its copy there.
  await editStorage(`s => { s.queue = []; s.tasks.items.push({ id: 'tkRoll', title: 'Return the library books', listId: '', category: 'admin', minutes: 15, due: '${K}', time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-14T10:00', postponed: 0, blockers: [], letGoOn: null }); }`);
  await editStorage(day(4));
  await go('today', 2026, 10, 15, 20);
  await click('[data-action=due-plan][data-id=tkRoll]'); await sleep(300);
  const rollUid = (await tasks()).items.find(x => x.id === 'tkRoll').planUid;
  await click('[data-action=evening]'); await sleep(200);
  await click(`[data-action=roll][data-uid="${rollUid}"]`); await sleep(200);
  await click('[data-action=finish-evening]'); await sleep(300);
  await go('today/tasks', 2026, 10, 15, 20, 5);
  check('rolled to tomorrow in the evening check-in: it waits in the queue, not in Your tasks', !(await exists('.task-row[data-id=tkRoll]')) && (await data()).queue.some(q => q.title === 'Return the library books'));
  const K16 = '2026-10-16';
  await go('today', 2026, 10, 16, 9);
  await click('[data-action=build]'); await sleep(300); await click('[data-action=prop-apply]'); await sleep(400);
  let rd = await data();
  const rolledItem = rd.tasks.items.find(x => x.id === 'tkRoll'), landedCopy = rd.days[K16]?.tasks.find(x => x.title === 'Return the library books');
  check('the next morning, building the day takes it from the queue, and the task follows it onto that plan', !!landedCopy && rolledItem.plannedOn === K16 && rolledItem.planUid === landedCopy.uid, [rolledItem, landedCopy]);
  await click(`[data-action=toggle][data-uid="${landedCopy.uid}"]`); await sleep(300);
  rd = await data();
  check('…so ticking it there ticks it off in Your tasks too, dated that day', rd.tasks.items.find(x => x.id === 'tkRoll').done === true && rd.tasks.items.find(x => x.id === 'tkRoll').doneOn === K16);
  await editStorage(`s => { s.tasks.items = s.tasks.items.filter(x => x.id !== 'tkRoll'); delete s.days['${K16}']; s.queue = []; }`);

  console.log('\n[5] A rest day');
  await editStorage(`s => { s.tasks.items.find(x => x.id === 'tkOld').done = false; s.tasks.items.find(x => x.id === 'tkOld').doneOn = null; }`);
  await editStorage(day(1, true));
  await go('today', 2026, 10, 15, 15, 10);
  check('on a rest day: no "Add to plan", and "these can wait"', !(await exists('[data-action=due-plan]')) && (await text('[data-s=due-note]')).includes("It's a rest day — these can wait"));

  console.log('\n[6] Saved data');
  await editStorage(`s => { s.tasks.futurePart = { kept: true }; s.tasks.items.push({ id: 'bad1' }, { id: 'bad2', title: '   ' }, 'nonsense', { id: 'tkOld', title: 'A second task with the same id', due: 'not a date', time: '25:99', category: 'gardening', minutes: 9999, done: 'yes' }); s.tasks.lists.push({ id: 'tlBad' }); }`);
  await go('today/tasks', 2026, 10, 15, 16);
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
  await go('today/tasks', 2026, 10, 15, 16, 15);
  check('saved data from before Tasks opens with no tasks (nothing else changes)', (await text('#tasksEmpty')).includes('Add a task above'));

  console.log('\n[7] Layout');
  await go('today/tasks', 2026, 10, 15, 17); await reset(); await go('today/tasks', 2026, 10, 15, 17);
  await add('call the council about the bins tomorrow at 9am');
  await add('a much longer task with a lot of words in it so that it has to wrap onto a second line on a phone');
  await add('submit expenses today');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const theme of ['dark', 'light']) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    for (const h of ['today/tasks', 'today/tasks/lists', `today/tasks/${(await tasks()).items[0].id}`, 'today']) {
      await go(h, 2026, 10, 15, 17, 5);
      check(`phone (${theme}), #${h.split('/').slice(0, 3).join('/').replace(/tk\w+$/, '<task>')}: nothing scrolls sideways`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
    }
  }
  await go(`today/tasks/${(await tasks()).items[0].id}`, 2026, 10, 15, 17, 8);
  const dt = await ev(`(() => { const a = document.getElementById('tDue').getBoundingClientRect(), b = document.getElementById('tTime').getBoundingClientRect(), c = document.getElementById('taskEditor').getBoundingClientRect(); return { dueRight: a.right, timeLeft: b.left, timeRight: b.right, card: c.right }; })()`);
  check('phone: a task\'s date and time boxes sit side by side without overlapping', dt.dueRight <= dt.timeLeft && dt.timeRight <= dt.card, dt);
  await go('today/tasks', 2026, 10, 15, 17, 10);
  const small = await ev(`[...document.querySelectorAll('#app button, #app input:not([type=checkbox]), #app select, #app .task-row, #app label.tick')].filter(b => b.offsetParent !== null).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.id || b.className).trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.h < 44 || x.w < 44)`);
  check('phone: every button, row, field and tick box is at least 44 × 44 px', small.length === 0, small.slice(0, 5));
  await go('today', 2026, 10, 15, 17, 15);
  const smallDue = await ev(`[...document.querySelectorAll('#dueToday button, #dueToday label.tick, #dueToday .due-li a')].map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.className).trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) }; }).filter(x => x.h < 44 || x.w < 44)`);
  check('phone: "Due today" — the tick boxes and rows are at least 44 × 44 px', (await exists('#dueToday')) && smallDue.length === 0, smallDue.slice(0, 5));
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[8] Steps inside a task, and "Starts after"');
  const SHOTS = '/private/tmp/claude-501/-Users-nrt-Documents-Myday/a6442316-d8d8-4894-9d77-f6f490e34a76/scratchpad/steps-shots';
  fs.mkdirSync(SHOTS, { recursive: true });
  const mkT = (id, title, extra = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-14T10:00', postponed: 0, blockers: [], letGoOn: null, ...extra });
  const mkP = (id, title) => ({ id, title, summary: '', stage: 'act', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-10T09:00', updatedAt: '2026-10-10T09:00' });
  const seedTasks = (items, projs = []) => editStorage(`s => { s.tasks = { lists: [], items: ${JSON.stringify(items)} }; s.projects.items.push(...${JSON.stringify(projs)}); }`);
  const stepsOf = async id => (await tasks()).items.find(x => x.id === id).steps || [];
  const stepRows = () => ev(`[...document.querySelectorAll('#taskSteps [data-s=step]')].map(r => r.dataset.id)`);
  const mkSteps = (...ws) => ws.map((w, i) => ({ id: 'st' + (i + 1), text: w, done: false }));
  await go('today/tasks', 2026, 10, 15, 18); await reset(); await go('today/tasks', 2026, 10, 15, 18);
  await click('#themeBtn'); await sleep(300); // any change saves, so there is saved data to edit
  await seedTasks([mkT('tkS1', 'Build the shelf'), mkT('tkS2', 'Call the plumber', { steps: [{ id: 'sa', text: 'Ring the plumber', done: true }] }),
    mkT('tkS3', 'Sort the garage', { steps: Array.from({ length: 30 }, (_, i) => ({ id: 'sg' + i, text: 'Box ' + (i + 1), done: false })) }),
    mkT('tkS4', 'Paint the fence', { due: K, steps: [{ id: 'sp1', text: 'Sand it', done: true }, { id: 'sp2', text: 'Prime it', done: false }, { id: 'sp3', text: 'Paint it', done: false }] })]);

  console.log('  Steps on a task\'s page');
  await go('today/tasks/tkS1', 2026, 10, 15, 18, 5);
  check('a task with no steps: the Steps card says to break it into small steps if it helps, and the task stays the one thing you plan', (await text('#taskSteps h3')).trim() === 'Steps' && (await text('#taskSteps')).includes('If it helps, break it into small steps. The task stays the one thing you plan.'), await text('#taskSteps'));
  check('…it has the add form with the Add button waiting for some words, and no "Change steps" yet', (await exists('#stepNew')) && (await ev(`document.querySelector('[data-action=step-add]').disabled`)) && !(await exists('[data-action=steps-change]')));
  for (const w of ['Measure the wall', 'Order the boards', 'Level the ground']) {
    const n = (await stepsOf('tkS1')).length;
    await type('#stepNew', w); await click('[data-action=step-add]');
    await until(`(JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(x => x.id === 'tkS1').steps || []).length > ${n}`); await sleep(150);
  }
  let ss = await stepsOf('tkS1');
  check('adding three steps shows three rows in that order, reading "0 of 3 steps"', eq(await ev(`[...document.querySelectorAll('#taskSteps [data-s=step]')].map(r => r.textContent.trim())`), ['Measure the wall', 'Order the boards', 'Level the ground']) && (await text('[data-s=steps-count]')).trim() === '0 of 3 steps', [await text('#taskSteps')]);
  check('…the add box is empty again, and the task has exactly those three steps, none done', (await ev(`document.getElementById('stepNew').value`)) === '' && eq(ss.map(x => [x.text, x.done]), [['Measure the wall', false], ['Order the boards', false], ['Level the ground', false]]), ss);
  const [s1, s2, s3] = ss.map(x => x.id);
  await click(`#taskSteps [data-s=step][data-id="${s1}"] [data-s=step-done]`);
  await until(`(JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(x => x.id === 'tkS1').steps || [])[0]?.done === true && document.querySelector('[data-s=steps-count]')?.textContent.trim() === '1 of 3 steps'`);
  ss = await stepsOf('tkS1');
  check('ticking the first step reads "1 of 3 steps", marks that row done, and saves it done for that step only', (await text('[data-s=steps-count]')).trim() === '1 of 3 steps' && (await ev(`document.querySelector('#taskSteps [data-s=step][data-id="${s1}"]').dataset.done`)) === 'yes' && eq(ss.map(x => x.done), [true, false, false]), ss);
  check('…and the task is not done, and no offer to finish it yet', !(await tasks()).items.find(x => x.id === 'tkS1').done && !(await exists('[data-s=steps-all-done]')));
  await click('[data-action=steps-change]'); await until(`!!document.querySelector('#taskSteps [data-s=step] input[type=text]')`);
  check('"Change steps" is pressed, and the rows become text inputs with up, down and remove buttons', (await ev(`document.querySelector('[data-action=steps-change]').getAttribute('aria-pressed')`)) === 'true' && (await text('[data-action=steps-change]')).trim() === 'Done changing'
    && (await ev(`[...document.querySelectorAll('#taskSteps [data-s=step]')].every(r => r.querySelector('input[type=text]') && r.querySelector('[data-action=step-up]') && r.querySelector('[data-action=step-down]') && r.querySelector('[data-action=step-remove]'))`)) && eq(await ev(`[...document.querySelectorAll('#taskSteps [data-s=step] input')].map(i => i.id)`), [s1, s2, s3].map(x => 'step-' + x)));
  check('…the add form is hidden, the first row\'s up button and the last row\'s down button are disabled', !(await exists('#stepNew')) && !(await exists('[data-action=step-add]'))
    && (await ev(`document.querySelector('#taskSteps [data-s=step]:first-child [data-action=step-up]').disabled`)) && (await ev(`document.querySelector('#taskSteps [data-s=step]:last-child [data-action=step-down]').disabled`)) && !(await ev(`document.querySelector('#taskSteps [data-s=step]:first-child [data-action=step-down]').disabled`)));
  await type(`#step-${s2}`, 'Order the long boards');
  await until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(x => x.id === 'tkS1').steps[1].text === 'Order the long boards'`);
  ss = await stepsOf('tkS1');
  check('changing the second step\'s words saves them (the other steps are untouched)', eq(ss.map(x => x.text), ['Measure the wall', 'Order the long boards', 'Level the ground']) && ss[0].done === true, ss);
  await click(`#taskSteps [data-s=step][data-id="${s3}"] [data-action=step-up]`);
  await until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(x => x.id === 'tkS1').steps[1].id === '${s3}' && document.querySelectorAll('#taskSteps [data-s=step]')[1]?.dataset.id === '${s3}'`);
  check('moving the last step up saves the new order', eq((await stepsOf('tkS1')).map(x => x.id), [s1, s3, s2]) && eq(await stepRows(), [s1, s3, s2]), [await stepsOf('tkS1'), await stepRows()]);
  await click(`#taskSteps [data-s=step][data-id="${s3}"] [data-action=step-remove]`);
  await until(`document.querySelectorAll('#taskSteps [data-s=step]').length === 2 && document.activeElement?.id === 'step-${s2}'`);
  check('removing a step says "Step removed.", takes it off the screen and out of the saved task', (await text('#toast')).includes('Step removed.') && eq(await stepRows(), [s1, s2]) && eq((await stepsOf('tkS1')).map(x => x.id), [s1, s2]), [await text('#toast'), await stepRows()]);
  check('…and focus moves to the next step\'s input', (await ev(`document.activeElement && document.activeElement.id`)) === 'step-' + s2, await ev(`document.activeElement && document.activeElement.id`));
  await click('[data-action=steps-change]'); await until(`!!document.querySelector('#stepNew')`);
  check('pressing it again ("Done changing") goes back to ticking, with the add form back', (await text('[data-action=steps-change]')).trim() === 'Change steps' && (await ev(`document.querySelector('[data-action=steps-change]').getAttribute('aria-pressed')`)) === 'false' && (await exists('[data-s=step-done]')) && (await exists('#stepNew')));
  await click(`#taskSteps [data-s=step][data-id="${s2}"] [data-s=step-done]`); await until(`!!document.querySelector('[data-s=steps-all-done]')`);
  check('ticking every remaining step offers "All 2 steps done — mark the task done?" with a button for it', (await text('[data-s=steps-all-done]')).replace(/\s+/g, ' ').includes('All 2 steps done — mark the task done?') && (await exists('[data-action=steps-mark-done]')), await text('[data-s=steps-all-done]'));
  check('…and the task is still not done in the saved data before you tap it', !(await tasks()).items.find(x => x.id === 'tkS1').done);
  await click('[data-action=steps-mark-done]');
  await until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(x => x.id === 'tkS1').done === true && !document.querySelector('[data-s=steps-all-done]')`);
  t = (await tasks()).items.find(x => x.id === 'tkS1');
  check('tapping it marks the task done, says "Done — nice.", and the offer goes', t.done === true && (await text('#toast')).includes('Done — nice.') && !(await exists('[data-s=steps-all-done]')), [t.done, await text('#toast')]);
  await go('today/tasks/tkS2', 2026, 10, 15, 18, 10);
  check('a task whose only step is ticked says "Its step is done — mark the task done?"', (await text('[data-s=steps-all-done]')).replace(/\s+/g, ' ').includes('Its step is done — mark the task done?'), await text('[data-s=steps-all-done]'));
  await go('today/tasks/tkS3', 2026, 10, 15, 18, 11);
  check('a task with 30 steps has no add box, and says "30 steps is the most a task can have."', !(await exists('#stepNew')) && (await text('#taskSteps')).includes('30 steps is the most a task can have.') && (await ev(`document.querySelectorAll('#taskSteps [data-s=step]').length`)) === 30);
  await go('today/tasks', 2026, 10, 15, 18, 12);
  check('on Tasks the row of a task with steps shows "1 of 3 steps"', (await text('.task-row[data-id=tkS4] [data-s=task-steps]')).trim() === '1 of 3 steps' && (await text('.task-row[data-id=tkS2] [data-s=task-steps]')).trim() === '1 of 1 step', [await text('.task-row[data-id=tkS4]')]);
  await go('today', 2026, 10, 15, 18, 13);
  check('on Today, a task due today with steps shows "1 of 3 steps" on "Due today"', (await text('#dueToday .due-li[data-id=tkS4] [data-s=task-steps]')).trim() === '1 of 3 steps', await text('#dueToday'));
  await editStorage(day(4));
  await go('today', 2026, 10, 15, 18, 14);
  await click('[data-action=due-plan][data-id=tkS4]'); await until(`!!document.querySelector('#app .task [data-s=task-steps]')`);
  check('after "Add to plan" the plan row on Today shows the same "1 of 3 steps"', (await data()).days[K].tasks.length === 1 && (await text('#app .task [data-s=task-steps]')).trim() === '1 of 3 steps', await text('#app'));

  console.log('  "Starts after" on a project\'s task');
  await go('today/tasks', 2026, 10, 15, 19); await reset(); await go('today/tasks', 2026, 10, 15, 19);
  await click('#themeBtn'); await sleep(300);
  await seedTasks([mkT('tkLone', 'Water the plants'), mkT('tkB1', 'Build the frame', { projectId: 'pjW', createdAt: '2026-10-14T10:00' }), mkT('tkB2', 'Measure the wall', { projectId: 'pjW', createdAt: '2026-10-14T10:01' }),
    mkT('tkB3', 'Order the boards', { projectId: 'pjW', createdAt: '2026-10-14T10:02' }), mkT('tkBD', 'Paint the shed', { projectId: 'pjW', createdAt: '2026-10-14T09:00', done: true, doneOn: K })], [mkP('pjW', 'Garden bench')]);
  await go('today/tasks/tkLone', 2026, 10, 15, 19, 5);
  check('a task that is not in a project has no "Starts after" card', !(await exists('#taskStartsAfter')));
  await go('today/tasks/tkBD', 2026, 10, 15, 19, 6);
  check('a task that is done has no "Starts after" card', !(await exists('#taskStartsAfter')));
  await go('today/tasks/tkB1', 2026, 10, 15, 19, 7);
  check('"Build the frame" has a "Starts after" card saying "Nothing: it can start any time." and offering "Choose tasks"', (await text('#taskStartsAfter h3')).trim() === 'Starts after' && (await text('[data-s=startsafter-line]')).trim() === 'Nothing: it can start any time.' && (await text('[data-action=startsafter-choose]')).trim() === 'Choose tasks', await text('#taskStartsAfter'));
  await click('[data-action=startsafter-choose]'); await until(`!!document.querySelector('[data-s=startsafter-choices]')`);
  check('pressing it lists exactly the project\'s other two tasks still to do', eq((await ev(`[...document.querySelectorAll('[data-s=startsafter-choices] [data-s=startsafter-choice]')].map(c => c.dataset.id)`)).sort(), ['tkB2', 'tkB3']), await text('[data-s=startsafter-choices]'));
  await click('[data-s=startsafter-choice][data-id=tkB3]');
  await until(`(JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(x => x.id === 'tkB1').after || []).includes('tkB3') && document.querySelector('[data-s=startsafter-line]')?.textContent.startsWith('It starts after')`);
  check('ticking "Order the boards" makes the line read "It starts after “Order the boards”." and saves its id', (await text('[data-s=startsafter-line]')).trim() === 'It starts after “Order the boards”.' && eq((await tasks()).items.find(x => x.id === 'tkB1').after, ['tkB3']), [await text('[data-s=startsafter-line]'), (await tasks()).items.find(x => x.id === 'tkB1').after]);
  await go('today/tasks/tkB3', 2026, 10, 15, 19, 8);
  await click('[data-action=startsafter-choose]'); await until(`!!document.querySelector('[data-s=startsafter-choices]')`);
  check('on "Order the boards" the choices do not include "Build the frame" (it starts after this one: no circles)', eq(await ev(`[...document.querySelectorAll('[data-s=startsafter-choice]')].map(c => c.dataset.id)`), ['tkB2']), await text('[data-s=startsafter-choices]'));
  await go('today/tasks', 2026, 10, 15, 19, 9);
  check('on Tasks, "Build the frame" shows "Starts after: Order the boards"', (await text('.task-row[data-id=tkB1] [data-s=task-starts-after]')).trim() === 'Starts after: Order the boards' && !(await exists('.task-row[data-id=tkB2] [data-s=task-starts-after]')), await text('.task-row[data-id=tkB1]'));
  await click('[data-s=task-done][data-id=tkB3]'); await until(`!document.querySelector('.task-row[data-id=tkB1] [data-s=task-starts-after]')`);
  check('once "Order the boards" is done, "Build the frame" no longer shows what it starts after', (await exists('.task-row[data-id=tkB1]')) && !(await exists('.task-row[data-id=tkB1] [data-s=task-starts-after]')), await text('.task-row[data-id=tkB1]'));

  console.log('  Layout with steps and "Starts after"');
  await editStorage(`s => { const a = s.tasks.items.find(x => x.id === 'tkB3'); a.done = false; a.doneOn = null; const b = s.tasks.items.find(x => x.id === 'tkB1'); delete b.after; b.steps = ${JSON.stringify(mkSteps('Measure the wall', 'Order the boards', 'Level the ground'))}; }`);
  const shot = async name => { await ev(`document.getElementById('taskSteps').scrollIntoView(); window.scrollBy(0, -8)`); await sleep(300); const r = await T.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${SHOTS}/${name}.png`, Buffer.from(r.data, 'base64')); };
  const openBoth = async () => { await click('[data-action=steps-change]'); await click('[data-action=startsafter-choose]'); await until(`!!document.querySelector('#taskSteps [data-action=step-up]') && !!document.querySelector('[data-s=startsafter-choices]')`); };
  await T.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await go('today/tasks/tkB1', 2026, 10, 15, 19, 20); await openBoth(); await shot('task-steps-desktop-1280');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 740, deviceScaleFactor: 2, mobile: true });
  await go('today/tasks/tkB1', 2026, 10, 15, 19, 21); await openBoth();
  check('phone 360 px: the task page with steps being changed and the "Starts after" choices open does not scroll sideways', (await ev('document.documentElement.scrollWidth <= innerWidth')), await ev('[document.documentElement.scrollWidth, innerWidth]'));
  const smallS = await ev(`[...document.querySelectorAll('#taskSteps button, #taskSteps label, #taskSteps input:not([type=checkbox]), #taskStartsAfter button, #taskStartsAfter label')].filter(b => b.offsetParent !== null).map(b => ({ t: (b.getAttribute('aria-label') || b.textContent || b.id).trim().slice(0, 24), h: Math.round(b.getBoundingClientRect().height) })).filter(x => x.h < 44)`);
  check('phone 360 px: every button and tick-box label in the Steps and "Starts after" cards is at least 44 px tall', (await ev(`document.querySelectorAll('#taskSteps [data-action=step-up], #taskStartsAfter label').length`)) >= 5 && smallS.length === 0, smallS.slice(0, 6));
  await shot('task-steps-phone-360');
  await T.send('Emulation.clearDeviceMetricsOverride');

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
