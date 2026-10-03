#!/usr/bin/env node
// Checks the ai-plan Edge Function's settings before they're sent to Supabase — without printing the key.
//
//   node supabase/check-ai-secrets.mjs                      checks supabase/.ai-secrets.env (Git ignores it)
//   node supabase/check-ai-secrets.mjs path/to/file.env     checks another file
//
// It reads the file the way the function will (each NAME=value line; the last one wins), then checks that:
//   - each setting appears once (a repeated one would silently replace the first);
//   - the function would accept the settings, with prices (so spending can be limited);
//   - for a model in ai-eval/models.json, the request is exactly the one that was evaluated (address, model,
//     thinking settings, reply field and cap, JSON output, temperature, prices);
//   - the time limit is shorter than the app's own (40 s), so the app never gives up while the model still runs;
//   - the key is filled in, and nothing key-like sits in the wrong setting.
// Exit code 0 = ready to send; 1 = something to fix (listed).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const file = path.resolve(process.argv[2] || path.join(here, '.ai-secrets.env'));
const APP_TIMEOUT_MS = 40000; // app/src/ai/request.ts

if (!fs.existsSync(file)) { console.log(`Not found: ${file}\nCopy supabase/ai-secrets.example.env to supabase/.ai-secrets.env first.`); process.exit(1); }
const { configFromEnv, MAX_OUTPUT_TOKENS_CAP } = await import(pathToFileURL(path.join(root, 'supabase/functions/_shared/ai/providers.ts')).href);

const env = {}, seen = {}, problems = [], notes = [];
for (const [i, line] of fs.readFileSync(file, 'utf8').split('\n').entries()) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (!m) continue;
  if (seen[m[1]]) problems.push(`${m[1]} is set twice (lines ${seen[m[1]]} and ${i + 1}); only the last would count.`);
  seen[m[1]] = i + 1;
  env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const key = env.AI_API_KEY || '';
// Compared even before the key is in (a stand-in key for the check only; it's never sent anywhere).
const cfg = configFromEnv(n => (n === 'AI_API_KEY' ? key || 'not-a-key' : env[n]));

if (env.AI_PROVIDER === 'openai-compatible' && !key) problems.push('AI_API_KEY is empty: add the model\'s key (a new one, if the old one was ever shared).');
if ('error' in cfg) problems.push(cfg.error);
if (!('error' in cfg) && cfg.provider === 'openai-compatible') {
  if (cfg.timeoutMs >= APP_TIMEOUT_MS) problems.push(`AI_TIMEOUT_MS is ${cfg.timeoutMs}: keep it under the app's ${APP_TIMEOUT_MS} ms.`);
  if (Number(env.AI_MAX_OUTPUT_TOKENS) > MAX_OUTPUT_TOKENS_CAP) problems.push(`AI_MAX_OUTPUT_TOKENS is above the function's cap (${MAX_OUTPUT_TOKENS_CAP}).`);
  if (/coding\/paas/.test(cfg.baseUrl || '')) problems.push('AI_BASE_URL is Z.ai\'s Coding Plan address, which Z.ai limits to its supported coding tools. Use https://api.z.ai/api/paas/v4.');
  if (/YOUR-WORKSPACE-ID/.test(cfg.baseUrl || '')) problems.push('AI_BASE_URL still has the YOUR-WORKSPACE-ID placeholder.');
  for (const [n, v] of Object.entries(env)) if (n !== 'AI_API_KEY' && key && v.includes(key)) problems.push(`${n} contains the key.`);

  // The evaluated settings for this model (ai-eval/models.json), if it was evaluated.
  const models = JSON.parse(fs.readFileSync(path.join(root, 'ai-eval/models.json'), 'utf8')).models;
  const id = Object.keys(models).find(k => models[k].model === cfg.model && models[k].provider === 'openai-compatible');
  if (!id) notes.push(`${cfg.model} isn't in ai-eval/models.json, so there are no evaluated settings to compare with.`);
  else {
    const m = models[id];
    const host = u => { try { return new URL(u.replace(/\{[^}]+\}/g, 'x')).host.replace(/^[^.]+(?=\.[^.]+\.maas\.aliyuncs\.com$)/, '*'); } catch { return u; } };
    const want = {
      address: host(m.baseUrl || ''), model: m.model, temperature: m.temperature ?? 0.2, 'reply field': m.maxTokensField || 'max_tokens',
      'reply cap': m.maxOutputTokens ?? 600, 'JSON output': m.jsonMode !== false, 'extra fields': JSON.stringify(m.extraBody || {}),
      'price in': m.priceInPerMTok, 'price out': m.priceOutPerMTok,
    };
    const got = {
      address: host(cfg.baseUrl || ''), model: cfg.model, temperature: cfg.temperature, 'reply field': cfg.maxTokensField || 'max_tokens',
      'reply cap': cfg.maxOutputTokens, 'JSON output': cfg.jsonMode !== false, 'extra fields': JSON.stringify(cfg.extraBody || {}),
      'price in': cfg.priceInPerMTok, 'price out': cfg.priceOutPerMTok,
    };
    for (const k of Object.keys(want)) if (String(want[k]) !== String(got[k])) problems.push(`${k}: ${got[k]} here, but ${want[k]} was evaluated (ai-eval/models.json, "${id}").`);
    if (!problems.some(p => p.includes('was evaluated'))) notes.push(`Same request settings as evaluated ("${id}" in ai-eval/models.json).`);
  }
}

console.log(`Checked ${path.relative(process.cwd(), file) || file}`);
if (!('error' in cfg)) {
  console.log(`  model      ${cfg.label} (${cfg.model}) at ${cfg.baseUrl || '—'}`);
  console.log(`  request    ${cfg.maxTokensField || 'max_tokens'}=${cfg.maxOutputTokens}, temperature ${cfg.temperature}, JSON output ${cfg.jsonMode !== false ? 'on' : 'off'}, extra ${JSON.stringify(cfg.extraBody || {})}`);
  console.log(`  limits     ${env.AI_DAILY_LIMIT || 20} a day, US$${env.AI_MONTHLY_BUDGET_USD || 1} a month, ${env.AI_MIN_SECONDS_BETWEEN || 5} s apart, ${cfg.timeoutMs} ms time limit`);
  console.log(`  prices     US$${cfg.priceInPerMTok} / US$${cfg.priceOutPerMTok} per million tokens in / out`);
}
console.log(`  origins    ${env.AI_ALLOWED_ORIGINS || '(the function\'s defaults)'}`);
console.log(`  key        ${key ? 'set (not shown)' : 'empty'}`);
console.log(`  public key ${env.MYDAY_PUBLISHABLE_KEY ? 'set' : 'not set (the function uses the one Supabase provides)'}`);
for (const n of notes) console.log(`  ✓ ${n}`);
if (problems.length) { console.log('\nTo fix before sending:'); for (const p of problems) console.log(`  - ${p}`); process.exit(1); }
console.log('\nReady: npx supabase secrets set --env-file ' + path.relative(process.cwd(), file) + ' --project-ref nkslcgnbmxuhznvldfnz');
