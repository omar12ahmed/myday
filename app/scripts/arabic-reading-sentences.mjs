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
