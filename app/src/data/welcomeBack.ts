// Welcome back (specs/projects-welcome-back.md): opening a project after 7 days or more with no work on it, the thread
// to pick up — what you did last, what came up while you were away, where you left off and the next step. Worked out
// from what's saved each time (nothing new is kept but a device's "Got it"). "What you did last" is Recently's
// reconstructed list, never a full history. Never sent to AI.
import { datesAhead, decisionsOpen, findOutsDone, pastOpen, waitsDue } from './attention';
import { parseKey, shift, shortDate, todayKey } from './dates';
import { experimentsHome, testsDone } from './experiments';
import { lastActivity, nextStep, recently, type Happening } from './projects';
import type { DateKey, MyDayData, Project, TaskItem } from './types';

export const AWAY_DAYS = 7;
const days = (a: DateKey, b: DateKey) => Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86_400_000);
// Days since the project's last activity (none counts as today).
export const awayFor = (data: MyDayData, p: Project, k: DateKey = todayKey()) => Math.max(0, days(lastActivity(data, p).slice(0, 10), k));
// "18 days", "3 weeks", "2 months".
export const awayWords = (n: number) => (n < 14 ? `${n} days` : n < 60 ? `${Math.floor(n / 7)} weeks` : `${Math.floor(n / 30)} months`);
// Away: 7 days or more with no work on it, unless it's finished (nothing to pick up).
export const isAway = (data: MyDayData, p: Project, k: DateKey = todayKey()) => p.status !== 'done' && awayFor(data, p, k) >= AWAY_DAYS;

export interface Meanwhile { key: string; text: string; href: string }
export interface WelcomeBack { days: number; since: DateKey; stamp: string; did: Happening[]; meanwhile: Meanwhile[]; more: number; next: TaskItem | null }
export const MEANWHILE_MOST = 6;
const enc = encodeURIComponent;
const dayWords = (day: DateKey, k: DateKey) => (day === k ? 'today' : day === shift(k, 1) ? 'tomorrow' : `on ${shortDate(day)}`);

// What came up while you were away, each one tap away: dates that came and went since you last worked on it and are
// still open (not one waiting, or starting after another task), dates in the next week, waits now due, decisions open
// a while, and Test or Find out tasks done with nothing recorded.
export function meanwhile(data: MyDayData, p: Project, since: DateKey, k: DateKey = todayKey()): Meanwhile[] {
  const out: Meanwhile[] = [], task = (t: TaskItem) => `#today/tasks/${enc(t.id)}`, tab = (t: string) => `#projects/p/${enc(p.id)}/${t}`;
  for (const t of pastOpen(data, p, k)) if (t.due! >= since) out.push({ key: `past:${t.id}`, text: `“${t.title}” — ${t.deadline?.kind === 'aim' ? 'was aimed for' : 'was due'} ${shortDate(t.due!)}, still open`, href: task(t) });
  for (const c of datesAhead(data, p, k)) {
    const day = c.when.slice(0, 10);
    if (c.kind === 'task') out.push({ key: `date:${c.task.id}`, text: `“${c.task.title}” — ${dayWords(day, k)}${c.task.time ? ` at ${c.task.time}` : ''}`, href: task(c.task) });
    else out.push({ key: `date:${c.appt.id}`, text: `${c.appt.title} — ${dayWords(day, k)} at ${c.appt.start.slice(11, 16)}`, href: '#calendar' });
  }
  for (const t of waitsDue(data, p, k)) out.push({ key: `waiting:${t.id}`, text: `Still waiting on ${t.waiting!.on} (“${t.title}”) — expected ${t.waiting!.until === k ? 'today' : shortDate(t.waiting!.until!)}`, href: task(t) });
  for (const x of decisionsOpen(p, k)) out.push({ key: `decision:${x.id}`, text: `“${x.question}” — open ${Math.floor(days(x.createdAt.slice(0, 10), k) / 7)} weeks`, href: tab('decisions') });
  for (const e of testsDone(data, p)) out.push({ key: `tested:${e.id}`, text: `“Test: ${e.title}” is done — what happened?`, href: experimentsHome(p) });
  const found = findOutsDone(data, p);
  if (found) out.push({ key: 'found', text: found === 1 ? 'A Find out task is done — what did you find?' : `${found} Find out tasks are done — what did you find?`, href: tab('model') });
  return out;
}

// The card's contents, or null when it isn't a break (fewer than 7 days, or a finished project).
export function welcomeBack(data: MyDayData, p: Project, k: DateKey = todayKey()): WelcomeBack | null {
  if (!isAway(data, p, k)) return null;
  const stamp = lastActivity(data, p), since = stamp.slice(0, 10), all = meanwhile(data, p, since, k);
  return { days: awayFor(data, p, k), since, stamp, did: recently(data, p, 3), meanwhile: all.slice(0, MEANWHILE_MOST), more: Math.max(0, all.length - MEANWHILE_MOST), next: nextStep(data, p) };
}
