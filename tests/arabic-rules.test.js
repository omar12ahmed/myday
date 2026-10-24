// Arabic Fuṣḥā as prepared for the app (app/scripts/prepare-arabic.mjs): the split files are complete and
// consistent, answers stay out of the course files, sizes stay bounded, and building leaves the supplied
// package untouched. Then your records: sessions (part 2) and revision cards (part 3). No browser.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
let pass = 0, fail = 0;
const check = (name, ok) => { console.log(`  ${ok ? 'PASS' : 'FAIL'} ${name}`); ok ? pass++ : fail++; };
const pkg = path.join(ROOT, 'content/arabic-fusha'), out = path.join(ROOT, 'app/src/study/arabic/data');
const read = f => fs.readFileSync(f, 'utf8');
const hashes = () => Object.fromEntries(fs.readdirSync(pkg).filter(f => f.endsWith('.json')).map(f => [f, require('crypto').createHash('sha256').update(fs.readFileSync(path.join(pkg, f))).digest('hex')]));

console.log('\n[1] Preparing the package');
const before = hashes();
execFileSync('node', [path.join(ROOT, 'app/scripts/prepare-arabic.mjs')], { stdio: 'pipe' });
check('validating and splitting leaves the supplied package exactly as it was (the report included)', JSON.stringify(hashes()) === JSON.stringify(before));

const source = JSON.parse(read(path.join(pkg, 'MyDay_Arabic_Fusha_Curriculum.json')));
const keys = JSON.parse(read(path.join(pkg, 'MyDay_Arabic_Assessment_Keys.json')));
const index = JSON.parse(read(path.join(out, 'index.json')));
const texts = JSON.parse(read(path.join(out, 'texts.json')));
const answers = JSON.parse(read(path.join(out, 'answers.json')));
const chunks = Object.fromEntries(fs.readdirSync(path.join(out, 'modules')).map(f => [f.replace('.json', ''), JSON.parse(read(path.join(out, 'modules', f)))]));

console.log('\n[2] Complete and consistent');
check('the map has every module, lesson title and path', index.modules.length === 30 && Object.keys(index.lessons).length === 152 && index.paths.length === 11);
check('one file per module, named after it', Object.keys(chunks).length === 30 && index.modules.every(m => chunks[m.id.split('.').pop()]?.module_id === m.id));
const all = k => Object.values(chunks).flatMap(c => c[k]);
check('every lesson, exercise, lab and assessment is in exactly one module file', all('lessons').length === source.lessons.length && all('exercises').length === source.exercises.length && all('labs').length === source.labs.length && all('assessments').length === source.assessments.length);
check('each lesson\'s task, check and challenge are in its own module file', all('lessons').every(l => { const c = chunks[l.module_id.split('.').pop()]; return c.exercises.some(e => e.id === l.practical_task_id) && c.exercises.some(e => e.id === l.mini_challenge_id) && c.assessments.some(a => a.id === l.knowledge_check_id); }));
check('every lesson on the map points at a module that lists it', Object.entries(index.lessons).every(([id, l]) => index.modules.find(m => m.id === l.module_id)?.lesson_ids.includes(id)));
check('the reading texts and starter words are all there', texts.assets.length === 16 && texts.lexicon.length === 48);

console.log('\n[3] Answers only where they belong');
check('no reference answer appears in the map, the module files or the texts', ![read(path.join(out, 'index.json')), read(path.join(out, 'texts.json')), ...fs.readdirSync(path.join(out, 'modules')).map(f => read(path.join(out, 'modules', f)))].some(s => /expected_answer|"answer":/.test(s)));
check('every reference answer from the package is kept', Object.keys(answers).length === keys.answer_keys.length && keys.answer_keys.every(k => answers[k.id]?.answer === k.expected_answer));
const questions = [...all('assessments').flatMap(a => a.questions || []), ...texts.assets.flatMap(a => a.comprehension_questions || [])];
check('every question, in lessons and texts, has its answer', questions.length > 400 && questions.every(q => answers[q.answer_key_id]));

console.log('\n[4] Sizes stay bounded');
const size = f => fs.statSync(f).size;
check('the map (loaded with the Arabic screen) stays under 300 KB', size(path.join(out, 'index.json')) < 300000);
check('each module (loaded when opened) stays under 60 KB', fs.readdirSync(path.join(out, 'modules')).every(f => size(path.join(out, 'modules', f)) < 60000));
check('the answers (loaded only when asked for) stay under 160 KB', size(path.join(out, 'answers.json')) < 160000);

console.log('\n[5] Arabic text kept as written');
check('Arabic stays in logical order, never reversed or altered', JSON.stringify(texts).includes('أَنَا لَيْلَى. أَنَا طَالِبَةٌ.') && texts.lexicon[0].form_ar === 'أَنَا');
check('vowelled and unvowelled versions are both kept where the package has them', texts.assets.filter(a => a.text_unvowelled).every(a => a.text_ar && a.text_unvowelled !== undefined));

(async () => {
  console.log('\n[6] Your Arabic records (part 2)');
  const os = require('os'), { pathToFileURL } = require('url');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-arabic-data-'));
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  fs.writeFileSync(path.join(tmp, 'entry.ts'), [...['types', 'normalize', 'sessions', 'cards', 'lessons', 'words', 'practice'].map(f => path.join(ROOT, 'app/src/data/arabic', f)), path.join(ROOT, 'app/src/data/study/queue'),
    path.join(ROOT, 'app/src/data/study/revision'), path.join(ROOT, 'app/src/data/study/mastery')].map(f => `export * from ${JSON.stringify(f)};`).join('\n'));
  const A = await import(pathToFileURL(await bundle(path.join(tmp, 'entry.ts'), path.join(tmp, 'out'))).href);
  check('the version the screens record matches the package', A.ARABIC_VERSION === source.curriculum_version);
  const good = { id: 'aa1', lessonId: 'lesson.arabic-origin-location', curriculumVersion: '1.1.0', variant: 'short', startedAt: '2026-10-11T09:00:00.000Z', finishedAt: null, help: 'hint', practised: ['reading', 'reading', 'dancing'], answers: { 'assessment.arabic-origin-location-check.q1': 'من', 'nonsense.key': 'x' }, revealed: ['assessment.arabic-origin-location-check.q1', 'bad'], revisit: 'x'.repeat(2000), score: 95 };
  const report = { dropped: 0 };
  const data = A.normalizeArabic({ pathId: 'path.arabic-a1', attempts: [good, { ...good }, { id: 'bad id!', lessonId: 'lesson.arabic-x' }, { ...good, id: 'aa2', lessonId: 'lesson.cyber-thing' }, { ...good, id: 'aa3', startedAt: 'yesterday' }] }, report);
  const a = data.attempts[0];
  check('a valid session is kept, a duplicate and malformed ones are dropped (and counted)', data.attempts.length === 1 && report.dropped === 4);
  check('only known practice kinds, question ids and fields survive; nothing like a score is kept', JSON.stringify(a.practised) === '["reading"]' && Object.keys(a.answers).join() === 'assessment.arabic-origin-location-check.q1' && a.revealed.join() === 'assessment.arabic-origin-location-check.q1' && !('score' in a) && a.revisit.length === 1000);
  const keptA = A.normalizeArabic({ pathId: 'path.arabic-a1', attempts: [], cards: [{ id: 'lexeme.arabic-seed-001:recognise', addedOn: '2026-10-11', anotherWay: { text: 'Picture the word on a door sign.', by: 'GLM-5.3-Flash', on: '2026-10-16' } }, { id: 'lexeme.arabic-seed-002:recognise', addedOn: '2026-10-11', anotherWay: { text: 'x', on: 'someday' } }] }).cards;
  check('an explanation you kept on an Arabic card (from 1.20.2) is kept; one without a proper day is left off, keeping the card', keptA.length === 2 && keptA[0].anotherWay.text === 'Picture the word on a door sign.' && !('anotherWay' in keptA[1]));
  check('an unknown path falls back to the core course', A.normalizeArabic({ pathId: 'path.core' }).pathId === A.ARABIC_CORE_PATH && data.pathId === 'path.arabic-a1');
  check('no Arabic section yet means none of your sessions, not an error', A.normalizeArabic(undefined).attempts.length === 0);
  const later = A.normalizeArabic({ pathId: 'path.arabic-a1', attempts: [good], laterList: [{ id: 'x' }], laterField: { x: 1 } });
  check('fields a newer MyDay adds to the section are kept as they are (going back a version never loses them)', JSON.stringify(later.laterList) === '[{"id":"x"}]' && later.laterField.x === 1 && later.attempts.length === 1 && !('score' in later.attempts[0]));
  const d = { arabic: A.emptyArabic() };
  const id = A.beginSession(d, 'lesson.arabic-origin-location', 'standard');
  check('starting a session twice on a lesson keeps the one already open', A.beginSession(d, 'lesson.arabic-origin-location', 'short') === id && d.arabic.attempts.length === 1 && d.arabic.attempts[0].variant === 'standard');
  A.changeSession(d, id, s => { A.writeFirstAnswer(s, 'assessment.q', 'first'); A.markRevealed(s, 'assessment.q'); A.writeFirstAnswer(s, 'assessment.q', 'changed after looking'); });
  check('a first answer stays as written once the reference has been seen', d.arabic.attempts[0].answers['assessment.q'] === 'first');
  check('a session still open isn\'t practice yet: the lesson stays New', A.stateOf({ ...d, study: { reviews: [] } }, 'lesson.arabic-origin-location', []) === 'new');
  A.finishSession(d, id);
  check('a finished session can no longer be changed', d.arabic.attempts[0].finishedAt && A.changeSession(d, id, s => { s.revisit = 'late'; }) === false && d.arabic.attempts[0].revisit === '');
  check('a finished session makes the lesson Practised, never by itself done', A.stateOf({ ...d, study: { reviews: [] } }, 'lesson.arabic-origin-location', []) === 'practised');
  const other = A.beginSession(d, 'lesson.y', 'short');
  check('discarding removes only that session', A.discardSession(d, other) && d.arabic.attempts.length === 1 && d.arabic.attempts[0].id === id);

  console.log('\n[7] Starter words and lesson checks in revision (part 3)');
  const checks = JSON.parse(read(path.join(out, 'checks.json')));
  const kc = source.assessments.filter(x => x.type === 'knowledge_check'), kcq = kc.flatMap(x => x.questions.map(q => ({ q, lesson: x.lesson_id })));
  check('every lesson check is ready for revision, with its question and its lesson\'s title', Object.keys(checks).length === kcq.length && kcq.every(({ q, lesson }) => checks[q.id]?.prompt === q.prompt && checks[q.id].lesson === index.lessons[lesson].title));
  check('…and each has its reference answer under the same id', Object.keys(checks).every(id => answers[id]));
  check('…in a file that stays under 100 KB (loaded only when a round reaches a check)', size(path.join(out, 'checks.json')) < 100000 && !/expected_answer|"answer":/.test(read(path.join(out, 'checks.json'))));
  check('a check\'s id names its lesson, for every check in the course', kcq.every(({ q, lesson }) => { const r = A.cardRef(q.id); return r.kind === 'check' && r.lessonId === lesson; }));
  const wordIds = texts.lexicon.map(w => w.id);
  check('every card id fits a sync record (64 characters at most) and is read back as it was', [...kcq.map(x => x.q.id), ...wordIds.flatMap(w => [A.wordCard(w, 'recognise'), A.wordCard(w, 'write')])].every(cid => cid.length <= 64 && A.cleanArabicCard({ id: cid, addedOn: '2026-10-11' })?.id === cid));
  const rv = { reps: 2, interval: 4, lapses: 0, due: '2026-10-15' };
  const cr = { dropped: 0 }, read2 = A.normalizeArabic({ cards: [{ id: 'lexeme.arabic-seed-001:recognise', addedOn: '2026-10-11', review: rv, score: 80 }, { id: 'lexeme.arabic-seed-001:recognise', addedOn: '2026-10-11' }, { id: 'lexeme.arabic-seed-002:speak', addedOn: '2026-10-11' }, { id: 'lesson.arabic-x', addedOn: '2026-10-11' }, { id: 'assessment.arabic-fusha-register-check.q1', addedOn: 'today' }] }, cr);
  check('saved cards are read back with their schedule; duplicates, unknown kinds and bad dates are dropped (and counted)', read2.cards.length === 1 && JSON.stringify(read2.cards[0]) === JSON.stringify({ id: 'lexeme.arabic-seed-001:recognise', addedOn: '2026-10-11', review: rv }) && cr.dropped === 4);
  check('no cards saved yet means nothing in revision, not an error', A.normalizeArabic({ pathId: 'path.arabic-a1', attempts: [] }).cards.length === 0 && A.emptyArabic().cards.length === 0);

  const day = '2026-10-11', tomorrow = '2026-10-12';
  const dd = { arabic: A.emptyArabic(), cybersecurity: { cards: [] }, study: { concepts: [], sessions: [], reviews: [] } }; // as real data always has both sections
  const first = A.nextWords(dd, wordIds, A.ADD_A_FEW);
  check('"Add the next 5" takes the first five starter words in the course\'s order', first.join() === wordIds.slice(0, 5).join());
  check('adding cards puts each in revision once, first back tomorrow', A.addCards(dd, first.map(w => A.wordCard(w, 'recognise')), day) === 5 && A.addCards(dd, [A.wordCard(first[0], 'recognise')], day) === 0 && dd.arabic.cards.every(c => c.addedOn === day && c.review.due === tomorrow && c.review.reps === 0));
  check('…so the next five are the five after them', A.nextWords(dd, wordIds, A.ADD_A_FEW).join() === wordIds.slice(5, 10).join());
  A.addCards(dd, [A.wordCard(first[0], 'write')], day);
  check('a word counts once towards the day\'s new words, either way round', A.wordsAddedOn(dd, day) === 5 && A.wordsAddedOn(dd, tomorrow) === 0 && A.NEW_WORDS_A_DAY === 8);
  check('nothing is due on the day it was added', A.dueIds(dd, day).length === 0 && A.nextDueDate(dd, day) === tomorrow);
  dd.study.concepts = [{ id: 'cp1', title: 'Ports', kind: 'written', prompt: 'What is a port?', answer: 'A number', explanation: '', choices: [], correct: null, review: { reps: 1, interval: 2, lapses: 0, due: day } },
    { id: 'cp2', title: 'New', kind: 'written', prompt: 'Q?', answer: 'A', explanation: '', choices: [], correct: null, review: { reps: 0, interval: 0, lapses: 0, due: null } }];
  const due = A.dueIds(dd, tomorrow);
  check('one queue: concepts and Arabic cards due, oldest first, then concepts never revised', due.length === 8 && due[0] === 'cp1' && due[due.length - 1] === 'cp2' && due.slice(1, 7).every(x => x.startsWith('lexeme.')));
  check('"Revise Arabic" takes only the Arabic cards', A.dueIds(dd, tomorrow, 'arabic').length === 6 && A.dueIds(dd, tomorrow, 'arabic').every(x => x.startsWith('lexeme.')));
  const cid = A.wordCard(first[1], 'recognise');
  check('an answer reschedules the card with Study\'s rules (Good on a first review: in 4 days)', A.rateCard(dd, cid, 'أَنْتَ → you', tomorrow, { outcome: 'right', chosen: null, support: 'own' }, 'good') && dd.arabic.cards.find(c => c.id === cid).review.due === '2026-10-16' && dd.arabic.cards.find(c => c.id === cid).review.reps === 1);
  const saved = dd.study.reviews[0];
  check('…and goes into Study\'s revision history under the card\'s id, self-assessed (never marked)', dd.study.reviews.length === 1 && saved.conceptId === cid && saved.title === 'أَنْتَ → you' && saved.kind === 'written' && saved.graded === 'self' && saved.gap === 4);
  check('…so the learning record reads it like a concept\'s (recalled on your own)', A.understanding(dd.study, { id: cid }) === 'recalled');
  check('a card no longer in revision can\'t be answered', A.rateCard(dd, 'lexeme.arabic-seed-999:recognise', 'x', tomorrow, { outcome: 'right', chosen: null, support: 'own' }, 'good') === false && dd.study.reviews.length === 1);
  check('taking a word out removes both ways round and keeps its past answers', A.removeCards(dd, [A.wordCard(first[0], 'recognise'), A.wordCard(first[0], 'write'), cid]) && !A.wordInRevision(dd, first[0]) && dd.arabic.cards.length === 3 && dd.study.reviews.length === 1);

  console.log('\n[8] Adaptive Study: your place on a lesson, the next step and the checks that come back');
  const L = 'lesson.arabic-nominal-sentences', Q = n => `assessment.arabic-nominal-sentences-check.q${n}`, qs = [Q(1), Q(2), Q(3)];
  check('the course map knows each lesson\'s checks, and their ids follow the lesson\'s own', Object.keys(index.lessons).every(id => index.lessons[id].checks === kcq.filter(x => x.lesson === id).length) && A.checkIds(L, 3).join() === qs.join());
  const kinds = JSON.parse(read(path.join(ROOT, 'content/teaching/arabic/prerequisite-kinds.json')));
  const checkpointShort = new Set(kinds.checkpoint.map(x => x.replace('skill.arabic-', '')));
  check('catch-up never points at a checkpoint: no lesson builds on a portfolio, consolidation or study-method skill', checkpointShort.has('b1-portfolio') && checkpointShort.has('goal-baseline')
    && Object.values(index.lessons).every(l => l.builds_on.every(x => !checkpointShort.has(x) && index.skills['skill.arabic-' + x])));
  check('…while the content it builds on stays (past verbs build on present actions, not the A1 portfolio)', index.lessons['lesson.arabic-past-suffixes'].builds_on.includes('objects-prepositions') && !index.lessons['lesson.arabic-past-suffixes'].builds_on.includes('a1-portfolio'));
  check('every lesson has its short and revision sessions\' minutes on the map', Object.values(index.lessons).every(l => l.short > 0 && l.revision > 0 && l.revision <= l.short && l.short < l.minutes));

  const rep = { dropped: 0 };
  const nl = A.normalizeArabic({ pathId: 'path.arabic-a1', attempts: [], cards: [], lessons: [
    { id: L, readyOn: '2026-10-20', revisit: { since: '2026-10-21', what: 'the predicate' }, score: 90, marks: { [Q(1)]: { outcome: 'right', support: 'own', on: '2026-10-20', attemptId: 'aa1' },
      [Q(2)]: { outcome: 'great', support: 'own', on: '2026-10-20', attemptId: 'aa1' }, 'assessment.arabic-origin-location-check.q1': { outcome: 'right', support: 'own', on: '2026-10-20', attemptId: 'aa1' } } },
    { id: L }, { id: 'lesson.cyber-thing' }, { id: 'lesson.arabic-x', readyOn: 'soon' }] }, rep);
  check('a lesson record keeps only what you chose: the day, the flag and marks on its own checks (nothing like a score)', nl.lessons.length === 2 && nl.lessons[0].readyOn === '2026-10-20'
    && nl.lessons[0].revisit.what === 'the predicate' && Object.keys(nl.lessons[0].marks).join() === Q(1) && !('score' in nl.lessons[0]));
  check('…a duplicate and another course\'s lesson are dropped and counted; a day that isn\'t one is left off', rep.dropped === 2 && nl.lessons[1].id === 'lesson.arabic-x' && !('readyOn' in nl.lessons[1]));
  check('no lessons yet stays absent, so older data is unchanged', !('lessons' in A.normalizeArabic({ pathId: 'path.arabic-a1', attempts: [] })));
  check('a lessons field that isn\'t a list is counted, and left as an empty list', (() => { const r = { dropped: 0 }, x = A.normalizeArabic({ lessons: 'x' }, r); return r.dropped === 1 && Array.isArray(x.lessons) && !x.lessons.length; })());

  const stub = () => ({ arabic: A.emptyArabic(), study: { reviews: [], concepts: [] }, cybersecurity: { cards: [] } });
  const review = (dd2, id, date, outcome, support = 'own', rating = outcome === 'right' ? 'good' : 'again') => dd2.study.reviews.push({ id: 'rv' + dd2.study.reviews.length, conceptId: id, title: 't', date, at: date + 'T09:00', kind: 'written', outcome, graded: 'self', chosen: null, support, rating, gap: 1, due: date });
  const s1 = stub(), k = '2026-10-20';
  check('a lesson with no session is New', A.stateOf(s1, L, qs) === 'new');
  const att = A.beginSession(s1, L, 'standard');
  check('marks are kept only in a session that\'s open, and only for the lesson\'s own checks', A.markCheck(s1, att, Q(1), 'right', 'own', k)
    && !A.markCheck(s1, att, 'assessment.arabic-origin-location-check.q1', 'right', 'own', k) && !A.markCheck(s1, 'nope', Q(1), 'right', 'own', k));
  A.markCheck(s1, att, Q(2), 'right', 'own', k); A.markCheck(s1, att, Q(3), 'right', 'hint', k);
  check('"looks ready" needs every check Right on my own in that session', !A.looksReady(qs, A.marksIn(s1, att, L)));
  A.markCheck(s1, att, Q(3), 'right', 'own', k);
  check('…and the latest mark replaces the earlier one', A.looksReady(qs, A.marksIn(s1, att, L)) && A.lessonRecord(s1, L).marks[Q(3)].support === 'own');
  check('…and a lesson without checks never "looks ready"', !A.looksReady([], {}));
  A.finishSession(s1, att);
  check('a finished session is practice: Practised, and its marks can no longer change', A.stateOf(s1, L, qs) === 'practised' && !A.markCheck(s1, att, Q(1), 'wrong', 'own', '2026-10-21'));

  s1.arabic.cards.push({ id: Q(1), addedOn: '2026-10-01', review: { reps: 3, interval: 10, lapses: 0, due: '2026-11-15' } });
  const added = A.markReady(s1, L, qs, k);
  check('Ready to move on saves the day and brings its checks back a week later', A.lessonRecord(s1, L).readyOn === k && added.map(a => a.id).join() === [Q(2), Q(3)].join() && added.every(a => a.due === '2026-10-27'));
  check('…while a check already in revision keeps its schedule', A.cardOf(s1, Q(1)).review.due === '2026-11-15' && A.cardOf(s1, Q(1)).review.reps === 3);
  check('a lesson marked ready is Ready to move on', A.stateOf(s1, L, qs) === 'ready');
  review(s1, Q(1), '2026-10-26', 'right'); review(s1, Q(2), '2026-10-27', 'right'); review(s1, Q(3), '2026-10-27', 'right');
  check('recalling a check on your own 6 days after Ready isn\'t yet Holding', A.stateOf(s1, L, qs) === 'ready');
  review(s1, Q(1), '2026-10-27', 'right');
  check('every check right on your own 7 or more days after Ready: Holding', A.stateOf(s1, L, qs) === 'holding');
  review(s1, Q(2), '2026-11-03', 'wrong', 'own', 'again');
  check('a slip after Ready: Needs revision', A.stateOf(s1, L, qs) === 'needs-revision');
  review(s1, Q(2), '2026-11-04', 'right');
  check('…and recalling it on your own again clears that by itself', A.stateOf(s1, L, qs) === 'holding');
  review(s1, Q(3), '2026-11-05', 'right', 'hint', 'good');
  check('right with a hint after Holding isn\'t a slip', A.stateOf(s1, L, qs) === 'holding');
  A.flagRevisit(s1, L, '  the nominal predicate  ', '2026-11-06');
  check('your own Needs revision flag comes first, with what needs work', A.stateOf(s1, L, qs) === 'needs-revision' && A.lessonRecord(s1, L).revisit.what === 'the nominal predicate');
  check('Done revisiting clears it (once)', A.clearRevisit(s1, L) && A.stateOf(s1, L, qs) === 'holding' && !A.clearRevisit(s1, L));
  A.flagRevisit(s1, L, 'x', '2026-11-06'); A.markReady(s1, L, qs, '2026-11-07');
  check('marking it ready again starts afresh from that day and clears your flag', A.lessonRecord(s1, L).readyOn === '2026-11-07' && !A.lessonRecord(s1, L).revisit && A.stateOf(s1, L, qs) === 'ready');
  check('Not ready after all takes back the day and leaves its cards in revision', A.unmarkReady(s1, L) && !A.lessonRecord(s1, L).readyOn && !!A.cardOf(s1, Q(2)) && A.stateOf(s1, L, qs) === 'practised');

  // The independent review's cases (24 Oct 2026): the same day as Ready, a slip that isn't cleared by help, and session marks.
  const s6 = stub(), a6 = A.beginSession(s6, L, 'standard');
  A.markCheck(s6, a6, Q(1), 'notsure', 'own', k); A.finishSession(s6, a6); A.markReady(s6, L, qs, k);
  check('"Not sure" in a session, then Ready anyway the same day: Ready to move on, not Needs revision', A.stateOf(s6, L, qs) === 'ready');
  review(s6, Q(1), '2026-10-28', 'wrong', 'own', 'again');
  check('a slip on a later day needs revision', A.stateOf(s6, L, qs) === 'needs-revision');
  review(s6, Q(1), '2026-10-29', 'partly', 'notes', 'good');
  check('…and stays until you recall it on your own: partly right with notes isn\'t enough', A.stateOf(s6, L, qs) === 'needs-revision');
  review(s6, Q(1), '2026-10-30', 'right', 'hint', 'good');
  check('…nor right with a hint', A.stateOf(s6, L, qs) === 'needs-revision');
  review(s6, Q(1), '2026-10-31', 'right');
  check('…right on your own clears it', A.stateOf(s6, L, qs) === 'ready');
  const s7 = stub(), a7 = A.beginSession(s7, L, 'standard'); A.finishSession(s7, a7); A.markReady(s7, L, qs, k);
  const a7b = A.beginSession(s7, L, 'revision');
  for (const q of qs) A.markCheck(s7, a7b, q, 'right', 'own', '2026-10-28');
  check('Holding comes from revision, not from session marks (all right on your own 8 days later is still Ready)', A.stateOf(s7, L, qs) === 'ready');
  for (const q of qs) review(s7, q, '2026-10-28', 'right');
  check('…the same answers in revision make it Holding', A.stateOf(s7, L, qs) === 'holding');

  const s2 = stub(), a2 = A.beginSession(s2, L, 'short');
  A.markCheck(s2, a2, Q(1), 'wrong', 'own', k); A.markCheck(s2, a2, Q(2), 'notsure', 'notes', k); A.markCheck(s2, a2, Q(3), 'partly', 'own', k);
  s2.arabic.cards.push({ id: Q(2), addedOn: '2026-10-01', review: { reps: 2, interval: 4, lapses: 0, due: '2026-10-30' } });
  A.finishSession(s2, a2);
  const back = A.bringBackNotYet(s2, a2, L, k);
  check('checks marked Not right or Not sure come back the next day by themselves', back.map(b => b.id).join() === Q(1) && back[0].due === '2026-10-21' && A.cardOf(s2, Q(1)).review.reps === 0);
  check('…Partly right waits for Ready, and one already in revision keeps its schedule', !A.cardOf(s2, Q(3)) && A.cardOf(s2, Q(2)).review.due === '2026-10-30');

  const s3 = stub();
  for (let i = 0; i < 8; i++) s3.arabic.cards.push({ id: `lexeme.arabic-seed-00${i}:recognise`, addedOn: k, review: { reps: 0, interval: 0, lapses: 0, due: '2026-10-27' } });
  check('at most 8 cards come back for the first time on one day: a full day moves the rest to the next', A.markReady(s3, L, qs, k).every(p => p.due === '2026-10-28'));
  check('…counting every card not yet answered, in course order', JSON.stringify(A.placeNewCards(['2026-10-27', '2026-10-27', null], '2026-10-27', 3, 3)) === JSON.stringify(['2026-10-27', '2026-10-28', '2026-10-28']));
  check('cards you add yourself are never delayed by it', A.addCards(s3, ['lexeme.arabic-seed-040:recognise'], k) === 1 && A.cardOf(s3, 'lexeme.arabic-seed-040:recognise').review.due === '2026-10-21');

  const s4 = stub(), a4 = A.beginSession(s4, L, 'standard');
  A.markCheck(s4, a4, Q(1), 'right', 'own', k); A.discardMarks(s4, a4, L); A.discardSession(s4, a4);
  check('discarding a session removes its marks too, and a record left empty goes', !A.lessonRecord(s4, L) && !s4.arabic.attempts.length);
  const s5 = stub();
  A.finishSession(s5, A.beginSession(s5, L, 'standard')); A.finishSession(s5, A.beginSession(s5, 'lesson.arabic-greetings-address', 'short'));
  A.markReady(s5, 'lesson.arabic-greetings-address', [], k);
  check('the one-time offer lists practised lessons with no record of your own yet', A.practisedUnmarked(s5).join() === L);

  const steps = ['lesson.a', 'lesson.b', 'lesson.c'], st = {};
  const input = (o = {}) => ({ path: steps, state: id => st[id] ?? 'new', open: null, buildsOn: id => (id === 'lesson.c' ? ['lesson.a'] : []), due: 0, stopped: false, ...o });
  check('next step, nothing done: the first lesson, New', JSON.stringify(A.nextStep(input())) === JSON.stringify({ kind: 'lesson', lessonId: 'lesson.a', state: 'new', due: 0 }));
  st['lesson.a'] = 'practised';
  check('a practised lesson stays the next step: no moving on just because time was spent', A.nextStep(input()).lessonId === 'lesson.a' && A.nextStep(input()).state === 'practised');
  check('an open session on the path comes first', A.nextStep(input({ open: 'lesson.b' })).kind === 'resume' && A.nextStep(input({ open: 'lesson.b' })).lessonId === 'lesson.b');
  check('…but not one beyond your path', A.nextStep(input({ open: 'lesson.z' })).kind === 'lesson');
  check('revision that\'s due comes before the lesson, which stays right after it', A.nextStep(input({ due: 4 })).kind === 'revise' && A.nextStep(input({ due: 4 })).lessonId === 'lesson.a');
  check('…unless today\'s gentle stop is reached', A.nextStep(input({ due: 4, stopped: true })).kind === 'lesson');
  st['lesson.a'] = 'needs-revision'; st['lesson.b'] = 'ready';
  check('the next lesson builds on one that needs revision: revisit that one first', JSON.stringify(A.nextStep(input())) === JSON.stringify({ kind: 'revisit', lessonId: 'lesson.a', because: 'lesson.c', state: 'needs-revision', due: 0 }));
  st['lesson.c'] = 'holding';
  check('nothing new left: it says so, pointing at the lesson that needs revision', A.nextStep(input()).kind === 'complete' && A.nextStep(input()).lessonId === 'lesson.a' && A.nextStep(input()).waiting === 1);
  st['lesson.b'] = 'needs-revision';
  check('…counting them when more than one needs revision, never saying "every other"', A.nextStep(input()).waiting === 2 && /^2 lessons on your path need revision/.test(A.stepReason(A.nextStep(input()), x => x)));
  st['lesson.b'] = 'ready';
  st['lesson.a'] = 'ready';
  check('…or at the start of the path when every lesson is ready', A.nextStep(input()).kind === 'complete' && A.nextStep(input()).lessonId === 'lesson.a' && A.nextStep(input()).state === 'ready');
  check('an empty path has no next step', A.nextStep({ ...input(), path: [] }) === null);
  check('"Why this?" says why in words', A.stepReason({ kind: 'revisit', lessonId: 'lesson.a', because: 'lesson.c', state: 'needs-revision', due: 0 }, id => ({ 'lesson.c': 'Past verbs' })[id] ?? id, 'the jussive') === 'Past verbs builds on this lesson, which needs revision: the jussive.'
    && /practised/i.test(A.stepReason({ kind: 'lesson', lessonId: 'x', state: 'practised', due: 0 }, x => x)));
  check('session length: the standard session when it fits', A.lengthFor(45, { standard: 45, short: 15 }, false) === 'standard');
  check('…the short session when energy or time allows 20 minutes', A.lengthFor(20, { standard: 45, short: 15 }, false) === 'short');
  check('…the revision session for a lesson that needs revision', A.lengthFor(20, { standard: 45, short: 15 }, true) === 'revision');
  check('…and the revision session when even the short one doesn\'t fit', A.lengthFor(10, { standard: 45, short: 15 }, false) === 'revision' && A.lengthFor(45, { standard: 45, short: 15 }, true) === 'standard');
  check('states are words, never scores', JSON.stringify(Object.values(A.STATE_LABEL)) === JSON.stringify(['New', 'Practised', 'Ready to move on', 'Holding', 'Needs revision']));
  // The lesson journey (release b): a 30-minute tier for a practised lesson, three names over the lengths, and the
  // steps each length shows first.
  const len = { standard: 45, short: 15, practical: 30 };
  check('session length: the practical session when 30 minutes fit and you\'ve practised the lesson', A.lengthFor(30, len, false) === 'practical' && A.lengthFor(40, len, false) === 'practical');
  check('…never for a new lesson (no practical minutes given) or a revisit', A.lengthFor(30, { standard: 45, short: 15 }, false) === 'short' && A.lengthFor(30, len, true) === 'revision');
  check('…and the short one below 30 minutes, the standard one when it fits', A.lengthFor(20, len, false) === 'short' && A.lengthFor(45, len, false) === 'standard');
  check('Light is the revision and short sessions, Normal the practical one, Deep the standard and extended ones',
    ['revision', 'short', 'practical', 'standard', 'extended'].map(A.modeOf).join() === 'light,light,normal,deep,deep' && Object.values(A.MODE_LABEL).join() === 'Light,Normal,Deep');
  check('the steps each length shows first: revision Warm-up and Check; short Understand and Check; practical Try and Check; standard and extended all four',
    A.stepsFor('revision').join() === 'warmup,check' && A.stepsFor('short').join() === 'understand,check' && A.stepsFor('practical').join() === 'try,check'
    && A.stepsFor('standard').join() === 'warmup,understand,try,check' && A.stepsFor('extended').join() === 'warmup,understand,try,check');
  check('the steps have names, in order, Reflect last', A.JOURNEY.map(s => A.STEP_LABEL[s]).join() === 'Warm-up,Understand,Try,Check,Reflect');

  console.log('\n[W] Keep a word: the same word, picking words, keeping, revision and saved data');
  check('the same word ignores optional vowel marks (and the tatweel)', A.sameWord('بَيْتٌ', 'بيت') && A.sameWord('كِتَابٌ', 'كتاب') && A.sameWord('كتـاب', 'كتاب'));
  check('…but ة and ه, ى and ي, and the hamza forms are different words', !A.sameWord('مدرسة', 'مدرسه') && !A.sameWord('على', 'علي') && !A.sameWord('أمل', 'امل') && !A.sameWord('سأل', 'سال'));
  check('a sentence\'s words: punctuation left out, vowel marks as written, each once', JSON.stringify(A.wordsIn('أَنَا لَيْلَى. أَنَا طَالِبَةٌ، وَأَقْرَأُ؟')) === JSON.stringify(['أَنَا', 'لَيْلَى', 'طَالِبَةٌ', 'وَأَقْرَأُ']));
  check('…and English or numbers aren\'t offered', JSON.stringify(A.wordsIn('Read كِتَابٌ (book) 12 times')) === JSON.stringify(['كِتَابٌ']));
  check('a text splits into its sentences for the picker', A.sentencesIn('أَنَا لَيْلَى. أَنَا طَالِبَةٌ.\nأَسْكُنُ هُنَا').length === 3);
  const wd = { study: { reviews: [], concepts: [] }, arabic: A.emptyArabic(), cybersecurity: { cards: [] } };
  const kept = A.keepWord(wd, { ar: ' بَيْتٌ ', meaning: ' house ', note: '', from: 'asset.arabic-profile' }, '2026-10-11');
  const w = wd.arabic.words[0];
  check('keeping a word saves the Arabic as written, your meaning, where from and the day, back the next day Arabic → meaning', kept.added && w.ar === 'بَيْتٌ' && w.meaning === 'house' && w.from === 'asset.arabic-profile'
    && w.addedOn === '2026-10-11' && w.recognise.due === '2026-10-12' && w.write === null && !('note' in w) && /^kw[a-z0-9]{6,30}$/.test(w.id));
  check('the same word again (vowel marks aside) changes nothing and points at the one you have', JSON.stringify(A.keepWord(wd, { ar: 'بيت', meaning: 'home' }, '2026-10-12')) === JSON.stringify({ id: w.id, added: false }) && wd.arabic.words.length === 1 && w.meaning === 'house');
  check('no meaning, or no Arabic letter, keeps nothing', A.keepWord(wd, { ar: 'قلم', meaning: '  ' }, '2026-10-11') === null && A.keepWord(wd, { ar: 'pen', meaning: 'pen' }, '2026-10-11') === null && wd.arabic.words.length === 1);
  check('the meaning can change (never to empty), and a note can be added and taken away', A.editWord(wd, w.id, { meaning: 'a house', note: 'from the profile' }) && w.meaning === 'a house' && w.note === 'from the profile'
    && !A.editWord(wd, w.id, { meaning: '', note: '' }) && A.editWord(wd, w.id, { meaning: 'a house', note: '' }) && !('note' in w));
  check('"Also practise writing it" brings meaning → Arabic back from the next day; taking it out keeps the word', A.practiseWriting(wd, w.id, true, '2026-10-13') && w.write.due === '2026-10-14'
    && A.practiseWriting(wd, w.id, false, '2026-10-13') && w.write === null && wd.arabic.words.length === 1 && A.practiseWriting(wd, w.id, true, '2026-10-13'));
  check('in revision a kept word is two cards, recognising and writing, Arabic\'s and everything\'s', JSON.stringify(A.keptCards(wd).map(c => c.id)) === JSON.stringify([w.id + ':recognise', w.id + ':write'])
    && A.dueIds(wd, '2026-10-14', 'arabic').join() === [w.id + ':recognise', w.id + ':write'].join() && A.dueIds(wd, '2026-10-14').length === 2 && A.dueIds(wd, '2026-10-11', 'arabic').length === 0);
  check('…and a card id says which word and which way', JSON.stringify(A.cardRef(w.id + ':write')) === JSON.stringify({ kind: 'kept', wordId: w.id, side: 'write' }) && A.cardOf(wd, w.id + ':recognise').review.due === '2026-10-12');
  check('answering it reschedules that way round and keeps the answer in your history', A.rateCard(wd, w.id + ':recognise', 'بَيْتٌ → a house', '2026-10-14', { outcome: 'right', support: 'own', chosen: null }, 'good')
    && w.recognise.reps === 1 && w.recognise.due > '2026-10-14' && w.write.reps === 0 && wd.study.reviews.length === 1 && wd.study.reviews[0].conceptId === w.id + ':recognise');
  // The 8-a-day count includes the words you keep (never delayed themselves).
  const busy = { study: { reviews: [], concepts: [] }, arabic: A.emptyArabic(), cybersecurity: { cards: [] } };
  for (let i = 0; i < 8; i++) A.keepWord(busy, { ar: 'كلمة' + 'ابتثجحخد'[i], meaning: 'word ' + i }, '2026-10-11');
  const placed = A.addAutomatic(busy, ['assessment.arabic-fusha-register-check.q1'], '2026-10-12', '2026-10-11');
  check('eight words kept today fill tomorrow, so a check that joins by itself goes to the day after', busy.arabic.words.length === 8 && placed[0].due === '2026-10-13');
  check('removing a word removes it and both its cards; its answers stay in your history', A.removeWord(wd, w.id) && !wd.arabic.words.length && !A.keptCards(wd).length && wd.study.reviews.length === 1 && !A.removeWord(wd, w.id));
  // Saved data: only well-formed words, limits kept, absent stays absent.
  const wrep = { dropped: 0 }, wid = 'kwabc123def';
  const nw = A.normalizeArabic({ pathId: 'path.arabic-a1', attempts: [], words: [
    { id: wid, ar: 'بَيْتٌ', meaning: 'house', note: 'x'.repeat(400), from: 'lesson.arabic-fusha-register', addedOn: '2026-10-11', recognise: { reps: 2, interval: 4, lapses: 0, due: '2026-10-15' }, write: { reps: 0 } },
    { id: wid, ar: 'قلم', meaning: 'pen', addedOn: '2026-10-11' }, { id: 'kwbad', ar: 'قلم', meaning: 'pen', addedOn: '2026-10-11' }, { id: 'kwnoarabic1', ar: 'pen', meaning: 'pen', addedOn: '2026-10-11' },
    { id: 'kwnomeaning1', ar: 'قلم', meaning: '', addedOn: '2026-10-11' }, { id: 'kwbadfrom12', ar: 'قلم', meaning: 'pen', from: 'https://x', addedOn: '2026-10-11', recognise: 'soon' }] }, wrep).words;
  check('saved words: a duplicate, a bad id, no Arabic letter and no meaning are dropped (and counted); a bad source or schedule is left out of the word', nw.length === 2 && wrep.dropped === 4
    && nw[0].note.length === 300 && nw[0].recognise.due === '2026-10-15' && nw[0].write.due === null && !('from' in nw[1]) && nw[1].recognise.reps === 0);
  check('no words yet stays exactly that: the field is absent, as older data was', !('words' in A.normalizeArabic({ pathId: 'path.arabic-a1', attempts: [] })));

  console.log('\n[P] Practise again: what you did, coming back on its own gaps, one per round, and saved data');
  check('its gaps: Good steps 7 → 21 → 60 → 180 and stays at 180; Hard keeps the gap; Again goes back to 7', A.practiceGap(7, 'good') === 21 && A.practiceGap(21, 'good') === 60 && A.practiceGap(60, 'good') === 180
    && A.practiceGap(180, 'good') === 180 && A.practiceGap(21, 'hard') === 21 && A.practiceGap(0, 'hard') === 7 && A.practiceGap(60, 'again') === 7 && A.practiceGap(400, 'hard') === 180);
  const PL = 'lesson.arabic-fusha-register', pd = { study: { reviews: [], concepts: [] }, arabic: A.emptyArabic(), cybersecurity: { cards: [] } };
  const ps1 = A.beginSession(pd, PL, 'standard');
  check('in an open session you tick what you did of its Try it and mini challenge; nothing else is saved yet', A.tickStep(pd, ps1, 'challenge', true) && A.tickStep(pd, ps1, 'try', true) && !A.tickStep(pd, ps1, 'try', true)
    && JSON.stringify(A.ticksIn(pd, ps1, PL)) === JSON.stringify(['try', 'challenge']) && JSON.stringify(pd.arabic.practice) === JSON.stringify([{ id: PL, open: { attemptId: ps1, did: ['try', 'challenge'] } }]));
  check('unticking takes it back, and the last untick leaves nothing saved', A.tickStep(pd, ps1, 'challenge', false) && A.tickStep(pd, ps1, 'try', false) && pd.arabic.practice.length === 0 && A.tickStep(pd, ps1, 'try', true));
  check('discarding the session takes its ticks with it', (() => { const d2 = JSON.parse(JSON.stringify(pd)); A.discardTicks(d2, ps1, PL); return d2.arabic.practice.length === 0; })());
  A.finishSession(pd, ps1);
  check('a finished session can\'t be ticked', !A.tickStep(pd, ps1, 'challenge', true));
  const due1 = A.bringBackPractice(pd, ps1, PL, '2026-10-11'), p1 = A.practiceOf(pd, PL);
  check('finishing saves the day you did its Try, and the lesson joins revision a week later', due1 === '2026-10-18' && p1.tried === '2026-10-11' && !('challenged' in p1) && !('open' in p1)
    && p1.addedOn === '2026-10-11' && JSON.stringify(p1.review) === JSON.stringify({ reps: 0, interval: 7, lapses: 0, due: '2026-10-18' }));
  const pc = PL + ':practise';
  check('in revision it is one card, Arabic\'s and everything\'s, due on its day', JSON.stringify(A.practiceCards(pd).map(c => c.id)) === JSON.stringify([pc]) && JSON.stringify(A.cardRef(pc)) === JSON.stringify({ kind: 'practice', lessonId: PL })
    && A.cardOf(pd, pc).review.due === '2026-10-18' && A.dueIds(pd, '2026-10-18', 'arabic').includes(pc) && A.dueIds(pd, '2026-10-18').includes(pc) && !A.dueIds(pd, '2026-10-17', 'arabic').includes(pc));
  const ps2 = A.beginSession(pd, PL, 'practical'); A.tickStep(pd, ps2, 'challenge', true); A.finishSession(pd, ps2);
  check('doing it again in a later session saves the day, and its place in revision stays as it was', A.bringBackPractice(pd, ps2, PL, '2026-10-14') === null && p1.challenged === '2026-10-14' && p1.review.due === '2026-10-18');
  const ps3 = A.beginSession(pd, PL, 'short'); A.finishSession(pd, ps3);
  check('a session with nothing ticked changes nothing', A.bringBackPractice(pd, ps3, PL, '2026-10-15') === null && p1.tried === '2026-10-11' && p1.challenged === '2026-10-14');
  check('answering it reschedules it on its own gaps and keeps the answer in your history', A.rateCard(pd, pc, 'Fusha practise again', '2026-10-18', { outcome: 'right', support: 'own', chosen: null }, 'good')
    && p1.review.interval === 21 && p1.review.due === '2026-11-08' && p1.review.reps === 1 && pd.study.reviews.at(-1).conceptId === pc && pd.study.reviews.at(-1).gap === 21);
  check('…and Again brings it back in a week', A.rateCard(pd, pc, 'Fusha practise again', '2026-11-08', { outcome: 'wrong', support: 'own', chosen: null }, 'again') && p1.review.interval === 7 && p1.review.due === '2026-11-15' && p1.review.lapses === 1);
  check('"Don\'t bring it back" takes it out of revision; the days you did it stay', A.removeCards(pd, [pc]) && !A.cardOf(pd, pc) && !('review' in p1) && p1.tried === '2026-10-11' && !A.removeCards(pd, [pc]));
  const ps4 = A.beginSession(pd, PL, 'standard'); A.tickStep(pd, ps4, 'try', true); A.finishSession(pd, ps4);
  check('…and doing its Try in a later session brings it back, a week on', A.bringBackPractice(pd, ps4, PL, '2026-11-20') === '2026-11-27' && A.cardOf(pd, pc).review.reps === 0);
  // Ticks left by a session that's gone (discarded on an older MyDay, say) don't count for another session.
  const stale = { study: { reviews: [], concepts: [] }, arabic: { ...A.emptyArabic(), practice: [{ id: PL, open: { attemptId: 'aaGone', did: ['try'] } }] }, cybersecurity: { cards: [] } };
  const ps5 = A.beginSession(stale, PL, 'standard'); A.finishSession(stale, ps5);
  check('ticks from another session don\'t count, and finishing clears them', A.ticksIn(stale, ps5, PL).length === 0 && A.bringBackPractice(stale, ps5, PL, '2026-10-11') === null && stale.arabic.practice.length === 0);
  // A round takes at most one lesson to practise again; the others wait.
  const many = { study: { reviews: [], concepts: [] }, arabic: { ...A.emptyArabic(), practice: ['fusha-register', 'origin-location', 'greetings-address'].map(x => ({ id: 'lesson.arabic-' + x, tried: '2026-09-20', addedOn: '2026-09-20', review: { reps: 0, interval: 7, lapses: 0, due: '2026-09-27' } })) }, cybersecurity: { cards: [] } };
  A.addCards(many, ['lexeme.arabic-seed-001:recognise', 'lexeme.arabic-seed-002:recognise', 'lexeme.arabic-seed-003:recognise', 'lexeme.arabic-seed-004:recognise', 'lexeme.arabic-seed-005:recognise'], '2026-10-01');
  const round = A.roundIds(many, '2026-10-10', 'arabic', 5);
  // (the three lessons are the oldest due, so without the limit they'd fill the round)
  check('a round of 5 has at most one lesson to practise again, the rest questions', round.length === 5 && round[0].endsWith(':practise') && round.filter(id => id.endsWith(':practise')).length === 1 && A.dueIds(many, '2026-10-10', 'arabic').length === 8);
  check('…and with only lessons left, a round is just one of them', A.roundIds({ ...many, arabic: { ...many.arabic, cards: [] } }, '2026-10-10', 'arabic', 5).length === 1);
  // The 8-a-day count: a lesson joining revision by itself goes to the next day with room.
  const full = { study: { reviews: [], concepts: [] }, arabic: A.emptyArabic(), cybersecurity: { cards: [] } };
  A.addAutomatic(full, Array.from({ length: 8 }, (_, i) => `assessment.arabic-fusha-register-check.q${i + 1}`), '2026-10-18', '2026-10-11');
  const ps6 = A.beginSession(full, PL, 'standard'); A.tickStep(full, ps6, 'try', true); A.finishSession(full, ps6);
  check('with 8 cards already first back a week on, the lesson comes back the day after (it counts in the 8 a day)', A.bringBackPractice(full, ps6, PL, '2026-10-11') === '2026-10-19');
  // Saved data: only well-formed records, absent stays absent.
  const prep = { dropped: 0 };
  const np = A.normalizeArabic({ pathId: 'path.arabic-a1', attempts: [], practice: [
    { id: PL, tried: '2026-10-11', challenged: 'soon', open: { attemptId: 'aa1', did: ['try', 'dance', 'try'] }, addedOn: '2026-10-11', review: { reps: 1, interval: 21, lapses: 0, due: '2026-11-01' } },
    { id: PL, tried: '2026-10-12' }, { id: 'lesson.learning-evidence', tried: '2026-10-11' }, { id: 'lesson.arabic-origin-location' },
    { id: 'lesson.arabic-greetings-address', review: { reps: 0, interval: 7, lapses: 0, due: '2026-10-18' }, open: { attemptId: 'bad id!', did: ['try'] } }] }, prep).practice;
  check('saved practice: a duplicate, another course\'s lesson, an empty record and a schedule without its day are dropped (and counted); a bad day or step is left out', np.length === 1 && prep.dropped === 4
    && !('challenged' in np[0]) && JSON.stringify(np[0].open) === JSON.stringify({ attemptId: 'aa1', did: ['try'] }) && np[0].review.due === '2026-11-01');
  check('no practice yet stays exactly that: the field is absent, as older data was', !('practice' in A.normalizeArabic({ pathId: 'path.arabic-a1', attempts: [] })));
  // Ticks a session left behind: finished where they hadn't reached (another device, an older MyDay), or gone.
  const left = { study: { reviews: [], concepts: [] }, arabic: { ...A.emptyArabic(), practice: [{ id: PL, open: { attemptId: 'aaElsewhere', did: ['challenge'] } }] }, cybersecurity: { cards: [] } };
  left.arabic.attempts.push({ id: 'aaElsewhere', lessonId: PL, curriculumVersion: '1.1.2', variant: 'standard', startedAt: '2026-10-09T09:00:00', finishedAt: null, help: 'independent', practised: [], answers: {}, revealed: [], revisit: '' });
  check('ticks of a session still open elsewhere wait for it', A.settleTicks(left, PL, null, '2026-10-11') === null && A.practiceOf(left, PL).open.attemptId === 'aaElsewhere');
  left.arabic.attempts[0].finishedAt = '2026-10-09T10:00:00';
  const ps7 = A.beginSession(left, PL, 'short');
  check('ticks of a session finished elsewhere count, dated the day it finished, and bring the lesson back as usual', A.settleTicks(left, PL, ps7, '2026-10-11') === '2026-10-18'
    && A.practiceOf(left, PL).challenged === '2026-10-09' && !('open' in A.practiceOf(left, PL)) && A.practiceOf(left, PL).review.due === '2026-10-18');
  const gone = { study: { reviews: [], concepts: [] }, arabic: { ...A.emptyArabic(), practice: [{ id: PL, tried: '2026-10-01', open: { attemptId: 'aaDiscarded', did: ['try'] } }] }, cybersecurity: { cards: [] } };
  const ps8 = A.beginSession(gone, PL, 'short'); A.finishSession(gone, ps8);
  check('…and ticks of a session that\'s gone are cleared, the days you did it before kept', A.bringBackPractice(gone, ps8, PL, '2026-10-11') === null && JSON.stringify(A.practiceOf(gone, PL)) === JSON.stringify({ id: PL, tried: '2026-10-01' }));
  // Practise again's answers never change a lesson's state, which comes from its checks.
  const st8 = { study: { reviews: [], concepts: [] }, arabic: { ...A.emptyArabic(), practice: [{ id: PL, tried: '2026-10-01', addedOn: '2026-10-01', review: { reps: 0, interval: 7, lapses: 0, due: '2026-10-08' } }] }, cybersecurity: { cards: [] } };
  const regChecks = A.checkIds(PL, 3);
  A.markReady(st8, PL, regChecks, '2026-10-01');
  A.rateCard(st8, pc, 'practise', '2026-10-08', { outcome: 'wrong', support: 'own', chosen: null }, 'again');
  check('a Practise again answer that wasn\'t right leaves the lesson Ready (its state comes from its checks)', A.stateOf(st8, PL, regChecks) === 'ready' && st8.study.reviews.length === 1);
  check('a Practise again card taken out meanwhile can\'t be answered', A.removeCards(st8, [pc]) && !A.rateCard(st8, pc, 'practise', '2026-10-08', { outcome: 'right', support: 'own', chosen: null }, 'good'));
  check('only a lesson id with ":practise" is a lesson to practise again', A.cardRef('assessment.arabic-fusha-register-check.q1').kind === 'check' && A.cardRef('lexeme.arabic-seed-001:recognise').kind === 'word'
    && A.cardRef('kwabc123def:write').kind === 'kept' && A.cardRef('lesson.learning-evidence:practise').kind !== 'practice' && A.cardRef(pc).kind === 'practice');
  // Lessons to practise again count in the 8 a day for checks that join by themselves, too.
  const lots = { study: { reviews: [], concepts: [] }, arabic: { ...A.emptyArabic(), practice: Array.from({ length: 8 }, (_, i) => ({ id: 'lesson.arabic-p' + i, tried: '2026-10-11', addedOn: '2026-10-11', review: { reps: 0, interval: 7, lapses: 0, due: '2026-10-18' } })) }, cybersecurity: { cards: [] } };
  check('eight lessons first back on a day fill it, so a check that joins by itself goes to the next day', A.addAutomatic(lots, ['assessment.arabic-fusha-register-check.q1'], '2026-10-18', '2026-10-11')[0].due === '2026-10-19');
  // Everything's round: concepts never revised come after what's due; still one lesson to practise again.
  const mixed = JSON.parse(JSON.stringify(many));
  mixed.study.concepts = [{ id: 'cpNever', kind: 'written', title: 'Never revised', prompt: 'What is it?', answer: 'It', explanation: '', choices: [], correct: null, hint: '', review: { reps: 0, interval: 0, lapses: 0, due: null } }];
  const allRound = A.roundIds(mixed, '2026-10-10', 'all', 5);
  check('in the all-subjects round too: one lesson to practise again, and a concept never revised waits behind what\'s due', allRound.filter(id => id.endsWith(':practise')).length === 1 && !allRound.includes('cpNever')
    && A.roundIds(mixed, '2026-10-10', 'all', 9).at(-1) === 'cpNever');
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
