// An inventory of the Arabic the course shows, for planning a voice across it (specs/arabic-audio-course.md).
// Run by hand: node app/scripts/arabic-audio-inventory.mjs [--json]. Not part of the build; it changes nothing.
//
// Each field that holds Arabic is listed with where it's shown, how many pieces it has, their characters, their kind
// (letters, word, phrase, sentence, passage) and their vowelling (full, partial, none). A "piece" is what one clip
// would say: the whole field when it's Arabic only, or each Arabic run inside English (found the way the app's own
// `Mixed` component finds them). Vowelling is a heuristic: marks per Arabic letter, full at 0.4 or more (long-vowel
// letters and a word's last letter carry no mark, so even fully vowelled words sit near 0.5), none at 0.
import { readFileSync } from 'node:fs';
import { kind, letters, readingPassages, voiceable, vowelling } from './arabic-reading-sentences.mjs';
import { arabicRuns } from '../src/study/arabic/arabic-runs.mjs';

const root = new URL('../../', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const course = read('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json');
const keys = read('content/arabic-fusha/MyDay_Arabic_Assessment_Keys.json');
const teaching = read('content/teaching/arabic-fusha.json');
const families = read('content/teaching/arabic/word-families.json');
const voiced = read('content/arabic-audio/audio-audit.json');


// Each source field: where it's shown, and whether the field is Arabic only (the whole field is one piece).
const fields = [];
const add = (id, shown, values, whole) => fields.push({ id, shown, values: values.filter(v => typeof v === 'string'), whole });
add('lexicon_seed.form_ar / example_ar', 'Vocabulary (voiced in 1.39.0)', course.lexicon_seed.flatMap(w => [w.form_ar, w.example_ar]), true);
add('lessons[].example.text_ar', 'a lesson page: its headline example', course.lessons.map(l => l.example?.text_ar), true);
add('lessons[].key_concepts[]', 'a lesson page: key concepts', course.lessons.flatMap(l => l.key_concepts || []), false);
add('lessons[].learning_objectives[]', 'a lesson page: objectives', course.lessons.flatMap(l => l.learning_objectives || []), false);
add('assets[].text_ar (vowelled)', 'Reading texts: with vowel marks', course.assets.map(a => a.text_ar), true);
add('assets[].text_unvowelled', 'Reading texts: without vowel marks', course.assets.map(a => a.text_unvowelled), true);
add('assets[].rows[] (timetable)', 'Reading texts: the timetable', course.assets.flatMap(a => (a.rows || []).flatMap(r => Object.entries(r).filter(([k]) => k.endsWith('_ar')).map(([, v]) => v))), true);
add('assets[].pairs[] (contrast bank)', 'Reading texts: the sound pairs', course.assets.flatMap(a => (a.pairs || []).flatMap(p => [p.a, p.b])), true);
add('exercises[].instruction / rubric', 'a lesson page: practical tasks', course.exercises.flatMap(e => [e.instruction, ...(e.rubric || []).map(r => r.pass_evidence)]), false);
add('assessments[].questions[].prompt', 'lesson checks and revision', course.assessments.flatMap(a => (a.questions || []).map(q => q.prompt)), false);
add('answer keys: expected_answer', 'answers, behind a button', keys.answer_keys.map(k => k.expected_answer), false);
for (const part of ['explanation', 'example', 'practice', 'solution'])
  add(`teaching: ${part}`, `a lesson page: teaching (${part})`, Object.values(teaching.lessons).map(l => l[part]), false);
add('word families: notes and forms', 'Vocabulary: Word families', families.families.flatMap(f => [f.pattern_en, ...Object.values(f.word_notes || {}), ...(f.also_in_examples || []).flatMap(x => [x.form_ar, x.note_en])]), false);

const already = new Set(Object.keys(voiced.clips)); // the audit is keyed by each clip's exact text (1.40.0)
const all = new Map();
const rows = fields.map(f => {
  const pieces = f.values.flatMap(v => f.whole ? (letters(v) ? [v.trim()] : []) : arabicRuns(v).map(m => m.text.trim()).filter(p => letters(p) >= 1));
  const distinct = [...new Set(pieces)];
  const count = (fn, k) => distinct.filter(p => fn(p) === k).length;
  distinct.forEach(p => all.set(p, (all.get(p) || []).concat(f.id)));
  return {
    field: f.id, shown: f.shown, pieces: pieces.length, distinct: distinct.length, characters: distinct.reduce((a, p) => a + p.length, 0),
    voiced: distinct.filter(p => already.has(p)).length,
    kind: Object.fromEntries(['letters', 'word', 'phrase', 'sentence', 'passage'].map(k => [k, count(kind, k)])),
    vowelling: Object.fromEntries(['full', 'partial', 'none'].map(k => [k, count(vowelling, k)])),
    examples: Object.fromEntries(['full', 'partial', 'none'].map(k => [k, distinct.filter(p => vowelling(p) === k).slice(0, 2)])),
  };
});
const everything = [...all.keys()];
const total = {
  distinct: everything.length, characters: everything.reduce((a, p) => a + p.length, 0),
  full: everything.filter(p => vowelling(p) === 'full').length, partial: everything.filter(p => vowelling(p) === 'partial').length,
  none: everything.filter(p => vowelling(p) === 'none').length, shared: everything.filter(p => new Set(all.get(p)).size > 1).length,
};
if (process.argv.includes('--json')) { console.log(JSON.stringify({ rows, total }, null, 1)); process.exit(0); }
// The rounds proposed in specs/arabic-audio-course.md: fully vowelled pieces only, never a letter drill, never one
// already voiced; a reading text as its sentences; a piece in an earlier round isn't counted again.
if (process.argv.includes('--rounds')) {
  const pick = (values, whole) => [...new Set(values.filter(v => typeof v === 'string').flatMap(v => whole ? [v.trim()] : arabicRuns(v).map(m => m.text.trim())))]
    .filter(voiceable);
  const passages = readingPassages(root);
  // A reading text the course gives without marks is voiced from MyDay's vowelled script (voice-scripts.json), if it has one.
  const unvowelled = course.assets.filter(a => a.text_ar && vowelling(a.text_ar) !== 'full'), scripted = unvowelled.filter(a => passages[a.id]);
  const rounds = [
    ['Round two: the lessons’ headline examples', pick(course.lessons.map(l => l.example?.text_ar), true)],
    [`Round three: the ${Object.keys(passages).length} reading texts, by sentence (${scripted.length} read from MyDay’s vowelled scripts)`, [...new Set(Object.values(passages).flatMap(parts => parts.map(p => p.spoken)))]],
    ['Round three: teaching examples, practice and solutions', pick(Object.values(teaching.lessons).flatMap(l => [l.example, l.practice, l.solution, l.explanation]), false)],
    ['Round three: the sound pairs and the word families’ forms', pick([...course.assets.flatMap(a => (a.pairs || []).flatMap(p => [p.a, p.b])), ...families.families.flatMap(f => [f.pattern_en, ...Object.values(f.word_notes || {}), ...(f.also_in_examples || []).flatMap(x => [x.form_ar, x.note_en])])], false)],
    ['Round three: lesson checks and answers, voiced only once the answer is shown', pick([...course.assessments.flatMap(a => (a.questions || []).map(q => q.prompt)), ...keys.answer_keys.map(k => k.expected_answer)], false)],
  ];
  const seen = new Set(already);
  console.log('| Round | Clips | Characters | Audio, about | Listening, about |\n|---|---|---|---|---|');
  for (const [name, pieces] of rounds) {
    const fresh = pieces.filter(p => !seen.has(p)); fresh.forEach(p => seen.add(p));
    const chars = fresh.reduce((a, p) => a + p.length, 0), seconds = chars / 8.4; // round one: 1,330 characters in 158 s
    console.log(`| ${name} | ${fresh.length} | ${chars} | ${Math.round(seconds / 60)} min | ${Math.round(seconds * 2.5 / 60)} min |`);
  }
  const held = everything.filter(p => !seen.has(p));
  const why = p => p.includes('ـ') ? 'an affix or unfinished word' : kind(p) === 'letters' ? 'a letter drill' : vowelling(p) === 'none' ? 'no vowel marks' : vowelling(p) === 'partial' ? 'partly vowelled' : 'one or two letters';
  const counts = held.reduce((a, p) => (a[why(p)] = (a[why(p)] || 0) + 1, a), {});
  console.log(`\nHeld back: ${held.length} pieces (${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}), plus the ${unvowelled.length - scripted.length} reading texts without vowel marks or a script.`);
  process.exit(0);
}
console.log('| Field | Shown | Pieces | Distinct | Characters | Letters · word · phrase · sentence · passage | Full · partial · none |');
console.log('|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.field} | ${r.shown} | ${r.pieces} | ${r.distinct} | ${r.characters} | ${Object.values(r.kind).join(' · ')} | ${Object.values(r.vowelling).join(' · ')} |`);
console.log(`\nAll distinct pieces: ${total.distinct} (${total.characters} characters): ${total.full} fully vowelled, ${total.partial} partly, ${total.none} without marks; ${total.shared} appear in more than one field.`);
