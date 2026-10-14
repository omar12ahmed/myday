// More practice on a Cybersecurity lesson: up to ten revision cards an AI writes and a second AI checks (the server
// does both, see supabase/functions/_shared/ai/cards.ts). The app checks every card again, shows only the ones the
// checker kept, and adds only the ones you keep — as Study concepts that remember where they came from (`origin`)
// and say it in words (`source`), so a version that doesn't know `origin` still shows it.
import { CARDS_LIMITS, cleanDraftCard, type CardsContext, type DraftCard } from '../../../supabase/functions/_shared/ai/cards-shape.ts';
import { shift } from '../data/dates';
import { newConcept } from '../data/study/common';
import type { Concept, ConceptOrigin, DateKey, MyDayData } from '../data/types';

export interface ProposedCard extends DraftCard { reason: string } // reason: the checker's, for keeping it
export interface CheckedCards { cards: ProposedCard[]; checkerLeftOut: number; leftOut: number; repeats: number }

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// The words that say what a question is about (not how it's asked).
const ASKING = new Set(['the', 'and', 'for', 'what', 'which', 'why', 'how', 'when', 'where', 'who', 'does', 'did', 'can', 'could', 'should', 'would', 'are', 'was', 'were', 'has', 'have', 'its', 'this', 'that', 'these', 'those', 'with', 'from', 'into', 'your', 'you', 'use', 'used', 'using', 'one', 'please', 'explain', 'describe']);
const aboutWords = (s: string) => new Set(squash(s).split(' ').filter(w => w.length >= 3 && !ASKING.has(w)));
// Asks the same thing: the same words, or everything one asks about is in the other ("…for a lab VM?" and "…for a lab
// VM, please?"). Questions that differ in what they ask about ("Which port does HTTPS use?" and "…SSH use?") don't.
export function sameQuestion(a: string, b: string) {
  if (squash(a) === squash(b)) return true;
  const x = aboutWords(a), y = aboutWords(b);
  const [small, big] = x.size <= y.size ? [x, y] : [y, x];
  return small.size >= 3 && [...small].every(w => big.has(w));
}

// The cards you already have for this lesson: the course's own check questions and the AI cards you kept, sent so the
// writer doesn't repeat them (newest first if there are more than the server takes).
export function cardsContext(d: MyDayData, lessonId: string, coursePrompts: string[]): CardsContext {
  const mine = d.study.concepts.filter(c => c.origin?.subject === 'cybersecurity' && c.origin.lessonId === lessonId && c.prompt).map(c => c.prompt).reverse();
  const existing: string[] = [];
  for (const q of [...coursePrompts, ...mine]) {
    const t = q.trim().slice(0, CARDS_LIMITS.promptChars).trim();
    if (t && !existing.some(e => squash(e) === squash(t))) existing.push(t);
  }
  return { version: 1, action: 'cards', curriculumVersion: '1.0.0', lessonId, count: CARDS_LIMITS.cards, existing: existing.slice(0, CARDS_LIMITS.existing) };
}

// The server's reply, checked again: each card's shape (as the server does), a multiple-choice card whose answer is
// the option it marks, the checker's "keep", and not a repeat of a card you have or of another in the reply.
export function readCardsReply(text: string, ctx: CardsContext): CheckedCards | null {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return null; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as { lessonId?: unknown; cards?: unknown; verdicts?: unknown };
  if (r.lessonId !== ctx.lessonId || !Array.isArray(r.cards) || !Array.isArray(r.verdicts) || r.cards.length > CARDS_LIMITS.cards) return null;
  const verdicts = r.verdicts as { index?: unknown; verdict?: unknown; reason?: unknown }[];
  const out: CheckedCards = { cards: [], checkerLeftOut: 0, leftOut: 0, repeats: 0 };
  r.cards.forEach((x, i) => {
    const c = cleanDraftCard(x);
    if (!c || (c.kind === 'choice' && !sameAnswer(c))) { out.leftOut++; return; }
    const v = verdicts.find(y => y && y.index === i);
    if (!v || v.verdict !== 'keep') { out.checkerLeftOut++; return; }
    if ([...ctx.existing, ...out.cards.map(y => y.prompt)].some(q => sameQuestion(q, c.prompt))) { out.repeats++; return; }
    out.cards.push({ ...c, reason: typeof v.reason === 'string' ? v.reason.slice(0, CARDS_LIMITS.reasonChars) : '' });
  });
  return out;
}
// The answer a multiple-choice card gives is the option it marks (written out, or as part of a sentence).
export function sameAnswer(c: DraftCard) {
  const marked = squash(c.choices![c.correct!]), answer = squash(c.answer);
  return !!marked && (answer === marked || answer.includes(marked));
}

// e.g. "14 Oct 2026" (saved words, so the same on every device whatever its language).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const dayOf = (k: DateKey) => `${Number(k.slice(8, 10))} ${MONTHS[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`;

// One kept card as a concept, due tomorrow (you've just read its answer), with the options in a fresh order (models
// tend to put the right one first). Shared by a lesson's cards and cards from a note.
export function cardToConcept(card: DraftCard, source: string, origin: ConceptOrigin, k: DateKey, random = Math.random): Concept {
  const c = newConcept(card.prompt.length > 120 ? card.prompt.slice(0, 119).trimEnd() + '…' : card.prompt, null);
  c.kind = card.kind;
  c.prompt = card.prompt;
  c.explanation = card.explanation;
  if (card.kind === 'choice' && card.choices && card.correct !== undefined) {
    const order = card.choices.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    c.choices = order.map(i => card.choices![i]);
    c.correct = order.indexOf(card.correct);
    c.answer = card.choices[card.correct];
  } else c.answer = card.answer;
  c.source = source.slice(0, 400);
  c.origin = origin;
  c.review.due = shift(k, 1);
  return c;
}
// Adds the cards you kept from a lesson. Returns their ids, for Undo.
export function addAiCards(d: MyDayData, cards: DraftCard[], about: { lessonId: string; lessonTitle: string; writer: string; checker: string }, k: DateKey, random = Math.random): string[] {
  return cards.map(card => {
    const c = cardToConcept(card, `AI-written for the Cybersecurity lesson “${about.lessonTitle}” by ${about.writer}, checked by ${about.checker} · ${dayOf(k)}`,
      { by: 'ai', subject: 'cybersecurity', lessonId: about.lessonId, writer: about.writer.slice(0, 60), checker: about.checker.slice(0, 60), edited: false }, k, random);
    d.study.concepts.push(c);
    return c.id;
  });
}
// Undo: takes those cards out again (only AI cards, and only these). Any answers already given stay in your history.
export function removeAiCards(d: MyDayData, ids: string[]): boolean {
  const before = d.study.concepts.length;
  d.study.concepts = d.study.concepts.filter(c => !(c.origin && ids.includes(c.id)));
  return d.study.concepts.length !== before;
}
