// Exercise history: every finished session with done sets for an exercise, and the measures to chart.
// One measure per chart, with its unit; added weight and assistance are never mixed with each other or
// with bodyweight-only sets. Ported from the current MyDay.
import type { ExType, LoggedSet, WorkoutData } from '../types';
import { finishedSessions } from './plans';

export function exerciseRecords(w: WorkoutData, id: string) {
  return finishedSessions(w).map(s => ({ s, e: s.exercises.find(x => x.exerciseId === id) })).filter((x): x is { s: typeof x.s; e: NonNullable<typeof x.e> } => !!x.e && x.e.sets.some(y => y.done));
}
export interface Series { label: string; unit: string; points: { date: string; v: number }[]; lowerIsBetter: boolean }

export function exerciseSeries(type: ExType, records: ReturnType<typeof exerciseRecords>): Series[] {
  const out: Series[] = [];
  const pts = (label: string, unit: string, pick: (sets: LoggedSet[]) => number | null, lowerIsBetter = false) => {
    const p = records.map(({ s, e }) => { const v = pick(e.sets.filter(x => x.done)); return v === null ? null : { date: s.date, v }; }).filter((x): x is { date: string; v: number } => !!x);
    if (p.length) out.push({ label, unit, points: p, lowerIsBetter });
  };
  const maxOf = (sets: LoggedSet[], f: (x: LoggedSet) => number | null) => { const v = sets.map(f).filter((x): x is number => x !== null && x !== undefined); return v.length ? Math.max(...v) : null; };
  const minOf = (sets: LoggedSet[], f: (x: LoggedSet) => number | null) => { const v = sets.map(f).filter((x): x is number => x !== null && x !== undefined); return v.length ? Math.min(...v) : null; };
  if (type === 'strength') pts('Heaviest set', 'kg', sets => maxOf(sets, x => x.weight));
  if (type === 'bodyweight') {
    pts('Most reps in a set (bodyweight only)', 'reps', sets => maxOf(sets.filter(x => x.loadMode === 'none'), x => x.reps));
    pts('Heaviest added weight', 'kg', sets => maxOf(sets.filter(x => x.loadMode === 'added'), x => x.load));
    pts('Least assistance used', 'kg', sets => minOf(sets.filter(x => x.loadMode === 'assisted'), x => x.load), true);
  }
  if (type === 'cardio') {
    pts('Longest distance', 'km', sets => maxOf(sets, x => x.distanceKm));
    pts('Longest duration', 'min', sets => maxOf(sets, x => x.durationMin));
  }
  return out;
}
