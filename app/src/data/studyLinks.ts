// Learning for a project (specs/projects-study-links.md): links from a project to what you're learning for it in Study —
// your own courses, books in Reading, Arabic lessons and (since the follow-up to 1.56.0) Cybersecurity lessons — each
// shown with Study's own status: never a percentage, never a guess at what you know. The links live on the project
// (`studyLinks`); removing one never changes Study, and an item removed from Study leaves its link, marked as gone.
// Never sent to AI.
import { isDateKey, localStamp, shortDate, todayKey } from './dates';
import { lessonHref } from './cybersecurity/types';
import { completion, completionText, stIndex, type StudyIndex } from './study/roadmap';
import type { DateKey, MyDayData, Project, StudyLink } from './types';
import { isObj } from './util';

export const LINK_LIMITS = { links: 20, why: 200, title: 120 };
export type LinkKind = 'course' | 'book' | 'arabic' | 'cyber';
export const LINK_KINDS: LinkKind[] = ['course', 'book', 'arabic', 'cyber'];
export const LINK_KIND_LABEL: Record<LinkKind, string> = { course: 'Your course', book: 'Book', arabic: 'Arabic lesson', cyber: 'Cybersecurity lesson' };
// The lesson kinds: their titles and Study's status come from the on-demand catalogues (projects/learningArabic.ts,
// learningCyber.ts).
export const LESSON_KINDS = ['arabic', 'cyber'] as const;
export type LessonKind = typeof LESSON_KINDS[number];
export const isLessonKind = (k: string): k is LessonKind => (LESSON_KINDS as readonly string[]).includes(k);
export const knownKind = (k: string): k is LinkKind => (LINK_KINDS as string[]).includes(k);
const same = (l: StudyLink, kind: string, id: string) => l.kind === kind && l.id === id;
// Why it matters, tidied the same way every time (trimmed after the cut too), so saved text reads back unchanged.
const tidyWhy = (s: string) => s.trim().slice(0, LINK_LIMITS.why).trimEnd();

// Reading saved links: kept only when there are some. A duplicate is merged; one this version can't read is counted,
// never kept half-read. A kind from a newer MyDay is kept as it is. A why that isn't text is simply left off.
export function normalizeStudyLinks(raw: unknown, report: { dropped: number }): StudyLink[] | null {
  if (raw === undefined || raw === null) return null;
  if (!Array.isArray(raw)) { report.dropped++; return null; }
  const out: StudyLink[] = [];
  for (const l of raw) {
    if (!isObj(l) || typeof l.kind !== 'string' || !l.kind || typeof l.id !== 'string' || !l.id || typeof l.title !== 'string' || !l.title.trim()) { report.dropped++; continue; }
    if (out.some(x => same(x, l.kind as string, l.id as string))) continue;
    const link: StudyLink = { ...l, kind: l.kind, id: l.id, title: l.title.slice(0, LINK_LIMITS.title), addedOn: isDateKey(l.addedOn) ? l.addedOn : todayKey() };
    if (typeof l.why === 'string' && l.why.trim()) link.why = tidyWhy(l.why); else delete link.why;
    out.push(link);
  }
  return out.length ? out : null;
}

// ---------- Changing ----------
const project = (d: MyDayData, id: string) => d.projects.items.find(p => p.id === id);
// Link something (its title as Study has it now; a lesson's from its catalogue). Returns false when the project or the
// course or book isn't there, it's already linked, or the project has 20 links.
export function addStudyLink(d: MyDayData, projectId: string, item: { kind: LinkKind; id: string; title: string }, why = '', k: DateKey = todayKey()): boolean {
  const p = project(d, projectId), links = p?.studyLinks ?? [], title = item.title.trim().slice(0, LINK_LIMITS.title);
  if (!p || !item.id || !title || links.length >= LINK_LIMITS.links || links.some(l => same(l, item.kind, item.id))) return false;
  if (item.kind === 'course' && !stIndex(d.study).course.has(item.id)) return false;
  if (item.kind === 'book' && !d.reading.books.some(b => b.id === item.id)) return false;
  const w = tidyWhy(why);
  p.studyLinks = [...links, { kind: item.kind, id: item.id, title, ...(w ? { why: w } : {}), addedOn: k }];
  p.updatedAt = localStamp();
  return true;
}
export function removeStudyLink(d: MyDayData, projectId: string, kind: string, id: string): boolean {
  const p = project(d, projectId);
  if (!p?.studyLinks?.some(l => same(l, kind, id))) return false;
  const rest = p.studyLinks.filter(l => !same(l, kind, id));
  if (rest.length) p.studyLinks = rest; else delete p.studyLinks;
  p.updatedAt = localStamp();
  return true;
}
// Why it matters: blank takes it away. Returns false when nothing changed.
export function setStudyLinkWhy(d: MyDayData, projectId: string, kind: string, id: string, why: string): boolean {
  const l = project(d, projectId)?.studyLinks?.find(x => same(x, kind, id)), w = tidyWhy(why);
  if (!l || (l.why ?? '') === w) return false;
  if (w) l.why = w; else delete l.why;
  project(d, projectId)!.updatedAt = localStamp();
  return true;
}

// ---------- Reading ----------
// A lesson as its on-demand catalogue gives it: its title and Study's status; null when the lesson isn't in the course
// any more; undefined while the catalogue loads; 'failed' when it couldn't load.
export type LessonInfo = { title: string; status: string } | null | undefined | 'failed';
export interface LinkView { link: StudyLink; label: string; title: string; status: string; gone: boolean; href: string | null }

export function linkView(data: MyDayData, l: StudyLink, ix: StudyIndex, lesson?: LessonInfo): LinkView {
  const gone = { link: l, label: knownKind(l.kind) ? LINK_KIND_LABEL[l.kind] : 'From a newer MyDay', title: l.title, status: 'No longer in Study', gone: true, href: null };
  if (l.kind === 'course') {
    const c = ix.course.get(l.id)?.node;
    if (!c) return gone;
    return { ...gone, title: c.title, gone: false, href: `#study/course/${encodeURIComponent(c.id)}`,
      status: c.archived ? 'Archived in Study' : completionText(completion(ix.courseTasks.get(c.id) ?? [])) };
  }
  if (l.kind === 'book') {
    const b = data.reading.books.find(x => x.id === l.id);
    if (!b) return gone;
    return { ...gone, title: b.title, gone: false, href: '#study/reading',
      status: b.finishedOn ? `Finished on ${shortDate(b.finishedOn)}` : !b.page ? 'Not started' : b.pages ? `Page ${b.page} of ${b.pages}` : `Page ${b.page}` };
  }
  if (isLessonKind(l.kind)) {
    if (lesson === null) return gone;
    const live = typeof lesson === 'object' ? lesson : null;
    return { ...gone, title: live?.title ?? l.title, gone: false, href: l.kind === 'arabic' ? `#study/arabic/${encodeURIComponent(l.id)}` : lessonHref(l.id),
      status: live ? live.status : lesson === 'failed' ? 'Open it in Study to see how it’s going' : '' };
  }
  return { ...gone, status: 'Open it in a newer MyDay', gone: false };
}

// What can still be linked, in Study's own order: your courses as on the roadmap (archived ones aside), and books as in
// Reading. Lessons come from the on-demand catalogues (projects/learningArabic.ts and learningCyber.ts).
export function courseChoices(data: MyDayData, p: Project): { id: string; title: string }[] {
  return data.study.stages.flatMap(s => s.courses).filter(c => !c.archived && !p.studyLinks?.some(l => same(l, 'course', c.id))).map(c => ({ id: c.id, title: c.title }));
}
export function bookChoices(data: MyDayData, p: Project): { id: string; title: string }[] {
  return data.reading.books.filter(b => !p.studyLinks?.some(l => same(l, 'book', b.id))).map(b => ({ id: b.id, title: b.title }));
}
// For Study's side ("For your project: …" on a course, a book or a Cybersecurity lesson): the projects that link it,
// leaving out ones marked done (owner's choice, as Today does); a done project keeps its links on the project itself.
export const linkedFrom = (data: MyDayData, kind: LinkKind, id: string): Project[] =>
  data.projects.items.filter(p => p.status !== 'done' && p.studyLinks?.some(l => same(l, kind, id)));
