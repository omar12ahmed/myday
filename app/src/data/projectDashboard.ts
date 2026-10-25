// A project's dashboard, "At a glance" (1.36.0; Today's own dashboard numbers are in dashboard.ts): where it stands
// and what might need you, worked out from what's already saved — nothing here is saved, and nothing is sent anywhere.
// Counts and places, never percentages or scores; no "behind", "late" or streaks. Each tool's summary appears once,
// in At a glance; pointers appear only when there's something real to show.
import { evidenceToGet, findOutsDone, pastOpen, waitsDue } from './attention';
import { isBusiness, isCase, modelProgress } from './businessModel';
import { issueLinks, timelineInOrder } from './caseFile';
import { parseKey, shift, shortDate, todayKey } from './dates';
import { comingUp, nextStep } from './projects';
import { chaseTask } from './tasks';
import type { DateKey, MyDayData, Project } from './types';

const tab = (p: Project, t?: string) => `#projects/p/${encodeURIComponent(p.id)}${t ? '/' + t : ''}`;
const days = (a: DateKey, b: DateKey) => Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86_400_000);
// The Monday of the week a day is in.
export const mondayOf = (k: DateKey): DateKey => shift(k, -((parseKey(k).getDay() + 6) % 7));
const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

// ---------- The next date (a dated task or an appointment, from today on) ----------
export interface NextDate { day: DateKey; time: string | null; title: string; href: string }
export function nextDates(data: MyDayData, p: Project, k: DateKey = todayKey(), max = 3): NextDate[] {
  return comingUp(data, p, k).slice(0, max).map(c => c.kind === 'task'
    ? { day: c.task.due!, time: c.task.time ?? null, title: c.task.title, href: `#today/tasks/${encodeURIComponent(c.task.id)}` }
    : { day: c.appt.start.slice(0, 10), time: c.appt.start.slice(11, 16), title: c.appt.title, href: '#calendar' });
}

// ---------- What you did, week by week ----------
// The last `weeks` weeks (this week last), counting what has a day of its own: tasks ticked off, milestones reached,
// decisions made, and — for a business idea — things found out; for a case, timeline entries and evidence recorded.
export interface Week { start: DateKey; tasks: number; milestones: number; decisions: number; found: number; recorded: number; total: number }
export function weeksDone(data: MyDayData, p: Project, k: DateKey = todayKey(), weeks = 8): Week[] {
  const first = shift(mondayOf(k), -7 * (weeks - 1));
  const out: Week[] = Array.from({ length: weeks }, (_, i) => ({ start: shift(first, 7 * i), tasks: 0, milestones: 0, decisions: 0, found: 0, recorded: 0, total: 0 }));
  const add = (day: string | null | undefined, field: Exclude<keyof Week, 'start' | 'total'>) => {
    if (!day) return;
    const d = day.slice(0, 10);
    if (d < first || d > k) return;
    const w = out[Math.floor(days(first, d) / 7)];
    if (w) { w[field]++; w.total++; }
  };
  for (const t of data.tasks.items) if (t.projectId === p.id && t.done) add(t.doneOn, 'tasks');
  for (const m of p.milestones ?? []) add(m.reachedOn, 'milestones');
  for (const x of p.decisions ?? []) if (x.chosen) add(x.decidedOn, 'decisions');
  if (isBusiness(p)) for (const a of p.model?.assumptions ?? []) add(a.checkedOn, 'found');
  if (isCase(p)) for (const r of [...(p.case?.timeline ?? []), ...(p.case?.evidence ?? [])]) add(r.createdAt, 'recorded');
  return out;
}

// ---------- A case: entries by month, and each issue's links ----------
export function timelineByMonth(p: Project, max = 12): { month: string; count: number }[] {
  const by = new Map<string, number>();
  for (const t of timelineInOrder(p)) by.set(t.date.slice(0, 7), (by.get(t.date.slice(0, 7)) ?? 0) + 1);
  return [...by].map(([month, count]) => ({ month, count })).slice(-max);
}
export function issueGrid(p: Project) {
  return (p.case?.issues ?? []).map(i => { const l = issueLinks(p, i.id); return { id: i.id, title: i.title, status: i.status, evidence: l.evidence.length, entries: l.entries.length }; });
}

// ---------- Worth a look: at most three gentle pointers from real data ----------
export interface Pointer { key: string; text: string; href: string; chase?: { taskId: string; added: boolean } }
export function worthALook(data: MyDayData, p: Project, k: DateKey = todayKey(), max = 3): Pointer[] {
  const out: Pointer[] = [];
  // The oldest task still to do whose date has passed, unless it's the next step (that card says so beside it),
  // and only on an active project: a paused or finished one isn't nudged. Coming up lists them all.
  const step = nextStep(data, p);
  const open = p.status === 'active' ? pastOpen(data, p, k).find(t => t.id !== step?.id) : undefined; // (waiting, or starting after another task, isn't nudged)
  if (open) out.push({ key: 'still-open', text: `${open.title} — still open, was due ${shortDate(open.due!)}`, href: `#today/tasks/${encodeURIComponent(open.id)}` });
  // A wait whose expected day has come (1.50.0), oldest first, on an active project, with "Chase it" beside it —
  // unless it's the next step: that card says so and offers Chase it itself.
  const waited = p.status === 'active' ? waitsDue(data, p, k).find(t => t.id !== step?.id) : undefined;
  if (waited) out.push({ key: 'waiting', text: `Still waiting on ${waited.waiting!.on} (${waited.title}) — expected ${shortDate(waited.waiting!.until!)}`,
    href: `#today/tasks/${encodeURIComponent(waited.id)}`, chase: { taskId: waited.id, added: !!chaseTask(data, waited) } });
  // A date in the next week.
  const soon = nextDates(data, p, k, 1)[0];
  if (soon && days(k, soon.day) <= 7) out.push({ key: 'soon', text: `${soon.title} — ${soon.day === k ? 'today' : soon.day === shift(k, 1) ? 'tomorrow' : `in ${days(k, soon.day)} days`}`, href: soon.href });
  if (isBusiness(p)) {
    const waiting = findOutsDone(data, p);
    if (waiting) out.push({ key: 'found', text: waiting === 1 ? 'A Find out task is done — what did you find?' : `${waiting} Find out tasks are done — what did you find?`, href: tab(p, 'model') });
    const g = modelProgress(p);
    if (g.answered < 3) out.push({ key: 'one-page', text: `Your one page has ${plural(4 - g.answered, 'question')} still to answer`, href: tab(p, 'model') });
  }
  if (isCase(p)) {
    const toGet = evidenceToGet(p), bare = issueGrid(p).filter(i => !i.evidence && !i.entries && i.status !== 'dropped').length;
    if (bare) out.push({ key: 'bare', text: `${plural(bare, 'issue')} ${bare === 1 ? 'has' : 'have'} nothing linked yet`, href: tab(p, 'issues') });
    if (toGet) out.push({ key: 'to-get', text: `${plural(toGet, 'piece')} of evidence still to get`, href: tab(p, 'evidence') });
  }
  // No "no next step yet" pointer: the Next step card beside it already asks for the smallest one.
  return out.slice(0, max);
}
