import { GraduationCap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { removeAiCards } from '../ai/cards';
import { addNoteCards, noteCardsContext, noteCheckContext, noteLines, readNoteCardsReply, readNoteCheck, type NoteProposedCard } from '../ai/noteCards';
import { aiReach } from '../ai/reach';
import { AI_MODE, askModel } from '../ai/request';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { InlineLink, Note as Hint } from '../components/parts';
import { todayKey } from '../data/dates';
import { getSnapshot, update } from '../data/storage';
import type { MyDayData, Note } from '../data/types';
import type { NoteFlag } from '../../../supabase/functions/_shared/ai/note-cards.ts';

type Checked = { text: string; title: string; lines: string[]; flags: NoteFlag[] };
type Phase =
  | { at: 'start' }
  | { at: 'checking' }
  | { at: 'flags'; c: Checked; use: number[] }                 // use: flagged lines you said are right
  | { at: 'writing'; c: Checked }
  | { at: 'review'; c: Checked; left: number; cards: NoteProposedCard[]; notes: string; writer: string; checker: string }
  | { at: 'added'; ids: string[] }
  | { at: 'error'; message: string };

// The AI server asks for a pause between one account's requests (AI_MIN_SECONDS_BETWEEN, 5 s by default). The cards
// request follows the check, often at once (nothing doubtful), so it waits until this long after the check began, and
// if the server still says "too soon", waits and tries once more (a refusal like that isn't counted).
const PACE_MS = 6000;
const pause = (ms: number, signal: AbortSignal) => new Promise<void>(done => { if (ms <= 0 || signal.aborted) return done(); const t = setTimeout(done, ms); signal.addEventListener('abort', () => { clearTimeout(t); done(); }, { once: true }); });

const CONCERN = { wrong: 'Looks wrong', unclear: 'Might be overstated or unclear', 'may-change': 'May change over time' } as const;
const PROBLEM = {
  empty: 'Write something in this note first.',
  'too-long': 'This note is longer than one check can take (about two pages, 60 lines). Split it into smaller notes to make cards from it.',
  'long-sentence': 'One sentence in this note is very long. Break it up a little to make cards from it.',
} as const;

// "Make revision cards" on a note (AI roles step 3, part C): the note is checked first, doubtful lines are left out
// unless you say they're right, then one AI writes cards from the rest and another checks them. Shown only when AI help
// with notes is on, and never for a private note (NoteEditor decides).
export function NoteCards({ data, note, flush }: { data: MyDayData; note: Note; flush: () => void }) {
  const [phase, setPhase] = useState<Phase>({ at: 'start' });
  const [picked, setPicked] = useState<boolean[]>([]);
  const request = useRef<AbortController | null>(null);
  const checkedAt = useRef(0); // when the check was asked for (see PACE_MS)
  useEffect(() => () => request.current?.abort(), []);
  const fromThisNote = data.study.concepts.filter(c => c.origin?.subject === 'note' && c.origin.noteId === note.id).length;
  const shape = noteLines(note);

  const fresh = () => { request.current?.abort(); const ctrl = new AbortController(); request.current = ctrl; return ctrl; };
  async function check() {
    flush();
    const data = getSnapshot().data, now = data.notes.items.find(n => n.id === note.id);
    const nl = now && noteLines(now);
    if (!now || !aiReach(data).note(now) || !nl || !('lines' in nl)) return; // made private meanwhile: nothing is sent
    const ctrl = fresh();
    setPhase({ at: 'checking' });
    checkedAt.current = Date.now();
    const reply = await askModel(noteCheckContext(now, nl.lines), ctrl.signal);
    if (ctrl.signal.aborted) return;
    if (!reply.ok) { setPhase({ at: 'error', message: reply.message }); return; }
    const flags = readNoteCheck(reply.text, nl.lines);
    if (!flags) { setPhase({ at: 'error', message: "The check that came back couldn't be used. Your note is as it was — try again." }); return; }
    const c = { text: now.text, title: now.title, lines: nl.lines, flags };
    if (flags.length) setPhase({ at: 'flags', c, use: [] });
    else void write(c, []); // nothing doubtful: straight on to the cards
  }
  async function write(c: Checked, use: number[]) {
    const data = getSnapshot().data, now = data.notes.items.find(n => n.id === note.id);
    if (!now || !aiReach(data).note(now)) return; // made private meanwhile: nothing is sent
    if (now.text !== c.text || now.title !== c.title) { setPhase({ at: 'error', message: 'Your note changed since it was checked. Check it again to make cards from it.' }); return; }
    const flagged = new Set(c.flags.map(f => f.line).filter(n => !use.includes(n)));
    const kept = c.lines.map((_, i) => i + 1).filter(n => !flagged.has(n));
    if (!kept.length) { setPhase({ at: 'error', message: 'Every line was left out, so there was nothing to make cards from. Your note is as it was.' }); return; }
    const { ctx } = noteCardsContext(getSnapshot().data, now, c.lines, kept);
    const ctrl = fresh();
    setPhase({ at: 'writing', c });
    if (AI_MODE !== 'mock') await pause(PACE_MS - (Date.now() - checkedAt.current), ctrl.signal); // (practice mode has no server, no pause)
    let reply = ctrl.signal.aborted ? null : await askModel(ctx, ctrl.signal);
    if (reply && !reply.ok && reply.reason === 'too-fast' && !ctrl.signal.aborted) { await pause(PACE_MS, ctrl.signal); reply = ctrl.signal.aborted ? null : await askModel(ctx, ctrl.signal); }
    if (!reply || ctrl.signal.aborted) return;
    if (!reply.ok) { setPhase({ at: 'error', message: reply.message }); return; }
    const read = readNoteCardsReply(reply.text, ctx, kept);
    if (!read) { setPhase({ at: 'error', message: "The cards that came back couldn't be used. Nothing was added to your revision — try again." }); return; }
    const notes = [
      read.checkerLeftOut && `The checker left out ${read.checkerLeftOut} it wasn’t sure about.`,
      read.repeats && `${read.repeats} repeated ${read.repeats === 1 ? 'a question' : 'questions'} you already have from this note.`,
      read.leftOut && `${read.leftOut} ${read.leftOut === 1 ? 'wasn’t' : 'weren’t'} a usable card.`,
    ].filter(Boolean).join(' ');
    setPicked(read.cards.map(() => true));
    setPhase({ at: 'review', c, left: flagged.size, cards: read.cards, notes, writer: reply.model, checker: reply.checker || 'a second AI' });
  }
  function add(p: Extract<Phase, { at: 'review' }>) {
    let ids: string[] = [];
    const chosen = p.cards.filter((_, i) => picked[i]);
    const ok = update(d => { ids = addNoteCards(d, chosen, { noteId: note.id, noteTitle: note.title, writer: p.writer, checker: p.checker }, todayKey()); if (!ids.length) return false; });
    if (!ok) { setPhase({ at: 'error', message: "Couldn't save just now — nothing was added. Please try again." }); return; }
    setPhase({ at: 'added', ids });
  }
  const close = () => { request.current?.abort(); setPhase({ at: 'start' }); };

  return <Card aria-labelledby="noteCardsH" id="noteCards" data-phase={phase.at}>
    <h3 id="noteCardsH" className="flex items-center gap-2 mt-0"><GraduationCap size={20} aria-hidden="true" className="text-primary" /> Revision cards from this note</h3>

    {phase.at === 'start' && <>
      <p className="text-[15px]">{AI_MODE === 'mock'
        ? 'Practice mode: the check and the cards come from simple rules on this device, not AI. Nothing is sent anywhere.'
        : 'First an AI checks your note and points out any line that looks doubtful, with why — those are left out unless you say they’re right. Then one AI writes cards from the rest and another checks each one. You choose which go in your revision.'}</p>
      {fromThisNote > 0 && <p className="text-sm text-fg-2">{fromThisNote} {fromThisNote === 1 ? 'card' : 'cards'} from this note {fromThisNote === 1 ? 'is' : 'are'} in your revision; new ones won’t repeat {fromThisNote === 1 ? 'it' : 'them'}.</p>}
      {'problem' in shape ? <p className="text-sm text-fg-2 m-0" data-s="note-cards-problem">{PROBLEM[shape.problem]}</p>
        : <Button data-action="note-cards-ask" onClick={() => { void check(); }}>Make revision cards</Button>}
      {AI_MODE !== 'mock' && <Hint className="mt-3 mb-0 text-sm">Sent, only when you tap: this note’s title and text, and the questions you already have from it. Your note isn’t changed.</Hint>}
    </>}

    {(phase.at === 'checking' || phase.at === 'writing') && <div role="status" aria-live="polite">
      <p className="text-[15px] text-fg-2 flex items-center gap-2"><span className="size-3 rounded-full bg-primary motion-safe:animate-pulse flex-none" aria-hidden="true" />
        {phase.at === 'checking' ? 'Checking your note…' : `${phase.c.flags.length ? '' : 'Nothing looked doubtful. '}Writing cards, then checking each one. This can take up to a minute and a half.`}</p>
      <Button variant="ghost" data-action="note-cards-cancel" onClick={close}>Cancel</Button>
    </div>}

    {phase.at === 'flags' && (() => {
      const { c, use } = phase, left = c.flags.filter(f => !use.includes(f.line)).length;
      return <>
        <p className="text-[15px] mt-0">The check found {c.flags.length === 1 ? 'one line' : `${c.flags.length} lines`} worth a second look. {c.flags.length === 1 ? 'It’s' : 'They’re'} left out of the cards unless you say {c.flags.length === 1 ? 'it’s' : 'they’re'} right.</p>
        <ul className="list-none p-0 m-0 grid gap-2.5" id="noteFlags">
          {c.flags.map(f => {
            const on = use.includes(f.line);
            return <li key={f.line} className="bg-surface-2 rounded-tile p-3.5" data-s="note-flag" data-line={f.line}>
              <p className="text-xs font-bold tracking-[.08em] uppercase text-fg-3 m-0">Line {f.line} · {CONCERN[f.concern]}</p>
              <p className={`m-0 mt-1 ${on ? '' : 'text-fg-2 line-through decoration-fg-3'}`}>“{c.lines[f.line - 1]}”</p>
              <p className="text-sm m-0 mt-1.5">{f.reason}</p>
              <Button inline variant={on ? 'selected' : 'ghost'} aria-pressed={on} className="mt-2" data-action="note-flag-use"
                onClick={() => setPhase({ ...phase, use: on ? use.filter(n => n !== f.line) : [...use, f.line] })}>{on ? 'Using it — it’s right' : 'It’s right, use it'}</Button>
            </li>;
          })}
        </ul>
        <p className="text-sm text-fg-2 mt-3 mb-0">An AI’s doubt, not a verdict: check with your course if you’re unsure. Your note isn’t changed — you can correct a line yourself and check again.</p>
        <div className="grid gap-2.5 mt-4">
          <Button variant="primary" data-action="note-cards-write" onClick={() => { void write(c, use); }}>Make cards from {left ? 'the other' : 'all'} {c.lines.length - left} {c.lines.length - left === 1 ? 'line' : 'lines'}</Button>
          <Button variant="ghost" data-action="note-cards-cancel" onClick={close}>Not now</Button>
        </div>
      </>;
    })()}

    {phase.at === 'review' && (() => {
      const n = picked.filter(Boolean).length;
      return <>
        <p className="text-xs font-bold tracking-[.08em] uppercase text-fg-3 m-0 mb-2">Checked cards · nothing added yet</p>
        {phase.cards.length ? <>
          <p className="text-sm text-fg-2 mt-0">Written by {phase.writer} from {phase.left ? `your note, leaving out ${phase.left === 1 ? 'one doubtful line' : `${phase.left} doubtful lines`}` : 'your note'}, and checked by {phase.checker}. If one looks wrong or unclear, untick it.</p>
          <ul className="list-none p-0 m-0 grid gap-2.5" id="noteCardList">
            {phase.cards.map((c, i) => <li key={i} className="bg-surface-2 rounded-tile p-3.5" data-s="note-card">
              <label className="flex items-start gap-3 cursor-pointer min-h-11">
                <input type="checkbox" className="size-[22px] accent-primary flex-none mt-0.5" data-s="note-card-pick" checked={!!picked[i]}
                  onChange={e => setPicked(s => s.map((x, j) => (j === i ? e.target.checked : x)))} />
                <span className="min-w-0">
                  <span className="block font-medium leading-snug">{c.prompt}</span>
                  {c.kind === 'choice' && c.choices
                    ? <ul className="list-none p-0 m-0 mt-1.5 grid gap-1 text-sm">{c.choices.map((o, j) => <li key={j} className={j === c.correct ? 'font-semibold' : 'text-fg-2'}>{j === c.correct ? '✓ ' : '· '}{o}{j === c.correct && <span className="sr-only"> (the right answer)</span>}</li>)}</ul>
                    : <span className="block text-sm mt-1.5"><strong>Answer:</strong> {c.answer}</span>}
                  <span className="block text-sm text-fg-2 mt-1">{c.explanation}</span>
                  <span className="block text-xs text-fg-3 mt-1">From line{c.lines.length > 1 ? 's' : ''} {c.lines.join(', ')} of your note</span>
                </span>
              </label>
            </li>)}
          </ul>
        </> : <p className="text-[15px] text-fg-2" id="noteCardsNone">No cards came through the check this time. Nothing was added.</p>}
        {phase.notes && <p className="text-sm text-fg-2 mt-3 mb-0" id="noteCardsNotes">{phase.notes}</p>}
        <div className="grid gap-2.5 mt-4">
          {phase.cards.length > 0 && <Button variant="primary" data-action="note-cards-add" disabled={!n} onClick={() => add(phase)}>{n ? `Add ${n} to revision` : 'Tick the cards to add'}</Button>}
          <Button variant="ghost" data-action="note-cards-cancel" onClick={close}>{phase.cards.length ? 'Not now' : 'Close'}</Button>
        </div>
      </>;
    })()}

    {phase.at === 'added' && <div role="status">
      <p className="text-[15px]">Added {phase.ids.length} {phase.ids.length === 1 ? 'card' : 'cards'} to your revision. {phase.ids.length === 1 ? 'It comes' : 'They come'} back tomorrow. You can change any of them on its page in <InlineLink href="#study/concepts">Concepts</InlineLink>.</p>
      <div className="flex flex-wrap gap-2">
        <Button inline variant="ghost" data-action="note-cards-undo" onClick={() => { update(d => { if (!removeAiCards(d, phase.ids)) return false; }); setPhase({ at: 'start' }); }}>Undo</Button>
        <Button inline variant="ghost" data-action="note-cards-done" onClick={() => setPhase({ at: 'start' })}>Done</Button>
      </div>
    </div>}

    {phase.at === 'error' && <>
      <p role="alert" className="text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2">{phase.message}</p>
      <div className="flex flex-wrap gap-2">
        <Button inline data-action="note-cards-retry" onClick={() => { void check(); }}>Check again</Button>
        <Button inline variant="ghost" data-action="note-cards-cancel" onClick={close}>Close</Button>
      </div>
    </>}
  </Card>;
}
