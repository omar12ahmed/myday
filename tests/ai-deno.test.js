// The ai-plan Edge Function's real entry (supabase/functions/ai-plan/index.ts, unchanged) running under Deno, with
// mocked requests. Around it, everything is on this computer:
//   - Supabase is the local stand-in (tests/supabase-standin.js): its sign-in, and the real AI limit functions from
//     the migration in PGlite, reached through supabase-js exactly as index.ts calls them;
//   - the model is a fake OpenAI-compatible provider, with GLM-5.3-Flash's evaluated settings in the function's
//     environment, so the real adapter builds and sends the real request.
// No real Supabase project, model or key is used. Plain Deno, not Supabase's own edge runtime (which is built on Deno).
//
// Needs Deno: `deno` on the PATH, MYDAY_DENO=/path/to/deno, or the official npm package in tests/.denotools
// (Git ignores it):  npm install --prefix tests/.denotools --foreground-scripts deno@2.9.6
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn, execFileSync } = require('child_process');
const S = require('./supabase-standin.js');
const { check, summary } = require('./cdp.js');
const ROOT = process.env.MYDAY_ROOT || path.resolve(__dirname, '..');

function findDeno() {
  const candidates = [process.env.MYDAY_DENO, path.join(ROOT, `tests/.denotools/node_modules/@deno/${process.platform}-${process.arch}/deno`)];
  try { candidates.push(execFileSync('/usr/bin/which', ['deno'], { encoding: 'utf8' }).trim()); } catch { /* not on the PATH */ }
  return candidates.find(c => c && fs.existsSync(c)) || null;
}
const freePort = () => new Promise(r => { const s = http.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const FAKE_KEY = 'zai-made-up-key-for-deno-test';

(async () => {
  const deno = findDeno();
  if (!deno) { console.log('Not run: needs Deno. See the top of tests/ai-deno.test.js.'); process.exit(2); }
  const denoDir = process.env.DENO_DIR || path.join(os.tmpdir(), 'myday-deno-cache');
  const version = execFileSync(deno, ['--version'], { encoding: 'utf8' }).split('\n')[0];

  // ---- The stand-in Supabase, and disposable accounts ----
  const db = await S.createDb();
  const A = await S.addUser(db, 'deno-a@example.test', 'pw-a');
  const B = await S.addUser(db, 'deno-b@example.test', 'pw-b');
  const C = await S.addUser(db, 'deno-c@example.test', 'pw-c');
  const srv = await S.start(db, 0);
  const SUPA = `http://127.0.0.1:${srv.port}`;
  const signIn = async (email, password) => (await (await fetch(`${SUPA}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: S.PUBLISHABLE_KEY }, body: JSON.stringify({ email, password }) })).json()).access_token;
  const usage = async who => (await S.owner(db, 'select coalesce(sum(requests), 0)::int as requests, coalesce(sum(reserved_usd), 0)::float as reserved, coalesce(sum(input_tokens), 0)::int as input, coalesce(sum(output_tokens), 0)::int as output from public.ai_usage where user_id = $1', [who])).rows[0];

  // ---- A fake model provider (OpenAI-style), whose answer the test chooses ----
  const provider = { mode: 'ok', calls: [] };
  const fake = http.createServer((req, res) => {
    let b = ''; req.on('data', c => { b += c; });
    req.on('end', async () => {
      provider.calls.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(b || '{}') });
      const json = (status, o) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
      if (provider.mode === 'slow') { await sleep(3000); if (!res.destroyed) json(200, {}); return; }
      if (provider.mode === 'refused') return json(400, { error: { code: '1214', message: `Invalid parameter (key ${FAKE_KEY})` } });
      if (provider.mode === 'length') return json(200, { choices: [{ message: { content: '{"rest": false, "priorities": [' }, finish_reason: 'length' }], usage: { prompt_tokens: 900, completion_tokens: 2048, total_tokens: 2948 } });
      json(200, { choices: [{ message: { content: '{"rest":false,"priorities":[{"taskId":"a","minutes":15,"start":"09:30"}],"explanation":"A short start is enough.","missing":[]}' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 900, completion_tokens: 120, total_tokens: 1020, completion_tokens_details: { reasoning_tokens: 40 } } });
    });
  });
  await new Promise(r => fake.listen(0, '127.0.0.1', r));
  const FAKE_URL = `http://127.0.0.1:${fake.address().port}/api/paas/v4`;

  // ---- The function under Deno: index.ts as deployed, with its settings in the environment ----
  const GLM = {
    AI_PROVIDER: 'openai-compatible', AI_LABEL: 'GLM-5.3-Flash', AI_BASE_URL: FAKE_URL, AI_MODEL: 'glm-5.3-flash', AI_API_KEY: FAKE_KEY,
    AI_EXTRA_BODY: '{"thinking": {"type": "enabled"}, "reasoning_effort": "low"}', AI_MAX_TOKENS_FIELD: 'max_tokens', AI_MAX_OUTPUT_TOKENS: '2048',
    AI_TIMEOUT_MS: '1500', AI_PRICE_IN_PER_MTOK: '0.15', AI_PRICE_OUT_PER_MTOK: '0.5',
    AI_DAILY_LIMIT: '50', AI_MONTHLY_BUDGET_USD: '1', AI_MIN_SECONDS_BETWEEN: '0', AI_ALLOWED_ORIGINS: 'http://localhost:5173',
  };
  const running = [];
  async function startFunction(settings) {
    const port = await freePort();
    const logs = [];
    const child = spawn(deno, ['run', '--node-modules-dir=none', '--allow-net', '--allow-env', path.join(ROOT, 'supabase/functions/ai-plan/index.ts')], {
      env: { PATH: process.env.PATH, HOME: process.env.HOME, DENO_DIR: denoDir, NO_COLOR: '1', DENO_SERVE_ADDRESS: `tcp:127.0.0.1:${port}`, SUPABASE_URL: SUPA, SUPABASE_ANON_KEY: S.PUBLISHABLE_KEY, ...settings },
    });
    running.push(child);
    let out = '';
    child.stdout.on('data', d => { out += d; logs.push(...String(d).split('\n').filter(Boolean)); });
    child.stderr.on('data', d => { out += d; });
    for (let i = 0; i < 600 && !/Listening on/.test(out); i++) { if (child.exitCode !== null) break; await sleep(100); }
    if (!/Listening on/.test(out)) throw new Error('The function didn\'t start under Deno:\n' + out.slice(-2000));
    const url = `http://127.0.0.1:${port}/ai-plan`;
    const call = (body, { token, origin = 'http://localhost:5173', raw, method = 'POST' } = {}) => fetch(url, {
      method, headers: { 'Content-Type': 'application/json', apikey: S.PUBLISHABLE_KEY, Origin: origin, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined,
    });
    return { call, logs: () => logs.filter(l => !/^Listening on/.test(l)), stop: () => { child.kill(); } };
  }

  const ctx = { version: 1, date: '2026-11-10', weekday: 'Tuesday', now: '09:00', timezone: 'Europe/London', energy: 2, maxPriorities: 1, smallOnly: true, smallMinutes: 20, restDay: false,
    sleep: { lastNight: { start: '2026-11-09T23:00', end: '2026-11-10T07:00', hours: 8 }, tonight: null },
    tasks: [{ id: 'a', title: 'Secret project notes', category: 'learning', minutes: 30, plannedMinutes: 30, done: false, start: null }],
    busy: [{ kind: 'appointment', start: '2026-11-10T11:00', end: '2026-11-10T12:00' }], free: [{ start: '09:00', end: '10:30' }], window: { earliest: '08:00', latest: '21:00' }, revisionDue: 0, note: 'I slept badly' };

  try {
    console.log(`\n${version}; index.ts with --allow-net --allow-env only`);
    const fn = await startFunction(GLM);
    check('the function starts under Deno (its supabase-js import and every shared module load)', true);

    console.log('\n[1] Who can call it');
    let res = await fn.call(null, { method: 'OPTIONS' });
    check('the browser\'s pre-flight from the dev server (http://localhost:5173) is answered', res.status === 204 && res.headers.get('access-control-allow-origin') === 'http://localhost:5173');
    res = await fn.call(null, { method: 'OPTIONS', origin: 'https://evil.example' });
    check('…not for another website', !res.headers.get('access-control-allow-origin'));
    const before = provider.calls.length;
    check('no sign-in: refused (401)', (await fn.call({ context: ctx })).status === 401);
    check('the publishable key in place of a sign-in: refused (401)', (await fn.call({ context: ctx }, { token: S.PUBLISHABLE_KEY })).status === 401);
    check('a secret-style key in place of a sign-in: refused (401)', (await fn.call({ context: ctx }, { token: 'sb_' + 'secret_' + 'made-up-for-tests' })).status === 401);
    const tokA = await signIn('deno-a@example.test', 'pw-a');
    const [h, , sig] = tokA.split('.');
    const forged = `${h}.${Buffer.from(JSON.stringify({ sub: B, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.${sig}`;
    check('a forged token (someone else\'s id, a borrowed signature): refused (401), nothing counted for that account', (await fn.call({ context: ctx }, { token: forged })).status === 401 && (await usage(B)).requests === 0);
    check('…and none of these reached the model', provider.calls.length === before);

    console.log('\n[2] A signed-in request, through the real adapter, to the (fake) provider');
    res = await fn.call({ context: ctx }, { token: tokA });
    let body = await res.json();
    const sent = provider.calls.length > before ? provider.calls[provider.calls.length - 1] : { body: {} }; // none if the request never got that far
    check('a good request: 200, the model\'s reply passed back for the app to check, with token counts', res.status === 200 && body.ok === true && JSON.parse(body.output).priorities.length === 1 && body.usage.inputTokens === 900 && body.usage.outputTokens === 120, body);
    check('the request sent is GLM-5.3-Flash\'s evaluated one: /chat/completions, glm-5.3-flash, max_tokens 2048, thinking on at low effort, JSON output, temperature 0.2',
      sent.url === '/api/paas/v4/chat/completions' && sent.body.model === 'glm-5.3-flash' && sent.body.max_tokens === 2048 && sent.body.thinking?.type === 'enabled' && sent.body.reasoning_effort === 'low'
      && sent.body.response_format?.type === 'json_object' && sent.body.temperature === 0.2 && sent.body.messages?.length === 2, sent.body);
    check('the key goes only in the provider\'s Authorization header (from the function\'s settings, never from the app)', sent.auth === `Bearer ${FAKE_KEY}` && !JSON.stringify(sent.body).includes(FAKE_KEY) && !JSON.stringify(body).includes(FAKE_KEY));
    let u = await usage(A);
    check('the limits ran as that account through supabase-js (ai_begin): one request, the worst case reserved; and the tokens recorded (ai_finish)', u.requests === 1 && u.reserved > 0 && u.input === 900 && u.output === 120, u);
    res = await fn.call({ context: ctx, user_id: B, account: B, userId: B }, { token: tokA });
    check('another account named in the request body: ignored — only the caller is counted', res.status === 200 && (await usage(A)).requests === 2 && (await usage(B)).requests === 0);

    console.log('\n[3] Unusable replies and failures: refused, nothing for the app to save');
    provider.mode = 'length';
    res = await fn.call({ context: ctx }, { token: tokA }); body = await res.json();
    u = await usage(A);
    check('a reply cut off at the length limit: 502 "truncated" — its billed tokens still recorded', res.status === 502 && body.ok === false && body.detail === 'truncated' && u.output === 120 * 2 + 2048, { body, u });
    provider.mode = 'refused';
    res = await fn.call({ context: ctx }, { token: tokA }); body = await res.json();
    check('the provider refusing the request: 502, and its message (which repeats the key) isn\'t passed on', res.status === 502 && body.detail === 'http' && !JSON.stringify(body).includes(FAKE_KEY), body);
    provider.mode = 'slow';
    res = await fn.call({ context: ctx }, { token: tokA }); body = await res.json();
    check('no answer within the time limit: 502 "timeout"', res.status === 502 && body.detail === 'timeout', body);
    provider.mode = 'ok';
    check('not JSON: 400; the wrong shape: 400; too big: 413', (await fn.call(null, { token: tokA, raw: 'hello' })).status === 400 && (await fn.call({ context: { ...ctx, tasks: 'all' } }, { token: tokA })).status === 400
      && (await fn.call(null, { token: tokA, raw: JSON.stringify({ context: ctx, pad: 'x'.repeat(20000) }) })).status === 413);
    await sleep(200);
    const lines = fn.logs();
    check('its logs hold an outcome, a status and a time per request — no tasks, notes, sleep or key', lines.length >= 10 && lines.every(l => /^ai-plan \S+ \d{3} \d+ms$/.test(l)) && !/Secret|slept|zai-made-up/.test(lines.join('\n')), lines);
    fn.stop();

    console.log('\n[4] The limits, with other settings');
    const paced = await startFunction({ ...GLM, AI_MIN_SECONDS_BETWEEN: '60' });
    const tokB = await signIn('deno-b@example.test', 'pw-b');
    const r1 = await paced.call({ context: ctx }, { token: tokB });
    const r2 = await paced.call({ context: ctx }, { token: tokB });
    check('asking again within a minute (AI_MIN_SECONDS_BETWEEN 60): 429 "too-fast", and the model isn\'t called', r1.status === 200 && r2.status === 429 && (await r2.json()).reason === 'too-fast' && (await usage(B)).requests === 1);
    paced.stop();
    const capped = await startFunction({ ...GLM, AI_MONTHLY_BUDGET_USD: '0.0001' });
    const tokC = await signIn('deno-c@example.test', 'pw-c');
    const n = provider.calls.length;
    res = await capped.call({ context: ctx }, { token: tokC });
    check('a monthly budget smaller than one request\'s worst case: 429 "budget", before any model call', res.status === 429 && (await res.json()).reason === 'budget' && provider.calls.length === n);
    capped.stop();
    const unset = await startFunction({ AI_PROVIDER: '' });
    check('AI not set up (no provider): 503 "not-configured"', (await unset.call({ context: ctx }, { token: tokC })).status === 503);
    unset.stop();
    const practice = await startFunction({ AI_PROVIDER: 'mock', AI_MODEL: 'mock:good', AI_MOCK_DELAY_MS: '0', AI_ALLOWED_ORIGINS: 'http://localhost:5173' });
    res = await practice.call({ context: ctx }, { token: tokC }); body = await res.json();
    check('the mock model (no key, no provider) also works under Deno', res.status === 200 && body.ok && JSON.parse(body.output).priorities.length >= 0 && provider.calls.length === n, body);
    practice.stop();
  } finally {
    for (const c of running) try { c.kill(); } catch { /* already stopped */ }
    await srv.close(); fake.close();
  }

  const { pass, fail } = summary();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('HARNESS:', e); process.exit(2); });
