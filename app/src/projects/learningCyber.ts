// Cybersecurity lessons for a project's Learning card (data/studyLinks.ts), loaded on demand like learningArabic.ts.
// Cybersecurity has no lesson states (yet): Study says a lesson is marked complete (its roadmap task ticked) or started
// (an attempt on one of its activities, a Study session on it, or its task ticked), and so does the card.
import { curriculumTaskId } from '../data/cybersecurity/types';
import { stIndex } from '../data/study/roadmap';
import type { MyDayData } from '../data/types';
import { lessons, modules } from '../study/cybersecurity/catalogue';
import { practised, selectedPathLessons } from '../study/cybersecurity/learning';

// A lesson's title and its status in Study's words; null when it isn't in the course any more.
export function lesson(data: MyDayData, id: string) {
  const l = lessons.get(id);
  if (!l) return null;
  const done = stIndex(data.study).task.get(curriculumTaskId(id))?.node.done === true;
  return { title: l.title, status: done ? 'Marked complete' : practised(data, l) ? 'Started' : 'Not started' };
}
// Your path's lessons in course order, each with its module's name (the list groups them) and, as Study's module page
// says, whether it's optional, for "Link something".
export const choices = (data: MyDayData) => selectedPathLessons(data.cybersecurity.pathId).map(l => ({ id: l.id, title: l.title, group: modules.get(l.module_id)?.name ?? '', optional: l.optional }));
