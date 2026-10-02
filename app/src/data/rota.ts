// The shift rota: pattern versions, one-date changes, overtime/absence entries and colours.
// Ported from the current MyDay (same rules, same names). Nothing here saves; functions that change
// data take `data` — a draft the store saves afterwards (see storage.ts).
//
// How a date is worked out:
//   1. The pattern version in force on that date (the latest one whose "from" date has arrived)
//      gives the planned shift from the cycle, counted from the version's anchor date.
//   2. A one-date change (overrides[date].planned) replaces that, for that date only.
//   3. What actually happened (overrides[date].actual) is recorded separately; with nothing recorded,
//      the shift is assumed to go as planned.
// Overtime and unauthorised absence are separate entries with their own start and end.
import { dayDiff, isDateKey, isDateTime, isTime, shift, shortDate } from './dates';
import { intIn, isObj, uid } from './util';
import type { ActualStatus, ColourKey, DateKey, DateOverride, DateTime, EntryKind, MyDayData, PatternVersion, PlannedType, Rota, RotaEntry, ShiftType } from './types';

export const SHIFT_TYPES: ShiftType[] = ['day', 'night', 'off'];
const PLANNED_TYPES: PlannedType[] = ['day', 'night', 'off', 'custom'];
const ACTUAL_STATUSES: ActualStatus[] = ['worked', 'sick', 'annual_leave', 'cancelled', 'off', 'custom'];
const ENTRY_KINDS: EntryKind[] = ['overtime', 'unauthorised'];

export const STATUS_LABEL: Record<string, string> = {
  day: 'Day shift', night: 'Night shift', off: 'Off', custom: 'Custom', sick: 'Sick', annual_leave: 'Annual leave',
  cancelled: 'Cancelled', unauthorised: 'Unauthorised absence', overtime: 'Overtime', appointment: 'Appointment', worked: 'Worked',
};
export const SHORT_LABEL: Record<string, string> = {
  day: 'Day', night: 'Night', off: 'Off', custom: 'Custom', sick: 'Sick', annual_leave: 'Leave', cancelled: 'Cancel',
  unauthorised: 'Absent', overtime: '+OT', appointment: 'Appt',
};
export const DEFAULT_COLOURS: Record<ColourKey, string> = {
  day: '#2f8f4e', night: '#a8d5f7', off: '#c9d1cc', sick: '#f5a3a3', unauthorised: '#111111',
  annual_leave: '#c9b5ec', cancelled: '#a7a7a7', custom: '#f1c66a', overtime: '#f0a05a', appointment: '#a9b0e0',
};
export const DEFAULT_TIMES: PatternVersion['times'] = { day: { start: '07:00', end: '19:00' }, night: { start: '19:00', end: '07:00' } };
// 4 day shifts → 4 off → 4 night shifts → 4 off.
export const DEFAULT_CYCLE: ShiftType[] = ['day', 'day', 'day', 'day', 'off', 'off', 'off', 'off', 'night', 'night', 'night', 'night', 'off', 'off', 'off', 'off'];
export const isHex = (s: unknown): s is string => typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s);
export const mod = (a: number, n: number) => ((a % n) + n) % n;

export const emptyRota = (): Rota => ({ patterns: [], overrides: {}, entries: [], colours: { ...DEFAULT_COLOURS } });

// Checks a saved rota exactly as normalizeRota() in the current MyDay does: bad entries are dropped
// (and counted), and missing parts get their defaults.
export function normalizeRota(raw: unknown, report = { dropped: 0 }): Rota {
  const r = emptyRota();
  if (!isObj(raw)) return r;
  if (Array.isArray(raw.patterns)) {
    const byFrom = new Map<string, PatternVersion>();
    for (const v of raw.patterns) {
      if (!isObj(v) || !isDateKey(v.anchor) || !Array.isArray(v.cycle) || !v.cycle.length || v.cycle.length > 56 ||
          !v.cycle.every(t => SHIFT_TYPES.includes(t))) { report.dropped++; continue; }
      const times = {} as PatternVersion['times'];
      for (const t of ['day', 'night'] as const) {
        const tv = isObj(v.times) && isObj(v.times[t]) ? v.times[t] : {};
        times[t] = { start: isTime(tv.start) ? tv.start : DEFAULT_TIMES[t].start, end: isTime(tv.end) ? tv.end : DEFAULT_TIMES[t].end };
      }
      const breaks = { day: intIn(isObj(v.breaks) ? v.breaks.day : 0, 0, 240, 0), night: intIn(isObj(v.breaks) ? v.breaks.night : 0, 0, 240, 0) };
      const from = isDateKey(v.effectiveFrom) ? v.effectiveFrom : null;
      byFrom.set(from || '', { id: typeof v.id === 'string' && v.id ? v.id : 'p' + uid(), effectiveFrom: from, anchor: v.anchor, cycle: v.cycle.slice() as ShiftType[], times, breaks });
    }
    r.patterns = [...byFrom.values()].sort((a, b) => ((a.effectiveFrom || '') < (b.effectiveFrom || '') ? -1 : 1));
  }
  if (isObj(raw.overrides)) {
    for (const d of Object.keys(raw.overrides)) {
      const o = raw.overrides[d];
      if (!isDateKey(d) || !isObj(o)) { report.dropped++; continue; }
      const out: DateOverride = {};
      if (isObj(o.planned) && PLANNED_TYPES.includes(o.planned.type as PlannedType)) {
        const p: NonNullable<DateOverride['planned']> = { type: o.planned.type as PlannedType };
        if (isTime(o.planned.start) && isTime(o.planned.end)) { p.start = o.planned.start; p.end = o.planned.end; }
        if (typeof o.planned.label === 'string' && o.planned.label.trim()) p.label = o.planned.label.trim().slice(0, 40);
        if (o.planned.breakMin !== undefined) p.breakMin = intIn(o.planned.breakMin, 0, 240, 0);
        out.planned = p;
      }
      if (isObj(o.actual) && ACTUAL_STATUSES.includes(o.actual.status as ActualStatus)) {
        const a: NonNullable<DateOverride['actual']> = { status: o.actual.status as ActualStatus };
        if (isTime(o.actual.start) && isTime(o.actual.end)) { a.start = o.actual.start; a.end = o.actual.end; }
        if (typeof o.actual.label === 'string' && o.actual.label.trim()) a.label = o.actual.label.trim().slice(0, 40);
        if (a.status === 'custom') a.paid = o.actual.paid === true;
        out.actual = a;
      }
      if (out.planned || out.actual) r.overrides[d] = out; else report.dropped++;
    }
  }
  if (Array.isArray(raw.entries)) {
    for (const e of raw.entries) {
      if (!isObj(e) || !ENTRY_KINDS.includes(e.kind as EntryKind) || !isDateTime(e.start) || !isDateTime(e.end) || e.end <= e.start) { report.dropped++; continue; }
      r.entries.push({ id: typeof e.id === 'string' && e.id ? e.id : 'e' + uid(), kind: e.kind as EntryKind, start: e.start, end: e.end, note: typeof e.note === 'string' ? e.note.slice(0, 80) : '' });
    }
    r.entries.sort((a, b) => (a.start < b.start ? -1 : 1));
  }
  if (isObj(raw.colours)) for (const k of Object.keys(DEFAULT_COLOURS) as ColourKey[]) if (isHex(raw.colours[k])) r.colours[k] = (raw.colours[k] as string).toLowerCase();
  return r;
}
// Times for a shift shown on its own date: "19:00–07:00 (next day)".
export function fmtShiftRange(s: DateTime, e: DateTime, d: DateKey): string {
  const tag = (x: DateKey) => (x === d ? '' : dayDiff(x, d) === 1 ? ' (next day)' : dayDiff(x, d) === -1 ? ' (day before)' : ` (${shortDate(x)})`);
  return `${s.slice(11)}${tag(s.slice(0, 10))}–${e.slice(11)}${tag(e.slice(0, 10))}`;
}

// The pattern version in force on a date: the latest one whose effective date has arrived.
export function patternFor(data: MyDayData, d: DateKey): PatternVersion | null {
  let best: PatternVersion | null = null;
  for (const v of data.rota.patterns) {
    if (v.effectiveFrom && v.effectiveFrom > d) continue;
    if (!best || (v.effectiveFrom || '') >= (best.effectiveFrom || '')) best = v;
  }
  return best;
}
// The cycle's shift type on a date, from the pattern alone (ignoring one-date changes).
export function rotaTypeOn(data: MyDayData, d: DateKey): ShiftType | null {
  const v = patternFor(data, d);
  return v ? v.cycle[mod(dayDiff(d, v.anchor), v.cycle.length)] : null;
}
// End time on or before the start time means the shift ends the next day (e.g. 19:00–07:00).
const endDateFor = (d: DateKey, start: string, end: string) => (end <= start ? shift(d, 1) : d);

export interface Planned {
  date: DateKey; type: PlannedType; label: string | null; start: string | null; end: string | null;
  startDt: DateTime | null; endDt: DateTime | null; breakMin: number; source: 'rota' | 'changed' | 'none'; works: boolean;
}
// What the rota says for a date (the pattern, unless this one date was changed).
export function plannedFor(data: MyDayData, d: DateKey): Planned | null {
  const v = patternFor(data, d), po = data.rota.overrides[d]?.planned;
  let type: PlannedType | null = v ? v.cycle[mod(dayDiff(d, v.anchor), v.cycle.length)] : null;
  let source: Planned['source'] = v ? 'rota' : 'none';
  if (po) { type = po.type; source = 'changed'; }
  if (!type) return null;
  let start: string | null = null, end: string | null = null, breakMin = 0, label: string | null = null;
  if (type === 'day' || type === 'night') {
    const tv = v ? v.times[type] : DEFAULT_TIMES[type];
    start = po && po.start ? po.start : tv.start;
    end = po && po.start ? po.end ?? null : tv.end;
    breakMin = po && po.breakMin !== undefined ? po.breakMin : v ? v.breaks[type] : 0;
  } else if (type === 'custom') {
    label = (po && po.label) || 'Custom';
    if (po && po.start) { start = po.start; end = po.end ?? null; breakMin = po.breakMin || 0; }
  }
  const startDt = start && end ? `${d}T${start}` : null;
  const endDt = start && end ? `${endDateFor(d, start, end)}T${end}` : null;
  return { date: d, type, label, start, end, startDt, endDt, breakMin, source, works: !!startDt };
}

export interface Actual {
  status: string; assumed: boolean; works: boolean; startDt?: DateTime | null; endDt?: DateTime | null;
  breakMin?: number; label?: string; paidCustom?: boolean; edited?: boolean;
}
// What actually happened. Nothing recorded = assumed to go as planned ("assumed").
export function actualFor(data: MyDayData, d: DateKey): Actual {
  const p = plannedFor(data, d), a = data.rota.overrides[d]?.actual;
  if (!a) {
    return p && p.works
      ? { status: 'worked', assumed: true, startDt: p.startDt, endDt: p.endDt, breakMin: p.breakMin, works: true, paidCustom: false }
      : { status: 'off', assumed: true, works: false };
  }
  if (a.status === 'worked') {
    const s = a.start || p?.start, e = a.start ? a.end : p?.end;
    if (!s || !e) return { status: 'worked', assumed: false, works: false };
    return { status: 'worked', assumed: false, startDt: `${d}T${s}`, endDt: `${endDateFor(d, s, e)}T${e}`, breakMin: p ? p.breakMin : 0, works: true, edited: !!a.start };
  }
  if (a.status === 'custom') {
    const works = !!(a.start && a.end);
    return { status: 'custom', assumed: false, label: a.label || 'Custom', paidCustom: !!a.paid, works,
      startDt: works ? `${d}T${a.start}` : null, endDt: works ? `${endDateFor(d, a.start!, a.end!)}T${a.end}` : null, breakMin: 0 };
  }
  return { status: a.status, assumed: false, works: false };
}

// Change (or clear, with null) one part of one date's change. The pattern itself is never touched.
export function setOverride(data: MyDayData, d: DateKey, part: 'planned' | 'actual', value: DateOverride['planned'] | DateOverride['actual'] | null) {
  const o: DateOverride = { ...(data.rota.overrides[d] || {}) };
  if (value) (o as Record<string, unknown>)[part] = value; else delete o[part];
  if (o.planned || o.actual) data.rota.overrides[d] = o; else delete data.rota.overrides[d];
}

// Real elapsed time between two local wall-clock times (so DST nights are 11 or 13 hours).
export function dtToDate(dt: DateTime): Date { return new Date(+dt.slice(0, 4), +dt.slice(5, 7) - 1, +dt.slice(8, 10), +dt.slice(11, 13), +dt.slice(14, 16)); }
export const msBetween = (a: DateTime, b: DateTime) => dtToDate(b).getTime() - dtToDate(a).getTime();
export const overlapMs = (a1: number, a2: number, b1: number, b2: number) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));

export const entriesOn = (data: MyDayData, d: DateKey) => data.rota.entries.filter(e => e.start.slice(0, 10) === d);
export const entriesTouching = (data: MyDayData, d: DateKey) =>
  data.rota.entries.filter(e => e.start.slice(0, 10) <= d && e.end.slice(0, 10) >= d && e.end > d + 'T00:00');

// Unauthorised absence that overlaps the shift starting on date d (ms), and whether it covers it all.
export function absenceOn(data: MyDayData, d: DateKey) {
  const a = actualFor(data, d);
  if (!a.works) return { ms: 0, whole: false, any: entriesOn(data, d).some(e => e.kind === 'unauthorised') };
  const s = +dtToDate(a.startDt!), e = +dtToDate(a.endDt!);
  let ms = 0;
  for (const x of data.rota.entries) if (x.kind === 'unauthorised') ms += overlapMs(s, e, +dtToDate(x.start), +dtToDate(x.end));
  ms = Math.min(ms, e - s);
  return { ms, whole: ms > 0 && ms >= e - s, any: ms > 0 };
}

// The status shown in the calendar for a date: its colour key and its text label (never colour alone).
export function displayStatus(data: MyDayData, d: DateKey) {
  const p = plannedFor(data, d), a = actualFor(data, d), ua = absenceOn(data, d);
  if (ua.whole) return { key: 'unauthorised', label: STATUS_LABEL.unauthorised, short: SHORT_LABEL.unauthorised, p, a };
  if (!a.assumed && a.status !== 'worked') {
    if (a.status === 'custom') return { key: 'custom', label: a.label!, short: a.label!, p, a };
    return { key: a.status, label: STATUS_LABEL[a.status], short: SHORT_LABEL[a.status], p, a };
  }
  if (!p) return { key: null, label: '', short: '', p, a };
  if (p.type === 'custom') return { key: 'custom', label: p.label!, short: p.label!, p, a };
  return { key: p.type, label: STATUS_LABEL[p.type], short: SHORT_LABEL[p.type], p, a };
}

// Readable text on any background colour: black or white, whichever contrasts more.
function lum(hex: string) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export const textOn = (hex: string) => (1.05 / (lum(hex) + 0.05) >= (lum(hex) + 0.05) / 0.05 ? '#ffffff' : '#000000');

// Work time from the rota for Today's planning: actual shifts (or planned, if not yet recorded) and overtime.
export function rotaWorkBlocks(data: MyDayData, k: DateKey) {
  const out: { kind: 'work'; rota: true; title: string; start: DateTime; end: DateTime }[] = [];
  for (const d of [shift(k, -1), k, shift(k, 1)]) {
    const a = actualFor(data, d);
    if (!a.works || (a.status === 'custom' && !a.paidCustom && !a.startDt)) continue;
    const p = plannedFor(data, d);
    const title = a.status === 'custom' ? a.label! : p && p.type === 'night' ? 'Night shift' : p && p.type === 'day' ? 'Day shift' : 'Shift';
    out.push({ kind: 'work', rota: true, title, start: a.startDt!, end: a.endDt! });
  }
  for (const e of data.rota.entries) {
    if (e.kind !== 'overtime') continue;
    if (e.end.slice(0, 10) < shift(k, -1) || e.start.slice(0, 10) > shift(k, 1)) continue;
    out.push({ kind: 'work', rota: true, title: 'Overtime', start: e.start, end: e.end });
  }
  return out;
}

// Everything with a time on a date (shifts, overtime, commitments), for overlap checks.
function timedItemsOn(data: MyDayData, d: DateKey) {
  const items: { label: string; s: number; e: number; kind: string; startDt: DateTime; endDt: DateTime }[] = [];
  const dayStart = +dtToDate(d + 'T00:00'), dayEnd = +dtToDate(shift(d, 1) + 'T00:00');
  const add = (label: string, s: DateTime, e: DateTime, kind: string) => {
    const a = +dtToDate(s), b = +dtToDate(e);
    if (overlapMs(a, b, dayStart, dayEnd) > 0) items.push({ label, s: a, e: b, kind, startDt: s, endDt: e });
  };
  for (const x of [shift(d, -1), d]) {
    const a = actualFor(data, x), p = plannedFor(data, x);
    if (a.works) add(a.status === 'custom' ? a.label! : `${p && p.type === 'night' ? 'Night' : p && p.type === 'day' ? 'Day' : 'Planned'} shift`, a.startDt!, a.endDt!, 'shift');
  }
  for (const e of data.rota.entries) if (e.kind === 'overtime') add('Overtime', e.start, e.end, 'overtime');
  for (const c of data.commitments) add(c.title, c.start, c.end, c.kind);
  return items;
}
// "Day shift (07:00–19:00) overlaps Dentist (10:00–11:00)" for every pair that overlaps on date d.
export function overlapsOn(data: MyDayData, d: DateKey): string[] {
  const items = timedItemsOn(data, d), out: string[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const A = items[i], B = items[j];
      if (A.s < B.e && B.s < A.e) out.push(`${A.label} (${fmtShiftRange(A.startDt, A.endDt, d)}) overlaps ${B.label} (${fmtShiftRange(B.startDt, B.endDt, d)})`);
    }
  }
  return out;
}

// Commitments (appointments, work) that touch date d.
export const appointmentsOn = (data: MyDayData, d: DateKey) =>
  data.commitments.filter(c => c.start.slice(0, 10) <= d && c.end.slice(0, 10) >= d && c.end > d + 'T00:00');

// ---------- The pattern editor ----------
export interface Segment { type: ShiftType; count: number }
// [day, day, off] → [{ day × 2 }, { off × 1 }]
export function segmentsOf(cycle: ShiftType[]): Segment[] {
  const segs: Segment[] = [];
  for (const t of cycle) {
    const last = segs[segs.length - 1];
    if (last && last.type === t) last.count++; else segs.push({ type: t, count: 1 });
  }
  return segs;
}
export const cycleOf = (segs: Segment[]) => segs.flatMap(s => Array<ShiftType>(s.count).fill(s.type));
// e.g. "4 Day · 4 Off · 4 Night · 4 Off"
export const patternSummary = (v: PatternVersion) => segmentsOf(v.cycle).map(s => `${s.count} ${STATUS_LABEL[s.type].replace(' shift', '')}`).join(' · ');

// Saves a new pattern version, replacing one with the same "from" date. Earlier versions, one-date
// changes and anything recorded stay exactly as they are.
export function savePatternVersion(data: MyDayData, version: PatternVersion) {
  data.rota.patterns = data.rota.patterns.filter(v => (v.effectiveFrom || '') !== (version.effectiveFrom || ''));
  data.rota.patterns.push(version);
  data.rota.patterns.sort((a, b) => ((a.effectiveFrom || '') < (b.effectiveFrom || '') ? -1 : 1));
}

// An overtime or absence entry, checked. Returns why it can't be saved, or null once added.
export function addEntry(data: MyDayData, kind: EntryKind, start: string, end: string, note: string): string | null {
  if (!isDateTime(start) || !isDateTime(end)) return 'Please add a start and an end, each with a date and time.';
  if (end <= start) return 'The end needs to be after the start. For overnight, set the end to the next day.';
  if (msBetween(start, end) > 24 * 3600000) return "That's longer than 24 hours — please check the dates.";
  const e: RotaEntry = { id: 'e' + uid(), kind, start, end, note: note.slice(0, 80) };
  data.rota.entries.push(e);
  data.rota.entries.sort((a, b) => (a.start < b.start ? -1 : 1));
  return null;
}
