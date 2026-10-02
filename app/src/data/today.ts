// Small helpers for showing a day's plan, ported from the current MyDay (same wording).
import type { Day, Task } from './types';

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

// The grey line under a task's title, e.g. "09:00–09:30 · 30 min · carried over".
export function taskMeta(t: Task): string {
  const bits: string[] = [];
  if (t.scheduledStart && t.scheduledEnd) bits.push(`${t.scheduledStart.slice(11)}–${t.scheduledEnd.slice(11)}`);
  bits.push(minutesLabel(t));
  if (t.fromQueue) bits.push('carried over');
  return bits.join(' · ');
}

// Tasks with a time first (in time order), then the "any time today" ones.
export function sortedTasks(d: Day): { timed: Task[]; untimed: Task[] } {
  const timed = d.tasks
    .filter(t => t.scheduledStart)
    .sort((a, b) => ((a.scheduledStart ?? '') < (b.scheduledStart ?? '') ? -1 : 1));
  return { timed, untimed: d.tasks.filter(t => !t.scheduledStart) };
}
