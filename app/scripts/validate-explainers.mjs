// Arabic explainers (MyDay's own, content/teaching/arabic/explainers.json; proposal in specs/arabic-explainers.md): one
// verb family at a time, with a table, short steps, sentences broken down word by word, a "why" and a three-question
// self-test. This checks the file's shape and the house rules for its Arabic, so a draft can't reach the fluent checker
// or the voice with a missing vowel mark, two Arabic pieces run together, or a lesson check's answer given away.
//   node app/scripts/validate-explainers.mjs [file] [--readings]
// --readings also runs the app's own transliteration over every piece shown, and fails on an incomplete reading (it bundles
// transliterate.ts with Vite, so it needs app/node_modules).
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { kind, letters, markedThrough, unmarked, voiceable } from './arabic-reading-sentences.mjs';
import { arabicRuns } from '../src/study/arabic/arabic-runs.mjs';

const root = new URL('../../', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const args = process.argv.slice(2), withReadings = args.includes('--readings'), given = args.find(a => !a.startsWith('--'));
// Usually the authored file; a test can pass another one (a path) to check that a broken file fails.
const file = given ? JSON.parse(readFileSync(given, 'utf8')) : read('content/teaching/arabic/explainers.json');
const course = read('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json');
const keys = read('content/arabic-fusha/MyDay_Arabic_Assessment_Keys.json').answer_keys;
const teaching = read('content/teaching/arabic-fusha.json').lessons;
const courseWords = read('content/teaching/arabic/course-words.json').lessons;
const problems = [];
const fail = (where, message) => problems.push(`${where}: ${message}`);

const ARABIC = /[\u0600-\u06FF]/, MARK = /[\u064B-\u0652\u0670]/, ROOT_FORM = /^[\u0621-\u064A](-[\u0621-\u064A]){2,3}$/;
const STOPS = /[\u060C\u061B\u061F.!?,:;]/g, STOP = /[\u060C\u061B\u061F.!?,:;]/, VOWEL = /[\u064B-\u0650\u0652]/;
const text = s => typeof s === 'string' && s.trim() !== '';
const wordsOf = s => s.replace(STOPS, ' ').split(/\s+/).filter(w => letters(w));
const runs = s => arabicRuns(s).map(r => r.text.trim()).filter(r => letters(r));
// A letter or a root cited as letters (و, ق-و-ل) is shown, never voiced; so is an affix, one word written with a
// joining mark (يَـ), which is still marked all through.
const affix = run => !/\s/.test(run) && run.includes('\u0640');
const cited = run => kind(run) === 'letters' || affix(run);
// In a phrase or sentence every word's ending is written: a vowel, a tanween, or a sukūn on a verb (لَمْ يَقُلْ), unless
// the word ends in a long vowel (ا ى آ, ـُو, ـِي). A word with the article (الْ, وَالْ, بِالْ, لِلْ…) or ending in ة is a noun,
// so a sukūn there is a pause form, not its ending.
const NOUN = /^(?:[\u0648\u0641]\u064E?)?(?:(?:[\u0628\u0643]\u0650?)?\u0627\u0644|\u0644\u0650\u0644)/;
const endingWritten = word => {
  const w = word.replace(STOPS, ''), marks = w.match(/[\u064B-\u0652\u0670]*$/)[0], base = w.slice(0, w.length - marks.length);
  if (/[\u064B-\u0650]/.test(marks)) return true;
  if (marks.includes('\u0652')) return !(NOUN.test(w) || base.endsWith('\u0629'));
  if (marks) return false; // a shadda alone isn't an ending
  const last = base.at(-1), before = base.at(-2);
  return '\u0627\u0649\u0622'.includes(last) || (last === '\u0648' && before === '\u064F') || (last === '\u064A' && before === '\u0650');
};
// The house spelling: hamzat al-waṣl written اِ or اُ only where a piece or sentence starts with it, the article's alif
// bare, no ٱ, and هَذَا, هَذِهِ, ذَلِكَ, لَكِنَّ without the dagger alif (also after وَ, فَ, بِ, لِ, كَ). The article's ل is
// left bare before a sun letter, so الْ with a sukūn before an undoubled sun letter (الْتَقَى) isn't the article.
const SUN = '\u062A\u062B\u062F\u0630\u0631\u0632\u0633\u0634\u0635\u0636\u0637\u0638\u0644\u0646';
const spelling = run => {
  const out = [], tokens = run.split(/\s+/).filter(Boolean);
  if (run.includes('\u0671')) out.push('write a bare alif, not ٱ');
  tokens.forEach((w, i) => {
    if (!letters(w)) return;
    const before = tokens.slice(0, i), starts = !before.some(t => letters(t)) || /[\u061F.!?]$/.test(before.at(-1));
    if (w[0] === '\u0627') {
      const mark = w[1], notArticle = w[1] === '\u0644' && w[2] === '\u0652' && SUN.includes(w[3]) && !/^[\u064B-\u0650]*\u0651/.test(w.slice(4));
      if (mark === '\u064E') out.push(`${w}: an alif that starts a word takes i or u (اِ, اُ), or none for the article`);
      else if (MARK.test(mark ?? '') && !starts) out.push(`${w}: after another word, hamzat al-waṣl is written bare`);
      else if (!MARK.test(mark ?? '') && starts && (w[1] !== '\u0644' || notArticle)) out.push(`${w}: a piece that starts with hamzat al-waṣl writes it اِ or اُ`);
    }
    if (/^[\u0648\u0641\u0628\u0644\u0643]?(\u0647\u0630\u0627|\u0647\u0630\u0647|\u0630\u0644\u0643|\u0644\u0643\u0646)/.test(unmarked(w)) && w.includes('\u0670')) out.push(`${w}: written without the dagger alif`);
  });
  return out;
};
// A shadda carries its vowel too (رَدَّ), except on the last letter of a word cited on its own (رَدّ).
const bareShadda = (run, phrase) => run.split(/\s+/).filter(w => letters(w)).some(w => {
  const clusters = [...w.replace(STOPS, '').matchAll(/([\u0621-\u064A\u0671])([\u064B-\u0652\u0670]*)/gu)];
  return clusters.some(([, , m], i) => m.includes('\u0651') && !VOWEL.test(m) && (phrase || i < clusters.length - 1));
});
const checkRun = (where, run) => {
  if (affix(run)) { if (!markedThrough(run)) fail(where, `${run} is not fully vowelled`); return; }
  if (kind(run) === 'letters') return;
  if (bareShadda(run, wordsOf(run).length > 1)) fail(where, `${run}: a shadda needs its vowel`);
  if (!markedThrough(run)) fail(where, `${run} is not fully vowelled`);
  else if (!(voiceable(run) || letters(run) >= 2)) fail(where, `${run} is too short to stand as a piece`);
  if (wordsOf(run).length > 1) for (const w of wordsOf(run)) if (!endingWritten(w)) fail(where, `${run}: the ending of ${w} isn't written`);
  for (const p of spelling(run)) fail(where, p);
};
const english = (where, s) => { if (!text(s)) fail(where, 'missing'); else if (ARABIC.test(s)) fail(where, 'English only here'); };
// One Arabic piece and nothing else (a table form, a sentence, a choice): the app shows and voices it whole.
const onePiece = s => runs(s).length === 1 && s.replace(runs(s)[0], '').replace(/[.!?]/g, '').trim() === '';

// A lesson check's answer, or a whole Arabic phrase from its question, is a secret unless the lesson already shows it;
// so is each word of an answer that neither the lesson nor the question shows (يدع, from لم يدع, in any piece).
const pieces = s => runs(s).flatMap(r => r.split(/[\u060C\u061B\u061F/]/)).map(p => unmarked(p).replace(STOPS, ' ').replace(/\s+/g, ' ').trim()).filter(p => letters(p) && kind(p) !== 'letters');
const secretsFor = lessonId => {
  const lesson = course.lessons.find(l => l.id === lessonId), t = teaching[lessonId] ?? {};
  const shownPieces = [lesson.example?.text_ar ?? '', ...(lesson.key_concepts ?? []), t.explanation, t.example, t.practice, t.solution,
    ...(courseWords[lessonId]?.words ?? []).flatMap(w => [w.form_ar, w.example_ar, w.note])].filter(text).flatMap(pieces);
  const shown = new Set(shownPieces), shownWords = new Set(shownPieces.flatMap(wordsOf));
  const check = course.assessments.find(a => a.id === lesson.knowledge_check_id);
  const prompts = (check?.questions ?? []).flatMap(q => pieces(q.prompt)), askedWords = new Set(prompts.flatMap(wordsOf));
  const asked = prompts.filter(p => wordsOf(p).length > 1);
  const answers = (check?.questions ?? []).flatMap(q => pieces(keys.find(k => k.id === q.answer_key_id)?.expected_answer ?? ''));
  const words = answers.flatMap(wordsOf).filter(w => letters(w) > 1 && !shownWords.has(w) && !askedWords.has(w));
  return [...new Set([...asked, ...answers, ...words])].filter(p => !shown.has(p) && !(wordsOf(p).length === 1 && shownWords.has(p)));
};
// The lesson each course word is in: an explainer is shown there too, through its link.
const wordLesson = new Map(Object.entries(courseWords).flatMap(([l, x]) => x.words.map(w => [w.id, l])));
const contains = (run, secret) => {
  const w = wordsOf(unmarked(run)), s = wordsOf(secret);
  return w.some((_, i) => s.every((x, j) => w[i + j] === x || (j === 0 && /^[\u0648\u0641]/.test(w[i]) && w[i].slice(1) === x)));
};

const lessonIds = new Set(course.lessons.map(l => l.id));
const allWords = new Set(Object.values(courseWords).flatMap(l => l.words.map(w => w.id)));
const ENTRY = ['id', 'title_en', 'family_en', 'root_ar', 'root_reading', 'course_words', 'table', 'steps', 'examples', 'why', 'selftest', 'phrases_ar'];
const only = (where, o, allowed) => { if (o && typeof o === 'object') for (const k of Object.keys(o)) if (!allowed.includes(k)) fail(where, `unknown field ${k}`); };
const ids = new Set(), voiced = new Set(), shown = new Set(), linked = new Map();
let count = 0;
if (!file || typeof file.lessons !== 'object') fail('the file', 'no lessons');
for (const [lessonId, list] of Object.entries(file.lessons ?? {})) {
  if (!lessonIds.has(lessonId)) fail(lessonId, 'not a lesson in the course');
  if (!Array.isArray(list) || !list.length) { fail(lessonId, 'needs a list of explainers'); continue; }
  for (const e of list) {
    count++;
    const at = e.id ?? `${lessonId} explainer ${count}`;
    for (const k of Object.keys(e)) if (!ENTRY.includes(k)) fail(at, `unknown field ${k}`);
    if (!/^explainer\.arabic-[a-z0-9-]{1,40}$/.test(e.id ?? '')) fail(at, 'an id is explainer.arabic- and a short name');
    if (ids.has(e.id)) fail(at, 'id used twice');
    ids.add(e.id);
    // A root is optional (a topic such as case endings has none), but comes with its reading.
    if (e.root_ar !== undefined || e.root_reading !== undefined) {
      if (!ROOT_FORM.test(e.root_ar ?? '')) fail(at, 'the root is written like ك-ت-ب');
      if (!text(e.root_reading) || ARABIC.test(e.root_reading) || e.root_reading.split('-').length !== (e.root_ar ?? '').split('-').length) fail(at, 'the root reading is in Latin letters, one part per root letter');
    }
    for (const id of e.course_words ?? []) if (!allWords.has(id)) fail(at, `${id} isn't a course word`);
    if (e.course_words !== undefined && !Array.isArray(e.course_words)) fail(at, 'course_words is a list');
    // A course word links to one explainer.
    for (const id of e.course_words ?? []) { if (linked.has(id)) fail(at, `${id} already links to ${linked.get(id)}`); linked.set(id, e.id); }
    only(`${at}, why`, e.why, ['q_en', 'a_en']);
    // Its own lesson's check, and the check of each lesson whose words link here.
    const secrets = [...new Set([lessonId, ...(e.course_words ?? []).map(id => wordLesson.get(id))].filter(l => lessonIds.has(l)))].flatMap(secretsFor);
    // Everything shown as English with Arabic inside it, and where it is.
    const mixed = [['title', e.title_en], ['family', e.family_en], ...(e.steps ?? []).map((s, i) => [`step ${i + 1}`, s]),
      ['why question', e.why?.q_en], ['why answer', e.why?.a_en],
      ...(e.selftest ?? []).flatMap((q, i) => [[`self-test ${i + 1} question`, q.q_en], [`self-test ${i + 1} explanation`, q.why_en],
        ...(q.choices ?? []).filter(c => typeof c === 'string' && !onePiece(c)).map(c => [`self-test ${i + 1} choice`, c])])];
    for (const [where, s] of mixed) if (!text(s)) fail(`${at}, ${where}`, 'missing');
    // A table row's form and a word's gloss may name Arabic too ("-a after أَنَّ"): checked like the rest, never voiced.
    const labels = [];
    // Table: one Arabic piece per row, English around it.
    if (!Array.isArray(e.table) || e.table.length < 4 || e.table.length > 12) fail(at, 'the table has 4 to 12 rows');
    const forms = new Set();
    (e.table ?? []).forEach((r, i) => {
      const where = `${at}, table row ${i + 1}`;
      only(where, r, ['form_en', 'ar', 'en']);
      if (!text(r.form_en)) fail(`${where} form`, 'missing'); else labels.push([`table row ${i + 1} form`, r.form_en]);
      english(`${where} meaning`, r.en);
      if (!text(r.ar) || !onePiece(r.ar) || runs(r.ar)[0] !== r.ar.trim()) fail(where, 'one Arabic piece');
      else { checkRun(where, r.ar); voiced.add(r.ar.trim()); }
      if (forms.has(r.ar)) fail(where, `${r.ar} is already in the table`);
      forms.add(r.ar);
    });
    if (!Array.isArray(e.steps) || e.steps.length < 3 || e.steps.length > 8) fail(at, 'three to eight steps');
    for (const [i, s] of (e.steps ?? []).entries()) if (typeof s === 'string' && s.length > 320) fail(`${at}, step ${i + 1}`, 'keep a step short (320 characters at most)');
    // Sentences, each the exact sum of its words.
    if (!Array.isArray(e.examples) || e.examples.length < 2 || e.examples.length > 3) fail(at, 'two or three sentences');
    const sentences = new Set();
    (e.examples ?? []).forEach((x, i) => {
      const where = `${at}, sentence ${i + 1}`;
      only(where, x, ['ar', 'en', 'words']);
      english(`${where} meaning`, x.en);
      if (!text(x.ar) || !onePiece(x.ar)) { fail(where, 'one Arabic sentence'); return; }
      const sentence = runs(x.ar)[0];
      checkRun(where, sentence); voiced.add(sentence); sentences.add(sentence);
      if (!Array.isArray(x.words) || x.words.length < 2) { fail(where, 'break it down into two or more words'); return; }
      x.words.forEach((w, j) => {
        only(`${where}, word ${j + 1}`, w, ['ar', 'en']);
        if (!text(w.en)) fail(`${where}, word ${j + 1} meaning`, 'missing'); else labels.push([`sentence ${i + 1}, word ${j + 1} meaning`, w.en]);
        if (!text(w.ar) || /\s/.test(w.ar.trim()) || STOP.test(w.ar)) fail(`${where}, word ${j + 1}`, 'one Arabic word, without punctuation');
      });
      if (wordsOf(sentence).join(' ') !== x.words.map(w => w.ar).join(' ')) fail(where, 'its words, in order, must spell the sentence exactly');
    });
    if (!text(e.why?.q_en) || !text(e.why?.a_en)) fail(at, 'a why question and its answer');
    // Self-test: three questions, the answer one of the choices. A choice is English, or one Arabic piece (checked
    // like any other). A right answer may be voiced once answered; a wrong choice never is.
    if (!Array.isArray(e.selftest) || e.selftest.length !== 3) fail(at, 'three self-test questions');
    (e.selftest ?? []).forEach((q, i) => {
      const where = `${at}, self-test ${i + 1}`;
      only(where, q, ['q_en', 'choices', 'answer', 'why_en']);
      if (!Array.isArray(q.choices) || q.choices.length < 2 || q.choices.length > 4 || new Set(q.choices).size !== q.choices.length) fail(where, 'two to four different choices');
      else if (!q.choices.includes(q.answer)) fail(where, 'the answer must be one of the choices');
      for (const c of q.choices ?? []) if (text(c) && onePiece(c)) {
        checkRun(where, runs(c)[0]); shown.add(runs(c)[0]);
        if (c === q.answer) voiced.add(runs(c)[0]);
      }
    });
    // Arabic inside English. A run of two or more words must be a piece the explainer knows (a table form, a sentence,
    // or one of its phrases_ar), so two pieces can't run together and be voiced as one.
    const phrases = new Set(e.phrases_ar ?? []), used = new Set();
    for (const p of phrases) if (!onePiece(p) || wordsOf(p).length < 2) fail(`${at}, phrases_ar`, `${p} must be one Arabic phrase of two or more words`);
    for (const [where, s, label] of [...mixed, ...labels.map(([w, t]) => [w, t, true])]) {
      if (!text(s)) continue;
      for (const run of runs(s)) {
        checkRun(`${at}, ${where}`, run); shown.add(run);
        if (wordsOf(run).length > 1) {
          if (phrases.has(run)) used.add(run);
          else if (!forms.has(run) && !sentences.has(run)) fail(`${at}, ${where}`, `${run} reads as one piece: put English, a full stop, a colon or an ASCII comma between two pieces, or list it under phrases_ar if it is one phrase`);
        }
        if (!cited(run) && !label) voiced.add(run);
      }
    }
    for (const p of phrases) if (!used.has(p)) fail(`${at}, phrases_ar`, `${p} isn't used in the text`);
    // Nothing that answers its lesson's check, or the check of a lesson whose words link here.
    const everything = [...mixed.map(([, s]) => s), ...labels.map(([, s]) => s), ...(e.table ?? []).map(r => r.ar), ...(e.examples ?? []).map(x => x.ar),
      ...(e.selftest ?? []).flatMap(q => q.choices ?? [])].filter(text);
    for (const s of everything) for (const run of runs(s)) for (const secret of secrets) if (contains(run, secret)) fail(at, `${run} gives away the lesson check's answer (${secret})`);
  }
}

if (withReadings && !problems.length) {
  const { bundle } = await import(new URL('../../ai-eval/build.mjs', import.meta.url).href);
  const dir = mkdtempSync(path.join(tmpdir(), 'myday-explainers-'));
  const out = await bundle(fileURLToPath(new URL('../src/study/arabic/transliterate.ts', import.meta.url)), dir);
  const { transliterate } = await import(pathToFileURL(out).href);
  rmSync(dir, { recursive: true, force: true });
  // Every piece the app shows gets its reading, a cited letter or affix too, so each must read completely.
  for (const piece of new Set([...voiced, ...shown])) {
    const r = transliterate(piece);
    console.log(`  ${piece} → ${r.text}`);
    if (r.incomplete) fail('reading', `the app can't read ${piece} completely (${r.text})`);
  }
}
if (problems.length) {
  console.error(`Arabic explainers: ${problems.length} problem${problems.length === 1 ? '' : 's'}\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`Arabic explainers: ${count} explainers in ${Object.keys(file.lessons).length} lessons, ${voiced.size} Arabic pieces, all fully vowelled and apart; no lesson check's answer given away.`);
