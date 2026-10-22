// A read-only recommendation derived from the ordered curricula and saved learner progress.
// Content stays in each curriculum; there is no extra cursor to get out of sync.
import type { MyDayData } from '../data/types';
import { nextStep as nextArabicStep, lessonDone as arabicLessonDone } from '../data/arabic/sessions';
import { nextTaskIn, stIndex } from '../data/study/roadmap';
import { lessonIndex, moduleList, paths, corePath } from './arabic/catalogue';
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
}

// An active general/Cyber study timer always takes priority over new lessons.
// A finished general Study session can keep its own course ahead of Today's pinned course.
export function learningOptions(data: MyDayData, generalCourseId = data.study.focusCourseId): LearningOption[] {
  const cyber = nextCyberLesson(data);
  const ix = stIndex(data.study);
  const cyberOption: LearningOption = {
    subject: 'cybersecurity', label: 'Cybersecurity', title: cyber.lesson.title,
    detail: cyber.code === 'user_choice' ? 'Resume your saved attempt'
      : cyber.allComplete ? 'Required lessons marked complete — revisit any lesson' : 'Next in your course',
    href: '#study/cybersecurity/' + encodeURIComponent(cyber.lesson.id),
    minutes: cyber.lesson.estimated_duration_minutes.standard,
    resume: cyber.code === 'user_choice', allComplete: cyber.allComplete,
  };

  const path = paths.get(data.arabic.pathId) ?? corePath;
  const arabicIds = [...moduleList].filter(m => path.required_module_ids.includes(m.id)).sort((a, b) => a.sequence - b.sequence)
    .flatMap(m => m.lesson_ids.filter(id => !lessonIndex[id].optional));
  const arabicStep = nextArabicStep(data, arabicIds);
  const arabicComplete = arabicIds.length > 0 && arabicIds.every(id => arabicLessonDone(data, id));
  const arabicOption: LearningOption = {
    subject: 'arabic', label: 'Arabic Fuṣḥā', title: lessonIndex[arabicStep.lessonId].title,
    detail: arabicStep.resume ? 'Resume your open Arabic session'
      : arabicComplete ? 'Every required lesson has a finished session — choose a lesson to revisit' : 'Next in your course',
    href: '#study/arabic/' + encodeURIComponent(arabicStep.lessonId),
    minutes: lessonIndex[arabicStep.lessonId].minutes, resume: arabicStep.resume, allComplete: arabicComplete,
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
  });

  // The learner's explicit choice wins over recent activity; default to fundamentals.
  const preferred = data.study.settings.primarySubject ?? 'cybersecurity';
  const pinned = options.find(o => o.subject === preferred);
  return pinned ? [pinned, ...options.filter(o => o !== pinned)] : options;
}
