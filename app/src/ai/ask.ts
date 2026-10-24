// "Ask MyDay": the app's own check of what came back, and saving only what you tick. The model only proposes; here
// every proposal is checked again against your data — ids that really exist, real dates from today on, an
// appointment only with a date and a time, sensible lengths, gentle wording — and anything that doesn't hold is
// dropped or made safe (and said). Things to add are saved through the same rules as Capture's, all at once, with one
// step of Undo. Nothing here talks to a model (request.ts does) and nothing is saved until you tap Add.
import { ASK_LIMITS as L, readAsk, type AskItem } from '../../../supabase/functions/_shared/ai/ask-shape.ts';
import { CAT_LABEL } from '../data/plan';
import { isDateKey, keyOf, pad, prettyDate, todayKey } from '../data/dates';
import { addNote, editNote } from '../data/notes';
import { addProject, linkAppointment, linkNote, linkTask } from '../data/projects';
import { stIndex } from '../data/study/roadmap';
import { ROUND_SIZE } from '../data/study/common';
import { dueIds, type Scope } from '../data/study/queue';
import { updateSaved } from '../data/storage';
import { addTask, editTask, inQueue, leaveTodaysPlanIfLater, onTodaysPlan } from '../data/tasks';
import { addMilestone, addOption, addPoint, PLAN_LIMITS, removeMilestone, removeOption, removePoint, type Side } from '../data/projectPlan';
import { addAssumption, isBusiness, MODEL_LIMITS, removeAssumption } from '../data/businessModel';
import type { Category, Commitment, DateKey, MyDayData, Note, Project, StudyModule, StudySection, Task, TaskItem } from '../data/types';
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
  listId?: string;                              // steps for a task: the list that task is in (your own lists, Tasks)
  text: string;                                 // a note's text / a project's summary ('' otherwise)
  already: boolean;                             // a task with this title is already on your lists (left unticked)
  // A study task (into the course on the page): its kind and where it goes — an existing section, or a new section
  // (named) in an existing module or a new module (named).
  study?: { courseId: string; kind: 'learn' | 'practical'; sectionId: string | null; section: string | null; moduleId: string | null; module: string | null };
  // A milestone for the project on the page, or a pro, con or option for the decision you asked about (1.32.0), or
  // something that must be true for a business idea's one page (1.34.0).
  plan?: { projectId: string; decisionId?: string; optionId?: string; side?: Side };
}
const PLAN_TYPES: AskItemType[] = ['milestone', 'pro', 'con', 'option', 'must-be-true'];
// Words that judge a business idea or say how its beliefs will turn out: that's for you to find out, so a reply saying
// so is reworded (and says so).
const JUDGES = /\b(great|good|bad|strong|weak|promising|solid|brilliant|risky|terrible) (idea|plan|business|concept)\b|\b(will|would|could|might) (definitely |probably |likely )?(fail|succeed|flop|take off)\b|\b(is|are|seems?|looks?) (likely|unlikely|probably|definitely) (true|false|right|wrong)\b|\b(likely|unlikely) to (work|fail|succeed)\b|\b(most|least|biggest|highest) risk/i;
const SUGGESTED_BELIEFS = 5; // a few at a time
// Words that pick for you. A decision stays yours: a reply saying which option is best is reworded (and says so).
const CHOOSES = /\b(is|seems|looks|would be) (the )?(best|better|right|clear|obvious)( option| choice| one| fit| way to go)?\b|\bI(?:'d| would) (choose|pick|go (?:with|for))\b|\bI recommend\b|\b(?:you should|I'd suggest you) (?:choose|pick|go (?:with|for))\b|\b(?:clear|obvious) winner\b/i;
// A task or note for the project proposed in the same answer (it's created first when you tap Add).
export const NEW_PROJECT = '@new';
export type AskChecked =
  | { kind: 'add' | 'steps'; message: string; items: AskProposal[]; changed: string[] }
  | { kind: 'answer'; message: string; action: { type: 'start-study'; courseId: string; taskId: string | null; minutes: number; label: string } | { type: 'adjust-today' } | { type: 'start-revision'; scope: Scope; count: number } | null; changed: string[] }
  | { kind: 'cannot'; message: string; changed: string[] }
  | { kind: 'change'; message: string; changes: AskChange[]; changed: string[] };

// A change to something already saved: what it is, the lines to show (before → after) and what to apply.
export interface AskChange {
  target: 'task' | 'appointment' | 'note'; id: string; label: string;
  lines: { field: string; before: string; after: string }[];
  patch: { title?: string; date?: DateKey; time?: string | null; minutes?: number; category?: Category; projectId?: string; start?: string; end?: string };
}

const realDate = (s: string | null | undefined): s is DateKey => !!s && isDateKey(s) && keyOf(new Date(`${s}T12:00`)) === s;
const guessCategory = (t: string): Category => (/\b(study|revise|read|learn|course|lesson|practi[sc]e|exam|homework)\b/i.test(t) ? 'learning' : /\b(gym|run|walk|workout|doctor|gp|dentist|physio|meds|sleep|stretch|swim|yoga)\b/i.test(t) ? 'health' : 'admin');
const gentle = (s: string) => !PRESSURE.test(s);

// Checks a reply against your data. Returns null when nothing in it can be used.
// `asked` is what you typed (and your follow-up): a change only touches a task's length, list or title when it asks for that.
export function checkAskReply(text: string, data: MyDayData, slice: AskSlice, k: DateKey = todayKey(), asked?: string): AskChecked | null {
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
  if (r.kind === 'change' || r.items.some(i => i.type === 'change')) {
    const changes = checkChanges(r.items.filter(i => i.type === 'change'), data, slice, k, changed, asked);
    if (r.items.some(i => i.type !== 'change')) changed.push('Left out things to add — ask for those on their own.');
    if (changes.length) return { kind: 'change', message: message || 'Here’s what would change.', changes, changed };
    // Nothing left to change: say why when something was left out; otherwise the reply couldn't be used.
    return changed.length ? { kind: 'answer', message: 'Nothing here can be changed from this page — you can change it on its own page.', action: null, changed } : null;
  }
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
  // Steps for the task on the page go where that task is: its list and (if it's open) its project. The task itself stays.
  const parent = slice.context.task ? data.tasks.items.find(t => t.id === slice.context.task!.id) ?? null : null;
  const parentProject = parent?.projectId && open.has(parent.projectId) ? parent.projectId : null;
  // Already there: open tasks, today's plan and the project's tasks (left unticked, so nothing is added twice by accident).
  const onLists = new Set([...data.tasks.items.filter(t => !t.done && !t.letGoOn).map(t => t.title), ...(data.days[k]?.tasks ?? []).filter(t => !t.done).map(t => t.title)].map(sameTask));
  const seen = new Set<string>();
  const items: AskProposal[] = [];
  // On a course page, a plan for the course is study tasks in that course (checked against its real outline).
  const course = slice.context.course ? stIndex(data.study).course.get(slice.context.course.id)?.node ?? null : null;
  const inCourse = course ? new Set(course.modules.flatMap(m => m.sections.flatMap(sc => sc.tasks.map(t => sameTask(t.title))))) : new Set<string>();
  const studyCap = r.items.some(i => i.type === 'study-task') && course ? L.studyItems : L.items;
  // Milestones, pros, cons and options: only for the project on this page (never a private one), checked against what it
  // already has and its limits (30 milestones; per decision 4 options, per option 10 pros and 10 cons).
  const pr = slice.context.project ? data.projects.items.find(x => x.id === slice.context.project!.id && !x.private) ?? null : null;
  const dc = pr && slice.context.project?.decision ? pr.decisions?.find(x => x.id === slice.context.project!.decision!.id) ?? null : null;
  let plannedMs = 0, plannedOpts = 0, plannedBeliefs = 0;
  const plannedPts: Record<string, number> = {};
  for (const it of r.items) {
    if (items.length >= studyCap) break;
    let type: AskItemType = PLAN_TYPES.includes(it.type) ? it.type : course && r.kind === 'steps' ? 'study-task' : r.kind === 'steps' ? 'task' : it.type;
    if (type === 'study-task' && !course) type = 'task'; // only on a course page
    if (type !== 'study-task' && items.length >= L.items) continue;
    if (r.kind === 'answer' && items.length >= 3) break; // an answer suggests at most three
    const title = it.title.replace(/\s+/g, ' ').trim().slice(0, L.titleChars);
    if (!title || seen.has(type + ':' + sameTask(title))) continue;
    seen.add(type + ':' + sameTask(title));
    if (PLAN_TYPES.includes(type)) {
      const base = { title, date: null, time: null, minutes: 0, category: 'admin' as Category, text: '', already: false };
      if (!pr) { changed.push(`“${title}”: left out — it's for a project that isn't on this page.`); continue; }
      if (type === 'must-be-true') {
        // Only for a business idea whose one page was sent (its Model tab): short, a statement, new, within the limits.
        if (!isBusiness(pr) || !slice.context.project?.onePage) { changed.push(`“${title}”: left out — it's for a business idea's one page, and that wasn't sent.`); continue; }
        if (title.length > MODEL_LIMITS.assumption) { changed.push(`“${title}”: left out — too long for the list (110 characters).`); continue; }
        if (/\?\s*$/.test(title)) { changed.push(`“${title}”: left out — a question, not something to check.`); continue; }
        if ((pr.model?.assumptions ?? []).some(a => sameTask(a.text) === sameTask(title))) { changed.push(`“${title}”: already on your list.`); continue; }
        if (plannedBeliefs >= SUGGESTED_BELIEFS) { changed.push('Left out more than five — a few at a time is plenty.'); continue; }
        if ((pr.model?.assumptions.length ?? 0) + plannedBeliefs >= MODEL_LIMITS.assumptions) { changed.push('Left out more — 12 is the most.'); continue; }
        plannedBeliefs++;
        items.push({ ...base, type, projectId: pr.id, plan: { projectId: pr.id } });
        continue;
      }
      if (type === 'milestone') {
        if ((pr.milestones ?? []).some(m => sameTask(m.title) === sameTask(title))) { changed.push(`“${title}”: already one of your milestones.`); continue; }
        if ((pr.milestones?.length ?? 0) + plannedMs >= PLAN_LIMITS.milestones) { changed.push('Left out milestones past 30 — plenty to steer by.'); continue; }
        plannedMs++;
        items.push({ ...base, type, date: realDate(it.date) && it.date >= k ? it.date : null, projectId: pr.id, plan: { projectId: pr.id } });
        continue;
      }
      if (!dc) { changed.push(`“${title}”: left out — no decision was asked about.`); continue; }
      if (type === 'option') {
        if (dc.options.some(o => sameTask(o.text) === sameTask(title))) { changed.push(`“${title}”: already one of the options.`); continue; }
        if (dc.options.length + plannedOpts >= PLAN_LIMITS.options) { changed.push('Left out another option — four is the most.'); continue; }
        plannedOpts++;
        items.push({ ...base, type, projectId: pr.id, plan: { projectId: pr.id, decisionId: dc.id } });
        continue;
      }
      const o = dc.options.find(x => x.id === it.optionId), side: Side = type === 'pro' ? 'pros' : 'cons';
      if (!o) { changed.push(`“${title}”: left out — it named an option that isn't in this decision.`); continue; }
      const key = `${o.id}:${side}`;
      if (o[side].some(t => sameTask(t) === sameTask(title))) { changed.push(`“${title}”: already listed for “${o.text}”.`); continue; }
      if (o[side].length + (plannedPts[key] ?? 0) >= PLAN_LIMITS.points) { changed.push(`Left out more ${side} for “${o.text}” — ${PLAN_LIMITS.points} is the most.`); continue; }
      plannedPts[key] = (plannedPts[key] ?? 0) + 1;
      items.push({ ...base, type, text: o.text, projectId: pr.id, plan: { projectId: pr.id, decisionId: dc.id, optionId: o.id, side } });
      continue;
    }
    const oneNew = r.items.filter(x => x.type === 'project').length === 1;
    let projectId = it.projectId && open.has(it.projectId) ? it.projectId : it.projectId === 'new' && oneNew && it.type !== 'project' ? NEW_PROJECT : null;
    if (it.projectId && !projectId) changed.push(`“${title}”: not put in a project that isn’t open.`);
    if (r.kind === 'steps' && here) projectId = here;
    if (r.kind === 'steps' && parent) projectId = parentProject;
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
      ...(r.kind === 'steps' && parent && type === 'task' && parent.listId ? { listId: parent.listId } : {}),
      text: type === 'note' ? (it.text?.trim() || title).slice(0, L.itemTextChars) : type === 'project' ? (it.text?.trim() ?? '').slice(0, L.itemTextChars) : '',
      already: type === 'task' && onLists.has(sameTask(title)),
    });
  }
  // With a decision on the page, the choice stays yours: a message that picks one is reworded.
  let msg = message;
  if (dc && CHOOSES.test(msg)) { msg = 'Here are a few more things to weigh — the choice is yours.'; changed.push('MyDay left out a view on which option to choose — that’s yours to decide.'); }
  // With beliefs for a one page, whether the idea will work stays yours to find out: a message that judges it is reworded.
  if (plannedBeliefs && JUDGES.test(msg)) { msg = 'Here are a few things your idea may depend on — yours to check.'; changed.push('MyDay left out a view on how the idea will turn out — that’s for you to find out.'); }
  if (!items.length) return msg.split(/\s+/).filter(Boolean).length >= 3 ? { kind: 'answer', message: msg, action: null, changed } : null; // a fragment ("Here's") isn't an answer
  return { kind: r.kind === 'steps' ? 'steps' : 'add', message: msg || (r.kind === 'steps' ? 'Here are some smaller steps.' : 'Here’s what I found to add.'), items, changed };
}

// ---------- Changes to what's already saved ----------
// Only things on the page you asked from (their ids were sent), only the fields MyDay allows (a day and time, a title,
// a task's length or list, a task's or note's project), only real changes. Never deleting, never marking done.
const pretty = (k?: string | null) => (k ? prettyDate(k) : 'no date');
// The page doesn't send a task's list (nor, from Today, its length), and a model tends to fill in what it can't see: so
// those, and a new title, change only when what you typed asks for them.
const ASKS = {
  title: /\b(renam\w*|retitl\w*|reword\w*|call (it|this|that)|title|name)\b|["“”]/i,
  minutes: /\b(\d+\s*(m|mins?|minutes?|h|hrs?|hours?)|minutes?|mins?|hours?|shorter|longer|quicker|length|long)\b/i,
  category: /\b(learning|admin|health|list|category)\b/i,
};
function checkChanges(items: AskItem[], data: MyDayData, slice: AskSlice, k: DateKey, changed: string[], asked?: string): AskChange[] {
  const wants = (f: keyof typeof ASKS, name: string, what: string) => { if (asked === undefined || ASKS[f].test(asked)) return true; changed.push(`Left out a new ${what} for “${name}” — you didn’t ask for that.`); return false; };
  const x = slice.context;
  const okTasks = new Set([...(x.today?.dueToday ?? []).map(t => t.id), ...(x.project?.tasks ?? []).map(t => t.id), ...(x.task ? [x.task.id] : [])]);
  const okAppts = new Set((x.calendar?.appointments ?? []).map(a => a.id).filter((id): id is string => !!id));
  const okNotes = new Set(x.note ? [x.note.id] : []);
  const open = new Map(data.projects.items.filter(p => p.status !== 'done').map(p => [p.id, p]));
  const projectName = (id?: string | null) => (id ? data.projects.items.find(p => p.id === id)?.title ?? 'a project' : 'no project');
  const out: AskChange[] = [], seen = new Set<string>();
  for (const it of items.slice(0, L.items)) {
    const id = it.targetId ?? '', key = `${it.target}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const title = it.title?.replace(/\s+/g, ' ').trim().slice(0, L.titleChars) ?? '';
    const lines: AskChange['lines'] = [], patch: AskChange['patch'] = {};
    const newDate = it.date && realDate(it.date) && it.date >= k ? it.date : null;
    if (it.date && !newDate) changed.push('Left out a change to a day before today.');
    if (it.target === 'task') {
      const t = okTasks.has(id) ? data.tasks.items.find(y => y.id === id && !y.done) : undefined;
      if (!t) { changed.push('Left out a change to a task that isn’t on this page (or is done).'); continue; }
      if (title && title !== t.title && wants('title', t.title, 'title')) { patch.title = title; lines.push({ field: 'Title', before: t.title, after: title }); }
      if (newDate && newDate !== t.due) {
        patch.date = newDate; patch.time = it.time ?? t.time ?? null;
        lines.push({ field: 'Day', before: pretty(t.due) + (t.time ? `, ${t.time}` : ''), after: pretty(newDate) + (patch.time ? `, ${patch.time}` : '') });
        if (newDate > k && onTodaysPlan(data, t, k) && !inQueue(data, t)) lines.push({ field: 'Today’s plan', before: 'on it', after: 'taken off' });
      }
      else if (!newDate && it.time && t.due && it.time !== t.time) { patch.time = it.time; lines.push({ field: 'Time', before: t.time ?? 'any time', after: it.time }); }
      if (it.minutes && Math.min(600, Math.max(5, it.minutes)) !== t.minutes && wants('minutes', t.title, 'length')) { patch.minutes = Math.min(600, Math.max(5, it.minutes)); lines.push({ field: 'Length', before: `${t.minutes} min`, after: `${patch.minutes} min` }); }
      if (it.category && it.category !== t.category && wants('category', t.title, 'list')) { patch.category = it.category; lines.push({ field: 'List', before: CAT_LABEL[t.category], after: CAT_LABEL[it.category] }); }
      if (it.projectId && open.has(it.projectId) && it.projectId !== t.projectId) { patch.projectId = it.projectId; lines.push({ field: 'Project', before: projectName(t.projectId), after: projectName(it.projectId) }); }
      if (lines.length) out.push({ target: 'task', id, label: t.title, lines, patch });
    } else if (it.target === 'appointment') {
      const c = okAppts.has(id) ? data.commitments.find(y => y.id === id && y.kind === 'appointment') : undefined;
      if (!c) { changed.push('Left out a change to an appointment that isn’t on this page.'); continue; }
      if (title && title !== c.title && wants('title', c.title, 'title')) { patch.title = title; lines.push({ field: 'Title', before: c.title, after: title }); }
      const day = newDate ?? c.start.slice(0, 10), time = it.time ?? c.start.slice(11, 16);
      if ((newDate || it.time) && `${day}T${time}` !== c.start) {
        const length = new Date(c.end).getTime() - new Date(c.start).getTime(), endAt = new Date(new Date(`${day}T${time}`).getTime() + Math.max(0, length));
        patch.start = `${day}T${time}`; patch.end = `${keyOf(endAt)}T${pad(endAt.getHours())}:${pad(endAt.getMinutes())}`;
        lines.push({ field: 'When', before: `${pretty(c.start.slice(0, 10))}, ${c.start.slice(11, 16)}`, after: `${pretty(day)}, ${time}` });
      }
      if (lines.length) out.push({ target: 'appointment', id, label: c.title, lines, patch });
    } else if (it.target === 'note') {
      const n = okNotes.has(id) ? data.notes.items.find(y => y.id === id && !y.private) : undefined;
      if (!n) { changed.push('Left out a change to a note that isn’t on this page.'); continue; }
      if (title && title !== n.title && wants('title', n.title || 'this note', 'title')) { patch.title = title; lines.push({ field: 'Title', before: n.title || '(none)', after: title }); }
      if (it.projectId && open.has(it.projectId) && it.projectId !== n.projectId) { patch.projectId = it.projectId; lines.push({ field: 'Project', before: projectName(n.projectId), after: projectName(it.projectId) }); }
      if (lines.length) out.push({ target: 'note', id, label: n.title || n.text.split('\n')[0].slice(0, 60), lines, patch });
    }
  }
  return out;
}

// Applies the ticked changes in one save. Undo puts back exact copies of everything it touched.
// What each changed record was before (to put back) and just after (so Undo leaves alone anything you've changed since —
// a tick on Today, an edit, a sync from another device).
export interface AskChangeUndo { tasks: TaskItem[]; notes: Note[]; commitments: Commitment[]; projects: Project[]; offPlan: { day: DateKey; task: Task; at: number }[]; after: Record<string, string> }
// A record's content whatever order its fields are in (a sync round trip can reorder them).
const canon = (v: unknown) => JSON.stringify(v, (_k, x: unknown) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, (x as Record<string, unknown>)[k]])) : x));
export function applyAskChanges(changes: AskChange[]): AskChangeUndo | null {
  const u: AskChangeUndo = { tasks: [], notes: [], commitments: [], projects: [], offPlan: [], after: {} };
  const r = updateSaved(d => {
    const keep = <T extends { id: string }>(list: T[], item: T | undefined) => { if (item && !list.some(y => y.id === item.id)) list.push(structuredClone(item)); };
    let any = false;
    for (const c of changes) {
      if (c.target === 'task') {
        const t = d.tasks.items.find(y => y.id === c.id);
        if (!t) continue;
        keep(u.tasks, t);
        for (const pid of [t.projectId, c.patch.projectId]) keep(u.projects, d.projects.items.find(p => p.id === pid));
        any = editTask(d.tasks, c.id, { ...(c.patch.title ? { title: c.patch.title } : {}), ...(c.patch.date ? { due: c.patch.date } : {}), ...(c.patch.time !== undefined ? { time: c.patch.time } : {}),
          ...(c.patch.minutes ? { minutes: c.patch.minutes } : {}), ...(c.patch.category ? { category: c.patch.category } : {}) }) || any;
        if (c.patch.projectId) any = linkTask(d, c.id, c.patch.projectId) || any;
        // Moved to a later day while on today's plan: it comes off the plan too (Undo puts that one task back, in its place).
        const k = todayKey(), uid = d.tasks.items.find(y => y.id === c.id)?.planUid, at = d.days[k]?.tasks.findIndex(x => x.uid === uid) ?? -1;
        const copy = at >= 0 ? structuredClone(d.days[k].tasks[at]) : null;
        if (leaveTodaysPlanIfLater(d, c.id, k)) { any = true; if (copy) u.offPlan.push({ day: k, task: copy, at }); }
      } else if (c.target === 'appointment') {
        const a = d.commitments.find(y => y.id === c.id);
        if (!a) continue;
        keep(u.commitments, a);
        if (c.patch.title) a.title = c.patch.title;
        if (c.patch.start && c.patch.end) { a.start = c.patch.start; a.end = c.patch.end; }
        any = true;
      } else {
        const n = d.notes.items.find(y => y.id === c.id);
        if (!n) continue;
        keep(u.notes, n);
        for (const pid of [n.projectId, c.patch.projectId]) keep(u.projects, d.projects.items.find(p => p.id === pid));
        if (c.patch.title) any = editNote(d.notes, c.id, { title: c.patch.title }) || any;
        if (c.patch.projectId) any = linkNote(d, c.id, c.patch.projectId) || any;
      }
    }
    if (!any) return false;
    const note = <T extends { id: string }>(kind: string, list: T[], copies: T[]) => { for (const c of copies) { const now = list.find(y => y.id === c.id); if (now) u.after[`${kind}:${c.id}`] = canon(now); } };
    note('task', d.tasks.items, u.tasks); note('note', d.notes.items, u.notes); note('appointment', d.commitments, u.commitments); note('project', d.projects.items, u.projects);
  });
  return r === 'saved' ? u : null;
}
// Put back what Ask changed, except anything changed since (that change is yours, so it stays): "undone", "partly"
// (with how many were kept), "changed" (nothing left to put back) or "not-saved".
export function undoAskChanges(u: AskChangeUndo): { result: 'undone' | 'partly' | 'changed' | 'not-saved'; kept: number } {
  let kept = 0, n = 0;
  const back = new Set<string>();
  const r = updateSaved(d => {
    kept = 0; n = 0; back.clear();
    const put = <T extends { id: string }>(kind: string, list: T[], copies: T[]) => {
      for (const c of copies) {
        const i = list.findIndex(y => y.id === c.id);
        if (i < 0) continue;
        // A project's "updated" time alone (touched by a link, or since) isn't a change of yours; anything else is kept.
        const now = kind === 'project' ? canon({ ...list[i], updatedAt: null }) : canon(list[i]);
        const then = kind === 'project' ? canon({ ...JSON.parse(u.after[`${kind}:${c.id}`] ?? 'null'), updatedAt: null }) : u.after[`${kind}:${c.id}`];
        if (now !== then) { kept++; continue; }
        // Exactly as it was, except a project's "updated" time when something touched it since (that stays).
        const touched = kind === 'project' && (list[i] as { updatedAt?: string }).updatedAt !== (JSON.parse(u.after[`${kind}:${c.id}`] ?? 'null') as { updatedAt?: string } | null)?.updatedAt;
        list[i] = touched ? { ...structuredClone(c), updatedAt: (list[i] as { updatedAt?: string }).updatedAt } as T : structuredClone(c); n++; back.add(`${kind}:${c.id}`);
      }
    };
    put('task', d.tasks.items, u.tasks); put('note', d.notes.items, u.notes); put('appointment', d.commitments, u.commitments); put('project', d.projects.items, u.projects);
    // A task that came off today's plan goes back on it only if the task itself was put back.
    for (const o of u.offPlan) {
      const t = u.tasks.find(x => x.planUid === o.task.uid), day = d.days[o.day];
      if (t && back.has(`task:${t.id}`) && day && !day.tasks.some(x => x.uid === o.task.uid)) { day.tasks.splice(Math.min(o.at, day.tasks.length), 0, structuredClone(o.task)); n++; }
    }
    if (!n) return false;
  });
  if (!n) return { result: 'changed', kept };
  return r === 'saved' ? { result: kept ? 'partly' : 'undone', kept } : { result: 'not-saved', kept };
}

// ---------- Saving what you ticked ----------
export interface AskUndo {
  tasks: string[]; notes: string[]; appointments: string[]; projects: string[]; study?: { tasks: string[]; sections: string[]; modules: string[] };
  // Milestones, options and pros/cons it added to a project (1.32.0).
  plan?: ({ kind: 'milestone'; projectId: string; id: string } | { kind: 'assumption'; projectId: string; id: string } | { kind: 'option'; projectId: string; decisionId: string; id: string } | { kind: 'point'; projectId: string; decisionId: string; optionId: string; side: Side; text: string })[];
}
const end30 = (date: DateKey, time: string) => { const t = new Date(`${date}T${time}`); t.setMinutes(t.getMinutes() + 30); return `${keyOf(t)}T${pad(t.getHours())}:${pad(t.getMinutes())}`; };

// Adds them all in one save. Returns what to take back with Undo, or null if nothing could be saved.
export function addAskItems(items: AskProposal[]): AskUndo | null {
  const u: AskUndo = { tasks: [], notes: [], appointments: [], projects: [], study: { tasks: [], sections: [], modules: [] }, plan: [] };
  const r = updateSaved(d => {
    // Milestones for the project, and options or pros/cons for the decision you asked about — through the same rules
    // (and limits) as adding them yourself.
    for (const it of items) {
      const pl = it.plan;
      if (!pl) continue;
      if (it.type === 'milestone') { const id = addMilestone(d, pl.projectId, it.title, it.date); if (id && id !== 'full') u.plan!.push({ kind: 'milestone', projectId: pl.projectId, id }); }
      else if (it.type === 'must-be-true') { const id = addAssumption(d, pl.projectId, it.title); if (id && id !== 'full') u.plan!.push({ kind: 'assumption', projectId: pl.projectId, id }); }
      else if (it.type === 'option' && pl.decisionId) { const id = addOption(d, pl.projectId, pl.decisionId, it.title); if (id && id !== 'full') u.plan!.push({ kind: 'option', projectId: pl.projectId, decisionId: pl.decisionId, id }); }
      else if (pl.decisionId && pl.optionId && pl.side && addPoint(d, pl.projectId, pl.decisionId, pl.optionId, pl.side, it.title) === true) {
        const o = d.projects.items.find(x => x.id === pl.projectId)?.decisions?.find(x => x.id === pl.decisionId)?.options.find(x => x.id === pl.optionId);
        if (o) u.plan!.push({ kind: 'point', projectId: pl.projectId, decisionId: pl.decisionId, optionId: pl.optionId, side: pl.side, text: o[pl.side][o[pl.side].length - 1] });
      }
    }
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
        const id = addTask(d.tasks, { title: it.title, category: it.category, due: it.date, time: it.time, minutes: it.minutes, listId: it.listId && d.tasks.lists.some(l => l.id === it.listId) ? it.listId : '' });
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
    if (!u.tasks.length && !u.notes.length && !u.appointments.length && !u.projects.length && !u.study!.tasks.length && !u.plan!.length) return false;
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
    // Milestones, options and pros/cons it added (newest first; one you've already removed stays removed).
    let planGone = 0;
    for (const x of [...(u.plan ?? [])].reverse()) {
      if (x.kind === 'milestone') planGone += removeMilestone(d, x.projectId, x.id) ? 1 : 0;
      else if (x.kind === 'assumption') planGone += removeAssumption(d, x.projectId, x.id) ? 1 : 0;
      else if (x.kind === 'option') {
        const removed = removeOption(d, x.projectId, x.decisionId, x.id);
        planGone += removed === 'removed' || removed === 'reopened' ? 1 : 0;
      }
      else {
        const list = d.projects.items.find(p => p.id === x.projectId)?.decisions?.find(y => y.id === x.decisionId)?.options.find(o => o.id === x.optionId)?.[x.side];
        const i = list ? list.lastIndexOf(x.text) : -1;
        if (i >= 0) planGone += removePoint(d, x.projectId, x.decisionId, x.optionId, x.side, i) ? 1 : 0;
      }
    }
    if (d.tasks.items.length + d.notes.items.length + d.commitments.length + d.projects.items.length === before && !studyGone && !planGone) return false;
  }) === 'saved';
}

// How many of each, in words ("2 tasks and a note").
export function countWords(items: { type: AskItemType }[]): string {
  const n = (t: AskItemType) => items.filter(i => i.type === t).length;
  const w = (c: number, one: string, many: string) => (c === 1 ? `a${/^[aeiou]/.test(one) ? 'n' : ''} ${one}` : `${c} ${many}`);
  const parts = [[n('study-task'), 'study task', 'study tasks'], [n('task'), 'task', 'tasks'], [n('note'), 'note', 'notes'], [n('appointment'), 'appointment', 'appointments'], [n('project'), 'project', 'projects'],
    [n('milestone'), 'milestone', 'milestones'], [n('option'), 'option', 'options'], [n('pro'), 'pro', 'pros'], [n('con'), 'con', 'cons'], [n('must-be-true'), 'thing that must be true', 'things that must be true']]
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
