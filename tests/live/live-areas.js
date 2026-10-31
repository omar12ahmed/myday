// Live check of project areas and the archive on the site (tests/live/run.py), on a disposable account and two
// throwaway devices (a Mac and a 320 px phone): two made-up projects are put in a made-up area (the second joins it,
// with its colour), the area is given another colour from Areas…, and the second project is finished — stopped on
// purpose, with a note. The live database holds both projects' area and colour and the ending exactly; the phone
// receives them (the area chip counting the one still going, the finished one in the Archive with "Stopped on purpose")
// and brings it back, which reaches the Mac (active, its ending gone). Then both projects are deleted everywhere.
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
const TITLES = ['Live check Areas one (made up)', 'Live check Areas two (made up)'], AREA = 'Live check (made up)', NOTE = 'Not worth it this year (made up)';
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
const areaBits = p => p && { area: p.area, areaColour: p.areaColour, status: p.status, finished: p.finished };
const chip = `[data-action=area-pick][data-id=${JSON.stringify(AREA)}]`;

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('liveareas-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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
  for (const id of (await mac.data()).projects.items.filter(p => TITLES.includes(p.title)).map(p => p.id)) await deleteProject(id);
  await synced(mac);

  // Mac: two made-up projects, each put in the made-up area (About it → Edit → Area).
  const ids = [];
  for (const title of TITLES) {
    await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
    await mac.type('#projectNew', title); await mac.click('[data-action=project-add]');
    await mac.until(`location.hash.startsWith('#projects/p/')`);
    const id = (await mac.data()).projects.items.find(p => p.title === title)?.id; ids.push(id);
    await mac.open(BASE + `#projects/p/${id}`); await mac.until(`!!document.querySelector('[data-action=project-edit]')`, 15000);
    await mac.click('[data-action=project-edit]'); await mac.until(`!!document.getElementById('projectArea')`, 5000);
    await mac.type('#projectArea', AREA);
    check(`mac: "${title}" is in the area ("In “${AREA}” now.")`, await toast(mac, `In “${AREA}” now.`) && (await projectOf(mac, id))?.area === AREA);
  }
  const [one, two] = ids, first = (await projectOf(mac, one)).areaColour;
  check('mac: the second joins the area with its colour, and the project\'s top shows its name', (await projectOf(mac, two)).areaColour === first && !!first
    && await mac.until(`(document.querySelector('#projectTop [data-s=area-label]')?.textContent || '') === ${JSON.stringify(AREA)}`, 5000));

  // Another colour from Areas… (not the one it has).
  const colour = first === 'teal' ? 'clay' : 'teal';
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('[data-action=areas-manage]')`, 15000);
  check('mac: the Projects home has the area\'s chip, counting both', await mac.until(`(document.querySelector(${JSON.stringify(chip)})?.textContent || '').replace(/\\s+/g, ' ').trim() === ${JSON.stringify(AREA + ' 2')}`, 10000), await mac.text('[data-s=project-areas]'));
  const stamps = (await mac.data()).projects.items.filter(p => ids.includes(p.id)).map(p => p.updatedAt);
  await mac.click('[data-action=areas-manage]'); await mac.until(`!!document.querySelector('[data-s=areas-panel]')`, 5000);
  await mac.ev(`[...document.querySelectorAll('[data-s=area-row]')].find(r => r.dataset.id === ${JSON.stringify(AREA)}).querySelector('[data-action=area-colour][data-id=${colour}]').click()`);
  check(`mac: recoloured — both projects are ${colour}, with no "updated" change`, await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).projects.items.filter(p => ${JSON.stringify(ids)}.includes(p.id)).every(p => p.areaColour === '${colour}')`, 5000)
    && same((await mac.data()).projects.items.filter(p => ids.includes(p.id)).map(p => p.updatedAt), stamps));

  // Finish the second: stopped on purpose, with a note.
  await mac.open(BASE + `#projects/p/${two}`); await mac.until(`!!document.querySelector('[data-action=project-finish]')`, 15000);
  await mac.click('[data-action=project-finish]'); await mac.until(`!!document.querySelector('[data-s=finish-form]')`, 5000);
  await mac.click('[data-action=finish-how][data-id=stopped]'); await mac.type('#finishNote', NOTE); await mac.click('[data-action=finish-save]');
  check('mac: finished — "Stopped — it\'s in the archive", and its top says "Stopped on purpose" with the note', await toast(mac, 'Stopped — it\'s in the archive')
    && await mac.until(`(document.querySelector('[data-s=project-ended]')?.textContent || '').startsWith('Stopped on purpose') && document.querySelector('[data-s=project-ended]').textContent.includes(${JSON.stringify(NOTE)})`, 5000));
  const ended = (await projectOf(mac, two)).finished;
  check('mac: saved as done, stopped, with the note and today', (await projectOf(mac, two)).status === 'done' && ended?.how === 'stopped' && ended?.note === NOTE && /^\d{4}-\d{2}-\d{2}$/.test(ended?.on || '') && await synced(mac), ended);

  const rows = await pullAll(who), rowOf = id => rows.find(r => r.kind === 'project' && r.record_id === id)?.data?.value;
  check('the live account holds both projects\' area and colour and the ending, exactly as on the Mac', same(areaBits(rowOf(one)), areaBits(await projectOf(mac, one))) && same(areaBits(rowOf(two)), areaBits(await projectOf(mac, two)))
    && rowOf(one)?.area === AREA && rowOf(two)?.areaColour === colour && rowOf(two)?.finished?.how === 'stopped', [areaBits(rowOf(one)), areaBits(rowOf(two))]);

  // Phone: receives them; brings the second back from the Archive.
  await phone.open(BASE + '#projects'); await synced(phone);
  check('phone: the area\'s chip counts the one still going', await phone.until(`(document.querySelector(${JSON.stringify(chip)})?.textContent || '').replace(/\\s+/g, ' ').trim() === ${JSON.stringify(AREA + ' 1')}`, 30000), await phone.text('[data-s=project-areas]'));
  check('phone: the first project\'s card shows the area', await phone.until(`(document.querySelector('.project-card[data-id="${one}"] [data-s=area-label]')?.textContent || '') === ${JSON.stringify(AREA)}`, 10000));
  check('phone: the Archive has the second, "Stopped on purpose ·", with its area', await phone.until(`(document.querySelector('#projects-archive [data-s=archive-row][data-id="${two}"] [data-s=archive-how]')?.textContent || '').startsWith('Stopped on purpose ·')
    && (document.querySelector('#projects-archive [data-s=archive-row][data-id="${two}"] [data-s=area-label]')?.textContent || '') === ${JSON.stringify(AREA)}`, 15000));
  check('phone at 320 px: the Projects home doesn\'t scroll sideways', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`));
  await phone.ev(`document.querySelector('#projects-archive details').open = true`);
  await phone.click(`#projects-archive [data-s=archive-row][data-id="${two}"] [data-action=archive-back]`);
  check('phone: brought back — active, its ending gone, and saved', await toast(phone, 'is back in your projects.') && (await projectOf(phone, two)).status === 'active' && !('finished' in (await projectOf(phone, two))) && await synced(phone));
  await mac.open(BASE + `#projects/p/${two}`); await synced(mac);
  check('mac: receives it — active, no ending shown, still in the area', await mac.until(`(() => { const p = JSON.parse(localStorage.getItem('${KEY}')).projects.items.find(p => p.id === '${two}'); return p.status === 'active' && !p.finished && p.area === ${JSON.stringify(AREA)}; })()`, 30000)
    && !(await mac.exists('[data-s=project-ended]')));

  // Tidy: both projects, everywhere.
  for (const id of ids) await deleteProject(id);
  check('tidy: both projects are gone on the Mac and saved', !(await mac.data()).projects.items.some(p => ids.includes(p.id)) && await synced(mac));
  const left = (await pullAll(who)).filter(r => r.kind === 'project' && ids.includes(r.record_id));
  check('tidy: in the account they are deletion markers', left.length === 2 && left.every(r => r.deleted), left.map(r => [r.kind, r.deleted]));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('tidy: and the phone has neither, and no area chips from them', await phone.until(`!JSON.parse(localStorage.getItem('${KEY}')).projects.items.some(p => ${JSON.stringify(ids)}.includes(p.id)) && !document.querySelector(${JSON.stringify(chip)})`, 30000));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
