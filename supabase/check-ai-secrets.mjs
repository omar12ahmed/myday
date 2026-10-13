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
//   - the key is filled in, and nothing key-like sits in the wrong setting;
//   - the same for a learning model (AI_LEARN_… settings), if there is one, and that AI_ROUTES is understood.
// Exit code 0 = ready to send; 1 = something to fix (listed).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const file = path.resolve(process.argv[2] || path.join(here, '.ai-secrets.env'));
const APP_TIMEOUT_MS = 40000; // app/src/ai/request.ts

if (!fs.existsSync(file)) { console.log(`Not found: ${file}\nCopy supabase/ai-secrets.example.env to supabase/.ai-secrets.env first.`); process.exit(1); }
const { configFromEnv, routeFor, MAX_OUTPUT_TOKENS_CAP } = await import(pathToFileURL(path.join(root, 'supabase/functions/_shared/ai/providers.ts')).href);

const env = {}, seen = {}, problems = [], notes = [];
for (const [i, line] of fs.readFileSync(file, 'utf8').split('\n').entries()) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (!m) continue;
  if (seen[m[1]]) problems.push(`${m[1]} is set twice (lines ${seen[m[1]]} and ${i + 1}); only the last would count.`);
  seen[m[1]] = i + 1;
  env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const models = JSON.parse(fs.readFileSync(path.join(root, 'ai-eval/models.json'), 'utf8')).models;
// One model's settings (prefix AI_ for the main one, AI_LEARN_ for the learning one).
function checkModel(prefix) {
  const key = env[prefix + 'API_KEY'] || '';
  // Compared even before the key is in (a stand-in key for the check only; it's never sent anywhere).
  const cfg = configFromEnv(n => (n === prefix + 'API_KEY' ? key || 'not-a-key' : env[n]), prefix);
  if (env[prefix + 'PROVIDER'] === 'openai-compatible' && !key) problems.push(`${prefix}API_KEY is empty: add the model's key (a new one, if the old one was ever shared).`);
  if ('error' in cfg) { problems.push(cfg.error); return cfg; }
  if (cfg.provider !== 'openai-compatible') return cfg;
  if (cfg.timeoutMs >= APP_TIMEOUT_MS) problems.push(`${prefix}TIMEOUT_MS is ${cfg.timeoutMs}: keep it under the app's ${APP_TIMEOUT_MS} ms.`);
  if (Number(env[prefix + 'MAX_OUTPUT_TOKENS']) > MAX_OUTPUT_TOKENS_CAP) problems.push(`${prefix}MAX_OUTPUT_TOKENS is above the function's cap (${MAX_OUTPUT_TOKENS_CAP}).`);
  if (/coding\/paas/.test(cfg.baseUrl || '')) problems.push(`${prefix}BASE_URL is Z.ai's Coding Plan address, which Z.ai limits to its supported coding tools. Use https://api.z.ai/api/paas/v4.`);
  if (/YOUR-WORKSPACE-ID/.test(cfg.baseUrl || '')) problems.push(`${prefix}BASE_URL still has the YOUR-WORKSPACE-ID placeholder.`);
  for (const [n, v] of Object.entries(env)) if (n !== prefix + 'API_KEY' && key && v.includes(key)) problems.push(`${n} contains ${prefix}API_KEY.`);

  // The evaluated settings for this model (ai-eval/models.json), if it was evaluated.
  const id = Object.keys(models).find(k => models[k].model === cfg.model && models[k].provider === 'openai-compatible');
  if (!id) { notes.push(`${cfg.model} isn't in ai-eval/models.json, so there are no evaluated settings to compare with.`); return cfg; }
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
  const before = problems.length;
  for (const k of Object.keys(want)) if (String(want[k]) !== String(got[k])) problems.push(`${prefix}… ${k}: ${got[k]} here, but ${want[k]} was evaluated (ai-eval/models.json, "${id}").`);
  if (problems.length === before) notes.push(`${prefix === 'AI_' ? 'Same' : 'Learning model: same'} request settings as evaluated ("${id}" in ai-eval/models.json).`);
  // Its extra fields when it checks revision cards, if set: as evaluated for this model.
  if (cfg.checkerExtraBody) {
    const checker = Object.keys(models).find(k => models[k].model === cfg.model && JSON.stringify(models[k].extraBody || {}) === JSON.stringify(cfg.checkerExtraBody));
    if (checker) notes.push(`${prefix === 'AI_' ? 'As' : 'Learning model, as'} a card checker: extra fields as evaluated ("${checker}" in ai-eval/models.json).`);
    else problems.push(`${prefix}CHECKER_EXTRA_BODY: ${JSON.stringify(cfg.checkerExtraBody)} wasn't evaluated for ${cfg.model} (see ai-eval/models.json).`);
  }
  return cfg;
}
const cfg = checkModel('AI_');
const learn = env.AI_LEARN_PROVIDER ? checkModel('AI_LEARN_') : null;
// Which job goes where (checked the way the function reads it, with a made-up tutor question).
if (!('error' in cfg) && !(learn && 'error' in learn)) {
  const route = routeFor(n => (n.endsWith('API_KEY') ? env[n] || 'not-a-key' : env[n]), { version: 1, action: 'tutor', curriculumVersion: '1.0.0', lessonId: 'lesson.lab-isolation', question: 'x' });
  if ('error' in route) problems.push(route.error);
  else {
    if (env.AI_ROUTES && /learn/.test(env.AI_ROUTES) && !learn) problems.push('AI_ROUTES sends a job to the learning model, but no AI_LEARN_PROVIDER is set up (it would go to the main model).');
    notes.push(`the tutor goes to the ${route.primary.slot === 'learn' ? 'learning' : 'main'} model${route.fallback ? `, with the ${route.fallback.slot === 'learn' ? 'learning' : 'main'} one as its fallback` : ', with no fallback'}.`);
    const cards = routeFor(n => (n.endsWith('API_KEY') ? env[n] || 'not-a-key' : env[n]), { version: 1, action: 'cards', curriculumVersion: '1.0.0', lessonId: 'lesson.lab-isolation', count: 10, existing: [] });
    if (!('error' in cards)) notes.push(cards.other ? `revision cards: written by the ${cards.primary.slot === 'learn' ? 'learning' : 'main'} model, checked by the ${cards.other.slot === 'learn' ? 'learning' : 'main'} one.` : 'revision cards: off (they need a second model to check them).');
  }
}
const total = Number(env.AI_TOTAL_TIMEOUT_MS || 38000);
if (!(total > 0 && total < APP_TIMEOUT_MS)) problems.push(`AI_TOTAL_TIMEOUT_MS is ${env.AI_TOTAL_TIMEOUT_MS}: keep it under the app's ${APP_TIMEOUT_MS} ms.`);

console.log(`Checked ${path.relative(process.cwd(), file) || file}`);
if (!('error' in cfg)) {
  console.log(`  model      ${cfg.label} (${cfg.model}) at ${cfg.baseUrl || '—'}`);
  console.log(`  request    ${cfg.maxTokensField || 'max_tokens'}=${cfg.maxOutputTokens}, temperature ${cfg.temperature}, JSON output ${cfg.jsonMode !== false ? 'on' : 'off'}, extra ${JSON.stringify(cfg.extraBody || {})}${cfg.checkerExtraBody ? `, checking cards ${JSON.stringify(cfg.checkerExtraBody)}` : ''}`);
  console.log(`  limits     ${env.AI_DAILY_LIMIT || 20} a day, US$${env.AI_MONTHLY_BUDGET_USD || 1} a month, ${env.AI_MIN_SECONDS_BETWEEN || 5} s apart, ${cfg.timeoutMs} ms time limit`);
  console.log(`  prices     US$${cfg.priceInPerMTok} / US$${cfg.priceOutPerMTok} per million tokens in / out`);
}
console.log(`  origins    ${env.AI_ALLOWED_ORIGINS || '(the function\'s defaults)'}`);
if (learn && !('error' in learn)) {
  console.log(`  learning   ${learn.label} (${learn.model}) at ${learn.baseUrl || '—'}`);
  console.log(`  request    ${learn.maxTokensField || 'max_tokens'}=${learn.maxOutputTokens}, temperature ${learn.temperature}, JSON output ${learn.jsonMode !== false ? 'on' : 'off'}, extra ${JSON.stringify(learn.extraBody || {})}, ${learn.timeoutMs} ms`);
  console.log(`  prices     US$${learn.priceInPerMTok} / US$${learn.priceOutPerMTok} per million tokens in / out (learning)`);
}
console.log(`  routes     ${env.AI_ROUTES || '(none: every job to the main model)'}${env.AI_FALLBACK === 'off' ? ', no fallback' : ''}`);
console.log(`  key        ${env.AI_API_KEY ? 'set (not shown)' : 'empty'}${env.AI_LEARN_PROVIDER ? ` · learning key ${env.AI_LEARN_API_KEY ? 'set (not shown)' : 'empty'}` : ''}`);
console.log(`  public key ${env.MYDAY_PUBLISHABLE_KEY ? 'set' : 'not set (the function uses the one Supabase provides)'}`);
for (const n of notes) console.log(`  ✓ ${n}`);
if (problems.length) { console.log('\nTo fix before sending:'); for (const p of problems) console.log(`  - ${p}`); process.exit(1); }
console.log('\nReady: npx supabase secrets set --env-file ' + path.relative(process.cwd(), file) + ' --project-ref nkslcgnbmxuhznvldfnz');
