import { isDateKey } from '../dates';
import { intIn, isObj } from '../util';
import { cleanAnotherWay } from '../study/anotherWay';
import { emptyCyber, PORTFOLIO_FILES, type CyberAttempt, type CyberCard, type CyberData, type PortfolioEntry } from './types';

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
  const another = cleanAnotherWay(raw.anotherWay);
  return {
    id: raw.id, addedOn: raw.addedOn,
    review: { reps: intIn(rv.reps, 0, 100000, 0), interval: intIn(rv.interval, 0, 365, 0), lapses: intIn(rv.lapses, 0, 100000, 0), due: isDateKey(rv.due) ? rv.due : null },
    ...(another ? { anotherWay: another } : {}),
  };
}

// Fields a newer MyDay adds to the section are kept as they are, so going back a version never loses them.
// A portfolio entry: its id is the sync record's; it needs its attempt, its activity, a title and the day you reviewed
// it. File ids are kept only in the shared records' form, at most 5; anything else malformed is left out of the entry,
// and fields a newer MyDay adds are kept.
const PF = /^pf[a-z0-9]{6,30}$/, FILE_ID = /^fl[a-z0-9]{6,40}$/;
export function cleanPortfolioEntry(raw: unknown): PortfolioEntry | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !PF.test(raw.id) || !isDateKey(raw.reviewedOn)) return null;
  if (typeof raw.attemptId !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(raw.attemptId) || typeof raw.activityId !== 'string' || !/^[a-z]+\.[a-z0-9.-]{1,120}$/.test(raw.activityId)) return null;
  const title = str(raw.title, 120).trim();
  if (!title) return null;
  const ids = Array.isArray(raw.fileIds) ? [...new Set(raw.fileIds.filter((x): x is string => typeof x === 'string' && FILE_ID.test(x)))].slice(0, PORTFOLIO_FILES) : [];
  // Fields a newer MyDay adds to an entry are kept as they are (so an edit here never strips them).
  const out: PortfolioEntry = { ...raw, id: raw.id, attemptId: raw.attemptId, activityId: raw.activityId, title, evidence: str(raw.evidence, 12000), note: str(raw.note, 1000), reviewedOn: raw.reviewedOn };
  if (ids.length) out.fileIds = ids; else delete out.fileIds;
  return out;
}

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
  // Absent until first used, and left absent: older data stays exactly as it was.
  delete out.portfolio;
  if (raw.portfolio !== undefined) {
    out.portfolio = [];
    if (!Array.isArray(raw.portfolio)) report.dropped++;
    const entryIds = new Set<string>();
    for (const r of Array.isArray(raw.portfolio) ? raw.portfolio.slice(0, 1000) : []) {
      const e = cleanPortfolioEntry(r);
      if (!e || entryIds.has(e.id)) { report.dropped++; continue; }
      entryIds.add(e.id); out.portfolio.push(e);
    }
  }
  return out;
}
