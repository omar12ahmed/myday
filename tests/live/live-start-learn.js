// Live check of "what helps you start" (Help me start step 3, specs/help-me-start.md §6) on the site (tests/live/run.py),
// on a disposable account and one throwaway Mac-width device, without the AI (its requests are blocked; nothing is
// sent). A made-up admin task, five past uses of "a 10-minute piece" that each led to a start, and that way confirmed:
// Help me start says "What's worked for you before: starting with a 10-minute piece." and leads with it; ticking a step
// is recorded (the way, the kind of work and the task — never words) and marks the task touched. Then the task, its uses
// and the answer are removed again. Never prints account details. Writes to the live account: only with the owner's yes.
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
const ID = 'tkLiveStartLearn', ANSWER = 'start-way:admin:smaller', TITLE = 'Tidy the receipts drawer (made up)';
const saved = () => `JSON.parse(localStorage.getItem('myday.data.v4'))`;

(async () => {
  await D.connect();
  const mac = await D.device('livelearn-mac', path.join(process.env.MYDAY_LIVE_TEMP, 'downloads-mac'));
  await mac.send('Network.setBlockedURLs', { urls: ['*functions/v1/ai-plan*'] });
  await mac.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await mac.open(BASE + '#today');
  if (!await mac.until(`!!document.querySelector('#syncEmailInput')`, 20000)) throw Error('sign-in screen absent');
  await mac.type('#syncEmailInput', A.email); await mac.type('#syncPassword', A.password); await mac.click('[data-action="sync-signin"]');
  check('signs in and finishes syncing', await mac.until(`!document.getElementById('signInGate') && !!document.getElementById('nav')`, 25000) && await synced(mac));
  check(`shows MyDay ${VERSION} from ${SRC}`, await mac.ev(`document.body.textContent.includes('MyDay ${VERSION}') && document.querySelector('#appVersion').textContent.includes('${SRC}')`));
  const day = n => `(() => { const d = new Date(); d.setDate(d.getDate() + ${n}); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()`;
  const today = await mac.ev(day(0)), past = [];
  for (let i = 5; i >= 1; i--) past.push(await mac.ev(day(-i)));
  await mac.setData(`s => {
    s.tasks.items = s.tasks.items.filter(t => t.id !== '${ID}');
    s.tasks.items.push({ id: '${ID}', title: '${TITLE}', listId: '', category: 'admin', minutes: 20, due: null, time: null, notes: '', done: false, doneOn: null,
      plannedOn: null, planUid: null, createdAt: '${past[0]}T08:00', postponed: 0, blockers: [], letGoOn: null, touched: ${JSON.stringify(past)},
      steps: [{ id: 'sLiveA', text: 'Empty the drawer onto the table', done: false }, { id: 'sLiveB', text: 'Bin the old ones', done: false }] });
    s.patterns.startSeen = [...(s.patterns.startSeen || []).filter(x => x.taskId !== '${ID}'), ...${JSON.stringify(past)}.map(on => ({ on, way: 'smaller', category: 'admin', taskId: '${ID}' }))];
    s.patterns.answers['${ANSWER}'] = { said: 'yes', on: '${today}', examples: 5, title: 'Starting with a 10-minute piece works for you on admin tasks' };
  }`);
  await mac.until(`!!document.getElementById('nav')`, 20000); await synced(mac);
  await mac.ev(`location.hash = 'today/tasks/${ID}'`);
  await mac.until(`!!document.querySelector('[data-action=task-help-start]')`, 15000);
  await mac.click('[data-action=task-help-start]'); await D.sleep(400);
  check('Help me start says what has worked before for admin tasks, and leads with it', (await mac.text('[data-s=start-worked]')) === 'What’s worked for you before: starting with a 10-minute piece.'
    && (await mac.ev(`document.querySelector('#startCard [data-action^=start-]:not([data-s])')?.dataset.action`)) === 'start-piece', await mac.text('#startCard'));
  await mac.click('[data-action=start-tick]'); await D.sleep(500);
  await synced(mac);
  const after = await mac.ev(`(() => { const s = ${saved()}; return { use: (s.patterns.startSeen || []).filter(x => x.taskId === '${ID}' && x.on === '${today}'), touched: s.tasks.items.find(t => t.id === '${ID}')?.touched }; })()`);
  check('ticking the next step is recorded (the way, the kind of work and the task, never words) and marks the task touched today, synced', after.use.length === 1 && after.use[0].way === 'step'
    && after.use[0].category === 'admin' && Object.keys(after.use[0]).sort().join() === 'category,on,taskId,way' && after.touched?.includes(today), after);
  check('no AI request was made', await mac.ev(`!performance.getEntriesByType('resource').some(e => e.name.includes('functions/v1/ai-plan'))`));
  await mac.ev(`location.hash = 'today'`); await D.sleep(400);
  await mac.setData(`s => { s.tasks.items = s.tasks.items.filter(t => t.id !== '${ID}'); s.patterns.startSeen = (s.patterns.startSeen || []).filter(x => x.taskId !== '${ID}');
    if (!s.patterns.startSeen.length) delete s.patterns.startSeen; delete s.patterns.answers['${ANSWER}']; }`);
  await mac.until(`!!document.getElementById('nav')`, 20000);
  check('the made-up task, its uses and the answer are removed again, and synced', await synced(mac)
    && (await mac.ev(`(() => { const s = ${saved()}; return !s.tasks.items.some(t => t.id === '${ID}') && !(s.patterns.startSeen || []).some(x => x.taskId === '${ID}') && !('${ANSWER}' in s.patterns.answers); })()`)));
  const errs = mac.events.filter(e => e.method === 'Runtime.exceptionThrown').map(e => (e.params.exceptionDetails?.exception?.description || e.params.exceptionDetails?.text || '').slice(0, 200));
  check('no page errors', !errs.length, errs);
  console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch(e => {
  let m = String(e?.message || e); for (const v of Object.values(A)) if (v) m = m.split(v).join('[redacted]');
  console.log('HARNESS ' + m); process.exit(1);
});
