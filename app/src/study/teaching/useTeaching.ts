import { useEffect, useState } from 'react';

// The teaching companions (explanation, worked example, Try it, its explained answer and the assigned material), one
// large file per course, loaded on demand.
export type Course = 'cybersecurity' | 'arabic-fusha';
interface Source { title: string; kind: string; url: string; checkedOn: string; access: string }
interface Teaching { explanation: string; example: string; practice: string; solution: string; resources: { sourceId: string; instruction: string }[] }
interface Companion { lessons: Record<string, Teaching>; sources: Record<string, Source> }
const loaders: Record<Course, () => Promise<{ default: Companion }>> = {
  cybersecurity: () => import('../../../../content/teaching/cybersecurity.json'),
  'arabic-fusha': () => import('../../../../content/teaching/arabic-fusha.json'),
};

// One lesson's teaching, outside a component ("Check my answer" loads it only when you ask); null if it can't be opened.
export const loadTeaching = (course: Course, lessonId: string): Promise<Teaching | null> =>
  loaders[course]().then(m => m.default.lessons[lessonId] ?? null, () => null);

// The lesson's teaching: loaded once per course (a large file, on demand). No progress is written by reading.
export function useTeaching(course: Course, lessonId: string) {
  const [book, setBook] = useState<Companion | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    loaders[course]().then(m => { if (active) { setBook(m.default); setFailed(false); } })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [course]);
  const lesson = book?.lessons[lessonId] ?? null;
  return { lesson, sources: book?.sources ?? {}, missing: !lesson && (failed || !!book), voice: course === 'arabic-fusha' ? `${lessonId}:teaching` : undefined };
}
export type TeachingParts = ReturnType<typeof useTeaching>;
