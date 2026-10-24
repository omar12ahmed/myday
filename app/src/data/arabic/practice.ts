// Practise again (specs/study-home-and-lessons.md §9): a lesson's own "Try it" and mini challenge, done again a week
// later and then at longer gaps, because a skill needs doing again, not just remembering. You tick what you did at
// Reflect; finishing the session records the day, and when the lesson isn't in revision yet it joins as one
// Practise again card (lessons.ts places it, within the 8 new cards a day). Only what you ticked is saved
// (arabic.practice). Functions that change data take a draft (see storage.ts update()).
import { keyOf } from '../dates';
import { rateItem, type Answered } from '../study/revision';
import type { DateKey, MyDayData, Rating } from '../types';
import type { ArabicPractice, PracticeStep, Review } from './types';

export const PRACTICE_FIRST_DAYS = 7;
const LADDER = [7, 21, 60, 180];
const STEPS: PracticeStep[] = ['try', 'challenge'];
// Again: back in a week. Hard: the same gap again. Good: the next gap up, never past 180 days.
export function practiceGap(prev: number, rating: Rating): number {
  if (rating === 'again') return LADDER[0];
  const at = Math.min(180, Math.max(LADDER[0], prev));
  if (rating === 'hard') return at;
  return LADDER.find(g => g > at) ?? 180;
}

export const practiceOf = (d: MyDayData, lessonId: string): ArabicPractice | null => d.arabic.practice?.find(p => p.id === lessonId) ?? null;
// Changes a lesson's record, making it if needed; one left with nothing in it is removed.
function edit(d: MyDayData, lessonId: string, change: (p: ArabicPractice) => void) {
  const list = d.arabic.practice ??= [];
  let p = list.find(x => x.id === lessonId);
  if (!p) { p = { id: lessonId }; list.push(p); }
  change(p);
  if (!p.tried && !p.challenged && !p.open && !p.review) list.splice(list.indexOf(p), 1);
}

// ---------- In a session: what you did ----------
// What you've ticked in this session (none once it's finished or discarded, or if the ticks are another session's).
export function ticksIn(d: MyDayData, attemptId: string, lessonId: string): PracticeStep[] {
  const o = practiceOf(d, lessonId)?.open;
  return o && o.attemptId === attemptId ? o.did : [];
}
// Ticks or unticks "I did its Try it" / "…its mini challenge" in a session that's open.
export function tickStep(d: MyDayData, attemptId: string, step: PracticeStep, on: boolean): boolean {
  const a = d.arabic.attempts.find(x => x.id === attemptId);
  if (!a || a.finishedAt) return false;
  const now = ticksIn(d, attemptId, a.lessonId);
  if (now.includes(step) === on) return false;
  const did = STEPS.filter(s => (s === step ? on : now.includes(s)));
  edit(d, a.lessonId, p => { if (did.length) p.open = { attemptId, did }; else delete p.open; });
  return true;
}
// Discarding a session takes its ticks with it, like its answers and note.
export function discardTicks(d: MyDayData, attemptId: string, lessonId: string) {
  if (ticksIn(d, attemptId, lessonId).length) edit(d, lessonId, p => { delete p.open; });
}
// The ticks become the days you did them. Returns whether the lesson should now join revision (you did one of them
// and it isn't there yet).
function recordDays(d: MyDayData, lessonId: string, did: PracticeStep[], day: DateKey): boolean {
  edit(d, lessonId, p => {
    if (did.includes('try') && !(p.tried && p.tried > day)) p.tried = day;
    if (did.includes('challenge') && !(p.challenged && p.challenged > day)) p.challenged = day;
    delete p.open;
  });
  return did.length > 0 && !practiceOf(d, lessonId)?.review;
}
// Finishing a session: its own ticks, dated today.
export function applyTicks(d: MyDayData, attemptId: string, lessonId: string, k: DateKey): { did: PracticeStep[]; join: boolean } {
  const did = ticksIn(d, attemptId, lessonId);
  return { did, join: did.length > 0 && recordDays(d, lessonId, did, k) };
}
// Ticks another session left behind (not `current`): a session finished where the ticks hadn't reached (another
// device, or an older MyDay) still counts, dated the day it finished; a session that's gone leaves nothing. Returns
// whether the lesson should now join revision, or null when there was nothing to settle.
export function settleOthers(d: MyDayData, lessonId: string, current: string | null): boolean | null {
  const o = practiceOf(d, lessonId)?.open;
  if (!o || o.attemptId === current) return null;
  const a = d.arabic.attempts.find(x => x.id === o.attemptId);
  if (a && !a.finishedAt) return null; // still open (on another device, say): its ticks wait for it
  return recordDays(d, lessonId, a ? o.did : [], a ? keyOf(new Date(a.finishedAt!)) : '');
}
// Joins revision, first back on `due` (7 days on, or the next day with room).
export function joinRevision(d: MyDayData, lessonId: string, due: DateKey, k: DateKey) {
  edit(d, lessonId, p => { p.addedOn = k; p.review = { reps: 0, interval: PRACTICE_FIRST_DAYS, lapses: 0, due }; });
}
// "Don't bring it back": out of revision. The days you did it stay; doing its Try in a later session brings it back.
export function takeOutPractice(d: MyDayData, lessonId: string): boolean {
  if (!practiceOf(d, lessonId)?.review) return false;
  edit(d, lessonId, p => { delete p.review; delete p.addedOn; });
  return true;
}

// ---------- In revision ----------
// A lesson in revision is one card, by id "<lesson id>:practise", read from its record.
const PRACTICE_CARD = /^(lesson\.arabic-[a-z0-9-]{1,50}):practise$/;
export const practiceCardId = (lessonId: string) => `${lessonId}:practise`;
export const practiceRef = (cardId: string): string | null => PRACTICE_CARD.exec(cardId)?.[1] ?? null;
export const practiceCards = (d: MyDayData): { id: string; addedOn: DateKey; review: Review }[] =>
  (d.arabic.practice ?? []).flatMap(p => (p.review && p.addedOn ? [{ id: practiceCardId(p.id), addedOn: p.addedOn, review: p.review }] : []));
// Records an answer: rescheduled on Practise again's own gaps, the answer kept in Study's revision history.
export function ratePractice(d: MyDayData, cardId: string, title: string, k: DateKey, a: Answered, rating: Rating): boolean {
  const lessonId = practiceRef(cardId), p = lessonId ? practiceOf(d, lessonId) : null;
  if (!p?.review) return false;
  const item = { id: cardId, review: p.review };
  rateItem(d.study, item, { title, kind: 'written' }, k, a, rating, practiceGap);
  p.review = item.review;
  return true;
}
