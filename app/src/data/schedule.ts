// When tasks can happen: sleep, commitments, shifts, workouts, prep/travel time and free time.
// Ported from the current MyDay (same rules). All times are minutes from midnight of day k
// (they may go below 0 or past 1440 for the evening before or the morning after).
import { dtToMin, fmtDuration, nowMin, rangeMin, shift, timeToMin, todayKey } from './dates';
import { rotaWorkBlocks } from './rota';
import type { Commitment, DateKey, DayContext, MyDayData } from './types';
import { workoutBlocks } from './workouts';

export interface Block { type: 'sleep' | 'buffer' | 'work' | 'appointment' | 'workout'; start: number; end: number; label: string; c?: TimedThing }
export interface TimedThing { kind: 'work' | 'appointment' | 'workout'; title: string; start: string; end: string; rota?: boolean; id?: string }
export interface Segment { start: number; end: number }

export const KIND_LABEL: Record<TimedThing['kind'], string> = { work: 'Work shift', appointment: 'Appointment', workout: 'Workout' };

export const emptyContext = (): DayContext => ({ energy: null, sleep: { start: null, end: null, estimatedHours: null } });
export const contextFor = (data: MyDayData, k: DateKey) => data.context[k] || emptyContext();
export function ensureContext(data: MyDayData, k: DateKey): DayContext {
  if (!data.context[k]) data.context[k] = emptyContext();
  return data.context[k];
}

// Sleep with both times, in order, and no longer than a day.
function validSleep(ctx: DayContext | undefined) {
  const s = ctx && ctx.sleep;
  if (!s || !s.start || !s.end || s.end <= s.start) return null;
  if (dtToMin(s.end, s.start.slice(0, 10)) - dtToMin(s.start, s.start.slice(0, 10)) > 1440) return null;
  return s as { start: string; end: string };
}

// Commitments that touch day k.
export const commitmentsOn = (data: MyDayData, k: DateKey): Commitment[] =>
  data.commitments.filter(c => dtToMin(c.end, k) > 0 && dtToMin(c.start, k) < 1440);

// Busy blocks for a day: sleep, commitments, rota shifts, timed workouts, and prep/travel around each.
export function blocksFor(data: MyDayData, k: DateKey): Block[] {
  const out: Block[] = [];
  const b = data.settings.bufferMinutes;
  for (const ck of [k, shift(k, 1)]) {
    const sl = validSleep(data.context[ck]);
    if (!sl) continue;
    const s = dtToMin(sl.start, k), e = dtToMin(sl.end, k);
    if (e > 0 && s < 1440 && !out.some(x => x.type === 'sleep' && x.start === s)) out.push({ type: 'sleep', start: s, end: e, label: 'Sleep' });
  }
  const timed: TimedThing[] = [...data.commitments, ...rotaWorkBlocks(data, k), ...workoutBlocks(data, k)];
  for (const c of timed) {
    const s = dtToMin(c.start, k), e = dtToMin(c.end, k);
    if (e + b <= 0 || s - b >= 1440) continue;
    out.push({ type: c.kind, start: s, end: e, label: c.title, c });
    if (b > 0) {
      out.push({ type: 'buffer', start: s - b, end: s, label: `Prep/travel for ${c.title}` });
      out.push({ type: 'buffer', start: e, end: e + b, label: `Travel after ${c.title}` });
    }
  }
  return out.sort((x, y) => x.start - y.start);
}

// The part of the day where tasks may be suggested (never in the past for today).
function taskWindow(data: MyDayData, k: DateKey): Segment {
  const st = data.settings;
  let start = timeToMin(st.earliestTime);
  const end = timeToMin(st.latestTime);
  if (k === todayKey()) start = Math.max(start, Math.ceil(nowMin(k) / 5) * 5);
  return { start, end };
}

// Segments with [s, e) cut out.
export function subtract(segs: Segment[], s: number, e: number): Segment[] {
  const out: Segment[] = [];
  for (const g of segs) {
    if (e <= g.start || s >= g.end) { out.push(g); continue; }
    if (s > g.start) out.push({ start: g.start, end: s });
    if (e < g.end) out.push({ start: e, end: g.end });
  }
  return out;
}

// Free time in the task window, once busy blocks (and anything in `busy`) are taken out.
export function freeSegments(data: MyDayData, k: DateKey, busy: Segment[] = []): Segment[] {
  const w = taskWindow(data, k);
  let segs = w.end > w.start ? [{ start: w.start, end: w.end }] : [];
  for (const bl of blocksFor(data, k)) segs = subtract(segs, bl.start, bl.end);
  for (const x of busy) segs = subtract(segs, x.start, x.end);
  return segs.filter(g => g.end - g.start >= 1);
}

// Overlap warnings for a task at [start, start + minutes). `strict` also checks the task window and the clock.
export function conflictsFor(data: MyDayData, k: DateKey, start: number, minutes: number, others: { start: number; end: number; label: string }[], strict: boolean): string[] {
  const end = start + minutes, st = data.settings;
  const hard: string[] = [], soft: string[] = [], extra: string[] = [];
  for (const bl of blocksFor(data, k)) {
    if (!(start < bl.end && end > bl.start)) continue;
    if (bl.type === 'buffer') soft.push('Overlaps ' + bl.label.charAt(0).toLowerCase() + bl.label.slice(1));
    else if (bl.type === 'sleep') hard.push('Overlaps sleep');
    else hard.push(`Overlaps ${bl.label} (${rangeMin(bl.start, bl.end)})`);
  }
  for (const o of others) if (start < o.end && end > o.start) extra.push(`Overlaps ${o.label}`);
  if (strict) {
    if (start < timeToMin(st.earliestTime)) extra.push(`Starts before ${st.earliestTime}, your earliest time`);
    if (end > timeToMin(st.latestTime)) extra.push(`Ends after ${st.latestTime}, your latest time`);
    if (k === todayKey() && start < nowMin(k)) extra.push('That time has already passed today');
  }
  return hard.concat(hard.length ? [] : soft.slice(0, 1), extra);
}

// Why a task of `need` minutes couldn't be given a time.
export function explainNoFit(data: MyDayData, k: DateKey, need: number, longest: Segment | null): string {
  const st = data.settings;
  if (!longest) {
    if (k === todayKey() && nowMin(k) >= timeToMin(st.latestTime)) {
      return `It's already past ${st.latestTime}, the latest time for suggested tasks today.`;
    }
    return `There's no free time left between ${st.earliestTime} and ${st.latestTime} once commitments, prep/travel and sleep are blocked out.`;
  }
  return `It needs ${fmtDuration(need)}, but the longest free stretch left is ${fmtDuration(longest.end - longest.start)} (${rangeMin(longest.start, longest.end)}).`;
}
