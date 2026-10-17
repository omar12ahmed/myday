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
  fs.rmSync(temp, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
