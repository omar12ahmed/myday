import { shortDate } from '../data/dates';
import type { DateKey, MyDayData } from '../data/types';
import { isObj, listOf } from '../data/util';
import { activeWorkout, completedOn, missedSession, sessionPlanFor, tplById } from '../data/workout/plans';
import { setsDone, setsTotal } from '../data/workout/sessions';

// What Today shows from Workout: a workout in progress, a missed one to decide about, or today's planned
// workout. Nothing is added to the day's task list, and nothing shows when nothing is waiting.
export function workoutReminders(data: MyDayData, k: DateKey) {
  const w = data.health.workout, cur = activeWorkout(w), items: { key: string; title: string; meta: string; href: string; link: string }[] = [];
  if (cur) items.push({ key: 'cur', title: 'Workout in progress', meta: `${cur.templateName} · ${setsDone(cur)} of ${setsTotal(cur)} sets`, href: '#health/workout/session', link: 'Resume' });
  else {
    const missed = missedSession(w, k);
    if (missed) items.push({ key: 'missed', title: tplById(w, missed.templateId)!.name, meta: `From ${shortDate(missed.date)} — move, skip or carry on?`, href: '#health/workout', link: 'Decide' });
    const p = sessionPlanFor(w, k);
    if (p && !completedOn(w, k)) { const t = tplById(w, p.templateId)!; items.push({ key: 'today', title: `Workout: ${t.name}`, meta: `About ${t.minutes} min${p.time ? ' · ' + p.time : ''}`, href: '#health/workout', link: 'Open' }); }
  }
  return items;
}

// Whether the current MyDay would show a Food reminder on Today (a recipe being cooked, or items left on
// the shopping list). Food hasn't moved, so this only reads it, to say plainly what isn't shown here.
export function foodWaiting(data: MyDayData): boolean {
  const f = data.health.food;
  if (!isObj(f)) return false;
  const cooking = isObj(f.cooking) && typeof f.cooking.recipeId === 'string' && isObj(f.recipes) && isObj(f.recipes[f.cooking.recipeId]);
  return cooking || listOf(f.shopping).some(x => isObj(x) && x.checked !== true);
}
