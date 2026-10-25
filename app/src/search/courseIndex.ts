// The Arabic and Cybersecurity courses' modules and lessons by title, for Search everywhere (data/searchAll.ts). The two
// catalogues are large, so this file is only ever loaded with import() when Search opens. Titles and a module's
// purpose only — never a lesson's checks or their reference answers.
import { lessonIndex, moduleList } from '../study/arabic/catalogue';
import { allWords, courseLessons, isCourseWord, lessonWords } from '../study/arabic/courseWords';
import { activities, curriculum, lessons, modules } from '../study/cybersecurity/catalogue';
import type { CourseIndex } from '../data/searchAll';

export function courseIndex(): CourseIndex {
  const cyLessons = [...lessons.values()];
  const lessonOf = new Map(curriculum.exercises.map(e => [e.id, e.lesson_id]));
  return {
    arabic: {
      modules: moduleList.map(m => ({ id: m.id, name: m.name, purpose: m.purpose ?? '' })),
      lessons: Object.entries(lessonIndex).map(([id, l]) => ({ id, title: l.title, moduleId: l.module_id })),
      words: [
        ...allWords.filter(w => !isCourseWord(w)).map(w => ({ id: w.id, ar: w.form_ar, meaning: w.meaning_en, example: w.example_ar, exampleMeaning: w.example_meaning_en, lessonId: null })),
        ...courseLessons.flatMap(lessonId => lessonWords(lessonId).own.map(w => ({ id: w.id, ar: w.form_ar, meaning: w.meaning_en, example: w.example_ar, exampleMeaning: w.example_meaning_en, lessonId }))),
      ],
    },
    cyber: {
      modules: [...modules.values()].map(m => ({ id: m.id, name: m.name, purpose: m.purpose ?? '' })),
      lessons: cyLessons.map(l => ({ id: l.id, title: l.title, moduleId: l.module_id })),
      // A notebook activity by its name, with its lesson's when it has one ("Practical task · Learning through evidence").
      activities: [...activities.values()].map(a => {
        const lesson = lessons.get(lessonOf.get(a.id) ?? '')?.title;
        return { id: a.id, title: lesson ? `${a.title} · ${lesson}` : a.title };
      }),
    },
  };
}
