// The focus timer. It keeps time by the clock (not by counting ticks), so it stays right while the
// phone sleeps. Ported from the current MyDay.
import { pad, todayKey } from './dates';
import type { FocusTimer, MyDayData, Task } from './types';

// e.g. 125000 ms → "02:05", 3725000 → "1:02:05"
export function fmtClock(ms: number): string {
  const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(r);
}

export function timerRemainingMs(t: FocusTimer): number {
  const elapsed = t.accumulatedMs + (t.startedAt ? Date.now() - t.startedAt : 0);
  return Math.max(0, t.durationSec * 1000 - elapsed);
}

// The task the timer is for, if it's still on that day's plan.
export function timerTask(data: MyDayData): Task | null {
  const t = data.timer, d = t && data.days[t.dayKey];
  return d ? d.tasks.find(x => x.uid === t.uid) || null : null;
}

// The timer only belongs to an open task on today's plan; anything else should be cleared.
export function timerIsStale(data: MyDayData): boolean {
  const t = data.timer;
  if (!t) return false;
  const task = timerTask(data);
  return t.dayKey !== todayKey() || !task || task.done;
}

export function startTimer(data: MyDayData, taskUid: string, kind: 'focus' | 'start', minutes: number) {
  data.timer = { uid: taskUid, dayKey: todayKey(), kind, durationSec: Math.max(1, minutes) * 60, startedAt: Date.now(), accumulatedMs: 0, finished: false };
}
