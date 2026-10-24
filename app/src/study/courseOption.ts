// What to learn next in one of your own courses, as an option for Today's Study card and Study home's Now card. Kept
// apart from nextLearning.ts, which loads the Arabic and Cybersecurity catalogues on demand, so Study home can show a
// course of yours straight away. Read-only: nothing here is saved.
import { nextTaskIn, stIndex, type StudyIndex } from '../data/study/roadmap';
import type { MyDayData } from '../data/types';

export type LearningSubject = 'cybersecurity' | 'arabic' | 'roadmap';
export interface LearningOption {
  subject: LearningSubject;
  label: string;
  title: string;
  detail: string;
  why: string;          // "Why this?", the same words on Today and Study home
  href: string;
  minutes: number;
  resume: boolean;
  allComplete: boolean;
  started: boolean;     // begun at all (a session, attempt or ticked task): Today says "Start" until then
  courseId?: string;    // one of your courses: which, and its next task
  taskId?: string;
  revise?: 'arabic';    // the step is revision first, then the lesson (Arabic's adaptive next step)
}

const ticked = (ix: StudyIndex, courseId: string) => !!ix.courseTasks.get(courseId)?.some(t => t.done);
const begun = (data: MyDayData, ix: StudyIndex, courseId: string) => ticked(ix, courseId) || data.study.sessions.some(s => s.courseId === courseId);

// Your courses' next task, in the order of their stages: `generalCourseId`'s if it has work left, then your focus
// course's, then the first with work left. Your focus course with no tasks yet is still offered while it's your focus
// (a session still counts); one that's finished gives way to another with work. Imported Cybersecurity lessons have their own option.
export function roadmapOption(data: MyDayData, generalCourseId = data.study.focusCourseId): LearningOption | null {
  const ix = stIndex(data.study), tasks = (id: string) => ix.courseTasks.get(id) ?? [];
  const live = [...ix.course.values()].filter(e => !e.node.archived && !e.node.id.startsWith('cyber:1:'));
  const work = live.filter(e => tasks(e.node.id).some(t => !t.done)), pinned = live.find(e => e.node.id === data.study.focusCourseId);
  const empty = pinned && !tasks(pinned.node.id).length && data.study.settings.primarySubject === 'roadmap'; // only while it's your focus
  const course = work.find(e => e.node.id === generalCourseId) ?? (pinned && (work.includes(pinned) || empty) ? pinned : undefined) ?? work[0];
  if (!course) return null;
  const c = course.node, task = nextTaskIn(ix, c);
  return {
    subject: 'roadmap', label: 'Your courses', title: task ? task.title : c.title,
    detail: task ? c.title : 'No tasks added yet — a session still counts',
    why: task ? `The next task you haven’t ticked in ${c.title}, in your roadmap’s order.`
      : `${c.title} is your focus. It has no tasks yet: you can start a session and add them as you go.`,
    href: task ? '#study/task/' + encodeURIComponent(task.id) : '#study', minutes: task ? task.minutes : c.minutes, resume: false, allComplete: false,
    started: begun(data, ix, c.id), courseId: c.id, taskId: task?.id,
  };
}

// The button's words for an option.
export const optionAction = (option: LearningOption) =>
  option.revise ? 'Revise Arabic' : option.resume ? 'Resume lesson' : option.allComplete ? 'Revisit lesson' : option.started ? 'Continue learning' : 'Start lesson';
