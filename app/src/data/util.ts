// Small helpers used across the data files (kept here so those files don't depend on each other).
type Raw = Record<string, unknown>;
export const isObj = (o: unknown): o is Raw => !!o && typeof o === 'object' && !Array.isArray(o);
export const listOf = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Half a character: when text is cut to a length right in the middle of an emoji (or another character stored as two
// halves), half of it is left. It shows as nothing useful, and your account's database refuses any record holding one
// (one such record would stop the device syncing). mendHalves takes them out of every text in a value, in place, and
// says how many texts it mended; whole emoji and every other character are left exactly as they are.
function mendText(s: string): string {
  if (!/[\uD800-\uDFFF]/.test(s)) return s;
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF) { const n = s.charCodeAt(i + 1); if (n >= 0xDC00 && n <= 0xDFFF) { out += s[i] + s[i + 1]; i++; } continue; }
    if (c >= 0xDC00 && c <= 0xDFFF) continue;
    out += s[i];
  }
  return out;
}
export function mendHalves(v: unknown): number {
  let mended = 0;
  const walk = (x: unknown) => {
    if (!x || typeof x !== 'object') return;
    const o = x as Record<string, unknown>;
    for (const k of Object.keys(o)) {
      const y = o[k];
      if (typeof y === 'string') { const m = mendText(y); if (m !== y) { o[k] = m; mended++; } }
      else if (y && typeof y === 'object') walk(y);
    }
  };
  walk(v);
  return mended;
}

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

// A number (decimals allowed) from lo to hi, or the fallback.
export function numIn<F extends number | null>(v: unknown, lo: number, hi: number, fallback: F): number | F {
  if (v === null || v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : fallback;
}
