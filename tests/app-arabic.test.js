// Arabic Fuṣḥā in Study, in the browser: the way in, the learning map, a module and a lesson, answers that
// load only when asked for, a reading text with and without vowel marks, the starter words, right-to-left
// Arabic in its own typeface, phone layout — and nothing saved. Disposable profile, no real data.
const T = require('./cdp.js');
const curriculum = require(require('path').join(process.env.MYDAY_ROOT || require('path').resolve(__dirname, '..'), 'content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json'));
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
  // Checked clips already shared with three reading sentences are available; unheard clips stay unshipped.
  check('it offers a first small step and accurately describes the available voice and unrecorded material', await exists('.next-card a[href^="#study/arabic/lesson."]')
    && (await T.text('.next-card')).includes('The starter words, lesson examples and some teaching and reading texts have a synthesised voice to copy. Look for a play button; some Arabic has no recording.')
    && (await T.text('.next-card')).includes('For listening and speaking, use a verified recording or a fluent speaker; typed work never stands in for them.'));
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
  check('starting saves one open session for this lesson, in the current curriculum version', ar.attempts.length === 1 && ar.attempts[0].lessonId === 'lesson.arabic-origin-location' && ar.attempts[0].variant === 'short' && ar.attempts[0].finishedAt === null && ar.attempts[0].curriculumVersion === '1.1.2' && await exists('[data-ar-session="open"]'));
  await click('[data-action="ar-practised"][data-v="reading"]'); await sleep(120); await click('[data-action="ar-practised"][data-v="writing"]'); await sleep(120); await click('[data-action="ar-help"][data-v="hint"]'); await sleep(120);
  await type(`[data-s="ar-answer"][data-q="${q1}"]`, 'مِن means from, في means in'); await sleep(150);
  await type('[data-s="ar-revisit"]', 'Country adjectives'); await sleep(150);
  ar = await AR();
  check('what you practised, the help you used, your first answer and your note are saved as you go', JSON.stringify(ar.attempts[0].practised) === '["reading","writing"]' && ar.attempts[0].help === 'hint' && ar.attempts[0].answers[q1] === 'مِن means from, في means in' && ar.attempts[0].revisit === 'Country adjectives');
  await click(`[data-ar-question="${q1}"] [data-action="ar-reveal"]`); await wait('[data-ar-answer]');
  check('looking shows the reference beside your first answer, which is now kept as written', (await T.text(`[data-ar-question="${q1}"] [data-ar-first]`)).includes('في means in') && !(await exists(`[data-s="ar-answer"][data-q="${q1}"]`)) && (await AR()).attempts[0].revealed.includes(q1));
  await go(lesson); await wait('[data-ar-session="open"]');
  check('after a reload the session is still open, exactly as you left it', await exists(`[data-ar-question="${q1}"] [data-ar-first]`) && await ev(`document.querySelector('[data-action="ar-help"][data-v="hint"]').getAttribute('aria-pressed') === 'true'`));
  await go('study'); await wait('[data-s="worth-a-look"] a[data-ar-resume]');
  check('Study\'s home offers to pick up the open session, under Worth a look', await exists('[data-s="worth-a-look"] a[data-ar-resume][href="#study/arabic/lesson.arabic-origin-location"]')
    && (await T.text('[data-worth="arabic-open"]')).includes('A session is open in Arabic'));
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
  check('choosing a goal saves it, and the next step moves on along it', (await AR()).pathId === 'path.arabic-a1' && await exists('[data-ar-next="lesson"]') && !(await T.text('[data-ar-next] h3')).includes('Describe origin and location'));
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
  check('finishing a session with nothing marked says Practised and adds nothing by itself', await exists('[data-ar-finished="practised"] [data-action="ar-ready"]') && !(await D()).arabic.cards.some(c => c.id.startsWith('assessment.')));
  await click('[data-action="ar-checks-add"]'); await sleep(250);
  cards = (await D()).arabic.cards.filter(c => c.id.startsWith('assessment.'));
  check('one tap under the checks adds them, first back tomorrow, and the lesson says so', cards.length === 2 && cards.every(c => c.id.startsWith('assessment.arabic-fusha-register-check.q') && c.review.due === '2026-10-12') && await exists('[data-ar-checks="in"]'));
  await on(11, 'study/arabic'); await wait('[data-ar-revision]');
  check('on the day they\'re added nothing is due: the map says when they come back', await ev(`document.querySelector('[data-ar-revision]').dataset.arRevision === 'later'`) && (await T.text('[data-ar-revision]')).includes('9 starter words and 2 lesson checks') && !(await exists('[data-action="ar-revise"]')));

  await on(12, 'today'); await wait('#slot-study');
  check('the next day, Today\'s Study card says revision is ready', (await T.text('#slot-study')).includes('Revision ready') && (await T.text('#slot-study')).includes('A round of 5'));
  await on(12, 'study'); await wait('#stRevision');
  check('Study\'s home offers a round and counts the Arabic cards without naming them', (await T.text('#stRevision')).includes('Revision ready: a round of 5') && (await T.text('#stRevision')).includes('12 Arabic cards'), await T.text('#stRevision'));
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

  console.log('\n[9] Finishing, then Ready to move on, follows the selected required path');
  const selectedPath = curriculum.paths.find(p => p.id === 'path.arabic-start');
  const byId = new Map(curriculum.lessons.map(l => [l.id, l]));
  const required = curriculum.modules.filter(m => selectedPath.required_module_ids.includes(m.id)).sort((a, b) => a.sequence - b.sequence)
    .flatMap(m => m.lesson_ids.filter(id => !byId.get(id).optional));
  const optional = curriculum.lessons.find(l => l.optional && !selectedPath.required_module_ids.includes(l.module_id));
  const outsidePath = curriculum.lessons.find(l => !l.optional && !selectedPath.required_module_ids.includes(l.module_id));
  const attempt = (id, finished = true) => ({ id: 'next-' + id.replace(/[^A-Za-z0-9_-]/g, '-'), lessonId: id, curriculumVersion: curriculum.curriculum_version, variant: 'standard', startedAt: '2026-10-11T08:00:00.000Z', finishedAt: finished ? '2026-10-11T08:20:00.000Z' : null, help: 'independent', practised: [], answers: {}, revealed: [], revisit: '' });
  const ready = id => ({ id, readyOn: '2026-10-11' });
  const upNext = () => ev(`(() => { const e = document.querySelector('[data-s="arabic-up-next"]'); return { href: e?.querySelector('a')?.getAttribute('href'), text: e?.textContent }; })()`);
  const finishWith = async (lessonId, attempts, lessons = []) => {
    await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.arabic.pathId = ${JSON.stringify(selectedPath.id)}; d.arabic.attempts = ${JSON.stringify(attempts)}; d.arabic.lessons = ${JSON.stringify(lessons)}; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
    await go('study/arabic/' + lessonId); await wait('[data-action="ar-begin"]');
    await click('[data-action="ar-begin"]'); await wait('[data-action="ar-finish"]');
    await click('[data-action="ar-finish"]'); await wait('[data-s="arabic-up-next"]');
    return upNext();
  };
  let next = await finishWith(required[0], [attempt(required[1])], [ready(required[1])]);
  check('finishing alone keeps the lesson as your next step: the card offers Ready, and the link goes back to the map', next.href === '#study/arabic' && await exists('[data-ar-finished="practised"] [data-action="ar-ready"]'), next);
  await click('[data-ar-finished] [data-action="ar-ready"]'); await sleep(300); next = await upNext();
  check('marking it ready moves on, skipping a successor already ready, to the earliest lesson not ready yet', next.href === '#study/arabic/' + required[2] && next.text.includes('Next lesson: ' + byId.get(required[2]).title), next);
  await click('[data-s="arabic-up-next"] a'); await wait('[data-ar-session="none"]');
  check('the next-lesson link opens that required lesson without starting another session', (await ev('location.hash')) === '#study/arabic/' + required[2] && !(await AR()).attempts.some(a => a.lessonId === required[2]), [await ev('location.hash'), (await AR()).attempts.map(a => a.lessonId)]);
  next = await finishWith(required[0], [attempt(required[4], false)], [ready(required[1])]);
  check('after finishing, a resumable required lesson comes first', next.href === '#study/arabic/' + required[4] && next.text.includes('Pick up where you left off:'), next);
  next = await finishWith(optional.id, []);
  check('finishing an optional extension offers the earliest required lesson on the selected path', next.href === '#study/arabic/' + required[0] && next.text.includes('Next lesson:'), next);
  next = await finishWith(outsidePath.id, [], [ready(required[0])]);
  check('finishing a lesson outside the selected path returns to its earliest lesson not ready yet', next.href === '#study/arabic/' + required[1], next);
  next = await finishWith(optional.id, [], required.map(ready));
  check('with every required lesson ready to move on, an optional finish says so and returns to the map', next.href === '#study/arabic' && next.text.includes('Every lesson on your path is ready to move on') && !next.text.includes('Next lesson:'), next);

  console.log('\n[10] Adaptive Study on a lesson: how it went, Ready to move on, Needs revision');
  const L = 'lesson.arabic-nominal-sentences', Q = n => `assessment.arabic-nominal-sentences-check.q${n}`, nominal = c => c.id.startsWith('assessment.arabic-nominal-sentences');
  const setValue = (sel, value) => ev(`(() => { const i = document.querySelector(${JSON.stringify(sel)}), set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ${JSON.stringify(value)}); i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  const place = () => ev(`document.querySelector('[data-ar-place]')?.dataset.arPlace`);
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.arabic.pathId = 'path.arabic-a1'; d.arabic.attempts = []; d.arabic.cards = []; delete d.arabic.lessons; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await go('study/arabic/' + L); await wait('[data-ar-place]');
  check('a lesson says where it stands in words, and what its checks cover', await place() === 'new' && (await T.text('[data-ar-place]')).includes('3 written checks') && !/%|score|\/100/i.test(await T.text('[data-ar-place]')));
  await click('[data-action="ar-begin"]'); await wait('[data-ar-session="open"]');
  for (const n of [1, 2, 3]) { await click(`[data-ar-question="${Q(n)}"] [data-action="ar-reveal"]`); await sleep(120); }
  await wait(`[data-ar-question="${Q(3)}"] [data-ar-mark]`, 6000);
  check('after you look, each check asks how it went, optionally, in revision\'s words', await count('[data-ar-mark]') === 3 && await ev(`[...document.querySelectorAll('[data-ar-mark]')].every(e => e.dataset.arMark === 'none')`) && (await T.text(`[data-ar-question="${Q(1)}"] [data-ar-mark]`)).includes('Not sure'));
  const mark = async (n, outcome, support) => { await click(`[data-ar-question="${Q(n)}"] [data-action="ar-mark"][data-v="${outcome}"]`); await sleep(150); if (support) { await click(`[data-ar-question="${Q(n)}"] [data-action="ar-mark-support"][data-v="${support}"]`); await sleep(150); } };
  await mark(1, 'wrong'); await mark(2, 'right'); await mark(3, 'notsure', 'notes');
  ar = await AR();
  check('your marks are kept on the lesson, for this session, with no Ready yet', ar.lessons?.[0]?.id === L && ar.lessons[0].marks[Q(1)].outcome === 'wrong' && ar.lessons[0].marks[Q(3)].support === 'notes'
    && ar.lessons[0].marks[Q(2)].attemptId === ar.attempts[0].id && !('readyOn' in ar.lessons[0]) && !ar.cards.some(nominal));
  await click('[data-action="ar-finish"]'); await wait('[data-ar-finished]');
  ar = await AR();
  check('finishing: Practised, and the two that haven\'t clicked yet come back tomorrow by themselves', await ev(`document.querySelector('[data-ar-finished]').dataset.arFinished === 'practised'`) && await exists('[data-ar-not-yet="2"]')
    && (await T.text('[data-ar-not-yet]')).includes('come back tomorrow') && ar.cards.filter(nominal).map(c => c.id + '@' + c.review.due).sort().join() === [Q(1) + '@2026-10-12', Q(3) + '@2026-10-12'].join());
  await click('[data-action="ar-not-yet-out"]'); await sleep(200);
  check('"Don\'t bring them back" takes exactly those out again', !(await AR()).cards.some(nominal) && !(await exists('[data-ar-not-yet]')));
  check('the card offers Ready anyway and Needs revision, never deciding for you', await exists('[data-ar-finished] [data-action="ar-ready"]') && await exists('[data-ar-finished] [data-action="ar-needs-revision"]') && await place() === 'practised');
  await click('[data-ar-finished] [data-action="ar-needs-revision"]'); await wait('#arRevisitWhat');
  await setValue('#arRevisitWhat', 'the nominal predicate'); await click('[data-action="ar-revisit-save"]'); await sleep(250);
  check('Needs revision keeps what needs work, and the lesson says so', (await AR()).lessons[0].revisit?.what === 'the nominal predicate' && await place() === 'needs-revision' && (await T.text('[data-ar-place]')).includes('the nominal predicate'));
  await click('[data-action="ar-place-revisited"]'); await sleep(200);
  check('Done revisiting clears it: Practised again', !(await AR()).lessons[0].revisit && await place() === 'practised');
  await click('[data-action="ar-finished-close"]'); await sleep(150);
  await click('[data-action="ar-begin"]'); await wait('[data-ar-session="open"]');
  for (const n of [1, 2, 3]) { await click(`[data-ar-question="${Q(n)}"] [data-action="ar-reveal"]`); await sleep(120); }
  await wait(`[data-ar-question="${Q(3)}"] [data-ar-mark]`, 6000);
  for (const n of [1, 2, 3]) await mark(n, 'right');
  await click('[data-action="ar-finish"]'); await wait('[data-ar-finished]');
  check('every check right on your own: "Looks ready to move on", as a suggestion with a choice', await ev(`document.querySelector('[data-ar-finished]').dataset.arFinished === 'looks-ready'`) && (await T.text('[data-ar-finished]')).includes('Looks ready to move on.') && await exists('[data-ar-finished] [data-action="ar-not-yet"]') && await place() === 'practised');
  await click('[data-ar-finished] [data-action="ar-ready"]'); await sleep(300);
  ar = await AR();
  check('Ready to move on saves the day and brings its 3 checks back a week later, saying when', ar.lessons[0].readyOn === '2026-10-11' && ar.cards.filter(nominal).length === 3 && ar.cards.filter(nominal).every(c => c.review.due === '2026-10-18')
    && (await T.text('[data-ar-finished]')).includes('will come back on'));
  check('…and the lesson says Ready to move on, with when its checks come back', await place() === 'ready' && (await T.text('[data-ar-place]')).includes('Ready to move on since'));
  await click('[data-action="ar-place-unready"]'); await sleep(200);
  check('Not ready after all takes the day back and leaves its checks in revision', !('readyOn' in (await AR()).lessons[0]) && (await AR()).cards.filter(nominal).length === 3 && await place() === 'practised');
  await click('[data-action="ar-place-ready"]'); await sleep(250);
  check('a lesson can be marked ready from its page too', (await AR()).lessons[0].readyOn === '2026-10-11' && await place() === 'ready');
  await go('study/arabic'); await wait('[data-ar-next]');
  check('the map counts it in words on its module, never a percentage', (await T.text('[data-ar-module="arabic-first-sentences"] [data-ar-module-counts]')).includes('1 ready') && !/%/.test(await T.text('[data-ar-module="arabic-first-sentences"]')));
  check('the next step comes with a "Why this?" in words', await exists('[data-ar-next] [data-ar-why]') && /^Why this\?\s*\S.*\.$/.test((await T.text('[data-ar-next] [data-ar-why]')).trim()), await T.text('[data-ar-next] [data-ar-why]'));
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.context = { ...(d.context || {}), '2026-10-11': { energy: 1, sleep: { start: null, end: null, estimatedHours: null } } }; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await go('study/arabic'); await wait('[data-ar-next]');
  check('at energy 1 the next step suggests the lesson\'s short session (10 of its 20 minutes), and says why', (await T.text('[data-ar-next]')).includes('about 10 min suits today') && (await T.text('[data-ar-next] [data-ar-why]')).includes('energy 1 today'));
  await go('study/arabic/lesson.arabic-greetings-address'); await wait('[data-ar-session="none"]');
  check('…and the session card starts on it, with the full lesson still there', await ev(`document.querySelector('[data-s="ar-variant"]:checked')?.value === 'short'`) && await count('[data-s="ar-variant"]') === 5);
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); delete d.context['2026-10-11']; d.arabic.attempts.push(${JSON.stringify(attempt('lesson.arabic-greetings-address'))}); localStorage.setItem('myday.data.v4', JSON.stringify(d)); localStorage.removeItem('myday.arabic.readyOffer'); })()`);
  await go('study/arabic'); await wait('[data-ar-next]');
  check('lessons practised before adaptive Study get a one-time offer, nothing ticked', await exists('[data-ar-ready-offer]') && await count('[data-ar-ready-offer] [data-s="ar-offer-lesson"]') === 1 && await ev(`document.querySelector('[data-action="ar-offer-ready"]').disabled`));
  await click('[data-action="ar-offer-close"]'); await sleep(150);
  await go('study/arabic'); await wait('[data-ar-next]');
  check('"Not now" closes it for good on this device (device-only, not saved data)', !(await exists('[data-ar-ready-offer]')) && await ev(`localStorage.getItem('myday.arabic.readyOffer') === 'done'`) && !('readyOffer' in JSON.parse(await ev(`localStorage.getItem('myday.data.v4')`)).arabic));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await go('study/arabic/' + L); await wait('[data-ar-place]');
  check('on a phone the lesson\'s place and its buttons fit, each at least 44 px tall', await ev('document.documentElement.scrollWidth === innerWidth') && await ev(`[...document.querySelectorAll('[data-ar-place] button')].every(b => b.getBoundingClientRect().height >= 44)`));
  await send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[11] The lesson journey: steps, Light / Normal / Deep, your place and the restart');
  const J = 'lesson.arabic-learning-loop'; // third on the core path: the lesson before it has checks, so it has a warm-up
  await go('study/arabic/' + J); await wait('[data-ar-steps]', 5000);
  check('the warm-up waits until you\'ve studied the lesson before', !(await ev(`document.querySelector('[data-ar-steps]').dataset.arSteps`)).includes('warmup'));
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.arabic.attempts.push({ id: 'aaWarm', lessonId: 'lesson.arabic-goal-baseline', curriculumVersion: '1.1.2', variant: 'short', startedAt: '2026-10-11T08:00:00.000Z', finishedAt: '2026-10-11T08:15:00.000Z', help: 'independent', practised: ['reading'], answers: {}, revealed: [], revisit: '' }); localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await go('study/arabic/' + J); await wait('[data-ar-steps]', 5000);
  const steps = () => ev(`document.querySelector('[data-ar-steps]').dataset.arSteps`);
  check('a lesson is one page in steps: with the full session chosen, Warm-up, Understand, Try and Check', (await steps()) === 'warmup understand try check', await steps());
  check('the session choice groups the lesson\'s own sessions as Light, Normal and Deep, with their real minutes',
    (await ev(`['light', 'normal', 'deep'].map(m => [...document.querySelectorAll('[data-ar-mode="' + m + '"] [data-s=ar-variant]')].map(i => i.value).join('+')).join()`)) === 'revision+short,practical,standard+extended'
    && (await T.text('[data-ar-mode="normal"]')).includes('Normal · 20 min'));
  await click('[data-s=ar-variant][value=short]'); await sleep(200);
  check('choosing the short session shows Understand and Check first, and the rest one tap away', (await steps()) === 'understand check' && (await ev(`document.querySelector('[data-ar-rest]').dataset.arRest`)) === 'warmup try'
    && (await T.text('[data-ar-rest] summary')).includes('The rest of this lesson: Warm-up, Try'));
  const unstarted = await ev(`localStorage.getItem('myday.data.v4')`);
  await click('[data-action="ar-begin"]'); await wait('[data-ar-session="open"]');
  check('with a short session open: Understand, Check and Reflect', (await steps()) === 'understand check reflect');
  check('…Check asks one question first, the other folded away', (await count('#ar-step-check > ol > li')) === 1 && (await T.text('[data-ar-more-checks] summary')) === 'The other question');
  const withSession = await ev(`localStorage.getItem('myday.data.v4')`);
  await click('[data-action="ar-step"][data-v="check"]'); await sleep(400);
  const sessionId = (await AR()).attempts.find(a => a.lessonId === J && !a.finishedAt).id;
  check('jumping to Check marks it as your step, keeps your place for this session on this device only, and moves focus there', (await ev(`document.querySelector('[data-action="ar-step"][aria-current="step"]').dataset.v`)) === 'check'
    && (await ev(`JSON.parse(localStorage.getItem('myday.study.lessonStep'))['${sessionId}']`)) === 'check' && (await ev(`localStorage.getItem('myday.data.v4')`)) === withSession
    && await ev(`document.activeElement === document.querySelector('#ar-step-check h3')`));
  check('…and while you check yourself, the explanation folds away', await exists('[data-ar-folded]') && !(await exists('#ar-step-understand [data-teaching]')));
  await click('[data-action="ar-explain-again"]'); await sleep(200);
  check('"Show the explanation again" brings it back', await exists('#ar-step-understand [data-teaching]') && !(await exists('[data-ar-folded]')));
  await go('study/arabic/' + J); await wait('[data-ar-steps]', 5000); await sleep(400);
  check('reopening the lesson with its session open goes back to your step', (await ev(`document.querySelector('[data-action="ar-step"][aria-current="step"]').dataset.v`)) === 'check'
    && await ev(`scrollY > 0 && (() => { const r = document.getElementById('ar-step-check').getBoundingClientRect(); return r.top >= 0 && r.top < 240; })()`));
  await click('[data-action="ar-restart"]'); await sleep(150);
  check('"I got distracted — help me restart" says where you were and offers one small thing', (await T.text('[data-ar-restart]')).includes('You were on Check.') && (await T.text('[data-action="ar-restart-go"]')) === 'Answer one check');
  await click('[data-action="ar-restart-go"]'); await sleep(300);
  check('…which takes you to it: the first answer box', await ev(`document.activeElement?.matches('[data-ar-check] textarea[data-s="ar-answer"]')`));
  check('…and none of this saved anything: only your session is in your data', (await ev(`localStorage.getItem('myday.data.v4')`)) === withSession && withSession !== unstarted);
  check('everything else about the lesson is folded under "More about this lesson"', !(await ev(`document.querySelector('[data-ar-more] details').open`)) && (await T.text('[data-ar-more]')).includes('When the lesson is done'));
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.study.settings.primarySubject = 'arabic'; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await go('study'); await wait('#stFocus[data-now="arabic"] [data-s=option-kept]', 5000);
  check('Study home picks it up where you left off: "You were on Check; it opens there."', (await T.text('#stFocus .eyebrow')).startsWith('Pick up where you left off') && (await T.text('#stFocus [data-s=option-kept]')) === 'You were on Check; it opens there.');
  await go('study/arabic/' + J); await wait('[data-ar-steps]', 5000); await sleep(500);
  await click('[data-action="ar-step"][data-v="understand"]'); await sleep(1200);
  await click('[data-action="ar-restart"]'); await sleep(150); await click('[data-action="ar-restart-go"]'); await sleep(300);
  check('from Understand, the restart goes to the example and focus goes with it (not lost to the page)', (await T.text('[data-action="ar-restart"]')) === 'I got distracted — help me restart'
    && await ev(`document.activeElement !== document.body && !!document.activeElement.closest('#ar-step-understand')`));
  await click('[data-action="ar-finish"]'); await wait('[data-ar-finished]'); await sleep(300);
  check('finishing shows how it went under Reflect, focus on it, the session\'s own steps kept', (await steps()) === 'understand check reflect' && await ev(`!!document.activeElement.closest('[data-ar-finished]')`));
  await click('[data-s=ar-variant][value=standard]'); await sleep(150); await click('[data-action="ar-begin"]'); await wait('[data-ar-session="open"]'); await sleep(600);
  check('starting again starts at the beginning: a full session\'s steps, the first one current, no jump to where the last session ended', (await steps()) === 'warmup understand try check reflect'
    && (await ev(`document.querySelector('[data-action="ar-step"][aria-current="step"]').dataset.v`)) === 'warmup' && !(await T.text('[data-ar-restart], [data-action="ar-restart"]')).includes('Reflect'));
  await go('study'); await wait('#stFocus[data-now="arabic"]', 5000); await sleep(300);
  check('…and Study home never says where the session before ended (at most where this one is: its first step)', !(await exists('#stFocus [data-s=option-kept]'))
    || (await T.text('#stFocus [data-s=option-kept]')) === 'You were on Warm-up; it opens there.', await T.text('#stFocus'));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await go('study/arabic/' + J); await wait('[data-ar-steps]', 5000);
  await ev(`window.scrollTo(0, document.getElementById('ar-step-check').offsetTop)`); await sleep(300);
  check('on a phone a full session\'s step bar stays at the top in one row, its steps at least 44 px tall, nothing scrolling sideways', await ev(`Math.round(document.querySelector('[data-ar-steps]').getBoundingClientRect().top) === 0`)
    && await ev(`document.querySelector('[data-ar-steps]').getBoundingClientRect().height <= 64`)
    && await ev(`[...document.querySelectorAll('[data-action="ar-step"]')].every(b => b.getBoundingClientRect().height >= 44)`) && await ev('document.documentElement.scrollWidth === innerWidth'));
  await click('[data-action="ar-step"][data-v="try"]'); await sleep(900);
  check('…and a step you jump to starts just below it, its heading in view', await ev(`document.querySelector('#ar-step-try h3').getBoundingClientRect().top >= document.querySelector('[data-ar-steps]').getBoundingClientRect().bottom - 1`));
  await send('Emulation.clearDeviceMetricsOverride');

  const s = T.summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
