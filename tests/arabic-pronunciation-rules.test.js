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
  // The Arabic voice (1.39.0, round two 1.40.0): the audit says which clips were listened to, checked at every build. Clips belong to their exact text.
  const audioDir = path.join(ROOT, 'content/arabic-audio');
  const runAudio = dir => { try { return { code: 0, out: execFileSync('node', [path.join(ROOT, 'app/scripts/prepare-audio.mjs'), dir], { stdio: 'pipe' }).toString() }; } catch (e) { return { code: e.status || 1, out: `${e.stdout || ''}${e.stderr || ''}` }; } };
  const realAudio = runAudio(audioDir);
  const audit = json('content/arabic-audio/audio-audit.json');
  const auditTexts = Object.keys(audit.clips);
  const checkedCount = auditTexts.filter(k => audit.clips[k].check === 'checked').length;
  const shippedPrinted = (realAudio.out.match(/(\d+) clips listened to and shipped/) || [])[1];
  check('the real audio audit passes, and the shipped count it prints is the number of "checked" clips in the audit', realAudio.code === 0 && Number(shippedPrinted) === checkedCount && checkedCount > 0, { out: realAudio.out, checkedCount });
  const sources = (await import(pathToFileURL(path.join(ROOT, 'app/scripts/arabic-voice-sources.mjs')))).voiceSources(pathToFileURL(ROOT + path.sep));
  const sourceMod = await import(pathToFileURL(path.join(ROOT, 'app/scripts/arabic-voice-sources.mjs')));
  const src = id => sources.find(s => s.id === id);
  check('an isolated form gets final punctuation without changing a letter or vowel mark', sourceMod.spokenText('دَعَا') === 'دَعَا.');
  check('a slash between alternatives becomes a pause and the words stay unchanged', sourceMod.spokenText('مَلِك / مَالِك') === 'مَلِك، مَالِك.');
  check('an authored question keeps its own final punctuation', sourceMod.spokenText('مَا اسْمُكَ؟') === 'مَا اسْمُكَ؟');
  // Round three (b): author exactly the runs displayed, never unfinished words or isolated affixes.
  const { arabicRuns } = await import(pathToFileURL(path.join(ROOT, 'app/src/study/arabic/arabic-runs.mjs')));
  const mixedSample = 'Compare كَتَبَ / كُتِبَ; then هٰذَا كِتَابٌ، هٰذَا قَلَمٌ؟';
  const mixedRuns = arabicRuns(mixedSample);
  check('mixed Arabic preserves slash alternatives separately and an Arabic comma inside its sentence', JSON.stringify(mixedRuns.map(p => p.text)) === JSON.stringify(['كَتَبَ', 'كُتِبَ', 'هٰذَا كِتَابٌ، هٰذَا قَلَمٌ؟']));
  check('each extracted run points at its exact original display characters', mixedRuns.every(p => mixedSample.slice(p.index, p.index + p.text.length) === p.text));
  check('extracting one passage cannot change the boundaries of a later extraction', JSON.stringify(arabicRuns(mixedSample)) === JSON.stringify(mixedRuns));
  check('a joining mark is not counted as an Arabic letter', sourceMod.letters('ـكَ') === 1 && sourceMod.letters('ـ') === 0);
  for (const text of ['ـكَ', 'ـكِ', 'نَـ', 'ـتُ', 'سَـ', 'ـهُ', 'ـيْنِ', 'لَنْ يَكْتُبـ', 'لَمْ يَكْتُبـ', 'ـًا', 'بَ تَ ثَ', 'بَا، بِي، بُو', 'إنّ', 'أنّ', 'الجملة'])
    check(`the incomplete or unvowelled fragment ${text} is held back from synthesis`, !sourceMod.voiceable(text));
  check('a fully marked complete word remains voiceable', sourceMod.voiceable('إِنَّ') && sourceMod.voiceable('مَكْتَب'));
  const fixtureRoot = path.join(temp, 'voice-sources');
  const fixtureJson = (file, value) => { const at = path.join(fixtureRoot, file); fs.mkdirSync(path.dirname(at), { recursive: true }); fs.writeFileSync(at, JSON.stringify(value)); };
  fixtureJson('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json', { lexicon_seed: [], lessons: [], assets: [{ pairs: [{ a: 'قَلْب', b: 'كَلْب' }] }], assessments: [{ questions: [{ prompt: 'Read كِتَابٌ then إنّ.' }] }] });
  fixtureJson('content/arabic-fusha/MyDay_Arabic_Assessment_Keys.json', { answer_keys: [{ expected_answer: 'Compare كِتَابٌ / قَلَمٌ.' }] });
  fixtureJson('content/teaching/arabic-fusha.json', { lessons: { example: { explanation: 'A fragment ـكَ.', example: 'Read كِتَابٌ.', practice: 'Try قَلَمٌ / كِتَابٌ.', solution: 'Answer قَلَمٌ.' } } });
  fixtureJson('content/teaching/arabic/word-families.json', { families: [{ pattern_en: 'Root ك-ت-ب; pattern مَـ; form مَكْتَب.', word_notes: { sample: 'Again كِتَابٌ.' }, also_in_examples: [{ form_ar: 'مَكْتَب', note_en: 'Study يَكْتُبُ.' }] }] });
  fixtureJson('content/teaching/arabic/course-words.json', { lessons: { 'lesson.arabic-example': { words: [{ form_ar: 'كِتَاب', example_ar: 'هَذَا كِتَابٌ.', note: 'Plural كُتُبٌ; the ending ـكَ is a suffix.' }] } } });
  const fixtureSources = sourceMod.voiceSources(pathToFileURL(fixtureRoot + path.sep));
  const strayRoot = path.join(temp, 'voice-sources-stray'); fs.cpSync(fixtureRoot, strayRoot, { recursive: true });
  const strayJson = value => { const at = path.join(strayRoot, 'content/teaching/arabic/voice-scripts.json'); fs.mkdirSync(path.dirname(at), { recursive: true }); fs.writeFileSync(at, JSON.stringify(value)); };
  strayJson({ pieces: { 'إنّ': 'إِنَّ' } });
  check('a piece with a script joins the voiced source of the place that shows it', sourceMod.voiceSources(pathToFileURL(strayRoot + path.sep)).find(x => x.id === 'lesson-checks').texts.includes('إنّ'));
  strayJson({ pieces: { 'قلم': 'قَلَم' } });
  check('a piece script no voiced place shows stops the build', (() => { try { sourceMod.voiceSources(pathToFileURL(strayRoot + path.sep)); return false; } catch (e) { return e.message.includes('no voiced place in the course shows it'); } })());
  const strayThrows = (value, message) => { strayJson(value); try { sourceMod.voiceSources(pathToFileURL(strayRoot + path.sep)); return false; } catch (e) { return e.message.includes(message); } };
  check('a left-out entry no check shows any more stops the build', strayThrows({ pieces: {}, left_out: { 'قلم': 'gone from the course' } }, 'no check shows it any more'));
  fs.writeFileSync(path.join(strayRoot, 'content/teaching/arabic-fusha.json'), JSON.stringify({ lessons: { example: { explanation: 'See إنّ here.', example: '', practice: '', solution: '' } } }));
  check('a piece shown somewhere voiced besides the checks (here teaching) stops the build: its script was only checked in its check', strayThrows({ pieces: { 'إنّ': 'إِنَّ' } }, 'also shown in teaching'));
  const fixtureSource = id => fixtureSources.find(s => s.id === id);
  check('teaching sources include practice and solution runs once, while excluding the unfinished affix', JSON.stringify(fixtureSource('teaching').texts) === JSON.stringify(['كِتَابٌ', 'قَلَمٌ']));
  check('sound and family sources include complete forms and notes while excluding roots and prefixes', JSON.stringify(fixtureSource('sounds-families').texts) === JSON.stringify(['قَلْب', 'كَلْب', 'مَكْتَب', 'كِتَابٌ', 'يَكْتُبُ']));
  check('lesson-check sources include prompts and expected answers without inventing missing vowel marks', JSON.stringify(fixtureSource('lesson-checks').texts) === JSON.stringify(['كِتَابٌ', 'قَلَمٌ']));
  check('the same exact text can be reused by all three new sources', ['teaching', 'sounds-families', 'lesson-checks'].every(id => fixtureSource(id).texts.includes('كِتَابٌ')));
  check('the course-words source has each word, its example and its note\'s complete forms, never a suffix on its own', JSON.stringify(fixtureSource('course-words').texts) === JSON.stringify(['كِتَاب', 'هَذَا كِتَابٌ.', 'كُتُبٌ']), fixtureSource('course-words').texts);
  check('the real course-words source (round four) has unique, complete, fully marked texts', src('course-words')?.round === 4 && src('course-words').texts.length >= 100 && new Set(src('course-words').texts).size === src('course-words').texts.length && src('course-words').texts.every(sourceMod.courseVoiceable));
  check('a short word marked all through, like مَاء, is voiced as a course word, though the shared ratio calls it partial', sourceMod.courseVoiceable('مَاء') && !sourceMod.voiceable('مَاء') && !sourceMod.courseVoiceable('ماء') && !sourceMod.courseVoiceable('كتَاب'));
  const realScripts = json('content/teaching/arabic/voice-scripts.json'), realPieces = realScripts.pieces, leftOut = realScripts.left_out;
  check('all three real round-three sources contain unique texts, each fully marked or read from a checked voice script (round eleven: the unmarked Arabic in checks)', ['teaching', 'sounds-families', 'lesson-checks'].every(id => src(id)?.round === 3 && src(id).texts.length > 0 && new Set(src(id).texts).size === src(id).texts.length && src(id).texts.every(t => sourceMod.voiceable(t) || realPieces[t])) && src('lesson-checks').texts.filter(t => realPieces[t]).length >= 250);
  check('the pieces left without a voice on purpose are in no voiced source, each with its reason', Object.keys(leftOut).length >= 12 && Object.entries(leftOut).every(([t, why]) => !realPieces[t] && typeof why === 'string' && why.length > 20 && !sources.some(x => x.texts.includes(t))));
  check('the voice is given a piece\'s script, with spokenText\'s pause punctuation; a vowelled text is given as it is', sourceMod.spokenFor(pathToFileURL(ROOT + path.sep))('أنا متعب') === 'أَنَا مُتْعَبٌ.' && sourceMod.spokenFor(pathToFileURL(ROOT + path.sep))('أَنَا طَالِبٌ.') === 'أَنَا طَالِبٌ.');
  const seed = new Map(course.lexicon_seed.map(w => [w.id, w]));
  check('the course has 48 starter words', seed.size === 48);
  const starterTexts = [...seed.values()].flatMap(w => [w.form_ar, w.example_ar]);
  check('every starter word and every starter example text has a clip in the audit', starterTexts.every(x => audit.clips[x] && audit.clips[x].file), starterTexts.filter(x => !audit.clips[x]));
  const allSourceTexts = new Set(sources.flatMap(s => s.texts));
  check('every text in the audit is in one of the voice sources', auditTexts.every(x => allSourceTexts.has(x)), auditTexts.filter(x => !allSourceTexts.has(x)));
  const voices = [audit.voice.name, ...(audit.earlier_voices || []).map(v => v.name)];
  check('every clip was made with the audit\'s voice or one it lists as earlier, and the voice for new clips is WaveNet B', audit.voice.name === 'ar-XA-Wavenet-B' && voices.includes('ar-XA-Chirp3-HD-Charon') && auditTexts.every(x => voices.includes(audit.clips[x].voice)), [...new Set(auditTexts.map(x => audit.clips[x].voice))]);
  check('every reading-text clip, by sentence and whole, is in the voice for new clips', [...src('reading-texts').texts, ...src('reading-wholes').texts].every(x => audit.clips[x]?.voice === audit.voice.name));
  check('every clip has one of the four known checks', auditTexts.every(x => Object.keys(audit.checks).includes(audit.clips[x].check)), [...new Set(auditTexts.map(x => audit.clips[x].check))]);
  check('the label says what the voice is and that no teacher has checked it', audit.label === 'Synthesised voice — a model to copy; checked by ear, not yet by a teacher.');
  const auditText = fs.readFileSync(path.join(audioDir, 'audio-audit.json'), 'utf8');
  check('the audit holds no personal details (no "@", no cloud project id)', !auditText.includes('@') && !/project-[0-9a-z]/i.test(auditText));
  const le = src('lesson-examples'), sw = src('starter-words');
  check('the lesson-examples source holds 146 texts', !!le && le.texts.length === 146, le && le.texts.length);
  check('every lesson-examples text is voiceable: fully vowelled, at least two letters, not a letter drill', le.texts.every(x => sourceMod.voiceable(x)), le.texts.filter(x => !sourceMod.voiceable(x)));
  const drill = course.lessons.find(l => l.id === 'lesson.arabic-letter-families').example.text_ar, bare = course.lessons.find(l => l.id === 'lesson.arabic-diacritics-taper').example.text_ar;
  check('a letter drill ("ب ت ث ن ي") is not voiceable and is left out of the lesson examples', drill === 'ب ت ث ن ي' && !sourceMod.voiceable(drill) && !le.texts.includes(drill));
  check('unvowelled text ("كتب") is not voiceable and is left out of the lesson examples', !sourceMod.voiceable(bare) && !le.texts.includes(bare));
  const shared = sw.texts.filter(x => le.texts.includes(x));
  check('some text is both a starter example and a lesson example, and it has exactly one clip (one file, one audit entry)', shared.length > 0 && shared.every(x => auditTexts.filter(k => k === x).length === 1 && !!audit.clips[x].file) && new Set(auditTexts.map(k => audit.clips[k].file)).size === auditTexts.length, shared.length);
  // Reading texts (round three): sentence boundaries preserve the authored reading, including dialogue labels.
  const { readingPassages } = await import(pathToFileURL(path.join(ROOT, 'app/scripts/arabic-reading-sentences.mjs')));
  const passages = readingPassages(pathToFileURL(ROOT + path.sep));
  const vowelledIds = ['profile', 'room', 'introduction-dialogue', 'appointment', 'routine', 'weekend', 'changed-plan', 'notice'].map(id => 'asset.arabic-' + id);
  const originalTexts = starter.assets.filter(a => a.type === 'original_text');
  const bareTexts = originalTexts.filter(a => !vowelledIds.includes(a.id)), readingIds = originalTexts.map(a => a.id);
  const voiceScripts = json('content/teaching/arabic/voice-scripts.json').readings, unmarked = s => s.replace(/[\u064B-\u0652\u0670]/g, '');
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const spaces = s => s.replace(/\s+/g, ' ').trim();
  check('all fourteen original reading texts have sentence passages: the eight the course vowels and the six read from MyDay\'s voice scripts', readingIds.length === 14 && same(Object.keys(passages).sort(), [...readingIds].sort()) && same(Object.keys(voiceScripts).sort(), bareTexts.map(a => a.id).sort()));
  check('the six unmarked texts keep the course\'s own text on the page, and each script has exactly its letters', bareTexts.length === 6 && bareTexts.every(a => unmarked(voiceScripts[a.id]) === a.text_ar && passages[a.id].every(s => !/[\u064B-\u0652]/.test(s.text) && sourceMod.voiceable(s.spoken))));
  check('reading sentences preserve every character of the original displayed text in order', readingIds.every(id => {
    const a = originalTexts.find(a => a.id === id);
    return spaces(passages[id].map(s => s.text).join(' ')) === spaces(a.text_ar);
  }));
  check('sentences with vowels hidden preserve every character of the original unvowelled text in order', readingIds.every(id => {
    const a = originalTexts.find(a => a.id === id);
    return spaces(passages[id].map(s => s.plain).join(' ')) === spaces(a.text_unvowelled);
  }));
  check('each sentence stays attached to its original paragraph or dialogue line', readingIds.every(id => {
    const lines = originalTexts.find(a => a.id === id).text_ar.split('\n');
    const sentences = passages[id];
    return sentences.length > 0 && sentences.every(s => Number.isInteger(s.line) && s.line >= 0 && s.line < lines.length && s.text && s.plain && s.spoken) &&
      lines.every((line, i) => spaces(sentences.filter(s => s.line === i).map(s => s.text).join(' ')) === spaces(line));
  }));
  const introduction = passages['asset.arabic-introduction-dialogue'];
  check('the introduction splits its six dialogue turns into eleven sentences without merging speakers', introduction.length === 11 && same(introduction.map(s => s.line), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5]));
  check('a dialogue sentence shows its speaker but its clip speaks only the words after the colon, in pause forms (مَرْحَبَا), keeping the -ki of اسْمُكِ', introduction[0].text === 'سَامِي: مَرْحَبًا.' && introduction[0].plain === 'سامي: مرحبا.' && introduction[0].spoken === 'مَرْحَبَا.' && introduction[1].text === 'مَا اسْمُكِ؟' && introduction[1].spoken === 'مَا اسْمُكِ؟');
  const appointment = passages['asset.arabic-appointment'];
  check('the appointment keeps its exclamation and final signature as separate sentences', appointment.length === 6 && appointment[4].text === 'إِلَى اللِّقَاءِ!' && appointment[5].text === 'لَيْلَى' && appointment[5].plain === 'ليلى' && appointment[5].spoken === 'لَيْلَى' && appointment[5].line === 1);
  check('the changed-plan dialogue keeps both short replies and their following questions separate', passages['asset.arabic-changed-plan'].length === 11 && passages['asset.arabic-changed-plan'][5].text === 'نُور: نَعَمْ.' && passages['asset.arabic-changed-plan'][6].text === 'أَيْنَ سَنَلْتَقِي؟');
  const readingSource = src('reading-texts');
  const spokenSentences = [...new Set(Object.values(passages).flat().map(s => s.spoken))];
  check('the round-three reading source contains each spoken sentence once, with no speaker labels', !!readingSource && readingSource.round === 3 && same([...readingSource.texts].sort(), [...spokenSentences].sort()) && new Set(readingSource.texts).size === readingSource.texts.length && readingSource.texts.every(s => !s.includes(':')));
  check('every spoken reading sentence is fully vowelled, and every sentence the eight vowelled texts show has a complete pronunciation reading', spokenSentences.length > 50 && spokenSentences.every(s => sourceMod.voiceable(s)) && vowelledIds.every(id => passages[id].every(s => !t(s.text).incomplete)));
  const preparedAudio = json('app/src/study/arabic/voice-clips.json');
  check('the prepared voice data preserves the same reading sentences, plain text and line positions', same(preparedAudio.readings, passages));
  check('a reading sentence gets a shipped clip only when that exact spoken text was checked', spokenSentences.every(s => preparedAudio.clips[s] ? audit.clips[s]?.check === 'checked' && preparedAudio.clips[s] === audit.clips[s].file : audit.clips[s]?.check !== 'checked'));
  // Round ten (owner's decision, 25 October 2026): connected reading in pause forms, the unmarked texts from MyDay's
  // vowelled scripts, and each text read whole.
  const { pauseForms, wholeText } = await import(pathToFileURL(path.join(ROOT, 'app/scripts/arabic-reading-sentences.mjs')));
  check('pause forms: at a comma or the end a final vowel or tanween goes (sukūn), -an is ā, ة is said -a, a doubled letter stays doubled, ـِيّ is ī; words between pauses keep their endings',
    pauseForms('كُلَّ مَسَاءٍ، بَعْدَ أَيَّامٍ قَلِيلَةٍ.') === 'كُلَّ مَسَاءْ، بَعْدَ أَيَّامٍ قَلِيلَة.' && pauseForms('قَرَأَ كَثِيرًا.') === 'قَرَأَ كَثِيرَا.' && pauseForms('جَاءَ مَسَاءً.') === 'جَاءَ مَسَاءَا.'
    && pauseForms('فِي النَّصِّ.') === 'فِي النَّصّ.' && pauseForms('مَكْتَبٌ وَكُرْسِيٌّ.') === 'مَكْتَبٌ وَكُرْسِي.' && pauseForms('هَذَا بَيْتٌ.') === 'هَذَا بَيْتْ.');
  check('pause forms keep a final vowel on ت or ك, which can be the only sign of who is speaking or spoken to', pauseForms('مَا اسْمُكِ؟') === 'مَا اسْمُكِ؟' && pauseForms('هَلْ دَرَسْتِ؟') === 'هَلْ دَرَسْتِ؟' && pauseForms('أَنَا دَرَسْتُ.') === 'أَنَا دَرَسْتُ.');
  check('pause forms leave a word ending in a long vowel or a sukūn as it is', pauseForms('أَيْنَ سَنَلْتَقِي؟') === 'أَيْنَ سَنَلْتَقِي؟' && pauseForms('نَعَمْ.') === 'نَعَمْ.' && pauseForms('لَيْلَى') === 'لَيْلَى');
  check('pause forms: -an is ā whichever way it was typed (ـًّا with its doubling, ـاً, ـًى, ـىً, on a hamza with no alif), and ـُوّ is ū', pauseForms('مُفِيدٌ جِدًّا.') === 'مُفِيدٌ جِدَّا.' && pauseForms('قَالَ مَرْحَباً.') === 'قَالَ مَرْحَبَا.' && pauseForms('هَذَا مُسْتَوًى.') === 'هَذَا مُسْتَوَى.' && pauseForms('هَذَا هُدىً.') === 'هَذَا هُدَى.' && pauseForms('هَذَا خَطَأً.') === 'هَذَا خَطَأَا.' && pauseForms('هُوَ عَدُوٌّ.') === 'هُوَ عَدُو.');
  check('pause forms find a stop inside a closing quote, a stop typed after a space, and ؛ ! : , inside a sentence', pauseForms('قَرَأَ «كَلِمَةٌ.»') === 'قَرَأَ «كَلِمَة.»' && pauseForms('كَتَبَ رِسَالَةً .') === 'كَتَبَ رِسَالَة .' && pauseForms('جَاءَ أَخُوهُ؛ ثُمَّ ذَهَبَ!') === 'جَاءَ أَخُوهْ؛ ثُمَّ ذَهَبْ!' && pauseForms('قَالَ: نَعَمْ') === 'قَالْ: نَعَمْ' && pauseForms('بَيْتٌ, قَلَمٌ') === 'بَيْتْ, قَلَمْ');
  check('a whole text joins its sentences with a space and its lines with a line break', wholeText([{ line: 0, spoken: 'أَوَّلُ.' }, { line: 0, spoken: 'ثَانٍ.' }, { line: 1, spoken: 'ثَالِثٌ.' }]) === 'أَوَّلُ. ثَانٍ.\nثَالِثٌ.');
  const scriptRoot = path.join(temp, 'voice-scripts');
  const scriptJson = (file, value) => { const at = path.join(scriptRoot, file); fs.mkdirSync(path.dirname(at), { recursive: true }); fs.writeFileSync(at, JSON.stringify(value)); };
  scriptJson('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json', { assets: [{ id: 'asset.bare', type: 'original_text', text_ar: 'كتب سامي رسالة. قرأها صديقه.' }, { id: 'asset.marked', type: 'original_text', text_ar: 'كَتَبَ سَامِي رِسَالَةً.' }] });
  const scriptPassages = readings => { scriptJson('content/teaching/arabic/voice-scripts.json', { readings }); try { return readingPassages(pathToFileURL(scriptRoot + path.sep)); } catch (e) { return e.message; } };
  const scripted = scriptPassages({ 'asset.bare': 'كَتَبَ سَامِي رِسَالَةً. قَرَأَهَا صَدِيقُهُ.' });
  check('a voice script voices an unmarked text by sentence: the page keeps the course text, the voice gets the script in pause forms', typeof scripted === 'object' && same(scripted['asset.bare'].map(x => [x.text, x.plain, x.spoken]), [['كتب سامي رسالة.', 'كتب سامي رسالة.', 'كَتَبَ سَامِي رِسَالَة.'], ['قرأها صديقه.', 'قرأها صديقه.', 'قَرَأَهَا صَدِيقُهْ.']]) && !!scripted['asset.marked'], scripted);
  check('a voice script whose letters or sentences differ from the course text stops the build', String(scriptPassages({ 'asset.bare': 'كَتَبَ سَامِي رِسَالَةً. قَرَأَتْهَا صَدِيقَتُهُ.' })).includes('other letters than the course text') && String(scriptPassages({ 'asset.bare': 'كَتَبَ سَامِي رِسَالَةً قَرَأَهَا صَدِيقُهُ.' })).includes('its sentences do not match'));
  check('a voice script for a text the course already vowels, or for no such text, stops the build', String(scriptPassages({ 'asset.marked': 'كَتَبَ سَامِي رِسَالَةً.' })).includes('already gives this text with vowel marks') && String(scriptPassages({ 'asset.none': 'كَتَبَ.' })).includes('no reading text with that id'));
  // Round eleven: short pieces ("pieces" in voice-scripts.json) are checked like reading scripts.
  const { voicePieces, markedThrough } = await import(pathToFileURL(path.join(ROOT, 'app/scripts/arabic-reading-sentences.mjs')));
  const pieceCheck = (pieces, left_out = {}) => { scriptJson('content/teaching/arabic/voice-scripts.json', { pieces, left_out }); try { return voicePieces(pathToFileURL(scriptRoot + path.sep)); } catch (e) { return e.message; } };
  check('a piece script with the same letters, every course mark kept and marked all through is accepted', typeof pieceCheck({ 'أنا متعب': 'أَنَا مُتْعَبٌ', 'إنّ': 'إِنَّ' }) === 'object');
  check('a piece script with other letters, a contradicted mark, missing marks, or also left out stops the build', String(pieceCheck({ 'أنا متعب': 'أَنْتَ مُتْعَبٌ' })).includes('other letters') && String(pieceCheck({ 'أنتَ': 'أَنْتِ' })).includes('contradicts a vowel mark') && String(pieceCheck({ 'أنا متعب': 'أَنَا متعب' })).includes('not fully vowelled') && String(pieceCheck({ 'علم': 'عَلَم' }, { 'علم': 'two readings' })).includes('also listed as left out'));
  check('marked all through accepts the article\'s silent ل after لِ, with وَ or فَ before it or not, and nothing looser', markedThrough('لِلتَّحَقُّقِ') && markedThrough('وَلِلشَّمْسِ') && markedThrough('فَلِلشَّمْسِ') && !markedThrough('لْلتَّحَقُّقِ') && !markedThrough('لُلتَّحَقُّقِ') && !markedThrough('لِلكِتَابِ') && !markedThrough('لتَّحَقُّقِ') && !markedThrough('لِلتحَقُّقِ'));
  check('a piece the course already gives with vowel marks is refused (it needs no script)', String(pieceCheck({ 'أَنَا طَالِبٌ': 'أَنَا طَالِبٌ' })).includes('already gives it with vowel marks'));
  scriptJson('content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json', { assets: [{ id: 'asset.bare', type: 'original_text', text_ar: 'كتب سامي رسالة. قرأها صديقه.' }, { id: 'asset.some', type: 'original_text', text_ar: 'كَتَبَ سامي رسالة.' }, { id: 'asset.box', type: 'original_text', text_ar: 'في الصندوق ثلاثة أشياء: قلم وكتاب.' }] });
  check('a voice script that contradicts a vowel mark the course shows, or leaves words unmarked, or adds a line, stops the build', String(scriptPassages({ 'asset.some': 'كُتِبَ سَامِي رِسَالَةً.' })).includes('contradicts a vowel mark the course shows') && String(scriptPassages({ 'asset.bare': 'كَتَبَ سَامِي رِسَالَةً. قرأها صديقه.' })).includes('is not fully vowelled') && String(scriptPassages({ 'asset.bare': 'كَتَبَ سَامِي رِسَالَةً.\nقَرَأَهَا صَدِيقُهُ.' })).includes('its lines do not match'));
  const boxed = scriptPassages({ 'asset.some': 'كَتَبَ سَامِي رِسَالَةً.', 'asset.box': 'فِي الصُّنْدُوقِ ثَلَاثَةُ أَشْيَاءَ: قَلَمٌ وَكِتَابٌ.' });
  check('a script may add marks to a partly marked text, and a colon in prose is read as written (only a dialogue line\'s speaker is left unsaid)', typeof boxed === 'object' && boxed['asset.some'][0].spoken === 'كَتَبَ سَامِي رِسَالَة.' && boxed['asset.box'][0].spoken === 'فِي الصُّنْدُوقِ ثَلَاثَةُ أَشْيَاءْ: قَلَمٌ وَكِتَابْ.', boxed);
  const wholeSource = src('reading-wholes');
  check('the round-ten source has each reading text read whole once: its sentences as voiced, line by line', !!wholeSource && wholeSource.round === 10 && same([...wholeSource.texts].sort(), Object.values(passages).map(wholeText).sort()) && wholeText(passages['asset.arabic-changed-plan']).split('\n').length === 6);
  check('the prepared voice data names each reading text\'s whole text, and a whole clip ships only once checked', same(preparedAudio.wholes, Object.fromEntries(Object.entries(passages).map(([id, parts]) => [id, wholeText(parts)]))) && Object.values(preparedAudio.wholes).every(w => (preparedAudio.clips[w] ? audit.clips[w]?.check === 'checked' : audit.clips[w]?.check !== 'checked')));
  check('the prepared voice data lists the texts voiced from MyDay\'s scripts, and only those', same(preparedAudio.scripted, Object.keys(voiceScripts)));
  check('the prepared voice data lists the scripted pieces that ship, each with a checked clip', preparedAudio.scriptedPieces.length >= 250 && preparedAudio.scriptedPieces.every(t => realPieces[t] && preparedAudio.clips[t] && audit.clips[t]?.check === 'checked') && Object.keys(realPieces).filter(t => audit.clips[t]?.check === 'checked').length === preparedAudio.scriptedPieces.length);
  // Broken copies of the whole folder fail the build, each for its own reason.
  const brokenAudio = (name, mutate, message, expected) => {
    const dir = path.join(temp, `audio-${name}`);
    fs.cpSync(audioDir, dir, { recursive: true });
    const file = path.join(dir, 'audio-audit.json');
    const copy = JSON.parse(fs.readFileSync(file, 'utf8')); mutate(copy, dir); fs.writeFileSync(file, JSON.stringify(copy));
    const r = runAudio(dir);
    check(`${expected}: a bad copy fails the build and says "${message}"`, r.code !== 0 && r.out.includes(message), r.out);
  };
  const firstText = auditTexts.find(k => audit.clips[k].check === 'checked');
  brokenAudio('renamed', c => { c.clips[firstText + 'ا'] = c.clips[firstText]; delete c.clips[firstText]; }, 'is no longer in any voiced part of the course', 'a clip whose text is no longer in the course');
  brokenAudio('bytes', (c, dir) => { const f = path.join(dir, 'clips', audit.clips[firstText].file); const b = fs.readFileSync(f); b[b.length - 1] ^= 1; fs.writeFileSync(f, b); }, "contents don't match its name", 'a clip with one byte changed');
  brokenAudio('stray', (c, dir) => { fs.writeFileSync(path.join(dir, 'clips', '0123456789abcdef.mp3'), 'x'); }, 'files no clip uses', 'a stray file among the clips');
  brokenAudio('unknown', c => { c.clips[firstText].check = 'maybe'; }, 'unknown check', 'a check that is not one of the known ones');
  brokenAudio('voice', c => { c.clips[firstText].voice = 'ar-XA-Other'; }, "made with a voice the audit doesn't list", 'a clip made with a voice the audit does not list');
  brokenAudio('no-voice', c => { delete c.clips[firstText].voice; }, "made with a voice the audit doesn't list (none recorded)", 'a clip with no voice recorded');
  brokenAudio('nameless-voice', c => { c.earlier_voices = [{ service: 'x' }]; }, 'every voice the audit lists needs its name', 'an earlier voice without a name');
  const firstPiece = Object.keys(realPieces).find(t => audit.clips[t]?.check === 'checked');
  brokenAudio('piece-unrecorded', c => { delete c.clips[firstPiece].spoken; }, 'must record the script it was made from', 'a scripted piece\'s clip that doesn\'t record what it was made from');
  brokenAudio('spoken-words', c => { c.clips[firstText].spoken = 'كَلِمَة أُخْرَى.'; }, 'the spoken text changes more than its pause punctuation', 'a spoken form that changes the authored words');
  brokenAudio('short', (c, dir) => {
    const tiny = Buffer.alloc(1000, 7), name = require('crypto').createHash('sha256').update(tiny).digest('hex').slice(0, 16) + '.mp3';
    fs.rmSync(path.join(dir, 'clips', c.clips[firstText].file)); fs.writeFileSync(path.join(dir, 'clips', name), tiny); c.clips[firstText].file = name;
  }, 'too short', 'a clip cut short (1,000 bytes)');
  const secondText = auditTexts.find(k => k !== firstText && audit.clips[k].check === 'checked');
  brokenAudio('twice', (c, dir) => { fs.rmSync(path.join(dir, 'clips', c.clips[secondText].file)); c.clips[secondText].file = c.clips[firstText].file; }, 'used by two texts', 'two texts pointing at one file');
  const dirToCheck = path.join(temp, 'audio-tocheck');
  fs.cpSync(audioDir, dirToCheck, { recursive: true });
  const toCheck = JSON.parse(fs.readFileSync(path.join(dirToCheck, 'audio-audit.json'), 'utf8')); toCheck.clips[firstText].check = 'to check'; fs.writeFileSync(path.join(dirToCheck, 'audio-audit.json'), JSON.stringify(toCheck));
  const rTo = runAudio(dirToCheck);
  check('a clip set from "checked" to "to check" still passes the build, shipping one fewer', rTo.code === 0 && rTo.out.includes(`${checkedCount - 1} clips listened to and shipped`), rTo.out);
  fs.rmSync(temp, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
