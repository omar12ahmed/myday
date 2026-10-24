// A read-only recommendation derived from the ordered curricula and saved learner progress.
// Content stays in each curriculum; there is no extra cursor to get out of sync.
import type { MyDayData } from '../data/types';
import { nextTaskIn, stIndex } from '../data/study/roadmap';
import { lessonIndex } from './arabic/catalogue';
import { arabicPlan } from './arabic/plan';
import { nextLesson as nextCyberLesson } from './cybersecurity/learning';

export type LearningSubject = 'cybersecurity' | 'arabic' | 'roadmap';
export interface LearningOption {
  subject: LearningSubject;
  label: string;
  title: string;
  detail: string;
  href: string;
  minutes: number;
  resume: boolean;
  allComplete: boolean;
  started: boolean; // begun at all (a session, attempt or ticked task): Today says "Start" until then
}

// An active general/Cyber study timer always takes priority over new lessons.
// A finished general Study session can keep its own course ahead of Today's pinned course.
export function learningOptions(data: MyDayData, generalCourseId = data.study.focusCourseId): LearningOption[] {
  const cyber = nextCyberLesson(data);
  const ix = stIndex(data.study);
  const ticked = (courseId: string) => !!ix.courseTasks.get(courseId)?.some(t => t.done);
  const cyberStarted = data.cybersecurity.attempts.length > 0 || data.study.sessions.some(s => !!s.courseId?.startsWith('cyber:1:'))
    || [...ix.course.keys()].some(id => id.startsWith('cyber:1:') && ticked(id));
  const cyberOption: LearningOption = {
    subject: 'cybersecurity', label: 'Cybersecurity', title: cyber.lesson.title,
    detail: cyber.code === 'user_choice' ? 'Resume your saved attempt'
      : cyber.allComplete ? 'Required lessons marked complete — revisit any lesson' : cyberStarted ? 'Next in your course' : 'The first lesson in your course',
    href: '#study/cybersecurity/' + encodeURIComponent(cyber.lesson.id),
    minutes: cyber.lesson.estimated_duration_minutes.standard,
    resume: cyber.code === 'user_choice', allComplete: cyber.allComplete, started: cyberStarted,
  };

  // Arabic: the same adaptive next step as its learning map (study/arabic/plan.ts), with the length that suits today.
  const plan = arabicPlan(data)!, step = plan.step;
  const arabicStarted = data.arabic.attempts.length > 0 || !!data.arabic.lessons?.length;
  const arabicOption: LearningOption = {
    subject: 'arabic', label: 'Arabic Fuṣḥā', title: lessonIndex[step.lessonId].title,
    detail: step.kind === 'resume' ? 'Resume your open Arabic session'
      : step.kind === 'revisit' ? `Worth revisiting first: ${lessonIndex[step.because!].title} builds on it`
      : step.kind === 'revise' ? `Revision first (${step.due} ready in Arabic), then this lesson`
      : step.kind === 'complete' ? (!step.waiting ? 'Your path is ready to move on — revise, or revisit any lesson'
        : step.waiting === 1 ? 'Every other lesson on your path is ready — this one needs revision' : `${step.waiting} lessons on your path need revision — this is the first`)
      : step.state === 'practised' ? 'Practised — mark it ready when it clicks' : arabicStarted ? 'Next in your course' : 'The first lesson in your course',
    href: '#study/arabic/' + encodeURIComponent(step.lessonId),
    minutes: step.kind === 'resume' ? lessonIndex[step.lessonId].minutes : plan.length.minutes, resume: step.kind === 'resume', allComplete: plan.complete, started: arabicStarted,
  };

  // User-authored roadmap courses remain available, in the order of their stages and lessons.
  // Imported Cybersecurity lessons have their own dedicated option above.
  const general = [...ix.course.values()].filter(e => !e.node.archived && !e.node.id.startsWith('cyber:1:')
    && ix.courseTasks.get(e.node.id)?.some(t => !t.done));
  const generalCourse = general.find(e => e.node.id === generalCourseId)
    ?? general.find(e => e.node.id === data.study.focusCourseId) ?? general[0];
  const generalTask = generalCourse ? nextTaskIn(ix, generalCourse.node) : null;
  const options: LearningOption[] = [cyberOption, arabicOption];
  if (generalCourse && generalTask) options.push({
    subject: 'roadmap', label: 'Your courses', title: generalTask.title,
    detail: generalCourse.node.title, href: '#study/task/' + encodeURIComponent(generalTask.id),
    minutes: generalTask.minutes, resume: false, allComplete: false,
    started: ticked(generalCourse.node.id) || data.study.sessions.some(s => s.courseId === generalCourse.node.id),
  });

  // The learner's explicit choice wins over recent activity; default to fundamentals.
  const preferred = data.study.settings.primarySubject ?? 'cybersecurity';
  const pinned = options.find(o => o.subject === preferred);
  return pinned ? [pinned, ...options.filter(o => o !== pinned)] : options;
}
