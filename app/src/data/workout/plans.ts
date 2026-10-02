// Which workout is planned for which day, missed sessions (without a backlog), and the repeating
// sequence. Ported from the current MyDay — the rules are unchanged:
//   - A date's workout is an explicit plan for that date, or else the weekday schedule (from the day it
//     started). An explicit plan always wins, so one date can be changed without touching the schedule.
//   - Only the most recent missed session from the last 7 days is offered (Move, Skip, or Continue in a
//     sequence). Older ones quietly lapse, so nothing piles up.
import { dtToMin, minToDt, parseKey, shift, todayKey } from '../dates';
import type { DateKey, DateTime, MyDayData, WorkoutData, WorkoutSession, WorkoutTemplate } from '../types';

export const tplById = (w: WorkoutData, id: string | null | undefined): WorkoutTemplate | null => (id ? w.templates.find(t => t.id === id) || null : null);
export const exById = (w: WorkoutData, id: string | null | undefined) => (id ? w.exercises.find(e => e.id === id) || null : null);
export const activeWorkout = (w: WorkoutData): WorkoutSession | null => (w.activeId ? w.sessions.find(s => s.id === w.activeId) || null : null);
export const finishedSessions = (w: WorkoutData) => w.sessions.filter(s => s.status !== 'active');

// A workout was done for this date (on the day, or a session started from that date's plan).
export const completedOn = (w: WorkoutData, d: DateKey) => finishedSessions(w).some(s => s.date === d || s.plannedDate === d);

export interface PlanFor { templateId: string; time: string | null; explicit: boolean }
// The session planned for a date: an explicit plan, or the weekday schedule.
export function sessionPlanFor(w: WorkoutData, d: DateKey): PlanFor | null {
  const p = w.planned[d];
  if (p) return p.status === 'planned' && tplById(w, p.templateId) ? { templateId: p.templateId, time: p.time, explicit: true } : null;
  if (w.schedule.mode === 'weekdays' && (!w.schedule.since || d >= w.schedule.since)) {
    const t = tplById(w, w.schedule.weekdays[parseKey(d).getDay()]);
    if (t && !t.archived) return { templateId: t.id, time: null, explicit: false };
  }
  return null;
}
// Only the most recent missed session (last 7 days) is offered. Older ones quietly lapse — no backlog.
export function missedSession(w: WorkoutData, k: DateKey = todayKey()): (PlanFor & { date: DateKey }) | null {
  for (let i = 1; i <= 7; i++) {
    const d = shift(k, -i), handled = w.planned[d];
    if (handled && handled.status !== 'planned') return null; // already moved/skipped: nothing older is brought back
    const p = sessionPlanFor(w, d);
    if (p) return completedOn(w, d) ? null : { date: d, ...p };
    if (completedOn(w, d)) return null;
  }
  return null;
}
export const nextInSequence = (w: WorkoutData) => { const s = w.schedule; return s.sequence.length ? tplById(w, s.sequence[s.next % s.sequence.length]) : null; };
// After a session from the sequence (or "Continue with next session"), the next one comes up.
export function advanceSequence(w: WorkoutData, templateId: string | null) {
  const s = w.schedule;
  if (s.mode === 'sequence' && s.sequence.length && s.sequence[s.next % s.sequence.length] === templateId) s.next = (s.next + 1) % s.sequence.length;
}
// Planned sessions from today for `days` days, not yet done.
export function upcomingPlans(w: WorkoutData, days: number, k: DateKey = todayKey()): (PlanFor & { date: DateKey })[] {
  const out: (PlanFor & { date: DateKey })[] = [];
  for (let i = 0; i < days; i++) { const d = shift(k, i), p = sessionPlanFor(w, d); if (p && !completedOn(w, d)) out.push({ date: d, ...p }); }
  return out;
}

export interface WorkoutBlock { kind: 'workout'; title: string; start: DateTime; end: DateTime }
// Planned workouts with a time block that time on Today (around day k). Nothing goes on the task list.
export function workoutBlocks(data: MyDayData, k: DateKey): WorkoutBlock[] {
  const w = data.health.workout, out: WorkoutBlock[] = [];
  for (const d of [shift(k, -1), k]) {
    const p = sessionPlanFor(w, d);
    if (!p || !p.time || completedOn(w, d)) continue;
    const t = tplById(w, p.templateId)!, s = `${d}T${p.time}`;
    out.push({ kind: 'workout', title: `Workout: ${t.name}`, start: s, end: minToDt(dtToMin(s, d) + t.minutes, d) });
  }
  return out;
}
