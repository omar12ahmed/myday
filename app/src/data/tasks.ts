// Tasks (Inbox → Tasks): every one-off task in one place, with an optional date and time, in your own lists if you
// like ("Moving house"). Separate from Today's repeating Learning / Admin / Health lists, which stay as they are.
//
// A task due today (or earlier) shows on Today, where one tap adds it to today's plan — only if there's room for your
// energy (1, 2 or 3 tasks). Once it's on the plan, ticking it off there marks it done here too (they're linked, not
// copied twice).
//
// Saved as a top-level `tasks` section (added by the new app in 1.5.0, like Notes; the classic MyDay keeps it unread).
// In "Export my data", and synced with your account (one record per task; see sync/records.ts).
//
// A task that keeps moving (its date moved later 3 times, or a week overdue) is "stuck": MyDay asks what's getting in
// the way — not to push harder, but to change the task so it's easier to start (see unstick). Your answers are kept
// on the task (`blockers`), and What MyDay has noticed looks for a pattern in them.
import { isDateKey, isDateTime, isTime, localStamp, parseKey, shift, todayKey } from './dates';
import { isWorkDay } from './patterns/notice';
import { taskLimit } from './patterns/adapt';
import { makeTask } from './plan';
import type { Blocker, Category, DateKey, MyDayData, TaskItem, TasksData, TaskStep, Waiting } from './types';
import { intIn, isObj, listOf, uid } from './util';

export const TASK_LIMITS = { lists: 30, listName: 40, title: 120, notes: 2000, blockers: 20, waitingOn: 120, steps: 30, step: 120, after: 10 };
const BLOCKERS: Blocker[] = ['big', 'start', 'boring', 'tired', 'info', 'notneeded', 'other'];
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
      postponed: intIn(t.postponed, 0, 999, 0),
      blockers: listOf(t.blockers).filter((b): b is { reason: Blocker; on: DateKey } => isObj(b) && BLOCKERS.includes(b.reason as Blocker) && isDateKey(b.on))
        .map(b => ({ ...b, reason: b.reason, on: b.on })).slice(-TASK_LIMITS.blockers),
      letGoOn: isDateKey(t.letGoOn) ? t.letGoOn : null,
    };
    if (typeof item.projectId !== 'string' || !item.projectId) delete item.projectId; // a project link (1.12.0), or none
    // Waiting on someone or something (1.50.0): kept when readable; a blank one is simply absent, a shape this
    // version can't read is counted. Anything a newer MyDay keeps beside it stays.
    const w = t.waiting, blankWait = w === null || (isObj(w) && typeof w.on === 'string' && !w.on.trim());
    if (isObj(w) && typeof w.on === 'string' && w.on.trim() && isDateKey(w.since)) item.waiting = { ...w, on: w.on.slice(0, TASK_LIMITS.waitingOn), since: w.since, until: isDateKey(w.until) ? w.until : null };
    else { if (w !== undefined && !blankWait) report.dropped++; delete item.waiting; }
    // Steps and "Waits for" (specs/projects-steps.md): kept when readable. A step without words is counted and left
    // out, a repeated id gets a new one, anything a newer MyDay keeps on a step stays. "Waits for" keeps task ids (never
    // its own) whatever they point at now: what they mean is read through waitsFor, so a task that arrives later from
    // another device still counts. An empty list is simply absent; a shape this version can't read is counted.
    if (t.steps !== undefined) {
      const steps: TaskStep[] = [], ids = new Set<string>();
      if (!Array.isArray(t.steps)) report.dropped++;
      for (const st of listOf(t.steps)) {
        if (!isObj(st) || typeof st.text !== 'string' || !st.text.trim() || steps.length >= TASK_LIMITS.steps) { report.dropped++; continue; }
        const sid = typeof st.id === 'string' && st.id && !ids.has(st.id) ? st.id : 'ts' + uid();
        ids.add(sid);
        steps.push({ ...st, id: sid, text: st.text.slice(0, TASK_LIMITS.step), done: st.done === true });
      }
      if (steps.length) item.steps = steps; else delete item.steps;
    }
    if (t.after !== undefined) {
      if (!Array.isArray(t.after)) report.dropped++;
      const after = [...new Set(listOf(t.after).filter((x): x is string => typeof x === 'string' && !!x && x !== item.id))].slice(0, TASK_LIMITS.after);
      if (after.length) item.after = after; else delete item.after;
    }
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
// Rolled to the queue from a day's plan (the evening check-in): then it waits there, not here — while the queue still
// has it (once taken onto a later plan the task follows it there; if it has gone from the queue, it's back here).
export const inQueue = (data: MyDayData, t: TaskItem) => {
  const qid = planCopy(data, t)?.rolledQid;
  return !!qid && data.queue.some(q => q.qid === qid);
};

export type Group = 'earlier' | 'today' | 'upcoming' | 'anytime' | 'done';
export const GROUP_LABEL: Record<Group, string> = { earlier: 'From earlier', today: 'Today', upcoming: 'Coming up', anytime: 'Any time', done: 'Done' };
export function groupOf(data: MyDayData, t: TaskItem, k: DateKey = todayKey()): Group {
  if (isDone(data, t) || t.letGoOn) return 'done';
  if (!t.due) return 'anytime';
  return t.due < k ? 'earlier' : t.due === k ? 'today' : 'upcoming';
}
// Earliest first (by date, then time, then when it was written); undated ones in the order you wrote them. Projects
// use the same order, so a project's next step agrees with Tasks and Coming up (1.54.0).
export const taskOrder = (a: TaskItem, b: TaskItem) => (a.due ?? '9999') .localeCompare(b.due ?? '9999') || (a.time ?? '99').localeCompare(b.time ?? '99') || a.createdAt.localeCompare(b.createdAt);
export function tasksView(data: MyDayData, listId: string | null, query = '', k: DateKey = todayKey()): Record<Group, TaskItem[]> {
  const q = query.trim().toLowerCase();
  const out: Record<Group, TaskItem[]> = { earlier: [], today: [], upcoming: [], anytime: [], done: [] };
  const known = new Set(data.tasks.lists.map(l => l.id));
  for (const t of [...data.tasks.items].sort(taskOrder)) {
    if (listId !== null && (listId === '' ? known.has(t.listId) : t.listId !== listId)) continue;
    if (q && !t.title.toLowerCase().includes(q) && !t.notes.toLowerCase().includes(q)) continue;
    if (inQueue(data, t)) continue;
    out[groupOf(data, t, k)].push(t);
  }
  out.done.sort((a, b) => (b.doneOn ?? b.letGoOn ?? '').localeCompare(a.doneOn ?? a.letGoOn ?? ''));
  return out;
}
// Due today or earlier, not done, not already on today's plan: what Today offers to add.
export const dueForToday = (data: MyDayData, k: DateKey = todayKey()) =>
  data.tasks.items.filter(t => t.due && t.due <= k && !isDone(data, t) && !t.letGoOn && !onTodaysPlan(data, t, k) && !inQueue(data, t)).sort(taskOrder);
export const listName = (d: TasksData, id: string) => d.lists.find(l => l.id === id)?.name ?? '';

// ---------- Changes (each used inside update()) ----------
export interface NewTask { title: string; listId?: string; category?: Category; minutes?: number; due?: DateKey | null; time?: string | null; notes?: string }
export function addTask(d: TasksData, n: NewTask): string | null {
  const title = n.title.trim().slice(0, TASK_LIMITS.title);
  if (!title) return null;
  const id = 'tk' + uid();
  const due = n.due && isDateKey(n.due) ? n.due : null;
  d.items.push({ id, title, listId: n.listId ?? '', category: n.category ?? 'admin', minutes: Math.max(5, Math.min(600, Math.round(n.minutes ?? 15))),
    due, time: due && n.time && isTime(n.time) ? n.time : null, notes: (n.notes ?? '').slice(0, TASK_LIMITS.notes), done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: localStamp(),
    postponed: 0, blockers: [], letGoOn: null });
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
  if (patch.due !== undefined) {
    const was = t.due;
    t.due = patch.due && isDateKey(patch.due) ? patch.due : null;
    if (!t.due) t.time = null;
    if (was && t.due && t.due > was) t.postponed++; // moved later: counted, so a task that keeps moving can be noticed
  }
  if (patch.time !== undefined) t.time = t.due && patch.time && isTime(patch.time) ? patch.time : null;
  return JSON.stringify(t) !== before;
}
// Rolled to the queue and then ticked off or let go here: its copy no longer waits there (as ticking it on the plan).
function dropRolled(data: MyDayData, t: TaskItem) {
  const copy = planCopy(data, t);
  if (!copy?.rolledQid) return;
  data.queue = data.queue.filter(q => !(q.qid === copy.rolledQid && q.sourceUid === copy.uid));
  copy.rolledQid = null;
}
// Done or not here — and on the plan too, if it's on one.
export function setTaskDone(data: MyDayData, id: string, done: boolean): boolean {
  const t = data.tasks.items.find(x => x.id === id);
  if (!t) return false;
  if (done) dropRolled(data, t);
  const copy = planCopy(data, t);
  if (copy) copy.done = done;
  if (t.done === done && !(!done && t.letGoOn) && (!copy || copy.done === done)) return !!copy;
  t.done = done;
  t.doneOn = done ? todayKey() : null;
  if (!done) t.letGoOn = null;
  return true;
}
export function removeTask(d: TasksData, id: string): boolean {
  const i = d.items.findIndex(x => x.id === id);
  if (i < 0) return false;
  d.items.splice(i, 1);
  forgetWaitsFor(d, id); // the tasks that waited for it don't any more
  return true;
}
export function moveToTomorrow(d: TasksData, id: string): boolean { return editTask(d, id, { due: shift(todayKey(), 1) }); }
// Moved to a later day while it's on today's plan: it comes off today's plan too, so the plan and the task agree —
// unless it's already ticked there or rolled to the queue. Earlier days' plans are history and stay as they were.
// Returns true when it came off.
export function leaveTodaysPlanIfLater(data: MyDayData, id: string, k: DateKey = todayKey()): boolean {
  const t = data.tasks.items.find(x => x.id === id), day = data.days[k];
  if (!t || t.plannedOn !== k || !t.due || t.due <= k) return false;
  const copy = planCopy(data, t);
  if (copy && (copy.done || copy.rolledQid)) return false;
  if (day && copy) day.tasks = day.tasks.filter(x => x !== copy);
  t.plannedOn = null; t.planUid = null;
  return true;
}

// Adding it to today's plan — only if there's room for today's energy (the same rule Today uses: 1, 2 or 3 tasks).
export function planRoom(data: MyDayData, k: DateKey = todayKey()): { built: boolean; rest: boolean; room: number; limit: number } {
  const day = data.days[k];
  if (!day || day.rest) return { built: !!day, rest: !!day?.rest, room: 0, limit: 0 };
  const limit = taskLimit(data, day.energy);
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

// ---------- A task that keeps moving ----------
// Stuck: moved later 3 times or more, or a week past its date — unless you said what's in the way in the last week.
export function isStuck(data: MyDayData, t: TaskItem, k: DateKey = todayKey()): boolean {
  if (isDone(data, t) || t.letGoOn || inQueue(data, t) || t.waiting || waitsFor(data, t).length) return false; // waiting isn't being stuck
  if (t.blockers.some(b => b.on > shift(k, -7))) return false;
  return t.postponed >= 3 || (!!t.due && t.due <= shift(k, -7));
}
// Your next day without work (from the Calendar), or the coming weekend if there's no rota.
export function nextDayOff(data: MyDayData, k: DateKey = todayKey()): { date: DateKey; label: string } {
  const rota = data.rota.patterns.length > 0;
  for (let i = 1; i <= 21; i++) {
    const d = shift(k, i), wd = parseKey(d).getDay();
    if (rota ? !isWorkDay(data, d) : wd === 0 || wd === 6) return { date: d, label: rota ? 'your next day off' : 'the weekend' };
  }
  return { date: shift(k, 1), label: 'tomorrow' };
}
export type Unstuck = { reason: Blocker; step?: string; need?: string };
// What each answer does — it changes the task so it's easier to start, never just "try again":
//   too big / don't know where to start → the first step (you write it) becomes its own 10-minute task for today,
//     and the whole task waits under Any time;
//   boring → a 10-minute version, today;  too tired → your next day off;  missing something → noted, Any time;
//   doesn't matter any more → let go (a decision, not a failure);  something else → just noted.
// Each answer is kept on the task (for What MyDay has noticed), and its count of moves starts again.
export function unstick(data: MyDayData, id: string, u: Unstuck, k: DateKey = todayKey()): string | null {
  const t = data.tasks.items.find(x => x.id === id);
  if (!t) return null;
  const step = (u.step ?? '').trim(), need = (u.need ?? '').trim();
  if ((u.reason === 'big' || u.reason === 'start') && !step) return null;
  t.blockers = [...t.blockers, { reason: u.reason, on: k }].slice(-TASK_LIMITS.blockers);
  t.postponed = 0;
  switch (u.reason) {
    case 'big': case 'start': {
      addTask(data.tasks, { title: step, listId: t.listId, category: t.category, minutes: 10, due: k });
      t.due = null; t.time = null;
      return `Added “${step.slice(0, TASK_LIMITS.title)}” for today (10 min). “${t.title}” waits under Any time.`;
    }
    case 'boring':
      t.minutes = 10; t.due = k; t.time = null;
      return 'Now 10 minutes, for today. Stopping after 10 minutes is fine.';
    case 'tired': {
      const off = nextDayOff(data, k);
      t.due = off.date; t.time = null;
      return `Moved to ${off.label}${leaveTodaysPlanIfLater(data, id, k) ? ', and off today\'s plan' : ''}.`;
    }
    case 'info':
      if (need) t.notes = `Needs: ${need}\n${t.notes}`.slice(0, TASK_LIMITS.notes);
      t.due = null; t.time = null;
      return 'Noted. It waits under Any time until you have what you need.';
    case 'notneeded':
      t.letGoOn = k;
      dropRolled(data, t);
      return 'Let go. Deciding something doesn\'t matter any more is useful too.';
    default:
      return 'Thanks — noted. Change its date whenever it suits.';
  }
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

// ---------- Waiting on someone or something (1.50.0) ----------
// Who or what (trimmed; empty is refused), and when you expect it (optional). Starting keeps today as "since";
// changing keeps the first day. Returns false when nothing changed.
export function setWaiting(d: TasksData, id: string, on: string, until: DateKey | null, k: DateKey = todayKey()): boolean {
  const t = d.items.find(x => x.id === id), who = on.trim().slice(0, TASK_LIMITS.waitingOn), by = until && isDateKey(until) ? until : null;
  if (!t || !who || (t.waiting && t.waiting.on === who && t.waiting.until === by)) return false;
  t.waiting = { ...t.waiting, on: who, since: t.waiting?.since ?? k, until: by };
  return true;
}
// "Got it": no longer waiting.
export function stopWaiting(d: TasksData, id: string): boolean {
  const t = d.items.find(x => x.id === id);
  if (!t?.waiting) return false;
  delete t.waiting;
  return true;
}
// Still waiting (on a task still to do): what the next step, Today and Worth a look go by.
export const isWaiting = (data: MyDayData, t: TaskItem): t is TaskItem & { waiting: Waiting } => !!t.waiting && !isDone(data, t) && !t.letGoOn;
// Its follow-up from "Chase it", while it's still to do.
export function chaseTask(data: MyDayData, t: TaskItem): TaskItem | null {
  const c = t.waiting?.chaseTaskId ? data.tasks.items.find(x => x.id === t.waiting!.chaseTaskId) : null;
  return c && !isDone(data, c) && !c.letGoOn ? c : null;
}
// "Chase it": one 5-minute follow-up in the same list and project, once per wait, on the day you choose (or none). Its
// title is "Chase: <the task>" — who you're waiting on stays in the wait, which is never sent to AI, while an ordinary
// task's title can be. Returns its id, 'already' when the last one is still to do, or null.
export function chaseWaiting(data: MyDayData, id: string, due: DateKey | null = null): string | 'already' | null {
  const t = data.tasks.items.find(x => x.id === id);
  if (!t?.waiting) return null;
  if (chaseTask(data, t)) return 'already';
  const nid = addTask(data.tasks, { title: `Chase: ${t.title}`, listId: t.listId, category: t.category, minutes: 5, due: due && isDateKey(due) ? due : null });
  if (!nid) return null;
  if (t.projectId) data.tasks.items.find(x => x.id === nid)!.projectId = t.projectId;
  t.waiting.chaseTaskId = nid;
  return nid;
}

// ---------- Steps inside a task (specs/projects-steps.md) ----------
// A short checklist on the task. The task stays the one thing you plan: steps are never scheduled on their own.
// "2 of 5 steps" under the title wherever the task is listed; nothing when it has none.
export const stepsText = (t: TaskItem) => (t.steps?.length ? `${t.steps.filter(x => x.done).length} of ${t.steps.length} step${t.steps.length === 1 ? '' : 's'}` : '');
// Every step ticked: the task's page offers to mark the task done — one tap, never by itself.
export const allStepsDone = (t: TaskItem) => !!t.steps?.length && t.steps.every(x => x.done);
const stepOf = (d: TasksData, id: string, stepId: string) => { const t = d.items.find(x => x.id === id); return { t, st: t?.steps?.find(x => x.id === stepId) }; };
// A new step at the end (words trimmed; up to 30). Returns its id, or null.
export function addStep(d: TasksData, id: string, text: string): string | null {
  const t = d.items.find(x => x.id === id), words = text.trim().slice(0, TASK_LIMITS.step);
  if (!t || !words || (t.steps?.length ?? 0) >= TASK_LIMITS.steps) return null;
  const sid = 'ts' + uid();
  t.steps = [...(t.steps ?? []), { id: sid, text: words, done: false }];
  return sid;
}
// New words for a step (empty words are refused: remove the step instead). Returns false when nothing changed.
export function editStep(d: TasksData, id: string, stepId: string, text: string): boolean {
  const { st } = stepOf(d, id, stepId), words = text.trim().slice(0, TASK_LIMITS.step);
  if (!st || !words || words === st.text) return false;
  st.text = words;
  return true;
}
export function tickStep(d: TasksData, id: string, stepId: string, done: boolean): boolean {
  const { st } = stepOf(d, id, stepId);
  if (!st || st.done === done) return false;
  st.done = done;
  return true;
}
// One place up (-1) or down (1).
export function moveStep(d: TasksData, id: string, stepId: string, dir: -1 | 1): boolean {
  const steps = d.items.find(x => x.id === id)?.steps, i = steps?.findIndex(x => x.id === stepId) ?? -1, j = i + dir;
  if (!steps || i < 0 || j < 0 || j >= steps.length) return false;
  [steps[i], steps[j]] = [steps[j], steps[i]];
  return true;
}
export function removeStep(d: TasksData, id: string, stepId: string): boolean {
  const t = d.items.find(x => x.id === id);
  if (!t?.steps?.some(x => x.id === stepId)) return false;
  t.steps = t.steps.filter(x => x.id !== stepId);
  if (!t.steps.length) delete t.steps;
  return true;
}

// ---------- "Waits for": the tasks of its project it can't start before ----------
// Until those are done (or let go) it isn't picked as its project's next step and says "Waits for: …"; you can still
// do it any time. Only tasks of the same project, never itself, at most 10, and never a circle.
//
// The tasks it still waits for, in the order chosen: in its project, still to do, and not waiting for it in turn
// (directly or further along — two devices could each add one half of a circle; then neither waits). One done, let
// go, deleted or moved to another project no longer counts.
export function waitsFor(data: MyDayData, t: TaskItem): TaskItem[] {
  if (!t.projectId || !t.after?.length) return [];
  const byId = new Map(data.tasks.items.map(x => [x.id, x]));
  return t.after.map(id => byId.get(id)).filter((x): x is TaskItem => !!x && x.id !== t.id && x.projectId === t.projectId && !isDone(data, x) && !x.letGoOn && !reaches(byId, x, t.id));
}
// Whether `from` waits for the task `target`, directly or further along (through tasks of its project).
function reaches(byId: Map<string, TaskItem>, from: TaskItem, target: string): boolean {
  const seen = new Set<string>([from.id]), stack = [from];
  while (stack.length) {
    for (const id of stack.pop()!.after ?? []) {
      if (id === target) return true;
      const y = byId.get(id);
      if (y && y.projectId === from.projectId && !seen.has(id)) { seen.add(id); stack.push(y); }
    }
  }
  return false;
}
// "Waits for: Order the boards", or "Waits for: Order the boards and 2 more"; nothing when it waits for none.
export function waitsForText(data: MyDayData, t: TaskItem): string {
  const w = waitsFor(data, t);
  return w.length ? `Waits for: ${w[0].title}${w.length > 1 ? ` and ${w.length - 1} more` : ''}` : '';
}
// What it may wait for (the choices on its page): its project's other tasks still to do that don't wait for it,
// directly or further along. In the order of Tasks.
export function waitChoices(data: MyDayData, t: TaskItem): TaskItem[] {
  if (!t.projectId) return [];
  const byId = new Map(data.tasks.items.map(x => [x.id, x]));
  return data.tasks.items.filter(x => x.id !== t.id && x.projectId === t.projectId && !isDone(data, x) && !x.letGoOn && !reaches(byId, x, t.id)).sort(taskOrder);
}
// Waits for `otherId` (on) or not (off). Adding takes only one of its choices, at most 10 ('full' past that); ids that
// point at nothing of its project any more are tidied away then. Returns false when nothing changed.
export function setWaitsFor(data: MyDayData, id: string, otherId: string, on: boolean): boolean | 'full' {
  const t = data.tasks.items.find(x => x.id === id);
  if (!t) return false;
  if (!on) {
    if (!t.after?.includes(otherId)) return false;
    t.after = t.after.filter(x => x !== otherId);
    if (!t.after.length) delete t.after;
    return true;
  }
  if (t.after?.includes(otherId) || !waitChoices(data, t).some(x => x.id === otherId)) return false;
  const mine = (t.after ?? []).filter(x => data.tasks.items.some(y => y.id === x && y.projectId === t.projectId));
  if (mine.length >= TASK_LIMITS.after) return 'full';
  t.after = [...mine, otherId];
  return true;
}
// A task gone (deleted) or moved out of the project: no task waits for it any more.
export function forgetWaitsFor(d: TasksData, id: string) {
  for (const x of d.items) if (x.after?.includes(id)) { x.after = x.after.filter(a => a !== id); if (!x.after.length) delete x.after; }
}
