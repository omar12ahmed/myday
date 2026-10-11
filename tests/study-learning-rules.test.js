// Study's learning record: telling a slip from something that hasn't clicked yet, repeated wrong choices and
// the daily stopping point. Pure rules on made-up answer histories; no browser, no saved data.
const fs = require('fs'), os = require('os'), path = require('path'), { pathToFileURL } = require('url');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
let pass = 0, fail = 0;
const check = (name, ok) => { console.log(`  ${ok ? 'PASS' : 'FAIL'} ${name}`); ok ? pass++ : fail++; };

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-study-learning-'));
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  fs.writeFileSync(path.join(tmp, 'fixture.ts'), `export * from ${JSON.stringify(path.join(ROOT, 'app/src/data/study/revision'))};`);
  const R = await import(pathToFileURL(await bundle(path.join(tmp, 'fixture.ts'), path.join(tmp, 'out'))).href);

  const concept = (id, extra = {}) => ({ id, title: id, taskIds: [], createdOn: '2026-10-01', kind: 'written', prompt: 'Q?', answer: 'A', explanation: '', choices: [], correct: null, hint: '', source: '', note: '', review: { reps: 0, interval: 0, lapses: 0, due: null }, ...extra });
  let n = 0;
  const review = (conceptId, outcome, support = 'own', rating = 'good', date = '2026-10-05', chosen = null) => ({ id: 'rv' + (++n), conceptId, title: conceptId, date, at: date + 'T09:00', kind: 'written', outcome, graded: 'self', chosen, support, rating, gap: 1, due: null });
  const study = (concepts, reviews, sessions = []) => ({ concepts, reviews, sessions, stages: [], focusCourseId: null, activeId: null, settings: { vault: '', showClock: true } });
  const state = (reviews, sessions = []) => R.understanding(study([concept('c')], reviews, sessions), concept('c'));

  console.log('\n[1] Slipped or not clicked yet, from the answers already saved');
  check('never revised is "new"', state([]) === 'new');
  check('never revised, but "not yet" after learning, has not clicked yet', state([], [{ checkin: { conceptIds: ['c'], clarity: 'notyet' } }]) === 'not-yet');
  check('wrong from the start has not clicked yet', state([review('c', 'wrong', 'own', 'again'), review('c', 'wrong', 'own', 'again')]) === 'not-yet');
  check('"not sure" without ever recalling it has not clicked yet', state([review('c', 'notsure', 'own', 'again')]) === 'not-yet');
  check('right only with a hint, then wrong, still has not clicked yet', state([review('c', 'right', 'hint'), review('c', 'wrong', 'own', 'again')]) === 'not-yet');
  check('recalled on your own, then wrong, has slipped', state([review('c', 'right', 'own'), review('c', 'wrong', 'own', 'again')]) === 'slipped');
  check('recalled on your own, then "not sure", has slipped', state([review('c', 'right', 'own'), review('c', 'notsure', 'own', 'hard')]) === 'slipped');
  check('right with a hint is getting there', state([review('c', 'right', 'hint')]) === 'getting-there');
  check('partly right on your own is getting there', state([review('c', 'partly', 'own', 'hard')]) === 'getting-there');
  check('right on your own last time is recalled', state([review('c', 'wrong', 'own', 'again'), review('c', 'right', 'own')]) === 'recalled');
  check('another concept\'s answers never count', R.understanding(study([concept('c')], [review('other', 'right', 'own')]), concept('c')) === 'new');
  const hist = (...r) => R.slips(study([concept('c')], r), concept('c'));
  check('a slip is a miss after you had recalled it on your own', hist(review('c', 'right', 'own'), review('c', 'wrong', 'own', 'again'), review('c', 'right', 'own'), review('c', 'notsure', 'own', 'hard')) === 2);
  check('misses before it ever clicked are not slips', hist(review('c', 'wrong', 'own', 'again'), review('c', 'right', 'hint'), review('c', 'wrong', 'own', 'again')) === 0);
  check('every state has gentle wording', Object.values(R.UNDERSTANDING).every(u => u.label && u.text && !/fail|behind|overdue|bad/i.test(u.text)));

  console.log('\n[2] A wrong option picked more than once');
  const choice = concept('m', { kind: 'choice', choices: ['TCP', 'UDP', 'ICMP'], correct: 1 });
  const picks = (...chosen) => R.repeatedWrongChoice(study([choice], chosen.map(c => review('m', c === 1 ? 'right' : 'wrong', 'own', 'good', '2026-10-05', c))), choice);
  check('picking the same wrong option twice is named', JSON.stringify(picks(0, 0)) === '{"choice":0,"times":2}');
  check('two different wrong options once each are not', picks(0, 2) === null);
  check('the right answer is never counted as a wrong pick', picks(1, 1, 1) === null);
  check('the most-picked wrong option wins', JSON.stringify(picks(2, 0, 2, 0, 2)) === '{"choice":2,"times":3}');
  check('written questions have no wrong picks', R.repeatedWrongChoice(study([concept('w')], []), concept('w')) === null);

  console.log('\n[3] The daily stopping point and the unchanged schedule');
  const day = Array.from({ length: 12 }, (_, i) => review('c', 'right', 'own', 'good', i < 10 ? '2026-10-10' : '2026-10-09'));
  check('reviews are counted for the day they happened', R.reviewedOn(study([concept('c')], day), '2026-10-10') === 10 && R.reviewedOn(study([concept('c')], day), '2026-10-09') === 2);
  check('the stopping point is ten a day', R.DAILY_ENOUGH === 10);
  check('scheduling is exactly as before (shared with the classic MyDay)', R.nextGap(0, 'again') === 1 && R.nextGap(0, 'hard') === 2 && R.nextGap(0, 'good') === 4 && R.nextGap(4, 'good') === 10 && R.nextGap(10, 'hard') === 12 && R.nextGap(100, 'good') === 180 && R.nextGap(30, 'again') === 1);

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
