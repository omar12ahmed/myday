// Sayings: the quiet line on each screen, on the app's own code (app/src/data/sayings.ts, bundled for Node). The
// content (every saying complete and honestly credited), the choice for a place and day (the same all day, a
// different one most days, every saying coming round), the gentle set for a rest or low-energy day, which place Today
// uses, and the credit lines. No browser.
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const K = await import(pathToFileURL(await bundle(path.join(ROOT, 'app/src/data/sayings.ts'), path.join(os.tmpdir(), `myday-sayings-${process.pid}`))).href);
  const PLACES = ['today', 'today-gentle', 'study', 'money', 'projects', 'review'];
  const hasArabic = s => /[؀-ۿ]/.test(s);
  // `n` consecutive days from 24 October 2026 (UTC arithmetic, so no clock or time-zone effects).
  const days = n => Array.from({ length: n }, (_, i) => new Date(Date.UTC(2026, 9, 24 + i)).toISOString().slice(0, 10));
  const idsOver = (place, n) => new Set(days(n).map(d => K.sayingFor(place, d).id));
  const idsFor = place => K.SAYINGS.filter(s => s.places.includes(place)).map(s => s.id).sort();

  console.log('\n[1] Every saying is complete');
  const ids = K.SAYINGS.map(s => s.id);
  check('there are 12 sayings, each with its own id', K.SAYINGS.length === 12 && new Set(ids).size === ids.length, ids);
  check('every saying has some text', K.SAYINGS.every(s => typeof s.text === 'string' && s.text.trim().length > 0), K.SAYINGS.filter(s => !s.text || !s.text.trim()).map(s => s.id));
  check('every saying is listed for at least one place, and only known places', K.SAYINGS.every(s => s.places.length > 0 && s.places.every(p => PLACES.includes(p))), K.SAYINGS.map(s => [s.id, s.places]));
  const withAr = K.SAYINGS.filter(s => s.ar);
  check('every Arabic saying has exactly two halves, each with Arabic letters in it', withAr.length > 0 && withAr.every(s => s.ar.length === 2 && s.ar.every(h => typeof h === 'string' && h.trim() && hasArabic(h))), withAr.map(s => [s.id, s.ar]));
  const lessons = K.SAYINGS.filter(s => !s.by);
  check('every saying with no author (a lesson) has a meaning', lessons.length === 2 && lessons.every(s => typeof s.meaning === 'string' && s.meaning.trim().length > 0), lessons.map(s => s.id));

  console.log('\n[2] One saying for a place and day');
  const day0 = '2026-10-24';
  check('the same place and day give the same saying twice', PLACES.every(p => K.sayingFor(p, day0).id === K.sayingFor(p, day0).id));
  check('the saying chosen is one listed for that place, on every one of 60 days', PLACES.every(p => days(60).every(d => K.sayingFor(p, d).places.includes(p))));
  check('all six places give a saying', PLACES.every(p => K.sayingFor(p, day0) && K.sayingFor(p, day0).id), PLACES.map(p => [p, (K.sayingFor(p, day0) || {}).id]));

  console.log('\n[3] Variety: every saying for a place comes round');
  for (const p of ['today', 'money', 'projects', 'review']) {
    const seen = [...idsOver(p, 60)].sort();
    check(`over 60 days, every saying listed for "${p}" appears at least once`, eq(seen, idsFor(p)), [seen, idsFor(p)]);
  }
  check('Today is not the same saying every day', idsOver('today', 60).size > 1);

  console.log('\n[4] The gentle set for a rest or low-energy day');
  const gentle = [...idsOver('today-gentle', 365)].sort();
  check('over a year, "today-gentle" only ever picks al-Shāfiʿī on the days, Marcus Aurelius or Viktor Frankl', gentle.every(i => ['shafii-days', 'aurelius-mind', 'frankl-change'].includes(i)), gentle);
  const demanding = ['clear-systems', 'clear-vote', 'hill-conceive', 'lesson-resistance', 'lesson-business'];
  check('…and never the demanding ones (the systems line, the vote line, "conceive and believe", the two lessons)', demanding.every(i => !gentle.includes(i)), gentle);
  check('…all three gentle sayings do come round over the year', eq(gentle, ['aurelius-mind', 'frankl-change', 'shafii-days']), gentle);

  console.log('\n[5] Which place Today uses');
  check('a rest day is gentle, even at energy 5', K.todayPlace(true, 5) === 'today-gentle', K.todayPlace(true, 5));
  check('energy 1 and 2 are gentle', K.todayPlace(false, 1) === 'today-gentle' && K.todayPlace(false, 2) === 'today-gentle');
  check('energy 3, 4 and 5 are the ordinary Today', [3, 4, 5].every(e => K.todayPlace(false, e) === 'today'), [3, 4, 5].map(e => K.todayPlace(false, e)));
  check('no energy chosen yet (null or not set) is the ordinary Today', K.todayPlace(false, null) === 'today' && K.todayPlace(false, undefined) === 'today');

  console.log('\n[6] Who it is credited to');
  const by = id => K.byLine(K.SAYINGS.find(s => s.id === id));
  check('al-Shāfiʿī on the days: "al-Shāfiʿī"', by('shafii-days') === 'al-Shāfiʿī', by('shafii-days'));
  check('al-Shāfiʿī on learning is only attributed: "attributed to al-Shāfiʿī"', by('shafii-learn') === 'attributed to al-Shāfiʿī', by('shafii-learn'));
  check('Marcus Aurelius is attributed and called a paraphrase (the line is in no translation): "attributed to Marcus Aurelius, Meditations (paraphrase)"', by('aurelius-mind') === 'attributed to Marcus Aurelius, Meditations (paraphrase)', by('aurelius-mind'));
  check('"conceive and believe" is only attributed: "attributed to Napoleon Hill"', by('hill-conceive') === 'attributed to Napoleon Hill', by('hill-conceive'));
  check('Morgan Housel is credited with his book: "Morgan Housel, The Psychology of Money"', by('housel-money') === 'Morgan Housel, The Psychology of Money', by('housel-money'));
  check('the two lessons have no credit line', by('lesson-business') === null && by('lesson-resistance') === null, [by('lesson-business'), by('lesson-resistance')]);

  const { pass, fail } = summary();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('HARNESS:', e); process.exit(2); });
