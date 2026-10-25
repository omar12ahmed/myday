// Live check of Cybersecurity lesson states on the site (tests/live/run.py), on a disposable account without the
// Cybersecurity path in its roadmap and two throwaway devices (a Mac and a 320 px phone): the Mac marks a lesson Ready
// to move on (its lesson record and its two knowledge checks reach the live database as `cyber_lesson` and
// `cyber_card` records; the module shows it), the phone receives it, flags it "Needs revision…" with what needs work,
// the Mac receives that and clears it with "Done revisiting", and the phone takes Ready back ("Not ready after all":
// a deletion marker). Then the checks it brought back are removed and both devices' learning data is as before.
// Never prints account details. Writes to the live database: only with the owner's yes.
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
const LESSON = 'lesson.learning-evidence', MOD = 'module.learning-lab', TASK = 'cyber:1:' + LESSON;
const CHECKS = ['assessment.learning-evidence-check.q1', 'assessment.learning-evidence-check.q2'];
const WHAT = 'NAT versus host-only (made up)';
const LESSON_HASH = 'study/cybersecurity/' + LESSON;
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
const record = d => d.ev(`JSON.parse(localStorage.getItem('${KEY}')).cybersecurity.lessons?.find(l => l.id === ${JSON.stringify(LESSON)}) ?? null`);
const cards = d => d.ev(`(JSON.parse(localStorage.getItem('${KEY}')).cybersecurity.cards || []).filter(c => ${JSON.stringify(CHECKS)}.includes(c.id)).sort((a, b) => a.id.localeCompare(b.id))`);
// Learning data, as compared before and after (an emptied list of lesson records counts as none).
const learning = async d => { const x = await d.data(); const cy = { ...x.cybersecurity }; if (!cy.lessons?.length) delete cy.lessons; return canon({ cybersecurity: cy, study: x.study, arabic: x.arabic }); };
const place = d => d.ev(`document.querySelector('[data-cy-place]')?.dataset.cyPlace ?? null`);
const line = d => d.ev(`document.querySelector('[data-cy-place] p')?.textContent ?? ''`);
const openLesson = async d => { await d.open(BASE + '#' + LESSON_HASH); return d.until(`!!document.querySelector('[data-cy-place]')`, 60000); };
const has = (d, action) => d.exists(`[data-action="${action}"]`);
const shift = (k, n) => { const t = new Date(k + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('livecyl-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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
  const today = await mac.today();
  const inRoadmap = d => d.ev(`JSON.stringify(JSON.parse(localStorage.getItem('${KEY}')).study.stages || []).includes(${JSON.stringify('"' + TASK + '"')})`);
  if (await inRoadmap(mac)) throw Error('this account has the Cybersecurity path in its roadmap; the check needs one without it');

  // Tidy first: a lesson record or its checks left by an earlier stopped run.
  if (await record(mac) || (await cards(mac)).length) {
    await mac.setData(`s => { s.cybersecurity.lessons = (s.cybersecurity.lessons || []).filter(l => l.id !== ${JSON.stringify(LESSON)}); s.cybersecurity.cards = (s.cybersecurity.cards || []).filter(c => !${JSON.stringify(CHECKS)}.includes(c.id)); }`);
    await synced(mac); console.log('(tidied what an earlier run left)');
  }
  await phone.open(BASE + '#study'); await synced(phone);
  await phone.until(`!(JSON.parse(localStorage.getItem('${KEY}')).cybersecurity.lessons || []).some(l => l.id === ${JSON.stringify(LESSON)}) && !(JSON.parse(localStorage.getItem('${KEY}')).cybersecurity.cards || []).some(c => ${JSON.stringify(CHECKS)}.includes(c.id))`, 30000);
  const before = { mac: await learning(mac), phone: await learning(phone) };

  // Mac: the lesson's place, then Ready to move on.
  check('mac: the lesson page shows its place under the title', await openLesson(mac), await mac.ev(`location.hash`));
  const start = await place(mac);
  check(`mac: the lesson starts New or Practised ("${start}"), offering Ready to move on and Needs revision… only`, ['new', 'practised'].includes(start)
    && await has(mac, 'cy-place-ready') && await has(mac, 'cy-place-revisit') && !await has(mac, 'cy-place-unready') && !await has(mac, 'cy-place-revisited'), await line(mac));
  await mac.click('[data-action="cy-place-ready"]');
  check('mac: Ready to move on makes it Ready, dated today, and says its 2 checks come back about a week later', await mac.until(`document.querySelector('[data-cy-place]')?.dataset.cyPlace === 'ready'`, 5000)
    && (await line(mac)).startsWith('Ready to move on since') && (await mac.text('[data-cy-place-note]')).startsWith('Its 2 checks will come back from'), [await line(mac), await mac.text('[data-cy-place-note]')]);
  const ready = await record(mac), added = await cards(mac);
  check('mac: the lesson record holds only the lesson and today', same(ready, { id: LESSON, readyOn: today }), ready);
  check('mac: its 2 knowledge checks are in revision, added today, due a week on or later', added.length === 2 && added.every(c => c.addedOn === today && c.review.due >= shift(today, 7)), added.map(c => [c.id, c.addedOn, c.review?.due]));
  check('mac: saved to the account', await synced(mac));
  let rows = await pullAll(who);
  check('the live account holds the lesson record as a cyber_lesson record, exactly as on the Mac', !row(rows, 'cyber_lesson', LESSON)?.deleted && same(body(row(rows, 'cyber_lesson', LESSON)), ready), row(rows, 'cyber_lesson', LESSON));
  check('…and the 2 checks as cyber_card records, exactly as on the Mac', added.every(c => !row(rows, 'cyber_card', c.id)?.deleted && same(body(row(rows, 'cyber_card', c.id)), c)), CHECKS.map(id => row(rows, 'cyber_card', id)?.version));
  await mac.open(BASE + '#study/cybersecurity/' + MOD);
  check('mac: the module lists the lesson as Ready to move on', await mac.until(`[...document.querySelectorAll('[data-cy-lesson-state]')].find(li => li.querySelector('a')?.getAttribute('href')?.includes(${JSON.stringify(LESSON)}))?.dataset.cyLessonState === 'ready'`, 30000));
  await mac.open(BASE + '#study/cybersecurity');
  const tile = `[...document.querySelectorAll('[data-cy-module]')].find(a => a.getAttribute('href')?.includes(${JSON.stringify(MOD)}))`;
  if (await mac.until(`!!${tile}`, 30000)) check('mac: its module tile on the map counts it ready', await mac.ev(`/\\b\\d+ ready\\b/.test(${tile}.textContent)`), await mac.ev(`${tile}.textContent`));
  else console.log('(the module isn’t on this account’s path, so its tile isn’t on the map)');
  check('mac: the map names a next step with its reason', await mac.until(`(document.querySelector('[data-cy-next]')?.textContent || '').length > 5`, 10000), await mac.ev(`document.querySelector('[data-cy-next]')?.dataset.cyNext ?? null`));

  // Phone: receives it; flags it "Needs revision…".
  check('phone: the lesson page shows it Ready', await openLesson(phone) && await synced(phone) && await phone.until(`document.querySelector('[data-cy-place]')?.dataset.cyPlace === 'ready'`, 30000), await place(phone));
  check('phone: exactly the same lesson record and checks as the Mac', same(await record(phone), ready) && same(await cards(phone), added), [await record(phone), (await cards(phone)).length]);
  check('phone at 320 px: nothing scrolls sideways, and the place buttons are at least 44 px', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`)
    && await phone.ev(`[...document.querySelectorAll('[data-cy-place] [data-action^=cy-place-]')].every(b => b.getBoundingClientRect().height >= 44)`),
    [await phone.ev(`document.documentElement.scrollWidth + '/' + innerWidth`), await phone.ev(`[...document.querySelectorAll('[data-cy-place] [data-action^=cy-place-]')].map(b => b.dataset.action + ':' + Math.round(b.getBoundingClientRect().height))`)]);
  await phone.click('[data-action="cy-place-revisit"]');
  await phone.until(`!!document.querySelector('[data-cy-revisit-form] #cyRevisitWhat')`, 5000);
  await phone.type('#cyRevisitWhat', WHAT); await phone.click('[data-action="cy-revisit-save"]');
  check('phone: Needs revision… with what needs work makes it Needs revision, in those words', await phone.until(`document.querySelector('[data-cy-place]')?.dataset.cyPlace === 'needs-revision'`, 5000)
    && (await line(phone)).startsWith('Needs revision: ' + WHAT), await line(phone));
  const flagged = await record(phone);
  check('phone: the record keeps the Ready day and adds the flag, dated today', same(flagged, { id: LESSON, readyOn: today, revisit: { since: today, what: WHAT } }), flagged);
  check('phone: saved to the account, as the same record', await synced(phone) && same(body(row(await pullAll(who), 'cyber_lesson', LESSON)), flagged));

  // Mac: receives the flag; Done revisiting.
  check('mac: receives the flag with its words', await openLesson(mac) && await synced(mac) && await mac.until(`document.querySelector('[data-cy-place]')?.dataset.cyPlace === 'needs-revision' && document.querySelector('[data-cy-place] p').textContent.includes(${JSON.stringify(WHAT)})`, 30000), await line(mac));
  check('mac: offers Done revisiting and Not ready after all, not Needs revision…', await has(mac, 'cy-place-revisited') && await has(mac, 'cy-place-unready') && !await has(mac, 'cy-place-revisit'));
  await mac.click('[data-action="cy-place-revisited"]');
  check('mac: Done revisiting returns it to Ready, the flag gone and the Ready day kept', await mac.until(`document.querySelector('[data-cy-place]')?.dataset.cyPlace === 'ready'`, 5000) && same(await record(mac), ready), await record(mac));
  check('mac: saved to the account', await synced(mac) && same(body(row(await pullAll(who), 'cyber_lesson', LESSON)), ready));

  // Phone: Not ready after all.
  check('phone: receives Ready without the flag', await openLesson(phone) && await synced(phone) && await phone.until(`document.querySelector('[data-cy-place]')?.dataset.cyPlace === 'ready'`, 30000) && same(await record(phone), ready), await record(phone));
  await phone.click('[data-action="cy-place-unready"]');
  check(`phone: Not ready after all takes it back to "${start}" and removes the lesson record`, await phone.until(`document.querySelector('[data-cy-place]')?.dataset.cyPlace === ${JSON.stringify(start)}`, 5000) && !await record(phone), [await place(phone), await record(phone)]);
  check('phone: the 2 checks stay in revision, unchanged', same(await cards(phone), added));
  check('phone: saved; the account has a deletion marker for the lesson record', await synced(phone) && !!row(await pullAll(who), 'cyber_lesson', LESSON)?.deleted);
  check(`mac: receives it: "${start}" again, no lesson record`, await openLesson(mac) && await synced(mac) && await mac.until(`document.querySelector('[data-cy-place]')?.dataset.cyPlace === ${JSON.stringify(start)}`, 30000) && !await record(mac), [await place(mac), await record(mac)]);

  // Tidy: the 2 checks this run brought back leave revision, on both devices and in the account.
  await mac.setData(`s => { s.cybersecurity.cards = (s.cybersecurity.cards || []).filter(c => !${JSON.stringify(CHECKS)}.includes(c.id)); }`);
  check('tidy: the 2 checks removed on the Mac and saved', !(await cards(mac)).length && await synced(mac));
  rows = await pullAll(who);
  check('tidy: in the account the lesson record and the 2 checks are deletion markers', [row(rows, 'cyber_lesson', LESSON), ...CHECKS.map(id => row(rows, 'cyber_card', id))].every(r => r?.deleted),
    [row(rows, 'cyber_lesson', LESSON), ...CHECKS.map(id => row(rows, 'cyber_card', id))].map(r => r && [r.kind, r.deleted]));
  await phone.open(BASE + '#study'); await synced(phone);
  check('tidy: the phone has neither the record nor the checks', await phone.until(`!(JSON.parse(localStorage.getItem('${KEY}')).cybersecurity.cards || []).some(c => ${JSON.stringify(CHECKS)}.includes(c.id)) && !(JSON.parse(localStorage.getItem('${KEY}')).cybersecurity.lessons || []).some(l => l.id === ${JSON.stringify(LESSON)})`, 30000));
  const after = { mac: await learning(mac), phone: await learning(phone) };
  check('both devices’ learning data (Cybersecurity, Study, Arabic) is as before', same(after.mac, before.mac) && same(after.phone, before.phone),
    ['mac', 'phone'].map(n => Object.keys(before[n]).filter(k => !same(before[n][k], after[n][k]))));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
