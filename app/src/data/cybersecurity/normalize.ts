import { isDateKey } from '../dates';
import { intIn, isObj } from '../util';
import { emptyCyber, type CyberAttempt, type CyberCard, type CyberData } from './types';

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
// A revision card: a knowledge-check question by the course's own id (≤ 64 characters, so it fits a sync record's id),
// with its schedule read the way a concept's is.
const CARD = /^assessment\.[a-z0-9-]{1,48}-check\.q\d{1,2}$/;
export function cleanCyberCard(raw: unknown): CyberCard | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || raw.id.length > 64 || !CARD.test(raw.id) || !isDateKey(raw.addedOn)) return null;
  const rv = isObj(raw.review) ? raw.review : {};
  return {
    id: raw.id, addedOn: raw.addedOn,
    review: { reps: intIn(rv.reps, 0, 100000, 0), interval: intIn(rv.interval, 0, 365, 0), lapses: intIn(rv.lapses, 0, 100000, 0), due: isDateKey(rv.due) ? rv.due : null },
  };
}

// Fields a newer MyDay adds to the section are kept as they are, so going back a version never loses them.
export function normalizeCyber(raw: unknown, report = { dropped: 0 }): CyberData {
  if (raw === undefined) return emptyCyber();
  if (!isObj(raw)) { report.dropped++; return emptyCyber(); }
  const out: CyberData = { ...raw, ...emptyCyber() };
  if (typeof raw.pathId === 'string' && /^path\.[a-z0-9-]+$/.test(raw.pathId)) out.pathId = raw.pathId.slice(0, 100);
  const ids = new Set<string>();
  if (raw.attempts !== undefined && !Array.isArray(raw.attempts)) report.dropped++;
  for (const rawAttempt of Array.isArray(raw.attempts) ? raw.attempts : []) {
    const a = cleanAttempt(rawAttempt);
    if (!a || ids.has(a.id)) { report.dropped++; continue; }
    ids.add(a.id); out.attempts.push(a);
  }
  if (raw.cards !== undefined && !Array.isArray(raw.cards)) report.dropped++;
  const cardIds = new Set<string>();
  for (const r of Array.isArray(raw.cards) ? raw.cards.slice(0, 2000) : []) {
    const c = cleanCyberCard(r);
    if (!c || cardIds.has(c.id)) { report.dropped++; continue; }
    cardIds.add(c.id); out.cards.push(c);
  }
  return out;
}
