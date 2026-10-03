// The AI limits under genuinely simultaneous requests: ai_begin (supabase/migrations/20261003120000_ai_usage.sql)
// in a real PostgreSQL server, called at the same moment from independent connections (each its own session and
// transaction, as the Edge Function's requests are). PGlite, used by the other database suites, has only one
// connection, so it can't show this.
//
// Needs a disposable PostgreSQL. Either:
//   - MYDAY_TEST_PG_URL=postgres://user:password@host:port/postgres  (a throwaway server you started; the test makes
//     its own database there and deletes it afterwards), or
//   - the embedded-postgres and pg packages in tests/.pgtools (Git ignores it), or in MYDAY_PG_TOOLS:
//       npm install --prefix tests/.pgtools --foreground-scripts embedded-postgres@17.10.0-beta.17 pg@8
//     The test then starts its own throwaway server in a temporary folder and deletes it afterwards.
// Only made-up accounts are used.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const TOOLS = process.env.MYDAY_PG_TOOLS || path.join(ROOT, 'tests/.pgtools');

const A = '00000000-0000-4000-8000-00000000000a', B = '00000000-0000-4000-8000-00000000000b';
const N = 10; // simultaneous requests per round

(async () => {
  let pg;
  try { pg = require(require.resolve('pg', { paths: [path.join(TOOLS, 'node_modules'), TOOLS] })); }
  catch { console.log(`Not run: needs PostgreSQL tools. See the top of tests/ai-concurrency.test.js (looked in ${TOOLS}).`); process.exit(2); }

  // ---- A throwaway server, unless one was given ----
  let server = null, dataDir = null, base = process.env.MYDAY_TEST_PG_URL;
  if (!base) {
    const plat = path.join(TOOLS, 'node_modules/@embedded-postgres', `${process.platform}-${process.arch}`);
    // npm may skip this package's own set-up step (it recreates library links); doing it again is harmless.
    if (fs.existsSync(path.join(plat, 'scripts/hydrate-symlinks.js'))) execFileSync(process.execPath, ['scripts/hydrate-symlinks.js'], { cwd: plat });
    const { default: EmbeddedPostgres } = await import(pathToFileURL(path.join(TOOLS, 'node_modules/embedded-postgres/dist/index.js')).href);
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'myday-pg-'));
    const port = 55000 + (process.pid % 900);
    server = new EmbeddedPostgres({ databaseDir: dataDir, user: 'postgres', password: 'test', port, persistent: false, onLog: () => {}, onError: () => {} });
    await server.initialise();
    await server.start();
    base = `postgres://postgres:test@127.0.0.1:${port}/postgres`;
  }
  const dbName = `myday_ai_concurrency_${process.pid}`;
  const admin = new pg.Client({ connectionString: base });
  await admin.connect();
  await admin.query(`create database ${dbName}`);
  const url = new URL(base); url.pathname = '/' + dbName;
  const clients = [];
  const connect = async () => { const c = new pg.Client({ connectionString: url.href }); await c.connect(); clients.push(c); return c; };
  let owner;

  try {
    owner = await connect();
    const version = (await owner.query('show server_version')).rows[0].server_version;
    console.log(`\nPostgreSQL ${version}${server ? ' (a throwaway server)' : ''}; ${N} independent connections per round`);
    await owner.query(fs.readFileSync(path.join(ROOT, 'tests/fixtures/supabase-stub.sql'), 'utf8'));
    const migrations = path.join(ROOT, 'supabase/migrations');
    for (const f of fs.readdirSync(migrations).filter(f => f.endsWith('.sql')).sort()) await owner.query(fs.readFileSync(path.join(migrations, f), 'utf8'));
    await owner.query(`insert into auth.users (id, email) values ($1, 'conc-a@example.test'), ($2, 'conc-b@example.test')`, [A, B]);

    // Versions of ai_begin for the controls, made from the migration's own function text:
    //   gap        + a 50 ms pause after reading the month's total (so requests surely overlap where a race would be)
    //   dayshift   + each request may use a different day row (myday.test_day_offset), as either side of midnight
    //   nolocks    without the account lock and the row lock: what the test must catch as a race
    //   rowlock    without the account lock only (the row lock kept): the gap the account lock closes
    const src = (await owner.query(`select pg_get_functiondef('public.ai_begin(integer,numeric,numeric,integer)'::regprocedure) as d`)).rows[0].d;
    const ACCOUNT_LOCK = /\n\s*perform pg_advisory_xact_lock\(hashtextextended\('myday-ai:' \|\| v_me::text, 0\)\);/;
    const ROW_LOCK = / for update;/;
    const MONTH_READ = /(into v_month\s+from public\.ai_usage u where u\.user_id = v_me and u\.day >= date_trunc\('month', v_day\)::date;)/;
    const DAY = /v_day\s+date := \(now\(\) at time zone 'utc'\)::date;/;
    check('the migration\'s ai_begin has the account lock, the row lock, the month read and the day as expected (so the variants below are built from it)', ACCOUNT_LOCK.test(src) && ROW_LOCK.test(src) && MONTH_READ.test(src) && DAY.test(src));
    const variant = (name, { gap = false, dayshift = false, noAccountLock = false, noRowLock = false }) => {
      let s = src.replace(/FUNCTION public\.ai_begin\(/, `FUNCTION public.${name}(`);
      if (gap) s = s.replace(MONTH_READ, '$1\n  perform pg_sleep(0.05);');
      if (dayshift) s = s.replace(DAY, `v_day date := (now() at time zone 'utc')::date + coalesce(nullif(current_setting('myday.test_day_offset', true), '')::int, 0);`);
      if (noAccountLock) s = s.replace(ACCOUNT_LOCK, '');
      if (noRowLock) s = s.replace(ROW_LOCK, ';');
      return s + `;\ngrant execute on function public.${name}(integer, numeric, numeric, integer) to authenticated;`;
    };
    await owner.query(variant('ai_begin_gap', { gap: true }));
    await owner.query(variant('ai_begin_gap_dayshift', { gap: true, dayshift: true }));
    await owner.query(variant('ctl_nolocks_gap', { gap: true, noAccountLock: true, noRowLock: true }));
    await owner.query(variant('ctl_rowlock_gap_dayshift', { gap: true, dayshift: true, noAccountLock: true }));

    const sessions = [];
    for (let i = 0; i < N + 1; i++) sessions.push(await connect());
    const reset = async (who, row) => {
      await owner.query('delete from public.ai_usage where user_id = $1', [who]);
      if (row) await owner.query('insert into public.ai_usage (user_id, day, requests, reserved_usd, last_request_at) values ($1, (now() at time zone \'utc\')::date, $2, $3, $4)', [who, row.requests || 0, row.reserved || 0, row.last || null]);
    };
    // Each connection: its own transaction as the signed-in account (as PostgREST does for the Edge Function's
    // RPC call), then all the calls are sent at the same moment, and each commits as soon as its own call returns.
    const enter = (c, who, dayOffset = 0) => c.query('begin').then(() => c.query('set local role authenticated'))
      .then(() => c.query(`select set_config('request.jwt.claims', $1, true), set_config('myday.test_day_offset', $2, true)`, [JSON.stringify({ sub: who, role: 'authenticated' }), String(dayOffset)]));
    async function round(fn, who, limits, offsets = null) {
      const cs = sessions.slice(0, N);
      await Promise.all(cs.map((c, i) => enter(c, who, offsets ? offsets[i] : 0)));
      return Promise.all(cs.map(c => c.query(`select public.${fn}($1, $2, $3, $4) as r`, limits).then(
        async r => { await c.query('commit'); return r.rows[0].r; },
        async e => { await c.query('rollback'); return { ok: false, reason: 'error: ' + e.message }; })));
    }
    const oks = out => out.filter(r => r.ok).length;
    const totals = async who => (await owner.query('select coalesce(sum(requests), 0)::int as n, coalesce(sum(reserved_usd), 0)::numeric as usd from public.ai_usage where user_id = $1', [who])).rows[0];

    console.log('\n[1] The migration\'s ai_begin, unchanged: only one of many simultaneous requests gets the last of a limit');
    const ROUNDS = 20;
    let exact = 0, worst = 0, reasons = new Set(), tot;
    for (let k = 0; k < ROUNDS; k++) {
      await reset(A, { reserved: 0.995 }); // US$1 a month, US$0.004 a request: room for exactly one more
      const out = await round('ai_begin', A, [50, 1, 0.004, 0]);
      tot = await totals(A);
      if (oks(out) === 1 && tot.n === 1 && Number(tot.usd) === 0.999) exact++;
      worst = Math.max(worst, oks(out)); out.filter(r => !r.ok).forEach(r => reasons.add(r.reason));
    }
    // The others are refused as "budget", or as "too-fast" when they began a moment before the one allowed (times
    // are taken at the start of each transaction, so a request begun at the same instant counts as too soon).
    check(`budget with room for one: exactly one of ${N} simultaneous requests allowed, in all ${ROUNDS} rounds (the others refused: "budget" or "too-fast"); the reservation is never over the limit`, exact === ROUNDS && worst === 1 && [...reasons].every(x => x === 'budget' || x === 'too-fast'), { exact, worst, reasons: [...reasons] });
    exact = 0; reasons = new Set();
    for (let k = 0; k < ROUNDS; k++) {
      await reset(A, { requests: 19 }); // 20 a day: one left
      const out = await round('ai_begin', A, [20, 1, 0.001, 0]);
      tot = await totals(A);
      if (oks(out) === 1 && tot.n === 20) exact++;
      out.filter(r => !r.ok).forEach(r => reasons.add(r.reason));
    }
    check(`daily limit with one left: exactly one of ${N} simultaneous requests allowed, in all ${ROUNDS} rounds (the others: "daily")`, exact === ROUNDS && [...reasons].join() === 'daily', { exact, reasons: [...reasons] });
    exact = 0; reasons = new Set();
    for (let k = 0; k < ROUNDS; k++) {
      await reset(A, null);
      const out = await round('ai_begin', A, [50, 1, 0.001, 60]);
      if (oks(out) === 1) exact++;
      out.filter(r => !r.ok).forEach(r => reasons.add(r.reason));
    }
    check(`one request per minute: exactly one of ${N} simultaneous first requests allowed, in all ${ROUNDS} rounds (the others: "too-fast")`, exact === ROUNDS && [...reasons].join() === 'too-fast', { exact, reasons: [...reasons] });

    console.log('\n[2] While one request holds the account, the others wait for it — before reading anything — and other accounts don\'t');
    await reset(A, { reserved: 0.995 }); await reset(B, null);
    const holder = sessions[N];
    await enter(holder, A);
    const first = (await holder.query('select public.ai_begin(50, 1, 0.004, 0) as r')).rows[0].r; // not committed yet
    const waiting = sessions.slice(0, 5);
    await Promise.all(waiting.map(c => enter(c, A)));
    const pending = waiting.map(c => c.query('select public.ai_begin(50, 1, 0.004, 0) as r').then(async r => { await c.query('commit'); return r.rows[0].r; }));
    let blocked = [];
    for (let t = 0; t < 50; t++) {
      blocked = (await owner.query(`select l.locktype from pg_locks l join pg_stat_activity a on a.pid = l.pid where not l.granted and a.datname = $1`, [dbName])).rows;
      if (blocked.length >= 5) break;
      await new Promise(r => setTimeout(r, 50));
    }
    check('5 more requests for the same account, sent while the first is still open: all 5 wait, on the account lock (taken before any day row or total is read)', first.ok === true && blocked.length === 5 && blocked.every(b => b.locktype === 'advisory'), blocked);
    const other = sessions[5];
    await enter(other, B);
    const t0 = Date.now();
    const bRes = (await other.query('select public.ai_begin(50, 1, 0.004, 0) as r')).rows[0].r;
    await other.query('commit');
    check('…meanwhile another account\'s request goes straight through (the lock is per account, not for everyone)', bRes.ok === true && Date.now() - t0 < 1000, Date.now() - t0);
    await holder.query('commit');
    const after = await Promise.all(pending);
    tot = await totals(A);
    check('…and when the first one finishes, the waiting 5 see its reservation: all refused ("budget"), nothing over the limit', after.every(r => r.ok === false && r.reason === 'budget') && tot.n === 1 && Number(tot.usd) === 0.999, { after, tot });

    console.log('\n[3] Controls: with a pause where a race would happen, the test does catch one when the locks are missing');
    const offsetFor = i => (i % 2 ? (new Date().getUTCDate() === 1 ? 1 : -1) : 0); // half today, half another day this month
    const runs = async (fn, offsets) => {
      let maxOk = 0, overs = 0;
      for (let k = 0; k < 5; k++) {
        await reset(A, { reserved: 0.995 });
        const out = await round(fn, A, [50, 1, 0.004, 0], offsets);
        const t = await totals(A);
        maxOk = Math.max(maxOk, oks(out)); if (Number(t.usd) > 1) overs++;
      }
      return { maxOk, overs };
    };
    let r = await runs('ctl_nolocks_gap', null);
    check('control without any lock: several simultaneous requests get through and the month goes over budget (so the test really sends them at once)', r.maxOk > 1 && r.overs > 0, r);
    r = await runs('ai_begin_gap', null);
    check('the migration\'s locking with the same pause: still exactly one allowed, never over budget', r.maxOk === 1 && r.overs === 0, r);
    r = await runs('ctl_rowlock_gap_dayshift', Array.from({ length: N }, (_, i) => offsetFor(i)));
    check('control with only the row lock, requests on two different days (as either side of midnight): more than one gets through — the gap the account lock closes', r.maxOk > 1 && r.overs > 0, r);
    r = await runs('ai_begin_gap_dayshift', Array.from({ length: N }, (_, i) => offsetFor(i)));
    check('the migration\'s locking, requests on two different days: still exactly one allowed, never over budget', r.maxOk === 1 && r.overs === 0, r);
  } finally {
    for (const c of clients) await c.end().catch(() => {});
    await admin.query(`drop database if exists ${dbName} with (force)`).catch(() => {});
    await admin.end().catch(() => {});
    if (server) await server.stop().catch(() => {});
    if (dataDir) fs.rmSync(dataDir, { recursive: true, force: true });
  }

  const { pass, fail } = summary();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('HARNESS:', e); process.exit(2); });
