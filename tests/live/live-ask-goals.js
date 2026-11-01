// Live check of Ask MyDay and your ambitions (1.128.0, instructions v28) on the site (tests/live/run.py), on a disposable
// account and one throwaway Mac-width device. Made up: two projects, each with an ambition linked to it, and the second
// project then made private. On the first project's page, + lists its ambition's title in what's sent. On Today, "What am
// I working towards?" goes to Ask MyDay (a real AI request, offering the look at your ambitions); it asks to look, the app
// looks (a second request) and says so above the answer, with the private one left out. No request carries the private
// one's title or either ambition's why. Then both ambitions and projects are deleted everywhere. Never prints account
// details. Writes to the live account and uses two of its AI requests for the day: only with the owner's yes.
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
const P1 = 'Live check sailing lessons (made up)', P2 = 'Live check quiet project (made up)';
const AM1 = 'Learn to sail (made up)', AM2 = 'Live check hidden ambition (made up)', WHY = 'Live check reason (made up)';
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
  const last = new Map(); for (const r of rows) if (!last.has(r.kind + ':' + r.record_id) || last.get(r.kind + ':' + r.record_id).seq < r.seq) last.set(r.kind + ':' + r.record_id, r);
  return [...last.values()];
}
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 30000); };
const shown = (d, ms = 90000) => d.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase) && !document.querySelector('[data-s=ask-panel] [role=status]')`, ms);
const pick = (d, sel, value) => d.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
// What the app sent to Ask MyDay, oldest first (the request bodies, read from the browser's own network events).
const sentAsk = d => d.events.filter(e => e.method === 'Network.requestWillBeSent' && e.params.request.url.includes('functions/v1/ai-plan') && e.params.request.method === 'POST')
  .map(e => { try { return JSON.parse(e.params.request.postData).context; } catch { return null; } }).filter(c => c?.action === 'ask');

(async () => {
  await D.connect();
  const mac = await D.device('livegoals-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#projects');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}') && !document.querySelector('#appVersion').textContent.includes('+changes')`));
  const who = await signIn();
  const go = async h => { await mac.ev(`location.hash = '${h}'`); await D.sleep(700); };
  const deleteProject = async id => { await mac.open(BASE + `#projects/p/${id}`); if (!await mac.until(`!!document.querySelector('[data-action=project-delete]')`, 10000)) return; await mac.click('[data-action=project-delete]'); await D.sleep(250); await mac.click('[data-action=dialog-confirm]'); await D.sleep(500); };
  const deleteAmbition = async id => { await mac.open(BASE + `#projects/a/${id}`); if (!await mac.until(`!!document.querySelector('[data-action=ambition-delete]')`, 10000)) return; await mac.click('[data-action=ambition-delete]'); await mac.until(`!!document.querySelector('[data-action=dialog-confirm]')`, 5000); await mac.click('[data-action=dialog-confirm]'); await D.sleep(500); };
  for (const id of ((await mac.data()).ambitions?.items || []).filter(a => [AM1, AM2].includes(a.title)).map(a => a.id)) await deleteAmbition(id);
  for (const id of (await mac.data()).projects.items.filter(p => [P1, P2].includes(p.title)).map(p => p.id)) await deleteProject(id);
  await synced(mac);

  // Two made-up projects, and an ambition linked to each.
  const project = async title => {
    await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
    await mac.type('#projectNew', title); await mac.click('[data-action=project-add]');
    await mac.until(`location.hash.startsWith('#projects/p/')`);
    return (await mac.data()).projects.items.find(p => p.title === title)?.id;
  };
  const ambition = async (title, pid) => {
    await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('[data-action=ambition-new]')`, 15000);
    await mac.click('[data-action=ambition-new]'); await mac.until(`!!document.getElementById('ambitionNew')`, 5000);
    await mac.type('#ambitionNew', title); await mac.type('#ambitionWhy', WHY); await mac.click('[data-action=ambition-add]');
    await mac.until(`location.hash.startsWith('#projects/a/')`, 10000);
    await pick(mac, '#linkKind', 'project'); await mac.until(`!!document.querySelector('#linkRef option[value="${pid}"]')`, 5000); await pick(mac, '#linkRef', pid); await mac.click('[data-action=link-add]');
    await mac.until(`document.querySelectorAll('[data-s=ambition-link]').length === 1`, 5000);
    return ((await mac.data()).ambitions?.items || []).find(a => a.title === title)?.id;
  };
  const pid1 = await project(P1), pid2 = await project(P2);
  const aid1 = await ambition(AM1, pid1), aid2 = await ambition(AM2, pid2);
  // The second project made private after its ambition was linked.
  await mac.open(BASE + `#projects/p/${pid2}`); await mac.until(`!!document.querySelector('[data-action=project-private]')`, 10000);
  await mac.click('[data-action=project-private]'); await D.sleep(400);
  const d0 = await mac.data();
  check('made up: two projects, an ambition linked to each, the second project private', !!pid1 && !!pid2 && !!aid1 && !!aid2 && d0.projects.items.find(p => p.id === pid2)?.private === true
    && d0.ambitions.items.find(a => a.id === aid1)?.links.some(l => l.kind === 'project' && l.ref === pid1) && d0.ambitions.items.find(a => a.id === aid2)?.links.some(l => l.kind === 'project' && l.ref === pid2));
  await synced(mac);

  // On the first project's page: + lists the ambition's title in what's sent (no request is made).
  await mac.open(BASE + `#projects/p/${pid1}`); await mac.until(`!!document.querySelector('[data-action=capture-open]')`, 10000);
  await mac.click('[data-action=capture-open]'); await mac.until(`!!document.getElementById('captureText')`, 10000); await D.sleep(300);
  await mac.type('#captureText', "What's the next step here? (made up)"); await D.sleep(400);
  await mac.ev(`document.querySelector('[data-s=ask-sends-all] summary')?.click()`); await D.sleep(300);
  const pv = await mac.text('[data-s=ask-sends-all]');
  check('on the linked project\'s page, + lists "Your ambitions this is a step towards (titles only)" with its title, never the private one', pv.includes('Your ambitions this is a step towards (titles only)') && pv.includes(AM1) && !pv.includes(AM2) && !pv.includes(WHY), pv.slice(0, 300));
  await mac.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await D.sleep(400);

  // On Today: asked what you're working towards, it looks at your ambitions.
  await go('today');
  await mac.click('[data-action=capture-open]'); await mac.until(`!!document.getElementById('captureText')`, 10000); await D.sleep(300);
  await mac.type('#captureText', 'What am I working towards? (made up)'); await D.sleep(400);
  await mac.ev(`document.querySelector('[data-s=ask-sends-all] summary')?.click()`); await D.sleep(300);
  check('on Today, + says it may look at your ambitions, titles only', (await mac.text('[data-s=ask-sends-all]')).includes('If it needs to: your ambitions'));
  await mac.click('[data-action=ask-go]');
  const answered = await shown(mac) && (await mac.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`)) === 'shown';
  check('Ask MyDay answers', answered, (await mac.text('[data-s=ask-panel]')).slice(-260));
  const sent = sentAsk(mac), first = sent[0], last = sent[sent.length - 1], looks = sent.slice(1);
  const codes = mac.events.filter(e => e.method === 'Network.responseReceived' && e.params.response.url.includes('functions/v1/ai-plan')).map(e => e.params.response.status);
  console.log(`(requests to Ask MyDay: ${sent.length}; responses: ${JSON.stringify(codes)}; the look's titles: ${JSON.stringify(last?.lookup?.ambitions)})`);
  check('the first request offered the look at your ambitions, and carried no ambition', first?.can?.includes('goals') && !first.lookup && !JSON.stringify(first).includes(AM1), first && { can: first.can, lookup: first.lookup });
  // (A request sent within the server's pause between requests is held and sent again, so the look may go more than once.)
  check('…it asked to look, and the app sent your ambitions\' titles: this one, never the private one', looks.length >= 1 && looks.every(c => c.lookup?.tool === 'goals' && c.lookup.ambitions.includes(AM1) && !c.lookup.ambitions.includes(AM2) && c.lookup.found >= 1),
    looks.map(c => c.lookup && { tool: c.lookup.tool, n: c.lookup.ambitions?.length, found: c.lookup.found }));
  check('…no request carried the private one\'s title or any why', !sent.some(c => { const j = JSON.stringify(c); return j.includes(AM2) || j.includes(WHY); }));
  const line = await mac.text('[data-s=ask-looked]');
  check('above the answer: "Looked at your ambitions: …", with the private one left out', /^Looked at your ambitions: .+ — (one|\d+) left out \(linked to a private project, or one that’s gone\)\.( Checked at \d\d:\d\d\.)?$/.test(line.trim()), line);
  console.log(`(the answer: ${(await mac.text('[data-s=ask-message]')).slice(0, 220)})`);
  await mac.ev(`[...document.querySelectorAll('[data-action=ask-dismiss]')].pop()?.click()`); await D.sleep(300);
  await mac.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await D.sleep(400);

  // Tidy: both ambitions and both projects, everywhere.
  await deleteAmbition(aid1); await deleteAmbition(aid2); await deleteProject(pid1); await deleteProject(pid2);
  const d1 = await mac.data();
  check('tidy: all gone on the Mac and saved', !(d1.ambitions?.items || []).some(a => [aid1, aid2].includes(a.id)) && !d1.projects.items.some(p => [pid1, pid2].includes(p.id)) && await synced(mac));
  const left = (await pullAll(who)).filter(r => (r.kind === 'ambition' && [aid1, aid2].includes(r.record_id)) || (r.kind === 'project' && [pid1, pid2].includes(r.record_id)));
  check('tidy: in the account they are deletion markers', left.length === 4 && left.every(r => r.deleted), left.map(r => [r.kind, r.deleted]));
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 200));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
