// Arabic Fuṣḥā as prepared for the app (app/scripts/prepare-arabic.mjs): the split files are complete and
// consistent, answers stay out of the course files, sizes stay bounded, and building leaves the supplied
// package untouched. No browser.
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
  fs.writeFileSync(path.join(tmp, 'entry.ts'), ['types', 'normalize', 'sessions'].map(f => `export * from ${JSON.stringify(path.join(ROOT, 'app/src/data/arabic', f))};`).join('\n'));
  const A = await import(pathToFileURL(await bundle(path.join(tmp, 'entry.ts'), path.join(tmp, 'out'))).href);
  check('the version the screens record matches the package', A.ARABIC_VERSION === source.curriculum_version);
  const good = { id: 'aa1', lessonId: 'lesson.arabic-origin-location', curriculumVersion: '1.1.0', variant: 'short', startedAt: '2026-10-11T09:00:00.000Z', finishedAt: null, help: 'hint', practised: ['reading', 'reading', 'dancing'], answers: { 'assessment.arabic-origin-location-check.q1': 'من', 'nonsense.key': 'x' }, revealed: ['assessment.arabic-origin-location-check.q1', 'bad'], revisit: 'x'.repeat(2000), score: 95 };
  const report = { dropped: 0 };
  const data = A.normalizeArabic({ pathId: 'path.arabic-a1', attempts: [good, { ...good }, { id: 'bad id!', lessonId: 'lesson.arabic-x' }, { ...good, id: 'aa2', lessonId: 'lesson.cyber-thing' }, { ...good, id: 'aa3', startedAt: 'yesterday' }] }, report);
  const a = data.attempts[0];
  check('a valid session is kept, a duplicate and malformed ones are dropped (and counted)', data.attempts.length === 1 && report.dropped === 4);
  check('only known practice kinds, question ids and fields survive; nothing like a score is kept', JSON.stringify(a.practised) === '["reading"]' && Object.keys(a.answers).join() === 'assessment.arabic-origin-location-check.q1' && a.revealed.join() === 'assessment.arabic-origin-location-check.q1' && !('score' in a) && a.revisit.length === 1000);
  check('an unknown path falls back to the core course', A.normalizeArabic({ pathId: 'path.core' }).pathId === A.ARABIC_CORE_PATH && data.pathId === 'path.arabic-a1');
  check('no Arabic section yet means none of your sessions, not an error', A.normalizeArabic(undefined).attempts.length === 0);
  const later = A.normalizeArabic({ pathId: 'path.arabic-a1', attempts: [good], cards: [{ id: 'lexeme.arabic-seed-001:recognise' }], laterField: { x: 1 } });
  check('fields a newer MyDay adds to the section are kept as they are (going back a version never loses them)', JSON.stringify(later.cards) === '[{"id":"lexeme.arabic-seed-001:recognise"}]' && later.laterField.x === 1 && later.attempts.length === 1 && !('score' in later.attempts[0]));
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
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
