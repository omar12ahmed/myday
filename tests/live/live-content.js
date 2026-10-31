// Live check of Content projects on the site (tests/live/run.py), on a disposable account and two throwaway devices
// (a Mac and a 320 px phone): a made-up Content project gets an idea, made a video, with two title options (one
// chosen), an example, an outline beat, a shot made a dated task, a planned post day (its "Post: …" task) and results;
// then a made-up 67 MB video is uploaded to it in two parts — which proves the bucket's CORS for parts (the ETag) from
// the site itself. The live database holds the video's record and the file exactly; the phone receives them and plays
// the upload. Then the upload is deleted for good, and the project, its video and its tasks deleted everywhere.
// Never prints account details. Writes to the live database and R2: only with the owner's yes.
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
const fs = require('fs');
const TITLE = 'Live check Content (made up)', IDEA = 'Tea sellers at dawn (made up)', CLIP = 'Live check clip (made up).mp4';
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
const todayIn = d => d.ev(`(() => { const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); })()`);

const pick = (d, sel, value) => d.ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
const give = async (d, sel, paths) => { const doc = await d.send('DOM.getDocument', { depth: -1 }); const { nodeId } = await d.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: sel }); await d.send('DOM.setFileInputFiles', { nodeId, files: paths }); };
const contentOf = async (d, id) => ((await d.data()).content?.items || []).find(x => x.id === id);

(async () => {
  // The made-up video: an MP4's first bytes, then zeros — 64 MB + 3 MB, so two parts.
  const clipPath = path.join(process.env.MYDAY_LIVE_TEMP, CLIP), SIZE = 67 * 1024 * 1024;
  const head = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom'), Buffer.alloc(12)]), fd = fs.openSync(clipPath, 'w');
  fs.writeSync(fd, head); fs.ftruncateSync(fd, SIZE); fs.closeSync(fd);
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('livecontent-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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
  for (const id of (await mac.data()).tasks.items.filter(t => /^(Film|Post): .*\(made up\)/.test(t.title)).map(t => t.id)) await deleteTask(id);
  await synced(mac);
  const today = await todayIn(mac);

  // Mac: a made-up Content project, an idea made a video.
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-kind][value=content]'); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`);
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE)?.id;
  check('mac: a made-up Content project', (await projectOf(mac, pid))?.template === 'content');
  await mac.open(BASE + `#projects/p/${pid}/videos`); await mac.until(`!!document.getElementById('ideaNew')`, 15000);
  await mac.type('#ideaNew', IDEA); await mac.click('[data-action=idea-add]');
  check('mac: an idea kept', await toast(mac, 'Idea kept.'));
  await mac.until(`!!document.querySelector('[data-action=idea-make]')`, 5000); await mac.click('[data-action=idea-make]');
  await mac.until(`!!document.querySelector('[data-s=video-page]')`, 10000);
  const vid = ((await mac.data()).content?.items || []).find(x => x.projectId === pid)?.id;
  check('mac: made a video, in Planning, on its own page', (await contentOf(mac, vid))?.step === 'planning' && await mac.until(`location.hash.includes('/videos/${vid}')`, 5000));

  // Its planning.
  for (const t of ['Tea at first light (made up)', 'Hargeisa wakes up (made up)']) {
    await pick(mac, '#optionKind', 'title'); await mac.type('#optionNew', t); await mac.click('[data-action=option-add]');
    await mac.until(`(JSON.parse(localStorage.getItem('${KEY}')).content.items.find(x => x.id === '${vid}').options || []).some(o => o.text === ${JSON.stringify(t)})`, 5000);
  }
  await mac.ev(`[...document.querySelectorAll('[data-s=option]')].find(li => li.textContent.includes('Hargeisa wakes up')).querySelector('[data-action=option-choose]').click()`);
  check('mac: two title options, one chosen — it becomes the title', await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).content.items.find(x => x.id === '${vid}').title === 'Hargeisa wakes up (made up)'`, 5000));
  await mac.type('#exampleUrl', 'https://example.com/made-up-video'); await mac.type('#exampleAt', '0:12'); await mac.type('#exampleNote', 'How they open (made up)'); await mac.click('[data-action=example-add]');
  await mac.type('#line-outline', 'Gate at dawn (made up)'); await mac.click('[data-s=line-list][data-id=outline] [data-action=line-add]');
  await mac.type('#line-shots', 'Wide of the stall (made up)'); await mac.click('[data-s=line-list][data-id=shots] [data-action=line-add]');
  await mac.until(`(JSON.parse(localStorage.getItem('${KEY}')).content.items.find(x => x.id === '${vid}').shots || []).length === 1`, 5000);
  await mac.click('[data-s=line-list][data-id=shots] [data-action=line-task]');
  const shotId = (await contentOf(mac, vid)).shots[0].id;
  await mac.until(`!!document.getElementById('lineDay-${shotId}')`, 5000); await mac.type(`#lineDay-${shotId}`, today); await mac.click('[data-action=line-task-add]');
  await mac.until(`!!JSON.parse(localStorage.getItem('${KEY}')).content.items.find(x => x.id === '${vid}').shots[0].taskId`, 5000);
  const filmId = (await contentOf(mac, vid)).shots[0].taskId;
  await mac.type('#videoPostOn', today);
  await mac.until(`!!JSON.parse(localStorage.getItem('${KEY}')).content.items.find(x => x.id === '${vid}').postTaskId`, 5000);
  const postId = (await contentOf(mac, vid)).postTaskId;
  await pick(mac, '#resultPlatform', 'tiktok'); await mac.type('#result-views', '1,200'); await mac.type('#result-likes', '85'); await mac.click('[data-action=result-add]');
  const v = await contentOf(mac, vid), tasks = (await mac.data()).tasks.items;
  check('mac: an example, a beat, a shot made a task for today ("Film: …"), the post day\'s task ("Post: …"), and results', v.examples?.length === 1 && v.outline?.length === 1
    && tasks.some(t => t.id === filmId && t.title === 'Film: Wide of the stall (made up)' && t.due === today && t.projectId === pid)
    && tasks.some(t => t.id === postId && t.title === 'Post: Hargeisa wakes up (made up)' && t.due === today) && v.results?.[0]?.views === 1200 && v.results?.[0]?.likes === 85, v);

  // A made-up video, uploaded in two parts.
  await mac.until(`!!document.querySelector('#files-video input[type=file]')`, 5000);
  await give(mac, '#files-video input[type=file]', [clipPath]);
  const kept = await mac.until(`(JSON.parse(localStorage.getItem('${KEY}')).files.items || []).some(f => f.name === ${JSON.stringify(CLIP)} && f.state === 'kept')`, 300000);
  const fileRec = (await mac.data()).files.items.find(f => f.name === CLIP);
  check('mac: a 67 MB video uploaded in parts and kept (the bucket takes parts from the site), with nothing left to carry on', kept && fileRec?.size === SIZE && fileRec?.area === 'content' && (await mac.ev(`localStorage.getItem('myday.files.parts') || '{}'`)) === '{}' && await synced(mac), fileRec);
  check('mac: the video lists it', ((await contentOf(mac, vid)).fileIds || []).includes(fileRec?.id));

  const rows = await pullAll(who), cRow = rows.find(r => r.kind === 'content' && r.record_id === vid), fRow = rows.find(r => r.kind === 'file' && r.record_id === fileRec?.id);
  check('the live account holds the video\'s record and the file\'s, exactly as on the Mac', same(cRow?.data, await contentOf(mac, vid)) && fRow?.data?.state === 'kept' && fRow?.data?.size === SIZE, { c: !!cRow, f: fRow?.data?.state });

  // Phone: receives it, plays the upload.
  await phone.open(BASE + `#projects/p/${pid}/videos/${vid}`); await synced(phone);
  check('phone: the video\'s page, with its chosen title and the upload kept', await phone.until(`(document.getElementById('videoTitleH')?.textContent || '') === 'Hargeisa wakes up (made up)' && !!document.querySelector('#files-video [data-s=file][data-state=kept]')`, 30000));
  check('phone at 320 px: the video\'s page doesn\'t scroll sideways', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`));
  await phone.click('#files-video [data-action=file-play]');
  check('phone: Play gives a player on a link to the upload', await phone.until(`!!document.querySelector('#files-video [data-s=file-player]')?.getAttribute('src')`, 15000));

  // Tidy: the upload deleted for good, then the project (its video with it) and its tasks, everywhere.
  await mac.open(BASE + `#projects/p/${pid}/videos/${vid}`); await mac.until(`!!document.querySelector('#files-video [data-action=file-remove]')`, 15000);
  await mac.click('#files-video [data-action=file-remove]'); await mac.until(`!!document.querySelector('[data-action=file-delete-now]')`, 10000);
  await mac.click('[data-action=file-delete-now]'); if (await mac.until(`!!document.querySelector('[data-action=dialog-confirm]')`, 3000)) await mac.click('[data-action=dialog-confirm]');
  check('tidy: the upload is deleted for good', await mac.until(`!(JSON.parse(localStorage.getItem('${KEY}')).files.items || []).some(f => f.id === '${fileRec?.id}')`, 30000));
  await deleteProject(pid); await deleteTask(filmId); await deleteTask(postId);
  check('tidy: the project, its video and its tasks are gone on the Mac and saved', !(await mac.data()).projects.items.some(p => p.id === pid) && !((await mac.data()).content?.items || []).some(x => x.projectId === pid)
    && !(await mac.data()).tasks.items.some(t => t.id === filmId || t.id === postId) && await synced(mac));
  const left = (await pullAll(who)).filter(r => (r.kind === 'project' && r.record_id === pid) || (r.kind === 'content' && r.record_id === vid) || (r.kind === 'task' && (r.record_id === filmId || r.record_id === postId)) || (r.kind === 'file' && r.record_id === fileRec?.id));
  check('tidy: in the account they are deletion markers', left.length === 5 && left.every(r => r.deleted), left.map(r => [r.kind, r.deleted]));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('tidy: and the phone has none of it', await phone.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !d.projects.items.some(p => p.id === '${pid}') && !(d.content?.items || []).some(x => x.id === '${vid}'); })()`, 30000));
  fs.rmSync(clipPath, { force: true });
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
