// Learner records only. The versioned curriculum never contains a person's work.
import type { AnotherWay, DateKey } from '../types';
export type Assistance = 'independent' | 'hint' | 'guided';
export interface CyberAttempt {
  id: string;
  activityId: string;
  curriculumVersion: string;
  rubricVersion: string;
  startedAt: string;
  submittedAt: string | null;
  inputVariant: string;
  environmentId: string;
  assistance: Assistance;
  evidence: string;
  answers: Record<string, string>;
  rubricScores: number[];
  criticalPassed: boolean | null;
  resumePoint: string;
  answerRevealed: boolean;
  // Self-study evidence is explicitly provisional. Neither a timer nor a model verifies skill.
  assessor: 'self';
  verified: false;
}
// A lesson's knowledge-check question that you chose to bring back in revision. Only its id (the course's), the day
// you added it and its schedule are saved; the question and its reference answer come from the course. Answers go
// into Study's revision history (study.reviews), like a concept's.
export interface CyberCard {
  id: string;        // the question's id, e.g. "assessment.lab-isolation-check.q2"
  addedOn: DateKey;
  review: { reps: number; interval: number; lapses: number; due: DateKey | null };
  anotherWay?: AnotherWay; // an explanation you kept (from 1.20.2)
}
// An entry in your portfolio (specs/study-home-and-lessons.md §10): made from a notebook attempt you handed in, with a
// title, a copy of the attempt's evidence as you chose to keep it (so you can redact it first, and the portfolio stands
// on its own), an optional note, the day you reviewed it (ticking the privacy check) and up to 5 files, listed by their
// shared file records' ids (data/files.ts, area 'portfolio'). Synced as its own record, `cyber_portfolio`.
export interface PortfolioEntry {
  id: string;            // "pf…"
  attemptId: string;     // the notebook attempt it came from
  activityId: string;    // that attempt's activity
  title: string;         // 1–120 characters
  evidence: string;      // ≤ 12,000 characters
  note: string;          // ≤ 1,000 characters
  reviewedOn: DateKey;   // the day you ticked the privacy check
  fileIds?: string[];    // up to PORTFOLIO_FILES
  [other: string]: unknown; // anything a newer MyDay adds to an entry is kept
}
export const PORTFOLIO_FILES = 5;
export interface CyberData {
  pathId: string;
  attempts: CyberAttempt[];
  cards: CyberCard[]; // added after 1.17.1; absent before → nothing in revision yet
  portfolio?: PortfolioEntry[]; // the portfolio; absent until you add an entry
  [other: string]: unknown; // anything a newer MyDay adds here is kept
}
export const emptyCyber = (): CyberData => ({ pathId: 'path.core', attempts: [], cards: [] });
export const CYBER_VERSION = '1.0.0';
export const curriculumTaskId = (lessonId: string) => `cyber:1:${lessonId}`;
export const lessonFromTask = (id: string | null) => id?.startsWith('cyber:1:lesson.') ? id.slice(8) : null;
export const lessonHref = (id: string) => `#study/cybersecurity/${encodeURIComponent(id)}`;
