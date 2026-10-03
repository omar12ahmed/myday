// Health → Goal: your fitness goal, a few questions, and a plan worked out from them — calories, protein, carbs and
// fats, training, pace and check-ins. Every figure is an ESTIMATE from public guidance (sources below), not medical
// advice. Nothing here leaves the device: your answers are saved only in this browser (and in "Export my data").
//
// Saved as a top-level `fitness` section (added by the new app in 1.3.0, like Finance and Notes; the classic MyDay
// keeps it as it is, unread).
//
// Sources:
//   Calories   Mifflin–St Jeor equation (Mifflin et al., Am J Clin Nutr 1990) × an activity factor.
//   Weight loss 0.5–1 kg a week from eating about 600 kcal a day less (NHS 12-week weight loss guide; NICE).
//   Protein    1.4–2.0 g/kg/day for people who exercise (ISSN position stand, 2017); muscle gain plateaus around
//              1.6 g/kg, upper estimate 2.2 (Morton et al., Br J Sports Med 2018).
//   Activity   150 min moderate (or 75 min vigorous) a week + strengthening on at least 2 days (NHS, adults 19–64).
import { isDateKey } from './dates';
import type { MyDayData } from './types';
import { isObj } from './util';

import type { Activity, Condition, FitnessData, GoalAnswers, GoalKind } from './types';
export type { Activity, Condition, Equipment, Experience, FitnessData, GoalAnswers, GoalKind, Pace, Sex } from './types';

export const GOALS: { id: GoalKind; label: string; hint: string }[] = [
  { id: 'lose', label: 'Lose weight', hint: 'Lose fat gradually, keeping your muscle' },
  { id: 'gain', label: 'Build muscle', hint: 'Get stronger and add muscle' },
  { id: 'recomp', label: 'Lose weight and build muscle', hint: 'Slowly swap fat for muscle' },
  { id: 'maintain', label: 'Maintain', hint: 'Stay as you are, stay strong' },
  { id: 'health', label: 'Get fitter and healthier', hint: 'Feel better, move more — no weight goal' },
];
export const ACTIVITY: { id: Activity; label: string; hint: string; factor: number }[] = [
  { id: 'sitting', label: 'Mostly sitting', hint: 'e.g. desk work, little walking', factor: 1.2 },
  { id: 'some', label: 'On your feet some of the day', hint: 'e.g. some walking, light shifts', factor: 1.375 },
  { id: 'onFeet', label: 'On your feet most of the day', hint: 'e.g. 12-hour shifts on the ward or shop floor', factor: 1.55 },
  { id: 'hard', label: 'Physically hard work most days', hint: 'e.g. lifting, moving patients, manual work', factor: 1.725 },
];
export const GOAL_LABEL = Object.fromEntries(GOALS.map(g => [g.id, g.label])) as Record<GoalKind, string>;

export const emptyFitness = (): FitnessData => ({ units: 'metric', answers: null, setOn: null });

const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);
const num = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : null);
// Reading saved answers: anything out of range means the answers can't be used (they're counted, and you're asked
// again); unknown fields are kept.
export function normalizeFitness(raw: unknown, report: { dropped: number }): FitnessData {
  if (!isObj(raw)) return emptyFitness();
  const out: FitnessData = { ...raw, units: raw.units === 'imperial' ? 'imperial' : 'metric', answers: null, setOn: isDateKey(raw.setOn) ? raw.setOn : null };
  const a = raw.answers;
  if (a === null || a === undefined) return out;
  if (!isObj(a)) { report.dropped++; return out; }
  const age = num(a.age, 18, 100), h = num(a.heightCm, 120, 230), w = num(a.weightKg, 30, 300), days = num(a.days, 1, 7);
  if (age === null || h === null || w === null || days === null || !GOALS.some(g => g.id === a.goal)) { report.dropped++; return out; }
  out.answers = {
    goal: a.goal as GoalKind, age: Math.round(age), sex: oneOf(a.sex, ['female', 'male', 'unsaid'] as const, 'unsaid'),
    heightCm: Math.round(h), weightKg: Math.round(w * 10) / 10,
    activity: oneOf(a.activity, ['sitting', 'some', 'onFeet', 'hard'] as const, 'some'),
    experience: oneOf(a.experience, ['new', 'some', 'experienced'] as const, 'new'), days: Math.round(days),
    equipment: oneOf(a.equipment, ['gym', 'home', 'none'] as const, 'none'), pace: oneOf(a.pace, ['gentle', 'steady'] as const, 'gentle'),
    pregnant: a.pregnant === true, eatingDisorder: oneOf(a.eatingDisorder, ['no', 'yes', 'unsaid'] as const, 'unsaid'),
    conditions: Array.isArray(a.conditions) ? a.conditions.filter((c): c is Condition => ['diabetes', 'kidney', 'heart', 'other'].includes(c as string)) : [],
  };
  return out;
}

// ---------- Units ----------
export const kgToStLb = (kg: number) => { const lb = Math.round(kg * 2.20462); return { st: Math.floor(lb / 14), lb: lb % 14 }; };
export const stLbToKg = (st: number, lb: number) => Math.round(((st * 14 + lb) / 2.20462) * 10) / 10;
export const cmToFtIn = (cm: number) => { const inch = Math.round(cm / 2.54); return { ft: Math.floor(inch / 12), inch: inch % 12 }; };
export const ftInToCm = (ft: number, inch: number) => Math.round((ft * 12 + inch) * 2.54);
export const showWeight = (kg: number, units: FitnessData['units']) => { if (units === 'metric') return `${kg} kg`; const { st, lb } = kgToStLb(kg); return `${st} st ${lb} lb`; };

// ---------- The plan ----------
const round = (n: number, step: number) => Math.round(n / step) * step;
export interface Range { low: number; high: number }
export interface GoalPlan {
  caution: string | null;             // when calorie advice isn't right for you (pregnancy, eating disorder history, a condition)
  maintenance: number | null;         // kcal a day to stay the same (estimate)
  calories: Range | null;             // kcal a day for your goal
  calorieNote: string;
  protein: Range | null;              // g a day
  proteinNote: string;
  fat: Range | null;                  // g a day
  carbsNote: string;
  sessions: number;                   // strength sessions a week
  cardio: string;                     // e.g. "150 minutes of brisk walking (or similar) a week"
  focus: string;                      // e.g. "Strength training, with light cardio"
  sessionStyle: string;               // how to organise the sessions
  progress: string;                   // what to expect
  checkIn: string;                    // how to check and adjust
  shiftTips: string[];
}

export function bmr(a: GoalAnswers) {
  const s = a.sex === 'male' ? 5 : a.sex === 'female' ? -161 : -78; // "prefer not to say": halfway between
  return 10 * a.weightKg + 6.25 * a.heightCm - 5 * a.age + s;
}
// For protein, a very high body weight would give targets well beyond what's needed: above a BMI of 30 the weight at
// a BMI of 25 for your height is used instead.
export function proteinWeight(a: GoalAnswers) {
  const m = a.heightCm / 100, bmi = a.weightKg / (m * m);
  return bmi >= 30 ? Math.round(25 * m * m) : a.weightKg;
}
export const bmiOf = (a: GoalAnswers) => a.weightKg / (a.heightCm / 100) ** 2;

export function plan(a: GoalAnswers): GoalPlan {
  const caution = a.pregnant ? 'Because you\'re pregnant or breastfeeding, there are no calorie targets here: your midwife or GP can tell you what\'s right for you and your baby. The activity guidance below is general — check it with them too.'
    : a.eatingDisorder !== 'no' ? 'There are no calorie or weight targets here: counting can be unhelpful after an eating disorder (or if you\'d rather not say). If food or weight feels difficult, your GP or BEAT (beateatingdisorders.org.uk) can help. The activity ideas below are about feeling good, not weight.'
    : a.conditions.length ? `Because of ${a.conditions.map(c => ({ diabetes: 'diabetes', kidney: 'a kidney condition', heart: 'a heart condition', other: 'a health condition' })[c]).join(' and ')}, there are no calorie or protein targets here — your GP or a dietitian can set ones that are safe with your condition and medicines. The general activity guidance below still applies; ask your GP before starting anything strenuous.`
    : a.goal === 'lose' && bmiOf(a) < 18.5 ? 'Your weight is already below the healthy range for your height, so this won\'t suggest losing more. If you\'d like to talk it through, your GP can help. Here is a plan for staying strong instead.'
    : null;
  const goal: GoalKind = a.goal === 'lose' && bmiOf(a) < 18.5 ? 'maintain' : a.goal;
  const noNumbers = caution !== null && !(a.goal === 'lose' && bmiOf(a) < 18.5);
  const keep = round(bmr(a) * ACTIVITY.find(x => x.id === a.activity)!.factor, 50);
  const floor = Math.max(round(bmr(a), 50), a.sex === 'male' ? 1500 : a.sex === 'female' ? 1200 : 1350);

  let calories: Range | null = null, calorieNote = '';
  if (!noNumbers) {
    if (goal === 'lose') {
      const cut = a.pace === 'steady' ? 550 : 300;
      const mid = Math.max(floor, keep - cut);
      calories = { low: Math.max(floor, mid - 100), high: mid + 100 }; // never starting below the floor
      calorieNote = mid > keep - cut
        ? `A small deficit, kept above your body's own needs (about ${floor} kcal), so it stays safe — a little slower than ${a.pace === 'steady' ? '0.5–1' : '0.25–0.5'} kg a week.`
        : `About ${cut} kcal a day less than you need to stay the same (about ${keep}). That's roughly ${a.pace === 'steady' ? '0.5–1 kg a week (the NHS\'s healthy pace)' : '0.25–0.5 kg a week — gentle and easier to keep up'}.`;
    } else if (goal === 'gain') {
      const add = a.pace === 'steady' ? 350 : 200;
      calories = { low: keep + add - 100, high: keep + add + 100 };
      calorieNote = `A little more than you need to stay the same (about ${keep}), so there's energy to build muscle without adding much fat.`;
    } else if (goal === 'recomp') {
      const mid = Math.max(floor, keep - 250);
      calories = { low: Math.max(floor, mid - 100), high: mid + 100 };
      calorieNote = `Slightly under what you need to stay the same (about ${keep}): enough to lose fat slowly while strength training builds muscle.`;
    } else {
      calories = { low: keep - 100, high: keep + 100 };
      calorieNote = goal === 'health' ? 'About what you need to stay the same — the focus is on moving more and eating well, not on weight.' : 'About what you need to stay the same weight.';
    }
  }
  const pw = proteinWeight(a);
  const perKg: Record<GoalKind, [number, number]> = { lose: [1.8, 2.2], gain: [1.6, 2.2], recomp: [1.8, 2.2], maintain: [1.4, 1.6], health: [1.2, 1.6] };
  const [pl, ph] = perKg[goal];
  const protein = noNumbers ? null : { low: round(pw * pl, 5), high: round(pw * ph, 5) };
  const proteinNote = noNumbers ? '' : `${pl}–${ph} g for each kg of ${pw === a.weightKg ? 'your weight' : 'a healthy weight for your height'}${goal === 'lose' || goal === 'recomp' ? ', at the higher end while eating less, to keep your muscle' : goal === 'gain' ? '; much more than about 1.6 g/kg rarely adds more muscle' : ''}. Spread it over your meals (about 25–40 g each).`;
  const fat = calories ? { low: round((calories.low * 0.25) / 9, 5), high: round((calories.high * 0.35) / 9, 5) } : null;
  const carbsNote = 'Carbs aren\'t the enemy: they fuel your training and long shifts. Choose mostly wholegrains, fruit, vegetables and beans; the rest of your calories after protein and fat can be carbs.';

  // Training: NHS minimum (strength 2 days + 150 min moderate), more strength for building muscle — never more
  // sessions than the days you have.
  const want: Record<GoalKind, number> = { lose: 3, gain: 4, recomp: 3, maintain: 2, health: 2 };
  const sessions = Math.max(1, Math.min(a.days, a.experience === 'new' ? Math.min(want[goal], 3) : want[goal]));
  const cardio = goal === 'gain' ? 'Light cardio 1–2 times a week (e.g. a 20–30 minute walk or bike ride) — good for your heart without taking from your recovery.'
    : '150 minutes a week of moderate activity — brisk walking counts (about 20 minutes a day, or longer walks on days off).';
  const focus = { lose: 'Strength training to keep your muscle, plus regular walking or other cardio', gain: 'Strength training, with light cardio', recomp: 'Strength training, with some cardio', maintain: 'A mix of strength and cardio', health: 'Moving more each day, with some strength work' }[goal];
  const sessionStyle = a.experience === 'new'
    ? `Full-body sessions (${sessions} a week, 30–45 minutes): one or two exercises each for legs, push, pull and core. Add a little weight or a rep when it feels easy.`
    : sessions >= 4 ? `An upper/lower split (${sessions} sessions a week): each muscle group twice a week, roughly 10–20 hard sets per muscle group a week.`
    : `Full-body or upper/lower (${sessions} sessions a week): each muscle group at least twice a week, adding weight or reps over time.`;
  const equipNote = a.equipment === 'none' ? ' No equipment needed: squats, lunges, press-ups, glute bridges and planks work well.' : a.equipment === 'home' ? ' At home: dumbbells or bands, bodyweight moves, and a backpack for extra weight.' : '';
  const progress = goal === 'lose' ? `Expect ups and downs day to day; the weekly average is what counts. ${a.pace === 'steady' ? 'About 0.5–1 kg a week' : 'About 0.25–0.5 kg a week'} is a healthy pace.`
    : goal === 'gain' ? 'Muscle builds slowly: about 0.25–0.5 kg a month (a bit faster in your first year of training). Getting stronger is the best sign.'
    : goal === 'recomp' ? 'Your weight may barely change while your shape and strength do. Track your lifts and how clothes fit, not just the scales.'
    : 'Stay within a kilo or two, and keep your strength.';
  const checkIn = noNumbers ? 'Notice how you feel, sleep and move — that\'s progress.'
    : 'Weigh yourself 2–3 times a week, at the same time of day, and compare weekly averages. If nothing has changed after 2–3 weeks, adjust by 100–200 kcal a day. Change your answers here whenever things change.';
  const shiftTips = [
    'Plan meals for long and night shifts in advance — a high-protein meal before you go and a planned snack, so you\'re not relying on the vending machine.',
    'Train on days off or before a day shift; after a run of nights, a walk counts.',
    'Sleep affects hunger and recovery: protect your sleep after nights where you can.',
  ];
  return { caution, maintenance: noNumbers ? null : keep, calories, calorieNote, protein, proteinNote: proteinNote + '', fat, carbsNote,
    sessions, cardio, focus, sessionStyle: sessionStyle + equipNote, progress, checkIn, shiftTips };
}

// ---------- Food: how a recipe fits your goal (only where it lists its nutrition) ----------
export function recipeFit(a: GoalAnswers, p: GoalPlan, n: { kcal: number | null; protein: number | null }): string | null {
  if (n.kcal === null || n.protein === null || !p.calories || !p.protein) return null;
  const share = Math.round((n.protein / ((p.protein.low + p.protein.high) / 2)) * 100);
  const dense = n.kcal > 0 ? (n.protein / n.kcal) * 100 : 0; // g protein per 100 kcal
  const big = n.kcal > (p.calories.low + p.calories.high) / 2 * 0.4;
  const parts: string[] = [];
  if (dense >= 7 || n.protein >= 30) parts.push(`High in protein (about ${share}% of your daily target)`); else parts.push(`About ${share}% of your daily protein`);
  const goal = a.goal === 'lose' && bmiOf(a) < 18.5 ? 'maintain' : a.goal;
  if ((goal === 'lose' || goal === 'recomp') && big) parts.push('higher in calories — fits your goal in a smaller portion, or on a training day');
  else if ((goal === 'lose' || goal === 'recomp') && dense >= 7) parts.push('a great fit for your goal');
  else if (goal === 'gain' && n.protein >= 25) parts.push('a good fit for building muscle');
  return parts.join(' · ') + '.';
}

// A few words for a recipe card in a list (only when there's something useful to say).
export function recipeFitShort(a: GoalAnswers, p: GoalPlan, n: { kcal: number | null; protein: number | null }): string | null {
  if (n.kcal === null || n.protein === null || !p.calories || !p.protein) return null;
  const goal = a.goal === 'lose' && bmiOf(a) < 18.5 ? 'maintain' : a.goal;
  const dense = n.kcal > 0 ? (n.protein / n.kcal) * 100 : 0;
  if ((goal === 'lose' || goal === 'recomp') && n.kcal > ((p.calories.low + p.calories.high) / 2) * 0.4) return 'Higher in calories for your goal — try a smaller portion';
  if (dense >= 7 || n.protein >= 30) return 'High in protein — good for your goal';
  return null;
}
// The goal and plan, if you've set one (null otherwise).
export function goalAndPlan(data: MyDayData): { a: GoalAnswers; p: GoalPlan } | null {
  const a = fitnessOf(data).answers;
  return a ? { a, p: plan(a) } : null;
}

// ---------- Workout: how many sessions a week (for the schedule), and this week's count (for Today) ----------
// Rest days between sessions that give about `sessions` a week (used with the "in order" schedule).
export const restDaysFor = (sessions: number) => Math.max(0, Math.round(7 / sessions) - 1);
export const fitnessOf = (data: MyDayData): FitnessData => data.fitness ?? emptyFitness();
