// Cybersecurity in revision: a lesson's knowledge-check questions that you choose to bring back. Only ids and
// schedules are saved (see types.ts); the question and its reference answer come from the course. Nothing is added
// without a tap, and anything you add first comes back tomorrow. Answers are rated with Study's revision rules.
import { shift } from '../dates';
import { rateItem, type Answered } from '../study/revision';
import type { DateKey, MyDayData, Rating } from '../types';
import type { CyberCard } from './types';

export const cyberCardOf = (d: MyDayData, id: string): CyberCard | null => d.cybersecurity.cards.find(c => c.id === id) ?? null;
// A question's id names its lesson: "assessment.lab-isolation-check.q2" belongs to "lesson.lab-isolation"
// (cybersecurity-rules checks this for every question in the course).
export const lessonOfCheck = (questionId: string) => 'lesson.' + questionId.replace(/^assessment\./, '').replace(/-check\.q\d+$/, '');

// Adds the questions you chose (any already in revision stay exactly as they are). Returns how many were added.
export function addCyberCards(d: MyDayData, ids: string[], k: DateKey): number {
  let added = 0;
  for (const id of ids) {
    if (cyberCardOf(d, id)) continue;
    d.cybersecurity.cards.push({ id, addedOn: k, review: { reps: 0, interval: 0, lapses: 0, due: shift(k, 1) } });
    added++;
  }
  return added;
}
// Takes questions out of revision. Their past answers stay in your Study history; added again, they start afresh.
export function removeCyberCards(d: MyDayData, ids: string[]): boolean {
  const before = d.cybersecurity.cards.length;
  d.cybersecurity.cards = d.cybersecurity.cards.filter(c => !ids.includes(c.id));
  return d.cybersecurity.cards.length < before;
}
// Records an answer: rescheduled like a concept, the answer kept in Study's revision history.
export function rateCyberCard(d: MyDayData, id: string, title: string, k: DateKey, a: Answered, rating: Rating): boolean {
  const c = cyberCardOf(d, id);
  if (!c) return false;
  rateItem(d.study, c, { title, kind: 'written' }, k, a, rating);
  return true;
}
