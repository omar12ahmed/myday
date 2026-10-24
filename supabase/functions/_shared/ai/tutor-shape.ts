// The Cybersecurity tutor's reply in parts (graduated help, specs/study-home-and-lessons.md §12), for a request of
// version 2: a small hint first (a question or nudge to think with, before any explanation), a more concrete example, the
// worked explanation, then one short follow-up question with its answer — shown one at a time, only as the learner
// asks. Where parts don't fit (a target that isn't theirs, answer keys, a mark, a question away from the lesson, a
// secret in the question), one plain reply with a next step instead. Kept apart from tutor.ts (the instructions), so the
// app can use it without loading them. A version-1 request (the app before 1.75.0) still gets the old one-part reply.
import { LINK, VERDICT } from './check-answer-shape.ts';

export const TUTOR_STEPS_LIMITS = { hintChars: 400, exampleChars: 800, explanationChars: 2400, followUpChars: 400, followAnswerChars: 600, nextStepChars: 600 };
export type TutorSteps =
  | { kind: 'steps'; hint: string; example: string; explanation: string; followUp: { question: string; answer: string } }
  | { kind: 'plain'; explanation: string; nextStep: string };

const str = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;
// Saying it can't tell ("I can't say whether you've passed") isn't a verdict.
const REFUSING = /\b(?:whether|if)\s+(?:or not\s+)?you(?:['’]ve| have)?\s+\w+/gi;

// The reply, if it's usable: for the lesson asked about, one of the two shapes with every part and within its length,
// and no links or verdicts.
export function readTutorSteps(text: string, lessonId: string): TutorSteps | null {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return null; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>, f = r.followUp as Record<string, unknown> | undefined, L = TUTOR_STEPS_LIMITS;
  if (r.lessonId !== lessonId) return null;
  let out: TutorSteps;
  if (r.kind === 'plain') {
    if (!str(r.explanation, L.explanationChars) || !str(r.nextStep, L.nextStepChars)) return null;
    out = { kind: 'plain', explanation: r.explanation.trim(), nextStep: r.nextStep.trim() };
  } else if (r.kind === 'steps') {
    if (!str(r.hint, L.hintChars) || !str(r.example, L.exampleChars) || !str(r.explanation, L.explanationChars)) return null;
    if (!f || typeof f !== 'object' || Array.isArray(f) || !str(f.question, L.followUpChars) || !str(f.answer, L.followAnswerChars)) return null;
    out = { kind: 'steps', hint: r.hint.trim(), example: r.example.trim(), explanation: r.explanation.trim(), followUp: { question: f.question.trim(), answer: f.answer.trim() } };
  } else return null;
  const all = (out.kind === 'steps' ? [out.hint, out.example, out.explanation, out.followUp.question, out.followUp.answer] : [out.explanation, out.nextStep]).join('\n');
  if (LINK.test(all) || VERDICT.test(all.replace(REFUSING, ''))) return null;
  return out;
}
