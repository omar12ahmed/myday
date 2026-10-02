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

// e.g. "Friday 2 October"
export function prettyDate(k: DateKey): string {
  return parseKey(k).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}
