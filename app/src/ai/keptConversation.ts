import { ASK_LIMITS, checkAskContext, type AskLookup } from '../../../supabase/functions/_shared/ai/ask-shape.ts';
import { todayKey } from '../data/dates';
import type { DateKey, MyDayData } from '../data/types';
import { KEPT_CONVERSATION_KEY as KEY } from './lastAskKey';
import type { LookupMore } from './lookup';
import { aiReach } from './reach';

// Today's Ask MyDay conversation, kept so it can be carried on from + after its panel has closed (the owner's choices
// of 31 Oct 2026, specs/ask-keep-conversation.md): on any page, until midnight or a new question (one per device). Each
// exchange as the panel showed it (your message; the answer as shown, after its note of what you did) and the lookup
// behind the last answer — only what was already sent or shown. Remembered on this device only, like the 1.95.0 Undo:
// not part of your data, not synced, exported or backed up; Delete everything, signing out and another account's data
// being cleared forget it. A kept answer may name something you've since made private, so if anything has been made
// private since (or AI help with notes switched off), it's forgotten rather than offered (`held`).
export type KeptTurn = { asked: string; answered: string };
export type KeptLooked = { lookup: AskLookup; leftOut: number; hrefs?: Record<string, string>; more?: LookupMore; at?: string };
export type KeptConversation = { id: string; on: DateKey; at: string; turns: KeptTurn[]; looked?: KeptLooked; held: string[] };

const listeners = new Set<() => void>();
// Told when a conversation is kept or forgotten (so the line in + stops offering an old one).
export function onKeptConversation(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }
const told = () => { for (const fn of listeners) fn(); };

// What the AI may not see right now: anything private (or in a private project), and notes' text when AI help with
// notes is off — the same filter every request goes through (reach.ts). Any of it that's new since a conversation was kept
// forgets that conversation, even if no answer named it (the safe side).
function heldNow(data: MyDayData): string[] {
  const reach = aiReach(data);
  return [...data.projects.items.filter(p => !reach.project(p)).map(p => `p:${p.id}`), ...data.notes.items.filter(n => !reach.note(n)).map(n => `n:${n.id}`),
    ...data.tasks.items.filter(t => !reach.task(t)).map(t => `t:${t.id}`), ...data.commitments.filter(c => !reach.appointment(c)).map(c => `c:${c.id}`),
    ...(data.patterns.prefs.aiNotes ? [] : ['notes-off'])];
}

export function keepConversation(data: MyDayData, x: { id: string; at: string; turns: KeptTurn[]; looked?: KeptLooked }) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...x, on: todayKey(), held: heldNow(data) })); }
  catch { try { localStorage.removeItem(KEY); } catch { /* storage unavailable: nothing kept */ } } // never an older one offered instead
  told();
}
// Forgets the one with this id (another tab may have kept a newer one since); with no id, whatever is kept.
export function forgetConversation(id?: string) {
  try {
    const kept = id ? (JSON.parse(localStorage.getItem(KEY) ?? 'null') as { id?: unknown } | null)?.id : undefined;
    if (!id || kept === id) localStorage.removeItem(KEY);
  } catch { /* nothing to forget */ }
  told();
}

const str = (v: unknown, max: number, empty = false): v is string => typeof v === 'string' && v.length <= max && (empty || v.trim().length > 0);
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const MORE_KEYS = ['tasks', 'done', 'due', 'busy', 'milestones', 'notes', 'textNotes', 'titlesOnly', 'noCourses'];
// The lookup as the server would take it (its own check, on a request around it), so a damaged copy is never sent.
const lookupOk = (lookup: unknown) => checkAskContext({ version: 1, action: 'ask', date: '2026-01-01', weekday: 'Thursday', time: '00:00', page: 'other', text: 'x', context: {}, lookup });

// Today's kept conversation, if there is one to offer: fully shape-checked (a damaged or older copy is forgotten, never
// shown), from today, with nothing made private since. Never throws.
export function keptConversation(data: MyDayData, today: DateKey = todayKey()): KeptConversation | null {
  let x: unknown;
  try { x = JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { x = 'damaged'; }
  if (x === null) return null;
  const forget = () => { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } return null; };
  if (!obj(x) || !str(x.id, 40) || x.on !== today || typeof x.at !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.at)) return forget();
  if (!Array.isArray(x.turns) || !x.turns.length || x.turns.length > 100 || !x.turns.every(t => obj(t) && str(t.asked, ASK_LIMITS.textChars) && str(t.answered, 4000, true))) return forget();
  if (!Array.isArray(x.held) || !x.held.every(h => typeof h === 'string')) return forget();
  const l = x.looked;
  if (l !== undefined && !(obj(l) && lookupOk(l.lookup) && Number.isInteger(l.leftOut) && (l.leftOut as number) >= 0
    && (l.hrefs === undefined || (obj(l.hrefs) && Object.values(l.hrefs).every(h => typeof h === 'string' && h.startsWith('#'))))
    && (l.more === undefined || (obj(l.more) && Object.entries(l.more).every(([k, v]) => MORE_KEYS.includes(k) && (typeof v === 'boolean' || (Number.isInteger(v) && (v as number) >= 0)))))
    && (l.at === undefined || (typeof l.at === 'string' && !Number.isNaN(Date.parse(l.at)))))) return forget();
  // Made private since (or AI help with notes switched off): forgotten, as an answer may name it.
  const was = new Set(x.held as string[]);
  if (heldNow(data).some(h => !was.has(h))) return forget();
  return x as KeptConversation;
}
