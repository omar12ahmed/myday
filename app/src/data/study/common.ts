// Study: the shared labels, the empty starting data, and small helpers. Ported from the current MyDay.
import { todayKey } from '../dates';
import { uid } from '../util';
import type { Clarity, Concept, Outcome, Rating, StudyData, Support } from '../types';

export const STARTER_STAGES = ['Foundations', 'Web', 'Security Fundamentals', 'Practical Development'];
export const LEVELS = ['stage', 'course', 'module', 'section', 'task'] as const;
export type Level = (typeof LEVELS)[number];
export const ROUND_SIZE = 5; // questions per revision round — you can always do another round

export const CLARITY: Record<Clarity, string> = { understand: 'Understand', partly: 'Partly understand', notyet: 'Not yet' };
export const OUTCOME: Record<Outcome, string> = { right: 'Right', partly: 'Partly right', wrong: 'Not right', notsure: 'Not sure' };
export const SUPPORT: Record<Support, string> = { own: 'On my own', hint: 'Used a hint', notes: 'Checked notes' };
export const RATING: Record<Rating, string> = { again: 'Again', hard: 'Hard', good: 'Good' };
export const STATUS_TEXT = { introduced: 'Introduced', practice: 'Needs practice', practising: 'Practising', recalled: 'Recalled independently' } as const;

export function emptyStudy(): StudyData {
  return { stages: [], focusCourseId: null, concepts: [], sessions: [], activeId: null, reviews: [], settings: { vault: '', showClock: true } };
}

// Trimmed text up to `max` characters ('' if it isn't text).
export const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
// Only web links (http/https) are kept, so a saved link can never run code.
export const safeUrl = (u: string) => (/^https?:\/\//i.test(u || '') ? u : '');

export function newConcept(title: string, taskId: string | null): Concept {
  return {
    id: 'cp' + uid(), title: title.slice(0, 120), taskIds: taskId ? [taskId] : [], createdOn: todayKey(), kind: 'written',
    prompt: '', answer: '', explanation: '', choices: [], correct: null, hint: '', source: '', note: '', review: { reps: 0, interval: 0, lapses: 0, due: null },
  };
}

// Obsidian opens the note itself. MyDay can't read or change anything in your vault.
export const obsidianUrl = (study: StudyData, path: string) =>
  (study.settings.vault && path ? `obsidian://open?vault=${encodeURIComponent(study.settings.vault)}&file=${encodeURIComponent(path)}` : '');
