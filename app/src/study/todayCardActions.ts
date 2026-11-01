// Today's Study card's "Ready — next lesson" and "Let it go" (specs/today-learning-and-tidy.md §3): exactly what the
// lesson page's Ready to move on and Discard do. Loaded on demand, with the course (it's large).
import { todayKey } from '../data/dates';
import { discardMarks, markReady } from '../data/arabic/lessons';
import { discardTicks } from '../data/arabic/practice';
import { discardSession } from '../data/arabic/sessions';
import { markCyberReady } from '../data/cybersecurity/lessons';
import { update } from '../data/storage';
import { checksOf } from './arabic/plan';
import { lessonWordIds } from './arabic/courseWords';
import { factsOf } from './cybersecurity/plan';

// Ready to move on: its checks come back in revision, and the card (and today's Study entry) move to the next step.
// Returns when its checks come back (empty when they're already in revision), or null if nothing was saved.
export function readyFromToday(subject: 'arabic' | 'cybersecurity', lessonId: string): { id: string; due: string }[] | null {
  let added: { id: string; due: string }[] = [];
  const k = todayKey();
  const ok = update(d => {
    added = subject === 'arabic' ? markReady(d, lessonId, checksOf(lessonId), k, lessonWordIds(lessonId)) : markCyberReady(d, factsOf(lessonId), k);
  });
  return ok ? added : null;
}

// An Arabic session left open: its answers, marks and ticks go, as with the lesson's own Discard.
export const letGoOfSession = (attemptId: string, lessonId: string) =>
  update(d => { discardMarks(d, attemptId, lessonId); discardTicks(d, attemptId, lessonId); if (!discardSession(d, attemptId)) return false; });
