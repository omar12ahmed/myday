// Workout labels, defaults and wording. Ported from the current MyDay.
import { parseKey, shift } from '../dates';
import { mod } from '../rota';
import { numIn, isObj, uid } from '../util';
import type { Exercise, ExType, LoadMode, SetValues, TemplateItem, WorkoutData } from '../types';

export const EX_TYPES: ExType[] = ['strength', 'bodyweight', 'cardio'];
export const EX_TYPE_LABEL: Record<ExType, string> = { strength: 'Strength', bodyweight: 'Bodyweight', cardio: 'Cardio' };
// What each type tracks (shown when creating an exercise).
export const EX_TYPE_HINT: Record<ExType, string> = { strength: 'sets, reps, weight', bodyweight: 'sets, reps, optional added weight or assistance', cardio: 'time and optional distance' };
export const LOAD_MODES: LoadMode[] = ['none', 'added', 'assisted'];
export const LOAD_LABEL: Record<LoadMode, string> = { none: 'Bodyweight', added: '+ Added', assisted: 'Assisted' };
export const COMMON_EXERCISES: { name: string; type: ExType }[] = [
  { name: 'Push-ups', type: 'bodyweight' }, { name: 'Pull-ups', type: 'bodyweight' }, { name: 'Kettlebell swings', type: 'strength' },
  { name: 'Squats', type: 'bodyweight' }, { name: 'Bench press', type: 'strength' }, { name: 'Running', type: 'cardio' },
];
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]; // Monday first
// e.g. weekdayName(1) → "Monday" (5 Oct 2026 is a Monday)
export const weekdayName = (dow: number, style: 'long' | 'short' = 'long') => parseKey(shift('2026-10-05', mod(dow - 1, 7))).toLocaleDateString(undefined, { weekday: style });

export function emptyWorkout(): WorkoutData {
  return {
    exercises: [],
    templates: [],
    schedule: { mode: 'off', weekdays: {}, sequence: [], next: 0, restDays: 1, since: null },
    planned: {},
    sessions: [],
    activeId: null,
    restTimer: { enabled: false, seconds: 90 },
    rest: null,
  };
}
const optNum = (v: unknown, lo: number, hi: number) => numIn(v, lo, hi, null);
// The numbers for one set, checked. Planned values and logged results use the same shape.
export function cleanSetValues(o: unknown): SetValues {
  const x = isObj(o) ? o : {};
  return {
    reps: optNum(x.reps, 0, 1000), weight: optNum(x.weight, 0, 1000),
    loadMode: LOAD_MODES.includes(x.loadMode as LoadMode) ? (x.loadMode as LoadMode) : 'none', load: optNum(x.load, 0, 1000),
    durationMin: optNum(x.durationMin, 0, 1440), distanceKm: optNum(x.distanceKm, 0, 1000),
  };
}
// A new exercise in a template: 3 × 10 (or 20 minutes of cardio), 90 s rest.
export function newItem(ex: Exercise): TemplateItem {
  const base: TemplateItem = { id: 'ti' + uid(), exerciseId: ex.id, sets: 3, restSec: 90, reps: null, weight: null, loadMode: 'none', load: null, durationMin: null, distanceKm: null };
  if (ex.type === 'cardio') return Object.assign(base, { sets: 1, durationMin: 20 });
  return Object.assign(base, { reps: 10 });
}

// ---------- Wording ----------
// A number without trailing zeros: 42.5 → "42.5", 40 → "40", null → "".
export const n1 = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(Math.round(v * 100) / 100));
// One logged set, with its units: "8 × 42.5 kg", "10 reps +10 kg", "6 reps (20 kg assist)", "25 min · 5 km".
export function fmtSet(type: ExType, s: SetValues): string {
  if (type === 'cardio') return [s.durationMin !== null ? `${n1(s.durationMin)} min` : '', s.distanceKm !== null ? `${n1(s.distanceKm)} km` : ''].filter(Boolean).join(' · ') || '—';
  const reps = s.reps !== null ? `${n1(s.reps)} reps` : '— reps';
  if (type === 'strength') return s.weight !== null ? `${n1(s.reps)} × ${n1(s.weight)} kg` : reps;
  if (s.loadMode === 'added' && s.load) return `${reps} +${n1(s.load)} kg`;
  if (s.loadMode === 'assisted' && s.load) return `${reps} (${n1(s.load)} kg assist)`;
  return reps;
}
// A planned exercise: "3 × 8 @ 40 kg", "3 × 10 +10 kg", "20 min · 5 km".
export function planText(type: ExType, p: SetValues & { sets: number }): string {
  const sets = p.sets ? `${p.sets} × ` : '';
  if (type === 'cardio') return [p.durationMin !== null ? `${n1(p.durationMin)} min` : '', p.distanceKm !== null ? `${n1(p.distanceKm)} km` : ''].filter(Boolean).join(' · ') || 'No target set';
  const reps = p.reps !== null ? `${n1(p.reps)}` : '?';
  if (type === 'strength') return `${sets}${reps}${p.weight !== null ? ` @ ${n1(p.weight)} kg` : ''}`;
  return `${sets}${reps}${p.loadMode === 'added' && p.load ? ` +${n1(p.load)} kg` : p.loadMode === 'assisted' && p.load ? ` (${n1(p.load)} kg assist)` : ''}`;
}
