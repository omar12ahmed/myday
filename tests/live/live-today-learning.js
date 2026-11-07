// Live check of Today's learning from Study and Tidy up (1.132.0, specs/today-learning-and-tidy.md) on the site
// (tests/live/run.py), on a disposable account and one throwaway Mac-width device, without the AI.
// - Today: today's plan is built (any plan of today's is started over first). Its learning row is Study's next step,
//   "<subject> · <lesson>", with its why and a link to the lesson. It's saved under its subject's title, marked by its
//   task id ("study:…"). Then today is started over again.
// - Tasks: a made-up task dated 20 days ago is listed by Tidy up under "From more than 2 weeks ago". Let go marks it let
//   go, and it's then deleted, everywhere.
// Never prints account details. Writes to the live account: only with the owner's yes.
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
const TASK = 'Live check old task (made up)';
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
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 30000); };
const confirmDialog = async d => { await d.until(`!!document.querySelector('[data-action=dialog-confirm]')`, 5000); await d.click('[data-action=dialog-confirm]'); await D.sleep(400); };
const todayIn = d => d.ev(`(() => { const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); })()`);
const setDate = (d, sel, v) => d.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); el.dispatchEvent(new Event('blur', { bubbles: true })); return true; })()`);

(async () => {
  await D.connect();
  const mac = await D.device('livelearn-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#today');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}') && !document.querySelector('#appVersion').textContent.includes('+changes')`));
  const who = await signIn(), k = await todayIn(mac);
  const restart = async () => { await mac.open(BASE + '#today'); if (!await mac.until(`!!document.querySelector('[data-action=restart]')`, 8000)) return; await mac.click('[data-action=restart]'); await confirmDialog(mac); await synced(mac); };

  // ---- Today: the learning row is Study's next step ----
  if ((await mac.data()).days[k]) await restart();
  await mac.open(BASE + '#today'); await mac.until(`!!document.getElementById('energy')`, 15000);
  await mac.ev(`(() => { const r = document.getElementById('energy'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(r, '5'); r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await mac.click('[data-action=build]'); await mac.until(`!!document.querySelector('[data-action=prop-apply]')`, 15000);
  await mac.click('[data-action=prop-apply]');
  const shown = await mac.until(`!!document.querySelector('#app .task [data-s=plan-study-detail]')`, 20000);
  const row = await mac.ev(`(() => { const t = document.querySelector('#app .task [data-s=plan-study-detail]')?.closest('.task'); return t ? { title: t.querySelector('.title').textContent, why: t.querySelector('[data-s=plan-study-detail]').textContent } : null; })()`);
  check('today\'s plan has a learning row that is Study\'s next step: "<subject> · <lesson>", with why', shown && !!row && / · /.test(row.title) && row.why.length > 0, row);
  const href = await mac.ev(`document.querySelector('#app [data-action=plan-study]')?.getAttribute('href') || (document.querySelector('#app [data-action=plan-study]') ? 'button' : null)`);
  check('…with its button: a link to the lesson, or Revise when revision comes first', href === 'button' || /^#study\//.test(href || ''), href);
  await synced(mac);
  const entry = ((await mac.data()).days[k]?.tasks || []).find(t => t.category === 'learning');
  check('…saved under its subject\'s title, marked as Study\'s by its task id, with no new field', !!entry && /^study:(arabic|cybersecurity|roadmap:)/.test(entry.taskId) && / — your next (lesson|step)$/.test(entry.title) && !('study' in entry), entry);
  const dayRow = (await pullAll(who)).find(r => r.kind === 'day' && r.record_id === k);
  check('the live account\'s day record holds the same entry', !!dayRow && !dayRow.deleted && (dayRow.data.tasks || []).some(t => t.uid === entry?.uid && t.taskId === entry.taskId), dayRow && { deleted: dayRow.deleted });
  await restart();
  check('tidy: today started over (no plan for today)', !(await mac.data()).days[k]);

  // ---- Tasks: Tidy up lists an old task; Let go; then it's deleted ----
  const deleteTask = async id => { await mac.open(BASE + `#today/tasks/${id}`); if (!await mac.until(`!!document.querySelector('[data-action=task-delete]')`, 10000)) return; await mac.click('[data-action=task-delete]'); await confirmDialog(mac); };
  for (const id of (await mac.data()).tasks.items.filter(t => t.title === TASK).map(t => t.id)) await deleteTask(id);
  await mac.open(BASE + '#today/tasks'); await mac.until(`!!document.getElementById('taskNew')`, 15000);
  await mac.type('#taskNew', TASK); await mac.click('[data-action=task-add]');
  await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.some(t => t.title === ${JSON.stringify(TASK)})`, 10000);
  const tid = (await mac.data()).tasks.items.find(t => t.title === TASK).id;
  const old = await mac.ev(`(() => { const t = new Date(); t.setDate(t.getDate() - 20); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); })()`);
  await mac.open(BASE + `#today/tasks/${tid}`); await mac.until(`!!document.getElementById('tDue')`, 10000);
  await setDate(mac, '#tDue', old);
  await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === '${tid}')?.due === '${old}'`, 8000);
  await mac.open(BASE + '#today/tasks');
  const listed = await mac.until(`!!document.querySelector('[data-s=tidy] [data-group=old] [data-s=tidy-item][data-id="${tid}"]')`, 15000);
  check('Tidy up lists the made-up task dated 20 days ago under "From more than 2 weeks ago", saying from when', listed && (await mac.text(`[data-s=tidy-item][data-id="${tid}"] p`)).startsWith('From '), await mac.ev(`document.querySelector('[data-s=tidy]')?.textContent.slice(0, 200) || 'no card'`));
  await mac.click(`[data-s=tidy-item][data-id="${tid}"] [data-action=tidy-let-go]`); await D.sleep(400);
  const t1 = (await mac.data()).tasks.items.find(t => t.id === tid);
  check('Let go marks it let go today (kept, not deleted), and its row goes', t1?.letGoOn === k && !(await mac.ev(`!!document.querySelector('[data-s=tidy-item][data-id="${tid}"]')`)), t1);
  await synced(mac);
  const taskRow = (await pullAll(who)).find(r => r.kind === 'task' && r.record_id === tid);
  check('the live account holds the task, let go', !!taskRow && !taskRow.deleted && taskRow.data.letGoOn === k, taskRow && { deleted: taskRow.deleted, letGoOn: taskRow.data?.letGoOn });
  await deleteTask(tid); await synced(mac);
  const gone = (await pullAll(who)).find(r => r.kind === 'task' && r.record_id === tid);
  check('tidy: the made-up task is deleted, here and in the account (a deletion marker)', !(await mac.data()).tasks.items.some(t => t.id === tid) && !!gone?.deleted, gone && { deleted: gone.deleted });
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 200));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
