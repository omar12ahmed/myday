import type { ReactNode, RefObject } from 'react';
import type { Parts } from './reveal';

// The parts asked for so far (`step`: 0 = the hint … 4 = the follow-up's answer), each labelled; `afterExplanation`
// sits under the explanation once it's shown ("Check my answer"'s suggested mark). `prefix` names them for tests.
export function RevealParts({ r, step, focus, prefix, render = t => t, afterExplanation }: {
  r: Parts; step: number; focus: RefObject<HTMLDivElement | null>; prefix: string; render?: (text: string) => ReactNode; afterExplanation?: ReactNode;
}) {
  return <>
    <Part label="Hint" text={render(r.hint)} at={0} step={step} focus={focus} s={`${prefix}-hint`} />
    <Part label="An example" text={render(r.example)} at={1} step={step} focus={focus} s={`${prefix}-example`} />
    <Part label="The explanation" text={render(r.explanation)} at={2} step={step} focus={focus} s={`${prefix}-explanation`} />
    {step >= 2 && afterExplanation}
    <Part label="A follow-up question" text={render(r.followUp.question)} at={3} step={step} focus={focus} s={`${prefix}-follow-up`} />
    <Part label="Its answer" text={render(r.followUp.answer)} at={4} step={step} focus={focus} s={`${prefix}-follow-answer`} />
  </>;
}

// One part, once it's been asked for; the newest one takes focus, so a screen reader reads it next.
function Part({ label, text, at, step, focus, s }: { label: string; text: ReactNode; at: number; step: number; focus: RefObject<HTMLDivElement | null>; s: string }) {
  if (step < at) return null;
  return <div ref={step === at ? focus : undefined} tabIndex={-1} className="mt-2 outline-none" data-s={s}>
    <span className="block text-sm font-semibold text-fg-2">{label}</span>
    <p className="m-0 whitespace-pre-wrap">{text}</p>
  </div>;
}
