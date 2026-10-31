// Live check of the Arabic voice in its newer places (tests/live/run.py), on a disposable account and one throwaway
// device (a Mac, then a 320 px phone width): a key idea read from MyDay's vowelled copy plays; a lesson's objectives and
// its practical task have their buttons, which wait while you check yourself and come back on Try; the timetable's 15
// Arabic cells play, each button named apart; an explainer's forms, sentences and steps have theirs and a form plays.
// At 320 px the timetable doesn't scroll sideways. Nothing is saved: the device's learning data and the account's
// Arabic and Study records are as before. Never prints account details. Reads the live database (no writes of its own
// beyond signing in): only with the owner's yes.
const path = require('path');
const D = require(path.join(__dirname, 'devices.js'));
const BASE = process.env.MYDAY_BASE || 'https://omar12ahmed.github.io/myday/', VERSION = process.env.MYDAY_VERSION, SRC = process.env.MYDAY_SRC;
const URL_ = (process.env.SUPABASE_URL || '').replace(/\/+$/, ''), PUB = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const A = { email: process.env.MYDAY_LIVE_EMAIL, password: process.env.MYDAY_LIVE_PASSWORD }; // the disposable account run.py chose
if (!process.argv.includes('--live') || !A.email?.endsWith('@example.com') || !A.password || !SRC || !VERSION || !URL_ || !PUB.startsWith('sb_publishable_')) {
  console.log('Refused: explicit live check, a disposable account, version, source commit and the publishable key required.'); process.exit(2);
}
let pass = 0, fail = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || info === undefined ? '' : ' → ' + JSON.stringify(info).slice(0, 300))); ok ? pass++ : fail++; };
const hdr = tok => ({ apikey: PUB, Authorization: `Bearer ${tok || PUB}`, 'Content-Type': 'application/json' });
async function signIn() {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, { method: 'POST', headers: hdr(), body: JSON.stringify(A) });
  const j = await r.json(); if (!j.access_token) throw Error('REST sign-in failed'); return { token: j.access_token, id: j.user.id };
}
const rpc = (fn, who, args) => fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: hdr(who.token), body: JSON.stringify(args) });
async function pullAll(who) {
  const rows = []; let since = 0;
  for (;;) { const r = await (await rpc('sync_pull_v2', who, { account: who.id, since, max_rows: 1000 })).json();
    if (!Array.isArray(r)) throw Error('pull failed: ' + JSON.stringify(r).slice(0, 200)); rows.push(...r); if (r.length < 1000) break; since = r[r.length - 1].seq; }
  return rows;
}
const learningRows = async who => (await pullAll(who)).filter(r => /^(arabic|study)/.test(r.kind)).map(r => r.seq).sort((a, b) => a - b);
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 30000); };
const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const learning = async d => { const x = await d.data(); return canon({ arabic: x.arabic, study: x.study }); };
const clips = (d, sel) => d.ev(`[...document.querySelectorAll(${JSON.stringify(sel + ' [data-action="ar-play"]')})].map(b => b.getAttribute('data-ar-clip'))`);
// Opens a page of the course, once more if a chunk stalls.
const openAt = async (d, hash, ready) => { await d.open(BASE + '#' + hash); if (await d.until(ready, 60000)) return true; await d.open(BASE + '#' + hash); return d.until(ready, 60000); };
// Presses a play button with a real mouse click (a script's click isn't a user gesture, so the browser won't start
// audio for it) and waits for it to play, its first play fetching the clip from the site. Gives true, or the state it
// stopped at.
const realClick = async (d, sel) => {
  const at = await d.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  for (const type of ['mousePressed', 'mouseReleased']) await d.send('Input.dispatchMouseEvent', { type, x: at.x, y: at.y, button: 'left', clickCount: 1 });
};
const plays = async (d, name) => {
  const sel = `[data-ar-clip="${name}"]`; await realClick(d, sel);
  if (await d.until(`document.querySelector(${JSON.stringify(sel)})?.dataset.state === 'playing'`, 20000)) { await realClick(d, sel); return true; }
  return d.ev(`document.querySelector(${JSON.stringify(sel)})?.dataset.state`);
};
const SQ = 'lesson.arabic-simple-questions', NEG = 'lesson.arabic-negation-system', WV = 'lesson.arabic-weak-verbs', TT = 'asset.arabic-timetable';
const SAY = 'details[data-ar-explainer="explainer.arabic-say"]';

(async () => {
  await D.connect();
  const mac = await D.device('livevoice-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#study');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
  const who = await signIn();
  const before = { rows: await learningRows(who), data: await learning(mac) };

  // Key ideas: مَن ما أين هل, read from MyDay's vowelled copy, with the label that says so.
  const sqShown = await openAt(mac, 'study/arabic/' + SQ, `!!document.querySelector('[data-ar-key-ideas] [data-action="ar-play"]')`);
  check('a key idea has its play button and the label saying it reads MyDay’s vowelled copy', sqShown && (await clips(mac, '[data-ar-key-ideas]')).join() === SQ + ':key:0:0'
    && await mac.ev(`!!document.querySelector('[data-ar-key-ideas] + [data-ar-voice-label] [data-ar-voice-script]')`), await clips(mac, '[data-ar-key-ideas]'));
  const keyPlays = await plays(mac, SQ + ':key:0:0');
  check('…and it plays', keyPlays === true, keyPlays);

  // Objectives: two voiced runs in the negation lesson's first objective.
  await openAt(mac, 'study/arabic/' + NEG, `!!document.querySelector('ul[data-ar-objectives] [data-action="ar-play"]')`);
  check('a lesson’s objectives have their play buttons', (await clips(mac, 'ul[data-ar-objectives]')).length === 2, await clips(mac, 'ul[data-ar-objectives]'));

  // The practical task: four voiced runs, held while you check yourself, back on Try.
  await openAt(mac, 'study/arabic/' + WV, `!!document.querySelector('[data-ar-task] [data-action="ar-play"]')`);
  check('the weak-verbs task has its four play buttons', (await clips(mac, '[data-ar-task]')).length === 4, await clips(mac, '[data-ar-task]'));
  await mac.click('[data-action="ar-step"][data-v="check"]');
  check('while you check yourself the task’s buttons wait, and its text stays', await mac.until(`!!document.querySelector('[data-ar-folded]') && !document.querySelector('[data-ar-task] [data-action="ar-play"]')`, 10000)
    && await mac.ev(`document.querySelector('[data-ar-task]').textContent.includes('قال، زار')`));
  await mac.click('[data-action="ar-step"][data-v="try"]');
  check('…and they come back on Try', await mac.until(`document.querySelectorAll('[data-ar-task] [data-action="ar-play"]').length === 4`, 10000));

  // The explainers: the Say card's 10 forms, 3 sentences and its steps' Arabic; a form plays.
  await mac.ev(`document.querySelector('${SAY}').open = true`); await D.sleep(400);
  const say = await clips(mac, SAY);
  check('the Say explainer has its 27 play buttons (10 forms, 3 sentences, 14 in its steps), none in its questions', say.length === 27 && say.filter(n => n.includes(':form:')).length === 10
    && say.filter(n => n.includes(':sentence:')).length === 3 && await mac.ev(`!document.querySelector('${SAY} [data-ar-explainer-q] [data-action="ar-play"]')`), say);
  const formPlays = await plays(mac, 'explainer.arabic-say:form:0');
  check('…and its first form, قَالَ, plays (made again in the current voice)', formPlays === true, formPlays);

  // The timetable: 15 cells, each named apart; one plays.
  await openAt(mac, 'study/arabic/' + TT, `document.querySelectorAll('table [data-action="ar-play"]').length === 15`);
  const names = await mac.ev(`[...document.querySelectorAll('table [data-action="ar-play"]')].map(b => b.getAttribute('aria-label'))`);
  check('the timetable has a play button in each of its 15 Arabic cells, each named apart', names.length === 15 && new Set(names).size === 15, names);
  const cellPlays = await plays(mac, TT + ':row:0:place');
  check('…and a cell plays', cellPlays === true, cellPlays);
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true });
  await openAt(mac, 'study/arabic/' + TT, `document.querySelectorAll('table [data-action="ar-play"]').length === 15`);
  check('at 320 px the timetable doesn’t scroll sideways', await mac.ev(`document.documentElement.scrollWidth === innerWidth`), await mac.ev(`document.documentElement.scrollWidth + '/' + innerWidth`));

  // Nothing saved, on the device or in the account.
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#study'); await synced(mac);
  check('the device’s learning data (Arabic, Study) is as before', same(await learning(mac), before.data));
  check('the account’s Arabic and Study records are as before (nothing new sent)', same(await learningRows(who), before.rows));
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 200));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
