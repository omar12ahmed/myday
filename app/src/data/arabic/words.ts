// Keep a word (specs/study-home-and-lessons.md §6): a word you meet in a lesson or a reading text, with your meaning,
// coming back in revision Arabic → meaning from the next day, and meaning → Arabic once you ask for it. Only what you
// keep is saved (arabic.words); nothing is added without a tap. Functions that change data take a draft (see
// storage.ts update()). Revision answers go into study.reviews like every other card's.
import { shift } from '../dates';
import { rateItem, type Answered } from '../study/revision';
import type { DateKey, MyDayData, Rating } from '../types';
import { uid } from '../util';
import type { KeptWord, Review } from './types';

export const AR_MAX = 60, MEANING_MAX = 120, NOTE_MAX = 300;
const ARABIC_LETTER = /[ء-يٱ-ۓ]/;
const fresh = (k: DateKey): Review => ({ reps: 0, interval: 0, lapses: 0, due: shift(k, 1) });

// The same word ignores only optional vowel marks (and the tatweel): ة and ه, ى and ي, and the hamza forms stay
// different words (content/arabic-fusha/MyDay_Arabic_README.md, "Arabic display and scoring").
const MARKS = /[ً-ْٰـ]/g;
export const bare = (s: string) => s.normalize('NFC').replace(MARKS, '').trim();
export const sameWord = (a: string, b: string) => !!bare(a) && bare(a) === bare(b);
export const keptWord = (d: MyDayData, ar: string): KeptWord | null => d.arabic.words?.find(w => sameWord(w.ar, ar)) ?? null;
export const keptById = (d: MyDayData, id: string): KeptWord | null => d.arabic.words?.find(w => w.id === id) ?? null;

// The words of a sentence to choose from: punctuation left out, vowel marks kept as written, each word once.
const PUNCT = /[،؛؟۔.,;:!?«»"'“”‘’()[\]{}\-–—…/\\]/g;
export function wordsIn(text: string): string[] {
  const out: string[] = [];
  for (const t of text.normalize('NFC').replace(PUNCT, ' ').split(/\s+/)) if (t && ARABIC_LETTER.test(t) && !out.includes(t)) out.push(t);
  return out;
}
// A text's sentences, for the picker: split after a full stop, question or exclamation mark, or a new line.
export const sentencesIn = (text: string) => text.split(/(?<=[.؟!۔])\s+|\n+/).map(s => s.trim()).filter(s => ARABIC_LETTER.test(s));

// Keeps a word. The same word kept already stays exactly as it is (its id comes back, added false); null when it
// can't be kept (no Arabic letter, or no meaning).
export function keepWord(d: MyDayData, input: { ar: string; meaning: string; note?: string; from?: string }, k: DateKey): { id: string; added: boolean } | null {
  const ar = input.ar.normalize('NFC').trim().slice(0, AR_MAX), meaning = input.meaning.trim().slice(0, MEANING_MAX), note = (input.note ?? '').trim().slice(0, NOTE_MAX);
  if (!ar || !ARABIC_LETTER.test(ar) || !meaning) return null;
  const same = keptWord(d, ar);
  if (same) return { id: same.id, added: false };
  const w: KeptWord = { id: 'kw' + uid(), ar, meaning, ...(note ? { note } : {}), ...(input.from ? { from: input.from } : {}), addedOn: k, recognise: fresh(k), write: null };
  (d.arabic.words ??= []).push(w);
  return { id: w.id, added: true };
}
// Your meaning and note; the meaning can't be emptied.
export function editWord(d: MyDayData, id: string, change: { meaning: string; note: string }): boolean {
  const w = keptById(d, id), meaning = change.meaning.trim().slice(0, MEANING_MAX), note = change.note.trim().slice(0, NOTE_MAX);
  if (!w || !meaning || (w.meaning === meaning && (w.note ?? '') === note)) return false;
  w.meaning = meaning;
  if (note) w.note = note; else delete w.note;
  return true;
}
// "Also practise writing it": meaning → Arabic, from the next day. Taking it out again keeps the word.
export function practiseWriting(d: MyDayData, id: string, on: boolean, k: DateKey): boolean {
  const w = keptById(d, id);
  if (!w || !!w.write === on) return false;
  w.write = on ? fresh(k) : null;
  return true;
}
// Removing a word removes it and both its schedules; its past answers stay in your Study history.
export function removeWord(d: MyDayData, id: string): boolean {
  const before = d.arabic.words?.length ?? 0;
  if (d.arabic.words) d.arabic.words = d.arabic.words.filter(w => w.id !== id);
  return (d.arabic.words?.length ?? 0) < before;
}

// ---------- In revision ----------
// Each kept word's schedules are cards in the queue, by id "<word id>:recognise" and "<word id>:write".
const KEPT_CARD = /^(kw[a-z0-9]{6,30}):(recognise|write)$/;
export const keptCardId = (id: string, side: 'recognise' | 'write') => `${id}:${side}`;
export const keptRef = (cardId: string): { wordId: string; side: 'recognise' | 'write' } | null => {
  const m = KEPT_CARD.exec(cardId);
  return m ? { wordId: m[1], side: m[2] as 'recognise' | 'write' } : null;
};
export const keptCards = (d: MyDayData): { id: string; addedOn: DateKey; review: Review }[] => (d.arabic.words ?? []).flatMap(w => [
  { id: keptCardId(w.id, 'recognise'), addedOn: w.addedOn, review: w.recognise },
  ...(w.write ? [{ id: keptCardId(w.id, 'write'), addedOn: w.addedOn, review: w.write }] : []),
]);
// Records an answer: rescheduled like any card, the answer kept in Study's revision history.
export function rateKept(d: MyDayData, cardId: string, title: string, k: DateKey, a: Answered, rating: Rating): boolean {
  const ref = keptRef(cardId), w = ref ? keptById(d, ref.wordId) : null;
  const current = w && ref ? (ref.side === 'write' ? w.write : w.recognise) : null;
  if (!w || !ref || !current) return false;
  const item = { id: cardId, review: current };
  rateItem(d.study, item, { title, kind: 'written' }, k, a, rating);
  if (ref.side === 'write') w.write = item.review; else w.recognise = item.review;
  return true;
}
