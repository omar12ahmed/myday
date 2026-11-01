// Today's learning task from Study's next step (specs/today-learning-and-tidy.md §2): what the plan builder takes, and
// what an entry still to do shows on Today (the step it is now, so moving on in Study moves it too; its button is
// StudyEntryAction.tsx). Nothing here is saved; the plan entry keeps only its subject (data/plan.ts).
import type { StudyPick } from '../data/plan';
import type { MyDayData, Task } from '../data/types';
import type { LearningOption } from './courseOption';

type NextLearning = typeof import('./nextLearning');

// The Study card's first option, as the learning task to plan: none when your path is complete with nothing to revise
// or resume (your own Learning list is used then).
export function studyPick(m: NextLearning, data: MyDayData): StudyPick | null {
  const o = m.learningOptions(data)[0];
  if (!o || (o.allComplete && !o.resume && !o.revise)) return null;
  if (o.subject === 'roadmap') return { subject: 'roadmap', ...(o.courseId ? { courseId: o.courseId } : {}), title: `${courseOf(o)} — your next step`, minutes: o.minutes };
  return { subject: o.subject, title: `${o.label} — your next lesson`, minutes: o.minutes };
}
// One of your courses: its title is the option's detail while it has a next task, else its title.
const courseOf = (o: LearningOption) => (o.taskId ? o.detail : o.title);

export interface StudyNow { title: string; detail: string; option: LearningOption }
// What a Study entry still to do is now: the current option for its subject (and course), named for its subject.
export function studyNow(options: LearningOption[] | null | undefined, t: Task): StudyNow | null {
  if (!t.study || t.done || !options) return null;
  const s = t.study, o = options.find(x => x.subject === s.subject && (s.subject !== 'roadmap' || !s.courseId || x.courseId === s.courseId));
  if (!o) return null;
  const title = o.subject === 'roadmap' ? (o.taskId ? `${o.detail} · ${o.title}` : o.title) : `${o.label} · ${o.title}`;
  const detail = o.subject === 'roadmap' ? 'Next in your course' : o.detail;
  return { title, detail, option: o };
}
// The name it keeps once done ("Arabic Fuṣḥā: The Fuṣḥā register"), and the lesson.
export const studyDoneAs = (n: StudyNow) => ({ title: n.title.replace(' · ', ': '), lessonId: n.option.lessonId ?? n.option.taskId });
