// Ambitions (specs/projects-ambitions.md): your long-term ambitions — working in cybersecurity, reading Arabic
// literature, a business in Hargeisa — and what's a step towards them. Each is one record in the top-level `ambitions`
// section. An ambition links, by reference only, projects, Study topics or courses, the Cybersecurity path and the
// Arabic route (whichever path or goal you've chosen there), and keeps its own ordered steps. Nothing it links is
// moved, copied or told. Words and counts only; never sent to AI.
import { curriculumTaskId } from './cybersecurity/types';
import { isDateTime, localStamp } from './dates';
import { tidyText } from './projectResources';
import { topicOfStage } from './study/topics';
import type { Ambition, AmbitionLink, AmbitionsData, AmbitionStep, MyDayData, Project, StudyData, TaskItem } from './types';
import { isObj, listOf, uid } from './util';

export const AMBITION_LIMITS = { items: 12, title: 120, why: 400, links: 20, steps: 20, step: 160 };
export const LINK_KINDS = ['project', 'topic', 'course', 'cyber', 'arabic'] as const;
export type LinkKind = typeof LINK_KINDS[number];
export const emptyAmbitions = (): AmbitionsData => ({ items: [] });
const ID = /^[A-Za-z0-9_-]{1,64}$/;

// ---------- Reading ----------
// Reading saved ambitions: one without an id or a title is counted, never kept half-read; a later duplicate id is
// counted too. Everything else is kept as written (links and steps of kinds a newer MyDay has), so reading never
// rewrites another device's record; a missing list reads as empty where it's used.
export function normalizeAmbitions(raw: unknown, report: { dropped: number }): AmbitionsData {
  if (!isObj(raw)) return emptyAmbitions();
  const out: AmbitionsData = { ...raw, items: [] }, seen = new Set<string>();
  for (const x of listOf(raw.items)) {
    if (!isObj(x) || typeof x.id !== 'string' || !ID.test(x.id) || typeof x.title !== 'string' || !x.title.trim()) { report.dropped++; continue; }
    if (seen.has(x.id)) { report.dropped++; continue; }
    seen.add(x.id);
    const a = { ...x } as Ambition;
    if (!isDateTime(a.createdAt)) a.createdAt = isDateTime(a.updatedAt) ? a.updatedAt : '2000-01-01T00:00'; // (the same on every device)
    if (!isDateTime(a.updatedAt)) a.updatedAt = a.createdAt;
    out.items.push(a);
  }
  return out;
}
// What's shown and counted: links with an id, steps with an id and words. Changes keep anything else in the list as
// written (a newer MyDay's entries), so editing never drops what this version can't read.
const objs = <T>(v: unknown): T[] => listOf(v).filter((x): x is T => isObj(x) && typeof x.id === 'string');
export const linksOf = (a: Ambition) => objs<AmbitionLink>(a.links);
export const stepsOf = (a: Ambition) => objs<AmbitionStep>(a.steps).filter(x => typeof x.text === 'string');
const isEntry = (x: unknown, id: string) => isObj(x) && x.id === id;
// The saved lists as written, entries this version can't read included (they're kept, never looked into).
const savedLinks = (a: Ambition) => listOf(a.links) as AmbitionLink[], savedSteps = (a: Ambition) => listOf(a.steps) as AmbitionStep[];
// In the order you made them.
export const ambitionsInOrder = (data: MyDayData) => [...data.ambitions.items].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
export const ambitionById = (data: MyDayData, id: string) => data.ambitions.items.find(a => a.id === id) ?? null;

// ---------- What's a step towards what ----------
// The ambitions that link a project (or one of its steps points at it).
export const ambitionsOfProject = (data: MyDayData, projectId: string) => ambitionsInOrder(data).filter(a => linksOf(a).some(l => l.kind === 'project' && l.ref === projectId));
// A task's: through its project.
export function ambitionsOfTask(data: MyDayData, t: Pick<TaskItem, 'projectId'> | null | undefined) {
  return t?.projectId ? ambitionsOfProject(data, t.projectId) : [];
}
// Study: a link to the Cybersecurity path, the Arabic route, a topic or a course.
export const ambitionsOfStudy = (data: MyDayData, kind: 'cyber' | 'arabic' | 'topic' | 'course', ref?: string) =>
  ambitionsInOrder(data).filter(a => linksOf(a).some(l => l.kind === kind && (kind === 'cyber' || kind === 'arabic' || l.ref === ref)));
// A lesson on Today: its path (Arabic, Cybersecurity), or one of your courses — linked itself, or through its topic.
// A Cybersecurity lesson copied into Study is in a course too (its module, under the Cybersecurity topic), so linking
// that course or topic counts as well.
export function ambitionsOfLesson(data: MyDayData, subject: string, courseId?: string, lessonId?: string): Ambition[] {
  const path = subject === 'arabic' ? 'arabic' : subject === 'cybersecurity' ? 'cyber' : null;
  const course = subject === 'arabic' ? undefined : subject === 'cybersecurity' ? (lessonId ? courseOfTask(data.study, curriculumTaskId(lessonId)) : undefined) : courseId;
  const stage = course ? data.study.stages.find(sg => sg.courses.some(c => c.id === course)) : undefined, topic = stage ? topicOfStage(data.study, stage) : '';
  if (!path && !course) return [];
  return ambitionsInOrder(data).filter(a => linksOf(a).some(l => (!!path && l.kind === path) || (!!course && l.kind === 'course' && l.ref === course) || (!!topic && l.kind === 'topic' && l.ref === topic)));
}
const courseOfTask = (st: StudyData, taskId: string) =>
  st.stages.flatMap(sg => sg.courses).find(c => c.modules.some(m => m.sections.some(sc => sc.tasks.some(t => t.id === taskId))))?.id;
// "A step towards “Work in cybersecurity”" (two: "“A” and “B”"; more: "“A” and 2 more").
export function towardsLine(list: Ambition[]): string {
  if (!list.length) return '';
  const q = (a: Ambition) => `“${a.title}”`;
  return `A step towards ${list.length === 1 ? q(list[0]) : list.length === 2 ? `${q(list[0])} and ${q(list[1])}` : `${q(list[0])} and ${list.length - 1} more`}`;
}
// What links, in words, for a card: "2 projects · the Arabic route".
export function linksWords(a: Ambition): string {
  const ls = linksOf(a), n = (kind: string) => ls.filter(l => l.kind === kind).length;
  const p = n('project'), s = n('topic') + n('course');
  return [p && `${p} project${p === 1 ? '' : 's'}`, s && `${s} in Study`, n('cyber') && 'the Cybersecurity path', n('arabic') && 'the Arabic route'].filter(Boolean).join(' · ');
}
export const stepsWords = (a: Ambition) => { const st = stepsOf(a); return st.length ? `${st.filter(x => x.done).length} of ${st.length} steps` : ''; };

// ---------- Changing them (inside update(); each returns whether anything changed, or an id) ----------
const touch = (a: Ambition) => { a.updatedAt = localStamp(); };
const find = (d: MyDayData, id: string) => d.ambitions.items.find(a => a.id === id);
export function addAmbition(d: MyDayData, title: string, why = ''): string | null {
  const t = tidyText(title, AMBITION_LIMITS.title);
  if (!t || d.ambitions.items.length >= AMBITION_LIMITS.items) return null;
  const id = 'am' + uid(), now = localStamp(), a: Ambition = { id, title: t, links: [], steps: [], createdAt: now, updatedAt: now };
  const w = tidyText(why, AMBITION_LIMITS.why);
  if (w) a.why = w;
  d.ambitions.items.push(a);
  return id;
}
export function editAmbition(d: MyDayData, id: string, patch: { title?: string; why?: string }): boolean {
  const a = find(d, id);
  if (!a) return false;
  let changed = false;
  if (patch.title !== undefined) { const t = tidyText(patch.title, AMBITION_LIMITS.title); if (t && t !== a.title) { a.title = t; changed = true; } }
  if (patch.why !== undefined) { const w = tidyText(patch.why, AMBITION_LIMITS.why); if (w !== (a.why ?? '')) { if (w) a.why = w; else delete a.why; changed = true; } }
  if (changed) touch(a);
  return changed;
}
export function deleteAmbition(d: MyDayData, id: string): boolean {
  const i = d.ambitions.items.findIndex(a => a.id === id);
  if (i < 0) return false;
  d.ambitions.items.splice(i, 1);
  return true;
}
// A link: a project, topic or course by its id; the Cybersecurity path or the Arabic route once each. Returns the
// link's id, 'already', or null.
export function addLink(d: MyDayData, id: string, kind: LinkKind, ref?: string): string | 'already' | null {
  const a = find(d, id), ls = a ? linksOf(a) : [];
  const needsRef = kind === 'project' || kind === 'topic' || kind === 'course';
  // (A Study course copied from the Cybersecurity path has an id like "cyber:1:module.x".)
  if (!a || !LINK_KINDS.includes(kind) || (needsRef && (!ref || !/^[A-Za-z0-9_.:-]{1,80}$/.test(ref)))) return null;
  if (ls.some(l => l.kind === kind && (needsRef ? l.ref === ref : true))) return 'already';
  if (ls.length >= AMBITION_LIMITS.links) return null;
  const lid = 'al' + uid(), l: AmbitionLink = { id: lid, kind };
  if (needsRef) l.ref = ref;
  a.links = [...savedLinks(a), l]; touch(a);
  return lid;
}
// Unlinking also takes the link off any step that pointed at it (the step stays).
export function removeLink(d: MyDayData, id: string, linkId: string): boolean {
  const a = find(d, id), ls = a ? linksOf(a) : [];
  if (!a || !ls.some(l => l.id === linkId)) return false;
  a.links = savedLinks(a).filter(l => !isEntry(l, linkId));
  if (stepsOf(a).some(x => x.linkId === linkId)) a.steps = savedSteps(a).map(x => { if (!isObj(x) || x.linkId !== linkId) return x; const { linkId: _gone, ...rest } = x; return rest as AmbitionStep; });
  touch(a);
  return true;
}
export function addStep(d: MyDayData, id: string, text: string, linkId?: string): string | null {
  const a = find(d, id), st = a ? stepsOf(a) : [], t = tidyText(text, AMBITION_LIMITS.step);
  if (!a || !t || st.length >= AMBITION_LIMITS.steps) return null;
  const sid = 'as' + uid(), s: AmbitionStep = { id: sid, text: t };
  if (linkId && linksOf(a).some(l => l.id === linkId)) s.linkId = linkId;
  a.steps = [...savedSteps(a), s]; touch(a);
  return sid;
}
export function editStep(d: MyDayData, id: string, stepId: string, patch: { text?: string; linkId?: string | null }): boolean {
  const a = find(d, id), s = a && stepsOf(a).find(x => x.id === stepId);
  if (!a || !s) return false;
  let changed = false;
  if (patch.text !== undefined) { const t = tidyText(patch.text, AMBITION_LIMITS.step); if (t && t !== s.text) { s.text = t; changed = true; } }
  if (patch.linkId !== undefined) {
    const to = patch.linkId && linksOf(a).some(l => l.id === patch.linkId) ? patch.linkId : null;
    if ((s.linkId ?? null) !== to) { if (to) s.linkId = to; else delete s.linkId; changed = true; }
  }
  if (changed) touch(a);
  return changed;
}
export function tickStep(d: MyDayData, id: string, stepId: string): boolean {
  const a = find(d, id), s = a && stepsOf(a).find(x => x.id === stepId);
  if (!a || !s) return false;
  if (s.done) delete s.done; else s.done = true;
  touch(a);
  return true;
}
export function moveStep(d: MyDayData, id: string, stepId: string, by: -1 | 1): boolean {
  const a = find(d, id), st = a ? stepsOf(a) : [], i = st.findIndex(x => x.id === stepId), j = i + by;
  if (!a || i < 0 || j < 0 || j >= st.length) return false;
  // (Swapped where they sit in the saved list, around anything this version can't read.)
  const next = [...savedSteps(a)], ri = next.indexOf(st[i]), rj = next.indexOf(st[j]);
  [next[ri], next[rj]] = [next[rj], next[ri]];
  a.steps = next; touch(a);
  return true;
}
export function removeStep(d: MyDayData, id: string, stepId: string): boolean {
  const a = find(d, id), st = a ? stepsOf(a) : [];
  if (!a || !st.some(x => x.id === stepId)) return false;
  a.steps = savedSteps(a).filter(x => !isEntry(x, stepId)); touch(a);
  return true;
}
// A project's link, as shown: the project or null when it's gone.
export const linkedProject = (data: MyDayData, l: AmbitionLink): Project | null => (l.kind === 'project' ? data.projects.items.find(p => p.id === l.ref) ?? null : null);
