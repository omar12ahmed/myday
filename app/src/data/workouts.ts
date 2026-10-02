// Planned workouts, for Today's planning. Ported from the current MyDay (same rules).
// READ-ONLY: the Health section hasn't moved to the new app yet, so this file never changes
// workout data. It only works out which workouts have a set time, so tasks aren't suggested then.
import { dtToMin, isDateKey, isTime, minToDt, parseKey, shift } from './dates';
import { intIn, isObj, listOf } from './normalize';
import type { DateKey, DateTime, MyDayData } from './types';

interface Template { id: string; name: string; minutes: number; archived: boolean }
interface Plan { templateId: string; time: string | null; status: string }
interface Workouts {
  templates: Template[];
  planned: Record<DateKey, Plan>;
  schedule: { mode: string; weekdays: Record<number, string>; since: DateKey | null };
  finished: { date: DateKey; plannedDate: DateKey | null }[];
}
export interface WorkoutBlock { kind: 'workout'; title: string; start: DateTime; end: DateTime }

// The parts of the saved workout data Today needs, checked the same way as the current MyDay.
function readWorkouts(health: unknown): Workouts {
  const out: Workouts = { templates: [], planned: {}, schedule: { mode: 'off', weekdays: {}, since: null }, finished: [] };
  const w = isObj(health) && isObj(health.workout) ? health.workout : null;
  if (!w) return out;
  for (const t of listOf(w.templates)) {
    if (!isObj(t) || typeof t.id !== 'string' || !t.id || typeof t.name !== 'string' || !t.name.trim()) continue;
    out.templates.push({ id: t.id, name: t.name.trim().slice(0, 80), minutes: intIn(t.minutes, 5, 300, 45), archived: t.archived === true });
  }
  if (isObj(w.schedule)) {
    const s = w.schedule;
    out.schedule.mode = ['off', 'weekdays', 'sequence'].includes(s.mode as string) ? (s.mode as string) : 'off';
    if (isObj(s.weekdays)) for (const d of [1, 2, 3, 4, 5, 6, 0]) if (typeof s.weekdays[d] === 'string') out.schedule.weekdays[d] = s.weekdays[d] as string;
    out.schedule.since = isDateKey(s.since) ? s.since : null;
  }
  if (isObj(w.planned)) {
    for (const d of Object.keys(w.planned)) {
      const p = w.planned[d];
      if (!isDateKey(d) || !isObj(p) || typeof p.templateId !== 'string') continue;
      out.planned[d] = {
        templateId: p.templateId, time: isTime(p.time) ? p.time : null,
        status: ['planned', 'skipped', 'moved', 'continued'].includes(p.status as string) ? (p.status as string) : 'planned',
      };
    }
  }
  for (const s of listOf(w.sessions)) {
    if (!isObj(s) || typeof s.id !== 'string' || !isDateKey(s.date) || !Array.isArray(s.exercises)) continue;
    if (s.status === 'active') continue; // only finished sessions count as done
    out.finished.push({ date: s.date, plannedDate: isDateKey(s.plannedDate) ? s.plannedDate : null });
  }
  return out;
}

const templateById = (w: Workouts, id: string | undefined) => w.templates.find(t => t.id === id) || null;
const completedOn = (w: Workouts, d: DateKey) => w.finished.some(s => s.date === d || s.plannedDate === d);

// The workout planned for a date: an explicit plan, or the weekday schedule.
function sessionPlanFor(w: Workouts, d: DateKey): { templateId: string; time: string | null } | null {
  const p = w.planned[d];
  if (p) return p.status === 'planned' && templateById(w, p.templateId) ? { templateId: p.templateId, time: p.time } : null;
  if (w.schedule.mode === 'weekdays' && (!w.schedule.since || d >= w.schedule.since)) {
    const t = templateById(w, w.schedule.weekdays[parseKey(d).getDay()]);
    if (t && !t.archived) return { templateId: t.id, time: null };
  }
  return null;
}

// Planned workouts with a time, around day k. Same as workoutBlocks() in the current MyDay.
export function workoutBlocks(data: MyDayData, k: DateKey): WorkoutBlock[] {
  const w = readWorkouts(data.health), out: WorkoutBlock[] = [];
  for (const d of [shift(k, -1), k]) {
    const p = sessionPlanFor(w, d);
    if (!p || !p.time || completedOn(w, d)) continue;
    const t = templateById(w, p.templateId)!;
    const s = `${d}T${p.time}`;
    out.push({ kind: 'workout', title: `Workout: ${t.name}`, start: s, end: minToDt(dtToMin(s, d) + t.minutes, d) });
  }
  return out;
}
