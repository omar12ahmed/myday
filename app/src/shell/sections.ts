import { BookOpen, CalendarDays, CircleCheck, Heart, PoundSterling, type LucideIcon } from 'lucide-react';

// The sections, in the same order as the current MyDay. `moved` says whether a section works in the
// new app; `partly` names the part of a moved section that hasn't moved yet (it's marked, and its page
// says so and links to the current MyDay).
export type SectionId = 'today' | 'calendar' | 'pay' | 'health' | 'study';
export const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; moved: boolean; partly?: string }[] = [
  { id: 'today', label: 'Today', icon: CircleCheck, moved: true },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, moved: true },
  { id: 'pay', label: 'Pay', icon: PoundSterling, moved: true },
  { id: 'health', label: 'Health', icon: Heart, moved: true, partly: 'Food not in the new app yet' },
  { id: 'study', label: 'Study', icon: BookOpen, moved: true },
];

export function sectionFromHash(hash: string): SectionId {
  const id = hash.replace('#', '').split('/')[0];
  return SECTIONS.some(s => s.id === id) ? (id as SectionId) : 'today';
}
