// The Study roadmap: Stage → Course → Module → Section → Task. Ported from the current MyDay.
// Functions that change data take the study part of a draft (see storage.ts update()).
import { todayKey } from '../dates';
import { uid } from '../util';
import type { ListItem, StudyCourse, StudyData, StudyModule, StudySection, StudyStage, StudyTask } from '../types';
import { LEVELS, newConcept, STARTER_STAGES, type Level } from './common';

// ---------- Finding things in the outline ----------
type Entry<N> = { node: N; list: N[]; stage?: StudyStage; course?: StudyCourse; module?: StudyModule; section?: StudySection };
export interface StudyIndex {
  stage: Map<string, Entry<StudyStage>>;
  course: Map<string, Entry<StudyCourse> & { stage: StudyStage }>;
  module: Map<string, Entry<StudyModule> & { stage: StudyStage; course: StudyCourse }>;
  section: Map<string, Entry<StudySection> & { stage: StudyStage; course: StudyCourse; module: StudyModule }>;
  task: Map<string, Entry<StudyTask> & { stage: StudyStage; course: StudyCourse; module: StudyModule; section: StudySection }>;
  courseTasks: Map<string, StudyTask[]>;
}
// Every item with where it sits. Rebuilt when needed — the outline is small.
export function stIndex(st: StudyData): StudyIndex {
  const ix: StudyIndex = { stage: new Map(), course: new Map(), module: new Map(), section: new Map(), task: new Map(), courseTasks: new Map() };
  for (const sg of st.stages) {
    ix.stage.set(sg.id, { node: sg, list: st.stages });
    for (const c of sg.courses) {
      const tasks: StudyTask[] = [];
      ix.course.set(c.id, { node: c, stage: sg, list: sg.courses });
      for (const m of c.modules) {
        ix.module.set(m.id, { node: m, course: c, stage: sg, list: c.modules });
        for (const s of m.sections) {
          ix.section.set(s.id, { node: s, module: m, course: c, stage: sg, list: m.sections });
          for (const t of s.tasks) { ix.task.set(t.id, { node: t, section: s, module: m, course: c, stage: sg, list: s.tasks }); tasks.push(t); }
        }
      }
      ix.courseTasks.set(c.id, tasks);
    }
  }
  return ix;
}
export type Found = { level: Level; node: { id: string; title: string }; list: { id: string }[]; stage?: StudyStage; course?: StudyCourse; module?: StudyModule; section?: StudySection };
export function stFind(ix: StudyIndex, id: string): Found | null {
  for (const level of LEVELS) { const e = ix[level].get(id); if (e) return { level, ...(e as unknown as Omit<Found, 'level'>) }; }
  return null;
}
export const CHILDREN: Record<Exclude<Level, 'task'>, 'courses' | 'modules' | 'sections' | 'tasks'> = { stage: 'courses', course: 'modules', module: 'sections', section: 'tasks' };
// All tasks inside an item (an item at the "task" level is just itself).
export function tasksUnder(level: Level, n: unknown): StudyTask[] {
  if (level === 'task') return [n as StudyTask];
  if (level === 'section') return (n as StudySection).tasks;
  const next = LEVELS[LEVELS.indexOf(level) + 1];
  const kids = (n as Record<string, unknown[]>)[CHILDREN[level]];
  return kids.flatMap(x => tasksUnder(next, x));
}

// ---------- Completion: tasks marked complete ÷ tasks added ----------
// Rounded down, so 100% only when every task is done. It isn't a measure of mastery.
export function completion(tasks: StudyTask[]) {
  const total = tasks.length, done = tasks.filter(t => t.done).length;
  return { total, done, pct: total ? Math.floor((done / total) * 100) : null };
}
export const completionText = (c: ReturnType<typeof completion>) => (c.total ? `${c.done} of ${c.total} task${c.total === 1 ? '' : 's'} complete (${c.pct}%)` : 'No tasks added yet');

// The course on the dashboard: the one you chose, otherwise the first with work left.
export function focusCourse(st: StudyData, ix: StudyIndex): StudyCourse | null {
  const chosen = st.focusCourseId ? ix.course.get(st.focusCourseId) : null;
  if (chosen && !chosen.node.archived) return chosen.node;
  const live = [...ix.course.values()].map(e => e.node).filter(c => !c.archived);
  return live.find(c => ix.courseTasks.get(c.id)!.some(t => !t.done)) || live[0] || null;
}
export const nextTaskIn = (ix: StudyIndex, c: StudyCourse) => ix.courseTasks.get(c.id)!.find(t => !t.done) || null;
export const taskPath = (ix: StudyIndex, id: string) => { const e = ix.task.get(id); return e ? `${e.stage.title} › ${e.module.title} › ${e.section.title}` : ''; };

// ---------- First-time setup (a proposal: nothing is saved until you choose) ----------
export interface SetupRow { listId: string; title: string; minutes: number; stage: string; keep: boolean }
// A first guess at a stage from the item's own title. You can change each one before saving.
export function stageGuess(title: string) {
  if (/pre-security|network|linux|basics|fundamental|intro/i.test(title)) return 'Foundations';
  if (/\bweb\b/i.test(title)) return 'Web';
  if (/bandit|wargame|ctf|project|lab\b|practical/i.test(title)) return 'Practical Development';
  if (/security/i.test(title)) return 'Security Fundamentals';
  return 'Foundations';
}
// "TryHackMe: Pre-Security path — one section" → "TryHackMe: Pre-Security path"
export const courseTitleFrom = (t: string) => t.replace(/\s+[—–-]\s+one\s+\w+$/i, '').trim() || t;
export const proposeSetup = (learning: ListItem[]): SetupRow[] =>
  learning.map(l => ({ listId: l.id, title: courseTitleFrom(l.title), minutes: l.minutes, stage: stageGuess(l.title), keep: true }));
// Creates the starter stages (with the chosen courses). Never replaces a roadmap that already exists.
export function applySetup(st: StudyData, rows: SetupRow[] | null): boolean {
  if (st.stages.length) return false;
  const stages: StudyStage[] = STARTER_STAGES.map(title => ({ id: 'sg' + uid(), title, courses: [] }));
  for (const r of rows || []) {
    if (!r.keep) continue;
    (stages.find(s => s.title === r.stage) || stages[0]).courses.push({ id: 'co' + uid(), title: r.title, url: '', minutes: r.minutes, listId: r.listId, archived: false, modules: [] });
  }
  st.stages = stages;
  return true;
}

// ---------- Editing the outline ----------
export function newStudyItem(level: Level, parentCourse: StudyCourse | null) {
  const base = { id: { stage: 'sg', course: 'co', module: 'md', section: 'sc', task: 'tk' }[level] + uid(), title: `New ${level}` };
  if (level === 'stage') return { ...base, courses: [] };
  if (level === 'course') return { ...base, url: '', minutes: 30, listId: null, archived: false, modules: [] };
  if (level === 'module') return { ...base, sections: [] };
  if (level === 'section') return { ...base, tasks: [] };
  return { ...base, minutes: parentCourse && parentCourse.minutes ? parentCourse.minutes : 30, url: '', kind: 'learn', note: '', done: false, doneOn: null };
}
// Adds a new item under `parentId` ('' for a stage). Returns its id, or null.
export function addStudyItem(st: StudyData, level: Level, parentId: string): string | null {
  const ix = stIndex(st), parent = level === 'stage' ? null : stFind(ix, parentId);
  if (level !== 'stage' && !parent) return null;
  const course = parent && parent.level === 'section' ? parent.course! : null;
  const n = newStudyItem(level, course);
  const list = parent ? (parent.node as unknown as Record<string, unknown[]>)[CHILDREN[parent.level as Exclude<Level, 'task'>]] : st.stages;
  list.push(n);
  return n.id;
}
export function moveStudyItem(st: StudyData, id: string, dir: number): boolean {
  const e = stFind(stIndex(st), id), i = e ? e.list.findIndex(x => x.id === id) : -1, j = i + dir;
  if (!e || i < 0 || j < 0 || j >= e.list.length) return false;
  [e.list[i], e.list[j]] = [e.list[j], e.list[i]];
  return true;
}
// Removes an item (and everything in it). Concepts stay; only their links to removed tasks go.
export function removeStudyItem(st: StudyData, id: string): boolean {
  const e = stFind(stIndex(st), id);
  if (!e) return false;
  e.list.splice(e.list.findIndex(x => x.id === id), 1);
  const ix = stIndex(st);
  if (st.focusCourseId && !ix.course.has(st.focusCourseId)) st.focusCourseId = null;
  for (const c of st.concepts) c.taskIds = c.taskIds.filter(t => ix.task.has(t));
  return true;
}
// Add a concept by name to a task, or reuse one with the same name (never a duplicate).
export function conceptNamed(st: StudyData, title: string, taskId: string | null) {
  let c = st.concepts.find(x => x.title.toLowerCase() === title.toLowerCase());
  if (!c) { c = newConcept(title, taskId); st.concepts.push(c); }
  else if (taskId && !c.taskIds.includes(taskId)) c.taskIds.push(taskId);
  return c;
}
// Tick (or untick) a task, with today's local date.
export function setTaskDone(t: StudyTask, done: boolean) { t.done = done; t.doneOn = done ? todayKey() : null; }
