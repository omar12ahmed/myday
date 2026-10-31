// Live check of the Arabic explainers on the site (tests/live/run.py), on a disposable account and one throwaway device
// (a Mac, then a 320 px phone width): the weak-verbs lesson's Understand step has How it works with its five cards; a
// card opens with its table, and its questions answer when you choose (one wrong, one right); module 15's إِنَّ and
// كَانَ lesson has its two (1.105.0); Vocabulary has the 40
// links, and one opens the irregular-families lesson with the Take card open and its title clear of the step bar; at
// 320 px a card doesn't scroll sideways. Nothing is saved: the device's learning data and the account's Arabic and
// Study records are as before. Never prints account details. Reads the live database (no writes of its own beyond
// signing in): only with the owner's yes.
const path = require('path');
const D = require(path.join(__dirname, 'devices.js'));
const BASE = process.env.MYDAY_BASE || 'https://omar12ahmed.github.io/myday/', VERSION = process.env.MYDAY_VERSION, SRC = process.env.MYDAY_SRC, KEY = 'myday.data.v4';
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
// The account's Arabic and Study change log: what an explainer must never add to.
const learningRows = async who => (await pullAll(who)).filter(r => /^(arabic|study)/.test(r.kind)).map(r => r.seq).sort((a, b) => a - b);
// (The engine shows a change on the badge 300 ms after it, so wait that out first.)
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 30000); };
const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const learning = async d => { const x = await d.data(); return canon({ arabic: x.arabic, study: x.study }); };
const WV = 'study/arabic/lesson.arabic-weak-verbs', SAY = 'details[data-ar-explainer="explainer.arabic-say"]';

(async () => {
  await D.connect();
  const mac = await D.device('liveex-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#study');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
  const who = await signIn();
  const before = { rows: await learningRows(who), data: await learning(mac) };

  // The lesson: How it works, five closed cards, one opened, its questions answered.
  await mac.open(BASE + '#' + WV);
  let shown = await mac.until(`!!document.querySelector('#ar-step-understand [data-ar-explainers="5"]')`, 60000);
  if (!shown) { await mac.open(BASE + '#' + WV); shown = await mac.until(`!!document.querySelector('#ar-step-understand [data-ar-explainers="5"]')`, 60000); } // a stalled chunk, once
  const cards = await mac.ev(`[...document.querySelectorAll('[data-ar-explainers] details[data-ar-explainer]')].map(d => d.dataset.arExplainer + (d.open ? ':open' : ''))`);
  check('the weak-verbs lesson has How it works with its five cards, closed', shown && cards.join() === ['say', 'be', 'live', 'invite', 'walk'].map(n => 'explainer.arabic-' + n).join(), cards);
  await mac.ev(`document.querySelector('${SAY}').open = true`); await D.sleep(300);
  check('the Say card opens with its 10-row table, 3 sentences and 3 questions', await mac.ev(`(() => { const d = document.querySelector('${SAY}'); return d.querySelectorAll('[data-ar-explainer-row]').length === 10 && d.querySelectorAll('[data-ar-explainer-sentence]').length === 3 && d.querySelectorAll('[data-ar-explainer-q]').length === 3; })()`));
  await mac.click(`${SAY} [data-ar-explainer-q="1"] [data-action="ar-explainer-choose"]:nth-of-type(2)`); await D.sleep(200);
  await mac.click(`${SAY} [data-ar-explainer-q="2"] [data-action="ar-explainer-choose"]:nth-of-type(1)`); await D.sleep(300);
  check('a wrong choice says "Not quite." and a right one "Right."', await mac.ev(`(() => { const q = n => document.querySelector('${SAY} [data-ar-explainer-q="' + n + '"]'); return q(1).dataset.state === 'wrong' && q(1).querySelector('[data-ar-explainer-why]').textContent.startsWith('Not quite.') && q(2).dataset.state === 'right' && q(2).querySelector('[data-ar-explainer-why]').textContent.startsWith('Right.'); })()`));

  // Module 15 (1.105.0): the إِنَّ and كَانَ lesson has its two cards, and a table label's Arabic is shown as Arabic.
  await mac.open(BASE + '#study/arabic/lesson.arabic-inna-kana');
  const m15 = await mac.until(`!!document.querySelector('#ar-step-understand [data-ar-explainers="2"]')`, 60000);
  await mac.ev(`(() => { const d = document.querySelector('details[data-ar-explainer="explainer.arabic-inna-sisters"]'); if (d) d.open = true; })()`); await D.sleep(300);
  check('module 15: the إِنَّ and كَانَ lesson has its two explainers, with a table label\'s Arabic marked as Arabic', m15 && await mac.ev(`!!document.querySelector('details[data-ar-explainer="explainer.arabic-inna-sisters"] [data-ar-explainer-table] td [lang="ar"]')`));

  // Vocabulary's links, and following one.
  await mac.open(BASE + '#study/arabic/vocabulary');
  check('Vocabulary has 40 links to explainers under course words (13 in module 14, 27 in module 15)', await mac.until(`document.querySelectorAll('[data-ar-explainer-link]').length === 40`, 60000), await mac.ev(`document.querySelectorAll('[data-ar-explainer-link]').length`));
  await mac.click('[data-ar-word="lexeme.arabic-irregular-families-5"] [data-ar-explainer-link]');
  const opened = await mac.until(`(() => { const d = document.querySelector('details[data-ar-explainer="explainer.arabic-take"]'), s = d?.querySelector('summary'), bar = document.querySelector('nav.journey-steps'); return location.hash === '#study/arabic/lesson.arabic-irregular-families' && !!d?.open && !!s && !!bar && s.getBoundingClientRect().top >= bar.getBoundingClientRect().bottom && s.getBoundingClientRect().top < innerHeight; })()`, 60000);
  check('following the link under أَخَذَ opens its lesson with the Take card open, its title below the step bar', opened,
    await mac.ev(`({ hash: location.hash, open: !!document.querySelector('details[data-ar-explainer="explainer.arabic-take"]')?.open })`));

  // A phone's width.
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true });
  await mac.open(BASE + '#' + WV);
  await mac.until(`!!document.querySelector('details[data-ar-explainer="explainer.arabic-walk"]')`, 60000);
  await mac.ev(`document.querySelector('details[data-ar-explainer="explainer.arabic-walk"]').open = true`); await D.sleep(400);
  check('at 320 px an open card doesn’t scroll sideways', await mac.ev(`document.documentElement.scrollWidth === innerWidth`), await mac.ev(`document.documentElement.scrollWidth + '/' + innerWidth`));

  // Nothing saved, on the device or in the account.
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
