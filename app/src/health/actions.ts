// What Workout's buttons and fields do: each one changes saved data through the store (storage.ts
// update()), then moves to the right screen. Same behaviour, limits and messages as the current MyDay.
// Questions ("Finish now?") are asked by the screens before these are called.
import { isDateKey, isTime, localStamp, shortDate, todayKey } from '../data/dates';
import { getSnapshot, update } from '../data/storage';
import { toast } from '../data/toast';
import type { DateKey, ExType, LoadMode, SetValues, WorkoutData, WorkoutSession, WorkoutTemplate } from '../data/types';
import { intIn, numIn, uid } from '../data/util';
import { cleanSetValues, EX_TYPES, LOAD_MODES, newItem } from '../data/workout/common';
import { activeWorkout, advanceSequence, missedSession, sessionPlanFor, tplById } from '../data/workout/plans';
import { applyProposal, type ProposedSession } from '../data/workout/propose';
import { finishWorkout, prefillFrom, setsDone, setsTotal, startWorkout } from '../data/workout/sessions';
import { focusSoon } from '../study/focus';
import { go } from './route';

const W = () => getSnapshot().data.health.workout;
function withWorkout(fn: (w: WorkoutData) => void | false) { return update(d => fn(d.health.workout)); }
function withTemplate(id: string, fn: (t: WorkoutTemplate, w: WorkoutData) => void | false) {
  return withWorkout(w => { const t = tplById(w, id); if (!t) return false; return fn(t, w); });
}
const optNum = (v: unknown, lo: number, hi: number) => numIn(v, lo, hi, null);

// ---------- Workout templates and exercises ----------
export function newTemplate() {
  const t: WorkoutTemplate = { id: 't' + uid(), name: 'New workout', minutes: 45, archived: false, items: [] };
  withWorkout(w => { w.templates.push(t); });
  focusSoon('tplName:' + t.id);
  go('health/workout/template/' + t.id);
}
export function toggleArchiveTemplate(id: string) {
  let archived = false as boolean;
  if (!withTemplate(id, t => { t.archived = !t.archived; archived = t.archived; })) return;
  toast(archived ? 'Archived — its history is kept.' : 'Restored.');
  if (archived) go('health/workout');
}
// The name is saved as you type (an empty name keeps the old one).
export const setTemplateName = (id: string, text: string) => { const v = text.trim(); if (v) withTemplate(id, t => { t.name = v.slice(0, 80); }); };
export function setTemplateMinutes(id: string, el: HTMLInputElement) {
  withTemplate(id, t => { t.minutes = intIn(el.value, 5, 300, t.minutes); el.value = String(t.minutes); });
}
export const addItem = (tplId: string, exId: string) => withTemplate(tplId, (t, w) => { const ex = w.exercises.find(e => e.id === exId); if (!ex) return false; t.items.push(newItem(ex)); });
// Makes a new exercise (a name nobody else has) and adds it to the template. Returns a message if it can't.
export function createExercise(tplId: string, name: string, type: string): string | null {
  const n = name.trim();
  if (!n) return 'Please give the exercise a name.';
  if (W().exercises.some(e => e.name.toLowerCase() === n.toLowerCase())) return 'You already have an exercise with that name — pick it from the list above.';
  withWorkout(w => {
    const ex = { id: 'x' + uid(), name: n.slice(0, 80), type: EX_TYPES.includes(type as ExType) ? (type as ExType) : 'strength', archived: false };
    w.exercises.push(ex);
    const t = tplById(w, tplId);
    if (t) t.items.push(newItem(ex));
  });
  return null;
}
// A common exercise (reused if you already have one with that name).
export function addCommon(tplId: string, name: string, type: ExType) {
  withWorkout(w => {
    let ex = w.exercises.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (!ex) { ex = { id: 'x' + uid(), name, type, archived: false }; w.exercises.push(ex); }
    const t = tplById(w, tplId);
    if (t) t.items.push(newItem(ex));
  });
}
export const moveItem = (tplId: string, itemId: string, dir: number) => withTemplate(tplId, t => {
  const i = t.items.findIndex(x => x.id === itemId), j = i + dir;
  if (i < 0 || j < 0 || j >= t.items.length) return false;
  [t.items[i], t.items[j]] = [t.items[j], t.items[i]];
});
export const removeItem = (tplId: string, itemId: string) => withTemplate(tplId, t => { t.items = t.items.filter(x => x.id !== itemId); });
// A planned value in a template (saved when you finish with the field). Past workouts aren't affected:
// each one keeps its own copy of the plan.
export function setItemField(tplId: string, itemId: string, field: keyof SetValues | 'sets' | 'restSec', value: string, el?: HTMLInputElement) {
  withTemplate(tplId, t => {
    const it = t.items.find(x => x.id === itemId);
    if (!it) return false;
    if (field === 'loadMode') { it.loadMode = LOAD_MODES.includes(value as LoadMode) ? (value as LoadMode) : 'none'; if (it.loadMode === 'none') it.load = null; return; }
    if (field === 'sets') it.sets = intIn(value, 1, 20, it.sets);
    else if (field === 'restSec') it.restSec = intIn(value, 0, 900, it.restSec);
    else it[field] = optNum(value, 0, 1440);
    if (el && (field === 'sets' || field === 'restSec')) el.value = String(it[field]);
  });
}
export const toggleArchiveExercise = (id: string) => withWorkout(w => { const ex = w.exercises.find(e => e.id === id); if (!ex) return false; ex.archived = !ex.archived; });
export const setExerciseName = (id: string, text: string) => { const v = text.trim(); if (v) withWorkout(w => { const ex = w.exercises.find(e => e.id === id); if (!ex) return false; ex.name = v.slice(0, 80); }); };

// ---------- Logging a workout ----------
// Start (or go back to the one in progress — never a second session).
export function startWorkoutFrom(tplId: string, plannedDate: DateKey | null) {
  let ok = !!activeWorkout(W()) as boolean;
  if (!ok) withWorkout(w => { if (!startWorkout(w, tplId, plannedDate)) return false; ok = true; });
  if (ok) go('health/workout/session');
}
// A change to a logged session: the one in progress, or a finished one being corrected (marked as corrected).
function withSession(id: string, fn: (s: WorkoutSession, w: WorkoutData) => void | false) {
  return withWorkout(w => {
    const s = w.sessions.find(x => x.id === id);
    if (!s || fn(s, w) === false) return false;
    if (s.status !== 'active') s.editedAt = localStamp();
  });
}
// Tick (or untick) a set. With the rest timer on, ticking starts the rest countdown.
export function toggleSet(sessionId: string, exKey: string, i: number): boolean {
  let restStarted = false as boolean;
  withSession(sessionId, (s, w) => {
    const e = s.exercises.find(x => x.key === exKey), x = e && e.sets[i];
    if (!e || !x) return false;
    x.done = !x.done;
    if (s.status === 'active' && x.done && w.restTimer.enabled) { w.rest = { startedAt: Date.now(), durationSec: e.plan.restSec || w.restTimer.seconds }; restStarted = true; }
  });
  return restStarted;
}
// A typed result (saved as you type). Weight and assistance are both in kg, kept apart by `loadMode`.
export function setSetField(sessionId: string, exKey: string, i: number, field: keyof SetValues, value: string) {
  withSession(sessionId, s => {
    const x = s.exercises.find(e => e.key === exKey)?.sets[i];
    if (!x) return false;
    if (field === 'loadMode') { x.loadMode = LOAD_MODES.includes(value as LoadMode) ? (value as LoadMode) : 'none'; if (x.loadMode === 'none') x.load = null; }
    else x[field] = optNum(value, 0, field === 'durationMin' ? 1440 : 1000);
  });
}
export const addSet = (sessionId: string, exKey: string) => withSession(sessionId, s => {
  const e = s.exercises.find(x => x.key === exKey);
  if (!e) return false;
  e.sets.push({ ...cleanSetValues(e.sets[e.sets.length - 1] || e.plan), done: false });
});
export const removeLastSet = (sessionId: string, exKey: string) => withSession(sessionId, s => {
  const e = s.exercises.find(x => x.key === exKey);
  if (!e || !e.sets.length) return false;
  e.sets.pop();
});
export const prefill = (exKey: string, from: 'plan' | 'last') => withWorkout(w => { const s = activeWorkout(w); if (!s || !prefillFrom(w, s, exKey, from)) return false; });
export const skipRest = () => withWorkout(w => { if (!w.rest) return false; w.rest = null; });
export const setRestEnabled = (on: boolean) => withWorkout(w => { w.restTimer.enabled = on; if (!on) w.rest = null; });
// Finish: every set ticked → a full session; otherwise a shorter one (it still counts).
export function finishActive() {
  let result = null as 'done' | 'short' | null;
  withWorkout(w => { const s = activeWorkout(w); if (!s) return false; result = finishWorkout(w, s); });
  if (!result) return;
  toast(result === 'done' ? 'Workout saved — nice work.' : 'Shorter session saved — every bit counts.');
  go('health/workout');
}
export function activeProgress() { const s = activeWorkout(W()); return s ? { done: setsDone(s), total: setsTotal(s) } : null; }
// Cancel (only before any set is ticked): the session is removed, nothing is kept.
export function discardActive() {
  withWorkout(w => { const s = activeWorkout(w); if (!s || setsDone(s) > 0) return false; w.sessions = w.sessions.filter(x => x !== s); w.activeId = null; w.rest = null; });
  go('health/workout');
}
export function deleteSession(id: string) {
  withWorkout(w => { if (!w.sessions.some(s => s.id === id)) return false; w.sessions = w.sessions.filter(s => s.id !== id); });
  go('health/workout/history');
}

// ---------- A missed session: Move, Skip, or Continue (no backlog) ----------
export function moveMissed(to: string): boolean {
  const k = todayKey(), m = missedSession(W(), k);
  if (!m || !isDateKey(to) || to < k) { toast('Please choose today or a later date.'); return false; }
  withWorkout(w => {
    w.planned[m.date] = { templateId: m.templateId, time: null, status: 'moved', source: 'manual' };
    w.planned[to] = { templateId: m.templateId, time: null, status: 'planned', source: 'manual' };
  });
  toast(`Moved to ${shortDate(to)}.`);
  return true;
}
export function skipMissed() {
  const m = missedSession(W());
  if (!m) return;
  withWorkout(w => { w.planned[m.date] = { templateId: m.templateId, time: null, status: 'skipped', source: 'manual' }; });
  toast('Skipped — no catching up needed.');
}
export function continueMissed() {
  const m = missedSession(W());
  if (!m) return;
  withWorkout(w => { w.planned[m.date] = { templateId: m.templateId, time: null, status: 'continued', source: 'manual' }; advanceSequence(w, m.templateId); });
  toast('Carrying on with the next session.');
}

// ---------- Schedule ----------
export function setScheduleMode(mode: string) {
  withWorkout(w => {
    w.schedule.mode = mode === 'weekdays' || mode === 'sequence' ? mode : 'off';
    if (w.schedule.mode === 'weekdays') w.schedule.since = todayKey(); // earlier days are never treated as missed
  });
}
export const setWeekday = (dow: number, tplId: string) => withWorkout(w => { if (tplById(w, tplId)) w.schedule.weekdays[dow] = tplId; else delete w.schedule.weekdays[dow]; });
export function setRestDays(el: HTMLInputElement) { withWorkout(w => { w.schedule.restDays = intIn(el.value, 0, 6, 1); el.value = String(w.schedule.restDays); }); }
export const seqAdd = (tplId: string) => withWorkout(w => { if (!tplById(w, tplId)) return false; w.schedule.sequence.push(tplId); });
export const seqRemove = (i: number) => withWorkout(w => {
  const s = w.schedule;
  if (i < 0 || i >= s.sequence.length) return false;
  s.sequence.splice(i, 1);
  if (s.next >= s.sequence.length) s.next = 0; else if (i < s.next) s.next--;
});
export const seqNext = (i: number) => withWorkout(w => { w.schedule.next = i; });
export const planRemove = (date: DateKey) => withWorkout(w => { if (!w.planned[date]) return false; delete w.planned[date]; });
// Plans one session on a date (it replaces whatever was planned for that date; the screen says so first).
// With `from`, it's changing one planned session: the old date is cleared (or, if it came from the weekday
// schedule, marked as moved), and the template and the schedule are left as they are.
export function planSession(date: string, time: string, tplId: string, from: DateKey | null = null): boolean {
  if (!isDateKey(date) || !tplById(W(), tplId)) return false;
  withWorkout(w => {
    if (from && from !== date) {
      const orig = sessionPlanFor(w, from);
      if (w.planned[from]) delete w.planned[from];
      else if (orig) w.planned[from] = { templateId: orig.templateId, time: null, status: 'moved', source: 'manual' };
    }
    w.planned[date] = { templateId: tplId, time: isTime(time) ? time : null, status: 'planned', source: 'manual' };
  });
  toast(from ? `Changed — now ${shortDate(date)}${isTime(time) ? ' at ' + time : ''}.` : `Planned for ${shortDate(date)}.`);
  return true;
}
export function applyProposed(items: ProposedSession[]) {
  let n = 0;
  withWorkout(w => { n = applyProposal(w, items); if (!n) return false; });
  toast(`Added ${n} session${n === 1 ? '' : 's'} to your plan.`);
}
