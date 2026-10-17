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
    `export * from ${src('projectPlan')};`, `export * from ${src('businessModel')};`, `export { normalizeProjects, deleteProject, recently, addProject, setProjectPrivate, privateProjectIds } from ${src('projects')};`,
    `export { freshState, normalize } from ${src('normalize')};`, `export { shift } from ${src('dates')};`,
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
    check('isBusiness and knownTemplate: general, business and "case"', !K.isBusiness(base()) && K.knownTemplate(base()) && K.isBusiness(base('p', { template: 'business' })) && K.knownTemplate(base('p', { template: 'business' })) && !K.isBusiness(base('p', { template: 'case' })) && !K.knownTemplate(base('p', { template: 'case' })));

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

  fs.rmSync(dir, { recursive: true, force: true });
  const s = summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
