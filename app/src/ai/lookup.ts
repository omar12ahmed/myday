// Ask MyDay's lookups (specs/ai-tools.md §3): when an answer needs something from your notes, the app looks on this
// device — read-only, through the privacy rules (reach.ts) — and sends only what it found the second time round.
// "Search your notes": every word must appear, in any order, as in project search (capitals, accents and the kind of
// apostrophe don't matter). A note's text is searched, and a short snippet of it sent, only with "AI help with notes" on;
// otherwise only titles. Private notes, and notes in a private project, are never sent — not even how many matched: that
// count (`leftOut`) stays on this device, for the panel's "1 private note left out".
import { ASK_LIMITS as L, DAY_KINDS, type AskDayLookup, type AskDecisionsLookup, type AskLookup, type AskNotesLookup, type AskProjectLookup, type AskSearchLookup, type AskStudyLookup, type AskWaitingLookup, type SEARCH_KINDS, type SEARCH_STATES } from '../../../supabase/functions/_shared/ai/ask-shape.ts';
import { parseKey, prettyDate, shift, shortDate, timeToMin, todayKey } from '../data/dates';
import { lessonHref } from '../data/cybersecurity/types';
import type { CourseIndex } from '../data/searchAll';
import { noteName } from '../data/notes';
import { excerptOf, fold, wordsOf } from '../data/projectSearch';
import { isDone, onTodaysPlan } from '../data/tasks';
import { projectNotes, projectTasks } from '../data/projects';
import type { DateKey, MyDayData, Note } from '../data/types';
import { isBusiness } from '../data/businessModel';
import { dueIds } from '../data/study/queue';
import { learningOptions } from '../study/nextLearning';
import { projectSlice } from './askContext';
import { buildContext } from './context';
import { aiReach } from './reach';

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

// What a lookup couldn't send, counted on this device for the panel's line only (never sent): how many there were when
// more than the limit allowed, how many of a project's notes went with their text (newest first, while it fits) or by
// title only as AI help with notes is off, and the courses when they couldn't be loaded.
export type LookupMore = { tasks?: number; done?: number; due?: number; busy?: number; milestones?: number; notes?: number; textNotes?: number; titlesOnly?: boolean; noCourses?: boolean };

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

// "Look across MyDay" (v24, the owner's choices of 25 Oct 2026; specs/ai-tools.md §6.11): Search everywhere's matching,
// through the privacy rules, in only what may be sent — so a match never hints at anything held back (who a task waits
// on, a deadline's source, a case's records, research, a project's links, outcome or where you left off, your kept
// words, revision cards, answers, the notebook, Finance, Health). It searches task titles, notes and steps; project
// names and summaries, milestones and decisions (question and options); note titles (their text only with "AI help with
// notes" on); appointment and work titles; your own courses and their tasks, topics, books (title and author), and the
// two courses' modules, lessons and course words (`courses`, loaded when it's needed). Each match goes as its kind,
// name, where it is and its state, with a reference ("r1"…) the answer cites; its link stays here (`hrefs`). In a fixed
// order (tasks, projects, notes, calendar, study; open things first), up to 12. `leftOut` counts the private things that
// matched — for the panel's "2 private things left out" only, never sent.
type SearchKind = typeof SEARCH_KINDS[number];
type SearchState = typeof SEARCH_STATES[number];
export function searchLookup(data: MyDayData, query: string, courses: CourseIndex | null, today: DateKey = todayKey()): { lookup: AskSearchLookup; leftOut: number; hrefs: Record<string, string>; more: LookupMore } {
  const reach = aiReach(data), withText = !!data.patterns.prefs.aiNotes;
  const q = cut(query.trim().replace(/\s+/g, ' '), L.lookupQueryChars), words = wordsOf(q);
  const has = (texts: (string | null | undefined)[]) => { const hay = fold(texts.filter(Boolean).join('\n')); return words.length > 0 && words.every(w => hay.includes(w)); };
  type Hit = { kind: SearchKind; title: string; where: string | null; state: SearchState | null; href: string; rank: number };
  const hits: Hit[] = [];
  const held = new Set<string>(); // the private records that matched (a private project once, however many of its parts)
  const add = (ok: boolean, h: Omit<Hit, 'rank' | 'state'> & { state?: SearchState | null }, record = '') => { if (ok) hits.push({ state: null, ...h, rank: h.state ? (h.state === 'paused' ? 1 : 2) : 0 }); else held.add(record); };
  const enc = encodeURIComponent, projects = new Map(data.projects.items.map(p => [p.id, p]));
  const inProject = (id?: string | null) => { const p = id ? projects.get(id) : undefined; return p ? `in “${p.title}”` : null; };
  // Tasks: title, notes and steps (never who it waits on, or a deadline's source).
  for (const t of data.tasks.items) {
    if (!has([t.title, t.notes, ...(t.steps ?? []).map(s => s.text)])) continue;
    add(reach.task(t), { kind: 'task', title: t.title, where: inProject(t.projectId), href: `#today/tasks/${enc(t.id)}`, state: t.letGoOn ? 'let go' : isDone(data, t) ? 'done' : null }, `task:${t.id}`);
  }
  // Projects: name and summary, milestones, decisions (question and options).
  for (const p of data.projects.items) {
    const ok = reach.project(p), state: SearchState | null = p.status === 'paused' ? 'paused' : p.status === 'done' ? 'done' : null, at = `#projects/p/${enc(p.id)}`;
    const rec = `project:${p.id}`;
    if (has([p.title, p.summary])) add(ok, { kind: 'project', title: p.title, where: null, href: at, state }, rec);
    for (const m of p.milestones ?? []) if (has([m.title])) add(ok, { kind: 'milestone', title: m.title, where: `in “${p.title}”`, href: `${at}/milestones`, state: m.reachedOn ? 'done' : state }, rec);
    for (const d of p.decisions ?? []) if (has([d.question, ...d.options.map(o => o.text)])) add(ok, { kind: 'decision', title: d.question, where: `in “${p.title}”`, href: `${at}/decisions`, state }, rec);
  }
  // Notes: titles (their text, and an untitled note's first line, only with AI help with notes on).
  for (const n of data.notes.items) {
    if (!has(withText ? [n.title, n.text] : [n.title])) continue;
    add(reach.note(n), { kind: 'note', title: withText ? noteName(n) : n.title.trim() || 'Untitled note', where: inProject(n.projectId), href: `#projects/notes/${enc(n.id)}` }, `note:${n.id}`);
  }
  // The calendar: appointment and work titles, with their day and time.
  for (const c of data.commitments) {
    if (!has([c.title])) continue;
    const day = c.start.slice(0, 10);
    add(reach.appointment(c), { kind: c.kind === 'work' ? 'work' : 'appointment', title: c.title, where: `${shortDate(day)}, ${c.start.slice(11, 16)}`, href: `#calendar/${day}`, state: day < today ? 'past' : null }, `appointment:${c.id}`);
  }
  // Study: your own courses and their tasks (not the guided Cybersecurity course: its lessons are found as lessons),
  // topics, books, and the two courses' modules, lessons and words.
  for (const tp of data.study.topics ?? []) if (has([tp.title])) add(true, { kind: 'topic', title: tp.title, where: null, href: `#study/topic/${enc(tp.id)}` });
  for (const st of data.study.stages) for (const c of st.courses) {
    if (c.id.startsWith('cyber:1:')) continue;
    const arch: SearchState | null = c.archived ? 'archived' : null;
    if (has([c.title])) add(true, { kind: 'course', title: c.title, where: null, href: `#study/course/${enc(c.id)}`, state: arch });
    for (const m of c.modules) for (const s of m.sections) for (const t of s.tasks) {
      if (has([t.title])) add(true, { kind: 'study task', title: t.title, where: `in “${c.title}”`, href: `#study/task/${enc(t.id)}`, state: t.done ? 'done' : arch });
    }
  }
  for (const b of data.reading.books) if (has([b.title, b.author])) add(true, { kind: 'book', title: b.title, where: b.author.trim() || null, href: '#study/reading', state: b.finishedOn ? 'finished' : null });
  if (courses) {
    const arModule = new Map(courses.arabic.modules.map(m => [m.id, m.name])), cyModule = new Map(courses.cyber.modules.map(m => [m.id, m.name]));
    for (const m of courses.arabic.modules) if (has([m.name, m.purpose])) add(true, { kind: 'module', title: m.name, where: 'Arabic', href: `#study/arabic/${enc(m.id)}` });
    for (const l of courses.arabic.lessons) if (has([l.title])) add(true, { kind: 'lesson', title: l.title, where: `Arabic · ${arModule.get(l.moduleId) ?? 'course'}`, href: `#study/arabic/${enc(l.id)}` });
    for (const m of courses.cyber.modules) if (has([m.name, m.purpose])) add(true, { kind: 'module', title: m.name, where: 'Cybersecurity', href: lessonHref(m.id) });
    for (const l of courses.cyber.lessons) if (has([l.title])) add(true, { kind: 'lesson', title: l.title, where: `Cybersecurity · ${cyModule.get(l.moduleId) ?? 'course'}`, href: lessonHref(l.id) });
    for (const w of courses.arabic.words ?? []) if (has([w.ar, w.meaning])) add(true, { kind: 'course word', title: `${w.ar} — ${w.meaning}`, where: 'Arabic', href: w.lessonId ? `#study/arabic/${enc(w.lessonId)}` : '#study/arabic/vocabulary' });
  }
  const order: SearchKind[][] = [['task'], ['project', 'milestone', 'decision'], ['note'], ['appointment', 'work'], ['topic', 'course', 'study task', 'book', 'module', 'lesson', 'course word']];
  const section = (k: SearchKind) => order.findIndex(g => g.includes(k));
  const sorted = hits.map((h, i) => [h, i] as const).sort((a, b) => section(a[0].kind) - section(b[0].kind) || a[0].rank - b[0].rank || a[1] - b[1]).map(([h]) => h);
  const shown = sorted.slice(0, L.lookupSearch), hrefs: Record<string, string> = {};
  const found = shown.map((h, i) => { const ref = `r${i + 1}`; hrefs[ref] = h.href; return { ref, kind: h.kind, title: cut(h.title, L.titleChars), where: h.where ? cut(h.where, L.searchWhereChars) : null, state: h.state }; });
  return { lookup: { tool: 'search', query: q, found, total: hits.length, titlesOnly: !withText }, leftOut: held.size, hrefs, more: courses ? {} : { noCourses: true } };
}

// "Your day" (v18): one day as the app sees it — from a week ago to two months ahead (null outside that). Its plan, with
// a private project's tasks left out (counted here only), tasks due that day not on the plan, busy times by kind only
// (never an appointment's name), free time and energy: the same rules as Help me adjust today and Ask's Today page.
export const DAY_BACK = 7, DAY_AHEAD = 60;
export function dayLookup(data: MyDayData, day: DateKey, today: DateKey = todayKey()): { lookup: AskDayLookup; leftOut: number; more: LookupMore } | null {
  if (day < shift(today, -DAY_BACK) || day > shift(today, DAY_AHEAD)) return null;
  const reach = aiReach(data), held = reach.heldOnPlan(day), d = data.days[day], pc = buildContext(data, day, '');
  const plan = d?.tasks ?? [], dueAll = data.tasks.items.filter(t => t.due === day && !t.done && !t.letGoOn && !onTodaysPlan(data, t, day));
  const due = dueAll.filter(reach.task);
  const sendable = plan.filter(t => !held.has(t.uid)), tasks = sendable.slice(0, L.dayTasks).map(t => ({ title: cut(t.title, L.titleChars), minutes: t.minutes, done: t.done, time: t.scheduledStart ? t.scheduledStart.slice(11, 16) : null }));
  return {
    lookup: {
      tool: 'day', query: day, weekday: parseKey(day).toLocaleDateString('en-GB', { weekday: 'long' }),
      planned: !!d && !d.rest, rest: !!d?.rest, energy: pc.energy ?? null,
      tasks, minutesLeft: tasks.reduce((sum, t) => sum + (t.done ? 0 : t.minutes), 0),
      due: due.slice(0, L.dayTasks).map(t => cut(t.title, L.titleChars)),
      busy: pc.busy.filter(b => (DAY_KINDS as readonly string[]).includes(b.kind)).slice(0, L.dayBusy).map(b => ({ kind: b.kind as AskDayLookup['busy'][number]['kind'], start: b.start, end: b.end })),
      free: pc.free.slice(0, L.dayFree),
      freeMinutes: Math.min(1440, pc.free.reduce((m, f) => m + Math.max(0, timeToMin(f.end) - timeToMin(f.start)), 0)), // added up here: the model's own sums were wrong (v25)
    },
    leftOut: plan.filter(t => held.has(t.uid)).length + dueAll.length - due.length,
    more: { tasks: sendable.length, due: due.length, busy: pc.busy.filter(b => (DAY_KINDS as readonly string[]).includes(b.kind)).length },
  };
}

// "A project's context" (v19): one of your open projects you asked about by name, exactly as its own page sends it
// (projectSlice). Null for a private project, a finished one or one that isn't there; its private notes are counted
// here only, and so is what didn't fit (`more`).
export function projectLookup(data: MyDayData, id: string): { lookup: AskProjectLookup; leftOut: number; more: LookupMore } | null {
  const p = data.projects.items.find(x => x.id === id);
  if (!p || p.status === 'done' || !aiReach(data).project(p)) return null;
  const { project, heldNotes, textNotes } = projectSlice(data, p), { open, done } = projectTasks(data, p);
  const notes = projectNotes(data, p).length - heldNotes, withText = !!data.patterns.prefs.aiNotes;
  return { lookup: { tool: 'project', query: p.id, project }, leftOut: heldNotes,
    // done: as sent (a task let go, or ticked only on a day's plan, goes as not done)
    more: { tasks: open.length + done.length, done: done.filter(t => t.done).length, milestones: p.milestones?.length ?? 0, notes, ...(withText ? { textNotes } : { titlesOnly: notes > 0 }) } };
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
// "Looked at Thursday 30 October: 2 tasks planned, 1 due, 3 busy times — 1 private task left out. Checked at 10:42."
// What didn't go is said: private things, what a setting kept back, what was more than the limit allowed (`more`),
// and when it was read (`at`: a reply that uses it, or a second try, keeps when it was read).
export function lookupLine(l: AskLookup, held: number, projectTitle?: string, { more = {}, at }: { more?: LookupMore; at?: Date } = {}): string {
  const line = sayLookup(l, held, projectTitle, more);
  return at ? `${line} Checked at ${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}.` : line;
}
function sayLookup(l: AskLookup, held: number, projectTitle: string | undefined, more: LookupMore): string {
  const count = (n: number, one: string, many: string) => (n === 1 ? one : `${n} ${many}`);
  if (l.tool === 'day') {
    const nt = Math.max(more.tasks ?? 0, l.tasks.length), nd = Math.max(more.due ?? 0, l.due.length), nb = Math.max(more.busy ?? 0, l.busy.length);
    const parts = [l.rest ? 'a rest day' : l.planned ? `${count(nt, 'one task', 'tasks')} planned${nt > l.tasks.length ? ` (the first ${l.tasks.length} sent)` : ''}` : 'no plan yet',
      ...(nd ? [`${nd} due${nd > l.due.length ? ` (${l.due.length} sent)` : ''}`] : []), nb ? `${count(nb, 'one busy time', 'busy times')}${nb > l.busy.length ? ` (the first ${l.busy.length} sent)` : ''}` : 'nothing booked'];
    return `Looked at ${prettyDate(l.query)}: ${parts.join(', ')}${held ? ` — ${held === 1 ? 'one private task' : `${held} private tasks`} left out` : ''}.`;
  }
  if (l.tool === 'study') {
    const [first, ...rest] = l.options;
    if (!first) return 'Looked at what to study next: nothing set up yet.';
    return `Looked at what to study next: ${first.label} first${rest.length ? `, then ${rest.map(o => o.label).join(' and ')}` : ''}${l.revisionDue ? ` — ${l.revisionDue === 1 ? 'one thing' : `${l.revisionDue} things`} to revise` : ''}.`;
  }
  if (l.tool === 'waiting') {
    const where = l.query === 'all' ? 'what you’re waiting on' : `what you’re waiting on in “${l.tasks[0]?.project ?? projectTitle ?? 'that project'}”`;
    return `Looked at ${where}: ${l.found ? `${count(l.found, 'one task', 'tasks')}${l.found > l.tasks.length ? ` (the oldest ${l.tasks.length} sent)` : ''}` : 'nothing waiting'}${held ? ` — ${held === 1 ? 'one in a private project' : `${held} in private projects`} left out` : ''}.`;
  }
  if (l.tool === 'decisions') {
    const n = l.found.decisions, b = l.found.mustBeTrue, where = l.query === 'all' ? 'your open decisions' : `the open decisions in “${l.decisions[0]?.project ?? l.mustBeTrue[0]?.project ?? projectTitle ?? 'that project'}”`;
    const parts = [n ? `${count(n, 'one decision', 'decisions')}${n > l.decisions.length ? ` (the oldest ${l.decisions.length} sent)` : ''}` : 'no decisions open',
      ...(b ? [`${count(b, 'one thing to check', 'things to check')}${b > l.mustBeTrue.length ? ` (the oldest ${l.mustBeTrue.length} sent)` : ''}`] : [])];
    return `Looked at ${where}: ${parts.join(', ')}${held ? ` — ${held === 1 ? 'one in a private project' : `${held} in private projects`} left out` : ''}.`;
  }
  if (l.tool === 'project') {
    const t = l.project.tasks, m = l.project.milestones?.length ?? 0, n = l.project.notes.length;
    const nt = Math.max(more.tasks ?? 0, t.length), done = more.tasks !== undefined ? more.done ?? 0 : t.filter(x => x.done).length, nm = Math.max(more.milestones ?? 0, m), nn = Math.max(more.notes ?? 0, n);
    // Notes go by title (the newest 20) and with their text (newest first, while it fits), so the newest of either went.
    const sent = Math.max(n, more.textNotes ?? 0), titleOnly = more.textNotes !== undefined ? Math.max(0, n - more.textNotes) : 0;
    const paren = (xs: string[]) => (xs.some(Boolean) ? ` (${xs.filter(Boolean).join('; ')})` : '');
    const parts = [nt ? `${count(nt, 'one task', 'tasks')}${paren([done ? `${done} done` : '', nt > t.length ? `${t.length} sent, open ones first` : ''])}` : 'no tasks yet',
      ...(nm ? [`${count(nm, 'one milestone', 'milestones')}${nm > m ? ` (the first ${m} sent)` : ''}`] : []),
      ...(nn ? [`${count(nn, 'one note', 'notes')}${paren([nn > sent ? `the newest ${sent} sent` : '', titleOnly ? `${titleOnly} by title only, as there was too much text` : ''])}`] : [])];
    const extra = [held ? `${held === 1 ? 'one private note' : `${held} private notes`} left out` : '', more.titlesOnly ? 'notes by title only, as AI help with notes is off' : ''].filter(Boolean);
    return `Looked at your project “${l.project.title}”: ${parts.join(', ')}${extra.length ? ` — ${extra.join('; ')}` : ''}.`;
  }
  if (l.tool === 'search') {
    const n = l.total;
    const found = n ? `${n === 1 ? 'one thing' : `${n} things`}${n > l.found.length ? ` (the first ${l.found.length} sent)` : ''}` : held ? 'none that could be sent' : 'nothing matched';
    const extra = [held ? `${held === 1 ? 'one private thing' : `${held} private things`} left out` : '', l.titlesOnly ? 'notes by title only, as AI help with notes is off' : '',
      more.noCourses ? 'the courses’ lessons and words couldn’t be searched just now' : ''].filter(Boolean);
    return `Looked across MyDay for “${l.query}”: ${found}${extra.length ? ` — ${extra.join('; ')}` : ''}.`;
  }
  const n = l.found;
  const found = n ? `${n === 1 ? 'one note' : `${n} notes`}${n > l.notes.length ? ` (the newest ${l.notes.length} sent)` : ''}` : held ? 'none that could be sent' : 'nothing matched';
  const extra = [held ? `${held === 1 ? 'one private note' : `${held} private notes`} left out` : '', l.titlesOnly ? 'titles only, as AI help with notes is off' : ''].filter(Boolean);
  return `Looked in your notes for “${l.query}”: ${found}${extra.length ? ` — ${extra.join('; ')}` : ''}.`;
}
