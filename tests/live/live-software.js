// Live check of Software projects on the site (tests/live/run.py), on a disposable account and two throwaway devices (a
// Mac and a 320 px phone): a made-up Software project is started with a made-up pull-request link; a milestone is marked
// as a release; a requirement with one acceptance check is put in it and points at the link; a bug is added, given a
// "Fix: …" task and put in the release. The release checklist says what's left, then — the check ticked with what
// proved it and the bug fixed — that it's ready. The live database holds each item exactly, and the project keeps its
// kind and the marked link. The phone receives it: the Overview's Software card says the release is ready. Then the
// project (its items with it) and the task are deleted everywhere. Never prints account details. Writes to the live
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
const PTITLE = 'Live check Software (made up)', MS = 'Release 0.1 (made up)', REQ = 'A plan survives a reload (made up)', CHECK = 'Reload keeps the plan (made up)', BUG = 'The timer stops (made up)', TASK = `Fix: ${BUG}`;
const LINK = 'https://github.com/example/live-check-made-up/pull/1';
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
    const d = await D.device('livesw-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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
  for (const id of (await mac.data()).tasks.items.filter(t => t.title === TASK).map(t => t.id)) await deleteTask(id);
  await synced(mac);
  const items = async () => ((await mac.data()).software?.items || []).filter(x => x.projectId === pid);
  let pid;

  // Mac: a Software project, started as one.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', PTITLE); await mac.click('[data-action=project-kind][value=software]'); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`, 10000);
  pid = (await mac.data()).projects.items.find(p => p.title === PTITLE)?.id;
  check('mac: a Software project starts with Requirements and Bugs tabs', !!pid && (await projectOf(mac, pid)).template === 'software' && await mac.until(`!!document.querySelector('[data-tab=requirements]') && !!document.querySelector('[data-tab=bugs]')`, 10000));
  // A link marked as a pull request.
  await mac.until(`!!document.querySelector('[data-action=section-open][data-id=resources]')`, 10000); await mac.click('[data-action=section-open][data-id=resources]'); await mac.until(`!!document.getElementById('resourceUrl-new')`, 5000);
  await mac.type('#resourceUrl-new', LINK); await pick(mac, '#resourceKind-new', 'pr'); await mac.click('[data-action=resource-save]');
  check('mac: the link is marked as a pull request, and says where it points (never its state)', await mac.until(`[...document.querySelectorAll('[data-s=resource-kind]')].some(e => e.textContent === 'Pull request · Pull request #1 · example/live-check-made-up')`, 10000)
    && (await projectOf(mac, pid)).resources?.[0]?.kind === 'pr');
  const lid = (await projectOf(mac, pid)).resources[0].id;
  // A milestone marked as a release.
  await mac.open(BASE + `#projects/p/${pid}/milestones`); await mac.until(`!!document.getElementById('msNew')`, 10000);
  await mac.type('#msNew', MS); await mac.click('[data-action=ms-add]'); await mac.until(`!!document.querySelector('[data-action=release-mark]')`, 10000);
  await mac.click('[data-action=release-mark]');
  check('mac: the milestone is now a release with its checklist', await mac.until(`!!document.querySelector('[data-s=release] [data-s=release-ready]')`, 10000));
  const rid = (await items()).find(x => x.type === 'release')?.id;
  // A requirement with an acceptance check, in the release, pointing at the link.
  await mac.open(BASE + `#projects/p/${pid}/requirements`); await mac.until(`!!document.getElementById('reqNew')`, 10000);
  await mac.type('#reqNew', REQ); await mac.click('[data-action=req-add]');
  await mac.until(`!!document.querySelector('[data-s=requirement] details[open]')`, 10000);
  const qid = (await items()).find(x => x.type === 'requirement')?.id;
  await mac.type(`#checkNew-${qid}`, CHECK); await mac.click(`[data-s=requirement][data-id="${qid}"] [data-action=check-add]`);
  await mac.until(`!!document.querySelector('[data-s=requirement][data-id="${qid}"] [data-s=check]')`, 5000);
  await pick(mac, `#reqRelease-${qid}`, rid); await D.sleep(300);
  await mac.click(`[data-s=requirement][data-id="${qid}"] [data-action=item-link][value="${lid}"]`); await D.sleep(300);
  const req = (await items()).find(x => x.id === qid);
  check('mac: the requirement has its acceptance check, is in the release and points at the link', req?.checks?.length === 1 && req.releaseId === rid && req.linkIds?.[0] === lid, req);
  // A bug with a "Fix: …" task, in the release.
  await mac.open(BASE + `#projects/p/${pid}/bugs`); await mac.until(`!!document.getElementById('bugNew')`, 10000);
  await mac.type('#bugNew', BUG); await mac.type('#bugNewHappens', 'It stops when the phone locks'); await mac.click('[data-action=bug-add]');
  await mac.until(`!!document.querySelector('[data-s=bug] [data-action=bug-open]')`, 10000);
  const bid = (await items()).find(x => x.type === 'bug')?.id;
  await mac.click(`[data-s=bug][data-id="${bid}"] [data-action=bug-open]`); await mac.until(`!!document.querySelector('[data-s=bug][data-id="${bid}"] [data-action=bug-fix]')`, 5000);
  await mac.click(`[data-s=bug][data-id="${bid}"] [data-action=bug-fix]`);
  await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.some(t => t.title === ${JSON.stringify(TASK)})`, 10000);
  await pick(mac, `#bugRelease-${bid}`, rid); await D.sleep(300);
  const tid = (await mac.data()).tasks.items.find(t => t.title === TASK)?.id;
  check('mac: "Fix it" made one project task "Fix: …", and the bug is in the release', !!tid && (await mac.data()).tasks.items.find(t => t.id === tid).projectId === pid && (await items()).find(x => x.id === bid)?.taskId === tid && (await items()).find(x => x.id === bid)?.releaseId === rid);
  // The release checklist: what's left, then ready.
  await mac.open(BASE + `#projects/p/${pid}/milestones`);
  check('mac: the release checklist says what\'s left: "1 check left · 1 bug open"', await mac.until(`(document.querySelector('[data-s=release-ready]')?.textContent || '') === '1 check left · 1 bug open'`, 10000), await mac.text('[data-s=release-ready]'));
  await mac.click(`[data-s=release] [data-s=check] [data-action=check-tick]`); await mac.until(`!!document.querySelector('[data-s=release] [data-s=check-proof]')`, 5000);
  await mac.type(`#proof-${req.checks[0].id}`, 'Checked by hand on the Mac (made up)'); await mac.ev(`document.getElementById('proof-${req.checks[0].id}').blur()`); await D.sleep(300);
  await mac.open(BASE + `#projects/p/${pid}/bugs`); await mac.until(`!!document.querySelector('[data-s=bug][data-id="${bid}"] [data-action=bug-open]')`, 10000);
  await mac.click(`[data-s=bug][data-id="${bid}"] [data-action=bug-open]`); await mac.until(`!!document.querySelector('[data-s=bug][data-id="${bid}"] [data-action=bug-state][data-state=fixed]')`, 5000);
  await mac.click(`[data-s=bug][data-id="${bid}"] [data-action=bug-state][data-state=fixed]`); await D.sleep(300);
  await mac.open(BASE + `#projects/p/${pid}/milestones`);
  check('mac: ticked with what proved it and the bug fixed, the release is ready', await mac.until(`document.querySelector('[data-s=release-ready]')?.dataset.ready === 'yes' && document.querySelector('[data-s=release-ready]').textContent === 'Ready: every check ticked and no bug open'`, 10000)
    && (await items()).find(x => x.id === qid)?.checks?.[0]?.proof === 'Checked by hand on the Mac (made up)', await mac.text('[data-s=release]'));
  await synced(mac);
  const rows = await pullAll(who), mine = await items();
  check('the live account holds each item exactly, as on the Mac', mine.length === 3 && mine.every(x => same(rows.find(r => r.kind === 'software' && r.record_id === x.id)?.data, x)), rows.filter(r => r.kind === 'software').map(r => r.record_id));
  const pRow = rows.find(r => r.kind === 'project' && r.record_id === pid)?.data?.value;
  check('…and the project\'s record keeps its kind and the marked link', pRow?.template === 'software' && pRow?.resources?.[0]?.kind === 'pr', pRow && { template: pRow.template, resources: pRow.resources });

  // Phone: receives it.
  await phone.open(BASE + `#projects/p/${pid}`); await synced(phone);
  check('phone: the Overview\'s Software card says the release is ready', await phone.until(`(document.querySelector('[data-s=sw-release]')?.textContent || '') === ${JSON.stringify(`Next release: ${MS} — Ready: every check ticked and no bug open`)}`, 30000)
    && await phone.until(`(document.querySelector('[data-s=sw-requirements]')?.textContent || '') === '1 requirement · 1 of 1 acceptance checks ticked' && document.querySelector('[data-s=sw-bugs]')?.textContent === 'No bugs open'`, 10000), await phone.text('[data-s=software-card]'));
  await phone.open(BASE + `#projects/p/${pid}/requirements`); await phone.until(`!!document.querySelector('[data-s=requirement]')`, 15000);
  check('phone at 320 px: Requirements doesn\'t scroll sideways', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`));

  // Tidy: the project (its items go with it) and the task, everywhere.
  await deleteProject(pid); await deleteTask(tid);
  check('tidy: all gone on the Mac and saved', !(await mac.data()).projects.items.some(p => p.id === pid) && !((await mac.data()).software?.items || []).some(x => x.projectId === pid) && !(await mac.data()).tasks.items.some(t => t.id === tid) && await synced(mac));
  const left = (await pullAll(who)).filter(r => (r.kind === 'software' && mine.some(x => x.id === r.record_id)) || (r.kind === 'project' && r.record_id === pid) || (r.kind === 'task' && r.record_id === tid));
  check('tidy: in the account they are deletion markers', left.length === 5 && left.every(r => r.deleted), left.map(r => [r.kind, r.deleted]));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('tidy: and the phone has none of it', await phone.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !d.projects.items.some(p => p.id === '${pid}') && !(d.software?.items || []).some(x => x.projectId === '${pid}'); })()`, 30000));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
