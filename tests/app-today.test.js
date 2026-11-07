// Today in the NEW app (app/, built into app/dist): the same checks as today.test.js, adapted.
// Differences from the current MyDay that these checks expect:
//  - "Are you sure?" questions are asked in the page (a dialog), not with the browser's confirm().
//  - Data from older versions of MyDay is updated by the current MyDay, not the new app.
const fs = require('fs');
const T = require('./cdp.js');
T.setUrl('app/dist/index.html');
const { openAt, ev, click, exists, text, data, setFile, check, sleep, S } = T;
const noSaves = t => { const o = typeof t === 'string' ? JSON.parse(t) : JSON.parse(JSON.stringify(t)); delete o.saves; return JSON.stringify(o); };
// Today's learning task is Study's next step (specs/today-learning-and-tidy.md §2). In the browser Study always has one:
// the default subject is Cybersecurity and its first lesson is "Learning through evidence". Today's row shows the lesson
// live; the plan saves the entry under its subject's title ("Cybersecurity — your next lesson").
const CYB = 'Cybersecurity · Learning through evidence', CYB_SAVED = 'Cybersecurity — your next lesson', CYB_DONE = 'Cybersecurity: Learning through evidence';
// The four starters MyDay used to seed, as the user's own (other ids, so they are kept) for the checks that need list items.
const MY_LEARNING = [{ id: 'lt1', title: 'TryHackMe: Pre-Security path — one section', minutes: 30 }, { id: 'lt2', title: 'OverTheWire Bandit — one level', minutes: 20 },
  { id: 'lt3', title: 'HTB Academy: Networking module — one section', minutes: 30 }, { id: 'lt4', title: 'HTB Academy: Web Requests module — one section', minutes: 30 }];
const KEY = 'myday.data.v4';
const reset = () => ev('localStorage.clear()');
const planTitles = () => ev(`[...document.querySelectorAll('#app .task .title')].map(e => e.textContent)`);
const toast = () => text('#toast');
const tick = i => ev(`document.querySelectorAll('#app .task input')[${i}].click()`);
const rollBtn = i => ev(`document.querySelectorAll('#app .roll button')[${i}].click()`);
const count = async () => Number((await text('#streak h2')).match(/(\d)$/)[1]);
const nudgeShown = () => exists('#nudge');
const raw = () => ev(`localStorage.getItem('${KEY}')`);
const mydayKeys = () => ev(`Object.keys(localStorage).filter(k => k.startsWith('myday')).sort()`);
// React only notices a value set through the browser's own setter, followed by the events a person's typing makes.
const setVal = (sel, v, evt = 'change') => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel}');
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(String(v))});
  el.dispatchEvent(new Event('input', { bubbles: true })); if (${JSON.stringify(evt)} === 'change') el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const setEnergy = v => setVal('#energy', v, 'input');     // dragging the slider
const setEnergyCommitted = v => setVal('#energy', v);     // …and letting go
const answer = async yes => { await sleep(150); await click(yes ? '[data-action=dialog-confirm]' : '[data-action=dialog-cancel]'); await sleep(200); };
const dialogText = () => text('dialog[open]');
const glance = () => ev(`[...document.querySelectorAll('.glance li')].map(li => li.querySelector('.g-time').textContent + ' | ' + li.querySelector('.g-label').textContent)`);
const props = () => ev(`[...document.querySelectorAll('.prop-item')].map(li => li.querySelector('.prop-when').textContent + ' | ' + li.querySelector('.title').textContent)`);
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
async function build(e) { await setEnergy(e); await click('[data-action=build]'); await click('[data-action=prop-apply]'); }
async function buildAt(y, m, d, e) { await openAt(y, m, d); await build(e); return planTitles(); }
async function addCommitment(kind, title, start, end) {
  await click(`[data-action=commit-new][data-kind=${kind}]`);
  if (title !== null) await setVal('#cfTitle', title, 'input');
  await setVal('#cfStart', start, 'input'); await setVal('#cfEnd', end, 'input');
  await click('[data-action=commit-save]');
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Waits (up to 5 s) for something the page works out a moment after it draws, such as the lesson a Study row shows.
const until = async (predicate, ms = 5000) => { for (let t = 0; t < ms; t += 100) { if (await predicate()) return true; await sleep(100); } return false; };
const importFile = async (path, yes = true) => { await setFile(path); await sleep(200); if (await exists('dialog[open]')) await answer(yes); };

(async () => {
  await T.connect();

  console.log('\n[1] Saved plan survives refresh; Build can\'t regenerate');
  await openAt(2026, 10, 2); await reset(); await openAt(2026, 10, 2);
  check('header shows local date', (await text('#date')) === 'Friday 2 October', await text('#date'));
  check('no nudge for a brand-new user', !(await nudgeShown()));
  await setEnergy(5); await click('[data-action=build]');
  check('"Build my day" shows a proposal, saves nothing yet', (await exists('#proposalCard')) && !(await data()).days['2026-10-02']);
  await click('[data-action=prop-apply]');
  const p1 = await planTitles();
  check('after "Apply": energy 5 → 3 tasks (Study\'s next step, admin, health)', eq(p1, [CYB, 'Laundry', 'Gym']), p1);
  check('…the learning row is Study\'s step: it says why, and the saved entry is marked as Study\'s by its task id', (await text('#app .task [data-s=plan-study-detail]')) === 'The first lesson in your course' && (await data()).days['2026-10-02'].tasks[0].title === CYB_SAVED && (await data()).days['2026-10-02'].tasks[0].taskId === 'study:cybersecurity', (await data()).days['2026-10-02'].tasks[0]);
  const uids1 = (await data()).days['2026-10-02'].tasks.map(t => t.uid);
  await openAt(2026, 10, 2, 15);
  await until(async () => eq(await planTitles(), p1));
  check('refresh shows the same plan', eq(await planTitles(), p1), await planTitles());
  check('same task records (uids) after refresh', eq((await data()).days['2026-10-02'].tasks.map(t => t.uid), uids1));
  check('no "Build my day" button once a plan exists', !(await exists('[data-action=build]')));
  await tick(0); await tick(2);
  await openAt(2026, 10, 2, 16);
  const checked = await ev(`[...document.querySelectorAll('#app .task input')].map(i => i.checked)`);
  check('completion state survives refresh', eq(checked, [true, false, true]), checked);

  console.log('\n[2] Local calendar date, including midnight');
  await openAt(2026, 10, 2, 20, 30);
  check('UTC date is already the 3rd at 20:30 Los Angeles', (await ev('new Date().toISOString().slice(0,10)')) === '2026-10-03');
  check('…but the app still shows Friday 2 October', (await text('#date')) === 'Friday 2 October');
  const p1Later = [CYB_DONE, 'Laundry', 'Gym']; // (the learning entry was ticked by hand, so it keeps the lesson\'s name)
  await until(async () => eq(await planTitles(), p1Later));
  check('…and still shows the 2 October plan', eq(await planTitles(), p1Later), await planTitles());
  await ev('__setNow(2026, 10, 2, 23, 59, 50)'); await ev(`document.dispatchEvent(new Event('visibilitychange'))`); await sleep(100);
  check('23:59:50 still the 2nd', (await text('#date')) === 'Friday 2 October');
  await ev('__setNow(2026, 10, 3, 0, 0, 5)');
  await sleep(31000);
  check('after midnight (no reload) the header rolls to Saturday 3 October', (await text('#date')) === 'Saturday 3 October', await text('#date'));
  check('…and the morning screen appears for the new day', await exists('[data-action=build]'));

  console.log('\n[3] Yesterday\'s completions are never re-selected; learning is Study\'s next step, the same one until you move on');
  await editStorage(`s => { s.lists.health = [{ id: 'h1', title: 'Gym', minutes: 60 }]; }`);
  const p3 = await buildAt(2026, 10, 3, 5);
  check('3 Oct: Gym (done on the 2nd, only health item) is skipped', !p3.includes('Gym'), p3);
  check('3 Oct: learning is Study\'s step, the same as on the 2nd (ticking it by hand does not move Study on)', p3[0] === CYB, p3);
  const p4 = await buildAt(2026, 10, 4, 5);
  check('4 Oct: Gym is allowed again (not done yesterday)', p4.includes('Gym'), p4);
  check('4 Oct: learning is the same step, because you have not moved on in Study', p4[0] === CYB, p4);
  await tick(0);
  const seq = [];
  for (const d of [5, 6, 7]) { const p = await buildAt(2026, 10, d, 3); seq.push(p[0]); await tick(0); }
  seq.push((await buildAt(2026, 10, 8, 3))[0]);
  check('day after day, ticked by hand or not, the learning row stays on Study\'s step until you move on in Study', eq(seq, [CYB, CYB, CYB, CYB]), seq);
  const saved8 = (await data()).days['2026-10-07'].tasks[0];
  check('…and a Study entry ticked by hand keeps the lesson\'s name', saved8.done && saved8.title === CYB_DONE && saved8.taskId === 'study:cybersecurity', saved8);
  await click('[data-action=edit]');
  check('a new MyDay has no list items to edit under Learning (a new MyDay is not seeded with any)', (await ev(`document.querySelectorAll('.edit-row[data-cat=learning]').length`)) === 0);

  console.log('\n[4] Roll to tomorrow: queued once, energy limit respected, remainder kept (a Study entry is never rolled)');
  await openAt(2026, 10, 10); await reset();
  await buildAt(2026, 10, 10, 5);
  await click('[data-action=evening]');
  check('the evening view has "Roll to tomorrow" on the two ordinary tasks only', (await ev(`document.querySelectorAll('#app .roll button').length`)) === 2);
  check('…and the Study entry says tomorrow\'s plan picks up where you are in Study, instead', (await ev(`document.querySelectorAll('[data-s=study-no-roll]').length`)) === 1 && (await text('[data-s=study-no-roll]')).includes('picks up where you are in Study'), await text('[data-s=study-no-roll]'));
  await rollBtn(0); await rollBtn(1);
  await rollBtn(1); await rollBtn(1); await rollBtn(0); await rollBtn(0);
  let q = (await data()).queue;
  check('two tasks rolled (some toggled more than once) → exactly 2 queue entries, none for Study', q.length === 2 && !q.some(x => /Cybersecurity/.test(x.title)), q.map(x => x.title));
  check('no duplicate activities in the queue', new Set(q.map(x => x.taskId)).size === 2);
  check('evening summary is friendly', (await text('.summary')).startsWith('0 of 3 done — some days are like that.'), await text('.summary'));
  await click('[data-action=finish-evening]');
  await openAt(2026, 10, 10, 21);
  check('queue survives refresh', (await data()).queue.length === 2);
  const r2 = await buildAt(2026, 10, 11, 2);
  check('11 Oct energy 2 → exactly 1 task, the smallest (Laundry, carried over)', eq(r2, ['Laundry']), r2);
  q = (await data()).queue;
  check('the other one stays queued (Gym); Study\'s step was never in the queue', eq(q.map(x => x.title), ['Gym']), q.map(x => x.title));
  await click('[data-action=evening]'); await rollBtn(0); await click('[data-action=finish-evening]');
  const r3 = await buildAt(2026, 10, 12, 3);
  check('12 Oct energy 3 → 2 tasks: Study\'s step + oldest waiting (Gym)', eq(r3, [CYB, 'Gym']), r3);
  check('Laundry still waiting for a later day', eq((await data()).queue.map(x => x.title), ['Laundry']));
  await tick(0);

  console.log('\n[5] Rest day');
  await openAt(2026, 10, 13);
  const before = await count();
  await click('[data-action=skip]');
  check('rest day shows the rest card', (await text('#app .title')) === "Rest. That's the whole plan.");
  check('rest card has no checkbox (nothing required)', (await ev(`document.querySelectorAll('#app input[type=checkbox]').length`)) === 0);
  check('rest day stored with no tasks', (await data()).days['2026-10-13'].tasks.length === 0 && (await data()).days['2026-10-13'].rest === true);
  check('queue untouched by a rest day', eq((await data()).queue.map(x => x.title), ['Laundry']));
  check('learning count unchanged by a rest day', (await count()) === before && before === 1, [before, await count()]);
  await openAt(2026, 10, 13, 18);
  check('rest day survives refresh', (await text('#slot-plan h2')) === 'Today is a rest day');
  check('day after rest: queued Laundry comes back', (await buildAt(2026, 10, 14, 4)).includes('Laundry'));

  console.log('\n[6] Rolling seven-day learning count');
  await openAt(2026, 11, 1); await reset();
  for (const d of [1, 2]) { await buildAt(2026, 11, d, 3); await tick(0); }
  await openAt(2026, 11, 3); await click('[data-action=skip]');
  await buildAt(2026, 11, 4, 3); await tick(0);
  const seen = {};
  for (const d of [4, 7, 8, 9, 10, 11]) { await openAt(2026, 11, d); seen[d] = await count(); }
  check('learning on 1, 2, 4 Nov (rest on 3rd): counts 3,3,2,1,1,0 on 4,7,8,9,10,11 Nov', eq(seen, { 4: 3, 7: 3, 8: 2, 9: 1, 10: 1, 11: 0 }), seen);
  check('the count never says "streak" or "reset"', !/streak|reset to 0|start over/i.test(await text('#streak h2')));

  console.log('\n[7] Nudge');
  await openAt(2026, 12, 1); await reset(); await openAt(2026, 12, 1);
  // A 5-minute task of your own, so the shortest task at low energy is not Study's step (which is never under 10 minutes).
  await editStorage(`s => { s.lists.admin = [{ id: 'a9', title: 'Post a letter', minutes: 5 }]; }`);
  const shownDays = [];
  for (const d of [1, 2, 3]) { await openAt(2026, 12, d); shownDays.push(await nudgeShown()); await build(1); }
  check('not shown on a new user\'s first three days', eq(shownDays, [false, false, false]), shownDays);
  await openAt(2026, 12, 4);
  check('shown after three full days with no learning', await nudgeShown());
  await openAt(2026, 12, 4, 12);
  check('not shown again the same day after refresh', !(await nudgeShown()));
  await openAt(2026, 12, 5);
  check('shown again the next day', await nudgeShown());
  await build(1);
  const low = await planTitles();
  check('energy 1 picks one non-learning task (the shortest)', eq(low, ['Post a letter']), low);
  await click('[data-action=shrink]');
  check('no learning in plan → offers to swap an optional task', await exists('[data-action=swap-learning]'));
  check('no "add" option when the plan is at its limit', !(await exists('[data-action=add-learning]')));
  await click('[data-action=swap-learning]');
  const swapped = (await data()).days['2026-12-05'].tasks;
  check('swap keeps the 1-task limit with Study\'s next step as a 15-min learning session in the same time slot', swapped.length === 1 && swapped[0].category === 'learning' && swapped[0].taskId === 'study:cybersecurity' && swapped[0].title === CYB_SAVED && swapped[0].minutes === 15 && swapped[0].scheduledStart === '2026-12-05T09:00' && swapped[0].scheduledEnd === '2026-12-05T09:15', swapped);
  await openAt(2026, 12, 6);
  check('shown on 6 Dec (planned learning wasn\'t completed)', await nudgeShown());
  await click('[data-action=skip]');
  check('hidden once the day becomes a rest day', !(await nudgeShown()));
  await openAt(2026, 12, 7);
  await click('[data-action=shrink]');
  await build(4);
  const shr = (await data()).days['2026-12-07'].tasks;
  check('"Yes, shrink it" before building → learning built as 15 min, limit 3 kept', shr.length === 3 && shr[0].category === 'learning' && shr[0].minutes === 15, shr.map(t => [t.title, t.minutes]));

  console.log('\n[8] Export & import');
  for (const f of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + f);
  await openAt(2026, 12, 9); await click('[data-action=export]'); await sleep(1500);
  const files = fs.readdirSync(S + '/dl').filter(f => f.endsWith('.json'));
  check('export downloads myday-export-2026-12-09.json', files.includes('myday-export-2026-12-09.json'), files);
  const exp = JSON.parse(fs.readFileSync(S + '/dl/' + files[0], 'utf8'));
  check('export has format, schemaVersion 5, exportedAt, data (with settings, commitments, context)',
    exp.format === 'myday-export' && exp.schemaVersion === 5 && /^2026-12-09T\d\d:\d\d$/.test(exp.exportedAt) && exp.data.schemaVersion === 5 &&
    !!exp.data.settings && Array.isArray(exp.data.commitments) && typeof exp.data.context === 'object');
  check('export is the full saved data (identical to what is stored)', noSaves(exp.data) === noSaves(await raw()));
  const snapshot = await raw();
  fs.writeFileSync(S + '/bad.json', 'hello, not json');
  await importFile(S + '/bad.json');
  check('non-JSON import rejected, nothing changed', (await toast()).includes("isn't readable JSON") && (await raw()) === snapshot, await toast());
  fs.writeFileSync(S + '/newer.json', JSON.stringify({ format: 'myday-export', schemaVersion: 6, data: {} }));
  await importFile(S + '/newer.json');
  check('newer-version file rejected', (await toast()).includes('newer version'), await toast());
  fs.writeFileSync(S + '/missing.json', JSON.stringify({ format: 'myday-export', schemaVersion: 3, data: { schemaVersion: 3 } }));
  await importFile(S + '/missing.json');
  check('file missing required parts rejected', (await toast()).includes('missing parts'), await toast());
  const other = JSON.parse(JSON.stringify(exp));
  other.data.days = { '2026-12-01': other.data.days['2026-12-01'], 'not-a-date': {} };
  other.data.queue = [];
  fs.writeFileSync(S + '/other.json', JSON.stringify(other));
  await setFile(S + '/other.json'); await sleep(200);
  const conf = await dialogText();
  check('confirmation (in the page) describes the file (1 day, 1 unreadable entry skipped)', conf.includes('1 day of history') && conf.includes('1 unreadable entry will be skipped'), conf);
  await answer(false);
  check('cancelling the confirmation changes nothing', (await raw()) === snapshot && (await toast()).includes('Import cancelled'));
  await importFile(S + '/other.json', true);
  check('confirmed import replaces data', Object.keys((await data()).days).join() === '2026-12-01');
  await importFile(S + '/dl/' + files[0], true);
  check('re-importing the export restores the original exactly', noSaves(await raw()) === noSaves(snapshot));

  console.log('\n[9] Single key, missing/corrupted data, older versions');
  check('only one MyDay key in localStorage', eq(await mydayKeys(), [KEY]));
  await ev(`localStorage.setItem('${KEY}', '{"schemaVersion":3, broken')`);
  await openAt(2026, 12, 9, 10);
  check('corrupted data → recovery screen, no crash', (await text('#app h2')) === "Your saved data couldn't be opened");
  check('…and no section navigation while it waits for a decision', !(await exists('#nav')));
  check('corrupted data is not overwritten', (await raw()) === '{"schemaVersion":3, broken');
  await click('[data-action=start-fresh]');
  check('"Start fresh" asks first (in the page)', (await dialogText()).includes('Start fresh?'));
  await answer(true);
  check('"Start fresh" replaces it with valid data', (await data()).schemaVersion === 5 && (await exists('[data-action=build]')));
  await ev(`localStorage.setItem('${KEY}', JSON.stringify({ schemaVersion: 7, future: true }))`);
  await openAt(2026, 12, 9, 10, 30);
  check('data from a newer MyDay → explained, saving paused, left exactly as it was', (await text('#app')).includes('saved by a newer version of MyDay') && (await raw()) === JSON.stringify({ schemaVersion: 7, future: true }));
  await ev(`localStorage.setItem('${KEY}', JSON.stringify({ schemaVersion: 3, lists: { learning: 'oops', admin: [{ title: '' }, { id: 'a9', title: 'Post office', minutes: 'abc' }] },
    days: { '2026-13-45': {}, '2026-12-08': { energy: 9, tasks: [{ category: 'admin', title: 'Laundry', done: true, scheduledStart: 'nope' }, { nope: 1 }] } }, queue: 'x', nudge: null,
    settings: { bufferMinutes: -5, earliestTime: '22:00', latestTime: '07:00', gapMinutes: 'x' },
    commitments: [{ start: 'bad' }, { kind: 'work', title: 'Night', start: '2026-12-09T22:00', end: '2026-12-10T06:00' }, { kind: 'appointment', title: 'Backwards', start: '2026-12-09T10:00', end: '2026-12-09T09:00' }],
    context: { '2026-12-09': { energy: 9, sleep: { start: 'x', end: '2026-12-09T07:00', estimatedHours: 50 } }, 'junk': {} } }))`);
  await openAt(2026, 12, 9, 11);
  check('partly broken data loads without crashing', await exists('[data-action=build]'));
  await build(3);
  const fx = await data();
  check('…lists repaired (learning back to its default, which is now empty; bad admin dropped, minutes defaulted)', Array.isArray(fx.lists.learning) && fx.lists.learning.length === 0 && fx.lists.admin.length === 1 && fx.lists.admin[0].minutes === 20);
  check('…days repaired (bad date and bad task dropped, bad time cleared)', !fx.days['2026-13-45'] && fx.days['2026-12-08'].tasks.length === 1 && fx.days['2026-12-08'].tasks[0].scheduledStart === null);
  check('…settings fall back to defaults', eq(fx.settings, { bufferMinutes: 30, earliestTime: '08:00', latestTime: '21:00', gapMinutes: 10, theme: 'light', motion: 'auto' }), fx.settings);
  check('…invalid commitments dropped, the valid night shift kept', fx.commitments.length === 1 && fx.commitments[0].title === 'Night');
  check('…context cleaned (bad energy/estimate removed, valid wake time kept)', fx.context['2026-12-09'].sleep.end === '2026-12-09T07:00' && fx.context['2026-12-09'].sleep.estimatedHours === null && !fx.context.junk);
  await reset();
  await openAt(2026, 12, 9, 12);
  check('missing data → fresh start with seed lists (no learning items now: Study gives the learning task) and default settings', (await data()).lists.learning.length === 0 && (await data()).lists.admin.length === 4 && (await data()).settings.bufferMinutes === 30);
  await ev(`localStorage.clear(); localStorage.setItem('myday.tasks', JSON.stringify({ learning: [{ id: 'l1', title: 'Old learning', minutes: 30 }], admin: [], health: [] }));
    localStorage.setItem('myday.meta', JSON.stringify({ version: 1, firstUsed: '2026-12-01' }));`);
  const v1keys = await mydayKeys();
  await openAt(2026, 12, 9, 13);
  check('version-1 data: the new app explains the current MyDay updates it first', (await text('#app h2')) === 'Your data needs a quick update first');
  check('…and writes nothing (older data left exactly as it was)', eq(await mydayKeys(), v1keys));
  T.setUrl('index.html'); await openAt(2026, 12, 9, 14); // the current MyDay updates it…
  T.setUrl('app/dist/index.html'); await openAt(2026, 12, 9, 15);
  check('…after which the new app opens it normally', (await data()).lists.learning[0].title === 'Old learning' && (await exists('[data-action=build]')));

  console.log('\n[10] Backups from earlier versions import');
  await reset();
  T.setUrl('v2.html');
  await openAt(2027, 1, 5); await T.setEnergy(5); await click('[data-action=build]');
  await ev(`document.querySelectorAll('#app .task input')[0].click()`);
  await click('[data-action=evening]'); await rollBtn(0); await click('[data-action=finish-evening]');
  await openAt(2027, 1, 6); await T.setEnergy(3); await click('[data-action=build]');
  for (const f of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + f);
  await click('[data-action=export]'); await sleep(1500);
  fs.renameSync(S + '/dl/myday-export-2027-01-06.json', S + '/v2-export.json');
  const v2raw = JSON.parse(await ev(`localStorage.getItem('myday.data.v2')`));
  check('setup: the first app saved schemaVersion 2 data', v2raw.schemaVersion === 2 && Object.keys(v2raw.days).length === 2);
  T.setUrl('app/dist/index.html');
  await reset(); await openAt(2027, 1, 6, 11);
  await importFile(S + '/v2-export.json');
  const iv2 = await data();
  check('an exported version-2 file imports into the new app', Object.keys(iv2.days).length === 2 && iv2.days['2027-01-05'].tasks[0].done === true && iv2.schemaVersion === 5);
  check('…and its plan shows', eq(await planTitles(), v2raw.days['2027-01-06'].tasks.map(t => t.title)));
  fs.writeFileSync(S + '/v1-export.json', JSON.stringify({ 'myday.tasks': { learning: [], admin: [], health: [] } }));
  const beforeV1 = await raw();
  await importFile(S + '/v1-export.json');
  check('a first-version backup is refused with a clear way forward', (await toast()).includes('Import it in the current MyDay') && (await raw()) === beforeV1, await toast());

  console.log('\n[11] Day context and the timeline');
  await reset();
  await openAt(2027, 2, 1, 7);
  check('context section shown on the morning screen', (await text('#slot-context h2')) === "My day's context");
  await setVal('#sst', '23:30'); await setVal('#set', '07:30');
  check('overnight sleep: 8 h (yesterday 23:30 → today 07:30)', (await text('#sleepSummary')).startsWith('8 h of sleep (yesterday 23:30 → today 07:30)'), await text('#sleepSummary'));
  await setVal('#sed', '2027-01-31');
  check('wake before sleep → gentle correction', (await text('#sleepSummary')).includes('needs to be after'), await text('#sleepSummary'));
  await setVal('#sed', '2027-02-01');
  await setEnergyCommitted(5);
  await addCommitment('work', null, '2027-02-01T10:00', '2027-02-01T14:00');
  await addCommitment('appointment', 'Dentist', '2027-02-01T15:00', '2027-02-01T16:00');
  const g1 = await glance();
  check('timeline: woke, free, work, dentist, free — in order, with 30 min prep/travel',
    eq(g1, ['07:30 | Woke up', '08:00–09:30 | Available', '10:00–14:00 | Work shift', '15:00–16:00 | Dentist', '16:30–21:00 | Available']), g1);
  await addCommitment('appointment', 'Bad', '2027-02-01T12:00', '2027-02-01T11:00');
  check('end before start is refused with an explanation', (await text('#cfError')).includes('needs to be after the start'), await text('#cfError'));
  await click('[data-action=commit-cancel]');
  check('…and nothing was added', (await data()).commitments.length === 2);

  console.log('\n[12] Proposed plan: times, saving only on confirm, edit');
  await click('[data-action=build]');
  const pp = await props();
  const rng = row => row.split(' | ')[0], toMin = hm => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5)), [studyRange, laundryRange] = [rng(pp[0] ?? ''), rng(pp[1] ?? '')];
  const studyEnd = studyRange.split('–')[1] ?? '';
  check('proposal fits around work, dentist and prep/travel: Study\'s step first from 08:00 (saved under its subject\'s title), Laundry 10 minutes after it for 15, Gym after the dentist', pp.length === 3 && pp[0].endsWith(' | ' + CYB_SAVED) && studyRange.startsWith('08:00–') && toMin(studyEnd) <= 10 * 60 - 30 - 10
    && pp[1].endsWith(' | Laundry') && toMin(laundryRange.slice(0, 5)) === toMin(studyEnd) + 10 && toMin(laundryRange.slice(6)) - toMin(laundryRange.slice(0, 5)) === 15 && pp[2] === '16:30–17:30 | Gym', pp);
  check('timeline shows the proposed tasks', (await glance()).includes('16:30–17:30 | Gym'));
  check('nothing saved before "Apply"', !(await data()).days['2027-02-01']);
  await openAt(2027, 2, 1, 7, 5);
  check('refresh before applying → no plan saved, proposal gone', !(await data()).days['2027-02-01'] && !(await exists('#proposalCard')) && (await exists('[data-action=build]')));
  check('context kept after refresh (sleep, energy, commitments)', (await ev(`document.getElementById('sst').value`)) === '23:30' && (await ev(`document.getElementById('energy').value`)) === '5' && (await data()).commitments.length === 2);
  await click('[data-action=build]');
  check('the same proposal comes back', eq(await props(), pp), await props());
  await click('[data-action=prop-edit]');
  const gymUid = await ev(`[...document.querySelectorAll('.prop-item')].find(li => li.querySelector('.title').textContent === 'Gym').querySelector('[data-action=prop-time]').dataset.uid`);
  await setVal(`#pt-${gymUid}`, '15:30');
  const w = await ev(`([...document.querySelectorAll('.prop-item')].find(li => li.querySelector('.title').textContent === 'Gym').querySelector('.warn') || {}).textContent || ''`);
  check('editing Gym to 15:30 warns it overlaps Dentist', w.includes('Overlaps Dentist (15:00–16:00)'), w);
  await click('[data-action=prop-done-edit]');
  await click('[data-action=prop-apply]');
  const day1 = (await data()).days['2027-02-01'];
  check('"Apply" saves the edited times', eq(day1.tasks.map(t => [t.title, t.scheduledStart, t.scheduledEnd]),
    [[CYB_SAVED, '2027-02-01T08:00', '2027-02-01T' + studyEnd], ['Laundry', '2027-02-01T' + laundryRange.slice(0, 5), '2027-02-01T' + laundryRange.slice(6)], ['Gym', '2027-02-01T15:30', '2027-02-01T16:30']]), day1.tasks.map(t => [t.title, t.scheduledStart]));
  check('plan shows times and flags the overlap', (await text('#slot-plan')).includes('15:30–16:30') && (await text('#slot-plan .warn')).includes('Overlaps Dentist'));

  console.log('\n[13] Review my plan');
  await click('[data-action=review]');
  const rv = await ev(`[...document.querySelectorAll('.prop-item')].map(li => li.querySelector('.title').textContent + ' | ' + li.querySelector('.prop-when').textContent + ' | ' + ((li.querySelector('.change') || {}).textContent || ''))`);
  check('review moves only Gym, others unchanged', eq(rv, [CYB_SAVED + ' | ' + studyRange + ' | No change.', 'Laundry | ' + laundryRange + ' | No change.', 'Gym | 16:30–17:30 | Was 15:30–16:30.']), rv);
  const beforeCancel = await raw();
  await click('[data-action=prop-cancel]');
  check('"Cancel" changes nothing', (await raw()) === beforeCancel);
  await click('[data-action=review]'); await click('[data-action=prop-apply]');
  check('"Apply changes" moves Gym to 16:30', (await data()).days['2027-02-01'].tasks[2].scheduledStart === '2027-02-01T16:30');
  await tick(0);
  const thmBefore = JSON.stringify((await data()).days['2027-02-01'].tasks[0]);
  await setEnergyCommitted(2);
  check('energy change is noticed, but the plan isn\'t changed automatically', (await text('#reviewHint')).includes('energy is now 2') && (await data()).days['2027-02-01'].tasks.length === 3, await text('#reviewHint'));
  await click('[data-action=review]');
  const rv2 = await ev(`[...document.querySelectorAll('.prop-item')].map(li => li.querySelector('.title').textContent + ' | ' + li.querySelector('.prop-when').textContent)`);
  check('energy 2 with the Study entry done → it is kept (named for the lesson, as ticked by hand), Laundry and Gym proposed for later', eq(rv2, [JSON.parse(thmBefore).title + ' | ' + studyRange, 'Laundry | Later', 'Gym | Later']) && JSON.parse(thmBefore).title === CYB_DONE, rv2);
  await click('[data-action=prop-apply]');
  const d2 = (await data()).days['2027-02-01'];
  check('completed Study entry untouched (same record, still done, same time)', JSON.stringify(d2.tasks[0]) === thmBefore && d2.tasks.length === 1);
  check('Laundry and Gym now wait in the queue', eq((await data()).queue.map(x => x.title).sort(), ['Gym', 'Laundry']));
  check('learning count keeps the completed session', (await count()) === 1);
  await setEnergyCommitted(5);
  await click('[data-action=review]');
  const rv3 = await ev(`[...document.querySelectorAll('.prop-item')].map(li => li.querySelector('.title').textContent + ' | ' + ((li.querySelector('.change') || {}).textContent || ''))`);
  check('energy back to 5 → proposes adding two tasks back from the queue', rv3.length === 3 && rv3.filter(x => x.includes('New —')).length === 2, rv3);
  await click('[data-action=prop-apply]');
  check('…applied: 3 tasks, queue empty, the Study entry still done', (await data()).days['2027-02-01'].tasks.length === 3 && (await data()).queue.length === 0 && (await data()).days['2027-02-01'].tasks[0].done);

  console.log('\n[14] Tasks that can\'t fit: shorten, or leave for later');
  await openAt(2027, 2, 3, 7);
  await setVal('#latestTime', '08:50');
  await setEnergyCommitted(3);
  await click('[data-action=build]');
  const un = await ev(`[...document.querySelectorAll('.prop-item')].map(li => li.querySelector('.prop-when').textContent + ' | ' + li.querySelector('.title').textContent + ' | ' + ((li.querySelector('.why') || {}).textContent || ''))`);
  check('with Study\'s step (15 min) taking the first slot, the second task is unscheduled with a clear reason', un.length === 2 && un[0].startsWith('08:00–08:15 | Cybersecurity — your next lesson') && un[1].startsWith('No time yet | Bulk cook 2 meals | Unscheduled: It needs 1 h, but the longest free stretch left is 25 min (08:25–08:50).'), un);
  check('offers "Shorten to 25 min" and "Leave for later"', (await text('[data-action=prop-shorten]')) === 'Shorten to 25 min' && (await exists('[data-action=prop-later]')));
  await click('[data-action=prop-shorten]');
  check('shortened task now fits at 08:25–08:50', (await props()).includes('08:25–08:50 | Bulk cook 2 meals'), await props());
  await click('[data-action=prop-apply]');
  const sh = (await data()).days['2027-02-03'].tasks.find(t => t.title === 'Bulk cook 2 meals');
  check('saved as 25 min, original 60 kept', sh.minutes === 25 && sh.baseMinutes === 60 && (await text('#slot-plan')).includes('25 min (shortened from 60)'));
  await openAt(2027, 2, 4, 7);
  await addCommitment('work', null, '2027-02-04T08:00', '2027-02-04T20:30');
  await setEnergyCommitted(2);
  await click('[data-action=build]');
  check('no free time at all → explained, no shorten option', (await text('.prop-item .why')).includes("There's no free time left between 08:00 and 08:50") && !(await exists('[data-action=prop-shorten]')), await text('.prop-item .why'));
  const lt = await text('.prop-item .title');
  await click('[data-action=prop-later]');
  check('"Leave for later" marks it Later', (await text('.prop-when')) === 'Later');
  await click('[data-action=prop-apply]');
  check('applied: it waits in the queue, today has nothing required', (await data()).queue.some(x => x.title === lt) && (await data()).days['2027-02-04'].tasks.length === 0);

  console.log('\n[15] Night shift across midnight; sleep blocks; estimate; energy stays mine');
  await setVal('#latestTime', '21:00'); await setVal('#earliestTime', '05:00');
  await addCommitment('work', 'Night shift', '2027-02-04T22:00', '2027-02-05T06:00');
  const g4 = await glance();
  check('shift shown as 22:00 – tomorrow 06:00', g4.includes('22:00 – tomorrow 06:00 | Night shift'), g4);
  await openAt(2027, 2, 5, 5);
  const g5 = await glance();
  check('next day: shift shown as yesterday 22:00 – 06:00, first free time 06:30 after travel', g5[0] === 'yesterday 22:00 – 06:00 | Night shift' && g5[1].startsWith('06:30–'), g5);
  await setVal('#ssd', '2027-02-05'); await setVal('#sst', '07:00'); await setVal('#set', '13:30');
  const g5b = await glance();
  check('sleep after the shift (07:00–13:30) is blocked: free 06:30–07:00, then from 13:30', eq(g5b, ['yesterday 22:00 – 06:00 | Night shift', '06:30–07:00 | Available', '07:00 | Sleep', '13:30–21:00 | Available']), g5b);
  await setEnergyCommitted(4);
  await click('[data-action=build]');
  const p5 = await props();
  const inSleep = (await ev(`[...document.querySelectorAll('.prop-when')].map(e => e.textContent)`)).filter(t => /^\d/.test(t) && t.slice(0, 5) < '13:30' && t.slice(6) > '07:00');
  check('no proposed task overlaps sleep (07:00–13:30)', inSleep.length === 0 && p5.length === 3, p5);
  await click('[data-action=prop-cancel]');
  await openAt(2027, 2, 6, 7);
  await setVal('#sest', '3');
  check('estimate only: "About 3 h of sleep (your estimate)."', (await text('#sleepSummary')) === 'About 3 h of sleep (your estimate).', await text('#sleepSummary'));
  await setVal('#sest', '30');
  check('an impossible estimate is refused and put back, kindly', (await toast()).includes('between 0 and 24 hours') && (await ev(`document.getElementById('sest').value`)) === '3');
  await setEnergyCommitted(5);
  check('energy stays exactly as set after a short-sleep entry', (await ev(`document.getElementById('energy').value`)) === '5' && (await data()).context['2027-02-06'].energy === 5);
  await click('[data-action=build]');
  check('energy 5 still gets 3 tasks — sleep never lowers it', (await props()).length === 3);
  const allText = (await ev('document.body.innerText')).toLowerCase();
  check('no judgemental sleep wording anywhere', !/(not enough sleep|too little|you should|tired|only slept)/.test(allText));
  await click('[data-action=prop-apply]');

  console.log('\n[16] Export/import includes the new context');
  for (const f of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + f);
  await click('[data-action=export]'); await sleep(1500);
  const e3 = JSON.parse(fs.readFileSync(S + '/dl/myday-export-2027-02-06.json', 'utf8'));
  check('export contains commitments, sleep, energy and settings', e3.data.commitments.length === 4 && e3.data.context['2027-02-05'].sleep.start === '2027-02-05T07:00' && e3.data.context['2027-02-06'].energy === 5 && e3.data.settings.earliestTime === '05:00');
  check('export contains scheduled task times', e3.data.days['2027-02-01'].tasks[0].scheduledStart === '2027-02-01T08:00');
  const snap3 = await raw();
  await reset(); await openAt(2027, 2, 6, 8);
  await importFile(S + '/dl/myday-export-2027-02-06.json');
  check('importing it restores everything exactly', noSaves(await raw()) === noSaves(snap3));

  console.log('\n[17] Themes');
  const bgOf = () => ev(`getComputedStyle(document.body).backgroundColor`);
  await openAt(2027, 2, 7, 7);
  // From 1.11.0 the new app is warm and light by default (the classic MyDay's default stays dark).
  check('light by default (the paper workspace)', (await ev(`document.documentElement.dataset.theme`)) === 'light' && (await bgOf()) === 'rgb(244, 245, 242)', await bgOf());
  check('theme button labelled for screen readers', (await ev(`document.getElementById('themeBtn').getAttribute('aria-label')`)) === 'Theme: Light. Tap to change.');
  await click('#themeBtn'); await sleep(400);
  check('tap → Dark: the charcoal colours applied and saved', (await ev(`document.documentElement.dataset.theme`)) === 'dark' && (await bgOf()) === 'rgb(21, 23, 22)' && (await data()).settings.theme === 'dark');
  check('browser bar colour follows the theme', (await ev(`document.querySelector('meta[name=theme-color]').content`)) === '#151716');
  await T.send('Page.addScriptToEvaluateOnNewDocument', { source: `new MutationObserver((m, o) => { if (document.body) { window.__themeAtBody = document.documentElement.getAttribute('data-theme'); o.disconnect(); } }).observe(document, { childList: true, subtree: true });` });
  await openAt(2027, 2, 7, 8);
  check('saved theme is applied before the page body appears (no flash)', (await ev('window.__themeAtBody')) === 'dark', await ev('window.__themeAtBody'));
  await click('#themeBtn'); await sleep(400);
  await T.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  check('tap → Match device (device dark) → dark colours', (await ev(`document.documentElement.dataset.theme`)) === 'auto' && (await bgOf()) === 'rgb(21, 23, 22)', await bgOf());
  await T.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  check('…device switches to light → light colours', (await bgOf()) === 'rgb(244, 245, 242)', await bgOf());
  // The browser tells the page about a theme change at its next frame, a moment after the colours themselves change —
  // so wait for the bar (this used to be read too early, and failed now and then, mostly at night).
  const bar = () => ev(`document.querySelector('meta[name=theme-color]').content`);
  for (let i = 0; i < 20 && (await bar()) !== '#f4f5f2'; i++) await sleep(100);
  check('Match device updates the browser bar when the OS theme changes', (await bar()) === '#f4f5f2', await bar());
  await T.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await click('#themeBtn'); await sleep(400);
  check('tap → back to Light (even when the device is dark)', (await ev(`document.documentElement.dataset.theme`)) === 'light' && (await bgOf()) === 'rgb(244, 245, 242)', await bgOf());
  await T.send('Emulation.setEmulatedMedia', { features: [] });
  const contrastIn = async theme => ev(`(() => {
    document.documentElement.dataset.theme = ${JSON.stringify(theme)};
    const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue('--' + n).trim();
    // The build shortens some colours (e.g. #ffffff → #fff), so expand those first.
    const full = h => (h.length === 4 ? '#' + [...h.slice(1)].map(x => x + x).join('') : h);
    const L = hx => { const h = full(hx); const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const cr = (a, b) => { const [x, y] = [L(v(a)), L(v(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const pairs = [['text','surface'],['text-2','surface'],['text-3','surface'],['text-3','surface-2'],['primary','surface'],['on-primary','primary'],['on-primary-container','primary-container'],['on-tonal','tonal'],
      ['learning','learning-c'],['admin','admin-c'],['health','health-c'],['rest','rest-c'],['work','work-c'],['appt','appt-c'],['on-warn-c','warn-c'],['on-inverse','inverse'],
      ['on-done','done'],['on-done-c','done-c'],['on-rail','rail'],['text','bg'],['text-2','surface-2'],['primary','bg'],['on-primary','primary-2']];
    return Math.min(...pairs.map(([a, b]) => cr(a, b)));
  })()`);
  const cDark = await contrastIn('dark'), cLight = await contrastIn('light');
  check('every text colour pair ≥ 4.5:1 in dark and light', cDark >= 4.5 && cLight >= 4.5, [cDark.toFixed(2), cLight.toFixed(2)]);
  await openAt(2027, 2, 7, 9);

  console.log('\n[18] Layout');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await openAt(2027, 2, 6, 9);
  const rects = await ev(`(() => { const r = id => { const b = document.getElementById(id).getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; }; return { greeting: r('greeting'), plan: r('slot-plan'), focus: r('slot-focus'), glance: r('slot-glance'), streak: r('streak') }; })()`);
  check('desktop: the greeting across the top, then the plan with a side column (focus timer, then timeline and count)',
    rects.greeting.bottom <= rects.plan.top && rects.greeting.top < 200 && rects.glance.left > rects.plan.right && rects.focus.left === rects.glance.left && rects.streak.left === rects.glance.left
    && rects.focus.top <= rects.plan.top + 1 && rects.focus.top < rects.glance.top, rects);
  check('desktop: no sideways scrolling', !(await ev('document.documentElement.scrollWidth > innerWidth')));
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await openAt(2027, 2, 6, 9);
  const tops = await ev(`['slot-plan', 'slot-glance', 'slot-context', 'streak', 'footer'].map(id => Math.round(document.getElementById(id).getBoundingClientRect().top + scrollY))`);
  check('phone: one column in order plan → timeline → context → count → footer', tops.every((t, i) => i === 0 || t > tops[i - 1]), tops);
  check('phone: no sideways scrolling (plan)', !(await ev('document.documentElement.scrollWidth > innerWidth')));
  const small = await ev(`[...document.querySelectorAll('#app button, #app a, #nav a, #themeBtn')].filter(b => b.offsetParent !== null).map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 20), h: Math.round(r.height), w: Math.round(r.width) }; }).filter(x => x.h < 44 || x.w < 44)`);
  check('phone: every button and link is at least 44 × 44 px', small.length === 0, small);
  await click('#themeBtn'); await sleep(400);
  check('phone: no sideways scrolling in light theme', !(await ev('document.documentElement.scrollWidth > innerWidth')));
  await click('#themeBtn'); await sleep(400); await click('#themeBtn'); await sleep(400);
  await openAt(2027, 2, 7, 7);
  check('no sideways scrolling at phone width (morning)', !(await ev('document.documentElement.scrollWidth > innerWidth')));
  const mtops = await ev(`['slot-energy', 'slot-actions', 'slot-context', 'slot-glance'].map(id => { const el = document.getElementById(id); return el ? Math.round(el.getBoundingClientRect().top + scrollY) : null; })`);
  check('phone morning: energy → Build my day → context (folded) → timeline', mtops.every((t, i) => t !== null && (i === 0 || t > mtops[i - 1])) && (await ev(`(document.getElementById('ctxDetails') || {}).open === false`)), mtops);
  check('phone morning: Build my day is fully visible without scrolling', await ev(`document.querySelector('[data-action=build]').getBoundingClientRect().bottom <= document.getElementById('nav').getBoundingClientRect().top`),
    await ev(`(() => { const r = e => e && Math.round(e.getBoundingClientRect().bottom); return { build: r(document.querySelector('[data-action=build]')), nav: Math.round(document.getElementById('nav').getBoundingClientRect().top), header: r(document.querySelector('header')),
      blocks: [...document.querySelectorAll('#app section, #app .card')].filter(e => e.getBoundingClientRect().top < 900).map(e => (e.id || e.className.slice(0, 24)) + ':' + Math.round(e.getBoundingClientRect().top) + '-' + Math.round(e.getBoundingClientRect().bottom)) }; })()`));
  check('phone morning: the folded context says what is in it', (await text('#slot-context details summary')).includes('Nothing booked today') && (await text('#slot-context details summary')).includes('min prep/travel'));
  await click('[data-action=build]');
  check('no sideways scrolling at phone width (proposal)', !(await ev('document.documentElement.scrollWidth > innerWidth')));
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[19] Animations, focus timer, celebration');
  const secs = async () => { const p = (await text('#timerTime')).split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]; };
  const advanceTimer = sec => ev(`(() => { const t = JSON.parse(localStorage.getItem('${KEY}')).timer; const d = new Date(t.startedAt + ${'${sec}'} * 1000); __setNow(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()); })()`.replace('${sec}', sec));
  const tickAll = async () => { while (await ev(`!!document.querySelector('#app .task input:not(:checked)')`)) { await ev(`document.querySelector('#app .task input:not(:checked)').click()`); await sleep(50); } };
  const anim = sel => ev(`(() => { const el = document.querySelector(${JSON.stringify('X')}); return el ? getComputedStyle(el).animationName : 'missing'; })()`.replace('"X"', JSON.stringify(sel)));
  await reset(); await openAt(2027, 5, 3, 7);
  await setEnergy(5); await click('[data-action=build]');
  check('proposal items are immediately readable without entrance motion', await ev(`[...document.querySelectorAll('.prop-item')].length === 3 && [...document.querySelectorAll('.prop-item')].every(el => getComputedStyle(el).animationName === 'none' && getComputedStyle(el).opacity === '1')`));
  await click('[data-action=prop-edit]');
  check('…but not again on every edit', (await ev(`document.querySelectorAll('.prop-item.stagger').length`)) === 0);
  await click('[data-action=prop-done-edit]'); await click('[data-action=prop-apply]');
  check('moving to the plan keeps the working cards immediately visible', await ev(`!!document.querySelector('#slot-plan') && [...document.querySelectorAll('#app .enter')].every(el => getComputedStyle(el).animationName === 'none' && getComputedStyle(el).opacity === '1')`));
  await until(() => exists('[data-action=plan-study]'));
  check('the next task is Study\'s step, whose own action (the link to the lesson) takes the highlight: no "Just start" is filled', (await ev(`[...document.querySelectorAll('[data-action=timer-start]')].map(b => b.dataset.variant === 'ghost')`)).join() === 'true,true,true');
  check('task actions keep readable 14 px text and 44 px targets', await ev(`[...document.querySelectorAll('.task-actions button')].every(b => parseFloat(getComputedStyle(b).fontSize) >= 14 && b.getBoundingClientRect().height >= 44)`));
  check('the next task\'s own action (the lesson link) has a visible fill, and the timer actions retain outlines', await ev(`(() => {
    const buttons = [...document.querySelectorAll('.task-actions button')];
    const next = document.querySelector('.task.next + .task-actions [data-action=plan-study]');
    return !!next && getComputedStyle(next).backgroundColor !== 'rgba(0, 0, 0, 0)' && buttons.every(b => {
      const s = getComputedStyle(b); return parseFloat(s.borderTopWidth) >= 1 && s.borderTopColor !== 'rgba(0, 0, 0, 0)';
    });
  })()`));
  check('the next task is marked "Up next"', (await text('#app .task.next')).includes('Up next') && (await ev(`document.querySelectorAll('#app .task.next').length`)) === 1);
  await tick(0);
  check('ticking plays a pop + glow on that card', (await anim('.task.just-done')) === 'glow' && (await anim('.task.just-done .box')) === 'pop');
  check("today's tile in the 7-day row pops", await exists('.wd.today.on.just'));
  check('a gentle "1 done so far" note (no score before anything is ticked)', (await text('#slot-plan')).includes('1 done so far'));
  check('with an ordinary task up next, its "Just start" is the one filled, and the other is outlined', (await ev(`[...document.querySelectorAll('[data-action=timer-start]')].map(b => b.dataset.variant === 'ghost')`)).join() === 'false,true', await ev(`[...document.querySelectorAll('[data-action=timer-start]')].map(b => b.dataset.variant)`));
  await openAt(2027, 5, 3, 7, 1);
  check('animations play once, not on every refresh', !(await exists('.task.just-done')));

  await click('[data-action=timer-focus]');
  check('focus timer opens for the next task with its full time', (await text('#timerCard .title')) === 'Laundry' && (await text('#timerTime')) === '15:00' && (await text('#timerCard .eyebrow')) === 'Focus');
  check('timer is saved', (await data()).timer && (await data()).timer.kind === 'focus' && (await data()).timer.durationSec === 900);
  await advanceTimer(301); await sleep(1100);
  const r5 = await secs();
  const off = await ev(`parseFloat(document.getElementById('ringFill').style.strokeDashoffset)`);
  check('after 5 minutes: about 10:00 left and a third of the ring gone', r5 >= 596 && r5 <= 600 && Math.abs(off - 2 * Math.PI * 52 / 3) < 2, [r5, off]);
  const st0 = (await data()).timer.startedAt;
  await ev(`(() => { const d = new Date(${st0} + 8 * 60000 + 1000); window.__target = [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()]; })()`);
  const target = await ev('window.__target');
  await openAt(target[0], target[1], target[2], target[3], target[4]);
  const r8 = await secs();
  check('timer survives a refresh and keeps real time (~7 min left)', r8 >= 415 && r8 <= 425, r8);
  await click('[data-action=timer-pause]');
  const p1s = await secs();
  await ev(`__setNow(${target[0]}, ${target[1]}, ${target[2]}, ${target[3]}, ${target[4] + 10}, 0)`); await sleep(1100);
  check('paused: the clock stands still', (await secs()) === p1s && (await text('.ring-sub')) === 'paused');
  await click('[data-action=timer-resume]');
  await ev(`__setNow(${target[0]}, ${target[1]}, ${target[2]}, ${target[3]}, ${target[4] + 25}, 0)`); await sleep(1300);
  check("time's up: friendly message, nothing ticked automatically", (await text('.timer-msg')).startsWith("Time's up — nice focus") && !(await data()).days['2027-05-03'].tasks.find(t => t.title === 'Laundry').done);
  await click('[data-action=timer-plus5]');
  check('"+5 minutes" restarts at 05:00', (await text('#timerTime')) === '05:00');
  await click('[data-action=timer-done]');
  const lau = (await data()).days['2027-05-03'].tasks.find(t => t.title === 'Laundry');
  check('"Tick it off" from the timer ticks the task and closes the timer', lau.done && !(await exists('#timerCard')) && (await data()).timer === null);
  await click('[data-action=timer-start]');
  check('"Just start" opens a 2-minute timer for Gym', (await text('#timerTime')) === '02:00' && (await text('#timerCard .title')) === 'Gym' && (await text('#timerCard .eyebrow')) === 'Just start');
  await advanceTimer(125); await sleep(1300);
  check("after 2 minutes: encouragement and an offer to keep going", (await text('.timer-msg')).includes("you started, and that's the hardest part") && (await text('[data-action=timer-keep]')) === 'Keep going · 58 min');
  await click('[data-action=timer-keep]');
  check('"Keep going" switches to a 58-minute focus timer', (await text('#timerTime')) === '58:00' && (await text('#timerCard .eyebrow')) === 'Focus');
  await click('[data-action=timer-stop]');
  check('"Stop" closes the timer and leaves the task open', !(await exists('#timerCard')) && !(await data()).days['2027-05-03'].tasks.find(t => t.title === 'Gym').done && (await toast()).includes('completely fine'));

  await tickAll(); await sleep(100);
  check('whole plan done → one soft burst and a kind message', (await exists('.burst')) && (await toast()) === "That's the whole plan — lovely." && (await data()).celebratedOn === '2027-05-03');
  await sleep(1800);
  check('the burst cleans itself up', !(await exists('.burst')));
  await tick(2); await tick(2); await sleep(100);
  check('only once a day, even if re-ticked', !(await exists('.burst')));

  await click('[data-action=motion]');
  check('animations switch: off (saved, applied, labelled)', (await ev('document.documentElement.dataset.motion')) === 'off' && (await data()).settings.motion === 'off' && (await text('[data-action=motion]')) === 'Animations: Off');
  await openAt(2027, 5, 4, 7); await build(3);
  await tick(0);
  check('with animations off: no tick animation', (await anim('.task.just-done')) === 'none');
  await tickAll(); await sleep(100);
  check('with animations off: no burst', !(await exists('.burst')) && (await data()).celebratedOn === '2027-05-04');
  await click('[data-action=motion]');
  await T.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }); await sleep(200);
  check("device 'reduce motion' is respected and explained", (await text('[data-action=motion]')).includes('your device asks for less motion'));
  await openAt(2027, 5, 5, 7); await build(1); await tickAll(); await sleep(100);
  check('…no burst and no animations under reduced motion', !(await exists('.burst')) && (await anim('#app .task')) === 'none');
  await T.send('Emulation.setEmulatedMedia', { features: [] });

  await openAt(2027, 5, 6, 7); await build(3);
  await click('[data-action=timer-focus]');
  await openAt(2027, 5, 7, 7); await sleep(200);
  check("a timer left running from yesterday is quietly cleared", !(await exists('#timerCard')) && (await data()).timer === null);

  console.log('\n[20] Every section is in the new app');
  const navLabels = await ev(`[...document.querySelectorAll('#nav a.nav-item')].map(a => a.getAttribute('aria-label'))`);
  check('the navigation keeps all six sections, none marked "not in the new app yet"', eq(navLabels, ['Today', 'Calendar', 'Projects', 'Finance', 'Health', 'Study']), navLabels);
  await ev(`location.hash = '#health/food'`); await sleep(200);
  check('#health/food opens Food in the new app (search box, recipe ideas)', (await exists('#foodQ')) && (await text('#app')).includes('Ideas for you'));
  await ev(`location.hash = '#today'`); await sleep(200);
  check('back to Today from the navigation (the morning screen: nothing built for 7 May)', await exists('#slot-energy'));
  await editStorage(`s => { s.rota = { patterns: [{ anchor: '2027-05-01', cycle: ['day', 'off'], times: { day: { start: '09:00', end: '17:00' } } }] }; s.health = { workout: {}, food: { shopping: [{ id: 'sh1', name: 'Oats', checked: false }] } }; }`);
  await openAt(2027, 5, 7, 7);
  check('a day shift from the rota shows on Today (read-only) and blocks task times', (await glance()).some(g => g.startsWith('09:00–17:00 | Day shift')), await glance());
  check('Today shows the shopping list reminder (nothing added to the task list)', (await text('#slot-health')).includes('Shopping list') && (await text('#slot-health')).includes('1 item to get'));

  console.log("\n[21] Today's dashboard: greeting, progress, quick add, focus timer, Focus mode");
  const K = '2027-05-07';  // a Friday; the rota above puts a day shift on 1, 3, 5, 7, 9… May
  const clock = m => (m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}` : String(m).padStart(2, '0')) + ':00';
  const weekDone = async () => { const w = await text('#weekCard [data-s=week-words]'); const m = w.match(/^(\d+) things? done/); return m ? Number(m[1]) : 0; };
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await ev(`localStorage.removeItem('myday.focus')`);
  await openAt(2027, 5, 7, 7);
  check('greeting: "Good morning!" for the time of day, and quietly asks what to call you (a link, not a form)', (await text('#greeting-h')) === 'Good morning!' && (await exists('[data-action=name-ask]')) && !(await exists('#nameInput')), await text('#greeting-h'));
  check('phone: before the plan, no extra line in the greeting ("Build my day" is right below)', !(await ev(`document.querySelector('[data-s=greeting-line]').getClientRects().length`)));
  const strip = await ev(`[...document.querySelectorAll('[data-s=week-strip] > span')].map(s => s.getAttribute('aria-label'))`);
  check('phone: this week under the greeting, today marked, a dot on each day with a shift (3, 5, 7 and 9 May)', strip.length === 7 && strip[4].startsWith('Today, ') && strip.filter(l => l.includes('something on')).length === 4, strip);
  check('phone: Build my day is still fully visible without scrolling (greeting and name question included)', await ev(`document.querySelector('[data-action=build]').getBoundingClientRect().bottom <= document.getElementById('nav').getBoundingClientRect().top`));
  await click('[data-action=name-ask]'); await sleep(150);
  check('the link opens the name field, ready to type in', (await exists('#nameInput')) && (await ev(`document.activeElement.id`)) === 'nameInput');
  await click('[data-action=name-later]'); await sleep(150);
  check('"Not now" puts the question away and saves nothing', !(await exists('#nameInput')) && (await exists('[data-action=name-ask]')) && (await data()).patterns.prefs.name === undefined);
  await click('[data-action=name-ask]'); await sleep(150);
  await setVal('#nameInput', '  Sam  ', 'input'); await click('[data-action=name-save]'); await sleep(200);
  check('saving the name: kept (trimmed) with your preferences, and the greeting uses it', (await data()).patterns.prefs.name === 'Sam' && (await text('#greeting-h')) === 'Good morning, Sam!' && !(await exists('#nameInput')) && !(await exists('[data-action=name-ask]')), (await data()).patterns.prefs);
  check('…with a friendly note', (await toast()).includes('Nice to meet you, Sam.'));
  for (const [h, hello] of [[13, 'Good afternoon, Sam!'], [18, 'Good evening, Sam!'], [23, 'Hello, Sam!']]) {
    await openAt(2027, 5, 7, h);
    check(`greeting at ${h}:00: "${hello}"`, (await text('#greeting-h')) === hello, await text('#greeting-h'));
  }
  await editStorage(`s => { s.patterns.prefs.name = '   '; }`); await openAt(2027, 5, 7, 7);
  check('a blank saved name is read as no name (asks again)', (await exists('[data-action=name-ask]')) && (await text('#greeting-h')) === 'Good morning!');
  await editStorage(`s => { s.patterns.prefs.name = 'x'.repeat(60); }`); await openAt(2027, 5, 7, 7);
  check('a saved name longer than 40 characters is shortened, not lost', (await text('#greeting-h')) === `Good morning, ${'x'.repeat(40)}!`);
  await editStorage(`s => { s.patterns.prefs.name = 'Sam'; }`); await openAt(2027, 5, 7, 7);
  await ev(`location.hash = '#noticed'`); await sleep(250);
  check('the name can be changed under Your preferences', (await ev(`document.getElementById('prefName').value`)) === 'Sam');
  await setVal('#prefName', 'Sami'); await sleep(200);
  check('…changing it there saves it', (await data()).patterns.prefs.name === 'Sami');
  await setVal('#prefName', '  '); await sleep(200);
  check('…and emptying it removes it (the greeting just says hello)', (await data()).patterns.prefs.name === undefined && (await toast()).includes('Name removed'));
  await setVal('#prefName', 'Sam'); await sleep(200);
  await ev(`location.hash = '#today'`); await sleep(250);
  check('top bar: the section name above the date', (await text('#screenName')) === 'Today');
  check('progress before the plan: "Not planned yet"', (await text('#todayRing [data-s=ring-words]')) === 'Not planned yet');
  check('focus timer before the plan: a gentle pointer, no timer yet', (await text('#focusCard')).includes('Build your day, then focus on one task at a time.') && !(await exists('#focusTask')));

  await setVal('#quickText', 'Call the dentist', 'input'); await setVal('#quickCat', 'admin'); await click('[data-action=quick-add]'); await sleep(200);
  const qa = (await data()).tasks.items.find(t => t.title === 'Call the dentist');
  check('quick add (no plan yet): saved as a task due today, under Due today', !!qa && qa.due === K && qa.category === 'admin' && (await text('#dueToday')).includes('Call the dentist') && (await ev(`document.getElementById('quickText').value`)) === '', qa);
  check('…and says where it went', (await toast()).includes('Build your day to add it to the plan'));
  check('quick add: nothing happens for an empty box', await ev(`document.querySelector('[data-action=quick-add]').disabled`));

  await build(3); await sleep(250);
  let day = (await data()).days[K];
  const open = day.tasks.filter(t => !t.done);
  check('progress after building: "0 of N done" (a plan was built)', day.tasks.length > 0 && (await text('#todayRing [data-s=ring-words]')) === `0 of ${day.tasks.length} done`, [day.tasks.length, await text('#todayRing [data-s=ring-words]')]);
  check('greeting: says how many tasks are left', (await text('[data-s=greeting-line]')) === `You have ${open.length} task${open.length === 1 ? '' : 's'} left for today.`);
  const opts = await ev(`[...document.querySelectorAll('#focusTask option')].map(o => o.textContent)`);
  check("focus timer: a choice of today's open tasks", eq(opts, open.map(t => t.title)), opts);
  const stUid = await ev(`document.getElementById('focusTask').value`), st = open.find(t => t.uid === stUid);
  check("…starting with one of them, at that task's own length", !!st && Number(await text('#focusMin')) === st.minutes, st);
  await click('[data-action=focus-more]');
  check('+ makes it 5 minutes longer', Number(await text('#focusMin')) === st.minutes + 5);
  await click('[data-action=focus-start]'); await sleep(250);
  check("Start opens MyDay's focus timer for that task and length", (await exists('#timerCard')) && (await text('#timerCard .title')) === st.title && (await text('#timerTime')) === clock(st.minutes + 5) && !(await exists('#focusCard')), [await text('#timerTime'), clock(st.minutes + 5)]);
  await click('[data-action=timer-stop]'); await sleep(250);
  check('…and once the timer stops, the focus card is back', (await exists('#focusCard')) && !(await exists('#timerCard')));

  const w0 = await weekDone(), rawBefore = noSaves(await raw());
  await click('[data-action=focus-mode]'); await sleep(200);
  check("Focus mode: just what's next — no greeting, timeline or other cards", (await exists('#focusView')) && (await exists('#focusNext')) && !(await exists('#greeting')) && !(await exists('#slot-glance')) && !(await exists('#quickAdd'))
    && (await ev(`document.querySelector('[data-action=focus-mode]').getAttribute('aria-checked')`)) === 'true');
  check('…a choice for this device only: not part of your saved MyDay data', (await ev(`localStorage.getItem('myday.focus')`)) === '1' && noSaves(await raw()) === rawBefore);
  await openAt(2027, 5, 7, 7);
  check('…and it stays on after a reload', await exists('#focusView'));
  const nextT = await text('#focus-next-h');
  await click('[data-action=focus-next-done]'); await sleep(300);
  day = (await data()).days[K];
  check('"Tick it off" ticks the task up next and moves on', day.tasks.find(t => t.title === nextT).done && (open.length < 2 ? (await text('#focusView')).includes("That's everything for today") : (await text('#focus-next-h')) !== nextT));
  await ev(`location.hash = '#calendar'`); await sleep(250);
  check('the Focus mode switch is only on Today; Calendar is unchanged', !(await exists('[data-action=focus-mode]')) && (await exists('.cal-grid')) && (await text('#screenName')) === 'Calendar');
  await ev(`location.hash = '#today'`); await sleep(250);
  await click('[data-action=focus-show-all]'); await sleep(200);
  check('"Show everything" turns Focus mode off', !(await exists('#focusView')) && (await exists('#greeting')) && (await ev(`localStorage.getItem('myday.focus')`)) === null);
  const done1 = day.tasks.filter(t => t.done).length;
  check('progress follows what you tick', (await text('#todayRing [data-s=ring-words]')) === (done1 === day.tasks.length ? 'All done — lovely' : `${done1} of ${day.tasks.length} done`));
  check('this week counts it too', (await weekDone()) === w0 + 1, [w0, await weekDone()]);

  await T.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await openAt(2027, 5, 7, 9);
  check('wide screens: no month calendar on Today (the Calendar is in the side menu), and the week strip is for phones only', !(await exists('[data-s=month]')) && !(await ev(`document.querySelector('[data-s=week-strip]').getClientRects().length`)));
  const beside = await ev(`(() => { const g = document.getElementById('greeting').getBoundingClientRect(), a = document.querySelector('.today-aside').getBoundingClientRect(), f = document.getElementById('slot-focus').getBoundingClientRect(); return { g: Math.round(g.top), a: Math.round(a.top), f: Math.round(f.top), right: a.left > g.right }; })()`);
  check('wide screens: the side column starts level with the greeting, the focus timer first', beside.right && Math.abs(beside.a - beside.g) <= 1 && Math.abs(beside.f - beside.g) <= 1, beside);
  check('wide screens: the greeting has a button to today\'s plan', (await text('[data-action=greeting-go]')).includes("Today's plan"));
  check('wide screens: the greeting says what is left today', /^You have \d+ tasks? left for today\.$|^Everything on today's plan is done — lovely\.$/.test(await text('[data-s=greeting-line]')), await text('[data-s=greeting-line]'));
  check('wide screens: the side menu has the MyDay logo, which goes to Today', (await ev(`(() => { const a = document.querySelector('#nav .nav-logo'); return !!a && a.getClientRects().length > 0 && a.getAttribute('href') === '#today'; })()`)));
  check('wide screens: "Focus mode" is written next to its switch', (await text('[data-action=focus-mode]')).includes('Focus mode'));
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log("\n[22] One quiet line above today's plan, only when it helps");
  const K2 = '2027-06-02';
  const PT = (uid, title, minutes, x = {}) => ({ uid, taskId: null, category: 'admin', title, minutes, baseMinutes: minutes, done: false, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null, ...x });
  const setDay = (energy, tasks, items = []) => editStorage(`s => { s.rota = { patterns: [] }; delete s.context['${K2}']; s.days['${K2}'] = { energy: ${energy}, rest: false, builtAt: '${K2}T08:00', checkedIn: false, tasks: ${JSON.stringify(tasks)} };
    s.tasks.items = s.tasks.items.filter(t => !t.id.startsWith('tkS')).concat(${JSON.stringify(items)}); }`);
  const summaryLine = async () => (await exists('[data-s=day-summary]')) ? text('[data-s=day-summary]') : null;
  await setDay(4, [PT('s1', 'Laundry', 15), PT('s2', 'Reply to Sam', 15)]);
  await openAt(2027, 6, 2, 9);
  check('a plan that fits your time and energy: no line at all', (await summaryLine()) === null, await summaryLine());
  await setDay(5, [PT('s1', 'Laundry', 60), PT('s2', 'Tidy the desk', 60), PT('s3', 'Plan the week', 60)]);
  await openAt(2027, 6, 2, 20);
  let line = await summaryLine();
  check('more planned than the time left: how much of each, and that leaving something is fine', /^About 3 h planned · (\d+ (h|min)|\d+ h \d+ min|no free time left today)( free)? — it's fine to leave something for tomorrow$/.test(line ?? ''), line);
  await setDay(2, [PT('s1', 'Laundry', 10), PT('s2', 'Reply to Sam', 10)]);
  await openAt(2027, 6, 2, 9);
  line = await summaryLine();
  check('more tasks than your energy has room for: said gently, no score', /— your energy has room for one; the rest can wait$/.test(line ?? '') && !/%|score|behind/i.test(line), line);
  const TI = { id: 'tkS1', title: 'Pay council tax', listId: '', category: 'admin', minutes: 15, due: K2, time: null, notes: '', done: false, doneOn: null, plannedOn: K2, planUid: 's2', createdAt: K2 + 'T08:00', postponed: 0, blockers: [], letGoOn: null };
  await setDay(4, [PT('s1', 'Laundry', 15), PT('s2', 'Pay council tax', 15)], [TI]);
  await openAt(2027, 6, 2, 9);
  line = await summaryLine();
  check('a task due today on the plan: named as the one to start with', /^About 30 min planned · .+ free — first: Pay council tax \(due today\)$/.test(line ?? ''), line);
  await editStorage(`s => { s.days['${K2}'].tasks.forEach(t => { t.done = true; }); }`);
  await openAt(2027, 6, 2, 10);
  check('everything done: the line goes', (await summaryLine()) === null);

  console.log('\n[23] The weekly review card on Today');
  const prefs = async () => (await data()).patterns.prefs;
  const reviewCard = () => exists('#reviewCard');
  await openAt(2026, 10, 18, 9); await reset(); await openAt(2026, 10, 18, 9);
  check('on a Sunday "Look back at your week" shows, with Start going to the review', (await reviewCard()) && (await text('#reviewCard h3')).includes('Look back at your week') && (await ev(`document.querySelector('#reviewCard [data-action=review-start]').getAttribute('href')`)) === '#review', await text('#reviewCard'));
  check('…and the card says what it covers: what moved, what needs you, and next week\'s focus', (await text('#reviewCard')).includes('what moved, what needs you, and next week’s focus') && !(await text('#reviewCard')).includes('what’s waiting'), await text('#reviewCard'));
  check('…and "Not this week" is beside it', await exists('#reviewCard [data-action=review-later]'));
  await openAt(2026, 10, 19, 9);
  check('on the Monday after, the card is still there', await reviewCard());
  await openAt(2026, 10, 20, 9);
  check('on the Tuesday it is gone', !(await reviewCard()));
  await openAt(2026, 10, 18, 9);
  await click('#reviewCard [data-action=review-later]'); await sleep(300);
  check('"Not this week" hides the card, with a gentle message', !(await reviewCard()) && (await toast()).includes('Not this week'), await toast());
  check('…and saves that Sunday as the review put off', (await prefs()).reviewHidden === '2026-10-18', await prefs());
  await openAt(2026, 10, 19, 9);
  check('…and on Monday it stays hidden', !(await reviewCard()));
  await editStorage(`s => { s.patterns.prefs.reviewDay = 5; delete s.patterns.prefs.reviewHidden; }`);
  await openAt(2026, 10, 16, 9);
  check('with the review day set to Friday the card shows on a Friday', await reviewCard());
  await openAt(2026, 10, 18, 9);
  check('…and on that Sunday (two days after) it does not', !(await reviewCard()));
  await editStorage(`s => { s.patterns.prefs.reviewed = '2026-10-16'; }`);
  await openAt(2026, 10, 16, 10);
  check('once that Friday\'s review is done the card is gone', !(await reviewCard()));
  await editStorage(`s => { delete s.patterns.prefs.reviewDay; delete s.patterns.prefs.reviewed; }`);
  await openAt(2026, 10, 18, 10);
  await editStorage(`s => { s.patterns.prefs.reviewed = '2026-10-18'; }`);
  await openAt(2026, 10, 18, 11);
  check('once the Sunday review is done the card is gone that day too', !(await reviewCard()));

  const KP = '2026-10-19';
  const mkT = (id, title, projectId) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2026-10-10T09:00', postponed: 0, blockers: [], letGoOn: null, projectId });
  const mkP = (id, title, updatedAt, x = {}) => ({ id, title, summary: '', stage: 'act', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-01T09:00', updatedAt, ...x });
  await editStorage(`s => { s.projects.items.push(${JSON.stringify(mkP('pjFa', 'Paint the hall', '2026-10-17T09:00'))}, ${JSON.stringify(mkP('pjFb', 'Sort the shed', '2026-10-05T09:00', { focus: KP }))});
    s.tasks.items.push(${JSON.stringify(mkT('tkFa', 'Buy white paint', 'pjFa'))}, ${JSON.stringify(mkT('tkFb', 'Clear the shelves', 'pjFb'))}); }`);
  await openAt(2026, 10, 19, 12);
  const order = await ev(`[...document.querySelectorAll('#projectSteps [data-s=project-step]')].map(li => li.querySelector('.block').textContent.trim() + ' | ' + li.dataset.id)`);
  check('on Monday after choosing a focus, "From your projects" lists the focused project\'s step first, marked "This week’s focus"', order.length === 2 && order[0].startsWith('Sort the shed') && order[0].includes('This week’s focus') && order[1].startsWith('Paint the hall') && !order[1].includes('focus'), order);
  check('…the marker is the step-focus label, once', (await ev(`document.querySelectorAll('#projectSteps [data-s=step-focus]').length`)) === 1 && (await text('#projectSteps [data-s=step-focus]')).includes('This week’s focus'));

  console.log('\n[24] Sayings: one quiet line per screen, chosen for where you are');
  // The app's own choice of saying (app/src/data/sayings.ts, bundled for Node), to find dates and expected sayings.
  const path = require('path'), { pathToFileURL } = require('url'), ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const SY = await import(pathToFileURL(await bundle(path.join(ROOT, 'app/src/data/sayings.ts'), path.join(require('os').tmpdir(), `myday-today-sayings-${process.pid}`))).href);
  const keyOf = i => new Date(Date.UTC(2026, 9, 24 + i)).toISOString().slice(0, 10);  // i days after 24 Oct 2026
  const dateOf = i => keyOf(i).split('-').map(Number);
  const firstDay = (place, id) => { for (let i = 0; i < 365; i++) if (SY.sayingFor(place, keyOf(i)).id === id) return i; throw new Error('no day for ' + id); };
  const GENTLE = ['shafii-days', 'aurelius-mind', 'frankl-change'], TODAY = ['clear-systems', 'clear-vote', 'lesson-resistance'];
  const sayingIds = () => ev(`[...document.querySelectorAll('[data-s=saying]')].map(e => e.dataset.saying)`);
  const sayingKey = () => ev(`localStorage.getItem('myday.sayings')`);
  const rectOf = sel => ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) }; })()`);
  const visit = async hash => { await ev(`location.hash = ${JSON.stringify(hash)}`); await sleep(350); };
  const openFresh = async (i, h = 9) => { const [y, m, d] = dateOf(i); await openAt(y, m, d, h); await reset(); await ev(`localStorage.removeItem('myday.sayings')`); await openAt(y, m, d, h); };
  const open24 = async (i, h = 9) => { const [y, m, d] = dateOf(i); await openAt(y, m, d, h); await sleep(200); };

  // Morning: nothing built yet, energy 3.
  await openFresh(0);
  await setEnergyCommitted(3); await sleep(300);
  let ids = await sayingIds();
  check('morning: exactly one saying is on Today, inside the saying slot', ids.length === 1 && (await ev(`document.querySelectorAll('#slot-saying [data-s=saying]').length`)) === 1, ids);
  check('…and at energy 3 it is one of the ordinary Today sayings (the systems line, the vote line or the resistance lesson)', TODAY.includes(ids[0]), ids);
  const bTop = await rectOf('[data-action=build]'), sTop = await rectOf('[data-s=saying]');
  check('…sitting below the Build my day button', sTop.top > bTop.bottom, [bTop, sTop]);
  const morningId = ids[0];
  await open24(0);
  check('the same day after a reload shows the same saying', eq(await sayingIds(), [morningId]), [morningId, await sayingIds()]);

  // Low energy, on a day when the gentle pick is al-Shāfiʿī.
  const iShafii = firstDay('today-gentle', 'shafii-days');
  await openFresh(iShafii);
  await setEnergyCommitted(2); await sleep(300);
  ids = await sayingIds();
  check('low energy (2): the saying is one of the gentle three (al-Shāfiʿī on the days, Marcus Aurelius, Viktor Frankl)', ids.length === 1 && GENTLE.includes(ids[0]), ids);
  check(`…on ${keyOf(iShafii)} it is al-Shāfiʿī's "Let the days do as they will"`, ids[0] === 'shafii-days', ids);
  const ar = await ev(`[...document.querySelectorAll('[data-s=saying] [lang=ar][dir=rtl]')].map(e => e.textContent)`);
  check('…its Arabic shows as two right-to-left halves, the verse itself', ar.length === 2 && eq(ar, SY.SAYINGS.find(s => s.id === 'shafii-days').ar), ar);
  check('…with a note about the Arabic, at least 44 px tall to tap', (await text('[data-s=saying-more] summary')).trim() === 'About the Arabic' && (await rectOf('[data-s=saying-more] summary')).height >= 44, await rectOf('[data-s=saying-more] summary'));
  check('…and the credit line is "— al-Shāfiʿī"', (await text('[data-s=saying] figcaption')) === '— al-Shāfiʿī', await text('[data-s=saying] figcaption'));

  // A lesson.
  const iLesson = firstDay('today', 'lesson-resistance');
  await openFresh(iLesson);
  await setEnergyCommitted(3); await sleep(300);
  ids = await sayingIds();
  check(`a day with the resistance lesson (${keyOf(iLesson)}) shows it on Today`, eq(ids, ['lesson-resistance']), ids);
  check('…its caption credits the book it follows ("— Lesson from Steven Pressfield, The War of Art") and it has no Arabic', (await text('[data-s=saying] figcaption')) === '— Lesson from Steven Pressfield, The War of Art' && !(await exists('[data-s=saying] [lang=ar]')), await text('[data-s=saying] figcaption'));
  check('…its fold-out is called "Meaning"', (await text('[data-s=saying-more] summary')).trim() === 'Meaning');
  const meaning = SY.SAYINGS.find(s => s.id === 'lesson-resistance').meaning;
  check('…the meaning is kept out of the way until opened', !(await ev(`document.querySelector('[data-s=saying-more]').open`)));
  await click('[data-s=saying-more] summary'); await sleep(150);
  check('…and opening it shows the lesson\'s meaning', (await ev(`document.querySelector('[data-s=saying-more]').open`)) && (await text('[data-s=saying-more] p')) === meaning, await text('[data-s=saying-more] p'));

  // After building the day, the saying follows the plan card.
  await openFresh(0);
  await build(4); await sleep(300);
  ids = await sayingIds();
  const afterPlan = await ev(`(() => { const p = document.getElementById('slot-plan'), s = document.querySelector('#slot-saying [data-s=saying]'); if (!p || !s) return null;
    return { below: s.getBoundingClientRect().top >= p.getBoundingClientRect().bottom, inOrder: !!(p.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING) }; })()`);
  check('after building the day: one saying, sitting after the plan card and not above it', ids.length === 1 && afterPlan && afterPlan.below && afterPlan.inOrder, [ids, afterPlan]);
  check('…and with energy 4 it is an ordinary Today saying', TODAY.includes(ids[0]), ids);
  await editStorage(`s => { s.context['${keyOf(0)}'] = { ...(s.context['${keyOf(0)}'] || {}), energy: 1 }; }`);
  await open24(0);
  ids = await sayingIds();
  check('…and when today\'s energy is changed to 1 after building (in My day\'s context), the saying turns gentle', ids.length === 1 && GENTLE.includes(ids[0]), ids);

  // A rest day.
  await openFresh(1);
  await click('[data-action=skip]'); await sleep(300);
  ids = await sayingIds();
  const afterRest = await ev(`(() => { const p = document.getElementById('slot-plan'), s = document.querySelector('#slot-saying [data-s=saying]'); return p && s ? !!(p.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING) : null; })()`);
  check('a rest day: the saying is from the gentle set and sits after the rest card', ids.length === 1 && GENTLE.includes(ids[0]) && afterRest === true, [ids, afterRest]);

  // The footer switch.
  await openFresh(0);
  const sw = '[data-action=sayings]';
  check('the footer switch starts on: pressed, and reads "Sayings: On"', (await ev(`document.querySelector('${sw}').getAttribute('aria-pressed')`)) === 'true' && (await text(sw)).trim() === 'Sayings: On', await text(sw));
  const rawOn = await raw();
  await click(sw); await sleep(300);
  check('switching off: no saying anywhere on Today', (await sayingIds()).length === 0 && !(await exists('#slot-saying')), await sayingIds());
  check('…the switch is no longer pressed and reads "Sayings: Off"', (await ev(`document.querySelector('${sw}').getAttribute('aria-pressed')`)) === 'false' && (await text(sw)).trim() === 'Sayings: Off', await text(sw));
  check('…with the toast "Sayings off on this device."', (await toast()) === 'Sayings off on this device.', await toast());
  check('…kept on this device as myday.sayings = "off"', (await sayingKey()) === 'off', await sayingKey());
  check('…and your saved MyDay data is untouched', noSaves(await raw()) === noSaves(rawOn));
  check('…and no other MyDay key was added', eq(await mydayKeys(), [KEY, 'myday.sayings']), await mydayKeys());
  await open24(0);
  check('after a reload it is still off', (await sayingIds()).length === 0 && (await text(sw)).trim() === 'Sayings: Off' && (await sayingKey()) === 'off');
  const offSeen = {};
  for (const h of ['#study', '#finance', '#projects', '#review']) { await visit(h); offSeen[h] = await sayingIds(); }
  check('while off, Study, Finance, Projects and Your week show no saying either', Object.values(offSeen).every(a => a.length === 0), offSeen);
  await visit('#today');
  const rawOff = await raw();
  await click(sw); await sleep(300);
  check('switching back on says "Sayings on."', (await toast()) === 'Sayings on.', await toast());
  check('…removes the device key (on is the default)', (await sayingKey()) === null, await sayingKey());
  check('…the saying is back, and the switch reads "Sayings: On"', (await sayingIds()).length === 1 && (await text(sw)).trim() === 'Sayings: On' && (await ev(`document.querySelector('${sw}').getAttribute('aria-pressed')`)) === 'true', await sayingIds());
  check('…and switching back on leaves your saved MyDay data untouched too', noSaves(await raw()) === noSaves(rawOff));

  // The other screens, at a wide size.
  await T.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await openFresh(0);
  const expect = { '#finance': ['housel-money', 'clear-systems', 'covey-end'], '#projects': ['shabbi-life', 'hill-conceive', 'covey-end', 'lesson-business'], '#review': ['shabbi-life', 'clear-vote', 'covey-end'], '#study': ['shafii-learn', 'clear-systems'] };
  const names = { '#finance': 'Finance', '#projects': 'Projects', '#review': 'Your week', '#study': 'Study' };
  for (const [h, set] of Object.entries(expect)) {
    await visit(h);
    const got = await sayingIds();
    check(`${names[h]} shows exactly one saying, from its own set (${set.join(', ')})`, got.length === 1 && set.includes(got[0]) && (set.length > 1 || got[0] === set[0]), got);
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  // Phone.
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await openFresh(0, 7);
  const ph = await ev(`(() => { const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; }; return { build: r('[data-action=build]'), nav: r('#nav'), saying: r('[data-s=saying]'), side: document.documentElement.scrollWidth > innerWidth }; })()`);
  check('phone: Build my day is still fully visible without scrolling, with a saying on the page', !!ph.saying && ph.build.bottom <= ph.nav.top, ph);
  check('phone: the saying is below Build my day', ph.saying.top >= ph.build.bottom, ph);
  check('phone: no sideways scrolling with the saying', ph.side === false, ph);
  await T.send('Emulation.clearDeviceMetricsOverride');
  await ev(`localStorage.removeItem('myday.sayings')`);

  console.log('\n[25] Start offers on Today, under one attention budget');
  {
    // One unprompted offer a day at most: a task that keeps moving, then the learning nudge, then what MyDay noticed.
    const key = (add = 0) => { const dt = new Date(Date.UTC(2027, 2, 10 + add)); return dt.toISOString().slice(0, 10); };
    const D0 = key(0), D1 = key(1), D2 = key(2), D7 = key(7);
    const OT = (id, title, x = {}) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '2027-02-20T09:00', postponed: 0, blockers: [], letGoOn: null, ...x });
    // 16 checked-in days, one learning task each (nothing learned in the last 3 days): 9 of 25 min (7 ticked off), 7 of 60 min (2 ticked off).
    const history = { days: {} };
    for (let i = 4; i <= 19; i++) {
      const short = i <= 12;
      history.days[key(-i)] = { energy: 3, rest: false, builtAt: key(-i) + 'T08:00', checkedIn: true, tasks: [{ uid: 'h' + i, taskId: null, category: 'learning', title: `Study ${short ? 25 : 60}`, minutes: short ? 25 : 60, baseMinutes: short ? 25 : 60, done: short ? i <= 10 : i <= 14, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null }] };
    }
    // A fresh MyDay with these tasks, and optionally the history (fresh patterns) and an old enough start (the nudge applies).
    const scene = async (tasks, { patterns = false, nudge = false, projects = [] } = {}, at = [2027, 3, 10]) => {
      await openAt(...at, 9); await reset(); await openAt(...at, 9);
      await editStorage(`s => { s.tasks.items.push(...${JSON.stringify(tasks)}); s.projects.items.push(...${JSON.stringify(projects)});
        ${patterns ? `Object.assign(s.days, ${JSON.stringify(history.days)});` : ''} ${nudge ? `s.createdOn = '2027-02-01';` : ''} }`);
      await openAt(...at, 9, 5);
    };
    const offerCard = () => exists('#startOffer');
    const noticedLine = () => exists('#noticedLink');
    const notes = async () => (await data()).nudge;
    const none = async () => !(await offerCard()) && !(await nudgeShown()) && !(await noticedLine());
    const STUCK = [OT('tkPass', 'Renew passport', { postponed: 2 })];
    const APPLY = { patterns: true, nudge: true };

    await scene(STUCK);
    check('a task moved twice shows the start offer: "You’ve moved “Renew passport” twice. Want an easier way in?"', (await text('#startOffer [data-s=start-offer]')) === 'You’ve moved “Renew passport” twice. Want an easier way in?', await text('#startOffer'));
    check('…it is at the top of Today', await ev(`(() => { const top = e => e.getBoundingClientRect().top; const c = document.querySelector('#startOffer'); return !!c && [...document.querySelectorAll('.today-main [id]')].every(e => top(c) <= top(e)); })()`));
    check('…with Help me start, Not now and Don’t suggest this again', (await text('#startOffer [data-action=offer-help-start]')) === 'Help me start' && (await text('#startOffer [data-action=offer-not-now]')) === 'Not now' && (await text('#startOffer [data-action=offer-never]')) === 'Don’t suggest this again');
    check('…it is today\'s offer, noted on this device (not with the synced preferences)', JSON.stringify((await notes()).offerOn) === JSON.stringify({ on: D0, kind: 'start' }) && !('offerOn' in (await prefs())), [await notes(), await prefs()]);
    await scene([OT('tkDue', 'Book the boiler service', { postponed: 2, due: key(3) })]);
    check('a dated task moved twice gets the same offer', (await text('#startOffer [data-s=start-offer]')) === 'You’ve moved “Book the boiler service” twice. Want an easier way in?', await text('#startOffer'));
    await scene([OT('tkThree', 'Clear the loft', { postponed: 3 })]);
    check('a task moved 3 times reads "3 times"', (await text('#startOffer [data-s=start-offer]')) === 'You’ve moved “Clear the loft” 3 times. Want an easier way in?', await text('#startOffer'));
    await scene([OT('tkOnce', 'Call the plumber', { postponed: 1 })]);
    check('a task moved once gets no offer', !(await offerCard()));

    await scene(STUCK);
    await click('[data-action=offer-help-start]'); await sleep(400);
    check('Help me start opens that task\'s page with the Help me start card open', (await ev('location.hash')) === '#today/tasks/tkPass' && (await exists('#startCard')), [await ev('location.hash'), await exists('#startCard')]);

    // The budget.
    await scene(STUCK, APPLY);
    check('with a stuck task, an eligible learning nudge and fresh patterns, only the start offer shows', (await offerCard()) && !(await nudgeShown()) && !(await noticedLine()), [await offerCard(), await nudgeShown(), await noticedLine()]);
    check('…today\'s offer is "start", and the nudge is not counted as shown', JSON.stringify((await notes()).offerOn) === JSON.stringify({ on: D0, kind: 'start' }) && (await notes()).lastShownOn === null, await notes());
    await openAt(2027, 3, 10, 12);
    check('…after a reload it is still only the start offer', (await offerCard()) && !(await nudgeShown()) && !(await noticedLine()));

    await scene([], APPLY);
    check('with no stuck task, the nudge shows alone (not the line about what MyDay noticed)', (await nudgeShown()) && !(await offerCard()) && !(await noticedLine()), [await nudgeShown(), await offerCard(), await noticedLine()]);
    check('…today\'s offer is "nudge", and the nudge is counted as shown today', JSON.stringify((await notes()).offerOn) === JSON.stringify({ on: D0, kind: 'nudge' }) && (await notes()).lastShownOn === D0, await notes());
    await click('[data-action=dismiss-nudge]'); await sleep(300);
    check('the nudge\'s "Not today" counts as "Not now": today is marked', !(await nudgeShown()) && (await notes()).notNowOn === D0, await notes());
    await openAt(2027, 3, 10, 13);
    check('…and after a reload nothing is offered', await none());
    await openAt(2027, 3, 11, 9);
    check('…nor the next day', await none());

    await scene([], { patterns: true });
    check('with only fresh patterns, the line about what MyDay noticed shows', (await noticedLine()) && !(await offerCard()) && !(await nudgeShown()), [await noticedLine(), await offerCard(), await nudgeShown()]);
    check('…today\'s offer is "noticed"', JSON.stringify((await notes()).offerOn) === JSON.stringify({ on: D0, kind: 'noticed' }), await notes());
    await editStorage(`s => { s.tasks.items.push(${JSON.stringify(STUCK[0])}); }`);
    await openAt(2027, 3, 10, 12);
    check('once today\'s offer is "noticed", a task that becomes stuck later that day adds no start offer', !(await offerCard()) && (await noticedLine()), [await offerCard(), await noticedLine()]);
    await openAt(2027, 3, 11, 9);
    check('…the next day the start offer comes first, ahead of what MyDay noticed', (await offerCard()) && !(await noticedLine()), [await offerCard(), await noticedLine()]);

    // Editing your lists, nothing is offered, so the day's one isn't used up unseen.
    await scene(STUCK);
    await reset(); await openAt(2027, 3, 10, 9);
    await editStorage(`s => { s.tasks.items.push(...${JSON.stringify(STUCK)}); }`);
    await ev(`location.hash = 'today/edit'`); await sleep(400);
    check('while editing your lists the offer isn\'t shown, and today\'s isn\'t used up', !(await offerCard()) && !(await notes()).offerOn, await notes());

    // "Not now": nothing more today or tomorrow, and not that task for a week.
    const TWO = [OT('tkPass', 'Renew passport', { postponed: 3 }), OT('tkBoiler', 'Book the boiler service', { postponed: 2 })];
    await scene(TWO, APPLY);
    check('before "Not now" the offer is about the most moved task', (await text('#startOffer [data-s=start-offer]')).includes('“Renew passport” 3 times'), await text('#startOffer'));
    await click('[data-action=offer-not-now]'); await sleep(300);
    check('"Not now" takes the card away, marks today, and says so kindly', !(await offerCard()) && (await notes()).notNowOn === D0 && (await toast()) === 'Not now, then. No suggestions today or tomorrow.', [await notes(), await toast()]);
    check('…and keeps that task quiet for a week', JSON.stringify((await notes()).quiet) === JSON.stringify([{ taskId: 'tkPass', on: D0 }]), (await notes()).quiet);
    check('…and focus goes to the page, not nowhere', (await ev(`document.activeElement?.id || ''`)) === 'app', await ev(`document.activeElement?.outerHTML.slice(0, 80)`));
    check('…and does not touch the synced preferences', !('notNowOn' in (await prefs())) && !('startOffers' in (await prefs())), await prefs());
    await openAt(2027, 3, 10, 12);
    check('after a reload, no start offer, no nudge and no line about what MyDay noticed today, though they would apply', await none());
    await openAt(2027, 3, 11, 9);
    check('the next day, none either', await none());
    await openAt(2027, 3, 12, 9);
    check('the day after that, the start offer is back, for the other task (the first stays quiet for a week)', (await offerCard()) && (await text('#startOffer [data-s=start-offer]')).includes('“Book the boiler service” twice'), await text('#startOffer'));
    await openAt(2027, 3, 17, 9);
    check('a week later the first task can be offered again', (await offerCard()) && (await text('#startOffer [data-s=start-offer]')).includes('“Renew passport” 3 times'), await text('#startOffer'));

    // "Don't suggest this again".
    await scene(STUCK, APPLY);
    await click('[data-action=offer-never]'); await sleep(300);
    check('"Don’t suggest this again" takes the card away, saves start offers off, and says where to switch them back on', !(await offerCard()) && (await prefs()).startOffers === false && (await toast()).includes('What MyDay has noticed'), [await prefs(), await toast()]);
    await openAt(2027, 3, 10, 12);
    check('…and nothing else is offered for the rest of today, though the nudge and the line would apply', await none());
    await ev(`location.hash = '#noticed'`); await sleep(400);
    check('in What MyDay has noticed, "Offers to help you start a task" shows Off', (await text('label[for=prefStartOffers]')) === 'Offers to help you start a task' && (await ev(`document.getElementById('prefStartOffers').selectedOptions[0].textContent`)) === 'Off', await ev(`document.getElementById('prefStartOffers').value`));
    await setVal('#prefStartOffers', 'on'); await sleep(300);
    check('choosing "On" removes the field from the preferences', !('startOffers' in (await prefs())), await prefs());
    await openAt(2027, 3, 11, 9);
    check('…and on a later day the start offer can show again', await offerCard());

    // The preference.
    await scene([]);
    await ev(`location.hash = '#noticed'`); await sleep(400);
    check('"Offers to help you start a task" is a choice between On Today, when a task keeps moving (the usual), and Off',
      eq(await ev(`[...document.querySelectorAll('#prefStartOffers option')].map(o => [o.value, o.textContent])`), [['on', 'On Today, when a task keeps moving (the usual)'], ['off', 'Off']]) && (await ev(`document.getElementById('prefStartOffers').value`)) === 'on', await ev(`document.getElementById('prefStartOffers').outerHTML`));
    await setVal('#prefStartOffers', 'off'); await sleep(300);
    check('choosing Off saves startOffers: false', (await prefs()).startOffers === false, await prefs());

    // Help steps back (specs/help-me-start.md §6): the last 5 done tasks of a kind were done without moving.
    const EASY = [1, 2, 3, 4, 5].map(i => OT('tkEasy' + i, 'Done admin ' + i, { done: true, doneOn: key(-i), due: key(-i), postponed: 0 }));
    await scene([...EASY, OT('tkStuckAdmin', 'Renew the licence', { postponed: 3 })]);
    check('a stuck admin task gets no start offer when the last 5 admin tasks were done without moving', !(await offerCard()), await text('#app'));
    await scene([...EASY, OT('tkStuckAdmin', 'Renew the licence', { postponed: 3 }), OT('tkStuckLearn', 'Read the chapter', { category: 'learning', postponed: 2 })]);
    check('…but a stuck learning task still does: "You’ve moved “Read the chapter” twice. Want an easier way in?"', (await text('#startOffer [data-s=start-offer]')) === 'You’ve moved “Read the chapter” twice. Want an easier way in?', await text('#startOffer'));
    await scene([...EASY.slice(0, 4), OT('tkStuckAdmin', 'Renew the licence', { postponed: 3 })]);
    check('…and with only 4 such admin tasks done, a stuck admin task is offered as usual', (await text('#startOffer [data-s=start-offer]')) === 'You’ve moved “Renew the licence” 3 times. Want an easier way in?', await text('#startOffer'));
  }


  console.log('\n[26] Today\'s Study entry (Arabic): the lesson it is now, a link to it, and ticking when you finish a session');
  {
    const nav = async h => { await ev(`location.hash = ${JSON.stringify(h)}`); await sleep(300); };
    const rowTitle = () => ev(`(document.querySelector('#app .task .title') || {}).textContent || ''`);
    const focusId = () => ev(`document.activeElement && document.activeElement.id`);
    await openAt(2027, 3, 1); await reset(); await openAt(2027, 3, 1);
    await editStorage(`s => { s.study.settings.primarySubject = 'arabic'; }`);
    await openAt(2027, 3, 1);
    await build(3);
    await until(() => exists('[data-action=plan-study]'));
    const title1 = await rowTitle(), lesson1 = title1.split(' · ')[1], saved1 = (await data()).days['2027-03-01'].tasks[0];
    check('Build my day with Arabic as your focus: the learning row names the lesson it is now, "Arabic Fuṣḥā · <lesson>", and says why', title1.startsWith('Arabic Fuṣḥā · ') && !!lesson1 && (await text('#app .task [data-s=plan-study-detail]')) === 'The first lesson in your course', title1);
    check('…while the saved entry has its subject\'s title, is marked by its task id and is not ticked', saved1.title === 'Arabic Fuṣḥā — your next lesson' && saved1.taskId === 'study:arabic' && saved1.done === false && !('study' in saved1), saved1);
    const href1 = await ev(`document.querySelector('[data-action=plan-study]').getAttribute('href')`);
    check('its link goes to that lesson', /^#study\/arabic\/lesson\./.test(href1), href1);
    await click('[data-action=plan-study]'); await sleep(400);
    check('…and following it opens the lesson', (await ev('location.hash')) === href1 && (await text('#app')).includes(lesson1), await ev('location.hash'));
    await until(() => exists('[data-action="ar-begin"]')); await click('[data-action="ar-begin"]');
    await until(() => exists('[data-action="ar-finish"]')); await click('[data-action="ar-finish"]'); await sleep(400);
    check('finishing the session leaves the entry ticked (the Study action wrote it)', (await data()).days['2027-03-01'].tasks[0].done === true, (await data()).days['2027-03-01'].tasks[0]);
    await nav('today');
    const done1 = (await data()).days['2027-03-01'].tasks[0];
    check('…and it keeps the lesson\'s name for your history: "Arabic Fuṣḥā: <lesson>", still marked as Study\'s', done1.title === 'Arabic Fuṣḥā: ' + lesson1 && done1.taskId === 'study:arabic', done1);
    check('…Today shows the row ticked, with that name', (await ev(`document.querySelector('#app .task input').checked`)) === true && (await rowTitle()) === 'Arabic Fuṣḥā: ' + lesson1, await rowTitle());

    console.log('\n[27] Ready — next lesson, from Today\'s Study card: the card and the row move on, and the row stays to do');
    await openAt(2027, 3, 2);
    await build(3);
    await until(() => exists('[data-action=plan-study]'));
    check('the next day the step is still that lesson, now practised (Study moves on only when you say it has clicked)', (await rowTitle()) === 'Arabic Fuṣḥā · ' + lesson1 && (await text('#app .task [data-s=plan-study-detail]')) === 'Practised — mark it ready when it clicks', await rowTitle());
    check('…and Today\'s Study card offers "Ready — next lesson"', (await exists('[data-action=today-ready]')) && (await text('[data-action=today-ready]')).includes('Ready — next lesson'));
    await click('[data-action=today-ready]');
    await until(async () => !(await exists('[data-action=today-ready]')));
    await until(async () => (await rowTitle()) !== 'Arabic Fuṣḥā · ' + lesson1);
    const title2 = await rowTitle(), lesson2 = title2.split(' · ')[1];
    check('tapping it marks the lesson ready (as the lesson page does)', (await data()).arabic.lessons.some(l => l.id === decodeURIComponent(href1.split('/').pop()) && l.readyOn === '2027-03-02'), (await data()).arabic.lessons);
    check('the plan\'s Study row moves to the next lesson, with the next-lesson line', !!lesson2 && lesson2 !== lesson1 && (await text('#app .task [data-s=plan-study-detail]')) === 'Next in your course', title2);
    check('…and Today\'s card shows that same lesson, with no Ready button', (await text('[data-s=study-next-lessons] [data-subject=arabic] .font-semibold')) === lesson2 && !(await exists('[data-action=today-ready]')), await text('[data-s=study-next-lessons] [data-subject=arabic] .font-semibold'));
    const e2 = (await data()).days['2027-03-02'].tasks[0];
    check('the row stays to do: not ticked, still saved under its subject\'s title', e2.done === false && e2.title === 'Arabic Fuṣḥā — your next lesson' && e2.taskId === 'study:arabic', e2);
    await until(async () => (await focusId()) === 'study-card-h', 2000);
    check('focus goes to the card\'s heading, since the button it was on has gone', (await focusId()) === 'study-card-h', await focusId());

    console.log('\n[28] A session left open more than 7 days: Today\'s card offers Resume or Let it go (asked first)');
    await openAt(2027, 3, 10);
    // (by then the lesson marked ready has its checks back in revision, so the card may say "Go to the lesson" rather than "Continue")
    const lessonLink = '[data-s=study-next-lessons] [data-subject=arabic] a[data-action=continue-learning], [data-s=study-next-lessons] [data-subject=arabic] a[data-action=option-lesson]';
    await until(() => exists(lessonLink));
    const href3 = await ev(`document.querySelector(${JSON.stringify(lessonLink)}).getAttribute('href')`);
    await nav(href3.slice(1));
    await until(() => exists('[data-action="ar-begin"]')); await click('[data-action="ar-begin"]'); await sleep(300);
    await editStorage(`s => { const a = s.arabic.attempts.find(x => !x.finishedAt); a.startedAt = '2027-03-02T20:00:00.000Z';
      let l = (s.arabic.lessons ||= []).find(x => x.id === a.lessonId); if (!l) { l = { id: a.lessonId }; s.arabic.lessons.push(l); } l.marks = { q1: { outcome: 'right', support: 'independent', on: '2027-03-02', attemptId: a.id } };
      (s.arabic.practice ||= []).push({ id: a.lessonId, open: { attemptId: a.id, did: ['try'] } }); }`);
    await openAt(2027, 3, 10, 9, 5);
    const seeded = await data(), att = seeded.arabic.attempts.find(x => !x.finishedAt);
    check('setup: an unfinished session started on 2 March, with a mark and a tick in it', !!att && att.startedAt === '2027-03-02T20:00:00.000Z' && !!seeded.arabic.lessons.find(l => l.id === att.lessonId)?.marks?.q1 && !!seeded.arabic.practice.find(p => p.id === att.lessonId)?.open, att);
    await until(() => exists('[data-s=today-left-open]'));
    const leftText = await text('[data-s=today-left-open]'), leftTitle = (await text('[data-s=study-next-lessons] [data-subject=arabic] .font-semibold'));
    check('Today\'s card says what was left open and when, instead of holding the step on it', leftText.includes('You left “' + leftTitle + '” open on Tue 2 Mar.') && !(await exists('[data-action=today-ready]')), leftText);
    check('…with Resume, going to that lesson', (await text('[data-s=today-left-open] a')).trim() === 'Resume' && (await ev(`document.querySelector('[data-s=today-left-open] a').getAttribute('href')`)) === '#study/arabic/' + att.lessonId);
    await click('[data-action=today-let-go]');
    await sleep(200);
    check('Let it go asks first, saying what goes', (await dialogText()).includes('Let this session go?') && (await dialogText()).includes('answers, marks and note'), await dialogText());
    await answer(false);
    const kept = await data();
    check('"Keep it" leaves everything: the session, its mark and its tick', kept.arabic.attempts.some(x => x.id === att.id && !x.finishedAt) && !!kept.arabic.lessons.find(l => l.id === att.lessonId)?.marks && !!kept.arabic.practice.find(p => p.id === att.lessonId)?.open && (await exists('[data-s=today-left-open]')));
    await click('[data-action=today-let-go]'); await answer(true);
    await until(async () => !(await exists('[data-s=today-left-open]')));
    const gone = await data();
    check('"Let it go" removes the session, its marks and its ticks, and the line goes', !gone.arabic.attempts.some(x => x.id === att.id) && !gone.arabic.lessons.find(l => l.id === att.lessonId)?.marks && !gone.arabic.practice.find(p => p.id === att.lessonId)?.open && !(await exists('[data-s=today-left-open]')), gone.arabic);
    await until(async () => (await focusId()) === 'study-card-h', 2000);
    check('focus goes to the card\'s heading', (await focusId()) === 'study-card-h', await focusId());

    console.log('\n[29] A Cybersecurity notebook draft left more than 7 days: "Open it", and nothing to let go of');
    await reset(); await openAt(2027, 3, 10);
    await nav('study/cybersecurity/assessment.learning-evidence-check');
    await until(() => exists('[data-action=cyber-begin]')); await click('[data-action=cyber-begin]'); await sleep(300);
    await editStorage(`s => { s.cybersecurity.attempts[0].startedAt = '2027-03-02T20:00:00.000Z'; }`);
    await openAt(2027, 3, 10, 9, 5);
    await until(() => exists('[data-s=today-left-open]'));
    const dText = await text('[data-s=today-left-open]');
    check('Today\'s card says you have a notebook draft from 2 March, that it stays in your notebook, and offers Open it', dText.includes('notebook draft') && dText.includes('from Tue 2 Mar') && dText.includes('stays in your notebook') && (await text('[data-s=today-left-open] a')).trim() === 'Open it', dText);
    check('…and there is no Let it go: the draft holds your notebook work', !(await exists('[data-action=today-let-go]')));
  }

  console.log('\n[30] "Leave for later" on Study\'s step: it is not queued, and the proposal says tomorrow picks up where you are in Study');
  {
    await openAt(2027, 4, 1); await reset(); await openAt(2027, 4, 1);
    await setEnergy(5); await click('[data-action=build]');
    await click('[data-action=prop-edit]');
    // (an item set to Later moves down the list, so each is found by its title)
    const itemOf = title => `[...document.querySelectorAll('.prop-item')].find(li => li.querySelector('.title').textContent === ${JSON.stringify(title)})`;
    const itemText = title => ev(`${itemOf(title)}.textContent`);
    check('setup: the proposal is Study\'s step, Laundry and Gym', eq(await ev(`[...document.querySelectorAll('.prop-item .title')].map(e => e.textContent)`), [CYB_SAVED, 'Laundry', 'Gym']));
    await ev(`${itemOf(CYB_SAVED)}.querySelector('[data-action=prop-later]').click()`); await sleep(150);
    await ev(`${itemOf('Laundry')}.querySelector('[data-action=prop-later]').click()`); await sleep(150);
    const studyLater = await itemText(CYB_SAVED), laundryLater = await itemText('Laundry');
    check('Study\'s step set to Later says "Tomorrow’s plan picks up where you are in Study."', studyLater.includes('Tomorrow’s plan picks up where you are in Study.') && !studyLater.includes('queue'), studyLater);
    check('…while an ordinary task set to Later says it will wait in the queue', laundryLater.includes('wait in your queue for another day') && !laundryLater.includes('picks up where you are'), laundryLater);
    await click('[data-action=prop-done-edit]'); await click('[data-action=prop-apply]');
    const later = await data();
    check('applying leaves only Gym on the plan, queues only Laundry, and queues nothing for Study', eq(later.days['2027-04-01'].tasks.map(t => t.title), ['Gym']) && eq(later.queue.map(q => q.title), ['Laundry']), [later.days['2027-04-01'].tasks.map(t => t.title), later.queue.map(q => q.title)]);
  }


  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
