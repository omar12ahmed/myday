// Local calendar dates and times, ported from the current MyDay (same names, same behaviour).
// Dates are "YYYY-MM-DD" and date-times are "YYYY-MM-DDTHH:MM", both in the device's local time.
import type { DateKey } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

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

export function isDateKey(s: unknown): s is DateKey {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && keyOf(parseKey(s)) === s;
}

export function isTime(s: unknown): s is string {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

export function isDateTime(s: unknown): s is string {
  return typeof s === 'string' && s.length === 16 && s[10] === 'T' && isDateKey(s.slice(0, 10)) && isTime(s.slice(11));
}

// "HH:MM" → minutes after midnight, e.g. "09:30" → 570.
export const timeToMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

// Whole days from date b to date a, e.g. dayDiff("2026-10-03", "2026-10-02") → 1.
export const dayDiff = (a: DateKey, b: DateKey) => Math.round((parseKey(a).getTime() - parseKey(b).getTime()) / 86400000);

// A date-time as minutes after midnight on day k (more than 1440 if it's on a later day).
export const dtToMin = (dt: string, k: DateKey) => dayDiff(dt.slice(0, 10), k) * 1440 + timeToMin(dt.slice(11));

// The time now, as minutes after midnight on day k.
export function nowMin(k: DateKey): number {
  const d = new Date();
  return dayDiff(keyOf(d), k) * 1440 + d.getHours() * 60 + d.getMinutes();
}

// e.g. "Friday 2 October"
export function prettyDate(k: DateKey): string {
  return parseKey(k).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}
