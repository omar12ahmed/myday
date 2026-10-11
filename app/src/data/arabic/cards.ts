// Arabic in revision: the starter words and lesson checks you choose to bring back. Only ids and schedules are saved
// (see types.ts); what a card shows comes from the course. Nothing is added without a tap, and anything you add
// first comes back tomorrow, because you've just seen it. Answers are rated with Study's revision rules.
import { shift } from '../dates';
import { rateItem, type Answered } from '../study/revision';
import type { DateKey, MyDayData, Rating } from '../types';
import type { ArabicCard, CardSide } from './types';

export const wordCard = (lexemeId: string, side: CardSide) => `${lexemeId}:${side}`;

// What a card is: a starter word one way round, or a check question. A check's id names its lesson:
// "assessment.arabic-fusha-register-check.q1" belongs to "lesson.arabic-fusha-register" (arabic-rules checks
// this for every question in the course).
export type CardRef = { kind: 'word'; lexemeId: string; side: CardSide } | { kind: 'check'; questionId: string; lessonId: string };
export function cardRef(id: string): CardRef {
  const m = /^(lexeme\..+):(recognise|write)$/.exec(id);
  if (m) return { kind: 'word', lexemeId: m[1], side: m[2] as CardSide };
  return { kind: 'check', questionId: id, lessonId: 'lesson.' + id.replace(/^assessment\./, '').replace(/-check\.q\d+$/, '') };
}
export const cardOf = (d: MyDayData, id: string): ArabicCard | null => d.arabic.cards.find(c => c.id === id) ?? null;

// Adds the cards you chose (any already in revision stay exactly as they are). Returns how many were added.
export function addCards(d: MyDayData, ids: string[], k: DateKey): number {
  let added = 0;
  for (const id of ids) {
    if (cardOf(d, id)) continue;
    d.arabic.cards.push({ id, addedOn: k, review: { reps: 0, interval: 0, lapses: 0, due: shift(k, 1) } });
    added++;
  }
  return added;
}
// Takes cards out of revision. Their past answers stay in your Study history; added again, they start afresh.
export function removeCards(d: MyDayData, ids: string[]): boolean {
  const before = d.arabic.cards.length;
  d.arabic.cards = d.arabic.cards.filter(c => !ids.includes(c.id));
  return d.arabic.cards.length < before;
}

// Starter words added on a day (either way round counts once), for the gentle note after NEW_WORDS_A_DAY.
export function wordsAddedOn(d: MyDayData, k: DateKey): number {
  const words = new Set<string>();
  for (const c of d.arabic.cards) {
    const r = cardRef(c.id);
    if (c.addedOn === k && r.kind === 'word') words.add(r.lexemeId);
  }
  return words.size;
}
export const wordInRevision = (d: MyDayData, lexemeId: string) => !!cardOf(d, wordCard(lexemeId, 'recognise')) || !!cardOf(d, wordCard(lexemeId, 'write'));
// The next starter words to add, in the course's order: ones that aren't in revision yet.
export const nextWords = (d: MyDayData, lexemeIds: string[], n: number) => lexemeIds.filter(id => !wordInRevision(d, id)).slice(0, n);

// Records an answer to an Arabic card: rescheduled like a concept, the answer kept in Study's revision history.
export function rateCard(d: MyDayData, id: string, title: string, k: DateKey, a: Answered, rating: Rating): boolean {
  const c = cardOf(d, id);
  if (!c) return false;
  rateItem(d.study, c, { title, kind: 'written' }, k, a, rating);
  return true;
}
