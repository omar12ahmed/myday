// The AI planner's server side, without Supabase: the Edge Function's real code (supabase/functions/ai-plan/handler.ts)
// and the limits in the database (supabase/migrations/20261003120000_ai_usage.sql, run in PGlite with disposable
// accounts). No real model is called: a mock, or a fake provider.
const path = require('path');
const S = require('./supabase-standin.js');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');
const fails = async fn => { try { await fn(); return null; } catch (e) { return e.message; } };

(async () => {
  const db = await S.createDb();
  const A = await S.addUser(db, 'ai-a@example.test', 'x'), B = await S.addUser(db, 'ai-b@example.test', 'y');
  const sql = (q, p) => S.owner(db, q, p).then(r => r.rows);
  const begin = (who, perDay = 3, usd = 1, reserve = 0.01, minSec = 0) => S.as(db, who, q => q('select public.ai_begin($1, $2, $3, $4) as r', [perDay, usd, reserve, minSec])).then(r => r.rows[0].r);

  console.log('\n[1] Limits in the database: per account, enforced before any model call');
  const t = await sql(`select relrowsecurity from pg_class where relname = 'ai_usage'`);
  check('Row Level Security is on for ai_usage', t[0].relrowsecurity === true);
  const privs = await sql(`select r, p, has_table_privilege(r, 'public.ai_usage', p) as yes from unnest(array['anon','authenticated']) r, unnest(array['SELECT','INSERT','UPDATE','DELETE']) p`);
  check('nobody can read or change the usage table directly', privs.every(x => !x.yes), privs.filter(x => x.yes));
  check('only signed-in accounts may call ai_begin / ai_finish', (await sql(`select has_function_privilege('anon', 'public.ai_begin(integer,numeric,numeric,integer)', 'EXECUTE') as a, has_function_privilege('authenticated', 'public.ai_begin(integer,numeric,numeric,integer)', 'EXECUTE') as b`))[0].b === true
    && /permission denied/.test(await fails(() => begin(null))));
  check('a request is allowed and counted', (await begin(A)).ok === true && (await sql('select requests from public.ai_usage where user_id = $1', [A]))[0].requests === 1);
  await begin(A); await begin(A);
  check('the daily limit stops the next one ("daily")', (await begin(A)).reason === 'daily');
  check('…for that account only', (await begin(B)).ok === true);
  check('asking again too quickly is refused ("too-fast")', (await begin(B, 50, 1, 0.01, 60)).reason === 'too-fast');
  await sql('update public.ai_usage set last_request_at = now() - interval \'2 minutes\', reserved_usd = 0.995 where user_id = $1', [B]);
  check('the monthly budget is enforced with the worst-case cost reserved up front ("budget")', (await begin(B, 50, 1, 0.01, 0)).reason === 'budget');
  const fn = (await sql(`select prosrc from pg_proc where proname = 'ai_begin'`))[0].prosrc;
  check('ai_begin takes a lock on the account before reading any totals (so two requests, even either side of midnight, can\'t both slip under the monthly budget)',
    /pg_advisory_xact_lock\(hashtextextended\('myday-ai:' \|\| v_me::text/.test(fn) && fn.indexOf('pg_advisory_xact_lock') < fn.indexOf('sum(') && fn.indexOf('pg_advisory_xact_lock') < fn.indexOf('for update'));
  // Yesterday's row nearly at the budget: today's first request still sees it (the month's total), and is refused.
  await sql(`insert into public.ai_usage (user_id, day, requests, reserved_usd) values ($1, (now() at time zone 'utc')::date - 1, 1, 0.995) on conflict (user_id, day) do update set reserved_usd = 0.995`, [A]);
  check('the budget counts the whole month, not just today\'s row', (await begin(A, 50, 1, 0.01, 0)).reason === 'budget' || new Date().getUTCDate() === 1);
  await sql(`delete from public.ai_usage where user_id = $1 and day = (now() at time zone 'utc')::date - 1`, [A]);
  check('limits out of range are refused (they come from the server, never the app)', /out of range/.test(await fails(() => begin(A, 100000))));
  await S.as(db, A, q => q('select public.ai_finish($1, $2)', [1200, 80]));
  await S.as(db, A, q => q('select public.ai_finish($1, $2)', [-500, 999999999]));
  const u = (await sql('select input_tokens, output_tokens from public.ai_usage where user_id = $1', [A]))[0];
  check('token counts can only be added, within bounds (negative ignored, huge capped)', Number(u.input_tokens) === 1200 && Number(u.output_tokens) === 80 + 200000, u);
  check('no request content is stored anywhere (counts only)', (await sql(`select column_name from information_schema.columns where table_name = 'ai_usage'`)).every(c => !/note|text|task|context|prompt|reply/.test(c.column_name)));

  console.log('\n[2] The Edge Function (its real code, with test sign-in and limits)');
  const { handle } = await import(path.join(ROOT, 'supabase/functions/ai-plan/handler.ts'));
  const lines = [];
  let env = { AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_MOCK_DELAY_MS: '0', AI_DAILY_LIMIT: '50', AI_MIN_SECONDS_BETWEEN: '0', AI_MONTHLY_BUDGET_USD: '1' };
  let finished = [];
  const verified = [];
  const TOK_C = 'hdr.tok-c.sig', TOK_BAD = 'hdr.tok-bad.sig'; // shaped like sign-in tokens (JWTs: three parts)
  const deps = (over = {}) => ({
    env: n => env[n],
    verifyUser: async tok => { verified.push(tok); return tok === TOK_C ? C : null; },
    begin: async (tok, l) => S.as(db, C, q => q('select public.ai_begin($1, $2, $3, $4) as r', [l.perDay, l.monthlyUsd, l.reserveUsd, l.minSeconds])).then(r => r.rows[0].r),
    finish: async (tok, i, o) => { finished.push([i, o]); },
    log: l => lines.push(l),
    ...over,
  });
  const C = await S.addUser(db, 'ai-c@example.test', 'z');
  const ctx = { version: 1, date: '2026-11-10', weekday: 'Tuesday', now: '09:00', timezone: 'Europe/London', energy: 2, maxPriorities: 1, smallOnly: true, smallMinutes: 20, restDay: false,
    sleep: { lastNight: { start: '2026-11-09T23:00', end: '2026-11-10T07:00', hours: 8 }, tonight: null },
    tasks: [{ id: 'a', title: 'Secret project notes', category: 'learning', minutes: 30, plannedMinutes: 30, done: false, start: null }],
    busy: [{ kind: 'appointment', start: '2026-11-10T11:00', end: '2026-11-10T12:00' }], free: [{ start: '09:00', end: '10:30' }], window: { earliest: '08:00', latest: '21:00' }, revisionDue: 0, note: 'I slept badly' };
  const call = (body, { method = 'POST', token = TOK_C, origin = 'http://localhost:5173', raw } = {}, over) =>
    handle(new Request('https://x/functions/v1/ai-plan', { method, headers: { Authorization: token ? `Bearer ${token}` : '', Origin: origin, 'Content-Type': 'application/json' }, body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined }), deps(over));
  let res = await call(null, { method: 'OPTIONS' });
  check('the browser\'s pre-flight check is answered for MyDay\'s own addresses', res.status === 204 && res.headers.get('Access-Control-Allow-Origin') === 'http://localhost:5173');
  res = await call(null, { method: 'OPTIONS', origin: 'https://evil.example' });
  check('…but not for other websites', !res.headers.get('Access-Control-Allow-Origin'));
  check('no sign-in: refused (401)', (await call({ context: ctx }, { token: '' })).status === 401 && (await call({ context: ctx }, { token: TOK_BAD })).status === 401);
  check('not JSON, or not the expected shape: refused (400)', (await call(null, { raw: 'hello' })).status === 400 && (await call({ context: { ...ctx, tasks: 'all' } })).status === 400 && (await call({ context: { ...ctx, note: 'x'.repeat(201) } })).status === 400);
  check('too big: refused (413)', (await call(null, { raw: JSON.stringify({ context: ctx, pad: 'x'.repeat(20000) }) })).status === 413);
  res = await call({ context: ctx });
  let body = await res.json();
  check('a good request: one suggestion back (the model\'s reply, for the app to check), with token counts', res.status === 200 && body.ok && JSON.parse(body.output).priorities.length === 1 && body.usage.inputTokens > 0);
  check('…its tokens recorded after the call', finished.length === 1 && finished[0][0] > 0);
  check('the logs hold an outcome and a time only — no tasks, notes or sleep', lines.length > 0 && lines.every(l => /^ai-plan \S+ \d{3} \d+ms$/.test(l)) && !lines.join(' ').includes('Secret') && !lines.join(' ').includes('slept'), lines.slice(-2));
  env.AI_DAILY_LIMIT = '1';
  res = await call({ context: ctx });
  check('over the daily limit: refused (429, "daily") before any model call', res.status === 429 && (await res.json()).reason === 'daily');
  env.AI_DAILY_LIMIT = '50'; env.AI_MODEL = 'mock:error';
  res = await call({ context: ctx });
  check('the model failing: a clear error (502), no reply', res.status === 502 && (await res.json()).error === 'unavailable');
  env.AI_MODEL = 'mock:truncated'; finished = [];
  res = await call({ context: ctx });
  check('a reply cut off at the length limit: unsuccessful (502 "truncated") — but its billed tokens are still recorded', res.status === 502 && (await res.json()).detail === 'truncated' && finished.length === 1 && finished[0][1] > 0, finished);
  env = { ...env, AI_MODEL: 'mock:good', AI_PROVIDER: '' };
  check('AI not set up on the server: 503 "not-configured"', (await call({ context: ctx })).status === 503);
  env = { ...env, AI_PROVIDER: 'openai-compatible', AI_BASE_URL: 'https://provider.example/v1', AI_MODEL: 'm', AI_API_KEY: 'sk-test' };
  check('a real model without prices: refused (503) — spending can\'t be limited without them', (await call({ context: ctx })).status === 503);
  env.AI_PRICE_IN_PER_MTOK = '0.5'; env.AI_PRICE_OUT_PER_MTOK = '2';
  let sent = null;
  const fetchImpl = async (url, init) => { sent = { url, init }; return new Response(JSON.stringify({ choices: [{ message: { content: '{"rest":true,"priorities":[],"explanation":"Rest is fine.","missing":[]}' } }], usage: { prompt_tokens: 1000, completion_tokens: 30 } }), { status: 200 }); };
  res = await call({ context: ctx }, {}, { fetchImpl });
  body = await res.json();
  check('a real (here: fake) provider: one bounded request with the key from the server\'s secrets, never from the app', res.status === 200 && sent.init.headers.Authorization === 'Bearer sk-test' && JSON.parse(sent.init.body).max_tokens <= 2048);
  check('…the cost reported from the prices', Math.abs(body.usage.costUsd - (1000 * 0.5 + 30 * 2) / 1e6) < 1e-12);
  const reserved = (await sql('select reserved_usd from public.ai_usage where user_id = $1', [C]))[0].reserved_usd;
  check('…and the worst-case cost was reserved against the monthly budget before calling', Number(reserved) > 0, reserved);

  console.log('\n[3] A caller is verified before anything else, and secrets stay out of Git');
  let begun = 0, provided = 0;
  const spyDeps = { begin: async () => { begun++; return { ok: true }; }, fetchImpl: async () => { provided++; return new Response('{}'); } };
  env = { AI_PROVIDER: 'openai-compatible', AI_BASE_URL: 'https://provider.example/v1', AI_MODEL: 'm', AI_API_KEY: 'sk-test', AI_PRICE_IN_PER_MTOK: '1', AI_PRICE_OUT_PER_MTOK: '1' };
  for (const tok of ['', TOK_BAD]) {
    res = await call({ context: ctx }, { token: tok }, spyDeps);
    check(`${tok ? 'an invalid' : 'no'} token: refused before the request is read, any allowance charged or the model called`, res.status === 401 && begun === 0 && provided === 0);
  }
  // Supabase's platform check lets the publishable or secret key through in the Authorization header; they aren't a
  // sign-in, so they're refused without even asking Auth.
  verified.length = 0;
  for (const tok of [S.PUBLISHABLE_KEY, 'sb_' + 'secret_' + 'made-up-for-tests', 'sb_publishable_a.b.c']) {
    res = await call({ context: ctx }, { token: tok }, spyDeps);
    check(`an API key instead of a sign-in (${tok.slice(0, 14)}…): refused (401), nothing charged, no model call`, res.status === 401 && begun === 0 && provided === 0);
  }
  check('…and never passed to the sign-in check', verified.length === 0, verified);
  // Through the stand-in (whose sign-in check verifies the token's signature, as Supabase Auth does): a forged token.
  const srv = await S.start(db, 0);
  const good = await (await fetch(`http://127.0.0.1:${srv.port}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: S.PUBLISHABLE_KEY }, body: JSON.stringify({ email: 'ai-a@example.test', password: 'x' }) })).json();
  const [h, , sig] = good.access_token.split('.');
  const forgedBody = Buffer.from(JSON.stringify({ sub: B, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const before = (await sql('select count(*)::int as n from public.ai_usage where user_id = $1', [B]))[0].n;
  res = await fetch(`http://127.0.0.1:${srv.port}/functions/v1/ai-plan`, { method: 'POST', headers: { apikey: S.PUBLISHABLE_KEY, Authorization: `Bearer ${h}.${forgedBody}.${sig}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ context: ctx }) });
  check('a forged token (someone else\'s id, a borrowed signature) is refused, and nothing is counted for that account', res.status === 401 && (await sql('select count(*)::int as n from public.ai_usage where user_id = $1', [B]))[0].n === before);
  const viaStandin = headers => fetch(`http://127.0.0.1:${srv.port}/functions/v1/ai-plan`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ context: ctx, user_id: B, account: B, userId: B }) });
  const bRow = async () => JSON.stringify(await sql('select * from public.ai_usage where user_id = $1 order by day', [B]));
  const bBefore = await bRow();
  check('only the publishable key, no sign-in (the "apikey" header alone): refused (401)', (await viaStandin({ apikey: S.PUBLISHABLE_KEY })).status === 401);
  check('the publishable key as the "sign-in" (Authorization: Bearer sb_publishable_…): refused (401)', (await viaStandin({ apikey: S.PUBLISHABLE_KEY, Authorization: `Bearer ${S.PUBLISHABLE_KEY}` })).status === 401);
  const aBefore = (await sql('select coalesce(sum(requests), 0)::int as n from public.ai_usage where user_id = $1', [A]))[0].n;
  res = await viaStandin({ apikey: S.PUBLISHABLE_KEY, Authorization: `Bearer ${good.access_token}` });
  const aAfter = (await sql('select coalesce(sum(requests), 0)::int as n from public.ai_usage where user_id = $1', [A]))[0].n;
  check('another account named in the request (user_id, account, userId): ignored — only the signed-in caller\'s allowance is charged', res.status === 200 && aAfter === aBefore + 1 && (await bRow()) === bBefore, { status: res.status, aBefore, aAfter });
  await srv.close();
  const template = require('fs').readFileSync(path.join(ROOT, 'supabase/ai-secrets.example.env'), 'utf8');
  check('the settings template holds placeholders only (no key, no workspace address)', /^AI_API_KEY=$/m.test(template) && template.includes('YOUR-WORKSPACE-ID') && !/sk-[A-Za-z0-9]{8,}/.test(template) && !/^AI_API_KEY=\S/m.test(template.replace(/^# .*$/gm, '')));
  const ignored = f => { try { require('child_process').execFileSync('git', ['check-ignore', '-q', f], { cwd: ROOT }); return true; } catch { return false; } };
  check('real secrets files under supabase/ are ignored by Git (and the template isn\'t)', ['supabase/.ai-secrets.env', 'supabase/functions/.env', 'supabase/functions/ai-plan/.env.local'].every(ignored) && !ignored('supabase/ai-secrets.example.env'));
  const { configFromEnv } = await import(path.join(ROOT, 'supabase/functions/_shared/ai/providers.ts'));
  const qcfg = configFromEnv(n => ({ ...env, AI_MAX_TOKENS_FIELD: 'max_completion_tokens', AI_EXTRA_BODY: '{"enable_thinking": false}' })[n]);
  const gcfg = configFromEnv(n => ({ ...env, AI_JSON_MODE: 'false', AI_EXTRA_BODY: '{"thinking": {"type": "enabled"}, "reasoning_effort": "low"}' })[n]);
  check('model-specific settings come from the secrets (reply-length field, JSON mode, thinking fields)', qcfg.maxTokensField === 'max_completion_tokens' && qcfg.extraBody.enable_thinking === false && gcfg.jsonMode === false && gcfg.extraBody.reasoning_effort === 'low' && gcfg.maxTokensField === 'max_tokens');

  console.log('\n[4] Ready for a GLM development trial: the settings are the evaluated ones, and the function\'s entry type-checks');
  const fsx = require('fs'), os = require('os'), { execFileSync, spawnSync } = require('child_process');
  const { MAX_OUTPUT_TOKENS_CAP } = await import(path.join(ROOT, 'supabase/functions/_shared/ai/providers.ts'));
  const active = template.split('\n').filter(l => /^[A-Z0-9_]+=/.test(l)).map(l => l.split('=')[0]);
  check('the template: GLM-5.3-Flash on Z.ai\'s general API is the active model, each setting appears once, the key and public key are left empty',
    /^AI_MODEL=glm-5\.3-flash$/m.test(template) && /^AI_BASE_URL=https:\/\/api\.z\.ai\/api\/paas\/v4$/m.test(template) && active.length === new Set(active).size && /^AI_API_KEY=$/m.test(template) && !/^MYDAY_PUBLISHABLE_KEY=\S/m.test(template), active);
  check('the function\'s reply cap allows the evaluated 2048 tokens (and no more)', MAX_OUTPUT_TOKENS_CAP === 2048 && configFromEnv(n => ({ ...env, AI_MAX_OUTPUT_TOKENS: '5000' })[n]).maxOutputTokens === 2048);
  const tmp = fsx.mkdtempSync(path.join(os.tmpdir(), 'myday-secrets-'));
  const FAKE = 'zz-made-up-key-for-tests-only';
  const checkFile = (name, text) => { const f = path.join(tmp, name); fsx.writeFileSync(f, text); const r = spawnSync(process.execPath, [path.join(ROOT, 'supabase/check-ai-secrets.mjs'), f], { encoding: 'utf8' }); return { code: r.status, out: r.stdout + r.stderr }; };
  let r = checkFile('filled.env', template.replace(/^AI_API_KEY=$/m, `AI_API_KEY=${FAKE}`));
  check('the check script: the template with a key filled in is ready, with exactly the evaluated request settings — and the key is never printed', r.code === 0 && /Same request settings as evaluated \("glm-5\.3-flash"/.test(r.out) && /key\s+set \(not shown\)/.test(r.out) && !r.out.includes(FAKE), r.out);
  r = checkFile('empty.env', template);
  check('…an empty key: not ready (exit 1), still comparing the settings', r.code === 1 && /AI_API_KEY is empty/.test(r.out) && /Same request settings as evaluated/.test(r.out), r.out);
  r = checkFile('dupes.env', template.replace(/^AI_API_KEY=$/m, `AI_API_KEY=${FAKE}`) + '\nAI_MAX_OUTPUT_TOKENS=600\nAI_TIMEOUT_MS=25000\n');
  check('…a setting given twice (as the old template did for the reply cap): caught, along with the cap that would differ from the evaluation', r.code === 1 && /AI_MAX_OUTPUT_TOKENS is set twice/.test(r.out) && /reply cap: 600 here, but 2048 was evaluated/.test(r.out), r.out);
  r = checkFile('slow.env', template.replace(/^AI_API_KEY=$/m, `AI_API_KEY=${FAKE}`).replace(/^AI_TIMEOUT_MS=.*$/m, 'AI_TIMEOUT_MS=45000'));
  check('…a time limit as long as the app\'s own (40 s) or longer: caught', r.code === 1 && /keep it under the app's 40000 ms/.test(r.out), r.out);
  r = checkFile('coding.env', template.replace(/^AI_API_KEY=$/m, `AI_API_KEY=${FAKE}`).replace('https://api.z.ai/api/paas/v4', 'https://api.z.ai/api/coding/paas/v4'));
  check('…Z.ai\'s Coding Plan address: caught (Z.ai limits the Coding Plan to its coding tools)', r.code === 1 && /Coding Plan address/.test(r.out), r.out);
  fsx.rmSync(tmp, { recursive: true, force: true });
  // The Deno entry (index.ts) can't run here (no Deno), but it can be type-checked against supabase-js's own types,
  // with Deno's two globals it uses declared.
  const dc = fsx.mkdtempSync(path.join(os.tmpdir(), 'myday-deno-'));
  fsx.writeFileSync(path.join(dc, 'deno.d.ts'), 'declare const Deno: { env: { get(name: string): string | undefined }; serve(handler: (req: Request) => Response | Promise<Response>): unknown };\n');
  fsx.writeFileSync(path.join(dc, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, noEmit: true, target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', allowImportingTsExtensions: true, skipLibCheck: true, types: [], lib: ['ES2022', 'DOM'], paths: { 'npm:@supabase/supabase-js@2': [path.join(ROOT, 'app/node_modules/@supabase/supabase-js')] } }, files: [path.join(ROOT, 'supabase/functions/ai-plan/index.ts'), 'deno.d.ts'] }));
  let tsc = '';
  try { execFileSync(process.execPath, [path.join(ROOT, 'app/node_modules/typescript/bin/tsc'), '-p', path.join(dc, 'tsconfig.json')], { encoding: 'utf8' }); } catch (e) { tsc = (e.stdout || '') + (e.stderr || ''); }
  fsx.rmSync(dc, { recursive: true, force: true });
  check('the Edge Function\'s entry (index.ts) type-checks against supabase-js (not run under Deno here)', tsc === '', tsc.slice(0, 400));
  check('…and an empty public-key setting falls back to the one Supabase provides (|| rather than ??)', /MYDAY_PUBLISHABLE_KEY'\) \|\| Deno\.env\.get\('SUPABASE_ANON_KEY'\) \|\|/.test(fsx.readFileSync(path.join(ROOT, 'supabase/functions/ai-plan/index.ts'), 'utf8')));

  const { pass, fail } = summary();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('HARNESS:', e); process.exit(2); });
