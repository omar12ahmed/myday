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
// Pause forms (waqf), for connected reading only (owner's decision, 25 October 2026): at a pause (a comma, full stop or
// other stop after the word, or the end) a word drops its final short vowel or tanween, as a natural reader does: -an
// becomes ā, a final ة is said -a, a doubled letter stays doubled, ـِيّ and ـُوّ are said ī and ū. A final vowel on ت
// or ك stays, because it can be the only sign of who is speaking or spoken to (أَنْتِ, اسْمُكِ, دَرَسْتِ). Short
// examples elsewhere keep every ending: there the ending is often what the lesson teaches.
const LETTER_OR_MARK = /[\u0621-\u064A\u064B-\u0652\u0670\u0671]/, PAUSE = /[\u060C\u061B\u061F.!?:,]/;
const pauseWord = word => {
  let end = word.length;
  while (end > 0 && !LETTER_OR_MARK.test(word[end - 1])) end--;
  const w = word.slice(0, end), tail = word.slice(end);
  // -an before a written alif or ى, in either order of marks (ـًا ـًّا ـاً ـًى ـىً): ā, a doubling kept (vowel first, as the course writes it).
  const an = w.match(/^(.*[^\u064B-\u0652\u0670])([\u064B-\u0652\u0670]*)([\u0627\u0649])([\u064B-\u0652\u0670]*)$/u);
  if (an && (an[2] + an[4]).includes('\u064B')) return an[1] + '\u064E' + (an[2].includes('\u0651') ? '\u0651' : '') + an[3] + tail;
  // -an on a hamza with no alif after it (ءً، أً): ʾā.
  const hamza = w.match(/^(.*[\u0621\u0623\u0624\u0626])([\u064B-\u0652\u0670]*)$/u);
  if (hamza && hamza[2].includes('\u064B')) return hamza[1] + '\u064E\u0627' + tail;
  const marks = w.match(/[\u064B-\u0652\u0670]*$/)[0], base = w.slice(0, w.length - marks.length);
  if (!/[\u064B-\u0650]/.test(marks)) return word; // already a long vowel or a sukūn
  if (base.endsWith('\u0629')) return base + tail;
  if (/\u0650\u064A$|\u064F\u0648$/.test(base) && marks.includes('\u0651')) return base + tail;
  if (/[\u062A\u0643]$/.test(base) && !/[\u064B-\u064D]/.test(marks)) return word;
  return base + (marks.includes('\u0651') ? '\u0651' : '\u0652') + tail;
};
// A word is at a pause when a stop follows it (also inside a closing quote, or as the next token) or it's the last word.
export const pauseForms = sentence => {
  const words = sentence.split(' '), lettered = words.map(w => LETTER_OR_MARK.test(w)), last = lettered.lastIndexOf(true);
  return words.map((w, i) => {
    if (!lettered[i]) return w;
    let end = w.length;
    while (end > 0 && !LETTER_OR_MARK.test(w[end - 1])) end--;
    const next = words[i + 1];
    return i === last || PAUSE.test(w.slice(end)) || (next !== undefined && !lettered[i + 1] && PAUSE.test(next)) ? pauseWord(w) : w;
  }).join(' ');
};
// A whole reading text as the voice reads it in one go: its sentences as voiced, each line on its own line.
export const wholeText = parts => [...new Set(parts.map(p => p.line))].map(line => parts.filter(p => p.line === line).map(p => p.spoken).join(' ')).join('\n');
// Voice scripts (content/teaching/arabic/voice-scripts.json, MyDay's own; owner's decision, 25 October 2026): a fully
// vowelled copy of a passage the course gives without marks, for the voice only. The page still shows the course's
// text. Each sentence's script must have exactly that sentence's letters, keep every mark the course shows and be
// marked all through, so a script adds marks and never changes a word.
const voiceScripts = root => {
  const at = new URL('content/teaching/arabic/voice-scripts.json', root);
  return existsSync(at) ? JSON.parse(readFileSync(at, 'utf8')) : {};
};
export const scriptedReadings = root => Object.keys(voiceScripts(root).readings ?? {});
const clusters = s => [...s.matchAll(/([^\u064B-\u0652\u0670])([\u064B-\u0652\u0670]*)/gu)].map(m => [m[1], m[2]]);
const keepsMarks = (course, script) => {
  const a = clusters(course), b = clusters(script);
  return a.length === b.length && a.every(([letter, marks], i) => b[i][0] === letter && [...marks].every(x => b[i][1].includes(x)));
};
// A dialogue line opens with its speaker's name (one or two words) and a colon: shown, never spoken. Only a text
// whose every line opens that way is a dialogue, so a colon in prose is read as written.
const SPEAKER = /^[^\s:：]+(?:\s[^\s:：]+)?[:：]\s*/u;
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
    const dialogue = full.every(line => SPEAKER.test(line.trim()));
    if (full.length !== plain.length) throw new Error(`Arabic reading ${a.id}: vowelled and plain lines do not match`);
    if (voice.length !== full.length) throw new Error(`Arabic voice script ${a.id}: its lines do not match the course text's`);
    const parts = full.flatMap((line, i) => {
      const texts = sentences(line), bare = sentences(plain[i]), said = sentences(voice[i]);
      if (texts.length !== bare.length) throw new Error(`Arabic reading ${a.id}: vowelled and plain sentences do not match on line ${i + 1}`);
      if (said.length !== texts.length) throw new Error(`Arabic voice script ${a.id}: its sentences do not match the course text's on line ${i + 1}`);
      return texts.map((text, j) => {
        if (scripts[a.id]) {
          const where = `Arabic voice script ${a.id}: line ${i + 1}, sentence ${j + 1}`;
          if (unmarked(said[j]) !== unmarked(text)) throw new Error(`${where} has other letters than the course text`);
          if (!keepsMarks(text, said[j])) throw new Error(`${where} contradicts a vowel mark the course shows`);
          if (!markedThrough(said[j])) throw new Error(`${where} is not fully vowelled`);
        }
        return { text, plain: bare[j], spoken: pauseForms(dialogue && j === 0 ? said[j].replace(SPEAKER, '') : said[j]), line: i };
      });
    });
    return [a.id, parts];
  }));
}
