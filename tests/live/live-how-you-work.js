// Live check of "Let Ask MyDay use how you work" on the site (tests/live/run.py), on a disposable account and one
// throwaway Mac-width device, without the AI: in What MyDay has noticed, a longest-task preference and the switch on;
// the card lists exactly what Ask MyDay would be sent; + shows "How you work" in what's sent (nothing is asked); then
// the switch off and the preference back to no limit, so the account is as before (apart from MyDay remembering you
// answered about Ask). Never prints account details. Writes to the live account: only with the owner's yes.
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
const saved = d => d.ev(`(() => { const s = JSON.parse(localStorage.getItem('myday.data.v4')); return JSON.stringify([s.tasks.items.length, s.notes.items.length, s.projects.items.length]); })()`);
const shown = (d, ms = 60000) => d.until(`['shown', 'error'].includes(document.querySelector('[data-s=ask-panel]')?.dataset.phase) && !document.querySelector('[data-s=ask-panel] [role=status]')`, ms);

(async () => {
  await D.connect();
  const mac = await D.device('livehow-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#today');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
  const prefsBefore = await mac.ev(`JSON.stringify((({ maxMinutes, maxTasks }) => ({ maxMinutes, maxTasks }))(JSON.parse(localStorage.getItem('myday.data.v4')).patterns.prefs))`);
  const go = async h => { await mac.ev(`location.hash = '${h}'`); await D.sleep(700); };
  await go('noticed');
  check('What MyDay has noticed has "Let Ask MyDay use how you work"', await mac.until(`!!document.querySelector('[data-action=ask-use]')`, 20000));
  if ((await mac.ev(`document.querySelector('[data-action=ask-use]').getAttribute('aria-checked')`)) === 'true') { await mac.click('[data-action=ask-use]'); await D.sleep(400); }
  await mac.type('#prefMin-admin', '15'); await D.sleep(400);
  await mac.click('[data-action=ask-use]'); await mac.until(`!!document.querySelector('[data-s=ask-use-lines]')`, 10000);
  check('switched on: the card lists what Ask MyDay would be sent (your longest admin task)', (await mac.text('[data-s=ask-use-lines]')).includes('Admin tasks: 15 min at most'), await mac.text('#askUse'));
  check('…and what it has counted (nothing yet, never words)', /What it has counted of its suggestions: nothing yet/.test(await mac.text('[data-s=ask-use-seen]')), await mac.text('[data-s=ask-use-seen]'));
  await go('today');
  await mac.click('[data-action=capture-open]'); await mac.until(`!!document.getElementById('captureText')`, 10000); await D.sleep(300);
  await mac.type('#captureText', 'Break my admin into small tasks (made up)'); await D.sleep(400);
  check('+ says "How you work" goes with Ask MyDay (nothing is asked)', (await mac.text('[data-s=ask-sends]')).includes('How you work'), await mac.text('[data-s=ask-sends]'));
  await mac.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await D.sleep(400);
  await go('noticed');
  await mac.until(`!!document.querySelector('[data-action=ask-use]')`, 10000);
  await mac.click('[data-action=ask-use]'); await D.sleep(400);
  await mac.type('#prefMin-admin', ''); await D.sleep(400);
  await synced(mac);
  const after = await mac.ev(`JSON.parse(localStorage.getItem('myday.data.v4')).patterns`);
  check('switched off again: nothing more is sent, counts forgotten, your preference back as it was', !after.prefs.askUse && !('askSeen' in after) && !!after.prefs.askAsked
    && JSON.stringify((({ maxMinutes, maxTasks }) => ({ maxMinutes, maxTasks }))(after.prefs)) === prefsBefore, after.prefs);
  check('no AI request was made', await mac.ev(`!performance.getEntriesByType('resource').some(e => e.name.includes('functions/v1/ai-plan'))`));
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 200));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
