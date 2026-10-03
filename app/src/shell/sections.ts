import { BookOpen, CalendarDays, CircleCheck, Heart, Wallet, type LucideIcon } from 'lucide-react';

// The sections, in the same order as the current MyDay. `moved` says whether a section works in the new
// app (a section that hasn't moved is marked in the navigation).
export type SectionId = 'today' | 'calendar' | 'finance' | 'health' | 'study' | 'notes';
export const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; moved: boolean }[] = [
  { id: 'today', label: 'Today', icon: CircleCheck, moved: true },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, moved: true },
  { id: 'finance', label: 'Finance', icon: Wallet, moved: true }, // was Pay (#pay still opens it)
  { id: 'health', label: 'Health', icon: Heart, moved: true },
  { id: 'study', label: 'Study', icon: BookOpen, moved: true },
];

// Screens that aren't in the bar: Notes is reached from Today (the bar stays at five).
const OFF_BAR: SectionId[] = ['notes'];
// The section shown as current in the bar.
export const barSection = (id: SectionId): SectionId => (OFF_BAR.includes(id) ? 'today' : id);

export function sectionFromHash(hash: string): SectionId {
  let id = hash.replace('#', '').split('/')[0];
  if (id === 'pay') id = 'finance'; // Pay became Finance; old links still work
  return SECTIONS.some(s => s.id === id) || OFF_BAR.includes(id as SectionId) ? (id as SectionId) : 'today';
}
