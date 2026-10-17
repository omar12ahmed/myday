// What the Daily exercises buttons do (Today, and Health → Workout): each one changes saved data through
// the store (storage.ts update()). Tapping a set is quiet — the countdown on Today is the confirmation.
import { todayKey } from '../data/dates';
import { repsLeft } from '../data/health/daily';
import { getSnapshot, update } from '../data/storage';
import { toast } from '../data/toast';
import type { DailyData } from '../data/types';
import { intIn, uid } from '../data/util';

const D = () => getSnapshot().data.health.daily;
function withDaily(fn: (d: DailyData) => void | false) { return update(dr => fn(dr.health.daily)); }

// One tap = one set (or just what's left, if that's less than a set, so the day ends exactly on target).
export function tapSet(id: string) {
  withDaily(d => {
    const e = d.exercises.find(x => x.id === id && !x.archived);
    if (!e) return false;
    const k = todayKey(), left = repsLeft(e, d, k);
    if (left <= 0) return false;
    const day = (d.log[k] ??= {});
    day[id] = [...(day[id] ?? []), Math.min(e.set, left)];
  });
}

// Takes back the last set tapped today (a mis-tap).
export function undoTap(id: string) {
  let undone = false;
  withDaily(d => {
    const k = todayKey(), taps = d.log[k]?.[id];
    if (!taps?.length) return false;
    taps.pop();
    undone = true;
    if (!taps.length) {
      delete d.log[k][id];
      if (!Object.keys(d.log[k]).length) delete d.log[k];
    }
  });
  if (undone) toast('Set taken back.');
}

// Adds an exercise (a name nobody else has). Returns a message if it can't.
export function addDailyExercise(name: string, target: string, set: string): string | null {
  const n = name.trim();
  if (!n) return 'Please give the exercise a name.';
  if (D().exercises.some(e => e.name.toLowerCase() === n.toLowerCase())) return 'You already have an exercise with that name.';
  const t = intIn(target, 1, 1000, 0);
  if (!t) return 'Please give a daily target of at least 1 (like 150).';
  const s = Math.min(intIn(set, 1, 500, t), t);
  withDaily(d => { d.exercises.push({ id: 'd' + uid(), name: n.slice(0, 80), target: t, set: s, archived: false }); });
  toast(`${n} added — it starts counting today.`);
  return null;
}

// The − and + steppers: small steps under 10, steps of 5 above. The set size never passes the target;
// lowering the target below the set size brings the set size with it.
const stepOf = (cur: number) => (cur < 10 ? 1 : 5);
export function stepDaily(id: string, field: 'target' | 'set', dir: 1 | -1) {
  withDaily(d => {
    const e = d.exercises.find(x => x.id === id);
    if (!e) return false;
    const next = e[field] + stepOf(e[field]) * dir;
    if (field === 'target') e.target = Math.min(1000, Math.max(1, next));
    else e.set = Math.min(500, Math.max(1, next));
    if (e.set > e.target) e.set = e.target;
  });
}

export function toggleDailyArchived(id: string) {
  let archived = false;
  if (!withDaily(d => { const e = d.exercises.find(x => x.id === id); if (!e) return false; e.archived = !e.archived; archived = e.archived; })) return;
  toast(archived ? 'Archived — its history is kept.' : 'Restored.');
}
