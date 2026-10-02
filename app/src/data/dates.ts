// Local calendar dates and times, ported from the current MyDay (same names, same behaviour).
// Dates are "YYYY-MM-DD" and date-times are "YYYY-MM-DDTHH:MM", both in the device's local time.
// Times are handled as minutes from the start of a given calendar day (wall-clock), so a shift
// from 22:00 to 06:00 the next day is simply 1320 → 1800.
import type { DateKey, DateTime } from './types';

export const pad = (n: number) => String(n).padStart(2, '0');

export function keyOf(d: Date): DateKey {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function todayKey(): DateKey {
  return keyOf(new Date());
}

// Noon avoids daylight-saving edge cases where local midnight doesn't exist.
export function parseKey(k: DateKey): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

// The date n days after k (n may be negative).
export function shift(k: DateKey, n: number): DateKey {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
}

export function isDateKey(s: unknown): s is DateKey {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && keyOf(parseKey(s)) === s;
}

export function isTime(s: unknown): s is string {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

export function isDateTime(s: unknown): s is DateTime {
  return typeof s === 'string' && s.length === 16 && s[10] === 'T' && isDateKey(s.slice(0, 10)) && isTime(s.slice(11));
}

// Now (or d) as "YYYY-MM-DDTHH:MM".
export function localStamp(d = new Date()): DateTime {
  return keyOf(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// e.g. "Friday 2 October"
export function prettyDate(k: DateKey): string {
  return parseKey(k).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

// e.g. "Fri 2 Oct"
export function shortDate(k: DateKey): string {
  return parseKey(k).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

// "HH:MM" → minutes after midnight, e.g. "09:30" → 570.
export const timeToMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

// Minutes → "HH:MM" on a 24-hour clock (1500 → "01:00").
export const minToTime = (m: number) => {
  const r = ((m % 1440) + 1440) % 1440;
  return pad(Math.floor(r / 60)) + ':' + pad(r % 60);
};

// Whole days from date b to date a, e.g. dayDiff("2026-10-03", "2026-10-02") → 1.
export const dayDiff = (a: DateKey, b: DateKey) => Math.round((parseKey(a).getTime() - parseKey(b).getTime()) / 86400000);

// A date-time as minutes after midnight on day k (more than 1440 if it's on a later day).
export const dtToMin = (dt: DateTime, k: DateKey) => dayDiff(dt.slice(0, 10), k) * 1440 + timeToMin(dt.slice(11));

// Minutes after midnight on day k → a date-time.
export const minToDt = (m: number, k: DateKey): DateTime => shift(k, Math.floor(m / 1440)) + 'T' + minToTime(m);

// The time now, as minutes after midnight on day k.
export function nowMin(k: DateKey): number {
  const d = new Date();
  return dayDiff(keyOf(d), k) * 1440 + d.getHours() * 60 + d.getMinutes();
}

// e.g. 90 → "1 h 30 min"
export function fmtDuration(m: number): string {
  const h = Math.floor(m / 60), r = m % 60;
  return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`;
}

// "" for day k itself, otherwise "yesterday", "tomorrow" or a short date.
export function relDay(dateKey: DateKey, k: DateKey): string {
  const n = dayDiff(dateKey, k);
  if (n === 0) return '';
  if (n === -1) return 'yesterday';
  if (n === 1) return 'tomorrow';
  return shortDate(dateKey);
}

export function fmtDT(dt: DateTime, k: DateKey): string {
  const r = relDay(dt.slice(0, 10), k);
  return r ? `${r} ${dt.slice(11)}` : dt.slice(11);
}

// A start–end range as seen from day k, e.g. "09:00–17:00" or "22:00 – tomorrow 06:00".
export function fmtRange(s: DateTime, e: DateTime, k: DateKey): string {
  if (s.slice(0, 10) === e.slice(0, 10)) {
    const r = relDay(s.slice(0, 10), k);
    return (r ? r + ' ' : '') + s.slice(11) + '–' + e.slice(11);
  }
  return fmtDT(s, k) + ' – ' + fmtDT(e, k);
}

export const rangeMin = (s: number, e: number) => minToTime(s) + '–' + minToTime(e);
