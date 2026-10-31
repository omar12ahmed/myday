// The weekly review (milestone 6, Reflect, 1.37.0): a short look back at the last seven days — what moved, what's
// waiting, next week's focus and, if you like, a line or two about it. Worked out from what's already saved; what you
// choose is saved where it belongs: a project's `focus` (the day its focus week starts), your review day and the
// review you've done or put off (with your other preferences), and your reflection as an ordinary note
// (`reflectionWeek` marks which week it's for). Nothing is judged: no scores, no "behind", a quiet week is fine.
import { decisionsOpen, evidenceToGet, findOutsDone } from './attention';
import { isBusiness, isCase } from './businessModel';
import { keyOf, localStamp, parseKey, shift, shortDate, todayKey } from './dates';
import { NOTE_LIMITS } from './notes';
import { lastActivity, projectsInOrder } from './projects';
import { isProjectWaiting } from './projectWaiting';
import { isStuck } from './tasks';
import type { DateKey, MyDayData, Project } from './types';
import { uid } from './util';

export const REVIEW_LIMITS = { focus: 3, waiting: 5, answer: 1000 };
const days = (a: DateKey, b: DateKey) => Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86_400_000);
const inRange = (day: string | null | undefined, from: DateKey, to: DateKey) => !!day && day.slice(0, 10) >= from && day.slice(0, 10) <= to;

// ---------- When ----------
// Your review day (0 = Sunday … 6 = Saturday). Sunday unless you choose another (your choice, 18 Oct 2026).
export const reviewDay = (data: MyDayData): number => { const v = data.patterns.prefs.reviewDay; return Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 6 ? v as number : 0; };
// The latest review day on or before k.
export const lastReviewDay = (data: MyDayData, k: DateKey = todayKey()): DateKey => shift(k, -((parseKey(k).getDay() - reviewDay(data) + 7) % 7));
// The card on Today: on your review day and the day after, unless you've done that review or put it off.
export function reviewDue(data: MyDayData, k: DateKey = todayKey()): DateKey | null {
  const day = lastReviewDay(data, k), p = data.patterns.prefs;
  if (days(day, k) > 1 || p.reviewed === day || p.reviewHidden === day) return null;
  return day;
}

// ---------- 1. What moved (the seven days ending on k) ----------
export interface Moved { project: Project; tasks: number; milestones: number; decisions: number; found: number; recorded: number; done: string[] }
export interface Week { from: DateKey; to: DateKey; projects: Moved[]; otherTasks: number; studyMinutes: number; studySessions: number; workouts: number }
export function whatMoved(data: MyDayData, k: DateKey = todayKey()): Week {
  const from = shift(k, -6), to = k;
  const projects: Moved[] = [];
  for (const p of data.projects.items) {
    const tasks = data.tasks.items.filter(t => t.projectId === p.id && t.done && inRange(t.doneOn, from, to));
    const m: Moved = {
      project: p, tasks: tasks.length,
      milestones: (p.milestones ?? []).filter(x => inRange(x.reachedOn, from, to)).length,
      decisions: (p.decisions ?? []).filter(x => x.chosen && inRange(x.decidedOn, from, to)).length,
      found: isBusiness(p) ? (p.model?.assumptions ?? []).filter(a => inRange(a.checkedOn, from, to)).length : 0,
      recorded: isCase(p) ? [...(p.case?.timeline ?? []), ...(p.case?.evidence ?? [])].filter(r => inRange(r.createdAt, from, to)).length : 0,
      done: tasks.slice(0, 3).map(t => t.title),
    };
    if (m.tasks + m.milestones + m.decisions + m.found + m.recorded) projects.push(m);
  }
  projects.sort((a, b) => (b.tasks + b.milestones + b.decisions + b.found + b.recorded) - (a.tasks + a.milestones + a.decisions + a.found + a.recorded));
  const sessions = data.study.sessions.filter(s => s.status === 'done' && inRange(s.date, from, to));
  return {
    from, to, projects,
    otherTasks: data.tasks.items.filter(t => !t.projectId && t.done && inRange(t.doneOn, from, to)).length,
    studySessions: sessions.length, studyMinutes: Math.round(sessions.reduce((a, s) => a + s.activeMs, 0) / 60000),
    workouts: data.health.workout.sessions.filter(s => s.status !== 'active' && inRange(s.date, from, to)).length,
  };
}

// ---------- 2. What needs you (at most five, from real data; "What's waiting" before 1.50.0) ----------
export interface Waiting { key: string; kind: 'stuck' | 'quiet' | 'decision' | 'found' | 'evidence'; text: string; href: string; projectId?: string; taskId?: string }
export function whatsWaiting(data: MyDayData, k: DateKey = todayKey(), max = REVIEW_LIMITS.waiting): Waiting[] {
  const out: Waiting[] = [], active = projectsInOrder(data, 'active');
  for (const t of data.tasks.items) {
    if (!isStuck(data, t, k)) continue;
    out.push({ key: `stuck:${t.id}`, kind: 'stuck', taskId: t.id, href: `#today/tasks/${encodeURIComponent(t.id)}`,
      text: t.postponed >= 3 ? `“${t.title}” has moved ${t.postponed} times` : `“${t.title}” was planned for ${shortDate(t.due!)}` });
  }
  for (const p of active) {
    const quiet = days(lastActivity(data, p).slice(0, 10), k); // (a project waiting on someone or something isn't quiet: specs/projects-project-waiting.md)
    if (quiet >= 14 && !isProjectWaiting(p)) out.push({ key: `quiet:${p.id}`, kind: 'quiet', projectId: p.id, href: `#projects/p/${encodeURIComponent(p.id)}`, text: `“${p.title}” has been quiet for ${Math.floor(quiet / 7)} weeks` });
  }
  for (const p of active) for (const x of decisionsOpen(p, k)) {
    out.push({ key: `decision:${p.id}:${x.id}`, kind: 'decision', projectId: p.id, href: `#projects/p/${encodeURIComponent(p.id)}/decisions`, text: `“${x.question}” is still open (${p.title})` });
  }
  for (const p of active) {
    if (isBusiness(p)) { const n = findOutsDone(data, p); if (n) out.push({ key: `found:${p.id}`, kind: 'found', projectId: p.id, href: `#projects/p/${encodeURIComponent(p.id)}/model`, text: `${p.title}: ${n === 1 ? 'a Find out task is' : `${n} Find out tasks are`} done — what did you find?` }); }
    if (isCase(p)) { const n = evidenceToGet(p); if (n) out.push({ key: `evidence:${p.id}`, kind: 'evidence', projectId: p.id, href: `#projects/p/${encodeURIComponent(p.id)}/evidence`, text: `${p.title}: ${n} ${n === 1 ? 'piece' : 'pieces'} of evidence still to get` }); }
  }
  return out.slice(0, max);
}

// ---------- 3. Next week's focus ----------
// A project is in focus for the seven days from its `focus` day.
export const inFocus = (p: Project, k: DateKey = todayKey()) => !!p.focus && p.focus <= k && k < shift(p.focus, 7);
export const focusProjects = (data: MyDayData, k: DateKey = todayKey()) => data.projects.items.filter(p => p.status === 'active' && inFocus(p, k));

// ---------- Saving (each used inside update(); returns whether anything changed) ----------
// Your review: up to three projects in focus for the seven days from `start`, your answers as a note (only if you
// wrote something), and this review marked as done. A project's "updated" time doesn't move for its focus. In a week
// with any Study (studiedIn), two more answers go in the same note: what got easier, and what still feels hard
// (specs/study-home-and-lessons.md §11).
export interface Finish { day: DateKey; from: DateKey; start: DateKey; focus: string[]; went: string; easier: string; gotEasier?: string; stillHard?: string }
// Any Study in the week: a Study session finished, an Arabic session finished or a Cybersecurity attempt handed in.
export function studiedIn(data: MyDayData, from: DateKey, to: DateKey): boolean {
  const on = (iso: string | null) => { if (!iso) return false; const k = keyOf(new Date(iso)); return k >= from && k <= to; };
  return data.study.sessions.some(s => s.status === 'done' && s.date >= from && s.date <= to)
    || data.arabic.attempts.some(a => on(a.finishedAt)) || data.cybersecurity.attempts.some(a => on(a.submittedAt));
}
export function finishReview(d: MyDayData, f: Finish): { noteId: string | null } {
  const keep = new Set(f.focus.slice(0, REVIEW_LIMITS.focus));
  for (const p of d.projects.items) {
    if (keep.has(p.id) && p.status === 'active') p.focus = f.start;
    else if (p.focus === f.start) delete p.focus;
  }
  const went = f.went.trim().slice(0, REVIEW_LIMITS.answer), easier = f.easier.trim().slice(0, REVIEW_LIMITS.answer);
  const gotEasier = (f.gotEasier ?? '').trim().slice(0, REVIEW_LIMITS.answer), stillHard = (f.stillHard ?? '').trim().slice(0, REVIEW_LIMITS.answer);
  let noteId: string | null = null;
  if (went || easier || gotEasier || stillHard) {
    const cat = d.notes.categories.find(c => c.name === 'Personal')?.id ?? '', now = localStamp();
    noteId = 'nt' + uid();
    const text = [went && `What went well:\n${went}`, easier && `What would make next week easier:\n${easier}`,
      gotEasier && `Study, what got easier:\n${gotEasier}`, stillHard && `Study, what still feels hard:\n${stillHard}`].filter(Boolean).join('\n\n');
    d.notes.items.push({ id: noteId, categoryId: cat, title: `Week of ${shortDate(f.from)}`, text: text.slice(0, NOTE_LIMITS.text), pinned: false, createdAt: now, updatedAt: now, reflectionWeek: f.from });
  }
  d.patterns.prefs.reviewed = f.day;
  return { noteId };
}
// "Not this week": the card goes until the next review day.
export function putOffReview(d: MyDayData, day: DateKey): boolean {
  if (d.patterns.prefs.reviewHidden === day) return false;
  d.patterns.prefs.reviewHidden = day;
  return true;
}
export function setReviewDay(d: MyDayData, wd: number): boolean {
  if (!Number.isInteger(wd) || wd < 0 || wd > 6 || reviewDay(d) === wd) return false;
  if (wd === 0) delete d.patterns.prefs.reviewDay; else d.patterns.prefs.reviewDay = wd;
  return true;
}
