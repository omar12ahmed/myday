// Live check of deadlines you can trust on the site (tests/live/run.py), on a disposable account and two throwaway
// devices (a Mac and a 320 px phone): a made-up Case's "Add a deadline" makes a firm deadline with where its date comes
// from; Coming up says "Firm deadline"; the task's page adds who checked it and when; the live database holds those
// details inside the task record exactly; the phone receives them, marks the task done and, offered, notes it on the
// case's timeline with one tap; the Mac receives the entry ("Done: …", on that day) and the task says it's noted. Then
// the project and the task are deleted, on both devices and in the account. Never prints account details. Writes to
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
const TITLE = 'Live check Deadlines (made up)', TD = 'Send my witness statement (made up)', FROM = 'The tribunal letter (made up)', BY = 'My adviser (made up)';
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
// Records compared by content: the database stores JSON with its keys in its own order.
const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const taskBy = (d, title) => d.ev(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.title === ${JSON.stringify(title)}) ?? null`);
// A day on the device's own calendar, as MyDay keys it (YYYY-MM-DD).
const dayOn = (d, n) => d.ev(`(() => { const x = new Date(); x.setDate(x.getDate() + ${n}); return x.toLocaleDateString('sv'); })()`);

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('livedl-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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
  const deleteProject = async (d, id) => { await d.open(BASE + `#projects/p/${id}`); await d.until(`!!document.querySelector('[data-action=project-delete]')`); await d.click('[data-action=project-delete]'); await D.sleep(250); await d.click('[data-action=dialog-confirm]'); await D.sleep(500); };
  const deleteTask = async (d, id) => { await d.open(BASE + `#today/tasks/${id}`); if (!await d.until(`!!document.querySelector('[data-action=task-delete]')`, 10000)) return; await d.click('[data-action=task-delete]'); await d.until(`!!document.querySelector('[data-action=dialog-confirm]')`, 5000); await d.click('[data-action=dialog-confirm]'); await D.sleep(500); };

  // Tidy first: anything left by an earlier stopped run.
  for (const id of (await mac.data()).projects.items.filter(p => p.title === TITLE).map(p => p.id)) await deleteProject(mac, id);
  for (const id of (await mac.data()).tasks.items.filter(t => t.title === TD).map(t => t.id)) await deleteTask(mac, id);
  await synced(mac);

  // Mac: a made-up Case; "Add a deadline" in five days, with where its date comes from.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-kind][value=case]'); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`);
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE)?.id;
  check('mac: the made-up Case is made', !!pid && (await mac.data()).projects.items.find(p => p.id === pid).template === 'case');
  await mac.open(BASE + `#projects/p/${pid}`); await mac.until(`!!document.querySelector('[data-action=case-deadline]')`, 15000);
  const due = await dayOn(mac, 5), today = await dayOn(mac, 0);
  await mac.click('[data-action=case-deadline]'); await mac.until(`!!document.getElementById('caseDlTitle')`, 5000);
  await mac.type('#caseDlTitle', TD); await mac.type('#caseDlFrom', FROM); await mac.type('#caseDlDate', due); await mac.click('[data-action=case-deadline-add]');
  check('mac: "Add a deadline" says "Firm deadline added — it reaches Today on its day."', await toast(mac, 'Firm deadline added — it reaches Today on its day.'));
  const t0 = await taskBy(mac, TD);
  check('mac: it\'s a dated task in the case, a firm deadline with where its date comes from', !!t0 && t0.projectId === pid && t0.due === due && t0.deadline?.kind === 'firm' && t0.deadline.from === FROM, t0 && { due: t0.due, deadline: t0.deadline });
  check('mac: Coming up lists it as a firm deadline', await mac.until(`[...document.querySelectorAll('#projectSoon [data-s=soon-deadline]')].some(s => s.textContent.includes('Firm deadline'))`, 10000), await mac.text('#projectSoon'));

  // Its page: who checked it, and when.
  await mac.open(BASE + `#today/tasks/${t0.id}`); await mac.until(`!!document.getElementById('tDlBy')`, 15000);
  check('mac: the Deadline card shows it as firm, with where its date comes from', await mac.ev(`document.querySelector('[data-action=deadline-kind][data-id=firm]').getAttribute('aria-pressed') === 'true' && document.getElementById('tDlFrom').value === ${JSON.stringify(FROM)}`), await mac.text('#taskDeadline'));
  await mac.type('#tDlBy', BY); await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === '${t0.id}').deadline.checkedBy === ${JSON.stringify(BY)}`, 5000);
  await mac.type('#tDlOn', today); await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === '${t0.id}').deadline.checkedOn === '${today}'`, 5000);
  check('mac: saved to the account', await synced(mac));
  const t1 = await taskBy(mac, TD), row = (await pullAll(who)).find(r => r.kind === 'task' && r.record_id === t0.id);
  check('the live account holds the task with its deadline details, exactly as on the Mac', !!row && !row.deleted && same(row.data.deadline, t1.deadline) && same(t1.deadline, { kind: 'firm', from: FROM, checkedBy: BY, checkedOn: today }), row?.data && Object.keys(row.data.deadline || {}));

  // Phone: receives it; marks it done; the offer appears (nothing noted by itself); one tap notes it.
  await phone.open(BASE + `#today/tasks/${t0.id}`); await synced(phone);
  check('phone: receives the deadline details', await phone.until(`document.getElementById('tDlFrom')?.value === ${JSON.stringify(FROM)} && document.getElementById('tDlBy')?.value === ${JSON.stringify(BY)} && document.getElementById('tDlOn')?.value === '${today}'`, 30000), await phone.text('#taskDeadline'));
  check('phone: exactly the same task as the Mac', same(await taskBy(phone, TD), t1));
  check('phone at 320 px: nothing scrolls sideways; the choices and fields are at least 44 px tall', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`)
    && await phone.ev(`[...document.querySelectorAll('#taskDeadline button, #taskDeadline input')].every(b => b.getBoundingClientRect().height >= 44)`), await phone.ev(`[document.documentElement.scrollWidth, innerWidth]`));
  await phone.click('[data-action=task-toggle]');
  check('phone: done, it offers to note it on the case\'s timeline — and doesn\'t by itself', await toast(phone, 'Done — nice.') && await phone.until(`!!document.querySelector('[data-s=deadline-offer] [data-action=deadline-note]')`, 10000)
    && !(await taskBy(phone, TD)).deadline.noted, await phone.text('#taskDeadline'));
  await phone.click('[data-action=deadline-note]');
  check('phone: one tap notes it ("Noted on the timeline."; the card says so) and it\'s saved', await toast(phone, 'Noted on the timeline.') && await phone.until(`!!document.querySelector('[data-s=deadline-noted]') && !document.querySelector('[data-s=deadline-offer]')`, 10000) && await synced(phone));
  const noted = (await taskBy(phone, TD)).deadline.noted;
  const entryRow = (await pullAll(who)).find(r => r.kind === 'project_timeline' && !r.deleted && r.data?.projectId === pid && r.data?.value?.id === noted);
  check('the live account holds the entry "Done: …" on the day it was done, as your account', !!noted && !!entryRow && entryRow.data.value.title === `Done: ${TD}` && entryRow.data.value.date === today && entryRow.data.value.source === 'mine', entryRow?.data?.value && { title: entryRow.data.value.title === `Done: ${TD}`, date: entryRow.data.value.date, source: entryRow.data.value.source });

  // Mac: receives both; the task says it's noted, and Worth a look doesn't offer it.
  await mac.open(BASE + `#today/tasks/${t0.id}`); await synced(mac);
  check('mac: receives it — the task is done and "Noted on the case\'s timeline."', await mac.until(`!!document.querySelector('[data-s=deadline-noted]') && !document.querySelector('[data-s=deadline-offer]')`, 30000)
    && (await taskBy(mac, TD)).done === true && (await mac.data()).projects.items.find(p => p.id === pid).case.timeline.some(e => e.id === noted && e.title === `Done: ${TD}`), await mac.text('#taskDeadline'));
  await mac.open(BASE + `#projects/p/${pid}`); await mac.until(`!!document.querySelector('#projectGlance')`, 15000);
  check('mac: the case\'s Worth a look doesn\'t offer it again', !(await mac.exists('[data-pointer=deadline-done]')));

  // Tidy: the project, then the task; gone on both devices and in the account.
  await deleteProject(mac, pid);
  await deleteTask(mac, t0.id);
  check('tidy: the project and the task are gone on the Mac and saved', !(await mac.data()).projects.items.some(p => p.id === pid) && !(await mac.data()).tasks.items.some(t => t.id === t0.id) && await synced(mac));
  const left = (await pullAll(who)).filter(r => (r.kind === 'task' && r.record_id === t0.id) || (r.kind === 'project' && r.record_id === pid));
  check('tidy: in the account they are deletion markers', left.length === 2 && left.every(r => r.deleted), left.map(r => [r.kind, r.deleted]));
  await phone.open(BASE + '#today/tasks'); await synced(phone);
  check('tidy: and the phone has none of it', await phone.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !d.projects.items.some(p => p.id === '${pid}') && !d.tasks.items.some(t => t.id === '${t0.id}'); })()`, 30000));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
