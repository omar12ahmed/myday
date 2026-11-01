// The Arabic dictionary (specs/arabic-dictionary.md): every word the course lists (the starter words and each lesson's
// own) and the words you kept, found by their Arabic with or without vowels, by English, or by Latin letters (the app's
// own reading), and browsed by first letter or by root. It all runs here: nothing is sent.
import { fold } from '../../data/projectSearch';
import type { KeptWord } from '../../data/arabic/types';
import { allWords, courseLessons, isCourseWord, lessonWords, type AnyWord } from './courseWords';
import { familyOf } from './families';
import texts from './data/texts.json';
import { transliterate } from './transliterate';

// The letters in dictionary order (hamza alone first; hamza on a seat counts as its seat, as Arabic dictionaries do).
export const LETTERS = Array.from('ءابتثجحخدذرزسشصضطظعغفقكلمنهوي');

// Arabic as search sees it: no vowel marks, tatweel or hamza seats (fold's NFD takes أ إ آ ؤ ئ to ا و ي), ٱ ى ة as
// ا ي ه, letters and single spaces only.
export const arKey = (s: string) => fold(s).replace(/ٱ/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[^ء-ي\s]/g, '').replace(/\s+/g, ' ').trim();
// Latin letters as search sees them: no accents or ʿ ʾ ' -, lower case, a doubled letter as one ("kitaab", "mudaris").
export const latKey = (s: string) => fold(s).replace(/[^a-z\s]/g, '').replace(/(.)\1+/g, '$1').replace(/\s+/g, ' ').trim();
const enWords = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(Boolean);
const hasArabic = (s: string) => /[ء-ي]/.test(s);

// The article with a joined وَ, فَ, بِ or كَ, لِلْـ, or the article alone: الْكِتَاب, بِالْكِتَابِ and لِلْكِتَابِ find كِتَاب.
const ARTICLE = /^(?:وال|فال|بال|كال|لل|ال)(?=..)/;
const bare = (key: string) => key.replace(ARTICLE, '');
// A single joined وَ, فَ, بِ, لِ or كَ in front: tried too, but only as the whole word (وَكِتَاب finds كِتَاب; وَقْت stays).
const JOINED = /^[وفبلك](?=...)/;

export type Entry =
  | { kind: 'word'; id: string; w: AnyWord; lessonId: string | null; firstIn: string | null; order: number; ar: string; lat: string; en: string; root: string | null }
  | { kind: 'yours'; id: string; k: KeptWord; order: number; ar: string; lat: string; en: string; root: null };

// The course's words once, in order: the starter words (with the first lesson that uses each), then each lesson's own.
let course: Entry[] | null = null;
export function courseEntries(): Entry[] {
  if (course) return course;
  const firstIn = new Map<string, string>();
  for (const l of courseLessons) for (const s of lessonWords(l).starter) if (!firstIn.has(s.id)) firstIn.set(s.id, l);
  const word = (w: AnyWord, lessonId: string | null, order: number): Entry => ({
    kind: 'word', id: w.id, w, lessonId, firstIn: lessonId ? null : firstIn.get(w.id) ?? null, order,
    ar: arKey(w.form_ar), lat: latKey(transliterate(w.form_ar).text), en: w.meaning_en,
    root: isCourseWord(w) ? w.root_ar : familyOf(w.id)?.root_ar ?? null,
  });
  const starter = allWords.filter(w => !isCourseWord(w));
  const own = courseLessons.flatMap(l => lessonWords(l).own.map(w => [w, l] as const));
  course = [...starter.map((w, i) => word(w, null, i)), ...own.map(([w, l], i) => word(w, l, starter.length + i))];
  return course;
}
export const yourEntries = (kept: KeptWord[]): Entry[] => kept.map((k, i) => ({
  kind: 'yours', id: k.id, k, order: 100000 + i, ar: arKey(k.ar), lat: latKey(transliterate(k.ar).text), en: k.meaning, root: null,
}));
export const dictionarySize = () => ({ starter: texts.lexicon.length, course: courseEntries().length - texts.lexicon.length });

// How well an entry fits what you typed: 0 the word itself, 1 it starts with it, 2 it has it inside; null no match.
// Arabic is matched on the Arabic (with the article or a joined letter tried off as well); anything else on the English
// meaning, word by word from the start of a word ("door" finds a door, not "indoor"), and on the app's Latin reading.
export function rank(e: Entry, query: string): number | null {
  const best = (xs: (number | null)[]) => { const ns = xs.filter((x): x is number => x !== null); return ns.length ? Math.min(...ns) : null; };
  if (hasArabic(query)) {
    const q = arKey(query); if (!q) return null;
    const forms = [...new Set([e.ar, bare(e.ar)])], qs = [...new Set([q, bare(q)])], joined = JOINED.test(bare(q)) ? bare(q).slice(1) : null;
    return best(forms.flatMap(f => [
      ...qs.map(x => f === x ? 0 : f.startsWith(x) ? 1 : x === q && x.length >= 2 && f.includes(x) ? 2 : null),
      joined !== null && f === joined ? 0 : null,
    ]));
  }
  const words = enWords(query), mean = enWords(e.en.replace(/\s*\(.*$/, '')), all = enWords(e.en);
  const en = !words.length ? null
    : words.join(' ') === mean.join(' ') ? 0
    : mean[0]?.startsWith(words[0]) && words.every(w => all.some(m => m.startsWith(w))) ? 1
    : words.every(w => all.some(m => m.startsWith(w))) ? 2 : null;
  const q = latKey(query);
  const lat = !q || !e.lat ? null : e.lat === q ? 0 : e.lat.startsWith(q) ? 1 : q.length >= 3 && e.lat.includes(q) ? 2 : null;
  return best([en, lat]);
}
// The entries that fit, best first, then in the course's order (your own words after the course's).
export function search(query: string, kept: KeptWord[]): Entry[] {
  if (!query.trim()) return [];
  return [...courseEntries(), ...yourEntries(kept)].map(e => ({ e, r: rank(e, query) })).filter((x): x is { e: Entry; r: number } => x.r !== null)
    .sort((a, b) => a.r - b.r || a.e.order - b.e.order).map(x => x.e);
}

// Browsing: the first letter of a word (the article left off), and of a root.
export const letterOf = (e: Entry) => { const c = bare(e.ar).charAt(0); return LETTERS.includes(c) ? c : null; };
export const rootLetter = (root: string) => { const c = arKey(root).charAt(0); return LETTERS.includes(c) ? c : null; };
const byArabic = (a: string, b: string) => a.localeCompare(b, 'ar');
export function withLetter(entries: Entry[], letter: string): Entry[] {
  return entries.filter(e => letterOf(e) === letter).sort((a, b) => byArabic(bare(a.ar), bare(b.ar)) || a.order - b.order);
}
// Roots starting with a letter, each with its words in the course's order.
export function rootsWith(entries: Entry[], letter: string): { root: string; entries: Entry[] }[] {
  const roots = new Map<string, Entry[]>();
  for (const e of entries) if (e.root && rootLetter(e.root) === letter) roots.set(e.root, [...roots.get(e.root) ?? [], e]);
  return [...roots].map(([root, es]) => ({ root, entries: es })).sort((a, b) => byArabic(arKey(a.root), arKey(b.root)));
}
// The course's words that the dictionary would offer for what you type (vowel marks, hamza seats and the article aside).
export function inDictionary(ar: string): Entry[] {
  const q = arKey(ar); if (!q) return [];
  return courseEntries().filter(e => e.ar === q || bare(e.ar) === bare(q));
}
