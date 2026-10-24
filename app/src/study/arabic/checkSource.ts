// "Check my answer" on an Arabic lesson check (ai/checkAnswer.ts): the lesson's objectives, its own example, the
// teaching companion's explanation and worked example, the skills it builds on, the question and its reference answer.
import type { CheckAnswerSource } from '../../ai/checkAnswer';
import { lessonIndex, skills, type Lesson, type Question } from './catalogue';

export function arabicCheckSource(l: Lesson, q: Question, key: { answer: string; variation: string } | undefined, teaching: { explanation?: string; example?: string } | null): CheckAnswerSource | null {
  if (!key?.answer) return null;
  return {
    subject: 'arabic', lessonId: l.id, objectives: l.learning_objectives,
    buildsOn: (lessonIndex[l.id]?.builds_on ?? []).map(s => skills[`skill.arabic-${s}`]?.name ?? s),
    teaching, lessonExample: l.example ?? null, question: q.prompt, reference: key.answer, alsoCounts: key.variation,
  };
}
