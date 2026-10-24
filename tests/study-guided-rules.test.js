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
      'export { freshState } from ' + JSON.stringify(path.join(ROOT, 'app/src/data/normalize')) + ';',
      'export { learningOptions, learningGlance } from ' + JSON.stringify(path.join(ROOT, 'app/src/study/nextLearning')) + ';',
      'export { optionAction } from ' + JSON.stringify(path.join(ROOT, 'app/src/study/courseOption')) + ';',
      'export { chooseFocus, courseFocus, focusChoices, focusValue } from ' + JSON.stringify(path.join(ROOT, 'app/src/data/study/yourFocus')) + ';',
      'export { nextLesson, importPath, beginAttempt } from ' + JSON.stringify(path.join(ROOT, 'app/src/study/cybersecurity/learning')) + ';',
      'export * as cyberCatalogue from ' + JSON.stringify(path.join(ROOT, 'app/src/study/cybersecurity/catalogue')) + ';',
      'export { CYBER_VERSION, curriculumTaskId } from ' + JSON.stringify(path.join(ROOT, 'app/src/data/cybersecurity/types')) + ';',
      'export * as arabicCatalogue from ' + JSON.stringify(path.join(ROOT, 'app/src/study/arabic/catalogue')) + ';',
      'export { beginSession, finishSession } from ' + JSON.stringify(path.join(ROOT, 'app/src/data/arabic/sessions')) + ';',
      'export { markReady, flagRevisit } from ' + JSON.stringify(path.join(ROOT, 'app/src/data/arabic/lessons')) + ';',
      'export { arabicPlan, arabicState, checksOf, journeyFor, lengthOn, warmUpFrom } from ' + JSON.stringify(path.join(ROOT, 'app/src/study/arabic/plan')) + ';',
      'export { todayKey } from ' + JSON.stringify(path.join(ROOT, 'app/src/data/dates')) + ';',
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
      arabic: { pathId: 'arabic', attempts: [{ id: 'a' }], cards: [{ id: 'ar-card', review: { reps: 2, interval: 4, lapses: 0, due: '2026-10-30' } }], lessons: [{ id: 'lesson.arabic-fusha-register', readyOn: '2026-10-20' }] },
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
    check('Arabic and Cybersecurity attempt records cleared, and your place on each Arabic lesson', !state.arabic.attempts.length && !state.cybersecurity.attempts.length && Array.isArray(state.arabic.lessons) && !state.arabic.lessons.length);
    check('Concepts and revision cards preserved but due schedules reset', state.study.concepts[0].title === 'DNS'
      && state.study.concepts[0].review.reps === 0 && state.arabic.cards[0].review.due === null && state.cybersecurity.cards[0].review.due === null);
    check('Study content and paths stay', state.study.stages[0].courses[0].modules[0].sections[0].tasks[0].title === 'one'
      && state.arabic.pathId === 'arabic' && state.cybersecurity.pathId === 'cyber');
    check('Other MyDay data stays', state.otherSection.preserve && state.study.settings.vault === 'Learning');

    console.log('\n[Recommendations] Explicit choices and unfinished general courses');
    const fresh = () => { const d = rule.freshState(); d.study.stages = []; return d; };
    const clone = value => JSON.parse(JSON.stringify(value));
    const option = (d, subject) => rule.learningOptions(d).find(o => o.subject === subject);
    const arHref = id => '#study/arabic/' + encodeURIComponent(id);
    const cyHref = id => '#study/cybersecurity/' + encodeURIComponent(id);
    const blank = fresh(), blankBefore = JSON.stringify(blank), initial = rule.learningOptions(blank);
    check('A new learner is offered Cybersecurity first and Arabic second', initial.map(o => o.subject).join() === 'cybersecurity,arabic');
    check('A new Cybersecurity recommendation opens the first real required lesson', initial[0].href === cyHref('lesson.learning-evidence') && !initial[0].resume && !initial[0].allComplete);
    check('A new Arabic recommendation opens the first real required lesson', initial[1].href === arHref('lesson.arabic-fusha-register') && !initial[1].resume && !initial[1].allComplete);
    check('…naming its lesson and a mode for its suggested length (which one depends on the time of day)', initial[1].lessonId === 'lesson.arabic-fusha-register' && ['Light', 'Normal', 'Deep'].includes(initial[1].mode));
    check('Reading initial recommendations leaves saved data byte-for-byte unchanged', JSON.stringify(blank) === blankBefore);
    const chosen = fresh();
    chosen.study.settings.primarySubject = 'arabic';
    rule.beginAttempt(chosen, 'exercise.authorised-scope');
    const chosenBefore = JSON.stringify(chosen), chosenOptions = rule.learningOptions(chosen);
    check('An explicit Arabic preference stays first when Cybersecurity has a saved draft', chosenOptions[0].subject === 'arabic' && chosenOptions[1].resume);
    check('Reading preferred recommendations does not create a cursor or alter an attempt', JSON.stringify(chosen) === chosenBefore);

    const general = fresh();
    const archived = { ...course('archived', [task('archived-task', false)]), archived: true };
    const completed = course('completed', [task('completed-task', true)]);
    const imported = course('cyber:1:module.learning-lab', [task('cyber:1:lesson.learning-evidence', false)]);
    const empty = course('empty', []);
    const first = course('first-live', [task('already-done', true), { ...task('first:unfinished task', false), title: 'Read a Spanish dialogue', minutes: 17 }]);
    const pinned = course('pinned-live', [{ ...task('pinned-task', false), title: 'Write a Spanish paragraph' }]);
    general.study.stages = [{ id: 's1', title: 'First stage', courses: [archived, completed, imported, empty, first] },
      { id: 's2', title: 'Second stage', courses: [pinned] }];
    general.study.settings.primarySubject = 'roadmap';
    general.study.focusCourseId = 'pinned-live';
    const pinnedBefore = JSON.stringify(general), pinnedOption = option(general, 'roadmap');
    check('An explicit general-course preference places that subject first', rule.learningOptions(general)[0].subject === 'roadmap');
    check('A pinned unfinished general course wins over earlier stages', pinnedOption.href === '#study/task/pinned-task' && pinnedOption.detail === 'pinned-live');
    const sessionOption = rule.learningOptions(general, 'first-live').find(o => o.subject === 'roadmap');
    check('A finished session recommends its own unfinished course ahead of a different pinned course', sessionOption.href === '#study/task/first%3Aunfinished%20task' && sessionOption.detail === 'first-live');
    const fallbackOption = rule.learningOptions(general, 'completed').find(o => o.subject === 'roadmap');
    check('An exhausted session course falls back to the pinned available work with its actual course name', fallbackOption.href === '#study/task/pinned-task' && fallbackOption.detail === 'pinned-live');
    check('General-course recommendations leave the outline and pin byte-for-byte unchanged', JSON.stringify(general) === pinnedBefore);
    for (const focus of ['archived', 'completed', 'cyber:1:module.learning-lab', 'missing-course', null]) {
      general.study.focusCourseId = focus;
      const before = JSON.stringify(general), next = option(general, 'roadmap');
      check('A ' + (focus ?? 'missing') + ' pin falls back to the first unfinished general task', next?.href === '#study/task/first%3Aunfinished%20task' && next?.title === 'Read a Spanish dialogue' && next?.minutes === 17);
      check('Falling back from the ' + (focus ?? 'missing') + ' pin does not rewrite saved data', JSON.stringify(general) === before);
    }
    // One focus (Today and Study home alike): a course with no tasks yet stays your focus while it's chosen, for a session.
    general.study.focusCourseId = 'empty';
    const emptyBefore = JSON.stringify(general), own = option(general, 'roadmap');
    check('Your focus on a course with no tasks yet stays first, offering a session there (Study home has its Start)', rule.learningOptions(general)[0]?.courseId === 'empty' && (own?.courseId === 'empty'
      && own?.title === 'empty' && own?.href === '#study' && own?.taskId === undefined && own?.minutes === 30 && own?.detail === 'No tasks added yet — a session still counts'));
    check('…and reading it leaves saved data unchanged', JSON.stringify(general) === emptyBefore);
    general.study.settings.primarySubject = 'arabic';
    check('With another subject as your focus, an empty pinned course isn\'t offered: the first unfinished task is', option(general, 'roadmap')?.href === '#study/task/first%3Aunfinished%20task');
    general.study.settings.primarySubject = 'roadmap'; general.study.focusCourseId = null;
    general.study.stages[0].courses = [archived, completed, imported, empty];
    general.study.stages[1].courses = [];
    check('Archived, completed, empty and imported Cybersecurity courses do not create a general-course recommendation', !option(general, 'roadmap'));
    check('An unavailable preferred general course leaves the two curriculum options available', rule.learningOptions(general).map(o => o.subject).join() === 'cybersecurity,arabic');

    console.log('\n[Cybersecurity] Whole-lesson completion and versioned saved work');
    const cyber = fresh();
    rule.importPath(cyber, 'path.appsec');
    const cyberTask = id => rule.stIndex(cyber.study).task.get(rule.curriculumTaskId(id)).node;
    const markCyber = (id, done) => { const t = cyberTask(id); t.done = done; t.doneOn = done ? '2026-10-01' : null; };
    check('The selected real Cybersecurity path starts with its first unfinished lesson', rule.nextLesson(cyber).lesson.id === 'lesson.learning-evidence' && !rule.nextLesson(cyber).allComplete);
    const practicalId = rule.beginAttempt(cyber, 'exercise.learning-evidence');
    const practical = cyber.cybersecurity.attempts.find(a => a.id === practicalId);
    Object.assign(practical, { submittedAt: '2026-10-01T11:00:00Z', evidence: 'Observed a result.', criticalPassed: true, rubricScores: [100, 100, 100, 100] });
    check('Submitting a successful practical alone does not finish its lesson', rule.nextLesson(cyber).lesson.id === 'lesson.learning-evidence' && !cyberTask('lesson.learning-evidence').done);
    practical.criticalPassed = false;
    check('A submitted failed practical cannot skip the unfinished lesson', rule.nextLesson(cyber).lesson.id === 'lesson.learning-evidence');
    practical.curriculumVersion = '0.9.0';
    check('An older submitted practical cannot skip the unfinished lesson', rule.nextLesson(cyber).lesson.id === 'lesson.learning-evidence');
    markCyber('lesson.learning-evidence', true);
    check('An explicitly completed roadmap lesson advances to the next required lesson', rule.nextLesson(cyber).lesson.id === 'lesson.authorised-scope');
    markCyber('lesson.learning-evidence', false);
    check('Reopening a roadmap lesson makes it the earliest unfinished recommendation again', rule.nextLesson(cyber).lesson.id === 'lesson.learning-evidence');
    cyber.cybersecurity.attempts = [];
    const olderId = rule.beginAttempt(cyber, 'exercise.technical-notes');
    cyber.cybersecurity.attempts.find(a => a.id === olderId).curriculumVersion = '0.9.0';
    check('An open attempt from an earlier curriculum does not override the next required lesson', rule.nextLesson(cyber).lesson.id === 'lesson.learning-evidence' && rule.nextLesson(cyber).code !== 'user_choice');
    const oldRubricId = rule.beginAttempt(cyber, 'exercise.technical-notes');
    cyber.cybersecurity.attempts.find(a => a.id === oldRubricId).rubricVersion = '0.9.0';
    check('An open attempt using an obsolete activity rubric does not override required lessons', rule.nextLesson(cyber).lesson.id === 'lesson.learning-evidence' && rule.nextLesson(cyber).code !== 'user_choice');
    cyber.cybersecurity.attempts.push({ ...clone(practical), id: 'unknown-activity', activityId: 'exercise.missing-example', curriculumVersion: rule.CYBER_VERSION, rubricVersion: rule.CYBER_VERSION, submittedAt: null });
    check('An unknown saved activity does not create a resumable lesson', rule.nextLesson(cyber).lesson.id === 'lesson.learning-evidence' && rule.nextLesson(cyber).code !== 'user_choice');
    const outsideId = rule.beginAttempt(cyber, 'exercise.exploit-reliability');
    check('A current open attempt outside the selected path does not override its required lessons', !!outsideId && rule.nextLesson(cyber).lesson.id === 'lesson.learning-evidence');
    const resumeId = rule.beginAttempt(cyber, 'assessment.technical-notes-check');
    const resumeBefore = JSON.stringify(cyber), resuming = rule.nextLesson(cyber);
    check('A current knowledge-check draft resumes its lesson before unfinished earlier work', resuming.lesson.id === 'lesson.technical-notes' && resuming.code === 'user_choice' && !resuming.allComplete);
    check('Finding a Cybersecurity draft does not mutate completion, attempts or paths', JSON.stringify(cyber) === resumeBefore);
    cyber.cybersecurity.attempts.find(a => a.id === resumeId).submittedAt = '2026-10-01T12:00:00Z';
    check('A submitted knowledge check does not remain a resumable draft or finish the lesson', rule.nextLesson(cyber).lesson.id === 'lesson.learning-evidence' && rule.nextLesson(cyber).code !== 'user_choice');
    cyber.cybersecurity.attempts = [];
    const practiceId = rule.beginAttempt(cyber, 'interactive.network');
    const practice = cyber.cybersecurity.attempts.find(a => a.id === practiceId);
    check('An independently versioned current practice draft resumes a real related lesson on the path', practice.rubricVersion === rule.cyberCatalogue.activities.get('interactive.network').version && practice.rubricVersion !== rule.CYBER_VERSION && rule.nextLesson(cyber).lesson.id === 'lesson.network-models' && rule.nextLesson(cyber).code === 'user_choice');
    practice.rubricVersion = 'practice-0.0.0';
    check('An obsolete practice-overlay draft does not resume under the current activity rubric', rule.nextLesson(cyber).lesson.id === 'lesson.learning-evidence' && rule.nextLesson(cyber).code !== 'user_choice');
    const replacementPracticeId = rule.beginAttempt(cyber, 'interactive.network');
    check('A fresh practice-overlay draft resumes while its older draft stays preserved', replacementPracticeId !== practiceId && cyber.cybersecurity.attempts.includes(practice) && rule.nextLesson(cyber).lesson.id === 'lesson.network-models' && rule.nextLesson(cyber).code === 'user_choice');
    cyber.cybersecurity.attempts = [];
    const appsecPath = rule.cyberCatalogue.paths.get('path.appsec');
    const pathLessons = appsecPath.required_module_ids.flatMap(id => rule.cyberCatalogue.modules.get(id).lesson_ids).map(id => rule.cyberCatalogue.lessons.get(id));
    const requiredCyber = pathLessons.filter(l => !l.optional), optionalCyber = rule.cyberCatalogue.lessons.get('lesson.ai-application-security');
    check('The real selected path contains required lessons and the optional AI-security extension', requiredCyber.length > 0 && pathLessons.includes(optionalCyber) && optionalCyber.optional);
    requiredCyber.forEach(l => markCyber(l.id, true));
    const exhaustedBefore = JSON.stringify(cyber), exhausted = rule.nextLesson(cyber);
    check('All required Cybersecurity lessons can be complete while an optional extension remains unfinished', exhausted.allComplete && !cyberTask(optionalCyber.id).done);
    check('An exhausted Cybersecurity path offers its first required lesson to revisit', exhausted.lesson.id === 'lesson.learning-evidence' && exhausted.code === 'ready_next_lesson');
    check('The combined recommendations show the selected Cybersecurity path as complete', option(cyber, 'cybersecurity').allComplete && !option(cyber, 'cybersecurity').resume);
    check('Reading an exhausted path does not write a cursor or auto-complete optional work', JSON.stringify(cyber) === exhaustedBefore);
    rule.beginAttempt(cyber, optionalCyber.practical_task_id);
    check('A current optional-extension draft on the selected path can still be resumed', rule.nextLesson(cyber).lesson.id === optionalCyber.id && rule.nextLesson(cyber).code === 'user_choice');
    check('Resuming optional work keeps the completed required-path status', rule.nextLesson(cyber).allComplete && option(cyber, 'cybersecurity').allComplete && option(cyber, 'cybersecurity').resume);

    console.log('\n[Arabic] Selected required paths and open sessions');
    const arabic = fresh();
    arabic.arabic.pathId = 'path.arabic-start';
    const arPath = rule.arabicCatalogue.paths.get(arabic.arabic.pathId);
    const requiredArabic = rule.arabicCatalogue.moduleList.filter(m => arPath.required_module_ids.includes(m.id)).sort((a, b) => a.sequence - b.sequence)
      .flatMap(m => m.lesson_ids.filter(id => !rule.arabicCatalogue.lessonIndex[id].optional));
    check('The real Arabic starter path begins with the register lesson', requiredArabic[0] === 'lesson.arabic-fusha-register' && option(arabic, 'arabic').href === arHref('lesson.arabic-fusha-register'));
    const finishArabic = (d, id) => { const sid = rule.beginSession(d, id, 'standard'); rule.finishSession(d, sid); };
    // Adaptive Study: a finished session is practice; the lesson stays the next step until you mark it ready.
    const readyArabic = (d, id) => { finishArabic(d, id); rule.markReady(d, id, rule.checksOf(id), rule.todayKey()); };
    finishArabic(arabic, requiredArabic[0]);
    check('A finished Arabic session alone is practice: the recommendation stays on that lesson, labelled Practised', rule.arabicState(arabic, requiredArabic[0]) === 'practised'
      && option(arabic, 'arabic').href === arHref(requiredArabic[0]) && /Practised/.test(option(arabic, 'arabic').detail));
    rule.markReady(arabic, requiredArabic[0], rule.checksOf(requiredArabic[0]), rule.todayKey());
    check('Marking it ready to move on advances the recommendation to the earliest lesson not ready yet', rule.arabicState(arabic, requiredArabic[0]) === 'ready' && option(arabic, 'arabic').href === arHref('lesson.arabic-goal-baseline'));
    const openArabic = rule.beginSession(arabic, 'lesson.arabic-vowel-decoding', 'short');
    const openArabicBefore = JSON.stringify(arabic), arResuming = option(arabic, 'arabic');
    check('An open Arabic session on the selected required path takes priority over earlier new lessons', arResuming.href === arHref('lesson.arabic-vowel-decoding') && arResuming.resume && !arResuming.allComplete);
    check('Arabic next-step and combined recommendations agree about resuming the open session', rule.arabicPlan(arabic).step.lessonId === 'lesson.arabic-vowel-decoding' && rule.arabicPlan(arabic).step.kind === 'resume');
    check('Reading Arabic recommendations does not create a cursor or change any saved session', JSON.stringify(arabic) === openArabicBefore);
    rule.finishSession(arabic, openArabic);
    rule.beginSession(arabic, 'lesson.arabic-nominal-sentences', 'standard');
    check('An Arabic session beyond the selected path does not displace required starter lessons', option(arabic, 'arabic').href === arHref('lesson.arabic-goal-baseline') && !option(arabic, 'arabic').resume);
    requiredArabic.forEach(id => finishArabic(arabic, id));
    check('Finished sessions on every required lesson are not yet a complete path', !option(arabic, 'arabic').allComplete);
    requiredArabic.forEach(id => rule.markReady(arabic, id, rule.checksOf(id), rule.todayKey()));
    const arCompleteBefore = JSON.stringify(arabic), arComplete = option(arabic, 'arabic');
    check('Every required Arabic lesson marked ready to move on makes that selected path complete', arComplete.allComplete && !arComplete.resume);
    check('An exhausted Arabic path offers its first lesson for revisiting', arComplete.href === arHref('lesson.arabic-fusha-register'));
    check('Arabic completion leaves the selected path and unrelated open session untouched', JSON.stringify(arabic) === arCompleteBefore);
    rule.beginSession(arabic, requiredArabic[2], 'revision');
    check('A new open Arabic session can resume even after every required lesson is ready to move on', option(arabic, 'arabic').resume && option(arabic, 'arabic').allComplete && option(arabic, 'arabic').href === arHref(requiredArabic[2]));
    const extension = fresh(); extension.arabic.pathId = 'path.arabic-technology';
    const extensionPath = rule.arabicCatalogue.paths.get(extension.arabic.pathId);
    const requiredExtension = rule.arabicCatalogue.moduleList.filter(m => extensionPath.required_module_ids.includes(m.id)).flatMap(m => m.lesson_ids.filter(id => !rule.arabicCatalogue.lessonIndex[id].optional));
    for (const id of requiredExtension) readyArabic(extension, id);
    check('Unfinished optional Arabic extensions do not prevent required-path completion', rule.arabicState(extension, 'lesson.arabic-technical-terminology') === 'new' && option(extension, 'arabic').allComplete);
    rule.beginSession(extension, 'lesson.arabic-technical-terminology', 'standard');
    check('An optional Arabic extension session does not replace the completed required-path recommendation', option(extension, 'arabic').allComplete && !option(extension, 'arabic').resume);
    console.log('\n[Arabic] Today says why: revisit, revise, and a path with one lesson to revisit');
    const why = fresh(); why.arabic.pathId = 'path.arabic-start';
    const start = requiredArabic, k = rule.todayKey(), joining = start.indexOf('lesson.arabic-letter-joining');
    for (const id of start.slice(0, joining)) readyArabic(why, id);
    rule.flagRevisit(why, 'lesson.arabic-letter-families', 'dot positions', k);
    check('Today offers to revisit a lesson the next one builds on, naming that next lesson', option(why, 'arabic').href === arHref('lesson.arabic-letter-families')
      && option(why, 'arabic').detail === 'Worth revisiting first: ' + rule.arabicCatalogue.lessonIndex['lesson.arabic-letter-joining'].title + ' builds on it', option(why, 'arabic'));
    rule.markReady(why, 'lesson.arabic-letter-families', rule.checksOf('lesson.arabic-letter-families'), k);
    why.arabic.cards.push({ id: 'lexeme.arabic-seed-001:recognise', addedOn: k, review: { reps: 0, interval: 0, lapses: 0, due: k } });
    check('with revision due, Today says revision comes first and keeps the lesson as the link', option(why, 'arabic').href === arHref('lesson.arabic-letter-joining')
      && option(why, 'arabic').detail === 'Revision first (1 ready in Arabic), then this lesson', option(why, 'arabic'));
    check('…its button is "Revise Arabic", as on the learning map, with the map\'s own "Why this?"', option(why, 'arabic').revise === 'arabic' && rule.optionAction(option(why, 'arabic')) === 'Revise Arabic'
      && option(why, 'arabic').why.startsWith(rule.arabicPlan(why).reason));
    why.arabic.cards = [];
    for (const id of start) if (rule.arabicState(why, id) !== 'ready') readyArabic(why, id);
    rule.flagRevisit(why, start[3], 'a note', k);
    check('a path ready except one lesson says so on Today, not that the whole path is ready', !option(why, 'arabic').allComplete && option(why, 'arabic').href === arHref(start[3])
      && option(why, 'arabic').detail === 'Every other lesson on your path is ready — this one needs revision', option(why, 'arabic'));

    console.log('\n[Lesson journey] The suggested length, the warm-up and the steps each length shows');
    const ix30 = Object.entries(rule.arabicCatalogue.lessonIndex).find(([, x]) => x.practical === 30 && x.minutes >= 45)[0];
    const at30 = { minutes: 30, why: ['energy 3 today'] };
    check('On a 30-minute day a new lesson gets the short session (Light): the practical one would skip the teaching', rule.lengthOn(ix30, at30, 'new', false).variant === 'short');
    check('…a lesson you\'ve practised gets the practical one (Normal), at its own minutes', rule.lengthOn(ix30, at30, 'practised', false).variant === 'practical' && rule.lengthOn(ix30, at30, 'practised', false).minutes === 30);
    check('…and one that needs revision the revision session', rule.lengthOn(ix30, at30, 'needs-revision', true).variant === 'revision');
    const jw = fresh(), third = requiredArabic[2], second = requiredArabic[1]; jw.arabic.pathId = 'path.arabic-start';
    check('The warm-up waits until you\'ve studied the lesson before (never recall what you haven\'t met)', rule.warmUpFrom(jw, third) === null && rule.journeyFor(jw, third, 'standard', false).join() === 'understand,try,check');
    rule.finishSession(jw, rule.beginSession(jw, second, 'short'));
    check('…then the standard session starts with it, and the short one shows Understand and Check (Reflect while a session is open)', rule.warmUpFrom(jw, third) === second
      && rule.journeyFor(jw, third, 'standard', false).join() === 'warmup,understand,try,check' && rule.journeyFor(jw, third, 'short', true).join() === 'understand,check,reflect');
    check('The first lesson on a path has no warm-up', rule.warmUpFrom(jw, requiredArabic[0]) === null);

    console.log('\n[Your focus] One choice for Today and Study home');
    const yf = fresh();
    const ownA = course('own-a', [task('a1', true), task('a2', false)]), ownB = course('own-b', []), ownDone = course('own-done', [task('d1', true)]);
    const ownGone = { ...course('own-gone', [task('g1', false)]), archived: true }, guidedCopy = course('cyber:1:module.learning-lab', [task('cyber:1:lesson.learning-evidence', false)]);
    yf.study.stages = [{ id: 'y1', title: 'Y', courses: [ownA, ownB, ownDone, ownGone, guidedCopy] }];
    yf.study.focusCourseId = 'own-done';
    let yix = rule.stIndex(yf.study);
    check('The choices: Cybersecurity, Arabic, then your own live courses in roadmap order (archived ones and the guided copy aside)',
      rule.focusChoices(yf.study, yix).map(c => c.value).join() === 'cybersecurity,arabic,course:own-a,course:own-b,course:own-done');
    check('With Cybersecurity or Arabic as your focus, no course is labelled the focus', rule.courseFocus(yf.study, yix) === null && rule.focusValue(yf.study, yix) === 'cybersecurity');
    check('Choosing Arabic saves only the subject: the classic MyDay\'s pinned course stays', rule.chooseFocus(yf, 'arabic') && yf.study.settings.primarySubject === 'arabic' && yf.study.focusCourseId === 'own-done');
    check('…Today and Study home then offer Arabic first', rule.learningOptions(yf)[0].subject === 'arabic' && rule.learningGlance(yf).options[0].subject === 'arabic');
    check('Choosing what is already your focus changes nothing', !rule.chooseFocus(yf, 'arabic'));
    check('Choosing one of your courses saves "your courses" and that course', rule.chooseFocus(yf, 'course:own-b') && yf.study.settings.primarySubject === 'roadmap' && yf.study.focusCourseId === 'own-b');
    yix = rule.stIndex(yf.study);
    check('A chosen course with no tasks yet stays your focus, on the labels and the next step alike', rule.courseFocus(yf.study, yix)?.id === 'own-b' && rule.focusValue(yf.study, yix) === 'course:own-b'
      && rule.learningOptions(yf)[0].courseId === 'own-b');
    rule.chooseFocus(yf, 'course:own-done'); yix = rule.stIndex(yf.study);
    check('A finished chosen course gives way to one with work left, on the labels and the next step alike', rule.courseFocus(yf.study, yix)?.id === 'own-a'
      && rule.learningOptions(yf)[0].courseId === 'own-a' && rule.learningOptions(yf)[0].href === '#study/task/a2');
    check('An archived or unknown course, or an unknown value, can\'t be chosen', !rule.chooseFocus(yf, 'course:own-gone') && !rule.chooseFocus(yf, 'course:nope') && !rule.chooseFocus(yf, 'nonsense'));
    check('Choosing the Cybersecurity course\'s own roadmap copy makes Cybersecurity your focus', rule.chooseFocus(yf, 'course:cyber:1:module.learning-lab') && yf.study.settings.primarySubject === 'cybersecurity');
    const loose = fresh(); loose.study.settings.primarySubject = 'roadmap'; loose.study.focusCourseId = null;
    loose.study.stages = [{ id: 'l1', title: 'L', courses: [course('loose-empty', []), course('loose-done', [task('ld', true)])] }];
    const lix = rule.stIndex(loose.study);
    check('With "your courses" chosen, no course pinned and none with work, the course labelled your focus is the one offered',
      rule.courseFocus(loose.study, lix)?.id === 'loose-empty' && rule.learningOptions(loose)[0].courseId === 'loose-empty' && rule.focusValue(loose.study, lix) === 'course:loose-empty');
    loose.study.stages[0].courses = [course('loose-done', [task('ld', true)])];
    const lix2 = rule.stIndex(loose.study);
    check('…and with only a finished course, the next step is in another subject (no empty course offered)', rule.courseFocus(loose.study, lix2)?.id === 'loose-done'
      && rule.learningOptions(loose)[0].subject !== 'roadmap' && !rule.learningOptions(loose).some(o => o.subject === 'roadmap'));
    const none = fresh(); none.study.settings.primarySubject = 'roadmap';
    const nix = rule.stIndex(none.study);
    check('With "your courses" chosen but none added, that choice is still shown as chosen', rule.focusValue(none.study, nix) === 'roadmap' && rule.focusChoices(none.study, nix).some(c => c.value === 'roadmap'));
    check('Every option says why, in words ("Why this?")', rule.learningOptions(yf).every(o => typeof o.why === 'string' && o.why.length > 10));
    const glance = rule.learningGlance(why);
    check('Study home\'s glance counts Arabic places in words and lists the lesson that needs revision', glance.arabic.ready > 0 && glance.arabic.needs.length === 1 && glance.arabic.needs[0].id === start[3]
      && glance.cyber.total > 0 && glance.cyber.done === 0);

    console.log('\n[Reset preservation] Authored content, metadata and unrelated records');
    const rich = fresh();
    rich.study.stages = [{ id: 'rich-stage', title: 'Personal study', topicId: 'topic-spanish', futureStageField: 'keep', courses: [
      { ...course('rich-course', [{ ...task('rich-task', true), title: 'Spanish reading', note: 'Keep this authored note', url: 'https://example.com/lesson', futureTaskField: { keep: true } }]), archived: true, listId: 'learning-list', futureCourseField: ['keep'] },
      course('unfinished-course', [task('unfinished-task', false)]),
    ] }];
    rule.importPath(rich, 'path.appsec');
    const importedTask = rule.stIndex(rich.study).task.get(rule.curriculumTaskId('lesson.authorised-scope')).node;
    importedTask.done = true; importedTask.doneOn = '2026-10-02'; importedTask.note = 'Keep my scope note';
    rich.study.topics.push({ id: 'topic-extra', title: 'Spanish' });
    rich.study.settings = { vault: 'Learning', showClock: true, primarySubject: 'arabic' };
    rich.study.focusCourseId = 'rich-course'; rich.study.activeId = 'running-study';
    rich.study.sessions = [{ id: 'running-study', status: 'active', checkin: { note: 'History to clear' } }, { id: 'finished-study', status: 'done' }];
    rich.study.reviews = [{ id: 'review-to-clear', conceptId: 'rich-concept', date: '2026-10-01' }];
    rich.study.futureStudyField = { preserve: ['nested', 'metadata'] };
    const review = { reps: 9, interval: 30, lapses: 2, due: '2026-11-01' };
    const anotherWay = { text: 'An explanation I kept.', by: 'Example teacher', on: '2026-10-01' };
    rich.study.concepts = [{ id: 'rich-concept', title: 'A saved question', taskIds: ['rich-task'], createdOn: '2026-10-01', kind: 'choice', prompt: 'Which answer?', answer: 'A', explanation: 'Keep the explanation.', choices: ['A', 'B'], correct: 0, hint: 'Keep the hint.', source: 'My notes', note: 'Languages/Spanish', origin: { by: 'ai', subject: 'general', writer: 'example', checker: 'example', edited: true, extra: 'keep' }, anotherWay, futureConceptField: { keep: true }, review: { ...review } }];
    rich.arabic.pathId = 'path.arabic-start';
    rich.arabic.cards = [{ id: 'lexeme.arabic-seed-007:recognise', addedOn: '2026-10-01', anotherWay: clone(anotherWay), futureCardField: ['keep Arabic metadata'], review: { ...review } }];
    rich.cybersecurity.cards = [{ id: 'assessment.lab-isolation-check.q2', addedOn: '2026-10-02', anotherWay: clone(anotherWay), futureCardField: { keep: 'Cyber metadata' }, review: { ...review } }];
    rule.beginSession(rich, 'lesson.arabic-vowel-decoding', 'standard');
    rule.beginAttempt(rich, 'exercise.authorised-scope');
    rich.arabic.futureField = { keep: 'Arabic settings' }; rich.cybersecurity.futureField = ['Cyber settings'];
    rich.days['2026-10-01'] = { tasks: [{ uid: 'today-study', title: 'Spanish reading', done: true }], note: 'Keep Today exactly' };
    rich.timer = { uid: 'other-timer', runningSince: 100, activeMs: 200 };
    rich.reading = { books: [{ id: 'book', title: 'Example book', page: 12, pages: 80, notes: [{ id: 'reading-note', text: 'Keep my reading note.' }], finishedOn: null }], futureReadingField: 'keep' };
    rich.notes = { items: [{ id: 'note', title: 'Personal note', text: 'Keep this.' }], futureNotesField: 'keep' };
    rich.otherSection = { preserve: true, nested: [{ example: 'keep' }] };
    const beforeRich = clone(rich);
    const content = stages => JSON.stringify(stages, (key, value) => key === 'done' || key === 'doneOn' ? undefined : value);
    const without = (value, keys) => JSON.stringify(value, (key, item) => keys.includes(key) ? undefined : item);
    rule.resetLearningProgress(rich);
    const richTasks = [...rule.stIndex(rich.study).task.values()].map(e => e.node);
    const freshReview = schedule => JSON.stringify(schedule) === JSON.stringify({ reps: 0, interval: 0, lapses: 0, due: null });
    check('Reset keeps the entire authored and imported outline, links and notes while clearing completion marks', content(rich.study.stages) === content(beforeRich.study.stages) && richTasks.every(t => t.done === false && t.doneOn === null));
    check('Reset preserves archived courses and their authored task notes', rich.study.stages[0].courses[0].archived && rich.study.stages[0].courses[0].modules[0].sections[0].tasks[0].note === 'Keep this authored note');
    check('Reset preserves every concept question, explanation, origin and other metadata', without(rich.study.concepts, ['review']) === without(beforeRich.study.concepts, ['review']));
    check('Reset preserves every Arabic card identifier, saved explanation and other metadata', without(rich.arabic.cards, ['review']) === without(beforeRich.arabic.cards, ['review']));
    check('Reset preserves every Cybersecurity card identifier, saved explanation and other metadata', without(rich.cybersecurity.cards, ['review']) === without(beforeRich.cybersecurity.cards, ['review']));
    check('Reset starts all concept and both curriculum card review schedules afresh', [...rich.study.concepts, ...rich.arabic.cards, ...rich.cybersecurity.cards].every(c => freshReview(c.review)));
    check('Reset clears Study sessions, revision history and the active session', rich.study.sessions.length === 0 && rich.study.reviews.length === 0 && rich.study.activeId === null);
    check('Reset clears both curriculum attempt histories and the pinned course', rich.arabic.attempts.length === 0 && rich.cybersecurity.attempts.length === 0 && rich.study.focusCourseId === null);
    check('Reset preserves both selected curriculum paths and newer curriculum settings', without(rich.arabic, ['attempts', 'cards']) === without(beforeRich.arabic, ['attempts', 'cards']) && without(rich.cybersecurity, ['attempts', 'cards']) === without(beforeRich.cybersecurity, ['attempts', 'cards']));
    check('Reset preserves Study topics, preferences and newer Study metadata', JSON.stringify(rich.study.topics) === JSON.stringify(beforeRich.study.topics) && JSON.stringify(rich.study.settings) === JSON.stringify(beforeRich.study.settings) && JSON.stringify(rich.study.futureStudyField) === JSON.stringify(beforeRich.study.futureStudyField));
    check('Reset leaves Today tasks and their completion marks byte-for-byte unchanged', JSON.stringify(rich.days) === JSON.stringify(beforeRich.days) && rich.days['2026-10-01'].tasks[0].done);
    check('Reset leaves reading progress and reading notes byte-for-byte unchanged', JSON.stringify(rich.reading) === JSON.stringify(beforeRich.reading) && rich.reading.books[0].page === 12);
    check('Reset leaves every unrelated top-level section and timer byte-for-byte unchanged', without(rich, ['study', 'arabic', 'cybersecurity']) === without(beforeRich, ['study', 'arabic', 'cybersecurity']));
    const onceReset = JSON.stringify(rich); rule.resetLearningProgress(rich);
    check('Resetting already reset learning progress makes no further changes', JSON.stringify(rich) === onceReset);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
