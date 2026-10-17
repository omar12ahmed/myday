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
  const s = T.summary(); console.log(`\n${s.pass} passed, ${s.fail} failed`); process.exit(s.fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
