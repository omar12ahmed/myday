import { shortDate } from '../data/dates';
import type { DateKey, MyDayData } from '../data/types';
import { getRecipe } from '../data/food/mealdb';
import { recipeSteps } from '../data/food/recipes';
import { activeWorkout, completedOn, missedSession, sessionPlanFor, tplById } from '../data/workout/plans';
import { setsDone, setsTotal } from '../data/workout/sessions';

// What Today shows from Health: a workout in progress, a missed one to decide about, or today's planned
// workout. Nothing is added to the day's task list, and nothing shows when nothing is waiting.
export function healthReminders(data: MyDayData, k: DateKey) {
  const w = data.health.workout, cur = activeWorkout(w), items: { key: string; title: string; meta: string; href: string; link: string }[] = [];
  if (cur) items.push({ key: 'cur', title: 'Workout in progress', meta: `${cur.templateName} · ${setsDone(cur)} of ${setsTotal(cur)} sets`, href: '#health/workout/session', link: 'Resume' });
  else {
    const missed = missedSession(w, k);
    if (missed) items.push({ key: 'missed', title: tplById(w, missed.templateId)!.name, meta: `From ${shortDate(missed.date)} — move, skip or carry on?`, href: '#health/workout', link: 'Decide' });
    const p = sessionPlanFor(w, k);
    if (p && !completedOn(w, k)) { const t = tplById(w, p.templateId)!; items.push({ key: 'today', title: `Workout: ${t.name}`, meta: `About ${t.minutes} min${p.time ? ' · ' + p.time : ''}`, href: '#health/workout', link: 'Open' }); }
  }
  const f = data.health.food, cooking = f.cooking && getRecipe(f, f.cooking.recipeId);
  if (f.cooking && cooking && f.recipes[f.cooking.recipeId]) items.push({ key: 'cook', title: `Cooking: ${cooking.title}`, meta: `Step ${f.cooking.step + 1} of ${Math.max(1, recipeSteps(cooking.instructions).length)}`, href: '#health/food/cook', link: 'Resume' });
  const toBuy = f.shopping.filter(x => !x.checked).length;
  if (toBuy) items.push({ key: 'shop', title: 'Shopping list', meta: `${toBuy} item${toBuy === 1 ? '' : 's'} to get`, href: '#health/food/shopping', link: 'Open' });
  return items;
}


