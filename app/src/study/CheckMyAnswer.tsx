import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { checkAnswerRequest, type CheckAnswerSource } from '../ai/checkAnswer';
import { AI_MODE, askModel } from '../ai/request';
import { Button } from '../components/Button';
import { OUTCOME } from '../data/study/common';
import { readCheckAnswer, type CheckAnswerMark, type CheckAnswerReply } from '../../../supabase/functions/_shared/ai/check-answer-shape';

// Each phase after idle belongs to the answer it was asked about (`for`).
type Phase = { at: 'idle' } | { at: 'asking'; for: string } | { at: 'shown'; for: string; r: CheckAnswerReply; by: string; step: number } | { at: 'error'; for: string; message: string };
const IDLE: Phase = { at: 'idle' };
// The parts, in the order they're shown: a hint first, then each one only when you ask for it.
const NEXT = ['Show an example', 'Show the explanation', 'Try a follow-up question', 'Show its answer'];

// "Check my answer" (graduated help, specs/study-home-and-lessons.md §12), under a lesson check once you've written your
// own answer: one tap sends one request (built by ai/checkAnswer.ts from the lesson, loaded only now, and your answer). The reply comes in parts shown one at a time as you ask: a hint, an example,
// the explanation, then a follow-up question and its answer. It's labelled as AI-written, says what part of the lesson it
// drew on, and may suggest a mark, which you can use (onUseMark, where the lesson keeps marks) or ignore. Nothing is
// saved here, and it never sets a lesson's state.
export function CheckMyAnswer({ answer, getSource, onUseMark, aside, alsoCounts = false, render = t => t }: {
  answer: string;
  getSource: () => Promise<CheckAnswerSource | null>;
  onUseMark?: (m: CheckAnswerMark) => void;
  aside?: string;
  alsoCounts?: boolean; // the course says what else counts as right (Arabic), so that's sent too
  render?: (text: string) => ReactNode; // Arabic shows its words as the course does (Mixed)
}) {
  const [state, setPhase] = useState<Phase>(IDLE);
  // Help about an answer you've since changed is out of date: "Check my answer" again (a request still on its way for
  // the old answer is stopped, as when the page closes).
  const phase = state.at === 'idle' || state.for === answer ? state : IDLE;
  const request = useRef<AbortController | null>(null), root = useRef<HTMLDivElement>(null), part = useRef<HTMLDivElement>(null);
  // Where focus goes once the panel has changed (the button pressed is gone by then): the newest part, or the button.
  const focusTo = useRef<'part' | 'ask' | null>(null);
  useEffect(() => () => request.current?.abort(), [answer]);
  const step = phase.at === 'shown' ? phase.step : -1;
  useEffect(() => {
    const to = focusTo.current; focusTo.current = null;
    if (to === 'part') part.current?.focus();
    else if (to === 'ask') root.current?.querySelector<HTMLElement>('[data-action="ca-ask"]')?.focus();
  }, [phase]);
  if (AI_MODE === 'off' || !answer.trim()) return null;

  async function ask() {
    request.current?.abort();
    const ctrl = new AbortController(), asked = answer; request.current = ctrl;
    const fail = (message: string) => { focusTo.current = 'ask'; setPhase({ at: 'error', for: asked, message }); };
    setPhase({ at: 'asking', for: asked });
    try {
      const src = await getSource();
      if (ctrl.signal.aborted) return;
      if (!src) { fail('The lesson couldn’t be opened. Check your connection and try again.'); return; }
      const req = checkAnswerRequest(src, asked);
      if (!req.ok) { fail(req.why); return; }
      const reply = await askModel(req.ctx, ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (!reply.ok) { fail(reply.message); return; }
      const r = readCheckAnswer(reply.text, req.ctx);
      if (!r) { fail('The help that came back couldn’t be used — try again.'); return; }
      focusTo.current = 'part'; setPhase({ at: 'shown', for: asked, r, by: reply.model, step: 0 });
    } catch {
      if (!ctrl.signal.aborted) fail('Couldn’t get help just now — try again. Your answer is as you wrote it.');
    }
  }
  const next = () => { if (phase.at === 'shown') { focusTo.current = 'part'; setPhase({ ...phase, step: phase.step + 1 }); } };
  const close = () => { focusTo.current = 'ask'; setPhase({ at: 'idle' }); };

  return <div ref={root} data-s="check-answer" data-phase={phase.at} data-step={step}>
    {phase.at === 'idle' && <>
      <Button inline variant="ghost" className="mt-1" data-action="ca-ask" onClick={() => { void ask(); }}>Check my answer</Button>
      <p className="text-xs text-fg-3 mt-1 mb-0">Sends the lesson’s objectives and teaching, the skills it builds on, the question, its reference answer{alsoCounts ? ' (and what else counts)' : ''} and your answer — nothing else.</p>
    </>}
    {phase.at === 'asking' && <p role="status" className="text-[15px] text-fg-2 flex items-center gap-2 my-2.5"><span className="size-3 rounded-full bg-primary motion-safe:animate-pulse flex-none" aria-hidden="true" /> Reading your answer…</p>}
    {phase.at === 'shown' && <div className="rounded-tile border border-outline px-3.5 py-2.5 my-2.5" data-s="ca-shown">
      <span className="lbl text-sm text-fg-2">{AI_MODE === 'mock' ? 'Check my answer · practice helper (no AI)' : `Check my answer · AI-written by ${phase.by}, not checked by your course`}</span>
      {aside && <p className="text-sm text-fg-2 mt-1 mb-0">{aside}</p>}
      <Part label="Hint" text={render(phase.r.hint)} at={0} step={step} focus={part} s="ca-hint" />
      <Part label="An example" text={render(phase.r.example)} at={1} step={step} focus={part} s="ca-example" />
      <Part label="The explanation" text={render(phase.r.explanation)} at={2} step={step} focus={part} s="ca-explanation" />
      {step >= 2 && phase.r.suggestedMark && <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2" data-s="ca-mark" data-v={phase.r.suggestedMark}>
        <span className="text-[15px]">Suggested mark: <strong>{OUTCOME[phase.r.suggestedMark]}</strong> <span className="text-sm text-fg-2">(only a suggestion)</span></span>
        {onUseMark && <Button inline variant="tonal" data-action="ca-use-mark" onClick={() => onUseMark(phase.r.suggestedMark!)}>Use this mark</Button>}
      </div>}
      <Part label="A follow-up question" text={render(phase.r.followUp.question)} at={3} step={step} focus={part} s="ca-follow-up" />
      <Part label="Its answer" text={render(phase.r.followUp.answer)} at={4} step={step} focus={part} s="ca-follow-answer" />
      <p className="text-sm text-fg-3 mt-2 mb-2">Drew on {phase.r.drewOn.replace(/[.]$/, '')}.</p>
      <div className="flex flex-wrap gap-2">
        {step < NEXT.length && <Button inline variant="tonal" data-action="ca-next" onClick={next}>{NEXT[step]}</Button>}
        <Button inline variant="ghost" data-action="ca-close" onClick={close}>Close</Button>
      </div>
    </div>}
    {phase.at === 'error' && <div className="my-2.5">
      <p role="alert" className="text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2 m-0 mb-2">{phase.message}</p>
      <Button inline variant="ghost" data-action="ca-ask" onClick={() => { void ask(); }}>Try again</Button>
    </div>}
  </div>;
}

// One part, once it's been asked for; the newest one takes focus, so a screen reader reads it next.
function Part({ label, text, at, step, focus, s }: { label: string; text: ReactNode; at: number; step: number; focus: RefObject<HTMLDivElement | null>; s: string }) {
  if (step < at) return null;
  return <div ref={step === at ? focus : undefined} tabIndex={-1} className="mt-2 outline-none" data-s={s}>
    <span className="block text-sm font-semibold text-fg-2">{label}</span>
    <p className="m-0 whitespace-pre-wrap">{text}</p>
  </div>;
}
