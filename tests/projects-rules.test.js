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
    `export * from ${src('projectPlan')};`, `export { normalizeProjects, deleteProject, recently, addProject } from ${src('projects')};`,
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

  fs.rmSync(dir, { recursive: true, force: true });
  const s = summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
