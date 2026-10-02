import type { Energy } from '../data/types';

// Five small bars showing the day's energy level (1–5), like a volume control.
// Only decoration: the sentence next to it says the same thing in words.

// Written out in full so Tailwind can find every class name.
const HEIGHTS = ['h-[6px]', 'h-[9px]', 'h-[12px]', 'h-[15px]', 'h-[18px]'];

export function EnergyMeter({ level }: { level: Energy }) {
  return (
    <span aria-hidden="true" className="flex-none inline-flex items-end gap-[3px] h-[18px] mt-[2px]">
      {HEIGHTS.map((h, i) => (
        <span key={h} className={`w-1.5 rounded-full ${h} ${i < level ? 'bg-primary' : 'bg-track'}`} />
      ))}
    </span>
  );
}
