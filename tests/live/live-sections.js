// Live check of a project's optional Overview sections on the site (tests/live/run.py), on a disposable account and
// two throwaway devices (a Mac and a 320 px phone): a made-up project's empty cards fold into "Add to this project";
// "A link" adds a link there; hiding Resources (About it → Edit) is saved in the project's own record and the phone
// receives it ("Show Resources (1)"); showing it on the phone reaches the Mac. Then the project is deleted everywhere.
// Never prints account details. Writes to the live database: only with the owner's yes.
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
const TITLE = 'Live check Sections (made up)';
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
// (The engine shows a change on the badge 300 ms after it, so wait that out first.)
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 30000); };
const hiddenOn = (d, id) => d.ev(`JSON.stringify(JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${id}')?.hiddenSections ?? null)`);

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('livesec-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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

  // Tidy first.
  for (const id of (await mac.data()).projects.items.filter(p => p.title === TITLE).map(p => p.id)) await deleteProject(mac, id);
  await synced(mac);

  // Mac: a made-up project; its empty optional cards fold into "Add to this project".
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`);
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE).id;
  await mac.open(BASE + `#projects/p/${pid}`);
  check('mac: a new project\'s empty cards fold into "Add to this project" (A note · Something to learn · A link · A file)', await mac.until(`!!document.querySelector('#projectMore')`, 15000)
    && await mac.ev(`JSON.stringify([...document.querySelectorAll('#projectMore [data-action=section-open]')].map(b => b.textContent)) === '["A note","Something to learn","A link","A file"]' && !document.querySelector('#projectResources')`), await mac.text('#projectMore'));
  // "A link" opens the Resources card's form: add one.
  await mac.click('[data-action=section-open][data-id=resources]'); await mac.until(`!!document.getElementById('resourceUrl-new')`, 5000);
  await mac.type('#resourceUrl-new', 'example.com/live-check-made-up'); await mac.click('[data-action=resource-save]');
  check('mac: "A link" opens the form, and the link is added', await mac.until(`(JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${pid}').resources || []).length === 1`, 10000) && await synced(mac));
  // Hide Resources: About it → Edit → Show on the Overview.
  await mac.click('[data-action=project-edit]'); await mac.until(`!!document.querySelector('[data-action=section-resources]')`, 5000);
  await mac.click('[data-action=section-resources]');
  const gone = await mac.until(`!document.querySelector('#projectResources')`, 5000), savedHere = await mac.until(`JSON.stringify(JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${pid}')?.hiddenSections ?? null) === '["resources"]'`, 5000), sent = await synced(mac);
  const row = (await pullAll(who)).find(r => r.kind === 'project' && r.record_id === pid), inAccount = JSON.stringify((row?.data?.value ?? row?.data ?? {}).hiddenSections);
  check('mac: hiding Resources saves hiddenSections ["resources"], and it\'s in the project\'s record in the account', gone && savedHere && sent && inAccount === '["resources"]', { gone, savedHere, sent, inAccount, keys: Object.keys(row?.data ?? {}) });

  // Phone: receives the hiding; shows it again there.
  await phone.open(BASE + `#projects/p/${pid}`); await synced(phone);
  check('phone: receives it — Resources hidden, "Show Resources (1)"', await phone.until(`!document.querySelector('#projectResources') && (document.querySelector('[data-action=section-show][data-id=resources]')?.textContent || '') === 'Show Resources (1)'`, 30000), await phone.text('#projectMore'));
  check('phone at 320 px: no sideways scroll; the More card\'s buttons are at least 44 px', await phone.ev(`document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('#projectMore button')].every(b => b.getBoundingClientRect().height >= 44 && b.getBoundingClientRect().width >= 44)`));
  await phone.click('[data-action=section-show][data-id=resources]');
  check('phone: "Show Resources (1)" brings the card back and saves it', await phone.until(`!!document.querySelector('#projectResources')`, 5000) && (await hiddenOn(phone, pid)) === 'null' && await synced(phone));
  await mac.open(BASE + `#projects/p/${pid}`); await synced(mac);
  check('mac: receives that — Resources shows again', await mac.until(`!!document.querySelector('#projectResources')`, 30000) && (await hiddenOn(mac, pid)) === 'null');

  // Tidy.
  await deleteProject(mac, pid);
  check('tidy: the project is gone and saved', !(await mac.data()).projects.items.some(p => p.id === pid) && await synced(mac));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('tidy: and the phone has none of it', await phone.until(`!JSON.parse(localStorage.getItem('${KEY}')).projects.items.some(p => p.id === '${pid}')`, 30000));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
