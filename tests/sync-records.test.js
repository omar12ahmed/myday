// The records that sync (app/src/sync/records.ts), on the app's own code bundled for Node, with made-up data in every
// part of MyDay: every record survives the trip unchanged (this device → the account → another device), every
// record can be put back where it came from, items are added, replaced and removed one at a time, links between
// records are kept (a favourite's recipe, a check-in's concepts, the session in progress), lists and note
// collections taken from the account keep your filing (by name), and what stays on each device never syncs.
// No browser, no network.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = o => JSON.parse(JSON.stringify(o));

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const dir = path.join(os.tmpdir(), `myday-sync-records-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  const src = p => JSON.stringify(path.join(ROOT, 'app/src', p));
  fs.writeFileSync(path.join(dir, 'kit.ts'), [`export * from ${src('sync/records')};`, `export { freshState, normalize } from ${src('data/normalize')};`].join('\n'));
  const R = await import(pathToFileURL(await bundle(path.join(dir, 'kit.ts'), path.join(dir, 'out'))).href);

  // Made-up data in every part of MyDay, read the way MyDay reads saved data when it opens.
  const raw = clone(R.freshState());
  Object.assign(raw.settings, { earliestTime: '07:30', theme: 'light' });
  raw.commitments = [{ id: 'cmB', kind: 'work', title: 'Shift', start: '2026-10-07T07:00', end: '2026-10-07T19:00' }, { id: 'cmA', kind: 'appointment', title: 'GP', start: '2026-10-06T10:00', end: '2026-10-06T10:30' }];
  raw.rota = { patterns: [{ id: 'p1', effectiveFrom: null, anchor: '2026-10-01', cycle: ['day', 'day', 'off', 'off'] }], overrides: { '2026-10-03': { actual: { status: 'sick' } } }, entries: [], colours: {} };
  raw.pay.hourlyRate = 13.85;
  raw.bankHolidays = { region: 'scotland', fetchedAt: '2026-10-01T09:00', divisions: null };
  raw.finance = { ratesSetOn: '2026-10-01', debts: [{ id: 'd1', direction: 'owed', person: 'Sam', amount: 20, note: '', since: '2026-09-30', settledOn: null }], expenses: [{ id: 'e1', name: 'Rent', amount: 650, note: '' }] };
  raw.study.topics = [{ id: 'tpC', title: 'Cybersecurity' }, { id: 'tpA', title: 'Arabic' }];
  raw.study.stages = [{ id: 'sg1', title: 'Foundations', topicId: 'tpC', courses: [{ id: 'co1', title: 'THM', url: '', minutes: 30, listId: null, archived: false, modules: [{ id: 'm1', title: 'M', sections: [{ id: 's1', title: 'S', tasks: [{ id: 't1', title: 'Linux 1', minutes: 30, url: '', kind: 'learn', note: '', done: true, doneOn: '2026-10-02' }] }] }] }] }];
  raw.study.focusCourseId = 'co1';
  raw.study.concepts = [{ id: 'cp1', title: 'Ports', taskIds: ['t1'], createdOn: '2026-10-02', kind: 'written', prompt: 'What is a port?', answer: 'A number', explanation: '', choices: [], correct: null, hint: '', source: '', note: '', review: { reps: 1, interval: 2, lapses: 0, due: '2026-10-08' } }];
  raw.study.sessions = [
    { id: 'ss1', courseId: 'co1', taskId: 't1', title: 'THM · Linux 1', date: '2026-10-02', startedAt: '2026-10-02T19:00', plannedMin: 30, short: false, status: 'done', runningSince: null, activeMs: 1500000, endedAt: '2026-10-02T19:30', checkin: { conceptIds: ['cp1'], clarity: 'clear', takeaway: 'ok', question: '', note: '' }, taskDone: true, todayUid: null },
  ];
  raw.study.reviews = [{ id: 'rv1', conceptId: 'cp1', title: 'Ports', date: '2026-10-03', at: '2026-10-03T08:00', kind: 'written', outcome: 'right', graded: 'self', chosen: null, support: 'own', rating: 'good', gap: 2, due: '2026-10-05' }];
  raw.health.workout.templates = [{ id: 'wt1', name: 'Full body', minutes: 45, archived: false, items: [] }];
  raw.health.workout.sessions = [{ id: 'ws1', date: '2026-10-02', templateId: 'wt1', templateName: 'Full body', startedAt: '2026-10-02T07:00', finishedAt: '2026-10-02T07:45', status: 'done', plannedDate: null, editedAt: null, exercises: [] }];
  raw.health.food.recipes = { rOwn: { id: 'rOwn', source: 'manual', title: 'Lentil soup', ingredients: [{ name: 'lentils', measure: '200 g' }], instructions: 'Simmer.', servings: 4, servingsSource: 'user' } };
  raw.health.food.favourites = ['rOwn'];
  raw.health.food.want = [{ id: 'w1', recipeId: 'rOwn', servings: 2, addedOn: '2026-10-03' }];
  raw.health.food.shopping = [{ id: 'sh1', name: 'milk', category: 'Dairy', checked: false, recipes: [], manual: true }];
  raw.fitness = { units: 'metric', answers: null, setOn: null };
  raw.notes.items = [{ id: 'nt1', categoryId: raw.notes.categories[3].id, title: '', text: 'Budget for the van', pinned: false, createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00' }];
  raw.tasks.lists = [{ id: 'tl1', name: 'Moving house' }];
  raw.tasks.items = [{ id: 'tk1', title: 'Book a van', listId: 'tl1', category: 'admin', minutes: 15, due: '2026-10-10', time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-01T09:00', postponed: 1, blockers: [], letGoOn: null }];
  raw.patterns.prefs.maxTasks = { value: 2, on: '2026-10-01', from: null, why: 'You chose this.' };
  // A project (1.12.0) with a task and a note in it and an appointment listed on it.
  raw.projects = { items: [{ id: 'pj1', title: 'Coffee subscription', summary: 'For offices', stage: 'explore', status: 'active', nextTaskId: 'tk1', commitmentIds: ['c1'], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-02T09:00' }] };
  raw.tasks.items[0].projectId = 'pj1';
  raw.notes.items[0].projectId = 'pj1';
  raw.timer = { uid: 'x', dayKey: '2026-10-04', kind: 'focus', durationSec: 1500, startedAt: 1, accumulatedMs: 0, finished: false };
  const data = R.normalize(raw);

  console.log('\n[1] Every record survives the trip unchanged');
  const recs = R.localRecords(data);
  const kinds = [...new Set([...recs.keys()].map(k => R.splitKey(k).kind))].sort();
  check('every kind of record is there', eq(kinds, ['commitment', 'context', 'cybersecurity', 'day', 'finance', 'fitness', 'food', 'holidays', 'list', 'note', 'notes', 'pay', 'patterns', 'project', 'queue', 'recipe', 'review', 'rota', 'session', 'settings', 'study', 'task', 'tasks', 'workout', 'wsession'].filter(k => k !== 'context' && k !== 'day').sort()), kinds);
  const changedOnTheWay = [...recs].filter(([key, c]) => R.fingerprint(R.cleanRecord(key, clone(c))) !== R.fingerprint(c)).map(([k]) => k);
  check('checked as it arrives on another device, every record is exactly the same (so devices never drift apart)', changedOnTheWay.length === 0, changedOnTheWay);
  const putBack = clone(R.freshState());
  for (const [key, c] of recs) R.putRecord(putBack, key, clone(c));
  const again = R.localRecords(R.normalize(putBack));
  check('put into a new MyDay, every record comes back the same', [...recs].every(([k, c]) => R.fingerprint(again.get(k)) === R.fingerprint(c)), [...recs].filter(([k, c]) => R.fingerprint(again.get(k)) !== R.fingerprint(c)).map(([k]) => k));
  check('…the links between them too: the favourite and want-to-cook still point at the recipe, the check-in at its concept', eq(putBack.health.food.favourites, ['rOwn']) && putBack.health.food.want[0].recipeId === 'rOwn' && eq(putBack.study.sessions[0].checkin.conceptIds, ['cp1']));
  check('a record checked on its own keeps its links (the recipe and concept aren\'t in it)', eq(R.cleanRecord('food:kitchen', clone(recs.get('food:kitchen'))).favourites, ['rOwn']) && eq(R.cleanRecord('session:ss1', clone(recs.get('session:ss1'))).checkin.conceptIds, ['cp1']));

  console.log('\n[2] What stays on each device');
  check('the theme and animations aren\'t in the planning settings', !('theme' in recs.get('settings:planning')) && !('motion' in recs.get('settings:planning')) && recs.get('settings:planning').earliestTime === '07:30');
  check('the downloaded bank holidays aren\'t synced, only the region', eq(recs.get('holidays:region'), { region: 'scotland' }));
  check('a running focus timer, nudges and save signatures aren\'t synced', ![...recs.values()].some(c => JSON.stringify(c).includes('"durationSec":1500')) && ![...recs.keys()].some(k => /nudge|timer|saves/.test(k)));
  const other = clone(data); other.settings.theme = 'dark'; other.bankHolidays.fetchedAt = null;
  R.putRecord(other, 'settings:planning', { ...recs.get('settings:planning'), earliestTime: '06:00' });
  check('taking the account\'s planning settings keeps this device\'s theme', other.settings.theme === 'dark' && other.settings.earliestTime === '06:00');

  console.log('\n[3] Items one at a time');
  const d = clone(data);
  R.putRecord(d, 'commitment:cmC', { id: 'cmC', kind: 'appointment', title: 'Dentist', start: '2026-10-05T09:00', end: '2026-10-05T09:30' });
  check('a new appointment is added in date order', eq(d.commitments.map(c => c.id), ['cmC', 'cmA', 'cmB']));
  R.putRecord(d, 'commitment:cmA', { ...d.commitments[1], title: 'GP (moved)' });
  check('a changed one replaces it in place', d.commitments[1].title === 'GP (moved)' && d.commitments.length === 3);
  R.putRecord(d, 'commitment:cmB', null);
  check('a deleted one is removed', eq(d.commitments.map(c => c.id), ['cmC', 'cmA']));
  R.putRecord(d, 'recipe:rNew', { id: 'rNew', title: 'Dal' });
  R.putRecord(d, 'recipe:rOwn', null);
  check('recipes are added and removed by id', !!d.health.food.recipes.rNew && !d.health.food.recipes.rOwn);
  R.putRecord(d, 'project:pjNew', { ...d.projects.items[0], id: 'pjNew', title: 'Podcast' });
  R.putRecord(d, 'project:pj1', null);
  check('projects are added and removed by id (the tasks and notes that pointed at one are left as they are)', eq(d.projects.items.map(p => p.id), ['pjNew']) && d.tasks.items[0].projectId === 'pj1');
  check('a project arriving with a wrong stage is read like a saved one (Capture), not refused', R.cleanRecord('project:pjX', { id: 'pjX', title: 'X', stage: 'nowhere' }).stage === 'capture');
  check('the one-record parts can\'t be removed (a deletion is ignored)', (R.putRecord(d, 'finance:finance', null), d.finance.expenses.length === 1));
  check('an item whose id doesn\'t match the record is refused', R.cleanRecord('note:ntX', { id: 'ntOther', text: 'x', categoryId: '' }) === null && R.cleanRecord('nope:x', {}) === null);

  console.log('\n[4] The session in progress');
  const s = clone(data);
  R.putRecord(s, 'session:ss2', { ...clone(recs.get('session:ss1')), id: 'ss2', status: 'active', runningSince: 5, endedAt: null, date: '2026-10-04', startedAt: '2026-10-04T08:00' });
  check('a session in progress arriving from another device becomes the one in progress here', s.study.activeId === 'ss2' && s.study.sessions.map(x => x.id).join() === 'ss1,ss2');
  R.putRecord(s, 'session:ss2', { ...s.study.sessions[1], status: 'done', runningSince: null });
  check('…and when it\'s finished there, nothing is in progress here', s.study.activeId === null);
  R.putRecord(s, 'wsession:ws2', { ...clone(recs.get('wsession:ws1')), id: 'ws2', status: 'active', finishedAt: null, date: '2026-10-04', startedAt: '2026-10-04T07:00' });
  check('the same for a workout', s.health.workout.activeId === 'ws2');

  console.log('\n[5] Taking the account\'s lists keeps your filing');
  const f = clone(data);
  const cloudCats = f.notes.categories.map((c, i) => ({ id: 'cloud' + i, name: c.name }));
  R.putRecord(f, 'notes:collections', { categories: cloudCats });
  check('a note filed in "Money" here is filed in the account\'s "Money"', f.notes.items[0].categoryId === 'cloud3' && cloudCats[3].name === 'Money');
  R.putRecord(f, 'tasks:lists', { lists: [{ id: 'tlCloud', name: 'moving house' }] });
  check('a task in "Moving house" here is in the account\'s list of that name (any case)', f.tasks.items[0].listId === 'tlCloud');
  R.putRecord(f, 'tasks:lists', { lists: [{ id: 'tlOther', name: 'Car' }] });
  check('with no list of that name, it keeps its list id (shown with no list)', f.tasks.items[0].listId === 'tlCloud');

  console.log('\n[6] Starter versions (the account\'s is suggested)');
  const fresh = R.localRecords(R.normalize(clone(R.freshState())));
  const notStarter = [...fresh].filter(([k, c]) => !R.splitKey(k).kind.match(/^(day|context)$/) && !R.isStarter(k, c)).map(([k]) => k);
  check('everything in a new MyDay counts as a starter version', notStarter.length === 0, notStarter);
  check('your own versions don\'t', !R.isStarter('finance:finance', recs.get('finance:finance')) && !R.isStarter('study:roadmap', recs.get('study:roadmap')) && !R.isStarter('rota:rota', recs.get('rota:rota')) && !R.isStarter('tasks:lists', recs.get('tasks:lists')));
  check('starter note collections are recognised by their names (each device makes its own ids)', R.isStarter('notes:collections', { categories: fresh.get('notes:collections').categories.map((c, i) => ({ ...c, id: 'other' + i })) }));

  console.log('\n[7] Words for the review');
  check('every record has a name in words', [...recs.keys()].every(k => R.recordLabel(k) && R.recordLabel(k) !== k));
  check('…and a one-line summary', [...recs].every(([k, c]) => typeof R.recordSummary(k, c) === 'string' && R.recordSummary(k, c).length > 0), [...recs].filter(([k, c]) => !R.recordSummary(k, c)).map(([k]) => k));
  check('e.g. a note by its first line, a task with its date, Finance by what\'s in it', R.recordSummary('note:nt1', recs.get('note:nt1')) === 'Budget for the van' && /^Book a van · Sat.*\b10\b/.test(R.recordSummary('task:tk1', recs.get('task:tk1'))) /* the date in this device's format */ && R.recordSummary('finance:finance', recs.get('finance:finance')) === '1 money-owed entry · 1 expense',
    ['note:nt1', 'task:tk1', 'finance:finance'].map(k => R.recordSummary(k, recs.get(k))));

  fs.rmSync(dir, { recursive: true, force: true });
  const sm = summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
