// Milestones and decisions on a project (app/src/data/projectPlan.ts, read and kept by projects.ts), on the app's own
// code bundled for Node, with made-up projects: a project without them is unchanged, unknown fields are kept, adding,
// editing, reaching, moving and removing milestones, decisions with 1-4 options and their pros and cons, deciding and
// "Think again" (nothing lost), repairs when reading, the limits, the project's "updated" time, "Recently", and
// deleting a project. No browser.
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
  const dir = path.join(os.tmpdir(), `myday-projects-rules-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  const src = p => JSON.stringify(path.join(ROOT, 'app/src/data', p));
  fs.writeFileSync(path.join(dir, 'kit.ts'), [
    `export * from ${src('projectPlan')};`, `export * from ${src('businessModel')};`, `export * from ${src('caseFile')};`, `export { normalizeProjects, deleteProject, recently, addProject, setProjectPrivate, privateProjectIds } from ${src('projects')};`,
    `export { freshState, normalize } from ${src('normalize')};`, `export { shift, shortDate } from ${src('dates')};`, `export * from ${src('projectDashboard')};`, `export * from ${src('weekReview')};`, `export { stepsForToday } from ${src('projects')};`,
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
  for (let i = 1; i <= 6; i++) { K.addPoint(d, 'pjA', dA, oA, 'pros', 'Pro ' + i); K.addPoint(d, 'pjA', dA, oA, 'cons', 'Con ' + i); }
  check('six pros and six cons are accepted', X().options[0].pros.length === 6 && X().options[0].cons.length === 6);
  check('a 7th pro or con returns "full" and adds nothing', K.addPoint(d, 'pjA', dA, oA, 'pros', 'Pro 7') === 'full' && K.addPoint(d, 'pjA', dA, oA, 'cons', 'Con 7') === 'full' && X().options[0].pros.length === 6 && X().options[0].cons.length === 6);
  check('a blank point adds nothing (false)', K.addPoint(d, 'pjA', dA, oB, 'pros', '  ') === false && X().options[1].pros.length === 0);
  check('a point can be edited', K.editPoint(d, 'pjA', dA, oA, 'pros', 1, 'Fresher beans') && X().options[0].pros[1] === 'Fresher beans' && !K.editPoint(d, 'pjA', dA, oA, 'pros', 1, 'Fresher beans'));
  check('a blank edit removes the point', K.editPoint(d, 'pjA', dA, oA, 'cons', 0, '  ') && X().options[0].cons.length === 5 && X().options[0].cons[0] === 'Con 2');
  check('removePoint takes one out by its place; a place that isn\'t there changes nothing', K.removePoint(d, 'pjA', dA, oA, 'pros', 0) && X().options[0].pros[0] === 'Fresher beans' && X().options[0].pros.length === 5 && !K.removePoint(d, 'pjA', dA, oA, 'pros', 9));
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
    check('the kinds of project are General, Business idea and Case, in that order', eq(K.TEMPLATES.map(t => t.id), ['general', 'business', 'case']), K.TEMPLATES);
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

    // Size guard
    const ARABIC = 'ع'.repeat(800), EMOJI = '😀'.repeat(400);
    d = world(base('pjA', { template: 'case' }), base('pjO'));
    const sizeB = clone(d.projects.items[1]);
    let big = null, added = 0;
    for (let i = 0; i < 150 && big === null; i++) { const x = K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'ع'.repeat(160), details: ARABIC }); if (x === 'big') big = 'entry'; else added++; }
    for (let i = 0; i < 150 && big === null; i++) { const x = K.addEvidence(d, 'pjA', { title: '😀'.repeat(80), where: 'ع'.repeat(200), notes: EMOJI }); if (x === 'big') big = 'evidence'; else added++; }
    check('filling a case with long texts in Arabic and emoji ends with an add refused as "big" before the counts are reached', big !== null && added > 0 && added < 300, { big, added });
    const lenT = caseOf(d).timeline.length, lenE = caseOf(d).evidence.length, bytesNow = K.projectBytes(P(d));
    check('the project then stays at or under the budget of 380,000 bytes', K.CASE_LIMITS.bytes === 380000 && bytesNow <= 380000 && bytesNow > 300000, bytesNow);
    const refusedE = K.addEvidence(d, 'pjA', { title: '😀'.repeat(80), where: 'ع'.repeat(200), notes: EMOJI }), refusedT = K.addEntry(d, 'pjA', { date: '2026-09-01', title: 'ع'.repeat(160), details: ARABIC }), idsAll = JSON.stringify(caseOf(d));
    check('a refused add leaves nothing behind (same counts, same bytes, same updated time)', (refusedE === 'big' || refusedT === 'big') && caseOf(d).timeline.length === lenT && caseOf(d).evidence.length === lenE && K.projectBytes(P(d)) === bytesNow, [refusedE, refusedT]);
    // Make a little room (empty one entry's details), add issues, then lengthen their notes until the budget says no.
    const roomT = caseOf(d).timeline[0];
    K.editEntry(d, 'pjA', roomT.id, { details: '' });
    const roomIs = [K.addIssue(d, 'pjA', 'ع'.repeat(120)), K.addIssue(d, 'pjA', 'ع'.repeat(120)), K.addIssue(d, 'pjA', 'ع'.repeat(120))];
    let grown = null, stayed = null, atOld = null;
    for (const id of roomIs) {
      if (typeof id !== 'string') continue;
      P(d).updatedAt = OLD;
      const res = K.editIssue(d, 'pjA', id, { notes: 'ع'.repeat(800) });
      if (res === 'big') { grown = res; stayed = caseOf(d).issues.find(i => i.id === id).notes; atOld = P(d).updatedAt; break; }
    }
    check('an edit that makes a text longer past the budget returns "big", leaves the old value and the updated time, and the project stays within the budget', grown === 'big' && stayed === '' && atOld === OLD && K.projectBytes(P(d)) <= 380000, { grown, stayed, bytes: K.projectBytes(P(d)) });
    check('…and the other project, the days and tasks were never touched', eq(d.projects.items[1], sizeB));
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

  console.log('\n[11] A project\'s dashboard: tiles, weeks, pointers');
  {
    const k = '2026-10-14'; // a Wednesday; its Monday is the 12th
    const TK = (id, pid, x = {}) => ({ id, title: 'Task ' + id, listId: '', category: 'Admin', minutes: 25, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: OLD, postponed: 0, blockers: [], letGoOn: null, projectId: pid, ...x });
    const AS = (id, text, x = {}) => ({ id, text, state: 'open', found: '', checkedOn: null, taskId: null, createdAt: OLD, ...x });
    const TLe = (id, x = {}) => ({ id, date: '2026-09-01', about: false, title: 'Landlord kept the deposit', details: '', source: 'mine', evidenceIds: [], issueIds: [], createdAt: OLD, ...x });
    const EVi = (id, x = {}) => ({ id, title: 'Tenancy agreement', kind: 'document', date: null, where: '', status: 'have', notes: '', issueIds: [], createdAt: OLD, ...x });
    const ISs = (id, x = {}) => ({ id, title: 'Deposit not protected', status: 'considering', notes: '', createdAt: OLD, ...x });
    const keys = ts => ts.map(t => t.key);
    const byKey = (ts, key) => ts.find(t => t.key === key);

    console.log('  mondayOf');
    check('every day of the week of Monday 12 October 2026 gives Monday the 12th, including the Monday itself and the Sunday', ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'].every(x => K.mondayOf(x) === '2026-10-12'), ['2026-10-12', '2026-10-18'].map(K.mondayOf));
    check('the next Monday (19 October) gives itself, and the Sunday before a month starts goes back to that week\'s Monday (Sunday 1 November gives 26 October)', K.mondayOf('2026-10-19') === '2026-10-19' && K.mondayOf('2026-11-01') === '2026-10-26', [K.mondayOf('2026-10-19'), K.mondayOf('2026-11-01')]);

    console.log('  tiles');
    // A general project: a next step, two milestones of five reached, one decision open.
    let d = world(base('pjG', { nextTaskId: 'tkA', commitmentIds: ['cmA'] }));
    d.tasks.items = [TK('tkA', 'pjG', { title: 'Call the roaster', minutes: 15 }), TK('tkB', 'pjG', { title: 'Order samples', due: '2026-10-16', time: '10:30' })];
    d.commitments = [{ id: 'cmA', kind: 'appointment', title: 'Tasting at the roastery', start: '2026-10-20T14:00', end: '2026-10-20T15:00' }];
    const ms = ['First order', 'Second roaster', 'Third office', 'Fourth', 'Fifth'].map(t => K.addMilestone(d, 'pjG', t));
    K.setReached(d, 'pjG', ms[0], true, '2026-10-05'); K.setReached(d, 'pjG', ms[1], true, '2026-10-08');
    const dc1 = K.addDecision(d, 'pjG', 'Which roaster?'), op1 = K.addOption(d, 'pjG', dc1, 'Local');
    K.decide(d, 'pjG', dc1, op1, 'Closest', '2026-10-09');
    K.addDecision(d, 'pjG', 'Which grinder to buy?');
    let ts = K.tiles(d, d.projects.items[0], k);
    check('a general project\'s tiles are the next step, the next date, milestones and decisions, in that order', eq(keys(ts), ['step', 'date', 'milestones', 'decisions']), keys(ts));
    check('the next step tile names the chosen task with its minutes and links to that task', eq(((t) => [t.value, t.sub, t.href])(byKey(ts, 'step')), ['Call the roaster', '15 min', '#today/tasks/tkA']), byKey(ts, 'step'));
    check('the next date tile names the soonest dated task with its day and time, and links to that task', byKey(ts, 'date').value === 'Order samples' && byKey(ts, 'date').sub === `${K.shortDate('2026-10-16')}, 10:30` && byKey(ts, 'date').href === '#today/tasks/tkB', byKey(ts, 'date'));
    check('the milestones tile says "2 of 5 reached" with "Next: Third office" and links to the Milestones tab', eq(((t) => [t.value, t.sub, t.href])(byKey(ts, 'milestones')), ['2 of 5 reached', 'Next: Third office', '#projects/p/pjG/milestones']), byKey(ts, 'milestones'));
    check('the decisions tile says "1 open" with that decision\'s question and links to the Decisions tab', eq(((t) => [t.value, t.sub, t.href])(byKey(ts, 'decisions')), ['1 open', 'Which grinder to buy?', '#projects/p/pjG/decisions']), byKey(ts, 'decisions'));
    for (const m of ms.slice(2)) K.setReached(d, 'pjG', m, true, '2026-10-10');
    ts = K.tiles(d, d.projects.items[0], k);
    check('with every milestone reached the sub line says "All reached"', byKey(ts, 'milestones').value === '5 of 5 reached' && byKey(ts, 'milestones').sub === 'All reached', byKey(ts, 'milestones'));
    // Empty general project, and a date that is an appointment
    const dE = world(base('pjE', { commitmentIds: ['cmA'] }));
    dE.commitments = clone(d.commitments);
    let tE = K.tiles(dE, dE.projects.items[0], k);
    check('with no tasks the next step tile says "None yet" and links to the project', eq(((t) => [t.value, t.sub, t.href])(byKey(tE, 'step')), ['None yet', 'What’s the smallest one?', '#projects/p/pjE']), byKey(tE, 'step'));
    check('an appointment is the next date when no task is dated, with its time, linking to the Calendar', eq(((t) => [t.value, t.sub, t.href])(byKey(tE, 'date')), ['Tasting at the roastery', `${K.shortDate('2026-10-20')}, 14:00`, '#calendar']), byKey(tE, 'date'));
    check('with no milestones and no open decisions those tiles say "None yet" and "None open"', byKey(tE, 'milestones').value === 'None yet' && byKey(tE, 'decisions').value === 'None open' && byKey(tE, 'decisions').sub === 'Is there a choice to make?', [byKey(tE, 'milestones'), byKey(tE, 'decisions')]);
    const dN = world(base('pjN'));
    check('with nothing dated the next date tile says "None yet"', byKey(K.tiles(dN, dN.projects.items[0], k), 'date').value === 'None yet');

    // A business idea
    const biz = world(base('pjB', { template: 'business', model: { problem: 'Slow lunches', who: 'Small crews', how: '', assumptions: [AS('asA', 'Crews would pay'), AS('asB', 'We can cook 40 boxes'), AS('asC', 'Sites allow deliveries', { state: 'doesnt-hold' }), AS('asD', 'Roasters deliver', { state: 'looks-true' })] } }));
    let tb = K.tiles(biz, biz.projects.items[0], k);
    check('a business idea\'s tiles are the next step, the one page, what must be true and milestones', eq(keys(tb), ['step', 'one-page', 'beliefs', 'milestones']), keys(tb));
    check('the one page tile counts answered questions (two answers plus the beliefs list make "3 of 4 answered") and links to the model', byKey(tb, 'one-page').value === '3 of 4 answered' && byKey(tb, 'one-page').sub === 'Four simple questions' && byKey(tb, 'one-page').href === '#projects/p/pjB/model', byKey(tb, 'one-page'));
    check('what must be true counts the things and says how many are open, look true and don\'t hold', eq(((t) => [t.value, t.sub])(byKey(tb, 'beliefs')), ['4 things', '2 to check · 1 looks true · 1 doesn’t hold']), byKey(tb, 'beliefs'));
    biz.projects.items[0].model.assumptions = [AS('asA', 'Crews would pay')];
    tb = K.tiles(biz, biz.projects.items[0], k);
    check('one thing to check reads "1 thing" with "1 to check"', byKey(tb, 'beliefs').value === '1 thing' && byKey(tb, 'beliefs').sub === '1 to check', byKey(tb, 'beliefs'));
    biz.projects.items[0].model.assumptions = [AS('asA', 'Crews would pay', { state: 'looks-true' })];
    check('one belief that looks true reads "1 looks true"', byKey(K.tiles(biz, biz.projects.items[0], k), 'beliefs').sub === '1 looks true');
    const bE = world(base('pjB2', { template: 'business' }));
    tb = K.tiles(bE, bE.projects.items[0], k);
    check('an empty business idea says "0 of 4 answered", "None yet" for what must be true, and "None yet" for milestones', byKey(tb, 'one-page').value === '0 of 4 answered' && byKey(tb, 'beliefs').value === 'None yet' && byKey(tb, 'beliefs').sub === 'What it depends on' && byKey(tb, 'milestones').value === 'None yet', tb);

    // A case
    const cs = world(base('pjC', { template: 'case', case: {
      timeline: [TLe('tl1', { date: '2026-08-15' }), TLe('tl2', { date: '2026-09-20', issueIds: ['is1'] })],
      evidence: [EVi('ev1', { status: 'to-get' }), EVi('ev2', { status: 'have', issueIds: ['is1'] }), EVi('ev3', { status: 'to-get' })],
      issues: [ISs('is1'), ISs('is2'), ISs('is3', { status: 'dropped' })],
    } }));
    let tc = K.tiles(cs, cs.projects.items[0], k);
    check('a case\'s tiles are the next date, evidence to get, issues with nothing linked and timeline entries', eq(keys(tc), ['date', 'to-get', 'bare', 'timeline']), keys(tc));
    check('evidence to get shows 2 "of 3 pieces of evidence" and links to the Evidence tab', eq(((t) => [t.value, t.sub, t.href])(byKey(tc, 'to-get')), ['2', 'of 3 pieces of evidence', '#projects/p/pjC/evidence']), byKey(tc, 'to-get'));
    check('issues with nothing linked leaves out the dropped one (it isn\'t a gap), "of 3 issues"', eq(((t) => [t.value, t.sub, t.href])(byKey(tc, 'bare')), ['1', 'of 3 issues', '#projects/p/pjC/issues']), byKey(tc, 'bare'));
    check('the timeline tile counts the entries and gives the latest date', eq(((t) => [t.value, t.sub, t.href])(byKey(tc, 'timeline')), ['2', `Latest: ${K.shortDate('2026-09-20')}`, '#projects/p/pjC/timeline']), byKey(tc, 'timeline'));
    const cE = world(base('pjC2', { template: 'case' }));
    tc = K.tiles(cE, cE.projects.items[0], k);
    check('an empty case says 0 pieces and 0 issues, and describes the timeline instead of a latest date', byKey(tc, 'to-get').sub === 'of 0 pieces of evidence' && byKey(tc, 'bare').sub === 'of 0 issues' && byKey(tc, 'timeline').sub === 'What happened, in date order', tc);
    const c1 = world(base('pjC3', { template: 'case', case: { timeline: [], evidence: [EVi('ev1', { status: 'to-get' })], issues: [ISs('is1')] } }));
    tc = K.tiles(c1, c1.projects.items[0], k);
    check('a single piece of evidence and a single issue read "of 1 piece of evidence" and "of 1 issue"', byKey(tc, 'to-get').sub === 'of 1 piece of evidence' && byKey(tc, 'bare').sub === 'of 1 issue', tc);

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
    check('a past dated task is not pointed out (and the project still has its open task)', wl(g1).length === 0, wl(g1));
    g1.commitments = [{ id: 'cmA', kind: 'appointment', title: 'Viewing', start: '2026-10-15T10:00', end: '2026-10-15T11:00' }]; g1.projects.items[0].commitmentIds = ['cmA'];
    check('an appointment within the week is pointed out too, linking to the Calendar', eq(wl(g1).map(x => [x.text, x.href]), [['Viewing — tomorrow', '#calendar']]), wl(g1));
    // No next step
    const ns = world(base('pjS'));
    check('an active project with no open tasks says "No next step yet — what’s the smallest one?" and links to the project', eq(wl(ns).map(x => [x.key, x.text, x.href]), [['step', 'No next step yet — what’s the smallest one?', '#projects/p/pjS']]), wl(ns));
    const ps = world(base('pjS', { status: 'paused' }));
    check('a paused project does not get it', wl(ps).length === 0, wl(ps));
    ns.tasks.items = [TK('z', 'pjS', { done: true, doneOn: k })];
    check('a project whose only task is done still gets it', texts(wl(ns)).length === 1 && texts(wl(ns))[0].startsWith('No next step'), wl(ns));
    ns.tasks.items = [TK('z', 'pjS')];
    check('a project with an open task does not', wl(ns).length === 0, wl(ns));
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
    check('with a date, two case pointers and no open task, the three first are kept and the "No next step" one is left out', eq(texts(wl(all)), ['Hearing — in 2 days', '1 issue has nothing linked yet', '1 piece of evidence still to get']), wl(all));
  }

  console.log('\n[12] The weekly review: when, what moved, what\'s waiting, focus');
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
    check('a task a week past due says when it has been waiting since', wa[1].kind === 'stuck' && wa[1].text === `“Renew passport” has been waiting since ${K.shortDate('2026-10-10')}`, wa[1]);
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
    check('a week with nothing waiting gives an empty list', K.whatsWaiting(K.freshState(), k).length === 0);

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

  fs.rmSync(dir, { recursive: true, force: true });
  const s = summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
