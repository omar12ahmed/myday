// Text boundaries shared by authoring, the audio audit and the app's generated reading list.
// The curriculum stays untouched. Dialogue names remain on screen but are not spoken.
import { existsSync, readFileSync } from 'node:fs';

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
// The letters alone, every vowel mark taken off.
export const unmarked = s => s.replace(/[\u064B-\u0652\u0670]/g, '');
// Pause forms (waqf), for connected reading only (owner's decision, 25 October 2026): before a comma, full stop or
// other pause, and at the end, a word drops its final short vowel or tanween, as a natural reader does: -an becomes \u0101,
// a final \u0629 is said -a, a doubled letter stays doubled. A final vowel on \u062A or \u0643 stays, because it can be the only sign
// of who is speaking or spoken to (\u0623\u064E\u0646\u0652\u062A\u0650, \u0627\u0633\u0652\u0645\u064F\u0643\u0650, \u062F\u064E\u0631\u064E\u0633\u0652\u062A\u0650). Short examples elsewhere keep every ending: there the
// ending is often what the lesson teaches.
const LETTER_OR_MARK = /[\u0621-\u064A\u064B-\u0652\u0670\u0671]/;
const pauseWord = word => {
  let end = word.length;
  while (end > 0 && !LETTER_OR_MARK.test(word[end - 1])) end--;
  const w = word.slice(0, end), tail = word.slice(end);
  if (/\u064B\u0627$/.test(w)) return w.slice(0, -2) + '\u064E\u0627' + tail; // \u0640\u064B\u0627: \u0101
  if (/\u0621\u064B$/.test(w)) return w.slice(0, -1) + '\u064E\u0627' + tail; // \u0640\u0621\u064B: \u02BE\u0101
  if (/\u064B\u0649$/.test(w)) return w.slice(0, -2) + '\u064E\u0649' + tail; // \u0640\u064B\u0649: \u0101
  const marks = w.match(/[\u064B-\u0652\u0670]*$/)[0], base = w.slice(0, w.length - marks.length);
  if (!/[\u064B-\u0650]/.test(marks)) return word; // already a long vowel or a suk\u016Bn
  if (base.endsWith('\u0629')) return base + tail;
  if (/[\u062A\u0643]$/.test(base) && !/[\u064B-\u064D]/.test(marks)) return word;
  return base + (marks.includes('\u0651') ? '\u0651' : '\u0652') + tail;
};
export const pauseForms = sentence => sentence.split(' ').map((w, i, all) => (i === all.length - 1 || /[\u060C.\u061B\u061F!:]$/.test(w) ? pauseWord(w) : w)).join(' ');
// A whole reading text as the voice reads it in one go: its sentences as voiced, each line on its own line.
export const wholeText = parts => [...new Set(parts.map(p => p.line))].map(line => parts.filter(p => p.line === line).map(p => p.spoken).join(' ')).join('\n');
// Voice scripts (content/teaching/arabic/voice-scripts.json, MyDay's own; owner's decision, 25 October 2026): a fully
// vowelled copy of a passage the course gives without marks, for the voice only. The page still shows the course's
// text. Each sentence's script must have exactly that sentence's letters, so a script adds marks and never changes a word.
const voiceScripts = root => {
  const at = new URL('content/teaching/arabic/voice-scripts.json', root);
  return existsSync(at) ? JSON.parse(readFileSync(at, 'utf8')) : {};
};
export function readingPassages(root) {
  const course = JSON.parse(readFileSync(new URL('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json', root), 'utf8'));
  const scripts = voiceScripts(root).readings ?? {};
  for (const id of Object.keys(scripts)) {
    const a = course.assets.find(x => x.id === id && x.type === 'original_text');
    if (!a) throw new Error(`Arabic voice script ${id}: the course has no reading text with that id`);
    if (voiceable(a.text_ar)) throw new Error(`Arabic voice script ${id}: the course already gives this text with vowel marks`);
  }
  return Object.fromEntries(course.assets.filter(a => a.type === 'original_text' && (voiceable(a.text_ar) || scripts[a.id])).map(a => {
    const full = a.text_ar.split('\n'), plain = (a.text_unvowelled || a.text_ar).split('\n'), voice = (scripts[a.id] ?? a.text_ar).split('\n');
    if (full.length !== plain.length) throw new Error(`Arabic reading ${a.id}: vowelled and plain lines do not match`);
    if (voice.length !== full.length) throw new Error(`Arabic voice script ${a.id}: its lines do not match the course text's`);
    const parts = full.flatMap((line, i) => {
      const texts = sentences(line), bare = sentences(plain[i]), said = sentences(voice[i]);
      if (texts.length !== bare.length) throw new Error(`Arabic reading ${a.id}: vowelled and plain sentences do not match on line ${i + 1}`);
      if (said.length !== texts.length) throw new Error(`Arabic voice script ${a.id}: its sentences do not match the course text's on line ${i + 1}`);
      return texts.map((text, j) => {
        if (unmarked(said[j]) !== unmarked(text)) throw new Error(`Arabic voice script ${a.id}: line ${i + 1}, sentence ${j + 1} has other letters than the course text`);
        return { text, plain: bare[j], spoken: pauseForms(said[j].replace(/^[^:：]+[:：]\s*/u, '')), line: i };
      });
    });
    return [a.id, parts];
  }));
}
