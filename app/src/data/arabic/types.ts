// Arabic Fuṣḥā: your records only. The course itself ships with the app and never holds a person's work.
import type { AnotherWay, DateKey, Outcome, Support } from '../types';
export type Variant = 'short' | 'standard' | 'extended' | 'revision' | 'practical';
export type Help = 'independent' | 'hint' | 'guided';
export type Modality = 'reading' | 'writing' | 'speaking' | 'listening';
// One session on one lesson. No scores: what you did, with how much help, what you answered first, and what
// to come back to.
export interface ArabicAttempt {
  id: string;
  lessonId: string;
  curriculumVersion: string;       // the course version it was done in; an update never rewrites an old attempt
  variant: Variant;                // the session length you chose
  startedAt: string;
  finishedAt: string | null;       // null while it's in progress
  help: Help;
  practised: Modality[];           // ticked by you; listening and speaking are never assumed from typed work
  answers: Record<string, string>; // your first answer to each check question, before seeing the reference
  revealed: string[];              // questions whose reference answer you've seen (their first answers stay as written)
  revisit: string;                 // a note to yourself: what to come back to next time
}
// A revision card (part 3): a starter word one way round, or one lesson check question, that you chose to bring
// back in revision. Only its id, the day you added it and its schedule are saved; the words and questions come from
// the course. Your answers go into Study's revision history (study.reviews), like your concepts' answers.
export type CardSide = 'recognise' | 'write'; // Arabic → meaning, or meaning → Arabic written from memory
export interface ArabicCard {
  id: string;        // "lexeme.arabic-seed-007:recognise" (or ":write"), or a check question's id ("assessment.arabic-…-check.q1")
  addedOn: DateKey;
  review: { reps: number; interval: number; lapses: number; due: DateKey | null }; // the same schedule as a concept's
  anotherWay?: AnotherWay; // an explanation you kept (from 1.20.2)
}
// Your place on one lesson (adaptive Study, specs/adaptive-study.md): only what you chose is saved. The day you
// said it's ready to move on, a flag to come back to it with what needs work, and your latest mark for each of its
// checks from a session. Practised, Holding and a slip after Ready are worked out (data/study/mastery.ts). Kept
// apart from sessions, which older versions rebuild from the fields they know, and synced as its own record.
export interface ArabicMark { outcome: Outcome; support: Support; on: DateKey; attemptId: string }
export interface ArabicLesson {
  id: string;                                 // the lesson's id
  readyOn?: DateKey;                          // the day you marked it ready to move on; gone if you take it back
  revisit?: { since: DateKey; what: string }; // your "Needs revision" flag, with what needs work (≤ 300 characters)
  marks?: Record<string, ArabicMark>;         // by check question id: your latest "How did it go?"
}
// A word you kept (Keep a word, specs/study-home-and-lessons.md §6): the Arabic as you met it (vowel marks as
// written), your meaning, an optional note, where it came from, and its own revision schedules: Arabic → meaning from
// the day after you keep it, and meaning → Arabic once you ask for it. Kept apart from cards, which older versions
// rebuild from ids they know (and would drop), and synced as its own record.
export type Review = ArabicCard['review'];
export const KEPT_FROM = /^(lesson|asset)\.arabic-[a-z0-9-]{1,80}$/; // where a kept word came from: a lesson or a reading text
export interface KeptWord {
  id: string;              // "kw…"
  ar: string;              // ≤ 60 characters, with at least one Arabic letter
  meaning: string;         // your meaning, 1–120 characters
  note?: string;           // ≤ 300 characters
  from?: string;           // the lesson or reading text you kept it from
  addedOn: DateKey;
  recognise: Review;       // Arabic → meaning
  write: Review | null;    // meaning → Arabic, once you ask for it
}
// Practise again (specs/study-home-and-lessons.md §9), one per lesson: the last day a finished session included its
// "Try it" and its mini challenge (you tick them at Reflect), and once you've done either, its own place in revision
// (about 7 days, then 21, 60 and 180). Ticks made in a session that's still open wait in `open` until it finishes.
// Kept apart from the lesson's record and synced as its own: older versions rebuild that record from the fields they
// know (and would drop these).
export type PracticeStep = 'try' | 'challenge';
export interface ArabicPractice {
  id: string;                                         // the lesson's id
  tried?: DateKey;                                    // the last day you did its Try it, in a finished session
  challenged?: DateKey;                               // …and its mini challenge
  open?: { attemptId: string; did: PracticeStep[] };  // what you've ticked in the session still open
  addedOn?: DateKey;                                  // the day it joined revision
  review?: Review;                                    // its schedule in revision, once it has joined
}
export interface ArabicData {
  pathId: string;
  attempts: ArabicAttempt[];
  cards: ArabicCard[]; // added after 1.16.0; absent before → nothing in revision yet
  lessons?: ArabicLesson[]; // adaptive Study; absent until you mark an answer, a lesson ready or one to revisit
  words?: KeptWord[]; // Keep a word; absent until you keep one
  practice?: ArabicPractice[]; // Practise again; absent until you tick a Try or a mini challenge
  [other: string]: unknown; // anything a newer MyDay adds here is kept
}
export const ARABIC_VERSION = '1.1.2'; // the package version these screens show (checked against it by arabic-rules)
export const ARABIC_CORE_PATH = 'path.arabic-core-b2';
export const emptyArabic = (): ArabicData => ({ pathId: ARABIC_CORE_PATH, attempts: [], cards: [] });
// The course suggests 3–8 new words a day (zero is fine). Past this many, a gentle note says so; it never stops you.
export const NEW_WORDS_A_DAY = 8;
export const ADD_A_FEW = 5; // "Add the next 5"
export const VARIANTS: Variant[] = ['short', 'standard', 'extended', 'revision', 'practical'];
export const MODALITIES: Modality[] = ['reading', 'writing', 'speaking', 'listening'];
