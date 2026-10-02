// Small helpers for showing a day's plan, ported from the current MyDay (same wording).
import { dtToMin, nowMin } from './dates';
import type { DateKey, Day, Task } from './types';

export function energyLine(d: Day): string {
  if (d.rest) return 'Rest day. Nothing is required, and nothing is lost.';
  const energy = d.energy ?? 0; // no energy recorded counts as low, as in the current MyDay
  if (energy <= 2) return 'Low-energy day — one small thing is plenty.';
  if (energy === 3) return 'Medium energy — two things, no rush.';
  return 'Good energy — three things, and stopping early is still fine.';
}

function minutesLabel(t: Task): string {
  if (t.shrunk) return 'just 15 min';
  if (t.baseMinutes && t.minutes < t.baseMinutes) return `${t.minutes} min (shortened from ${t.baseMinutes})`;
  return `${t.minutes} min`;
}

// A task's time, e.g. "09:00–09:30", or null for an "any time today" task.
export function taskTime(t: Task): string | null {
  return t.scheduledStart && t.scheduledEnd ? `${t.scheduledStart.slice(11)}–${t.scheduledEnd.slice(11)}` : null;
}

// The grey line under a task's title, e.g. "30 min · carried over".
// (The current MyDay puts the time at the start of this line; here it sits above the title.)
export function taskDetails(t: Task): string {
  return t.fromQueue ? `${minutesLabel(t)} · carried over` : minutesLabel(t);
}

// Tasks with a time first (in time order), then the "any time today" ones.
export function sortedTasks(d: Day): { timed: Task[]; untimed: Task[] } {
  const timed = d.tasks
    .filter(t => t.scheduledStart)
    .sort((a, b) => ((a.scheduledStart ?? '') < (b.scheduledStart ?? '') ? -1 : 1));
  return { timed, untimed: d.tasks.filter(t => !t.scheduledStart) };
}

// The task to show as "Up next" on day k: the first open timed task that isn't over yet, else the
// earliest open timed task, else any open task. Same rule as nextTask() in the current MyDay.
export function nextTask(k: DateKey, d: Day): Task | null {
  const open = d.tasks.filter(t => !t.done);
  const timed = sortedTasks(d).timed.filter(t => !t.done);
  const now = nowMin(k);
  const notOver = timed.find(t => t.scheduledStart !== null && dtToMin(t.scheduledStart, k) + t.minutes > now);
  return notOver ?? timed[0] ?? open[0] ?? null;
}

// A gentle note on how the day is going. Nothing until the first tick, so an untouched list doesn't feel like a score.
// `all` is true once everything is done (the wording is the current MyDay's "whole plan done" message).
export function progressNote(d: Day): { text: string; all: boolean } | null {
  const done = d.tasks.filter(t => t.done).length;
  if (d.rest || done === 0) return null;
  if (done === d.tasks.length) return { text: "That's the whole plan — lovely.", all: true };
  return { text: `${done} done so far`, all: false };
}
