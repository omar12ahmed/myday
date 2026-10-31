// Live check of a longer Ask MyDay conversation on the site (tests/live/run.py), on a disposable account and one
// throwaway Mac-width device, with the real AI: a made-up question is answered; a reply is answered with the conversation
// shown above it (the first question folded to one line, the reply below), labelled as AI-written; closing + forgets it.
// Nothing is added, so the device's tasks, notes and projects are as before. Two AI requests of the account's 20 a day.
// Never prints account details. Only with the owner's yes.
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
const Q = 'What does a good weekly review look like? (made up)', R = 'and how long should it take?';

(async () => {
  await D.connect();
  const mac = await D.device('liveconv-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#today');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
  const before = await saved(mac);

  await mac.click('[data-action=capture-open]'); await mac.until(`!!document.getElementById('captureText')`, 10000); await D.sleep(300);
  await mac.type('#captureText', Q); await D.sleep(300);
  await mac.click('[data-action=ask-go]'); await shown(mac);
  const p1 = await mac.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`);
  check('a made-up question is answered by the AI, labelled as AI-written', p1 === 'shown' && (await mac.text('[data-s=ask-panel]')).includes('AI-written by'), [p1, (await mac.text('[data-s=ask-panel]')).slice(0, 200)]);
  check('…with a reply box under the answer', await mac.exists('[data-s=ask-more]'));
  await D.sleep(5500); // the server's pause between requests
  await mac.type('[data-s=ask-more]', R); await mac.click('[data-action=ask-again]');
  await mac.until(`!!document.querySelector('[data-s=ask-now]')`, 10000); await shown(mac);
  const turns = await mac.ev(`[...document.querySelectorAll('[data-s=ask-turn] summary')].map(s => s.textContent.trim())`);
  check('the reply is answered with the conversation above it: the question folded to one line, the reply below', (await mac.ev(`document.querySelector('[data-s=ask-panel]').dataset.phase`)) === 'shown'
    && turns.length === 1 && turns[0] === `You: ${Q}` && (await mac.text('[data-s=ask-now]')) === `You: ${R}` && (await mac.text('[data-s=ask-message]')).length > 10, [turns, await mac.text('[data-s=ask-panel]')]);
  await mac.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await D.sleep(400);
  await mac.click('[data-action=capture-open]'); await mac.until(`!!document.getElementById('captureText')`, 10000); await D.sleep(300);
  await mac.type('#captureText', Q); await D.sleep(300);
  check('closing + forgets it: opened again, no conversation', (await mac.ev(`document.querySelector('[data-s=ask-panel]')?.dataset.phase`)) === 'idle' && !(await mac.exists('[data-s=ask-thread]')));
  await mac.ev(`document.querySelector('[data-action=capture-cancel]')?.click()`); await D.sleep(400);
  check('nothing was added: the device\'s tasks, notes and projects are as before', (await saved(mac)) === before, [before, await saved(mac)]);
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 200));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
