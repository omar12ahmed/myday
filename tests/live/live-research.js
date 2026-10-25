// Live check of Research on the site (tests/live/run.py), on a disposable account and two throwaway devices (a Mac and
// a 320 px phone): a made-up project switches Research on, gains a question, a typed source and a finding that supports
// the question; the live database accepts them as `research` records and the phone receives them; the phone marks the
// question answered and the Mac receives that; then the project is deleted and its research goes with it, in the
// account and on the phone. Never prints account details. Writes to the live database: only with the owner's yes.
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
const TITLE = 'Live check Research (made up)', Q = 'Do tea carts sell before nine? (made up)', SOURCE = 'Morning count at the bus stop (made up)';
const FINDING = 'Eleven cups sold between seven and nine (made up)', LIMITS = 'one morning, one stop', CONCLUSION = 'Yes, mornings sell (made up)';
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
// Sets a <select> (found by the expression `find`) the way a person does (React sees it).
const choose = (d, find, value) => d.ev(`(() => { const el = ${find}; if (!el) throw new Error('missing select');
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
// Records compared by content: the database stores JSON with its keys in its own order.
const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
const byId = list => [...list].sort((a, b) => a.id.localeCompare(b.id));
const items = (d, pid) => d.ev(`JSON.parse(localStorage.getItem('${KEY}')).research?.items?.filter(x => x.projectId === ${JSON.stringify(pid)}) ?? []`);

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('liveres-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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
  const hasP = d => d.ev(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.some(p => p.title === ${JSON.stringify(TITLE)})`);
  const deleteProject = async (d, id) => { await d.open(BASE + `#projects/p/${id}`); await d.until(`!!document.querySelector('[data-action=project-delete]')`); await d.click('[data-action=project-delete]'); await D.sleep(250); await d.click('[data-action=dialog-confirm]'); await D.sleep(500); };

  // Tidy first: anything left by an earlier stopped run.
  for (const id of (await mac.data()).projects.items.filter(p => p.title === TITLE).map(p => p.id)) await deleteProject(mac, id);
  await synced(mac);

  // Mac: a made-up general project; About it → Edit → Research on gives it a Research tab.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-add]');
  check('mac: the made-up project is made and saved to the account', await mac.until(`location.hash.startsWith('#projects/p/')`) && await hasP(mac) && await synced(mac));
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE).id;
  await mac.open(BASE + `#projects/p/${pid}`); await mac.until(`!!document.querySelector('[data-action=project-edit]')`);
  await mac.click('[data-action=project-edit]'); await mac.until(`!!document.querySelector('[data-action=project-research]')`, 5000);
  await mac.click('[data-action=project-research]');
  check('mac: switching Research on says it has its own tab, and the tab appears', await toast(mac, 'Research is on — it has its own tab.') && await mac.until(`!!document.querySelector('[data-tab=research]')`, 5000));
  check('mac: the project\'s tools are saved to the account', await synced(mac) && (await pullAll(who)).some(r => r.kind === 'project' && r.record_id === pid && !r.deleted && JSON.stringify((r.data?.value ?? r.data)?.tools) === '["research"]'));

  // A question, then a finding from a typed source that supports it.
  await mac.open(BASE + `#projects/p/${pid}/research`);
  check('mac: the Research tab shows Questions, Findings and Sources', await mac.until(`!!document.querySelector('[data-s=research-questions]') && !!document.querySelector('[data-s=research-findings]') && !!document.querySelector('[data-s=research-sources]')`, 15000));
  await mac.type('#researchQuestionNew', Q); await mac.click('[data-action=research-question-add]');
  check('mac: the question is added, open', await mac.until(`[...document.querySelectorAll('[data-s=research-question]')].some(li => li.textContent.includes(${JSON.stringify(Q)}) && li.dataset.state === 'open')`, 5000));
  const qid = (await items(mac, pid)).find(x => x.type === 'question')?.id;
  await mac.click('[data-action=research-finding-add]'); await mac.until(`!!document.querySelector('#rfN-text')`, 5000);
  await mac.type('#rfN-text', FINDING); await mac.type('#rfN-limits', LIMITS);
  await mac.click('[data-action=research-finding-new-source]'); await mac.until(`!!document.querySelector('[data-s=research-source-form]')`, 5000);
  // (A new project has no links, files or notes, so the form goes straight to typing one.)
  const typedOnly = await mac.ev(`!!document.querySelector('#rsN-title') && !document.querySelector('[data-action=research-source-mine]')`);
  await mac.type('#rsN-title', SOURCE); await mac.click('[data-action=research-source-save]');
  check('mac: with nothing of the project\'s to pick, a typed source is added and ticked for the finding', typedOnly && await toast(mac, 'Source added.')
    && await mac.until(`[...document.querySelectorAll('[data-s=research-finding-form] input[type=checkbox]')].some(c => c.checked && c.closest('label').textContent.includes(${JSON.stringify(SOURCE)}))`, 5000));
  await choose(mac, `[...document.querySelectorAll('[data-s=research-finding-form] select')].find(x => (x.getAttribute('aria-label') || '').includes(${JSON.stringify(Q)}))`, 'supports');
  await mac.click('[data-action=research-finding-save]');
  check('mac: the finding is added, from that source, with its limits, supporting the question', await toast(mac, 'Finding added.')
    && await mac.until(`(() => { const li = document.querySelector('[data-s=research-finding]'); return !!li && li.textContent.includes(${JSON.stringify(FINDING)}) && li.textContent.includes('From ' + ${JSON.stringify(SOURCE)}) && li.textContent.includes(${JSON.stringify(LIMITS)}) && li.textContent.includes('Supports “' + ${JSON.stringify(Q)} + '”'); })()`, 5000),
    await mac.ev(`document.querySelector('[data-s=research-finding]')?.textContent || ''`));
  check('mac: the question gathers it under "Supports"', await mac.ev(`[...document.querySelectorAll('[data-s=research-question]')].find(li => li.textContent.includes(${JSON.stringify(Q)}))?.textContent.includes(${JSON.stringify(FINDING)})`));
  check('mac: saved to the account', await synced(mac));
  const mine = await items(mac, pid);
  const rows = (await pullAll(who)).filter(r => r.kind === 'research' && !r.deleted && r.data?.projectId === pid);
  check('the live account holds three research records (question, source, finding), exactly as on the Mac', rows.length === 3 && ['question', 'source', 'finding'].every(t => rows.some(r => r.data.type === t))
    && mine.length === 3 && mine.every(x => same(rows.find(r => r.record_id === x.id)?.data, x)), rows.map(r => [r.data?.type, r.version, r.seq]));

  // Phone: receives them; marks the question answered with a conclusion.
  await phone.open(BASE + `#projects/p/${pid}/research`); await synced(phone);
  check('phone: receives the question, the finding and the source', await phone.until(`!!document.querySelector('[data-s=research-question]') && (document.querySelector('[data-s=research-finding]')?.textContent || '').includes(${JSON.stringify(FINDING)}) && (document.querySelector('[data-s=research-source]')?.textContent || '').includes(${JSON.stringify(SOURCE)})`, 30000));
  check('phone: exactly the same records as the Mac', same(byId(await items(phone, pid)), byId(mine)));
  check('phone at 320 px: nothing scrolls sideways, and the Research buttons are at least 44 px', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`)
    && await phone.ev(`[...document.querySelectorAll('[data-s=research] [data-action^=research-]')].every(b => b.getBoundingClientRect().height >= 44)`), await phone.ev(`[...document.querySelectorAll('[data-s=research] [data-action^=research-]')].map(b => b.dataset.action + ':' + Math.round(b.getBoundingClientRect().height))`));
  await phone.type(`#rqC-${qid}`, CONCLUSION);
  await phone.click('[data-action=research-question-answer]');
  check('phone: Mark answered takes what was typed', await toast(phone, 'Answered.') && await phone.until(`document.querySelector('[data-s=research-question]')?.dataset.state === 'answered'`, 5000) && await synced(phone));
  await mac.open(BASE + `#projects/p/${pid}/research`); await synced(mac);
  check('mac: receives the answer and the conclusion', await mac.until(`(() => { const li = document.querySelector('[data-s=research-question]'); return li?.dataset.state === 'answered' && document.getElementById('rqC-${qid}')?.value === ${JSON.stringify(CONCLUSION)}; })()`, 30000));

  // Tidy: deleting the project deletes its research, in the account and on the phone.
  await deleteProject(mac, pid);
  check('tidy: the project and its research are gone on the Mac and saved', !(await hasP(mac)) && !(await items(mac, pid)).length && await synced(mac));
  const after = (await pullAll(who)).filter(r => (r.kind === 'research' && mine.some(x => x.id === r.record_id)) || (r.kind === 'project' && r.record_id === pid));
  check('tidy: in the account the project and its three research records are deletion markers', after.length === 4 && after.every(r => r.deleted), after.map(r => [r.kind, r.deleted]));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('tidy: and the phone has none of it', await phone.until(`!JSON.parse(localStorage.getItem('${KEY}')).projects.items.some(p => p.title === ${JSON.stringify(TITLE)}) && !(JSON.parse(localStorage.getItem('${KEY}')).research?.items ?? []).some(x => x.projectId === ${JSON.stringify(pid)})`, 30000));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
