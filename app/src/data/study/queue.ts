// One revision queue for everything you've chosen to revise: your Study concepts (once they have a question) and
// the Arabic cards you've added. What's due comes first, oldest first, then concepts never revised. Missed days
// don't pile up: a round takes a few at a time. Scope 'arabic' is just the Arabic cards ("Revise Arabic").
import type { DateKey, MyDayData } from '../types';
import { questionReady } from './revision';

export type Scope = 'all' | 'arabic';
type Scheduled = { id: string; review: { due: DateKey | null } };

function scheduled(d: MyDayData, scope: Scope): Scheduled[] {
  return [...(scope === 'arabic' ? [] : d.study.concepts.filter(questionReady)), ...d.arabic.cards];
}
export function dueIds(d: MyDayData, k: DateKey, scope: Scope = 'all'): string[] {
  const all = scheduled(d, scope);
  const due = all.filter(x => x.review.due && x.review.due <= k).sort((a, b) => (a.review.due! < b.review.due! ? -1 : a.review.due! > b.review.due! ? 1 : 0));
  return due.concat(all.filter(x => !x.review.due)).map(x => x.id);
}
export const nextDueDate = (d: MyDayData, k: DateKey, scope: Scope = 'all') =>
  scheduled(d, scope).map(x => x.review.due).filter((x): x is DateKey => !!x && x > k).sort()[0] || null;
