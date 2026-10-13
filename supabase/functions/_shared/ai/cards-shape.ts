// The shape of AI-written revision cards (AI roles step 3, B): the limits, what's sent and returned, and the checks
// on each card and on the checker's verdicts. Kept apart from cards.ts (the instructions and practice versions), so
// the app can check cards without loading every lesson's outline. No imports and no runtime-specific code.
export const CARDS_LIMITS = {
  cards: 10,             // at most this many per request
  existing: 40,          // questions of cards you already have for the lesson, sent so they aren't repeated
  promptChars: 240,
  answerChars: 300,
  explanationChars: 400,
  choiceChars: 120,
  minChoices: 3, maxChoices: 4,
  reasonChars: 200,
};

export interface CardsContext {
  version: 1; action: 'cards'; curriculumVersion: '1.0.0';
  lessonId: string;
  count: number;         // how many cards to write (1–10)
  existing: string[];    // questions already in your revision for this lesson
}
export interface DraftCard { kind: 'written' | 'choice'; prompt: string; answer: string; explanation: string; choices?: string[]; correct?: number }
// The checker's request is built on the server from the writer's cards; it's never accepted from the app.
export interface CardsCheckContext { version: 1; action: 'cards-check'; lessonId: string; cards: DraftCard[] }
export interface Verdict { index: number; verdict: 'keep' | 'drop'; reason: string }

export const isStr = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

// One card as the app will accept it: the right fields and lengths, and a multiple-choice card with 3–4 distinct
// options and exactly one marked right. Anything else is left out (and counted), never repaired.
export function cleanDraftCard(raw: unknown): DraftCard | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const c = raw as Record<string, unknown>;
  if (c.kind !== 'written' && c.kind !== 'choice') return null;
  if (!isStr(c.prompt, CARDS_LIMITS.promptChars) || !isStr(c.answer, CARDS_LIMITS.answerChars) || !isStr(c.explanation, CARDS_LIMITS.explanationChars)) return null;
  const card: DraftCard = { kind: c.kind, prompt: (c.prompt as string).trim(), answer: (c.answer as string).trim(), explanation: (c.explanation as string).trim() };
  if (c.kind === 'choice') {
    const ch = c.choices;
    if (!Array.isArray(ch) || ch.length < CARDS_LIMITS.minChoices || ch.length > CARDS_LIMITS.maxChoices || !ch.every(x => isStr(x, CARDS_LIMITS.choiceChars))) return null;
    const choices = (ch as string[]).map(x => x.trim());
    if (new Set(choices.map(x => x.toLowerCase())).size !== choices.length) return null;
    if (!Number.isInteger(c.correct) || (c.correct as number) < 0 || (c.correct as number) >= choices.length) return null;
    card.choices = choices; card.correct = c.correct as number;
  }
  return card;
}
// The writer's reply: its cards that pass the shape check (at most `count`), and how many didn't.
export function readDraft(text: string, lessonId: string, count: number): { cards: DraftCard[]; leftOut: number } | null {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return null; }
  if (!raw || typeof raw !== 'object' || (raw as { lessonId?: unknown }).lessonId !== lessonId || !Array.isArray((raw as { cards?: unknown }).cards)) return null;
  const list = (raw as { cards: unknown[] }).cards;
  const cards = list.map(cleanDraftCard).filter((c): c is DraftCard => !!c).slice(0, count);
  return { cards, leftOut: list.length - cards.length };
}
// The checker's reply: one verdict per card, in order. Anything missing or unclear counts as "drop".
export function readVerdicts(text: string, n: number): Verdict[] | null {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return null; }
  const list = raw && typeof raw === 'object' && Array.isArray((raw as { verdicts?: unknown }).verdicts) ? (raw as { verdicts: Record<string, unknown>[] }).verdicts : null;
  if (!list) return null;
  return Array.from({ length: n }, (_, i) => {
    const v = list.find(x => x && x.index === i);
    const keep = !!v && v.verdict === 'keep';
    return { index: i, verdict: keep ? 'keep' : 'drop', reason: v && typeof v.reason === 'string' ? v.reason.slice(0, CARDS_LIMITS.reasonChars) : 'No verdict given.' };
  });
}
