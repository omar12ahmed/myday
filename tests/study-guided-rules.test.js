// Guided Study: resetting learner progress must not erase curriculum content, authored
// concepts or other MyDay sections. The lesson ordering stays source-driven.
const fs = require('fs'), os = require('os'), path = require('path'), { pathToFileURL } = require('url');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
let passed = 0, failed = 0;
function check(label, ok) {
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + ' ' + label);
  if (ok) passed++; else failed++;
}
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-guided-'));
  try {
    const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
    fs.writeFileSync(path.join(dir, 'entry.ts'), [
      'export { resetLearningProgress } from ' + JSON.stringify(path.join(ROOT, 'app/src/study/resetProgress')) + ';',
      'export { stIndex, focusCourse, nextTaskIn } from ' + JSON.stringify(path.join(ROOT, 'app/src/data/study/roadmap')) + ';',
    ].join('\n'));
    const rule = await import(pathToFileURL(await bundle(path.join(dir, 'entry.ts'), path.join(dir, 'out'))).href);
    const task = (id, done) => ({ id, title: id, minutes: 20, done, doneOn: done ? '2026-10-01' : null, kind: 'learn', url: '', note: '' });
    const course = (id, tasks) => ({ id, title: id, url: '', minutes: 30, listId: null, archived: false,
      modules: [{ id: 'm-' + id, title: id, sections: [{ id: 's-' + id, title: 'Lessons', tasks }] }] });
    const concept = { id: 'c', title: 'DNS', prompt: 'DNS?', answer: 'A', review: { reps: 5, interval: 10, lapses: 1, due: '2026-11-01' } };
    const state = {
      study: { stages: [{ id: 'foundations', title: 'Foundations', courses: [course('first', [task('one', true)]), course('second', [task('two', false)])] }],
        focusCourseId: 'first', concepts: [concept], sessions: [{ id: 'session' }], activeId: 'session', reviews: [{ id: 'review' }],
        settings: { vault: 'Learning', showClock: true } },
      arabic: { pathId: 'arabic', attempts: [{ id: 'a' }], cards: [{ id: 'ar-card', review: { reps: 2, interval: 4, lapses: 0, due: '2026-10-30' } }] },
      cybersecurity: { pathId: 'cyber', attempts: [{ id: 'c' }], cards: [{ id: 'cy-card', review: { reps: 1, interval: 2, lapses: 0, due: '2026-10-27' } }] },
      otherSection: { preserve: true },
    };
    const ix = rule.stIndex(state.study);
    check('Completed pinned course does not block unfinished work', rule.focusCourse(state.study, ix).id === 'second');
    check('Next task follows preserved outline order', rule.nextTaskIn(ix, rule.focusCourse(state.study, ix)).id === 'two');
    rule.resetLearningProgress(state);
    const all = state.study.stages.flatMap(s => s.courses.flatMap(c => c.modules.flatMap(m => m.sections.flatMap(sc => sc.tasks))));
    check('Every task completion mark is reset', all.every(t => !t.done && t.doneOn === null));
    check('Study session and revision records cleared', !state.study.sessions.length && !state.study.reviews.length && state.study.activeId === null);
    check('Pinned focus cleared', state.study.focusCourseId === null);
    check('Arabic and Cybersecurity attempt records cleared', !state.arabic.attempts.length && !state.cybersecurity.attempts.length);
    check('Concepts and revision cards preserved but due schedules reset', state.study.concepts[0].title === 'DNS'
      && state.study.concepts[0].review.reps === 0 && state.arabic.cards[0].review.due === null && state.cybersecurity.cards[0].review.due === null);
    check('Study content and paths stay', state.study.stages[0].courses[0].modules[0].sections[0].tasks[0].title === 'one'
      && state.arabic.pathId === 'arabic' && state.cybersecurity.pathId === 'cyber');
    check('Other MyDay data stays', state.otherSection.preserve && state.study.settings.vault === 'Learning');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
