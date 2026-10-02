// Which number boxes a set has, and their labels and steps (see SetFields.tsx).
import type { ExType, LoadMode, SetValues } from '../data/types';

export type Field = keyof SetValues | 'sets' | 'restSec';
export const LIMIT: Record<string, number> = { durationMin: 1440 };
export const STEP: Record<string, number> = { reps: 1, weight: 0.5, load: 0.5, durationMin: 1, distanceKm: 0.1, sets: 1, restSec: 15 };
// The label above each box. Added weight and assistance are both in kg, so the label says which.
export function fieldLabel(field: Field, loadMode: LoadMode): string {
  if (field === 'load') return loadMode === 'assisted' ? 'kg assist' : 'kg added';
  return { reps: 'Reps', weight: 'kg', durationMin: 'Min', distanceKm: 'km', sets: 'Sets', restSec: 'Rest s', loadMode: 'Load' }[field];
}
// Which boxes an exercise type has (after "Sets", in a template).
export function fieldsFor(type: ExType, loadMode: LoadMode): (keyof SetValues)[] {
  if (type === 'strength') return ['reps', 'weight'];
  if (type === 'bodyweight') return loadMode === 'none' ? ['reps', 'loadMode'] : ['reps', 'loadMode', 'load'];
  return ['durationMin', 'distanceKm'];
}

