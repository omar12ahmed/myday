// "Your focus": one choice of what to learn next, used by Today and Study home (specs/study-home-and-lessons.md §3).
// It has no field of its own: Arabic and Cybersecurity are study.settings.primarySubject; one of your courses is
// primarySubject 'roadmap' with focusCourseId. focusCourseId keeps its meaning for the classic MyDay (it shares the
// study section), so choosing Arabic or Cybersecurity leaves it as it is.
import type { MyDayData, StudyCourse, StudyData } from '../types';
import { stIndex, type StudyIndex } from './roadmap';

// The Cybersecurity course's own copy in the roadmap (its completion marks): its focus is Cybersecurity.
const guided = (id: string) => id.startsWith('cyber:1:');
const hasWork = (ix: StudyIndex, c: StudyCourse) => !!ix.courseTasks.get(c.id)?.some(t => !t.done);

// Your own courses you can focus on, in roadmap order (archived ones aside).
export const focusableCourses = (ix: StudyIndex) => [...ix.course.values()].map(e => e.node).filter(c => !c.archived && !guided(c.id));

// The course that's your focus, only when your focus is one of your courses (otherwise no course is labelled the
// focus): the one you chose, unless it's finished and another has work left; otherwise the first with work left.
export function courseFocus(st: StudyData, ix: StudyIndex): StudyCourse | null {
  if (st.settings.primarySubject !== 'roadmap') return null;
  const courses = focusableCourses(ix), chosen = courses.find(c => c.id === st.focusCourseId);
  if (chosen && (hasWork(ix, chosen) || !ix.courseTasks.get(chosen.id)?.length)) return chosen;
  return courses.find(c => hasWork(ix, c)) ?? chosen ?? courses[0] ?? null;
}

// The choice as one value: 'arabic', 'cybersecurity', 'course:<id>', or 'roadmap' when it's your courses and there are none.
export function focusValue(st: StudyData, ix: StudyIndex): string {
  if (st.settings.primarySubject !== 'roadmap') return st.settings.primarySubject;
  const c = courseFocus(st, ix);
  return c ? 'course:' + c.id : 'roadmap';
}
export interface FocusChoice { value: string; label: string; course: boolean }
export function focusChoices(st: StudyData, ix: StudyIndex): FocusChoice[] {
  const out: FocusChoice[] = [{ value: 'cybersecurity', label: 'Cybersecurity', course: false }, { value: 'arabic', label: 'Arabic Fuṣḥā', course: false },
    ...focusableCourses(ix).map(c => ({ value: 'course:' + c.id, label: c.title.trim() || 'Untitled course', course: true }))];
  if (focusValue(st, ix) === 'roadmap') out.push({ value: 'roadmap', label: 'Your courses', course: true });
  return out;
}

// Changes your focus (a draft, see storage.ts update()). False when nothing changed or the course isn't there.
export function chooseFocus(d: MyDayData, value: string): boolean {
  const st = d.study, before = st.settings.primarySubject + '|' + st.focusCourseId;
  if (value === 'arabic' || value === 'cybersecurity' || value === 'roadmap') st.settings.primarySubject = value;
  else if (value.startsWith('course:')) {
    const c = stIndex(st).course.get(value.slice('course:'.length));
    if (!c || c.node.archived) return false;
    st.settings.primarySubject = guided(c.node.id) ? 'cybersecurity' : 'roadmap';
    st.focusCourseId = c.node.id;
  } else return false;
  return st.settings.primarySubject + '|' + st.focusCourseId !== before;
}
