// A stand-in for a Supabase project, for MyDay's sync tests. It is NOT Supabase.
//
// The database is real PostgreSQL (PGlite: PostgreSQL compiled to WebAssembly) running MyDay's own migrations
// (supabase/migrations/*.sql) on top of tests/fixtures/supabase-stub.sql, which adds the few parts of Supabase
// the migrations rely on (the anon/authenticated roles, auth.users and auth.uid()). Row Level Security, grants
// and the sync functions therefore run exactly as written.
//
// In front of it is a small imitation of the two Supabase services the app talks to, enough for the real
// supabase-js library in the browser:
//   Auth   POST /auth/v1/token?grant_type=password | refresh_token, GET /auth/v1/user, POST /auth/v1/logout
//   Data   POST /rest/v1/rpc/<function>, and GET/POST/PATCH/DELETE /rest/v1/<table> (to check that direct
//          access is refused). Each request runs in its own transaction as `anon` or `authenticated`, with
//          the token's claims set the way Supabase sets them, so auth.uid() and the policies behave as there.
// Tokens are signed with a test secret. Passwords are only hashed with SHA-256 (fine for disposable test users).
//
// Test controls (not part of Supabase), under /__standin/:
//   POST users {email, password} → {id}      POST fault {path, mode: 'drop' | 'error' | 'delay', times, ms}
//   POST ai-env {NAME: value…}               settings for the AI Edge Function (e.g. AI_MODEL: 'mock:sloppy'); GET ai-log
//
// The AI planner's Edge Function (POST /functions/v1/ai-plan) runs its real code (supabase/functions/ai-plan/handler.ts)
// with the stand-in's sign-in check, the real limit functions in the database, and a mock model by default.
//   GET log, POST log/clear                  POST sql {sql, params} (runs as the database owner)
//
// Usage from a test:  const S = require('./supabase-standin.js'); const db = await S.createDb(); const srv = await S.start(db, port);
// Or on its own:      node tests/supabase-standin.js 54329   (then build the app with VITE_SUPABASE_URL=http://127.0.0.1:54329)
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const PUBLISHABLE_KEY = 'sb_publishable_standin_test_key_0000000000';
const JWT_SECRET = crypto.randomBytes(32);

// ---------- The database ----------
async function createDb() {
  const { PGlite } = require(require.resolve('@electric-sql/pglite', { paths: [path.join(ROOT, 'app')] }));
  const db = await PGlite.create();
  await db.exec(fs.readFileSync(path.join(ROOT, 'tests/fixtures/supabase-stub.sql'), 'utf8'));
  const dir = path.join(ROOT, 'supabase/migrations');
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) await db.exec(fs.readFileSync(path.join(dir, f), 'utf8'));
  return db;
}

// Runs fn(query) in one transaction as a Supabase API role: who = a user id (authenticated) or null (anon).
// Everything is undone if fn throws.
let chain = Promise.resolve();
function serial(fn) { const run = chain.then(fn, fn); chain = run.catch(() => {}); return run; }
async function as(db, who, fn) {
  return serial(async () => {
    await db.exec('begin');
    try {
      await db.exec(`set local role ${who ? 'authenticated' : 'anon'}`);
      const claims = who ? { sub: who, role: 'authenticated', aud: 'authenticated' } : { role: 'anon' };
      await db.query(`select set_config('request.jwt.claims', $1, true), set_config('request.jwt.claim.sub', $2, true)`, [JSON.stringify(claims), who || '']);
      const r = await fn((sql, params) => db.query(sql, params));
      await db.exec('commit');
      return r;
    } catch (e) {
      await db.exec('rollback');
      throw e;
    }
  });
}
const owner = (db, sql, params) => serial(() => db.query(sql, params));

async function addUser(db, email, password) {
  const id = crypto.randomUUID();
  await owner(db, 'insert into auth.users (id, email, encrypted_password) values ($1, $2, $3)', [id, email, sha(password)]);
  return id;
}
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');

// ---------- Tokens ----------
const b64 = x => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
function sign(payload) {
  const head = b64({ alg: 'HS256', typ: 'JWT' }), body = b64(payload);
  return `${head}.${body}.${crypto.createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url')}`;
}
function verify(token) {
  const [head, body, sig] = String(token).split('.');
  if (!sig) return null;
  const good = crypto.createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url');
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  const p = JSON.parse(Buffer.from(body, 'base64url').toString());
  return p.exp * 1000 > Date.now() ? p : { expired: true };
}
const refreshTokens = new Map(); // refresh token → user
function session(user) {
  const now = Math.floor(Date.now() / 1000), expiresIn = 3600, refresh = crypto.randomBytes(16).toString('hex');
  refreshTokens.set(refresh, user);
  const u = userJson(user);
  return {
    access_token: sign({ sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + expiresIn, session_id: crypto.randomUUID() }),
    token_type: 'bearer', expires_in: expiresIn, expires_at: now + expiresIn, refresh_token: refresh, user: u,
  };
}
const userJson = u => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' });

// ---------- The server ----------
function start(db, port = 0) {
  const log = [];
  const faults = [];
  // The AI Edge Function's settings (its "secrets"): a mock model, generous limits.
  const aiEnv = { AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_LABEL: 'Mock planner', AI_MOCK_DELAY_MS: '150', AI_DAILY_LIMIT: '50', AI_MIN_SECONDS_BETWEEN: '0', AI_ALLOWED_ORIGINS: 'http://127.0.0.1:' + (process.env.MYDAY_HTTP_PORT || 8765) };
  const aiLog = [];
  let aiHandler = null;
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => handle(req, res, raw).catch(e => send(res, 500, { message: String(e && e.message || e) })));
  });

  function send(res, status, body, extra = {}) {
    if (res.destroyed) return;
    res.writeHead(status, {
      'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'content-range, x-supabase-api-version',
      'X-Supabase-Api-Version': '2024-01-01', ...extra,
    });
    res.end(body === undefined ? '' : JSON.stringify(body));
  }
  // PostgreSQL errors as PostgREST reports them.
  function pgError(res, e, who) {
    const code = e.code || '';
    const status = code === '42501' ? (who ? 403 : 401) : ['22023', '23514', '22P02', 'P0001', '23502'].includes(code) ? 400 : 500;
    send(res, status, { code, details: e.detail || null, hint: e.hint || null, message: e.message });
  }

  async function handle(req, res, raw) {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*', 'Access-Control-Max-Age': '600',
      });
      return res.end();
    }
    let body = null;
    try { body = raw ? JSON.parse(raw) : null; } catch { return send(res, 400, { message: 'Body is not JSON' }); }

    // Test controls.
    if (p.startsWith('/__standin/')) {
      const what = p.slice('/__standin/'.length);
      if (what === 'users') return send(res, 200, { id: await addUser(db, body.email, body.password) });
      if (what === 'fault') { faults.push({ ...body, times: body.times || 1 }); return send(res, 200, { ok: true }); }
      if (what === 'faults/clear') { faults.length = 0; return send(res, 200, { ok: true }); }
      if (what === 'log') return send(res, 200, log);
      if (what === 'log/clear') { log.length = 0; return send(res, 200, { ok: true }); }
      if (what === 'sql') { try { return send(res, 200, (await owner(db, body.sql, body.params || [])).rows); } catch (e) { return send(res, 400, { message: e.message }); } }
      if (what === 'ai-env') { Object.assign(aiEnv, body); for (const k of Object.keys(body)) if (body[k] === null) delete aiEnv[k]; return send(res, 200, aiEnv); }
      if (what === 'ai-log') return send(res, 200, aiLog);
      return send(res, 404, { message: 'Unknown control' });
    }

    if (req.headers.apikey !== PUBLISHABLE_KEY) return send(res, 401, { message: 'Invalid API key' });
    const bearer = (req.headers.authorization || '').replace(/^Bearer /i, '');
    const claims = bearer && bearer !== PUBLISHABLE_KEY ? verify(bearer) : null;
    const who = claims && !claims.expired ? claims.sub : null;
    const entry = { at: Date.now(), method: req.method, path: p, user: who, body };
    log.push(entry);

    const fault = faults.find(f => f.times > 0 && p === f.path);
    if (fault) {
      fault.times--;
      entry.fault = fault.mode;
      if (fault.mode === 'error') return send(res, 503, { message: 'stand-in: simulated server error' });
      if (fault.mode === 'delay') await new Promise(r => setTimeout(r, fault.ms || 1500));
    }
    const reply = (status, b, extra) => { entry.status = status; if (fault && fault.mode === 'drop') { res.destroy(); return; } send(res, status, b, extra); };

    // ----- Auth -----
    if (p === '/auth/v1/token') {
      const grant = url.searchParams.get('grant_type');
      if (grant === 'password') {
        const r = await owner(db, 'select id, email, encrypted_password from auth.users where lower(email) = lower($1)', [body && body.email]);
        const u = r.rows[0];
        if (!u || u.encrypted_password !== sha(body.password)) return reply(400, { code: 'invalid_credentials', message: 'Invalid login credentials' });
        return reply(200, session(u));
      }
      if (grant === 'refresh_token') {
        const u = refreshTokens.get(body && body.refresh_token);
        if (!u) return reply(400, { code: 'refresh_token_not_found', message: 'Invalid Refresh Token: Refresh Token Not Found' });
        refreshTokens.delete(body.refresh_token);
        return reply(200, session(u));
      }
      return reply(400, { code: 'validation_failed', message: 'Unsupported grant type' });
    }
    if (p === '/auth/v1/user') {
      if (!who) return reply(401, { code: 'bad_jwt', message: 'invalid JWT' });
      const r = await owner(db, 'select id, email from auth.users where id = $1', [who]);
      return r.rows[0] ? reply(200, userJson(r.rows[0])) : reply(404, { code: 'user_not_found', message: 'User not found' });
    }
    if (p === '/auth/v1/logout') return reply(204);

    // ----- The AI Edge Function (real handler code) -----
    if (p === '/functions/v1/ai-plan') {
      if (!aiHandler) aiHandler = (await import(path.join(ROOT, 'supabase/functions/ai-plan/handler.ts'))).handle;
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
      const request = new Request('http://standin' + req.url, { method: req.method, headers, body: req.method === 'POST' ? raw : undefined });
      const response = await aiHandler(request, {
        env: name => aiEnv[name],
        verifyUser: async token => { const c = verify(token); return c && !c.expired ? c.sub : null; },
        begin: async (token, l) => { const c = verify(token); const r = await as(db, c.sub, q => q('select public.ai_begin($1, $2, $3, $4) as r', [l.perDay, l.monthlyUsd, l.reserveUsd, l.minSeconds])); return r.rows[0].r; },
        finish: async (token, i, o) => { const c = verify(token); await as(db, c.sub, q => q('select public.ai_finish($1, $2)', [i, o])); },
        log: line => aiLog.push(line),
      });
      entry.status = response.status;
      if (fault && fault.mode === 'drop') { res.destroy(); return; }
      const out = {}; response.headers.forEach((v, k) => { out[k] = v; });
      res.writeHead(response.status, out);
      return res.end(await response.text());
    }

    // ----- Data -----
    if (claims && claims.expired) return reply(401, { code: 'PGRST303', message: 'JWT expired' });
    if (bearer && bearer !== PUBLISHABLE_KEY && !claims) return reply(401, { code: 'PGRST301', message: 'Invalid JWT' });
    const rpc = p.match(/^\/rest\/v1\/rpc\/(\w+)$/);
    if (rpc) {
      try {
        if (rpc[1] === 'sync_push') {
          const r = await as(db, who, q => q('select public.sync_push(account => $1::uuid, changes => $2::jsonb, device => $3) as r', [body.account ?? null, JSON.stringify(body.changes), body.device ?? null]));
          return reply(200, r.rows[0].r);
        }
        if (rpc[1] === 'sync_pull') {
          const r = await as(db, who, q => q('select * from public.sync_pull(account => $1::uuid, since => $2::bigint, max_rows => $3::integer)', [body.account ?? null, body.since ?? 0, body.max_rows ?? 500]));
          return reply(200, r.rows.map(x => ({ ...x, seq: Number(x.seq) })));
        }
        // The AI limits, as the Edge Function's entry (index.ts) calls them through supabase-js: named arguments.
        if (rpc[1] === 'ai_begin') {
          const r = await as(db, who, q => q('select public.ai_begin(per_day => $1::integer, monthly_usd => $2::numeric, reserve_usd => $3::numeric, min_seconds => $4::integer) as r', [body.per_day ?? null, body.monthly_usd ?? null, body.reserve_usd ?? null, body.min_seconds ?? null]));
          return reply(200, r.rows[0].r);
        }
        if (rpc[1] === 'ai_finish') {
          await as(db, who, q => q('select public.ai_finish(input_tokens => $1::integer, output_tokens => $2::integer)', [body.input_tokens ?? null, body.output_tokens ?? null]));
          return reply(204);
        }
        return reply(404, { code: 'PGRST202', message: `Could not find the function public.${rpc[1]}` });
      } catch (e) { entry.status = 'error'; return pgError(res, e, who); }
    }
    const table = p.match(/^\/rest\/v1\/(\w+)$/);
    if (table) {
      const t = table[1];
      if (!/^[a-z_]+$/.test(t)) return reply(404, { message: 'Not found' });
      const filters = [...url.searchParams].filter(([k]) => k !== 'select');
      const where = filters.map(([k], i) => `${k} = $${i + 1}`).join(' and ');
      const vals = filters.map(([, v]) => v.replace(/^eq\./, ''));
      try {
        let r;
        if (req.method === 'GET') r = await as(db, who, q => q(`select * from public.${t}${where ? ' where ' + where : ''}`, vals));
        else if (req.method === 'POST') {
          const row = Array.isArray(body) ? body[0] : body, cols = Object.keys(row);
          r = await as(db, who, q => q(`insert into public.${t} (${cols.join(', ')}) values (${cols.map((_, i) => `$${i + 1}`).join(', ')}) returning *`, cols.map(c => (typeof row[c] === 'object' && row[c] !== null ? JSON.stringify(row[c]) : row[c]))));
        } else if (req.method === 'PATCH') {
          const cols = Object.keys(body);
          r = await as(db, who, q => q(`update public.${t} set ${cols.map((c, i) => `${c} = $${i + 1 + vals.length}`).join(', ')}${where ? ' where ' + where : ''} returning *`, [...vals, ...cols.map(c => (typeof body[c] === 'object' && body[c] !== null ? JSON.stringify(body[c]) : body[c]))]));
        } else if (req.method === 'DELETE') r = await as(db, who, q => q(`delete from public.${t}${where ? ' where ' + where : ''} returning *`, vals));
        return reply(200, r.rows);
      } catch (e) { entry.status = 'error'; return pgError(res, e, who); }
    }
    return reply(404, { message: 'Not found' });
  }

  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port, log, faults, aiEnv, aiLog, close: () => new Promise(r => server.close(r)) })));
}

module.exports = { createDb, start, as, owner, addUser, PUBLISHABLE_KEY };

// Run on its own: node tests/supabase-standin.js [port]
if (require.main === module) {
  (async () => {
    const db = await createDb();
    const s = await start(db, Number(process.argv[2]) || 54329);
    console.log(`Supabase stand-in on http://127.0.0.1:${s.port}  (publishable key: ${PUBLISHABLE_KEY})`);
    console.log('Add a disposable test user: curl -X POST -d \'{"email":"a@example.test","password":"test-pass-1"}\' http://127.0.0.1:' + s.port + '/__standin/users');
  })();
}
