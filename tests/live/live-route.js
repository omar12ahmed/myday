// Live check of "Your route" and "A step towards …" (tests/live/run.py), on a disposable account and one throwaway
// device: the map shows the account's goal as a route of stages with at most one "You are here"; the map's next-step
// card and an on-route lesson say what they're a step towards; Study home's Arabic card has the line with Hide, which
// moves focus to a message and is remembered on this device, and the map's switch brings it back. It never changes the
// account's goal (that would write to the live database), and checks the device's learning data and the account's
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
const openAt = async (d, hash, ready) => { await d.open(BASE + '#' + hash); if (await d.until(ready, 60000)) return true; await d.open(BASE + '#' + hash); return d.until(ready, 60000); };
const KEY = 'myday.arabic.towardshome', LESSON = 'lesson.arabic-greetings-address';

(async () => {
  await D.connect();
  const mac = await D.device('liveroute-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#study');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
  const who = await signIn();
  const before = { rows: await learningRows(who), data: await learning(mac) };
  const goal = (await mac.data()).arabic.pathId;

  // The map: the route for the account's own goal.
  const routed = await openAt(mac, 'study/arabic', `!!document.querySelector('[data-ar-route]')`);
  const route = await mac.ev(`(() => { const s = document.querySelector('[data-ar-route]'); return { goal: s.dataset.arRoute, stages: [...s.querySelectorAll('[data-ar-route-stage]')].map(li => li.dataset.arRouteStage + ':' + li.dataset.state), current: s.querySelectorAll('[aria-current="step"]').length, list: s.querySelector('ol').getAttribute('role') }; })()`);
  check('the map shows "Your route" for the account’s goal, in stages, with at most one "You are here"', routed && route.goal === goal && route.stages.length >= 2 && route.current <= 1 && route.list === 'list', route);
  const next = await mac.ev(`(() => { const c = document.querySelector('[data-ar-next]'); return c ? { kind: c.dataset.arNext, line: c.querySelector('[data-ar-towards]')?.textContent ?? null } : null; })()`);
  check('the map’s next-step card says what it’s a step towards (or, for a revision round or an all-ready path, says nothing)', !!next && (next.line ? next.line.startsWith('A step towards “') : ['revise', 'complete'].includes(next.kind)), next);

  // A lesson on the route (the greetings lesson is on every goal's route).
  if (goal === 'path.arabic-start') check('the account’s goal ends before A1, so the greetings lesson isn’t on its route (no lesson line to check)', true);
  else {
    await openAt(mac, 'study/arabic/' + LESSON, `!!document.querySelector('[data-ar-towards]')`);
    check('an on-route lesson’s header says what it’s a step towards', (await mac.ev(`document.querySelector('[data-ar-towards]')?.textContent ?? ''`)).startsWith('A step towards “'));
  }

  // Study home: the line, Hide (focus to the message, remembered on this device), and the map's switch bringing it back.
  const home = await openAt(mac, 'study', `!!document.querySelector('[data-ar-home-towards]') || !!document.querySelector('.arabic-entry')`);
  const hasLine = await mac.ev(`!!document.querySelector('[data-ar-home-towards]')`);
  if (hasLine) {
    await mac.click('[data-action="ar-towards-hide"]'); await D.sleep(300);
    check('Study home’s line hides, focus moves to the message, and it’s remembered on this device', await mac.ev(`!document.querySelector('[data-ar-home-towards]') && document.activeElement?.hasAttribute('data-ar-home-towards-hidden') && localStorage.getItem('${KEY}') === 'hidden'`));
    await openAt(mac, 'study/arabic', `!!document.querySelector('[data-action="ar-towards-home"]')`);
    await mac.click('[data-action="ar-towards-home"]'); await D.sleep(200);
    check('the map’s switch shows it on Study home again', await mac.ev(`localStorage.getItem('${KEY}') === 'shown'`));
    await openAt(mac, 'study', `!!document.querySelector('[data-ar-home-towards]')`);
    check('…and Study home’s Arabic card has the line again', await mac.ev(`(document.querySelector('[data-ar-home-towards]')?.textContent ?? '').startsWith('Your next lesson is a step towards “')`));
  } else check('Study home’s Arabic card has no line only when the next step is a revision round or the path is all ready', home && ['revise', 'complete'].includes(next?.kind), next);

  // Nothing saved, on the device or in the account.
  await mac.open(BASE + '#study'); await synced(mac);
  check('the device’s learning data (Arabic, Study) is as before', same(await learning(mac), before.data));
  check('the account’s Arabic and Study records are as before (nothing sent)', same(await learningRows(who), before.rows));
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 200));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
