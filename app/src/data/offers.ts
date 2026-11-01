import { shift } from './dates';
import { isStuck } from './tasks';
import type { DateKey, MyDayData, PatternsData, TaskItem } from './types';

// One attention budget for Today (specs/help-me-start.md §5; the owner's choices of 1 Nov 2026): the learning nudge, the
// "newly noticed" line and start offers share at most one unprompted offer a day — none for the rest of a day you said
// "Not now" to one, or the day after. Which one is today's is kept with your preferences (synced), so it's the same one
// all day, on every device. Projects' Needs you and Worth a look are pages you open, so they aren't part of it.
export type OfferKind = 'start' | 'nudge' | 'noticed';
const ORDER: OfferKind[] = ['start', 'nudge', 'noticed']; // a task that keeps moving first, then learning, then what MyDay noticed

// Today's offer, given which ones apply now; once one has been shown today, it's that one (while it still applies) or none.
export function todaysOffer(p: PatternsData['prefs'], k: DateKey, can: Partial<Record<OfferKind, boolean>>): OfferKind | null {
  if (p.notNowOn === k || p.notNowOn === shift(k, -1)) return null;
  if (p.offerOn?.on === k) return can[p.offerOn.kind as OfferKind] ? p.offerOn.kind as OfferKind : null;
  return ORDER.find(x => can[x]) ?? null;
}
// Kept when it's shown, so nothing else is offered today.
export function markOffer(p: PatternsData['prefs'], k: DateKey, kind: OfferKind): boolean {
  if (p.offerOn?.on === k) return false;
  p.offerOn = { on: k, kind };
  return true;
}
// "Not now" to any of them: nothing more today, or tomorrow.
export function sayNotNow(p: PatternsData['prefs'], k: DateKey): boolean {
  if (p.notNowOn === k) return false;
  p.notNowOn = k;
  return true;
}

// The task a start offer is about: one that keeps moving (isStuck: moved twice or more, or a week past its date, with
// nothing said about it in the last week), the most moved first, then the oldest date. None while start offers are off.
export function startOfferTask(data: MyDayData, k: DateKey): TaskItem | null {
  if (data.patterns.prefs.startOffers === false) return null;
  const stuck = data.tasks.items.filter(t => isStuck(data, t, k));
  return stuck.sort((a, b) => b.postponed - a.postponed || (a.due ?? '9999-12-31').localeCompare(b.due ?? '9999-12-31'))[0] ?? null;
}
