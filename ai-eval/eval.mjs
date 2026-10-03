#!/usr/bin/env node
// Runs the AI planner evaluation (see README.md in this folder).
//
//   node ai-eval/eval.mjs                                 mock models only (no keys, no cost) — the default
//   node ai-eval/eval.mjs --live --budget-usd 0.50 \
//        --models qwen3.7-plus,glm-5.3-flash              real models: needs their keys and prices (models.json)
//   options: --repeats 3   --scenarios s01-energy-1,s09-clocks-go-back   --out ai-eval/results
//            --total-budget-usd 0.50   a ceiling across all live runs, kept in ai-eval/results/ledger.json
//            --stop-on-failure         after an unsuccessful generation, call that model no more in this run
//            --estimate                print the most the run could cost (no calls, no keys needed)
//
// Keys come only from environment variables (or ai-eval/.env.local, which Git ignores); they're never written out.
// No call is retried.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bundle } from './build.mjs';

process.env.TZ = 'Europe/London'; // the scenarios are set in UK time (before anything uses dates)
const here = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback; };
const live = args.includes('--live');
const env = { ...process.env };
const local = path.join(here, '.env.local');
if (fs.existsSync(local)) {
  for (const line of fs.readFileSync(local, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const models = JSON.parse(fs.readFileSync(path.join(here, 'models.json'), 'utf8')).models;
const modelIds = (opt('--models', live ? '' : 'mock-good,mock-sloppy') || '').split(',').filter(Boolean);
if (!modelIds.length) { console.log('Say which models: --models qwen3.7-plus,glm-5.3-flash'); process.exit(2); }
const budget = opt('--budget-usd', null), totalBudget = opt('--total-budget-usd', null);
const outRoot = path.resolve(opt('--out', path.join(here, 'results')));
// The ledger: every live call ever made from here, with what it counted against the total ceiling. Written after
// each call, so it's right even if a run is stopped half-way. (It's in results/, which Git ignores.)
const ledgerFile = path.join(outRoot, 'ledger.json');
const ledger = fs.existsSync(ledgerFile) ? JSON.parse(fs.readFileSync(ledgerFile, 'utf8')) : { calls: [] };
const spentBefore = ledger.calls.reduce((a, c) => a + c.countedUsd, 0);
const options = {
  live, modelIds,
  repeats: Math.max(1, Math.min(10, Number(opt('--repeats', '3')) || 3)),
  budgetUsd: budget === null ? null : Number(budget),
  totalBudgetUsd: totalBudget === null ? null : Number(totalBudget),
  spentBeforeUsd: spentBefore,
  stopOnFailure: args.includes('--stop-on-failure'),
  scenarioIds: opt('--scenarios', null) ? opt('--scenarios').split(',') : null,
  env, models,
  log: line => { if (!args.includes('--quiet')) console.log('  ' + line); },
  onCall: c => { ledger.calls.push(c); fs.mkdirSync(outRoot, { recursive: true }); fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2)); },
};

const built = await bundle(path.join(here, 'run.ts'), path.join(here, '.build'));
const run = await import(pathToFileURL(built).href);
if (args.includes('--estimate')) {
  try { console.log(run.estimate({ ...options, live: true })); } catch (e) { console.log('Not estimated: ' + e.message); process.exit(2); }
  console.log(`Counted so far in the ledger: US$${spentBefore.toFixed(4)} (${ledger.calls.length} live calls).`);
  process.exit(0);
}
let result;
try { result = await run.evaluate(options); }
catch (e) { console.log('Not run: ' + e.message); process.exit(2); }

const stamp = result.meta.date.slice(0, 19).replace(/[:T]/g, '-');
const out = path.join(outRoot, `${stamp}-${result.meta.mode}`);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'runs.json'), JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(out, 'summary.md'), run.summary(result));
fs.writeFileSync(path.join(out, 'calls.md'), run.calls(result));
fs.writeFileSync(path.join(out, 'review.md'), run.review(result));
console.log(`\n${run.summary(result).split('\n## Rules broken')[0]}`);
if (result.runs.length <= 12) console.log(`## Every call\n\n${run.calls(result)}`);
console.log(`Full results: ${out}`);
