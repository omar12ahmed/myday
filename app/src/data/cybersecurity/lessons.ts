// Your place on each Cybersecurity lesson (adaptive Study, specs/adaptive-study.md): Ready to move on, your own
// "Needs revision" flag, and the checks that come back by themselves a week after Ready. States come from the shared
// rules (data/study/mastery.ts) with Cybersecurity's evidence: handed-in notebook attempts and finished Study sessions
// on the lesson (Practised), Ready, and your revision answers to its knowledge checks. Functions that change data take
// a draft (see storage.ts update()); the course's facts (a lesson's activities and checks) are passed in.
//
// Ready's home: with the path in your roadmap, the lesson's roadmap task (ticked there or here, its day kept, as before
// this release); without it, the day in your lesson record (cybersecurity.lessons, synced as cyber_lesson). Adding the
// path later moves a record's day to its task (settleReadyHome). Reading, either counts, so a record that arrives by
// sync after the path was added isn't lost.
import { addAutomatic } from '../arabic/lessons';
import { shift, todayKey } from '../dates';
import { setTaskDone, stIndex } from '../study/roadmap';
import { DELAYED_CHECK_DAYS, lessonState, type CheckAnswer, type LessonEvidence, type LessonState } from '../study/mastery';
import type { DateKey, MyDayData, StudyTask } from '../types';
import { curriculumTaskId, type CyberLesson } from './types';

// What the course says about a lesson: its three activities and its knowledge-check question ids.
export interface CyberLessonFacts { id: string; activityIds: string[]; checks: string[] }
// A roadmap tick from before Study kept its day (classic data): Ready, from no particular day.
export const READY_LONG_AGO = '2000-01-01';

export const cyberLessonRecord = (d: MyDayData, lessonId: string): CyberLesson | null => d.cybersecurity.lessons?.find(l => l.id === lessonId) ?? null;
// Changes a lesson's record, making it if needed; one left with nothing of yours in it is removed (fields a newer
// MyDay added keep it).
function edit(d: MyDayData, lessonId: string, change: (l: CyberLesson) => void) {
  const list = d.cybersecurity.lessons ??= [];
  let l = list.find(x => x.id === lessonId);
  if (!l) { l = { id: lessonId }; list.push(l); }
  change(l);
  if (Object.keys(l).every(k => k === 'id')) list.splice(list.indexOf(l), 1);
}
const roadmapTask = (d: MyDayData, lessonId: string): StudyTask | null => stIndex(d.study).task.get(curriculumTaskId(lessonId))?.node ?? null;

// The day you marked it ready, wherever it lives (null: not ready).
export function readyDay(d: MyDayData, lessonId: string): DateKey | null {
  const t = roadmapTask(d, lessonId);
  if (t?.done) return t.doneOn ?? READY_LONG_AGO;
  return cyberLessonRecord(d, lessonId)?.readyOn ?? null;
}
// After the path is added to your roadmap: a Ready day in a lesson record goes to its new task (ticked, that day).
export function settleReadyHome(d: MyDayData): boolean {
  let moved = false;
  for (const r of [...(d.cybersecurity.lessons ?? [])]) {
    const t = r.readyOn ? roadmapTask(d, r.id) : null;
    if (!t || !r.readyOn) continue;
    if (!t.done) { t.done = true; t.doneOn = r.readyOn; }
    edit(d, r.id, x => { delete x.readyOn; });
    moved = true;
  }
  return moved;
}

// ---------- Evidence and state ----------
export function cyberEvidence(d: MyDayData, l: CyberLessonFacts): LessonEvidence {
  const answers: Record<string, CheckAnswer[]> = {};
  for (const id of l.checks) answers[id] = d.study.reviews.filter(r => r.conceptId === id)
    .map(r => ({ date: r.date, outcome: r.outcome, support: r.support, rating: r.rating }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const task = curriculumTaskId(l.id);
  const handedIn = d.cybersecurity.attempts.filter(a => a.submittedAt && l.activityIds.includes(a.activityId)).length;
  const sessions = d.study.sessions.filter(s => s.taskId === task && s.status === 'done').length;
  return { finished: handedIn + sessions, readyOn: readyDay(d, l.id), flagged: !!cyberLessonRecord(d, l.id)?.revisit, checks: l.checks, answers };
}
export const cyberStateOf = (d: MyDayData, l: CyberLessonFacts): LessonState => lessonState(cyberEvidence(d, l));

// ---------- Ready to move on, and taking it back ----------
// Ready: the roadmap's tick when the path is in your roadmap, otherwise your lesson record; your own flag goes; and
// its checks not already in revision come back about a week later (the 8-a-day limit applies). Returns what was added.
export function markCyberReady(d: MyDayData, l: CyberLessonFacts, k: DateKey = todayKey()): { id: string; due: DateKey }[] {
  const t = roadmapTask(d, l.id);
  if (t) { if (!t.done) setTaskDone(t, true); }
  edit(d, l.id, r => { if (!t) r.readyOn = k; else delete r.readyOn; delete r.revisit; });
  return afterReady(d, l, k);
}
// The checks a Ready brings back, and the flag it clears — also when the roadmap's tick did it (study/actions.ts).
export function afterReady(d: MyDayData, l: CyberLessonFacts, k: DateKey = todayKey()): { id: string; due: DateKey }[] {
  edit(d, l.id, r => { delete r.revisit; });
  return addAutomatic(d, l.checks, shift(k, DELAYED_CHECK_DAYS), k, 'cybersecurity');
}
// "Not ready after all": the roadmap task unticked and the record's day removed. The checks stay in revision.
export function unmarkCyberReady(d: MyDayData, lessonId: string): boolean {
  const t = roadmapTask(d, lessonId), had = !!cyberLessonRecord(d, lessonId)?.readyOn;
  if (!t?.done && !had) return false;
  if (t?.done) setTaskDone(t, false);
  if (had) edit(d, lessonId, r => { delete r.readyOn; });
  return true;
}

// ---------- Needs revision ----------
export function flagCyberRevisit(d: MyDayData, lessonId: string, what: string, k: DateKey = todayKey()) {
  edit(d, lessonId, r => { r.revisit = { since: k, what: what.trim().slice(0, 300) }; });
}
export function clearCyberRevisit(d: MyDayData, lessonId: string): boolean {
  if (!cyberLessonRecord(d, lessonId)?.revisit) return false;
  edit(d, lessonId, r => { delete r.revisit; });
  return true;
}
