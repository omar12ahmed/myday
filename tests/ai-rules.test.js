// "Help me adjust today": the rules, checked on the app's own code (bundled for Node from app/src/ai and app/src/data
// by ai-eval/build.mjs), with made-up data in memory only. No browser, no network, no real records.
//   [1] what's sent (context)  [2] every rule on a reply  [3] saving: only after confirming, never stale, undo
//   [4] the instructions and the mock planner  [5] the model adapter (with a fake provider)  …  [9] AI-written revision cards  [10] cards from your notes
process.env.TZ = 'Europe/London';
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  // The app's code is bundled from app/src and the curriculum files the app's own build writes. If a build is running in
  // this worktree (its preparation steps rewrite those files), the bundle can find one half written: try again a few
  // times, and if it still can't, say so plainly rather than stopping without a word.
  let built = null;
  for (let attempt = 1; attempt <= 4 && !built; attempt++) {
    try { built = await bundle(path.join(ROOT, 'ai-eval/kit.ts'), path.join(os.tmpdir(), `myday-aikit-${process.pid}`)); }
    catch (e) { console.log(`  (bundling the app's code failed, attempt ${attempt} of 4: ${String(e && e.message || e).split('\n')[0].slice(0, 200)})`); if (attempt < 4) await new Promise(r => setTimeout(r, 5000)); }
  }
  if (!built) { console.log('HARNESS: the app\'s code could not be bundled — built or generated files changed under it (is a build running in this worktree?). Run this suite again when it has finished.'); process.exit(2); }
  const K = await import(pathToFileURL(built).href);
  K.useMemoryStorage();
  const task = (uid, title, category, minutes, x = {}) => ({ uid, taskId: 'l-' + uid, category, title, minutes, baseMinutes: minutes, done: false, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null, ...x });
  // A day at a given time, built from the app's defaults (and saved to the memory-only storage).
  function day(now, energy, tasks, more = () => {}) {
    K.setClock(now);
    const k = now.slice(0, 10), s = K.freshState();
    s.days[k] = { energy, rest: false, builtAt: k + 'T08:00', checkedIn: false, tasks };
    if (energy !== null) s.context[k] = { energy, sleep: { start: null, end: null, estimatedHours: 7 } };
    more(s, k);
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s)); K.boot();
    return { k, data: K.getSnapshot().data };
  }
  const reply = o => JSON.stringify({ rest: false, priorities: [], explanation: 'Gently does it.', missing: [], ...o });
  const pr = (taskId, minutes, start = null) => ({ taskId, minutes, start });
  const codes = r => r.violations.map(v => v.code);
  const D = '2026-11-10';
  const THREE = () => [task('a', 'Course section', 'learning', 30), task('b', 'Batch cook', 'admin', 45), task('c', 'Gym', 'health', 60)];
  const NIGHT = (s, anchor) => { s.rota.patterns = [{ id: 'p1', effectiveFrom: null, anchor, cycle: ['night', 'off'], times: { day: { start: '07:00', end: '19:00' }, night: { start: '19:00', end: '07:00' } }, breaks: { day: 30, night: 30 } }]; };
  const DAYSHIFT = s => { s.rota.patterns = [{ id: 'p1', effectiveFrom: null, anchor: D, cycle: ['day'], times: { day: { start: '07:00', end: '19:00' }, night: { start: '19:00', end: '07:00' } }, breaks: { day: 30, night: 30 } }]; };

  console.log('\n[1] What is sent (gathered by the app)');
  let { k, data } = day(`${D}T09:30`, 3, THREE(), s => { s.commitments.push({ id: 'c1', kind: 'appointment', title: 'Dentist — Dr Smith', start: `${D}T11:00`, end: `${D}T12:00` }); });
  let ctx = K.buildContext(data, k, '  I slept badly and only have 20 minutes  ' + 'x'.repeat(300));
  check('the current date, time, weekday and time zone', ctx.date === D && ctx.now === '09:30' && ctx.weekday === 'Tuesday' && ctx.timezone === 'Europe/London', [ctx.date, ctx.now, ctx.weekday, ctx.timezone]);
  check('energy, the energy rule (energy 3 → 2 tasks) and the plan\'s tasks with their ids', ctx.energy === 3 && ctx.maxPriorities === 2 && !ctx.smallOnly && eq(ctx.tasks.map(t => t.id), ['a', 'b', 'c']));
  check('appointments as busy time, without their names', ctx.busy.some(b => b.kind === 'appointment' && b.start === `${D}T11:00`) && !JSON.stringify(ctx).includes('Dentist') && !JSON.stringify(ctx).includes('Smith'));
  check('free time leaves out the appointment and its prep/travel time (30 min either side)', eq(ctx.free, [{ start: '09:30', end: '10:30' }, { start: '12:30', end: '21:00' }]), ctx.free);
  check('your note, trimmed and kept short (200 characters)', ctx.note.startsWith('I slept badly') && ctx.note.length === 200);
  check('nothing from other sections (no Finance, Health records or Study notes)', !('finance' in ctx) && !('health' in ctx) && typeof ctx.revisionDue === 'number');
  ({ k, data } = day(`${D}T09:30`, 3, THREE(), s => {
    s.projects.items.push({ id: 'pjSecret', title: 'Surprise party', summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: `${D}T08:00`, updatedAt: `${D}T08:00`, private: true });
    s.tasks.items.push({ id: 'tkS', title: 'Batch cook', listId: '', category: 'admin', minutes: 45, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: D, planUid: 'b', createdAt: `${D}T08:00`, postponed: 0, blockers: [], letGoOn: null, projectId: 'pjSecret' });
  }));
  ctx = K.buildContext(data, k, '');
  check('a private project\'s task on today\'s plan goes as "a private task", without its title; the others keep theirs', ctx.tasks.find(t => t.id === 'b').title === 'a private task' && !JSON.stringify(ctx).includes('Batch cook') && ctx.tasks.find(t => t.id === 'a').title === 'Course section', ctx.tasks.map(t => t.title));
  ({ k, data } = day(`${D}T10:00`, 2, THREE(), s => NIGHT(s, '2026-11-09')));
  ctx = K.buildContext(data, k, '');
  check('last night\'s shift (19:00–07:00) is included, crossing midnight', ctx.busy.some(b => b.kind === 'work' && b.start === '2026-11-09T19:00' && b.end === `${D}T07:00`), ctx.busy);
  ({ k, data } = day('2026-10-25T08:00', 2, THREE(), s => NIGHT(s, '2026-10-24')));
  ctx = K.buildContext(data, k, '');
  check('the night the clocks go back: the shift still ends at 07:00 (it\'s 13 hours), and free time starts after prep/travel at 07:30', ctx.busy.some(b => b.kind === 'work' && b.end === '2026-10-25T07:00') && ctx.free[0].start === '08:00', [ctx.busy, ctx.free]);
  for (const [e, n, small] of [[1, 1, true], [2, 1, true], [3, 2, false], [4, 3, false], [5, 3, false], [null, 1, true]]) {
    ({ k, data } = day(`${D}T09:00`, e, THREE()));
    ctx = K.buildContext(data, k, '');
    check(`energy ${e === null ? 'not recorded' : e}: room for ${n}${small ? ', small only' : ''}`, ctx.maxPriorities === n && ctx.smallOnly === small);
  }
  ({ k, data } = day(`${D}T11:00`, 3, [task('a', 'Course', 'learning', 30, { done: true }), task('b', 'Cook', 'admin', 45), task('c', 'Gym', 'health', 60)]));
  check('energy 3 with one task done: room for one more (as Review my plan counts it)', K.buildContext(data, k, '').maxPriorities === 1);
  ({ k, data } = day(`${D}T09:00`, null, THREE(), s => { delete s.context[D]; }));
  check('missing information is named, not guessed (energy and sleep)', eq(K.missingInfo(data, k), ["Today's energy isn't recorded, so the suggestion stays small.", "Last night's sleep isn't recorded."]));

  console.log('\n[2] Every reply is checked against MyDay\'s rules');
  ({ k, data } = day(`${D}T09:00`, 1, THREE()));
  let r = K.checkProposal(reply({ priorities: [pr('a', 30), pr('b', 45), pr('c', 60)] }), data, k);
  check('energy 1: three suggested → one kept, and kept small (30 → 20 min)', r.proposal.priorities.length === 1 && r.proposal.priorities[0].minutes === 20 && codes(r).includes('too-many') && codes(r).includes('not-small'), [codes(r), r.proposal.priorities]);
  check('…and it says why, in plain words', r.proposal.adjusted.some(a => a.includes('energy 1')) && r.proposal.adjusted.some(a => a.includes('shortened to 20 minutes')));
  ({ k, data } = day(`${D}T09:00`, 2, THREE()));
  r = K.checkProposal(reply({ priorities: [pr('a', 15), pr('b', 15)] }), data, k);
  check('energy 2: at most one small task', r.proposal.priorities.length === 1 && codes(r).includes('too-many'));
  ({ k, data } = day(`${D}T09:00`, 3, THREE()));
  r = K.checkProposal(reply({ priorities: [pr('a', 30), pr('b', 45), pr('c', 60)] }), data, k);
  check('energy 3: at most two', r.proposal.priorities.length === 2 && codes(r).includes('too-many'));
  ({ k, data } = day(`${D}T09:00`, 5, THREE()));
  r = K.checkProposal(reply({ priorities: [pr('a', 30), pr('b', 45), pr('c', 60)] }), data, k);
  check('energy 5: three is fine', r.proposal.priorities.length === 3 && r.violations.length === 0, codes(r));
  ({ k, data } = day(`${D}T09:00`, null, THREE(), s => { delete s.context[D]; }));
  r = K.checkProposal(reply({ priorities: [pr('a', 30), pr('b', 45)] }), data, k);
  check('energy not recorded: treated as unknown — one small task, and the missing information shown', r.proposal.priorities.length === 1 && r.proposal.priorities[0].minutes === 20 && r.proposal.missing.some(m => m.includes('energy')));
  ({ k, data } = day(`${D}T09:00`, 4, [task('a', 'Course', 'learning', 30, { done: true }), task('b', 'Cook', 'admin', 45), task('c', 'Gym', 'health', 60)]));
  r = K.checkProposal(reply({ priorities: [pr('x-made-up', 30), pr('a', 30), pr('b', 45), pr('b', 30)] }), data, k);
  check('tasks that aren\'t on the plan, are already done, or repeat are dropped', r.proposal.priorities.length === 1 && r.proposal.priorities[0].uid === 'b' && ['unknown-task', 'done-task', 'repeated-task'].every(c => codes(r).includes(c)), codes(r));
  r = K.checkProposal(reply({ priorities: [pr('b', 120), pr('c', 2)] }), data, k);
  check('never longer than the task\'s usual length (120 → 45), never under 5 minutes', r.proposal.priorities[0].minutes === 45 && r.proposal.priorities[1].minutes === 5 && codes(r).includes('too-long') && codes(r).includes('too-short'));
  ({ k, data } = day(`${D}T06:00`, 4, THREE(), s => { DAYSHIFT(s); s.settings.earliestTime = '05:30'; }));
  r = K.checkProposal(reply({ priorities: [pr('a', 30, '12:00'), pr('b', 20, '06:00')] }), data, k);
  check('a time on top of a shift is removed (with the reason); a time that fits is kept', r.proposal.priorities[0].start === null && r.proposal.priorities[1].start === 360 && codes(r).includes('time-conflict') && /Day shift \(07:00–19:00\)/.test(r.violations.find(v => v.code === 'time-conflict').detail), r.violations);
  r = K.checkProposal(reply({ priorities: [pr('a', 30, '06:15')] }), data, k);
  check('…and one that would run into the prep/travel time before it', r.proposal.priorities[0].start === null && codes(r).includes('time-conflict'));
  ({ k, data } = day(`${D}T06:00`, 3, THREE(), s => NIGHT(s, '2026-11-09')));
  r = K.checkProposal(reply({ priorities: [pr('a', 30, '06:30')] }), data, k);
  check('overnight: a time before last night\'s shift has ended (06:30) is removed', r.proposal.priorities[0].start === null && codes(r).includes('time-conflict'));
  ({ k, data } = day('2026-10-25T07:00', 3, THREE(), s => NIGHT(s, '2026-10-24')));
  r = K.checkProposal(reply({ priorities: [pr('a', 30, '07:15'), pr('b', 20, '08:00')] }), data, k);
  check('the night the clocks go back: 07:15 clashes with the 13-hour shift\'s end, 08:00 is fine', r.proposal.priorities[0].start === null && r.proposal.priorities[1].start === 480, r.proposal.priorities);
  ({ k, data } = day(`${D}T20:00`, 4, THREE(), s => { s.settings.latestTime = '23:30'; s.context['2026-11-11'] = { energy: null, sleep: { start: `${D}T22:00`, end: '2026-11-11T06:00', estimatedHours: null } }; }));
  r = K.checkProposal(reply({ priorities: [pr('c', 60, '21:30'), pr('a', 30, '20:30')] }), data, k);
  check('recorded sleep tonight (from 22:00) is respected: 21:30 for an hour is removed, 20:30 kept', r.proposal.priorities[0].start === null && r.proposal.priorities[1].start === 1230 && /sleep/i.test(r.violations[0].detail), r.violations);
  ({ k, data } = day(`${D}T14:00`, 4, THREE()));
  r = K.checkProposal(reply({ priorities: [pr('a', 30, '09:00'), pr('b', 45, '15:00'), pr('c', 60, '15:30')] }), data, k);
  check('times in the past, and two suggestions on top of each other, are removed', r.proposal.priorities[0].start === null && r.proposal.priorities[1].start === 900 && r.proposal.priorities[2].start === null, r.proposal.priorities.map(p => p.start));
  r = K.checkProposal(reply({ priorities: [pr('a', 30, '9am')] }), data, k);
  check('a time that isn\'t a time is removed', r.proposal.priorities[0].start === null && codes(r).includes('bad-time'));
  r = K.checkProposal(reply({ rest: true }), data, k);
  check('rest is always allowed (and then everything open waits)', r.proposal.rest && r.violations.length === 0 && r.proposal.later.length === 3);
  r = K.checkProposal(reply({ rest: true, priorities: [pr('a', 30)] }), data, k);
  check('rest with tasks alongside: rest wins (the gentler reading)', r.proposal.rest && r.proposal.priorities.length === 0 && codes(r).includes('rest-and-tasks'));
  r = K.checkProposal('Sure! Here is a plan: do the laundry.', data, k);
  check('a reply that isn\'t JSON gives no suggestion at all', r.proposal === null && codes(r)[0] === 'not-json');
  r = K.checkProposal('```json\n' + reply({ priorities: [pr('a', 30)] }) + '\n```', data, k);
  check('JSON wrapped in ``` fences is still read', !!r.proposal && r.proposal.priorities.length === 1);
  r = K.checkProposal(JSON.stringify({ priorities: 'all of them', explanation: 3 }), data, k);
  check('the wrong shape gives no suggestion', r.proposal === null && codes(r)[0] === 'bad-shape');
  r = K.checkProposal(reply({ explanation: 'You should really push through and not fall behind.' }), data, k);
  check('pushy or guilt-tripping wording is replaced with a gentle explanation', codes(r).includes('pressure-language') && !/should|behind/.test(r.proposal.explanation), r.proposal.explanation);
  r = K.checkProposal(reply({ explanation: Array.from({ length: 80 }, (_, i) => 'word' + i).join(' ') + '.' }), data, k);
  check('long explanations are shortened (at most 45 words)', codes(r).includes('long-explanation') && r.proposal.explanation.split(' ').length <= 45);
  r = K.checkProposal(reply({ missing: ['How much time you have', 7, ''] }), data, k);
  check('missing information from the model is kept (only sensible text)', eq(r.proposal.missing, ['How much time you have']));
  ({ k, data } = day(`${D}T11:00`, 2, [], s => { s.days[D] = { energy: 2, rest: true, builtAt: '', checkedIn: false, tasks: [] }; }));
  r = K.checkProposal(reply({ priorities: [pr('a', 10)] }), data, k);
  check('a rest day stays a rest day', r.proposal.rest && r.proposal.priorities.length === 0);

  console.log('\n[3] Saving: only after you confirm, never stale, and one step of undo');
  ({ k, data } = day(`${D}T09:00`, 3, [task('a', 'Course', 'learning', 30), task('b', 'Cook', 'admin', 45, { scheduledStart: `${D}T12:00`, scheduledEnd: `${D}T12:45` }), task('c', 'Gym', 'health', 60)], s => { s.days['2026-11-09'] = { energy: 4, rest: false, builtAt: '', checkedIn: true, tasks: [task('z', 'Old', 'admin', 20, { done: true })] }; }));
  const before = JSON.parse(localStorage.getItem('myday.data.v4'));
  const stamp = K.planStamp(K.getSnapshot().data, k);
  r = K.checkProposal(reply({ priorities: [pr('c', 25, '10:00'), pr('a', 20, null)] }), K.getSnapshot().data, k);
  check('checking a reply saves nothing', eq(JSON.parse(localStorage.getItem('myday.data.v4')), before));
  let res = K.applyAi(k, stamp, r.proposal);
  let after = JSON.parse(localStorage.getItem('myday.data.v4'));
  const t = uid => after.days[k].tasks.find(x => x.uid === uid);
  check('using it saves through the checked save path', res.ok && after.saves.seq === before.saves.seq + 1);
  check('the priorities first, with the suggested minutes and time', eq(after.days[k].tasks.map(x => x.uid), ['c', 'a']) && t('c').minutes === 25 && t('c').scheduledStart === `${D}T10:00` && t('a').minutes === 20 && t('a').scheduledStart === null);
  check('…the task\'s usual length (its template) is unchanged', t('c').baseMinutes === 60 && t('a').baseMinutes === 30);
  check('…the task lists, other days and the energy rating are untouched', eq(after.lists, before.lists) && eq(after.days['2026-11-09'], before.days['2026-11-09']) && after.days[k].energy === 3 && eq(after.context, before.context));
  check('…and the task left out waits in the queue (nothing deleted)', after.queue.some(q => q.title === 'Cook'));
  res = K.undoAi(res.undo);
  check('Undo puts the plan and the queue back exactly', res === 'undone' && eq(JSON.parse(localStorage.getItem('myday.data.v4')).days, before.days) && eq(JSON.parse(localStorage.getItem('myday.data.v4')).queue, before.queue));
  // Stale: the plan changes after asking.
  const s2 = K.planStamp(K.getSnapshot().data, k);
  K.update(d => { d.days[k].tasks[0].done = true; });
  const snap = localStorage.getItem('myday.data.v4');
  res = K.applyAi(k, s2, r.proposal);
  check('a suggestion made before a task was ticked is refused ("stale") and nothing is saved', !res.ok && res.reason === 'stale' && localStorage.getItem('myday.data.v4') === snap);
  for (const [what, change] of [['energy changed', d => { d.context[k].energy = 1; }], ['an appointment was added', d => { d.commitments.push({ id: 'c9', kind: 'appointment', title: 'x', start: `${D}T15:00`, end: `${D}T16:00` }); }], ['tonight\'s sleep was recorded', d => { d.context['2026-11-11'] = { energy: null, sleep: { start: `${D}T22:00`, end: '2026-11-11T06:00', estimatedHours: null } }; }]]) {
    const st = K.planStamp(K.getSnapshot().data, k);
    K.update(change);
    check(`…also when ${what}`, K.applyAi(k, st, r.proposal).reason === 'stale');
  }
  ({ k, data } = day(`${D}T09:00`, 3, [task('a', 'Course', 'learning', 30), task('b', 'Cook', 'admin', 45)]));
  r = K.checkProposal(reply({ priorities: [pr('a', 20)] }), data, k);
  res = K.applyAi(k, K.planStamp(data, k), r.proposal);
  K.update(d => { d.days[k].tasks[0].done = true; });
  check('Undo is refused once the plan has changed since (nothing is overwritten)', K.undoAi(res.undo) === 'changed' && JSON.parse(localStorage.getItem('myday.data.v4')).days[k].tasks[0].done === true);
  // Another device: its change reaches this browser through sync, saved by another tab (this tab hasn't seen it yet).
  const otherTab = change => { const o = JSON.parse(localStorage.getItem('myday.data.v4')); change(o); o.saves = { ...o.saves, seq: o.saves.seq + 1 }; localStorage.setItem('myday.data.v4', JSON.stringify(o)); };
  ({ k, data } = day(`${D}T09:00`, 3, [task('a', 'Course', 'learning', 30), task('b', 'Cook', 'admin', 45)]));
  r = K.checkProposal(reply({ priorities: [pr('a', 20)] }), data, k);
  res = K.applyAi(k, K.planStamp(data, k), r.proposal);
  otherTab(o => { o.days[k].tasks[0].done = true; });
  let theirs = localStorage.getItem('myday.data.v4');
  check('Undo after another device ticked a task on today\'s plan: refused ("changed"), and their change is kept', K.undoAi(res.undo) === 'changed' && localStorage.getItem('myday.data.v4') === theirs && K.getSnapshot().data.days[k].tasks[0].done === true);
  ({ k, data } = day(`${D}T09:00`, 3, [task('a', 'Course', 'learning', 30), task('b', 'Cook', 'admin', 45)]));
  r = K.checkProposal(reply({ priorities: [pr('a', 20)] }), data, k);
  res = K.applyAi(k, K.planStamp(data, k), r.proposal);
  otherTab(o => { o.days['2026-11-20'] = { energy: 4, rest: false, builtAt: '', checkedIn: true, tasks: [task('y', 'Planned on the phone', 'admin', 20)] }; });
  const undone = K.undoAi(res.undo);
  after = JSON.parse(localStorage.getItem('myday.data.v4'));
  check('Undo after another device changed something else (another day): today\'s plan goes back, and their change is kept', undone === 'undone' && after.days['2026-11-20'] && after.days['2026-11-20'].tasks[0].title === 'Planned on the phone' && eq(after.days[k].tasks.map(x => x.uid), ['a', 'b']) && after.days[k].tasks[0].minutes === 30, undone);
  ({ k, data } = day(`${D}T09:00`, 3, [task('a', 'Course', 'learning', 30), task('b', 'Cook', 'admin', 45)]));
  r = K.checkProposal(reply({ priorities: [pr('a', 20)] }), data, k);
  const st0 = K.planStamp(data, k);
  otherTab(o => { o.context[k].energy = 1; });
  theirs = localStorage.getItem('myday.data.v4');
  res = K.applyAi(k, st0, r.proposal);
  check('Using a suggestion after another device changed today\'s energy: refused ("stale"), their change kept', !res.ok && res.reason === 'stale' && localStorage.getItem('myday.data.v4') === theirs);
  ({ k, data } = day(`${D}T09:00`, 3, [task('a', 'Course', 'learning', 30), task('b', 'Cook', 'admin', 45)]));
  r = K.checkProposal(reply({ rest: true }), data, k);
  res = K.applyAi(k, K.planStamp(data, k), r.proposal);
  check('rest: today becomes a rest day (as "Swap for a rest day" does), energy kept', res.ok && K.getSnapshot().data.days[k].rest && K.getSnapshot().data.days[k].energy === 3);
  ({ k, data } = day(`${D}T09:00`, 3, [task('a', 'Course', 'learning', 30, { done: true }), task('b', 'Cook', 'admin', 45)]));
  r = K.checkProposal(reply({ rest: true }), data, k);
  res = K.applyAi(k, K.planStamp(data, k), r.proposal);
  check('rest with something already done: the done task stays, the rest waits in the queue', res.ok && !K.getSnapshot().data.days[k].rest && K.getSnapshot().data.days[k].tasks.length === 1 && K.getSnapshot().data.queue.some(q => q.title === 'Cook'));
  ({ k, data } = day(`${D}T09:00`, 3, THREE()));
  r = K.checkProposal(reply({ priorities: [pr('a', 20)] }), data, k);
  const saved = localStorage.getItem('myday.data.v4');
  const realSet = localStorage.setItem;
  localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  res = K.applyAi(k, K.planStamp(data, k), r.proposal);
  localStorage.setItem = realSet;
  check('if the browser can\'t save (storage full), it says so and nothing changes', !res.ok && res.reason === 'not-saved' && localStorage.getItem('myday.data.v4') === saved && K.getSnapshot().data.days[k].tasks.length === 3);
  K.boot();
  check('after a reload (start-up), the saved plan is exactly what was saved', localStorage.getItem('myday.data.v4') === saved);

  console.log('\n[4] The instructions and the mock planner');
  ({ k, data } = day(`${D}T09:00`, 2, THREE()));
  ctx = K.buildContext(data, k, 'I slept badly');
  const msgs = K.buildMessages(ctx);
  check('one system message with the rules, then the context as JSON (date, time zone, note)', msgs.length === 2 && /maxPriorities/.test(msgs[0].content) && /Rest is always a valid choice/.test(msgs[0].content) && msgs[1].content.includes('"timezone":"Europe/London"') && msgs[1].content.includes('I slept badly'));
  const good = K.checkProposal(K.mockPlanner(ctx, 'good'), data, k);
  check('the mock planner follows the rules', good.violations.length === 0 && good.proposal.priorities.length === 1 && good.proposal.priorities[0].minutes <= 20);
  const sloppy = K.checkProposal(K.mockPlanner(ctx, 'sloppy'), data, k);
  check('its rule-breaking version is caught on every count', ['too-many', 'unknown-task', 'too-long', 'pressure-language'].every(c => codes(sloppy).includes(c)) && sloppy.proposal.priorities.length === 1, codes(sloppy));
  check('…and its non-JSON version gives no suggestion', K.checkProposal(K.mockPlanner(ctx, 'invalid'), data, k).proposal === null);

  console.log('\n[5] The model adapter (a fake provider; no network)');
  const seen = [];
  const fake = (status, body, delay = 0) => async (url, init) => { seen.push({ url, init }); await new Promise(r => setTimeout(r, delay)); if (init.signal.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' }); return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }); };
  const cfg = { provider: 'openai-compatible', label: 'Test', model: 'test-model', baseUrl: 'https://provider.example/v1/', apiKey: 'sk-test', temperature: 0.2, maxOutputTokens: 300, timeoutMs: 200, extraBody: { enable_thinking: false }, priceInPerMTok: 0.4, priceOutPerMTok: 1.2 };
  let m = await K.callModel(cfg, ctx, fake(200, { choices: [{ message: { content: reply({}) } }], usage: { prompt_tokens: 900, completion_tokens: 40 } }));
  const req0 = JSON.parse(seen[0].init.body);
  check('an OpenAI-style request: the model, the two messages, JSON output, a length cap and model-specific fields', seen[0].url === 'https://provider.example/v1/chat/completions' && req0.model === 'test-model' && req0.messages.length === 2 && req0.response_format.type === 'json_object' && req0.max_tokens === 300 && req0.enable_thinking === false);
  check('the key goes only in the Authorization header', seen[0].init.headers.Authorization === 'Bearer sk-test' && !seen[0].init.body.includes('sk-test'));
  check('the reply text and token counts come back; the cost is worked out from the prices', m.ok && m.inputTokens === 900 && m.outputTokens === 40 && Math.abs(K.costUsd(cfg, 900, 40) - (900 * 0.4 + 40 * 1.2) / 1e6) < 1e-12);
  check('a worst-case cost can be worked out before calling (for the budget)', K.worstCaseCostUsd(cfg, ctx) > 0 && K.worstCaseCostUsd({ ...cfg, priceInPerMTok: null }, ctx) === null);
  m = await K.callModel(cfg, ctx, fake(500, 'oops'));
  check('a server error is reported (no reply text)', !m.ok && m.error === 'http' && m.status === 500);
  m = await K.callModel(cfg, ctx, fake(200, { choices: [{ message: { content: '' } }] }));
  check('an empty reply is reported', !m.ok && m.error === 'empty');
  m = await K.callModel(cfg, ctx, fake(200, {}, 400));
  check('a slow provider is cut off at the time limit', !m.ok && m.error === 'timeout');
  const cut = reply({ priorities: [pr('a', 20)] }).slice(0, 40);
  m = await K.callModel(cfg, ctx, fake(200, { choices: [{ message: { content: cut }, finish_reason: 'length' }], usage: { prompt_tokens: 900, completion_tokens: 300 } }));
  check('a reply cut off at the length limit (finish_reason "length"): unsuccessful, no text — its billed tokens still reported', !m.ok && m.error === 'truncated' && !('text' in m) && m.outputTokens === 300 && m.finishReason === 'length');
  m = await K.callModel(cfg, ctx, fake(200, { choices: [{ message: { content: cut }, finish_reason: 'model_context_window_exceeded' }] }));
  check('…also when the context window ran out (Z.ai)', !m.ok && m.error === 'truncated');
  m = await K.callModel(cfg, ctx, fake(200, { choices: [{ message: { content: reply({}) }, finish_reason: 'sensitive' }] }));
  check('a filtered reply (finish_reason "sensitive" / "content_filter"): unsuccessful', !m.ok && m.error === 'filtered' && !(await K.callModel(cfg, ctx, fake(200, { choices: [{ message: { content: reply({}) }, finish_reason: 'content_filter' }] }))).ok);
  m = await K.callModel(cfg, ctx, fake(200, { choices: [{ message: { content: reply({}) }, finish_reason: 'network_error' }] }));
  check('a provider-side failure (finish_reason "network_error"): unsuccessful', !m.ok && m.error === 'network');
  m = await K.callModel(cfg, ctx, fake(200, { choices: [{ message: { content: reply({}) }, finish_reason: 'tool_calls' }] }));
  check('any other finish (e.g. "tool_calls"): unsuccessful', !m.ok && m.error === 'incomplete');
  m = await K.callModel(cfg, ctx, fake(200, { choices: [{ message: { content: '', reasoning_content: 'Thinking about the plan…' }, finish_reason: 'stop' }], usage: { prompt_tokens: 900, completion_tokens: 120, completion_tokens_details: { reasoning_tokens: 120 } } }));
  check('reasoning but an empty final answer: unsuccessful ("empty"), with the reasoning tokens reported', !m.ok && m.error === 'empty' && m.reasoningTokens === 120 && m.outputTokens === 120);
  m = await K.callModel(cfg, ctx, fake(200, { choices: [{ message: { content: reply({}) }, finish_reason: 'stop' }], usage: { prompt_tokens: 900, completion_tokens: 40, total_tokens: 1100, completion_tokens_details: { reasoning_tokens: 160 } } }));
  check('reasoning tokens are reported, and billed output is never less than the total says', m.ok && m.reasoningTokens === 160 && m.outputTokens === 200 && m.finishReason === 'stop');
  m = await K.callModel(cfg, ctx, fake(200, { choices: [{ message: { content: cut }, finish_reason: 'stop' }] }));
  const half = K.checkProposal(m.text, data, k);
  check('JSON that stops half-way (even with "stop"): no suggestion, so nothing can be saved', m.ok && half.proposal === null && half.violations[0].code === 'not-json');
  m = await K.callModel(cfg, ctx, fake(400, { error: { code: 'InvalidParameter', message: 'max_completion_tokens is not supported; key sk-test rejected', type: 'invalid_request_error' } }));
  check('a refused request: the provider\'s message is kept (to diagnose it), with the key blanked out', !m.ok && m.error === 'http' && m.status === 400 && /InvalidParameter/.test(m.detail) && /max_completion_tokens/.test(m.detail) && !m.detail.includes('sk-test'), m.detail);
  m = await K.callModel({ ...cfg, apiKey: '' }, ctx, fake(200, {}));
  check('without a key, nothing is sent', !m.ok && m.error === 'config');
  await K.callModel({ ...cfg, maxTokensField: 'max_completion_tokens' }, ctx, fake(200, { choices: [{ message: { content: reply({}) } }] }));
  let b = JSON.parse(seen[seen.length - 1].init.body);
  check('Qwen-style: the reply cap as max_completion_tokens, thinking off', b.max_completion_tokens === 300 && !('max_tokens' in b) && b.enable_thinking === false);
  check('…and the instructions mention JSON (Qwen needs that for JSON output)', /JSON/.test(K.SYSTEM_PROMPT));
  await K.callModel({ ...cfg, jsonMode: false, extraBody: { thinking: { type: 'enabled' }, reasoning_effort: 'low' }, maxOutputTokens: 2048 }, ctx, fake(200, { choices: [{ message: { content: reply({}) } }] }));
  b = JSON.parse(seen[seen.length - 1].init.body);
  check('GLM-style: thinking kept on at low effort, a bigger cap, JSON mode can be left off', b.thinking.type === 'enabled' && b.reasoning_effort === 'low' && b.max_tokens === 2048 && !('response_format' in b));

  console.log('\n[6] The evaluation: live runs only on purpose, within budget, and no keys in the results');
  const run = await import(pathToFileURL(await bundle(path.join(ROOT, 'ai-eval/run.ts'), path.join(os.tmpdir(), `myday-aieval-${process.pid}`))).href);
  const fails = async fn => { try { await fn(); return ''; } catch (e) { return e.message; } };
  let calls = 0;
  const fakeProvider = require('http').createServer((req, res) => {
    let b = '';
    req.on('data', c => { b += c; });
    req.on('end', () => {
      calls++;
      const c = JSON.parse(JSON.parse(b).messages[1].content.replace(/^[^\n]*\n/, ''));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ choices: [{ message: { content: K.mockPlanner(c, 'good') } }], usage: { prompt_tokens: 1000, completion_tokens: 50 } }));
    });
  });
  await new Promise(r => fakeProvider.listen(0, '127.0.0.1', r));
  const fakeModel = { label: 'Fake provider', provider: 'openai-compatible', model: 'fake-1', baseUrl: `http://127.0.0.1:${fakeProvider.address().port}`, keyEnv: 'FAKE_KEY', priceInPerMTok: 100, priceOutPerMTok: 100, maxOutputTokens: 300 };
  const base = { modelIds: ['fake'], repeats: 3, scenarioIds: null, env: { FAKE_KEY: 'secret-key-123' }, models: { fake: fakeModel }, log: () => {} };
  check('a real model is never called without --live', /add --live/.test(await fails(() => run.evaluate({ ...base, live: false, budgetUsd: 1 }))));
  check('…or without a budget', /needs a budget/.test(await fails(() => run.evaluate({ ...base, live: true, budgetUsd: null }))));
  check('…or without its key in the environment', /needs its key/.test(await fails(() => run.evaluate({ ...base, live: true, budgetUsd: 1, env: {} }))));
  check('…or without prices (so the budget can be enforced)', /needs its prices/.test(await fails(() => run.evaluate({ ...base, live: true, budgetUsd: 1, models: { fake: { ...fakeModel, priceOutPerMTok: null } } }))));
  const ws = { ...fakeModel, baseUrl: fakeModel.baseUrl + '/{WorkspaceId}', urlVars: { WorkspaceId: 'FAKE_WS' } };
  check('…or without the workspace id its address needs', /FAKE_WS/.test(await fails(() => run.evaluate({ ...base, live: true, budgetUsd: 1, models: { fake: ws } }))));
  let lastPath = '';
  fakeProvider.on('request', req => { lastPath = req.url; });
  await run.evaluate({ ...base, live: true, budgetUsd: 0.2, repeats: 1, scenarioIds: ['s01-energy-1'], models: { fake: ws }, env: { FAKE_KEY: 'secret-key-123', FAKE_WS: 'ws-123' } });
  check('the workspace id fills in the address', lastPath === '/ws-123/chat/completions', lastPath);
  await run.evaluate({ ...base, live: true, budgetUsd: 0.2, repeats: 1, scenarioIds: ['s01-energy-1'], models: { fake: { ...ws, baseUrlEnv: 'FAKE_BASE' } }, env: { FAKE_KEY: 'secret-key-123', FAKE_BASE: fakeModel.baseUrl + '/shared' } });
  check('…or a whole address from the environment replaces it (then no workspace id is needed)', lastPath === '/shared/chat/completions', lastPath);
  calls = 0;
  const live = await run.evaluate({ ...base, live: true, budgetUsd: 0.5 });
  check('an expensive (fake) model: the run stops before going over its budget', live.meta.stoppedForBudget && live.meta.spentUsd <= 0.5 && live.runs.some(r => r.outcome === 'skipped-budget') && calls === live.runs.filter(r => r.outcome !== 'skipped-budget').length, live.meta);
  const all = JSON.stringify(live) + run.summary(live) + run.review(live);
  check('the results hold no key and no prompt (only made-up scenario content and numbers)', !all.includes('secret-key-123') && !all.includes('Rules (the app checks'));
  check('no call is retried: one request per scenario, model and repeat', live.meta.retries === 0 && calls === live.runs.filter(x => x.reservedUsd !== null).length);
  check('unknown scenario names are refused (no silent empty run)', /Unknown scenario "s99"/.test(await fails(() => run.evaluate({ ...base, live: true, budgetUsd: 1, scenarioIds: ['s99'] }))));
  // A total ceiling across runs, from the ledger of earlier calls.
  const cheap = { ...fakeModel, priceInPerMTok: 0.4, priceOutPerMTok: 1.6, maxOutputTokens: 600 };
  const ledger = [];
  calls = 0;
  let tr = await run.evaluate({ ...base, live: true, repeats: 1, scenarioIds: ['s04-good-day', 's08-after-night-shift'], budgetUsd: 0.05, totalBudgetUsd: 0.5, spentBeforeUsd: 0, models: { fake: cheap }, onCall: c => ledger.push(c) });
  check('each live call goes in the ledger as it happens: set aside before, counted after (the cost estimated from reported token usage)', ledger.length === 2 && calls === 2 && ledger.every(c => c.counted === 'usage' && c.countedUsd > 0 && c.countedUsd <= c.reservedUsd && c.model === 'fake'), ledger);
  const sum0 = run.summary(tr);
  check('the report says "estimated cost from reported token usage" (never "actual" spending)', /Estimated cost from reported token usage/.test(sum0) && !/actual(ly)? (cost|spen)/i.test(sum0 + run.calls(tr)) && tr.meta.usageUsd > 0 && tr.meta.reservedUsd === 0);
  const one = ledger[0].reservedUsd;
  calls = 0;
  tr = await run.evaluate({ ...base, live: true, repeats: 1, scenarioIds: ['s04-good-day', 's08-after-night-shift'], budgetUsd: 0.05, totalBudgetUsd: 0.5, spentBeforeUsd: 0.5 - one - 0.0002, models: { fake: cheap } });
  check('the total ceiling: a run stops before a call whose reserved cost is more than what\'s left overall', calls === 1 && tr.runs[1].outcome === 'skipped-budget' && tr.meta.stoppedForBudget && tr.meta.spentBeforeUsd + tr.meta.spentUsd <= 0.5, tr.meta);
  check('…and a ceiling already used up refuses to start', /used up/.test(await fails(() => run.evaluate({ ...base, live: true, budgetUsd: 0.05, totalBudgetUsd: 0.5, spentBeforeUsd: 0.5, models: { fake: cheap } }))));
  // The original reply and the corrected proposal are scored separately.
  const sloppyProvider = require('http').createServer((req, res) => {
    let b = ''; req.on('data', c => { b += c; });
    req.on('end', () => {
      const c = JSON.parse(JSON.parse(b).messages[1].content.replace(/^[^\n]*\n/, ''));
      const ids = c.tasks.filter(x => !x.done).map(x => x.id);
      const content = c.date === '2026-11-10' && c.now === '14:30' ? JSON.stringify({ rest: false, priorities: ids.map(id => ({ taskId: id, minutes: 45, start: '16:00' })), explanation: 'Do both.', missing: [] })
        : JSON.stringify({ rest: false, priorities: [{ taskId: 'not-a-task', minutes: 10, start: null }], explanation: 'x', missing: [] });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(c.now === '09:00' ? { choices: [{ message: { content: '{"rest": false, "priorities": [' }, finish_reason: 'length' }], usage: { prompt_tokens: 900, completion_tokens: 600 } }
        : { choices: [{ message: { content }, finish_reason: 'stop' }], usage: { prompt_tokens: 900, completion_tokens: 60 } }));
    });
  });
  await new Promise(r => sloppyProvider.listen(0, '127.0.0.1', r));
  const sloppyModel = { ...cheap, baseUrl: `http://127.0.0.1:${sloppyProvider.address().port}` };
  tr = await run.evaluate({ ...base, live: true, repeats: 1, scenarioIds: ['s08-after-night-shift', 's04-good-day'], budgetUsd: 0.05, models: { fake: sloppyModel } });
  const s08 = tr.runs.find(x => x.scenario === 's08-after-night-shift'), s04 = tr.runs.find(x => x.scenario === 's04-good-day');
  check('the original reply is scored as the model sent it (too long, on top of the appointment)…', s08.outcome === 'ok' && s08.expectRaw.fitsTime === false && s08.expectRaw.avoidsBusy === false && s08.violations.includes('time-conflict') && s08.violations.includes('too-many'), s08);
  check('…the corrected proposal separately (what you\'d see), with the corrections listed', s08.expectFinal.fitsTime === true && s08.expectFinal.avoidsBusy === true && s08.adjusted.length > 0 && s08.violationDetails.some(d => /^time-conflict: /.test(d)), s08);
  check('a reply cut off at the length limit: unsuccessful ("truncated"), no expectations met, nothing saved', s04.outcome === 'error' && /^truncated/.test(s04.error) && s04.finishReason === 'length' && s04.savedSafely === null && Object.values(s04.expectRaw).every(v => v === false) && s04.outputTokens === 600, s04);
  tr = await run.evaluate({ ...base, live: true, repeats: 2, scenarioIds: ['s04-good-day'], budgetUsd: 0.05, stopOnFailure: true, models: { fake: sloppyModel } });
  check('--stop-on-failure: after an unsuccessful generation, that model isn\'t called again in the run', tr.runs.length === 2 && tr.runs[0].outcome === 'error' && tr.runs[1].outcome === 'skipped-failure');
  const report = run.summary(tr) + run.calls(tr);
  check('the report lists unsuccessful generations and every call (finish reason, tokens incl. reasoning)', /## Unsuccessful generations/.test(report) && /truncated/.test(report) && /\| length \|/.test(report) && /not called \(after a failure\)/.test(report));
  sloppyProvider.close();
  // No connection: a closed port (nothing listening), so every call fails to connect.
  const closed = require('http').createServer(); await new Promise(r => closed.listen(0, '127.0.0.1', r)); const deadPort = closed.address().port; await new Promise(r => closed.close(r));
  tr = await run.evaluate({ ...base, live: true, repeats: 1, scenarioIds: ['s01-energy-1', 's02-energy-2-20min', 's03-poor-sleep', 's04-good-day', 's05-day-shift-morning'], budgetUsd: 0.05, models: { fake: { ...cheap, baseUrl: `http://127.0.0.1:${deadPort}` } } });
  check('no connection: the run stops after 3 calls in a row that couldn\'t reach a provider (the rest aren\'t called or counted)', tr.meta.stoppedForConnection && tr.runs.filter(x => x.outcome === 'error').length === 3 && tr.runs.filter(x => x.outcome === 'skipped-connection').length === 2 && Math.abs(tr.meta.spentUsd - tr.runs.reduce((a, x) => a + (x.reservedUsd || 0), 0)) < 1e-6, tr.meta);
  check('…and says why each failed (e.g. ECONNREFUSED), to tell this side\'s network from the provider\'s', tr.runs[0].error === 'network' && /ECONNREFUSED/.test(tr.runs[0].errorDetail || ''), tr.runs[0]);
  check('calls that reported no usage keep their reservation, shown apart from the estimated cost (until provider billing resolves them)', tr.meta.usageUsd === 0 && tr.meta.reservedUsd > 0 && /Reserved for 3 call\(s\) that reported no usage, and kept until provider billing shows what they cost/.test(run.summary(tr)));
  // The tone filter flags a word wherever it is; without the original wording, a flag stays unverified.
  const toneRun = await run.evaluate({ ...base, live: false, budgetUsd: null, repeats: 1, scenarioIds: ['s01-energy-1'], modelIds: ['m'], models: { m: { label: 'Mock', provider: 'mock', model: 'mock:sloppy', priceInPerMTok: 0, priceOutPerMTok: 0 } } });
  const toned = toneRun.runs[0];
  check('the model\'s original reply is kept with the results (made-up scenarios only), so flags can be checked', typeof toned.originalReply === 'string' && toned.originalReply.length > 20 && toned.violations.includes('pressure-language') && /tone flag: ".+" \(original kept in runs\.json\)/.test(run.calls(toneRun)));
  const oldRun = JSON.parse(JSON.stringify(toneRun)); oldRun.runs[0].originalReply = null;
  check('…and a tone flag without the original wording is marked unverified (as in results saved before it was kept)', /tone flag: ".+" \(unverified: original wording not kept\)/.test(run.calls(oldRun)) && /1 of these 1 flag\(s\) are unverified/.test(run.summary(oldRun)) && /tone flag, unverified/.test(run.review(oldRun)));
  const est = run.estimate({ ...base, repeats: 3, scenarioIds: null, models: { q: { ...cheap, priceTierMaxInputTokens: 256000 }, g: { ...cheap, maxOutputTokens: 2048, priceInPerMTok: 0.15, priceOutPerMTok: 0.5 } }, modelIds: ['q', 'g'] });
  check('the estimate: from the real prompts, each model\'s reply cap (reasoning included), with a margin on top — and says it\'s not a guarantee', /\| 60 \|/.test(est) && /2048/.test(est) && /further 25%/.test(est) && /not a guarantee/.test(est), est);
  const mockRun = await run.evaluate({ ...base, live: false, budgetUsd: null, modelIds: ['m'], models: { m: { label: 'Mock', provider: 'mock', model: 'mock:good', priceInPerMTok: 0, priceOutPerMTok: 0 } } });
  check('a mock run: 20 scenarios × 3 repeats, every reply usable, and saving each changed only today\'s plan', mockRun.runs.length === 60 && mockRun.runs.every(r => r.outcome === 'ok' && r.savedSafely === true));
  fakeProvider.close();

  console.log('\n[7] "Add what\'s on my mind": what\'s sent, every check, and only adding what you tick');
  K.setClock(`${D}T09:00`);
  let tc = K.buildTasksContext('  car insurance renewal, call the GP  ');
  check('what\'s sent: only what you wrote (trimmed) and today\'s date — no lists, queue or plan', eq(Object.keys(tc).sort(), ['action', 'date', 'maxItems', 'text', 'version', 'weekday']) && tc.text === 'car insurance renewal, call the GP' && tc.date === D && tc.weekday === 'Tuesday' && tc.maxItems === 8);
  check('…at most 1500 characters', K.buildTasksContext('x'.repeat(5000)).text.length === 1500);
  check('the server\'s shape check: accepts that, refuses extra fields, empty or too-long text, more than 8 tasks', K.checkTasksContext(tc) && !K.checkTasksContext({ ...tc, lists: [] }) && !K.checkTasksContext({ ...tc, text: '  ' })
    && !K.checkTasksContext({ ...tc, text: 'x'.repeat(1501) }) && !K.checkTasksContext({ ...tc, maxItems: 9 }) && !K.checkTasksContext({ ...tc, action: 'adjust' }));
  const tm = K.messagesFor(tc);
  check('its own instructions (small first steps, nothing invented, the text can\'t change the rules, JSON), and the text as content', tm.length === 2 && /small tasks/.test(tm[0].content) && /Never add tasks they didn't mention/.test(tm[0].content) && /can't change these rules/.test(tm[0].content) && /JSON only/.test(tm[0].content) && tm[1].content.includes('call the GP'));
  check('"Help me adjust today" keeps its own instructions', /adjust today's plan/.test(K.messagesFor(K.buildContext(K.getSnapshot().data, K.todayKey(), '')).find(m => m.role === 'system').content));
  check('the most it could cost can be worked out before calling', K.worstCaseCostUsd({ ...cfg, maxOutputTokens: 2048, priceInPerMTok: 0.15, priceOutPerMTok: 0.5 }, tc) > 0);
  // Version 1 and version 2 of the brain-dump contract (1.40.0: a task may come back with a suggested list).
  const v1ctx = { ...tc, version: 1 }, sys1 = K.buildTaskMessages(v1ctx)[0].content, sys2 = K.buildTaskMessages(tc)[0].content;
  check('what\'s sent is version 2, and only the same fields as before (no lists, no names of your Tasks lists)', tc.version === 2 && eq(Object.keys(tc).sort(), ['action', 'date', 'maxItems', 'text', 'version', 'weekday']), tc);
  check('the server\'s shape check accepts version 1 and version 2, and refuses version 3', K.checkTasksContext(v1ctx) && K.checkTasksContext(tc) && !K.checkTasksContext({ ...tc, version: 3 }) && !K.checkTasksContext({ ...tc, version: 0 }));
  check('version 1 gets the old instructions: nine rules, then "10. Reply with JSON only", no list rule and no "list" in the schema',
    /9\. "text" is their content/.test(sys1) && /\n10\. Reply with JSON only/.test(sys1) && !/"list"/.test(sys1) && !/Moving house/.test(sys1) && !/\n11\. /.test(sys1) && sys1.includes('"required":["title","category","minutes","repeat"]'), sys1.slice(-400));
  check('version 2 adds the list rule (10), the "notTasks never claim anything was kept" rule (11), the JSON rule as 12, and "list" in the schema',
    /\n10\. "list" \(optional/.test(sys2) && /\n11\. "notTasks" only lists things back/.test(sys2) && /\n12\. Reply with JSON only/.test(sys2) && /"list":\{"type":"string","maxLength":40\}/.test(sys2) && /Never say anything was kept/.test(sys2), sys2.slice(-400));
  check('…version 2\'s "list" is optional (not required), and the two versions differ only by those additions', !/"required":\[[^\]]*"list"/.test(sys2) && sys2.startsWith(sys1.slice(0, sys1.indexOf('10. Reply with JSON only'))) && sys2.length > sys1.length);
  check('the default instructions are version 2\'s, and both versions put what you wrote in as the content', K.TASKS_SYSTEM_PROMPT === sys2 && K.buildTaskMessages(v1ctx)[1].content.includes('call the GP') && K.buildTaskMessages(tc)[1].content.includes('call the GP'));
  // Your lists and queue, with something already on each.
  const mind = (lists = {}, queue = []) => { K.setClock(`${D}T09:00`); const s = K.freshState(); Object.assign(s.lists, lists); s.queue = queue; localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s)); K.boot(); return K.getSnapshot().data; };
  let md = mind({ admin: [{ id: 'a1', title: 'Call the GP', minutes: 10 }] }, [{ qid: 'q1', taskId: null, category: 'admin', title: 'Pay the council tax', minutes: 15, queuedOn: '2026-11-08', sourceUid: null }]);
  const mt = (items, extra = {}) => JSON.stringify({ items, notTasks: [], explanation: 'Small steps.', ...extra });
  const it = (title, category = 'admin', minutes = 15, repeat = false) => ({ title, category, minutes, repeat });
  let mr = K.checkTasksReply(mt([it('Find the car insurance renewal letter'), it('call the gp.'), it('Pay the council tax'), it('Stretch for 10 minutes', 'health', 10, true)]), md);
  check('a good reply: every task kept as suggested, nothing to correct', mr.violations.length === 0 && mr.proposal.items.length === 4 && mr.proposal.items[3].repeat === true && mr.proposal.items[0].already === null);
  check('…a task already on a list or in the queue is marked (whatever the wording), so it starts unticked', mr.proposal.items[1].already === 'your Admin list' && mr.proposal.items[2].already === 'your queue');
  const mgood = K.checkTasksReply(K.mockTasks(K.buildTasksContext("car insurance renewal\ncall the GP\nI'm so tired this week\nstretch every morning"), 'good'), md);
  check('the practice helper follows the rules; a feeling isn\'t made into a task (listed back instead); "every morning" repeats', mgood.violations.length === 0 && mgood.proposal.items.length === 3 && mgood.proposal.notTasks.length === 1 && mgood.proposal.items.find(x => /stretch/i.test(x.title)).repeat === true, mgood);
  const msloppy = K.checkTasksReply(K.mockTasks(K.buildTasksContext('car insurance renewal, call the GP'), 'sloppy'), md);
  check('its rule-breaking version is caught on every count: a repeated task, a made-up list, too long, a non-true/false repeat, a long name, pushy wording',
    ['repeated-item', 'bad-category', 'bad-minutes', 'bad-repeat', 'long-title', 'pressure-language'].every(c => msloppy.violations.some(v => v.code === c)), msloppy.violations.map(v => v.code));
  check('…and corrected: put in Admin, 120 minutes at most, one-off, the name shortened, a gentle explanation', msloppy.proposal.items.every(x => x.category === 'admin' && x.minutes === 120 && x.repeat === false && x.title.length <= 80) && !/should|fall behind/.test(msloppy.proposal.explanation) && msloppy.proposal.adjusted.length > 0);
  mr = K.checkTasksReply(mt(Array.from({ length: 11 }, (_, i) => it(`Task number ${i + 1}`))), md);
  check('more than 8 tasks: the first 8 kept, the rest listed back as not added (nothing silently lost)', mr.proposal.items.length === 8 && mr.proposal.notTasks.includes('Task number 9') && mr.proposal.notTasks.includes('Task number 11') && mr.violations.some(v => v.code === 'too-many'));
  check('not JSON, or no list of tasks: nothing to add', K.checkTasksReply('Sure! Do the laundry.', md).proposal === null && K.checkTasksReply('{"tasks": []}', md).proposal === null);
  mr = K.checkTasksReply(mt([{ title: '', category: 'admin', minutes: 10, repeat: false }, it('- 1. Book the dentist')]), md);
  check('a task without a name is left out; bullets and numbers are taken off names', mr.proposal.items.length === 1 && mr.proposal.items[0].title === 'Book the dentist' && mr.violations.some(v => v.code === 'bad-item'));
  // Saving.
  md = mind({ admin: [{ id: 'a1', title: 'Call the GP', minutes: 10 }] });
  const before7 = JSON.parse(localStorage.getItem('myday.data.v4'));
  let ar = K.applyMind([{ title: 'Find the car insurance renewal letter', category: 'admin', minutes: 15, repeat: false }, { title: 'Stretch for 10 minutes', category: 'health', minutes: 10, repeat: true }]);
  let after7 = JSON.parse(localStorage.getItem('myday.data.v4'));
  const qd = after7.queue.find(q => q.title === 'Find the car insurance renewal letter');
  check('adding: a one-off goes to the queue (no list of its own, dated today), a repeating one to the end of its list', ar.ok && qd && qd.taskId === null && qd.queuedOn === D && qd.category === 'admin' && qd.minutes === 15 && after7.lists.health[after7.lists.health.length - 1].title === 'Stretch for 10 minutes');
  check('…through the checked save path, and nothing else changes (other lists, days, context, Study, Health, Finance)', after7.saves.seq === before7.saves.seq + 1 && eq(after7.lists.admin, before7.lists.admin) && eq(after7.lists.learning, before7.lists.learning) && eq(after7.days, before7.days) && eq(after7.context, before7.context) && eq(after7.study, before7.study) && eq(after7.health, before7.health) && eq(after7.finance, before7.finance));
  check('…with a plain message', ar.message === 'Added 2 tasks: 1 to your queue, 1 to your lists.', ar.message);
  const planned = K.chooseTasks(K.getSnapshot().data, D, 3);
  check('the planner then picks the one-off from the queue when the day is built (within the energy rule)', planned.some(t => t.title === 'Find the car insurance renewal letter' && t.fromQueue && t.fromQueue.qid === qd.qid), planned.map(t => t.title));
  let ur = K.undoMind(ar.undo);
  after7 = JSON.parse(localStorage.getItem('myday.data.v4'));
  check('Undo takes back exactly what was added', ur.result === 'undone' && eq(after7.lists, before7.lists) && eq(after7.queue, before7.queue));
  ar = K.applyMind([{ title: 'Book the dentist', category: 'health', minutes: 10, repeat: false }, { title: 'Water the plants', category: 'admin', minutes: 5, repeat: true }]);
  K.update(d => { d.queue[0].title = 'Book the dentist for Friday'; });
  otherTab(o => { o.lists.learning.push({ id: 'l-phone', title: 'Added on the phone', minutes: 20 }); });
  ur = K.undoMind(ar.undo);
  after7 = JSON.parse(localStorage.getItem('myday.data.v4'));
  check('…but never a task you\'ve changed since (it stays), nor anything added meanwhile on another device', ur.result === 'partly' && ur.kept === 1 && after7.queue.some(q => q.title === 'Book the dentist for Friday') && !after7.lists.admin.some(x => x.title === 'Water the plants') && after7.lists.learning.some(x => x.title === 'Added on the phone'), { ur });
  mind({ admin: [{ id: 'a1', title: 'Call the GP', minutes: 10 }] });
  ar = K.applyMind([{ title: 'call the GP', category: 'admin', minutes: 10, repeat: false }]);
  check('a task that\'s already there (added meanwhile, here or on another device) isn\'t added twice', !ar.ok && ar.reason === 'nothing' && JSON.parse(localStorage.getItem('myday.data.v4')).queue.length === 0);
  check('nothing ticked: nothing to save', K.applyMind([]).ok === false);
  mind();
  const saved7 = localStorage.getItem('myday.data.v4');
  const realSet7 = localStorage.setItem;
  localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  ar = K.applyMind([{ title: 'Book the dentist', category: 'health', minutes: 10, repeat: false }]);
  localStorage.setItem = realSet7;
  check('if the browser can\'t save (storage full), it says so and nothing changes', !ar.ok && ar.reason === 'not-saved' && localStorage.getItem('myday.data.v4') === saved7);

  // Suggested lists (1.40.0): checked on the reply, matched to your Tasks lists on this device.
  const mindL = (items = [], lists = [{ id: 'tlE', name: 'Errands' }, { id: 'tlM', name: 'Moving house' }]) => {
    K.setClock(`${D}T09:00`); const s = K.freshState(); s.tasks = { lists, items }; s.queue = [];
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s)); K.boot(); return K.getSnapshot().data;
  };
  const itL = (title, list, extra = {}) => ({ ...it(title), ...(list === undefined ? {} : { list }), ...extra });
  const readNow = () => JSON.parse(localStorage.getItem('myday.data.v4'));
  let ml = mindL();
  let lr = K.checkTasksReply(mt([itL('Post the parcel', 'errands'), itL('Book a van', 'My moving houses'), itL('Pack the books', ' Moving   house '), itL('Call the GP')]), ml);
  check('a suggested list is matched to your own Tasks list whatever the capitals, "my" or a plural "s" ("errands" → Errands, "My moving houses" → Moving house)',
    lr.violations.length === 0 && lr.proposal.items[0].listId === 'tlE' && lr.proposal.items[1].listId === 'tlM' && lr.proposal.items[2].listId === 'tlM' && lr.proposal.items[3].list === null && lr.proposal.items[3].listId === null, lr.proposal.items);
  check('…and K.sameList says the same of those names', K.sameList('errands') === K.sameList('Errands') && K.sameList('My moving houses') === K.sameList('Moving house') && K.sameList('Garden') !== K.sameList('Errands'));
  lr = K.checkTasksReply(mt([itL('Book a van', 'Moving house'), itL('Pack the books', 'moving house'), itL('Clear the shed', 'Garden')]), ml);
  check('a list name that matches none of yours stays a new name (no listId); the same new name twice is one list', lr.proposal.items[0].listId === 'tlM' && lr.proposal.items[2].list === 'Garden' && lr.proposal.items[2].listId === null, lr.proposal.items);
  lr = K.checkTasksReply(mt([itL('Book a van', 'Moving 😀 house'), itL('Pack the books', '123 !!!'), itL('Clear the shed', 'You must do this now'), itL('Call the GP', 'Errands')]), ml);
  check('a list with an emoji, no letters or pushy wording is dropped with "bad-list" (the task stays, with no list); a good one is kept',
    lr.proposal.items.length === 4 && lr.proposal.items.slice(0, 3).every(x => x.list === null && x.listId === null) && lr.violations.filter(v => v.code === 'bad-list').length === 3 && lr.proposal.items[3].listId === 'tlE', lr);
  lr = K.checkTasksReply(mt([itL('Water the plants', 'Garden', { repeat: true }), itL('Post the parcel', 'Errands')]), ml);
  check('a list on a repeating task is ignored, with a plain line saying it goes on its category\'s list', lr.proposal.items[0].list === null && lr.proposal.items[0].repeat === true && lr.proposal.adjusted.some(a => /Water the plants/.test(a) && /repeats/.test(a) && /Garden/.test(a)) && lr.proposal.items[1].listId === 'tlE', lr.proposal);
  lr = K.checkTasksReply(mt([itL('Clear the shed', 'Garden'), itL('Cut the hedge', 'garden'), itL('Plan the trip', 'Holiday'), itL('Book the hotel', 'Wedding'), itL('Choose a venue', 'Holiday'), itL('Post the parcel', 'Errands')]), ml);
  check('at most two NEW list names in one reply: a third is dropped with "too-many-lists" and its task is kept without a list (a repeat of a new name, and your own lists, don\'t count)',
    lr.proposal.items.map(x => x.list).join('|') === 'Garden|Garden|Holiday||Holiday|Errands' && lr.violations.filter(v => v.code === 'too-many-lists').length === 1 && lr.proposal.items[3].title === 'Book the hotel' && lr.proposal.adjusted.some(a => /Book the hotel/.test(a) && /no list/.test(a)), lr);
  lr = K.checkTasksReply(mt([itL('Book a van', 'M'.repeat(60))]), ml);
  check('a 60-character list name is cut to 40 characters', lr.proposal.items[0].list.length <= 40 && lr.proposal.items[0].list.length >= 30, lr.proposal.items[0].list);
  lr = K.checkTasksReply(mt([itL('Book a van', 5), itL('Pack the books', '')]), ml);
  check('a list that isn\'t text, and an empty one, give no list', lr.proposal.items.every(x => x.list === null), lr);
  // The practice helper.
  const mocktx = { ...K.buildTasksContext('Moving house: book a van, pack the books\nCall the GP') };
  const mk2 = K.checkTasksReply(K.mockTasks(mocktx, 'good'), ml), mk1 = K.checkTasksReply(K.mockTasks({ ...mocktx, version: 1 }, 'good'), ml);
  check('the practice helper (version 2) gives "Moving house" to both tasks after the heading, and nothing to the one on its own line', mk2.violations.length === 0 && mk2.proposal.items.length === 3 && mk2.proposal.items.filter(x => x.listId === 'tlM').length === 2 && mk2.proposal.items.find(x => /GP/.test(x.title)).list === null, mk2.proposal.items);
  check('…and at version 1 it gives no list at all', mk1.proposal.items.length === 3 && mk1.proposal.items.every(x => x.list === null) && !/"list"/.test(K.mockTasks({ ...mocktx, version: 1 }, 'good')));
  check('…and never a list to a repeating task', (() => { const its = JSON.parse(K.mockTasks(K.buildTasksContext('Garden: stretch every morning, cut the hedge'), 'good')).items; return its.find(x => /stretch/i.test(x.title)).repeat === true && !('list' in its.find(x => /stretch/i.test(x.title))) && its.find(x => /hedge/i.test(x.title)).list === 'Garden'; })());
  // A Tasks item with the same open title counts as already there.
  const own = (title, x = {}) => ({ id: 'tk' + title.length, title, listId: 'tlE', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: `${D}T08:00`, postponed: 0, blockers: [], letGoOn: null, ...x });
  ml = mindL([own('Post the parcel'), own('Renew the passport', { done: true, doneOn: D })]);
  lr = K.checkTasksReply(mt([it('post the parcel.'), it('Renew the passport')]), ml);
  check('a task already open in Tasks is marked "your tasks" (whatever the wording); a ticked-off one isn\'t', lr.proposal.items[0].already === 'your tasks' && lr.proposal.items[1].already === null, lr.proposal.items);
  // Saving into Tasks.
  const CH = (title, x = {}) => ({ title, category: 'admin', minutes: 20, repeat: false, ...x });
  ml = mindL([own('Post the parcel')], [{ id: 'tlE', name: 'Errands' }]);
  const bq = readNow();
  ar = K.applyMind([CH('Book a van', { inList: { name: 'Moving house' }, minutes: 30, category: 'admin' }), CH('Pack the books', { inList: { name: 'Moving house' }, category: 'health', minutes: 45 })]);
  let al = readNow();
  const mh = al.tasks.lists.filter(l => l.name === 'Moving house');
  const inMh = al.tasks.items.filter(t => mh[0] && t.listId === mh[0].id);
  check('two one-offs sent to the same new name make ONE new list "Moving house"', ar.ok && al.tasks.lists.length === 2 && mh.length === 1, al.tasks.lists);
  check('…each goes into it as a Tasks item with its category and minutes and no date, and the queue is unchanged', inMh.length === 2 && inMh.find(t => t.title === 'Book a van').minutes === 30 && inMh.find(t => t.title === 'Pack the books').category === 'health' && inMh.find(t => t.title === 'Pack the books').minutes === 45 && inMh.every(t => t.due === null && t.time === null && !t.done && t.plannedOn === null) && eq(al.queue, bq.queue), inMh);
  check('…and the message says where they went', ar.message === 'Added 2 tasks: 2 to “Moving house” (a new list in Tasks).', ar.message);
  check('…through the checked save path, and nothing else changes (lists, days, existing Tasks, Study)', al.saves.seq === bq.saves.seq + 1 && eq(al.lists, bq.lists) && eq(al.days, bq.days) && eq(al.study, bq.study) && al.tasks.items.some(t => t.title === 'Post the parcel') && al.tasks.items.length === 3);
  ur = K.undoMind(ar.undo);
  al = readNow();
  check('Undo removes both tasks and the new list, leaving Tasks as it was', ur.result === 'undone' && eq(al.tasks, bq.tasks) && eq(al.queue, bq.queue), { ur, tasks: al.tasks });
  // Into one of your own lists, by id, and by a name that matches one.
  ml = mindL();
  const bq2 = readNow();
  ar = K.applyMind([CH('Buy stamps', { inList: { id: 'tlE' } })]);
  al = readNow();
  check('a one-off with the id of one of your Tasks lists goes into it; no new list is made', ar.ok && al.tasks.lists.length === 2 && al.tasks.items.length === 1 && al.tasks.items[0].listId === 'tlE' && al.tasks.items[0].title === 'Buy stamps' && ar.message === 'Added 1 task: 1 to “Errands” in Tasks.', [ar.message, al.tasks]);
  ur = K.undoMind(ar.undo);
  check('…Undo removes the task and leaves your list', ur.result === 'undone' && readNow().tasks.items.length === 0 && readNow().tasks.lists.length === 2);
  ml = mindL();
  ar = K.applyMind([CH('Buy stamps', { inList: { name: 'ERRANDS' } }), CH('Pack the books', { inList: { name: 'my moving house' } })]);
  al = readNow();
  check('a new name that matches one of yours (other capitals, "my") reuses that list: no new list, tasks in the right lists', ar.ok && al.tasks.lists.length === 2 && al.tasks.items.find(t => t.title === 'Buy stamps').listId === 'tlE' && al.tasks.items.find(t => t.title === 'Pack the books').listId === 'tlM' && ar.undo.lists.length === 0, [ar.message, al.tasks.lists]);
  ur = K.undoMind(ar.undo);
  check('…and Undo then leaves both of your lists in place', ur.result === 'undone' && readNow().tasks.lists.length === 2 && readNow().tasks.items.length === 0);
  // A mix: one into a new list, one to the queue (no list), one repeating (to its category list).
  ml = mindL();
  ar = K.applyMind([CH('Book a van', { inList: { name: 'Moving house' } }), CH('Call the GP', { inList: null }), CH('Stretch', { category: 'health', repeat: true, inList: { name: 'Moving house' } })]);
  al = readNow();
  check('with no list a one-off goes to the queue, and a repeating task goes to its list even if a list was named', ar.ok && al.queue.some(q => q.title === 'Call the GP') && al.lists.health.some(x => x.title === 'Stretch') && al.tasks.items.length === 1 && ar.message === 'Added 3 tasks: 1 to “Moving house” in Tasks, 1 to your queue, 1 to your lists.', ar.message);
  // 30 lists already.
  const thirty = Array.from({ length: 30 }, (_, i) => ({ id: 'tl' + i, name: 'List number ' + i }));
  ml = mindL([], thirty);
  ar = K.applyMind([CH('Book a van', { inList: { name: 'Moving house' } })]);
  al = readNow();
  check('with 30 lists already, a new list isn\'t made: the task goes to the queue and the message says so', ar.ok && al.tasks.lists.length === 30 && al.tasks.items.length === 0 && al.queue.some(q => q.title === 'Book a van') && /Tasks has 30 lists already, so one went to your queue instead\./.test(ar.message), [ar.message, al.queue]);
  // Undo after changes.
  ml = mindL();
  ar = K.applyMind([CH('Book a van', { inList: { name: 'Moving house' } }), CH('Pack the books', { inList: { name: 'Moving house' } })]);
  K.update(d => { d.tasks.items.find(t => t.title === 'Book a van').title = 'Book a van for Friday'; d.tasks.items.find(t => t.title === 'Pack the books').done = true; d.tasks.items.find(t => t.title === 'Pack the books').doneOn = D; });
  ur = K.undoMind(ar.undo);
  al = readNow();
  check('Undo keeps a task you\'ve since renamed or ticked, and then keeps the list too (it isn\'t empty)', ur.result === 'partly' && ur.kept === 2 && al.tasks.items.length === 2 && al.tasks.lists.some(l => l.name === 'Moving house'), { ur, tasks: al.tasks });
  ml = mindL();
  ar = K.applyMind([CH('Book a van', { inList: { name: 'Moving house' } }), CH('Pack the books', { inList: { name: 'Moving house' } })]);
  K.update(d => { d.tasks.items.find(t => t.title === 'Pack the books').plannedOn = D; d.tasks.items.find(t => t.title === 'Pack the books').planUid = 'u1'; });
  ur = K.undoMind(ar.undo);
  al = readNow();
  check('…a task already taken onto a day\'s plan stays too (and the list with it); the other one goes', ur.result === 'partly' && al.tasks.items.length === 1 && al.tasks.items[0].title === 'Pack the books' && al.tasks.lists.some(l => l.name === 'Moving house'), { ur, tasks: al.tasks });
  ml = mindL();
  ar = K.applyMind([CH('Book a van', { inList: { name: 'Moving house' } })]);
  K.update(d => { d.tasks.lists.find(l => l.name === 'Moving house').name = 'House move'; });
  ur = K.undoMind(ar.undo);
  al = readNow();
  check('Undo removes the task but keeps a list you\'ve renamed', al.tasks.items.length === 0 && al.tasks.lists.some(l => l.name === 'House move'), { ur, lists: al.tasks.lists });
  ml = mindL([own('Book a van')]);
  ar = K.applyMind([CH('book a van', { inList: { name: 'Moving house' } })]);
  check('a task whose title is already open in Tasks isn\'t added again, and no empty list is made for it', !ar.ok && ar.reason === 'nothing' && readNow().tasks.lists.length === 2);

  // The evaluation, for this action too.
  const mockM = v => ({ label: 'Mock ' + v, provider: 'mock', model: 'mock:' + v, priceInPerMTok: 0, priceOutPerMTok: 0 });
  const tasksRun = await run.evaluate({ ...base, live: false, budgetUsd: null, action: 'tasks', modelIds: ['g', 's'], models: { g: mockM('good'), s: mockM('sloppy') } });
  check('the evaluation runs the 20 brain-dump scenarios × 3 with their own instructions; adding everything suggested only ever adds to the lists, the queue and Tasks',
    tasksRun.runs.length === 120 && tasksRun.runs.every(x => x.outcome === 'ok' && x.savedSafely === true) && tasksRun.meta.promptVersion === 'myday-tasks-v2' && tasksRun.meta.scenarios === 20, tasksRun.runs.filter(x => x.savedSafely !== true).slice(0, 2));
  const metS = k => tasksRun.runs.filter(x => x.model === 's').flatMap(x => Object.values(x[k])).filter(Boolean).length;
  check('…its rule-breaking helper is scored separately on its own replies and after MyDay\'s corrections', metS('expectRaw') < metS('expectFinal'), [metS('expectRaw'), metS('expectFinal')]);
  const both = await run.evaluate({ ...base, live: false, budgetUsd: null, repeats: 1, scenarioIds: ['s04-good-day', 't03-feelings'], modelIds: ['g'], models: { g: mockM('good') } });
  check('scenarios of both kinds can be named together', both.runs.length === 2 && both.meta.promptVersion === 'myday-adjust-v1 + myday-tasks-v2' && /Written: “I'm exhausted/.test(run.review(both)));
  check('the cost estimate covers brain dumps too', /\| 20 \|/.test(run.estimate({ ...base, repeats: 1, action: 'tasks', scenarioIds: null, modelIds: ['q'], models: { q: { ...cheap, maxOutputTokens: 2048 } } })));

  console.log('\n[8] AI help with notes: what\'s sent, every check on a reply, and linking only what\'s still unplaced');
  K.setClock(`${D}T09:00`);
  const CP = (id, title, summary, status = 'active') => ({ id, title, summary, stage: 'explore', status, nextTaskId: null, commitmentIds: [], createdAt: `${D}T08:00`, updatedAt: `${D}T08:00` });
  const CN = (id, text, x = {}) => ({ id, categoryId: '', title: '', text, pinned: false, createdAt: `${D}T08:00`, updatedAt: `${D}T08:00`, ...x });
  const notesWorld = () => {
    const w = K.freshState();
    w.projects.items = [CP('pjPod', 'Start a podcast about nursing', 'Short episodes with nurses about shift work.'), CP('pjDone', 'Old project', 'Finished long ago', 'done')];
    w.notes.items = [CN('nA', 'Friday meeting with Sam about the podcast'), CN('nPriv', 'Private podcast budget', { private: true }), CN('nIn', 'Already filed', { projectId: 'pjPod' }),
      CN('nBlank', '  '), CN('nSure', 'Podcast episode ideas: interview nurses about night shifts'), CN('nSeen', 'Seen before'), CN('nW', 'Wifi password is in the kitchen drawer')];
    w.notes.items.find(n => n.id === 'nSeen').aiSeen = K.fingerprintNote(w.notes.items.find(n => n.id === 'nSeen'));
    return K.normalize(w);
  };
  let cw = notesWorld(), cx = K.connectContext(cw);
  check('what\'s sent: only notes MyDay can\'t place — not private ones, ones in a project, blank ones, ones the device places itself, or ones already looked at as they are',
    eq(cx.ctx.notes.map(n => n.id).sort(), ['nA', 'nW']), cx.ctx.notes.map(n => n.id));
  const quiet = notesWorld(); quiet.notes.items.find(n => n.id === 'nW').updatedAt = `${D}T08:57`; quiet.notes.items.find(n => n.id === 'nA').updatedAt = `${D}T08:55`;
  check('never the note you have open, nor one whose words changed in the last 5 minutes (time to make it private first)',
    eq(K.connectContext(cw, 'nA').ctx.notes.map(n => n.id), ['nW']) && eq(K.connectContext(quiet).ctx.notes.map(n => n.id), ['nA']), [K.connectContext(cw, 'nA')?.ctx.notes.map(n => n.id), K.connectContext(quiet)?.ctx.notes.map(n => n.id)]);
  check('…with only open projects (not done ones), each just its id, name and summary; nothing else', eq(cx.ctx.projects.map(p => p.id), ['pjPod']) && eq(Object.keys(cx.ctx.projects[0]).sort(), ['id', 'summary', 'title'])
    && eq(Object.keys(cx.ctx).sort(), ['action', 'notes', 'projects', 'version']) && eq(Object.keys(cx.ctx.notes[0]).sort(), ['id', 'text', 'title']));
  check('…and a fingerprint of each sent note, to know if it changes', cx.seen.nA === K.fingerprintNote(cw.notes.items.find(n => n.id === 'nA')) && /^[0-9a-f]{8}$/.test(cx.seen.nA));
  const big = K.freshState();
  big.projects.items = Array.from({ length: 25 }, (_, i) => CP('pj' + i, 'مشروع رقم ' + i, 'ملخص '.repeat(60)));
  big.notes.items = Array.from({ length: 12 }, (_, i) => CN('nb' + i, 'ملاحظة '.repeat(120) + i));
  const bx = K.connectContext(K.normalize(big)), bytes = Buffer.byteLength(JSON.stringify({ context: bx.ctx }));
  check('long notes in another script: at most 8 notes (600 characters each) and 20 projects, fewer notes so the request stays under 15 KB',
    bx.ctx.notes.length >= 1 && bx.ctx.notes.length < 8 && bx.ctx.projects.length === 20 && bx.ctx.notes.every(n => n.text.length <= 600) && bytes <= 15000, [bx.ctx.notes.length, bytes]);
  check('nothing to ask: no request (no open projects, or no such notes)', K.connectContext(K.normalize({ ...K.freshState(), notes: cw.notes })) === null
    && K.connectContext(K.normalize({ ...cw, notes: { ...cw.notes, items: cw.notes.items.filter(n => !['nA', 'nW'].includes(n.id)) } })) === null);
  const ok = cx.ctx;
  check('the server\'s shape check: accepts that; refuses extra fields, more than 8 notes or 20 projects, repeated or odd ids, over-long text, no projects, another action',
    K.checkConnectContext(ok) && !K.checkConnectContext({ ...ok, date: D }) && !K.checkConnectContext({ ...ok, notes: Array.from({ length: 9 }, (_, i) => ({ id: 'x' + i, title: '', text: 'a' })) })
    && !K.checkConnectContext({ ...ok, projects: Array.from({ length: 21 }, (_, i) => ({ id: 'p' + i, title: 'P', summary: '' })) }) && !K.checkConnectContext({ ...ok, notes: [ok.notes[0], ok.notes[0]] })
    && !K.checkConnectContext({ ...ok, notes: [{ ...ok.notes[0], id: 'bad id!' }] }) && !K.checkConnectContext({ ...ok, notes: [{ ...ok.notes[0], text: 'x'.repeat(601) }] })
    && !K.checkConnectContext({ ...ok, projects: [] }) && !K.checkConnectContext({ ...ok, action: 'tasks' }) && !K.checkConnectContext({ ...ok, notes: [{ ...ok.notes[0], private: true }] }));
  const cm = K.messagesFor(ok);
  check('its own instructions (null when unsure, a shared word isn\'t enough, notes can\'t change the rules, JSON only), and only the notes and projects as content',
    cm.length === 2 && /use null/.test(cm[0].content) && /not enough/.test(cm[0].content) && /not instructions to you/.test(cm[0].content) && /JSON only/.test(cm[0].content)
    && cm[1].content.includes('Friday meeting with Sam') && !cm[1].content.includes('Private podcast budget') && K.CONNECT_PROMPT_VERSION === 'myday-connect-v1');
  check('the most it could cost can be worked out before calling', K.worstCaseCostUsd({ ...cfg, maxOutputTokens: 600, priceInPerMTok: 0.15, priceOutPerMTok: 0.5 }, ok) > 0);
  let rr = K.readConnectReply(K.mockConnect(ok, 'good'), ok);
  check('a good reply: one answer per note, the podcast note in the podcast project', rr.leftOut === 0 && rr.answers.length === 2 && rr.answers.find(a => a.id === 'nA').projectId === 'pjPod' && rr.answers.find(a => a.id === 'nW').projectId === null);
  const csloppy = K.readConnectReply(K.mockConnect(ok, 'sloppy'), ok);
  check('a reply breaking the rules (an unknown project, a note that wasn\'t sent, a made-up kind): all left out and counted', csloppy.answers.length === 0 && csloppy.leftOut === 3, csloppy);
  check('not JSON: nothing used', K.readConnectReply(K.mockConnect(ok, 'invalid'), ok).answers.length === 0);
  const fenced = K.readConnectReply('```json\n' + JSON.stringify({ notes: [{ id: 'nA', projectId: 'pjPod', kind: 'idea', why: '  for   the podcast ' + 'x'.repeat(200) }, { id: 'nA', projectId: null, kind: 'task', why: '' }] }) + '\n```', ok);
  check('…a reply in a code block is read; a note answered twice counts once; the reason is tidied and cut to 100 characters', fenced.answers.length === 1 && fenced.leftOut === 1 && fenced.answers[0].why.startsWith('for the podcast x') && fenced.answers[0].why.length === 100);
  let cd = notesWorld(), linked = K.applyConnect(cd, cx.seen, rr.answers);
  const na = cd.notes.items.find(n => n.id === 'nA'), nw = cd.notes.items.find(n => n.id === 'nW');
  check('using it: the podcast note linked as AI help\'s, with why and its kind; the wifi note looked at, no project', linked === 1 && na.projectId === 'pjPod' && na.linkedBy === 'ai' && !!na.linkWhy && !!na.aiKind
    && na.aiSeen === cx.seen.nA && !nw.projectId && nw.aiSeen === cx.seen.nW && nw.aiKind === 'reference');
  check('…looked-at notes aren\'t sent again — until their words change', K.connectContext(cd) === null && (nw.text += ' (in the drawer by the door)', K.connectContext(K.normalize(cd)).ctx.notes.map(n => n.id).includes('nW')));
  cd = notesWorld(); cd.notes.items.find(n => n.id === 'nA').text = 'Changed while the AI was thinking';
  check('a note changed while waiting: not linked, and asked again later', K.applyConnect(cd, cx.seen, rr.answers) === 0 && !cd.notes.items.find(n => n.id === 'nA').aiSeen);
  cd = notesWorld(); cd.notes.items.find(n => n.id === 'nA').notProjects = ['pjPod'];
  check('a project you took the note out of: never linked (but the note counts as looked at)', K.applyConnect(cd, cx.seen, rr.answers) === 0 && !!cd.notes.items.find(n => n.id === 'nA').aiSeen);
  cd = notesWorld(); cd.notes.items.find(n => n.id === 'nA').projectId = 'pjDone';
  check('a note you put somewhere meanwhile: never moved', (K.applyConnect(cd, cx.seen, rr.answers), cd.notes.items.find(n => n.id === 'nA').projectId === 'pjDone' && !cd.notes.items.find(n => n.id === 'nA').linkedBy));
  cd = notesWorld(); cd.notes.items.find(n => n.id === 'nA').private = true;
  check('a note made private meanwhile: left alone', K.applyConnect(cd, cx.seen, rr.answers) === 0 && !cd.notes.items.find(n => n.id === 'nA').aiSeen);
  cd = notesWorld();
  check('a note the reply left out still counts as looked at (so it isn\'t sent again and again)', (K.applyConnect(cd, cx.seen, rr.answers.filter(a => a.id !== 'nW')), !!cd.notes.items.find(n => n.id === 'nW').aiSeen && !cd.notes.items.find(n => n.id === 'nW').aiKind));

  // Private projects in the request: a private case is offered like any private project — its name and summary only
  // (your choice, 18 Oct 2026: no special rule for cases); a case's timeline, evidence and issues are never sent.
  const privWorld = (extra) => { const w = notesWorld(); w.projects.items = [CP('pjCase', 'Dispute with the landlord', 'Deposit not returned'), CP('pjGen', 'Private plans', 'Kept to myself')]; Object.assign(w.projects.items[0], { template: 'case', case: { timeline: [{ id: 'tl1', date: '2026-06-01', about: false, title: 'Zanzibar meeting wording', details: '', source: 'mine', evidenceIds: [], issueIds: [], createdAt: '2026-06-01T09:00' }], evidence: [], issues: [] } }, extra.case); Object.assign(w.projects.items[1], extra.gen); return K.normalize(w); };
  const sentIds = w => K.connectContext(w).ctx.projects.map(p => p.id).sort();
  const pc = K.connectContext(privWorld({ case: { private: true }, gen: { private: true } }));
  check('a private case is among the projects AI help with notes is sent, like any private project: its name and summary only', eq(pc.ctx.projects.map(p => [p.id, p.title, p.summary]).sort(), [['pjCase', 'Dispute with the landlord', 'Deposit not returned'], ['pjGen', 'Private plans', 'Kept to myself']]), pc.ctx.projects);
  check('…and nothing of a case\'s timeline, evidence or issues is in the request', !JSON.stringify(pc.ctx).includes('Zanzibar'), JSON.stringify(pc.ctx).slice(0, 300));
  check('the same case, not private, is among them too', sentIds(privWorld({ case: {}, gen: {} })).includes('pjCase'), sentIds(privWorld({ case: {}, gen: {} })));

  console.log('\n[9] AI-written revision cards: what\'s sent, the checks on a reply, adding and Undo');
  const LS = 'lesson.lab-isolation';
  const cardsWorld = () => { K.setClock(`${D}T19:00`); const s = K.freshState(); localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s)); K.boot(); return K.getSnapshot().data; };
  let vw = cardsWorld();
  vw.study.concepts.push({ ...vw.study.concepts[0], id: 'cpMine', title: 'Mine', prompt: 'Why use a host-only network for a lab VM?', origin: { by: 'ai', subject: 'cybersecurity', lessonId: LS, writer: 'W', checker: 'C', edited: false } },
    { ...vw.study.concepts[0], id: 'cpOther', title: 'Other', prompt: 'A question about another lesson', origin: { by: 'ai', subject: 'cybersecurity', lessonId: 'lesson.tls-pki', writer: 'W', checker: 'C', edited: false } });
  let cc = K.cardsContext(vw, LS, ['Course check one?', 'Course check one?  ', 'x'.repeat(300)]);
  check('what\'s sent: the lesson, ten cards, and the questions you already have for it (the course\'s, then your AI cards for this lesson only), once each, cut to 240 characters',
    eq(Object.keys(cc).sort(), ['action', 'count', 'curriculumVersion', 'existing', 'lessonId', 'version']) && cc.action === 'cards' && cc.lessonId === LS && cc.count === 10
    && eq(cc.existing, ['Course check one?', 'x'.repeat(240), 'Why use a host-only network for a lab VM?']) && K.checkCardsContext(cc), cc.existing);
  check('…at most 40 questions', K.cardsContext(vw, LS, Array.from({ length: 60 }, (_, i) => `Question number ${i}?`)).existing.length === 40);
  const W1 = { kind: 'written', prompt: 'What does a snapshot let you do before a risky lab exercise?', answer: 'Return the VM to a known good state afterwards.', explanation: 'A snapshot records the VM\'s disk and settings so you can roll back.' };
  const C1 = { kind: 'choice', prompt: 'Which network mode keeps a VM off the internet?', choices: ['NAT', 'Host-only', 'Bridged'], correct: 1, answer: 'Host-only', explanation: 'NAT and bridged both reach outside.' };
  const out = (cards, verdicts, x = {}) => JSON.stringify({ lessonId: LS, cards, verdicts, leftOut: 0, ...x });
  const keep = n => Array.from({ length: n }, (_, index) => ({ index, verdict: 'keep', reason: 'Correct.' }));
  let rc = K.readCardsReply(out([W1, C1], keep(2)), cc);
  check('a reply the checker kept: both cards, each with the checker\'s reason', rc.cards.length === 2 && rc.cards[1].reason === 'Correct.' && rc.checkerLeftOut === 0 && rc.leftOut === 0 && rc.repeats === 0);
  rc = K.readCardsReply(out([W1, C1], [{ index: 0, verdict: 'drop', reason: 'Wrong.' }]), cc);
  check('only cards the checker kept: one it dropped and one it gave no verdict are both left out', rc.cards.length === 0 && rc.checkerLeftOut === 2);
  rc = K.readCardsReply(out([{ ...C1, answer: 'NAT' }, { ...C1, prompt: 'Two right options?', choices: ['A', 'a', 'B'] }, { ...W1, explanation: 'x'.repeat(401) }, { ...W1, kind: 'essay' }], keep(4)), cc);
  check('cards the app can\'t trust are left out even if kept: an answer that isn\'t the marked option, repeated options, too long, unknown kind', rc.cards.length === 0 && rc.leftOut === 4);
  rc = K.readCardsReply(out([{ ...W1, prompt: 'Why use a host-only network for a lab VM?' }, { ...W1, prompt: 'Why use a host-only network for a lab VM, please?' }, W1, { ...W1, prompt: W1.prompt.toUpperCase() }], keep(4)), cc);
  check('repeats are left out: of a question you have (exactly or nearly), or of another card in the reply', rc.cards.length === 1 && rc.repeats === 3 && rc.cards[0].prompt === W1.prompt);
  rc = K.readCardsReply(out([{ ...W1, prompt: 'Which port does HTTPS use by default?' }, { ...W1, prompt: 'Which port does SSH use by default?' }, { ...W1, prompt: 'Why use a host-only network for an isolated lab VM?' }], keep(3)), cc);
  check('…but questions about different things aren\'t repeats, however alike their wording', rc.cards.length === 2 && rc.repeats === 1 && rc.cards[1].prompt.includes('SSH'));
  check('a reply for another lesson, not JSON, no verdicts, or more than ten cards: nothing',
    K.readCardsReply(out([W1], keep(1), { lessonId: 'lesson.tls-pki' }), cc) === null && K.readCardsReply('Here are your cards!', cc) === null
    && K.readCardsReply(JSON.stringify({ lessonId: LS, cards: [W1] }), cc) === null && K.readCardsReply(out(Array(11).fill(W1), keep(11)), cc) === null);
  vw = cardsWorld();
  const before9 = JSON.stringify({ ...vw, study: { ...vw.study, concepts: null } });
  let seq = [0, 0], ids = K.addAiCards(vw, [W1, C1], { lessonId: LS, lessonTitle: 'Isolate a lab', writer: 'GLM-5.3-Flash', checker: 'Gemini 3.8 Flash' }, D, () => seq.shift() ?? 0.5);
  const [aw, ac] = ids.map(id => vw.study.concepts.find(c => c.id === id));
  check('adding: one concept per card, with your words untouched, due tomorrow, never revised yet',
    ids.length === 2 && aw.kind === 'written' && aw.prompt === W1.prompt && aw.answer === W1.answer && aw.explanation === W1.explanation && aw.review.due === '2026-11-11' && aw.review.reps === 0 && eq(aw.taskIds, []));
  check('…a multiple-choice card\'s options in a fresh order, still marking the same option', ac.kind === 'choice' && ac.choices.slice().sort().join() === C1.choices.slice().sort().join() && ac.choices[ac.correct] === 'Host-only' && ac.answer === 'Host-only' && ac.choices.join() !== C1.choices.join(), ac.choices);
  check('…where it came from, as data (origin) and in words (source)', eq(aw.origin, { by: 'ai', subject: 'cybersecurity', lessonId: LS, writer: 'GLM-5.3-Flash', checker: 'Gemini 3.8 Flash', edited: false })
    && aw.source === 'AI-written for the Cybersecurity lesson “Isolate a lab” by GLM-5.3-Flash, checked by Gemini 3.8 Flash · 10 Nov 2026', aw.source);
  check('…a long question is shortened for its title only', K.addAiCards(vw, [{ ...W1, prompt: 'Why '.repeat(50) + '?' }], { lessonId: LS, lessonTitle: 'L', writer: 'W', checker: 'C' }, D).length === 1 && vw.study.concepts.at(-1).title.length === 120 && vw.study.concepts.at(-1).title.endsWith('…') && vw.study.concepts.at(-1).prompt.length === 201);
  check('…and nothing else in MyDay changes', JSON.stringify({ ...vw, study: { ...vw.study, concepts: null } }) === before9);
  check('they\'re part of Cybersecurity\'s revision as well as all of Study\'s', K.aiCyberCards(vw).length === 3 && K.dueIds(vw, '2026-11-11', 'cybersecurity').includes(aw.id) && K.dueIds(vw, '2026-11-11').includes(ac.id) && !K.dueIds(vw, D, 'cybersecurity').includes(aw.id));
  const kept = K.normalize(JSON.parse(JSON.stringify(vw))).study.concepts.find(c => c.id === aw.id);
  check('saving and loading again keeps where each card came from', eq(kept.origin, aw.origin));
  const bent = JSON.parse(JSON.stringify(vw));
  bent.study.concepts.find(c => c.id === aw.id).origin = { by: 'someone', lessonId: LS };
  bent.study.concepts.find(c => c.id === ac.id).origin = { by: 'ai', subject: 'cybersecurity', lessonId: '../../etc', writer: 'W', checker: 'C' };
  check('…an origin that isn\'t right is left off, keeping the card (its source still says it was AI-written)', K.normalize(bent).study.concepts.filter(c => ids.includes(c.id)).every(c => !('origin' in c) && c.source.startsWith('AI-written')));
  // From 1.19.1: origins for other subjects (cards from a note, later ones) are kept as short plain values.
  const NOTE_O = { by: 'ai', subject: 'note', noteId: 'ntAbc123', flaggedKept: 1, fromLines: 'all but 2', writer: 'W', checker: 'C', edited: false };
  const odd = JSON.parse(JSON.stringify(vw));
  odd.study.concepts.push({ ...aw, id: 'cpNote', origin: NOTE_O },
    { ...aw, id: 'cpOdd', origin: { by: 'ai', subject: 'pdf', fileName: 'x'.repeat(300), nested: { a: 1 }, list: [1], 'bad key': 'x', n: Infinity, ...Object.fromEntries(Array.from({ length: 15 }, (_, i) => ['f' + i, i])) } },
    { ...aw, id: 'cpBad', origin: { by: 'ai', subject: 'Not A Word!', noteId: 'x' } });
  const on = K.normalize(odd).study.concepts, oo = on.find(c => c.id === 'cpOdd').origin;
  check('a note card\'s origin is kept exactly as written (fields in the same order)', JSON.stringify(on.find(c => c.id === 'cpNote').origin) === JSON.stringify(NOTE_O), on.find(c => c.id === 'cpNote').origin);
  check('…another subject\'s: text cut to 200 characters, at most 12 extra fields, only plain values with plain names', oo.subject === 'pdf' && oo.fileName.length === 200 && !('nested' in oo) && !('list' in oo) && !('bad key' in oo) && !('n' in oo)
    && Object.keys(oo).filter(k => !['by', 'subject', 'writer', 'checker', 'edited'].includes(k)).length === 12 && oo.writer === '' && oo.edited === false, oo);
  check('…a subject that isn\'t a plain word: origin left off, card kept', !('origin' in on.find(c => c.id === 'cpBad')) && on.some(c => c.id === 'cpBad'));
  check('…and a note card isn\'t counted in Cybersecurity\'s revision', !K.aiCyberCards(K.normalize(odd)).some(c => c.id === 'cpNote'));
  vw.study.concepts.push({ ...aw, id: 'cpYours', origin: undefined });
  check('Undo takes out those cards only: not your own concepts, not other AI cards', K.removeAiCards(vw, ids) && !vw.study.concepts.some(c => ids.includes(c.id)) && vw.study.concepts.some(c => c.id === 'cpYours') && K.aiCyberCards(vw).length === 1 && !K.removeAiCards(vw, ids));

  console.log('\n[10] Cards from your notes: the note as lines, what\'s sent, the checks on each reply, adding');
  {
    const nl = K.noteLines({ title: 'DNS', text: 'DNS turns names into addresses.\n\n   \n- DHCP hands out leases.\n' + 'A long paragraph sentence one. '.repeat(12).trim() });
    check('a note becomes its non-blank lines, a long paragraph split into its sentences', 'lines' in nl && nl.lines[0] === 'DNS turns names into addresses.' && nl.lines[1] === '- DHCP hands out leases.' && nl.lines.length === 14 && nl.lines.every(l => l.length <= 300), nl);
    check('…an empty note, one too long for one check, or a sentence too long to number: said, not sent',
      K.noteLines({ title: 'x', text: ' \n ' }).problem === 'empty' && K.noteLines({ title: '', text: Array.from({ length: 61 }, (_, i) => 'Line ' + i).join('\n') }).problem === 'too-long'
      && K.noteLines({ title: '', text: 'x'.repeat(5000) + '\n' + 'y'.repeat(1200) }).problem === 'long-sentence');
    const NLINES = ['DNS turns names into addresses.', 'ARP finds the IP for a MAC address.', 'Ask Sam about the router.', 'NAT lets devices share one public address.'];
    const nck = K.noteCheckContext({ title: '  DNS notes ' }, NLINES);
    check('the check sends just the note: its title and numbered lines (the server would accept it)', eq(Object.keys(nck).sort(), ['action', 'note', 'version']) && nck.note.title === 'DNS notes' && eq(nck.note.lines, NLINES) && K.checkNoteCheckContext(nck));
    const flags = K.readNoteCheck(JSON.stringify({ flags: [{ line: 2, concern: 'wrong', reason: 'ARP finds the MAC address for an IP address.' }, { line: 9, concern: 'wrong', reason: 'no such line' }, { line: 2, concern: 'unclear', reason: 'twice' }, { line: 4, concern: 'odd', reason: 'Fine really.' }, { line: 1, reason: '' }] }), NLINES);
    check('its reply: flags on real lines only, one per line, with a reason; an unknown concern becomes "unclear"', eq(flags.map(f => [f.line, f.concern]), [[2, 'wrong'], [4, 'unclear']]), flags);
    check('…not JSON, or no list of flags: nothing', K.readNoteCheck('Line 2 is wrong', NLINES) === null && K.readNoteCheck('{"lines": []}', NLINES) === null);
    let nw = (() => { K.setClock(`${D}T19:00`); const s0 = K.freshState(); localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s0)); K.boot(); return K.getSnapshot().data; })();
    nw.study.concepts.push({ ...K.normalize(K.freshState()).study.concepts[0], id: 'cpN1', title: 'x', prompt: 'What does NAT let devices share?', origin: { by: 'ai', subject: 'note', noteId: 'ntA', writer: 'W', checker: 'C', edited: false } },
      { id: 'cpN2', title: 'y', prompt: 'A card from another note?', origin: { by: 'ai', subject: 'note', noteId: 'ntB', writer: 'W', checker: 'C', edited: false } });
    const { ctx: ncc, kept } = K.noteCardsContext(nw, { id: 'ntA', title: 'DNS notes' }, NLINES, [1, 3, 4]);
    check('the cards request: the lines you kept, each keeping its number (a left-out line sent as "(left out)", never its words), and the questions you already have from this note (not others)', eq(ncc.note.lines, [NLINES[0], '(left out)', NLINES[2], NLINES[3]]) && eq(kept, [1, 3, 4])
      && eq(ncc.existing, ['What does NAT let devices share?']) && ncc.count === 10 && K.checkNoteCardsContext(ncc), ncc);
    const NC = (prompt, from, x = {}) => ({ kind: 'written', prompt, answer: 'An answer.', explanation: 'Because the note says so.', from, ...x });
    const nrep = (cards, verdicts) => JSON.stringify({ cards, verdicts, leftOut: 0 });
    const nkeep = n => Array.from({ length: n }, (_, index) => ({ index, verdict: 'keep', reason: 'Correct and from the note.' }));
    let nr = K.readNoteCardsReply(nrep([NC('What does DNS turn names into?', [1]), NC('How many public addresses can devices share with NAT?', [4])], nkeep(2)), ncc, kept);
    check('a checked reply: each card says which of the note\'s lines it came from', nr.cards.length === 2 && eq(nr.cards[0].lines, [1]) && eq(nr.cards[1].lines, [4]) && nr.cards[0].reason === 'Correct and from the note.', nr);
    nr = K.readNoteCardsReply(nrep([NC('Q one about DNS names?', [1]), NC('Q two about a line that isn\'t there?', [7]), NC('Q three with no lines?', []), NC('Q four naming four lines?', [1, 2, 3, 1]), NC('Q five from the line you left out?', [2]), NC('What does NAT let devices share?', [4]), NC('Q seven the checker dropped?', [1])],
      [...nkeep(6), { index: 6, verdict: 'drop', reason: 'Not in the note.' }]), ncc, kept);
    check('…cards naming lines that aren\'t there, or none, or too many, or one you left out: left out; a repeat of a card you have left out; the checker\'s "drop" respected', nr.cards.length === 1 && nr.leftOut === 4 && nr.repeats === 1 && nr.checkerLeftOut === 1, nr);
    const nids = K.addNoteCards(nw, [{ ...NC('What does DNS turn names into?', [1]), reason: 'ok', lines: [1] }], { noteId: 'ntA', noteTitle: 'DNS notes', writer: 'Gemini 3.8 Flash', checker: 'GLM-5.3-Flash' }, D);
    const nc1 = nw.study.concepts.find(c => c.id === nids[0]);
    check('adding: a concept due tomorrow, saying it came from your note — in its origin and in words', nc1.review.due === '2026-11-11' && JSON.stringify(nc1.origin) === JSON.stringify({ by: 'ai', subject: 'note', noteId: 'ntA', writer: 'Gemini 3.8 Flash', checker: 'GLM-5.3-Flash', edited: false })
      && nc1.source === 'AI-written from your note “DNS notes” by Gemini 3.8 Flash, checked by GLM-5.3-Flash · 10 Nov 2026', nc1);
    check('…kept as it is when saved and loaded again, and not counted as a Cybersecurity card', JSON.stringify(K.normalize(JSON.parse(JSON.stringify(nw))).study.concepts.find(c => c.id === nids[0]).origin) === JSON.stringify(nc1.origin) && !K.aiCyberCards(nw).some(c => c.id === nids[0]));
    check('…and Undo takes it out again', K.removeAiCards(nw, nids) && !nw.study.concepts.some(c => c.id === nids[0]));

  }

  console.log('\n[11] Explanations you keep on a revision card (any kind)');
  {
    K.setClock(`${D}T19:00`); const s0 = K.freshState(); localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s0)); K.boot();
    const w = K.getSnapshot().data;
    w.study.concepts.push({ id: 'cpX', title: 'x', prompt: 'Q?', answer: 'A' }); w.cybersecurity.cards.push({ id: 'assessment.lab-isolation-check.q1', addedOn: D, review: { reps: 0, interval: 0, lapses: 0, due: null } });
    w.arabic.cards.push({ id: 'lexeme.arabic-seed-008:recognise', addedOn: D, review: { reps: 0, interval: 0, lapses: 0, due: null } });
    const AW = { text: '  Think of DNS as a phone book.  ', by: 'GLM-5.3-Flash', on: D };
    check('keeping one on a concept, a Cybersecurity check and an Arabic card (tidied), and reading it back', ['cpX', 'assessment.lab-isolation-check.q1', 'lexeme.arabic-seed-008:recognise'].every(id => K.keepAnotherWay(w, id, AW) && K.anotherWayOf(w, id).text === 'Think of DNS as a phone book.'));
    check('…keeping another replaces it (one per card)', K.keepAnotherWay(w, 'cpX', { ...AW, text: 'Another one.' }) && K.anotherWayOf(w, 'cpX').text === 'Another one.');
    check('…removing it leaves the card as it was; removing again, or on a card that isn\'t there, changes nothing', K.keepAnotherWay(w, 'cpX', null) && !('anotherWay' in w.study.concepts.find(c => c.id === 'cpX')) && !K.keepAnotherWay(w, 'cpX', null) && !K.keepAnotherWay(w, 'cpNope', AW));
    check('…and an empty one isn\'t kept', !K.keepAnotherWay(w, 'cpX', { ...AW, text: '   ' }) && K.anotherWayOf(w, 'cpX') === null);
  }

  console.log('\n[11b] "Check my answer": what\'s sent for a lesson check, the server\'s check of it, and the checks on a reply');
  {
    const AR = require(path.join(ROOT, 'content/teaching/arabic-fusha.json')).lessons, CY = require(path.join(ROOT, 'content/teaching/cybersecurity.json')).lessons;
    const mod = await K.loadArabicModule('module.arabic-clause-building'), answers = await K.loadArabicAnswers();
    const rel = mod.lessons.find(l => l.id === 'lesson.arabic-relative-clauses'), relQs = mod.assessments.find(a => a.id === rel.knowledge_check_id).questions;
    const q2 = relQs.find(q => q.id.endsWith('.q2'));
    const arSrc = K.arabicCheckSource(rel, q2, answers[q2.answer_key_id], AR[rel.id]);
    const ar = K.checkAnswerRequest(arSrc, '  The book.  ');
    const KEYS = ['version', 'action', 'subject', 'lessonId', 'objective', 'teaching', 'prerequisites', 'question', 'yourAnswer', 'reference', 'alsoCounts'];
    check('an Arabic check: the lesson\'s objectives, its teaching (explanation, worked example, the lesson\'s own example), the skills it builds on by name, the question, the reference answer, what also counts and your answer (trimmed) — nothing else',
      ar.ok && eq(Object.keys(ar.ctx), KEYS) && ar.ctx.subject === 'arabic' && ar.ctx.lessonId === 'lesson.arabic-relative-clauses' && ar.ctx.objective === rel.learning_objectives.join('\n')
      && ar.ctx.teaching.startsWith(AR[rel.id].explanation) && ar.ctx.teaching.includes('Worked example: ' + AR[rel.id].example) && ar.ctx.teaching.includes('Lesson example: ' + rel.example.text_ar)
      && ar.ctx.prerequisites.length > 0 && ar.ctx.prerequisites.every(p => !p.startsWith('skill.') && p.length > 8) && ar.ctx.question === q2.prompt && ar.ctx.reference === 'The book.'
      && ar.ctx.alsoCounts === answers[q2.answer_key_id].variation && ar.ctx.yourAnswer === 'The book.', ar.ok ? ar.ctx : ar);
    check('…and the server accepts exactly what the app sends', ar.ok && K.checkAnswerContext(ar.ctx));
    const cyQ = K.cyberActivities.get('assessment.learning-evidence-check').questions[1];
    const cySrc = K.cyberCheckSource('lesson.learning-evidence', cyQ, require(path.join(ROOT, 'app/src/study/cybersecurity/answers.json'))[cyQ.id], CY['lesson.learning-evidence']);
    const cy = K.checkAnswerRequest(cySrc, 'So you remember you weren\'t sure.');
    check('a Cybersecurity knowledge check: the same shape, the answer guide\'s answer as the reference, nothing "also counts", and the server accepts it',
      cy.ok && eq(Object.keys(cy.ctx), KEYS) && cy.ctx.subject === 'cybersecurity' && cy.ctx.reference === 'It identifies what must be checked rather than guessed.' && cy.ctx.alsoCounts === '' && !cy.ctx.teaching.includes('Lesson example') && K.checkAnswerContext(cy.ctx), cy);
    check('no source when the course has no reference answer (nothing is sent)', K.arabicCheckSource(rel, q2, undefined, null) === null && K.cyberCheckSource('lesson.learning-evidence', cyQ, undefined, null) === null && K.cyberCheckSource('lesson.missing', cyQ, 'x', null) === null);
    const empty = K.checkAnswerRequest(cySrc, '   '), secret = K.checkAnswerRequest(cySrc, 'I used password: hunter2xyz on the VM'), key = K.checkAnswerRequest(arSrc, 'AKIAABCDEFGHIJKLMNOP');
    check('an empty answer isn\'t sent ("Write your own answer first.")', !empty.ok && empty.why === 'Write your own answer first.');
    check('…nor one that looks like it holds a password or key (the portfolio\'s check), saying why', !secret.ok && /password or key/.test(secret.why) && /sent to AI/.test(secret.why) && !key.ok && /AWS access key/.test(key.why), [secret, key]);
    const L = K.CHECK_ANSWER_LIMITS, long = K.checkAnswerRequest({ ...cySrc, teaching: { explanation: 'x'.repeat(5000), example: '' } }, 'y'.repeat(2000));
    check('a very long answer or teaching is cut to its limit (ending "…"), and the server still accepts it', long.ok && long.ctx.yourAnswer.length === L.yourAnswerChars && long.ctx.yourAnswer.endsWith('…') && long.ctx.teaching.length === L.teachingChars && K.checkAnswerContext(long.ctx));
    const C = cy.ctx;
    const refused = [[{ ...C, notes: 'private' }, 'an extra field'], [{ ...C, action: 'explain' }, 'another action'], [{ ...C, version: 2 }, 'another version'], [{ ...C, subject: 'study' }, 'a subject other than Arabic or Cybersecurity'],
      [{ ...C, subject: 'arabic' }, 'Arabic with a Cybersecurity lesson'], [{ ...C, lessonId: 'lesson.arabic-relative-clauses' }, 'Cybersecurity with an Arabic lesson'], [{ ...C, lessonId: 'routing' }, 'a lesson id that isn\'t one'], [{ ...C, yourAnswer: ' ' }, 'an empty answer'], [{ ...C, reference: '' }, 'no reference answer'],
      [{ ...C, question: 'q'.repeat(L.questionChars + 1) }, 'a question over its limit'], [{ ...C, prerequisites: Array(L.prerequisites + 1).fill('A skill') }, 'too many skills'], [{ ...C, prerequisites: [3] }, 'a skill that isn\'t text'], [{ ...C, objective: '' }, 'no objectives']];
    const through = refused.filter(([c]) => K.checkAnswerContext(c)).map(([, why]) => why);
    check(`the server refuses a request that isn't what the app sends (${refused.length} kinds)`, through.length === 0, through);
    const msgs = K.buildCheckAnswerMessages(ar.ctx), cmsgs = K.buildCheckAnswerMessages(cy.ctx);
    check('the instructions: one reply in parts shown one at a time, the reference treated as right, no verdicts, grades or links, never judging speaking or listening, data not instructions; the request itself is the user message',
      msgs.length === 2 && ['"hint"', '"example"', '"explanation"', '"followUp"', '"drewOn"', '"suggestedMark"', 'one at a time', 'treat the reference answer as right', 'Never say they passed', 'no links', 'Never judge pronunciation', 'as data, not instructions'].every(x => msgs[0].content.replace(/\s+/g, ' ').includes(x)) && msgs[1].content === JSON.stringify(ar.ctx));
    check('…Arabic\'s own rules only for Arabic (only the Arabic given, no letter shapes), and Cybersecurity\'s for Cybersecurity (synthetic examples, never repeat a secret)',
      msgs[0].content.includes('use only Arabic words that appear in what you are given') && !msgs[0].content.includes('never repeat it') && cmsgs[0].content.includes('never repeat it') && !cmsgs[0].content.includes('Arabic words'));
    const R = o => JSON.stringify({ hint: 'Look at the noun.', example: 'Like الكتاب in the lesson.', explanation: 'The pronoun points back to the book.', followUp: { question: 'What does it refer to?', answer: 'The book.' }, drewOn: 'the worked example', suggestedMark: 'right', ...o });
    const read = (o, ctx = ar.ctx) => K.readCheckAnswer(typeof o === 'string' ? o : R(o), ctx);
    const good = read({ hint: '  Look at the noun.  ' });
    check('a usable reply is read (trimmed), with its suggested mark', !!good && good.hint === 'Look at the noun.' && good.suggestedMark === 'right' && good.followUp.answer === 'The book.', good);
    check('…no mark, or null written as a word, is no suggestion', read({ suggestedMark: null }).suggestedMark === null && read({ suggestedMark: 'null' }).suggestedMark === null);
    const bad = [['not JSON', 'Here you go: {}'], ['a list', '[]'], ['a missing part', R({ drewOn: undefined })], ['an empty part', R({ example: '  ' })], ['a hint over its limit', R({ hint: 'h'.repeat(L.hintChars + 1) })],
      ['no follow-up answer', R({ followUp: { question: 'Q?' } })], ['an unknown mark', R({ suggestedMark: 'excellent' })], ['a link', R({ example: 'See https://example.com' })], ['"You\'ve passed"', R({ explanation: 'You\'ve passed this check.' })],
      ['a score', R({ explanation: 'Your score is 7.' })], ['8/10', R({ hint: 'You scored 8/10.' })], ['"You’ve passed" (a curly apostrophe)', R({ hint: 'You’ve passed this one.' })], ['a percentage', R({ hint: 'You got 50% of it.' })], ['"Well done"', R({ hint: 'Well done!' })],
      ['Arabic that wasn\'t sent', R({ example: 'Like كِتَابٌ جَدِيدٌ.' })], ['a sent word with its vowel marks changed', R({ example: 'Like الْكِتَابِ in the lesson.' })],
      ['part of a sent word passed off as a word (قرأت from قرأته)', R({ example: 'The verb قرأت here.' })], ['presentation forms (ﻛﺘﺎﺑﻲ)', R({ example: 'Like ﻛﺘﺎﺑﻲ.' })],
      ['a word hidden by a zero-width joiner', R({ example: 'Like كت@u200Dابي.'.replace('@u200D', String.fromCharCode(0x200D)) })], ['a Persian letter', R({ example: 'Like پ.' })]];
    const taken = bad.filter(([, t]) => K.readCheckAnswer(t, ar.ctx)).map(([why]) => why);
    check(`replies that can't be used are refused (${bad.length} kinds: shape, limits, links, verdicts, Arabic that wasn't sent or was changed)`, taken.length === 0, taken);
    const given = ar.ctx.teaching.match(/[\u0621-\u064A][\u064B-\u0652\u0621-\u064A]*/g).find(w => /[\u064B-\u0652]/.test(w) && w.length > 4);
    const bare = given.replace(/[\u064B-\u0652\u0670]/g, '');
    check('…but a sent Arabic word written exactly, or with no vowel marks at all, is fine, and so is tatweel showing a suffix (ـه)', !!read({ example: `Like ${given}.` }) && !!read({ example: `Like ${bare}.` }) && !!read({ example: 'The suffix ـه is the pronoun.' }), [given, bare]);
    const affix = { ...ar.ctx, teaching: ar.ctx.teaching + ' إِذَا دَرَسْتَ، فَسَتَفْهَمُ.' };
    check('…a sent word\'s beginning or end drawn with the stretching line (فَسَـ, ـتَفْهَمُ) is fine, and a word without its article; not the same piece without the line', !!read({ example: 'The prefix فَسَـ and the ending ـتَفْهَمُ.' }, affix) && !!read({ example: 'Like كتاب.' }) && !read({ example: 'The piece فَسَ.' }, affix));
    check('…and the lesson\'s own phrase "not a score of technical competence" is not a verdict', !!read({ explanation: 'Confidence is not a score of technical competence.' }, cy.ctx));
    check('…nor "the flag you passed to chmod", "the disk is 90% full" or a range like 10.0.0.0/10 (Cybersecurity\'s own material)', ['The flag you passed to chmod matters.', 'The disk is 90% full.', 'A range like 10.0.0.0/10 is private-ish.'].every(t => !!read({ explanation: t }, cy.ctx)));
    check('…for Cybersecurity, Arabic in a reply is no concern of this check (only of Arabic\'s)', !!read({ example: 'Like كِتَابٌ.' }, cy.ctx));
    // Every real lesson check, with the longest answer allowed: what's sent fits the server's request limit.
    const longest = 'ل'.repeat(L.yourAnswerChars), sizes = [];
    for (const m of K.arabicModules) {
      const mc = await K.loadArabicModule(m.id);
      for (const l of mc.lessons) for (const q of mc.assessments.find(a => a.id === l.knowledge_check_id)?.questions ?? []) {
        const src = K.arabicCheckSource(l, q, answers[q.answer_key_id], AR[l.id]); if (!src) continue;
        const r = K.checkAnswerRequest(src, longest); if (r.ok) sizes.push(JSON.stringify({ context: r.ctx }).length);
      }
    }
    const cyAnswers = require(path.join(ROOT, 'app/src/study/cybersecurity/answers.json'));
    for (const l of K.cyberLessons.values()) for (const q of K.cyberActivities.get(l.knowledge_check_id)?.questions ?? []) {
      const src = K.cyberCheckSource(l.id, q, cyAnswers[q.id], CY[l.id]); if (!src) continue;
      const r = K.checkAnswerRequest(src, longest); if (r.ok) sizes.push(JSON.stringify({ context: r.ctx }).length);
    }
    check(`every real lesson check (${sizes.length}), with the longest answer allowed, fits the server's request limit (${K.REQUEST_LIMITS.bodyBytes} characters; the largest is ${Math.max(...sizes)})`, sizes.length > 500 && Math.max(...sizes) <= K.REQUEST_LIMITS.bodyBytes);
    const mock = K.readCheckAnswer(K.mockCheckAnswer(ar.ctx), ar.ctx), mockOther = K.readCheckAnswer(K.mockCheckAnswer({ ...ar.ctx, yourAnswer: 'The teacher' }), ar.ctx);
    check('the practice helper\'s reply is usable, labelled "no AI", and suggests Right only for the reference answer word for word', !!mock && mock.hint.startsWith('Practice helper (no AI)') && mock.suggestedMark === 'right' && mockOther.suggestedMark === null);
    check('…and the rule-breaking practice reply (a verdict, a link, an Arabic word not sent) is refused', K.readCheckAnswer(K.mockCheckAnswer(ar.ctx, 'sloppy'), ar.ctx) === null && K.readCheckAnswer(K.mockCheckAnswer(cy.ctx, 'sloppy'), cy.ctx) === null);
  }

  console.log('\n[12] Ask MyDay: which page, what\'s sent from it, the checks on each reply, adding and Undo');
  {
    K.setClock(`${D}T10:00`);
    const s0 = K.freshState(), at = `${D}T09:00`;
    const P = (id, title, status = 'active') => ({ id, title, summary: 'Fresh coffee beans for small offices.', stage: 'explore', status, nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at });
    const TK = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null, ...x });
    const NT = (id, text, x = {}) => ({ id, categoryId: '', title: '', text, pinned: false, createdAt: at, updatedAt: at, ...x });
    s0.projects.items = [P('pjC', 'Coffee subscription'), P('pjOld', 'Old move', 'done')];
    s0.tasks.items = [TK('tkA', 'Ring two roasters', { projectId: 'pjC' }), TK('tkB', 'Call the bank', { due: D })];
    s0.notes.items = [NT('n1', 'Roasters sell per kilo', { projectId: 'pjC' }), NT('n2', 'My salary worries', { projectId: 'pjC', private: true }), NT('n3', 'A private diary line', { private: true }), NT('n4', 'Price list idea')];
    s0.study.stages = [{ id: 'sg1', title: 'Foundations', courses: [{ id: 'coP', title: 'Pre-Security', url: '', minutes: 30, listId: null, archived: false, modules: [{ id: 'm1', title: 'Net', sections: [{ id: 's1', title: 'Web', tasks: [
      { id: 'tkH', title: 'HTTP in detail', minutes: 30, url: '', kind: 'learn', note: '', done: false, doneOn: null }, { id: 'tkD', title: 'DNS in detail', minutes: 30, url: '', kind: 'learn', note: '', done: true, doneOn: D }] }] }] }] }];
    s0.days[D] = { energy: 3, rest: false, builtAt: D + 'T08:00', checkedIn: false, tasks: [task('u1', 'Course section', 'learning', 30)] };
    s0.context[D] = { energy: 3, sleep: { start: null, end: null, estimatedHours: 7 } };
    s0.commitments.push({ id: 'c1', kind: 'appointment', title: 'Dentist', start: `${D}T15:00`, end: `${D}T15:30` });
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s0)); K.boot();
    let w = K.getSnapshot().data;
    const pages = ['#today', '#today/tasks', '#today/tasks/tkB', '#projects', '#projects/p/pjC', '#projects/notes', '#projects/notes/n4', '#study/map', '#calendar', '#health/workout', '#finance', '#explore'].map(h => { const p = K.askPage(h); return p.page + (p.id ? ':' + p.id : ''); });
    check('the page is read from the address (and the thing it shows)', eq(pages, ['today', 'tasks', 'task:tkB', 'projects', 'project:pjC', 'notes', 'note:n4', 'study', 'calendar', 'health', 'finance', 'other']), pages);
    let sl = K.askSlice(w, '#projects/p/pjC', D);
    check('a project page sends its name, summary, stage, tasks and note titles — never a private note', sl.context.project.id === 'pjC' && eq(sl.context.project.tasks.map(t => t.id), ['tkA']) && eq(sl.context.project.notes, ['Roasters sell per kilo']) && !JSON.stringify(sl).includes('salary') && !('notesText' in sl.context.project));
    check('…and open projects\' names only (not a done one), said in the Sends line', eq(sl.context.projects.map(p => p.id), ['pjC']) && sl.sends.includes('open projects') && sl.sends.includes('note titles'));
    w = { ...w, patterns: { ...w.patterns, prefs: { ...w.patterns.prefs, aiNotes: true } } };
    sl = K.askSlice(w, '#projects/p/pjC', D);
    check('with AI help with notes on: the project\'s notes\' text too — still never a private one', sl.context.project.notesText.includes('Roasters sell per kilo') && !sl.context.project.notesText.includes('salary') && sl.sends.includes('text (not private ones)'));
    const agree = [['#today', 'today'], ['#today/tasks/tkB', 'task'], ['#calendar', 'calendar'], ['#projects/p/pjC', 'project'], ['#projects/notes/n4', 'note'], ['#study', 'study'], ['#study/course/coP', 'course'], ['#today/tasks', 'tasks'], ['#projects', 'projects'], ['#finance', 'finance'], ['#health', 'health']]
      .filter(([h, pg]) => K.askSlice(w, h, D).sends !== K.sendsFor(pg, true));
    check('What MyDay knows says exactly what each page\'s "Sends" line says (AI help with notes on)', agree.length === 0, agree);
    check('…and with it off, a project page sends note titles only', K.sendsFor('project', false) === K.askSlice({ ...w, patterns: { ...w.patterns, prefs: { ...w.patterns.prefs, aiNotes: false } } }, '#projects/p/pjC', D).sends && !K.sendsFor('project', false).includes('text'));
    sl = K.askSlice(w, '#projects/notes/n3', D);
    check('a private note\'s page: the note isn\'t sent, and the Sends line says so', sl.privateNote && !('note' in sl.context) && sl.sends.includes('not this note') && !JSON.stringify(sl.context).includes('diary'));
    sl = K.askSlice(w, '#finance', D);
    check('Finance (and Health): only the page\'s name — not even project names', eq(sl.context, {}) && sl.sends === 'what you typed, the date');
    sl = K.askSlice(w, '#today', D);
    check('Today: the plan by id, energy, free time and tasks due today', eq(sl.context.today.plan.map(t => t.id), ['u1']) && sl.context.today.energy === 3 && Number.isInteger(sl.context.today.freeMinutes) && eq(sl.context.today.dueToday.map(t => t.id), ['tkB']));
    {
      // How much is left is worked out here (v18): models added up a plan's minutes counting the ones done.
      const tw = { ...w, days: { ...w.days, [D]: { ...w.days[D], tasks: [...w.days[D].tasks.map(t => ({ ...t, done: false })), { ...w.days[D].tasks[0], uid: 'uDone', title: 'Gym', minutes: 60, done: true }] } } };
      const t = K.askSlice(tw, '#today', D).context.today, open = t.plan.filter(x => !x.done);
      check('…and the minutes of it still to do (not the ones done)', t.plan.some(x => x.done && x.minutes === 60) && open.length > 0 && t.minutesLeft === open.reduce((s, x) => s + x.minutes, 0) && K.checkAskContext(K.askContext(K.askSlice(tw, '#today', D), 'how busy am I?', D)), t);
    }
    sl = K.askSlice(w, '#study', D);
    check('Study: the current course and its next task (not a done one), topics, revision due, and today\'s energy and free time', sl.context.study.course.id === 'coP' && sl.context.study.nextTask.id === 'tkH' && Array.isArray(sl.context.study.topics) && sl.context.study.revisionDue === 0 && sl.context.study.energy === 3 && Number.isInteger(sl.context.study.freeMinutes) && K.checkAskContext(K.askContext(sl, 'what should I study?', D)));
    let pv = K.askPreview(K.askContext(sl, 'what should I study?', D));
    check('the preview shows the values themselves: course, next task, energy, free time', pv.short.includes('Course: Pre-Security') && pv.short.includes('Next: HTTP in detail') && pv.short.includes('Energy 3 of 5') && pv.short.some(x => /^Free time \d/.test(x)));
    check('…and, expanded, everything sent: what you typed, when and where, revision due, the open projects\' names', pv.all[0].lines[0] === 'what should I study?' && pv.all.some(x => x.label === 'When and where' && x.lines.includes('Page: Study')) && pv.all.some(x => x.lines.includes('Revision due: 0 cards')) && pv.all.some(x => x.label.startsWith('Your open projects') && x.lines.includes('Coffee subscription')));
    pv = K.askPreview(K.askContext(K.askSlice(w, '#projects/p/pjC', D), 'x', D));
    check('a project page: its name, how many tasks and note titles (and their text, when AI help with notes is on)', pv.short.includes('Project: Coffee subscription') && pv.short.includes('1 task, 1 note title and their text') && pv.all.some(x => x.label === 'Its tasks' && x.lines.includes('Ring two roasters')));
    {
      const withPlan = { ...w, projects: { ...w.projects, items: w.projects.items.map(p => p.id !== 'pjC' ? p : { ...p,
        milestones: [{ id: 'msA', title: 'Secret milestone title', aim: '2026-12-01', reachedOn: null, createdAt: at }],
        decisions: [{ id: 'dcA', question: 'Secret decision question?', options: [{ id: 'opA', text: 'Secret option', pros: ['Secret pro'], cons: ['Secret con'] }], chosen: 'opA', why: 'Secret reason', decidedOn: D, createdAt: at, updatedAt: at }] }) } };
      const slPlan = K.askSlice(withPlan, '#projects/p/pjC', D), slNone = K.askSlice(w, '#projects/p/pjC', D);
      // From 1.32.0 a project page sends its milestones (titles, reached or not, the date aimed for); a decision only when
      // "What am I missing?" names it — and nothing of a project you made private.
      check('a project page sends its milestones (title, reached, aim) — but no decision unless one is asked about',
        eq(slPlan.context.project.milestones, [{ id: 'msA', title: 'Secret milestone title', reached: false, aim: '2026-12-01' }]) && !('decision' in slPlan.context.project)
        && !JSON.stringify(K.askContext(slPlan, 'x', D)).includes('Secret decision') && eq({ ...slPlan.context.project, milestones: undefined }, { ...slNone.context.project, milestones: undefined }), slPlan.context.project);
    }
    {
      const withLearning = { ...w, projects: { ...w.projects, items: w.projects.items.map(p => p.id !== 'pjC' ? p : { ...p,
        studyLinks: [{ kind: 'course', id: 'coQ', title: 'Secret course title', why: 'Secret learning reason', addedOn: D }, { kind: 'arabic', id: 'lesson.secret', title: 'Secret lesson title', addedOn: D }] }) } };
      const slLearn = K.askSlice(withLearning, '#projects/p/pjC', D), slNoLearn = K.askSlice(w, '#projects/p/pjC', D);
      const sent = JSON.stringify([slLearn.context, K.askContext(slLearn, 'x', D), K.askPreview(K.askContext(slLearn, 'x', D))]);
      check('a project page sends nothing of what is linked to it in Learning (no title, reason or id), and its context is the same without them',
        !/Secret course title|Secret learning reason|Secret lesson title|lesson\.secret|coQ|studyLinks/.test(sent) && eq(slLearn.context.project, slNoLearn.context.project), slLearn.context.project);
    }
    const ps = K.askSlice(w, '#projects/notes/n3', D);
    pv = K.askPreview(K.askContext(ps, 'x', D), ps.privateNote);
    check('a private note: the preview says it isn\'t sent', pv.short.includes('This note: not sent (private)') && !JSON.stringify(pv).includes('diary'));
    check('Finance: what you typed and the date (and, if needed, a look across MyDay)', eq(K.askPreview(K.askContext(K.askSlice(w, '#finance', D), 'x', D)).short, ['What you typed and the date', 'If needed, a look across MyDay, at a day or at what to study next']));
    const cal = K.askSlice(w, '#calendar', D);
    let ctxA = K.askContext(K.askSlice(w, '#projects/p/pjC', D), '  Break this into steps  ' + 'x'.repeat(700), D, new Date(), { previous: 'Earlier answer', text: 'Smaller please' });
    check('what\'s sent passes the server\'s check: today\'s appointments, the text cut to 600, one follow-up', cal.context.calendar.appointments[0].title === 'Dentist' && ctxA.text.length === 600 && ctxA.followUp.text === 'Smaller please' && K.checkAskContext(ctxA) && K.checkAskContext(K.askContext(cal, 'hi', D)));
    const big = K.freshState(); big.projects.items = Array.from({ length: 40 }, (_, i) => P('p' + i, 'P'.repeat(300)));
    big.notes.items = [NT('nb', 'n'.repeat(9000))];
    const bigCtx = K.askContext(K.askSlice(big, '#projects/notes/nb', D), 'x'.repeat(5000), D);
    check('even with a lot saved, a request stays under the server\'s 16 KB and passes its check', JSON.stringify({ context: bigCtx }).length < 16000 && K.checkAskContext(bigCtx) && bigCtx.context.projects.length === 20);
    check('the server refuses anything else: an unknown field, an unknown page, an empty request', !K.checkAskContext({ ...ctxA, extra: 1 }) && !K.checkAskContext({ ...ctxA, page: 'admin' }) && !K.checkAskContext({ ...ctxA, text: '  ' }) && !K.checkAskContext({ ...ctxA, context: { secrets: 'x' } }));

    // The checks on each reply (the model only proposes).
    const proj = K.askSlice(w, '#projects/p/pjC', D), home = K.askSlice(w, '#today', D);
    const R = o => JSON.stringify({ message: 'Here you go.', items: [], action: null, ...o });
    check('not JSON, or an unknown kind: nothing to show', K.checkAskReply('nope', w, home, D) === null && K.checkAskReply(R({ kind: 'delete' }), w, home, D) === null);
    let c = K.checkAskReply(R({ kind: 'add', items: [
      { type: 'task', title: 'Renew passport', date: '2026-11-13', minutes: 500, category: null, projectId: 'pjInvented' },
      { type: 'task', title: 'call the bank' },
      { type: 'appointment', title: 'Dentist again', date: '2026-11-12', time: null },
      { type: 'task', title: 'Old thing', date: '2026-11-01' },
      { type: 'note', title: 'Gift ideas', text: 'Mum likes gardening books' },
      { type: 'project', title: 'Learn to cook', text: 'Five dinners I can make', projectId: 'pjC' },
      ...Array.from({ length: 6 }, (_, i) => ({ type: 'task', title: 'Extra ' + i })) ] }), w, home, D);
    const it = n => c.items.find(x => x.title === n);
    check('at most 8 things are proposed', c.kind === 'add' && c.items.length === 8);
    check('a made-up project is never used (the item stays, without it), and lengths are kept sensible (5–120 min)', it('Renew passport').projectId === null && it('Renew passport').minutes === 120 && it('Renew passport').date === '2026-11-13' && c.changed.some(x => x.includes('Renew passport')));
    check('a task already on your lists is marked and left unticked', it('call the bank').already === true && it('Renew passport').already === false);
    const cp = K.checkAskReply(R({ kind: 'add', items: [{ type: 'task', title: 'Course section' }] }), w, home, D);
    check('…and so is one already on today\'s plan', cp.items[0].already === true);
    check('an appointment needs a day and a time — otherwise it becomes a task (and says so)', it('Dentist again').type === 'task' && it('Dentist again').date === '2026-11-12' && c.changed.some(x => x.includes('needs a day and a time')));
    check('a day in the past is left out', it('Old thing').date === null && c.changed.some(x => x.includes('Old thing')));
    check('a note keeps its text; a project gets no project of its own', it('Gift ideas').type === 'note' && it('Gift ideas').text === 'Mum likes gardening books' && it('Learn to cook').projectId === null && it('Learn to cook').text === 'Five dinners I can make');
    c = K.checkAskReply(R({ kind: 'steps', items: [{ type: 'note', title: 'Write what done looks like' }, { type: 'task', title: 'List three roasters', projectId: null }] }), w, proj, D);
    check('steps on a project page: all tasks, all in that project', c.kind === 'steps' && c.items.every(x => x.type === 'task' && x.projectId === 'pjC'));
    c = K.checkAskReply(R({ kind: 'answer', message: 'Try 15 minutes.', action: { type: 'start-study', courseId: 'coP', taskId: 'tkD', minutes: 300 } }), w, home, D);
    check('a study action: a real course; a done task falls back to the course (said); minutes 5–60', c.action.courseId === 'coP' && c.action.taskId === null && c.action.minutes === 60 && c.action.label === 'Pre-Security' && c.changed.length === 1);
    c = K.checkAskReply(R({ kind: 'answer', message: 'Try it for ten minutes.', action: { type: 'start-study', courseId: 'coInvented', taskId: null, minutes: 15 } }), w, home, D);
    check('…a made-up course: no action (the answer stays)', c.kind === 'answer' && c.action === null && c.message === 'Try it for ten minutes.');
    c = K.checkAskReply(R({ kind: 'answer', message: 'Let\'s shape today.', action: { type: 'adjust-today' } }), w, home, D);
    check('planning today is handed over to Help me adjust today', c.action.type === 'adjust-today');
    c = K.checkAskReply(R({ kind: 'answer', message: 'A short revision round is a gentle start.', action: { type: 'start-revision', scope: 'all' } }), w, home, D);
    check('a revision action with nothing due isn\'t offered (and says so)', c.kind === 'answer' && c.action === null && c.changed.some(x => x.includes('Nothing is due')));
    check('Today\'s slice says how much revision is due, and the preview shows it', home.context.today.revisionDue === 0 && K.askPreview(K.askContext(home, 'x', D)).all.some(x => x.label === 'Today' && x.lines.includes('Revision due: 0 cards')));
    c = K.checkAskReply(JSON.stringify({ kind: 'answer', message: 'HTTP in detail is a gentle pick for half an hour.', items: [{ type: 'start-study', courseId: 'coP', taskId: 'tkH', minutes: 20 }], action: null }), w, home, D);
    check('an action put among the items by mistake is still the action (the Start button)', c.kind === 'answer' && c.action?.type === 'start-study' && c.action.taskId === 'tkH' && c.action.minutes === 20);
    c = K.checkAskReply(R({ kind: 'answer', message: 'The gist: follow up Thursday.', items: [1, 2, 3, 4].map(i => ({ type: 'task', title: 'Follow-up ' + i })) }), w, home, D);
    check('an answer that suggests adding things shows them to tick (three at most), with its message', c.kind === 'add' && c.items.length === 3 && c.message === 'The gist: follow up Thursday.');
    c = K.checkAskReply(R({ kind: 'answer', message: 'Try 15 minutes.', action: { type: 'adjust-today' }, items: [{ type: 'task', title: 'Study HTTP' }] }), w, home, D);
    check('…but an answer with an action keeps the action (its items are left out, and it says so)', c.kind === 'answer' && c.action.type === 'adjust-today' && c.changed.some(x => x.includes('left out')));
    c = K.checkAskReply(R({ kind: 'answer', message: 'A short session beats a long one. You\'ve got' }), w, home, D);
    const c2 = K.checkAskReply(R({ kind: 'answer', message: 'Thirty minutes is perfect for one lesson —' }), w, home, D);
    check('a message that stops mid-sentence is cut back to its last whole sentence', c.message === 'A short session beats a long one.' && c2.message === 'Thirty minutes is perfect for one lesson.');
    check('a fragment with nothing to tick and no action ("Here\'s") isn\'t shown as an answer', K.checkAskReply(R({ kind: 'steps', message: "Here's ", items: [] }), w, home, D) === null && K.checkAskReply(R({ kind: 'answer', message: 'Sure.' }), w, home, D) === null);
    c = K.checkAskReply(R({ kind: 'cannot', message: 'MyDay can\'t delete things from here.', items: [{ type: 'task', title: 'x' }], action: { type: 'adjust-today' } }), w, home, D);
    check('"can\'t do that here": just the message — no items, no action', c.kind === 'cannot' && !('items' in c) && !('action' in c));
    c = K.checkAskReply(R({ kind: 'answer', message: 'You should push yourself harder, no excuses.' }), w, home, D);
    check('a message that isn\'t gentle is left out (and with nothing else, nothing is shown)', c === null);
    c = K.checkAskReply(R({ kind: 'add', message: 'You should stop being lazy.', items: [{ type: 'task', title: 'Tidy desk' }] }), w, home, D);
    check('…and with items, they stay under a neutral line', c.kind === 'add' && c.message === 'Here’s what I found to add.' && c.changed.some(x => x.includes('gentle')));

    // Adding what you ticked, and Undo.
    c = K.checkAskReply(R({ kind: 'add', items: [
      { type: 'task', title: 'Email the roaster', projectId: 'pjC', minutes: 20, category: 'admin', date: '2026-11-12', time: '10:00' },
      { type: 'note', title: 'Price idea', text: 'Charge per kilo', projectId: 'pjC' },
      { type: 'appointment', title: 'Roastery visit', date: '2026-11-14', time: '11:00', projectId: 'pjC' },
      { type: 'project', title: 'Office tasting day', text: 'A free tasting for offices' }] }), K.getSnapshot().data, home, D);
    const before = K.getSnapshot().data;
    const u = K.addAskItems(c.items);
    const after = K.getSnapshot().data;
    const t1 = after.tasks.items.find(t => t.title === 'Email the roaster'), n1 = after.notes.items.find(n => n.text === 'Charge per kilo'), a1 = after.commitments.find(x => x.title === 'Roastery visit'), p1 = after.projects.items.find(p => p.title === 'Office tasting day');
    check('Add saves them all at once: a task (date, time, length, in the project)', !!t1 && t1.due === '2026-11-12' && t1.time === '10:00' && t1.minutes === 20 && t1.projectId === 'pjC');
    check('…a note (titled, in the project), an appointment (30 minutes, listed on the project) and a project', n1.title === 'Price idea' && n1.projectId === 'pjC' && a1.start === '2026-11-14T11:00' && a1.end === '2026-11-14T11:30' && after.projects.items.find(p => p.id === 'pjC').commitmentIds.includes(a1.id) && p1.summary === 'A free tasting for offices');
    check('…and says what in words', K.countWords(c.items) === 'a task, a note, an appointment and a project' && K.countWords([{ type: 'task' }, { type: 'task' }]) === '2 tasks');
    check('Undo takes them all back (the project\'s appointment list too)', K.undoAsk(u) && eq(K.getSnapshot().data.tasks.items.map(t => t.id), before.tasks.items.map(t => t.id)) && eq(K.getSnapshot().data.notes.items.map(n => n.id), before.notes.items.map(n => n.id)) && K.getSnapshot().data.commitments.length === before.commitments.length && eq(K.getSnapshot().data.projects.items.find(p => p.id === 'pjC').commitmentIds, []) && K.getSnapshot().data.projects.items.length === before.projects.items.length);
    check('…and a second Undo changes nothing', !K.undoAsk(u));
    // Undo later (the owner's choices of 30 Oct 2026): only what's as Ask left it goes; what you've changed since stays.
    const addAll = () => K.addAskItems(c.items), ids = () => { const d = K.getSnapshot().data; return { t: d.tasks.items.map(x => x.title), n: d.notes.items.map(x => x.text), a: d.commitments.map(x => x.title), p: d.projects.items.map(x => x.title) }; };
    let ul = addAll();
    check('Undo later: everything as Ask left it goes back ("undone"), as before', K.takeBackAsk(ul).result === 'undone' && !ids().t.includes('Email the roaster') && !ids().n.includes('Charge per kilo') && !ids().a.includes('Roastery visit') && !ids().p.includes('Office tasting day'));
    ul = addAll();
    K.updateSaved(d => { const t = d.tasks.items.find(x => x.title === 'Email the roaster'); t.done = true; t.doneOn = D; });
    let tb = K.takeBackAsk(ul);
    check('…a task you\'ve ticked since stays, the rest goes back ("partly", one kept)', tb.result === 'partly' && tb.kept === 1 && ids().t.includes('Email the roaster') && !ids().n.includes('Charge per kilo') && !ids().a.includes('Roastery visit') && !ids().p.includes('Office tasting day'), tb);
    K.updateSaved(d => { d.tasks.items = d.tasks.items.filter(x => x.title !== 'Email the roaster'); });
    ul = addAll();
    K.updateSaved(d => { d.notes.items.find(x => x.text === 'Charge per kilo').text = 'Charge per kilo, £12'; d.tasks.items.find(x => x.title === 'Email the roaster').title = 'Email the roaster today'; });
    K.updateSaved(d => { const ap = d.commitments.find(x => x.title === 'Roastery visit'); ap.end = '2026-11-14T12:00'; d.projects.items.find(x => x.title === 'Office tasting day').summary = 'Mine now'; });
    tb = K.takeBackAsk(ul);
    check('…nothing goes back when you\'ve changed it all since ("changed"), and nothing is lost', tb.result === 'changed' && tb.kept === 4 && ids().t.includes('Email the roaster today') && ids().n.includes('Charge per kilo, £12') && ids().a.includes('Roastery visit') && ids().p.includes('Office tasting day'), tb);
    K.updateSaved(d => { d.tasks.items = d.tasks.items.filter(x => x.title !== 'Email the roaster today'); d.notes.items = d.notes.items.filter(x => x.text !== 'Charge per kilo, £12'); d.commitments = d.commitments.filter(x => x.title !== 'Roastery visit'); d.projects.items = d.projects.items.filter(x => x.title !== 'Office tasting day'); for (const p of d.projects.items) p.commitmentIds = p.commitmentIds.filter(id => d.commitments.some(cm => cm.id === id)); });
    ul = addAll();
    K.updateSaved(d => { const t = d.tasks.items.find(x => x.title === 'Email the roaster'); d.tasks.items[d.tasks.items.indexOf(t)] = Object.fromEntries(Object.entries(t).reverse()); });
    check('…the same record in another key order (as after sync) isn\'t a change: it goes back', K.takeBackAsk(ul).result === 'undone' && !ids().t.includes('Email the roaster'));
    // A project Ask made stays while something that stays is in it: a task of yours, or one of its own you've changed.
    const cookReply = R({ kind: 'add', items: [{ type: 'project', title: 'Learn to bake', text: 'Bread' }, { type: 'task', title: 'Buy flour', projectId: 'new' }, { type: 'task', title: 'Feed the starter', projectId: 'new' }] });
    let cu = K.addAskItems(K.checkAskReply(cookReply, K.getSnapshot().data, home, D).items);
    const bake = () => K.getSnapshot().data.projects.items.find(p => p.title === 'Learn to bake');
    K.updateSaved(d => { d.tasks.items.push({ ...d.tasks.items.find(x => x.title === 'Buy flour'), id: 'tkMineBake', title: 'Book the oven class' }); });
    tb = K.takeBackAsk(cu);
    check('…a project it made, with a task of yours added to it since: the project stays (one kept), its own untouched tasks go', tb.result === 'partly' && tb.kept === 1 && !!bake() && !ids().t.includes('Buy flour') && !ids().t.includes('Feed the starter') && ids().t.includes('Book the oven class'), tb);
    K.updateSaved(d => { d.tasks.items = d.tasks.items.filter(x => x.id !== 'tkMineBake'); d.projects.items = d.projects.items.filter(p => p.title !== 'Learn to bake'); });
    cu = K.addAskItems(K.checkAskReply(cookReply, K.getSnapshot().data, home, D).items);
    K.updateSaved(d => { const t = d.tasks.items.find(x => x.title === 'Buy flour'); t.done = true; t.doneOn = D; });
    tb = K.takeBackAsk(cu);
    check('…and with one of its own tasks ticked since: that task and the project stay (never a task left in a project that\'s gone), counted once', tb.result === 'partly' && tb.kept === 1 && !!bake() && ids().t.includes('Buy flour') && !ids().t.includes('Feed the starter')
      && K.getSnapshot().data.tasks.items.filter(t => t.title === 'Buy flour').every(t => K.getSnapshot().data.projects.items.some(p => p.id === t.projectId)), tb);
    K.updateSaved(d => { d.tasks.items = d.tasks.items.filter(x => x.title !== 'Buy flour'); d.projects.items = d.projects.items.filter(p => p.title !== 'Learn to bake'); });
    // The last one, kept on this device until midnight (or until Ask adds or changes something else).
    const told = []; const off = K.onLastAsk(() => told.push(1));
    ul = addAll(); K.rememberAsk({ kind: 'added', undo: ul, words: 'a task, a note, an appointment and a project' }, new Date(`${D}T14:05`));
    let la = K.lastAsk(K.getSnapshot().data, D);
    check('the last one is kept on this device for today, with when and what in words', la?.kind === 'added' && la.at === '14:05' && la.words.startsWith('a task') && la.on === D && told.length === 1, la);
    check('…not tomorrow (and then it\'s forgotten)', K.lastAsk(K.getSnapshot().data, '2099-01-01') === null && localStorage.getItem('myday.ask.lastUndo') === null);
    K.rememberAsk({ kind: 'added', undo: ul, words: 'x' }, new Date(`${D}T14:06`));
    K.updateSaved(d => { d.tasks.items = d.tasks.items.filter(x => x.title !== 'Email the roaster'); d.notes.items = d.notes.items.filter(x => x.text !== 'Charge per kilo'); d.commitments = d.commitments.filter(x => x.title !== 'Roastery visit'); d.projects.items = d.projects.items.filter(x => x.title !== 'Office tasting day'); for (const p of d.projects.items) p.commitmentIds = p.commitmentIds.filter(id => d.commitments.some(cm => cm.id === id)); });
    check('…nor when nothing of it is left to take back (all removed, or another account\'s)', K.lastAsk(K.getSnapshot().data, D) === null);
    localStorage.setItem('myday.ask.lastUndo', '{"kind":"added","words":"x"}');
    check('…and something not shaped like one is forgotten, never offered', K.lastAsk(K.getSnapshot().data, D) === null && localStorage.getItem('myday.ask.lastUndo') === null);
    ul = addAll(); K.rememberAsk({ kind: 'added', undo: ul, words: 'a task, a note, an appointment and a project' });
    K.updateSaved(d => { const t = d.tasks.items.find(x => x.title === 'Email the roaster'); t.done = true; t.doneOn = D; });
    const un = K.undoNow(K.lastAsk(K.getSnapshot().data, D));
    check('Undo from + says what happened, and the last one is forgotten', un.done && un.message === "Taken back, except one thing you've changed since." && K.lastAsk(K.getSnapshot().data, D) === null && told.length >= 4, [un, told.length]);
    off();
    K.updateSaved(d => { d.tasks.items = d.tasks.items.filter(x => x.title !== 'Email the roaster'); });
    // The review's cases (Fable, 30 Oct 2026).
    const roaster = () => K.getSnapshot().data.tasks.items.some(x => x.title === 'Email the roaster');
    const cleanAll = () => K.updateSaved(d => { d.tasks.items = d.tasks.items.filter(x => x.title !== 'Email the roaster'); d.notes.items = d.notes.items.filter(x => x.text !== 'Charge per kilo'); d.commitments = d.commitments.filter(x => x.title !== 'Roastery visit'); d.projects.items = d.projects.items.filter(x => x.title !== 'Office tasting day'); for (const p of d.projects.items) p.commitmentIds = p.commitmentIds.filter(id => d.commitments.some(cm => cm.id === id)); });
    ul = addAll(); let lid = K.rememberAsk({ kind: 'added', undo: ul, words: 'a task' });
    const other = JSON.parse(localStorage.getItem('myday.data.v4')); other.tasks.items.push({ ...other.tasks.items[0], id: 'tkOtherTab', title: 'From another tab' });
    localStorage.setItem('myday.data.v4', JSON.stringify(other)); // another tab saved first
    let un2 = K.undoNow({ kind: 'added', undo: ul, id: lid });
    check('another tab saved first: "Couldn\'t save just now." — not "you\'ve changed it", nothing lost, and the Undo is still kept', !un2.done && un2.message === "Couldn't save just now." && roaster() === true && localStorage.getItem('myday.ask.lastUndo') !== null, un2);
    K.boot(); un2 = K.undoNow({ kind: 'added', undo: ul, id: lid });
    check('…and trying again once MyDay has caught up takes it back', un2.done && un2.message === 'Taken back.' && !roaster(), un2);
    K.updateSaved(d => { d.tasks.items = d.tasks.items.filter(x => x.id !== 'tkOtherTab'); });
    for (const bad of ['{"kind":"added","id":"x","words":"x","on":"' + D + '","at":"10:00","undo":{"tasks":[],"notes":[]}}', '{"kind":"changed","id":"x","words":"x","on":"' + D + '","at":"10:00","undo":{"tasks":[],"notes":[]}}', '{"kind":"added"', '[1,2]']) {
      localStorage.setItem('myday.ask.lastUndo', bad);
      let threw = null, got;
      try { got = K.lastAsk(K.getSnapshot().data, D); } catch (e) { threw = String(e); }
      check(`a stored value not shaped like one (${bad.slice(0, 28)}…) is never offered, never breaks +, and is forgotten`, threw === null && got === null && localStorage.getItem('myday.ask.lastUndo') === null, threw);
    }
    const idA = K.rememberAsk({ kind: 'added', undo: addAll(), words: 'a' }), idB = K.rememberAsk({ kind: 'added', undo: K.addAskItems([{ ...c.items[0], title: 'Ring the roaster' }]), words: 'b' });
    K.forgetAsk(idA);
    check('forgetting one forgets only that one (another tab may have kept a newer one since)', JSON.parse(localStorage.getItem('myday.ask.lastUndo')).id === idB && idA !== idB);
    K.forgetAsk(); cleanAll(); K.updateSaved(d => { d.tasks.items = d.tasks.items.filter(x => x.title !== 'Ring the roaster'); });
    const realSet = localStorage.setItem;
    K.rememberAsk({ kind: 'added', undo: addAll(), words: 'older' });
    localStorage.setItem = () => { throw new Error('quota'); };
    try { K.rememberAsk({ kind: 'added', undo: { tasks: [], notes: [], appointments: [], projects: [] }, words: 'newer' }); } finally { localStorage.setItem = realSet; }
    check('when keeping a new one fails, the older one isn\'t offered instead (one step of Undo)', localStorage.getItem('myday.ask.lastUndo') === null && K.lastAsk(K.getSnapshot().data, D) === null);
    cleanAll();
    // An appointment Ask added that you then linked to a project of yours stays, and so does your link.
    const apReply = R({ kind: 'add', items: [{ type: 'appointment', title: 'Kiln delivery', date: '2026-11-15', time: '09:00' }] });
    const au = K.addAskItems(K.checkAskReply(apReply, K.getSnapshot().data, home, D).items);
    const apId = au.appointments[0];
    K.updateSaved(d => { d.projects.items.find(x => x.id === 'pjC').commitmentIds.push(apId); });
    tb = K.takeBackAsk(au);
    check('an appointment it added that you linked to a project since: it stays, and so does your link', tb.result === 'changed' && tb.kept === 1 && K.getSnapshot().data.commitments.some(x => x.id === apId) && K.getSnapshot().data.projects.items.find(x => x.id === 'pjC').commitmentIds.includes(apId), tb);
    K.updateSaved(d => { d.commitments = d.commitments.filter(x => x.id !== apId); const pc = d.projects.items.find(x => x.id === 'pjC'); pc.commitmentIds = pc.commitmentIds.filter(x => x !== apId); });
    // A task of yours set to start after one Ask added: once that's taken back, it no longer does.
    ul = addAll();
    const rid = K.getSnapshot().data.tasks.items.find(x => x.title === 'Email the roaster').id;
    K.updateSaved(d => { d.tasks.items.push({ ...d.tasks.items.find(x => x.id === rid), id: 'tkAfterMine', title: 'Taste the samples', after: [rid] }); });
    K.takeBackAsk(ul);
    check('…a task of yours that started after one it added no longer does once that\'s taken back', !roaster() && !(K.getSnapshot().data.tasks.items.find(x => x.id === 'tkAfterMine').after ?? []).includes(rid));
    K.updateSaved(d => { d.tasks.items = d.tasks.items.filter(x => x.id !== 'tkAfterMine'); });
    // Changes (kind "changed") through Undo from +.
    const firstTask = K.getSnapshot().data.tasks.items[0];
    const cu2 = K.applyAskChanges([{ target: 'task', id: firstTask.id, label: firstTask.title, lines: [], patch: { title: `${firstTask.title} (renamed by Ask)` } }]);
    const cid = cu2 && K.rememberAsk({ kind: 'changed', undo: cu2, words: '“x”' });
    const cl = K.lastAsk(K.getSnapshot().data, D), cun = cl && K.undoNow(cl);
    check('a change it made, from +: "Put back as it was.", and forgotten', !!cu2 && cl?.id === cid && cun?.done && cun.message === 'Put back as it was.' && K.getSnapshot().data.tasks.items[0].title === firstTask.title && K.lastAsk(K.getSnapshot().data, D) === null, cun);
    const base = { type: 'task', title: 'Dentist', date: null, time: null, minutes: 15, category: 'admin', projectId: null, text: '', already: false };
    let ed = K.applyAskEdit(base, { date: '2026-11-12', time: '09:15', minutes: '300', category: 'health' }, D);
    check('your edits to a proposal: a day and time, the length (kept within 5–120), the list', ed.date === '2026-11-12' && ed.time === '09:15' && ed.minutes === 120 && ed.category === 'health');
    ed = K.applyAskEdit(base, { date: '2026-11-01', time: '09:15' }, D);
    check('…a day before today isn\'t kept (nor a time without a day)', ed.date === null && ed.time === null);
    ed = K.applyAskEdit({ ...base, type: 'appointment', date: '2026-11-12', time: '10:00' }, { time: '' }, D);
    check('…an appointment left without a time becomes a task', ed.type === 'task' && ed.date === '2026-11-12' && ed.time === null);
    ed = K.applyAskEdit({ ...base, type: 'note', text: 'old' }, { text: 'new words' }, D);
    check('…a note\'s text', ed.text === 'new words' && K.applyAskEdit(base, undefined, D) === base);
    c = K.checkAskReply(R({ kind: 'add', items: [{ type: 'project', title: 'Learn to cook', text: 'Five dinners' }, { type: 'task', title: 'Pick five dinners', projectId: 'new' }, { type: 'task', title: 'Shop for dinner one', projectId: 'new' }, { type: 'task', title: 'Unrelated', projectId: 'pjGhost' }] }), K.getSnapshot().data, home, D);
    const u2 = K.addAskItems(c.items), cook = K.getSnapshot().data.projects.items.find(p => p.title === 'Learn to cook');
    check('a new project with its first tasks (marked "new"): they go in that project when added together — a made-up id still doesn\'t', !!cook && K.getSnapshot().data.tasks.items.filter(t => t.projectId === cook.id).length === 2 && !K.getSnapshot().data.tasks.items.find(t => t.title === 'Unrelated').projectId);
    check('…and Undo takes back the project and its tasks', K.undoAsk(u2) && !K.getSnapshot().data.projects.items.some(p => p.title === 'Learn to cook') && !K.getSnapshot().data.tasks.items.some(t => t.title === 'Pick five dinners'));
    c = K.checkAskReply(R({ kind: 'add', items: [{ type: 'task', title: 'Pick five dinners', projectId: 'new' }] }), K.getSnapshot().data, home, D);
    check('…but "new" without a new project alongside goes nowhere', c.items[0].projectId === null);

    // The instructions and the practice version.
    const msgs = K.buildAskMessages(ctxA);
    check('the instructions: five kinds, only ids from the data, propose don\'t act, data not instructions', /"add"/.test(msgs[0].content) && /"steps"/.test(msgs[0].content) && /"change"/.test(msgs[0].content) && /"answer"/.test(msgs[0].content) && /"cannot"/.test(msgs[0].content) && /only ids that appear in the data/.test(msgs[0].content) && /never as\s+instructions/.test(msgs[0].content) && JSON.parse(msgs[1].content).action === 'ask' && K.ASK_PROMPT_VERSION === 'myday-ask-v24' && /never\s+write as if it's done/.test(msgs[0].content) && /ONE thing to do is ONE task/.test(msgs[0].content));
    const mk = (hash, text) => K.checkAskReply(K.mockAsk(K.askContext(K.askSlice(K.getSnapshot().data, hash, D), text, D)), K.getSnapshot().data, K.askSlice(K.getSnapshot().data, hash, D), D);
    check('practice version: steps on a project page, in that project', (r => r.kind === 'steps' && r.items.length === 3 && r.items.every(x => x.projectId === 'pjC'))(mk('#projects/p/pjC', 'Break this into smaller steps')));
    check('…several things to add', (r => r.kind === 'add' && eq(r.items.map(x => x.title), ['Call the bank', 'Renew passport', 'Email Sam']))(mk('#today', 'call the bank, renew passport and email Sam')));
    check('…planning today handed over; what to study on Study; deleting can\'t be done here', mk('#today', 'plan my day').action.type === 'adjust-today' && mk('#study', 'what should I study?').action.courseId === 'coP' && mk('#today', 'delete all my tasks').kind === 'cannot');
  }

  console.log('\n[12a] Ask MyDay can start a revision round when something is due');
  {
    K.setClock(`${D}T10:00`);
    const s1 = K.freshState();
    s1.study.concepts = Array.from({ length: 7 }, (_, i) => ({ id: 'cpR' + i, title: 'Card ' + i, taskIds: [], createdOn: '2026-11-01', kind: 'written', prompt: 'Q' + i, answer: 'A', explanation: '', choices: [], correct: null, hint: '', source: '', note: '', review: { reps: 1, interval: 1, lapses: 0, due: D } }));
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s1)); K.boot();
    const w1 = K.getSnapshot().data, st1 = K.askSlice(w1, '#study', D);
    check('Study\'s slice counts what\'s due', st1.context.study.revisionDue === 7);
    let c1 = K.checkAskReply(JSON.stringify({ kind: 'answer', message: 'Seven cards are due; a short round first.', items: [], action: { type: 'start-revision', scope: 'all' } }), w1, st1, D);
    check('with cards due: the action starts a round (at most 5 cards, a round\'s size)', c1.action?.type === 'start-revision' && c1.action.count === 5 && c1.action.scope === 'all');
    c1 = K.checkAskReply(JSON.stringify({ kind: 'answer', message: 'Revise the Arabic ones first, gently.', items: [], action: { type: 'start-revision', scope: 'arabic' } }), w1, st1, D);
    check('…but not for a subject with nothing due (Arabic here)', c1.action === null);
    c1 = K.checkAskReply(JSON.stringify({ kind: 'answer', message: 'A short round is a good start.', items: [{ type: 'start-revision', scope: 'all' }], action: null }), w1, st1, D);
    check('…and one put among the items by mistake is still the action', c1.action?.type === 'start-revision');
    c1 = K.checkAskReply(K.mockAsk(K.askContext(st1, 'should I revise first?', D)), w1, st1, D);
    check('the practice helper offers a round when cards are due', c1.action?.type === 'start-revision');
  }

  console.log('\n[12b] Ask MyDay on a Study course: its outline sent, study tasks checked against it, added into it, Undo');
  {
    K.setClock(`${D}T10:00`);
    const s0 = K.freshState();
    const T = (id, title, done = false, kind = 'learn') => ({ id, title, minutes: 30, url: '', kind, note: '', done, doneOn: done ? D : null });
    s0.study.stages = [{ id: 'sg1', title: 'Foundations', courses: [
      { id: 'coP', title: 'Pre-Security', url: 'https://example.com/course', minutes: 30, listId: null, archived: false, modules: [{ id: 'm1', title: 'Networking', sections: [{ id: 's1', title: 'How the web works', tasks: [T('tkD', 'DNS in detail', true), T('tkH', 'HTTP in detail')] }] }] },
      { id: 'coE', title: 'Linux basics', url: '', minutes: 25, listId: null, archived: false, modules: [] }] }];
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s0)); K.boot();
    let w = K.getSnapshot().data;
    const pg = K.askPage('#study/course/coP');
    check('a course page is read from the address', pg.page === 'course' && pg.id === 'coP' && K.askPage('#study').page === 'study');
    let sl = K.askSlice(w, '#study/course/coP', D);
    check('it sends the course\'s outline: modules, sections, task titles, lengths, kinds, done — no links or notes', sl.context.course.id === 'coP' && sl.context.course.modules[0].sections[0].tasks.map(t => t.id + ':' + t.done).join() === 'tkD:true,tkH:false' && !JSON.stringify(sl.context).includes('example.com'));
    const pv = K.askPreview(K.askContext(sl, 'Break this course into study tasks', D));
    check('…shown before you tap: the course and its size, and (expanded) the outline', pv.short.includes('Course: Pre-Security') && pv.short.includes('1 module, 1 section, 2 tasks') && pv.all.some(x => x.label === 'Its outline' && x.lines[0] === 'Networking › How the web works: ✓ DNS in detail; HTTP in detail'));
    check('…and the server accepts it', K.checkAskContext(K.askContext(sl, 'plan it', D)));
    const huge = K.freshState(); huge.study.stages = [{ id: 'sgH', title: 'Big', courses: [{ id: 'coH', title: 'Huge', url: '', minutes: 30, listId: null, archived: false,
      modules: Array.from({ length: 15 }, (_, m) => ({ id: 'hm' + m, title: 'Module ' + m, sections: Array.from({ length: 4 }, (_, c) => ({ id: `hs${m}-${c}`, title: 'Section ' + c, tasks: Array.from({ length: 5 }, (_, t) => T(`ht${m}-${c}-${t}`, 'Task ' + 'x'.repeat(150))) })) })) }] }];
    const hc = K.askContext(K.askSlice(huge, '#study/course/coH', D), 'plan it', D);
    const hs = hc.context.course.modules.flatMap(m => m.sections), ht = hs.flatMap(x => x.tasks);
    check('a very large course is cut (at most 12 modules, 30 sections, 80 tasks, in course order) and still fits the server\'s 16 KB', hc.context.course.modules.length === 12 && hs.length <= 30 && ht.length <= 80 && ht.length >= 30 && ht[0].id === 'ht0-0-0' && K.checkAskContext(hc) && JSON.stringify({ context: hc }).length < 16000, [hs.length, ht.length, JSON.stringify({ context: hc }).length]);
    const R = o => JSON.stringify({ kind: 'steps', message: 'A plan from general knowledge — check it against the course.', action: null, ...o });
    let c = K.checkAskReply(R({ items: [
      { type: 'study-task', title: 'HTTPS and certificates', minutes: 40, kind: 'learn', sectionId: 's1' },
      { type: 'study-task', title: 'Capture a request in the browser', minutes: 20, kind: 'practical', sectionId: 'sInvented' },
      { type: 'study-task', title: 'Subnetting basics', minutes: 30, kind: 'learn', section: 'IP addressing', module: 'Networking 2' },
      { type: 'study-task', title: 'Subnetting practice', minutes: 30, kind: 'practical', section: 'IP addressing', module: 'Networking 2' },
      { type: 'study-task', title: 'http in detail', minutes: 30, kind: 'learn', sectionId: 's1' },
      ...Array.from({ length: 10 }, (_, i) => ({ type: 'study-task', title: 'Extra ' + i, sectionId: 's1' }))] }), w, sl, D);
    const it = n => c.items.find(x => x.title === n);
    check('study tasks into an existing section, with their length and kind', it('HTTPS and certificates').study.sectionId === 's1' && it('HTTPS and certificates').minutes === 40 && it('HTTP' + 'S and certificates').study.kind === 'learn');
    check('…a section that isn\'t in the course becomes a new one (and says so)', it('Capture a request in the browser').study.sectionId === null && it('Capture a request in the browser').study.section === 'Planned with Ask' && c.changed.some(x => x.includes('isn’t in this course')));
    check('…a new section in a new module', it('Subnetting basics').study.section === 'IP addressing' && it('Subnetting basics').study.module === 'Networking 2');
    const c3 = K.checkAskReply(R({ items: [{ type: 'study-task', title: 'URLs and paths', section: 'How the Web Works', module: 'networking' }, { type: 'study-task', title: 'Routers', section: 'Routing', module: 'Networking' }] }), w, sl, D);
    check('…a "new" section or module with a name the course already has is that one (no duplicates)', c3.items[0].study.sectionId === 's1' && c3.items[1].study.sectionId === null && c3.items[1].study.moduleId === 'm1' && c3.items[1].study.module === null);
    check('…one the course already has is marked and left unticked; at most 12', it('http in detail').already === true && it('HTTPS and certificates').already === false && c.items.length === 12);
    const home = K.askSlice(w, '#today', D);
    c = K.checkAskReply(R({ kind: 'add', items: [{ type: 'study-task', title: 'Somewhere', sectionId: 's1' }] }), w, home, D);
    check('away from a course page, a study task is an ordinary task', c.items[0].type === 'task' && !c.items[0].study);
    c = K.checkAskReply(R({ items: [
      { type: 'study-task', title: 'HTTPS and certificates', minutes: 40, kind: 'learn', sectionId: 's1' },
      { type: 'study-task', title: 'Subnetting basics', minutes: 30, kind: 'learn', section: 'IP addressing', module: 'Networking 2' },
      { type: 'study-task', title: 'Subnetting practice', minutes: 30, kind: 'practical', section: 'IP addressing', module: 'Networking 2' }] }), w, sl, D);
    const u = K.addAskItems(c.items);
    let co = K.getSnapshot().data.study.stages[0].courses[0];
    const m2 = co.modules.find(m => m.title === 'Networking 2');
    check('Add puts them into the course: one into its section, two into one new section in one new module', co.modules[0].sections[0].tasks.map(t => t.title).join('|') === 'DNS in detail|HTTP in detail|HTTPS and certificates' && !!m2 && m2.sections.length === 1 && m2.sections[0].title === 'IP addressing' && m2.sections[0].tasks.map(t => t.kind).join() === 'learn,practical');
    check('…said in words', K.countWords(c.items) === '3 study tasks');
    check('Undo takes the tasks back, and the section and module it made', K.undoAsk(u) && (co = K.getSnapshot().data.study.stages[0].courses[0]) && co.modules.length === 1 && co.modules[0].sections[0].tasks.length === 2);
    const se = K.askSlice(K.getSnapshot().data, '#study/course/coE', D);
    c = K.checkAskReply(K.mockAsk(K.askContext(se, 'Break this course into study tasks', D)), K.getSnapshot().data, se, D);
    const u2 = K.addAskItems(c.items);
    const ce = K.getSnapshot().data.study.stages[0].courses[1];
    check('an empty course: the practice helper\'s plan goes into a new module and section', c.kind === 'steps' && c.items.length === 3 && ce.modules.length === 1 && ce.modules[0].title === 'Module 1' && ce.modules[0].sections[0].title === 'Getting started' && ce.modules[0].sections[0].tasks.length === 3);
    check('…and Undo leaves it empty again', K.undoAsk(u2) && K.getSnapshot().data.study.stages[0].courses[1].modules.length === 0);
    const ed = K.applyAskEdit({ type: 'study-task', title: 'x', date: null, time: null, minutes: 30, category: 'learning', projectId: null, text: '', already: false, study: { courseId: 'coP', kind: 'learn', sectionId: 's1', section: null, moduleId: null, module: null } }, { kind: 'practical', minutes: '45' }, D);
    check('editing a study task: its kind and length', ed.study.kind === 'practical' && ed.minutes === 45);
    c = K.checkAskReply(R({ items: [
      { type: 'study-task', title: 'Web basics', section: 'Web application basics', moduleId: 'm2', module: 'Web applications' },
      { type: 'study-task', title: 'Browse requests', section: 'Web application basics', moduleId: 'm2' },
      { type: 'study-task', title: 'Wrap up', section: 'null', module: 'none', moduleId: 'm2' }] }), K.getSnapshot().data, K.askSlice(K.getSnapshot().data, '#study/course/coP', D), D);
    const u3 = K.addAskItems(c.items), cp = K.getSnapshot().data.study.stages[0].courses[0], wa = cp.modules.filter(m => m.title === 'Web applications');
    check('a new module the model gave a made-up id: its tasks stay together, in one new module and one section (no duplicates; "null" isn\'t a name)', wa.length === 1 && wa[0].sections.filter(x => x.title === 'Web application basics').length === 1 && wa[0].sections.find(x => x.title === 'Web application basics').tasks.length === 2 && !cp.modules.some(m => m.title === 'none') && !cp.modules.flatMap(m => m.sections).some(x => x.title === 'null'));
    check('…and Undo takes all of it back', K.undoAsk(u3) && K.getSnapshot().data.study.stages[0].courses[0].modules.length === 1);
  }

  console.log('\n[12c] Ask MyDay changes what\'s already saved: only what was sent, only allowed fields, before → after, exact Undo');
  {
    K.setClock(`${D}T10:00`);
    const s0 = K.freshState(), at = `${D}T09:00`;
    const P = (id, title, status = 'active') => ({ id, title, summary: '', stage: 'explore', status, nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at });
    const TK = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null, ...x });
    const NT = (id, text, x = {}) => ({ id, categoryId: '', title: '', text, pinned: false, createdAt: at, updatedAt: at, ...x });
    const plus = n => { const d = new Date(`${D}T12:00`); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    s0.projects.items = [P('pjC', 'Coffee subscription'), P('pjH', 'Home move'), P('pjOld', 'Old move', 'done')];
    s0.tasks.items = [TK('tkB', 'Pay council tax', { due: D, time: '09:30', projectId: 'pjH' }), TK('tkX', 'Not on this page', { due: plus(5) }), TK('tkDone', 'Done already', { due: D, done: true, doneOn: D })];
    s0.notes.items = [NT('n4', 'Roasters sell per kilo', { title: 'Roasters' }), NT('n3', 'A private diary line', { private: true })];
    s0.commitments.push({ id: 'c1', kind: 'appointment', title: 'Dentist', start: `${D}T15:00`, end: `${D}T15:45` });
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s0)); K.boot();
    let w = K.getSnapshot().data;
    const today = K.askSlice(w, '#today', D), cal = K.askSlice(w, '#calendar', D), note = K.askSlice(w, '#projects/notes/n4', D);
    check('the Calendar sends each appointment\'s id (so a change can point at it), and the server accepts it', cal.context.calendar.appointments[0].id === 'c1' && K.checkAskContext(K.askContext(cal, 'move the dentist', D)));
    const C = (items, o = {}) => JSON.stringify({ kind: 'change', message: 'Here’s what would change.', action: null, items, ...o });
    const ch = (target, targetId, x = {}) => ({ type: 'change', title: '', target, targetId, date: null, time: null, minutes: null, category: null, projectId: null, ...x });
    let c = K.checkAskReply(C([ch('task', 'tkB', { date: plus(3), minutes: 30, category: 'health', projectId: 'pjC', title: 'Pay the council tax' })]), w, today, D);
    const one = c?.changes?.[0];
    check('a task due today: day, length, list, project and title shown before → after', c.kind === 'change' && one.id === 'tkB' && eq(one.lines.map(l => l.field), ['Title', 'Day', 'Length', 'List', 'Project']) && one.lines[1].before.endsWith(', 09:30') && one.lines[1].after.endsWith(', 09:30') && one.lines[2].after === '30 min' && one.lines[4].before === 'Home move' && one.lines[4].after === 'Coffee subscription', one?.lines);
    check('…and nothing is changed until Apply', K.getSnapshot().data.tasks.items.find(t => t.id === 'tkB').due === D);
    const before = JSON.parse(JSON.stringify(K.getSnapshot().data));
    const u = K.applyAskChanges(c.changes);
    let t = K.getSnapshot().data.tasks.items.find(x => x.id === 'tkB');
    check('Apply changes it through the Tasks rules (moved later is counted, its time kept) and moves it to the other project', !!u && t.due === plus(3) && t.time === '09:30' && t.minutes === 30 && t.category === 'health' && t.title === 'Pay the council tax' && t.projectId === 'pjC' && t.postponed === 1);
    check('Undo puts back exactly what was there (the task and both projects)', K.undoAskChanges(u).result === 'undone' && eq(K.getSnapshot().data.tasks.items, before.tasks.items) && eq(K.getSnapshot().data.projects.items, before.projects.items));
    const u1b = K.applyAskChanges(c.changes);
    K.update(dd => { dd.projects.items.find(p => p.id === 'pjC').updatedAt = `${D}T12:00`; }); // a project only touched since
    check('a project only touched since (its updated time) doesn\'t stop the change going back, and isn\'t counted as kept', K.undoAskChanges(u1b).result === 'undone' && K.getSnapshot().data.tasks.items.find(x => x.id === 'tkB').due === D);
    const u1c = K.applyAskChanges(c.changes), pjTitle = K.getSnapshot().data.projects.items.find(p => p.id === 'pjC').title;
    K.update(dd => { dd.projects.items.find(p => p.id === 'pjC').title = 'Coffee for offices'; }); // a real change to a project since
    const r1c = K.undoAskChanges(u1c);
    check('…but a project really changed since is kept, and counted ("Put back, except one thing you\'ve changed since")', r1c.result === 'partly' && r1c.kept === 1 && K.getSnapshot().data.projects.items.find(p => p.id === 'pjC').title === 'Coffee for offices' && K.getSnapshot().data.tasks.items.find(x => x.id === 'tkB').due === D, r1c);
    K.update(dd => { dd.projects.items.find(p => p.id === 'pjC').title = pjTitle; });
    check('…and nothing else was touched (notes, appointments, days)', eq(K.getSnapshot().data.notes.items, before.notes.items) && eq(K.getSnapshot().data.commitments, before.commitments) && eq(K.getSnapshot().data.days, before.days));
    w = K.getSnapshot().data;
    c = K.checkAskReply(C([ch('task', 'tkX', { date: plus(1) }), ch('task', 'tkDone', { date: plus(1) }), ch('task', 'tkNope', { date: plus(1) }), ch('note', 'n4', { title: 'x' }), ch('appointment', 'c1', { time: '16:00' })]), w, today, D);
    check('only what this page sent can change: not a task from elsewhere, a done one, a made-up id, or a note or appointment not on Today', !c || c.kind !== 'change', c);
    c = K.checkAskReply(C([ch('task', 'tkB', { date: plus(-2) }), ch('task', 'tkB', { minutes: 15 })]), w, today, D);
    check('a day before today is left out (and said), and a change to what it already is is no change', !c || c.kind !== 'change', c);
    check('…a reply with nothing left to change says why, in MyDay\'s words', c.kind === 'answer' && c.message.startsWith('Nothing here can be changed') && c.changed.some(x => x.includes('before today')), c);
    check('…and one with no changes at all ("Here\'s the change:") isn\'t usable', K.checkAskReply(JSON.stringify({ kind: 'change', message: 'Here\'s the change: ' }), w, today, D) === null);
    c = K.checkAskReply(C([ch('task', 'tkB', { projectId: 'pjOld' }), ch('task', 'tkB', { projectId: 'pjMadeUp' })]), w, today, D);
    check('a done or made-up project isn\'t used', !c || c.kind !== 'change', c);
    c = K.checkAskReply(C([ch('appointment', 'c1', { time: '16:00' })]), w, cal, D);
    check('an appointment on the Calendar: a new time, its length kept', c.kind === 'change' && c.changes[0].patch.start === `${D}T16:00` && c.changes[0].patch.end === `${D}T16:45` && c.changes[0].lines[0].after.endsWith('16:00'));
    const u2 = K.applyAskChanges(c.changes);
    check('…applied, and Undo puts the old time back', u2 && K.getSnapshot().data.commitments.find(x => x.id === 'c1').start === `${D}T16:00` && K.undoAskChanges(u2).result === 'undone' && K.getSnapshot().data.commitments.find(x => x.id === 'c1').end === `${D}T15:45`);
    c = K.checkAskReply(C([ch('note', 'n4', { projectId: 'pjC', title: 'Roaster prices' })]), K.getSnapshot().data, note, D);
    const u3 = c && K.applyAskChanges(c.changes), n4 = K.getSnapshot().data.notes.items.find(x => x.id === 'n4');
    check('a note: its title and project, its words never touched', c.kind === 'change' && n4.title === 'Roaster prices' && n4.projectId === 'pjC' && n4.text === 'Roasters sell per kilo');
    check('…and Undo puts it back as it was', K.undoAskChanges(u3).result === 'undone' && eq(K.getSnapshot().data.notes.items, before.notes.items));
    c = K.checkAskReply(C([ch('note', 'n3', { title: 'x' })]), K.getSnapshot().data, K.askSlice(K.getSnapshot().data, '#projects/notes/n3', D), D);
    check('a private note is never changed (it wasn\'t sent)', !c || c.kind !== 'change');
    c = K.checkAskReply(C([ch('task', 'tkB', { date: plus(1), category: 'learning', minutes: 90, title: 'Pay the council tax bill' })]), K.getSnapshot().data, today, D, 'move council tax to tomorrow');
    check('only what you asked about changes: a new list, length or title you didn\'t ask for is left out (and said)', c.kind === 'change' && eq(c.changes[0].lines.map(l => l.field), ['Day']) && c.changed.filter(x => x.includes('you didn’t ask for that')).length === 3, c);
    c = K.checkAskReply(C([ch('task', 'tkB', { category: 'health', minutes: 30 })]), K.getSnapshot().data, today, D, 'make council tax a 30 minute health task');
    check('…and kept when you did', c.kind === 'change' && eq(c.changes[0].lines.map(l => l.field), ['Length', 'List']));
    c = K.checkAskReply(C([ch('task', 'tkB', { date: plus(1) }), { type: 'task', title: 'Something new' }]), K.getSnapshot().data, today, D);
    check('a change with something to add mixed in: the change only, and said', c.kind === 'change' && c.changed.some(x => x.includes('Left out things to add')));
    c = K.checkAskReply(K.mockAsk(K.askContext(today, 'move council tax to tomorrow', D)), K.getSnapshot().data, today, D);
    check('the practice helper offers to move it to tomorrow', c.kind === 'change' && c.changes[0].patch.date === plus(1));
    const untyped = K.readAsk(JSON.stringify({ kind: 'steps', message: 'Steps.', items: [{ title: 'List must-haves', minutes: 5 }, { title: 'Read the intro', section: 'Basics' }], action: null }));
    check('steps with no "type" are still read: tasks (study tasks when they say where in a course)', untyped.items.map(i => i.type).join() === 'task,study-task');
    check('…but an "add" item with no type is not guessed', K.readAsk(JSON.stringify({ kind: 'add', message: 'x', items: [{ title: 'Something' }], action: null })).items.length === 0);
    // A task on today's plan, moved to a later day: it comes off the plan, and Undo puts that one task back.
    const sp = K.freshState();
    sp.tasks.items = [TK('tkP', 'Post the form', { due: D, plannedOn: D, planUid: 'pP' })];
    sp.days[D] = { energy: 4, rest: false, builtAt: D + 'T08:00', checkedIn: false, tasks: [task('pA', 'Laundry', 'admin', 15), task('pP', 'Post the form', 'admin', 15), task('pC', 'Gym', 'health', 30)] };
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(sp)); K.boot();
    let wp = K.getSnapshot().data;
    c = K.checkAskReply(C([ch('task', 'tkP', { date: plus(2) })]), wp, K.askSlice(wp, '#today', D), D, 'move the form to Monday');
    check('a task on today\'s plan moved to a later day: the card says it comes off today\'s plan', c.kind === 'change' && c.changes[0].lines.some(l => l.field === 'Today’s plan' && l.after === 'taken off'), c?.changes?.[0]?.lines);
    const up = K.applyAskChanges(c.changes);
    wp = K.getSnapshot().data;
    check('…applied: off the plan (the others untouched), the link cleared', eq(wp.days[D].tasks.map(t => t.uid), ['pA', 'pC']) && wp.tasks.items[0].plannedOn === null && wp.tasks.items[0].due === plus(2));
    K.update(dd => { dd.days[D].tasks[0].done = true; }); // something ticked meanwhile
    check('…Undo puts that one task back in its place, keeps what was ticked since, and relinks it', K.undoAskChanges(up).result === 'undone' && eq(K.getSnapshot().data.days[D].tasks.map(t => t.uid), ['pA', 'pP', 'pC'])
      && K.getSnapshot().data.days[D].tasks[0].done && K.getSnapshot().data.tasks.items[0].planUid === 'pP' && K.getSnapshot().data.tasks.items[0].due === D);
    // Changed since Ask changed it (ticked off on Today, your own edit, a sync): Undo leaves that alone and says so.
    c = K.checkAskReply(C([ch('task', 'tkP', { date: plus(1) })]), K.getSnapshot().data, K.askSlice(K.getSnapshot().data, '#today', D), D, 'move the form to tomorrow');
    const uq = K.applyAskChanges(c.changes);
    K.update(dd => { const x = dd.tasks.items.find(t => t.id === 'tkP'); x.done = true; x.doneOn = D; }); // ticked off since
    const rq = K.undoAskChanges(uq), tq = K.getSnapshot().data.tasks.items.find(t => t.id === 'tkP');
    check('a task ticked off after Ask changed it: Undo leaves it as it is now (done, on its new day, off the plan) and says nothing was put back', rq.result === 'changed' && rq.kept === 1 && tq.done && tq.due === plus(1) && !K.getSnapshot().data.days[D].tasks.some(x => x.uid === 'pP'), [rq, tq.done, tq.due]);
    const sq = K.freshState();
    sq.tasks.items = [TK('tkM', 'Call the bank', { due: D }), TK('tkN', 'Book the MOT', { due: D })];
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(sq)); K.boot();
    let wq = K.getSnapshot().data;
    c = K.checkAskReply(C([ch('task', 'tkM', { date: plus(1) }), ch('task', 'tkN', { date: plus(1) })]), wq, K.askSlice(wq, '#today', D), D, 'move both to tomorrow');
    const um = K.applyAskChanges(c.changes);
    K.update(dd => { const x = dd.tasks.items.find(t => t.id === 'tkN'); x.done = true; x.doneOn = D; });
    const rm = K.undoAskChanges(um); wq = K.getSnapshot().data;
    check('Undo when one of two was ticked off since: the other goes back, the ticked one stays as it is, and it says so', rm.result === 'partly' && rm.kept === 1 && wq.tasks.items.find(t => t.id === 'tkM').due === D && wq.tasks.items.find(t => t.id === 'tkN').done && wq.tasks.items.find(t => t.id === 'tkN').due === plus(1), rm);
    c = K.checkAskReply(C([ch('task', 'tkM', { date: plus(1) })]), wq, K.askSlice(wq, '#today', D), D, 'move the bank call to tomorrow');
    const ur = K.applyAskChanges(c.changes);
    K.update(dd => { const i = dd.tasks.items.findIndex(t => t.id === 'tkM'); dd.tasks.items[i] = Object.fromEntries(Object.entries(dd.tasks.items[i]).reverse()); }); // a sync round trip reordering its fields
    check('…but a record whose fields were only reordered (a sync round trip) still goes back', K.undoAskChanges(ur).result === 'undone' && K.getSnapshot().data.tasks.items.find(t => t.id === 'tkM').due === D);
    check('a reply with a target the server doesn\'t know is dropped by its reader', K.readAsk(C([ch('project', 'pjC', { title: 'x' }), ch('task', '', { title: 'x' })]))?.items.length === 0);
  }

  console.log('\n[12d] Ask MyDay on a task: smaller steps in its list and project');
  {
    K.setClock(`${D}T10:00`);
    const s0 = K.freshState(), at = `${D}T09:00`;
    const P = (id, title, status = 'active') => ({ id, title, summary: '', stage: 'explore', status, nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at });
    const TK = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null, ...x });
    s0.projects.items = [P('pjA', 'Home move'), P('pjB', 'Coffee subscription'), P('pjOld', 'Old move', 'done')];
    s0.tasks.lists = [{ id: 'tlW', name: 'Work' }];
    s0.tasks.items = [TK('tkL', 'Book the removal van', { listId: 'tlW', projectId: 'pjA' }), TK('tkOld', 'Close the old account', { listId: 'tlW', projectId: 'pjOld' }), TK('tkNone', 'Sort the post', { listId: 'tlW' }), TK('tkBare', 'Tidy the shed', { projectId: 'pjA' })];
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s0)); K.boot();
    const w = K.getSnapshot().data;
    const S = (...titles) => JSON.stringify({ kind: 'steps', message: 'Here are some smaller steps.', action: null, items: titles.map(t => (typeof t === 'string' ? { type: 'task', title: t } : { type: 'task', ...t })) });
    const slice = id => K.askSlice(w, `#today/tasks/${id}`, D);
    // (v23) A request without the task's checklist — as the published app sends — keeps its breakdown as separate tasks;
    // with it, a breakdown is steps inside the task (the checks after these).
    const older = sl0 => { const { steps, ...task } = sl0.context.task; return { ...sl0, context: { ...sl0.context, task } }; };
    const oslice = id => older(slice(id));
    let c = K.checkAskReply(S('Get three quotes', { title: 'Choose a date', projectId: 'pjB' }, { title: 'Pack the kitchen', projectId: 'pjOld' }), w, oslice('tkL'), D);
    check('a steps reply on a task page: every step gets the task\'s list and its open project, whatever project the model gave', c.kind === 'steps' && c.items.length === 3 && c.items.every(i => i.listId === 'tlW' && i.projectId === 'pjA'), c.items);
    c = K.checkAskReply(S('Gather the paperwork', { title: 'Phone the bank', projectId: 'pjA' }), w, oslice('tkOld'), D);
    check('a task whose project is done: the steps go in its list but in no project', c.items.length === 2 && c.items.every(i => i.listId === 'tlW' && i.projectId === null), c.items);
    c = K.checkAskReply(S('Gather the post', { title: 'Open the letters', projectId: 'pjB' }), w, oslice('tkNone'), D);
    check('a task with no project: the steps get no project, even when the model named one', c.items.length === 2 && c.items.every(i => i.projectId === null), c.items);
    c = K.checkAskReply(S('Clear the floor', 'Sort the tools'), w, oslice('tkBare'), D);
    check('a task with no list: the steps have no list id at all', c.items.length === 2 && c.items.every(i => !('listId' in i)), c.items);
    c = K.checkAskReply(S('Book the removal van', 'Get three quotes'), w, oslice('tkL'), D);
    check('a step with the same title as the task is marked as already there (so it starts unticked)', c.items.find(i => i.title === 'Book the removal van').already === true && c.items.find(i => i.title === 'Get three quotes').already === false, c.items);
    c = K.checkAskReply(S('Get three quotes', 'Choose a date', 'Pack the kitchen'), w, oslice('tkL'), D);
    const before = JSON.parse(JSON.stringify(K.getSnapshot().data));
    const u = K.addAskItems(c.items);
    const d = K.getSnapshot().data;
    const added = d.tasks.items.filter(t => !before.tasks.items.some(b => b.id === t.id));
    check('Add saves the steps in that list and project', !!u && added.length === 3 && added.every(t => t.listId === 'tlW' && t.projectId === 'pjA'), added);
    check('…and leaves the task itself exactly as it was', eq(d.tasks.items.find(t => t.id === 'tkL'), before.tasks.items.find(t => t.id === 'tkL')));
    const undone = K.undoAsk(u), after = K.getSnapshot().data, noStamp = ps => ps.map(({ updatedAt, ...x }) => x);
    check('Undo takes all the steps back (the project is as it was, apart from its "updated" time)', undone && eq(after.tasks.items, before.tasks.items) && eq(noStamp(after.projects.items), noStamp(before.projects.items)));
    const sl = oslice('tkL');
    c = K.checkAskReply(K.mockAsk(K.askContext(sl, 'Break this into smaller steps', D)), K.getSnapshot().data, sl, D);
    check('the practice helper, asked for smaller steps on a task page, gives steps that pass the checks (in its list and project)', c.kind === 'steps' && c.items.length === 3 && c.items.every(i => i.type === 'task' && i.listId === 'tlW' && i.projectId === 'pjA' && !i.already), c);
    // (v23) With the task's checklist sent: a breakdown is steps inside that task — added to its checklist, undone the same.
    const nslice = id => K.askSlice(K.getSnapshot().data, `#today/tasks/${id}`, D), nsl = nslice('tkL');
    check('the task page now sends its checklist (empty here), and the server\'s check accepts it', Array.isArray(nsl.context.task.steps) && K.checkAskContext(K.askContext(nsl, 'Break this into smaller steps', D)));
    c = K.checkAskReply(S('Get three quotes', { title: 'Choose a date', projectId: 'pjB' }), K.getSnapshot().data, nsl, D);
    check('a breakdown on a task page with its checklist is steps for that task (no project, no list, no minutes)', c.kind === 'steps' && c.items.length === 2 && c.items.every(i => i.type === 'step' && i.stepFor === 'tkL' && i.projectId === null), c.items);
    const b2 = JSON.parse(JSON.stringify(K.getSnapshot().data)), u2 = K.addAskItems(c.items), d2 = K.getSnapshot().data, tl = d2.tasks.items.find(t => t.id === 'tkL');
    check('Add puts them in its checklist, in order, not done — and adds no task', eq((tl.steps ?? []).map(x => [x.text, x.done]), [['Get three quotes', false], ['Choose a date', false]]) && d2.tasks.items.length === b2.tasks.items.length && eq(u2.steps.map(x => x.taskId), ['tkL', 'tkL']), [tl.steps, u2]);
    const sl2 = nslice('tkL');
    check('…the next request sends them', eq(sl2.context.task.steps, [{ text: 'Get three quotes', done: false }, { text: 'Choose a date', done: false }]));
    c = K.checkAskReply(JSON.stringify({ kind: 'steps', message: 'More steps.', action: null, items: [{ type: 'step', title: 'get three quotes' }, { type: 'step', title: 'Ring the van firm' }] }), K.getSnapshot().data, sl2, D);
    check('…a step it already has is left out (whatever its capitals), with a note', c.items.length === 1 && c.items[0].title === 'Ring the van firm' && c.changed.some(x => /already one of its steps/.test(x)), c);
    check('Undo takes the steps back out, and the task is as it was', K.undoAsk(u2) && eq(K.getSnapshot().data.tasks.items.find(t => t.id === 'tkL'), b2.tasks.items.find(t => t.id === 'tkL')));
    // The checklist's limit (30): with 29, one more fits.
    K.updateSaved(dd => { const t = dd.tasks.items.find(x => x.id === 'tkL'); t.steps = Array.from({ length: 29 }, (_, i) => ({ id: 'tsF' + i, text: 'Step ' + i, done: false })); });
    c = K.checkAskReply(JSON.stringify({ kind: 'steps', message: 'More.', action: null, items: [{ type: 'step', title: 'One more' }, { type: 'step', title: 'And another' }] }), K.getSnapshot().data, nslice('tkL'), D);
    check('…a checklist holds at most 30 steps: the rest is left out, with a note', c.items.length === 1 && c.changed.some(x => /30 is the most/.test(x)), c);
    K.updateSaved(dd => { delete dd.tasks.items.find(x => x.id === 'tkL').steps; });
    const pc = K.checkAskReply(K.mockAsk(K.askContext(slice('tkL'), 'Break this into smaller steps', D)), K.getSnapshot().data, nslice('tkL'), D);
    check('the practice helper gives steps for the checklist that pass the checks', pc.kind === 'steps' && pc.items.length === 3 && pc.items.every(i => i.type === 'step' && i.stepFor === 'tkL'), pc);
    const off = K.checkAskReply(JSON.stringify({ kind: 'add', message: 'One to add.', action: null, items: [{ type: 'step', title: 'Measure the van', minutes: 10, category: 'admin' }] }), K.getSnapshot().data, K.askSlice(K.getSnapshot().data, '#today', D), D);
    check('a "step" anywhere but a task page with its checklist is a task', off.kind === 'add' && off.items[0].type === 'task' && !off.items[0].stepFor, off);
    // An answer naming a task's next step may offer that step as a task (seen live on 1.82.0): it starts unticked,
    // saying whose step it is. A done step, or a step of a done task, doesn't count; a task on your lists says so.
    K.updateSaved(dd => { dd.tasks.items.find(x => x.id === 'tkL').steps = [{ id: 'tsQ', text: 'Get three quotes', done: false }, { id: 'tsH', text: 'Measure the hall', done: true }, { id: 'tsP', text: 'Sort the post', done: false }]; });
    const ans = () => K.checkAskReply(JSON.stringify({ kind: 'answer', message: 'Next is getting three quotes for the van.', action: null,
      items: ['get three quotes', 'Measure the hall', 'Sort the post'].map(title => ({ type: 'task', title })) }), K.getSnapshot().data, K.askSlice(K.getSnapshot().data, '#projects/p/pjA', D), D);
    const a1 = ans(), ai = n => a1.items.find(x => x.title === n);
    check('a task it offers that\'s already an open step of a task starts unticked, saying whose (whatever its capitals)', ai('get three quotes')?.already === true && ai('get three quotes')?.stepOf === 'Book the removal van', a1.items);
    check('…a done step doesn\'t count, and one on your lists says so (not a step)', ai('Measure the hall')?.already === false && !ai('Measure the hall')?.stepOf
      && ai('Sort the post')?.already === true && !ai('Sort the post')?.stepOf, a1.items);
    K.updateSaved(dd => { const t = dd.tasks.items.find(x => x.id === 'tkL'); t.done = true; t.doneOn = D; });
    const a2 = ans();
    check('…a step of a task that\'s done doesn\'t count', a2.items.find(x => x.title === 'get three quotes')?.already === false, a2.items);
    K.updateSaved(dd => { const t = dd.tasks.items.find(x => x.id === 'tkL'); t.done = false; t.doneOn = null; delete t.steps; });
  }

  console.log('\n[12e] Ask MyDay with milestones and decisions; private projects');
  {
    K.setClock(`${D}T10:00`);
    const s0 = K.freshState(), at = `${D}T09:00`;
    const P = (id, title, x = {}) => ({ id, title, summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at, ...x });
    const TK = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null, ...x });
    const NT = (id, text, x = {}) => ({ id, categoryId: '', title: '', text, pinned: false, createdAt: at, updatedAt: at, ...x });
    const MS = (id, title, x = {}) => ({ id, title, aim: null, reachedOn: null, createdAt: at, ...x });
    const OP = (id, text, pros = [], cons = []) => ({ id, text, pros, cons });
    const DC = (id, question, options) => ({ id, question, options, chosen: null, why: '', decidedOn: null, createdAt: at, updatedAt: at });
    s0.projects.items = [
      P('pjA', 'Hargeisa shop', { milestones: [MS('msA', 'Find a unit', { aim: '2026-12-01' }), MS('msR', 'Visit the market', { reachedOn: '2026-11-02' })],
        decisions: [DC('dcA', 'Which unit?', [OP('opA', 'Market stall', ['Cheap', 'Busy', 'Near buses', 'Low rent', 'Easy to leave'], ['Small']), OP('opB', 'Corner shop', [], ['Dear'])])] }),
      P('pjP', 'Surprise party', { private: true, commitmentIds: ['cP'], milestones: [MS('msP', 'Book the hall')], decisions: [DC('dcP', 'Which hall?', [OP('opP', 'Town hall', ['Roomy'], [])])] }),
      P('pjMany', 'Big list', { milestones: Array.from({ length: 29 }, (_, i) => MS('mm' + i, 'Step number ' + i)) }),
      P('pjLong', 'Long words', { decisions: [DC('dcL', 'Q'.repeat(250), Array.from({ length: 5 }, (_, i) => OP('ol' + i, 'Option ' + i, Array.from({ length: 8 }, (_, j) => 'p'.repeat(200) + j), ['con'])))] }),
    ];
    s0.tasks.items = [TK('tkP1', 'Order the cake', { projectId: 'pjP', due: D }), TK('tkP2', 'Ring the band', { projectId: 'pjP', plannedOn: D, planUid: 'uP' }), TK('tkPub', 'Ring agents', { projectId: 'pjA', due: D })];
    s0.notes.items = [NT('nP', 'Guest list for the party', { projectId: 'pjP' }), NT('nPub', 'Market stalls sell per day', { projectId: 'pjA' })];
    s0.days[D] = { energy: 3, rest: false, builtAt: D + 'T08:00', checkedIn: false, tasks: [task('u1', 'Pay council tax', 'admin', 15), task('uP', 'Ring the band', 'admin', 15)] };
    s0.context[D] = { energy: 3, sleep: { start: null, end: null, estimatedHours: 7 } };
    s0.commitments.push({ id: 'c1', kind: 'appointment', title: 'Dentist', start: `${D}T15:00`, end: `${D}T15:30` }, { id: 'cP', kind: 'appointment', title: 'Cake pickup', start: `${D}T11:00`, end: `${D}T11:30` });
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s0)); K.boot();
    let w = K.getSnapshot().data;
    const text = o => JSON.stringify(o);

    // ---- Private projects ----
    let sl = K.askSlice(w, '#today', D);
    check('Today leaves out the private project\'s name, its task due today and its plan copy on today\'s plan', eq(sl.context.projects.map(p => p.id), ['pjA', 'pjMany', 'pjLong']) && eq(sl.context.today.plan.map(t => t.id), ['u1']) && eq(sl.context.today.dueToday.map(t => t.id), ['tkPub'])
      && !/Surprise|cake|band/i.test(text(sl.context)), sl.context);
    check('…and counts what was left out: the project, the plan copy and the task due today (3)', sl.held.count === 3 && sl.held.here === null, sl.held);
    let pv = K.askPreview(K.askContext(sl, 'x', D), sl.privateNote, sl.held);
    check('…and the preview says "3 items from private projects not sent"', pv.short.includes('3 items from private projects not sent') && !/Surprise|cake|band/i.test(text(pv)), pv.short);
    sl = K.askSlice(w, '#projects/p/pjP', D);
    pv = K.askPreview(K.askContext(sl, 'x', D), sl.privateNote, sl.held);
    check('a private project\'s own page sends nothing of it (here is "project") and its Sends line says so', sl.held.here === 'project' && !('project' in sl.context) && /not this project, it.s private/.test(sl.sends) && !/Surprise|Book the hall|Town hall/.test(text(sl.context)), sl);
    check('…and the preview says this project isn\'t sent', pv.short.includes('This project: not sent (private)') && !/Surprise|Town hall/.test(text(pv.all.filter(x => x.label !== 'Left out (you made their projects private)'))), pv.short);
    sl = K.askSlice(w, '#today/tasks/tkP1', D);
    check('a task of a private project isn\'t sent (here is "task")', sl.held.here === 'task' && !('task' in sl.context) && /not this task, its project is private/.test(sl.sends) && !/cake/i.test(text(sl.context)), sl);
    sl = K.askSlice(w, '#projects/notes/nP', D);
    check('a note of a private project isn\'t sent (here is "note", and it counts as a private note)', sl.held.here === 'note' && sl.privateNote && !('note' in sl.context) && !/party/i.test(text(sl.context)), sl);
    sl = K.askSlice(w, '#calendar', D);
    check('the Calendar leaves out an appointment listed on a private project, and sends the other', eq(sl.context.calendar.appointments.map(a => a.id), ['c1']) && !/Cake/.test(text(sl.context)) && sl.held.count >= 1, sl);
    check('Finance and Health are unaffected: only the page\'s name, nothing held', ['#finance', '#health/workout'].every(h => { const x = K.askSlice(w, h, D); return eq(x.context, {}) && x.held.count === 0 && x.held.here === null; }));
    sl = K.askSlice(w, '#projects/p/pjA', D);
    check('a project that isn\'t private is sent as before (nothing held on its page)', sl.held.here === null && sl.context.project.id === 'pjA' && eq(sl.context.project.tasks.map(t => t.id), ['tkPub']) && eq(sl.context.projects.map(p => p.id), ['pjA', 'pjMany', 'pjLong']), sl);

    // ---- Milestones and the decision in the slice ----
    sl = K.askSlice(w, '#projects/p/pjA', D);
    check('a project page sends its milestones (id, title, reached, aim) and no decision', eq(sl.context.project.milestones, [{ id: 'msA', title: 'Find a unit', reached: false, aim: '2026-12-01' }, { id: 'msR', title: 'Visit the market', reached: true, aim: null }]) && !('decision' in sl.context.project));
    const slD = K.askSlice(w, '#projects/p/pjA', D, { decisionId: 'dcA' });
    check('with a decision in focus it also sends that one decision: its question and each option with its pros and cons', eq(slD.context.project.decision, { id: 'dcA', question: 'Which unit?', options: [{ id: 'opA', text: 'Market stall', pros: ['Cheap', 'Busy', 'Near buses', 'Low rent', 'Easy to leave'], cons: ['Small'] }, { id: 'opB', text: 'Corner shop', pros: [], cons: ['Dear'] }] }), slD.context.project.decision);
    w.projects.items[0].decisions[0].history = [{ id: 'dhSecret', text: 'Archived option marker', on: '2026-01-01', why: 'Archived private reason marker' }];
    const withHistory = K.askSlice(w, '#projects/p/pjA', D, { decisionId: 'dcA' });
    const historyRequest = K.askContext(withHistory, 'What am I missing?', D), historyPreview = K.askPreview(historyRequest, withHistory.privateNote, withHistory.held);
    check('saved choice history and its reasons stay out of the AI request and preview', !/Archived option marker|Archived private reason marker|dhSecret/.test(text([historyRequest, historyPreview])) && eq(withHistory.context.project.decision, slD.context.project.decision));
    check('…and the Sends line mentions it (only then)', /the decision you asked about/.test(slD.sends) && !/decision/.test(sl.sends) && /milestones/.test(sl.sends), slD.sends);
    check('…a decision id that isn\'t on the project sends none', !('decision' in K.askSlice(w, '#projects/p/pjA', D, { decisionId: 'dcNope' }).context.project));
    pv = K.askPreview(K.askContext(slD, 'What am I missing?', D));
    check('the preview shows the milestones and the decision with its pros and cons', pv.short.includes('2 milestones') && pv.all.some(x => x.label === 'The decision you asked about' && x.lines[0] === 'Which unit?' && /Market stall — pros: Cheap/.test(x.lines[1])), pv.all);
    const ctxD = K.askContext(slD, 'What am I missing?', D);
    check('the server accepts both the milestones and the decision', K.checkAskContext(ctxD) && K.checkAskContext(K.askContext(sl, 'Suggest milestones', D)));
    const slL = K.askSlice(w, '#projects/p/pjLong', D, { decisionId: 'dcL' }), dl = slL.context.project.decision;
    check('a long decision is cut to the limits: question 200, 4 options, 6 points a side of at most 160 characters — and still passes the server\'s check',
      dl.question.length <= 200 && dl.options.length === 4 && dl.options.every(o => o.pros.length === 6 && o.pros.every(t => t.length <= 160)) && K.checkAskContext(K.askContext(slL, 'x', D)), dl.options.map(o => o.pros.length));
    check('the decision preview explains that only the first six points per side are sent', slL.sends.includes('first 6 pros and 6 cons') && K.askPreview(K.askContext(slL, 'x', D)).all.some(x => x.label === 'The decision you asked about' && x.lines.includes('Up to the first 6 pros and 6 cons per option are sent.')));
    const bad = f => { const c = JSON.parse(text(ctxD)); f(c.context.project.decision); return K.checkAskContext(c); };
    check('the server refuses a decision with 5 options, a point over 160 characters, or an extra field',
      !bad(d => { d.options = [...d.options, ...Array.from({ length: 3 }, (_, i) => ({ id: 'x' + i, text: 'X', pros: [], cons: [] }))]; }) && !bad(d => { d.options[0].pros.push('z'.repeat(161)); }) && !bad(d => { d.extra = 1; }) && !bad(d => { d.options[0].score = 3; }) && bad(() => {}));

    // ---- Checking replies ----
    const R = o => text({ kind: 'add', message: 'A few ideas.', items: [], action: null, ...o });
    const home = K.askSlice(w, '#today', D), pageA = K.askSlice(w, '#projects/p/pjA', D), pageP = K.askSlice(w, '#projects/p/pjP', D), pageMany = K.askSlice(w, '#projects/p/pjMany', D);
    const M = (title, x = {}) => ({ type: 'milestone', title, ...x });
    let c = K.checkAskReply(R({ items: [M('Sign the lease', { date: '2026-12-15' }), M('First sale', { date: '2026-11-01' }), M('find a unit'), M('Open the doors')] }), w, pageA, D);
    check('milestones are added for the page\'s project, with a date to aim for', c.kind === 'add' && c.items.filter(i => i.type === 'milestone').length === 3 && c.items.every(i => i.plan?.projectId === 'pjA' && i.projectId === 'pjA') && c.items.find(i => i.title === 'Sign the lease').date === '2026-12-15', c);
    check('…a duplicate of an existing milestone is left out, and said', !c.items.some(i => i.title === 'find a unit') && c.changed.some(x => x.includes('already one of your milestones')), c.changed);
    check('…a date before today is dropped (the milestone stays, with no date)', c.items.find(i => i.title === 'First sale').date === null && c.items.find(i => i.title === 'Open the doors').date === null);
    c = K.checkAskReply(R({ items: [M('Sign the lease'), { type: 'task', title: 'Ring someone' }] }), w, home, D);
    check('milestones are left out on another page (Today), and said', !c.items.some(i => i.type === 'milestone') && c.items.length === 1 && c.changed.some(x => x.includes('isn\'t on this page')), c);
    c = K.checkAskReply(R({ items: [M('Sign the lease')] }), w, pageP, D);
    check('…and for a private project (nothing of it was sent, so nothing is added to it)', c === null || !c.items?.some(i => i.type === 'milestone'), c);
    c = K.checkAskReply(R({ items: [M('Four'), M('Five'), M('Six')] }), w, pageMany, D);
    check('a project with 29 milestones takes one more and no further — 30 at most — and says so', c.items.length === 1 && c.changed.some(x => x.includes('past 30')), c);

    const P2 = (type, title, optionId) => ({ type, title, ...(optionId !== undefined ? { optionId } : {}) });
    c = K.checkAskReply(R({ items: [P2('pro', 'Many walkers pass', 'opB'), P2('con', 'Hard to heat', 'opB'), P2('pro', 'Invented option', 'opZ'), P2('con', 'No option named'), P2('con', 'dear', 'opB'), P2('con', 'Hard to heat', 'opB')] }), w, slD, D);
    check('a pro or con is added to a real option of the decision asked about', c.items.length === 2 && c.items.every(i => i.plan?.decisionId === 'dcA' && i.plan.optionId === 'opB') && eq(c.items.map(i => i.plan.side), ['pros', 'cons']) && c.items[0].text === 'Corner shop', c);
    check('…one naming an option that isn\'t there, or none, is left out, and said', c.changed.filter(x => x.includes('isn\'t in this decision')).length === 2, c.changed);
    check('…a repeat of a point already listed is left out (once, however it\'s cased), and the same point twice in a reply counts once', c.changed.some(x => x.includes('already listed')) && c.items.filter(i => i.title === 'Hard to heat').length === 1, c.changed);
    c = K.checkAskReply(R({ items: [...Array.from({ length: 6 }, (_, i) => P2('pro', `New pro ${i + 6}`, 'opA')), P2('con', 'Another con', 'opA')] }), w, slD, D);
    check('at most 10 pros or cons per side, counting existing and proposed points (opA has 5 pros)', eq(c.items.map(i => i.title), ['New pro 6', 'New pro 7', 'New pro 8', 'New pro 9', 'New pro 10', 'Another con']) && c.changed.some(x => x.includes('10 is the most')), c);
    c = K.checkAskReply(R({ items: [P2('option', 'market stall'), P2('option', 'Online only'), P2('option', 'Pop-up'), P2('option', 'Partner up')] }), w, slD, D);
    check('an option duplicating a listed one is left out; at most 4 options in all (2 listed, so 2 more)', eq(c.items.map(i => i.title), ['Online only', 'Pop-up']) && c.changed.some(x => x.includes('already one of the options')) && c.changed.some(x => x.includes('four is the most')), c);
    c = K.checkAskReply(R({ items: [P2('pro', 'Cheap to start', 'opA'), P2('option', 'Online only'), M('Open the doors')] }), w, pageA, D);
    check('without a decision in the slice, pros, cons and options are left out (a milestone still goes in), and it says no decision was asked about', eq(c.items.map(i => i.type), ['milestone']) && c.changed.filter(x => x.includes('no decision was asked about')).length === 2, c);

    const mess = (message, extra) => K.checkAskReply(R({ message, items: [P2('con', 'Hard to heat', 'opB')], ...extra }), w, slD, D);
    for (const m of ['Near the station is the best choice.', 'I\'d go with the corner shop for the footfall.', 'I recommend the market stall.']) {
      c = mess(m);
      check(`a message that picks an option ("${m}") is reworded, and says so`, c.message === 'Here are a few more things to weigh — the choice is yours.' && c.changed.some(x => x.includes('which option to choose')), c);
    }
    c = mess('A few more things to weigh up for the corner shop.');
    check('a message without such words is kept as it was', c.message === 'A few more things to weigh up for the corner shop.' && !c.changed.some(x => x.includes('which option to choose')), c);
    c = K.checkAskReply(R({ message: 'Near the station is the best choice for a first milestone.', items: [M('Open the doors')] }), w, pageA, D);
    check('…and with no decision in the slice the message is left alone', c.message.includes('best choice'), c);

    // ---- Adding and Undo ----
    const planned = K.checkAskReply(R({ items: [M('Sign the lease', { date: '2026-12-15' }), P2('option', 'Online only'), P2('pro', 'Many walkers pass', 'opB'), P2('con', 'Hard to heat', 'opB'), P2('con', 'Needs a deposit', 'opB')] }), w, slD, D);
    const before = JSON.parse(text(K.getSnapshot().data)), strip = d => { const x = JSON.parse(text(d)); const pj = x.projects.items.find(p => p.id === 'pjA'); delete pj.milestones; delete pj.decisions; delete pj.updatedAt; delete x.saves; return x; }; // `saves` is the save counter, not your data
    const u = K.addAskItems(planned.items), d1 = K.getSnapshot().data, pjA = d1.projects.items.find(p => p.id === 'pjA'), dcA = pjA.decisions[0];
    check('Add puts the ticked milestone in the project, with its aim, after the existing ones', !!u && eq(pjA.milestones.map(m => m.title), ['Find a unit', 'Visit the market', 'Sign the lease']) && pjA.milestones[2].aim === '2026-12-15' && pjA.milestones[2].reachedOn === null, pjA.milestones);
    check('…the option to the decision, and the pros and cons to the right option', eq(dcA.options.map(o => o.text), ['Market stall', 'Corner shop', 'Online only']) && eq(dcA.options[1].pros, ['Many walkers pass']) && eq(dcA.options[1].cons, ['Dear', 'Hard to heat', 'Needs a deposit']) && eq(dcA.options[0].pros, before.projects.items[0].decisions[0].options[0].pros), dcA.options);
    check('…and leaves the rest of the project, and everything else saved, as it was', eq(strip(d1), strip(before)) && eq(pjA.decisions[0].chosen, null) && eq(d1.projects.items.find(p => p.id === 'pjP'), before.projects.items.find(p => p.id === 'pjP')));
    check('countWords says what was added, e.g. "2 milestones and a con"', K.countWords([{ type: 'milestone' }, { type: 'milestone' }, { type: 'con' }]) === '2 milestones and a con' && K.countWords(planned.items) === 'a milestone, an option, a pro and 2 cons', K.countWords(planned.items));
    K.update(d => { const o = d.projects.items.find(p => p.id === 'pjA').decisions[0].options[1]; o.cons = o.cons.filter(t => t !== 'Hard to heat'); });
    check('Undo takes back exactly those — a point you removed meanwhile stays removed, and your own points stay', K.undoAsk(u), null);
    const pjB = K.getSnapshot().data.projects.items.find(p => p.id === 'pjA'), dcB = pjB.decisions[0];
    check('…the milestone, the option and the added points are gone; everything else is as before', eq(pjB.milestones, before.projects.items[0].milestones) && eq(dcB.options, before.projects.items[0].decisions[0].options) && eq(strip(K.getSnapshot().data), strip(before)), dcB.options);
    check('…and a second Undo changes nothing (false)', !K.undoAsk(u));

    // ---- The practice helper ----
    sl = K.askSlice(K.getSnapshot().data, '#projects/p/pjA', D);
    c = K.checkAskReply(K.mockAsk(K.askContext(sl, 'Suggest some milestones for this project', D)), K.getSnapshot().data, sl, D);
    check('the practice helper, asked for milestones on a project page, gives milestones that pass the checks', c.kind === 'add' && c.items.length === 3 && c.items.every(i => i.type === 'milestone' && i.plan.projectId === 'pjA') && c.changed.length === 0, c);
    const slM = K.askSlice(K.getSnapshot().data, '#projects/p/pjA', D, { decisionId: 'dcA' });
    c = K.checkAskReply(K.mockAsk(K.askContext(slM, 'What am I missing?', D)), K.getSnapshot().data, slM, D);
    check('…with a decision in focus, "What am I missing?" gives a con and an option that pass the checks', c.kind === 'add' && eq(c.items.map(i => i.type), ['con', 'option']) && c.items[0].plan.optionId === 'opA' && c.changed.length === 0, c);
    check('…and its message doesn\'t pick a winner (nothing reworded)', !/best|recommend|go with/i.test(c.message) && c.message.includes('the choice is yours'), c.message);
  }

  console.log('\n[12f] Ask MyDay and a business idea\'s one page: sent only from its Model tab (1.34.0), never what you found');
  {
    K.setClock(`${D}T10:00`);
    const s0 = K.freshState(), at = `${D}T09:00`;
    const ASM = (id, text, x = {}) => ({ id, text, state: 'open', found: '', checkedOn: null, taskId: null, createdAt: at, ...x });
    s0.projects.items = [{ id: 'pjB', title: 'Lunch boxes for sites', summary: 'Hot lunches for builders', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at, template: 'business',
      model: { problem: 'Zebra problem wording', who: 'Quokka audience wording', how: 'Narwhal pricing wording', assumptions: [ASM('asA', 'Pelican assumption wording'), ASM('asB', 'Walrus checked wording', { state: 'looks-true', checkedOn: D, found: 'Ibex evidence wording' })] } }];
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s0)); K.boot();
    const w = K.getSnapshot().data, text = o => JSON.stringify(o);
    const onePage = ['Zebra', 'Quokka', 'Narwhal', 'Pelican', 'Walrus'];
    const page = K.askSlice(w, '#projects/p/pjB', D), model = K.askSlice(w, '#projects/p/pjB/model', D), ms = K.askSlice(w, '#projects/p/pjB/milestones', D);
    for (const [name, sl] of [['project page', page], ['Milestones tab', ms]]) {
      const req = K.askContext(sl, 'What should I do next?', D), pv = K.askPreview(req, sl.privateNote, sl.held);
      check(`on the ${name}, nothing of the one page is in the request`, ![...onePage, 'Ibex'].some(x => text(req).includes(x)) && !('onePage' in req.context.project), text(req));
      check(`on the ${name}, nothing of the one page is in the preview text`, ![...onePage, 'Ibex'].some(x => text(pv).includes(x)), pv.short);
      check(`on the ${name}, the project's name and summary are still sent`, text(req).includes('Lunch boxes for sites') && text(req).includes('Hot lunches for builders'), text(req));
    }
    const req = K.askContext(model, 'Suggest what must be true for this idea to work', D), pv = K.askPreview(req, model.privateNote, model.held);
    check('on the Model tab, the one page is sent: the three answers and what must be true with its state', eq(req.context.project.onePage, { problem: 'Zebra problem wording', who: 'Quokka audience wording', how: 'Narwhal pricing wording',
      mustBeTrue: [{ text: 'Pelican assumption wording', state: 'open' }, { text: 'Walrus checked wording', state: 'looks-true' }] }), req.context.project.onePage);
    check('…but never what you found', !text(req).includes('Ibex') && !text(pv).includes('Ibex'), text(req));
    check('…and the preview shows it, and the Sends line names it', onePage.every(x => text(pv.all).includes(x)) && pv.short.some(x => /^One page: 3 answers, 2 things that must be true$/.test(x)) && /its one page/.test(model.sends), [pv.short, model.sends]);
    check('…the rest of the project slice is the same as on its own page', eq({ ...req.context.project, onePage: undefined }, { ...page.context.project, onePage: undefined }));
  }

  console.log('\n[12g] What must be true from Ask MyDay: checked, added, undone');
  {
    K.setClock(`${D}T10:00`);
    const s0 = K.freshState(), at = `${D}T09:00`;
    const ASM = (id, text, x = {}) => ({ id, text, state: 'open', found: '', checkedOn: null, taskId: null, createdAt: at, ...x });
    const BP = (id, title, x = {}) => ({ id, title, summary: 'Hot lunches for builders', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at, template: 'business',
      model: { problem: 'Builders cannot get a hot lunch', who: 'Small crews', how: 'Boxes at noon', assumptions: [] }, ...x });
    s0.projects.items = [
      BP('pjB', 'Lunch boxes for sites', { model: { problem: 'Builders cannot get a hot lunch', who: 'Small crews', how: 'Boxes at noon', assumptions: [
        ASM('asA', 'Crews would pay for lunch'), ASM('asB', 'Sites allow deliveries!', { state: 'looks-true', checkedOn: D, found: 'Yes' }), ASM('asC', 'Cooking 40 boxes is realistic', { state: 'doesnt-hold', checkedOn: D })] } }),
      BP('pjFull', 'Ten already', { model: { problem: '', who: '', how: '', assumptions: Array.from({ length: 10 }, (_, i) => ASM('af' + i, 'Existing belief number ' + i)) } }),
      BP('pjPriv', 'Secret lunch idea', { private: true }),
      { id: 'pjGen', title: 'Garden shed', summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at },
    ];
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s0)); K.boot();
    const w = K.getSnapshot().data, text = o => JSON.stringify(o);
    const R = o => text({ kind: 'add', message: 'A few things your idea may depend on.', items: [], action: null, ...o });
    const B = (title, x = {}) => ({ type: 'must-be-true', title, ...x });
    const mp = K.askSlice(w, '#projects/p/pjB/model', D), page = K.askSlice(w, '#projects/p/pjB', D);
    const mine = c => (c?.items ?? []).filter(i => i.type === 'must-be-true');

    let c = K.checkAskReply(R({ items: [B('Crews would try a new lunch supplier'), B('We can reach crews cheaply'), B('Margins cover the ingredients')] }), w, mp, D);
    check('three must-be-true items from the Model tab give three proposals of that type, each for the page\'s project', mine(c).length === 3 && c.items.length === 3 && c.items.every(i => i.plan?.projectId === 'pjB' && i.projectId === 'pjB'), c);

    c = K.checkAskReply(R({ items: [B('x'.repeat(111)), B('x'.repeat(110)), B('Margins cover the ingredients')] }), w, mp, D);
    check('an item longer than 110 characters is left out, and said to be too long', mine(c).length === 2 && !c.items.some(i => i.title.length > 110) && c.changed.some(x => x.includes('too long')), c);

    c = K.checkAskReply(R({ items: [B('Will crews pay for this?'), B('Margins cover the ingredients')] }), w, mp, D);
    check('an item ending in a question mark is left out, and said to be a question', eq(mine(c).map(i => i.title), ['Margins cover the ingredients']) && c.changed.some(x => x.includes('a question')), c);

    c = K.checkAskReply(R({ items: [B('crews would PAY for lunch.'), B('sites allow deliveries'), B('Cooking 40 boxes is realistic'), B('Margins cover the ingredients')] }), w, mp, D);
    check('an item the same as one already on the list is left out whatever its state, ignoring case and punctuation, and said so', eq(mine(c).map(i => i.title), ['Margins cover the ingredients']) && c.changed.filter(x => x.includes('already on your list')).length === 3, c);

    c = K.checkAskReply(R({ items: Array.from({ length: 7 }, (_, i) => B('Brand new belief ' + i)) }), w, mp, D);
    check('with more than five items only five are kept, and it says "Left out more than five"', mine(c).length === 5 && eq(mine(c).map(i => i.title), Array.from({ length: 5 }, (_, i) => 'Brand new belief ' + i)) && c.changed.some(x => x.includes('Left out more than five')), c);

    const full = K.askSlice(w, '#projects/p/pjFull/model', D);
    c = K.checkAskReply(R({ items: [B('New belief one'), B('New belief two'), B('New belief three')] }), w, full, D);
    check('with ten already on the list only two more are kept, and it says 12 is the most', mine(c).length === 2 && c.changed.some(x => x.includes('12 is the most')), c);

    c = K.checkAskReply(R({ items: [B('Margins cover the ingredients'), B('Crews would try a new supplier')] }), w, page, D);
    check('from the project\'s Overview (no one page sent) every must-be-true item is left out, and said not to have been sent', mine(c).length === 0 && c.changed.filter(x => x.includes('wasn\'t sent')).length === 2, c);

    c = K.checkAskReply(R({ items: [B('Margins cover the ingredients')] }), w, K.askSlice(w, '#projects/p/pjGen/model', D), D);
    check('for a general project (no template) on its /model address every must-be-true item is left out, and said not to have been sent', mine(c).length === 0 && c.changed.some(x => x.includes('wasn\'t sent')), c);

    const priv = K.askSlice(w, '#projects/p/pjPriv/model', D);
    c = K.checkAskReply(R({ items: [B('Margins cover the ingredients')] }), w, priv, D);
    check('a private business project sends no project, so every must-be-true item is left out', !('project' in priv.context) && mine(c).length === 0 && c.changed.length > 0, [priv.context, c]);

    c = K.checkAskReply(R({ message: 'This is a great idea and it will definitely succeed.', items: [B('Margins cover the ingredients')] }), w, mp, D);
    check('a message that judges the idea is replaced by "Here are a few things your idea may depend on — yours to check.", and it says so', c.message === 'Here are a few things your idea may depend on — yours to check.' && c.changed.length > 0, c);
    c = K.checkAskReply(R({ message: 'Here are some things the idea may rely on.', items: [B('Margins cover the ingredients')] }), w, mp, D);
    check('…but a neutral message is kept as it is', c.message === 'Here are some things the idea may rely on.' && !c.changed.length, c);

    c = K.checkAskReply(R({ items: [{ type: 'must-be-true', text: 'Margins cover the ingredients' }, { type: 'must-be-true', text: 'Crews would try a new supplier' }] }), w, mp, D);
    check('items whose words come in "text" instead of "title" are read the same', eq(mine(c).map(i => i.title), ['Margins cover the ingredients', 'Crews would try a new supplier']), c);

    // ---- Add and Undo ----
    const planned = K.checkAskReply(R({ items: [B('Crews would try a new lunch supplier'), B('We can reach crews cheaply'), B('Margins cover the ingredients')] }), w, mp, D);
    const u = K.addAskItems(planned.items), as1 = K.getSnapshot().data.projects.items.find(p => p.id === 'pjB').model.assumptions;
    check('Add puts the three on the project\'s list after the existing ones, open, with nothing found, not yet checked and no task', !!u && eq(as1.map(a => a.text), ['Crews would pay for lunch', 'Sites allow deliveries!', 'Cooking 40 boxes is realistic', 'Crews would try a new lunch supplier', 'We can reach crews cheaply', 'Margins cover the ingredients'])
      && as1.slice(3).every(a => a.state === 'open' && a.found === '' && a.checkedOn === null && a.taskId === null), as1);
    check('…and gives back one "assumption" entry for each, to undo', u.plan.length === 3 && u.plan.every(x => x.kind === 'assumption' && x.projectId === 'pjB') && eq(u.plan.map(x => x.id), as1.slice(3).map(a => a.id)), u.plan);
    check('countWords says "3 things that must be true" for three and "a thing that must be true" for one', K.countWords(planned.items) === '3 things that must be true' && K.countWords([{ type: 'must-be-true' }]) === 'a thing that must be true', K.countWords(planned.items));
    K.update(d => { const m = d.projects.items.find(p => p.id === 'pjB').model; m.assumptions = m.assumptions.filter(a => a.text !== 'We can reach crews cheaply'); });
    check('Undo takes back exactly those', K.undoAsk(u), null);
    const as2 = K.getSnapshot().data.projects.items.find(p => p.id === 'pjB').model.assumptions;
    check('…one you had already removed stays removed, and the others on the list stay as they were', eq(as2.map(a => a.text), ['Crews would pay for lunch', 'Sites allow deliveries!', 'Cooking 40 boxes is realistic']) && eq(as2, as1.slice(0, 3)), as2);
  }

  console.log('\n[12h] Ask MyDay on the weekly review page: counts and names only, nothing of a private project');
  {
    K.setClock(`${D}T10:00`);
    const s0 = K.freshState(), at = `${D}T09:00`;
    const P = (id, title, x = {}) => ({ id, title, summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at, ...x });
    const TK = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null, ...x });
    s0.projects.items = [
      P('pjA', 'Hargeisa shop', { milestones: [{ id: 'msA', title: 'Visit the market', aim: null, reachedOn: '2026-11-08', createdAt: at }] }),
      P('pjF', 'Allotment plan', { focus: '2026-11-11' }),
      P('pjP', 'Surprise party', { private: true, focus: '2026-11-11', milestones: [{ id: 'msP', title: 'Book the hall', aim: null, reachedOn: '2026-11-07', createdAt: at }] }),
    ];
    s0.tasks.items = [
      TK('a1', 'Ring agents', { projectId: 'pjA', done: true, doneOn: '2026-11-09' }), TK('a2', 'Price stalls', { projectId: 'pjA', done: true, doneOn: '2026-11-05' }),
      TK('p1', 'Order the cake', { projectId: 'pjP', done: true, doneOn: '2026-11-09' }), TK('p2', 'Ring the band', { projectId: 'pjP', postponed: 3 }),
      TK('o1', 'Renew passport', { done: true, doneOn: '2026-11-06' }), TK('o2', 'Pay council tax', { postponed: 3 }),
    ];
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(s0)); K.boot();
    const w = K.getSnapshot().data, text = o => JSON.stringify(o);
    const sl = K.askSlice(w, '#review', D), req = K.askContext(sl, 'What pattern do you see in my week?', D), pv = K.askPreview(req, sl.privateNote, sl.held);
    check('on the weekly review the page is "review" and the request carries the seven days ending today', sl.page === 'review' && req.page === 'review' && req.context.review.from === '2026-11-04' && req.context.review.to === '2026-11-10', req.context.review);
    check('what moved is sent as counts for each project (2 tasks and a milestone for Hargeisa shop)', eq(req.context.review.moved, [{ project: 'Hargeisa shop', tasks: 2, milestones: 1, decisions: 0, found: 0, recorded: 0 }]), req.context.review.moved);
    check('…with the other tasks done, study and workouts as plain numbers', req.context.review.otherTasks === 1 && req.context.review.studySessions === 0 && req.context.review.studyMinutes === 0 && req.context.review.workouts === 0, req.context.review);
    check('what is waiting is sent as its words, and next week\'s focus as project names', eq(req.context.review.waiting, ['“Pay council tax” has moved 3 times']) && eq(req.context.review.focus, ['Allotment plan']), req.context.review);
    check('nothing of the private project is in the request: not its name, its tasks, its milestone, what is waiting on it or its focus', !/Surprise|cake|band|hall/i.test(text(req)), text(req));
    check('…or in the preview', !/Surprise|cake|band|hall/i.test(text(pv)), pv);
    check('what was left out is counted: the private project\'s name, its move this week and its waiting task (3)', sl.held.count === 3 && sl.held.here === null, sl.held);
    check('the preview says "Your week: 1 project moved" and "1 thing needs you", and says 3 items from private projects were not sent', pv.short.includes('Your week: 1 project moved') && pv.short.includes('1 thing needs you') && pv.short.includes('3 items from private projects not sent'), pv.short);
    check('…and its full list is headed "What needs you" (not "What’s waiting")', pv.all.some(x => x.label === 'What needs you') && !pv.all.some(x => /waiting/i.test(x.label) && !x.label.startsWith('If it needs to:')), pv.all.map(x => x.label));
    {
      const w2 = JSON.parse(JSON.stringify(w)); w2.tasks.items.push(TK('o3', 'Book the boiler', { postponed: 4 }));
      const sl2 = K.askSlice(w2, '#review', D), pv2 = K.askPreview(K.askContext(sl2, 'What pattern do you see in my week?', D), sl2.privateNote, sl2.held);
      check('with two things it says "2 things need you" (plural), and with one "1 thing needs you" (singular, above)', pv2.short.includes('2 things need you') && !pv2.short.some(x => /waiting/.test(x) && !x.startsWith('If needed, a look')), pv2.short);
    }
    check('the preview shows the week in full, and the Sends line says what is sent', text(pv.all).includes('Hargeisa shop') && text(pv.all).includes('Allotment plan') && /seven days/.test(sl.sends), [pv.all, sl.sends]);
    check('the request passes the server\'s check', K.checkAskContext(req));
  }

  console.log('\n[Lookups] Ask MyDay looks in your notes when an answer needs them (specs/ai-tools.md §3)');
  {
    const LD = '2026-11-10', lat = `${LD}T08:00`;
    K.setClock(`${LD}T09:30`);
    const lw = K.freshState();
    lw.patterns.prefs.aiNotes = true;
    const LP = (id, title, x = {}) => ({ id, title, summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: lat, updatedAt: lat, ...x });
    lw.projects.items = [LP('pjShed', 'Garden shed'), LP('pjHid', 'Hidden plans', { private: true })];
    const LN = (id, title, text, x = {}) => ({ id, categoryId: '', title, text, pinned: false, createdAt: lat, updatedAt: '2026-11-01T08:00', ...x });
    lw.notes.items = [LN('nRack', 'Shed sizes', 'Leave room for a bike rack on the left wall, by the door.', { projectId: 'pjShed', updatedAt: '2026-11-09T08:00' }),
      LN('nRack2', 'Bike rack prices', 'A wall rack is about £20.', { updatedAt: '2026-11-08T08:00' }), LN('nPrivRack', 'Rack', 'my private bike rack thoughts', { private: true }),
      LN('nInHid', 'Rack', 'a bike rack for the hidden plans', { projectId: 'pjHid' }), LN('nCafe', 'Café plans', 'Meet at the café on Friday')];
    const ld = K.normalize(lw);
    let lr = K.notesLookup(ld, 'Bike RACK');
    check('every word, in any order, capitals ignored: the notes that may reach AI, newest first', eq(lr.lookup.notes.map(n => n.id), ['nRack', 'nRack2']) && lr.lookup.found === 2, lr.lookup.notes.map(n => n.id));
    check('…each with its title, its project\'s name and a short snippet around the words', lr.lookup.notes[0].title === 'Shed sizes' && lr.lookup.notes[0].project === 'Garden shed' && lr.lookup.notes[0].snippet.includes('bike rack') && lr.lookup.notes[1].project === null, lr.lookup.notes[0]);
    check('a private note, and a note in a private project, are never sent — only counted, and the count stays on the device', lr.leftOut === 2 && !('leftOut' in lr.lookup) && !/nPrivRack|nInHid|private bike|hidden plans|Hidden plans/.test(JSON.stringify(lr.lookup)));
    check('accents don\'t matter ("cafe" finds "Café plans")', eq(K.notesLookup(ld, 'cafe').lookup.notes.map(n => n.id), ['nCafe']));
    ld.patterns.prefs.aiNotes = false;
    lr = K.notesLookup(ld, 'bike rack');
    check('with AI help with notes off: titles only — only titles searched, and no snippets', lr.lookup.titlesOnly && eq(lr.lookup.notes.map(n => n.id), ['nRack2']) && lr.lookup.notes.every(n => n.snippet === null), lr.lookup);
    ld.patterns.prefs.aiNotes = true;
    check('what the panel says above the answer', K.lookupLine(K.notesLookup(ld, 'bike rack').lookup, 2) === 'Looked in your notes for “bike rack”: 2 notes — 2 private notes left out.', K.lookupLine(K.notesLookup(ld, 'bike rack').lookup, 2));
    check('…and when nothing matched', K.lookupLine(K.notesLookup(ld, 'zebra').lookup, 0) === 'Looked in your notes for “zebra”: nothing matched.');
    check('…and when only private notes matched (nothing could be sent)', K.lookupLine({ ...K.notesLookup(ld, 'zebra').lookup, query: 'walrus' }, 1) === 'Looked in your notes for “walrus”: none that could be sent — one private note left out.');
    ld.patterns.prefs.aiNotes = false;
    ld.notes.items.push({ id: 'nUntitled', categoryId: '', title: '', text: 'bike rack measurements from the shop', pinned: false, createdAt: lat, updatedAt: lat });
    check('titles only means titles: an untitled note\'s first line is neither searched nor sent', !K.notesLookup(ld, 'measurements').lookup.notes.length && !JSON.stringify(K.notesLookup(ld, 'bike').lookup).includes('measurements'));
    ld.notes.items.pop(); ld.patterns.prefs.aiNotes = true;
    const many = K.normalize({ ...lw, notes: { ...lw.notes, items: Array.from({ length: 11 }, (_, i) => LN('nM' + i, 'Rack note ' + i, 'bike rack', { updatedAt: `2026-11-0${(i % 9) + 1}T08:00` })) } });
    const mr = K.notesLookup(many, 'rack');
    check('more than 8 found: the newest 8 are sent, and "found" still says how many matched', mr.lookup.notes.length === 8 && mr.lookup.found === 11 && K.lookupLine(mr.lookup, 0).includes('11 notes (the newest 8 sent)'), [mr.lookup.notes.length, mr.lookup.found]);
    const lslice = K.askSlice(ld, '#today', LD), lfound = K.notesLookup(ld, 'bike rack').lookup, Q = 'What did I write about the bike rack?';
    const lc1 = K.askContext(lslice, Q, LD);
    check('the request says this app can look at a day, a project, your open decisions, what you\'re waiting on, what to study next and across MyDay (v24: in place of your notes), and the server\'s check accepts it', eq(lc1.can, ['day', 'project', 'decisions', 'waiting', 'study', 'search']) && !('lookup' in lc1) && K.checkAskContext(lc1));
    const lc2 = K.askContext(lslice, Q, LD, undefined, undefined, lfound);
    check('…the second request carries what was found, and is accepted too', lc2.lookup === lfound && K.checkAskContext(lc2));
    const LKR = q => JSON.stringify({ kind: 'lookup', message: 'Looking in your notes.', lookup: { tool: 'notes', query: q } });
    check('a lookup reply is taken as a lookup (the panel then looks) — one still asking for your notes gets the look across MyDay', eq(K.checkAskReply(LKR('bike rack'), ld, lslice, LD), { kind: 'lookup', tool: 'search', query: 'bike rack' }));
    check('…but never a second time for the same question', K.checkAskReply(LKR('bike'), ld, lslice, LD, undefined, lfound) === null);
    const ANS = sources => JSON.stringify({ kind: 'answer', message: 'Your shed note says to leave room for it on the left wall.', items: [], action: null, sources });
    const la = K.checkAskReply(ANS(['nRack', 'nPrivRack', 'nMadeUp', 'nRack']), ld, lslice, LD, undefined, lfound);
    check('the notes an answer used: only ones the lookup found, once each (never a private one or a made-up id)', la.kind === 'answer' && eq(la.sources, [{ id: 'nRack', title: 'Shed sizes' }]), la.sources);
    check('…and none without a lookup', !('sources' in K.checkAskReply(ANS(['nRack']), ld, lslice, LD)));
    const CUT = m => JSON.stringify({ kind: 'answer', message: m, items: [], action: null });
    check('an answer cut off mid-thought (the model ended its JSON string early) isn\'t shown as a fragment: it\'s unusable', K.checkAskReply(CUT('I searched your notes for '), ld, lslice, LD, undefined, lfound) === null && K.checkAskReply(CUT('Nothing in your notes matched '), ld, lslice, LD, undefined, lfound) === null);
    check('…but one that just lacks its full stop is mended as before', K.checkAskReply(CUT('Nothing in your notes matches that word'), ld, lslice, LD, undefined, lfound)?.message === 'Nothing in your notes matches that word.');
    const p1 = K.checkAskReply(K.mockAsk(lc1), ld, lslice, LD);
    const p2 = p1?.kind === 'lookup' ? K.notesLookup(ld, p1.query) : null;
    const p3 = p2 && K.checkAskReply(K.mockAsk(K.askContext(lslice, Q, LD, undefined, undefined, p2.lookup)), ld, lslice, LD, undefined, p2.lookup);
    // "Your day" (v18): one day as the app sees it — a private project's tasks left out (counted only here), busy times by
    // kind only, from a week ago to two months ahead.
    const DD = '2026-11-12', TI2 = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 20, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: lat, postponed: 0, blockers: [], letGoOn: null, ...x });
    const PT2 = (uid, title, minutes, at) => ({ uid, taskId: null, category: 'admin', title, minutes, baseMinutes: minutes, done: false, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: at ? `${DD}T${at}` : null, scheduledEnd: at ? `${DD}T${at.slice(0, 3)}${String(Number(at.slice(3)) + 20).padStart(2, '0')}` : null });
    const dw = K.normalize({ ...lw, projects: { ...lw.projects, items: lw.projects.items.map(p => (p.id === 'pjHid' ? { ...p, commitmentIds: ['cDHid'] } : p)) }, days: { [DD]: { energy: 4, rest: false, builtAt: `${DD}T08:00`, checkedIn: false, tasks: [PT2('pD1', 'Order the felt', 20, '10:00'), PT2('pD2', 'Hidden plan task', 30, null)] } },
      context: { [DD]: { energy: 4, sleep: { start: null, end: null, estimatedHours: null } } },
      tasks: { ...lw.tasks, items: [TI2('tkD2', 'Hidden plan task', { projectId: 'pjHid', plannedOn: DD, planUid: 'pD2' }), TI2('tkDue', 'Post the parcel', { due: DD }), TI2('tkDueHid', 'Hidden due thing', { due: DD, projectId: 'pjHid' })] },
      commitments: [{ id: 'cD', kind: 'appointment', title: 'Dentist with Dr Okapi', start: `${DD}T15:00`, end: `${DD}T16:00` },
        { id: 'cDHid', kind: 'appointment', title: 'Hidden clinic visit', start: `${DD}T11:00`, end: `${DD}T11:30` }] });
    const dr = K.dayLookup(dw, DD, LD);
    check('a day: its plan without the private project\'s task, what\'s due (not the private one), its energy and weekday', eq(dr.lookup.tasks.map(t => t.title), ['Order the felt']) && dr.lookup.tasks[0].time === '10:00' && eq(dr.lookup.due, ['Post the parcel']) && dr.lookup.energy === 4 && dr.lookup.weekday === 'Thursday' && dr.lookup.planned, dr.lookup);
    check('…the appointment as busy time, by kind only — never its name', dr.lookup.busy.some(b => b.kind === 'appointment' && b.start === `${DD}T15:00`) && !/Okapi|Dentist/.test(JSON.stringify(dr.lookup)), dr.lookup.busy);
    check('…a private project\'s appointment too, as busy time only (so the day isn\'t shown free then), never its name', dr.lookup.busy.some(b => b.kind === 'appointment' && b.start === `${DD}T11:00`) && !dr.lookup.free.some(f => f.start <= '11:00' && f.end > '11:00'), [dr.lookup.busy, dr.lookup.free]);
    check('…the minutes still to do, of the tasks sent only (not the private one\'s 30)', dr.lookup.minutesLeft === 20, dr.lookup.minutesLeft);
    check('…and the two private tasks counted only here, never sent', dr.leftOut === 2 && !/Hidden/.test(JSON.stringify(dr.lookup)) && !('leftOut' in dr.lookup));
    check('…a day further off than two months, or more than a week ago, isn\'t looked at', K.dayLookup(dw, '2027-01-12', LD) === null && K.dayLookup(dw, '2026-11-02', LD) === null && !!K.dayLookup(dw, '2026-11-03', LD));
    const dline = K.lookupLine(dr.lookup, dr.leftOut);
    check('what the panel says: the day, what\'s planned and due, and the private tasks left out', /^Looked at Thursday,? (12 November|November 12): one task planned, 1 due, /.test(dline) && dline.endsWith('— 2 private tasks left out.'), dline); // Node's own date wording; the app uses en-GB
    const dat = K.lookupLine(dr.lookup, dr.leftOut, undefined, { more: dr.more, at: new Date(2026, 10, 12, 9, 5) });
    check('…and the time it was read after it (an answer to a follow-up, or a second try, uses what was read the first time)', dat === `${dline} Checked at 09:05.`, dat);
    const dmany = K.normalize({ ...lw, days: { [DD]: { energy: 4, rest: false, builtAt: `${DD}T08:00`, checkedIn: false, tasks: Array.from({ length: 23 }, (_, i) => PT2('pM' + i, 'Batch ' + i, 10, null)) } },
      tasks: { ...lw.tasks, items: Array.from({ length: 21 }, (_, i) => TI2('tkDM' + i, 'Due ' + i, { due: DD })) } });
    const dmr = K.dayLookup(dmany, DD, LD), dmline = K.lookupLine(dmr.lookup, dmr.leftOut, undefined, { more: dmr.more });
    check('more planned or due than the limit: the first 20 of each sent, and the line says how many there were', dmr.lookup.tasks.length === 20 && dmr.lookup.due.length === 20 && dmline.includes(': 23 tasks planned (the first 20 sent), 21 due (20 sent), ')
      && !('more' in dmr.lookup), dmline);
    check('the server\'s check accepts a request carrying the day', K.checkAskContext(K.askContext(lslice, 'Am I free on Thursday?', LD, undefined, undefined, dr.lookup)));
    const DLK = q => JSON.stringify({ kind: 'lookup', message: 'Looking at that day.', lookup: { tool: 'day', query: q } });
    check('a day lookup reply is taken as one', eq(K.checkAskReply(DLK(DD), dw, lslice, LD), { kind: 'lookup', tool: 'day', query: DD }));
    const ADJ = JSON.stringify({ kind: 'answer', message: 'Thursday is wide open.', items: [], action: { type: 'adjust-today' } });
    check('after a look at another day, no "Help me adjust today" (it plans today only)…', K.checkAskReply(ADJ, dw, lslice, LD, undefined, dr.lookup)?.action === null);
    check('…but after a look at today it stays', K.checkAskReply(ADJ, dw, lslice, DD, undefined, dr.lookup)?.action?.type === 'adjust-today');
    const far = K.checkAskReply(DLK('2027-06-01'), dw, lslice, LD);
    check('…a day further off gets a plain answer saying which days it can look at (not "couldn\'t be used")', far?.kind === 'cannot' && far.message.includes('a week ago to two months ahead'), far);
    check('…and a day that doesn\'t exist (31 November) is unusable', K.checkAskReply(DLK('2026-11-31'), dw, lslice, LD) === null);
    const dslice = K.askSlice(dw, '#projects', LD), dq = 'Am I free on Thursday?';
    const d1 = K.checkAskReply(K.mockAsk(K.askContext(dslice, dq, LD)), dw, dslice, LD);
    const d2 = d1?.kind === 'lookup' && d1.tool === 'day' ? K.dayLookup(dw, d1.query, LD) : null;
    const d3 = d2 && K.checkAskReply(K.mockAsk(K.askContext(dslice, dq, LD, undefined, undefined, d2.lookup)), dw, dslice, LD, undefined, d2.lookup);
    check('practice mode, end to end: "Am I free on Thursday?" looks at the 12th, then says what\'s on', d1?.query === DD && d3?.kind === 'answer' && d3.message.includes('Thursday has 1 task planned and 2 appointments'), [d1, d3]);
    check('practice mode, end to end: it looks, then answers naming the notes, with them as sources', p1?.kind === 'lookup' && p3?.kind === 'answer' && p3.message.includes('“Shed sizes”') && eq(p3.sources.map(x => x.id), ['nRack', 'nRack2']), [p1, p3]);
    // "A project's context" (v19): one open project asked about by name, exactly as its own page sends it.
    const pw = K.normalize({ ...lw,
      projects: { ...lw.projects, items: [LP('pjShed', 'Garden shed', { summary: 'A shed for the bikes', outcome: 'OUTCOME-SHED', finishedWhen: 'FINISHED-SHED', leftOff: { text: 'LEFTOFF-SHED', at: lat },
        milestones: [{ id: 'mS1', title: 'Base laid', aim: null, reachedOn: null, createdAt: lat }],
        decisions: [{ id: 'dS1', question: 'Which roof?', options: [{ id: 'oFelt', text: 'Felt', pros: [], cons: [] }, { id: 'oTin', text: 'Tin', pros: [], cons: [] }], chosen: null, why: '', decidedOn: null, createdAt: lat, updatedAt: lat }] }),
      LP('pjHid', 'Hidden plans', { private: true }), LP('pjOld', 'Old kitchen', { status: 'done' })] },
      notes: { ...lw.notes, items: [...lw.notes.items, LN('nShedPriv', 'Shed worries', 'PRIVATE-SHED-THOUGHT', { projectId: 'pjShed', private: true })] },
      tasks: { ...lw.tasks, items: [TI2('tkS1', 'Order the felt', { projectId: 'pjShed' }), TI2('tkS2', 'Measure the wall', { projectId: 'pjShed', done: true, doneOn: '2026-11-09' }), TI2('tkH1', 'Hidden thing', { projectId: 'pjHid' })] } });
    const pr = K.projectLookup(pw, 'pjShed'), page = K.askSlice(pw, '#projects/p/pjShed', LD).context.project;
    check('a project: exactly what its own page sends (name, summary, stage, tasks, milestones, note titles)', eq(pr.lookup.project, page) && pr.lookup.query === 'pjShed' && eq(pr.lookup.project.tasks.map(t => t.id), ['tkS1', 'tkS2']) && pr.lookup.project.milestones.length === 1, pr.lookup);
    check('…its private note left out and counted only here; never its outcome, what counts as finished or where you left off', pr.leftOut === 1 && !/PRIVATE-SHED|Shed worries|OUTCOME-SHED|FINISHED-SHED|LEFTOFF-SHED/.test(JSON.stringify(pr.lookup)) && !('leftOut' in pr.lookup), pr.leftOut);
    check('…never a private project, a finished one or one that isn\'t there', K.projectLookup(pw, 'pjHid') === null && K.projectLookup(pw, 'pjOld') === null && K.projectLookup(pw, 'pjNope') === null);
    const pline = K.lookupLine(pr.lookup, pr.leftOut);
    check('what the panel says: the project, its tasks, milestones and notes, and the private note left out', pline === 'Looked at your project “Garden shed”: 2 tasks (1 done), one milestone, one note — one private note left out.', pline);
    const pmline = (d, id = 'pjShed') => { const x = K.projectLookup(d, id); return K.lookupLine(x.lookup, x.leftOut, undefined, { more: x.more }); };
    check('…and with what didn\'t go counted: the same line, as nothing more was held back', pmline(pw) === pline, pmline(pw));
    const pbig = K.normalize({ ...lw, tasks: { ...lw.tasks, items: Array.from({ length: 23 }, (_, i) => TI2('tkP' + i, 'Shed job ' + i, { projectId: 'pjShed', ...(i < 3 ? { done: true, doneOn: '2026-11-09' } : {}) })) },
      notes: { ...lw.notes, items: Array.from({ length: 22 }, (_, i) => LN('nP' + i, 'Shed note ' + i, 'x'.repeat(400), { projectId: 'pjShed', updatedAt: `2026-11-${String(i + 1).padStart(2, '0')}T08:00` })) } });
    pbig.patterns.prefs.aiNotes = true;
    const pb = K.projectLookup(pbig, 'pjShed');
    check('more tasks and notes than the limit, and more notes\' text than fits: the line says how many there were, what was sent, and the notes that went by title only', pmline(pbig) === 'Looked at your project “Garden shed”: 23 tasks (3 done; 20 sent, open ones first), 22 notes (the newest 20 sent) — 13 notes by title only, as there was too much text.'
      && pb.lookup.project.tasks.length === 20 && pb.lookup.project.notes.length === 20 && pb.lookup.project.notesText.split('\n').length === 7 && !('more' in pb.lookup), pmline(pbig));
    pbig.patterns.prefs.aiNotes = false;
    check('…and with AI help with notes off, notes by title only, saying why', pmline(pbig).endsWith('22 notes (the newest 20 sent) — notes by title only, as AI help with notes is off.') && !('notesText' in K.projectLookup(pbig, 'pjShed').lookup.project), pmline(pbig));
    const tslice = K.askSlice(pw, '#today', LD), pq = 'What\'s next on the garden shed?';
    check('the server\'s check accepts a request carrying the project', K.checkAskContext(K.askContext(tslice, pq, LD, undefined, undefined, pr.lookup)));
    const PLK = q => JSON.stringify({ kind: 'lookup', message: 'Looking at that project.', lookup: { tool: 'project', query: q } });
    check('a project lookup reply is taken for one of the open projects it was given', eq(K.checkAskReply(PLK('pjShed'), pw, tslice, LD), { kind: 'lookup', tool: 'project', query: 'pjShed' }));
    check('…but not for a private project (never given) or one that isn\'t there', K.checkAskReply(PLK('pjHid'), pw, tslice, LD) === null && K.checkAskReply(PLK('pjNope'), pw, tslice, LD) === null);
    const STEPS = JSON.stringify({ kind: 'steps', message: 'Here are two steps.', items: [{ type: 'task', title: 'Clear the base', minutes: 20, category: 'admin', projectId: null }, { type: 'task', title: 'Buy the slabs', minutes: 30, category: 'admin', projectId: null }] });
    const st = K.checkAskReply(STEPS, pw, tslice, LD, 'break the garden shed down', pr.lookup);
    check('after a look at a project, steps go into it (as on its page)', st?.kind === 'steps' && st.items.length === 2 && st.items.every(i => i.projectId === 'pjShed'), st);
    check('…but without a look, steps from Today stay where they were', K.checkAskReply(STEPS, pw, tslice, LD, 'break the garden shed down')?.items.every(i => i.projectId === null));
    const CHG = JSON.stringify({ kind: 'change', message: 'Here\'s what would change.', items: [{ type: 'change', target: 'task', targetId: 'tkS1', title: 'Order the felt', date: '2026-11-13', time: null }] });
    const ch = K.checkAskReply(CHG, pw, tslice, LD, 'move ordering the felt to Friday', pr.lookup);
    check('after a look at a project, a change to one of its tasks may be proposed, as on its page', ch?.kind === 'change' && ch.changes.length === 1 && ch.changes[0].id === 'tkS1', ch);
    check('…but not without the look (that task isn\'t on Today)', K.checkAskReply(CHG, pw, tslice, LD, 'move ordering the felt to Friday')?.kind !== 'change');
    const MS = JSON.stringify({ kind: 'add', message: 'Two milestones to steer by.', items: [{ type: 'milestone', title: 'Walls up', date: null }, { type: 'milestone', title: 'Roof on', date: null }] });
    const ms = K.checkAskReply(MS, pw, tslice, LD, 'milestones for the garden shed', pr.lookup);
    check('…and milestones for it (but not without the look)', ms?.kind === 'add' && ms.items.length === 2 && ms.items.every(i => i.type === 'milestone' && i.plan?.projectId === 'pjShed')
      && !K.checkAskReply(MS, pw, tslice, LD, 'milestones for the garden shed')?.items?.length, ms);
    const own = K.projectLookup(pw, 'pjShed'), dslice2 = K.askSlice(pw, '#projects/p/pjShed/decisions', LD, { decisionId: 'dS1' });
    const PRO = JSON.stringify({ kind: 'add', message: 'Points to weigh — the choice is yours.', items: [{ type: 'pro', title: 'Lasts for decades', optionId: 'oTin' }] });
    const pro = K.checkAskReply(PRO, pw, dslice2, LD, 'what am I missing?', own.lookup);
    check('a look at the page\'s own project keeps the decision it was sent with (its pros and cons still go)', !!dslice2.context.project.decision && pro?.kind === 'add' && pro.items.length === 1 && pro.items[0].type === 'pro', pro);
    check('Finance sends no project names, so it offers no look at a project or your decisions (which carry them)', eq(K.askContext(K.askSlice(pw, '#finance', LD), 'x', LD).can, ['day', 'study', 'search']));
    const pp1 = K.checkAskReply(K.mockAsk(K.askContext(tslice, pq, LD)), pw, tslice, LD);
    const pp2 = pp1?.kind === 'lookup' && pp1.tool === 'project' ? K.projectLookup(pw, pp1.query) : null;
    const pp3 = pp2 && K.checkAskReply(K.mockAsk(K.askContext(tslice, pq, LD, undefined, undefined, pp2.lookup)), pw, tslice, LD, undefined, pp2.lookup);
    check('practice mode, end to end: "What\'s next on the garden shed?" from Today looks at it, then says where it is', pp1?.query === 'pjShed' && pp3?.kind === 'answer' && pp3.message.includes('“Garden shed” is at explore, with 1 of 2 tasks done. Next: “Order the felt”'), [pp1, pp3]);
    const tpv = K.askPreview(K.askContext(tslice, pq, LD));
    check('the preview says it may look at one of your projects, and what it would send', tpv.short.includes('If needed, a look across MyDay, at a day, at one of your projects, at your open decisions, at what you’re waiting on or at what to study next') && tpv.all.some(x => x.label === 'If it needs to: one of your projects' && x.lines.join(' ').includes('never its outcome')), tpv);
    // "Open decisions" (v20): nothing chosen yet, oldest first, across open projects (or one) — never a private one's.
    const DC = (id, question, x = {}) => ({ id, question, options: [{ id: id + 'a', text: 'Felt', pros: ['PRO-TEXT-A'], cons: [] }, { id: id + 'b', text: 'Tin', pros: [], cons: ['CON-TEXT-B', 'CON-TEXT-C'] }], chosen: null, why: '', decidedOn: null, createdAt: lat, updatedAt: lat, ...x });
    const AS = (id, text, state) => ({ id, text, state, found: 'FOUND-TEXT', checkedOn: null, taskId: null, createdAt: lat });
    const zw = K.normalize({ ...pw, projects: { ...pw.projects, items: [
      LP('pjShed', 'Garden shed', { decisions: [DC('dRoof', 'Which roof?'), DC('dOld', 'Which door?', { createdAt: '2026-11-01T08:00', lastChoice: { text: 'LASTCHOICE-TEXT', on: '2026-11-05' }, history: [{ id: 'h1', text: 'HISTORY-TEXT', on: '2026-11-05', why: 'WHY-OLD' }] }),
        DC('dPaint', 'Which paint?', { chosen: 'dPainta', why: 'WHY-TEXT', decidedOn: '2026-11-09' })] }),
      LP('pjCafe', 'Corner café', { template: 'business', model: { problem: 'p', who: 'w', how: 'h', assumptions: [AS('aOpen', 'People want oat milk', 'open'), AS('aTrue', 'Rent is affordable', 'looks-true')] } }),
      LP('pjHid', 'Hidden plans', { private: true, decisions: [DC('dHid', 'HIDDEN-QUESTION')] }), LP('pjOld', 'Old kitchen', { status: 'done', decisions: [DC('dKit', 'OLD-QUESTION')] })] } });
    const zl = K.decisionsLookup(zw, 'all'), zs = JSON.stringify(zl.lookup);
    check('open decisions: nothing chosen yet, oldest first, the options and which have no pros or cons yet, the day opened and if reopened', eq(zl.lookup.decisions.map(d => d.id), ['dOld', 'dRoof']) && zl.lookup.decisions[0].reopened && !zl.lookup.decisions[1].reopened
      && eq(zl.lookup.decisions[1].options, ['Felt', 'Tin']) && eq(zl.lookup.decisions[1].gaps, ['“Felt” has no cons yet', '“Tin” has no pros yet']) && zl.lookup.decisions[0].since === '2026-11-01' && zl.lookup.decisions[0].project === 'Garden shed', zl.lookup.decisions);
    check('…and what a business idea still has to check (not what\'s already checked)', eq(zl.lookup.mustBeTrue, [{ id: 'aOpen', projectId: 'pjCafe', project: 'Corner café', text: 'People want oat milk' }]) && eq(zl.lookup.found, { decisions: 2, mustBeTrue: 1 }), zl.lookup.mustBeTrue);
    check('…never what a pro or con says, your reasons, earlier choices or what you found; never a private or finished project\'s (the private one counted here only)', !/PRO-TEXT|CON-TEXT|LASTCHOICE|HISTORY|WHY-|FOUND-TEXT|HIDDEN|OLD-QUESTION|Hidden plans|Old kitchen/.test(zs) && zl.leftOut === 1 && !('leftOut' in zl.lookup), [zs.slice(0, 200), zl.leftOut]);
    check('…one project by its id (nothing counted from others); never a private, finished or missing one', eq(K.decisionsLookup(zw, 'pjShed').lookup.decisions.map(d => d.id), ['dOld', 'dRoof']) && K.decisionsLookup(zw, 'pjShed').leftOut === 0
      && K.decisionsLookup(zw, 'pjHid') === null && K.decisionsLookup(zw, 'pjOld') === null && K.decisionsLookup(zw, 'pjNope') === null);
    const zline = K.lookupLine(zl.lookup, zl.leftOut);
    check('what the panel says: how many decisions and things to check, and the private one left out', zline === 'Looked at your open decisions: 2 decisions, one thing to check — one in a private project left out.', zline);
    const zmore = K.lookupLine({ ...zl.lookup, found: { decisions: 11, mustBeTrue: 9 } }, 0);
    check('…and when more were found than sent, which ones went', zmore === 'Looked at your open decisions: 11 decisions (the oldest 2 sent), 9 things to check (the oldest 1 sent).', zmore);
    const zslice = K.askSlice(zw, '#today', LD), zq = 'Which decisions am I putting off?';
    check('the server\'s check accepts a request carrying them', K.checkAskContext(K.askContext(zslice, zq, LD, undefined, undefined, zl.lookup)));
    const ZLK = q => JSON.stringify({ kind: 'lookup', message: 'Looking at your open decisions.', lookup: { tool: 'decisions', query: q } });
    check('a decisions lookup reply is taken for all, or for an open project it was given — not a private one', eq(K.checkAskReply(ZLK('all'), zw, zslice, LD), { kind: 'lookup', tool: 'decisions', query: 'all' })
      && eq(K.checkAskReply(ZLK('pjShed'), zw, zslice, LD), { kind: 'lookup', tool: 'decisions', query: 'pjShed' }) && K.checkAskReply(ZLK('pjHid'), zw, zslice, LD) === null);
    const ZANS = (m, sources) => JSON.stringify({ kind: 'answer', message: m, items: [], action: null, sources });
    const za = K.checkAskReply(ZANS('“Which door?” has been open since 1 November. Tin is the best option. Try adding a con to Felt.', ['dOld', 'aOpen', 'dHid', 'dMadeUp']), zw, zslice, LD, undefined, zl.lookup);
    check('after the look: the decisions and things to check it used, as links to their tabs (never a private or made-up one)', eq(za?.sources, [{ id: 'dOld', title: 'Which door?', href: '#projects/p/pjShed/decisions' }, { id: 'aOpen', title: 'People want oat milk', href: '#projects/p/pjCafe/model' }]), za?.sources);
    check('…and a sentence that picks an option is left out (the choice stays yours), the rest kept', za?.message === '“Which door?” has been open since 1 November. Try adding a con to Felt.' && za.changed.some(c => /yours to decide/.test(c)), za);
    const zj = K.checkAskReply(ZANS('“Which door?” has been open since 1 November. This one looks likely true. I recommend adding a con to Felt.', ['dOld']), zw, zslice, LD, undefined, zl.lookup);
    check('…a sentence judging whether something will turn out is left out too, with its own note — and "I recommend adding…" (a next step) stays', zj?.message === '“Which door?” has been open since 1 November. I recommend adding a con to Felt.'
      && zj.changed.some(c => /for you to find out/.test(c)) && !zj.changed.some(c => /yours to decide/.test(c)), zj);
    const zf = K.checkAskReply(ZANS('Tin is the best option.', []), zw, zslice, LD, undefined, zl.lookup);
    check('…and a message that was nothing but a pick becomes a plain line', zf?.message === 'Here’s what’s still open — each choice is yours.', zf);
    const ZPRO = JSON.stringify({ kind: 'add', message: 'Points to weigh.', items: [{ type: 'pro', title: 'Cheap', optionId: 'dRoofa' }, { type: 'con', title: 'Noisy in rain', optionId: 'dRoofb' }] });
    check('…and no pros or cons can be added from the look (only on a decision\'s own page)', !K.checkAskReply(ZPRO, zw, zslice, LD, undefined, zl.lookup)?.items?.length);
    const z5 = K.normalize({ ...zw, projects: { ...zw.projects, items: zw.projects.items.map(p => (p.id === 'pjShed' ? { ...p, decisions: [DC('dFive', 'Which colour?', { options: ['Red', 'Blue', 'Green', 'Grey', 'Gold'].map((t, i) => ({ id: 'c' + i, text: t, pros: i ? [] : ['x'], cons: [] })) })] } : p)) } });
    const l5 = K.decisionsLookup(z5, 'pjShed').lookup.decisions[0];
    check('…at most four options (the most a decision has), and gaps only for those', eq(l5.options, ['Red', 'Blue', 'Green', 'Grey']) && l5.gaps.length === 4 && !l5.gaps.some(g => g.includes('Gold')), l5);
    const zempty = K.decisionsLookup(zw, 'pjCafe');
    check('…and for one project with no decisions open, the line still names it', K.lookupLine({ ...zempty.lookup, mustBeTrue: [], found: { decisions: 0, mustBeTrue: 0 } }, 0, 'Corner café') === 'Looked at the open decisions in “Corner café”: no decisions open.');
    const zp1 = K.checkAskReply(K.mockAsk(K.askContext(zslice, zq, LD)), zw, zslice, LD);
    const zp2 = zp1?.kind === 'lookup' && zp1.tool === 'decisions' ? K.decisionsLookup(zw, zp1.query) : null;
    const zp3 = zp2 && K.checkAskReply(K.mockAsk(K.askContext(zslice, zq, LD, undefined, undefined, zp2.lookup)), zw, zslice, LD, undefined, zp2.lookup);
    check('practice mode, end to end: "Which decisions am I putting off?" looks, then says how many and the oldest', zp1?.query === 'all' && zp3?.kind === 'answer' && zp3.message.includes('2 decisions are open — the oldest is “Which door?” (Garden shed)') && eq(zp3.sources.map(x => x.id), ['dOld', 'dRoof']), [zp1, zp3]);
    check('the preview says it may look at your open decisions, and what it would send', K.askPreview(K.askContext(zslice, zq, LD)).all.some(x => x.label === 'If it needs to: your open decisions' && x.lines.join(' ').includes('never your reasons')));
    // "What you're waiting on" (v21): tasks marked as waiting, oldest wait first — never who or what, never a private project's.
    const WT = (id, title, waiting, x = {}) => TI2(id, title, { waiting, ...x });
    const ww = K.normalize({ ...pw, tasks: { ...pw.tasks, items: [...pw.tasks.items,
      WT('tkW1', 'Ask about the armchair', { on: 'WHO-PRIYA', since: '2026-11-02', until: '2026-11-09', chaseTaskId: 'tkChase' }, { projectId: 'pjShed' }),
      WT('tkW2', 'Deposit back', { on: 'WHO-LANDLORD', since: '2026-10-28', until: null }), WT('tkW3', 'Hidden wait', { on: 'WHO-HIDDEN', since: '2026-10-01', until: null }, { projectId: 'pjHid' }),
      WT('tkW4', 'Finished wait', { on: 'WHO-DONE', since: '2026-10-01', until: null }, { done: true, doneOn: '2026-11-01' }), TI2('tkChase', 'Chase: Ask about the armchair', { projectId: 'pjShed' })] } });
    const wl = K.waitingLookup(ww, 'all'), ws = JSON.stringify(wl.lookup);
    check('what you\'re waiting on: the waiting tasks, oldest wait first, with project, since, the day expected and whether chased', eq(wl.lookup.tasks.map(t => t.id), ['tkW2', 'tkW1']) && wl.lookup.tasks[1].chased && !wl.lookup.tasks[0].chased
      && wl.lookup.tasks[1].project === 'Garden shed' && wl.lookup.tasks[0].project === null && wl.lookup.tasks[0].projectId === null && wl.lookup.tasks[1].until === '2026-11-09' && wl.lookup.found === 2, wl.lookup.tasks);
    check('…never who or what it waits on, never a private project\'s or a finished task (the private one counted here only)', !/WHO-|Hidden wait|Finished wait/.test(ws) && wl.leftOut === 1 && !('leftOut' in wl.lookup), [ws.slice(0, 200), wl.leftOut]);
    check('…one project by its id; never a private or missing one', eq(K.waitingLookup(ww, 'pjShed').lookup.tasks.map(t => t.id), ['tkW1']) && K.waitingLookup(ww, 'pjHid') === null && K.waitingLookup(ww, 'pjNope') === null);
    check('what the panel says: how many, and the private one left out', K.lookupLine(wl.lookup, wl.leftOut) === 'Looked at what you’re waiting on: 2 tasks — one in a private project left out.', K.lookupLine(wl.lookup, wl.leftOut));
    check('…and when more were found than sent, which ones went', K.lookupLine({ ...wl.lookup, found: 11 }, 0) === 'Looked at what you’re waiting on: 11 tasks (the oldest 2 sent).', K.lookupLine({ ...wl.lookup, found: 11 }, 0));
    const wslice = K.askSlice(ww, '#today', LD), wq = 'What am I waiting on?';
    check('the server\'s check accepts a request carrying them', K.checkAskContext(K.askContext(wslice, wq, LD, undefined, undefined, wl.lookup)));
    const WLK = q => JSON.stringify({ kind: 'lookup', message: 'Looking at what you’re waiting on.', lookup: { tool: 'waiting', query: q } });
    check('a waiting lookup reply is taken for all, or an open project it was given — not a private one', eq(K.checkAskReply(WLK('all'), ww, wslice, LD), { kind: 'lookup', tool: 'waiting', query: 'all' }) && K.checkAskReply(WLK('pjHid'), ww, wslice, LD) === null);
    const WANS = (m, sources) => JSON.stringify({ kind: 'answer', message: m, items: [], action: null, sources });
    const wa = K.checkAskReply(WANS('“Deposit back” has been waiting since 28 October. That is 13 days now. “Ask about the armchair” was expected on 9 November.', ['tkW2', 'tkW3', 'tkW1']), ww, wslice, LD, undefined, wl.lookup);
    check('after the look: the tasks it named, as links (never a private one) — and a sentence counting days left out (a wait is about its day)', eq(wa?.sources, [{ id: 'tkW2', title: 'Deposit back', href: '#today/tasks/tkW2' }, { id: 'tkW1', title: 'Ask about the armchair', href: '#today/tasks/tkW1' }])
      && wa.message === '“Deposit back” has been waiting since 28 October. “Ask about the armchair” was expected on 9 November.' && wa.changed.some(c => /count of days/.test(c)), wa);
    check('…and "overdue" never stands: a message that was only that becomes a plain line', K.checkAskReply(WANS('The armchair one is overdue.', []), ww, wslice, LD, undefined, wl.lookup)?.message === 'Here’s what you’re waiting on.');
    const wc = K.checkAskReply(JSON.stringify({ kind: 'answer', message: '“Deposit back” is still waiting, since 28 October.', items: [{ type: 'task', title: 'Chase: Deposit back', minutes: 5, category: 'admin', projectId: null }], action: null }), ww, wslice, LD, undefined, wl.lookup);
    // (1.75.1) With no open projects, a wait needn't be in one: Today still offers the waiting look (and decisions), not a
    // project's; Finance still offers neither.
    const nw = K.normalize({ ...ww, projects: { ...ww.projects, items: [] } });
    check('with no open projects, Today still offers what you\'re waiting on and your decisions (not a project); Finance neither', eq(K.askContext(K.askSlice(nw, '#today', LD), 'x', LD).can, ['day', 'decisions', 'waiting', 'study', 'search'])
      && eq(K.askContext(K.askSlice(nw, '#finance', LD), 'x', LD).can, ['day', 'study', 'search']) && K.waitingLookup(nw, 'all').lookup.tasks.some(t => t.id === 'tkW2'));
    check('…a "Chase:" task it offers comes as one to tick', wc?.kind === 'add' && wc.items.length === 1 && wc.items[0].title === 'Chase: Deposit back' && !wc.items[0].already, wc);
    // The tone filter: tied to the wait — "the late post" and "behind the sofa" stay; counts in words and a fortnight go.
    const tone = m => K.checkAskReply(WANS(`“Deposit back” is waiting since 28 October. ${m}`, []), ww, wslice, LD, undefined, wl.lookup)?.message;
    check('…the tone filter keeps ordinary words ("the late post", "behind the sofa", "a week from Friday") and drops spelled-out counts and "running late"',
      ['The late post may explain it.', 'Check behind the sofa.', 'Expected a week from Friday.'].every(m => tone(m).endsWith(m)) && ['It has been thirteen days.', 'About a fortnight so far.', 'A couple of days more.', 'It is running late.'].every(m => !tone(m).includes(m)));
    const WCH = JSON.stringify({ kind: 'answer', message: 'Two waits could use a nudge.', action: null, items: [{ type: 'task', title: 'Chase: Ask about the armchair', minutes: 5, category: 'admin', projectId: 'pjShed' }, { type: 'task', title: 'Chase: Deposit back', minutes: 5, category: 'admin', projectId: null }] });
    const wch = K.checkAskReply(WCH, ww, wslice, LD, undefined, wl.lookup);
    check('…a "Chase:" offer is tied to its wait, and one already chased comes back unticked', wch?.items?.[0].chaseFor === 'tkW1' && wch.items[0].already && wch.items[1].chaseFor === 'tkW2' && !wch.items[1].already, wch?.items);
    localStorage.clear(); localStorage.setItem('myday.data.v4', JSON.stringify(ww)); K.boot();
    const wu = K.addAskItems([wch.items[1]]), wd = K.getSnapshot().data, chase = wd.tasks.items.find(t => t.title === 'Chase: Deposit back');
    check('…and added, it is Chase it\'s own: 5 minutes, linked as that wait\'s chase (so the next look says chased)', !!chase && chase.minutes === 5 && wd.tasks.items.find(t => t.id === 'tkW2').waiting.chaseTaskId === chase.id
      && K.waitingLookup(wd, 'all').lookup.tasks.find(t => t.id === 'tkW2').chased && eq(wu.tasks, [chase.id]), [chase, wu]);
    const wp1 = K.checkAskReply(K.mockAsk(K.askContext(wslice, wq, LD)), ww, wslice, LD);
    const wp2 = wp1?.kind === 'lookup' && wp1.tool === 'waiting' ? K.waitingLookup(ww, wp1.query) : null;
    const wp3 = wp2 && K.checkAskReply(K.mockAsk(K.askContext(wslice, wq, LD, undefined, undefined, wp2.lookup)), ww, wslice, LD, undefined, wp2.lookup);
    check('practice mode, end to end: "What am I waiting on?" looks, then says how many and the oldest', wp1?.query === 'all' && wp3?.kind === 'answer' && wp3.message.includes('2 tasks are waiting — the oldest is “Deposit back”, since 2026-10-28') && eq(wp3.sources.map(x => x.id), ['tkW2', 'tkW1']), [wp1, wp3]);
    check('the preview says it may look at what you\'re waiting on, never who', K.askPreview(K.askContext(wslice, wq, LD)).all.some(x => x.label === 'If it needs to: what you’re waiting on' && x.lines.join(' ').includes('Never who or what')));
    // "What to study next" (v22): the same next steps as Today's Study card, focus first — no ids, links or open steps.
    const sw = K.normalize(K.freshState()), sk = K.studyLookup(sw, LD), so = K.learningOptions(sw), sj = JSON.stringify(sk.lookup);
    check('what to study next: the Today card\'s options, focus first — subject, lesson, reason, minutes, length', sk.lookup.options.length === Math.min(3, so.length) && sk.lookup.options.length >= 2
      && sk.lookup.options.every((o, i) => o.subject === so[i].subject && o.title === so[i].title && o.why === so[i].aiWhy && o.minutes === so[i].minutes && o.reviseFirst === !!so[i].revise) && Number.isInteger(sk.lookup.revisionDue), sk.lookup.options);
    check('…never an id, a link or an open session\'s steps (the links stay on the device)', !/"(href|lessonId|attemptId|steps|courseId|taskId)"/.test(sj) && !sj.includes('#study') && sk.hrefs[so[0].subject] === so[0].href && sk.leftOut === 0, sj.slice(0, 200));
    check('what the panel says: the focus first, then the others', K.lookupLine(sk.lookup, 0) === `Looked at what to study next: ${so[0].label} first, then ${so.slice(1, 3).map(o => o.label).join(' and ')}${sk.lookup.revisionDue ? ` — ${sk.lookup.revisionDue === 1 ? 'one thing' : `${sk.lookup.revisionDue} things`} to revise` : ''}.`, K.lookupLine(sk.lookup, 0));
    const sTo = K.askSlice(sw, '#today', LD), sSt = K.askSlice(sw, '#study', LD);
    check('the server\'s check accepts a request carrying them', K.checkAskContext(K.askContext(sTo, 'What should I study?', LD, undefined, undefined, sk.lookup)));
    check('offered from Today (and Finance), but not on Study, which sends its own', K.askContext(sTo, 'x', LD).can.includes('study') && !K.askContext(sSt, 'x', LD).can.includes('study') && K.askContext(K.askSlice(sw, '#finance', LD), 'x', LD).can.includes('study'));
    const SLK = q => JSON.stringify({ kind: 'lookup', message: 'Looking at what to study next.', lookup: { tool: 'study', query: q } });
    check('a study lookup reply is taken as one for all of it, whatever words came with it', eq(K.checkAskReply(SLK('all'), sw, sTo, LD), { kind: 'lookup', tool: 'study', query: 'all' }) && eq(K.checkAskReply(SLK('what to study'), sw, sTo, LD), { kind: 'lookup', tool: 'study', query: 'all' }));
    const sa = K.checkAskReply(JSON.stringify({ kind: 'answer', message: 'Your focus is next, about twenty minutes.', items: [], action: null, sources: [so[1].subject, so[0].subject, 'astrology'] }), sw, sTo, LD, undefined, sk.lookup, sk.hrefs);
    check('after the look: the subjects it named, as links to their next step (never a made-up one)', eq(sa?.sources, [{ id: so[1].subject, title: `${so[1].label}: ${so[1].title}`, href: so[1].href }, { id: so[0].subject, title: `${so[0].label}: ${so[0].title}`, href: so[0].href }]), sa?.sources);
    const sp1 = K.checkAskReply(K.mockAsk(K.askContext(sTo, 'What should I study next?', LD)), sw, sTo, LD);
    const sp2 = sp1?.kind === 'lookup' && sp1.tool === 'study' ? K.studyLookup(sw, LD) : null;
    const sp3 = sp2 && K.checkAskReply(K.mockAsk(K.askContext(sTo, 'What should I study next?', LD, undefined, undefined, sp2.lookup)), sw, sTo, LD, undefined, sp2.lookup, sp2.hrefs);
    check('practice mode, end to end: "What should I study next?" from Today looks, then names the focus\'s next step, linked', sp1?.query === 'all' && sp3?.kind === 'answer' && sp3.message.includes(`“${so[0].title}” (${so[0].label})`) && sp3.sources?.[0]?.href === so[0].href, [sp1, sp3]);
    check('the preview says it may look at what to study next', K.askPreview(K.askContext(sTo, 'x', LD)).all.some(x => x.label === 'If it needs to: what to study next' && x.lines.join(' ').includes('No percentages')));
  }

  console.log('\n[Lookups: across MyDay] Ask MyDay looks across MyDay (v24; specs/ai-tools.md §6.11)');
  {
    const SD = '2026-11-10', at = `${SD}T08:00`;
    const P = (id, title, x = {}) => ({ id, title, summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at, ...x });
    const T = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null, ...x });
    const N = (id, title, text, x = {}) => ({ id, title, text, categoryId: 'inbox', createdAt: at, updatedAt: at, ...x });
    const world = () => {
      const d = K.freshState();
      d.patterns.prefs.aiNotes = false;
      d.projects.items = [
        P('pjShed', 'Garden shed', { summary: 'Wired by the electrician', outcome: 'OUTCOMEWORD', finishedWhen: 'FINISHWORD', leftOff: { text: 'LEFTWORD', on: SD }, tools: ['research'],
          milestones: [{ id: 'msE', title: 'Electrician signs off', reachedOn: null, aim: null }, { id: 'msZ', title: 'Zinc roof on', reachedOn: SD, aim: null }],
          decisions: [{ id: 'dcE', question: 'Which electrician to book?', options: [{ id: 'oD', text: 'Dave the sparky', pros: ['PROWORD'], cons: [] }], chosen: null, why: 'WHYWORD', decidedOn: null, createdAt: at, updatedAt: at }],
          resources: [{ id: 'rsE', url: 'https://example.com/r', title: 'RESWORD shop', note: '', addedOn: SD }] }),
        P('pjOld', 'Old kitchen electrician job', { status: 'paused' }),
        P('pjHush', 'Hush electrician plan', { private: true, summary: 'electrician', commitmentIds: ['cmHush'], milestones: [{ id: 'msH', title: 'Hush electrician milestone', reachedOn: null, aim: null }] }),
      ];
      d.research.items = [{ id: 'rqE', type: 'question', projectId: 'pjShed', text: 'RESEARCHWORD electrician', conclusion: '', answeredOn: null, createdAt: at, updatedAt: at }];
      d.tasks.lists = [{ id: 'tlH', name: 'Home jobs' }];
      d.tasks.items = [
        T('tkRing', 'Ring the electrician', { listId: 'tlH', notes: 'His number is on the van' }),
        T('tkPaid', 'Pay the electrician', { done: true, doneOn: SD }),
        T('tkWire', 'Wire the shed', { projectId: 'pjShed', steps: [{ id: 'st1', text: 'Buy cable for the electrician', done: false }] }),
        T('tkCert', 'Get the certificate', { waiting: { on: 'ZEDWORD', since: SD, until: null } }),
        T('tkHush', 'Hush electrician task', { projectId: 'pjHush' }),
        T('tkZGone', 'Zinc paint', { letGoOn: SD }), T('tkZLong', 'Zinc ' + 'x'.repeat(200)),
      ];
      d.notes.items = [N('nZ', 'Zinc offcuts', '', { projectId: 'pjShed' }), N('nEl', 'Electrician', 'Dave 07700 900123 TEXTWORD'), N('nUntitled', '', 'electrician spur idea'), N('nPriv', 'Private electrician', 'x', { private: true }), N('nHush', 'Hush electrician note', 'x', { projectId: 'pjHush' })];
      d.commitments = [{ id: 'cmSoon', kind: 'appointment', title: 'Electrician visit', start: '2026-11-12T10:00', end: '2026-11-12T11:00' }, { id: 'cmPast', kind: 'work', title: 'Electrician quote', start: '2026-11-01T09:00', end: '2026-11-01T10:00' },
        { id: 'cmHush', kind: 'appointment', title: 'Electrician hush', start: '2026-11-13T09:00', end: '2026-11-13T10:00' }];
      d.study.topics = [{ id: 'tpE', title: 'Electrics' }];
      d.study.stages = [{ id: 'stE', title: 'Basics', topicId: 'tpE', courses: [{ id: 'crE', title: 'Home electrics', url: '', minutes: 0, listId: null, archived: false, modules: [{ id: 'mdE', title: 'Circuits', sections: [{ id: 'scE', title: 'Ring mains', tasks: [
        { id: 'stkE', title: 'Watch the electrician video', minutes: 20, url: '', kind: 'learn', note: 'STUDYNOTEWORD', done: false, doneOn: null },
        { id: 'stkZ', title: 'Zinc reading', minutes: 20, url: '', kind: 'learn', note: '', done: true, doneOn: SD }] }] }] },
        { id: 'crZ', title: 'Zinc course', url: '', minutes: 0, listId: null, archived: true, modules: [] }] }];
      d.study.concepts = [{ id: 'cpE', title: 'CONCEPTWORD', taskIds: [], createdOn: SD, kind: 'written', prompt: 'p', answer: 'a', explanation: '', choices: [], correct: null, hint: '', source: '', note: '', review: { reps: 0, interval: 0, lapses: 0, due: null } }];
      d.study.sessions = [{ id: 'ssE', courseId: 'crE', taskId: 'stkE', title: 'Watch', date: SD, startedAt: at, plannedMin: 20, short: false, status: 'done', runningSince: null, activeMs: 0, endedAt: at, checkin: { conceptIds: [], clarity: 'partly', takeaway: 'CHECKINWORD', question: '', note: '' }, taskDone: null, todayUid: null }];
      d.reading.books = [{ id: 'bkE', title: 'Wiring explained', author: 'Ann Volt', pages: null, page: 0, notes: [{ id: 'bn', page: 1, text: 'BOOKNOTEWORD', addedOn: SD }], addedOn: SD, finishedOn: null },
        { id: 'bkZ', title: 'Zinc memoir', author: '', pages: null, page: 0, notes: [], addedOn: SD, finishedOn: SD }];
      d.arabic.words = [{ id: 'kwE', ar: 'كِتَاب', meaning: 'KEPTWORD', note: 'KEPTNOTEWORD', addedOn: SD, recognise: { reps: 0, interval: 0, lapses: 0, due: SD }, write: null }];
      d.arabic.lessons = [{ id: 'lesson.arabic-fusha-register', revisit: { since: SD, what: 'REVISITWORD' } }];
      d.arabic.attempts = [{ id: 'aaE', lessonId: 'lesson.arabic-fusha-register', curriculumVersion: '1', variant: 'standard', startedAt: at, finishedAt: null, help: 'none', practised: [], answers: { q1: 'ANSWERWORD' }, revealed: [], revisit: '' }];
      d.cybersecurity.attempts = [{ id: 'caE', activityId: 'x', startedAt: at, submittedAt: null, evidence: 'NOTEBOOKWORD', answers: {}, resumePoint: '' }];
      d.cybersecurity.portfolio = [{ id: 'pfE', attemptId: 'caE', activityId: 'x', title: 'PORTFOLIOWORD', evidence: 'e', note: '', reviewedOn: SD }];
      d.finance.debts = [{ id: 'dbE', direction: 'owe', person: 'FINWORD', amount: 1, note: '', since: SD }];
      d.health.workout.exercises = [{ id: 'exE', name: 'HEALTHWORD', archived: false }];
      return d;
    };
    const COURSES = K.courseIndex(), look = (q, d = world()) => K.searchLookup(d, q, COURSES, SD);
    const el = look('electrician'), f = el.lookup.found, kinds = f.map(x => x.kind), byTitle = t => f.find(x => x.title === t);
    check('across MyDay, "electrician" finds tasks (by title, notes and steps), projects, milestones, decisions, notes, the calendar and study, in that order', eq([...new Set(kinds)], ['task', 'project', 'milestone', 'decision', 'note', 'appointment', 'work', 'study task']) && !!byTitle('Wire the shed'), f.map(x => [x.ref, x.kind, x.title]));
    check('…each with its reference, name, where it is and its state; its link stays on the device', eq(f.map(x => x.ref), f.map((_, i) => `r${i + 1}`)) && byTitle('Wire the shed').where === 'in “Garden shed”' && byTitle('Pay the electrician').state === 'done'
      && byTitle('Old kitchen electrician job').state === 'paused' && byTitle('Electrician quote').state === 'past' && byTitle('Electrician visit').where.endsWith(', 10:00') && el.hrefs.r1 === '#today/tasks/tkRing' && !JSON.stringify(el.lookup).includes('#'), f);
    const z = look('zinc').lookup.found, zOf = t => z.find(x => x.title.startsWith(t));
    check('each kind\'s state: a task let go, a milestone reached, a study task done, a course archived, a book finished', zOf('Zinc paint')?.state === 'let go' && zOf('Zinc roof on')?.state === 'done' && zOf('Zinc reading')?.state === 'done'
      && zOf('Zinc course')?.state === 'archived' && zOf('Zinc memoir')?.state === 'finished' && zOf('Zinc memoir')?.where === null, z);
    check('…a note\'s "where" is its project; a long name is cut to 120 characters on a whole character', zOf('Zinc offcuts')?.where === 'in “Garden shed”' && zOf('Zinc xx')?.title.length === 120 && zOf('Zinc xx')?.title.endsWith('…'), z.map(x => [x.title.slice(0, 20), x.where]));
    check('…open things before done ones in each part', kinds.indexOf('task') === 0 && f.findIndex(x => x.title === 'Pay the electrician') > f.findIndex(x => x.title === 'Wire the shed'));
    check('…and "the electrician\'s number" finds the task with his number in its notes (a possessive finds the plain word)', look("electrician's number").lookup.found.some(x => x.title === 'Ring the electrician'));
    check('a task by its notes or a step; a decision by an option; a book by its author; a topic and a course by name', look('van number').lookup.found.some(x => x.title === 'Ring the electrician') && look('cable').lookup.found.some(x => x.title === 'Wire the shed')
      && look('sparky').lookup.found.some(x => x.kind === 'decision') && look('ann volt').lookup.found.some(x => x.kind === 'book' && x.where === 'Ann Volt') && look('electrics').lookup.found.some(x => x.kind === 'topic') && look('electrics').lookup.found.some(x => x.kind === 'course'));
    const held = ['ZEDWORD', 'OUTCOMEWORD', 'FINISHWORD', 'LEFTWORD', 'RESWORD', 'RESEARCHWORD', 'PROWORD', 'WHYWORD', 'STUDYNOTEWORD', 'CONCEPTWORD', 'CHECKINWORD', 'BOOKNOTEWORD', 'KEPTWORD', 'KEPTNOTEWORD', 'REVISITWORD', 'ANSWERWORD', 'NOTEBOOKWORD', 'PORTFOLIOWORD', 'FINWORD', 'HEALTHWORD'];
    const matchedHeld = held.filter(w => look(w).lookup.total > 0 || look(w).leftOut > 0);
    check('it never matches on what isn\'t sent (who a task waits on, outcome, where you left off, links, research, pros, reasons, a study task\'s note, revision cards, check-ins, book notes, kept words, revision notes, answers, the notebook and portfolio, Finance, Health)', matchedHeld.length === 0, matchedHeld);
    const kw = look('كتاب');
    check('…and the kept Arabic word isn\'t found by its Arabic either (Keep a word: never sent to AI); only the course\'s own word is', !kw.lookup.found.some(x => x.title === 'كِتَاب' || x.kind !== 'course word') && !JSON.stringify(kw.lookup).includes('KEPT') && kw.leftOut === 0, kw.lookup.found);
    const hush = look('hush');
    check('nothing private: a private project, its task, note and appointment, and a private note never go — counted only here, a private project once however many of its parts matched', hush.lookup.total === 0 && hush.leftOut === 4 && !/hush/i.test(JSON.stringify(el.lookup)) && !JSON.stringify(el.lookup).includes('Private electrician') && el.leftOut === 5, [hush, el.leftOut]);
    check('notes by title only while AI help with notes is off (an untitled note isn\'t found by its first line)', el.lookup.titlesOnly && look('textword').lookup.total === 0 && !f.some(x => x.title === 'Untitled note'));
    const on = world(); on.patterns.prefs.aiNotes = true;
    const tx = look('textword', on), sp = look('spur', on);
    check('…with it on, its text is searched — but only the name goes, never the text', tx.lookup.total === 1 && tx.lookup.found[0].title === 'Electrician' && !JSON.stringify(tx.lookup).includes('07700') && !tx.lookup.titlesOnly && sp.lookup.found[0]?.title === 'electrician spur idea', [tx.lookup, sp.lookup]);
    check('the course lessons and words: a real lesson by title (where: its course and module), a real word by its Arabic without vowels, each with where', look('What Fuṣḥā means').lookup.found.some(x => x.kind === 'lesson' && x.where === 'Arabic · Orientation, placement and learning habits') && look('مرحبا').lookup.found.some(x => x.kind === 'course word' && x.title.includes('hello') && x.where === 'Arabic'));
    const many = world(); many.tasks.items = Array.from({ length: 20 }, (_, i) => T('tkM' + i, 'Batch job ' + i));
    const ml = look('batch job', many);
    check('at most 12 go, and "total" says how many matched', ml.lookup.found.length === 12 && ml.lookup.total === 20 && Object.keys(ml.hrefs).length === 12);
    check('what the panel says above the answer', K.lookupLine(el.lookup, el.leftOut) === `Looked across MyDay for “electrician”: ${el.lookup.total} things — 5 private things left out; notes by title only, as AI help with notes is off.` && K.lookupLine(ml.lookup, 0) === 'Looked across MyDay for “batch job”: 20 things (the first 12 sent) — notes by title only, as AI help with notes is off.'
      && K.lookupLine(look('zebra', on).lookup, 0) === 'Looked across MyDay for “zebra”: nothing matched.' && K.lookupLine(hush.lookup, 4) === 'Looked across MyDay for “hush”: none that could be sent — 4 private things left out; notes by title only, as AI help with notes is off.', [K.lookupLine(el.lookup, el.leftOut), K.lookupLine(hush.lookup, 4)]);
    const nocourses = K.searchLookup(on, 'zebra', null, SD), ncline = K.lookupLine(nocourses.lookup, nocourses.leftOut, undefined, { more: nocourses.more });
    check('…and when the courses couldn\'t be loaded, it says they weren\'t searched (with them, nothing more is said)', ncline === 'Looked across MyDay for “zebra”: nothing matched — the courses’ lessons and words couldn’t be searched just now.'
      && K.lookupLine(look('zebra', on).lookup, 0, undefined, { more: look('zebra', on).more }) === 'Looked across MyDay for “zebra”: nothing matched.', ncline);
    const d = world(), sl = K.askSlice(d, '#today', SD), Q = 'Where did I put the electrician\'s number?';
    const c1 = K.askContext(sl, Q, SD), c2 = K.askContext(sl, Q, SD, undefined, undefined, el.lookup);
    check('the request offers it (not your notes) and the server\'s check takes both requests', c1.can.includes('search') && !c1.can.includes('notes') && K.checkAskContext(c1) && K.checkAskContext(c2));
    check('…but not a lookup carrying an id, a link, text or more than 12', !K.checkAskContext({ ...c2, lookup: { ...el.lookup, found: [{ ...el.lookup.found[0], id: 'tkRing' }] } }) && !K.checkAskContext({ ...c2, lookup: { ...el.lookup, found: [{ ...el.lookup.found[0], href: '#today' }] } })
      && !K.checkAskContext({ ...c2, lookup: { ...el.lookup, found: [{ ...el.lookup.found[0], text: 'x' }] } }) && !K.checkAskContext({ ...c2, lookup: { ...ml.lookup, found: [...ml.lookup.found, { ...ml.lookup.found[0], ref: 'r13' }] } })
      && !K.checkAskContext({ ...c2, lookup: { ...el.lookup, found: [el.lookup.found[0], el.lookup.found[0]] } }));
    const ANS = refs => JSON.stringify({ kind: 'answer', message: 'Your task “Ring the electrician” says where.', items: [], action: null, sources: refs });
    const a = K.checkAskReply(ANS(['r1', 'r99', 'r1']), d, sl, SD, undefined, el.lookup, el.hrefs);
    check('an answer\'s sources become links to what was found (once each; a reference it wasn\'t given is dropped)', eq(a.sources, [{ id: 'r1', title: 'Ring the electrician', href: '#today/tasks/tkRing' }]), a.sources);
    const p1 = K.checkAskReply(K.mockAsk(c1), d, sl, SD);
    const p2 = p1?.kind === 'lookup' ? K.searchLookup(d, p1.query, COURSES, SD) : null;
    const p3 = p2 && K.checkAskReply(K.mockAsk(K.askContext(sl, Q, SD, undefined, undefined, p2.lookup)), d, sl, SD, undefined, p2.lookup, p2.hrefs);
    check('practice mode, end to end: "Where did I put the electrician\'s number?" looks across MyDay, then names what it found, linked', p1?.tool === 'search' && /electrician/.test(p1.query) && p3?.kind === 'answer' && p3.sources?.length > 0 && p3.sources.every(x => x.href?.startsWith('#')), [p1, p3]);
    check('…and "What did I write about…" is a look across MyDay too', K.checkAskReply(K.mockAsk(K.askContext(sl, 'What did I write about the electrician?', SD)), d, sl, SD)?.tool === 'search');
    check('the preview says it may look across MyDay, and what it never sends', K.askPreview(c1).all.some(x => x.label === 'If it needs to: across MyDay' && x.lines.join(' ').includes('Never what one says') && x.lines.join(' ').includes('kept words')));
  }

  console.log('\n[Privacy] Nothing private reaches AI, by any feature (one filter: app/src/ai/reach.ts)');
  {
    // One made-up world with something secret in every place the rules hold back, sent through every AI request.
    const PD = '2026-11-10', at = `${PD}T08:00`;
    K.setClock(`${PD}T09:30`);
    const w = K.freshState();
    w.patterns.prefs.aiNotes = true; // notes' text may go, so only the rules keep the private ones back
    const PJ = (id, title, summary, x = {}) => ({ id, title, summary, stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: at, updatedAt: at, ...x });
    const OLD = '2026-10-20T08:00', week = '2026-11-03';
    const DEC = (id, question, opt) => ({ id, question, options: [{ id: id + 'o', text: opt, pros: [opt + '-PRO'], cons: [] }], chosen: null, why: '', decidedOn: null, createdAt: OLD, updatedAt: OLD });
    const MODEL = (problem, belief, found) => ({ problem, who: problem + '-WHO', how: problem + '-HOW', assumptions: [{ id: 'as' + problem.length, text: belief, state: 'open', found, checkedOn: null, taskId: null }] });
    // A business idea's money and experiments never go (specs/projects-business-tools.md): every word of them secret.
    const ML = (id, x = {}) => ({ id, label: `SECRET-BIZMONEY-LINE-${id}`, dir: 'out', amount: 5, per: 'fixed', basis: 'guess', note: `SECRET-BIZMONEY-NOTE-${id}`, ...x });
    const BIZMONEY = { currency: 'USD', sale: 'order', saleValue: 30, perSale: [ML('l1', { dir: 'in', amount: 8, per: 'percent' })], monthly: [ML('m1')], startup: [ML('s1')], atSales: 600,
      forecast: { from: '2026-12', sales: [10, 20] }, actual: [{ month: '2026-12', sales: 9, in: 70, out: 80, note: 'SECRET-BIZMONEY-REAL' }] };
    w.projects.items = [
      PJ('pjSecret', 'SECRET-PROJECT', 'SECRET-SUMMARY', { private: true, commitmentIds: ['cSecret'], outcome: 'SECRET-OUTCOME', finishedWhen: 'SECRET-FINISHED', leftOff: { text: 'SECRET-LEFTOFF', at },
        template: 'business', model: MODEL('SECRET-PROBLEM', 'SECRET-BELIEF', 'SECRET-FOUND'), milestones: [{ id: 'mS', title: 'SECRET-MILESTONE', aim: null, reachedOn: null, createdAt: OLD }],
        decisions: [DEC('dS', 'SECRET-DECISION', 'SECRET-OPTION')], studyLinks: [{ kind: 'course', id: 'crX', title: 'SECRET-LINK', why: 'SECRET-WHY', addedOn: PD }],
        fileIds: ['flsecret0001'],
        resources: [{ id: 'rsS', title: 'SECRET-RES-TITLE', url: 'https://example.com/SECRET-RES-URL', note: 'SECRET-RES-NOTE', addedOn: PD }], updatedAt: OLD }),
      PJ('pjOpen', 'Garden shed', 'A shed for the bikes', { outcome: 'SECRET-OUTCOME-OPEN', finishedWhen: 'SECRET-FINISHED-OPEN', leftOff: { text: 'SECRET-LEFTOFF-OPEN', at },
        template: 'business', model: { ...MODEL('Bikes get wet', 'Fits the garden', 'SECRET-FOUND-OPEN'), money: BIZMONEY }, decisions: [DEC('dO', 'Which wood?', 'Larch')],
        studyLinks: [{ kind: 'course', id: 'crY', title: 'Carpentry basics', why: 'SECRET-WHY-OPEN', addedOn: PD }],
        fileIds: ['flsecret0002'],
        resources: [{ id: 'rsO', title: 'SECRET-RES-TITLE-OPEN', url: 'https://example.org/SECRET-RES-URL-OPEN', note: 'SECRET-RES-NOTE-OPEN', addedOn: PD }] }),
      PJ('pjCase', 'Deposit dispute', 'Getting the deposit back', { template: 'case', case: {
        timeline: [{ id: 'tl1', date: '2026-10-01', about: false, title: 'SECRET-TIMELINE', details: 'SECRET-TIMELINE-DETAILS', source: 'mine', evidenceIds: [], issueIds: [], createdAt: OLD }],
        evidence: [{ id: 'ev1', title: 'SECRET-EVIDENCE', kind: 'document', date: null, where: 'SECRET-WHERE', status: 'have', notes: '', issueIds: [], createdAt: OLD }],
        issues: [{ id: 'is1', title: 'SECRET-ISSUE', status: 'claiming', notes: '', createdAt: OLD }] } }),
    ];
    const TI = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 20, due: PD, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null, ...x });
    w.tasks.items = [TI('tkSecret', 'SECRET-TASK', { projectId: 'pjSecret', plannedOn: PD, planUid: 'pS', notes: 'SECRET-TASK-NOTES', steps: [{ id: 'tsS1', text: 'SECRET-STEP-PRIVATE', done: false }] }), TI('tkSecretDue', 'SECRET-DUE', { projectId: 'pjSecret', waiting: { on: 'SECRET-WAITER', since: '2026-11-01', until: '2026-11-08' } }),
      TI('tkSecretStuck', 'SECRET-STUCK', { projectId: 'pjSecret', due: week, postponed: 3, createdAt: OLD }), TI('tkSecretDone', 'SECRET-DONE', { projectId: 'pjSecret', done: true, doneOn: '2026-11-09' }),
      // An open project's task on today's plan: its steps and what it waits for stay on the device (specs/projects-steps.md);
      // the wait points at no task, so nothing else about it changes.
      TI('tkOpen', 'Order the felt', { projectId: 'pjOpen', plannedOn: PD, planUid: 'pO', waiting: { on: 'SECRET-PERSON', since: PD, until: null },
        steps: [{ id: 'tsO1', text: 'SECRET-STEP-OPEN', done: true }, { id: 'tsO2', text: 'SECRET-STEP-OPEN-2', done: false }], after: ['SECRET-AFTER-ID', 'tkOpenFirst', 'tkSecret'],
        deadline: { kind: 'firm', from: 'SECRET-DL-FROM', checkedBy: 'SECRET-DL-BY', checkedOn: PD } }), // (where a deadline's date comes from, and who checked it, never go: specs/projects-deadlines.md)
      TI('tkOpenFirst', 'Measure the shed base', { projectId: 'pjOpen', due: null })];
    const PT = (uid, title) => ({ uid, taskId: null, category: 'admin', title, minutes: 20, baseMinutes: 20, done: false, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null });
    w.days[PD] = { energy: 3, rest: false, builtAt: at, checkedIn: false, tasks: [PT('pS', 'SECRET-TASK'), PT('pO', 'Order the felt')] };
    w.context[PD] = { energy: 3, sleep: { start: null, end: null, estimatedHours: 7 } };
    const NT = (id, title, text, x = {}) => ({ id, categoryId: '', title, text, pinned: false, createdAt: at, updatedAt: '2026-11-01T08:00', ...x });
    w.notes.items = [NT('nPriv', 'SECRET-NOTE-TITLE', 'SECRET-NOTE-TEXT', { private: true }), NT('nInPriv', 'SECRET-PNOTE-TITLE', 'SECRET-PNOTE-TEXT', { projectId: 'pjSecret' }),
      NT('nOpen', 'Shed sizes', 'Two metres by three', { projectId: 'pjOpen', fileIds: ['flsecret0003'] }), NT('nLoose', 'Loose idea', 'Ask about a bike rack')];
    w.commitments = [{ id: 'cSecret', kind: 'appointment', title: 'SECRET-APPT', start: `${PD}T11:00`, end: `${PD}T12:00` }, { id: 'cOpen', kind: 'appointment', title: 'Dentist', start: `${PD}T15:00`, end: `${PD}T15:30` }];
    // Research (specs/projects-research.md): a question, a typed source and a finding in each project, every field secret.
    const RQ = (id, pj, n) => [{ id: 'rq' + id, type: 'question', projectId: pj, text: `SECRET-RQ-TEXT-${n}`, conclusion: `SECRET-RQ-CONCL-${n}`, answeredOn: PD, createdAt: at, updatedAt: at },
      { id: 'rs' + id, type: 'source', projectId: pj, ref: null, title: `SECRET-RS-TITLE-${n}`, from: `SECRET-RS-FROM-${n}`, on: PD, createdAt: at, updatedAt: at },
      { id: 'rf' + id, type: 'finding', projectId: pj, text: `SECRET-RF-TEXT-${n}`, limits: `SECRET-RF-LIMITS-${n}`, on: PD, sourceIds: ['rs' + id, 'rr' + id], about: [{ kind: 'question', id: 'rq' + id, stance: 'supports' }], createdAt: at, updatedAt: at },
      { id: 'rr' + id, type: 'source', projectId: pj, ref: { kind: 'resource', id: pj === 'pjSecret' ? 'rsS' : 'rsO' }, title: `SECRET-RS-REFTITLE-${n}`, from: '', on: null, createdAt: at, updatedAt: at }];
    const EX = (id, pj, n) => [{ id: 're' + id, type: 'experiment', projectId: pj, title: `SECRET-EXP-TITLE-${n}`, tests: [{ kind: 'question', id: 'rq' + id }], how: `SECRET-EXP-HOW-${n}`, expect: `SECRET-EXP-EXPECT-${n}`,
      status: 'done', startedOn: PD, doneOn: PD, result: `SECRET-EXP-RESULT-${n}`, conclusion: `SECRET-EXP-CONCL-${n}`, taskId: null, createdAt: at, updatedAt: at }];
    w.research = { items: [...RQ('sec001', 'pjSecret', 1), ...RQ('opn001', 'pjOpen', 2), ...EX('sec001', 'pjSecret', 1), ...EX('opn001', 'pjOpen', 2)] };
    for (const pj of w.projects.items) if (pj.id === 'pjSecret' || pj.id === 'pjOpen') pj.tools = ['research'];
    w.files = { items: [1, 2, 3].map(n => ({ id: 'flsecret000' + n, name: `SECRET-FILE-NAME-${n}.pdf`, type: 'application/pdf', size: 1234, sha256: 'd'.repeat(64), area: n === 3 ? 'note' : 'project', state: 'kept', addedOn: PD })) };
    // The Cybersecurity portfolio never reaches AI in any form: an entry's title, evidence and note, and its file.
    w.files.items.push({ id: 'flpfsecret01', name: 'SECRET-PF-FILE.png', type: 'image/png', size: 1234, sha256: 'd'.repeat(64), area: 'portfolio', state: 'kept', addedOn: PD });
    w.cybersecurity.portfolio = [{ id: 'pfsecret0001', attemptId: 'caPfSecret', activityId: 'exercise.learning-evidence', title: 'SECRET-PF-TITLE', evidence: 'SECRET-PF-EVIDENCE', note: 'SECRET-PF-NOTE', reviewedOn: PD, fileIds: ['flpfsecret01'] }];
    w.patterns.prefs.name = 'SECRET-NAME';
    w.finance.debts = [{ id: 'db1', direction: 'owe', person: 'SECRET-MONEY', amount: 20, note: 'SECRET-MONEY-NOTE', since: PD }];
    const data = K.normalize(w);
    const SECRETS = ['SECRET-PROJECT', 'SECRET-SUMMARY', 'SECRET-OUTCOME', 'SECRET-FINISHED', 'SECRET-LEFTOFF', 'SECRET-TASK', 'SECRET-DUE', 'SECRET-STUCK', 'SECRET-DONE', 'SECRET-PERSON', 'SECRET-WAITER',
      'SECRET-NOTE', 'SECRET-PNOTE', 'SECRET-APPT', 'SECRET-PROBLEM', 'SECRET-BELIEF', 'SECRET-FOUND', 'SECRET-MILESTONE', 'SECRET-DECISION', 'SECRET-OPTION', 'SECRET-LINK', 'SECRET-WHY',
      'SECRET-FILE', 'flsecret000', 'SECRET-RQ', 'SECRET-RS', 'SECRET-RF', 'SECRET-RES-TITLE', 'SECRET-RES-URL', 'SECRET-RES-NOTE', 'SECRET-TIMELINE', 'SECRET-EVIDENCE', 'SECRET-WHERE', 'SECRET-ISSUE', 'SECRET-NAME', 'SECRET-MONEY', 'SECRET-PF', 'flpfsecret', 'SECRET-STEP-PRIVATE', 'SECRET-AFTER', 'SECRET-DL-FROM', 'SECRET-DL-BY',
      'SECRET-BIZMONEY-LINE', 'SECRET-BIZMONEY-NOTE', 'SECRET-BIZMONEY-REAL', 'SECRET-EXP-TITLE', 'SECRET-EXP-HOW', 'SECRET-EXP-EXPECT', 'SECRET-EXP-RESULT', 'SECRET-EXP-CONCL'];
    check('the made-up world really holds every secret after MyDay reads it (so the checks below can\'t pass by accident)', SECRETS.every(x => JSON.stringify(data).includes(x)), SECRETS.filter(x => !JSON.stringify(data).includes(x)));
    const leaks = (req, allowed = []) => SECRETS.filter(x => !allowed.includes(x) && JSON.stringify(req).includes(x));
    const pages = ['#today', '#calendar', '#today/tasks', '#projects', '#projects/p/pjSecret', '#projects/p/pjSecret/research', '#projects/p/pjOpen/research', '#projects/p/pjSecret/model', '#projects/p/pjOpen', '#projects/p/pjOpen/model', '#projects/p/pjOpen/money', '#projects/p/pjCase',
      '#projects/notes', '#projects/notes/nPriv', '#projects/notes/nInPriv', '#projects/notes/nOpen', '#today/tasks/tkSecret', '#today/tasks/tkOpen', '#review', '#study', '#finance', '#health',
      '#study/cybersecurity/portfolio', '#study/cybersecurity/notebook', '#study/cybersecurity/exercise.learning-evidence'];
    const askLeaks = pages.map(h => [h, leaks(K.askContext(K.askSlice(data, h, PD), 'what should I do next?', PD))]).filter(([, l]) => l.length);
    const focused = [['#projects/p/pjOpen/decisions', 'dO'], ['#projects/p/pjSecret/decisions', 'dS']].map(([h, id]) => [h, leaks(K.askContext(K.askSlice(data, h, PD, { decisionId: id }), 'what am I missing?', PD))]).filter(([, l]) => l.length);
    check('…and asking about a decision ("What am I missing?"): only an open project\'s decision goes, never a private one\'s', focused.length === 0, focused);
    const openModel = JSON.stringify(K.askContext(K.askSlice(data, '#projects/p/pjOpen/model', PD), 'x', PD));
    check('…an open business idea\'s one page goes from its Model tab, but never what you found', openModel.includes('Fits the garden') && !openModel.includes('SECRET-FOUND-OPEN'));
    check(`Ask MyDay, from every page (${pages.length}): nothing private and none of the never-sent fields`, askLeaks.length === 0, askLeaks);
    const plan = K.buildContext(data, PD, '');
    check('Help me adjust today: nothing private; the private project\'s task goes only as "a private task"', leaks(plan).length === 0 && plan.tasks.some(t => t.title === 'a private task') && plan.tasks.some(t => t.title === 'Order the felt'), [leaks(plan), plan.tasks.map(t => t.title)]);
    const filing = K.connectContext(data, null, new Date(`${PD}T12:00`));
    check('AI help with notes: only the owner\'s exception — a private project\'s name and summary as a place to file — and never a private note or a note in a private project',
      !!filing && leaks(filing.ctx, ['SECRET-PROJECT', 'SECRET-SUMMARY']).length === 0 && filing.ctx.projects.some(p => p.id === 'pjSecret') && !filing.ctx.notes.some(n => n.id === 'nPriv' || n.id === 'nInPriv'), filing && leaks(filing.ctx, ['SECRET-PROJECT', 'SECRET-SUMMARY']));
    const mind = K.buildTasksContext('buy bike oil');
    check('Add what\'s on my mind: only what you write', leaks(mind).length === 0 && JSON.stringify(mind).includes('buy bike oil'));
    const R = K.aiReach(data), byId = (list, id) => list.find(x => x.id === id);
    check('the one filter: a private note, or a note in a private project, never reaches AI (so no revision cards or explanations from it)',
      !R.note(data.notes.items.find(n => n.id === 'nPriv')) && !R.note(data.notes.items.find(n => n.id === 'nInPriv')) && R.note(data.notes.items.find(n => n.id === 'nOpen'))
      && !R.fromNote('nInPriv') && !R.fromNote('nPriv') && R.fromNote('nOpen') && R.fromNote('gone-note'));
    check('…a private project, its tasks and its appointments never do; others do', !R.project(byId(data.projects.items, 'pjSecret')) && R.project(byId(data.projects.items, 'pjOpen')) && !R.task(byId(data.tasks.items, 'tkSecret')) && R.task(byId(data.tasks.items, 'tkOpen'))
      && !R.appointment({ id: 'cSecret' }) && R.appointment({ id: 'cOpen' }) && eq([...R.heldOnPlan(PD)], ['pS']));
    const lookSecret = K.notesLookup(data, 'SECRET'), lookShed = K.notesLookup(data, 'shed');
    const withLook = [lookSecret, lookShed].map(l => K.askContext(K.askSlice(data, '#today', PD), 'what did I write about it?', PD, undefined, undefined, l.lookup));
    data.patterns.prefs.aiNotes = false;
    const titleOnly = K.notesLookup(data, 'note-title'); // matches the private note's title, without being a secret itself
    check('…with AI help with notes off, a private note whose title matches: still nothing of it sent', leaks(titleOnly.lookup).length === 0 && titleOnly.leftOut === 2 && titleOnly.lookup.found === 0, titleOnly);
    data.patterns.prefs.aiNotes = true;
    // A look across MyDay (v24): every secret's word searched, one by one and all at once — nothing private and none of
    // the never-sent fields in what goes (it matches only on what may be sent), with or without AI help with notes.
    const across = [false, true].flatMap(on => { data.patterns.prefs.aiNotes = on; return ['SECRET', ...SECRETS].map(q => [q, on, K.searchLookup(data, q, K.courseIndex(), PD)]); });
    data.patterns.prefs.aiNotes = true;
    // (The words searched come back as "query" — what you typed, not something found — so they're set aside here.)
    const acrossLeaks = across.map(([q, on, l]) => { const lk = { ...l.lookup, query: 'x' }; return [q, on, leaks(lk), leaks(K.askContext(K.askSlice(data, '#today', PD), 'where is it?', PD, undefined, undefined, lk))]; }).filter(([, , a, b]) => a.length || b.length);
    check('a look across MyDay: nothing private and none of the never-sent fields, searching any secret\'s words (notes\' text shared or not)', acrossLeaks.length === 0 && across.some(([, , l]) => l.leftOut > 0), acrossLeaks.slice(0, 4));
    const acrossOpen = K.searchLookup(data, 'felt', null, PD);
    check('…while the open project\'s things are found (so the check sees something)', acrossOpen.lookup.found.length > 0 && leaks(acrossOpen.lookup).length === 0, acrossOpen.lookup.found);
    const daySecret = K.dayLookup(data, PD, PD);
    check('a look at the day: nothing private in what it sends (the private project\'s task and due one, the appointment\'s name)', leaks(daySecret.lookup).length === 0 && daySecret.leftOut >= 2 && leaks(K.askContext(K.askSlice(data, '#projects', PD), 'am I free today?', PD, undefined, undefined, daySecret.lookup)).length === 0, [leaks(daySecret.lookup), daySecret.leftOut]);
    // A look at each project: never the private one, and of the others nothing held back (outcome, finished-when, left off,
    // what was found, its links, a private note, a case's records).
    const looks = data.projects.items.map(p => [p.id, K.projectLookup(data, p.id)]);
    check('a look at a project: never the private one, and nothing held back of the others', looks.find(([id]) => id === 'pjSecret')[1] === null && looks.filter(([, l]) => l).length >= 2
      && looks.every(([, l]) => !l || (leaks(l.lookup).length === 0 && leaks(K.askContext(K.askSlice(data, '#today', PD), 'what next?', PD, undefined, undefined, l.lookup)).length === 0)), looks.map(([id, l]) => [id, l && leaks(l.lookup)]));
    // A look at the open decisions, all and each project's: nothing of the private project, never a pro's or con's text,
    // a reason or what was found — while the open project's own decision is there (so the check sees something).
    const decLooks = [K.decisionsLookup(data, 'all'), ...data.projects.items.map(p => K.decisionsLookup(data, p.id))].filter(Boolean);
    check('a look at your open decisions: nothing private in what it sends (not even a pro\'s or con\'s text)', decLooks.length >= 2 && K.decisionsLookup(data, 'pjSecret') === null
      && decLooks[0].lookup.decisions.some(d => d.question === 'Which wood?') && decLooks.every(l => leaks(l.lookup).length === 0 && !JSON.stringify(l.lookup).includes('Larch-PRO')
        && leaks(K.askContext(K.askSlice(data, '#today', PD), 'which decisions are open?', PD, undefined, undefined, l.lookup)).length === 0), decLooks.map(l => leaks(l.lookup)));
    // A look at what you're waiting on, all and each project's: never who or what (the open task's or the private one's),
    // never a private project's task — while the open project's waiting task is there (so the check sees something).
    const waitLooks = [K.waitingLookup(data, 'all'), ...data.projects.items.map(p => K.waitingLookup(data, p.id))].filter(Boolean);
    check('a look at what you\'re waiting on: never who or what it waits on, never a private project\'s task', waitLooks.length >= 2 && K.waitingLookup(data, 'pjSecret') === null
      && waitLooks[0].lookup.tasks.some(t => t.id === 'tkOpen') && waitLooks[0].leftOut === 1 && waitLooks.every(l => leaks(l.lookup).length === 0
        && leaks(K.askContext(K.askSlice(data, '#today', PD), 'what am I waiting on?', PD, undefined, undefined, l.lookup)).length === 0), waitLooks.map(l => leaks(l.lookup)));
    // A look at what to study next: nothing private in it (no project, link or note of any kind).
    const studyLook = K.studyLookup(data, PD);
    check('a look at what to study next: nothing private in what it sends', studyLook.lookup.options.length > 0 && leaks(studyLook.lookup).length === 0
      && leaks(K.askContext(K.askSlice(data, '#today', PD), 'what should I study?', PD, undefined, undefined, studyLook.lookup)).length === 0, leaks(studyLook.lookup));
    // …and at its riskiest (myday-86's recipe): a lesson flagged for revision with your own note, and a short session
    // before a private project's appointment — the screen's "Why this?" holds both, what goes to AI neither.
    {
      const z = JSON.parse(JSON.stringify(data)); K.setClock(`${PD}T10:00`);
      const path = K.pathIds(z), i = path.findIndex((id, n) => K.buildsOn(id).some(b => path.indexOf(b) > -1 && path.indexOf(b) < n));
      const weak = K.buildsOn(path[i]).find(b => path.indexOf(b) > -1 && path.indexOf(b) < i);
      for (const id of path.slice(0, i)) K.markCyberReady(z, K.factsOf(id), PD);
      K.flagCyberRevisit(z, weak, 'SECRET-FLAG', PD);
      z.context[PD] = { energy: 3, sleep: { start: null, end: null, estimatedHours: 7 } };
      z.commitments.push({ id: 'cSecret2', kind: 'appointment', title: 'SECRET-APPT', start: `${PD}T10:50`, end: `${PD}T11:30` });
      z.projects.items.find(p => p.id === 'pjSecret').commitmentIds.push('cSecret2');
      z.study.settings.primarySubject = 'cybersecurity';
      const zo = K.learningOptions(z).find(o => o.subject === 'cybersecurity'), zl = K.studyLookup(z, PD), zs = JSON.stringify(zl.lookup);
      check('…and at its riskiest — your own revision note, and a short session before a private appointment: the screen\'s reason holds both, what goes to AI neither',
        zo.why.includes('SECRET-FLAG') && zo.why.includes('SECRET-APPT') && !zs.includes('SECRET-FLAG') && leaks(zl.lookup).length === 0
          && leaks(K.askContext(K.askSlice(z, '#today', PD), 'what should I study?', PD, undefined, undefined, zl.lookup)).length === 0 && /needs revision/.test(zl.lookup.options[0].why), [zo.why, zl.lookup.options[0]?.why]);
      K.setClock(`${PD}T09:30`);
    }
    // (v23, the owner's choice) An open project's task's steps go — on its page, its project's page and the project lookup —
    // while a private project's steps never do (SECRET-STEP-PRIVATE is in SECRETS), nor a "starts after" id.
    const openTaskPage = K.askSlice(data, '#today/tasks/tkOpen', PD).context, openLook = K.projectLookup(data, 'pjOpen').lookup;
    check('an open project\'s task\'s steps do go (its page, its project and the lookup), never an id it starts after', JSON.stringify(openTaskPage).includes('SECRET-STEP-OPEN')
      && JSON.stringify(openLook).includes('SECRET-STEP-OPEN') && !JSON.stringify([openTaskPage, openLook]).includes('SECRET-AFTER'), [openTaskPage.task?.steps, openLook.project.tasks.map(t => t.steps)]);
    const tkOpenLook = openLook.project.tasks.find(t => t.id === 'tkOpen');
    check('…what it starts after goes by its title (a task of its own project), never by id, and never a private project\'s task', eq(tkOpenLook?.after, ['Measure the shed base'])
      && !/SECRET-TASK|tkSecret/.test(JSON.stringify(openLook)), tkOpenLook);
    check('a lookup in your notes: nothing private in what it sends — not even how many private notes matched', withLook.every(r => leaks(r).length === 0) && lookSecret.leftOut > 0 && lookSecret.lookup.notes.length === 0 && lookShed.lookup.notes.some(n => n.id === 'nOpen'), withLook.map(r => leaks(r)));
    data.patterns.prefs.aiNotes = false;
    const noText = K.askContext(K.askSlice(data, '#projects/p/pjOpen', PD), 'x', PD);
    check('with "AI help with notes" off, no note\'s text goes at all (titles only)', !JSON.stringify(noText).includes('Two metres by three') && JSON.stringify(noText).includes('Shed sizes'));
    // "Check my answer" is built from the lesson's own content and the answer just written: it reads nothing of your MyDay.
    const caReq = K.checkAnswerRequest(K.cyberCheckSource('lesson.learning-evidence', K.cyberActivities.get('assessment.learning-evidence-check').questions[0], 'A reference.', null), 'My own answer.');
    check('Check my answer: only the lesson, the question, its reference answer and your answer', caReq.ok && leaks(caReq.ctx).length === 0 && caReq.ctx.yourAnswer === 'My own answer.');
  }

  const { pass, fail } = summary();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('HARNESS:', e); process.exit(2); });
