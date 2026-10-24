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

// ---------- Arabic in a reply ----------
// Letters (L) and marks (M: vowel marks, shadda, sukun, superscript alif and the Qur'an's marks), as the course writes
// them. A text is folded first (NFKC: presentation forms such as ﻛ become ordinary letters) and invisible characters
// (zero-width joiners, direction marks) go, so nothing can hide another word inside a sent one; any other character
// from the Arabic blocks (letters of other languages' alphabets, dotless forms) isn't accepted.
const L = '\u0621-\u063F\u0641-\u064A\u0671-\u06D3', M = '\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED';
const WORD = new RegExp(`\u0640*[${L}][${L}${M}\u0640]*`, 'g'); // a word, with any stretching line (tatweel) drawn with it
const MARKS = new RegExp(`[${M}]`, 'g'), TATWEEL = /\u0640/g;
const BLOCKS = /[\u0600-\u06FF\u0750-\u077F\u0870-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const ALLOWED = new RegExp(`^[${L}${M}\u0640\u060C\u061B\u061F\u0660-\u0669]$`); // and the comma, semicolon, question mark, digits
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;
const LETTER = /^[\u0621-\u063A\u0641-\u064A]$/; // one of Arabic's own letters, on its own
const AL = /^\u0627\u0644[\u064B-\u0652]?/; // the article, as in الْكِتَاب
const prep = (s: string) => s.normalize('NFKC').replace(INVISIBLE, '');
// The words sent: each as written, without the article, and without vowel marks (written bare, a word can't carry a
// wrong vowel).
function sentWords(text: string) {
  const ok = new Set<string>();
  for (const t of prep(text).match(WORD) ?? []) {
    const w = t.replace(TATWEEL, ''), noAl = w.replace(AL, '');
    for (const x of noAl.replace(MARKS, '').length >= 3 ? [w, noAl] : [w]) { ok.add(x); ok.add(x.replace(MARKS, '')); }
  }
  return ok;
}
// Only Arabic that was sent: whole words as sent (or bare, or without the article), a letter on its own ("ق is a moon
// letter"), and a sent word's beginning or end drawn with the stretching line (فَسَـ, ـكِ). Anything else — an AI's own
// Arabic, a word with its vowel marks changed, part of a word passed off as a word — isn't trusted here.
function onlySentArabic(reply: string, sent: string): boolean {
  const text = prep(reply);
  if (!(text.match(BLOCKS) ?? []).every(ch => ALLOWED.test(ch))) return false;
  const ok = sentWords(sent), whole = [...ok];
  return (text.match(WORD) ?? []).every(t => {
    const w = t.replace(TATWEEL, '');
    if (LETTER.test(w.replace(MARKS, '')) || ok.has(w)) return true;
    const prefix = t.endsWith('\u0640'), suffix = t.startsWith('\u0640');
    return (prefix || suffix) && whole.some(x => x !== w && (prefix ? x.startsWith(w) : x.endsWith(w)));
  });
}
// Verdicts about you. The lesson's own words ("not a score of technical competence", "the flag you passed to chmod",
// "the disk is 90% full") are fine.
export const VERDICT = /\b(?:you(?:['’]ve| have) (?:passed|failed)|you (?:passed|failed) (?:this|the|that) (?:check|test|question|quiz|lesson)|you(?:['’]ve| have)? mastered|well done|great job|excellent work|your (?:grade|score|mark) (?:is|was)|(?:grade|score)\s*[:=]|score of \d|you (?:got|scored|earned) \d)/i;
export const LINK = /\bhttps?:\/\/|\bwww\.[a-z0-9-]+\.[a-z]/i;
const str = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

// The reply, if it's usable: the right parts and lengths, no links, no verdicts, and for Arabic only Arabic that was sent.
export function readCheckAnswer(textIn: string, ctx: Pick<CheckAnswerContext, 'subject' | 'question' | 'yourAnswer' | 'reference' | 'alsoCounts' | 'teaching' | 'objective'>): CheckAnswerReply | null {
  let raw: unknown;
  try { raw = JSON.parse(textIn); } catch { return null; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>, f = r.followUp as Record<string, unknown> | undefined, L = CHECK_ANSWER_LIMITS;
  if (!str(r.hint, L.hintChars) || !str(r.example, L.exampleChars) || !str(r.explanation, L.explanationChars) || !str(r.drewOn, L.drewOnChars)) return null;
  if (!f || typeof f !== 'object' || Array.isArray(f) || !str(f.question, L.followUpChars) || !str(f.answer, L.followAnswerChars)) return null;
  const mark = r.suggestedMark === 'null' ? null : r.suggestedMark; // (some models write null as a word)
  if (!(mark === null || CHECK_ANSWER_MARKS.includes(mark as CheckAnswerMark))) return null;
  const reply: CheckAnswerReply = {
    hint: (r.hint as string).trim(), example: (r.example as string).trim(), explanation: (r.explanation as string).trim(),
    followUp: { question: (f.question as string).trim(), answer: (f.answer as string).trim() },
    drewOn: (r.drewOn as string).trim(), suggestedMark: mark as CheckAnswerMark | null,
  };
  const all = [reply.hint, reply.example, reply.explanation, reply.followUp.question, reply.followUp.answer, reply.drewOn].join('\n');
  if (LINK.test(all) || VERDICT.test(all)) return null;
  if (ctx.subject === 'arabic' && !onlySentArabic(all, [ctx.question, ctx.yourAnswer, ctx.reference, ctx.alsoCounts, ctx.teaching, ctx.objective].join('\n'))) return null;
  return reply;
}
