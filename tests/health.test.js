const fs = require('fs');
const T = require('./cdp.js');
// Saved data compared without the save signatures, which change on every save by design.
const noSaves = t => { const o = typeof t === 'string' ? JSON.parse(t) : JSON.parse(JSON.stringify(t)); delete o.saves; return JSON.stringify(o); };
const { openAt, ev, click, exists, text, data, toast, setFile, check, sleep, S } = T;
const KEY = 'myday.data.v4';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const setVal = (sel, v, evt = 'change') => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}'); el.value = ${JSON.stringify(String(v))}; el.dispatchEvent(new Event('${evt}', { bubbles: true })); })()`);
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const H = () => ev(`JSON.parse(localStorage.getItem('${KEY}')).health`);
const go = async (hash, y, m, d, h = 9, mi = 0) => { T.setUrl('index.html#' + hash); await openAt(y, m, d, h, mi); };
const nav = async hash => { await ev(`location.hash = ${JSON.stringify(hash)}`); await sleep(250); };
const texts = sel => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].map(e => e.textContent.trim())`);
async function waitFor(expr, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr)) return true; await sleep(150); } return false; }
const setTZ = async tz => { await T.send('Emulation.setTimezoneOverride', { timezoneId: '' }).catch(() => {}); await T.send('Emulation.setTimezoneOverride', { timezoneId: tz }); };
const clickText = (sel, txt) => ev(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find(x => x.textContent.trim().startsWith(${JSON.stringify(txt)})); if (!b) throw new Error('no button ${txt.replace(/'/g, '')}'); b.click(); })()`);

// ---------- A fake TheMealDB for repeatable checks ----------
const meal = (id, name, cat, area, ings, instr) => {
  const m = { idMeal: String(id), strMeal: name, strCategory: cat, strArea: area, strInstructions: instr, strMealThumb: `https://www.themealdb.com/images/media/meals/x${id}.jpg`, strTags: 'Test', strYoutube: '', strSource: 'https://example.com/r' + id };
  ings.forEach(([n, ms], i) => { m['strIngredient' + (i + 1)] = n; m['strMeasure' + (i + 1)] = ms; });
  for (let i = ings.length + 1; i <= 20; i++) { m['strIngredient' + i] = ''; m['strMeasure' + i] = ''; }
  return m;
};
const M = {
  bake: meal(91001, 'Test Pasta Bake', 'Pasta', 'Italian', [['Pasta', '200g'], ['Olive Oil', '1 tbsp'], ['Salt', 'pinch'], ['Eggs', '2 large'], ['Milk', '1 cup']], 'STEP 1\r\nBoil the pasta for 10 minutes.\r\n\r\nSTEP 2\r\nMix the eggs and milk.\r\n3. Bake for 1 hour until golden.'),
  pork: meal(91002, 'Pork Chops', 'Pork', 'British', [['Pork Chops', '4'], ['Apples', '2']], 'Fry the chops.'),
  curry: meal(91003, 'Coconut Curry', 'Vegetarian', 'Thai', [['Coconut Milk', '400ml'], ['Rice', '1 cup'], ['Flour', '200g']], 'Simmer for 20 mins.\r\nServe.'),
  soup: meal(91004, 'Tomato Soup', 'Vegetarian', 'British', [['Tomatoes', '6'], ['Onion', '1'], ['Stock', '1 (12 oz.) can']], 'Cook everything together.'),
  salad: meal(91005, 'Bean Salad', 'Vegan', 'Greek', [['Beans', '1 can'], ['Lemon', '1']], 'Mix.'),
  stew: meal(91006, 'Veg Stew', 'Vegetarian', 'Irish', [['Carrots', '3'], ['Potatoes', '500g']], 'Simmer for 30 minutes.'),
  tart: meal(91007, 'Onion Tart', 'Vegetarian', 'French', [['Onion', '3'], ['Pastry', '1 sheet']], 'Bake.'),
  rice: meal(91008, 'Fried Rice', 'Vegetarian', 'Chinese', [['Rice', '2 cups'], ['Peas', '100g']], 'Fry.')
};
let randomQueue = [], mdbMode = 'ok', mdbCalls = [];
const fulfil = (id, body, code = 200) => T.send('Fetch.fulfillRequest', { requestId: id, responseCode: code, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from(body).toString('base64') }).catch(() => {});
T.setHandler(d => {
  if (d.method !== 'Fetch.requestPaused') return;
  const url = d.params.request.url, id = d.params.requestId;
  if (!url.includes('/api/json/')) { fulfil(id, '', 404); return; } // photos: not needed for the checks
  mdbCalls.push(url);
  if (mdbMode === 'fail') { T.send('Fetch.failRequest', { requestId: id, errorReason: 'InternetDisconnected' }).catch(() => {}); return; }
  if (url.includes('random.php')) { const m = randomQueue.shift() || M.rice; fulfil(id, JSON.stringify({ meals: [m] })); return; }
  if (url.includes('search.php')) { const q = decodeURIComponent(url.split('s=')[1] || '').toLowerCase(); fulfil(id, JSON.stringify({ meals: Object.values(M).filter(m => m.strMeal.toLowerCase().includes(q)) })); return; }
  if (url.includes('lookup.php')) { const i = url.split('i=')[1]; const m = Object.values(M).find(x => x.idMeal === i); fulfil(id, JSON.stringify({ meals: m ? [m] : null })); return; }
  fulfil(id, '{}');
});

(async () => {
  await T.connect();
  await setTZ('Europe/London');
  await T.send('Fetch.enable', { patterns: [{ urlPattern: 'https://www.themealdb.com/*' }] });

  console.log('\n[30] Health tab, and existing data left untouched');
  await go('today', 2026, 11, 2); await reset(); await go('today', 2026, 11, 2);
  await editStorage(`s => { s.lists.admin.push({ id: 'a9', title: 'Post office', minutes: 15 }); s.commitments = [{ id: 'c1', kind: 'appointment', title: 'GP', start: '2026-11-03T10:00', end: '2026-11-03T10:30' }]; delete s.health; }`);
  const before = JSON.parse(await ev(`localStorage.getItem('${KEY}')`));
  await go('health', 2026, 11, 2);
  check('Health tab opens with Workout and Food sections', eq(await texts('.health-tabs .seg-link'), ['Workout', 'Food']) && (await text('#nav [aria-current=page]')).trim() === 'Health');
  await nav('health/food'); await sleep(300);
  check('Food section reachable by its own address', (await ev('location.hash')) === '#health/food' && (await exists('#foodQ')));
  await nav('health/workout'); await click('[data-action=h-tpl-new]'); await sleep(250);
  const after = JSON.parse(await ev(`localStorage.getItem('${KEY}')`));
  const others = o => { const c = JSON.parse(JSON.stringify(o)); delete c.health; delete c.saves; return c; };
  check('saving Health keeps every existing record exactly as it was (same key, no migration)', eq(others(after), others(before)) && !!after.health && eq(await ev(`Object.keys(localStorage)`), [KEY]));

  console.log('\n[31] Workout templates and exercises');
  await setVal('#tplName', 'Upper body', 'input');
  await click('[data-action=h-ex-common][data-name="Push-ups"]');
  await ev(`document.querySelector('#newExName').value = 'Bench press'`); await setVal('#newExType', 'strength');
  await click('[data-action=h-ex-create]');
  await ev(`document.querySelector('#newExName').value = 'Bike'`); await setVal('#newExType', 'cardio');
  await click('[data-action=h-ex-create]');
  const benchItem = await ev(`[...document.querySelectorAll('.tpl-item')].find(x => x.textContent.includes('Bench press')).querySelector('[data-field=weight]').dataset.item`);
  await setVal(`[data-item="${benchItem}"][data-field=reps]`, '8'); await setVal(`[data-item="${benchItem}"][data-field=weight]`, '40');
  let h = await H();
  const tpl = h.workout.templates[0];
  check('created, renamed and filled a workout (custom + common exercises, three tracking types)', tpl.name === 'Upper body' && eq(tpl.items.map(i => h.workout.exercises.find(e => e.id === i.exerciseId).type), ['bodyweight', 'strength', 'cardio']) && tpl.items[1].reps === 8 && tpl.items[1].weight === 40);
  await go('health/workout', 2026, 11, 2, 9, 1);
  check('templates persist after reload', (await text('.tpl-list')).includes('Upper body'));
  await click(`[data-action=h-ws-start][data-tpl="${tpl.id}"]`);

  console.log('\n[32] Logging a workout');
  check('session shows the plan and that there is no previous result', (await text('#app')).includes('Plan: 3 × 8 @ 40 kg') && (await text('#app')).includes('No previous result yet.'));
  const benchKey = (await H()).workout.sessions[0].exercises[1].key;
  check('values prefilled from the plan (8 reps, 40 kg)', (await ev(`document.querySelector('[data-ex="${benchKey}"][data-set="0"][data-field=reps]').value`)) === '8' && (await ev(`document.querySelector('[data-ex="${benchKey}"][data-set="0"][data-field=weight]').value`)) === '40');
  await setVal(`[data-ex="${benchKey}"][data-set="0"][data-field=weight]`, '42.5', 'input');
  check('typing saves straight away (no button)', (await H()).workout.sessions[0].exercises[1].sets[0].weight === 42.5);
  await click(`[data-action=h-set-done][data-ex="${benchKey}"][data-set="0"]`);
  await click(`[data-action=h-set-done][data-ex="${benchKey}"][data-set="1"]`);
  const sets = (await H()).workout.sessions[0].exercises[1].sets;
  check('each set is recorded separately (set 1: 42.5 kg done, set 2: 40 kg done, set 3 not yet)', sets[0].weight === 42.5 && sets[0].done && sets[1].weight === 40 && sets[1].done && !sets[2].done);
  check('a large Done control per set', (await ev(`(() => { const r = document.querySelector('.set-done').getBoundingClientRect(); return r.width >= 56 && r.height >= 56; })()`)));
  await go('health/workout', 2026, 11, 2, 9, 20);
  check('leaving and coming back: Resume is the clear next action', (await text('.next-card')).includes('In progress') && (await text('.next-card')).includes('2 of'));
  await click('.next-card a.btn');
  await sleep(200);
  check('…and the session resumes with progress intact', (await ev(`document.querySelector('[data-ex="${benchKey}"][data-set="0"][data-field=weight]').value`)) === '42.5' && (await ev(`document.querySelectorAll('.set-done.on').length`)) === 2);
  await click('[data-h=rest-enabled]');
  await click(`[data-action=h-set-done][data-ex="${benchKey}"][data-set="2"]`);
  check('optional rest timer starts after a set (1:30)', (await text('#restTime')) === '01:30' || (await text('#restTime')) === '01:29');
  await click('[data-action=h-rest-skip]');
  check('rest can be skipped', !(await exists('#restTime')));
  await click('[data-action=h-ws-finish]');
  h = await H();
  check('finishing early is saved as a shorter session, with kind wording', h.workout.sessions[0].status === 'short' && (await toast()).includes('every bit counts'));
  // Edit the template: history keeps its snapshot.
  await go('health/workout/template/' + tpl.id, 2026, 11, 2, 10);
  await setVal('#tplName', 'Push day', 'input');
  await setVal(`[data-item="${benchItem}"][data-field=weight]`, '50');
  h = await H();
  check('editing the template does not rewrite history', h.workout.sessions[0].templateName === 'Upper body' && h.workout.sessions[0].exercises[1].plan.weight === 40 && h.workout.templates[0].name === 'Push day');
  await go('health/workout', 2026, 11, 4, 18);
  await click(`[data-action=h-ws-start][data-tpl="${tpl.id}"]`);
  const s2 = (await H()).workout.sessions[1], bk2 = s2.exercises[1].key;
  check('next time: prefilled from last time, with last result shown', s2.exercises[1].prefill === 'last' && s2.exercises[1].sets[0].weight === 42.5 && (await text('#app')).includes('Last time (Mon 2 Nov): 8 × 42.5 kg, 8 × 40 kg, 8 × 40 kg'));
  await click(`[data-action=h-prefill][data-ex="${bk2}"][data-from="plan"]`);
  check('…or switch to the plan values (50 kg)', (await H()).workout.sessions[1].exercises[1].sets[0].weight === 50);
  for (let i = 0; i < 3; i++) await click(`[data-action=h-set-done][data-ex="${bk2}"][data-set="${i}"]`);
  await click('[data-action=h-ws-finish]');
  // Correct a logged result.
  await go('health/workout/log/' + s2.id, 2026, 11, 4, 19);
  await setVal(`[data-ex="${bk2}"][data-set="0"][data-field=weight]`, '47.5', 'input');
  h = await H();
  check('logged results can be corrected (marked as corrected; template untouched)', h.workout.sessions[1].exercises[1].sets[0].weight === 47.5 && !!h.workout.sessions[1].editedAt && h.workout.templates[0].items[1].weight === 50);
  // A third session for a chart.
  await go('health/workout', 2026, 11, 6, 18);
  await click(`[data-action=h-ws-start][data-tpl="${tpl.id}"]`);
  const s3 = (await H()).workout.sessions[2], bk3 = s3.exercises[1].key, pk3 = s3.exercises[0].key;
  await setVal(`[data-ex="${bk3}"][data-set="0"][data-field=weight]`, '52.5', 'input');
  await click(`[data-action=h-set-done][data-ex="${bk3}"][data-set="0"]`);
  await setVal(`[data-ex="${pk3}"][data-set="0"][data-field=loadMode]`, 'added');
  await setVal(`[data-ex="${pk3}"][data-set="0"][data-field=load]`, '10', 'input');
  await click(`[data-action=h-set-done][data-ex="${pk3}"][data-set="0"]`);
  await click('[data-action=h-ws-finish]');
  const benchId = h.workout.templates[0].items[1].exerciseId, pushId = h.workout.templates[0].items[0].exerciseId;
  await go('health/workout/exercise/' + benchId, 2026, 11, 6, 19);
  const pts = await ev(`[...document.querySelectorAll('.ch-pt')].map(p => p.dataset.tip)`);
  check('progress chart once 3 comparable sessions exist (heaviest set: 42.5 → 50 → 52.5 kg)', eq(pts, ['Mon 2 Nov: 42.5 kg', 'Wed 4 Nov: 50 kg', 'Fri 6 Nov: 52.5 kg']), pts);
  await ev(`document.querySelectorAll('.ch-pt')[2].dispatchEvent(new FocusEvent('focusin', { bubbles: true }))`);
  check('chart point shows a tooltip on focus', (await text('.ch-tip.show')) === 'Fri 6 Nov: 52.5 kg');
  check('every session is also listed as a table', (await ev(`document.querySelectorAll('.hist-table tbody tr').length`)) === 3);
  await go('health/workout/exercise/' + pushId, 2026, 11, 6, 19, 1);
  const pushCharts = await texts('figure.chart figcaption');
  check('push-ups: added weight is kept apart from bodyweight-only sets (no mixed chart)', pushCharts.length === 0 || pushCharts.every(c => !c.includes('added')), pushCharts);
  check('no automatic weight increases — the template still says 50 kg', (await H()).workout.templates[0].items[1].weight === 50);

  console.log('\n[33] Scheduling: weekdays, missed sessions without a backlog, sequence, proposals');
  await reset(); await go('health/workout', 2026, 11, 2, 8);
  await editStorage(`s => { s.health.workout.exercises = [{ id: 'x1', name: 'Squats', type: 'bodyweight', archived: false }];
    s.health.workout.templates = [{ id: 'tA', name: 'Legs', minutes: 45, archived: false, items: [{ id: 'i1', exerciseId: 'x1', sets: 2, reps: 10, restSec: 60, loadMode: 'none' }] }, { id: 'tB', name: 'Core', minutes: 30, archived: false, items: [{ id: 'i2', exerciseId: 'x1', sets: 1, reps: 20, restSec: 60, loadMode: 'none' }] }]; }`);
  await go('health/workout/schedule', 2026, 11, 2, 8);
  await setVal('#schMode', 'weekdays');
  await setVal('[data-dow="1"]', 'tA'); await setVal('[data-dow="2"]', 'tB');
  await go('today', 2026, 11, 2, 8);
  check('Today shows the planned workout, but adds nothing to the task list', (await text('#slot-health')).includes('Workout: Legs') && !(await exists('#app .task')));
  await go('health/workout', 2026, 11, 5, 9);
  check('two weekday sessions missed (Mon, Tue): only the most recent is offered', (await text('.next-card')).includes('Core') && (await text('.next-card')).includes('Tue 3 Nov'));
  check('…with Move and Skip (no Continue outside a sequence) and no guilt', (await exists('[data-action=h-missed-move]')) && (await exists('[data-action=h-missed-skip]')) && !(await exists('[data-action=h-missed-continue]')) && (await text('.next-card')).includes("that's okay"));
  await click('[data-action=h-missed-skip]');
  check('after skipping, Monday is not brought back — no backlog', !(await text('.next-card')).includes('Legs didn') && !(await text('.next-card')).includes("didn't happen"));
  await go('health/workout', 2026, 11, 10, 9);
  await click('[data-action=h-missed-move]');
  await setVal('#wsMoveDate', '2026-11-12', 'input');
  await click('[data-action=h-missed-move-save]');
  h = await H();
  check('Move puts the missed session on the new date', h.workout.planned['2026-11-09'].status === 'moved' && h.workout.planned['2026-11-12'].templateId === 'tA' && h.workout.planned['2026-11-12'].status === 'planned');
  // Sequence mode: Skip keeps it next; Continue moves on.
  await go('health/workout/schedule', 2026, 11, 16, 9);
  await setVal('#schMode', 'sequence');
  await setVal('#seqAdd', 'tA'); await click('[data-action=h-seq-add]');
  await setVal('#seqAdd', 'tB'); await click('[data-action=h-seq-add]');
  await editStorage(`s => { s.health.workout.planned['2026-11-17'] = { templateId: 'tA', time: null, status: 'planned', source: 'manual' }; }`);
  await go('health/workout', 2026, 11, 18, 9);
  check('sequence miss offers Move, Skip and Continue with next session', await exists('[data-action=h-missed-continue]'));
  await click('[data-action=h-missed-continue]');
  check('Continue with next session moves the sequence on to Core', (await H()).workout.schedule.next === 1 && (await text('.next-card')).includes('Core'));
  // Proposals around shifts and appointments, applied only after confirmation.
  await editStorage(`s => { s.health.workout.schedule.next = 0; s.health.workout.planned = {};
    s.rota.patterns = [{ id: 'p1', effectiveFrom: null, anchor: '2026-11-23', cycle: ['day','day','day','day','off','off','off','off','night','night','night','night','off','off','off','off'], times: { day: { start: '07:00', end: '19:00' }, night: { start: '19:00', end: '07:00' } }, breaks: { day: 0, night: 0 } }];
    s.commitments = [{ id: 'c9', kind: 'appointment', title: 'Dentist', start: '2026-11-27T08:00', end: '2026-11-27T20:00' }]; }`);
  await go('health/workout/schedule', 2026, 11, 23, 8);
  await click('[data-action=h-propose]');
  const props = await texts('.prop-check');
  h = await H();
  check('proposed dates fit around shifts (evenings after day shifts) and skip a fully booked day', props.length === 4 && props[0].startsWith('Mon 23 Nov · 19:30') && props[1].startsWith('Wed 25 Nov · 19:30') && !props.some(p => p.includes('27 Nov')), props);
  check('nothing is saved until confirmed', Object.keys(h.workout.planned).length === 0);
  await click('[data-action=h-prop-apply]');
  h = await H();
  check('confirmed: sessions planned with times', Object.keys(h.workout.planned).length === 4 && h.workout.planned['2026-11-23'].time === '19:30');
  await go('today', 2026, 11, 23, 8);
  const glance = await ev(`[...document.querySelectorAll('.glance li')].map(li => li.querySelector('.g-time').textContent + ' | ' + li.querySelector('.g-label').textContent)`);
  check("Today's timeline reserves the planned workout time", glance.includes('19:30–20:15 | Workout: Legs'), glance);

  console.log('\n[34] Food: ideas, preferences, recipes, failed requests');
  await reset();
  randomQueue = [M.bake, M.pork, M.curry, M.soup, M.salad, M.stew, M.tart];
  await go('health/food', 2026, 11, 2, 9);
  await waitFor(`document.querySelectorAll('.rcard:not(.skeleton)').length >= 3`);
  check('about three suggestion cards to start with', (await ev(`document.querySelectorAll('.rgrid .rcard:not(.skeleton)').length`)) === 3);
  check('cards show what is known and say what is not listed (nothing invented)', (await text('.rcard')).includes('Pasta · Italian') && (await text('.rcard')).includes('Time, servings, nutrition not listed'));
  await click('[data-action=h-suggest-more]');
  await waitFor(`document.querySelectorAll('.rgrid .rcard:not(.skeleton)').length >= 6`);
  check('"Show more" adds three more', (await ev(`document.querySelectorAll('.rgrid .rcard:not(.skeleton)').length`)) === 6);
  await nav('health/food/prefs');
  await click('[data-h=pref-ex][data-key=pork]');
  check('preferences explain they are not an allergen guarantee', (await text('#app')).includes("can't guarantee a recipe is free from an allergen"));
  randomQueue = [M.bake, M.pork, M.curry, M.soup];
  await nav('health/food');
  await waitFor(`!document.querySelector('.skeleton') && document.querySelectorAll('.rgrid .rcard').length >= 3`);
  const titles = await texts('.rgrid .rcard h3');
  check('excluded recipes are left out, and it says so', !titles.includes('Pork Chops') && titles.length === 3 && (await text('#app')).includes('1 idea left out'), titles);
  await nav('health/food/recipe/mdb-91001');
  const steps = await texts('ol.steps li');
  check('recipe shows ingredients, numbered steps split only on its own lines, and its source', eq(steps, ['Boil the pasta for 10 minutes.', 'Mix the eggs and milk.', 'Bake for 1 hour until golden.']) && (await text('.ing-list')).includes('200g') && (await text('#app')).includes('From TheMealDB'));
  check('no servings in the source → quantities as written, no scaling offered', (await text('#app')).includes('quantities are shown as written') && !(await exists('[data-action=h-serv]')));
  check('missing nutrition shown as not available', (await text('#app')).includes('Not available from the source.'));
  check('allergen caution shown', (await text('#app')).includes("can't confirm a recipe is free from any allergen"));
  await ev(`document.getElementById('servBase').value = '4'`); await click('[data-action=h-serv-base]');
  await click('[data-action=h-serv][data-d="1"]'); for (let i = 0; i < 3; i++) await click('[data-action=h-serv][data-d="1"]');
  const ing8 = await texts('.ing-list li');
  check('after you enter "serves 4", quantities scale to 8 (200g → 400 g, 1 cup → 2, "pinch" left as written)', (await text('#servNow')) === '8' && ing8.some(x => x.startsWith('400 g') || x.startsWith('400g')) && ing8.some(x => x.startsWith('2 cup')) && ing8.some(x => x.includes('pinch') && x.includes('(as written)')), ing8);
  await click('[data-action=h-fav]');
  h = await H();
  check('favourite saved locally as text + source reference (photo URL only, no image data)', !!h.food.recipes['mdb-91001'] && h.food.favourites.includes('mdb-91001') && h.food.recipes['mdb-91001'].servingsSource === 'user' && !(await ev(`localStorage.getItem('${KEY}')`)).includes('data:image'));
  mdbMode = 'fail';
  await go('health/food', 2026, 11, 2, 10);
  await waitFor(`!!document.querySelector('.warn')`);
  check('TheMealDB unavailable: friendly message and Try again', (await text('#app')).includes("Couldn't reach TheMealDB") && (await exists('[data-action=h-suggest-retry]')));
  check('…favourites still work offline', (await text('#app')).includes('Favourites') && (await text('#app')).includes('Test Pasta Bake'));
  await nav('health/food/recipe/mdb-91006');
  await waitFor(`document.body.textContent.includes("Couldn't load this recipe")`);
  check('an unsaved recipe that fails to load shows an error and Try again', (await exists('[data-action=h-recipe-retry]')));
  mdbMode = 'ok';
  await click('[data-action=h-recipe-retry]');
  await waitFor(`!!document.querySelector('ol.steps')`);
  check('…and loads when the connection is back', (await text('h2')).includes('Veg Stew') || (await texts('h2')).includes('Veg Stew'));
  await nav('health/food'); await sleep(200);
  await ev(`document.getElementById('foodQ').value = 'curry'`); await click('[data-action=h-food-search]');
  await waitFor(`document.querySelectorAll('.rgrid .rcard').length > 0`);
  check('search finds recipes', (await texts('.rgrid .rcard h3')).includes('Coconut Curry'));
  // Your own recipe
  await nav('health/food/new');
  await ev(`document.getElementById('rfTitle').value = 'My Pasta'; document.getElementById('rfServ').value = '2'; document.getElementById('rfIng').value = '200 g pasta\\n1 tbsp olive oil\\nsalt\\n1 cup flour'; document.getElementById('rfMethod').value = 'Boil pasta for 8 minutes.\\nAdd oil.'; document.getElementById('rfKcal').value = '520';`);
  await click('[data-action=h-recipe-save]'); await sleep(250);
  h = await H();
  const mine = Object.values(h.food.recipes).find(r => r.title === 'My Pasta');
  check('own recipe saved with parsed ingredients and labelled nutrition', mine && eq(mine.ingredients, [{ name: 'pasta', measure: '200 g' }, { name: 'olive oil', measure: '1 tbsp' }, { name: 'salt', measure: '' }, { name: 'flour', measure: '1 cup' }]) && mine.nutritionSource === 'user' && (await text('#app')).includes('Entered by you'));
  await click('[data-action=h-serv][data-d="1"]'); await click('[data-action=h-serv][data-d="1"]');
  const own4 = await texts('.ing-list li');
  check('own recipe scales from its base servings (2 → 4: 400 g, 2 tbsp)', own4[0].startsWith('400 g') && own4[1].startsWith('2 tbsp'), own4);

  console.log('\n[34b] Search suggestions while typing');
  await nav('health/food'); await sleep(200); // no reload: later sections use the servings chosen above
  const typeKeys = async (s, gap = 60) => { await ev(`document.getElementById('foodQ').focus()`); for (const ch of s) { await T.send('Input.insertText', { text: ch }); await sleep(gap); } };
  const clearQ = () => ev(`(() => { const q = document.getElementById('foodQ'); q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  const sugg = () => texts('#foodSuggest .ta-title');
  const key = k => ev(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true }))`);
  await clearQ();
  const storedBefore = await ev(`localStorage.getItem('${KEY}')`);
  let n0 = mdbCalls.length;
  await typeKeys('c'); await sleep(450);
  check('one letter: no suggestions and no request yet', !(await exists('#foodSuggest .ta-item')) && !mdbCalls.slice(n0).some(u => u.includes('search.php')));
  await typeKeys('urr');
  await waitFor(`[...document.querySelectorAll('#foodSuggest .ta-title')].some(e => e.textContent === 'Coconut Curry')`);
  const curr = mdbCalls.slice(n0).filter(u => u.includes('search.php'));
  check('suggestions appear while typing ("curr" → Coconut Curry)', (await sugg()).includes('Coconut Curry'), await sugg());
  check('waits for a pause in typing: one request for "curr", not one per letter', curr.length === 1 && curr[0].endsWith('s=curr'), curr);
  check('the typed part is highlighted', (await ev(`document.querySelector('#foodSuggest .ta-title strong').textContent`)) === 'Curr');
  check('focus and text stay in the search box', (await ev(`document.activeElement.id`)) === 'foodQ' && (await ev(`document.getElementById('foodQ').value`)) === 'curr');
  await clearQ();
  check('clearing the box closes the suggestions', !(await exists('#foodSuggest .ta-item')) && !(await text('#foodSuggest')).trim());
  mdbMode = 'fail'; n0 = mdbCalls.length;
  await typeKeys('pas', 20);
  check('your saved recipes show straight away (name or ingredient match)', (await sugg()).includes('My Pasta') && (await sugg()).includes('Test Pasta Bake'), await sugg());
  await waitFor(`document.getElementById('foodSuggest').textContent.includes("Couldn't reach TheMealDB")`);
  check('offline: says so and keeps your saved matches', (await text('#foodSuggest')).includes('Showing your saved recipes only') && (await sugg()).includes('My Pasta'));
  mdbMode = 'ok';
  await clearQ(); await typeKeys('pork');
  await waitFor(`!document.getElementById('foodSuggest').textContent.includes('Looking on TheMealDB')`);
  check('preferences apply: excluded recipes are left out, and it says so', !(await sugg()).includes('Pork Chops') && (await text('#foodSuggest')).includes('1 left out because of your preferences'), await text('#foodSuggest'));
  await clearQ(); await typeKeys('cu');
  await waitFor(`(document.getElementById('foodSuggest').textContent || '').includes('Coconut Curry')`);
  await ev(`document.querySelector('[data-action=h-suggest-more], [data-action=h-suggest-retry]').click()`); // ideas reload re-renders the page
  await sleep(600);
  check('ideas loading in the background does not interrupt typing', (await ev(`document.activeElement.id`)) === 'foodQ' && (await ev(`document.getElementById('foodQ').value`)) === 'cu' && (await sugg()).includes('Coconut Curry'));
  await key('ArrowDown');
  check('↓ moves to the first suggestion', (await ev(`document.activeElement.classList.contains('ta-item')`)));
  await key('Escape');
  check('Escape closes the suggestions and returns to the search box', !(await exists('#foodSuggest .ta-item')) && (await ev(`document.activeElement.id`)) === 'foodQ' && (await ev(`document.getElementById('foodQ').value`)) === 'cu');
  check('typing never saves anything', (await ev(`localStorage.getItem('${KEY}')`)) === storedBefore);
  await clearQ(); n0 = mdbCalls.length; await typeKeys('cur');
  await waitFor(`(document.getElementById('foodSuggest').textContent || '').includes('Coconut Curry')`);
  await ev(`[...document.querySelectorAll('#foodSuggest .ta-item')].find(a => a.textContent.includes('Coconut Curry')).click()`);
  await waitFor(`!!document.querySelector('ol.steps')`);
  check('choosing a suggestion opens that recipe, with no extra request', (await ev('location.hash')) === '#health/food/recipe/mdb-91003' && !mdbCalls.slice(n0).some(u => u.includes('lookup.php')) && !(await exists('#foodSuggest .ta-item')));
  await nav('health/food'); await sleep(200);
  await clearQ(); n0 = mdbCalls.length; await typeKeys('soup');
  await key('Enter');
  await waitFor(`location.hash === '#health/food/search' && document.querySelectorAll('.rgrid .rcard').length > 0`);
  check('Enter still runs a full search (and closes the suggestions)', (await texts('.rgrid .rcard h3')).includes('Tomato Soup') && !(await exists('#foodSuggest .ta-item')));
  check('…without asking TheMealDB twice for the same words', mdbCalls.slice(n0).filter(u => u.includes('search.php')).length === 1, mdbCalls.slice(n0));

  console.log('\n[35] Want to cook → shopping list');
  await nav('health/food/want/' + mine.id);
  check('Want to cook: choose servings, see ingredients, tick what you have', (await exists('[data-action=h-want-serv]')) && (await ev(`document.querySelectorAll('[data-h=want-have]').length`)) === 4);
  await click('[data-action=h-want-serv][data-d="1"]'); await click('[data-action=h-want-serv][data-d="1"]');
  await click('[data-h=want-have][data-i="2"]');
  check('button counts what is still needed (3 items)', (await text('[data-action=h-want-add]')).includes('Add 3 items'));
  await click('[data-action=h-want-add]'); await sleep(250);
  await nav('health/food/want/mdb-91001');
  await click('[data-action=h-want-add]'); await sleep(250);
  h = await H();
  const shop = h.food.shopping;
  const find = n => shop.filter(x => x.name.toLowerCase() === n);
  check('pasta combined across recipes: 400 g + 400 g = 800 g (compatible units)', find('pasta').length === 1 && find('pasta')[0].amount === 800 && find('pasta')[0].family === 'g', find('pasta'));
  check('olive oil combined: 2 tbsp + 2 tbsp → 12 tsp shown as 4 tbsp', find('olive oil').length === 1 && (await text('#app')).includes('4 tbsp'));
  check('incompatible units kept apart: "4 cup flour" vs nothing merged wrongly; "pinch" salt kept as written', find('flour').length === 1 && find('flour')[0].family === 'cup' && find('salt').length === 1 && find('salt')[0].text === 'pinch');
  check('items grouped by category (Dairy & eggs, Cupboard, Herbs & spices)', eq(await texts('#app section h3'), ['Dairy & eggs', 'Cupboard', 'Herbs & spices', 'Recipes on this list']), await texts('#app section h3'));
  await ev(`document.getElementById('shopAdd').value = '2 lemons'`); await click('[data-action=h-shop-add]');
  await ev(`document.getElementById('shopAdd').value = '1 lemon'`); await click('[data-action=h-shop-add]');
  h = await H();
  check('manual additions work, and combine when they match (2 + 1 lemons = 3, Fruit & veg)', h.food.shopping.filter(x => /lemon/.test(x.name)).length === 1 && h.food.shopping.find(x => /lemon/.test(x.name)).amount === 3 && h.food.shopping.find(x => /lemon/.test(x.name)).category === 'Fruit & veg');
  const pastaId = find('pasta')[0].id;
  await click(`[data-action=h-shop-edit][data-id="${pastaId}"]`);
  await ev(`document.getElementById('seQty').value = '1 kg'`); await click(`[data-action=h-shop-edit-save][data-id="${pastaId}"]`);
  check('quantities can be edited (pasta → 1 kg)', (await H()).food.shopping.find(x => x.id === pastaId).amount === 1000 && (await text('#app')).includes('1 kg'));
  const order = (await H()).food.shopping.map(x => x.id);
  await click(`[data-action=h-shop-remove][data-id="${pastaId}"]`);
  check('removing shows Undo', (await exists('[data-action=h-shop-undo]')) && !(await H()).food.shopping.some(x => x.id === pastaId));
  await click('[data-action=h-shop-undo]');
  check('…and Undo puts it back in the same place', eq((await H()).food.shopping.map(x => x.id), order));
  await click(`[data-h=shop-check][data-id="${pastaId}"]`);
  await go('health/food/shopping', 2026, 11, 2, 11);
  check('ticks and items persist after reload', (await H()).food.shopping.find(x => x.id === pastaId).checked && (await text('#app')).includes('Ticked (1)'));
  check('no calories are logged by choosing or shopping', !('eaten' in (await H()).food) && !JSON.stringify(await H()).includes('consum'));

  console.log('\n[36] Focused cooking view');
  await nav('health/food/recipe/mdb-91001');
  await click('[data-action=h-cook-start]'); await sleep(250);
  check('one step at a time, with step count', (await text('.cook-view .eyebrow')) === 'Step 1 of 3' && (await text('#cookStep')) === 'Boil the pasta for 10 minutes.');
  check('a timer is offered because the step names a duration', (await text('[data-action=h-ctimer]')).includes('10 minutes'));
  await click('[data-action=h-ctimer]');
  check('step timer runs (10:00)', ['10:00', '09:59'].includes(await text('#cookTime')));
  await click('[data-action=h-cook-step][data-d="1"]');
  await go('health/food/cook', 2026, 11, 2, 12);
  check('position is saved — resumes on step 2 after reload', (await text('.cook-view .eyebrow')) === 'Step 2 of 3');
  check('full method and ingredients are one tap away', (await exists('.cook-view ~ .card details')) || (await text('#app')).includes('Full method'));
  await go('today', 2026, 11, 2, 12, 1);
  check('Today shows cooking to resume and the shopping list', (await text('#slot-health')).includes('Cooking: Test Pasta Bake') && (await text('#slot-health')).includes('Shopping list'));
  await go('health/food/cook', 2026, 11, 2, 12, 2);
  await click('[data-action=h-cook-step][data-d="1"]');
  await click('[data-action=h-cook-finish]'); await sleep(250);
  h = await H();
  check('finishing saves cooking history only (no food-eaten log), and clears Want to cook for it', h.food.cooked.length === 1 && h.food.cooked[0].title === 'Test Pasta Bake' && !h.food.cooking && !h.food.want.some(x => x.recipeId === 'mdb-91001') && (await text('#app')).includes('Recently cooked'));
  const instr = h.food.recipes['mdb-91001'].instructions;
  check('original recipe text is preserved exactly', instr === M.bake.strInstructions);

  console.log('\n[37] Export/import and older backups');
  for (const f of fs.readdirSync(S + '/dl')) fs.unlinkSync(S + '/dl/' + f);
  await click('[data-action=export]'); await sleep(1500);
  const exp = JSON.parse(fs.readFileSync(S + '/dl/myday-export-2026-11-02.json', 'utf8'));
  check('export includes Health', exp.schemaVersion === 4 && exp.data.health && exp.data.health.food.cooked.length === 1);
  const snap = await ev(`localStorage.getItem('${KEY}')`);
  await reset(); await go('health/food', 2026, 11, 2, 13);
  await setFile(S + '/dl/myday-export-2026-11-02.json');
  check('import restores everything exactly', noSaves(await ev(`localStorage.getItem('${KEY}')`)) === noSaves(snap));
  const old = JSON.parse(JSON.stringify(exp)); delete old.data.health;
  fs.writeFileSync(S + '/old-export.json', JSON.stringify(old));
  await setFile(S + '/old-export.json');
  check('a backup from before Health imports fine (Health starts empty)', (await H()).workout.templates.length === 0 && Object.keys((await H()).food.recipes).length === 0);

  console.log('\n[38] Real TheMealDB request (network)');
  await T.send('Fetch.disable'); T.setHandler(null);
  await reset(); await go('health/food', 2026, 11, 2, 14);
  const real = await waitFor(`document.querySelectorAll('.rgrid .rcard:not(.skeleton)').length >= 3 || !!document.querySelector('.warn')`, 20000);
  check('live suggestions load from TheMealDB with the public test key', real && (await ev(`document.querySelectorAll('.rgrid .rcard:not(.skeleton)').length`)) >= 3, await text('#app'));

  console.log('\n[39] Layout');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  for (const hsh of ['health/workout', 'health/food', 'health/food/shopping', 'health/workout/schedule']) {
    await go(hsh, 2026, 11, 2, 15);
    check(`phone: no sideways scrolling (${hsh})`, !(await ev('document.documentElement.scrollWidth > innerWidth')));
  }
  await T.send('Emulation.clearDeviceMetricsOverride');

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const s = T.summary();
  console.log(`\n${s.pass} passed, ${s.fail} failed`);
  process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
