// Live check of Arabic's four skills on the site (tests/live/run.py), on a disposable account and two throwaway devices
// (a Mac and a 320 px phone): two made-up finished Arabic sessions (reading and writing on your own; reading with a
// hint) reach the live database as `arabic_attempt` records; Progress's "Arabic: four skills" on both devices counts
// them the same way, with the next lessons and the course's A1 guide; an open session's Reflect says which skills the
// lesson asks for; then the sessions are removed and both devices' learning data is as before. Never prints account
// details. Writes to the live database: only with the owner's yes.
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
const JOIN = 'lesson.arabic-letter-joining', IDS = ['aalive4sk1', 'aalive4sk2', 'aalive4sk3'];
const record = d => d.ev(`(JSON.parse(localStorage.getItem('${KEY}')).arabic.attempts || []).filter(a => ${JSON.stringify(IDS)}.includes(a.id)).sort((a, b) => a.id.localeCompare(b.id))`);
const learning = async d => { const x = await d.data(); return canon({ arabic: x.arabic, study: x.study, cybersecurity: x.cybersecurity }); };
const skill = (d, m, k) => d.ev(`(document.querySelector('[data-pg-arabic-skills] [data-pg-skill="${m}"] [data-pg-skill-${k}]')?.textContent || '').replace(/\\s+/g, ' ')`);
const card = d => d.ev(`(document.querySelector('[data-pg-arabic-skills]')?.innerText || '')`);
const openProgress = async d => { await d.open(BASE + '#study/progress'); return d.until(`!!document.querySelector('[data-pg-arabic-skills]')`, 60000); };

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('live4sk-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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

  // Tidy first: sessions an earlier stopped run left.
  if ((await record(mac)).length) { await mac.setData(`s => { s.arabic.attempts = s.arabic.attempts.filter(a => !${JSON.stringify(IDS)}.includes(a.id)); }`); await synced(mac); console.log('(tidied what an earlier run left)'); }
  await phone.open(BASE + '#study'); await synced(phone);
  await phone.until(`!(JSON.parse(localStorage.getItem('${KEY}')).arabic.attempts || []).some(a => ${JSON.stringify(IDS)}.includes(a.id))`, 30000);
  const before = { mac: await learning(mac), phone: await learning(phone) };
  const prior = (await mac.data()).arabic.attempts.filter(a => a.finishedAt && a.practised.includes('reading')).length;
  const priorOwn = (await mac.data()).arabic.attempts.filter(a => a.finishedAt && a.practised.includes('reading') && a.help === 'independent').length;

  // Mac: two finished sessions on the letter-joining lesson (made up), as if done here.
  const now = new Date().toISOString();
  const at = (id, practised, help, finishedAt) => ({ id, lessonId: JOIN, curriculumVersion: '1.1.2', variant: 'short', startedAt: now, finishedAt, help, practised, answers: {}, revealed: [], revisit: '' });
  await mac.setData(`s => { s.arabic.attempts.push(${JSON.stringify(at(IDS[0], ['reading', 'writing'], 'independent', now))}, ${JSON.stringify(at(IDS[1], ['reading'], 'hint', now))}); }`);
  check('mac: the two sessions are saved to the account', await synced(mac));
  const mine = await record(mac), rows = await pullAll(who);
  check('the live account holds them as arabic_attempt records, exactly as on the Mac', mine.length === 2 && mine.every(a => !row(rows, 'arabic_attempt', a.id)?.deleted && same(body(row(rows, 'arabic_attempt', a.id)), a)), mine.map(a => row(rows, 'arabic_attempt', a.id)?.version));
  check('mac: Progress shows "Arabic: four skills"', await openProgress(mac) && (await mac.text('[data-pg-arabic-skills] h3')) === 'Arabic: four skills');
  const reading = await skill(mac, 'reading', 'done');
  check('mac: Reading counts the two sessions with the ones before, and how many were without help', reading.startsWith(`Practised in ${prior + 2} sessions (${priorOwn + 1 === prior + 2 ? 'all without help' : (priorOwn + 1) + ' without help'}), last on `), reading);
  check('mac: each skill has the course’s A1 guide and no percentage; the card says it isn’t a level', await mac.ev(`document.querySelectorAll('[data-pg-arabic-skills] [data-pg-skill-guide]').length === 4`) && !(await card(mac)).includes('%') && (await card(mac)).includes('Not a level'), await card(mac));
  const macCard = await card(mac);

  // Phone: receives the sessions and shows the same card.
  await phone.open(BASE + '#study'); await synced(phone); // (a page left open fetches on its own schedule; opening it fetches now)
  const arrived = await phone.until(`(JSON.parse(localStorage.getItem('${KEY}')).arabic.attempts || []).filter(a => ${JSON.stringify(IDS)}.includes(a.id)).length === 2`, 30000), theirs = await record(phone);
  check('phone: receives the sessions exactly', arrived && same(theirs, mine), { arrived, differs: mine.map((a, n) => Object.keys({ ...a, ...theirs[n] }).filter(k => !same(a[k], theirs[n]?.[k])).map(k => [k, a[k], theirs[n]?.[k]])) });
  check('phone: Progress shows the same four skills, word for word', await openProgress(phone) && (await card(phone)).replace(/\s+/g, ' ') === macCard.replace(/\s+/g, ' '), await card(phone));
  check('phone at 320 px: nothing scrolls sideways, and the next-lesson links are at least 44 px', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`)
    && await phone.ev(`[...document.querySelectorAll('[data-action="pg-skill-next"]')].every(a => a.getBoundingClientRect().height >= 44)`),
    [await phone.ev(`document.documentElement.scrollWidth + '/' + innerWidth`), await phone.ev(`[...document.querySelectorAll('[data-action="pg-skill-next"]')].map(a => Math.round(a.getBoundingClientRect().height))`)]);

  // Reflect: an open session on the lesson says which skills it asks for, ticking nothing.
  await mac.setData(`s => { s.arabic.attempts.push(${JSON.stringify(at(IDS[2], [], 'independent', null))}); }`);
  await mac.open(BASE + '#study/arabic/' + JOIN);
  check('mac: Reflect says "This lesson asks for reading and writing." and nothing is ticked', await mac.until(`document.querySelector('p[data-ar-asks]')?.textContent === 'This lesson asks for reading and writing.'`, 60000)
    && await mac.ev(`[...document.querySelectorAll('[data-action="ar-practised"]')].every(b => b.getAttribute('aria-pressed') === 'false')`), await mac.ev(`document.querySelector('[data-ar-session]')?.innerText?.slice(0, 300) ?? null`));

  // Tidy: the three sessions go, on both devices and in the account.
  await mac.setData(`s => { s.arabic.attempts = s.arabic.attempts.filter(a => !${JSON.stringify(IDS)}.includes(a.id)); }`);
  check('tidy: removed on the Mac and saved', !(await record(mac)).length && await synced(mac));
  const after = await pullAll(who);
  check('tidy: in the account the sessions are deletion markers', IDS.every(id => !row(after, 'arabic_attempt', id) || row(after, 'arabic_attempt', id).deleted), IDS.map(id => row(after, 'arabic_attempt', id)?.deleted));
  await phone.open(BASE + '#study'); await synced(phone);
  check('tidy: the phone has none of them', await phone.until(`!(JSON.parse(localStorage.getItem('${KEY}')).arabic.attempts || []).some(a => ${JSON.stringify(IDS)}.includes(a.id))`, 30000));
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
