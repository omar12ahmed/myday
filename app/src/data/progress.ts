// The rolling learning count, the "shrink it to 15 minutes" nudge, and the learning garden.
// Ported from the current MyDay (same rules and wording). Nothing here ever resets to zero:
// missed days and rest days simply slide out of the 7-day window.
import { dtToMin, minToDt, shift, todayKey } from './dates';
import { learningDoneOn, learningForToday, limitFor, releaseTask, shrinkTask } from './plan';
import { studyOnlySessions } from './studySessions';
import type { DateKey, MyDayData, Task } from './types';

// Learning done (true/false) for the 6 days before today and today, oldest first.
export function windowDays(data: MyDayData, k = todayKey()): boolean[] {
  const out: boolean[] = [];
  for (let i = 6; i >= 0; i--) out.push(learningDoneOn(data, shift(k, -i)));
  return out;
}

// The nudge appears when there's been no learning for a few days (never on a rest day, and only
// once there are three full days of history).
export function nudgeEligible(data: MyDayData, k: DateKey): boolean {
  if (!data.lists.learning.length) return false;
  if (data.createdOn > shift(k, -3)) return false;
  const d = data.days[k];
  if (d && d.rest) return false;
  if (learningDoneOn(data, k)) return false;
  if (d && d.tasks.some(t => t.category === 'learning' && t.shrunk)) return false;
  for (let i = 1; i <= 3; i++) if (learningDoneOn(data, shift(k, -i))) return false;
  return true;
}

// A shortened task keeps its start time and gets a new end time.
function retime(t: Task) {
  if (t.scheduledStart) t.scheduledEnd = minToDt(dtToMin(t.scheduledStart, t.scheduledStart.slice(0, 10)) + t.minutes, t.scheduledStart.slice(0, 10));
}

// "Yes, shrink it". Returns what happened: 'later' (applies when the day is built), 'shrunk',
// or 'choose' (no learning on today's plan: offer a swap instead).
export function acceptShrink(data: MyDayData, k: DateKey): 'later' | 'shrunk' | 'choose' {
  const d = data.days[k];
  if (!d) { data.nudge.shrinkOn = k; return 'later'; }
  const l = d.tasks.find(t => t.category === 'learning' && !t.done);
  if (l) { shrinkTask(l); retime(l); return 'shrunk'; }
  return 'choose';
}

// Swap a 15-minute learning task in for task `replaceUid` (or add it, if there's room).
// Returns whether the plan changed, and the message to show (if any).
export function swapInLearning(data: MyDayData, k: DateKey, replaceUid: string | null): { changed: boolean; message: string | null } {
  const d = data.days[k];
  const nothing = { changed: false, message: null };
  if (!d || d.rest) return nothing;
  const i = replaceUid ? d.tasks.findIndex(t => t.uid === replaceUid && !t.done) : -1;
  if (replaceUid && i < 0) return nothing;
  if (!replaceUid && d.tasks.length >= limitFor(d.energy)) return nothing;
  const lt = learningForToday(data, k, d);
  if (!lt) return { changed: false, message: "There isn't a learning task available right now." };
  shrinkTask(lt);
  if (i >= 0) {
    const old = d.tasks[i];
    lt.scheduledStart = old.scheduledStart; // take over the replaced task's time slot
    retime(lt);
    releaseTask(data, old);
    d.tasks.splice(i, 1, lt);
  } else d.tasks.unshift(lt);
  return { changed: true, message: 'Swapped in: 15 minutes of learning.' };
}

// Learning sessions so far: ticked learning tasks plus finished Study sessions (each counted once).
export function learningSessions(data: MyDayData): number {
  let n = 0;
  for (const d of Object.values(data.days)) for (const t of d.tasks) if (t.category === 'learning' && t.done) n++;
  return n + studyOnlySessions(data);
}
