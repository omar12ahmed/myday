// "Check my answer" on a Cybersecurity knowledge check (ai/checkAnswer.ts): the lesson's objectives, the teaching
// companion's explanation and worked example, the skills it builds on, the question and the answer guide's answer.
import type { CheckAnswerSource } from '../../ai/checkAnswer';
import { lessons, skills } from './catalogue';

export function cyberCheckSource(lessonId: string, q: { prompt: string }, reference: string | undefined, teaching: { explanation?: string; example?: string } | null): CheckAnswerSource | null {
  const l = lessons.get(lessonId);
  if (!l || !reference) return null;
  return {
    subject: 'cybersecurity', lessonId, objectives: l.learning_objectives,
    buildsOn: l.prerequisites.all.map(p => skills.get(p.skill_id)?.name ?? '').filter(Boolean),
    teaching, question: q.prompt, reference,
  };
}
