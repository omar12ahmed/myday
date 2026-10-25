// Cloud sync in the new app, end to end: two devices (a "Mac" and a "phone", each its own browser profile)
// using a copy of MyDay built with sync switched on, against the Supabase stand-in (supabase-standin.js: the
// real database migrations in PostgreSQL, behind an imitation of Supabase's Auth and Data API).
// Every account and record here is disposable test data. This is NOT a test against a real Supabase project.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');
const { execFileSync } = require('child_process');
const T = require('./cdp-devices.js');
const S = require('./supabase-standin.js');
const { check, summary } = require('./cdp.js');
const { sleep } = T;

const HTTP = process.env.MYDAY_HTTP_PORT || 8765, SUPA = Number(process.env.MYDAY_SUPA_PORT || 54329);
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const APP = `http://127.0.0.1:${HTTP}/sync/index.html`;   // built with VITE_SUPABASE_URL = the stand-in (tests/run.sh)
const PLAIN = `http://127.0.0.1:${HTTP}/app/dist/index.html`; // the usual build: sync not set up
const API = `http://127.0.0.1:${SUPA}`;
const KEY = S.PUBLISHABLE_KEY;
const A = { email: 'a@example.test', password: 'disposable-pass-a' }, C = { email: 'c@example.test', password: 'disposable-pass-c' };

let srv, R;
const sql = (q, params = []) => S.owner(srv.db, q, params).then(r => r.rows);
const rpcLog = () => srv.log.filter(e => e.path.startsWith('/rest/v1/rpc/'));
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const withoutSaves = d => { const c = { ...d }; delete c.saves; return c; };
async function token(u) {
  const r = await fetch(`${API}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(u) });
  return (await r.json()).access_token;
}
const rest = (p, tok, init = {}) => fetch(`${API}${p}`, { ...init, headers: { apikey: KEY, 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) } });

// ---- Steps people take ----
async function goSync(D) { await D.ev(`location.hash = 'sync'`); return D.until(`document.getElementById('syncScreen')`); }
async function signIn(D, u) {
  await goSync(D);
  await D.until(`document.getElementById('syncEmailInput')`);
  await D.type('#syncEmailInput', u.email);
  await D.type('#syncPassword', u.password);
  await D.click('[data-action=sync-signin]');
}
const phaseIs = (D, p, ms) => D.until(`document.getElementById('syncScreen') && document.getElementById('syncScreen').dataset.phase === '${p}'`, ms);
// Synced, with nothing on its way (a moment after a change, the badge may still show the last state).
async function synced(D, ms = 15000) { await sleep(700); return D.until(`document.getElementById('syncBadge') && document.getElementById('syncBadge').dataset.status === 'synced' && (JSON.parse(localStorage.getItem('myday.sync.v1') || '{}').link || { out: {} }).out && Object.keys(JSON.parse(localStorage.getItem('myday.sync.v1')).link.out).length === 0`, ms); }
// Waits until a change has been sent (noted as on its way and tried at least once).
const sent = (D, key, ms = 10000) => D.until(`(() => { const n = JSON.parse(localStorage.getItem('myday.sync.v1') || '{}'); return n.link && n.link.out['${key}'] && n.link.out['${key}'].tries >= 1; })()`, ms);
// What a device's sync is doing, for failure messages.
const diag = D => D.ev(`(() => { const n = JSON.parse(localStorage.getItem('myday.sync.v1') || 'null'); return { status: (document.getElementById('syncBadge') || {}).dataset?.status, phase: (document.getElementById('syncScreen') || {}).dataset?.phase, line: (document.getElementById('syncLine') || {}).textContent, out: n && n.link ? Object.keys(n.link.out) : null, conflicts: n && n.link ? Object.keys(n.link.conflicts) : null, review: n && n.link ? n.link.review : null, user: n && n.link ? n.link.user : null }; })()`);
async function syncNowWhenReady(D) { await goSync(D); await D.until(`document.querySelector('[data-action=sync-now]') && !document.querySelector('[data-action=sync-now]').disabled`); await D.click('[data-action=sync-now]'); }
// A project with no files folds its Files card into "Add to this project" (1.85.0): open it as you would.
async function openFiles(D) {
  await D.until(`document.getElementById('files-project') || document.querySelector('[data-action=section-open][data-id=files]')`, 15000);
  if (await D.exists('[data-action=section-open][data-id=files]')) await D.click('[data-action=section-open][data-id=files]');
  return D.until(`document.getElementById('files-project')`, 15000);
}
async function cloudUntil(fn, ms = 20000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(150); } return false; }
const statusIs = (D, s, ms = 12000) => D.until(`document.getElementById('syncBadge') && document.getElementById('syncBadge').dataset.status === '${s}'`, ms);
// Today's screen opens the list editor when it's opened at #today/edit, so come from another screen.
async function openEditor(D) { await D.ev(`location.hash = 'sync'`); await sleep(150); await D.ev(`location.hash = 'today/edit'`); return D.until(`document.querySelector('.edit-row')`); }
async function goToday(D) { await D.ev(`location.hash = 'sync'`); await sleep(150); await D.ev(`location.hash = 'today'`); return D.until(`document.querySelector('#app')`); }
async function editList(D, cat, id, title) {
  const sel = `.edit-row[data-cat=${cat}][data-id="${id}"] input.t`;
  if (!(await D.exists(sel))) { await openEditor(D); await D.until(`document.querySelector('${sel}')`); }
  await D.type(sel, title);
  await sleep(200);
}
// An external local edit while offline: deliver the storage event without navigating away from the loaded app.
async function changeHere(D, fn) {
  await D.ev(`(() => { const key='myday.data.v4', oldValue=localStorage.getItem(key), s=JSON.parse(oldValue); (${fn})(s);
    const newValue=JSON.stringify(s); localStorage.setItem(key,newValue); window.dispatchEvent(new StorageEvent('storage',{key,oldValue,newValue,storageArea:localStorage})); })()`);
}
const listTitle = (d, cat, id) => { const x = d.lists[cat].find(i => i.id === id); return x ? x.title : null; };
const cloudList = async (cat, user) => (await sql(`select data, version from public.task_lists where user_id = $1 and id = $2`, [user, cat]))[0];

// The parts of MyDay that are one record each (from 1.8.0), as every device has them.
const ONE_KEYS = ['arabic:preferences', 'cybersecurity:preferences', 'settings:planning', 'rota:rota', 'pay:pay', 'holidays:region', 'finance:finance', 'study:roadmap', 'workout:setup', 'food:kitchen', 'food:shopping', 'fitness:goal', 'notes:collections', 'tasks:lists', 'patterns:patterns', 'daily:moves'];
const cloudRecord = async (user, kind, id) => {
  const root = (await sql(`select data, version, deleted from public.sync_records where user_id = $1 and kind = $2 and id = $3`, [user, kind, id]))[0];
  if (kind !== 'project' || !root || root.deleted) return root;
  const rows = await sql(`select kind,id,data from public.sync_records where user_id=$1 and not deleted and data->>'projectId'=$2`, [user, id]);
  const draft = R.freshState();
  R.putRecords(draft, rows.map(row => [`${row.kind}:${row.id}`, R.cleanRecord(`${row.kind}:${row.id}`, row.data)]));
  return { ...root, data: draft.projects.items.find(p => p.id === id) };
};

function task(uid, taskId, category, title, minutes, done = false) {
  return { uid, taskId, category, title, minutes, baseMinutes: minutes, done, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null };
}

(async () => {
  const { bundle } = await import(pathToFileURL(path.join(ROOT, 'ai-eval/build.mjs')).href);
  const kitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-browser-sync-kit-'));
  const src = p => JSON.stringify(path.join(ROOT, 'app/src', p));
  fs.writeFileSync(path.join(kitDir, 'kit.ts'), `export * from ${src('sync/records')};\nexport * from ${src('data/projectRecords')};\nexport { freshState } from ${src('data/normalize')};`);
  R = await import(pathToFileURL(await bundle(path.join(kitDir, 'kit.ts'), path.join(kitDir, 'out'))).href);
  fs.rmSync(kitDir, { recursive: true, force: true });
  const db = await S.createDb();
  srv = await S.start(db, SUPA);
  srv.db = db;
  const userA = await S.addUser(db, A.email, A.password), userC = await S.addUser(db, C.email, C.password);
  await T.connect();
  const dl = path.join(os.tmpdir(), `myday-sync-dl-${process.pid}`);
  const mac = await T.device('mac', path.join(dl, 'mac')), phone = await T.device('phone', path.join(dl, 'phone'));

  console.log('\n[1] Before signing in: the sign-in screen (from 1.9.0); the data on this device stays as it is, nothing sent');
  await mac.open(APP + '#today');
  const today = await mac.today();
  const shiftKey = n => { const d = new Date(today + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const Y = shiftKey(-1), Y2 = shiftKey(-2);
  await mac.setData(`s => {
    s.lists.learning[0].title = 'Mac: Networking basics';
    s.lists.learning.push({ id: 'lmac1', title: 'Mac: Linux fundamentals', minutes: 25 });
    s.days['${Y}'] = { energy: 4, rest: false, builtAt: '${Y}T08:00', checkedIn: true, tasks: [${JSON.stringify(task('t-mac-1', 'l1', 'learning', 'Mac: Networking basics', 30, true))}] };
    s.context['${Y}'] = { energy: 4, sleep: { start: null, end: null, estimatedHours: 7.5 } };
    s.queue = [{ qid: 'q-mac-1', taskId: 'a2', category: 'admin', title: 'Bulk cook 2 meals', minutes: 60, queuedOn: '${Y}', sourceUid: null }];
  }`);
  check('MyDay asks you to sign in first (from 1.9.0): the sign-in screen, not Today — no sections, no Capture', (await mac.exists('#signInGate')) && (await mac.text('#gate-h')) === 'Welcome to MyDay' && (await mac.exists('#syncEmailInput')) && !(await mac.exists('#nav')) && !(await mac.exists('.capture-btn')) && !(await mac.exists('#syncBadge')));
  check('…and it explains why: your MyDay is kept with your account, the same on every device, and only you can see it', /same on your Mac and your phone/.test(await mac.text('#signInGate')) && /only you can see it/.test(await mac.text('#signInGate')));
  check('…while the data already on this device stays exactly as it is', (await mac.data()).lists.learning[0].title === 'Mac: Networking basics' && !!(await mac.data()).days[Y]);
  await mac.ev(`location.hash = 'calendar'`); await sleep(300);
  check('…an address like #calendar still shows the sign-in screen', (await mac.exists('#signInGate')) && !(await mac.exists('.cal-grid')));
  await mac.ev(`location.hash = 'today'`); await sleep(200);
  check('nothing was sent anywhere (no requests to the cloud)', srv.log.length === 0, srv.log.map(e => e.path));
  check('the sign-in library isn\'t even downloaded until it\'s needed', !(await mac.ev(`performance.getEntriesByType('resource').some(e => /assets\\/dist-/.test(e.name))`)));
  const macBefore = withoutSaves(await mac.data());

  console.log('\n[1b] The sign-in screen when your account can\'t be reached: you can still use what\'s on the device');
  const tab = await T.device('tablet', path.join(dl, 'tablet'));
  await tab.open(APP + '#today');
  await tab.setData(`s => { s.lists.admin[0].title = 'Tablet: water the plants'; }`);
  await tab.until(`document.getElementById('signInGate')`, 20000);
  check('a new device shows the sign-in screen, with no way round it while your account can be reached', (await tab.exists('#signInGate')) && !(await tab.exists('#gateOffline')));
  await tab.offline(true);
  await tab.until(`document.getElementById('gateOffline')`, 30000);
  check('offline: "Use MyDay on this device for now" is offered', (await tab.text('#gateOffline')).includes("Can't reach your account right now?"));
  await tab.click('[data-action=gate-use-here]');
  await tab.until(`!document.getElementById('signInGate') && document.getElementById('nav')`, 20000);
  check('…and opens MyDay with what\'s on this device', !(await tab.exists('#signInGate')) && (await tab.exists('#nav')) && (await tab.data()).lists.admin[0].title === 'Tablet: water the plants');
  await tab.offline(false);
  await tab.open(APP + '#today');
  await tab.until(`document.getElementById('signInGate')`, 20000);
  check('…only until MyDay is next opened: then it asks again', await tab.exists('#signInGate'));
  srv.faults.push({ path: '/auth/v1/token', mode: 'error', times: 1 });
  await tab.type('#syncEmailInput', A.email); await tab.type('#syncPassword', A.password); await tab.click('[data-action=sync-signin]');
  await tab.until(`document.getElementById('signinError')`);
  check('if the account service doesn\'t answer when you sign in, the same way out is offered', (await tab.text('#signinError')).includes("Couldn't reach your account") && (await tab.exists('#gateOffline')));
  check('…and nothing was saved or sent', (await sql('select count(*)::int as n from public.task_lists'))[0].n === 0);
  await tab.type('#syncEmailInput', A.email); await tab.type('#syncPassword', 'wrong-password'); await tab.click('[data-action=sync-signin]');
  await sleep(800);
  srv.log.length = 0;

  console.log('\n[2] Signing in');
  await signIn(mac, { email: A.email, password: 'wrong-password' });
  await mac.until(`document.getElementById('signinError')`);
  check('a wrong password gets a friendly message', (await mac.text('#signinError')).includes("don't match an account"), await mac.text('#signinError'));
  check('the password field allows password managers (autocomplete) and can be shown', (await mac.ev(`document.getElementById('syncPassword').autocomplete`)) === 'current-password' && (await mac.exists('[data-action=sync-show-password]')));
  await mac.type('#syncPassword', A.password);
  await mac.click('[data-action=sync-signin]');

  console.log('\n[3] First device: signing in combines it with your account by itself — no review, no set-up step');
  check('signed in: MyDay opens (the sign-in screen goes) with nothing to confirm', await mac.until(`!document.getElementById('signInGate') && document.getElementById('nav')`, 15000), await diag(mac));
  check('…and everything is saved to your account', await statusIs(mac, 'synced'), await mac.status());
  const rowsA = await sql(`select 'list' k, id from public.task_lists where user_id = $1 union all select 'queue', id from public.task_queue where user_id = $1
    union all select 'day', id from public.day_plans where user_id = $1 union all select 'context', id from public.day_context where user_id = $1`, [userA]);
  check('what was only on this device went to your (empty) account: 3 lists, the queue, a plan, a context', rowsA.length === 6, rowsA);
  check('…and the 16 one-record parts including the Cybersecurity and Arabic paths and Daily exercises', eq((await sql(`select kind || ':' || id as k from public.sync_records where user_id = $1 order by 1`, [userA])).map(r => r.k), [...ONE_KEYS].sort()));
  check('…with this device\'s content', (await cloudList('learning', userA)).data.items[0].title === 'Mac: Networking basics');
  check('this device\'s data is unchanged by it', eq(withoutSaves(await mac.data()), macBefore));
  check('nothing was kept aside (nothing differed)', (await mac.notes()).kept.length === 0);
  await goToday(mac);
  await mac.until(`document.querySelector('.storage-note')`);
  check('the footer says where your changes are: "Saved to your account (your email)"', (await mac.text('.storage-note')) === `Saved to your account (${A.email}).`, await mac.text('.storage-note'));
  check('…and so does the badge at the top ("Saved to your account")', (await mac.text('#syncBadge')).includes('Saved to your account'));

  console.log('\n[4] Second device, with some of its own records: combined by itself — your account wins where they differ, and nothing is lost');
  await phone.open(APP + '#today');
  await phone.setData(`s => {
    s.lists.admin.push({ id: 'aphone1', title: 'Phone: Renew passport', minutes: 20 });
    s.days['${Y2}'] = { energy: 3, rest: false, builtAt: '${Y2}T09:00', checkedIn: false, tasks: [${JSON.stringify(task('t-ph-1', 'h3', 'health', '20-min walk', 20, true))}] };
    s.context['${Y}'] = { energy: 2, sleep: { start: null, end: null, estimatedHours: 5 } };
  }`);
  const phoneBefore = withoutSaves(await phone.data());
  await signIn(phone, A);
  check('signing in on the phone: no questions — MyDay opens with your account\'s MyDay', await phone.until(`!document.getElementById('signInGate') && document.getElementById('nav')`, 15000) && (await statusIs(phone, 'synced')), await diag(phone));
  let pd = await phone.data();
  check('what was only in your account came here: the Mac\'s plan, learning list and queue', !!pd.days[Y] && pd.days[Y].tasks[0].uid === 't-mac-1' && listTitle(pd, 'learning', 'l1') === 'Mac: Networking basics' && pd.queue.some(q => q.qid === 'q-mac-1'));
  check('what was only on the phone went to your account: its own plan', !!pd.days[Y2] && (await sql(`select 1 from public.day_plans where user_id = $1 and id = $2`, [userA, Y2])).length === 1);
  check('where the same part differed, your account\'s version is used (the admin list, that day\'s context)', !listTitle(pd, 'admin', 'aphone1') && pd.context[Y].energy === 4 && !(await cloudList('admin', userA)).data.items.some(i => i.id === 'aphone1'));
  let pn = await phone.notes();
  check('…and the phone\'s versions of those are kept aside on the phone (nothing lost); a new MyDay\'s starter versions (its learning list, empty queue, note collections) aren\'t worth keeping', eq(pn.kept.map(k => k.key).sort(), ['context:' + Y, 'list:admin']) && pn.kept.find(k => k.key === 'list:admin').content.items.some(i => i.id === 'aphone1') && pn.kept.find(k => k.key === 'context:' + Y).content.energy === 2, pn.kept.map(k => k.key));
  await goSync(phone);
  check('…to download from Your account', await phone.exists('[data-action=kept-download]'));
  check('parts that were already the same on both (e.g. settings, Study, Health) are untouched', eq(pd.settings, phoneBefore.settings) && eq(pd.study, phoneBefore.study) && eq(pd.health, phoneBefore.health));

  console.log('\n[5] Records created on one device appear on the other');
  await mac.returnToApp();
  await mac.until(`JSON.parse(localStorage.getItem('myday.data.v4')).days['${Y2}']`);
  let md = await mac.data();
  check('coming back to MyDay on the Mac fetches the phone\'s plan', !!md.days[Y2] && !listTitle(md, 'admin', 'aphone1'));
  await openEditor(mac);
  await mac.click('[data-action=add][data-cat=learning]');
  await sleep(300);
  const newId = await mac.ev(`[...document.querySelectorAll('.edit-row[data-cat=learning]')].pop().dataset.id`);
  await mac.type(`.edit-row[data-id="${newId}"] input.t`, 'Mac: Web security');
  check('a task added on the Mac is in the account', await cloudUntil(async () => (await cloudList('learning', userA)).data.items.some(i => i.title === 'Mac: Web security')));
  await synced(mac);
  await phone.returnToApp();
  check('…and appears on the phone when it comes back to MyDay', await phone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).lists.learning.some(i => i.title === 'Mac: Web security')`));

  console.log('\n[5b] Everything else syncs too: Calendar, Finance, Inbox, Study, Health, settings');
  await synced(mac); await synced(phone);
  const T0 = shiftKey(1);
  await mac.setData(`s => {
    s.settings.earliestTime = '07:30'; s.settings.theme = 'light';
    s.commitments.push({ id: 'cmGP', kind: 'appointment', title: 'GP', start: '${T0}T10:00', end: '${T0}T10:30' });
    s.finance.expenses.push({ id: 'exRent', name: 'Rent', amount: 650, note: '' });
    s.notes.items.push({ id: 'ntMac', categoryId: '', title: '', text: 'Mac note: coffee van idea', pinned: false, createdAt: '${Y}T09:00', updatedAt: '${Y}T09:00' });
    s.tasks.items.push({ id: 'tkMac', title: 'Pay rent', listId: '', category: 'admin', minutes: 15, due: '${T0}', time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '${Y}T09:00', postponed: 0, blockers: [], letGoOn: null });
    s.study.topics = [{ id: 'tpAr', title: 'Arabic' }];
    s.study.stages = [{ id: 'sgAr', title: 'Start here', topicId: 'tpAr', courses: [{ id: 'coAr', title: 'Madinah book 1', url: '', minutes: 20, listId: null, archived: false, modules: [] }] }];
    s.study.sessions.push({ id: 'ssMac', courseId: 'coAr', taskId: null, title: 'Madinah book 1', date: '${Y}', startedAt: '${Y}T19:00', plannedMin: 20, short: false, status: 'done', runningSince: null, activeMs: 1200000, endedAt: '${Y}T19:20', checkin: null, taskDone: null, todayUid: null });
    s.health.food.recipes.rOwn = { id: 'rOwn', source: 'manual', title: 'Lentil soup', sourceUrl: '', sourceName: '', mealDbUrl: '', video: '', thumb: '', category: '', area: '', tags: [], ingredients: [{ name: 'lentils', measure: '200 g' }], instructions: 'Simmer.', servings: 4, servingsSource: 'user', prepMin: null, cookMin: null, effort: null, batch: null, nutrition: null, nutritionSource: null, savedAt: '${Y}T09:00' };
    s.health.food.favourites = ['rOwn'];
    s.health.food.shopping = [{ id: 'shMilk', name: 'milk', family: null, amount: null, unit: '', text: '', category: 'Dairy', checked: false, recipes: [], manual: true }];
  }`);
  await synced(mac);
  check('the Mac sends them: each item on its own, each part as one record', !!(await cloudRecord(userA, 'commitment', 'cmGP')) && !!(await cloudRecord(userA, 'note', 'ntMac')) && !!(await cloudRecord(userA, 'task', 'tkMac'))
    && !!(await cloudRecord(userA, 'session', 'ssMac')) && !!(await cloudRecord(userA, 'recipe', 'rOwn')) && (await cloudRecord(userA, 'finance', 'finance')).data.expenses[0].name === 'Rent' && (await cloudRecord(userA, 'settings', 'planning')).data.earliestTime === '07:30');
  check('…but not its theme (that stays per device)', !JSON.stringify((await cloudRecord(userA, 'settings', 'planning')).data).includes('theme'));
  const phoneTheme = (await phone.data()).settings.theme;
  await phone.returnToApp();
  await phone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).notes.items.some(n => n.id === 'ntMac')`);
  pd = await phone.data();
  check('the phone gets the appointment, the expense, the note and the task', pd.commitments.some(c => c.id === 'cmGP' && c.title === 'GP') && pd.finance.expenses.some(e => e.name === 'Rent') && pd.notes.items.some(n => n.text.startsWith('Mac note')) && pd.tasks.items.some(t => t.id === 'tkMac' && t.due === T0));
  check('…Study (the Arabic topic, its course, the session)', pd.study.topics?.[0]?.title === 'Arabic' && pd.study.stages.some(sg => sg.courses.some(c => c.id === 'coAr')) && pd.study.sessions.some(x => x.id === 'ssMac'));
  check('…Food (the recipe, still a favourite, and the shopping list)', pd.health.food.recipes.rOwn?.title === 'Lentil soup' && eq(pd.health.food.favourites, ['rOwn']) && pd.health.food.shopping.some(x => x.name === 'milk'));
  check('…and the planning settings, keeping its own theme', pd.settings.earliestTime === '07:30' && pd.settings.theme === phoneTheme);
  await phone.setData(`s => { s.notes.items.push({ id: 'ntPhone', categoryId: '', title: '', text: 'Phone note: call the bank', pinned: false, createdAt: '${Y}T10:00', updatedAt: '${Y}T10:00' }); }`);
  await mac.setData(`s => { s.notes.items.push({ id: 'ntMac2', categoryId: '', title: '', text: 'Mac note 2', pinned: false, createdAt: '${Y}T10:05', updatedAt: '${Y}T10:05' }); }`);
  await synced(phone); await synced(mac);
  await phone.returnToApp(); await mac.returnToApp();
  await phone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).notes.items.some(n => n.id === 'ntMac2')`);
  await mac.until(`JSON.parse(localStorage.getItem('myday.data.v4')).notes.items.some(n => n.id === 'ntPhone')`);
  const noteIds = async D => (await D.data()).notes.items.map(n => n.id);
  check('a note added on each device at the same time: both kept on both, nothing to choose', (await noteIds(phone)).filter(id => ['ntMac', 'ntMac2', 'ntPhone'].includes(id)).length === 3
    && (await noteIds(mac)).filter(id => ['ntMac', 'ntMac2', 'ntPhone'].includes(id)).length === 3 && Object.keys((await phone.notes()).link.conflicts).length === 0 && Object.keys((await mac.notes()).link.conflicts).length === 0);
  await mac.setData(`s => { s.notes.items = s.notes.items.filter(n => n.id !== 'ntMac'); }`);
  await synced(mac);
  await phone.returnToApp();
  check('deleting a note on the Mac deletes it on the phone (and in the account, as a tombstone)', await phone.until(`!JSON.parse(localStorage.getItem('myday.data.v4')).notes.items.some(n => n.id === 'ntMac')`) && (await cloudRecord(userA, 'note', 'ntMac')).deleted === true);
  await synced(phone);
  // The same part changed on both: the phone (offline) renames a note collection; the Mac renames it too.
  await phone.offline(true);
  await phone.ev(`location.hash = 'projects/notes/collections'`);
  await phone.until(`document.querySelector('#noteCats .ncat-row input')`);
  await phone.type('#noteCats .ncat-row input', 'Phone: Life');
  await phone.ev(`document.querySelector('#noteCats .ncat-row input').dispatchEvent(new FocusEvent('focusout', { bubbles: true }))`);
  await sleep(300);
  await mac.setData(`s => { s.notes.categories[0].name = 'Mac: Life'; }`);
  await synced(mac);
  await phone.offline(false); await phone.returnToApp();
  check('a part changed on both devices is a conflict to decide (nothing overwritten)', await statusIs(phone, 'attention') && (await phone.data()).notes.categories[0].name === 'Phone: Life' && (await cloudRecord(userA, 'notes', 'collections')).data.categories[0].name === 'Mac: Life', await diag(phone));
  await goSync(phone);
  await phone.until(`document.querySelector('[data-action=conflict-here][data-key="notes:collections"]')`);
  check('…named in words ("Note collections")', (await phone.text('#syncConflicts')).includes('Note collections'));
  await phone.click('[data-action=conflict-here][data-key="notes:collections"]');
  await cloudUntil(async () => (await cloudRecord(userA, 'notes', 'collections')).data.categories[0].name === 'Phone: Life');
  await synced(phone);
  await mac.returnToApp();
  check('…choosing the phone\'s sends it, and the Mac gets it', await mac.until(`JSON.parse(localStorage.getItem('myday.data.v4')).notes.categories[0].name === 'Phone: Life'`));
  await synced(mac);

  console.log('\n[5c] Split project items, independent edits, history and deletion');
  await synced(mac); await synced(phone);
  const AIM = shiftKey(30);
  await mac.setData(`s => { s.projects.items.push({ id: 'pjSync', title: 'Sync: garden shed', summary: '', stage: 'decide', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${Y}T09:00', updatedAt: '${Y}T09:00',
    milestones: [{ id: 'msA', title: 'Pick a site', aim: '${AIM}', reachedOn: null, createdAt: '${Y}T09:01' }, { id: 'msB', title: 'Order the base', aim: null, reachedOn: null, createdAt: '${Y}T09:02' }],
    decisions: [{ id: 'dcA', question: 'Which size?', options: [{ id: 'opS', text: 'Small', pros: ['Cheap'], cons: [] }, { id: 'opL', text: 'Large', pros: [], cons: ['Costly'] }], chosen: 'opL', why: 'Room for tools', decidedOn: '${Y}', createdAt: '${Y}T09:03', updatedAt: '${Y}T09:04' }] }); }`);
  await synced(mac);
  const macPj = (await mac.data()).projects.items.find(x => x.id === 'pjSync');
  const cloudPj = async () => (await cloudRecord(userA, 'project', 'pjSync'));
  check('the Mac sends the project with its milestones and its decided decision, as separate item records', !!(await cloudPj()) && (await cloudPj()).data.milestones.length === 2 && (await cloudPj()).data.decisions[0].chosen === 'opL' && (await cloudPj()).data.decisions[0].why === 'Room for tools', (await cloudPj()));
  await phone.returnToApp();
  await phone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).projects.items.some(p => p.id === 'pjSync')`);
  const phonePj = (await phone.data()).projects.items.find(x => x.id === 'pjSync');
  const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
  check('the phone receives them exactly (milestones, aim date, options, pros and cons, the choice, the reason, the date)', eq(canon(phonePj), canon(macPj)) && phonePj.milestones.length === 2 && phonePj.decisions[0].chosen === 'opL', [phonePj, macPj]);
  await synced(phone);
  // The phone, offline, reaches the first milestone.
  await phone.offline(true);
  await phone.ev(`location.hash = 'projects/p/pjSync/milestones'`);
  await phone.until(`document.querySelector('#projectMilestones [data-action=ms-reach]')`);
  await phone.click('#projectMilestones [data-action=ms-reach]');
  await sleep(400);
  check('offline, reaching a milestone is kept on the phone ("Saved on this device")', (await phone.data()).projects.items.find(x => x.id === 'pjSync').milestones[0].reachedOn === today && (await statusIs(phone, 'local', 8000)), await diag(phone));
  check('…and the account still has it as not reached', (await cloudPj()).data.milestones[0].reachedOn === null);
  await phone.ev(`location.hash = 'projects/p/pjSync/decisions'`);
  await phone.until(`document.querySelector('[data-action=dc-again]')`);
  await phone.click('[data-action=dc-again]');
  await phone.until(`document.querySelector('[data-s=option][data-id=opS] [data-action=opt-choose]')`);
  await phone.click('[data-s=option][data-id=opS] [data-action=opt-choose]');
  await phone.type('#dcWhy-dcA', 'Measured the corner: small fits');
  await phone.click('[data-action=dc-decide]'); await sleep(300);
  const offlineDecision = (await phone.data()).projects.items.find(x => x.id === 'pjSync').decisions[0];
  check('offline, choosing again retains the previous label, reason and original day without changing the stage', offlineDecision.chosen === 'opS' && offlineDecision.why === 'Measured the corner: small fits' && offlineDecision.history.length === 1 && offlineDecision.history[0].text === 'Large' && offlineDecision.history[0].why === 'Room for tools' && offlineDecision.history[0].on === Y && (await phone.data()).projects.items.find(x => x.id === 'pjSync').stage === 'decide');
  check('the account retains its earlier choice while the phone is offline', (await cloudPj()).data.decisions[0].chosen === 'opL' && !(await cloudPj()).data.decisions[0].history);
  await phone.offline(false); await phone.returnToApp();
  await synced(phone, 20000);
  check('back online, it is saved to your account', await cloudUntil(async () => (await cloudPj()).data.milestones[0].reachedOn === today, 15000), (await cloudPj()).data.milestones[0]);
  await mac.returnToApp();
  check('…and the Mac receives it', await mac.until(`JSON.parse(localStorage.getItem('myday.data.v4')).projects.items.find(p => p.id === 'pjSync').milestones[0].reachedOn === '${today}'`));
  await synced(mac);
  check('the whole history and new choice reach the account and the other device unchanged', eq(canon((await cloudPj()).data.decisions[0]), canon(offlineDecision)) && eq(canon((await mac.data()).projects.items.find(x => x.id === 'pjSync').decisions[0]), canon(offlineDecision)));
  // Both change the same project at once: the Mac renames a milestone, the phone (offline) adds a pro.
  await phone.offline(true);
  await phone.ev(`location.hash = 'projects/p/pjSync/decisions'`);
  await phone.until(`document.querySelector('[data-s=option][data-id=opS] [data-s=pros] [data-action=pro-add]')`);
  await phone.click('[data-s=option][data-id=opS] [data-s=pros] [data-action=pro-add]');
  await phone.until(`document.querySelector('[data-s=option][data-id=opS] [data-s=pros] form input')`);
  await phone.type('[data-s=option][data-id=opS] [data-s=pros] form input', 'Phone: fits the corner');
  await phone.click('[data-s=option][data-id=opS] [data-action=pro-save]');
  await sleep(400);
  await mac.setData(`s => { s.projects.items.find(p => p.id === 'pjSync').milestones[1].title = 'Mac: order the base now'; }`);
  await synced(mac);
  await phone.offline(false); await phone.returnToApp();
  check('edits to separate project items merge without a conflict', await statusIs(phone, 'synced', 20000)
    && (await cloudPj()).data.milestones[1].title === 'Mac: order the base now' && (await cloudPj()).data.decisions[0].options[0].pros.includes('Phone: fits the corner'), await diag(phone));
  check('the phone receives the milestone edit while retaining its own decision edit and history', (await phone.data()).projects.items.find(x => x.id === 'pjSync').milestones[1].title === 'Mac: order the base now'
    && (await phone.data()).projects.items.find(x => x.id === 'pjSync').decisions[0].history[0].why === 'Room for tools');
  await mac.returnToApp(); await synced(mac);
  check('the Mac receives the independent decision edit', (await mac.data()).projects.items.find(x => x.id === 'pjSync').decisions[0].options[0].pros.includes('Phone: fits the corner'));
  const wire = await sql("select kind,data from public.sync_records where user_id=$1 and not deleted and data->>'projectId'='pjSync'", [userA]);
  check('the cloud core excludes feature arrays, with milestones, decisions and history in separate records', !wire.find(r => r.kind === 'project').data.value.decisions
    && wire.filter(r => r.kind === 'project_milestone').length === 2 && wire.some(r => r.kind === 'project_choice'));

  // Edits to the same decision still require a choice, without replacing unrelated project tools.
  await phone.offline(true);
  await changeHere(phone, `s => { s.projects.items.find(p => p.id === 'pjSync').decisions[0].question = 'Phone: which chair?'; }`);
  await mac.setData(`s => { s.projects.items.find(p => p.id === 'pjSync').decisions[0].question = 'Mac: which chair?'; }`);
  await synced(mac);
  if (!(await cloudUntil(async () => (await cloudPj()).data.decisions[0].question === 'Mac: which chair?'))) throw new Error('Mac decision was not sent before reconnecting the phone: '+JSON.stringify(await diag(mac)));
  await phone.offline(false); await phone.returnToApp();
  check('concurrent edits to the same decision still ask for a choice', await statusIs(phone, 'attention'), await diag(phone));
  const decisionKey = 'project_decision:' + R.projectPartId('pjSync', 'dcA');
  await goSync(phone);
  await phone.until(`document.querySelector('[data-action=conflict-cloud][data-key="${decisionKey}"]')`);
  check('the conflict screen names the decision and offers both versions', (await phone.text('#syncConflicts')).includes('Decision') && (await phone.exists(`[data-action=conflict-here][data-key="${decisionKey}"]`)));
  await phone.click(`[data-action=conflict-cloud][data-key="${decisionKey}"]`);
  await synced(phone, 20000);
  const afterPj = (await phone.data()).projects.items.find(x => x.id === 'pjSync');
  check('choosing the account decision retains other tools and history, keeping the displaced decision aside', afterPj.decisions[0].question === 'Mac: which chair?' && afterPj.milestones[1].title === 'Mac: order the base now'
    && afterPj.decisions[0].history[0].why === 'Room for tools'
    && (await phone.notes()).kept.some(k => k.key === decisionKey && k.content.value.question === 'Phone: which chair?'));

  // This represents the original migration snapshot, whose exact SQL conversion is checked in project-sync-db.
  // Use fresh child versions here by taking a separate small project through the normal client first.
  await mac.setData(`s => { s.projects.items.push({id:'pjUpgrade',title:'Upgrade fixture',summary:'',stage:'explore',status:'active',nextTaskId:null,commitmentIds:[],createdAt:'2026-10-20T09:00',updatedAt:'2026-10-20T09:00',milestones:[{id:'msOld',title:'Original marker',aim:null,reachedOn:null,createdAt:'2026-10-20T09:00'}]}); }`);
  await synced(mac);
  if (!(await cloudUntil(async () => !!(await cloudRecord(userA,'project','pjUpgrade'))))) throw new Error('Upgrade fixture did not reach cloud');
  await phone.returnToApp(); await phone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).projects.items.some(p=>p.id==='pjUpgrade')`); await synced(phone);
  const originalProject = (await phone.data()).projects.items.find(p=>p.id==='pjUpgrade');
  await sql('insert into public.sync_project_legacy(user_id,id,version,core_version,data) values($1,$2,1,2,$3::jsonb)', [userA,'pjUpgrade',JSON.stringify(originalProject)]);
  await phone.offline(true);
  await phone.ev(`(() => { const state=JSON.parse(localStorage.getItem('myday.sync.v1')); delete state.link.projectProtocol;
    for(const key of Object.keys(state.link.base)) if(key.startsWith('project_milestone:') && key.endsWith('${R.projectPartId('pjUpgrade','msOld')}')) delete state.link.base[key];
    state.link.base['project:pjUpgrade']={v:1,f:${JSON.stringify(R.fingerprint(originalProject))}};
    localStorage.setItem('myday.sync.v1',JSON.stringify(state)); })()`);
  await changeHere(phone, `s => { s.projects.items.find(p=>p.id==='pjUpgrade').milestones[0].title='Offline upgraded marker'; }`);
  await mac.setData(`s => { s.projects.items.find(p=>p.id==='pjUpgrade').summary='Changed on the other device'; }`); await synced(mac);
  await phone.offline(false); await phone.returnToApp(); await synced(phone,30000);
  check('a legacy device upgrades its baseline before syncing offline edits, retaining independent cloud changes', (await phone.notes()).link.projectProtocol===2
    && (await cloudRecord(userA,'project','pjUpgrade')).data.milestones[0].title==='Offline upgraded marker'
    && (await phone.data()).projects.items.find(p=>p.id==='pjUpgrade').summary==='Changed on the other device');

  // More than one pull page: no history pruning, and the complete project exceeds the former limit.
  await mac.setData(`s => { const p=s.projects.items.find(p => p.id === 'pjSync'); p.decisions[0].history=Array.from({length:650},(_,i)=>({id:'dhLarge'+i,text:'Former chair '+i,on:'2026-10-22',why:'文'.repeat(300)})); }`);
  await synced(mac, 60000);
  await phone.returnToApp(); await synced(phone, 60000);
  check('a project over 512 KiB survives a multi-page cloud round trip with all 650 previous choices', Buffer.byteLength(JSON.stringify((await cloudPj()).data)) > 524288
    && (await phone.data()).projects.items.find(p => p.id === 'pjSync').decisions[0].history.length === 650);
  check('large-project sync keeps each database record below its byte limit', (await sql("select max(octet_length(data::text))::int as bytes from public.sync_records where user_id=$1 and not deleted and data->>'projectId'='pjSync'", [userA]))[0].bytes < 380000);

  // Concurrent appends at the same history index converge to one order, retaining both choices.
  await phone.offline(true);
  await changeHere(phone, `s => { s.projects.items.find(p=>p.id==='pjSync').decisions[0].history.push({id:'dhPhone',text:'Phone chair',on:'2026-10-23',why:'From phone'}); }`);
  await mac.setData(`s => { s.projects.items.find(p=>p.id==='pjSync').decisions[0].history.push({id:'dhMac',text:'Mac chair',on:'2026-10-23',why:'From Mac'}); }`);
  await synced(mac, 20000);
  if (!(await cloudUntil(async () => (await cloudPj()).data.decisions[0].history.some(h=>h.id==='dhMac')))) throw new Error('Mac append did not reach cloud');
  await phone.offline(false); await phone.returnToApp(); await synced(phone, 30000);
  await mac.returnToApp(); await synced(mac, 30000);
  await phone.returnToApp(); await synced(phone, 30000);
  const historyIds = async D => (await D.data()).projects.items.find(p=>p.id==='pjSync').decisions[0].history.map(h=>h.id);
  check('same-position appends retain both snapshots in the same order on both devices', eq(await historyIds(mac), await historyIds(phone)) && (await historyIds(mac)).length === 652, [(await historyIds(mac)).slice(-3), (await historyIds(phone)).slice(-3)]);

  // Deletion racing an offline child edit must preserve the entire local subtree for the choice.
  await phone.offline(true);
  await changeHere(phone, `s => { s.projects.items.find(p=>p.id==='pjSync').milestones[0].title='Phone: keep this marker'; }`);
  await mac.setData(`s => { s.projects.items=s.projects.items.filter(p=>p.id!=='pjSync'); }`);
  await synced(mac, 30000);
  if (!(await cloudUntil(async () => (await cloudPj()).deleted))) throw new Error('Mac project deletion did not reach cloud');
  await phone.offline(false); await phone.returnToApp();
  check('a project deletion conflicts with an offline child edit while retaining all local history', await statusIs(phone, 'attention', 30000)
    && (await phone.data()).projects.items.find(p=>p.id==='pjSync').decisions[0].history.length === 652, await diag(phone));
  await goSync(phone); await phone.until(`document.querySelector('[data-action=conflict-here][data-key="project:pjSync"]')`);
  await phone.click('[data-action=conflict-here][data-key="project:pjSync"]'); await synced(phone, 60000);
  await mac.returnToApp(); await synced(mac, 60000);
  check('choosing this device restores the parent and every child without pruning history', (await cloudPj()).data.decisions[0].history.length === 652
    && (await mac.data()).projects.items.find(p=>p.id==='pjSync').milestones[0].title === 'Phone: keep this marker');

  await phone.offline(true);
  await changeHere(phone, `s => { s.projects.items.find(p=>p.id==='pjSync').milestones[0].title='Phone: kept in the replaced file'; }`);
  await mac.setData(`s => { s.projects.items=s.projects.items.filter(p=>p.id!=='pjSync'); }`);
  if (!(await cloudUntil(async () => (await cloudPj()).deleted))) throw new Error('Second deletion did not reach cloud');
  await phone.offline(false); await phone.returnToApp();
  await statusIs(phone,'attention',30000); await goSync(phone);
  await phone.until(`document.querySelector('[data-action=conflict-cloud][data-key="project:pjSync"]')`);
  await phone.click('[data-action=conflict-cloud][data-key="project:pjSync"]'); await synced(phone,60000);
  const displaced = (await phone.notes()).kept.filter(k=>k.why==='conflict' && k.content?.projectId==='pjSync');
  check('choosing the account deletion removes the project and keeps every displaced history snapshot and edited marker', !(await phone.data()).projects.items.some(p=>p.id==='pjSync')
    && displaced.filter(k=>k.key.startsWith('project_choice:')).length===652
    && displaced.some(k=>k.content.value.title==='Phone: kept in the replaced file'));

  console.log('\n[6] Today\'s plan, and deleting it ("Start today over") — the deletion syncs and doesn\'t come back');
  await goToday(mac);
  await mac.until(`document.getElementById('energy')`);
  await mac.ev(`(() => { const el = document.getElementById('energy'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '4'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await mac.click('[data-action=build]');
  await mac.until(`document.querySelector('[data-action=prop-apply]')`);
  await mac.click('[data-action=prop-apply]');
  await mac.until(`JSON.parse(localStorage.getItem('myday.data.v4')).days['${today}']`);
  md = await mac.data();
  const usedQueue = md.days[today].tasks.some(t => t.fromQueue && t.fromQueue.qid === 'q-mac-1');
  check('the Mac builds today\'s plan (taking the queued task)', md.days[today].tasks.length === 3 && usedQueue && !md.queue.some(q => q.qid === 'q-mac-1'));
  check('…and sends it to the account', await cloudUntil(async () => (await sql(`select 1 from public.day_plans where user_id = $1 and id = $2 and not deleted`, [userA, today])).length === 1));
  await synced(mac);
  await goToday(phone);
  await phone.returnToApp();
  check('the phone gets today\'s plan…', await phone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).days['${today}']`));
  await phone.until(`document.querySelectorAll('#app .task .title').length === 3`);
  check('…shows it on Today, with a kind note', (await phone.ev(`document.querySelectorAll('#app .task .title').length`)) === 3 && (await phone.text('#toast')).includes('other device'), await phone.text('#toast'));
  check('…and the queue change that came with it', !(await phone.data()).queue.some(q => q.qid === 'q-mac-1'));
  await mac.click('[data-action=restart]');
  await sleep(200);
  await mac.answer(true);
  await mac.until(`!JSON.parse(localStorage.getItem('myday.data.v4')).days['${today}']`);
  await cloudUntil(async () => (await sql(`select 1 from public.day_plans where user_id = $1 and id = $2 and deleted`, [userA, today])).length === 1);
  await synced(mac);
  const tomb = (await sql(`select deleted, data, version from public.day_plans where user_id = $1 and id = $2`, [userA, today]))[0];
  check('starting today over on the Mac deletes the plan in the account (kept as a deletion marker)', tomb && tomb.deleted && tomb.data === null && tomb.version === 2, tomb);
  await phone.returnToApp();
  check('the plan disappears from the phone', await phone.until(`!JSON.parse(localStorage.getItem('myday.data.v4')).days['${today}']`));
  check('…and the queued task is back in the phone\'s queue, as on the Mac', await phone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).queue.some(q => q.qid === 'q-mac-1')`));
  await phone.open(APP + '#today');
  await phone.returnToApp();
  await synced(phone);
  check('after reloading and syncing again, the deleted plan hasn\'t come back (on the phone or in the account)',
    !(await phone.data()).days[today] && (await sql(`select deleted, version from public.day_plans where user_id = $1 and id = $2`, [userA, today]))[0].version === 2);

  console.log('\n[7] Editing the same record on both devices at once: a conflict to decide, nothing overwritten');
  await mac.offline(true); await phone.offline(true);
  await editList(mac, 'learning', 'l2', 'Mac title');
  await editList(phone, 'learning', 'l2', 'Phone title');
  check('offline, each device keeps its own change ("Saved on this device")', listTitle(await mac.data(), 'learning', 'l2') === 'Mac title' && listTitle(await phone.data(), 'learning', 'l2') === 'Phone title' && (await statusIs(phone, 'local', 8000)));
  await mac.offline(false);
  await mac.returnToApp();
  await cloudUntil(async () => (await cloudList('learning', userA)).data.items.find(i => i.id === 'l2').title === 'Mac title');
  await synced(mac);
  check('the Mac, back online first, saves its version', (await cloudList('learning', userA)).data.items.find(i => i.id === 'l2').title === 'Mac title');
  await phone.offline(false);
  await phone.returnToApp();
  check('the phone, back online, reports a conflict ("Needs attention")', await statusIs(phone, 'attention'), await phone.status());
  check('…its own version is still there, and the account still has the Mac\'s', listTitle(await phone.data(), 'learning', 'l2') === 'Phone title' && (await cloudList('learning', userA)).data.items.find(i => i.id === 'l2').title === 'Mac title');
  await goSync(phone);
  await phone.until(`document.querySelector('#syncConflicts .conflict[data-key="list:learning"]')`);
  check('the sync screen shows both versions side by side', (await phone.text('#syncConflicts [data-side=here]')).includes('Phone title') && (await phone.text('#syncConflicts [data-side=cloud]')).includes('Mac title'));
  await phone.click('[data-action=conflict-cloud][data-key="list:learning"]');
  await synced(phone);
  pd = await phone.data(); pn = await phone.notes();
  check('choosing the account\'s version puts it on the phone…', listTitle(pd, 'learning', 'l2') === 'Mac title');
  check('…and keeps the phone\'s version aside', pn.kept.some(k => k.key === 'list:learning' && k.why === 'conflict' && k.content.items.some(i => i.title === 'Phone title')));
  await mac.offline(true); await phone.offline(true);
  await editList(mac, 'learning', 'l2', 'Mac second');
  await editList(phone, 'learning', 'l2', 'Phone second');
  await mac.offline(false); await mac.returnToApp();
  await cloudUntil(async () => (await cloudList('learning', userA)).data.items.find(i => i.id === 'l2').title === 'Mac second');
  await synced(mac);
  await phone.offline(false); await phone.returnToApp(); await statusIs(phone, 'attention');
  await goSync(phone);
  await phone.until(`document.querySelector('[data-action=conflict-here][data-key="list:learning"]')`);
  await phone.click('[data-action=conflict-here][data-key="list:learning"]');
  await cloudUntil(async () => (await cloudList('learning', userA)).data.items.find(i => i.id === 'l2').title === 'Phone second');
  await synced(phone);
  check('choosing this device\'s version sends it (based on the version it saw, so it\'s a deliberate choice)', (await cloudList('learning', userA)).data.items.find(i => i.id === 'l2').title === 'Phone second');
  await mac.returnToApp();
  check('…and the Mac gets it', await mac.until(`JSON.parse(localStorage.getItem('myday.data.v4')).lists.learning.find(i => i.id === 'l2').title === 'Phone second'`));

  console.log('\n[8] Failed, interrupted and retried requests');
  srv.faults.push({ path: '/rest/v1/rpc/sync_push_v3', mode: 'error', times: 1 });
  let v0 = (await cloudList('health', userA)).version;
  await editList(mac, 'health', 'h1', 'Gym (after a failed send)');
  const firstId = (await sent(mac, 'list:health')) && (await mac.notes()).link.out['list:health'].id;
  check('a request the cloud fails: the change stays on the device, shown as "Saved on this device"', await statusIs(mac, 'local', 8000) && listTitle(await mac.data(), 'health', 'h1') === 'Gym (after a failed send)');
  check('…noted as on its way, ready to send again with the same id', !!firstId && (await cloudList('health', userA)).version === v0);
  await goSync(mac);
  check('…and the sync screen says it will try again', /saved on this device and will be sent when it can/.test(await mac.text('#syncLine')), await mac.text('#syncLine'));
  await syncNowWhenReady(mac);
  await synced(mac);
  check('trying again saves it once (one new version)', (await cloudList('health', userA)).version === v0 + 1);

  // Two dropped replies: Chrome quietly resends a POST once when a connection closes without an answer, so the
  // first two tries both reach the cloud and get no reply; then MyDay itself tries again.
  srv.faults.push({ path: '/rest/v1/rpc/sync_push_v3', mode: 'drop', times: 2 });
  v0 = (await cloudList('health', userA)).version;
  srv.log.length = 0;
  await editList(mac, 'health', 'h2', 'Meal prep (reply lost)');
  await cloudUntil(async () => (await cloudList('health', userA)).version === v0 + 1); // saved in the cloud…
  await sleep(600);                                                                     // …and the device has given up waiting
  check('a reply that never arrives (saved in the cloud, but the device can\'t tell): the change stays noted', !!(await mac.notes()).link.out['list:health'] && (await mac.status()) === 'local', await diag(mac));
  await syncNowWhenReady(mac);
  await synced(mac);
  const pushes = srv.log.filter(e => e.path === '/rest/v1/rpc/sync_push_v3').map(e => e.body.changes.find(c => c.record_id === 'health')).filter(Boolean);
  check('every retry sent the same change (same id) again', pushes.length >= 3 && pushes.every(p => p.change_id === pushes[0].change_id), pushes.map(p => p.change_id));
  check('…and the cloud applied it once: one new version, one record of the change, no duplicate', (await cloudList('health', userA)).version === v0 + 1 &&
    (await sql('select count(*)::int as n from public.sync_changes where change_id = $1', [pushes[0].change_id]))[0].n === 1 &&
    (await cloudList('health', userA)).data.items.filter(i => i.id === 'h2').length === 1);

  await phone.returnToApp(); await synced(phone); // the phone catches up first (a list is one record: see app/README.md)
  srv.faults.push({ path: '/rest/v1/rpc/sync_push_v3', mode: 'error', times: 99 }, { path: '/rest/v1/rpc/sync_pull_v2', mode: 'error', times: 99 });
  await editList(phone, 'admin', 'a1', 'Laundry (pending 1)');
  await sent(phone, 'list:admin');
  await editList(phone, 'health', 'h3', 'Walk (pending 2)');
  await sent(phone, 'list:health');
  await statusIs(phone, 'local', 8000);
  await phone.open(APP + '#sync');
  await phone.until(`document.getElementById('syncLine') && /changes? (is|are) saved on this device/.test(document.getElementById('syncLine').textContent)`, 12000);
  check('after a reload, the changes waiting to be sent are still there (2)', /2 changes are saved on this device/.test(await phone.text('#syncLine')) && listTitle(await phone.data(), 'admin', 'a1') === 'Laundry (pending 1)', await phone.text('#syncLine'));
  srv.faults.length = 0;
  await syncNowWhenReady(phone);
  await synced(phone);
  check('…and they\'re sent once the cloud answers again', (await cloudList('admin', userA)).data.items.find(i => i.id === 'a1').title === 'Laundry (pending 1)' && (await cloudList('health', userA)).data.items.find(i => i.id === 'h3').title === 'Walk (pending 2)');

  await mac.returnToApp(); await synced(mac); // the Mac catches up with the phone's changes first
  srv.faults.push({ path: '/rest/v1/rpc/sync_push_v3', mode: 'delay', ms: 2000, times: 1 });
  await editList(mac, 'learning', 'l3', 'HTB Academy (slow connection)');
  check('on a slow connection the status shows "Saving…" while it works', await statusIs(mac, 'syncing', 8000) && (await mac.text('#syncBadge')) === 'Saving…', await mac.text('#syncBadge'));
  check('…then "Synced"', await synced(mac));

  console.log('\n[9] Your MyDay follows your account: signing out clears the device; another account never sees yours');
  await mac.returnToApp(); await synced(mac);
  // Signing out with a change that isn't saved to your account yet (offline): it says so, and nothing is lost.
  await mac.offline(true);
  await editList(mac, 'admin', 'a3', 'Clean room (offline)');
  await goSync(mac);
  await mac.click('#syncScreen [data-action=sync-signout]');
  await mac.until(`document.querySelector('dialog[open]')`);
  check('signing out says what happens: everything is saved to your account first, then MyDay\'s data is removed from this device', /saved to your account first/.test(await mac.text('dialog[open]')) && /removed from this device/.test(await mac.text('dialog[open]')), await mac.text('dialog[open]'));
  await mac.answer(true);
  check('offline, with a change not saved yet: it says so, and offers a backup first (nothing is removed)', await mac.until(`(document.querySelector('dialog[open]')?.textContent || '').includes("aren't saved to your account yet")`, 15000)
    && /Download a backup and sign out/.test(await mac.text('dialog[open]')));
  await mac.answer(false);
  await sleep(300);
  check('…"Stay signed in" keeps everything as it was', listTitle(await mac.data(), 'admin', 'a3') === 'Clean room (offline)' && !(await mac.exists('#signInGate')));
  await mac.offline(false); await mac.returnToApp(); await synced(mac);
  check('…and once online, the change is saved to your account', (await cloudList('admin', userA)).data.items.find(i => i.id === 'a3').title === 'Clean room (offline)');
  // Everything saved: signing out clears the device.
  await goSync(mac);
  await mac.click('#syncScreen [data-action=sync-signout]');
  await mac.until(`document.querySelector('dialog[open]')`); await mac.answer(true);
  check('with everything saved: signed out — back to "Welcome to MyDay"', await mac.until(`document.getElementById('signInGate') && document.getElementById('gate-h').textContent === 'Welcome to MyDay'`, 15000), await diag(mac));
  const cleared = await mac.data();
  check('…and MyDay\'s data is gone from this device (a new MyDay\'s, nothing of yours)', !cleared.days[Y] && listTitle(cleared, 'learning', 'l1') !== 'Mac: Networking basics' && !cleared.notes.items.length && (await mac.notes()).link === null);
  srv.log.length = 0;
  await signIn(mac, C);
  check('another account signing in on the same device sees its own MyDay (empty), nothing of yours', await mac.until(`!document.getElementById('signInGate') && document.getElementById('nav')`, 15000) && !(await mac.data()).days[Y] && listTitle(await mac.data(), 'learning', 'l1') !== 'Mac: Networking basics');
  await synced(mac);
  check('…and nothing of yours reached that account', (await sql(`select data from public.task_lists where user_id = $1`, [userC])).every(r => !JSON.stringify(r.data).includes('Mac:')) && (await sql(`select count(*)::int as n from public.day_plans where user_id = $1`, [userC]))[0].n === 0
    && (await sql(`select count(*)::int as n from public.sync_records where user_id = $1 and kind = 'note'`, [userC]))[0].n === 0);
  const tA = await token(A), tC = await token(C);
  check('the account\'s own token reads only its own rows', (await (await rest('/rest/v1/task_lists?select=*', tA)).json()).every(r => r.user_id === userA) && (await (await rest('/rest/v1/sync_records?select=*', tA)).json()).every(r => r.user_id === userA));
  check('another account\'s token reads none of them', (await (await rest('/rest/v1/task_lists?select=*', tC)).json()).every(r => r.user_id === userC) && (await (await rest('/rest/v1/sync_records?select=*', tC)).json()).every(r => r.user_id === userC));
  check('another account can\'t change them directly', (await rest(`/rest/v1/task_lists?user_id=eq.${userA}`, tC, { method: 'PATCH', body: JSON.stringify({ data: { items: [] } }) })).status === 403);
  check('…or through sync_pull/sync_push by naming that account', (await rest('/rest/v1/rpc/sync_pull_v2', tC, { method: 'POST', body: JSON.stringify({ account: userA, since: 0 }) })).status === 403 &&
    (await rest('/rest/v1/rpc/sync_push_v2', tC, { method: 'POST', body: JSON.stringify({ account: userA, changes: [] }) })).status === 403);
  check('signed-out visitors (publishable key only) get nothing', (await rest('/rest/v1/task_lists?select=*', null)).status === 401 && (await rest('/rest/v1/rpc/sync_pull_v2', null, { method: 'POST', body: JSON.stringify({ account: userA }) })).status === 401);
  await goSync(mac);
  await mac.click('#syncScreen [data-action=sync-signout]');
  await mac.until(`document.querySelector('dialog[open]')`); await mac.answer(true);
  await mac.until(`document.getElementById('signInGate')`, 15000);
  await signIn(mac, A);
  check('signing back in as you brings your MyDay back from your account', await mac.until(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); return d.days['${Y}'] && d.lists.learning[0].title === 'Mac: Networking basics' && d.lists.admin.find(i => i.id === 'a3').title === 'Clean room (offline)'; })()`, 15000));
  check('…your Study, notes and Finance too', await mac.until(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); return d.study.topics?.[0]?.title === 'Arabic' && d.notes.items.some(n => n.id === 'ntPhone') && d.finance.expenses.some(e => e.name === 'Rent'); })()`, 15000));
  await synced(mac);

  console.log('\n[10] Backups: export stays complete; restoring one is saved to your account like any change');
  await phone.returnToApp();
  await phone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).lists.admin.find(i => i.id === 'a3').title === 'Clean room (offline)'`);
  await synced(phone);
  await goToday(phone);
  await phone.until(`document.querySelector('[data-action=export]')`);
  for (const f of fs.readdirSync(phone.dir)) fs.unlinkSync(path.join(phone.dir, f));
  await phone.click('[data-action=export]');
  await phone.until(`true`); await sleep(1200);
  const exported = JSON.parse(phone.lastDownload() || '{}');
  pd = await phone.data();
  check('the export holds the whole of the saved data, synced records included', exported.format === 'myday-export' && eq(withoutSaves(exported.data), withoutSaves(pd)));
  check('…every section is there', ['lists', 'queue', 'days', 'context', 'settings', 'rota', 'pay', 'health', 'study', 'notes', 'tasks', 'finance'].every(k => k in exported.data));
  exported.data.lists.admin.find(i => i.id === 'a4').title = 'Groceries (from the backup)';
  const file = path.join(phone.dir, 'restore.json');
  fs.writeFileSync(file, JSON.stringify(exported));
  const doc = await phone.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await phone.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#importFile' });
  await phone.send('DOM.setFileInputFiles', { nodeId, files: [file] });
  await phone.until(`document.querySelector('[data-action=dialog-confirm]')`);
  check('restoring a backup says it replaces your MyDay in your account too (so on all your devices)', /in your account, so on all your devices/.test(await phone.text('dialog[open]')), await phone.text('dialog[open]'));
  await phone.answer(true);
  await phone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).lists.admin.some(i => i.title === 'Groceries (from the backup)')`);
  check('…and it\'s saved to your account straight away, with no extra step', await cloudUntil(async () => (await cloudList('admin', userA)).data.items.some(i => i.title === 'Groceries (from the backup)'), 15000));
  await synced(phone);
  await mac.setData(`s => { for (let i = 1; i <= 20; i++) { const d = String(i).padStart(2, '0'); s.context['2025-01-' + d] = { energy: 3, sleep: { start: null, end: null, estimatedHours: 7 } }; s.days['2025-02-' + d] = { energy: 3, rest: true, builtAt: '', checkedIn: false, tasks: [] }; } }`);
  check('a lot changed at once (e.g. a backup restored in the classic MyDay) is saved to your account too', await cloudUntil(async () => (await sql(`select count(*)::int as n from public.day_plans where user_id = $1 and id like '2025-02-%'`, [userA]))[0].n === 20, 20000) && (await synced(mac)));


  console.log('\n[10b] Guided Study preference and reset, safely against disposable cloud and devices');
  // Existing ssMac was saved in the account earlier, so reset must tombstone it,
  // not merely hide it on the initiating device.
  await synced(mac); await synced(phone);
  const sessionBefore = await cloudRecord(userA, 'session', 'ssMac');
  check('setup: a completed Study session exists in the account', !!sessionBefore && !sessionBefore.deleted);
  await mac.ev(`location.hash = 'study/settings'`);
  await mac.until(`document.querySelector('[data-s="study-primary-subject"]')`);
  await mac.ev(`(() => { const el = document.querySelector('[data-s="study-primary-subject"]'); el.value = 'arabic'; el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  check('choosing Arabic persists as the primary Study subject', await mac.until(`JSON.parse(localStorage.getItem('myday.data.v4')).study.settings.primarySubject === 'arabic'`));
  await synced(mac);
  await phone.returnToApp();
  check('the primary subject syncs to another device', await phone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).study.settings.primarySubject === 'arabic'`));
  await mac.click('[data-action=study-backup]');
  await mac.until(`document.querySelector('[data-action=study-backup-verified]')`);
  check('requesting a backup alone leaves reset disabled', await mac.ev(`document.querySelector('[data-action=study-reset]').disabled`));
  await mac.click('[data-action=study-backup-verified]');
  await mac.until(`document.querySelector('[data-action=study-reset]:not(:disabled)')`);
  check('reset is gated behind checking the requested full MyDay backup', await mac.exists('[data-action=study-reset]:not(:disabled)'));
  await mac.click('[data-action=study-reset]');
  await mac.until(`document.querySelector('dialog[open]')`);
  check('reset demands explicit destructive confirmation', /Reset all Study progress/.test(await mac.text('dialog[open]')));
  await mac.answer(true);
  check('reset clears sessions but keeps the course, subject choice and unrelated notes', await mac.until(`JSON.parse(localStorage.getItem('myday.data.v4')).study.sessions.length === 0`) &&
    (await mac.data()).study.stages.some(s => s.courses.some(c => c.id === 'coAr')) &&
    (await mac.data()).study.settings.primarySubject === 'arabic' && (await mac.data()).notes.items.some(n => n.id === 'ntMac2'));
  await synced(mac);
  const deletedStudySession = await cloudRecord(userA, 'session', 'ssMac');
  check('the Study session is a deleted cloud record (tombstone)', !!deletedStudySession && deletedStudySession.deleted === true);
  await phone.returnToApp();
  check('deleted Study history disappears from the second device', await phone.until(`!JSON.parse(localStorage.getItem('myday.data.v4')).study.sessions.some(s => s.id === 'ssMac')`));
  check('unrelated notes remain on the second device', (await phone.data()).notes.items.some(n => n.id === 'ntMac2'));


  console.log('\n[11] A device that still has another account\'s MyDay (signed out before 1.9.0): never mixed');
  await phone.ev(`localStorage.removeItem('myday.sync.auth')`);
  await phone.open(APP + '#today');
  check('it asks that account to sign in again ("Sign in to carry on", the email filled in)', (await phone.until(`document.getElementById('signInGate')`)) && (await phone.text('#gate-h')) === 'Sign in to carry on' && (await phone.ev(`document.getElementById('syncEmailInput').value`)) === A.email);
  srv.log.length = 0;
  const phoneHad = withoutSaves(await phone.data());
  await signIn(phone, C);
  check('signing in as another account: explained ("A different account"), MyDay stays closed', await phaseIs(phone, 'other-account') && (await phone.text('#gate-h')) === 'A different account');
  await sleep(1500);
  check('…nothing is sent to that account, and this device\'s MyDay is unchanged', !srv.log.some(e => e.path === '/rest/v1/rpc/sync_push_v3') && eq(withoutSaves(await phone.data()), phoneHad));
  check('…and the first account\'s records in the cloud are untouched', (await cloudList('admin', userA)).data.items.some(i => i.title === 'Groceries (from the backup)'));
  await phone.click('#syncScreen [data-action=sync-signout]');
  check('signing out of the other account leaves this device\'s MyDay (the first account\'s) as it is', await phaseIs(phone, 'signed-out') && eq(withoutSaves(await phone.data()), phoneHad));

  console.log('\n[12] Without sync set up, nothing changes');
  srv.log.length = 0;
  await phone.open(PLAIN + '#today');
  check('the usual build shows no sync status, and says everything is saved only in this browser', !(await phone.exists('#syncBadge')) && (await phone.text('.storage-note')) === 'Saved only in this browser.');
  await phone.ev(`location.hash = 'sync'`); await sleep(300);
  check('…its sync address just says sync isn\'t set up', (await phone.text('#app')).includes("Sync isn't set up"));
  check('…and it contacts no cloud', srv.log.length === 0);

  console.log('\n[13] A secret key can never be built into the app');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-secret-'));
  const tryBuild = key => { try { execFileSync('npx', ['vite', 'build', '--outDir', tmp, '--emptyOutDir'], { cwd: path.join(ROOT, 'app'), env: { ...process.env, VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: key }, stdio: 'pipe' }); return 'built'; } catch (e) { return String(e.stderr || e.message); } };
  check('a "sb_secret_" key stops the build, with an explanation', /secret/.test(tryBuild('sb_secret_abcdefghijklmnop')));
  const legacyService = ['{"alg":"HS256"}', '{"role":"service_role"}'].map(x => Buffer.from(x).toString('base64url')).join('.') + '.sig';
  check('a legacy service_role key stops it too', /secret/.test(tryBuild(legacyService)));
  fs.rmSync(tmp, { recursive: true, force: true });

  console.log('\n[14] Half a character never stops syncing (text cut in the middle of an emoji; the account refuses it)');
  // A half character is a lone UTF-16 surrogate; it is built in the page so no JS file holds one.
  const HALF = `String.fromCharCode(0xD83D)`;
  const hasHalf = x => /[\uD800-\uDFFF]/.test(x.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ''));
  const tk = (id, title) => `{ id: '${id}', title: ${title}, listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '${Y}T09:00', postponed: 0, blockers: [], letGoOn: null }`;
  await synced(mac);
  await mac.setData(`s => { s.tasks.items.push(${tk('tkH9', `'Pay council tax 😀' + ${HALF}`)}, ${tk('tkH1', `'Renew passport'`)}); }`);
  await synced(mac);
  const h9 = await cloudRecord(userA, 'task', 'tkH9'), h1 = await cloudRecord(userA, 'task', 'tkH1');
  check('a task whose title ends in half a character reaches the account with the half taken out and the whole emoji kept', !!h9 && h9.data.title === 'Pay council tax 😀', h9 && JSON.stringify(h9.data.title));
  check('…and so does the task that sorts after it', !!h1 && h1.data.title === 'Renew passport');
  check('…and the Mac shows saved, not an error', (await mac.status()) === 'synced', await diag(mac));
  const laptop = await T.device('laptop', path.join(dl, 'laptop'));
  await laptop.open(APP + '#today');
  await signIn(laptop, A);
  await laptop.until(`!document.getElementById('signInGate') && document.getElementById('nav')`, 15000);
  await synced(laptop);
  const ld = await laptop.data();
  const lh9 = ld.tasks.items.find(t => t.id === 'tkH9');
  check('a second device gets the task, without the half', !!lh9 && lh9.title === 'Pay council tax 😀' && !!ld.tasks.items.find(t => t.id === 'tkH1'), lh9 && JSON.stringify(lh9.title));

  // A change noted by 1.35.0 with half a character inside it, still waiting to be sent.
  srv.faults.push({ path: '/rest/v1/rpc/sync_push_v3', mode: 'error', times: 99 });
  await mac.setData(`s => { s.tasks.items.find(t => t.id === 'tkH9').title = 'Book dentist'; s.tasks.items.find(t => t.id === 'tkH1').title = 'Renew passport online'; }`);
  await sent(mac, 'task:tkH9'); await sent(mac, 'task:tkH1');
  // The half character is written into sync's notes and the page reloaded in one go: nothing of the app can run in
  // between and write its own copy of the notes over it, or send the change (the faults are lifted once it has reloaded).
  const noted = await mac.ev(`(() => { const n = JSON.parse(localStorage.getItem('myday.sync.v1')); n.link.out['task:tkH9'].content.title = 'Book dentist 😀' + ${HALF}; localStorage.setItem('myday.sync.v1', JSON.stringify(n));
    const written = JSON.parse(localStorage.getItem('myday.sync.v1')).link.out['task:tkH9']; window.__oldDocument = true; location.reload(); return written; })()`);
  check('(test setup: a change waiting to be sent holds half a character)', !!noted && hasHalf(noted.content.title), noted && JSON.stringify(noted.content.title));
  await mac.until(`!window.__oldDocument && document.readyState === 'complete' && !!document.querySelector('#app')`, 30000);
  srv.faults.length = 0;
  await syncNowWhenReady(mac);
  await synced(mac);
  const n9 = await cloudRecord(userA, 'task', 'tkH9'), n1 = await cloudRecord(userA, 'task', 'tkH1');
  check('the noted change is sent and applied, with the half taken out and the whole emoji kept', !!n9 && !!h9 && n9.data.title === 'Book dentist 😀' && n9.version === h9.version + 1, n9 && JSON.stringify(n9.data.title));
  check('…the change after it in the same send is applied too', !!n1 && !!h1 && n1.data.title === 'Renew passport online' && n1.version === h1.version + 1, n1 && JSON.stringify(n1.data.title));
  check('…nothing is left waiting, nothing was refused, and sync shows saved', Object.keys((await mac.notes()).link.out).length === 0 && Object.keys((await mac.notes()).link.rejected).length === 0 && (await mac.status()) === 'synced', await diag(mac));


  console.log('\n[15] Automatic backups: Your backups, Back up now, Download, Restore, Delete all, and the daily copy (specs/automatic-backups.md)');
  const ctl = (name, body = {}) => fetch(`${API}/__standin/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
  const zlib = require('zlib');
  const BK = 'myday.backup.v1';
  const stored = () => ctl('backup-objects');
  const toastIs = (D, t, ms = 8000) => D.until(`(document.getElementById('toast') || {}).textContent === ${JSON.stringify(t)}`, ms);
  const gunzipFrom = async (key) => { const r = await fetch(`${API}/functions/v1/backup`, { headers: { apikey: KEY, 'x-myday-key': key, Authorization: 'Bearer ' + await token(A) } }); const buf = Buffer.from(await r.arrayBuffer()); try { return { status: r.status, text: zlib.gunzipSync(buf).toString('utf8') }; } catch { return { status: r.status, text: '{}', raw: buf.toString('utf8').slice(0, 200) }; } };
  const bk = laptop;
  const openBackups = async () => { await bk.open(APP + '#today'); await bk.until(`document.querySelector('[data-action=backups]')`, 20000); await bk.click('[data-action=backups]'); return bk.until(`document.getElementById('backups')`); };
  await ctl('backup-reset');
  await bk.ev(`localStorage.removeItem('${BK}')`);
  check('(test setup: the laptop is signed in to the stand-in with nothing backed up)', (await stored()).length === 0 && (await bk.exists('#nav')));
  check('the footer has "Your backups", which opens #backups', await openBackups() && (await bk.ev('location.hash')) === '#backups' && (await bk.text('#backupsH')) === 'Your backups');
  check('with nothing backed up it says "Not backed up yet on this device."', await bk.until(`document.querySelector('[data-s=backup-last]')?.textContent === 'Not backed up yet on this device.'`), await bk.text('[data-s=backup-last]'));
  check('…and the list says there are none yet', await bk.until(`/No backups yet/.test(document.body.textContent)`), await bk.text('#app'));
  check('the page explains where the backups are kept, for how long, and that they hold everything and are never sent to AI', /privately in your own storage/.test(await bk.text('#backups')) && /14 days, plus one a month for a year/.test(await bk.text('#backups')) && /never sent to AI/.test(await bk.text('#backups')));

  console.log('  Back up now');
  await bk.click('[data-action=backup-now]');
  check('Back up now says "Backed up."', await toastIs(bk, 'Backed up.'), await bk.text('#toast'));
  check('…the line becomes "Backed up today at <time> from this device."', await bk.until(`/^Backed up today at .+ from this device\\.$/.test(document.querySelector('[data-s=backup-last]')?.textContent || '')`), await bk.text('[data-s=backup-last]'));
  check('…and the list shows one backup, from "This device"', await bk.until(`document.querySelectorAll('[data-s=backup]').length === 1`) && (await bk.text('[data-s=backup]')).includes('This device'), await bk.text('#app'));
  const todayK = await bk.today(), deviceId = (await bk.ev(`JSON.parse(localStorage.getItem('${BK}'))`)).device;
  const objs = await stored();
  check('the store holds the day\'s backup under the account and device, and device.json', eq(objs.map(o => o.key).sort(), [`${userA}/${deviceId}/${todayK}.json.gz`, `${userA}/${deviceId}/device.json`].sort()), objs);
  for (const f of fs.readdirSync(bk.dir)) fs.unlinkSync(path.join(bk.dir, f));
  await bk.click('[data-action=export]');
  await bk.until(`true`); await sleep(2500);
  const exportNow = JSON.parse(bk.lastDownload() || '{}');
  const fromStore = await gunzipFrom(`${userA}/${deviceId}/${todayK}.json.gz`);
  const backupJson = JSON.parse(fromStore.text);
  check('the stored file decompresses to the same JSON as Export my data (apart from when it was exported)', fromStore.status === 200 && backupJson.format === 'myday-export' && eq(withoutSaves(backupJson.data), withoutSaves(exportNow.data)), [Object.keys(backupJson), Object.keys(exportNow)]);
  check('…and its device state is kept on this device only: not in the data, not in the export', !JSON.stringify(exportNow).includes(deviceId) && !JSON.stringify(await bk.data()).includes(deviceId));
  await bk.ev(`location.hash = '#backups'`); await bk.until(`document.querySelector('[data-action=backup-now]')`);
  await bk.click('[data-action=backup-now]');
  check('pressing it again within 60 seconds says "That was backed up a moment ago."', await toastIs(bk, 'That was backed up a moment ago.'), await bk.text('#toast'));
  await ctl('backup-age', { seconds: 120 });
  await sleep(300);
  await bk.click('[data-action=backup-now]');
  check('after a minute it backs up again (replacing the day\'s file)', await toastIs(bk, 'Backed up.', 10000) && (await stored()).filter(o => o.key.endsWith('.json.gz')).length === 1);

  console.log('  Download and Restore');
  for (const f of fs.readdirSync(bk.dir)) fs.unlinkSync(path.join(bk.dir, f));
  await bk.until(`document.querySelector('[data-s=backup] [data-action=backup-download]')`, 10000);
  await bk.click('[data-s=backup] [data-action=backup-download]');
  await sleep(1500);
  const files = fs.readdirSync(bk.dir).filter(x => !x.endsWith('.crdownload'));
  const dlJson = JSON.parse(bk.lastDownload() || '{}');
  check('Download saves a .json file named for the day and the device', files.length === 1 && new RegExp(`^myday-backup-${todayK}-.+\\.json$`).test(files[0]), files);
  check('…holding the same data as Export my data', dlJson.format === 'myday-export' && eq(withoutSaves(dlJson.data), withoutSaves(exportNow.data)));
  const before15 = await bk.data();
  const title0 = before15.lists.admin[0].title;
  await bk.until(`document.querySelector('[data-s=backup] [data-action=backup-restore]')`, 10000);
  await bk.click('[data-s=backup] [data-action=backup-restore]');
  await bk.until(`document.querySelector('[data-action=dialog-confirm]')`);
  check('Restore asks Import\'s question: "Replace your saved MyDay data with this file?"', /Replace your saved MyDay data with this file\?/.test(await bk.text('dialog[open]')), await bk.text('dialog[open]'));
  await bk.answer(false);
  await sleep(400);
  check('Cancel changes nothing', eq(withoutSaves(await bk.data()), withoutSaves(before15)));
  check('Restore first kept a copy of this device\'s data as it was (today\'s backup exists)', (await stored()).some(o => o.key === `${userA}/${deviceId}/${todayK}.json.gz`));
  await bk.setData(`s => { s.lists.admin[0].title = 'Changed after the backup'; }`);
  check('(test setup: a change made after the backup)', (await bk.data()).lists.admin[0].title === 'Changed after the backup');
  await bk.ev(`location.hash = '#backups'`);
  await ctl('backup-age', { seconds: 120 });
  const keptBefore = Date.now() - 5000;
  await bk.until(`document.querySelector('[data-s=backup] [data-action=backup-restore]')`, 10000);
  await bk.click('[data-s=backup] [data-action=backup-restore]');
  await bk.until(`document.querySelector('[data-action=dialog-confirm]')`);
  const copy = await stored(), copied = await gunzipFrom(`${userA}/${deviceId}/${todayK}.json.gz`);
  check('before the question, the data as it is now was kept as a fresh backup (so the restore can be undone)', copy.find(o => o.key.endsWith('.json.gz')) && Date.parse(copy.find(o => o.key.endsWith('.json.gz')).modified) > keptBefore && JSON.parse(copied.text).data.lists.admin[0].title === 'Changed after the backup', copy);
  await bk.answer(true);
  check('Restore and Replace brings the backup\'s data back', await bk.until(`JSON.parse(localStorage.getItem('myday.data.v4')).lists.admin[0].title === ${JSON.stringify(title0)}`, 15000), (await bk.data()).lists.admin[0].title);
  check('…and it is saved to the account like any restore', await cloudUntil(async () => (await cloudList('admin', userA)).data.items[0].title === title0, 15000) && await synced(bk));

  console.log('  Delete all backups');
  await bk.ev(`location.hash = '#backups'`); await bk.until(`document.querySelector('[data-action=backup-delete-all]')`, 15000);
  await bk.ev(`(() => { const s = JSON.parse(localStorage.getItem('${BK}')); s.failedDays = 3; s.lastFailDay = s.lastDay; localStorage.setItem('${BK}', JSON.stringify(s)); })()`);
  await bk.open(APP + '#backups'); await bk.until(`document.querySelector('[data-action=backup-delete-all]')`, 15000);
  check('(test setup: three failed days are showing)', await bk.exists('[data-s=backup-failing]'));
  await bk.click('[data-action=backup-delete-all]');
  await bk.until(`document.querySelector('[data-action=dialog-confirm]')`);
  check('Delete all asks first: "Delete all your backups?"', /Delete all your backups\?/.test(await bk.text('dialog[open]')), await bk.text('dialog[open]'));
  await bk.answer(false);
  await sleep(300);
  check('"Keep them" keeps them', (await stored()).length === 2 && (await bk.exists('[data-s=backup]')));
  await bk.click('[data-action=backup-delete-all]');
  await bk.until(`document.querySelector('[data-action=dialog-confirm]')`);
  await bk.answer(true);
  check('"Delete all backups" empties the store and the list says "No backups yet…"', await bk.until(`/No backups yet/.test(document.body.textContent) && !document.querySelector('[data-s=backup]')`, 10000) && (await stored()).length === 0, await bk.text('#app'));
  check('…and the failed-days count and its note start again', (await bk.ev(`JSON.parse(localStorage.getItem('${BK}'))`)).failedDays === 0 && !(await bk.exists('[data-s=backup-failing]')));
  check('…and the page no longer says it was backed up', await bk.until(`document.querySelector('[data-s=backup-last]')?.textContent === 'Not backed up yet on this device.'`), await bk.text('[data-s=backup-last]'));

  console.log('  Not set up, a failing daily backup, and a phone');
  await ctl('backup-configured', { configured: false });
  await bk.open(APP + '#backups');
  check('with the function not set up, the page says "Automatic backups aren’t set up yet."', await bk.until(`/Automatic backups aren’t set up yet\\./.test(document.body.textContent)`, 15000), await bk.text('#app'));
  await bk.click('[data-action=backup-now]');
  check('…and Back up now says the same, without saving anything', await toastIs(bk, 'Automatic backups aren’t set up yet.') && (await stored()).length === 0);
  await bk.ev(`window.__realSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new DOMException('Synthetic blocked storage', 'SecurityError'); }`);
  await bk.ev(`location.hash = '#today'`); await sleep(300); await bk.ev(`location.hash = '#backups'`);
  check('when this browser blocks saving, the page says so instead of offering Back up now', await bk.until(`!!document.querySelector('[data-s=backup-blocked]')`, 8000) && !(await bk.exists('[data-action=backup-now]')), await bk.text('#backups'));
  await bk.ev(`Storage.prototype.setItem = window.__realSetItem`);
  await ctl('backup-configured', { configured: true });
  const stateWith = x => bk.ev(`localStorage.setItem('${BK}', JSON.stringify(${JSON.stringify({ device: deviceId, label: 'Mac', lastDay: todayK, lastAt: new Date().toISOString(), failedDays: 0, lastFailDay: null, ...x })}))`);
  await stateWith({ failedDays: 3, lastFailDay: todayK });
  await bk.open(APP + '#backups');
  check('three failed days in a row show a plain note on the page (no pop-up)', await bk.until(`/The daily backup hasn’t worked for 3 days/.test(document.querySelector('[data-s=backup-failing]')?.textContent || '')`, 15000) && !(await bk.exists('dialog[open]')), await bk.text('#backups'));
  await stateWith({ failedDays: 2, lastFailDay: todayK });
  await bk.open(APP + '#backups'); await bk.until(`document.getElementById('backups')`);
  check('…but two do not', !(await bk.exists('[data-s=backup-failing]')));
  await ctl('backup-reset');
  await bk.click('[data-action=backup-now]').catch(() => {});
  await bk.open(APP + '#backups'); await bk.until(`document.querySelector('[data-action=backup-now]')`);
  await bk.click('[data-action=backup-now]');
  await toastIs(bk, 'Backed up.');
  await bk.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  await bk.open(APP + '#backups'); await bk.until(`document.querySelectorAll('[data-s=backup]').length === 1`, 15000); await sleep(300);
  check('phone 320 px: #backups with a backup in the list does not scroll sideways', (await bk.ev('document.documentElement.scrollWidth')) <= 320 && (await bk.ev(`[...document.querySelectorAll('#backups button, [data-s=backup] button')].every(b => b.getBoundingClientRect().height >= 44)`)), await bk.ev('document.documentElement.scrollWidth'));
  await bk.send('Emulation.clearDeviceMetricsOverride');

  console.log('  The daily backup, by itself');
  // (The other signed-in devices of this test make their own daily backups too, so only this device's are looked at.)
  await ctl('backup-reset');
  await bk.ev(`localStorage.removeItem('${BK}')`);
  await bk.open(APP + '#today');
  const mine = async () => { const st = await bk.ev(`JSON.parse(localStorage.getItem('${BK}') || 'null')`); return st ? (await stored()).filter(o => o.key.startsWith(`${userA}/${st.device}/`)) : []; };
  const made = await cloudUntil(async () => (await mine()).some(o => o.key.endsWith(`/${todayK}.json.gz`)), 50000);
  check('with nothing recorded for today, this device\'s backup appears by itself within about 30 seconds, with nothing pressed', made, [await stored(), await bk.ev(`localStorage.getItem('${BK}')`)]);
  await bk.until(`(JSON.parse(localStorage.getItem('${BK}') || '{}')).lastDay`, 10000);
  const afterAuto = (await bk.ev(`JSON.parse(localStorage.getItem('${BK}'))`)) || {};
  check('…and the device remembers today (and no failed days)', afterAuto.lastDay === todayK && afterAuto.failedDays === 0, afterAuto);
  await ctl('backup-reset');
  await bk.open(APP + '#today');
  await sleep(37000);
  check('with today already backed up on this device, none is made by it', (await mine()).length === 0, await stored());


  console.log('\n[16] Files on a project and a note: add, open, remove, put back, delete now (specs/files.md; R2 stood in by the stand-in)');
  const fl = laptop, other = mac;
  const fsrc = path.join(dl, 'files-fsrc'); fs.mkdirSync(fsrc, { recursive: true });
  const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const fpng = path.join(fsrc, 'damp-patch.png'), fpdf = path.join(fsrc, 'timber-quote.pdf'), ftxt = path.join(fsrc, 'measurements.txt'), fsvg = path.join(fsrc, 'logo.svg'), ffake = path.join(fsrc, 'fake-quote.pdf'), fnote = path.join(fsrc, 'note-attachment.txt');
  fs.writeFileSync(fpng, Buffer.from(PNG_B64, 'base64')); fs.writeFileSync(fpdf, '%PDF-1.4\n% made-up quote\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n');
  fs.writeFileSync(ftxt, 'Shed base: two by three metres.\n'); fs.writeFileSync(fsvg, '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  fs.writeFileSync(ffake, 'This is plain text pretending to be a PDF.'); fs.writeFileSync(fnote, 'A line kept with the note.\n');
  const give = async (D, sel, paths) => { const doc = await D.send('DOM.getDocument', { depth: -1 }); const { nodeId } = await D.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: sel }); await D.send('DOM.setFileInputFiles', { nodeId, files: paths }); };
  const fobjects = () => ctl('files-objects');
  const fdata = async () => (await fl.data()).files.items;
  const PJ = 'pjFilesA', NT = 'ntFilesA';
  await ctl('files-reset');
  await fl.open(APP + '#today');
  await fl.setData(`s => { s.projects.items.push({ id: '${PJ}', title: 'Shed files', summary: 'Papers for the shed.', stage: 'capture', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${today}T09:00', updatedAt: '${today}T09:00' });
    s.notes.items.push({ id: '${NT}', categoryId: '', title: 'Shed measurements', text: 'Two by three.', pinned: false, createdAt: '${today}T09:00', updatedAt: '${today}T09:00' }); }`);
  await fl.ev(`location.hash = '#projects/p/${PJ}'`);
  // (A project with no links or files folds those cards into "Add to this project" since 1.85.0: open both, as you would.)
  await fl.until(`!!document.querySelector('[data-action=section-open][data-id=files]')`, 15000);
  await fl.click('[data-action=section-open][data-id=resources]'); await fl.until(`!!document.getElementById('projectResources')`, 5000);
  await fl.click('[data-action=section-open][data-id=files]');
  await fl.until(`document.getElementById('files-project')`, 15000);
  check('the Files card is in the project\'s side column after Resources', await fl.ev(`(() => { const a = document.getElementById('projectResources'), b = document.getElementById('files-project'); return !!a && !!b && !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING); })()`));
  check('empty, it has the hint and "Add a file"', (await fl.text('#files-project')).includes('Keep photos, PDFs and documents with this project.') && (await fl.text('#files-project [data-action=file-add]')) === 'Add a file' && !(await fl.exists('#files-project [data-s=file]')));

  console.log('  Adding files');
  await give(fl, '#files-project input[type=file]', [fpng, fpdf, ftxt]);
  check('the three files reach "kept"', await fl.until(`document.querySelectorAll('#files-project [data-s=file][data-state=kept]').length === 3`, 20000), await fl.text('#files-project'));
  check('a toast says 3 files were added', await toastIs(fl, '3 files added.', 5000) || (await fl.text('#toast')).includes('added'), await fl.text('#toast'));
  const fo = await fobjects(), mainKeys = fo.filter(o => !o.key.endsWith('.thumb'));
  check('the store holds the three files under <account>/project/<id> with the right types', mainKeys.length === 3 && mainKeys.every(o => o.key.startsWith(`${userA}/project/fl`)) && eq(mainKeys.map(o => o.type).sort(), ['application/pdf', 'image/png', 'text/plain']), fo);
  const disp = t => mainKeys.find(o => o.type === t).disposition;
  check('photos and PDFs are served inline, a text file as an attachment under its name', disp('image/png').startsWith('inline;') && disp('application/pdf').startsWith('inline;') && disp('text/plain').startsWith('attachment; filename="measurements.txt"'), mainKeys.map(o => o.disposition));
  check('the photo also gets a ".thumb" preview object (a WebP, inline)', await cloudUntil(async () => (await fobjects()).some(o => o.key.endsWith('.thumb') && o.type === 'image/webp' && o.disposition === 'inline'), 15000), await fobjects());
  check('…and the card shows it as a picture', await fl.until(`!!document.querySelector('#files-project [data-s=file] img') && document.querySelector('#files-project [data-s=file] img').naturalWidth > 0`, 15000), await fl.text('#files-project'));
  const recs = await fdata();
  check('the records hold name, type, size, a SHA-256, area and state, and the project lists the three ids', recs.length === 3 && recs.every(f => f.state === 'kept' && /^[0-9a-f]{64}$/.test(f.sha256) && f.area === 'project' && f.size > 0) && eq((await fl.data()).projects.items.find(p => p.id === PJ).fileIds.sort(), recs.map(f => f.id).sort()) && recs.find(f => f.name === 'timber-quote.pdf').type === 'application/pdf', recs);
  check('each row shows its name and its type and size', (await fl.text('#files-project')).includes('timber-quote.pdf') && /PDF · \d+ KB/.test(await fl.text('#files-project')) && /Text · 1 KB/.test(await fl.text('#files-project')));
  const filesBefore = JSON.stringify(await fdata()), objectsBefore = (await fobjects()).length;
  await give(fl, '#files-project input[type=file]', [fsvg]);
  check('an SVG is refused with the reason, and nothing is saved or stored', await fl.until(`!!document.querySelector('#files-project [data-s=file-refused]')`, 8000) && (await fl.text('#files-project [data-s=file-refused]')).includes('logo.svg') && (await fl.text('#files-project [data-s=file-refused]')).includes('Only photos, PDFs and documents (Word, Excel, PowerPoint, text, CSV), up to 25 MB each.') && JSON.stringify(await fdata()) === filesBefore && (await fobjects()).length === objectsBefore, await fl.text('#files-project'));
  await give(fl, '#files-project input[type=file]', [ffake]);
  check('a ".pdf" that is really text is refused on the device first, with nothing saved or stored', await fl.until(`/fake-quote\\.pdf/.test(document.querySelector('#files-project [data-s=file-refused]')?.textContent || '')`, 8000) && JSON.stringify(await fdata()) === filesBefore && (await fobjects()).length === objectsBefore, await fl.text('#files-project'));

  console.log('  Opening a file');
  await fl.ev(`window.__opened = []; window.open = () => ({ opener: 1, close() {}, location: { set href(v) { window.__opened.push(v); } } }); window.__assigned = [];`);
  const pdfId = recs.find(f => f.name === 'timber-quote.pdf').id;
  await fl.click(`#files-project [data-s=file][data-id="${pdfId}"] [data-action=file-open]`);
  check('Open on the PDF opens a new tab on the short-lived R2 link', await fl.until(`window.__opened.length === 1`, 8000) && (await fl.ev('window.__opened[0]')).startsWith(`${API}/__r2/`), await fl.ev('window.__opened'));
  const bytes = await fetch(await fl.ev('window.__opened[0]'));
  check('…which serves the PDF itself, inline, as stored', bytes.status === 200 && bytes.headers.get('content-type') === 'application/pdf' && bytes.headers.get('content-disposition').startsWith('inline;') && (await bytes.text()).startsWith('%PDF-1.4'));
  check('a link that is not a current one is refused by R2', (await fetch(`${API}/__r2/${'0'.repeat(32)}`)).status === 403);

  const txtId = recs.find(f => f.name === 'measurements.txt').id, hashBefore = await fl.ev('location.href');
  for (const f of fs.readdirSync(fl.dir)) fs.unlinkSync(path.join(fl.dir, f));
  await fl.click(`#files-project [data-s=file][data-id="${txtId}"] [data-action=file-open]`);
  await cloudUntil(async () => fs.existsSync(path.join(fl.dir, 'measurements.txt')) && !fs.readdirSync(fl.dir).some(x => x.endsWith('.crdownload')), 20000);
  check('Open on a text file saves it under its name, with its contents, and MyDay stays where it is', fs.existsSync(path.join(fl.dir, 'measurements.txt')) && fs.readFileSync(path.join(fl.dir, 'measurements.txt'), 'utf8') === 'Shed base: two by three metres.\n' && (await fl.ev('location.href')) === hashBefore && (await fl.exists('#files-project')), fs.readdirSync(fl.dir));
  await fl.ev(`window.open = () => null`);
  await fl.click(`#files-project [data-s=file][data-id="${pdfId}"] [data-action=file-open]`);
  check('when the browser blocks the new tab for a PDF, a toast says so and MyDay stays where it is', await toastIs(fl, 'Your browser blocked the new tab. Allow pop-ups for MyDay, then try again.', 5000) && (await fl.ev('location.href')) === hashBefore, await fl.text('#toast'));
  await fl.ev(`window.open = () => ({ opener: 1, close() {}, location: { set href(v) { window.__opened.push(v); } } })`);

  console.log('  The second device');
  await synced(fl);
  await other.open(APP + '#projects/p/' + PJ);
  await other.until(`document.getElementById('files-project') && document.querySelectorAll('#files-project [data-s=file]').length === 3`, 25000);
  check('another device receives the three file records and the project\'s file ids, and lists them as kept', (await other.ev(`document.querySelectorAll('#files-project [data-s=file][data-state=kept]').length`)) === 3 && eq((await other.data()).files.items.map(f => f.id).sort(), recs.map(f => f.id).sort()) && eq((await other.data()).projects.items.find(p => p.id === PJ).fileIds.sort(), recs.map(f => f.id).sort()), await other.text('#files-project'));
  check('…and the account holds the file records (never their bytes)', (await sql(`select count(*)::int as n from public.sync_records where user_id = $1 and kind = 'file' and not deleted`, [userA]))[0].n === 3 && !JSON.stringify(await sql(`select data from public.sync_records where user_id = $1 and kind = 'file'`, [userA])).includes('%PDF'));

  console.log('  Remove, Recently deleted, Put back and Delete now');
  await fl.click(`#files-project [data-s=file][data-id="${pdfId}"] [data-action=file-remove]`);
  check('Remove says "Removed — it’s in Recently deleted for 30 days."', await toastIs(fl, 'Removed — it’s in Recently deleted for 30 days.', 5000), await fl.text('#toast'));
  const goes = (await fl.data()).files.items.find(f => f.id === pdfId);
  check('…the row leaves the card and the file waits under Recently deleted with the day it goes for good (30 days on)', !(await fl.exists(`#files-project [data-s=file][data-id="${pdfId}"]`)) && (await fl.text('#files-project [data-s=files-deleted]')).includes('timber-quote.pdf') && /Goes for good on/.test(await fl.text(`#files-project [data-s=file-deleted][data-id="${pdfId}"]`)) && /^\d{4}-\d\d-\d\d$/.test(goes.deletedOn) && goes.removedFrom.id === PJ && (await fl.text('#files-project [data-s=files-deleted] summary')).includes('Recently deleted (1)'), await fl.text('#files-project'));
  check('…its bytes are still stored (nothing is deleted for 30 days)', (await fobjects()).some(o => o.key.endsWith(pdfId)));
  await fl.click(`#files-project [data-action=file-put-back]`);
  check('Put back returns it to the card as kept, and out of Recently deleted', await fl.until(`!!document.querySelector('#files-project [data-s=file][data-id="${pdfId}"][data-state=kept]') && !document.querySelector('#files-project [data-s=file-deleted]')`, 8000) && !('deletedOn' in (await fdata()).find(f => f.id === pdfId)));
  await fl.click(`#files-project [data-s=file][data-id="${pdfId}"] [data-action=file-remove]`); await sleep(300);
  await fl.ev(`document.querySelector('#files-project [data-s=files-deleted]').open = true`);
  await fl.click(`#files-project [data-action=file-delete-now]`);
  await fl.until(`document.querySelector('[data-action=dialog-confirm]')`);
  check('Delete now asks first ("Delete … for good?")', /for good\?/.test(await fl.text('dialog[open]')) && /can’t be brought back/.test(await fl.text('dialog[open]')), await fl.text('dialog[open]'));
  await fl.answer(false); await sleep(300);
  check('"Keep it" keeps it', (await fobjects()).some(o => o.key.endsWith(pdfId)) && (await fdata()).some(f => f.id === pdfId));
  await fl.click(`#files-project [data-action=file-delete-now]`);
  await fl.until(`document.querySelector('[data-action=dialog-confirm]')`);
  await fl.answer(true);
  check('"Delete for good" removes the stored object and the record', await toastIs(fl, 'Deleted for good.', 8000) && !(await fobjects()).some(o => o.key.endsWith(pdfId)) && !(await fdata()).some(f => f.id === pdfId) && !(await fl.exists('#files-project [data-s=files-deleted]')), await fobjects());
  check('…the project no longer lists it, and the removal reaches the account as a deleted record', !(await fl.data()).projects.items.find(p => p.id === PJ).fileIds.includes(pdfId) && await cloudUntil(async () => (await sql(`select deleted from public.sync_records where user_id = $1 and kind = 'file' and id = $2`, [userA, pdfId]))[0]?.deleted === true, 30000));

  console.log('  A note\'s files, and deleting the note');
  await fl.ev(`location.hash = '#projects/notes/${NT}'`);
  await fl.until(`document.getElementById('files-note')`, 15000);
  check('the note editor has its own Files card', (await fl.text('#files-note')).includes('Keep photos, PDFs and documents with this note.'));
  await give(fl, '#files-note input[type=file]', [fnote]);
  check('a .txt added to the note reaches "kept" and is stored under the note area', await fl.until(`document.querySelectorAll('#files-note [data-s=file][data-state=kept]').length === 1`, 15000) && (await fobjects()).some(o => o.key.startsWith(`${userA}/note/fl`) && o.type === 'text/plain'), await fobjects());
  const noteFile = (await fdata()).find(f => f.area === 'note');
  check('…and the note lists it (a note with only a file is not blank)', eq((await fl.data()).notes.items.find(n => n.id === NT).fileIds, [noteFile.id]));
  await fl.click('[data-action=note-delete]'); await sleep(400);
  if (await fl.exists('[data-action=dialog-confirm]')) await fl.answer(true);
  await fl.until(`!JSON.parse(localStorage.getItem('myday.data.v4')).notes.items.some(n => n.id === '${NT}')`, 8000);
  const nf = (await fdata()).find(f => f.id === noteFile.id);
  check('deleting the note sends its file to Recently deleted (not lost), from that note', !!nf && !!nf.deletedOn && nf.removedFrom.kind === 'note' && nf.removedFrom.id === NT && (await fobjects()).some(o => o.key.endsWith(noteFile.id)), nf);
  await fl.ev(`location.hash = '#projects'`);
  check('the Projects home lists it under "Files from deleted projects and notes", with its day', await fl.until(`!!document.querySelector('[data-s=files-homeless]')`, 10000) && (await fl.text('[data-s=files-homeless]')).includes('note-attachment.txt') && /Goes for good on/.test(await fl.text('[data-s=files-homeless]')), await fl.text('#app'));
  check('…and there is no Put back for it (its note is gone), only Delete now', !(await fl.exists('[data-s=files-homeless] [data-action=file-put-back]')) && (await fl.exists('[data-s=files-homeless] [data-action=file-delete-now]')));

  console.log('  Try again after the server\'s check did not answer, and an upload that was never finished');
  await ctl('files-fail', { action: 'confirm', times: 1 });
  await fl.ev(`location.hash = '#projects/p/${PJ}'`); await fl.until(`document.getElementById('files-project')`, 10000);
  const plain = path.join(fsrc, 'second-measurements.txt'); fs.writeFileSync(plain, 'Second set of measurements.\n');
  await give(fl, '#files-project input[type=file]', [plain]);
  const retryRow = await fl.until(`!!document.querySelector('#files-project [data-s=file][data-state=failed] [data-action=file-retry]')`, 15000);
  const retryId = retryRow ? await fl.ev(`document.querySelector('#files-project [data-s=file][data-state=failed]').dataset.id`) : null;
  check('when the server\'s check does not answer, the file is "failed" with a Try again, and its bytes are already stored', retryRow && (await fobjects()).some(o => o.key.endsWith(retryId)), await fl.text('#files-project'));
  const putsBefore = (await ctl('files-log')).length;
  await fl.ev(`window.__puts = 0; const f0 = window.fetch; window.fetch = function (u, o) { if (o && o.method === 'PUT') window.__puts++; return f0.apply(this, arguments); };`);
  await fl.click(`#files-project [data-s=file][data-id="${retryId}"] [data-action=file-retry]`);
  check('Try again goes straight to the check (the upload says the bytes exist): kept, with no second PUT of the bytes', await fl.until(`!!document.querySelector('#files-project [data-s=file][data-id="${retryId}"][data-state=kept]')`, 15000) && (await fl.ev('window.__puts')) === 0, [await fl.ev('window.__puts'), putsBefore]);
  await fl.ev(`window.__opened = window.__opened || []`);
  await other.returnToApp();
  await other.until(`JSON.parse(localStorage.getItem('myday.data.v4')).files.items.some(f => f.id === '${retryId}')`, 20000);
  await other.setData(`s => { s.files.items.push({ id: 'flstale000001', name: 'Half added.pdf', type: 'application/pdf', size: 1000, sha256: '${'f'.repeat(64)}', area: 'project', state: 'uploading', addedOn: '${today}', startedAt: ${Date.now() - 2 * 60 * 60 * 1000} }, { id: 'flfresh000001', name: 'Just starting.pdf', type: 'application/pdf', size: 1000, sha256: '${'f'.repeat(64)}', area: 'project', state: 'uploading', addedOn: '${today}', startedAt: ${Date.now()} }); const p = s.projects.items.find(x => x.id === '${PJ}'); p.fileIds = [...(p.fileIds || []), 'flstale000001', 'flfresh000001']; }`);
  await other.ev(`location.hash = '#projects/p/${PJ}'`);
  await other.until(`!!document.querySelector('#files-project [data-id=flstale000001]')`, 15000);
  check('on another device an "uploading" record started two hours ago says "It wasn’t finished."; a fresh one says "Still being added."', (await other.text('#files-project [data-id=flstale000001] [data-s=file-status]')) === 'It wasn’t finished.' && (await other.text('#files-project [data-id=flfresh000001] [data-s=file-status]')) === 'Still being added.', [await other.text('#files-project [data-id=flstale000001]'), await other.text('#files-project [data-id=flfresh000001]')]);

  console.log('  When files are not set up, and when the stored bytes do not match');
  await ctl('files-configured', { configured: false });
  await fl.ev(`location.hash = '#projects/p/${PJ}'`);
  await fl.until(`document.getElementById('files-project')`, 10000);
  await give(fl, '#files-project input[type=file]', [fnote]);
  check('with the function not set up, adding says "Files aren’t set up yet."', await fl.until(`/Files aren’t set up yet\\./.test(document.querySelector('#files-project')?.textContent || '')`, 10000), await fl.text('#files-project'));
  const failedRec = (await fdata()).find(f => f.name === 'note-attachment.txt' && f.area === 'project');
  check('…and the record is not left "uploading": it is "failed" (and shown so), with nothing stored', !!failedRec && failedRec.state === 'failed' && (await fl.exists(`#files-project [data-s=file][data-id="${failedRec.id}"][data-state=failed]`)) && !(await fobjects()).some(o => o.key.endsWith(failedRec.id)), failedRec);
  await ctl('files-configured', { configured: true });
  await fl.click(`#files-project [data-s=file][data-id="${failedRec.id}"] [data-action=file-retry]`);
  check('"Try again" keeps it once the function answers', await fl.until(`!!document.querySelector('#files-project [data-s=file][data-id="${failedRec.id}"][data-state=kept]')`, 15000) && (await fobjects()).some(o => o.key.endsWith(failedRec.id)));

  console.log('  A phone');
  await fl.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  await fl.open(APP + '#projects/p/' + PJ);
  await fl.until(`document.querySelectorAll('#files-project [data-s=file]').length >= 3`, 15000); await sleep(400);
  check('phone 320 px: the project with its Files card does not scroll sideways, and its buttons are at least 44 px tall', (await fl.ev('document.documentElement.scrollWidth')) <= 320 && (await fl.ev(`[...document.querySelectorAll('#files-project button, #files-project [data-action]')].every(b => b.getBoundingClientRect().height >= 44)`)), [await fl.ev('document.documentElement.scrollWidth'), await fl.ev(`[...document.querySelectorAll('#files-project [data-action]')].map(b => Math.round(b.getBoundingClientRect().height))`)]);
  await fl.send('Emulation.clearDeviceMetricsOverride');


  console.log('\n[17] Your storage: the line on every Files card, and what happens when it is full');
  const FR = await import(pathToFileURL(path.join(ROOT, 'supabase/functions/_shared/files/rules.ts')).href);
  const line = () => fl.text('#files-project [data-s=files-storage] p').then(x => x.replace(/\s+/g, ' ').trim());
  const usageNow = async () => (await (await fetch(`${API}/functions/v1/files`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json', Authorization: 'Bearer ' + await token(A) }, body: JSON.stringify({ action: 'usage' }) })).json());
  const expLine = async (extra = '') => { const u = await usageNow(); return (u.bytes ? `Your files: ${FR.amountLabel(u.bytes, Math.floor)} used, ${FR.amountLabel(u.limit - u.bytes, Math.floor)} left of ${FR.amountLabel(u.limit)}.` : `Your files: nothing stored yet, ${FR.amountLabel(u.limit)} left.`) + extra; };
  const PJ2 = 'pjFilesB';
  await ctl('files-reset');
  await fl.open(APP + '#today');
  await fl.setData(`s => { s.files.items = []; for (const p of s.projects.items) delete p.fileIds; for (const n of s.notes.items) delete n.fileIds;
    s.projects.items.push({ id: '${PJ2}', title: 'Storage line', summary: '', stage: 'capture', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${today}T09:00', updatedAt: '${today}T09:00' }); }`);
  // (With no files the card folds into "Add to this project" since 1.85.0: open it as you would.)
  const open2 = async () => { await fl.open(APP + '#projects/p/' + PJ2); await fl.until(`document.getElementById('files-project') || document.querySelector('[data-action=section-open][data-id=files]')`, 15000);
    if (await fl.exists('[data-action=section-open][data-id=files]')) await fl.click('[data-action=section-open][data-id=files]');
    await fl.until(`document.getElementById('files-project')`, 15000); };
  await open2();
  check('the account\'s limit is 10 GB, and with nothing stored the line says so: "Your files: nothing stored yet, 10 GB left."', await fl.until(`!!document.querySelector('#files-project [data-s=files-storage]')`, 15000) && (await line()) === 'Your files: nothing stored yet, 10 GB left.' && (await usageNow()).limit === 10 * 1024 * 1024 * 1024, await line());
  check('…last in the card, after the Add button, with a bar', await fl.ev(`(() => { const b = document.querySelector('#files-project [data-action=file-add]'), l = document.querySelector('#files-project [data-s=files-storage]'); return !!(b.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING) && !!l.querySelector('[aria-hidden=true]') && document.querySelector('#files-project').lastElementChild === l; })()`));
  await give(fl, '#files-project input[type=file]', [fpng, fpdf, ftxt]);
  await fl.until(`document.querySelectorAll('#files-project [data-s=file][data-state=kept]').length === 3`, 20000);
  await cloudUntil(async () => (await fobjects()).some(o => o.key.endsWith('.thumb')), 15000);
  const small = (await usageNow()).bytes;
  check('after adding the three small files the line moves: "Your files: 1 KB used, 9.9 GB left of 10 GB." (a few bytes less than 10 GB rounds down to 9.9; previews are not counted)', await fl.until(`/1 KB used/.test(document.querySelector('#files-project [data-s=files-storage]')?.textContent || '')`, 10000) && (await line()) === 'Your files: 1 KB used, 9.9 GB left of 10 GB.' && (await line()) === await expLine() && small < 4096, [await line(), small]);
  check('with nothing in Recently deleted the line does not mention it', !(await line()).includes('Recently deleted'));
  const ids2 = (await fl.data()).projects.items.find(p => p.id === PJ2).fileIds, recs2 = (await fdata()).filter(f => ids2.includes(f.id));
  const bigOne = recs2.find(f => f.name === 'timber-quote.pdf');
  await ctl('files-put', { key: `${userA}/project/${bigOne.id}`, size: 300 * 1024 * 1024, type: 'application/pdf' });
  await open2();
  check('a larger stored amount shows as it is: "Your files: 300 MB used, 9.7 GB left of 10 GB."', await fl.until(`/300 MB used/.test(document.querySelector('#files-project [data-s=files-storage]')?.textContent || '')`, 15000) && (await line()) === 'Your files: 300 MB used, 9.7 GB left of 10 GB.' && (await line()) === await expLine(), await line());
  await fl.click(`#files-project [data-s=file][data-id="${bigOne.id}"] [data-action=file-remove]`);
  check('with a file in Recently deleted the line adds "Files in Recently deleted count until they go."', await fl.until(`/count until they go/.test(document.querySelector('#files-project [data-s=files-storage]')?.textContent || '')`, 8000) && (await line()) === 'Your files: 300 MB used, 9.7 GB left of 10 GB. Files in Recently deleted count until they go.' && (await line()) === await expLine(' Files in Recently deleted count until they go.'), await line());
  check('…and the amount has not changed yet (a removed file is still stored)', (await line()).includes('300 MB used'));
  await fl.ev(`document.querySelector('#files-project [data-s=files-deleted]').open = true`);
  await fl.click('#files-project [data-action=file-delete-now]');
  await fl.until(`document.querySelector('[data-action=dialog-confirm]')`);
  await fl.answer(true);
  check('Delete now updates the line at once: the space is back ("1 KB used, 9.9 GB left of 10 GB.") and the note about Recently deleted is gone', await fl.until(`/^Your files: 1 KB used, 9\\.9 GB left of 10 GB\\.$/.test((document.querySelector('#files-project [data-s=files-storage] p') || {}).textContent || '')`, 10000), await line());
  const threeMb = path.join(fsrc, 'three-megabytes.txt'); fs.writeFileSync(threeMb, 'a line of made-up text\n'.repeat(Math.ceil(3 * 1024 * 1024 / 23)).slice(0, 3 * 1024 * 1024));
  await give(fl, '#files-project input[type=file]', [threeMb]);
  check('adding a 3 MB file moves the line, worded like the others', await fl.until(`/^Your files: 3(\\.0)? MB used, 9\\.9 GB left of 10 GB\\.$/.test((document.querySelector('#files-project [data-s=files-storage] p') || {}).textContent || '')`, 25000) && (await line()) === await expLine(), await line());

  console.log('  Nearly full');
  const LIMIT = 10 * 1024 * 1024 * 1024;
  await ctl('files-put', { key: `${userA}/project/flnearlyfull1`, size: LIMIT - 5 * 1024 - (await usageNow()).bytes + 0, type: 'application/pdf' });
  const used3 = (await usageNow()).bytes, left3 = LIMIT - used3;
  check('(test setup: about 5 KB left of 10 GB)', left3 > 0 && left3 < 8 * 1024, left3);
  await open2(); await fl.until(`/KB left/.test(document.querySelector('#files-project [data-s=files-storage]')?.textContent || '')`, 15000);
  check('the line says how little is left', (await line()) === await expLine() && /^Your files: 9\.9 GB used, \d+ KB left of 10 GB\.$/.test(await line()), await line());
  const bigger = path.join(fsrc, 'too-big-for-the-room.txt'); fs.writeFileSync(bigger, 'x'.repeat(20 * 1024));
  const filesNow = JSON.stringify((await fdata()).map(f => f.id)), objsNow = (await fobjects()).length;
  const idsBefore = JSON.stringify((await fl.data()).projects.items.find(p => p.id === PJ2).fileIds);
  await give(fl, '#files-project input[type=file]', [bigger]);
  const want = `too-big-for-the-room.txt: There’s ${FR.amountLabel(left3, Math.floor)} left of 10 GB, and this file is ${FR.amountLabel(20 * 1024)}. To make room, remove files you don’t need, then use Delete now in Recently deleted.`;
  check('a file that does not fit is refused with the reason, in the card', await fl.until(`!!document.querySelector('#files-project [data-s=file-refused]')`, 10000) && (await fl.text('#files-project [data-s=file-refused]')).replace(/\s+/g, ' ').trim() === want, [await fl.text('#files-project [data-s=file-refused]'), want]);
  check('…no record is kept, no row is left "uploading" or "failed", and nothing new is stored', JSON.stringify((await fdata()).map(f => f.id)) === filesNow && (await fobjects()).length === objsNow && !(await fl.exists('#files-project [data-s=file][data-state=uploading]')) && !(await fl.exists('#files-project [data-s=file][data-state=failed]')) && !(await fdata()).some(f => f.name === 'too-big-for-the-room.txt'));
  check('…and the project does not list it either', JSON.stringify((await fl.data()).projects.items.find(p => p.id === PJ2).fileIds) === idsBefore);
  check('a file that does fit (under the 5 KB left) is still accepted', await (async () => { const tiny = path.join(fsrc, 'tiny-fits.txt'); fs.writeFileSync(tiny, 'fits'); await give(fl, '#files-project input[type=file]', [tiny]); return fl.until(`[...document.querySelectorAll('#files-project [data-s=file][data-state=kept]')].some(r => r.textContent.includes('tiny-fits.txt'))`, 15000); })());

  console.log('  No line when it should not show, and a phone');
  await fl.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  await open2(); await fl.until(`!!document.querySelector('#files-project [data-s=files-storage]')`, 15000); await sleep(300);
  check('phone 320 px: the storage line does not scroll sideways', (await fl.ev('document.documentElement.scrollWidth')) <= 320 && (await fl.ev(`document.querySelector('#files-project [data-s=files-storage]').getBoundingClientRect().right`)) <= 320, await fl.ev('document.documentElement.scrollWidth'));
  await fl.send('Emulation.clearDeviceMetricsOverride');
  await ctl('files-configured', { configured: false });
  await open2(); await sleep(3000);
  check('with the function not set up, the card shows no storage line (nothing to say)', !(await fl.exists('#files-project [data-s=files-storage]')) && (await fl.exists('#files-project [data-action=file-add]')), await fl.text('#files-project'));
  await ctl('files-configured', { configured: true });
  await ctl('files-reset');

  console.log('\n[17b] Stored files nothing lists: found, offered, and deleted only when asked (specs/files.md)');
  {
    await ctl('files-reset');
    await fl.open(APP + '#today');
    const PJN = 'pjUnlisted', NAMED = 'flnamed00001', ORPHAN = 'florphan0001', FRESH = 'flfresh00001';
    const overAWeek = new Date(Date.now() - 8 * 86400000).toISOString(), twoDays = new Date(Date.now() - 2 * 86400000).toISOString();
    await fl.setData(`s => { s.files.items = [{ id: '${NAMED}', name: 'named.pdf', type: 'application/pdf', size: 2048, sha256: '', area: 'project', state: 'kept', addedOn: '${today}' }];
      for (const p of s.projects.items) delete p.fileIds; for (const n of s.notes.items) delete n.fileIds;
      s.projects.items.push({ id: '${PJN}', title: 'Unlisted files', summary: '', stage: 'capture', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${today}T09:00', updatedAt: '${today}T09:00', fileIds: ['${NAMED}'] }); }`);
    // Left over (stored over a week ago, nothing names it), with its preview; one stored two days ago (another device's
    // upload whose record may still be on its way); one a record names; one in an area this version doesn't know.
    await ctl('files-put', { key: `${userA}/project/${ORPHAN}`, size: 5 * 1024 * 1024, type: 'application/pdf', modified: overAWeek });
    await ctl('files-put', { key: `${userA}/project/${ORPHAN}.thumb`, size: 1000, type: 'image/webp', modified: overAWeek });
    await ctl('files-put', { key: `${userA}/note/${FRESH}`, size: 1024 * 1024, type: 'text/plain', modified: twoDays });
    await ctl('files-put', { key: `${userA}/project/${NAMED}`, size: 2048, type: 'application/pdf', modified: overAWeek });
    await ctl('files-put', { key: `${userA}/gallery/flgallery001`, size: 4096, type: 'image/png', modified: overAWeek });
    await fl.open(APP + '#projects/p/' + PJN); await fl.until(`document.getElementById('files-project')`, 15000);
    const unlistedText = () => fl.ev(`(document.querySelector('#files-project [data-s=files-unlisted]')?.textContent || '').replace(/\\s+/g, ' ').trim()`);
    check('once this device is in step, the storage line says one stored file (5 MB) isn\'t in your MyDay any more', await synced(fl) && await fl.until(`/^1 stored file \\(5 MB\\) isn’t in your MyDay any more/.test((document.querySelector('#files-project [data-s=files-unlisted]')?.textContent || '').trim())`, 20000), await unlistedText());
    check('…only the old one: not one stored less than a week ago, not the one a record names, not an area this version doesn\'t know', /^1 stored file/.test(await unlistedText()));
    await fl.click('#files-project [data-action=files-unlisted-delete]');
    check('Delete them… asks first, saying how much and to open a device that added files offline', await fl.until(`/Delete 1 stored file that nothing in your MyDay lists\\?/.test(document.querySelector('dialog[open]')?.textContent || '') && /open it first/.test(document.querySelector('dialog[open]')?.textContent || '')`, 5000));
    await fl.answer(false);
    check('…Keep them keeps them', (await fobjects()).some(o => o.key.endsWith(ORPHAN)) && /^1 stored file/.test(await unlistedText()));
    await fl.click('#files-project [data-action=files-unlisted-delete]');
    await fl.until(`document.querySelector('[data-action=dialog-confirm]')`, 5000); await fl.answer(true);
    check('…Delete them deletes it and its preview, and nothing else', await cloudUntil(async () => { const keys = (await fobjects()).map(o => o.key); return !keys.some(k => k.includes(ORPHAN)) && keys.some(k => k.endsWith(FRESH)) && keys.some(k => k.endsWith(NAMED)) && keys.some(k => k.endsWith('flgallery001')); }, 15000), (await fobjects()).map(o => o.key.split('/').slice(1).join('/')));
    check('…and the line goes', await fl.until(`!document.querySelector('#files-project [data-s=files-unlisted]')`, 10000));
    await fl.setData(`s => { s.projects.items = s.projects.items.filter(p => p.id !== '${PJN}'); s.files.items = []; }`);
    await ctl('files-reset');
  }

  console.log('\n[18] Files on a Cybersecurity portfolio entry: add, refuse, five at most, open, remove, put back, remove the entry, export (specs/study-home-and-lessons.md §10)');
  const pfSrc = path.join(fsrc, 'portfolio'); fs.mkdirSync(pfSrc, { recursive: true });
  const pngBytes = Buffer.from(PNG_B64, 'base64');
  // Valid PNGs that differ (made-up trailing bytes after the image), so each is its own file.
  const pngNamed = (name, n) => { const p = path.join(pfSrc, name); fs.writeFileSync(p, Buffer.concat([pngBytes, Buffer.from('made-up trailing bytes ' + n)])); return p; };
  const pShot = pngNamed('scan-result.png', 1), pTxt = path.join(pfSrc, 'notes.txt'), pSvg = path.join(pfSrc, 'diagram.svg'), pBig = path.join(pfSrc, 'huge-screenshot.png');
  fs.writeFileSync(pTxt, 'Plain notes about the scan.\n'); fs.writeFileSync(pSvg, '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  fs.writeFileSync(pBig, Buffer.concat([pngBytes, Buffer.alloc(2 * 1024 * 1024 + 1)]));
  const PF = 'pffilesa1', PF2 = 'pffilesb1', PFSEL = `[data-cy-pf-entry="${PF}"]`, PF2SEL = `[data-cy-pf-entry="${PF2}"]`;
  const ENTRY = (id, title) => `{ id: '${id}', attemptId: 'at${id}', activityId: 'exercise.learning-evidence', title: '${title}', evidence: 'Ran a made-up scan on my own lab machine.', note: '', reviewedOn: '${today}' }`;
  const pfEntry = async id => ((await fl.data()).cybersecurity.portfolio || []).find(e => e.id === id);
  const pfFiles = async () => (await fl.data()).files.items.filter(f => f.area === 'portfolio');
  const cachedIds = () => fl.ev(`new Promise(res => { const r = indexedDB.open('myday-files'); r.onerror = () => res(null); r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains('bytes')) { db.close(); return res([]); } const q = db.transaction('bytes').objectStore('bytes').getAllKeys(); q.onsuccess = () => { db.close(); res(q.result); }; q.onerror = () => { db.close(); res(null); }; }; })`);
  const cachedBytes = id => fl.ev(`new Promise(res => { const r = indexedDB.open('myday-files'); r.onsuccess = () => { const db = r.result; const q = db.transaction('bytes').objectStore('bytes').get(${JSON.stringify(id)}); q.onsuccess = () => { db.close(); res(q.result ? { type: q.result.type, bytes: Array.from(new Uint8Array(q.result.bytes)) } : null); }; }; })`);
  const pfRefused = () => fl.text(PFSEL + ' [data-s=file-refused]').then(x => x.replace(/\s+/g, ' ').trim());
  await ctl('files-reset');
  await fl.open(APP + '#today');
  await fl.setData(`s => { s.files.items = []; for (const p of s.projects.items) delete p.fileIds; for (const n of s.notes.items) delete n.fileIds;
    s.cybersecurity = s.cybersecurity || {}; s.cybersecurity.portfolio = [${ENTRY(PF, 'Reading a scan result')}]; }`);
  await fl.ev(`location.hash = '#study/cybersecurity/portfolio'`);
  await fl.until(`document.querySelector('${PFSEL} [data-cy-pf-files]')`, 15000);
  await fl.ev(`window.__opened = []; window.open = () => ({ opener: 1, close() {}, location: { set href(v) { window.__opened.push(v); } } });`);
  check('an entry on the portfolio page shows a "Files" block with its hint, "Add a file" and no file rows', (await fl.text(PFSEL + ' [data-cy-pf-files] h6')) === 'Files' && (await fl.exists(PFSEL + ' [data-cy-pf-files="0"]')) && (await fl.text(PFSEL + ' [data-action=file-add]')) === 'Add a file' && !(await fl.exists(PFSEL + ' [data-s=file]')) && (await fl.ev(`document.querySelector('${PFSEL} input[type=file]').getAttribute('accept')`)) === '.png,.jpg,.jpeg,.webp,.pdf', await fl.text(PFSEL));

  console.log('  Adding a PNG, and what is refused');
  await give(fl, PFSEL + ' input[type=file]', [pShot]);
  check('a PNG added to the entry reaches "kept" and a toast says it was added', await fl.until(`document.querySelectorAll('${PFSEL} [data-s=file][data-state=kept]').length === 1`, 20000) && await toastIs(fl, 'File added.', 5000), await fl.text(PFSEL));
  const pfRec = (await pfFiles())[0];
  check('…the entry lists the file in fileIds and the record is "kept", in the portfolio area, with the PNG type, a size and a SHA-256', (await pfFiles()).length === 1 && eq((await pfEntry(PF)).fileIds, [pfRec.id]) && pfRec.name === 'scan-result.png' && pfRec.state === 'kept' && pfRec.area === 'portfolio' && pfRec.type === 'image/png' && pfRec.size === fs.statSync(pShot).size && /^[0-9a-f]{64}$/.test(pfRec.sha256) && !pfRec.deletedOn, [pfRec, await pfEntry(PF)]);
  check('…the stand-in holds it under <account>/portfolio/<id> as an image/png', (await fobjects()).some(o => o.key === `${userA}/portfolio/${pfRec.id}` && o.type === 'image/png'), await fobjects());
  check('…and the row shows its name and its type and size ("Photo")', (await fl.text(PFSEL + ' [data-s=file]')).includes('scan-result.png') && /Photo · \d+ KB/.test(await fl.text(PFSEL + ' [data-s=file]')) && (await fl.exists(PFSEL + ` [data-cy-pf-files="1"]`)), await fl.text(PFSEL + ' [data-s=file]'));
  const pfBefore = JSON.stringify(await pfFiles()), pfObjects = (await fobjects()).length;
  await give(fl, PFSEL + ' input[type=file]', [pTxt]);
  check('a .txt file is refused with the portfolio\'s message, and nothing is added or stored', await fl.until(`!!document.querySelector('${PFSEL} [data-s=file-refused]')`, 8000) && (await pfRefused()).includes('notes.txt') && (await pfRefused()).includes('Only PNG, JPEG, WebP and PDF, up to 2 MB each.') && JSON.stringify(await pfFiles()) === pfBefore && (await fobjects()).length === pfObjects && eq((await pfEntry(PF)).fileIds, [pfRec.id]), [await pfRefused(), await pfFiles()]);
  check('…the refusal is announced as an alert', (await fl.ev(`document.querySelector('${PFSEL} [data-s=file-refused]').getAttribute('role')`)) === 'alert');
  await give(fl, PFSEL + ' input[type=file]', [pSvg]);
  check('an SVG is refused with the same message, and nothing is added or stored', await fl.until(`/diagram\\.svg/.test(document.querySelector('${PFSEL} [data-s=file-refused]')?.textContent || '')`, 8000) && (await pfRefused()).includes('Only PNG, JPEG, WebP and PDF, up to 2 MB each.') && JSON.stringify(await pfFiles()) === pfBefore && (await fobjects()).length === pfObjects, [await pfRefused(), await pfFiles()]);
  await give(fl, PFSEL + ' input[type=file]', [pBig]);
  check('a PNG just over 2 MB is refused with the same message, and nothing is added or stored', await fl.until(`/huge-screenshot\\.png/.test(document.querySelector('${PFSEL} [data-s=file-refused]')?.textContent || '')`, 8000) && (await pfRefused()).includes('Only PNG, JPEG, WebP and PDF, up to 2 MB each.') && JSON.stringify(await pfFiles()) === pfBefore && (await fobjects()).length === pfObjects, [await pfRefused(), await pfFiles()]);

  console.log('  Opening keeps a copy on this device');
  check('before it is opened there is no copy of the file in this device\'s IndexedDB', !(await cachedIds() || []).includes(pfRec.id), await cachedIds());
  await fl.click(PFSEL + ` [data-s=file][data-id="${pfRec.id}"] [data-action=file-open]`);
  check('Open opens a new tab on a blob: link', await fl.until(`window.__opened.length === 1`, 10000) && (await fl.ev('window.__opened[0]')).startsWith('blob:'), await fl.ev('window.__opened'));
  check('…and keeps a copy under the file\'s id in IndexedDB (database "myday-files", store "bytes")', await cloudUntil(async () => (await cachedIds() || []).includes(pfRec.id), 8000), await cachedIds());
  const kept = await cachedBytes(pfRec.id);
  check('…and the copy is the PNG as uploaded, byte for byte', !!kept && kept.type === 'image/png' && Buffer.from(kept.bytes).equals(fs.readFileSync(pShot)), kept && [kept.type, kept.bytes.length]);
  const getsBefore = (await ctl('files-log')).length;
  await fl.click(PFSEL + ` [data-s=file][data-id="${pfRec.id}"] [data-action=file-open]`);
  await fl.until(`window.__opened.length === 2`, 10000);
  check('opening it again uses the copy on the device: no new request to the files function', (await fl.ev('window.__opened.length')) === 2 && (await ctl('files-log')).length === getsBefore, [getsBefore, (await ctl('files-log')).length]);

  console.log('  Exporting the portfolio');
  for (const f of fs.readdirSync(fl.dir)) fs.rmSync(path.join(fl.dir, f), { force: true, recursive: true });
  await fl.click('[data-action=cy-pf-export]');
  let zipName = ''; for (let i = 0; i < 60 && !zipName; i++) { await sleep(150); zipName = fs.readdirSync(fl.dir).find(f => f.endsWith('.zip')) || ''; }
  await sleep(300);
  const zipBuf = zipName ? fs.readFileSync(path.join(fl.dir, zipName)) : Buffer.alloc(0);
  const zipFiles = {}; for (let p = 0; p + 30 <= zipBuf.length && zipBuf.readUInt32LE(p) === 0x04034b50;) { const size = zipBuf.readUInt32LE(p + 18), nl = zipBuf.readUInt16LE(p + 26), xl = zipBuf.readUInt16LE(p + 28), at = p + 30 + nl + xl; zipFiles[zipBuf.toString('utf8', p + 30, p + 30 + nl)] = zipBuf.subarray(at, at + size); p = at + size; }
  check('Export portfolio downloads "MyDay Cybersecurity portfolio <date>.zip"', /^MyDay Cybersecurity portfolio \d{4}-\d\d-\d\d\.zip$/.test(zipName) && zipBuf.subarray(0, 2).toString() === 'PK', [zipName, zipBuf.length]);
  const pageHtml = zipFiles['portfolio/index.html'] ? zipFiles['portfolio/index.html'].toString('utf8') : '';
  check('…the zip holds portfolio/index.html with the entry and a link to files/01/1-scan-result.png', pageHtml.includes('Reading a scan result') && pageHtml.includes('href="files/01/1-scan-result.png"'), Object.keys(zipFiles));
  check('…and the file at portfolio/files/01/1-scan-result.png is byte-identical to what was uploaded', !!zipFiles['portfolio/files/01/1-scan-result.png'] && Buffer.from(zipFiles['portfolio/files/01/1-scan-result.png']).equals(fs.readFileSync(pShot)), Object.keys(zipFiles));

  console.log('  At most five files');
  const four = ['b', 'c', 'd', 'e'].map((x, i) => pngNamed(`scan-${x}.png`, i + 2));
  await give(fl, PFSEL + ' input[type=file]', four);
  check('four more PNGs make five files, all kept', await fl.until(`document.querySelectorAll('${PFSEL} [data-s=file][data-state=kept]').length === 5`, 30000) && (await pfFiles()).length === 5 && (await pfEntry(PF)).fileIds.length === 5, await fl.text(PFSEL));
  check('with five files the "Add a file" button is gone', !(await fl.exists(PFSEL + ' [data-action=file-add]')) && (await fl.exists(PFSEL + ' [data-cy-pf-files="5"]')), await fl.text(PFSEL));
  // (Previews of the photos are stored a moment after the photos are kept: take the count once it has stopped changing.)
  let fiveObjects = (await fobjects()).length;
  for (let steady = 0, t0 = Date.now(); steady < 3 && Date.now() - t0 < 20000; await sleep(300)) { const n = (await fobjects()).length; if (n === fiveObjects) steady++; else { steady = 0; fiveObjects = n; } }
  const five = JSON.stringify(await pfFiles());
  await give(fl, PFSEL + ' input[type=file]', [pngNamed('scan-extra.png', 9)]);
  check('choosing another file anyway is refused with "An entry keeps at most 5 files: one wasn’t added." and nothing is added or stored', await fl.until(`!!document.querySelector('${PFSEL} [data-s=file-refused]')`, 8000) && (await pfRefused()).includes('An entry keeps at most 5 files: one wasn’t added.') && JSON.stringify(await pfFiles()) === five && (await fobjects()).length === fiveObjects && (await pfEntry(PF)).fileIds.length === 5, [await pfRefused(), (await pfFiles()).length]);

  console.log('  Remove and Put back');
  await fl.click(PFSEL + ` [data-s=file][data-id="${pfRec.id}"] [data-action=file-remove]`);
  check('Remove says it is in Recently deleted for 30 days', await toastIs(fl, 'Removed — it’s in Recently deleted for 30 days.', 5000), await fl.text('#toast'));
  const gone = (await pfFiles()).find(f => f.id === pfRec.id);
  check('…the row leaves the entry and waits under that entry\'s "Recently deleted (1)", with deletedOn and removedFrom the entry', !(await fl.exists(PFSEL + ` [data-s=file][data-id="${pfRec.id}"]`)) && (await fl.text(PFSEL + ' [data-s=files-deleted] summary')).includes('Recently deleted (1)') && (await fl.text(PFSEL + ' [data-s=files-deleted]')).includes('scan-result.png') && /^\d{4}-\d\d-\d\d$/.test(gone.deletedOn) && eq(gone.removedFrom, { kind: 'portfolio', id: PF }) && (await fl.exists(PFSEL + ' [data-cy-pf-files="4"]')) && (await fl.exists(PFSEL + ' [data-action=file-add]')), [gone, await fl.text(PFSEL)]);
  check('…and its stored bytes are still there', (await fobjects()).some(o => o.key === `${userA}/portfolio/${pfRec.id}`));
  await fl.click(PFSEL + ' [data-action=file-put-back]');
  check('Put back returns it to the entry as kept, out of Recently deleted, with no deletedOn', await fl.until(`!!document.querySelector('${PFSEL} [data-s=file][data-id="${pfRec.id}"][data-state=kept]') && !document.querySelector('${PFSEL} [data-s=file-deleted]')`, 8000) && !('deletedOn' in (await pfFiles()).find(f => f.id === pfRec.id)) && (await pfEntry(PF)).fileIds.includes(pfRec.id) && (await fl.exists(PFSEL + ' [data-cy-pf-files="5"]')), await fl.text(PFSEL));

  console.log('  Removing the entry');
  await fl.setData(`s => { s.cybersecurity.portfolio.push(${ENTRY(PF2, 'Writing up a lab')}); }`);
  await fl.ev(`location.hash = '#study/cybersecurity/portfolio'`);
  await fl.until(`document.querySelector('${PF2SEL} [data-cy-pf-files]')`, 15000);
  await give(fl, PF2SEL + ' input[type=file]', [pngNamed('lab-write-up.png', 20), pngNamed('lab-diagram.png', 21)]);
  await fl.until(`document.querySelectorAll('${PF2SEL} [data-s=file][data-state=kept]').length === 2`, 25000);
  const idsB = (await pfEntry(PF2)).fileIds.slice();
  await fl.click(PF2SEL + ' [data-action=cy-pf-remove]');
  await fl.until(`document.querySelector('[data-action=dialog-confirm]')`);
  check('Remove on an entry with files asks first and says its 2 files go to Recently deleted for 30 days', /Remove this entry\?/.test(await fl.text('dialog[open]')) && /its 2 files go to Recently deleted for 30 days/.test(await fl.text('dialog[open]')), await fl.text('dialog[open]'));
  await fl.answer(true);
  await fl.until(`!document.querySelector('${PF2SEL}')`, 8000);
  const sentAway = (await pfFiles()).filter(f => idsB.includes(f.id));
  check('removing the entry sends both its files to Recently deleted, from that entry, and leaves the other entry\'s files alone', !(await pfEntry(PF2)) && sentAway.length === 2 && sentAway.every(f => /^\d{4}-\d\d-\d\d$/.test(f.deletedOn) && eq(f.removedFrom, { kind: 'portfolio', id: PF2 })) && (await pfFiles()).filter(f => !idsB.includes(f.id)).every(f => !f.deletedOn) && (await fobjects()).filter(o => idsB.some(i => o.key.endsWith(i))).length >= 2, sentAway);
  check('the portfolio page lists them under "Files from entries you’ve removed", each with its day', await fl.until(`!!document.querySelector('[data-s=files-homeless]')`, 8000) && (await fl.text('[data-s=files-homeless]')).includes('lab-write-up.png') && (await fl.text('[data-s=files-homeless]')).includes('lab-diagram.png') && /Goes for good on/.test(await fl.text('[data-s=files-homeless]')) && (await fl.text('[data-s=files-homeless]')).includes('Files from entries you’ve removed'), await fl.text('[data-s=files-homeless]'));
  check('…with Delete now but no Put back (the entry is gone)', !(await fl.exists('[data-s=files-homeless] [data-action=file-put-back]')) && (await fl.exists('[data-s=files-homeless] [data-action=file-delete-now]')));
  await fl.ev(`location.hash = '#projects'`);
  await fl.until(`document.querySelector('#app h1, #app h2')`, 8000); await sleep(800);
  check('the Projects home does not list them under "Files from deleted projects and notes"', !(await fl.text('#app')).includes('lab-write-up.png') && !(await fl.text('#app')).includes('lab-diagram.png') && !(await fl.exists('[data-s=files-homeless]')), await fl.text('#app'));

  console.log('  Tidying up');
  await ctl('files-reset');
  await fl.open(APP + '#today');
  await fl.setData(`s => { s.files.items = s.files.items.filter(f => f.area !== 'portfolio'); if (s.cybersecurity) delete s.cybersecurity.portfolio; }`);
  check('the portfolio entries and their files are cleared for what follows', (await fl.data()).files.items.every(f => f.area !== 'portfolio') && !((await fl.data()).cybersecurity.portfolio || []).length);


  console.log('\n[19] Delete everything: the true wipe, on two devices of one account (specs/delete-everything.md)');
  const W = { email: 'wipe@example.test', password: 'disposable-pass-wipe' };
  const userW = await S.addUser(db, W.email, W.password);
  const wmac = await T.device('wipe-mac', path.join(dl, 'wipe-mac')), wphone = await T.device('wipe-phone', path.join(dl, 'wipe-phone'));
  const inW = (q, p = []) => sql(q, [userW, ...p]);
  const wrows = async () => (await inW(`select kind, id, deleted from public.sync_records where user_id = $1`)).concat(await inW(`select 'list' as kind, id, false as deleted from public.task_lists where user_id = $1`));
  const wDevice = async (D, name) => { await D.open(APP + '#today'); await signIn(D, W); await D.until(`!document.getElementById('signInGate') && document.getElementById('nav')`, 20000); await synced(D); };
  await ctl('files-reset'); await ctl('backup-reset');
  await wDevice(wmac); await wDevice(wphone);
  check('(test setup: two devices signed in to one fresh account)', (await wmac.exists('#nav')) && (await wphone.exists('#nav')));
  const PJW = 'pjWipeA', N1 = 'ntWipeKeep', N2 = 'ntWipeGone';
  await wmac.setData(`s => { s.projects.items.push({ id: '${PJW}', title: 'Shed to be forgotten', summary: 'Made-up.', stage: 'capture', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${today}T09:00', updatedAt: '${today}T09:00' });
    s.tasks.items.push({ id: 'tkWipe1', title: 'Order the made-up timber', listId: '', category: 'admin', minutes: 15, due: null, time: null, notes: '', done: false, doneOn: null, plannedOn: null, planUid: null, createdAt: '${today}T09:00', postponed: 0, blockers: [], letGoOn: null, projectId: '${PJW}' });
    for (const id of ['${N1}', '${N2}']) s.notes.items.push({ id, categoryId: '', title: 'Note ' + id, text: 'Made-up words.', pinned: false, createdAt: '${today}T09:00', updatedAt: '${today}T09:00' }); }`);
  await synced(wmac);
  await wmac.setData(`s => { s.notes.items = s.notes.items.filter(n => n.id !== '${N2}'); }`);
  await synced(wmac);
  check('(test setup: the account holds the project, the task, a note, and a deletion marker for the deleted note)', await cloudUntil(async () => { const r = await wrows(); return r.some(x => x.kind === 'project' && x.id === PJW) && r.some(x => x.kind === 'note' && x.id === N2 && x.deleted) && r.some(x => x.kind === 'task'); }, 15000), await wrows());
  await wmac.ev(`location.hash = '#projects/p/${PJW}'`); await openFiles(wmac);
  await give(wmac, '#files-project input[type=file]', [ftxt]);
  await wmac.until(`document.querySelectorAll('#files-project [data-s=file][data-state=kept]').length === 1`, 20000);
  await wmac.ev(`location.hash = '#backups'`); await wmac.until(`document.querySelector('[data-action=backup-now]')`, 15000);
  await wmac.click('[data-action=backup-now]'); await toastIs(wmac, 'Backed up.', 10000);
  const wFiles = async () => (await fobjects()).filter(o => o.key.startsWith(userW + '/')), wBackups = async () => (await stored()).filter(o => o.key.startsWith(userW + '/'));
  check('(test setup: a file is in R2 and a backup is in the backup store)', (await wFiles()).length >= 1 && (await wBackups()).length >= 1, [await wFiles(), await wBackups()]);
  await wmac.ev(`localStorage.setItem('myday.sayings', 'off'); localStorage.setItem('myday.focus', JSON.stringify({ on: true })); localStorage.setItem('myday.study.lessonStep', JSON.stringify({ x: 1 })); localStorage.setItem('myday.arabic.slower', '1');`);
  await synced(wphone); await wphone.returnToApp();
  await wphone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).projects.items.some(p => p.id === '${PJW}')`, 25000);
  await wphone.offline(true);
  await changeHere(wphone, `s => { s.projects.items.find(p => p.id === '${PJW}').title = 'Changed on the phone while offline'; s.projects.items.find(p => p.id === '${PJW}').updatedAt = '${today}T11:00'; }`);
  check('(test setup: the phone is offline with one change made and not in the account)', (await wphone.data()).projects.items.find(p => p.id === PJW).title === 'Changed on the phone while offline' && (await inW(`select data from public.sync_records where user_id = $1 and kind = 'project'`)).every(x => x.data.title !== 'Changed on the phone while offline'));

  console.log('  The page');
  await wmac.ev(`location.hash = 'sync'`); await wmac.until(`document.getElementById('syncScreen')`, 10000);
  check('Your account has a "Delete everything" section with an entry button', await wmac.until(`!!document.querySelector('[data-s=wipe-entry]')`, 10000) && (await wmac.text('[data-s=wipe-entry]')).includes('Your sign-in stays.'), await wmac.text('#syncScreen'));
  await wmac.click('[data-action=wipe-open]');
  check('…which opens the page #delete-everything', (await wmac.ev('location.hash')) === '#delete-everything' && await wmac.until(`!!document.querySelector('[data-s=delete-everything]')`, 8000));
  check('the page says what goes and what stays', /on this device, on your other devices and in your account/.test(await wmac.text('[data-s=delete-everything]')) && /Your sign-in stays/.test(await wmac.text('[data-s=delete-everything]')) && /can’t be undone/.test(await wmac.text('[data-s=delete-everything]')));
  const goOff = () => wmac.ev(`document.querySelector('[data-action=wipe-go]').disabled`);
  check('Delete everything is disabled until the phrase is typed', await goOff());
  await wmac.type('#wipePhrase', 'delete');
  check('"delete" alone keeps it disabled; "delete everything!" too', await goOff() && (await wmac.type('#wipePhrase', 'delete everything!'), await goOff()));
  await wmac.type('#wipePhrase', '  Delete EVERYTHING  ');
  check('the phrase counts ignoring capitals and spaces at the ends', !(await goOff()));
  await wmac.type('#wipePhrase', '');
  for (const f of fs.readdirSync(wmac.dir)) fs.unlinkSync(path.join(wmac.dir, f));
  await wmac.click('[data-action=wipe-export]'); await sleep(1500);
  const wexp = JSON.parse(wmac.lastDownload() || '{}');
  check('"Download a copy first" saves the same file as Export my data', wexp.format === 'myday-export' && eq(withoutSaves(wexp.data), withoutSaves(await wmac.data())), Object.keys(wexp));
  await wmac.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 2, mobile: true });
  await wmac.open(APP + '#delete-everything'); await wmac.until(`document.querySelector('[data-s=delete-everything]')`, 15000); await sleep(300);
  check('phone 320 px: the page does not scroll sideways, and its buttons and field are at least 44 px tall', (await wmac.ev('document.documentElement.scrollWidth')) <= 320 && (await wmac.ev(`[...document.querySelectorAll('[data-s=delete-everything] button, [data-s=delete-everything] input')].every(b => b.getBoundingClientRect().height >= 44)`)), [await wmac.ev('document.documentElement.scrollWidth'), await wmac.ev(`[...document.querySelectorAll('[data-s=delete-everything] button, [data-s=delete-everything] input')].map(b => Math.round(b.getBoundingClientRect().height))`)]);
  await wmac.send('Emulation.clearDeviceMetricsOverride');

  console.log('  Offline: nothing is deleted');
  await wmac.offline(true);
  await wmac.type('#wipePhrase', 'delete everything'); await wmac.click('[data-action=wipe-go]');
  check('offline, the page says it needs a connection and that nothing was deleted', await wmac.until(`!!document.querySelector('[data-s=wipe-problem]')`, 15000) && /needs a connection/.test(await wmac.text('[data-s=wipe-problem]')) && /Nothing was deleted/.test(await wmac.text('[data-s=wipe-problem]')), await wmac.text('[data-s=delete-everything]'));
  await wmac.offline(false);
  check('…and nothing is deleted anywhere: the account, R2, the backups and this device all still hold it', (await wrows()).some(x => x.kind === 'project') && (await wFiles()).length >= 1 && (await wBackups()).length >= 1 && (await wmac.data()).projects.items.some(p => p.id === PJW), await wrows());

  console.log('  Delete everything on the first device');
  await wmac.ev(`location.hash = '#today'`);
  await wmac.ev(`location.hash = '#delete-everything'`); await wmac.until(`document.querySelector('[data-action=wipe-go]')`, 8000);
  await wmac.ev(`sessionStorage.clear(); new MutationObserver(() => { if (document.querySelector('[data-s=wipe-steps]')) sessionStorage.setItem('sawSteps', '1'); if (document.getElementById('signInGate') || /Getting your MyDay/.test(document.body.textContent)) sessionStorage.setItem('sawGate', '1'); }).observe(document.body, { childList: true, subtree: true, characterData: true });`);
  await wmac.type('#wipePhrase', ' Delete Everything '); await wmac.click('[data-action=wipe-go]');
  check('the page reloads to Today with the notice "Everything was deleted."', await wmac.until(`!!document.querySelector('[data-s=wiped-notice]') && location.hash === '#today'`, 30000) && /Everything was deleted\./.test(await wmac.text('[data-s=wiped-notice]')) && !/another device/.test(await wmac.text('[data-s=wiped-notice]')), await wmac.text('#app'));
  check('while it ran the page stayed up with the steps showing, and no sign-in or "Getting your MyDay" screen came between', (await wmac.ev(`sessionStorage.getItem('sawSteps')`)) === '1' && (await wmac.ev(`sessionStorage.getItem('sawGate')`)) === null, [await wmac.ev(`sessionStorage.getItem('sawSteps')`), await wmac.ev(`sessionStorage.getItem('sawGate')`)]);
  const wmd = await wmac.data();
  check('this device\'s data is a fresh start: no projects, notes, tasks or files of yours, and the starter lists are back', wmd.projects.items.length === 0 && wmd.notes.items.length === 0 && wmd.tasks.items.length === 0 && wmd.files.items.length === 0 && wmd.lists.admin.length > 0, [wmd.projects.items.length, wmd.notes.items.length]);
  const wkeys = await wmac.ev(`Object.keys(localStorage).filter(k => k.startsWith('myday.')).sort()`);
  check('every device-only key but the sign-in, sync\'s notes, the data and the notice is gone (sayings, Focus, the lesson step, the Arabic choice, the backup schedule)', wkeys.every(k => ['myday.sync.auth', 'myday.sync.v1', 'myday.data.v4', 'myday.wiped'].includes(k)) && wkeys.includes('myday.sync.auth') && !wkeys.includes('myday.sayings') && !wkeys.includes('myday.focus') && !wkeys.includes('myday.wipe.pending'), wkeys);
  check('this device is still signed in and, after rejoining the account, shows saved', (await wmac.exists('#nav')) && !(await wmac.exists('#signInGate')) && await statusIs(wmac, 'synced', 30000), await diag(wmac));
  const waft = await wrows();
  check('the account holds nothing from before: no project, task, note or deletion marker', !waft.some(x => ['project', 'task', 'note'].includes(x.kind)) && !waft.some(x => x.deleted) && !waft.some(x => x.id === PJW || x.id === N1 || x.id === N2), waft.map(x => `${x.kind}:${x.id}`));
  check('the account\'s wipe epoch moved on', Number((await sql(`select epoch from public.sync_accounts where user_id = $1`, [userW]))[0].epoch) === 1);
  check('the file is gone from R2 and the backup from the backup store', (await wFiles()).length === 0 && (await wBackups()).length === 0, [await wFiles(), await wBackups()]);

  console.log('  The other device clears itself');
  await wphone.offline(false);
  await wphone.returnToApp();
  check('at its next sync the phone reloads, says "Everything was deleted from another device on …", and starts fresh', await wphone.until(`!!document.querySelector('[data-s=wiped-notice]')`, 40000) && /Everything was deleted from another device on /.test(await wphone.text('[data-s=wiped-notice]')), await wphone.text('#app'));
  const wpd2 = await wphone.data();
  check('…its data is fresh, and the change it made offline is gone', wpd2.projects.items.length === 0 && wpd2.notes.items.length === 0 && !JSON.stringify(wpd2).includes('Changed on the phone while offline'));
  check('…and it is still signed in', (await wphone.exists('#nav')) && !(await wphone.exists('#signInGate')) && await statusIs(wphone, 'synced', 30000), await diag(wphone));
  await sleep(1500);
  const waft2 = await wrows();
  check('nothing of the phone\'s old copy reaches the account: no project, no offline change, no deletion marker', !waft2.some(x => ['project', 'task', 'note'].includes(x.kind)) && !waft2.some(x => x.deleted) && !JSON.stringify(await inW(`select data from public.sync_records where user_id = $1`)).includes('Changed on the phone while offline'));
  check('…and the first device did not get the old project back either', (await wmac.data()).projects.items.length === 0);
  await wphone.click('[data-action=wiped-dismiss]');
  check('OK hides the notice', !(await wphone.exists('[data-s=wiped-notice]')));
  await wphone.open(APP + '#today'); await wphone.until(`document.getElementById('nav')`, 15000); await sleep(500);
  check('…and it stays hidden after a reload', !(await wphone.exists('[data-s=wiped-notice]')) && (await wphone.ev(`localStorage.getItem('myday.wiped')`)) === null);

  console.log('  When files cannot be deleted yet');
  await wmac.ev(`location.hash = '#today'`); await wmac.until(`!!document.querySelector('[data-s=wiped-notice] [data-action=wiped-dismiss]')`, 8000); await wmac.click('[data-s=wiped-notice] [data-action=wiped-dismiss]');
  await wmac.setData(`s => { s.projects.items.push({ id: 'pjWipeB', title: 'Second shed', summary: '', stage: 'capture', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${today}T09:00', updatedAt: '${today}T09:00' }); }`);
  await synced(wmac);
  await wmac.ev(`location.hash = '#projects/p/pjWipeB'`); await openFiles(wmac);
  await give(wmac, '#files-project input[type=file]', [fnote]);
  await wmac.until(`document.querySelectorAll('#files-project [data-s=file][data-state=kept]').length === 1`, 20000);
  await ctl('files-fail', { action: 'delete-all', times: 1 });
  await wmac.ev(`location.hash = '#delete-everything'`); await wmac.until(`document.querySelector('[data-action=wipe-go]')`, 8000);
  await wmac.type('#wipePhrase', 'delete everything'); await wmac.click('[data-action=wipe-go]');
  check('the data is deleted and the notice says the files could not be deleted yet', await wmac.until(`!!document.querySelector('[data-s=wiped-notice]')`, 30000) && /Everything was deleted\./.test(await wmac.text('[data-s=wiped-notice]')) && /Your files couldn’t be deleted yet/.test(await wmac.text('[data-s=wiped-notice]')), [await wmac.text('[data-s=wiped-notice]'), await ctl('files-log'), await wmac.ev(`localStorage.getItem('myday.wipe.pending')`)]);
  check('…the device remembers what is left to do (myday.wipe.pending), the account is empty, and the file is still stored for now', eq(JSON.parse(await wmac.ev(`localStorage.getItem('myday.wipe.pending')`)), { user: userW, left: ['files'] }) && (await wmac.data()).projects.items.length === 0 && (await wFiles()).length >= 1, [await wmac.ev(`localStorage.getItem('myday.wipe.pending')`), await wFiles()]);
  check('the page shows what is left to delete, for this account', (await wmac.ev(`location.hash = '#delete-everything'; true`)) && await wmac.until(`!!document.querySelector('[data-s=wipe-pending]')`, 8000));
  const X = { email: 'wipe-other@example.test', password: 'disposable-pass-other' };
  const userX = await S.addUser(db, X.email, X.password);
  await ctl('files-put', { key: `${userX}/project/flotheracct01`, size: 1234, type: 'application/pdf' });
  await goSync(wmac);
  await wmac.click('#syncScreen [data-action=sync-signout]');
  await wmac.until(`document.querySelector('dialog[open]')`); await wmac.answer(true);
  await wmac.until(`document.getElementById('signInGate')`, 15000);
  await signIn(wmac, X);
  await wmac.until(`!document.getElementById('signInGate') && document.getElementById('nav')`, 20000);
  const delAllBefore = (await ctl('files-log')).filter(l => /delete-all/.test(l)).length;
  const leftAfterSignOut = await wmac.ev(`localStorage.getItem('myday.wipe.pending')`);
  await wmac.open(APP + '#today'); await wmac.until(`document.getElementById('nav')`, 15000);
  await sleep(14000);
  check('signed in as another account, the pending deletion is not run: nothing of theirs is deleted and no delete-all is sent', (await fobjects()).some(o => o.key === `${userX}/project/flotheracct01`) && (await ctl('files-log')).filter(l => /delete-all/.test(l)).length === delAllBefore, [await fobjects(), leftAfterSignOut]);
  await wmac.ev(`location.hash = '#delete-everything'`); await sleep(500);
  check('…and the "couldn’t be deleted yet" line is not shown to them, on the notice or on the page', !(await wmac.exists('[data-s=wipe-pending]')) && !/couldn’t be deleted yet/.test(await wmac.text('#app')), await wmac.text('#app'));
  await wmac.ev(`location.hash = 'sync'`); await wmac.until(`document.getElementById('syncScreen')`, 10000);
  await wmac.click('#syncScreen [data-action=sync-signout]');
  await wmac.until(`document.querySelector('dialog[open]')`); await wmac.answer(true);
  await wmac.until(`document.getElementById('signInGate')`, 15000);
  await signIn(wmac, W);
  await wmac.until(`!document.getElementById('signInGate') && document.getElementById('nav')`, 25000);
  check('(test setup: signed back in as the first account, its pending deletion is still noted)', (await wmac.ev(`localStorage.getItem('myday.wipe.pending')`)) !== null || (await wFiles()).length === 0, await wmac.ev(`localStorage.getItem('myday.wipe.pending')`));
  await wmac.ev(`location.hash = '#today'`);
  await wmac.click('[data-s=wiped-notice] [data-action=wipe-retry]');
  check('Try again deletes the files once the store works: nothing is pending and R2 is empty', await wmac.until(`localStorage.getItem('myday.wipe.pending') === null`, 15000) && (await wFiles()).length === 0 && !(await wmac.exists('[data-s=wiped-notice] [data-action=wipe-retry]')), [await wmac.ev(`localStorage.getItem('myday.wipe.pending')`), await wFiles()]);


  console.log('  A database restored from before a wipe');
  await sql(`update public.sync_accounts set epoch = 0 where user_id = $1`, [userW]);
  const logN = srv.log.length;
  await wmac.returnToApp(); await wmac.ev(`location.hash = 'sync'`);
  check('an account whose wipe epoch is below the device\'s shows a problem (trying again later) instead of looping', await wmac.until(`/restored from before Delete everything/.test(document.querySelector('#syncScreen')?.textContent || '') && /Trying again at/.test(document.querySelector('#syncScreen')?.textContent || '')`, 25000) && (await wmac.status()) !== 'synced', await diag(wmac));
  check('…and it explains why: "Your account\'s records are older than this device\'s (it was restored from before Delete everything)."', /older than this device/.test(await wmac.text('#syncScreen')), await wmac.text('#syncScreen'));
  await sleep(4000);
  check('…and does not hammer the account: only a few reads of its state meanwhile', srv.log.slice(logN).filter(e => e.path === '/rest/v1/rpc/sync_state').length <= 4, srv.log.slice(logN).filter(e => e.path === '/rest/v1/rpc/sync_state').length);
  await sql(`update public.sync_accounts set epoch = 1 where user_id = $1`, [userW]);


  console.log('\n[19b] Two devices rejoining a wiped account at the same moment end in step (no conflict over starter records)');
  {
    const RACE = { email: 'wipe-race@example.test', password: 'disposable-pass-race' };
    const userG = await S.addUser(db, RACE.email, RACE.password);
    const gA = await T.device('race-a', path.join(dl, 'race-a')), gB = await T.device('race-b', path.join(dl, 'race-b'));
    for (const D of [gA, gB]) { await D.open(APP + '#today'); await signIn(D, RACE); await D.until(`!document.getElementById('signInGate') && document.getElementById('nav')`, 20000); await synced(D); }
    check('(test setup: two devices of one fresh account, both in step)', (await gA.status()) === 'synced' && (await gB.status()) === 'synced');
    const cats = async D => (await D.data()).notes.categories.map(c => c.name);
    const confl = async D => Object.keys(((await D.notes()) || {}).link?.conflicts || {});
    let lastRound = null;
    for (let round = 1; round <= 3; round++) {
      await S.as(db, userG, q => q('select public.sync_wipe($1::uuid)', [userG]));
      // Both pages are reloaded at once: each hears of the wipe and rejoins the empty account together.
      await Promise.all([gA.ev(`location.reload()`), gB.ev(`location.reload()`)]);
      const ok = await Promise.all([gA, gB].map(D => D.until(`!!document.querySelector('[data-s=wiped-notice]')`, 40000)));
      await Promise.all([gA, gB].map(D => synced(D, 30000)));
      lastRound = { round, notice: ok, status: [await gA.status(), await gB.status()], conflicts: [await confl(gA), await confl(gB)], same: eq(await cats(gA), await cats(gB)) };
      check(`round ${round}: both devices cleared themselves, and end synced with no conflicts and the same note categories`, ok.every(Boolean) && eq(lastRound.status, ['synced', 'synced']) && lastRound.conflicts.every(c => c.length === 0) && lastRound.same, lastRound);
      for (const D of [gA, gB]) { if (await D.exists('[data-action=wiped-dismiss]')) await D.click('[data-action=wiped-dismiss]'); }
    }
    check('the account holds one set of note categories, and each device has exactly it', (await sql(`select count(*)::int as n from public.sync_records where user_id = $1 and kind = 'notes' and id = 'collections'`, [userG]))[0].n === 1 && eq((await sql(`select data from public.sync_records where user_id = $1 and kind = 'notes' and id = 'collections'`, [userG]))[0].data.categories.map(c => c.name), await cats(gA)), await cats(gA));
  }

  console.log('\n[20] A project\'s research reaches the other device, and goes with the project (specs/projects-research.md)');
  const RS = { email: 'research@example.test', password: 'disposable-pass-research' };
  const userR = await S.addUser(db, RS.email, RS.password);
  const rmac = await T.device('research-mac', path.join(dl, 'research-mac')), rphone = await T.device('research-phone', path.join(dl, 'research-phone'));
  const rrows = async () => sql(`select id, kind, deleted from public.sync_records where user_id = $1 and kind = 'research'`, [userR]);
  for (const D of [rmac, rphone]) { await D.open(APP + '#today'); await signIn(D, RS); await D.until(`!document.getElementById('signInGate') && document.getElementById('nav')`, 20000); await synced(D); }
  const PR = 'pjResSync', RQ = 'rqsyncdev001', RSRC = 'rssyncdev001', RF = 'rfsyncdev001', RF2 = 'rfsyncdev002';
  const stamp0 = `${today}T09:00`;
  await rmac.setData(`s => { s.projects.items.push({ id: '${PR}', title: 'Researching a tea cart', summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '${stamp0}', updatedAt: '${stamp0}', tools: ['research'] });
    s.research.items.push({ id: '${RQ}', type: 'question', projectId: '${PR}', text: 'Do commuters buy tea?', conclusion: '', answeredOn: null, createdAt: '${stamp0}', updatedAt: '${stamp0}' },
      { id: '${RSRC}', type: 'source', projectId: '${PR}', ref: null, title: 'Interview with Priya', from: 'Market stall', on: null, createdAt: '${stamp0}', updatedAt: '${stamp0}' },
      { id: '${RF}', type: 'finding', projectId: '${PR}', text: 'Three of five said yes', limits: 'Small sample', on: '${today}', sourceIds: ['${RSRC}'], about: [{ kind: 'question', id: '${RQ}', stance: 'supports' }], createdAt: '${stamp0}', updatedAt: '${stamp0}' },
      { id: '${RF2}', type: 'finding', projectId: '${PR}', text: 'A second finding', limits: '', on: '${today}', sourceIds: [], about: [], createdAt: '${today}T09:05', updatedAt: '${today}T09:05' }); }`);
  await synced(rmac);
  check('the project and its four research records reach the account (as their own records)', await cloudUntil(async () => (await rrows()).filter(x => !x.deleted).length === 4 && (await sql(`select count(*)::int as n from public.sync_records where user_id = $1 and kind = 'project' and id = $2`, [userR, PR]))[0].n === 1, 20000), await rrows());
  await rphone.returnToApp();
  check('the second device receives them', await rphone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).research.items.length === 4`, 25000), (await rphone.data()).research.items.length);
  await rphone.open(APP + '#projects/p/' + PR + '/research'); await rphone.until(`!!document.querySelector('[data-s=research]')`, 15000);
  check('…and its Research tab shows the question with "Supports (1)", the finding and the source', /Do commuters buy tea\?/.test(await rphone.text('[data-s=research-questions]')) && /Supports \(1\)/.test(await rphone.text('[data-s=research-questions]')) && /Three of five said yes/.test(await rphone.text('[data-s=research-findings]')) && /Interview with Priya/.test(await rphone.text('[data-s=research-sources]')) && (await rphone.exists('[data-tab=research]')), await rphone.text('[data-s=research]'));
  await rphone.click(`[data-s=research-finding][data-id="${RF2}"] [data-action=research-finding-remove]`);
  await rphone.until(`document.querySelector('[data-action=dialog-confirm]')`); await rphone.answer(true);
  check('removing a finding on the phone', await rphone.until(`!JSON.parse(localStorage.getItem('myday.data.v4')).research.items.some(x => x.id === '${RF2}')`, 10000));
  await synced(rphone);
  await rmac.returnToApp();
  check('…reaches the first device (it is gone there too) and the account holds it as a deletion marker', await rmac.until(`!JSON.parse(localStorage.getItem('myday.data.v4')).research.items.some(x => x.id === '${RF2}')`, 25000) && (await rrows()).some(x => x.id === RF2 && x.deleted) && (await rmac.data()).research.items.length === 3, await rrows());
  await rmac.setData(`s => { s.research.items.find(x => x.id === '${RQ}').conclusion = 'Yes, mostly mint.'; s.research.items.find(x => x.id === '${RQ}').answeredOn = '${today}'; s.research.items.find(x => x.id === '${RQ}').updatedAt = '${today}T10:00'; }`);
  await synced(rmac); await rphone.returnToApp();
  check('a change on the first device (the question answered) reaches the second', await rphone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).research.items.find(x => x.id === '${RQ}')?.answeredOn === '${today}'`, 25000));

  console.log('  Deleting the project takes its research with it, on every device');
  await rphone.open(APP + '#projects/p/' + PR); await rphone.until(`!!document.querySelector('[data-action=project-delete]')`, 15000);
  await rphone.click('[data-action=project-delete]'); await rphone.until(`document.querySelector('[data-action=dialog-confirm]')`); await rphone.answer(true);
  check('on the phone the project and its research are gone', await rphone.until(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); return !d.projects.items.some(p => p.id === '${PR}') && !d.research.items.some(x => x.projectId === '${PR}'); })()`, 10000));
  await synced(rphone);
  check('the account holds the project as deleted and no live research', await cloudUntil(async () => (await rrows()).every(x => x.deleted) && (await sql(`select deleted from public.sync_records where user_id = $1 and kind = 'project' and id = $2`, [userR, PR]))[0]?.deleted === true, 20000), await rrows());
  await rmac.returnToApp();
  check('the first device drops the project and its research too, and sends nothing back to the account', await rmac.until(`(() => { const d = JSON.parse(localStorage.getItem('myday.data.v4')); return !d.projects.items.some(p => p.id === '${PR}') && !d.research.items.some(x => x.projectId === '${PR}'); })()`, 25000) && await synced(rmac) && (await rrows()).every(x => x.deleted), [await rrows(), (await rmac.data()).research.items.length]);
  console.log('\n[21] Cybersecurity lesson states between two devices (no path in the roadmap): cyber_lesson records');
  const E = { email: 'lesson-states@example.test', password: 'disposable-pass-states' };
  const userE = await S.addUser(db, E.email, E.password);
  const emac = await T.device('states-mac', path.join(dl, 'states-mac')), ephone = await T.device('states-phone', path.join(dl, 'states-phone'));
  const CL = 'lesson.learning-evidence', CHASH = `#study/cybersecurity/${CL}`, WORDS = 'NAT versus host-only';
  const same = require('node:util').isDeepStrictEqual;   // key order does not matter
  const lessonRow = async () => (await sql(`select data, deleted from public.sync_records where user_id = $1 and kind = 'cyber_lesson' and id = $2`, [userE, CL]))[0];
  const placeOf = D => D.ev(`document.querySelector('[data-cy-place]')?.dataset.cyPlace ?? null`);
  const placeIs = (D, st, ms = 20000) => D.until(`document.querySelector('[data-cy-place]')?.dataset.cyPlace === '${st}'`, ms);
  const showLesson = async D => { await D.ev(`location.hash = 'sync'`); await sleep(150); await D.ev(`location.hash = '${CHASH}'`); };
  for (const D of [emac, ephone]) { await D.open(APP + '#today'); await signIn(D, E); await D.until(`!document.getElementById('signInGate') && document.getElementById('nav')`, 20000); await synced(D); }
  const eToday = await emac.today();
  await showLesson(emac); await showLesson(ephone);
  await Promise.all([emac.until(`!!document.querySelector('[data-cy-place]')`, 20000), ephone.until(`!!document.querySelector('[data-cy-place]')`, 20000)]);
  check('(test setup: two devices signed in to one fresh account, no path in the roadmap, both showing the lesson as "new")', (await placeOf(emac)) === 'new' && (await placeOf(ephone)) === 'new' && !(await emac.data()).study.stages.length && !(await ephone.data()).study.stages.length && !(await lessonRow()));

  console.log('  Ready to move on');
  await emac.click('[data-action=cy-place-ready]');
  check('marking the lesson ready on the Mac sends a cyber_lesson record with its id and today as the Ready day', await cloudUntil(async () => { const r = await lessonRow(); return !!r && !r.deleted && same(r.data, { id: CL, readyOn: eToday }); }) && await synced(emac), await lessonRow());
  await ephone.returnToApp();
  check('the phone shows the lesson as ready', await placeIs(ephone, 'ready'), await placeOf(ephone));
  check('…with the lesson record in its saved data exactly as sent, and the lesson\'s 2 checks in its revision too', same((await ephone.data()).cybersecurity.lessons, [{ id: CL, readyOn: eToday }]) && (await ephone.data()).cybersecurity.cards.length === 2 && /^Ready to move on since/.test(await ephone.text('[data-cy-place] p')), [(await ephone.data()).cybersecurity.lessons, await ephone.text('[data-cy-place] p')]);

  console.log('  Needs revision, with your words');
  await ephone.click('[data-action=cy-place-revisit]');
  await ephone.until(`!!document.querySelector('#cyRevisitWhat')`, 8000);
  await ephone.type('#cyRevisitWhat', WORDS); await ephone.click('[data-action=cy-revisit-save]');
  check('flagging the lesson on the phone with those words updates the same record, which keeps the Ready day', await cloudUntil(async () => { const r = await lessonRow(); return !!r && !r.deleted && same(r.data, { id: CL, readyOn: eToday, revisit: { since: eToday, what: WORDS } }); }) && await synced(ephone), await lessonRow());
  await emac.returnToApp();
  check('the Mac shows the lesson as needing revision, in the phone\'s words', await placeIs(emac, 'needs-revision') && (await emac.text('[data-cy-place] p')).startsWith('Needs revision: ' + WORDS + '.'), await emac.text('[data-cy-place]'));
  check('…and holds the flag in its saved data exactly as sent', same((await emac.data()).cybersecurity.lessons, [{ id: CL, readyOn: eToday, revisit: { since: eToday, what: WORDS } }]));

  console.log('  Done revisiting');
  await emac.click('[data-action=cy-place-revisited]');
  check('"Done revisiting" on the Mac sends the record without the flag', await cloudUntil(async () => { const r = await lessonRow(); return !!r && !r.deleted && same(r.data, { id: CL, readyOn: eToday }); }) && await synced(emac), await lessonRow());
  await ephone.returnToApp();
  check('the phone shows the lesson as ready again, without the flag', await placeIs(ephone, 'ready') && same((await ephone.data()).cybersecurity.lessons, [{ id: CL, readyOn: eToday }]), [await placeOf(ephone), (await ephone.data()).cybersecurity.lessons]);

  console.log('  Not ready after all');
  await ephone.click('[data-action=cy-place-unready]');
  check('"Not ready after all" on the phone leaves a deletion marker for cyber_lesson:' + CL + ' in the account', await cloudUntil(async () => !!(await lessonRow())?.deleted) && await synced(ephone), await lessonRow());
  await emac.returnToApp();
  check('the Mac shows the lesson as new again, with no lesson records of its own', await placeIs(emac, 'new') && !((await emac.data()).cybersecurity.lessons || []).length, [await placeOf(emac), (await emac.data()).cybersecurity.lessons]);
  check('…while the 2 checks stay in revision on both devices (taking a lesson back does not remove them)', (await emac.data()).cybersecurity.cards.length === 2 && (await ephone.data()).cybersecurity.cards.length === 2);
  check('the account holds exactly one cyber_lesson row for this account, and it is a deletion marker', (await sql(`select deleted from public.sync_records where user_id = $1 and kind = 'cyber_lesson'`, [userE])).map(r => r.deleted).join() === 'true');

  fs.rmSync(dl, { recursive: true, force: true });
  await srv.close();
  const { pass, fail } = summary();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('HARNESS:', e); process.exit(2); });
