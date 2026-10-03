// Health → Goal in the new app: choosing a goal, the questions one at a time (under-18s stopped), the plan (the same
// figures as goals-rules), units (stone and feet), the safety cases, Today's gentle line, how recipes fit (never
// "good" or "bad"), suggesting a workout schedule (you confirm), changing and removing the goal, the current MyDay
// keeping it, and layout.
const T = require('./cdp.js');
const { openAt, ev, click, exists, text, data, check, sleep } = T;
const KEY = 'myday.data.v4';
const APP = 'app/dist/index.html';
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reset = () => ev('localStorage.clear()');
const go = async (hash, y, m, d, h = 9, mi = 0, url = APP) => { T.setUrl(url + '#' + hash); await openAt(y, m, d, h, mi); };
const editStorage = fn => ev(`(() => { const s = JSON.parse(localStorage.getItem('${KEY}')); (${fn})(s); localStorage.setItem('${KEY}', JSON.stringify(s)); })()`);
const type = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('missing ${sel.replace(/'/g, '')}');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(String(v))}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const answer = async yes => { await sleep(200); await click(yes ? '[data-action=dialog-confirm]' : '[data-action=dialog-cancel]'); await sleep(300); };
const pick = async (s, id) => { await click(`[data-s=${s}][data-id="${id}"]`); await sleep(80); };
const next = async () => { await click('[data-action=goal-next]'); await sleep(150); };
const step = () => ev(`document.getElementById('goalQuestions')?.dataset.step`);
const fit = async () => (await data()).fitness;
const RECIPE = (id, title, kcal, protein) => ({ id, source: 'manual', title, sourceUrl: '', sourceName: '', mealDbUrl: '', video: '', thumb: '', category: '', area: '', tags: [], ingredients: [], instructions: 'Cook it.',
  servings: 2, servingsSource: 'user', prepMin: null, cookMin: null, effort: null, batch: null, nutrition: { kcal, protein, carbs: 30, fat: 15 }, nutritionSource: 'user', savedAt: '2026-10-01T09:00' });
const SEED = `s => {
  s.health.food.recipes.rLean = ${JSON.stringify(RECIPE('rLean', 'Chicken and rice bowl', 450, 40))};
  s.health.food.recipes.rBig = ${JSON.stringify(RECIPE('rBig', 'Creamy pasta bake', 900, 20))};
  s.health.workout.templates = [{ id: 'tFull', name: 'Full body', minutes: 40, archived: false, items: [] }];
}`;

(async () => {
  await T.connect();
  await T.send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/London' });
  await T.send('Emulation.setLocaleOverride', { locale: 'en-GB' });

  console.log('\n[1] A Goal tab in Health');
  await go('today', 2026, 10, 15); await reset(); await go('today', 2026, 10, 15);
  await click('#themeBtn'); await sleep(250); // a first save, so there's saved data to edit
  await editStorage(SEED);
  await go('health/goal', 2026, 10, 15, 9, 1);
  check('Health has three tabs: Workout, Food, Goal', eq(await ev(`[...document.querySelectorAll('.health-tabs [role=tab]')].map(a => a.textContent.trim())`), ['Workout', 'Food', 'Goal']));
  check('the five goals to choose from', eq(await ev(`[...document.querySelectorAll('#goalIntro [data-s=goal]')].map(b => b.dataset.id)`), ['lose', 'gain', 'recomp', 'maintain', 'health']));
  check('…saying the answers stay on this device; nothing is saved yet', (await text('#goalIntro')).includes('stay on this device') && (await fit()).answers === null);
  check('without a goal, a recipe shows no goal note', !(await (async () => { await go('health/food/recipe/rLean', 2026, 10, 15, 9, 2); return exists('[data-s=goal-fit]'); })()));

  console.log('\n[2] The questions, one at a time');
  await go('health/goal', 2026, 10, 15, 9, 3);
  await click('#goalIntro [data-s=goal][data-id=lose]'); await sleep(150);
  check('"Lose weight" starts the questions at "About you" (step 2 of 6)', (await step()) === 'you' && (await text('#goalQuestions')).includes('Step 2 of 6'));
  await type('#gAge', 16); await sleep(100);
  check('under 18: a kind note about the NHS\'s advice for young people, and no going on', (await text('#goalQuestions')).includes('This plan is for adults') && (await ev(`document.querySelector('[data-action=goal-next]').disabled`)));
  await type('#gAge', 30); await pick('sex', 'female'); await type('#gH', 165); await type('#gW', 70);
  await next();
  check('then how active your days are (shift examples)', (await step()) === 'days' && (await text('#goalQuestions')).includes('12-hour shifts'));
  await pick('activity', 'onFeet'); await next();
  await pick('experience', 'new'); await pick('days', '3'); await pick('equipment', 'none'); await next();
  check('a pace question for losing weight', (await step()) === 'pace');
  await pick('pace', 'steady'); await next();
  check('and the health questions last', (await step()) === 'health' && (await text('#goalQuestions')).includes('eating disorder'));
  await click('[data-action=goal-save]'); await sleep(300);
  const f = await fit();
  check('"See my plan" saves your answers (this device only)', f.answers && f.answers.goal === 'lose' && f.answers.age === 30 && f.answers.weightKg === 70 && f.answers.heightCm === 165 && f.answers.activity === 'onFeet' && f.answers.days === 3 && f.answers.pace === 'steady' && f.setOn === '2026-10-15', f);

  console.log('\n[3] The plan');
  check('calories: 1,550–1,750 kcal a day, with why', (await text('[data-s=kcal]')).includes('1,550–1,750') && (await text('#plan-pCal')).includes('550 kcal a day less'));
  check('protein: 125–155 g a day', (await text('[data-s=protein]')).includes('125–155'));
  check('carbs aren\'t the enemy; fats in grams', (await text('#plan-pCarb')).includes("Carbs aren't the enemy") && (await text('#plan-pCarb')).includes('45–70 g'));
  check('training: the focus, 3 strength sessions a week, 150 minutes of walking', (await text('[data-s=focus]')).includes('Strength training to keep your muscle') && (await text('[data-s=sessions]')).includes('3 sessions a week') && (await text('#plan-pTrain')).includes('150 minutes'));
  check('progress, checking in, shift tips and sources (NHS, ISSN)', (await text('#plan-pProg')).includes('weekly average') && (await text('#plan-pShift')).includes('night shifts') && (await ev(`!!document.querySelector('a[href*="nhs.uk"]') && !!document.querySelector('a[href*="PMC5477153"]')`)));
  check('…labelled as estimates, not medical advice', (await text('#goalPlan')).includes('Estimates from public guidance — not medical advice'));

  console.log('\n[4] Today, and recipes');
  await go('today', 2026, 10, 15, 10);
  check('Today\'s Health card shows a gentle line: "This week: 0 of 3 workouts", linking to the plan', (await text('#app')).includes('This week: 0 of 3 workouts') && (await exists('a[href="#health/goal"]')));
  await go('health/food/recipe/rLean', 2026, 10, 15, 10, 1);
  check('a lean, high-protein recipe: "High in protein (about 29% of your daily target) · a great fit for your goal."', (await text('[data-s=goal-fit]')).includes('High in protein (about 29% of your daily target) · a great fit for your goal.'));
  await go('health/food/recipe/rBig', 2026, 10, 15, 10, 2);
  check('a big one: "higher in calories — fits your goal in a smaller portion", never "bad"', (await text('[data-s=goal-fit]')).includes('higher in calories — fits your goal in a smaller portion') && !/\bbad\b/i.test(await text('[data-s=goal-fit]')));
  await go('health/food', 2026, 10, 15, 10, 3);
  check('the recipe cards in your list show a short note too', eq(await ev(`[...document.querySelectorAll('[data-s=goal-fit-short]')].map(x => x.textContent).sort()`), ['High in protein — good for your goal', 'Higher in calories for your goal — try a smaller portion']));

  console.log('\n[5] Suggesting a workout schedule (you confirm)');
  await go('health/goal', 2026, 10, 15, 11);
  await click('[data-action=goal-schedule]');
  check('it asks first, saying what it would set', /Train about 3 times a week\?/.test(await ev(`document.querySelector('dialog')?.textContent || ''`)) && /Full body/.test(await ev(`document.querySelector('dialog')?.textContent || ''`)));
  await answer(false);
  check('"Not now": the schedule is as it was', (await data()).health.workout.schedule.mode === 'off');
  await click('[data-action=goal-schedule]'); await answer(true);
  const sch = (await data()).health.workout.schedule;
  check('"Set my schedule": your workouts in order, 1 rest day between (about 3 a week), and Workout\'s schedule opens', sch.mode === 'sequence' && sch.restDays === 1 && eq(sch.sequence, ['tFull']) && (await ev('location.hash')) === '#health/workout/schedule');
  await go('health/goal', 2026, 10, 15, 11, 1);
  check('…the plan then says the schedule already fits', (await text('#plan-pTrain')).includes('already fits'));

  console.log('\n[6] Changing your answers: stone and feet');
  await click('[data-action=goal-change]'); await sleep(150);
  check('"Change my answers" starts again with your answers filled in', (await step()) === 'goal' && (await ev(`document.querySelector('[data-s=goal][data-id=lose]').getAttribute('aria-pressed')`)) === 'true');
  await next(); await pick('units', 'imperial'); await sleep(100);
  check('switching to stone and feet shows your height and weight in them (5 ft 5 in, 11 st 0 lb)', (await ev(`[document.getElementById('gFt').value, document.getElementById('gIn').value, document.getElementById('gSt').value, document.getElementById('gLb').value].join()`)) === '5,5,11,0');
  await type('#gSt', 12); await type('#gLb', 7);
  for (let i = 0; i < 4; i++) await next();
  await click('[data-action=goal-save]'); await sleep(300);
  let ff = await fit();
  check('saved in kg, shown as you chose: 12 st 7 lb = 79.4 kg', ff.units === 'imperial' && ff.answers.weightKg === 79.4 && (await text('#goalPlan')).includes('12 st 7 lb'), ff.answers.weightKg);
  const savedNew = JSON.parse(await ev(`localStorage.getItem('${KEY}')`));
  T.setUrl('index.html#today'); await openAt(2026, 10, 15, 12);
  for (let i = 0; i < 3; i++) { await click('#themeBtn'); await sleep(250); } // the current MyDay saves three times
  check('the current MyDay keeps your goal exactly as it was', eq(JSON.parse(await ev(`localStorage.getItem('${KEY}')`)).fitness, savedNew.fitness));

  console.log('\n[7] When calorie advice isn\'t right');
  await go('health/goal', 2026, 10, 15, 12, 5);
  await click('[data-action=goal-change]'); await sleep(150);
  for (let i = 0; i < 5; i++) await next();
  await pick('pregnant', 'true');
  await click('[data-action=goal-save]'); await sleep(300);
  check('pregnant or breastfeeding: no calorie or protein figures, and a kind note pointing to the midwife or GP', !(await exists('[data-s=kcal]')) && !(await exists('[data-s=protein]')) && (await text('#goalCaution')).includes('midwife or GP'));
  check('…the general activity guidance still shows', (await text('#plan-pTrain')).includes('sessions a week'));

  console.log('\n[8] Removing the goal');
  await click('[data-action=goal-remove]'); await answer(false);
  check('"Keep it" keeps it', (await fit()).answers !== null);
  await click('[data-action=goal-remove]'); await answer(true);
  check('"Remove": the answers go; workouts and recipes stay', (await fit()).answers === null && (await exists('#goalIntro')) && (await data()).health.workout.templates.length === 1 && !!(await data()).health.food.recipes.rLean);
  await go('today', 2026, 10, 15, 13);
  check('…and Today\'s line goes with it', !(await text('#app')).includes('workouts this week') && !(await text('#app')).includes('This week:'));

  console.log('\n[9] Layout');
  await T.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await go('health/goal', 2026, 10, 15, 14);
  await click('#goalIntro [data-s=goal][data-id=gain]'); await sleep(150);
  const shots = [];
  for (const s of ['you', 'days', 'training', 'pace', 'health']) {
    if (s === 'you') await pick('units', 'imperial');
    const small = await ev(`[...document.querySelectorAll('#goalQuestions button, #goalQuestions input:not([type=checkbox]), #goalQuestions label:has(input[type=checkbox])')].filter(b => b.offsetParent !== null).map(b => { const r = b.getBoundingClientRect(); return { t: (b.textContent || b.id).trim().slice(0, 20), h: Math.round(r.height) }; }).filter(x => x.h < 44)`);
    shots.push({ s, wide: await ev('document.documentElement.scrollWidth > innerWidth'), small });
    if (s !== 'health') await next(); else await click('[data-action=goal-save]');
    await sleep(150);
  }
  check('phone: every question fits (nothing scrolls sideways) and every choice and field is at least 44 px high', shots.every(x => !x.wide && !x.small.length), shots.filter(x => x.wide || x.small.length));
  check('phone: the plan fits', !(await ev('document.documentElement.scrollWidth > innerWidth')) && (await exists('#goalPlan')));
  await T.send('Emulation.clearDeviceMetricsOverride');

  const errs = T.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description);
  check('no uncaught JavaScript errors', errs.length === 0, errs.slice(0, 3));
  const sm = T.summary(); console.log(`\n${sm.pass} passed, ${sm.fail} failed`); process.exit(sm.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); const s = T.summary(); console.log(`${s.pass} passed, ${s.fail} failed before the error`); process.exit(2); });
