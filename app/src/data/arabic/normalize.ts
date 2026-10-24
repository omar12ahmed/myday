import { isDateKey } from '../dates';
import { intIn, isObj } from '../util';
import { cleanAnotherWay } from '../study/anotherWay';
import type { Outcome, Support } from '../types';
import { ARABIC_CORE_PATH, emptyArabic, MODALITIES, VARIANTS, type ArabicAttempt, type ArabicCard, type ArabicData, type ArabicLesson, type ArabicMark, type ArabicPractice, type Help, type PracticeStep, type KeptWord, type Review, KEPT_FROM } from './types';

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
  const another = cleanAnotherWay(raw.anotherWay);
  return {
    id: raw.id, addedOn: raw.addedOn,
    review: { reps: intIn(rv.reps, 0, 100000, 0), interval: intIn(rv.interval, 0, 365, 0), lapses: intIn(rv.lapses, 0, 100000, 0), due: isDateKey(rv.due) ? rv.due : null },
    ...(another ? { anotherWay: another } : {}),
  };
}

const review = (rv: unknown): Review => {
  const r = isObj(rv) ? rv : {};
  return { reps: intIn(r.reps, 0, 100000, 0), interval: intIn(r.interval, 0, 365, 0), lapses: intIn(r.lapses, 0, 100000, 0), due: isDateKey(r.due) ? r.due : null };
};
// A word you kept: its id is the sync record's; the Arabic needs an Arabic letter; your meaning is required. Anything
// else malformed is left out of the word, never the word dropped for it.
const KEPT = /^kw[a-z0-9]{6,30}$/, ARABIC_LETTER = /[\u0621-\u064A\u0671-\u06D3]/;
export function cleanKeptWord(raw: unknown): KeptWord | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !KEPT.test(raw.id) || !isDateKey(raw.addedOn)) return null;
  const ar = str(raw.ar, 60).trim().normalize('NFC'), meaning = str(raw.meaning, 120).trim();
  if (!ar || !ARABIC_LETTER.test(ar) || !meaning) return null;
  const note = str(raw.note, 300).trim();
  return {
    id: raw.id, ar, meaning, ...(note ? { note } : {}), ...(typeof raw.from === 'string' && KEPT_FROM.test(raw.from) ? { from: raw.from } : {}),
    addedOn: raw.addedOn, recognise: review(raw.recognise), write: isObj(raw.write) ? review(raw.write) : null,
  };
}

// Your place on a lesson (adaptive Study). Its id is the lesson's (≤ 64 characters, the sync record's id); a mark
// is kept only for one of that lesson's own checks, with an outcome and support revision knows.
const LESSON = /^lesson\.arabic-[a-z0-9-]{1,50}$/;
const OUTCOMES: Outcome[] = ['right', 'partly', 'wrong', 'notsure'];
const SUPPORTS: Support[] = ['own', 'hint', 'notes'];
export function cleanArabicLesson(raw: unknown): ArabicLesson | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !LESSON.test(raw.id)) return null;
  const out: ArabicLesson = { id: raw.id };
  if (isDateKey(raw.readyOn)) out.readyOn = raw.readyOn;
  const rv = raw.revisit;
  if (isObj(rv) && isDateKey(rv.since)) out.revisit = { since: rv.since, what: str(rv.what, 300) };
  if (isObj(raw.marks)) {
    const own = `assessment.${raw.id.slice('lesson.'.length)}-check.q`, marks: Record<string, ArabicMark> = {};
    for (const [q, m] of Object.entries(raw.marks).slice(0, 40)) {
      if (!q.startsWith(own) || !/^\d{1,2}$/.test(q.slice(own.length)) || !isObj(m)) continue;
      if (!OUTCOMES.includes(m.outcome as Outcome) || !SUPPORTS.includes(m.support as Support) || !isDateKey(m.on)) continue;
      if (typeof m.attemptId !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(m.attemptId)) continue;
      marks[q] = { outcome: m.outcome as Outcome, support: m.support as Support, on: m.on, attemptId: m.attemptId };
    }
    if (Object.keys(marks).length) out.marks = marks;
  }
  return out;
}

// Practise again on a lesson: its id is the lesson's (the sync record's); days are kept only as days, ticks only for a
// session id and the two steps; a schedule only with the day it joined. One with nothing left in it isn't kept.
const STEPS: PracticeStep[] = ['try', 'challenge'];
export function cleanArabicPractice(raw: unknown): ArabicPractice | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !LESSON.test(raw.id)) return null;
  const out: ArabicPractice = { id: raw.id };
  if (isDateKey(raw.tried)) out.tried = raw.tried;
  if (isDateKey(raw.challenged)) out.challenged = raw.challenged;
  const o = raw.open;
  if (isObj(o) && typeof o.attemptId === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(o.attemptId) && Array.isArray(o.did)) {
    const did = STEPS.filter(s => (o.did as unknown[]).includes(s));
    if (did.length) out.open = { attemptId: o.attemptId, did };
  }
  if (isDateKey(raw.addedOn) && isObj(raw.review)) { out.addedOn = raw.addedOn; out.review = review(raw.review); }
  return out.tried || out.challenged || out.open || out.review ? out : null;
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
  // Absent until first used, and left absent: older data stays exactly as it was.
  delete out.lessons;
  if (raw.lessons !== undefined) {
    out.lessons = [];
    if (!Array.isArray(raw.lessons)) report.dropped++;
    const lessonIds = new Set<string>();
    for (const r of Array.isArray(raw.lessons) ? raw.lessons.slice(0, 500) : []) {
      const l = cleanArabicLesson(r);
      if (!l || lessonIds.has(l.id)) { report.dropped++; continue; }
      lessonIds.add(l.id); out.lessons.push(l);
    }
  }
  delete out.practice;
  if (raw.practice !== undefined) {
    out.practice = [];
    if (!Array.isArray(raw.practice)) report.dropped++;
    const practiceIds = new Set<string>();
    for (const r of Array.isArray(raw.practice) ? raw.practice.slice(0, 500) : []) {
      const p = cleanArabicPractice(r);
      if (!p || practiceIds.has(p.id)) { report.dropped++; continue; }
      practiceIds.add(p.id); out.practice.push(p);
    }
  }
  delete out.words;
  if (raw.words !== undefined) {
    out.words = [];
    if (!Array.isArray(raw.words)) report.dropped++;
    const wordIds = new Set<string>();
    for (const r of Array.isArray(raw.words) ? raw.words.slice(0, 2000) : []) {
      const w = cleanKeptWord(r);
      if (!w || wordIds.has(w.id)) { report.dropped++; continue; }
      wordIds.add(w.id); out.words.push(w);
    }
  }
  return out;
}
