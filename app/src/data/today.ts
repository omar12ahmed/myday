// Small helpers for showing a day's plan, ported from the current MyDay (same wording).
import { dtToMin, fmtDuration, nowMin, todayKey } from './dates';
import { limitFor, minutesLabel } from './plan';
import { conflictsFor, contextFor, freeSegments } from './schedule';
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

// One quiet line above today's plan, only when it helps: more still planned than the free time left today, more open
// tasks than your energy has room for, or a task due today on the plan (named as the one to start with). Never a
// score; worked out on the device from what's saved. Null when there's nothing worth saying.
export function daySummary(data: MyDayData, k: DateKey, d: Day): string | null {
  if (d.rest || k !== todayKey()) return null;
  const open = sortedTasks(d).timed.concat(sortedTasks(d).untimed).filter(t => !t.done);
  if (!open.length) return null;
  const now = nowMin(k);
  const planned = open.reduce((n, t) => n + t.minutes, 0);
  const doneBusy = d.tasks.filter(t => t.done && t.scheduledStart && t.scheduledEnd).map(t => ({ start: dtToMin(t.scheduledStart!, k), end: dtToMin(t.scheduledEnd!, k) }));
  const free = freeSegments(data, k, doneBusy).reduce((n, g) => n + Math.max(0, g.end - Math.max(g.start, now)), 0);
  // Room as "Review my plan" counts it: the energy limit, less what's done.
  const room = Math.max(0, limitFor(contextFor(data, k).energy || d.energy || null) - d.tasks.filter(t => t.done).length);
  const due = open.find(t => data.tasks.items.some(x => x.plannedOn === k && x.planUid === t.uid && !x.done && x.due === k));
  const tooLong = planned > free + 10, tooMany = open.length > room;
  if (!tooLong && !tooMany && !due) return null;
  const head = `About ${fmtDuration(planned)} planned · ${free >= 5 ? `${fmtDuration(Math.floor(free / 5) * 5)} free` : 'no free time left today'}`;
  if (due) return `${head} — first: ${due.title} (due today)`;
  const anyDone = d.tasks.some(t => t.done);
  if (tooMany) return room === 0 ? `${head} — that's today's energy used well; the rest can wait`
    : `${head} — your energy has room for ${['one', 'two', 'three'][Math.min(room, 3) - 1]}${anyDone ? ' more' : ''}; the rest can wait`;
  return `${head} — it's fine to leave something for tomorrow`;
}

