// The cloud-sync database (supabase/migrations/*.sql), checked in real PostgreSQL (PGlite) with a stand-in for
// the parts of Supabase it relies on (tests/fixtures/supabase-stub.sql). No browser and no Supabase project:
// every account here is a disposable test account in a throwaway, in-memory database.
const S = require('./supabase-standin.js');
const { check, summary } = require('./cdp.js');

const uuid = () => require('crypto').randomUUID();
const change = (kind, record_id, base_version, data, extra = {}) => ({ change_id: uuid(), kind, record_id, base_version, deleted: false, data, ...extra });
const list = titles => ({ items: titles.map((t, i) => ({ id: 'l' + (i + 1), title: t, minutes: 30 })) });
const day = n => ({ energy: 3, rest: false, builtAt: '2026-10-02T08:00', checkedIn: false, tasks: Array.from({ length: n }, (_, i) => ({ uid: 'u' + i, title: 'Task ' + i })) });
const fails = async fn => { try { await fn(); return null; } catch (e) { return e.message; } };

(async () => {
  const db = await S.createDb();
  const A = await S.addUser(db, 'a@example.test', 'pass-a'), B = await S.addUser(db, 'b@example.test', 'pass-b');
  const push = (who, changes, device = 'dev-1', account = who) => S.as(db, who, q => q('select public.sync_push($1, $2::jsonb, $3) as r', [account, JSON.stringify(changes), device])).then(r => r.rows[0].r);
  const pull = (who, since = 0, max = 500, account = who) => S.as(db, who, q => q('select * from public.sync_pull($1, $2, $3)', [account, since, max])).then(r => r.rows);
  const sql = (q, p) => S.owner(db, q, p).then(r => r.rows);

  console.log('\n[1] The migration sets up a Supabase-like database cleanly');
  const tables = ['sync_accounts', 'task_lists', 'task_queue', 'day_plans', 'day_context', 'sync_records', 'sync_changes'];
  const rls = await sql(`select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname`);
  check('the seven tables exist (sync_records from the second migration)', tables.every(t => rls.some(r => r.relname === t)), rls.map(r => r.relname));
  check('Row Level Security is on for every table', rls.every(r => r.relrowsecurity), rls);

  console.log('\n[2] Grants: signed-out visitors get nothing; signed-in users may only read, and call the two sync functions');
  const priv = await sql(`select t, r, p, has_table_privilege(r, 'public.' || t, p) as yes
    from unnest($1::text[]) t, unnest(array['anon','authenticated']) r, unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p`, [tables]);
  const allowed = priv.filter(x => x.yes).map(x => `${x.r}:${x.t}:${x.p}`).sort();
  check('anon has no table rights at all', !allowed.some(x => x.startsWith('anon:')), allowed);
  check('authenticated: SELECT on the five record tables only (no writes, nothing on the bookkeeping tables)',
    JSON.stringify(allowed) === JSON.stringify(['day_context', 'day_plans', 'sync_records', 'task_lists', 'task_queue'].map(t => `authenticated:${t}:SELECT`)), allowed);
  const fx = await sql(`select r, f, has_function_privilege(r, f, 'EXECUTE') as yes from unnest(array['anon','authenticated','public']) r,
    unnest(array['public.sync_push(uuid,jsonb,text)','public.sync_pull(uuid,bigint,integer)']) f`);
  check('only authenticated may call sync_push and sync_pull', fx.every(x => x.yes === (x.r === 'authenticated')), fx);
  check('signed out: reading a table is refused', /permission denied/.test(await fails(() => S.as(db, null, q => q('select * from public.day_plans')))));
  check('signed out: calling sync_pull is refused', /permission denied/.test(await fails(() => pull(null))));
  check('signed out: calling sync_push is refused', /permission denied/.test(await fails(() => push(null, []))));
  check('a signed-in role with no user id (no token subject) can\'t save', /Sign in to sync/.test(await fails(() => S.as(db, null, async q => { await q('set local role authenticated'); return q(`select public.sync_push(null, '[]'::jsonb)`); }))));

  console.log('\n[3] Saving and reading your own records');
  let r = await push(A, [change('list', 'learning', 0, list(['Course 1', 'Course 2'])), change('day', '2026-10-01', 0, day(2))]);
  check('new records are saved as version 1, numbered in order', r.every(x => x.status === 'applied' && x.version === 1) && r[0].seq === 1 && r[1].seq === 2, r);
  let rows = await pull(A);
  check('sync_pull returns them, oldest first, with their data', rows.length === 2 && rows[0].kind === 'list' && rows[0].data.items[1].title === 'Course 2' && rows[1].kind === 'day' && rows[1].data.tasks.length === 2, rows);
  check('…and which device saved them', rows[0].updated_by === 'dev-1');

  console.log('\n[4] Accounts can\'t see or change each other\'s records');
  check('B sees none of A\'s records through sync_pull', (await pull(B)).length === 0);
  check('B reading the tables directly sees no rows', (await S.as(db, B, q => q('select * from public.task_lists union all select * from public.day_plans'))).rows.length === 0);
  check('B can\'t save changes meant for A\'s account (the account named must be the one signed in)', /different account/.test(await fails(() => push(B, [change('list', 'admin', 0, list(['x']))], 'dev', A))));
  check('B can\'t read changes from A\'s account that way either', /different account/.test(await fails(() => pull(B, 0, 500, A))));
  check('naming no account is refused too', /different account/.test(await fails(() => push(A, [], 'dev', null))) && /different account/.test(await fails(() => pull(A, 0, 500, null))));
  check('B can\'t read the bookkeeping tables', /permission denied/.test(await fails(() => S.as(db, B, q => q('select * from public.sync_changes')))));
  check('B can\'t update A\'s rows directly', /permission denied/.test(await fails(() => S.as(db, B, q => q(`update public.task_lists set data = '{"items":[]}' where user_id = $1`, [A])))));
  check('B can\'t insert a row for A', /permission denied/.test(await fails(() => S.as(db, B, q => q(`insert into public.day_plans (user_id, id, data, version, seq) values ($1, '2026-10-09', '{"tasks":[]}', 1, 99)`, [A])))));
  check('B can\'t delete A\'s rows', /permission denied/.test(await fails(() => S.as(db, B, q => q('delete from public.day_plans where user_id = $1', [A])))));
  check('A can\'t write directly either (only through sync_push, which checks versions)', /permission denied/.test(await fails(() => S.as(db, A, q => q(`update public.task_lists set version = 9 where user_id = $1`, [A])))));
  r = await push(B, [change('list', 'learning', 0, list(['B only']), { user_id: A })]);
  const aList = (await sql(`select data, version from public.task_lists where user_id = $1 and id = 'learning'`, [A]))[0];
  check('B saving the same record id creates B\'s own record (a user_id in the change is ignored)', r[0].status === 'applied' && r[0].version === 1 && aList.version === 1 && aList.data.items[0].title === 'Course 1', { r, aList });
  check('…and B\'s numbering is separate from A\'s', r[0].seq === 1);

  console.log('\n[5] Version checks: a change based on an older version is never written');
  r = await push(A, [change('list', 'learning', 0, list(['Stale']))]);
  check('a change made without knowing version 1 comes back as a conflict, with the latest data', r[0].status === 'conflict' && r[0].version === 1 && r[0].data.items[0].title === 'Course 1' && !r[0].deleted, r);
  const mac = change('list', 'learning', 1, list(['Course 1', 'Course 2', 'Course 3']));
  r = await push(A, [mac], 'mac');
  check('a change based on the latest version is applied (version 2)', r[0].status === 'applied' && r[0].version === 2);
  r = await push(A, [change('list', 'learning', 1, list(['Phone edit']))], 'phone');
  check('another device\'s change based on version 1 is a conflict — not a silent overwrite', r[0].status === 'conflict' && r[0].version === 2 && r[0].data.items.length === 3, r);
  check('…and the saved record is still the Mac\'s', (await sql(`select data from public.task_lists where user_id = $1 and id = 'learning'`, [A]))[0].data.items.length === 3);

  console.log('\n[6] Retried requests are never applied twice');
  const seqBefore = (await sql('select last_seq from public.sync_accounts where user_id = $1', [A]))[0].last_seq;
  r = await push(A, [mac], 'mac');
  check('sending the same change again reports it as applied (repeat), with the same version', r[0].status === 'applied' && r[0].version === 2 && r[0].repeat === true, r);
  check('…nothing new is written (same version, same numbering, one log entry)',
    (await sql(`select version from public.task_lists where user_id = $1 and id = 'learning'`, [A]))[0].version === 2 &&
    (await sql('select last_seq from public.sync_accounts where user_id = $1', [A]))[0].last_seq === seqBefore &&
    (await sql('select count(*)::int as n from public.sync_changes where change_id = $1', [mac.change_id]))[0].n === 1);
  const later = change('list', 'learning', 2, list(['From the phone']));
  await push(A, [later], 'phone');
  r = await push(A, [mac], 'mac');
  check('a retry that arrives after another device\'s newer change is still "applied" (not a false conflict)…', r[0].status === 'applied' && r[0].version === 2 && r[0].repeat, r);
  check('…and doesn\'t undo the newer change', (await sql(`select data, version from public.task_lists where user_id = $1 and id = 'learning'`, [A]))[0].data.items[0].title === 'From the phone');

  console.log('\n[7] Deletions are kept as tombstones, so deleted records don\'t come back');
  r = await push(A, [change('day', '2026-10-01', 1, null, { deleted: true })]);
  check('deleting a day plan gives a new version marked deleted, with its data removed', r[0].status === 'applied' && r[0].version === 2);
  const tomb = (await sql(`select deleted, data, version from public.day_plans where user_id = $1 and id = '2026-10-01'`, [A]))[0];
  check('…the row stays as a tombstone (deleted, no data)', tomb.deleted === true && tomb.data === null && tomb.version === 2, tomb);
  const lastSeen = rows[rows.length - 1].seq;
  rows = await pull(A, lastSeen);
  check('other devices see the deletion when they ask what changed', rows.some(x => x.kind === 'day' && x.record_id === '2026-10-01' && x.deleted && x.data === null), rows);
  r = await push(A, [change('day', '2026-10-01', 1, day(5))], 'old-phone');
  check('a device that still has the old version can\'t bring it back: it gets a conflict saying it was deleted', r[0].status === 'conflict' && r[0].deleted === true && r[0].version === 2, r);
  r = await push(A, [change('day', '2026-10-01', 2, day(1))]);
  check('making a plan for that date again, knowing it was deleted, works (version 3)', r[0].status === 'applied' && r[0].version === 3);
  r = await push(A, [change('list', 'admin', 0, null, { deleted: true })]);
  check('task lists and the queue can\'t be deleted (they always exist)', r[0].status === 'rejected', r);

  console.log('\n[8] Changes that aren\'t valid are refused, and never stop the valid ones');
  const bad = [
    change('ideas', 'x', 0, { a: 1 }),                       // not a kind that syncs (yet)
    change('note', 'bad id!', 0, { text: 'x' }),             // ids are letters, digits and . _ : -
    change('finance', 'finance', 0, null, { deleted: true }), // one-record kinds can't be deleted
    change('note', 'huge', 0, { text: 'x'.repeat(530000) }), // over 512 KB
    change('day', 'yesterday', 0, day(1)),
    change('day', '2026-10-03', 0, { energy: 3 }),
    change('list', 'chores', 0, list(['x'])),
    change('queue', 'queue', 0, { items: 'none' }),
    change('day', '2026-10-04', -1, day(1)),
    { ...change('day', '2026-10-05', 0, day(1)), change_id: 'not-a-uuid' },
    change('context', '2026-10-06', 0, { big: 'x'.repeat(70000) }),
  ];
  const good = change('context', '2026-10-02', 0, { energy: 4, sleep: { start: null, end: null, estimatedHours: 7 } });
  const seq0 = (await sql('select last_seq from public.sync_accounts where user_id = $1', [A]))[0].last_seq;
  r = await push(A, [...bad, good]);
  check('each invalid change is rejected with a reason', r.slice(0, bad.length).every(x => x.status === 'rejected' && x.reason), r.slice(0, bad.length).map(x => x.status + ' ' + (x.reason || '')));
  check('the valid change in the same request is saved', r[bad.length].status === 'applied' && r[bad.length].version === 1);
  check('rejected changes use up no numbers (the next number follows on)', r[bad.length].seq === Number(seq0) + 1, { seq0, r: r[bad.length] });
  check('more than 100 changes at once are refused', /At most 100/.test(await fails(() => push(A, Array.from({ length: 101 }, (_, i) => change('context', `2026-11-${String(i % 28 + 1).padStart(2, '0')}`, 0, {}))))));

  console.log('\n[9] "What changed since…" uses the account\'s own numbering, not device clocks');
  const all = await pull(A);
  const nums = all.map(x => Number(x.seq));
  check('records come back in the order they were saved, latest version only', nums.every((n, i) => i === 0 || n > nums[i - 1]) && all.filter(x => x.record_id === 'learning').length === 1, nums);
  const page1 = await pull(A, 0, 2), page2 = await pull(A, page1[1].seq, 500);
  check('they can be fetched a page at a time without missing any', page1.length === 2 && page1.length + page2.length === all.length);
  check('asking from the latest number returns nothing new', (await pull(A, nums[nums.length - 1])).length === 0);

  console.log('\n[11] Everything else (second migration): one table, the same rules');
  const cur = Math.max(...(await pull(A)).map(x => Number(x.seq)));
  const note1 = { id: 'nt1', categoryId: '', title: '', text: 'Weekend coffee van', pinned: false, createdAt: '2026-10-05T09:00', updatedAt: '2026-10-05T09:00' };
  r = await push(A, [change('note', 'nt1', 0, note1), change('finance', 'finance', 0, { ratesSetOn: null, debts: [], expenses: [] }), change('study', 'roadmap', 0, { stages: [], focusCourseId: null, settings: { vault: '', showClock: true }, concepts: [] })]);
  check('items and one-record kinds are saved as version 1, numbered by the same counter as before', r.every(x => x.status === 'applied' && x.version === 1) && r[0].seq === cur + 1 && r[2].seq === cur + 3, r);
  await push(A, [change('context', '2026-10-08', 0, { energy: 2 })]);
  rows = await pull(A, cur);
  check('"what changed since…" returns them with the first milestone\'s records, in the order saved', JSON.stringify(rows.map(x => `${x.kind}:${x.record_id}`)) === JSON.stringify(['note:nt1', 'finance:finance', 'study:roadmap', 'context:2026-10-08']) && rows[0].data.text === 'Weekend coffee van', rows.map(x => x.kind));
  const again = change('note', 'nt1', 0, { ...note1, text: 'From the other device' });
  r = await push(A, [again]);
  check('a change based on an older version is a conflict (nothing written), with the latest sent back', r[0].status === 'conflict' && r[0].version === 1 && r[0].data.text === 'Weekend coffee van', r);
  const edit = change('note', 'nt1', 1, { ...note1, text: 'Weekend coffee van — costs' });
  r = await push(A, [edit]);
  check('based on the latest version, it\'s saved as version 2', r[0].status === 'applied' && r[0].version === 2);
  r = await push(A, [edit]);
  check('the same change sent again isn\'t applied twice', r[0].status === 'applied' && r[0].repeat === true && (await sql(`select version from public.sync_records where user_id = $1 and kind = 'note' and id = 'nt1'`, [A]))[0].version === 2);
  r = await push(A, [change('note', 'nt1', 2, null, { deleted: true })]);
  rows = await pull(A, cur);
  check('an item can be deleted: kept as a tombstone, so other devices learn it', r[0].status === 'applied' && rows.some(x => x.kind === 'note' && x.record_id === 'nt1' && x.deleted && x.data === null));
  r = await push(A, [change('finance', 'finance', 1, null, { deleted: true })]);
  check('a one-record kind can\'t be deleted, even based on the latest version', r[0].status === 'rejected' && (await sql(`select deleted from public.sync_records where user_id = $1 and kind = 'finance'`, [A]))[0].deleted === false, r);
  r = await push(B, [change('note', 'nt1', 0, { ...note1, text: 'B\'s own note with the same id' })]);
  check('another account\'s item with the same id is its own record (version 1, separate)', r[0].status === 'applied' && r[0].version === 1);
  check('B sees only its own records', (await pull(B)).every(x => x.kind !== 'finance') && (await pull(B)).filter(x => x.kind === 'note').length === 1 && (await pull(B)).find(x => x.kind === 'note').data.text.startsWith('B\'s own'));
  check('B reading the table directly sees only its own rows', (await S.as(db, B, q => q('select * from public.sync_records'))).rows.every(x => x.user_id === B));
  check('B can\'t write to the table directly', /permission denied/.test(await fails(() => S.as(db, B, q => q(`insert into public.sync_records (user_id, kind, id, data, version, seq) values ($1, 'note', 'x', '{}', 1, 99)`, [A])))));
  check('…nor A', /permission denied/.test(await fails(() => S.as(db, A, q => q(`update public.sync_records set version = 9 where user_id = $1`, [A])))));

  console.log('\n[9b] Projects (third migration, 20261006120000_sync_projects.sql)');
  const pj = { id: 'pj1', title: 'Coffee subscription', summary: '', stage: 'explore', status: 'active', nextTaskId: null, commitmentIds: [], createdAt: '2026-10-06T09:00', updatedAt: '2026-10-06T09:00' };
  r = await push(A, [change('project', 'pj1', 0, pj)]);
  check('a project can be saved (version 1)', r[0].status === 'applied' && r[0].version === 1, r);
  r = await push(A, [change('project', 'pj1', 1, null, { deleted: true })]);
  check('…and deleted, kept as a tombstone like a note or a task', r[0].status === 'applied' && (await pull(A)).some(x => x.kind === 'project' && x.record_id === 'pj1' && x.deleted && x.data === null));
  r = await push(A, [change('projects', 'all', 0, { items: [] })]);
  check('kinds outside the list are still refused', r[0].status === 'rejected', r);
  const named = (await sql(`select conname from pg_constraint where conrelid = 'public.sync_records'::regclass and contype = 'c' order by conname`)).map(x => x.conname);
  check('the kind checks were replaced, not added twice (named ones only, no old unnamed copies)', named.includes('sync_records_known_kind') && named.includes('sync_records_deletable_kind')
    && named.filter(n => /^sync_records_(kind_check|check\d*)$/.test(n)).length === 1, named);

  console.log('\n[10] Housekeeping');
  await sql(`update public.sync_changes set applied_at = now() - interval '91 days' where user_id = $1 and change_id = $2`, [A, mac.change_id]);
  await push(A, [change('context', '2026-10-07', 0, {})]);
  check('the record of applied changes is cleared after 90 days', (await sql('select count(*)::int as n from public.sync_changes where change_id = $1', [mac.change_id]))[0].n === 0);
  await sql('delete from auth.users where id = $1', [B]);
  check('deleting an account deletes its records', (await sql('select count(*)::int as n from public.task_lists where user_id = $1', [B]))[0].n === 0);
  check('…and nobody else\'s', (await sql('select count(*)::int as n from public.task_lists where user_id = $1', [A]))[0].n === 1);
  check('…in the second migration\'s table too', (await sql('select count(*)::int as n from public.sync_records where user_id = $1', [B]))[0].n === 0 && (await sql('select count(*)::int as n from public.sync_records where user_id = $1', [A]))[0].n === 4); // note, finance, roadmap, the project's tombstone

  console.log('\n[11] Cybersecurity learner records');
  const learner = await S.addUser(db, 'cyber-isolation@example.test', 'x');
  const attempt = { id: 'ca1', activityId: 'exercise.learning-evidence', curriculumVersion: '1.0.0', evidence: 'Disposable test observation' };
  r = await push(A, [change('cybersecurity', 'preferences', 0, { pathId: 'path.core' }), change('cyber_attempt', 'ca1', 0, attempt)]);
  check('curriculum preferences and individual attempts save through sync_push', r.every(x => x.status === 'applied' && x.version === 1), r);
  check('another learner cannot read the evidence', !(await pull(learner)).some(x => x.kind === 'cyber_attempt'));
  r = await push(A, [change('cyber_attempt', 'ca1', 0, { ...attempt, evidence: 'stale' })]);
  check('a stale device cannot overwrite an attempt', r[0].status === 'conflict', r);
  r = await push(A, [change('cyber_attempt', 'ca1', 1, null, { deleted: true })]);
  check('attempt removal propagates as a tombstone', r[0].status === 'applied' && (await pull(A)).some(x => x.kind === 'cyber_attempt' && x.deleted));
  r = await push(A, [change('cybersecurity', 'preferences', 1, null, { deleted: true })]);
  check('the preferences singleton cannot be deleted', r[0].status === 'rejected', r);

  const { pass, fail } = summary();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('HARNESS:', e); process.exit(2); });
