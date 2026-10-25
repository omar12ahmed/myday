// What to learn next in one of your own courses, as an option for Today's Study card and Study home's Now card. Kept
// apart from nextLearning.ts, which loads the Arabic and Cybersecurity catalogues on demand, so Study home can show a
// course of yours straight away. Read-only: nothing here is saved.
import type { JourneyStep } from '../data/study/mastery';
import { nextTaskIn, stIndex, type StudyIndex } from '../data/study/roadmap';
import { courseFocus } from '../data/study/yourFocus';
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
  revise?: 'arabic' | 'cybersecurity'; // the step is revision first, then the lesson (the adaptive next step)
  mode?: string;        // Light, Normal or Deep, for the suggested length (Arabic, Cybersecurity)
  lessonId?: string;    // the lesson it opens (Arabic, Cybersecurity)
  attemptId?: string;   // the open session it resumes (Arabic), and the steps that session shows, for where you left off
  steps?: JourneyStep[];
}

const ticked = (ix: StudyIndex, courseId: string) => !!ix.courseTasks.get(courseId)?.some(t => t.done);
const begun = (data: MyDayData, ix: StudyIndex, courseId: string) => ticked(ix, courseId) || data.study.sessions.some(s => s.courseId === courseId);

// Your courses' next task, in the order of their stages: `generalCourseId`'s if it has work left, then your focus
// course's, then the first with work left. While your focus is your courses, the course that's labelled your focus
// (courseFocus, the same rule everywhere) is the one offered, and one with no tasks yet still is (a session still
// counts); a finished one gives way to another with work. Imported Cybersecurity lessons have their own option.
export function roadmapOption(data: MyDayData, generalCourseId = data.study.focusCourseId): LearningOption | null {
  const ix = stIndex(data.study), tasks = (id: string) => ix.courseTasks.get(id) ?? [], hasWork = (id: string) => tasks(id).some(t => !t.done);
  const live = [...ix.course.values()].filter(e => !e.node.archived && !e.node.id.startsWith('cyber:1:'));
  const work = live.filter(e => hasWork(e.node.id)), focus = courseFocus(data.study, ix);
  const yours = focus && (hasWork(focus.id) || !tasks(focus.id).length) ? live.find(e => e.node.id === focus.id) : undefined;
  const pinned = work.find(e => e.node.id === data.study.focusCourseId);
  const course = work.find(e => e.node.id === generalCourseId) ?? yours ?? pinned ?? work[0];
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
  option.revise ? `Revise ${option.revise === 'arabic' ? 'Arabic' : 'Cybersecurity'}` : option.resume ? 'Resume lesson' : option.allComplete ? 'Revisit lesson' : option.started ? 'Continue learning' : 'Start lesson';
