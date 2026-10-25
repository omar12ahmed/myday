// Your place on each Arabic lesson (adaptive Study, specs/adaptive-study.md): marking how a check went, marking a
// lesson ready to move on or one to revisit, and the checks that come back by themselves. Only what you chose is
// saved (arabic.lessons); states come from data/study/mastery.ts. Functions that change data take a draft (see
// storage.ts update()). The course's facts (a lesson's checks) are passed in, so this stays free of the catalogue.
import { shift } from '../dates';
import { DELAYED_CHECK_DAYS, lessonState, placeNewCards, struggled, type CheckAnswer, type LessonEvidence, type LessonState } from '../study/mastery';
import type { DateKey, MyDayData, Outcome, Support } from '../types';
import { cardOf, wordCard, wordInRevision } from './cards';
import { applyTicks, joinRevision, practiceCards, PRACTICE_FIRST_DAYS, settleOthers } from './practice';
import { keptCards } from './words';
import type { ArabicLesson } from './types';

// A lesson's check ids, from its id and how many it has ("lesson.arabic-x", 3 → "assessment.arabic-x-check.q1"…);
// app/scripts/prepare-arabic.mjs refuses a course where that doesn't hold.
export const checkIds = (lessonId: string, count: number) =>
  Array.from({ length: count }, (_, i) => `assessment.${lessonId.slice('lesson.'.length)}-check.q${i + 1}`);

export const lessonRecord = (d: MyDayData, lessonId: string): ArabicLesson | null => d.arabic.lessons?.find(l => l.id === lessonId) ?? null;
// Changes a lesson's record, making it if needed; one left with nothing in it is removed.
function edit(d: MyDayData, lessonId: string, change: (l: ArabicLesson) => void) {
  const list = d.arabic.lessons ??= [];
  let l = list.find(x => x.id === lessonId);
  if (!l) { l = { id: lessonId }; list.push(l); }
  change(l);
  if (!l.readyOn && !l.revisit && !(l.marks && Object.keys(l.marks).length)) list.splice(list.indexOf(l), 1);
}

// ---------- Evidence and state ----------
export function evidence(d: MyDayData, lessonId: string, checks: string[]): LessonEvidence {
  const rec = lessonRecord(d, lessonId), answers: Record<string, CheckAnswer[]> = {};
  for (const id of checks) {
    const list: CheckAnswer[] = d.study.reviews.filter(r => r.conceptId === id).map(r => ({ date: r.date, outcome: r.outcome, support: r.support, rating: r.rating }));
    const m = rec?.marks?.[id];
    if (m) list.push({ date: m.on, outcome: m.outcome, support: m.support });
    answers[id] = list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }
  return {
    finished: d.arabic.attempts.filter(a => a.lessonId === lessonId && a.finishedAt).length,
    readyOn: rec?.readyOn ?? null, flagged: !!rec?.revisit, checks, answers,
  };
}
export const stateOf = (d: MyDayData, lessonId: string, checks: string[]): LessonState => lessonState(evidence(d, lessonId, checks));

// ---------- In a session: "How did it go?" ----------
// Your latest mark for one of the lesson's checks, in the session that's open. A finished session stays as it was.
export function markCheck(d: MyDayData, attemptId: string, questionId: string, outcome: Outcome, support: Support, k: DateKey): boolean {
  const a = d.arabic.attempts.find(x => x.id === attemptId);
  if (!a || a.finishedAt || !questionId.startsWith(`assessment.${a.lessonId.slice('lesson.'.length)}-check.q`)) return false;
  edit(d, a.lessonId, l => { (l.marks ??= {})[questionId] = { outcome, support, on: k, attemptId }; });
  return true;
}
// The marks you gave in one session.
export function marksIn(d: MyDayData, attemptId: string, lessonId: string): Record<string, { outcome: Outcome; support: Support }> {
  const marks = lessonRecord(d, lessonId)?.marks ?? {};
  return Object.fromEntries(Object.entries(marks).filter(([, m]) => m.attemptId === attemptId).map(([q, m]) => [q, { outcome: m.outcome, support: m.support }]));
}
// Discarding a session removes its marks too, like its answers and note.
export function discardMarks(d: MyDayData, attemptId: string, lessonId: string) {
  if (!lessonRecord(d, lessonId)?.marks) return;
  edit(d, lessonId, l => {
    for (const [q, m] of Object.entries(l.marks ?? {})) if (m.attemptId === attemptId) delete l.marks![q];
    if (l.marks && !Object.keys(l.marks).length) delete l.marks;
  });
}
// Checks you marked Not right or Not sure in that session: the ones that haven't clicked yet.
export const notYetIn = (d: MyDayData, attemptId: string, lessonId: string) =>
  Object.entries(marksIn(d, attemptId, lessonId)).filter(([, m]) => struggled({ date: '', ...m })).map(([q]) => q);

// ---------- Cards that join revision by themselves ----------
// Every card in revision that hasn't been answered yet, by its first day back: what the 8-a-day limit counts (the
// words you keep included: never delayed themselves, they count when MyDay places the automatic ones; and Practise
// again's cards).
function firstDueDays(d: MyDayData): (DateKey | null)[] {
  const fresh = (r: { reps: number; due: DateKey | null }) => (r.reps === 0 ? [r.due] : []);
  return [...d.arabic.cards.flatMap(c => fresh(c.review)), ...keptCards(d).flatMap(c => fresh(c.review)), ...practiceCards(d).flatMap(c => fresh(c.review)),
    ...d.cybersecurity.cards.flatMap(c => fresh(c.review)), ...d.study.concepts.flatMap(c => fresh(c.review))];
}
// Adds the checks not already in revision, first back on `from` or the next day with room. Cards already there keep
// their schedule. Returns what was added, with the day each comes back.
// The same for a Cybersecurity lesson's knowledge checks (`subject`), sharing the one 8-a-day count.
export function addAutomatic(d: MyDayData, ids: string[], from: DateKey, k: DateKey, subject: 'arabic' | 'cybersecurity' = 'arabic'): { id: string; due: DateKey }[] {
  const cards = subject === 'arabic' ? d.arabic.cards : d.cybersecurity.cards;
  const fresh = [...new Set(ids)].filter(id => (subject === 'arabic' ? !cardOf(d, id) : !cards.some(c => c.id === id)));
  const days = placeNewCards(firstDueDays(d), from, fresh.length);
  const added = fresh.map((id, i) => ({ id, due: days[i] }));
  for (const { id, due } of added) cards.push({ id, addedOn: k, review: { reps: 0, interval: 0, lapses: 0, due } });
  return added;
}
// After a session: the checks that haven't clicked yet come back from the next day.
export const bringBackNotYet = (d: MyDayData, attemptId: string, lessonId: string, k: DateKey) =>
  addAutomatic(d, notYetIn(d, attemptId, lessonId), shift(k, 1), k);
// …and what you did of its Try it and mini challenge is saved; the first time (or again once you've taken it out),
// the lesson comes back to practise again about a week later. Returns that day, or null.
export function bringBackPractice(d: MyDayData, attemptId: string, lessonId: string, k: DateKey): DateKey | null {
  const earlier = settleTicks(d, lessonId, attemptId, k);
  return applyTicks(d, attemptId, lessonId, k).join ? joinPractice(d, lessonId, k) : earlier;
}
// Ticks another session left behind count before you tick or finish (practice.ts settleOthers), and bring the lesson
// back the same way. Returns the day it comes back, or null.
export function settleTicks(d: MyDayData, lessonId: string, current: string | null, k: DateKey): DateKey | null {
  return settleOthers(d, lessonId, current) ? joinPractice(d, lessonId, k) : null;
}
function joinPractice(d: MyDayData, lessonId: string, k: DateKey): DateKey {
  const [due] = placeNewCards(firstDueDays(d), shift(k, PRACTICE_FIRST_DAYS), 1);
  joinRevision(d, lessonId, due, k);
  return due;
}

// ---------- Ready to move on, and Needs revision ----------
// Saves the day, brings the lesson's words (its course words and the starter words it uses, by id) into revision from
// the next day — Arabic → meaning, any not already there — and its checks back a week later (the delayed check), all
// within the 8 new a day. Marking it ready again starts afresh from today, and clears your own flag: you've said it's
// fine now. Returns what it added: word cards ("lexeme.…:recognise") first, then checks.
export function markReady(d: MyDayData, lessonId: string, checks: string[], k: DateKey, words: string[] = []) {
  edit(d, lessonId, l => { l.readyOn = k; delete l.revisit; });
  const fresh = words.filter(id => !wordInRevision(d, id)).map(id => wordCard(id, 'recognise'));
  return [...addAutomatic(d, fresh, shift(k, 1), k), ...addAutomatic(d, checks, shift(k, DELAYED_CHECK_DAYS), k)];
}
// "Not ready after all": the cards stay in revision; you can take them out as before.
export function unmarkReady(d: MyDayData, lessonId: string): boolean {
  if (!lessonRecord(d, lessonId)?.readyOn) return false;
  edit(d, lessonId, l => { delete l.readyOn; });
  return true;
}
export function flagRevisit(d: MyDayData, lessonId: string, what: string, k: DateKey) {
  edit(d, lessonId, l => { l.revisit = { since: k, what: what.trim().slice(0, 300) }; });
}
export function clearRevisit(d: MyDayData, lessonId: string): boolean {
  if (!lessonRecord(d, lessonId)?.revisit) return false;
  edit(d, lessonId, l => { delete l.revisit; });
  return true;
}

// ---------- Sessions from before adaptive Study ----------
// Lessons with a finished session and no record of your own yet (no mark, no Ready, no flag): what the one-time
// "Mark any of them ready?" offer lists. Sessions from before adaptive Study are all like this.
export function practisedUnmarked(d: MyDayData): string[] {
  const ids = d.arabic.attempts.filter(a => a.finishedAt).map(a => a.lessonId);
  return [...new Set(ids)].filter(id => !lessonRecord(d, id));
}
