// What "Ask MyDay" sends from the page you're on (the AI design, 17 Oct 2026): what you typed, the date and time, the
// page's name and that page's small slice of your data — the same slice the "Sends:" line describes before you tap.
// Never a private note; Finance and Health send only the page's name; a project's notes' text only with "AI help with
// notes" switched on.
import { ASK_LIMITS as L, type AskContext, type AskPage, type AskPageContext } from '../../../supabase/functions/_shared/ai/ask-shape.ts';
import { parseKey, todayKey } from '../data/dates';
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
  if (top === 'study' || top === 'calendar' || top === 'health' || top === 'finance') return { page: top, id: null };
  return { page: 'other', id: null };
}

export interface AskSlice { page: AskPage; context: AskPageContext; sends: string; privateNote: boolean }

// The slice for a page, and the words for the "Sends:" line.
export function askSlice(data: MyDayData, hash: string, k: DateKey = todayKey()): AskSlice {
  const { page, id } = askPage(hash);
  const ctx: AskPageContext = {}, parts: string[] = [];
  let privateNote = false;
  const open = data.projects.items.filter(p => p.status !== 'done').slice(0, L.list);
  if (open.length && page !== 'finance' && page !== 'health') { ctx.projects = open.map(p => ref(p.id, p.title)); parts.push('your open projects’ names'); }
  if (page === 'today') {
    const pc = buildContext(data, k, '');
    const free = pc.free.reduce((a, f) => a + Math.max(0, toMin(f.end) - toMin(f.start)), 0);
    const due = data.tasks.items.filter(t => !t.done && !t.letGoOn && t.due === k).slice(0, L.list);
    ctx.today = { energy: pc.energy, freeMinutes: pc.free.length ? free : null,
      plan: pc.tasks.slice(0, L.list).map(t => ({ ...ref(t.id, t.title), minutes: t.minutes, done: t.done })), dueToday: due.map(t => ref(t.id, t.title)) };
    parts.push("today's plan, your energy, your free time and tasks due today");
  } else if (page === 'study') {
    const st = data.study, ix = stIndex(st), gs = topicsOf(st).map(t => topicGlance(st, ix, t.id)!).filter(Boolean);
    const g = gs.find(x => x.isFocus && x.next) ?? gs.find(x => x.next) ?? null;
    ctx.study = { course: g?.next ? ref(g.next.id, g.next.title) : null, nextTask: g?.nextTask ? ref(g.nextTask.id, g.nextTask.title) : null,
      topics: topicsOf(st).map(t => cut(t.title, L.titleChars)).filter(Boolean).slice(0, L.list), revisionDue: dueIds(data, k).length };
    parts.push('your current course and next task, your topics and how much revision is due');
  } else if (page === 'project' && id) {
    const p = data.projects.items.find(x => x.id === id);
    if (p) {
      const notes = projectNotes(data, p).filter(n => !n.private), withText = !!data.patterns.prefs.aiNotes;
      let text = '';
      if (withText) for (const n of notes) { const add = `${noteName(n)}: ${n.text.trim()}\n`; if (text.length + add.length > L.projectNotesChars) break; text += add; }
      ctx.project = { id: p.id, title: cut(p.title, L.titleChars), summary: cut(p.summary, L.summaryChars), stage: p.stage,
        tasks: (({ open, done }) => [...open, ...done])(projectTasks(data, p)).slice(0, L.list).map(t => ({ ...ref(t.id, t.title), done: t.done })), notes: notes.slice(0, L.list).map(n => cut(noteName(n), L.titleChars)),
        ...(withText && text ? { notesText: text.trim() } : {}) };
      parts.push(`this project’s name, summary, stage, tasks and note titles${withText ? ' and text (not private ones)' : ''}`);
    }
  } else if (page === 'note' && id) {
    const n = data.notes.items.find(x => x.id === id);
    if (n?.private) privateNote = true;
    else if (n) { ctx.note = { id: n.id, title: cut(n.title, L.titleChars), text: cut(n.text, L.noteTextChars) }; parts.push('this note'); }
  } else if (page === 'task' && id) {
    const t = data.tasks.items.find(x => x.id === id);
    if (t) { ctx.task = { id: t.id, title: cut(t.title, L.titleChars), due: t.due, minutes: t.minutes, notes: cut(t.notes, L.taskNotesChars) }; parts.push('this task'); }
  } else if (page === 'calendar') {
    const appts = data.commitments.filter(c => c.kind === 'appointment' && c.start.slice(0, 10) === k).sort((a, b) => a.start.localeCompare(b.start)).slice(0, L.list);
    ctx.calendar = { day: k, appointments: appts.map(c => ({ title: cut(c.title, L.titleChars), time: c.start.slice(11, 16) })) };
    parts.push("today's appointments");
  }
  const listed = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  const sends = `what you typed, the date${listed ? ', ' + listed : ''}${privateNote ? ' — not this note, it’s private' : ''}`;
  return { page, context: ctx, sends, privateNote };
}

export function askContext(slice: AskSlice, text: string, k: DateKey = todayKey(), now = new Date(), followUp?: { previous: string; text: string }): AskContext {
  return {
    version: 1, action: 'ask', date: k, weekday: parseKey(k).toLocaleDateString('en-GB', { weekday: 'long' }),
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    page: slice.page, text: cut(text.trim(), L.textChars), ...(followUp ? { followUp: { previous: cut(followUp.previous, L.previousChars), text: cut(followUp.text.trim(), L.followUpChars) } } : {}),
    context: slice.context,
  };
}
