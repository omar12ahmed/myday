// The wire representation only. Saved projects and exports keep their complete, nested shape.
import type { Project } from './types';

export const PROJECT_KINDS = ['project', 'project_milestone', 'project_decision', 'project_choice', 'project_model',
  'project_case', 'project_issue', 'project_evidence', 'project_timeline'] as const;
export type ProjectKind = typeof PROJECT_KINDS[number];
export interface ProjectContent extends Record<string, unknown> {
  projectId: string;
  decisionId?: string;
  index?: number;
  value: Record<string, unknown>;
}
export interface ProjectRecord { kind: ProjectKind; id: string; content: ProjectContent }

// Length-independent separators: UTF-8 hex also handles imported ids containing colons, dots or Unicode.
// The database uses encode(convert_to(id, 'UTF8'), 'hex') to produce exactly the same identity.
const hex = (id: string) => Array.from(new TextEncoder().encode(id), b => b.toString(16).padStart(2, '0')).join('');
export const projectPartId = (...ids: string[]) => ids.map(hex).join('.');
export function projectPartOwner(kind: string, id: string): { projectId: string; decisionId?: string; itemId?: string } | null {
  if (!PROJECT_KINDS.includes(kind as ProjectKind)) return null;
  if (kind === 'project') return { projectId: id };
  const count = kind === 'project_choice' ? 3 : kind === 'project_model' || kind === 'project_case' ? 1 : 2;
  const parts = id.split('.');
  if (parts.length !== count || parts.some(x => !/^(?:[0-9a-f]{2})+$/.test(x))) return null;
  try {
    const decoded = parts.map(p => new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(p.match(/../g)!, x => parseInt(x, 16))));
    return { projectId: decoded[0], ...(count === 3 ? { decisionId: decoded[1], itemId: decoded[2] } : count === 2 ? { itemId: decoded[1] } : {}) };
  } catch { return null; }
}

const without = (raw: object, keys: string[]): Record<string, unknown> => Object.fromEntries(Object.entries(raw).filter(([key]) => !keys.includes(key)));
export function splitProject(p: Project): ProjectRecord[] {
  const rows: ProjectRecord[] = [{ kind: 'project', id: p.id, content: { projectId: p.id, value: without(p, ['milestones', 'decisions', 'model', 'case']) } }];
  const add = (kind: ProjectKind, value: object, itemId?: string, at?: number, decisionId?: string) => {
    const ids = [p.id, ...(decisionId ? [decisionId] : []), ...(itemId ? [itemId] : [])];
    rows.push({ kind, id: projectPartId(...ids), content: { projectId: p.id, ...(decisionId ? { decisionId } : {}),
      ...(at !== undefined ? { index: at } : {}), value: value as Record<string, unknown> } });
  };
  p.milestones?.forEach((m, i) => add('project_milestone', m, m.id, i));
  p.decisions?.forEach((d, i) => {
    add('project_decision', without(d, ['history']), d.id, i);
    d.history?.forEach((h, j) => add('project_choice', h, h.id, j, d.id));
  });
  if (p.model) add('project_model', p.model);
  if (p.case) {
    add('project_case', without(p.case, ['timeline', 'evidence', 'issues']));
    p.case.issues.forEach((x, i) => add('project_issue', x, x.id, i));
    p.case.evidence.forEach((x, i) => add('project_evidence', x, x.id, i));
    p.case.timeline.forEach((x, i) => add('project_timeline', x, x.id, i));
  }
  return rows;
}

// jsonb::text adds spaces after separators and expands exponent notation. Measure that representation,
// rather than assuming JavaScript's compact JSON has the same byte count as the database constraint.
const utf8 = (text: string) => new TextEncoder().encode(text).length;
function numberBytes(n: number): number {
  const text = JSON.stringify(n);
  if (!/[eE]/.test(text)) return text.length;
  const [coefficient, exponent] = text.toLowerCase().split('e');
  const sign = coefficient.startsWith('-') ? 1 : 0;
  const unsigned = coefficient.slice(sign), dot = unsigned.indexOf('.');
  const digits = unsigned.replace('.', ''), point = (dot < 0 ? unsigned.length : dot) + Number(exponent);
  return sign + (point <= 0 ? 2 - point + digits.length : point >= digits.length ? point : digits.length + 1);
}
export function recordBytes(value: unknown): number {
  if (value === null || value === undefined) return 4;
  if (typeof value === 'number') return Number.isFinite(value) ? numberBytes(value) : 4;
  if (typeof value === 'string' || typeof value === 'boolean') return utf8(JSON.stringify(value));
  if (Array.isArray(value)) return 2 + Math.max(0, value.length - 1) * 2 + value.reduce((n, x) => n + recordBytes(x), 0);
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([, x]) => x !== undefined);
    return 2 + Math.max(0, entries.length - 1) * 2 + entries.reduce((n, [k, x]) => n + utf8(JSON.stringify(k)) + 2 + recordBytes(x), 0);
  }
  return 4;
}
