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

  console.log('\n[2b] "Add what\'s on my mind" through the same function and limits');
  const tctx = { version: 1, action: 'tasks', date: '2026-11-10', weekday: 'Tuesday', text: 'car insurance renewal, call the GP, Secret project notes', maxItems: 8 };
  env = { ...env, AI_PROVIDER: 'mock', AI_MODEL: 'mock:good' };
  res = await call({ context: tctx });
  body = await res.json();
  check('a brain dump: 200, the reply passed back for the app to check', res.status === 200 && body.ok && Array.isArray(JSON.parse(body.output).items) && JSON.parse(body.output).items.length === 3, body);
  check('…refused if malformed (extra fields, empty or too-long text, too many tasks asked for) — 400', (await call({ context: { ...tctx, lists: ['x'] } })).status === 400 && (await call({ context: { ...tctx, text: '' } })).status === 400
    && (await call({ context: { ...tctx, text: 'x'.repeat(1501) } })).status === 400 && (await call({ context: { ...tctx, maxItems: 50 } })).status === 400);
  let tsent = null;
  env = { ...env, AI_PROVIDER: 'openai-compatible', AI_BASE_URL: 'https://provider.example/v1', AI_MODEL: 'm', AI_API_KEY: 'sk-test', AI_PRICE_IN_PER_MTOK: '0.5', AI_PRICE_OUT_PER_MTOK: '2' };
  res = await call({ context: tctx }, {}, { fetchImpl: async (url, init) => { tsent = JSON.parse(init.body); return new Response(JSON.stringify({ choices: [{ message: { content: '{"items":[],"notTasks":[],"explanation":"Ok."}' }, finish_reason: 'stop' }], usage: { prompt_tokens: 500, completion_tokens: 20 } }), { status: 200 }); } });
  check('…the model gets the brain-dump instructions (not the day-planning ones), with what you wrote as content', res.status === 200 && /small tasks/.test(tsent.messages[0].content) && !/adjust today's plan/.test(tsent.messages[0].content) && tsent.messages[1].content.includes('call the GP'));
  check('…and it counts towards the same daily limit and budget', Number((await sql('select requests from public.ai_usage where user_id = $1 order by day desc limit 1', [C]))[0].requests) > 0);
  check('the logs still hold only an outcome and a time (nothing you wrote)', lines.every(l => /^ai-plan \S+ \d{3} \d+ms$/.test(l)) && !lines.join(' ').includes('insurance'));
  // Version 2 (1.40.0): a task may come back with a suggested list. Version 1 (an older app) is still answered, without.
  const okReply = async (url, init) => { tsent = JSON.parse(init.body); return new Response(JSON.stringify({ choices: [{ message: { content: '{"items":[],"notTasks":[],"explanation":"Ok."}' }, finish_reason: 'stop' }], usage: { prompt_tokens: 500, completion_tokens: 20 } }), { status: 200 }); };
  const t2 = { ...tctx, version: 2 };
  tsent = null; res = await call({ context: t2 }, {}, { fetchImpl: okReply });
  check('a version 2 brain dump is accepted, and the model gets the instructions with the list rule and "list" in the schema', res.status === 200 && tsent && /"list" \(optional/.test(tsent.messages[0].content) && /"list":\{"type":"string"/.test(tsent.messages[0].content) && tsent.messages[1].content.includes('call the GP'));
  tsent = null; res = await call({ context: tctx }, {}, { fetchImpl: okReply });
  check('a version 1 brain dump is still accepted, and the model gets the old instructions with no list rule and no "list" in the schema', res.status === 200 && tsent && !/"list"/.test(tsent.messages[0].content) && !/Moving house/.test(tsent.messages[0].content) && /small tasks/.test(tsent.messages[0].content));
  tsent = null;
  const r3 = await call({ context: { ...tctx, version: 3 } }, {}, { fetchImpl: okReply });
  const r0 = await call({ context: { ...t2, version: 0 } }, {}, { fetchImpl: okReply });
  const rx = await call({ context: { ...t2, lists: ['Errands'] } }, {}, { fetchImpl: okReply });
  check('version 3 (or 0), and a version 2 request carrying your list names, are refused with 400 before any model call', r3.status === 400 && r0.status === 400 && rx.status === 400 && tsent === null, [r3.status, r0.status, rx.status]);
  env = { ...env, AI_PROVIDER: 'mock', AI_MODEL: 'mock:good' };
  const lctx = { ...t2, text: 'Moving house: book a van, pack the books, cancel the broadband\nCall the GP' };
  res = await call({ context: lctx }); body = await res.json();
  const lout = JSON.parse(body.output);
  check('the practice reply for version 2 can carry lists: "Moving house" on the three tasks after the heading, none on the one on its own line', res.status === 200 && body.ok && lout.items.length === 4 && lout.items.filter(i => i.list === 'Moving house').length === 3 && lout.items.find(i => /GP/.test(i.title)).list === undefined, lout.items);
  res = await call({ context: { ...lctx, version: 1 } }); body = await res.json();
  check('…and the practice reply for version 1 carries none', res.status === 200 && body.ok && JSON.parse(body.output).items.length === 4 && JSON.parse(body.output).items.every(i => !('list' in i)), body.output);

  console.log('\n[2c]AI help with notes through the same function and limits');
  const cctx = { version: 1, action: 'connect', notes: [{ id: 'nA', title: '', text: 'Friday meeting with Sam about the podcast' }, { id: 'nB', title: 'Secret note title', text: 'Wifi password is in the drawer' }],
    projects: [{ id: 'pjPod', title: 'Start a podcast about nursing', summary: 'Short episodes with nurses about shift work.' }] };
  res = await call({ context: cctx }); body = await res.json();
  check('placing notes: 200, the reply passed back for the app to check', res.status === 200 && body.ok && JSON.parse(body.output).notes.length === 2 && JSON.parse(body.output).notes[0].projectId === 'pjPod', body);
  check('…refused if malformed (extra fields, a private flag, no projects, too many notes, over-long text) — 400, before any model call', (await call({ context: { ...cctx, date: '2026-11-10' } })).status === 400
    && (await call({ context: { ...cctx, notes: [{ ...cctx.notes[0], private: true }] } })).status === 400 && (await call({ context: { ...cctx, projects: [] } })).status === 400
    && (await call({ context: { ...cctx, notes: Array.from({ length: 9 }, (_, i) => ({ id: 'n' + i, title: '', text: 'x' })) } })).status === 400
    && (await call({ context: { ...cctx, notes: [{ ...cctx.notes[0], text: 'x'.repeat(601) }] } })).status === 400);
  let csent = null;
  env = { ...env, AI_PROVIDER: 'openai-compatible', AI_BASE_URL: 'https://provider.example/v1', AI_MODEL: 'm', AI_API_KEY: 'sk-test', AI_PRICE_IN_PER_MTOK: '0.5', AI_PRICE_OUT_PER_MTOK: '2' };
  res = await call({ context: cctx }, {}, { fetchImpl: async (url, init) => { csent = JSON.parse(init.body); return new Response(JSON.stringify({ choices: [{ message: { content: '{"notes":[]}' }, finish_reason: 'stop' }], usage: { prompt_tokens: 500, completion_tokens: 10 } }), { status: 200 }); } });
  check('…the model gets the note-placing instructions (not the day-planning ones), with the notes and projects as content', res.status === 200 && /clearly belongs to/.test(csent.messages[0].content) && !/adjust today's plan/.test(csent.messages[0].content) && csent.messages[1].content.includes('Friday meeting with Sam'));
  check('the logs still hold only an outcome and a time (no notes)', lines.every(l => /^ai-plan \S+ \d{3} \d+ms$/.test(l)) && !lines.join(' ').includes('Secret note') && !lines.join(' ').includes('podcast'));
  env = { ...env, AI_PROVIDER: 'mock', AI_MODEL: 'mock:good' };

  console.log('\n[2d] Which model does which job (AI roles, step 2): routing and one fallback');
  const P = await import(path.join(ROOT, 'supabase/functions/_shared/ai/providers.ts'));
  const rctx = { version: 1, action: 'tutor', curriculumVersion: '1.0.0', lessonId: 'lesson.lab-isolation', question: 'Why does a guest need its own network boundary?' };
  const tasksCtx = { version: 1, action: 'tasks', date: '2026-11-10', weekday: 'Tuesday', text: 'Book the dentist', maxItems: 8 };
  const base = { AI_MOCK_DELAY_MS: '0', AI_DAILY_LIMIT: '500', AI_MIN_SECONDS_BETWEEN: '0', AI_MONTHLY_BUDGET_USD: '1' };
  const MAIN = { AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_LABEL: 'Main model' };
  const LEARN = (model = 'mock:good') => ({ AI_LEARN_PROVIDER: 'mock', AI_LEARN_MODEL: model, AI_LEARN_LABEL: 'Learning model', AI_LEARN_MOCK_DELAY_MS: '0' });
  const ask = async (context, over) => { lines.length = 0; const r = await call({ context }, {}, over); return { status: r.status, body: await r.json(), log: lines.slice() }; };
  env = { ...base, ...MAIN };
  let a = await ask(rctx);
  check('with only the main model set up, every job goes to it (as before)', a.status === 200 && a.body.model === 'Main model' && !a.body.fallback && a.log[0].startsWith('ai-plan ok 200'));
  env = { ...base, ...MAIN, ...LEARN(), AI_ROUTES: '{"tutor": "learn"}' };
  a = await ask(rctx);
  check('AI_ROUTES sends the tutor to the learning model', a.status === 200 && a.body.model === 'Learning model' && JSON.parse(a.body.output).lessonId === 'lesson.lab-isolation');
  check('…and every job it doesn\'t name to the main one', (await ask(tasksCtx)).body.model === 'Main model' && (await ask({ ...ctx })).body.model === 'Main model');
  env = { ...base, ...MAIN, AI_ROUTES: '{"tutor": "learn"}' };
  check('a job routed to a learning model that isn\'t set up goes to the main one (no error)', (await ask(rctx)).body.model === 'Main model');
  env = { ...base, ...MAIN, ...LEARN('mock:error'), AI_ROUTES: '{"tutor": "learn"}' };
  a = await ask(rctx);
  check('if the learning model can\'t answer (a provider error), the main one gets one try and answers', a.status === 200 && a.body.model === 'Main model' && a.body.fallback === true);
  check('…logged as which job and which model, never content', a.log.length === 1 && /^ai-plan ok:tutor\/main,after-learn-http 200 \d+ms$/.test(a.log[0]) && !a.log[0].includes('network boundary'), a.log);
  env = { ...base, ...MAIN, ...LEARN('mock:error'), AI_ROUTES: '{"tutor": "learn"}', AI_FALLBACK: 'off' };
  a = await ask(rctx);
  check('AI_FALLBACK=off: no second try (502)', a.status === 502 && /^ai-plan model-http:tutor\/learn 502/.test(a.log[0]), a.log);
  env = { ...base, ...MAIN, AI_MODEL: 'mock:error', ...LEARN('mock:error'), AI_ROUTES: '{"tutor": "learn"}' };
  a = await ask(rctx);
  check('if neither can answer: 502, after exactly one try each', a.status === 502 && /^ai-plan model-http:tutor\/main,after-learn-http 502/.test(a.log[0]), a.log);
  env = { ...base, ...MAIN, ...LEARN('mock:truncated'), AI_ROUTES: '{"tutor": "learn"}' };
  a = await ask(rctx);
  check('a reply cut short (it cost tokens, and says something about the request) is not passed to the other model', a.status === 502 && a.body.detail === 'truncated' && !a.body.fallback);
  env = { ...base, ...MAIN, AI_MODEL: 'mock:error', ...LEARN() };
  check('the fallback works the other way too: the main model failing, the learning one answers', (await ask(tasksCtx)).body.model === 'Learning model');
  env = { ...base, ...MAIN, ...LEARN('mock:slow'), AI_LEARN_TIMEOUT_MS: '2500', AI_TOTAL_TIMEOUT_MS: '3000', AI_ROUTES: '{"tutor": "learn"}' };
  a = await ask(rctx);
  check('all within the app\'s 40 seconds: with too little time left after a time-out, no second try', a.status === 502 && a.body.detail === 'timeout' && !a.body.fallback, a.body);
  env = { ...base, ...MAIN, ...LEARN(), AI_ROUTES: '{"cooking": "learn", "tutor": "learn"}' };
  a = await ask(rctx);
  check('a job this version doesn\'t know in AI_ROUTES (say, from a newer one) is ignored: the others still work as routed', a.status === 200 && a.body.model === 'Learning model', a.body);
  for (const [bad, why] of [[{ AI_ROUTES: '{"tutor": "gemini"}' }, 'an unknown slot'], [{ AI_ROUTES: 'tutor=learn' }, 'not JSON'],
    [{ AI_LEARN_PROVIDER: 'openai-compatible', AI_LEARN_BASE_URL: 'https://x.example', AI_LEARN_MODEL: 'g' }, 'a learning model without its key or prices']]) {
    env = { ...base, ...MAIN, ...bad };
    a = await ask(rctx);
    check(`settings with ${why} are refused (503, not configured), never guessed`, a.status === 503 && a.body.error === 'not-configured');
  }
  // Real-shaped providers (a fake network): both worst cases are rReserved, both calls' tokens recorded.
  const OPEN = (prefix, host, inP, outP) => ({ [prefix + 'PROVIDER']: 'openai-compatible', [prefix + 'BASE_URL']: `https://${host}/v1`, [prefix + 'MODEL']: host, [prefix + 'API_KEY']: 'sk-' + host,
    [prefix + 'PRICE_IN_PER_MTOK']: String(inP), [prefix + 'PRICE_OUT_PER_MTOK']: String(outP), [prefix + 'MAX_OUTPUT_TOKENS']: '1000', [prefix + 'LABEL']: host });
  env = { ...base, ...OPEN('AI_', 'main.example', 0.15, 0.5), ...OPEN('AI_LEARN_', 'learn.example', 0.25, 1.5), AI_ROUTES: '{"tutor": "learn"}' };
  const route = P.routeFor(n => env[n], rctx);
  const both = P.worstCaseCostUsd(route.primary.cfg, rctx) + P.worstCaseCostUsd(route.fallback.cfg, rctx);
  let rReserved = null; const hosts = []; finished = [];
  a = await ask(rctx, {
    begin: async (tok, l) => { rReserved = l.reserveUsd; return { ok: true }; },
    fetchImpl: async (url, init) => {
      hosts.push(new URL(url).host); const sent = JSON.parse(init.body);
      if (url.includes('learn.example')) return new Response('{"error":{"message":"overloaded"}}', { status: 503 });
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ lessonId: 'lesson.lab-isolation', explanation: 'x', nextStep: 'y' }) }, finish_reason: 'stop' }], usage: { prompt_tokens: 700, completion_tokens: 120, total_tokens: 820 }, model: sent.model }));
    },
  });
  check('both models\' worst cases are rReserved up front, since both could be billed', Math.abs(rReserved - both) < 1e-12 && both > P.worstCaseCostUsd(route.primary.cfg, rctx), [rReserved, both]);
  check('the learning model is asked first, then the main one; each request goes to its own address with its own key', hosts.join() === 'learn.example,main.example' && a.body.model === 'main.example' && a.body.fallback === true);
  check('the tokens of both calls are recorded', finished.length === 1 && finished[0][0] === 700 && finished[0][1] === 120);
  console.log('\n[2j] The weekly review in Ask (v16): the review context is checked; the practice reply');
  {
    const A = await import(path.join(ROOT, 'supabase/functions/_shared/ai/ask.ts'));
    const rv = { from: '2026-11-04', to: '2026-11-10', moved: [{ project: 'Hargeisa shop', tasks: 3, milestones: 1, decisions: 0, found: 0, recorded: 0 }, { project: 'Allotment plan', tasks: 1, milestones: 0, decisions: 0, found: 0, recorded: 0 }],
      otherTasks: 2, studySessions: 1, studyMinutes: 25, workouts: 1, waiting: ['“Pay council tax” has moved 3 times'], focus: ['Allotment plan'] };
    const mk = (review, text = 'What pattern do you see in my week?') => ({ version: 1, action: 'ask', date: '2026-11-10', weekday: 'Tuesday', time: '10:00', page: 'review', text, context: { review } });
    check('a valid review context (counts, names, what is waiting, the focus) is accepted', A.checkAskContext(mk(rv)) === true);
    check('…and so is a quiet week with nothing moved, waiting or in focus', A.checkAskContext(mk({ ...rv, moved: [], waiting: [], focus: [] })) === true);
    const bad = (why, r) => check(`…but ${why} is refused`, A.checkAskContext(mk(r)) === false);
    bad('a count that is not a whole number (2.5 tasks)', { ...rv, moved: [{ ...rv.moved[0], tasks: 2.5 }] });
    bad('a negative count', { ...rv, moved: [{ ...rv.moved[0], milestones: -1 }] });
    bad('a count given as text', { ...rv, otherTasks: '2' });
    bad('more than 20 projects moved', { ...rv, moved: Array.from({ length: 21 }, (_, i) => ({ ...rv.moved[0], project: 'Project ' + i })) });
    check('…but exactly 20 projects moved are accepted', A.checkAskContext(mk({ ...rv, moved: Array.from({ length: 20 }, (_, i) => ({ ...rv.moved[0], project: 'Project ' + i })) })) === true);
    bad('6 things waiting', { ...rv, waiting: Array.from({ length: 6 }, (_, i) => 'Waiting ' + i) });
    bad('4 projects in focus', { ...rv, focus: ['A', 'B', 'C', 'D'] });
    bad('an extra field on the review', { ...rv, extra: 'x' });
    bad('an extra field on a project that moved', { ...rv, moved: [{ ...rv.moved[0], title: 'Task titles' }] });
    const sys = A.buildAskMessages(mk(rv)).map(m => m.content).join('\n').replace(/\s+/g, ' ');
    check('the instructions are version myday-ask-v21', A.ASK_PROMPT_VERSION === 'myday-ask-v21', A.ASK_PROMPT_VERSION);
    check('…and have the week-in-review part: what pattern do you see, answer with no items, "never guess why"', sys.includes('A week in review') && sys.includes('what pattern you see') && sys.includes('never guess why') && sys.includes('No items'), sys.slice(0, 200));
    const m1 = JSON.parse(A.mockAsk(mk(rv)));
    check('the practice version answers "What pattern do you see in my week?" with kind "answer" and no items', m1.kind === 'answer' && Array.isArray(m1.items) && m1.items.length === 0 && m1.action === null, m1);
    check('…naming the project the week went into most, and that one thing is waiting', m1.message.includes('“Hargeisa shop”') && !m1.message.includes('Allotment') && m1.message.includes('1 thing is waiting'), m1.message);
    const m2 = JSON.parse(A.mockAsk(mk({ ...rv, moved: [], waiting: [], focus: [] })));
    check('with nothing moved it says it was a quiet week, and does not mention anything waiting', m2.kind === 'answer' && m2.items.length === 0 && m2.message.includes('a quiet week') && !m2.message.includes('waiting'), m2.message);
  }
  console.log('\n[2k] Lookups in Ask (v17–v19, specs/ai-tools.md §3): the request, the instructions, the reply, the practice version');
  {
    const A = await import(path.join(ROOT, 'supabase/functions/_shared/ai/ask.ts'));
    const base = { version: 1, action: 'ask', date: '2026-11-10', weekday: 'Tuesday', time: '10:00', page: 'today', text: 'What did I write about the bike rack?', context: {} };
    const found = { tool: 'notes', query: 'bike rack', notes: [{ id: 'n1', title: 'Shed sizes', project: 'Garden shed', snippet: '…a bike rack on the left wall…' }, { id: 'n2', title: 'Loose idea', project: null, snippet: null }], found: 2, titlesOnly: false };
    check('a request that says it can look in notes is accepted, and so is one without', A.checkAskContext({ ...base, can: ['notes'] }) === true && A.checkAskContext(base) === true);
    check('…and the second request, carrying what was found', A.checkAskContext({ ...base, can: ['notes'], lookup: found }) === true);
    const bad = (why, c) => check(`…but ${why} is refused`, A.checkAskContext(c) === false);
    bad('a tool it doesn\'t know', { ...base, can: ['web'] });
    bad('a count of private notes that matched (that never leaves the device)', { ...base, lookup: { ...found, leftOut: 1 } });
    bad('a found note with extra fields (its text, private)', { ...base, lookup: { ...found, notes: [{ ...found.notes[0], text: 'all of it' }] } });
    bad('9 notes', { ...base, lookup: { ...found, notes: Array.from({ length: 9 }, (_, i) => ({ ...found.notes[1], id: 'n' + i })) } });
    bad('a snippet over 200 characters', { ...base, lookup: { ...found, notes: [{ ...found.notes[0], snippet: 'x'.repeat(201) }] } });
    bad('search words over 60 characters', { ...base, lookup: { ...found, query: 'x'.repeat(61) } });
    const sysOf = c => A.buildAskMessages(c)[0].content.replace(/\s+/g, ' '); // line breaks don't matter
    const offer = sysOf({ ...base, can: ['notes'] }), plain = sysOf(base), after = sysOf({ ...base, can: ['notes'], lookup: found });
    check('the instructions offer a lookup only when the app says it can', offer.includes('"lookup"') && offer.includes('1–4 key words') && !plain.includes('Looking in their notes'));
    check('…and, with what was found, answer from those notes only, cite them in "sources" and never look again', after.includes('Answer from those notes (and the page\'s data) only') && after.includes('"sources"') && after.includes('Never reply "lookup" again') && !after.includes('1–4 key words'));
    const lk = A.readAsk(JSON.stringify({ kind: 'lookup', message: 'Looking in your notes for that.', lookup: { tool: 'notes', query: 'bike rack' } }));
    check('a lookup reply is read: what to look in and the words', lk && lk.kind === 'lookup' && lk.lookup.tool === 'notes' && lk.lookup.query === 'bike rack' && lk.items.length === 0 && lk.action === null, lk);
    check('…but not without words', A.readAsk(JSON.stringify({ kind: 'lookup', message: 'x', lookup: { tool: 'notes', query: ' ' } })) === null);
    check('…nor for something it can\'t look in (an unknown tool is never taken as notes)', A.readAsk(JSON.stringify({ kind: 'lookup', message: 'x', lookup: { tool: 'day', query: 'tomorrow' } })) === null);
    const ans = A.readAsk(JSON.stringify({ kind: 'answer', message: 'Your shed note mentions it.', items: [], action: null, sources: ['n1', 7, '', 'x'.repeat(65)] }));
    check('an answer\'s "sources" are read as note ids (only strings of a sensible length)', ans.sources.join() === 'n1', ans.sources);
    const m1 = JSON.parse(A.mockAsk({ ...base, can: ['notes'] }));
    check('the practice version looks in your notes for "what did I write about the bike rack?"', m1.kind === 'lookup' && m1.lookup.query === 'bike rack', m1);
    check('…but not when the app doesn\'t say it can', JSON.parse(A.mockAsk(base)).kind !== 'lookup');
    const m2 = JSON.parse(A.mockAsk({ ...base, can: ['notes'], lookup: found }));
    check('…and, with what was found, answers naming the notes, with their ids as sources', m2.kind === 'answer' && m2.message.includes('“Shed sizes”') && m2.sources.join() === 'n1,n2', m2);
    const m3 = JSON.parse(A.mockAsk({ ...base, can: ['notes'], lookup: { ...found, notes: [], found: 0 } }));
    check('…or says plainly that nothing matched', m3.kind === 'answer' && m3.message.includes('nothing in your notes matches “bike rack”'), m3.message);
    // "Your day" (v18): one day as the app sees it — busy times by kind only, never a name.
    const day = { tool: 'day', query: '2026-11-12', weekday: 'Thursday', planned: true, rest: false, energy: 3, tasks: [{ title: 'Order the felt', minutes: 20, done: false, time: '10:00' }], minutesLeft: 20,
      due: ['Post the parcel'], busy: [{ kind: 'appointment', start: '2026-11-12T15:00', end: '2026-11-12T16:00' }, { kind: 'work', start: '2026-11-12T07:00', end: '2026-11-12T12:00' }], free: [{ start: '12:30', end: '14:30' }] };
    check('a day lookup is accepted (the app saying it can look at a day too)', A.checkAskContext({ ...base, can: ['notes', 'day'], lookup: day }) === true);
    bad('a busy time with a name (an appointment\'s title never goes)', { ...base, lookup: { ...day, busy: [{ ...day.busy[0], title: 'Dentist' }] } });
    bad('a busy time of a kind it doesn\'t know', { ...base, lookup: { ...day, busy: [{ ...day.busy[0], kind: 'secret' }] } });
    bad('a day that isn\'t a date', { ...base, lookup: { ...day, query: 'Thursday' } });
    bad('a planned task with its id or project (only title, minutes, done, time)', { ...base, lookup: { ...day, tasks: [{ ...day.tasks[0], projectId: 'pj1' }] } });
    bad('a day that doesn\'t exist (31 November)', { ...base, lookup: { ...day, query: '2026-11-31' } });
    bad('a month that doesn\'t exist (and it\'s refused, not an error)', { ...base, lookup: { ...day, query: '2026-13-01' } });
    bad('21 planned tasks', { ...base, lookup: { ...day, tasks: Array.from({ length: 21 }, () => day.tasks[0]) } });
    bad('21 due tasks', { ...base, lookup: { ...day, due: Array.from({ length: 21 }, (_, i) => 'Due ' + i) } });
    bad('41 busy times', { ...base, lookup: { ...day, busy: Array.from({ length: 41 }, () => day.busy[0]) } });
    bad('25 free times', { ...base, lookup: { ...day, free: Array.from({ length: 25 }, () => day.free[0]) } });
    bad('a task title over 120 characters', { ...base, lookup: { ...day, tasks: [{ ...day.tasks[0], title: 'x'.repeat(121) }] } });
    bad('an energy of 6', { ...base, lookup: { ...day, energy: 6 } });
    bad('a day without the minutes still to do', { ...base, lookup: (({ minutesLeft, ...rest }) => rest)(day) });
    bad('minutes still to do that aren\'t a whole number', { ...base, lookup: { ...day, minutesLeft: 12.5 } });
    check('…while 20 tasks of 600 minutes (the longest a task can be) still go', A.checkAskContext({ ...base, lookup: { ...day, tasks: Array.from({ length: 20 }, () => ({ ...day.tasks[0], minutes: 600 })), minutesLeft: 12000 } }) === true);
    bad('more minutes still to do than any plan can have', { ...base, lookup: { ...day, minutesLeft: 12001 } });
    check('…while 20 tasks, 40 busy times and 24 free times, energy 1 and an empty rest day are accepted', A.checkAskContext({ ...base, lookup: { ...day, energy: 1, tasks: Array.from({ length: 20 }, () => day.tasks[0]), busy: Array.from({ length: 40 }, () => day.busy[0]), free: Array.from({ length: 24 }, () => day.free[0]) } }) === true
      && A.checkAskContext({ ...base, lookup: { ...day, planned: false, rest: true, energy: null, tasks: [], minutesLeft: 0, due: [], busy: [], free: [] } }) === true);
    const today = { energy: 2, freeMinutes: 150, plan: [{ id: 'u1', title: 'Batch cook', minutes: 45, done: false }, { id: 'u2', title: 'Gym', minutes: 60, done: true }], dueToday: [] };
    check('Today\'s minutes still to do are accepted (v18), and Today without them too (an older app)', A.checkAskContext({ ...base, context: { today: { ...today, minutesLeft: 45 } } }) === true && A.checkAskContext({ ...base, context: { today } }) === true);
    bad('Today\'s minutes still to do below 0', { ...base, context: { today: { ...today, minutesLeft: -5 } } });
    const offerDay = sysOf({ ...base, can: ['notes', 'day'] }), afterDay = sysOf({ ...base, can: ['notes', 'day'], lookup: day });
    check('the instructions offer a day lookup only when the app says it can look at a day', offerDay.includes('"tool":"day"') && !offer.includes('"tool":"day"'));
    check('…and, with the day, answer from it only and never guess what an appointment is for', afterDay.includes('Answer from that day only') && afterDay.includes('Never guess what an appointment or a shift is for') && afterDay.includes('Never reply "lookup" again'));
    check('…its times exactly as sent, and MyDay plans today only: never offer to plan another day, nor to add what\'s already due', afterDay.includes('giving each time exactly as in "busy" and "free"') && afterDay.includes('MyDay builds a plan only for today: never offer to plan or build another day') && afterDay.includes('The "due" tasks already exist: never offer to add them again.'));
    check('any answer: how much is left on a plan comes from "minutesLeft", never the model\'s own sum, and done tasks aren\'t still to do', plain.includes('a task that\'s done is finished, so never count it as still to do, and for how much is left on a plan use "minutesLeft", never your own sum.'));
    check('…and a day that has passed is told as what was on it, not when they\'re free', afterDay.includes('If that day is before the given date, it has passed: say what was on it, not when they\'re free.'));
    check('…and after a notes lookup, don\'t guess why nothing matched (the quality review\'s point)', after.includes('don\'t guess why nothing matched'));
    const dl = A.readAsk(JSON.stringify({ kind: 'lookup', message: 'Looking at that day.', lookup: { tool: 'day', query: '2026-11-12' } }));
    check('a day lookup reply is read with its date', dl && dl.lookup.tool === 'day' && dl.lookup.query === '2026-11-12', dl);
    check('…but not with a day that isn\'t a date', A.readAsk(JSON.stringify({ kind: 'lookup', message: 'x', lookup: { tool: 'day', query: 'Thursday' } })) === null);
    check('…nor one that doesn\'t exist', A.readAsk(JSON.stringify({ kind: 'lookup', message: 'x', lookup: { tool: 'day', query: '2026-11-31' } })) === null);
    const md1 = JSON.parse(A.mockAsk({ ...base, text: 'Am I free on Thursday?', can: ['notes', 'day'] }));
    check('the practice version looks at Thursday (from Tuesday 10 November: the 12th)', md1.kind === 'lookup' && md1.lookup.tool === 'day' && md1.lookup.query === '2026-11-12', md1);
    const md2 = JSON.parse(A.mockAsk({ ...base, text: 'Am I free on Thursday?', can: ['notes', 'day'], lookup: day }));
    check('…and, with the day, says what\'s on and how much is free', md2.kind === 'answer' && md2.message.includes('Thursday has 1 task planned and 1 appointment'), md2.message);
    // "A project's context" (v19): one open project, as its page sends it — never its decision or one page, never more.
    const proj = { tool: 'project', query: 'pj1', project: { id: 'pj1', title: 'Garden shed', summary: 'A shed for the bikes', stage: 'explore', tasks: [{ id: 't1', title: 'Order the felt', done: false }], notes: ['Shed sizes'], milestones: [{ id: 'm1', title: 'Base laid', reached: false, aim: null }] } };
    check('a project lookup is accepted (the app saying it can look at a project too)', A.checkAskContext({ ...base, can: ['notes', 'day', 'project'], lookup: proj }) === true);
    bad('a looked-at project carrying its outcome', { ...base, lookup: { ...proj, project: { ...proj.project, outcome: 'x' } } });
    bad('a looked-at project carrying a decision (that goes only from its own page)', { ...base, lookup: { ...proj, project: { ...proj.project, decision: { id: 'd1', question: 'Which wood?', options: [] } } } });
    bad('a looked-at project that isn\'t the one asked for', { ...base, lookup: { ...proj, query: 'pj2' } });
    bad('a project lookup with anything more (a count of private notes)', { ...base, lookup: { ...proj, leftOut: 1 } });
    check('…while a project\'s own page may still carry its decision', A.checkAskContext({ ...base, page: 'project', context: { project: { ...proj.project, decision: { id: 'd1', question: 'Which wood?', options: [] } } } }) === true);
    const offerProj = sysOf({ ...base, can: ['notes', 'day', 'project'] }), afterProj = sysOf({ ...base, can: ['notes', 'day', 'project'], lookup: proj });
    check('the instructions offer a project lookup only when the app says it can, by its id from "projects"', offerProj.includes('"tool":"project"') && offerProj.includes('the query that project\'s id exactly as in "projects"') && !offerDay.includes('"tool":"project"'));
    check('…and, with the project, answer as on its page, from its data only, and never look again', afterProj.includes('Answer about that project as if they had asked on its page') && afterProj.includes('Its tasks already exist: to suggest one, name it — never put it in "items".') && afterProj.includes('Its decisions and its one page aren\'t here') && afterProj.includes('Never reply "lookup" again'));
    const pl = A.readAsk(JSON.stringify({ kind: 'lookup', message: 'Looking at that project.', lookup: { tool: 'project', query: 'pj1' } }));
    check('a project lookup reply is read with its id', pl && pl.lookup.tool === 'project' && pl.lookup.query === 'pj1', pl);
    check('…but not with a name instead of an id', A.readAsk(JSON.stringify({ kind: 'lookup', message: 'x', lookup: { tool: 'project', query: 'the garden shed' } })) === null);
    const mp1 = JSON.parse(A.mockAsk({ ...base, text: "What's next on the garden shed?", can: ['notes', 'day', 'project'], context: { projects: [{ id: 'pj1', title: 'Garden shed' }] } }));
    check('the practice version looks at the open project named', mp1.kind === 'lookup' && mp1.lookup.tool === 'project' && mp1.lookup.query === 'pj1', mp1);
    const mp2 = JSON.parse(A.mockAsk({ ...base, text: "What's next on the garden shed?", can: ['notes', 'day', 'project'], lookup: proj }));
    check('…and, with the project, says where it is and the next task', mp2.kind === 'answer' && mp2.message.includes('“Garden shed” is at explore, with 0 of 1 tasks done. Next: “Order the felt”'), mp2.message);
    // "Open decisions" (v20): questions, options with counts, when opened — never what a pro or con says, never more.
    const decs = { tool: 'decisions', query: 'all', decisions: [{ id: 'd1', projectId: 'pj1', project: 'Garden shed', question: 'Which roof?', options: ['Felt', 'Tin'], gaps: ['“Felt” has no cons yet', '“Tin” has no pros yet'], since: '2026-11-01', reopened: false }],
      mustBeTrue: [{ id: 'a1', projectId: 'pj2', project: 'Corner café', text: 'People want oat milk' }], found: { decisions: 1, mustBeTrue: 1 } };
    check('a decisions lookup is accepted (the app saying it can look at open decisions too)', A.checkAskContext({ ...base, can: ['notes', 'day', 'project', 'decisions'], lookup: decs }) === true);
    bad('an option carrying its pros (options are their text only)', { ...base, lookup: { ...decs, decisions: [{ ...decs.decisions[0], options: [{ text: 'Felt', pros: ['Cheap'] }] }] } });
    bad('a decision from another project than the one asked for', { ...base, lookup: { ...decs, query: 'pj9' } });
    bad('fewer found than sent', { ...base, lookup: { ...decs, found: { decisions: 0, mustBeTrue: 1 } } });
    bad('a decision carrying its reason', { ...base, lookup: { ...decs, decisions: [{ ...decs.decisions[0], why: 'x' }] } });
    bad('a must-be-true item carrying what was found', { ...base, lookup: { ...decs, mustBeTrue: [{ ...decs.mustBeTrue[0], found: 'x' }] } });
    bad('9 decisions', { ...base, lookup: { ...decs, decisions: Array.from({ length: 9 }, (_, i) => ({ ...decs.decisions[0], id: 'd' + i })) } });
    bad('a decision with 5 options', { ...base, lookup: { ...decs, decisions: [{ ...decs.decisions[0], options: Array.from({ length: 5 }, (_, i) => 'Option ' + i) }] } });
    bad('a decisions lookup with a count of private ones', { ...base, lookup: { ...decs, leftOut: 1 } });
    const offerDec = sysOf({ ...base, can: ['notes', 'day', 'project', 'decisions'] }), afterDec = sysOf({ ...base, can: ['notes', 'day', 'project', 'decisions'], lookup: decs });
    check('the instructions offer a decisions lookup only when the app says it can', offerDec.includes('"tool":"decisions","query":"all"') && !offerProj.includes('"tool":"decisions"'));
    check('…and, with them, never pick, rank or hint at a winner, never claim what a pro or con says, and cite them', afterDec.includes('NEVER say which option is best, never rank, score,') && afterDec.includes('Never claim what a pro or con says') && afterDec.includes('"sources"') && afterDec.includes('Never reply "lookup" again'));
    const dlr = A.readAsk(JSON.stringify({ kind: 'lookup', message: 'Looking at your open decisions.', lookup: { tool: 'decisions', query: 'all' } }));
    check('a decisions lookup reply is read: all, or a project\'s id', dlr && dlr.lookup.tool === 'decisions' && dlr.lookup.query === 'all' && A.readAsk(JSON.stringify({ kind: 'lookup', message: 'x', lookup: { tool: 'decisions', query: 'pj1' } }))?.lookup.query === 'pj1'
      && A.readAsk(JSON.stringify({ kind: 'lookup', message: 'x', lookup: { tool: 'decisions', query: 'my garden shed' } })) === null);
    const md3 = JSON.parse(A.mockAsk({ ...base, text: 'Which decisions am I putting off?', can: ['notes', 'day', 'project', 'decisions'] }));
    check('the practice version looks at your open decisions', md3.kind === 'lookup' && md3.lookup.tool === 'decisions' && md3.lookup.query === 'all', md3);
    const md4 = JSON.parse(A.mockAsk({ ...base, text: 'Which decisions am I putting off?', can: ['notes', 'day', 'project', 'decisions'], lookup: decs }));
    check('…and, with them, says how many and the oldest, citing them', md4.kind === 'answer' && md4.message.includes('one decision is open — the oldest is “Which roof?” (Garden shed), since 2026-11-01') && md4.sources.join() === 'd1', md4);
    // "What you're waiting on" (v21): titles, projects, since and until — never who or what, never a count of days.
    const wait = { tool: 'waiting', query: 'all', found: 2, tasks: [{ id: 't1', title: 'Deposit back', projectId: null, project: null, since: '2026-10-28', until: null, chased: false },
      { id: 't2', title: 'Ask about the armchair', projectId: 'pj1', project: 'Garden shed', since: '2026-11-02', until: '2026-11-09', chased: true }] };
    check('a waiting lookup is accepted (the app saying it can look at what you\'re waiting on too)', A.checkAskContext({ ...base, can: ['notes', 'day', 'project', 'decisions', 'waiting'], lookup: wait }) === true);
    bad('a waiting task carrying who it waits on', { ...base, lookup: { ...wait, tasks: [{ ...wait.tasks[0], on: 'Priya' }] } });
    bad('a waiting task with a project id but no project name', { ...base, lookup: { ...wait, tasks: [{ ...wait.tasks[0], projectId: 'pj1' }] } });
    bad('9 waiting tasks', { ...base, lookup: { ...wait, found: 9, tasks: Array.from({ length: 9 }, (_, i) => ({ ...wait.tasks[0], id: 't' + i })) } });
    bad('fewer found than sent', { ...base, lookup: { ...wait, found: 1 } });
    bad('a task of another project than the one asked for', { ...base, lookup: { ...wait, query: 'pj1' } });
    bad('a waiting lookup with a count of private ones', { ...base, lookup: { ...wait, leftOut: 1 } });
    const offerWait = sysOf({ ...base, can: ['notes', 'day', 'project', 'decisions', 'waiting'] }), afterWait = sysOf({ ...base, can: ['notes', 'day', 'project', 'decisions', 'waiting'], lookup: wait });
    check('the instructions offer a waiting lookup only when the app says it can, and decisions no longer claim "waiting"', offerWait.includes('"tool":"waiting","query":"all"') && !offerDec.includes('"tool":"waiting"') && offerWait.includes('which decisions are open or being put off'));
    check('…and, with them, days as dates — never a count, never overdue — never guess who, a "Chase:" task only when its day has come', afterWait.includes('never count days or weeks, and never say overdue, late or behind') && afterWait.includes('that\'s kept on the task and never shared with Ask MyDay — say so, and never guess') && afterWait.includes('never for one already chased')
      && afterWait.includes('titled "Chase: " and that task\'s title') && afterWait.includes('Never reply "lookup" again'));
    const wlr = A.readAsk(JSON.stringify({ kind: 'lookup', message: 'Looking at what you’re waiting on.', lookup: { tool: 'waiting', query: 'all' } }));
    check('a waiting lookup reply is read: all, or a project\'s id', wlr && wlr.lookup.tool === 'waiting' && wlr.lookup.query === 'all' && A.readAsk(JSON.stringify({ kind: 'lookup', message: 'x', lookup: { tool: 'waiting', query: 'who is it' } })) === null);
    const mw1 = JSON.parse(A.mockAsk({ ...base, text: 'What am I waiting on?', can: ['notes', 'day', 'project', 'decisions', 'waiting'] }));
    check('the practice version looks at what you\'re waiting on', mw1.kind === 'lookup' && mw1.lookup.tool === 'waiting' && mw1.lookup.query === 'all', mw1);
    const mw2 = JSON.parse(A.mockAsk({ ...base, text: 'What am I waiting on?', can: ['notes', 'day', 'project', 'decisions', 'waiting'], lookup: wait }));
    check('…and, with them, says how many and the oldest, citing them', mw2.kind === 'answer' && mw2.message.includes('2 tasks are waiting — the oldest is “Deposit back”, since 2026-10-28') && mw2.sources.join() === 't1,t2', mw2);
  }
  env = { AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_MOCK_DELAY_MS: '0', AI_DAILY_LIMIT: '50', AI_MIN_SECONDS_BETWEEN: '0', AI_MONTHLY_BUDGET_USD: '1' };

  console.log('\n[2e] AI-written revision cards: a writer, then a checker (AI roles step 3, B)');
  const kctx = { version: 1, action: 'cards', curriculumVersion: '1.0.0', lessonId: 'lesson.lab-isolation', count: 6, existing: ['Is a VM snapshot a substitute for independent backup?'] };
  const kbase = { AI_MOCK_DELAY_MS: '0', AI_DAILY_LIMIT: '500', AI_MIN_SECONDS_BETWEEN: '0', AI_MONTHLY_BUDGET_USD: '1' };
  const kMain = { AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_LABEL: 'Main model' };
  const kLearn = (model = 'mock:good') => ({ AI_LEARN_PROVIDER: 'mock', AI_LEARN_MODEL: model, AI_LEARN_LABEL: 'Learning model', AI_LEARN_MOCK_DELAY_MS: '0' });
  const kask = async (context, over) => { lines.length = 0; finished = []; const r = await call({ context }, {}, over); return { status: r.status, body: await r.json(), log: lines.slice() }; };
  env = { ...kbase, ...kMain, ...kLearn(), AI_ROUTES: '{"cards": "learn"}' };
  let k = await kask(kctx);
  const kout = k.status === 200 ? JSON.parse(k.body.output) : null;
  check('cards: the routed model writes and the other one checks, in one request (200)', k.status === 200 && k.body.model === 'Learning model' && k.body.checker === 'Main model' && kout.lessonId === kctx.lessonId, k.body);
  check('…as many cards as asked for, each with the checker\'s verdict', kout && kout.cards.length === 6 && kout.verdicts.length === 6 && kout.verdicts.every((v, i) => v.index === i && v.verdict === 'keep'));
  check('…both calls\' tokens recorded, and the log names the job and both models, no content', finished.length === 1 && finished[0][0] > 0 && /^ai-plan ok:cards\/learn\+main 200 \d+ms$/.test(k.log[0]) && !k.log[0].includes('snapshot'), k.log);
  env = { ...kbase, ...kMain };
  k = await kask(kctx);
  check('with only one model set up, no cards at all: nothing reaches you unchecked (503)', k.status === 503 && k.body.error === 'no-checker');
  env = { ...kbase, ...kMain, AI_MODEL: 'mock:error', ...kLearn(), AI_ROUTES: '{"cards": "learn"}' };
  k = await kask(kctx);
  check('if the checker can\'t answer, no cards (502 "unchecked"), though the writer\'s tokens are recorded', k.status === 502 && k.body.detail === 'unchecked' && finished.length === 1 && finished[0][0] > 0, k.body);
  env = { ...kbase, ...kMain, ...kLearn('mock:error'), AI_ROUTES: '{"cards": "learn"}' };
  k = await kask(kctx);
  check('if the writer can\'t answer, no cards and no checker call (502)', k.status === 502 && /cards-writer-http:learn/.test(k.log[0]), k.log);
  env = { ...kbase, ...kMain, ...kLearn('mock:sloppy'), AI_ROUTES: '{"cards": "learn"}' };
  k = await kask(kctx);
  check('a malformed card from the writer is left out (and counted), never repaired', k.status === 200 && JSON.parse(k.body.output).leftOut === 1 && JSON.parse(k.body.output).cards.length === 6);
  env = { ...kbase, ...kMain, ...kLearn(), AI_ROUTES: '{"cards": "learn"}' };
  for (const [bad, why] of [[{ ...kctx, count: 11 }, 'more than 10 cards'], [{ ...kctx, count: 0 }, 'no cards'], [{ ...kctx, lessonId: 'lesson.missing' }, 'an unknown lesson'],
    [{ ...kctx, existing: Array.from({ length: 41 }, (_, i) => 'Q' + i) }, 'too many existing questions'], [{ ...kctx, notes: 'private' }, 'an extra field'], [{ version: 1, action: 'cards-check', lessonId: 'lesson.lab-isolation', cards: [] }, 'a checker request from outside']]) {
    k = await kask(bad);
    check(`cards: ${why} — refused (400) before any model call`, k.status === 400 && finished.length === 0);
  }
  // Real-shaped providers (a fake network): both worst cases reserved; the writer's and the checker's addresses and instructions.
  const kOPEN = (prefix, host, inP, outP) => ({ [prefix + 'PROVIDER']: 'openai-compatible', [prefix + 'BASE_URL']: `https://${host}/v1`, [prefix + 'MODEL']: host, [prefix + 'API_KEY']: 'sk-' + host,
    [prefix + 'PRICE_IN_PER_MTOK']: String(inP), [prefix + 'PRICE_OUT_PER_MTOK']: String(outP), [prefix + 'LABEL']: host });
  env = { ...kbase, ...kOPEN('AI_', 'main.example', 0.15, 0.5), ...kOPEN('AI_LEARN_', 'learn.example', 0.75, 3.75), AI_ROUTES: '{"cards": "learn"}' };
  let kres = null; const ksent = [];
  const draft = JSON.stringify({ lessonId: 'lesson.lab-isolation', cards: [{ kind: 'written', prompt: 'Why snapshot first?', answer: 'To recover.', explanation: 'A snapshot is a restore point.' }] });
  k = await kask(kctx, {
    begin: async (tok, l) => { kres = l.reserveUsd; return { ok: true }; },
    fetchImpl: async (url, init) => { const body = JSON.parse(init.body); ksent.push({ host: new URL(url).host, system: body.messages[0].content, maxTokens: body.max_tokens });
      const content = url.includes('learn.example') ? draft : JSON.stringify({ verdicts: [{ index: 0, verdict: 'drop', reason: 'Too vague.' }] });
      return new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }], usage: { prompt_tokens: 500, completion_tokens: 200, total_tokens: 700 } })); },
  });
  check('the writer gets the writing instructions and the checker the checking ones, each at its own address', ksent.length === 2 && ksent[0].host === 'learn.example' && /You write revision cards/.test(ksent[0].system) && ksent[1].host === 'main.example' && /You check revision cards/.test(ksent[1].system));
  check('…with a reply cap large enough for ten cards (writer 6000, checker 3000 tokens)', ksent[0].maxTokens === 6000 && ksent[1].maxTokens === 3000, ksent.map(x => x.maxTokens));
  check('…both models\' worst cases reserved before either call', kres > 0.02 && kres < 0.05, kres);
  check('…and the checker\'s "drop" comes back with its reason, for the app to act on', k.status === 200 && JSON.parse(k.body.output).verdicts[0].verdict === 'drop' && JSON.parse(k.body.output).verdicts[0].reason === 'Too vague.');
  // A checker that thinks harder than its model does for other jobs (CHECKER_EXTRA_BODY): only when it checks cards.
  env = { ...kbase, ...kOPEN('AI_', 'main.example', 0.15, 0.5), AI_EXTRA_BODY: '{"reasoning_effort": "low"}', AI_CHECKER_EXTRA_BODY: '{"reasoning_effort": "high"}',
    ...kOPEN('AI_LEARN_', 'learn.example', 0.75, 3.75), AI_LEARN_EXTRA_BODY: '{"reasoning_effort": "low"}', AI_ROUTES: '{"cards": "learn"}' };
  const effort = []; const fakeEffort = { begin: async () => ({ ok: true }), fetchImpl: async (url, init) => { const body = JSON.parse(init.body); effort.push(`${new URL(url).host}:${body.reasoning_effort}`);
    const content = /You write revision cards/.test(body.messages[0].content) ? draft : /You check revision cards/.test(body.messages[0].content) ? JSON.stringify({ verdicts: [{ index: 0, verdict: 'keep', reason: 'Fine.' }] }) : JSON.stringify({ lessonId: 'lesson.lab-isolation', explanation: 'A snapshot is a restore point.', nextStep: 'Take one.' });
    return new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }], usage: { prompt_tokens: 500, completion_tokens: 200, total_tokens: 700 } })); } };
  k = await kask(kctx, fakeEffort);
  await kask({ version: 1, action: 'tutor', curriculumVersion: '1.0.0', lessonId: 'lesson.lab-isolation', question: 'Why take a snapshot?' }, fakeEffort);
  check('a checker setting (CHECKER_EXTRA_BODY) is used only when that model checks cards: not for writing, not for other jobs', k.status === 200 && effort.join() === 'learn.example:low,main.example:high,main.example:low', effort);
  env = { ...env, AI_CHECKER_EXTRA_BODY: '{reasoning: high' };
  k = await kask(kctx, fakeEffort);
  check('…and one that isn\'t valid JSON stops the function as not set up, before any call', k.status === 503 && effort.length === 3, k.body);
  env = { AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_MOCK_DELAY_MS: '0', AI_DAILY_LIMIT: '50', AI_MIN_SECONDS_BETWEEN: '0', AI_MONTHLY_BUDGET_USD: '1' };

  console.log('\n[2f] "Explain it another way" (AI roles step 4): one call; Arabic can go to its own model');
  {
    const ex = { version: 1, action: 'explain', subject: 'cybersecurity', lessonId: 'lesson.routing-dns-dhcp', question: 'Can a working IP connection coexist with broken DNS?', answer: 'Yes; name resolution is a separate step.', explanation: '', yourAnswer: 'No', outcome: 'wrong' };
    env = { ...kbase, ...kMain, ...kLearn(), AI_ROUTES: '{"explain-arabic": "learn"}' };
    let e = await kask(ex);
    check('an explanation request is answered (200) by the model for "explain" (here the main one), as JSON with the explanation', e.status === 200 && e.body.model === 'Main model' && typeof JSON.parse(e.body.output).explanation === 'string', e.body);
    e = await kask({ ...ex, subject: 'arabic', lessonId: undefined, question: 'What does بَاب mean?', answer: 'door', explanation: 'الْبَابُ مَفْتُوحٌ. — The door is open.' });
    check('…an Arabic card\'s goes to the model for "explain-arabic" (here the learning one)', e.status === 200 && e.body.model === 'Learning model', e.body);
    e = await kask({ ...ex, subject: 'study', lessonId: undefined, choices: ['21', '22', '25', '53'], yourAnswer: '21', outcome: null });
    check('…a multiple-choice concept of your own, not yet marked, is accepted too', e.status === 200, e.body);
    for (const [bad, why] of [[{ ...ex, lessonId: 'lesson.missing' }, 'an unknown lesson'], [{ ...ex, subject: 'study' }, 'a lesson on something that isn\'t Cybersecurity'], [{ ...ex, question: '' }, 'no question'],
      [{ ...ex, yourAnswer: 'x'.repeat(1001) }, 'an answer over 1,000 characters'], [{ ...ex, choices: ['only one'] }, 'a single option'], [{ ...ex, outcome: 'great' }, 'an unknown outcome'], [{ ...ex, notes: 'private' }, 'an extra field']]) {
      e = await kask(bad);
      check(`explain: ${why} — refused (400) before any model call`, e.status === 400 && finished.length === 0, e.status);
    }
  }
  console.log('\n[2l] "Check my answer" (graduated help): one call; Arabic can go to its own model; the shared daily limit');
  {
    const ca = { version: 1, action: 'check-answer', subject: 'cybersecurity', lessonId: 'lesson.learning-evidence', objective: 'Explain what counts as skill evidence', teaching: 'A useful baseline records what you can demonstrate now, including uncertainty.',
      prerequisites: [], question: 'Why record uncertainty?', yourAnswer: 'So you remember you weren\'t sure.', reference: 'It identifies what must be checked rather than guessed.', alsoCounts: '' };
    env = { ...kbase, ...kMain, ...kLearn(), AI_ROUTES: '{"check-answer-arabic": "learn"}' };
    let e = await kask(ca);
    const parts = e.status === 200 ? JSON.parse(e.body.output) : {};
    check('a Cybersecurity answer is checked (200) by the model for "check-answer" (here the main one), as JSON in parts', e.status === 200 && e.body.model === 'Main model' && ['hint', 'example', 'explanation', 'drewOn'].every(k => typeof parts[k] === 'string') && typeof parts.followUp?.question === 'string', e.body);
    e = await kask({ ...ca, subject: 'arabic', lessonId: 'lesson.arabic-relative-clauses', question: 'What does the ه in الكتاب الذي قرأته refer to?', yourAnswer: 'The book.', reference: 'The book.', alsoCounts: 'Equivalent accurate explanations.' });
    check('…an Arabic answer goes to the model for "check-answer-arabic" (here the learning one)', e.status === 200 && e.body.model === 'Learning model', e.body);
    env = { ...env, AI_ROUTES: '{"explain-arabic": "learn"}' };
    e = await kask({ ...ca, subject: 'arabic', lessonId: 'lesson.arabic-relative-clauses' });
    check('…and stays on the main model unless AI_ROUTES names it (an Arabic explanation\'s route doesn\'t carry over)', e.status === 200 && e.body.model === 'Main model', e.body);
    for (const [bad, why] of [[{ ...ca, yourAnswer: '  ' }, 'an empty answer'], [{ ...ca, subject: 'arabic' }, 'Arabic with a Cybersecurity lesson'], [{ ...ca, lessonId: 'lesson.arabic-relative-clauses' }, 'Cybersecurity with an Arabic lesson'],
      [{ ...ca, subject: 'study' }, 'a subject it doesn\'t check'], [{ ...ca, yourAnswer: 'x'.repeat(1501) }, 'an answer over 1,500 characters'], [{ ...ca, notes: 'private' }, 'an extra field'], [{ ...ca, reference: '' }, 'no reference answer']]) {
      e = await kask(bad);
      check(`check-answer: ${why} — refused (400) before any model call`, e.status === 400 && finished.length === 0, e.status);
    }
    const used = Number((await sql(`select requests from public.ai_usage where user_id = $1 and day = (now() at time zone 'utc')::date`, [C]))[0]?.requests ?? 0);
    env = { ...kbase, ...kMain, AI_DAILY_LIMIT: String(used + 1) }; // every AI request so far today, and room for one more
    const first = await kask(ca), second = await kask(ca);
    check('it counts against the same daily limit as every other AI request ("daily" once it\'s used)', first.status === 200 && second.status === 429 && second.body.reason === 'daily', [used, first.status, second.status, second.body]);
  }
  console.log('\n[2g] Ask MyDay (the AI design, step 1): one call, on the main model; only the page slice the app sends');
  {
    const ak = { version: 1, action: 'ask', date: '2026-11-10', weekday: 'Tuesday', time: '10:00', page: 'project', text: 'Break this into smaller steps',
      context: { projects: [{ id: 'pjC', title: 'Coffee subscription' }], project: { id: 'pjC', title: 'Coffee subscription', summary: 'Beans for offices', stage: 'explore', tasks: [{ id: 'tkA', title: 'Ring roasters', done: false }], notes: ['Roasters sell per kilo'] } } };
    env = { ...kbase, ...kMain, ...kLearn(), AI_ROUTES: '{"explain-arabic": "learn"}' };
    let a = await kask(ak);
    const out = a.status === 200 ? JSON.parse(a.body.output) : null;
    check('an Ask request is answered (200) by the main model, as JSON with a kind and a message', a.status === 200 && a.body.model === 'Main model' && ['add', 'steps', 'change', 'answer', 'cannot'].includes(out.kind) && typeof out.message === 'string', a.body);
    a = await kask({ ...ak, page: 'today', followUp: { previous: 'Here are three steps.', text: 'Smaller please' }, context: { today: { energy: null, freeMinutes: null, plan: [], dueToday: [] } } });
    check('…with one follow-up, or from Today with energy not set yet', a.status === 200, a.body);
    a = await kask({ ...ak, page: 'today', context: { today: { energy: 3, freeMinutes: 60, plan: [], dueToday: [], revisionDue: 4 } } });
    check('…from Today with revision due', a.status === 200, a.body);
    a = await kask({ ...ak, page: 'calendar', text: 'Move the dentist to 4pm', context: { calendar: { day: '2026-11-10', appointments: [{ id: 'c1', title: 'Dentist', time: '15:00' }] } } });
    check('…from the Calendar, with each appointment\'s id (so a change can point at it)', a.status === 200, a.body);
    a = await kask({ ...ak, page: 'calendar', text: 'Move the dentist', context: { calendar: { day: '2026-11-10', appointments: [{ id: 'c1', title: 'Dentist', time: '15:00', notes: 'x' }] } } });
    check('…but an appointment carrying anything more is refused (400)', a.status === 400);
    a = await kask({ ...ak, page: 'today', context: { today: { energy: 3, freeMinutes: 60, plan: [], dueToday: [], revisionDue: -1 } } });
    check('…but not a negative count (400)', a.status === 400);
    a = await kask({ ...ak, page: 'study', context: { study: { course: { id: 'coP', title: 'Pre-Security' }, nextTask: { id: 'tkH', title: 'HTTP in detail' }, topics: ['Cybersecurity'], revisionDue: 6, energy: 2, freeMinutes: 90 } } });
    check('…or from Study, with today\'s energy and free time', a.status === 200, a.body);
    a = await kask({ ...ak, page: 'study', context: { study: { course: null, nextTask: null, topics: [], revisionDue: 0, energy: 9, freeMinutes: 90 } } });
    check('…but an energy outside 1–5 is refused (400)', a.status === 400);
    const co = { id: 'coP', title: 'Pre-Security', minutes: 30, modules: [{ id: 'm1', title: 'Networking', sections: [{ id: 's1', title: 'Web', tasks: [{ id: 't1', title: 'HTTP in detail', minutes: 30, kind: 'learn', done: false }] }] }] };
    a = await kask({ ...ak, page: 'course', text: 'Break this course into study tasks', context: { course: co } });
    check('…or from a Study course, with its outline', a.status === 200, a.body);
    a = await kask({ ...ak, page: 'course', text: 'plan it', context: { course: { ...co, modules: Array.from({ length: 13 }, (_, i) => ({ id: 'm' + i, title: 'M', sections: [] })) } } });
    check('…but more than 12 modules is refused (400)', a.status === 400);
    a = await kask({ ...ak, page: 'course', text: 'plan it', context: { course: { ...co, modules: [{ ...co.modules[0], sections: [{ ...co.modules[0].sections[0], tasks: [{ ...co.modules[0].sections[0].tasks[0], url: 'https://x' }] }] }] } } });
    check('…and so is a course carrying anything beyond the outline (a link)', a.status === 400);
    const dcs = { id: 'dcA', question: 'Which unit?', options: [{ id: 'opA', text: 'Market stall', pros: ['Cheap'], cons: ['Small'] }, { id: 'opB', text: 'Corner shop', pros: [], cons: ['Dear'] }] };
    const withPlan = over => ({ ...ak, text: 'What am I missing?', context: { ...ak.context, project: { ...ak.context.project, milestones: [{ id: 'msA', title: 'Find a unit', reached: false, aim: '2026-11-20' }], decision: { ...dcs, ...over } } } });
    a = await kask(withPlan({}));
    check('a request from a project page with its milestones and one decision (options with pros and cons) is answered (200)', a.status === 200 && a.body.model === 'Main model', a.body);
    a = await kask(withPlan({ options: Array.from({ length: 5 }, (_, i) => ({ id: 'o' + i, text: 'Option ' + i, pros: [], cons: [] })) }));
    check('…but a decision with 5 options is refused (400) before any model call', a.status === 400 && finished.length === 0, a.status);
    a = await kask(withPlan({ options: [{ ...dcs.options[0], pros: ['x'.repeat(161)] }] }));
    check('…and so is a pro of 161 characters (400)', a.status === 400 && finished.length === 0, a.status);
    for (const [bad, why] of [[{ ...ak, page: 'admin' }, 'an unknown page'], [{ ...ak, text: '' }, 'nothing typed'], [{ ...ak, text: 'x'.repeat(601) }, 'over 600 characters typed'],
      [{ ...ak, context: { ...ak.context, finance: { balance: 1 } } }, 'a part of MyDay Ask never sends (Finance)'], [{ ...ak, context: { note: { id: 'n', title: 't', text: 'x'.repeat(3001) } } }, 'a note over 3,000 characters'],
      [{ ...ak, followUp: { previous: '', text: '' } }, 'an empty follow-up'], [{ ...ak, memory: 'everything' }, 'an extra field']]) {
      a = await kask(bad);
      check(`ask: ${why} — refused (400) before any model call`, a.status === 400 && finished.length === 0, a.status);
    }
  }

  console.log('\n[2h] What must be true: the one page in the request, must-be-true in the reply (1.34.0)');
  {
    const A = await import(path.join(ROOT, 'supabase/functions/_shared/ai/ask.ts'));
    const page = { problem: 'Builders can’t get a hot lunch on site', who: 'Small building crews', how: 'We bring boxes at noon and charge per box', mustBeTrue: [
      { text: 'Crews would pay for a daily lunch', state: 'open' }, { text: 'We can cook 40 boxes a day', state: 'looks-true' }, { text: 'Sites allow deliveries', state: 'doesnt-hold' }] };
    const mk = (onePage, text = 'Suggest what must be true for this idea to work') => ({ version: 1, action: 'ask', date: '2026-11-10', weekday: 'Tuesday', time: '10:00', page: 'project', text,
      context: { project: { id: 'pjB', title: 'Lunch boxes for sites', summary: 'Hot lunches for builders', stage: 'explore', tasks: [], notes: [], ...(onePage === undefined ? {} : { onePage }) } } });
    check('a project context with a valid one page (three answers, up to 12 beliefs with a state) is accepted', A.checkAskContext(mk(page)) === true);
    check('…and so is a project context with no one page', A.checkAskContext(mk(undefined)) === true);
    check('…but an answer over 1,000 characters is refused', A.checkAskContext(mk({ ...page, how: 'x'.repeat(1001) })) === false);
    check('…but 13 beliefs are refused', A.checkAskContext(mk({ ...page, mustBeTrue: Array.from({ length: 13 }, (_, i) => ({ text: 'Belief ' + i, state: 'open' })) })) === false);
    check('…but 12 beliefs are accepted', A.checkAskContext(mk({ ...page, mustBeTrue: Array.from({ length: 12 }, (_, i) => ({ text: 'Belief ' + i, state: 'open' })) })) === true);
    check('…but a belief over 110 characters is refused', A.checkAskContext(mk({ ...page, mustBeTrue: [{ text: 'x'.repeat(111), state: 'open' }] })) === false);
    check('…but a belief with an unknown state is refused', A.checkAskContext(mk({ ...page, mustBeTrue: [{ text: 'Crews would pay', state: 'maybe' }] })) === false);
    check('…but a belief carrying what you found is refused', A.checkAskContext(mk({ ...page, mustBeTrue: [{ text: 'Crews would pay', state: 'open', found: 'Three said yes' }] })) === false);
    check('…but a one page carrying anything more is refused', A.checkAskContext(mk({ ...page, extra: 'x' })) === false);
    const rep = items => JSON.stringify({ kind: 'add', message: 'A few things.', items, action: null });
    const r1 = A.readAsk(rep([{ type: 'must-be-true', title: 'Crews would pay' }, { type: 'must-be-true', text: 'We can cook 40 boxes a day' }]));
    check('a reply\'s must-be-true items are kept, the words read from "title" or, when it is missing, from "text"', r1 && r1.items.length === 2 && r1.items.every(i => i.type === 'must-be-true') && r1.items[0].title === 'Crews would pay' && r1.items[1].title === 'We can cook 40 boxes a day', r1);
    const sys = A.buildAskMessages(mk(page)).map(m => m.content).join('\n');
    check('the instructions are version myday-ask-v21 and mention must-be-true and onePage', A.ASK_PROMPT_VERSION === 'myday-ask-v21' && sys.includes('must-be-true') && sys.includes('onePage'), A.ASK_PROMPT_VERSION);
    const m1 = JSON.parse(A.mockAsk(mk(page)));
    check('the practice version, with a one page and "Suggest what must be true…", answers "add" with 3 must-be-true items', m1.kind === 'add' && m1.items.length === 3 && m1.items.every(i => i.type === 'must-be-true'), m1);
    const m2 = JSON.parse(A.mockAsk(mk(undefined)));
    check('…and without a one page it does not', !m2.items.some(i => i.type === 'must-be-true'), m2);
  }

  console.log('\n[2i] Summarise this (Ask v15): the instructions and the practice reply');
  {
    const A = await import(path.join(ROOT, 'supabase/functions/_shared/ai/ask.ts'));
    const mk = tasks => ({ version: 1, action: 'ask', date: '2026-11-10', weekday: 'Tuesday', time: '10:00', page: 'project', text: 'Summarise where this project is, and the one next step',
      context: { project: { id: 'pjB', title: 'Lunch boxes for sites', summary: 'Hot lunches for builders', stage: 'explore', tasks, notes: [] } } });
    const sys = A.buildAskMessages(mk([])).map(m => m.content).join('\n').replace(/\s+/g, ' ');
    check('the instructions are version myday-ask-v21', A.ASK_PROMPT_VERSION === 'myday-ask-v21', A.ASK_PROMPT_VERSION);
    check('the summary instructions say a done "Find out" task means they looked into it, not that its answer is confirmed', sys.includes('A summary of the project on this page') && sys.includes('a done "Find out: X" means they\'ve looked into whether X') && sys.includes('never that X is confirmed or true'));
    check('…and to summarise without advising on a legal, medical or money matter', sys.includes('legal, medical or money matter, summarise without advising'));
    const withTasks = mk([{ id: 'tkA', title: 'Ring the caterer', done: true }, { id: 'tkB', title: 'Price the boxes', done: false }, { id: 'tkC', title: 'Book a stall', done: false }]);
    check('the project context with tasks is accepted', A.checkAskContext(withTasks) === true);
    const m1 = JSON.parse(A.mockAsk(withTasks));
    check('the practice version answers "Summarise where this project is…" with kind "answer" and no items', m1.kind === 'answer' && Array.isArray(m1.items) && m1.items.length === 0 && m1.action === null, m1);
    check('…naming the project and its first open task', m1.message.includes('Lunch boxes for sites') && m1.message.includes('Price the boxes') && !m1.message.includes('Ring the caterer'), m1.message);
    const m2 = JSON.parse(A.mockAsk(mk([{ id: 'tkA', title: 'Ring the caterer', done: true }])));
    check('with every task done it says to pick the smallest first step', m2.kind === 'answer' && m2.items.length === 0 && m2.message.includes('pick the smallest first step'), m2.message);
    const m3 = JSON.parse(A.mockAsk(mk([])));
    check('with no tasks at all it also says to pick the smallest first step, and names the project', m3.kind === 'answer' && m3.items.length === 0 && m3.message.includes('pick the smallest first step') && m3.message.includes('Lunch boxes for sites'), m3.message);
  }
  env = { AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_MOCK_DELAY_MS: '0', AI_DAILY_LIMIT: '50', AI_MIN_SECONDS_BETWEEN: '0', AI_MONTHLY_BUDGET_USD: '1' };

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
  // The learning model (AI roles, step 2): the template's commented block switched on.
  const learnOn = template.replace(/^AI_API_KEY=$/m, `AI_API_KEY=${FAKE}`).replace(/^# (AI_LEARN_|AI_ROUTES=|AI_CHECKER_EXTRA_BODY=)/gm, '$1').replace(/^AI_LEARN_API_KEY=$/m, 'AI_LEARN_API_KEY=yy-another-made-up-key');
  r = checkFile('learn.env', learnOn);
  check('…with the learning model switched on: ready, both models as evaluated, cards written by Gemini and checked by GLM (with its evaluated checker setting), the tutor still on GLM, neither key printed',
    r.code === 0 && /Learning model: same request settings as evaluated \("gemini-3\.8-flash"/.test(r.out) && /As a card checker: extra fields as evaluated \("glm-5\.3-flash-high"/.test(r.out)
    && /revision cards: written by the learning model, checked by the main one/.test(r.out) && /the tutor goes to the main model, with the learning one as its fallback/.test(r.out) && !r.out.includes(FAKE) && !r.out.includes('yy-another'), r.out);
  check('…and cards from notes: the note checked by Gemini, cards written by GLM and checked by Gemini', /cards from notes: the note checked by the learning model, cards written by the main one and checked by the learning one/.test(r.out), r.out);
  r = checkFile('checker-bad.env', learnOn.replace(/^AI_CHECKER_EXTRA_BODY=.*$/m, 'AI_CHECKER_EXTRA_BODY={"reasoning_effort": "max"}'));
  check('…a checker setting that wasn\'t evaluated: caught', r.code === 1 && /AI_CHECKER_EXTRA_BODY: .* wasn't evaluated for glm-5\.3-flash/.test(r.out), r.out);
  r = checkFile('template-cards.env', template.replace(/^AI_API_KEY=$/m, `AI_API_KEY=${FAKE}`));
  check('…the template as it is (one model): revision cards are off', /revision cards: off/.test(r.out), r.out);
  r = checkFile('learn-nokey.env', learnOn.replace(/^AI_LEARN_API_KEY=.*$/m, 'AI_LEARN_API_KEY='));
  check('…the learning model without its key: not ready', r.code === 1 && /AI_LEARN_API_KEY is empty/.test(r.out), r.out);
  r = checkFile('routes-bad.env', learnOn.replace(/^AI_ROUTES=.*$/m, 'AI_ROUTES={"tutr": "learn"}'));
  check('…a misspelt job in AI_ROUTES: caught', r.code === 1 && /unknown job "tutr"/.test(r.out), r.out);
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
