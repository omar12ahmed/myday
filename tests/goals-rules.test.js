// Health → Goal: the plan's figures, on the app's own code (app/src/data/goals.ts, bundled for Node), against worked
// examples — calories (Mifflin–St Jeor × activity, a safe floor), protein (g/kg, a healthy reference weight above a
// BMI of 30), fats, sessions a week, the safety cases (pregnancy, eating disorder history, conditions, a low weight),
// units, how recipes fit, and reading saved answers. No browser.
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const G = await import(pathToFileURL(await bundle(path.join(ROOT, 'app/src/data/goals.ts'), path.join(os.tmpdir(), `myday-goals-${process.pid}`))).href);
  const base = { goal: 'lose', age: 30, sex: 'female', heightCm: 165, weightKg: 70, activity: 'onFeet', experience: 'new', days: 3, equipment: 'none', pace: 'steady', pregnant: false, eatingDisorder: 'no', conditions: [] };

  console.log('\n[1] Calories and protein, worked examples');
  let a = base, p = G.plan(a);
  check('her body\'s own needs (Mifflin–St Jeor): 10×70 + 6.25×165 − 5×30 − 161 = 1420.25 kcal', Math.abs(G.bmr(a) - 1420.25) < 1e-9);
  check('…×1.55 for on her feet most of the day: about 2,200 kcal to stay the same', p.maintenance === 2200);
  check('losing weight, steady: 550 kcal less → 1,550–1,750 kcal a day', eq(p.calories, { low: 1550, high: 1750 }), p.calories);
  check('protein 1.8–2.2 g/kg × 70 kg → 125–155 g a day (to the nearest 5)', eq(p.protein, { low: 125, high: 155 }), p.protein);
  check('fats 25–35% of calories → 45–70 g', eq(p.fat, { low: 45, high: 70 }), p.fat);
  check('training: 3 strength sessions a week (new to it, 3 days free), full-body, no equipment needed; 150 minutes of walking', p.sessions === 3 && /Full-body/.test(p.sessionStyle) && /No equipment needed/.test(p.sessionStyle) && /150 minutes/.test(p.cardio));
  check('the gentle pace: 300 kcal less → 1,800–2,000', eq(G.plan({ ...a, pace: 'gentle' }).calories, { low: 1800, high: 2000 }));
  a = { ...base, goal: 'gain', sex: 'male', age: 25, heightCm: 180, weightKg: 75, activity: 'some', experience: 'experienced', days: 5, pace: 'gentle', equipment: 'gym' };
  p = G.plan(a);
  check('building muscle (man, 25, 180 cm, 75 kg, on his feet some of the day): needs about 2,400; plus 200 → 2,500–2,700', p.maintenance === 2400 && eq(p.calories, { low: 2500, high: 2700 }), p);
  check('…protein 1.6–2.2 g/kg → 120–165 g; 4 sessions as an upper/lower split; light cardio', eq(p.protein, { low: 120, high: 165 }) && p.sessions === 4 && /upper\/lower split/.test(p.sessionStyle) && /Light cardio/.test(p.cardio));
  check('never more sessions than the days you have', G.plan({ ...a, days: 2 }).sessions === 2 && G.plan({ ...base, goal: 'gain', days: 7, experience: 'new' }).sessions === 3);
  a = { ...base, goal: 'recomp' }; p = G.plan(a);
  check('lose weight and build muscle: 250 under maintenance → 1,850–2,050, protein at the higher end', eq(p.calories, { low: 1850, high: 2050 }) && eq(p.protein, { low: 125, high: 155 }));
  check('maintain: about maintenance, protein 1.4–1.6 g/kg; fitter and healthier: no weight goal, 1.2–1.6 g/kg', eq(G.plan({ ...base, goal: 'maintain' }).calories, { low: 2100, high: 2300 }) && eq(G.plan({ ...base, goal: 'maintain' }).protein, { low: 100, high: 110 }) && eq(G.plan({ ...base, goal: 'health' }).protein, { low: 85, high: 110 }));
  a = { ...base, heightCm: 170, weightKg: 120 };
  check('above a BMI of 30, protein uses a healthy weight for the height (BMI 25 at 170 cm ≈ 72 kg) → 130–160 g, not 215–265', G.proteinWeight(a) === 72 && eq(G.plan(a).protein, { low: 130, high: 160 }));
  a = { ...base, age: 50, heightCm: 155, weightKg: 55, activity: 'sitting' };
  p = G.plan(a);
  check('a deficit never goes below the body\'s own needs or 1,200 kcal (woman) — not even the low end of the range: 1,200–1,300, and it says why', eq(p.calories, { low: 1200, high: 1300 }) && /kept above your body's own needs/.test(p.calorieNote), [p.calories, p.calorieNote]);
  check('…for every combination tried, the range never starts below the floor', ['female', 'male', 'unsaid'].every(sex => [45, 60, 80].every(w => ['lose', 'recomp'].every(goal => { const x = { ...base, sex, weightKg: w, heightCm: 150, age: 60, activity: 'sitting', goal }; const q = G.plan(x); return q.calories.low >= Math.max(Math.round(G.bmr(x) / 50) * 50, sex === 'male' ? 1500 : sex === 'female' ? 1200 : 1350); }))));

  console.log('\n[2] When calorie advice isn\'t right: no targets, kind words, and somewhere to turn');
  p = G.plan({ ...base, pregnant: true });
  check('pregnant or breastfeeding: no calorie or protein targets; the midwife or GP', p.calories === null && p.protein === null && /midwife or GP/.test(p.caution));
  p = G.plan({ ...base, eatingDisorder: 'yes' });
  check('an eating disorder (or would rather not say): no calorie or weight targets; GP or BEAT', p.calories === null && /BEAT/.test(p.caution) && G.plan({ ...base, eatingDisorder: 'unsaid' }).calories === null);
  p = G.plan({ ...base, conditions: ['kidney', 'diabetes'] });
  check('a condition (e.g. kidney, diabetes): no targets; GP or a dietitian; the activity guidance still shown', p.calories === null && p.protein === null && /a kidney condition and diabetes/.test(p.caution) && p.sessions >= 1);
  p = G.plan({ ...base, heightCm: 175, weightKg: 52 });
  check('wanting to lose weight below a healthy BMI: it won\'t suggest losing more — a plan for staying strong instead', /won't suggest losing more/.test(p.caution) && p.calories.low >= p.maintenance - 100);
  check('no pressure words anywhere in the plans', [base, { ...base, goal: 'gain' }, { ...base, pregnant: true }].every(x => !/\b(must|should|failure|lazy|no excuses)\b/i.test(JSON.stringify(G.plan(x)))));

  console.log('\n[3] Units, recipes, schedules and saved answers');
  check('70 kg = 11 st 0 lb, and back; 180 cm = 5 ft 11 in, and back', eq(G.kgToStLb(70), { st: 11, lb: 0 }) && G.stLbToKg(11, 0) === 69.9 && eq(G.cmToFtIn(180), { ft: 5, inch: 11 }) && G.ftInToCm(5, 11) === 180);
  p = G.plan(base);
  check('a high-protein, moderate recipe (450 kcal, 40 g): "High in protein (about 29% of your daily target) · a great fit for your goal"', G.recipeFit(base, p, { kcal: 450, protein: 40 }) === 'High in protein (about 29% of your daily target) · a great fit for your goal.');
  check('a big one (900 kcal, 20 g): "…higher in calories — fits your goal in a smaller portion…" (never "bad")', /higher in calories — fits your goal in a smaller portion/.test(G.recipeFit(base, p, { kcal: 900, protein: 20 })) && !/bad/i.test(G.recipeFit(base, p, { kcal: 900, protein: 20 })));
  check('no nutrition listed, or no targets (e.g. pregnancy): no note', G.recipeFit(base, p, { kcal: null, protein: 30 }) === null && G.recipeFit(base, G.plan({ ...base, pregnant: true }), { kcal: 400, protein: 30 }) === null);
  check('rest days for a sessions-a-week target: 2 → 3, 3 → 1, 4 → 1, 5 → 0, 1 → 6', [2, 3, 4, 5, 1].map(G.restDaysFor).join() === '3,1,1,0,6');
  const report = { dropped: 0 };
  let f = G.normalizeFitness({ units: 'imperial', answers: { ...base, age: 15 }, setOn: '2026-10-04', later: { kept: true } }, report);
  check('saved answers out of range (e.g. under 18) can\'t be used: counted, and you\'re asked again; unknown fields kept', f.answers === null && report.dropped === 1 && f.units === 'imperial' && eq(f.later, { kept: true }));
  f = G.normalizeFitness({ answers: { ...base, conditions: ['kidney', 'nonsense'], pace: 'zoom' } }, report);
  check('good answers read back (unknown conditions and choices fall back safely)', f.answers.weightKg === 70 && eq(f.answers.conditions, ['kidney']) && f.answers.pace === 'gentle' && f.units === 'metric');
  check('no Goal section yet: no goal, kg and cm', eq(G.normalizeFitness(undefined, report), { units: 'metric', answers: null, setOn: null }));

  const { pass, fail } = summary();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('HARNESS:', e); process.exit(2); });
