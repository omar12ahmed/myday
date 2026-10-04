// Using your preferences (see saved.ts) when MyDay suggests a plan. Only ever in the open: Build my day shows what was
// changed and why, and nothing is saved until you apply it — the same as before. Without preferences, plans are
// exactly as the classic MyDay makes them.
import { CAT_LABEL, limitFor } from '../plan';
import type { MyDayData, Task } from '../types';

// How many tasks a day has room for: your energy's limit (1, 2 or 3), or fewer if you chose a lower most.
export function taskLimit(data: MyDayData, energy: number | null): number {
  const n = limitFor(energy), m = data.patterns.prefs.maxTasks;
  return m ? Math.min(n, m.value) : n;
}
export const limitIsYours = (data: MyDayData, energy: number | null) => taskLimit(data, energy) < limitFor(energy);

export interface Fitted { tasks: Task[]; notes: Record<string, { note: string; why: string }>; fewer: { note: string; why: string } | null }

// Shorten tasks longer than your chosen length for their kind (keeping how long they were, so the plan shows
// "25 min (shortened from 60)"), and keep to your chosen most tasks a day. Changes the tasks passed in.
export function fitToPrefs(data: MyDayData, tasks: Task[], energy: number): Fitted {
  const out: Fitted = { tasks, notes: {}, fewer: null };
  const most = taskLimit(data, energy);
  if (tasks.length > most) {
    const m = data.patterns.prefs.maxTasks!;
    out.tasks = tasks.slice(0, most);
    out.fewer = { note: `${most} task${most === 1 ? '' : 's'} today, as you chose (your energy allows ${limitFor(energy)}).`, why: m.why };
  }
  for (const t of out.tasks) {
    const cap = data.patterns.prefs.maxMinutes[t.category];
    if (!cap || t.minutes <= cap.value) continue;
    t.minutes = cap.value;
    out.notes[t.uid] = { note: `Shortened to ${cap.value} min — your length for ${CAT_LABEL[t.category].toLowerCase()} tasks.`, why: cap.why };
  }
  return out;
}
