// Live check of today's Ask MyDay conversation kept on the device (tests/live/run.py), on a disposable account and one
// throwaway Mac-width device, with the real AI: a made-up question is answered; closing + keeps it, and + opened again
// (on another page) offers to carry it on; Carry on brings back the thread with a reply box; Start over forgets it. It's
// kept on the device only: never in the account's synced data. Nothing is added. One AI request of the account's 20 a
// day. Never prints account details. Only with the owner's yes.
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
const Q = 'What does a good weekly review look like? (made up)';

(async () => {
  await D.connect();
  const mac = await D.device('livekeep-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#today');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
  const before = await saved(mac);
  const openPlus = async () => { await mac.click('[data-action=capture-open]'); await mac.until(`!!document.getElementById('captureText')`, 10000); await D.sleep(400); };
  const closePlus = async () => { await mac.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await D.sleep(400); };

  await openPlus();
  await mac.type('#captureText', Q); await D.sleep(300);
  await mac.click('[data-action=ask-go]'); await shown(mac);
  check('a made-up question is answered by the AI', (await mac.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`)) === 'shown' && (await mac.text('[data-s=ask-panel]')).includes('AI-written by'));
  await closePlus();
  await mac.ev(`location.hash = 'calendar'`); await D.sleep(600);
  await openPlus();
  check('+ opened again on another page offers to carry it on', /^Your Ask MyDay conversation from \d\d:\d\d \(one message\)\.$/.test((await mac.text('[data-s=ask-kept] span')).trim()), await mac.text('[data-s=ask-kept]'));
  await mac.click('[data-action=ask-carry-on]'); await D.sleep(400);
  const turns = await mac.ev(`[...document.querySelectorAll('[data-s=ask-turn] summary')].map(s => s.textContent.trim())`);
  check('Carry on brings back the thread (the question folded to one line) with a reply box', (await mac.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`)) === 'resumed' && turns.length === 1 && turns[0] === `You: ${Q}` && await mac.exists('[data-s=ask-more]'), turns);
  await synced(mac);
  check('it\'s on this device only: never in the synced data', !(await mac.ev(`localStorage.getItem('myday.data.v4')`)).includes('(made up)') && (await mac.ev(`localStorage.getItem('myday.ask.conversation') || ''`)).includes('(made up)'));
  await mac.click('[data-action=ask-dismiss]'); await D.sleep(300);
  await closePlus(); await openPlus();
  check('Start over forgets it: nothing to carry on', !(await mac.exists('[data-s=ask-kept]')) && (await mac.ev(`localStorage.getItem('myday.ask.conversation')`)) === null);
  await closePlus();
  check('nothing was added: the device\'s tasks, notes and projects are as before', (await saved(mac)) === before, [before, await saved(mac)]);
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 200));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
