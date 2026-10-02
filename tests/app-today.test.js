// Today in the NEW app (app/, built into app/dist): the same checks as today.test.js, adapted.
// Differences from the current MyDay that these checks expect:
//  - "Are you sure?" questions are asked in the page (a dialog), not with the browser's confirm().
//  - Data from older versions of MyDay is updated by the current MyDay, not the new app.
const fs = require('fs');
const T = require('./cdp.js');
T.setUrl('app/dist/index.html');
const { openAt, ev, click, exists, text, data, setFile, check, sleep, S } = T;
const noSaves = t => { const o = typeof t === 'string' ? JSON.parse(t) : JSON.parse(JSON.stringify(t)); delete o.saves; return JSON.stringify(o); };
const THM = 'TryHackMe: Pre-Security path — one section', BANDIT = 'OverTheWire Bandit — one level',
  NET = 'HTB Academy: Networking module — one section', WEB = 'HTB Academy: Web Requests module — one section';
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
  check('after "Apply": energy 5 → 3 tasks (learning, admin, health)', eq(p1, [THM, 'Laundry', 'Gym']), p1);
  const uids1 = (await data()).days['2026-10-02'].tasks.map(t => t.uid);
  await openAt(2026, 10, 2, 15);
  check('refresh shows the same plan', eq(await planTitles(), p1));
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
  check('…and still shows the 2 October plan', eq(await planTitles(), p1));
  await ev('__setNow(2026, 10, 2, 23, 59, 50)'); await ev(`document.dispatchEvent(new Event('visibilitychange'))`); await sleep(100);
  check('23:59:50 still the 2nd', (await text('#date')) === 'Friday 2 October');
  await ev('__setNow(2026, 10, 3, 0, 0, 5)');
  await sleep(31000);
  check('after midnight (no reload) the header rolls to Saturday 3 October', (await text('#date')) === 'Saturday 3 October', await text('#date'));
  check('…and the morning screen appears for the new day', await exists('[data-action=build]'));

  console.log('\n[3] Yesterday\'s completions are never re-selected; learning cycles in order');
  await editStorage(`s => { s.lists.health = [{ id: 'h1', title: 'Gym', minutes: 60 }]; }`);
  const p3 = await buildAt(2026, 10, 3, 5);
  check('3 Oct: Gym (done on the 2nd, only health item) is skipped', !p3.includes('Gym'), p3);
  check('3 Oct: learning moves to the next session (Bandit)', p3[0] === BANDIT, p3);
  const p4 = await buildAt(2026, 10, 4, 5);
  check('4 Oct: Gym is allowed again (not done yesterday)', p4.includes('Gym'), p4);
  check('4 Oct: Bandit repeats because it was not completed', p4[0] === BANDIT, p4);
  await tick(0);
  const seq = [];
  for (const d of [5, 6, 7]) { const p = await buildAt(2026, 10, d, 3); seq.push(p[0]); await tick(0); }
  seq.push((await buildAt(2026, 10, 8, 3))[0]);
  check('learning order: Networking, Web Requests, then cycles to THM, Bandit', eq(seq, [NET, WEB, THM, BANDIT]), seq);
  await click('[data-action=edit]');
  const counts = await ev(`[...document.querySelectorAll('.edit-row[data-cat=learning] .count')].map(e => e.textContent)`);
  check('session counts tracked per activity (2, 1, 1, 1)', eq(counts, ['Sessions completed: 2', 'Sessions completed: 1', 'Sessions completed: 1', 'Sessions completed: 1']), counts);

  console.log('\n[4] Roll to tomorrow: queued once, energy limit respected, remainder kept');
  await openAt(2026, 10, 10); await reset();
  await buildAt(2026, 10, 10, 5);
  await click('[data-action=evening]');
  await rollBtn(0); await rollBtn(1); await rollBtn(2);
  await rollBtn(2); await rollBtn(2); await rollBtn(1); await rollBtn(1);
  let q = (await data()).queue;
  check('three tasks rolled (some toggled twice) → exactly 3 queue entries', q.length === 3, q.map(x => x.title));
  check('no duplicate activities in the queue', new Set(q.map(x => x.taskId)).size === 3);
  check('evening summary is friendly', (await text('.summary')).startsWith('0 of 3 done — some days are like that.'), await text('.summary'));
  await click('[data-action=finish-evening]');
  await openAt(2026, 10, 10, 21);
  check('queue survives refresh', (await data()).queue.length === 3);
  const r2 = await buildAt(2026, 10, 11, 2);
  check('11 Oct energy 2 → exactly 1 task, the smallest (Laundry, carried over)', eq(r2, ['Laundry']), r2);
  q = (await data()).queue;
  check('the other 2 stay queued (THM, Gym)', eq(q.map(x => x.title), [THM, 'Gym']), q.map(x => x.title));
  await click('[data-action=evening]'); await rollBtn(0); await click('[data-action=finish-evening]');
  const r3 = await buildAt(2026, 10, 12, 3);
  check('12 Oct energy 3 → 2 tasks: THM + oldest waiting (Gym)', eq(r3, [THM, 'Gym']), r3);
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
  await openAt(2026, 12, 1); await reset();
  const shownDays = [];
  for (const d of [1, 2, 3]) { await openAt(2026, 12, d); shownDays.push(await nudgeShown()); await build(1); }
  check('not shown on a new user\'s first three days', eq(shownDays, [false, false, false]), shownDays);
  await openAt(2026, 12, 4);
  check('shown after three full days with no learning', await nudgeShown());
  await openAt(2026, 12, 4, 12);
  check('not shown again the same day after refresh', !(await nudgeShown()));
  await editStorage(`s => { s.lists.learning.forEach(l => l.minutes = 90); }`);
  await openAt(2026, 12, 5);
  check('shown again the next day', await nudgeShown());
  await build(1);
  const low = await planTitles();
  check('energy 1 picks one non-learning task', low.length === 1 && ![THM, BANDIT, NET, WEB].includes(low[0]), low);
  await click('[data-action=shrink]');
  check('no learning in plan → offers to swap an optional task', await exists('[data-action=swap-learning]'));
  check('no "add" option when the plan is at its limit', !(await exists('[data-action=add-learning]')));
  await click('[data-action=swap-learning]');
  const swapped = (await data()).days['2026-12-05'].tasks;
  check('swap keeps the 1-task limit with one 15-min learning session in the same time slot', swapped.length === 1 && swapped[0].category === 'learning' && swapped[0].minutes === 15 && swapped[0].scheduledStart === '2026-12-05T09:00' && swapped[0].scheduledEnd === '2026-12-05T09:15', swapped);
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
  check('export has format, schemaVersion 4, exportedAt, data (with settings, commitments, context)',
    exp.format === 'myday-export' && exp.schemaVersion === 4 && /^2026-12-09T\d\d:\d\d$/.test(exp.exportedAt) && exp.data.schemaVersion === 4 &&
    !!exp.data.settings && Array.isArray(exp.data.commitments) && typeof exp.data.context === 'object');
  check('export is the full saved data (identical to what is stored)', noSaves(exp.data) === noSaves(await raw()));
  const snapshot = await raw();
  fs.writeFileSync(S + '/bad.json', 'hello, not json');
  await importFile(S + '/bad.json');
  check('non-JSON import rejected, nothing changed', (await toast()).includes("isn't readable JSON") && (await raw()) === snapshot, await toast());
  fs.writeFileSync(S + '/newer.json', JSON.stringify({ format: 'myday-export', schemaVersion: 5, data: {} }));
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
  check('"Start fresh" replaces it with valid data', (await data()).schemaVersion === 4 && (await exists('[data-action=build]')));
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
  check('…lists repaired (learning reseeded, bad admin dropped, minutes defaulted)', fx.lists.learning.length === 4 && fx.lists.admin.length === 1 && fx.lists.admin[0].minutes === 20);
  check('…days repaired (bad date and bad task dropped, bad time cleared)', !fx.days['2026-13-45'] && fx.days['2026-12-08'].tasks.length === 1 && fx.days['2026-12-08'].tasks[0].scheduledStart === null);
  check('…settings fall back to defaults', eq(fx.settings, { bufferMinutes: 30, earliestTime: '08:00', latestTime: '21:00', gapMinutes: 10, theme: 'dark', motion: 'auto' }), fx.settings);
  check('…invalid commitments dropped, the valid night shift kept', fx.commitments.length === 1 && fx.commitments[0].title === 'Night');
  check('…context cleaned (bad energy/estimate removed, valid wake time kept)', fx.context['2026-12-09'].sleep.end === '2026-12-09T07:00' && fx.context['2026-12-09'].sleep.estimatedHours === null && !fx.context.junk);
  await reset();
  await openAt(2026, 12, 9, 12);
  check('missing data → fresh start with seed lists and default settings', (await data()).lists.learning.length === 4 && (await data()).settings.bufferMinutes === 30);
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
  check('an exported version-2 file imports into the new app', Object.keys(iv2.days).length === 2 && iv2.days['2027-01-05'].tasks[0].done === true && iv2.schemaVersion === 4);
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
  check('proposal fits around work, dentist and prep/travel', eq(pp, ['08:00–08:30 | ' + THM, '08:40–08:55 | Laundry', '16:30–17:30 | Gym']), pp);
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
    [[THM, '2027-02-01T08:00', '2027-02-01T08:30'], ['Laundry', '2027-02-01T08:40', '2027-02-01T08:55'], ['Gym', '2027-02-01T15:30', '2027-02-01T16:30']]), day1.tasks.map(t => [t.title, t.scheduledStart]));
  check('plan shows times and flags the overlap', (await text('#slot-plan')).includes('15:30–16:30') && (await text('#slot-plan .warn')).includes('Overlaps Dentist'));

  console.log('\n[13] Review my plan');
  await click('[data-action=review]');
  const rv = await ev(`[...document.querySelectorAll('.prop-item')].map(li => li.querySelector('.title').textContent + ' | ' + li.querySelector('.prop-when').textContent + ' | ' + ((li.querySelector('.change') || {}).textContent || ''))`);
  check('review moves only Gym, others unchanged', eq(rv, [THM + ' | 08:00–08:30 | No change.', 'Laundry | 08:40–08:55 | No change.', 'Gym | 16:30–17:30 | Was 15:30–16:30.']), rv);
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
  check('energy 2 with THM done → THM kept, Laundry and Gym proposed for later', eq(rv2, [THM + ' | 08:00–08:30', 'Laundry | Later', 'Gym | Later']), rv2);
  await click('[data-action=prop-apply]');
  const d2 = (await data()).days['2027-02-01'];
  check('completed THM untouched (same record, still done, same time)', JSON.stringify(d2.tasks[0]) === thmBefore && d2.tasks.length === 1);
  check('Laundry and Gym now wait in the queue', eq((await data()).queue.map(x => x.title).sort(), ['Gym', 'Laundry']));
  check('learning count keeps the completed session', (await count()) === 1);
  await setEnergyCommitted(5);
  await click('[data-action=review]');
  const rv3 = await ev(`[...document.querySelectorAll('.prop-item')].map(li => li.querySelector('.title').textContent + ' | ' + ((li.querySelector('.change') || {}).textContent || ''))`);
  check('energy back to 5 → proposes adding two tasks back from the queue', rv3.length === 3 && rv3.filter(x => x.includes('New —')).length === 2, rv3);
  await click('[data-action=prop-apply]');
  check('…applied: 3 tasks, queue empty, THM still done', (await data()).days['2027-02-01'].tasks.length === 3 && (await data()).queue.length === 0 && (await data()).days['2027-02-01'].tasks[0].done);

  console.log('\n[14] Tasks that can\'t fit: shorten, or leave for later');
  await openAt(2027, 2, 3, 7);
  await setVal('#latestTime', '08:50');
  await setEnergyCommitted(3);
  await click('[data-action=build]');
  const un = await ev(`[...document.querySelectorAll('.prop-item')].map(li => li.querySelector('.prop-when').textContent + ' | ' + li.querySelector('.title').textContent + ' | ' + ((li.querySelector('.why') || {}).textContent || ''))`);
  check('second task is unscheduled with a clear reason', un.length === 2 && un[1].startsWith('No time yet | Bulk cook 2 meals | Unscheduled: It needs 1 h, but the longest free stretch left is 20 min (08:30–08:50).'), un);
  check('offers "Shorten to 20 min" and "Leave for later"', (await text('[data-action=prop-shorten]')) === 'Shorten to 20 min' && (await exists('[data-action=prop-later]')));
  await click('[data-action=prop-shorten]');
  check('shortened task now fits at 08:30–08:50', (await props()).includes('08:30–08:50 | Bulk cook 2 meals'), await props());
  await click('[data-action=prop-apply]');
  const sh = (await data()).days['2027-02-03'].tasks.find(t => t.title === 'Bulk cook 2 meals');
  check('saved as 20 min, original 60 kept', sh.minutes === 20 && sh.baseMinutes === 60 && (await text('#slot-plan')).includes('20 min (shortened from 60)'));
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
  check('dark by default', (await ev(`document.documentElement.dataset.theme`)) === 'dark' && (await bgOf()) === 'rgb(16, 19, 21)', await bgOf());
  check('theme button labelled for screen readers', (await ev(`document.getElementById('themeBtn').getAttribute('aria-label')`)) === 'Theme: Dark. Tap to change.');
  await click('#themeBtn'); await sleep(400);
  check('tap → Light: light colours applied and saved', (await ev(`document.documentElement.dataset.theme`)) === 'light' && (await bgOf()) === 'rgb(244, 246, 244)' && (await data()).settings.theme === 'light');
  check('browser bar colour follows the theme', (await ev(`document.querySelector('meta[name=theme-color]').content`)) === '#f4f6f4');
  await T.send('Page.addScriptToEvaluateOnNewDocument', { source: `new MutationObserver((m, o) => { if (document.body) { window.__themeAtBody = document.documentElement.getAttribute('data-theme'); o.disconnect(); } }).observe(document, { childList: true, subtree: true });` });
  await openAt(2027, 2, 7, 8);
  check('saved theme is applied before the page body appears (no flash)', (await ev('window.__themeAtBody')) === 'light', await ev('window.__themeAtBody'));
  await click('#themeBtn'); await sleep(400);
  await T.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  check('tap → Match device (device dark) → dark colours', (await ev(`document.documentElement.dataset.theme`)) === 'auto' && (await bgOf()) === 'rgb(16, 19, 21)', await bgOf());
  await T.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  check('…device switches to light → light colours', (await bgOf()) === 'rgb(244, 246, 244)', await bgOf());
  await click('#themeBtn'); await sleep(400);
  check('tap → back to Dark (even when the device is light)', (await ev(`document.documentElement.dataset.theme`)) === 'dark' && (await bgOf()) === 'rgb(16, 19, 21)');
  await T.send('Emulation.setEmulatedMedia', { features: [] });
  const contrastIn = async theme => ev(`(() => {
    document.documentElement.dataset.theme = ${JSON.stringify(theme)};
    const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue('--' + n).trim();
    // The build shortens some colours (e.g. #ffffff → #fff), so expand those first.
    const full = h => (h.length === 4 ? '#' + [...h.slice(1)].map(x => x + x).join('') : h);
    const L = hx => { const h = full(hx); const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const cr = (a, b) => { const [x, y] = [L(v(a)), L(v(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const pairs = [['text','surface'],['text-2','surface'],['text-3','surface'],['text-3','surface-2'],['primary','surface'],['on-primary','primary'],['on-primary-container','primary-container'],['on-tonal','tonal'],
      ['learning','learning-c'],['admin','admin-c'],['health','health-c'],['rest','rest-c'],['work','work-c'],['appt','appt-c'],['on-warn-c','warn-c'],['on-inverse','inverse']];
    return Math.min(...pairs.map(([a, b]) => cr(a, b)));
  })()`);
  const cDark = await contrastIn('dark'), cLight = await contrastIn('light');
  check('every text colour pair ≥ 4.5:1 in dark and light', cDark >= 4.5 && cLight >= 4.5, [cDark.toFixed(2), cLight.toFixed(2)]);
  await openAt(2027, 2, 7, 9);

  console.log('\n[18] Layout');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await openAt(2027, 2, 6, 9);
  const rects = await ev(`(() => { const r = id => { const b = document.getElementById(id).getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top }; }; return { plan: r('slot-plan'), glance: r('slot-glance'), streak: r('streak') }; })()`);
  check('desktop: dashboard with timeline and count in a side column', rects.glance.left > rects.plan.right && rects.streak.left === rects.glance.left && rects.glance.top < 200, rects);
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
  check('phone morning: Build my day is fully visible without scrolling', await ev(`document.querySelector('[data-action=build]').getBoundingClientRect().bottom <= document.getElementById('nav').getBoundingClientRect().top`));
  check('phone morning: the folded context says what is in it', (await text('#slot-context details summary')).includes('Nothing booked today') && (await text('#slot-context details summary')).includes('min prep/travel'));
  await click('[data-action=build]');
  check('no sideways scrolling at phone width (proposal)', !(await ev('document.documentElement.scrollWidth > innerWidth')));
  await T.send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[19] Animations, focus timer, celebration, garden');
  const secs = async () => { const p = (await text('#timerTime')).split(':').map(Number); return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]; };
  const advanceTimer = sec => ev(`(() => { const t = JSON.parse(localStorage.getItem('${KEY}')).timer; const d = new Date(t.startedAt + ${'${sec}'} * 1000); __setNow(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()); })()`.replace('${sec}', sec));
  const tickAll = async () => { while (await ev(`!!document.querySelector('#app .task input:not(:checked)')`)) { await ev(`document.querySelector('#app .task input:not(:checked)').click()`); await sleep(50); } };
  const anim = sel => ev(`(() => { const el = document.querySelector(${JSON.stringify('X')}); return el ? getComputedStyle(el).animationName : 'missing'; })()`.replace('"X"', JSON.stringify(sel)));
  await reset(); await openAt(2027, 5, 3, 7);
  check('garden starts as a seed with a friendly caption', (await text('#gardenCaption')).startsWith('Each learning session you finish grows a leaf'));
  await setEnergy(5); await click('[data-action=build]');
  check('proposal items slide in one by one', (await ev(`document.querySelectorAll('.prop-item.stagger').length`)) === 3);
  await click('[data-action=prop-edit]');
  check('…but not again on every edit', (await ev(`document.querySelectorAll('.prop-item.stagger').length`)) === 0);
  await click('[data-action=prop-done-edit]'); await click('[data-action=prop-apply]');
  check('moving to the plan screen fades the cards in', await exists('#app .enter'));
  check('"Just start" is highlighted only on the next task', (await ev(`[...document.querySelectorAll('[data-action=timer-start]')].map(b => b.dataset.variant === 'ghost')`)).join() === 'false,true,true');
  check('the next task is marked "Up next"', (await text('#app .task.next')).includes('Up next') && (await ev(`document.querySelectorAll('#app .task.next').length`)) === 1);
  await tick(0);
  check('ticking plays a pop + glow on that card', (await anim('.task.just-done')) === 'glow' && (await anim('.task.just-done .box')) === 'pop');
  check('garden grows its first leaf, with a grow animation', (await text('#gardenCaption')).startsWith('1 learning session so far · 0 flowers and a sprout with 1 leaf') && (await ev(`document.querySelectorAll('#garden .gd-leaf').length`)) === 1 && (await exists('#garden .gd-grow')));
  check("today's tile in the 7-day row pops", await exists('.wd.today.on.just'));
  check('a gentle "1 done so far" note (no score before anything is ticked)', (await text('#slot-plan')).includes('1 done so far'));
  await openAt(2027, 5, 3, 7, 1);
  check('animations play once, not on every refresh', !(await exists('.task.just-done')) && !(await exists('#garden .gd-grow')));

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

  await editStorage(`s => { for (let i = 1; i <= 10; i++) { const k = '2027-04-' + String(i).padStart(2, '0'); s.days[k] = { energy: 3, rest: false, builtAt: '', checkedIn: true, tasks: [{ uid: 'g' + i, taskId: 'l1', category: 'learning', title: 'Old session', minutes: 30, baseMinutes: 30, done: true, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null }] }; } }`);
  await openAt(2027, 5, 5, 9);
  const n = Object.values((await data()).days).reduce((a, d) => a + d.tasks.filter(t => t.category === 'learning' && t.done).length, 0);
  const fl = await ev(`document.querySelectorAll('#garden .gd-flower').length`), lv = await ev(`document.querySelectorAll('#garden .gd-leaf').length`);
  check(`garden: ${n} sessions → ${Math.floor(n / 5)} flowers + ${n % 5} leaves`, fl === Math.floor(n / 5) && lv === n % 5 && (await text('#gardenCaption')).startsWith(`${n} learning sessions so far`), [n, fl, lv]);
  await openAt(2027, 5, 6, 7); await build(3);
  await click('[data-action=timer-focus]');
  await openAt(2027, 5, 7, 7); await sleep(200);
  check("a timer left running from yesterday is quietly cleared", !(await exists('#timerCard')) && (await data()).timer === null);

  console.log('\n[20] Sections that have not moved yet');
  const navLabels = await ev(`[...document.querySelectorAll('#nav a')].map(a => a.getAttribute('aria-label'))`);
  check('the navigation keeps all five sections, and says which are not in the new app yet', eq(navLabels, ['Today', 'Calendar', 'Pay', 'Health (not in the new app yet)', 'Study (not in the new app yet)']), navLabels);
  for (const s of ['health', 'study']) {
    await ev(`location.hash = '#${s}'`); await sleep(200);
    const h = await text('#app h2');
    check(`#${s}: says plainly it hasn't moved yet, with a link to the current MyDay`, h.endsWith("hasn't moved to the new MyDay yet") && (await ev(`(document.querySelector('#app a[href$="#${s}"]') || {}).getAttribute?.('href') || ''`)) === `../../index.html#${s}`, h);
  }
  await ev(`location.hash = '#today'`); await sleep(200);
  check('back to Today from the navigation (the morning screen: nothing built for 7 May)', await exists('#slot-energy'));
  await editStorage(`s => { s.rota = { patterns: [{ anchor: '2027-05-01', cycle: ['day', 'off'], times: { day: { start: '09:00', end: '17:00' } } }] }; s.health = { workout: {} }; }`);
  await openAt(2027, 5, 7, 7);
  check('a day shift from the rota shows on Today (read-only) and blocks task times', (await glance()).some(g => g.startsWith('09:00–17:00 | Day shift')), await glance());
  check('Today says which reminders aren\'t in the new app yet', (await text('#app')).includes('Not in the new app yet'));

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
