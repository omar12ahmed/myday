import type { ReactNode } from 'react';

// The rounded panel that holds each part of a screen.
//   plain  – the usual card
//   nudge  – soft green, for a gentle message
//   notice – soft amber, for something worth knowing
type Tone = 'plain' | 'nudge' | 'notice';

const TONE: Record<Tone, string> = {
  plain: 'bg-surface border-outline',
  nudge: 'bg-primary-container text-on-primary-container border-transparent',
  notice: 'bg-warn-c text-on-warn-c border-transparent',
};

export function Card({ tone = 'plain', children }: { tone?: Tone; children: ReactNode }) {
  return <section className={`border rounded-card p-5 mb-4 shadow-card ${TONE[tone]}`}>{children}</section>;
}
