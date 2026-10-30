#!/usr/bin/env node
// The live Arabic tutor study (option 2; ai-eval/arabic-tutor.ts). Two stages, like the revision cards' writer and
// checker on real drafts:
//
//   node ai-eval/arabic-tutor.mjs                                    the tutor stage with the practice stand-in (no cost)
//   node ai-eval/arabic-tutor.mjs --live --models gemini-3.8-flash --budget-usd 0.70 [--repeats 3] [--scenarios at01-…,…]
//   node ai-eval/arabic-tutor.mjs --stage check --drafts <tutor results folder> --live --models gemini-3.8-flash --budget-usd 0.50
//   node ai-eval/arabic-tutor.mjs --estimate [--stage check --drafts …]  the most it could cost (no calls)
//
// Keys come only from the environment (or ai-eval/.env.local, which Git ignores) and are never written out. Every live
// call goes in ai-eval/results/ledger.json, as eval.mjs's do; a call is made only while its worst case fits the budget
// left. No call is retried.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bundle } from './build.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback; };
const live = args.includes('--live'), stage = opt('--stage', 'tutor');
if (!['tutor', 'check'].includes(stage)) { console.log('--stage tutor|check'); process.exit(2); }
const env = { ...process.env };
const localEnv = path.join(here, '.env.local');
if (fs.existsSync(localEnv)) for (const line of fs.readFileSync(localEnv, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const models = JSON.parse(fs.readFileSync(path.join(here, 'models.json'), 'utf8')).models;
const modelIds = (opt('--models', live ? '' : 'mock') || '').split(',').filter(Boolean);
if (!modelIds.length) { console.log('Say which model: --models gemini-3.8-flash'); process.exit(2); }
const repeats = Math.max(1, Math.min(5, Number(opt('--repeats', '3')) || 3));
const budget = opt('--budget-usd', null) === null ? null : Number(opt('--budget-usd'));
if (live && !(budget > 0) && !args.includes('--estimate')) { console.log('A live run needs a budget: --budget-usd 0.70 (for example).'); process.exit(2); }
const outRoot = path.join(here, 'results'), ledgerFile = path.join(outRoot, 'ledger.json');
const ledger = fs.existsSync(ledgerFile) ? JSON.parse(fs.readFileSync(ledgerFile, 'utf8')) : { calls: [] };

const K = await import(pathToFileURL(await bundle(path.join(here, 'arabic-tutor.ts'), path.join(here, '.build-tutor'))).href);
// The jobs' own reply caps and waits: a tutor's explanation with tables needs more room than an app reply's 2,048.
const LIMITS = { tutor: { maxOutputTokens: 4000, timeoutMs: 90000 }, check: { maxOutputTokens: 2048, timeoutMs: 60000 } };
function config(id) {
  if (id === 'mock') return { id, cfg: { provider: 'mock', label: 'Practice stand-in (no AI)', model: 'mock', maxOutputTokens: 4000, timeoutMs: 1000, temperature: 0, priceInPerMTok: 0, priceOutPerMTok: 0 } };
  const m = models[id];
  if (!m) throw new Error(`Unknown model "${id}" (ai-eval/models.json)`);
  const apiKey = env[m.keyEnv];
  if (live && !apiKey && !args.includes('--estimate')) throw new Error(`"${id}" needs ${m.keyEnv}`);
  return { id, cfg: { provider: m.provider, label: m.label, model: m.model, baseUrl: m.baseUrl, apiKey, maxTokensField: m.maxTokensField, jsonMode: m.jsonMode, temperature: m.temperature ?? 0.2,
    extraBody: m.extraBody, priceInPerMTok: m.priceInPerMTok ?? null, priceOutPerMTok: m.priceOutPerMTok ?? null, ...LIMITS[stage] } };
}
const configs = modelIds.map(config);

// The jobs: each tutor question × repeat, or each usable draft of a tutor run.
const MOCK_TUTOR = JSON.stringify({ title: 'Practice stand-in', steps: [{ heading: 'One step', text: 'A practice step.', table: [{ form: 'he said', ar: 'قَالَ', meaning: 'he said' }] }],
  selfTest: [{ question: 'What does قَالَ mean?', answer: 'he said' }, { question: 'Q2', answer: 'A2' }, { question: 'Q3', answer: 'A3' }], followUp: 'Which form would you like to try?' });
let jobs;
if (stage === 'tutor') {
  const ids = opt('--scenarios', null)?.split(',') ?? null;
  const scs = K.ARABIC_TUTOR_SCENARIOS.filter(s => !ids || ids.includes(s.id));
  if (ids && scs.length !== ids.length) { console.log('Unknown scenario in --scenarios'); process.exit(2); }
  jobs = [];
  for (let rep = 1; rep <= repeats; rep++) for (const sc of scs) jobs.push({ key: `${sc.id}#${rep}`, scenario: sc.id, rep, messages: K.tutorMessages(sc), sc, mock: MOCK_TUTOR });
} else {
  const dir = opt('--drafts', null);
  if (!dir) { console.log('--stage check needs --drafts <tutor results folder>'); process.exit(2); }
  const tutorRun = JSON.parse(fs.readFileSync(path.join(path.resolve(dir), 'runs.json'), 'utf8'));
  jobs = tutorRun.runs.filter(r => r.checks?.usable).map(r => {
    const sc = K.ARABIC_TUTOR_SCENARIOS.find(s => s.id === r.scenario);
    return { key: `${r.scenario}#${r.rep}`, scenario: r.scenario, rep: r.rep, messages: K.checkerMessages(sc.question, r.reply), sc, draftOf: path.basename(path.resolve(dir)), mock: '{"problems":[]}' };
  });
}

if (args.includes('--estimate')) {
  for (const { id, cfg } of configs) {
    const most = jobs.reduce((a, j) => a + (K.worstCaseUsd(cfg, j.messages) ?? NaN), 0);
    console.log(`${id}: ${jobs.length} calls; the most they could cost: US$${most.toFixed(4)} (a reply cap of ${cfg.maxOutputTokens} tokens each, reasoning included).`);
  }
  console.log(`Counted so far in the ledger: US$${ledger.calls.reduce((a, c) => a + c.countedUsd, 0).toFixed(4)} over ${ledger.calls.length} live calls.`);
  process.exit(0);
}

const runs = [];
let spent = 0, stopped = false, unreachable = 0;
for (const j of jobs) {
  for (const { id, cfg } of configs) {
    const rec = { model: id, scenario: j.scenario, rep: j.rep, outcome: 'error', latencyMs: null, inputTokens: null, outputTokens: null, reasoningTokens: null, reservedUsd: null, costUsd: null, reply: null };
    const real = cfg.provider !== 'mock';
    if (real) {
      const reserve = K.worstCaseUsd(cfg, j.messages) ?? Infinity;
      if (stopped || reserve > budget - spent || unreachable >= 3) { stopped = true; rec.outcome = 'skipped-budget'; runs.push(rec); continue; }
      rec.reservedUsd = reserve;
    }
    const res = await K.callChat(cfg, j.messages, j.mock);
    Object.assign(rec, { latencyMs: res.latencyMs, inputTokens: res.inputTokens ?? null, outputTokens: res.outputTokens ?? null, reasoningTokens: res.reasoningTokens ?? null });
    rec.costUsd = K.costUsd(cfg, rec.inputTokens, rec.outputTokens);
    if (real) {
      const counted = rec.costUsd ?? rec.reservedUsd;
      spent += counted;
      ledger.calls.push({ at: new Date().toISOString(), model: id, scenario: `${stage === 'tutor' ? 'arabic-tutor' : 'arabic-tutor-check'}:${j.scenario}`, rep: j.rep, reservedUsd: rec.reservedUsd, countedUsd: counted,
        counted: rec.costUsd === null ? 'reserved' : 'usage', outcome: res.ok ? 'reply' : res.error });
      fs.mkdirSync(outRoot, { recursive: true }); fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2));
      unreachable = !res.ok && (res.error === 'network' || res.error === 'timeout') ? unreachable + 1 : 0;
    }
    if (!res.ok) { rec.outcome = res.error + (res.status ? ` ${res.status}` : ''); rec.detail = res.detail; runs.push(rec); console.log(`  ${id} ${j.key}: ${rec.outcome}`); continue; }
    rec.reply = res.text.slice(0, 20000);
    if (stage === 'tutor') {
      rec.checks = K.autoChecks(j.sc, res.text);
      rec.outcome = rec.checks.usable ? 'ok' : 'unusable';
    } else {
      const c = K.readChecker(res.text);
      rec.outcome = c ? 'ok' : 'unusable';
      rec.problems = c ? c.problems : null;
      rec.draftOf = j.draftOf;
    }
    runs.push(rec);
    console.log(`  ${id} ${j.key}: ${rec.outcome}${rec.checks ? ` — ${rec.checks.arabicPieces} Arabic, ${rec.checks.notVowelled.length} not fully vowelled${rec.checks.colloquial.length ? `, colloquial ${rec.checks.colloquial.join(' ')}` : ''}${rec.checks.checkPhrasesUsed.length ? `, check phrase ${rec.checks.checkPhrasesUsed.join(' ')}` : ''}` : rec.problems ? ` — ${rec.problems.length} problem(s)` : ''}`);
  }
}

// Results: the runs, readable drafts or checks, and a summary.
const mode = live ? 'live' : 'mock';
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const out = path.join(outRoot, `${stamp}-arabic-${stage === 'tutor' ? 'tutor' : 'tutor-check'}-${mode}`);
fs.mkdirSync(out, { recursive: true });
const meta = { date: new Date().toISOString(), stage, mode, version: stage === 'tutor' ? K.TUTOR_VERSION : K.CHECKER_VERSION, models: configs.map(c => c.id), repeats, budgetUsd: budget, spentUsd: Math.round(spent * 1e6) / 1e6, stoppedForBudget: stopped };
fs.writeFileSync(path.join(out, 'runs.json'), JSON.stringify({ meta, runs }, null, 2));
const ok = runs.filter(r => r.outcome === 'ok'), sum = (f) => runs.reduce((a, r) => a + (f(r) ?? 0), 0);
const lines = [`# Arabic tutor study — ${stage} stage (${mode})`, '', `${meta.version}; models ${meta.models.join(', ')}; ${runs.length} calls, ${ok.length} usable; spent US$${meta.spentUsd.toFixed(4)}${stopped ? ' (stopped at the budget)' : ''}.`,
  `Tokens: ${sum(r => r.inputTokens)} in, ${sum(r => r.outputTokens)} out (of which reasoning ${sum(r => r.reasoningTokens)}); latency p50 ${(() => { const l = runs.map(r => r.latencyMs).filter(x => x != null).sort((a, b) => a - b); return l.length ? l[Math.floor(l.length / 2)] : '—'; })()} ms.`, ''];
if (stage === 'tutor') {
  const c = ok.map(r => r.checks);
  lines.push(`- Arabic pieces: ${sum(r => r.checks?.arabicPieces)}; not fully vowelled: ${c.reduce((a, x) => a + x.notVowelled.length, 0)} in ${c.filter(x => x.notVowelled.length).length} replies.`,
    `- Colloquial words: ${c.filter(x => x.colloquial.length).length} replies; Latin transliteration written anyway: ${c.filter(x => x.latinTransliteration.length).length}; religious framing: ${c.filter(x => x.religious).length}.`,
    `- A lesson check's own answer phrase used (for the reviewer to judge): ${c.filter(x => x.checkPhrasesUsed.length).length} replies not taught by the lesson; ${c.filter(x => x.checkPhrasesTaughtUsed.length).length} already taught by it.`, '');
  const drafts = ['# Drafts, as MyDay would show them (its own transliteration from the vowels)', ''];
  for (const r of ok) {
    const sc = K.ARABIC_TUTOR_SCENARIOS.find(s => s.id === r.scenario);
    drafts.push(`## ${r.scenario} #${r.rep} — “${sc.question}”`, '', K.render(K.readTutor(r.reply)), '');
  }
  fs.writeFileSync(path.join(out, 'drafts.md'), drafts.join('\n'));
} else {
  lines.push(`- Problems reported: ${ok.reduce((a, r) => a + r.problems.length, 0)} across ${ok.filter(r => r.problems.length).length} of ${ok.length} drafts.`, '');
  const checksMd = ['# The checker on each draft', ''];
  for (const r of ok) { checksMd.push(`## ${r.scenario} #${r.rep}`, ''); for (const p of r.problems) checksMd.push(`- **${p.kind}** at ${p.where}: ${p.arabic} → ${p.fix} (${p.why})`); if (!r.problems.length) checksMd.push('- (none)'); checksMd.push(''); }
  fs.writeFileSync(path.join(out, 'checks.md'), checksMd.join('\n'));
}
fs.writeFileSync(path.join(out, 'summary.md'), lines.join('\n'));
console.log('\n' + lines.join('\n'));
console.log(`Full results: ${out}`);
