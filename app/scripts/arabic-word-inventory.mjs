// The Arabic word inventory (specs/arabic-dictionary.md §4): every word form a lesson shows that no course word or
// starter word lists yet, in course order, each in the first lesson that shows it, so a batch of dictionary words can
// be drafted lesson by lesson. A drafting aid only: it prints, and changes nothing.
//   node app/scripts/arabic-word-inventory.mjs [--modules 4-13] [--json]
// What a lesson shows: its example and key concepts, its teaching text, its explainers (not the quiz choices, which
// are wrong on purpose, nor module 28's Qur'anic quotes), its course words' examples, and the reading texts
// it uses. Never a lesson check's prompt or answer, so nothing here comes only from a check.
// A form counts as listed when, with the article, a joined letter or a common ending taken off, it meets a listed
// word: a rough net that leaves some inflections in (the drafter reduces each to its dictionary form) and may let a
// rare word through.
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const course = read('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json');
const teaching = read('content/teaching/arabic-fusha.json').lessons;
const explainers = read('content/teaching/arabic/explainers.json').lessons;
const words = read('content/teaching/arabic/course-words.json').lessons;
// Forms already placed (content/teaching/arabic/word-forms.json): an inflected form under its entry, or not a word.
const placed = read('content/teaching/arabic/word-forms.json');
const args = process.argv.slice(2), asJson = args.includes('--json');
const range = (args[args.indexOf('--modules') + 1] ?? '').match(/^(\d+)(?:-(\d+))?$/);
if (args.includes('--modules') && !range) { console.error('--modules wants a number or a range, such as 4-13'); process.exit(2); }

// Arabic as the dictionary's search sees it (app/src/study/arabic/dictionary.ts arKey): no vowel marks, tatweel or
// hamza seats, ٱ ى ة as ا ي ه.
const key = s => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/ـ/g, '').replace(/ٱ/g, 'ا').replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه').replace(/[^ء-ي\s]/g, ' ').replace(/\s+/g, ' ').trim();
// A piece with a tatweel is a part of a word (ـِيَّة, الْـ), not a word.
const tokens = s => key(s.replace(/\S*\u0640\S*/g, ' ')).split(' ').filter(t => t.length > 1);
const PREFIX = ['وال', 'فال', 'بال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل', 'ك', 'س'];
const SUFFIX = ['كما', 'هما', 'تما', 'كم', 'كن', 'هم', 'هن', 'نا', 'ها', 'ني', 'ك', 'ه', 'ي', 'ون', 'ين', 'ان', 'ات', 'وا', 'تم', 'ت', 'ن', 'ا'];
// A form and the stems a reader might look it up under.
function stems(t) {
  const out = new Set([t]);
  for (const p of ['', ...PREFIX]) {
    if (p && !t.startsWith(p)) continue;
    const b = t.slice(p.length); if (b.length < 2) continue;
    out.add(b);
    for (const s of SUFFIX) if (b.endsWith(s) && b.length - s.length >= 2) out.add(b.slice(0, -s.length));
  }
  for (const x of [...out]) if (x.length >= 4 && 'يتنا'.includes(x[0])) out.add(x.slice(1));
  return out;
}
// Made-up names the course uses, and its countries, aren't dictionary words.
const NAMES = new Set(['سامي', 'سامر', 'ليلي', 'سلمي', 'يوسف', 'ساره', 'زينب', 'احمد', 'مريم', 'كريم', 'هند', 'عمر', 'خالد', 'نور'].map(key));

const listed = new Set(), listedStems = new Set();
const list = f => { const k = key(f); listed.add(k); if (!k.includes(' ')) for (const s of stems(k)) listedStems.add(s); };
for (const w of course.lexicon_seed) list(w.form_ar);
for (const l of Object.values(words)) for (const w of l.words) list(w.form_ar);

const assets = new Map(course.assets.map(a => [a.id, a]));
const assetText = a => [a.text_ar, a.title_ar, ...(a.rows ?? []).flatMap(r => Object.values(r)), ...(a.items ?? []).flatMap(i => Object.values(i))].filter(x => typeof x === 'string');
const strings = v => typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];
// Everything a lesson shows, as [where, text].
function shown(l) {
  const t = teaching[l.id] ?? {}, out = [];
  const add = (where, xs) => { for (const x of strings(xs)) if (/[ء-ي]/.test(x)) out.push([where, x]); };
  add('example', l.example?.text_ar); add('key concept', l.key_concepts);
  for (const f of ['explanation', 'example', 'practice', 'solution']) add('teaching', t[f]);
  for (const e of explainers[l.id] ?? []) {
    add(e.id, [e.title_en, e.family_en, e.table?.map(r => r.ar), e.steps, e.examples?.map(x => [x.ar, x.words.map(w => w.ar)]), e.why, e.selftest?.map(q => [q.q_en, q.why_en]), e.leads_to?.map(x => x.en)]);
  }
  // A course word's example; not its note, whose Arabic is that word's own plural, feminine or source verb.
  for (const w of words[l.id]?.words ?? []) add(w.id, w.example_ar);
  for (const id of l.starter_asset_ids ?? []) if (assets.has(id)) add(id, assetText(assets.get(id)));
  return out;
}

const moduleNo = new Map(course.modules.map((m, i) => [m.id, i + 1]));
const lessonsInOrder = course.modules.flatMap(m => (m.lesson_ids ?? m.lessons.map(x => x.id ?? x))).map(id => course.lessons.find(l => l.id === id)).filter(Boolean);
const seen = new Set(), report = [];
for (const l of lessonsInOrder) {
  const found = new Map();
  for (const [where, text] of shown(l)) for (const t of tokens(text)) {
    if (seen.has(t) || listed.has(t) || NAMES.has(t) || [...stems(t)].some(s => listedStems.has(s) || NAMES.has(s) || s in placed.forms || s in placed.not_words)) continue;
    if (!found.has(t)) found.set(t, { form: t, count: 0, where, context: text.length > 140 ? text.slice(0, 140) + '…' : text });
    found.get(t).count++;
  }
  for (const t of found.keys()) seen.add(t);
  // Forms that share their shortest stem go together, as one word to reduce to its dictionary form.
  const groups = new Map();
  for (const f of found.values()) { const s = [...stems(f.form)].sort((a, b) => a.length - b.length)[0]; groups.set(s, [...groups.get(s) ?? [], f]); }
  report.push({ module: moduleNo.get(l.module_id), lesson: l.id, title: l.title, words: [...groups.values()].map(g => ({ forms: g.map(f => f.form), count: g.reduce((a, f) => a + f.count, 0), where: g[0].where, context: g[0].context })) });
}

const [from, to] = range ? [+range[1], +(range[2] ?? range[1])] : [1, 99];
const picked = report.filter(r => r.module >= from && r.module <= to);
if (asJson) console.log(JSON.stringify(picked, null, 1));
else {
  for (const r of picked) {
    if (!r.words.length) continue;
    console.log(`\n## Module ${r.module} · ${r.title} (${r.lesson}): ${r.words.length}`);
    for (const w of r.words) console.log(`- ${w.forms.join(' / ')} ×${w.count} · ${w.where} · ${w.context.replace(/\s+/g, ' ')}`);
  }
  const n = picked.reduce((a, r) => a + r.words.length, 0);
  console.log(`\n${n} words to look at in modules ${from}${to !== from ? '–' + Math.min(to, course.modules.length) : ''}, in ${picked.filter(r => r.words.length).length} lessons.`);
}
