// What "Ask MyDay" sends from the page you're on (the AI design, 17 Oct 2026): what you typed, the date and time, the
// page's name and that page's small slice of your data — the same slice the "Sends:" line describes before you tap.
// Never a private note; Finance and Health send only the page's name; a project's notes' text only with "AI help with
// notes" switched on.
import { ASK_LIMITS as L, type AskContext, type AskPage, type AskPageContext } from '../../../supabase/functions/_shared/ai/ask-shape.ts';
import { parseKey, prettyDate, todayKey } from '../data/dates';
import { noteName } from '../data/notes';
import { projectNotes, projectTasks } from '../data/projects';
import { stIndex } from '../data/study/roadmap';
import { dueIds } from '../data/study/queue';
import { topicGlance, topicsOf } from '../data/study/topics';
import type { DateKey, MyDayData } from '../data/types';
import { notesRoute } from '../notes/route';
import { tasksRoute } from '../tasks/route';
import { buildContext } from './context';

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
  if (top === 'calendar' || top === 'health' || top === 'finance') return { page: top, id: null };
  return { page: 'other', id: null };
}

export interface AskSlice { page: AskPage; context: AskPageContext; sends: string; privateNote: boolean }

// The words for what each page sends — shared by the "Sends:" line and the What MyDay knows page, so they can't drift.
export const SENDS = {
  openProjects: 'your open projects’ names',
  today: "today's plan, your energy, your free time, tasks due today and how much revision is due",
  study: 'your current course and next task, your topics, how much revision is due, and your energy and free time today',
  course: 'this course’s outline (its modules, sections and tasks — titles and lengths only)',
  project: (withText: boolean) => `this project’s name, summary, stage, tasks and note titles${withText ? ' and text (not private ones)' : ''}`,
  note: 'this note', task: 'this task', calendar: "today's appointments",
} as const;
function sendsLine(parts: string[], privateNote = false): string {
  const listed = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  return `what you typed, the date${listed ? ', ' + listed : ''}${privateNote ? ' — not this note, it’s private' : ''}`;
}
// What a page sends when it has everything it can send (open projects, the thing it shows) — for What MyDay knows.
export function sendsFor(page: AskPage, aiNotes: boolean): string {
  const parts: string[] = page === 'finance' || page === 'health' ? [] : [SENDS.openProjects];
  const own = page === 'project' ? SENDS.project(aiNotes) : page in SENDS ? SENDS[page as 'today'] : null;
  if (typeof own === 'string') parts.push(own);
  return sendsLine(parts);
}

// The slice for a page, and the words for the "Sends:" line.
export function askSlice(data: MyDayData, hash: string, k: DateKey = todayKey()): AskSlice {
  const { page, id } = askPage(hash);
  const ctx: AskPageContext = {}, parts: string[] = [];
  let privateNote = false;
  const open = data.projects.items.filter(p => p.status !== 'done').slice(0, L.list);
  if (open.length && page !== 'finance' && page !== 'health') { ctx.projects = open.map(p => ref(p.id, p.title)); parts.push(SENDS.openProjects); }
  if (page === 'today') {
    const pc = buildContext(data, k, '');
    const due = data.tasks.items.filter(t => !t.done && !t.letGoOn && t.due === k).slice(0, L.list);
    ctx.today = { energy: pc.energy, freeMinutes: freeOf(pc), revisionDue: dueIds(data, k).length,
      plan: pc.tasks.slice(0, L.list).map(t => ({ ...ref(t.id, t.title), minutes: t.minutes, done: t.done })), dueToday: due.map(t => ref(t.id, t.title)) };
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
    if (p) {
      const notes = projectNotes(data, p).filter(n => !n.private), withText = !!data.patterns.prefs.aiNotes;
      let text = '';
      if (withText) for (const n of notes) { const add = `${noteName(n)}: ${n.text.trim()}\n`; if (text.length + add.length > L.projectNotesChars) break; text += add; }
      ctx.project = { id: p.id, title: cut(p.title, L.titleChars), summary: cut(p.summary, L.summaryChars), stage: p.stage,
        tasks: (({ open, done }) => [...open, ...done])(projectTasks(data, p)).slice(0, L.list).map(t => ({ ...ref(t.id, t.title), done: t.done })), notes: notes.slice(0, L.list).map(n => cut(noteName(n), L.titleChars)),
        ...(withText && text ? { notesText: text.trim() } : {}) };
      parts.push(SENDS.project(withText));
    }
  } else if (page === 'note' && id) {
    const n = data.notes.items.find(x => x.id === id);
    if (n?.private) privateNote = true;
    else if (n) { ctx.note = { id: n.id, title: cut(n.title, L.titleChars), text: cut(n.text, L.noteTextChars) }; parts.push(SENDS.note); }
  } else if (page === 'task' && id) {
    const t = data.tasks.items.find(x => x.id === id);
    if (t) { ctx.task = { id: t.id, title: cut(t.title, L.titleChars), due: t.due, minutes: t.minutes, notes: cut(t.notes, L.taskNotesChars) }; parts.push(SENDS.task); }
  } else if (page === 'calendar') {
    const appts = data.commitments.filter(c => c.kind === 'appointment' && c.start.slice(0, 10) === k).sort((a, b) => a.start.localeCompare(b.start)).slice(0, L.list);
    ctx.calendar = { day: k, appointments: appts.map(c => ({ id: c.id, title: cut(c.title, L.titleChars), time: c.start.slice(11, 16) })) };
    parts.push(SENDS.calendar);
  }
  return { page, context: ctx, sends: sendsLine(parts, privateNote), privateNote };
}

export function askContext(slice: AskSlice, text: string, k: DateKey = todayKey(), now = new Date(), followUp?: { previous: string; text: string }): AskContext {
  return {
    version: 1, action: 'ask', date: k, weekday: parseKey(k).toLocaleDateString('en-GB', { weekday: 'long' }),
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    page: slice.page, text: cut(text.trim(), L.textChars), ...(followUp ? { followUp: { previous: cut(followUp.previous, L.previousChars), text: cut(followUp.text.trim(), L.followUpChars) } } : {}),
    context: slice.context,
  };
}

// ---------- What you see before you tap: the request itself, in words ----------
// Built from the very request that would be sent (askContext's result), so the preview can't drift from what's shared.
export interface AskPreview { short: string[]; all: { label: string; lines: string[] }[] }
const PAGE_WORD: Record<AskPage, string> = { today: 'Today', tasks: 'Tasks', task: 'A task', calendar: 'Calendar', projects: 'Projects', project: 'A project',
  notes: 'Notes', note: 'A note', study: 'Study', course: 'A Study course', health: 'Health', finance: 'Finance', other: 'Elsewhere in MyDay' };
const energyWord = (e: number | null | undefined) => (e ? `${e} of 5` : 'not set yet');
const freeWord = (m: number | null | undefined) => (m === null || m === undefined ? 'not worked out' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`);
const clip = (s: string, n = 160) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const n = (count: number, one: string, many = one + 's') => `${count} ${count === 1 ? one : many}`;

export function askPreview(c: AskContext, privateNote = false): AskPreview {
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
  }
  if (x.note) {
    short.push(`This note: ${clip(x.note.title || x.note.text, 40)}`);
    all.push({ label: 'This note', lines: [...(x.note.title ? [`Title: ${x.note.title}`] : []), `Text: ${clip(x.note.text, 300)}`] });
  }
  if (privateNote) { short.push('This note: not sent (private)'); all.push({ label: 'This note', lines: ['Not sent — it’s private.'] }); }
  if (x.task) {
    short.push(`Task: ${clip(x.task.title, 40)}`);
    all.push({ label: 'This task', lines: [`Title: ${x.task.title}`, `Due: ${x.task.due ?? 'no date'}`, `About ${x.task.minutes} min`, ...(x.task.notes ? [`Notes: ${clip(x.task.notes)}`] : [])] });
  }
  if (x.calendar) {
    short.push(n(x.calendar.appointments.length, 'appointment') + ' today');
    all.push({ label: 'Today’s appointments', lines: x.calendar.appointments.length ? x.calendar.appointments.map(a => `${a.time} ${a.title}`) : ['none'] });
  }
  if (x.projects?.length) { short.push(n(x.projects.length, 'open project name')); all.push({ label: 'Your open projects (names only)', lines: x.projects.map(p => p.title) }); }
  if (!short.length) short.push('Only what you typed and the date');
  return { short, all };
}
