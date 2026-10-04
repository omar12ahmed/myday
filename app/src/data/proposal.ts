// Proposals: a suggested plan that is only saved when you apply it. Ported from the current MyDay.
// A proposal lives in the Today screen's memory; nothing here touches saved data except applyProposal,
// which changes the draft passed to it.
import { dtToMin, localStamp, minToDt, todayKey } from './dates';
import { fitToPrefs, limitIsYours, taskLimit } from './patterns/adapt';
import { chooseAdditional, chooseTasks, queueTask, sendToQueue } from './plan';
import { contextFor, ensureContext, explainNoFit, freeSegments, subtract, type Segment } from './schedule';
import type { DateKey, MyDayData, Task } from './types';

export interface ProposalItem {
  uid: string;
  task: Task;
  isNew: boolean;            // not on the saved plan yet
  done: boolean;
  status: 'today' | 'later'; // later = wait in the queue
  start: number | null;      // minutes from midnight, or null for no time yet
  minutes: number;
  anytime: boolean;          // chosen to have no set time
  reason: string | null;     // why it couldn't be given a time
  maxFit: number | null;     // the longest it could be and still fit
  note: string | null;
  why: string | null;        // when your preferences changed it: what they're based on ("Why?")
  orig: { start: number | null; minutes: number } | null; // for a review: how it was
}

export interface Proposal {
  mode: 'build' | 'review';
  dayKey: DateKey;
  energy: number;
  items: ProposalItem[];
  editing: boolean;
  touched: boolean; // edited by hand
  stale: boolean;   // the day's context changed after it was edited
  fewer?: { note: string; why: string } | null; // fewer tasks than your energy allows, because you chose so
}

function itemFromTask(t: Task, isNew: boolean): ProposalItem {
  return { uid: t.uid, task: t, isNew, done: !!t.done, status: 'today', start: null, minutes: t.minutes, anytime: false, reason: null, maxFit: null, note: null, why: null, orig: null };
}

// Fill in times for items that don't have one yet, first-fit, in plan order.
export function placeItems(data: MyDayData, p: Proposal) {
  const k = p.dayKey, gap = data.settings.gapMinutes;
  const busy: Segment[] = [];
  for (const it of p.items) {
    if (it.status === 'today' && it.start !== null) busy.push({ start: it.start, end: it.start + it.minutes + (it.done ? 0 : gap) });
  }
  let free = freeSegments(data, k, busy);
  for (const it of p.items) {
    if (it.done || it.status !== 'today' || it.start !== null || it.anytime) { it.reason = null; it.maxFit = null; continue; }
    const seg = free.find(g => g.end - g.start >= it.minutes);
    if (seg) {
      it.start = seg.start;
      it.reason = null;
      it.maxFit = null;
      free = subtract(free, it.start, it.start + it.minutes + gap);
    } else {
      const longest = free.reduce<Segment | null>((a, g) => (!a || g.end - g.start > a.end - a.start ? g : a), null);
      const len = longest ? longest.end - longest.start : 0;
      it.reason = explainNoFit(data, k, it.minutes, longest);
      it.maxFit = len >= 10 ? Math.floor(len / 5) * 5 : null;
    }
  }
}

// "Build my day": tasks for this energy, with suggested times.
export function proposeBuild(data: MyDayData, k: DateKey, energy: number): Proposal {
  // Your preferences (a shorter length, fewer tasks) are applied here, in the open; without any it's unchanged.
  const fit = fitToPrefs(data, chooseTasks(data, k, energy), energy);
  const items = fit.tasks.map(t => { const it = itemFromTask(t, true); const n = fit.notes[t.uid]; if (n) { it.note = n.note; it.why = n.why; } return it; });
  const p: Proposal = { mode: 'build', dayKey: k, energy, items, editing: false, touched: false, stale: false, fewer: fit.fewer };
  placeItems(data, p);
  return p;
}

// "Review my plan": fit today's plan to the current energy and context.
export function proposeReview(data: MyDayData, k: DateKey): Proposal {
  const d = data.days[k];
  const energy = contextFor(data, k).energy || d.energy || 3;
  const limit = taskLimit(data, energy);
  const gap = data.settings.gapMinutes;
  const items = d.tasks.map(t => {
    const it = itemFromTask(structuredClone(t), false);
    it.orig = { start: t.scheduledStart ? dtToMin(t.scheduledStart, k) : null, minutes: t.minutes };
    it.start = it.orig.start;
    return it;
  });
  // Completed tasks are kept exactly; open ones fill the remaining room.
  let room = Math.max(0, limit - items.filter(i => i.done).length);
  for (const it of items) {
    if (it.done) continue;
    if (room > 0) { room--; continue; }
    it.status = 'later';
    it.start = null;
    it.note = limitIsYours(data, energy) ? `Today has room for ${limit} task${limit === 1 ? '' : 's'}, as you chose.` : `Your energy is ${energy} now, so today has room for ${limit} task${limit === 1 ? '' : 's'}.`;
  }
  if (room > 0) {
    for (const t of chooseAdditional(data, k, d.tasks, room)) {
      const it = itemFromTask(t, true);
      it.note = `your energy is ${energy} now`;
      items.push(it);
    }
  }
  const p: Proposal = { mode: 'review', dayKey: k, energy, items, editing: false, touched: false, stale: false };
  // Keep existing times that still fit; anything that no longer fits gets a new suggestion.
  const busy = items.filter(i => i.done && i.start !== null).map(i => ({ start: i.start as number, end: (i.start as number) + i.minutes }));
  const timed = items.filter(i => !i.done && i.status === 'today' && i.start !== null).sort((a, b) => (a.start as number) - (b.start as number));
  for (const it of timed) {
    const s = it.start as number;
    const fits = freeSegments(data, k, busy).some(g => g.start <= s && s + it.minutes <= g.end);
    if (fits) busy.push({ start: s, end: s + it.minutes + gap });
    else it.start = null;
  }
  placeItems(data, p);
  return p;
}

// How many things a review would change.
export function propChanges(p: Proposal): number {
  return p.items.filter(it => !it.done && (it.isNew
    ? it.status === 'today'
    : it.status === 'later' || it.start !== it.orig!.start || it.minutes !== it.orig!.minutes)).length;
}

function setTimes(t: Task, it: ProposalItem, k: DateKey) {
  if (it.start !== null && it.status === 'today') {
    t.scheduledStart = minToDt(it.start, k);
    t.scheduledEnd = minToDt(it.start + it.minutes, k);
  } else {
    t.scheduledStart = null;
    t.scheduledEnd = null;
  }
}

// Save a proposal into the draft. Returns whether anything changed, and the message to show.
export function applyProposal(data: MyDayData, proposal: Proposal): { changed: boolean; message: string } {
  const p = structuredClone(proposal);
  const k = p.dayKey;
  if (k !== todayKey()) return { changed: false, message: 'That proposal was for a different day, so nothing was changed.' };

  if (p.mode === 'build') {
    if (data.days[k]) return { changed: false, message: '' }; // never overwrite a saved plan
    const tasks: Task[] = [], usedQ = new Set<string>();
    for (const it of p.items) {
      const t = it.task;
      if (it.status === 'today') {
        t.minutes = it.minutes;
        setTimes(t, it, k);
        tasks.push(t);
        if (t.fromQueue) usedQ.add(t.fromQueue.qid);
      } else if (!t.fromQueue) {
        queueTask(data, t, k); // "Leave for later": wait in the queue (queued ones simply stay there)
      }
    }
    data.queue = data.queue.filter(q => !usedQ.has(q.qid));
    const energy = p.energy as 1 | 2 | 3 | 4 | 5;
    ensureContext(data, k).energy = energy;
    data.days[k] = tasks.length
      ? { energy, rest: false, builtAt: localStamp(), checkedIn: false, tasks }
      : { energy, rest: true, builtAt: localStamp(), checkedIn: false, tasks: [] };
    return { changed: true, message: 'Your day is ready.' };
  }

  const d = data.days[k];
  if (!d || d.rest) return { changed: false, message: '' };
  for (const it of p.items) {
    if (it.isNew) {
      const t = it.task;
      if (it.status === 'today') {
        t.minutes = it.minutes;
        setTimes(t, it, k);
        d.tasks.push(t);
        if (t.fromQueue) data.queue = data.queue.filter(q => q.qid !== t.fromQueue!.qid);
      } else if (!t.fromQueue) {
        queueTask(data, t, k);
      }
      continue;
    }
    const t = d.tasks.find(x => x.uid === it.uid);
    if (!t || t.done) continue; // completed tasks and their history are never touched
    if (it.status === 'later') {
      sendToQueue(data, t, k);
      d.tasks = d.tasks.filter(x => x !== t);
    } else {
      t.minutes = it.minutes;
      setTimes(t, it, k);
    }
  }
  d.energy = p.energy as 1 | 2 | 3 | 4 | 5;
  return { changed: true, message: 'Plan updated.' };
}
