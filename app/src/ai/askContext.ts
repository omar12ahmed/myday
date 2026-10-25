// What "Ask MyDay" sends from the page you're on (the AI design, 17 Oct 2026): what you typed, the date and time, the
// page's name and that page's small slice of your data — the same slice the "Sends:" line describes before you tap.
// Never a private note; Finance and Health send only the page's name; a project's notes' text only with "AI help with
// notes" switched on. A business idea's one page only from its Model tab (1.34.0).
import { ASK_LIMITS as L, ASK_TOOLS, type AskContext, type AskLookup, type AskPage, type AskPageContext } from '../../../supabase/functions/_shared/ai/ask-shape.ts';
import { parseKey, prettyDate, shift, todayKey } from '../data/dates';
import { focusProjects, whatMoved, whatsWaiting } from '../data/weekReview';
import { noteName } from '../data/notes';
import { isBusiness } from '../data/businessModel';
import { projectNotes, projectTasks } from '../data/projects';
import type { AskFocus } from '../capture/openCapture';
import { stIndex } from '../data/study/roadmap';
import { dueIds } from '../data/study/queue';
import { topicGlance, topicsOf } from '../data/study/topics';
import type { DateKey, MyDayData, Project } from '../data/types';
import { notesRoute } from '../notes/route';
import { tasksRoute } from '../tasks/route';
import { buildContext } from './context';
import { aiReach } from './reach';

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const ref = (id: string, title: string) => ({ id, title: cut(title.trim() || 'Untitled', L.titleChars) });
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
// Free time left today, in minutes (from the Calendar's own reckoning), or null when the day has none worked out.
const freeOf = (pc: ReturnType<typeof buildContext>) => (pc.free.length ? pc.free.reduce((a, f) => a + Math.max(0, toMin(f.end) - toMin(f.start)), 0) : null);

// Which page you're on, from the address (and the thing it shows, if any).
export function askPage(hash: string): { page: AskPage; id: string | null } {
  const h = hash.replace(/^#/, ''), top = h.split('/')[0];
  if (top === '' || top === 'today') {
    const t = tasksRoute('#' + h);
    if (h.startsWith('today/tasks')) return t.view === 'task' ? { page: 'task', id: t.id } : { page: 'tasks', id: null };
    return { page: 'today', id: null };
  }
  if (top === 'projects') {
    const p = h.split('/');
    if (p[1] === 'p' && p[2]) return { page: 'project', id: decodeURIComponent(p[2]) };
    if (p[1] === 'notes') { const n = notesRoute('#' + h); return n.view === 'note' ? { page: 'note', id: n.id } : { page: 'notes', id: null }; }
    return { page: 'projects', id: null };
  }
  if (top === 'study') { const p = h.split('/'); return p[1] === 'course' && p[2] ? { page: 'course', id: decodeURIComponent(p[2]) } : { page: 'study', id: null }; }
  if (top === 'calendar' || top === 'health' || top === 'finance' || top === 'review') return { page: top, id: null };
  return { page: 'other', id: null };
}

// `privateNote`: the page's own note is private (or in a private project), so it isn't sent. `held`: what else was left out
// because you made it private — the page's own project or task (`here`), and how many items of private projects
// (`count`: open projects' names, tasks on today's plan or due today, appointments).
export interface AskSlice { page: AskPage; context: AskPageContext; sends: string; privateNote: boolean; held: { here: 'project' | 'task' | 'note' | null; count: number } }

// The words for what each page sends — shared by the "Sends:" line and the What MyDay knows page, so they can't drift.
export const SENDS = {
  openProjects: 'your open projects’ names',
  today: "today's plan, your energy, your free time, tasks due today and how much revision is due",
  study: 'your current course and next task, your topics, how much revision is due, and your energy and free time today',
  course: 'this course’s outline (its modules, sections and tasks — titles and lengths only)',
  project: (withText: boolean) => `this project’s name, summary, stage, tasks, milestones and note titles${withText ? ' and text (not private ones)' : ''}`,
  decision: `the decision you asked about (its question, options, and the first ${L.decisionPoints} pros and ${L.decisionPoints} cons per option)`,
  onePage: 'its one page (your three answers, and what must be true with how each is turning out — not what you found)',
  note: 'this note', task: 'this task', calendar: "today's appointments",
  review: 'your last seven days in counts (what moved in each project, other tasks, study and workouts), what needs you and next week’s focus — nothing of private projects',
} as const;
const HELD_WORD = { note: 'not this note, it’s private', project: 'not this project, it’s private', task: 'not this task, its project is private' } as const;
function sendsLine(parts: string[], here: AskSlice['held']['here'] = null): string {
  const listed = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  return `what you typed, the date${listed ? ', ' + listed : ''}${here ? ` — ${HELD_WORD[here]}` : ''}`;
}
// What a page sends when it has everything it can send (open projects, the thing it shows) — for What MyDay knows.
export function sendsFor(page: AskPage, aiNotes: boolean): string {
  const parts: string[] = page === 'finance' || page === 'health' ? [] : [SENDS.openProjects];
  const own = page === 'project' ? SENDS.project(aiNotes) : page in SENDS ? SENDS[page as 'today'] : null;
  if (typeof own === 'string') parts.push(own);
  return sendsLine(parts);
}

// The slice for a page, and the words for the "Sends:" line. Nothing of a project you made private is sent: not its name
// (in the open projects), its own page, its tasks (on today's plan or due today), its notes or its appointments.
export function askSlice(data: MyDayData, hash: string, k: DateKey = todayKey(), focus?: AskFocus): AskSlice {
  const { page, id } = askPage(hash);
  const ctx: AskPageContext = {}, parts: string[] = [];
  let privateNote = false, here: AskSlice['held']['here'] = null, count = 0;
  const reach = aiReach(data), inPrivate = reach.inPrivate; // what may reach AI (ai/reach.ts)
  const open = data.projects.items.filter(p => p.status !== 'done'), shown = open.filter(reach.project).slice(0, L.list);
  if (page !== 'finance' && page !== 'health') {
    count += open.length - open.filter(reach.project).length;
    if (shown.length) { ctx.projects = shown.map(p => ref(p.id, p.title)); parts.push(SENDS.openProjects); }
  }
  if (page === 'today') {
    const pc = buildContext(data, k, '');
    // A plan task linked to a task of a private project (by its plan copy) is left out, like the task itself.
    const fromPrivate = reach.heldOnPlan(k);
    const plan = pc.tasks.filter(t => !fromPrivate.has(t.id));
    const due = data.tasks.items.filter(t => !t.done && !t.letGoOn && t.due === k);
    const dueShown = due.filter(reach.task);
    count += pc.tasks.length - plan.length + due.length - dueShown.length;
    const shownPlan = plan.slice(0, L.list).map(t => ({ ...ref(t.id, t.title), minutes: t.minutes, done: t.done }));
    // What's left, worked out here: models add up a plan's minutes badly (counting the ones done).
    ctx.today = { energy: pc.energy, freeMinutes: freeOf(pc), revisionDue: dueIds(data, k).length, plan: shownPlan,
      minutesLeft: shownPlan.reduce((sum, t) => sum + (t.done ? 0 : t.minutes), 0), dueToday: dueShown.slice(0, L.list).map(t => ref(t.id, t.title)) };
    parts.push(SENDS.today);
  } else if (page === 'study') {
    const st = data.study, ix = stIndex(st), gs = topicsOf(st).map(t => topicGlance(st, ix, t.id)!).filter(Boolean);
    const g = gs.find(x => x.isFocus && x.next) ?? gs.find(x => x.next) ?? null;
    const pc = buildContext(data, k, '');
    ctx.study = { course: g?.next ? ref(g.next.id, g.next.title) : null, nextTask: g?.nextTask ? ref(g.nextTask.id, g.nextTask.title) : null,
      topics: topicsOf(st).map(t => cut(t.title, L.titleChars)).filter(Boolean).slice(0, L.list), revisionDue: dueIds(data, k).length,
      energy: pc.energy, freeMinutes: freeOf(pc) };
    parts.push(SENDS.study);
  } else if (page === 'course' && id) {
    const c = stIndex(data.study).course.get(id)?.node;
    if (c) {
      // In course order, until the counts — or about 9,000 characters, so a request always fits — are reached.
      let sections = 0, tasks = 0, size = 0;
      const modules = [], BUDGET = 9000;
      for (const m of c.modules.slice(0, L.courseModules)) {
        const secs = [];
        for (const sc of m.sections) {
          if (sections >= L.courseSections || size > BUDGET) break;
          const ts = [];
          for (const t of sc.tasks) {
            if (tasks >= L.courseTasks || size > BUDGET) break;
            const row = { id: t.id, title: cut(t.title, 80), minutes: t.minutes, kind: t.kind, done: t.done };
            size += JSON.stringify(row).length; tasks++; ts.push(row);
          }
          sections++; size += sc.title.length + 40;
          secs.push({ id: sc.id, title: cut(sc.title, L.titleChars), tasks: ts });
        }
        size += m.title.length + 40;
        modules.push({ id: m.id, title: cut(m.title, L.titleChars), sections: secs });
      }
      ctx.course = { id: c.id, title: cut(c.title, L.titleChars), minutes: c.minutes, modules };
      parts.push(SENDS.course);
    }
  } else if (page === 'project' && id) {
    const p = data.projects.items.find(x => x.id === id);
    if (p && !reach.project(p)) here = 'project';
    else if (p) {
      const withText = !!data.patterns.prefs.aiNotes;
      ctx.project = projectSlice(data, p).project;
      // For "What am I missing?", the one decision.
      const dc = focus?.decisionId ? p.decisions?.find(x => x.id === focus.decisionId) : undefined;
      const pt = (list: string[]) => list.slice(0, L.decisionPoints).map(t => cut(t, L.pointChars));
      if (dc) ctx.project.decision = { id: dc.id, question: cut(dc.question, L.questionChars), options: dc.options.slice(0, L.decisionOptions).map(o => ({ id: o.id, text: cut(o.text, L.titleChars), pros: pt(o.pros), cons: pt(o.cons) })) };
      // A business idea's one page, only when you ask from its Model tab (your choice, 17 Oct 2026). Not what you found.
      const m = isBusiness(p) && hash.replace(/^#/, '').split('/')[3] === 'model' ? p.model : undefined;
      if (m) ctx.project.onePage = { problem: cut(m.problem, L.answerChars), who: cut(m.who, L.answerChars), how: cut(m.how, L.answerChars),
        mustBeTrue: m.assumptions.slice(0, L.beliefs).map(a => ({ text: cut(a.text, L.beliefChars), state: a.state })) };
      parts.push(SENDS.project(withText));
      if (dc) parts.push(SENDS.decision);
      if (m) parts.push(SENDS.onePage);
    }
  } else if (page === 'note' && id) {
    const n = data.notes.items.find(x => x.id === id);
    if (n && !reach.note(n)) { privateNote = true; here = 'note'; }
    else if (n) { ctx.note = { id: n.id, title: cut(n.title, L.titleChars), text: cut(n.text, L.noteTextChars) }; parts.push(SENDS.note); }
  } else if (page === 'task' && id) {
    const t = data.tasks.items.find(x => x.id === id);
    if (t && !reach.task(t)) here = 'task';
    else if (t) { ctx.task = { id: t.id, title: cut(t.title, L.titleChars), due: t.due, minutes: t.minutes, notes: cut(t.notes, L.taskNotesChars) }; parts.push(SENDS.task); }
  } else if (page === 'review') {
    // The weekly review (1.37.0): counts and names only, and nothing of a project you've made private.
    const w = whatMoved(data, k), wait = whatsWaiting(data, k);
    const taskPrivate = (tid?: string) => { const t = tid ? data.tasks.items.find(x => x.id === tid) : undefined; return inPrivate(t?.projectId); };
    const moved = w.projects.filter(m => reach.project(m.project)), waitShown = wait.filter(x => !inPrivate(x.projectId) && !taskPrivate(x.taskId));
    const focus = focusProjects(data, shift(k, 1)).filter(reach.project);
    count += w.projects.length - moved.length + wait.length - waitShown.length;
    ctx.review = { from: w.from, to: w.to, moved: moved.slice(0, L.reviewProjects).map(m => ({ project: cut(m.project.title, L.titleChars), tasks: m.tasks, milestones: m.milestones, decisions: m.decisions, found: m.found, recorded: m.recorded })),
      otherTasks: w.otherTasks, studySessions: w.studySessions, studyMinutes: w.studyMinutes, workouts: w.workouts,
      waiting: waitShown.slice(0, L.reviewWaiting).map(x => cut(x.text, L.reviewWaitingChars)), focus: focus.slice(0, L.reviewFocus).map(p => cut(p.title, L.titleChars)) };
    parts.push(SENDS.review);
  } else if (page === 'calendar') {
    const all = data.commitments.filter(c => c.kind === 'appointment' && c.start.slice(0, 10) === k).sort((a, b) => a.start.localeCompare(b.start));
    const appts = all.filter(reach.appointment).slice(0, L.list);
    count += all.length - all.filter(reach.appointment).length;
    ctx.calendar = { day: k, appointments: appts.map(c => ({ id: c.id, title: cut(c.title, L.titleChars), time: c.start.slice(11, 16) })) };
    parts.push(SENDS.calendar);
  }
  return { page, context: ctx, sends: sendsLine(parts, here), privateNote, held: { here, count } };
}

// A project as its page sends it — and as Ask MyDay's look at a project sends it (v19): its name, summary, stage, tasks,
// milestones (titles, reached or not, the date aimed for) and note titles, their text only with AI help with notes on;
// never a private note of it (`heldNotes`, how many, stays on this device). Never its outcome, what counts as finished or
// where you left off.
export function projectSlice(data: MyDayData, p: Project): { project: NonNullable<AskPageContext['project']>; heldNotes: number } {
  const all = projectNotes(data, p), notes = all.filter(aiReach(data).note), withText = !!data.patterns.prefs.aiNotes;
  let text = '';
  if (withText) for (const n of notes) { const add = `${noteName(n)}: ${n.text.trim()}\n`; if (text.length + add.length > L.projectNotesChars) break; text += add; }
  return { heldNotes: all.length - notes.length, project: { id: p.id, title: cut(p.title, L.titleChars), summary: cut(p.summary, L.summaryChars), stage: p.stage,
    tasks: (({ open, done }) => [...open, ...done])(projectTasks(data, p)).slice(0, L.list).map(t => ({ ...ref(t.id, t.title), done: t.done })), notes: notes.slice(0, L.list).map(n => cut(noteName(n), L.titleChars)),
    ...(withText && text ? { notesText: text.trim() } : {}),
    ...(p.milestones?.length ? { milestones: p.milestones.slice(0, L.milestones).map(m => ({ id: m.id, title: cut(m.title, L.titleChars), reached: !!m.reachedOn, aim: m.aim })) } : {}) } };
}

// This app can look in your notes when an answer needs them (`can`); the second time round, `lookup` is what it found
// (ai/lookup.ts, through the privacy rules). One lookup per question.
export function askContext(slice: AskSlice, text: string, k: DateKey = todayKey(), now = new Date(), followUp?: { previous: string; text: string }, lookup?: AskLookup): AskContext {
  return {
    version: 1, action: 'ask', date: k, weekday: parseKey(k).toLocaleDateString('en-GB', { weekday: 'long' }),
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    page: slice.page, text: cut(text.trim(), L.textChars), ...(followUp ? { followUp: { previous: cut(followUp.previous, L.previousChars), text: cut(followUp.text.trim(), L.followUpChars) } } : {}),
    context: slice.context,
    // A project can be looked at only where open projects' names go with the question (one of them is named by its id).
    // Your open decisions and what you're waiting on carry project names, so they aren't offered on Finance or Health —
    // but they are with no open projects (a wait needn't be in one).
    // What to study next: not on Study or a course, which send their own.
    can: [...ASK_TOOLS].filter(t => t === 'project' ? !!slice.context.projects?.length : t === 'decisions' || t === 'waiting' ? slice.page !== 'finance' && slice.page !== 'health'
      : t === 'study' ? !slice.context.study && !slice.context.course : true), ...(lookup ? { lookup } : {}),
  };
}

// ---------- What you see before you tap: the request itself, in words ----------
// Built from the very request that would be sent (askContext's result), so the preview can't drift from what's shared.
export interface AskPreview { short: string[]; all: { label: string; lines: string[] }[] }
const PAGE_WORD: Record<AskPage, string> = { today: 'Today', tasks: 'Tasks', task: 'A task', calendar: 'Calendar', projects: 'Projects', project: 'A project',
  notes: 'Notes', note: 'A note', study: 'Study', course: 'A Study course', health: 'Health', finance: 'Finance', review: 'Your week', other: 'Elsewhere in MyDay' };
const energyWord = (e: number | null | undefined) => (e ? `${e} of 5` : 'not set yet');
const freeWord = (m: number | null | undefined) => (m === null || m === undefined ? 'not worked out' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`);
const clip = (s: string, n = 160) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const n = (count: number, one: string, many = one + 's') => `${count} ${count === 1 ? one : many}`;
const STATE_WORD = { open: 'not checked yet', 'looks-true': 'looks true', 'doesnt-hold': 'doesn’t hold' } as const;

export function askPreview(c: AskContext, privateNote = false, held?: AskSlice['held']): AskPreview {
  const x = c.context, short: string[] = [], all: AskPreview['all'] = [];
  all.push({ label: 'What you typed', lines: [c.text || '(nothing yet)', ...(c.followUp ? [`and then: “${c.followUp.text}”`] : [])] });
  all.push({ label: 'When and where', lines: [`${prettyDate(c.date)}, ${c.time}`, `Page: ${PAGE_WORD[c.page]}`] });
  if (x.today) {
    const t = x.today;
    short.push(`Energy ${energyWord(t.energy)}`, `Free time ${freeWord(t.freeMinutes)}`, n(t.plan.length, 'task') + ' on today’s plan', n(t.dueToday.length, 'task') + ' due today');
    all.push({ label: 'Today', lines: [`Energy: ${energyWord(t.energy)}`, `Free time: ${freeWord(t.freeMinutes)}`, ...(t.revisionDue !== undefined ? [`Revision due: ${n(t.revisionDue, 'card')}`] : [])] });
    if (t.plan.length) all.push({ label: 'Today’s plan', lines: t.plan.map(p => `${p.done ? '✓ ' : ''}${p.title} (${p.minutes} min)`) });
    if (t.dueToday.length) all.push({ label: 'Due today', lines: t.dueToday.map(d => d.title) });
  }
  if (x.study) {
    const s = x.study;
    short.push(`Course: ${s.course ? clip(s.course.title, 40) : 'none yet'}`, ...(s.nextTask ? [`Next: ${clip(s.nextTask.title, 40)}`] : []),
      ...(s.energy !== undefined ? [`Energy ${energyWord(s.energy)}`] : []), ...(s.freeMinutes !== undefined ? [`Free time ${freeWord(s.freeMinutes)}`] : []));
    all.push({ label: 'Study', lines: [`Current course: ${s.course?.title ?? 'none yet'}`, `Next task: ${s.nextTask?.title ?? 'none'}`, `Revision due: ${n(s.revisionDue, 'card')}`,
      ...(s.energy !== undefined ? [`Energy: ${energyWord(s.energy)}`] : []), ...(s.freeMinutes !== undefined ? [`Free time: ${freeWord(s.freeMinutes)}`] : [])] });
    if (s.topics.length) all.push({ label: 'Your topics', lines: s.topics });
  }
  if (x.course) {
    const co = x.course, secs = co.modules.flatMap(m => m.sections), tks = secs.flatMap(sc => sc.tasks);
    short.push(`Course: ${clip(co.title, 40)}`, `${n(co.modules.length, 'module')}, ${n(secs.length, 'section')}, ${n(tks.length, 'task')}`);
    all.push({ label: 'This course', lines: [`Name: ${co.title}`, `Usual session: ${co.minutes} min`] });
    if (secs.length) all.push({ label: 'Its outline', lines: co.modules.flatMap(m => m.sections.map(sc => `${m.title ? m.title + ' › ' : ''}${sc.title || 'Untitled section'}: ${sc.tasks.length ? sc.tasks.map(t => `${t.done ? '✓ ' : ''}${t.title}`).join('; ') : 'no tasks yet'}`)) });
  }
  if (x.project) {
    const p = x.project;
    short.push(`Project: ${clip(p.title, 40)}`, `${n(p.tasks.length, 'task')}, ${n(p.notes.length, 'note title')}${p.notesText ? ' and their text' : ''}`);
    all.push({ label: 'This project', lines: [`Name: ${p.title}`, `Summary: ${p.summary ? clip(p.summary) : '(none)'}`, `Stage: ${p.stage.charAt(0).toUpperCase() + p.stage.slice(1)}`] });
    if (p.tasks.length) all.push({ label: 'Its tasks', lines: p.tasks.map(t => `${t.done ? '✓ ' : ''}${t.title}`) });
    if (p.notes.length) all.push({ label: 'Its notes (titles)', lines: p.notes });
    if (p.notesText) all.push({ label: 'Its notes’ text (AI help with notes is on; private notes left out)', lines: [clip(p.notesText, 300)] });
    if (p.milestones?.length) {
      short.push(n(p.milestones.length, 'milestone'));
      all.push({ label: 'Its milestones', lines: p.milestones.map(m => `${m.reached ? '✓ ' : ''}${m.title}${m.aim && !m.reached ? ` (aiming for ${m.aim})` : ''}`) });
    }
    if (p.onePage) {
      const op = p.onePage, said = [op.problem, op.who, op.how].filter(a => a.trim()).length;
      short.push(`One page: ${n(said, 'answer')}, ${n(op.mustBeTrue.length, 'thing', 'things')} that must be true`);
      all.push({ label: 'Its one page', lines: [`What problem it solves: ${op.problem.trim() ? clip(op.problem, 300) : '(not answered yet)'}`, `Who it’s for: ${op.who.trim() ? clip(op.who, 300) : '(not answered yet)'}`,
        `How it works and pays: ${op.how.trim() ? clip(op.how, 300) : '(not answered yet)'}`] });
      if (op.mustBeTrue.length) all.push({ label: 'What must be true (what you found isn’t sent)', lines: op.mustBeTrue.map(b => `${b.text} — ${STATE_WORD[b.state]}`) });
    }
    if (p.decision) {
      const dc = p.decision;
      short.push(`Decision: ${clip(dc.question, 40)}`);
      all.push({ label: 'The decision you asked about', lines: [dc.question, ...dc.options.map(o => `${o.text} — pros: ${o.pros.join('; ') || 'none yet'}; cons: ${o.cons.join('; ') || 'none yet'}`), `Up to the first ${L.decisionPoints} pros and ${L.decisionPoints} cons per option are sent.`] });
    }
  }
  if (x.note) {
    short.push(`This note: ${clip(x.note.title || x.note.text, 40)}`);
    all.push({ label: 'This note', lines: [...(x.note.title ? [`Title: ${x.note.title}`] : []), `Text: ${clip(x.note.text, 300)}`] });
  }
  if (privateNote) { short.push('This note: not sent (private)'); all.push({ label: 'This note', lines: ['Not sent — it’s private.'] }); }
  if (held?.here === 'project') { short.push('This project: not sent (private)'); all.push({ label: 'This project', lines: ['Not sent — you made it private.'] }); }
  if (held?.here === 'task') { short.push('This task: not sent (private project)'); all.push({ label: 'This task', lines: ['Not sent — its project is private.'] }); }
  if (held?.count) { short.push(`${n(held.count, 'item')} from private projects not sent`); all.push({ label: 'Left out (you made their projects private)', lines: [`${n(held.count, 'item')} — project names, tasks or appointments`] }); }
  if (x.task) {
    short.push(`Task: ${clip(x.task.title, 40)}`);
    all.push({ label: 'This task', lines: [`Title: ${x.task.title}`, `Due: ${x.task.due ?? 'no date'}`, `About ${x.task.minutes} min`, ...(x.task.notes ? [`Notes: ${clip(x.task.notes)}`] : [])] });
  }
  if (x.review) {
    const r = x.review;
    short.push(`Your week: ${n(r.moved.length, 'project')} moved`, ...(r.waiting.length ? [`${n(r.waiting.length, 'thing')} need${r.waiting.length === 1 ? 's' : ''} you`] : []));
    all.push({ label: `Your week (${r.from} to ${r.to})`, lines: [...r.moved.map(m => `${m.project}: ${[m.tasks && `${m.tasks} tasks done`, m.milestones && `${m.milestones} milestones`, m.decisions && `${m.decisions} decisions`, m.found && `${m.found} found out`, m.recorded && `${m.recorded} recorded`].filter(Boolean).join(', ')}`),
      `Other tasks done: ${r.otherTasks}`, `Study: ${r.studySessions} sessions, ${r.studyMinutes} min`, `Workouts: ${r.workouts}`] });
    if (r.waiting.length) all.push({ label: 'What needs you', lines: r.waiting });
    if (r.focus.length) all.push({ label: 'Next week’s focus', lines: r.focus });
  }
  if (x.calendar) {
    short.push(n(x.calendar.appointments.length, 'appointment') + ' today');
    all.push({ label: 'Today’s appointments', lines: x.calendar.appointments.length ? x.calendar.appointments.map(a => `${a.time} ${a.title}`) : ['none'] });
  }
  if (x.projects?.length) { short.push(n(x.projects.length, 'open project name')); all.push({ label: 'Your open projects (names only)', lines: x.projects.map(p => p.title) }); }
  if (!short.length) short.push('What you typed and the date');
  if (c.can?.includes('notes')) {
    const projects = c.can.includes('project');
    const looks = ['in your notes', ...(c.can.includes('day') ? ['at a day'] : []), ...(projects ? ['at one of your projects'] : []), ...(c.can.includes('decisions') ? ['at your open decisions'] : []), ...(c.can.includes('waiting') ? ['at what you’re waiting on'] : []), ...(c.can.includes('study') ? ['at what to study next'] : [])];
    short.push(`If needed, a look ${looks.length > 1 ? `${looks.slice(0, -1).join(', ')} or ${looks[looks.length - 1]}` : looks[0]}`);
    all.push({ label: 'If it needs to: your notes', lines: ['Ask MyDay may look in your notes for words from your question, on this device, and send up to 8 that match: their titles and projects, and a short snippet only with AI help with notes on.', 'Never a private note, or a note in a private project — not even whether one matched.'] });
    if (c.can.includes('day')) all.push({ label: 'If it needs to: a day', lines: ['Or at one day you ask about (from a week ago to two months ahead): its plan’s tasks, what’s due, busy times by kind only (never an appointment’s name), free time and energy.', 'Never a private project’s tasks; its appointments only as busy time.'] });
    if (projects) all.push({ label: 'If it needs to: one of your projects', lines: ['Or at one of your open projects you ask about by name: what its own page sends — its name, summary, stage, tasks, milestones and note titles (their text only with AI help with notes on).', 'Never a private project, or a private note of it; never its outcome, what counts as finished or where you left off.'] });
    if (c.can.includes('decisions')) all.push({ label: 'If it needs to: your open decisions', lines: ['Or at your open decisions (across your open projects, or one you name): each one’s question and options, which options have no pros or cons yet (never what any say) and the day it was opened; and what a business idea still has to check.', 'Never a private project’s; never your reasons, earlier choices or what you found.'] });
    if (c.can.includes('waiting')) all.push({ label: 'If it needs to: what you’re waiting on', lines: ['Or at the tasks you’ve marked as waiting (all of them, or one project’s): each one’s title, its project, since when and the day you expect it, and whether its Chase task is there.', 'Never who or what it’s waiting on, and never a private project’s.'] });
    if (c.can.includes('study')) all.push({ label: 'If it needs to: what to study next', lines: ['Or at the same next steps as your Today card (your focus first): each subject’s lesson or task, its reason, the suggested minutes and length, and how much is due to revise.', 'No percentages, and nothing else of your Study.'] });
  }
  return { short, all };
}
