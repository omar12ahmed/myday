// Arabic sessions: starting, changing and finishing one. Where a lesson stands (Practised, Ready to move on…) and the
// next step are adaptive Study's (data/arabic/lessons.ts, study/arabic/plan.ts): a finished session is practice,
// never by itself "done".
import { uid } from '../util';
import type { MyDayData } from '../types';
import { ARABIC_VERSION, type ArabicAttempt, type Variant } from './types';

export const sessionsFor = (d: MyDayData, lessonId: string) => d.arabic.attempts.filter(a => a.lessonId === lessonId);
// The session still open on a lesson (only one at a time), if any.
export const openSession = (d: MyDayData, lessonId: string) => sessionsFor(d, lessonId).filter(a => !a.finishedAt).pop() ?? null;

export function beginSession(d: MyDayData, lessonId: string, variant: Variant): string {
  const open = openSession(d, lessonId);
  if (open) return open.id;
  const a: ArabicAttempt = {
    id: 'aa' + uid(), lessonId, curriculumVersion: ARABIC_VERSION, variant, startedAt: new Date().toISOString(), finishedAt: null,
    help: 'independent', practised: [], answers: {}, revealed: [], revisit: '',
  };
  d.arabic.attempts.push(a);
  return a.id;
}
// Changes an open session; a finished one stays as it was.
export function changeSession(d: MyDayData, id: string, change: (a: ArabicAttempt) => void): boolean {
  const a = d.arabic.attempts.find(x => x.id === id);
  if (!a || a.finishedAt) return false;
  change(a);
  return true;
}
// Your first answer to a check question. Once you've seen the reference answer it stays as you wrote it.
export function writeFirstAnswer(a: ArabicAttempt, questionId: string, text: string) {
  if (a.revealed.includes(questionId)) return;
  if (text.trim()) a.answers[questionId] = text.slice(0, 4000);
  else delete a.answers[questionId];
}
export function markRevealed(a: ArabicAttempt, questionId: string) {
  if (!a.revealed.includes(questionId)) a.revealed.push(questionId);
}
export const finishSession = (d: MyDayData, id: string) => changeSession(d, id, a => { a.finishedAt = new Date().toISOString(); });
export function discardSession(d: MyDayData, id: string): boolean {
  const i = d.arabic.attempts.findIndex(a => a.id === id);
  if (i < 0) return false;
  d.arabic.attempts.splice(i, 1);
  return true;
}
