// The Arabic course's adaptive next step, for the learning map, a lesson page and Today's Study card: the course's
// facts from the catalogue, your records (data/arabic/lessons.ts) and the shared rules (data/study/mastery.ts).
// Worked out on the device each time; nothing here is saved and nothing is sent.
import { todayKey } from '../../data/dates';
import { checkIds, evidence, lessonRecord, stateOf } from '../../data/arabic/lessons';
import { practiceOf } from '../../data/arabic/practice';
import type { Variant } from '../../data/arabic/types';
import { isDone, lengthFor, lessonState, nextStep, onOwn, stepReason, stepsFor, type JourneyStep, type LessonState, type Step } from '../../data/study/mastery';
import { dueIds } from '../../data/study/queue';
import { DAILY_ENOUGH, reviewedOn } from '../../data/study/revision';
import { suggestLength } from '../../data/study/sessions';
import type { DateKey, MyDayData } from '../../data/types';
import { corePath, lessonIndex, milestones, moduleList, paths, skills } from './catalogue';

export const checksOf = (lessonId: string) => checkIds(lessonId, lessonIndex[lessonId]?.checks ?? 0);
// The lessons a lesson builds on directly: the ones teaching its content skills (never a checkpoint).
export const buildsOn = (lessonId: string) => [...new Set((lessonIndex[lessonId]?.builds_on ?? [])
  .map(s => skills['skill.arabic-' + s]?.taught_by_lesson_ids[0]).filter((id): id is string => !!id && id !== lessonId))];
export const arabicState = (d: MyDayData, lessonId: string): LessonState => stateOf(d, lessonId, checksOf(lessonId));

// Your path's lessons in course order (optional lessons aside).
export function pathLessons(pathId: string): string[] {
  const path = paths.get(pathId) ?? corePath;
  return [...moduleList].filter(m => path.required_module_ids.includes(m.id)).sort((a, b) => a.sequence - b.sequence)
    .flatMap(m => m.lesson_ids.filter(id => !lessonIndex[id].optional));
}

// How long a session to suggest on a lesson: energy and free time decide (suggestLength), a lesson that needs
// revision gets the revision session, and the practical one is offered only once you've practised the lesson (a new
// lesson never gets it: it skips the teaching). The reasons are suggestLength's own ("energy 2 today").
export function lengthOn(lessonId: string, suggested: { minutes: number; why: string[] }, state: LessonState, revisit: boolean): { variant: Variant; minutes: number; why: string[] } {
  const l = lessonIndex[lessonId];
  const len = lengthFor(suggested.minutes, { standard: l.minutes, short: l.short, practical: state !== 'new' ? l.practical : undefined }, revisit);
  return { variant: len, minutes: { standard: l.minutes, practical: l.practical, short: l.short, revision: l.revision }[len], why: suggested.why };
}
export const lessonLength = (d: MyDayData, lessonId: string, revisit: boolean) =>
  lengthOn(lessonId, suggestLength(d, lessonIndex[lessonId].minutes), arabicState(d, lessonId), revisit);

// ---------- The lesson journey ----------
// The warm-up is the lesson before this one on your path, when it has checks and you've studied it: its first two.
export function warmUpFrom(d: MyDayData, lessonId: string): string | null {
  const path = pathLessons(d.arabic.pathId), i = path.indexOf(lessonId), prev = i > 0 ? path[i - 1] : null;
  return prev && lessonIndex[prev].checks > 0 && arabicState(d, prev) !== 'new' ? prev : null;
}
// The steps a lesson has (a warm-up and checks only when there are some), and the ones a session of this length
// shows first, with Reflect while a session is open or just finished.
export function lessonSteps(d: MyDayData, lessonId: string): JourneyStep[] {
  const warm = !!warmUpFrom(d, lessonId), checks = (lessonIndex[lessonId]?.checks ?? 0) > 0;
  return (['warmup', 'understand', 'try', 'check'] as const).filter(s => (s === 'warmup' ? warm : s === 'check' ? checks : true));
}
export function journeyFor(d: MyDayData, lessonId: string, length: string, reflect: boolean): JourneyStep[] {
  const has = lessonSteps(d, lessonId);
  return [...stepsFor(length).filter(s => has.includes(s)), ...(reflect ? ['reflect' as const] : [])];
}

// `complete`: every lesson on your path is ready to move on or holding (true even while a session is open).
export interface ArabicPlan { step: Step; reason: string; length: { variant: Variant; minutes: number; why: string[] }; complete: boolean }
export function arabicPlan(d: MyDayData, k: DateKey = todayKey()): ArabicPlan | null {
  const path = pathLessons(d.arabic.pathId), cache = new Map<string, LessonState>();
  const state = (id: string) => { if (!cache.has(id)) cache.set(id, arabicState(d, id)); return cache.get(id)!; };
  const open = d.arabic.attempts.filter(a => !a.finishedAt && path.includes(a.lessonId)).pop()?.lessonId ?? null;
  const step = nextStep({ path, state, open, buildsOn, due: dueIds(d, k, 'arabic').length, stopped: reviewedOn(d.study, k) >= DAILY_ENOUGH });
  if (!step) return null;
  const what = lessonRecord(d, step.lessonId)?.revisit?.what;
  return {
    step, reason: stepReason(step, id => lessonIndex[id]?.title ?? id, what),
    length: lessonLength(d, step.lessonId, step.kind === 'revisit' || step.state === 'needs-revision'),
    complete: path.every(id => isDone(state(id))),
  };
}

// A module on the map, as a place: unexplored (nothing yet), being explored, or visited (every core lesson ready to
// move on or holding), with counts in words. Never a percentage.
export type Place = 'unexplored' | 'exploring' | 'visited';
export function moduleProgress(d: MyDayData, lessonIds: string[]) {
  const core = lessonIds.filter(id => !lessonIndex[id].optional), states = lessonIds.map(id => arabicState(d, id));
  const ready = states.filter(isDone).length, needs = states.filter(s => s === 'needs-revision').length;
  const touched = states.some(s => s !== 'new') || d.arabic.attempts.some(a => lessonIds.includes(a.lessonId));
  const place: Place = !touched ? 'unexplored' : core.length > 0 && core.every(id => isDone(arabicState(d, id))) ? 'visited' : 'exploring';
  return { place, ready, needs };
}

// ---------- Progress (specs/study-home-and-lessons.md §11) ----------
// Where you stand on your path, in words and counts: what's done, what's on your own, what needs revision and why
// (your flag or a check that slipped, how many checks your latest answer got on your own, whether you've done its
// Try), and the next milestone (the course's levels, each ending in a consolidation module, counted only when that
// module is on your path). Never a percentage, never a streak. Nothing is saved.
export interface NeedsRevision { lessonId: string; flag: string | null; sessions: number; own: number; checks: number; tried: boolean; next: 'try' | 'check' }
export interface ArabicProgress {
  started: boolean; path: number; done: number; holding: number; ownChecks: number; needs: NeedsRevision[];
  milestones: number;                                              // how many of the course's levels end on your path
  milestone: { stage: string; toGo: number; last: string } | null; // the next one; null when they're all behind you
}
export function arabicProgress(d: MyDayData): ArabicProgress {
  const path = pathLessons(d.arabic.pathId), onPath = new Set(path), state = new Map<string, LessonState>();
  const needs: NeedsRevision[] = [];
  let ownChecks = 0;
  for (const id of path) {
    const checks = checksOf(id), ev = evidence(d, id, checks), st = lessonState(ev);
    state.set(id, st);
    // On your own now: the latest answer to the check was right, on your own (a slip after it doesn't count).
    const own = checks.filter(c => { const list = ev.answers[c] ?? []; return list.length > 0 && onOwn(list[list.length - 1]); }).length;
    ownChecks += own;
    if (st !== 'needs-revision') continue;
    const rec = lessonRecord(d, id), tried = !!practiceOf(d, id)?.tried;
    needs.push({ lessonId: id, flag: rec?.revisit ? rec.revisit.what : null, sessions: ev.finished, own, checks: checks.length, tried, next: tried ? 'check' : 'try' });
  }
  // The course's levels whose consolidation module is on your path, in order; the next is the first not all done.
  const required = new Set((paths.get(d.arabic.pathId) ?? corePath).required_module_ids);
  const levels = milestones.map(m => ({ m, last: moduleList.find(x => x.assessment_id === m.assessment_id) }))
    .filter((x): x is { m: (typeof milestones)[number]; last: (typeof moduleList)[number] } => !!x.last && required.has(x.last.id));
  let milestone: ArabicProgress['milestone'] = null;
  for (const { m, last } of levels) {
    const toGo = pathLessons(m.path_id).filter(id => onPath.has(id) && !isDone(state.get(id)!)).length;
    if (toGo) { milestone = { stage: m.stage_target, toGo, last: last.name }; break; }
  }
  const states = [...state.values()];
  return {
    started: states.some(x => x !== 'new') || d.arabic.attempts.length > 0, path: path.length,
    done: states.filter(isDone).length, holding: states.filter(x => x === 'holding').length, ownChecks, needs,
    milestones: levels.length, milestone,
  };
}
