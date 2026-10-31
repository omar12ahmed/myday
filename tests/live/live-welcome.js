// Live check of Welcome back on the site (tests/live/run.py), on a disposable account and one throwaway Mac: a made-up
// project, its last work moved 18 days back on this device (its task done then), greets you on its Overview ("Away 2
// weeks"; what you did last; where you left off; the next step); "Got it" puts it away on this device until the next
// break (a reload keeps it away), and the Projects home says "Away 2 weeks". Then the project is deleted everywhere.
// Never prints account details. Writes to the live database (the project and its deletion): only with the owner's yes.
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
const TITLE = 'Live check Welcome (made up)', TASK = 'Order the boards (made up)';
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

(async () => {
  await D.connect();
  const mac = await D.device('livewb-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#projects');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('mac: signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`mac: shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}') && !document.querySelector('#appVersion').textContent.includes('+changes')`));
  const who = await signIn();
  const deleteProject = async id => { await mac.open(BASE + `#projects/p/${id}`); await mac.until(`!!document.querySelector('[data-action=project-delete]')`); await mac.click('[data-action=project-delete]'); await D.sleep(250); await mac.click('[data-action=dialog-confirm]'); await D.sleep(500); };
  for (const id of (await mac.data()).projects.items.filter(p => p.title === TITLE).map(p => p.id)) await deleteProject(id);
  await synced(mac);

  // A made-up project with a task, made the usual way…
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`);
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE)?.id;
  await mac.open(BASE + `#projects/p/${pid}`); await mac.until(`!!document.querySelector('#projectTaskNew')`, 15000);
  await mac.type('#projectTaskNew', TASK); await mac.click('[data-action=project-task-add]');
  check('mac: the made-up project and its task are made, with no welcome (it was just worked on)', !!pid && await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.some(t => t.title === ${JSON.stringify(TASK)})`, 10000)
    && !(await mac.exists('#projectWelcome')) && await synced(mac));
  // …then its last work moved 18 days back on this device: the task done then, the project last changed the day before.
  const day = n => mac.ev(`(() => { const x = new Date(); x.setDate(x.getDate() + (${n})); return x.toLocaleDateString('sv'); })()`);
  const d18 = await day(-18), d19 = await day(-19), d20 = await day(-20);
  await mac.setData(`s => { const p = s.projects.items.find(x => x.id === '${pid}'); p.createdAt = '${d20}T09:00'; p.updatedAt = '${d19}T17:00'; p.leftOff = { text: 'Boards ordered; next: measure the door (made up).', at: '${d19}T17:00' };
    const t = s.tasks.items.find(x => x.title === ${JSON.stringify(TASK)}); t.createdAt = '${d19}T09:00'; t.done = true; t.doneOn = '${d18}'; s.tasks.items.push({ ...t, id: t.id + 'b', title: 'Measure the door (made up)', done: false, doneOn: null }); localStorage.removeItem('myday.projects.welcomed'); }`);
  await mac.open(BASE + `#projects/p/${pid}`);
  check('mac: the Overview opens with "Welcome back": away 2 weeks, what you did last, where I left off, the next step', await mac.until(`!!document.querySelector('#projectWelcome')`, 15000)
    && (await mac.text('[data-s=welcome-away]')).startsWith('Away 2 weeks — last worked on') && (await mac.text('[data-s=welcome-did]')).includes(`Done: ${TASK}`)
    && (await mac.text('[data-s=welcome-leftoff]')).includes('Boards ordered') && (await mac.text('[data-s=welcome-next]')) === 'Measure the door (made up)' && !(await mac.exists('#projectLeftOff')), await mac.text('#projectWelcome'));
  await mac.click('[data-action=welcome-got-it]');
  check('mac: "Got it" puts it away on this device (the note shows on its own card), and a reload keeps it away', await mac.until(`!document.querySelector('#projectWelcome') && !!document.querySelector('#projectLeftOff')`, 5000)
    && await mac.ev(`!!JSON.parse(localStorage.getItem('myday.projects.welcomed') || '{}')['${pid}']`) && (await mac.open(BASE + `#projects/p/${pid}`), await mac.until(`!!document.querySelector('#projectLeftOff')`, 15000)) && !(await mac.exists('#projectWelcome')));
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('.project-card[data-id="${pid}"]')`, 15000);
  check('mac: the Projects home says "Away 2 weeks" on its card', (await mac.text(`.project-card[data-id="${pid}"] [data-s=project-away]`)) === 'Away 2 weeks', await mac.text(`.project-card[data-id="${pid}"]`));

  // Tidy: the project and its tasks, everywhere.
  const tids = (await mac.data()).tasks.items.filter(t => t.projectId === pid).map(t => t.id);
  await deleteProject(pid);
  for (const id of tids) { await mac.open(BASE + `#today/tasks/${id}`); if (await mac.until(`!!document.querySelector('[data-action=task-delete]')`, 10000)) { await mac.click('[data-action=task-delete]'); await mac.until(`!!document.querySelector('[data-action=dialog-confirm]')`, 5000); await mac.click('[data-action=dialog-confirm]'); await D.sleep(500); } }
  check('tidy: the project and its tasks are gone and saved', !(await mac.data()).projects.items.some(p => p.id === pid) && !(await mac.data()).tasks.items.some(t => tids.includes(t.id)) && await synced(mac));
  const left = (await pullAll(who)).filter(r => (r.kind === 'project' && r.record_id === pid) || (r.kind === 'task' && tids.includes(r.record_id)));
  check('tidy: in the account none of it is left (deletion markers, or never sent)', left.every(r => r.deleted), left.map(r => [r.kind, r.deleted]));
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
