// The Case template (1.35.0): a project can be a case (`project.template === 'case'`), with its own records inside it
// (`project.case`): the timeline (what happened, in date order, each entry saying where it comes from — your account,
// their account or the evidence), the evidence (what could show it, and where it's kept: MyDay doesn't store files) and
// the issues (what you're claiming or considering), linked to each other. Saved inside the project locally;
// cloud sync stores its items separately through projectRecords.ts. A project without it has no `case` field, exactly as before.
//
// MyDay organises; it never says whether a claim is good, and never works out legal time limits (deadlines are the
// case's own dated tasks and appointments, which you enter). A case is private only if you switch it (your choice).
//
// Each split item shares the conservative editing allowance below; total Case size is not one sync record.
import { isDateKey, isDateTime, localStamp } from './dates';
import { PROJECT_SIZE_BUDGET, projectRecordSizes, projectRecordsFit } from './projectSize';
import type { CaseFile, CaseIssue, EvidenceItem, EvidenceKind, EvidenceStatus, IssueStatus, MyDayData, Project, TimelineEntry, TimelineSource } from './types';
import { isObj, listOf, uid } from './util';

export const CASE_LIMITS = { timeline: 150, evidence: 150, issues: 20, title: 160, issueTitle: 120, details: 800, where: 200, notes: 400, issueNotes: 800, evidenceLinks: 10, issueLinks: 5, bytes: PROJECT_SIZE_BUDGET };

export const SOURCE_LABEL: Record<TimelineSource, string> = { mine: 'My account', theirs: 'Their account', evidence: 'In the evidence' };
export const KIND_LABEL: Record<EvidenceKind, string> = { document: 'Document', email: 'Email or letter', message: 'Message', media: 'Photo or recording', witness: 'Witness', other: 'Other' };
export const EVIDENCE_STATUS_LABEL: Record<EvidenceStatus, string> = { 'to-get': 'To get', have: 'Have it', reviewed: 'Reviewed' };
export const ISSUE_STATUS_LABEL: Record<IssueStatus, string> = { considering: 'Considering', claiming: 'Claiming', dropped: 'Dropped' };
const SOURCES = Object.keys(SOURCE_LABEL) as TimelineSource[], KINDS = Object.keys(KIND_LABEL) as EvidenceKind[];
const EV_STATUSES = Object.keys(EVIDENCE_STATUS_LABEL) as EvidenceStatus[], ISSUE_STATUSES = Object.keys(ISSUE_STATUS_LABEL) as IssueStatus[];
const OWN_KEYS = ['timeline', 'evidence', 'issues'];

// ---------- Reading what's saved (unknown fields kept; anything unreadable counted, never dropped silently) ----------
const line = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max).trimEnd() : '');
const block = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const ids = (v: unknown, known: Set<string>, max: number) => [...new Set(listOf(v).filter((x): x is string => typeof x === 'string' && known.has(x)))].slice(0, max);
const created = (v: unknown) => (isDateTime(v) ? v : localStamp());
// Each list's ids are kept unique (a repeat gets a new one); a link to something that isn't there any more is let go.
function uniqueId(seen: Set<string>, id: string, prefix: string) { const out = seen.has(id) ? prefix + uid() : id; seen.add(out); return out; }
export function normalizeCase(raw: unknown, report: { dropped: number }): CaseFile | undefined {
  if (raw === undefined) return undefined;
  if (!isObj(raw)) { report.dropped++; return undefined; }
  for (const k of OWN_KEYS) if (raw[k] !== undefined && !Array.isArray(raw[k])) report.dropped++;
  const issues: CaseIssue[] = [], iSeen = new Set<string>();
  for (const x of listOf(raw.issues)) {
    const title = isObj(x) ? line(x.title, CASE_LIMITS.issueTitle) : '';
    if (!isObj(x) || typeof x.id !== 'string' || !x.id || !title) { report.dropped++; continue; }
    issues.push({ ...x, id: uniqueId(iSeen, x.id, 'is'), title, status: ISSUE_STATUSES.includes(x.status as IssueStatus) ? x.status as IssueStatus : 'considering', notes: block(x.notes, CASE_LIMITS.issueNotes), createdAt: created(x.createdAt) });
  }
  const issueIds = new Set(issues.map(i => i.id));
  const evidence: EvidenceItem[] = [], eSeen = new Set<string>();
  for (const x of listOf(raw.evidence)) {
    const title = isObj(x) ? line(x.title, CASE_LIMITS.title) : '';
    if (!isObj(x) || typeof x.id !== 'string' || !x.id || !title) { report.dropped++; continue; }
    evidence.push({
      ...x, id: uniqueId(eSeen, x.id, 'ev'), title, kind: KINDS.includes(x.kind as EvidenceKind) ? x.kind as EvidenceKind : 'other', date: isDateKey(x.date) ? x.date : null,
      where: line(x.where, CASE_LIMITS.where), status: EV_STATUSES.includes(x.status as EvidenceStatus) ? x.status as EvidenceStatus : 'to-get', notes: block(x.notes, CASE_LIMITS.notes),
      issueIds: ids(x.issueIds, issueIds, CASE_LIMITS.issueLinks), createdAt: created(x.createdAt),
    });
  }
  const evidenceIds = new Set(evidence.map(e => e.id));
  const timeline: TimelineEntry[] = [], tSeen = new Set<string>();
  for (const x of listOf(raw.timeline)) {
    const title = isObj(x) ? line(x.title, CASE_LIMITS.title) : '';
    if (!isObj(x) || typeof x.id !== 'string' || !x.id || !title || !isDateKey(x.date)) { report.dropped++; continue; }
    timeline.push({
      ...x, id: uniqueId(tSeen, x.id, 'tl'), date: x.date, about: x.about === true, title, details: block(x.details, CASE_LIMITS.details),
      source: SOURCES.includes(x.source as TimelineSource) ? x.source as TimelineSource : 'mine',
      evidenceIds: ids(x.evidenceIds, evidenceIds, CASE_LIMITS.evidenceLinks), issueIds: ids(x.issueIds, issueIds, CASE_LIMITS.issueLinks), createdAt: created(x.createdAt),
    });
  }
  const c: CaseFile = { ...raw, timeline, evidence, issues };
  return isEmpty(c) ? undefined : c;
}
const isEmpty = (c: CaseFile) => !c.timeline.length && !c.evidence.length && !c.issues.length && Object.keys(c).every(k => OWN_KEYS.includes(k));

// ---------- Looking at it ----------
// In date order (an approximate date sits with its day); the same day in the order added.
export const timelineInOrder = (p: Project): TimelineEntry[] => [...(p.case?.timeline ?? [])].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
export function caseCounts(p: Project) {
  const c = p.case, ev = c?.evidence ?? [];
  return { timeline: c?.timeline.length ?? 0, evidence: ev.length, toGet: ev.filter(e => e.status === 'to-get').length, have: ev.filter(e => e.status === 'have').length,
    reviewed: ev.filter(e => e.status === 'reviewed').length, issues: c?.issues.length ?? 0, claiming: (c?.issues ?? []).filter(i => i.status === 'claiming').length };
}
// What's linked to an issue (from the evidence and the timeline entries that name it).
export function issueLinks(p: Project, issueId: string): { evidence: EvidenceItem[]; entries: TimelineEntry[] } {
  return { evidence: (p.case?.evidence ?? []).filter(e => e.issueIds.includes(issueId)), entries: timelineInOrder(p).filter(t => t.issueIds.includes(issueId)) };
}
// How big the project is when saved to your account, in bytes.
export { projectBytes } from './projectSize';

// ---------- Changing it ----------
// Each change returns what happened: an add gives the new id, 'full' (that list's count is reached) or 'big' (the
// project would pass its size budget), or null when there was nothing to add; an edit gives true, false (nothing
// changed) or 'big'. The project's "updated" time moves on with every change.
const proj = (d: MyDayData, id: string) => d.projects.items.find(p => p.id === id) ?? null;
const touch = (p: Project) => { p.updatedAt = localStamp(); };
const fileOf = (p: Project): CaseFile => (p.case ??= { timeline: [], evidence: [], issues: [] });
function tidy(p: Project) { if (p.case && isEmpty(p.case)) delete p.case; }
// Makes a change, and takes it back if an item would exceed its size budget.
function within(p: Project, change: () => void, undo: () => void): boolean {
  const before = projectRecordSizes(p);
  change();
  if (projectRecordsFit(before, p)) return true;
  undo(); tidy(p);
  return false;
}
type Added = string | 'full' | 'big' | null;

export interface NewEntry { date: string; about?: boolean; title: string; details?: string; source?: TimelineSource }
export function addEntry(d: MyDayData, projectId: string, n: NewEntry): Added {
  const p = proj(d, projectId), title = line(n.title, CASE_LIMITS.title);
  if (!p || !title || !isDateKey(n.date)) return null;
  if ((p.case?.timeline.length ?? 0) >= CASE_LIMITS.timeline) return 'full';
  const t: TimelineEntry = { id: 'tl' + uid(), date: n.date, about: !!n.about, title, details: (n.details ?? '').trim().slice(0, CASE_LIMITS.details),
    source: n.source && SOURCES.includes(n.source) ? n.source : 'mine', evidenceIds: [], issueIds: [], createdAt: localStamp() };
  if (!within(p, () => fileOf(p).timeline.push(t), () => { p.case!.timeline.pop(); })) return 'big';
  touch(p);
  return t.id;
}
export function editEntry(d: MyDayData, projectId: string, id: string, patch: Partial<Omit<NewEntry, 'date'>> & { date?: string }): boolean | 'big' {
  const p = proj(d, projectId), t = p?.case?.timeline.find(x => x.id === id);
  if (!p || !t) return false;
  const next = { ...t };
  if (patch.title !== undefined) { const v = line(patch.title, CASE_LIMITS.title); if (v) next.title = v; }
  if (patch.date !== undefined && isDateKey(patch.date)) next.date = patch.date;
  if (patch.about !== undefined) next.about = !!patch.about;
  if (patch.details !== undefined) next.details = patch.details.trim().slice(0, CASE_LIMITS.details);
  if (patch.source !== undefined && SOURCES.includes(patch.source)) next.source = patch.source;
  return replace(p, p.case!.timeline, t, next);
}
function replace<T extends { id: string }>(p: Project, list: T[], old: T, next: T): boolean | 'big' {
  if (JSON.stringify(old) === JSON.stringify(next)) return false;
  const i = list.indexOf(old);
  if (!within(p, () => { list[i] = next; }, () => { list[i] = old; })) return 'big';
  touch(p);
  return true;
}
export function removeEntry(d: MyDayData, projectId: string, id: string): boolean {
  const p = proj(d, projectId);
  if (!p?.case?.timeline.some(x => x.id === id)) return false;
  p.case.timeline = p.case.timeline.filter(x => x.id !== id);
  tidy(p); touch(p);
  return true;
}

export interface NewEvidence { title: string; kind?: EvidenceKind; date?: string | null; where?: string; status?: EvidenceStatus; notes?: string }
export function addEvidence(d: MyDayData, projectId: string, n: NewEvidence): Added {
  const p = proj(d, projectId), title = line(n.title, CASE_LIMITS.title);
  if (!p || !title) return null;
  if ((p.case?.evidence.length ?? 0) >= CASE_LIMITS.evidence) return 'full';
  const e: EvidenceItem = { id: 'ev' + uid(), title, kind: n.kind && KINDS.includes(n.kind) ? n.kind : 'document', date: n.date && isDateKey(n.date) ? n.date : null,
    where: line(n.where, CASE_LIMITS.where), status: n.status && EV_STATUSES.includes(n.status) ? n.status : 'have', notes: (n.notes ?? '').trim().slice(0, CASE_LIMITS.notes), issueIds: [], createdAt: localStamp() };
  if (!within(p, () => fileOf(p).evidence.push(e), () => { p.case!.evidence.pop(); })) return 'big';
  touch(p);
  return e.id;
}
export function editEvidence(d: MyDayData, projectId: string, id: string, patch: Partial<NewEvidence>): boolean | 'big' {
  const p = proj(d, projectId), e = p?.case?.evidence.find(x => x.id === id);
  if (!p || !e) return false;
  const next = { ...e };
  if (patch.title !== undefined) { const v = line(patch.title, CASE_LIMITS.title); if (v) next.title = v; }
  if (patch.kind !== undefined && KINDS.includes(patch.kind)) next.kind = patch.kind;
  if (patch.date !== undefined) next.date = patch.date && isDateKey(patch.date) ? patch.date : null;
  if (patch.where !== undefined) next.where = line(patch.where, CASE_LIMITS.where);
  if (patch.status !== undefined && EV_STATUSES.includes(patch.status)) next.status = patch.status;
  if (patch.notes !== undefined) next.notes = patch.notes.trim().slice(0, CASE_LIMITS.notes);
  return replace(p, p.case!.evidence, e, next);
}
// Removing evidence also takes it off the timeline entries that named it (the entries stay).
export function removeEvidence(d: MyDayData, projectId: string, id: string): boolean {
  const p = proj(d, projectId);
  if (!p?.case?.evidence.some(x => x.id === id)) return false;
  p.case.evidence = p.case.evidence.filter(x => x.id !== id);
  for (const t of p.case.timeline) if (t.evidenceIds.includes(id)) t.evidenceIds = t.evidenceIds.filter(x => x !== id);
  tidy(p); touch(p);
  return true;
}

export function addIssue(d: MyDayData, projectId: string, title: string): Added {
  const p = proj(d, projectId), t = line(title, CASE_LIMITS.issueTitle);
  if (!p || !t) return null;
  if ((p.case?.issues.length ?? 0) >= CASE_LIMITS.issues) return 'full';
  const i: CaseIssue = { id: 'is' + uid(), title: t, status: 'considering', notes: '', createdAt: localStamp() };
  if (!within(p, () => fileOf(p).issues.push(i), () => { p.case!.issues.pop(); })) return 'big';
  touch(p);
  return i.id;
}
export function editIssue(d: MyDayData, projectId: string, id: string, patch: { title?: string; status?: IssueStatus; notes?: string }): boolean | 'big' {
  const p = proj(d, projectId), i = p?.case?.issues.find(x => x.id === id);
  if (!p || !i) return false;
  const next = { ...i };
  if (patch.title !== undefined) { const v = line(patch.title, CASE_LIMITS.issueTitle); if (v) next.title = v; }
  if (patch.status !== undefined && ISSUE_STATUSES.includes(patch.status)) next.status = patch.status;
  if (patch.notes !== undefined) next.notes = patch.notes.trim().slice(0, CASE_LIMITS.issueNotes);
  return replace(p, p.case!.issues, i, next);
}
// Removing an issue takes it off the evidence and timeline entries linked to it (they stay).
export function removeIssue(d: MyDayData, projectId: string, id: string): boolean {
  const p = proj(d, projectId);
  if (!p?.case?.issues.some(x => x.id === id)) return false;
  p.case.issues = p.case.issues.filter(x => x.id !== id);
  for (const x of [...p.case.timeline, ...p.case.evidence]) if (x.issueIds.includes(id)) x.issueIds = x.issueIds.filter(y => y !== id);
  tidy(p); touch(p);
  return true;
}

// Links: a timeline entry to evidence or to an issue, and evidence to an issue. One tap links or unlinks; 'full' when
// that entry or item already has the most links (10 pieces of evidence, 5 issues).
export type LinkKind = 'entry-evidence' | 'entry-issue' | 'evidence-issue';
export function toggleLink(d: MyDayData, projectId: string, kind: LinkKind, fromId: string, toId: string): boolean | 'full' {
  const p = proj(d, projectId), c = p?.case;
  if (!p || !c) return false;
  const from = kind === 'evidence-issue' ? c.evidence.find(x => x.id === fromId) : c.timeline.find(x => x.id === fromId);
  const exists = kind === 'entry-evidence' ? c.evidence.some(x => x.id === toId) : c.issues.some(x => x.id === toId);
  if (!from || !exists) return false;
  const key = kind === 'entry-evidence' ? 'evidenceIds' : 'issueIds', max = kind === 'entry-evidence' ? CASE_LIMITS.evidenceLinks : CASE_LIMITS.issueLinks;
  const list = (from as TimelineEntry)[key];
  if (list.includes(toId)) (from as TimelineEntry)[key] = list.filter(x => x !== toId);
  else { if (list.length >= max) return 'full'; (from as TimelineEntry)[key] = [...list, toId]; }
  touch(p);
  return true;
}
