// One revision queue for everything you've chosen to revise: your Study concepts (once they have a question), the
// Arabic cards and the Cybersecurity checks you've added. What's due comes first, oldest first, then concepts never
// revised. Missed days don't pile up: a round takes a few at a time. Scope 'arabic' or 'cybersecurity' is just that
// course's cards ("Revise Arabic", "Revise Cybersecurity"); Cybersecurity's include the AI-written cards you kept for
// its lessons (concepts with an origin), Arabic's the words you kept (arabic/words.ts) and the lessons to practise
// again (arabic/practice.ts).
import { practiceCards, practiceRef } from '../arabic/practice';
import { keptCards } from '../arabic/words';
import type { Concept, DateKey, MyDayData } from '../types';
import { questionReady } from './revision';

export type Scope = 'all' | 'arabic' | 'cybersecurity';
type Scheduled = { id: string; review: { due: DateKey | null } };

function scheduled(d: MyDayData, scope: Scope): Scheduled[] {
  if (scope === 'arabic') return [...d.arabic.cards, ...keptCards(d), ...practiceCards(d)];
  if (scope === 'cybersecurity') return [...d.cybersecurity.cards, ...aiCyberCards(d)];
  return [...d.study.concepts.filter(questionReady), ...d.arabic.cards, ...keptCards(d), ...practiceCards(d), ...d.cybersecurity.cards];
}
export const aiCyberCards = (d: MyDayData): Concept[] => d.study.concepts.filter(c => c.origin?.subject === 'cybersecurity' && questionReady(c));
export function dueIds(d: MyDayData, k: DateKey, scope: Scope = 'all'): string[] {
  const all = scheduled(d, scope);
  const due = all.filter(x => x.review.due && x.review.due <= k).sort((a, b) => (a.review.due! < b.review.due! ? -1 : a.review.due! > b.review.due! ? 1 : 0));
  return due.concat(all.filter(x => !x.review.due)).map(x => x.id);
}
// A round: the first `n` ready, with at most one lesson to practise again (it takes longer than a question); the
// others wait for a later round.
export function roundIds(d: MyDayData, k: DateKey, scope: Scope, n: number): string[] {
  const out: string[] = [];
  let practice = false;
  for (const id of dueIds(d, k, scope)) {
    if (out.length >= n) break;
    if (practiceRef(id)) { if (practice) continue; practice = true; }
    out.push(id);
  }
  return out;
}
export const nextDueDate = (d: MyDayData, k: DateKey, scope: Scope = 'all') =>
  scheduled(d, scope).map(x => x.review.due).filter((x): x is DateKey => !!x && x > k).sort()[0] || null;
