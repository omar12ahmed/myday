// The Calendar's open forms: an overtime/absence entry, and the pattern editor.
import { dtToMin, minToDt, todayKey } from '../data/dates';
import { DEFAULT_CYCLE, DEFAULT_TIMES, patternFor, plannedFor, segmentsOf, type Segment } from '../data/rota';
import type { DateKey, EntryKind, MyDayData, PatternVersion } from '../data/types';
import { clone } from '../data/util';

// The overtime / absence form while it's open.
export interface EntryForm { type: EntryKind; date: DateKey; start: string; end: string; note: string; error?: string }

// Overtime starts when the shift ends; absence starts when it starts; with no shift, 09:00. Two hours long.
export function newEntryForm(data: MyDayData, d: DateKey, type: EntryKind): EntryForm {
  const p = plannedFor(data, d);
  const base = p && p.works ? (type === 'overtime' ? p.endDt! : p.startDt!) : d + 'T09:00';
  return { type, date: d, start: base, end: minToDt(dtToMin(base, d) + 120, d), note: '' };
}

// The pattern editor while it's open. `first` = setting up for the first time (no "from" date).
export interface PatternForm {
  first: boolean;
  effectiveFrom: DateKey;
  anchor: DateKey;
  segments: Segment[];
  times: PatternVersion['times'];
  breaks: PatternVersion['breaks'];
  error?: string;
}

// Starts from the pattern in force today (or the latest one), or the default 4 days, 4 off, 4 nights, 4 off.
export function newPatternForm(data: MyDayData): PatternForm {
  const cur = patternFor(data, todayKey()) || data.rota.patterns[data.rota.patterns.length - 1];
  return {
    first: !data.rota.patterns.length,
    effectiveFrom: todayKey(),
    anchor: cur ? cur.anchor : todayKey(),
    segments: segmentsOf(cur ? cur.cycle : DEFAULT_CYCLE),
    times: clone(cur ? cur.times : DEFAULT_TIMES),
    breaks: clone(cur ? cur.breaks : { day: 0, night: 0 }),
  };
}
