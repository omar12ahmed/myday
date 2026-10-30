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

function word(written: string): Reading {
  const word = written.normalize('NFC').replaceAll('ـ', '');
  if (readings[readingKey(word)]) return { text: readings[readingKey(word)], incomplete: false };
  if (names[word]) return { text: names[word], incomplete: false };
  if (word === 'كتب') return { text: 'kataba / kutub / kutiba…', incomplete: false, note: 'Several readings are possible; use the sentence context.' };
  const a = units(word);
  if (!a.length) return { text: word.replace(/[ًٌٍَُِْٰ]/g, c => vowels[c] ?? 'ā'), incomplete: false };
  let prefix = '', start = 0;
  // Joined wa-/fa- and bi-/ka-, and the contracted li-l- article.
  if (['و', 'ف'].includes(a[0].c) && a[0].m.includes('َ') && a.length > 2) { prefix = letters[a[0].c] + 'a-'; start++; }
  if (a[start] && ['ب', 'ك'].includes(a[start].c) && hasVowel(a[start].m) && a[start + 1]?.c === 'ا' && a[start + 2]?.c === 'ل') {
    prefix += letters[a[start].c] + (a[start].m.includes('ِ') ? 'i-' : 'a-'); start++;
  }
  let article = ['ا', 'ٱ'].includes(a[start]?.c) && a[start + 1]?.c === 'ل';
  const contracted = a[start]?.c === 'ل' && a[start].m.includes('ِ') && a[start + 1]?.c === 'ل';
  if (contracted) { prefix += 'li-'; article = true; }
  if (article && a[start + 2]) {
    start += 2;
    const first = a[start];
    if (sun.has(first.c)) {
      prefix += (prefix ? '' : 'a') + letters[first.c] + '-';
      first.m = first.m.replace('ّ', ''); // assimilation is already represented by the prefix
    } else prefix += prefix ? 'l-' : 'al-';
  } else if (start) { prefix = ''; start = 0; }
  let out = prefix, incomplete = false;
  for (let i = start; i < a.length; i++) {
    const { c, m } = a[i], next = a[i + 1];
    // Silent plural alif after wāw (-ū, or -aw as in دَعَوْا), and alternative placement of fatḥatan on alif.
    if (c === 'ا' && i === a.length - 1 && a[i - 1]?.c === 'و' && (out.endsWith('ū') || a[i - 1].m.includes('ْ'))) continue;
    if (c === 'ا' && m.includes('ً')) { out += 'an'; continue; }
    if (c === 'آ') { out += (i === start ? '' : 'ʾ') + 'ā'; continue; }
    let consonant = letters[c] ?? (c === 'ة' ? (hasVowel(m) ? 't' : '') : c === 'ى' ? 'ā' : '');
    if ((c === 'أ' || c === 'إ') && i === start) consonant = '';
    if ((c === 'ا' || c === 'ٱ') && i === start) consonant = '';
    if (m.includes('ّ')) consonant += consonant;
    const vowel = [...m].find(x => Object.hasOwn(vowels, x));
    let sound = vowel === undefined ? '' : vowels[vowel];
    if (m.includes('ٰ')) sound = 'ā';
    if (next && bare(next)) {
      if (sound === 'a' && ['ا', 'ى'].includes(next.c)) { sound = 'ā'; i++; }
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
  let incomplete = false, note: string | undefined;
  const result = text.normalize('NFC').replace(/[ء-غف-يٱـ\u064b-\u065f\u0670]+/g, s => {
    const r = word(s); incomplete ||= r.incomplete; note ??= r.note; return r.text;
  }).replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660)).replaceAll('،', ',').replaceAll('؛', ';').replaceAll('؟', '?');
  incomplete ||= /\p{Script=Arabic}/u.test(result);
  return { text: result, incomplete, note: incomplete ? 'Incomplete vowel or script information; use the sentence context and a recording.' : note };
}
