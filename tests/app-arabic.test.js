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
  check('on the day they\'re added nothing is due: the map says when they come back', await ev(`document.querySelector('[data-ar-revision]').dataset.arRevision === 'later'`) && (await T.text('[data-ar-revision]')).includes('9 course words and 2 lesson checks') && !(await exists('[data-action="ar-revise"]')));

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
    && new RegExp(`Its ${ar.cards.filter(c => c.id.startsWith('lexeme.')).length} words will come back (tomorrow|from [^,]+), and its 3 checks on `).test(await T.text('[data-ar-finished]')), await T.text('[data-ar-finished]'));
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

  console.log('\n[12] Keep a word: from a reading text, your words, and revision');
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.arabic.cards = []; delete d.arabic.words; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await go('study/arabic/asset.arabic-profile'); await wait('[data-action="ar-keep-open"]');
  await click('[data-action="ar-keep-open"]'); await sleep(150);
  check('a reading text offers its words to keep: punctuation left out, vowel marks as written', await exists('[data-action="ar-keep-word"][data-v="أَنَا"]') && await exists('[data-action="ar-keep-word"][data-v="لَيْلَى"]')
    && !(await ev(`[...document.querySelectorAll('[data-action="ar-keep-word"]')].some(b => /[.،؟]/.test(b.dataset.v))`)));
  await click('[data-action="ar-keep-word"][data-v="أَنَا"]'); await sleep(150);
  check('a starter word comes with the course\'s meaning filled in, yours to change', (await ev(`document.querySelector('[data-s="ar-keep-meaning"]').value`)) === 'I' && (await T.text('[data-ar-keep-form]')).includes('One of the starter words'));
  await click('[data-action="ar-keep-save"]'); await sleep(250);
  let kw = (await AR()).words;
  check('"Keep it" saves the word as written, your meaning and where it came from, back tomorrow Arabic → meaning', kw?.length === 1 && kw[0].ar === 'أَنَا' && kw[0].meaning === 'I' && kw[0].from === 'asset.arabic-profile'
    && kw[0].recognise.due === '2026-10-12' && kw[0].write === null && (await T.text('[data-ar-kept]')).includes('Kept'));
  check('…and the picker marks it as yours', await ev(`document.querySelector('[data-action="ar-keep-word"][data-v="أَنَا"]').getAttribute('aria-label').includes('already in your words')`));
  await click('[data-action="ar-keep-word"][data-v="أَنَا"]'); await sleep(150);
  check('choosing it again says it\'s already in your words, with your meaning, and keeps nothing more', (await T.text('[data-ar-keep-already]')).includes('already in your words: I') && (await AR()).words.length === 1);
  await go('study/arabic/vocabulary'); await wait('[data-ar-your-words]');
  check('Vocabulary lists your words first, with where each came from and when it comes back', (await ev(`document.querySelector('[data-ar-your-words]').dataset.arYourWords`)) === '1'
    && (await T.text(`[data-ar-kept="${kw[0].id}"]`)).includes('A short personal profile') && (await T.text(`[data-ar-kept="${kw[0].id}"]`)).includes('Recognising it'));
  await click('[data-action="ar-word-own"]'); await sleep(150);
  const typeIn = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await typeIn('[data-s="ar-own-ar"]', 'أنا'); await sleep(150); // the same hamza, no vowel marks (انا, without it, is a different word)
  check('adding your own word recognises one you already keep, vowel marks aside', (await T.text('[data-ar-own-word] [data-ar-keep-already]')).includes('Already in your words: I') && await ev(`document.querySelector('[data-action="ar-own-save"]').disabled`));
  await typeIn('[data-s="ar-own-ar"]', 'بيت'); await typeIn('[data-s="ar-own-meaning"]', 'house'); await sleep(150);
  await click('[data-action="ar-own-save"]'); await sleep(250);
  kw = (await AR()).words;
  check('…and keeps a new one typed in, as typed', kw.length === 2 && kw[1].ar === 'بيت' && kw[1].meaning === 'house' && !('from' in kw[1]));
  await click(`[data-ar-kept="${kw[1].id}"] [data-action="ar-kept-write"]`); await sleep(200);
  check('"Also practise writing it" brings it back meaning → Arabic too, from tomorrow', (await AR()).words[1].write?.due === '2026-10-12' && (await T.text(`[data-ar-kept="${kw[1].id}"]`)).includes('Writing it'));
  await click(`[data-ar-kept="${kw[1].id}"] [data-action="ar-kept-edit"]`); await sleep(150);
  await typeIn(`#arEditM${kw[1].id}`, 'a house'); await click('[data-action="ar-kept-save"]'); await sleep(200);
  check('you can change your meaning', (await AR()).words[1].meaning === 'a house');
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.study.reviews = []; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await on(12, 'study/arabic'); await wait('[data-action="ar-revise"]', 5000);
  await click('[data-action="ar-revise"]'); await sleep(900);
  check('the next day your words come back in Revise Arabic, in your words', (await T.text('.st-q')).includes('a word you kept') && (await T.text('.st-q')).includes('What does it mean?'), await T.text('.st-q'));
  await click('[data-action="s-rev-show"]'); await sleep(200);
  const shownAnswer = await T.text('.st-q');
  check('…the answer is your own meaning', shownAnswer.includes('Your meaninga house') || shownAnswer.includes('Your meaningI'), shownAnswer);
  await click('[data-action="s-rev-rate"][data-v="good"]'); await sleep(250);
  const rated = (await AR()).words.find(w => w.recognise.reps === 1 || w.write?.reps === 1);
  check('…and rating it reschedules that way round and keeps the answer in your history', !!rated && JSON.parse(await ev(`localStorage.getItem('myday.data.v4')`)).study.reviews.some(r => r.conceptId.startsWith(rated.id + ':')));
  await go('study/arabic/vocabulary'); await wait('[data-ar-your-words]');
  await click(`[data-ar-kept="${kw[1].id}"] [data-action="ar-kept-unwrite"]`); await sleep(200);
  check('"Stop practising writing it" takes the writing side out and keeps the word', (await AR()).words[1].write === null && (await AR()).words.length === 2);
  await click(`[data-ar-kept="${kw[1].id}"] [data-action="ar-kept-remove"]`); await sleep(200); await click('[data-action="dialog-confirm"]'); await sleep(250);
  check('removing a word asks first, then it leaves your words and your revision', (await AR()).words.length === 1 && !(await exists(`[data-ar-kept="${kw[1].id}"]`)));
  await go('study/arabic'); await wait('[data-ar-revision]');
  check('the map\'s revision card counts the words you kept', (await T.text('[data-ar-revision]')).includes('1 word you kept') && (await ev(`document.querySelector('[data-ar-revision]').dataset.arRevision`)) !== 'none');
  await go('study/arabic/lesson.arabic-fusha-register'); await wait('#ar-step-understand [data-action="ar-keep-open"]', 5000);
  await click('#ar-step-understand [data-action="ar-keep-open"]'); await sleep(200);
  check('a lesson\'s Understand step offers the words of its example and worked example to keep', (await count('#ar-step-understand [data-action="ar-keep-word"]')) >= 2);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await go('study/arabic/asset.arabic-profile'); await wait('[data-action="ar-keep-open"]'); await click('[data-action="ar-keep-open"]'); await sleep(200);
  check('on a phone the word picker fits, each word at least 44 px tall', await ev('document.documentElement.scrollWidth === innerWidth') && await ev(`[...document.querySelectorAll('[data-action="ar-keep-word"]')].every(b => b.getBoundingClientRect().height >= 44)`));
  await send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[13] Practise again: tick at Reflect, the finish card, the place line, the map and revision');
  const REG = 'lesson.arabic-fusha-register', regHash = 'study/arabic/' + REG;
  const teachingReg = require(require('path').join(process.env.MYDAY_ROOT || require('path').resolve(__dirname, '..'), 'content/teaching/arabic-fusha.json')).lessons;
  const regTeaching = Array.isArray(teachingReg) ? teachingReg.find(x => x.id === REG) : teachingReg[REG];
  const beforePractice = await ev(`localStorage.getItem('myday.data.v4')`);
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.arabic.cards = []; d.arabic.attempts = d.arabic.attempts.filter(a => a.lessonId !== ${JSON.stringify(REG)}); delete d.arabic.practice; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  const PR = async () => (await AR()).practice;
  const recOf = async () => ((await PR()) || []).find(p => p.id === REG);
  const didAttr = () => ev(`document.querySelector('[data-ar-did]')?.dataset.arDid`);
  await go(regHash); await wait('[data-action="ar-begin"]'); await click('[data-action="ar-begin"]'); await wait('[data-ar-did]');
  const openId = (await AR()).attempts.find(a => a.lessonId === REG && !a.finishedAt).id;
  check('on Reflect a lesson with a Try it and a mini challenge offers both to tick, none ticked yet', await didAttr() === 'none' && await exists('[data-action="ar-did"][data-v="try"]') && await exists('[data-action="ar-did"][data-v="challenge"]')
    && (await T.text('[data-action="ar-did"][data-v="try"]')) === 'Its Try it' && (await T.text('[data-action="ar-did"][data-v="challenge"]')) === 'Its mini challenge' && !(await recOf()), [await didAttr(), await PR()]);
  await click('[data-action="ar-did"][data-v="try"]'); await sleep(250);
  let rec = await recOf();
  check('ticking its Try it shows it ticked and saves it at once as the open session\'s tick', await didAttr() === 'try' && JSON.stringify(rec) === JSON.stringify({ id: REG, open: { attemptId: openId, did: ['try'] } }), [await didAttr(), rec]);
  await click('[data-action="ar-did"][data-v="challenge"]'); await sleep(250);
  rec = await recOf();
  check('ticking its mini challenge too saves both, in order', await didAttr() === 'try challenge' && JSON.stringify(rec.open) === JSON.stringify({ attemptId: openId, did: ['try', 'challenge'] }), [await didAttr(), rec]);
  await click('[data-action="ar-did"][data-v="try"]'); await sleep(250);
  check('unticking one leaves the other saved', await didAttr() === 'challenge' && JSON.stringify((await recOf()).open.did) === '["challenge"]', [await didAttr(), await recOf()]);
  await click('[data-action="ar-did"][data-v="challenge"]'); await sleep(250);
  check('unticking the last one removes the record altogether', await didAttr() === 'none' && !(await recOf()), [await didAttr(), await PR()]);
  await click('[data-action="ar-did"][data-v="try"]'); await sleep(250);
  await click('[data-action="ar-discard"]'); await sleep(200); await click('[data-action="dialog-confirm"]'); await sleep(250);
  check('discarding a session takes its ticks with it', !(await recOf()) && !(await AR()).attempts.some(a => a.lessonId === REG), [await PR()]);
  await click('[data-action="ar-begin"]'); await wait('[data-ar-did]');
  await click('[data-action="ar-did"][data-v="try"]'); await sleep(200); await click('[data-action="ar-did"][data-v="challenge"]'); await sleep(250);
  await click('[data-action="ar-finish"]'); await wait('[data-ar-finished]'); await sleep(250);
  rec = await recOf();
  check('finishing turns the ticks into today\'s days, drops the open tick and puts the lesson in revision a week on', rec && rec.tried === '2026-10-11' && rec.challenged === '2026-10-11' && !('open' in rec) && rec.addedOn === '2026-10-11'
    && JSON.stringify(rec.review) === JSON.stringify({ reps: 0, interval: 7, lapses: 0, due: '2026-10-18' }), rec);
  check('the finish card says when you\'ll practise it again, with a way to not bring it back', await exists('[data-ar-practice-back="2026-10-18"]') && (await T.text('[data-ar-practice-back]')).includes('You’ll practise it again on') && await exists('[data-ar-practice-back] [data-action="ar-practice-out"]')
    && (await T.text('[data-action="ar-practice-out"]')) === 'Don’t bring it back', await T.text('[data-ar-practice-back]'));
  const placeLine = await T.text('[data-ar-place-practice]');
  check('under the lesson\'s title: when you last did its Try it and mini challenge, and when you practise it again', await ev(`document.querySelector('[data-ar-place-practice]')?.dataset.arPlacePractice`) === '2026-10-18'
    && placeLine.includes('You last did its Try it on') && placeLine.includes('its mini challenge on') && placeLine.includes('Practise again: first on'), placeLine);
  await go('study/arabic'); await wait('[data-ar-revision]');
  check('the map\'s revision card counts "1 lesson to practise again"', (await T.text('[data-ar-revision]')).includes('1 lesson to practise again'), await T.text('[data-ar-revision]'));
  await go(regHash); await wait('[data-ar-place-practice]');
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.arabic.attempts = d.arabic.attempts.filter(a => a.lessonId !== ${JSON.stringify(REG)}); localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await go(regHash); await wait('[data-action="ar-begin"]'); await click('[data-action="ar-begin"]'); await wait('[data-ar-did]');
  await click('[data-action="ar-finish"]'); await wait('[data-ar-finished]'); await sleep(250);
  check('finishing a later session with nothing ticked does not bring the lesson back a second time or change its days', JSON.stringify(await recOf()) === JSON.stringify(rec) && !(await exists('[data-ar-practice-back]')), [await recOf()]);
  // "Don't bring it back": do it on a fresh first finish.
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.arabic.attempts = d.arabic.attempts.filter(a => a.lessonId !== ${JSON.stringify(REG)}); delete d.arabic.practice; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await go(regHash); await wait('[data-action="ar-begin"]'); await click('[data-action="ar-begin"]'); await wait('[data-ar-did]');
  await click('[data-action="ar-did"][data-v="try"]'); await sleep(200); await click('[data-action="ar-finish"]'); await wait('[data-ar-practice-back]'); await sleep(200);
  await click('[data-action="ar-practice-out"]'); await sleep(250);
  rec = await recOf();
  check('"Don\'t bring it back" takes it out of revision, keeps the day you did its Try it, and hides the block', rec && rec.tried === '2026-10-11' && !('review' in rec) && !('addedOn' in rec) && !(await exists('[data-ar-practice-back]')), rec);
  check('…and the place line then shows no return day', await ev(`document.querySelector('[data-ar-place-practice]')?.dataset.arPlacePractice`) === 'out' && !(await T.text('[data-ar-place-practice]')).includes('Practise again:'), await T.text('[data-ar-place-practice]'));

  // Revision: seed a lesson that is due today.
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.arabic.cards = []; d.arabic.practice = [{ id: ${JSON.stringify(REG)}, tried: '2026-10-04', challenged: '2026-10-04', addedOn: '2026-10-04', review: { reps: 0, interval: 7, lapses: 0, due: '2026-10-11' } }]; d.study.reviews = []; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await go('study/arabic'); await wait('[data-action="ar-revise"]', 5000);
  await click('[data-action="ar-revise"]'); await wait('[data-rev-practice]', 6000);
  check('Revise Arabic asks for the lesson to practise again: its path line says so', (await ev('location.hash')) === '#study/revise' && (await T.text('.st-path')) === 'Arabic · practise again', await T.text('.st-path'));
  check('…with its Try it and its mini challenge as the task', await exists(`[data-rev-practice="${REG}"]`) && (await T.text('[data-rev-practice-try]')).includes(regTeaching.practice.slice(0, 40)) && (await T.text('[data-rev-practice-challenge]')).includes('Explain which Arabic you want'), await T.text('[data-rev-practice]'));
  check('…and the explained answer isn\'t on the page until asked for', !(await exists('.st-answer')) && !(await T.text('.st-q')).includes('Try it: the explained answer') && !(await ev(`document.body.textContent.includes(${JSON.stringify(regTeaching.solution.slice(0, 40))})`)));
  await click('[data-action="s-rev-show"]'); await sleep(200);
  check('asking shows it, labelled "Try it: the explained answer"', (await T.text('.st-q')).includes('Try it: the explained answer') && await ev(`document.body.textContent.includes(${JSON.stringify(regTeaching.solution.slice(0, 40))})`), await T.text('.st-q'));
  await click('[data-action="s-rev-self"][data-v="right"]'); await sleep(100);
  const gaps = await ev(`Object.fromEntries([...document.querySelectorAll('[data-action=s-rev-rate]')].map(b => [b.dataset.v, b.textContent]))`);
  check('the rating buttons show Practise again\'s own gaps for a first practice: Again in 7 days, Hard in 7 days, Good in 21 days', /in 7 days/.test(gaps.again) && /in 7 days/.test(gaps.hard) && /in 21 days/.test(gaps.good), gaps);
  await click('[data-action="s-rev-rate"][data-v="good"]'); await sleep(300);
  d = await D(); rec = d.arabic.practice.find(p => p.id === REG); const entry = d.study.reviews.find(r => r.conceptId === REG + ':practise');
  check('Good saves an interval of 21 days, due 21 days on, and adds a history entry for the lesson\'s practise card with a gap of 21', rec.review.interval === 21 && rec.review.due === '2026-11-01' && rec.review.reps === 1 && !!entry && entry.gap === 21, [rec.review, entry]);

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.arabic.attempts = d.arabic.attempts.filter(a => a.lessonId !== ${JSON.stringify(REG)}); localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await go(regHash); await wait('[data-action="ar-begin"]'); await click('[data-action="ar-begin"]'); await wait('[data-ar-did]'); await sleep(300);
  check('on a phone the "did you do it" buttons fit and are each at least 44 px tall', await ev('document.documentElement.scrollWidth === innerWidth') && await count('[data-action="ar-did"]') === 2 && await ev(`[...document.querySelectorAll('[data-action="ar-did"]')].every(b => b.getBoundingClientRect().height >= 44)`),
    await ev(`[...document.querySelectorAll('[data-action="ar-did"]')].map(b => b.getBoundingClientRect().height)`));
  await send('Emulation.clearDeviceMetricsOverride');
  await ev(`localStorage.setItem('myday.data.v4', ${JSON.stringify(beforePractice)})`);

  console.log('\n[14] Course words: the lesson\'s words, Vocabulary, Ready and revision');
  const GA = 'lesson.arabic-greetings-address', gaHash = 'study/arabic/' + GA, gaIds = n => `lexeme.arabic-greetings-address-${n}`;
  const fresh = async hash => { await go(hash); await ev('localStorage.clear()'); await go(hash); };
  const shortOf = (y, m, dd) => ev(`new Date(${y}, ${m - 1}, ${dd}).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })`);
  const rowIds = () => ev(`[...document.querySelectorAll('[data-ar-lesson-words] li[data-ar-word]')].map(e => e.dataset.arWord)`);
  await fresh(gaHash); await wait('[data-ar-lesson-words]', 5000);
  check('the lesson\'s Understand step has a closed list of its 9 words, saying how many starter words it uses', await ev(`(() => { const e = document.querySelector('#ar-step-understand details[data-ar-lesson-words="9"]'); return !!e && !e.open && e.querySelector('summary').textContent.trim() === 'Words in this lesson: 9, and 4 starter words it uses'; })()`),
    await ev(`document.querySelector('[data-ar-lesson-words] summary')?.textContent`));
  await ev(`document.querySelector('[data-ar-lesson-words]').open = true`); await sleep(200);
  const wantIds = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(gaIds).concat(['001', '002', '003', '026'].map(n => `lexeme.arabic-seed-${n}`));
  const gotIds = await rowIds();
  check('opened, it lists the 9 words in order, then the 4 starter words it uses', gotIds.join() === wantIds.join(), gotIds);
  const row1 = `[data-ar-word="${gaIds(1)}"]`;
  check('the first word shows its Arabic, meaning, root, example with its English, and its note', await ev(`(() => { const r = document.querySelector(${JSON.stringify(row1)}); const t = r.textContent; return t.includes('مَرْحَبًا') && t.includes('hello · chunk') && !!r.querySelector('[data-ar-root="ر-ح-ب"]') && t.includes('مَرْحَبًا، أَنَا سَارَةُ.') && t.includes('Hello, I am Sarah.') && (r.querySelector('[data-ar-word-note]')?.textContent || '').startsWith('A greeting for anyone'); })()`),
    await T.text(row1));
  check('the first word has play buttons for the word and for its example', await exists(`[data-ar-clip="${gaIds(1)}:word"]`) && await exists(`[data-ar-clip="${gaIds(1)}:example"]`));
  check('before Ready, the list says none of them are in revision yet and when they join', await ev(`document.querySelector('[data-ar-lesson-words-in="0"]')?.textContent`) === 'They join your revision when you mark the lesson ready to move on, a few a day.',
    await ev(`document.querySelector('[data-ar-lesson-words-in]')?.textContent`));
  await click('[data-action="ar-begin"]'); await wait('[data-ar-session="open"]');
  await click('[data-action="ar-step"][data-v="check"]'); await sleep(400);
  check('while you check yourself, with the explanation folded away, the word list isn\'t shown', await exists('[data-ar-folded]') && !(await exists('[data-ar-lesson-words]')));
  await click('[data-action="ar-discard"]'); await sleep(200); await click('[data-action="dialog-confirm"]'); await sleep(250);
  await go(gaHash); await wait('[data-ar-place]');
  await click('[data-action="ar-place-ready"]'); await sleep(300);
  cards = (await AR()).cards;
  const gaWordCards = cards.filter(c => c.id.startsWith('lexeme.')), gaCheckCards = cards.filter(c => c.id.startsWith('assessment.'));
  const wantWordCards = wantIds.map(i => i + ':recognise');
  const tomorrow = '2026-10-12', afterTomorrow = '2026-10-13', weekOn = '2026-10-18';
  check('marking it ready brings its 13 words into revision (own and starter), added today: 8 due tomorrow and 5 the day after', gaWordCards.length === 13 && gaWordCards.map(c => c.id).sort().join() === [...wantWordCards].sort().join()
    && gaWordCards.every(c => c.addedOn === '2026-10-11') && gaWordCards.filter(c => c.review.due === tomorrow).length === 8 && gaWordCards.filter(c => c.review.due === afterTomorrow).length === 5, gaWordCards.map(c => c.id + '@' + c.review.due));
  check('…and its 3 checks come back 7 days on', gaCheckCards.map(c => c.id).sort().join() === [1, 2, 3].map(n => `assessment.arabic-greetings-address-check.q${n}`).join() && gaCheckCards.every(c => c.addedOn === '2026-10-11' && c.review.due === weekOn), gaCheckCards.map(c => c.id + '@' + c.review.due));
  const fromDay = await shortOf(2026, 10, 12), onDay = await shortOf(2026, 10, 18);
  check('the note says when the 13 words and the 3 checks come back', await T.text('[data-ar-place-note]') === `Its 13 words will come back from ${fromDay}, and its 3 checks on ${onDay}.`, await T.text('[data-ar-place-note]'));
  await ev(`document.querySelector('[data-ar-lesson-words]').open = true`); await sleep(200);
  check('the open word list then says all of them are in revision', await ev(`document.querySelector('[data-ar-lesson-words-in="13"]')?.textContent`) === 'All of them are in your revision.', await ev(`document.querySelector('[data-ar-lesson-words-in]')?.textContent`));
  await click('[data-action="ar-place-unready"]'); await sleep(250); await click('[data-action="ar-place-ready"]'); await sleep(300);
  cards = (await AR()).cards;
  check('marking it ready again adds no second copy of any card', cards.length === 16 && new Set(cards.map(c => c.id)).size === 16, cards.map(c => c.id));

  await fresh('study/arabic/vocabulary'); await wait('[data-ar-course-words]', 5000);
  const cwFile = JSON.parse(require('fs').readFileSync(require('path').join(process.env.MYDAY_ROOT || require('path').resolve(__dirname, '..'), 'content/teaching/arabic/course-words.json'), 'utf8')).lessons;
  const cwLessons = Object.keys(cwFile), cwWords = Object.values(cwFile).reduce((n, l) => n + l.words.length, 0);
  const cwInfo = await ev(`(() => { const c = document.querySelector('[data-ar-course-words="${cwLessons.length}"]'); return !c ? null : { head: c.querySelector('h2').textContent, ids: [...c.querySelectorAll('[data-ar-course-lesson]')].map(s => s.dataset.arCourseLesson), links: [...c.querySelectorAll('[data-ar-course-lesson]')].map(s => s.querySelector('h3 a')?.getAttribute('href')), rows: c.querySelectorAll('li[data-ar-word]').length }; })()`);
  check(`Vocabulary has "Words from the lessons": all ${cwLessons.length} lessons with words, in order, each headed by a link to it, ${cwWords} word rows in all`, !!cwInfo && cwInfo.head === 'Words from the lessons' && cwInfo.ids.join() === cwLessons.join() && cwInfo.links.join() === cwLessons.map(l => '#study/arabic/' + l).join() && cwInfo.rows === cwWords && cwLessons.length >= 20, cwInfo);
  const nom2 = '[data-ar-word="lexeme.arabic-nominal-sentences-2"]';
  await click(nom2 + ' [data-action="ar-word-add"]'); await sleep(250);
  cards = (await AR()).cards;
  check('"Add to revision" on a course word adds just its recognise card, and the row then shows where it stands with a Take it out button', cards.length === 1 && cards[0].id === 'lexeme.arabic-nominal-sentences-2:recognise'
    && (await T.text(nom2)).includes('Recognising it:') && (await T.text(nom2 + ' [data-action="ar-word-remove"]')) === 'Take it out', cards.map(c => c.id));

  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.arabic.cards = [{ id: 'lexeme.arabic-greetings-address-1:recognise', addedOn: '2026-10-04', review: { reps: 0, interval: 1, lapses: 0, due: '2026-10-11' } }]; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await on(11, 'study/arabic'); await wait('[data-action="ar-revise"]', 5000);
  await click('[data-action="ar-revise"]'); await sleep(900);
  check('Revise Arabic asks a course word due today: the word is shown, and its path says it is from a lesson', await ev(`document.querySelector('.st-prompt [lang="ar"]')?.textContent`) === 'مَرْحَبًا' && (await T.text('.st-path')) === 'Arabic · a word from a lesson', await T.text('.st-path'));
  await click('[data-action="s-rev-show"]'); await sleep(200);
  const shownWord = await T.text('.st-q');
  check('…and showing the answer gives the example\'s English and the word\'s note', shownWord.includes('Hello, I am Sarah.') && shownWord.includes('A greeting for anyone'), shownWord);
  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.arabic.cards = [{ id: 'lexeme.arabic-greetings-address-3:recognise', addedOn: '2026-10-04', review: { reps: 0, interval: 1, lapses: 0, due: '2026-10-11' } }]; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await on(11, 'study/arabic'); await wait('[data-action="ar-revise"]', 5000);
  await click('[data-action="ar-revise"]'); await sleep(900); await click('[data-action="s-rev-show"]'); await sleep(200);
  check('…and a root in a word\'s note stays whole and in order there (خ-ي-ر as one right-to-left piece)', await ev(`[...document.querySelectorAll('.st-q bdi[dir="rtl"]')].some(b => b.textContent === 'خ-ي-ر')`), await T.text('.st-q'));

  await ev(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); d.arabic.cards = [{ id: 'lexeme.arabic-not-in-this-version-1:recognise', addedOn: '2026-10-04', review: { reps: 0, interval: 1, lapses: 0, due: '2026-10-11' } }]; localStorage.setItem('myday.data.v4', JSON.stringify(d)); })()`);
  await on(11, 'study/arabic'); await wait('[data-action="ar-revise"]', 5000);
  await click('[data-action="ar-revise"]'); await wait('[data-ar-gone]', 4000);
  check('a card for a word this version doesn\'t know says so, with "Skip for now" as its first button', await exists('[data-ar-gone]') && (await T.text('[data-ar-gone] h2')) === 'This one isn’t in this version of the course'
    && (await ev(`document.querySelector('[data-ar-gone] button')?.textContent`)) === 'Skip for now', await T.text('[data-ar-gone]'));
  await click('[data-action="ar-gone-skip"]'); await sleep(300);
  check('skipping it leaves that card in saved data', (await AR()).cards.some(c => c.id === 'lexeme.arabic-not-in-this-version-1:recognise'), (await AR()).cards.map(c => c.id));

  await fresh(gaHash); await wait('#ar-step-understand [data-action="ar-keep-open"]', 5000);
  await click('#ar-step-understand [data-action="ar-keep-open"]'); await sleep(200);
  await click('#ar-step-understand [data-action="ar-keep-word"][data-v="مَرْحَبًا"]'); await sleep(200);
  check('keeping مَرْحَبًا from the greetings lesson\'s example offers the meaning "hello"', await ev(`document.querySelector('[data-s="ar-keep-meaning"]')?.value`) === 'hello', await ev(`document.querySelector('[data-s="ar-keep-meaning"]')?.value`));

  await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 2, mobile: true });
  await go(gaHash); await wait('[data-ar-lesson-words]', 5000);
  await ev(`document.querySelector('[data-ar-lesson-words]').open = true`); await sleep(400);
  const tall = await ev(`(() => { const a = [...document.querySelectorAll('[data-ar-lesson-words] [data-ar-clip], [data-ar-lesson-words] [data-action="ar-word-add"]')]; return { n: a.length, small: a.filter(b => b.getBoundingClientRect().height < 44).length }; })()`);
  check('at 360 px the open word list doesn\'t scroll sideways, and its play and Add to revision buttons are at least 44 px tall', await ev('document.documentElement.scrollWidth === innerWidth') && tall.n > 0 && tall.small === 0, [await ev('[document.documentElement.scrollWidth, innerWidth]'), tall]);
  await send('Emulation.clearDeviceMetricsOverride');

  console.log('\n[15] Explainers: How it works, the questions, the links, nothing saved');
  const wvHash = 'study/arabic/lesson.arabic-weak-verbs', exSel = '#ar-step-understand [data-ar-explainers="5"]';
  const exWantIds = ['say', 'be', 'live', 'invite', 'walk'].map(n => 'explainer.arabic-' + n);
  await fresh(wvHash); await wait(exSel, 5000);
  const exInfo = await ev(`(() => { const s = document.querySelector('#ar-step-understand [data-ar-explainers="5"]'); return !s ? null : { head: s.querySelector('h4')?.textContent, ids: [...s.querySelectorAll('details[data-ar-explainer]')].map(d => d.dataset.arExplainer), open: [...s.querySelectorAll('details[data-ar-explainer]')].filter(d => d.open).length }; })()`);
  check('the weak verbs lesson has "How it works" in its Understand step, with five explainers in order (say, be, live, invite, walk), all closed', !!exInfo && exInfo.head === 'How it works' && exInfo.ids.join() === exWantIds.join() && exInfo.open === 0, exInfo);
  const savedBefore = await ev(`JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith('myday.')).sort().map(k => [k, localStorage.getItem(k)]))`);
  const sayEx = 'details[data-ar-explainer="explainer.arabic-say"]';
  await ev(`document.querySelector('${sayEx}').open = true`); await sleep(300);
  const sayCounts = await ev(`(() => { const d = document.querySelector('${sayEx}'), t = d.querySelector('[data-ar-explainer-table]'), ar = [...t.querySelectorAll('[lang="ar"]')]; return { rows: d.querySelectorAll('[data-ar-explainer-row]').length, steps: d.querySelectorAll('[data-ar-explainer-step]').length, sentences: d.querySelectorAll('[data-ar-explainer-sentence]').length, qs: d.querySelectorAll('[data-ar-explainer-q]').length, arN: ar.length, arOk: ar.every(e => e.dir === 'rtl') }; })()`);
  check('opening the Say explainer shows 10 table rows, 5 steps, 3 sentences and 3 questions', sayCounts.rows === 10 && sayCounts.steps === 5 && sayCounts.sentences === 3 && sayCounts.qs === 3, sayCounts);
  check('…and its table\'s Arabic is marked as Arabic, right to left', sayCounts.arN > 0 && sayCounts.arOk, sayCounts);
  const exQ1 = `${sayEx} [data-ar-explainer-q="1"]`, exQ2 = `${sayEx} [data-ar-explainer-q="2"]`;
  await click(`${exQ1} [data-action="ar-explainer-choose"]:nth-of-type(2)`); await sleep(300);
  const focusedWhy = await ev(`(() => { const w = document.querySelector('${exQ1} [data-ar-explainer-why]'); return !!w && document.activeElement === w; })()`);
  await click(`${exQ2} [data-action="ar-explainer-choose"]:nth-of-type(1)`); await sleep(300);
  const savedAfter = await ev(`JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith('myday.')).sort().map(k => [k, localStorage.getItem(k)]))`);
  check('choosing answers in the questions saves nothing: every myday. key in this browser is identical before and after', savedAfter === savedBefore, [savedBefore && savedBefore.length, savedAfter && savedAfter.length]);
  const wrongInfo = await ev(`(() => { const q = document.querySelector('${exQ1}'), w = q.querySelector('[data-ar-explainer-why]'); return { state: q.dataset.state, right: q.querySelector('[data-ar-explainer-choice="right"]')?.textContent, wrong: q.querySelector('[data-ar-explainer-choice="wrong"]')?.textContent, why: w?.textContent, focused: !!w && document.activeElement === w }; })()`);
  check('a wrong choice marks question 1 wrong, shows قُلْ as the right one, labels "(your choice)" and says "Not quite."', wrongInfo.state === 'wrong' && wrongInfo.right.includes('قُلْ') && wrongInfo.wrong.includes('(your choice)') && (wrongInfo.why || '').startsWith('Not quite.'), wrongInfo);
  check('…and focus moves to its explanation', focusedWhy, wrongInfo);
  const rightInfo = await ev(`(() => { const q = document.querySelector('${exQ2}'); return { state: q.dataset.state, why: q.querySelector('[data-ar-explainer-why]')?.textContent }; })()`);
  check('a right choice marks question 2 right and its explanation starts "Right."', rightInfo.state === 'right' && (rightInfo.why || '').startsWith('Right.'), rightInfo);
  // The explainers' voice, from the clips listened to: forms, sentences and the Arabic in the steps (not the pieces, questions or why).
  const sayVoice = await ev(`(() => { const d = document.querySelector('${sayEx}'), btns = e => [...e.querySelectorAll('[data-action="ar-play"]')].map(b => b.getAttribute('data-ar-clip'));
    return { rows: [...d.querySelectorAll('[data-ar-explainer-row]')].map(r => btns(r)), sentences: [...d.querySelectorAll('[data-ar-explainer-sentence]')].map(r => btns(r.firstElementChild)), words: [...d.querySelectorAll('[data-ar-explainer-sentence] ul')].map(u => btns(u).length),
      steps: [...d.querySelectorAll('[data-ar-explainer-step]')].map(r => btns(r)), tests: [...d.querySelectorAll('[data-ar-explainer-q]')].map(q => btns(q).length), choices: [...d.querySelectorAll('[data-action="ar-explainer-choose"] [data-action="ar-play"], [data-ar-explainer-choice] [data-action="ar-play"]')].length,
      labels: [...d.querySelectorAll('[data-ar-voice-label]')].length, all: btns(d).length }; })()`);
  const sx = 'explainer.arabic-say';
  check('each of the Say explainer\'s 10 table rows has one play button, named by its form number', JSON.stringify(sayVoice.rows) === JSON.stringify(Array.from({ length: 10 }, (_, i) => [`${sx}:form:${i}`])), sayVoice.rows);
  check('…and each of its 3 sentences has one, named by its number', JSON.stringify(sayVoice.sentences) === JSON.stringify([0, 1, 2].map(i => [`${sx}:sentence:${i}`])), sayVoice.sentences);
  check('…each of its steps has a play button for every Arabic run that has a clip (3, 4, 3, 2 and 2), named for that step', sayVoice.steps.map(b => b.length).join() === '3,4,3,2,2' && sayVoice.steps.every((b, i) => b.every(n => n.startsWith(`${sx}:step:${i}:`))), sayVoice.steps);
  check('…but the word-by-word pieces and the self-test have no play buttons', sayVoice.words.length === 3 && sayVoice.words.every(n => n === 0) && sayVoice.tests.length === 3 && sayVoice.tests.every(n => n === 0) && sayVoice.choices === 0, sayVoice);
  check('…and one voice label shows for the explainer', sayVoice.labels === 1 && sayVoice.all === 10 + 3 + 14, sayVoice);
  await click('[data-action="ar-step"][data-v="check"]'); await sleep(400);
  check('while you check yourself, the explainers fold away with the explanation', await exists('[data-ar-folded]') && !(await exists('[data-ar-explainers]')));

  await fresh('study/arabic/vocabulary'); await wait('[data-ar-course-words]', 5000);
  const linkText = id => ev(`document.querySelector('[data-ar-word="${id}"] [data-ar-explainer-link]')?.textContent`);
  const linkCount = await count('[data-ar-explainer-link]');
  check('Vocabulary has 147 links to explainers under course words (52 in modules 4–5, 55 in modules 6–7, 13 in module 14, 27 in module 15)', linkCount === 147, linkCount);
  check('a verb\'s link reads "How this verb works, step by step"', await linkText('lexeme.arabic-weak-verbs-1') === 'How this verb works, step by step', await linkText('lexeme.arabic-weak-verbs-1'));
  check('a phrase\'s link reads "How it works, step by step"', await linkText('lexeme.arabic-verb-moods-4') === 'How it works, step by step', await linkText('lexeme.arabic-verb-moods-4'));
  check('…and each link\'s accessible name adds its word, so the list of links can be told apart', await ev(`document.querySelector('[data-ar-word="lexeme.arabic-weak-verbs-1"] [data-ar-explainer-link]')?.getAttribute('aria-label')`) === 'How this verb works, step by step: قَالَ');

  // Wide, where the app bar and the lesson's step bar stay at the top: the opened card's title must clear both.
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await go('study/arabic/vocabulary'); await wait('[data-ar-explainer-link]', 5000);

  await click('[data-ar-word="lexeme.arabic-irregular-families-5"] [data-ar-explainer-link]');
  let follow = null;
  for (let t = 0; t < 3000; t += 100) {
    follow = await ev(`(() => { const d = document.querySelector('details[data-ar-explainer="explainer.arabic-take"]'), s = d?.querySelector('summary'), bar = document.querySelector('nav.journey-steps'); const top = d ? d.getBoundingClientRect().top : null; return { hash: location.hash, open: !!d && d.open, top, h: innerHeight, title: s ? Math.round(s.getBoundingClientRect().top) : null, bar: bar ? Math.round(bar.getBoundingClientRect().bottom) : null, focused: !!s && document.activeElement === s }; })()`);
    if (follow.hash === '#study/arabic/lesson.arabic-irregular-families' && follow.open && follow.top >= 0 && follow.top < follow.h && follow.title >= follow.bar) break;
    await sleep(100);
  }
  check('following a link from Vocabulary goes to that lesson with the Take explainer open and in view', follow.hash === '#study/arabic/lesson.arabic-irregular-families' && follow.open && follow.top >= 0 && follow.top < follow.h, follow);
  check('…at 1280 px its title, which has focus, sits below the sticky step bar, not under it', follow.focused && follow.bar !== null && follow.title >= follow.bar, follow);
  await send('Emulation.clearDeviceMetricsOverride');

  // A word from another lesson links to the explainer where it lives: لَمْ يَكُنْ (verb moods) to Be (weak verbs).
  await fresh('study/arabic/lesson.arabic-verb-moods'); await wait('[data-ar-lesson-words]', 5000);
  await ev(`document.querySelector('[data-ar-lesson-words]').open = true`); await sleep(300);
  await click('[data-ar-word="lexeme.arabic-verb-moods-4"] [data-ar-explainer-link]');
  let across = null;
  for (let t = 0; t < 3000; t += 100) {
    across = await ev(`({ hash: location.hash, open: !!document.querySelector('details[data-ar-explainer="explainer.arabic-be"]')?.open })`);
    if (across.hash === '#study/arabic/lesson.arabic-weak-verbs' && across.open) break;
    await sleep(100);
  }
  check('a word in another lesson\'s list opens the explainer in its own lesson: from verb moods to Be, open', across.hash === '#study/arabic/lesson.arabic-weak-verbs' && across.open, across);

  await fresh(wvHash); await wait('[data-ar-lesson-words]', 5000);
  await ev(`document.querySelector('[data-ar-lesson-words]').open = true`); await sleep(300);
  const hashBefore = await ev('location.hash');
  await click('[data-ar-word="lexeme.arabic-weak-verbs-4"] [data-ar-explainer-link]');
  let inPlace = false;
  for (let t = 0; t < 3000 && !inPlace; t += 100) { inPlace = await ev(`!!document.querySelector('details[data-ar-explainer="explainer.arabic-invite"]')?.open`); if (!inPlace) await sleep(100); }
  check('a link inside the lesson opens its explainer in place, and the address stays the same', inPlace && await ev('location.hash') === hashBefore, [hashBefore, await ev('location.hash')]);

  await fresh('study/arabic/lesson.arabic-inna-kana'); await wait('[data-ar-explainers="2"]', 5000);
  await ev(`document.querySelector('details[data-ar-explainer="explainer.arabic-inna-sisters"]').open = true`); await sleep(300);
  const label = await ev(`(() => { const row = document.querySelector('details[data-ar-explainer="explainer.arabic-inna-sisters"] [data-ar-explainer-row="إِنَّ الْجَوَّ جَمِيلٌ"]'); const cell = row?.firstElementChild; const ar = cell?.querySelector('[lang="ar"]'); return { text: cell?.textContent, ar: ar?.textContent, dir: ar ? getComputedStyle(ar).direction : null }; })()`);
  check('module 15: the إِنَّ and كَانَ lesson has its two explainers, and a table label\'s Arabic ("with إِنَّ") is marked as Arabic, right to left', (label.text || '').startsWith('with ') && label.ar === 'إِنَّ' && label.dir === 'rtl', label);
  await fresh('study/arabic/lesson.arabic-clock-calendar'); await wait('[data-ar-explainers]', 5000);
  check('module 7: the time and days lesson has its two explainers, the time and the days of the week', (await ev(`[...document.querySelectorAll('[data-ar-explainers] details[data-ar-explainer]')].map(d => d.dataset.arExplainer).join()`)) === 'explainer.arabic-telling-the-time,explainer.arabic-days-of-the-week');
  await fresh('study/arabic/lesson.arabic-digits-prices'); await wait('[data-ar-explainers="1"]', 5000);
  await ev(`document.querySelector('details[data-ar-explainer="explainer.arabic-digits-prices"]').open = true`); await sleep(300);
  const digits = await ev(`(() => { const d = document.querySelector('details[data-ar-explainer="explainer.arabic-digits-prices"]'); const cell = d?.querySelector('[data-ar-explainer-row] td'); const n = cell?.querySelector('bdi[lang="ar"]'); const word = d?.querySelector('[data-ar-explainer-step] bdi[lang="ar"]:not(.ar-digits)'); const px = e => e ? parseFloat(getComputedStyle(e).fontSize) / parseFloat(getComputedStyle(e.parentElement).fontSize) : null; return { rows: d?.querySelectorAll('[data-ar-explainer-row]').length, text: cell?.textContent, digit: n?.textContent, digitClass: n?.className, digitScale: px(n), wordClass: word?.className, wordScale: px(word) }; })()`);
  check('module 7: the digits explainer shows the eleven digits ٠ to ١٠, each label\'s Arabic digit marked as Arabic', digits.rows === 11 && digits.text === '٠ · 0' && digits.digit === '٠', digits);
  check('…and a digit on its own is drawn larger than Arabic words (Naskh draws digits small), so ٤٧ reads at the size of the text', /\bar-digits\b/.test(digits.digitClass || '') && digits.digitScale > 1.3 && !/ar-digits/.test(digits.wordClass || '') && digits.wordScale < 1.2, digits);
  await fresh('study/arabic/lesson.arabic-past-suffixes'); await wait('[data-ar-check]', 5000);
  check('a lesson without explainers shows no "How it works" section', !(await exists('[data-ar-explainers]')));

  await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 2, mobile: true });
  await go(wvHash); await wait(exSel, 5000);
  await ev(`document.querySelector('details[data-ar-explainer="explainer.arabic-walk"]').open = true`); await sleep(400);
  const narrow = await ev(`(() => { const d = document.querySelector('details[data-ar-explainer="explainer.arabic-walk"]'), th = d.querySelector('[data-ar-explainer-table] thead th'), row = d.querySelector('[data-ar-explainer-row="مَشَيْتُ"]'), cell = row && row.lastElementChild; const lab = cell && cell.querySelector('span'); return { th: th.textContent, thDisplay: getComputedStyle(th).display, rowCell: cell && cell.textContent, labShown: !!lab && getComputedStyle(lab).display !== 'none' && lab.getBoundingClientRect().height > 0, sw: document.documentElement.scrollWidth, iw: innerWidth }; })()`);
  check('at 360 px the open explainer doesn\'t scroll sideways', narrow.sw === narrow.iw, narrow);
  check('…its "Form" column is hidden, and each row\'s meaning cell shows its form instead, e.g. "past: I" for مَشَيْتُ', narrow.th === 'Form' && narrow.thDisplay === 'none' && narrow.labShown && (narrow.rowCell || '').includes('past: I'), narrow);
  await send('Emulation.clearDeviceMetricsOverride');

  const s = T.summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
