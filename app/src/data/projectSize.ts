import type { Project } from './types';
import { recordBytes, splitProject } from './projectRecords';

// Per split record, with headroom below the database's 524,288-byte allowance. No whole-project cap.
export const PROJECT_SIZE_BUDGET = 380_000;
export const projectBytes = (p: Project) => new TextEncoder().encode(JSON.stringify(p)).length;
export const projectRecordSizes = (p: Project) => new Map(splitProject(p).map(r => [`${r.kind}:${r.id}`, recordBytes(r.content)]));
export function projectRecordsFit(before: Map<string, number>, next: Project): boolean {
  return splitProject(next).every(r => {
    const key = `${r.kind}:${r.id}`, bytes = recordBytes(r.content), previous = before.get(key);
    const validId = r.kind === 'project' ? /^[A-Za-z0-9_.:-]{1,64}$/.test(r.id) : r.id.length <= 2048;
    return (validId && bytes <= PROJECT_SIZE_BUDGET) || (previous !== undefined && bytes <= previous);
  });
}
export function projectChangesFit(before: Project[], after: Project[]): boolean {
  return after.every(p => projectRecordsFit(before.some(x => x.id === p.id)
    ? projectRecordSizes(before.find(x => x.id === p.id)!) : new Map(), p));
}
