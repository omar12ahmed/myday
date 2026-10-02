// Small helpers used across the data files (kept here so those files don't depend on each other).
type Raw = Record<string, unknown>;
export const isObj = (o: unknown): o is Raw => !!o && typeof o === 'object' && !Array.isArray(o);
export const listOf = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// A whole number of minutes from 1 to 600, or the fallback (which may be null, meaning "not valid").
export function cleanMinutes<F extends number | null>(v: unknown, fallback: F): number | F {
  const m = Math.round(Number(v));
  return m > 0 && m <= 600 ? m : fallback;
}

// A whole number from lo to hi, or the fallback (which may be null, meaning "not valid").
export function intIn<F extends number | null>(v: unknown, lo: number, hi: number, fallback: F): number | F {
  if (v === null || v === undefined || v === '') return fallback;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= lo && n <= hi ? n : fallback;
}
