// What MyDay notices about how you actually work, worked out on this device from what's already saved: your day
// plans (what was planned, how long, what got ticked off), Study sessions (planned and actual length, when they
// started), energy and sleep, and work days from the Calendar. Nothing is sent anywhere, and no AI is involved: it's
// plain counting, so every pattern can say exactly what it's based on ("Why?").
//
// Patterns, not judgements. Each one:
// - needs enough examples before it's shown at all (an "early sign" below 20, a "clear pattern" from 20),
// - counts only days you used MyDay (ticked something off, or did the evening check-in) — a task you did but didn't
//   tick off would otherwise count as not done,
// - looks at the last 8 weeks, so it follows how you work now, and
// - is only used once you say it's right (see saved.ts and adapt.ts).
import { CAT_LABEL } from '../plan';
import { actualFor } from '../rota';
import { isDateTime, shift } from '../dates';
import type { Category, DateKey, MyDayData, PatternAnswer, Blocker } from '../types';
import { CATEGORIES } from './saved';

export const WEEKS = 8;
const CLEAR = 20;           // examples from which a pattern counts as clear
const CUTS = [15, 20, 25, 30, 45]; // task lengths compared ("25 min or less" against longer)

export type Use =
  | { kind: 'maxMinutes'; category: Category; minutes: number; label: string }
  | { kind: 'maxTasks'; count: number; label: string };
export interface Pattern {
  id: string;            // stable, so your answer stays with it: "size:learning", "sleep-energy", …
  title: string;
  why: string;           // the evidence, in numbers ("7 of 9 … compared with 2 of 7 …")
  examples: number;
  since: DateKey;
  last: DateKey;
  strength: 'early' | 'clear';
  use: Use | null;       // what MyDay could do with it, if you say so
  tip: string | null;
}

export const BLOCKER_LABEL: Record<Blocker, string> = {
  big: "It's too big", start: "I don't know where to start", boring: "It's boring", tired: "I'm too tired for it",
  info: "I'm missing something I need", notneeded: "It doesn't matter any more", other: 'Something else',
};
const BLOCKER_TIP: Partial<Record<Blocker, string>> = {
  big: 'When that happens, MyDay offers to turn the first 10-minute piece into its own task.',
  start: 'When that happens, MyDay asks for just the first step and makes that the task for today.',
  boring: 'When that happens, MyDay offers a 10-minute version — stopping after 10 minutes is fine.',
  tired: 'When that happens, MyDay offers to move it to your next day off.',
  info: 'When that happens, MyDay notes what you need and keeps the task under Any time until you have it.',
};

// ---------- Helpers ----------
const name = (c: Category) => CAT_LABEL[c].toLowerCase();
const ticked = (xs: { done: boolean }[]) => xs.filter(x => x.done).length;
const rate = (xs: { done: boolean }[]) => ticked(xs) / xs.length;
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
const one = (n: number) => String(Math.round(n * 10) / 10);
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
function make(id: string, title: string, why: string, keys: DateKey[], use: Use | null = null, tip: string | null = null): Pattern {
  const ks = [...keys].sort();
  return { id, title, why, examples: ks.length, since: ks[0], last: ks[ks.length - 1], strength: ks.length >= CLEAR ? 'clear' : 'early', use, tip };
}

// A day with work on it: a shift from the Calendar (not when off sick), overtime, or a work commitment.
export function isWorkDay(data: MyDayData, k: DateKey): boolean {
  const a = actualFor(data, k);
  return (a.works && a.status !== 'sick') || data.rota.entries.some(e => e.kind === 'overtime' && e.start.slice(0, 10) === k)
    || data.commitments.some(c => c.kind === 'work' && c.start.slice(0, 10) === k);
}

// Days in the window that you used MyDay: a plan (not a rest day) with something ticked off, or checked in.
export function usedDays(data: MyDayData, k: DateKey): DateKey[] {
  const from = shift(k, -WEEKS * 7);
  return Object.keys(data.days).filter(d => d >= from && d < k).sort().filter(d => {
    const day = data.days[d];
    return !day.rest && day.tasks.length > 0 && (day.checkedIn || day.tasks.some(t => t.done));
  });
}
const planTasks = (data: MyDayData, days: DateKey[]) => days.flatMap(k => data.days[k].tasks.map(t => ({ k, cat: t.category, min: t.minutes, done: t.done })));

// ---------- The patterns ----------
// Shorter tasks of one kind get ticked off more often than longer ones.
function size(data: MyDayData, days: DateKey[], cat: Category): Pattern | null {
  const xs = planTasks(data, days).filter(x => x.cat === cat);
  if (xs.length < 10) return null;
  let best: { cut: number; s: typeof xs; l: typeof xs; diff: number } | null = null;
  for (const cut of CUTS) {
    const s = xs.filter(x => x.min <= cut), l = xs.filter(x => x.min > cut);
    if (s.length < 4 || l.length < 4) continue;
    const diff = rate(s) - rate(l);
    // The clearest difference; on a tie, the shortest length that says it (the evidence is about those tasks).
    if (diff >= 0.25 && (!best || diff > best.diff + 1e-9)) best = { cut, s, l, diff };
  }
  if (!best) return null;
  return make(`size:${cat}`, `Shorter ${name(cat)} tasks get done more often`,
    `In the last ${WEEKS} weeks, ${ticked(best.s)} of ${best.s.length} ${name(cat)} tasks of ${best.cut} min or less were ticked off, compared with ${ticked(best.l)} of ${best.l.length} longer ones.`,
    xs.map(x => x.k), { kind: 'maxMinutes', category: cat, minutes: best.cut, label: `Keep ${name(cat)} tasks to ${best.cut} min or less when building my day` });
}

// Study sessions last much less (or much more) than planned.
function studyLength(data: MyDayData, k: DateKey): Pattern | null {
  const from = shift(k, -WEEKS * 7);
  const ss = data.study.sessions.filter(s => s.status === 'done' && !s.short && s.plannedMin >= 10 && s.activeMs >= 60000 && s.date >= from && s.date < k);
  if (ss.length < 5) return null;
  const ratio = median(ss.map(s => s.activeMs / 60000 / s.plannedMin));
  const actual = round5(median(ss.map(s => s.activeMs / 60000))), planned = round5(median(ss.map(s => s.plannedMin)));
  const why = `In the last ${WEEKS} weeks, your ${ss.length} study sessions were usually planned for about ${planned} min and lasted about ${actual} min.`;
  if (ratio <= 0.6) {
    return make('length:study', 'Study sessions usually end sooner than planned', why, ss.map(s => s.date),
      { kind: 'maxMinutes', category: 'learning', minutes: actual, label: `Keep learning tasks to ${actual} min or less when building my day` });
  }
  if (ratio >= 1.4) return make('length:study', 'Study sessions often run longer than planned', why, ss.map(s => s.date));
  return null;
}

// When you study (by the time sessions started).
function studyTime(data: MyDayData, k: DateKey): Pattern | null {
  const from = shift(k, -WEEKS * 7);
  const ss = data.study.sessions.filter(s => s.status === 'done' && s.date >= from && s.date < k && isDateTime(s.startedAt));
  if (ss.length < 6) return null;
  const part = (dt: string) => { const h = Number(dt.slice(11, 13)); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; };
  const WHEN = { morning: 'before 12:00', afternoon: 'between 12:00 and 17:00', evening: 'from 17:00' } as const;
  for (const p of ['morning', 'afternoon', 'evening'] as const) {
    const n = ss.filter(s => part(s.startedAt) === p).length;
    if (n / ss.length >= 2 / 3) {
      return make('time:study', `You usually study in the ${p}`, `${n} of your ${ss.length} study sessions in the last ${WEEKS} weeks started ${WHEN[p]}.`, ss.map(s => s.date));
    }
  }
  return null;
}

// Energy (as you set it each morning) after short nights, and on work days.
function energyDays(data: MyDayData, k: DateKey) {
  const from = shift(k, -WEEKS * 7);
  return Object.entries(data.context).filter(([d, c]) => d >= from && d <= k && c.energy).map(([d, c]) => ({ k: d, e: c.energy as number, sleep: c.sleep?.estimatedHours ?? null }));
}
const avg = (xs: { e: number }[]) => xs.reduce((a, x) => a + x.e, 0) / xs.length;
function sleepEnergy(data: MyDayData, k: DateKey): Pattern | null {
  const xs = energyDays(data, k).filter(x => x.sleep !== null);
  const short = xs.filter(x => x.sleep! < 6), enough = xs.filter(x => x.sleep! >= 7);
  if (short.length < 3 || enough.length < 3 || avg(enough) - avg(short) < 1) return null;
  return make('sleep-energy', 'Your energy is usually lower after a short night',
    `After less than 6 hours' sleep your energy was about ${one(avg(short))} out of 5 (${plural(short.length, 'day')}), compared with about ${one(avg(enough))} after 7 hours or more (${plural(enough.length, 'day')}).`,
    [...short, ...enough].map(x => x.k));
}
function workEnergy(data: MyDayData, k: DateKey): Pattern | null {
  const xs = energyDays(data, k).filter(x => actualFor(data, x.k).status !== 'sick');
  const work = xs.filter(x => isWorkDay(data, x.k)), off = xs.filter(x => !isWorkDay(data, x.k));
  if (work.length < 4 || off.length < 4) return null;
  const diff = avg(off) - avg(work);
  if (Math.abs(diff) < 1) return null;
  return make('work-energy', `Your energy is usually ${diff > 0 ? 'lower' : 'higher'} on work days`,
    `About ${one(avg(work))} out of 5 on ${plural(work.length, 'work day')}, compared with about ${one(avg(off))} on ${plural(off.length, 'day')} off, in the last ${WEEKS} weeks.`,
    xs.map(x => x.k));
}

// Days with fewer tasks get finished more often.
function taskCount(data: MyDayData, days: DateKey[]): Pattern | null {
  const by = (n: number) => days.filter(k => data.days[k].tasks.length === n).map(k => ({ k, done: data.days[k].tasks.every(t => t.done) }));
  for (const m of [2, 1]) {
    const a = by(m), b = by(m + 1);
    if (a.length < 4 || b.length < 4 || rate(a) - rate(b) < 0.3 || rate(b) > 0.5) continue;
    return make('count', 'You finish everything more often with fewer tasks',
      `You ticked off everything on ${ticked(a)} of ${plural(a.length, 'day')} with ${plural(m, 'task')}, and on ${ticked(b)} of ${plural(b.length, 'day')} with ${m + 1}.`,
      [...a, ...b].map(x => x.k), { kind: 'maxTasks', count: m, label: `Plan at most ${plural(m, 'task')} a day, even when my energy allows more` });
  }
  return null;
}

// One kind of task is left for another day much more often than the others.
function leftForLater(data: MyDayData, days: DateKey[]): Pattern | null {
  const all = planTasks(data, days);
  let best: { cat: Category; open: number; n: number; r: number } | null = null;
  for (const cat of CATEGORIES) {
    const xs = all.filter(x => x.cat === cat);
    if (xs.length < 6) continue;
    const r = 1 - rate(xs);
    if (r >= 0.6 && (!best || r > best.r)) best = { cat, open: xs.length - ticked(xs), n: xs.length, r };
  }
  if (!best) return null;
  const others = all.filter(x => x.cat !== best!.cat);
  if (others.length < 6 || best.r - (1 - rate(others)) < 0.25) return null;
  const c = best.cat;
  return make(`left:${c}`, `${CAT_LABEL[c]} tasks are the ones most often left for another day`,
    `${best.open} of your ${best.n} ${name(c)} tasks in the last ${WEEKS} weeks weren't ticked off, compared with ${others.length - ticked(others)} of ${others.length} other tasks.`,
    all.filter(x => x.cat === c).map(x => x.k), null, 'Making them smaller, or writing down just the first step, often helps with this kind of task.');
}

// What you said was in the way when a task kept moving (Inbox → Tasks).
function blockers(data: MyDayData, k: DateKey): Pattern | null {
  const from = shift(k, -WEEKS * 7);
  const bs = data.tasks.items.flatMap(t => t.blockers.filter(b => b.on >= from && b.on <= k));
  if (bs.length < 3) return null;
  const counts = new Map<Blocker, number>();
  for (const b of bs) if (b.reason !== 'other') counts.set(b.reason, (counts.get(b.reason) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] < 3 || top[1] < bs.length / 2) return null;
  return make('blocker', `What usually gets in the way: “${BLOCKER_LABEL[top[0]]}”`,
    `You chose that ${top[1]} of the ${bs.length} times you said what was in the way of a task.`, bs.map(b => b.on), null, BLOCKER_TIP[top[0]] ?? null);
}

// Every pattern there's enough evidence for today, in a fixed order.
export function findPatterns(data: MyDayData, k: DateKey): Pattern[] {
  const days = usedDays(data, k);
  return [
    ...CATEGORIES.map(c => size(data, days, c)), studyLength(data, k), taskCount(data, days), leftForLater(data, days),
    studyTime(data, k), sleepEnergy(data, k), workEnergy(data, k), blockers(data, k),
  ].filter((p): p is Pattern => !!p);
}

// ---------- What's shown ----------
// New ones (not answered yet, or said "Not really" but with clearly more evidence since), and the ones you said are
// right (even if they've become less clear lately — that's shown, not hidden).
export interface Shown { id: string; title: string; p: Pattern | null; answer: PatternAnswer | null; again: boolean }
export function noticed(data: MyDayData, k: DateKey): { fresh: Shown[]; confirmed: Shown[] } {
  const fresh: Shown[] = [], confirmed: Shown[] = [];
  const found = findPatterns(data, k);
  for (const p of found) {
    const a = data.patterns.answers[p.id] ?? null;
    if (!a) fresh.push({ id: p.id, title: p.title, p, answer: null, again: false });
    else if (a.said === 'yes') confirmed.push({ id: p.id, title: p.title, p, answer: a, again: false });
    else if (p.examples >= a.examples + Math.max(5, Math.ceil(a.examples / 2))) fresh.push({ id: p.id, title: p.title, p, answer: a, again: true });
  }
  for (const [id, a] of Object.entries(data.patterns.answers)) {
    if (a.said === 'yes' && !found.some(p => p.id === id)) confirmed.push({ id, title: a.title, p: null, answer: a, again: false });
  }
  return { fresh, confirmed };
}
