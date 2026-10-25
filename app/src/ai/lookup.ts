// Ask MyDay's lookups (specs/ai-tools.md §3): when an answer needs something from your notes, the app looks on this
// device — read-only, through the privacy rules (reach.ts) — and sends only what it found the second time round.
// "Search your notes": every word must appear, in any order, as in project search (capitals, accents and the kind of
// apostrophe don't matter). A note's text is searched, and a short snippet of it sent, only with "AI help with notes" on;
// otherwise only titles. Private notes, and notes in a private project, are never sent — not even how many matched: that
// count (`leftOut`) stays on this device, for the panel's "1 private note left out".
import { ASK_LIMITS as L, DAY_KINDS, type AskDayLookup, type AskDecisionsLookup, type AskLookup, type AskNotesLookup, type AskProjectLookup, type AskStudyLookup, type AskWaitingLookup } from '../../../supabase/functions/_shared/ai/ask-shape.ts';
import { parseKey, prettyDate, shift, todayKey } from '../data/dates';
import { noteName } from '../data/notes';
import { excerptOf, fold, wordsOf } from '../data/projectSearch';
import { onTodaysPlan } from '../data/tasks';
import type { DateKey, MyDayData, Note } from '../data/types';
import { isBusiness } from '../data/businessModel';
import { dueIds } from '../data/study/queue';
import { learningOptions } from '../study/nextLearning';
import { projectSlice } from './askContext';
import { buildContext } from './context';
import { aiReach } from './reach';

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

export function notesLookup(data: MyDayData, query: string): { lookup: AskNotesLookup; leftOut: number } {
  const reach = aiReach(data), withText = !!data.patterns.prefs.aiNotes;
  const q = cut(query.trim().replace(/\s+/g, ' '), L.lookupQueryChars), words = wordsOf(q);
  // Its name: the title, or (only with notes' text shared) the first line of an untitled note; otherwise "Untitled note".
  const name = (n: Note) => (withText ? noteName(n) : n.title.trim() || 'Untitled note');
  const matches = (n: Note) => words.length > 0 && words.every(w => fold(withText ? `${n.title}\n${n.text}` : n.title).includes(w));
  const all = data.notes.items.filter(matches);
  const shown = all.filter(n => reach.note(n)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const projectName = (id?: string | null) => { const p = id ? data.projects.items.find(x => x.id === id) : undefined; return p && reach.project(p) ? cut(p.title, L.titleChars) : null; };
  return {
    lookup: {
      tool: 'notes', query: q,
      notes: shown.slice(0, L.lookupNotes).map(n => ({
        id: n.id, title: cut(name(n), L.titleChars), project: projectName(n.projectId),
        snippet: withText ? (cut(excerptOf([n.text], words), L.lookupSnippetChars) || null) : null,
      })),
      found: shown.length, titlesOnly: !withText,
    },
    leftOut: all.length - shown.length,
  };
}

// "Your day" (v18): one day as the app sees it — from a week ago to two months ahead (null outside that). Its plan, with
// a private project's tasks left out (counted here only), tasks due that day not on the plan, busy times by kind only
// (never an appointment's name), free time and energy: the same rules as Help me adjust today and Ask's Today page.
export const DAY_BACK = 7, DAY_AHEAD = 60;
export function dayLookup(data: MyDayData, day: DateKey, today: DateKey = todayKey()): { lookup: AskDayLookup; leftOut: number } | null {
  if (day < shift(today, -DAY_BACK) || day > shift(today, DAY_AHEAD)) return null;
  const reach = aiReach(data), held = reach.heldOnPlan(day), d = data.days[day], pc = buildContext(data, day, '');
  const plan = d?.tasks ?? [], dueAll = data.tasks.items.filter(t => t.due === day && !t.done && !t.letGoOn && !onTodaysPlan(data, t, day));
  const due = dueAll.filter(reach.task);
  const tasks = plan.filter(t => !held.has(t.uid)).slice(0, L.dayTasks).map(t => ({ title: cut(t.title, L.titleChars), minutes: t.minutes, done: t.done, time: t.scheduledStart ? t.scheduledStart.slice(11, 16) : null }));
  return {
    lookup: {
      tool: 'day', query: day, weekday: parseKey(day).toLocaleDateString('en-GB', { weekday: 'long' }),
      planned: !!d && !d.rest, rest: !!d?.rest, energy: pc.energy ?? null,
      tasks, minutesLeft: tasks.reduce((sum, t) => sum + (t.done ? 0 : t.minutes), 0),
      due: due.slice(0, L.dayTasks).map(t => cut(t.title, L.titleChars)),
      busy: pc.busy.filter(b => (DAY_KINDS as readonly string[]).includes(b.kind)).slice(0, L.dayBusy).map(b => ({ kind: b.kind as AskDayLookup['busy'][number]['kind'], start: b.start, end: b.end })),
      free: pc.free.slice(0, L.dayFree),
    },
    leftOut: plan.filter(t => held.has(t.uid)).length + dueAll.length - due.length,
  };
}

// "A project's context" (v19): one of your open projects you asked about by name, exactly as its own page sends it
// (projectSlice). Null for a private project, a finished one or one that isn't there; its private notes are counted
// here only.
export function projectLookup(data: MyDayData, id: string): { lookup: AskProjectLookup; leftOut: number } | null {
  const p = data.projects.items.find(x => x.id === id);
  if (!p || p.status === 'done' || !aiReach(data).project(p)) return null;
  const { project, heldNotes } = projectSlice(data, p);
  return { lookup: { tool: 'project', query: p.id, project }, leftOut: heldNotes };
}

// "Open decisions" (v20): the decisions with nothing chosen yet, oldest first, across your open projects ("all") or in
// one (its id) — the question, its options' text, which have no pros or no cons yet ("“Van” has no cons yet", worked
// out here: the model misread counts), the day it was opened and whether it was reopened — and a business idea's must-be-true items not checked yet (text only, never
// what you found). Only the fields named here are picked (never a whole record: unknown fields stay behind). Never a
// private project's: those are counted here only (`leftOut`, for "all"). Null for a project that can't be looked at.
export function decisionsLookup(data: MyDayData, query: string): { lookup: AskDecisionsLookup; leftOut: number } | null {
  const reach = aiReach(data), open = data.projects.items.filter(p => p.status !== 'done');
  const one = query === 'all' ? null : open.find(p => p.id === query && reach.project(p));
  if (query !== 'all' && !one) return null;
  const shown = one ? [one] : open.filter(reach.project), held = one ? [] : open.filter(p => !reach.project(p));
  const undecided = (p: (typeof open)[number]) => (p.decisions ?? []).filter(d => d.chosen === null);
  const unchecked = (p: (typeof open)[number]) => (isBusiness(p) ? p.model?.assumptions ?? [] : []).filter(a => a.state === 'open');
  const ds = shown.flatMap(p => undecided(p).map(d => ({ p, d }))).sort((a, b) => a.d.createdAt.localeCompare(b.d.createdAt));
  const bs = shown.flatMap(p => unchecked(p).map(a => ({ p, a }))).sort((x, y) => x.a.createdAt.localeCompare(y.a.createdAt));
  return {
    lookup: {
      tool: 'decisions', query: one ? one.id : 'all',
      decisions: ds.slice(0, L.lookupDecisions).map(({ p, d }) => ({ id: d.id, projectId: p.id, project: cut(p.title, L.titleChars), question: cut(d.question, L.questionChars),
        options: d.options.slice(0, L.decisionOptions).map(o => cut(o.text, L.titleChars)),
        gaps: d.options.slice(0, L.decisionOptions).flatMap(o => { const t = `“${cut(o.text, L.titleChars - 2)}”`; return !o.pros.length && !o.cons.length ? [`${t} has no pros or cons yet`] : !o.pros.length ? [`${t} has no pros yet`] : !o.cons.length ? [`${t} has no cons yet`] : []; }),
        since: d.createdAt.slice(0, 10), reopened: !!d.lastChoice || (d.history?.length ?? 0) > 0 })),
      mustBeTrue: bs.slice(0, L.lookupBeliefs).map(({ p, a }) => ({ id: a.id, projectId: p.id, project: cut(p.title, L.titleChars), text: cut(a.text, L.beliefChars) })),
      found: { decisions: ds.length, mustBeTrue: bs.length },
    },
    leftOut: held.reduce((m, p) => m + undecided(p).length + unchecked(p).length, 0),
  };
}

// "What you're waiting on" (v21): tasks marked as waiting (not done or let go), the oldest wait first, across your tasks
// ("all") or one open project's (its id) — the title, its project, since when, when you expect it, and whether its
// "Chase:" task is there and still to do. Never who or what it waits on (`waiting.on`): only the fields named here are
// picked. Never a private project's task: those are counted here only (`leftOut`). Null for a project that can't be
// looked at.
export function waitingLookup(data: MyDayData, query: string): { lookup: AskWaitingLookup; leftOut: number } | null {
  const reach = aiReach(data);
  const one = query === 'all' ? null : data.projects.items.find(p => p.id === query && p.status !== 'done' && reach.project(p));
  if (query !== 'all' && !one) return null;
  const open = (id?: string | null) => { const t = id ? data.tasks.items.find(x => x.id === id) : undefined; return !!t && !t.done && !t.letGoOn; };
  const all = data.tasks.items.filter(t => t.waiting && !t.done && !t.letGoOn && (!one || t.projectId === one.id)).sort((a, b) => a.waiting!.since.localeCompare(b.waiting!.since));
  const shown = all.filter(reach.task);
  const projectOf = (id?: string) => (id ? data.projects.items.find(p => p.id === id) : undefined);
  return {
    lookup: {
      tool: 'waiting', query: one ? one.id : 'all', found: shown.length,
      tasks: shown.slice(0, L.lookupWaiting).map(t => { const p = projectOf(t.projectId); return { id: t.id, title: cut(t.title, L.titleChars), projectId: p ? p.id : null, project: p ? cut(p.title, L.titleChars) : null,
        since: t.waiting!.since, until: t.waiting!.until ?? null, chased: open(t.waiting!.chaseTaskId) }; }),
    },
    leftOut: all.length - shown.length,
  };
}

// "What to study next" (v22): the same next steps as Today's Study card (learningOptions), your focus first — each one's
// subject, lesson or task, detail and "Why this?" (its AI-safe wording, `aiWhy`), minutes and length, begun or not, a session to resume, revision first
// or the path ready — and how much is due to revise. Only these fields (no ids, links or open sessions' steps).
export function studyLookup(data: MyDayData, today: DateKey = todayKey()): { lookup: AskStudyLookup; leftOut: number; hrefs: Record<string, string> } {
  const options = learningOptions(data).slice(0, L.lookupStudy);
  return {
    lookup: {
      tool: 'study', query: 'all', revisionDue: dueIds(data, today).length,
      options: options.map(o => ({ subject: o.subject, label: cut(o.label, L.titleChars), title: cut(o.title, L.titleChars), detail: cut(o.detail, L.studyDetailChars), why: cut(o.aiWhy, L.studyWhyChars), // aiWhy: never your own revision note or a calendar block's name
        minutes: Math.max(0, Math.min(600, Math.round(o.minutes))), mode: o.mode ?? null, started: o.started, resume: o.resume, reviseFirst: !!o.revise, allComplete: o.allComplete })),
    },
    leftOut: 0, hrefs: Object.fromEntries(options.map(o => [o.subject, o.href])), // where each opens, kept on the device
  };
}

// What the panel says above the answer: "Looked in your notes for “van hire”: 3 notes — 1 private note left out." or
// "Looked at Thursday 30 October: 2 tasks planned, 1 due, 3 busy times — 1 private task left out."
export function lookupLine(l: AskLookup, held: number, projectTitle?: string): string {
  if (l.tool === 'day') {
    const parts = [l.rest ? 'a rest day' : l.planned ? `${l.tasks.length === 1 ? 'one task' : `${l.tasks.length} tasks`} planned` : 'no plan yet',
      ...(l.due.length ? [`${l.due.length} due`] : []), l.busy.length ? `${l.busy.length === 1 ? 'one busy time' : `${l.busy.length} busy times`}` : 'nothing booked'];
    return `Looked at ${prettyDate(l.query)}: ${parts.join(', ')}${held ? ` — ${held === 1 ? 'one private task' : `${held} private tasks`} left out` : ''}.`;
  }
  if (l.tool === 'study') {
    const [first, ...rest] = l.options;
    if (!first) return 'Looked at what to study next: nothing set up yet.';
    return `Looked at what to study next: ${first.label} first${rest.length ? `, then ${rest.map(o => o.label).join(' and ')}` : ''}${l.revisionDue ? ` — ${l.revisionDue === 1 ? 'one thing' : `${l.revisionDue} things`} to revise` : ''}.`;
  }
  if (l.tool === 'waiting') {
    const where = l.query === 'all' ? 'what you’re waiting on' : `what you’re waiting on in “${l.tasks[0]?.project ?? projectTitle ?? 'that project'}”`;
    return `Looked at ${where}: ${l.found ? (l.found === 1 ? 'one task' : `${l.found} tasks`) : 'nothing waiting'}${held ? ` — ${held === 1 ? 'one in a private project' : `${held} in private projects`} left out` : ''}.`;
  }
  if (l.tool === 'decisions') {
    const n = l.found.decisions, b = l.found.mustBeTrue, where = l.query === 'all' ? 'your open decisions' : `the open decisions in “${l.decisions[0]?.project ?? l.mustBeTrue[0]?.project ?? projectTitle ?? 'that project'}”`;
    const parts = [n ? (n === 1 ? 'one decision' : `${n} decisions`) : 'no decisions open', ...(b ? [b === 1 ? 'one thing to check' : `${b} things to check`] : [])];
    return `Looked at ${where}: ${parts.join(', ')}${held ? ` — ${held === 1 ? 'one in a private project' : `${held} in private projects`} left out` : ''}.`;
  }
  if (l.tool === 'project') {
    const t = l.project.tasks, done = t.filter(x => x.done).length, m = l.project.milestones?.length ?? 0, n = l.project.notes.length;
    const parts = [t.length ? `${t.length === 1 ? 'one task' : `${t.length} tasks`}${done ? ` (${done} done)` : ''}` : 'no tasks yet',
      ...(m ? [m === 1 ? 'one milestone' : `${m} milestones`] : []), ...(n ? [n === 1 ? 'one note' : `${n} notes`] : [])];
    return `Looked at your project “${l.project.title}”: ${parts.join(', ')}${held ? ` — ${held === 1 ? 'one private note' : `${held} private notes`} left out` : ''}.`;
  }
  const n = l.found;
  const found = n ? `${n === 1 ? 'one note' : `${n} notes`}${n > l.notes.length ? ` (the newest ${l.notes.length} sent)` : ''}` : held ? 'none that could be sent' : 'nothing matched';
  const extra = [held ? `${held === 1 ? 'one private note' : `${held} private notes`} left out` : '', l.titlesOnly ? 'titles only, as AI help with notes is off' : ''].filter(Boolean);
  return `Looked in your notes for “${l.query}”: ${found}${extra.length ? ` — ${extra.join('; ')}` : ''}.`;
}
