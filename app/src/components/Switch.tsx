import type { ReactNode } from 'react';

// A small on/off switch with its label always shown (like Focus mode's): one tap flips it, and screen readers hear
// "switch, on / off". At least 44 px tall.
export function Switch({ on, onChange, icon, children, className = '', ...rest }: {
  on: boolean; onChange: (on: boolean) => void; icon?: ReactNode; children: ReactNode; className?: string; 'data-action'?: string;
}) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} {...rest}
      className={`inline-flex items-center gap-2 min-h-11 rounded-full pl-3 pr-1.5 border cursor-pointer text-[14px] font-semibold transition-colors ${on ? 'bg-primary-container text-on-primary-container border-transparent' : 'bg-surface-2 text-fg-2 border-outline'} ${className}`}>
      {icon}
      <span>{children}</span>
      <span aria-hidden="true" className={`relative w-10 h-6 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-track'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-surface shadow-raised transition-[left] ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
