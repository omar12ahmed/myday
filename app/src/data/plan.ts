// Choosing a day's tasks, the queue, and changes to a day's plan. Ported from the current MyDay
// (same rules, same names). Functions that change data take `data` — a draft copy that the store
// saves afterwards (see store.ts) — and change it in place, exactly like the current MyDay does.
import { localStamp, shift } from './dates';
import { CATS, uid } from './normalize';
import { studiedOn } from './study/sessions';
import type { Category, DateKey, Day, Energy, ListItem, MyDayData, QueueItem, Task } from './types';

// ---------- How much fits in a day ----------
// Energy 1–2 → one task, 3 → two, 4–5 → three.
export const limitFor = (energy: number | null) => ((energy ?? 0) <= 2 ? 1 : energy === 3 ? 2 : 3);

export const ENERGY_LABEL: Record<Energy, string> = { 1: 'Running on empty', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Great' };
export const CAT_LABEL: Record<Category | 'rest', string> = { learning: 'Learning', admin: 'Admin', health: 'Health', rest: 'Rest' };

// ---------- History ----------
const keysDesc = (data: MyDayData) => Object.keys(data.days).sort().reverse();

// The list items (by id) that were ticked off on day k.
export function doneIdsOn(data: MyDayData, k: DateKey): Set<string> {
  const d = data.days[k];
  return new Set(d ? d.tasks.filter(t => t.done && t.taskId).map(t => t.taskId as string) : []);
}

// A learning day: a learning task ticked on Today, or a finished Study session. Each day counts once.
export function learningDoneOn(data: MyDayData, k: DateKey): boolean {
  const d = data.days[k];
  return (!!d && d.tasks.some(t => t.category === 'learning' && t.done)) || studiedOn(data, k);
}

// How many times each list item has been ticked off, across all days.
export function sessionCounts(data: MyDayData): Record<string, number> {
  const c: Record<string, number> = {};
  for (const d of Object.values(data.days)) {
    for (const t of d.tasks) if (t.done && t.taskId) c[t.taskId] = (c[t.taskId] || 0) + 1;
  }
  return c;
}

function lastTaskId(data: MyDayData, cat: Category, pred: (t: Task) => boolean, beforeKey: DateKey): string | null {
  for (const k of keysDesc(data)) {
    if (k >= beforeKey) continue;
    const t = data.days[k].tasks.find(x => x.category === cat && pred(x));
    if (t) return t.taskId;
  }
  return null;
}

// Next item after `afterId`, wrapping round to the start, skipping anything in `exclude`.
function nextFrom(list: ListItem[], afterId: string | null, exclude: Set<string>): ListItem | null {
  if (!list || !list.length) return null;
  let i = list.findIndex(t => t.id === afterId);
  i = i < 0 ? 0 : i + 1;
  for (let n = 0; n < list.length; n++) {
    const t = list[(i + n) % list.length];
    if (!exclude.has(t.id)) return t;
  }
  return null;
}

// Learning follows the roadmap: the session after the last *completed* one (cycling after the last).
// Admin and health rotate: the one after the last *planned* one.
function freshPick(data: MyDayData, cat: Category, k: DateKey, exclude: Set<string>): ListItem | null {
  const after = cat === 'learning' ? lastTaskId(data, 'learning', t => t.done, k) : lastTaskId(data, cat, () => true, k);
  return nextFrom(data.lists[cat], after, exclude);
}

// ---------- Making tasks ----------
export function makeTask(src: { id: string | null; title: string; minutes: number }, cat: Category, fromQueue: QueueItem | null): Task {
  return {
    uid: uid(), taskId: src.id || null, category: cat, title: src.title,
    minutes: src.minutes, baseMinutes: src.minutes,
    done: false, shrunk: false, fromQueue: fromQueue ? { ...fromQueue } : null, rolledQid: null,
    scheduledStart: null, scheduledEnd: null,
  };
}
export const taskFromQueue = (q: QueueItem) => makeTask({ id: q.taskId, title: q.title, minutes: q.minutes }, q.category, q);
export function shrinkTask(t: Task) { t.minutes = Math.min(t.baseMinutes || 15, 15); t.shrunk = true; }

// e.g. "30 min", "just 15 min" or "20 min (shortened from 30)".
export function minutesLabel(minutes: number, base: number, shrunk: boolean): string {
  if (shrunk) return 'just 15 min';
  if (base && minutes < base) return `${minutes} min (shortened from ${base})`;
  return `${minutes} min`;
}

// ---------- Choosing tasks (nothing is saved here) ----------
function picker(data: MyDayData, k: DateKey) {
  const doneYesterday = doneIdsOn(data, shift(k, -1));
  const usedQ = new Set<string>();
  const chosen = new Set<string>();
  const blocked = () => new Set([...doneYesterday, ...chosen]);
  const queued = (cats: Category[]) => data.queue.find(q => cats.includes(q.category) && !usedQ.has(q.qid) && !blocked().has(q.taskId as string));
  const take = (t: Task | null) => {
    if (!t) return null;
    if (t.fromQueue) usedQ.add(t.fromQueue.qid);
    if (t.taskId) chosen.add(t.taskId);
    return t;
  };
  // Oldest eligible queued task in this category first, otherwise a fresh one.
  const slot = (cat: Category) => {
    const q = queued([cat]);
    if (q) return take(taskFromQueue(q));
    const f = freshPick(data, cat, k, blocked());
    return take(f ? makeTask(f, cat, null) : null);
  };
  return { doneYesterday, usedQ, chosen, queued, take, slot };
}

// The tasks to propose for day k at this energy: never more than the energy allows.
export function chooseTasks(data: MyDayData, k: DateKey, energy: number): Task[] {
  const P = picker(data, k);
  const shrink = data.nudge.shrinkOn === k;
  const n = limitFor(energy);
  let tasks: (Task | null)[] = [];
  if (n === 1) {
    let one = shrink ? P.slot('learning') : null;
    if (!one) {
      type Cand = { q?: QueueItem; f?: ListItem; cat?: Category; minutes: number };
      const cands: Cand[] = [];
      data.queue.forEach(q => { if (!P.doneYesterday.has(q.taskId as string)) cands.push({ q, minutes: q.minutes }); });
      CATS.forEach(cat => { const f = freshPick(data, cat, k, P.doneYesterday); if (f) cands.push({ f, cat, minutes: f.minutes }); });
      if (cands.length) {
        const best = cands.reduce((a, b) => (b.minutes < a.minutes ? b : a)); // ties keep the older queued task
        one = P.take(best.q ? taskFromQueue(best.q) : makeTask(best.f!, best.cat!, null));
      }
    }
    tasks = [one];
  } else {
    tasks.push(P.slot('learning'));
    if (n === 2) {
      // Second slot: a carried-over admin/health task if one is waiting, otherwise admin.
      const q = P.queued(['admin', 'health']);
      tasks.push(q ? P.take(taskFromQueue(q)) : P.slot('admin'));
    } else {
      tasks.push(P.slot('admin'), P.slot('health'));
    }
    // If a list was empty, fill the gap from the other categories without exceeding the limit.
    for (const cat of CATS) {
      if (tasks.filter(Boolean).length >= n) break;
      if (!tasks.some(t => t && t.category === cat)) tasks.push(P.slot(cat));
    }
  }
  const out = tasks.filter((t): t is Task => !!t).slice(0, n);
  if (shrink) out.forEach(t => { if (t.category === 'learning') shrinkTask(t); });
  return out;
}

// Extra tasks for a review when energy went up: one per category not already in the plan.
export function chooseAdditional(data: MyDayData, k: DateKey, existing: Task[], count: number): Task[] {
  const P = picker(data, k);
  existing.forEach(t => { if (t.taskId) P.chosen.add(t.taskId); if (t.fromQueue) P.usedQ.add(t.fromQueue.qid); });
  const out: Task[] = [];
  for (const cat of CATS) {
    if (out.length >= count) break;
    if (existing.some(t => t.category === cat)) continue;
    const t = P.slot(cat);
    if (t) out.push(t);
  }
  return out;
}

// A learning task to swap in today (oldest queued one first), taken out of the queue if it came from there.
export function learningForToday(data: MyDayData, k: DateKey, d: Day): Task | null {
  const doneY = doneIdsOn(data, shift(k, -1));
  const inPlan = new Set(d.tasks.map(t => t.taskId as string));
  const q = data.queue.find(x => x.category === 'learning' && !doneY.has(x.taskId as string) && !inPlan.has(x.taskId as string));
  if (q) { data.queue = data.queue.filter(x => x.qid !== q.qid); return taskFromQueue(q); }
  const f = freshPick(data, 'learning', k, new Set([...doneY, ...inPlan]));
  return f ? makeTask(f, 'learning', null) : null;
}

// ---------- The queue ----------
export function sortQueue(q: QueueItem[]) { q.sort((a, b) => (a.queuedOn < b.queuedOn ? -1 : a.queuedOn > b.queuedOn ? 1 : 0)); }

// Undo a task's effect on the queue: drop the entry it created, and return the entry it came from.
export function releaseTask(data: MyDayData, t: Task) {
  if (t.rolledQid) {
    data.queue = data.queue.filter(q => !(q.qid === t.rolledQid && q.sourceUid === t.uid));
    t.rolledQid = null;
  }
  const from = t.fromQueue;
  if (from && !data.queue.some(q => q.qid === from.qid || (q.taskId && q.taskId === from.taskId))) {
    data.queue.push({ ...from });
    sortQueue(data.queue);
  }
}

// Put a task in the queue for a later day (never twice).
export function queueTask(data: MyDayData, t: Task, k: DateKey) {
  if (t.taskId && data.queue.some(q => q.taskId === t.taskId)) return;
  data.queue.push({ qid: uid(), taskId: t.taskId, category: t.category, title: t.title, minutes: t.baseMinutes, queuedOn: k, sourceUid: null });
  sortQueue(data.queue);
}

export function sendToQueue(data: MyDayData, t: Task, k: DateKey) {
  const cameFromQueue = !!t.fromQueue;
  releaseTask(data, t);
  if (!cameFromQueue) queueTask(data, t, k);
}

// ---------- Changing a day ----------
export function makeRestDay(data: MyDayData, k: DateKey, energy: Energy | null) {
  const d = data.days[k];
  if (d) d.tasks.forEach(t => releaseTask(data, t));
  data.days[k] = { energy: energy || null, rest: true, builtAt: localStamp(), checkedIn: false, tasks: [] };
}

// Evening check-in: mark (or unmark) an open task to roll to tomorrow via the queue.
export function toggleRoll(data: MyDayData, dayKey: DateKey, t: Task) {
  if (t.done) return;
  if (t.rolledQid) {
    data.queue = data.queue.filter(q => !(q.qid === t.rolledQid && q.sourceUid === t.uid));
    t.rolledQid = null;
  } else {
    // Queue it once. If the same activity is already waiting, point at that entry instead of duplicating.
    const existing = data.queue.find(q => q.taskId && q.taskId === t.taskId);
    if (existing) t.rolledQid = existing.qid;
    else {
      const q: QueueItem = { qid: uid(), taskId: t.taskId, category: t.category, title: t.title, minutes: t.baseMinutes, queuedOn: dayKey, sourceUid: t.uid };
      data.queue.push(q);
      sortQueue(data.queue);
      t.rolledQid = q.qid;
    }
  }
}

// Tick a task off (or untick it). A ticked task no longer rolls forward.
export function setDone(data: MyDayData, t: Task, done: boolean) {
  t.done = done;
  if (done && t.rolledQid) {
    data.queue = data.queue.filter(q => !(q.qid === t.rolledQid && q.sourceUid === t.uid));
    t.rolledQid = null;
  }
}

// Find a task on a day's plan in the draft.
export const findTask = (data: MyDayData, dayKey: DateKey, taskUid: string) => data.days[dayKey]?.tasks.find(t => t.uid === taskUid) ?? null;
