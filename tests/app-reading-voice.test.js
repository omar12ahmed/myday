// A browser fixture for the real ReadingVoice component and player. Only the generated audio manifest is replaced:
// a fully available, partly available or unavailable reading uses existing checked MP3s in a throwaway test folder.
// No unheard recording is approved or shipped by these tests, and no real saved data or external service is used.
const fs = require('fs'), os = require('os'), path = require('path');
const { createRequire } = require('module');
const { pathToFileURL } = require('url');
const T = require('./cdp.js');
const { ev, click, exists, send, check, sleep } = T;
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const json = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const until = async (fn, tries = 80) => { for (let i = 0; i < tries; i++) { if (await fn()) return true; await sleep(50); } return false; };
const whole = '[data-action="ar-read-all"]', sentence = '[data-action="ar-read-sentence"]';
const count = sel => ev(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
const spaces = text => text.replace(/\s+/g, ' ').trim();
const shownText = async () => spaces((await ev(`[...document.querySelectorAll('[data-ar-reading] [lang="ar"]')].map(p => p.textContent)`)).join('\n'));
const shownReadings = async () => (await ev(`[...document.querySelectorAll('[data-ar-transliteration]')].map(p => p.textContent)`)).join('\n');

(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-reading-voice-'));
  let result;
  try {
    const appRequire = createRequire(path.join(ROOT, 'app/package.json'));
    const { build } = await import(pathToFileURL(appRequire.resolve('vite')));
    const audio = json('app/src/study/arabic/voice-clips.json');
    const originals = json('content/arabic-fusha/MyDay_Arabic_Starter_Materials.json').assets.filter(a => a.type === 'original_text');
    const prepared = json('content/teaching/pronunciation/passages.json');
    const audit = json('content/arabic-audio/audio-audit.json');
    const checkedFiles = Object.values(audit.clips).filter(c => c.check === 'checked').slice(0, 3).map(c => c.file);
    if (checkedFiles.length !== 3) throw new Error('The fixture needs three existing checked clips');
    const spoken = [...new Set(Object.values(audio.readings).flat().map(p => p.spoken))];
    const fixtureClips = Object.fromEntries(spoken.map((text, i) => [text, checkedFiles[i % checkedFiles.length]]));
    // One text (the notice) also has a whole clip, read in one go (round ten); the others play their sentences in turn.
    fixtureClips[audio.wholes['asset.arabic-notice']] = checkedFiles[1];
    const manifest = { ...audio, clips: fixtureClips };
    const fixtureDir = path.join(__dirname, 'srv', 'reading-voice');
    const source = path.join(temp, 'reading-fixture.tsx');
    const importPath = relative => JSON.stringify(path.join(ROOT, relative));
    fs.writeFileSync(source, `
      import { useState } from ${JSON.stringify(appRequire.resolve('react'))};
      import { createRoot } from ${JSON.stringify(appRequire.resolve('react-dom/client'))};
      import { flushSync } from ${JSON.stringify(appRequire.resolve('react-dom'))};
      import { ReadingVoice } from ${importPath('app/src/study/arabic/ReadingVoice.tsx')};
      import { Pronunciation } from ${importPath('app/src/study/arabic/Pronunciation.tsx')};
      import { voiceState, stopVoiceFor } from ${importPath('app/src/study/arabic/voice.ts')};
      import audio from 'fixture-audio-manifest';
      const assets = ${JSON.stringify(originals)};
      const prepared = ${JSON.stringify(prepared)};
      const allClips = { ...audio.clips };
      const fetches = [], players = [];
      const realFetch = window.fetch.bind(window);
      window.fetch = (url, options) => { fetches.push(String(url)); return realFetch(url, options); };
      const NativeAudio = window.Audio;
      window.Audio = new URLSearchParams(location.search).has('native') ? function(...args) {
        const player = new NativeAudio(...args); players.push(player); return player;
      } : class {
        constructor() { this.src = ''; this.paused = true; this.onended = null; this.onerror = null; players.push(this); }
        play() { this.paused = false; return Promise.resolve(); }
        pause() { this.paused = true; }
      };
      localStorage.setItem('myday.arabic.transliteration', 'shown');
      localStorage.setItem('myday.data.v4', '{"madeUpLearning":"unchanged"}');
      let root = createRoot(document.getElementById('fixture'));
      function Harness({ id }) {
        const [vowels, setVowels] = useState(true);
        const asset = assets.find(a => a.id === id);
        return <Pronunciation>
          <button className="min-h-11 px-4 mb-3" data-fixture-vowels="" aria-pressed={vowels} onClick={() => setVowels(value => !value)}>{vowels ? 'Hide vowel marks' : 'Show vowel marks'}</button>
          <ReadingVoice id={id} full={asset.text_ar} plain={asset.text_unvowelled || null} vowels={vowels} prepared={prepared[id].latin} />
        </Pronunciation>;
      }
      window.fixture = {
        fetches, state: voiceState,
        audioStatus() { return players.map(player => ({ currentTime: player.currentTime, paused: player.paused, ended: player.ended, readyState: player.readyState })); },
        show(id, availability = 'all') {
          stopVoiceFor(id + ':reading');
          for (const text of Object.keys(audio.clips)) delete audio.clips[text];
          if (availability !== 'none' && availability !== 'whole') Object.assign(audio.clips, allClips);
          if (availability === 'partial') delete audio.clips[audio.readings[id][0].spoken];
          if (availability === 'whole') for (const key of Object.values(audio.wholes)) if (allClips[key]) audio.clips[key] = allClips[key];
          flushSync(() => root.render(<Harness key={id + ':' + availability} id={id} />));
        },
        end() { const player = players[players.length - 1]; if (!player?.onended) throw new Error('No playing fixture clip'); player.onended(); },
        unmount() { flushSync(() => root.unmount()); root = createRoot(document.getElementById('fixture')); },
      };
      window.fixture.show('asset.arabic-profile');
    `);
    const virtualManifest = '\0myday-test-audio-manifest';
    await build({
      configFile: false, root: path.join(ROOT, 'app'), publicDir: false, logLevel: 'warn',
      resolve: { alias: [
        { find: /^react$/, replacement: appRequire.resolve('react') },
        { find: 'react/jsx-runtime', replacement: appRequire.resolve('react/jsx-runtime') },
        { find: 'react/jsx-dev-runtime', replacement: appRequire.resolve('react/jsx-dev-runtime') },
      ] },
      define: { 'process.env.NODE_ENV': '"production"' },
      plugins: [{
        name: 'test-only-reading-audio-manifest', enforce: 'pre',
        resolveId(id, importer) {
          if (id === 'fixture-audio-manifest' || id === './voice-clips.json' && importer?.endsWith('/study/arabic/voice.ts')) return virtualManifest;
        },
        load(id) { if (id === virtualManifest) return 'export default ' + JSON.stringify(manifest); },
      }],
      build: { outDir: fixtureDir, emptyOutDir: true, minify: false, lib: { entry: source, name: 'ReadingFixture', formats: ['iife'], fileName: () => 'fixture.js' } },
    });
    fs.mkdirSync(path.join(fixtureDir, 'arabic-audio'), { recursive: true });
    for (const file of checkedFiles) fs.copyFileSync(path.join(ROOT, 'content/arabic-audio/clips', file), path.join(fixtureDir, 'arabic-audio', file));
    const css = fs.readdirSync(path.join(__dirname, 'srv/app/dist/assets')).filter(file => file.endsWith('.css'));
    if (!css.length) throw new Error('The fixture needs the app CSS built by tests/run.sh');
    fs.writeFileSync(path.join(fixtureDir, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${css.map(file => `<link rel="stylesheet" href="../app/dist/assets/${file}">`).join('')}<title>Reading voice fixture</title><main id="fixture" style="max-width:640px;margin:auto;padding:16px"></main><script src="fixture.js"></script></html>`);
    T.setUrl('reading-voice/index.html'); await T.connect(); await T.openAt(2026, 10, 21);
    if (!(await until(() => exists('[data-ar-reading]')))) throw new Error('Reading fixture did not mount');
    const show = (id, mode = 'all') => ev(`window.fixture.show(${JSON.stringify(id)}, ${JSON.stringify(mode)})`);
    const playerState = () => ev('window.fixture.state()');
    const currentPlaying = key => until(async () => (await playerState()).playing === key);
    const fetches = () => ev('window.fixture.fetches');
    const saved = await ev('localStorage.getItem("myday.data.v4")');

    check('opening a reading fetches no clip and leaves every sentence idle', (await fetches()).length === 0 && await ev(`[...document.querySelectorAll('[data-ar-clip]')].every(b => b.getAttribute('data-state') === 'idle')`), await fetches());
    const vowelled = originals.filter(a => audio.readings[a.id]), scripted = vowelled.filter(a => !/[\u064B-\u0652]/.test(a.text_ar));
    for (const asset of vowelled) {
      await show(asset.id);
      check(`${asset.title}: a fully checked text has Listen, one button per sentence and its unchanged Arabic`, await count(whole) === 1 && await count(sentence) === audio.readings[asset.id].length && await shownText() === spaces(asset.text_ar), { whole: await count(whole), sentences: await count(sentence), text: await shownText() });
      check(`${asset.title}: its authored transliteration stays on the original lines`, await shownReadings() === prepared[asset.id].latin);
    }
    check('all fourteen readings were exercised without fetching audio: the eight the course vowels and the six read from MyDay\'s vowelled scripts', vowelled.length === 14 && scripted.length === 6 && (await fetches()).length === 0, { texts: vowelled.length, scripted: scripted.length, requests: await fetches() });
    for (const asset of scripted) {
      await show(asset.id);
      check(`${asset.title}: an unmarked reading keeps the course's text without marks and says the voice reads MyDay's vowelled copy`, await shownText() === spaces(asset.text_ar) && !/[\u064B-\u0652]/.test(await shownText()) && (await T.text('[data-ar-voice-script]')).includes('It reads MyDay’s vowelled copy of this text'), await shownText());
    }
    await show('asset.arabic-profile');
    check('a reading the course vowels says nothing about a vowelled copy', !(await exists('[data-ar-voice-script]')));

    const profile = originals.find(a => a.id === 'asset.arabic-profile');
    await show(profile.id, 'partial');
    check('one unchecked sentence removes Listen while the other checked sentence buttons remain', !(await exists(whole)) && await count(sentence) === audio.readings[profile.id].length - 1 && !(await exists('[data-ar-sentence="0"]')), { whole: await count(whole), sentences: await count(sentence) });
    check('an unchecked sentence stays readable and the full original text and transliteration remain', await shownText() === spaces(profile.text_ar) && await T.text('[data-ar-transliteration]') === prepared[profile.id].latin);
    await show(profile.id, 'none');
    check('a text awaiting every audio check has no play controls, keeps its Arabic and explains the missing recording', await count(whole) === 0 && await count(sentence) === 0 && await shownText() === spaces(profile.text_ar) && (await T.text('#fixture')).includes('No recording included.'));

    const dialogue = originals.find(a => a.id === 'asset.arabic-introduction-dialogue');
    await show(dialogue.id);
    const first = '[data-ar-sentence="0"]', firstKey = dialogue.id + ':reading:0';
    const firstFile = fixtureClips[audio.readings[dialogue.id][0].spoken];
    check('a sentence button names its position and displayed Arabic, including the dialogue speaker', await ev(`document.querySelector('${first}').getAttribute('aria-label')`) === 'Play sentence 1: سَامِي: مَرْحَبًا.');
    await click(first);
    check('a real click fetches the checked file for the spoken sentence and marks only that sentence pressed', await currentPlaying(firstKey) && (await fetches()).at(-1) === 'arabic-audio/' + firstFile && await ev(`document.querySelector('${first}').getAttribute('aria-pressed') === 'true' && document.querySelector('${first}').getAttribute('aria-label') === 'Stop sentence 1: سَامِي: مَرْحَبًا.'`) && await count('[data-ar-clip][data-state="playing"]') === 1, { state: await playerState(), fetches: await fetches() });
    await click('[data-fixture-vowels]');
    check('hiding vowel marks keeps the playing sentence pressed and changes only its visible Arabic', await ev(`document.querySelector('${first}').getAttribute('aria-pressed') === 'true' && document.querySelector('${first}').getAttribute('aria-label') === 'Stop sentence 1: سامي: مرحبا.'`) && await shownText() === spaces(dialogue.text_unvowelled), await shownText());
    check('hiding vowel marks keeps the prepared transliteration on all six original dialogue lines', await shownReadings() === prepared[dialogue.id].latin);
    await click(first); await click(first);
    check('the unvowelled sentence plays the identical spoken audio file after being stopped and replayed', await currentPlaying(firstKey) && (await fetches()).slice(-2).every(url => url === 'arabic-audio/' + firstFile), await fetches());
    await click(first);

    await show(profile.id);
    const group = profile.id + ':reading', beforeWhole = (await fetches()).length;
    await click(whole);
    check('Listen becomes Stop and highlights the first current sentence', await currentPlaying(group + ':0') && await ev(`document.querySelector('${whole}').getAttribute('aria-pressed') === 'true' && document.querySelector('${whole}').textContent.includes('Stop the whole text') && document.querySelector('[data-ar-sentence="0"]').getAttribute('data-state') === 'playing'`), await playerState());
    for (let i = 1; i < audio.readings[profile.id].length; i++) {
      await ev('window.fixture.end()');
      if (!(await currentPlaying(group + ':' + i))) throw new Error('Listen did not advance to sentence ' + (i + 1));
    }
    await ev('window.fixture.end()');
    const expectedFiles = audio.readings[profile.id].map(p => 'arabic-audio/' + fixtureClips[p.spoken]);
    check('Listen plays every sentence once in order and returns the whole button to idle at the end', await until(async () => (await playerState()).sequence === null) && JSON.stringify((await fetches()).slice(beforeWhole)) === JSON.stringify(expectedFiles) && await ev(`document.querySelector('${whole}').getAttribute('aria-pressed') === 'false' && document.querySelector('${whole}').textContent.includes('Listen to the whole text')`), { state: await playerState(), fetches: (await fetches()).slice(beforeWhole) });
    await click(whole); await currentPlaying(group + ':0'); const beforeStop = (await fetches()).length;
    await click(whole);
    check('clicking Stop clears Listen and the current sentence without requesting the next clip', (await playerState()).sequence === null && (await playerState()).playing === null && (await fetches()).length === beforeStop && await count('[data-ar-clip][aria-pressed="true"]') === 0, await playerState());
    await click(whole); await currentPlaying(group + ':0');
    await ev('window.fixture.unmount()');
    check('unmounting the actual reading component stops its whole-text playback', (await playerState()).sequence === null && (await playerState()).playing === null, await playerState());
    const notice = originals.find(a => a.id === 'asset.arabic-notice'), noticeGroup = notice.id + ':reading';
    await show(notice.id); await show(profile.id); await show(notice.id);
    check('a text with a checked whole clip has Listen marked "one clip"; one without plays its sentences', await ev(`document.querySelector('${whole}').getAttribute('data-ar-whole')`) === 'one clip');
    const beforeOne = (await fetches()).length;
    await click(whole);
    check('Listen plays the text read in one go: one request, for the whole clip, and no sentence marked as playing', await currentPlaying(noticeGroup + ':whole') && JSON.stringify((await fetches()).slice(beforeOne)) === JSON.stringify(['arabic-audio/' + checkedFiles[1]]) && await count('[data-ar-sentence][data-state="playing"]') === 0 && await ev(`document.querySelector('${whole}').textContent.includes('Stop the whole text')`), { state: await playerState(), fetches: (await fetches()).slice(beforeOne) });
    await ev('window.fixture.end()');
    check('at the end of the whole clip Listen returns to idle without asking for anything else', await until(async () => (await playerState()).sequence === null) && (await fetches()).length === beforeOne + 1 && await ev(`document.querySelector('${whole}').getAttribute('aria-pressed') === 'false'`), { state: await playerState() });
    await show(notice.id, 'whole');
    check('a text with only its whole clip checked has Listen, no sentence buttons, and the voice label rather than "No recording included"', await count(whole) === 1 && await count(sentence) === 0 && await exists('[data-ar-voice-label]') && !(await T.text('#fixture')).includes('No recording included.'), { whole: await count(whole), sentences: await count(sentence) });
    await show(profile.id);
    check('a text without a whole clip still plays its sentences in turn', await ev(`document.querySelector('${whole}').getAttribute('data-ar-whole')`) === 'sentences');

    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
    let small = [], overflow = [];
    for (const asset of vowelled) {
      await show(asset.id);
      const sizes = await ev(`[...document.querySelectorAll('[data-ar-clip]')].map(b => ({ key: b.getAttribute('data-ar-clip'), width: b.getBoundingClientRect().width, height: b.getBoundingClientRect().height, label: b.getAttribute('aria-label') || b.textContent.trim() }))`);
      small.push(...sizes.filter(b => b.width < 44 || b.height < 44 || !b.label));
      if (!(await ev('document.documentElement.scrollWidth === innerWidth'))) overflow.push(asset.id + ':vowelled');
      await click('[data-fixture-vowels]');
      if (!(await ev('document.documentElement.scrollWidth === innerWidth'))) overflow.push(asset.id + ':plain');
    }
    check('at 375 px every reading audio button is named and at least 44 px in each direction', small.length === 0, small);
    check('at 375 px all fourteen readings fit with vowel marks shown or hidden', overflow.length === 0, overflow);
    if (process.env.MYDAY_READING_SCREENSHOTS) {
      await show(dialogue.id);
      for (const width of [375, 1024]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: width === 375 ? 1200 : 1000, deviceScaleFactor: 1, mobile: width === 375 });
        await ev('document.fonts.ready');
        const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
        fs.writeFileSync(process.env.MYDAY_READING_SCREENSHOTS + '-' + width + '.png', Buffer.from(capture.data, 'base64'));
      }
    }
    await send('Emulation.clearDeviceMetricsOverride');
    check('reading, playing, stopping and changing vowel marks leave the learning data byte-identical', await ev('localStorage.getItem("myday.data.v4")') === saved);

    // One native-audio smoke check complements the controlled race/availability tests above. The disposable page
    // uses only three already-checked shipped files and real mouse activation, just as a learner taps Listen.
    T.setUrl('reading-voice/index.html?native=1'); await T.openAt(2026, 10, 21);
    if (!(await until(() => exists(whole)))) throw new Error('The native reading fixture did not mount');
    const realTap = async selector => {
      await ev(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: 'center' })`);
      const point = await ev(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    };
    const nativePlaying = key => until(async () => (await playerState()).playing === key && await ev('window.fixture.audioStatus().some(player => player.currentTime > 0 && !player.paused)'));
    await realTap(whole);
    check('a trusted Listen tap plays the first checked MP3 through the browser audio element', await nativePlaying(group + ':0'), { state: await playerState(), audio: await ev('window.fixture.audioStatus()'), fetches: await fetches() });
    check('the browser naturally ends the first MP3 and starts the second sentence without a mock ended event', await nativePlaying(group + ':1') && (await fetches()).slice(0, 2).join() === expectedFiles.slice(0, 2).join(), { state: await playerState(), audio: await ev('window.fixture.audioStatus()'), fetches: await fetches() });
    await realTap(whole);
    check('a trusted Stop tap pauses native audio and clears the active reading', await until(async () => (await playerState()).sequence === null) && await ev('window.fixture.audioStatus().every(player => player.paused)'), { state: await playerState(), audio: await ev('window.fixture.audioStatus()') });
    result = T.summary(); console.log(`\n${result.pass} passed, ${result.fail} failed`);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  process.exit(result.fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
