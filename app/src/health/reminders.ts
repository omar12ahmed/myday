import { parseKey, shift, shortDate } from '../data/dates';
import { goalAndPlan } from '../data/goals';
import type { DateKey, MyDayData } from '../data/types';
import { getRecipe } from '../data/food/mealdb';
import { recipeSteps } from '../data/food/recipes';
import { activeWorkout, completedOn, finishedSessions, missedSession, sessionPlanFor, tplById } from '../data/workout/plans';
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
  // Your goal (new app only): this week's workouts against the plan, gently. Shown only once you've set a goal.
  const gp = goalAndPlan(data);
  if (gp) {
    const monday = shift(k, -((parseKey(k).getDay() + 6) % 7));
    const done = new Set(finishedSessions(w).filter(s => s.date >= monday && s.date <= k).map(s => s.date)).size;
    const n = gp.p.sessions;
    items.push({ key: 'goal', title: done >= n ? `This week's ${n} workout${n === 1 ? '' : 's'}: done` : `This week: ${done} of ${n} workouts`, meta: done >= n ? 'Your goal — nice work. Rest counts too.' : `Your goal: ${gp.p.focus.toLowerCase()}`, href: '#health/goal', link: 'Plan' });
  }
  return items;
}


