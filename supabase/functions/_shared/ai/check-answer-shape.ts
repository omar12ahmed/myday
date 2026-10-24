// The shape of "Check my answer" (graduated help, specs/study-home-and-lessons.md §12): limits, what's sent and the
// reply check — kept apart from check-answer.ts (the instructions), so the app can use it without loading those.
export const CHECK_ANSWER_LIMITS = {
  objectiveChars: 800, teachingChars: 4000, prerequisites: 6, prerequisiteChars: 160,
  questionChars: 800, yourAnswerChars: 1500, referenceChars: 2000, alsoChars: 1200,
  hintChars: 400, exampleChars: 800, explanationChars: 1600, followUpChars: 400, followAnswerChars: 600, drewOnChars: 160,
};
export const CHECK_ANSWER_SUBJECTS = ['arabic', 'cybersecurity'] as const;
export type CheckAnswerSubject = typeof CHECK_ANSWER_SUBJECTS[number];
export const CHECK_ANSWER_MARKS = ['right', 'partly', 'wrong'] as const;
export type CheckAnswerMark = typeof CHECK_ANSWER_MARKS[number];

// What's sent, on your tap, for one question you've answered: the lesson's objectives and teaching (as taught), what it
// builds on, the question, your answer, and the course's reference answer (and what else counts). Nothing else.
export interface CheckAnswerContext {
  version: 1; action: 'check-answer';
  subject: CheckAnswerSubject;
  lessonId: string;          // the lesson the question belongs to (for the record of what was asked)
  objective: string;         // the lesson's learning objectives, one per line
  teaching: string;          // the lesson's explanation and worked example, as taught ('' if none)
  prerequisites: string[];   // the skills it builds on, by name
  question: string;
  yourAnswer: string;        // what you wrote (never empty: there's nothing to check otherwise)
  reference: string;         // the course's reference answer
  alsoCounts: string;        // what else counts as right ('' if the course gives nothing)
}
// The reply, shown one part at a time as you ask: a small hint, a more concrete example, the worked explanation, then one
// short follow-up question with its answer. `drewOn` names the part of the lesson it used; `suggestedMark` is only a
// suggestion you accept or change (null when it can't tell).
export interface CheckAnswerReply {
  hint: string; example: string; explanation: string;
  followUp: { question: string; answer: string };
  drewOn: string;
  suggestedMark: CheckAnswerMark | null;
}

// Arabic words in a text: a letter, then letters and marks (vowel marks, tatweel), as written.
const ARABIC_RUN = /[ء-يٱ-ۓ][ؐ-ؚء-ٰٟ-ۓـ]*/g;
const VERDICT = /\b(you(?:'ve| have)? passed|you(?:'ve| have)? failed|well done|great job|excellent work|you(?:'ve| have)? mastered|mastery|grade|score of|\d+\s*\/\s*10\b|\d+\s*%)/i;
const LINK = /\bhttps?:\/\/|\bwww\.[a-z0-9-]+\.[a-z]/i;
const str = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

// The reply, if it's usable: the right parts and lengths, no links, no verdicts, and for Arabic no Arabic word that
// wasn't in what was sent (exactly as written: an AI's own Arabic or changed vowel marks can't be trusted here).
export function readCheckAnswer(textIn: string, ctx: Pick<CheckAnswerContext, 'subject' | 'question' | 'yourAnswer' | 'reference' | 'alsoCounts' | 'teaching' | 'objective'>): CheckAnswerReply | null {
  let raw: unknown;
  try { raw = JSON.parse(textIn); } catch { return null; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>, f = r.followUp as Record<string, unknown> | undefined, L = CHECK_ANSWER_LIMITS;
  if (!str(r.hint, L.hintChars) || !str(r.example, L.exampleChars) || !str(r.explanation, L.explanationChars) || !str(r.drewOn, L.drewOnChars)) return null;
  if (!f || typeof f !== 'object' || Array.isArray(f) || !str(f.question, L.followUpChars) || !str(f.answer, L.followAnswerChars)) return null;
  if (!(r.suggestedMark === null || CHECK_ANSWER_MARKS.includes(r.suggestedMark as CheckAnswerMark))) return null;
  const reply: CheckAnswerReply = {
    hint: (r.hint as string).trim(), example: (r.example as string).trim(), explanation: (r.explanation as string).trim(),
    followUp: { question: (f.question as string).trim(), answer: (f.answer as string).trim() },
    drewOn: (r.drewOn as string).trim(), suggestedMark: r.suggestedMark as CheckAnswerMark | null,
  };
  const all = [reply.hint, reply.example, reply.explanation, reply.followUp.question, reply.followUp.answer, reply.drewOn].join('\n');
  if (LINK.test(all) || VERDICT.test(all)) return null;
  if (ctx.subject === 'arabic') {
    const given = [ctx.question, ctx.yourAnswer, ctx.reference, ctx.alsoCounts, ctx.teaching, ctx.objective].join('\n').normalize('NFC');
    for (const run of all.normalize('NFC').match(ARABIC_RUN) ?? []) if (!given.includes(run)) return null;
  }
  return reply;
}
