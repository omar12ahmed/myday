// Software projects (specs/projects-software.md): requirements with their acceptance checks, bugs, and a milestone's
// release checklist. Each is one record in the top-level `software` section, saying which project it belongs to, so the
// project itself stays as it is. A check is ticked with what proved it and the day; a release is ready when every
// check is ticked and no bug in it is open — no score. Links to code are the project's own links, marked (a
// repository, an issue, a pull request); where one points is read from its address, never its state. Words and
// counts only; never sent to AI.
import { isDateKey, isDateTime, localStamp, todayKey } from './dates';
import { tidyText } from './projectResources';
import { addTask, isDone, TASK_LIMITS } from './tasks';
import type { DateKey, Milestone, MyDayData, Project, ProjectResource, SoftwareBug, SoftwareCheck, SoftwareData, SoftwareItem, SoftwareRelease, SoftwareRequirement } from './types';
import { isObj, listOf, uid } from './util';

export const SOFTWARE_LIMITS = {
  requirements: 200, bugs: 500, releases: 30, reqChecks: 20, releaseChecks: 30, links: 12,
  title: 160, detail: 2000, steps: 4000, check: 300, proof: 300,
};
export const emptySoftware = (): SoftwareData => ({ items: [] });
const ID = /^[A-Za-z0-9_-]{1,64}$/;

export const REQUIREMENT_STATES = [
  { id: 'proposed', label: 'Proposed' }, { id: 'agreed', label: 'Agreed' }, { id: 'built', label: 'Built' }, { id: 'dropped', label: 'Dropped' },
] as const;
export const BUG_STATES = [{ id: 'open', label: 'Open' }, { id: 'fixed', label: 'Fixed' }, { id: 'wontfix', label: 'Won’t fix' }] as const;
export type RequirementState = typeof REQUIREMENT_STATES[number]['id'];
export type BugState = typeof BUG_STATES[number]['id'];
export const requirementStateLabel = (s: string | undefined) => REQUIREMENT_STATES.find(x => x.id === s)?.label ?? 'Proposed';
export const bugStateLabel = (s: string | undefined) => BUG_STATES.find(x => x.id === s)?.label ?? 'Open';

// ---------- Reading ----------
// Reading saved items: one without an id, a project or a type is counted, never kept half-read; a later duplicate id
// is counted too. Everything else is kept as written (types, states and fields from a newer MyDay too), so reading
// never rewrites another device's record; a missing field reads as empty where it's used.
export function normalizeSoftware(raw: unknown, report: { dropped: number }): SoftwareData {
  if (!isObj(raw)) return emptySoftware();
  const out: SoftwareData = { ...raw, items: [] }, seen = new Set<string>();
  for (const x of listOf(raw.items)) {
    if (!isObj(x) || typeof x.id !== 'string' || !ID.test(x.id) || typeof x.projectId !== 'string' || !x.projectId || typeof x.type !== 'string' || !x.type) { report.dropped++; continue; }
    if (seen.has(x.id)) { report.dropped++; continue; }
    seen.add(x.id);
    const item = { ...x } as SoftwareItem;
    if (!isDateTime(item.createdAt)) item.createdAt = isDateTime(item.updatedAt) ? item.updatedAt : '2000-01-01T00:00'; // (the same on every device)
    if (!isDateTime(item.updatedAt)) item.updatedAt = item.createdAt;
    out.items.push(item);
  }
  return out;
}
const byMade = (a: SoftwareItem, b: SoftwareItem) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
const text = (v: unknown) => (typeof v === 'string' ? v : '');
// What's shown and counted: checks with an id and words. Changes keep anything else in the list as written.
export const checksOf = (x: SoftwareItem): SoftwareCheck[] => listOf((x as SoftwareRequirement).checks).filter((c): c is SoftwareCheck => isObj(c) && typeof c.id === 'string' && typeof c.text === 'string');
const savedChecks = (x: SoftwareItem) => listOf((x as SoftwareRequirement).checks) as SoftwareCheck[];
export const isRequirement = (x: SoftwareItem): x is SoftwareRequirement => x.type === 'requirement';
export const isBug = (x: SoftwareItem): x is SoftwareBug => x.type === 'bug';
export const isRelease = (x: SoftwareItem): x is SoftwareRelease => x.type === 'release';
export const titleOf = (x: SoftwareRequirement | SoftwareBug) => text(x.title) || '(untitled)';
export const reqState = (r: SoftwareRequirement): string => text(r.state) || 'proposed';
export const bugState = (b: SoftwareBug): string => text(b.state) || 'open';
const ofProject = (data: MyDayData, projectId: string) => data.software.items.filter(x => x.projectId === projectId);
// In the order you added them.
export const requirementsOf = (data: MyDayData, projectId: string) => ofProject(data, projectId).filter(isRequirement).sort(byMade);
export const bugsOf = (data: MyDayData, projectId: string) => ofProject(data, projectId).filter(isBug).sort(byMade);
export const itemById = (data: MyDayData, id: string) => data.software.items.find(x => x.id === id) ?? null;
// The project's links an item points at (a link since removed isn't shown).
export const linksOfItem = (p: Project, x: SoftwareRequirement | SoftwareBug): ProjectResource[] => {
  const ids = listOf(x.linkIds).filter((v): v is string => typeof v === 'string');
  return (p.resources ?? []).filter(r => ids.includes(r.id));
};

// ---------- Releases ----------
// A milestone is a release while it has a release item that isn't off. Its checklist: the acceptance checks of the
// requirements in it (not dropped), its own checks, and the bugs in it that are still open.
const milestonesOf = (p: Project): Milestone[] => p.milestones ?? [];
export const releaseOfMilestone = (data: MyDayData, projectId: string, milestoneId: string): SoftwareRelease | null =>
  ofProject(data, projectId).filter(isRelease).find(r => r.milestoneId === milestoneId && !r.off) ?? null;
// The releases, in the milestones' order (a release whose milestone has gone isn't listed).
export function releasesOf(data: MyDayData, p: Project): { release: SoftwareRelease; milestone: Milestone }[] {
  return milestonesOf(p).flatMap(m => { const r = releaseOfMilestone(data, p.id, m.id); return r ? [{ release: r, milestone: m }] : []; });
}
export const releaseById = (data: MyDayData, p: Project, id: string | undefined) => (id ? releasesOf(data, p).find(x => x.release.id === id) ?? null : null);
export interface Checklist {
  requirements: { requirement: SoftwareRequirement; checks: SoftwareCheck[] }[];
  own: SoftwareCheck[]; openBugs: SoftwareBug[]; total: number; ticked: number; ready: boolean;
}
export function releaseChecklist(data: MyDayData, release: SoftwareRelease): Checklist {
  const reqs = requirementsOf(data, release.projectId).filter(r => r.releaseId === release.id && reqState(r) !== 'dropped').map(r => ({ requirement: r, checks: checksOf(r) }));
  const own = checksOf(release), openBugs = bugsOf(data, release.projectId).filter(b => b.releaseId === release.id && bugState(b) === 'open');
  const all = [...reqs.flatMap(r => r.checks), ...own], ticked = all.filter(c => c.done).length;
  // Ready: at least one check, every check ticked, and no bug in it open.
  return { requirements: reqs, own, openBugs, total: all.length, ticked, ready: all.length > 0 && ticked === all.length && !openBugs.length };
}
// "3 checks left · 1 bug open", or "Ready".
export function checklistWords(c: Checklist): string {
  if (c.ready) return 'Ready: every check ticked and no bug open';
  if (!c.total && !c.openBugs.length) return 'No checks yet';
  const left = c.total - c.ticked;
  return [left && `${left} check${left === 1 ? '' : 's'} left`, c.openBugs.length && `${c.openBugs.length} bug${c.openBugs.length === 1 ? '' : 's'} open`, !c.total && 'no checks yet'].filter(Boolean).join(' · ');
}

// ---------- At a glance ----------
export interface SoftwareGlance { requirements: number; checks: number; ticked: number; openBugs: number; next: { milestone: Milestone; release: SoftwareRelease; checklist: Checklist } | null }
export function softwareGlance(data: MyDayData, p: Project): SoftwareGlance {
  const reqs = requirementsOf(data, p.id).filter(r => reqState(r) !== 'dropped'), checks = reqs.flatMap(checksOf);
  // The next release: the first not yet reached, in the milestones' order.
  const next = releasesOf(data, p).find(x => !x.milestone.reachedOn) ?? null;
  return { requirements: reqs.length, checks: checks.length, ticked: checks.filter(c => c.done).length, openBugs: bugsOf(data, p.id).filter(b => bugState(b) === 'open').length,
    next: next && { ...next, checklist: releaseChecklist(data, next.release) } };
}

// ---------- Changing them (inside update(); each returns whether anything changed, or an id) ----------
const touch = (x: SoftwareItem) => { x.updatedAt = localStamp(); };
const find = (d: MyDayData, id: string) => d.software.items.find(x => x.id === id);
const projectOf = (d: MyDayData, projectId: string) => d.projects.items.find(p => p.id === projectId);
const count = (d: MyDayData, projectId: string, type: string) => d.software.items.filter(x => x.projectId === projectId && x.type === type).length;

export function addRequirement(d: MyDayData, projectId: string, title: string, detail = ''): string | null {
  const t = tidyText(title, SOFTWARE_LIMITS.title);
  if (!t || !projectOf(d, projectId) || count(d, projectId, 'requirement') >= SOFTWARE_LIMITS.requirements) return null;
  const id = 'sr' + uid(), now = localStamp(), r: SoftwareRequirement = { id, type: 'requirement', projectId, title: t, state: 'proposed', checks: [], createdAt: now, updatedAt: now };
  const w = tidyText(detail, SOFTWARE_LIMITS.detail);
  if (w) r.detail = w;
  d.software.items.push(r);
  return id;
}
export interface RequirementPatch { title?: string; detail?: string; state?: RequirementState; releaseId?: string | null }
export function editRequirement(d: MyDayData, id: string, patch: RequirementPatch): boolean {
  const r = find(d, id);
  if (!r || !isRequirement(r)) return false;
  let changed = false;
  if (patch.title !== undefined) { const t = tidyText(patch.title, SOFTWARE_LIMITS.title); if (t && t !== r.title) { r.title = t; changed = true; } }
  if (patch.detail !== undefined) changed = setText(r, 'detail', patch.detail, SOFTWARE_LIMITS.detail) || changed;
  if (patch.state !== undefined && REQUIREMENT_STATES.some(s => s.id === patch.state) && patch.state !== reqState(r)) { r.state = patch.state; changed = true; }
  if (patch.releaseId !== undefined) changed = setRelease(d, r, patch.releaseId) || changed;
  if (changed) touch(r);
  return changed;
}
// A text field: set, or the key removed when emptied.
function setText(x: SoftwareItem, key: string, value: string, max: number): boolean {
  const w = tidyText(value, max), was = text((x as Record<string, unknown>)[key]);
  if (w === was) return false;
  if (w) (x as Record<string, unknown>)[key] = w; else delete (x as Record<string, unknown>)[key];
  return true;
}
// Which release a requirement or bug is in: one of its project's releases, or none.
function setRelease(d: MyDayData, x: SoftwareRequirement | SoftwareBug, releaseId: string | null): boolean {
  const p = projectOf(d, x.projectId);
  const to = releaseId && p && releaseById(d, p, releaseId) ? releaseId : null;
  if ((x.releaseId ?? null) === to) return false;
  if (to) x.releaseId = to; else delete x.releaseId;
  return true;
}

export function addBug(d: MyDayData, projectId: string, title: string, parts: { happens?: string; expected?: string; steps?: string } = {}): string | null {
  const t = tidyText(title, SOFTWARE_LIMITS.title);
  if (!t || !projectOf(d, projectId) || count(d, projectId, 'bug') >= SOFTWARE_LIMITS.bugs) return null;
  const id = 'sb' + uid(), now = localStamp(), b: SoftwareBug = { id, type: 'bug', projectId, title: t, state: 'open', createdAt: now, updatedAt: now };
  setText(b, 'happens', parts.happens ?? '', SOFTWARE_LIMITS.detail);
  setText(b, 'expected', parts.expected ?? '', SOFTWARE_LIMITS.detail);
  setText(b, 'steps', parts.steps ?? '', SOFTWARE_LIMITS.steps);
  d.software.items.push(b);
  return id;
}
export interface BugPatch { title?: string; happens?: string; expected?: string; steps?: string; releaseId?: string | null }
export function editBug(d: MyDayData, id: string, patch: BugPatch): boolean {
  const b = find(d, id);
  if (!b || !isBug(b)) return false;
  let changed = false;
  if (patch.title !== undefined) { const t = tidyText(patch.title, SOFTWARE_LIMITS.title); if (t && t !== b.title) { b.title = t; changed = true; } }
  if (patch.happens !== undefined) changed = setText(b, 'happens', patch.happens, SOFTWARE_LIMITS.detail) || changed;
  if (patch.expected !== undefined) changed = setText(b, 'expected', patch.expected, SOFTWARE_LIMITS.detail) || changed;
  if (patch.steps !== undefined) changed = setText(b, 'steps', patch.steps, SOFTWARE_LIMITS.steps) || changed;
  if (patch.releaseId !== undefined) changed = setRelease(d, b, patch.releaseId) || changed;
  if (changed) touch(b);
  return changed;
}
// Open, fixed or won't fix: closing keeps the day; opening again clears it.
export function setBugState(d: MyDayData, id: string, state: BugState, k: DateKey = todayKey()): boolean {
  const b = find(d, id);
  if (!b || !isBug(b) || !BUG_STATES.some(s => s.id === state) || state === bugState(b)) return false;
  b.state = state;
  if (state === 'open') delete b.closedOn; else b.closedOn = k;
  touch(b);
  return true;
}
// "Fix it": a project task "Fix: <bug>", made once (the bug then shows its task). Returns its id, 'already' or null.
export function fixIt(d: MyDayData, id: string): string | 'already' | null {
  const b = find(d, id);
  if (!b || !isBug(b)) return null;
  if (b.taskId && d.tasks.items.some(t => t.id === b.taskId)) return 'already';
  const tid = addTask(d.tasks, { title: tidyText(`Fix: ${titleOf(b)}`, TASK_LIMITS.title) });
  if (!tid) return null;
  d.tasks.items.find(t => t.id === tid)!.projectId = b.projectId;
  b.taskId = tid; touch(b);
  return tid;
}
// The bug's task, and whether it's done (null when there's none, or it's gone).
export function bugTask(data: MyDayData, b: SoftwareBug) {
  const t = b.taskId ? data.tasks.items.find(x => x.id === b.taskId) : undefined;
  return t ? { task: t, done: isDone(data, t) } : null;
}

// Mark a milestone as a release (its own checks come back if it was one before). Returns the release's id.
export function markRelease(d: MyDayData, projectId: string, milestoneId: string): string | null {
  const p = projectOf(d, projectId);
  if (!p || !milestonesOf(p).some(m => m.id === milestoneId)) return null;
  const was = d.software.items.filter(isRelease).find(r => r.projectId === projectId && r.milestoneId === milestoneId);
  if (was) { if (!was.off) return was.id; delete was.off; touch(was); return was.id; }
  if (count(d, projectId, 'release') >= SOFTWARE_LIMITS.releases) return null;
  const id = 'sl' + uid(), now = localStamp();
  d.software.items.push({ id, type: 'release', projectId, milestoneId, checks: [], createdAt: now, updatedAt: now });
  return id;
}
// Unmarking keeps its own checks, out of sight; requirements and bugs keep saying which release (shown again if marked).
export function unmarkRelease(d: MyDayData, id: string): boolean {
  const r = find(d, id);
  if (!r || !isRelease(r) || r.off) return false;
  r.off = true; touch(r);
  return true;
}

// ---------- Checks (a requirement's acceptance checks, or a release's own) ----------
const checkable = (x: SoftwareItem | undefined): x is SoftwareRequirement | SoftwareRelease => !!x && (isRequirement(x) || isRelease(x));
export function addCheck(d: MyDayData, itemId: string, words: string): string | null {
  const x = find(d, itemId), t = tidyText(words, SOFTWARE_LIMITS.check);
  if (!checkable(x) || !t || checksOf(x).length >= (isRelease(x) ? SOFTWARE_LIMITS.releaseChecks : SOFTWARE_LIMITS.reqChecks)) return null;
  const cid = 'sc' + uid();
  x.checks = [...savedChecks(x), { id: cid, text: t }]; touch(x);
  return cid;
}
export function editCheck(d: MyDayData, itemId: string, checkId: string, words: string): boolean {
  const x = find(d, itemId), c = checkable(x) ? checksOf(x).find(y => y.id === checkId) : undefined, t = tidyText(words, SOFTWARE_LIMITS.check);
  if (!x || !c || !t || t === c.text) return false;
  c.text = t; touch(x);
  return true;
}
// Ticking keeps the day and what proved it (if you said); unticking clears all three.
export function tickCheck(d: MyDayData, itemId: string, checkId: string, proof = '', k: DateKey = todayKey()): boolean {
  const x = find(d, itemId), c = checkable(x) ? checksOf(x).find(y => y.id === checkId) : undefined;
  if (!x || !c) return false;
  if (c.done) { delete c.done; delete c.on; delete c.proof; }
  else { c.done = true; c.on = isDateKey(k) ? k : todayKey(); const w = tidyText(proof, SOFTWARE_LIMITS.proof); if (w) c.proof = w; }
  touch(x);
  return true;
}
// What proved a ticked check, changed afterwards (emptied removes it).
export function setProof(d: MyDayData, itemId: string, checkId: string, proof: string): boolean {
  const x = find(d, itemId), c = checkable(x) ? checksOf(x).find(y => y.id === checkId) : undefined;
  if (!x || !c || !c.done) return false;
  const w = tidyText(proof, SOFTWARE_LIMITS.proof);
  if (w === (c.proof ?? '')) return false;
  if (w) c.proof = w; else delete c.proof;
  touch(x);
  return true;
}
export function removeCheck(d: MyDayData, itemId: string, checkId: string): boolean {
  const x = find(d, itemId);
  if (!checkable(x) || !checksOf(x).some(c => c.id === checkId)) return false;
  x.checks = savedChecks(x).filter(c => !(isObj(c) && c.id === checkId)); touch(x);
  return true;
}

// ---------- Links (the project's own, marked) ----------
// Point a requirement or bug at one of the project's links, or stop.
export function toggleLink(d: MyDayData, itemId: string, linkId: string): boolean {
  const x = find(d, itemId), p = x && projectOf(d, x.projectId);
  if (!x || !p || !(isRequirement(x) || isBug(x)) || !(p.resources ?? []).some(r => r.id === linkId)) return false;
  const saved = listOf(x.linkIds).filter((v): v is string => typeof v === 'string');
  if (saved.includes(linkId)) { const rest = saved.filter(v => v !== linkId); if (rest.length) x.linkIds = rest; else delete x.linkIds; }
  else { if (saved.length >= SOFTWARE_LIMITS.links) return false; x.linkIds = [...saved, linkId]; }
  touch(x);
  return true;
}
// ---------- Removing ----------
// A requirement or bug, asked first in the app (its task, if any, stays). A release is unmarked instead.
export function removeItem(d: MyDayData, id: string): boolean {
  const i = d.software.items.findIndex(x => x.id === id && (isRequirement(x) || isBug(x)));
  if (i < 0) return false;
  d.software.items.splice(i, 1);
  return true;
}
// A project deleted: its requirements, bugs and releases go with it (its tasks stay, as a project's tasks do).
export function deleteProjectSoftware(d: MyDayData, projectId: string): boolean {
  const before = d.software.items.length;
  d.software.items = d.software.items.filter(x => x.projectId !== projectId);
  return d.software.items.length !== before;
}

// ---------- In words ----------
export const checksWords = (cs: SoftwareCheck[]) => (cs.length ? `${cs.filter(c => c.done).length} of ${cs.length} check${cs.length === 1 ? '' : 's'} ticked` : 'No acceptance checks yet');
