// Study's learning record in the browser: a slip and something that hasn't clicked yet get different help,
// the round summary names them, a concept page shows its record, and revision has a gentle daily stop.
// Synthetic study data in the runner's disposable profile only.
const T = require('./cdp.js');
const { ev, sleep, check, click, exists } = T;
const go = async hash => { T.setUrl('app/dist/index.html#' + hash); await T.openAt(2026, 10, 10, 9); await sleep(350); };
const attr = (sel, name) => ev(`document.querySelector(${JSON.stringify(sel)})?.getAttribute(${JSON.stringify(name)})||''`);

(async () => {
  await T.connect(); await go('study'); await ev('localStorage.clear()'); await go('study');
  // Made-up concepts: B was recalled on its own before; C (multiple choice) has had the same wrong pick twice;
  // A has never been revised; D was reviewed ten times today already (it isn't due).
  await ev(`(() => {
    const d = JSON.parse(localStorage.getItem('myday.data.v4'));
    const concept = (id, title, extra) => Object.assign({ id, title, taskIds: [], createdOn: '2026-10-01', kind: 'written', prompt: 'What does ' + title + ' do?', answer: 'An answer', explanation: 'An explanation', choices: [], correct: null, hint: '', source: 'Course notes', note: '', review: { reps: 0, interval: 0, lapses: 0, due: null } }, extra);
    let n = 0;
    const review = (c, date, outcome, support, rating, chosen) => ({ id: 'rv' + (++n), conceptId: c, title: c, date, at: date + 'T09:00', kind: chosen == null ? 'written' : 'choice', outcome, graded: chosen == null ? 'self' : 'auto', chosen: chosen ?? null, support, rating, gap: 1, due: null });
    d.study.concepts = [
      concept('cpB', 'DNS', { review: { reps: 1, interval: 4, lapses: 0, due: '2026-10-08' } }),
      concept('cpC', 'Ports', { kind: 'choice', prompt: 'Which protocol is connectionless?', answer: '', choices: ['TCP', 'UDP', 'HTTP'], correct: 1, review: { reps: 2, interval: 1, lapses: 0, due: '2026-10-09' } }),
      concept('cpA', 'Subnets'),
      concept('cpD', 'Hashing', { review: { reps: 10, interval: 2, lapses: 0, due: '2026-10-12' } }),
    ];
    d.study.reviews = [review('cpB', '2026-10-04', 'right', 'own', 'good'), review('cpC', '2026-10-07', 'wrong', 'own', 'again', 0), review('cpC', '2026-10-08', 'wrong', 'own', 'again', 0)]
      .concat(Array.from({ length: 10 }, () => review('cpD', '2026-10-10', 'right', 'own', 'good')));
    localStorage.setItem('myday.data.v4', JSON.stringify(d));
  })()`);

  console.log('\n[1] A concept page shows its learning record');
  await go('study/concept/cpC');
  check('a multiple-choice question picked wrong twice has not clicked yet', await attr('[data-s="cp-understanding"]', 'data-v') === 'not-yet');
  check('…with ideas for learning it a different way', await exists('[data-s="cp-another-way"]'));
  check('…and the wrong option it keeps picking is named', (await T.text('[data-s="cp-wrong-choice"]')).includes('“TCP” 2 times'));
  check('…and one mark per answer so far, told apart by shape as well as colour', await ev(`document.querySelectorAll('[data-s="cp-trail"] li').length === 2 && [...document.querySelectorAll('[data-s="cp-trail"] li')].every(li => li.textContent.length > 5)`));
  await go('study/concept/cpB');
  check('a concept recalled on your own last time says so', await attr('[data-s="cp-understanding"]', 'data-v') === 'recalled' && !(await exists('[data-s="cp-another-way"]')));

  console.log('\n[2] A gentle daily stop');
  await go('study/revise');
  check('after ten reviews today, revision says that is plenty, and still lets you carry on', (await T.text('[data-s="rev-enough"]')).includes('10 reviewed today') && await exists('[data-action="s-rev-start"]'));
  await go('today');
  check('Today says revision is done for the day instead of asking for more', (await T.text('[data-s="today-rev-enough"]')).includes('10 done today'));

  console.log('\n[3] Different help for a slip and for something that has not clicked yet');
  const before = await ev(`JSON.stringify(JSON.parse(localStorage.getItem('myday.data.v4')).study.concepts.map(c => c.review))`);
  await go('study/revise'); await click('[data-action="s-rev-start"]'); await sleep(150);
  // B first (due longest), then C, then A (never revised).
  await click('[data-action="s-rev-show"]'); await sleep(80); await click('[data-action="s-rev-self"][data-v="wrong"]'); await sleep(80);
  check('getting a slipped concept wrong says it is in there and comes back tomorrow', await attr('[data-s="rev-struggle"]', 'data-v') === 'slipped');
  await click('[data-action="s-rev-rate"][data-v="again"]'); await sleep(150);
  await click('[data-action="s-rev-choose"][data-i="0"]'); await sleep(80);
  check('a wrong pick on something that never clicked suggests learning it differently', await attr('[data-s="rev-struggle"]', 'data-v') === 'not-yet');
  check('…and notices the same wrong answer a third time', (await T.text('[data-s="rev-struggle"]')).includes('picked this answer 3 times'));
  await click('[data-action="s-rev-rate"][data-v="again"]'); await sleep(150);
  await click('[data-action="s-rev-show"]'); await sleep(80); await click('[data-action="s-rev-self"][data-v="right"]'); await sleep(80);
  check('a right answer gets no struggle note', !(await exists('[data-s="rev-struggle"]')));
  await click('[data-action="s-rev-rate"][data-v="good"]'); await sleep(200);
  check('the round summary lists what has not clicked yet, with links to try it differently', (await T.text('[data-s="rev-not-yet"]')).includes('Ports') && await exists('[data-s="rev-not-yet"] a[href="#study/concept/cpC"]'));
  check('…and names what slipped separately', (await T.text('[data-s="rev-slipped"]')).includes('DNS') && !(await T.text('[data-s="rev-not-yet"]')).includes('DNS'));
  const after = await ev(`JSON.parse(localStorage.getItem('myday.data.v4')).study.concepts.map(c => c.review)`);
  check('the schedule follows the existing rules: Again → tomorrow, a first Good → in 4 days', after[0].due === '2026-10-11' && after[1].due === '2026-10-11' && after[2].due === '2026-10-14' && after[3].due === JSON.parse(before)[3].due);
  check('the schedule\'s own lapse count is unchanged (every Again after a first review)', after[0].lapses === 1 && after[1].lapses === 1);
  await go('study/concept/cpB');
  check('the slipped concept\'s page now says it slipped, once', await attr('[data-s="cp-understanding"]', 'data-v') === 'slipped' && (await T.text('dl')).includes('Slipped1 time'));
  await go('study/concept/cpC');
  check('a concept that never clicked is not counted as slipping', (await T.text('dl')).includes('Slipped0 times'));

  const s = T.summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
