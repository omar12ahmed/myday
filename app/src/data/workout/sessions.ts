// Logging a workout: starting from a template, ticking sets, finishing (a shorter session counts too),
// and the optional rest timer. Ported from the current MyDay. Functions that change data take the
// workout part of a draft (see storage.ts update()).
//   - Each session keeps a snapshot of the plan, separate from what you actually did, so editing a
//     template later never changes past workouts.
//   - Values are prefilled from your last result (or the plan). MyDay never raises weights or sets
//     targets for you.
import { localStamp, todayKey } from '../dates';
import { uid } from '../util';
import type { DateKey, WorkoutData, WorkoutSession } from '../types';
import { cleanSetValues } from './common';
import { activeWorkout, advanceSequence, exById, finishedSessions, tplById } from './plans';

// Most recent finished session that has done sets for this exercise.
export function lastResultFor(w: WorkoutData, exerciseId: string | null, excludeId: string | null) {
  const list = finishedSessions(w);
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i];
    if (s.id === excludeId) continue;
    const e = s.exercises.find(x => x.exerciseId === exerciseId && x.sets.some(y => y.done));
    if (e) return { session: s, ex: e };
  }
  return null;
}
export const setsDone = (s: WorkoutSession) => s.exercises.reduce((a, e) => a + e.sets.filter(x => x.done).length, 0);
export const setsTotal = (s: WorkoutSession) => s.exercises.reduce((a, e) => a + e.sets.length, 0);

// Starts a workout from a template. If one is already in progress, that one is returned instead
// (so a double tap, or Start after a reload, never makes a second session).
export function startWorkout(w: WorkoutData, templateId: string, plannedDate: DateKey | null): WorkoutSession | null {
  const cur = activeWorkout(w);
  if (cur) return cur;
  const t = tplById(w, templateId);
  if (!t) return null;
  const s: WorkoutSession = { id: 'ws' + uid(), date: todayKey(), templateId: t.id, templateName: t.name, startedAt: localStamp(), finishedAt: null, status: 'active', plannedDate: plannedDate || null, editedAt: null, exercises: [] };
  for (const it of t.items) {
    const ex = exById(w, it.exerciseId);
    if (!ex) continue;
    const plan = { sets: it.sets, restSec: it.restSec, ...cleanSetValues(it) };
    const last = lastResultFor(w, ex.id, null);
    const lastDone = last ? last.ex.sets.filter(x => x.done) : [];
    const sets = [];
    for (let i = 0; i < it.sets; i++) sets.push({ ...cleanSetValues(lastDone.length ? lastDone[Math.min(i, lastDone.length - 1)] : plan), done: false });
    s.exercises.push({ key: 'se' + uid(), exerciseId: ex.id, name: ex.name, type: ex.type, plan, prefill: lastDone.length ? 'last' : 'plan', sets });
  }
  w.sessions.push(s);
  w.activeId = s.id;
  return s;
}
// Finishes the session: "done" if every set was ticked, otherwise "short" (it still counts).
export function finishWorkout(w: WorkoutData, s: WorkoutSession): 'done' | 'short' {
  const done = setsDone(s), total = setsTotal(s);
  s.status = done >= total && total > 0 ? 'done' : 'short';
  s.finishedAt = localStamp();
  w.activeId = null;
  w.rest = null;
  advanceSequence(w, s.templateId);
  return s.status;
}
// Refill the sets not yet done from the plan, or from last time's results.
export function prefillFrom(w: WorkoutData, s: WorkoutSession, key: string, from: 'plan' | 'last') {
  const e = s.exercises.find(x => x.key === key);
  if (!e) return false;
  const last = from === 'last' ? lastResultFor(w, e.exerciseId, s.id) : null, lastDone = last ? last.ex.sets.filter(x => x.done) : [];
  e.sets.forEach((x, i) => { if (!x.done) Object.assign(x, cleanSetValues(from === 'last' && lastDone.length ? lastDone[Math.min(i, lastDone.length - 1)] : e.plan)); });
  e.prefill = from === 'last' && lastDone.length ? 'last' : 'plan';
  return true;
}

// ---------- Rest timer (optional, by the clock, so it stays right while the phone sleeps) ----------
export const restRemaining = (w: WorkoutData) => (w.rest ? Math.max(0, w.rest.durationSec * 1000 - (Date.now() - w.rest.startedAt)) : 0);
