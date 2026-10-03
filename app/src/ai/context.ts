// What "Help me adjust today" sends: today's plan and what surrounds it, gathered here in the app with the same
// rules MyDay already uses (energy limits, the calendar's busy blocks, free time). Times that cross midnight or a
// clock change come from the calendar's own logic (blocksFor, freeSegments), so the model sees what MyDay sees.
//
// Kept small on purpose: appointment titles are left out (just "appointment"), and nothing from other sections
// (Finance, Health records, Study notes) is sent — only a count of Study items due for revision.
import type { PlanContext, Sleep } from '../../../supabase/functions/_shared/ai/schema.ts';
import { CONTRACT_VERSION, LIMITS, SMALL_MINUTES } from '../../../supabase/functions/_shared/ai/schema.ts';
import { dtToMin, minToDt, minToTime, nowMin, parseKey, shift } from '../data/dates';
import { limitFor } from '../data/plan';
import { blocksFor, contextFor, freeSegments, type Segment } from '../data/schedule';
import { dueConcepts } from '../data/study/revision';
import type { DateKey, DayContext, MyDayData } from '../data/types';

// Today's energy as rated (null if not recorded). The same order of preference as "Review my plan".
export const energyOf = (data: MyDayData, k: DateKey) => contextFor(data, k).energy || (data.days[k] && data.days[k].energy) || null;
// How many more tasks today has room for: the energy limit (1 for energy 1–2 or not recorded, 2 for 3, 3 for 4–5),
// counting what's already done — the same rule as "Review my plan".
export const roomToday = (data: MyDayData, k: DateKey) => Math.max(0, limitFor(energyOf(data, k)) - (data.days[k] ? data.days[k].tasks.filter(t => t.done).length : 0));

const clock = (dt: string | null) => (dt ? dt.slice(11, 16) : null);
function sleepOf(c: DayContext | undefined): Sleep | null {
  if (!c) return null;
  const s = c.sleep;
  if (!s.start && !s.end && s.estimatedHours === null) return null;
  let hours = s.estimatedHours;
  if (hours === null && s.start && s.end && s.end > s.start) {
    const day = s.start.slice(0, 10);
    hours = Math.round((dtToMin(s.end, day) - dtToMin(s.start, day)) / 15) / 4; // to the nearest quarter hour
  }
  return { start: s.start, end: s.end, hours };
}

// Time already used by finished tasks that had a time today (so nothing is suggested on top of them).
export function doneBusy(data: MyDayData, k: DateKey): Segment[] {
  const d = data.days[k];
  if (!d) return [];
  return d.tasks.filter(t => t.done && t.scheduledStart && t.scheduledEnd).map(t => ({ start: dtToMin(t.scheduledStart!, k), end: dtToMin(t.scheduledEnd!, k) }));
}

export function buildContext(data: MyDayData, k: DateKey, note: string): PlanContext {
  const d = data.days[k];
  const energy = energyOf(data, k);
  const kinds = { work: 'work', appointment: 'appointment', workout: 'workout', sleep: 'sleep', buffer: 'prep' } as const;
  const trimmed = note.trim().slice(0, LIMITS.noteChars);
  return {
    version: CONTRACT_VERSION,
    date: k,
    weekday: parseKey(k).toLocaleDateString('en-GB', { weekday: 'long' }),
    now: minToTime(Math.max(0, Math.min(1439, nowMin(k)))),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    energy,
    maxPriorities: roomToday(data, k),
    smallOnly: energy === null || energy <= 2,
    smallMinutes: SMALL_MINUTES,
    restDay: !!d && d.rest,
    sleep: { lastNight: sleepOf(data.context[k]), tonight: sleepOf(data.context[shift(k, 1)]) },
    tasks: (d ? d.tasks : []).slice(0, LIMITS.tasks).map(t => ({
      id: t.uid, title: t.title.slice(0, LIMITS.titleChars), category: t.category, minutes: t.minutes, plannedMinutes: t.baseMinutes || t.minutes, done: t.done, start: clock(t.scheduledStart),
    })),
    busy: blocksFor(data, k).slice(0, LIMITS.busy).map(b => ({ kind: kinds[b.type], start: minToDt(b.start, k), end: minToDt(b.end, k) })),
    free: freeSegments(data, k, doneBusy(data, k)).filter(g => g.end - g.start >= 5).slice(0, LIMITS.free).map(g => ({ start: minToTime(g.start), end: minToTime(g.end) })),
    window: { earliest: data.settings.earliestTime, latest: data.settings.latestTime },
    revisionDue: dueConcepts(data.study, k).length,
    note: trimmed || null,
  };
}

// Information that's missing, worked out by the app (shown with whatever the model says is missing).
export function missingInfo(data: MyDayData, k: DateKey): string[] {
  const out: string[] = [];
  if (energyOf(data, k) === null) out.push("Today's energy isn't recorded, so the suggestion stays small.");
  if (!sleepOf(data.context[k])) out.push("Last night's sleep isn't recorded.");
  return out;
}
