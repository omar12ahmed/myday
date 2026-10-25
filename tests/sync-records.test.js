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

  const project = (records, id, clean = false) => {
    const target = R.freshState();
    const rows = [...records].filter(([k, c]) => R.splitKey(k).kind.startsWith('project') && c.projectId === id);
    R.putRecords(target, rows.map(([k, c]) => [k, clean ? R.cleanRecord(k, clone(c)) : clone(c)]));
    return target.projects.items.find(p => p.id === id);
  };

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
  raw.study.concepts = [{ id: 'cp1', title: 'Ports', taskIds: ['t1'], createdOn: '2026-10-02', kind: 'written', prompt: 'What is a port?', answer: 'A number', explanation: '', choices: [], correct: null, hint: '', source: '', note: '', review: { reps: 1, interval: 2, lapses: 0, due: '2026-10-08' } },
    { id: 'cp2', title: 'Handshake', taskIds: [], createdOn: '2026-10-03', kind: 'choice', prompt: 'Which comes second in the TCP handshake?', answer: 'SYN-ACK', explanation: 'The server answers the SYN.', choices: ['ACK', 'SYN-ACK', 'SYN'], correct: 1, hint: '', source: 'AI-written for the Cybersecurity lesson “TCP, UDP, ports and connection state” by W, checked by C · 3 Oct 2026', note: '', review: { reps: 0, interval: 0, lapses: 0, due: '2026-10-04' },
      origin: { by: 'ai', subject: 'cybersecurity', lessonId: 'lesson.tcp-ip-basics', writer: 'W', checker: 'C', edited: true } },
    { id: 'cp3', title: 'Spacing', taskIds: [], createdOn: '2026-10-04', kind: 'written', prompt: 'Why space out practice?', answer: 'It strengthens recall.', explanation: '', choices: [], correct: null, hint: '', source: 'AI-written from your note', note: '', review: { reps: 0, interval: 0, lapses: 0, due: null },
      origin: { by: 'ai', subject: 'note', noteId: 'ntAbc123', writer: 'W', checker: 'C', edited: false }, anotherWay: { text: 'Think of DNS as a phone book: you look up a name to get the number.', by: 'Gemini 3.8 Flash', on: '2026-10-16' } }];
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
  // Daily exercises (Health): one exercise, with two days of sets logged.
  raw.health.daily = { exercises: [{ id: 'de1', name: 'Push-ups', target: 150, set: 25, archived: false }], log: { '2026-10-02': { de1: [25, 25, 25] }, '2026-10-03': { de1: [25] } } };
  // Study → Reading: a book part-way through, with two notes.
  raw.reading = { books: [{ id: 'bk1', title: 'Deep Work', author: 'Cal Newport', pages: 296, page: 84, notes: [{ id: 'bn1', page: 42, text: 'Depth compounds.', addedOn: '2026-10-03' }, { id: 'bn2', page: null, text: 'Re-read chapter 2.', addedOn: '2026-10-04' }], addedOn: '2026-10-01', finishedOn: null }] };
  raw.fitness = { units: 'metric', answers: null, setOn: null };
  raw.notes.items = [{ id: 'nt1', categoryId: raw.notes.categories[3].id, title: '', text: 'Budget for the van', pinned: false, createdAt: '2026-10-01T09:00', updatedAt: '2026-10-01T09:00' }];
  raw.tasks.lists = [{ id: 'tl1', name: 'Moving house' }];
  raw.tasks.items = [{ id: 'tk1', title: 'Book a van', listId: 'tl1', category: 'admin', minutes: 15, due: '2026-10-10', time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-01T09:00', postponed: 1, blockers: [], letGoOn: null }];
  raw.patterns.prefs.maxTasks = { value: 2, on: '2026-10-01', from: null, why: 'You chose this.' };
  // A project (1.12.0) with a task and a note in it and an appointment listed on it.
  raw.projects = { items: [{ id: 'pj1', title: 'Coffee subscription', summary: 'For offices', stage: 'explore', status: 'active', nextTaskId: 'tk1', commitmentIds: ['c1'], createdAt: '2026-10-01T09:00', updatedAt: '2026-10-02T09:00' }] };
  raw.tasks.items[0].projectId = 'pj1';
  raw.notes.items[0].projectId = 'pj1';
  Object.assign(raw.notes.items[0], { linkedBy: 'rules', linkWhy: 'van · budget', notProjects: ['pjOld'], private: true }); // 1.13.0
  // An Arabic lesson session (after 1.15.0): first answers, one revealed, a note to self.
  // …and, from part 3, a starter word and a lesson check in revision (with an answer in Study's history).
  raw.arabic = { pathId: 'path.arabic-a1', attempts: [{ id: 'aa1', lessonId: 'lesson.arabic-origin-location', curriculumVersion: '1.1.0', variant: 'short', startedAt: '2026-10-11T09:00:00.000Z', finishedAt: '2026-10-11T09:20:00.000Z', help: 'hint', practised: ['reading', 'writing'], answers: { 'assessment.arabic-origin-location-check.q1': 'من = from, في = in' }, revealed: ['assessment.arabic-origin-location-check.q1'], revisit: 'Country adjectives' }] , cards: [{ id: 'lexeme.arabic-seed-001:recognise', addedOn: '2026-10-11', review: { reps: 1, interval: 4, lapses: 0, due: '2026-10-15' }, anotherWay: { text: 'Think of DNS as a phone book: you look up a name to get the number.', by: 'Gemini 3.8 Flash', on: '2026-10-16' } }, { id: 'assessment.arabic-origin-location-check.q1', addedOn: '2026-10-11', review: { reps: 0, interval: 0, lapses: 0, due: '2026-10-12' } }] };
  // …and, from adaptive Study, your place on that lesson: Ready to move on, a flag to revisit it, a mark on one check.
  raw.arabic.lessons = [{ id: 'lesson.arabic-origin-location', readyOn: '2026-10-12', revisit: { since: '2026-10-13', what: 'مِن or في' },
    marks: { 'assessment.arabic-origin-location-check.q1': { outcome: 'partly', support: 'hint', on: '2026-10-11', attemptId: 'aa1' } } }];
  // …and a word you kept (Keep a word), practised both ways, with a note and where it came from.
  raw.arabic.words = [{ id: 'kwsync00001', ar: 'بَيْتٌ', meaning: 'house', note: 'from the profile', from: 'asset.arabic-profile', addedOn: '2026-10-12',
    recognise: { reps: 1, interval: 3, lapses: 0, due: '2026-10-15' }, write: { reps: 0, interval: 0, lapses: 0, due: '2026-10-13' } }];
  // …and Practise again: one lesson in revision after its Try and challenge, another with a tick in a session still open.
  raw.arabic.practice = [{ id: 'lesson.arabic-origin-location', tried: '2026-10-11', challenged: '2026-10-11', addedOn: '2026-10-11', review: { reps: 1, interval: 21, lapses: 0, due: '2026-11-01' } },
    { id: 'lesson.arabic-fusha-register', open: { attemptId: 'aa1', did: ['try'] } }];
  raw.study.reviews.push({ id: 'rv2', conceptId: 'lexeme.arabic-seed-001:recognise', title: 'أَنَا → I', date: '2026-10-11', at: '2026-10-11T09:30', kind: 'written', outcome: 'right', graded: 'self', chosen: null, support: 'own', rating: 'good', gap: 4, due: '2026-10-15' });
  // …and a Cybersecurity knowledge check in revision (after 1.17.1).
  raw.cybersecurity = { pathId: 'path.core', attempts: [], cards: [{ id: 'assessment.lab-isolation-check.q2', addedOn: '2026-10-14', review: { reps: 0, interval: 0, lapses: 0, due: '2026-10-15' }, anotherWay: { text: 'Think of DNS as a phone book: you look up a name to get the number.', by: 'Gemini 3.8 Flash', on: '2026-10-16' } }] };
  // …and a portfolio entry made from a notebook attempt, with two files listed.
  raw.cybersecurity.portfolio = [{ id: 'pfsync00001', attemptId: 'caSync', activityId: 'exercise.learning-evidence', title: 'Baseline evidence', evidence: 'Compared two runs.', note: 'first try', reviewedOn: '2026-10-14', fileIds: ['flsync00001', 'flsync00002'], futureBit: { keep: ['nice', 1] } }];
  // …and your place on a Cybersecurity lesson: ready to move on (no roadmap path) and a flag, with a newer field.
  raw.cybersecurity.lessons = [{ id: 'lesson.lab-isolation', readyOn: '2026-10-12', revisit: { since: '2026-10-13', what: 'NAT versus host-only' }, futureBit: { keep: true } }];
  raw.timer = { uid: 'x', dayKey: '2026-10-04', kind: 'focus', durationSec: 1500, startedAt: 1, accumulatedMs: 0, finished: false };
  const data = R.normalize(raw);

  console.log('\n[1] Every record survives the trip unchanged');
  const recs = R.localRecords(data);
  const kinds = [...new Set([...recs.keys()].map(k => R.splitKey(k).kind))].sort();
  check('every kind of record is there', eq(kinds, ['arabic', 'arabic_attempt', 'arabic_card', 'arabic_lesson', 'arabic_practice', 'arabic_word', 'book', 'commitment', 'context', 'cyber_card', 'cyber_lesson', 'cyber_portfolio', 'cybersecurity', 'daily', 'day', 'finance', 'fitness', 'food', 'holidays', 'list', 'note', 'notes', 'pay', 'patterns', 'project', 'queue', 'recipe', 'review', 'rota', 'session', 'settings', 'study', 'task', 'tasks', 'workout', 'wsession'].filter(k => k !== 'context' && k !== 'day').sort()), kinds);
  const changedOnTheWay = [...recs].filter(([key, c]) => R.fingerprint(R.cleanRecord(key, clone(c))) !== R.fingerprint(c)).map(([k]) => k);
  check('checked as it arrives on another device, every record is exactly the same (so devices never drift apart)', changedOnTheWay.length === 0, changedOnTheWay);
  const putBack = clone(R.freshState());
  for (const [key, c] of recs) R.putRecord(putBack, key, clone(c));
  const again = R.localRecords(R.normalize(putBack));
  check('put into a new MyDay, every record comes back the same', [...recs].every(([k, c]) => R.fingerprint(again.get(k)) === R.fingerprint(c)), [...recs].filter(([k, c]) => R.fingerprint(again.get(k)) !== R.fingerprint(c)).map(([k]) => k));
  check('…the links between them too: the favourite and want-to-cook still point at the recipe, the check-in at its concept', eq(putBack.health.food.favourites, ['rOwn']) && putBack.health.food.want[0].recipeId === 'rOwn' && eq(putBack.study.sessions[0].checkin.conceptIds, ['cp1']));
  check('a record checked on its own keeps its links (the recipe and concept aren\'t in it)', eq(R.cleanRecord('food:kitchen', clone(recs.get('food:kitchen'))).favourites, ['rOwn']) && eq(R.cleanRecord('session:ss1', clone(recs.get('session:ss1'))).checkin.conceptIds, ['cp1']));

  const before = clone(raw); delete before.arabic.lessons;
  check('MyDay data from before adaptive Study sends no lesson records', ![...R.localRecords(R.normalize(before)).keys()].some(k => R.splitKey(k).kind === 'arabic_lesson'));
  { const none = clone(R.freshState()); R.putRecord(none, 'arabic_lesson:lesson.arabic-origin-location', null);
    check('a lesson record deleted elsewhere leaves a device that never had one exactly as it was', !('lessons' in none.arabic)); }
  const noWords = clone(raw); delete noWords.arabic.words;
  check('MyDay data from before Keep a word sends no word records', ![...R.localRecords(R.normalize(noWords)).keys()].some(k => R.splitKey(k).kind === 'arabic_word'));
  check('a kept word is its own record, as it was kept', eq(recs.get('arabic_word:kwsync00001').meaning, 'house') && recs.get('arabic_word:kwsync00001').write.due === '2026-10-13');
  { const none = clone(R.freshState()); R.putRecord(none, 'arabic_word:kwsync00001', null);
    check('a word removed elsewhere leaves a device that never had one exactly as it was', !('words' in none.arabic)); }
  { const has = clone(R.normalize(raw)); R.putRecord(has, 'arabic_word:kwsync00001', null);
    check('…and removes it from a device that had it', Array.isArray(has.arabic.words) && has.arabic.words.length === 0); }
  const noPortfolio = clone(raw); delete noPortfolio.cybersecurity.portfolio;
  check('MyDay data from before the portfolio sends no portfolio records', ![...R.localRecords(R.normalize(noPortfolio)).keys()].some(k => R.splitKey(k).kind === 'cyber_portfolio'));
  check('…with a field a newer MyDay added kept exactly as it was', eq(recs.get('cyber_portfolio:pfsync00001').futureBit, { keep: ['nice', 1] }));
  check('a portfolio entry is its own record, its files listed by id (their bytes are never in it)', eq(recs.get('cyber_portfolio:pfsync00001').fileIds, ['flsync00001', 'flsync00002']) && recs.get('cyber_portfolio:pfsync00001').evidence === 'Compared two runs.');
  { const none = clone(R.freshState()); R.putRecord(none, 'cyber_portfolio:pfsync00001', null);
    check('an entry removed elsewhere leaves a device that never had a portfolio exactly as it was', !('portfolio' in none.cybersecurity)); }
  { const has = clone(R.normalize(raw)); R.putRecord(has, 'cyber_portfolio:pfsync00001', null);
    check('…and removes it from a device that had it', Array.isArray(has.cybersecurity.portfolio) && has.cybersecurity.portfolio.length === 0); }
  const noCyberLessons = clone(raw); delete noCyberLessons.cybersecurity.lessons;
  check('MyDay data from before Cybersecurity lesson states sends no lesson records for it', ![...R.localRecords(R.normalize(noCyberLessons)).keys()].some(k => R.splitKey(k).kind === 'cyber_lesson'));
  check('your place on a Cybersecurity lesson is its own record: Ready, your flag, and a field a newer MyDay added', recs.get('cyber_lesson:lesson.lab-isolation').readyOn === '2026-10-12'
    && recs.get('cyber_lesson:lesson.lab-isolation').revisit.what === 'NAT versus host-only' && eq(recs.get('cyber_lesson:lesson.lab-isolation').futureBit, { keep: true }));
  { const none = clone(R.freshState()); R.putRecord(none, 'cyber_lesson:lesson.lab-isolation', null);
    check('a Cybersecurity lesson record removed elsewhere leaves a device that never had one exactly as it was', !('lessons' in none.cybersecurity)); }
  { const has = clone(R.normalize(raw)); R.putRecord(has, 'cyber_lesson:lesson.lab-isolation', null);
    check('…and removes it from a device that had it', Array.isArray(has.cybersecurity.lessons) && has.cybersecurity.lessons.length === 0); }
  check('an Arabic lesson\'s id is never a Cybersecurity lesson record', R.cleanRecord('cyber_lesson:lesson.arabic-origin-location', { id: 'lesson.arabic-origin-location', readyOn: '2026-10-12' }) === null);
  const noPractice = clone(raw); delete noPractice.arabic.practice;
  check('MyDay data from before Practise again sends no practice records', ![...R.localRecords(R.normalize(noPractice)).keys()].some(k => R.splitKey(k).kind === 'arabic_practice'));
  check('each lesson to practise again is its own record: its days, its place in revision, and ticks in a session still open', recs.get('arabic_practice:lesson.arabic-origin-location').review.due === '2026-11-01'
    && recs.get('arabic_practice:lesson.arabic-origin-location').challenged === '2026-10-11' && eq(recs.get('arabic_practice:lesson.arabic-fusha-register').open, { attemptId: 'aa1', did: ['try'] }));
  { const none = clone(R.freshState()); R.putRecord(none, 'arabic_practice:lesson.arabic-origin-location', null);
    check('a practice record cleared elsewhere leaves a device that never had one exactly as it was', !('practice' in none.arabic)); }
  { const has = clone(R.normalize(raw)); R.putRecord(has, 'arabic_practice:lesson.arabic-origin-location', null);
    check('…and removes it from a device that had it, leaving the other', eq(has.arabic.practice.map(p => p.id), ['lesson.arabic-fusha-register'])); }
  check('a practice record with nothing in it, or for another course, isn\'t taken in', R.cleanRecord('arabic_practice:lesson.arabic-origin-location', { id: 'lesson.arabic-origin-location' }) === null
    && R.cleanRecord('arabic_practice:lesson.learning-evidence', { id: 'lesson.learning-evidence', tried: '2026-10-11' }) === null);

  console.log('\n[1a] Attached files (specs/files.md)');
  {
    const withFiles = clone(raw);
    const rec = (id, x = {}) => ({ id, name: 'Quote.pdf', type: 'application/pdf', size: 2048, sha256: 'b'.repeat(64), area: 'project', state: 'kept', addedOn: '2026-10-20', futureBit: { keep: [1] }, ...x });
    withFiles.files = { items: [rec('flsync00001'), rec('flsync00002', { name: 'Photo.png', type: 'image/png', deletedOn: '2026-10-22', removedFrom: { kind: 'project', id: 'pj1' } }), rec('flsync00003', { state: 'weird-new-state' })] };
    withFiles.projects.items[0].fileIds = ['flsync00001'];
    withFiles.notes.items[0].fileIds = ['flsync00001', 'flsync00002'];
    const d2 = R.normalize(withFiles), r2 = R.localRecords(d2);
    check('each file is its own "file" record, with its fields (an unknown field and an unknown state kept)', ['flsync00001', 'flsync00002', 'flsync00003'].every(id => r2.has('file:' + id)) && eq(r2.get('file:flsync00001').futureBit, { keep: [1] }) && r2.get('file:flsync00003').state === 'weird-new-state' && r2.get('file:flsync00002').deletedOn === '2026-10-22');
    check('a file record is exactly the same when it arrives on another device (clean)', [...r2].filter(([k]) => k.startsWith('file:')).every(([k, c]) => R.fingerprint(R.cleanRecord(k, clone(c))) === R.fingerprint(c)));
    const back = clone(R.freshState());
    for (const [k, c] of r2) R.putRecord(back, k, clone(c));
    check('put into a new MyDay, the files come back as they were, in the same order', eq(back.files.items.map(f => f.id), d2.files.items.map(f => f.id)) && R.fingerprint(back.files) === R.fingerprint(d2.files), back.files.items.map(f => f.id));
    check('the project\'s and note\'s file ids travel inside their own records and come back too', eq(back.projects.items[0].fileIds, ['flsync00001']) && eq(back.notes.items[0].fileIds, ['flsync00001', 'flsync00002']));
    check('a record that is not a file (no name, a bad id, no size) is not taken in', R.cleanRecord('file:flsync00001', { id: 'flsync00001', type: 'application/pdf', size: 1 }) === null && R.cleanRecord('file:nope', { id: 'nope', name: 'x', type: 'text/plain', size: 1 }) === null && R.cleanRecord('file:flsync00009', { id: 'flsync00009', name: 'x', type: 'text/plain', size: -1 }) === null);
    check('its summary is the name, the size, and whether it is in Recently deleted', R.recordSummary('file:flsync00001', r2.get('file:flsync00001')) === 'Quote.pdf · 2 KB' && /Photo\.png · 2 KB · in Recently deleted/.test(R.recordSummary('file:flsync00002', r2.get('file:flsync00002'))), [R.recordSummary('file:flsync00001', r2.get('file:flsync00001')), R.recordSummary('file:flsync00002', r2.get('file:flsync00002'))]);
    check('its label in words is "File"', R.recordLabel('file:flsync00001') === 'File', R.recordLabel('file:flsync00001'));
    { const gone = clone(d2); R.putRecord(gone, 'file:flsync00001', null); check('a file record deleted elsewhere removes it here (and its id stays listed until the place is edited)', !gone.files.items.some(f => f.id === 'flsync00001') && gone.files.items.length === 2); }
    const none = clone(R.freshState());
    check('MyDay data with no files sends no file records, and one without the files section is read as none', ![...R.localRecords(R.normalize(raw)).keys()].some(k => k.startsWith('file:')) && eq(R.normalize(raw).files, { items: [] }) && eq(none.files, { items: [] }));
  }

  console.log('\n[1c] A project\'s research (specs/projects-research.md)');
  {
    const withResearch = clone(raw);
    const at = { createdAt: '2026-10-20T09:00', updatedAt: '2026-10-20T09:00' };
    withResearch.research = { items: [
      { id: 'rqsync00001', type: 'question', projectId: 'pj1', text: 'Do commuters buy tea?', conclusion: 'Mostly mint', answeredOn: '2026-10-22', futureBit: { keep: [1] }, ...at },
      { id: 'rssync00001', type: 'source', projectId: 'pj1', ref: { kind: 'resource', id: 'rsrc1' }, title: 'Timber merchant', from: '', on: null, ...at },
      { id: 'rssync00002', type: 'source', projectId: 'pj1', ref: null, title: 'Interview with Priya', from: 'Market stall', on: '2026-10-10', ...at },
      { id: 'rfsync00001', type: 'finding', projectId: 'pj1', text: 'Three of five said yes', limits: 'Small sample', on: '2026-10-12', sourceIds: ['rssync00002'], about: [{ kind: 'question', id: 'rqsync00001', stance: 'supports' }, { kind: 'newer', id: 'z', stance: 'doubts' }], ...at },
      { id: 'xsync000001', type: 'sketch', projectId: 'pj1', strokes: [1, 2], ...at }] };
    const d3 = R.normalize(withResearch), r3 = R.localRecords(d3);
    check('each question, source and finding is its own "research" record (a type from a newer MyDay too), with its fields', ['rqsync00001', 'rssync00001', 'rssync00002', 'rfsync00001', 'xsync000001'].every(id => r3.has('research:' + id)) && eq(r3.get('research:rqsync00001').futureBit, { keep: [1] }) && r3.get('research:rfsync00001').about[1].stance === 'doubts' && r3.get('research:xsync000001').type === 'sketch');
    check('a research record is exactly the same when it arrives on another device (clean)', [...r3].filter(([k]) => k.startsWith('research:')).every(([k, c]) => R.fingerprint(R.cleanRecord(k, clone(c))) === R.fingerprint(c)));
    const back = clone(R.freshState());
    for (const [k, c] of r3) R.putRecord(back, k, clone(c));
    const byOrder = items => [...items].sort((x, y) => x.createdAt.localeCompare(y.createdAt) || x.id.localeCompare(y.id)).map(x => x.id);
    check('put into a new MyDay, the research comes back with every field, ordered by when it was made and then its id (the same on every device, whatever order the records arrive in)', eq(back.research.items.map(x => x.id), byOrder(d3.research.items)) && eq(byOrder(back.research.items), back.research.items.map(x => x.id)) && eq(back.research.items.map(x => JSON.stringify(x)).sort(), d3.research.items.map(x => JSON.stringify(x)).sort()), back.research.items.map(x => x.id));
    { const rev = clone(R.freshState()); for (const [k, c] of [...r3].reverse()) R.putRecord(rev, k, clone(c)); check('…including when the records arrive in the opposite order', eq(rev.research.items.map(x => x.id), back.research.items.map(x => x.id))); }
    check('a record that is not research (no project, no type, a bad id) is not taken in', R.cleanRecord('research:rqsync00001', { id: 'rqsync00001', type: 'question', text: 'x' }) === null && R.cleanRecord('research:rqsync00001', { id: 'rqsync00001', projectId: 'pj1', text: 'x' }) === null && R.cleanRecord('research:bad id!', { id: 'bad id!', type: 'question', projectId: 'pj1' }) === null);
    check('its summary says what it is and its words: "Question: …", "Finding: …", "Source: …"', R.recordSummary('research:rqsync00001', r3.get('research:rqsync00001')) === 'Question: Do commuters buy tea?' && R.recordSummary('research:rfsync00001', r3.get('research:rfsync00001')) === 'Finding: Three of five said yes' && R.recordSummary('research:rssync00002', r3.get('research:rssync00002')) === 'Source: Interview with Priya' && R.recordSummary('research:xsync000001', r3.get('research:xsync000001')) === 'Research', [R.recordSummary('research:rqsync00001', r3.get('research:rqsync00001')), R.recordSummary('research:xsync000001', r3.get('research:xsync000001'))]);
    check('a long finding is shortened in its summary', R.recordSummary('research:rfsync00001', { ...r3.get('research:rfsync00001'), text: 'w'.repeat(200) }).length <= 'Finding: '.length + 81);
    check('its label in words is "Research"', R.recordLabel('research:rqsync00001') === 'Research', R.recordLabel('research:rqsync00001'));
    { const gone = clone(d3); R.putRecord(gone, 'research:rqsync00001', null); check('a research record deleted elsewhere removes it here', !gone.research.items.some(x => x.id === 'rqsync00001') && gone.research.items.length === 4); }
    check('MyDay data with no research sends no research records, and one without the section reads as none', ![...R.localRecords(R.normalize(raw)).keys()].some(k => k.startsWith('research:')) && eq(R.normalize(raw).research, { items: [] }));
    check('a project with tools and the Research kind keeps both in its own record', (() => { const w = clone(raw); w.projects.items[0].tools = ['research']; w.projects.items[0].template = 'research'; const rec = [...R.localRecords(R.normalize(w))].filter(([k]) => k === 'project:' + w.projects.items[0].id)[0][1]; const v = rec.value ?? rec; return eq(v.tools, ['research']) && v.template === 'research'; })());
  }

  console.log('\n[1b] A project with milestones and decisions');
  {
    const pr = clone(raw);
    pr.projects.items.push({ id: 'pj2', title: 'Hargeisa shop', summary: 'A small shop', stage: 'decide', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-03T09:00', updatedAt: '2026-10-04T09:00', futureThing: { a: 1 },
      milestones: [{ id: 'ms1', title: 'Find a unit', aim: '2026-11-15', reachedOn: '2026-10-10', createdAt: '2026-10-03T09:00', futureBit: 'm' }, { id: 'ms2', title: 'Open the doors', aim: null, reachedOn: null, createdAt: '2026-10-03T09:01' }],
      decisions: [{ id: 'dc1', question: 'Which unit?', options: [{ id: 'op1', text: 'Market stall', pros: Array.from({ length: 10 }, (_, i) => 'Pro ' + (i + 1)), cons: Array.from({ length: 10 }, (_, i) => 'Con ' + (i + 1)), futureBit: 'o' }, { id: 'op2', text: 'Corner shop', pros: [], cons: ['Dear', 'Far'] }], chosen: null, why: 'Cheaper to start', decidedOn: null, lastChoice: { text: 'Corner shop', on: '2026-10-08', futureBit: { reason: 'Kept by a future version' } }, createdAt: '2026-10-03T09:02', updatedAt: '2026-10-08T09:00', futureBit: 'd' },
        { id: 'dc2', question: 'Who helps?', options: [{ id: 'op3', text: 'Family', pros: ['Trusted'], cons: [] }], chosen: 'op3', why: '', decidedOn: '2026-10-09', createdAt: '2026-10-03T09:03', updatedAt: '2026-10-09T09:00' }] });
    pr.projects.items[1].decisions[0].history = [
      { id: 'dh1', text: 'A removed unit', on: '2026-10-07', why: null, futureBit: { kept: true } },
      { id: 'dh2', text: 'Corner shop', on: '2026-10-08', why: 'Cheaper to start\nSpace for storage' },
    ];
    const nd = R.normalize(pr), rs = R.localRecords(nd);
    const rec = project(rs, 'pj2'), recPlain = project(rs, 'pj1');
    check('a project with milestones and decisions reassembles from project records, with separate item records', !!rec && rec.milestones.length === 2 && rec.decisions.length === 2 && [...rs.keys()].some(k => k.startsWith('project_milestone:')), [...rs.keys()].filter(k => /^project/.test(k)));
    check('…keeping a decision\'s last choice, the unknown fields, and exactly what was entered', rec.decisions[0].lastChoice.text === 'Corner shop' && rec.futureThing.a === 1 && rec.milestones[0].futureBit === 'm' && rec.decisions[0].options[0].futureBit === 'o' && eq(rec, pr.projects.items[1]), rec);
    check('checked as it arrives on another device, it is exactly the same', R.fingerprint(project(rs, 'pj2', true)) === R.fingerprint(rec));
    check('ten points per side and unknown details of the previous choice survive normalising and syncing', rec.decisions[0].options[0].pros.length === 10 && rec.decisions[0].options[0].cons.length === 10 && eq(rec.decisions[0].lastChoice.futureBit, { reason: 'Kept by a future version' }));
    check('complete choice history, including unknown nested fields and unavailable reasons, survives the record boundary', eq(rec.decisions[0].history, pr.projects.items[1].decisions[0].history));
    const nb = clone(R.freshState());
    for (const [key, c] of rs) R.putRecord(nb, key, clone(c));
    const back = project(R.localRecords(R.normalize(nb)), 'pj2');
    check('put into a new MyDay, the project comes back the same, milestones and decisions included', R.fingerprint(back) === R.fingerprint(rec) && eq(nb.projects.items.find(p => p.id === 'pj2').decisions[1].chosen, 'op3'));
    check('a project without them round-trips without the fields appearing', !('milestones' in recPlain) && !('decisions' in recPlain) && !('milestones' in project(rs, 'pj1', true)) && !('decisions' in project(rs, 'pj1', true)) && !('milestones' in nb.projects.items.find(p => p.id === 'pj1')) && !('decisions' in nb.projects.items.find(p => p.id === 'pj1')));
  }

  console.log('\n[1c] A private project');
  {
    const pr = clone(raw);
    pr.projects.items.push({ id: 'pj3', title: 'Surprise party', summary: 'Keep it quiet', stage: 'organise', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-03T09:00', updatedAt: '2026-10-04T09:00', private: true });
    const rs = R.localRecords(R.normalize(pr)), rec = project(rs, 'pj3');
    check('a private project reassembles from project records, with private: true inside', !!rec && rec.private === true && eq(rec, pr.projects.items[1]) && [...rs.keys()].filter(k => /^project/.test(k)).length === 2, rec);
    check('checked as it arrives on another device, it is exactly the same', R.fingerprint(project(rs, 'pj3', true)) === R.fingerprint(rec) && project(rs, 'pj3', true).private === true);
    const nb = clone(R.freshState());
    for (const [key, c] of rs) R.putRecord(nb, key, clone(c));
    check('put into a new MyDay, it comes back private and the same', R.fingerprint(project(R.localRecords(R.normalize(nb)), 'pj3')) === R.fingerprint(rec) && nb.projects.items.find(p => p.id === 'pj3').private === true);
    check('a project that isn\'t private doesn\'t gain the field', !('private' in project(rs, 'pj1')) && !('private' in nb.projects.items.find(p => p.id === 'pj1')));
  }

  console.log('\n[1d] A business idea\'s one page');
  {
    const pr = clone(raw);
    pr.projects.items.push({ id: 'pj4', title: 'Lunch boxes for sites', summary: 'Hot lunches', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-03T09:00', updatedAt: '2026-10-04T09:00', template: 'business',
      model: { problem: 'Site workers eat badly', who: 'Site managers', how: 'Cook daily, charge per box', futureThing: { a: 1 }, assumptions: [
        { id: 'as1', text: 'Sites will pay', state: 'open', found: '', checkedOn: null, taskId: null, createdAt: '2026-10-03T09:00' },
        { id: 'as2', text: 'Lunch fits a break', state: 'looks-true', found: 'Two managers said yes', checkedOn: '2026-10-10', taskId: 'tk1', createdAt: '2026-10-03T09:01', futureBit: 'a' },
        { id: 'as3', text: 'Cooks can scale up', state: 'doesnt-hold', found: '', checkedOn: '2026-10-11', taskId: null, createdAt: '2026-10-03T09:02' }] } },
      { id: 'pj5', title: 'A case', summary: '', stage: 'capture', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-03T09:00', updatedAt: '2026-10-04T09:00', template: 'case' });
    const rs = R.localRecords(R.normalize(pr)), rec = project(rs, 'pj4'), recCase = project(rs, 'pj5');
    check('a business idea reassembles from project records with its template and one page, exactly as entered', !!rec && rec.template === 'business' && eq(rec, pr.projects.items[1]), rec);
    check('…keeping the unknown fields on the model and on an assumption', rec.model.futureThing.a === 1 && rec.model.assumptions[1].futureBit === 'a');
    check('checked as it arrives on another device, it is exactly the same', R.fingerprint(project(rs, 'pj4', true)) === R.fingerprint(rec));
    const nb = clone(R.freshState());
    for (const [key, c] of rs) R.putRecord(nb, key, clone(c));
    check('put into a new MyDay, the business idea comes back the same', R.fingerprint(project(R.localRecords(R.normalize(nb)), 'pj4')) === R.fingerprint(rec) && nb.projects.items.find(p => p.id === 'pj4').model.assumptions.length === 3);
    check('a project of a kind this version does not know ("case") survives the round trip unchanged', !!recCase && recCase.template === 'case' && eq(recCase, pr.projects.items[2]) && R.fingerprint(project(rs, 'pj5', true)) === R.fingerprint(recCase) && nb.projects.items.find(p => p.id === 'pj5').template === 'case', recCase);
    check('a project that is not a business idea gains neither field', !('template' in project(rs, 'pj1')) && !('model' in project(rs, 'pj1')) && !('model' in nb.projects.items.find(p => p.id === 'pj1')));
  }

  console.log('\n[1e] A case\'s records');
  {
    const pr = clone(raw);
    const T = (id, date, x = {}) => ({ id, date, about: false, title: 'Entry ' + id, details: '', source: 'mine', evidenceIds: [], issueIds: [], createdAt: '2026-10-03T09:00', ...x });
    const E = (id, status, x = {}) => ({ id, title: 'Evidence ' + id, kind: 'document', date: null, where: '', status, notes: '', issueIds: [], createdAt: '2026-10-03T09:00', ...x });
    pr.projects.items.push({ id: 'pj6', title: 'Dispute over a deposit', summary: 'Landlord kept it', stage: 'organise', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-03T09:00', updatedAt: '2026-10-04T09:00', template: 'case', private: true,
      case: { futureCase: { a: 1 },
        timeline: [T('tl1', '2026-09-01', { source: 'mine', about: true, details: 'Moved out', evidenceIds: ['ev1', 'ev2'], issueIds: ['is1'], futureBit: 't' }), T('tl2', '2026-09-10', { source: 'theirs', evidenceIds: ['ev3'] }), T('tl3', '2026-09-20', { source: 'evidence', about: false, issueIds: ['is1', 'is2'] })],
        evidence: [E('ev1', 'to-get', { kind: 'email', issueIds: ['is1'] }), E('ev2', 'have', { kind: 'message', date: '2026-09-02', where: 'https://example.com/folder/receipt.pdf', futureBit: 'e' }), E('ev3', 'reviewed', { kind: 'witness', where: 'In the blue folder, drawer 2', notes: 'Neighbour saw it', issueIds: ['is2'] })],
        issues: [{ id: 'is1', title: 'Deposit not protected', status: 'considering', notes: '', createdAt: '2026-10-03T09:00', futureBit: 'i' }, { id: 'is2', title: 'Damage claim', status: 'claiming', notes: 'Photos taken', createdAt: '2026-10-03T09:00' }, { id: 'is3', title: 'Late fee', status: 'dropped', notes: '', createdAt: '2026-10-03T09:00' }] } });
    const norm = R.normalize(pr), item = norm.projects.items.find(p => p.id === 'pj6');
    check('the case project is read back from saved data exactly as entered (nothing dropped or changed)', eq(item, pr.projects.items[pr.projects.items.length - 1]), item);
    const rs = R.localRecords(norm), rec = project(rs, 'pj6');
    check('a case reassembles from project records with its timeline, evidence and issues, exactly as entered', !!rec && eq(rec, item) && rec.case.timeline.length === 3 && rec.case.evidence.length === 3 && rec.case.issues.length === 3, rec);
    check('…keeping the unknown fields on the case, an entry, an evidence item and an issue, and private', rec.case.futureCase.a === 1 && rec.case.timeline[0].futureBit === 't' && rec.case.evidence[1].futureBit === 'e' && rec.case.issues[0].futureBit === 'i' && rec.private === true);
    check('…and every source, status, the about flag, the links and a link-looking "where" as they were', eq(rec.case.timeline.map(t => [t.source, t.about]), [['mine', true], ['theirs', false], ['evidence', false]]) && eq(rec.case.evidence.map(e => e.status), ['to-get', 'have', 'reviewed']) && eq(rec.case.issues.map(i => i.status), ['considering', 'claiming', 'dropped'])
      && rec.case.evidence[1].where === 'https://example.com/folder/receipt.pdf' && eq(rec.case.timeline[0].evidenceIds, ['ev1', 'ev2']) && eq(rec.case.timeline[2].issueIds, ['is1', 'is2']) && eq(rec.case.evidence[2].issueIds, ['is2']));
    check('checked as it arrives on another device, it is exactly the same', R.fingerprint(project(rs, 'pj6', true)) === R.fingerprint(rec));
    const nb = clone(R.freshState());
    for (const [key, c] of rs) R.putRecord(nb, key, clone(c));
    check('put into a new MyDay, the case comes back the same', R.fingerprint(project(R.localRecords(R.normalize(nb)), 'pj6')) === R.fingerprint(rec) && eq(nb.projects.items.find(p => p.id === 'pj6').case, rec.case));
  }

  console.log('\n[1f] The weekly review\'s fields');
  {
    const pr = clone(raw);
    pr.projects.items.push({ id: 'pj7', title: 'Allotment plan', summary: 'Spring beds', stage: 'act', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-03T09:00', updatedAt: '2026-10-04T09:00', focus: '2026-10-19' });
    pr.notes.items.push({ id: 'nt7', categoryId: pr.notes.categories[5].id, title: 'Week of Sun 11 Oct', text: 'What went well:\nA quiet week', pinned: false, createdAt: '2026-10-18T09:00', updatedAt: '2026-10-18T09:00', reflectionWeek: '2026-10-12' });
    Object.assign(pr.patterns.prefs, { reviewDay: 5, reviewed: '2026-10-16', reviewHidden: '2026-10-09' });
    const norm = R.normalize(pr), rs = R.localRecords(norm);
    const pj = project(rs, 'pj7'), nt = rs.get('note:nt7'), pt = rs.get('patterns:patterns');
    check('a project in focus travels with its focus day, exactly as entered', !!pj && pj.focus === '2026-10-19' && eq(pj, pr.projects.items.find(p => p.id === 'pj7')), pj);
    check('a note written for a weekly review travels with the week it is for', !!nt && nt.reflectionWeek === '2026-10-12' && eq(nt, pr.notes.items.find(n => n.id === 'nt7')), nt);
    check('the review day and the reviews done and put off travel with your preferences', !!pt && pt.prefs.reviewDay === 5 && pt.prefs.reviewed === '2026-10-16' && pt.prefs.reviewHidden === '2026-10-09', pt && pt.prefs);
    check('checked as they arrive on another device, all three are exactly the same', ['project:pj7', 'note:nt7', 'patterns:patterns'].every(key => R.fingerprint(R.cleanRecord(key, clone(rs.get(key)))) === R.fingerprint(rs.get(key))));
    const nb = clone(R.freshState());
    for (const [key, c] of rs) R.putRecord(nb, key, clone(c));
    const back = R.normalize(nb);
    check('put into a new MyDay, the focus, the reflection\'s week and the review preferences come back the same', back.projects.items.find(p => p.id === 'pj7').focus === '2026-10-19' && back.notes.items.find(n => n.id === 'nt7').reflectionWeek === '2026-10-12'
      && back.patterns.prefs.reviewDay === 5 && back.patterns.prefs.reviewed === '2026-10-16' && back.patterns.prefs.reviewHidden === '2026-10-09', back.patterns.prefs);
  }

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
  R.putRecord(d, 'project:pjNew', { projectId: 'pjNew', value: { ...d.projects.items[0], id: 'pjNew', title: 'Podcast' } });
  R.putRecord(d, 'project:pj1', null);
  check('projects are added and removed by id (the tasks and notes that pointed at one are left as they are)', eq(d.projects.items.map(p => p.id), ['pjNew']) && d.tasks.items[0].projectId === 'pj1');
  check('a project arriving with a wrong stage is read like a saved one (Capture), not refused', R.cleanRecord('project:pjX', { projectId: 'pjX', value: { id: 'pjX', title: 'X', stage: 'nowhere' } }).value.stage === 'capture');
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
  // A task's steps and what it starts after (specs/projects-steps.md): two versions that differ only there can be told apart.
  const stepped = { ...recs.get('task:tk1'), steps: [{ id: 'ts1', text: 'Measure the wall', done: true }, { id: 'ts2', text: 'Order the boards', done: false }], after: ['tkX', 'tkY'] };
  check('a task with steps: "· 1 of 2 steps" at the end of its summary, and its steps (ticked ones marked) and "Starts after 2 tasks" as its lines',
    / · 1 of 2 steps$/.test(R.recordSummary('task:tk1', stepped)) && eq(R.recordLines('task:tk1', stepped), ['✓ Measure the wall', 'Order the boards', 'Starts after 2 tasks']), [R.recordSummary('task:tk1', stepped), R.recordLines('task:tk1', stepped)]);
  check('…and a task without them has no lines, and its summary as before', eq(R.recordLines('task:tk1', recs.get('task:tk1')), []) && !/steps/.test(R.recordSummary('task:tk1', recs.get('task:tk1'))));

  fs.rmSync(dir, { recursive: true, force: true });
  const sm = summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
