// Live check of "Help me start" (specs/help-me-start.md) on the site (tests/live/run.py), on a disposable account and one
// throwaway Mac-width device, without the AI (its requests are blocked; nothing should be sent). A made-up task due today,
// with notes holding a link and two steps (one ticked): "Help me start" opens the card with its seven answers, what to
// open and the next step; "I want it perfect" adds the rough-first-try line; "Later" moves it to tomorrow without
// counting a move and keeps that answer (synced). The plan and the timer are left alone, and the task is removed after.
// Never prints account details. Writes to the live account: only with the owner's yes.
const path = require('path');
const D = require(path.join(__dirname, 'devices.js'));
const BASE = process.env.MYDAY_BASE || 'https://omar12ahmed.github.io/myday/', VERSION = process.env.MYDAY_VERSION, SRC = process.env.MYDAY_SRC;
const A = { email: process.env.MYDAY_LIVE_EMAIL, password: process.env.MYDAY_LIVE_PASSWORD }; // the disposable account run.py chose
if (!process.argv.includes('--live') || !A.email?.endsWith('@example.com') || !A.password || !SRC || !VERSION) {
  console.log('Refused: explicit live check, a disposable account, version and source commit required.'); process.exit(2);
}
let pass = 0, fail = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || info === undefined ? '' : ' → ' + JSON.stringify(info).slice(0, 300))); ok ? pass++ : fail++; };
const synced = async d => { await D.sleep(500); return d.until(`document.querySelector('#syncBadge')?.dataset.status === 'synced' && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link?.out || {}).length === 0`, 30000); };
const ID = 'tkLiveHelpStart', TITLE = 'Write the garden plan (made up)', URL = 'https://example.com/garden-plan';
const task = () => `JSON.parse(localStorage.getItem('myday.data.v4')).tasks.items.find(t => t.id === '${ID}') || null`;

(async () => {
  await D.connect();
  const mac = await D.device('livehelp-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#today');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
  const today = await mac.ev(`(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()`);
  const tomorrow = await mac.ev(`(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()`);
  const timerBefore = await mac.ev(`JSON.stringify(JSON.parse(localStorage.getItem('myday.data.v4')).timer ?? null)`);
  await mac.setData(`s => { s.tasks.items = s.tasks.items.filter(t => t.id !== '${ID}'); s.tasks.items.push({ id: '${ID}', title: '${TITLE}', listId: '', category: 'admin', minutes: 30, due: '${today}', time: null,
    notes: 'Ideas are here: ${URL}.', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '${today}T08:00', postponed: 1, blockers: [], letGoOn: null,
    steps: [{ id: 'sLive1', text: 'Measure the beds', done: true }, { id: 'sLive2', text: 'Sketch the layout', done: false }] }); }`);
  await mac.until(`!!document.getElementById('nav')`, 20000); await synced(mac);
  await mac.ev(`location.hash = 'today/tasks/${ID}'`);
  await mac.until(`!!document.querySelector('[data-action=task-help-start]')`, 15000);
  await mac.click('[data-action=task-help-start]'); await D.sleep(400);
  check('"Help me start" opens "Let’s get started" with seven answers to choose from, none chosen', await mac.exists('#startCard') && (await mac.ev(`document.querySelectorAll('[data-s=start-answer]').length`)) === 7
    && (await mac.ev(`document.querySelectorAll('[data-s=start-answer][aria-pressed=true]').length`)) === 0, await mac.text('#startCard'));
  const open = await mac.text('[data-s=start-open]');
  check('Open it: the link in its notes (opening in a new tab), its notes and the next step', open.includes('Open the link in its notes') && open.includes('Next step: Sketch the layout')
    && (await mac.ev(`document.querySelector('[data-s=start-open] a[target=_blank]')?.getAttribute('href')`)) === URL, open);
  await mac.click('[data-s=start-answer][data-id=perfect]'); await D.sleep(200);
  check('"I want it perfect" adds "A rough first try still counts as started."', (await mac.text('[data-s=start-rough]')) === 'A rough first try still counts as started.');
  await mac.click('[data-action=start-later]'); await D.sleep(500);
  await synced(mac);
  const after = await mac.ev(task());
  check('"Later" moves it to tomorrow without counting a move, keeps "I want it perfect" (synced) and closes the card', after?.due === tomorrow && after.postponed === 1
    && JSON.stringify(after.blockers) === JSON.stringify([{ reason: 'other', on: today, kind: 'perfect' }]) && !(await mac.exists('#startCard')), after);
  check('…and focus goes back to "Help me start"', (await mac.ev(`document.activeElement?.dataset?.action || ''`)) === 'task-help-start');
  check('the timer is as it was, and no AI request was made', (await mac.ev(`JSON.stringify(JSON.parse(localStorage.getItem('myday.data.v4')).timer ?? null)`)) === timerBefore
    && await mac.ev(`!performance.getEntriesByType('resource').some(e => e.name.includes('functions/v1/ai-plan'))`));
  await mac.ev(`location.hash = 'today'`); await D.sleep(400);
  await mac.setData(`s => { s.tasks.items = s.tasks.items.filter(t => t.id !== '${ID}'); }`);
  await mac.until(`!!document.getElementById('nav')`, 20000);
  check('the made-up task is removed again, and synced', await synced(mac) && (await mac.ev(task())) === null);
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 200));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
