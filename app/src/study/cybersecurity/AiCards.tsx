import { Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { addAiCards, cardsContext, readCardsReply, removeAiCards, type CheckedCards } from '../../ai/cards';
import { AI_MODE, askModel } from '../../ai/request';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { todayKey } from '../../data/dates';
import { getSnapshot, update } from '../../data/storage';
import type { MyDayData } from '../../data/types';
import { InlineLink, Note } from '../parts';
import type { Lesson } from './catalogue';

type Phase =
  | { at: 'start' }
  | { at: 'thinking' }
  | { at: 'review'; checked: CheckedCards; writer: string; checker: string }
  | { at: 'added'; ids: string[] }
  | { at: 'error'; message: string };

// More practice: up to ten revision cards on this lesson, written by one AI and checked by another (AI roles, step 3).
// Only cards the checker kept are shown; nothing goes in your revision until you add it, and Undo takes it out again.
export function AiCards({ data, lesson, coursePrompts }: { data: MyDayData; lesson: Lesson; coursePrompts: string[] }) {
  const [phase, setPhase] = useState<Phase>({ at: 'start' });
  const [picked, setPicked] = useState<boolean[]>([]);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  if (AI_MODE === 'off') return null;
  const mine = data.study.concepts.filter(c => c.origin?.subject === 'cybersecurity' && c.origin.lessonId === lesson.id).length;

  async function ask() {
    request.current?.abort();
    const ctrl = new AbortController(); request.current = ctrl;
    setPhase({ at: 'thinking' });
    const ctx = cardsContext(getSnapshot().data, lesson.id, coursePrompts);
    const reply = await askModel(ctx, ctrl.signal);
    if (ctrl.signal.aborted) return;
    if (!reply.ok) { setPhase({ at: 'error', message: reply.message }); return; }
    const checked = readCardsReply(reply.text, ctx);
    if (!checked) { setPhase({ at: 'error', message: "The cards that came back couldn't be used. Nothing was added to your revision — try again." }); return; }
    setPicked(checked.cards.map(() => true));
    setPhase({ at: 'review', checked, writer: reply.model, checker: reply.checker || 'a second AI' });
  }
  function cancel() { request.current?.abort(); setPhase({ at: 'start' }); }
  function add(p: Extract<Phase, { at: 'review' }>) {
    let ids: string[] = [];
    const chosen = p.checked.cards.filter((_, i) => picked[i]);
    const ok = update(d => { ids = addAiCards(d, chosen, { lessonId: lesson.id, lessonTitle: lesson.title, writer: p.writer, checker: p.checker }, todayKey()); if (!ids.length) return false; });
    if (!ok) { setPhase({ at: 'error', message: "Couldn't save just now — nothing was added. Please try again." }); return; }
    setPhase({ at: 'added', ids });
  }
  function undo(ids: string[]) {
    update(d => { if (!removeAiCards(d, ids)) return false; });
    setPhase({ at: 'start' });
  }

  return <Card id="cyAiCards" data-phase={phase.at}>
    <h3 className="flex items-center gap-2 mt-0"><Sparkles size={20} aria-hidden="true" className="text-primary" /> More practice</h3>

    {phase.at === 'start' && <>
      <p className="text-[15px]">{AI_MODE === 'mock'
        ? 'Practice mode: cards come from simple rules on this device, not AI. Nothing is sent anywhere.'
        : 'An AI writes up to 10 revision cards on this lesson’s key ideas, and a second AI checks each one. You see only the cards the checker kept, and choose which go in your revision.'}</p>
      {mine > 0 && <p className="text-sm text-fg-2">{mine} AI-written {mine === 1 ? 'card' : 'cards'} for this lesson {mine === 1 ? 'is' : 'are'} in your revision; new ones won’t repeat {mine === 1 ? 'it' : 'them'}.</p>}
      <Button data-action="cy-cards-ask" onClick={() => { void ask(); }}>Make practice cards</Button>
      {AI_MODE !== 'mock' && <Note className="mt-3 mb-0 text-sm">Sent: this lesson’s name and the questions you already have for it — not your answers, notebook or anything else.</Note>}
    </>}

    {phase.at === 'thinking' && <div role="status" aria-live="polite">
      <p className="text-[15px] text-fg-2 flex items-center gap-2"><span className="size-3 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden="true" /> Writing cards, then checking each one. This can take up to a minute and a half.</p>
      <Button variant="ghost" data-action="cy-cards-cancel" onClick={cancel}>Cancel</Button>
    </div>}

    {phase.at === 'error' && <>
      <p role="alert" className="text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2">{phase.message}</p>
      <div className="flex flex-wrap gap-2">
        <Button inline data-action="cy-cards-retry" onClick={() => { void ask(); }}>Try again</Button>
        <Button inline variant="ghost" data-action="cy-cards-cancel" onClick={cancel}>Close</Button>
      </div>
    </>}

    {phase.at === 'review' && (() => {
      const { checked } = phase, n = picked.filter(Boolean).length;
      const notes = [
        checked.checkerLeftOut && `The checker left out ${checked.checkerLeftOut} it wasn’t sure about.`,
        checked.repeats && `${checked.repeats} repeated ${checked.repeats === 1 ? 'a question' : 'questions'} you already have.`,
        checked.leftOut && `${checked.leftOut} ${checked.leftOut === 1 ? 'wasn’t' : 'weren’t'} a usable card.`,
      ].filter(Boolean).join(' ');
      return <>
        <p className="text-xs font-bold tracking-[.08em] uppercase text-fg-3 m-0 mb-2">Checked cards · nothing added yet</p>
        {checked.cards.length ? <>
          <p className="text-sm text-fg-2 mt-0">Written by {phase.writer}, checked by {phase.checker} — not by your course. If one looks wrong or unclear, untick it.</p>
          <ul className="list-none p-0 m-0 grid gap-2.5" id="cyAiCardList">
            {checked.cards.map((c, i) => <li key={i} className="bg-surface-2 rounded-tile p-3.5" data-s="cy-card">
              <label className="flex items-start gap-3 cursor-pointer min-h-11">
                <input type="checkbox" className="size-[22px] accent-primary flex-none mt-0.5" data-s="cy-card-pick" checked={!!picked[i]}
                  onChange={e => setPicked(s => s.map((x, j) => (j === i ? e.target.checked : x)))} />
                <span className="min-w-0">
                  <span className="block font-medium leading-snug">{c.prompt}</span>
                  {c.kind === 'choice' && c.choices
                    ? <ul className="list-none p-0 m-0 mt-1.5 grid gap-1 text-sm">{c.choices.map((o, j) => <li key={j} className={j === c.correct ? 'font-semibold' : 'text-fg-2'}>{j === c.correct ? '✓ ' : '· '}{o}{j === c.correct && <span className="sr-only"> (the right answer)</span>}</li>)}</ul>
                    : <span className="block text-sm mt-1.5"><strong>Answer:</strong> {c.answer}</span>}
                  <span className="block text-sm text-fg-2 mt-1">{c.explanation}</span>
                </span>
              </label>
            </li>)}
          </ul>
        </> : <p className="text-[15px] text-fg-2" id="cyAiCardsNone">No cards came through the check this time. Nothing was added.</p>}
        {notes && <p className="text-sm text-fg-2 mt-3 mb-0" id="cyAiCardsNotes">{notes}</p>}
        <div className="grid gap-2.5 mt-4">
          {checked.cards.length > 0 && <Button variant="primary" data-action="cy-cards-add" disabled={!n} onClick={() => add(phase)}>{n ? `Add ${n} to revision` : 'Tick the cards to add'}</Button>}
          <Button variant="ghost" data-action="cy-cards-cancel" onClick={cancel}>{checked.cards.length ? 'Not now' : 'Close'}</Button>
        </div>
      </>;
    })()}

    {phase.at === 'added' && <div role="status">
      <p className="text-[15px]">Added {phase.ids.length} {phase.ids.length === 1 ? 'card' : 'cards'} to your revision. {phase.ids.length === 1 ? 'It comes' : 'They come'} back tomorrow, like the lesson’s checks. You can change any of them on its page in <InlineLink href="#study/concepts">Concepts</InlineLink>.</p>
      <div className="flex flex-wrap gap-2">
        <Button inline variant="ghost" data-action="cy-cards-undo" onClick={() => undo(phase.ids)}>Undo</Button>
        <Button inline variant="ghost" data-action="cy-cards-more" onClick={() => setPhase({ at: 'start' })}>Done</Button>
      </div>
    </div>}
  </Card>;
}
