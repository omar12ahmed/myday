import { isObj } from '../util';
import { emptyCyber, type CyberAttempt, type CyberData } from './types';

const str = (v: unknown, max: number) => typeof v === 'string' ? v.slice(0, max) : '';
const date = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v));
export function cleanAttempt(raw: unknown): CyberAttempt | null {
  if (!isObj(raw) || !str(raw.id, 100) || !str(raw.activityId, 100) || !date(raw.startedAt) || !str(raw.curriculumVersion, 32)) return null;
  if (raw.submittedAt !== null && !date(raw.submittedAt)) return null;
  const answers: Record<string, string> = {};
  if (isObj(raw.answers)) for (const [k, v] of Object.entries(raw.answers).slice(0, 20)) {
    if (/^assessment\.[a-z0-9.-]+$/.test(k) && typeof v === 'string') answers[k.slice(0, 150)] = v.slice(0, 4000);
  }
  return {
    id: str(raw.id, 100), activityId: str(raw.activityId, 100), curriculumVersion: str(raw.curriculumVersion, 32),
    rubricVersion: str(raw.rubricVersion, 32), startedAt: raw.startedAt, submittedAt: raw.submittedAt,
    inputVariant: str(raw.inputVariant, 200), environmentId: str(raw.environmentId, 100),
    assistance: raw.assistance === 'hint' || raw.assistance === 'guided' ? raw.assistance : 'independent',
    evidence: str(raw.evidence, 12000), answers, resumePoint: str(raw.resumePoint, 1000),
    rubricScores: Array.isArray(raw.rubricScores) ? raw.rubricScores.slice(0, 20).map(x => typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.min(100, x)) : 0) : [],
    criticalPassed: typeof raw.criticalPassed === 'boolean' ? raw.criticalPassed : null,
    answerRevealed: raw.answerRevealed === true, assessor: 'self', verified: false,
  };
}
export function normalizeCyber(raw: unknown, report = { dropped: 0 }): CyberData {
  const out = emptyCyber();
  if (raw === undefined) return out;
  if (!isObj(raw)) { report.dropped++; return out; }
  if (typeof raw.pathId === 'string' && /^path\.[a-z0-9-]+$/.test(raw.pathId)) out.pathId = raw.pathId.slice(0, 100);
  const ids = new Set<string>();
  if (raw.attempts !== undefined && !Array.isArray(raw.attempts)) report.dropped++;
  for (const rawAttempt of Array.isArray(raw.attempts) ? raw.attempts : []) {
    const a = cleanAttempt(rawAttempt);
    if (!a || ids.has(a.id)) { report.dropped++; continue; }
    ids.add(a.id); out.attempts.push(a);
  }
  return out;
}
