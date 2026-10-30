// Live check of Ask MyDay's Undo from + on the site (tests/live/run.py), on a disposable account and two throwaway
// devices (a Mac and a 390 px phone), without asking the AI: two made-up tasks are kept as Ask MyDay's last add on the
// Mac (exactly as the panel keeps one); one is ticked on the phone; reopening + on the Mac offers "Last from Ask MyDay"
// (and the phone, another device, doesn't); Undo there takes back the untouched task and keeps the ticked one, saying
// so; the phone and the live account agree. Then the made-up task is removed. Never prints account details. Writes to
// the live database: only with the owner's yes.
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
  const last = new Map(); for (const r of rows) if (!last.has(r.kind + ':' + r.record_id) || last.get(r.kind + ':' + r.record_id).seq < r.seq) last.set(r.kind + ':' + r.record_id, r);
  return [...last.values()];
}
// (The engine shows a change on the badge 300 ms after it, so wait that out first.)
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 30000); };
const PREFIX = 'tkLiveUndo', T1 = 'Water the ferns (made up)', T2 = 'Post the parcel (made up)';
const tidy = `s => { s.tasks.items = s.tasks.items.filter(t => !String(t.id).startsWith('${PREFIX}')); }`;
const openPlus = async d => { await d.click('[data-action=capture-open]'); await d.until(`!!document.getElementById('captureText')`, 10000); await D.sleep(300); };
const closePlus = d => d.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`);

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('liveundo-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
    await d.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] }); // no AI is asked anything
    if (i) await d.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await d.open(BASE + '#today');
    if (!await d.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent on ' + name);
    await d.type('#syncEmailInput', A.email); await d.type('#syncPassword', A.password); await d.click('[data-action="sync-signin"]');
    check(`${name}: signs in and finishes syncing`, await d.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(d));
    check(`${name}: shows MyDay ${VERSION} from ${SRC}`, await d.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
    devs.push(d);
  }
  const [mac, phone] = devs;
  // Tidy first: anything an earlier stopped run left.
  if ((await mac.data()).tasks.items.some(t => String(t.id).startsWith(PREFIX))) { await mac.setData(tidy); await synced(mac); }

  // Two made-up tasks, kept as Ask MyDay's last add on the Mac (its content as Ask left it, in any key order).
  const at = new Date().toISOString().slice(0, 16), id1 = PREFIX + 'a' + Date.now().toString(36), id2 = PREFIX + 'b' + Date.now().toString(36);
  const TK = (id, title) => ({ id, title, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: at, postponed: 0, blockers: [], letGoOn: null });
  await mac.setData(`s => { s.tasks.items.push(${JSON.stringify(TK(id1, T1))}, ${JSON.stringify(TK(id2, T2))}); }`);
  await synced(mac);
  await mac.ev(`(() => {
    const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(y => [y, x[y]])) : x));
    const d = JSON.parse(localStorage.getItem('${KEY}')), now = new Date(), pad = n => String(n).padStart(2, '0'), today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    const after = {}; for (const id of ['${id1}', '${id2}']) after['task:' + id] = canon(d.tasks.items.find(t => t.id === id));
    localStorage.setItem('myday.ask.lastUndo', JSON.stringify({ kind: 'added', id: 'live' + now.getTime(), words: '2 tasks', on: today, at: '10:00', undo: { tasks: ['${id1}', '${id2}'], notes: [], appointments: [], projects: [], study: { tasks: [], sections: [], modules: [] }, plan: [], after } }));
  })()`);
  // One ticked on the phone (another device), reaching the Mac.
  await phone.open(BASE + '#today'); await synced(phone);
  await phone.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.some(t => t.id === '${id1}')`, 30000);
  await phone.setData(`s => { const t = s.tasks.items.find(x => x.id === '${id1}'); t.done = true; t.doneOn = new Date().toISOString().slice(0, 10); }`);
  await synced(phone);
  await mac.open(BASE + '#today'); await synced(mac);
  check('mac: receives the tick made on the phone', await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === '${id1}')?.done === true`, 30000));

  // + on the Mac offers it; + on the phone (another device) doesn't.
  await openPlus(mac);
  const line = await mac.ev(`document.querySelector('[data-s=ask-last]')?.textContent || ''`);
  check('mac: + offers "Last from Ask MyDay, at 10:00: added 2 tasks." with Undo, above the text field', line.startsWith('Last from Ask MyDay, at 10:00: added 2 tasks.') && await mac.ev(`!!document.querySelector('[data-s=ask-last] [data-action=ask-last-undo]')`), line);
  await openPlus(phone);
  check('phone: + offers nothing — it\'s kept on the device where Ask did it', !(await phone.ev(`!!document.querySelector('[data-s=ask-last]')`)));
  await closePlus(phone);
  await mac.click('[data-action=ask-last-undo]'); await D.sleep(600);
  const toast = await mac.ev(`document.getElementById('toast')?.textContent || ''`), md = await mac.data();
  check('mac: Undo takes back the untouched task, keeps the one ticked on the phone, and says so', !md.tasks.items.some(t => t.id === id2) && md.tasks.items.some(t => t.id === id1 && t.done) && toast.includes("Taken back, except one thing you've changed since."), toast);
  check('mac: the line goes, and focus is back on the text field', !(await mac.ev(`!!document.querySelector('[data-s=ask-last]')`)) && (await mac.ev(`document.activeElement?.id || ''`)) === 'captureText');
  await closePlus(mac); await synced(mac);
  const who = await signIn(), rows = await pullAll(who);
  const r1 = rows.find(r => r.record_id === id1), r2 = rows.find(r => r.record_id === id2);
  check('the live account agrees: the ticked one is there, the untouched one deleted', !!r1 && !r1.deleted && r1.data?.done === true && !!r2 && r2.deleted === true, [r1 && { deleted: r1.deleted, done: r1.data?.done }, r2 && { deleted: r2.deleted }]);
  await phone.open(BASE + '#today'); await synced(phone);
  check('phone: receives it (the untouched one gone, the ticked one kept)', await phone.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !d.tasks.items.some(t => t.id === '${id2}') && d.tasks.items.some(t => t.id === '${id1}'); })()`, 30000));

  // Tidy.
  await mac.setData(tidy); await synced(mac);
  check('tidy: the made-up task is removed and saved', !(await mac.data()).tasks.items.some(t => String(t.id).startsWith(PREFIX)));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
