// "Check my answer" (graduated help, specs/study-home-and-lessons.md §12): what's sent, on your tap, for one lesson check
// you've answered — the lesson's objectives and teaching as the course gives them, the skills it builds on, the question,
// the course's reference answer (and what else counts) and your answer. Nothing of your MyDay is read: no other answers,
// notes, marks or lesson states. An answer that looks like it holds a password or key isn't sent (the portfolio's check).
import { secretsIn } from '../data/cybersecurity/portfolio';
import { CHECK_ANSWER_LIMITS as L, type CheckAnswerContext, type CheckAnswerSubject } from '../../../supabase/functions/_shared/ai/check-answer-shape';

export interface CheckAnswerSource {
  subject: CheckAnswerSubject;
  lessonId: string;
  objectives: readonly string[];
  buildsOn: readonly string[];                                  // the skills it builds on, by name
  teaching?: { explanation?: string; example?: string } | null; // the teaching companion's entry, when there is one
  lessonExample?: { text_ar: string; meaning_en: string } | null; // an Arabic lesson's own example
  question: string;
  reference: string;
  alsoCounts?: string;
}
export type CheckAnswerRequest = { ok: true; ctx: CheckAnswerContext } | { ok: false; why: string };

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

export function checkAnswerRequest(src: CheckAnswerSource, yourAnswer: string): CheckAnswerRequest {
  const answer = yourAnswer.trim();
  if (!answer) return { ok: false, why: 'Write your own answer first.' };
  const secrets = secretsIn(answer);
  if (secrets.length) return { ok: false, why: `Your answer has what looks like ${secrets.join(', ')}. Take it out first: your answer is sent to AI.` };
  const t = src.teaching, ex = src.lessonExample;
  const teaching = [t?.explanation, t?.example && `Worked example: ${t.example}`, ex && `Lesson example: ${ex.text_ar} — ${ex.meaning_en}`].filter(Boolean).join('\n\n');
  return { ok: true, ctx: {
    version: 1, action: 'check-answer', subject: src.subject, lessonId: src.lessonId,
    objective: cut(src.objectives.join('\n'), L.objectiveChars), teaching: cut(teaching, L.teachingChars),
    prerequisites: src.buildsOn.filter(Boolean).slice(0, L.prerequisites).map(x => cut(x, L.prerequisiteChars)),
    question: cut(src.question, L.questionChars), yourAnswer: cut(answer, L.yourAnswerChars),
    reference: cut(src.reference, L.referenceChars), alsoCounts: cut(src.alsoCounts ?? '', L.alsoChars),
  } };
}
