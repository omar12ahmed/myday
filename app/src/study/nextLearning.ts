// A read-only recommendation derived from the ordered curricula and saved learner progress.
// Content stays in each curriculum; there is no extra cursor to get out of sync.
import type { MyDayData } from '../data/types';
import { nextStep as nextArabicStep, lessonDone as arabicLessonDone } from '../data/arabic/sessions';
import { stIndex } from '../data/study/roadmap';
import { lessonIndex, moduleList, paths, corePath } from './arabic/catalogue';
import { nextLesson as nextCyberLesson } from './cybersecurity/learning';
import { modules as cyberModules, selectedPath as cyberPath } from './cybersecurity/catalogue';

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
export function learningOptions(data: MyDayData): LearningOption[] {
  const cyber = nextCyberLesson(data);
  const cyberPathNow = cyberPath(data.cybersecurity.pathId);
  const cyberIds = cyberPathNow.required_module_ids.flatMap(id => cyberModules.get(id)?.lesson_ids ?? []);
  const ix = stIndex(data.study);
  const cyberDone = cyberIds.length > 0 && cyberIds.every(id => ix.task.get('cyber:1:' + id)?.node.done === true);
  const cyberOption: LearningOption = {
    subject: 'cybersecurity', label: 'Cybersecurity', title: cyber.lesson.title,
    detail: cyberDone ? 'Required lessons marked complete — revisit any lesson' : 'Next in your foundation-to-advanced path',
    href: '#study/cybersecurity/' + encodeURIComponent(cyber.lesson.id),
    minutes: cyber.lesson.estimated_duration_minutes.standard,
    resume: cyber.code === 'user_choice', allComplete: cyberDone,
  };

  const path = paths.get(data.arabic.pathId) ?? corePath;
  const arabicIds = [...moduleList].filter(m => path.required_module_ids.includes(m.id)).sort((a, b) => a.sequence - b.sequence)
    .flatMap(m => m.lesson_ids.filter(id => !lessonIndex[id].optional));
  const arabicStep = nextArabicStep(data, arabicIds);
  const arabicComplete = arabicIds.length > 0 && arabicIds.every(id => arabicLessonDone(data, id));
  const arabicOption: LearningOption = {
    subject: 'arabic', label: 'Arabic Fuṣḥā', title: lessonIndex[arabicStep.lessonId].title,
    detail: arabicComplete ? 'Your required path is complete — choose a lesson to revisit' : 'Next in your ordered Arabic learning path',
    href: '#study/arabic/' + encodeURIComponent(arabicStep.lessonId),
    minutes: lessonIndex[arabicStep.lessonId].minutes, resume: arabicStep.resume, allComplete: arabicComplete,
  };

  // User-authored roadmap courses remain available, in the order of their stages and lessons.
  // Imported Cybersecurity lessons have their own dedicated option above.
  const general = [...ix.course.values()].filter(e => !e.node.archived && !e.node.id.startsWith('cyber:1:'));
  const nextGeneral = general.flatMap(e => (ix.courseTasks.get(e.node.id) ?? [])
    .filter(t => !t.done).map(t => ({ course: e.node, task: t })))[0];
  const options: LearningOption[] = [cyberOption, arabicOption];
  if (nextGeneral) options.push({
    subject: 'roadmap', label: 'Your courses', title: nextGeneral.task.title,
    detail: nextGeneral.course.title, href: '#study/task/' + encodeURIComponent(nextGeneral.task.id),
    minutes: nextGeneral.task.minutes, resume: false, allComplete: false,
  });

  // The learner's explicit choice wins over recent activity; default to fundamentals.
  const preferred = data.study.settings.primarySubject ?? 'cybersecurity';
  const pinned = options.find(o => o.subject === preferred);
  return pinned ? [pinned, ...options.filter(o => o !== pinned)] : options;
}
