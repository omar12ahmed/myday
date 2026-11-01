// The kinds of project (specs/projects-vision.md §6: "a small typed capability definition … when the first new tool or
// template is approved"; specs/projects-software.md §4): each kind's tabs and what changing to or from it says. The tab
// list, the tab routes, the kind switcher and its toast read this instead of repeating the conditions. Other places
// (Overview cards, the dashboard, Explore, AI) keep their own checks for now.
import { isCase, knownTemplate, type TemplateChoice } from './businessModel';
import { hasResearch } from './research';
import type { MyDayData, Project } from './types';

export type ProjectTab = 'overview' | 'model' | 'money' | 'milestones' | 'decisions' | 'timeline' | 'evidence' | 'issues' | 'research' | 'videos' | 'requirements' | 'bugs' | 'compare';
export const TAB_LABEL: Record<Exclude<ProjectTab, 'compare'>, string> = {
  overview: 'Overview', model: 'Model', money: 'Money', milestones: 'Milestones', decisions: 'Decisions', timeline: 'Timeline', evidence: 'Evidence',
  issues: 'Issues', research: 'Research', videos: 'Videos', requirements: 'Requirements', bugs: 'Bugs',
};
// Every tab with its own address (#projects/p/<id>/<tab>); the Overview is the project's own address.
export const TAB_ROUTES: ProjectTab[] = ['model', 'money', 'milestones', 'decisions', 'timeline', 'evidence', 'issues', 'research', 'videos', 'requirements', 'bugs', 'compare'];

interface KindDef {
  tabs: ProjectTab[];   // after the Overview (Research comes last on any kind while it's on)
  now: string;          // said on changing to it
  // What it keeps, out of sight, on changing away (only when there's something to keep).
  keeps?: (data: MyDayData, p: Project) => string | null;
}
const KINDS: Record<TemplateChoice, KindDef> = {
  general: { tabs: ['milestones', 'decisions'], now: 'Now a general project.' },
  business: { tabs: ['model', 'money', 'milestones', 'decisions'], now: 'Now a business idea — its one page is on the Model tab.', keeps: (_, p) => (p.model ? 'its one page' : null) },
  // A case's own tabs (only four fit on a phone): its milestones and decisions open from their At a glance rows.
  case: { tabs: ['timeline', 'evidence', 'issues'], now: 'Now a case — its timeline, evidence and issues each have a tab.', keeps: (_, p) => (p.case ? 'its timeline, evidence and issues' : null) },
  research: { tabs: ['milestones', 'decisions'], now: 'Now a research project — its questions, findings and sources are on the Research tab.' },
  content: { tabs: ['milestones', 'decisions', 'videos'], now: 'Now a Content project — its ideas and videos are on the Videos tab.',
    keeps: (d, p) => (d.content.items.some(x => x.projectId === p.id) ? 'its ideas and videos' : null) },
  software: { tabs: ['requirements', 'bugs', 'milestones', 'decisions'], now: 'Now a Software project — its requirements and bugs each have a tab, and a milestone can be a release.',
    keeps: (d, p) => (d.software.items.some(x => x.projectId === p.id) ? 'its requirements, bugs and release checklists' : null) },
};
// A project's kind as this version knows it (one from a newer MyDay shows as general, its tabs and all).
export const kindOf = (p: Project): TemplateChoice => (knownTemplate(p) ? (p.template as TemplateChoice | undefined) ?? 'general' : 'general');
export const tabsOf = (p: Project): ProjectTab[] => ['overview', ...KINDS[kindOf(p)].tabs, ...(hasResearch(p) ? ['research' as const] : [])];
// The tab an address asks for, if this project has it; otherwise the Overview. Comparing the options belongs to
// Decisions, and a case (no Decisions tab) shows it with its Overview marked.
export function tabFor(p: Project, asked: ProjectTab): ProjectTab {
  if (asked === 'compare') return 'compare';
  return tabsOf(p).includes(asked) || (asked === 'milestones' || asked === 'decisions') && isCase(p) ? asked : 'overview';
}
// What changing kind says: the new kind, then what the old one keeps, out of sight.
export function kindChangeWords(data: MyDayData, p: Project, to: TemplateChoice): string {
  const now = KINDS[to].now, kept = KINDS[kindOf(p)].keeps?.(data, p);
  return kept ? `${now} ${kept.charAt(0).toUpperCase() + kept.slice(1)} ${kept.includes(' and ') ? 'are' : 'is'} kept, out of sight — switch back any time.` : now;
}
