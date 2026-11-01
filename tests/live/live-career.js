// Live check of Career projects on the site (tests/live/run.py), on a disposable account and two throwaway devices (a
// Mac and a 320 px phone): a made-up Career project with a role; an application applied for 12 days ago, so Needs you
// asks "Heard back from …?" and Follow up makes its task; an interview two days ahead with its Prepare task the day
// before, moving the application to Interviewing; a second application closed gently ("Not this time"). The live
// database holds each item exactly, and the project keeps its kind. The phone receives it: the Overview's Career card
// says what's open and the next interview. Then the project (its items with it) and the two tasks are deleted
// everywhere. Never prints account details. Writes to the live database: only with the owner's yes.
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
const PTITLE = 'Live check Career (made up)', ROLE = 'SOC analyst (made up)', CO = 'Acme Security (made up)', CO2 = 'Beta Labs (made up)';
const PREP = `Prepare for ${CO} interview`, FOLLOW = `Follow up: ${CO}`;
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
const setVal = (d, sel, value) => d.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number), t = new Date(y, m - 1, d + n); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); };
const todayIn = d => d.ev(`(() => { const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); })()`);

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('livecr-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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
  const deleteProject = async id => { await mac.open(BASE + `#projects/p/${id}`); if (!await mac.until(`!!document.querySelector('[data-action=project-delete]')`, 10000)) return; await mac.click('[data-action=project-delete]'); await D.sleep(250); await mac.click('[data-action=dialog-confirm]'); await D.sleep(500); };
  const deleteTask = async id => { await mac.open(BASE + `#today/tasks/${id}`); if (!await mac.until(`!!document.querySelector('[data-action=task-delete]')`, 10000)) return; await mac.click('[data-action=task-delete]'); await mac.until(`!!document.querySelector('[data-action=dialog-confirm]')`, 5000); await mac.click('[data-action=dialog-confirm]'); await D.sleep(500); };
  for (const id of (await mac.data()).projects.items.filter(p => p.title === PTITLE).map(p => p.id)) await deleteProject(id);
  for (const id of (await mac.data()).tasks.items.filter(t => t.title === PREP || t.title === FOLLOW).map(t => t.id)) await deleteTask(id);
  await synced(mac);
  const k = await todayIn(mac);
  let pid;
  const items = async () => ((await mac.data()).career?.items || []).filter(x => x.projectId === pid);

  // Mac: a Career project, started as one, with a role.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', PTITLE); await mac.click('[data-action=project-kind][value=career]'); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`, 10000);
  pid = (await mac.data()).projects.items.find(p => p.title === PTITLE)?.id;
  check('mac: a Career project starts with an Applications tab', !!pid && (await projectOf(mac, pid)).template === 'career' && await mac.until(`!!document.querySelector('[data-tab=applications]')`, 10000));
  await mac.open(BASE + `#projects/p/${pid}/applications`); await mac.until(`!!document.getElementById('roleNew')`, 10000);
  await mac.type('#roleNew', ROLE); await mac.click('[data-action=role-add]'); await mac.until(`!!document.querySelector('[data-s=role]')`, 10000);
  const rid = (await items()).find(x => x.type === 'role')?.id;
  // An application applied for 12 days ago, for that role.
  await mac.type('#appCompany', CO); await mac.until(`!!document.querySelector('#appRole option[value="${rid}"]')`, 5000); await pick(mac, '#appRole', rid);
  await mac.click('[data-action=app-applied]'); await mac.until(`!!document.getElementById('appAppliedOn')`, 5000); await setVal(mac, '#appAppliedOn', addDays(k, -12)); await mac.click('[data-action=app-add]');
  await mac.until(`[...document.querySelectorAll('[data-s=application]')].length === 1`, 10000);
  const aid = (await items()).find(x => x.type === 'application')?.id;
  check('mac: the application is at Applied, 12 days ago, for the role', (await items()).find(x => x.id === aid)?.stage === 'applied' && (await items()).find(x => x.id === aid)?.appliedOn === addDays(k, -12) && (await items()).find(x => x.id === aid)?.roleId === rid);
  // Needs you asks; Follow up makes its task.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('[data-s=need][data-id="follow:${aid}"]')`, 15000);
  check('mac: Needs you asks "Heard back from …?"', (await mac.text(`[data-s=need][data-id="follow:${aid}"] [data-s=need-link]`)).includes(`Heard back from ${CO}?`), await mac.text(`[data-s=need][data-id="follow:${aid}"]`));
  await mac.click(`[data-s=need][data-id="follow:${aid}"] [data-action=follow-up]`);
  await mac.until(`!document.querySelector('[data-s=need][data-id="follow:${aid}"]')`, 10000);
  const fid = (await mac.data()).tasks.items.find(t => t.title === FOLLOW)?.id;
  check('mac: Follow up made one task "Follow up: …" for today, and the line has gone', !!fid && (await mac.data()).tasks.items.find(t => t.id === fid).due === k && (await items()).find(x => x.id === aid)?.followedOn === k);
  // An interview in two days: its Prepare task the day before, and Interviewing.
  await mac.open(BASE + `#projects/p/${pid}/applications`); await mac.until(`!!document.querySelector('[data-s=application][data-id="${aid}"] [data-action=app-open]')`, 10000);
  await mac.click(`[data-s=application][data-id="${aid}"] [data-action=app-open]`); await mac.until(`!!document.getElementById('ivNewOn-${aid}')`, 5000);
  await setVal(mac, `#ivNewOn-${aid}`, addDays(k, 2)); await setVal(mac, `#ivNewAt-${aid}`, '10:00'); await pick(mac, `#ivNewKind-${aid}`, 'video'); await mac.click(`[data-s=application][data-id="${aid}"] [data-action=iv-add]`);
  await mac.until(`!!document.querySelector('[data-s=application][data-id="${aid}"] [data-s=interview]')`, 10000);
  const app = (await items()).find(x => x.id === aid), pr = (await mac.data()).tasks.items.find(t => t.title === PREP);
  check('mac: the interview moved it to Interviewing and made its Prepare task the day before', app?.stage === 'interviewing' && app.interviews?.[0]?.on === addDays(k, 2) && app.interviews[0].at === '10:00' && app.interviews[0].kind === 'video' && pr?.due === addDays(k, 1) && pr.projectId === pid, [app, pr?.due]);
  // A second application, closed gently.
  await mac.type('#appCompany', CO2); await mac.click('[data-action=app-add]'); await mac.until(`[...document.querySelectorAll('[data-s=application]')].length === 2`, 10000);
  const bid = (await items()).find(x => x.type === 'application' && x.company === CO2)?.id;
  await mac.click(`[data-s=application][data-id="${bid}"] [data-action=app-open]`); await mac.until(`!!document.querySelector('[data-s=application][data-id="${bid}"] [data-action=app-close]')`, 5000);
  await mac.click(`[data-s=application][data-id="${bid}"] [data-action=app-close]`); await mac.until(`!!document.querySelector('[data-s=application][data-id="${bid}"] [data-action=close-why][data-why="Not this time"]')`, 5000);
  await mac.click(`[data-s=application][data-id="${bid}"] [data-action=close-why][data-why="Not this time"]`); await mac.click(`[data-s=application][data-id="${bid}"] [data-action=close-confirm]`);
  check('mac: the second is closed gently, with why in your words, and folded away', await mac.until(`!!document.querySelector('[data-s=apps-closed] [data-s=application][data-id="${bid}"]')`, 10000)
    && (await items()).find(x => x.id === bid)?.stage === 'closed' && (await items()).find(x => x.id === bid)?.closedWhy === 'Not this time');
  await synced(mac);
  const rows = await pullAll(who), mine = await items();
  check('the live account holds each item exactly, as on the Mac', mine.length === 3 && mine.every(x => same(rows.find(r => r.kind === 'career' && r.record_id === x.id)?.data, x)), rows.filter(r => r.kind === 'career').map(r => r.record_id));
  check('…and the project\'s record keeps its kind', rows.find(r => r.kind === 'project' && r.record_id === pid)?.data?.value?.template === 'career');

  // Phone: receives it.
  await phone.open(BASE + `#projects/p/${pid}`); await synced(phone);
  check('phone: the Overview\'s Career card says what\'s open, the next interview and the role (the closed one isn\'t counted)', await phone.until(`(document.querySelector('[data-s=cr-open]')?.textContent || '') === '1 application open · 1 interviewing'`, 30000)
    && await phone.until(`(document.querySelector('[data-s=cr-next]')?.textContent || '').startsWith(${JSON.stringify(`Next interview: ${CO} — `)}) && document.querySelector('[data-s=cr-next]').textContent.endsWith('at 10:00') && document.querySelector('[data-s=cr-roles]')?.textContent === '1 role you’re aiming for'`, 10000), await phone.text('[data-s=career-card]'));
  await phone.open(BASE + `#projects/p/${pid}/applications`); await phone.until(`!!document.querySelector('[data-s=application]')`, 15000);
  check('phone at 320 px: Applications doesn\'t scroll sideways', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`));

  // Tidy: the project (its items go with it) and the two tasks, everywhere.
  await deleteProject(pid); await deleteTask(pr.id); await deleteTask(fid);
  check('tidy: all gone on the Mac and saved', !(await mac.data()).projects.items.some(p => p.id === pid) && !((await mac.data()).career?.items || []).some(x => x.projectId === pid) && !(await mac.data()).tasks.items.some(t => t.id === pr.id || t.id === fid) && await synced(mac));
  const left = (await pullAll(who)).filter(r => (r.kind === 'career' && mine.some(x => x.id === r.record_id)) || (r.kind === 'project' && r.record_id === pid) || (r.kind === 'task' && (r.record_id === pr.id || r.record_id === fid)));
  check('tidy: in the account they are deletion markers', left.length === 6 && left.every(r => r.deleted), left.map(r => [r.kind, r.deleted]));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('tidy: and the phone has none of it', await phone.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !d.projects.items.some(p => p.id === '${pid}') && !(d.career?.items || []).some(x => x.projectId === '${pid}'); })()`, 30000));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
