import { shift } from './dates';
import { projectById } from './projects';
import { startingEasier } from './patterns/notice';
import { CATEGORIES } from './patterns/saved';
import { isStuck } from './tasks';
import type { DateKey, MyDayData, TaskItem } from './types';

// One attention budget for Today (specs/help-me-start.md §5; the owner's choices of 1 Nov 2026): the learning nudge, the
// "newly noticed" line and start offers share at most one unprompted offer a day — none for the rest of a day you said
// "Not now" to one, or the day after. Which one is today's, and your "Not now", are MyDay's own notes on this device
// (`nudge`, not synced, like the learning nudge's), so Today never writes your synced data by itself. Projects' Needs you
// and Worth a look are pages you open, so they aren't part of it.
export type OfferKind = 'start' | 'nudge' | 'noticed';
const ORDER: OfferKind[] = ['start', 'nudge', 'noticed']; // a task that keeps moving first, then learning, then what MyDay noticed
type Notes = MyDayData['nudge'];

// Today's offer, given which ones apply now; once one has been shown today, it's that one (while it still applies) or none.
export function todaysOffer(n: Notes, k: DateKey, can: Partial<Record<OfferKind, boolean>>): OfferKind | null {
  if (n.notNowOn === k || n.notNowOn === shift(k, -1)) return null;
  if (n.offerOn?.on === k) { const kind = n.offerOn.kind; return Object.hasOwn(can, kind) && can[kind as OfferKind] ? kind as OfferKind : null; }
  return ORDER.find(x => can[x]) ?? null;
}
// Noted when it's shown, so nothing else is offered today.
export function markOffer(n: Notes, k: DateKey, kind: OfferKind): boolean {
  if (n.offerOn?.on === k) return false;
  n.offerOn = { on: k, kind };
  return true;
}
// "Not now" to any of them: nothing more today, or tomorrow. Said to a start offer, that task is also left alone for a
// week (MyDay withdraws: it doesn't come back to the same task every few days).
export function sayNotNow(n: Notes, k: DateKey, taskId?: string): boolean {
  if (n.notNowOn === k && (!taskId || n.quiet?.some(q => q.taskId === taskId && q.on === k))) return false;
  n.notNowOn = k;
  if (taskId) n.quiet = [...(n.quiet ?? []).filter(q => q.taskId !== taskId && q.on > shift(k, -7)), { taskId, on: k }].slice(-20);
  return true;
}

// The task a start offer is about: one that keeps moving (isStuck: moved twice or more, or a week past its date, with
// nothing said about it in the last week), in an active project or none, and not one you said "Not now" to this week. The
// most moved first, then the oldest date. None while start offers are off.
export function startOfferTask(data: MyDayData, k: DateKey): TaskItem | null {
  if (data.patterns.prefs.startOffers === false) return null;
  const quiet = new Set((data.nudge.quiet ?? []).filter(q => q.on > shift(k, -7)).map(q => q.taskId));
  const easier = new Set(CATEGORIES.filter(c => startingEasier(data, c))); // help steps back for these (§6)
  const stuck = data.tasks.items.filter(t => isStuck(data, t, k) && !quiet.has(t.id) && !easier.has(t.category) && (!t.projectId || projectById(data, t.projectId)?.status === 'active'));
  return stuck.sort((a, b) => b.postponed - a.postponed || (a.due ?? '9999-12-31').localeCompare(b.due ?? '9999-12-31'))[0] ?? null;
}
