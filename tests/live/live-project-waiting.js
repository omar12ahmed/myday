// Live check of a whole project waiting on the site (tests/live/run.py), on a disposable account and two throwaway
// devices (a Mac and a 320 px phone): a made-up project is marked as waiting from Manage, checking back today. The live
// database holds the wait exactly, without a change to the project's "updated" time; the phone receives it (the card
// says "Waiting on …", Needs you says "Still waiting on …" · "check back today") and chases it from Needs you, which
// adds "Chase: <project>" for today; the Mac receives the chase task and says Got it, which reaches the phone (no wait).
// Then the project and its chase task are deleted everywhere. Never prints account details. Writes to the live
// database: only with the owner's yes.
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
const TITLE = 'Live check Waiting (made up)', WHO = 'The landlord (made up)', CHASE = `Chase: ${TITLE}`;
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
// (The engine shows a change on the badge 300 ms after it, so wait that out first.)
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 30000); };
const toast = (d, s) => d.until(`[...document.querySelectorAll('[role=status]')].some(e => e.textContent.includes(${JSON.stringify(s)}))`, 15000);
const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const projectOf = async (d, id) => (await d.data()).projects.items.find(p => p.id === id);
const todayIn = d => d.ev(`(() => { const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); })()`);

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('livewait-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
    await d.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
    if (i) await d.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 2, mobile: true });
    else await d.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await d.open(BASE + '#projects');
    if (!await d.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent on ' + name);
    await d.type('#syncEmailInput', A.email); await d.type('#syncPassword', A.password); await d.click('[data-action="sync-signin"]');
    check(`${name}: signs in and finishes syncing`, await d.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(d));
    check(`${name}: shows MyDay ${VERSION} from ${SRC}`, await d.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}') && !document.querySelector('#appVersion').textContent.includes('+changes')`));
    devs.push(d);
  }
  const [mac, phone] = devs;
  const who = await signIn();
  const deleteProject = async id => { await mac.open(BASE + `#projects/p/${id}`); await mac.until(`!!document.querySelector('[data-action=project-delete]')`); await mac.click('[data-action=project-delete]'); await D.sleep(250); await mac.click('[data-action=dialog-confirm]'); await D.sleep(500); };
  const deleteTask = async id => { await mac.open(BASE + `#today/tasks/${id}`); if (!await mac.until(`!!document.querySelector('[data-action=task-delete]')`, 10000)) return; await mac.click('[data-action=task-delete]'); await mac.until(`!!document.querySelector('[data-action=dialog-confirm]')`, 5000); await mac.click('[data-action=dialog-confirm]'); await D.sleep(500); };
  for (const id of (await mac.data()).projects.items.filter(p => p.title === TITLE).map(p => p.id)) await deleteProject(id);
  for (const id of (await mac.data()).tasks.items.filter(t => t.title === CHASE).map(t => t.id)) await deleteTask(id);
  await synced(mac);
  const today = await todayIn(mac);

  // Mac: a made-up project, marked as waiting from Manage, checking back today.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`);
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE)?.id;
  await mac.open(BASE + `#projects/p/${pid}`); await mac.until(`!!document.querySelector('[data-action=project-wait]')`, 15000);
  const stamp = (await projectOf(mac, pid)).updatedAt;
  await mac.click('[data-action=project-wait]'); await mac.until(`!!document.getElementById('pWaitOn')`, 5000);
  await mac.type('#pWaitOn', WHO); await mac.type('#pWaitUntil', today); await mac.click('[data-action=pwait-save]');
  check('mac: marked as waiting ("Waiting on … MyDay won’t call it quiet"), and the Overview starts with it', await toast(mac, `Waiting on ${WHO}.`)
    && await mac.until(`(document.querySelector('[data-s=project-waiting-line]')?.textContent || '').startsWith(${JSON.stringify('Waiting on ' + WHO + ' since')})`, 5000));
  const wait = (await projectOf(mac, pid)).waiting;
  check('mac: saved with whom, since today and checking back today; the project\'s "updated" time as it was', same(wait, { on: WHO, since: today, until: today }) && (await projectOf(mac, pid)).updatedAt === stamp && await synced(mac), wait);
  const rowOf = async id => (await pullAll(who)).find(r => r.kind === 'project' && r.record_id === id)?.data?.value;
  check('the live account holds the wait exactly, as on the Mac', same((await rowOf(pid))?.waiting, wait), (await rowOf(pid))?.waiting);

  // Phone: receives it; chases it from Needs you.
  await phone.open(BASE + '#projects'); await synced(phone);
  check('phone: the card says "Waiting on … · check back …"', await phone.until(`(document.querySelector('.project-card[data-id="${pid}"] [data-s=project-waiting]')?.textContent || '').startsWith(${JSON.stringify('Waiting on ' + WHO + ' · check back')})`, 30000));
  const need = `[data-s=need][data-id="pwait:${pid}"]`;
  // (Whatever else the account has, the Waiting filter and "Show more" bring the line into view.)
  await phone.until(`!!document.querySelector('[data-s=needs-list]')`, 15000);
  if (await phone.exists('[data-s=needs-filter][data-id=waiting]')) await phone.click('[data-s=needs-filter][data-id=waiting]');
  if (!await phone.until(`!!document.querySelector('${need}')`, 3000) && await phone.exists('[data-action=needs-more]')) await phone.click('[data-action=needs-more]');
  check('phone: Needs you says "Still waiting on …" · "check back today"', await phone.until(`(document.querySelector('${need}')?.textContent || '').includes(${JSON.stringify('Still waiting on ' + WHO)}) && document.querySelector('${need}').textContent.includes('check back today')`, 15000),
    await phone.text(need));
  check('phone at 320 px: the Projects home doesn\'t scroll sideways', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`));
  await phone.click(`${need} [data-action=chase]`); await phone.until(`!!document.querySelector('${need} [data-action=chase-add]')`, 5000);
  await phone.click(`${need} [data-action=chase-add]`);
  check('phone: Chase it adds "Chase: <project>" for today, and saves', await toast(phone, `Added “${CHASE}” (5 min) for today`) && await phone.until(`!!document.querySelector('${need} [data-s=chase-added]')`, 5000) && await synced(phone));
  const cid = (await projectOf(phone, pid)).waiting?.chaseTaskId, ctask = (await phone.data()).tasks.items.find(t => t.id === cid);
  check('phone: the chase task is in the project, 5 minutes, due today', !!ctask && ctask.title === CHASE && ctask.projectId === pid && ctask.minutes === 5 && ctask.due === today, ctask);

  // Mac: receives the chase; Got it.
  await mac.open(BASE + `#projects/p/${pid}`); await synced(mac);
  check('mac: receives the chase task and the wait pointing at it', await mac.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); const p = d.projects.items.find(p => p.id === '${pid}'); return p?.waiting?.chaseTaskId === '${cid}' && d.tasks.items.some(t => t.id === '${cid}'); })()`, 30000)
    && await mac.until(`!!document.querySelector('#projectWaiting [data-s=chase-added]')`, 10000));
  await mac.click('[data-action=pwait-done]');
  check('mac: Got it — no longer waiting, and saved', await toast(mac, 'No longer waiting.') && !('waiting' in (await projectOf(mac, pid))) && !(await mac.exists('#projectWaiting')) && await synced(mac));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('phone: receives it — the card has no wait and Needs you no line', await phone.until(`!JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${pid}')?.waiting && !document.querySelector('${need}') && !document.querySelector('.project-card[data-id="${pid}"] [data-s=project-waiting]')`, 30000));

  // Tidy: the project and its chase task, everywhere.
  await deleteProject(pid); await deleteTask(cid);
  check('tidy: the project and the chase task are gone on the Mac and saved', !(await mac.data()).projects.items.some(p => p.id === pid) && !(await mac.data()).tasks.items.some(t => t.id === cid) && await synced(mac));
  const left = (await pullAll(who)).filter(r => (r.kind === 'project' && r.record_id === pid) || (r.kind === 'task' && r.record_id === cid));
  check('tidy: in the account they are deletion markers', left.length === 2 && left.every(r => r.deleted), left.map(r => [r.kind, r.deleted]));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('tidy: and the phone has neither', await phone.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !d.projects.items.some(p => p.id === '${pid}') && !d.tasks.items.some(t => t.id === '${cid}'); })()`, 30000));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
