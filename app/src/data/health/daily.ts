// Daily exercises (Health → Workout): a small set of everyday movements, each with a daily target and
// a set size ("150 push-ups, in sets of 25"). One tap on Today logs one set; the log keeps each tap's
// reps so a mis-tap can be undone. Missed days cost nothing — every morning starts from the full target
// again — and changes to a target or set size apply from today (days already logged stay as they were).
import { isDateKey, parseKey, shift } from '../dates';
import type { DailyData, DailyExercise, DateKey } from '../types';
import { intIn, isObj } from '../util';

const str = (v: unknown, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function emptyDaily(): DailyData {
  return { exercises: [], log: {} };
}

// Checks saved Daily exercises the way the rest of Health is checked. An exercise without a usable name
// or target is dropped; taps are kept only for exercises that exist, whole numbers of 1–1000, 100 a day.
export function normalizeDaily(raw: unknown, report: { dropped: number }): DailyData {
  const d = emptyDaily();
  if (!isObj(raw)) return d;
  const ids = new Set<string>();
  if (Array.isArray(raw.exercises)) for (const e of raw.exercises.slice(0, 20)) {
    const target = isObj(e) ? intIn(e.target, 1, 1000, 0) : 0;
    if (!isObj(e) || typeof e.id !== 'string' || !e.id || !str(e.name) || !target || ids.has(e.id)) { report.dropped++; continue; }
    ids.add(e.id);
    d.exercises.push({ id: e.id, name: str(e.name), target, set: Math.min(intIn(e.set, 1, 500, target), target), archived: e.archived === true });
  }
  if (isObj(raw.log)) for (const day of Object.keys(raw.log)) {
    if (!isDateKey(day) || !isObj(raw.log[day])) { report.dropped++; continue; }
    const taps: Record<string, number[]> = {};
    for (const id of Object.keys(raw.log[day] as Record<string, unknown>)) {
      const v = (raw.log[day] as Record<string, unknown>)[id];
      if (!ids.has(id) || !Array.isArray(v)) { report.dropped++; continue; }
      const reps = v.slice(0, 100).map(x => intIn(x, 1, 1000, 0)).filter((x): x is number => x > 0);
      if (reps.length) taps[id] = reps; else if (v.length) report.dropped++;
    }
    if (Object.keys(taps).length) d.log[day] = taps;
  }
  return d;
}

// ---------- Reading ----------
export const liveExercises = (d: DailyData) => d.exercises.filter(e => !e.archived);
export const tapsOn = (d: DailyData, k: DateKey, id: string): number[] => d.log[k]?.[id] ?? [];
export const repsDone = (d: DailyData, k: DateKey, id: string) => tapsOn(d, k, id).reduce((a, b) => a + b, 0);
export const repsLeft = (e: DailyExercise, d: DailyData, k: DateKey) => Math.max(0, e.target - repsDone(d, k, e.id));
export const dayDone = (e: DailyExercise, d: DailyData, k: DateKey) => repsDone(d, k, e.id) >= e.target;

// This week, Monday to Sunday: full = every live exercise finished that day, part = some reps logged,
// none = a quieter day (no judgment — rest counts too).
export function weekBars(d: DailyData, k: DateKey): { day: DateKey; state: 'full' | 'part' | 'none' }[] {
  const monday = shift(k, -((parseKey(k).getDay() + 6) % 7));
  const live = liveExercises(d);
  const out: { day: DateKey; state: 'full' | 'part' | 'none' }[] = [];
  for (let i = 0; i < 7; i++) {
    const day = shift(monday, i);
    const anyTaps = Object.keys(d.log[day] ?? {}).length > 0;
    const state = !anyTaps ? 'none' : live.length > 0 && live.every(e => dayDone(e, d, day)) ? 'full' : 'part';
    out.push({ day, state });
  }
  return out;
}
