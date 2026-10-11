// Arabic Fuṣḥā: your records only. The course itself ships with the app and never holds a person's work.
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
export interface ArabicData {
  pathId: string;
  attempts: ArabicAttempt[];
}
export const ARABIC_VERSION = '1.1.0'; // the package version these screens show (checked against it by arabic-rules)
export const ARABIC_CORE_PATH = 'path.arabic-core-b2';
export const emptyArabic = (): ArabicData => ({ pathId: ARABIC_CORE_PATH, attempts: [] });
export const VARIANTS: Variant[] = ['short', 'standard', 'extended', 'revision', 'practical'];
export const MODALITIES: Modality[] = ['reading', 'writing', 'speaking', 'listening'];
