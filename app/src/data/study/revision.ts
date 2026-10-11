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

// Why something needs practice — worked out from your answers, so nothing new is saved and the schedule is
// unchanged. It "slipped" if you've recalled it on your own before; it "hasn't clicked yet" if you never
// have (or said "not yet" after learning it). The two need different help: a slip just needs to come back
// sooner, but repeating something that never clicked helps less than learning it a different way.
export type Understanding = 'new' | 'not-yet' | 'slipped' | 'getting-there' | 'recalled';
export const UNDERSTANDING: Record<Understanding, { label: string; text: string }> = {
  'new': { label: 'Not revised yet', text: 'Not revised yet.' },
  'not-yet': { label: 'Hasn’t clicked yet', text: 'You haven’t recalled this on your own yet. Learning it a different way will help more than repeating it.' },
  'slipped': { label: 'Slipped', text: 'You’ve recalled this on your own before, so it’s in there. Seeing it again sooner will bring it back.' },
  'getting-there': { label: 'Getting there', text: 'Right last time, with some help or partly. On your own is the next step.' },
  'recalled': { label: 'Recalled on your own', text: 'You recalled this on your own last time.' },
};
export function understanding(st: StudyData, c: Concept): Understanding {
  const ev = conceptEvidence(st, c);
  if (!ev.last) return ev.clarity === 'notyet' ? 'not-yet' : 'new';
  const struggled = ev.last.outcome === 'wrong' || ev.last.outcome === 'notsure' || ev.last.rating === 'again';
  if (struggled) return ev.own > 0 ? 'slipped' : 'not-yet';
  return ev.last.outcome === 'right' && ev.last.support === 'own' ? 'recalled' : 'getting-there';
}

// How often it slipped: answers that weren't right after you had already recalled it on your own. (The
// schedule's own lapse count includes every "Again" after a first review, so it can't tell the two apart.)
export function slips(st: StudyData, c: Concept): number {
  let recalled = false, n = 0;
  for (const r of st.reviews) {
    if (r.conceptId !== c.id) continue;
    if (recalled && (r.outcome === 'wrong' || r.outcome === 'notsure' || r.rating === 'again')) n++;
    if (r.outcome === 'right' && r.support === 'own') recalled = true;
  }
  return n;
}

// Multiple choice: a wrong option you've picked at least twice — the idea worth untangling. (The answer
// that's marked correct now; an answer you've since changed isn't counted as wrong.)
export function repeatedWrongChoice(st: StudyData, c: Concept): { choice: number; times: number } | null {
  if (c.kind !== 'choice' || c.correct === null) return null;
  const times = new Map<number, number>();
  for (const r of st.reviews) if (r.conceptId === c.id && r.chosen !== null && r.chosen !== c.correct && c.choices[r.chosen]) times.set(r.chosen, (times.get(r.chosen) ?? 0) + 1);
  let best: { choice: number; times: number } | null = null;
  for (const [choice, n] of times) if (n >= 2 && (!best || n > best.times)) best = { choice, times: n };
  return best;
}

// A gentle stopping point: after this many reviews in a day, revision says that's plenty (you can carry on).
export const DAILY_ENOUGH = 10;
export const reviewedOn = (st: StudyData, k: DateKey) => st.reviews.filter(r => r.date === k).length;
