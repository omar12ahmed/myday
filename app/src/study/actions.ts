// What Study's buttons and fields do: each one changes saved data through the store (storage.ts update()),
// then moves to the right screen. Same behaviour, limits and messages as the current MyDay.
import { todayKey } from '../data/dates';
import { setDone } from '../data/plan';
import { getSnapshot, update } from '../data/storage';
import { newConcept, safeUrl } from '../data/study/common';
import { conceptNamed, removeStudyItem, setTaskDone, stFind, stIndex } from '../data/study/roadmap';
import { activeStudy, ensureCheckin, finishStudy, pauseStudy, resumeStudy, startStudySession, todayTaskFor } from '../data/study/sessions';
import { toast } from '../data/toast';
import type { Checkin, Clarity, Concept, StudyCourse, StudyData, StudySession, StudyTask } from '../data/types';
import { intIn } from '../data/util';
import { go } from './route';
import { clearRound, startRound } from './round';

// ---------- Learning sessions ----------
// Start learning. If a session is already in progress, nothing new is made: it opens that one instead.
export function startLearning(courseId: string, taskId: string | null, minutes: number, short: boolean) {
  let ready = !!activeStudy(getSnapshot().data.study) as boolean;
  if (!ready) update(d => { if (!startStudySession(d.study, courseId, taskId, intIn(minutes, 1, 600, 30), short)) return false; ready = true; });
  if (ready) go('study/session');
}
export const pauseLearning = () => update(d => { const s = activeStudy(d.study); if (!s || !pauseStudy(s)) return false; });
export const resumeLearning = () => update(d => { const s = activeStudy(d.study); if (!s || !resumeStudy(s)) return false; });
export function finishLearning() {
  let id = null as string | null;
  update(d => { const s = activeStudy(d.study); if (!s) return false; finishStudy(d.study, s); id = s.id; });
  if (id) go('study/checkin/' + id);
}
// Discarding removes the session completely (it isn't saved or counted). Asked first by the screen.
export function discardLearning() {
  update(d => { const s = activeStudy(d.study); if (!s) return false; d.study.sessions = d.study.sessions.filter(x => x !== s); d.study.activeId = null; });
  go('study');
}
export const setShowClock = (on: boolean) => update(d => { d.study.settings.showClock = on; });

// ---------- Check-in after a session (every part optional; saved as you go) ----------
function withSession(id: string, fn: (s: StudySession, st: StudyData) => void | false) {
  return update(d => { const s = d.study.sessions.find(x => x.id === id); if (!s) return false; return fn(s, d.study); });
}
// "Is the task complete?" — sets the task's own completion too (kept separate from clarity).
export const checkinTask = (id: string, done: boolean) => withSession(id, (s, st) => {
  const t = s.taskId ? stIndex(st).task.get(s.taskId) : null;
  if (!t) return false;
  s.taskDone = done;
  t.node.done = done;
  t.node.doneOn = done ? t.node.doneOn || todayKey() : null;
});
export const checkinConcept = (id: string, conceptId: string) => withSession(id, s => {
  const ci = ensureCheckin(s);
  ci.conceptIds = ci.conceptIds.includes(conceptId) ? ci.conceptIds.filter(x => x !== conceptId) : ci.conceptIds.concat(conceptId);
});
export const checkinClarity = (id: string, v: Clarity) => withSession(id, s => { const ci = ensureCheckin(s); ci.clarity = ci.clarity === v ? null : v; });
// Adds a concept by name (or reuses one with the same name) and picks it. Returns false if the name is empty.
export function checkinAdd(id: string, title: string): boolean {
  const name = title.trim();
  if (!name) return false;
  return withSession(id, (s, st) => {
    const c = conceptNamed(st, name.slice(0, 120), s.taskId);
    const ci = ensureCheckin(s);
    if (!ci.conceptIds.includes(c.id)) ci.conceptIds.push(c.id);
  });
}
export const checkinText = (id: string, key: keyof Pick<Checkin, 'takeaway' | 'question' | 'note'>, value: string) =>
  withSession(id, s => { ensureCheckin(s)[key] = value.trim().slice(0, key === 'note' ? 300 : 500); });
// Ticks the matching learning task on today's plan, only when you ask.
export function tickToday(id: string) {
  let ticked = false as boolean;
  update(d => {
    const s = d.study.sessions.find(x => x.id === id), t = s && todayTaskFor(d, s);
    if (!s || !t || t.done) return false;
    setDone(d, t, true);
    s.todayUid = t.uid;
    ticked = true;
  });
  if (ticked) toast("Ticked on today's plan.");
}
export function checkinFinished(id: string, saved: boolean) {
  const s = getSnapshot().data.study.sessions.find(x => x.id === id);
  if (saved && s && s.checkin) toast('Check-in saved.');
  go('study');
}

// ---------- The roadmap ----------
export function setFocus(courseId: string) {
  if (update(d => { if (!stIndex(d.study).course.has(courseId)) return false; d.study.focusCourseId = courseId; })) toast('Focus updated.');
  go('study');
}
export const setDoneFor = (id: string, done: boolean) => update(d => { const t = stIndex(d.study).task.get(id); if (!t) return false; setTaskDone(t.node, done); });
// Removing is asked first by the screen. Returns true if something was removed.
export const removeItem = (id: string) => update(d => { if (!removeStudyItem(d.study, id)) return false; });

// A typed field on a course or task (name, link, minutes). Shows the saved value again if the typed one
// can't be used — an empty name is kept as it was; only http(s) links are kept.
export function saveItemText(id: string, key: 'title' | 'url' | 'minutes', el: HTMLInputElement) {
  const raw = el.value.trim();
  update(d => {
    const e = stFind(stIndex(d.study), id);
    if (!e) return false;
    const n = e.node as StudyCourse | StudyTask;
    if (key === 'title') { if (!raw) { el.value = n.title; return false; } n.title = raw.slice(0, 120); }
    else if (key === 'url') {
      const v = safeUrl(raw);
      if (raw && !v) toast('Links need to start with http:// or https://');
      el.value = v.slice(0, 400);
      if (n.url === v.slice(0, 400)) return false;
      n.url = v.slice(0, 400);
    } else { n.minutes = intIn(raw, 5, 600, n.minutes); el.value = String(n.minutes); }
  });
}
export const setTaskKind = (id: string, kind: string) => update(d => { const t = stIndex(d.study).task.get(id); if (!t) return false; t.node.kind = kind === 'practical' ? 'practical' : 'learn'; });
export const setArchived = (id: string, on: boolean) => update(d => { const c = stIndex(d.study).course.get(id); if (!c) return false; c.node.archived = on; });
// Moves a course to another stage, or a task to another section (to the end of it).
export function moveCourseTo(id: string, stageId: string) {
  update(d => {
    const ix = stIndex(d.study), e = ix.course.get(id), to = ix.stage.get(stageId);
    if (!e || !to || to.node === e.stage) return false;
    e.list.splice(e.list.indexOf(e.node), 1);
    to.node.courses.push(e.node);
  });
}
export function moveTaskTo(id: string, sectionId: string) {
  update(d => {
    const ix = stIndex(d.study), e = ix.task.get(id), to = ix.section.get(sectionId);
    if (!e || !to || to.node === e.section) return false;
    e.list.splice(e.list.indexOf(e.node), 1);
    to.node.tasks.push(e.node);
  });
}
// A concept added from a task's details (reuses one with the same name).
export function addTaskConcept(taskId: string, title: string): boolean {
  const name = title.trim();
  if (!name) return false;
  return update(d => { if (!stIndex(d.study).task.has(taskId)) return false; conceptNamed(d.study, name.slice(0, 120), taskId); });
}

// ---------- Concepts ----------
export function newConceptAndOpen(): string {
  const c = newConcept('New concept', null);
  update(d => { d.study.concepts.push(c); });
  go('study/concept/' + c.id);
  return c.id;
}
const LIMIT = { prompt: 1000, answer: 2000, explanation: 4000, hint: 500, source: 400, note: 300 } as const;
export type ConceptText = keyof typeof LIMIT;
function withConcept(id: string, fn: (c: Concept) => void | false) {
  return update(d => { const c = d.study.concepts.find(x => x.id === id); if (!c) return false; return fn(c); });
}
export function saveConceptTitle(id: string, el: HTMLInputElement) {
  const v = el.value.trim();
  withConcept(id, c => { if (!v) { el.value = c.title; return false; } c.title = v.slice(0, 120); });
}
export const saveConceptText = (id: string, key: ConceptText, value: string) => withConcept(id, c => { c[key] = value.trim().slice(0, LIMIT[key]); });
export const setConceptKind = (id: string, kind: string) => withConcept(id, c => { c.kind = kind === 'choice' ? 'choice' : 'written'; });
export const saveChoice = (id: string, i: number, value: string) => withConcept(id, c => {
  while (c.choices.length < 4) c.choices.push('');
  c.choices[i] = value.trim().slice(0, 200);
  if (c.correct !== null && !c.choices[c.correct]) c.correct = null;
});
// Only a filled-in choice can be the answer.
export const setCorrect = (id: string, i: number) => withConcept(id, c => { c.correct = c.choices[i] ? i : null; });
export const linkConcept = (id: string, taskId: string) => update(d => {
  const c = d.study.concepts.find(x => x.id === id);
  if (!c || !stIndex(d.study).task.has(taskId) || c.taskIds.includes(taskId)) return false;
  c.taskIds.push(taskId);
});
export const unlinkConcept = (id: string, taskId: string) => withConcept(id, c => { c.taskIds = c.taskIds.filter(x => x !== taskId); });
// Removing a concept keeps its past reviews (they stay in your study history). Asked first by the screen.
export function removeConcept(id: string) {
  update(d => {
    if (!d.study.concepts.some(c => c.id === id)) return false;
    d.study.concepts = d.study.concepts.filter(c => c.id !== id);
    for (const s of d.study.sessions) if (s.checkin) s.checkin.conceptIds = s.checkin.conceptIds.filter(x => x !== id);
  });
  clearRound();
  go('study/concepts');
}

// ---------- Revision ----------
// Start a revision round (from Study or from Today's Study card).
export function startRevision() {
  startRound(getSnapshot().data.study);
  go('study/revise');
}
export const setVault = (v: string) => update(d => { const name = v.trim().slice(0, 100); if (d.study.settings.vault === name) return false; d.study.settings.vault = name; });
