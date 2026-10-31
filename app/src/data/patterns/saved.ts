// What MyDay has noticed — the saved part: your preferences, and your answers to the patterns it found. Saved as the
// top-level `patterns` section (added by the new app in 1.6.0; the classic MyDay keeps it unread). Synced with your
// account when you're signed in (record `patterns`), and in "Export my data".
//
// The patterns themselves aren't saved. They're worked out afresh from your history each time (see notice.ts), so
// they follow what you actually do — and nothing is kept about you except what's already in your plans.
//
// Your preferences always come first: MyDay uses a pattern only once you've said it's right and asked it to (it then
// becomes a preference, with the evidence it was based on kept as its "Why?").
import { isDateKey, shift, todayKey } from '../dates';
import type { AskSeen, Category, PatternsData, Pref } from '../types';
import { intIn, isObj } from '../util';

export const CATEGORIES: Category[] = ['learning', 'admin', 'health'];
export const MINUTE_CHOICES = [15, 20, 25, 30, 45, 60];
export const YOUR_CHOICE = 'You chose this in What MyDay has noticed.';
export const NAME_MAX = 40;

export const emptyPatterns = (): PatternsData => ({ prefs: { maxMinutes: { learning: null, admin: null, health: null }, maxTasks: null }, answers: {} });

// A preference that can't be read is counted (never dropped silently); unknown fields are kept.
function readPref(raw: unknown, lo: number, hi: number, report: { dropped: number }): Pref | null {
  if (raw === null || raw === undefined) return null;
  const value = isObj(raw) ? intIn(raw.value, lo, hi, null) : null;
  if (!isObj(raw) || value === null) { report.dropped++; return null; }
  return { ...raw, value, on: isDateKey(raw.on) ? raw.on : todayKey(), from: typeof raw.from === 'string' ? raw.from : null, why: typeof raw.why === 'string' ? raw.why.slice(0, 500) : '' };
}

export function normalizePatterns(raw: unknown, report: { dropped: number }): PatternsData {
  if (!isObj(raw)) return emptyPatterns();
  const prefs = isObj(raw.prefs) ? raw.prefs : {};
  const mm = isObj(prefs.maxMinutes) ? prefs.maxMinutes : {};
  const answers: PatternsData['answers'] = {};
  if (isObj(raw.answers)) {
    for (const [id, a] of Object.entries(raw.answers)) {
      if (!isObj(a) || (a.said !== 'yes' && a.said !== 'no') || !isDateKey(a.on)) { report.dropped++; continue; }
      answers[id] = { ...a, said: a.said, on: a.on, examples: intIn(a.examples, 0, 100000, 0), title: typeof a.title === 'string' ? a.title.slice(0, 200) : '' };
    }
  }
  const out: PatternsData = {
    ...raw,
    prefs: {
      ...prefs,
      maxMinutes: { ...mm, learning: readPref(mm.learning, 5, 600, report), admin: readPref(mm.admin, 5, 600, report), health: readPref(mm.health, 5, 600, report) },
      maxTasks: readPref(prefs.maxTasks, 1, 3, report),
    },
    answers,
  };
  // What MyDay calls you (the greeting on Today): optional, up to 40 characters.
  const name = typeof prefs.name === 'string' ? prefs.name.trim().slice(0, NAME_MAX) : '';
  if (name) out.prefs.name = name; else delete out.prefs.name;
  if (prefs.aiNotes === true) out.prefs.aiNotes = true; else delete out.prefs.aiNotes; // AI help with notes (1.15.0)
  if (prefs.askUse === true) out.prefs.askUse = true; else delete out.prefs.askUse; // Ask MyDay uses how you work (1.108.0)
  if (isDateKey(prefs.askAsked)) out.prefs.askAsked = prefs.askAsked; else delete out.prefs.askAsked; // …and when MyDay asked you, once
  // What you did with Ask MyDay's suggestions (1.108.0): kept only when there are some, so a device that never counted
  // saves exactly as before; one that can't be read is counted, never dropped silently.
  if (Array.isArray(raw.askSeen)) {
    const seen: AskSeen[] = [];
    for (const x of raw.askSeen) {
      const n = (v: unknown) => (v === null ? null : intIn(v, 0, 600, null));
      if (!isObj(x) || !isDateKey(x.on) || typeof x.type !== 'string' || !x.type || x.type.length > 20 || !(x.category === null || CATEGORIES.includes(x.category as Category))
        || (x.proposed !== null && n(x.proposed) === null) || (x.minutes !== null && n(x.minutes) === null) || typeof x.added !== 'boolean' || typeof x.renamed !== 'boolean') { report.dropped++; continue; }
      seen.push({ ...x, on: x.on, type: x.type, category: x.category as Category | null, proposed: n(x.proposed), minutes: n(x.minutes), added: x.added, renamed: x.renamed });
    }
    if (seen.length) out.askSeen = seen.slice(-ASK_SEEN_MAX); else delete out.askSeen;
  } else delete out.askSeen;
  // The weekly review (1.37.0): kept only when valid, so a device that never reviewed saves exactly as before.
  if (Number.isInteger(prefs.reviewDay) && (prefs.reviewDay as number) >= 1 && (prefs.reviewDay as number) <= 6) out.prefs.reviewDay = prefs.reviewDay as number; else delete out.prefs.reviewDay;
  for (const key of ['reviewed', 'reviewHidden'] as const) { if (isDateKey(prefs[key])) out.prefs[key] = prefs[key] as string; else delete out.prefs[key]; }
  return out;
}

// ---------- Changes (each used inside update()) ----------
const pref = (value: number, from: string | null, why: string): Pref => ({ value, on: todayKey(), from, why: why.slice(0, 500) });

export function setMaxMinutes(d: PatternsData, cat: Category, value: number | null, from: string | null = null, why = YOUR_CHOICE): boolean {
  const before = d.prefs.maxMinutes[cat];
  if ((before?.value ?? null) === value) return false;
  d.prefs.maxMinutes[cat] = value === null ? null : pref(value, from, why);
  return true;
}
export function setMaxTasks(d: PatternsData, value: number | null, from: string | null = null, why = YOUR_CHOICE): boolean {
  if ((d.prefs.maxTasks?.value ?? null) === value) return false;
  d.prefs.maxTasks = value === null ? null : pref(value, from, why);
  return true;
}
// What MyDay calls you ("Good morning, Sam!"). Empty removes it.
// Let Ask MyDay use how you work (or stop it). Switching it off also forgets what it counted of Ask's suggestions.
// MyDay asks once, the first time you say a pattern is right (the owner's choice: no setting to find); either answer is
// remembered, so it never asks again, and the switch stays in What MyDay has noticed.
export function answerAskOffer(d: PatternsData, yes: boolean, today = todayKey()): boolean {
  d.prefs.askAsked = today;
  if (yes) d.prefs.askUse = true;
  return true;
}
export function setAskUse(d: PatternsData, on: boolean): boolean {
  if (!!d.prefs.askUse === on) return false;
  if (on) d.prefs.askUse = true; else { delete d.prefs.askUse; delete d.askSeen; }
  return true;
}
// What you did with Ask MyDay's suggestions this time (only while it's on): newest last, the last 8 weeks, at most 200.
export const ASK_SEEN_MAX = 200;
export function recordAskSeen(d: PatternsData, xs: Omit<AskSeen, 'on'>[], today = todayKey()): boolean {
  if (!d.prefs.askUse || !xs.length) return false;
  const from = shift(today, -56);
  d.askSeen = [...(d.askSeen ?? []).filter(x => x.on >= from), ...xs.map((x): AskSeen => ({ ...x, on: today } as AskSeen))].slice(-ASK_SEEN_MAX);
  return true;
}
// Let AI help place notes in projects (or stop it). Returns false when nothing changed.
export function setAiNotes(d: PatternsData, on: boolean): boolean {
  if (!!d.prefs.aiNotes === on) return false;
  if (on) d.prefs.aiNotes = true; else delete d.prefs.aiNotes;
  return true;
}
export function setName(d: PatternsData, name: string): boolean {
  const clean = name.trim().slice(0, NAME_MAX);
  if ((d.prefs.name ?? '') === clean) return false;
  if (clean) d.prefs.name = clean; else delete d.prefs.name;
  return true;
}
// "That's right" / "Not really": kept with how many examples it was based on, so a pattern you said no to only comes
// back if there's clearly more evidence since.
export function answerPattern(d: PatternsData, id: string, said: 'yes' | 'no', examples: number, title: string): boolean {
  d.answers[id] = { said, on: todayKey(), examples, title: title.slice(0, 200) };
  return true;
}
export function forgetAnswer(d: PatternsData, id: string): boolean {
  if (!d.answers[id]) return false;
  delete d.answers[id];
  return true;
}
