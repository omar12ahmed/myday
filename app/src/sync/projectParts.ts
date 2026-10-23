// Reassemble split cloud records into the existing nested project shape. No second saved-data store.
import { normalizeModel } from '../data/businessModel';
import { normalizeCase } from '../data/caseFile';
import { normalizeDecisions, normalizeHistory, normalizeMilestones } from '../data/projectPlan';
import { normalizeProjects } from '../data/projects';
import { PROJECT_KINDS, projectPartId, projectPartOwner, type ProjectContent, type ProjectKind } from '../data/projectRecords';
import type { CaseFile, Decision, MyDayData, Project } from '../data/types';
import { isObj } from '../data/util';

export const isProjectKind = (kind: string): kind is ProjectKind => PROJECT_KINDS.includes(kind as ProjectKind);
export function projectAncestors(key: string): string[] {
  const colon = key.indexOf(':'), kind = key.slice(0, colon), id = key.slice(colon + 1), owner = projectPartOwner(kind, id);
  if (!owner || kind === 'project') return [];
  const parents = [`project:${owner.projectId}`];
  if (kind === 'project_choice') parents.push(`project_decision:${projectPartId(owner.projectId, owner.decisionId!)}`);
  if (['project_issue', 'project_evidence', 'project_timeline'].includes(kind)) parents.push(`project_case:${projectPartId(owner.projectId)}`);
  return parents;
}
export const inProjectScope = (key: string, parent: string) => key === parent || projectAncestors(key).includes(parent);
const features = ['milestones', 'decisions', 'model', 'case'];
const indexed = (kind: string) => !['project', 'project_model', 'project_case'].includes(kind);
export function cleanProjectRecord(kind: ProjectKind, id: string, raw: Record<string, unknown>): ProjectContent | null {
  const owner = projectPartOwner(kind, id);
  if (!owner || raw.projectId !== owner.projectId || !isObj(raw.value)
    || (indexed(kind) && (!Number.isSafeInteger(raw.index) || Number(raw.index) < 0))
    || (kind === 'project_choice' && raw.decisionId !== owner.decisionId)) return null;
  const value = raw.value, report = { dropped: 0 };
  if (owner.itemId && value.id !== owner.itemId) return null;
  let clean: object | undefined;
  if (kind === 'project') {
    if (value.id !== id || features.some(key => key in value)) return null;
    clean = normalizeProjects({ items: [value] }, report).items[0];
  } else if (kind === 'project_milestone') clean = normalizeMilestones([value], report)?.[0];
  else if (kind === 'project_decision') {
    if ('history' in value) return null;
    clean = normalizeDecisions([value], report)?.[0];
  } else if (kind === 'project_choice') clean = normalizeHistory([value], report)?.[0];
  else if (kind === 'project_model') clean = normalizeModel(value, report);
  else if (kind === 'project_case') {
    if (['timeline', 'evidence', 'issues'].some(key => key in value)) return null;
    clean = value;
  } else {
    // Linked entries may arrive independently. Stubs validate the identifiers without erasing their links.
    const ids = (key: string) => Array.isArray(value[key]) ? (value[key] as unknown[]).filter((x): x is string => typeof x === 'string') : [];
    const issues = ids('issueIds').map(id => ({ id, title: 'Linked issue' }));
    const evidence = ids('evidenceIds').map(id => ({ id, title: 'Linked evidence' }));
    const c = normalizeCase({ issues: kind === 'project_issue' ? [value] : issues,
      evidence: kind === 'project_evidence' ? [value] : evidence, timeline: kind === 'project_timeline' ? [value] : [] }, report);
    clean = kind === 'project_issue' ? c?.issues[0] : kind === 'project_evidence' ? c?.evidence[0] : c?.timeline[0];
  }
  if (!clean || (owner.itemId && (clean as { id?: string }).id !== owner.itemId)) return null;
  return { ...raw, projectId: owner.projectId, value: clean as Record<string, unknown> } as ProjectContent;
}

function putItem<T extends { id: string }>(list: T[], id: string, value: T | null, index: number) {
  const old = list.findIndex(x => x.id === id);
  if (old >= 0) list.splice(old, 1);
  if (value) list.splice(Math.min(index, list.length), 0, value);
}
export function putProjectRecord(draft: MyDayData, kind: ProjectKind, id: string, content: ProjectContent | null) {
  const owner = projectPartOwner(kind, id);
  if (!owner) return;
  let p = draft.projects.items.find(x => x.id === owner.projectId);
  const at = Number(content?.index ?? 0), value = content?.value;
  if (kind === 'project') {
    const kept = p ? Object.fromEntries(Object.entries(p).filter(([key]) => features.includes(key))) : {};
    const index = draft.projects.items.findIndex(x => x.id === id);
    putItem(draft.projects.items, id, value ? { ...value, ...kept } as unknown as Project : null, index < 0 ? draft.projects.items.length : index);
    return;
  }
  // Batch application always places parents first. An absent/deleted parent is never recreated by a child.
  if (!p) return;
  if (kind === 'project_model') { if (value) p.model = value as unknown as Project['model']; else delete p.model; return; }
  if (kind === 'project_case') {
    if (value) p.case = { ...value, timeline: p.case?.timeline ?? [], evidence: p.case?.evidence ?? [], issues: p.case?.issues ?? [] } as CaseFile;
    else delete p.case;
    return;
  }
  if (kind === 'project_milestone') {
    p.milestones ??= [];
    putItem(p.milestones, owner.itemId!, value as unknown as NonNullable<Project['milestones']>[number] | null, at);
    if (!p.milestones.length) delete p.milestones;
  } else if (kind === 'project_decision') {
    p.decisions ??= [];
    const history = p.decisions.find(x => x.id === owner.itemId)?.history;
    const next = value ? { ...value, ...(history ? { history } : {}) } as unknown as Decision : null;
    putItem(p.decisions, owner.itemId!, next, at);
    if (!p.decisions.length) delete p.decisions;
  } else if (kind === 'project_choice') {
    const d = p.decisions?.find(x => x.id === owner.decisionId);
    if (!d) return;
    d.history ??= [];
    putItem(d.history, owner.itemId!, value as unknown as NonNullable<Decision['history']>[number] | null, at);
    if (!d.history.length) delete d.history;
  } else {
    if (!p.case) return; // a late child must not recreate deleted Case metadata
    const field = kind === 'project_issue' ? 'issues' : kind === 'project_evidence' ? 'evidence' : 'timeline';
    putItem(p.case[field] as { id: string }[], owner.itemId!, value as { id: string } | null, at);
  }
  p = draft.projects.items.find(x => x.id === owner.projectId)!;
  if (p.case && !p.case.timeline.length && !p.case.evidence.length && !p.case.issues.length
    && Object.keys(p.case).every(key => ['timeline', 'evidence', 'issues'].includes(key))) delete p.case;
}

export function projectApplyOrder(a: [string, Record<string, unknown> | null], b: [string, Record<string, unknown> | null]): number {
  const kind = (key: string) => key.slice(0, key.indexOf(':'));
  // Parent tombstones last, so children cannot recreate a removed decision or project.
  const rank = ([key, content]: typeof a) => isProjectKind(kind(key))
    ? (content ? PROJECT_KINDS.indexOf(kind(key) as ProjectKind) : 100 - PROJECT_KINDS.indexOf(kind(key) as ProjectKind)) : -1;
  return rank(a) - rank(b) || Number(a[1]?.index ?? 0) - Number(b[1]?.index ?? 0) || a[0].localeCompare(b[0]);
}

// Keep cloud positions while combining concurrent additions. Equal positions use the record identity as a
// stable tie-breaker. A deliberate local reorder still uses its new positions and goes through version checks.
export function projectPositions(local: Map<string, Record<string, unknown>>, base: Record<string, { index?: number }>): Map<string, number> {
  const groups = new Map<string, [string, number][]>();
  for (const [key, content] of local) {
    const kind = key.slice(0, key.indexOf(':'));
    if (!isProjectKind(kind) || !indexed(kind)) continue;
    const group = `${kind}:${content.projectId}:${content.decisionId ?? ''}`;
    const list = groups.get(group) ?? [];
    list.push([key, Number(content.index)]); groups.set(group, list);
  }
  const positions = new Map<string, number>();
  for (const list of groups.values()) {
    list.sort((a, b) => a[1] - b[1]);
    const expected = [...list].sort((a, b) => (base[a[0]]?.index ?? a[1]) - (base[b[0]]?.index ?? b[1]) || a[0].localeCompare(b[0]));
    const reordered = list.some(([key], i) => key !== expected[i][0]);
    for (const [key, index] of list) positions.set(key, reordered ? index : base[key]?.index ?? index);
  }
  return positions;
}
export function orderProjectParts(draft: MyDayData, positions: Map<string, number>) {
  const group = (kind: ProjectKind, projectId: string, decisionId?: string) => (a: { id: string }, b: { id: string }) => {
    const key = (id: string) => `${kind}:${projectPartId(projectId, ...(decisionId ? [decisionId] : []), id)}`;
    return (positions.get(key(a.id)) ?? Number.MAX_SAFE_INTEGER) - (positions.get(key(b.id)) ?? Number.MAX_SAFE_INTEGER)
      || key(a.id).localeCompare(key(b.id));
  };
  for (const p of draft.projects.items) {
    p.milestones?.sort(group('project_milestone', p.id));
    p.decisions?.sort(group('project_decision', p.id));
    for (const d of p.decisions ?? []) d.history?.sort(group('project_choice', p.id, d.id));
    p.case?.issues.sort(group('project_issue', p.id));
    p.case?.evidence.sort(group('project_evidence', p.id));
    p.case?.timeline.sort(group('project_timeline', p.id));
  }
}
