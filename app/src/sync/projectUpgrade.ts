import { splitProject } from '../data/projectRecords';
import type { Project } from '../data/types';
import { fingerprint } from './records';
import type { Link } from './state';

export interface OriginalProject { id: string; version: number; core_version: number; data: Project }
// Derive each part's original baseline before sending offline edits. Where the old whole-project baseline
// cannot be established, force version checks instead of treating local edits/deletions as new cloud data.
export function upgradeProjectLink(link: Link, originals: OriginalProject[]) {
  if (link.projectProtocol === 2) return;
  for (const original of originals) {
    const key = `project:${original.id}`, base = link.base[key], outgoing = link.out[key];
    if (!base && !outgoing && !link.conflicts[key] && !link.rejected[key]) continue;
    if (base?.f === null && !outgoing) continue; // a known deletion; a newer cloud restoration may simply arrive
    const oldFingerprint = fingerprint(original.data as unknown as Record<string, unknown>);
    const known = (base?.v === original.version && base.f === oldFingerprint)
      || (!!outgoing && !outgoing.del && outgoing.base + 1 === original.version && outgoing.f === oldFingerprint);
    for (const part of splitProject(original.data)) {
      link.base[`${part.kind}:${part.id}`] = { v: known ? (part.kind === 'project' ? original.core_version : 1) : 0,
        ...(typeof part.content.index === 'number' ? { index: part.content.index } : {}), f: known ? fingerprint(part.content) : 'legacy-baseline-unknown' };
    }
  }
  // The latest saved project is the pending change. Old retry payloads use the retired whole-project format.
  for (const table of [link.out, link.conflicts, link.rejected]) {
    for (const key of Object.keys(table)) if (key.startsWith('project:')) delete table[key];
  }
  link.projectProtocol = 2;
  link.cursor = 0; // receive every split record, including children of projects this device had not seen
}
