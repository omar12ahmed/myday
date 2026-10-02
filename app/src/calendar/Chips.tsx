import { TriangleAlert } from 'lucide-react';
import { textOn } from '../data/rota';
import type { MyDayData } from '../data/types';

// A rota chip: your chosen colour for that status, with its text label on it (so nothing depends on
// colour alone) and black or white text, whichever reads better on that colour.
//   size "cell" – inside a calendar day; "mini" – the small marks (+OT, UA, appointment count)
export function RotaChip({ data, kind, label, size, className = '' }: { data: MyDayData; kind: string; label: string; size?: 'cell' | 'mini'; className?: string }) {
  const bg = (data.rota.colours as Record<string, string>)[kind] || '#888888';
  const shape = size === 'cell' ? 'cell text-[11px] sm:text-xs px-0.5 sm:px-1 py-px rounded-md text-center tracking-[-.01em]'
    : size === 'mini' ? 'mini text-[10px] px-1 rounded-[5px]' : 'text-xs px-2 py-0.5 rounded-full';
  return (
    <span className={`rchip inline-block max-w-full overflow-hidden text-ellipsis whitespace-nowrap align-middle font-bold shadow-[inset_0_0_0_1px_rgba(128,128,128,.5)] ${shape} ${className}`}
      style={{ background: bg, color: textOn(bg) }}>
      {label}
    </span>
  );
}

// "BH": a bank holiday (amber, with the text "BH" and the holiday's name for screen readers).
export const BankHolidayBadge = ({ title }: { title?: string }) => (
  <span className="cal-bh inline-block text-[10px] font-extrabold tracking-[.02em] text-on-warn-c bg-warn-c rounded-md px-1" title={title}>BH</span>
);

// "!": something overlaps on this date.
export const OverlapMark = () => (
  <span className="mark-warn inline-grid place-items-center size-4 rounded-full bg-warn-c text-on-warn-c text-[11px] font-extrabold" title="Overlapping entries">!</span>
);

// A full-width warning line, e.g. "Day shift (07:00–19:00) overlaps Dentist (10:00–11:00)".
export const WarnLine = ({ children }: { children: React.ReactNode }) => (
  <p className="warn flex gap-1.5 items-start m-0 mt-2 px-2.5 py-1.5 rounded-lg bg-warn-c text-on-warn-c text-sm">
    <TriangleAlert size={16} className="flex-none mt-0.5" aria-hidden="true" />
    <span>{children}</span>
  </p>
);
