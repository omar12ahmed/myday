// Optional sections on a project's Overview (specs/projects-sections.md). The owner's decisions (25 Oct 2026): Notes,
// Recently, Learning, Resources and Files are optional. One with nothing in it folds into a short "Add to this
// project" row by itself, and any of them can be hidden on a project (`hiddenSections`, saved and synced with it).
// Show and hide only: every project keeps the shared order. Always shown: where you left off, the next step, Worth a
// look, At a glance, About it, Tasks, Coming up and the status, so a date that's still ahead is never hidden.
import { filesOf, recentlyDeleted } from './files';
import { projectNotes, recently } from './projects';
import type { MyDayData, Project } from './types';
import { mightBelong } from './understand';

export type Section = 'notes' | 'recently' | 'learning' | 'resources' | 'files';
// In the Overview's order; `add` is how the "Add to this project" row offers it (Recently has nothing to add).
export const SECTIONS: { id: Section; label: string; add: string | null }[] = [
  { id: 'notes', label: 'Notes', add: 'a note' },
  { id: 'recently', label: 'Recently', add: null },
  { id: 'learning', label: 'Learning', add: 'something to learn' },
  { id: 'resources', label: 'Resources', add: 'a link' },
  { id: 'files', label: 'Files', add: 'a file' },
];
export const isHidden = (p: Project, id: Section) => !!p.hiddenSections?.includes(id);

// What a section holds: its notes, its recent changes, the learning and web links kept with it, its files (Recently
// deleted ones too, which still wait there).
export function sectionContent(data: MyDayData, p: Project, id: Section): number {
  const owner = { kind: 'project' as const, id: p.id };
  switch (id) {
    case 'notes': return projectNotes(data, p).length;
    case 'recently': return recently(data, p).length;
    case 'learning': return p.studyLinks?.length ?? 0;
    case 'resources': return p.resources?.length ?? 0;
    case 'files': return filesOf(data, owner).length + recentlyDeleted(data, owner).length;
  }
}

// A hidden section that holds something, as "Hidden here" names it: "Files (3)", or "Files (2 recently deleted)" when
// all its files are waiting there (they go for good after 30 days, so they're named too).
export interface HiddenWith { id: Section; label: string; count: number; deleted: number }
export const hiddenWords = (h: HiddenWith) => `${h.label} (${h.count || `${h.deleted} recently deleted`})`;

// The Overview's optional sections: which show, which fold into the "Add to this project" row (empty, and there's
// something to add), and which hidden ones hold something ("Hidden here", so nothing is lost). A hidden Recently isn't
// named: it's a view of what changed, with nothing of its own to lose. `opened`: sections you opened on this visit (from
// the row, or a search result in one), shown whatever else applies.
export function overviewSections(data: MyDayData, p: Project, opened: ReadonlySet<Section> = new Set()) {
  const show = new Set<Section>(), fold: Section[] = [], hiddenWith: HiddenWith[] = [];
  for (const s of SECTIONS) {
    if (opened.has(s.id)) { show.add(s.id); continue; }
    const n = sectionContent(data, p, s.id);
    if (isHidden(p, s.id)) {
      const deleted = s.id === 'files' ? recentlyDeleted(data, { kind: 'project', id: p.id }).length : 0;
      if (n && s.id !== 'recently') hiddenWith.push({ id: s.id, label: s.label, count: n - deleted, deleted });
      continue;
    }
    // (Notes that might belong here keep the Notes card in view, so they can be added.)
    if (n || (s.id === 'notes' && mightBelong(data, p).length)) show.add(s.id);
    else if (s.add) fold.push(s.id);
  }
  return { show, fold, hiddenWith };
}

// Opening a project from elsewhere at something inside an optional card that may be folded or hidden (a search
// result, say): call openOnArrival just before going there, and that project's next Overview shows the card on that
// visit (ProjectView reads `arriving` once and then calls `arrived`). Kept in memory only.
const arrival = new Map<string, Section[]>();
export function openOnArrival(projectId: string, s: Section) { arrival.set(projectId, [...(arrival.get(projectId) ?? []), s]); }
export const arriving = (projectId: string): Section[] => arrival.get(projectId) ?? [];
export const arrived = (projectId: string) => { arrival.delete(projectId); };

// Shown or hidden on this project's Overview (About it → Edit). A choice of what to show, not work on the project, so
// its "updated" time (and its place in Projects) stays as it was. Returns false when nothing changed.
export function setHidden(d: MyDayData, projectId: string, id: Section, hidden: boolean): boolean {
  const p = d.projects.items.find(x => x.id === projectId);
  if (!p || !SECTIONS.some(s => s.id === id) || isHidden(p, id) === hidden) return false;
  p.hiddenSections = hidden ? [...(p.hiddenSections ?? []), id] : (p.hiddenSections ?? []).filter(x => x !== id);
  if (!p.hiddenSections.length) delete p.hiddenSections;
  return true;
}
