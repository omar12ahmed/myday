// Live check of decisions backed by evidence and tasks toward milestones on the site (tests/live/run.py), on a
// disposable account and two throwaway devices (a Mac and a 320 px phone): a made-up Research project gets a decision
// with two options, a finding that supports one, and that option chosen — the decision keeps "1 finding for" with the
// choice; a milestone and a task toward it. The live database holds the decision's evidence, the finding about the
// option and the task's milestone exactly; the phone receives them ("with 1 finding for", "0 of 1 tasks done") and
// ticks the task, which reaches the Mac ("1 of 1"). Then the project and its task are deleted everywhere. Never prints
// account details. Writes to the live database: only with the owner's yes.
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
const TITLE = 'Live check Evidence (made up)', TASK = 'Pour the slab (made up)';
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
const hex = id => Buffer.from(id, 'utf8').toString('hex');
const pick = (d, sel, value) => d.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
const projectOf = async (d, id) => (await d.data()).projects.items.find(p => p.id === id);

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('liveev-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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
  for (const id of (await mac.data()).tasks.items.filter(t => t.title === TASK).map(t => t.id)) await deleteTask(id);
  await synced(mac);

  // Mac: a made-up Research project, its decision with two options.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-kind][value=research]'); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`);
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE)?.id;
  await mac.open(BASE + `#projects/p/${pid}/decisions`); await mac.until(`!!document.getElementById('dcNew')`, 15000);
  await mac.type('#dcNew', 'Larch or pine? (made up)'); await mac.click('[data-action=dc-add]');
  await mac.until(`(JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${pid}').decisions || []).length === 1`, 5000);
  const did = (await projectOf(mac, pid)).decisions[0].id;
  for (const o of ['Larch', 'Pine']) { await mac.until(`!!document.getElementById('dcOpt-${did}')`, 5000); await mac.type(`#dcOpt-${did}`, o); await mac.click('[data-action=opt-add]'); await mac.until(`(JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${pid}').decisions[0].options || []).some(x => x.text === '${o}')`, 5000); }
  const oL = (await projectOf(mac, pid)).decisions[0].options.find(o => o.text === 'Larch').id;
  check('mac: a made-up Research project with a decision and two options', !!pid && (await projectOf(mac, pid)).decisions[0].options.length === 2);

  // A finding that supports Larch.
  await mac.open(BASE + `#projects/p/${pid}/research`); await mac.until(`!!document.querySelector('[data-action=research-finding-add]')`, 15000);
  await mac.click('[data-action=research-finding-add]'); await mac.until(`!!document.getElementById('rfN-text')`, 5000);
  await mac.type('#rfN-text', 'Larch lasts 25 years untreated (made up)');
  await pick(mac, `select[aria-label="How it bears on “Larch — Larch or pine? (made up)”"]`, 'supports');
  await mac.click('[data-action=research-finding-save]');
  check('mac: a finding supporting the Larch option is saved', await toast(mac, 'Finding added.') && (await mac.data()).research.items.some(x => x.projectId === pid && x.type === 'finding' && x.about?.some(a => a.kind === 'option' && a.id === oL && a.stance === 'supports')));

  // Choosing Larch keeps its evidence.
  await mac.open(BASE + `#projects/p/${pid}/decisions`); await mac.until(`!!document.querySelector('[data-s=opt-evidence]')`, 15000);
  check('mac: Larch shows "1 finding: 1 for"', (await mac.text('[data-s=opt-evidence]')) === '1 finding: 1 for', await mac.text('[data-s=opt-evidence]'));
  await mac.click('[data-action=opt-choose]'); await mac.until(`!!document.querySelector('[data-s=dc-choosing-evidence]')`, 5000);
  await mac.click('[data-action=dc-decide]');
  check('mac: chosen, "— with 1 finding for", and the decision keeps it', await toast(mac, 'Decided.') && await mac.until(`(document.querySelector('[data-s=dc-evidence]')?.textContent || '').includes('with 1 finding for')`, 5000)
    && same((await projectOf(mac, pid)).decisions[0].chosenEvidence, { for: 1, against: 0 }));

  // A milestone and a task toward it.
  await mac.open(BASE + `#projects/p/${pid}/milestones`); await mac.until(`!!document.getElementById('msNew')`, 15000);
  await mac.type('#msNew', 'Base laid (made up)'); await mac.click('[data-action=ms-add]');
  await mac.until(`(JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${pid}').milestones || []).length === 1`, 5000);
  const mid = (await projectOf(mac, pid)).milestones[0].id;
  await mac.open(BASE + `#projects/p/${pid}`); await mac.until(`!!document.getElementById('projectTaskNew')`, 15000);
  await mac.type('#projectTaskNew', TASK); await mac.click('[data-action=project-task-add]');
  await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.some(t => t.title === ${JSON.stringify(TASK)})`, 10000);
  const tid = (await mac.data()).tasks.items.find(t => t.title === TASK).id;
  await mac.open(BASE + `#today/tasks/${tid}`); await mac.until(`!!document.getElementById('tMilestone')`, 15000);
  await pick(mac, '#tMilestone', mid);
  check('mac: the task counts toward the milestone', await toast(mac, 'It counts toward that milestone now.') && (await mac.data()).tasks.items.find(t => t.id === tid).milestoneId === mid && await synced(mac));

  const rows = await pullAll(who), dec = rows.find(r => r.kind === 'project_decision' && r.record_id === `${hex(pid)}.${hex(did)}`), task = rows.find(r => r.kind === 'task' && r.record_id === tid);
  const fRow = rows.find(r => r.kind === 'research' && r.data?.projectId === pid && r.data?.type === 'finding');
  check('the live account holds the decision\'s evidence, the finding about the option and the task\'s milestone, exactly as on the Mac', same(dec?.data?.value?.chosenEvidence, { for: 1, against: 0 })
    && same(fRow?.data?.about, [{ kind: 'option', id: oL, stance: 'supports' }]) && task?.data?.milestoneId === mid, { dec: dec?.data?.value?.chosenEvidence, about: fRow?.data?.about, ms: task?.data?.milestoneId });

  // Phone: receives it; ticks the task.
  await phone.open(BASE + `#projects/p/${pid}/decisions`); await synced(phone);
  check('phone: receives the choice with "— with 1 finding for"', await phone.until(`(document.querySelector('[data-s=dc-evidence]')?.textContent || '').includes('with 1 finding for')`, 30000));
  check('phone at 320 px: the Decisions tab doesn\'t scroll sideways', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`));
  await phone.open(BASE + `#projects/p/${pid}/milestones`);
  check('phone: the milestone says "0 of 1 tasks done"', await phone.until(`(document.querySelector('[data-action=ms-tasks]')?.textContent || '') === '0 of 1 tasks done'`, 15000));
  await phone.open(BASE + `#today/tasks/${tid}`); await phone.until(`!!document.querySelector('[data-action=task-toggle]')`, 15000);
  await phone.click('[data-action=task-toggle]');
  check('phone: the task is marked done and saved', await toast(phone, 'Done — nice.') && await synced(phone));
  await mac.open(BASE + `#projects/p/${pid}/milestones`); await synced(mac);
  check('mac: receives it — "1 of 1 tasks done"', await mac.until(`(document.querySelector('[data-action=ms-tasks]')?.textContent || '') === '1 of 1 tasks done'`, 30000));

  // Tidy: the project (its research goes with it) and the task, everywhere.
  await deleteProject(pid); await deleteTask(tid);
  check('tidy: the project and the task are gone on the Mac and saved', !(await mac.data()).projects.items.some(p => p.id === pid) && !(await mac.data()).tasks.items.some(t => t.id === tid) && await synced(mac));
  const left = (await pullAll(who)).filter(r => (r.kind === 'project' && r.record_id === pid) || (r.kind === 'task' && r.record_id === tid) || (r.kind === 'research' && r.data?.projectId === pid));
  check('tidy: in the account they are deletion markers', left.every(r => r.deleted) && left.some(r => r.kind === 'project'), left.map(r => [r.kind, r.deleted]));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('tidy: and the phone has none of it', await phone.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !d.projects.items.some(p => p.id === '${pid}') && !d.tasks.items.some(t => t.id === '${tid}'); })()`, 30000));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
