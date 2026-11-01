import texts from './data/texts.json';

// Course words (MyDay's own, content/teaching/arabic/course-words.json, checked by app/scripts/prepare-arabic.mjs):
// each lesson's words, with meaning, root, example and note, and the starter words it uses (by id). A word's
// revision cards are the starter words' kind ("<word id>:recognise"), so revision finds either the same way.
export type StarterWord = (typeof texts.lexicon)[number];
// `dictionary`: listed for the dictionary only (specs/arabic-dictionary.md §4): a word the lesson uses, found in the
// dictionary, but never one of the lesson's own new words, so marking the lesson ready doesn't bring it into revision.
export interface CourseWord { id: string; form_ar: string; meaning_en: string; part_of_speech: string; root_ar: string | null; root_reading: string | null; example_ar: string; example_meaning_en: string; note: string; dictionary?: true }
export type AnyWord = StarterWord | CourseWord;
const course = texts.course as Record<string, { seed?: string[]; words: CourseWord[] }>;
const starter = new Map(texts.lexicon.map(w => [w.id, w]));
const byId = new Map<string, AnyWord>([...starter, ...Object.values(course).flatMap(e => e.words.map(w => [w.id, w] as const))]);

export const wordById = (id: string): AnyWord | null => byId.get(id) ?? null;
// Every word the course has: the starter words first, then each lesson's.
export const allWords: AnyWord[] = [...byId.values()];
export const isCourseWord = (w: AnyWord): w is CourseWord => 'root_ar' in w;
// A lesson's own words, the starter words it uses (only those that exist), and the words it also uses that are listed
// for the dictionary only.
export const lessonWords = (lessonId: string): { own: CourseWord[]; starter: StarterWord[]; also: CourseWord[] } => ({
  own: (course[lessonId]?.words ?? []).filter(w => !w.dictionary),
  starter: (course[lessonId]?.seed ?? []).map(id => starter.get(id)).filter((w): w is StarterWord => !!w),
  also: (course[lessonId]?.words ?? []).filter(w => w.dictionary),
});
// Every word a lesson lists, its own and the dictionary's, in the list's order.
export const allLessonWords = (lessonId: string): CourseWord[] => course[lessonId]?.words ?? [];
// The word ids a lesson brings back when you mark it ready: its own words and the starter words it uses (never the
// dictionary's words, which join revision only when you add them).
export const lessonWordIds = (lessonId: string) => { const w = lessonWords(lessonId); return [...w.own, ...w.starter].map(x => x.id); };
// The lessons that have course words, in the order the list gives them.
export const courseLessons = Object.keys(course);
