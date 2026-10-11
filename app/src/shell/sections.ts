import { BookOpen, CalendarDays, CircleCheck, FolderKanban, Heart, Wallet, type LucideIcon } from 'lucide-react';

// All six sections are available. Legacy addresses are kept below for existing links.
export type SectionId = 'today' | 'calendar' | 'projects' | 'finance' | 'health' | 'study';
export const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: 'today', label: 'Today', icon: CircleCheck },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'health', label: 'Health', icon: Heart },
  { id: 'study', label: 'Study', icon: BookOpen },
];

// The section shown as current in the bar (every section is in it).
export const barSection = (id: SectionId): SectionId => id;

export function sectionFromHash(hash: string): SectionId {
  let id = hash.replace('#', '').split('/')[0];
  if (id === 'pay') id = 'finance';  // Pay became Finance; old links still work
  if (id === 'notes' || id === 'inbox') id = 'projects';  // older links (see legacyLinks.ts) still work
  return SECTIONS.some(s => s.id === id) ? (id as SectionId) : 'today';
}
