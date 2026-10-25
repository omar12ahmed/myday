// Curriculum import, evidence and privacy contracts on the production code, with disposable data.
const fs = require('fs'), os = require('os'), path = require('path');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const same = require('node:util').isDeepStrictEqual;
(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-cyber-rules-'));
  const files = ['app/src/study/cybersecurity/catalogue', 'app/src/study/cybersecurity/learning', 'app/src/study/cybersecurity/practiceCatalogue', 'app/src/study/cybersecurity/practiceRules', 'app/src/study/cybersecurity/tutorReply', 'app/src/data/cybersecurity/normalize', 'app/src/data/cybersecurity/types', 'app/src/data/normalize', 'app/src/sync/records', 'app/src/study/route', 'supabase/functions/_shared/ai/tutor', 'supabase/functions/_shared/ai/prompt', 'app/src/data/cybersecurity/cards', 'app/src/data/study/queue', 'app/src/data/cybersecurity/portfolio', 'app/src/study/cybersecurity/portfolioPages', 'app/src/data/cybersecurity/lessons', 'app/src/study/cybersecurity/plan', 'app/src/data/study/roadmap', 'app/src/study/resetProgress'];
  fs.writeFileSync(path.join(dir, 'kit.ts'), files.map(f => `export * from ${JSON.stringify(path.join(ROOT, f))};`).join('\n'));
  const C = await import(pathToFileURL(await bundle(path.join(dir, 'kit.ts'), path.join(dir, 'out'))).href);
  const d = C.freshState();
  d.study.stages = [{ id: 'my-stage', title: 'Personal studies', courses: [{ id: 'mine', title: 'Spanish', url: '', minutes: 20, listId: null, archived: false, modules: [] }] }];
  const untouched = JSON.stringify({ lists: d.lists, days: d.days, notes: d.notes, projects: d.projects, course: d.study.stages[0].courses[0] });
  check('the core path adds 14 courses', C.importPath(d, 'path.core') === 14);
  check('import does not change existing content or Today', untouched === JSON.stringify({ lists: d.lists, days: d.days, notes: d.notes, projects: d.projects, course: d.study.stages[0].courses[0] }));
  const stages = JSON.stringify(d.study.stages);
  check('importing again is a no-op for the roadmap', C.importPath(d, 'path.core') === 0 && stages === JSON.stringify(d.study.stages));
  for (const p of C.curriculum.paths) C.importPath(d, p.id);
  const courses = d.study.stages.flatMap(s => s.courses), tasks = courses.flatMap(c => c.modules.flatMap(m => m.sections.flatMap(s => s.tasks)));
  check('all paths share the same 27 modules and 146 stable lesson IDs', courses.length === 28 && tasks.length === 146 && new Set(tasks.map(t => t.id)).size === 146);
  check('all imported lesson links resolve', tasks.every(t => C.lessons.has(C.lessonFromTask(t.id))));
  check('imported roadmap survives normalisation unchanged', same(C.normalize(d).study, d.study));
  const moved = C.freshState(); C.importPath(moved, 'path.core');
  const coursesToMove = moved.study.stages[0].courses;
  const movedTask = coursesToMove[0].modules[0].sections[0].tasks.shift();
  coursesToMove[1].modules[0].sections[0].tasks.push(movedTask);
  coursesToMove.shift(); C.importPath(moved, 'path.core');
  check('reimport after removing a course does not duplicate a lesson moved elsewhere', moved.study.stages.flatMap(s => s.courses).flatMap(c => c.modules.flatMap(m => m.sections.flatMap(s => s.tasks))).filter(t => t.id === movedTask.id).length === 1);
  check('malformed URI cannot crash Study', C.studyRoute('#study/cybersecurity/%ZZ').view === 'cybersecurity');
  const activity = C.activities.get('exercise.learning-evidence');
  const id = C.beginAttempt(d, activity.id), a = d.cybersecurity.attempts[0];
  check('starting twice resumes one draft', C.beginAttempt(d, activity.id) === id && d.cybersecurity.attempts.length === 1);
  check('empty work cannot be submitted', !!C.submitAttempt(d, id) && !a.submittedAt);
  Object.assign(a, { evidence: 'My actual observation, including a failed check.', inputVariant: 'scenario one', criticalPassed: true, rubricScores: [100, 100, 100, 100], assistance: 'hint' });
  check('a real assisted attempt can be submitted and its practical score is capped', C.submitAttempt(d, id) === null && C.attemptScore(a, activity) === 60);
  check('submission cannot overwrite history', !!C.submitAttempt(d, id));
  const id2 = C.beginAttempt(d, activity.id), a2 = d.cybersecurity.attempts.find(x => x.id === id2);
  Object.assign(a2, { evidence: 'I found an unresolved scope error.', inputVariant: 'scenario two', criticalPassed: false, rubricScores: [100, 100, 100, 100] });
  C.submitAttempt(d, id2);
  check('failed critical checks give 0 and the failed attempt is retained', C.attemptScore(a2, activity) === 0 && d.cybersecurity.attempts.length === 2);
  check('self-assessment cannot be promoted to verified mastery through import', C.cleanAttempt({ ...a, verified: true, assessor: 'ai' }).verified === false);
  check('historical rubric versions are not rescored against current content', C.attemptScore({ ...a, rubricVersion: '0.9.0' }, activity) === null);
  const assessment = C.activities.get('assessment.learning-evidence-check');
  const qid = C.beginAttempt(d, assessment.id), qa = d.cybersecurity.attempts.find(x => x.id === qid);
  Object.assign(qa, { evidence: 'Baseline', inputVariant: 'first recall', criticalPassed: true });
  check('the answer attempt requires every question', !!C.submitAttempt(d, qid));
  qa.answers = Object.fromEntries(assessment.questions.map(q => [q.id, 'I do not know yet.']));
  check('honest uncertainty is accepted without an invented score', !C.submitAttempt(d, qid) && C.attemptScore(qa, assessment) === null);
  check('learner catalogue has no knowledge-check answers', !JSON.stringify(C.curriculum).includes('expected_answer'));
  check('top-level learner evidence survives save and backup normalisation', same(C.normalize(d).cybersecurity, d.cybersecurity));
  const records = C.localRecords(d), dest = C.freshState();
  for (const [k, c] of records) C.putRecord(dest, k, C.cleanRecord(k, c));
  check('preferences and every attempt survive the account round trip', same(C.normalize(dest).cybersecurity, d.cybersecurity));
  check('mismatched attempt IDs from sync are rejected', C.cleanRecord('cyber_attempt:someone-else', a) === null);
  check('malformed evidence is reported, not silently trusted', (() => { const report = { dropped: 0 }; C.normalizeCyber({ attempts: [{ bad: true }] }, report); return report.dropped === 1; })());
  check('fields a newer MyDay adds to the section are kept as they are (going back a version never loses them)', (() => { const x = C.normalizeCyber({ pathId: 'path.core', attempts: [{ bad: true }], laterList: [{ id: 'x' }] }); return JSON.stringify(x.laterList) === '[{"id":"x"}]' && x.attempts.length === 0 && x.pathId === 'path.core'; })());
  const practiceData = C.freshState();
  const setAnswer = (a, key, value) => { a.answers[C.answerKey(key)] = value; };
  const start = id => { const aid = C.beginAttempt(practiceData, id); return practiceData.cybersecurity.attempts.find(a => a.id === aid); };
  const prepared = a => Object.assign(a, { evidence: 'Observed an outcome, compared a baseline, and named a limitation.', criticalPassed: true });
  check('every practice assignment resolves to an activity and real lessons', C.practiceActivities.every(p => C.activities.has(p.id) && p.lessonIds.every(id => C.lessons.has(id))));
  check('every external assignment has an HTTPS provider and a working fallback', C.practiceActivities.filter(p => p.kind === 'external').every(p => p.url.startsWith('https://') && C.activities.has(p.fallbackId)));
  check('the learning lab offers concrete starting activities', C.relatedPractice('lab.learning-lab-guided').some(p => p.id === 'assignment.thm-start'));
  const ext = prepared(start('assignment.thm-network'));
  check('starting an external assignment does not complete it', !ext.submittedAt && !C.answer(ext, 'outcome'));
  check('external drafts resume instead of duplicating records', start(ext.activityId).id === ext.id);
  check('saving requires an explicit external outcome', !!C.submitAttempt(practiceData, ext.id));
  setAnswer(ext, 'outcome', 'completed'); ext.criticalPassed = false;
  check('completion cannot conceal an unresolved scope check', !!C.submitAttempt(practiceData, ext.id));
  setAnswer(ext, 'outcome', 'blocked');
  check('blocked access can be recorded honestly without passing scope', C.submitAttempt(practiceData, ext.id) === null && ext.verified === false);
  const completed = prepared(start(ext.activityId)); setAnswer(completed, 'outcome', 'completed');
  check('an explicit check-in records completion without changing Study tasks', C.submitAttempt(practiceData, completed.id) === null && practiceData.study.stages.length === 0 && C.attemptScore(completed, C.activities.get(completed.activityId)) === null);
  const scope = prepared(start('interactive.scope'));
  check('scope practice needs every decision', !!C.submitAttempt(practiceData, scope.id));
  C.scopeCases.forEach(q => setAnswer(scope, q.id, q.correct)); setAnswer(scope, 'scope-two', 'proceed');
  check('incorrect scope choices are saved as learning attempts', !C.submitAttempt(practiceData, scope.id) && C.practiceChecks(scope, C.practiceById.get(scope.activityId)).filter(c => c.passed).length === 3);
  const net = prepared(start('interactive.network'));
  check('network practice starts with a reproducible failing scenario', !C.simulateNetwork(C.networkConfig(net)).connected && !C.answer(net, 'run'));
  check('unrun network settings cannot be submitted', !!C.submitAttempt(practiceData, net.id));
  for (const id of Object.keys(C.networkScenarios)) {
    C.setScenario(net, id);
    check('the ' + id + ' scenario fails at the expected step', !C.simulateNetwork(C.networkConfig(net)).connected);
    setAnswer(net, 'dns', 'available'); setAnswer(net, 'gateway', '10.20.0.1'); setAnswer(net, 'https', 'allow');
    check('repairing the ' + id + ' scenario reaches the website', C.simulateNetwork(C.networkConfig(net)).connected);
  }
  setAnswer(net, 'run', C.networkSignature(C.networkConfig(net))); setAnswer(net, 'https', 'block');
  check('changing settings invalidates the previous simulation run', !!C.submitAttempt(practiceData, net.id));
  setAnswer(net, 'run', C.networkSignature(C.networkConfig(net)));
  check('a failed simulation is retained with its inputs', !C.submitAttempt(practiceData, net.id) && !C.practiceChecks(net, C.practiceById.get(net.activityId))[0].passed);
  const log = prepared(start('interactive.auth-logs')), parsed = C.analyseAuthRows(C.authRows);
  check('fixture parsing excludes invalid rows before deduplicating', same([C.authRows.length, parsed.valid.length, parsed.failures.length, parsed.invalid.length, parsed.duplicate.length], [33, 30, 6, 2, 1]));
  check('fixture timestamps retain timezone offsets', Date.parse(parsed.valid[0][1]) === Date.parse('2026-01-15T10:01:00Z'));
  const invalidCopy = [...C.authRows[0]]; invalidCopy[1] = 'bad';
  check('an invalid first occurrence cannot suppress a later valid event', C.analyseAuthRows([invalidCopy, C.authRows[0]]).valid.length === 1);
  for (const [key, value] of Object.entries({ valid: '30', failures: '6', invalid: '2', duplicate: '1' })) setAnswer(log, key, value);
  setAnswer(log, 'valid', '-1'); check('log counts reject invalid numeric input', !!C.submitAttempt(practiceData, log.id)); setAnswer(log, 'valid', '30');
  check('correct log counts match checks but never verify mastery', !C.submitAttempt(practiceData, log.id) && C.practiceChecks(log, C.practiceById.get(log.activityId)).every(c => c.passed) && log.verified === false);
  const freshDraft = start('interactive.auth-logs'); freshDraft.rubricVersion = 'practice-0.9.0';
  check('a changed practice version preserves the old draft and creates a new one', start('interactive.auth-logs').id !== freshDraft.id && practiceData.cybersecurity.attempts.includes(freshDraft));
  const practiceDestination = C.freshState();
  for (const [k, c] of C.localRecords(practiceData)) C.putRecord(practiceDestination, k, C.cleanRecord(k, c));
  check('external and interactive inputs survive normalisation, backup and account records', same(C.normalize(practiceData).cybersecurity, practiceData.cybersecurity) && same(C.normalize(practiceDestination).cybersecurity, practiceData.cybersecurity));
  const ctx = { version: 1, action: 'tutor', curriculumVersion: '1.0.0', lessonId: 'lesson.learning-evidence', question: 'Help me understand evidence.' };
  check('tutor accepts only a known version and lesson', C.checkTutorContext(ctx) && !C.checkTutorContext({ ...ctx, lessonId: '__proto__' }) && !C.checkTutorContext({ ...ctx, curriculumVersion: '2.0.0' }));
  check('tutor rejects private extra fields and oversized requests', !C.checkTutorContext({ ...ctx, notebook: 'private work' }) && !C.checkTutorContext({ ...ctx, question: 'x'.repeat(1001) }));
  const messages = C.messagesFor(ctx);
  check('tutor uses authoritative lesson context, without answer keys', messages[1].content.includes('Learning through evidence') && !messages[1].content.includes('No; performance needs observable evidence.'));
  check('a bounded response for the selected lesson is accepted', !!C.tutorReply(C.mockTutor(ctx), ctx.lessonId));
  check('wrong-lesson, score-bearing and malformed responses are refused', !C.tutorReply(C.mockTutor(ctx), 'lesson.other') && !C.tutorReply(JSON.stringify({ lessonId: ctx.lessonId, explanation: 'x', nextStep: 'x', score: 100 }), ctx.lessonId) && !C.tutorReply('bad', ctx.lessonId));
  // Graduated help: a version-2 request gets the reply in parts; version 1 (the published app) as before.
  const ctx2 = { ...ctx, version: 2 };
  check('tutor accepts version 2 as well as 1, and nothing else', C.checkTutorContext(ctx2) && !C.checkTutorContext({ ...ctx, version: 3 }) && !C.checkTutorContext({ ...ctx2, notebook: 'private work' }));
  const m2 = C.messagesFor(ctx2);
  check('version 2\'s instructions ask for the parts (a hint before any explanation) or a plain reply, with the same lesson and no answer keys',
    ['"hint"', '"example"', '"explanation"', '"followUp"', '"kind": "plain"', 'never the answer itself'].every(x => m2[0].content.includes(x)) && m2[1].content === messages[1].content && m2[0].content !== messages[0].content);
  const steps = C.readTutorSteps(C.mockTutor(ctx2), ctx.lessonId);
  check('the practice tutor\'s version-2 reply is read as parts, and its version-1 reply is unchanged (not parts)', steps?.kind === 'steps' && steps.hint.startsWith('Practice helper (no AI)') && !!steps.followUp.answer && !!C.tutorReply(C.mockTutor(ctx), ctx.lessonId) && !C.readTutorSteps(C.mockTutor(ctx), ctx.lessonId));
  const SR = o => JSON.stringify({ lessonId: ctx.lessonId, kind: 'steps', hint: 'What would count as evidence?', example: 'A log line you wrote.', explanation: 'Evidence is what you can show.', followUp: { question: 'Is reading evidence?', answer: 'No.' }, ...o });
  const PR = o => JSON.stringify({ lessonId: ctx.lessonId, kind: 'plain', explanation: 'I can\'t mark this.', nextStep: 'Write your baseline.', ...o });
  check('a plain reply (explanation and next step) is read too', C.readTutorSteps(PR(), ctx.lessonId)?.kind === 'plain' && C.readTutorSteps(PR(), ctx.lessonId).nextStep === 'Write your baseline.');
  const refusedSteps = [['another lesson', SR({ lessonId: 'lesson.other' })], ['an unknown kind', SR({ kind: 'essay' })], ['no hint', SR({ hint: undefined })], ['no follow-up answer', SR({ followUp: { question: 'Q?' } })],
    ['a hint over 400 characters', SR({ hint: 'h'.repeat(401) })], ['a next step over 600 characters', PR({ nextStep: 'n'.repeat(601) })], ['a link', SR({ example: 'See https://example.com.' })], ['a verdict', PR({ explanation: 'You\'ve passed this one.' })],
    ['a score', SR({ explanation: 'You scored 8/10.' })], ['not JSON', 'Sure! Here you go.'], ['the version-1 shape', C.mockTutor(ctx)]].filter(([, t]) => C.readTutorSteps(t, ctx.lessonId)).map(([w]) => w);
  check('a version-2 reply that isn\'t usable is refused (11 kinds: lesson, shape, lengths, links, verdicts)', refusedSteps.length === 0, refusedSteps);
  check('…but saying it can\'t tell whether you\'ve passed is no verdict', !!C.readTutorSteps(PR({ explanation: 'I can\'t say whether you\'ve passed: I can\'t see your work.' }), ctx.lessonId));
  check('…while a verdict dressed up as "whether you have passed" still is', !C.readTutorSteps(PR({ explanation: 'Whether you have passed this lesson is clear: yes, you have.' }), ctx.lessonId));
  const extra = C.readTutorSteps(SR({ score: 100, note: 'x' }), ctx.lessonId);
  check('…and fields beyond the parts (a score, a note) are never kept, so never shown', !!extra && !('score' in extra) && !('note' in extra) && Object.keys(extra).join() === 'kind,hint,example,explanation,followUp');
  const plainMock = C.readTutorSteps(C.mockTutor({ ...ctx2, question: 'Did I pass? Give me a score.' }), ctx.lessonId);
  check('the practice tutor answers a request for a mark with a plain reply', plainMock?.kind === 'plain' && plainMock.explanation.startsWith('Practice helper (no AI)'));
  check('…and the rule-breaking practice reply (a mark, a link, the question repeated) is refused', C.readTutorSteps(C.mockTutor(ctx2, 'sloppy'), ctx.lessonId) === null);
  const { handle } = await import(pathToFileURL(path.join(ROOT, 'supabase/functions/ai-plan/handler.ts')).href);
  let budgetCalls = 0;
  const env = { AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_MOCK_DELAY_MS: '0' };
  const deps = { env: k => env[k], verifyUser: async () => 'test-account', begin: async () => { budgetCalls++; return { ok: true }; }, finish: async () => {} };
  const req = c => new Request('http://test/ai-plan', { method: 'POST', headers: { Authorization: 'Bearer test.user.token' }, body: JSON.stringify({ context: c }) });
  const response = await handle(req(ctx), deps), result = await response.json();
  check('server tutor uses the authenticated, budget-limited provider path', response.status === 200 && !!C.tutorReply(result.output, ctx.lessonId) && budgetCalls === 1);
  check('unknown lessons are rejected before budget or provider use', (await handle(req({ ...ctx, lessonId: 'lesson.missing' }), deps)).status === 400 && budgetCalls === 1);
  const r2 = await handle(req(ctx2), deps), out2 = await r2.json();
  check('a version-2 request goes the same way and comes back in parts', r2.status === 200 && C.readTutorSteps(out2.output, ctx.lessonId)?.kind === 'steps' && budgetCalls === 2);
  check('…and a version the server doesn\'t know is refused before any budget is used', (await handle(req({ ...ctx, version: 3 }), deps)).status === 400 && budgetCalls === 2);

  console.log('\n[Revision] The course\'s own knowledge checks in revision (no AI)');
  const checks = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/study/cybersecurity/checks.json'), 'utf8'));
  const cyAnswers = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/study/cybersecurity/answers.json'), 'utf8'));
  const kcs = C.curriculum.assessments.filter(a => a.type === 'knowledge_check'), kq = kcs.flatMap(a => a.questions.map(q => ({ q, lesson: a.lesson_id })));
  check('every knowledge-check question is ready for revision, with its lesson\'s title (292)', kq.length === 292 && Object.keys(checks).length === 292 && kq.every(({ q, lesson }) => checks[q.id]?.prompt === q.prompt && checks[q.id].lesson === C.lessons.get(lesson).title));
  check('…each with a reference answer, and no answer inside the checks file', Object.keys(checks).every(id => cyAnswers[id]) && !Object.values(cyAnswers).some(a => JSON.stringify(checks).includes(JSON.stringify(a))));
  check('a question\'s id names its lesson, for every question in the course', kq.every(({ q, lesson }) => C.lessonOfCheck(q.id) === lesson));
  check('every card id fits a sync record and is read back as it was', kq.every(({ q }) => q.id.length <= 64 && C.cleanCyberCard({ id: q.id, addedOn: '2026-10-14' })?.id === q.id));
  const rv = { reps: 1, interval: 4, lapses: 0, due: '2026-10-18' }, rep = { dropped: 0 };
  const readBack = C.normalizeCyber({ pathId: 'path.core', attempts: [], cards: [{ id: 'assessment.lab-isolation-check.q2', addedOn: '2026-10-14', review: rv, score: 9 }, { id: 'assessment.lab-isolation-check.q2', addedOn: '2026-10-14' }, { id: 'lesson.lab-isolation', addedOn: '2026-10-14' }, { id: 'assessment.lab-isolation-check.q1', addedOn: 'today' }] }, rep);
  check('saved cards are read back with their schedule; duplicates, other ids and bad dates are dropped (and counted)', readBack.cards.length === 1 && same(readBack.cards[0], { id: 'assessment.lab-isolation-check.q2', addedOn: '2026-10-14', review: rv }) && rep.dropped === 3);
  const kept = C.normalizeCyber({ pathId: 'path.core', attempts: [], cards: [{ id: 'assessment.lab-isolation-check.q2', addedOn: '2026-10-14', anotherWay: { text: '  Like a fire door: ' + 'x'.repeat(2000), by: 'Gemini 3.8 Flash', on: '2026-10-16' } }, { id: 'assessment.lab-isolation-check.q1', addedOn: '2026-10-14', anotherWay: { text: '', on: '2026-10-16' } }] }).cards;
  check('an explanation you kept on a check (from 1.20.2) is kept, cut to 1,500 characters; an empty one is left off, keeping the card', kept.length === 2 && kept[0].anotherWay.text.startsWith('Like a fire door') && kept[0].anotherWay.text.length === 1500 && kept[0].anotherWay.by === 'Gemini 3.8 Flash' && !('anotherWay' in kept[1]));
  check('no cards saved yet means nothing in revision, not an error', C.normalizeCyber({ pathId: 'path.core', attempts: [] }).cards.length === 0 && C.emptyCyber().cards.length === 0);
  const dd = C.freshState(), ids = kcs.find(a => a.lesson_id === 'lesson.lab-isolation').questions.map(q => q.id);
  check('adding a lesson\'s checks puts each in revision once, first back tomorrow', C.addCyberCards(dd, ids, '2026-10-14') === 2 && C.addCyberCards(dd, ids, '2026-10-14') === 0 && dd.cybersecurity.cards.every(c => c.review.due === '2026-10-15'));
  check('nothing is due on the day it was added; the next day they are, in the one queue and in "Revise Cybersecurity"', C.dueIds(dd, '2026-10-14').length === 0 && C.dueIds(dd, '2026-10-15').join() === ids.join() && C.dueIds(dd, '2026-10-15', 'cybersecurity').join() === ids.join() && C.dueIds(dd, '2026-10-15', 'arabic').length === 0);
  check('an answer reschedules the card with Study\'s rules and goes into Study\'s history under its id, self-assessed', C.rateCyberCard(dd, ids[0], 'Choose and isolate · check 1', '2026-10-15', { outcome: 'right', chosen: null, support: 'own' }, 'good') && dd.cybersecurity.cards[0].review.due === '2026-10-19' && dd.study.reviews.at(-1).conceptId === ids[0] && dd.study.reviews.at(-1).graded === 'self');
  check('taking them out keeps their past answers', C.removeCyberCards(dd, ids) && dd.cybersecurity.cards.length === 0 && dd.study.reviews.length === 1);

  console.log('\n[Portfolio] Entries from handed-in attempts, the privacy check, secrets and saved data');
  check('a private key, a password or key written out, and common token formats are found', C.secretsIn('-----BEGIN OPENSSH PRIVATE KEY-----').includes('a private key')
    && C.secretsIn('db password=hunter2').includes('a password or key written out') && C.secretsIn('API_KEY: "abc123def"').includes('a password or key written out')
    && C.secretsIn('key AKIAIOSFODNN7EXAMPLE').includes('an AWS access key') && C.secretsIn('ghp_' + 'a'.repeat(36)).includes('a GitHub token')
    && C.secretsIn('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U').includes('a sign-in token (JWT)'));
  check('…but a value that\'s plainly redacted isn\'t', C.secretsIn('password=<redacted>').length === 0 && C.secretsIn('password: ****').length === 0 && C.secretsIn('token=[REDACTED]').length === 0 && C.secretsIn('api_key=xxx').length === 0);
  check('private, loopback and documentation addresses aren\'t mentioned; a public one is, even at a sentence\'s end', !C.publicAddressIn('10.0.0.5 192.168.1.20 172.16.4.1 127.0.0.1 192.0.2.10 198.51.100.7 203.0.113.9 169.254.1.1')
    && C.publicAddressIn('I scanned 45.33.32.156.') && C.publicAddressIn('(45.33.32.156)') && C.publicAddressIn('45.33.32.156\nnext') && !C.publicAddressIn('version 1.2.3.4.5') && !C.publicAddressIn('999.1.1.1')
    && !C.publicAddressIn('dig @8.8.8.8 example.org and 1.1.1.1'));
  check('…and it\'s a second look, never a refusal: a four-part version number doesn\'t stop an entry', C.publicAddressIn('nmap 7.94.1.2') && C.secretsIn('nmap 7.94.1.2').length === 0 && C.notYet({ title: 'T', evidence: 'scanned 45.33.32.156.', note: '' }) === '');
  check('more key formats are found: GitHub fine-grained tokens, API keys, a password in a web address, Bearer tokens, AWS secret keys', C.secretsIn('github_pat_' + 'A'.repeat(30)).includes('a GitHub token')
    && C.secretsIn('sk-proj-' + 'a'.repeat(30)).includes('an API key') && C.secretsIn('psql postgres://admin:hunter2@db.lab/app').includes('a password in a web address')
    && C.secretsIn('Authorization: Bearer ' + 'a1b2'.repeat(10)).includes('a sign-in token (Bearer)') && C.secretsIn('aws_secret_access_key = ' + 'A'.repeat(40)).includes('an AWS secret key'));
  check('ordinary words after "password" or "token" aren\'t secrets', C.secretsIn('Password: not stored. token: expired. secret = None. password policy: 12 characters').length === 0);
  check('a file opens on this device only as a type the files function enforced; anything else is plain bytes', C.blobType('image/png') === 'image/png' && C.blobType('application/pdf') === 'application/pdf'
    && C.blobType('text/html') === 'application/octet-stream' && C.blobType('image/svg+xml') === 'application/octet-stream' && C.blobType('') === 'application/octet-stream');
  check('nothing ordinary is a find', C.secretsIn('I listed the open ports with ss -tulpn and compared them with the baseline.').length === 0);
  const pf = C.freshState(), k = '2026-10-24';
  pf.cybersecurity.attempts.push({ id: 'caPf', activityId: 'exercise.learning-evidence', curriculumVersion: '1.0.0', rubricVersion: '1.0.0', startedAt: '2026-10-24T08:00:00.000Z', submittedAt: null, inputVariant: 'first baseline', environmentId: '', assistance: 'independent', evidence: 'Compared two runs.', answers: {}, rubricScores: [], criticalPassed: true, resumePoint: '', answerRevealed: false, assessor: 'self', verified: false });
  const text = { title: 'Learning evidence: first baseline', evidence: 'Compared two runs.', note: '' };
  check('an attempt not yet handed in can\'t be added', C.addEntry(pf, 'caPf', text, true, k) === null);
  pf.cybersecurity.attempts[0].submittedAt = '2026-10-24T08:30:00.000Z';
  check('…nor without all three privacy ticks, a title, or with something that looks like a secret', C.addEntry(pf, 'caPf', text, false, k) === null && C.addEntry(pf, 'caPf', { ...text, title: '  ' }, true, k) === null
    && C.addEntry(pf, 'caPf', { ...text, evidence: 'logged in with password=hunter2' }, true, k) === null && !('portfolio' in pf.cybersecurity));
  const pid = C.addEntry(pf, 'caPf', { ...text, note: '  first try  ' }, true, k), e = pf.cybersecurity.portfolio?.[0];
  check('a handed-in attempt, checked, makes an entry: its own copy of the evidence, the note trimmed, the day reviewed', /^pf[a-z0-9]{6,30}$/.test(pid) && e.attemptId === 'caPf' && e.activityId === 'exercise.learning-evidence'
    && e.evidence === 'Compared two runs.' && e.note === 'first try' && e.reviewedOn === k && !('fileIds' in e) && C.entriesFrom(pf, 'caPf').length === 1);
  check('the reason it can\'t be added yet says what it found', /looks like a password or key written out/.test(C.notYet({ ...text, evidence: 'password=hunter2' })) && C.notYet({ ...text, title: '' }) === 'Give it a title.' && C.notYet(text) === '');
  check('editing it is checked again and moves the day reviewed', !C.editEntry(pf, pid, { ...text, evidence: 'token=abc123456' }, true, '2026-10-25') && C.editEntry(pf, pid, { ...text, title: 'A better title' }, true, '2026-10-25')
    && e.title === 'A better title' && e.reviewedOn === '2026-10-25' && !C.editEntry(pf, pid, { title: 'A better title', evidence: e.evidence, note: e.note }, true, '2026-10-26'));
  check('removing it leaves the attempt in the notebook', C.removeEntry(pf, pid) && pf.cybersecurity.portfolio.length === 0 && pf.cybersecurity.attempts.length === 1 && !C.removeEntry(pf, pid));
  const prep = { dropped: 0 }, good = { id: 'pfabc12345', attemptId: 'caPf', activityId: 'exercise.learning-evidence', title: 'Kept', evidence: 'x'.repeat(13000), note: 'n', reviewedOn: k, fileIds: ['flaaaaaa01', 'flaaaaaa01', 'bad', 'flaaaaaa02', 'flaaaaaa03', 'flaaaaaa04', 'flaaaaaa05', 'flaaaaaa06'] };
  const np = C.normalizeCyber({ pathId: 'path.core', attempts: [], portfolio: [good, { ...good }, { ...good, id: 'pfbad' }, { ...good, id: 'pfnodate001', reviewedOn: 'soon' }, { ...good, id: 'pfnotitle01', title: ' ' }] }, prep).portfolio;
  check('saved entries: a duplicate, a bad id, no day or no title are dropped (and counted); evidence capped, file ids cleaned to 5', np.length === 1 && prep.dropped === 4 && np[0].evidence.length === 12000
    && JSON.stringify(np[0].fileIds) === JSON.stringify(['flaaaaaa01', 'flaaaaaa02', 'flaaaaaa03', 'flaaaaaa04', 'flaaaaaa05']));
  check('no portfolio yet stays exactly that: the field is absent, as older data was', !('portfolio' in C.normalizeCyber({ pathId: 'path.core', attempts: [] })));
  check('a field a newer MyDay adds to an entry is kept as it is', JSON.stringify(C.normalizeCyber({ pathId: 'path.core', attempts: [], portfolio: [{ ...good, id: 'pffuture001', nice: { roles: ['PR-CDA-001'] } }] }).portfolio[0].nice) === JSON.stringify({ roles: ['PR-CDA-001'] }));
  const page = C.portfolioPage([{ ...good, title: '<script>alert(1)</script>', evidence: 'a & b', fileIds: undefined }], k);
  check('the exported page escapes every entry and runs nothing (no scripts, nothing fetched)', page.includes('&lt;script&gt;alert(1)&lt;/script&gt;') && page.includes('a &amp; b') && !/<script/i.test(page.replace(/&lt;script/g, '')) && page.includes("default-src 'none'"));

  console.log('\n[States] Your place on each lesson: Practised, Ready to move on, Holding, Needs revision, and the next step');
  {
    const L = 'lesson.lab-isolation', F = C.factsOf(L);
    check('a lesson\'s facts: its practical task, knowledge check and mini challenge, and its knowledge-check questions', F.activityIds.length === 3 && F.activityIds.includes('assessment.lab-isolation-check') && same(F.checks, ['assessment.lab-isolation-check.q1', 'assessment.lab-isolation-check.q2']));
    const d = C.freshState();
    check('with nothing done it\'s New', C.cyberState(d, L) === 'new');
    const draft = C.beginAttempt(d, 'exercise.lab-isolation');
    check('…and an attempt not yet handed in doesn\'t make it Practised', C.cyberState(d, L) === 'new');
    d.cybersecurity.attempts.find(a => a.id === draft).submittedAt = '2026-10-10T10:00:00Z';
    check('a handed-in attempt on one of its activities makes it Practised', C.cyberState(d, L) === 'practised');
    const s2 = C.freshState(); s2.study.sessions.push({ id: 'ssX', courseId: 'cyber:1:module.x', taskId: C.curriculumTaskId(L), title: 'x', date: '2026-10-10', startedAt: '2026-10-10T09:00', plannedMin: 15, short: true, status: 'done', runningSince: null, activeMs: 900000, endedAt: '2026-10-10T09:15', checkin: null, taskDone: null, todayUid: null });
    check('…and so does a finished Study session on it (one still running doesn\'t)', C.cyberState(s2, L) === 'practised' && (s2.study.sessions[0].status = 'active', C.cyberState(s2, L) === 'new'));

    // Ready, without the path in the roadmap: the record holds the day.
    const added = C.markCyberReady(d, F, '2026-10-10');
    check('Ready to move on (no roadmap path): saved in your lesson record, its day kept', C.cyberState(d, L) === 'ready' && C.readyDay(d, L) === '2026-10-10' && same(d.cybersecurity.lessons, [{ id: L, readyOn: '2026-10-10' }]));
    check('…and its two checks join revision a week later, by themselves', added.length === 2 && added.every(a => a.due === '2026-10-17') && F.checks.every(id => C.cyberCardOf(d, id)?.review.due === '2026-10-17'));
    check('…a check already in revision keeps its own schedule', (() => { const e = C.freshState(); C.addCyberCards(e, [F.checks[0]], '2026-10-01'); const a = C.markCyberReady(e, F, '2026-10-10'); return a.length === 1 && C.cyberCardOf(e, F.checks[0]).review.due === '2026-10-02'; })());
    const rv = (id, date, outcome, support, rating = 'good') => d.study.reviews.push({ id: 'rv' + d.study.reviews.length, conceptId: id, title: 'q', date, at: date + 'T10:00', kind: 'written', outcome, graded: 'self', chosen: null, support, rating, gap: 1, due: null });
    rv(F.checks[0], '2026-10-16', 'right', 'own'); rv(F.checks[1], '2026-10-16', 'right', 'own');
    check('both checks recalled on your own six days after Ready: still Ready, not yet Holding', C.cyberState(d, L) === 'ready');
    rv(F.checks[0], '2026-10-17', 'right', 'own'); rv(F.checks[1], '2026-10-17', 'right', 'own');
    check('…a week after Ready: Holding', C.cyberState(d, L) === 'holding');
    rv(F.checks[1], '2026-10-20', 'wrong', 'own', 'again');
    check('a check that slips after Ready: Needs revision', C.cyberState(d, L) === 'needs-revision');
    rv(F.checks[1], '2026-10-21', 'right', 'hint');
    check('…a right answer with a hint isn\'t enough to clear it', C.cyberState(d, L) === 'needs-revision');
    rv(F.checks[1], '2026-10-22', 'right', 'own');
    check('…recalling it on your own clears it', C.cyberState(d, L) === 'holding');
    C.flagCyberRevisit(d, L, '  NAT versus host-only  ', '2026-10-23');
    check('your own flag, with what needs work (trimmed): Needs revision, whatever the answers say, and Progress lists it with your words', C.cyberState(d, L) === 'needs-revision' && C.cyberLessonRecord(d, L).revisit.what === 'NAT versus host-only'
      && C.pathIds(d).includes(L) && C.cyberGlance(d).needs.some(n => n.id === L && n.flag === 'NAT versus host-only'));
    check('Done revisiting takes the flag off', C.clearCyberRevisit(d, L) && C.cyberState(d, L) === 'holding' && !C.clearCyberRevisit(d, L));
    C.flagCyberRevisit(d, L, 'again', '2026-10-24'); C.markCyberReady(d, F, '2026-10-24');
    check('marking it ready again takes your flag off too', !C.cyberLessonRecord(d, L).revisit && C.readyDay(d, L) === '2026-10-24');
    check('Not ready after all: the day goes and the record with it; the checks stay in revision', C.unmarkCyberReady(d, L) && !d.cybersecurity.lessons.length && C.cyberState(d, L) === 'practised' && F.checks.every(id => C.cyberCardOf(d, id)) && !C.unmarkCyberReady(d, L));

    // With the path in your roadmap: the roadmap's tick is Ready, as before.
    const r = C.freshState(); C.importPath(r, 'path.core');
    const task = () => C.stIndex(r.study).task.get(C.curriculumTaskId(L)).node;
    C.markCyberReady(r, F, '2026-10-11');
    check('with the path in your roadmap, Ready ticks the lesson\'s task (no record of your own needed)', task().done && C.readyDay(r, L) === task().doneOn && !(r.cybersecurity.lessons ?? []).some(x => x.readyOn));
    check('…and Not ready after all unticks it', C.unmarkCyberReady(r, L) && !task().done && C.cyberState(r, L) === 'new');
    task().done = true; task().doneOn = '2026-10-05';
    check('a lesson ticked in your roadmap (before or elsewhere) is Ready from its day', C.cyberState(r, L) === 'ready' && C.readyDay(r, L) === '2026-10-05');
    task().doneOn = null;
    check('…one ticked with no day kept (older data) is Ready all the same', C.cyberState(r, L) === 'ready' && C.readyDay(r, L) === C.READY_LONG_AGO);
    const m = C.freshState(); C.markCyberReady(m, F, '2026-10-12'); C.importPath(m, 'path.core');
    const mt = C.stIndex(m.study).task.get(C.curriculumTaskId(L)).node;
    check('adding the path later moves your Ready day to its task (ticked, that day), and the record goes', mt.done && mt.doneOn === '2026-10-12' && !(m.cybersecurity.lessons ?? []).length && C.cyberState(m, L) === 'ready');

    // Saved data
    const nl = C.normalizeCyber({ pathId: 'path.core', attempts: [], cards: [], lessons: [{ id: L, readyOn: '2026-10-12', revisit: { since: '2026-10-13', what: 'x'.repeat(400) }, futureBit: 1 }, { id: 'lesson.arabic-origin-location', readyOn: '2026-10-12' }, { id: 'lesson.other', readyOn: 'soon' }, { id: L }] });
    check('read back: a record keeps its day, its flag (what up to 300 characters) and a newer field; an Arabic id, a duplicate and a bad day are left out', nl.lessons.length === 2 && nl.lessons[0].futureBit === 1 && nl.lessons[0].revisit.what.length === 300 && !('readyOn' in nl.lessons[1]) && nl.lessons[1].id === 'lesson.other');
    check('…and data without any stays without (older data unchanged)', !('lessons' in C.normalizeCyber({ pathId: 'path.core', attempts: [], cards: [] })));
    const reset = C.freshState(); C.markCyberReady(reset, F, '2026-10-12'); C.resetLearningProgress(reset);
    check('the Study reset clears your place on Cybersecurity lessons too', same(reset.cybersecurity.lessons, []) && C.cyberState(reset, L) === 'new');

    // The next step
    const p = C.freshState(); C.importPath(p, 'path.core');
    const first = C.cyberPlan(p, '2026-10-12');
    check('the next step starts at the first lesson on your path, as New', first.step.kind === 'lesson' && first.step.lessonId === C.pathIds(p)[0] && first.step.state === 'new' && first.reason === 'Next on your path.');
    const path = C.pathIds(p), a0 = path[0], a1 = path[1];
    C.markCyberReady(p, C.factsOf(a0), '2026-10-01');
    const afterReady = C.cyberPlan(p, '2026-10-12');
    check('once it\'s ready, the next lesson; with its checks back in revision, revision first', afterReady.step.lessonId === a1 && afterReady.step.kind === 'revise' && afterReady.step.due === C.factsOf(a0).checks.length && /back in revision today/.test(afterReady.reason));
    check('…today\'s gentle stop reached: the lesson itself', (() => { const q = JSON.parse(JSON.stringify(p)); for (let i = 0; i < 10; i++) q.study.reviews.push({ id: 'g' + i, conceptId: 'x' + i, title: 'x', date: '2026-10-12', at: '2026-10-12T09:00', kind: 'written', outcome: 'right', graded: 'self', chosen: null, support: 'own', rating: 'good', gap: 1, due: null }); return C.cyberPlan(q, '2026-10-12').step.kind === 'lesson'; })());
    const weak = C.buildsOn(a1).find(id => path.includes(id));
    if (weak) {
      C.flagCyberRevisit(p, weak, 'the boundary', '2026-10-12');
      const rp = C.cyberPlan(p, '2026-10-12');
      check('a lesson the next one builds on that needs revision comes first, saying why in your words', rp.step.kind === 'revisit' && rp.step.lessonId === weak && rp.reason.includes('the boundary') && rp.length.mode !== 'practical');
      C.clearCyberRevisit(p, weak);
    } else check('(the second lesson builds on the first)', false, C.buildsOn(a1));
    for (const id of path) C.markCyberReady(p, C.factsOf(id), '2026-10-01');
    const done = C.cyberPlan(p, '2026-11-30');
    check('every lesson on your path ready: complete, and Study says so', done.complete && done.step.kind === 'complete' && C.cyberGlance(p).done === path.length);
    check('the glance counts in words: done, holding, needs revision, never a percentage', C.cyberGlance(p).path === path.length && C.cyberGlance(p).holding === 0 && C.cyberGlance(p).needs.length === 0);
  }

  fs.rmSync(dir, { recursive: true, force: true });
  const s = summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
