import type { HTMLAttributes, ReactNode } from 'react';

// The rounded panel that holds each part of a screen.
//   plain  – the usual card
//   nudge  – soft green, for a gentle message
//   notice – soft amber, for something worth knowing
//   accent – the usual card with a green outline, for something waiting on you (e.g. a proposal)
type Tone = 'plain' | 'nudge' | 'notice' | 'accent';

const TONE: Record<Tone, string> = {
  plain: 'bg-surface border-outline',
  nudge: 'bg-primary-container text-on-primary-container border-transparent',
  notice: 'bg-warn-c text-on-warn-c border-transparent',
  accent: 'bg-surface border-primary-outline',
};

interface CardProps extends HTMLAttributes<HTMLElement> {
  tone?: Tone;
  children: ReactNode;
}

// className is for spacing or layout around the card; its look belongs in the styles above.
export function Card({ tone = 'plain', className = '', children, ...rest }: CardProps) {
  return <section className={`card border rounded-card p-5 mb-4 shadow-card ${TONE[tone]} ${className}`} {...rest}>{children}</section>;
}
