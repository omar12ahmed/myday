// "Ask MyDay": the app's own check of what came back, and saving only what you tick. The model only proposes; here
// every proposal is checked again against your data — ids that really exist, real dates from today on, an
// appointment only with a date and a time, sensible lengths, gentle wording — and anything that doesn't hold is
// dropped or made safe (and said). Things to add are saved through the same rules as Capture's, all at once, with one
// step of Undo. Nothing here talks to a model (request.ts does) and nothing is saved until you tap Add.
import { ASK_LIMITS as L, readAsk, type AskItem } from '../../../supabase/functions/_shared/ai/ask-shape.ts';
import { isDateKey, keyOf, pad, todayKey } from '../data/dates';
import { addNote } from '../data/notes';
import { addProject, linkAppointment, linkNote, linkTask } from '../data/projects';
import { stIndex } from '../data/study/roadmap';
import { ROUND_SIZE } from '../data/study/common';
import { dueIds, type Scope } from '../data/study/queue';
import { updateSaved } from '../data/storage';
import { addTask } from '../data/tasks';
import type { Category, DateKey, MyDayData, StudyModule, StudySection } from '../data/types';
import { uid } from '../data/util';
import type { AskSlice } from './askContext';
import { sameTask } from './mind';
import { PRESSURE } from './validate';

export type AskItemType = AskItem['type'];
export interface AskProposal {
  type: AskItemType;
  title: string;
  date: DateKey | null; time: string | null;   // a task's due date/time; an appointment's date and time (both always set)
  minutes: number;                              // a task's length (others: unused)
  category: Category;                           // a task's list (others: unused)
  projectId: string | null;                     // a project that exists and isn't done — or NEW_PROJECT: the one proposed alongside
  text: string;                                 // a note's text / a project's summary ('' otherwise)
  already: boolean;                             // a task with this title is already on your lists (left unticked)
  // A study task (into the course on the page): its kind and where it goes — an existing section, or a new section
  // (named) in an existing module or a new module (named).
  study?: { courseId: string; kind: 'learn' | 'practical'; sectionId: string | null; section: string | null; moduleId: string | null; module: string | null };
}
// A task or note for the project proposed in the same answer (it's created first when you tap Add).
export const NEW_PROJECT = '@new';
export type AskChecked =
  | { kind: 'add' | 'steps'; message: string; items: AskProposal[]; changed: string[] }
  | { kind: 'answer'; message: string; action: { type: 'start-study'; courseId: string; taskId: string | null; minutes: number; label: string } | { type: 'adjust-today' } | { type: 'start-revision'; scope: Scope; count: number } | null; changed: string[] }
  | { kind: 'cannot'; message: string; changed: string[] };

const realDate = (s: string | null | undefined): s is DateKey => !!s && isDateKey(s) && keyOf(new Date(`${s}T12:00`)) === s;
const guessCategory = (t: string): Category => (/\b(study|revise|read|learn|course|lesson|practi[sc]e|exam|homework)\b/i.test(t) ? 'learning' : /\b(gym|run|walk|workout|doctor|gp|dentist|physio|meds|sleep|stretch|swim|yoga)\b/i.test(t) ? 'health' : 'admin');
const gentle = (s: string) => !PRESSURE.test(s);

// Checks a reply against your data. Returns null when nothing in it can be used.
export function checkAskReply(text: string, data: MyDayData, slice: AskSlice, k: DateKey = todayKey()): AskChecked | null {
  const r = readAsk(text);
  if (!r) return null;
  const changed: string[] = [];
  let message = r.message.trim();
  // A message that stops mid-sentence is cut back to its last whole sentence.
  if (message && !/[.!?…)"”’]$/.test(message)) {
    const whole = message.match(/^[\s\S]*[.!?…](?=\s|$)/);
    message = whole ? whole[0].trim() : message.replace(/[\s,;:—–-]+$/, '') + '.';
  }
  if (message && !gentle(message)) { message = ''; changed.push('Left out a sentence that wasn’t gentle enough.'); }
  if (r.kind === 'cannot') return message ? { kind: 'cannot', message, changed } : null;
  if (r.kind === 'answer' && (!r.items.length || r.action)) {
    if (r.items.length) changed.push('Its suggestion to start is here; the things it offered to add were left out — ask again for those.');
    let action: Extract<AskChecked, { kind: 'answer' }>['action'] = null;
    if (r.action?.type === 'adjust-today') action = { type: 'adjust-today' };
    else if (r.action?.type === 'start-revision') {
      const count = dueIds(data, k, r.action.scope).length;
      if (count) action = { type: 'start-revision', scope: r.action.scope, count: Math.min(count, ROUND_SIZE) };
      else changed.push('Nothing is due to revise right now, so there’s no round to start.');
    }
    else if (r.action?.type === 'start-study') {
      const a = r.action, ix = stIndex(data.study), course = ix.course.get(a.courseId)?.node;
      const tasks = course ? ix.courseTasks.get(course.id) ?? [] : [];
      const task = a.taskId ? tasks.find(t => t.id === a.taskId && !t.done) ?? null : null;
      if (course && !course.archived) {
        action = { type: 'start-study', courseId: course.id, taskId: task ? task.id : null, minutes: Math.min(60, Math.max(5, a.minutes || 15)), label: task ? task.title : course.title };
        if (a.taskId && !task) changed.push('The suggested task wasn’t found, so it starts on the course.');
      } else changed.push('Left out a suggestion for a course that isn’t in your roadmap.');
    }
    return action || message.split(/\s+/).filter(Boolean).length >= 3 ? { kind: 'answer', message, action, changed } : null;
  }
  // Things to add, or steps (an answer that suggests adding something is shown the same way, with its message).
  const open = new Map(data.projects.items.filter(p => p.status !== 'done').map(p => [p.id, p]));
  const here = slice.context.project && open.has(slice.context.project.id) ? slice.context.project.id : null;
  // Already there: open tasks, today's plan and the project's tasks (left unticked, so nothing is added twice by accident).
  const onLists = new Set([...data.tasks.items.filter(t => !t.done && !t.letGoOn).map(t => t.title), ...(data.days[k]?.tasks ?? []).filter(t => !t.done).map(t => t.title)].map(sameTask));
  const seen = new Set<string>();
  const items: AskProposal[] = [];
  // On a course page, a plan for the course is study tasks in that course (checked against its real outline).
  const course = slice.context.course ? stIndex(data.study).course.get(slice.context.course.id)?.node ?? null : null;
  const inCourse = course ? new Set(course.modules.flatMap(m => m.sections.flatMap(sc => sc.tasks.map(t => sameTask(t.title))))) : new Set<string>();
  const studyCap = r.items.some(i => i.type === 'study-task') && course ? L.studyItems : L.items;
  for (const it of r.items) {
    if (items.length >= studyCap) break;
    let type: AskItemType = course && r.kind === 'steps' ? 'study-task' : r.kind === 'steps' ? 'task' : it.type;
    if (type === 'study-task' && !course) type = 'task'; // only on a course page
    if (type !== 'study-task' && items.length >= L.items) continue;
    if (r.kind === 'answer' && items.length >= 3) break; // an answer suggests at most three
    const title = it.title.replace(/\s+/g, ' ').trim().slice(0, L.titleChars);
    if (!title || seen.has(type + ':' + sameTask(title))) continue;
    seen.add(type + ':' + sameTask(title));
    const oneNew = r.items.filter(x => x.type === 'project').length === 1;
    let projectId = it.projectId && open.has(it.projectId) ? it.projectId : it.projectId === 'new' && oneNew && it.type !== 'project' ? NEW_PROJECT : null;
    if (it.projectId && !projectId) changed.push(`“${title}”: not put in a project that isn’t open.`);
    if (r.kind === 'steps' && here) projectId = here;
    let date: DateKey | null = realDate(it.date) && it.date >= k ? it.date : null;
    if (it.date && !date) changed.push(`“${title}”: left without a date (it wasn’t a day from today on).`);
    let time = date && it.time ? it.time : null;
    if (type === 'appointment' && !(date && time)) { type = 'task'; changed.push(`“${title}”: made a task — an appointment needs a day and a time.`); }
    if (type === 'project') { projectId = null; date = null; time = null; }
    if (type === 'note') { date = null; time = null; }
    if (type === 'study-task' && course) {
      // An id from the outline — or a "new" name that's really one the course already has (no duplicate sections or modules).
      const same = (a: string, b: string | null | undefined) => !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
      const mod = (it.moduleId ? course.modules.find(m => m.id === it.moduleId) : null) ?? course.modules.find(m => same(m.title, it.module)) ?? null;
      const sec = (it.sectionId ? course.modules.flatMap(m => m.sections).find(x => x.id === it.sectionId) : null)
        ?? (it.section ? (mod ? mod.sections : course.modules.flatMap(m => m.sections)).find(x => same(x.title, it.section)) : null) ?? null;
      if (it.sectionId && !sec) changed.push(`“${title}”: put in a new section — the one suggested isn’t in this course.`);
      items.push({ type, title, date: null, time: null, minutes: Math.min(L.maxMinutes, Math.max(L.minMinutes, it.minutes ?? course.minutes ?? 30)), category: 'learning', projectId: null, text: '',
        already: inCourse.has(sameTask(title)),
        study: { courseId: course.id, kind: it.kind ?? 'learn', sectionId: sec?.id ?? null, section: sec ? null : (it.section || 'Planned with Ask'), moduleId: sec ? null : mod?.id ?? null, module: sec || mod ? null : it.module ?? null } });
      continue;
    }
    items.push({
      type, title, date, time,
      minutes: Math.min(L.maxMinutes, Math.max(L.minMinutes, it.minutes ?? 15)),
      category: it.category ?? guessCategory(title),
      projectId: type === 'project' ? null : projectId,
      text: type === 'note' ? (it.text?.trim() || title).slice(0, L.itemTextChars) : type === 'project' ? (it.text?.trim() ?? '').slice(0, L.itemTextChars) : '',
      already: type === 'task' && onLists.has(sameTask(title)),
    });
  }
  if (!items.length) return message.split(/\s+/).filter(Boolean).length >= 3 ? { kind: 'answer', message, action: null, changed } : null; // a fragment ("Here's") isn't an answer
  return { kind: r.kind === 'steps' ? 'steps' : 'add', message: message || (r.kind === 'steps' ? 'Here are some smaller steps.' : 'Here’s what I found to add.'), items, changed };
}

// ---------- Saving what you ticked ----------
export interface AskUndo { tasks: string[]; notes: string[]; appointments: string[]; projects: string[]; study?: { tasks: string[]; sections: string[]; modules: string[] } }
const end30 = (date: DateKey, time: string) => { const t = new Date(`${date}T${time}`); t.setMinutes(t.getMinutes() + 30); return `${keyOf(t)}T${pad(t.getHours())}:${pad(t.getMinutes())}`; };

// Adds them all in one save. Returns what to take back with Undo, or null if nothing could be saved.
export function addAskItems(items: AskProposal[]): AskUndo | null {
  const u: AskUndo = { tasks: [], notes: [], appointments: [], projects: [], study: { tasks: [], sections: [], modules: [] } };
  const r = updateSaved(d => {
    // Study tasks into the course on the page. A section or module is found by its id or by its name (the course's own,
    // or one made earlier in this same Add), so nothing is made twice; one the model only half-named goes with the last
    // one it made, else the course's last module.
    const same = (a: string, b: string | null) => !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
    let lastMadeMod: StudyModule | null = null;
    for (const it of items) {
      if (it.type !== 'study-task' || !it.study) continue;
      const c = stIndex(d.study).course.get(it.study.courseId)?.node;
      if (!c) continue;
      let sec: StudySection | null = it.study.sectionId ? c.modules.flatMap(m => m.sections).find(x => x.id === it.study!.sectionId) ?? null : null;
      if (!sec) {
        let mod: StudyModule | null = (it.study.moduleId ? c.modules.find(m => m.id === it.study!.moduleId) : null) ?? c.modules.find(m => same(m.title, it.study!.module)) ?? null;
        if (!mod && it.study.module) {
          mod = { id: 'md' + uid(), title: it.study.module, sections: [] }; c.modules.push(mod); u.study!.modules.push(mod.id); lastMadeMod = mod;
        }
        mod ??= lastMadeMod ?? c.modules[c.modules.length - 1] ?? null;
        if (!mod) { mod = { id: 'md' + uid(), title: 'Planned with Ask', sections: [] }; c.modules.push(mod); u.study!.modules.push(mod.id); lastMadeMod = mod; }
        const name = it.study.section ?? 'Planned with Ask';
        sec = mod.sections.find(x => same(x.title, name)) ?? null;
        if (!sec) { sec = { id: 'sc' + uid(), title: name, tasks: [] }; mod.sections.push(sec); u.study!.sections.push(sec.id); }
      }
      const id = 'tk' + uid();
      sec.tasks.push({ id, title: it.title, minutes: it.minutes, url: '', kind: it.study.kind, note: '', done: false, doneOn: null });
      u.study!.tasks.push(id);
    }
    // The project first, so the tasks and notes proposed with it can go in it (if you ticked it; otherwise they stand alone).
    let created: string | null = null;
    for (const it of items) if (it.type === 'project') { const id = addProject(d, it.title, it.text); if (id) { u.projects.push(id); created ??= id; } }
    const inProject = (pid: string | null) => (pid === NEW_PROJECT ? created : pid);
    for (const it of items) {
      if (it.type === 'task') {
        const id = addTask(d.tasks, { title: it.title, category: it.category, due: it.date, time: it.time, minutes: it.minutes });
        if (!id) continue;
        const pt = inProject(it.projectId);
        if (pt) linkTask(d, id, pt);
        u.tasks.push(id);
      } else if (it.type === 'note') {
        const id = addNote(d.notes, '', it.text || it.title);
        const n = d.notes.items.find(x => x.id === id);
        if (n && it.text && it.text !== it.title) n.title = it.title;
        const pn = inProject(it.projectId);
        if (pn) linkNote(d, id, pn);
        u.notes.push(id);
      } else if (it.type === 'appointment' && it.date && it.time) {
        const id = 'c' + uid();
        d.commitments.push({ id, kind: 'appointment', title: it.title, start: `${it.date}T${it.time}`, end: end30(it.date, it.time) });
        const pa = inProject(it.projectId);
        if (pa) linkAppointment(d, pa, id);
        u.appointments.push(id);
      }
    }
    if (!u.tasks.length && !u.notes.length && !u.appointments.length && !u.projects.length && !u.study!.tasks.length) return false;
  });
  return r === 'saved' ? u : null;
}

// Takes back what Ask MyDay just added (anything you've already removed stays removed).
export function undoAsk(u: AskUndo): boolean {
  return updateSaved(d => {
    const t = new Set(u.tasks), n = new Set(u.notes), a = new Set(u.appointments), p = new Set(u.projects);
    const before = d.tasks.items.length + d.notes.items.length + d.commitments.length + d.projects.items.length;
    d.tasks.items = d.tasks.items.filter(x => !t.has(x.id));
    d.notes.items = d.notes.items.filter(x => !n.has(x.id));
    d.commitments = d.commitments.filter(x => !a.has(x.id));
    for (const pr of d.projects.items) if (pr.commitmentIds.some(id => a.has(id))) pr.commitmentIds = pr.commitmentIds.filter(id => !a.has(id));
    d.projects.items = d.projects.items.filter(x => !p.has(x.id));
    // Study tasks it added, then the sections and modules it made (only if nothing else has been put in them since).
    let studyGone = 0;
    if (u.study) {
      const st = new Set(u.study.tasks), ss = new Set(u.study.sections), sm = new Set(u.study.modules);
      for (const sg of d.study.stages) for (const c of sg.courses) {
        for (const m of c.modules) for (const sc of m.sections) { const n = sc.tasks.length; sc.tasks = sc.tasks.filter(t => !st.has(t.id)); studyGone += n - sc.tasks.length; }
        for (const m of c.modules) m.sections = m.sections.filter(sc => !(ss.has(sc.id) && !sc.tasks.length));
        c.modules = c.modules.filter(m => !(sm.has(m.id) && !m.sections.length));
      }
    }
    if (d.tasks.items.length + d.notes.items.length + d.commitments.length + d.projects.items.length === before && !studyGone) return false;
  }) === 'saved';
}

// How many of each, in words ("2 tasks and a note").
export function countWords(items: { type: AskItemType }[]): string {
  const n = (t: AskItemType) => items.filter(i => i.type === t).length;
  const w = (c: number, one: string, many: string) => (c === 1 ? `a${/^[aeiou]/.test(one) ? 'n' : ''} ${one}` : `${c} ${many}`);
  const parts = [[n('study-task'), 'study task', 'study tasks'], [n('task'), 'task', 'tasks'], [n('note'), 'note', 'notes'], [n('appointment'), 'appointment', 'appointments'], [n('project'), 'project', 'projects']]
    .filter(([c]) => (c as number) > 0).map(([c, one, many]) => w(c as number, one as string, many as string));
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0] ?? 'nothing';
}

// ---------- Your edits to a proposal, before Add ----------
// What you change on a card (a day, a time, the length, the list, a note's text) is checked by the same rules as the
// model's proposal: a real day from today on, a time only with a day, 5–120 minutes; an appointment left without a
// day and a time becomes a task.
export interface AskEdit { date?: string; time?: string; minutes?: string; category?: Category; text?: string; kind?: 'learn' | 'practical' }
export function applyAskEdit(it: AskProposal, e: AskEdit | undefined, k: DateKey = todayKey()): AskProposal {
  if (!e) return it;
  const out = { ...it };
  if (e.date !== undefined) out.date = realDate(e.date) && e.date >= k ? e.date : null;
  if (e.time !== undefined) out.time = /^([01]\d|2[0-3]):[0-5]\d$/.test(e.time) ? e.time : null;
  if (!out.date) out.time = null;
  if (e.minutes !== undefined && e.minutes.trim() !== '') { const m = Math.round(Number(e.minutes)); if (Number.isFinite(m)) out.minutes = Math.min(L.maxMinutes, Math.max(L.minMinutes, m)); }
  if (e.category) out.category = e.category;
  if (e.text !== undefined && (out.type === 'note' || out.type === 'project')) out.text = e.text.slice(0, L.itemTextChars);
  if (e.kind && out.study) out.study = { ...out.study, kind: e.kind };
  if (out.type === 'appointment' && !(out.date && out.time)) out.type = 'task';
  return out;
}
