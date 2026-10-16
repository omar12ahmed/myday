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
  fs.writeFileSync(path.join(tmp, 'entry.ts'), [...['types', 'normalize', 'sessions', 'cards'].map(f => path.join(ROOT, 'app/src/data/arabic', f)), path.join(ROOT, 'app/src/data/study/queue'),
    path.join(ROOT, 'app/src/data/study/revision')].map(f => `export * from ${JSON.stringify(f)};`).join('\n'));
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
  const lessons = ['lesson.a', 'lesson.b'];
  check('a module with a session open is being explored', A.placeOf(d, ['lesson.arabic-origin-location'], ['lesson.arabic-origin-location']) === 'exploring' && A.placeOf(d, lessons, lessons) === 'unexplored');
  check('the next step picks up an open session first', JSON.stringify(A.nextStep(d, ['lesson.x', 'lesson.arabic-origin-location'])) === '{"lessonId":"lesson.arabic-origin-location","resume":true}');
  A.finishSession(d, id);
  check('a finished session can no longer be changed', d.arabic.attempts[0].finishedAt && A.changeSession(d, id, s => { s.revisit = 'late'; }) === false && d.arabic.attempts[0].revisit === '');
  check('finishing every core lesson of a module makes it visited', A.placeOf(d, ['lesson.arabic-origin-location', 'lesson.optional'], ['lesson.arabic-origin-location']) === 'visited');
  check('then the next step is the first lesson not finished yet', JSON.stringify(A.nextStep(d, ['lesson.arabic-origin-location', 'lesson.y'])) === '{"lessonId":"lesson.y","resume":false}');
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
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
