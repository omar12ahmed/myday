// Which Arabic in the course has a synthesised voice: one definition, shared by the scripts that make the clips
// (make-arabic-audio.mjs), check them at every build (prepare-audio.mjs) and count what's left
// (arabic-audio-inventory.mjs). See specs/arabic-audio-course.md for the rounds and the rules.
//
// A clip belongs to its exact text, so one clip serves every place that text appears. Only fully vowelled text gets
// a voice (the marks are how a listener and the cross-check know it was read right), never a letter drill (it would
// be read as letter names).
import { readFileSync } from 'node:fs';

export const LETTER = /[ء-يٱ]/g;
const MARK = /[ً-ْٰ]/g;
export const letters = s => (s.match(LETTER) || []).length;
// Marks per Arabic letter: full at 0.4 or more (long-vowel letters and a word's last letter carry no mark, so even a
// fully vowelled word sits near 0.5), none at 0.
export const vowelling = s => { const n = letters(s), m = (s.match(MARK) || []).length; return m === 0 ? 'none' : m / n >= 0.4 ? 'full' : 'partial'; };
export const kind = s => {
  const words = s.trim().split(/\s+/).filter(w => letters(w));
  if (words.every(w => letters(w) === 1)) return 'letters';
  const sentences = s.split(/[.؟!?]\s*/).filter(x => letters(x)).length;
  if (sentences >= 2 && words.length >= 12) return 'passage';
  if (/[.؟!?]\s*$/.test(s.trim()) || words.length >= 5) return 'sentence';
  return words.length === 1 ? 'word' : 'phrase';
};
// Worth a voice: fully vowelled, not a letter drill, at least two letters.
export const voiceable = s => typeof s === 'string' && letters(s) >= 2 && vowelling(s) === 'full' && kind(s) !== 'letters';

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
  ];
}
