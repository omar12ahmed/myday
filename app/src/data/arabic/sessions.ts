// Arabic sessions: starting, changing and finishing one, and where you are on the map. Places, never scores:
// a module is unexplored, being explored, or visited (every core lesson in it finished at least once).
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

export type Place = 'unexplored' | 'exploring' | 'visited';
export function placeOf(d: MyDayData, lessonIds: string[], coreLessonIds: string[]): Place {
  if (!d.arabic.attempts.some(a => lessonIds.includes(a.lessonId))) return 'unexplored';
  const done = new Set(d.arabic.attempts.filter(a => a.finishedAt).map(a => a.lessonId));
  return coreLessonIds.length > 0 && coreLessonIds.every(id => done.has(id)) ? 'visited' : 'exploring';
}
export const lessonDone = (d: MyDayData, lessonId: string) => d.arabic.attempts.some(a => a.lessonId === lessonId && a.finishedAt);

// The next small step along your path: a session still open (pick up where you left off), otherwise the first
// lesson you haven't finished yet.
export function nextStep(d: MyDayData, pathLessonIds: string[]): { lessonId: string; resume: boolean } {
  const open = d.arabic.attempts.filter(a => !a.finishedAt && pathLessonIds.includes(a.lessonId)).pop();
  if (open) return { lessonId: open.lessonId, resume: true };
  return { lessonId: pathLessonIds.find(id => !lessonDone(d, id)) ?? pathLessonIds[0], resume: false };
}
