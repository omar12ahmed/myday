// Projects: everything about one intention in one place — an idea, what you found out, notes, the decision, the tasks
// and appointments it turns into, and how far it has come. MyDay's progression gives every project a place to be:
//   capture → understand → organise → explore → decide → act → reflect
// and every project always has one next step (a task) — that next step is what reaches Today.
//
// Saved as a top-level `projects` section (added by the new app in 1.12.0, like Notes and Tasks; the classic MyDay
// keeps it unread). Notes and tasks say which project they belong to (`projectId`, absent when none); appointments are
// listed on the project (`commitmentIds`), so the Calendar's own records — shared with the classic MyDay — never change.
// Deleting a project never deletes its notes, tasks or appointments: they're just no longer linked to it.
// In "Export my data", and synced with your account (one record per project; see sync/records.ts).
import { isDateTime, localStamp, todayKey } from './dates';
import { isDone, onTodaysPlan } from './tasks';
import type { Commitment, DateKey, MyDayData, Note, Project, ProjectsData, ProjectStage, ProjectStatus, TaskItem } from './types';
import { isObj, listOf, uid } from './util';

export const PROJECT_LIMITS = { projects: 200, title: 120, summary: 4000, commitments: 200 };

export const STAGES: { id: ProjectStage; label: string; hint: string }[] = [
  { id: 'capture', label: 'Capture', hint: "It's out of your head and safe here." },
  { id: 'understand', label: 'Understand', hint: 'What is it, and why does it matter to you?' },
  { id: 'organise', label: 'Organise', hint: 'Gather the notes and pieces in one place.' },
  { id: 'explore', label: 'Explore', hint: 'Find out more: options, research, what it could look like.' },
  { id: 'decide', label: 'Decide', hint: 'Choose a way forward — it can change later.' },
  { id: 'act', label: 'Act', hint: 'Small steps, one at a time, on your days.' },
  { id: 'reflect', label: 'Reflect', hint: 'What happened, and what you learned.' },
];
const STAGE_IDS = STAGES.map(s => s.id);
const STATUSES: ProjectStatus[] = ['active', 'paused', 'done'];
export const STATUS_LABEL: Record<ProjectStatus, string> = { active: 'Active', paused: 'Paused', done: 'Done' };
export const stageOf = (id: ProjectStage) => STAGES.find(s => s.id === id)!;

export const emptyProjects = (): ProjectsData => ({ items: [] });

// Reading saved projects: anything unreadable is counted (never dropped silently); unknown fields are kept.
export function normalizeProjects(raw: unknown, report: { dropped: number }): ProjectsData {
  if (!isObj(raw)) return emptyProjects();
  const out: ProjectsData = { ...raw, items: [] };
  const seen = new Set<string>();
  for (const p of listOf(raw.items)) {
    if (!isObj(p) || typeof p.id !== 'string' || !p.id || typeof p.title !== 'string' || !p.title.trim()) { report.dropped++; continue; }
    const now = localStamp();
    const item: Project = {
      ...p,
      id: seen.has(p.id) ? 'pj' + uid() : p.id,
      title: p.title.slice(0, PROJECT_LIMITS.title),
      summary: typeof p.summary === 'string' ? p.summary.slice(0, PROJECT_LIMITS.summary) : '',
      stage: STAGE_IDS.includes(p.stage as ProjectStage) ? (p.stage as ProjectStage) : 'capture',
      status: STATUSES.includes(p.status as ProjectStatus) ? (p.status as ProjectStatus) : 'active',
      nextTaskId: typeof p.nextTaskId === 'string' && p.nextTaskId ? p.nextTaskId : null,
      commitmentIds: [...new Set(listOf(p.commitmentIds).filter((x): x is string => typeof x === 'string' && !!x))].slice(0, PROJECT_LIMITS.commitments),
      createdAt: isDateTime(p.createdAt) ? p.createdAt : now,
      updatedAt: isDateTime(p.updatedAt) ? p.updatedAt : isDateTime(p.createdAt) ? p.createdAt : now,
    };
    seen.add(item.id);
    out.items.push(item);
  }
  return out;
}

// ---------- Changes ----------
// A new project from a title (and, if you like, what it's about). Returns its id, or null if the title is empty.
export function addProject(d: MyDayData, title: string, summary = '', stage: ProjectStage = 'capture'): string | null {
  const t = title.trim().slice(0, PROJECT_LIMITS.title);
  if (!t || d.projects.items.length >= PROJECT_LIMITS.projects) return null;
  const id = 'pj' + uid(), now = localStamp();
  d.projects.items.unshift({ id, title: t, summary: summary.trim().slice(0, PROJECT_LIMITS.summary), stage, status: 'active', nextTaskId: null, commitmentIds: [], createdAt: now, updatedAt: now });
  return id;
}

const find = (d: MyDayData, id: string) => d.projects.items.find(p => p.id === id);
const touch = (p: Project) => { p.updatedAt = localStamp(); };

// Change a project's title, summary, stage or status. Returns false (nothing to save) when nothing changed.
export function editProject(d: MyDayData, id: string, patch: Partial<Pick<Project, 'title' | 'summary' | 'stage' | 'status'>>): boolean {
  const p = find(d, id);
  if (!p) return false;
  let changed = false;
  if (patch.title !== undefined) { const t = patch.title.trim().slice(0, PROJECT_LIMITS.title); if (t && t !== p.title) { p.title = t; changed = true; } }
  if (patch.summary !== undefined) { const s = patch.summary.slice(0, PROJECT_LIMITS.summary); if (s !== p.summary) { p.summary = s; changed = true; } }
  if (patch.stage && STAGE_IDS.includes(patch.stage) && patch.stage !== p.stage) { p.stage = patch.stage; changed = true; }
  if (patch.status && STATUSES.includes(patch.status) && patch.status !== p.status) { p.status = patch.status; changed = true; }
  if (changed) touch(p);
  return changed;
}

// Remove a project. Its notes, tasks and appointments stay — they just aren't linked to it any more.
export function deleteProject(d: MyDayData, id: string): boolean {
  const i = d.projects.items.findIndex(p => p.id === id);
  if (i < 0) return false;
  d.projects.items.splice(i, 1);
  for (const n of d.notes.items) if (n.projectId === id) delete n.projectId;
  for (const t of d.tasks.items) if (t.projectId === id) delete t.projectId;
  return true;
}

// Link (or, with null, unlink) a task or a note. Returns false when nothing changed.
export function linkTask(d: MyDayData, taskId: string, projectId: string | null): boolean {
  const t = d.tasks.items.find(x => x.id === taskId);
  if (!t || (t.projectId ?? null) === projectId || (projectId && !find(d, projectId))) return false;
  const was = t.projectId;
  if (projectId) t.projectId = projectId; else delete t.projectId;
  for (const id of [was, projectId]) { const p = id ? find(d, id) : null; if (p) { if (p.nextTaskId === taskId && id === was) p.nextTaskId = null; touch(p); } }
  return true;
}
// For a note it's your choice: a project you take it out of is one MyDay won't put it back in, one you put it in is
// fine again, and the link is yours (not "connected by MyDay" any more).
export function linkNote(d: MyDayData, noteId: string, projectId: string | null): boolean {
  const n = d.notes.items.find(x => x.id === noteId);
  if (!n || (n.projectId ?? null) === projectId || (projectId && !find(d, projectId))) return false;
  const was = n.projectId;
  const not = new Set(n.notProjects ?? []);
  if (was) not.add(was);
  if (projectId) not.delete(projectId);
  if (not.size) n.notProjects = [...not].slice(-50); else delete n.notProjects;
  delete n.linkedBy; delete n.linkWhy;
  if (projectId) n.projectId = projectId; else delete n.projectId;
  for (const id of [was, projectId]) { const p = id ? find(d, id) : null; if (p) touch(p); }
  return true;
}
export function linkAppointment(d: MyDayData, projectId: string, commitmentId: string): boolean {
  const p = find(d, projectId);
  if (!p || p.commitmentIds.includes(commitmentId) || p.commitmentIds.length >= PROJECT_LIMITS.commitments) return false;
  p.commitmentIds.push(commitmentId); touch(p);
  return true;
}
export function unlinkAppointment(d: MyDayData, projectId: string, commitmentId: string): boolean {
  const p = find(d, projectId);
  if (!p || !p.commitmentIds.includes(commitmentId)) return false;
  p.commitmentIds = p.commitmentIds.filter(x => x !== commitmentId); touch(p);
  return true;
}
// Choose the next step (a task of this project still to do), or null to let MyDay pick the first one to do.
export function setNextStep(d: MyDayData, projectId: string, taskId: string | null): boolean {
  const p = find(d, projectId);
  if (!p || p.nextTaskId === taskId) return false;
  if (taskId && !d.tasks.items.some(t => t.id === taskId && t.projectId === projectId)) return false;
  p.nextTaskId = taskId; touch(p);
  return true;
}

// ---------- Reading ----------
export const projectById = (data: MyDayData, id: string | undefined | null) => (id ? data.projects.items.find(p => p.id === id) ?? null : null);
// A task still to do: not done (here or on a day's plan) and not let go.
const toDo = (data: MyDayData, t: TaskItem) => !isDone(data, t) && !t.letGoOn;
// Tasks in the order they'd be done: dated ones first (earliest first, then by time), then the rest as added.
const byWhen = (a: TaskItem, b: TaskItem) => (a.due && b.due ? (a.due + (a.time ?? '')).localeCompare(b.due + (b.time ?? '')) : a.due ? -1 : b.due ? 1 : a.createdAt.localeCompare(b.createdAt));

export function projectTasks(data: MyDayData, p: Project) {
  const all = data.tasks.items.filter(t => t.projectId === p.id);
  return { open: all.filter(t => toDo(data, t)).sort(byWhen), done: all.filter(t => !toDo(data, t)) };
}
export function projectNotes(data: MyDayData, p: Project): Note[] {
  return data.notes.items.filter(n => n.projectId === p.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
// Its appointments that are still in the Calendar (one deleted there simply isn't shown), in time order.
export function projectAppointments(data: MyDayData, p: Project): Commitment[] {
  return data.commitments.filter(c => p.commitmentIds.includes(c.id)).sort((a, b) => a.start.localeCompare(b.start));
}
// The one next step: the task you chose (while it's still to do), otherwise the first one to do.
export function nextStep(data: MyDayData, p: Project): TaskItem | null {
  const { open } = projectTasks(data, p);
  return open.find(t => t.id === p.nextTaskId) ?? open[0] ?? null;
}
// What's coming up (today onwards): dated tasks still to do and appointments, in time order.
export function comingUp(data: MyDayData, p: Project, k: DateKey = todayKey()) {
  const tasks = projectTasks(data, p).open.filter(t => t.due && t.due >= k).map(t => ({ kind: 'task' as const, when: `${t.due}T${t.time ?? '99:99'}`, task: t }));
  const appts = projectAppointments(data, p).filter(c => c.end.slice(0, 10) >= k).map(c => ({ kind: 'appointment' as const, when: c.start, appt: c }));
  return [...tasks, ...appts].sort((a, b) => a.when.localeCompare(b.when));
}
// The latest change anywhere in the project (its own details, a note, a task), for "last worked on".
export function lastActivity(data: MyDayData, p: Project): string {
  let at = p.updatedAt;
  for (const n of data.notes.items) if (n.projectId === p.id && n.updatedAt > at) at = n.updatedAt;
  for (const t of data.tasks.items) if (t.projectId === p.id && t.createdAt > at) at = t.createdAt;
  return at;
}
// Projects in the order they're listed: active ones first (most recently worked on first), then paused, then done.
export function projectsInOrder(data: MyDayData, status: ProjectStatus): Project[] {
  return data.projects.items.filter(p => p.status === status).map(p => ({ p, at: lastActivity(data, p) })).sort((a, b) => b.at.localeCompare(a.at)).map(x => x.p);
}

// Next steps for Today: each active project's next step that isn't already on today's plan or due today (those are
// under "Due today" already). At most `max`, most recently worked-on projects first.
export function stepsForToday(data: MyDayData, k: DateKey = todayKey(), max = 3): { project: Project; task: TaskItem }[] {
  const out: { project: Project; task: TaskItem }[] = [];
  for (const p of projectsInOrder(data, 'active')) {
    const t = nextStep(data, p);
    if (!t || onTodaysPlan(data, t, k) || (t.due && t.due <= k)) continue;
    out.push({ project: p, task: t });
    if (out.length >= max) break;
  }
  return out;
}

// A project's title from the first line of what you captured, and the rest as what it's about.
export function projectFromText(text: string): { title: string; summary: string } {
  const lines = text.trim().split('\n');
  const first = lines[0].trim();
  const title = first.length > PROJECT_LIMITS.title ? first.slice(0, PROJECT_LIMITS.title - 1).trimEnd() + '…' : first;
  const summary = (first.length > PROJECT_LIMITS.title ? text.trim() : lines.slice(1).join('\n').trim());
  return { title, summary };
}
