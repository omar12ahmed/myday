// Live check of steps inside a task and "Starts after" on the site (tests/live/run.py), on a disposable account and two
// throwaway devices (a Mac and a 320 px phone): a made-up project's task gains two steps (one ticked) and starts after
// another task; the live database holds both inside the task record; the project's next step skips it, and "Why this?"
// says why; the phone receives everything, ticks the last step (the offer to mark the task done appears, nothing is
// marked by itself) and marks the other task done; the Mac receives that and the task no longer starts after anything.
// Then the project and both tasks are deleted, on both devices and in the account. Never prints account details.
// Writes to the live database: only with the owner's yes.
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
const TITLE = 'Live check Steps (made up)', TF = 'Build the frame (made up)', TB = 'Order the boards (made up)';
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

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('livestp-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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
  for (const id of (await mac.data()).tasks.items.filter(t => t.title === TF || t.title === TB).map(t => t.id)) await deleteTask(mac, id);
  await synced(mac);

  // Mac: a made-up project with two tasks, the frame first (so, left alone, MyDay would pick it).
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-add]');
  check('mac: the made-up project is made', await mac.until(`location.hash.startsWith('#projects/p/')`));
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE).id;
  await mac.open(BASE + `#projects/p/${pid}`); await mac.until(`!!document.querySelector('#projectTaskNew')`, 15000);
  for (const title of [TF, TB]) { await mac.type('#projectTaskNew', title); await mac.click('[data-action=project-task-add]'); await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.some(t => t.title === ${JSON.stringify(title)} && t.projectId === '${pid}')`, 10000); await D.sleep(300); }
  const f = await taskBy(mac, TF), b = await taskBy(mac, TB);
  check('mac: both tasks are in the project, the frame first', !!f && !!b && f.projectId === pid && b.projectId === pid && (await mac.until(`document.querySelector('[data-s=next-title]')?.textContent === ${JSON.stringify(TF)}`, 10000)));

  // The frame: two steps, the first ticked; it starts after the boards.
  await mac.open(BASE + `#today/tasks/${f.id}`); await mac.until(`!!document.querySelector('#stepNew')`, 15000);
  for (const w of ['Measure the wall (made up)', 'Cut the boards (made up)']) { const n = ((await taskBy(mac, TF)).steps || []).length; await mac.type('#stepNew', w); await mac.click('[data-action=step-add]'); await mac.until(`(JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === '${f.id}').steps || []).length > ${n}`, 10000); }
  await mac.click('#taskSteps [data-s=step]:first-child [data-s=step-done]');
  check('mac: two steps, the first ticked: "1 of 2 steps"', await mac.until(`document.querySelector('[data-s=steps-count]')?.textContent.trim() === '1 of 2 steps'`, 10000), await mac.text('#taskSteps'));
  await mac.click('[data-action=startsafter-choose]'); await mac.until(`!!document.querySelector('[data-s=startsafter-choice][data-id="${b.id}"]')`, 10000);
  await mac.click(`[data-s=startsafter-choice][data-id="${b.id}"]`);
  check('mac: it starts after the boards', await mac.until(`document.querySelector('[data-s=startsafter-line]')?.textContent.trim() === ${JSON.stringify(`It starts after “${TB}”.`)}`, 10000), await mac.text('#taskStartsAfter'));
  check('mac: saved to the account', await synced(mac));
  const fNow = await taskBy(mac, TF), rowF = (await pullAll(who)).find(r => r.kind === 'task' && r.record_id === f.id);
  check('the live account holds the task with its steps and what it starts after, exactly as on the Mac', !!rowF && !rowF.deleted && same(rowF.data.steps, fNow.steps) && same(rowF.data.after, [b.id]) && fNow.steps.length === 2, rowF?.data && { steps: rowF.data.steps?.length, after: rowF.data.after });
  await mac.open(BASE + `#projects/p/${pid}`);
  // (With one other task, "Why this?" says it's the only one that can start now; the frame is listed "(starts after another task)".)
  check('mac: the project\'s next step is now the boards: "the only task still to do that can start now", the frame "(starts after another task)"', await mac.until(`document.querySelector('[data-s=next-title]')?.textContent === ${JSON.stringify(TB)}`, 10000)
    && (await mac.ev(`document.querySelector('[data-s=next-why-text]')?.textContent || ''`)) === 'MyDay’s pick: it’s the only task still to do that can start now.'
    && await mac.ev(`[...document.querySelectorAll('#projectNextPick option')].some(o => o.textContent === ${JSON.stringify(`${TF} (starts after another task)`)})`), await mac.text('#projectNext'));

  // Phone: receives it; ticks the last step (the offer appears; nothing is marked by itself); marks the boards done.
  await phone.open(BASE + `#today/tasks/${f.id}`); await synced(phone);
  check('phone: receives the steps ("1 of 2 steps") and what it starts after', await phone.until(`document.querySelector('[data-s=steps-count]')?.textContent.trim() === '1 of 2 steps' && document.querySelector('[data-s=startsafter-line]')?.textContent.includes(${JSON.stringify(TB)})`, 30000), await phone.text('#taskSteps'));
  check('phone: exactly the same task as the Mac', same(await taskBy(phone, TF), fNow));
  check('phone at 320 px: nothing scrolls sideways, and the step tick boxes are at least 44 px', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`)
    && await phone.ev(`[...document.querySelectorAll('#taskSteps [data-s=step] label')].every(l => l.getBoundingClientRect().height >= 44)`), await phone.ev(`[document.documentElement.scrollWidth, innerWidth, [...document.querySelectorAll('#taskSteps [data-s=step] label')].map(l => Math.round(l.getBoundingClientRect().height))]`));
  await phone.click('#taskSteps [data-s=step]:last-child [data-s=step-done]');
  check('phone: ticking the last step offers to mark the task done — and doesn\'t do it by itself', await phone.until(`(document.querySelector('[data-s=steps-all-done]')?.textContent || '').includes('All 2 steps done — mark the task done?')`, 10000)
    && (await taskBy(phone, TF)).done === false && await synced(phone));
  await phone.open(BASE + `#today/tasks/${b.id}`); await phone.until(`!!document.querySelector('[data-action=task-toggle]')`, 15000);
  await phone.click('[data-action=task-toggle]');
  check('phone: the boards are marked done and saved', await toast(phone, 'Done — nice.') && await synced(phone));

  // Mac: receives both; the frame starts after nothing now and is the project's next step.
  await mac.open(BASE + '#today/tasks'); await synced(mac);
  check('mac: receives the ticked step, and the frame no longer says what it starts after', await mac.until(`(() => { const row = document.querySelector('.task-li[data-id="${f.id}"]'); return !!row && row.querySelector('[data-s=task-steps]')?.textContent === '2 of 2 steps' && !row.querySelector('[data-s=task-starts-after]'); })()`, 30000), await mac.text(`.task-li[data-id="${f.id}"]`));
  await mac.open(BASE + `#projects/p/${pid}`);
  check('mac: the frame is the next step again', await mac.until(`document.querySelector('[data-s=next-title]')?.textContent === ${JSON.stringify(TF)}`, 15000), await mac.text('#projectNext'));

  // Tidy: the project, then both tasks; gone on both devices and in the account.
  await deleteProject(mac, pid);
  for (const id of [f.id, b.id]) await deleteTask(mac, id);
  check('tidy: the project and both tasks are gone on the Mac and saved', !(await mac.data()).projects.items.some(p => p.id === pid) && !(await mac.data()).tasks.items.some(t => t.id === f.id || t.id === b.id) && await synced(mac));
  const left = (await pullAll(who)).filter(r => (r.kind === 'task' && (r.record_id === f.id || r.record_id === b.id)) || (r.kind === 'project' && r.record_id === pid));
  check('tidy: in the account they are deletion markers', left.length === 3 && left.every(r => r.deleted), left.map(r => [r.kind, r.deleted]));
  await phone.open(BASE + '#today/tasks'); await synced(phone);
  check('tidy: and the phone has none of it', await phone.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !d.projects.items.some(p => p.id === '${pid}') && !d.tasks.items.some(t => t.id === '${f.id}' || t.id === '${b.id}'); })()`, 30000));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
