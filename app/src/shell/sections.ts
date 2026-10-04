import { BookOpen, CalendarDays, CircleCheck, Heart, Inbox, Wallet, type LucideIcon } from 'lucide-react';

// The sections, in the same order as the current MyDay. `moved` says whether a section works in the new
// app (a section that hasn't moved is marked in the navigation).
export type SectionId = 'today' | 'calendar' | 'inbox' | 'finance' | 'health' | 'study';
export const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; moved: boolean }[] = [
  { id: 'today', label: 'Today', icon: CircleCheck, moved: true },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, moved: true },
  { id: 'inbox', label: 'Inbox', icon: Inbox, moved: true },         // Notes (Tasks and Ideas to follow); new in the new app
  { id: 'finance', label: 'Finance', icon: Wallet, moved: true }, // was Pay (#pay still opens it)
  { id: 'health', label: 'Health', icon: Heart, moved: true },
  { id: 'study', label: 'Study', icon: BookOpen, moved: true },
];

// The section shown as current in the bar (every section is in it).
export const barSection = (id: SectionId): SectionId => id;

export function sectionFromHash(hash: string): SectionId {
  let id = hash.replace('#', '').split('/')[0];
  if (id === 'pay') id = 'finance';  // Pay became Finance; old links still work
  if (id === 'notes') id = 'inbox';  // Notes moved into the Inbox; old links still work
  return SECTIONS.some(s => s.id === id) ? (id as SectionId) : 'today';
}
