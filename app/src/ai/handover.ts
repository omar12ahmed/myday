// "Plan my day" asked in Ask MyDay is handed over to Today's own "Help me adjust today" (it plans with your energy,
// calendar and MyDay's rules): what you typed waits here until that card opens, already filled in. Nothing is sent
// until you tap "Get a suggestion" there.
import type { DateKey, MyDayData } from '../data/types';
import { AI_MODE } from './request';

let pending: string | null = null;
const listeners = new Set<() => void>();

// Help me adjust today needs today's plan (and isn't offered on a rest day).
export const canAdjust = (data: MyDayData, k: DateKey) => AI_MODE !== 'off' && !!data.days[k] && !data.days[k].rest;

export function handOverToAdjust(text: string) {
  pending = text.trim();
  if (location.hash.replace('#', '') !== 'today') location.hash = 'today';
  for (const l of listeners) l();
}
export const hasAdjustNote = () => pending !== null;
export function takeAdjustNote(): string | null { const t = pending; pending = null; return t; }
export function onHandover(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }
