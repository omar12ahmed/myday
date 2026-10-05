// Learner records only. The versioned curriculum never contains a person's work.
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
export interface CyberData {
  pathId: string;
  attempts: CyberAttempt[];
}
export const emptyCyber = (): CyberData => ({ pathId: 'path.core', attempts: [] });
export const CYBER_VERSION = '1.0.0';
export const curriculumTaskId = (lessonId: string) => `cyber:1:${lessonId}`;
export const lessonFromTask = (id: string | null) => id?.startsWith('cyber:1:lesson.') ? id.slice(8) : null;
export const lessonHref = (id: string) => `#study/cybersecurity/${encodeURIComponent(id)}`;
