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
export interface CyberData {
  pathId: string;
  attempts: CyberAttempt[];
  cards: CyberCard[]; // added after 1.17.1; absent before → nothing in revision yet
  [other: string]: unknown; // anything a newer MyDay adds here is kept
}
export const emptyCyber = (): CyberData => ({ pathId: 'path.core', attempts: [], cards: [] });
export const CYBER_VERSION = '1.0.0';
export const curriculumTaskId = (lessonId: string) => `cyber:1:${lessonId}`;
export const lessonFromTask = (id: string | null) => id?.startsWith('cyber:1:lesson.') ? id.slice(8) : null;
export const lessonHref = (id: string) => `#study/cybersecurity/${encodeURIComponent(id)}`;
