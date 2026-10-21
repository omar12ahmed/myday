// Real Arabic screens with a test-only audio manifest. Existing checked MP3s stand in for authored candidates;
// unheard clips are never approved by a test. All data and browser storage are disposable.
const fs = require('fs'), os = require('os'), path = require('path');
const { createRequire } = require('module');
const { pathToFileURL } = require('url');
const T = require('./cdp.js');
const { ev, click, exists, send, check, sleep } = T;
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const json = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const until = async fn => { for (let i = 0; i < 100; i++) { if (await fn()) return true; await sleep(50); } return false; };
const count = sel => ev(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
const button = '[data-action="ar-play"]';
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-teaching-voice-'));
  let result;
  try {
    const appRequire = createRequire(path.join(ROOT, 'app/package.json'));
    const { build } = await import(pathToFileURL(appRequire.resolve('vite')));
    const { voiceSources } = await import(pathToFileURL(path.join(ROOT, 'app/scripts/arabic-voice-sources.mjs')));
    const audio = json('app/src/study/arabic/voice-clips.json');
    const files = Object.values(audio.clips).slice(0, 3);
    const texts = [...new Set(voiceSources(pathToFileURL(ROOT + path.sep)).flatMap(s => s.texts))];
    const manifest = { ...audio, clips: Object.fromEntries(texts.map((text, i) => [text, files[i % files.length]])) };
    const fixtureDir = path.join(__dirname, 'srv/teaching-voice');
    const source = path.join(temp, 'fixture.tsx');
    const imp = file => JSON.stringify(path.join(ROOT, file));
    fs.writeFileSync(source, `
      import React, { useState } from 'react';
      import { createRoot } from 'react-dom/client';
      import { flushSync } from 'react-dom';
      import ArabicScreen from ${imp('app/src/study/arabic/ArabicScreen.tsx')};
      import ArabicQuestion from ${imp('app/src/study/arabic/ArabicQuestion.tsx')};
      import { Mixed } from ${imp('app/src/study/arabic/Ar.tsx')};
      import { useMyDay } from ${imp('app/src/data/useMyDay.ts')};
      import { freshState } from ${imp('app/src/data/normalize.ts')};
      import { boot, getSnapshot, update } from ${imp('app/src/data/storage.ts')};
      import { voiceState } from ${imp('app/src/study/arabic/voice.ts')};
      import { addCards } from ${imp('app/src/data/arabic/cards.ts')};
      import { TeachingLesson } from ${imp('app/src/study/teaching/TeachingLesson.tsx')};
      import audio from 'fixture-audio-manifest';
      const allClips = { ...audio.clips }, fetches = [];
      const realFetch = window.fetch.bind(window);
      window.fetch = (url, options) => { fetches.push(String(url)); return realFetch(url, options); };
      window.Audio = class {
        constructor() { this.src = ''; this.paused = true; this.onended = null; this.onerror = null; }
        play() { this.paused = false; return Promise.resolve(); }
        pause() { this.paused = true; }
      };
      localStorage.clear();
      localStorage.setItem('myday.data.v4', JSON.stringify(freshState())); boot();
      let root = createRoot(document.getElementById('fixture'));
      function Harness({ id }) {
        const { data } = useMyDay();
        if (id === 'generic') return <p><Mixed text="Read كِتَابٌ without a voice opt-in." /></p>;
        if (id === 'cyber') return <TeachingLesson course="cybersecurity" lessonId="lesson.cybersecurity-what-is-cybersecurity" />;
        if (id === 'revision') {
          const card = data.arabic.cards[0];
          return <ArabicQuestion data={data} at={0} card={card} r={{ day: '2026-10-21', scope: 'arabic', ids: [card.id], i: 0, results: [], phase: 'shown', typed: '', chosen: null, hint: false, support: 'own', outcome: null }} />;
        }
        return <ArabicScreen data={data} id={id} />;
      }
      window.fixture = { fetches, state: voiceState,
        show(id, unavailable = []) {
          for (const text of Object.keys(audio.clips)) delete audio.clips[text];
          Object.assign(audio.clips, allClips); unavailable.forEach(t => delete audio.clips[t]);
          flushSync(() => root.render(<Harness key={id + unavailable.join()} id={id} />));
        },
        revise() { update(d => { addCards(d, ['assessment.arabic-vowel-decoding-check.q3'], '2026-10-21'); }); this.show('revision'); },
        unmount() { flushSync(() => root.unmount()); root = createRoot(document.getElementById('fixture')); },
      };
      window.fixture.show('lesson.arabic-nominal-sentences');
    `);
    const virtual = '\0myday-teaching-test-manifest';
    await build({ configFile: false, root: path.join(ROOT, 'app'), base: './', publicDir: false, logLevel: 'warn',
      resolve: { alias: [
        { find: /^react$/, replacement: appRequire.resolve('react') },
        { find: /^react-dom\/client$/, replacement: appRequire.resolve('react-dom/client') },
        { find: /^react-dom$/, replacement: appRequire.resolve('react-dom') },
        { find: 'react/jsx-runtime', replacement: appRequire.resolve('react/jsx-runtime') },
        { find: 'react/jsx-dev-runtime', replacement: appRequire.resolve('react/jsx-dev-runtime') },
      ] }, define: { 'process.env.NODE_ENV': '"production"' },
      plugins: [{ name: 'test-only-teaching-manifest', enforce: 'pre',
        resolveId(id, importer) { if (id === 'fixture-audio-manifest' || id === './voice-clips.json' && importer?.endsWith('/study/arabic/voice.ts')) return virtual; },
        load(id) { if (id === virtual) return 'export default ' + JSON.stringify(manifest); },
      }],
      build: { outDir: fixtureDir, emptyOutDir: true, minify: false, lib: { entry: source, name: 'TeachingFixture', formats: ['es'], fileName: () => 'fixture.js' } },
    });
    fs.mkdirSync(path.join(fixtureDir, 'arabic-audio'), { recursive: true });
    for (const file of files) fs.copyFileSync(path.join(ROOT, 'content/arabic-audio/clips', file), path.join(fixtureDir, 'arabic-audio', file));
    const css = fs.readdirSync(path.join(__dirname, 'srv/app/dist/assets')).filter(file => file.endsWith('.css'));
    fs.writeFileSync(path.join(fixtureDir, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${css.map(file => `<link rel="stylesheet" href="../app/dist/assets/${file}">`).join('')}<main id="fixture" style="max-width:760px;margin:auto;padding:16px"></main><script type="module" src="fixture.js"></script></html>`);
    T.setUrl('teaching-voice/index.html'); await T.connect(); await T.openAt(2026, 10, 21);
    if (!(await until(() => exists('[data-teaching] button[aria-expanded]')))) throw new Error('Teaching fixture did not mount');
    const show = async (id, unavailable = []) => { await ev(`window.fixture.show(${JSON.stringify(id)}, ${JSON.stringify(unavailable)})`); await sleep(80); };
    const state = () => ev('window.fixture.state()');
    const saved = await ev('localStorage.getItem("myday.data.v4")');
    const teaching = '[data-teaching]';
    const practice = '[data-teaching-practice]';
    const solution = '[data-teaching-solution]';
    const reveal = teaching + ' button[aria-expanded]';
    check('opening the real lesson fetches no audio', (await ev('window.fixture.fetches')).length === 0);
    check('checked teaching explanation and worked examples have play controls', await count(teaching + ' ' + button) >= 3);
    check('Try it has no play controls and the explained answer is absent before reveal', await count(practice + ' ' + button) === 0 && !(await exists(solution)));
    check('teaching describes the synthesised voice and its teacher-review limit', (await T.text(teaching)).includes('checked by ear, not yet by a teacher'));
    await click(reveal);
    check('revealing enables Try it audio and inserts the explained-answer controls', await until(() => exists(solution + ' ' + button)) && await count(practice + ' ' + button) === 2);
    await click(practice + ' ' + button);
    check('a practice tap fetches its exact checked manifest file and starts only its player', await until(async () => (await state()).playing?.includes(':practice:')) && (await ev('window.fixture.fetches')).length === 1 && await count('[data-state="playing"]') === 1, await state());
    await click(reveal);
    check('hiding the answer removes practice controls and stops their audio', await until(async () => (await state()).playing === null) && await count(practice + ' ' + button) === 0 && !(await exists(solution)), await state());
    await click(reveal); await click(solution + ' ' + button);
    check('a revealed solution can play independently', await until(async () => (await state()).playing?.includes(':solution:')));
    await show('generic');
    check('leaving a teaching lesson stops its solution playback', await until(async () => (await state()).playing === null), await state());
    check('ordinary mixed Arabic stays text only even when its clip exists', await count(button) === 0 && (await T.text('#fixture')).includes('كِتَابٌ'));
    await show('lesson.arabic-nominal-sentences', ['الْبَيْتُ كَبِيرٌ']);
    await until(() => exists(reveal));
    check('an unchecked worked-example run keeps its Arabic but has no play control', !(await exists('[aria-label="Play الْبَيْتُ كَبِيرٌ"]')) && (await T.text(teaching)).includes('الْبَيْتُ كَبِيرٌ'));
    await show('lesson.arabic-letter-families'); await until(() => exists(reveal));
    check('letter drills receive no voice controls', await count('[data-ar-example] ' + button) === 0 && !(await exists('[aria-label="Play ب"]')));
    await show('lesson.arabic-verb-moods'); await until(() => exists(reveal)); await click(reveal);
    check('unfinished verb stems stay readable without guessed recordings after reveal', (await T.text(practice)).includes('لَنْ يَكْتُبـ') && await ev(`[...document.querySelectorAll('[aria-label^="Play "]')].every(b => !b.getAttribute('aria-label').includes('ـ'))`));

    const lesson = 'lesson.arabic-vowel-decoding', question = '[data-ar-question="assessment.arabic-vowel-decoding-check.q3"]';
    await show(lesson); await until(() => exists(question));
    check('a lesson check keeps its prompt audio hidden before the reference is shown', await count(question + ' ' + button) === 0 && !(await exists(question + ' [data-ar-answer]')));
    const heldAnswers = [];
    T.setHandler(event => { if (event.method === 'Fetch.requestPaused') heldAnswers.push(event.params.requestId); });
    await send('Fetch.enable', { patterns: [{ urlPattern: '*answers-*.js*', requestStage: 'Request' }] });
    await click(question + ' [data-action="ar-reveal"]');
    if (!(await until(() => heldAnswers.length > 0))) throw new Error('The answer chunk was not intercepted');
    check('prompt audio stays hidden while the reference answer is loading', await count(question + ' ' + button) === 0 && !(await exists(question + ' [data-ar-answer]')) && (await T.text(question)).includes('Opening…'));
    await send('Fetch.failRequest', { requestId: heldAnswers[0], errorReason: 'InternetDisconnected' });
    await send('Fetch.disable'); T.setHandler(null);
    check('a failed reference-answer download never enables prompt audio', await until(async () => (await T.text(question)).includes('couldn’t be opened')) && await count(question + ' ' + button) === 0);
    await T.openAt(2026, 10, 21); await until(() => exists(reveal));
    await show(lesson); await until(() => exists(question));
    await click(question + ' [data-action="ar-reveal"]');
    check('revealing the lesson check enables prompt and reference-answer audio', await until(() => exists(question + ' [data-ar-answer] ' + button)) && await count(question + ' > p ' + button) === 2);
    await show('generic'); await show(lesson); await until(() => exists('[data-action="ar-begin"]'));
    await click('[data-action="ar-begin"]'); await until(() => exists('[data-ar-session="open"]'));
    check('a session check also hides its prompt audio before reveal', await count(question + ' ' + button) === 0 && await exists(question + ' textarea'));
    await click(question + ' [data-action="ar-reveal"]');
    check('a session reveals prompt and answer controls together', await until(() => exists(question + ' [data-ar-answer] ' + button)) && await count(question + ' > p ' + button) === 2);
    const afterSession = await ev('localStorage.getItem("myday.data.v4")');
    await click(question + ' ' + button); await until(async () => (await state()).playing !== null);
    await show('asset.arabic-contrast-bank'); await until(() => exists('[data-ar-clip^="asset.arabic-contrast-bank:pair:"]'));
    check('seven sound pairs have two controls each while the held-back pair stays text only', await ev(`(() => { const pairs = [...document.querySelectorAll('li')]; return pairs.length === 8 && pairs.every((li, i) => li.querySelectorAll('[data-action="ar-play"]').length === (i === 4 ? 0 : 2)); })()`));
    check('the sound-pair label distinguishes synthesised examples from its original listening assignment', await exists('[data-ar-voice-label]') && (await T.text('#fixture')).includes('The course’s listening task still needs a fluent speaker’s recording.'));
    check('leaving the question stops the old question player', (await state()).playing === null);
    await show('vocabulary'); await until(() => exists('[data-ar-families]'));
    check('extra word-family forms and their notes have explicit playback', await count('[data-ar-family-also] ' + button) >= 5);
    check('family roots and affixes have no play controls', await ev(`[...document.querySelectorAll('[data-ar-families] [aria-label^="Play "]')].every(b => !/ـ|ك-ت-ب|د-ر-س/.test(b.getAttribute('aria-label')))`));
    const familyWord = 'lexeme.arabic-seed-009';
    await click('[data-ar-family-word="' + familyWord + '"]');
    await click('[data-ar-vocabulary] [data-ar-clip="' + familyWord + ':word"]');
    await until(async () => (await state()).playing === familyWord + ':word');
    await click('[data-ar-family-note] [aria-label="Close this note"]');
    check('closing a family note does not stop playback started in the vocabulary list', (await state()).playing === familyWord + ':word', await state());
    await click('[data-ar-family-word="' + familyWord + '"]');
    await click('[data-ar-family-note] [data-ar-clip="' + familyWord + ':family:word"]');
    await until(async () => (await state()).playing === familyWord + ':family:word');
    await click('[data-ar-family-note] [aria-label="Close this note"]');
    check('closing the family note stops audio started from that note', await until(async () => (await state()).playing === null), await state());
    check('browsing and playback after the intentional session edits leave saved learning data unchanged', await ev('localStorage.getItem("myday.data.v4")') === afterSession);
    await ev('window.fixture.revise()'); await until(async () => (await T.text('#fixture')).includes('Reference answer'));
    check('a revision card has no audio even when prompt and answer clips exist', await count(button) === 0 && (await T.text('#fixture')).includes('Reference answer'));

    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 1000, deviceScaleFactor: 1, mobile: true });
    for (const id of ['lesson.arabic-nominal-sentences', 'asset.arabic-contrast-bank', 'vocabulary']) {
      await show(id); await until(() => exists(button));
      if (id.startsWith('lesson.')) await click(reveal);
      check(`${id}: checked controls fit a phone with 44-pixel targets`, await ev(`document.documentElement.scrollWidth === innerWidth && [...document.querySelectorAll('${button}')].every(b => {const r=b.getBoundingClientRect();return r.width>=43.9 && r.height>=43.9})`));
      if (process.env.MYDAY_TEACHING_SCREENSHOTS) {
        await ev('document.fonts.ready');
        const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
        fs.writeFileSync(process.env.MYDAY_TEACHING_SCREENSHOTS + '-' + id + '.png', Buffer.from(capture.data, 'base64'));
      }
    }
    await send('Emulation.clearDeviceMetricsOverride');
    check('the fixture began with ordinary saved data', !!saved && JSON.parse(saved).schemaVersion === 4);
    result = T.summary(); console.log(`\n${result.pass} passed, ${result.fail} failed`);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  process.exit(result.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
