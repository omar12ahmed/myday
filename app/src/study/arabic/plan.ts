// The Arabic course's adaptive next step, for the learning map, a lesson page and Today's Study card: the course's
// facts from the catalogue, your records (data/arabic/lessons.ts) and the shared rules (data/study/mastery.ts).
// Worked out on the device each time; nothing here is saved and nothing is sent.
import { todayKey } from '../../data/dates';
import { checkIds, lessonRecord, stateOf } from '../../data/arabic/lessons';
import type { Variant } from '../../data/arabic/types';
import { isDone, lengthFor, nextStep, stepReason, type LessonState, type Step } from '../../data/study/mastery';
import { dueIds } from '../../data/study/queue';
import { DAILY_ENOUGH, reviewedOn } from '../../data/study/revision';
import { suggestLength } from '../../data/study/sessions';
import type { DateKey, MyDayData } from '../../data/types';
import { corePath, lessonIndex, moduleList, paths, skills } from './catalogue';

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

// How long a session to suggest on a lesson: energy and free time decide (suggestLength), and a lesson that needs
// revision gets the revision session. The reasons are suggestLength's own ("energy 2 today").
export function lessonLength(d: MyDayData, lessonId: string, revisit: boolean): { variant: Variant; minutes: number; why: string[] } {
  const l = lessonIndex[lessonId], s = suggestLength(d, l.minutes);
  const len = lengthFor(s.minutes, { standard: l.minutes, short: l.short }, revisit);
  return { variant: len, minutes: len === 'standard' ? l.minutes : len === 'short' ? l.short : l.revision, why: s.why };
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
