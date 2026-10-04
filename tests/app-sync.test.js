// Cloud sync in the new app, end to end: two devices (a "Mac" and a "phone", each its own browser profile)
// using a copy of MyDay built with sync switched on, against the Supabase stand-in (supabase-standin.js: the
// real database migrations in PostgreSQL, behind an imitation of Supabase's Auth and Data API).
// Every account and record here is disposable test data. This is NOT a test against a real Supabase project.
const fs = require('fs');
const path = require('path');
const os = require('os');
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

let srv;
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
async function cloudUntil(fn, ms = 10000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(150); } return false; }
const statusIs = (D, s, ms = 12000) => D.until(`document.getElementById('syncBadge') && document.getElementById('syncBadge').dataset.status === '${s}'`, ms);
async function openReview(D) { await D.click('[data-action=sync-review]'); return D.until(`document.getElementById('syncReview')`, 12000); }
const reviewKeys = (D, group) => D.ev(`[...document.querySelectorAll('[data-group=${group}] li[data-key]')].map(e => e.dataset.key).sort()`);
const differKeys = D => D.ev(`[...document.querySelectorAll('#syncReview .review-item')].map(e => e.dataset.key).sort()`);
// Today's screen opens the list editor when it's opened at #today/edit, so come from another screen.
async function openEditor(D) { await D.ev(`location.hash = 'sync'`); await sleep(150); await D.ev(`location.hash = 'today/edit'`); return D.until(`document.querySelector('.edit-row')`); }
async function goToday(D) { await D.ev(`location.hash = 'sync'`); await sleep(150); await D.ev(`location.hash = 'today'`); return D.until(`document.querySelector('#app')`); }
async function editList(D, cat, id, title) {
  const sel = `.edit-row[data-cat=${cat}][data-id="${id}"] input.t`;
  if (!(await D.exists(sel))) { await openEditor(D); await D.until(`document.querySelector('${sel}')`); }
  await D.type(sel, title);
  await sleep(200);
}
const listTitle = (d, cat, id) => { const x = d.lists[cat].find(i => i.id === id); return x ? x.title : null; };
const cloudList = async (cat, user) => (await sql(`select data, version from public.task_lists where user_id = $1 and id = $2`, [user, cat]))[0];

// The parts of MyDay that are one record each (from 1.8.0), as every device has them.
const ONE_KEYS = ['settings:planning', 'rota:rota', 'pay:pay', 'holidays:region', 'finance:finance', 'study:roadmap', 'workout:setup', 'food:kitchen', 'food:shopping', 'fitness:goal', 'notes:collections', 'tasks:lists', 'patterns:patterns'];
const cloudRecord = async (user, kind, id) => (await sql(`select data, version, deleted from public.sync_records where user_id = $1 and kind = $2 and id = $3`, [user, kind, id]))[0];

function task(uid, taskId, category, title, minutes, done = false) {
  return { uid, taskId, category, title, minutes, baseMinutes: minutes, done, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null };
}

(async () => {
  const db = await S.createDb();
  srv = await S.start(db, SUPA);
  srv.db = db;
  const userA = await S.addUser(db, A.email, A.password), userC = await S.addUser(db, C.email, C.password);
  await T.connect();
  const dl = path.join(os.tmpdir(), `myday-sync-dl-${process.pid}`);
  const mac = await T.device('mac', path.join(dl, 'mac')), phone = await T.device('phone', path.join(dl, 'phone'));

  console.log('\n[1] Before signing in, MyDay works as before: everything saved on this device, nothing sent');
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
  check('the status shows "Saved locally" at the top of the screen', (await mac.status()) === 'local' && (await mac.text('#syncBadge')) === 'Saved locally', await mac.text('#syncBadge'));
  check('…and the footer says everything is saved only in this browser', (await mac.text('.storage-note')) === 'Saved only in this browser.');
  check('nothing was sent anywhere (no requests to the cloud)', srv.log.length === 0, srv.log.map(e => e.path));
  check('the sign-in library isn\'t even downloaded until it\'s needed', !(await mac.ev(`performance.getEntriesByType('resource').some(e => /assets\\/dist-/.test(e.name))`)));
  const macBefore = withoutSaves(await mac.data());

  console.log('\n[2] Signing in');
  await signIn(mac, { email: A.email, password: 'wrong-password' });
  await mac.until(`document.getElementById('signinError')`);
  check('a wrong password gets a friendly message', (await mac.text('#signinError')).includes("don't match an account"), await mac.text('#signinError'));
  check('the password field allows password managers (autocomplete) and can be shown', (await mac.ev(`document.getElementById('syncPassword').autocomplete`)) === 'current-password' && (await mac.exists('[data-action=sync-show-password]')));
  await mac.type('#syncPassword', A.password);
  await mac.click('[data-action=sync-signin]');
  check('signed in: the device asks before syncing anything', await phaseIs(mac, 'setup'), await mac.phase());
  check('…offering a backup download first', await mac.exists('#syncScreen [data-action=export]'));
  check('signing in sent and fetched no records', rpcLog().length === 0 && (await sql('select count(*)::int as n from public.task_lists'))[0].n === 0);

  console.log('\n[3] First device: the review before syncing, then the upload');
  await openReview(mac);
  check('the review lists everything this device would send (3 lists, the queue, a plan, a context, and the one-record parts: settings, Calendar, Finance, Study, Health, Inbox…)', eq(await reviewKeys(mac, 'rv-up'), ['context:' + Y, 'day:' + Y, 'list:admin', 'list:health', 'list:learning', 'queue:queue', ...ONE_KEYS].sort()), await reviewKeys(mac, 'rv-up'));
  check('…nothing to download or choose (the account is empty)', (await reviewKeys(mac, 'rv-down')).length === 0 && (await differKeys(mac)).length === 0);
  check('nothing has been sent before confirming', rpcLog().every(e => e.path.endsWith('sync_pull')) && (await sql('select count(*)::int as n from public.task_lists'))[0].n === 0);
  await mac.click('[data-action=review-start]');
  check('after "Start syncing", the device is synced', await statusIs(mac, 'synced'), await mac.status());
  const rowsA = await sql(`select 'list' k, id from public.task_lists where user_id = $1 union all select 'queue', id from public.task_queue where user_id = $1
    union all select 'day', id from public.day_plans where user_id = $1 union all select 'context', id from public.day_context where user_id = $1`, [userA]);
  check('the account now has exactly those 6 records', rowsA.length === 6, rowsA);
  check('…and the 13 one-record parts', eq((await sql(`select kind || ':' || id as k from public.sync_records where user_id = $1 order by 1`, [userA])).map(r => r.k), [...ONE_KEYS].sort()));
  check('…with this device\'s content', (await cloudList('learning', userA)).data.items[0].title === 'Mac: Networking basics');
  check('this device\'s data is unchanged by syncing', eq(withoutSaves(await mac.data()), macBefore));
  await goToday(mac);
  await mac.until(`document.querySelector('.storage-note')`);
  check('the footer says what syncs', (await mac.text('.storage-note')).includes('everything you enter syncs with your account'), await mac.text('.storage-note'));

  console.log('\n[4] Second device with different records: a preview, conflicts named, nothing changed until confirmed');
  await phone.open(APP + '#today');
  await phone.setData(`s => {
    s.lists.admin.push({ id: 'aphone1', title: 'Phone: Renew passport', minutes: 20 });
    s.days['${Y2}'] = { energy: 3, rest: false, builtAt: '${Y2}T09:00', checkedIn: false, tasks: [${JSON.stringify(task('t-ph-1', 'h3', 'health', '20-min walk', 20, true))}] };
    s.context['${Y}'] = { energy: 2, sleep: { start: null, end: null, estimatedHours: 5 } };
  }`);
  const phoneBefore = withoutSaves(await phone.data());
  await signIn(phone, A);
  await phaseIs(phone, 'setup');
  await openReview(phone);
  check('to save here: the Mac\'s plan', eq(await reviewKeys(phone, 'rv-down'), ['day:' + Y]), await reviewKeys(phone, 'rv-down'));
  check('to send: the phone\'s own plan', eq(await reviewKeys(phone, 'rv-up'), ['day:' + Y2]), await reviewKeys(phone, 'rv-up'));
  check('different on each, to choose: learning and admin lists, the queue, the shared day\'s context, and the note collections (same names, made separately)', eq(await differKeys(phone), ['context:' + Y, 'list:admin', 'list:learning', 'notes:collections', 'queue:queue']), await differKeys(phone));
  check('a starter list, an empty queue and the starter note collections on this device suggest the account\'s version (pre-chosen)',
    await phone.ev(`['list:learning','queue:queue','notes:collections'].every(k => document.querySelector('[data-action=review-cloud][data-key="' + k + '"]').getAttribute('aria-pressed') === 'true')`));
  check('the parts that are the same on both (settings, Calendar, Finance, Study, Health…) aren\'t asked about', (await reviewKeys(phone, 'rv-up')).every(k => !ONE_KEYS.includes(k)) && !(await differKeys(phone)).some(k => ONE_KEYS.includes(k) && k !== 'notes:collections'));
  check('Start is blocked until every difference has a choice', await phone.ev(`document.querySelector('[data-action=review-start]').disabled && document.querySelector('[data-action=review-start]').textContent.includes('2 more')`), await phone.text('[data-action=review-start]'));
  check('nothing on the phone or in the account has changed yet', eq(withoutSaves(await phone.data()), phoneBefore) && (await cloudList('admin', userA)).version === 1);
  await phone.click('[data-action=review-here][data-key="list:admin"]');
  await sleep(100);
  await phone.click(`[data-action=review-cloud][data-key="context:${Y}"]`);
  await sleep(100);
  await phone.click('[data-action=review-start]');
  check('after confirming, the phone is synced', await statusIs(phone, 'synced'), await phone.status());
  let pd = await phone.data();
  check('the phone has the Mac\'s learning list and queue (as chosen)', listTitle(pd, 'learning', 'l1') === 'Mac: Networking basics' && pd.queue.some(q => q.qid === 'q-mac-1'));
  check('…keeps its own admin list (as chosen) and its own plan', listTitle(pd, 'admin', 'aphone1') === 'Phone: Renew passport' && !!pd.days[Y2]);
  check('…gets the Mac\'s plan, and the account\'s context for that day (as chosen)', !!pd.days[Y] && pd.days[Y].tasks[0].uid === 't-mac-1' && pd.context[Y].energy === 4);
  check('parts that were already the same on both (e.g. settings, Study, Health) are untouched', eq(pd.settings, phoneBefore.settings) && eq(pd.study, phoneBefore.study) && eq(pd.health, phoneBefore.health));
  let pn = await phone.notes();
  check('the phone\'s replaced versions are kept on the phone (learning list, queue, context, note collections)', eq(pn.kept.map(k => k.key).sort(), ['context:' + Y, 'list:learning', 'notes:collections', 'queue:queue']) && pn.kept.find(k => k.key === 'context:' + Y).content.energy === 2, pn.kept.map(k => k.key));
  await goSync(phone);
  check('…and can be downloaded', await phone.exists('[data-action=kept-download]'));
  check('the account has the phone\'s admin list and plan', (await cloudList('admin', userA)).data.items.some(i => i.id === 'aphone1') && (await sql(`select 1 from public.day_plans where user_id = $1 and id = $2`, [userA, Y2])).length === 1);

  console.log('\n[5] Records created on one device appear on the other');
  await mac.returnToApp();
  await mac.until(`JSON.parse(localStorage.getItem('myday.data.v4')).days['${Y2}']`);
  let md = await mac.data();
  check('coming back to MyDay on the Mac fetches the phone\'s plan and admin list', !!md.days[Y2] && listTitle(md, 'admin', 'aphone1') === 'Phone: Renew passport');
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
  await phone.ev(`location.hash = 'inbox/notes/collections'`);
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
  check('offline, each device keeps its own change ("Saved locally")', listTitle(await mac.data(), 'learning', 'l2') === 'Mac title' && listTitle(await phone.data(), 'learning', 'l2') === 'Phone title' && (await statusIs(phone, 'local', 8000)));
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
  srv.faults.push({ path: '/rest/v1/rpc/sync_push', mode: 'error', times: 1 });
  let v0 = (await cloudList('health', userA)).version;
  await editList(mac, 'health', 'h1', 'Gym (after a failed send)');
  const firstId = (await sent(mac, 'list:health')) && (await mac.notes()).link.out['list:health'].id;
  check('a request the cloud fails: the change stays on the device, shown as "Saved locally"', await statusIs(mac, 'local', 8000) && listTitle(await mac.data(), 'health', 'h1') === 'Gym (after a failed send)');
  check('…noted as on its way, ready to send again with the same id', !!firstId && (await cloudList('health', userA)).version === v0);
  await goSync(mac);
  check('…and the sync screen says it will try again', /saved on this device and will be sent when it can/.test(await mac.text('#syncLine')), await mac.text('#syncLine'));
  await syncNowWhenReady(mac);
  await synced(mac);
  check('trying again saves it once (one new version)', (await cloudList('health', userA)).version === v0 + 1);

  // Two dropped replies: Chrome quietly resends a POST once when a connection closes without an answer, so the
  // first two tries both reach the cloud and get no reply; then MyDay itself tries again.
  srv.faults.push({ path: '/rest/v1/rpc/sync_push', mode: 'drop', times: 2 });
  v0 = (await cloudList('health', userA)).version;
  srv.log.length = 0;
  await editList(mac, 'health', 'h2', 'Meal prep (reply lost)');
  await cloudUntil(async () => (await cloudList('health', userA)).version === v0 + 1); // saved in the cloud…
  await sleep(600);                                                                     // …and the device has given up waiting
  check('a reply that never arrives (saved in the cloud, but the device can\'t tell): the change stays noted', !!(await mac.notes()).link.out['list:health'] && (await mac.status()) === 'local', await diag(mac));
  await syncNowWhenReady(mac);
  await synced(mac);
  const pushes = srv.log.filter(e => e.path === '/rest/v1/rpc/sync_push').map(e => e.body.changes.find(c => c.record_id === 'health')).filter(Boolean);
  check('every retry sent the same change (same id) again', pushes.length >= 3 && pushes.every(p => p.change_id === pushes[0].change_id), pushes.map(p => p.change_id));
  check('…and the cloud applied it once: one new version, one record of the change, no duplicate', (await cloudList('health', userA)).version === v0 + 1 &&
    (await sql('select count(*)::int as n from public.sync_changes where change_id = $1', [pushes[0].change_id]))[0].n === 1 &&
    (await cloudList('health', userA)).data.items.filter(i => i.id === 'h2').length === 1);

  await phone.returnToApp(); await synced(phone); // the phone catches up first (a list is one record: see app/README.md)
  srv.faults.push({ path: '/rest/v1/rpc/sync_push', mode: 'error', times: 99 }, { path: '/rest/v1/rpc/sync_pull', mode: 'error', times: 99 });
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
  srv.faults.push({ path: '/rest/v1/rpc/sync_push', mode: 'delay', ms: 2000, times: 1 });
  await editList(mac, 'learning', 'l3', 'HTB Academy (slow connection)');
  check('on a slow connection the status shows "Syncing" while it works', await statusIs(mac, 'syncing', 8000) && (await mac.text('#syncBadge')) === 'Syncing', await mac.status());
  check('…then "Synced"', await synced(mac));

  console.log('\n[9] Accounts: another account never sees or receives this one\'s records');
  await mac.returnToApp(); await synced(mac);
  await goSync(mac);
  await mac.click('#syncScreen [data-action=sync-signout]');
  check('signing out: "Saved locally", and this device\'s data stays', await statusIs(mac, 'local') && !!(await mac.data()).days[Y]);
  await editList(mac, 'admin', 'a3', 'Clean room (while signed out)');
  await goSync(mac);
  srv.log.length = 0;
  await signIn(mac, C);
  check('signing in to a different account: "Needs attention", explained', await phaseIs(mac, 'other-account') && (await mac.status()) === 'attention');
  await sleep(1500);
  check('…nothing is sent to or fetched from the other account', !srv.log.some(e => e.path.startsWith('/rest/v1/') && e.user === userC) && (await sql('select count(*)::int as n from public.task_lists where user_id = $1', [userC]))[0].n === 0, srv.log.filter(e => e.user === userC).map(e => e.path));
  check('…and this device\'s records are untouched', listTitle(await mac.data(), 'admin', 'a3') === 'Clean room (while signed out)');
  const tA = await token(A), tC = await token(C);
  check('the account\'s own token reads only its own rows', (await (await rest('/rest/v1/task_lists?select=*', tA)).json()).every(r => r.user_id === userA));
  check('another account\'s token reads none of them', (await (await rest('/rest/v1/task_lists?select=*', tC)).json()).length === 0 && (await (await rest('/rest/v1/day_plans?select=*', tC)).json()).length === 0);
  check('another account can\'t change them directly', (await rest(`/rest/v1/task_lists?user_id=eq.${userA}`, tC, { method: 'PATCH', body: JSON.stringify({ data: { items: [] } }) })).status === 403);
  check('…or through sync_pull/sync_push by naming that account', (await rest('/rest/v1/rpc/sync_pull', tC, { method: 'POST', body: JSON.stringify({ account: userA, since: 0 }) })).status === 403 &&
    (await rest('/rest/v1/rpc/sync_push', tC, { method: 'POST', body: JSON.stringify({ account: userA, changes: [] }) })).status === 403);
  check('signed-out visitors (publishable key only) get nothing', (await rest('/rest/v1/task_lists?select=*', null)).status === 401 && (await rest('/rest/v1/rpc/sync_pull', null, { method: 'POST', body: JSON.stringify({ account: userA }) })).status === 401);
  await mac.click('[data-action=sync-signout]');
  await phaseIs(mac, 'signed-out');
  await signIn(mac, A);
  check('signing back in to the right account carries on syncing', await synced(mac), await diag(mac));
  check('…and the change made while signed out is sent', (await cloudList('admin', userA)).data.items.find(i => i.id === 'a3').title === 'Clean room (while signed out)');

  console.log('\n[10] Backups: export stays complete; restoring one is reviewed before anything is sent');
  await phone.returnToApp();
  await phone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).lists.admin.find(i => i.id === 'a3').title === 'Clean room (while signed out)'`);
  await synced(phone);
  await goToday(phone);
  await phone.until(`document.querySelector('[data-action=export]')`);
  for (const f of fs.readdirSync(phone.dir)) fs.unlinkSync(path.join(phone.dir, f));
  await phone.click('[data-action=export]');
  await phone.until(`true`); await sleep(1200);
  const exported = JSON.parse(phone.lastDownload() || '{}');
  pd = await phone.data();
  check('the export holds the whole of the saved data, synced records included', exported.format === 'myday-export' && eq(withoutSaves(exported.data), withoutSaves(pd)));
  check('…every section is there', ['lists', 'queue', 'days', 'context', 'settings', 'rota', 'pay', 'health', 'study'].every(k => k in exported.data));
  exported.data.lists.admin.find(i => i.id === 'a4').title = 'Groceries (from the backup)';
  const file = path.join(phone.dir, 'restore.json');
  fs.writeFileSync(file, JSON.stringify(exported));
  const doc = await phone.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await phone.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#importFile' });
  srv.log.length = 0;
  await phone.send('DOM.setFileInputFiles', { nodeId, files: [file] });
  await phone.until(`document.querySelector('[data-action=dialog-confirm]')`);
  await phone.answer(true);
  await phone.until(`JSON.parse(localStorage.getItem('myday.data.v4')).lists.admin.some(i => i.title === 'Groceries (from the backup)')`);
  check('after restoring a backup, sync waits ("Needs attention") instead of sending it', await statusIs(phone, 'attention') && (await phone.notes()).link.review === 'import');
  await sleep(2500);
  check('…nothing was sent', !srv.log.some(e => e.path === '/rest/v1/rpc/sync_push'));
  await goSync(phone);
  await openReview(phone);
  check('the review shows exactly what the backup changes (the admin list, to send)', eq(await reviewKeys(phone, 'rv-up'), ['list:admin']) && (await differKeys(phone)).length === 0 && (await reviewKeys(phone, 'rv-down')).length === 0, { up: await reviewKeys(phone, 'rv-up'), down: await reviewKeys(phone, 'rv-down'), differ: await differKeys(phone) });
  await phone.click('[data-action=review-start]');
  await synced(phone);
  check('confirming sends it', (await cloudList('admin', userA)).data.items.some(i => i.title === 'Groceries (from the backup)'));
  srv.log.length = 0;
  await mac.setData(`s => { for (let i = 1; i <= 20; i++) { const d = String(i).padStart(2, '0'); s.context['2025-01-' + d] = { energy: 3, sleep: { start: null, end: null, estimatedHours: 7 } }; s.days['2025-02-' + d] = { energy: 3, rest: true, builtAt: '', checkedIn: false, tasks: [] }; } }`);
  check('a lot changed at once (e.g. a backup restored in the classic MyDay): reviewed first, not sent', await statusIs(mac, 'attention') && (await mac.notes()).link.review === 'bulk' && !srv.log.some(e => e.path === '/rest/v1/rpc/sync_push'));

  console.log('\n[11] Moving a device to another account is deliberate, and warned about');
  await goSync(phone);
  await phone.click('[data-action=sync-signout]');
  await phaseIs(phone, 'signed-out');
  await signIn(phone, C);
  await phaseIs(phone, 'other-account');
  srv.log.length = 0;
  await phone.click('[data-action=sync-stop]');
  await phone.until(`document.querySelector('[data-action=dialog-confirm]')`);
  check('stopping syncing explains that nothing is deleted', (await phone.text('[role=dialog], dialog')).includes('nothing is deleted from your account'), await phone.text('[role=dialog], dialog'));
  const phoneData = withoutSaves(await phone.data());
  await phone.answer(true);
  check('after stopping, the phone can be set up for the other account — with its data unchanged', await phaseIs(phone, 'setup') && eq(withoutSaves(await phone.data()), phoneData));
  await openReview(phone);
  check('the review warns that this device\'s records include the previous account\'s', (await phone.text('[data-note=before]')).includes(A.email), await phone.text('[data-note=before]'));
  await phone.click('[data-action=review-cancel]');
  await sleep(500);
  check('choosing "Not now" sends nothing to the other account', !srv.log.some(e => e.path === '/rest/v1/rpc/sync_push') && (await sql('select count(*)::int as n from public.task_lists where user_id = $1', [userC]))[0].n === 0);
  check('…and the first account\'s records in the cloud are untouched', (await cloudList('admin', userA)).data.items.some(i => i.title === 'Groceries (from the backup)'));

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

  fs.rmSync(dl, { recursive: true, force: true });
  await srv.close();
  const { pass, fail } = summary();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('HARNESS:', e); process.exit(2); });
