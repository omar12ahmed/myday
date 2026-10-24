import { useState } from 'react';
import { Button } from '../../components/Button';
import { STEP_LABEL, type JourneyStep } from '../../data/study/mastery';

// The lesson journey's step bar (specs/study-home-and-lessons.md §5): the steps this session shows, in order, each a
// 44 px target that jumps to its section. It stays in view as you scroll: at the top on a phone, under the header on
// wide screens, where the header stays put (88 px).
export function StepBar({ steps, current, onPick }: { steps: JourneyStep[]; current: JourneyStep; onPick: (s: JourneyStep) => void }) {
  return <nav className="ar-steps sticky top-0 lg:top-[88px] z-10 -mx-1 mb-4 px-1 py-2 bg-[var(--bg)]" aria-label="Lesson steps" data-ar-steps={steps.join(' ')}>
    <ol className="flex flex-wrap gap-1.5 list-none p-0 m-0">{steps.map((s, i) => <li key={s}>
      <button type="button" data-action="ar-step" data-v={s} aria-current={s === current ? 'step' : undefined} onClick={() => onPick(s)}
        className={`inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-full border text-[15px] font-semibold cursor-pointer ${s === current ? 'bg-primary-container text-on-primary-container border-transparent' : 'bg-surface text-fg-2 border-outline'}`}>
        <span className="text-xs tabular-nums opacity-70" aria-hidden="true">{i + 1}</span>{STEP_LABEL[s]}
      </button>
    </li>)}</ol>
  </nav>;
}

// "I got distracted — help me restart": back to the step you were on, with one small thing to do there. No penalty,
// nothing lost, no questions about why.
// Where each small thing is, first choice first (an answer box to type in before the question around it).
const TINY: Record<JourneyStep, { label: string; targets: string[] }> = {
  warmup: { label: 'Answer one warm-up question', targets: ['#ar-step-warmup [data-ar-question]', '#ar-step-warmup'] },
  understand: { label: 'Read the example again', targets: ['#ar-step-understand [data-ar-example]', '#ar-step-understand'] },
  try: { label: 'Finish the last line of your Try', targets: ['#ar-step-try [data-teaching-practice]', '#ar-step-try'] },
  check: { label: 'Answer one check', targets: ['#ar-step-check textarea[data-s="ar-answer"]', '#ar-step-check [data-ar-question]', '#ar-step-check'] },
  reflect: { label: 'Finish the session', targets: ['[data-action="ar-finish"]', '#ar-step-reflect'] },
};
export function RestartOffer({ step, onGo }: { step: JourneyStep; onGo: (s: JourneyStep) => void }) {
  const [open, setOpen] = useState(false);
  const go = () => {
    onGo(step);
    const el = TINY[step].targets.map(t => document.querySelector<HTMLElement>(t)).find(Boolean);
    if (el) { el.scrollIntoView({ block: 'center' }); if (el.matches('textarea, button, input')) el.focus({ preventScroll: true }); }
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
