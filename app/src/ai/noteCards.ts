// Revision cards from one of your notes (AI roles step 3, part C). Two steps, each only on your tap:
//   1. the check: the note's lines go to the AI, which flags the doubtful ones with a reason. Flagged lines are left out
//      unless you say "It's right, use it". Your note is never changed.
//   2. the cards: only the lines you kept go to one AI, which writes cards from them; another AI checks each card. The
//      app checks every card again and adds only the ones you keep, as Study concepts that say they came from the note.
// Offered only when "AI help with notes" is on, and never for a private note. The server's side, shared with the
// evaluation: ../../../supabase/functions/_shared/ai/note-cards.ts.
import { CARDS_LIMITS } from '../../../supabase/functions/_shared/ai/cards-shape.ts';
import { LEFT_OUT, NOTE_LIMITS, cleanNoteCard, readFlags, type NoteCardsContext, type NoteCheckContext, type NoteFlag } from '../../../supabase/functions/_shared/ai/note-cards.ts';
import type { DateKey, MyDayData, Note } from '../data/types';
import { cardToConcept, dayOf, sameAnswer, sameQuestion, type CheckedCards, type ProposedCard } from './cards';

// The note as numbered lines: its non-blank lines, a long paragraph split into its sentences. Too long to check in one
// go, or a single sentence too long to number, and it says why instead.
export type NoteLines = { lines: string[] } | { problem: 'empty' | 'too-long' | 'long-sentence' };
export function noteLines(note: Pick<Note, 'title' | 'text'>): NoteLines {
  const lines: string[] = [];
  for (const raw of note.text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.length <= NOTE_LIMITS.lineChars) { lines.push(line); continue; }
    for (const s of line.match(/[^.!?…؟]+(?:[.!?…؟]+|$)/g) ?? [line]) {
      if (s.length > NOTE_LIMITS.lineChars) return { problem: 'long-sentence' };
      if (s.trim()) lines.push(s.trim());
    }
  }
  if (!lines.length) return { problem: 'empty' };
  const title = note.title.trim().slice(0, NOTE_LIMITS.titleChars);
  if (lines.length > NOTE_LIMITS.lines || title.length + lines.reduce((a, l) => a + l.length, 0) > NOTE_LIMITS.totalChars) return { problem: 'too-long' };
  return { lines };
}
const titleOf = (note: Pick<Note, 'title'>) => note.title.trim().slice(0, NOTE_LIMITS.titleChars);

// Step 1: the check.
export const noteCheckContext = (note: Pick<Note, 'title'>, lines: string[]): NoteCheckContext => ({ version: 1, action: 'note-check', note: { title: titleOf(note), lines } });
export const readNoteCheck = (text: string, lines: string[]): NoteFlag[] | null => readFlags(text, lines.length)?.flags ?? null;

// Step 2: the cards, from the lines you kept (line numbers as in the whole note, from 1). Every line keeps its number:
// one you left out is sent as "(left out)" instead of its words, so the writer can't use it and the cards' line numbers
// are the note's own.
export function noteCardsContext(d: MyDayData, note: Pick<Note, 'id' | 'title'>, lines: string[], kept: number[]): { ctx: NoteCardsContext; kept: number[] } {
  const existing: string[] = [];
  for (const c of [...d.study.concepts].reverse()) {
    if (c.origin?.subject !== 'note' || c.origin.noteId !== note.id || !c.prompt) continue;
    const q = c.prompt.trim().slice(0, CARDS_LIMITS.promptChars).trim();
    if (q && !existing.some(e => sameQuestion(e, q))) existing.push(q);
  }
  return { ctx: { version: 1, action: 'note-cards', note: { title: titleOf(note), lines: lines.map((l, i) => (kept.includes(i + 1) ? l : LEFT_OUT)) }, count: CARDS_LIMITS.cards, existing: existing.slice(0, NOTE_LIMITS.existing) }, kept };
}
export interface NoteProposedCard extends ProposedCard { lines: number[] } // the note's lines it came from
// The server's reply, checked again: each card's shape and the lines it names (only lines you kept), a multiple-choice
// answer that is the marked option, the checker's "keep", and not a repeat of a card you have from this note or of
// another in the reply.
export function readNoteCardsReply(text: string, ctx: NoteCardsContext, kept: number[]): (Omit<CheckedCards, 'cards'> & { cards: NoteProposedCard[] }) | null {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return null; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as { cards?: unknown; verdicts?: unknown };
  if (!Array.isArray(r.cards) || !Array.isArray(r.verdicts) || r.cards.length > CARDS_LIMITS.cards) return null;
  const verdicts = r.verdicts as { index?: unknown; verdict?: unknown; reason?: unknown }[];
  const out = { cards: [] as NoteProposedCard[], checkerLeftOut: 0, leftOut: 0, repeats: 0 };
  r.cards.forEach((x, i) => {
    const c = cleanNoteCard(x, ctx.note.lines.length);
    if (!c || (c.kind === 'choice' && !sameAnswer(c)) || c.from.some(n => !kept.includes(n))) { out.leftOut++; return; }
    const v = verdicts.find(y => y && y.index === i);
    if (!v || v.verdict !== 'keep') { out.checkerLeftOut++; return; }
    if ([...ctx.existing, ...out.cards.map(y => y.prompt)].some(q => sameQuestion(q, c.prompt))) { out.repeats++; return; }
    const { from, ...card } = c;
    out.cards.push({ ...card, reason: typeof v.reason === 'string' ? v.reason.slice(0, CARDS_LIMITS.reasonChars) : '', lines: from });
  });
  return out;
}

// Adds the cards you kept from a note. Returns their ids, for Undo (removeAiCards).
export function addNoteCards(d: MyDayData, cards: NoteProposedCard[], about: { noteId: string; noteTitle: string; writer: string; checker: string }, k: DateKey, random = Math.random): string[] {
  const name = about.noteTitle.trim() ? `your note “${about.noteTitle.trim().slice(0, 80)}”` : 'your note';
  return cards.map(card => {
    const c = cardToConcept(card, `AI-written from ${name} by ${about.writer}, checked by ${about.checker} · ${dayOf(k)}`,
      { by: 'ai', subject: 'note', noteId: about.noteId, writer: about.writer.slice(0, 60), checker: about.checker.slice(0, 60), edited: false }, k, random);
    d.study.concepts.push(c);
    return c.id;
  });
}
