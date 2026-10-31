// A reading aid for the course's written Arabic, not a text-to-speech engine.
// Missing short vowels are never silently invented. Authored phrase readings take precedence.
import authored from '../../../../content/teaching/pronunciation/readings.json';

export interface Reading { text: string; incomplete: boolean; note?: string }
const readings: Record<string, string> = Object.fromEntries(Object.entries(authored).map(([k, v]) => [k.normalize('NFC').replace(/\s+/g, ' ').trim(), v]));
const letters: Record<string, string> = {
  'ء': 'ʾ', 'أ': 'ʾ', 'إ': 'ʾ', 'ؤ': 'ʾ', 'ئ': 'ʾ', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'ḥ', 'خ': 'kh',
  'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 'ṣ', 'ض': 'ḍ', 'ط': 'ṭ', 'ظ': 'ẓ',
  'ع': 'ʿ', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y',
};
const names: Record<string, string> = {
  'ا': 'alif', 'ب': 'bāʾ', 'ت': 'tāʾ', 'ث': 'thāʾ', 'ج': 'jīm', 'ح': 'ḥāʾ', 'خ': 'khāʾ', 'د': 'dāl', 'ذ': 'dhāl',
  'ر': 'rāʾ', 'ز': 'zāy', 'س': 'sīn', 'ش': 'shīn', 'ص': 'ṣād', 'ض': 'ḍād', 'ط': 'ṭāʾ', 'ظ': 'ẓāʾ', 'ع': 'ʿayn',
  'غ': 'ghayn', 'ف': 'fāʾ', 'ق': 'qāf', 'ك': 'kāf', 'ل': 'lām', 'م': 'mīm', 'ن': 'nūn', 'ه': 'hāʾ', 'و': 'wāw', 'ي': 'yāʾ',
  'ء': 'hamza', 'أ': 'hamza on alif', 'إ': 'hamza under alif', 'ئ': 'hamza on a seat', 'ؤ': 'hamza on wāw',
  'ة': 'tāʾ marbūṭa', 'ى': 'alif maqṣūra', 'آ': 'alif madda',
};
const marks = /[\u064b-\u065f\u0670]/g;
export const readingKey = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim();
export const withoutVowels = (s: string) => s.normalize('NFC').replace(marks, '');
const vowels: Record<string, string> = { 'َ': 'a', 'ِ': 'i', 'ُ': 'u', 'ً': 'an', 'ٍ': 'in', 'ٌ': 'un', 'ْ': '' };
const sun = new Set('تثدذرزسشصضطظلن');
type Unit = { c: string; m: string };
const units = (s: string): Unit[] => [...s.matchAll(/([ء-غف-يٱ])([\u064b-\u065f\u0670]*)/g)].map(m => ({ c: m[1], m: m[2] }));
const hasVowel = (s: string) => /[ًٌٍَُِْٰ]/.test(s);
const bare = (u: Unit | undefined) => !!u && !/[ًٌٍَُِّٰ]/.test(u.m);
// A joining alif (hamzat al-waṣl): ٱ, or a bare ا before a letter with sukūn or a doubled one (اسْمُ, اتَّصَلَ, الْقَمَرُ,
// الشَّمْسُ). It's said only where speech starts; after a vowel it's silent. `joins` looks at the alif and what follows;
// `wasl` also asks where it is: at the start of the word, or after وَ, فَ, بِ or لِ, and not before the word's last letter.
// Anywhere else a bare ا is a long ā (قَالَ, دَابَّةٌ, كِتَابْ, أَلْمَانْيَا), and كَ is left out (كَانْتُ is kāntu).
const joins = (a: Unit[], i: number) => a[i]?.c === 'ٱ' || (a[i]?.c === 'ا' && !/[ًٌٍَُِْ]/.test(a[i].m) && !!a[i + 1]
  && i + 1 < a.length - 1 && (/[ّْ]/.test(a[i + 1].m) || (a[i + 1].c === 'ل' && !a[i + 1].m && !!a[i + 2]?.m.includes('ّ'))));
const proclitic = (u: Unit) => (['و', 'ف'].includes(u.c) && u.m.includes('َ')) || (['ب', 'ل'].includes(u.c) && u.m.includes('ِ'));
const wasl = (a: Unit[], i: number) => i <= 2 && a.slice(0, i).every(proclitic) && joins(a, i);

// `afterVowel`: the word follows another that ends in a vowel, with only a space between, so its joining alif is
// silent: قُلِ الْحَقَّ is quli l-ḥaqqa, الَّتِي اشْتَرَيْتُهَا is allatī shtaraytuhā. (The long vowel before it is kept as
// written: fī l-bayti.) An authored reading loses its first vowel the same way (alladhī, after a vowel lladhī).
function word(written: string, afterVowel = false): Reading {
  const word = written.normalize('NFC').replaceAll('ـ', '');
  const authored = readings[readingKey(word)];
  // Only where the spelling shows a joining alif (ٱ, the article, or a bare ا before a sukūn or a doubled letter), so an
  // unvowelled ا that's really a hamza (انا, الى) keeps its vowel.
  if (authored) return { text: afterVowel && /^(ٱ|ال|ا[^ًٌٍَُِّْ][ًٌٍَُِ]*[ّْ])/.test(word) && /^[aiu]/.test(authored) ? authored.slice(1) : authored, incomplete: false };
  if (names[word]) return { text: names[word], incomplete: false };
  // The article cited on its own (الْـ, ال): al-.
  if (/^[اٱ]لْ?$/.test(word)) return { text: afterVowel ? 'l-' : 'al-', incomplete: false };
  if (word === 'كتب') return { text: 'kataba / kutub / kutiba…', incomplete: false, note: 'Several readings are possible; use the sentence context.' };
  const a = units(word);
  if (!a.length) return { text: word.replace(/[ًٌٍَُِْٰ]/g, c => vowels[c] ?? 'ā'), incomplete: false };
  let prefix = '', start = 0;
  // Joined wa-/fa- and bi-/ka-, and the contracted li-l- article.
  if (['و', 'ف'].includes(a[0].c) && a[0].m.includes('َ') && a.length > 2) { prefix = letters[a[0].c] + 'a-'; start++; }
  if (a[start] && ['ب', 'ك'].includes(a[start].c) && hasVowel(a[start].m) && ['ا', 'ٱ'].includes(a[start + 1]?.c) && a[start + 2]?.c === 'ل') {
    prefix += letters[a[start].c] + (a[start].m.includes('ِ') ? 'i-' : 'a-'); start++;
  }
  // The article's ل carries no vowel (unless doubled, as in الَّذِي), or i only before a word's own joining alif
  // (الِامْتِحَانُ): وَالِدِي is wālidī, not the article.
  const lam = a[start + 1]?.m ?? '';
  const alifL = ['ا', 'ٱ'].includes(a[start]?.c) && a[start + 1]?.c === 'ل'
    && (!/[ًٌٍَُِ]/.test(lam) || lam.includes('ّ') || (lam === 'ِ' && joins(a, start + 2)));
  // The relative pronouns write the article's ل and their own as one doubled ل: الَّذِي, الَّتِي, الَّذِينَ, alladhīna.
  const relative = alifL && lam.includes('ّ') && !/[ًٌٍَُِْ]/.test(a[start].m) && ['ذ', 'ت'].includes(a[start + 2]?.c ?? '');
  // Form VIII of a root beginning with ل, not the article: لْ, or an alif with a vowel, before an undoubled ت (اِلْتَقَى, iltaqā).
  const formVIII = alifL && a[start + 2]?.c === 'ت' && !a[start + 2].m.includes('ّ') && (a[start + 1].m.includes('ْ') || /[ُِ]/.test(a[start].m));
  let article = alifL && !relative && !formVIII;
  const contracted = a[start]?.c === 'ل' && a[start].m.includes('ِ') && a[start + 1]?.c === 'ل';
  if (contracted) { prefix += 'li-'; article = true; }
  if (relative) { prefix += prefix || afterVowel ? '' : 'a'; start++; }
  else if (article && a[start + 2]) {
    // After لِ, a doubled second ل is the noun's own first letter (لِلَّيْلِ, li-l-layli).
    start += contracted && a[start + 1].m.includes('ّ') ? 1 : 2;
    const first = a[start];
    if (sun.has(first.c)) {
      prefix += (prefix || afterVowel ? '' : 'a') + letters[first.c] + '-';
      first.m = first.m.replace('ّ', ''); // assimilation is already represented by the prefix
    } else prefix += prefix || afterVowel ? 'l-' : 'al-';
    // Before a word's own joining alif the article's ل takes i, and that alif is silent: الِامْتِحَانُ, al-imtiḥānu.
    if (!a[start - 1].m.replace('ِ', '') && joins(a, start)) { prefix += 'i'; start++; }
  } else if (start) { prefix = ''; start = 0; }
  let out = prefix, incomplete = false;
  for (let i = start; i < a.length; i++) {
    const { c, m } = a[i], next = a[i + 1];
    // Silent plural alif after wāw (-ū, or -aw as in دَعَوْا), and alternative placement of fatḥatan on alif.
    if (c === 'ا' && i === a.length - 1 && a[i - 1]?.c === 'و' && (out.endsWith('ū') || a[i - 1].m.includes('ْ')) && !m.includes('ً')) continue;
    if (c === 'ا' && m.includes('ً')) { out += 'an'; continue; }
    if (c === 'آ') { out += (i === start ? '' : 'ʾ') + 'ā'; continue; }
    // A joining alif: silent after a vowel, in this word (وَاسْتَخْدَمَ, wastakhdama) or the one before; where speech
    // starts its vowel isn't written, so the reading is incomplete rather than a guess.
    if (wasl(a, i)) { if (i === 0 && !afterVowel) incomplete = true; continue; }
    let consonant = letters[c] ?? (c === 'ة' ? (hasVowel(m) ? 't' : '') : c === 'ى' ? 'ā' : '');
    if ((c === 'أ' || c === 'إ') && i === start) consonant = '';
    if ((c === 'ا' || c === 'ٱ') && i === start) consonant = '';
    if (m.includes('ّ')) consonant += consonant;
    const vowel = [...m].find(x => Object.hasOwn(vowels, x));
    let sound = vowel === undefined ? '' : vowels[vowel];
    if (m.includes('ٰ')) sound = 'ā';
    if (next && bare(next)) {
      if (sound === 'a' && ['ا', 'ى'].includes(next.c) && !wasl(a, i + 1)) { sound = 'ā'; i++; }
      else if (sound === 'i' && next.c === 'ي') { sound = 'ī'; i++; }
      else if (sound === 'u' && next.c === 'و') { sound = 'ū'; i++; }
      else if (sound === 'an' && ['ا', 'ى'].includes(next.c) && i + 1 === a.length - 1) i++;
    }
    // An unmarked final consonant is the ordinary citation/pausal form. Internal missing vowels need a reading.
    if (!hasVowel(m) && i < a.length - 1 && !(next?.c === 'ا' && next.m.includes('ً'))) incomplete = true;
    if (c === 'ا' && vowel === undefined) { consonant = 'ā'; incomplete = true; }
    out += consonant + sound;
  }
  return { text: incomplete ? '[' + out + ']' : out, incomplete };
}

export function transliterate(text: string): Reading {
  const key = readingKey(text);
  if (readings[key]) return { text: readings[key], incomplete: false };
  let incomplete = false, note: string | undefined, end = -1, said = '';
  const written = text.normalize('NFC');
  const result = written.replace(/[ء-غف-يٱـ\u064b-\u065f\u0670]+/g, (s: string, at: number) => {
    // Joined to the word before (only spaces between) when that one ends in a vowel; a comma or full stop is a break.
    const r = word(s, end >= 0 && /^ +$/.test(written.slice(end, at)) && /[aiuāīū]$/.test(said));
    // Tanween before a joining alif takes a helping i, and the two join: مُغْلَقٌ الْيَوْمَ is mughlaquni l-yawma.
    const next = /^ +([اٱ][^ ]*)/.exec(written.slice(at + s.length))?.[1];
    const text = next && /[ًٌٍ][اى]?$/.test(s) && /n$/.test(r.text) && wasl(units(next.replaceAll('ـ', '')), 0) ? r.text + 'i' : r.text;
    incomplete ||= r.incomplete; note ??= r.note; end = at + s.length; said = text; return text;
  }).replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660)).replaceAll('،', ',').replaceAll('؛', ';').replaceAll('؟', '?');
  incomplete ||= /\p{Script=Arabic}/u.test(result);
  return { text: result, incomplete, note: incomplete ? 'Incomplete vowel or script information; use the sentence context and a recording.' : note };
}
