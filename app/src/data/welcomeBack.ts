// Welcome back (specs/projects-welcome-back.md): opening a project after 7 days or more with no work on it, the thread
// to pick up — what you did last, what came up while you were away, where you left off and the next step. Worked out
// from what's saved each time (nothing new is kept but a device's "Got it"). "What you did last" is Recently's
// reconstructed list, never a full history. Never sent to AI.
import { datesAhead, decisionsOpen, findOutsDone, pastOpen, waitsDue } from './attention';
import { dayDiff, shift, shortDate, todayKey } from './dates';
import { experimentsHome, testsDone } from './experiments';
import { lastActivity, nextStep, recently, type Happening } from './projects';
import type { DateKey, MyDayData, Project, TaskItem } from './types';

export const AWAY_DAYS = 7;
const days = (a: DateKey, b: DateKey) => dayDiff(b, a);
// Days since the project's last activity (none counts as today).
export const awayFor = (data: MyDayData, p: Project, k: DateKey = todayKey()) => Math.max(0, days(lastActivity(data, p).slice(0, 10), k));
// "18 days", "3 weeks", "2 months", "1 year".
export const awayWords = (n: number) => (n < 14 ? `${n} days` : n < 60 ? `${Math.floor(n / 7)} weeks` : n < 365 ? `${Math.floor(n / 30)} months`
  : Math.floor(n / 365) === 1 ? '1 year' : `${Math.floor(n / 365)} years`);
// Away: 7 days or more with no work on it, unless it's finished (nothing to pick up).
export const isAway = (data: MyDayData, p: Project, k: DateKey = todayKey()) => p.status !== 'done' && awayFor(data, p, k) >= AWAY_DAYS;

// A break: how long, since which day, and the last-activity stamp it's measured from.
export interface Break { days: number; since: DateKey; stamp: string }
export const breakOf = (data: MyDayData, p: Project, k: DateKey = todayKey()): Break | null => {
  if (!isAway(data, p, k)) return null;
  const stamp = lastActivity(data, p);
  return { days: awayFor(data, p, k), since: stamp.slice(0, 10), stamp };
};
// Greets unless "Got it" was pressed for this break or a later one (`dismissed`: the stamp then). A stamp that moved
// back (a task unticked or deleted) isn't a new break.
export const greets = (stamp: string, dismissed?: string) => !dismissed || stamp > dismissed;
export interface Meanwhile { key: string; text: string; href: string }
export interface WelcomeBack extends Break { did: Happening[]; meanwhile: Meanwhile[]; more: number; next: TaskItem | null }
export const MEANWHILE_MOST = 6;
const enc = encodeURIComponent;
const dayWords = (day: DateKey, k: DateKey) => (day === k ? 'today' : day === shift(k, 1) ? 'tomorrow' : `on ${shortDate(day)}`);

// What came up while you were away, each one tap away and each task once: what's today or tomorrow first, then dates
// that came and went since you last worked on it and are still open (not one waiting, or starting after another task),
// waits now due, later dates in the next week, decisions open a while, and Test or Find out tasks done with nothing
// recorded. The next step (`nextId`) has its own place on the card, so it isn't repeated here.
export function meanwhile(data: MyDayData, p: Project, since: DateKey, k: DateKey = todayKey(), nextId: string | null = null): Meanwhile[] {
  const out: (Meanwhile & { rank: number })[] = [], seen = new Set<string>(nextId ? [nextId] : []);
  const task = (t: TaskItem) => `#today/tasks/${enc(t.id)}`, tab = (t: string) => `#projects/p/${enc(p.id)}/${t}`;
  const once = (id: string) => (seen.has(id) ? false : (seen.add(id), true));
  for (const t of waitsDue(data, p, k)) if (once(t.id)) out.push({ rank: 2, key: `waiting:${t.id}`, text: `Still waiting on ${t.waiting!.on} (“${t.title}”) — expected ${t.waiting!.until === k ? 'today' : shortDate(t.waiting!.until!)}`, href: task(t) });
  for (const t of pastOpen(data, p, k)) if (t.due! >= since && once(t.id)) out.push({ rank: 1, key: `past:${t.id}`, text: `“${t.title}” — ${t.deadline?.kind === 'aim' ? 'was aimed for' : 'was due'} ${shortDate(t.due!)}, still open`, href: task(t) });
  for (const c of datesAhead(data, p, k)) {
    const day = c.when.slice(0, 10), rank = day <= shift(k, 1) ? 0 : 3;
    if (c.kind === 'task') { if (once(c.task.id)) out.push({ rank, key: `date:${c.task.id}`, text: `“${c.task.title}” — ${dayWords(day, k)}${c.task.time ? ` at ${c.task.time}` : ''}`, href: task(c.task) }); }
    else out.push({ rank, key: `date:${c.appt.id}`, text: `${c.appt.title} — ${dayWords(day, k)} at ${c.appt.start.slice(11, 16)}`, href: '#calendar' });
  }
  for (const x of decisionsOpen(p, k)) out.push({ rank: 4, key: `decision:${x.id}`, text: `“${x.question}” — open ${Math.floor(days(x.createdAt.slice(0, 10), k) / 7)} weeks`, href: tab('decisions') });
  for (const e of testsDone(data, p)) out.push({ rank: 5, key: `tested:${e.id}`, text: `“Test: ${e.title}” is done — what happened?`, href: experimentsHome(p) });
  const found = findOutsDone(data, p);
  if (found) out.push({ rank: 5, key: 'found', text: found === 1 ? 'A Find out task is done — what did you find?' : `${found} Find out tasks are done — what did you find?`, href: tab('model') });
  return out.sort((a, b) => a.rank - b.rank).map(({ rank: _rank, ...m }) => m);
}

// The card's contents for a break (worked out afresh each time from what's saved).
export function welcomeView(data: MyDayData, p: Project, b: Break, k: DateKey = todayKey()): WelcomeBack {
  const next = nextStep(data, p), all = meanwhile(data, p, b.since, k, next?.id ?? null);
  return { ...b, did: recently(data, p, 3), meanwhile: all.slice(0, MEANWHILE_MOST), more: Math.max(0, all.length - MEANWHILE_MOST), next };
}
// The card's contents, or null when it isn't a break (fewer than 7 days, or a finished project).
export function welcomeBack(data: MyDayData, p: Project, k: DateKey = todayKey()): WelcomeBack | null {
  const b = breakOf(data, p, k);
  return b ? welcomeView(data, p, b, k) : null;
}
