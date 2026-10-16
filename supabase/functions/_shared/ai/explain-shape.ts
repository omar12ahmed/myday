// The shape of "Explain it another way" (AI roles step 4): limits, what's sent and the reply check — kept apart from
// explain.ts (the instructions, which carry every lesson's outline), so the app can use it without loading those.
export const EXPLAIN_LIMITS = {
  questionChars: 600, choiceChars: 200, choices: 6, answerChars: 2000, explanationChars: 2000, yourAnswerChars: 1000,
  replyChars: 1500,       // the explanation that comes back (the most a kept one may hold)
};
export const EXPLAIN_SUBJECTS = ['study', 'cybersecurity', 'arabic'] as const;
export type ExplainSubject = typeof EXPLAIN_SUBJECTS[number];
export const EXPLAIN_OUTCOMES = ['right', 'partly', 'wrong', 'notsure'] as const;

export interface ExplainContext {
  version: 1; action: 'explain';
  subject: ExplainSubject;
  lessonId?: string;        // a Cybersecurity check's lesson (the server adds its outline)
  question: string;
  choices?: string[];       // a multiple-choice question's options
  answer: string;           // the right answer (the course's reference answer, the marked option, or your own concept's)
  explanation: string;      // the explanation you've already seen ('' if none)
  yourAnswer: string;       // what you typed or chose ('' if nothing)
  outcome: typeof EXPLAIN_OUTCOMES[number] | null; // how it went, as marked
}

// The reply: the explanation, if it is one (the app shows nothing otherwise).
export function readExplain(textIn: string): string | null {
  let raw: unknown;
  try { raw = JSON.parse(textIn); } catch { return null; }
  const e = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as { explanation?: unknown }).explanation : null;
  return typeof e === 'string' && e.trim() && e.trim().length <= EXPLAIN_LIMITS.replyChars ? e.trim() : null;
}
