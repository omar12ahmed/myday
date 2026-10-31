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
    check('the fixture began with ordinary saved data', !!saved && JSON.parse(saved).schemaVersion === 5);
    // Round eleven: Arabic shown without marks in a check plays from MyDay's checked script, only once the answer is shown.
    const weak = 'lesson.arabic-weak-verbs', weakQ = '[data-ar-question="assessment.arabic-weak-verbs-check.q1"]';
    await show(weak); await until(() => exists(weakQ));
    check('an unmarked word in a check question has no play control before its answer is shown', !(await exists(weakQ + ' [aria-label="Play قال"]')) && (await T.text(weakQ)).includes('قال'));
    await click(weakQ + ' [data-action="ar-reveal"]');
    check('after reveal its unmarked words play from their scripts, and the label says it reads MyDay\'s vowelled copy', await until(() => exists(weakQ + ' [aria-label="Play قال"]')) && await exists(weakQ + ' [aria-label="Play قلت"]') && (await T.text(weakQ + ' [data-ar-voice-script]')).includes('it reads MyDay’s vowelled copy'));
    const impQ = '[data-ar-question="assessment.arabic-requests-imperatives-check.q1"]';
    await show('lesson.arabic-requests-imperatives'); await until(() => exists(impQ));
    await click(impQ + ' [data-action="ar-reveal"]');
    check('a piece left without a voice on purpose (لا تكتب) stays silent beside its voiced neighbours', await until(() => exists(impQ + ' [aria-label="Play لا تكتبون"]')) && !(await exists(impQ + ' [aria-label="Play لا تكتب"]')) && (await T.text(impQ)).includes('can be either'), { buttons: await ev(`[...document.querySelectorAll('[data-ar-question="assessment.arabic-requests-imperatives-check.q1"] [aria-label^="Play "]')].map(b => b.getAttribute('aria-label'))`), text: (await T.text(impQ)).slice(0, 300) });

    // Round twelve: the lesson's key ideas, objectives, task and challenge have a voice where a clip has been listened to,
    // held back while the learner checks themselves (as the explanation folds away) and back once they ask or move on.
    const names = sel => ev(`[...document.querySelectorAll(${JSON.stringify(sel + ' [data-action="ar-play"]')})].map(b => b.getAttribute('data-ar-clip'))`);
    const sq = 'lesson.arabic-simple-questions';
    await show(sq); await until(() => exists('[data-ar-key-ideas]'));
    check('a key idea with a listened-to clip has a play button named for its lesson, concept and run', JSON.stringify(await names('[data-ar-key-ideas]')) === JSON.stringify([sq + ':key:0:0']) && (await T.text('[data-ar-key-ideas] bdi[lang="ar"]')).includes('مَن ما أين هل'), await names('[data-ar-key-ideas]'));
    check('the key ideas are followed by a voice label that says unmarked Arabic reads MyDay’s vowelled copy', await ev(`(() => { const l = document.querySelector('[data-ar-key-ideas]').nextElementSibling; return !!l && l.hasAttribute('data-ar-voice-label') && !!l.querySelector('[data-ar-voice-script]'); })()`));
    const neg = 'lesson.arabic-negation-system';
    await show(neg); await until(() => exists('[data-ar-objectives]'));
    check('a lesson objective with Arabic that has a clip shows a play button for each voiced run, named by lesson, objective and run', JSON.stringify(await names('ul[data-ar-objectives]')) === JSON.stringify([neg + ':objective:0:27', neg + ':objective:0:43']), await names('ul[data-ar-objectives]'));
    check('the objectives’ Arabic sits in isolated Arabic text and a voice label follows the list', await ev(`(() => { const u = document.querySelector('ul[data-ar-objectives]'); return u.querySelectorAll('bdi[lang="ar"]').length >= 2 && u.nextElementSibling?.hasAttribute('data-ar-voice-label'); })()`));
    await click('ul[data-ar-objectives] [data-ar-clip="' + neg + ':objective:0:27"]');
    check('pressing an objective’s play button starts that clip only', await until(async () => (await state()).playing === neg + ':objective:0:27') && await count('[data-state="playing"]') === 1, await state());
    await click('ul[data-ar-objectives] [data-ar-clip="' + neg + ':objective:0:27"]');

    const wv = 'lesson.arabic-weak-verbs', wvTask = 'exercise.arabic-weak-verbs';
    await show(wv); await until(() => exists('[data-ar-task]'));
    const taskNames = [9, 22, 89, 97].map(i => wvTask + ':instruction:' + i);
    check('the practical task’s instruction has a play button for each of its four voiced runs, in order', JSON.stringify(await names('[data-ar-task]')) === JSON.stringify(taskNames), await names('[data-ar-task]'));
    const labelsInTry = await ev(`document.querySelectorAll('#ar-step-try [data-ar-task] [data-ar-voice-label], #ar-step-try [data-ar-challenge] [data-ar-voice-label], [data-ar-challenge] + [data-ar-voice-label]').length`);
    check('one voice label follows the task and challenge, not one for each block', labelsInTry === 1 && await ev(`!!document.querySelector('[data-ar-challenge] + [data-ar-voice-label]')`), labelsInTry);

    const held = async () => ({ obj: await names('ul[data-ar-objectives]'), task: await names('[data-ar-task]'), chal: await names('[data-ar-challenge]'), labels: await ev(`document.querySelectorAll('ul[data-ar-objectives] + [data-ar-voice-label], [data-ar-challenge] + [data-ar-voice-label]').length`) });
    const nothingHeld = h => h.obj.length === 0 && h.task.length === 0 && h.chal.length === 0 && h.labels === 0;
    await click('[data-action="ar-step"][data-v="check"]'); await until(() => exists('[data-ar-folded]'));
    const duringCheck = await held();
    check('while the learner checks themselves the objectives and tasks show no play buttons and no voice labels, but their text stays', nothingHeld(duringCheck) && (await T.text('ul[data-ar-objectives]')).length > 0 && (await T.text('[data-ar-task]')).includes('قال، زار') && await exists('[data-ar-task] bdi[lang="ar"]'), duringCheck);
    check('the key ideas are folded away during the check', await exists('[data-ar-folded]') && !(await exists('[data-ar-key-ideas]')));
    await click('[data-action="ar-explain-again"]'); await until(() => exists('[data-ar-key-ideas]'));
    const afterAgain = await held();
    check('"Show the explanation again" brings the task and challenge play buttons back', JSON.stringify(afterAgain.task) === JSON.stringify(taskNames) && afterAgain.labels === 1, afterAgain);
    await click('[data-action="ar-step"][data-v="try"]'); await until(async () => (await names('[data-ar-task]')).length > 0);
    check('moving to the Try step brings the task buttons and the voice label back', JSON.stringify(await names('[data-ar-task]')) === JSON.stringify(taskNames) && await exists('[data-ar-challenge] + [data-ar-voice-label]') && await exists('[data-ar-key-ideas]'), await held());
    await show(neg); await until(() => exists('[data-ar-objectives]'));
    await click('[data-action="ar-step"][data-v="check"]'); await until(() => exists('[data-ar-folded]'));
    check('the held objectives lose their play buttons and label but keep their Arabic', (await names('ul[data-ar-objectives]')).length === 0 && !(await exists('ul[data-ar-objectives] + [data-ar-voice-label]')) && (await T.text('ul[data-ar-objectives]')).includes('لا ما لم لن'));
    await click('[data-action="ar-step"][data-v="try"]'); await until(async () => (await names('ul[data-ar-objectives]')).length > 0);
    check('moving to Try brings the objectives’ play buttons and label back', (await names('ul[data-ar-objectives]')).length === 2 && await exists('ul[data-ar-objectives] + [data-ar-voice-label]'));

    // The timetable's text view: every Arabic cell plays, the time column does not.
    const ttId = 'asset.arabic-timetable', ttRows = json('content/arabic-fusha/MyDay_Arabic_Starter_Materials.json').assets.find(a => a.id === ttId).rows;
    await show(ttId); await until(() => exists('[data-ar-clip^="' + ttId + ':row:"]'));
    const ttWant = ttRows.flatMap((r, i) => ['day', 'activity', 'place'].map(k => `${ttId}:row:${i}:${k}`));
    check('the timetable has a play button in each of its 15 Arabic cells (five rows of day, activity and place), named by row and column', ttRows.length === 5 && JSON.stringify(await names('table')) === JSON.stringify(ttWant), await names('table'));
    check('the time column has no play buttons', await ev(`[...document.querySelectorAll('table tbody tr')].every(tr => tr.children[1].querySelectorAll('button').length === 0 && tr.children[1].textContent.trim().length > 0)`));
    check('the timetable shows the voice label and not "No recording included"', await exists('[data-ar-voice-label]') && !(await T.text('#fixture')).includes('No recording included'));
    await click('[data-ar-clip="' + ttId + ':row:1:activity"]');
    check('pressing a timetable cell’s play button starts that cell’s clip and no other', await until(async () => (await state()).playing === ttId + ':row:1:activity') && await count('[data-state="playing"]') === 1, await state());
    await click('[data-ar-clip="' + ttId + ':row:1:activity"]');
    result = T.summary(); console.log(`\n${result.pass} passed, ${result.fail} failed`);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  process.exit(result.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
