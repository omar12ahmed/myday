// Milestones and decisions on a project (app/src/data/projectPlan.ts, read and kept by projects.ts), on the app's own
// code bundled for Node, with made-up projects: a project without them is unchanged, unknown fields are kept, adding,
// editing, reaching, moving and removing milestones, decisions with 1-4 options and their pros and cons, deciding and
// "Think again" (nothing lost), repairs when reading, the limits, the project's "updated" time, "Recently", and
// deleting a project. No browser.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { execFileSync } = require('child_process');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = o => JSON.parse(JSON.stringify(o));

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const dir = path.join(os.tmpdir(), `myday-projects-rules-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  const src = p => JSON.stringify(path.join(ROOT, 'app/src/data', p));
  fs.writeFileSync(path.join(dir, 'kit.ts'), [
    `export * from ${src('projectRecords')};`, `export * from ${src('projectPlan')};`, `export * from ${src('businessModel')};`, `export * from ${src('caseFile')};`, `export { normalizeProjects, deleteProject, recently, addProject, setProjectPrivate, editProject, setLeftOff, privateProjectIds, comingUp, stillOpen } from ${src('projects')};`,
    `export { freshState, normalize } from ${src('normalize')};`, `export { shift, shortDate } from ${src('dates')};`, `export * from ${src('projectDashboard')};`, `export * from ${src('weekReview')};`, `export { stepsForToday, nextStep, whyNext } from ${src('projects')};`,
    `export { normalizeStudyLinks, addStudyLink, removeStudyLink, setStudyLinkWhy, linkView, courseChoices, bookChoices, linkedFrom, tidyWhy, LINK_LIMITS } from ${src('studyLinks')};`, `export * as Cyber from ${JSON.stringify(path.join(ROOT, 'app/src/projects/learningCyber'))};`, `export { stIndex } from ${src('study/roadmap')};`,
    `export { webAddress, siteOf, resourceName, normalizeResources, addResource, editResource, removeResource, canOpen, tidyText, RESOURCE_LIMITS } from ${src('projectResources')};`,
    `export { searchProject, fold, matchCount, SEARCH_KIND_LABEL } from ${src('projectSearch')};`,
    `export { normalizeTasks, setWaiting, stopWaiting, isWaiting, chaseTask, chaseWaiting, isStuck, setTaskDone, inQueue, onTodaysPlan, unstick } from ${src('tasks')};`,
    `export { stepsText, allStepsDone, addStep, editStep, tickStep, moveStep, removeStep, startsAfter, startsAfterText, afterChoices, setStartsAfter, removeTask, TASK_LIMITS } from ${src('tasks')};`,
    `export { linkTask, heldBack } from ${src('projects')};`,
    `export { needsYou, GROUP_LABEL as NEED_GROUP_LABEL } from ${src('attention')};`,
    `export { SECTIONS, isHidden, sectionContent, overviewSections, setHidden, hiddenWords, openOnArrival, arriving, arrived } from ${src('projectSections')};`,
    `export { setDone, clearDay, toggleRoll, followQueued, taskFromQueue, sendToQueue } from ${src('plan')};`, `export { doneOn as doneOnDay } from ${src('dashboard')};`,
  ].join('\n'));
  const K = await import(pathToFileURL(await bundle(path.join(dir, 'kit.ts'), path.join(dir, 'out'))).href);
  const OLD = '2026-10-01T09:00';
  const base = (id = 'pjA', x = {}) => ({ id, title: 'Coffee subscription', summary: 'For offices', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: OLD, updatedAt: OLD, ...x });
  const world = (...ps) => { const d = K.freshState(); d.projects.items = ps; return d; };
  const P = d => d.projects.items[0];
  // Everything about the project that the milestones and decisions must never touch.
  const rest = d => clone({ days: d.days, tasks: d.tasks, notes: d.notes, stage: P(d).stage, status: P(d).status, title: P(d).title, summary: P(d).summary });

  console.log('\n[1] A project without them is left exactly as it was; unknown fields are kept');
  let rep = { dropped: 0 };
  const plain = base('pjA', { futureThing: { a: 1 } });
  let out = K.normalizeProjects({ items: [clone(plain)] }, rep);
  check('a project without milestones or decisions is read back exactly as it was (deep-equal)', eq(out.items[0], plain) && rep.dropped === 0, out.items[0]);
  check('…with neither field, and its unknown field kept', !('milestones' in out.items[0]) && !('decisions' in out.items[0]) && eq(out.items[0].futureThing, { a: 1 }));
  const rich = base('pjB', {
    futureThing: { a: 1 },
    milestones: [{ id: 'msA', title: 'First order', aim: '2026-11-01', reachedOn: null, createdAt: OLD, futureBit: 'm' }],
    decisions: [{ id: 'dcA', question: 'Which roaster?', options: [{ id: 'opA', text: 'Local', pros: ['Fresh'], cons: [], futureBit: 'o' }], chosen: 'opA', why: 'Closest', decidedOn: '2026-10-05', createdAt: OLD, updatedAt: OLD, futureBit: 'd' }],
  });
  rep = { dropped: 0 };
  out = K.normalizeProjects({ items: [clone(rich)] }, rep);
  check('a project with milestones and decisions is read back exactly as it was', eq(out.items[0], rich) && rep.dropped === 0, out.items[0]);
  check('unknown fields inside a milestone, a decision and an option are kept', out.items[0].milestones[0].futureBit === 'm' && out.items[0].decisions[0].futureBit === 'd' && out.items[0].decisions[0].options[0].futureBit === 'o');

  console.log('\n[2] Milestones');
  let d = world(base());
  const before = rest(d);
  const m1 = K.addMilestone(d, 'pjA', '  Sign up the first office  ', '2026-11-01');
  const m2 = K.addMilestone(d, 'pjA', 'Second roaster');
  check('a milestone is added at the end, with its title trimmed and its date to aim for', eq(P(d).milestones.map(m => m.title), ['Sign up the first office', 'Second roaster']) && P(d).milestones[0].aim === '2026-11-01' && P(d).milestones[0].reachedOn === null);
  check('the aim is optional, and one that isn\'t a date is ignored', P(d).milestones[1].aim === null && K.addMilestone(d, 'pjA', 'Odd aim', 'soon') && P(d).milestones[2].aim === null);
  check('a blank title, or a project that isn\'t there, adds nothing (null)', K.addMilestone(d, 'pjA', '   ') === null && K.addMilestone(d, 'pjNope', 'x') === null && P(d).milestones.length === 3);
  check('editing the title changes it; the same title changes nothing', K.editMilestone(d, 'pjA', m2, { title: 'Second roaster signed' }) && P(d).milestones[1].title === 'Second roaster signed' && !K.editMilestone(d, 'pjA', m2, { title: 'Second roaster signed' }));
  check('the aim can be changed, and cleared with null', K.editMilestone(d, 'pjA', m2, { aim: '2026-12-01' }) && P(d).milestones[1].aim === '2026-12-01' && K.editMilestone(d, 'pjA', m2, { aim: null }) && P(d).milestones[1].aim === null);
  check('a blank title in an edit is refused (the old one stays)', !K.editMilestone(d, 'pjA', m2, { title: '  ' }) && P(d).milestones[1].title === 'Second roaster signed');
  check('reached sets the day it was reached', K.setReached(d, 'pjA', m1, true, '2026-10-12') && P(d).milestones[0].reachedOn === '2026-10-12');
  check('reached again changes nothing; undoing it clears the day', !K.setReached(d, 'pjA', m1, true, '2026-10-13') && P(d).milestones[0].reachedOn === '2026-10-12' && K.setReached(d, 'pjA', m1, false) && P(d).milestones[0].reachedOn === null && !K.setReached(d, 'pjA', m1, false));
  check('milestoneProgress counts reached out of all, and the next is the first not reached', eq((({ reached, total, next }) => [reached, total, next && next.id])(K.milestoneProgress(P(d))), [0, 3, m1]));
  K.setReached(d, 'pjA', m1, true, '2026-10-12');
  check('…and moves on once the first is reached', eq((({ reached, total, next }) => [reached, total, next && next.id])(K.milestoneProgress(P(d))), [1, 3, m2]));
  check('a project with none has progress 0 of 0 and no next', eq(K.milestoneProgress(base('pjZ')), { reached: 0, total: 0, next: null }));
  const order = () => P(d).milestones.map(m => m.title);
  check('moving down swaps with the next one, moving up swaps back', K.moveMilestone(d, 'pjA', m1, 1) && order()[1] === 'Sign up the first office' && K.moveMilestone(d, 'pjA', m1, -1) && order()[0] === 'Sign up the first office');
  check('the first can\'t go up and the last can\'t go down', !K.moveMilestone(d, 'pjA', m1, -1) && !K.moveMilestone(d, 'pjA', P(d).milestones[2].id, 1) && order()[0] === 'Sign up the first office');
  check('removing one takes it out and keeps the others in order', K.removeMilestone(d, 'pjA', m2) && eq(order(), ['Sign up the first office', 'Odd aim']) && !K.removeMilestone(d, 'pjA', m2));
  K.removeMilestone(d, 'pjA', P(d).milestones[1].id); K.removeMilestone(d, 'pjA', m1);
  check('when the last one goes, the project has no milestones field again (as before)', !('milestones' in P(d)) && eq(Object.keys(P(d)).sort(), Object.keys(base()).sort()), Object.keys(P(d)));
  d = world(base());
  for (let i = 0; i < 30; i++) K.addMilestone(d, 'pjA', 'Step ' + i);
  check('the 30th milestone is accepted', P(d).milestones.length === 30);
  check('a 31st returns "full" and adds nothing', K.addMilestone(d, 'pjA', 'One more') === 'full' && P(d).milestones.length === 30);

  console.log('\n[3] Decisions, options, pros and cons');
  d = world(base());
  const dA = K.addDecision(d, 'pjA', '  Which roaster should we start with?  ');
  const X = () => P(d).decisions.find(x => x.id === dA);
  check('a decision starts with its question (trimmed), no options and nothing chosen', X().question === 'Which roaster should we start with?' && eq(X().options, []) && X().chosen === null && X().decidedOn === null && X().why === '');
  check('a blank question adds nothing (null)', K.addDecision(d, 'pjA', '  ') === null && K.addDecision(d, 'pjNope', 'x') === null && P(d).decisions.length === 1);
  check('the question can be edited (not to blank)', K.editQuestion(d, 'pjA', dA, 'Which roaster first?') && X().question === 'Which roaster first?' && !K.editQuestion(d, 'pjA', dA, ' ') && !K.editQuestion(d, 'pjA', dA, 'Which roaster first?'));
  const oA = K.addOption(d, 'pjA', dA, 'Local roaster');
  check('a decision can have a single option, and it can be chosen', X().options.length === 1 && K.decide(d, 'pjA', dA, oA, '', '2026-10-10') && X().chosen === oA);
  K.thinkAgain(d, 'pjA', dA);
  const oB = K.addOption(d, 'pjA', dA, 'Online wholesaler'), oC = K.addOption(d, 'pjA', dA, 'Import direct'), oD = K.addOption(d, 'pjA', dA, 'Buy a roaster');
  check('up to four options are accepted', X().options.length === 4);
  check('a 5th option returns "full" and adds nothing; a blank option adds nothing (null)', K.addOption(d, 'pjA', dA, 'A fifth') === 'full' && X().options.length === 4 && K.addOption(d, 'pjA', dA, ' ') === null);
  check('an option\'s text can be edited', K.editOption(d, 'pjA', dA, oB, 'Online wholesale') && X().options[1].text === 'Online wholesale' && !K.editOption(d, 'pjA', dA, oB, 'Online wholesale'));
  for (let i = 1; i <= 10; i++) { K.addPoint(d, 'pjA', dA, oA, 'pros', 'Pro ' + i); K.addPoint(d, 'pjA', dA, oA, 'cons', 'Con ' + i); }
  check('ten pros and ten cons are accepted', X().options[0].pros.length === 10 && X().options[0].cons.length === 10);
  check('an 11th pro or con returns "full" and adds nothing', K.addPoint(d, 'pjA', dA, oA, 'pros', 'Pro 11') === 'full' && K.addPoint(d, 'pjA', dA, oA, 'cons', 'Con 11') === 'full' && X().options[0].pros.length === 10 && X().options[0].cons.length === 10);
  check('a blank point adds nothing (false)', K.addPoint(d, 'pjA', dA, oB, 'pros', '  ') === false && X().options[1].pros.length === 0);
  check('a point can be edited', K.editPoint(d, 'pjA', dA, oA, 'pros', 1, 'Fresher beans') && X().options[0].pros[1] === 'Fresher beans' && !K.editPoint(d, 'pjA', dA, oA, 'pros', 1, 'Fresher beans'));
  check('a blank edit removes the point', K.editPoint(d, 'pjA', dA, oA, 'cons', 0, '  ') && X().options[0].cons.length === 9 && X().options[0].cons[0] === 'Con 2');
  check('removePoint takes one out by its place; a place that isn\'t there changes nothing', K.removePoint(d, 'pjA', dA, oA, 'pros', 0) && X().options[0].pros[0] === 'Fresher beans' && X().options[0].pros.length === 9 && !K.removePoint(d, 'pjA', dA, oA, 'pros', 9));
  K.removePoint(d, 'pjA', dA, oA, 'pros', 4); // keep it short
  const stage0 = P(d).stage;
  check('deciding sets the chosen option, the day and the reasons', K.decide(d, 'pjA', dA, oB, '  Cheapest to start  ', '2026-10-12') && X().chosen === oB && X().decidedOn === '2026-10-12' && X().why === 'Cheapest to start');
  check('an option that isn\'t there can\'t be chosen', !K.decide(d, 'pjA', dA, 'opNope', '', '2026-10-13') && X().chosen === oB);
  check('the reasons can be edited afterwards', K.editWhy(d, 'pjA', dA, 'Cheapest and quick') && X().why === 'Cheapest and quick' && !K.editWhy(d, 'pjA', dA, 'Cheapest and quick'));
  check('pros and cons can still be added after deciding', K.addPoint(d, 'pjA', dA, oB, 'pros', 'Delivers weekly') === true && X().options[1].pros.includes('Delivers weekly') && X().chosen === oB);
  const snapshot = clone(X());
  check('think again clears the choice and the day, and remembers the last choice', K.thinkAgain(d, 'pjA', dA) && X().chosen === null && X().decidedOn === null && eq(X().lastChoice, { text: 'Online wholesale', on: '2026-10-12' }), X());
  check('…and keeps the question, options, pros, cons and reasons', X().question === snapshot.question && eq(X().options, snapshot.options) && X().why === 'Cheapest and quick');
  check('think again on a decision that is open changes nothing', !K.thinkAgain(d, 'pjA', dA));
  check('pros and cons can be added after reopening', K.addPoint(d, 'pjA', dA, oC, 'cons', 'Slow shipping') === true && X().options[2].cons.includes('Slow shipping'));
  K.decide(d, 'pjA', dA, oC, '', '2026-10-14');
  check('removing a different option than the chosen one says "removed" and keeps the choice', K.removeOption(d, 'pjA', dA, oD) === 'removed' && X().chosen === oC && X().options.length === 3);
  check('removing the chosen option says "reopened", clears the choice and remembers it', K.removeOption(d, 'pjA', dA, oC) === 'reopened' && X().chosen === null && X().decidedOn === null && eq(X().lastChoice, { text: 'Import direct', on: '2026-10-14' }) && X().options.length === 2, X());
  check('removing an option that isn\'t there returns null', K.removeOption(d, 'pjA', dA, 'opNope') === null);
  const dB = K.addDecision(d, 'pjA', 'Second question');
  check('removing a decision takes it out; the last one going leaves no decisions field', K.removeDecision(d, 'pjA', dA) && !K.removeDecision(d, 'pjA', dA) && P(d).decisions.length === 1 && K.removeDecision(d, 'pjA', dB) && !('decisions' in P(d)));
  d = world(base());
  for (let i = 0; i < 12; i++) K.addDecision(d, 'pjA', 'Question ' + i);
  check('the 12th decision is accepted; a 13th returns "full" and adds nothing', P(d).decisions.length === 12 && K.addDecision(d, 'pjA', 'One too many') === 'full' && P(d).decisions.length === 12);

  console.log('\n[4] Decisions in order');
  d = world(base());
  const mk = (id, q, created, chosen, on, upd) => ({ id, question: q, options: [{ id: id + 'o', text: 'Yes', pros: [], cons: [] }], chosen: chosen ? id + 'o' : null, why: '', decidedOn: on || null, createdAt: created, updatedAt: upd || created });
  P(d).decisions = [mk('d1', 'Old open', '2026-10-01T09:00'), mk('d2', 'Decided early', '2026-10-02T09:00', true, '2026-10-03'), mk('d3', 'New open', '2026-10-05T09:00'), mk('d4', 'Decided lately', '2026-10-01T10:00', true, '2026-10-09')];
  check('open decisions come first, newest first; then decided ones, most recently decided first', eq(K.decisionsInOrder(P(d)).map(x => x.id), ['d3', 'd1', 'd4', 'd2']), K.decisionsInOrder(P(d)).map(x => x.id));
  check('the chosen option is found for a decided decision, and none for an open one', K.chosenOption(P(d).decisions[1]).text === 'Yes' && K.chosenOption(P(d).decisions[0]) === null);

  console.log('\n[5] Reading what is saved: repairs, and nothing lost silently');
  rep = { dropped: 0 };
  const o = K.normalizeProjects({ items: [base('pjR', { milestones: [{ id: 'm1', title: 'Fine' }, { id: 'm2', title: '   ' }, { title: 'No id' }, { id: 'm1', title: 'Same id' }, 'not a milestone'] })] }, rep).items[0];
  check('a milestone without a title or id (or not an object) is dropped and counted', eq(o.milestones.map(m => m.title), ['Fine', 'Same id']) && rep.dropped === 3, [o.milestones, rep]);
  check('a duplicate id gets a new one', o.milestones[0].id === 'm1' && o.milestones[1].id !== 'm1' && !!o.milestones[1].id);
  check('a milestone missing its dates is read with none (aim and reached null)', o.milestones[0].aim === null && o.milestones[0].reachedOn === null);
  rep = { dropped: 0 };
  const c = K.normalizeProjects({ items: [base('pjR', { decisions: [{ id: 'x1', question: 'Q?', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], chosen: 'zzz', decidedOn: '2026-10-05', why: 'because' }] })] }, rep).items[0].decisions[0];
  check('a chosen option that isn\'t one of the options becomes null, with no decided day', c.chosen === null && c.decidedOn === null && c.why === 'because', c);
  check('options with no pros or cons are read with empty lists', eq(c.options.map(x => [x.pros, x.cons]), [[[], []], [[], []]]));
  rep = { dropped: 0 };
  const w = K.normalizeProjects({ items: [base('pjR', { milestones: 'oops', decisions: { a: 1 } })] }, rep).items[0];
  check('a milestones or decisions that isn\'t a list is dropped and counted (twice)', !('milestones' in w) && !('decisions' in w) && rep.dropped === 2, [w, rep]);
  check('empty lists are left out, as for a project that never had any', !('milestones' in K.normalizeProjects({ items: [base('pjR', { milestones: [], decisions: [] })] }, { dropped: 0 }).items[0]) && !('decisions' in K.normalizeProjects({ items: [base('pjR', { decisions: [] })] }, { dropped: 0 }).items[0]));
  rep = { dropped: 0 };
  const dd = K.normalizeProjects({ items: [base('pjR', { decisions: [{ id: 'x1', question: 'Q?', options: [{ id: 'a', text: 'A' }, { id: 'a', text: 'A2' }, { text: 'No id' }] }, { id: 'x1', question: 'Same id' }, { id: 'x3', question: ' ' }] })] }, rep).items[0].decisions;
  check('duplicate decision or option ids get new ones; an option without an id and a decision without a question are dropped and counted', dd.length === 2 && dd[0].id !== dd[1].id && dd[0].options.length === 2 && dd[0].options[0].id !== dd[0].options[1].id && rep.dropped === 2, [dd, rep]);

  console.log('\n[5a] Previous choices keep their own reasons and dates');
  {
    const h = world(base()), id = K.addDecision(h, 'pjA', 'Which chair?');
    const a = K.addOption(h, 'pjA', id, 'Restore the spare'), b = K.addOption(h, 'pjA', id, 'Buy a chair');
    const current = () => P(h).decisions[0];
    K.decide(h, 'pjA', id, a, 'Fits the room\nAlready here', '2025-12-31');
    check('a first choice has no previous choices and adds no history field', K.decisionHistory(current()).length === 0 && !('history' in current()));
    K.thinkAgain(h, 'pjA', id);
    const first = clone(current().history[0]);
    check('reopening snapshots the label, full reason and actual decision day', first.text === 'Restore the spare' && first.why === 'Fits the room\nAlready here' && first.on === '2025-12-31' && !!first.id);
    K.decide(h, 'pjA', id, b, 'More comfortable', '2026-01-01');
    K.editOption(h, 'pjA', id, a, 'Give away the spare');
    K.editWhy(h, 'pjA', id, 'Tried it and it supports my back');
    check('choosing again and editing options or current reasons cannot rewrite an earlier snapshot', eq(current().history, [first]));
    check('an identical repeated choice is a no-op, with no duplicate history', K.decide(h, 'pjA', id, b, current().why, '2026-01-01') === false && eq(current().history, [first]));
    check('removing the selected option still reopens the decision', K.removeOption(h, 'pjA', id, b) === 'reopened' && current().chosen === null);
    check('the removed option and its final reason remain readable in history', eq(current().history.map(x => [x.text, x.why, x.on]), [['Restore the spare', first.why, '2025-12-31'], ['Buy a chair', 'Tried it and it supports my back', '2026-01-01']]) && current().options.length === 1);
    const before = clone(current());
    check('reopening an already open decision does not duplicate the last snapshot', K.thinkAgain(h, 'pjA', id) === false && eq(current(), before));
    K.decide(h, 'pjA', id, a, '', '2026-01-01');
    K.decide(h, 'pjA', id, a, 'After a second try', '2026-01-01');
    check('directly replacing a choice also preserves the prior choice, including an explicitly blank reason', current().history.at(-1).why === '' && current().history.at(-1).text === 'Give away the spare');
    for (let i = 0; i < 45; i++) { K.thinkAgain(h, 'pjA', id); K.decide(h, 'pjA', id, a, 'Try ' + i, '2026-01-01'); }
    check('repeated choices on the same day retain their sequence without a silent history cap', current().history.length === 48 && current().history.at(-1).why === 'Try 43' && new Set(current().history.map(x => x.id)).size === 48);
    const norm = K.normalizeProjects(clone(h.projects), { dropped: 0 });
    check('all previous choices round-trip through normalisation in the same order', eq(norm.items[0].decisions[0].history, current().history));

    const legacy = world(base('pjA', { decisions: [{ ...clone(current()), history: undefined, chosen: null, decidedOn: null, why: 'Old reason', lastChoice: { text: 'Old option', on: '2024-02-29', future: { kept: true } } }] }));
    const old = () => P(legacy).decisions[0], oldBefore = clone(old());
    check('reading an older open decision recovers its one known reason without rewriting saved data', K.decisionHistory(old())[0].why === 'Old reason' && eq(old(), oldBefore));
    K.decide(legacy, 'pjA', id, a, 'A new reason', '2026-01-02');
    check('choosing again explicitly carries the old record forward before overwriting its reason', old().history[0].why === 'Old reason' && old().history[0].on === '2024-02-29' && old().history[0].future.kept && old().why === 'A new reason');
    K.thinkAgain(legacy, 'pjA', id);
    check('reopening after that conversion adds the new choice exactly once', old().history.length === 2 && old().history[1].why === 'A new reason');
    delete old().history; old().chosen = a; old().decidedOn = '2026-01-03'; old().why = 'Current reason';
    check('an already decided legacy record never attributes the current reason to its previous choice', K.decisionHistory(old())[0].why === null);
    K.thinkAgain(legacy, 'pjA', id);
    check('both the unknown older reason and the known current reason survive conversion', old().history.length === 2 && old().history[0].why === null && old().history[1].why === 'Current reason');

    const report = { dropped: 0 }, rawHistory = [{ id: 'h1', text: 'Archived', on: '2026-01-01', why: '', future: { kept: true } }, { id: 'h1', text: 'Again', on: '2026-01-01', why: null }, { id: 'bad', text: 'Bad date', on: '2026-02-30' }, null];
    const read = K.normalizeDecisions([{ ...current(), history: rawHistory }], report)[0].history;
    check('history preserves unknown fields and distinguishes absent reasons from blank ones', read[0].future.kept && read[0].why === '' && read[1].why === null);
    check('unreadable history entries are reported and duplicate ids are repaired', report.dropped === 2 && read.length === 2 && read[0].id !== read[1].id);
    const invalid = { dropped: 0 };
    check('a malformed history collection is reported rather than silently lost', !('history' in K.normalizeDecisions([{ ...current(), history: {} }], invalid)[0]) && invalid.dropped === 1);

    const big = world(base()), bigId = K.addDecision(big, 'pjA', 'Which?'), bigOpt = K.addOption(big, 'pjA', bigId, 'This one');
    K.decide(big, 'pjA', bigId, bigOpt, 'A'.repeat(600), '2026-01-01');
    const decisionCore = P(big).decisions[0]; decisionCore.futurePadding = '';
    decisionCore.futurePadding = 'x'.repeat(380000 - K.recordBytes(K.splitProject(P(big)).find(x => x.kind === 'project_decision').content));
    const bigBefore = clone(big);
    check('a history snapshot that exceeds the shared byte allowance is refused atomically', K.thinkAgain(big, 'pjA', bigId) === 'big' && eq(big, bigBefore), K.projectBytes(P(big)));
    const removeBig = clone(big);
    check('removing a selected option can shrink its core while archiving the complete reason separately', K.removeOption(removeBig, 'pjA', bigId, bigOpt) === 'reopened' && P(removeBig).decisions[0].history[0].why.length === 600 && !P(removeBig).decisions[0].options.length);
    check('replacing a current choice is also atomic at the size boundary', K.decide(big, 'pjA', bigId, bigOpt, 'B'.repeat(600), '2026-01-02') === 'big' && eq(big, bigBefore));
    delete P(big).decisions[0].futurePadding;
    check('making room allows reopening, retaining the complete reason', K.thinkAgain(big, 'pjA', bigId) === true && P(big).decisions[0].history[0].why.length === 600);
  }

  console.log('\n[6] Every change moves the project on, and touches nothing else');
  d = world(base());
  d.tasks.items = [{ id: 'tkA', title: 'Ring two roasters', projectId: 'pjA' }];
  d.notes.items = [{ id: 'n1', title: 'A note', text: 'x', projectId: 'pjA' }];
  d.days['2026-10-10'] = { energy: 3, rest: false, builtAt: '2026-10-10T08:00', checkedIn: true, tasks: [] };
  const ctx = rest(d);
  let id1, id2, dx, ox;
  const steps = [
    ['adding a milestone', () => { id1 = K.addMilestone(d, 'pjA', 'M one', '2026-11-01'); }],
    ['editing a milestone', () => K.editMilestone(d, 'pjA', id1, { title: 'M uno' })],
    ['reaching a milestone', () => K.setReached(d, 'pjA', id1, true, '2026-10-11')],
    ['moving a milestone', () => { id2 = K.addMilestone(d, 'pjA', 'M two'); return K.moveMilestone(d, 'pjA', id2, -1); }],
    ['removing a milestone', () => K.removeMilestone(d, 'pjA', id2)],
    ['adding a decision', () => { dx = K.addDecision(d, 'pjA', 'Which?'); }],
    ['editing the question', () => K.editQuestion(d, 'pjA', dx, 'Which one?')],
    ['adding an option', () => { ox = K.addOption(d, 'pjA', dx, 'This one'); }],
    ['editing an option', () => K.editOption(d, 'pjA', dx, ox, 'That one')],
    ['adding a pro', () => K.addPoint(d, 'pjA', dx, ox, 'pros', 'Cheap')],
    ['editing a point', () => K.editPoint(d, 'pjA', dx, ox, 'pros', 0, 'Very cheap')],
    ['deciding', () => K.decide(d, 'pjA', dx, ox, 'Why not', '2026-10-12')],
    ['editing the reasons', () => K.editWhy(d, 'pjA', dx, 'Other reasons')],
    ['thinking again', () => K.thinkAgain(d, 'pjA', dx)],
    ['removing a point', () => K.removePoint(d, 'pjA', dx, ox, 'pros', 0)],
    ['removing an option', () => K.removeOption(d, 'pjA', dx, ox)],
    ['removing a decision', () => K.removeDecision(d, 'pjA', dx)],
  ];
  for (const [name, run] of steps) {
    P(d).updatedAt = OLD;
    run();
    check(`${name} moves the project's updated time on`, P(d).updatedAt > OLD, P(d).updatedAt);
  }
  check('none of that touched the days, tasks, notes, or the project\'s title, summary, stage or status', eq(rest(d), ctx));

  console.log('\n[7] Recently, and deleting a project');
  d = world(base());
  d.tasks.items = [{ id: 'tkA', title: 'Ring roasters', projectId: 'pjA', done: false, doneOn: null, createdAt: '2026-10-02T09:00' }, { id: 'tkB', title: 'Call the bank', projectId: 'pjA', done: true, doneOn: '2026-10-08', createdAt: '2026-10-03T09:00' }];
  d.notes.items = [{ id: 'n1', categoryId: '', title: '', text: 'Roasters sell per kilo', pinned: false, createdAt: '2026-10-04T09:00', updatedAt: '2026-10-04T09:00', projectId: 'pjA' }];
  const ms1 = K.addMilestone(d, 'pjA', 'First office signed');
  K.setReached(d, 'pjA', ms1, true, '2026-10-09');
  const dq = K.addDecision(d, 'pjA', 'Which roaster?'), dop = K.addOption(d, 'pjA', dq, 'Local roaster');
  K.decide(d, 'pjA', dq, dop, '', '2026-10-10');
  K.addDecision(d, 'pjA', 'Still open'); // not listed
  let rc = K.recently(d, P(d), 10);
  const mil = rc.find(h => h.what === 'milestone'), dec = rc.find(h => h.what === 'decided');
  check('a reached milestone is listed, with its title and a link to the Milestones tab', mil && mil.title === 'First office signed' && mil.href === '#projects/p/pjA/milestones', rc);
  check('a decision made is listed as "<question> — <option>", with a link to the Decisions tab', dec && dec.title === 'Which roaster? — Local roaster' && dec.href === '#projects/p/pjA/decisions', rc);
  check('an open decision and a milestone not yet reached are not listed', rc.length === 6 && !rc.some(h => h.title === 'Still open'));
  check('they sit among the tasks and notes, newest first', eq(rc.map(h => h.what + ':' + h.title), ['decided:Which roaster? — Local roaster', 'milestone:First office signed', 'done:Call the bank', 'note:Roasters sell per kilo', 'added:Call the bank', 'added:Ring roasters']), rc.map(h => h.what + ':' + h.title));
  d.notes.items.push({ id: 'n9', categoryId: '', title: '', text: 'Unrelated', pinned: false, createdAt: OLD, updatedAt: OLD });
  const plainP = base('pjQ'); d.projects.items.push(plainP);
  check('a project without any gets no such happenings', K.recently(d, plainP, 10).length === 0);
  check('deleting the project removes it with its milestones and decisions', K.deleteProject(d, 'pjA') && !d.projects.items.some(p => p.id === 'pjA') && !JSON.stringify(d.projects).includes('First office signed') && !JSON.stringify(d.projects).includes('Which roaster?'));
  check('…but keeps its notes and tasks, just no longer linked to it', d.notes.items.length === 2 && d.tasks.items.length === 2 && d.notes.items.concat(d.tasks.items).every(x => !('projectId' in x)));

  console.log('\n[8] Private projects (your switch)');
  d = world(base('pjA'), base('pjB'));
  const ctxP = rest(d);
  P(d).updatedAt = OLD;
  check('making a project private sets private: true and moves its updated time on', K.setProjectPrivate(d, 'pjA', true) && P(d).private === true && P(d).updatedAt > OLD, P(d));
  check('making it private again changes nothing (false)', !K.setProjectPrivate(d, 'pjA', true));
  check('privateProjectIds lists only the private ones', eq([...K.privateProjectIds(d)], ['pjA']));
  P(d).updatedAt = OLD;
  check('turning it off removes the field altogether and moves the updated time on', K.setProjectPrivate(d, 'pjA', false) && !('private' in P(d)) && P(d).updatedAt > OLD, P(d));
  check('turning it off again changes nothing (false), and a project that isn\'t there is false either', !K.setProjectPrivate(d, 'pjA', false) && !K.setProjectPrivate(d, 'pjNope', true) && K.privateProjectIds(d).size === 0);
  check('the switch touched nothing else about the project, its days, tasks or notes', eq(rest(d), ctxP));
  rep = { dropped: 0 };
  out = K.normalizeProjects({ items: [base('pjA', { private: true }), base('pjB', { private: false }), base('pjC', { private: 'yes' }), base('pjD', { private: 1 }), base('pjE')] }, rep);
  check('reading saved projects keeps private: true and drops any other value', out.items[0].private === true && ['pjB', 'pjC', 'pjD', 'pjE'].every((id, i) => !('private' in out.items[i + 1])) && rep.dropped === 0, out.items);

  console.log('\n[9] The Business template: kind of project and its one page');
  {
    const AO = (id, text, x = {}) => ({ id, text, state: 'open', found: '', checkedOn: null, taskId: null, createdAt: OLD, ...x });
    const read = (x, r = { dropped: 0 }) => K.normalizeProjects({ items: [base('pjT', x)] }, r).items[0];
    let r9 = { dropped: 0 };
    let o9 = read({}, r9);
    check('a project without a template or model gets neither key when read', !('template' in o9) && !('model' in o9) && r9.dropped === 0, o9);
    check('the template "business" is kept when read', read({ template: 'business' }).template === 'business');
    check('a template from a newer MyDay ("case") is kept as it is', read({ template: 'case' }).template === 'case');
    check('"general", an empty string, a number and a 41-character string are removed', ['general', '', 7, 'x'.repeat(41)].every(t => !('template' in read({ template: t }))));
    check('a 40-character template is kept', read({ template: 'x'.repeat(40) }).template === 'x'.repeat(40));

    r9 = { dropped: 0 };
    o9 = read({ model: { problem: 'Slow lunches', futureField: { a: 1 }, assumptions: [AO('asA', 'Sites will pay', { futureBit: 'x' })] } }, r9);
    check('unknown fields on the model and on an assumption are kept', eq(o9.model.futureField, { a: 1 }) && o9.model.assumptions[0].futureBit === 'x' && r9.dropped === 0, o9.model);
    r9 = { dropped: 0 };
    o9 = read({ model: { assumptions: [{ text: 'No id', state: 'open' }, AO('asB', '   '), AO('asC', 'Kept')] } }, r9);
    check('an assumption with no id, or with blank text, is dropped and counted', eq(o9.model.assumptions.map(a => a.id), ['asC']) && r9.dropped === 2, [o9.model, r9]);
    o9 = read({ model: { assumptions: [AO('asA', 'First'), AO('asA', 'Second')] } });
    check('a repeated assumption id gets a new id starting "as"', o9.model.assumptions[0].id === 'asA' && o9.model.assumptions[1].id !== 'asA' && o9.model.assumptions[1].id.startsWith('as'), o9.model.assumptions);
    o9 = read({ model: { assumptions: [AO('asA', 'Odd state', { state: 'maybe' })] } });
    check('an unknown assumption state becomes "open"', o9.model.assumptions[0].state === 'open');
    o9 = read({ model: { assumptions: [AO('asA', 'Open one', { checkedOn: '2026-10-05' }), AO('asB', 'Marked', { state: 'looks-true', checkedOn: '2026-10-05' })] } });
    check('an "open" assumption with a saved checked day has it cleared; a marked one with a valid day keeps it', o9.model.assumptions[0].checkedOn === null && o9.model.assumptions[1].checkedOn === '2026-10-05', o9.model.assumptions);
    const longAns = '  ' + 'a'.repeat(1100) + '  ';
    o9 = read({ model: { problem: longAns, who: 'Someone' } });
    check('an answer is cut to 1000 characters but not trimmed', o9.model.problem.length === 1000 && o9.model.problem.startsWith('  a') && o9.model.who === 'Someone', o9.model.problem.length);
    o9 = read({ model: { assumptions: [AO('asA', '  Sites   will\n pay  ' + 'z'.repeat(200), { found: 'f'.repeat(500) })] } });
    check('assumption text has its whitespace collapsed, is trimmed and is cut to 110', o9.model.assumptions[0].text.startsWith('Sites will pay z') && o9.model.assumptions[0].text.length === 110, o9.model.assumptions[0].text);
    check('what was found is cut to 400', o9.model.assumptions[0].found.length === 400);
    o9 = read({ model: { assumptions: [AO('asA', 'Task one', { taskId: '' }), AO('asB', 'Task two', { taskId: 'tkX' })] } });
    check('an empty task id is read as null, a real one is kept', o9.model.assumptions[0].taskId === null && o9.model.assumptions[1].taskId === 'tkX');
    o9 = read({ model: { problem: '  ', who: '', how: '\n', assumptions: [] } });
    check('a model with nothing written is removed', !('model' in o9), o9);
    o9 = read({ model: { problem: '', futureField: 1 } });
    check('an empty model that holds an unknown field is kept', 'model' in o9 && o9.model.futureField === 1, o9);
    r9 = { dropped: 0 };
    o9 = read({ model: 'oops' }, r9);
    check('a model that is not an object is removed and counted', !('model' in o9) && r9.dropped === 1, [o9, r9]);
    r9 = { dropped: 0 };
    o9 = read({ model: { problem: 'P', assumptions: 'oops' } }, r9);
    check('assumptions that are not a list are counted and read as none', eq(o9.model.assumptions, []) && r9.dropped === 1, [o9.model, r9]);

    // ---- Changing it ----
    d = world(base());
    const ctx9 = rest(d), other = base('pjOther'); d.projects.items.push(other); const otherBefore = clone(other);
    const up = () => { P(d).updatedAt = OLD; };
    up();
    check('setTemplate general to business sets "business" and moves the updated time on', K.setTemplate(d, 'pjA', 'business') && P(d).template === 'business' && P(d).updatedAt > OLD, P(d));
    up();
    check('setTemplate business to business changes nothing (false)', !K.setTemplate(d, 'pjA', 'business') && P(d).updatedAt === OLD);
    K.editAnswer(d, 'pjA', 'problem', 'Slow lunches');
    up();
    check('business back to general removes the template and keeps the model', K.setTemplate(d, 'pjA', 'general') && !('template' in P(d)) && P(d).model.problem === 'Slow lunches' && P(d).updatedAt > OLD, P(d));
    check('general to general changes nothing (false)', !K.setTemplate(d, 'pjA', 'general'));
    P(d).template = 'case'; up();
    check('an unknown template ("case") set to general is removed (true)', K.setTemplate(d, 'pjA', 'general') && !('template' in P(d)) && P(d).updatedAt > OLD, P(d));
    delete P(d).model;

    up();
    check('editAnswer trims what is typed', K.editAnswer(d, 'pjA', 'who', '  Site managers  ') && P(d).model.who === 'Site managers' && P(d).updatedAt > OLD, P(d).model);
    check('…and does nothing when it is unchanged', !K.editAnswer(d, 'pjA', 'who', 'Site managers '));
    K.editAnswer(d, 'pjA', 'how', 'h'.repeat(1200));
    check('…and cuts it to 1000 characters', P(d).model.how.length === 1000);
    check('editAnswer creates the model when there is none', (() => { const e = world(base('pjN')); return K.editAnswer(e, 'pjN', 'problem', 'P') && eq(e.projects.items[0].model, { problem: 'P', who: '', how: '', assumptions: [] }); })());
    check('blanking the only thing written removes the model field', (() => { const e = world(base('pjN')); K.editAnswer(e, 'pjN', 'problem', 'P'); return K.editAnswer(e, 'pjN', 'problem', '  ') && !('model' in e.projects.items[0]); })());

    d = world(base(), other);
    up();
    const a1 = K.addAssumption(d, 'pjA', '  Sites will pay  ');
    check('addAssumption returns an id starting "as" and moves the updated time on', typeof a1 === 'string' && a1.startsWith('as') && P(d).updatedAt > OLD, a1);
    check('…the new one is open, with nothing found, no checked day and no task', eq((({ state, found, checkedOn, taskId, text }) => ({ state, found, checkedOn, taskId, text }))(P(d).model.assumptions[0]), { state: 'open', found: '', checkedOn: null, taskId: null, text: 'Sites will pay' }), P(d).model.assumptions[0]);
    check('a blank assumption adds nothing (null)', K.addAssumption(d, 'pjA', '   ') === null && P(d).model.assumptions.length === 1);
    for (let i = 2; i <= 12; i++) K.addAssumption(d, 'pjA', 'Thing ' + i);
    check('the 12th assumption is accepted and the 13th returns "full"', P(d).model.assumptions.length === 12 && K.addAssumption(d, 'pjA', 'Thing 13') === 'full' && P(d).model.assumptions.length === 12);
    up();
    check('editAssumption with a blank text is refused and the text stays', !K.editAssumption(d, 'pjA', a1, '  ') && P(d).model.assumptions[0].text === 'Sites will pay' && P(d).updatedAt === OLD);
    check('…the same text changes nothing; a new text changes it', !K.editAssumption(d, 'pjA', a1, ' Sites will pay ') && K.editAssumption(d, 'pjA', a1, 'Sites will pay weekly') && P(d).model.assumptions[0].text === 'Sites will pay weekly' && P(d).updatedAt > OLD);
    up();
    check('editFound trims and cuts to 400', K.editFound(d, 'pjA', a1, '  ' + 'f'.repeat(450)) && P(d).model.assumptions[0].found === 'f'.repeat(400) && P(d).updatedAt > OLD);
    check('…and does nothing when unchanged', !K.editFound(d, 'pjA', a1, 'f'.repeat(400)));
    up();
    check('marking "looks-true" sets the checked day to the one given', K.setAssumptionState(d, 'pjA', a1, 'looks-true', '2026-10-12') && P(d).model.assumptions[0].state === 'looks-true' && P(d).model.assumptions[0].checkedOn === '2026-10-12' && P(d).updatedAt > OLD);
    check('marking "doesnt-hold" sets the checked day too', K.setAssumptionState(d, 'pjA', a1, 'doesnt-hold', '2026-10-13') && P(d).model.assumptions[0].state === 'doesnt-hold' && P(d).model.assumptions[0].checkedOn === '2026-10-13');
    check('back to "open" clears the checked day and keeps what was found', K.setAssumptionState(d, 'pjA', a1, 'open') && P(d).model.assumptions[0].checkedOn === null && P(d).model.assumptions[0].found === 'f'.repeat(400));
    check('the same state, or an unknown state, changes nothing (false)', !K.setAssumptionState(d, 'pjA', a1, 'open') && !K.setAssumptionState(d, 'pjA', a1, 'maybe', '2026-10-14') && P(d).model.assumptions[0].state === 'open');

    // Find out
    d = world(base(), other);
    d.tasks.items = [{ id: 'tkNext', title: 'Existing step', projectId: 'pjA', done: false, doneOn: null, createdAt: OLD }];
    P(d).nextTaskId = 'tkNext';
    const af = K.addAssumption(d, 'pjA', 'Sites will pay');
    const tasks0 = d.tasks.items.length;
    up();
    const tf = K.findOut(d, 'pjA', af), tk = d.tasks.items.find(t => t.id === tf);
    check('findOut adds one task "Find out: <text>" of 15 minutes, admin, no date, in the project', typeof tf === 'string' && d.tasks.items.length === tasks0 + 1 && tk.title === 'Find out: Sites will pay' && tk.minutes === 15 && tk.category === 'admin' && tk.due === null && tk.projectId === 'pjA', tk);
    check('…the assumption remembers the task, and the project\'s next step is unchanged', P(d).model.assumptions[0].taskId === tf && P(d).nextTaskId === 'tkNext' && P(d).updatedAt > OLD);
    check('a second findOut returns null and adds nothing', K.findOut(d, 'pjA', af) === null && d.tasks.items.length === tasks0 + 1);
    d.tasks.items = d.tasks.items.filter(t => t.id !== tf);
    const tf2 = K.findOut(d, 'pjA', af);
    check('once that task is gone, findOut adds a new one', typeof tf2 === 'string' && tf2 !== tf && d.tasks.items.some(t => t.id === tf2) && P(d).model.assumptions[0].taskId === tf2);

    // Looking at it
    d = world(base());
    const m1a = K.addAssumption(d, 'pjA', 'One'), m2a = K.addAssumption(d, 'pjA', 'Two'), m3a = K.addAssumption(d, 'pjA', 'Three');
    K.setAssumptionState(d, 'pjA', m1a, 'looks-true', '2026-10-12'); K.setAssumptionState(d, 'pjA', m2a, 'doesnt-hold', '2026-10-12');
    K.editAnswer(d, 'pjA', 'problem', 'P'); K.editAnswer(d, 'pjA', 'who', '  ');
    check('modelProgress counts the answered questions (one more for any assumption) and each state', eq(K.modelProgress(P(d)), { answered: 2, assumptions: 3, open: 1, looksTrue: 1, doesntHold: 1 }), K.modelProgress(P(d)));
    check('modelProgress of a project without a model is all zero', eq(K.modelProgress(base('pjZ')), { answered: 0, assumptions: 0, open: 0, looksTrue: 0, doesntHold: 0 }));
    const A3 = P(d).model.assumptions[2];
    check('awaitingAnswer is false with no task', !K.awaitingAnswer(d, A3));
    d.tasks.items = [{ id: 'tkF', title: 'Find out: Three', projectId: 'pjA', done: false, doneOn: null, createdAt: OLD }];
    A3.taskId = 'tkF';
    check('…false while its task is not done', !K.awaitingAnswer(d, A3));
    d.tasks.items[0].done = true; d.tasks.items[0].doneOn = '2026-10-12';
    check('…true when it is open and its task is done', K.awaitingAnswer(d, A3));
    check('…false once it is marked, and false when its task is gone', (() => { const m = { ...A3, state: 'looks-true' }; return !K.awaitingAnswer(d, m) && !K.awaitingAnswer({ ...d, tasks: { ...d.tasks, items: [] } }, A3); })());
    check('firstToFindOut is the first open assumption without a task', K.firstToFindOut(d, P(d)) === null);
    A3.taskId = null;
    check('…and it is the open one once its task is not there', K.firstToFindOut(d, P(d)).id === A3.id);
    check('isBusiness and knownTemplate: general, business and "case" (a case is known since 1.35.0), but not a kind from a newer MyDay', !K.isBusiness(base()) && K.knownTemplate(base()) && K.isBusiness(base('p', { template: 'business' })) && K.knownTemplate(base('p', { template: 'business' })) && !K.isBusiness(base('p', { template: 'case' })) && K.knownTemplate(base('p', { template: 'case' })) && !K.knownTemplate(base('p', { template: 'brand-new' })));

    // Recently
    d = world(base('pjA', { template: 'business' }), base('pjG'));
    const ra = K.addAssumption(d, 'pjA', 'Sites will pay'), rb = K.addAssumption(d, 'pjA', 'Lunch fits a break');
    K.setAssumptionState(d, 'pjA', ra, 'looks-true', '2026-10-12'); K.setAssumptionState(d, 'pjA', rb, 'doesnt-hold', '2026-10-13');
    const ch = K.recently(d, P(d), 10).filter(h => h.what === 'checked');
    check('a marked assumption appears in Recently as "checked", at the end of its day, with its state and a link to the Model tab', eq(ch.map(h => [h.at, h.title, h.href]), [['2026-10-13T23:58', 'Lunch fits a break — doesn’t hold', '#projects/p/pjA/model'], ['2026-10-12T23:58', 'Sites will pay — looks true', '#projects/p/pjA/model']]), ch);
    const g = base('pjG', { model: clone(P(d).model) });
    check('a general project with the same model has no "checked" entries', !K.recently(d, g, 10).some(h => h.what === 'checked'));

    // Nothing else is touched
    d = world(base(), other);
    d.tasks.items = []; d.notes.items = [{ id: 'n1', title: 'A note', text: 'x', projectId: 'pjA' }];
    d.days['2026-10-10'] = { energy: 3, rest: false, builtAt: '2026-10-10T08:00', checkedIn: true, tasks: [] };
    const ctxB = rest(d);
    let ax;
    const steps9 = [
      ['switching to a business idea', () => K.setTemplate(d, 'pjA', 'business')],
      ['writing an answer', () => K.editAnswer(d, 'pjA', 'problem', 'Slow lunches')],
      ['adding an assumption', () => { ax = K.addAssumption(d, 'pjA', 'Sites will pay'); }],
      ['editing an assumption', () => K.editAssumption(d, 'pjA', ax, 'Sites will pay weekly')],
      ['writing what was found', () => K.editFound(d, 'pjA', ax, 'Two said yes')],
      ['marking an assumption', () => K.setAssumptionState(d, 'pjA', ax, 'looks-true', '2026-10-12')],
      ['removing an assumption', () => K.removeAssumption(d, 'pjA', ax)],
      ['switching back to general', () => K.setTemplate(d, 'pjA', 'general')],
    ];
    for (const [name, run] of steps9) {
      P(d).updatedAt = OLD;
      run();
      check(`${name} moves the project's updated time on`, P(d).updatedAt > OLD, P(d).updatedAt);
    }
    check('none of that touched the days, tasks, notes, title, summary, stage or status, or the other project', eq(rest(d), ctxB) && eq(d.projects.items[1], otherBefore));

    // Removing
    d = world(base());
    const ba = K.addAssumption(d, 'pjA', 'Sites will pay'), bb = K.addAssumption(d, 'pjA', 'Lunch fits a break');
    const bt = K.findOut(d, 'pjA', ba);
    check('removeAssumption takes it out and keeps the other', K.removeAssumption(d, 'pjA', ba) && eq(P(d).model.assumptions.map(a => a.id), [bb]) && !K.removeAssumption(d, 'pjA', ba));
    check('…its Find out task stays in the tasks', d.tasks.items.some(t => t.id === bt));
    check('…and removing the last one, with no answers, removes the model field', K.removeAssumption(d, 'pjA', bb) && !('model' in P(d)), P(d));
    check('…but with an answer written, the model stays', (() => { const e = world(base()); K.editAnswer(e, 'pjA', 'problem', 'P'); const i = K.addAssumption(e, 'pjA', 'x'); K.removeAssumption(e, 'pjA', i); return e.projects.items[0].model.problem === 'P' && eq(e.projects.items[0].model.assumptions, []); })());
  }

  console.log('\n[10] The Case template: a case\'s timeline, evidence and issues');
  {
    const read10 = (c, r = { dropped: 0 }, x = {}) => K.normalizeProjects({ items: [base('pjC', { template: 'case', case: c, ...x })] }, r).items[0];
    const TL = (id, x = {}) => ({ id, date: '2026-09-01', about: false, title: 'Landlord kept the deposit', details: '', source: 'mine', evidenceIds: [], issueIds: [], createdAt: OLD, ...x });
    const EV = (id, x = {}) => ({ id, title: 'Tenancy agreement', kind: 'document', date: null, where: '', status: 'have', notes: '', issueIds: [], createdAt: OLD, ...x });
    const IS = (id, x = {}) => ({ id, title: 'Deposit not protected', status: 'considering', notes: '', createdAt: OLD, ...x });
    const caseOf = (d, id = 'pjA') => d.projects.items.find(p => p.id === id).case;

    // Kinds
    check('the kinds of project are General, Business idea, Case and Research, in that order', eq(K.TEMPLATES.map(t => t.id), ['general', 'business', 'case', 'research']) && eq(K.TEMPLATES.map(t => t.label), ['General', 'Business idea', 'Case', 'Research']), K.TEMPLATES);
    let d = world(base(), base('pjO'));
    const otherBefore10 = clone(d.projects.items[1]);
    check('isCase is true for a case and false for a general or business project', K.isCase(base('p', { template: 'case' })) && !K.isCase(base()) && !K.isCase(base('p', { template: 'business' })));
    check('knownTemplate is true for "case", and still false for a kind this version does not know', K.knownTemplate(base('p', { template: 'case' })) && !K.knownTemplate(base('p', { template: 'brand-new' })));
    d.projects.items[0].updatedAt = OLD;
    check('setTemplate to "case" sets it and moves the updated time on', K.setTemplate(d, 'pjA', 'case') && P(d).template === 'case' && P(d).updatedAt > OLD, P(d));
    check('setTemplate to "case" again changes nothing (false)', K.setTemplate(d, 'pjA', 'case') === false);
    K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'Moved out' });
    check('setTemplate back to "general" removes the template but keeps the case\'s records', K.setTemplate(d, 'pjA', 'general') && !('template' in P(d)) && P(d).case.timeline.length === 1);

    // Reading what's saved
    let r = { dropped: 0 };
    let o = K.normalizeProjects({ items: [base('pjA')] }, r).items[0];
    check('a project without a case gets none when read', !('case' in o) && r.dropped === 0, o);
    const full = { futureCase: { a: 1 }, timeline: [TL('tl1', { futureBit: 't', evidenceIds: ['ev1'], issueIds: ['is1'] })], evidence: [EV('ev1', { futureBit: 'e', issueIds: ['is1'] })], issues: [IS('is1', { futureBit: 'i' })] };
    r = { dropped: 0 }; o = read10(clone(full), r);
    check('a case is read back exactly as it was, with nothing dropped', eq(o.case, full) && r.dropped === 0, o.case);
    check('unknown fields on the case, an entry, an evidence item and an issue are kept', o.case.futureCase.a === 1 && o.case.timeline[0].futureBit === 't' && o.case.evidence[0].futureBit === 'e' && o.case.issues[0].futureBit === 'i');
    r = { dropped: 0 };
    o = read10({ timeline: [TL('a'), { ...TL('b'), id: '' }, TL('c', { title: '   ' }), TL('d', { date: '2026-13-45' }), TL('e', { date: 'last week' }), { ...TL('f'), id: undefined }, 'junk'], evidence: [EV('x'), EV('', {}), EV('y', { title: ' ' })], issues: [IS('z'), IS('', {}), IS('w', { title: '' })] }, r);
    check('entries with no id, a blank title or a bad date, and evidence or issues with no id or a blank title, are dropped and counted', eq(o.case.timeline.map(t => t.id), ['a']) && eq(o.case.evidence.map(e => e.id), ['x']) && eq(o.case.issues.map(i => i.id), ['z']) && r.dropped === 6 + 2 + 2, [o.case, r]);
    o = read10({ timeline: [TL('same'), TL('same')], evidence: [EV('same'), EV('same')], issues: [IS('same'), IS('same')] });
    const unique = l => new Set(l.map(x => x.id)).size === l.length;
    check('repeated ids get new ones with the right prefixes (tl, ev, is), and the first keeps its own', unique(o.case.timeline) && unique(o.case.evidence) && unique(o.case.issues) && o.case.timeline[0].id === 'same' && o.case.timeline[1].id.startsWith('tl') && o.case.evidence[1].id.startsWith('ev') && o.case.issues[1].id.startsWith('is'), o.case);
    o = read10({ timeline: [TL('a', { source: 'someone' }), TL('b', { source: 5 })], evidence: [EV('x', { kind: 'carrier pigeon', status: 'maybe' }), EV('y', { status: 5, kind: null })], issues: [IS('z', { status: 'won' })] });
    check('an unknown source becomes "mine", an unknown kind "other", an unknown evidence status "to-get" and an unknown issue status "considering"',
      o.case.timeline.every(t => t.source === 'mine') && o.case.evidence.every(e => e.kind === 'other' && e.status === 'to-get') && o.case.issues[0].status === 'considering', o.case);
    o = read10({ timeline: [TL('a', { about: 'yes' }), TL('b', { about: 1 }), TL('c', { about: true })] });
    check('"about" is true only when it is true', eq(o.case.timeline.map(t => t.about), [false, false, true]));
    const long = n => 'x'.repeat(n);
    o = read10({ timeline: [TL('a', { title: long(200), details: long(900) })], evidence: [EV('x', { title: long(200), where: '  ' + 'w  '.repeat(120), notes: long(500) })], issues: [IS('z', { title: long(150), notes: long(900) })] });
    check('texts are cut to their limits (entry title 160, details 800; evidence title 160, notes 400; issue title 120, notes 800)', o.case.timeline[0].title.length === 160 && o.case.timeline[0].details.length === 800 && o.case.evidence[0].title.length === 160 && o.case.evidence[0].notes.length === 400 && o.case.issues[0].title.length === 120 && o.case.issues[0].notes.length === 800);
    check('"where" has its whitespace collapsed and is cut to 200 (no space left at the end)', o.case.evidence[0].where === ('w '.repeat(150)).slice(0, 200).trimEnd() && !/\s{2}/.test(o.case.evidence[0].where), o.case.evidence[0].where);
    o = read10({ timeline: [TL('a', { evidenceIds: ['ev1', 'gone', 'ev1', 'ev2'], issueIds: ['is1', 'gone', 'is1'] })], evidence: [EV('ev1', { issueIds: ['is1', 'gone'] }), EV('ev2')], issues: [IS('is1')] });
    check('links to evidence or issues that do not exist are let go, and repeats removed', eq(o.case.timeline[0].evidenceIds, ['ev1', 'ev2']) && eq(o.case.timeline[0].issueIds, ['is1']) && eq(o.case.evidence[0].issueIds, ['is1']), o.case);
    const manyEv = Array.from({ length: 14 }, (_, i) => EV('ev' + i)), manyIs = Array.from({ length: 8 }, (_, i) => IS('is' + i));
    o = read10({ timeline: [TL('a', { evidenceIds: manyEv.map(e => e.id), issueIds: manyIs.map(i => i.id) })], evidence: manyEv.map((e, i) => i === 0 ? { ...e, issueIds: manyIs.map(x => x.id) } : e), issues: manyIs });
    check('an entry\'s links are cut to 10 pieces of evidence and 5 issues, and so are an evidence item\'s issue links', o.case.timeline[0].evidenceIds.length === 10 && o.case.timeline[0].issueIds.length === 5 && o.case.evidence[0].issueIds.length === 5);
    r = { dropped: 0 }; o = read10({ timeline: [], evidence: [], issues: [] }, r);
    check('a case with nothing in it (and nothing unknown) is removed', !('case' in o) && r.dropped === 0, o);
    check('…but one with nothing in it and an unknown field is kept', read10({ timeline: [], evidence: [], issues: [], futureCase: 1 }).case.futureCase === 1);
    check('…and a case whose only content was unreadable is removed too (the unreadable ones counted)', (() => { const rr = { dropped: 0 }; const x = read10({ timeline: [TL('a', { title: '' })] }, rr); return !('case' in x) && rr.dropped === 1; })());
    r = { dropped: 0 }; o = read10('not a case', r);
    check('a case that is not an object is removed and counted', !('case' in o) && r.dropped === 1, [o, r]);
    r = { dropped: 0 }; o = read10({ timeline: 'nope', evidence: { a: 1 }, issues: 7 }, r);
    check('lists that are not arrays are counted (one each) and the case is removed', !('case' in o) && r.dropped === 3, [o, r]);

    // Timeline
    d = world(base('pjA', { template: 'case' }), base('pjO'));
    const otherB = clone(d.projects.items[1]);
    check('an entry needs a real date and a title: otherwise null, and nothing is added', K.addEntry(d, 'pjA', { date: '2026-02-30', title: 'x' }) === null && K.addEntry(d, 'pjA', { date: 'soon', title: 'x' }) === null && K.addEntry(d, 'pjA', { date: '2026-09-01', title: '   ' }) === null && K.addEntry(d, 'pjNope', { date: '2026-09-01', title: 'x' }) === null && !('case' in P(d)));
    const t1 = K.addEntry(d, 'pjA', { date: '2026-09-10', title: '  Letter from the agent  ' });
    check('addEntry returns an id starting "tl"; it defaults to my account and not "about", with no links', typeof t1 === 'string' && t1.startsWith('tl') && (({ source, about, title, details, evidenceIds, issueIds }) => eq({ source, about, title, details, evidenceIds, issueIds }, { source: 'mine', about: false, title: 'Letter from the agent', details: '', evidenceIds: [], issueIds: [] }))(caseOf(d).timeline[0]), caseOf(d).timeline[0]);
    const t2 = K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'Moved out', source: 'theirs', about: true, details: 'They said so' });
    check('an entry can be given a source, "about" and details', caseOf(d).timeline[1].source === 'theirs' && caseOf(d).timeline[1].about === true && caseOf(d).timeline[1].details === 'They said so');
    P(d).updatedAt = OLD;
    check('editEntry changes only what is given, and moves the updated time on', K.editEntry(d, 'pjA', t1, { title: 'Letter from the agency' }) === true && eq((({ title, date, source, about }) => [title, date, source, about])(caseOf(d).timeline[0]), ['Letter from the agency', '2026-09-10', 'mine', false]) && P(d).updatedAt > OLD);
    P(d).updatedAt = OLD;
    check('editEntry with the same values changes nothing (false) and leaves the updated time', K.editEntry(d, 'pjA', t1, { title: 'Letter from the agency', source: 'mine' }) === false && P(d).updatedAt === OLD);
    check('editEntry can change the date, source, about and details; a bad date or blank title is ignored', K.editEntry(d, 'pjA', t1, { date: '2026-09-11', source: 'evidence', about: true, details: 'Dated the 11th' }) === true && K.editEntry(d, 'pjA', t1, { date: 'nope', title: '  ' }) === false && eq((({ date, source, about, details, title }) => [date, source, about, details, title])(caseOf(d).timeline[0]), ['2026-09-11', 'evidence', true, 'Dated the 11th', 'Letter from the agency']));
    const t3 = K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'Same day, later' });
    check('timelineInOrder sorts by date, then by the order added', eq(K.timelineInOrder(P(d)).map(t => t.id), [t2, t3, t1]), K.timelineInOrder(P(d)).map(t => t.id));
    check('timelineInOrder sorts by creation time when the dates are equal, even if saved the other way round', (() => { const q = base('pjQ', { case: { timeline: [TL('late', { createdAt: '2026-10-01T10:00' }), TL('early', { createdAt: '2026-10-01T09:00' })], evidence: [], issues: [] } }); return eq(K.timelineInOrder(q).map(t => t.id), ['early', 'late']); })());
    P(d).updatedAt = OLD;
    check('removeEntry takes it out (the others stay); a second time returns false', K.removeEntry(d, 'pjA', t3) === true && eq(caseOf(d).timeline.map(t => t.id), [t1, t2]) && K.removeEntry(d, 'pjA', t3) === false && P(d).updatedAt > OLD);
    d = world(base('pjA', { template: 'case' }));
    for (let i = 0; i < 150; i++) K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'Entry ' + i });
    check('the 150th entry is accepted and the 151st returns "full"', caseOf(d).timeline.length === 150 && K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'One more' }) === 'full' && caseOf(d).timeline.length === 150);

    // Evidence
    d = world(base('pjA', { template: 'case' }), base('pjO'));
    check('evidence needs a title: otherwise null', K.addEvidence(d, 'pjA', { title: '  ' }) === null && K.addEvidence(d, 'pjNope', { title: 'x' }) === null && !('case' in P(d)));
    const e1 = K.addEvidence(d, 'pjA', { title: ' Tenancy agreement ', date: 'sometime', where: '  In   the   blue folder ' });
    check('addEvidence returns an id starting "ev"; it defaults to a document that I have, with a date of null when it is not a real date, and "where" tidied', typeof e1 === 'string' && e1.startsWith('ev') && (({ title, kind, status, date, where, notes, issueIds }) => eq({ title, kind, status, date, where, notes, issueIds }, { title: 'Tenancy agreement', kind: 'document', status: 'have', date: null, where: 'In the blue folder', notes: '', issueIds: [] }))(caseOf(d).evidence[0]), caseOf(d).evidence[0]);
    P(d).updatedAt = OLD;
    check('editEvidence changes status, kind, where and notes, and moves the updated time on', K.editEvidence(d, 'pjA', e1, { status: 'reviewed', kind: 'email', where: 'Inbox, 3 Sept', notes: 'Read it twice' }) === true && eq((({ status, kind, where, notes }) => [status, kind, where, notes])(caseOf(d).evidence[0]), ['reviewed', 'email', 'Inbox, 3 Sept', 'Read it twice']) && P(d).updatedAt > OLD);
    check('editEvidence can set a date and clear it to null', K.editEvidence(d, 'pjA', e1, { date: '2026-09-03' }) === true && caseOf(d).evidence[0].date === '2026-09-03' && K.editEvidence(d, 'pjA', e1, { date: null }) === true && caseOf(d).evidence[0].date === null);
    check('editEvidence with the same values changes nothing (false); an unknown status or kind is ignored', K.editEvidence(d, 'pjA', e1, { status: 'reviewed', kind: 'email' }) === false && K.editEvidence(d, 'pjA', e1, { status: 'maybe', kind: 'pigeon' }) === false && caseOf(d).evidence[0].status === 'reviewed');
    K.setTemplate(d, 'pjA', 'case');
    const tx = K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'Signed' }), tx2 = K.addEntry(d, 'pjA', { date: '2026-09-02', title: 'Moved in' }), e2 = K.addEvidence(d, 'pjA', { title: 'Photos' });
    K.toggleLink(d, 'pjA', 'entry-evidence', tx, e1); K.toggleLink(d, 'pjA', 'entry-evidence', tx, e2); K.toggleLink(d, 'pjA', 'entry-evidence', tx2, e1);
    P(d).updatedAt = OLD;
    check('removeEvidence takes it out of the evidence and off the entries that named it (the entries stay)', K.removeEvidence(d, 'pjA', e1) === true && eq(caseOf(d).evidence.map(e => e.id), [e2]) && eq(caseOf(d).timeline.find(t => t.id === tx).evidenceIds, [e2]) && eq(caseOf(d).timeline.find(t => t.id === tx2).evidenceIds, []) && caseOf(d).timeline.length === 2 && P(d).updatedAt > OLD && K.removeEvidence(d, 'pjA', e1) === false);
    d = world(base('pjA', { template: 'case' }));
    for (let i = 0; i < 150; i++) K.addEvidence(d, 'pjA', { title: 'Item ' + i });
    check('the 150th piece of evidence is accepted and the 151st returns "full"', caseOf(d).evidence.length === 150 && K.addEvidence(d, 'pjA', { title: 'One more' }) === 'full' && caseOf(d).evidence.length === 150);

    // Issues
    d = world(base('pjA', { template: 'case' }), base('pjO'));
    check('an issue needs a title: otherwise null', K.addIssue(d, 'pjA', '  ') === null && K.addIssue(d, 'pjNope', 'x') === null);
    const i1 = K.addIssue(d, 'pjA', '  Deposit not protected ');
    check('addIssue returns an id starting "is"; it starts as "considering" with no notes', typeof i1 === 'string' && i1.startsWith('is') && caseOf(d).issues[0].title === 'Deposit not protected' && caseOf(d).issues[0].status === 'considering' && caseOf(d).issues[0].notes === '');
    P(d).updatedAt = OLD;
    check('editIssue changes the title, status and notes, and moves the updated time on', K.editIssue(d, 'pjA', i1, { title: 'Deposit was not protected', status: 'claiming', notes: 'Scheme says no record' }) === true && eq((({ title, status, notes }) => [title, status, notes])(caseOf(d).issues[0]), ['Deposit was not protected', 'claiming', 'Scheme says no record']) && P(d).updatedAt > OLD);
    check('editIssue with the same values changes nothing (false); a blank title or unknown status is ignored', K.editIssue(d, 'pjA', i1, { status: 'claiming' }) === false && K.editIssue(d, 'pjA', i1, { title: '  ', status: 'won' }) === false && caseOf(d).issues[0].title === 'Deposit was not protected');
    const i2 = K.addIssue(d, 'pjA', 'Damage claim'), te = K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'Checked out' }), ee = K.addEvidence(d, 'pjA', { title: 'Photos' });
    K.toggleLink(d, 'pjA', 'entry-issue', te, i1); K.toggleLink(d, 'pjA', 'entry-issue', te, i2); K.toggleLink(d, 'pjA', 'evidence-issue', ee, i1);
    P(d).updatedAt = OLD;
    check('removeIssue takes it out and off the evidence and entries linked to it (they stay)', K.removeIssue(d, 'pjA', i1) === true && eq(caseOf(d).issues.map(i => i.id), [i2]) && eq(caseOf(d).timeline[0].issueIds, [i2]) && eq(caseOf(d).evidence[0].issueIds, []) && caseOf(d).timeline.length === 1 && caseOf(d).evidence.length === 1 && P(d).updatedAt > OLD && K.removeIssue(d, 'pjA', i1) === false);
    d = world(base('pjA', { template: 'case' }));
    for (let i = 0; i < 20; i++) K.addIssue(d, 'pjA', 'Issue ' + i);
    check('the 20th issue is accepted and the 21st returns "full"', caseOf(d).issues.length === 20 && K.addIssue(d, 'pjA', 'One more') === 'full' && caseOf(d).issues.length === 20);

    // Links, counts
    d = world(base('pjA', { template: 'case' }));
    const lt = K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'Entry' }), le = K.addEvidence(d, 'pjA', { title: 'Evidence' }), li = K.addIssue(d, 'pjA', 'Issue');
    P(d).updatedAt = OLD;
    check('an entry links to evidence, then unlinks on the second tap, moving the updated time on', K.toggleLink(d, 'pjA', 'entry-evidence', lt, le) === true && eq(caseOf(d).timeline[0].evidenceIds, [le]) && P(d).updatedAt > OLD && K.toggleLink(d, 'pjA', 'entry-evidence', lt, le) === true && eq(caseOf(d).timeline[0].evidenceIds, []));
    check('an entry links to an issue, then unlinks', K.toggleLink(d, 'pjA', 'entry-issue', lt, li) === true && eq(caseOf(d).timeline[0].issueIds, [li]) && K.toggleLink(d, 'pjA', 'entry-issue', lt, li) === true && eq(caseOf(d).timeline[0].issueIds, []));
    check('evidence links to an issue, then unlinks', K.toggleLink(d, 'pjA', 'evidence-issue', le, li) === true && eq(caseOf(d).evidence[0].issueIds, [li]) && K.toggleLink(d, 'pjA', 'evidence-issue', le, li) === true && eq(caseOf(d).evidence[0].issueIds, []));
    P(d).updatedAt = OLD;
    check('an id that does not exist links nothing (false), whichever kind, and the updated time stays', K.toggleLink(d, 'pjA', 'entry-evidence', lt, 'evNope') === false && K.toggleLink(d, 'pjA', 'entry-evidence', 'tlNope', le) === false && K.toggleLink(d, 'pjA', 'entry-issue', lt, 'isNope') === false && K.toggleLink(d, 'pjA', 'evidence-issue', 'evNope', li) === false && K.toggleLink(d, 'pjA', 'evidence-issue', le, 'isNope') === false && K.toggleLink(d, 'pjA', 'entry-evidence', lt, li) === false && P(d).updatedAt === OLD);
    const evs = Array.from({ length: 11 }, (_, i) => K.addEvidence(d, 'pjA', { title: 'More ' + i })), iss = Array.from({ length: 6 }, (_, i) => K.addIssue(d, 'pjA', 'More issue ' + i));
    const tenOk = evs.slice(0, 10).every(e => K.toggleLink(d, 'pjA', 'entry-evidence', lt, e) === true);
    check('the 10th evidence link on an entry is accepted and the 11th returns "full"', tenOk && K.toggleLink(d, 'pjA', 'entry-evidence', lt, evs[10]) === 'full' && caseOf(d).timeline[0].evidenceIds.length === 10);
    const fiveOk = iss.slice(0, 5).every(s => K.toggleLink(d, 'pjA', 'entry-issue', lt, s) === true);
    check('the 5th issue link on an entry is accepted and the 6th returns "full"', fiveOk && K.toggleLink(d, 'pjA', 'entry-issue', lt, iss[5]) === 'full' && caseOf(d).timeline[0].issueIds.length === 5);
    check('…the same limit of 5 holds for evidence linked to issues', iss.slice(0, 5).every(s => K.toggleLink(d, 'pjA', 'evidence-issue', le, s) === true) && K.toggleLink(d, 'pjA', 'evidence-issue', le, iss[5]) === 'full');
    check('a link at the limit can still be taken off', K.toggleLink(d, 'pjA', 'entry-issue', lt, iss[0]) === true && caseOf(d).timeline[0].issueIds.length === 4);
    check('caseCounts of a project without a case is all zero', eq(K.caseCounts(base('pjZ')), { timeline: 0, evidence: 0, toGet: 0, have: 0, reviewed: 0, issues: 0, claiming: 0 }));
    d = world(base('pjA', { template: 'case' }));
    const ct = [K.addEntry(d, 'pjA', { date: '2026-09-03', title: 'Third' }), K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'First' }), K.addEntry(d, 'pjA', { date: '2026-09-02', title: 'Second' })];
    const ce = [K.addEvidence(d, 'pjA', { title: 'A', status: 'to-get' }), K.addEvidence(d, 'pjA', { title: 'B', status: 'to-get' }), K.addEvidence(d, 'pjA', { title: 'C', status: 'have' }), K.addEvidence(d, 'pjA', { title: 'D', status: 'reviewed' })];
    const ci = [K.addIssue(d, 'pjA', 'One'), K.addIssue(d, 'pjA', 'Two'), K.addIssue(d, 'pjA', 'Three')];
    K.editIssue(d, 'pjA', ci[0], { status: 'claiming' }); K.editIssue(d, 'pjA', ci[1], { status: 'claiming' }); K.editIssue(d, 'pjA', ci[2], { status: 'dropped' });
    check('caseCounts counts the entries, the evidence by status, the issues and those being claimed', eq(K.caseCounts(P(d)), { timeline: 3, evidence: 4, toGet: 2, have: 1, reviewed: 1, issues: 3, claiming: 2 }), K.caseCounts(P(d)));
    K.toggleLink(d, 'pjA', 'evidence-issue', ce[0], ci[0]); K.toggleLink(d, 'pjA', 'evidence-issue', ce[2], ci[0]); K.toggleLink(d, 'pjA', 'entry-issue', ct[0], ci[0]); K.toggleLink(d, 'pjA', 'entry-issue', ct[1], ci[0]); K.toggleLink(d, 'pjA', 'entry-issue', ct[2], ci[1]);
    const il = K.issueLinks(P(d), ci[0]);
    check('issueLinks gives the evidence and the entries (in date order) linked to an issue', eq(il.evidence.map(e => e.id), [ce[0], ce[2]]) && eq(il.entries.map(t => t.id), [ct[1], ct[0]]), il);
    check('…and nothing for an issue with no links, or for a project without a case', eq(K.issueLinks(P(d), ci[2]), { evidence: [], entries: [] }) && eq(K.issueLinks(base('pjZ'), 'x'), { evidence: [], entries: [] }));

    // The allowance applies to each item, so a large Case is no longer one large sync payload.
    const ARABIC = 'ع'.repeat(800), EMOJI = '😀'.repeat(400);
    d = world(base('pjA', { template: 'case' }), base('pjO'));
    const sizeB = clone(d.projects.items[1]);
    for (let i = 0; i < 150; i++) K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'ع'.repeat(160), details: ARABIC });
    for (let i = 0; i < 150; i++) K.addEvidence(d, 'pjA', { title: '😀'.repeat(80), where: 'ع'.repeat(200), notes: EMOJI });
    check('all permitted long Arabic and emoji Case items can be added', caseOf(d).timeline.length === 150 && caseOf(d).evidence.length === 150);
    const bytesNow = K.projectBytes(P(d));
    check('the complete project exceeds 512 KiB while each sync record stays within its allowance', bytesNow > 524288 && K.splitProject(P(d)).every(r => K.recordBytes(r.content) <= 380000), bytesNow);
    const beforeCounts = clone(d);
    const refusedE = K.addEvidence(d, 'pjA', { title: 'One more' }), refusedT = K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'One more' });
    check('count limits still refuse extra items atomically', refusedE === 'full' && refusedT === 'full' && eq(d, beforeCounts), [refusedE, refusedT]);
    const roomT = caseOf(d).timeline[0];
    K.editEntry(d, 'pjA', roomT.id, { details: '' });
    const roomy = caseOf(d).timeline[0];
    roomy.futurePadding = '';
    roomy.futurePadding = 'x'.repeat(380000 - K.recordBytes(K.splitProject(P(d)).find(r => r.kind === 'project_timeline' && r.content.value.id === roomT.id).content));
    P(d).updatedAt = OLD;
    const itemBefore = clone(d);
    check('growing one item beyond its allowance is refused without changing content or timestamps', K.editEntry(d, 'pjA', roomT.id, { details: ARABIC }) === 'big' && eq(d, itemBefore));
    caseOf(d).timeline[0].futurePadding += 'oversized older content';
    caseOf(d).timeline[0].details = 'Longer';
    check('an imported oversized item can still shrink', K.editEntry(d, 'pjA', roomT.id, { details: '' }) === true && caseOf(d).timeline[0].details === '');
    check('the other project was never touched', eq(d.projects.items[1], sizeB));
    // The largest case the counts allow, in plain English at full lengths, still fits in a saved project (524,288 bytes)
    const word = n => 'abcdefghij'.repeat(Math.ceil(n / 10)).slice(0, n);
    const bigCase = { timeline: [], evidence: [], issues: [] };
    for (let i = 0; i < 20; i++) bigCase.issues.push(IS('is' + 'x'.repeat(12) + i, { title: word(120), notes: word(800), status: 'claiming' }));
    for (let i = 0; i < 150; i++) bigCase.evidence.push(EV('ev' + 'x'.repeat(12) + i, { title: word(160), where: word(200), notes: word(400), date: '2026-09-01', issueIds: bigCase.issues.slice(0, 5).map(x => x.id) }));
    for (let i = 0; i < 150; i++) bigCase.timeline.push(TL('tl' + 'x'.repeat(12) + i, { title: word(160), details: word(800), evidenceIds: bigCase.evidence.slice(0, 10).map(x => x.id), issueIds: bigCase.issues.slice(0, 5).map(x => x.id) }));
    const maxP = K.normalizeProjects({ items: [base('pjM', { template: 'case', case: bigCase })] }, { dropped: 0 }).items[0];
    check('the largest case the counts allow, in plain English at full lengths, is read in full and the whole project stays under 524,288 bytes', maxP.case.timeline.length === 150 && maxP.case.evidence.length === 150 && maxP.case.issues.length === 20 && K.projectBytes(maxP) < 524288, K.projectBytes(maxP));

    // Nothing else is touched
    d = world(base('pjA', { template: 'case' }), base('pjO'));
    d.tasks.items = [{ id: 'tkX', title: 'Pay council tax', projectId: 'pjA', done: false, doneOn: null, createdAt: OLD }]; d.notes.items = [{ id: 'n1', title: 'A note', text: 'x', projectId: 'pjA' }];
    d.days['2026-10-10'] = { energy: 3, rest: false, builtAt: '2026-10-10T08:00', checkedIn: true, tasks: [] };
    const ctx10 = rest(d), other10 = clone(d.projects.items[1]);
    let a1, a2, a3;
    const steps = [
      ['adding an entry', () => { a1 = K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'Moved out' }); }],
      ['editing an entry', () => K.editEntry(d, 'pjA', a1, { title: 'Moved out of the flat' })],
      ['adding evidence', () => { a2 = K.addEvidence(d, 'pjA', { title: 'Tenancy agreement' }); }],
      ['editing evidence', () => K.editEvidence(d, 'pjA', a2, { status: 'reviewed' })],
      ['adding an issue', () => { a3 = K.addIssue(d, 'pjA', 'Deposit not protected'); }],
      ['editing an issue', () => K.editIssue(d, 'pjA', a3, { status: 'claiming' })],
      ['linking an entry to evidence', () => K.toggleLink(d, 'pjA', 'entry-evidence', a1, a2)],
      ['linking an entry to an issue', () => K.toggleLink(d, 'pjA', 'entry-issue', a1, a3)],
      ['linking evidence to an issue', () => K.toggleLink(d, 'pjA', 'evidence-issue', a2, a3)],
      ['removing an issue', () => K.removeIssue(d, 'pjA', a3)],
      ['removing evidence', () => K.removeEvidence(d, 'pjA', a2)],
      ['removing an entry', () => K.removeEntry(d, 'pjA', a1)],
    ];
    for (const [name, run] of steps) { P(d).updatedAt = OLD; run(); check(`${name} moves the project's updated time on`, P(d).updatedAt > OLD, P(d).updatedAt); }
    check('none of that touched the days, tasks, notes, title, summary, stage or status, or the other project', eq(rest(d), ctx10) && eq(d.projects.items[1], other10));
    check('removing the last record of a case removes the case field', !('case' in P(d)), P(d));
  }

  console.log('\n[11] A project\'s dashboard: still open, weeks, pointers');
  {
    const k = '2026-10-14'; // a Wednesday; its Monday is the 12th
    const TK = (id, pid, x = {}) => ({ id, title: 'Task ' + id, listId: '', category: 'Admin', minutes: 25, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: OLD, postponed: 0, blockers: [], letGoOn: null, projectId: pid, ...x });
    const AS = (id, text, x = {}) => ({ id, text, state: 'open', found: '', checkedOn: null, taskId: null, createdAt: OLD, ...x });
    const TLe = (id, x = {}) => ({ id, date: '2026-09-01', about: false, title: 'Landlord kept the deposit', details: '', source: 'mine', evidenceIds: [], issueIds: [], createdAt: OLD, ...x });
    const EVi = (id, x = {}) => ({ id, title: 'Tenancy agreement', kind: 'document', date: null, where: '', status: 'have', notes: '', issueIds: [], createdAt: OLD, ...x });
    const ISs = (id, x = {}) => ({ id, title: 'Deposit not protected', status: 'considering', notes: '', createdAt: OLD, ...x });
    console.log('  mondayOf');
    check('every day of the week of Monday 12 October 2026 gives Monday the 12th, including the Monday itself and the Sunday', ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'].every(x => K.mondayOf(x) === '2026-10-12'), ['2026-10-12', '2026-10-18'].map(K.mondayOf));
    check('the next Monday (19 October) gives itself, and the Sunday before a month starts goes back to that week\'s Monday (Sunday 1 November gives 26 October)', K.mondayOf('2026-10-19') === '2026-10-19' && K.mondayOf('2026-11-01') === '2026-10-26', [K.mondayOf('2026-10-19'), K.mondayOf('2026-11-01')]);

    console.log('  stillOpen');
    // Tasks still to do whose date has passed: oldest first, this project's only; done, let go, undated, today's and
    // later ones are not "still open". Coming up (comingUp) still starts at today.
    const so = world(base('pjSo'));
    so.tasks.items = [TK('s2', 'pjSo', { title: 'Second', due: '2026-10-12' }), TK('s1', 'pjSo', { title: 'First', due: '2026-10-05', time: '09:00' }),
      TK('sT', 'pjSo', { title: 'Today', due: k }), TK('sL', 'pjSo', { title: 'Later', due: '2026-10-20' }), TK('sN', 'pjSo', { title: 'No date' }),
      TK('sD', 'pjSo', { title: 'Done', due: '2026-10-01', done: true, doneOn: '2026-10-02' }), TK('sG', 'pjSo', { title: 'Let go', due: '2026-10-03', letGoOn: '2026-10-04' }),
      TK('sX', 'pjX', { title: 'Another project', due: '2026-10-01' })];
    const soIds = () => K.stillOpen(so, so.projects.items[0], k).map(x => x.id);
    check('still open: only this project\'s tasks still to do whose date has passed, oldest first', eq(soIds(), ['s1', 's2']), soIds());
    check('…and Coming up is unchanged: it starts at today (today\'s task, then later)', eq(K.comingUp(so, so.projects.items[0], k).map(c => c.task.id), ['sT', 'sL']), K.comingUp(so, so.projects.items[0], k).map(c => c.task.id));
    Object.assign(so.tasks.items.find(x => x.id === 's1'), { done: true, doneOn: k });
    check('ticking one done takes it out', eq(soIds(), ['s2']), soIds());
    so.tasks.items.find(x => x.id === 's2').letGoOn = k;
    check('…and letting one go does too', eq(soIds(), []), soIds());
    check('a project with no tasks has nothing still open', eq(K.stillOpen(world(base('pjSe')), base('pjSe'), k), []));

    console.log('  nextDates');
    const nd = world(base('pjD', { commitmentIds: ['cmA', 'cmB', 'cmC'] }));
    nd.tasks.items = [
      TK('tkP', 'pjD', { title: 'Past', due: '2026-10-10' }), TK('tkT', 'pjD', { title: 'Today', due: k, time: '09:00' }), TK('tkL', 'pjD', { title: 'Later', due: '2026-10-30' }),
      TK('tkDone', 'pjD', { title: 'Done one', due: '2026-10-15', done: true, doneOn: '2026-10-13' }), TK('tkNone', 'pjD', { title: 'No date' }), TK('tkOther', 'pjX', { title: 'Another project', due: '2026-10-14' }),
    ];
    nd.commitments = [
      { id: 'cmA', kind: 'appointment', title: 'Visit', start: '2026-10-16T11:00', end: '2026-10-16T12:00' },
      { id: 'cmB', kind: 'appointment', title: 'Old visit', start: '2026-10-01T11:00', end: '2026-10-01T12:00' },
      { id: 'cmC', kind: 'appointment', title: 'Review', start: '2026-10-22T09:00', end: '2026-10-22T10:00' },
    ];
    const ndp = nd.projects.items[0];
    let nds = K.nextDates(nd, ndp, k);
    check('next dates are the dated tasks still to do and the appointments, from the day on, in time order', eq(nds.map(x => x.title), ['Today', 'Visit', 'Review']), nds);
    check('…at most three, so the fourth ("Later") is left out', nds.length === 3 && !nds.some(x => x.title === 'Later'), nds.map(x => x.title));
    check('a past dated task, a past appointment, a done task, an undated task and another project\'s task are not included', ['Past', 'Old visit', 'Done one', 'No date', 'Another project'].every(t => !K.nextDates(nd, ndp, k, 10).some(x => x.title === t)), K.nextDates(nd, ndp, k, 10).map(x => x.title));
    check('a task carries its day, time and link to the task; an appointment its day, time and the Calendar', eq([nds[0].day, nds[0].time, nds[0].href, nds[1].day, nds[1].time, nds[1].href], [k, '09:00', '#today/tasks/tkT', '2026-10-16', '11:00', '#calendar']), nds);
    check('asking from a later day leaves out what is earlier (from 17 October: Review, then Later)', eq(K.nextDates(nd, ndp, '2026-10-17').map(x => x.title), ['Review', 'Later']), K.nextDates(nd, ndp, '2026-10-17'));

    console.log('  weeksDone');
    const wk = world(base('pjW', { template: 'business', model: { problem: '', who: '', how: '', assumptions: [AS('asA', 'Crews would pay', { state: 'looks-true', checkedOn: '2026-10-13' }), AS('asB', 'Old check', { state: 'looks-true', checkedOn: '2026-08-01' })] } }));
    wk.tasks.items = [
      TK('t1', 'pjW', { done: true, doneOn: '2026-10-13' }), TK('t2', 'pjW', { done: true, doneOn: '2026-10-12' }), TK('t3', 'pjW', { done: true, doneOn: '2026-10-06' }),
      TK('t4', 'pjW', { done: true, doneOn: null }), TK('t5', 'pjW', { done: true, doneOn: '2026-08-01' }), TK('t6', 'pjW', { done: true, doneOn: '2026-10-20' }),
      TK('t7', 'pjW', { done: false, doneOn: '2026-10-13' }), TK('t8', 'pjX', { done: true, doneOn: '2026-10-13' }),
    ];
    const wp = wk.projects.items[0];
    K.addMilestone(wk, 'pjW', 'Reached one'); K.addMilestone(wk, 'pjW', 'Reached two');
    K.setReached(wk, 'pjW', wp.milestones[0].id, true, '2026-10-07'); K.setReached(wk, 'pjW', wp.milestones[1].id, true, '2026-10-14');
    const wd = K.addDecision(wk, 'pjW', 'Which?'), wo = K.addOption(wk, 'pjW', wd, 'This one'); K.decide(wk, 'pjW', wd, wo, '', '2026-10-14');
    const wd2 = K.addDecision(wk, 'pjW', 'Not yet decided');
    let wks = K.weeksDone(wk, wp, k);
    check('weeksDone gives 8 weeks, each starting on a Monday, the last starting on this week\'s Monday and the first 49 days before it', wks.length === 8 && wks[7].start === K.mondayOf(k) && wks[7].start === '2026-10-12' && wks[0].start === '2026-08-24' && wks.every(w => K.mondayOf(w.start) === w.start), wks.map(w => w.start));
    check('tasks ticked off with a day count in their week (two this week, one last week)', wks[7].tasks === 2 && wks[6].tasks === 1 && wks.slice(0, 6).every(w => w.tasks === 0), wks.map(w => w.tasks));
    check('a done task with no day, one before the first week, one dated after the day asked from, an undone one and another project\'s do not count', wks.reduce((n, w) => n + w.tasks, 0) === 3, wks.map(w => w.tasks));
    check('milestones reached count in the week they were reached', wks[6].milestones === 1 && wks[7].milestones === 1, wks.map(w => w.milestones));
    check('a decision made counts in its week, and one not yet decided does not', wks[7].decisions === 1 && wks.reduce((n, w) => n + w.decisions, 0) === 1 && wd2 !== null, wks.map(w => w.decisions));
    check('for a business idea a belief checked this week counts as found out, and one from before the first week does not', wks[7].found === 1 && wks.reduce((n, w) => n + w.found, 0) === 1, wks.map(w => w.found));
    check('nothing was recorded for a business idea', wks.every(w => w.recorded === 0));
    check('each week\'s total adds up its parts, and the weeks add up to everything counted (3 tasks, 2 milestones, 1 decision, 1 found = 7)', wks.every(w => w.total === w.tasks + w.milestones + w.decisions + w.found + w.recorded) && wks.reduce((n, w) => n + w.total, 0) === 7, wks.map(w => w.total));
    check('this week\'s total is 5 (2 tasks, 1 milestone, 1 decision, 1 found) and last week\'s is 2', wks[7].total === 5 && wks[6].total === 2, [wks[7].total, wks[6].total]);
    check('a week count of 3 with a different number of weeks gives that many weeks, ending the same', (w3 => w3.length === 3 && w3[2].start === '2026-10-12' && w3[0].start === '2026-09-28')(K.weeksDone(wk, wp, k, 3)));
    // A general project: its model and case do not count
    const gw = world(base('pjGW', { model: { problem: '', who: '', how: '', assumptions: [AS('asA', 'Hidden belief', { state: 'looks-true', checkedOn: '2026-10-13' })] }, case: { timeline: [TLe('tl1', { createdAt: '2026-10-13T09:00' })], evidence: [EVi('ev1', { createdAt: '2026-10-13T09:00' })], issues: [] } }));
    wks = K.weeksDone(gw, gw.projects.items[0], k);
    check('a general project that carries a model or a case counts none of it', wks.every(w => w.found === 0 && w.recorded === 0 && w.total === 0), wks);
    // A case: timeline entries and evidence count as recorded
    const cw = world(base('pjCW', { template: 'case', case: { timeline: [TLe('tl1', { date: '2026-03-01', createdAt: '2026-10-13T09:00' }), TLe('tl2', { createdAt: '2026-10-06T09:00' })], evidence: [EVi('ev1', { createdAt: '2026-10-14T18:00' }), EVi('ev2', { createdAt: '2026-06-01T09:00' })], issues: [ISs('is1', { createdAt: '2026-10-13T09:00' })] },
      model: { problem: '', who: '', how: '', assumptions: [AS('asA', 'Hidden belief', { state: 'looks-true', checkedOn: '2026-10-13' })] } }));
    wks = K.weeksDone(cw, cw.projects.items[0], k);
    check('for a case, timeline entries and evidence count as recorded on the day they were made (not the date they are about)', wks[7].recorded === 2 && wks[6].recorded === 1 && wks.reduce((n, w) => n + w.recorded, 0) === 3, wks.map(w => w.recorded));
    check('…an issue does not, and a case\'s hidden model adds no "found"', wks.every(w => w.found === 0) && wks[7].total === 2, wks.map(w => w.total));

    console.log('  timelineByMonth');
    const tm = base('pjM', { template: 'case', case: { timeline: [TLe('a', { date: '2026-10-02' }), TLe('b', { date: '2026-08-30' }), TLe('c', { date: '2026-10-20' }), TLe('d', { date: '2026-08-01' }), TLe('e', { date: '2026-09-15' })], evidence: [], issues: [] } });
    check('timeline entries are counted per month in date order, however they were added', eq(K.timelineByMonth(tm), [{ month: '2026-08', count: 2 }, { month: '2026-09', count: 1 }, { month: '2026-10', count: 2 }]), K.timelineByMonth(tm));
    const long = base('pjM2', { template: 'case', case: { timeline: Array.from({ length: 14 }, (_, i) => TLe('e' + i, { date: `${2025 + Math.floor((i + 8) / 12)}-${String(((i + 8) % 12) + 1).padStart(2, '0')}-10` })), evidence: [], issues: [] } });
    const lm = K.timelineByMonth(long);
    check('over 12 months only the latest 12 are given (14 months from 2025-09 end at 2026-10)', lm.length === 12 && lm[0].month === '2025-11' && lm[11].month === '2026-10', lm.map(x => x.month));
    check('a project with no case has no months, and "max" can be smaller', K.timelineByMonth(base('pjM3')).length === 0 && K.timelineByMonth(tm, 2).length === 2 && K.timelineByMonth(tm, 2)[1].month === '2026-10');

    console.log('  issueGrid');
    const ig = base('pjI', { template: 'case', case: {
      timeline: [TLe('tl1', { issueIds: ['is1'] }), TLe('tl2', { issueIds: ['is1', 'is2'] })],
      evidence: [EVi('ev1', { issueIds: ['is1'] }), EVi('ev2')],
      issues: [ISs('is1', { title: 'Deposit not protected', status: 'claiming' }), ISs('is2', { title: 'Repairs ignored' }), ISs('is3', { title: 'Late notice', status: 'dropped' })],
    } });
    check('each issue is listed with its title, status and how much evidence and how many timeline entries are linked to it', eq(K.issueGrid(ig), [
      { id: 'is1', title: 'Deposit not protected', status: 'claiming', evidence: 1, entries: 2 },
      { id: 'is2', title: 'Repairs ignored', status: 'considering', evidence: 0, entries: 1 },
      { id: 'is3', title: 'Late notice', status: 'dropped', evidence: 0, entries: 0 }]), K.issueGrid(ig));
    check('a project without a case has an empty grid', eq(K.issueGrid(base('pjI2')), []));

    console.log('  worthALook');
    const wl = (data, id = data.projects.items[0].id, kk = k) => K.worthALook(data, data.projects.items.find(p => p.id === id), kk);
    const texts = r => r.map(x => x.text);
    const g1 = world(base('pjL'));
    g1.tasks.items = [TK('a', 'pjL', { title: 'Book the van', due: k })];
    check('a dated task today is pointed out as "— today", linking to the task', eq(wl(g1).map(x => [x.text, x.href]), [['Book the van — today', '#today/tasks/a']]), wl(g1));
    g1.tasks.items[0].due = '2026-10-15';
    check('…tomorrow as "— tomorrow"', texts(wl(g1))[0] === 'Book the van — tomorrow', wl(g1));
    g1.tasks.items[0].due = '2026-10-17';
    check('…in three days as "— in 3 days"', texts(wl(g1))[0] === 'Book the van — in 3 days', wl(g1));
    g1.tasks.items[0].due = '2026-10-21';
    check('…seven days away still as "— in 7 days"', texts(wl(g1))[0] === 'Book the van — in 7 days', wl(g1));
    g1.tasks.items[0].due = '2026-10-22';
    check('…but eight days away gives nothing', wl(g1).length === 0, wl(g1));
    g1.tasks.items = [TK('a', 'pjL', { title: 'Book the van', due: '2026-10-10' })];
    check('a past dated task still to do that is also the next step is not pointed out (the Next step card says it)', wl(g1).length === 0, wl(g1));
    g1.tasks.items.push(TK('c', 'pjL', { title: 'Pack the books' })); g1.projects.items[0].nextTaskId = 'c';
    check('with another task chosen as the next step, it is pointed out as still open, with the day it was due, linking to the task', eq(wl(g1).map(x => [x.key, x.text, x.href]), [['still-open', `Book the van — still open, was due ${K.shortDate('2026-10-10')}`, '#today/tasks/a']]), wl(g1));
    g1.commitments = [{ id: 'cmA', kind: 'appointment', title: 'Viewing', start: '2026-10-15T10:00', end: '2026-10-15T11:00' }]; g1.projects.items[0].commitmentIds = ['cmA'];
    check('an appointment within the week is pointed out too, after the still-open task, linking to the Calendar', eq(wl(g1).map(x => [x.text, x.href]), [[`Book the van — still open, was due ${K.shortDate('2026-10-10')}`, '#today/tasks/a'], ['Viewing — tomorrow', '#calendar']]), wl(g1));
    g1.tasks.items.push(TK('b', 'pjL', { title: 'Older one', due: '2026-10-02' }));
    check('with two tasks still open, only the oldest is pointed out (Coming up lists both)', eq(wl(g1).filter(x => x.key === 'still-open').map(x => x.text), [`Older one — still open, was due ${K.shortDate('2026-10-02')}`]), wl(g1));
    g1.projects.items[0].nextTaskId = 'b';
    check('…and when the oldest is the next step, the next one along is pointed out instead', eq(wl(g1).filter(x => x.key === 'still-open').map(x => x.text), [`Book the van — still open, was due ${K.shortDate('2026-10-10')}`]), wl(g1));
    for (const status of ['paused', 'done']) {
      g1.projects.items[0].status = status;
      check(`a ${status} project gets no still-open pointer (Coming up still lists the tasks)`, !wl(g1).some(x => x.key === 'still-open') && K.stillOpen(g1, g1.projects.items[0], k).length === 2, wl(g1));
    }
    g1.projects.items[0].status = 'active';
    // No "No next step yet" pointer: the Next step card beside Worth a look already asks for the smallest one.
    const ns = world(base('pjS'));
    check('an active project with no open tasks gets no pointer about its next step', wl(ns).length === 0, wl(ns));
    const ps = world(base('pjS', { status: 'paused' }));
    check('nor does a paused one', wl(ps).length === 0, wl(ps));
    ns.tasks.items = [TK('z', 'pjS', { done: true, doneOn: k })];
    check('nor one whose only task is done', wl(ns).length === 0, wl(ns));
    ns.tasks.items = [TK('z', 'pjS')];
    check('nor one with an open task', wl(ns).length === 0, wl(ns));
    // Business
    const bz = world(base('pjB', { template: 'business', model: { problem: 'P', who: 'W', how: 'H', assumptions: [] } }));
    check('a business idea with three questions answered gets no pointer about its one page', wl(bz).every(x => x.key !== 'one-page'), wl(bz));
    bz.projects.items[0].model = { problem: 'P', who: '', how: '', assumptions: [AS('asA', 'Crews would pay')] };
    bz.tasks.items = [TK('f1', 'pjB'), TK('f2', 'pjB', { done: true, doneOn: k, title: 'Find out: Crews would pay' })];
    bz.projects.items[0].model.assumptions[0].taskId = 'f2';
    check('a business idea with fewer than 3 answered says "Your one page has 2 questions still to answer", after the Find out pointer', eq(texts(wl(bz)), ['A Find out task is done — what did you find?', 'Your one page has 2 questions still to answer']), wl(bz));
    bz.projects.items[0].model.assumptions.push(AS('asB', 'Sites allow it', { taskId: 'f3' }));
    bz.tasks.items.push(TK('f3', 'pjB', { done: true, doneOn: k }));
    check('two beliefs whose Find out tasks are done say "2 Find out tasks are done — what did you find?"', texts(wl(bz))[0] === '2 Find out tasks are done — what did you find?', wl(bz));
    bz.projects.items[0].model.assumptions = [AS('asA', 'Crews would pay')];
    bz.tasks.items = [TK('f1', 'pjB')];
    check('a belief with no Find out task, one answer and an open task: only the one-page pointer, "2 questions still to answer"', eq(texts(wl(bz)), ['Your one page has 2 questions still to answer']), wl(bz));
    const bz0 = world(base('pjB', { template: 'business' })); bz0.tasks.items = [TK('f1', 'pjB')];
    check('an empty business idea says its one page has 4 questions still to answer', eq(texts(wl(bz0)), ['Your one page has 4 questions still to answer']), wl(bz0));
    bz0.projects.items[0].model = { problem: 'P', who: 'W', how: '', assumptions: [] };
    check('with two answers written it says "2 questions still to answer"', eq(texts(wl(bz0)), ['Your one page has 2 questions still to answer']), wl(bz0));
    // Case
    const cw2 = world(base('pjC', { template: 'case', case: { timeline: [], evidence: [EVi('ev1', { status: 'to-get' })], issues: [ISs('is1'), ISs('is2', { status: 'dropped' })] } }));
    cw2.tasks.items = [TK('c1', 'pjC')];
    check('a case says "1 issue has nothing linked yet" (the dropped issue is not counted) and "1 piece of evidence still to get"', eq(texts(wl(cw2)), ['1 issue has nothing linked yet', '1 piece of evidence still to get']), wl(cw2));
    cw2.projects.items[0].case.issues.push(ISs('is3')); cw2.projects.items[0].case.evidence.push(EVi('ev2', { status: 'to-get' }));
    check('…and with two of each "2 issues have nothing linked yet" and "2 pieces of evidence still to get"', eq(texts(wl(cw2)), ['2 issues have nothing linked yet', '2 pieces of evidence still to get']), wl(cw2));
    cw2.projects.items[0].case.evidence[0].issueIds = ['is1']; cw2.projects.items[0].case.evidence[1].status = 'have';
    check('linking evidence to an issue takes it out of the first count, and evidence that is had is no longer "still to get"', eq(texts(wl(cw2)), ['1 issue has nothing linked yet', '1 piece of evidence still to get']), wl(cw2));
    // Order and the limit of three
    const all = world(base('pjO', { template: 'case', case: { timeline: [], evidence: [EVi('ev1', { status: 'to-get' })], issues: [ISs('is1')] } }));
    all.tasks.items = [TK('o1', 'pjO', { title: 'File the form', due: '2026-10-16' })];
    check('a case with a dated task gives the date first, then the issues pointer, then the evidence pointer', eq(texts(wl(all)), ['File the form — in 2 days', '1 issue has nothing linked yet', '1 piece of evidence still to get']), wl(all));
    all.tasks.items = []; all.commitments = [{ id: 'cmA', kind: 'appointment', title: 'Hearing', start: '2026-10-16T10:00', end: '2026-10-16T11:00' }]; all.projects.items[0].commitmentIds = ['cmA'];
    check('with a date, two case pointers and no open task, all three are kept (there is no "No next step" pointer)', eq(texts(wl(all)), ['Hearing — in 2 days', '1 issue has nothing linked yet', '1 piece of evidence still to get']), wl(all));
    all.tasks.items = [TK('o0', 'pjO', { title: 'Send the bundle', due: '2026-10-09' }), TK('o2', 'pjO', { title: 'Draft the letter' })]; all.projects.items[0].nextTaskId = 'o2';
    check('a task still open comes first, and the limit of three leaves out the last pointer', eq(texts(wl(all)), [`Send the bundle — still open, was due ${K.shortDate('2026-10-09')}`, 'Hearing — in 2 days', '1 issue has nothing linked yet']), wl(all));
  }

  console.log('\n[12] The weekly review: when, what moved, what needs you, focus');
  {
    const k = '2026-10-18'; // a Sunday
    const TK = (id, pid, x = {}) => ({ id, title: 'Task ' + id, listId: '', category: 'Admin', minutes: 25, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: OLD, postponed: 0, blockers: [], letGoOn: null, projectId: pid, ...x });
    const AS = (id, text, x = {}) => ({ id, text, state: 'open', found: '', checkedOn: null, taskId: null, createdAt: OLD, ...x });
    const TLe = (id, x = {}) => ({ id, date: '2026-09-01', about: false, title: 'Landlord kept the deposit', details: '', source: 'mine', evidenceIds: [], issueIds: [], createdAt: OLD, ...x });
    const EVi = (id, x = {}) => ({ id, title: 'Tenancy agreement', kind: 'document', date: null, where: '', status: 'have', notes: '', issueIds: [], createdAt: OLD, ...x });
    const withPrefs = (prefs) => { const d = K.freshState(); Object.assign(d.patterns.prefs, prefs); return d; };

    console.log('  When');
    check('the review day is Sunday unless you choose another', K.reviewDay(K.freshState()) === 0);
    check('a saved 5 makes it Friday', K.reviewDay(withPrefs({ reviewDay: 5 })) === 5);
    check('a review day that is not a weekday number (9, -1, 2.5, "x") is read as Sunday', [9, -1, 2.5, 'x'].every(v => K.reviewDay(withPrefs({ reviewDay: v })) === 0));
    const week = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24']; // Sunday … Saturday
    check('with Sunday as the review day, every day from Sunday to Saturday belongs to the review on Sunday 18 Oct', week.every(day => K.lastReviewDay(K.freshState(), day) === '2026-10-18'), week.map(day => K.lastReviewDay(K.freshState(), day)));
    check('with Friday as the review day, Sunday to Thursday belong to Friday 16 Oct and Friday and Saturday to Friday 23 Oct', eq(week.map(day => K.lastReviewDay(withPrefs({ reviewDay: 5 }), day)), ['2026-10-16', '2026-10-16', '2026-10-16', '2026-10-16', '2026-10-16', '2026-10-23', '2026-10-23']), week.map(day => K.lastReviewDay(withPrefs({ reviewDay: 5 }), day)));
    check('the review is due on the review day and the day after, giving that review day', K.reviewDue(K.freshState(), '2026-10-18') === '2026-10-18' && K.reviewDue(K.freshState(), '2026-10-19') === '2026-10-18');
    check('…and not two days after (nothing is due), or any later that week', K.reviewDue(K.freshState(), '2026-10-20') === null && K.reviewDue(K.freshState(), '2026-10-24') === null);
    check('with Friday as the review day it is due on Friday 23 and Saturday 24, not on Sunday 25', K.reviewDue(withPrefs({ reviewDay: 5 }), '2026-10-23') === '2026-10-23' && K.reviewDue(withPrefs({ reviewDay: 5 }), '2026-10-24') === '2026-10-23' && K.reviewDue(withPrefs({ reviewDay: 5 }), '2026-10-25') === null);
    check('once that review is done it is no longer due', K.reviewDue(withPrefs({ reviewed: '2026-10-18' }), '2026-10-19') === null);
    check('once that review is put off it is no longer due', K.reviewDue(withPrefs({ reviewHidden: '2026-10-18' }), '2026-10-18') === null);
    check('a review done or put off for an earlier week does not hide this week\'s', K.reviewDue(withPrefs({ reviewed: '2026-10-11', reviewHidden: '2026-10-04' }), '2026-10-18') === '2026-10-18');

    console.log('  What moved');
    const mv = K.freshState();
    mv.projects.items = [
      base('pjA', { title: 'Coffee subscription', milestones: [{ id: 'ms1', title: 'First order', aim: null, reachedOn: '2026-10-12', createdAt: OLD }, { id: 'ms2', title: 'Second order', aim: null, reachedOn: '2026-10-11', createdAt: OLD }, { id: 'ms3', title: 'Third order', aim: null, reachedOn: null, createdAt: OLD }],
        decisions: [{ id: 'dc1', question: 'Which roaster?', options: [{ id: 'op1', text: 'Local', pros: [], cons: [] }], chosen: 'op1', why: '', decidedOn: '2026-10-18', createdAt: OLD, updatedAt: OLD }, { id: 'dc2', question: 'Which box?', options: [], chosen: null, why: '', decidedOn: null, createdAt: OLD, updatedAt: OLD }] }),
      base('pjB', { title: 'Van hire idea', template: 'business', model: { problem: '', who: '', how: '', assumptions: [AS('as1', 'Crews would pay', { state: 'looks-true', checkedOn: '2026-10-15' }), AS('as2', 'Sites allow it', { state: 'looks-true', checkedOn: '2026-10-10' })] } }),
      base('pjC', { title: 'Deposit dispute', template: 'case', case: { timeline: [TLe('tl1', { createdAt: '2026-10-14T09:00' }), TLe('tl2', { createdAt: '2026-10-11T09:00' })], evidence: [EVi('ev1', { createdAt: '2026-10-18T20:00' }), EVi('ev2', { createdAt: '2026-10-19T08:00' })], issues: [{ id: 'is1', title: 'Late fee', status: 'considering', notes: '', createdAt: '2026-10-15T09:00' }] } }),
      base('pjD', { title: 'Allotment plan' }),
    ];
    mv.tasks.items = [
      TK('a1', 'pjA', { title: 'Write to roasters', done: true, doneOn: '2026-10-13' }), TK('a2', 'pjA', { title: 'Price the boxes', done: true, doneOn: '2026-10-12' }),
      TK('a3', 'pjA', { title: 'Book a tasting', done: true, doneOn: '2026-10-18' }), TK('a4', 'pjA', { title: 'Order samples', done: true, doneOn: '2026-10-15' }),
      TK('a5', 'pjA', { title: 'Done last week', done: true, doneOn: '2026-10-11' }), TK('a6', 'pjA', { title: 'Done tomorrow', done: true, doneOn: '2026-10-19' }), TK('a7', 'pjA', { title: 'Not done', done: false }),
      TK('d1', 'pjD', { title: 'Old job', done: true, doneOn: '2026-10-05' }),
      TK('o1', null, { title: 'Pay council tax', done: true, doneOn: '2026-10-16' }), TK('o2', null, { title: 'Renew passport', done: true, doneOn: '2026-10-12' }), TK('o3', null, { title: 'Old chore', done: true, doneOn: '2026-10-09' }), TK('o4', null, { title: 'Open chore' }),
    ];
    mv.study.sessions = [
      { id: 'ss1', courseId: null, taskId: null, title: 'THM', date: '2026-10-13', startedAt: '2026-10-13T19:00', plannedMin: 30, short: false, status: 'done', runningSince: null, activeMs: 1500000, endedAt: '2026-10-13T19:30', checkin: null, taskDone: null, todayUid: null },
      { id: 'ss2', courseId: null, taskId: null, title: 'THM', date: '2026-10-17', startedAt: '2026-10-17T19:00', plannedMin: 15, short: true, status: 'done', runningSince: null, activeMs: 600000, endedAt: '2026-10-17T19:10', checkin: null, taskDone: null, todayUid: null },
      { id: 'ss3', courseId: null, taskId: null, title: 'Still going', date: '2026-10-18', startedAt: '2026-10-18T19:00', plannedMin: 15, short: true, status: 'active', runningSince: 1, activeMs: 300000, endedAt: null, checkin: null, taskDone: null, todayUid: null },
      { id: 'ss4', courseId: null, taskId: null, title: 'Before', date: '2026-10-11', startedAt: '2026-10-11T19:00', plannedMin: 30, short: false, status: 'done', runningSince: null, activeMs: 1800000, endedAt: '2026-10-11T19:30', checkin: null, taskDone: null, todayUid: null },
    ];
    const WS = (id, date, status) => ({ id, date, templateId: 'wt1', templateName: 'Full body', startedAt: date + 'T07:00', finishedAt: status === 'active' ? null : date + 'T07:45', status, plannedDate: null, editedAt: null, exercises: [] });
    mv.health.workout.sessions = [WS('w1', '2026-10-14', 'done'), WS('w2', '2026-10-18', 'active'), WS('w3', '2026-10-11', 'done')];
    const wk = K.whatMoved(mv, k);
    check('the week is the seven days ending on the day given (12 to 18 Oct)', wk.from === '2026-10-12' && wk.to === '2026-10-18', [wk.from, wk.to]);
    check('only projects with something moved are listed, busiest first (Coffee subscription, Deposit dispute, Van hire idea)', eq(wk.projects.map(m => m.project.id), ['pjA', 'pjC', 'pjB']), wk.projects.map(m => m.project.id));
    const mA = wk.projects[0];
    check('a project counts the tasks done this week, the milestones reached and the decisions decided, and nothing from outside the week', mA.tasks === 4 && mA.milestones === 1 && mA.decisions === 1, [mA.tasks, mA.milestones, mA.decisions]);
    check('a project lists up to 3 of the tasks it finished, in the order they are saved', eq(mA.done, ['Write to roasters', 'Price the boxes', 'Book a tasting']), mA.done);
    check('a business idea counts a belief checked this week as found out (not the one checked before the week)', wk.projects[2].found === 1 && wk.projects[2].tasks === 0, wk.projects[2]);
    check('a case counts a timeline entry and a piece of evidence made this week as recorded (not those from before or after)', wk.projects[1].recorded === 2 && wk.projects[1].found === 0, wk.projects[1]);
    check('a project whose only done task was outside the week is left out', !wk.projects.some(m => m.project.id === 'pjD'));
    check('tasks done this week that belong to no project are counted (2 of 3; the old one and the open one are not)', wk.otherTasks === 2, wk.otherTasks);
    check('study counts the sessions finished this week (2) and their minutes from the time actually spent (35), not a session still going or one from before', wk.studySessions === 2 && wk.studyMinutes === 35, [wk.studySessions, wk.studyMinutes]);
    check('workouts count those not still going this week (1), not one from before', wk.workouts === 1, wk.workouts);
    const quietWeek = K.whatMoved(K.freshState(), k);
    check('a week with nothing in it is all zero and lists no projects', quietWeek.projects.length === 0 && quietWeek.otherTasks === 0 && quietWeek.studySessions === 0 && quietWeek.studyMinutes === 0 && quietWeek.workouts === 0, quietWeek);
    // A project task ticked on a day's plan (on Today) is one task: its own record says done too, dated the plan's day.
    const planTask = uid => ({ uid, taskId: null, category: 'admin', title: 'Order the felt', minutes: 25, baseMinutes: 25, done: false, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null });
    const tp = K.freshState();
    tp.projects.items = [base('pjT', { title: 'Garden shed' })];
    tp.days[k] = { energy: 3, rest: false, builtAt: k + 'T08:00', checkedIn: false, tasks: [planTask('puT')] };
    tp.tasks.items = [TK('tkT', 'pjT', { title: 'Order the felt', plannedOn: k, planUid: 'puT' })];
    K.setDone(tp, tp.days[k].tasks[0], true);
    const ti = tp.tasks.items[0];
    check('a project task ticked on the day\'s plan is ticked in Tasks too, dated the plan\'s day', ti.done === true && ti.doneOn === k, [ti.done, ti.doneOn]);
    check('…so What moved counts it for its project', K.whatMoved(tp, k).projects[0]?.project.id === 'pjT' && K.whatMoved(tp, k).projects[0].tasks === 1, K.whatMoved(tp, k).projects.map(m => [m.project.id, m.tasks]));
    check('…and that day\'s count has it once, not twice (the plan and Tasks)', K.doneOnDay(tp, k) === 1, K.doneOnDay(tp, k));
    K.setDone(tp, tp.days[k].tasks[0], false);
    check('unticking it on the plan unticks it in Tasks too, and What moved no longer counts it', ti.done === false && ti.doneOn === null && K.whatMoved(tp, k).projects.length === 0, [ti.done, ti.doneOn]);
    const lone = K.freshState();
    lone.days[k] = { energy: 3, rest: false, builtAt: k + 'T08:00', checkedIn: false, tasks: [planTask('puL')] };
    lone.tasks.items = [TK('tkL', null, { title: 'Something else' })];
    K.setDone(lone, lone.days[k].tasks[0], true);
    check('ticking a plan task that came from no task in Tasks changes nothing there', lone.tasks.items[0].done === false && lone.tasks.items[0].doneOn === null);
    const yk = K.shift(k, -1), ty = K.freshState();
    ty.days[yk] = { energy: 3, rest: false, builtAt: yk + 'T08:00', checkedIn: false, tasks: [planTask('puY')] };
    ty.tasks.items = [TK('tkY', 'pjT', { plannedOn: yk, planUid: 'puY' })];
    K.setDone(ty, ty.days[yk].tasks[0], true);
    check('ticked in the evening check-in on yesterday\'s plan: dated yesterday, the plan\'s day', ty.tasks.items[0].done && ty.tasks.items[0].doneOn === yk, ty.tasks.items[0].doneOn);
    // "Start today over": the plan goes; a task ticked off from Tasks stays done, no longer linked, and still counts.
    const tr = K.freshState();
    tr.projects.items = [base('pjT', { title: 'Garden shed' })];
    tr.days[k] = { energy: 4, rest: false, builtAt: k + 'T08:00', checkedIn: false, tasks: [planTask('puR'), planTask('puO')] };
    tr.tasks.items = [TK('tkR', 'pjT', { plannedOn: k, planUid: 'puR' }), TK('tkO', 'pjT', { plannedOn: k, planUid: 'puO' })];
    K.setDone(tr, tr.days[k].tasks[0], true);
    K.clearDay(tr, k);
    const [trDone, trOpen] = tr.tasks.items;
    check('"Start today over" clears the plan; a task ticked off from Tasks stays done, dated that day, no longer linked', !tr.days[k] && trDone.done && trDone.doneOn === k && trDone.plannedOn === null && trDone.planUid === null, trDone);
    check('…an open one is no longer linked either, so it is due again rather than "on today\'s plan"', !trOpen.done && trOpen.plannedOn === null && trOpen.planUid === null, trOpen);
    check('…and that day still counts the done one once, and What moved still has it', K.doneOnDay(tr, k) === 1 && K.whatMoved(tr, k).projects[0]?.tasks === 1, [K.doneOnDay(tr, k), K.whatMoved(tr, k).projects.length]);
    check('clearing a day with no plan changes nothing', K.clearDay(K.freshState(), k) === false);
    // Rolled to the next day in the evening check-in: the task follows its copy through the queue.
    const rl = K.freshState(), yd = K.shift(k, -1);
    rl.days[yd] = { energy: 3, rest: false, builtAt: yd + 'T08:00', checkedIn: true, tasks: [planTask('puA')] };
    rl.tasks.items = [TK('tkA', 'pjT', { plannedOn: yd, planUid: 'puA' })];
    const ta = rl.tasks.items[0];
    K.toggleRoll(rl, yd, rl.days[yd].tasks[0]);
    const rolledQ = rl.queue[0];
    check('rolled in the evening check-in: it waits in the queue, not in Tasks', !!rolledQ && rolledQ.sourceUid === 'puA' && K.inQueue(rl, ta));
    const land = () => { const t = K.taskFromQueue(rl.queue[0]); rl.queue = []; rl.days[k] = { energy: 3, rest: false, builtAt: k + 'T08:00', checkedIn: false, tasks: [t] }; K.followQueued(rl, k); return t; };
    let landed = land();
    check('when it lands on the next day\'s plan the task follows it there: on that plan, no longer waiting', ta.plannedOn === k && ta.planUid === landed.uid && !K.inQueue(rl, ta) && K.onTodaysPlan(rl, ta, k), ta);
    K.setDone(rl, landed, true);
    check('…so ticking it there ticks the task, dated that day', ta.done && ta.doneOn === k);
    K.setDone(rl, landed, false);
    K.clearDay(rl, k);
    check('"Start today over" on that day: it goes back to the queue and the task waits there again (not lost, not twice)', rl.queue.length === 1 && rl.queue[0].sourceUid === 'puA' && ta.plannedOn === yd && ta.planUid === 'puA' && K.inQueue(rl, ta), [rl.queue.length, ta.plannedOn, ta.planUid]);
    landed = land();
    K.setDone(rl, landed, true);
    K.clearDay(rl, k);
    check('ticked on the day it landed, then that day started over: it stays done and doesn\'t come back from the queue', rl.queue.length === 0 && ta.done && ta.plannedOn === null, [rl.queue.length, ta.done, ta.plannedOn]);
    const gone = K.freshState();
    gone.days[yd] = { energy: 3, rest: false, builtAt: yd + 'T08:00', checkedIn: true, tasks: [planTask('puG')] };
    gone.tasks.items = [TK('tkG', 'pjT', { plannedOn: yd, planUid: 'puG' })];
    K.toggleRoll(gone, yd, gone.days[yd].tasks[0]);
    gone.queue = []; // taken by an older MyDay, or removed from the queue
    check('if the queue no longer has it, the task is back in Tasks rather than hidden for good', !K.inQueue(gone, gone.tasks.items[0]));
    const rolledOne = (id, uid) => { const s = K.freshState(); s.days[yd] = { energy: 3, rest: false, builtAt: yd + 'T08:00', checkedIn: true, tasks: [planTask(uid)] }; s.tasks.items = [TK(id, 'pjT', { plannedOn: yd, planUid: uid })]; K.toggleRoll(s, yd, s.days[yd].tasks[0]); return s; };
    const rt = rolledOne('tkT2', 'puT2'), leftover = K.taskFromQueue(rt.queue[0]);
    K.setTaskDone(rt, 'tkT2', true);
    check('rolled, then ticked off in Your tasks: it no longer waits in the queue', rt.queue.length === 0 && rt.days[yd].tasks[0].rolledQid === null, rt.queue);
    rt.days[k] = { energy: 3, rest: false, builtAt: k + 'T08:00', checkedIn: false, tasks: [leftover] };
    K.followQueued(rt, k);
    check('…and a copy of it landing anyway (taken by an older MyDay) never relinks the done task to an open copy', rt.tasks.items[0].planUid === 'puT2' && rt.tasks.items[0].done);
    const lg = rolledOne('tkL2', 'puL2');
    K.unstick(lg, 'tkL2', { reason: 'notneeded' }, k);
    check('rolled, then let go: it no longer waits in the queue either', lg.queue.length === 0 && !!lg.tasks.items[0].letGoOn, lg.queue);
    const lf = K.freshState();
    lf.days[k] = { energy: 3, rest: false, builtAt: k + 'T08:00', checkedIn: false, tasks: [planTask('puF')] };
    lf.tasks.items = [TK('tkF', 'pjT', { plannedOn: k, planUid: 'puF' })];
    K.sendToQueue(lf, lf.days[k].tasks[0], k);
    const backQ = rolledOne('tkB2', 'puB2'), queuedCopy = K.taskFromQueue(backQ.queue[0]);
    backQ.queue = []; backQ.days[k] = { energy: 3, rest: false, builtAt: k + 'T08:00', checkedIn: false, tasks: [queuedCopy] }; K.followQueued(backQ, k);
    K.sendToQueue(backQ, queuedCopy, k);
    check('"Leave for later" on a copy that came from the queue: back to the queue, and the task waits there again', backQ.queue.length === 1 && backQ.tasks.items[0].plannedOn === yd && backQ.tasks.items[0].planUid === 'puB2' && K.inQueue(backQ, backQ.tasks.items[0]), backQ.tasks.items[0]);
    const freeQ = K.freshState();
    freeQ.days[k] = { energy: 3, rest: false, builtAt: k + 'T08:00', checkedIn: false, tasks: [planTask('puZ')] };
    K.sendToQueue(freeQ, freeQ.days[k].tasks[0], k);
    check('…and a plan task that isn\'t from Your tasks still waits in the queue, as before', freeQ.queue.length === 1 && freeQ.queue[0].title === 'Order the felt', freeQ.queue);
    check('"Leave for later" on a task put straight on the plan from Your tasks: back to Your tasks with its own date, not into the queue', lf.queue.length === 0 && lf.tasks.items[0].plannedOn === null && lf.tasks.items[0].planUid === null, [lf.queue.length, lf.tasks.items[0].planUid]);

    console.log('  What\'s waiting');
    const wt = K.freshState();
    const act = (id, x = {}) => base(id, { updatedAt: '2026-10-17T09:00', ...x });
    wt.projects.items = [
      act('pjQ', { title: 'Allotment plan', updatedAt: '2026-09-20T09:00' }),
      act('pjP', { title: 'Paused thing', status: 'paused', updatedAt: '2026-08-01T09:00' }),
      act('pjR', { title: 'Coffee subscription', decisions: [{ id: 'dc1', question: 'Which roaster?', options: [], chosen: null, why: '', decidedOn: null, createdAt: '2026-10-01T09:00', updatedAt: OLD }, { id: 'dc2', question: 'Which box?', options: [], chosen: null, why: '', decidedOn: null, createdAt: '2026-10-05T09:00', updatedAt: OLD }, { id: 'dc3', question: 'Which van?', options: [], chosen: 'x', why: '', decidedOn: '2026-10-02', createdAt: '2026-09-01T09:00', updatedAt: OLD }] }),
      act('pjB', { title: 'Van hire idea', template: 'business', model: { problem: '', who: '', how: '', assumptions: [AS('as1', 'Crews would pay', { taskId: 'f1' })] } }),
      act('pjC', { title: 'Deposit dispute', template: 'case', case: { timeline: [], evidence: [EVi('ev1', { status: 'to-get' }), EVi('ev2', { status: 'to-get' }), EVi('ev3', { status: 'have' })], issues: [] } }),
    ];
    wt.tasks.items = [
      TK('s1', null, { title: 'Pay council tax', postponed: 3 }), TK('s2', null, { title: 'Renew passport', due: '2026-10-10' }),
      TK('s3', null, { title: 'Due only 6 days ago', due: '2026-10-12' }), TK('s4', null, { title: 'Moved twice', postponed: 2 }),
      TK('s5', null, { title: 'Let go of', postponed: 5, letGoOn: '2026-10-10' }), TK('s6', null, { title: 'Ticked', postponed: 5, done: true, doneOn: '2026-10-16' }),
      TK('f1', 'pjB', { title: 'Find out: Crews would pay', done: true, doneOn: '2026-10-16' }),
    ];
    const wa = K.whatsWaiting(wt, k, 10);
    check('a task that has moved 3 times says so', wa[0].kind === 'stuck' && wa[0].text === '“Pay council tax” has moved 3 times', wa[0]);
    check('a task a week past due says when it was planned for', wa[1].kind === 'stuck' && wa[1].text === `“Renew passport” was planned for ${K.shortDate('2026-10-10')}`, wa[1]);
    check('a task moved twice, one only 6 days past due, one let go of and one ticked are not stuck', wa.filter(w => w.kind === 'stuck').length === 2, wa.map(w => w.text));
    check('an active project quiet for 4 weeks says so (and a paused one is not mentioned)', wa[2].kind === 'quiet' && wa[2].text === '“Allotment plan” has been quiet for 4 weeks' && !wa.some(w => w.text.includes('Paused thing')), wa.map(w => w.text));
    check('an open decision 14 or more days old is mentioned with its project (not a newer one or a decided one)', wa[3].kind === 'decision' && wa[3].text === '“Which roaster?” is still open (Coffee subscription)' && wa.filter(w => w.kind === 'decision').length === 1, wa.map(w => w.text));
    check('a business idea whose Find out task is done asks what you found', wa[4].kind === 'found' && wa[4].text === 'Van hire idea: a Find out task is done — what did you find?', wa[4]);
    check('a case with evidence still to get says how many pieces', wa[5].kind === 'evidence' && wa[5].text === 'Deposit dispute: 2 pieces of evidence still to get', wa[5]);
    check('they come in the order stuck, quiet, decision, found out, evidence', eq(wa.map(w => w.kind), ['stuck', 'stuck', 'quiet', 'decision', 'found', 'evidence']), wa.map(w => w.kind));
    check('each links to where it can be dealt with', wa[0].href === '#today/tasks/s1' && wa[2].href === '#projects/p/pjQ' && wa[3].href === '#projects/p/pjR/decisions' && wa[5].href === '#projects/p/pjC/evidence', wa.map(w => w.href));
    const wa5 = K.whatsWaiting(wt, k);
    check('by default no more than 5 are given, the last of the six left out', wa5.length === 5 && eq(wa5.map(w => w.kind), ['stuck', 'stuck', 'quiet', 'decision', 'found']), wa5.map(w => w.kind));
    const qb = K.freshState(); qb.projects.items = [act('pj14', { title: 'Fourteen days', updatedAt: '2026-10-04T09:00' }), act('pj13', { title: 'Thirteen days', updatedAt: '2026-10-05T09:00' })];
    check('a project is quiet at 14 days ("2 weeks") but not at 13', eq(K.whatsWaiting(qb, k).map(w => w.text), ['“Fourteen days” has been quiet for 2 weeks']), K.whatsWaiting(qb, k));
    check('a week with nothing that needs you gives an empty list', K.whatsWaiting(K.freshState(), k).length === 0);

    console.log('  Focus');
    const fp = base('pjF', { focus: '2026-10-19' });
    check('a project is in focus for the 7 days from its focus day (19 to 25 Oct), not before or after', !K.inFocus(fp, '2026-10-18') && K.inFocus(fp, '2026-10-19') && K.inFocus(fp, '2026-10-25') && !K.inFocus(fp, '2026-10-26'));
    check('a project with no focus is never in focus', !K.inFocus(base('pjG'), k));
    const fw = world(fp, base('pjH', { focus: '2026-10-19', status: 'paused' }), base('pjI'));
    check('the projects in focus are the active ones within their week', eq(K.focusProjects(fw, '2026-10-20').map(p => p.id), ['pjF']) && K.focusProjects(fw, '2026-10-26').length === 0);

    console.log('  Finishing the review');
    const fr = () => { const d = K.freshState(); d.projects.items = ['pjA', 'pjB', 'pjC', 'pjD'].map(id => base(id)).concat(base('pjE', { status: 'paused' })); return d; };
    const fin = (over = {}) => ({ day: '2026-10-18', from: '2026-10-12', start: '2026-10-19', focus: [], went: '', easier: '', ...over });
    const focused = d => d.projects.items.filter(p => p.focus).map(p => p.id);
    let f = fr(); K.finishReview(f, fin({ focus: ['pjA', 'pjB', 'pjC'] }));
    check('up to 3 active projects chosen get the focus week starting on the day given', eq(focused(f), ['pjA', 'pjB', 'pjC']) && f.projects.items[0].focus === '2026-10-19', focused(f));
    f = fr(); K.finishReview(f, fin({ focus: ['pjA', 'pjB', 'pjC', 'pjD'] }));
    check('a 4th project chosen is ignored', eq(focused(f), ['pjA', 'pjB', 'pjC']), focused(f));
    f = fr(); K.finishReview(f, fin({ focus: ['pjE', 'pjA'] }));
    check('a paused project chosen does not get the focus', eq(focused(f), ['pjA']), focused(f));
    f = fr(); f.projects.items[3].focus = '2026-10-19'; f.projects.items[2].focus = '2026-10-12';
    K.finishReview(f, fin({ focus: ['pjA'] }));
    check('a project in focus for this same week but not chosen again loses it; one from an earlier week is left as it was', eq(focused(f), ['pjC', 'pjA'].sort((a, b) => ['pjA', 'pjC'].indexOf(a) - ['pjA', 'pjC'].indexOf(b))) && f.projects.items[3].focus === undefined && f.projects.items[2].focus === '2026-10-12', f.projects.items.map(p => [p.id, p.focus]));
    f = fr(); K.finishReview(f, fin({ focus: ['pjA'] }));
    check('giving a project its focus does not change its updated time', f.projects.items[0].updatedAt === OLD && f.projects.items[1].updatedAt === OLD);
    f = fr(); let r = K.finishReview(f, fin({ went: '   ', easier: '' }));
    check('nothing written adds no note (noteId is null) but the review is marked as done', r.noteId === null && f.notes.items.length === 0 && f.patterns.prefs.reviewed === '2026-10-18');
    f = fr(); r = K.finishReview(f, fin({ went: '  Finished the quote  ' }));
    const nt = f.notes.items[0];
    check('only the first answer written adds a note with just that part', f.notes.items.length === 1 && r.noteId === nt.id && nt.text === 'What went well:\nFinished the quote', nt.text);
    check('the note is titled with the week\'s first day, kept in Personal, and marked as that week\'s reflection', nt.title === `Week of ${K.shortDate('2026-10-12')}` && nt.categoryId === f.notes.categories.find(c => c.name === 'Personal').id && nt.reflectionWeek === '2026-10-12' && !nt.pinned, nt);
    f = fr(); K.finishReview(f, fin({ easier: 'Fewer meetings' }));
    check('only the second answer written adds a note with just that part', f.notes.items[0].text === 'What would make next week easier:\nFewer meetings', f.notes.items[0].text);
    f = fr(); K.finishReview(f, fin({ went: 'A quiet week', easier: 'Fewer meetings' }));
    check('both answers make one note with both parts, a blank line between', f.notes.items[0].text === 'What went well:\nA quiet week\n\nWhat would make next week easier:\nFewer meetings', f.notes.items[0].text);
    f = fr(); f.notes.categories = f.notes.categories.filter(c => c.name !== 'Personal'); K.finishReview(f, fin({ went: 'A quiet week' }));
    check('with no Personal collection the note is not filed anywhere (empty category)', f.notes.items[0].categoryId === '', f.notes.items[0]);
    // In a week with Study: what got easier and what still feels hard, in the same note (specs/study-home-and-lessons.md §11).
    f = fr(); K.finishReview(f, fin({ went: 'A quiet week', gotEasier: '  Reading without vowels  ', stillHard: 'The dual' }));
    check('the Study answers follow in the same note, each with its own heading', f.notes.items.length === 1 && f.notes.items[0].text === 'What went well:\nA quiet week\n\nStudy, what got easier:\nReading without vowels\n\nStudy, what still feels hard:\nThe dual', f.notes.items[0].text);
    f = fr(); r = K.finishReview(f, fin({ stillHard: 'The dual' }));
    check('a Study answer alone still makes the note', !!r.noteId && f.notes.items[0].text === 'Study, what still feels hard:\nThe dual', f.notes.items[0]?.text);
    const sw = K.freshState();
    check('a week with no Study has no Study questions', !K.studiedIn(sw, '2026-10-12', '2026-10-18'));
    sw.study.sessions.push({ id: 'ssW', courseId: null, taskId: null, title: 'x', date: '2026-10-14', startedAt: '2026-10-14T09:00', plannedMin: 25, short: false, status: 'done', runningSince: null, activeMs: 60000, endedAt: '2026-10-14T09:25', checkin: null, taskDone: null, todayUid: null });
    check('a Study session finished in the week counts; one outside it doesn\'t', K.studiedIn(sw, '2026-10-12', '2026-10-18') && !K.studiedIn(sw, '2026-10-19', '2026-10-25'));
    const aw = K.freshState(); aw.arabic.attempts.push({ id: 'aaW', lessonId: 'lesson.arabic-fusha-register', finishedAt: new Date(2026, 9, 16, 20, 0).toISOString() });
    check('…and so does an Arabic session finished in the week (by its local day)', K.studiedIn(aw, '2026-10-12', '2026-10-18') && !K.studiedIn(aw, '2026-10-17', '2026-10-18'));
    const at = (y, mo, d, h, mi) => new Date(y, mo, d, h, mi).toISOString(); // a local time, as the app stores it
    const edge = K.freshState(); edge.arabic.attempts.push({ id: 'aaE1', lessonId: 'lesson.arabic-fusha-register', finishedAt: at(2026, 9, 12, 0, 30) });
    const late = K.freshState(); late.arabic.attempts.push({ id: 'aaE2', lessonId: 'lesson.arabic-fusha-register', finishedAt: at(2026, 9, 18, 23, 30) });
    const before = K.freshState(); before.arabic.attempts.push({ id: 'aaE3', lessonId: 'lesson.arabic-fusha-register', finishedAt: at(2026, 9, 11, 23, 30) });
    check('the week\'s edges are local days: 00:30 on its first day and 23:30 on its last count, 23:30 the day before doesn\'t', K.studiedIn(edge, '2026-10-12', '2026-10-18') && K.studiedIn(late, '2026-10-12', '2026-10-18') && !K.studiedIn(before, '2026-10-12', '2026-10-18'));
    const cw = K.freshState(); cw.cybersecurity.attempts.push({ id: 'caW', submittedAt: at(2026, 9, 14, 10, 0) });
    const open = K.freshState(); open.arabic.attempts.push({ id: 'aaO', lessonId: 'lesson.arabic-fusha-register', finishedAt: null }); open.cybersecurity.attempts.push({ id: 'caO', submittedAt: null });
    open.study.sessions.push({ ...sw.study.sessions[0], id: 'ssO', status: 'active' });
    check('a Cybersecurity attempt handed in that week counts; sessions still open and attempts not handed in don\'t', K.studiedIn(cw, '2026-10-12', '2026-10-18') && !K.studiedIn(open, '2026-10-12', '2026-10-18'));
    f = fr(); K.finishReview(f, fin({ went: 'W', easier: 'E', gotEasier: 'G', stillHard: 'H' }));
    check('all four answers: the first two exactly as before, then the two Study ones', f.notes.items[0].text === 'What went well:\nW\n\nWhat would make next week easier:\nE\n\nStudy, what got easier:\nG\n\nStudy, what still feels hard:\nH', f.notes.items[0].text);

    console.log('  Putting it off and the review day');
    f = K.freshState();
    check('putting the review off remembers that day, and putting off the same day again changes nothing', K.putOffReview(f, '2026-10-18') && f.patterns.prefs.reviewHidden === '2026-10-18' && !K.putOffReview(f, '2026-10-18'));
    check('the review day is already Sunday, so choosing Sunday changes nothing', !K.setReviewDay(f, 0) && !('reviewDay' in f.patterns.prefs));
    check('choosing 1 to 6 saves it, and the same again changes nothing', K.setReviewDay(f, 5) && f.patterns.prefs.reviewDay === 5 && !K.setReviewDay(f, 5) && K.reviewDay(f) === 5);
    check('choosing Sunday again removes the field from the preferences', K.setReviewDay(f, 0) && !('reviewDay' in f.patterns.prefs) && K.reviewDay(f) === 0, f.patterns.prefs);
    check('a day that is not a whole number from 0 to 6 is refused and nothing is saved', [7, -1, 2.5, NaN].every(v => !K.setReviewDay(f, v)) && !('reviewDay' in f.patterns.prefs));

    console.log('  Next steps on Today');
    const sf = K.freshState();
    sf.projects.items = [base('pjX', { title: 'Recent one', updatedAt: '2026-10-17T09:00' }), base('pjY', { title: 'Older one', updatedAt: '2026-10-05T09:00' })];
    sf.tasks.items = [TK('x1', 'pjX', { createdAt: '2026-10-05T09:00' }), TK('y1', 'pjY', { createdAt: '2026-10-05T09:00' })];
    check('with no focus, the project worked on most recently comes first', eq(K.stepsForToday(sf, k).map(s => s.project.id), ['pjX', 'pjY']), K.stepsForToday(sf, k).map(s => s.project.id));
    sf.projects.items[1].focus = '2026-10-12';
    check('a project in focus comes before one worked on more recently', eq(K.stepsForToday(sf, k).map(s => s.project.id), ['pjY', 'pjX']), K.stepsForToday(sf, k).map(s => s.project.id));
    check('once its focus week is over it goes back to its place', eq(K.stepsForToday(sf, '2026-10-19').map(s => s.project.id), ['pjX', 'pjY']), K.stepsForToday(sf, '2026-10-19').map(s => s.project.id));

    console.log('  Reading saved data');
    rep = { dropped: 0 };
    out = K.normalizeProjects({ items: [base('pjOk', { focus: '2026-10-19' }), base('pjBad', { focus: 'soon' }), base('pjNum', { focus: 20261019 })] }, rep);
    check('a project\'s focus is kept when it is a real date and left out when it is not', out.items[0].focus === '2026-10-19' && !('focus' in out.items[1]) && !('focus' in out.items[2]), out.items.map(p => p.focus));
    const nr = K.freshState(); const cat = nr.notes.categories[0].id;
    nr.notes.items = [{ id: 'n1', categoryId: cat, title: 'a', text: 'a', pinned: false, createdAt: OLD, updatedAt: OLD, reflectionWeek: '2026-10-12' }, { id: 'n2', categoryId: cat, title: 'b', text: 'b', pinned: false, createdAt: OLD, updatedAt: OLD, reflectionWeek: 'last week' }];
    const nn = K.normalize(clone(nr));
    check('a note\'s reflection week is kept when it is a real date and left out when it is not', nn.notes.items.find(n => n.id === 'n1').reflectionWeek === '2026-10-12' && !('reflectionWeek' in nn.notes.items.find(n => n.id === 'n2')));
    const rd = (prefs) => { const d = K.freshState(); Object.assign(d.patterns.prefs, prefs); return K.normalize(clone(d)).patterns.prefs; };
    check('the review day is kept only as 1 to 6 (0, 7, 2.5 and text leave no field)', rd({ reviewDay: 3 }).reviewDay === 3 && [0, 7, 2.5, 'x'].every(v => !('reviewDay' in rd({ reviewDay: v }))));
    check('reviewed and reviewHidden are kept only as real dates', rd({ reviewed: '2026-10-16', reviewHidden: '2026-10-09' }).reviewed === '2026-10-16' && rd({ reviewed: '2026-10-16', reviewHidden: '2026-10-09' }).reviewHidden === '2026-10-09'
      && !('reviewed' in rd({ reviewed: 'yesterday' })) && !('reviewHidden' in rd({ reviewHidden: 7 })));
  }


  console.log('\n[13] The outcome, what counts as finished, and where I left off (all optional, inside the project)');
  {
    const AT = '2026-10-20T18:30';
    const withAll = base('pjL', { outcome: 'A quiet corner I read in every evening', finishedWhen: 'The chair is bought and the shelf is up', leftOff: { text: 'Measured the wall; the shelf bracket is still to choose', at: AT } });
    let rp = { dropped: 0 };
    let o1 = K.normalizeProjects({ items: [clone(withAll)] }, rp).items[0];
    check('a project with an outcome, a finish line and a note is read back exactly as it was, nothing counted', eq(o1, withAll) && rp.dropped === 0, [o1, rp]);
    rp = { dropped: 0 };
    o1 = K.normalizeProjects({ items: [base('pjL', { outcome: 'o'.repeat(250), finishedWhen: 'f'.repeat(700), leftOff: { text: 'n'.repeat(900), at: AT } })] }, rp).items[0];
    check('an outcome is cut to 200 characters, a finish line to 600 and a note to 800, with nothing counted', o1.outcome.length === 200 && o1.finishedWhen.length === 600 && o1.leftOff.text.length === 800 && o1.leftOff.at === AT && rp.dropped === 0, [o1.outcome.length, o1.finishedWhen.length, o1.leftOff.text.length, rp]);
    rp = { dropped: 0 };
    o1 = K.normalizeProjects({ items: [base('pjL', { outcome: '', finishedWhen: '' })] }, rp).items[0];
    check('an empty outcome or finish line is removed without being counted', !('outcome' in o1) && !('finishedWhen' in o1) && rp.dropped === 0, [o1, rp]);
    rp = { dropped: 0 };
    o1 = K.normalizeProjects({ items: [base('pjL', { outcome: '   ', finishedWhen: null, leftOff: { text: '  ', at: AT } }), base('pjM', { leftOff: null })] }, rp).items;
    check('blank values (spaces only, null, a note with blank text) are simply absent, not counted as unreadable', o1.every(x => !('outcome' in x) && !('finishedWhen' in x) && !('leftOff' in x)) && rp.dropped === 0, [o1, rp]);
    rp = { dropped: 0 };
    o1 = K.normalizeProjects({ items: [base('pjL', { leftOff: 'Waiting on the quote' })] }, rp).items[0];
    check('a note saved as plain text (not a note with its time) is removed and counted as dropped', !('leftOff' in o1) && rp.dropped === 1, [o1, rp]);
    rp = { dropped: 0 };
    o1 = K.normalizeProjects({ items: [base('pjL', { outcome: 42 })] }, rp).items[0];
    check('an outcome that is a number is removed and counted as dropped', !('outcome' in o1) && rp.dropped === 1, [o1, rp]);
    rp = { dropped: 0 };
    o1 = K.normalizeProjects({ items: [base('pjL', { leftOff: { at: AT } })] }, rp).items[0];
    check('a note without text is removed and counted as dropped', !('leftOff' in o1) && rp.dropped === 1, [o1, rp]);
    rp = { dropped: 0 };
    o1 = K.normalizeProjects({ items: [base('pjL', { leftOff: { text: 'Something', at: 'yesterday' } })] }, rp).items[0];
    check('a note with a time that is not a real date and time is removed and counted as dropped', !('leftOff' in o1) && rp.dropped === 1, [o1, rp]);
    rp = { dropped: 0 };
    o1 = K.normalizeProjects({ items: [base('pjL', { leftOff: { text: 'Something', at: AT, futureBit: { a: 1 } } })] }, rp).items[0];
    check('an unknown field inside a note is kept', eq(o1.leftOff, { text: 'Something', at: AT, futureBit: { a: 1 } }) && rp.dropped === 0, o1.leftOff);
    rp = { dropped: 0 };
    o1 = K.normalizeProjects({ items: [base('pjL')] }, rp).items[0];
    check('a project without the fields gains none of them', !('outcome' in o1) && !('finishedWhen' in o1) && !('leftOff' in o1) && eq(Object.keys(o1).sort(), Object.keys(base('pjL')).sort()) && rp.dropped === 0, o1);

    console.log('  Editing the outcome and the finish line');
    d = world(base());
    check('editing sets an outcome and a finish line, trimmed', K.editProject(d, 'pjA', { outcome: '  A tidy shed  ' }) && K.editProject(d, 'pjA', { finishedWhen: '  Everything has a place  ' }) && P(d).outcome === 'A tidy shed' && P(d).finishedWhen === 'Everything has a place', P(d));
    check('the same value again returns false and changes nothing', !K.editProject(d, 'pjA', { outcome: 'A tidy shed' }) && !K.editProject(d, 'pjA', { outcome: ' A tidy shed ' }) && !K.editProject(d, 'pjA', { finishedWhen: 'Everything has a place' }));
    check('an empty value removes the field, and clearing it again returns false', K.editProject(d, 'pjA', { outcome: '   ' }) && !('outcome' in P(d)) && !K.editProject(d, 'pjA', { outcome: '' }) && K.editProject(d, 'pjA', { finishedWhen: '' }) && !('finishedWhen' in P(d)), P(d));
    d = world(base());
    check('a project with neither set is not changed by an empty edit', !K.editProject(d, 'pjA', { outcome: '', finishedWhen: '' }) && P(d).updatedAt === OLD);
    K.editProject(d, 'pjA', { outcome: 'x'.repeat(300) });
    check('an outcome over 200 characters is cut to 200', P(d).outcome.length === 200);
    d = world(base());
    K.editProject(d, 'pjA', { outcome: 'A tidy shed' });
    check('a change moves the project\'s updated time (and the same value does not)', P(d).updatedAt !== OLD, P(d).updatedAt);
    P(d).updatedAt = OLD; K.editProject(d, 'pjA', { outcome: 'A tidy shed' });
    check('…an unchanged outcome leaves it where it was', P(d).updatedAt === OLD);

    console.log('  Where I left off');
    d = world(base());
    const t0 = new Date(), stamp = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}T${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
    check('saving a note keeps its text (trimmed) and the local time it was written', K.setLeftOff(d, 'pjA', '  Waiting on the quote  ') && P(d).leftOff.text === 'Waiting on the quote' && [stamp(t0), stamp(new Date())].includes(P(d).leftOff.at) && Object.keys(P(d).leftOff).sort().join() === 'at,text', P(d).leftOff);
    check('saving the same text returns false and keeps the first time', (() => { P(d).leftOff.at = AT; P(d).updatedAt = OLD; return !K.setLeftOff(d, 'pjA', 'Waiting on the quote ') && P(d).leftOff.at === AT && P(d).updatedAt === OLD; })(), P(d));
    check('new text replaces the note and moves its time and the project\'s updated time', K.setLeftOff(d, 'pjA', 'Quote came back') && P(d).leftOff.text === 'Quote came back' && P(d).leftOff.at !== AT && P(d).updatedAt !== OLD, P(d));
    check('an empty text clears the note, and clearing again returns false', K.setLeftOff(d, 'pjA', '  ') && !('leftOff' in P(d)) && !K.setLeftOff(d, 'pjA', '') && !K.setLeftOff(d, 'pjNope', 'x'), P(d));
    K.setLeftOff(d, 'pjA', 'n'.repeat(900));
    check('a note over 800 characters is cut to 800', P(d).leftOff.text.length === 800);
    P(d).leftOff.futureBit = 'kept';
    check('editing a note keeps anything a newer MyDay saved beside its text and time', K.setLeftOff(d, 'pjA', 'Shelf bought') && P(d).leftOff.text === 'Shelf bought' && P(d).leftOff.futureBit === 'kept', P(d).leftOff);
  }

  console.log('\n[14] The previous release keeps all three fields (so the saved-data version stays 5)');
  {
    const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    // The last release without these fields: the one a device may go back to. Pinned, so this never compares the
    // feature with itself, whatever the working tree holds; MYDAY_PREVIOUS_PROJECTS_REF overrides it.
    const BEFORE_FIELDS = 'v1.47.0';
    const ref = process.env.MYDAY_PREVIOUS_PROJECTS_REF || BEFORE_FIELDS;
    let commit = '';
    try { commit = git('rev-parse', '--verify', '--quiet', '--short', ref + '^{commit}'); } catch { /* not found */ }
    check(`the previous release to compare against (${ref}) exists in this checkout`, !!commit, ref);
    console.log(`  Previous release used: ${ref} (${commit || 'not found'})`);
    if (commit) {
      const odir = path.join(os.tmpdir(), `myday-projects-prev-${process.pid}`);
      try {
        fs.mkdirSync(odir, { recursive: true });
        const tarFile = path.join(odir, 'src.tar');
        execFileSync('git', ['archive', '--format=tar', '-o', tarFile, ref, 'app/src'], { cwd: ROOT });
        execFileSync('tar', ['-xf', tarFile, '-C', odir]);
        const o = f => JSON.stringify(path.join(odir, 'app/src', f));
        fs.writeFileSync(path.join(odir, 'oldkit.ts'), [
          `export { freshState, normalize } from ${o('data/normalize')};`,
          `export { normalizeProjects, editProject, setNextStep, addProject } from ${o('data/projects')};`,
          `export { addMilestone } from ${o('data/projectPlan')};`,
          `export { splitProject } from ${o('data/projectRecords')};`,
          `export { cleanProjectRecord, putProjectRecord } from ${o('sync/projectParts')};`,
          `export { boot, update, exportText, parseImport, replaceAll } from ${o('data/storage')};`,
        ].join('\n'));
        const OK = await import(pathToFileURL(await bundle(path.join(odir, 'oldkit.ts'), path.join(odir, 'out'))).href);
        const fields = p => clone({ outcome: p.outcome, finishedWhen: p.finishedWhen, leftOff: p.leftOff });
        const LO = { text: 'Waiting on the quote; call the builder Monday', at: '2026-10-20T18:30', futureBit: 'kept' };
        const mine = () => base('pjP', { outcome: 'A quiet corner I read in every evening', finishedWhen: 'The chair is bought and the shelf is up', leftOff: clone(LO) });
        const want = fields(mine());
        const oldWorld = (...ps) => { const w = OK.freshState(); w.projects.items = ps; return w; };
        const same = (p, why) => eq(fields(p), want) ? true : (console.log('    ' + why, fields(p)), false);

        const loaded = OK.normalize(clone(oldWorld(mine())));
        check(`${ref}: data with all three fields keeps them unchanged when loaded from storage`, same(loaded.projects.items[0], 'loaded'), fields(loaded.projects.items[0]));

        const e = OK.normalize(clone(oldWorld(mine(), base('pjQ'))));
        const tk = { id: 'tkP', title: 'Pay council tax', done: false, projectId: 'pjP' };
        const pj = () => e.projects.items.find(x => x.id === 'pjP');
        OK.editProject(e, 'pjP', { title: 'Reading corner' }); OK.editProject(e, 'pjP', { stage: 'decide' }); OK.editProject(e, 'pjP', { status: 'paused' });
        check(`${ref}: its own edit of the title, stage and status changes them and keeps all three fields`, pj().title === 'Reading corner' && pj().stage === 'decide' && pj().status === 'paused' && same(pj(), 'edited'), [pj().title, pj().stage, pj().status, fields(pj())]);
        const ms = OK.addMilestone(e, 'pjP', 'Buy the chair');
        check(`${ref}: adding a milestone keeps all three fields`, !!ms && pj().milestones.length === 1 && same(pj(), 'milestone'), fields(pj()));
        e.tasks.items.push({ ...tk });
        const ns = OK.setNextStep(e, 'pjP', 'tkP');
        check(`${ref}: setting the next step keeps all three fields`, ns && pj().nextTaskId === 'tkP' && same(pj(), 'next step'), [pj().nextTaskId, fields(pj())]);

        const payload = { format: 'myday-export', schemaVersion: 5, exportedAt: '2026-10-21T09:00', data: oldWorld(mine()) };
        const imported = OK.normalize(JSON.parse(JSON.stringify(payload, null, 2)).data);
        check(`${ref}: a JSON export then import (normalise) keeps all three fields`, same(imported.projects.items[0], 'import'), fields(imported.projects.items[0]));

        // Its own saving, export, import and restore (storage.ts), with an in-memory stand-in for the browser's storage.
        const mem = new Map();
        globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: k => { mem.delete(k); },
          key: i => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
        try {
          mem.set('myday.data.v4', JSON.stringify(oldWorld(mine())));
          OK.boot();
          const savedP = () => JSON.parse(mem.get('myday.data.v4')).projects.items.find(x => x.id === 'pjP');
          const wrote = OK.update(dd => { OK.editProject(dd, 'pjP', { title: 'Saved by the previous release' }); });
          check(`${ref}: its own save writes an edit to the browser's storage and keeps all three fields`, wrote && savedP().title === 'Saved by the previous release' && same(savedP(), 'saved'), fields(savedP()));
          const back = OK.parseImport(OK.exportText().text);
          check(`${ref}: its own export, read by its own import, keeps all three fields`, same(back.data.projects.items.find(x => x.id === 'pjP'), 'export/import'), fields(back.data.projects.items.find(x => x.id === 'pjP')));
          mem.set('myday.data.v4', JSON.stringify(oldWorld(base('pjP', { title: 'Other data on this device' }))));
          OK.boot();
          check(`${ref}: restoring that file saves all three fields again`, OK.replaceAll(back.data) && same(savedP(), 'restored'), fields(savedP()));
        } finally { delete globalThis.localStorage; }

        const rows = OK.splitProject(mine());
        const core = rows.find(r => r.kind === 'project');
        const cleaned = OK.cleanProjectRecord('project', core.id, JSON.parse(JSON.stringify(core.content)));
        check(`${ref}: the project core sync record carries all three fields through its own split and cleaning`, !!cleaned && eq(fields(cleaned.value), want) && eq(fields(core.content.value), want), cleaned);
        const fresh = OK.freshState();
        OK.putProjectRecord(fresh, 'project', core.id, cleaned);
        check(`${ref}: putting that record into fresh data gives back the project with all three fields unchanged`, fresh.projects.items.length === 1 && same(fresh.projects.items[0], 'sync') && eq(fresh.projects.items[0].leftOff, LO), fresh.projects.items);
      } finally { fs.rmSync(odir, { recursive: true, force: true }); }
    }
  }

  console.log('\n[15] Waiting on someone or something (a task field; the next step, Today and Worth a look go by it)');
  {
    const k = '2026-10-14';
    const TK = (id, pid, x = {}) => ({ id, title: 'Task ' + id, listId: '', category: 'admin', minutes: 25, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: OLD, postponed: 0, blockers: [], letGoOn: null, ...(pid ? { projectId: pid } : {}), ...x });
    const W = (on, until = null, x = {}) => ({ on, since: '2026-10-10', until, ...x });
    const rd = (items, r = { dropped: 0 }) => ({ items: K.normalizeTasks({ lists: [], items: clone(items) }, r).items, r });

    console.log('  reading');
    const good = W('Priya', '2026-10-20', { chaseTaskId: 'tkC', futureBit: { a: 1 } });
    let got = rd([TK('a', null, { waiting: good })]);
    check('a valid wait is kept exactly as it was, with nothing counted as dropped', eq(got.items[0].waiting, good) && got.r.dropped === 0, [got.items[0].waiting, got.r]);
    check('unknown keys inside the wait are kept (the chase task and a newer MyDay\'s field)', got.items[0].waiting.futureBit.a === 1 && got.items[0].waiting.chaseTaskId === 'tkC', got.items[0].waiting);
    got = rd([TK('a', null, { waiting: W('x'.repeat(130), '2026-10-20') })]);
    check('who or what is limited to 120 characters', got.items[0].waiting.on === 'x'.repeat(120) && got.items[0].waiting.on.length === 120, got.items[0].waiting.on.length);
    got = rd([TK('a', null, { waiting: W('Priya', 'soon') }), TK('b', null, { waiting: { on: 'Quote', since: '2026-10-10' } }), TK('c', null, { waiting: W('Part', '2026-02-31') })]);
    check('an expected day that isn\'t a date (or is missing) becomes null, and the wait is kept', got.items.every(t => t.waiting && t.waiting.until === null) && got.r.dropped === 0, got.items.map(t => t.waiting));
    got = rd([TK('a', null, { waiting: null }), TK('b', null, { waiting: { on: '   ', since: '2026-10-10', until: null } }), TK('c', null, { waiting: { on: '', since: 'bad' } }), TK('d', null)]);
    check('a null or blank wait is simply absent and is not counted as dropped', got.items.every(t => !('waiting' in t)) && got.r.dropped === 0, [got.items.map(t => t.waiting), got.r]);
    const bad = [ 'oops', 5, [], { on: 5, since: '2026-10-10' }, { since: '2026-10-10' }, { on: 'Priya', since: 'yesterday' }, { on: 'Priya' } ];
    got = rd(bad.map((w, i) => TK('b' + i, null, { waiting: w })));
    check('a wait this version can\'t read is left out and counted, once for each', got.items.every(t => !('waiting' in t)) && got.r.dropped === bad.length, [got.items.map(t => t.waiting), got.r]);
    got = rd([TK('a', null)]);
    check('a task without a wait has no waiting field', !('waiting' in got.items[0]) && got.r.dropped === 0);

    console.log('  setWaiting and stopWaiting');
    let td = K.freshState(); td.tasks.items = [TK('tkA', null, { title: 'Ask about the armchair' })];
    const T = () => td.tasks.items[0];
    check('setting a wait trims who, and starts today as "since"; the expected day is kept', K.setWaiting(td.tasks, 'tkA', '  Priya  ', '2026-10-20', k) && eq(T().waiting, { on: 'Priya', since: k, until: '2026-10-20' }), T().waiting);
    check('the same wait again returns false and changes nothing', !K.setWaiting(td.tasks, 'tkA', 'Priya', '2026-10-20', '2026-10-30') && eq(T().waiting, { on: 'Priya', since: k, until: '2026-10-20' }), T().waiting);
    T().waiting.futureBit = 'kept'; T().waiting.chaseTaskId = 'tkC';
    check('changing who or when keeps the first "since" and anything saved beside it', K.setWaiting(td.tasks, 'tkA', 'Priya at the shop', null, '2026-10-30') && eq(T().waiting, { on: 'Priya at the shop', since: k, until: null, futureBit: 'kept', chaseTaskId: 'tkC' }), T().waiting);
    check('an empty (or blank) who is refused and the wait stays', !K.setWaiting(td.tasks, 'tkA', '   ', '2026-10-20', k) && T().waiting.on === 'Priya at the shop');
    check('a task that isn\'t there is refused', !K.setWaiting(td.tasks, 'tkNope', 'Priya', null, k));
    check('an expected day that isn\'t a date is stored as null', K.setWaiting(td.tasks, 'tkA', 'Priya at the shop', 'soon', k) === false && T().waiting.until === null);
    check('who is cut to 120 characters', K.setWaiting(td.tasks, 'tkA', 'y'.repeat(150), null, k) && T().waiting.on.length === 120);
    td.tasks.items.push(TK('tkB', null));
    check('a task starting a wait with an empty who gets no waiting field', !K.setWaiting(td.tasks, 'tkB', '', null, k) && !('waiting' in td.tasks.items[1]));
    check('stopping removes the wait (and with it the chase record); stopping again returns false', K.stopWaiting(td.tasks, 'tkA') && !('waiting' in T()) && !K.stopWaiting(td.tasks, 'tkA') && !K.stopWaiting(td.tasks, 'tkNope'), T());
    check('stopping leaves the task\'s other fields as they were', eq(Object.keys(T()).sort(), Object.keys(TK('tkA', null)).sort()), Object.keys(T()));

    console.log('  chaseWaiting');
    const cw = world(base('pjA'));
    cw.tasks.items = [TK('tkA', 'pjA', { title: 'Ask about the armchair', listId: 'lsHome', category: 'learning', minutes: 45, waiting: W('Priya', '2026-10-12') })];
    const A = () => cw.tasks.items.find(t => t.id === 'tkA');
    const r1 = K.chaseWaiting(cw, 'tkA');
    const made = cw.tasks.items.filter(t => t.id !== 'tkA');
    check('Chase it adds exactly one task, "Chase: <title>" (without who you are waiting on)', typeof r1 === 'string' && made.length === 1 && made[0].id === r1 && made[0].title === 'Chase: Ask about the armchair' && !made[0].title.includes('Priya'), [r1, made]);
    check('…of 5 minutes, in the same list, category and project, to do and (with no day given) undated', made[0].minutes === 5 && made[0].listId === 'lsHome' && made[0].category === 'learning' && made[0].projectId === 'pjA' && !made[0].done && made[0].due === null, made[0]);
    check('…and records it on the wait as chaseTaskId, keeping the rest of the wait', A().waiting.chaseTaskId === r1 && A().waiting.on === 'Priya' && A().waiting.until === '2026-10-12' && K.chaseTask(cw, A()).id === r1, A().waiting);
    check('while that follow-up is still to do, Chase it returns "already" and adds nothing', K.chaseWaiting(cw, 'tkA') === 'already' && cw.tasks.items.length === 2);
    K.setTaskDone(cw, r1, true);
    check('once the follow-up is done there is no open follow-up (chaseTask null)', K.chaseTask(cw, A()) === null);
    const r2 = K.chaseWaiting(cw, 'tkA');
    check('…and Chase it adds another, which is recorded instead', typeof r2 === 'string' && r2 !== r1 && cw.tasks.items.length === 3 && A().waiting.chaseTaskId === r2, [r2, A().waiting]);
    cw.tasks.items.find(t => t.id === r2).letGoOn = k;
    const r3 = K.chaseWaiting(cw, 'tkA');
    check('…and once that one is let go, it adds a third', typeof r3 === 'string' && r3 !== r2 && cw.tasks.items.length === 4 && A().waiting.chaseTaskId === r3);
    cw.tasks.items.push(TK('tkN', 'pjA'));
    const dueOf = (due, label) => {
      const dd = world(base('pjA')); dd.tasks.items = [TK('tkA', 'pjA', { title: 'Ask about the armchair', waiting: W('Priya') })];
      const id = due === undefined ? K.chaseWaiting(dd, 'tkA') : K.chaseWaiting(dd, 'tkA', due);
      return typeof id === 'string' ? dd.tasks.items.find(t => t.id === id) : id;
    };
    check('Chase it for today: the follow-up is due that day, 5 minutes, undated time', dueOf('2026-10-14').due === '2026-10-14' && dueOf('2026-10-14').time === null && dueOf('2026-10-14').minutes === 5, dueOf('2026-10-14'));
    check('…for tomorrow: due the next day', dueOf('2026-10-15').due === '2026-10-15');
    check('…for a day you pick: due that day', dueOf('2026-11-03').due === '2026-11-03');
    check('…with no date (null, or left out): it has no due day', dueOf(null).due === null && dueOf(undefined).due === null);
    check('…a day that isn\'t a date gives no date, and still adds the task', dueOf('soon').due === null && dueOf('2026-02-31').due === null && dueOf('soon').title === 'Chase: Ask about the armchair', dueOf('soon'));
    check('a task that isn\'t waiting, or isn\'t there, gets no follow-up (null)', K.chaseWaiting(cw, 'tkN') === null && K.chaseWaiting(cw, 'tkNope') === null && cw.tasks.items.length === 5);
    const np = world(base('pjA')); np.tasks.items = [TK('tkA', null, { title: 'Order the part', waiting: W('Dev') })];
    const rn = K.chaseWaiting(np, 'tkA');
    check('a task with no project gets a follow-up with no project', typeof rn === 'string' && !('projectId' in np.tasks.items[1]), np.tasks.items[1]);

    console.log('  isWaiting and isStuck');
    const ws = world(base('pjA'));
    ws.tasks.items = [TK('a', 'pjA', { waiting: W('Priya') }), TK('b', 'pjA', { waiting: W('Priya'), done: true, doneOn: k }), TK('c', 'pjA', { waiting: W('Priya'), letGoOn: k }), TK('d', 'pjA')];
    check('isWaiting is true for a task still to do with a wait, and false once it is done, let go, or has none', eq(ws.tasks.items.map(t => K.isWaiting(ws, t)), [true, false, false, false]), ws.tasks.items.map(t => K.isWaiting(ws, t)));
    const mv = TK('m', 'pjA', { postponed: 3, due: '2026-10-01' });
    ws.tasks.items = [mv];
    check('a task moved later three times is stuck…', K.isStuck(ws, mv, k) === true);
    mv.waiting = W('Priya');
    check('…but not while it is waiting on someone', K.isStuck(ws, mv, k) === false);
    delete mv.waiting;
    check('…and it is stuck again once the wait ends', K.isStuck(ws, mv, k) === true);

    console.log('  the next step and Today');
    const nx = world(base('pjA'));
    nx.tasks.items = [TK('a', 'pjA', { title: 'First', due: '2026-10-20', waiting: W('Priya') }), TK('b', 'pjA', { title: 'Second', due: '2026-10-25' }), TK('c', 'pjA', { title: 'Third' })];
    const step = () => K.nextStep(nx, nx.projects.items[0])?.id ?? null;
    check('MyDay\'s own choice skips a waiting task and takes the next one', step() === 'b', step());
    delete nx.tasks.items[0].waiting;
    check('…and without the wait the first task would be the choice', step() === 'a', step());
    nx.tasks.items[0].waiting = W('Priya');
    nx.projects.items[0].nextTaskId = 'a';
    check('a waiting task you chose yourself stays the next step', step() === 'a', step());
    nx.projects.items[0].nextTaskId = null;
    nx.tasks.items[1].waiting = W('Dev'); nx.tasks.items[2].waiting = W('Sam');
    check('when every open task is waiting there is no automatic next step (null)', step() === null, step());
    nx.tasks.items[2].letGoOn = k; nx.tasks.items[1].done = true;
    check('a done or let-go task is not the next step either way', step() === null);
    const td2 = world(base('pjA'));
    td2.tasks.items = [TK('a', 'pjA', { title: 'First', waiting: W('Priya') }), TK('b', 'pjA', { title: 'Second' })];
    check('Today\'s project steps offer the automatic choice (the one that isn\'t waiting)', eq(K.stepsForToday(td2, k).map(x => x.task.id), ['b']), K.stepsForToday(td2, k).map(x => x.task.id));
    td2.projects.items[0].nextTaskId = 'a';
    check('…but not a waiting step you chose: Today skips that project', eq(K.stepsForToday(td2, k), []), K.stepsForToday(td2, k).map(x => x.task.id));
    delete td2.tasks.items[0].waiting;
    check('…and offers it again once the wait ends', eq(K.stepsForToday(td2, k).map(x => x.task.id), ['a']));

    console.log('  worthALook');
    const wl = (data, kk = k) => K.worthALook(data, data.projects.items[0], kk);
    const wp = (data, kk = k) => wl(data, kk).filter(x => x.key === 'waiting');
    const wo = world(base('pjA'));
    wo.tasks.items = [TK('n', 'pjA', { title: 'Next one' }), TK('w1', 'pjA', { title: 'Ask about the armchair', waiting: W('Priya', '2026-10-12') }), TK('w2', 'pjA', { title: 'Order the part', waiting: W('Dev', '2026-10-10') }),
      TK('w3', 'pjA', { title: 'Later one', waiting: W('Sam', '2026-10-20') }), TK('w4', 'pjA', { title: 'No day', waiting: W('Lee') })];
    check('with several waits whose day has come, only the oldest expected day is pointed out, linking to its task', eq(wp(wo).map(x => [x.text, x.href]), [[`Still waiting on Dev (Order the part) — expected ${K.shortDate('2026-10-10')}`, '#today/tasks/w2']]), wp(wo));
    check('its chase flag names the task and says no follow-up has been added', eq(wp(wo)[0].chase, { taskId: 'w2', added: false }), wp(wo)[0].chase);
    check('on the expected day itself it is pointed out; the day before it is not', wp(wo, '2026-10-10').length === 1 && wp(wo, '2026-10-10')[0].chase.taskId === 'w2' && wp(wo, '2026-10-09').length === 0, [wp(wo, '2026-10-10'), wp(wo, '2026-10-09')]);
    check('a wait with no expected day, or one still to come, is never pointed out', !wp(wo).some(x => ['w3', 'w4'].includes(x.chase.taskId)) && wp(wo, '2026-10-13').length === 1);
    K.chaseWaiting(wo, 'w2');
    check('after Chase it, the pointer stays and its chase flag says a follow-up has been added', wp(wo).length === 1 && wp(wo)[0].chase.taskId === 'w2' && wp(wo)[0].chase.added === true, wp(wo)[0]);
    wo.projects.items[0].nextTaskId = 'w2';
    check('when that task is the chosen next step, the next oldest is pointed out instead (the Next step card says the first)', eq(wp(wo).map(x => x.chase.taskId), ['w1']), wp(wo));
    wo.projects.items[0].nextTaskId = 'w1'; wo.tasks.items.find(t => t.id === 'w2').done = true;
    check('a done task is not pointed out; with the other chosen as the next step nothing is left to point out', wp(wo).length === 0, wp(wo));
    wo.tasks.items.find(t => t.id === 'w2').done = false; wo.projects.items[0].nextTaskId = null;
    wo.tasks.items.find(t => t.id === 'w2').letGoOn = k;
    check('a task let go is not pointed out either (the next oldest is)', eq(wp(wo).map(x => x.chase.taskId), ['w1']), wp(wo));
    wo.tasks.items.find(t => t.id === 'w2').letGoOn = null;
    for (const status of ['paused', 'done']) {
      wo.projects.items[0].status = status;
      check(`a ${status} project gets no waiting pointer`, wp(wo).length === 0, wp(wo));
    }
    wo.projects.items[0].status = 'active';
    check('the pointer is back when the project is active again', wp(wo).length === 1);
    const so2 = world(base('pjA'));
    so2.tasks.items = [TK('n', 'pjA', { title: 'Next one' }), TK('o', 'pjA', { title: 'Late and waiting', due: '2026-10-01', waiting: W('Priya', '2026-10-30') }), TK('p', 'pjA', { title: 'Late and not waiting', due: '2026-10-02' })];
    so2.projects.items[0].nextTaskId = 'n'; // chosen, so neither late task is the next step
    check('a waiting task whose date has passed is never pointed out as "still open" (the other late task is)', eq(wl(so2).filter(x => x.key === 'still-open').map(x => x.href), ['#today/tasks/p']) && wp(so2).length === 0, wl(so2));
    so2.tasks.items[2].done = true;
    check('…so with nothing else late there is no still-open pointer at all', !wl(so2).some(x => x.key === 'still-open'), wl(so2));
    so2.tasks.items[1].waiting.until = '2026-10-05';
    check('…and once its expected day has come only the waiting pointer appears for it', eq(wl(so2).map(x => x.key), ['waiting']), wl(so2));
  }

  console.log('\n[16] The previous release (1.49.0) keeps a task\'s wait unchanged, with the field it does not know');
  {
    const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    // The last release without "waiting" (1.49.0): the one a device may go back to. Pinned, so this never compares the
    // feature with itself, whatever the working tree holds; MYDAY_PREVIOUS_WAITING_REF overrides it.
    const BEFORE_WAITING = 'v1.49.0';
    const ref = process.env.MYDAY_PREVIOUS_WAITING_REF || BEFORE_WAITING;
    let commit = '';
    try { commit = git('rev-parse', '--verify', '--quiet', '--short', ref + '^{commit}'); } catch { /* not found */ }
    check(`the previous release to compare against for waiting (${ref}) exists in this checkout`, !!commit, ref);
    console.log(`  Previous release used: ${ref} (${commit || 'not found'})`);
    if (commit) {
      const odir = path.join(os.tmpdir(), `myday-waiting-prev-${process.pid}`);
      try {
        fs.mkdirSync(odir, { recursive: true });
        const tarFile = path.join(odir, 'src.tar');
        execFileSync('git', ['archive', '--format=tar', '-o', tarFile, ref, 'app/src'], { cwd: ROOT });
        execFileSync('tar', ['-xf', tarFile, '-C', odir]);
        const o = f => JSON.stringify(path.join(odir, 'app/src', f));
        fs.writeFileSync(path.join(odir, 'oldkit.ts'), [
          `export { freshState, normalize } from ${o('data/normalize')};`,
          `export { normalizeTasks, editTask, setTaskDone, moveToTomorrow } from ${o('data/tasks')};`,
          `export { cleanRecord, putRecord, keyOf } from ${o('sync/records')};`,
          `export { boot, update, exportText, parseImport, replaceAll } from ${o('data/storage')};`,
        ].join('\n'));
        const OK = await import(pathToFileURL(await bundle(path.join(odir, 'oldkit.ts'), path.join(odir, 'out'))).href);
        const WAIT = { on: 'Priya at the furniture shop', since: '2026-10-20', until: '2026-10-28', chaseTaskId: 'tkChase', futureBit: { kept: ['yes', 1] } };
        const mine = () => ({ id: 'tkW', title: 'Ask about the armchair', listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: OLD, postponed: 0, blockers: [], letGoOn: null, projectId: 'pjP', waiting: clone(WAIT) });
        const oldWorld = (...items) => { const w = OK.freshState(); w.projects.items = [base('pjP')]; w.tasks.items = items; return w; };
        const wt = t => clone(t && t.waiting);
        const same = (t, why) => eq(wt(t), WAIT) ? true : (console.log('    ' + why, wt(t)), false);

        let rep2 = { dropped: 0 };
        const read = OK.normalizeTasks({ lists: [], items: [mine()] }, rep2);
        check(`${ref}: reading a task with a wait keeps the wait unchanged (unknown key too) and counts nothing`, same(read.items[0], 'read') && rep2.dropped === 0, wt(read.items[0]));
        const loaded = OK.normalize(clone(oldWorld(mine())));
        check(`${ref}: data with a waiting task keeps it unchanged when loaded from storage`, same(loaded.tasks.items[0], 'loaded'), wt(loaded.tasks.items[0]));

        const e = OK.normalize(clone(oldWorld(mine())));
        const T = () => e.tasks.items[0];
        check(`${ref}: its own edit of the title keeps the wait unchanged`, OK.editTask(e.tasks, 'tkW', { title: 'Ask about the green armchair' }) && T().title === 'Ask about the green armchair' && same(T(), 'title'), wt(T()));
        check(`${ref}: its own edit of the date keeps the wait unchanged`, OK.editTask(e.tasks, 'tkW', { due: '2026-11-02', notes: 'Ring first' }) && T().due === '2026-11-02' && same(T(), 'date'), wt(T()));
        check(`${ref}: its own "Move to tomorrow" keeps the wait unchanged`, OK.moveToTomorrow(e.tasks, 'tkW') !== undefined && same(T(), 'tomorrow'), wt(T()));
        check(`${ref}: its own ticking done, and then undone, keeps the wait unchanged`, OK.setTaskDone(e, 'tkW', true) && T().done === true && same(T(), 'done') && OK.setTaskDone(e, 'tkW', false) && T().done === false && same(T(), 'undone'), wt(T()));

        const payload = { format: 'myday-export', schemaVersion: 5, exportedAt: '2026-10-21T09:00', data: oldWorld(mine()) };
        const imported = OK.normalize(JSON.parse(JSON.stringify(payload, null, 2)).data);
        check(`${ref}: a JSON export then import (normalise) keeps the wait unchanged`, same(imported.tasks.items[0], 'import'), wt(imported.tasks.items[0]));

        const mem = new Map();
        globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: k => { mem.delete(k); },
          key: i => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
        try {
          mem.set('myday.data.v4', JSON.stringify(oldWorld(mine())));
          OK.boot();
          const savedT = () => JSON.parse(mem.get('myday.data.v4')).tasks.items.find(x => x.id === 'tkW');
          const wrote = OK.update(dd => { OK.editTask(dd.tasks, 'tkW', { title: 'Saved by the previous release' }); });
          check(`${ref}: its own save writes an edit to the browser's storage and keeps the wait unchanged`, wrote && savedT().title === 'Saved by the previous release' && same(savedT(), 'saved'), wt(savedT()));
          const back = OK.parseImport(OK.exportText().text);
          check(`${ref}: its own export, read by its own import, keeps the wait unchanged`, same(back.data.tasks.items.find(x => x.id === 'tkW'), 'export/import'), wt(back.data.tasks.items.find(x => x.id === 'tkW')));
          mem.set('myday.data.v4', JSON.stringify(oldWorld({ ...mine(), id: 'tkOther', title: 'Other data on this device', waiting: undefined })));
          OK.boot();
          check(`${ref}: restoring that file saves the wait again, unchanged`, OK.replaceAll(back.data) && same(savedT(), 'restored'), wt(savedT()));
        } finally { delete globalThis.localStorage; }

        const key = OK.keyOf('task', 'tkW');
        const cleaned = OK.cleanRecord(key, JSON.parse(JSON.stringify(mine())));
        check(`${ref}: its task sync record cleaning keeps the wait unchanged`, !!cleaned && same(cleaned, 'cleaned'), wt(cleaned));
        const fresh = OK.freshState();
        OK.putRecord(fresh, key, cleaned);
        check(`${ref}: putting that record into fresh data gives back the task with the wait unchanged`, fresh.tasks.items.length === 1 && same(fresh.tasks.items[0], 'put'), fresh.tasks.items);
        const edited = { ...JSON.parse(JSON.stringify(mine())), title: 'Edited elsewhere', due: '2026-11-05' };
        const cleaned2 = OK.cleanRecord(key, edited);
        check(`${ref}: a task record edited (title and date) and cleaned still has the wait unchanged`, !!cleaned2 && cleaned2.title === 'Edited elsewhere' && same(cleaned2, 'cleaned edit'), wt(cleaned2));
      } finally { fs.rmSync(odir, { recursive: true, force: true }); }
    }
  }


  console.log('\n[5b] Searching one project (specs/projects-search.md)');
  {
    const tk = (id, title, pj, x = {}) => ({ id, title, listId: '', category: 'Admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-09-20T09:00', postponed: 0, blockers: [], letGoOn: null, projectId: pj, ...x });
    const nt = (id, title, text, pj, at = '2026-10-02T09:00') => ({ id, categoryId: '', title, text, pinned: false, createdAt: at, updatedAt: at, projectId: pj });
    const long = 'We talked for a long while about many other things before the electrician mentioned the old fuse board and then we moved on to something quite different at the end of the afternoon.';
    const S = base('pjS', {
      title: 'Garden shed rebuild', summary: 'A dry shed for the bikes', outcome: 'A shed that keeps the rain out', finishedWhen: 'The door shuts properly', leftOff: { text: 'Measured the base slab', at: OLD },
      milestones: [{ id: 'msS', title: 'Foundations poured', aim: null, reachedOn: null, createdAt: OLD }],
      decisions: [{ id: 'dcS', question: 'Which cladding?', options: [{ id: 'oS1', text: 'Larch boards', pros: ['Lasts for decades'], cons: ['Costs more upfront'] }, { id: 'oS2', text: 'Felt panels', pros: [], cons: [] }], chosen: 'oS1', why: 'Neighbour recommended it', decidedOn: '2026-10-05', createdAt: OLD, updatedAt: OLD,
        history: [{ id: 'dh1', text: 'Corrugated sheets', on: '2026-09-20', why: 'Too noisy in the rain' }] }],
    });
    const mk = () => {
      const w = world(S, base('pjT', { title: 'Other project', summary: 'Mentions larch and armchair too', milestones: [{ id: 'msT', title: 'Foundations elsewhere', aim: null, reachedOn: null, createdAt: OLD }] }));
      w.tasks.items = [
        tk('tkDone', 'Order the armchair cushions', 'pjS', { done: true, doneOn: '2026-10-03' }),
        tk('tkGone', 'Armchair idea for shed', 'pjS', { letGoOn: '2026-10-04' }),
        tk('tkOpen', 'Buy bolts', 'pjS', { notes: 'Check the armchair is not in the way' }),
        tk('tkWait', 'Ring the supplier', 'pjS', { waiting: { on: 'Priya at the timber yard', since: '2026-10-01', until: null } }),
        tk('tkOther', 'Armchair for the other project', 'pjT'),
      ];
      w.notes.items = [nt('ntS', 'Electrician', long, 'pjS'), nt('ntT', 'Armchair note elsewhere', 'larch', 'pjT'), nt('ntLoose', 'Loose armchair', 'no project', undefined)];
      return w;
    };
    let w = mk();
    const find = (q, pid = 'pjS') => K.searchProject(w, w.projects.items.find(x => x.id === pid), q);
    const kinds = hs => hs.map(h => h.kind);

    const about = find('slab')[0], aboutAll = ['dry shed', 'rain out', 'door shuts', 'slab'].map(q => find(q).map(h => h.kind).join());
    check('a word in the project\'s own summary, outcome, finished-when and left-off text finds the project as "about", opening its Overview', eq(aboutAll, ['about', 'about', 'about', 'about']) && about.href === '#projects/p/pjS' && about.id === 'pjS', [aboutAll, about]);
    const tkHit = find('bolts')[0];
    check('a task is found by its title, opening its own page', eq(kinds(find('bolts')), ['task']) && tkHit.href === '#today/tasks/tkOpen' && tkHit.id === 'tkOpen', tkHit);
    check('a task is found by its notes, and by who it is waiting on', eq(find('in the way').map(h => h.id), ['tkOpen']) && eq(find('timber yard').map(h => h.id), ['tkWait']), [find('in the way'), find('timber yard')]);
    const nHit = find('electrician')[0];
    check('a note is found by its title and by its text, opening the note', eq(find('electrician').map(h => h.kind), ['note']) && nHit.href === '#projects/notes/ntS' && eq(find('fuse board').map(h => h.id), ['ntS']), [nHit, find('fuse board')]);
    const mHit = find('foundations')[0];
    check('a milestone is found, opening the Milestones tab', eq(kinds(find('foundations')), ['milestone']) && mHit.href === '#projects/p/pjS/milestones' && mHit.id === 'msS', mHit);
    const dH = ['cladding', 'felt', 'decades', 'upfront', 'neighbour', 'corrugated', 'noisy'].map(q => find(q).map(h => h.kind + ':' + h.href).join());
    check('a decision is found by its question, options, pros, cons, reasons and previous choices (text and why), opening the Decisions tab', dH.every(x => x === 'decision:#projects/p/pjS/decisions'), dH);

    console.log('  Business idea and case');
    check('a general project does not search a business model it keeps out of sight', (() => {
      const g = base('pjG', { model: { problem: 'zebra stripes', who: '', how: '', assumptions: [{ id: 'asG', text: 'Zebra buyers exist', state: 'open', found: '', checkedOn: null, taskId: null, createdAt: OLD }] } });
      return eq(K.searchProject(world(g), g, 'zebra'), []);
    })());
    check('a general project does not search a case it keeps out of sight', (() => {
      const g = base('pjG', { case: { timeline: [{ id: 'tlG', date: '2026-10-01', about: false, title: 'Hidden event', details: '', source: 'mine', evidenceIds: [], issueIds: [], createdAt: OLD }], evidence: [], issues: [] } });
      return eq(K.searchProject(world(g), g, 'hidden'), []);
    })());
    const B = base('pjB2', { template: 'business', title: 'Tea stall', model: { problem: 'Commuters want good tea', who: 'Station queues', how: 'A cart', assumptions: [{ id: 'asB', text: 'People pay two pounds', state: 'looks-true', found: 'Six of ten said yes', checkedOn: '2026-10-02', taskId: null, createdAt: OLD }] } });
    const wb = world(B), fb = q => K.searchProject(wb, B, q);
    check('a business idea\'s answers are found as one "model" hit, opening the Model tab', eq(fb('commuters').map(h => [h.kind, h.id, h.href]), [['model', 'answers', '#projects/p/pjB2/model']]), fb('commuters'));
    check('…and an assumption is found by its text and by what was found', eq(fb('two pounds').map(h => [h.kind, h.id]), [['model', 'asB']]) && eq(fb('six of ten').map(h => h.id), ['asB']), [fb('two pounds'), fb('six of ten')]);
    B.template = 'general';
    check('switching it back to general keeps the one page but stops searching it', eq(fb('commuters'), []) && eq(fb('six of ten'), []) && !!B.model);
    B.template = 'business';
    const C = base('pjC', { template: 'case', title: 'Overtime dispute', case: {
      timeline: [{ id: 'tlC', date: '2026-10-01', about: false, title: 'Asked about pay', details: 'Spoke to the manager by the lift', source: 'mine', evidenceIds: [], issueIds: [], createdAt: OLD }],
      evidence: [{ id: 'evC', title: 'Payslip', kind: 'document', date: null, where: 'Blue folder', status: 'have', notes: 'Shows no overtime line', issueIds: [], createdAt: OLD }],
      issues: [{ id: 'isC', title: 'Unpaid hours', status: 'considering', notes: 'Roughly six hours a week', createdAt: OLD }] } });
    const wc = world(C), fc = q => K.searchProject(wc, C, q);
    check('a case\'s timeline is found by title and details, opening the Timeline tab', eq(fc('asked about').map(h => [h.kind, h.href]), [['timeline', '#projects/p/pjC/timeline']]) && eq(fc('lift').map(h => h.id), ['tlC']), fc('asked about'));
    check('…its evidence by title, where and notes, opening the Evidence tab', eq(fc('payslip').map(h => h.href), ['#projects/p/pjC/evidence']) && eq(fc('blue folder').map(h => h.id), ['evC']) && eq(fc('overtime line').map(h => h.id), ['evC']), fc('payslip'));
    check('…and its issues by title and notes, opening the Issues tab', eq(fc('unpaid').map(h => h.href), ['#projects/p/pjC/issues']) && eq(fc('six hours').map(h => h.id), ['isC']), fc('unpaid'));
    C.template = 'general';
    check('a case switched back to general keeps its records but stops searching them', eq(fc('payslip'), []) && eq(fc('lift'), []) && !!C.case);

    console.log('  Matching');
    check('every word has to match, in any order', find('armchair cushions').length === 1 && find('cushions armchair').length === 1 && eq(find('armchair cushions').map(h => h.id), ['tkDone']), find('cushions armchair'));
    check('…and one word that is missing finds nothing', eq(find('armchair giraffe'), []) && eq(find('bolts giraffe'), []));
    check('words may be found in different fields of the same thing (title and notes)', eq(find('bolts armchair').map(h => h.id), ['tkOpen']), find('bolts armchair'));
    const cafe = world(base('pjF', { title: 'Opening', summary: '' })); cafe.tasks.items = [tk('tkF1', 'Visit the Café on the corner', 'pjF'), tk('tkF2', 'ask the café about beans', 'pjF'), tk('tkF3', 'Naïve résumé for Zoë', 'pjF')];
    const ff = q => K.searchProject(cafe, cafe.projects.items[0], q).map(h => h.id);
    check('"cafe" finds "Café" and "café"', eq(ff('cafe'), ['tkF1', 'tkF2']), ff('cafe'));
    check('"CAFÉ" finds "Café" and "café", and capitals do not matter', eq(ff('CAFÉ'), ['tkF1', 'tkF2']) && eq(ff('cAfÉ'), ['tkF1', 'tkF2']), ff('CAFÉ'));
    check('accents in the query are ignored against plain text, and several accents work', eq(ff('naive resume zoe'), ['tkF3']) && eq(ff('Zoë'), ['tkF3']), ff('naive resume zoe'));
    check('fold takes off capitals and accents', K.fold('Café ÉCOLE Zoë') === 'cafe ecole zoe', K.fold('Café ÉCOLE Zoë'));

    console.log('  Excerpts');
    const ex = find('fuse board')[0];
    check('a match in longer text shows an excerpt around it, shortened with an ellipsis, on one line', ex.excerpt.includes('fuse board') && ex.excerpt.startsWith('…') && ex.excerpt.endsWith('…') && ex.excerpt.length < long.length && !/\n/.test(ex.excerpt), ex.excerpt);
    check('a match in a note\'s text shows the excerpt but the title stays as the title', ex.title === 'Electrician' && ex.excerpt !== '');
    check('a match in the title alone has no excerpt', find('electrician').length === 1 && find('electrician')[0].excerpt === '' && find('bolts')[0].excerpt === '' && find('foundations')[0].excerpt === '');
    check('a short matching text is shown whole, with no ellipsis', find('in the way')[0].excerpt === 'Check the armchair is not in the way', find('in the way')[0].excerpt);
    check('text that is already in the title is not repeated when the notes also match', (() => { const h = find('armchair').find(x => x.id === 'tkOpen'); return h.excerpt === 'Check the armchair is not in the way'; })());
    check('a match across title and notes (words in both) shows the notes as the excerpt', find('bolts armchair')[0].excerpt === 'Check the armchair is not in the way');

    console.log('  Done and let-go tasks, and the fixed order');
    const ar = find('armchair');
    check('open tasks come before done and let-go ones, and those are marked', eq(ar.filter(h => h.kind === 'task').map(h => [h.id, h.done ?? null]), [['tkOpen', null], ['tkDone', 'done'], ['tkGone', 'let go']]), ar);
    check('an open task has no "done" mark at all', !('done' in ar.find(h => h.id === 'tkOpen')));
    check('a task done on today\'s plan (not on the task) is also marked done', (() => {
      const d2 = mk(); d2.days['2026-10-10'] = { energy: 3, rest: false, builtAt: '', checkedIn: false, tasks: [{ uid: 'u9', taskId: 'tkOpen', category: 'admin', title: 'Buy bolts', minutes: 10, baseMinutes: 10, done: true, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null }] };
      d2.tasks.items.find(t => t.id === 'tkOpen').plannedOn = '2026-10-10'; d2.tasks.items.find(t => t.id === 'tkOpen').planUid = 'u9';
      return K.searchProject(d2, d2.projects.items[0], 'bolts')[0].done === 'done';
    })());
    check('the labels say "About it", "Task", "Note", "Milestone", "Decision", "Your one page", "Timeline", "Evidence", "Issue", "Link", "Research question", "Finding" and "Source"', eq(Object.values(K.SEARCH_KIND_LABEL), ['About it', 'Task', 'Note', 'Milestone', 'Decision', 'Your one page', 'Timeline', 'Evidence', 'Issue', 'Link', 'Research question', 'Finding', 'Source']), K.SEARCH_KIND_LABEL);
    const everything = world(base('pjE', { template: 'case', title: 'Zed everything', summary: 'zed', milestones: [{ id: 'm1', title: 'zed ms', aim: null, reachedOn: null, createdAt: OLD }], decisions: [{ id: 'd1', question: 'zed?', options: [], chosen: null, why: '', decidedOn: null, createdAt: OLD, updatedAt: OLD }],
      case: { timeline: [{ id: 't1', date: '2026-10-01', about: false, title: 'zed t', details: '', source: 'mine', evidenceIds: [], issueIds: [], createdAt: OLD }], evidence: [{ id: 'e1', title: 'zed e', kind: 'document', date: null, where: '', status: 'have', notes: '', issueIds: [], createdAt: OLD }], issues: [{ id: 'i1', title: 'zed i', status: 'considering', notes: '', createdAt: OLD }] } }));
    everything.tasks.items = [tk('tz', 'zed task', 'pjE')]; everything.notes.items = [nt('nz', 'zed note', '', 'pjE')];
    const eh = K.searchProject(everything, everything.projects.items[0], 'zed');
    check('results come in the fixed order: about, task, note, milestone, decision, timeline, evidence, issue', eq(kinds(eh), ['about', 'task', 'note', 'milestone', 'decision', 'timeline', 'evidence', 'issue']), kinds(eh));
    const eb = base('pjE2', { template: 'business', title: 'zed biz', model: { problem: 'zed', who: '', how: '', assumptions: [{ id: 'a1', text: 'zed a', state: 'open', found: '', checkedOn: null, taskId: null, createdAt: OLD }] }, decisions: [{ id: 'd1', question: 'zed?', options: [], chosen: null, why: '', decidedOn: null, createdAt: OLD, updatedAt: OLD }] });
    check('a business idea\'s one page comes after its decisions', eq(kinds(K.searchProject(world(eb), eb, 'zed')), ['about', 'decision', 'model', 'model']), kinds(K.searchProject(world(eb), eb, 'zed')));

    console.log('  Empty queries, other projects, and nothing changed');
    check('an empty query finds nothing', eq(find(''), []));
    check('a query of only spaces, tabs or new lines finds nothing', eq(find('   '), []) && eq(find('\t \n'), []));
    check('spaces around and between words do not matter', eq(find('  armchair    cushions  ').map(h => h.id), ['tkDone']));
    check('a word that is nowhere finds nothing', eq(find('zzzz'), []));
    check('another project\'s tasks, notes, milestones and words never appear', find('armchair').every(h => !['tkOther', 'ntT', 'ntLoose', 'msT'].includes(h.id)) && eq(find('elsewhere'), []) && eq(find('larch').map(h => h.kind), ['decision']), [find('armchair'), find('larch')]);
    check('searching the other project finds only its own', eq(find('armchair', 'pjT').map(h => h.id), ['pjT', 'tkOther', 'ntT']) && eq(find('foundations', 'pjT').map(h => h.id), ['msT']), find('armchair', 'pjT'));
    console.log('  The heading, apostrophes, MyDay\'s own labels, private notes and the project\'s name');
    check('matchCount reads "1 match for “q”", "2 matches for “q”" and "Nothing in this project matches “q”", with the query trimmed', K.matchCount(1, ' armchair ') === '1 match for “armchair”' && K.matchCount(2, 'armchair') === '2 matches for “armchair”' && K.matchCount(0, '  zebra  ') === 'Nothing in this project matches “zebra”', [K.matchCount(1, ' armchair '), K.matchCount(2, 'a'), K.matchCount(0, ' zebra ')]);
    const ap = world(base('pjAp', { title: 'Apostrophes' })); ap.tasks.items = [tk('tkCurly', 'Sam’s quote', 'pjAp'), tk('tkStraight', "Joe's quote", 'pjAp')];
    const fa = q => K.searchProject(ap, ap.projects.items[0], q).map(h => h.id);
    check('a task titled with a curly apostrophe is found by a straight one, and the other way round', eq(fa("sam's"), ['tkCurly']) && eq(fa('joe’s'), ['tkStraight']) && eq(fa('sam’s'), ['tkCurly']) && eq(fa("joe's"), ['tkStraight']), [fa("sam's"), fa('joe’s')]);
    check('fold makes both kinds of apostrophe the straight one', K.fold('Sam’s ‘quote’') === "sam's 'quote'", K.fold('Sam’s ‘quote’'));
    check('a business idea\'s "Your answers" label is not searched (only the words typed in)', eq(fb('your answers'), []) && eq(fb('your'), []), fb('your answers'));
    const wl = world(base('pjL', { title: 'Labels' })); wl.notes.items = [nt('ntBlank', '', '', 'pjL')];
    check('an untitled note shows "Untitled note", but "untitled" does not find it', K.searchProject(wl, wl.projects.items[0], 'note untitled').length === 0 && K.searchProject(wl, wl.projects.items[0], 'untitled').length === 0);
    check('…and its own words are still found when it has some', (() => { wl.notes.items.push(nt('ntBody', '', 'Gutter measurements', 'pjL')); const h = K.searchProject(wl, wl.projects.items[0], 'gutter'); return h.length === 1 && h[0].id === 'ntBody' && h[0].title === 'Gutter measurements'; })());
    check('"Priya" finds a task that is waiting on Priya', eq(find('priya').map(h => h.id), ['tkWait']) && find('priya')[0].excerpt === 'Priya at the timber yard', find('priya'));
    check('the project\'s own title is searched as part of "about", with no excerpt', eq(find('garden shed').map(h => [h.kind, h.id, h.excerpt]), [['about', 'pjS', '']]), find('garden shed'));
    const pv = world(base('pjPv', { title: 'Privacy' })); pv.notes.items = [{ ...nt('ntPriv', 'Secret plan', '', 'pjPv'), private: true }, nt('ntPub', 'Secret garden', '', 'pjPv')];
    const hp = K.searchProject(pv, pv.projects.items[0], 'secret');
    check('a private note\'s hit has private: true; a note that is not private has no private key at all', hp.find(h => h.id === 'ntPriv').private === true && !('private' in hp.find(h => h.id === 'ntPub')), hp);

    console.log('  Excerpts: whole words, whole characters, one line');
    const exOf = (notes, q) => { const e = world(base('pjX', { title: 'Plain' })); e.tasks.items = [tk('tkX', 'Plain task', 'pjX', { notes })]; return K.searchProject(e, e.projects.items[0], q).find(h => h.id === 'tkX').excerpt; };
    check('blank lines and runs of whitespace collapse to single spaces', exOf('First line\n\n\n   second\t\tline with  needle   here', 'needle') === 'First line second line with needle here', exOf('First line\n\n\n   second\t\tline with  needle   here', 'needle'));
    const head = 'abcdefgh '.repeat(12), tail = ' ijklmnop'.repeat(30);
    const cut = exOf(head + 'needle' + tail, 'needle');
    check('when the start is cut, it begins with "…" and a whole word (not half of one)', /^…abcdefgh /.test(cut) && cut.includes('needle'), cut);
    check('when the end is cut, it ends with "…" and the last word is whole', cut.endsWith('…') && /ijklmnop…$/.test(cut), cut);
    check('text that is short enough has neither ellipsis', !/…/.test(exOf('a short note with needle in it', 'needle')));
    const arText = 'مَرْحَبًا بِكُمْ '.repeat(12);
    const arEx = exOf(arText + 'needle ' + arText, 'needle');
    check('Arabic with vowel marks: the excerpt includes the match and never begins with a combining mark', arEx.includes('needle') && arEx.startsWith('…') && !/^…?\p{M}/u.test(arEx), arEx);
    const arEx2 = exOf(arText + 'ثم كلمة مَرْحَبًا', 'كلمة');
    check('…and a match in Arabic itself (marks ignored) is found, with the excerpt keeping its marks', arEx2.includes('كلمة') && !/^…?\p{M}/u.test(arEx2), arEx2);
    const emo = exOf('😀 '.repeat(50) + 'needle' + ' 😀'.repeat(80), 'needle');
    const lone = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
    check('emoji before and after the match: the excerpt has no half an emoji', emo.includes('needle') && !lone.test(emo) && emo.isWellFormed(), emo);
    const ko = exOf('아침에 마신 커피가 정말 맛있었다. '.repeat(6) + '그리고 커피 한 잔 더 ' + '좋은 하루 '.repeat(20), '커피');
    check('Korean text: matching works and the excerpt contains the match, cut on whole characters', ko.includes('커피') && !lone.test(ko) && ko.isWellFormed(), ko);
    const caf = exOf('word '.repeat(40) + 'Café au lait ' + 'more '.repeat(40), 'cafe');
    check('accent folding still points at the right place: "cafe" gives an excerpt containing "Café"', caf.includes('Café') && caf.startsWith('…') && caf.endsWith('…'), caf);
    const cafe2 = exOf('Zoë and the Café where we met, ' + 'ñ '.repeat(100), 'zoe cafe');
    check('…with accents earlier in the text moving nothing', cafe2.startsWith('Zoë and the Café'), cafe2);

    const frozen = JSON.stringify(w);
    for (const q of ['armchair', 'fuse board', 'zzz', '']) find(q);
    check('searching changes nothing in the data (byte-identical before and after)', JSON.stringify(w) === frozen);
  }


  console.log('\n[17] Why this next step (specs/projects-next-why.md)');
  {
    const tk = (id, title, x = {}) => ({ id, title, listId: '', category: 'Admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-09-20T09:00', postponed: 0, blockers: [], letGoOn: null, projectId: 'pjN', ...x });
    const wt = on => ({ waiting: { on, since: '2026-10-01', until: null } });
    const scene = (tasks, next = null, other = []) => { const w = world(base('pjN', { title: 'Shed', nextTaskId: next }), base('pjO', { title: 'Elsewhere' })); w.tasks.items = [...tasks, ...other]; return w; };
    const why = (tasks, next, other, k) => { const w = scene(tasks, next, other); return K.whyNext(w, P(w), k); };
    const D = d => K.shortDate(d);

    check('with no tasks there is no reason, and no step', eq(why([]), []) && K.nextStep(scene([]), P(scene([]))) === null);
    check('one task, not chosen: "it’s the only task still to do."', eq(why([tk('a', 'Buy bolts')]), ['MyDay’s pick: it’s the only task still to do.']), why([tk('a', 'Buy bolts')]));
    check('one task that is not waiting plus one that is: "…the only task still to do that isn’t waiting."', eq(why([tk('a', 'Ask Sam', wt('Sam')), tk('b', 'Buy bolts')]), ['MyDay’s pick: it’s the only task still to do that isn’t waiting.']), why([tk('a', 'Ask Sam', wt('Sam')), tk('b', 'Buy bolts')]));
    check('two dated tasks, none waiting: the earliest date', eq(why([tk('a', 'Later', { due: '2026-11-05' }), tk('b', 'Sooner', { due: '2026-10-30' })]), [`MyDay’s pick: it has the earliest date (${D('2026-10-30')}).`]));
    check('an overdue date works the same way', eq(why([tk('a', 'Late one', { due: '2026-09-01' }), tk('b', 'Later', { due: '2026-11-05' })]), [`MyDay’s pick: it has the earliest date (${D('2026-09-01')}).`]));
    const dw = [tk('w', 'Ask Sam about bolts', { due: '2026-10-20', ...wt('Sam') }), tk('a', 'Sooner', { due: '2026-10-30' }), tk('b', 'Later', { due: '2026-11-05' })];
    check('a waiting task with an earlier date: the date "of the tasks that aren’t waiting", then names the one that comes first', eq(why(dw), [`MyDay’s pick: it has the earliest date (${D('2026-10-30')}) of the tasks that aren’t waiting.`, '“Ask Sam about bolts” comes first, but it’s waiting on Sam.']), why(dw));
    const dw2 = [tk('w1', 'Ask Sam', { due: '2026-10-20', ...wt('Sam') }), tk('w2', 'Ask Priya', { due: '2026-10-22', ...wt('Priya') }), tk('a', 'Sooner', { due: '2026-10-30' }), tk('b', 'Later', { due: '2026-11-05' })];
    check('two waiting tasks that come first: "2 tasks that come first are waiting on someone or something."', eq(why(dw2), [`MyDay’s pick: it has the earliest date (${D('2026-10-30')}) of the tasks that aren’t waiting.`, '2 tasks that come first are waiting on someone or something.']), why(dw2));
    const un = [tk('b', 'Added second', { createdAt: '2026-09-22T09:00' }), tk('a', 'Added first', { createdAt: '2026-09-21T09:00' })];
    check('two undated tasks: "none of the tasks still to do has a date", and the step is the one added first', eq(why(un), ['MyDay’s pick: none of the tasks still to do has a date, so it’s the one you added first.']) && K.nextStep(scene(un), P(scene(un))).id === 'a', why(un));
    const unw = [tk('w', 'Ask Sam', { createdAt: '2026-09-20T09:00', ...wt('Sam') }), ...un];
    check('with an undated waiting task added earlier: "none of the tasks that aren’t waiting has a date…" and the comes-first sentence', eq(why(unw), ['MyDay’s pick: none of the tasks that aren’t waiting has a date, so it’s the one you added first.', '“Ask Sam” comes first, but it’s waiting on Sam.']), why(unw));

    console.log('  A step you chose');
    const three = [tk('a', 'Sooner', { due: '2026-10-30' }), tk('b', 'Undated one', { createdAt: '2026-09-21T09:00' }), tk('c', 'Later', { due: '2026-11-05' })];
    check('a chosen open task that is not MyDay’s pick: "You chose this step." and what MyDay would pick', eq(why(three, 'b'), ['You chose this step.', 'Left to MyDay, it would be “Sooner”.']), why(three, 'b'));
    check('a chosen task that is also MyDay’s pick says so', eq(why(three, 'a'), ['You chose this step.', 'It’s also what MyDay would pick.']), why(three, 'a'));
    check('a chosen waiting step when every other task is waiting too: MyDay would have no next step', eq(why([tk('a', 'Ask Sam', wt('Sam')), tk('b', 'Ask Priya', wt('Priya'))], 'a'), ['You chose this step.', 'Left to MyDay, there’d be no next step: everything here is waiting.']), why([tk('a', 'Ask Sam', wt('Sam')), tk('b', 'Ask Priya', wt('Priya'))], 'a'));
    check('…and the same for a single waiting task that was chosen', eq(why([tk('a', 'Ask Sam', wt('Sam'))], 'a'), ['You chose this step.', 'Left to MyDay, there’d be no next step: everything here is waiting.']));
    check('a chosen waiting step while another task is free: what MyDay would pick instead', eq(why([tk('a', 'Ask Sam', wt('Sam')), tk('b', 'Buy bolts')], 'a'), ['You chose this step.', 'Left to MyDay, it would be “Buy bolts”.']));

    console.log('  A step you chose that has gone (mentioned for a week)');
    const K0 = '2026-10-14';
    const pick = `MyDay’s pick: it has the earliest date (${D('2026-10-30')}).`;
    const rest = [tk('a', 'Sooner', { due: '2026-10-30' }), tk('c', 'Later', { due: '2026-11-05' })];
    const gone = x => tk('g', 'Order the timber', x);
    check('a chosen step done within the week: "The step you chose, “…”, is done." then MyDay’s pick', eq(why([gone({ done: true, doneOn: '2026-10-10' }), ...rest], 'g', [], K0), ['The step you chose, “Order the timber”, is done.', pick]), why([gone({ done: true, doneOn: '2026-10-10' }), ...rest], 'g', [], K0));
    check('…exactly seven days ago still counts, and eight days ago does not', eq(why([gone({ done: true, doneOn: '2026-10-07' }), ...rest], 'g', [], K0)[0], 'The step you chose, “Order the timber”, is done.') && eq(why([gone({ done: true, doneOn: '2026-10-06' }), ...rest], 'g', [], K0), [pick]));
    check('a chosen step done ten days before: only MyDay’s pick', eq(why([gone({ done: true, doneOn: '2026-10-04' }), ...rest], 'g', [], K0), [pick]), why([gone({ done: true, doneOn: '2026-10-04' }), ...rest], 'g', [], K0));
    check('a chosen step let go within the week: "You let go of the step you chose, “…”." then MyDay’s pick', eq(why([gone({ letGoOn: '2026-10-10' }), ...rest], 'g', [], K0), ['You let go of the step you chose, “Order the timber”.', pick]));
    check('…and one let go ten days before: only MyDay’s pick', eq(why([gone({ letGoOn: '2026-10-04' }), ...rest], 'g', [], K0), [pick]));
    const onPlan = (done, on) => { const w = scene([gone({ plannedOn: on, planUid: 'u7' }), ...rest], 'g'); w.days[on] = { energy: 3, rest: false, builtAt: '', checkedIn: false, tasks: [{ uid: 'u7', taskId: 'g', category: 'admin', title: 'Order the timber', minutes: 10, baseMinutes: 10, done, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null }] }; return K.whyNext(w, P(w), K0); };
    check('a chosen step done on a day’s plan (the task itself not ticked) within the week reads "…is done."', eq(onPlan(true, '2026-10-12'), ['The step you chose, “Order the timber”, is done.', pick]), onPlan(true, '2026-10-12'));
    check('…done on a plan more than a week ago: only MyDay’s pick', eq(onPlan(true, '2026-10-02'), [pick]), onPlan(true, '2026-10-02'));
    check('a chosen step in another project, or one that does not exist: only MyDay’s pick (no "no longer in this project" sentence)', eq(why(rest, 'x', [tk('x', 'Not here', { projectId: 'pjO' })], K0), [pick]) && eq(why(rest, 'tkGone', [], K0), [pick]), [why(rest, 'x', [tk('x', 'Not here', { projectId: 'pjO' })], K0), why(rest, 'tkGone', [], K0)]);
    check('a chosen step done within the week and a single task left: the done sentence, then "the only task"', eq(why([gone({ done: true, doneOn: '2026-10-12' }), tk('a', 'Sooner')], 'g', [], K0), ['The step you chose, “Order the timber”, is done.', 'MyDay’s pick: it’s the only task still to do.']));

    console.log('  The order is the Tasks screen\'s: date, then time (untimed after timed), then when added');
    const sameDay = [tk('t', 'Order the timber', { due: '2026-10-30', createdAt: '2026-09-20T09:00' }), tk('c', 'Call the builder', { due: '2026-10-30', time: '09:00', createdAt: '2026-09-25T09:00' })];
    check('on the same date a timed task comes before an untimed one, even if added later', K.nextStep(scene(sameDay), P(scene(sameDay))).title === 'Call the builder' && eq(why(sameDay), [`MyDay’s pick: it has the earliest date (${D('2026-10-30')}).`]), why(sameDay));
    const tie = [tk('late', 'Added later', { due: '2026-10-30', time: '09:00', createdAt: '2026-09-25T09:00' }), tk('early', 'Added earlier', { due: '2026-10-30', time: '09:00', createdAt: '2026-09-21T09:00' })];
    check('the same date and time: the one added earlier wins, whatever order they are stored in', K.nextStep(scene(tie), P(scene(tie))).id === 'early' && K.nextStep(scene([...tie].reverse()), P(scene([...tie].reverse()))).id === 'early');
    check('a dated task comes before an undated one added earlier', K.nextStep(scene([tk('u', 'Undated', { createdAt: '2026-09-01T09:00' }), tk('d', 'Dated', { due: '2026-12-01' })]), P(scene([tk('u', 'Undated', { createdAt: '2026-09-01T09:00' }), tk('d', 'Dated', { due: '2026-12-01' })]))).id === 'd');

    console.log('  "Left to MyDay" and writing nothing');
    const mixes = [dw, three, un, unw, [tk('a', 'Only')]];
    check('"Left to MyDay, it would be …" always names what nextStep gives with no choice (compared on a copy)', mixes.every((ts, i) => {
      const chosen = ts.find(t => !t.waiting && t.id !== K.nextStep(scene(ts), P(scene(ts)))?.id) ;
      if (!chosen) return true;
      const w = scene(ts, chosen.id), line = K.whyNext(w, P(w))[1];
      const w2 = clone(w); P(w2).nextTaskId = null;
      return line === `Left to MyDay, it would be “${K.nextStep(w2, P(w2)).title}”.`;
    }));
    check('whyNext writes nothing: the data is deep-equal before and after, for every case above', [[], three, dw, dw2, un, unw, rest].every(ts => { const w = scene(ts, ts[0] && ts[0].id); const before = JSON.stringify(w); K.whyNext(w, P(w)); P(w).nextTaskId = null; K.whyNext(w, P(w)); P(w).nextTaskId = 'x'; K.whyNext(w, P(w)); P(w).nextTaskId = ts[0] && ts[0].id || null; return JSON.stringify(w) === before; }));
  }


  console.log('\n[18] Learning for a project: links to courses, books and Arabic lessons (specs/projects-study-links.md)');
  {
    const AT = '2026-10-20', ARABIC = 'lesson.arabic-fusha-register';
    const task = (id, done) => ({ id, title: 'Task ' + id, minutes: 15, url: '', kind: 'learn', note: '', done, doneOn: done ? '2026-10-01' : null });
    const course = (id, title, done, total, x = {}) => ({ id, title, url: '', minutes: 0, listId: null, archived: false, modules: [{ id: 'm' + id, title: 'Module', sections: [{ id: 's' + id, title: 'Section', tasks: Array.from({ length: total }, (_, i) => task(`${id}t${i}`, i < done)) }] }], ...x });
    const book = (id, title, x = {}) => ({ id, title, author: '', pages: 300, page: 0, notes: [], addedOn: '2026-09-01', finishedOn: null, ...x });
    const lw = () => {
      const d = world(base('pjL', { title: 'Wi-Fi for the shop' }));
      d.study.stages = [{ id: 'sg1', title: 'Stage', courses: [course('coA', 'Networking basics', 3, 8), course('coB', 'Empty course', 0, 0), course('coC', 'Old course', 0, 0, { archived: true }), course('coD', 'Shop safety', 1, 2)] }];
      d.reading.books = [book('bkA', 'Bookkeeping made plain', { page: 120 }), book('bkB', 'Fresh book'), book('bkC', 'No total', { page: 120, pages: null }), book('bkD', 'Done book', { page: 300, finishedOn: '2026-10-12' })];
      return d;
    };
    const lk = (kind, id, title, x = {}) => ({ kind, id, title, addedOn: AT, ...x });
    const links = d => P(d).studyLinks;

    console.log('  Reading saved links');
    const nr = raw => { const rep = { dropped: 0 }; return [K.normalizeStudyLinks(raw, rep), rep.dropped]; };
    check('no links (absent or null) read as none, and nothing is counted', eq(nr(undefined), [null, 0]) && eq(nr(null), [null, 0]));
    check('something that is not a list is counted once and read as none', eq(nr('oops'), [null, 1]) && eq(nr({ a: 1 }), [null, 1]));
    check('an empty list reads as none', eq(nr([]), [null, 0]));
    const bad = nr([lk('course', 'coA', 'Fine'), { id: 'x', title: 'No kind', addedOn: AT }, { kind: 'book', title: 'No id', addedOn: AT }, { kind: 'book', id: 'bkA' }, { kind: 'book', id: 'bkB', title: '   ' }, 'text', null]);
    check('a link without a kind, an id or a title (or not an object) is dropped and counted; the good one stays', bad[1] === 6 && eq(bad[0].map(l => l.id), ['coA']), bad);
    const dup = nr([lk('course', 'coA', 'First'), lk('course', 'coA', 'Second'), lk('book', 'coA', 'Same id, other kind')]);
    check('the same kind and id twice are merged silently (the first stays); the same id of another kind is a different link', dup[1] === 0 && eq(dup[0].map(l => [l.kind, l.title]), [['course', 'First'], ['book', 'Same id, other kind']]), dup);
    const newer = nr([{ ...lk('video', 'v1', 'A newer kind'), speed: 2, nested: { a: [1] } }]);
    check('a kind this version does not know is kept with its extra fields', eq(newer[0], [{ kind: 'video', id: 'v1', title: 'A newer kind', addedOn: AT, speed: 2, nested: { a: [1] } }]) && newer[1] === 0, newer);
    const why = nr([lk('course', 'coA', 'A', { why: '  To set up the Wi-Fi  ' }), lk('course', 'coB', 'B', { why: 'x'.repeat(250) }), lk('course', 'coD', 'D', { why: 42 }), lk('book', 'bkA', 'E', { why: '   ' })]);
    check('a why is trimmed and capped at 200; a blank one and one that is not text are simply left off (nothing counted)', why[0][0].why === 'To set up the Wi-Fi' && why[0][1].why.length === 200 && !('why' in why[0][2]) && !('why' in why[0][3]) && why[1] === 0, why);
    const sp = 'a'.repeat(199) + ' ' + 'b'.repeat(100), once = nr([lk('course', 'coA', 'A', { why: sp })]), twice = nr(once[0]);
    check('a why whose 200th character is a space is tidied the same on a second read (idempotent): 199 characters, no trailing space', once[0][0].why === 'a'.repeat(199) && eq(twice[0], once[0]) && twice[1] === 0, once[0][0].why.length);
    check('adding and editing a why use the same tidy: no trailing space after the cut', (() => { const e = lw(); K.addStudyLink(e, 'pjL', { kind: 'course', id: 'coA', title: 'A' }, sp, AT); const added = links(e)[0].why; K.setStudyLinkWhy(e, 'pjL', 'course', 'coA', 'short'); K.setStudyLinkWhy(e, 'pjL', 'course', 'coA', sp); return added === 'a'.repeat(199) && links(e)[0].why === added && !K.setStudyLinkWhy(e, 'pjL', 'course', 'coA', sp); })());
    const dt = nr([lk('course', 'coA', 'A', { addedOn: 'last week' }), lk('course', 'coB', 'B', { addedOn: undefined })]);
    check('an invalid or missing addedOn is replaced by a date (the link is kept, nothing counted)', dt[1] === 0 && dt[0].length === 2 && dt[0].every(l => /^\d{4}-\d\d-\d\d$/.test(l.addedOn)), dt);
    check('a title longer than 120 is cut to 120', nr([lk('course', 'coA', 'T'.repeat(200))])[0][0].title.length === 120);
    const many = nr(Array.from({ length: 25 }, (_, i) => lk('book', 'b' + i, 'Book ' + i)));
    check('more than 20 valid links from elsewhere are all kept (only adding is capped)', many[0].length === 25 && many[1] === 0);
    const withLinks = K.normalizeProjects({ items: [base('pjR', { studyLinks: [lk('course', 'coA', 'Kept')] })] }, { dropped: 0 }).items[0], without = K.normalizeProjects({ items: [base('pjR', { studyLinks: [] }), base('pjS')] }, { dropped: 0 }).items;
    check('through normalizeProjects a project keeps its links, and one without links has no studyLinks key at all', eq(withLinks.studyLinks, [lk('course', 'coA', 'Kept')]) && without.every(p => !('studyLinks' in p)), [withLinks, without]);
    const unk = K.normalizeProjects({ items: [base('pjR', { studyLinks: 'broken' })] }, { dropped: 0 }).items[0];
    check('…and a damaged studyLinks is dropped from the project', !('studyLinks' in unk));

    console.log('  Adding, removing and editing why');
    let d = lw();
    const before = P(d).updatedAt;
    check('adding a course link stores the title (trimmed), no why, and the day', K.addStudyLink(d, 'pjL', { kind: 'course', id: 'coA', title: '  Networking basics  ' }, '', AT) && eq(links(d), [{ kind: 'course', id: 'coA', title: 'Networking basics', addedOn: AT }]), links(d));
    check('…and the project\'s updated time moves on', P(d).updatedAt > before);
    check('a why is optional, trimmed and capped at 200', K.addStudyLink(d, 'pjL', { kind: 'book', id: 'bkA', title: 'Bookkeeping made plain' }, '  To keep the books  ', AT) && links(d)[1].why === 'To keep the books' && K.addStudyLink(d, 'pjL', { kind: 'book', id: 'bkB', title: 'Fresh book' }, 'y'.repeat(300), AT) && links(d)[2].why.length === 200);
    check('a title is capped at 120 when added', (() => { const e = lw(); return K.addStudyLink(e, 'pjL', { kind: 'course', id: 'coA', title: 'T'.repeat(200) }, '', AT) && links(e)[0].title.length === 120; })());
    check('the same item twice is refused (false)', !K.addStudyLink(d, 'pjL', { kind: 'course', id: 'coA', title: 'Again' }, '', AT) && links(d).length === 3);
    check('a project that is not there, a course not on the roadmap and a book not in Reading are refused (false)', !K.addStudyLink(d, 'pjNope', { kind: 'course', id: 'coA', title: 'x' }) && !K.addStudyLink(d, 'pjL', { kind: 'course', id: 'coNope', title: 'x' }) && !K.addStudyLink(d, 'pjL', { kind: 'book', id: 'bkNope', title: 'x' }) && links(d).length === 3);
    check('a blank title is refused', !K.addStudyLink(d, 'pjL', { kind: 'course', id: 'coD', title: '   ' }));
    check('an Arabic lesson is accepted with the title the caller gives (it is not checked here)', K.addStudyLink(d, 'pjL', { kind: 'arabic', id: ARABIC, title: 'Register in Fusha' }, '', AT) && eq(links(d).at(-1), { kind: 'arabic', id: ARABIC, title: 'Register in Fusha', addedOn: AT }));
    const cap = lw();
    for (let i = 0; i < 20; i++) K.addStudyLink(cap, 'pjL', { kind: 'arabic', id: 'lesson.x' + i, title: 'Lesson ' + i }, '', AT);
    check('the 20th link is accepted and a 21st is refused (false)', links(cap).length === 20 && !K.addStudyLink(cap, 'pjL', { kind: 'course', id: 'coA', title: 'One more' }) && links(cap).length === 20);
    check('removing a link takes just that one out, and returns false for one that is not there', K.removeStudyLink(d, 'pjL', 'book', 'bkA') && eq(links(d).map(l => l.id), ['coA', 'bkB', ARABIC]) && !K.removeStudyLink(d, 'pjL', 'book', 'bkA') && !K.removeStudyLink(d, 'pjNope', 'course', 'coA'));
    check('the same id of another kind is not removed', (() => { const e = lw(); K.addStudyLink(e, 'pjL', { kind: 'course', id: 'coA', title: 'A' }); return !K.removeStudyLink(e, 'pjL', 'book', 'coA') && links(e).length === 1; })());
    check('when the last link goes the project has no studyLinks key again (as before)', (() => { const e = lw(); K.addStudyLink(e, 'pjL', { kind: 'course', id: 'coA', title: 'A' }); return K.removeStudyLink(e, 'pjL', 'course', 'coA') && !('studyLinks' in P(e)) && eq(Object.keys(P(e)).sort(), Object.keys(base('pjL', { title: 'x' })).sort()); })(), Object.keys(P(d)));
    const e2 = lw(); K.addStudyLink(e2, 'pjL', { kind: 'course', id: 'coA', title: 'A' }, '', AT);
    check('setting a why sets it trimmed and capped at 200', K.setStudyLinkWhy(e2, 'pjL', 'course', 'coA', '  Because  ') && links(e2)[0].why === 'Because' && K.setStudyLinkWhy(e2, 'pjL', 'course', 'coA', 'z'.repeat(300)) && links(e2)[0].why.length === 200);
    check('the same why again changes nothing (false); a link that is not there changes nothing (false)', !K.setStudyLinkWhy(e2, 'pjL', 'course', 'coA', 'z'.repeat(300)) && !K.setStudyLinkWhy(e2, 'pjL', 'course', 'coNope', 'x') && !K.setStudyLinkWhy(e2, 'pjNope', 'course', 'coA', 'x'));
    check('a blank why takes it away (the key goes); blank again changes nothing (false)', K.setStudyLinkWhy(e2, 'pjL', 'course', 'coA', '   ') && !('why' in links(e2)[0]) && !K.setStudyLinkWhy(e2, 'pjL', 'course', 'coA', ''));

    console.log('  What each link shows');
    const ix = () => K.stIndex(d2.study);
    let d2 = lw();
    const lv = (l, arabic) => K.linkView(d2, l, ix(), arabic);
    const pickv = v => [v.label, v.title, v.status, v.gone, v.href];
    check('a course shows Study\'s own count, its current title and a link to its page', eq(pickv(lv(lk('course', 'coA', 'Stored title'))), ['Your course', 'Networking basics', '3 of 8 tasks marked complete', false, '#study/course/coA']), pickv(lv(lk('course', 'coA', 'x'))));
    check('a course with no tasks says "No tasks added yet"', lv(lk('course', 'coB', 'x')).status === 'No tasks added yet');
    check('an archived course says "Archived in Study" and still links', eq(pickv(lv(lk('course', 'coC', 'x'))), ['Your course', 'Old course', 'Archived in Study', false, '#study/course/coC']));
    check('a course that is gone shows the title you linked, "No longer in Study" and no link', eq(pickv(lv(lk('course', 'coGone', 'Stored title'))), ['Your course', 'Stored title', 'No longer in Study', true, null]));
    check('a course status never contains a percentage', !/%/.test(lv(lk('course', 'coA', 'x')).status + lv(lk('course', 'coD', 'x')).status));
    check('a book not started says "Not started" and links to Reading', eq(pickv(lv(lk('book', 'bkB', 'x'))), ['Book', 'Fresh book', 'Not started', false, '#study/reading']));
    check('a book in progress says "Page 120 of 300"; with no total, "Page 120"', lv(lk('book', 'bkA', 'x')).status === 'Page 120 of 300' && lv(lk('book', 'bkC', 'x')).status === 'Page 120');
    check('a finished book says "Finished on <date>"', lv(lk('book', 'bkD', 'x')).status === `Finished on ${K.shortDate('2026-10-12')}`, lv(lk('book', 'bkD', 'x')).status);
    check('a book that is gone shows its stored title, "No longer in Study" and no link', eq(pickv(lv(lk('book', 'bkGone', 'Stored book'))), ['Book', 'Stored book', 'No longer in Study', true, null]));
    check('an Arabic lesson with its info shows the catalogue\'s title and Study\'s state, linking to the lesson', eq(pickv(lv(lk('arabic', ARABIC, 'Stored'), { title: 'Register in Fusha', status: 'Practised' })), ['Arabic lesson', 'Register in Fusha', 'Practised', false, `#study/arabic/${ARABIC}`]));
    check('an Arabic lesson no longer in the course (null) is gone', eq(pickv(lv(lk('arabic', ARABIC, 'Stored'), null)), ['Arabic lesson', 'Stored', 'No longer in Study', true, null]));
    check('an Arabic lesson while the catalogue loads (undefined) shows the stored title, an empty status and its link', eq(pickv(lv(lk('arabic', ARABIC, 'Stored'), undefined)), ['Arabic lesson', 'Stored', '', false, `#study/arabic/${ARABIC}`]));
    check('an Arabic lesson that could not load says to open it in Study', lv(lk('arabic', ARABIC, 'Stored'), 'failed').status === 'Open it in Study to see how it’s going' && !lv(lk('arabic', ARABIC, 'Stored'), 'failed').gone);
    check('an id with odd characters is encoded in the link', lv(lk('course', 'coA', 'x')).href === '#study/course/coA' && K.linkView(d2, lk('arabic', 'a b/c', 'x'), ix(), undefined).href === '#study/arabic/a%20b%2Fc');
    const nv = lv({ kind: 'video', id: 'v1', title: 'From the future', addedOn: AT });
    check('a kind this version does not know shows "From a newer MyDay", its title, "Open it in a newer MyDay", is not gone and has no link', eq(pickv(nv), ['From a newer MyDay', 'From the future', 'Open it in a newer MyDay', false, null]), pickv(nv));

    console.log('  Cybersecurity lessons');
    const CY = 'lesson.learning-evidence';
    check('a Cybersecurity lesson is accepted with the title the caller gives, and its link opens the lesson', (() => { const e = lw(); return K.addStudyLink(e, 'pjL', { kind: 'cyber', id: CY, title: 'Learning through evidence' }, '', AT) && eq(links(e), [{ kind: 'cyber', id: CY, title: 'Learning through evidence', addedOn: AT }]); })());
    const cv = info => K.linkView(d2, lk('cyber', CY, 'Stored title'), K.stIndex(d2.study), info);
    check('a Cybersecurity lesson with its info shows the catalogue\'s title, Study\'s status, "Cybersecurity lesson", and links to the lesson', eq(pickv(cv({ title: 'Learning through evidence', status: 'Started' })), ['Cybersecurity lesson', 'Learning through evidence', 'Started', false, `#study/cybersecurity/${CY}`]), pickv(cv({ title: 'x', status: 'Started' })));
    check('…gone when the lesson is not in the course (null); stored title while loading (undefined); "Open it in Study…" when it failed', eq(pickv(cv(null)), ['Cybersecurity lesson', 'Stored title', 'No longer in Study', true, null]) && eq(pickv(cv(undefined)), ['Cybersecurity lesson', 'Stored title', '', false, `#study/cybersecurity/${CY}`]) && cv('failed').status === 'Open it in Study to see how it’s going' && !cv('failed').gone);
    check('the cyber link\'s id is encoded', K.linkView(d2, lk('cyber', 'a b/c', 'x'), K.stIndex(d2.study), undefined).href === '#study/cybersecurity/a%20b%2Fc');
    check('the cyber kind is kept through reading, like the others', eq(nr([lk('cyber', CY, 'Kept', { why: 'For the lab' })])[0], [lk('cyber', CY, 'Kept', { why: 'For the lab' })]));

    console.log('  Which projects link an item');
    {
      const e = world(base('pjA', { title: 'Alpha' }), base('pjB', { title: 'Beta' }), base('pjC', { title: 'Gamma' }));
      e.projects.items[0].studyLinks = [lk('course', 'coA', 'A'), lk('cyber', CY, 'C')];
      e.projects.items[1].studyLinks = [lk('course', 'coA', 'A'), lk('book', 'coA', 'Same id, another kind')];
      const who = (kind, id) => K.linkedFrom(e, kind, id).map(p => p.id);
      check('linkedFrom lists the projects that link a course: none, one or two (in project order)', eq(who('course', 'coNone'), []) && eq(who('cyber', CY), ['pjA']) && eq(who('course', 'coA'), ['pjA', 'pjB']), [who('course', 'coA'), who('cyber', CY)]);
      check('a project marked done is left out; active and paused ones are listed', (() => { const g = world(base('pjAc', { title: 'Active', studyLinks: [lk('course', 'coA', 'A')] }), base('pjPa', { title: 'Paused', status: 'paused', studyLinks: [lk('course', 'coA', 'A')] }), base('pjDo', { title: 'Done', status: 'done', studyLinks: [lk('course', 'coA', 'A')] })); return eq(K.linkedFrom(g, 'course', 'coA').map(p => p.id), ['pjAc', 'pjPa']); })());
      check('…and an item linked only by a done project has no projects at all (the done project keeps its link)', (() => { const g = world(base('pjDo', { status: 'done', studyLinks: [lk('book', 'bkA', 'B')] })); return eq(K.linkedFrom(g, 'book', 'bkA'), []) && g.projects.items[0].studyLinks.length === 1; })());
      check('…and another kind with the same id is not counted', eq(who('book', 'coA'), ['pjB']) && eq(who('arabic', 'coA'), []) && eq(who('book', CY), []));
    }

    console.log('  The Cybersecurity catalogue on the card');
    {
      const cy = K.Cyber, ID = 'lesson.learning-evidence';
      const fresh = () => K.freshState();
      const withTask = (e, done) => { e.study.stages = [{ id: 'sgC', title: 'Stage', courses: [{ id: 'coCy', title: 'Cyber', url: '', minutes: 0, listId: null, archived: false, modules: [{ id: 'mC', title: 'M', sections: [{ id: 'sC', title: 'S', tasks: [{ id: `cyber:1:${ID}`, title: 'Learning through evidence', minutes: 15, url: '', kind: 'learn', note: '', done, doneOn: done ? '2026-10-01' : null }] }] }] }] }]; return e; };
      const attempt = activityId => ({ id: 'caX', activityId, curriculumVersion: '1.0.0', rubricVersion: '1', startedAt: '2026-10-01T09:00', submittedAt: null, inputVariant: 'standard', environmentId: '', assistance: 'independent', evidence: '', answers: {}, rubricScores: [], criticalPassed: null, resumePoint: '', answerRevealed: false, assessor: 'self', verified: false });
      check('a lesson for a fresh learner is "Not started", with the catalogue\'s title', eq(cy.lesson(fresh(), ID), { title: 'Learning through evidence', status: 'Not started' }), cy.lesson(fresh(), ID));
      check('an attempt on the lesson\'s practical, knowledge check or mini challenge makes it "Started"', ['exercise.learning-evidence', 'assessment.learning-evidence-check', 'exercise.learning-evidence-challenge'].every(a => { const e = fresh(); e.cybersecurity.attempts.push(attempt(a)); return cy.lesson(e, ID).status === 'Started'; }));
      check('an attempt on some other activity does not', (() => { const e = fresh(); e.cybersecurity.attempts.push(attempt('exercise.something-else')); return cy.lesson(e, ID).status === 'Not started'; })());
      check('a Study session on the lesson\'s task makes it "Started"', (() => { const e = fresh(); e.study.sessions.push({ id: 'ssX', courseId: null, taskId: `cyber:1:${ID}`, title: 'Learning through evidence', date: '2026-10-01', startedAt: '2026-10-01T09:00', plannedMin: 15, short: false, status: 'done', runningSince: null, activeMs: 0, endedAt: '2026-10-01T09:15', checkin: null, taskDone: null, todayUid: null }); return cy.lesson(e, ID).status === 'Started'; })());
      check('its roadmap task not yet ticked is still "Not started"; ticked, it is "Marked complete"', cy.lesson(withTask(fresh(), false), ID).status === 'Not started' && cy.lesson(withTask(fresh(), true), ID).status === 'Marked complete');
      check('"Marked complete" wins over an attempt', (() => { const e = withTask(fresh(), true); e.cybersecurity.attempts.push(attempt('exercise.learning-evidence')); return cy.lesson(e, ID).status === 'Marked complete'; })());
      check('a lesson that is not in the course is null', cy.lesson(fresh(), 'lesson.nope') === null);
      const ch = cy.choices(fresh());
      check('the choices come in path order, each with a module name, the first being the evidence lesson in "Learning method, scope and lab setup"', ch.length > 20 && ch[0].id === ID && ch[0].group === 'Learning method, scope and lab setup' && ch.every(c => c.title && c.group), ch.slice(0, 2));
      check('an optional lesson is marked optional (and a required one is not), on a path that has one', (() => { const e = fresh(); e.cybersecurity.pathId = 'path.appsec'; const c = cy.choices(e), o = c.find(x => x.id === 'lesson.ai-application-security'); return !!o && o.optional === true && o.title === 'Optional AI application trust boundaries' && o.group === 'Secure development and application security engineering'; })() && ch.every(c => !c.optional), ch.filter(c => c.optional));
      check('…and a lesson appears once', new Set(ch.map(c => c.id)).size === ch.length);
    }

    console.log('  What can still be linked');
    d2 = lw();
    P(d2).studyLinks = [lk('course', 'coD', 'Shop safety'), lk('book', 'bkB', 'Fresh book')];
    check('course choices come in roadmap order, without archived or linked ones', eq(K.courseChoices(d2, P(d2)), [{ id: 'coA', title: 'Networking basics' }, { id: 'coB', title: 'Empty course' }]), K.courseChoices(d2, P(d2)));
    check('book choices come in Reading\'s order, without linked ones', eq(K.bookChoices(d2, P(d2)).map(b => b.id), ['bkA', 'bkC', 'bkD']), K.bookChoices(d2, P(d2)));
    check('with nothing linked every live course and every book is offered', eq(K.courseChoices(lw(), base('pjZ')).map(c => c.id), ['coA', 'coB', 'coD']) && K.bookChoices(lw(), base('pjZ')).length === 4);
    check('a course in a second stage comes after the first stage\'s', (() => { const e = lw(); e.study.stages.push({ id: 'sg2', title: 'Two', courses: [course('coE', 'Second stage', 0, 0)] }); return eq(K.courseChoices(e, base('pjZ')).map(c => c.id), ['coA', 'coB', 'coD', 'coE']); })());
    check('choices and views write nothing', (() => { const e = lw(); K.addStudyLink(e, 'pjL', { kind: 'course', id: 'coA', title: 'A' }); const j = JSON.stringify(e); K.courseChoices(e, P(e)); K.bookChoices(e, P(e)); K.linkView(e, links(e)[0], K.stIndex(e.study)); return JSON.stringify(e) === j; })());
  }


  console.log('\n[19] Resources for a project: web links (specs/projects-resources.md)');
  {
    const AT = '2026-10-20';
    const nr = raw => { const rep = { dropped: 0 }; return [K.normalizeResources(raw, rep), rep.dropped]; };
    const rs = (id, url, x = {}) => ({ id, title: '', url, addedOn: AT, ...x });
    const rw = () => world(base('pjR', { title: 'Garden shed' }));
    const R = d => P(d).resources;

    console.log('  Web addresses');
    const wa = K.webAddress;
    check('a bare address becomes https: "example.com/page" is "https://example.com/page"', wa('example.com/page') === 'https://example.com/page', wa('example.com/page'));
    check('capitals in the site name are lowered, and the path keeps its own capitals', wa('Example.COM/Page') === 'https://example.com/Page' && wa('HTTPS://Example.Com/A') === 'https://example.com/A', [wa('Example.COM/Page'), wa('HTTPS://Example.Com/A')]);
    check('a protocol-less "//cdn.example.com/x" gets https', wa('//cdn.example.com/x') === 'https://cdn.example.com/x');
    check('http is kept as http, and a port is kept', wa('http://example.com/a') === 'http://example.com/a' && wa('example.com:8080/a') === 'https://example.com:8080/a', [wa('http://example.com/a'), wa('example.com:8080/a')]);
    check('spaces around the address are trimmed', wa('   example.org   ') === 'https://example.org/');
    const refused = ['javascript:alert(1)', 'mailto:me@example.com', 'https://user:pw@example.com', 'ftp://example.com', 'localhost:3000', 'example', '', '   ', 'example.com/' + 'a'.repeat(2000), 'https://', 'data:text/html,hi'];
    check('refused (empty): javascript:, mailto:, a user name or password, ftp, a site with no dot, a bare word, blank and over 2000 characters', refused.every(x => wa(x) === ''), refused.filter(x => wa(x) !== '').map(x => [x.slice(0, 30), wa(x).slice(0, 40)]));
    check('an address over 2000 characters is refused, and one just under is kept', wa('example.com/' + 'a'.repeat(2000)) === '' && wa('example.com/' + 'a'.repeat(1900)).length > 1900);
    check('the result of webAddress is unchanged by running it again (idempotent)', ['example.com/page', 'Example.COM/Page?x=1#top', '//cdn.example.com/x', 'http://example.com:8080/a b'].every(x => wa(wa(x)) === wa(x)));
    check('siteOf drops "www." and keeps other subdomains; resourceName is the title, or the site without one', K.siteOf('https://www.example-timber.co.uk/oak') === 'example-timber.co.uk' && K.siteOf('https://shop.example.com/') === 'shop.example.com'
      && K.resourceName({ title: 'Timber merchant', url: 'https://example.com/' }) === 'Timber merchant' && K.resourceName({ title: '', url: 'https://www.example.org/x' }) === 'example.org');

    console.log('  Reading saved links');
    check('absent or null reads as none (nothing counted); a non-list is counted once; an empty list reads as none', eq(nr(undefined), [null, 0]) && eq(nr(null), [null, 0]) && eq(nr('oops'), [null, 1]) && eq(nr([]), [null, 0]));
    const bad = nr([rs('rsOk', 'example.com/ok'), { title: 'No id', url: 'example.com/a' }, { id: 'rsNoUrl', title: 'No address' }, rs('rsBad', 'javascript:alert(1)'), rs('rsPw', 'https://u:p@example.com'), 'text', null]);
    check('a link without an id, without an address, or not an object is counted and left out; a web address is made whole', bad[1] === 4 && bad[0].map(r => r.id).join() === 'rsOk,rsBad,rsPw' && bad[0][0].url === 'https://example.com/ok', bad);
    check('an address that is not a web address (javascript:, a user name and password) is kept as it is and not counted, and cannot be opened; a web address can', eq(bad[0].map(r => [r.url, K.canOpen(r)]), [['https://example.com/ok', true], ['javascript:alert(1)', false], ['https://u:p@example.com', false]]), bad[0].map(r => [r.url, K.canOpen(r)]));
    check('…reading again gives the same, with nothing counted (idempotent), for the web address and the kept one alike', eq(nr(bad[0]), [bad[0], 0]));
    check('a blank or non-text address is still counted and left out; mailto: is kept and cannot be opened', (() => { const r = nr([rs('rsBlank', '   '), { id: 'rsNum', url: 42, addedOn: AT }, rs('rsMail', 'mailto:x@example.com')]); return r[1] === 2 && eq(r[0].map(x => [x.id, x.url, K.canOpen(x)]), [['rsMail', 'mailto:x@example.com', false]]); })());
    const dup = nr([rs('rsA', 'example.com/a', { title: 'First' }), rs('rsA', 'example.org/b', { title: 'Second' })]);
    check('a duplicate id is merged silently (the first stays)', dup[1] === 0 && eq(dup[0].map(r => r.title), ['First']));
    const unk = nr([{ ...rs('rsA', 'example.com/a'), future: { a: [1] }, pin: true }]);
    check('fields from a newer MyDay are kept', eq(unk[0][0].future, { a: [1] }) && unk[0][0].pin === true && unk[1] === 0, unk);
    const tt = nr([rs('rsA', 'example.com/a', { title: '  ' + 'T'.repeat(200) + '  ', note: 'N'.repeat(400) }), rs('rsB', 'example.com/b', { title: 'Q'.repeat(119) + ' ' + 'z'.repeat(50), note: 'x'.repeat(299) + ' ' + 'y'.repeat(50) }), rs('rsC', 'example.com/c', { note: '   ' }), rs('rsD', 'example.com/d', { title: 42, note: 42 })]);
    check('title and note are trimmed and capped at 120 and 300; a blank or non-text note is left off; a non-text title is empty', tt[0][0].title.length === 120 && tt[0][0].note.length === 300 && !('note' in tt[0][2]) && !('note' in tt[0][3]) && tt[0][3].title === '', tt[0].map(r => [r.title.length, r.note && r.note.length]));
    check('a cut that ends on a space is tidied, and a second read gives the same (idempotent)', !/\s$/.test(tt[0][1].title) && !/\s$/.test(tt[0][1].note) && eq(nr(tt[0]), [tt[0], 0]), [tt[0][1].title.length, tt[0][1].note.length]);
    const lone = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
    const em = nr([rs('rsE', 'example.com/e', { title: 'a'.repeat(119) + '😀' + 'b'.repeat(40), note: 'n'.repeat(299) + '😀' + 'm'.repeat(40) })]);
    check('text is cut on whole characters: a title and note whose cut falls on an emoji keep it whole (no half emoji), and read back unchanged', em[0][0].title === 'a'.repeat(119) + '😀' && em[0][0].note === 'n'.repeat(299) + '😀' && !lone.test(em[0][0].title + em[0][0].note) && eq(nr(em[0]), [em[0], 0]), [em[0][0].title.length, em[0][0].note.length]);
    check('tidyText and the Learning why use the same whole-character cut', K.tidyText('😀'.repeat(150), 120) === '😀'.repeat(120) && K.tidyWhy('😀'.repeat(300)) === '😀'.repeat(200) && !lone.test(K.tidyWhy('x'.repeat(199) + '😀😀')) && K.tidyWhy('x'.repeat(199) + '😀😀') === 'x'.repeat(199) + '😀');
    check('a link added with an emoji at the cut keeps it whole too', (() => { const e = rw(); K.addResource(e, 'pjR', { url: 'example.com', title: 'a'.repeat(119) + '😀😀', note: 'n'.repeat(299) + '😀😀' }); return R(e)[0].title === 'a'.repeat(119) + '😀' && R(e)[0].note === 'n'.repeat(299) + '😀'; })());
    const dt = nr([rs('rsA', 'example.com/a', { addedOn: 'last week' }), rs('rsB', 'example.com/b', { addedOn: undefined })]);
    check('an invalid or missing addedOn is replaced by a date (nothing counted)', dt[1] === 0 && dt[0].length === 2 && dt[0].every(r => /^\d{4}-\d\d-\d\d$/.test(r.addedOn)));
    const many = nr(Array.from({ length: 35 }, (_, i) => rs('rs' + i, `example.com/p${i}`)));
    check('more than 30 valid links from elsewhere are all kept (only adding is capped)', many[0].length === 35 && many[1] === 0);
    const viaProjects = K.normalizeProjects({ items: [base('pjA', { resources: [rs('rsA', 'example.com/a')] }), base('pjB', { resources: [] }), base('pjC'), base('pjD', { resources: 'broken' })] }, { dropped: 0 }).items;
    check('through normalizeProjects a project keeps its links; one with none (empty, absent or broken) has no resources key', viaProjects[0].resources.length === 1 && viaProjects.slice(1).every(p => !('resources' in p)), viaProjects.map(p => 'resources' in p));

    console.log('  Adding, editing and removing');
    let d = rw();
    const before = P(d).updatedAt;
    const id1 = K.addResource(d, 'pjR', { url: 'Example-Timber.co.uk/oak', title: '  Timber merchant  ', note: '  Ask about offcuts  ' }, AT);
    check('adding returns an id starting "rs" and keeps the whole address, the tidied title and note, and the day', /^rs/.test(id1) && eq(R(d), [{ id: id1, title: 'Timber merchant', url: 'https://example-timber.co.uk/oak', note: 'Ask about offcuts', addedOn: AT }]), R(d));
    check('…and the project\'s updated time moves on', P(d).updatedAt > before);
    const id2 = K.addResource(d, 'pjR', { url: 'example.org/guide' }, AT);
    check('a blank title and note are fine: an empty title and no note key at all', R(d)[1].title === '' && !('note' in R(d)[1]) && R(d)[1].id === id2 && (() => { const e = rw(); K.addResource(e, 'pjR', { url: 'example.org', note: '   ' }); return !('note' in R(e)[0]); })());
    check('a bad address, a missing project and a duplicate address (after tidying) all return null and add nothing', K.addResource(d, 'pjR', { url: 'javascript:alert(1)' }) === null && K.addResource(d, 'pjNope', { url: 'example.net' }) === null
      && K.addResource(d, 'pjR', { url: 'EXAMPLE.org/guide' }) === null && K.addResource(d, 'pjR', { url: 'https://example.org/guide' }) === null && R(d).length === 2);
    check('the same site with another path is a different link', K.addResource(d, 'pjR', { url: 'example.org/other' }) !== null && R(d).length === 3);
    const cap = rw();
    for (let i = 0; i < 30; i++) K.addResource(cap, 'pjR', { url: `example.com/p${i}` });
    check('the 30th link is accepted and a 31st returns null', R(cap).length === 30 && K.addResource(cap, 'pjR', { url: 'example.com/one-more' }) === null && R(cap).length === 30);
    check('a title over 120 and a note over 300 are cut when added', (() => { const e = rw(); K.addResource(e, 'pjR', { url: 'example.com', title: 'T'.repeat(200), note: 'N'.repeat(400) }); return R(e)[0].title.length === 120 && R(e)[0].note.length === 300; })());
    check('editing changes the address (made whole), title and note, and the project\'s updated time', (() => { const t0 = P(d).updatedAt; return K.editResource(d, 'pjR', id1, { url: 'example-timber.co.uk/pine', title: 'Pine yard', note: 'Closed Sundays' }) && eq(R(d)[0], { id: id1, title: 'Pine yard', url: 'https://example-timber.co.uk/pine', note: 'Closed Sundays', addedOn: AT }) && P(d).updatedAt >= t0; })(), R(d)[0]);
    check('the same values again change nothing (false)', !K.editResource(d, 'pjR', id1, { url: 'https://example-timber.co.uk/pine', title: 'Pine yard', note: 'Closed Sundays' }));
    check('a bad address, another link\'s address, a missing link and a missing project all return false', !K.editResource(d, 'pjR', id1, { url: 'mailto:a@example.com' }) && !K.editResource(d, 'pjR', id1, { url: 'example.org/guide' }) && !K.editResource(d, 'pjR', 'rsNope', { url: 'example.net' }) && !K.editResource(d, 'pjNope', id1, { url: 'example.net' }) && R(d)[0].url === 'https://example-timber.co.uk/pine');
    check('a link may be saved with its own address again (not a duplicate of itself) while its title changes', K.editResource(d, 'pjR', id1, { url: 'example-timber.co.uk/pine', title: 'Pine yard 2', note: 'Closed Sundays' }) && R(d)[0].title === 'Pine yard 2');
    check('a blank note removes the note key', K.editResource(d, 'pjR', id1, { url: 'example-timber.co.uk/pine', title: 'Pine yard 2', note: '   ' }) && !('note' in R(d)[0]));
    check('removing takes just that link out (false when it is not there)', K.removeResource(d, 'pjR', id2) && eq(R(d).map(r => r.id).includes(id2), false) && !K.removeResource(d, 'pjR', id2) && !K.removeResource(d, 'pjNope', id1));
    check('when the last link goes the project has no resources key again (as before)', (() => { const e = rw(); const i = K.addResource(e, 'pjR', { url: 'example.com' }); return K.removeResource(e, 'pjR', i) && !('resources' in P(e)) && eq(Object.keys(P(e)).sort(), Object.keys(base('pjR', { title: 'x' })).sort()); })());

    console.log('  Project search');
    const sd = world(base('pjR', { title: 'Garden shed', resources: [rs('rs1', 'https://timber-yard.example.com/oak', { title: 'Timber merchant', note: 'Ask about offcuts' }), rs('rs2', 'https://www.example.org/x', { note: 'Planning portal form' })] }));
    const sf = q => K.searchProject(sd, P(sd), q);
    check('a link\'s title is found: kind "resource", titled as itself, opening the Overview', eq(sf('merchant').map(h => [h.kind, h.id, h.title, h.href, h.excerpt]), [['resource', 'rs1', 'Timber merchant', '#projects/p/pjR', '']]), sf('merchant'));
    check('a link\'s note is found, with the note as its excerpt', eq(sf('offcuts').map(h => [h.kind, h.id, h.excerpt]), [['resource', 'rs1', 'Ask about offcuts']]), sf('offcuts'));
    check('the address and the site are not searched ("oak" and "yard" are only in the address)', eq(sf('oak'), []) && eq(sf('yard'), []) && eq(sf('example'), []) && eq(sf('https'), []), [sf('oak'), sf('example')]);
    check('an untitled link\'s hit is called by its site (without www.) and found by its note', eq(sf('portal').map(h => [h.id, h.title]), [['rs2', 'example.org']]), sf('portal'));
    check('the kind\'s label is "Link"', K.SEARCH_KIND_LABEL.resource === 'Link');
    const ord = world(base('pjR', { title: 'Order shed', resources: [rs('rs1', 'https://example.com/a', { title: 'Order link' })], milestones: [{ id: 'm1', title: 'Order timber', aim: null, reachedOn: null, createdAt: OLD }] })); ord.tasks.items = [{ id: 'tk1', title: 'Order bolts', listId: '', category: 'Admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-09-20T09:00', postponed: 0, blockers: [], letGoOn: null, projectId: 'pjR' }];
    check('links come last, after every other kind', eq(K.searchProject(ord, P(ord), 'order').map(h => h.kind), ['about', 'task', 'milestone', 'resource']), K.searchProject(ord, P(ord), 'order').map(h => h.kind));
    check('searching writes nothing', (() => { const j = JSON.stringify(sd); sf('merchant'); sf('portal'); return JSON.stringify(sd) === j; })());
  }

  console.log('\n[20] Steps inside a task, and "Starts after" (specs/projects-steps.md)');
  {
    const k = '2026-10-14';
    const TK = (id, title, pid, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 20, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: OLD, postponed: 0, blockers: [], letGoOn: null, ...(pid ? { projectId: pid } : {}), ...x });
    const ST = (id, text, done = false, x = {}) => ({ id, text, done, ...x });
    const rd = (items, r = { dropped: 0 }) => ({ items: K.normalizeTasks({ lists: [], items: clone(items) }, r).items, r });

    console.log('  reading');
    const steps = [ST('s1', 'Measure the wall', true, { futureBit: { a: 1 } }), ST('s2', 'Order the boards')];
    let got = rd([TK('a', 'Build the shed base', 'pjS', { steps, after: ['b', 'c'] })]);
    check('steps and "starts after" are kept exactly, with a newer MyDay\'s field on a step, and nothing counted as dropped', eq(got.items[0].steps, steps) && eq(got.items[0].after, ['b', 'c']) && got.r.dropped === 0, [got.items[0].steps, got.items[0].after, got.r]);
    got = rd([TK('a', 'x', null)]);
    check('a task without them has neither key', !('steps' in got.items[0]) && !('after' in got.items[0]) && got.r.dropped === 0);
    got = rd([TK('a', 'x', null, { steps: [ST('s1', 'y'.repeat(130)), ST('s1', 'Same id again'), ST('', 'No id'), ST('s4', 'Not a yes', 'yes')] })]);
    const ids = got.items[0].steps.map(x => x.id);
    check('…and reading the same task again gives those steps the same ids (nothing changes by itself on each load)', eq(rd([TK('a', 'x', null, { steps: [ST('s1', 'One'), ST('s1', 'Two'), ST('', 'Three')] })]).items[0].steps.map(x => x.id), rd([TK('a', 'x', null, { steps: [ST('s1', 'One'), ST('s1', 'Two'), ST('', 'Three')] })]).items[0].steps.map(x => x.id)));
    check('a step\'s words are cut to 120; a repeated or missing id gets a new one; "done" is true only when it is true', got.items[0].steps[0].text.length === 120 && new Set(ids).size === 4 && ids[0] === 's1' && ids[1] !== 's1' && !!ids[2] && got.items[0].steps[3].done === false && got.r.dropped === 0, [ids, got.items[0].steps.map(x => x.done), got.r]);
    got = rd([TK('a', 'x', null, { steps: ['oops', 5, null, ST('s1', '   '), { id: 's2' }, ST('s3', 'Kept')] })]);
    check('a step it can\'t read (not an object, no words, blank words) is left out and counted, once each', eq(got.items[0].steps.map(x => x.text), ['Kept']) && got.r.dropped === 5, [got.items[0].steps, got.r]);
    got = rd([TK('a', 'x', null, { steps: Array.from({ length: 33 }, (_, i) => ST('s' + i, 'Step ' + i)) })]);
    check('30 steps at most: the rest are left out and counted', got.items[0].steps.length === 30 && got.items[0].steps[29].text === 'Step 29' && got.r.dropped === 3, [got.items[0].steps.length, got.r]);
    got = rd([TK('a', 'x', null, { steps: [] }), TK('b', 'x', null, { steps: { s1: 'Measure' } }), TK('c', 'x', null, { steps: ['bad'] })]);
    check('no steps (an empty list) is simply absent; steps that aren\'t a list, or have none it can read, are absent too and counted', got.items.every(t => !('steps' in t)) && got.r.dropped === 2, [got.items.map(t => t.steps), got.r]);
    got = rd([TK('a', 'x', 'pjS', { after: ['b', 'b', 'a', 5, '', null, 'c', 'nowhere'] })]);
    check('"starts after" (`after`) keeps task ids once each, never its own, and keeps one that points at no task (it may arrive from another device)', eq(got.items[0].after, ['b', 'c', 'nowhere']) && got.r.dropped === 0, [got.items[0].after, got.r]);
    got = rd([TK('a', 'x', 'pjS', { after: Array.from({ length: 12 }, (_, i) => 't' + i) }), TK('b', 'x', 'pjS', { after: [] }), TK('c', 'x', 'pjS', { after: 'b' }), TK('d', 'x', 'pjS', { after: ['d'] })]);
    check('at most 10 (the 2 past that counted); an empty list, or only its own id, is absent; one that isn\'t a list is absent and counted', got.items[0].after.length === 10 && ['b', 'c', 'd'].every(id => !('after' in got.items.find(t => t.id === id))) && got.r.dropped === 3, [got.items.map(t => t.after), got.r]);

    console.log('  steps');
    let w = K.freshState(); w.tasks.items = [TK('tkS', 'Build the shed base', null)];
    const T = () => w.tasks.items[0];
    const s1 = K.addStep(w.tasks, 'tkS', '  Measure the wall  '), s2 = K.addStep(w.tasks, 'tkS', 'Order the boards'), s3 = K.addStep(w.tasks, 'tkS', 'Level the ground');
    check('adding trims the words and puts each step at the end, not ticked', !!s1 && !!s2 && eq(T().steps.map(x => [x.text, x.done]), [['Measure the wall', false], ['Order the boards', false], ['Level the ground', false]]), T().steps);
    check('empty words, or a task that isn\'t there, are refused', K.addStep(w.tasks, 'tkS', '   ') === null && K.addStep(w.tasks, 'tkNope', 'x') === null && T().steps.length === 3);
    check('"0 of 3 steps", and not all done', K.stepsText(T()) === '0 of 3 steps' && !K.allStepsDone(T()));
    check('ticking a step (false when it already is)', K.tickStep(w.tasks, 'tkS', s1, true) && !K.tickStep(w.tasks, 'tkS', s1, true) && T().steps[0].done && K.stepsText(T()) === '1 of 3 steps');
    check('new words for a step; empty or the same words are refused', K.editStep(w.tasks, 'tkS', s2, ' Order the larch boards ') && T().steps[1].text === 'Order the larch boards' && !K.editStep(w.tasks, 'tkS', s2, '  ') && !K.editStep(w.tasks, 'tkS', s2, 'Order the larch boards'));
    check('moving a step up and down (false at either end)', K.moveStep(w.tasks, 'tkS', s3, -1) && eq(T().steps.map(x => x.id), [s1, s3, s2]) && !K.moveStep(w.tasks, 'tkS', s1, -1) && !K.moveStep(w.tasks, 'tkS', s2, 1) && K.moveStep(w.tasks, 'tkS', s3, 1) && eq(T().steps.map(x => x.id), [s1, s2, s3]));
    K.tickStep(w.tasks, 'tkS', s2, true); K.tickStep(w.tasks, 'tkS', s3, true);
    check('every step ticked: all done, "3 of 3 steps" — and the task is not marked done by itself', K.allStepsDone(T()) && K.stepsText(T()) === '3 of 3 steps' && T().done === false && T().doneOn === null);
    check('removing a step; once the last goes the task has no steps key again', K.removeStep(w.tasks, 'tkS', s1) && K.removeStep(w.tasks, 'tkS', s2) && !K.removeStep(w.tasks, 'tkS', s2) && K.stepsText(T()) === '1 of 1 step' && K.removeStep(w.tasks, 'tkS', s3) && !('steps' in T()) && K.stepsText(T()) === '' && !K.allStepsDone(T()));
    for (let i = 0; i < 30; i++) K.addStep(w.tasks, 'tkS', 'Step ' + i);
    check('30 steps at most', T().steps.length === 30 && K.addStep(w.tasks, 'tkS', 'One more') === null && T().steps.length === 30);

    console.log('  "Starts after"');
    // The shed: order the boards → build the frame → paint it; measure has no wait; "Book a skip" is in another project.
    const shed = () => { const d = world(base('pjS', { title: 'Shed' }), base('pjO', { title: 'Elsewhere' }));
      d.tasks.items = [TK('m', 'Measure the wall', 'pjS', { createdAt: '2026-09-20T09:00' }), TK('b', 'Order the boards', 'pjS', { createdAt: '2026-09-21T09:00' }), TK('f', 'Build the frame', 'pjS', { createdAt: '2026-09-19T09:00', after: ['b'] }),
        TK('p', 'Paint it', 'pjS', { createdAt: '2026-09-18T09:00', after: ['f'] }), TK('o', 'Book a skip', 'pjO'), TK('l', 'Loose task', null)]; return d; };
    const tk = (d, id) => d.tasks.items.find(t => t.id === id);
    const titles = list => list.map(t => t.title);
    let d = shed();
    check('startsAfter: the tasks it still starts after, of its project and still to do', eq(titles(K.startsAfter(d, tk(d, 'f'))), ['Order the boards']) && eq(titles(K.startsAfter(d, tk(d, 'p'))), ['Build the frame']) && eq(K.startsAfter(d, tk(d, 'm')), []));
    check('"Starts after: Order the boards"; nothing when there are none', K.startsAfterText(d, tk(d, 'f')) === 'Starts after: Order the boards' && K.startsAfterText(d, tk(d, 'm')) === '');
    K.setTaskDone(d, 'b', true);
    check('once the task it starts after is done nothing holds it (and "after" is left as it is, so undoing brings it back)', eq(K.startsAfter(d, tk(d, 'f')), []) && eq(tk(d, 'f').after, ['b']) && (K.setTaskDone(d, 'b', false), K.startsAfter(d, tk(d, 'f')).length === 1));
    tk(d, 'b').letGoOn = k;
    check('…and the same once it is let go', eq(K.startsAfter(d, tk(d, 'f')), []));
    d = shed(); tk(d, 'f').after = ['b', 'o', 'l', 'gone'];
    check('one in another project, with no project, or not there at all, doesn\'t count', eq(titles(K.startsAfter(d, tk(d, 'f'))), ['Order the boards']));
    d = shed(); delete tk(d, 'f').projectId;
    check('a task with no project starts after nothing, whatever it says', eq(K.startsAfter(d, tk(d, 'f')), []));
    d = shed(); tk(d, 'b').after = ['p'];
    check('a circle (two devices each adding half of one) means nothing in it holds any of its tasks', [tk(d, 'b'), tk(d, 'f'), tk(d, 'p')].every(t => K.startsAfter(d, t).length === 0));
    d = shed(); tk(d, 'b').after = ['p']; K.setTaskDone(d, 'p', true);
    check('a chain through a done task holds nothing: with "Paint it" done, the boards (which start after it) no longer hide the frame\'s link', eq(titles(K.startsAfter(d, tk(d, 'f'))), ['Order the boards']) && K.afterChoices(d, tk(d, 'f')).some(t => t.id === 'b'), [titles(K.startsAfter(d, tk(d, 'f'))), K.afterChoices(d, tk(d, 'f')).map(t => t.id)]);
    d = shed(); tk(d, 'f').after = ['b', 'm'];
    check('"Starts after: Order the boards and 1 more", in the order chosen', K.startsAfterText(d, tk(d, 'f')) === 'Starts after: Order the boards and 1 more');

    console.log('  choosing what it starts after');
    d = shed();
    check('the choices: the project\'s other tasks still to do, never itself, never one that starts after it (directly or further along)', eq(K.afterChoices(d, tk(d, 'b')).map(t => t.id).sort(), ['m']) && eq(K.afterChoices(d, tk(d, 'p')).map(t => t.id).sort(), ['b', 'f', 'm']), [K.afterChoices(d, tk(d, 'b')).map(t => t.id), K.afterChoices(d, tk(d, 'p')).map(t => t.id)]);
    K.setTaskDone(d, 'm', true);
    check('…and not a done task; none for a task with no project', !K.afterChoices(d, tk(d, 'b')).some(t => t.id === 'm') && eq(K.afterChoices(d, tk(d, 'l')), []));
    d = shed();
    check('adding one of its choices', K.setStartsAfter(d, 'b', 'm', true) === true && eq(tk(d, 'b').after, ['m']));
    check('…the same again, itself, a task in another project, or a circle (the frame starts after the boards) are refused', K.setStartsAfter(d, 'b', 'm', true) === false && K.setStartsAfter(d, 'b', 'b', true) === false && K.setStartsAfter(d, 'b', 'o', true) === false && K.setStartsAfter(d, 'b', 'f', true) === false && K.setStartsAfter(d, 'b', 'p', true) === false && eq(tk(d, 'b').after, ['m']));
    check('taking one off; when none is left the task has no "after" key', K.setStartsAfter(d, 'b', 'm', false) === true && !('after' in tk(d, 'b')) && K.setStartsAfter(d, 'b', 'm', false) === false);
    d = shed(); for (let i = 0; i < 11; i++) d.tasks.items.push(TK('x' + i, 'Extra ' + i, 'pjS'));
    const adds = Array.from({ length: 11 }, (_, i) => K.setStartsAfter(d, 'm', 'x' + i, true));
    check('10 at most: the eleventh says "full"', adds.slice(0, 10).every(r => r === true) && adds[10] === 'full' && tk(d, 'm').after.length === 10, adds);
    for (let i = 0; i < 10; i++) K.setTaskDone(d, 'x' + i, true);
    check('…but once all 10 are done, adding another makes room by dropping the done ones', K.setStartsAfter(d, 'm', 'b', true) === true && eq(tk(d, 'm').after, ['b']), tk(d, 'm').after);
    tk(d, 'm').after = Array.from({ length: 9 }, (_, i) => 'x' + i).concat('gone'); for (let i = 0; i < 10; i++) K.setTaskDone(d, 'x' + i, false);
    check('…ids that point at nothing of the project are tidied away when adding, making room', K.setStartsAfter(d, 'm', 'x9', true) === true && !tk(d, 'm').after.includes('gone') && tk(d, 'm').after.length === 10);

    console.log('  deleting a task, moving it, deleting the project');
    d = shed();
    check('deleting a task frees the ones that started after it (their "after" no longer names it)', K.removeTask(d.tasks, 'b') && !('after' in tk(d, 'f')) && eq(tk(d, 'p').after, ['f']));
    d = shed();
    check('moving a task to another project leaves what it starts after, and the others\' links to it, behind', K.linkTask(d, 'f', 'pjO') && !('after' in tk(d, 'f')) && !('after' in tk(d, 'p')) && eq(K.startsAfter(d, tk(d, 'f')), []));
    d = shed();
    check('…and taking it out of any project does the same', K.linkTask(d, 'f', null) && !('after' in tk(d, 'f')) && !('after' in tk(d, 'p')));
    d = shed();
    check('deleting the project: its tasks stay, with no project and nothing to start after', K.deleteProject(d, 'pjS') && ['m', 'b', 'f', 'p'].every(id => !('projectId' in tk(d, id)) && !('after' in tk(d, id))) && tk(d, 'o').projectId === 'pjO');

    console.log('  the next step and "Why this?"');
    const P2 = (dd, id = 'pjS') => dd.projects.items.find(p => p.id === id);
    d = shed();
    check('MyDay\'s pick skips a task that starts after another: "Paint it" and "Build the frame" were added first but can\'t start yet, so "Measure the wall"', K.nextStep(d, P2(d)).id === 'm' && K.heldBack(d, tk(d, 'p')) && K.heldBack(d, tk(d, 'f')) && !K.heldBack(d, tk(d, 'm')), K.nextStep(d, P2(d)).title);
    check('"Why this?": the pick among the tasks "that can start now", then the tasks that come first (with two: "start after other tasks")', eq(K.whyNext(d, P2(d)), ['MyDay’s pick: none of the tasks that can start now has a date, so it’s the one you added first.', '2 tasks that come first start after other tasks.']), K.whyNext(d, P2(d)));
    tk(d, 'p').after = []; delete tk(d, 'p').after; K.setTaskDone(d, 'p', true);
    check('…with one: "“Build the frame” comes first, but it starts after “Order the boards”."', eq(K.whyNext(d, P2(d)), ['MyDay’s pick: none of the tasks that can start now has a date, so it’s the one you added first.', '“Build the frame” comes first, but it starts after “Order the boards”.']), K.whyNext(d, P2(d)));
    tk(d, 'm').waiting = { on: 'Sam', since: '2026-10-01', until: null }; d.tasks.items.push(TK('z', 'Sweep the floor', 'pjS', { createdAt: '2026-09-25T09:00' }));
    check('waiting on someone and starting after a task are both held back, and said together when both come first', K.nextStep(d, P2(d)).id === 'b' && eq(K.whyNext(d, P2(d)), ['MyDay’s pick: none of the tasks that can start now has a date, so it’s the one you added first.', '2 tasks that come first can’t start yet: they’re waiting on someone or something, or start after another task.']), K.whyNext(d, P2(d)));
    d = shed(); K.setTaskDone(d, 'm', true); K.setTaskDone(d, 'b', true);
    check('once what it starts after is done, a task is picked again in its usual order ("Paint it" still starts after the frame)', K.nextStep(d, P2(d)).id === 'f' && eq(K.whyNext(d, P2(d)), ['MyDay’s pick: it’s the only task still to do that can start now.']), [K.nextStep(d, P2(d)).title, K.whyNext(d, P2(d))]);
    d = shed(); P2(d).nextTaskId = 'f';
    check('a step you chose that starts after another stays chosen, and "Why this?" says what it starts after and what MyDay would pick', K.nextStep(d, P2(d)).id === 'f' && eq(K.whyNext(d, P2(d)), ['You chose this step.', 'It starts after “Order the boards”; you can still do it any time.', 'Left to MyDay, it would be “Measure the wall”.']), K.whyNext(d, P2(d)));
    tk(d, 'm').waiting = { on: 'Sam', since: '2026-10-01', until: null }; tk(d, 'b').waiting = { on: 'the timber yard', since: '2026-10-01', until: null };
    check('with every other task held back too, "Why this?" doesn\'t call it all waiting', eq(K.whyNext(d, P2(d)).slice(-1), ['Left to MyDay, there’d be no next step: nothing here can start yet (each task is waiting on someone or something, or starts after another task).']), K.whyNext(d, P2(d)));
    delete tk(d, 'p').after;
    check('…with one task free again, it says what MyDay would pick', eq(K.whyNext(d, P2(d)).slice(-1), ['Left to MyDay, it would be “Paint it”.']), K.whyNext(d, P2(d)));
    tk(d, 'p').waiting = { on: 'Sam', since: '2026-10-01', until: null }; delete tk(d, 'f').after; tk(d, 'f').waiting = { on: 'Priya', since: '2026-10-01', until: null };
    check('…and when everything is waiting on someone, "everything here is waiting", as before', eq(K.whyNext(d, P2(d)), ['You chose this step.', 'Left to MyDay, there’d be no next step: everything here is waiting.']), K.whyNext(d, P2(d)));
    d = shed(); P2(d).nextTaskId = 'f';
    check('Today\'s next steps leave out a project whose step starts after another task', !K.stepsForToday(d, k).some(x => x.project.id === 'pjS') && (P2(d).nextTaskId = null, K.stepsForToday(d, k).some(x => x.project.id === 'pjS' && x.task.id === 'm')));
    d = shed(); Object.assign(tk(d, 'f'), { due: '2026-10-01', postponed: 4 });
    const nudged = dd => K.worthALook(dd, P2(dd), k).some(x => x.key === 'still-open' && x.text.startsWith('Build the frame'));
    d = shed(); tk(d, 'f').due = '2026-10-01';
    check('Worth a look doesn\'t nudge a past-dated task that starts after another (it isn\'t "stuck"); once the other is done it does', !nudged(d) && (K.setTaskDone(d, 'b', true), P2(d).nextTaskId = 'm', nudged(d)), K.worthALook(d, P2(d), k));
    d = shed(); Object.assign(tk(d, 'f'), { due: '2026-10-01', postponed: 4 });
    check('a task that starts after another isn\'t "stuck" however often it moved; once the other is done it can be again', !K.isStuck(d, tk(d, 'f'), k) && (K.setTaskDone(d, 'b', true), K.isStuck(d, tk(d, 'f'), k)));
    d = shed();
    const before = JSON.stringify(d);
    ['m', 'b', 'f', 'p', 'o', 'l'].forEach(id => { K.startsAfter(d, tk(d, id)); K.startsAfterText(d, tk(d, id)); K.afterChoices(d, tk(d, id)); K.heldBack(d, tk(d, id)); }); K.nextStep(d, P2(d)); K.whyNext(d, P2(d)); K.stepsForToday(d, k);
    check('reading what a task starts after, its choices, the next step and "Why this?" writes nothing', JSON.stringify(d) === before);
  }

  console.log('\n[21] Needs you, across projects (specs/projects-attention.md)');
  {
    const k = '2026-10-14', D = d => K.shortDate(d), day = n => K.shift(k, n);
    const TK = (id, title, pid, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 20, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-09-20T09:00', postponed: 0, blockers: [], letGoOn: null, ...(pid ? { projectId: pid } : {}), ...x });
    const AS = (id, x = {}) => ({ id, text: 'Offices pay monthly', state: 'open', found: '', checkedOn: null, taskId: null, createdAt: OLD, ...x });
    const DC = (id, q, opened, x = {}) => ({ id, question: q, options: [{ id: id + 'a', text: 'Local', pros: [], cons: [] }, { id: id + 'b', text: 'Online', pros: [], cons: [] }], chosen: null, why: '', decidedOn: null, createdAt: `${opened}T09:00`, ...x });
    const EV = (id, status) => ({ id, title: 'Check-in photos', kind: 'photo', date: null, where: '', status, notes: '', issueIds: [], createdAt: OLD });
    const build = () => {
      const w = world(base('pjShed', { title: 'Garden shed', stage: 'act', updatedAt: '2026-10-13T09:00', commitmentIds: ['cmAppt'] }),
        base('pjCoffee', { title: 'Coffee subscription', template: 'business', updatedAt: '2026-10-12T09:00', model: { problem: 'p', who: 'w', how: 'h', assumptions: [AS('asF', { taskId: 'tkFind' }), AS('asNo', { taskId: 'tkFindOpen' })] },
          decisions: [DC('dcOld', 'Which roaster?', day(-23)), DC('dcNew', 'Which cups?', day(-10)), DC('dcDone', 'Which name?', day(-30), { chosen: 'dcDonea', decidedOn: day(-1) })] }),
        base('pjCase', { title: 'Deposit dispute', template: 'case', updatedAt: '2026-10-11T09:00', case: { timeline: [], evidence: [EV('ev1', 'to-get'), EV('ev2', 'to-get'), EV('ev3', 'have')], issues: [] } }),
        base('pjPriv', { title: 'Moving flat', private: true, updatedAt: '2026-10-10T09:00' }),
        base('pjPaused', { title: 'Paused one', status: 'paused' }), base('pjDone', { title: 'Done one', status: 'done' }));
      w.tasks.items = [
        TK('tToday', 'Measure the alcove', 'pjShed', { due: k, time: '17:30' }), TK('tPast', 'Order the boards', 'pjShed', { due: day(-3) }),
        TK('tPastWait', 'Ask Sam', 'pjShed', { due: day(-2), waiting: { on: 'Sam', since: day(-9), until: null } }),
        TK('tPastAfter', 'Build the frame', 'pjShed', { due: day(-2), after: ['tPast'] }),
        TK('tWait', 'Get the quote back', 'pjShed', { waiting: { on: 'Priya', since: day(-6), until: day(-1) } }), TK('tWaitToday', 'Hear about the van', 'pjShed', { waiting: { on: 'the van hire', since: day(-6), until: k } }),
        TK('tStuck', 'Book the skip', 'pjShed', { due: day(1), postponed: 4 }), TK('tWeek', 'Clear the corner', 'pjShed', { due: day(-8) }),
        TK('tSoon', 'Send the letter', 'pjCase', { due: day(3) }), TK('tTomorrow', 'Phone the agent', 'pjCase', { due: day(1) }), TK('tFar', 'Too far ahead', 'pjCase', { due: day(8) }),
        TK('tDoneToday', 'Already done', 'pjShed', { due: k, done: true, doneOn: k }), TK('tPriv', 'Book the van', 'pjPriv', { due: day(2) }),
        TK('tPaused', 'Paused task', 'pjPaused', { due: k }), TK('tDoneP', 'Done project task', 'pjDone', { due: k }), TK('tLoose', 'No project', null, { due: k }),
        TK('tkFind', 'Find out: Offices pay monthly', 'pjCoffee', { done: true, doneOn: day(-2) }), TK('tkFindOpen', 'Find out: still open', 'pjCoffee')];
      w.commitments = [{ id: 'cmAppt', kind: 'appointment', title: 'Timber yard visit', start: `${day(2)}T10:00`, end: `${day(2)}T11:00` }];
      return w;
    };
    let w = build();
    const N = K.needsYou(w, k), keys = N.map(n => n.key), by = key => N.find(n => n.key === key);
    check('the order: today\'s dates, dates passed (oldest first), waits that are due, tasks that keep moving, the coming week, decisions, then Find out and evidence', eq(keys, [
      'date:tToday', 'past:tPast', 'waiting:tWait', 'waiting:tWaitToday', 'stuck:tWeek', 'stuck:tStuck', 'date:tTomorrow', 'date:pjShed:cmAppt', 'date:tPriv', 'date:tSoon', 'decision:pjCoffee:dcOld', 'found:pjCoffee', 'evidence:pjCase']), keys);
    check('a date today: "today at 17:30", opening the task', eq([by('date:tToday').title, by('date:tToday').why, by('date:tToday').href, by('date:tToday').reason, by('date:tToday').group], ['Measure the alcove', 'today at 17:30', '#today/tasks/tToday', 'today', 'dates']));
    check('a date passed: "still open, was due …"; never one that\'s waiting on someone or starts after another task', by('past:tPast').why === `still open, was due ${D(day(-3))}` && !keys.some(x => x.endsWith(':tPastWait') || x.endsWith(':tPastAfter')));
    check('a wait whose expected day has come: "waiting on Priya — expected …" ("expected today" on the day), with Chase it', by('waiting:tWait').why === `waiting on Priya — expected ${D(day(-1))}` && by('waiting:tWaitToday').why === 'waiting on the van hire — expected today' && eq(by('waiting:tWait').chase, { taskId: 'tWait', added: false }) && by('waiting:tWait').group === 'waiting');
    check('a task that keeps moving: "moved 4 times — something in the way?", or a week past its date: "planned for … — something in the way?"; each only once (not also as a date)', by('stuck:tStuck').why === 'moved 4 times — something in the way?' && by('stuck:tWeek').why === `planned for ${D(day(-8))} — something in the way?` && !keys.includes('date:tStuck') && !keys.includes('past:tWeek'));
    check('the coming week: "tomorrow", "on …", an appointment with its time (opening the Calendar); eight days on, nothing', by('date:tTomorrow').why === 'tomorrow' && by('date:tSoon').why === `on ${D(day(3))}` && by('date:pjShed:cmAppt').why === `on ${D(day(2))} at 10:00` && by('date:pjShed:cmAppt').href === '#calendar' && !keys.includes('date:tFar'));
    check('a decision open 14 days or more: "open 3 weeks", opening Decisions; one opened 10 days ago, or one made, isn\'t', by('decision:pjCoffee:dcOld').title === 'Which roaster?' && by('decision:pjCoffee:dcOld').why === 'open 3 weeks' && by('decision:pjCoffee:dcOld').href === '#projects/p/pjCoffee/decisions' && keys.filter(x => x.startsWith('decision:')).length === 1);
    check('a business idea\'s Find out results ("A Find out task is done" — "what did you find?") and a case\'s evidence ("2 pieces of evidence" — "still to get")', eq([by('found:pjCoffee').title, by('found:pjCoffee').why, by('found:pjCoffee').href], ['A Find out task is done', 'what did you find?', '#projects/p/pjCoffee/model'])
      && eq([by('evidence:pjCase').title, by('evidence:pjCase').why, by('evidence:pjCase').href, by('evidence:pjCase').group], ['2 pieces of evidence', 'still to get', '#projects/p/pjCase/evidence', 'tools']));
    check('every line names its project; a private project\'s items show (on this device)', N.every(n => n.project === w.projects.items.find(p => p.id === n.projectId).title) && by('date:tPriv').project === 'Moving flat');
    check('not: a done task, a paused or finished project\'s, or a task in no project', !keys.some(x => /tDoneToday|tPaused|tDoneP|tLoose/.test(x)));
    const on = id => N.filter(n => n.projectId === id).length;
    check('how many need you on each project (the List\'s "7 need you")', on('pjShed') === 7 && on('pjCoffee') === 2 && on('pjCase') === 3 && on('pjPaused') === 0, [on('pjShed'), on('pjCoffee'), on('pjCase')]);
    check('the reasons\' groups and their names', eq(Object.keys(K.NEED_GROUP_LABEL), ['dates', 'waiting', 'stuck', 'decisions', 'tools']) && eq(Object.values(K.NEED_GROUP_LABEL), ['Dates', 'Waiting', 'In the way', 'Decisions', 'Findings and evidence']));
    const before = JSON.stringify(w); K.needsYou(w, k);
    check('working it out writes nothing', JSON.stringify(w) === before);
    w = build(); K.setTaskDone(w, 'tPast', true);
    check('dealt with, it goes: the boards done, they leave; the frame (which started after them) is still open after its date, so it\'s there now', !K.needsYou(w, k).some(n => n.key === 'past:tPast') && K.needsYou(w, k).some(n => n.key === 'past:tPastAfter'));
    w = build(); w.projects.items.find(p => p.id === 'pjCoffee').decisions[0].chosen = 'dcOlda';
    check('…a decision made, it goes', !K.needsYou(w, k).some(n => n.key.startsWith('decision:')));
    w = build(); w.projects.items = w.projects.items.filter(p => p.id === 'pjPriv' || p.id === 'pjPaused'); w.tasks.items = [TK('tLater', 'Later', 'pjPriv', { due: day(9) }), TK('tUndated', 'Some day', 'pjPriv')];
    check('an active project with nothing that needs you gives nothing', eq(K.needsYou(w, k), []));

    console.log('  more cases');
    w = build(); w.tasks.items.push(TK('tPast2', 'Older one', 'pjShed', { due: day(-5) }), TK('tCasePast', 'Same day, other project', 'pjCase', { due: day(-3) }), TK('tLetGo', 'Let go of', 'pjShed', { due: day(-1), letGoOn: day(-1) }),
      TK('tSeven', 'Seven days on', 'pjCase', { due: day(7) }), TK('tBlocked', 'Said what was in the way', 'pjShed', { due: day(-9), blockers: [{ reason: 'tired', on: day(-2) }] }));
    w.projects.items.find(p => p.id === 'pjCoffee').decisions.push(DC('dc14', 'Exactly two weeks?', day(-14)));
    w.commitments.push({ id: 'cmToday', kind: 'appointment', title: 'Builder visit', start: `${k}T09:00`, end: `${k}T10:00` }, { id: 'cmAway', kind: 'appointment', title: 'Away', start: `${day(-1)}T09:00`, end: `${day(1)}T17:00` });
    w.projects.items.find(p => p.id === 'pjShed').commitmentIds.push('cmToday', 'cmAway');
    w.tasks.items.push(TK('tChase', 'Chase: Get the quote back', 'pjShed')); w.tasks.items.find(t => t.id === 'tWait').waiting.chaseTaskId = 'tChase';
    const M = K.needsYou(w, k), mk = M.map(n => n.key), at = key => mk.indexOf(key);
    check('dates passed come oldest first, and on the same day the project worked on most recently first', at('past:tBlocked') < at('past:tPast2') && at('past:tPast2') < at('past:tPast') && at('past:tPast') < at('past:tCasePast'), mk.filter(x => x.startsWith('past:')));
    check('a task a week past its date that you said was in the way (in the last week) isn\'t "stuck": it\'s a date passed', mk.includes('past:tBlocked') && !mk.includes('stuck:tBlocked'));
    check('a task you let go isn\'t there', !mk.some(x => x.endsWith(':tLetGo')));
    check('exactly 7 days on is still in the coming week', mk.includes('date:tSeven'));
    check('a decision open exactly 14 days counts', mk.includes('decision:pjCoffee:dc14'));
    check('an appointment today: "today at 09:00", first; one under way since yesterday isn\'t a date', M.find(n => n.key === 'date:pjShed:cmToday')?.why === 'today at 09:00' && at('date:pjShed:cmToday') < at('date:tToday') && !mk.includes('date:pjShed:cmAway'), mk.slice(0, 3));
    check('a wait whose Chase task is still to do says so (added)', eq(M.find(n => n.key === 'waiting:tWait').chase, { taskId: 'tWait', added: true }));
    check('Worth a look uses the same 7-day rule: the appointment under way since yesterday is never "in -1 days"', !K.worthALook(w, w.projects.items.find(p => p.id === 'pjShed'), k).some(x => /-\d+ days|Away/.test(x.text)), K.worthALook(w, w.projects.items.find(p => p.id === 'pjShed'), k).map(x => x.text));
  }

  console.log('\n[22] Optional sections on a project\'s Overview (specs/projects-sections.md)');
  {
    const k = '2026-10-14', at = '2026-10-10T09:00';
    const rdp = (extra, r = { dropped: 0 }) => K.normalizeProjects({ items: [base('pjS', extra)] }, r).items[0];
    check('reading: "hiddenSections" keeps section ids once each, a newer MyDay\'s too; nothing else', eq(rdp({ hiddenSections: ['files', 'files', 'notes', 'newer-thing', 5, '', 'x'.repeat(41)] }).hiddenSections, ['files', 'notes', 'newer-thing']));
    const r25 = { dropped: 0 };
    check('…an empty list, or one that isn\'t a list, is simply absent; at most 20, the rest counted', !('hiddenSections' in rdp({ hiddenSections: [] })) && !('hiddenSections' in rdp({ hiddenSections: 'files' })) && rdp({ hiddenSections: Array.from({ length: 25 }, (_, i) => 's' + i) }, r25).hiddenSections.length === 20 && r25.dropped === 5, r25);
    const TK = (id, x = {}) => ({ id, title: 'Task ' + id, listId: '', category: 'admin', minutes: 20, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-01-01T09:00', postponed: 0, blockers: [], letGoOn: null, projectId: 'pjS', ...x });
    const fresh = (x = {}) => { const w = world(base('pjS', { title: 'Renew the passport', updatedAt: '2026-01-01T09:00', ...x })); w.tasks.items = []; return w; }; // (Recently lists a project's latest changes, however old: none here)
    const view = (w, opened) => { const v = K.overviewSections(w, P(w), opened); return { show: [...v.show], fold: v.fold, hidden: v.hiddenWith.map(h => `${h.id}:${h.count}`) }; };
    let w = fresh();
    check('a project with nothing in its optional cards: none shows; Notes, Learning, Resources and Files fold into "Add to this project" (Recently has nothing to add)', eq(view(w), { show: [], fold: ['notes', 'learning', 'resources', 'files'], hidden: [] }), view(w));
    check('the row\'s words, in that order', eq(K.SECTIONS.filter(s => s.add).map(s => s.add), ['a note', 'something to learn', 'a link', 'a file']));
    w = fresh({ resources: [{ id: 'rs1', title: 'Passport office', url: 'https://example.com', addedOn: k }], studyLinks: [{ kind: 'course', id: 'c1', title: 'A course', addedOn: k }], fileIds: ['flsec000001'] });
    w.files = { items: [{ id: 'flsec000001', name: 'form.pdf', type: 'application/pdf', size: 10, sha256: 'd'.repeat(64), area: 'project', state: 'kept', addedOn: k }] };
    w.notes.items = [{ id: 'n1', categoryId: '', title: 'Photo rules', text: 'Plain background', pinned: false, createdAt: at, updatedAt: at, projectId: 'pjS' }];
    w.tasks.items = [TK('t1', { createdAt: '2026-10-12T09:00' })];
    check('with something in each, each shows (Notes, a recent change, Learning, Resources, Files) and nothing folds', eq(view(w), { show: ['notes', 'recently', 'learning', 'resources', 'files'], fold: [], hidden: [] }), view(w));
    check('what each holds', eq(K.SECTIONS.map(s => K.sectionContent(w, P(w), s.id)), [1, K.sectionContent(w, P(w), 'recently'), 1, 1, 1]) && K.sectionContent(w, P(w), 'recently') > 0);
    w = fresh(); w.files = { items: [{ id: 'flsec000002', name: 'old.pdf', type: 'application/pdf', size: 10, sha256: 'd'.repeat(64), area: 'project', state: 'kept', addedOn: k, deletedOn: k, removedFrom: { kind: 'project', id: 'pjS' } }] };
    check('a file of the project waiting in Recently deleted keeps Files in view', view(w).show.includes('files') && !view(w).fold.includes('files'), view(w));

    console.log('  hiding');
    w = fresh({ resources: [{ id: 'rs1', title: 'A', url: 'https://example.com/a', addedOn: k }, { id: 'rs2', title: 'B', url: 'https://example.com/b', addedOn: k }] });
    const was = P(w).updatedAt;
    check('hiding Resources saves it on the project, without counting as work on it (its updated time, and so its place in Projects, stay)', K.setHidden(w, 'pjS', 'resources', true) === true && eq(P(w).hiddenSections, ['resources']) && P(w).updatedAt === was && K.isHidden(P(w), 'resources'));
    check('…and it goes inside the project\'s own sync record', K.splitProject(P(w)).some(r => r.kind === 'project' && eq(r.content.value.hiddenSections, ['resources'])), K.splitProject(P(w)).map(r => r.kind));
    check('…it no longer shows, and with something in it it\'s named: "Resources (2)"', !view(w).show.includes('resources') && eq(view(w).hidden, ['resources:2']) && !view(w).fold.includes('resources') && K.hiddenWords(K.overviewSections(w, P(w)).hiddenWith[0]) === 'Resources (2)', view(w));
    check('hiding it again changes nothing; an unknown section or project is refused', K.setHidden(w, 'pjS', 'resources', true) === false && K.setHidden(w, 'pjS', 'calendar', true) === false && K.setHidden(w, 'pjNope', 'files', true) === false);
    K.setHidden(w, 'pjS', 'files', true);
    check('a hidden card with nothing in it is neither named nor offered to add', !view(w).hidden.some(x => x.startsWith('files')) && !view(w).fold.includes('files'), view(w));
    w.tasks.items = [TK('t1', { createdAt: '2026-10-12T09:00' })]; K.setHidden(w, 'pjS', 'recently', true);
    check('a hidden Recently isn\'t named (it\'s only a view of changes)', !view(w).show.includes('recently') && !view(w).hidden.some(x => x.startsWith('recently')), view(w));
    check('opened on this visit (from the row, or a search result in it), a card shows whether hidden or folded', view(w, new Set(['resources', 'notes'])).show.includes('resources') && view(w, new Set(['resources', 'notes'])).show.includes('notes') && !view(w, new Set(['resources'])).hidden.some(x => x.startsWith('resources')));
    check('showing it again; when none is hidden the project has no "hiddenSections" key', K.setHidden(w, 'pjS', 'resources', false) && K.setHidden(w, 'pjS', 'files', false) && K.setHidden(w, 'pjS', 'recently', false) && !('hiddenSections' in P(w)) && K.setHidden(w, 'pjS', 'files', false) === false);
    w = fresh({ hiddenSections: ['newer-thing'] });
    check('a section id from a newer MyDay is kept and changes nothing here; an unknown id among the opened ones is ignored', eq(view(w).fold, ['notes', 'learning', 'resources', 'files']) && eq(view(w, new Set(['calendar'])), view(w)) && K.setHidden(w, 'pjS', 'notes', true) && eq(P(w).hiddenSections, ['newer-thing', 'notes']));
    w = fresh({ hiddenSections: ['files'] }); w.files = { items: [1, 2].map(n => ({ id: 'flsec00000' + n, name: n + '.pdf', type: 'application/pdf', size: 10, sha256: 'd'.repeat(64), area: 'project', state: 'kept', addedOn: k, deletedOn: k, removedFrom: { kind: 'project', id: 'pjS' } })) };
    check('a hidden Files whose files are all in Recently deleted is named as such: "Files (2 recently deleted)" (they go for good after 30 days)', K.hiddenWords(K.overviewSections(w, P(w)).hiddenWith[0]) === 'Files (2 recently deleted)', K.overviewSections(w, P(w)).hiddenWith);

    console.log('  opening on arrival');
    K.openOnArrival('pjS', 'resources'); K.openOnArrival('pjS', 'files');
    check('openOnArrival notes the cards for that project\'s next Overview; arrived clears it', eq(K.arriving('pjS'), ['resources', 'files']) && eq(K.arriving('pjOther'), []) && (K.arrived('pjS'), eq(K.arriving('pjS'), [])));
    w = fresh({ hiddenSections: ['resources'] });
    const before = JSON.stringify(w); K.overviewSections(w, P(w)); K.overviewSections(w, P(w), new Set(['files'])); K.SECTIONS.forEach(s => K.sectionContent(w, P(w), s.id));
    check('working out what shows writes nothing', JSON.stringify(w) === before);
  }

  fs.rmSync(dir, { recursive: true, force: true });
  const s = summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
