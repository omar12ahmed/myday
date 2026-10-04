// What Today's dashboard counts, in plain numbers — never scores or percentages (MyDay doesn't grade you):
// today's plan as "2 of 3 done", and what you ticked off on each day of this week.
import { parseKey, shift } from './dates';
import type { DateKey, MyDayData } from './types';

// Today's plan: how many are done, of how many. (A rest day, or a day not built yet, has none.)
export function todayProgress(data: MyDayData, k: DateKey): { built: boolean; rest: boolean; done: number; total: number } {
  const d = data.days[k];
  if (!d) return { built: false, rest: false, done: 0, total: 0 };
  return { built: true, rest: d.rest, done: d.tasks.filter(t => t.done).length, total: d.tasks.length };
}

// Things ticked off on a day: that day's plan, plus tasks from Inbox → Tasks done that day that weren't on it
// (a task added to the plan counts once).
export function doneOn(data: MyDayData, day: DateKey): number {
  const plan = data.days[day]?.tasks.filter(t => t.done).length ?? 0;
  const tasks = data.tasks.items.filter(t => t.done && t.doneOn === day && t.plannedOn !== day).length;
  return plan + tasks;
}

// Monday to Sunday of the week that has day k.
export function thisWeek(data: MyDayData, k: DateKey): { day: DateKey; n: number; today: boolean; future: boolean }[] {
  const mon = shift(k, -((parseKey(k).getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const day = shift(mon, i); return { day, n: day > k ? 0 : doneOn(data, day), today: day === k, future: day > k }; });
}
