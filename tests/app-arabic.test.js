// Arabic Fuṣḥā in Study, in the browser: the way in, the learning map, a module and a lesson, answers that
// load only when asked for, a reading text with and without vowel marks, the starter words, right-to-left
// Arabic in its own typeface, phone layout — and nothing saved. Disposable profile, no real data.
const T = require('./cdp.js');
const { ev, send, sleep, check, click, exists } = T;
const go = async hash => { T.setUrl('app/dist/index.html#' + hash); await T.openAt(2026, 10, 11, 9); await sleep(700); };
const count = sel => ev(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
const wait = async (sel, ms = 3000) => { for (let t = 0; t < ms; t += 100) { if (await exists(sel)) return true; await sleep(100); } return false; };

(async () => {
  await T.connect(); await go('study'); await ev('localStorage.clear()'); await go('study');
  const saved = await ev(`localStorage.getItem('myday.data.v4')`);

  console.log('\n[1] The way in');
  check('Study\'s home shows Arabic beside Cybersecurity', await exists('[aria-labelledby="arabic-card-title"] a[href="#study/arabic"]') && await exists('.cyber-entry'));
  check('…with its Arabic name marked as Arabic, right to left', await ev(`(() => { const e = document.querySelector('.arabic-entry [lang="ar"]'); return !!e && e.dir === 'rtl' && e.textContent === 'العربية الفصحى'; })()`));

  console.log('\n[2] The learning map');
  await go('study/arabic'); await wait('[data-ar-module]');
  check('the map shows all 30 modules', await count('[data-ar-module]') === 30);
  check('…the 24 core modules by level, then the 6 optional extensions', await ev(`['Pre-A1','A1','A2','B1','B2'].map(s => document.querySelectorAll('[data-ar-stage="' + s + '"] [data-ar-module]').length).join() === '3,5,5,6,5' && document.querySelectorAll('[data-ar-stage="extensions"] [data-ar-module]').length === 6`));
  // The starter words and each lesson's example have a synthesised voice; the reading texts and the rest of each lesson have no recordings.
  check('it offers a first small step and says the starter words and each lesson\u2019s example have a voice (the reading texts and the rest of each lesson have no recordings)', await exists('.next-card a[href^="#study/arabic/lesson."]')
    && (await T.text('.next-card')).includes('The starter words (in Vocabulary) and each lesson\u2019s example have a synthesised voice to copy; the reading texts and the rest of each lesson have no recordings yet.'));
  await ev(`(() => { const i = document.querySelector('#arSearch'), set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, 'past'); i.dispatchEvent(new Event('input', { bubbles: true })); })()`); await sleep(150);
  check('search narrows the map to matching modules', await count('[data-ar-module]') > 0 && await count('[data-ar-module]') < 30 && await exists('[data-ar-module="arabic-past-stories"]'));

  console.log('\n[3] A module and a lesson');
  await go('study/arabic/module.arabic-first-sentences'); await wait('details summary');
  check('a module lists its lessons by topic and opens its practice', await count('a[href^="#study/arabic/lesson."]') >= 4 && (await T.text('main')).includes('Practice'));
  await go('study/arabic/lesson.arabic-origin-location'); await wait('[data-ar-check]');
  check('a lesson opens with its objectives, task and checks', (await T.text('main')).includes('Describe origin and location') && await exists('[data-ar-check] [data-ar-question]'));
  check('its Arabic example is marked as Arabic, right to left', await ev(`(() => { const e = document.querySelector('[data-ar-example] [lang="ar"]'); return !!e && e.dir === 'rtl' && /أَنَا/.test(e.textContent); })()`));
  check('…and drawn in the Arabic typeface', await ev(`getComputedStyle(document.querySelector('[data-ar-example] [lang="ar"]')).fontFamily.includes('Noto Naskh Arabic')`) && await ev(`document.fonts.ready.then(() => document.fonts.check('24px "Noto Naskh Arabic Variable"', 'عربي'))`));
  check('Arabic inside an English question is isolated, so the sentence keeps its order', await ev(`(() => { const q = [...document.querySelectorAll('[data-ar-question] p')].find(p => p.textContent.includes('Explain the difference')); return !!q && [...q.querySelectorAll('bdi[lang="ar"]')].map(b => b.textContent).join('|') === 'أنا من مصر|أنا في مصر'; })()`));
  const beforeReveal = await ev(`performance.getEntriesByType('resource').filter(r => /\\/answers-[^/]+\\.js$/.test(r.name)).length`);
  check('reference answers stay hidden until asked for', !(await exists('[data-ar-answer]')) && beforeReveal === 0);
  await click('[data-ar-question] [data-action="ar-reveal"]'); await wait('[data-ar-answer]');
  check('asking shows the reference answer and what else counts', (await T.text('[data-ar-answer]')).includes('Reference answer') && (await T.text('[data-ar-answer]')).includes('What also counts'));
  check('…and only one question opens, not all of them', await count('[data-ar-answer]') === 1);

  console.log('\n[4] Reading texts and vocabulary');
  await go('study/arabic/texts'); await wait('[data-ar-text]');
  check('the reading texts are all listed', await count('[data-ar-text]') === 16);
  await go('study/arabic/asset.arabic-study-method'); await wait('[data-ar-reading]');
  const plainOnly = await ev(`!document.querySelector('[data-action="ar-vowels"]')`);
  await go('study/arabic/asset.arabic-profile'); await wait('[data-ar-reading]');
  const voweled = await T.text('[data-ar-reading]');
  check('a beginner text shows its vowel marks', /[ً-ْ]/.test(voweled));
  check('a text written without vowel marks offers no toggle', plainOnly);
  check('its questions have their answers behind a button too', await count('[data-ar-question]') === 3 && !(await exists('[data-ar-answer]')));
  await go('study/arabic/asset.arabic-contrast-bank'); await wait('main li');
  check('the sound pairs are shown side by side', (await T.text('main')).includes('قَلْب') && (await T.text('main')).includes('كَلْب'));
  await go('study/arabic/vocabulary'); await wait('[data-ar-vocabulary]');
  // 96 = each word and its example; a word in a family also has a badge with its root (Arabic too), counted apart.
  check('all 48 starter words are listed with examples', await count('[data-ar-vocabulary] > li') === 48 && await count('[data-ar-vocabulary] [lang="ar"]:not([data-ar-family-badge] *)') === 96
    && await count('[data-ar-vocabulary] [data-ar-family-badge] [lang="ar"]') === 12);
  await go('study/arabic/lesson.nothing-here'); await sleep(300);
  check('an unknown page says so, with a way back', (await T.text('main')).includes('isn’t here'));

  console.log('\n[5] On a phone');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  let fits = true;
  for (const h of ['study/arabic', 'study/arabic/lesson.arabic-origin-location', 'study/arabic/asset.arabic-profile', 'study/arabic/vocabulary']) { await go(h); await sleep(400); fits &&= await ev('document.documentElement.scrollWidth === innerWidth'); }
  check('the map, a lesson, a text and the vocabulary fit a phone without sideways scrolling', fits);
  await send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[6] Nothing saved');
  check('browsing Arabic changes nothing in your saved MyDay', await ev(`localStorage.getItem('myday.data.v4')`) === saved);

  console.log('\n[7] Saving your sessions (part 2)');
  const AR = () => ev(`JSON.parse(localStorage.getItem('myday.data.v4')).arabic`);
  const type = (sel, text) => ev(`(() => { const t = document.querySelector(${JSON.stringify(sel)}), set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(t, ${JSON.stringify(text)}); t.dispatchEvent(new Event('input', { bubbles: true })); t.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  const lesson = 'study/arabic/lesson.arabic-origin-location', q1 = 'assessment.arabic-origin-location-check.q1';
  await go(lesson); await wait('[data-ar-session]');
  check('before a session, a lesson offers one with a choice of length', await exists('[data-ar-session="none"]') && await count('[data-s="ar-variant"]') === 5);
  await click('[data-s="ar-variant"][value="short"]'); await sleep(80); await click('[data-action="ar-begin"]'); await sleep(250);
  let ar = await AR();
  check('starting saves one open session for this lesson, in the current curriculum version', ar.attempts.length === 1 && ar.attempts[0].lessonId === 'lesson.arabic-origin-location' && ar.attempts[0].variant === 'short' && ar.attempts[0].finishedAt === null && ar.attempts[0].curriculumVersion === '1.1.1' && await exists('[data-ar-session="open"]'));
  await click('[data-action="ar-practised"][data-v="reading"]'); await sleep(120); await click('[data-action="ar-practised"][data-v="writing"]'); await sleep(120); await click('[data-action="ar-help"][data-v="hint"]'); await sleep(120);
  await type(`[data-s="ar-answer"][data-q="${q1}"]`, 'مِن means from, في means in'); await sleep(150);
  await type('[data-s="ar-revisit"]', 'Country adjectives'); await sleep(150);
  ar = await AR();
  check('what you practised, the help you used, your first answer and your note are saved as you go', JSON.stringify(ar.attempts[0].practised) === '["reading","writing"]' && ar.attempts[0].help === 'hint' && ar.attempts[0].answers[q1] === 'مِن means from, في means in' && ar.attempts[0].revisit === 'Country adjectives');
  await click(`[data-ar-question="${q1}"] [data-action="ar-reveal"]`); await wait('[data-ar-answer]');
  check('looking shows the reference beside your first answer, which is now kept as written', (await T.text(`[data-ar-question="${q1}"] [data-ar-first]`)).includes('في means in') && !(await exists(`[data-s="ar-answer"][data-q="${q1}"]`)) && (await AR()).attempts[0].revealed.includes(q1));
  await go(lesson); await wait('[data-ar-session="open"]');
  check('after a reload the session is still open, exactly as you left it', await exists(`[data-ar-question="${q1}"] [data-ar-first]`) && await ev(`document.querySelector('[data-action="ar-help"][data-v="hint"]').getAttribute('aria-pressed') === 'true'`));
  await go('study'); await wait('.arabic-entry');
  check('Study\'s home offers to pick up the open session', await exists('.arabic-entry [data-ar-resume][href="#study/arabic/lesson.arabic-origin-location"]'));
  await go('study/arabic'); await wait('[data-ar-next]');
  check('the map says to pick up where you left off, and the module is being explored', await exists('[data-ar-next="resume"]') && await ev(`document.querySelector('[data-ar-module="arabic-first-sentences"]').dataset.place === 'exploring'`));
  await go(lesson); await wait('[data-action="ar-finish"]'); await click('[data-action="ar-finish"]'); await sleep(250);
  ar = await AR();
  check('finishing records when, and the lesson shows your session, with no score', !!ar.attempts[0].finishedAt && await exists('[data-ar-history]') && (await T.text('[data-ar-history]')).includes('Short · With a hint · Reading, Writing') && !/score|%|\/100/i.test(await T.text('[data-ar-history]')));
  check('the lesson is ready for a fresh session', await exists('[data-ar-session="none"]'));
  await click('[data-action="ar-begin"]'); await sleep(200); await click('[data-action="ar-discard"]'); await sleep(200); await click('[data-action="dialog-confirm"]'); await sleep(250);
  ar = await AR();
  check('discarding asks first, then removes only that session', ar.attempts.length === 1 && !!ar.attempts[0].finishedAt);
  await go('study/arabic'); await wait('#arPath');
  await ev(`(() => { const s = document.querySelector('#arPath'); s.value = 'path.arabic-a1'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`); await sleep(250);
  check('choosing a goal saves it, and the next step moves on along it', (await AR()).pathId === 'path.arabic-a1' && await exists('[data-ar-next="next"]') && !(await T.text('[data-ar-next] h3')).includes('Describe origin and location'));
  await go('study/arabic/sessions'); await wait('[data-ar-sessions]');
  check('Your sessions lists what you have done, with links back to the lesson', await count('[data-ar-sessions] > li') === 1 && await exists('[data-ar-sessions] a[href="#study/arabic/lesson.arabic-origin-location"]'));
  check('nothing else in your saved MyDay changed', await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')), s = JSON.parse(${JSON.stringify(saved)}); delete d.arabic; delete s.arabic; delete d.saves; delete s.saves; return JSON.stringify(d) === JSON.stringify(s); })()`));

  console.log('\n[8] Starter words and lesson checks in revision (part 3)');
  const before = await ev(`localStorage.getItem('myday.data.v4')`);
  const D = () => ev(`JSON.parse(localStorage.getItem('myday.data.v4'))`);
  const on = async (day, hash) => { T.setUrl('app/dist/index.html#' + hash); await T.openAt(2026, 10, day, 9); await sleep(700); };
  // Answers the question on screen: show it, say how it compared (written answers are self-assessed), then rate it.
  const answer = async (self, rating) => { await click('[data-action="s-rev-show"]'); await sleep(120); await click(`[data-action="s-rev-self"][data-v="${self}"]`); await sleep(80); await click(`[data-action="s-rev-rate"][data-v="${rating}"]`); await sleep(250); };
  await on(11, 'study/arabic'); await wait('[data-ar-revision]');
  check('before anything is added, the map explains revision and offers no round', await ev(`document.querySelector('[data-ar-revision]').dataset.arRevision === 'none'`) && !(await exists('[data-action="ar-revise"]')));
  await on(11, 'study/arabic/vocabulary'); await wait('[data-action="ar-words-add"]');
  check('nothing is in revision until you add it', (await D()).arabic.cards.length === 0 && await count('[data-ar-word][data-in="yes"]') === 0);
  await click('[data-action="ar-words-add"]'); await sleep(250);
  let cards = (await D()).arabic.cards;
  check('"Add the next 5" brings the first five starter words into revision, recognising them first', cards.length === 5 && cards.every(c => c.id.endsWith(':recognise') && c.addedOn === '2026-10-11' && c.review.due === '2026-10-12') && cards[0].id === 'lexeme.arabic-seed-001:recognise');
  check('…and each word says when it first comes back', await count('[data-ar-word][data-in="yes"]') === 5 && (await T.text('[data-ar-word="lexeme.arabic-seed-001"]')).includes('Not revised yet · first on'));
  await click('[data-ar-word="lexeme.arabic-seed-001"] [data-action="ar-word-write"]'); await sleep(250);
  check('writing a word from memory is a second card you add yourself', (await D()).arabic.cards.some(c => c.id === 'lexeme.arabic-seed-001:write') && (await T.text('[data-ar-word="lexeme.arabic-seed-001"]')).includes('Writing it:'));
  await click('[data-action="ar-words-add"]'); await sleep(250);
  check('after 8 new words in a day a gentle note says that\'s plenty, and adding still works', await exists('[data-ar-plenty]') && (await D()).arabic.cards.length === 11 && await exists('[data-action="ar-words-add"]'));
  await click('[data-ar-word="lexeme.arabic-seed-010"] [data-action="ar-word-remove"]'); await sleep(200); await click('[data-action="dialog-confirm"]'); await sleep(250);
  check('taking a word out asks first, then removes it', (await D()).arabic.cards.length === 10 && !(await D()).arabic.cards.some(c => c.id.startsWith('lexeme.arabic-seed-010')));

  const reg = 'study/arabic/lesson.arabic-fusha-register';
  await on(11, reg); await wait('[data-ar-session]');
  check('a lesson\'s checks offer to come back in revision', await exists('[data-ar-checks="out"] [data-action="ar-checks-add"]'));
  await click('[data-action="ar-begin"]'); await sleep(250); await click('[data-action="ar-finish"]'); await sleep(300);
  check('finishing a session offers this lesson\'s checks, adding nothing by itself', await exists('[data-ar-finished] [data-action="ar-finished-add"]') && !(await D()).arabic.cards.some(c => c.id.startsWith('assessment.')));
  await click('[data-action="ar-finished-add"]'); await sleep(250);
  cards = (await D()).arabic.cards.filter(c => c.id.startsWith('assessment.'));
  check('one tap adds them, first back tomorrow, and the lesson says so', cards.length === 2 && cards.every(c => c.id.startsWith('assessment.arabic-fusha-register-check.q') && c.review.due === '2026-10-12') && (await T.text('[data-ar-finished]')).includes('are in your revision') && await exists('[data-ar-checks="in"]'));
  await on(11, 'study/arabic'); await wait('[data-ar-revision]');
  check('on the day they\'re added nothing is due: the map says when they come back', await ev(`document.querySelector('[data-ar-revision]').dataset.arRevision === 'later'`) && (await T.text('[data-ar-revision]')).includes('9 starter words and 2 lesson checks') && !(await exists('[data-action="ar-revise"]')));

  await on(12, 'today'); await wait('#slot-study');
  check('the next day, Today\'s Study card says revision is ready', (await T.text('#slot-study')).includes('Revision ready') && (await T.text('#slot-study')).includes('A round of 5'));
  await on(12, 'study'); await wait('#stRevision');
  check('Study\'s home counts the Arabic cards without naming them', (await T.text('#stRevision')).includes('Ready to revise: 12 Arabic cards'), await T.text('#stRevision'));
  await on(12, 'study/arabic'); await wait('[data-action="ar-revise"]');
  await click('[data-action="ar-revise"]'); await sleep(900);
  check('"Revise Arabic" starts a round of Arabic cards', (await ev('location.hash')) === '#study/revise' && (await T.text('.st-q')).includes('Question 1 of 5') && (await T.text('.st-path')) === 'Arabic · starter word');
  check('the word is shown as Arabic, right to left, and its meaning stays hidden', await ev(`(() => { const e = document.querySelector('.st-prompt [lang="ar"]'); return !!e && e.dir === 'rtl' && e.textContent === 'أَنَا'; })()`) && !(await exists('.st-answer')));
  check('your answer box follows the language you type in', await ev(`document.querySelector('[data-s="rev-typed"]').dir === 'auto'`));
  await click('[data-action="s-rev-show"]'); await sleep(150);
  check('showing it gives the meaning and an example sentence', (await T.text('.st-q')).includes('Meaning') && (await T.text('.st-q')).includes('I · pronoun') && (await T.text('.st-q')).includes('I am a student.'));
  check('you judge your own answer (MyDay never marks Arabic)', await exists('[data-action="s-rev-self"]') && (await T.text('.st-q')).includes('Self-assessed'));
  await click('[data-action="s-rev-self"][data-v="wrong"]'); await sleep(120);
  check('a wrong answer on a new word suggests its example, and a way back after the round', await ev(`document.querySelector('[data-s="rev-struggle"]').dataset.v === 'not-yet'`) && (await T.text('[data-s="rev-struggle"]')).includes('starter words'));
  await click('[data-action="s-rev-rate"][data-v="again"]'); await sleep(250);
  for (let i = 0; i < 4; i++) await answer('right', 'good');
  let d = await D();
  const revs = d.study.reviews.filter(r => r.conceptId.startsWith('lexeme.'));
  check('each answer goes into Study\'s revision history under the card\'s id, self-assessed', revs.length === 5 && revs[0].conceptId === 'lexeme.arabic-seed-001:recognise' && revs[0].title === 'أَنَا → I' && revs.every(r => r.graded === 'self' && r.kind === 'written'));
  check('…and each card is rescheduled by Study\'s rules: Again tomorrow, Good in 4 days', d.arabic.cards.find(c => c.id === 'lexeme.arabic-seed-001:recognise').review.due === '2026-10-13' && d.arabic.cards.filter(c => revs.slice(1).some(r => r.conceptId === c.id)).every(c => c.review.due === '2026-10-16'));
  check('the round\'s summary lists what hasn\'t clicked yet, linking back to the starter words', (await T.text('[data-s="rev-not-yet"]')).includes('أَنَا → I') && await exists('[data-s="rev-not-yet"] a[href="#study/arabic/vocabulary"]') && (await T.text('main h2')).includes('Arabic revision'));
  // Two more rounds: the word to write and four more words, then the lesson's two checks.
  let sawCheck = false, sawWrite = false;
  for (let round = 0; round < 2; round++) {
  await click('[data-action="s-rev-start"]'); await sleep(900);
  for (let i = 0; i < 5 && await exists('[data-action="s-rev-show"]'); i++) {
    const path = await T.text('.st-path');
    if (path.startsWith('Arabic · What Fuṣḥā')) {
      sawCheck = (await T.text('.st-prompt')).length > 10 && !(await exists('.st-answer'));
      await click('[data-action="s-rev-show"]'); await sleep(150);
      sawCheck &&= (await T.text('.st-q')).includes('Reference answer') && (await T.text('.st-q')).includes('What also counts') && await exists('.st-q a[href="#study/arabic/lesson.arabic-fusha-register"]');
      await click('[data-action="s-rev-self"][data-v="partly"]'); await sleep(80); await click('[data-action="s-rev-rate"][data-v="hard"]'); await sleep(250);
    } else {
      if (path === 'Arabic · write it from memory') sawWrite = (await T.text('.st-prompt')).includes('Write it in Arabic: “I”');
      await answer('right', 'good');
    }
  }
  }
  check('"Do another round" stays with Arabic: a lesson check shows its reference answer and what also counts, with its lesson', sawCheck);
  check('…and a word to write from memory asks for it by its meaning', sawWrite);
  d = await D();
  check('every Arabic answer is in Study\'s history, and the gentle stop counts them (12 today)', d.study.reviews.filter(r => r.date === '2026-10-12').length === 12 && !d.arabic.cards.some(c => c.review.due === '2026-10-12'));
  await on(12, 'study/revise'); await wait('[data-s="rev-enough"], .st-q', 2000);
  check('so revision says that\'s plenty for today', await exists('[data-s="rev-enough"]') || !(await exists('[data-action="s-rev-start"]')));
  await on(12, 'study/arabic/vocabulary'); await wait('[data-ar-vocabulary]');
  check('a word you recalled shows where it is, not a score', (await T.text('[data-ar-word="lexeme.arabic-seed-002"]')).includes('Recalled on your own · back on') && !/%|\/100|score/i.test(await T.text('main')));
  await click('[data-ar-word="lexeme.arabic-seed-002"] [data-action="ar-word-remove"]'); await sleep(200); await click('[data-action="dialog-confirm"]'); await sleep(250);
  d = await D();
  check('taking a word out keeps its past answers in your history', !d.arabic.cards.some(c => c.id.startsWith('lexeme.arabic-seed-002')) && d.study.reviews.some(r => r.conceptId === 'lexeme.arabic-seed-002:recognise'));
  check('nothing else in your saved MyDay changed', await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')), s = JSON.parse(${JSON.stringify(before)}); for (const x of [d, s]) { delete x.arabic; delete x.saves; x.study.reviews = []; } return JSON.stringify(d) === JSON.stringify(s); })()`));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await on(12, 'study/arabic/vocabulary'); await sleep(400);
  check('the starter words with their revision buttons fit a phone', await ev('document.documentElement.scrollWidth === innerWidth'));
  await send('Emulation.clearDeviceMetricsOverride');

  const s = T.summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
