// Pronunciation support in the real app: persisted preference, reading direction, recall boundaries,
// vowel-mark independence and a phone layout. Uses only the harness's disposable browser profile.
const T = require('./cdp.js');
const { ev, check, click, exists, sleep, send } = T;
const toggle = '[data-action="ar-transliteration"]';
const count = sel => ev(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
const go = async (hash, day = 17) => { T.setUrl('app/dist/index.html#' + hash); await T.openAt(2026, 10, day, 12); };
const wait = async sel => { for (let i = 0; i < 60; i++) { if (await exists(sel)) return true; await sleep(100); } return false; };
(async () => {
  await T.connect(); await go('study'); await ev('localStorage.clear()'); await go('study'); await wait('.arabic-entry');
  const saved = await ev('localStorage.getItem("myday.data.v4")');
  await go('study/arabic/lesson.arabic-nominal-sentences'); await wait('[data-teaching]');
  check('transliteration is shown by default with an accessible toggle', await ev(`document.querySelector('${toggle}').getAttribute('aria-pressed') === 'true'`));
  check('lesson teaching includes readable Latin alongside Arabic', await ev(`[...document.querySelectorAll('[data-teaching] [data-ar-transliteration]')].some(e => e.textContent.includes('al-baytu kabīrun'))`));
  check('Latin and Arabic retain their own language and direction', await ev(`document.querySelector('[data-ar-example] [lang="ar"]').dir === 'rtl' && [...document.querySelectorAll('[data-ar-transliteration]')].every(e => e.dir === 'ltr' && e.lang === 'ar-Latn')`));
  check('neither kind of answer is inserted before reveal', !(await exists('[data-teaching-solution]')) && !(await exists('[data-ar-answer]')));
  await click('[data-teaching] button'); await wait('[data-teaching-solution]');
  check('revealed teaching answers get their own pronunciation support', await exists('[data-teaching-solution] [data-ar-transliteration]') && !(await exists('[data-ar-answer]')));
  await click(toggle); await sleep(80);
  check('hiding removes every Latin aid but preserves the Arabic', await count('[data-ar-transliteration]') === 0 && await exists('[data-ar-example] [lang="ar"]'));
  check('the preference is stored separately from learning progress', await ev('localStorage.getItem("myday.arabic.transliteration")') === 'hidden' && await ev('localStorage.getItem("myday.data.v4")') === saved);
  await go('study/arabic/vocabulary'); await wait('[data-ar-vocabulary]');
  check('hidden preference survives a reload and navigation', await count('[data-ar-transliteration]') === 0 && await ev(`document.querySelector('${toggle}').getAttribute('aria-pressed') === 'false'`));
  await click(toggle); await sleep(80);
  check('all 48 starter words and their example sentences have readings', await count('[data-ar-vocabulary] [data-ar-transliteration]') === 96);
  check('the first word separates Arabic, pronunciation and English meaning', await ev(`(() => {const w = document.querySelector('[data-ar-word]'); return w.querySelector('[lang="ar"]').textContent === 'أَنَا' && w.querySelector('[data-ar-transliteration]').textContent === 'anā' && w.textContent.includes('I · pronoun');})()`));
  await go('study/arabic/asset.arabic-profile'); await wait('[data-ar-reading]');
  const reading = await T.text('[data-ar-reading] [data-ar-transliteration]');
  check('the full text has a prepared reading', reading.startsWith('anā laylā. anā ṭālibatun.') && !reading.includes('['));
  await click('[data-action="ar-no-vowels"]'); await sleep(80);
  check('the vowel toggle changes only Arabic spelling, not the prepared reading', await ev(`![...document.querySelectorAll('[data-ar-reading] [lang="ar"]')].some(e => /[ً-ْ]/.test(e.textContent))`) && await T.text('[data-ar-reading] [data-ar-transliteration]') === reading);
  await click(toggle); await sleep(80);
  check('vowel marks and transliteration can both be hidden independently', await count('[data-ar-reading] [data-ar-transliteration]') === 0 && await exists('[data-ar-reading] [lang="ar"]'));
  await click(toggle); await go('study/arabic/asset.arabic-introduction-dialogue'); await wait('[data-ar-reading]');
  check('dialogue lines keep one Latin line per Arabic line', await count('[data-ar-reading] [lang="ar"]') === 6 && await count('[data-ar-reading] [data-ar-transliteration]') === 6);
  await go('study/arabic/asset.arabic-study-method'); await wait('[data-ar-reading]');
  check('an unvowelled extended text uses a prepared complete reading', await ev(`(() => {const r = document.querySelector('[data-ar-reading] [data-ar-transliteration]').textContent; return r.length > 300 && !/[ء-ي\[\]]/.test(r);})()`));
  await click('[data-ar-pronunciation-key] summary'); await sleep(80);
  check('the guide explains long vowels, difficult sounds and incomplete readings', await ev(`(() => {const e = document.querySelector('[data-ar-pronunciation-key]'); return e.open && ['ā · ī · ū','ḥ · ʿ · ʾ','Brackets'].every(t => e.textContent.includes(t));})()`));
  check('the guide links to a real alphabet listening lesson', await ev(`document.querySelector('[data-ar-pronunciation-key] a').href === 'https://madinaharabic.com/free-content/reading/lesson-1/part-1'`));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  let fits = await ev('document.documentElement.scrollWidth === innerWidth');
  for (const hash of ['study/arabic/vocabulary', 'study/arabic/lesson.arabic-nominal-sentences', 'study/arabic/asset.arabic-timetable']) {
    await go(hash); await wait(toggle); await sleep(200); fits &&= await ev('document.documentElement.scrollWidth === innerWidth');
  }
  check('expanded guide, vocabulary, lesson and timetable fit a phone', fits);
  check('the show/hide button has a usable touch target', await ev(`document.querySelector('${toggle}').getBoundingClientRect().height >= 44`));
  await send('Emulation.clearDeviceMetricsOverride');
  await go('study/arabic/texts'); await wait('[data-ar-text]');
  check('text previews stay compact; full readings are on the text page', !(await exists('[data-ar-text] [data-ar-transliteration]')));
  await go('study/cybersecurity/lesson.ip-addressing'); await wait('[data-teaching]');
  check('pronunciation controls are limited to Arabic', !(await exists(toggle)) && !(await exists('[data-ar-transliteration]')));
  check('browsing, toggling and revealing did not alter learning data', await ev('localStorage.getItem("myday.data.v4")') === saved);

  // A browser can reject storage (privacy settings or quota). The toggle must still work for the visit.
  const blocked = await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { for (const method of ['getItem','setItem']) { const original = Storage.prototype[method]; Storage.prototype[method] = function(key, ...args) { if (key === 'myday.arabic.transliteration') throw new DOMException('Blocked', 'SecurityError'); return original.call(this, key, ...args); }; } })();` });
  await go('study/arabic/vocabulary'); await wait('[data-ar-vocabulary]');
  check('blocked preference storage still opens with pronunciation enabled', await count('[data-ar-vocabulary] [data-ar-transliteration]') === 96);
  await click(toggle); await sleep(80);
  check('the toggle still works when storage rejects a write', await count('[data-ar-transliteration]') === 0);
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: blocked.identifier });

  // Add one recognition card and its writing card via the real UI, then revise on the next day.
  await go('study/arabic/vocabulary'); await wait('[data-ar-word]');
  await click('[data-ar-word] [data-action="ar-word-add"]'); await sleep(120);
  await click('[data-ar-word] [data-action="ar-word-write"]'); await sleep(120);
  await go('study/arabic', 18); await wait('[data-action="ar-revise"]'); await click('[data-action="ar-revise"]'); await wait('.st-q');
  check('recognition revision shows the reading without revealing the meaning', await exists('.st-prompt [data-ar-transliteration]') && !(await exists('.st-answer')));
  await click('[data-action="s-rev-show"]'); await wait('.st-answer');
  check('a revealed recognition answer adds pronunciation to its example', await exists('.st-answer [data-ar-transliteration]'));
  await click('[data-action="s-rev-self"][data-v="right"]'); await sleep(100); await click('[data-action="s-rev-rate"][data-v="good"]'); await sleep(200);
  check('writing from memory gives no Arabic or transliteration answer away', (await T.text('.st-path')) === 'Arabic · write it from memory' && !(await exists('.st-q [lang="ar"]')) && !(await exists('.st-q [data-ar-transliteration]')) && !(await exists('.st-answer')));
  await click('[data-action="s-rev-show"]'); await wait('.st-answer');
  check('revealing the writing answer displays both Arabic and pronunciation', await exists('.st-answer [lang="ar"]') && (await T.text('.st-answer [data-ar-transliteration]')).includes('anā'));
  // Word families on the vocabulary page (1.38.0).
  await go('study/arabic/vocabulary', 19); await wait('[data-ar-families]');
  if (await ev(`document.querySelector('${toggle}').getAttribute('aria-pressed')`) !== 'true') { await click(toggle); await sleep(80); }
  const famSaved = await ev('localStorage.getItem("myday.data.v4")');
  const fword = id => `[data-ar-family-word="${id}"]`;
  check('the families card shows 4 families and 12 family words', await count('[data-ar-families] [data-ar-family]') === 4 && await count('[data-ar-families] [data-ar-family-word]') === 12);
  check('the card lists 14 words whose relatives are not here and 22 small words', await count('[data-s=ar-alone-relatives] li') === 14 && await count('[data-s=ar-alone-small] li') === 22);
  await click(fword('lexeme.arabic-seed-009')); await wait('[data-ar-family-note]');
  const noteOf = id => ev(`(() => { const n = document.querySelector('[data-ar-family-note="${id}"]'); return n ? n.textContent : null; })()`);
  const note9 = await noteOf('lexeme.arabic-seed-009');
  check('tapping a family word opens its note with the Arabic, the reading and the meaning', !!note9 && note9.includes('كِتَاب') && note9.includes('kitāb') && note9.includes('book') && await ev(`(() => { const n = document.querySelector('[data-ar-family-note]'); return n.querySelector('[lang="ar"]').textContent === 'كِتَاب' && !!n.querySelector('[data-ar-transliteration]'); })()`));
  check('the tapped word is marked pressed and only one note is open', await ev(`document.querySelector('${fword('lexeme.arabic-seed-009')}').getAttribute('aria-pressed') === 'true'`) && await count('[data-ar-family-note]') === 1);
  await click(fword('lexeme.arabic-seed-009')); await sleep(100);
  check('tapping the same word again closes its note and clears the pressed state', await count('[data-ar-family-note]') === 0 && await ev(`document.querySelector('${fword('lexeme.arabic-seed-009')}').getAttribute('aria-pressed') === 'false'`));
  await click(fword('lexeme.arabic-seed-038')); await wait('[data-ar-family-note]');
  check('another family\'s word opens its own note', await exists('[data-ar-family-note="lexeme.arabic-seed-038"]'));
  await click('[data-ar-family-note] button[aria-label="Close this note"]'); await sleep(100);
  check('the close button closes the note', await count('[data-ar-family-note]') === 0 && await ev(`document.querySelector('${fword('lexeme.arabic-seed-038')}').getAttribute('aria-pressed') === 'false'`));
  await click(fword('lexeme.arabic-seed-012')); await wait('[data-ar-family-note]'); await click('[data-action=ar-family-show]'); await sleep(200);
  check('"Show it in the list" focuses that word in the vocabulary list', await ev(`document.activeElement === document.querySelector('[data-ar-vocabulary] [data-ar-word="lexeme.arabic-seed-012"]')`));
  check('12 list words have a family badge naming their family and the other 36 have none', await count('[data-ar-vocabulary] [data-ar-family-badge]') === 12 && await ev(`(() => { const fam = {ktb: ['009','010','036','037','012'], drs: ['038','039','011'], qra: ['034','035'], tlb: ['013','014']}; return Object.entries(fam).every(([f, ids]) => ids.every(i => { const li = document.querySelector('[data-ar-word="lexeme.arabic-seed-' + i + '"]'); const b = li.querySelector('[data-ar-family-badge]'); return b && b.getAttribute('data-ar-family-badge') === f; })) && [...document.querySelectorAll('[data-ar-word]')].filter(li => !li.querySelector('[data-ar-family-badge]')).length === 36; })()`));
  check('the root in the ك-ت-ب card shows its reading while readings are on', await ev(`(() => { const c = document.querySelector('[data-ar-family="ktb"]'); return c.textContent.includes('(k-t-b)') && c.querySelector('bdi[lang="ar"]').textContent === 'ك-ت-ب'; })()`));
  check('looking, tapping, closing and "Show it in the list" left the saved data byte-identical', await ev('localStorage.getItem("myday.data.v4")') === famSaved);
  await click(toggle); await sleep(80);
  check('with transliteration hidden no reading is left in the families card, but its Arabic remains', await count('[data-ar-families] [data-ar-transliteration]') === 0 && !(await ev(`document.querySelector('[data-ar-families]').textContent.includes('(k-t-b)')`)) && await count('[data-ar-families] [lang="ar"]') > 30 && await ev(`document.querySelector('[data-ar-family="ktb"] bdi[lang="ar"]').textContent === 'ك-ت-ب'`));
  await click(toggle); await sleep(80);
  const wordHas = () => ev(`document.querySelector('[data-ar-word="lexeme.arabic-seed-010"]').getAttribute('data-in')`);
  await click('[data-ar-word="lexeme.arabic-seed-010"] [data-action="ar-word-add"]'); await sleep(150);
  check('beside the families card, a list word can still be added to revision', await wordHas() === 'yes' && await exists('[data-ar-word="lexeme.arabic-seed-010"] [data-action="ar-word-remove"]') && await exists('[data-ar-families]'));
  await click('[data-ar-word="lexeme.arabic-seed-010"] [data-action="ar-word-remove"]'); await sleep(200); await click('[data-action="dialog-confirm"]'); await sleep(250);
  check('and the same word can be taken out of revision again', await wordHas() === 'no' && await exists('[data-ar-word="lexeme.arabic-seed-010"] [data-action="ar-word-add"]'));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await go('study/arabic/vocabulary', 19); await wait('[data-ar-families]'); await sleep(200);
  check('at 390 px the vocabulary page does not scroll sideways', await ev('document.documentElement.scrollWidth === innerWidth'));
  check('at 390 px every family word button is at least 44 px tall', await ev(`(() => { const b = [...document.querySelectorAll('[data-ar-family-word]')]; return b.length === 12 && b.every(x => x.getBoundingClientRect().height >= 44); })()`));
  await click(fword('lexeme.arabic-seed-036')); await wait('[data-ar-family-note]'); await sleep(100);
  check('at 390 px an open note still fits and its close and show buttons are at least 44 px', await ev(`document.documentElement.scrollWidth === innerWidth && [...document.querySelectorAll('[data-ar-family-note] button')].every(x => x.getBoundingClientRect().height >= 44)`));
  await send('Emulation.clearDeviceMetricsOverride');
  // The starter words' synthesised voice (1.39.0). Real taps are used (el.click() gives no user activation, and a browser needs one to play sound).
  const fs = require('fs'), path = require('path');
  const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
  const clipFiles = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/study/arabic/voice-clips.json'), 'utf8')).clips; // exact Arabic text -> file
  const course = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/arabic-fusha/MyDay_Arabic_Fusha_Curriculum.json'), 'utf8'));
  const seedText = (id, part) => course.lexicon_seed.find(w => w.id === id)[part === 'word' ? 'form_ar' : 'example_ar'];
  const clipOf = (id, part) => clipFiles[seedText(id, part)];
  const served = path.join(__dirname, 'srv', 'app', 'dist');
  const clipSel = (id, part) => `[data-ar-clip="${id}:${part}"]`;
  const state = (id, part) => ev(`(document.querySelector('${clipSel(id, part)}') || {getAttribute: () => 'missing'}).getAttribute('data-state')`);
  const states = () => ev(`[...document.querySelectorAll('[data-ar-clip]')].filter(b => b.getAttribute('data-state') !== 'idle').map(b => b.getAttribute('data-ar-clip'))`);
  const clipFetches = () => ev(`performance.getEntriesByType('resource').map(r => r.name).filter(n => n.includes('arabic-audio/'))`);
  const realTap = async sel => {
    await ev(`document.querySelector(${JSON.stringify(sel)}).scrollIntoView({block: 'center'})`); await sleep(120);
    const r = await ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {x: b.x + b.width / 2, y: b.y + b.height / 2}; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 });
  };
  const until = async (fn, tries = 80) => { for (let i = 0; i < tries; i++) { if (await fn()) return true; await sleep(100); } return false; };

  await go('study/arabic/vocabulary', 19); await wait('[data-ar-vocabulary]'); await sleep(300);
  const voiceSaved = await ev('localStorage.getItem("myday.data.v4")');
  const names = await ev(`(() => { const out = {buttons: [...document.querySelectorAll('[data-ar-vocabulary] [data-action="ar-play"]')], bad: [], small: 0}; for (const b of out.buttons) { const r = b.getBoundingClientRect(); if (Math.round(r.width) !== 44 || Math.round(r.height) !== 44) out.small++; const li = b.closest('[data-ar-word]'); const ar = li.querySelector('[lang="ar"]').textContent; const want = b.getAttribute('data-ar-clip').endsWith(':word') ? 'Play ' + ar : 'Play the example for ' + ar; if (b.getAttribute('aria-label') !== want) out.bad.push([b.getAttribute('data-ar-clip'), b.getAttribute('aria-label'), want]); } return {n: out.buttons.length, small: out.small, bad: out.bad.slice(0, 3)}; })()`);
  check('the vocabulary page has 96 play buttons, every one 44 by 44 px', names.n === 96 && names.small === 0, names);
  check('a word\'s play button is named "Play" and its Arabic, and an example\'s "Play the example for" and the word\'s Arabic', names.bad.length === 0 && await ev(`document.querySelector('${clipSel('lexeme.arabic-seed-009', 'word')}').getAttribute('aria-label') === 'Play كِتَاب'`) && await ev(`document.querySelector('${clipSel('lexeme.arabic-seed-009', 'example')}').getAttribute('aria-label') === 'Play the example for كِتَاب'`), names.bad);
  check('opening the page fetches no clip and every play button is idle', (await clipFetches()).length === 0 && await ev(`[...document.querySelectorAll('[data-ar-clip]')].every(b => b.getAttribute('data-state') === 'idle')`), await clipFetches());
  const voiceNote = await T.text('[data-ar-voice]');
  check('the voice note says the voice is synthesised, a model to copy, checked by ear and not yet by a teacher', voiceNote.includes('Synthesised voice — a model to copy; checked by ear, not yet by a teacher.'), voiceNote);
  check('the voice note says listening and speaking stay untested, and the old "Without recordings" sentence is gone', voiceNote.includes('listening and speaking stay untested') && !(await ev(`document.body.textContent.includes('Without recordings')`)), voiceNote);

  await ev(`window.__seen = []; new MutationObserver(ms => ms.forEach(m => { if (m.target.getAttribute('data-ar-clip') === 'lexeme.arabic-seed-009:word') window.__seen.push(m.target.getAttribute('data-state')); })).observe(document.querySelector('[data-ar-vocabulary]'), {subtree: true, attributes: true, attributeFilter: ['data-state']})`);
  await realTap(clipSel('lexeme.arabic-seed-009', 'word'));
  const reachedPlaying = await until(async () => (await ev('window.__seen')).includes('playing'));
  const returnedIdle = await until(async () => (await state('lexeme.arabic-seed-009', 'word')) === 'idle', 150);
  const fetched = await clipFetches();
  check('tapping a word plays its clip and goes back to idle when it ends', reachedPlaying && returnedIdle, await ev('window.__seen'));
  check('exactly one clip was fetched, and it was that word\'s file', fetched.length === 1 && fetched[0].endsWith('arabic-audio/' + clipOf('lexeme.arabic-seed-009', 'word')), fetched);

  await realTap(clipSel('lexeme.arabic-seed-009', 'example')); await until(async () => (await state('lexeme.arabic-seed-009', 'example')) !== 'idle');
  // A long clip (045's example, about 3 s), so the stop below can't be the clip simply ending.
  await realTap(clipSel('lexeme.arabic-seed-045', 'example')); await until(async () => (await state('lexeme.arabic-seed-045', 'example')) === 'playing');
  const now = await states();
  check('only one clip plays at a time: starting another leaves only that one not idle', now.length === 1 && now[0] === 'lexeme.arabic-seed-045:example', now);
  await realTap(clipSel('lexeme.arabic-seed-045', 'example')); await until(async () => (await states()).length === 0, 3);
  check('tapping the playing clip again stops it at once (well before its 3 s end)', (await states()).length === 0, await states());

  const slower = '[data-action="ar-slower"]';
  check('Slower is off by default', await ev(`document.querySelector('${slower}').getAttribute('role') === 'switch' && document.querySelector('${slower}').getAttribute('aria-checked') === 'false'`));
  await click(slower); await sleep(120);
  check('turning Slower on switches it on, remembers it on this device and leaves the learning data alone', await ev(`document.querySelector('${slower}').getAttribute('aria-checked')`) === 'true' && await ev('localStorage.getItem("myday.arabic.slower")') === 'yes' && await ev('localStorage.getItem("myday.data.v4")') === voiceSaved);
  await go('study/arabic/vocabulary', 19); await wait(slower);
  check('Slower is still on after reloading the page', await ev(`document.querySelector('${slower}').getAttribute('aria-checked')`) === 'true');

  await wait('[data-ar-families]');
  await click(fword('lexeme.arabic-seed-012')); await wait('[data-ar-family-note]');
  check('a family word\'s note has a play button named "Play" and the word\'s Arabic', await ev(`(() => { const b = document.querySelector('[data-ar-family-note] ${clipSel('lexeme.arabic-seed-012', 'word')}'); return !!b && b.getAttribute('aria-label') === 'Play مَكْتَبَة'; })()`));

  const gone = clipOf('lexeme.arabic-seed-020', 'word');
  fs.rmSync(path.join(served, 'arabic-audio', gone));
  await realTap(clipSel('lexeme.arabic-seed-020', 'word'));
  const failed = await until(async () => (await state('lexeme.arabic-seed-020', 'word')) === 'failed');
  check('a clip that cannot be fetched shows the failed state and says it needs a connection the first time', failed && await ev(`document.querySelector('${clipSel('lexeme.arabic-seed-020', 'word')}').parentElement.textContent.includes('Couldn’t play it. The first time, it needs a connection.')`));

  // A lesson's headline example (round two): a play button and the voice label, only when that text has a shipped clip.
  const withClip = course.lessons.find(l => l.example && clipFiles[l.example.text_ar]);
  const noClip = course.lessons.find(l => l.id === 'lesson.arabic-letter-families');
  const lessonBtn = `[data-ar-example] [data-ar-clip="${withClip.id}:example"]`;
  await go('study/arabic/' + withClip.id); await wait('[data-ar-example]'); await sleep(300);
  check('a lesson whose example has a shipped clip shows a 44 by 44 play button named "Play the lesson\u2019s example"', await ev(`(() => { const b = document.querySelector('${lessonBtn}'); if (!b) return false; const r = b.getBoundingClientRect(); return Math.round(r.width) === 44 && Math.round(r.height) === 44 && b.getAttribute('aria-label') === 'Play the lesson\u2019s example'; })()`), withClip.id);
  const lessonLabel = await T.text('[data-ar-example] [data-ar-voice-label]').catch(() => '');
  check('…and the voice label sits under it, with where to find Slower playback', lessonLabel.includes('Synthesised voice — a model to copy; checked by ear, not yet by a teacher.') && lessonLabel.includes('Slower playback: Study → Arabic → Vocabulary.') && await exists('[data-ar-voice-label]'), lessonLabel);
  const lessonFetchesBefore = (await clipFetches()).length;
  await realTap(lessonBtn);
  const lessonPlaying = await until(async () => (await ev(`document.querySelector('${lessonBtn}').getAttribute('data-state')`)) === 'playing');
  const lessonIdle = await until(async () => (await ev(`document.querySelector('${lessonBtn}').getAttribute('data-state')`)) === 'idle', 150);
  const lessonFetched = (await clipFetches()).filter(n => n.endsWith('arabic-audio/' + clipFiles[withClip.example.text_ar]));
  check('tapping the lesson example plays it, goes back to idle, and fetched that text\u2019s file', lessonPlaying && lessonIdle && lessonFetched.length === 1 && (await clipFetches()).length === lessonFetchesBefore + 1, { lessonPlaying, lessonIdle, lessonFetched });
  await go('study/arabic/' + noClip.id); await wait('[data-ar-example]'); await sleep(300);
  check('a lesson whose example is a letter drill (no shipped clip) has no play button and no voice label', !clipFiles[noClip.example.text_ar] && !(await exists('[data-ar-example] [data-ar-clip]')) && !(await exists('[data-ar-voice-label]')));

  await go('study/arabic'); await wait('.arabic-entry');
  check('the learning map says the starter words and each lesson\u2019s example have a synthesised voice to copy, and the reading texts and the rest of each lesson have no recordings yet', (await ev('document.body.textContent')).includes('The starter words (in Vocabulary) and each lesson\u2019s example have a synthesised voice to copy; the reading texts and the rest of each lesson have no recordings yet.'));
  const swText = fs.readFileSync(path.join(served, 'sw.js'), 'utf8');
  const listIn = name => { const m = swText.match(new RegExp('const ' + name + ' = (\\[[^\\]]*\\])')); return m ? JSON.parse(m[1]) : null; };
  const audioList = listIn('AUDIO'), filesList = listIn('FILES');
  const shippedFiles = new Set(Object.values(clipFiles));
  check('the built service worker lists every shipped clip under AUDIO and none of them under FILES', !!audioList && !!filesList && shippedFiles.size > 0 && audioList.length === shippedFiles.size && audioList.every(f => shippedFiles.has(f.split('/').pop())) && audioList.every(f => f.includes('arabic-audio/')) && !filesList.some(f => f.includes('arabic-audio/')), { audio: audioList && audioList.length, inFiles: filesList && filesList.filter(f => f.includes('arabic-audio/')).length });
  const s = T.summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
