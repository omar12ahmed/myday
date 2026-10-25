// The Cybersecurity course's adaptive next step and lesson places (specs/adaptive-study.md), for the lesson page, the
// path, Progress and Today's Study card: the course's facts from the catalogue, your records
// (data/cybersecurity/lessons.ts) and the shared rules (data/study/mastery.ts), as Arabic's (study/arabic/plan.ts).
// Worked out on the device each time; nothing here is saved and nothing is sent.
import { todayKey } from '../../data/dates';
import { cyberEvidence, cyberLessonRecord, cyberStateOf, type CyberLessonFacts } from '../../data/cybersecurity/lessons';
import { CYBER_VERSION } from '../../data/cybersecurity/types';
import { isDone, lengthFor, lessonState, nextStep, onOwn, stepReason, type LessonState, type Length, type Step } from '../../data/study/mastery';
import { dueIds } from '../../data/study/queue';
import { DAILY_ENOUGH, reviewedOn } from '../../data/study/revision';
import { suggestLength } from '../../data/study/sessions';
import type { DateKey, MyDayData } from '../../data/types';
import { activities, lessons, skills } from './catalogue';
import { practiceById } from './practiceCatalogue';
import { selectedPathLessons } from './learning';

// A lesson's activities (its practical task, knowledge check and mini challenge) and its knowledge-check questions.
export function factsOf(lessonId: string): CyberLessonFacts {
  const l = lessons.get(lessonId);
  if (!l) return { id: lessonId, activityIds: [], checks: [] };
  return { id: lessonId, activityIds: [l.practical_task_id, l.knowledge_check_id, l.mini_challenge_id], checks: activities.get(l.knowledge_check_id)?.questions.map(q => q.id) ?? [] };
}
export const cyberState = (d: MyDayData, lessonId: string): LessonState => cyberStateOf(d, factsOf(lessonId));
// The lessons a lesson builds on directly: the ones teaching the skills it requires.
export const buildsOn = (lessonId: string) => [...new Set((lessons.get(lessonId)?.prerequisites.all ?? [])
  .map(p => skills.get(p.skill_id)?.taught_by_lesson_ids[0]).filter((id): id is string => !!id && id !== lessonId))];
// Your path's required lessons, in course order (and all of them, optional ones too, for resuming a draft).
export const pathIds = (d: MyDayData) => selectedPathLessons(d.cybersecurity.pathId).filter(l => !l.optional).map(l => l.id);
const onPathIds = (d: MyDayData) => selectedPathLessons(d.cybersecurity.pathId).map(l => l.id);

// A lesson on your path (optional ones too) with a notebook attempt still open (the current version and rubric), as
// the next step resumes it. Drafts from older versions, unknown activities and lessons off your path don't count.
export function openLesson(d: MyDayData, path: string[]): string | null {
  const on = new Set(path);
  for (const a of d.cybersecurity.attempts) {
    const activity = activities.get(a.activityId);
    if (!activity || a.submittedAt || a.curriculumVersion !== CYBER_VERSION || a.rubricVersion !== (activity.version ?? CYBER_VERSION)) continue;
    const l = [...on].find(id => factsOf(id).activityIds.includes(a.activityId) || practiceById.get(a.activityId)?.lessonIds.includes(id));
    if (l) return l;
  }
  return null;
}

// How long a session to suggest: energy and free time decide (suggestLength); a lesson to revisit gets the revision
// session when the standard one doesn't fit, and the practical one only once you've practised it. `plain`: the
// reasons naming no shift, appointment or task (suggestLength).
export function cyberLength(d: MyDayData, lessonId: string, state: LessonState, revisit: boolean): { mode: Length; minutes: number; why: string[]; plain: string[] } {
  const l = lessons.get(lessonId)!, of = (m: string) => l.variants.find(v => v.mode === m)?.minutes;
  const s = suggestLength(d, of('standard') ?? l.estimated_duration_minutes.standard);
  const mode = lengthFor(s.minutes, { standard: of('standard') ?? l.estimated_duration_minutes.standard, short: of('short') ?? 15, practical: state !== 'new' ? of('practical') : undefined }, revisit);
  return { mode, minutes: of(mode) ?? s.minutes, why: s.why, plain: s.plain };
}

// The next step, its reason (and `aiReason`, without your own "Needs revision" words, as it may reach AI), the length
// that suits today, and whether your whole path is ready to move on.
export interface CyberPlan { step: Step; reason: string; aiReason: string; length: { mode: Length; minutes: number; why: string[]; plain: string[] }; complete: boolean }
export function cyberPlan(d: MyDayData, k: DateKey = todayKey()): CyberPlan | null {
  const path = pathIds(d), cache = new Map<string, LessonState>();
  const state = (id: string) => { if (!cache.has(id)) cache.set(id, cyberState(d, id)); return cache.get(id)!; };
  const open = openLesson(d, onPathIds(d)), due = dueIds(d, k, 'cybersecurity').length;
  // A draft on an optional lesson of your path resumes too (the shared rules only resume on the path itself).
  const step: Step | null = open && !path.includes(open) && path.length ? { kind: 'resume', lessonId: open, state: state(open), due }
    : nextStep({ path, state, open, buildsOn, due, stopped: reviewedOn(d.study, k) >= DAILY_ENOUGH });
  if (!step) return null;
  const what = cyberLessonRecord(d, step.lessonId)?.revisit?.what;
  return {
    step, reason: stepReason(step, id => lessons.get(id)?.title ?? id, what), aiReason: stepReason(step, id => lessons.get(id)?.title ?? id),
    length: cyberLength(d, step.lessonId, step.state, step.kind === 'revisit' || step.state === 'needs-revision'),
    complete: path.every(id => isDone(state(id))),
  };
}

// Your path in words and counts (never a percentage): how many lessons are done (Ready or Holding), holding, and
// which need revision, each with why (your flag, or a check that slipped after Ready).
// For each lesson that needs revision, what your answers show: how many of its checks your latest answer got on
// your own, and how much you've handed in or studied.
export interface CyberNeeds { id: string; title: string; flag: string | null; practised: number; own: number; checks: number }
export interface CyberGlance { path: number; done: number; holding: number; ownChecks: number; needs: CyberNeeds[]; started: boolean }
export function cyberGlance(d: MyDayData): CyberGlance {
  const path = pathIds(d), needs: CyberNeeds[] = [];
  let done = 0, holding = 0, ownChecks = 0, started = d.cybersecurity.attempts.length > 0;
  for (const id of path) {
    const ev = cyberEvidence(d, factsOf(id)), st = lessonState(ev);
    const own = ev.checks.filter(c => { const list = ev.answers[c] ?? []; return list.length > 0 && onOwn(list[list.length - 1]); }).length;
    ownChecks += own;
    if (isDone(st)) done++;
    if (st === 'holding') holding++;
    if (st !== 'new') started = true;
    if (st === 'needs-revision') needs.push({ id, title: lessons.get(id)?.title ?? id, flag: cyberLessonRecord(d, id)?.revisit?.what ?? null, practised: ev.finished, own, checks: ev.checks.length });
  }
  return { path: path.length, done, holding, ownChecks, needs, started };
}

// A module on the map, as a place: unexplored (nothing yet), being explored, or visited (every core lesson ready to
// move on or holding), with counts in words. Never a percentage.
export function cyberModuleProgress(d: MyDayData, lessonIds: string[], touched: boolean) {
  const core = lessonIds.filter(id => !lessons.get(id)?.optional), states = new Map(lessonIds.map(id => [id, cyberState(d, id)] as const));
  const ready = [...states.values()].filter(isDone).length, needs = [...states.values()].filter(s => s === 'needs-revision').length;
  const place = !touched && [...states.values()].every(s => s === 'new') ? 'unexplored' : core.length > 0 && core.every(id => isDone(states.get(id)!)) ? 'visited' : 'exploring';
  return { place: place as 'unexplored' | 'exploring' | 'visited', ready, needs, states };
}
