// Small helpers for showing a day's plan, ported from the current MyDay (same wording).
import { dtToMin, nowMin, todayKey } from './dates';
import { minutesLabel } from './plan';
import { conflictsFor } from './schedule';
import type { DateKey, Day, MyDayData, Task } from './types';

export function energyLine(d: Day): string {
  if (d.rest) return 'Rest day. Nothing is required, and nothing is lost.';
  const energy = d.energy ?? 0; // no energy recorded counts as low, as in the current MyDay
  if (energy <= 2) return 'Low-energy day — one small thing is plenty.';
  if (energy === 3) return 'Medium energy — two things, no rush.';
  return 'Good energy — three things, and stopping early is still fine.';
}

// A task's time, e.g. "09:00–09:30", or null for an "any time today" task.
export function taskTime(t: Task): string | null {
  return t.scheduledStart && t.scheduledEnd ? `${t.scheduledStart.slice(11)}–${t.scheduledEnd.slice(11)}` : null;
}

// The grey line under a task's title, e.g. "30 min · carried over".
// (The current MyDay puts the time at the start of this line; here it sits above the title.)
export function taskDetails(t: Task): string {
  const m = minutesLabel(t.minutes, t.baseMinutes, t.shrunk);
  return t.fromQueue ? `${m} · carried over` : m;
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

// The evening check-in's summary line (same wording as the current MyDay).
export function eveningSummary(d: Day): string {
  if (d.rest) return 'Rest day — resting was the plan, and that counts.';
  const n = d.tasks.length, done = d.tasks.filter(t => t.done).length;
  if (!n) return 'Nothing was planned.';
  if (done === n) return n === 1
    ? '1 of 1 done — that was the whole plan, and you did it.'
    : `${done} of ${n} done — that's the whole plan. Go easy on yourself tonight.`;
  if (done === 0) return `0 of ${n} done — some days are like that. Rolling it forward is exactly how this is supposed to work.`;
  return `${done} of ${n} done — rolling the rest forward is exactly how this is supposed to work.`;
}

// "Overlaps …" warnings for today's open timed tasks.
export function planWarnings(data: MyDayData, k: string, d: Day): Record<string, string> {
  const out: Record<string, string> = {};
  if (k !== todayKey()) return out;
  for (const t of d.tasks) {
    if (t.done || !t.scheduledStart) continue;
    const c = conflictsFor(data, k, dtToMin(t.scheduledStart, k), t.minutes, [], false);
    if (c.length) out[t.uid] = `${c[0]} — “Review my plan” can find a new time.`;
  }
  return out;
}
