// Arabic Fuṣḥā: your records only. The course itself ships with the app and never holds a person's work.
import type { AnotherWay, DateKey } from '../types';
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
export interface ArabicData {
  pathId: string;
  attempts: ArabicAttempt[];
  cards: ArabicCard[]; // added after 1.16.0; absent before → nothing in revision yet
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
