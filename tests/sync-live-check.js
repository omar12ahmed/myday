// Checks a REAL Supabase project after setting it up for MyDay sync (supabase/README.md, step 5): sign-in,
// Row Level Security, version checks, retries and deletions — for both sync migrations (day plans and the like, and
// sync_records for everything else) — using two DISPOSABLE test accounts only.
//
//   SUPABASE_URL=https://<project-ref>.supabase.co SUPABASE_PUBLISHABLE_KEY=sb_publishable_… \
//   TEST_A_EMAIL=… TEST_A_PASSWORD=… TEST_B_EMAIL=… TEST_B_PASSWORD=… node tests/sync-live-check.js
//
// It uses only the publishable key, exactly like the app. It refuses to run if either test account already has
// MyDay records, so it can never touch a real plan. It leaves a few made-up records in the two test accounts:
// delete the two test users afterwards (Authentication → Users), which deletes their records too.
// (`npm test`-style runs use tests/run.sh with a local stand-in instead; this script is for a real project.)
const { randomUUID } = require('crypto');

const URL_ = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const A = { email: process.env.TEST_A_EMAIL, password: process.env.TEST_A_PASSWORD };
const B = { email: process.env.TEST_B_EMAIL, password: process.env.TEST_B_PASSWORD };
if (!URL_ || !KEY || !A.email || !A.password || !B.email || !B.password) {
  console.log('Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, TEST_A_EMAIL, TEST_A_PASSWORD, TEST_B_EMAIL and TEST_B_PASSWORD (see the top of this file).');
  process.exit(2);
}
if (KEY.startsWith('sb_secret_') || /service_role/.test(Buffer.from(KEY.split('.')[1] || '', 'base64url').toString())) {
  console.log('That is a secret key. Use the publishable key (sb_publishable_…): this check must see exactly what the app sees.');
  process.exit(2);
}

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS', name); } else { fail++; console.log('  FAIL', name, detail !== undefined ? '→ ' + JSON.stringify(detail).slice(0, 300) : ''); }
}
const headers = tok => ({ apikey: KEY, 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) });
async function signIn(u) {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, { method: 'POST', headers: headers(), body: JSON.stringify(u) });
  const j = await r.json();
  if (!r.ok) throw new Error(`Couldn't sign in as ${u.email}: ${j.msg || j.message || j.error_description || r.status}`);
  return { token: j.access_token, id: j.user.id };
}
const rpc = (fn, tok, args) => fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(tok), body: JSON.stringify(args) });
const push = async (who, changes, account = who.id) => (await rpc('sync_push', who.token, { account, changes, device: 'live-check' })).json();
const pull = async (who, since = 0, account = who.id) => (await rpc('sync_pull', who.token, { account, since, max_rows: 1000 })).json();
const change = (kind, record_id, base_version, data, extra = {}) => ({ change_id: randomUUID(), kind, record_id, base_version, deleted: false, data, ...extra });
const day = title => ({ energy: 3, rest: false, builtAt: '2000-01-01T08:00', checkedIn: false, tasks: [{ uid: 'live-check', taskId: null, category: 'admin', title, minutes: 10, baseMinutes: 10, done: false, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null }] });
const DAY = '2000-01-01'; // a date far from any real plan

(async () => {
  console.log(`\nChecking ${URL_} with two disposable test accounts\n`);
  const a = await signIn(A), b = await signIn(B);
  check('both test accounts can sign in with email and password', !!a.token && !!b.token);
  const aRows = await pull(a), bRows = await pull(b);
  if (!Array.isArray(aRows) || !Array.isArray(bRows)) {
    console.log('  FAIL sync_pull isn\'t available — has the migration been applied? →', JSON.stringify(Array.isArray(aRows) ? bRows : aRows));
    process.exit(1);
  }
  if (aRows.length || bRows.length) {
    console.log('  STOP One of the test accounts already has MyDay records. Use two new, disposable test accounts — never your own.');
    process.exit(2);
  }

  console.log('\nOwn records');
  let r = await push(a, [change('day', DAY, 0, day('Live check A'))]);
  check('A can save a record (version 1)', Array.isArray(r) && r[0].status === 'applied' && r[0].version === 1, r);
  const first = await pull(a);
  check('A reads it back', first.length === 1 && first[0].record_id === DAY && first[0].data.tasks[0].title === 'Live check A', first);

  console.log('\nRow Level Security: B never sees or changes A\'s records');
  check('B\'s sync_pull returns nothing of A\'s', (await pull(b)).length === 0);
  const bRead = await (await fetch(`${URL_}/rest/v1/day_plans?select=*`, { headers: headers(b.token) })).json();
  check('B reading the table directly gets no rows', Array.isArray(bRead) && bRead.length === 0, bRead);
  const aRead = await (await fetch(`${URL_}/rest/v1/day_plans?select=*`, { headers: headers(a.token) })).json();
  check('A reading the table directly gets only A\'s rows', Array.isArray(aRead) && aRead.length === 1 && aRead.every(x => x.user_id === a.id), aRead);
  let s = (await fetch(`${URL_}/rest/v1/day_plans?user_id=eq.${a.id}`, { method: 'PATCH', headers: headers(b.token), body: JSON.stringify({ data: { tasks: [] } }) })).status;
  check('B can\'t change A\'s rows directly', s === 401 || s === 403, s);
  s = (await fetch(`${URL_}/rest/v1/day_plans`, { method: 'POST', headers: headers(b.token), body: JSON.stringify({ user_id: a.id, id: '2000-01-02', data: { tasks: [] }, version: 1, seq: 1 }) })).status;
  check('B can\'t insert rows for A', s === 401 || s === 403, s);
  s = (await fetch(`${URL_}/rest/v1/day_plans?user_id=eq.${a.id}`, { method: 'DELETE', headers: headers(b.token) })).status;
  check('B can\'t delete A\'s rows', s === 401 || s === 403, s);
  s = (await fetch(`${URL_}/rest/v1/day_plans?user_id=eq.${a.id}`, { method: 'PATCH', headers: headers(a.token), body: JSON.stringify({ version: 99 }) })).status;
  check('even A can\'t write to the table directly (only through sync_push, which checks versions)', s === 401 || s === 403, s);
  s = (await rpc('sync_push', b.token, { account: a.id, changes: [change('day', DAY, 1, day('B was here'))] })).status;
  check('B can\'t save into A\'s account through sync_push', s === 401 || s === 403, s);
  s = (await rpc('sync_pull', b.token, { account: a.id, since: 0 })).status;
  check('B can\'t read A\'s account through sync_pull', s === 401 || s === 403, s);
  s = (await fetch(`${URL_}/rest/v1/day_plans?select=*`, { headers: headers(null) }));
  const anonRows = s.ok ? await s.json() : [];
  check('signed out (publishable key only): no rows', !s.ok || anonRows.length === 0, s.status);
  s = (await rpc('sync_pull', null, { account: a.id, since: 0 })).status;
  check('signed out: sync_pull refused', s === 401 || s === 403, s);
  r = await (await rpc('sync_push', b.token, { account: b.id, changes: [change('day', DAY, 0, day('B own'))] })).json();
  check('B saving the same date makes B\'s own record; A\'s is untouched', r[0].status === 'applied' && (await pull(a))[0].data.tasks[0].title === 'Live check A', r);

  console.log('\nVersion checks, retries and deletions');
  r = await push(a, [change('day', DAY, 0, day('Stale'))]);
  check('a change based on an older version comes back as a conflict, unsaved', r[0].status === 'conflict' && r[0].version === 1, r);
  const c2 = change('day', DAY, 1, day('Live check A v2'));
  r = await push(a, [c2]);
  check('a change based on the latest version is saved (version 2)', r[0].status === 'applied' && r[0].version === 2, r);
  r = await push(a, [c2]);
  check('sending the same change again is recognised, not applied twice', r[0].status === 'applied' && r[0].version === 2 && r[0].repeat === true, r);
  r = await push(a, [change('day', DAY, 2, null, { deleted: true })]);
  check('deleting it leaves a deletion marker (version 3)', r[0].status === 'applied' && r[0].version === 3, r);
  const after = await pull(a, first[0].seq);
  check('other devices are told about the deletion', after.some(x => x.record_id === DAY && x.deleted && x.data === null), after);
  r = await push(a, [change('day', DAY, 2, day('Old copy'))]);
  check('an old copy can\'t bring it back (conflict: deleted)', r[0].status === 'conflict' && r[0].deleted === true, r);

  console.log('\nEverything else (second migration: sync_records)');
  const note = { id: 'live-check', categoryId: '', title: '', text: 'Live check note', pinned: false, createdAt: '2000-01-01T09:00', updatedAt: '2000-01-01T09:00' };
  r = await push(a, [change('note', 'live-check', 0, note), change('finance', 'finance', 0, { ratesSetOn: null, debts: [], expenses: [] })]);
  check('A can save an item (a note) and a one-record part (Finance) — so the second migration is applied', Array.isArray(r) && r.every(x => x.status === 'applied' && x.version === 1), r);
  check('B sees none of them', (await pull(b)).every(x => x.kind !== 'note' && x.kind !== 'finance'));
  const bRec = await (await fetch(`${URL_}/rest/v1/sync_records?select=*`, { headers: headers(b.token) })).json();
  check('B reading sync_records directly gets no rows of A\'s', Array.isArray(bRec) && bRec.every(x => x.user_id === b.id), bRec);
  s = (await fetch(`${URL_}/rest/v1/sync_records`, { method: 'POST', headers: headers(b.token), body: JSON.stringify({ user_id: a.id, kind: 'note', id: 'x', data: {}, version: 1, seq: 1 }) })).status;
  check('B can\'t insert into sync_records for A', s === 401 || s === 403, s);
  r = await push(a, [change('note', 'live-check', 0, { ...note, text: 'Stale' })]);
  check('a stale change to the note is a conflict, unsaved', r[0].status === 'conflict' && r[0].version === 1 && r[0].data.text === 'Live check note', r);
  r = await push(a, [change('note', 'live-check', 1, null, { deleted: true }), change('finance', 'finance', 1, null, { deleted: true })]);
  check('the note can be deleted; Finance (a one-record part) can\'t', r[0].status === 'applied' && r[1].status === 'rejected', r);

  console.log(`\n${pass} passed, ${fail} failed`);
  console.log('\nNow delete the two test users (Authentication → Users → … → Delete user). That deletes their test records too.');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('STOPPED:', e.message); process.exit(2); });
