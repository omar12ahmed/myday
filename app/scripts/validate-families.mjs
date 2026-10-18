// Word families on the Arabic vocabulary page (1.38.0): MyDay's own authored file, checked at every build, so a word
// can't land in the wrong family or slip through unplaced. Families are display information only: revision, answers
// and saved data are untouched. (Whether every Arabic run in the notes has a full reading is checked by the
// arabic-families rules test, which runs the app's own transliteration.)
import { readFileSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const fail = message => { throw new Error('Arabic word families: ' + message); };
const material = read('content/arabic-fusha/MyDay_Arabic_Starter_Materials.json');
const file = read('content/teaching/arabic/word-families.json');
const lexicon = new Map(material.lexicon_seed.map(w => [w.id, w]));
// Letters only: vowel marks, shadda, sukūn, dagger alif and tatweel removed; every hamza form treated as one.
const bare = s => s.normalize('NFC').replace(/[ً-ْٰـ]/g, '').replace(/[أإآؤئء]/g, 'ء');
const placed = new Map();
const place = (id, where) => { if (!lexicon.has(id)) fail(`${where}: ${id} isn't a starter word`); if (placed.has(id)) fail(`${id} is in ${placed.get(id)} and ${where}`); placed.set(id, where); };
if (!Array.isArray(file.families)) fail('no families list');
for (const f of file.families) {
  if (!/^[a-z]+$/.test(f.id ?? '')) fail('a family needs a simple id');
  if (!f.root_ar || !f.root_reading || !f.theme_en || !f.pattern_en) fail(`${f.id}: root, reading, theme and pattern are all needed`);
  if (/[ء-ي]/.test(f.root_reading)) fail(`${f.id}: the root's reading must be in Latin letters`);
  const letters = bare(f.root_ar).split('-');
  if (letters.length !== 3 || letters.some(l => l.length !== 1)) fail(`${f.id}: the root must be three letters, like ك-ت-ب`);
  if (!Array.isArray(f.members) || f.members.length < 2) fail(`${f.id}: a family needs two or more members`);
  if (new Set(f.members).size !== f.members.length) fail(`${f.id}: a member is listed twice`);
  for (const id of f.members) {
    place(id, `the ${f.id} family`);
    // The root's letters, in order, somewhere in the word (a word in the wrong family fails here).
    const w = bare(lexicon.get(id).form_ar), at = [...w];
    let i = 0;
    for (const ch of at) if (ch === letters[i]) i++;
    if (i < 3) fail(`${f.id}: ${lexicon.get(id).form_ar} doesn't contain ${f.root_ar} in order`);
  }
  if (f.pair && !(Array.isArray(f.pair) && f.pair.length === 2 && f.pair[0] !== f.pair[1] && f.pair.every(id => f.members.includes(id)))) fail(`${f.id}: a pair must be two of its members`);
  for (const id of Object.keys(f.word_notes ?? {})) if (!f.members.includes(id)) fail(`${f.id}: a note for ${id}, which isn't a member`);
  const examples = [...material.lexicon_seed.map(w => w.example_ar), ...(material.assets ?? material.starter_assets ?? []).map(a => a.text_ar).filter(Boolean)].map(bare);
  for (const x of f.also_in_examples ?? []) {
    const form = bare(x.form_ar ?? '');
    const word = new RegExp(`(^|[\\s،؛؟.])(?:ال)?${form}(?=[\\s،؛؟.!]|$)`);
    if (!form || !x.meaning_en || !examples.some(t => word.test(t))) fail(`${f.id}: ${x.form_ar} isn't in a starter example or text`);
  }
}
const alone = file.standing_alone ?? {};
for (const id of alone.relatives_not_here ?? []) place(id, 'standing alone (relatives not here)');
for (const id of alone.small_words ?? []) place(id, 'standing alone (small words)');
// Every starter word is placed exactly once: a new word forces a choice, so families grow by audit, not by accident.
const missing = [...lexicon.keys()].filter(id => !placed.has(id));
if (missing.length) fail(`not placed anywhere: ${missing.join(', ')}`);
const inFamilies = file.families.reduce((a, f) => a + f.members.length, 0);
console.log(`Arabic word families: ${file.families.length} families, ${inFamilies} words in them, ${placed.size - inFamilies} standing alone; all ${lexicon.size} placed once.`);
