// Linguistic contrasts, conservative handling of missing vowels and real-course coverage.
const fs = require('fs'), os = require('os'), path = require('path');
const { pathToFileURL } = require('url');
const { execFileSync } = require('child_process');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
let pass = 0, fail = 0;
const check = (label, ok) => { console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}`); ok ? pass++ : fail++; };
(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')));
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-pronunciation-'));
  const { transliterate: t } = await import(pathToFileURL(await bundle(path.join(ROOT, 'app/src/study/arabic/transliterate.ts'), temp)));
  for (const [ar, latin] of [
    ['أَنَا', 'anā'], ['مَلِك', 'malik'], ['مَالِك', 'mālik'], ['كَتَبَ', 'kataba'], ['كَاتِب', 'kātib'],
    ['دَرَسَ', 'darasa'], ['دَرَّسَ', 'darrasa'], ['مُعَلِّم', 'muʿallim'], ['عَرَبِيَّة', 'ʿarabiyya'],
    ['بَ بِ بُ بَا بِي بُو', 'ba bi bu bā bī bū'], ['بَيْت', 'bayt'], ['صَوْت', 'ṣawt'],
    ['الْقَمَرُ', 'al-qamaru'], ['الشَّمْسُ', 'ash-shamsu'], ['بِالْكِتَابِ', 'bi-l-kitābi'],
    ['وَبِالْكِتَابِ', 'wa-bi-l-kitābi'], ['لِلْبَيْتِ', 'li-l-bayti'], ['ٱلْبَيْتُ', 'al-baytu'],
    ['مَدْرَسَة', 'madrasa'], ['مَدْرَسَةٌ', 'madrasatun'], ['مَدْرَسَتُهَا', 'madrasatuhā'],
    ['شُكْرًا', 'shukran'], ['شُكْراً', 'shukran'], ['مَاءً', 'māʾan'], ['سُؤَال', 'suʾāl'],
    ['رَسَائِل', 'rasāʾil'], ['إِلَى', 'ilā'], ['آمَنَ', 'āmana'], ['قُلْتُ', 'qultu'],
    ['يَدْعُو', 'yadʿū'], ['يَدْرُسُوا', 'yadrusū'], ['هَذَا', 'hādhā'], ['هَذِهِ', 'hādhihi'],
    ['ذَلِكَ', 'dhālika'], ['لَكِنَّ', 'lākinna'], ['الَّذِي', 'alladhī'], ['اسْمِي', 'ismī'],
  ]) { const r = t(ar); check(`${ar} → ${latin}`, r.text === latin && !r.incomplete); }
  check('Unicode mark order cannot change a doubled consonant', t('دَرَ\u0651سَ').text === t('دَرّ\u064eسَ').text);
  check('unvowelled كتب keeps several readings instead of choosing a meaning', t('كتب').text.includes('kataba / kutub') && !!t('كتب').note);
  check('unknown missing vowels are flagged instead of invented', t('الجملة').incomplete && t('الجملة').text.includes('['));
  check('unsupported Arabic-script letters are not passed off as Latin pronunciation', t('پژ').incomplete);
  check('Arabic questions and numbers keep their order', t('أَيْنَ؟ ١٢').text === 'ayna? 12');
  const json = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
  const course = json('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json');
  const starter = json('app/src/study/arabic/data/texts.json');
  check('all lesson headline examples have a reading, not a missing-vowel guess', course.lessons.every(l => !l.example || !t(l.example.text_ar).incomplete));
  check('all 48 starter words and their sentences have complete readings', starter.lexicon.length === 48 && starter.lexicon.every(w => !t(w.form_ar).incomplete && !t(w.example_ar).incomplete));
  const arabic = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+(?:[\s،؛؟]+[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]+)*/g;
  const lessons = json('content/teaching/arabic-fusha.json').lessons;
  const examples = Object.values(lessons).flatMap(l => ['explanation', 'example', 'practice', 'solution'].flatMap(k => [...l[k].matchAll(arabic)].map(m => m[0]))).filter(s => /[ء-ي]/.test(s));
  check('Arabic runs across all 152 teaching lessons have complete readings or explicit ambiguity', Object.keys(lessons).length === 152 && examples.every(s => !t(s).incomplete));
  check('the timetable and sound-contrast pairs also have readings', starter.assets.filter(a => a.rows || a.pairs).every(a => (a.rows || []).every(r => ['day_ar','activity_ar','place_ar'].every(k => !t(r[k]).incomplete)) && (a.pairs || []).every(p => !t(p.a).incomplete && !t(p.b).incomplete)));
  execFileSync('node', [path.join(ROOT, 'app/scripts/validate-pronunciation.mjs')], { stdio: 'pipe' });
  check('all 14 longer texts are aligned with the unchanged original Arabic', true);
  // Word families (1.38.0): the authored file, its build-time rules and the readings of its Arabic notes.
  const famPath = path.join(ROOT, 'content/teaching/arabic/word-families.json');
  const runFam = file => { try { return { code: 0, out: execFileSync('node', [path.join(ROOT, 'app/scripts/validate-families.mjs'), ...(file ? [file] : [])], { stdio: 'pipe' }).toString() }; } catch (e) { return { code: e.status || 1, out: `${e.stdout || ''}${e.stderr || ''}` }; } };
  const real = runFam();
  check('the real word families file passes: 4 families, 12 words in them, 36 standing alone, all 48 placed once', real.code === 0 && real.out.includes('4 families, 12 words in them, 36 standing alone; all 48 placed once'));
  const fam = json('content/teaching/arabic/word-families.json');
  const bad = (name, mutate, message, expected) => {
    const copy = JSON.parse(JSON.stringify(fam)); mutate(copy);
    const file = path.join(temp, `bad-${name}.json`); fs.writeFileSync(file, JSON.stringify(copy));
    const r = runFam(file);
    check(`${expected}: a bad copy fails the build and ${message}`, r.code !== 0 && r.out.includes(message));
  };
  const ktb = f => f.families.find(x => x.id === 'ktb'), tlb = f => f.families.find(x => x.id === 'tlb');
  bad('not-a-word', f => { ktb(f).members[0] = 'lexeme.arabic-seed-999'; }, "isn't a starter word", 'a family member that is not a starter word');
  bad('two-families', f => { tlb(f).members[0] = 'lexeme.arabic-seed-009'; tlb(f).pair = null; }, 'is in the ktb family and the tlb family', 'a word placed in two families');
  bad('twice', f => { ktb(f).members.push('lexeme.arabic-seed-009'); }, 'a member is listed twice', 'a member listed twice in one family');
  bad('wrong-root', f => { ktb(f).members.push('lexeme.arabic-seed-040'); f.standing_alone.relatives_not_here = f.standing_alone.relatives_not_here.filter(i => i !== 'lexeme.arabic-seed-040'); }, "doesn't contain ك-ت-ب in order", 'a word that lacks its root\'s letters in order');
  bad('pair', f => { ktb(f).pair = ['lexeme.arabic-seed-009', 'lexeme.arabic-seed-010', 'lexeme.arabic-seed-012']; }, 'a pair must be two of its members', 'a pair that is not two members');
  bad('pair-outsider', f => { ktb(f).pair = ['lexeme.arabic-seed-009', 'lexeme.arabic-seed-038']; }, 'a pair must be two of its members', 'a pair with a word from another family');
  bad('note-key', f => { ktb(f).word_notes['lexeme.arabic-seed-038'] = 'x'; }, "which isn't a member", 'a word note for a word that is not a member');
  bad('example', f => { ktb(f).also_in_examples[0].form_ar = 'مَسْجِد'; }, "isn't in a starter example or text", 'an also-in-examples form that no starter example or text contains');
  bad('unplaced', f => { f.standing_alone.small_words.pop(); }, 'not placed anywhere', 'a starter word left unplaced');
  bad('root-length', f => { ktb(f).root_ar = 'ك-ت'; }, 'the root must be three letters', 'a root that is not three letters');
  const starterWords = new Map(starter.lexicon.map(w => [w.id, w]));
  const members = id => fam.families.find(f => f.id === id).members;
  check('the ك-ت-ب family has exactly 5 members', members('ktb').length === 5);
  const tlbFam = fam.families.find(f => f.id === 'tlb');
  check('the ط-ل-ب family is the gender pair of the two student words', tlbFam.members.length === 2 && tlbFam.pair.join() === 'lexeme.arabic-seed-013,lexeme.arabic-seed-014' && starterWords.get(tlbFam.pair[0]).meaning_en.includes('student'));
  const inFam = fam.families.flatMap(f => f.members), relatives = fam.standing_alone.relatives_not_here, small = fam.standing_alone.small_words;
  check('no pronoun, preposition, particle, question word, connector or set phrase is in a family', inFam.every(id => !['pronoun', 'preposition', 'particle', 'connector', 'question', 'chunk'].includes(starterWords.get(id).part_of_speech)));
  check('12 words are in families and 14 + 22 stand alone, which is all 48', inFam.length === 12 && relatives.length === 14 && small.length === 22 && new Set([...inFam, ...relatives, ...small]).size === 48);
  // Every Arabic run in the notes gets a complete reading; a root written like ك-ت-ب is shown whole by the app, with its root_reading.
  const rootForm = /[ء-ي](?:-[ء-ي]){2}/g;
  const famText = fam.families.flatMap(f => [f.pattern_en, ...Object.values(f.word_notes || {}), ...(f.also_in_examples || []).flatMap(x => [x.form_ar, x.note_en])]);
  const famRuns = famText.flatMap(x => [...x.replace(rootForm, ' ').matchAll(arabic)].map(m => m[0])).filter(s => /[ء-ي]/.test(s));
  const incompleteRuns = famRuns.filter(s => t(s).incomplete);
  check(`every Arabic run in the family patterns, word notes and also-in-examples forms has a complete reading (${famRuns.length} runs checked)`, famRuns.length > 20 && incompleteRuns.length === 0);
  fs.rmSync(temp, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
