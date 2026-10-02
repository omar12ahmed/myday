// Work shifts from the rota, for Today's planning. Ported from the current MyDay (same rules).
// READ-ONLY: the Calendar section that edits the rota hasn't moved to the new app yet, so this file
// never changes the rota. It reads the saved rota, checks it the same way the current MyDay does
// (bad entries are ignored), and works out when you're at work.
import { dayDiff, isDateKey, isDateTime, isTime, shift } from './dates';
import { intIn, isObj, listOf } from './normalize';
import type { DateKey, DateTime, MyDayData } from './types';

type ShiftType = 'day' | 'night' | 'off';
type PlannedType = ShiftType | 'custom';
interface Times { start: string; end: string }
interface Pattern {
  effectiveFrom: DateKey | null;
  anchor: DateKey;
  cycle: ShiftType[];
  times: Record<'day' | 'night', Times>;
  breaks: Record<'day' | 'night', number>;
}
interface Override {
  planned?: { type: PlannedType; start?: string; end?: string; label?: string; breakMin?: number };
  actual?: { status: string; start?: string; end?: string; label?: string; paid?: boolean };
}
interface Entry { kind: 'overtime' | 'unauthorised'; start: DateTime; end: DateTime }
export interface Rota { patterns: Pattern[]; overrides: Record<DateKey, Override>; entries: Entry[] }

// A block of work time, in the same shape as a commitment.
export interface WorkBlock { kind: 'work'; rota: true; title: string; start: DateTime; end: DateTime }

const SHIFT_TYPES: ShiftType[] = ['day', 'night', 'off'];
const PLANNED_TYPES: PlannedType[] = ['day', 'night', 'off', 'custom'];
const ACTUAL_STATUSES = ['worked', 'sick', 'annual_leave', 'cancelled', 'off', 'custom'];
const DEFAULT_TIMES: Record<'day' | 'night', Times> = { day: { start: '07:00', end: '19:00' }, night: { start: '19:00', end: '07:00' } };
const mod = (a: number, n: number) => ((a % n) + n) % n;

// The saved rota, checked the same way as normalizeRota() in the current MyDay.
export function readRota(raw: unknown): Rota {
  const r: Rota = { patterns: [], overrides: {}, entries: [] };
  if (!isObj(raw)) return r;
  const byFrom = new Map<string, Pattern>();
  for (const v of listOf(raw.patterns)) {
    if (!isObj(v) || !isDateKey(v.anchor) || !Array.isArray(v.cycle) || !v.cycle.length || v.cycle.length > 56 ||
        !v.cycle.every(t => SHIFT_TYPES.includes(t))) continue;
    const times = {} as Pattern['times'];
    for (const t of ['day', 'night'] as const) {
      const tv = isObj(v.times) && isObj(v.times[t]) ? v.times[t] : {};
      times[t] = { start: isTime(tv.start) ? tv.start : DEFAULT_TIMES[t].start, end: isTime(tv.end) ? tv.end : DEFAULT_TIMES[t].end };
    }
    const b = isObj(v.breaks) ? v.breaks : {};
    const from = isDateKey(v.effectiveFrom) ? v.effectiveFrom : null;
    byFrom.set(from || '', { effectiveFrom: from, anchor: v.anchor, cycle: v.cycle.slice(), times, breaks: { day: intIn(b.day, 0, 240, 0), night: intIn(b.night, 0, 240, 0) } });
  }
  r.patterns = [...byFrom.values()].sort((a, b) => ((a.effectiveFrom || '') < (b.effectiveFrom || '') ? -1 : 1));
  if (isObj(raw.overrides)) {
    for (const d of Object.keys(raw.overrides)) {
      const o = raw.overrides[d];
      if (!isDateKey(d) || !isObj(o)) continue;
      const out: Override = {};
      if (isObj(o.planned) && PLANNED_TYPES.includes(o.planned.type as PlannedType)) {
        const p: NonNullable<Override['planned']> = { type: o.planned.type as PlannedType };
        if (isTime(o.planned.start) && isTime(o.planned.end)) { p.start = o.planned.start; p.end = o.planned.end; }
        if (typeof o.planned.label === 'string' && o.planned.label.trim()) p.label = o.planned.label.trim().slice(0, 40);
        if (o.planned.breakMin !== undefined) p.breakMin = intIn(o.planned.breakMin, 0, 240, 0);
        out.planned = p;
      }
      if (isObj(o.actual) && ACTUAL_STATUSES.includes(o.actual.status as string)) {
        const a: NonNullable<Override['actual']> = { status: o.actual.status as string };
        if (isTime(o.actual.start) && isTime(o.actual.end)) { a.start = o.actual.start; a.end = o.actual.end; }
        if (typeof o.actual.label === 'string' && o.actual.label.trim()) a.label = o.actual.label.trim().slice(0, 40);
        if (a.status === 'custom') a.paid = o.actual.paid === true;
        out.actual = a;
      }
      if (out.planned || out.actual) r.overrides[d] = out;
    }
  }
  for (const e of listOf(raw.entries)) {
    if (!isObj(e) || (e.kind !== 'overtime' && e.kind !== 'unauthorised') || !isDateTime(e.start) || !isDateTime(e.end) || e.end <= e.start) continue;
    r.entries.push({ kind: e.kind, start: e.start, end: e.end });
  }
  return r;
}

// The pattern version in force on a date: the latest one whose effective date has arrived.
function patternFor(r: Rota, d: DateKey): Pattern | null {
  let best: Pattern | null = null;
  for (const v of r.patterns) {
    if (v.effectiveFrom && v.effectiveFrom > d) continue;
    if (!best || (v.effectiveFrom || '') >= (best.effectiveFrom || '')) best = v;
  }
  return best;
}

// End time on or before the start time means the shift ends the next day (e.g. 19:00–07:00).
const endDateFor = (d: DateKey, start: string, end: string) => (end <= start ? shift(d, 1) : d);

// What the rota says for a date (the pattern, unless this one date was changed).
function plannedFor(r: Rota, d: DateKey) {
  const v = patternFor(r, d), po = r.overrides[d]?.planned;
  let type: PlannedType | null = v ? v.cycle[mod(dayDiff(d, v.anchor), v.cycle.length)] : null;
  if (po) type = po.type;
  if (!type) return null;
  let start: string | null = null, end: string | null = null;
  if (type === 'day' || type === 'night') {
    const tv = v ? v.times[type] : DEFAULT_TIMES[type];
    start = po && po.start ? po.start : tv.start;
    end = po && po.start ? po.end ?? null : tv.end;
  } else if (type === 'custom' && po && po.start) {
    start = po.start; end = po.end ?? null;
  }
  const startDt = start && end ? `${d}T${start}` : null;
  const endDt = start && end ? `${endDateFor(d, start, end)}T${end}` : null;
  return { type, start, end, startDt, endDt, works: !!startDt };
}

// What actually happened. Nothing recorded = assumed to go as planned.
function actualFor(r: Rota, d: DateKey) {
  const p = plannedFor(r, d), a = r.overrides[d]?.actual;
  if (!a) {
    return p && p.works
      ? { status: 'worked', works: true, startDt: p.startDt, endDt: p.endDt, label: '', paidCustom: false }
      : { status: 'off', works: false, startDt: null, endDt: null, label: '', paidCustom: false };
  }
  if (a.status === 'worked') {
    const s = a.start || p?.start, e = a.start ? a.end : p?.end;
    if (!s || !e) return { status: 'worked', works: false, startDt: null, endDt: null, label: '', paidCustom: false };
    return { status: 'worked', works: true, startDt: `${d}T${s}`, endDt: `${endDateFor(d, s, e)}T${e}`, label: '', paidCustom: false };
  }
  if (a.status === 'custom') {
    const works = !!(a.start && a.end);
    return { status: 'custom', works, label: a.label || 'Custom', paidCustom: !!a.paid,
      startDt: works ? `${d}T${a.start}` : null, endDt: works ? `${endDateFor(d, a.start!, a.end!)}T${a.end}` : null };
  }
  return { status: a.status, works: false, startDt: null, endDt: null, label: '', paidCustom: false };
}

// Work time around day k (the day before, k and the day after): shifts as they happened, or as
// planned if nothing was recorded, plus overtime. Same as rotaWorkBlocks() in the current MyDay.
export function rotaWorkBlocks(data: MyDayData, k: DateKey): WorkBlock[] {
  const r = readRota(data.rota), out: WorkBlock[] = [];
  for (const d of [shift(k, -1), k, shift(k, 1)]) {
    const a = actualFor(r, d);
    if (!a.works || !a.startDt || !a.endDt) continue;
    const p = plannedFor(r, d);
    const title = a.status === 'custom' ? a.label : p && p.type === 'night' ? 'Night shift' : p && p.type === 'day' ? 'Day shift' : 'Shift';
    out.push({ kind: 'work', rota: true, title, start: a.startDt, end: a.endDt });
  }
  for (const e of r.entries) {
    if (e.kind !== 'overtime') continue;
    if (e.end.slice(0, 10) < shift(k, -1) || e.start.slice(0, 10) > shift(k, 1)) continue;
    out.push({ kind: 'work', rota: true, title: 'Overtime', start: e.start, end: e.end });
  }
  return out;
}
