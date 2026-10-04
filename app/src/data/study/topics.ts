// Study topics: subjects you study (e.g. Cybersecurity, Spanish), each with its own stages → courses → … Added in
// 1.3.0. Data without topics is one roadmap, shown as a single topic; nothing is changed until you add a topic.
//
// Saved as study.topics ([{ id, title }]) and a topicId on each stage — additions only. The first time you add a
// topic, your existing roadmap becomes the first topic: its stages get that topic's id (their contents are
// untouched). The classic MyDay keeps both as they are and shows every stage, whatever its topic.
import { dayDiff, shortDate } from '../dates';
import { uid } from '../util';
import type { DateKey, MyDayData, StudyCourse, StudyData, StudyStage, StudyTask, StudyTopic } from '../types';
import { STARTER_STAGES } from './common';
import { addStudyItem, completion, focusCourse, nextTaskIn, removeStudyItem, type StudyIndex } from './roadmap';

export const TOPIC_LIMITS = { topics: 20, title: 60 };
export const FIRST_STAGE = 'Start here'; // a new topic's first stage, so a course can be added straight away

// The name for your existing roadmap when it becomes a topic: "Cybersecurity" if it's built from the starter stages.
export const firstTopicName = (st: StudyData) => (st.stages.some(sg => STARTER_STAGES.includes(sg.title)) ? 'Cybersecurity' : 'My studies');

// The topics to show. Without any, the whole roadmap is one topic (id '').
export function topicsOf(st: StudyData): StudyTopic[] {
  return st.topics && st.topics.length ? st.topics : [{ id: '', title: firstTopicName(st) }];
}
// A stage's topic: its own, if that topic still exists; otherwise the first.
export function topicOfStage(st: StudyData, sg: StudyStage): string {
  const ts = topicsOf(st);
  return sg.topicId && ts.some(t => t.id === sg.topicId) ? sg.topicId : ts[0].id;
}
export const stagesOf = (st: StudyData, topicId: string) => st.stages.filter(sg => topicOfStage(st, sg) === topicId);

// A new topic, with a first stage. The first time, your existing roadmap becomes the first topic. Returns its id.
export function addTopic(st: StudyData, title: string): string | null {
  const clean = title.trim().slice(0, TOPIC_LIMITS.title);
  if (!clean) return null;
  if (!st.topics || !st.topics.length) {
    const first: StudyTopic = { id: 'tp' + uid(), title: firstTopicName(st) };
    st.topics = [first];
    for (const sg of st.stages) sg.topicId = first.id;
  }
  if (st.topics.length >= TOPIC_LIMITS.topics) return null;
  if (st.topics.some(t => t.title.toLowerCase() === clean.toLowerCase())) return null;
  const id = 'tp' + uid();
  st.topics.push({ id, title: clean });
  st.stages.push({ id: 'sg' + uid(), title: FIRST_STAGE, topicId: id, courses: [] });
  return id;
}
export function renameTopic(st: StudyData, id: string, title: string): boolean {
  const clean = title.trim().slice(0, TOPIC_LIMITS.title);
  if (!clean) return false;
  if (!st.topics || !st.topics.length) { // naming the one roadmap makes it a topic (same as adding the first)
    if (id !== '' || clean === firstTopicName(st)) return false;
    st.topics = [{ id: 'tp' + uid(), title: clean }];
    for (const sg of st.stages) sg.topicId = st.topics[0].id;
    return true;
  }
  const t = st.topics.find(x => x.id === id);
  if (!t || t.title === clean || st.topics.some(x => x.id !== id && x.title.toLowerCase() === clean.toLowerCase())) return false;
  t.title = clean;
  return true;
}
export function moveTopic(st: StudyData, id: string, dir: -1 | 1): boolean {
  if (!st.topics) return false;
  const i = st.topics.findIndex(t => t.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= st.topics.length) return false;
  // Stages without a topic of their own (e.g. added in the classic MyDay) show under the first topic: pin them to it
  // before the order changes, so they don't move to another topic.
  const first = st.topics[0].id;
  for (const sg of st.stages) if (!sg.topicId || !st.topics.some(t => t.id === sg.topicId)) sg.topicId = first;
  [st.topics[i], st.topics[j]] = [st.topics[j], st.topics[i]];
  return true;
}
// What removing a topic would remove (for the question you're asked first).
export function topicContents(st: StudyData, id: string) {
  const stages = stagesOf(st, id);
  const courses = stages.flatMap(sg => sg.courses);
  const tasks = courses.flatMap(c => c.modules.flatMap(m => m.sections.flatMap(s => s.tasks)));
  return { stages: stages.length, courses: courses.length, tasks: tasks.length, done: tasks.filter(t => t.done).length };
}
// Removes a topic and everything in it (never the only topic). Concepts stay; only their links to removed tasks go.
export function removeTopic(st: StudyData, id: string): boolean {
  if (!st.topics || st.topics.length < 2 || !st.topics.some(t => t.id === id)) return false;
  for (const sg of stagesOf(st, id)) removeStudyItem(st, sg.id);
  st.topics = st.topics.filter(t => t.id !== id);
  return true;
}

// ---------- Stages within a topic ----------
export function addStageToTopic(st: StudyData, topicId: string): string | null {
  const id = addStudyItem(st, 'stage', '');
  if (id && st.topics && st.topics.length) { const sg = st.stages.find(s => s.id === id); if (sg) sg.topicId = topicId; }
  return id;
}
// Moving a stage up or down passes over stages of other topics (they're not on screen).
export function moveStageInTopic(st: StudyData, stageId: string, dir: -1 | 1): boolean {
  const i = st.stages.findIndex(s => s.id === stageId);
  if (i < 0) return false;
  const topic = topicOfStage(st, st.stages[i]);
  let j = i + dir;
  while (j >= 0 && j < st.stages.length && topicOfStage(st, st.stages[j]) !== topic) j += dir;
  if (j < 0 || j >= st.stages.length) return false;
  [st.stages[i], st.stages[j]] = [st.stages[j], st.stages[i]];
  return true;
}

// ---------- A new course, optionally suggested on Today ----------
// With `suggest`, it's also added to the end of your Learning list (as "<course> — one section"), linked to the
// course the same way the courses you set up first are — so Today can suggest it.
export function addCourse(d: MyDayData, stageId: string, title: string, minutes: number, suggest: boolean): string | null {
  const sg = d.study.stages.find(s => s.id === stageId), clean = title.trim().slice(0, 120);
  if (!sg || !clean) return null;
  const mins = Math.min(600, Math.max(5, Math.round(minutes) || 30));
  let listId: string | null = null;
  if (suggest) {
    listId = 'l' + uid();
    d.lists.learning.push({ id: listId, title: `${clean} — one section`, minutes: mins });
  }
  const id = 'co' + uid();
  sg.courses.push({ id, title: clean, url: '', minutes: mins, listId, archived: false, modules: [] });
  return id;
}

// ---------- A topic at a glance (Study's home, and the topic's own page) ----------
// Worked out from the roadmap and your sessions; nothing extra is saved.
export interface TopicGlance {
  topic: StudyTopic;
  courses: { course: StudyCourse; stage: StudyStage; comp: ReturnType<typeof completion> }[]; // in roadmap order (not set aside)
  setAside: number;                 // archived courses (still in the roadmap)
  comp: ReturnType<typeof completion>;
  next: StudyCourse | null;         // what to carry on with: your focus if it's in this topic, else the first with work left
  nextTask: StudyTask | null;
  isFocus: boolean;                 // your focus course is in this topic
  lastStudied: DateKey | null;      // the last finished session in one of its courses
}
export function topicGlance(st: StudyData, ix: StudyIndex, topicId: string): TopicGlance | null {
  const topic = topicsOf(st).find(t => t.id === topicId);
  if (!topic) return null;
  const all = stagesOf(st, topicId).flatMap(stage => stage.courses.map(course => ({ course, stage })));
  const courses = all.filter(x => !x.course.archived).map(x => ({ ...x, comp: completion(ix.courseTasks.get(x.course.id) ?? []) }));
  const fc = focusCourse(st, ix), isFocus = !!fc && courses.some(x => x.course === fc);
  const next = isFocus ? fc : courses.find(x => x.comp.done < x.comp.total)?.course ?? courses[0]?.course ?? null;
  const ids = new Set(all.map(x => x.course.id));
  const last = st.sessions.filter(s => s.status === 'done' && s.courseId && ids.has(s.courseId)).map(s => s.date).sort().pop() ?? null;
  return {
    topic, courses, setAside: all.length - courses.length,
    comp: completion(courses.flatMap(x => ix.courseTasks.get(x.course.id) ?? [])),
    next, nextTask: next ? nextTaskIn(ix, next) : null, isFocus, lastStudied: last,
  };
}
// "Studied today", "Studied yesterday", "Studied 3 days ago", "Last studied Fri 2 Oct", or not yet.
export function studiedText(last: DateKey | null, k: DateKey): string {
  if (!last) return 'Not studied yet';
  const n = dayDiff(k, last);
  return n <= 0 ? 'Studied today' : n === 1 ? 'Studied yesterday' : n < 7 ? `Studied ${n} days ago` : `Last studied ${shortDate(last)}`;
}
// A topic's page in the address. The one unnamed roadmap (no topics yet) is "main".
export const topicPath = (id: string) => `study/topic/${id || 'main'}`;
export const topicFromPath = (part: string) => (part === 'main' ? '' : part);
