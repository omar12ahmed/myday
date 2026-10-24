// Ask MyDay's lookups (specs/ai-tools.md §3): when an answer needs something from your notes, the app looks on this
// device — read-only, through the privacy rules (reach.ts) — and sends only what it found the second time round.
// "Search your notes": every word must appear, in any order, as in project search (capitals, accents and the kind of
// apostrophe don't matter). A note's text is searched, and a short snippet of it sent, only with "AI help with notes" on;
// otherwise only titles. Private notes, and notes in a private project, are never sent — not even how many matched: that
// count (`leftOut`) stays on this device, for the panel's "1 private note left out".
import { ASK_LIMITS as L, DAY_KINDS, type AskDayLookup, type AskLookup, type AskNotesLookup } from '../../../supabase/functions/_shared/ai/ask-shape.ts';
import { parseKey, prettyDate, shift, todayKey } from '../data/dates';
import { noteName } from '../data/notes';
import { excerptOf, fold, wordsOf } from '../data/projectSearch';
import { onTodaysPlan } from '../data/tasks';
import type { DateKey, MyDayData, Note } from '../data/types';
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
  return {
    lookup: {
      tool: 'day', query: day, weekday: parseKey(day).toLocaleDateString('en-GB', { weekday: 'long' }),
      planned: !!d && !d.rest, rest: !!d?.rest, energy: pc.energy ?? null,
      tasks: plan.filter(t => !held.has(t.uid)).slice(0, L.dayTasks).map(t => ({ title: cut(t.title, L.titleChars), minutes: t.minutes, done: t.done, time: t.scheduledStart ? t.scheduledStart.slice(11, 16) : null })),
      due: due.slice(0, L.dayTasks).map(t => cut(t.title, L.titleChars)),
      busy: pc.busy.filter(b => (DAY_KINDS as readonly string[]).includes(b.kind)).slice(0, L.dayBusy).map(b => ({ kind: b.kind as AskDayLookup['busy'][number]['kind'], start: b.start, end: b.end })),
      free: pc.free.slice(0, L.dayFree),
    },
    leftOut: plan.filter(t => held.has(t.uid)).length + dueAll.length - due.length,
  };
}

// What the panel says above the answer: "Looked in your notes for “van hire”: 3 notes — 1 private note left out." or
// "Looked at Thursday 30 October: 2 tasks planned, 1 due, 3 busy times — 1 private task left out."
export function lookupLine(l: AskLookup, held: number): string {
  if (l.tool === 'day') {
    const parts = [l.rest ? 'a rest day' : l.planned ? `${l.tasks.length === 1 ? 'one task' : `${l.tasks.length} tasks`} planned` : 'no plan yet',
      ...(l.due.length ? [`${l.due.length} due`] : []), l.busy.length ? `${l.busy.length === 1 ? 'one busy time' : `${l.busy.length} busy times`}` : 'nothing booked'];
    return `Looked at ${prettyDate(l.query)}: ${parts.join(', ')}${held ? ` — ${held === 1 ? 'one private task' : `${held} private tasks`} left out` : ''}.`;
  }
  const n = l.found;
  const found = n ? `${n === 1 ? 'one note' : `${n} notes`}${n > l.notes.length ? ` (the newest ${l.notes.length} sent)` : ''}` : held ? 'none that could be sent' : 'nothing matched';
  const extra = [held ? `${held === 1 ? 'one private note' : `${held} private notes`} left out` : '', l.titlesOnly ? 'titles only, as AI help with notes is off' : ''].filter(Boolean);
  return `Looked in your notes for “${l.query}”: ${found}${extra.length ? ` — ${extra.join('; ')}` : ''}.`;
}
