// The Arabic course's adaptive next step, for the learning map, a lesson page and Today's Study card: the course's
// facts from the catalogue, your records (data/arabic/lessons.ts) and the shared rules (data/study/mastery.ts).
// Worked out on the device each time; nothing here is saved and nothing is sent.
import { keyOf, todayKey } from '../../data/dates';
import { checkIds, evidence, lessonRecord, stateOf } from '../../data/arabic/lessons';
import { practiceOf } from '../../data/arabic/practice';
import { MODALITIES, type Modality, type Variant } from '../../data/arabic/types';
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
// lesson never gets it: it skips the teaching). The reasons are suggestLength's own ("energy 2 today"), and `plain`
// its reasons naming no shift, appointment or task.
export function lengthOn(lessonId: string, suggested: { minutes: number; why: string[]; plain?: string[] }, state: LessonState, revisit: boolean): { variant: Variant; minutes: number; why: string[]; plain: string[] } {
  const l = lessonIndex[lessonId];
  const len = lengthFor(suggested.minutes, { standard: l.minutes, short: l.short, practical: state !== 'new' ? l.practical : undefined }, revisit);
  return { variant: len, minutes: { standard: l.minutes, practical: l.practical, short: l.short, revision: l.revision }[len], why: suggested.why, plain: suggested.plain ?? [] };
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
// `aiReason`: the reason without your own "Needs revision" words, as it may reach AI.
export interface ArabicPlan { step: Step; reason: string; aiReason: string; length: { variant: Variant; minutes: number; why: string[]; plain: string[] }; complete: boolean }
export function arabicPlan(d: MyDayData, k: DateKey = todayKey()): ArabicPlan | null {
  const path = pathLessons(d.arabic.pathId), cache = new Map<string, LessonState>();
  const state = (id: string) => { if (!cache.has(id)) cache.set(id, arabicState(d, id)); return cache.get(id)!; };
  const open = d.arabic.attempts.filter(a => !a.finishedAt && path.includes(a.lessonId)).pop()?.lessonId ?? null;
  const step = nextStep({ path, state, open, buildsOn, due: dueIds(d, k, 'arabic').length, stopped: reviewedOn(d.study, k) >= DAILY_ENOUGH });
  if (!step) return null;
  const what = lessonRecord(d, step.lessonId)?.revisit?.what;
  return {
    step, reason: stepReason(step, id => lessonIndex[id]?.title ?? id, what), aiReason: stepReason(step, id => lessonIndex[id]?.title ?? id),
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
  milestone: { id: string; stage: string; toGo: number; last: string } | null; // the next one; null when they're all behind you
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
    if (toGo) { milestone = { id: m.id, stage: m.stage_target, toGo, last: last.name }; break; }
  }
  const states = [...state.values()];
  return {
    started: states.some(x => x !== 'new') || d.arabic.attempts.length > 0, path: path.length,
    done: states.filter(isDone).length, holding: states.filter(x => x === 'holding').length, ownChecks, needs,
    milestones: levels.length, milestone,
  };
}

// ---------- Your route (specs/arabic-route.md) ----------
// "Your goal" (d.arabic.pathId, chosen on the map) as a route of stages in course order: script and sounds, then each
// core level, then a specialist branch, as far as the goal goes. Each stage says what you'll be able to do at its end:
// the course's milestone sample tasks when that milestone's closing module is on your goal (as Progress counts it),
// otherwise its modules' purposes. A branch's lessons are all optional in the course, so the branch counts them; a core
// stage counts its required lessons, like your path. Where you are is the stage of your next step; a stage before it
// that isn't all ready is behind you (with how many need revision). Read-only, worked out on the device, nothing saved:
// a general Goal can point at the path by its id and call this.
export type RouteState = 'done' | 'here' | 'behind' | 'ahead';
export interface RouteStage { key: string; label: string; lessons: number; done: number; needs: number; state: RouteState; can: string[] }
export interface ArabicRoute { goalId: string; goal: string; stages: RouteStage[] }
export interface Towards { goal: string; stage: string; at: number; of: number; branch: boolean }
type Module = (typeof moduleList)[number];
const STAGE_PATH: Record<string, string> = { 'Pre-A1': 'path.arabic-start', A1: 'path.arabic-a1', A2: 'path.arabic-a2', B1: 'path.arabic-b1', B2: 'path.arabic-core-b2' };
const SKILL_NAME: Record<string, string> = { listening: 'Listening', reading: 'Reading', speaking: 'Speaking', writing: 'Writing' };
const goalOf = (d: MyDayData) => paths.get(d.arabic.pathId) ?? corePath;
const stageKey = (m: Module) => (m.path_class === 'core' ? m.stage_target : 'branch');
// The goal's stages, from the course alone (no lesson states), kept per goal: the course doesn't change while it runs.
const shapes = new Map<string, { key: string; label: string; can: string[]; lessons: string[] }[]>();
function routeShape(goal: ReturnType<typeof goalOf>) {
  const known = shapes.get(goal.id);
  if (known) return known;
  const required = new Set(goal.required_module_ids), groups = new Map<string, Module[]>();
  for (const m of [...moduleList].filter(x => required.has(x.id)).sort((x, y) => x.sequence - y.sequence)) groups.set(stageKey(m), [...(groups.get(stageKey(m)) ?? []), m]);
  const shape = [...groups.entries()].map(([key, list]) => {
    const milestone = milestones.find(m => m.stage_target === key), closes = milestone && moduleList.find(x => x.assessment_id === milestone.assessment_id);
    const whole = !!milestone && !!closes && required.has(closes.id);
    const named = (key === 'Pre-A1' || whole) ? paths.get(STAGE_PATH[key] ?? '')?.name.replace(/: [A-Z0-9-]+ target$/, '') : undefined;
    const label = key === 'branch' ? goal.name : `${key === 'Pre-A1' ? 'Start' : key} · ${named ?? list.map(m => m.name).join('; ')}`;
    const can = whole ? Object.entries(milestone!.sample_tasks as Record<string, string>).map(([skill, task]) => `${SKILL_NAME[skill] ?? skill}: ${task}`) : list.map(m => m.purpose);
    return { key, label, can, lessons: list.flatMap(m => m.lesson_ids.filter(id => key === 'branch' || !lessonIndex[id].optional)) };
  });
  shapes.set(goal.id, shape);
  return shape;
}
export function arabicRoute(d: MyDayData, plan: ArabicPlan | null = arabicPlan(d)): ArabicRoute {
  const goal = goalOf(d), shape = routeShape(goal);
  const counted = shape.map(s => { const st = s.lessons.map(id => arabicState(d, id)); return { ...s, lessons: s.lessons.length, done: st.filter(isDone).length, needs: st.filter(x => x === 'needs-revision').length }; });
  const next = plan && plan.step.kind !== 'complete' ? lessonIndex[plan.step.lessonId] : null;
  const nextModule = next && moduleList.find(m => m.id === next.module_id);
  let here = nextModule ? counted.findIndex(s => s.key === stageKey(nextModule)) : -1;
  if (here < 0) here = counted.findIndex(s => s.lessons === 0 || s.done < s.lessons);
  const stages = counted.map((s, i): RouteStage => ({ ...s, state: i === here ? 'here' : s.lessons > 0 && s.done === s.lessons ? 'done' : here >= 0 && i < here ? 'behind' : 'ahead' }));
  return { goalId: goal.id, goal: goal.name, stages };
}
// Where a lesson sits on your route, for "A step towards …", from the course alone; null when the lesson isn't on the
// route to your goal.
export function stepTowards(d: MyDayData, lessonId: string): Towards | null {
  const goal = goalOf(d), lesson = lessonIndex[lessonId], m = lesson && moduleList.find(x => x.id === lesson.module_id);
  if (!m || !goal.required_module_ids.includes(m.id)) return null;
  const shape = routeShape(goal), i = shape.findIndex(s => s.key === stageKey(m));
  return i < 0 ? null : { goal: goal.name, stage: shape[i].label, at: i + 1, of: shape.length, branch: shape[i].key === 'branch' };
}
export const towardsText = (t: Towards) => t.of === 1 ? `A step towards “${t.goal}”`
  : t.branch ? `A step towards “${t.goal}”, the goal’s own stage (${t.at} of ${t.of})`
  : `A step towards “${t.goal}”: stage ${t.at} of ${t.of}, ${t.stage}`;

// ---------- The four skills ----------
// Reading, writing, listening and speaking, each in words and counts (never a percentage, a score or a level): the
// finished sessions where you ticked it in "What did you practise?" and how many of those were on your own; the lessons
// on your path that ask for it, how many you've practised it in, and the first that asks for it where you haven't yet
// (it can be one behind you: it's where the skill hasn't been ticked, not the next step);
// and, as a guide, what the course's next milestone asks of that skill (the package's own sample task; its stages are
// approximate targets, not CEFR levels). Listening and speaking are only what you ticked: typed work never counts
// for them. `writeWords`: your kept words in revision to write from memory. Nothing is saved.
export interface ArabicSkill { modality: Modality; sessions: number; own: number; last: DateKey | null; asks: number; practisedIn: number; next: string | null; guide: { stage: string; task: string } | null }
export function arabicSkills(d: MyDayData, progress: ArabicProgress = arabicProgress(d)): { skills: ArabicSkill[]; writeWords: number } {
  const path = pathLessons(d.arabic.pathId), finished = d.arabic.attempts.filter(a => a.finishedAt);
  const ms = progress.milestone ? milestones.find(m => m.id === progress.milestone!.id) : undefined;
  const skills = MODALITIES.map((m): ArabicSkill => {
    const by = finished.filter(a => a.practised.includes(m)), inLesson = new Set(by.map(a => a.lessonId));
    const asks = path.filter(id => lessonIndex[id].modalities.includes(m)), task = ms?.sample_tasks[m];
    return {
      modality: m, sessions: by.length, own: by.filter(a => a.help === 'independent').length,
      last: by.map(a => keyOf(new Date(a.finishedAt!))).sort().pop() ?? null,
      asks: asks.length, practisedIn: asks.filter(id => inLesson.has(id)).length, next: asks.find(id => !inLesson.has(id)) ?? null,
      guide: ms && task ? { stage: ms.stage_target, task } : null,
    };
  });
  return { skills, writeWords: (d.arabic.words ?? []).filter(w => w.write).length };
}
