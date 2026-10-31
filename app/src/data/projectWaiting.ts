// A whole project waiting on someone or something (specs/projects-project-waiting.md): whom or what, since when, and
// a day to check back (optional) — a waiting task's idea (1.50.0, data/tasks.ts) for the project as a whole. While it
// waits, MyDay doesn't call it quiet; from the check-back day Needs you says so, with "Chase it". Waiting isn't work on
// the project: its "updated" time and its place in Projects stay. Never sent to AI.
import { isDateKey, shortDate, todayKey } from './dates';
import { PROJECT_LIMITS, projectTasks } from './projects';
import { addTask, isDone } from './tasks';
import type { DateKey, MyDayData, Project, ProjectWaiting, TaskItem } from './types';

// Waiting while it isn't finished (an older release's "Mark as done" leaves a wait behind).
export const isProjectWaiting = (p: Project): p is Project & { waiting: ProjectWaiting } => !!p.waiting && p.status !== 'done';
// "Waiting on Priya · check back Wed 4 Nov" (the card and the List row).
export const waitLine = (w: ProjectWaiting) => `Waiting on ${w.on}${w.until ? ` · check back ${shortDate(w.until)}` : ''}`;
// From the check-back day on.
export const checkBackDue = (p: Project, k: DateKey = todayKey()) => isProjectWaiting(p) && !!p.waiting.until && p.waiting.until <= k;

// ---------- Changing it (each returns whether anything changed) ----------
// Who or what (trimmed; empty is refused), and the day to check back (optional). Starting keeps today as "since";
// changing keeps the first day. A finished project can't start waiting.
export function setProjectWaiting(d: MyDayData, id: string, on: string, until: DateKey | null, k: DateKey = todayKey()): boolean {
  const p = d.projects.items.find(x => x.id === id), who = on.trim().slice(0, PROJECT_LIMITS.waitingOn), by = until && isDateKey(until) ? until : null;
  if (!p || p.status === 'done' || !who || (p.waiting && p.waiting.on === who && (p.waiting.until ?? null) === by)) return false;
  p.waiting = { ...p.waiting, on: who, since: p.waiting?.since ?? k, until: by };
  return true;
}
// "Got it": no longer waiting.
export function stopProjectWaiting(d: MyDayData, id: string): boolean {
  const p = d.projects.items.find(x => x.id === id);
  if (!p?.waiting) return false;
  delete p.waiting;
  return true;
}

// ---------- Chase it ----------
// Its follow-up from "Chase it", while it's still to do.
export function projectChaseTask(data: MyDayData, p: Project): TaskItem | null {
  const c = p.waiting?.chaseTaskId ? data.tasks.items.find(x => x.id === p.waiting!.chaseTaskId) : null;
  return c && !isDone(data, c) && !c.letGoOn ? c : null;
}
// One 5-minute follow-up in the project, once per wait, on the day you choose (or none): "Chase: <the project>" — whom
// you're waiting on stays in the wait, which is never sent to AI, while a task's title can be. Returns its id,
// 'already' when the last one is still to do, or null.
export function chaseProject(data: MyDayData, id: string, due: DateKey | null = null): string | 'already' | null {
  const p = data.projects.items.find(x => x.id === id);
  if (!p || !isProjectWaiting(p)) return null;
  if (projectChaseTask(data, p)) return 'already';
  const nid = addTask(data.tasks, { title: `Chase: ${p.title}`, minutes: 5, due: due && isDateKey(due) ? due : null });
  if (!nid) return null;
  data.tasks.items.find(x => x.id === nid)!.projectId = p.id;
  p.waiting.chaseTaskId = nid;
  return nid;
}

// ---------- The nudge ----------
// When every open task in an active project is waiting and the project isn't: what to fill in (whom, when it's the
// same for every task, and the earliest expected day), and which set of waiting tasks it's about — offered once per set.
export interface WaitOffer { on: string; until: DateKey | null; sig: string }
export function waitOffer(data: MyDayData, p: Project, k: DateKey = todayKey()): WaitOffer | null {
  if (p.status !== 'active' || p.waiting) return null;
  const open = projectTasks(data, p).open;
  if (!open.length || !open.every(t => t.waiting)) return null;
  // (Whom matches whatever the capitals and spacing; a day already gone isn't one to check back on.)
  const said = (s: string) => s.replace(/\s+/g, ' ').trim(), whom = new Set(open.map(t => said(t.waiting!.on).toLowerCase()));
  const day = open.map(t => t.waiting!.until).filter((x): x is DateKey => isDateKey(x) && x >= k).sort()[0];
  return { on: whom.size === 1 ? said(open[0].waiting!.on) : '', until: day ?? null, sig: open.map(t => t.id).sort().join(' ') };
}
