// Live check of start offers on Today (1.122.0, specs/help-me-start.md §5) on the site (tests/live/run.py), on a
// disposable account and one throwaway Mac-width device, without the AI (its requests are blocked; nothing is sent). A
// made-up task moved 9 times (so it's the most moved) shows "You've moved … 9 times. Want an easier way in?" at the top of
// Today; Help me start opens its page with the card open; "Not now" takes the card away for today, as MyDay's own note on
// this device — the synced preferences are left exactly as they were. The task is removed after.
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
const ID = 'tkLiveStartOffer', TITLE = 'Return the library books (made up)';
const saved = () => `JSON.parse(localStorage.getItem('myday.data.v4'))`;

(async () => {
  await D.connect();
  const mac = await D.device('liveoffer-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#today');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
  const today = await mac.ev(`(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()`);
  const prefsBefore = await mac.ev(`JSON.stringify(${saved()}.patterns.prefs)`);
  await mac.setData(`s => { s.tasks.items = s.tasks.items.filter(t => t.id !== '${ID}'); s.tasks.items.push({ id: '${ID}', title: '${TITLE}', listId: '', category: 'admin', minutes: 15, due: null, time: null,
    notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '${today}T08:00', postponed: 9, blockers: [], letGoOn: null }); }`);
  await mac.until(`!!document.getElementById('nav')`, 20000); await synced(mac);
  await mac.ev(`location.hash = 'today'`); await D.sleep(600);
  check('Today offers an easier way in for the task that keeps moving', await mac.until(`!!document.getElementById('startOffer')`, 15000)
    && (await mac.text('#startOffer [data-s=start-offer]')) === `You’ve moved “${TITLE}” 9 times. Want an easier way in?`, await mac.text('#startOffer'));
  check('…as today’s one offer, noted on this device only (the synced preferences unchanged)', (await mac.ev(`${saved()}.nudge.offerOn?.kind`)) === 'start' && (await mac.ev(`JSON.stringify(${saved()}.patterns.prefs)`)) === prefsBefore);
  await mac.click('[data-action=offer-help-start]'); await D.sleep(600);
  check('Help me start opens the task’s page with its card open', (await mac.ev('location.hash')) === `#today/tasks/${ID}` && await mac.until(`!!document.getElementById('startCard')`, 10000));
  await mac.ev(`location.hash = 'today'`); await D.sleep(600);
  await mac.until(`!!document.getElementById('startOffer')`, 10000);
  await mac.click('[data-action=offer-not-now]'); await D.sleep(500);
  check('"Not now" takes the card away and says so, noted on this device only', !(await mac.exists('#startOffer')) && (await mac.text('#toast')).includes('No suggestions today or tomorrow')
    && (await mac.ev(`${saved()}.nudge.notNowOn`)) === today && (await mac.ev(`JSON.stringify(${saved()}.patterns.prefs)`)) === prefsBefore);
  await mac.open(BASE + '#today'); await mac.until(`!!document.getElementById('nav')`, 20000); await D.sleep(800);
  check('…and after a reload, nothing is offered today', !(await mac.exists('#startOffer')) && !(await mac.exists('#nudge')) && !(await mac.exists('#noticedLink')));
  check('no AI request was made', await mac.ev(`!performance.getEntriesByType('resource').some(e => e.name.includes('functions/v1/ai-plan'))`));
  await mac.setData(`s => { s.tasks.items = s.tasks.items.filter(t => t.id !== '${ID}'); }`);
  await mac.until(`!!document.getElementById('nav')`, 20000);
  check('the made-up task is removed again, and synced, with the preferences as they were', await synced(mac) && (await mac.ev(`${saved()}.tasks.items.some(t => t.id === '${ID}')`)) === false
    && (await mac.ev(`JSON.stringify(${saved()}.patterns.prefs)`)) === prefsBefore);
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 200));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
