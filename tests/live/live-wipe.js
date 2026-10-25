// Live check of Delete everything on the site (tests/live/run.py), on a disposable account and two throwaway devices
// (a Mac and a 320 px phone): a made-up project, file and backup, and one change left unsent on the phone (offline);
// then the Mac deletes everything. The account, R2 and both devices must end up with only fresh starters, and
// nothing of the old copy may come back. WIPES THE WHOLE ACCOUNT: only a disposable one, only with the owner's yes.
const path = require('path');
const fs = require('fs');
const D = require(path.join(__dirname, 'devices.js'));
const BASE = process.env.MYDAY_BASE || 'https://omar12ahmed.github.io/myday/', VERSION = process.env.MYDAY_VERSION, SRC = process.env.MYDAY_SRC, KEY = 'myday.data.v4';
const URL_ = (process.env.SUPABASE_URL || '').replace(/\/+$/, ''), PUB = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const A = { email: process.env.MYDAY_LIVE_EMAIL, password: process.env.MYDAY_LIVE_PASSWORD }; // the disposable account run.py chose
if (!process.argv.includes('--live') || !A.email?.endsWith('@example.com') || !A.password || !SRC || !VERSION || !URL_ || !PUB.startsWith('sb_publishable_')) {
  console.log('Refused: explicit live check, a disposable account, version, source commit and the publishable key required.'); process.exit(2);
}
let pass = 0, fail = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || info === undefined ? '' : ' → ' + JSON.stringify(info).slice(0, 300))); ok ? pass++ : fail++; };
const TITLE = 'Live check Wipe (made up)', OFFLINE = 'Live check Wipe offline (made up)';
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
  return rows;
}
const files = async (who, body) => { const r = await fetch(`${URL_}/functions/v1/files`, { method: 'POST', headers: hdr(who.token), body: JSON.stringify(body) }); return { status: r.status, j: await r.json().catch(() => ({})) }; };
const backups = async who => { const r = await fetch(`${URL_}/functions/v1/backup`, { headers: { apikey: PUB, Authorization: `Bearer ${who.token}` } }); return r.json().catch(() => ({})); };
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 40000); };
const toast = (d, s) => d.until(`[...document.querySelectorAll('[role=status]')].some(e => e.textContent.includes(${JSON.stringify(s)}))`, 20000);
const give = async (d, sel, paths) => { const doc = await d.send('DOM.getDocument', { depth: -1 }); const { nodeId } = await d.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: sel }); await d.send('DOM.setFileInputFiles', { nodeId, files: paths }); };
const dir = process.env.MYDAY_LIVE_TEMP;
const PNG = path.join(dir, 'Wipe check (made up).png');
fs.writeFileSync(PNG, Buffer.from('89504e470d0a1a0a0000000d49484452000000080000000808020000004b6d29dc0000001149444154789c633851618315310c2d090041f35f0154c5b6b30000000049454e44ae426082', 'hex'));
const hasTitle = (d, t) => d.ev(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.some(p => p.title === ${JSON.stringify(t)})`);
const myKeys = d => d.ev(`Object.keys(localStorage).filter(k => k.startsWith('myday.')).sort()`);

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('livewipe-' + name, path.join(dir, 'downloads-' + name));
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
  const epochBefore = (await (await rpc('sync_state', who, { account: who.id })).json()).epoch;

  // Made up: a project with a file on the Mac, a backup, device-only keys; the phone gets the project.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`);
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE).id;
  await mac.open(BASE + `#projects/p/${pid}`); await mac.until(`!!document.getElementById('files-project')`, 15000);
  await give(mac, '#files-project input[type=file]', [PNG]);
  check('mac: a made-up project with a file is saved to the account and R2', await mac.until(`[...document.querySelectorAll('#files-project [data-s=file]')].some(li => li.dataset.state === 'kept')`, 60000) && await synced(mac)
    && (await files(who, { action: 'usage' })).j.bytes > 0);
  await mac.ev(`localStorage.setItem('myday.sayings', 'off'); localStorage.setItem('myday.focus', '1'); true`);
  await mac.open(BASE + '#backups'); await mac.until(`!!document.querySelector('[data-action=backup-now]')`, 20000);
  await mac.click('[data-action=backup-now]');
  check('mac: a backup is made', await mac.until(`[...document.querySelectorAll('[data-s=backup]')].length > 0`, 40000) && (await backups(who)).backups?.length > 0);
  await phone.open(BASE + '#projects'); await synced(phone);
  check('phone: receives the project', await phone.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.some(p => p.title === ${JSON.stringify(TITLE)})`, 40000));
  // The phone goes offline and makes a change that isn't sent.
  await phone.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await phone.open(BASE + '#projects'); await phone.until(`!!document.querySelector('#projectNew')`, 20000);
  await phone.type('#projectNew', OFFLINE); await phone.click('[data-action=project-add]'); await D.sleep(800);
  check('phone: an offline change waits on the phone', await hasTitle(phone, OFFLINE) && !(await pullAll(who)).some(r => JSON.stringify(r.data || {}).includes(OFFLINE)));

  // The Mac: Your account → Delete everything.
  await mac.open(BASE + '#sync'); await mac.until(`!!document.querySelector('[data-action=wipe-open]')`, 20000);
  await mac.click('[data-action=wipe-open]');
  check('mac: Your account opens Delete everything', await mac.until(`location.hash === '#delete-everything' && !!document.getElementById('wipePhrase')`, 10000));
  check('mac: the button waits for the phrase', await mac.ev(`document.querySelector('[data-action=wipe-go]').disabled`));
  check('mac at 1440: no sideways scroll', await mac.ev(`document.documentElement.scrollWidth <= innerWidth`));
  await mac.type('#wipePhrase', 'delete');
  check('mac: "delete" alone isn\'t enough', await mac.ev(`document.querySelector('[data-action=wipe-go]').disabled`));
  await mac.ev(`(() => { const i = document.getElementById('wipePhrase'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ''); i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await mac.type('#wipePhrase', '  Delete Everything ');
  check('mac: the phrase (any case, spaces at the ends) enables it', await mac.until(`!document.querySelector('[data-action=wipe-go]').disabled`, 5000));
  await mac.ev(`document.querySelector('[data-action=wipe-go]').click(), true`);
  // The page reloads itself when done: let it, rather than ask it anything half-way through a reload.
  await D.sleep(20000);
  await mac.open(BASE + '#today');
  check('mac: it deleted, reloaded and says "Everything was deleted."', await mac.until(`(document.querySelector('[data-s=wiped-notice]')?.textContent || '').includes('Everything was deleted.')`, 30000));
  check('mac: no project of the old copy here, still signed in and syncing', !(await hasTitle(mac, TITLE)) && await synced(mac) && (await mac.ev(`!!document.getElementById('syncBadge')`)));
  const keys = await myKeys(mac);
  check('mac: every device-only key but sign-in, sync notes, data and the notice is gone', keys.every(k => ['myday.sync.auth', 'myday.sync.v1', 'myday.data.v4', 'myday.wiped'].includes(k) || k.startsWith('myday.sync.auth')), keys);
  const st = await (await rpc('sync_state', who, { account: who.id })).json();
  check('the account\'s epoch moved on by one', st.epoch === epochBefore + 1, st);
  let rows = await pullAll(who);
  check('the account holds nothing of before: no project, no deletion markers, no file records', !rows.some(r => JSON.stringify(r.data || {}).includes('Live check Wipe')) && !rows.some(r => r.deleted) && !rows.some(r => r.kind === 'file'), rows.map(r => r.kind));
  const left = (await backups(who)).backups || [];
  check('R2: no files, and no backup from before the wipe, left for account A (a new backup of the empty MyDay may follow)', (await files(who, { action: 'usage' })).j.bytes === 0 && left.every(b => new Date(b.at) > new Date(st.wiped_at)), left.map(b => b.at));

  // The phone comes back online: it clears itself, and its unsent change never arrives.
  await phone.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await phone.open(BASE + '#today');
  await D.sleep(25000); // its sync hears of the wipe, clears it and reloads it
  await phone.open(BASE + '#today');
  check('phone: clears itself and says "Everything was deleted from another device on …"', await phone.until(`(document.querySelector('[data-s=wiped-notice]')?.textContent || '').includes('Everything was deleted from another device')`, 90000));
  check('phone: none of its old copy, nor its unsent change, is there', !(await hasTitle(phone, TITLE)) && !(await hasTitle(phone, OFFLINE)));
  await synced(phone); await synced(mac);
  rows = await pullAll(who);
  check('…and nothing of it reached the account', !rows.some(r => JSON.stringify(r.data || {}).includes('Live check Wipe')));
  check('phone at 320 px: the notice fits (no sideways scroll)', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`));
  await phone.click('[data-action=wiped-dismiss]'); await mac.click('[data-action=wiped-dismiss]');
  await phone.open(BASE + '#today'); await D.sleep(1500);
  check('OK hides the notice for good', !(await phone.ev(`!!document.querySelector('[data-s=wiped-notice]')`)));
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
