import { ChevronRight } from 'lucide-react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './Card';

// Small pieces shared by the section screens (Study, Workout): links, rows, chips, choices and labels.

// A link that looks like a quiet button (44 px tall), e.g. "‹ Study" or "Open the resource ↗".
export function TextLink({ className = '', ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={`btn-link inline-flex items-center gap-1 min-h-11 text-primary font-semibold no-underline hover:underline ${className}`} {...rest} />;
}
// A link inside a sentence.
export function InlineLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className="text-primary font-semibold underline-offset-2 hover:underline" {...props} />;
}
// A link to a web page outside MyDay (opens in a new tab).
export const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <TextLink href={href} target="_blank" rel="noopener">{children} <span aria-hidden="true">↗</span><span className="sr-only">(opens in a new tab)</span></TextLink>
);
export const BackLink = ({ to, label }: { to: string; label: string }) => <TextLink href={'#' + to}><span aria-hidden="true">‹</span> {label}</TextLink>;
// A button that reads like a link, for small extra actions (e.g. "Discard this session").
export function LinkButton({ className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`link-btn inline-flex items-center min-h-11 bg-transparent border-0 p-0 text-primary font-semibold cursor-pointer hover:underline ${className}`} {...rest} />;
}

// One of a set of choices (e.g. Understand / Partly / Not yet): pressed when chosen.
export function Choice({ on, children, className = '', ...rest }: { on: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button inline variant={on ? 'selected' : 'ghost'} aria-pressed={on} className={`flex-1 min-w-[7.5em] !min-h-12 ${on ? 'on' : ''} ${className}`} {...rest}>{children}</Button>;
}
export const Choices = ({ children, label }: { children: ReactNode; label?: string }) => <div className="st-seg flex flex-wrap gap-2 mb-4" role="group" aria-label={label}>{children}</div>;

// A row in a list: text on the left, actions on the right. Rows are divided by a line (not above the first).
export const Row = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`c-row flex justify-between items-center gap-2.5 py-2.5 border-t border-outline first-of-type:border-t-0 ${className}`}>{children}</div>
);
// The line you tap to open a fold-out part (<details className="group">), with an arrow that turns when open.
export const Summary = ({ children }: { children: ReactNode }) => (
  <summary className="min-h-11 flex items-center gap-1.5 text-[15px] text-fg-2 list-none [&::-webkit-details-marker]:hidden">
    <ChevronRight size={16} aria-hidden="true" className="flex-none transition-transform group-open:rotate-90" />{children}
  </summary>
);
export const Chip = ({ children }: { children: ReactNode }) => (
  <span className="chip inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-semibold bg-surface-2 text-fg-2 border border-outline align-middle">{children}</span>
);
export const Note = ({ children, className = '' }: { children: ReactNode; className?: string }) => <p className={`text-[15px] text-fg-2 ${className}`}>{children}</p>;

export function NotFound({ title, back, label }: { title: string; back: string; label: string }) {
  return <Card><h2>{title}</h2><TextLink href={'#' + back}>{label}</TextLink></Card>;
}

export const Eyebrow = ({ children }: { children: ReactNode }) => <span className="eyebrow block text-xs font-bold tracking-[.08em] uppercase text-primary mb-0.5">{children}</span>;
export const Meta = ({ children, className = '' }: { children: ReactNode; className?: string }) => <span className={`meta text-sm text-fg-3 ${className}`}>{children}</span>;
