import type { Category } from '../data/types';

// The small coloured label on a task, e.g. LEARNING.
export type ChipKind = Category | 'rest';

// Written out in full so Tailwind can find every class name.
const COLOURS: Record<ChipKind, string> = {
  learning: 'bg-learning-c text-learning',
  admin: 'bg-admin-c text-admin',
  health: 'bg-health-c text-health',
  rest: 'bg-rest-c text-rest',
};

const LABEL: Record<ChipKind, string> = { learning: 'Learning', admin: 'Admin', health: 'Health', rest: 'Rest' };

export function CategoryChip({ kind }: { kind: ChipKind }) {
  return (
    <span className={`inline-flex items-center text-xs font-bold tracking-[.04em] uppercase px-[9px] py-0.5 rounded-full ${COLOURS[kind]}`}>
      {LABEL[kind]}
    </span>
  );
}
