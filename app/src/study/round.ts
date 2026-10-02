// A revision round, kept in memory only (as in the current MyDay): one question at a time, and an answer
// is only saved when you choose Again / Hard / Good. It lives outside the Study screen so Today's Study
// card can start a round too.
import { useSyncExternalStore } from 'react';
import { todayKey } from '../data/dates';
import { ROUND_SIZE } from '../data/study/common';
import { dueConcepts } from '../data/study/revision';
import type { DateKey, Outcome, Rating, StudyData, Support } from '../data/types';

export interface Question { phase: 'ask' | 'shown'; typed: string; chosen: number | null; hint: boolean; support: Support; outcome: Outcome | null }
export interface Round extends Question { day: DateKey; ids: string[]; i: number; results: { id: string; outcome: Outcome | null; support: Support; rating: Rating }[] }

const freshQuestion = (): Question => ({ phase: 'ask', typed: '', chosen: null, hint: false, support: 'own', outcome: null });
let round: Round | null = null;
const listeners = new Set<() => void>();
const set = (r: Round | null) => { round = r; listeners.forEach(fn => fn()); };
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const useRound = () => useSyncExternalStore(subscribe, () => round);

// A new round: up to ROUND_SIZE of the concepts ready to revise (oldest due first).
export function startRound(st: StudyData) {
  const k = todayKey(), ids = dueConcepts(st, k).slice(0, ROUND_SIZE).map(c => c.id);
  set(ids.length ? { day: k, ids, i: 0, results: [], ...freshQuestion() } : null);
}
export const clearRound = () => set(null);
// Change the current question (e.g. reveal the answer, choose a support level).
export function changeRound(fn: (r: Round) => void) {
  if (!round) return;
  const next = { ...round, results: round.results.slice() };
  fn(next);
  set(next);
}
// After a rating is saved: note the result and move on from question `at` (the one just answered).
export function nextQuestion(result: Round['results'][number], at: number) {
  changeRound(r => { r.results.push(result); r.i = at + 1; Object.assign(r, freshQuestion()); });
}
// Typing an answer is kept in memory only, without redrawing the screen.
export function setTyped(text: string) { if (round) round.typed = text.slice(0, 2000); }
