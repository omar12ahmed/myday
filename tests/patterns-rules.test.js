// What MyDay has noticed: the pattern engine (app/src/data/patterns/), on the app's own code bundled for Node, with
// made-up histories — nothing shown without enough examples, only days you used MyDay counted, each pattern's
// evidence in numbers, your answers (a "Not really" stays hidden until there's clearly more evidence), preferences in
// Build my day and "Review my plan" (and nothing changed without them), reading saved preferences, and tasks that keep
// moving (counting moves, "stuck", each answer to "What's getting in the way?", letting go). No browser.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const dir = path.join(os.tmpdir(), `myday-patterns-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  const src = p => JSON.stringify(path.join(ROOT, 'app/src/data', p));
  fs.writeFileSync(path.join(dir, 'kit.ts'), [
    `export * from ${src('patterns/notice')};`, `export * from ${src('patterns/saved')};`, `export * from ${src('patterns/adapt')};`,
    `export * from ${src('tasks')};`, `export { proposeBuild, proposeReview } from ${src('proposal')};`, `export { freshState, normalize } from ${src('normalize')};`,
    `export { makeTask, minutesLabel, limitFor } from ${src('plan')};`, `export { shift, todayKey, parseKey } from ${src('dates')};`,
  ].join('\n'));
  const K = await import(pathToFileURL(await bundle(path.join(dir, 'kit.ts'), path.join(dir, 'out'))).href);
  const k = '2026-10-15'; // a Thursday
  const before = n => K.shift(k, -n);
  const fresh = () => K.freshState();
  // A day you used MyDay (checked in, unless `extra` says otherwise) with the given tasks: [category, minutes, done].
  const day = (d, date, tasks, extra = {}) => {
    d.days[date] = { energy: 3, rest: false, builtAt: date + 'T08:00', checkedIn: true, tasks: tasks.map(([cat, min, done]) => Object.assign(K.makeTask({ id: null, title: `${cat} ${min}`, minutes: min }, cat, null), { done })), ...extra };
  };
  const find = (d, id) => K.findPatterns(d, k).find(p => p.id === id);
  const session = (date, planned, actualMin, time = '19:00', extra = {}) => ({ id: 's' + Math.random(), courseId: null, taskId: null, title: 'Pharmacology', date, startedAt: `${date}T${time}`, plannedMin: planned, short: false,
    status: 'done', runningSince: null, activeMs: actualMin * 60000, endedAt: `${date}T21:00`, checkin: null, taskDone: null, todayUid: null, ...extra });

  console.log('\n[1] Nothing until there are enough examples');
  let d = fresh();
  check('a new MyDay notices nothing', eq(K.findPatterns(d, k), []));
  for (let i = 1; i <= 9; i++) day(d, before(i), [['learning', i <= 5 ? 20 : 60, i <= 5]]);
  check('9 learning tasks, however clear the difference, aren\'t enough (10 needed)', !find(d, 'size:learning'));

  console.log('\n[2] Shorter tasks get done more often');
  d = fresh();
  // 9 tasks of 25 min (7 done), 7 of 60 min (2 done), one a day for 16 days.
  for (let i = 1; i <= 16; i++) day(d, before(i), [['learning', i <= 9 ? 25 : 60, i <= 9 ? i <= 7 : i <= 11]]);
  let p = find(d, 'size:learning');
  check('found: "Shorter learning tasks get done more often"', p && p.title === 'Shorter learning tasks get done more often', p);
  check('…with the evidence in numbers (the shortest length that says it: 25 min)', p && p.why === 'In the last 8 weeks, 7 of 9 learning tasks of 25 min or less were ticked off, compared with 2 of 7 longer ones.', p && p.why);
  check('…16 examples: an early sign, since its first day', p && p.examples === 16 && p.strength === 'early' && p.since === before(16) && p.last === before(1));
  check('…and what MyDay could do with it: keep learning tasks to 25 min', p && eq(p.use, { kind: 'maxMinutes', category: 'learning', minutes: 25, label: 'Keep learning tasks to 25 min or less when building my day' }));
  for (let i = 17; i <= 24; i++) day(d, before(i), [['learning', i % 2 ? 25 : 60, i % 2 === 1]]);
  check('from 20 examples it\'s a clear pattern', find(d, 'size:learning').strength === 'clear' && find(d, 'size:learning').examples === 24);
  const noDiff = fresh();
  for (let i = 1; i <= 16; i++) day(noDiff, before(i), [['learning', i <= 8 ? 25 : 60, i % 2 === 0]]);
  check('no clear difference (half of each done) → nothing', !find(noDiff, 'size:learning'));

  console.log('\n[3] Only days you used MyDay, in the last 8 weeks');
  d = fresh();
  for (let i = 1; i <= 16; i++) day(d, before(i), [['learning', i <= 9 ? 25 : 60, i <= 9 ? i <= 7 : i <= 11]]);
  for (let i = 30; i <= 45; i++) day(d, before(i), [['learning', 60, false], ['admin', 10, false]], { checkedIn: false }); // nothing ticked, no check-in
  check('days with nothing ticked off and no check-in don\'t count (the tasks may have been done without ticking)', find(d, 'size:learning').examples === 16);
  day(d, before(46), [['learning', 60, false], ['admin', 10, true]], { checkedIn: false });
  check('…a day with something ticked off does', find(d, 'size:learning').examples === 17);
  day(d, before(47), [['learning', 60, false]], { checkedIn: true });
  check('…and so does a day with the evening check-in', find(d, 'size:learning').examples === 18);
  day(d, before(70), [['learning', 60, false]], { checkedIn: true });
  day(d, k, [['learning', 60, false]], { checkedIn: true });
  d.days[before(48)] = { energy: 1, rest: true, builtAt: before(48) + 'T08:00', checkedIn: true, tasks: [] };
  check('…but not days over 8 weeks ago, today, or rest days', find(d, 'size:learning').examples === 18);

  console.log('\n[4] Study sessions: how long, and when');
  d = fresh();
  d.study.sessions = [1, 2, 3, 4, 5, 6].map(i => session(before(i * 2), 60, 25 + i));
  p = find(d, 'length:study');
  check('6 sessions planned for 60 min that lasted about 28 → "Study sessions usually end sooner than planned"', p && p.title === 'Study sessions usually end sooner than planned'
    && p.why === 'In the last 8 weeks, your 6 study sessions were usually planned for about 60 min and lasted about 30 min.', p && p.why);
  check('…MyDay could keep learning tasks to about that length (30 min)', p && p.use.kind === 'maxMinutes' && p.use.minutes === 30);
  d.study.sessions.push(session(before(1), 60, 10, '19:00', { short: true }), session(before(1), 60, 10, '19:00', { status: 'active' }));
  check('"Just 15 minutes" sessions and one still going aren\'t counted', find(d, 'length:study').examples === 6);
  d.study.sessions = [1, 2, 3, 4, 5].map(i => session(before(i), 30, 50));
  p = find(d, 'length:study');
  check('sessions that run much longer → "often run longer than planned", with nothing to change', p && p.title === 'Study sessions often run longer than planned' && p.use === null);
  d.study.sessions = [1, 2, 3, 4].map(i => session(before(i), 60, 20));
  check('4 sessions aren\'t enough (5 needed)', !find(d, 'length:study'));
  d.study.sessions = Array.from({ length: 12 }, (_, i) => session(before(i + 1), 30, 30, i < 9 ? '19:30' : '10:00'));
  p = find(d, 'time:study');
  check('9 of 12 sessions from 17:00 → "You usually study in the evening"', p && p.title === 'You usually study in the evening' && p.why === '9 of your 12 study sessions in the last 8 weeks started from 17:00.' && p.use === null, p && p.why);
  d.study.sessions = Array.from({ length: 12 }, (_, i) => session(before(i + 1), 30, 30, i < 7 ? '19:30' : '10:00'));
  check('7 of 12 isn\'t clear enough (two thirds needed)', !find(d, 'time:study'));

  console.log('\n[5] Energy: after short nights, and on work days');
  d = fresh();
  const ctx = (date, energy, hours) => { d.context[date] = { energy, sleep: { start: null, end: null, estimatedHours: hours } }; };
  [[1, 2, 5], [2, 2, 5.5], [3, 1, 4], [4, 4, 8], [5, 4, 7.5], [6, 5, 9], [7, 3, 6.5]].forEach(([i, e, h]) => ctx(before(i), e, h));
  p = find(d, 'sleep-energy');
  check('after under 6 hours: about 1.7; after 7 hours or more: about 4.3 → "lower after a short night" (6.5 hours not counted either way)', p && p.why === "After less than 6 hours' sleep your energy was about 1.7 out of 5 (3 days), compared with about 4.3 after 7 hours or more (3 days)." && p.examples === 6, p && p.why);
  d = fresh();
  for (let i = 1; i <= 10; i++) {
    const date = before(i), work = i <= 5;
    d.context[date] = { energy: work ? 2 : 4, sleep: { start: null, end: null, estimatedHours: null } };
    if (work) d.commitments.push({ id: 'w' + i, kind: 'work', title: 'Shift', start: `${date}T07:00`, end: `${date}T19:00` });
  }
  p = find(d, 'work-energy');
  check('energy 2 on 5 work days and 4 on 5 days off → "usually lower on work days"', p && p.title === 'Your energy is usually lower on work days' && p.why === 'About 2 out of 5 on 5 work days, compared with about 4 on 5 days off, in the last 8 weeks.', p && p.why);
  for (let i = 1; i <= 10; i++) d.context[before(i)].energy = 3;
  check('no difference → nothing', !find(d, 'work-energy'));

  console.log('\n[6] How many tasks, and which kind gets left');
  d = fresh();
  for (let i = 1; i <= 7; i++) day(d, before(i), [['learning', 20, true], ['admin', 10, i <= 6]]);
  for (let i = 8; i <= 15; i++) day(d, before(i), [['learning', 20, true], ['admin', 10, i <= 9], ['health', 15, i <= 9]]);
  p = find(d, 'count');
  check('everything ticked off on 6 of 7 two-task days but 2 of 8 three-task days → "fewer tasks"', p && p.why === 'You ticked off everything on 6 of 7 days with 2 tasks, and on 2 of 8 days with 3.', p && p.why);
  check('…MyDay could plan at most 2 tasks a day', p && eq(p.use, { kind: 'maxTasks', count: 2, label: 'Plan at most 2 tasks a day, even when my energy allows more' }));
  d = fresh();
  for (let i = 1; i <= 8; i++) day(d, before(i), [['admin', 15, i <= 3], ['learning', 20, true], ['health', 15, i !== 1]]);
  p = find(d, 'left:admin');
  check('5 of 8 admin tasks not ticked off, against 1 of 16 others → "Admin tasks are the ones most often left for another day", with a tip, nothing to change', p && p.title === 'Admin tasks are the ones most often left for another day'
    && p.why === "5 of your 8 admin tasks in the last 8 weeks weren't ticked off, compared with 1 of 16 other tasks." && p.use === null && /first step/.test(p.tip), p && p.why);

  console.log('\n[7] Your answers');
  d = fresh();
  for (let i = 1; i <= 16; i++) day(d, before(i), [['learning', i <= 9 ? 25 : 60, i <= 9 ? i <= 7 : i <= 11]]);
  let n = K.noticed(d, k);
  check('not answered yet → new', n.fresh.length === 1 && n.fresh[0].id === 'size:learning' && n.confirmed.length === 0);
  K.answerPattern(d.patterns, 'size:learning', 'no', 16, 'Shorter learning tasks get done more often');
  check('"Not really" → hidden', K.noticed(d, k).fresh.length === 0 && K.noticed(d, k).confirmed.length === 0);
  for (let i = 17; i <= 20; i++) day(d, before(i), [['learning', 25, true]]);
  check('…still hidden with a little more evidence (20 examples, 8 more needed)', K.noticed(d, k).fresh.length === 0);
  for (let i = 21; i <= 24; i++) day(d, before(i), [['learning', 25, true]]);
  n = K.noticed(d, k);
  check('…shown again with clearly more (24 = 16 + 8): "Noticed again"', n.fresh.length === 1 && n.fresh[0].again === true);
  K.answerPattern(d.patterns, 'size:learning', 'yes', 24, 'Shorter learning tasks get done more often');
  n = K.noticed(d, k);
  check('"That\'s right" → among the ones you said are right', n.fresh.length === 0 && n.confirmed.length === 1 && n.confirmed[0].p.id === 'size:learning');
  d.days = {};
  n = K.noticed(d, k);
  check('…and still there, marked less clear, when the evidence has gone', n.confirmed.length === 1 && n.confirmed[0].p === null && n.confirmed[0].title === 'Shorter learning tasks get done more often');
  check('"Forget my answer" removes it', K.forgetAnswer(d.patterns, 'size:learning') && K.noticed(d, k).confirmed.length === 0);

  console.log('\n[8] Preferences in Build my day');
  d = fresh();
  d.lists = { learning: [{ id: 'L1', title: 'Pharmacology', minutes: 60 }], admin: [{ id: 'A1', title: 'Emails', minutes: 15 }], health: [{ id: 'H1', title: 'Walk', minutes: 30 }] };
  const plain = K.proposeBuild(d, k, 5);
  check('without preferences, the plan is exactly as before (3 tasks at energy 5, 60 min)', plain.items.length === 3 && plain.items[0].minutes === 60 && plain.items.every(i => i.note === null && i.why === null) && !plain.fewer);
  K.setMaxMinutes(d.patterns, 'learning', 25, 'size:learning', 'MyDay noticed: 7 of 9 …');
  let b = K.proposeBuild(d, k, 5);
  const L = b.items.find(i => i.task.category === 'learning');
  check('with "learning up to 25 min": shortened to 25, keeping how long it was (shown "25 min (shortened from 60)")', L.minutes === 25 && L.task.minutes === 25 && L.task.baseMinutes === 60 && K.minutesLabel(25, 60, false) === '25 min (shortened from 60)');
  check('…with a note and its "Why?"', L.note === 'Shortened to 25 min — your length for learning tasks.' && L.why === 'MyDay noticed: 7 of 9 …');
  check('…other kinds of task unchanged', b.items.find(i => i.task.category === 'health').minutes === 30 && b.items.find(i => i.task.category === 'health').note === null);
  K.setMaxTasks(d.patterns, 2);
  b = K.proposeBuild(d, k, 5);
  check('with "at most 2 tasks": 2 at energy 5, and it says so', b.items.length === 2 && b.fewer.note === '2 tasks today, as you chose (your energy allows 3).' && b.fewer.why === 'You chose this in What MyDay has noticed.');
  b = K.proposeBuild(d, k, 2);
  check('…never more than your energy allows (1 at energy 2), with no note', b.items.length === 1 && !b.fewer);
  check('room on today\'s plan follows it too', K.taskLimit(d, 5) === 2 && K.taskLimit(d, 1) === 1);
  d.days[k] = { energy: 5, rest: false, builtAt: k + 'T08:00', checkedIn: false, tasks: [K.makeTask({ id: 'L1', title: 'Pharmacology', minutes: 25 }, 'learning', null)] };
  d.context[k] = { energy: 5, sleep: { start: null, end: null, estimatedHours: null } };
  const r = K.proposeReview(d, k);
  check('"Review my plan" adds only up to your most (1 more, not 2)', r.items.length === 2);
  check('changing a preference to the same value isn\'t a change', K.setMaxTasks(d.patterns, 2) === false && K.setMaxMinutes(d.patterns, 'learning', 25) === false);

  console.log('\n[9] Reading saved preferences');
  const rep = { dropped: 0 };
  const np = K.normalizePatterns({ prefs: { maxMinutes: { learning: { value: 25, on: '2026-10-01', from: 'size:learning', why: 'w' }, admin: { value: 9999 }, health: 'x' }, maxTasks: { value: 2, on: '2026-10-01' }, futurePref: 1 },
    answers: { a: { said: 'yes', on: '2026-10-01', examples: 12, title: 'T' }, b: { said: 'maybe', on: '2026-10-01' }, c: 'x' }, futurePart: { kept: true } }, rep);
  check('good preferences and answers are kept; unreadable ones are left out and counted (4); unknown parts kept', np.prefs.maxMinutes.learning.value === 25 && np.prefs.maxMinutes.admin === null && np.prefs.maxMinutes.health === null && np.prefs.maxTasks.value === 2
    && Object.keys(np.answers).join() === 'a' && rep.dropped === 4 && np.prefs.futurePref === 1 && eq(np.futurePart, { kept: true }), [rep.dropped, np]);
  check('nothing saved yet → no preferences, no answers', eq(K.normalizePatterns(undefined, { dropped: 0 }), { prefs: { maxMinutes: { learning: null, admin: null, health: null }, maxTasks: null }, answers: {} }));
  const fromOld = K.normalize({ ...JSON.parse(JSON.stringify(fresh())), patterns: undefined, tasks: { lists: [], items: [{ id: 'old', title: 'From 1.5.0', listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-04T10:00' }] } });
  check('saved data from 1.5.0: no preferences, and its tasks get the new fields (0 moves, no answers, not let go)', fromOld.patterns.answers && eq(fromOld.patterns.prefs.maxTasks, null)
    && fromOld.tasks.items[0].postponed === 0 && eq(fromOld.tasks.items[0].blockers, []) && fromOld.tasks.items[0].letGoOn === null);

  console.log('\n[10] A task that keeps moving');
  const today = K.todayKey();
  d = fresh();
  const id = K.addTask(d.tasks, { title: 'Sort out the bills', due: today, listId: 'tl1', category: 'admin' });
  const T = () => d.tasks.items.find(x => x.id === id);
  K.moveToTomorrow(d.tasks, id);
  check('"Tomorrow" counts as a move', T().postponed === 1);
  K.editTask(d.tasks, id, { due: K.shift(today, 5) });
  K.editTask(d.tasks, id, { due: K.shift(today, 2) });
  K.editTask(d.tasks, id, { due: null });
  check('a later date counts; an earlier one, or clearing it, doesn\'t', T().postponed === 2);
  K.editTask(d.tasks, id, { due: today }); K.editTask(d.tasks, id, { due: K.shift(today, 1) });
  check('3 moves → "stuck"', T().postponed === 3 && K.isStuck(d, T(), today));
  const old = K.addTask(d.tasks, { title: 'Return the parcel', due: K.shift(today, -7) });
  check('a week past its date → stuck too; 6 days isn\'t', K.isStuck(d, d.tasks.items.find(x => x.id === old), today) && !K.isStuck(d, d.tasks.items.find(x => x.id === old), K.shift(today, -1)));
  check('"too big" needs a first step written', K.unstick(d, id, { reason: 'big', step: '  ' }, today) === null && T().blockers.length === 0);
  let msg = K.unstick(d, id, { reason: 'big', step: 'open the bank app' }, today);
  const stepTask = d.tasks.items.find(x => x.title === 'Open the bank app' || x.title === 'open the bank app');
  check('"too big" + a first step → that step is a 10-minute task for today, in the same list and kind; the whole task waits under Any time', stepTask && stepTask.minutes === 10 && stepTask.due === today && stepTask.listId === 'tl1' && stepTask.category === 'admin' && T().due === null
    && msg === `Added “open the bank app” for today (10 min). “Sort out the bills” waits under Any time.`, msg);
  check('…the answer is kept, its moves start again, and it isn\'t stuck any more', eq(T().blockers, [{ reason: 'big', on: today }]) && T().postponed === 0 && !K.isStuck(d, T(), today));
  K.unstick(d, old, { reason: 'boring' }, today);
  let o = d.tasks.items.find(x => x.id === old);
  check('"boring" → 10 minutes, today', o.minutes === 10 && o.due === today);
  K.unstick(d, old, { reason: 'info', need: 'the reference number' }, today);
  o = d.tasks.items.find(x => x.id === old);
  check('"missing something" → noted ("Needs: …") and waits under Any time', o.notes.startsWith('Needs: the reference number') && o.due === null);
  msg = K.unstick(d, old, { reason: 'tired' }, today);
  o = d.tasks.items.find(x => x.id === old);
  const wd = K.parseKey(o.due).getDay();
  check('"too tired", with no rota → the weekend', (wd === 0 || wd === 6) && o.due > today && msg === 'Moved to the weekend.', [o.due, msg]);
  d.rota = K.normalize({ ...JSON.parse(JSON.stringify(fresh())), rota: { patterns: [{ id: 'p1', effectiveFrom: null, anchor: K.shift(today, 1), cycle: ['day', 'day', 'off', 'off'] }] } }).rota;
  check('…with a rota → your next day off (2 work days, then off)', K.nextDayOff(d, today).date === K.shift(today, 3) && K.nextDayOff(d, today).label === 'your next day off', K.nextDayOff(d, today));
  K.unstick(d, old, { reason: 'notneeded' }, today);
  o = d.tasks.items.find(x => x.id === old);
  check('"doesn\'t matter any more" → let go: under Done, not due today, not stuck', o.letGoOn === today && K.groupOf(d, o, today) === 'done' && !K.dueForToday(d, today).some(x => x.id === old) && !K.isStuck(d, o, today));
  K.setTaskDone(d, old, false);
  o = d.tasks.items.find(x => x.id === old);
  check('…unticking it brings it back', o.letGoOn === null && K.groupOf(d, o, today) !== 'done');
  check('every answer is kept on the task (4 here)', o.blockers.map(b => b.reason).join() === 'boring,info,tired,notneeded');

  console.log('\n[11] What usually gets in the way');
  d = fresh();
  for (const [i, r] of [[1, 'start'], [2, 'start'], [3, 'big'], [4, 'start']]) {
    const t = K.addTask(d.tasks, { title: 'Task ' + i });
    d.tasks.items.find(x => x.id === t).blockers.push({ reason: r, on: before(i) });
  }
  p = find(d, 'blocker');
  check('"I don\'t know where to start" 3 of 4 times → a pattern, with what MyDay does about it', p && p.title === 'What usually gets in the way: “I don\'t know where to start”' && p.why === 'You chose that 3 of the 4 times you said what was in the way of a task.' && /first step/.test(p.tip), p);

  fs.rmSync(dir, { recursive: true, force: true });
  const s = summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
