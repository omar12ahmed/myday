import { useState } from 'react';
import { Button } from '../../components/Button';
import { STEP_LABEL, type JourneyStep } from '../../data/study/mastery';
import { focusQuietly, visible } from './journeyDom';

// The lesson journey's step bar (specs/study-home-and-lessons.md §5): the steps this session shows, in order, each a
// 44 px target that jumps to its section. One row (it scrolls sideways if it must), staying in view as you scroll:
// at the top on a phone, under the header on wide screens, where the header stays put (88 px).
export function StepBar({ steps, current, onPick }: { steps: JourneyStep[]; current: JourneyStep; onPick: (s: JourneyStep) => void }) {
  return <nav className="ar-steps sticky top-[env(safe-area-inset-top)] lg:top-[88px] z-10 -mx-1 mb-4 px-1 py-2 bg-[var(--bg)]" aria-label="Lesson steps" data-ar-steps={steps.join(' ')}>
    <ol className="flex flex-nowrap gap-1.5 overflow-x-auto list-none p-0 m-0">{steps.map((s, i) => <li key={s} className="flex-none">
      <button type="button" data-action="ar-step" data-v={s} aria-current={s === current ? 'step' : undefined} onClick={() => onPick(s)}
        className={`inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-full border text-[15px] font-semibold cursor-pointer ${s === current ? 'bg-primary-container text-on-primary-container border-transparent' : 'bg-surface text-fg-2 border-outline'}`}>
        <span className="text-xs tabular-nums" aria-hidden="true">{i + 1}</span>{STEP_LABEL[s]}
      </button>
    </li>)}</ol>
  </nav>;
}

// "I got distracted — help me restart": back to the step you were on, with one small thing to do there. No penalty,
// nothing lost, no questions about why.
// Where each small thing is, first choice first (an empty answer box before one with an answer, then the question
// around it); only what's on screen counts, never a folded part.
const TINY: Record<JourneyStep, { label: string; targets: string[] }> = {
  warmup: { label: 'Answer one warm-up question', targets: ['#ar-step-warmup [data-ar-question]', '#ar-step-warmup h3'] },
  understand: { label: 'Read the example again', targets: ['#ar-step-understand [data-ar-example]', '#ar-step-understand h3'] },
  try: { label: 'Go back to your Try', targets: ['#ar-step-try [data-teaching-practice]', '#ar-step-try h3'] },
  check: { label: 'Answer one check', targets: ['#ar-step-check textarea[data-s="ar-answer"]', '#ar-step-check [data-ar-question]', '#ar-step-check h3'] },
  reflect: { label: 'Finish the session', targets: ['[data-action="ar-finish"]', '#ar-step-reflect h3'] },
};
function tinyTarget(step: JourneyStep): HTMLElement | null {
  for (const t of TINY[step].targets) {
    const els = [...document.querySelectorAll<HTMLElement>(t)].filter(visible);
    const empty = els.find(e => e instanceof HTMLTextAreaElement && !e.value);
    if (empty || els[0]) return empty ?? els[0];
  }
  return null;
}
export function RestartOffer({ step, onGo }: { step: JourneyStep; onGo: (s: JourneyStep) => void }) {
  const [open, setOpen] = useState(false);
  const go = () => {
    onGo(step);
    const el = tinyTarget(step);
    if (el) { el.scrollIntoView({ block: 'center' }); focusQuietly(el); }
    setOpen(false);
  };
  if (!open) return <Button inline variant="ghost" className="mb-3" data-action="ar-restart" onClick={() => setOpen(true)}>I got distracted — help me restart</Button>;
  return <div className="rounded-tile border border-outline bg-surface px-4 py-3 mb-4" data-ar-restart={step} role="group" aria-label="Help me restart">
    <p className="m-0 font-semibold">You were on {STEP_LABEL[step]}.</p>
    <p className="text-sm text-fg-2 mt-1">One small thing to get going again:</p>
    <div className="flex flex-wrap gap-2">
      <Button inline variant="primary" data-action="ar-restart-go" onClick={go}>{TINY[step].label}</Button>
      <Button inline variant="ghost" onClick={() => setOpen(false)}>Not now</Button>
    </div>
  </div>;
}
