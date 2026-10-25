// Live check of Arabic course words on the site (tests/live/run.py), on a disposable account and two throwaway devices (a
// Mac and a 320 px phone): a module 4 lesson shows its 9 words (with a voice); marking it ready brings its 13 words (its
// own and the starter words it uses) and its 3 checks into revision, sent to the live database as `arabic_card` records
// exactly as on the Mac; the phone receives them and its Vocabulary lists "Words from the lessons"; the Cybersecurity
// map speaks of notebook ratings, not scores. Then Ready is taken back, the cards are removed and both devices' learning
// data is as before. Never prints account details. Writes to the live database: only with the owner's yes.
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
  // The newest row of each record (the change log may hold several).
  const last = new Map(); for (const r of rows) if (!last.has(r.kind + ':' + r.record_id) || last.get(r.kind + ':' + r.record_id).seq < r.seq) last.set(r.kind + ':' + r.record_id, r);
  return [...last.values()];
}
const row = (rows, kind, id) => rows.find(r => r.kind === kind && r.record_id === id) ?? null;
const body = r => r?.data?.value ?? r?.data;
// (The engine shows a change on the badge 300 ms after it, so wait that out first.)
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 30000); };
// Records compared by content: the database stores JSON with its keys in its own order.
const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const LESSON = 'lesson.arabic-greetings-address', HASH = 'study/arabic/' + LESSON;
const ids = { own: Array.from({ length: 9 }, (_, i) => `lexeme.arabic-greetings-address-${i + 1}`), starter: ['001', '002', '003', '026'].map(n => `lexeme.arabic-seed-${n}`) };
const WORD_CARDS = [...ids.own, ...ids.starter].map(id => id + ':recognise'), CHECK_CARDS = [1, 2, 3].map(n => `assessment.arabic-greetings-address-check.q${n}`);
const ALL = [...WORD_CARDS, ...CHECK_CARDS];
const cardsOf = d => d.ev(`(JSON.parse(localStorage.getItem('${KEY}')).arabic.cards || []).filter(c => ${JSON.stringify(ALL)}.includes(c.id)).sort((a, b) => a.id.localeCompare(b.id))`);
const recordOf = d => d.ev(`JSON.parse(localStorage.getItem('${KEY}')).arabic.lessons?.find(l => l.id === ${JSON.stringify(LESSON)}) ?? null`);
const learning = async d => { const x = await d.data(); const ar = { ...x.arabic }; if (!ar.lessons?.length) delete ar.lessons; return canon({ arabic: ar, study: x.study, cybersecurity: x.cybersecurity }); };
const openLesson = async d => { await d.open(BASE + '#' + HASH); return d.until(`!!document.querySelector('[data-ar-place]') && !!document.querySelector('[data-ar-lesson-words]')`, 60000); };

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('livecw-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
    await d.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
    if (i) await d.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true });
    else await d.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await d.open(BASE + '#study');
    if (!await d.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent on ' + name);
    await d.type('#syncEmailInput', A.email); await d.type('#syncPassword', A.password); await d.click('[data-action="sync-signin"]');
    check(`${name}: signs in and finishes syncing`, await d.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(d));
    check(`${name}: shows MyDay ${VERSION} from ${SRC}`, await d.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}') && !document.querySelector('#appVersion').textContent.includes('+changes')`));
    devs.push(d);
  }
  const [mac, phone] = devs;
  const who = await signIn();

  // Tidy first: Ready or cards an earlier stopped run left.
  if ((await cardsOf(mac)).length || await recordOf(mac)) {
    await mac.setData(`s => { s.arabic.cards = (s.arabic.cards || []).filter(c => !${JSON.stringify(ALL)}.includes(c.id)); s.arabic.lessons = (s.arabic.lessons || []).filter(l => l.id !== ${JSON.stringify(LESSON)}); }`);
    await synced(mac); console.log('(tidied what an earlier run left)');
  }
  await phone.open(BASE + '#study'); await synced(phone);
  const before = { mac: await learning(mac), phone: await learning(phone) };

  // Mac: the lesson's words, then Ready.
  check('mac: the lesson shows "Words in this lesson: 9, and 4 starter words it uses"', await openLesson(mac) && (await mac.text('[data-ar-lesson-words] summary')) === 'Words in this lesson: 9, and 4 starter words it uses', await mac.text('[data-ar-lesson-words] summary'));
  await mac.ev(`document.querySelector('[data-ar-lesson-words]').open = true`); await D.sleep(300);
  check('mac: opened, its 9 words then its 4 starter words, the first with a voice for the word and its example', JSON.stringify(await mac.ev(`[...document.querySelectorAll('[data-ar-lesson-words] li[data-ar-word]')].map(e => e.dataset.arWord)`)) === JSON.stringify([...ids.own, ...ids.starter])
    && await mac.exists(`[data-ar-clip="${ids.own[0]}:word"]`) && await mac.exists(`[data-ar-clip="${ids.own[0]}:example"]`));
  const startPlace = await mac.ev(`document.querySelector('[data-ar-place]')?.dataset.arPlace ?? null`);
  await mac.click('[data-action="ar-place-ready"]');
  check('mac: Ready to move on, with the note saying its 13 words and its 3 checks come back', await mac.until(`document.querySelector('[data-ar-place]')?.dataset.arPlace === 'ready'`, 5000)
    && /^Its 13 words will come back (tomorrow|from .+), and its 3 checks on .+\.$/.test(await mac.text('[data-ar-place-note]')), await mac.text('[data-ar-place-note]'));
  const added = await cardsOf(mac);
  check('mac: 13 word cards (Arabic → meaning) and 3 check cards in revision', added.length === 16 && WORD_CARDS.every(id => added.some(c => c.id === id)) && CHECK_CARDS.every(id => added.some(c => c.id === id)), added.map(c => c.id));
  check('mac: saved to the account', await synced(mac));
  const rows = await pullAll(who);
  check('the live account holds all 16 as arabic_card records, exactly as on the Mac', added.every(c => !row(rows, 'arabic_card', c.id)?.deleted && same(body(row(rows, 'arabic_card', c.id)), c)), added.map(c => row(rows, 'arabic_card', c.id)?.version));

  // Phone: receives them; Vocabulary lists the lessons' words.
  await phone.open(BASE + '#study'); await synced(phone);
  check('phone: receives the 16 cards exactly', await phone.until(`(JSON.parse(localStorage.getItem('${KEY}')).arabic.cards || []).filter(c => ${JSON.stringify(ALL)}.includes(c.id)).length === 16`, 30000) && same(await cardsOf(phone), added));
  await phone.open(BASE + '#study/arabic/vocabulary');
  const cwFile = JSON.parse(require('fs').readFileSync(path.join(process.env.MYDAY_ROOT || path.join(__dirname, '../..'), 'content/teaching/arabic/course-words.json'), 'utf8')).lessons;
  const cwLessons = Object.keys(cwFile).length, cwWords = Object.values(cwFile).reduce((n, l) => n + l.words.length, 0);
  check(`phone: Vocabulary has "Words from the lessons", ${cwLessons} lessons, ${cwWords} words`, await phone.until(`document.querySelector('[data-ar-course-words="${cwLessons}"] h2')?.textContent === 'Words from the lessons'`, 60000)
    && await phone.ev(`document.querySelectorAll('[data-ar-course-words] li[data-ar-word]').length === ${cwWords}`));
  check('phone at 320 px: nothing scrolls sideways, and the word rows’ buttons are at least 44 px', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`)
    && await phone.ev(`[...document.querySelectorAll('[data-ar-course-words] button')].every(b => b.getBoundingClientRect().height >= 44)`),
    [await phone.ev(`document.documentElement.scrollWidth + '/' + innerWidth`), await phone.ev(`[...document.querySelectorAll('[data-ar-course-words] button')].filter(b => b.getBoundingClientRect().height < 44).length`)]);
  check(`phone: the greetings lesson’s words say they’re in revision ("${ids.own[0]}" row)`, await phone.ev(`(document.querySelector('[data-ar-course-words] [data-ar-word="${ids.own[0]}"]')?.textContent || '').includes('Recognising it:')`));

  // The notebook: the Cybersecurity map speaks of ratings, never scores.
  await mac.open(BASE + '#study/cybersecurity');
  check('mac: the Cybersecurity map’s footnote speaks of your notebook ratings, with no "score"', await mac.until(`document.body.textContent.includes('Your notebook ratings are your own assessment')`, 60000) && !/score/i.test(await mac.text('#app')));

  // Tidy: Ready taken back on the phone, the cards removed, on both devices and in the account.
  await openLesson(phone); await synced(phone);
  await phone.click('[data-action="ar-place-unready"]');
  check('phone: Not ready after all takes Ready back (its words and checks stay in revision)', await phone.until(`document.querySelector('[data-ar-place]')?.dataset.arPlace === ${JSON.stringify(startPlace)}`, 5000) && (await cardsOf(phone)).length === 16 && await synced(phone));
  await mac.open(BASE + '#study'); await synced(mac);
  await mac.until(`!JSON.parse(localStorage.getItem('${KEY}')).arabic.lessons?.some(l => l.id === ${JSON.stringify(LESSON)} && l.readyOn)`, 30000);
  await mac.setData(`s => { s.arabic.cards = (s.arabic.cards || []).filter(c => !${JSON.stringify(ALL)}.includes(c.id)); }`);
  check('tidy: the 16 cards removed on the Mac and saved', !(await cardsOf(mac)).length && await synced(mac));
  const after = await pullAll(who);
  check('tidy: in the account they are deletion markers', ALL.every(id => row(after, 'arabic_card', id)?.deleted), ALL.filter(id => !row(after, 'arabic_card', id)?.deleted));
  await phone.open(BASE + '#study'); await synced(phone);
  check('tidy: the phone has none of them', await phone.until(`!(JSON.parse(localStorage.getItem('${KEY}')).arabic.cards || []).some(c => ${JSON.stringify(ALL)}.includes(c.id))`, 30000));
  const end = { mac: await learning(mac), phone: await learning(phone) };
  check('both devices’ learning data (Arabic, Study, Cybersecurity) is as before', same(end.mac, before.mac) && same(end.phone, before.phone),
    ['mac', 'phone'].map(n => Object.keys(before[n]).filter(k => !same(before[n][k], end[n][k]))));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
