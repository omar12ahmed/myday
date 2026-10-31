// Live check of Ambitions on the site (tests/live/run.py), on a disposable account and two throwaway devices (a Mac and
// a 320 px phone): a made-up ambition is named on the Projects home and linked to a made-up project (with a task, its
// next step) and the Arabic route, with two steps of its own; Today's From your projects says "A step towards …" under
// the project's step. The live database holds the ambition's record exactly. The phone receives it: the card on the
// Projects home, the ambition's page with where its links stand, and the project's line. Then the ambition, project
// and task are deleted everywhere. Never prints account details. Writes to the live database: only with the owner's yes.
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
const TITLE = 'Live check Ambition (made up)', PTITLE = 'Live check Ambition project (made up)', TASK = 'Book the exam (made up)';
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
const pick = (d, sel, value) => d.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
const todayIn = d => d.ev(`(() => { const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); })()`);

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('liveamb-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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
  const deleteAmbition = async id => { await mac.open(BASE + `#projects/a/${id}`); if (!await mac.until(`!!document.querySelector('[data-action=ambition-delete]')`, 10000)) return; await mac.click('[data-action=ambition-delete]'); await mac.until(`!!document.querySelector('[data-action=dialog-confirm]')`, 5000); await mac.click('[data-action=dialog-confirm]'); await D.sleep(500); };
  for (const id of ((await mac.data()).ambitions?.items || []).filter(a => a.title === TITLE).map(a => a.id)) await deleteAmbition(id);
  for (const id of (await mac.data()).projects.items.filter(p => p.title === PTITLE).map(p => p.id)) await deleteProject(id);
  for (const id of (await mac.data()).tasks.items.filter(t => t.title === TASK).map(t => t.id)) await deleteTask(id);
  await synced(mac);

  // Mac: a made-up project with a task (its next step).
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', PTITLE); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`);
  const pid = (await mac.data()).projects.items.find(p => p.title === PTITLE)?.id;
  await mac.open(BASE + `#projects/p/${pid}`); await mac.until(`!!document.getElementById('projectTaskNew')`, 15000);
  await mac.type('#projectTaskNew', TASK); await mac.click('[data-action=project-task-add]');
  await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.some(t => t.title === ${JSON.stringify(TASK)})`, 10000);
  const tid = (await mac.data()).tasks.items.find(t => t.title === TASK).id;

  // The ambition: named on the Projects home, linked to the project and the Arabic route, two steps.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('[data-action=ambition-new]')`, 15000);
  await mac.click('[data-action=ambition-new]'); await mac.until(`!!document.getElementById('ambitionNew')`, 5000);
  await mac.type('#ambitionNew', TITLE); await mac.type('#ambitionWhy', 'A made-up reason'); await mac.click('[data-action=ambition-add]');
  await mac.until(`location.hash.startsWith('#projects/a/')`, 10000);
  const aid = ((await mac.data()).ambitions?.items || []).find(a => a.title === TITLE)?.id;
  check('mac: an ambition named on the Projects home opens its page', !!aid && await mac.until(`(document.getElementById('ambitionH')?.textContent || '') === ${JSON.stringify(TITLE)}`, 10000));
  await pick(mac, '#linkKind', 'project'); await mac.until(`!!document.querySelector('#linkRef option[value="${pid}"]')`, 5000); await pick(mac, '#linkRef', pid); await mac.click('[data-action=link-add]');
  await mac.until(`document.querySelectorAll('[data-s=ambition-link]').length === 1`, 5000);
  await pick(mac, '#linkKind', 'arabic'); await mac.click('[data-action=link-add]');
  await mac.until(`document.querySelectorAll('[data-s=ambition-link]').length === 2`, 5000);
  for (const st of ['Learn the basics (made up)', 'Book the exam (made up)']) { await mac.type('#stepNew', st); await mac.click('[data-action=step-add]'); await mac.until(`[...document.querySelectorAll('[data-s=ambition-step]')].length >= 1`, 5000); await D.sleep(300); }
  const amb = ((await mac.data()).ambitions.items || []).find(a => a.id === aid);
  check('mac: linked to the project and the Arabic route, with two steps', (amb.links || []).some(l => l.kind === 'project' && l.ref === pid) && (amb.links || []).some(l => l.kind === 'arabic') && (amb.steps || []).length === 2, amb);
  check('mac: the project link says where it stands ("next: …")', await mac.until(`[...document.querySelectorAll('[data-s=ambition-link][data-kind=project] [data-s=link-where]')].some(x => x.textContent.includes(${JSON.stringify('next: ' + TASK)}))`, 10000));
  await mac.open(BASE + '#today'); await synced(mac);
  check('mac: Today says "A step towards …" under the project\'s step', await mac.until(`[...document.querySelectorAll('[data-s=project-step][data-id="${tid}"] [data-s=task-towards]')].some(x => x.textContent === ${JSON.stringify('A step towards “' + TITLE + '”')})`, 15000),
    await mac.ev(`[...document.querySelectorAll('[data-s=task-towards]')].map(x => x.textContent)`));
  const row = (await pullAll(who)).find(r => r.kind === 'ambition' && r.record_id === aid);
  check('the live account holds the ambition\'s record exactly, as on the Mac', same(row?.data, ((await mac.data()).ambitions.items || []).find(a => a.id === aid)), row?.data);

  // Phone: receives it.
  await phone.open(BASE + '#projects'); await synced(phone);
  check('phone: Your ambitions shows its card (a project, the Arabic route, its steps)', await phone.until(`(document.querySelector('[data-s=ambition-card][data-id="${aid}"]')?.textContent || '').includes('1 project · the Arabic route · 0 of 2 steps')`, 30000),
    await phone.text(`[data-s=ambitions]`));
  check('phone at 320 px: the Projects home doesn\'t scroll sideways', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`));
  await phone.open(BASE + `#projects/p/${pid}`);
  check('phone: the project\'s page says "A step towards …"', await phone.until(`(document.querySelector('[data-s=project-towards]')?.textContent || '') === ${JSON.stringify('A step towards “' + TITLE + '”')}`, 15000));

  // Tidy: the ambition, the project and the task, everywhere.
  await deleteAmbition(aid); await deleteProject(pid); await deleteTask(tid);
  check('tidy: all gone on the Mac and saved', !((await mac.data()).ambitions?.items || []).some(a => a.id === aid) && !(await mac.data()).projects.items.some(p => p.id === pid) && !(await mac.data()).tasks.items.some(t => t.id === tid) && await synced(mac));
  const left = (await pullAll(who)).filter(r => (r.kind === 'ambition' && r.record_id === aid) || (r.kind === 'project' && r.record_id === pid) || (r.kind === 'task' && r.record_id === tid));
  check('tidy: in the account they are deletion markers', left.length === 3 && left.every(r => r.deleted), left.map(r => [r.kind, r.deleted]));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('tidy: and the phone has none of it', await phone.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !(d.ambitions?.items || []).some(a => a.id === '${aid}') && !d.projects.items.some(p => p.id === '${pid}'); })()`, 30000));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
