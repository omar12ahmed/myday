import { isObj } from '../util';
import { ARABIC_CORE_PATH, emptyArabic, MODALITIES, VARIANTS, type ArabicAttempt, type ArabicData, type Help } from './types';

// Arabic records are checked like everything else MyDay opens: anything malformed is dropped (and counted),
// never guessed at, and nothing from another course can slip in.
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

export function normalizeArabic(raw: unknown, report = { dropped: 0 }): ArabicData {
  const out = emptyArabic();
  if (raw === undefined) return out;
  if (!isObj(raw)) { report.dropped++; return out; }
  out.pathId = typeof raw.pathId === 'string' && /^path\.arabic-[a-z0-9-]{1,100}$/.test(raw.pathId) ? raw.pathId : ARABIC_CORE_PATH;
  if (raw.attempts !== undefined && !Array.isArray(raw.attempts)) report.dropped++;
  const ids = new Set<string>();
  for (const r of Array.isArray(raw.attempts) ? raw.attempts : []) {
    const a = cleanArabicAttempt(r);
    if (!a || ids.has(a.id)) { report.dropped++; continue; }
    ids.add(a.id); out.attempts.push(a);
  }
  return out;
}
