// The Cybersecurity portfolio (specs/study-home-and-lessons.md §10): entries made from notebook attempts you handed in,
// each with a title, the attempt's evidence as you chose to keep it, an optional note, the day you reviewed it and up
// to 5 files (the shared file records, area 'portfolio'). Nothing is added without the privacy check ticked, and text
// that looks like a secret is refused until you change it. Never sent to AI. Functions that change data take a draft
// (see storage.ts update()).
import { uid } from '../util';
import type { DateKey, MyDayData } from '../types';
import type { PortfolioEntry } from './types';

export const TITLE_MAX = 120, EVIDENCE_MAX = 12000, NOTE_MAX = 1000;
// The privacy check: all three ticked before anything is added (images can't be checked automatically).
export const PRIVACY_CHECKS = [
  'No passwords, tokens or keys',
  'No real IP addresses, hostnames or company names outside my own lab or the course’s practice targets',
  'No one’s personal details',
] as const;

// ---------- Obvious secrets in text ----------
// What looks like a secret, by kind: private-key headers, a password or key written out, common token and key formats,
// and credentials in a web address. These are refused until changed. A value that's plainly redacted ("<redacted>",
// "****", "xxx", "[REDACTED]", "…") or an ordinary word ("Password: not stored", "token: expired") isn't a find.
const REDACTED = /^(<[^>]*>|\*{3,}|x{3,}|\[?redacted\]?|\.{3}|…|changeme|example|placeholder|none|null|nil|empty|not|no|n\/a|unset|expired|required|hidden|changed|removed|true|false|set|policy)$/i;
const TOKENS: [RegExp, string][] = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
  [/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/, 'an AWS access key'],
  [/\baws_secret_access_key\b["']?\s*[:=]\s*["']?[A-Za-z0-9/+=]{40}/i, 'an AWS secret key'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{22,}/, 'a GitHub token'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, 'a Slack token'],
  [/\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, 'a sign-in token (JWT)'],
  [/\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/, 'a sign-in token (Bearer)'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'a Google API key'],
  [/\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/, 'an API key'],
  [/\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}/, 'a payment service key'],
  [/\b[a-z][a-z0-9+.-]{1,20}:\/\/[^\s/:@]+:[^\s/@]+@/i, 'a password in a web address'],
];
const ASSIGNED = /\b(?:passw(?:or)?d|pwd|passphrase|secret|token|api[_-]?key|access[_-]?key|client[_-]?secret|private[_-]?key)\b["']?\s*[:=]\s*["']?([^\s"',;]+)/gi;
export function secretsIn(text: string): string[] {
  const found = new Set<string>();
  for (const [re, what] of TOKENS) if (re.test(text)) found.add(what);
  for (const m of text.matchAll(ASSIGNED)) { const v = m[1].replace(/[.)\]}:!?]+$/, ''); if (v && !REDACTED.test(v)) { found.add('a password or key written out'); break; } }
  return [...found];
}
// A public IP address: worth a second look (the privacy check's second tick), but not refused, since a lab's notes
// can hold version numbers and public resolvers that look the same. Private, loopback, link-local, shared and
// documentation ranges, and the best-known public resolvers, aren't mentioned.
const RESOLVERS = new Set(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1', '9.9.9.9', '149.112.112.112']);
export function publicAddressIn(text: string): boolean {
  // (No lookbehind: older Safari versions lack it, so the character before is matched instead.)
  for (const m of text.matchAll(/(?:^|[^\d.])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?!\d)(?!\.\d)/g)) {
    const [a, b, c, e] = m.slice(1, 5).map(Number);
    if ([a, b, c, e].some(x => x > 255) || RESOLVERS.has(`${a}.${b}.${c}.${e}`)) continue;
    const local = a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)
      || (a === 100 && b >= 64 && b <= 127) || (a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)
      || (a === 198 && (b === 18 || b === 19)) || a >= 224;
    if (!local) return true;
  }
  return false;
}

// ---------- Entries ----------
export const entryOf = (d: MyDayData, id: string): PortfolioEntry | null => d.cybersecurity.portfolio?.find(e => e.id === id) ?? null;
export const entriesFrom = (d: MyDayData, attemptId: string) => (d.cybersecurity.portfolio ?? []).filter(e => e.attemptId === attemptId);
const clip = (s: string, max: number) => s.trim().slice(0, max);
export interface EntryText { title: string; evidence: string; note: string }
// Why this text can't go in the portfolio yet ('' when it can): a title is needed, and nothing that looks like a secret.
export function notYet(t: EntryText): string {
  if (!t.title.trim()) return 'Give it a title.';
  const s = secretsIn([t.title, t.evidence, t.note].join('\n'));
  return s.length ? `This looks like ${s.join(', ')}. Remove or redact it first.` : '';
}
// Adds an entry from a handed-in attempt, with the privacy check ticked. Returns its id, or null when it can't be added.
export function addEntry(d: MyDayData, attemptId: string, t: EntryText, checked: boolean, k: DateKey): string | null {
  const a = d.cybersecurity.attempts.find(x => x.id === attemptId);
  if (!a?.submittedAt || !checked || notYet(t)) return null;
  const e: PortfolioEntry = { id: 'pf' + uid(), attemptId, activityId: a.activityId, title: clip(t.title, TITLE_MAX), evidence: clip(t.evidence, EVIDENCE_MAX), note: clip(t.note, NOTE_MAX), reviewedOn: k };
  (d.cybersecurity.portfolio ??= []).push(e);
  return e.id;
}
// Changes an entry's title, evidence or note: checked again, and the day you reviewed it moves to today.
export function editEntry(d: MyDayData, id: string, t: EntryText, checked: boolean, k: DateKey): boolean {
  const e = entryOf(d, id);
  if (!e || !checked || notYet(t)) return false;
  const next = { title: clip(t.title, TITLE_MAX), evidence: clip(t.evidence, EVIDENCE_MAX), note: clip(t.note, NOTE_MAX) };
  if (next.title === e.title && next.evidence === e.evidence && next.note === e.note) return false;
  Object.assign(e, next, { reviewedOn: k });
  return true;
}
// Removes an entry. Its files go with data/files.ts's rules (removeEntry's caller moves them to Recently deleted).
export function removeEntry(d: MyDayData, id: string): boolean {
  const before = d.cybersecurity.portfolio?.length ?? 0;
  if (d.cybersecurity.portfolio) d.cybersecurity.portfolio = d.cybersecurity.portfolio.filter(e => e.id !== id);
  return (d.cybersecurity.portfolio?.length ?? 0) < before;
}
