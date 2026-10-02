import type { ReactNode } from 'react';

// A short, one-paragraph message with an icon, e.g. "This is a preview".
// For anything longer, or with a heading, use a Card.
//   nudge  – soft green, for a gentle message
//   notice – soft amber, for something worth knowing
type Tone = 'nudge' | 'notice';

const TONE: Record<Tone, string> = {
  nudge: 'bg-primary-container text-on-primary-container',
  notice: 'bg-warn-c text-on-warn-c',
};

export function Banner({ tone = 'nudge', icon, children }: { tone?: Tone; icon: ReactNode; children: ReactNode }) {
  return (
    <div className={`flex gap-3 items-start rounded-tile px-4 py-3 mb-4 text-[15px] ${TONE[tone]}`}>
      <span aria-hidden="true" className="flex-none mt-0.5">{icon}</span>
      <p className="m-0">{children}</p>
    </div>
  );
}
