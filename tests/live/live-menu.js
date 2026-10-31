// Live check of the side menu on pages of their own (1.99.0), on the site (tests/live/run.py), on a disposable account and
// one throwaway Mac-width device: Today and Calendar mark their own section; Search marks no section (only the Search
// button), What MyDay knows and What MyDay has noticed mark only their own link, and Your backups and Your week mark
// nothing. Ask MyDay is never used (its function is blocked), so no AI request is made; nothing is changed beyond
// signing in. Never prints account details. Only with the owner's yes.
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
const marked = d => d.ev(`[...document.querySelectorAll('#nav [aria-current=page]')].map(a => a.textContent.trim())`);

(async () => {
  await D.connect();
  const mac = await D.device('livemenu-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#today');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));

  const at = async hash => { await mac.ev(`location.hash = '${hash}'`); await D.sleep(600); return marked(mac); };
  let m = await at('#today');
  check('Today marks Today', m.join() === 'Today', m);
  m = await at('#calendar');
  check('Calendar marks Calendar', m.join() === 'Calendar', m);
  m = await at('#search');
  check('Search marks no section in the menu; the Search button is marked instead', m.length === 0 && await mac.ev(`document.querySelector('[data-action=search-open]')?.getAttribute('aria-current') === 'page'`), m);
  m = await at('#knows');
  check('What MyDay knows marks only its own link', m.join() === 'What MyDay knows', m);
  m = await at('#noticed');
  check('What MyDay has noticed marks only its own link', m.join() === 'What MyDay has noticed', m);
  m = await at('#backups');
  check('Your backups marks nothing', m.length === 0, m);
  m = await at('#review');
  check('Your week marks nothing', m.length === 0, m);
  m = await at('#today');
  check('…and back on Today, Today again', m.join() === 'Today', m);
  check('no AI request was made (Ask MyDay\'s function was never called)', await mac.ev(`!performance.getEntriesByType('resource').some(e => e.name.includes('functions/v1/ai-plan'))`));

  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 200));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
