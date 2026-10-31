// Live check of "You've been exploring a while" on the site (tests/live/run.py), on a disposable account and one
// throwaway Mac: a made-up Research project moved into Exploring on the board remembers that column and today; it
// gets a decision with two options and a finding supporting one; then its day in Exploring is moved 22 days back on
// this device. The live database holds the record exactly. Its Overview asks ("You've been exploring this for 3
// weeks"); Compare them opens the options side by side ("1 for", "Nothing found yet") with "No findings yet about Pine";
// back on the Overview it isn't asked again, after a reload too; the Decisions tab offers "Compare side by side". Then
// the project is deleted everywhere. Never prints account details. Writes to the live database: only with the owner's yes.
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
const TITLE = 'Live check Exploring (made up)';
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
  const mac = await D.device('liveexplore-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
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
  const day = n => mac.ev(`(() => { const x = new Date(); x.setDate(x.getDate() + (${n})); return x.toLocaleDateString('sv'); })()`);
  const today = await day(0), d22 = await day(-22);

  // A made-up Research project, moved into Exploring on the board.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-kind][value=research]'); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`);
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE)?.id;
  check('mac: a new project remembers its column (Ideas) and today', same((await projectOf(mac, pid))?.columnSince, { column: 'ideas', on: today }), (await projectOf(mac, pid))?.columnSince);
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('.project-card[data-id="${pid}"] [data-action=project-on]')`, 15000);
  await mac.click(`.project-card[data-id="${pid}"] [data-action=project-on]`);
  check('mac: moved into Exploring on the board, it remembers Exploring and today', await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${pid}')?.columnSince?.column === 'exploring'`, 5000)
    && (await projectOf(mac, pid)).stage === 'explore' && (await projectOf(mac, pid)).columnSince.on === today);

  // A decision with two options, and a finding supporting one.
  await mac.open(BASE + `#projects/p/${pid}/decisions`); await mac.until(`!!document.getElementById('dcNew')`, 15000);
  await mac.type('#dcNew', 'Larch or pine? (made up)'); await mac.click('[data-action=dc-add]');
  await mac.until(`(JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${pid}').decisions || []).length === 1`, 5000);
  const did = (await projectOf(mac, pid)).decisions[0].id;
  for (const o of ['Larch', 'Pine']) { await mac.until(`!!document.getElementById('dcOpt-${did}')`, 5000); await mac.type(`#dcOpt-${did}`, o); await mac.click('[data-action=opt-add]'); await mac.until(`(JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${pid}').decisions[0].options || []).some(x => x.text === '${o}')`, 5000); }
  check('mac: the Decisions tab offers "Compare side by side" for a decision with two options', await mac.until(`!!document.querySelector('[data-action=dc-compare]')`, 5000));
  await mac.open(BASE + `#projects/p/${pid}/research`); await mac.until(`!!document.querySelector('[data-action=research-finding-add]')`, 15000);
  await mac.click('[data-action=research-finding-add]'); await mac.until(`!!document.getElementById('rfN-text')`, 5000);
  await mac.type('#rfN-text', 'Larch lasts 25 years untreated (made up)');
  await pick(mac, `select[aria-label="How it bears on “Larch — Larch or pine? (made up)”"]`, 'supports');
  await mac.click('[data-action=research-finding-save]');
  check('mac: a finding supporting Larch', await toast(mac, 'Finding added.'));

  // Its day in Exploring moved 22 days back on this device.
  await mac.setData(`s => { const p = s.projects.items.find(x => x.id === '${pid}'); p.columnSince = { column: 'exploring', on: '${d22}' }; }`);
  await mac.open(BASE + `#projects/p/${pid}`); await synced(mac);
  const rows = await pullAll(who), row = rows.find(r => r.kind === 'project' && r.record_id === pid);
  check('the live account holds the column and its day exactly', same(row?.data?.value?.columnSince, { column: 'exploring', on: d22 }), row?.data?.value?.columnSince);
  check('mac: its Overview asks — "You’ve been exploring this for 3 weeks"', await mac.until(`(document.getElementById('exploringH')?.textContent || '') === 'You’ve been exploring this for 3 weeks'`, 10000)
    && (await mac.text('#projectExploring')).includes('compare the strongest options'), await mac.text('#projectExploring'));
  await mac.click('[data-action=explore-compare]');
  await mac.until(`!!document.querySelector('[data-s=compare-decision]')`, 10000);
  const evidence = await mac.ev(`[...document.querySelectorAll('[data-s=compare-option]')].map(o => o.querySelector('p').textContent + ': ' + (o.querySelector('[data-s=compare-evidence]')?.textContent || ''))`);
  check('mac: Compare them shows the options side by side with their evidence ("1 for", "Nothing found yet")', JSON.stringify(evidence) === JSON.stringify(['Larch: 1 for', 'Pine: Nothing found yet']), evidence);
  check('mac: …and what\'s still unknown: "No findings yet about Pine"', (await mac.text('[data-s=compare-unknown]')).includes('No findings yet about Pine'), await mac.text('[data-s=compare-unknown]'));
  await mac.open(BASE + `#projects/p/${pid}`); await mac.until(`!!document.getElementById('projectTitle')`, 10000); await D.sleep(500);
  check('mac: back on the Overview it isn\'t asked again, after a reload too', !(await mac.exists('#projectExploring')) && (await mac.open(BASE + `#projects/p/${pid}`), await D.sleep(800), !(await mac.exists('#projectExploring'))));

  // Tidy: the project (its research goes with it), everywhere. (A deletion marker holds no data, so the research is
  // found by its ids, taken first.)
  const researchIds = (await mac.data()).research.items.filter(x => x.projectId === pid).map(x => x.id);
  await deleteProject(pid);
  check('tidy: the project is gone on the Mac and saved', !(await mac.data()).projects.items.some(p => p.id === pid) && await synced(mac));
  const left = (await pullAll(who)).filter(r => (r.kind === 'project' && r.record_id === pid) || (r.kind === 'research' && researchIds.includes(r.record_id)));
  check('tidy: in the account the project and its finding are deletion markers', researchIds.length >= 1 && left.length === 1 + researchIds.length && left.every(r => r.deleted), left.map(r => [r.kind, r.deleted]));
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
