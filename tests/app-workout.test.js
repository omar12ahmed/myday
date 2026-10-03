// Workout (Health) in the NEW app (app/, built into app/dist): the workout checks from health.test.js,
// adapted, plus what the move asked for: units and assistance kept apart, one planned session changed
// without touching templates or history (with overlap warnings), no duplicate sessions, sets or plans after
// double taps, reloads and redraws, Food's records kept through workout saves, export/import with every
// section, phone layout and all three themes, and side-by-side checks that the new app saves workout data
// and shows the same results as the current MyDay (index.html, served beside it).
// Differences these checks expect: confirmations are asked in the page; checkboxes are clicked (React
// only notices a real click); Export is on Today.
const fs = require('fs');
const T = require('./cdp.js');
// Saved data compared without the save signatures, which change on every save by design.
const noSaves = t => { const o = typeof t === 'string' ? JSON.parse(t) : JSON.parse(JSON.stringify(t)); delete o.saves; return JSON.stringify(o); };
const { openAt, ev, click, exists, text, setFile, check, sleep, S } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const STOP = Number(process.env.STOP || 99);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const D = () => ev(`JSON.parse(localStorage.getItem('${KEY}'))`);
const H = async () => (await D()).health;
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const go = async (hash, y = 2026, m = 11, d = 2, h = 9, mi = 0, url = APP) => { T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi); };
const nav = async hash => { await ev(`location.hash = ${JSON.stringify(hash)}`); await sleep(250); };
const texts = sel => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].map(e => e.textContent.trim())`);
const flat = s => String(s).replace(/\s+/g, ''); // compared without spacing (the two apps lay out text differently)
// React only notices a value set through the browser's own setter, followed by the events typing makes.
const setVal = (sel, v, evt = 'change') => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(String(v))});
  el.dispatchEvent(new Event('input', { bubbles: true })); if (${JSON.stringify(evt)} === 'change') el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const answer = async yes => { await sleep(150); await click(yes ? '[data-action=dialog-confirm]' : '[data-action=dialog-cancel]'); await sleep(200); };
const setTZ = async tz => { await T.send('Emulation.setTimezoneOverride', { timezoneId: '' }).catch(() => {}); await T.send('Emulation.setTimezoneOverride', { timezoneId: tz }); };
const glance = () => ev(`[...document.querySelectorAll('.glance li')].map(li => li.querySelector('.g-time').textContent + ' | ' + li.querySelector('.g-label').textContent)`);
const exportNow = async () => {
  for (const f of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + f);
  await click('[data-action=export]'); await sleep(1500);
  return JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-11-02.json', 'utf8'));
};
const contrastOf = sel => ev(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return 0;
  const rgb = c => c.match(/[\\d.]+/g).map(Number);
  const lum = c => { const [r, g, b] = rgb(c).slice(0, 3).map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  let bg = null; for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; const a = rgb(c); if (a.length < 4 || a[3] > 0.9) { bg = c; break; } }
  if (!bg) bg = getComputedStyle(document.body).backgroundColor;
  const [x, y] = [lum(getComputedStyle(el).color), lum(bg)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); })()`);
const finish = () => {
  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const s = T.summary();
  console.log(`\n${s.pass} passed, ${s.fail} failed`);
  process.exit(s.fail ? 1 : 0);
};

// Test data shared by several sections.
const EXS = [{ id: 'x1', name: 'Squats', type: 'bodyweight', archived: false }, { id: 'xB', name: 'Bench press', type: 'strength', archived: false },
  { id: 'xP', name: 'Pull-ups', type: 'bodyweight', archived: false }, { id: 'xR', name: 'Running', type: 'cardio', archived: false }];
const item = (id, exerciseId, more) => Object.assign({ id, exerciseId, sets: 2, restSec: 60, reps: 10, weight: null, loadMode: 'none', load: null, durationMin: null, distanceKm: null }, more);
const TPLS = [{ id: 'tA', name: 'Legs', minutes: 45, archived: false, items: [item('i1', 'x1')] }, { id: 'tB', name: 'Core', minutes: 30, archived: false, items: [item('i2', 'x1', { sets: 1, reps: 20 })] }];
const ROTA = `{ id: 'p1', effectiveFrom: null, anchor: '2026-11-23', cycle: ['day','day','day','day','off','off','off','off','night','night','night','night','off','off','off','off'], times: { day: { start: '07:00', end: '19:00' }, night: { start: '19:00', end: '07:00' } }, breaks: { day: 0, night: 0 } }`;
const FOOD = { prefs: { exclude: [], dislikes: ['olives'], maxMinutes: 40, batchOnly: false }, recipes: { r1: { id: 'r1', source: 'manual', title: 'Porridge', ingredients: [{ name: 'Oats', measure: '50g' }], instructions: 'Cook.', futureRecipeField: 'kept' } },
  favourites: ['r1'], want: [], cooked: [{ id: 'c1', recipeId: 'r1', title: 'Porridge', date: '2026-10-30', servings: 1 }],
  shopping: [{ id: 's1', name: 'Oats', family: null, amount: null, unit: '', text: '', category: 'Other', checked: false, recipes: [], manual: true }], cooking: null, futureFoodField: { kept: true } };
// A logged session, as both apps save it.
const set = (more) => Object.assign({ reps: null, weight: null, loadMode: 'none', load: null, durationMin: null, distanceKm: null, done: true }, more);
const sessionOf = (id, date, exs) => ({ id, date, templateId: 'tP', templateName: 'Pull day', startedAt: date + 'T18:00', finishedAt: date + 'T18:45', status: 'done', plannedDate: null, editedAt: null,
  exercises: exs.map(([key, exerciseId, name, type, sets]) => ({ key, exerciseId, name, type, plan: { sets: sets.length, restSec: 90, reps: 8, weight: null, loadMode: 'none', load: null, durationMin: null, distanceKm: null }, prefill: 'plan', sets })) });

(async () => {
  await T.connect();
  await setTZ('Europe/London');

  // ------------------------------------------------------------------
  console.log('\n[30] Health tab, and existing data left untouched');
  await go('today'); await reset(); await go('today');
  await editStorage(`s => { s.lists.admin.push({ id: 'a9', title: 'Post office', minutes: 15 }); s.commitments = [{ id: 'c1', kind: 'appointment', title: 'GP', start: '2026-11-03T10:00', end: '2026-11-03T10:30' }]; delete s.health; }`);
  const before = await D();
  await go('health');
  check('Health opens with Workout, Food and Goal tabs (Goal is new in 1.3.0)', eq(await texts('.health-tabs .seg-link'), ['Workout', 'Food', 'Goal']) && (await text('#nav [aria-current=page]')).trim() === 'Health');
  check('the navigation shows Health as moved', (await ev(`document.querySelector('#nav a[href="#health"]').getAttribute('aria-label')`)) === 'Health');
  await nav('health/food');
  check('the Food tab opens Food (app-food checks it in full)', await exists('#foodQ'));
  await nav('health/workout'); await click('[data-action=h-tpl-new]'); await sleep(250);
  const after = await D();
  const others = o => { const c = JSON.parse(JSON.stringify(o)); delete c.health; delete c.saves; return c; };
  check('saving Workout keeps every other record exactly as it was (same key, no migration)', eq(others(after), others(before)) && !!after.health && eq(await ev(`Object.keys(localStorage).filter(k => k.startsWith('myday'))`), [KEY]));
  check('…and starts Food empty, the way the current MyDay does', eq(after.health.food, { prefs: { exclude: [], dislikes: [], maxMinutes: null, batchOnly: false }, recipes: {}, favourites: [], want: [], cooked: [], shopping: [], cooking: null }));
  check('a new workout opens with its name ready to type', (await ev('document.activeElement && document.activeElement.id')) === 'tplName');

  if (STOP < 31) return finish();
  // ------------------------------------------------------------------
  console.log('\n[31] Workout templates and exercises');
  await setVal('#tplName', 'Upper body', 'input');
  await click('[data-action=h-ex-common][data-name="Push-ups"]'); await sleep(100);
  await ev(`document.querySelector('#newExName').value = 'Bench press'`); await setVal('#newExType', 'strength');
  await click('[data-action=h-ex-create]'); await sleep(100);
  await ev(`document.querySelector('#newExName').value = 'Bike'`); await setVal('#newExType', 'cardio');
  await click('[data-action=h-ex-create]'); await sleep(100);
  await ev(`document.querySelector('#newExName').value = 'bike'`); await click('[data-action=h-ex-create]'); await sleep(100);
  check('a second exercise with the same name is refused, with a clear message', (await text('#newExError')).includes('already have an exercise with that name') && (await H()).workout.exercises.length === 3);
  const benchItem = await ev(`[...document.querySelectorAll('.tpl-item')].find(x => x.textContent.includes('Bench press')).querySelector('[data-field=weight]').dataset.item`);
  await setVal(`[data-item="${benchItem}"][data-field=reps]`, '8'); await sleep(80); await setVal(`[data-item="${benchItem}"][data-field=weight]`, '40'); await sleep(100);
  let h = await H();
  const tpl = h.workout.templates[0];
  check('created, renamed and filled a workout (custom + common exercises, three tracking types)', tpl.name === 'Upper body' && eq(tpl.items.map(i => h.workout.exercises.find(e => e.id === i.exerciseId).type), ['bodyweight', 'strength', 'cardio']) && tpl.items[1].reps === 8 && tpl.items[1].weight === 40, tpl);
  check('units are in the labels (Reps, kg, Min, km, Rest s)', eq(await texts('.tpl-item .set-field .lbl'), ['Sets', 'Reps', 'Load', 'Rest s', 'Sets', 'Reps', 'kg', 'Rest s', 'Sets', 'Min', 'km', 'Rest s']), await texts('.tpl-item .set-field .lbl'));
  await go('health/workout', 2026, 11, 2, 9, 1);
  check('templates persist after reload', (await text('.tpl-list')).includes('Upper body'));
  await click(`[data-action=h-ws-start][data-tpl="${tpl.id}"]`); await sleep(250);

  if (STOP < 32) return finish();
  // ------------------------------------------------------------------
  console.log('\n[32] Logging a workout');
  check('session shows the plan and that there is no previous result', (await text('#app')).includes('Plan: 3 × 8 @ 40 kg') && (await text('#app')).includes('No previous result yet.'));
  const benchKey = (await H()).workout.sessions[0].exercises[1].key;
  check('values prefilled from the plan (8 reps, 40 kg)', (await ev(`document.querySelector('[data-ex="${benchKey}"][data-set="0"][data-field=reps]').value`)) === '8' && (await ev(`document.querySelector('[data-ex="${benchKey}"][data-set="0"][data-field=weight]').value`)) === '40');
  await setVal(`[data-ex="${benchKey}"][data-set="0"][data-field=weight]`, '42.5', 'input'); await sleep(80);
  check('typing saves straight away (no button)', (await H()).workout.sessions[0].exercises[1].sets[0].weight === 42.5);
  await click(`[data-action=h-set-done][data-ex="${benchKey}"][data-set="0"]`); await sleep(80);
  await click(`[data-action=h-set-done][data-ex="${benchKey}"][data-set="1"]`); await sleep(80);
  const sets = (await H()).workout.sessions[0].exercises[1].sets;
  check('each set is recorded separately (set 1: 42.5 kg done, set 2: 40 kg done, set 3 not yet)', sets[0].weight === 42.5 && sets[0].done && sets[1].weight === 40 && sets[1].done && !sets[2].done);
  check('planned values are kept apart from results (the plan still says 40 kg)', (await H()).workout.sessions[0].exercises[1].plan.weight === 40);
  check('a large Done control per set', (await ev(`(() => { const r = document.querySelector('.set-done').getBoundingClientRect(); return r.width >= 56 && r.height >= 56; })()`)));
  await go('health/workout', 2026, 11, 2, 9, 20);
  check('leaving and coming back: Resume is the clear next action', (await text('.next-card')).includes('In progress') && (await text('.next-card')).includes('2 of'));
  await click('.next-card a.btn'); await sleep(250);
  check('…and the session resumes with progress intact', (await ev(`document.querySelector('[data-ex="${benchKey}"][data-set="0"][data-field=weight]').value`)) === '42.5' && (await ev(`document.querySelectorAll('.set-done.on').length`)) === 2);
  await click('[data-h=rest-enabled]'); await sleep(100);
  await click(`[data-action=h-set-done][data-ex="${benchKey}"][data-set="2"]`); await sleep(150);
  check('optional rest timer starts after a set (1:30)', ['01:30', '01:29'].includes(await text('#restTime')), await text('#restTime'));
  await go('health/workout/session', 2026, 11, 2, 9, 21);
  check('…and keeps counting after a reload', ['00:30', '00:29', '00:31'].includes(await text('#restTime')), await text('#restTime'));
  await click('[data-action=h-rest-skip]'); await sleep(120);
  check('rest can be skipped', !(await exists('#restTime')));
  await click(`[data-action=h-set-done][data-ex="${benchKey}"][data-set="2"]`); await sleep(80);
  await click(`[data-action=h-set-done][data-ex="${benchKey}"][data-set="2"]`); await sleep(150);
  await ev('window.__setNow(2026, 11, 2, 9, 23)'); await sleep(1300);
  check('when the rest ends it says so gently', (await text('#restBar')).includes("Rest done — go when you're ready."));
  await click('[data-action=h-ws-finish]'); await sleep(200);
  check('finishing early asks first, kindly (a shorter session still counts)', (await text('#dialog-title')) === 'Finish now?' && (await text('dialog')).includes('a shorter session still counts'));
  await answer(true);
  h = await H();
  check('finishing early is saved as a shorter session, with kind wording', h.workout.sessions[0].status === 'short' && (await text('#toast')).includes('every bit counts') && h.workout.activeId === null);
  // Edit the template: history keeps its snapshot.
  await go('health/workout/template/' + tpl.id, 2026, 11, 2, 10);
  await setVal('#tplName', 'Push day', 'input'); await sleep(80);
  await setVal(`[data-item="${benchItem}"][data-field=weight]`, '50'); await sleep(100);
  h = await H();
  check('editing the template does not rewrite history', h.workout.sessions[0].templateName === 'Upper body' && h.workout.sessions[0].exercises[1].plan.weight === 40 && h.workout.sessions[0].exercises[1].sets[0].weight === 42.5 && h.workout.templates[0].name === 'Push day');
  await go('health/workout', 2026, 11, 4, 18);
  await click(`[data-action=h-ws-start][data-tpl="${tpl.id}"]`); await sleep(250);
  const s2 = (await H()).workout.sessions[1], bk2 = s2.exercises[1].key;
  check('next time: prefilled from last time, with last result shown', s2.exercises[1].prefill === 'last' && s2.exercises[1].sets[0].weight === 42.5 && (await text('#app')).includes('Last time (Mon 2 Nov): 8 × 42.5 kg, 8 × 40 kg, 8 × 40 kg'));
  check('…while the plan shows the edited template (50 kg) — nothing was raised automatically', s2.exercises[1].plan.weight === 50 && (await text('#app')).includes('Plan: 3 × 8 @ 50 kg'));
  await click(`[data-action=h-prefill][data-ex="${bk2}"][data-from="plan"]`); await sleep(120);
  check('…or switch to the plan values (50 kg)', (await H()).workout.sessions[1].exercises[1].sets[0].weight === 50 && (await ev(`document.querySelector('[data-ex="${bk2}"][data-set="0"][data-field=weight]').value`)) === '50');
  for (let i = 0; i < 3; i++) { await click(`[data-action=h-set-done][data-ex="${bk2}"][data-set="${i}"]`); await sleep(80); }
  await click('[data-action=h-ws-finish]'); await answer(true);
  // Correct a logged result.
  await go('health/workout/log/' + s2.id, 2026, 11, 4, 19);
  await setVal(`[data-ex="${bk2}"][data-set="0"][data-field=weight]`, '47.5', 'input'); await sleep(100);
  h = await H();
  check('logged results can be corrected (marked as corrected; template untouched)', h.workout.sessions[1].exercises[1].sets[0].weight === 47.5 && !!h.workout.sessions[1].editedAt && h.workout.templates[0].items[1].weight === 50);
  await go('health/workout/log/' + s2.id, 2026, 11, 4, 19, 5);
  check('…and the correction is still there after a reload', (await ev(`document.querySelector('[data-ex="${bk2}"][data-set="0"][data-field=weight]').value`)) === '47.5' && (await text('#app')).includes('corrected'));
  // A third session for a chart.
  await go('health/workout', 2026, 11, 6, 18);
  await click(`[data-action=h-ws-start][data-tpl="${tpl.id}"]`); await sleep(250);
  const s3 = (await H()).workout.sessions[2], bk3 = s3.exercises[1].key, pk3 = s3.exercises[0].key;
  await setVal(`[data-ex="${bk3}"][data-set="0"][data-field=weight]`, '52.5', 'input'); await sleep(80);
  await click(`[data-action=h-set-done][data-ex="${bk3}"][data-set="0"]`); await sleep(80);
  await setVal(`[data-ex="${pk3}"][data-set="0"][data-field=loadMode]`, 'added'); await sleep(120);
  check('choosing added weight shows its own box, labelled "kg added"', (await ev(`document.querySelector('[data-ex="${pk3}"][data-set="0"][data-field=load]').closest('.set-field').querySelector('.lbl').textContent`)) === 'kg added');
  await setVal(`[data-ex="${pk3}"][data-set="0"][data-field=load]`, '10', 'input'); await sleep(80);
  await click(`[data-action=h-set-done][data-ex="${pk3}"][data-set="0"]`); await sleep(80);
  await click('[data-action=h-ws-finish]'); await answer(true);
  const benchId = h.workout.templates[0].items[1].exerciseId, pushId = h.workout.templates[0].items[0].exerciseId;
  await go('health/workout/exercise/' + benchId, 2026, 11, 6, 19);
  const pts = await ev(`[...document.querySelectorAll('.ch-pt')].map(p => p.dataset.tip)`);
  check('progress chart once 3 comparable sessions exist (heaviest set: 42.5 → 50 → 52.5 kg)', eq(pts, ['Mon 2 Nov: 42.5 kg', 'Wed 4 Nov: 50 kg', 'Fri 6 Nov: 52.5 kg']), pts);
  await ev(`document.querySelectorAll('.ch-pt')[2].dispatchEvent(new FocusEvent('focusin', { bubbles: true }))`); await sleep(80);
  check('chart point shows a tooltip on focus', (await text('.ch-tip.show')) === 'Fri 6 Nov: 52.5 kg');
  check('every session is also listed as a table, with units', (await ev(`document.querySelectorAll('.hist-table tbody tr').length`)) === 3 && (await text('.hist-table tbody tr')).includes('8 × 52.5 kg'));
  await go('health/workout/exercise/' + pushId, 2026, 11, 6, 19, 1);
  const pushCharts = await texts('figure.chart figcaption');
  check('push-ups: added weight is kept apart from bodyweight-only sets (no mixed chart)', pushCharts.length === 0 || pushCharts.every(c => !c.includes('added')), pushCharts);
  check('…and the table shows the added weight with its unit', (await text('.hist-table tbody tr')).includes('10 reps +10 kg'));
  check('no automatic weight increases — the template still says 50 kg', (await H()).workout.templates[0].items[1].weight === 50);
  await go('health/workout/history', 2026, 11, 6, 19, 2);
  const hl = await texts('.plain-list li');
  check('history lists every workout, newest first, with shorter sessions named kindly', hl.length === 3 && hl[0].startsWith('Push day') && hl[0].includes('Fri 6 Nov') && hl[2].startsWith('Upper body') && hl[2].includes('shorter session') && hl.every(x => !/fail|missed|incomplete/i.test(x)), hl);

  if (STOP < 33) return finish();
  // ------------------------------------------------------------------
  console.log('\n[33] Scheduling: weekdays, missed sessions without a backlog, sequence, proposals');
  await reset(); await go('health/workout', 2026, 11, 2, 8);
  await editStorage(`s => { s.health.workout.exercises = ${JSON.stringify(EXS.slice(0, 1))}; s.health.workout.templates = ${JSON.stringify(TPLS)}; }`);
  await go('health/workout/schedule', 2026, 11, 2, 8);
  await setVal('#schMode', 'weekdays'); await sleep(120);
  await setVal('[data-dow="1"]', 'tA'); await sleep(80); await setVal('[data-dow="2"]', 'tB'); await sleep(80);
  check('the weekday schedule starts from today (earlier days are never "missed")', (await H()).workout.schedule.since === '2026-11-02' && (await H()).workout.schedule.weekdays[1] === 'tA');
  await go('today', 2026, 11, 2, 8);
  check('Today shows the planned workout, but adds nothing to the task list', (await text('#slot-health')).includes('Workout: Legs') && !(await exists('#app .task')));
  await go('health/workout', 2026, 11, 5, 9);
  check('two weekday sessions missed (Mon, Tue): only the most recent is offered', (await text('.next-card')).includes('Core') && (await text('.next-card')).includes('Tue 3 Nov'));
  check('…with Move and Skip (no Continue outside a sequence) and no guilt', (await exists('[data-action=h-missed-move]')) && (await exists('[data-action=h-missed-skip]')) && !(await exists('[data-action=h-missed-continue]')) && (await text('.next-card')).includes("that's okay"));
  await go('today', 2026, 11, 5, 9);
  check('Today offers the missed one to decide about (still nothing on the task list)', (await text('#slot-health')).includes('From Tue 3 Nov') && !(await exists('#app .task')));
  await go('health/workout', 2026, 11, 5, 9, 1);
  await click('[data-action=h-missed-skip]'); await sleep(150);
  check('after skipping, Monday is not brought back — no backlog', !(await text('.next-card')).includes("didn't happen"));
  await go('health/workout', 2026, 11, 10, 9);
  await click('[data-action=h-missed-move]'); await sleep(100);
  await setVal('#wsMoveDate', '2026-11-12', 'input');
  await click('[data-action=h-missed-move-save]'); await sleep(150);
  h = await H();
  check('Move puts the missed session on the new date', h.workout.planned['2026-11-09'].status === 'moved' && h.workout.planned['2026-11-12'].templateId === 'tA' && h.workout.planned['2026-11-12'].status === 'planned');
  // Sequence mode: Skip keeps it next; Continue moves on.
  await go('health/workout/schedule', 2026, 11, 16, 9);
  await setVal('#schMode', 'sequence'); await sleep(120);
  await setVal('#seqAdd', 'tA'); await click('[data-action=h-seq-add]'); await sleep(80);
  await setVal('#seqAdd', 'tB'); await click('[data-action=h-seq-add]'); await sleep(80);
  await editStorage(`s => { s.health.workout.planned['2026-11-17'] = { templateId: 'tA', time: null, status: 'planned', source: 'manual' }; }`);
  await go('health/workout', 2026, 11, 18, 9);
  check('sequence miss offers Move, Skip and Continue with next session', await exists('[data-action=h-missed-continue]'));
  await click('[data-action=h-missed-continue]'); await sleep(150);
  check('Continue with next session moves the sequence on to Core', (await H()).workout.schedule.next === 1 && (await text('.next-card')).includes('Core'));
  // Proposals around shifts and appointments, applied only after confirmation.
  await editStorage(`s => { s.health.workout.schedule.next = 0; s.health.workout.planned = {}; s.rota.patterns = [${ROTA}];
    s.commitments = [{ id: 'c9', kind: 'appointment', title: 'Dentist', start: '2026-11-27T08:00', end: '2026-11-27T20:00' }]; }`);
  await go('health/workout/schedule', 2026, 11, 23, 8);
  await click('[data-action=h-propose]'); await sleep(150);
  const props = await texts('.prop-check');
  h = await H();
  check('proposed dates fit around shifts (evenings after day shifts) and skip a fully booked day', props.length === 4 && props[0].startsWith('Mon 23 Nov · 19:30') && props[1].startsWith('Wed 25 Nov · 19:30') && !props.some(p => p.includes('27 Nov')), props);
  check('nothing is saved until confirmed', Object.keys(h.workout.planned).length === 0);
  await click('.prop-check input'); await sleep(80);
  check('a proposal can be unticked before adding', !(await ev(`document.querySelector('.prop-check input').checked`)));
  await click('.prop-check input'); await sleep(80);
  await click('[data-action=h-prop-apply]'); await sleep(150);
  h = await H();
  check('confirmed: sessions planned with times', Object.keys(h.workout.planned).length === 4 && h.workout.planned['2026-11-23'].time === '19:30');
  await click('[data-action=h-propose]'); await sleep(150);
  const props2 = await texts('.prop-check');
  check('proposing again never offers the same dates twice (no duplicates)', !props2.some(p => props.some(q => q.slice(0, 10) === p.slice(0, 10))), props2);
  await click('[data-action=h-prop-cancel]'); await sleep(80);
  await go('today', 2026, 11, 23, 8);
  const gl = await glance();
  check("Today's timeline reserves the planned workout time", gl.includes('19:30–20:15 | Workout: Legs'), gl);
  await nav('calendar'); await sleep(250);
  check('Calendar still shows the shifts the proposals were fitted around', (await exists('.cal-grid')) && (await text('.cal-cell[data-date="2026-11-23"]')).includes('Day'));

  if (STOP < 34) return finish();
  // ------------------------------------------------------------------
  console.log('\n[34] Changing one planned session (not the template or the schedule)');
  const before34 = await H();
  await go('health/workout/schedule', 2026, 11, 23, 8, 5);
  await click('[data-action=h-plan-change][data-date="2026-11-25"]'); await sleep(120);
  check('Change opens a form for just that date', (await ev(`document.getElementById('chgDate').value`)) === '2026-11-25' && (await ev(`document.getElementById('chgTime').value`)) === '19:30');
  await setVal('#chgTime', '12:00', 'input'); await sleep(120);
  const warn = await texts('.plan-change .plan-warnings li');
  check('a time during a shift warns, using the same overlap check as Today', warn.some(x => x.startsWith('Overlaps Day shift')), warn);
  check('…but nothing is saved until you choose to', (await H()).workout.planned['2026-11-25'].time === '19:30');
  await setVal('#chgDate', '2026-11-29', 'input'); await setVal('#chgTime', '10:00', 'input'); await sleep(120);
  check('a free day and time shows no warning', !(await exists('.plan-change .plan-warnings li')), await texts('.plan-change .plan-warnings li'));
  await click('[data-action=h-plan-change-save]'); await sleep(150);
  h = await H();
  check('…and Save moves just that one session', !h.workout.planned['2026-11-25'] && h.workout.planned['2026-11-29'].time === '10:00' && h.workout.planned['2026-11-29'].templateId === before34.workout.planned['2026-11-25'].templateId && Object.keys(h.workout.planned).length === 4);
  check('…leaving the templates, the sequence and the history exactly as they were', eq(h.workout.templates, before34.workout.templates) && eq(h.workout.schedule, before34.workout.schedule) && eq(h.workout.sessions, before34.workout.sessions));
  await click('summary'); await sleep(80);
  await setVal('#planDate', '2026-11-29', 'input'); await sleep(120);
  check('planning on a date that already has a session says it will be replaced', (await texts('.plan-add .plan-warnings li')).some(x => x.startsWith('This replaces')));
  await setVal('#planDate', '2026-12-01', 'input'); await setVal('#planTime', '18:00', 'input'); await setVal('#planTpl', 'tB'); await sleep(120);
  await click('[data-action=h-plan-add]'); await sleep(150);
  check('a session planned on a date is added once', (await H()).workout.planned['2026-12-01'].templateId === 'tB' && Object.keys((await H()).workout.planned).length === 5);
  await click('[data-action=h-plan-remove][data-date="2026-12-01"]'); await sleep(120);
  check('…and can be removed', !(await H()).workout.planned['2026-12-01']);
  // Weekday schedule: changing one date doesn't change the weekday.
  await editStorage(`s => { s.health.workout.schedule.mode = 'weekdays'; s.health.workout.schedule.since = '2026-11-01'; s.health.workout.schedule.weekdays = { 1: 'tA' }; s.health.workout.planned = {}; }`);
  await go('health/workout/schedule', 2026, 11, 23, 8);
  await click('summary'); await sleep(80);
  await setVal('#planDate', '2026-11-30', 'input'); await setVal('#planTpl', 'tB'); await sleep(120);
  check('a weekday-schedule date says the plan replaces it for that day only', (await texts('.plan-add .plan-warnings li')).some(x => x.includes('for that day only')), await texts('.plan-add .plan-warnings li'));
  await click('[data-action=h-plan-add]'); await sleep(150);
  h = await H();
  check('…and the weekday schedule itself is unchanged', h.workout.schedule.weekdays[1] === 'tA' && h.workout.planned['2026-11-30'].templateId === 'tB');

  if (STOP < 35) return finish();
  // ------------------------------------------------------------------
  console.log('\n[35] Units, assistance and comparisons');
  await go('today', 2026, 11, 2, 9); await reset(); await go('today', 2026, 11, 2, 9);
  const assist = d => sessionOf('a' + d, `2026-10-0${d}`, [['k1', 'xP', 'Pull-ups', 'bodyweight', [set({ reps: 6, loadMode: 'assisted', load: 30 - d * 5 }), set({ reps: 8, loadMode: 'none' })]], ['k2', 'xR', 'Running', 'cardio', [set({ durationMin: 20 + d, distanceKm: 3 + d / 2 })]]]);
  await editStorage(`s => { s.health.workout.exercises = ${JSON.stringify(EXS)}; s.health.workout.sessions = ${JSON.stringify([assist(1), assist(2), assist(3)])}; }`);
  await go('health/workout/exercise/xP', 2026, 11, 2, 9);
  const capP = await texts('figure.chart figcaption');
  check('assistance gets its own chart (lower means less help), separate from bodyweight-only reps', capP.some(c => c.startsWith('Least assistance used (kg) — lower means less help needed. Latest: 15 kg')) && capP.some(c => c.startsWith('Most reps in a set (bodyweight only) (reps)')), capP);
  check('…and the table names assistance with its unit', (await text('.hist-table tbody tr')).includes('6 reps (15 kg assist)'));
  await go('health/workout/exercise/xR', 2026, 11, 2, 9, 1);
  const capR = await texts('figure.chart figcaption');
  check('cardio compares distance in km and time in min, separately', capR.some(c => c.startsWith('Longest distance (km)')) && capR.some(c => c.startsWith('Longest duration (min)')) && (await text('.hist-table tbody tr')).includes('23 min · 4.5 km'), capR);
  // Logging assistance in a session.
  await editStorage(`s => { s.health.workout.templates = [{ id: 'tP', name: 'Pull day', minutes: 30, archived: false, items: [{ id: 'iP', exerciseId: 'xP', sets: 1, restSec: 60, reps: 6, weight: null, loadMode: 'assisted', load: 20, durationMin: null, distanceKm: null }] }]; }`);
  await go('health/workout', 2026, 11, 2, 10);
  await click('[data-action=h-ws-start][data-tpl=tP]'); await sleep(250);
  const kP = (await H()).workout.sessions.find(x => x.status === 'active').exercises[0].key;
  check('a session shows the plan with assistance named (no confusion with added weight)', (await text('#app')).includes('Plan: 1 × 6 (20 kg assist)') && (await text('#app')).includes('Last time (Sat 3 Oct): 6 reps (15 kg assist), 8 reps'));
  check('…prefilled from last time, still assisted, labelled "kg assist"', (await ev(`document.querySelector('[data-ex="${kP}"][data-set="0"][data-field=loadMode]').value`)) === 'assisted' && (await ev(`document.querySelector('[data-ex="${kP}"][data-set="0"][data-field=load]').closest('.set-field').querySelector('.lbl').textContent`)) === 'kg assist');
  await setVal(`[data-ex="${kP}"][data-set="0"][data-field=loadMode]`, 'none'); await sleep(120);
  check('switching to bodyweight clears the assistance (no hidden kg left behind)', (await H()).workout.sessions.find(x => x.status === 'active').exercises[0].sets[0].load === null && !(await exists(`[data-ex="${kP}"][data-set="0"][data-field=load]`)));
  await setVal(`[data-ex="${kP}"][data-set="0"][data-field=reps]`, '1001', 'input'); await sleep(80);
  check('numbers outside the sensible range aren\'t saved', (await H()).workout.sessions.find(x => x.status === 'active').exercises[0].sets[0].reps === null);

  if (STOP < 36) return finish();
  // ------------------------------------------------------------------
  console.log('\n[36] No duplicates: double taps, reloads and redraws');
  await go('today', 2026, 11, 2, 9); await reset(); await go('today', 2026, 11, 2, 9);
  await editStorage(`s => { s.health.workout.exercises = ${JSON.stringify(EXS.slice(0, 1))}; s.health.workout.templates = ${JSON.stringify(TPLS)}; }`);
  await go('health/workout', 2026, 11, 2, 9);
  await ev(`(() => { const b = document.querySelector('[data-action=h-ws-start][data-tpl=tA]'); b.click(); b.click(); b.click(); })()`); await sleep(250);
  check('three quick taps on Start make one session', (await H()).workout.sessions.length === 1);
  await go('health/workout', 2026, 11, 2, 9, 5);
  check('after a reload, Start buttons wait while a workout is in progress', (await ev(`[...document.querySelectorAll('.tpl-row [data-action=h-ws-start]')].every(b => b.disabled)`)) && (await text('.next-card')).includes('Resume'));
  await nav('health/workout/session');
  const kA = (await H()).workout.sessions[0].exercises[0].key;
  await ev(`(() => { const b = document.querySelector('[data-action=h-set-done][data-ex="${kA}"][data-set="0"]'); b.click(); })()`); await sleep(120);
  await go('health/workout/session', 2026, 11, 2, 9, 10);
  check('per-set results persist after a reload (1 done, still 2 sets)', (await H()).workout.sessions[0].exercises[0].sets.length === 2 && (await ev(`document.querySelectorAll('.set-done.on').length`)) === 1);
  for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(200); } // redraws everything (and saves) three times
  check('redraws don\'t add sessions or sets', (await H()).workout.sessions.length === 1 && (await H()).workout.sessions[0].exercises[0].sets.length === 2);
  await click('[data-action=h-set-add]'); await sleep(100);
  check('+ Add set adds exactly one set', (await H()).workout.sessions[0].exercises[0].sets.length === 3);
  await click('[data-action=h-set-remove]'); await sleep(150);
  check('Remove last set removes one (no question when it wasn\'t done)', (await H()).workout.sessions[0].exercises[0].sets.length === 2);
  await click(`[data-action=h-set-done][data-ex="${kA}"][data-set="1"]`); await sleep(100);
  await ev(`(() => { const b = document.querySelector('[data-action=h-ws-finish]'); b.click(); b.click(); })()`); await sleep(300);
  h = await H();
  check('two quick taps on Finish save it once', h.workout.sessions.length === 1 && h.workout.sessions[0].status === 'done' && h.workout.activeId === null);
  await go('health/workout', 2026, 11, 2, 18);
  check('after finishing, today counts as done (no "today" card, no second session)', !(await text('.next-card')).includes('In progress') && (await H()).workout.sessions.length === 1);

  if (STOP < 37) return finish();
  // ------------------------------------------------------------------
  console.log('\n[37] Food and every other section kept; export/import');
  await go('today', 2026, 11, 2, 9); await reset(); await go('today', 2026, 11, 2, 9);
  await editStorage(`s => { s.health = { workout: { exercises: ${JSON.stringify(EXS.slice(0, 1))}, templates: ${JSON.stringify(TPLS)} }, food: ${JSON.stringify(FOOD)}, futureHealthPart: { kept: [1, 2] } }; s.futureSection = { kept: true }; }`);
  const seeded = await D();
  await go('health/workout', 2026, 11, 2, 9);
  await click('[data-action=h-ws-start][data-tpl=tA]'); await sleep(250);
  const foodFirst = (await H()).food; // Food as first saved by the new app (checked the way the current MyDay checks it)
  await click('[data-action=h-set-done]'); await sleep(100);
  await click('[data-action=h-ws-finish]'); await answer(true);
  await go('health/workout/schedule', 2026, 11, 2, 10);
  await setVal('#schMode', 'weekdays'); await sleep(100);
  h = await H();
  check('Food\'s records are all kept (recipe, favourite, cooking history, shopping, preferences)', h.food.recipes.r1.title === 'Porridge' && eq(h.food.favourites, ['r1']) && h.food.cooked.length === 1 && h.food.shopping[0].name === 'Oats' && eq(h.food.prefs.dislikes, ['olives']));
  check('…and unchanged by many workout saves', JSON.stringify(h.food) === JSON.stringify(foodFirst));
  check('…and so is an unknown part of Health', eq(h.futureHealthPart, { kept: [1, 2] }));
  await go('today', 2026, 11, 2, 11);
  check('Today shows the shopping list reminder', (await text('#slot-health')).includes('Shopping list') && (await text('#slot-health')).includes('1 item to get'));
  const ex = await exportNow();
  check('export includes Workout, Food and every other section', ex.data.health.workout.sessions.length === 1 && JSON.stringify(ex.data.health.food) === JSON.stringify(h.food) && ex.data.futureSection.kept === true && 'study' in ex.data && 'rota' in ex.data);
  const snap = await ev(`localStorage.getItem('${KEY}')`);
  await reset(); await go('health/workout', 2026, 11, 2, 12);
  await setFile(S + '/dl/myday-export-2026-11-02.json'); await sleep(200); await answer(true);
  check('import restores everything exactly', noSaves(await ev(`localStorage.getItem('${KEY}')`)) === noSaves(snap));
  check('…and the Workout screen shows it straight away', (await text('.tpl-list')).includes('Legs'));
  const old = JSON.parse(JSON.stringify(ex)); delete old.data.health;
  fs.writeFileSync(S + '/old-export.json', JSON.stringify(old));
  await setFile(S + '/old-export.json'); await sleep(200); await answer(true);
  check('a backup from before Health imports fine (Health starts empty)', (await H()).workout.templates.length === 0 && Object.keys((await H()).food.recipes).length === 0);

  if (STOP < 39) return finish();
  // ------------------------------------------------------------------
  console.log('\n[39] Layout');
  await go('today', 2026, 11, 2, 15); await reset(); await go('today', 2026, 11, 2, 15);
  await editStorage(`s => { s.health.workout.exercises = ${JSON.stringify(EXS)}; s.health.workout.templates = ${JSON.stringify(TPLS.concat([{ id: 'tP', name: 'Pull and run', minutes: 40, archived: false, items: [item('iP', 'xP', { loadMode: 'assisted', load: 20 }), item('iR', 'xR', { reps: null, durationMin: 20, distanceKm: 3 }), item('iB', 'xB', { weight: 40 })] }]))};
    s.health.workout.sessions = ${JSON.stringify([sessionOf('l1', '2026-10-30', [['k1', 'xP', 'Pull-ups', 'bodyweight', [set({ reps: 6, loadMode: 'assisted', load: 20 })]]])])}; s.health.workout.schedule = { mode: 'sequence', weekdays: {}, sequence: ['tA', 'tB'], next: 0, restDays: 1, since: null }; }`);
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  const noSideways = async label => check(`phone: no sideways scrolling (${label})`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
  for (const hsh of ['health/workout', 'health/food', 'health/workout/template/tP', 'health/workout/schedule', 'health/workout/history', 'health/workout/exercises', 'health/workout/exercise/xP', 'health/workout/log/l1']) {
    await go(hsh, 2026, 11, 2, 15);
    await noSideways(hsh);
  }
  await go('health/workout', 2026, 11, 2, 15);
  await click('[data-action=h-ws-start][data-tpl=tP]'); await sleep(250);
  await noSideways('workout in progress');
  check('phone: every set has big controls (Done ≥ 56 px, number boxes ≥ 48 px tall)', await ev(`[...document.querySelectorAll('.set-done')].every(b => b.getBoundingClientRect().height >= 56 && b.getBoundingClientRect().width >= 56) && [...document.querySelectorAll('.set-field input, .set-field select')].every(i => i.getBoundingClientRect().height >= 48)`));
  check('phone: every button and link is at least 44 px tall', await ev(`[...document.querySelectorAll('#app button, #app a.btn-link')].every(b => b.getBoundingClientRect().height >= 44)`), await ev(`[...document.querySelectorAll('#app button, #app a.btn-link')].filter(b => b.getBoundingClientRect().height < 44).map(b => b.textContent.trim()).slice(0, 5)`));
  await go('health/workout/schedule', 2026, 11, 2, 15); await click('[data-action=h-propose]'); await sleep(150); await noSideways('proposal');
  await T.send('Emulation.clearDeviceMetricsOverride');

  // ------------------------------------------------------------------
  console.log('\n[40] Themes');
  for (const theme of ['light', 'auto', 'dark']) {
    await editStorage(`s => { s.settings.theme = '${theme}'; }`);
    await go('health/workout/session', 2026, 11, 2, 15, 30);
    const kk = await ev(`document.querySelector('[data-action=h-set-done]').dataset.ex`);
    await click(`[data-action=h-set-done][data-ex="${kk}"][data-set="0"]`); await sleep(120);
    const ok = (await ev('document.documentElement.dataset.theme')) === theme && (await contrastOf('.set-done.on')) >= 3 && (await contrastOf('.set-done:not(.on)')) >= 4.5 && (await contrastOf('.ex-name')) >= 4.5 && (await contrastOf('[data-action=h-ws-finish]')) >= 4.5 && (await contrastOf('.set-field .lbl')) >= 4.5;
    check(`theme "${theme}": workout screen applied and readable`, ok, [await contrastOf('.set-done.on'), await contrastOf('.set-done:not(.on)'), await contrastOf('.ex-name'), await contrastOf('[data-action=h-ws-finish]'), await contrastOf('.set-field .lbl')]);
    await click(`[data-action=h-set-done][data-ex="${kk}"][data-set="0"]`); await sleep(120);
  }

  // ------------------------------------------------------------------
  console.log('\n[41] Same data, same results as the current MyDay');
  const mw = { exercises: EXS.concat([{ id: 'xBad', name: '', type: 'strength' }, { id: 'xT', name: 'Typeless', type: 'yoga' }, 'nope']),
    templates: TPLS.concat([{ id: 'tP', name: 'Pull and run', minutes: 999, archived: 'yes', items: [item('iP', 'xP', { loadMode: 'assisted', load: 20, sets: 50 }), { id: 'iBad' }, item('iR', 'xR', { reps: 'lots', durationMin: 20, distanceKm: 3, restSec: 5000 })] }, { id: 'tNo' }]),
    schedule: { mode: 'weekdays', weekdays: { 1: 'tA', 3: 'tP', 9: 'tB' }, sequence: ['tA', 7], next: 40, restDays: 9, since: '2026-10-01' },
    planned: { '2026-11-04': { templateId: 'tB', time: '18:00', status: 'planned', source: 'proposal' }, '2026-10-31': { templateId: 'tA', time: 'soon', status: 'odd' }, 'later': { templateId: 'tA' } },
    sessions: [Object.assign(sessionOf('l1', '2026-10-28', [['k1', 'xP', 'Pull-ups', 'bodyweight', [set({ reps: 6, loadMode: 'assisted', load: 20 }), set({ reps: 5000, loadMode: 'weird' })]], ['k2', 'xR', 'Running', 'cardio', [set({ durationMin: 25, distanceKm: 5 })]]]), { extraSessionField: 1 }),
      sessionOf('l2', '2026-10-30', [['k3', 'xB', 'Bench press', 'strength', [set({ reps: 8, weight: 42.5 }), set({ reps: 8, weight: 45, done: false })]]]), { id: 'bad', date: 'yesterday', exercises: [] },
      Object.assign(sessionOf('l3', '2026-11-02', [['k4', 'x1', 'Squats', 'bodyweight', [set({ reps: 10, done: false })]]]), { status: 'active', finishedAt: null })],
    activeId: 'l3', restTimer: { enabled: true, seconds: 5 }, rest: null, futureWorkoutField: 'x' };
  mw.sessions[0].exercises.push({ name: 'broken' }, { key: 'k9', name: 'No type', type: 'pilates', sets: [] });
  const seedIds = new Set(JSON.stringify(mw).match(/"(id|key)":"[^"]*"/g).map(x => x.split(':"')[1].slice(0, -1)));
  const maskNew = o => JSON.stringify(o, (k, v) => ((k === 'id' || k === 'key') && typeof v === 'string' && !seedIds.has(v) ? 'NEW' : v));
  async function seedAndSave(url) {
    await go('today', 2026, 11, 2, 9, 0, url); await reset(); await go('today', 2026, 11, 2, 9, 0, url);
    await editStorage(`s => { s.health = { workout: ${JSON.stringify(mw)}, food: ${JSON.stringify(FOOD)} }; s.rota.patterns = [${ROTA.replace("'2026-11-23'", "'2026-11-02'")}]; }`);
    await go('today', 2026, 11, 2, 9, 0, url);
    for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(250); } // three saves; the theme ends where it began
    return (await D()).health.workout;
  }
  const liveW = await seedAndSave('index.html'), newW = await seedAndSave(APP);
  check('Workout is saved exactly as the current MyDay saves it (same records kept, same bad ones dropped)', maskNew(liveW) === maskNew(newW), [maskNew(liveW).slice(0, 300), maskNew(newW).slice(0, 300)]);
  T.setUrl('index.html#health/workout'); await openAt(2026, 11, 2, 12);
  check('the current MyDay opens the Workout data the new app saved (the workout in progress resumes there)', (await text('.next-card')).includes('In progress') && (await text('.tpl-list')).includes('Pull and run'));
  async function screensIn(url) {
    const out = {};
    await go('today', 2026, 11, 2, 9, 0, url); await reset(); await go('today', 2026, 11, 2, 9, 0, url);
    const w2 = JSON.parse(JSON.stringify(mw)); w2.sessions = w2.sessions.slice(0, 2); w2.activeId = null; w2.planned['2026-11-02'] = { templateId: 'tP', time: '20:00', status: 'planned', source: 'manual' };
    await editStorage(`s => { s.health = { workout: ${JSON.stringify(w2)}, food: ${JSON.stringify(FOOD)} }; s.rota.patterns = [${ROTA.replace("'2026-11-23'", "'2026-11-02'")}]; }`);
    await go('today', 2026, 11, 2, 9, 0, url);
    out.todayCard = flat(await text('#slot-health'));
    out.glance = await glance();
    await go('health/workout', 2026, 11, 2, 9, 0, url);
    out.next = flat(await text('.next-card'));
    out.templates = (await texts('.tpl-row .title')).map(flat);
    await go('health/workout/history', 2026, 11, 2, 9, 0, url);
    out.history = (await texts('#app .plain-list li')).map(flat);
    await go('health/workout/exercise/xP', 2026, 11, 2, 9, 0, url);
    out.pullTable = (await texts('.hist-table tbody tr')).map(flat);
    await go('health/workout/log/l1', 2026, 11, 2, 9, 0, url);
    out.logPlans = (await ev(`[...document.querySelectorAll('#app p')].map(p => p.textContent).filter(t => /^(Plan|Last time|No previous)/.test(t.trim()))`)).map(flat);
    await go('health/workout/schedule', 2026, 11, 2, 9, 0, url);
    await click('[data-action=h-propose]'); await sleep(200);
    out.proposal = (await texts('.prop-check')).map(flat);
    return out;
  }
  const liveS = await screensIn('index.html'), newS = await screensIn(APP);
  for (const k of Object.keys(liveS)) check(`${k}: the same as the current MyDay`, eq(liveS[k], newS[k]), [liveS[k], newS[k]]);

  finish();
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
