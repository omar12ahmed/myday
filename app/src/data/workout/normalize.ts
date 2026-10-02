// Checks saved Health data. Workout is checked exactly as normalizeHealth() in the current MyDay checks
// it. Food hasn't moved to the new app yet, so it is kept exactly as saved (never checked or changed
// here), and so is anything else stored under Health.
import { isDateKey, isTime } from '../dates';
import { intIn, isObj, uid } from '../util';
import type { HealthData, SessionExercise, TemplateItem, WorkoutSession } from '../types';
import { cleanSetValues, emptyFood, emptyWorkout, EX_TYPES, WEEKDAYS } from './common';

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function cleanTemplateItem(o: unknown): TemplateItem | null {
  if (!isObj(o) || typeof o.exerciseId !== 'string') return null;
  return { id: typeof o.id === 'string' && o.id ? o.id : 'ti' + uid(), exerciseId: o.exerciseId, sets: intIn(o.sets, 1, 20, 3), restSec: intIn(o.restSec, 0, 900, 90), ...cleanSetValues(o) };
}
function cleanSession(o: unknown, report: { dropped: number }): WorkoutSession | null {
  if (!isObj(o) || typeof o.id !== 'string' || !isDateKey(o.date) || !Array.isArray(o.exercises)) { report.dropped++; return null; }
  const exercises: SessionExercise[] = [];
  for (const e of o.exercises) {
    if (!isObj(e) || !EX_TYPES.includes(e.type as never) || typeof e.name !== 'string') continue;
    const plan = isObj(e.plan) ? e.plan : null;
    exercises.push({
      key: typeof e.key === 'string' && e.key ? e.key : 'se' + uid(),
      exerciseId: typeof e.exerciseId === 'string' ? e.exerciseId : null,
      name: str(e.name, 80), type: e.type as SessionExercise['type'],
      plan: { sets: intIn(plan ? plan.sets : 0, 0, 20, 0), restSec: intIn(plan ? plan.restSec : 90, 0, 900, 90), ...cleanSetValues(e.plan) },
      prefill: e.prefill === 'last' ? 'last' : 'plan',
      sets: (Array.isArray(e.sets) ? e.sets : []).slice(0, 30).map(x => ({ ...cleanSetValues(x), done: isObj(x) && x.done === true })),
    });
  }
  return {
    id: o.id, date: o.date, templateId: typeof o.templateId === 'string' ? o.templateId : null, templateName: str(o.templateName, 80) || 'Workout',
    startedAt: str(o.startedAt, 20), finishedAt: typeof o.finishedAt === 'string' ? o.finishedAt : null,
    status: ['active', 'done', 'short'].includes(o.status as string) ? (o.status as WorkoutSession['status']) : 'done', plannedDate: isDateKey(o.plannedDate) ? o.plannedDate : null,
    editedAt: typeof o.editedAt === 'string' ? o.editedAt : null, exercises,
  };
}

export function normalizeHealth(raw: unknown, report: { dropped: number }): HealthData {
  // Absent (older data, or never opened) → empty Workout and Food, as the current MyDay does.
  if (!isObj(raw)) return { workout: emptyWorkout(), food: emptyFood() };
  const hw = emptyWorkout(), w = isObj(raw.workout) ? raw.workout : {};
  if (Array.isArray(w.exercises)) for (const e of w.exercises) {
    if (isObj(e) && typeof e.id === 'string' && e.id && str(e.name) && EX_TYPES.includes(e.type as never)) hw.exercises.push({ id: e.id, name: str(e.name, 80), type: e.type as never, archived: e.archived === true });
    else report.dropped++;
  }
  if (Array.isArray(w.templates)) for (const t of w.templates) {
    if (!isObj(t) || typeof t.id !== 'string' || !t.id || !str(t.name)) { report.dropped++; continue; }
    hw.templates.push({ id: t.id, name: str(t.name, 80), minutes: intIn(t.minutes, 5, 300, 45), archived: t.archived === true, items: (Array.isArray(t.items) ? t.items : []).map(cleanTemplateItem).filter((x): x is TemplateItem => !!x) });
  }
  if (isObj(w.schedule)) {
    const s = w.schedule;
    hw.schedule.mode = s.mode === 'weekdays' || s.mode === 'sequence' ? s.mode : 'off';
    if (isObj(s.weekdays)) for (const d of WEEKDAYS) if (typeof s.weekdays[d] === 'string') hw.schedule.weekdays[d] = s.weekdays[d] as string;
    if (Array.isArray(s.sequence)) hw.schedule.sequence = s.sequence.filter((x): x is string => typeof x === 'string').slice(0, 20);
    hw.schedule.next = intIn(s.next, 0, 19, 0);
    hw.schedule.restDays = intIn(s.restDays, 0, 6, 1);
    hw.schedule.since = isDateKey(s.since) ? s.since : null;
  }
  if (isObj(w.planned)) for (const d of Object.keys(w.planned)) {
    const p = w.planned[d];
    if (isDateKey(d) && isObj(p) && typeof p.templateId === 'string') {
      hw.planned[d] = {
        templateId: p.templateId, time: isTime(p.time) ? p.time : null,
        status: ['planned', 'skipped', 'moved', 'continued'].includes(p.status as string) ? (p.status as never) : 'planned',
        source: p.source === 'proposal' ? 'proposal' : 'manual',
      };
    } else report.dropped++;
  }
  if (Array.isArray(w.sessions)) for (const s of w.sessions) { const c = cleanSession(s, report); if (c) hw.sessions.push(c); }
  hw.sessions.sort((a, b) => (a.date + a.startedAt < b.date + b.startedAt ? -1 : 1));
  if (typeof w.activeId === 'string' && hw.sessions.some(s => s.id === w.activeId && s.status === 'active')) hw.activeId = w.activeId;
  if (isObj(w.restTimer)) hw.restTimer = { enabled: w.restTimer.enabled === true, seconds: intIn(w.restTimer.seconds, 10, 900, 90) };
  if (isObj(w.rest) && Number.isFinite(w.rest.startedAt) && Number.isInteger(w.rest.durationSec)) hw.rest = { startedAt: w.rest.startedAt as number, durationSec: w.rest.durationSec as number };
  // Everything else under Health (Food, and anything unknown) stays exactly as it was, in its place.
  const h: HealthData = { ...raw, workout: hw, food: 'food' in raw ? raw.food : emptyFood() };
  return h;
}
