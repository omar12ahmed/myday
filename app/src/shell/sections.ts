import { BookOpen, CalendarDays, CircleCheck, Heart, PoundSterling, type LucideIcon } from 'lucide-react';

// The sections, in the same order as the current MyDay. `moved` says whether a section works in the
// new app yet; the others are marked, and open a page that says so (see NotMovedYet).
export type SectionId = 'today' | 'calendar' | 'pay' | 'health' | 'study';
export const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; moved: boolean }[] = [
  { id: 'today', label: 'Today', icon: CircleCheck, moved: true },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, moved: true },
  { id: 'pay', label: 'Pay', icon: PoundSterling, moved: true },
  { id: 'health', label: 'Health', icon: Heart, moved: false },
  { id: 'study', label: 'Study', icon: BookOpen, moved: true },
];

export function sectionFromHash(hash: string): SectionId {
  const id = hash.replace('#', '').split('/')[0];
  return SECTIONS.some(s => s.id === id) ? (id as SectionId) : 'today';
}
