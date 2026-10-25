// Text boundaries shared by authoring, the audio audit and the app's generated reading list.
// The curriculum stays untouched. Dialogue names remain on screen but are not spoken.
import { readFileSync } from 'node:fs';

export const LETTER = /[\u0621-\u063F\u0641-\u064A\u0671]/g; // U+0640 is a joining mark, not a letter.
export const letters = s => (s.match(LETTER) || []).length;
export const vowelling = s => {
  const n = letters(s), m = (s.match(/[ً-ْٰ]/g) || []).length;
  return m === 0 ? 'none' : m / n >= 0.4 ? 'full' : 'partial';
};
export const kind = s => {
  const words = s.trim().split(/\s+/).filter(w => letters(w));
  const syllables = s.trim().split(/[\s،؛]+/).filter(Boolean);
  const drill = syllables.length > 1 && syllables.every(w => /^[ء-غف-ي][َُِ][اوي]?$/.test(w) && w[0] === syllables[0][0]);
  if (words.every(w => letters(w) === 1) || drill) return 'letters';
  const sentences = s.split(/[.؟!?]\s*/).filter(x => letters(x)).length;
  if (sentences >= 2 && words.length >= 12) return 'passage';
  if (/[.؟!?]\s*$/.test(s.trim()) || words.length >= 5) return 'sentence';
  return words.length === 1 ? 'word' : 'phrase';
};
// Marked all through: every letter carries its vowel mark except those that never take one in the course's writing — a
// long-vowel alif (ا ى آ ٱ), و or ي after a matching vowel, the article's ل before a doubled (sun) letter, and a word's
// last letter in its dictionary form. Stricter than vowelling()'s ratio for short words like مَاء, which it calls partial.
const MARK = /[\u064B-\u0652\u0670]/, ALIF = '\u0627\u0649\u0622\u0671', SHADDA = '\u0651';
export const markedThrough = s => typeof s === 'string' && s.split(/\s+/).filter(w => letters(w)).every(word => {
  const c = [...word].filter(x => /[\u0621-\u064A\u0671]/.test(x) || MARK.test(x)), at = c.map((x, i) => (MARK.test(x) ? -1 : i)).filter(i => i >= 0);
  return at.every((i, n) => MARK.test(c[i + 1] ?? '') || ALIF.includes(c[i]) || n === at.length - 1
    || (c[i] === '\u0648' && [c[i - 1], c[i - 2]].includes('\u064F')) || (c[i] === '\u064A' && [c[i - 1], c[i - 2]].includes('\u0650'))
    || (c[i] === '\u0644' && n > 0 && ALIF.includes(c[at[n - 1]]) && [c[at[n + 1] + 1], c[at[n + 1] + 2]].includes(SHADDA)));
});
// A joining mark here denotes an affix or an unfinished practice word, not a whole word to imitate.
export const voiceable = s => typeof s === 'string' && !s.includes('ـ') && /[ً-ِْٰ]/.test(s) && letters(s) >= 2 && vowelling(s) === 'full' && kind(s) !== 'letters';

const sentences = line => line.trim().split(/(?<=[.؟!?])\s+/u).filter(Boolean);
export function readingPassages(root) {
  const course = JSON.parse(readFileSync(new URL('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json', root), 'utf8'));
  return Object.fromEntries(course.assets.filter(a => a.type === 'original_text' && voiceable(a.text_ar)).map(a => {
    const full = a.text_ar.split('\n'), plain = (a.text_unvowelled || a.text_ar).split('\n');
    if (full.length !== plain.length) throw new Error(`Arabic reading ${a.id}: vowelled and plain lines do not match`);
    const parts = full.flatMap((line, i) => {
      const texts = sentences(line), bare = sentences(plain[i]);
      if (texts.length !== bare.length) throw new Error(`Arabic reading ${a.id}: vowelled and plain sentences do not match on line ${i + 1}`);
      return texts.map((text, j) => ({ text, plain: bare[j], spoken: text.replace(/^[^:：]+[:：]\s*/u, ''), line: i }));
    });
    return [a.id, parts];
  }));
}
