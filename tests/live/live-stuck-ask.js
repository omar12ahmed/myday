// Live check of the Stuck card's hand-over to Ask MyDay (1.118.0) on the site (tests/live/run.py), on a disposable account
// and one throwaway Mac-width device, without the AI (its requests are blocked; nothing should be sent anyway). A made-up
// task that has moved 3 times shows "What's getting in the way?"; "I don't know where to start" offers "Think it through
// with Ask MyDay"; tapping it keeps the answer with the task (synced) and opens + about the task, waiting for a tap; the
// card stays open as left. Then the task is removed, so the account is as before (apart from its deletion marker).
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
const ID = 'tkLiveStuckAsk', TITLE = 'Sort the spare room (made up)';
const task = () => `JSON.parse(localStorage.getItem('myday.data.v4')).tasks.items.find(t => t.id === '${ID}') || null`;

(async () => {
  await D.connect();
  const mac = await D.device('livestuck-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#today');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
  const today = await mac.ev(`(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()`);
  const at = `${today}T08:00`;
  await mac.setData(`s => { s.tasks.items = s.tasks.items.filter(t => t.id !== '${ID}'); s.tasks.items.push({ id: '${ID}', title: '${TITLE}', listId: '', category: 'admin', minutes: 30, due: null, time: null, notes: '', done: false, doneOn: null,
    plannedOn: null, planUid: null, createdAt: '${at}', postponed: 3, blockers: [], letGoOn: null }); }`);
  await mac.until(`!!document.getElementById('nav')`, 20000); await synced(mac);
  await mac.ev(`location.hash = 'today/tasks/${ID}'`);
  check('a made-up task that has moved 3 times shows "What’s getting in the way?" on its page', await mac.until(`!!document.getElementById('stuckCard')`, 15000));
  await mac.click('[data-s=blocker][data-id=start]'); await D.sleep(300);
  check('"I don’t know where to start" keeps its first-step field and offers "Think it through with Ask MyDay"', (await mac.exists('#stuckText'))
    && (await mac.text('[data-s=stuck-ask]')) === 'Not sure what the first step is? Think it through with Ask MyDay', await mac.text('#stuckCard'));
  await mac.type('#stuckText', 'find the boxes (made up)');
  await mac.click('[data-action=stuck-ask]'); await mac.until(`!!document.getElementById('captureText')`, 10000); await D.sleep(400);
  check('tapping it opens + with "I don’t know where to start with this" typed, waiting for you (nothing sent)', (await mac.ev(`document.getElementById('captureText').value`)) === "I don't know where to start with this"
    && (await mac.ev(`document.querySelector('[data-s=ask-panel]')?.dataset.phase`)) === 'idle', await mac.ev(`document.querySelector('[data-s=ask-panel]')?.dataset.phase`));
  check('…and the preview is about this task', (await mac.text('[data-s=ask-sends]')).includes(TITLE), await mac.text('[data-s=ask-sends]'));
  await synced(mac);
  const kept = await mac.ev(task());
  check('the answer is kept with the task (today, once), its moves still 3, and synced', JSON.stringify(kept?.blockers) === JSON.stringify([{ reason: 'start', on: today }]) && kept.postponed === 3, kept);
  await mac.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await D.sleep(500);
  check('closed, the card is still open as left: the answer chosen and the first step typed', await mac.exists('#stuckCard')
    && (await mac.ev(`document.querySelector('[data-s=blocker][data-id=start]')?.getAttribute('aria-pressed')`)) === 'true' && (await mac.ev(`document.getElementById('stuckText')?.value`)) === 'find the boxes (made up)');
  check('no AI request was made', await mac.ev(`!performance.getEntriesByType('resource').some(e => e.name.includes('functions/v1/ai-plan'))`));
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
