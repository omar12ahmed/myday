// The app's shared Arabic player, with made-up clip files and controlled fetch/Audio responses.
// Exercise real requests, ended events and cancellations without a browser or any network/audio device.
const fs = require('fs'), os = require('os'), path = require('path');
const { pathToFileURL } = require('url');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
let pass = 0, fail = 0;
const check = (label, ok, actual) => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok && actual !== undefined) console.log('    actual:', JSON.stringify(actual));
  ok ? pass++ : fail++;
};
const flush = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve)); };
const group = 'asset.fixture:reading';
const items = ['one', 'two', 'three'].map((name, i) => ({ key: group + ':' + i, file: name + '.mp3' }));
const idle = state => state.playing === null && state.loading === null && state.sequence === null;

function browserMocks(stored = {}) {
  const saved = {
    Audio: global.Audio, fetch: global.fetch, localStorage: global.localStorage,
    createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL,
  };
  const storage = new Map(Object.entries(stored)), requests = [], players = [], played = [], urls = new Map(), revoked = [];
  const rejectPlay = new Set(), deferPlay = new Set(), pendingPlays = [];
  let nextUrl = 0;
  global.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)) };
  global.fetch = url => new Promise((resolve, reject) => { requests.push({ url, resolve, reject, answered: false }); });
  URL.createObjectURL = blob => { const url = 'blob:fixture-' + ++nextUrl; urls.set(url, blob.file); return url; };
  URL.revokeObjectURL = url => { revoked.push(url); };
  global.Audio = class {
    constructor() {
      this.src = ''; this.playbackRate = 1; this.defaultPlaybackRate = 1; this.preservesPitch = false;
      this.onended = null; this.paused = true; this.pauseCount = 0; players.push(this);
    }
    play() {
      this.paused = false;
      const file = urls.get(this.src);
      if (file) {
        played.push({ file, rate: this.playbackRate, defaultRate: this.defaultPlaybackRate, pitch: this.preservesPitch });
        if (rejectPlay.has(file)) return Promise.reject(new Error('made-up playback failure'));
        if (deferPlay.has(file)) return new Promise((resolve, reject) => { pendingPlays.push({ file, resolve, reject }); });
      }
      return Promise.resolve();
    }
    pause() { this.paused = true; this.pauseCount++; }
  };
  const requestFor = file => {
    const request = requests.find(r => r.url === 'arabic-audio/' + file && !r.answered);
    if (!request) throw new Error('No pending request for ' + file);
    request.answered = true;
    return request;
  };
  return {
    storage, requests, players, played, urls, revoked, rejectPlay, deferPlay,
    fetched: () => requests.map(r => r.url),
    files: () => played.map(p => p.file),
    respond(file, { ok = true, delayBlob = false } = {}) {
      let release;
      const blob = delayBlob ? new Promise(resolve => { release = () => resolve({ file }); }) : Promise.resolve({ file });
      requestFor(file).resolve({ ok, status: ok ? 200 : 404, blob: () => blob });
      return release;
    },
    reject(file) { requestFor(file).reject(new Error('made-up network failure')); },
    finishPlay(file, reject = false) {
      const pending = pendingPlays.find(p => p.file === file);
      if (!pending) throw new Error('No pending play promise for ' + file);
      reject ? pending.reject(new Error('made-up delayed playback failure')) : pending.resolve();
    },
    end() { const player = players[players.length - 1]; if (!player?.onended) throw new Error('No playing clip to end'); player.onended(); },
    restore() {
      global.Audio = saved.Audio; global.fetch = saved.fetch; global.localStorage = saved.localStorage;
      URL.createObjectURL = saved.createObjectURL; URL.revokeObjectURL = saved.revokeObjectURL;
    },
  };
}

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')));
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-voice-player-'));
  try {
    const entry = pathToFileURL(await bundle(path.join(ROOT, 'app/src/study/arabic/voice.ts'), temp)).href;
    let caseNumber = 0;
    const scenario = async (run, stored) => {
      const h = browserMocks(stored);
      let V;
      try { V = await import(entry + '?case=' + ++caseNumber); await run(V, h); }
      finally { if (V) V.stopVoiceFor('asset.fixture'); h.restore(); }
    };

    await scenario(async (V, h) => {
      const states = []; const unsubscribe = V.subscribe(() => states.push({ ...V.voiceState() }));
      const start = V.playSequenceOrStop(group, items);
      check('tapping Listen requests only the first sentence and marks the whole text as active', V.voiceState().sequence === group && V.voiceState().loading === items[0].key && h.fetched().join() === 'arabic-audio/one.mp3', { state: V.voiceState(), requests: h.fetched() });
      h.respond('one.mp3'); await start; await flush();
      check('the first playing sentence uses its own key while Listen keeps the sequence key', V.voiceState().playing === items[0].key && V.voiceState().loading === null && V.voiceState().sequence === group, V.voiceState());
      h.end(); await flush();
      check('ending the first sentence requests the second sentence without fetching the third', V.voiceState().loading === items[1].key && V.voiceState().sequence === group && h.fetched().join() === 'arabic-audio/one.mp3,arabic-audio/two.mp3', { state: V.voiceState(), requests: h.fetched() });
      h.respond('two.mp3'); await flush();
      check('the second sentence becomes the only current playing sentence', V.voiceState().playing === items[1].key && V.voiceState().loading === null, V.voiceState());
      h.end(); await flush(); h.respond('three.mp3'); await flush();
      check('the third sentence follows the second and every sentence plays once in order', V.voiceState().playing === items[2].key && h.files().join() === 'one.mp3,two.mp3,three.mp3', { state: V.voiceState(), files: h.files() });
      h.end(); await flush();
      check('the final ended event clears Listen and every playing or loading sentence', idle(V.voiceState()) && h.requests.length === 3, V.voiceState());
      check('finishing a reading releases every temporary audio URL and pauses the player', h.urls.size === 3 && h.revoked.length === 3 && h.players.every(p => p.paused), { created: h.urls.size, revoked: h.revoked, players: h.players });
      check('subscribers observe the sequence starting, advancing and returning to idle', states.some(s => s.loading === items[0].key && s.sequence === group) && states.some(s => s.playing === items[1].key) && idle(states[states.length - 1]), states);
      unsubscribe();
    });

    await scenario(async (V, h) => {
      const start = V.playSequenceOrStop(group, items);
      await V.playSequenceOrStop(group, items);
      check('tapping Listen again stops the sequence even while its first fetch is pending', idle(V.voiceState()), V.voiceState());
      h.respond('one.mp3'); await start; await flush();
      check('a fetch that completes after Listen was stopped cannot play or advance the reading', idle(V.voiceState()) && h.played.length === 0 && h.requests.length === 1, { state: V.voiceState(), files: h.files(), requests: h.fetched() });
    });

    await scenario(async (V, h) => {
      const start = V.playSequenceOrStop(group, items);
      const releaseBlob = h.respond('one.mp3', { delayBlob: true }); await flush();
      await V.playSequenceOrStop(group, items); releaseBlob(); await start; await flush();
      check('stopping while a response body loads prevents its late audio from starting', idle(V.voiceState()) && h.played.length === 0 && h.urls.size === 0, { state: V.voiceState(), files: h.files(), created: h.urls.size });
    });

    await scenario(async (V, h) => {
      h.deferPlay.add('one.mp3');
      const start = V.playSequenceOrStop(group, items); h.respond('one.mp3'); await flush();
      check('a sentence whose Audio.play promise is still pending stays loading rather than claiming to play', V.voiceState().loading === items[0].key && V.voiceState().playing === null && V.voiceState().sequence === group, V.voiceState());
      await V.playSequenceOrStop(group, items);
      h.finishPlay('one.mp3'); await start; await flush();
      check('a play promise resolving after Stop cannot restore the sequence or leave audio running', idle(V.voiceState()) && h.requests.length === 1 && h.players.every(p => p.paused), { state: V.voiceState(), requests: h.fetched(), paused: h.players.map(p => p.paused) });
    });

    await scenario(async (V, h) => {
      h.deferPlay.add('one.mp3');
      const start = V.playSequenceOrStop(group, items); h.respond('one.mp3'); await flush();
      const singleKey = 'asset.fixture:single', single = V.playOrStop(singleKey, 'individual.mp3');
      h.respond('individual.mp3'); await single; await flush(); h.finishPlay('one.mp3', true); await start; await flush();
      check('a replaced sequence play promise rejecting late cannot fail or stop the newer individual clip', V.voiceState().playing === singleKey && V.voiceState().sequence === null && V.voiceState().failed === null && h.requests.length === 2, { state: V.voiceState(), requests: h.fetched() });
    });

    await scenario(async (V, h) => {
      const start = V.playSequenceOrStop(group, items); h.respond('one.mp3'); await start; await flush();
      const oldEnded = h.players[0].onended;
      h.end(); await flush();
      const singleKey = 'asset.fixture:single';
      const single = V.playOrStop(singleKey, 'individual.mp3');
      h.respond('individual.mp3'); await single; await flush();
      check('tapping an individual sentence cancels Listen and plays only the chosen clip', V.voiceState().playing === singleKey && V.voiceState().sequence === null && h.files().join() === 'one.mp3,individual.mp3', { state: V.voiceState(), files: h.files() });
      h.respond('two.mp3'); oldEnded(); await flush();
      check('an old sequence fetch or ended handler cannot interrupt the individual clip or start another sentence', V.voiceState().playing === singleKey && V.voiceState().sequence === null && h.files().join() === 'one.mp3,individual.mp3' && !h.fetched().includes('arabic-audio/three.mp3'), { state: V.voiceState(), files: h.files(), requests: h.fetched() });
      await V.playOrStop(singleKey, 'individual.mp3');
      check('tapping the same individual clip again stops it without a second fetch', idle(V.voiceState()) && h.fetched().filter(u => u.endsWith('individual.mp3')).length === 1, { state: V.voiceState(), requests: h.fetched() });
    });

    await scenario(async (V, h) => {
      const first = V.playSequenceOrStop(group, items);
      const otherGroup = 'asset.fixture:other-reading';
      const other = V.playSequenceOrStop(otherGroup, [{ key: otherGroup + ':0', file: 'other.mp3' }]);
      h.respond('other.mp3'); await other; await flush(); h.respond('one.mp3'); await first; await flush();
      check('starting a different reading replaces a pending Listen request and late results stay stopped', V.voiceState().sequence === otherGroup && V.voiceState().playing === otherGroup + ':0' && h.files().join() === 'other.mp3', { state: V.voiceState(), files: h.files() });
      h.end(); await flush();
      check('the replacement reading ends normally without fetching from the cancelled reading', idle(V.voiceState()) && h.requests.length === 2, { state: V.voiceState(), requests: h.fetched() });
    });

    for (const failure of ['missing', 'network', 'playback']) await scenario(async (V, h) => {
      const start = V.playSequenceOrStop(group, items); h.respond('one.mp3'); await start; await flush();
      h.end(); await flush();
      if (failure === 'missing') h.respond('two.mp3', { ok: false });
      else if (failure === 'network') h.reject('two.mp3');
      else { h.rejectPlay.add('two.mp3'); h.respond('two.mp3'); }
      await flush();
      check(`a ${failure} failure on the second sentence stops Listen and marks that sentence as failed`, idle(V.voiceState()) && V.voiceState().failed === items[1].key && !h.fetched().includes('arabic-audio/three.mp3'), { state: V.voiceState(), requests: h.fetched() });
    });

    await scenario(async (V, h) => {
      const start = V.playSequenceOrStop(group, items); h.respond('one.mp3'); await start; await flush();
      if (typeof h.players[0].onerror !== 'function') throw new Error('The playing audio has no error handler');
      h.players[0].onerror(); await flush();
      check('a media error after playback starts stops Listen and marks the current sentence as failed', idle(V.voiceState()) && V.voiceState().failed === items[0].key && h.requests.length === 1, { state: V.voiceState(), requests: h.fetched() });
    });

    await scenario(async (V, h) => {
      const start = V.playSequenceOrStop(group, items);
      V.stopVoiceFor('asset.somewhere-else:reading');
      check('leaving an unrelated page does not cancel the current reading', V.voiceState().sequence === group && V.voiceState().loading === items[0].key, V.voiceState());
      V.stopVoiceFor('asset.fixture:read');
      check('a page prefix that merely shares the first letters of the reading key cannot stop it', V.voiceState().sequence === group && V.voiceState().loading === items[0].key, V.voiceState());
      V.stopVoiceFor(group);
      check('leaving the reading page clears Listen and its pending sentence', idle(V.voiceState()), V.voiceState());
      h.respond('one.mp3'); await start; await flush();
      check('a sentence fetched after leaving its page cannot start playing', idle(V.voiceState()) && h.played.length === 0 && h.requests.length === 1, { state: V.voiceState(), files: h.files() });
      const single = V.playOrStop(group + ':0', 'individual.mp3'); h.respond('individual.mp3'); await single; await flush();
      V.stopVoiceFor(group);
      check('leaving the page also stops an individual sentence from that reading', idle(V.voiceState()) && h.players.every(p => p.paused), V.voiceState());
    });

    await scenario(async (V, h) => {
      const learned = h.storage.get('myday.data.v4');
      check('a saved Slower preference is restored when the player opens', V.voiceState().slower === true, V.voiceState());
      const start = V.playSequenceOrStop(group, items); h.respond('one.mp3'); await start; await flush();
      check('the first sentence uses three-quarter speed with its pitch preserved', h.played[0].rate === 0.75 && h.played[0].defaultRate === 0.75 && h.played[0].pitch, h.played[0]);
      V.setSlower(false);
      check('switching Slower off updates the playing sentence and the device preference', h.players[0].playbackRate === 1 && h.players[0].defaultPlaybackRate === 1 && h.storage.get(V.SLOWER_KEY) === 'no', { rate: h.players[0].playbackRate, storage: [...h.storage] });
      h.end(); await flush(); h.respond('two.mp3'); await flush();
      check('the next sentence retains the speed chosen during the reading', h.played[1].rate === 1 && h.played[1].defaultRate === 1 && h.played[1].pitch, h.played[1]);
      V.setSlower(true); h.end(); await flush(); h.respond('three.mp3'); await flush();
      check('turning Slower back on applies to the next sentence without changing learning data', h.played[2].rate === 0.75 && V.voiceState().slower && h.storage.get(V.SLOWER_KEY) === 'yes' && h.storage.get('myday.data.v4') === learned, { played: h.played, storage: [...h.storage] });
      h.end(); await flush();
    }, { 'myday.arabic.slower': 'yes', 'myday.data.v4': '{"madeUpLearning":"unchanged"}' });

    await scenario(async (V, h) => {
      await V.playSequenceOrStop(group, []); await flush();
      check('an empty reading stays idle without requesting or playing a clip', idle(V.voiceState()) && h.requests.length === 0 && h.played.length === 0, { state: V.voiceState(), requests: h.fetched() });
    });
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS', e); process.exit(1); });
