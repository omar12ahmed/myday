// Which Arabic in the course has a synthesised voice: one definition, shared by the scripts that make the clips
// (make-arabic-audio.mjs), check them at every build (prepare-audio.mjs) and count what's left
// (arabic-audio-inventory.mjs). See specs/arabic-audio-course.md for the rounds and the rules.
//
// A clip belongs to its exact text, so one clip serves every place that text appears. Only fully vowelled text gets
// a voice (the marks are how a listener and the cross-check know it was read right), never a letter drill (it would
// be read as letter names).
import { readFileSync } from 'node:fs';
import { readingPassages, voiceable } from './arabic-reading-sentences.mjs';
import { arabicRuns } from '../src/study/arabic/arabic-runs.mjs';
export { LETTER, letters, vowelling, kind, voiceable, markedThrough } from './arabic-reading-sentences.mjs';
import { kind, letters, markedThrough, voiceable as voiceableText } from './arabic-reading-sentences.mjs';
// A course word or its example: the shared rule, or marked all through (short words like مَاء).
export const courseVoiceable = s => voiceableText(s) || (typeof s === 'string' && !s.includes('ـ') && letters(s) >= 2 && markedThrough(s) && kind(s) !== 'letters');

// Punctuation helps the voice pause between alternatives and finish an isolated form. No letters or marks change.
export function spokenText(text) {
  const s = text.replace(/\s*\/\s*/g, '، ');
  return /[.؟!?]$/.test(s) ? s : s + '.';
}

// The voiced sources, in the order of the rounds. Each gives the exact texts it voices (as the app shows them).
export function voiceSources(root) {
  const read = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
  const course = read('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json');
  const teaching = read('content/teaching/arabic-fusha.json');
  const families = read('content/teaching/arabic/word-families.json');
  const keys = read('content/arabic-fusha/MyDay_Arabic_Assessment_Keys.json');
  const words = Object.values(read('content/teaching/arabic/course-words.json').lessons).flatMap(l => l.words);
  const uniq = xs => [...new Set(xs)];
  const mixed = values => uniq(values.filter(v => typeof v === 'string').flatMap(v => arabicRuns(v).map(p => p.text.trim())).filter(voiceable));
  return [
    // Round one (1.39.0): the 48 starter words and their example sentences, all of them.
    { id: 'starter-words', round: 1, label: 'starter words and their examples', texts: uniq(course.lexicon_seed.flatMap(w => [w.form_ar, w.example_ar])) },
    // Round two (1.40.0): each lesson's headline example, where it's fully vowelled and not a letter drill.
    { id: 'lesson-examples', round: 2, label: 'lessons’ headline examples', texts: uniq(course.lessons.map(l => l.example?.text_ar).filter(voiceable)) },
    { id: 'reading-texts', round: 3, label: 'vowelled reading texts, by sentence', texts: uniq(Object.values(readingPassages(root)).flatMap(parts => parts.map(p => p.spoken))) },
    { id: 'teaching', round: 3, label: 'teaching examples, practice and solutions', texts: mixed(Object.values(teaching.lessons).flatMap(l => [l.example, l.practice, l.solution, l.explanation])) },
    { id: 'sounds-families', round: 3, label: 'sound pairs and word families', texts: mixed([
      ...course.assets.flatMap(a => (a.pairs || []).flatMap(p => [p.a, p.b])),
      ...families.families.flatMap(f => [f.pattern_en, ...Object.values(f.word_notes || {}), ...(f.also_in_examples || []).flatMap(x => [x.form_ar, x.note_en])]),
    ]) },
    { id: 'lesson-checks', round: 3, label: 'lesson checks and answers, only after reveal', texts: mixed([
      ...course.assessments.flatMap(a => (a.questions || []).map(q => q.prompt)), ...keys.answer_keys.map(k => k.expected_answer),
    ]) },
    // Round four: the course words (content/teaching/arabic/course-words.json), each word, its example and the Arabic
    // in its note, once the owner has checked the list.
    { id: 'course-words', round: 4, label: 'course words, their examples and notes', texts: uniq([...words.flatMap(w => [w.form_ar, w.example_ar]).filter(courseVoiceable), ...mixed(words.map(w => w.note))]) },
  ];
}
