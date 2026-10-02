// Concepts and revision: which questions are ready, when each comes back, and cautious labels from the
// evidence there is. Ported from the current MyDay — the scheduling rules are unchanged:
//   First review:  Again → tomorrow · Hard → in 2 days · Good → in 4 days
//   After that:    Again → tomorrow (the gap starts over) · Hard → gap × 1.2 · Good → gap × 2.5
//   A gap always grows by at least a day and never goes past 180 days. Dates are local calendar days.
import { shift, shortDate, localStamp } from '../dates';
import { uid } from '../util';
import type { Concept, DateKey, Outcome, Rating, StudyData, Support } from '../types';
import { CLARITY, OUTCOME, SUPPORT } from './common';

// A concept can come up in revision once it has a question and something to check the answer against.
export function questionReady(c: Concept): boolean {
  if (!c.prompt) return false;
  if (c.kind === 'choice') return c.choices.filter(Boolean).length >= 2 && c.correct !== null && !!c.choices[c.correct];
  return !!(c.answer || c.explanation);
}
// Ready to revise: anything due today or earlier (oldest first), then ones never revised.
// Missed days don't pile up — you only ever see one round at a time.
export function dueConcepts(st: StudyData, k: DateKey): Concept[] {
  const ready = st.concepts.filter(questionReady);
  const due = ready.filter(c => c.review.due && c.review.due <= k).sort((a, b) => (a.review.due! < b.review.due! ? -1 : a.review.due! > b.review.due! ? 1 : 0));
  return due.concat(ready.filter(c => !c.review.due));
}
export const nextReviewDate = (st: StudyData, k: DateKey) => st.concepts.filter(questionReady).map(c => c.review.due).filter((d): d is string => !!d && d > k).sort()[0] || null;

export function nextGap(prev: number, rating: Rating): number {
  if (rating === 'again') return 1;
  if (!prev) return rating === 'hard' ? 2 : 4;
  return Math.min(180, Math.max(prev + 1, Math.round(prev * (rating === 'hard' ? 1.2 : 2.5))));
}

// Records one answered question and schedules the concept's next review. The attempt is always kept.
export function rateConcept(st: StudyData, conceptId: string, k: DateKey, a: { outcome: Outcome | null; chosen: number | null; support: Support }, rating: Rating): boolean {
  const c = st.concepts.find(x => x.id === conceptId);
  if (!c) return false;
  const gap = nextGap(c.review.interval, rating);
  c.review = { reps: c.review.reps + 1, interval: gap, lapses: c.review.lapses + (rating === 'again' && c.review.reps ? 1 : 0), due: shift(k, gap) };
  st.reviews.push({
    id: 'rv' + uid(), conceptId: c.id, title: c.title, date: k, at: localStamp(), kind: c.kind, outcome: a.outcome,
    graded: !a.outcome || a.outcome === 'notsure' ? null : c.kind === 'choice' ? 'auto' : 'self', chosen: a.chosen,
    support: a.support, rating, gap, due: c.review.due,
  });
  return true;
}

// Cautious labels from the evidence there is. One good answer is never called mastery.
export type EvidenceStatus = 'introduced' | 'practice' | 'practising' | 'recalled';
export function conceptEvidence(st: StudyData, c: Concept) {
  const revs = st.reviews.filter(r => r.conceptId === c.id);
  const checks = st.sessions.filter(s => s.checkin && s.checkin.conceptIds.includes(c.id) && s.checkin.clarity);
  const clarity = checks.length ? checks[checks.length - 1].checkin!.clarity : null;
  const last = revs[revs.length - 1];
  const own = revs.filter(r => r.outcome === 'right' && r.support === 'own').length;
  let status: EvidenceStatus;
  if (!last) status = clarity === 'notyet' ? 'practice' : 'introduced';
  else if (last.outcome === 'wrong' || last.outcome === 'notsure' || last.rating === 'again') status = 'practice';
  else if (last.outcome === 'right' && last.support === 'own') status = 'recalled';
  else status = 'practising';
  return { status, revs, last, own, clarity };
}
export function evidenceText(ev: ReturnType<typeof conceptEvidence>): string {
  if (!ev.last) return ev.clarity ? `Not revised yet · after learning you said “${CLARITY[ev.clarity]}”` : 'Not revised yet';
  const bits = [`${ev.revs.length} review${ev.revs.length === 1 ? '' : 's'}`, `last ${shortDate(ev.last.date)}: ${ev.last.outcome ? OUTCOME[ev.last.outcome] : 'not assessed'}${ev.last.support !== 'own' ? ` (${SUPPORT[ev.last.support].toLowerCase()})` : ''}`];
  if (ev.own) bits.push(`recalled on your own ${ev.own} time${ev.own === 1 ? '' : 's'}`);
  return bits.join(' · ') + (ev.revs.length < 3 ? ' · not enough evidence yet to say more' : '');
}
