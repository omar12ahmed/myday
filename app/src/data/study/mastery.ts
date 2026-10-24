// Adaptive Study's rules, the same for every guided subject (Arabic first; Cybersecurity and your own courses later):
// a lesson's state, when it "looks ready", the next step and why, how long a session to suggest, and where cards
// that join revision by themselves land. Nothing here saves anything or knows a subject: each subject passes in its
// own evidence (data/arabic/lessons.ts). States are places in words, never scores (specs/adaptive-study.md).
import { shift } from '../dates';
import type { DateKey, Outcome, Rating, Support } from '../types';

export type LessonState = 'new' | 'practised' | 'ready' | 'holding' | 'needs-revision';
export const STATE_LABEL: Record<LessonState, string> = {
  'new': 'New', 'practised': 'Practised', 'ready': 'Ready to move on', 'holding': 'Holding', 'needs-revision': 'Needs revision',
};
// After you mark a lesson ready, its checks come back this many days later; recalling them on your own then makes it Holding.
export const DELAYED_CHECK_DAYS = 7;
// At most this many cards come back for the first time on any one day (the course suggests 3–8 new items a day).
export const NEW_CARDS_A_DAY = 8;

// One answer to one check: in revision (it has a rating) or your "How did it go?" mark in a session.
export interface CheckAnswer { date: DateKey; outcome: Outcome | null; support: Support; rating?: Rating }
export interface LessonEvidence {
  finished: number;                         // finished sessions on the lesson
  readyOn: DateKey | null;                  // the day you marked it ready to move on
  flagged: boolean;                         // your own "Needs revision" flag
  checks: string[];                         // the lesson's check ids
  answers: Record<string, CheckAnswer[]>;   // by check id, oldest first
}
export const struggled = (a: CheckAnswer) => a.outcome === 'wrong' || a.outcome === 'notsure' || a.rating === 'again';
const onOwn = (a: CheckAnswer) => a.outcome === 'right' && a.support === 'own';

// The first that applies: Needs revision, Holding, Ready, Practised, New. Only answers from after the Ready day count
// for a lesson marked ready: a mark made earlier that day was before you decided. A check slips when, since then, it
// was answered Not right, Not sure or Again; it stays slipped until you recall it on your own (a right answer with a
// hint isn't enough). Holding needs each check recalled on your own in revision (not a session mark) a week or more
// after Ready, with no slip since.
export function lessonState(e: LessonEvidence): LessonState {
  if (e.flagged) return 'needs-revision';
  if (e.readyOn) {
    const ready = e.readyOn, after = (id: string) => (e.answers[id] ?? []).filter(a => a.date > ready);
    const slipped = (id: string) => { const list = after(id), i = list.map(struggled).lastIndexOf(true); return i >= 0 && !list.slice(i + 1).some(onOwn); };
    if (e.checks.some(slipped)) return 'needs-revision';
    const holdFrom = shift(ready, DELAYED_CHECK_DAYS);
    if (e.checks.length > 0 && e.checks.every(id => after(id).some(a => a.rating !== undefined && a.date >= holdFrom && onOwn(a)))) return 'holding';
    return 'ready';
  }
  return e.finished > 0 ? 'practised' : 'new';
}
export const isDone = (s: LessonState) => s === 'ready' || s === 'holding';

// "Looks ready to move on": every check of the lesson marked Right, on my own, in this session. A suggestion only.
export const looksReady = (checks: string[], marks: Record<string, { outcome: Outcome; support: Support }>) =>
  checks.length > 0 && checks.every(id => marks[id]?.outcome === 'right' && marks[id]?.support === 'own');

// ---------- The next step ----------
export type StepKind = 'resume' | 'revisit' | 'revise' | 'lesson' | 'complete';
export interface Step {
  kind: StepKind;
  lessonId: string;     // the lesson to open (for "revise", the lesson that comes after revision)
  because?: string;     // revisit: the lesson that builds on it
  state: LessonState;   // the lesson's state
  due: number;          // revision ready today in this subject
  waiting?: number;     // complete: how many lessons on the path need revision
}
export interface StepInput {
  path: string[];                           // the lessons on your path, in course order
  state: (lessonId: string) => LessonState;
  open: string | null;                      // a lesson on the path with a session open
  buildsOn: (lessonId: string) => string[]; // the lessons it builds on directly (content only, never checkpoints)
  due: number;                              // revision ready today in this subject
  stopped: boolean;                         // today's gentle stop is reached
}
// In order: resume an open session; revisit a lesson the next one builds on that needs revision; revise what's due;
// the first lesson that's New or Practised. With nothing left, say so.
export function nextStep(i: StepInput): Step | null {
  if (!i.path.length) return null;
  const step = (kind: StepKind, lessonId: string, because?: string): Step => ({ kind, lessonId, because, state: i.state(lessonId), due: i.due });
  if (i.open && i.path.includes(i.open)) return step('resume', i.open);
  const next = i.path.find(id => { const s = i.state(id); return s === 'new' || s === 'practised'; });
  if (next) {
    const weak = i.buildsOn(next).find(id => i.state(id) === 'needs-revision');
    if (weak) return step('revisit', weak, next);
    if (i.due > 0 && !i.stopped) return step('revise', next);
    return step('lesson', next);
  }
  const weak = i.path.filter(id => i.state(id) === 'needs-revision');
  return { ...step('complete', weak[0] ?? i.path[0]), waiting: weak.length };
}

// The reason, in words, for "Why this?". `title` turns a lesson id into its title; `what` is your note on a flag.
export function stepReason(s: Step, title: (lessonId: string) => string, what?: string): string {
  if (s.kind === 'resume') return 'You have a session open on this lesson.';
  if (s.kind === 'revisit') return `${title(s.because!)} builds on this lesson, which needs revision${what ? `: ${what}` : ''}.`;
  if (s.kind === 'revise') return `${s.due} ${s.due === 1 ? 'card is' : 'cards are'} back in revision today; a few minutes keeps them. The next lesson is right underneath.`;
  if (s.kind === 'complete') return !s.waiting ? 'Every lesson on your path is ready to move on. Revision keeps them, or revisit any lesson.'
    : s.waiting === 1 ? 'Every other lesson on your path is ready to move on; this one needs revision.'
    : `${s.waiting} lessons on your path need revision, and this is the first; the rest are ready to move on.`;
  return s.state === 'practised' ? 'You’ve practised this. Mark it ready when it clicks.' : 'Next on your path.';
}

// ---------- How long a session to suggest ----------
// From Study's own suggested length (energy and free time, data/study/sessions.ts suggestLength): the standard session
// if it fits; otherwise, for a lesson you've already practised, the practical one (usually 30 minutes) when that fits;
// then the short session (usually 15 minutes), or the revision session for a revisit; when even the short one doesn't
// fit, the revision session (usually 10 minutes). A new lesson never gets the practical one: it skips the teaching.
export type Length = 'standard' | 'practical' | 'short' | 'revision';
export function lengthFor(suggested: number, minutes: { standard: number; short: number; practical?: number }, revisit: boolean): Length {
  if (suggested >= minutes.standard) return 'standard';
  if (!revisit && minutes.practical && suggested >= minutes.practical) return 'practical';
  if (!revisit && suggested >= minutes.short) return 'short';
  return 'revision';
}

// ---------- Light, Normal and Deep: three names over the session lengths ----------
// Light is the 10- and 15-minute sessions, Normal the practical one, Deep the standard and extended ones
// (specs/study-home-and-lessons.md §5). Only names: the length you choose is what's saved, as before.
export type Mode = 'light' | 'normal' | 'deep';
export const MODE_LABEL: Record<Mode, string> = { light: 'Light', normal: 'Normal', deep: 'Deep' };
export const modeOf = (length: string): Mode => (length === 'revision' || length === 'short' ? 'light' : length === 'practical' ? 'normal' : 'deep');

// ---------- The lesson journey ----------
// One lesson page in steps: Warm-up (recall the previous lesson), Understand, Try, Check and Reflect. The session's
// length decides which show first; the others stay one tap away. Reflect is there while a session is open or just
// finished.
export type JourneyStep = 'warmup' | 'understand' | 'try' | 'check' | 'reflect';
export const JOURNEY: JourneyStep[] = ['warmup', 'understand', 'try', 'check', 'reflect'];
export const STEP_LABEL: Record<JourneyStep, string> = { warmup: 'Warm-up', understand: 'Understand', try: 'Try', check: 'Check', reflect: 'Reflect' };
export function stepsFor(length: string): JourneyStep[] {
  if (length === 'revision') return ['warmup', 'check'];
  if (length === 'short') return ['understand', 'check'];
  if (length === 'practical') return ['try', 'check'];
  return ['warmup', 'understand', 'try', 'check'];
}

// ---------- Where cards that join by themselves land ----------
// The first day from `from` with room: fewer than NEW_CARDS_A_DAY cards coming back for the first time. `firstDue`
// is every card in revision that hasn't been answered yet (its first due day); cards placed by this call count too.
export function placeNewCards(firstDue: (DateKey | null)[], from: DateKey, n: number, limit = NEW_CARDS_A_DAY): DateKey[] {
  const count = new Map<DateKey, number>();
  for (const d of firstDue) if (d) count.set(d, (count.get(d) ?? 0) + 1);
  const out: DateKey[] = [];
  let day = from;
  for (let i = 0; i < n; i++) {
    while ((count.get(day) ?? 0) >= limit) day = shift(day, 1);
    out.push(day);
    count.set(day, (count.get(day) ?? 0) + 1);
  }
  return out;
}
