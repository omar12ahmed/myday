// Tasks (Inbox → Tasks): every one-off task in one place, with an optional date and time, in your own lists if you
// like ("Moving house"). Separate from Today's repeating Learning / Admin / Health lists, which stay as they are.
//
// A task due today (or earlier) shows on Today, where one tap adds it to today's plan — only if there's room for your
// energy (1, 2 or 3 tasks). Once it's on the plan, ticking it off there marks it done here too (they're linked, not
// copied twice).
//
// Saved as a top-level `tasks` section (added by the new app in 1.5.0, like Notes; the classic MyDay keeps it unread).
// On this device only for now (not synced), and in "Export my data".
import { isDateKey, isDateTime, isTime, localStamp, shift, todayKey } from './dates';
import { limitFor, makeTask } from './plan';
import type { Category, DateKey, MyDayData, TaskItem, TasksData } from './types';
import { intIn, isObj, listOf, uid } from './util';

export const TASK_LIMITS = { lists: 30, listName: 40, title: 120, notes: 2000 };
export const emptyTasks = (): TasksData => ({ lists: [], items: [] });

export function normalizeTasks(raw: unknown, report: { dropped: number }): TasksData {
  if (!isObj(raw)) return emptyTasks();
  const out: TasksData = { ...raw, lists: [], items: [] };
  const seenL = new Set<string>();
  for (const l of listOf(raw.lists)) {
    if (!isObj(l) || typeof l.id !== 'string' || typeof l.name !== 'string' || !l.name.trim() || seenL.has(l.id)) { report.dropped++; continue; }
    seenL.add(l.id);
    out.lists.push({ ...l, id: l.id, name: l.name.slice(0, TASK_LIMITS.listName) });
  }
  const seenT = new Set<string>();
  for (const t of listOf(raw.items)) {
    if (!isObj(t) || typeof t.id !== 'string' || typeof t.title !== 'string' || !t.title.trim()) { report.dropped++; continue; }
    const now = localStamp();
    const item: TaskItem = {
      ...t,
      id: seenT.has(t.id) ? 'tk' + uid() : t.id,
      title: t.title.slice(0, TASK_LIMITS.title),
      listId: typeof t.listId === 'string' ? t.listId : '',
      category: (['learning', 'admin', 'health'] as const).includes(t.category as Category) ? (t.category as Category) : 'admin',
      minutes: intIn(t.minutes, 5, 600, 15),
      due: isDateKey(t.due) ? t.due : null,
      time: isDateKey(t.due) && isTime(t.time) ? t.time : null,
      notes: typeof t.notes === 'string' ? t.notes.slice(0, TASK_LIMITS.notes) : '',
      done: t.done === true,
      doneOn: t.done === true && isDateKey(t.doneOn) ? t.doneOn : null,
      plannedOn: isDateKey(t.plannedOn) && typeof t.planUid === 'string' ? t.plannedOn : null,
      planUid: isDateKey(t.plannedOn) && typeof t.planUid === 'string' ? t.planUid : null,
      createdAt: isDateTime(t.createdAt) ? t.createdAt : now,
    };
    seenT.add(item.id);
    out.items.push(item);
  }
  return out;
}

// ---------- Where a task stands ----------
// On a day's plan (linked): the plan's copy says whether it's done, and whether it was rolled to the queue.
function planCopy(data: MyDayData, t: TaskItem) {
  return t.plannedOn && t.planUid ? data.days[t.plannedOn]?.tasks.find(x => x.uid === t.planUid) ?? null : null;
}
export const isDone = (data: MyDayData, t: TaskItem) => t.done || !!planCopy(data, t)?.done;
export const onTodaysPlan = (data: MyDayData, t: TaskItem, k: DateKey = todayKey()) => t.plannedOn === k && !!planCopy(data, t);
// Rolled to the queue from a day's plan (the evening check-in): then it waits there, not here.
export const inQueue = (data: MyDayData, t: TaskItem) => !!planCopy(data, t)?.rolledQid;

export type Group = 'earlier' | 'today' | 'upcoming' | 'anytime' | 'done';
export const GROUP_LABEL: Record<Group, string> = { earlier: 'From earlier', today: 'Today', upcoming: 'Coming up', anytime: 'Any time', done: 'Done' };
export function groupOf(data: MyDayData, t: TaskItem, k: DateKey = todayKey()): Group {
  if (isDone(data, t)) return 'done';
  if (!t.due) return 'anytime';
  return t.due < k ? 'earlier' : t.due === k ? 'today' : 'upcoming';
}
// Earliest first (by date, then time, then when it was written); undated ones in the order you wrote them.
const order = (a: TaskItem, b: TaskItem) => (a.due ?? '9999') .localeCompare(b.due ?? '9999') || (a.time ?? '99').localeCompare(b.time ?? '99') || a.createdAt.localeCompare(b.createdAt);
export function tasksView(data: MyDayData, listId: string | null, query = '', k: DateKey = todayKey()): Record<Group, TaskItem[]> {
  const q = query.trim().toLowerCase();
  const out: Record<Group, TaskItem[]> = { earlier: [], today: [], upcoming: [], anytime: [], done: [] };
  const known = new Set(data.tasks.lists.map(l => l.id));
  for (const t of [...data.tasks.items].sort(order)) {
    if (listId !== null && (listId === '' ? known.has(t.listId) : t.listId !== listId)) continue;
    if (q && !t.title.toLowerCase().includes(q) && !t.notes.toLowerCase().includes(q)) continue;
    if (inQueue(data, t)) continue;
    out[groupOf(data, t, k)].push(t);
  }
  out.done.sort((a, b) => (b.doneOn ?? '').localeCompare(a.doneOn ?? ''));
  return out;
}
// Due today or earlier, not done, not already on today's plan: what Today offers to add.
export const dueForToday = (data: MyDayData, k: DateKey = todayKey()) =>
  data.tasks.items.filter(t => t.due && t.due <= k && !isDone(data, t) && !onTodaysPlan(data, t, k) && !inQueue(data, t)).sort(order);
export const listName = (d: TasksData, id: string) => d.lists.find(l => l.id === id)?.name ?? '';

// ---------- Changes (each used inside update()) ----------
export interface NewTask { title: string; listId?: string; category?: Category; minutes?: number; due?: DateKey | null; time?: string | null; notes?: string }
export function addTask(d: TasksData, n: NewTask): string | null {
  const title = n.title.trim().slice(0, TASK_LIMITS.title);
  if (!title) return null;
  const id = 'tk' + uid();
  const due = n.due && isDateKey(n.due) ? n.due : null;
  d.items.push({ id, title, listId: n.listId ?? '', category: n.category ?? 'admin', minutes: Math.max(5, Math.min(600, Math.round(n.minutes ?? 15))),
    due, time: due && n.time && isTime(n.time) ? n.time : null, notes: (n.notes ?? '').slice(0, TASK_LIMITS.notes), done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: localStamp() });
  return id;
}
export function editTask(d: TasksData, id: string, patch: Partial<Pick<TaskItem, 'title' | 'listId' | 'category' | 'minutes' | 'due' | 'time' | 'notes'>>): boolean {
  const t = d.items.find(x => x.id === id);
  if (!t) return false;
  const before = JSON.stringify(t);
  if (patch.title !== undefined) { const v = patch.title.trim().slice(0, TASK_LIMITS.title); if (v) t.title = v; }
  if (patch.listId !== undefined) t.listId = patch.listId;
  if (patch.category !== undefined) t.category = patch.category;
  if (patch.minutes !== undefined && Number.isFinite(patch.minutes)) t.minutes = Math.max(5, Math.min(600, Math.round(patch.minutes)));
  if (patch.notes !== undefined) t.notes = patch.notes.slice(0, TASK_LIMITS.notes);
  if (patch.due !== undefined) { t.due = patch.due && isDateKey(patch.due) ? patch.due : null; if (!t.due) t.time = null; }
  if (patch.time !== undefined) t.time = t.due && patch.time && isTime(patch.time) ? patch.time : null;
  return JSON.stringify(t) !== before;
}
// Done or not here — and on the plan too, if it's on one.
export function setTaskDone(data: MyDayData, id: string, done: boolean): boolean {
  const t = data.tasks.items.find(x => x.id === id);
  if (!t) return false;
  const copy = planCopy(data, t);
  if (copy) copy.done = done;
  if (t.done === done && (!copy || copy.done === done)) return !!copy;
  t.done = done;
  t.doneOn = done ? todayKey() : null;
  return true;
}
export function removeTask(d: TasksData, id: string): boolean {
  const i = d.items.findIndex(x => x.id === id);
  if (i < 0) return false;
  d.items.splice(i, 1);
  return true;
}
export function moveToTomorrow(d: TasksData, id: string): boolean { return editTask(d, id, { due: shift(todayKey(), 1) }); }

// Adding it to today's plan — only if there's room for today's energy (the same rule Today uses: 1, 2 or 3 tasks).
export function planRoom(data: MyDayData, k: DateKey = todayKey()): { built: boolean; rest: boolean; room: number; limit: number } {
  const day = data.days[k];
  if (!day || day.rest) return { built: !!day, rest: !!day?.rest, room: 0, limit: 0 };
  const limit = limitFor(day.energy);
  return { built: true, rest: false, room: Math.max(0, limit - day.tasks.length), limit };
}
export function addToTodaysPlan(data: MyDayData, id: string, k: DateKey = todayKey()): 'added' | 'full' | 'no-plan' | 'missing' {
  const t = data.tasks.items.find(x => x.id === id);
  if (!t) return 'missing';
  const r = planRoom(data, k);
  if (!r.built) return 'no-plan';
  if (r.room <= 0) return 'full';
  const pt = makeTask({ id: null, title: t.title, minutes: t.minutes }, t.category, null);
  if (t.due === k && t.time) {
    pt.scheduledStart = `${k}T${t.time}`;
    const [h, m] = t.time.split(':').map(Number), end = h * 60 + m + t.minutes;
    if (end < 24 * 60) pt.scheduledEnd = `${k}T${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`; else pt.scheduledStart = null;
  }
  data.days[k].tasks.push(pt);
  t.plannedOn = k; t.planUid = pt.uid;
  return 'added';
}

// ---------- Lists ----------
export function addList(d: TasksData, name: string): string | null {
  const clean = name.trim().slice(0, TASK_LIMITS.listName);
  if (!clean || d.lists.length >= TASK_LIMITS.lists || d.lists.some(l => l.name.toLowerCase() === clean.toLowerCase())) return null;
  const id = 'tl' + uid();
  d.lists.push({ id, name: clean });
  return id;
}
export function renameList(d: TasksData, id: string, name: string): boolean {
  const l = d.lists.find(x => x.id === id), clean = name.trim().slice(0, TASK_LIMITS.listName);
  if (!l || !clean || clean === l.name || d.lists.some(x => x.id !== id && x.name.toLowerCase() === clean.toLowerCase())) return false;
  l.name = clean;
  return true;
}
export function moveList(d: TasksData, id: string, dir: -1 | 1): boolean {
  const i = d.lists.findIndex(l => l.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= d.lists.length) return false;
  [d.lists[i], d.lists[j]] = [d.lists[j], d.lists[i]];
  return true;
}
// Removing a list never removes its tasks: they stay, with no list.
export function removeList(d: TasksData, id: string): { removed: boolean; moved: number } {
  const i = d.lists.findIndex(l => l.id === id);
  if (i < 0) return { removed: false, moved: 0 };
  d.lists.splice(i, 1);
  let moved = 0;
  for (const t of d.items) if (t.listId === id) { t.listId = ''; moved++; }
  return { removed: true, moved };
}
