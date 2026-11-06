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
    `export * from ${src('tasks')};`, `export * from ${src('offers')};`, `export { proposeBuild, proposeReview } from ${src('proposal')};`, `export { freshState, normalize } from ${src('normalize')};`,
    `export { makeTask, minutesLabel, limitFor } from ${src('plan')};`, `export { shift, todayKey, parseKey, shortDate } from ${src('dates')};`,
    // Today's learning follows Study, and Tidy up (specs/today-learning-and-tidy.md).
    `export { chooseTasks, chooseAdditional, learningForToday, queueTask, toggleRoll, tickStudyOnPlan, studiedTitle, setDone, sessionCounts, planStudy, studyTaskId, taskFromQueue } from ${src('plan')};`,
    `export { applyProposal } from ${src('proposal')};`, `export { OLD_LEARNING_STARTERS, SEED } from ${src('normalize')};`,
    `export { tidyCandidates, letGoOf, undoLetGo, oldStarters, removeOldStarters, restoreOldStarters } from ${src('tidy')};`,
    `export { howYouWork } from ${JSON.stringify(path.join(ROOT, 'app/src/ai/askContext'))};`,
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
  check('moved once is not stuck', T().postponed === 1 && !K.isStuck(d, T(), today));
  K.editTask(d.tasks, id, { due: K.shift(today, 5) });
  K.editTask(d.tasks, id, { due: K.shift(today, 2) });
  K.editTask(d.tasks, id, { due: null });
  check('a later date counts; an earlier one, or clearing it, doesn\'t', T().postponed === 2);
  check('moved twice is stuck (the threshold is 2 since 1.123.0)', K.STUCK_MOVES === 2 && K.isStuck(d, T(), today), [K.STUCK_MOVES, T().postponed]);
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

  // "I don't know where to start", handed over to Ask MyDay: kept with the task, which is otherwise left as it was.
  const ns = K.addTask(d.tasks, { title: 'Plan the allotment', due: K.shift(today, 2), listId: 'tl1', category: 'admin' });
  const NS = () => d.tasks.items.find(x => x.id === ns);
  K.editTask(d.tasks, ns, { due: K.shift(today, 4) }); K.editTask(d.tasks, ns, { due: K.shift(today, 6) });
  const nsBefore = JSON.stringify(NS());
  check('noting "start" returns true and records it for today', K.noteBlocker(d, ns, 'start', today) === true && eq(NS().blockers, [{ reason: 'start', on: today }]), NS().blockers);
  check('…leaving its moves, its date and its title as they were', NS().postponed === 2 && NS().due === K.shift(today, 6) && NS().title === 'Plan the allotment' && JSON.stringify({ ...NS(), blockers: [] }) === JSON.stringify({ ...JSON.parse(nsBefore), blockers: [] }), NS());
  check('noting "start" again the same day returns false and adds nothing', K.noteBlocker(d, ns, 'start', today) === false && eq(NS().blockers, [{ reason: 'start', on: today }]), NS().blockers);
  check('noting "start" on another day adds a second entry', K.noteBlocker(d, ns, 'start', K.shift(today, 1)) === true && eq(NS().blockers, [{ reason: 'start', on: today }, { reason: 'start', on: K.shift(today, 1) }]), NS().blockers);
  check('noting a task that isn\'t there returns false', K.noteBlocker(d, 'tkNone', 'start', today) === false);
  for (let i = 2; i < K.TASK_LIMITS.blockers + 5; i++) K.noteBlocker(d, ns, 'start', K.shift(today, i));
  const st = K.addTask(d.tasks, { title: 'Clear the loft', listId: 'tl1', category: 'admin' }), ST = () => d.tasks.items.find(x => x.id === st);
  ST().postponed = 3;
  check('a stuck task, handed over, steps back for a week like any answer; its moves stay, so a week later it offers itself again', K.isStuck(d, ST(), today) && K.noteBlocker(d, st, 'start', today)
    && !K.isStuck(d, ST(), today) && ST().postponed === 3 && K.isStuck(d, ST(), K.shift(today, 8)), ST());
  const stMsg = K.unstick(d, st, { reason: 'start', step: 'Find the loft key' }, today);
  check('…and finishing the card the same day still makes the first step a task, but doesn\'t count the answer twice', !!stMsg && d.tasks.items.some(x => x.title === 'Find the loft key' && x.due === today)
    && ST().postponed === 0 && ST().blockers.filter(b => b.reason === 'start' && b.on === today).length === 1, ST().blockers);
  check('the answers kept are capped at the limit, keeping the newest', NS().blockers.length === K.TASK_LIMITS.blockers && NS().blockers[NS().blockers.length - 1].on === K.shift(today, K.TASK_LIMITS.blockers + 4), NS().blockers.length);

  console.log('\n[10b] A task moved to a later day comes off today\'s plan (and only then)');
  {
    const p2 = fresh(), built = date => ({ energy: 4, rest: false, builtAt: date + 'T08:00', checkedIn: false, tasks: [] });
    p2.days[k] = built(k);
    const a = K.addTask(p2.tasks, { title: 'Post the form', due: k });
    K.addToTodaysPlan(p2, a, k);
    const T2 = id => p2.tasks.items.find(x => x.id === id);
    check('on today\'s plan to begin with', T2(a).plannedOn === k && p2.days[k].tasks.length === 1);
    check('still today: it stays', !K.leaveTodaysPlanIfLater(p2, a, k) && p2.days[k].tasks.length === 1);
    K.editTask(p2.tasks, a, { due: K.shift(k, 2) });
    check('a later day: off today\'s plan, and the link cleared', K.leaveTodaysPlanIfLater(p2, a, k) && p2.days[k].tasks.length === 0 && T2(a).plannedOn === null && T2(a).planUid === null);
    const b = K.addTask(p2.tasks, { title: 'Ring the bank', due: k }); K.addToTodaysPlan(p2, b, k);
    p2.days[k].tasks.find(x => x.uid === T2(b).planUid).done = true; K.editTask(p2.tasks, b, { due: K.shift(k, 1) });
    check('already ticked on the plan: it stays there', !K.leaveTodaysPlanIfLater(p2, b, k) && p2.days[k].tasks.length === 1);
    const y = K.shift(k, -1); p2.days[y] = built(y);
    const c = K.addTask(p2.tasks, { title: 'From yesterday', due: y }); K.addToTodaysPlan(p2, c, y);
    K.editTask(p2.tasks, c, { due: K.shift(k, 3) });
    check('yesterday\'s plan is history: left as it was', !K.leaveTodaysPlanIfLater(p2, c, k) && p2.days[y].tasks.length === 1);
    const e = K.addTask(p2.tasks, { title: 'Clean the oven', due: k }); K.addToTodaysPlan(p2, e, k);
    const uid = T2(e).planUid, said = K.unstick(p2, e, { reason: 'tired' }, k);
    check('"too tired" moves it on and off today\'s plan, and says so', said.endsWith(', and off today\'s plan.') && !p2.days[k].tasks.some(x => x.uid === uid) && T2(e).due > k, said);
    check('…the plan\'s other tasks are untouched', p2.days[k].tasks.length === 1 && p2.days[k].tasks[0].done);
  }

  console.log('\n[10c] Help me start: its answers, kept with the task');
  {
    const h = fresh();
    const hid = K.addTask(h.tasks, { title: 'Pay council tax', due: today, listId: 'tl1', category: 'admin' });
    const H = () => h.tasks.items.find(x => x.id === hid);
    check('noting "perfect" returns true and keeps { reason: "other", on, kind: "perfect" }', K.noteBlocker(h, hid, 'other', today, 'perfect') === true && eq(H().blockers, [{ reason: 'other', on: today, kind: 'perfect' }]), H().blockers);
    check('passing a kind always keeps the reason "other", even if another reason was given', K.noteBlocker(h, hid, 'tired', today, 'going') === true && eq(H().blockers[1], { reason: 'other', on: today, kind: 'going' }), H().blockers);
    check('the same kind again the same day returns false and adds nothing', K.noteBlocker(h, hid, 'other', today, 'perfect') === false && H().blockers.length === 2, H().blockers);
    check('a different kind the same day is added', K.noteBlocker(h, hid, 'other', today, 'pulled') === true && H().blockers.length === 3, H().blockers);
    check('plain "start" the same day is added too', K.noteBlocker(h, hid, 'start', today) === true && eq(H().blockers[3], { reason: 'start', on: today }), H().blockers);
    const h2 = fresh(), h2id = K.addTask(h2.tasks, { title: 'Book the dentist', due: today });
    K.noteBlocker(h2, h2id, 'other', today, 'perfect');
    check('a plain reason the same day is still added by unstick when only a kind entry exists that day', K.unstick(h2, h2id, { reason: 'boring' }, today) !== null && eq(h2.tasks.items[0].blockers, [{ reason: 'other', on: today, kind: 'perfect' }, { reason: 'boring', on: today }]), h2.tasks.items[0].blockers);
    const h3 = fresh(), h3id = K.addTask(h3.tasks, { title: 'Clear the desk', due: today });
    const qMsg = K.unstick(h3, h3id, { reason: 'big', step: 'clear one drawer', quiet: true }, today);
    check('unstick with quiet changes the task (the first piece is added) but keeps no answer', !!qMsg && h3.tasks.items.some(x => x.title === 'clear one drawer' && x.due === today) && eq(h3.tasks.items.find(x => x.id === h3id).blockers, []), h3.tasks.items.find(x => x.id === h3id).blockers);
    check('…and "let it go" with quiet lets it go, keeping no answer', !!K.unstick(h3, h3id, { reason: 'notneeded', quiet: true }, today) && h3.tasks.items.find(x => x.id === h3id).letGoOn === today && eq(h3.tasks.items.find(x => x.id === h3id).blockers, []));
    const raw = JSON.parse(JSON.stringify(fresh()));
    raw.tasks = { lists: [], items: [{ id: 'tkL', title: 'Loader', listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-04T10:00', blockers: [
      { reason: 'other', on: today, kind: 'perfect' }, { reason: 'other', on: today, kind: 'later-kind' }, { reason: 'other', on: today, kind: 7 }, { reason: 'other', on: today, kind: '' }, { reason: 'mystery', on: today, kind: 'perfect' }] }] };
    const loaded = K.normalize(raw).tasks.items[0].blockers;
    check('the loader keeps a known kind and an unknown kind string as they are', eq(loaded[0], { reason: 'other', on: today, kind: 'perfect' }) && eq(loaded[1], { reason: 'other', on: today, kind: 'later-kind' }), loaded);
    check('…drops a kind that isn\'t a non-empty string (a number, or empty) but keeps the entry, and drops an unknown reason', eq(loaded[2], { reason: 'other', on: today }) && eq(loaded[3], { reason: 'other', on: today }) && loaded.length === 4, loaded);
    check('a known kind under "other" is that answer', K.answerOf({ reason: 'other', kind: 'perfect' }) === 'perfect' && K.answerOf({ reason: 'other', kind: 'going' }) === 'going' && K.answerOf({ reason: 'other', kind: 'pulled' }) === 'pulled');
    check('an unknown kind, or plain "other", is "other"', K.answerOf({ reason: 'other', kind: 'later-kind' }) === 'other' && K.answerOf({ reason: 'other' }) === 'other');
    check('another reason is itself, whatever its kind', K.answerOf({ reason: 'big' }) === 'big' && K.answerOf({ reason: 'tired', kind: 'perfect' }) === 'tired');
    check('"perfect" is labelled "I want it perfect" and "big" "It\'s too big"', K.answerLabel('perfect') === 'I want it perfect' && K.answerLabel('big') === "It's too big", [K.answerLabel('perfect'), K.answerLabel('big')]);
  }

  console.log('\n[10d] "Later" in Help me start: tomorrow, not counted as a move');
  {
    const n2 = fresh(), built = { energy: 4, rest: false, builtAt: k + 'T08:00', checkedIn: false, tasks: [] };
    n2.days[k] = built;
    const a = K.addTask(n2.tasks, { title: 'Post the form', due: k }), b = K.addTask(n2.tasks, { title: 'Ring the bank', due: k });
    K.addToTodaysPlan(n2, a, k); K.addToTodaysPlan(n2, b, k);
    const T3 = id => n2.tasks.items.find(x => x.id === id);
    T3(a).postponed = 2;
    const said = K.notToday(n2, a, k);
    check('"Later" on a task due today sets the date to tomorrow, leaves the moves as they were, and says so', said === 'It’s on tomorrow, and off today’s plan. Trying counts.' && T3(a).due === K.shift(k, 1) && T3(a).postponed === 2, [said, T3(a)]);
    check('…and takes it off today\'s plan (link cleared, its copy gone), leaving the plan\'s other task', T3(a).plannedOn === null && T3(a).planUid === null && n2.days[k].tasks.length === 1 && n2.days[k].tasks[0].uid === T3(b).planUid, n2.days[k]);
    const c = K.addTask(n2.tasks, { title: 'Sort the post', due: k });
    K.moveToTomorrow(n2.tasks, c);
    check('(for comparison, "Tomorrow" counts as a move)', T3(c).postponed === 1);
    check('a task that isn\'t there returns null', K.notToday(n2, 'tkNone', k) === null);
    const lat = K.addTask(n2.tasks, { title: 'Renew the passport', due: K.shift(k, 5) }), und = K.addTask(n2.tasks, { title: 'Sort the loft' });
    K.addToTodaysPlan(n2, lat, k);
    const m1 = K.notToday(n2, lat, k), m2 = K.notToday(n2, und, k);
    check('a task with a later date keeps its date, and comes off today\'s plan if planned today', T3(lat).due === K.shift(k, 5) && T3(lat).plannedOn === null && T3(lat).planUid === null && m1 === 'It’s off today’s plan. Trying counts.', [m1, T3(lat)]);
    check('a task with no date stays undated, and says it waits under Any time', T3(und).due === null && m2 === 'It waits under Any time. Trying counts.', [m2, T3(und)]);
    const dp = K.addTask(n2.tasks, { title: 'Ticked on the plan', due: k }); K.addToTodaysPlan(n2, dp, k);
    n2.days[k].tasks.find(x => x.uid === T3(dp).planUid).done = true;
    check('a task whose plan copy is already ticked stays on the plan, and still goes to tomorrow', K.notToday(n2, dp, k) === 'It’s on tomorrow. Trying counts.' && T3(dp).plannedOn === k && T3(dp).due === K.shift(k, 1), T3(dp));
    const dn = K.addTask(n2.tasks, { title: 'Already done', due: k }); K.setTaskDone(n2, dn, true);
    check('a done task returns null and stays as it was', K.notToday(n2, dn, k) === null && T3(dn).due === k, T3(dn));
    const lg = K.addTask(n2.tasks, { title: 'Let go of this', due: k }); T3(lg).letGoOn = k;
    check('a let-go task returns null and stays as it was', K.notToday(n2, lg, k) === null && T3(lg).due === k, T3(lg));
  }

  console.log('\n[10e] Start offers on Today, under one attention budget');
  {
    const all = { start: true, nudge: true, noticed: true }, nn = x => ({ lastShownOn: null, shrinkOn: null, ...x });
    const j = (a) => JSON.stringify(a);
    check('with all three applying, the start offer comes first', K.todaysOffer(nn({}), k, all) === 'start', K.todaysOffer(nn({}), k, all));
    check('without a start offer, the nudge comes next', K.todaysOffer(nn({}), k, { nudge: true, noticed: true }) === 'nudge');
    check('with only what MyDay noticed, that is the offer', K.todaysOffer(nn({}), k, { noticed: true }) === 'noticed');
    check('with none applying, there is no offer', K.todaysOffer(nn({}), k, {}) === null && K.todaysOffer(nn({}), k, { start: false, nudge: false, noticed: false }) === null);
    check('once today\'s offer is the nudge, it stays the nudge while it applies, even with a start offer applying', K.todaysOffer(nn({ offerOn: { on: k, kind: 'nudge' } }), k, all) === 'nudge');
    check('…and when that one no longer applies there is no offer at all, even with others applying', K.todaysOffer(nn({ offerOn: { on: k, kind: 'nudge' } }), k, { start: true, noticed: true }) === null);
    check('an offer from yesterday is ignored: today the usual order applies', K.todaysOffer(nn({ offerOn: { on: K.shift(k, -1), kind: 'noticed' } }), k, all) === 'start');
    check('a saved kind this MyDay does not know gives no offer, and neither does "toString"', K.todaysOffer(nn({ offerOn: { on: k, kind: 'newthing' } }), k, all) === null && K.todaysOffer(nn({ offerOn: { on: k, kind: 'toString' } }), k, all) === null);
    check('"Not now" today means no offer', K.todaysOffer(nn({ notNowOn: k }), k, all) === null);
    check('"Not now" yesterday means no offer today either', K.todaysOffer(nn({ notNowOn: K.shift(k, -1) }), k, all) === null);
    check('"Not now" two days ago does not stop today\'s offer', K.todaysOffer(nn({ notNowOn: K.shift(k, -2) }), k, all) === 'start');
    check('"Not now" beats an offer already made today', K.todaysOffer(nn({ notNowOn: k, offerOn: { on: k, kind: 'start' } }), k, all) === null);

    const nm = nn({});
    check('noting today\'s offer sets { on, kind } and returns true', K.markOffer(nm, k, 'start') === true && j(nm.offerOn) === j({ on: k, kind: 'start' }), nm);
    check('noting another the same day returns false and keeps the first', K.markOffer(nm, k, 'nudge') === false && j(nm.offerOn) === j({ on: k, kind: 'start' }), nm);
    check('noting on the next day replaces yesterday\'s', K.markOffer(nm, K.shift(k, 1), 'noticed') === true && j(nm.offerOn) === j({ on: K.shift(k, 1), kind: 'noticed' }), nm);

    const sn = nn({});
    check('"Not now" sets the day and returns true', K.sayNotNow(sn, k) === true && sn.notNowOn === k && sn.quiet === undefined, sn);
    check('…a second time the same day returns false', K.sayNotNow(sn, k) === false && sn.notNowOn === k);
    check('…on another day it sets that day', K.sayNotNow(sn, K.shift(k, 3)) === true && sn.notNowOn === K.shift(k, 3));
    const sq = nn({});
    check('"Not now" to a task also keeps it quiet for a week: { taskId, on }', K.sayNotNow(sq, k, 'tkA') === true && j(sq.quiet) === j([{ taskId: 'tkA', on: k }]), sq);
    check('…the same task again the same day returns false, and a second task adds one more', K.sayNotNow(sq, k, 'tkA') === false && K.sayNotNow(sq, k, 'tkB') === true && sq.quiet.map(q => q.taskId).join() === 'tkA,tkB', sq.quiet);
    const later = K.shift(k, 8);
    K.sayNotNow(sq, later, 'tkA');
    check('…saying it again to a task keeps one entry for it, and entries older than a week are dropped', sq.quiet.length === 1 && j(sq.quiet[0]) === j({ taskId: 'tkA', on: later }), sq.quiet);
    const cap = nn({});
    for (let i = 0; i < 25; i++) K.sayNotNow(cap, k, 'tk' + i);
    check('at most 20 tasks are kept quiet, the newest', cap.quiet.length === 20 && cap.quiet[0].taskId === 'tk5' && cap.quiet[19].taskId === 'tk24', cap.quiet.map(q => q.taskId));

    // Which task a start offer is about.
    const so = () => { const x = fresh(); x.projects.items = [
      { id: 'pjOn', title: 'Paint the hall', summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00' },
      { id: 'pjPa', title: 'Old idea', summary: '', stage: 'explore', status: 'paused', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00' },
      { id: 'pjDn', title: 'Finished idea', summary: '', stage: 'explore', status: 'done', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00' }]; return x; };
    const add = (x, title, over = {}) => { const id = K.addTask(x.tasks, { title }); Object.assign(x.tasks.items.find(t => t.id === id), over); return id; };
    const titleOf = x => K.startOfferTask(x, k)?.title ?? null;
    let x = so();
    add(x, 'Moved once', { postponed: 1 });
    check('a task moved once is not offered', titleOf(x) === null);
    add(x, 'Moved twice', { postponed: 2 });
    check('a task moved twice is offered', titleOf(x) === 'Moved twice');
    add(x, 'Moved four times', { postponed: 4, due: K.shift(k, 3) });
    check('the most moved comes first', titleOf(x) === 'Moved four times');
    add(x, 'Four times, earlier date', { postponed: 4, due: K.shift(k, 1) });
    add(x, 'Four times, no date', { postponed: 4 });
    check('with equal moves, the earliest date comes first (undated last)', titleOf(x) === 'Four times, earlier date');
    x = so(); add(x, 'Four times, no date', { postponed: 4 }); add(x, 'Four times, dated', { postponed: 4, due: K.shift(k, 30) });
    check('…an undated one comes after any dated one', titleOf(x) === 'Four times, dated');
    x = so(); add(x, 'Undated alone', { postponed: 2 });
    check('an undated task moved twice is offered', titleOf(x) === 'Undated alone');
    x = so(); add(x, 'A week past its date', { due: K.shift(k, -7) });
    check('a task a week past its date is offered even with no moves', titleOf(x) === 'A week past its date');
    x = so(); add(x, 'Ticked', { postponed: 5, done: true, doneOn: k }); add(x, 'Let go', { postponed: 5, letGoOn: k });
    add(x, 'Waiting', { postponed: 5, waiting: { on: 'Priya', since: K.shift(k, -3), until: null } });
    check('a done task, a let-go task and a waiting task are not offered', titleOf(x) === null, K.startOfferTask(x, k));
    x = so(); add(x, 'Answered lately', { postponed: 5, blockers: [{ reason: 'tired', on: K.shift(k, -3) }] });
    check('a task you answered "What\'s getting in the way?" for in the last week is not offered', titleOf(x) === null);
    x = so(); add(x, 'Answered long ago', { postponed: 5, blockers: [{ reason: 'tired', on: K.shift(k, -8) }] });
    check('…but one answered over a week ago is', titleOf(x) === 'Answered long ago');
    x = so(); add(x, 'Paused project task', { postponed: 5, projectId: 'pjPa' }); add(x, 'Finished project task', { postponed: 5, projectId: 'pjDn' });
    check('a task in a paused or finished project is not offered', titleOf(x) === null);
    add(x, 'Active project task', { postponed: 2, projectId: 'pjOn' }); add(x, 'No project task', { postponed: 2 });
    check('…but one in an active project, or in no project, is', K.startOfferTask(x, k) && ['Active project task', 'No project task'].includes(titleOf(x)));
    x = so(); const qa = add(x, 'Said not now to', { postponed: 5 }); add(x, 'Another', { postponed: 2 });
    x.nudge.quiet = [{ taskId: qa, on: K.shift(k, -3) }];
    check('a task you said "Not now" to in the last week is left alone: the next one is offered', titleOf(x) === 'Another');
    x.nudge.quiet = [{ taskId: qa, on: K.shift(k, -7) }];
    check('…and seven days later it can be offered again', titleOf(x) === 'Said not now to');
    x = so(); add(x, 'Moved a lot', { postponed: 5 }); x.patterns.prefs.startOffers = false;
    check('with start offers off there is no task', K.startOfferTask(x, k) === null);

    // The preference.
    const pr = fresh().patterns;
    check('switching start offers off saves startOffers: false and returns true', K.setStartOffers(pr, false) === true && pr.prefs.startOffers === false, pr.prefs);
    check('…off again changes nothing and returns false', K.setStartOffers(pr, false) === false && pr.prefs.startOffers === false);
    check('switching them on removes the field and returns true', K.setStartOffers(pr, true) === true && !('startOffers' in pr.prefs), pr.prefs);
    check('…on again changes nothing and returns false', K.setStartOffers(pr, true) === false && !('startOffers' in pr.prefs));
  }

  console.log('\n[10f] Reading Today\'s offer notes and the start offers preference');
  {
    const rd = nudge => K.normalize({ ...JSON.parse(JSON.stringify(fresh())), nudge }).nudge;
    const j = a => JSON.stringify(a);
    check('a good offerOn, notNowOn and quiet are kept', j(rd({ lastShownOn: null, shrinkOn: null, offerOn: { on: '2026-10-15', kind: 'start' }, notNowOn: '2026-10-14', quiet: [{ taskId: 'tkA', on: '2026-10-13' }] }))
      === j({ lastShownOn: null, shrinkOn: null, offerOn: { on: '2026-10-15', kind: 'start' }, notNowOn: '2026-10-14', quiet: [{ taskId: 'tkA', on: '2026-10-13' }] }));
    check('an offerOn with a kind this MyDay does not know is kept, with its other fields', j(rd({ offerOn: { on: '2026-10-15', kind: 'newthing', extra: 1 } }).offerOn) === j({ on: '2026-10-15', kind: 'newthing', extra: 1 }), rd({ offerOn: { on: '2026-10-15', kind: 'newthing', extra: 1 } }).offerOn);
    check('an offerOn with a bad date, an empty kind, a kind over 20 characters, or not an object is dropped', [{ on: '2026-13-45', kind: 'start' }, { on: '2026-10-15', kind: '' }, { on: '2026-10-15', kind: 'x'.repeat(21) }, { on: '2026-10-15', kind: 7 }, 'start', null].every(o => rd({ offerOn: o }).offerOn === undefined));
    check('a kind of 20 characters is kept', rd({ offerOn: { on: '2026-10-15', kind: 'x'.repeat(20) } }).offerOn?.kind === 'x'.repeat(20));
    check('a notNowOn that is not a date is dropped', rd({ notNowOn: 'yesterday' }).notNowOn === undefined && rd({ notNowOn: 5 }).notNowOn === undefined);
    const q = rd({ quiet: [{ taskId: 'tkA', on: '2026-10-13' }, { taskId: 7, on: '2026-10-13' }, { taskId: 'tkB', on: 'nope' }, 'x', { taskId: 'tkC', on: '2026-10-12' }] }).quiet;
    check('quiet keeps only entries with a task id and a date', j(q) === j([{ taskId: 'tkA', on: '2026-10-13' }, { taskId: 'tkC', on: '2026-10-12' }]), q);
    const many = rd({ quiet: Array.from({ length: 30 }, (_, i) => ({ taskId: 'tk' + i, on: '2026-10-13' })) }).quiet;
    check('quiet keeps the last 20', many.length === 20 && many[0].taskId === 'tk10' && many[19].taskId === 'tk29', many.map(x => x.taskId));
    check('with nothing said, none of the three is saved', j(rd({ lastShownOn: null, shrinkOn: null })) === j({ lastShownOn: null, shrinkOn: null }));
    const pf = prefs => K.normalizePatterns({ prefs: { maxMinutes: {}, maxTasks: null, ...prefs }, answers: {} }, { dropped: 0 }).prefs;
    check('startOffers: false is kept', pf({ startOffers: false }).startOffers === false);
    check('startOffers: true, "no" or anything else is dropped', [true, 'no', 0, null].every(v => !('startOffers' in pf({ startOffers: v }))));
    check('moved once, twice and 3 times are said as "once", "twice" and "3 times"', K.movedTimes(1) === 'once' && K.movedTimes(2) === 'twice' && K.movedTimes(3) === '3 times' && K.movedTimes(12) === '12 times');
  }

  console.log('\n[10g] What helps you start: kept, learned, confirmed, and help that steps back');
  {
    const j = a => JSON.stringify(a);
    const day10 = i => K.shift('2026-09-01', i);
    // touchTask, tickStep, editTask
    const tt = { id: 'tkT', title: 'Pay council tax' };
    K.touchTask(tt, '2026-10-10'); K.touchTask(tt, '2026-10-10');
    check('touching a task adds the day once', eq(tt.touched, ['2026-10-10']), tt.touched);
    K.touchTask(tt, '2026-10-05');
    check('…and keeps the days sorted', eq(tt.touched, ['2026-10-05', '2026-10-10']), tt.touched);
    const t12 = { id: 'tkU', title: 'Book the dentist' };
    for (let i = 32; i >= 1; i--) K.touchTask(t12, day10(i));
    check('touching keeps only the last 30 days, sorted', eq(t12.touched, Array.from({ length: 30 }, (_, i) => day10(i + 3))), t12.touched);
    K.touchTask(t12);
    check('with no day given it touches today', t12.touched.at(-1) === K.todayKey(), t12.touched);
    const ts = fresh(), tsId = K.addTask(ts.tasks, { title: 'Sort the post' }), stp = K.addStep(ts.tasks, tsId, 'find the envelope');
    const TS = () => ts.tasks.items.find(x => x.id === tsId);
    check('ticking a step marks the task touched today', K.tickStep(ts.tasks, tsId, stp, true) === true && eq(TS().touched, [K.todayKey()]), TS().touched);
    TS().touched = undefined;
    check('unticking a step does not mark it touched', K.tickStep(ts.tasks, tsId, stp, false) === true && !TS().touched, TS().touched);
    const te = fresh(), teId = K.addTask(te.tasks, { title: 'Write the letter' });
    const TE = () => te.tasks.items.find(x => x.id === teId);
    K.editTask(te.tasks, teId, { notes: 'Use the blue paper' });
    check('editing the notes to something new marks the task touched today', eq(TE().touched, [K.todayKey()]), TE().touched);
    TE().touched = undefined;
    K.editTask(te.tasks, teId, { notes: 'Use the blue paper' });
    check('saving the same notes again does not mark it touched', !TE().touched, TE().touched);
    // The tasks loader
    const rawT = JSON.parse(JSON.stringify(fresh()));
    const base = { title: 'Loader', listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-04T10:00', blockers: [] };
    rawT.tasks = { lists: [], items: [
      { ...base, id: 'tkA', touched: [...Array.from({ length: 32 }, (_, i) => day10(32 - i)), day10(5), 'yesterday', 7, null, '2026-13-45'] },
      { ...base, id: 'tkB', touched: ['nope', 3] }, { ...base, id: 'tkC', touched: 'x' }, { ...base, id: 'tkD' }] };
    const lt = K.normalize(rawT).tasks.items;
    check('the loader keeps a task\'s touched days: each once, sorted, the last 30, and not what isn\'t a date', eq(lt[0].touched, Array.from({ length: 30 }, (_, i) => day10(i + 3))), lt[0].touched);
    check('…and a task whose touched has no dates, or isn\'t a list, ends up with none', !('touched' in lt[1]) && !('touched' in lt[2]) && !('touched' in lt[3]), lt.map(x => x.touched));

    // recordStartSeen
    const rs = { prefs: { maxMinutes: {}, maxTasks: null }, answers: {} };
    check('a use is added with the day, and returns true', K.recordStartSeen(rs, { way: 'five', category: 'admin', taskId: 'tkA' }, k) === true && eq(rs.startSeen, [{ way: 'five', category: 'admin', taskId: 'tkA', on: k }]), rs.startSeen);
    rs.startSeen.unshift({ way: 'five', category: 'admin', taskId: 'tkOld', on: K.shift(k, -57) }, { way: 'step', category: 'admin', taskId: 'tkEdge', on: K.shift(k, -56) });
    K.recordStartSeen(rs, { way: 'smaller', category: 'learning', taskId: 'tkB', pieceId: 'tkP' }, k);
    check('a use older than 8 weeks is dropped when another is recorded (56 days is kept), and a piece id is kept', eq(rs.startSeen.map(x => x.taskId), ['tkEdge', 'tkA', 'tkB']) && rs.startSeen[2].pieceId === 'tkP', rs.startSeen);
    check('the same way on the same task again the same day returns false and adds nothing', K.recordStartSeen(rs, { way: 'smaller', category: 'learning', taskId: 'tkB' }, k) === false && rs.startSeen.length === 3, rs.startSeen);
    check('…but another way, or another task, the same day is added', K.recordStartSeen(rs, { way: 'five', category: 'learning', taskId: 'tkB' }, k) === true && K.recordStartSeen(rs, { way: 'smaller', category: 'learning', taskId: 'tkC' }, k) === true && rs.startSeen.length === 5, rs.startSeen);
    const ex = { prefs: { maxMinutes: {}, maxTasks: null }, answers: {}, startSeen: [{ on: k, way: 'five', category: 'admin', taskId: 'tkA' }, { on: k, way: 'step', category: 'admin', taskId: 'tkA' }, { on: k, way: 'five', category: 'admin', taskId: 'tkB' }, { on: K.shift(k, -1), way: 'five', category: 'admin', taskId: 'tkA' }] };
    check('excusing a task marks only today\'s uses of it as excused, and returns true', K.excuseStartSeen(ex, 'tkA', k) === true && eq(ex.startSeen.map(x => x.excused === true), [true, true, false, false]), ex.startSeen);
    check('…and again changes nothing and returns false, as does a task with no uses today', K.excuseStartSeen(ex, 'tkA', k) === false && K.excuseStartSeen(ex, 'tkNone', k) === false);
    const many = { prefs: { maxMinutes: {}, maxTasks: null }, answers: {}, startSeen: Array.from({ length: 200 }, (_, i) => ({ way: 'five', category: 'admin', taskId: 'tk' + i, on: k })) };
    K.recordStartSeen(many, { way: 'five', category: 'admin', taskId: 'tkLast' }, k);
    check('at most 200 uses are kept, the newest last', many.startSeen.length === 200 && many.startSeen[0].taskId === 'tk1' && many.startSeen[199].taskId === 'tkLast', [many.startSeen.length, many.startSeen[0].taskId]);

    // the startSeen normalise
    const ns = (startSeen, rep = { dropped: 0 }) => ({ out: K.normalizePatterns({ prefs: { maxMinutes: {}, maxTasks: null }, answers: {}, startSeen }, rep).startSeen, rep });
    const good = [{ on: k, way: 'five', category: 'admin', taskId: 'tkA' }, { on: k, way: 'smaller', category: 'learning', taskId: 'tkB', pieceId: 'tkP' },
      { on: k, way: 'x'.repeat(20), category: 'health', taskId: 'tkC' }, { on: k, way: 'newway', category: 'admin', taskId: 'tkD', extra: 1 }];
    let r = ns(good);
    check('the loader keeps good uses (a way up to 20 characters, an optional piece id, a way it doesn\'t know) and counts none as dropped', eq(r.out, good) && r.rep.dropped === 0, r);
    const bad = [{ on: 'soon', way: 'five', category: 'admin', taskId: 'tkA' }, { on: k, way: 'five', category: 'cooking', taskId: 'tkA' }, { on: k, way: 'five', category: 'admin' },
      { on: k, way: 'five', category: 'admin', taskId: 'tkA', pieceId: 7 }, { on: k, way: '', category: 'admin', taskId: 'tkA' }, { on: k, way: 'x'.repeat(21), category: 'admin', taskId: 'tkA' }, 'five'];
    r = ns([...bad, good[0]]);
    check('…drops a bad day, an unknown kind of work, no task, a piece id that isn\'t words, an empty or too long way, or a non-object, and counts each as dropped', eq(r.out, [good[0]]) && r.rep.dropped === 7, r);
    check('…and with nothing good left, or none saved, there is no startSeen', ns(bad).out === undefined && ns(undefined).out === undefined && ns('x').out === undefined);

    // pruneAskSeen and forgetLearned
    const pr = { prefs: { maxMinutes: {}, maxTasks: null }, answers: {}, startSeen: [{ on: K.shift(k, -57), way: 'five', category: 'admin', taskId: 'tkA' }, { on: K.shift(k, -56), way: 'five', category: 'admin', taskId: 'tkB' }] };
    check('pruning leaves the uses of Help me start alone, even old ones (only recording one trims them), and returns false', K.pruneAskSeen(pr, k) === false && eq(pr.startSeen.map(x => x.taskId), ['tkA', 'tkB']), pr.startSeen);
    const fl = { prefs: { maxMinutes: {}, maxTasks: null, askUse: true }, answers: {}, startSeen: [{ on: k, way: 'five', category: 'admin', taskId: 'tkA' }] };
    check('forgetting what it has learned clears startSeen and returns true when only startSeen exists', K.forgetLearned(fl) === true && !('startSeen' in fl) && fl.prefs.askUse === true && K.forgetLearned(fl) === false, fl);

    // startedThatDay
    const sd = fresh();
    sd.projects.items = [{ id: 'pjL', title: 'Paint the hall', summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00', leftOff: { text: 'Taped the edges', at: before(3) + 'T18:30' } }];
    const mk = (id, over = {}) => { const tid = K.addTask(sd.tasks, { title: id }); const t = sd.tasks.items.find(x => x.id === tid); t.id = id; Object.assign(t, over); return t; };
    mk('tkDone', { done: true, doneOn: before(1) }); mk('tkTouch', { touched: [before(2), before(4)] }); mk('tkProj', { projectId: 'pjL' }); mk('tkNone'); mk('tkPiece', { done: true, doneOn: before(5) });
    const sdn = (taskId, on, pieceId) => K.startedThatDay(sd, { on, way: 'smaller', category: 'admin', taskId, ...(pieceId ? { pieceId } : {}) });
    check('you started that day when the task was done that day', sdn('tkDone', before(1)) === true && sdn('tkDone', before(2)) === false);
    check('…or it was touched that day (and not on another day)', sdn('tkTouch', before(4)) === true && sdn('tkTouch', before(2)) === true && sdn('tkTouch', before(3)) === false);
    check('…or its project\'s where you left off was written that day', sdn('tkProj', before(3)) === true && sdn('tkProj', before(4)) === false);
    check('…or the 10-minute piece it made was done that day', sdn('tkNone', before(5), 'tkPiece') === true && sdn('tkNone', before(6), 'tkPiece') === false);
    check('…otherwise not, and a deleted task with no piece is not a start', sdn('tkNone', before(1)) === false && sdn('tkGone', before(1)) === false);

    // the pattern
    const seenOn = (x, list, way, cat, started) => list.forEach((i, n) => {
      const id = `tkS${way}${cat}${i}`; const t = K.addTask(x.tasks, { title: id, category: cat }); const it = x.tasks.items.find(y => y.id === t); it.id = id; if (started.includes(n)) it.touched = [before(i)];
      (x.patterns.startSeen ??= []).push({ on: before(i), way, category: cat, taskId: id });
    });
    const sw = (way, cat, started, days = [9, 8, 7, 6, 5]) => { const x = fresh(); seenOn(x, days, way, cat, started); return x; };
    const swp = find(sw('five', 'learning', [0, 1, 2, 3]), 'start-way:learning:five');
    check('five uses of a five-minute start on learning tasks, 4 of them started: a pattern with its title, evidence and tip', swp && swp.title === 'Five-minute starts work for you on learning tasks' && swp.why === '4 of the last 5 times you used it, you started that day.' && swp.tip === 'Help me start puts it first for these tasks.', swp);
    check('only 3 started: no pattern', !find(sw('five', 'learning', [0, 1, 2]), 'start-way:learning:five'));
    check('only 4 uses (all started): no pattern', !find(sw('five', 'learning', [0, 1, 2, 3], [9, 8, 7, 6]), 'start-way:learning:five'));
    check('today\'s uses are not counted: 4 past uses and one today is no pattern', !find(sw('five', 'learning', [0, 1, 2, 3, 4], [9, 8, 7, 6, 0]), 'start-way:learning:five'));
    check('ticking off the next step never makes a pattern, however often it\'s used', !K.findPatterns(sw('step', 'learning', [0, 1, 2, 3, 4]), k).some(x => x.id.startsWith('start-way')));
    check('thinking it through with Ask MyDay has its own title', find(sw('ask', 'health', [0, 1, 2, 3, 4]), 'start-way:health:ask')?.title === 'Thinking it through with Ask MyDay helps you start health tasks');
    check('a 10-minute piece has its own title', find(sw('smaller', 'learning', [0, 1, 2, 3, 4]), 'start-way:learning:smaller')?.title === 'Starting with a 10-minute piece works for you on learning tasks');
    const both = sw('five', 'learning', [0, 1, 2, 3]); seenOn(both, [9, 8, 7, 6, 5], 'five', 'admin', [0, 1, 2, 3, 4]);
    check('each kind of work has its own pattern (admin apart from learning)', find(both, 'start-way:admin:five')?.title === 'Five-minute starts work for you on admin tasks' && find(both, 'start-way:admin:five').why.startsWith('5 of') && find(both, 'start-way:learning:five').why.startsWith('4 of'));

    const ghost = sw('five', 'learning', [0, 1, 2, 3]); ghost.tasks.items = ghost.tasks.items.filter(t => t.id !== 'tkSfivelearning9');
    check('a use whose task is gone is not counted: 4 left, no pattern', !find(ghost, 'start-way:learning:five'));
    const kept = sw('smaller', 'learning', [0, 1, 2, 3, 4]); kept.tasks.items = kept.tasks.items.filter(t => t.id !== 'tkSsmallerlearning9'); kept.patterns.startSeen.find(s => s.taskId === 'tkSsmallerlearning9').pieceId = kept.tasks.items[0].id;
    check('…unless the piece it made is still there', !!find(kept, 'start-way:learning:smaller'));
    const exc = sw('five', 'learning', [0, 1, 2, 3]); exc.patterns.startSeen[4].excused = true;
    check('a use you followed with "Later" or "Let it go" (excused) is not counted either way: 4 left, no pattern', !find(exc, 'start-way:learning:five'));
    const two = sw('five', 'learning', [0, 1, 2, 3, 4]); seenOn(two, [9, 8, 7, 6, 5], 'ask', 'learning', [0, 1, 2, 3]);
    check('every way that qualifies has its own pattern, in the order five then ask', eq(K.findPatterns(two, k).filter(x => x.id.startsWith('start-way')).map(x => x.id), ['start-way:learning:five', 'start-way:learning:ask']), K.findPatterns(two, k).map(x => x.id));
    const ans = (said, n) => ({ said, on: before(1), examples: 5, title: n });
    two.patterns.answers['start-way:learning:five'] = ans('yes', 'Five-minute starts work for you on learning tasks'); two.patterns.answers['start-way:learning:ask'] = ans('yes', 'Thinking it through with Ask MyDay helps you start learning tasks');
    check('with two ways confirmed, the one with the most starts comes first (five: 5 of 5 beats ask: 4 of 5)', K.startWayFor(two, 'learning', k) === 'five');
    const two2 = sw('five', 'learning', [0, 1, 2, 3]); seenOn(two2, [9, 8, 7, 6, 5], 'ask', 'learning', [0, 1, 2, 3, 4]);
    two2.patterns.answers = two.patterns.answers;
    check('…and with ask at 5 of 5 and five at 4 of 5, ask wins', K.startWayFor(two2, 'learning', k) === 'ask');

    // confirmed and fading
    const sf = sw('five', 'learning', [0, 1, 2, 3]);
    check('a way not yet answered is not the way for that kind of work', K.startWayFor(sf, 'learning', k) === null);
    sf.patterns.answers['start-way:learning:five'] = { said: 'no', on: before(1), examples: 5, title: swp.title };
    check('…nor when the answer is "Not really"', K.startWayFor(sf, 'learning', k) === null);
    sf.patterns.answers['start-way:learning:five'] = { said: 'yes', on: before(1), examples: 5, title: swp.title };
    check('once confirmed, it is the way for that kind of work (and not for another)', K.startWayFor(sf, 'learning', k) === 'five' && K.startWayFor(sf, 'admin', k) === null);
    const old = sw('five', 'learning', [0, 1, 2, 3], [70, 69, 68, 67, 66]);
    old.patterns.answers['start-way:learning:five'] = sf.patterns.answers['start-way:learning:five'];
    check('…and null again once the evidence fades (the five uses are older than 8 weeks)', K.startWayFor(old, 'learning', k) === null);

    // startingEasier
    const easy = (n, over = []) => { const x = fresh(); for (let i = 1; i <= n; i++) { const id = K.addTask(x.tasks, { title: 'Done ' + i, category: 'admin' }); Object.assign(x.tasks.items.find(y => y.id === id), { done: true, doneOn: before(i), due: before(i), postponed: 0 }); } over.forEach(f => f(x)); return x; };
    check('the last 5 done admin tasks all done without a move: starting is easier for admin (and not for another kind)', K.startingEasier(easy(5), 'admin') === true && K.startingEasier(easy(5), 'learning') === false);
    check('…with only 4 done tasks it is not', K.startingEasier(easy(4), 'admin') === false);
    check('…one of the last 5 moved once: not', K.startingEasier(easy(5, [x => { x.tasks.items[4].postponed = 1; }]), 'admin') === false);
    check('…a move on an older, sixth task does not count', K.startingEasier(easy(6, [x => { x.tasks.items[5].postponed = 3; }]), 'admin') === true);
    check('…one of the last 5 done after its date: not', K.startingEasier(easy(5, [x => { x.tasks.items[2].due = before(4); }]), 'admin') === false);
    check('…one of the last 5 with no date is not one of the 5 (the sixth takes its place)', K.startingEasier(easy(5, [x => { x.tasks.items[2].due = null; }]), 'admin') === false && K.startingEasier(easy(6, [x => { x.tasks.items[2].due = null; }]), 'admin') === true);
    check('…one of the last 5 with an answer about what was in the way: not', K.startingEasier(easy(5, [x => { x.tasks.items[1].blockers.push({ reason: 'start', on: before(3) }); }]), 'admin') === false);
    check('…one of the last 5 that you used Help me start on, or one of its 10-minute pieces: not', K.startingEasier(easy(5, [x => { x.patterns.startSeen = [{ on: before(9), way: 'step', category: 'admin', taskId: x.tasks.items[0].id }]; }]), 'admin') === false
      && K.startingEasier(easy(5, [x => { x.patterns.startSeen = [{ on: before(9), way: 'smaller', category: 'admin', taskId: 'tkElse', pieceId: x.tasks.items[3].id }]; }]), 'admin') === false);
    check('…a task let go does not count as done', K.startingEasier(easy(5, [x => { x.tasks.items[0].letGoOn = before(0); }]), 'admin') === false);

    // start offers step back
    const so2 = easy(5); so2.tasks.items.forEach(t => { t.doneOn = before(40); });
    const stuckAdmin = K.addTask(so2.tasks, { title: 'Stuck admin', category: 'admin' }), stuckLearn = K.addTask(so2.tasks, { title: 'Stuck learning', category: 'learning' });
    for (const id2 of [stuckAdmin, stuckLearn]) so2.tasks.items.find(y => y.id === id2).postponed = 3;
    check('a stuck task of a kind where starting is easier is not offered, but a stuck task of another kind is', K.startOfferTask(so2, k)?.title === 'Stuck learning', K.startOfferTask(so2, k));
    so2.tasks.items.find(y => y.id === stuckLearn).postponed = 0;
    check('…and with nothing stuck of another kind there is no offer', K.startOfferTask(so2, k) === null);

    // Ask
    const ak = sw('five', 'learning', [0, 1, 2, 3]);
    ak.patterns.answers['start-way:learning:five'] = { said: 'yes', on: before(1), examples: 5, title: swp.title };
    check('with Ask allowed to use how you work, a confirmed way of starting is one of the lines it gets', (ak.patterns.prefs.askUse = true) && K.howYouWork(ak, k).includes('Five-minute starts work for you on learning tasks'), K.howYouWork(ak, k));
    delete ak.patterns.prefs.askUse;
    check('…and with that off it gets nothing', K.howYouWork(ak, k).length === 0, K.howYouWork(ak, k));
  }

  console.log('\n[11] What usually gets in the way');
  d = fresh();
  for (const [i, r] of [[1, 'start'], [2, 'start'], [3, 'big'], [4, 'start']]) {
    const t = K.addTask(d.tasks, { title: 'Task ' + i });
    d.tasks.items.find(x => x.id === t).blockers.push({ reason: r, on: before(i) });
  }
  p = find(d, 'blocker');
  check('"I don\'t know where to start" 3 of 4 times → a pattern, with what MyDay does about it', p && p.title === 'What usually gets in the way: “I don\'t know where to start”' && p.why === 'You chose that 3 of the 4 times you said what was in the way of a task.' && /first step/.test(p.tip), p);

  console.log('\n[11b] What usually gets in the way: Help me start\'s answers');
  d = fresh();
  for (let i = 1; i <= 3; i++) {
    const t = K.addTask(d.tasks, { title: 'Perfect ' + i });
    K.noteBlocker(d, t, 'other', before(i), 'perfect');
  }
  p = find(d, 'blocker');
  check('"I want it perfect" 3 times → a pattern with its own tip', p && p.title === 'What usually gets in the way: “I want it perfect”' && p.why === 'You chose that 3 of the 3 times you said what was in the way of a task.' && /rough first try still counts as started/.test(p.tip), p);
  d = fresh();
  for (let i = 1; i <= 3; i++) K.noteBlocker(d, K.addTask(d.tasks, { title: 'Newer ' + i }), 'other', before(i), 'later-kind');
  check('an answer with an unknown kind counts as "Something else", which isn\'t counted → no pattern', !find(d, 'blocker'));

  // ---------- Today's learning follows Study (specs/today-learning-and-tidy.md §2) ----------
  // The four items MyDay used to seed, as the user's own (other ids, so they're kept), and a Study step to pick.
  const ownList = () => K.OLD_LEARNING_STARTERS.map((x, i) => ({ ...x, id: 'lt' + (i + 1) }));
  const arabicPick = { subject: 'arabic', title: 'Arabic Fuṣḥā — your next lesson', minutes: 25 };
  const withLists = () => { const x = fresh(); x.lists.learning = ownList(); x.lists.admin = [{ id: 'a1', title: 'Laundry', minutes: 15 }]; x.lists.health = [{ id: 'h1', title: 'Walk', minutes: 30 }]; return x; };
  const studyEntry = (subject, extra = {}, title = 'Study step') => K.makeTask({ id: K.studyTaskId({ subject, ...extra }), title, minutes: 20 }, 'learning', null);
  const onDay = (x, date, tasks) => { x.days[date] = { energy: 3, rest: false, builtAt: date + 'T08:00', checkedIn: false, tasks }; return x.days[date]; };

  console.log('\n[11] Today\'s learning task is Study\'s next step; your own list only when Study has nothing next');
  {
    const x = withLists(), learn = ts => ts.find(t => t.category === 'learning');
    const L = learn(K.chooseTasks(x, k, 5, arabicPick));
    check('with a Study step, the learning task has its title and minutes, and is marked as Study\'s by its task id (study:arabic)', L.title === 'Arabic Fuṣḥā — your next lesson' && L.minutes === 25 && L.baseMinutes === 25 && L.taskId === 'study:arabic' && eq(K.planStudy(L), { subject: 'arabic' }), L);
    check('…and a Study step for a course carries the course too', (() => { const r = learn(K.chooseTasks(x, k, 5, { subject: 'roadmap', courseId: 'c9', title: 'My course — your next step', minutes: 30 })); return r.taskId === 'study:roadmap:c9' && eq(K.planStudy(r), { subject: 'roadmap', courseId: 'c9' }); })());
    const noPick = learn(K.chooseTasks(x, k, 5));
    check('without a Study step (Study has nothing next) the first list item is used, with no Study mark', noPick.taskId === 'lt1' && noPick.title === K.OLD_LEARNING_STARTERS[0].title && !K.planStudy(noPick), noPick);
    x.queue.push({ qid: 'q1', taskId: 'lt2', category: 'learning', title: K.OLD_LEARNING_STARTERS[1].title, minutes: 20, queuedOn: before(1), sourceUid: null });
    const queued = learn(K.chooseTasks(x, k, 5, arabicPick));
    check('a learning task carried over from yesterday still comes first, ahead of the Study step', queued.taskId === 'lt2' && !K.planStudy(queued), queued);
    check('…and with it taken, there is no second learning task from Study', K.chooseTasks(x, k, 5, arabicPick).filter(t => t.category === 'learning').length === 1);
    check('a plan built with a Study step has it as the first of its three tasks', K.chooseTasks(withLists(), k, 5, arabicPick).map(t => t.category).join() === 'learning,admin,health');
  }

  console.log('\n[11b] Low energy: the Study step competes by minutes; a shrink day gives it 15');
  {
    const x = withLists();
    const short = K.chooseTasks(x, k, 1, { ...arabicPick, minutes: 10 }), long = K.chooseTasks(x, k, 2, { ...arabicPick, minutes: 20 });
    check('energy 1 with a 10-minute Study step against 15 and 30 minute tasks: the Study step is the one task', short.length === 1 && !!K.planStudy(short[0]) && short[0].minutes === 10, short);
    check('energy 2 with a 20-minute Study step against a 15-minute task: the shorter task wins and there is no Study entry', long.length === 1 && long[0].title === 'Laundry' && !K.planStudy(long[0]), long);
    x.nudge.shrinkOn = k;
    const shrunk = K.chooseTasks(x, k, 1, { ...arabicPick, minutes: 40 });
    check('on a shrink day the Study step is the one task, at 15 minutes (shortened from its own length)', shrunk.length === 1 && !!K.planStudy(shrunk[0]) && shrunk[0].minutes === 15 && shrunk[0].baseMinutes === 40 && shrunk[0].shrunk, shrunk);
  }

  console.log('\n[11c] Adding and swapping in learning never makes a second Study entry');
  {
    const x = withLists(), have = studyEntry('arabic');
    const more = K.chooseAdditional(x, k, [have], 3, arabicPick);
    check('with a Study entry already on the plan, extra tasks are admin and health, not another Study entry', more.map(t => t.category).join() === 'admin,health' && !more.some(t => K.planStudy(t)), more.map(t => [t.category, t.title]));
    const adminOnly = K.makeTask({ id: 'a1', title: 'Laundry', minutes: 15 }, 'admin', null);
    const add = K.chooseAdditional(x, k, [adminOnly], 1, arabicPick);
    check('with no learning on the plan, the extra learning task is the Study step', add.length === 1 && K.planStudy(add[0])?.subject === 'arabic' && add[0].taskId === 'study:arabic', add);
    const day = onDay(x, k, [adminOnly]);
    const swap = K.learningForToday(x, k, day, arabicPick);
    check('swapping learning in gives the Study step when nothing is queued', K.planStudy(swap)?.subject === 'arabic' && swap.title === arabicPick.title, swap);
    x.queue.push({ qid: 'q1', taskId: 'lt3', category: 'learning', title: K.OLD_LEARNING_STARTERS[2].title, minutes: 30, queuedOn: before(1), sourceUid: null });
    const fromQueue = K.learningForToday(x, k, day, arabicPick);
    check('…a queued learning item comes first, and leaves the queue', fromQueue.taskId === 'lt3' && !K.planStudy(fromQueue) && x.queue.length === 0, fromQueue);
    const second = K.learningForToday(x, k, onDay(withLists(), k, [have]), arabicPick);
    check('…and with a Study entry already there, no second Study entry is given', !(second && K.planStudy(second)), second);
  }

  console.log('\n[11d] A Study entry never waits in the queue');
  {
    const x = withLists(), e = studyEntry('cybersecurity');
    K.queueTask(x, e, k);
    check('queueing a Study entry does nothing', x.queue.length === 0, x.queue);
    K.queueTask(x, K.makeTask({ id: 'lt1', title: 'Pre-Security', minutes: 30 }, 'learning', null), k);
    check('…while an ordinary learning task is queued as before', x.queue.length === 1 && x.queue[0].taskId === 'lt1');
    const b = withLists(), p = K.proposeBuild(b, today, 5, arabicPick);
    p.items.find(i => K.planStudy(i.task)).status = 'later';
    const r = K.applyProposal(b, p);
    check('a build whose Study item is set to "later" leaves it off the plan and out of the queue', r.changed && !b.days[today].tasks.some(t => K.planStudy(t)) && b.queue.length === 0 && b.days[today].tasks.length === 2, [b.queue, b.days[today].tasks.map(t => t.title)]);
    const c = withLists(), built = K.proposeBuild(c, today, 5, arabicPick); K.applyProposal(c, built);
    check('setup: the applied plan has its Study entry', c.days[today].tasks.some(t => K.planStudy(t)));
    const rv = K.proposeReview(c, today, arabicPick);
    rv.items.find(i => K.planStudy(i.task) && !i.isNew).status = 'later';
    K.applyProposal(c, rv);
    check('a review "later" on an existing Study entry removes it from the plan and does not queue it', !c.days[today].tasks.some(t => K.planStudy(t)) && c.queue.length === 0, [c.queue, c.days[today].tasks.map(t => t.title)]);
    const d3 = withLists(), entry = studyEntry('arabic'); onDay(d3, k, [entry]);
    K.toggleRoll(d3, k, entry);
    check('"Roll to tomorrow" on a Study entry does nothing', d3.queue.length === 0 && entry.rolledQid === null, [d3.queue, entry.rolledQid]);
    const plain = K.makeTask({ id: 'lt1', title: 'Pre-Security', minutes: 30 }, 'learning', null); onDay(d3, k, [plain]);
    K.toggleRoll(d3, k, plain);
    check('…while an ordinary task still rolls', d3.queue.length === 1 && plain.rolledQid === d3.queue[0].qid);
  }

  console.log('\n[11e] The list rotation ignores Study entries');
  {
    const x = withLists();
    onDay(x, before(2), [Object.assign(K.makeTask({ id: 'lt2', title: K.OLD_LEARNING_STARTERS[1].title, minutes: 20 }, 'learning', null), { done: true })]);
    onDay(x, before(1), [Object.assign(studyEntry('arabic'), { done: true })]);
    const next = K.chooseTasks(x, k, 3).find(t => t.category === 'learning');
    check('after a day whose only done learning entry is a Study one, the list continues from the last done list item (lt2, so lt3)', next.taskId === 'lt3', next);
    const y = withLists();
    onDay(y, before(1), [Object.assign(studyEntry('arabic'), { done: true })]);
    check('…and with no list item ever done it starts at the first', K.chooseTasks(y, k, 3).find(t => t.category === 'learning').taskId === 'lt1');
  }

  console.log('\n[11f] Your own Learning list (when Study has nothing next) still moves on, repeats and cycles');
  {
    const x = withLists(), titles = K.OLD_LEARNING_STARTERS.map(o => o.title);
    // Build each day's plan without a Study step, tick (or not) its learning task, and say which list item it was.
    const play = (n, tick) => {
      const date = before(n), ts = K.chooseTasks(x, date, 3), L = ts.find(t => t.category === 'learning');
      onDay(x, date, ts); L.done = tick; return L.taskId;
    };
    const seq = [play(9, true), play(8, false), play(7, true), play(6, true), play(5, true), play(4, true), play(3, false)];
    check('learning moves to the next session after one was done, repeats because it was not completed, then goes on', eq(seq, ['lt1', 'lt2', 'lt2', 'lt3', 'lt4', 'lt1', 'lt2']), seq);
    check('learning order is the list\'s own, then cycles back to the first', eq(seq.slice(2, 6), ['lt2', 'lt3', 'lt4', 'lt1']) && x.days[before(3)].tasks.find(t => t.category === 'learning').title === titles[1]);
    const c = K.sessionCounts(x);
    check('session counts are tracked per list item (2, 1, 1, 1)', eq(['lt1', 'lt2', 'lt3', 'lt4'].map(i => c[i] || 0), [2, 1, 1, 1]), c);
  }

  console.log('\n[12] Ticking a Study entry when you study, and the name it keeps');
  {
    check('a ticked Arabic entry is named "Arabic Fuṣḥā: <lesson>"', K.studiedTitle('arabic', 'X') === 'Arabic Fuṣḥā: X', K.studiedTitle('arabic', 'X'));
    check('a ticked Cybersecurity entry is named "Cybersecurity: <lesson>"', K.studiedTitle('cybersecurity', 'X') === 'Cybersecurity: X', K.studiedTitle('cybersecurity', 'X'));
    const x = withLists();
    const doneAr = Object.assign(studyEntry('arabic', {}, 'Already done'), { done: true }), ar = studyEntry('arabic', {}, 'Arabic first'), ar2 = studyEntry('arabic', {}, 'Arabic second'), cy = studyEntry('cybersecurity');
    const plain = K.makeTask({ id: 'lt1', title: 'Pre-Security', minutes: 30 }, 'learning', null);
    const yest = studyEntry('arabic', {}, 'Yesterday'); onDay(x, before(1), [yest]);
    onDay(x, k, [doneAr, ar, ar2, cy, plain]);
    check('studying Arabic ticks today\'s first undone Arabic entry, with the lesson\'s name (trimmed), still marked as Study\'s', K.tickStudyOnPlan(x, k, 'arabic', { title: '  Arabic Fuṣḥā: The register  ' }) && ar.done && ar.title === 'Arabic Fuṣḥā: The register' && ar.taskId === 'study:arabic', ar);
    check('…leaving the done entry, the second Arabic entry, other subjects, plain learning tasks and other days alone', doneAr.title === 'Already done' && !ar2.done && !cy.done && !plain.done && !yest.done);
    check('a long lesson name is cut to 200 characters', K.tickStudyOnPlan(x, k, 'arabic', { title: 'y'.repeat(250) }) && ar2.done && ar2.title.length === 200, ar2.title.length);
    check('with no undone Arabic entry left today it returns false and changes nothing (yesterday\'s stays undone)', K.tickStudyOnPlan(x, k, 'arabic', { title: 'More' }) === false && !yest.done);
    check('Cybersecurity is ticked on its own, without a name when none is given', K.tickStudyOnPlan(x, k, 'cybersecurity') && cy.done && cy.title === 'Study step');
    check('a day with no plan has nothing to tick', K.tickStudyOnPlan(x, K.shift(k, 5), 'arabic') === false);
    const y = withLists(), r1 = studyEntry('roadmap', { courseId: 'c1' }), r2 = studyEntry('roadmap', { courseId: 'c2' });
    onDay(y, k, [r1, r2]);
    check('for a course, only its own entry is ticked', K.tickStudyOnPlan(y, k, 'roadmap', { courseId: 'c2' }) && r2.done && !r1.done);
    check('…a course with no entry ticks nothing', K.tickStudyOnPlan(y, k, 'roadmap', { courseId: 'c3' }) === false && !r1.done);
    check('…and with no course given, any undone course entry is ticked', K.tickStudyOnPlan(y, k, 'roadmap') && r1.done);
    const z = withLists(), id = K.addTask(z.tasks, { title: 'Read the chapter', category: 'learning' }), item = z.tasks.items.find(t => t.id === id);
    const linked = studyEntry('roadmap', { courseId: 'c1' }); onDay(z, k, [linked]);
    item.plannedOn = k; item.planUid = linked.uid;
    check('a task copied to the plan is ticked with its entry, dated that day, as ticking it by hand does', K.tickStudyOnPlan(z, k, 'roadmap', { courseId: 'c1' }) && linked.done && item.done && item.doneOn === k, item);
  }

  console.log('\n[13] Saved: a Study entry is marked by its task id, and the four old starters are kept');
  {
    const norm = mut => { const x = fresh(); mut(x); return K.normalize(JSON.parse(JSON.stringify(x))); };
    const mark = (taskId, category = 'learning') => K.planStudy({ taskId, category });
    check('"study:arabic" and "study:cybersecurity" on a learning entry are Study\'s, by subject', eq(mark('study:arabic'), { subject: 'arabic' }) && eq(mark('study:cybersecurity'), { subject: 'cybersecurity' }));
    check('"study:roadmap:<course>" carries the course (a course id may hold a colon), and a bare roadmap has none', eq(mark('study:roadmap:c1'), { subject: 'roadmap', courseId: 'c1' }) && eq(mark('study:roadmap:cyber:1:x'), { subject: 'roadmap', courseId: 'cyber:1:x' }) && eq(mark('study:roadmap:'), { subject: 'roadmap' }));
    check('an unknown subject, a task that is not learning, a list item id and no id are not Study\'s', mark('study:french') === null && mark('study:arabic', 'admin') === null && mark('lt1') === null && mark(null) === null && mark('study') === null);
    check('studyTaskId makes the id back (round trip for all three subjects)', K.studyTaskId({ subject: 'arabic' }) === 'study:arabic' && K.studyTaskId({ subject: 'cybersecurity' }) === 'study:cybersecurity' && K.studyTaskId({ subject: 'roadmap', courseId: 'c1' }) === 'study:roadmap:c1' && eq(mark(K.studyTaskId({ subject: 'roadmap', courseId: 'c1' })), { subject: 'roadmap', courseId: 'c1' }));
    const entry = studyEntry('arabic', {}, 'Arabic Fuṣḥā — your next lesson');
    const read = norm(x => { x.days[k] = { energy: 3, rest: false, builtAt: k + 'T08:00', checkedIn: false, tasks: [entry] }; }).days[k].tasks[0];
    check('a Study entry survives reading saved data unchanged (nothing new is saved on it)', eq(read, entry) && !('study' in read), read);
    const carried = { qid: 'q9', taskId: 'study:arabic', category: 'learning', title: 'Arabic Fuṣḥā — your next lesson', minutes: 25, queuedOn: before(1), sourceUid: null };
    const kept = norm(x => { x.queue = [carried]; }).queue[0], back = K.taskFromQueue(kept);
    check('a queued item with a Study task id (as an older version carries it over) comes back onto the plan as a Study entry', eq(kept, carried) && !!K.planStudy(back) && back.taskId === 'study:arabic' && back.category === 'learning', back);

    const old = K.OLD_LEARNING_STARTERS, qOf = (x, taskId, title = x.title) => ({ qid: 'q' + taskId, taskId, category: 'learning', title, minutes: x.minutes, queuedOn: k, sourceUid: null });
    const starters = norm(x => { x.lists.learning = [...old.map(o => ({ ...o })), { id: 'mine', title: 'My own', minutes: 20 }]; x.queue = old.map(o => qOf(o, o.id)); });
    check('the four old starters are kept exactly on reading (nothing is removed on load), with their queued copies', eq(starters.lists.learning.map(i => i.id), ['l1', 'l2', 'l3', 'l4', 'mine']) && eq(starters.queue.map(q => q.taskId), ['l1', 'l2', 'l3', 'l4']), [starters.lists.learning, starters.queue]);
    check('a new MyDay starts with an empty Learning list, and the seed has none', eq(K.freshState().lists.learning, []) && eq(K.SEED.learning, []) && eq(K.normalize({ schemaVersion: 5 }).lists.learning, []));
    check('the other two lists are still seeded', K.freshState().lists.admin.length === 4 && K.freshState().lists.health.length > 0);
    check('the starters are exactly the four old ones (ids l1 to l4)', eq(old.map(o => o.id), ['l1', 'l2', 'l3', 'l4']));

    console.log('\n[13b] Tidy up offers the starters: exactly as MyDay added them, not linked to a course, removed and restored in place');
    const sd = fresh(); sd.lists.learning = [{ id: 'mine', title: 'My own', minutes: 20 }, ...old.map(o => ({ ...o }))]; sd.lists.learning.splice(3, 0, { id: 'mine2', title: 'Another', minutes: 10 });
    check('all four exact starters are offered', eq(K.oldStarters(sd).map(i => i.id), ['l1', 'l2', 'l3', 'l4']), K.oldStarters(sd).map(i => i.id));
    const odd = fresh(); odd.lists.learning = [{ ...old[0], title: old[0].title + ' (mine)' }, { ...old[1], minutes: 25 }, { ...old[2] }, { id: 'lt4', title: old[3].title, minutes: old[3].minutes }];
    check('one with a changed title or minutes, or under another id, is not a starter', eq(K.oldStarters(odd).map(i => i.id), ['l3']), K.oldStarters(odd).map(i => i.id));
    const lk = fresh(); lk.lists.learning = old.map(o => ({ ...o })); lk.study.stages = [{ id: 's1', title: 'Stage', courses: [{ id: 'c1', title: 'Pre-Security', url: '', minutes: 30, listId: 'l2', archived: false, modules: [] }] }];
    check('one that a Study course is linked to is not offered', eq(K.oldStarters(lk).map(i => i.id), ['l1', 'l3', 'l4']));
    const before3 = JSON.stringify(sd.lists.learning), removed = K.removeOldStarters(sd);
    check('removing them takes only the starters, returns each with where it was, and leaves your own items and the queue', eq(sd.lists.learning.map(i => i.id), ['mine', 'mine2']) && eq(removed.map(r => [r.item.id, r.at]), [['l1', 1], ['l2', 2], ['l3', 4], ['l4', 5]]), [sd.lists.learning, removed.map(r => [r.item.id, r.at])]);
    check('Undo puts them back in their places', K.restoreOldStarters(sd, removed) && JSON.stringify(sd.lists.learning) === before3, sd.lists.learning.map(i => i.id));
    K.removeOldStarters(sd); sd.lists.learning.push({ id: 'l2', title: 'Added again', minutes: 5 });
    check('Undo skips an item whose id is there again, restoring the rest', K.restoreOldStarters(sd, removed) && sd.lists.learning.filter(i => i.id === 'l2').length === 1 && sd.lists.learning.find(i => i.id === 'l2').title === 'Added again' && sd.lists.learning.some(i => i.id === 'l1'), sd.lists.learning.map(i => i.id));
    check('nothing to restore changes nothing', K.restoreOldStarters(sd, []) === false);
  }

  console.log('\n[14] Tidy up: what looks old or unrelated, and why');
  {
    const day0 = k; // a Thursday
    const mk = (x, title, extra = {}) => { const id = K.addTask(x.tasks, { title, due: extra.due ?? null }); Object.assign(x.tasks.items.find(t => t.id === id), extra); return id; };
    const cand = (x, kept) => K.tidyCandidates(x, day0, kept);
    const one = (x, id) => cand(x).find(i => i.id === id);
    const proj = (id, status = 'active') => ({ id, title: 'Garden fence', status });
    const base = () => { const x = fresh(); x.software = { items: [] }; x.career = { items: [] }; return x; };
    const bug = (state, taskId) => ({ id: 'bg1', projectId: 'p1', type: 'bug', title: 'Bug', state, taskId, createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00' });
    const app = (stage, extra = {}) => ({ id: 'ap1', projectId: 'p1', type: 'application', company: 'Acme', stage, createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00', ...extra });

    let x = base(); let t = mk(x, 'Fix: the login bug'); x.software.items.push(bug('fixed', t));
    check('a Fix task whose bug is fixed is "gone": Its bug is fixed', eq([one(x, t)?.group, one(x, t)?.why], ['gone', 'Its bug is fixed']), one(x, t));
    x.software.items[0].state = 'wontfix';
    check('…marked won’t fix: "Its bug is marked won’t fix"', one(x, t)?.why === 'Its bug is marked won’t fix' && one(x, t).group === 'gone', one(x, t));
    x.software.items[0].state = 'open';
    check('…still open: not offered', !one(x, t));
    x.software.items = [];
    const oldFix = mk(x, 'Fix: a removed bug', { due: K.shift(day0, -20) });
    check('a Fix task whose bug was removed is never "gone": only the age rule applies', one(x, oldFix)?.group === 'old', one(x, oldFix));
    const fresh2 = mk(x, 'Fix: another removed bug');
    check('…and with no old date nothing is offered', !one(x, fresh2));

    x = base(); t = mk(x, 'Follow up with Acme'); x.career.items.push(app('applied', { followTaskId: t }));
    check('a Follow up task whose application is still Applied is not gone', !one(x, t));
    x.career.items[0].stage = 'interested';
    check('a Follow up task whose application is only Interested is not gone', !one(x, t));
    for (const [stage, why] of [['interviewing', 'The application has moved on'], ['offer', 'The application has moved on'], ['closed', 'The application is closed']]) {
      x.career.items[0].stage = stage;
      check(`…at "${stage}": ${why}`, eq([one(x, t)?.group, one(x, t)?.why], ['gone', why]), one(x, t));
    }

    x = base(); t = mk(x, 'Prepare for the Acme interview');
    x.career.items.push(app('interviewing', { interviews: [{ id: 'iv1', on: K.shift(day0, -3), taskId: t }] }));
    check('a Prepare task whose interview day was before today says when it was', eq([one(x, t)?.group, one(x, t)?.why], ['gone', 'The interview was on ' + K.shortDate(K.shift(day0, -3))]), one(x, t));
    x.career.items[0].interviews[0].on = K.shift(day0, 4);
    check('…with an upcoming interview it is not gone', !one(x, t));
    x.career.items[0].stage = 'closed';
    check('…and with the application closed: "The application is closed"', one(x, t)?.why === 'The application is closed' && one(x, t).group === 'gone', one(x, t));
    x.career.items[0].stage = 'interviewing'; x.career.items[0].interviews[0].on = day0;
    check('…an interview today has not gone yet', !one(x, t));

    x = base(); x.projects.items.push(proj('p1'));
    const chased = mk(x, 'Send the form', { projectId: 'p1' }), chase = mk(x, 'Chase: Send the form', { projectId: 'p1' });
    check('"Chase: <task>" in the same project, with that task no longer waiting and nothing pointing at the chase: Its wait has ended', eq([one(x, chase)?.group, one(x, chase)?.why], ['gone', 'Its wait has ended']), one(x, chase));
    const T5 = id => x.tasks.items.find(i => i.id === id);
    T5(chased).waiting = { on: 'Sam', since: day0, until: null };
    check('…while that task is still waiting it is not gone', !one(x, chase));
    T5(chased).waiting = { on: 'Sam', since: day0, until: null, chaseTaskId: chase };
    check('…and a wait that points at the chase keeps it', !one(x, chase));
    T5(chased).waiting = undefined; T5(chase).projectId = undefined;
    check('…a chase outside that task\'s project is not matched to it', !one(x, chase));
    const own = mk(x, 'Chase: invoice from Sam');
    check('a "Chase: …" you wrote yourself, naming no task or project, is not gone', !one(x, own));
    x.projects.items[0].title = 'Garden fence'; const pchase = mk(x, 'Chase: Garden fence', { projectId: 'p1' });
    check('"Chase: <project>" for a project that is no longer waiting: The project’s wait has ended', eq([one(x, pchase)?.group, one(x, pchase)?.why], ['gone', 'The project’s wait has ended']), one(x, pchase));
    x.projects.items[0].waiting = { on: 'Sam', since: day0, until: null };
    check('…while the project is waiting it is not gone', !one(x, pchase));
    x.projects.items[0].waiting = { on: 'Sam', since: day0, until: null, chaseTaskId: pchase };
    check('…and a project wait that points at it keeps it', !one(x, pchase));
    check('a task that only looks like a chase (no "Chase: " start) is left alone', !one(x, mk(x, 'Chase the plumber')));

    x = base(); x.projects.items.push(proj('p1', 'done'), proj('p2', 'active'));
    const inDone = mk(x, 'Paint the fence', { projectId: 'p1' }), inActive = mk(x, 'Buy posts', { projectId: 'p2' });
    check('a task of a finished project: group "finished", "<project> is finished"', eq([one(x, inDone)?.group, one(x, inDone)?.why], ['finished', 'Garden fence is finished']), one(x, inDone));
    check('…a task of an active project with no old date is not offered', !one(x, inActive));

    x = base(); x.projects.items.push(proj('p1'), proj('p2', 'done'));
    const old15 = mk(x, 'Old, no project', { due: K.shift(day0, -15) }), old14 = mk(x, 'Exactly 14 days', { due: K.shift(day0, -14) }), oldIn = mk(x, 'Old in a project', { due: K.shift(day0, -15), projectId: 'p1' }), oldDoneProj = mk(x, 'Old in a finished project', { due: K.shift(day0, -40), projectId: 'p2' });
    check('due more than 14 days ago with no project: group "old", "From <date>"', eq([one(x, old15)?.group, one(x, old15)?.why], ['old', 'From ' + K.shortDate(K.shift(day0, -15))]), one(x, old15));
    check('…exactly 14 days ago is not old', !one(x, old14));
    check('…in a project that is not finished: "old-in-project"', one(x, oldIn)?.group === 'old-in-project', one(x, oldIn));
    x.projects.items.push(proj('p3', 'paused')); const oldPaused = mk(x, 'Old in a paused project', { due: K.shift(day0, -15), projectId: 'p3' });
    check('…a paused project counts as not finished too', one(x, oldPaused)?.group === 'old-in-project', one(x, oldPaused));
    check('…in a finished project the finished-project reason comes first', one(x, oldDoneProj)?.group === 'finished', one(x, oldDoneProj));

    x = base();
    const ex = ['done', 'letgo', 'plan', 'queue', 'kept'].map(n => [n, mk(x, 'Excluded ' + n, { due: K.shift(day0, -30) })]), exId = Object.fromEntries(ex), item = id => x.tasks.items.find(i => i.id === id);
    item(exId.done).done = true; item(exId.letgo).letGoOn = K.shift(day0, -1);
    const planned = K.makeTask({ id: null, title: 'Excluded plan', minutes: 15 }, 'admin', null); onDay(x, day0, [planned]); item(exId.plan).plannedOn = day0; item(exId.plan).planUid = planned.uid;
    const rolled = K.makeTask({ id: null, title: 'Excluded queue', minutes: 15 }, 'admin', null); rolled.rolledQid = 'qq'; onDay(x, K.shift(day0, -1), [rolled]);
    item(exId.queue).plannedOn = K.shift(day0, -1); item(exId.queue).planUid = rolled.uid; x.queue.push({ qid: 'qq', taskId: null, category: 'admin', title: 'Excluded queue', minutes: 15, queuedOn: day0, sourceUid: rolled.uid });
    const shown = cand(x, new Set([exId.kept])).map(i => i.id);
    check('done, let go, on today\'s plan, in the queue and kept tasks are not offered, though old', shown.length === 0, shown);
    check('…without the "kept" set the kept one is offered again', cand(x).map(i => i.id).join() === exId.kept);

    const bare = fresh(); delete bare.software; delete bare.career;
    const oldOne = mk(bare, 'Old with nothing else', { due: K.shift(day0, -20) });
    let threw = null, got = null; try { got = K.tidyCandidates(bare, day0); } catch (e) { threw = e; }
    check('a MyDay with no Software or Career sections does not throw, and still offers old tasks', !threw && got.length === 1 && got[0].id === oldOne, String(threw));

    x = base(); const a1 = mk(x, 'One'), a2 = mk(x, 'Two'), a3 = mk(x, 'Three'), a4 = mk(x, 'Four');
    x.tasks.items.find(i => i.id === a2).done = true; x.tasks.items.find(i => i.id === a3).letGoOn = K.shift(day0, -2);
    const gone = K.letGoOf(x, [a1, a2, a3, 'nope'], day0);
    const T4 = id => x.tasks.items.find(i => i.id === id);
    check('letting go marks only unfinished, not-let-go tasks with today, and returns just those', eq(gone, [a1]) && T4(a1).letGoOn === day0 && !T4(a2).letGoOn && T4(a3).letGoOn === K.shift(day0, -2) && !T4(a4).letGoOn, [gone, T4(a2).letGoOn, T4(a3).letGoOn]);
    T4(a4).letGoOn = K.shift(day0, -1);
    check('undo clears only those let go today', K.undoLetGo(x, [a1, a3, a4], day0) && T4(a1).letGoOn === null && T4(a3).letGoOn === K.shift(day0, -2) && T4(a4).letGoOn === K.shift(day0, -1));
    check('…and says nothing changed when nothing was let go today', K.undoLetGo(x, [a3, a4], day0) === false);
  }

  fs.rmSync(dir, { recursive: true, force: true });
  const s = summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
