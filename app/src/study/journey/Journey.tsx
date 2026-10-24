import { useState } from 'react';
import { Button } from '../../components/Button';
import { STEP_LABEL, type JourneyStep } from '../../data/study/mastery';
import { focusQuietly, tinyTarget, type Tiny } from './dom';

// A lesson journey's step bar (specs/study-home-and-lessons.md §5), shared by Arabic ("ar") and Cybersecurity
// ("cy"): the steps this session shows, in order, each a 44 px target that jumps to its section. One row (it scrolls
// sideways if it must), staying in view as you scroll: at the top on a phone, under the header on wide screens,
// where the header stays put (88 px).
export function StepBar({ prefix, steps, current, onPick }: { prefix: string; steps: JourneyStep[]; current: JourneyStep; onPick: (s: JourneyStep) => void }) {
  return <nav className="ar-steps sticky top-[env(safe-area-inset-top)] lg:top-[88px] z-10 -mx-1 mb-4 px-1 py-2 bg-[var(--bg)]" aria-label="Lesson steps" {...{ [`data-${prefix}-steps`]: steps.join(' ') }}>
    <ol className="flex flex-nowrap gap-1.5 overflow-x-auto list-none p-0 m-0">{steps.map((s, i) => <li key={s} className="flex-none">
      <button type="button" data-action={`${prefix}-step`} data-v={s} aria-current={s === current ? 'step' : undefined} onClick={() => onPick(s)}
        className={`inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-full border text-[15px] font-semibold cursor-pointer ${s === current ? 'bg-primary-container text-on-primary-container border-transparent' : 'bg-surface text-fg-2 border-outline'}`}>
        <span className="text-xs tabular-nums" aria-hidden="true">{i + 1}</span>{STEP_LABEL[s]}
      </button>
    </li>)}</ol>
  </nav>;
}

// "I got distracted — help me restart": back to the step you were on, with one small thing to do there. No penalty,
// nothing lost, no questions about why.
export function RestartOffer({ prefix, tiny, step, onGo }: { prefix: string; tiny: Tiny; step: JourneyStep; onGo: (s: JourneyStep) => void }) {
  const [open, setOpen] = useState(false);
  const go = () => {
    onGo(step);
    const el = tinyTarget(tiny, step);
    if (el) { el.scrollIntoView({ block: 'center' }); focusQuietly(el); }
    setOpen(false);
  };
  if (!open) return <Button inline variant="ghost" className="mb-3" data-action={`${prefix}-restart`} onClick={() => setOpen(true)}>I got distracted — help me restart</Button>;
  return <div className="rounded-tile border border-outline bg-surface px-4 py-3 mb-4" {...{ [`data-${prefix}-restart`]: step }} role="group" aria-label="Help me restart">
    <p className="m-0 font-semibold">You were on {STEP_LABEL[step]}.</p>
    <p className="text-sm text-fg-2 mt-1">One small thing to get going again:</p>
    <div className="flex flex-wrap gap-2">
      <Button inline variant="primary" data-action={`${prefix}-restart-go`} onClick={go}>{tiny[step].label}</Button>
      <Button inline variant="ghost" onClick={() => setOpen(false)}>Not now</Button>
    </div>
  </div>;
}
