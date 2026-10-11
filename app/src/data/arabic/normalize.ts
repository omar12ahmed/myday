import { isDateKey } from '../dates';
import { intIn, isObj } from '../util';
import { ARABIC_CORE_PATH, emptyArabic, MODALITIES, VARIANTS, type ArabicAttempt, type ArabicCard, type ArabicData, type Help } from './types';

// Arabic records are checked like everything else MyDay opens: anything malformed is dropped (and counted),
// never guessed at, and nothing from another course can slip in. Fields a newer MyDay adds to the section are
// kept as they are, so going back a version never loses them.
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const stamp = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v));
const QUESTION = /^(assessment|asset)\.arabic-[a-z0-9.-]{1,140}$/;
const HELP: Help[] = ['independent', 'hint', 'guided'];

export function cleanArabicAttempt(raw: unknown): ArabicAttempt | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(raw.id)) return null;
  if (typeof raw.lessonId !== 'string' || !/^lesson\.arabic-[a-z0-9-]{1,100}$/.test(raw.lessonId)) return null;
  if (typeof raw.curriculumVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(raw.curriculumVersion) || !stamp(raw.startedAt)) return null;
  if (raw.finishedAt !== null && !stamp(raw.finishedAt)) return null;
  const answers: Record<string, string> = {};
  if (isObj(raw.answers)) for (const [k, v] of Object.entries(raw.answers).slice(0, 40)) if (QUESTION.test(k) && typeof v === 'string') answers[k] = v.slice(0, 4000);
  const list = <T extends string>(v: unknown, ok: (x: unknown) => x is T, max: number): T[] => (Array.isArray(v) ? [...new Set(v.filter(ok))].slice(0, max) : []);
  return {
    id: raw.id, lessonId: raw.lessonId, curriculumVersion: raw.curriculumVersion,
    variant: VARIANTS.includes(raw.variant as never) ? (raw.variant as ArabicAttempt['variant']) : 'standard',
    startedAt: raw.startedAt, finishedAt: raw.finishedAt,
    help: HELP.includes(raw.help as never) ? (raw.help as Help) : 'independent',
    practised: list(raw.practised, (x): x is ArabicAttempt['practised'][number] => MODALITIES.includes(x as never), 4),
    answers,
    revealed: list(raw.revealed, (x): x is string => typeof x === 'string' && QUESTION.test(x), 40),
    revisit: str(raw.revisit, 1000),
  };
}

// A revision card: a starter word one way round, or a check question, by the course's own ids (≤ 64 characters, so
// each fits a sync record's id). Its schedule is read the way a concept's is.
const CARD = /^(lexeme\.arabic-[a-z0-9-]{1,40}:(recognise|write)|assessment\.arabic-[a-z0-9-]{1,48}\.q\d{1,2})$/;
export function cleanArabicCard(raw: unknown): ArabicCard | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || raw.id.length > 64 || !CARD.test(raw.id) || !isDateKey(raw.addedOn)) return null;
  const rv = isObj(raw.review) ? raw.review : {};
  return {
    id: raw.id, addedOn: raw.addedOn,
    review: { reps: intIn(rv.reps, 0, 100000, 0), interval: intIn(rv.interval, 0, 365, 0), lapses: intIn(rv.lapses, 0, 100000, 0), due: isDateKey(rv.due) ? rv.due : null },
  };
}

export function normalizeArabic(raw: unknown, report = { dropped: 0 }): ArabicData {
  if (raw === undefined) return emptyArabic();
  if (!isObj(raw)) { report.dropped++; return emptyArabic(); }
  const out: ArabicData = { ...raw, ...emptyArabic() };
  out.pathId = typeof raw.pathId === 'string' && /^path\.arabic-[a-z0-9-]{1,100}$/.test(raw.pathId) ? raw.pathId : ARABIC_CORE_PATH;
  if (raw.attempts !== undefined && !Array.isArray(raw.attempts)) report.dropped++;
  const ids = new Set<string>();
  for (const r of Array.isArray(raw.attempts) ? raw.attempts : []) {
    const a = cleanArabicAttempt(r);
    if (!a || ids.has(a.id)) { report.dropped++; continue; }
    ids.add(a.id); out.attempts.push(a);
  }
  if (raw.cards !== undefined && !Array.isArray(raw.cards)) report.dropped++;
  const cardIds = new Set<string>();
  for (const r of Array.isArray(raw.cards) ? raw.cards.slice(0, 2000) : []) {
    const c = cleanArabicCard(r);
    if (!c || cardIds.has(c.id)) { report.dropped++; continue; }
    cardIds.add(c.id); out.cards.push(c);
  }
  return out;
}
