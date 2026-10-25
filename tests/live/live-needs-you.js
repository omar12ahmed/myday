// Live check of the Projects home's "Needs you" and Board · List on the site (tests/live/run.py), on a disposable
// account and two throwaway devices (a Mac and a 320 px phone): a made-up project's task due today shows in Needs you
// on both devices (synced as usual), opens its task, goes once it's done; the List shows the project with "1 needs
// you"; the choice stays on its device. Then the project and its task are deleted everywhere. Never prints account
// details. Writes to the live database: only with the owner's yes.
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
const TITLE = 'Live check Needs you (made up)', TASK = 'Measure the alcove (made up)';
// (The engine shows a change on the badge 300 ms after it, so wait that out first.)
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 30000); };
const rowOf = id => `document.querySelector('#needsYou [data-s=need][data-id="date:${id}"]')`;

(async () => {
  await D.connect();
  const devs = [];
  for (const [i, name] of ['mac', 'phone'].entries()) {
    const d = await D.device('liveny-' + name, path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-' + name));
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
  const deleteProject = async (d, id) => { await d.open(BASE + `#projects/p/${id}`); await d.until(`!!document.querySelector('[data-action=project-delete]')`); await d.click('[data-action=project-delete]'); await D.sleep(250); await d.click('[data-action=dialog-confirm]'); await D.sleep(500); };
  const deleteTask = async (d, id) => { await d.open(BASE + `#today/tasks/${id}`); if (!await d.until(`!!document.querySelector('[data-action=task-delete]')`, 10000)) return; await d.click('[data-action=task-delete]'); await d.until(`!!document.querySelector('[data-action=dialog-confirm]')`, 5000); await d.click('[data-action=dialog-confirm]'); await D.sleep(500); };

  // Tidy first.
  for (const id of (await mac.data()).projects.items.filter(p => p.title === TITLE).map(p => p.id)) await deleteProject(mac, id);
  for (const id of (await mac.data()).tasks.items.filter(t => t.title === TASK).map(t => t.id)) await deleteTask(mac, id);
  await synced(mac);

  // Mac: a made-up project with a task due today (set on its page).
  await mac.open(BASE + '#projects'); await mac.until(`!!document.querySelector('#projectNew')`);
  await mac.type('#projectNew', TITLE); await mac.click('[data-action=project-add]');
  await mac.until(`location.hash.startsWith('#projects/p/')`);
  const pid = (await mac.data()).projects.items.find(p => p.title === TITLE).id;
  await mac.open(BASE + `#projects/p/${pid}`); await mac.until(`!!document.querySelector('#projectTaskNew')`, 15000);
  await mac.type('#projectTaskNew', TASK); await mac.click('[data-action=project-task-add]');
  await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.some(t => t.title === ${JSON.stringify(TASK)})`, 10000);
  const tid = (await mac.data()).tasks.items.find(t => t.title === TASK).id;
  await mac.open(BASE + `#today/tasks/${tid}`); await mac.until(`!!document.querySelector('#tDue')`, 15000);
  const today = await mac.today();
  await mac.type('#tDue', today);
  check('mac: the task is due today and saved to the account', await mac.until(`JSON.parse(localStorage.getItem('${KEY}')).tasks.items.find(t => t.id === '${tid}')?.due === '${today}'`, 10000) && await synced(mac));

  // Needs you on the Mac: the task, "today", with the project's name; opening it goes to the task.
  await mac.open(BASE + '#projects');
  check('mac: Needs you is at the top of the Projects home, with the task "today · <project>"', await mac.until(`!!${rowOf(tid)}`, 15000)
    && (await mac.ev(`${rowOf(tid)}.textContent`)).includes(`today · ${TITLE}`) && await mac.ev(`document.querySelector('#needsYou').compareDocumentPosition(document.querySelector('#projectsIntro')) & Node.DOCUMENT_POSITION_FOLLOWING`), await mac.text('#needsYou'));
  check('mac: its line opens the task', await mac.ev(`${rowOf(tid)}.querySelector('[data-s=need-link]').getAttribute('href')`) === `#today/tasks/${tid}`);
  await mac.click('[data-action=projects-view][data-id=list]');
  check('mac: List shows the project with "1 needs you", and the choice stays on this device', await mac.until(`[...document.querySelectorAll('#projectsList [data-s=project-row]')].some(r => r.dataset.id === '${pid}' && r.querySelector('[data-s=project-needs]')?.textContent === '1 needs you')`, 10000)
    && await mac.ev(`localStorage.getItem('myday.projects.view') === 'list' && !('projectsView' in JSON.parse(localStorage.getItem('${KEY}')))`), await mac.text('#projectsList'));

  // Phone: the same item arrives with sync; its own view is still the board; 320 px.
  await phone.open(BASE + '#projects'); await synced(phone);
  check('phone: Needs you shows the same task after syncing; its own view is still the board', await phone.until(`!!${rowOf(tid)}`, 30000) && await phone.ev(`!!document.querySelector('#projectList') && !document.querySelector('#projectsList')`), await phone.text('#needsYou'));
  check('phone at 320 px: nothing scrolls sideways, and the card\'s links and buttons are at least 44 px', await phone.ev(`document.documentElement.scrollWidth <= innerWidth`)
    && await phone.ev(`[...document.querySelectorAll('#needsYou a, #needsYou button, #needsYou select, [data-s=projects-view] button')].every(e => e.getBoundingClientRect().height >= 44)`));

  // Done on the phone: it goes from Needs you on both devices.
  await phone.open(BASE + `#today/tasks/${tid}`); await phone.until(`!!document.querySelector('[data-action=task-toggle]')`, 15000);
  await phone.click('[data-action=task-toggle]'); await synced(phone);
  await phone.open(BASE + '#projects');
  check('phone: once it\'s done, it leaves Needs you', await phone.until(`!!document.querySelector('#needsYou') && !${rowOf(tid)}`, 15000));
  await mac.open(BASE + '#projects'); await synced(mac);
  check('mac: …and there too, after syncing', await mac.until(`!${rowOf(tid)}`, 30000));

  // Tidy: the project and the task, everywhere; the Mac's view back to the board.
  await deleteProject(mac, pid); await deleteTask(mac, tid);
  await mac.ev(`localStorage.removeItem('myday.projects.view')`);
  check('tidy: the project and the task are gone and saved', !(await mac.data()).projects.items.some(p => p.id === pid) && !(await mac.data()).tasks.items.some(t => t.id === tid) && await synced(mac));
  await phone.open(BASE + '#projects'); await synced(phone);
  check('tidy: and the phone has none of it', await phone.until(`(() => { const d = JSON.parse(localStorage.getItem('${KEY}')); return !d.projects.items.some(p => p.id === '${pid}') && !d.tasks.items.some(t => t.id === '${tid}'); })()`, 30000));
  const errs = devs.flatMap(d => d.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => d.name + ': ' + (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 120)));
  check('no page errors on either device', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
