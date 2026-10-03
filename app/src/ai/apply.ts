// Using a checked suggestion — only after you press "Use this plan" — through the same save path as
// "Review my plan" (applyProposal in data/proposal.ts), inside the store's checked save (updateSaved):
//   - only today's copy of a task changes (its minutes and time); the task list it came from and every past day
//     stay exactly as they were, and finished tasks are never touched;
//   - tasks left out wait in the queue, as with Review my plan (nothing is deleted);
//   - your energy rating is never changed;
//   - if today's plan, energy, sleep, shifts, appointments or settings changed since you asked, nothing is saved
//     ("stale"): ask again for a fresh suggestion.
// One step can be undone (undoAi) as long as nothing has changed since.
import { dtToMin, shift, todayKey } from '../data/dates';
import { makeRestDay } from '../data/plan';
import { applyProposal, type Proposal, type ProposalItem } from '../data/proposal';
import { blocksFor } from '../data/schedule';
import { catchUp, updateSaved } from '../data/storage';
import type { DateKey, Day, MyDayData, QueueItem } from '../data/types';
import type { CheckedProposal } from './validate';

// Everything a suggestion is based on. If any of it changes, the suggestion is stale.
export function planStamp(data: MyDayData, k: DateKey): string {
  const st = data.settings;
  return JSON.stringify({
    day: data.days[k] ?? null,
    context: [data.context[k] ?? null, data.context[shift(k, 1)] ?? null],
    blocks: blocksFor(data, k),
    settings: [st.earliestTime, st.latestTime, st.gapMinutes, st.bufferMinutes],
  });
}
const undoStamp = (data: MyDayData, k: DateKey) => planStamp(data, k) + JSON.stringify(data.queue);

// The suggestion as a "Review my plan" proposal: priorities stay today (with the suggested minutes and time),
// other open tasks wait in the queue, finished ones are kept exactly.
export function toReview(data: MyDayData, k: DateKey, p: CheckedProposal): Proposal {
  const d = data.days[k];
  const chosen = new Map(p.rest ? [] : p.priorities.map(x => [x.uid, x] as const));
  const items: ProposalItem[] = d.tasks.map(t => {
    const was = t.scheduledStart ? dtToMin(t.scheduledStart, k) : null;
    const base: ProposalItem = { uid: t.uid, task: structuredClone(t), isNew: false, done: t.done, status: 'today', start: was, minutes: t.minutes, anytime: false, reason: null, maxFit: null, note: null, orig: { start: was, minutes: t.minutes } };
    if (t.done) return base;
    const x = chosen.get(t.uid);
    if (x) return { ...base, start: x.start, minutes: x.minutes, anytime: x.start === null };
    return { ...base, status: 'later', start: null };
  });
  return { mode: 'review', dayKey: k, energy: d.energy as number, items, editing: false, touched: true, stale: false };
}

export interface Undo { k: DateKey; before: { day: Day; queue: QueueItem[] }; after: string }
export type ApplyResult = { ok: true; undo: Undo; message: string } | { ok: false; reason: 'stale' | 'not-saved' };

export function applyAi(k: DateKey, stamp: string, p: CheckedProposal): ApplyResult {
  catchUp(); // compare with the newest saved data (another tab, or a change synced from another device)
  let stale = false, undo: Undo | null = null, message = '';
  const r = updateSaved(draft => {
    const d = draft.days[k];
    if (k !== todayKey() || !d || planStamp(draft, k) !== stamp) { stale = true; return false; }
    const before = { day: structuredClone(d), queue: structuredClone(draft.queue) };
    if (p.rest && !d.rest && !d.tasks.some(t => t.done)) {
      makeRestDay(draft, k, d.energy); // anything carried over goes back to the queue
      message = "Rest day it is. Anything carried over is back in your queue.";
    } else {
      applyProposal(draft, toReview(draft, k, p));
      // The priorities first, in the suggested order (tasks with a time still show in time order).
      const rank = new Map(p.rest ? [] : p.priorities.map((x, i) => [x.uid, i] as const));
      const dd = draft.days[k];
      dd.tasks = dd.tasks.map((t, i) => ({ t, r: rank.has(t.uid) ? rank.get(t.uid)! : 100 + i })).sort((a, b) => a.r - b.r).map(x => x.t);
      message = p.rest ? 'The rest can wait in your queue — nothing more is needed today.' : 'Plan updated.';
    }
    undo = { k, before, after: undoStamp(draft, k) };
  });
  if (stale) return { ok: false, reason: 'stale' };
  if (r !== 'saved' || !undo) return { ok: false, reason: 'not-saved' };
  return { ok: true, undo, message };
}

// Put the plan back as it was before "Use this plan" — only if nothing has changed since.
// A newer change (here, in another tab, or synced from another device) is never undone: then Undo is refused.
export function undoAi(u: Undo): 'undone' | 'changed' | 'not-saved' {
  catchUp();
  let changed = false;
  const r = updateSaved(draft => {
    if (undoStamp(draft, u.k) !== u.after) { changed = true; return false; }
    draft.days[u.k] = structuredClone(u.before.day);
    draft.queue = structuredClone(u.before.queue);
  });
  return changed ? 'changed' : r === 'saved' ? 'undone' : 'not-saved';
}
export const canUndo = (data: MyDayData, u: Undo | null) => !!u && undoStamp(data, u.k) === u.after;
