// What needs you, across your active projects (specs/projects-attention.md): the Projects home's "Needs you" card,
// worked out from what's already saved — nothing here is saved, and nothing is sent anywhere. Each line says what
// and why, in words, and opens the thing itself. Counts and dates, never "overdue", scores or red.
//
// The owner's decisions (25 Oct 2026): a date today or in the next 7 days; a task still open after its date (not one
// that's waiting or starts after another); a wait whose expected day has come; a task that keeps moving; a decision
// open 14 days or more; a business idea's Find out results; a case's evidence still to get. Not "quiet" projects
// (Your week keeps those). Paused and finished projects aren't included; a private one's items show, on this device.
//
// The selection rules below are shared: each project's Worth a look and Your week's What needs you read the same
// ones, so a reason is decided once (each keeps its own wording for where it's shown).
import { awaitingAnswer, isBusiness, isCase } from './businessModel';
import { caseCounts } from './caseFile';
import { parseKey, shift, shortDate, todayKey } from './dates';
import { comingUp, heldBack, projectsInOrder, projectTasks, stillOpen } from './projects';
import { chaseTask, isStuck } from './tasks';
import type { DateKey, MyDayData, Project, TaskItem } from './types';

const days = (a: DateKey, b: DateKey) => Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86_400_000);
const enc = encodeURIComponent;

// ---------- The shared selection rules ----------
// Tasks still open after their date that MyDay would nudge: not waiting on someone, not starting after another task
// (oldest date first).
export const pastOpen = (data: MyDayData, p: Project, k: DateKey = todayKey()) => stillOpen(data, p, k).filter(t => !heldBack(data, t));
// Waits whose expected day has come, oldest expected day first.
export const waitsDue = (data: MyDayData, p: Project, k: DateKey = todayKey()) => projectTasks(data, p).open
  .filter(t => t.waiting?.until && t.waiting.until <= k).sort((a, b) => a.waiting!.until!.localeCompare(b.waiting!.until!));
// A decision is "still open" for this card and Your week once it's been open 14 days.
export const DECISION_OPEN_DAYS = 14;
export const decisionsOpen = (p: Project, k: DateKey = todayKey()) => (p.decisions ?? []).filter(x => !x.chosen && days(x.createdAt.slice(0, 10), k) >= DECISION_OPEN_DAYS);
// A business idea's Find out tasks that are done with nothing found yet; a case's evidence still to get.
export const findOutsDone = (data: MyDayData, p: Project) => (isBusiness(p) ? (p.model?.assumptions ?? []).filter(a => awaitingAnswer(data, a)).length : 0);
export const evidenceToGet = (p: Project) => (isCase(p) ? caseCounts(p).toGet : 0);

// ---------- Needs you ----------
export type NeedReason = 'today' | 'past' | 'waiting' | 'stuck' | 'soon' | 'decision' | 'found' | 'evidence';
export type NeedGroup = 'dates' | 'waiting' | 'stuck' | 'decisions' | 'tools';
export const GROUP_OF: Record<NeedReason, NeedGroup> = { today: 'dates', past: 'dates', soon: 'dates', waiting: 'waiting', stuck: 'stuck', decision: 'decisions', found: 'tools', evidence: 'tools' };
export const GROUP_LABEL: Record<NeedGroup, string> = { dates: 'Dates', waiting: 'Waiting', stuck: 'In the way', decisions: 'Decisions', tools: 'Find out and evidence' };
// What matters soonest comes first: today's dates, then dates passed (oldest first), waits that are due, tasks that
// keep moving, the coming week's dates, decisions open longest, then a project's own tools.
const RANK: Record<NeedReason, number> = { today: 0, past: 1, waiting: 2, stuck: 3, soon: 4, decision: 5, found: 6, evidence: 7 };
export interface Need {
  key: string; reason: NeedReason; group: NeedGroup;
  projectId: string; project: string;  // the project's name, on every line
  title: string; why: string;          // what, and why, in words
  href: string;                        // opens the thing itself
  when: string;                        // for the order (a day, or when it was opened)
  chase?: { taskId: string; added: boolean };
}
const taskHref = (t: TaskItem) => `#today/tasks/${enc(t.id)}`;
const dayWords = (day: DateKey, k: DateKey) => day === k ? 'today' : day === shift(k, 1) ? 'tomorrow' : `on ${shortDate(day)}`;

// Everything that needs you across your active projects, in order. Each task appears once, under its first reason
// here: keeps moving, then a wait that's due, then a date passed, then a date in the coming week.
export function needsYou(data: MyDayData, k: DateKey = todayKey()): Need[] {
  const out: Need[] = [];
  const projects = projectsInOrder(data, 'active'), order = new Map(projects.map((p, i) => [p.id, i]));
  for (const p of projects) {
    const seen = new Set<string>();
    const add = (n: Omit<Need, 'projectId' | 'project' | 'group'>) => out.push({ ...n, group: GROUP_OF[n.reason], projectId: p.id, project: p.title });
    for (const t of projectTasks(data, p).open.filter(t => isStuck(data, t, k))) {
      seen.add(t.id);
      add({ key: `stuck:${t.id}`, reason: 'stuck', title: t.title, href: taskHref(t), when: t.due ?? t.createdAt.slice(0, 10),
        why: t.postponed >= 3 ? `moved ${t.postponed} times — something in the way?` : `planned for ${shortDate(t.due!)} — something in the way?` });
    }
    for (const t of waitsDue(data, p, k).filter(t => !seen.has(t.id))) {
      seen.add(t.id);
      add({ key: `waiting:${t.id}`, reason: 'waiting', title: t.title, href: taskHref(t), when: t.waiting!.until!, chase: { taskId: t.id, added: !!chaseTask(data, t) },
        why: `waiting on ${t.waiting!.on} — expected ${t.waiting!.until === k ? 'today' : shortDate(t.waiting!.until!)}` });
    }
    for (const t of pastOpen(data, p, k).filter(t => !seen.has(t.id))) {
      seen.add(t.id);
      add({ key: `past:${t.id}`, reason: 'past', title: t.title, href: taskHref(t), when: t.due!, why: `still open, was due ${shortDate(t.due!)}` });
    }
    for (const c of comingUp(data, p, k)) {
      const day = c.when.slice(0, 10);
      if (days(k, day) > 7) break;
      if (day < k) continue; // (an appointment that began before today and runs into it)
      if (c.kind === 'task') {
        if (seen.has(c.task.id)) continue;
        seen.add(c.task.id);
        add({ key: `date:${c.task.id}`, reason: day === k ? 'today' : 'soon', title: c.task.title, href: taskHref(c.task), when: c.when, why: `${dayWords(day, k)}${c.task.time ? ` at ${c.task.time}` : ''}` });
      } else add({ key: `date:${c.appt.id}`, reason: day === k ? 'today' : 'soon', title: c.appt.title, href: '#calendar', when: c.when, why: `${dayWords(day, k)} at ${c.appt.start.slice(11, 16)}` });
    }
    for (const x of decisionsOpen(p, k)) {
      add({ key: `decision:${p.id}:${x.id}`, reason: 'decision', title: x.question, href: `#projects/p/${enc(p.id)}/decisions`, when: x.createdAt,
        why: `open ${Math.floor(days(x.createdAt.slice(0, 10), k) / 7)} weeks` });
    }
    const found = findOutsDone(data, p);
    if (found) add({ key: `found:${p.id}`, reason: 'found', title: found === 1 ? 'A Find out task is done' : `${found} Find out tasks are done`, why: 'what did you find?', href: `#projects/p/${enc(p.id)}/model`, when: '' });
    const toGet = evidenceToGet(p);
    if (toGet) add({ key: `evidence:${p.id}`, reason: 'evidence', title: `${toGet} ${toGet === 1 ? 'piece' : 'pieces'} of evidence`, why: 'still to get', href: `#projects/p/${enc(p.id)}/evidence`, when: '' });
  }
  return out.sort((a, b) => RANK[a.reason] - RANK[b.reason] || a.when.localeCompare(b.when) || order.get(a.projectId)! - order.get(b.projectId)! || a.title.localeCompare(b.title));
}
// How many things need you on one project (the list's "2 need you").
export const needsYouOn = (data: MyDayData, p: Project, k: DateKey = todayKey()) => needsYou(data, k).filter(n => n.projectId === p.id).length;
