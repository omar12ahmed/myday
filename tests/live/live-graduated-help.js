// Live check of graduated help for Arabic words (tests/live/run.py), on a disposable account and one throwaway device:
// Vocabulary's voice note explains it and offers "Always show the help", off to begin with; switching it on is
// remembered on this device only ("yes", surviving a reload), switching it off again leaves "no"; the device's
// learning data and the account's Arabic and Study records are as before (nothing sent). A word becoming "known" needs
// revision answers over days, so that part is covered by the browser suite (app-arabic [16]), not here. Never prints
// account details. Reads the live database (no writes of its own beyond signing in): only with the owner's yes.
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
const SW = '[data-action="ar-always-help"]', KEY = 'myday.arabic.alwayshelp';
const openVocabulary = async d => { await d.open(BASE + '#study/arabic/vocabulary'); if (await d.until(`!!document.querySelector('${SW}')`, 60000)) return true; await d.open(BASE + '#study/arabic/vocabulary'); return d.until(`!!document.querySelector('${SW}')`, 60000); };

(async () => {
  await D.connect();
  const mac = await D.device('livehelp-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#study');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
  const who = await signIn();
  const before = { rows: await learningRows(who), data: await learning(mac) };

  check('Vocabulary explains graduated help and offers "Always show the help", off to begin with', await openVocabulary(mac)
    && await mac.ev(`!!document.querySelector('[data-ar-known-help]') && document.querySelector('${SW}').getAttribute('aria-checked') === 'false'`));
  await mac.click(SW); await D.sleep(200);
  check('switching it on is remembered on this device as "yes"', await mac.ev(`document.querySelector('${SW}').getAttribute('aria-checked') === 'true' && localStorage.getItem('${KEY}') === 'yes'`));
  await openVocabulary(mac);
  check('…and is still on after a reload', await mac.ev(`document.querySelector('${SW}').getAttribute('aria-checked') === 'true'`));
  await mac.click(SW); await D.sleep(200);
  check('switching it off again leaves "no"', await mac.ev(`document.querySelector('${SW}').getAttribute('aria-checked') === 'false' && localStorage.getItem('${KEY}') === 'no'`));

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
