// Live check of Files on the site (tests/live/run.py), on a disposable account and two throwaway devices (a Mac and
// a 320 px phone): made-up files are added to a made-up project, opened, removed, put back and deleted for good;
// the storage line ("used, left"); then the project is deleted and its files deleted from the Projects home,
// leaving nothing in R2. Never prints account details or links. Writes to the live database: only with the owner's yes.
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
const TITLE = 'Live check Files (made up)';
const hdr = tok => ({ apikey: PUB, Authorization: `Bearer ${tok || PUB}`, 'Content-Type': 'application/json' });
async function signIn() {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, { method: 'POST', headers: hdr(), body: JSON.stringify(A) });
  const j = await r.json(); if (!j.access_token) throw Error('REST sign-in failed'); return { token: j.access_token, id: j.user.id };
}
const files = async (who, body) => { const r = await fetch(`${URL_}/functions/v1/files`, { method: 'POST', headers: hdr(who.token), body: JSON.stringify(body) }); return { status: r.status, j: await r.json().catch(() => ({})) }; };
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
const give = async (d, sel, paths) => { const doc = await d.send('DOM.getDocument', { depth: -1 }); const { nodeId } = await d.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: sel }); await d.send('DOM.setFileInputFiles', { nodeId, files: paths }); };
const row = name => `[...document.querySelectorAll('[data-s=file]')].find(li => li.textContent.includes(${JSON.stringify(name)}))`;
const deletedRow = name => `[...document.querySelectorAll('[data-s=file-deleted]')].find(li => li.textContent.includes(${JSON.stringify(name)}))`;

// The made-up files
const dir = process.env.MYDAY_LIVE_TEMP;
const NAMES = { png: 'Damp patch (made up).png', pdf: 'Quote (made up).pdf', txt: 'Shed list (made up).txt', svg: 'Logo (made up).svg' };
const BYTES = {
  png: Buffer.from('89504e470d0a1a0a0000000d49484452000000080000000808020000004b6d29dc0000001149444154789c633851618315310c2d090041f35f0154c5b6b30000000049454e44ae426082', 'hex'),
  pdf: Buffer.from('%PDF-1.4\n% MyDay live check, made-up file\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n'),
  txt: Buffer.from('Made-up list for the MyDay live check.\nLarch boards, screws, a bike rack.\n'),
  svg: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
};
const P = {}; for (const k of Object.keys(NAMES)) { P[k] = path.join(dir, NAMES[k]); fs.writeFileSync(P[k], BYTES[k]); }

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('livefl-' + name, path.join(dir, 'downloads-' + name));
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

  // Tidy first: anything left by an earlier stopped run (the made-up project, its file records, account A's files).
  for (const id of (await mac.data()).projects.items.filter(p => p.title === TITLE).map(p => p.id)) await deleteProject(mac, id);
  await files(who, { action: 'delete-all' });

  // Mac: a made-up project; its Overview has the Files card after Resources.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-add]');
  check('mac: the made-up project is made and saved to the account', await mac.until(`location.hash.startsWith('#projects/p/')`) && await hasP(mac) && await synced(mac));
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE).id;
  await mac.open(BASE + `#projects/p/${pid}`);
  check('mac: the Overview has a Files card after Resources', await mac.until(`!!document.getElementById('files-project')`, 15000)
    && await mac.ev(`(() => { const r = document.getElementById('projectResources'), f = document.getElementById('files-project'); return !!r && !!(r.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING); })()`));

  check('mac: with nothing stored, the card says "Your files: nothing stored yet, 10 GB left." last in the card', await mac.until(`(document.querySelector('#files-project [data-s=files-storage]')?.textContent || '') === 'Your files: nothing stored yet, 10 GB left.' && document.querySelector('#files-project').lastElementChild.matches('[data-s=files-storage]')`, 20000), await mac.ev(`(document.querySelector('#files-project [data-s=files-storage]')?.textContent || '')`));
  // Add a photo, a PDF and a text file: each reaches "kept" on the real R2.
  await give(mac, '#files-project input[type=file]', [P.png, P.pdf, P.txt]);
  const kept = await mac.until(`[...document.querySelectorAll('#files-project [data-s=file]')].filter(li => li.dataset.state === 'kept').length === 3`, 60000);
  check('mac: a photo, a PDF and a text file are added and kept', kept, await mac.ev(`[...document.querySelectorAll('#files-project [data-s=file]')].map(li => li.dataset.state + ':' + li.querySelector('[data-s=file-status]')?.textContent)`));
  check('mac: "3 files added."', await toast(mac, '3 files added.'));
  check('mac: the photo shows its preview from R2', await mac.until(`(() => { const img = ${row(NAMES.png)}?.querySelector('img'); return !!img && img.complete && img.naturalWidth > 0; })()`, 20000));
  check('mac: saved to the account', await synced(mac));
  check('mac: the storage line now says "1 KB used, 9.9 GB left of 10 GB."', await mac.until(`(document.querySelector('#files-project [data-s=files-storage]')?.textContent || '') === 'Your files: 1 KB used, 9.9 GB left of 10 GB.'`, 20000), await mac.ev(`(document.querySelector('#files-project [data-s=files-storage]')?.textContent || '')`));
  const recs = (await mac.data()).files.items.filter(f => Object.values(NAMES).includes(f.name));
  const rows = (await pullAll(who)).filter(r => r.kind === 'file' && !r.deleted && recs.some(f => f.id === r.record_id));
  check('the account holds the three file records (names, types, sizes; no contents)', rows.length === 3 && rows.every(r => r.data.state === 'kept' && !JSON.stringify(r.data).includes('Larch boards')), rows.map(r => [r.data.name, r.data.state, r.version, r.seq]), recs.map(f => [f.name, f.state]));
  if (!(rows.length === 3 && rows.every(r => r.data.state === 'kept'))) { await D.sleep(5000); console.log('  (5 s later the account has:', JSON.stringify((await pullAll(who)).filter(r => r.kind === 'file' && recs.some(f => f.id === r.record_id)).map(r => [r.data?.name, r.data?.state, r.version])), '; the Mac\'s badge:', await mac.ev(`document.querySelector('#syncBadge')?.dataset.status`), ')'); }
  const usage = await files(who, { action: 'usage' });
  check('R2 holds the three files for account A', usage.j.bytes === BYTES.png.length + BYTES.pdf.length + BYTES.txt.length, usage.j);

  // Open: the PDF in a new tab on a short-lived R2 link; the text file saved under its name, MyDay staying put.
  await mac.ev(`window.__opened = []; window.open = () => ({ opener: 1, close() {}, location: { set href(v) { window.__opened.push(v); } } }); true`);
  await mac.ev(`${row(NAMES.pdf)}.querySelector('[data-action=file-open]').click(), true`);
  const link = await mac.until(`window.__opened.length === 1`, 15000) ? await mac.ev('window.__opened[0]') : '';
  const got = link ? await fetch(link) : null;
  check('mac: Open on the PDF opens a new tab on a five-minute R2 link that serves it inline', !!got && got.ok && /\.r2\.cloudflarestorage\.com\//.test(link) && /X-Amz-Expires=300/.test(link)
    && got.headers.get('content-type') === 'application/pdf' && /^inline/.test(got.headers.get('content-disposition') || '') && Buffer.from(await got.arrayBuffer()).equals(BYTES.pdf));
  const here = await mac.ev('location.href');
  await mac.ev(`${row(NAMES.txt)}.querySelector('[data-action=file-open]').click(), true`);
  const file = await (async () => { for (let i = 0; i < 60; i++) { const f = mac.lastDownload(); if (f) return f; await D.sleep(250); } return null; })();
  check('mac: Open on the text file saves it with its contents, and MyDay stays where it was', file === BYTES.txt.toString() && await mac.ev('location.href') === here);

  // A refused type: nothing saved.
  const before = (await mac.data()).files.items.length;
  await give(mac, '#files-project input[type=file]', [P.svg]);
  check('mac: an SVG is refused with the reason, and nothing is saved', await mac.until(`(document.querySelector('[data-s=file-refused]')?.textContent || '').includes('Only photos, PDFs and documents')`, 10000)
    && (await mac.data()).files.items.length === before);

  // Phone: the files arrive with the project; at 320 px nothing scrolls sideways.
  await phone.open(BASE + `#projects/p/${pid}`); await synced(phone);
  check('phone: receives the project\'s three files, listed as kept', await phone.until(`[...document.querySelectorAll('#files-project [data-s=file]')].filter(li => li.dataset.state === 'kept').length === 3`, 30000));
  check('phone: the photo\'s preview loads there too', await phone.until(`(() => { const img = ${row(NAMES.png)}?.querySelector('img'); return !!img && img.complete && img.naturalWidth > 0; })()`, 20000));
  check('phone at 320 px: nothing scrolls sideways, and the file buttons are at least 44 px', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`)
    && await phone.ev(`[...document.querySelectorAll('#files-project [data-action^=file-]')].every(b => b.getBoundingClientRect().height >= 44)`), await phone.ev(`[...document.querySelectorAll('#files-project [data-action^=file-]')].map(b => b.getBoundingClientRect().height)`));

  // Phone: Remove the PDF → Recently deleted; Put back; Remove again; Delete now.
  await phone.ev(`${row(NAMES.pdf)}.querySelector('[data-action=file-remove]').click(), true`);
  check('phone: Remove says it\'s in Recently deleted for 30 days', await toast(phone, 'Removed — it’s in Recently deleted for 30 days.'));
  check('phone: the storage line adds that files in Recently deleted still count', await phone.until(`(document.querySelector('#files-project [data-s=files-storage]')?.textContent || '').endsWith('Files in Recently deleted count until they go.')`, 20000), await phone.ev(`(document.querySelector('#files-project [data-s=files-storage]')?.textContent || '')`));
  check('phone: Recently deleted lists it, with the day it goes for good', await phone.until(`(${deletedRow(NAMES.pdf)}?.textContent || '').includes('Goes for good on')`, 10000));
  await phone.ev(`${deletedRow(NAMES.pdf)}.querySelector('[data-action=file-put-back]').click(), true`);
  check('phone: Put back returns it to the project', await toast(phone, 'Put back.') && await phone.until(`!!${row(NAMES.pdf)}`, 10000));
  await phone.ev(`${row(NAMES.pdf)}.querySelector('[data-action=file-remove]').click(), true`); await D.sleep(400);
  await phone.ev(`${deletedRow(NAMES.pdf)}.querySelector('[data-action=file-delete-now]').click(), true`);
  check('phone: Delete now asks first', await phone.until(`(document.querySelector('dialog[open]')?.textContent || '').includes('for good')`, 5000));
  await phone.click('[data-action=dialog-confirm]');
  const pdfId = recs.find(f => f.name === NAMES.pdf).id;
  check('phone: …then the PDF is gone for good, from R2 and the account', await toast(phone, 'Deleted for good.') && await synced(phone)
    && (await files(who, { action: 'open', fileId: pdfId, area: 'project' })).status === 404
    && (await pullAll(who)).some(r => r.kind === 'file' && r.record_id === pdfId && r.deleted));
  await mac.open(BASE + `#projects/p/${pid}`); await synced(mac);
  check('mac: receives that, listing the two other files', await mac.until(`document.querySelectorAll('#files-project [data-s=file]').length === 2 && !${row(NAMES.pdf)}`, 30000));

  // Tidy: delete the project; its files wait on the Projects home, then Delete now for each leaves nothing in R2.
  await deleteProject(mac, pid);
  await mac.open(BASE + '#projects');
  check('tidy: deleting the project leaves its files on the Projects home (no Put back)', await mac.until(`document.querySelectorAll('[data-s=files-homeless] [data-s=file-deleted]').length === 2`, 15000)
    && await mac.ev(`!document.querySelector('[data-s=files-homeless] [data-action=file-put-back]')`));
  for (const n of [NAMES.png, NAMES.txt]) {
    await mac.ev(`${deletedRow(n)}.querySelector('[data-action=file-delete-now]').click(), true`);
    await mac.until(`!!document.querySelector('dialog[open]')`, 5000); await mac.click('[data-action=dialog-confirm]');
    await mac.until(`!${deletedRow(n)}`, 15000);
  }
  check('tidy: the project and its file records are gone and saved', !(await hasP(mac)) && (await mac.data()).files.items.every(f => !Object.values(NAMES).includes(f.name)) && await synced(mac));
  const left = await files(who, { action: 'usage' });
  check('tidy: nothing of account A is left in R2', left.j.bytes === 0, left.j);
  const live = (await pullAll(who)).filter(r => r.kind === 'file' && !r.deleted);
  check('tidy: no live file record is left in the account', live.length === 0, live.map(r => [r.record_id.slice(0, 6), r.seq, r.data?.state, r.data?.deletedOn]));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('tidy: and the phone has none of it', await phone.until(`!JSON.parse(localStorage.getItem('${KEY}')).projects.items.some(p => p.title === ${JSON.stringify(TITLE)}) && !JSON.parse(localStorage.getItem('${KEY}')).files.items.length`, 30000));
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
