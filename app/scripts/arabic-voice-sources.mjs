// Which Arabic in the course has a synthesised voice: one definition, shared by the scripts that make the clips
// (make-arabic-audio.mjs), check them at every build (prepare-audio.mjs) and count what's left
// (arabic-audio-inventory.mjs). See specs/arabic-audio-course.md for the rounds and the rules.
//
// A clip belongs to its exact text, so one clip serves every place that text appears. Only fully vowelled text gets
// a voice (the marks are how a listener and the cross-check know it was read right), never a letter drill (it would
// be read as letter names).
import { readFileSync } from 'node:fs';
import { readingPassages, voiceable } from './arabic-reading-sentences.mjs';
export { LETTER, letters, vowelling, kind, voiceable } from './arabic-reading-sentences.mjs';

// The voiced sources, in the order of the rounds. Each gives the exact texts it voices (as the app shows them).
export function voiceSources(root) {
  const read = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
  const course = read('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json');
  const uniq = xs => [...new Set(xs)];
  return [
    // Round one (1.39.0): the 48 starter words and their example sentences, all of them.
    { id: 'starter-words', round: 1, label: 'starter words and their examples', texts: uniq(course.lexicon_seed.flatMap(w => [w.form_ar, w.example_ar])) },
    // Round two (1.40.0): each lesson's headline example, where it's fully vowelled and not a letter drill.
    { id: 'lesson-examples', round: 2, label: 'lessons’ headline examples', texts: uniq(course.lessons.map(l => l.example?.text_ar).filter(voiceable)) },
    { id: 'reading-texts', round: 3, label: 'vowelled reading texts, by sentence', texts: uniq(Object.values(readingPassages(root)).flatMap(parts => parts.map(p => p.spoken))) },
  ];
}
