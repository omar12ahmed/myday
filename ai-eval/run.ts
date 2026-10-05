// The evaluation: every synthetic scenario (scenarios.ts), with identical instructions, context and output shape
// for each model, repeated, and checked by the app's own rules (validate.ts). Run it with ai-eval/eval.mjs.
//
// Nothing here touches real MyDay data: each scenario is built in memory from the app's defaults. Results keep
// only made-up scenario content and numbers — never API keys, and never a prompt (which could carry real data
// if someone pointed this at real records).
import * as K from './kit';
import { SCENARIOS, type Scenario } from './scenarios';
import { TASK_SCENARIOS, type TasksScenario } from './tasks-scenarios';
import { CONNECT_SCENARIOS, type ConnectScenario } from './connect-scenarios';

// Every kind of request: "Help me adjust today" (scenarios.ts), "Add what's on my mind" (tasks-scenarios.ts) and AI
// help with notes (connect-scenarios.ts).
type AnyScenario = Scenario | TasksScenario | ConnectScenario;
const ALL_SCENARIOS: AnyScenario[] = [...SCENARIOS, ...TASK_SCENARIOS, ...CONNECT_SCENARIOS];
const isTasksScenario = (sc: AnyScenario): sc is TasksScenario => (sc as TasksScenario).kind === 'tasks';
const isConnectScenario = (sc: AnyScenario): sc is ConnectScenario => (sc as ConnectScenario).kind === 'connect';
const actionOf = (sc: AnyScenario) => (isTasksScenario(sc) ? 'tasks' : isConnectScenario(sc) ? 'connect' : 'adjust');
export type Action = 'adjust' | 'tasks' | 'connect' | 'all';
// The scenarios a run uses: the ones named, or all of one action ("adjust" unless said otherwise).
function pickScenarios(ids: string[] | null, action: Action = 'adjust'): AnyScenario[] {
  if (ids) {
    const unknown = ids.filter(id => !ALL_SCENARIOS.some(s => s.id === id));
    if (unknown.length) throw new Error(`Unknown scenario ${unknown.map(x => `"${x}"`).join(', ')} (see ai-eval/scenarios.ts, tasks-scenarios.ts and connect-scenarios.ts).`);
    return ALL_SCENARIOS.filter(s => ids.includes(s.id));
  }
  return ALL_SCENARIOS.filter(s => action === 'all' || actionOf(s) === action);
}

export interface ModelEntry {
  label: string;
  provider: 'openai-compatible' | 'mock';
  model: string;
  baseUrl?: string;              // may contain {Name} placeholders, filled from the environment variables in urlVars
  urlVars?: Record<string, string>; // e.g. { "WorkspaceId": "DASHSCOPE_WORKSPACE_ID" }
  baseUrlEnv?: string;           // an environment variable that, if set, gives the whole address instead (no placeholders needed)
  keyEnv?: string;               // the environment variable holding the key (never the key itself)
  maxTokensField?: 'max_tokens' | 'max_completion_tokens';
  jsonMode?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  extraBody?: Record<string, unknown>;
  priceInPerMTok: number | null; // US$ per million tokens
  priceOutPerMTok: number | null;
  priceTierMaxInputTokens?: number; // the prices above hold for prompts up to this many input tokens
  mockDelayMs?: number;
}
export interface Options {
  live: boolean;
  modelIds: string[];
  repeats: number;
  budgetUsd: number | null;        // this run's limit
  totalBudgetUsd?: number | null;  // the ceiling across all live runs (with spentBeforeUsd, from the ledger)
  spentBeforeUsd?: number;         // what earlier live runs count against it (ai-eval/results/ledger.json)
  reservedBeforeUsd?: number;      // …of which reservations kept for calls that reported no token usage
  stopOnFailure?: boolean;         // after an unsuccessful generation, call that model no more in this run
  scenarioIds: string[] | null;
  action?: Action;                 // which scenarios, when none are named: "adjust" (the default), "tasks" or "all"
  env: Record<string, string | undefined>;
  models: Record<string, ModelEntry>;
  log: (line: string) => void;
  onCall?: (c: LedgerEntry) => void; // each live call as soon as it's made (for the ledger)
}
// One live call, for the ledger: what was set aside before calling and what is counted after it (the cost estimated
// provider's token counts, or — if it didn't report them — everything that was set aside).
export interface LedgerEntry { at: string; model: string; scenario: string; rep: number; reservedUsd: number; countedUsd: number; counted: 'usage' | 'reserved'; outcome: string }
// What a scenario expects of a suggestion; each one checked twice: on the model's own reply, and on the proposal
// the app would show after its corrections.
export type Expectations = Record<string, boolean>;
export interface RunRecord {
  model: string; scenario: string; rep: number;
  outcome: 'ok' | 'invalid' | 'error' | 'skipped-budget' | 'skipped-failure' | 'skipped-connection';
  error?: string;                  // e.g. "truncated", "http 400"
  errorDetail?: string;            // the provider's message, shortened, with any key blanked out
  finishReason: string | null;
  latencyMs: number | null; inputTokens: number | null; outputTokens: number | null; reasoningTokens: number | null;
  reservedUsd: number | null; costUsd: number | null;
  originalReply: string | null;    // the model's reply as received (made-up scenarios only), to check flags against
  violations: string[];            // rules the model's own reply broke (codes)
  violationDetails: string[];      // …with what, e.g. 'too-long: "Gym session": 60 of 30 min'
  adjusted: string[];              // what the app changed, as shown to you
  expectRaw: Expectations;         // the scenario's expectations, on the model's own reply
  expectFinal: Expectations;       // …on the proposal after the app's corrections (what you'd see)
  explanationWords: number;
  priorities: number;
  rest: boolean;
  savedSafely: boolean | null; // applying it changed only today's plan (lists, other days and energy untouched)
  shown: { rest: boolean; priorities: string[]; explanation: string; missing: string[] } | null;
}
export interface Result {
  meta: {
    date: string; mode: 'live' | 'mock'; promptVersion: string; models: { id: string; label: string; model: string; maxOutputTokens: number }[];
    repeats: number; scenarios: number; retries: 0;
    budgetUsd: number | null; totalBudgetUsd: number | null; spentBeforeUsd: number; reservedBeforeUsd?: number;
    spentUsd: number;      // counted against the budget by this run: usageUsd + reservedUsd
    usageUsd?: number;     // estimated cost from reported token usage (results saved before 4 Oct 2026 lack it)
    reservedUsd?: number;  // reservations kept for calls that reported no usage (until provider billing resolves them)
    stoppedForBudget: boolean;
    stoppedForConnection: boolean;
  };
  runs: RunRecord[];
}

const words = (s: unknown) => (typeof s === 'string' && s.trim() ? s.trim().split(/\s+/).length : 0);
const clockMin = (c: string) => Number(c.slice(0, 2)) * 60 + Number(c.slice(3, 5));
const clockOf = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

function setUp(sc: AnyScenario) {
  K.useMemoryStorage();
  K.setClock(sc.now);
  const s = K.freshState();
  sc.build?.(s);
  localStorage.setItem('myday.data.v4', JSON.stringify(s));
  K.boot();
  return { data: K.getSnapshot().data, k: K.todayKey() };
}

// A suggestion reduced to what the expectations look at: rest or not, each task's minutes and start ("HH:MM" or
// anything else the model wrote), and what it says is missing.
interface View { rest: boolean; items: { minutes: number; start: unknown }[]; missing: string }
function rawView(raw: unknown): View | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const items = (Array.isArray(r.priorities) ? r.priorities : []).filter(x => x && typeof x === 'object').map(x => ({ minutes: Number((x as Record<string, unknown>).minutes) || 0, start: (x as Record<string, unknown>).start }));
  return { rest: r.rest === true || items.length === 0, items, missing: Array.isArray(r.missing) ? r.missing.join(' ').toLowerCase() : '' };
}
function finalView(p: K.CheckedProposal | null): View | null {
  if (!p) return null;
  return { rest: p.rest || p.priorities.length === 0, items: p.priorities.map(x => ({ minutes: x.minutes, start: x.start === null ? null : clockOf(x.start) })), missing: p.missing.join(' ').toLowerCase() };
}
// The scenario's "what a useful suggestion does". No reply (or not the JSON asked for) meets none of them.
function expectations(sc: Scenario, v: View | null): Expectations {
  const e = sc.expect, out: Expectations = {};
  if (e.restExpected) out.rest = !!v && v.rest;
  if (e.maxTotalMinutes !== undefined) out.fitsTime = !!v && (v.rest || v.items.reduce((a, x) => a + x.minutes, 0) <= e.maxTotalMinutes);
  if (e.minPriorities !== undefined) out.suggests = !!v && !v.rest && v.items.length >= e.minPriorities;
  if (e.missing) for (const m of e.missing) out[`flags-${m}`] = !!v && (m === 'sleep' ? /sleep|slept/.test(v.missing) : v.missing.includes(m));
  if (e.nothingTimedIn) {
    const [a, b] = e.nothingTimedIn.map(clockMin);
    out.avoidsBusy = !!v && v.items.every(x => typeof x.start !== 'string' || !/^\d\d:\d\d$/.test(x.start) || clockMin(x.start) < a || clockMin(x.start) >= b);
  }
  return out;
}

// ---------- "Add what's on my mind": what a useful answer does ----------
interface TasksView { items: { title: string; category: string; minutes: number; repeat: boolean }[]; notTasks: string }
function rawTasksView(raw: unknown): TasksView | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.items)) return null;
  const items = r.items.filter(x => x && typeof x === 'object').map(x => {
    const i = x as Record<string, unknown>;
    return { title: String(i.title ?? ''), category: String(i.category ?? ''), minutes: Number(i.minutes) || 0, repeat: i.repeat === true };
  });
  return { items, notTasks: Array.isArray(r.notTasks) ? r.notTasks.filter(n => typeof n === 'string').join(' | ') : '' };
}
const finalTasksView = (p: K.CheckedMind | null): TasksView | null => (p ? { items: p.items, notTasks: p.notTasks.join(' | ') } : null);
const STOP = new Set(['the', 'a', 'an', 'to', 'for', 'of', 'and', 'my', 'your', 'on', 'in', 'at', 'with', 'up', 'out', 'it', 'is', 'about', 'from', 'some', 'this', 'that']);
const wordsOf = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 2 && !STOP.has(w));
function tasksExpectations(sc: TasksScenario, v: TasksView | null, text: string): Expectations {
  const e = sc.expect, out: Expectations = {};
  const titles = v ? v.items.map(i => i.title) : [];
  const matching = (re: RegExp) => (v ? v.items.filter(i => re.test(i.title)) : []);
  if (e.count) out.count = !!v && v.items.length >= e.count[0] && v.items.length <= e.count[1];
  if (e.include) out.include = !!v && e.include.every(re => titles.some(t => re.test(t)));
  if (e.exclude) out.exclude = !!v && !e.exclude.some(re => titles.some(t => re.test(t)));
  if (e.categories) out.categories = !!v && e.categories.every(([re, cat]) => matching(re).length > 0 && matching(re).every(i => i.category === cat));
  if (e.repeating) out.repeating = !!v && e.repeating.every(re => matching(re).length > 0 && matching(re).every(i => i.repeat));
  if (e.oneOff) out.oneOff = !!v && e.oneOff.every(re => matching(re).every(i => !i.repeat));
  if (e.notTasks) out.notTasks = !!v && e.notTasks.every(re => re.test(v.notTasks));
  out.small = !!v && v.items.every(i => i.minutes > 0 && i.minutes <= (e.maxMinutes ?? 60));
  // Nothing invented: every task shares a word (by its first four letters) with what was written. A rough guide.
  const said = wordsOf(text);
  out.fromText = !!v && v.items.every(i => wordsOf(i.title).some(w => said.some(t => t.startsWith(w.slice(0, 4)) || w.startsWith(t.slice(0, 4)))));
  return out;
}

// AI help with notes: which notes went where, against what the scenario says is right.
type Links = Record<string, { projectId: string | null; kind: string }>;
function rawLinks(text: string): Links | null {
  const raw = K.parseReply(text);
  const list = raw && typeof raw === 'object' && Array.isArray((raw as { notes?: unknown }).notes) ? (raw as { notes: Record<string, unknown>[] }).notes : null;
  if (!list) return null;
  return Object.fromEntries(list.filter(x => x && typeof x.id === 'string').map(x => [x.id as string, { projectId: typeof x.projectId === 'string' ? x.projectId : null, kind: String(x.kind ?? '') }]));
}
function connectExpectations(sc: ConnectScenario, sent: string[], links: Links | null): Expectations {
  const out: Expectations = { sentAll: Object.keys(sc.expect.links).every(id => sent.includes(id)) };
  const ok = (id: string, got: string | null) => { const want = sc.expect.links[id]; return Array.isArray(want) ? want.includes(got) : want === got; };
  // The one that matters most: nothing put in a project it doesn't belong in.
  out.noWrongLinks = !!links && Object.keys(sc.expect.links).every(id => { const got = links[id]?.projectId ?? null; return got === null || ok(id, got); });
  out.rightLinks = !!links && Object.keys(sc.expect.links).every(id => ok(id, links[id]?.projectId ?? null));
  if (sc.expect.kinds) out.kinds = !!links && Object.entries(sc.expect.kinds).every(([id, ks]) => ks.includes(links[id]?.kind as never));
  return out;
}

// One scenario ready to send: its context, and how to score a reply (filling in the run record).
interface Prepared { ctx: Parameters<typeof K.callModel>[1]; score: (rec: RunRecord, text: string) => void }
function prepare(sc: AnyScenario): Prepared {
  const { data, k } = setUp(sc);
  if (isConnectScenario(sc)) {
    const plan = K.connectContext(data);
    if (!plan) throw new Error(`Scenario ${sc.id} has nothing to send (no open projects, or the device places every note).`);
    const sent = plan.ctx.notes.map(n => n.id);
    return {
      ctx: plan.ctx,
      score(rec, text) {
        const checked = K.readConnectReply(text, plan.ctx);
        rec.violations = checked.leftOut ? [`left-out x${checked.leftOut}`] : [];
        rec.violationDetails = rec.violations.slice();
        rec.outcome = checked.answers.length ? 'ok' : 'invalid';
        rec.expectRaw = connectExpectations(sc, sent, rawLinks(text));
        // What you'd see: the checked answers, as the app would link them.
        const was = JSON.parse(JSON.stringify(K.getSnapshot().data));
        K.update(d => { K.applyConnect(d, plan.seen, checked.answers); });
        const now = K.getSnapshot().data;
        const final: Links = Object.fromEntries(now.notes.items.filter(n => sent.includes(n.id)).map(n => [n.id, { projectId: n.projectId ?? null, kind: n.aiKind ?? '' }]));
        rec.expectFinal = connectExpectations(sc, sent, final); // a reply the app couldn't use links nothing: safe, just not useful
        rec.priorities = Object.values(final).filter(x => x.projectId).length;
        const title = (id: string | null) => (id ? now.projects.items.find(p => p.id === id)?.title ?? id : 'no project');
        rec.shown = { rest: false, priorities: now.notes.items.filter(n => sent.includes(n.id)).map(n => `“${(n.title || n.text).slice(0, 50)}” → ${title(n.projectId ?? null)} (${n.aiKind ?? '?'})${n.linkWhy ? `: ${n.linkWhy}` : ''}`), explanation: '', missing: [] };
        // Using the answers must change only notes, and only their link and AI fields — never their words.
        const rest = (x: typeof now) => JSON.stringify({ ...x, notes: null, saves: null });
        const words = (x: typeof now) => JSON.stringify(x.notes.items.map(n => [n.id, n.title, n.text, n.categoryId, n.updatedAt]));
        rec.savedSafely = rest(now) === rest(was) && words(now) === words(was);
      },
    };
  }
  if (isTasksScenario(sc)) {
    return {
      ctx: K.buildTasksContext(sc.text),
      score(rec, text) {
        const raw = K.parseReply(text);
        const checked = K.checkTasksReply(text, data);
        const p = checked.proposal;
        rec.violations = checked.violations.map(v => v.code);
        rec.violationDetails = checked.violations.map(v => `${v.code}: ${v.detail}`);
        rec.outcome = p ? 'ok' : 'invalid';
        rec.explanationWords = raw && typeof raw === 'object' ? words((raw as Record<string, unknown>).explanation) : 0;
        rec.expectRaw = tasksExpectations(sc, rawTasksView(raw), sc.text);
        rec.expectFinal = tasksExpectations(sc, finalTasksView(p), sc.text);
        if (!p) return;
        rec.priorities = p.items.length; rec.adjusted = p.adjusted;
        rec.shown = { rest: false, priorities: p.items.map(i => `${i.title} · ${i.category} · ${i.minutes} min${i.repeat ? ' · repeating' : ''}${i.already ? ` (already on ${i.already})` : ''}`), explanation: p.explanation, missing: p.notTasks.map(n => `not a task: ${n}`) };
        // Adding them all (as if all ticked, except those already there) must change only the lists and the queue,
        // and only by adding.
        const was = JSON.parse(JSON.stringify(K.getSnapshot().data));
        const r = K.applyMind(p.items.filter(i => !i.already).map(i => ({ title: i.title, category: i.category, minutes: i.minutes, repeat: i.repeat })));
        const now = K.getSnapshot().data;
        const rest = (d: typeof now) => JSON.stringify({ ...d, lists: null, queue: null, saves: null });
        const onlyAdded = (['learning', 'admin', 'health'] as const).every(c => JSON.stringify(now.lists[c].slice(0, was.lists[c].length)) === JSON.stringify(was.lists[c]))
          && was.queue.every((q: { qid: string }) => now.queue.some(x => x.qid === q.qid));
        rec.savedSafely = (r.ok || (r.reason === 'nothing' && !p.items.some(i => !i.already))) && rest(now) === rest(was) && onlyAdded;
      },
    };
  }
  return {
    ctx: K.buildContext(data, k, sc.note),
    score(rec, text) {
      const raw = K.parseReply(text);
      const checked = K.checkProposal(text, data, k);
      const p = checked.proposal;
      rec.violations = checked.violations.map(v => v.code);
      rec.violationDetails = checked.violations.map(v => `${v.code}: ${v.detail}`);
      rec.outcome = p ? 'ok' : 'invalid';
      rec.explanationWords = raw && typeof raw === 'object' ? words((raw as Record<string, unknown>).explanation) : 0;
      rec.expectRaw = expectations(sc, rawView(raw));
      rec.expectFinal = expectations(sc, finalView(p));
      if (!p) return;
      rec.priorities = p.priorities.length; rec.rest = p.rest; rec.adjusted = p.adjusted;
      rec.shown = { rest: p.rest, priorities: p.priorities.map(x => `${x.title} · ${x.minutes} min${x.start !== null ? ` · ${clockOf(x.start)}` : ''}`), explanation: p.explanation, missing: p.missing };
      // Saving it through the app's own path must change today's plan only.
      const was = JSON.parse(JSON.stringify(K.getSnapshot().data));
      const r = K.applyAi(k, K.planStamp(K.getSnapshot().data, k), p);
      const after = K.getSnapshot().data;
      const otherDays = (d: typeof after) => JSON.stringify(Object.fromEntries(Object.entries(d.days).filter(([dk]) => dk !== k)));
      rec.savedSafely = r.ok && JSON.stringify(after.lists) === JSON.stringify(was.lists) && otherDays(after) === otherDays(was)
        && (after.days[k] ? after.days[k].energy : null) === (was.days[k] ? was.days[k].energy : null);
    },
  };
}

export async function evaluate(o: Options): Promise<Result> {
  const startedAt = new Date().toISOString(); // the real time (scenarios set their own clock after this)
  const scenarios = pickScenarios(o.scenarioIds, o.action);
  const configs: { id: string; cfg: K.ProviderConfig }[] = [];
  for (const id of o.modelIds) {
    const m = o.models[id];
    if (!m) throw new Error(`Unknown model "${id}" (see ai-eval/models.json).`);
    if (m.provider !== 'mock' && !o.live) throw new Error(`"${id}" is a real model: add --live (and --budget-usd) to call it.`);
    const apiKey = m.keyEnv ? o.env[m.keyEnv] : undefined;
    if (m.provider !== 'mock' && !apiKey) throw new Error(`"${id}" needs its key in the environment variable ${m.keyEnv}.`);
    if (m.provider !== 'mock' && (m.priceInPerMTok === null || m.priceOutPerMTok === null)) throw new Error(`"${id}" needs its prices in ai-eval/models.json, so the budget can be enforced.`);
    const override = m.baseUrlEnv ? o.env[m.baseUrlEnv] : undefined;
    let baseUrl = override || m.baseUrl;
    for (const [name, envName] of Object.entries(override ? {} : m.urlVars || {})) {
      const v = o.env[envName];
      if (m.provider !== 'mock' && !v) throw new Error(`"${id}" needs ${envName} (your ${name}, from the provider's console) for its address.`);
      if (baseUrl && v) baseUrl = baseUrl.replace(`{${name}}`, encodeURIComponent(v));
    }
    configs.push({ id, cfg: { provider: m.provider, label: m.label, model: m.model, baseUrl, apiKey, maxTokensField: m.maxTokensField, jsonMode: m.jsonMode, temperature: m.temperature ?? 0.2, maxOutputTokens: m.maxOutputTokens ?? 600, timeoutMs: m.timeoutMs ?? 30000, extraBody: m.extraBody, priceInPerMTok: m.priceInPerMTok, priceOutPerMTok: m.priceOutPerMTok, mockDelayMs: m.mockDelayMs ?? 0 } });
  }
  if (o.live && (o.budgetUsd === null || !(o.budgetUsd > 0))) throw new Error('A live run needs a budget: --budget-usd 0.50 (for example).');
  const before = o.spentBeforeUsd ?? 0, total = o.totalBudgetUsd ?? null;
  if (o.live && total !== null && before >= total) throw new Error(`The total budget (US$${total}) is used up: US$${before.toFixed(4)} counted in the ledger.`);

  const runs: RunRecord[] = [];
  const failed = new Set<string>();
  let spent = 0, usage = 0, reservedKept = 0, stopped = false;
  // Calls in a row that couldn't reach any provider (no connection, or no answer in time). After a few, the run
  // stops: the connection is probably down (or the computer went to sleep), and each such call would still be
  // counted against the budget at the most it could have cost.
  const CONNECTION_FAILURES_TO_STOP = 3;
  let unreachable = 0, lostConnection = false;
  // Models take turns on each scenario, so a slow moment at the provider doesn't fall on one model only.
  // No call is ever retried: one request per scenario, model and repeat.
  for (let rep = 1; rep <= o.repeats; rep++) {
    for (const sc of scenarios) {
      for (const { id, cfg } of configs) {
        const rec: RunRecord = { model: id, scenario: sc.id, rep, outcome: 'error', finishReason: null, latencyMs: null, inputTokens: null, outputTokens: null, reasoningTokens: null, reservedUsd: null, costUsd: null,
          originalReply: null, violations: [], violationDetails: [], adjusted: [], expectRaw: {}, expectFinal: {}, explanationWords: 0, priorities: 0, rest: false, savedSafely: null, shown: null };
        if (lostConnection) { rec.outcome = 'skipped-connection'; runs.push(rec); continue; }
        if (o.stopOnFailure && failed.has(id)) { rec.outcome = 'skipped-failure'; runs.push(rec); continue; }
        const { ctx, score } = prepare(sc);
        const real = cfg.provider !== 'mock';
        if (real) {
          // Set aside the most this call could cost; don't make it if that's more than is left (this run, or overall).
          const reserve = K.worstCaseCostUsd(cfg, ctx) ?? Infinity;
          const left = Math.min((o.budgetUsd as number) - spent, total === null ? Infinity : total - before - spent);
          if (stopped || reserve > left) { stopped = true; rec.outcome = 'skipped-budget'; runs.push(rec); continue; }
          rec.reservedUsd = reserve;
        }
        const res = await K.callModel(cfg, ctx);
        rec.latencyMs = res.latencyMs;
        rec.inputTokens = res.inputTokens ?? null; rec.outputTokens = res.outputTokens ?? null; rec.reasoningTokens = res.reasoningTokens ?? null;
        rec.finishReason = res.finishReason ?? null;
        rec.costUsd = K.costUsd(cfg, rec.inputTokens, rec.outputTokens);
        if (real) {
          // Counted: the cost from the provider's token counts; without them (an error, a time-out), all that was set aside.
          const counted = rec.costUsd ?? (rec.reservedUsd as number);
          spent += counted;
          if (rec.costUsd === null) reservedKept += counted; else usage += counted;
          o.onCall?.({ at: new Date().toISOString(), model: id, scenario: sc.id, rep, reservedUsd: rec.reservedUsd as number, countedUsd: counted, counted: rec.costUsd === null ? 'reserved' : 'usage', outcome: res.ok ? 'reply' : res.error });
        }
        if (real) unreachable = !res.ok && (res.error === 'network' || res.error === 'timeout') ? unreachable + 1 : 0;
        if (unreachable >= CONNECTION_FAILURES_TO_STOP) lostConnection = true;
        if (!res.ok) {
          rec.error = res.error + (res.status ? ` ${res.status}` : '') + (res.finishReason && res.error !== 'http' ? ` (finish_reason ${res.finishReason})` : '');
          if (res.detail) rec.errorDetail = res.detail;
          failed.add(id);
          runs.push(rec); o.log(`${id} ${sc.id} #${rep}: unsuccessful — ${rec.error}${rec.errorDetail ? `: ${rec.errorDetail}` : ''}`); continue;
        }
        rec.originalReply = res.text.slice(0, 4000);
        score(rec, res.text);
        if (rec.outcome !== 'ok') failed.add(id);
        runs.push(rec);
        o.log(`${id} ${sc.id} #${rep}: ${rec.outcome}${rec.violations.length ? ' (' + rec.violations.join(', ') + ')' : ''}`);
      }
    }
  }
  return {
    meta: {
      date: startedAt, mode: o.live ? 'live' : 'mock',
      promptVersion: [scenarios.some(s => actionOf(s) === 'adjust') && K.PROMPT_VERSION, scenarios.some(isTasksScenario) && K.TASKS_PROMPT_VERSION, scenarios.some(isConnectScenario) && K.CONNECT_PROMPT_VERSION].filter(Boolean).join(' + '),
      models: configs.map(c => ({ id: c.id, label: c.cfg.label, model: c.cfg.model, maxOutputTokens: c.cfg.maxOutputTokens })), repeats: o.repeats, scenarios: scenarios.length, retries: 0,
      budgetUsd: o.budgetUsd, totalBudgetUsd: total, spentBeforeUsd: before, reservedBeforeUsd: o.reservedBeforeUsd ?? 0,
      spentUsd: Math.round(spent * 1e6) / 1e6, usageUsd: Math.round(usage * 1e6) / 1e6, reservedUsd: Math.round(reservedKept * 1e6) / 1e6, stoppedForBudget: stopped,
      stoppedForConnection: lostConnection,
    },
    runs,
  };
}

// ---------- Before a live run: the most it could cost ----------
// From the prompts exactly as they'd be sent (every selected scenario, serialised), counted generously (3 characters a
// token, plus a quarter), and each model's whole reply cap at its output price (the cap includes any reasoning, which
// is billed as output). Then a further quarter on top of the lot, for anything these assumptions miss.
export const CONTINGENCY = 1.25;
export function estimate(o: Options): string {
  const scenarios = pickScenarios(o.scenarioIds, o.action);
  const lines = ['| Model | Calls | Prompt (characters, largest) | Input reserved per call (tokens) | Reply cap incl. reasoning (tokens) | Price in / out (US$ per M) | Most per call | Most for all calls |', '|---|---|---|---|---|---|---|---|'];
  let sum = 0;
  const notes: string[] = [];
  for (const id of o.modelIds) {
    const m = o.models[id];
    if (!m) throw new Error(`Unknown model "${id}" (see ai-eval/models.json).`);
    if (m.provider === 'mock') continue;
    if (m.priceInPerMTok === null || m.priceOutPerMTok === null) throw new Error(`"${id}" needs its prices in ai-eval/models.json.`);
    const cfg: K.ProviderConfig = { provider: m.provider, label: m.label, model: m.model, temperature: 0.2, maxOutputTokens: m.maxOutputTokens ?? 600, timeoutMs: 0, priceInPerMTok: m.priceInPerMTok, priceOutPerMTok: m.priceOutPerMTok };
    let chars = 0, inTok = 0, per = 0, all = 0;
    for (const sc of scenarios) {
      const { ctx } = prepare(sc);
      chars = Math.max(chars, K.messagesFor(ctx).map(x => x.content).join('\n').length);
      inTok = Math.max(inTok, K.reserveInputTokens(ctx));
      const w = K.worstCaseCostUsd(cfg, ctx) as number;
      per = Math.max(per, w); all += w * o.repeats;
    }
    sum += all;
    if (m.priceTierMaxInputTokens && inTok > m.priceTierMaxInputTokens) notes.push(`${id}: the prompt may be past the first price tier (${m.priceTierMaxInputTokens} tokens) — check the prices.`);
    lines.push(`| ${m.label} (${m.model}) | ${scenarios.length * o.repeats} | ${chars} | ${inTok} | ${cfg.maxOutputTokens} | ${m.priceInPerMTok} / ${m.priceOutPerMTok}${m.priceTierMaxInputTokens ? ` (inputs up to ${m.priceTierMaxInputTokens / 1000}K tokens)` : ''} | $${per.toFixed(5)} | $${all.toFixed(4)} |`);
  }
  lines.push('', `Most for every call: US$${sum.toFixed(4)}; with a further ${Math.round((CONTINGENCY - 1) * 100)}% for anything missed: **US$${(sum * CONTINGENCY).toFixed(4)}**.`,
    'An estimate, not a guarantee: it assumes each provider stops at the reply cap (reasoning included) and charges its list prices. The run itself checks before every call and stops before one whose most-it-could-cost is more than what\'s left.');
  return [...lines, ...notes].join('\n');
}

// ---------- Reports ----------
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : '—');
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const quantile = (xs: number[], q: number) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const fmt = (n: number | null, d = 0) => (n === null ? '—' : n.toFixed(d));
const nums = (xs: (number | null)[]) => xs.filter((x): x is number => x !== null);
const met = (xs: Expectations[]) => { const v = xs.flatMap(x => Object.values(x)); return v.length ? `${v.filter(Boolean).length}/${v.length}` : '—'; };
const usd = (n: number) => `US$${n.toFixed(4)}`;
const skipped = (x: RunRecord) => x.outcome === 'skipped-budget' || x.outcome === 'skipped-failure' || x.outcome === 'skipped-connection';

export function summary(r: Result): string {
  const m = r.meta;
  const lines: string[] = [];
  lines.push(`# MyDay AI planner evaluation — ${m.mode === 'live' ? 'LIVE model calls' : 'MOCK (no AI)'}`, '');
  lines.push(`${m.date.slice(0, 16).replace('T', ' ')} UTC · instructions ${m.promptVersion} · ${m.scenarios} synthetic scenario${m.scenarios === 1 ? '' : 's'} × ${m.repeats} repeat${m.repeats === 1 ? '' : 's'} · no automatic retries`, '');
  if (m.mode === 'live') {
    // Results saved before usage and reservations were kept apart: this run's split is worked out from its calls,
    // and the earlier runs' split, which wasn't recorded, is left out rather than shown as zero.
    const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 1e6) / 1e6;
    const usageUsd = m.usageUsd ?? sum(r.runs.map(x => x.costUsd ?? 0));
    const reservedUsd = m.reservedUsd ?? sum(r.runs.filter(x => x.costUsd === null && x.reservedUsd !== null).map(x => x.reservedUsd as number));
    const reservedBefore = m.reservedBeforeUsd;
    lines.push(`Estimated cost from reported token usage (the providers' token counts × the list prices in models.json): this run ${usd(usageUsd)}.`
      + (reservedUsd ? ` Reserved for ${r.runs.filter(x => x.reservedUsd !== null && x.costUsd === null).length} call(s) that reported no usage, and kept until provider billing shows what they cost: ${usd(reservedUsd)}.` : '')
      + ` Counted against this run's ${usd(m.budgetUsd as number)} limit: ${usd(m.spentUsd)}`
      + (m.totalBudgetUsd !== null ? ` · against the ${usd(m.totalBudgetUsd)} ceiling, all live runs: ${usd(m.spentBeforeUsd + m.spentUsd)}${reservedBefore === undefined ? '' : ` (of which reserved for calls without usage: ${usd(reservedBefore + reservedUsd)})`}, ${usd(Math.max(0, m.totalBudgetUsd - m.spentBeforeUsd - m.spentUsd))} left` : '')
      + (m.stoppedForBudget ? ' · **stopped: the next call\'s reserved cost was more than was left**' : '')
      + (m.stoppedForConnection ? ' · **stopped: 3 calls in a row couldn\'t reach a provider — check the connection (or whether the computer slept) and run again**' : ''), '');
  }
  if (m.mode === 'mock') lines.push('> These results come from the mock planner (simple rules, not AI). They check the evaluation, the rules and the safe save path — they say nothing about any real model.', '');
  lines.push('## Summary', '');
  lines.push('| Model | Calls | Usable final proposal | Original reply broke a rule | Expectations met: original reply | …after the app\'s corrections | Saved safely | Explanation (words, mean) | Latency p50 / p95 (ms) | Tokens in / out (of which reasoning), mean | Cost (total, est.) |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const mm of m.models) {
    const rs = r.runs.filter(x => x.model === mm.id && !skipped(x));
    const okRuns = rs.filter(x => x.outcome === 'ok');
    const replied = rs.filter(x => x.outcome !== 'error');
    const lat = nums(rs.map(x => x.latencyMs));
    const cost = nums(rs.map(x => x.costUsd));
    const reason = nums(rs.map(x => x.reasoningTokens));
    lines.push(`| ${mm.label} (${mm.model}) | ${rs.length} | ${pct(okRuns.length, rs.length)} | ${pct(replied.filter(x => x.violations.length).length, replied.length)} | ${met(rs.map(x => x.expectRaw))} | ${met(rs.map(x => x.expectFinal))} | ${pct(okRuns.filter(x => x.savedSafely).length, okRuns.length)} | ${fmt(mean(okRuns.map(x => x.explanationWords)), 1)} | ${fmt(quantile(lat, 0.5))} / ${fmt(quantile(lat, 0.95))} | ${fmt(mean(nums(rs.map(x => x.inputTokens))))} / ${fmt(mean(nums(rs.map(x => x.outputTokens))))} (${reason.length ? fmt(mean(reason)) : '—'}) | ${cost.length ? '$' + cost.reduce((a, b) => a + b, 0).toFixed(4) : '—'} |`);
  }
  const notRun = r.runs.filter(skipped);
  if (notRun.length) lines.push('', `Not called: ${notRun.filter(x => x.outcome === 'skipped-budget').length} (budget), ${notRun.filter(x => x.outcome === 'skipped-failure').length} (stopped after a failure with that model), ${notRun.filter(x => x.outcome === 'skipped-connection').length} (stopped: no connection).`);
  const failures = r.runs.filter(x => x.outcome === 'error' || x.outcome === 'invalid');
  if (failures.length) {
    lines.push('', '## Unsuccessful generations', '', '| Model | Scenario | # | What happened | Provider\'s message |', '|---|---|---|---|---|');
    for (const x of failures) lines.push(`| ${x.model} | ${x.scenario} | ${x.rep} | ${x.outcome === 'invalid' ? `not a usable reply (${x.violations.join(', ')})` : x.error} | ${(x.errorDetail || '').replace(/\|/g, '/')} |`);
  }
  const codes = [...new Set(r.runs.flatMap(x => x.violations))].sort();
  lines.push('', '## Rules broken by the original replies (before the app corrected them)', '');
  if (!codes.length) lines.push('None.');
  else {
    lines.push(`| Model | ${codes.map(c => (c === 'pressure-language' ? 'pressure-language (tone flag)' : c)).join(' | ')} | unsuccessful |`, `|---|${codes.map(() => '---|').join('')}---|`);
    for (const mm of m.models) {
      const rs = r.runs.filter(x => x.model === mm.id);
      lines.push(`| ${mm.label} | ${codes.map(c => rs.reduce((a, x) => a + x.violations.filter(v => v === c).length, 0)).join(' | ')} | ${rs.filter(x => x.outcome === 'error' || x.outcome === 'invalid').length} |`);
    }
    if (codes.includes('pressure-language')) {
      const flagged = r.runs.filter(x => x.violations.includes('pressure-language'));
      const unverified = flagged.filter(x => !x.originalReply).length;
      lines.push('', `pressure-language is the tone filter flagging a word (e.g. "failure", "should") wherever it appears — it can't tell "rest isn't a failure" from pressure. `
        + (unverified ? `${unverified} of these ${flagged.length} flag(s) are unverified: the original wording wasn't kept (results from before 4 Oct 2026 didn't keep it).` : 'The original wording is in runs.json (originalReply) to check each one.'));
    }
  }
  lines.push('', '## By scenario (rule breaks · expectations met by the original reply · after corrections, over all repeats)', '');
  lines.push(`| Scenario | ${m.models.map(x => x.label).join(' | ')} |`, `|---|${m.models.map(() => '---|').join('')}`);
  for (const id of [...new Set(r.runs.map(x => x.scenario))]) {
    const cells = m.models.map(mm => {
      const rs = r.runs.filter(x => x.model === mm.id && x.scenario === id && !skipped(x));
      return rs.length ? `${rs.reduce((a, x) => a + x.violations.length, 0)} · ${met(rs.map(x => x.expectRaw))} · ${met(rs.map(x => x.expectFinal))}` : '—';
    });
    lines.push(`| ${id} | ${cells.join(' | ')} |`);
  }
  lines.push('', '## How to read this', '',
    '- **Usable final proposal**: the model finished normally (finish_reason "stop") with the JSON asked for, and the app could turn it into a suggestion. A reply cut off at the length limit, filtered, empty, or not complete JSON gives no suggestion, and the plan stays as it was.',
    '- **Original reply broke a rule**: the model\'s own reply broke at least one of MyDay\'s rules (too many tasks for the energy, a task that isn\'t on the plan, too long, a time on top of a shift or appointment…). The app corrects or drops these before you see anything — this measures how often it has to.',
    '- **Expectations met**: what a useful answer would do in that scenario (e.g. stay within 20 minutes, say that sleep isn\'t recorded, suggest rest when there\'s no time left), checked twice — on the model\'s original reply, and on the proposal after the app\'s corrections. The gap between them is the app\'s work, not the model\'s. A rough guide; read review.md to judge usefulness yourself.',
    '- **Saved safely**: using the suggestion changed only today\'s plan — never the task lists, other days or the energy rating.',
    '- **Tokens**: as the provider reported them. Reasoning ("thinking") tokens are part of the output tokens and are billed as output.',
    '- **Cost**: estimated from reported token usage (the provider\'s token counts × the prices in models.json); check your provider\'s bill. A call that reported no usage keeps its reservation (the most it could have cost) in the budget until provider billing shows what it cost.');
  return lines.join('\n') + '\n';
}

// Every call, one row each (for a small trial).
export function calls(r: Result): string {
  const lines = ['| Model | Scenario | # | Usable final proposal | Finish | Original rule breaks | App corrections | Latency (ms) | Tokens in / out (reasoning) | Cost (est.) |', '|---|---|---|---|---|---|---|---|---|---|'];
  for (const x of r.runs) {
    const usable = x.outcome === 'ok' ? 'yes' : skipped(x) ? `not called (${x.outcome === 'skipped-budget' ? 'budget' : x.outcome === 'skipped-connection' ? 'no connection' : 'after a failure'})` : `no — ${x.outcome === 'invalid' ? 'not usable JSON' : x.error}${x.errorDetail ? ` (${x.errorDetail.replace(/\|/g, '/')})` : ''}`;
    const breaks = x.violationDetails.map(d => (d.startsWith('pressure-language: ') ? `tone flag: "${d.slice(19)}" (${x.originalReply ? 'original kept in runs.json' : 'unverified: original wording not kept'})` : d));
    lines.push(`| ${x.model} | ${x.scenario} | ${x.rep} | ${usable} | ${x.finishReason ?? '—'} | ${breaks.length ? breaks.join('; ').replace(/\|/g, '/') : 'none'} | ${x.adjusted.length ? x.adjusted.join(' ').replace(/\|/g, '/') : '—'} | ${fmt(x.latencyMs)} | ${fmt(x.inputTokens)} / ${fmt(x.outputTokens)} (${fmt(x.reasoningTokens)}) | ${x.costUsd === null ? '—' : '$' + x.costUsd.toFixed(5)} |`);
  }
  return lines.join('\n') + '\n';
}

// The suggestions themselves, for judging usefulness by eye (first repeat of each).
export function review(r: Result): string {
  const lines = ['# Suggestions to judge by eye', '', 'For each scenario: what each model suggested (first repeat), after the app\'s checks. Rate each 1–5 for usefulness if you like.', ''];
  for (const sc of ALL_SCENARIOS.filter(s => r.runs.some(x => x.scenario === s.id))) {
    lines.push(`## ${sc.id}: ${sc.title}`, '', isTasksScenario(sc) ? `Written: “${sc.text}” · ${sc.tags.join(', ')}` : isConnectScenario(sc) ? `Right answers: ${Object.entries(sc.expect.links).map(([id, p]) => `${id} → ${Array.isArray(p) ? p.map(x => x ?? 'none').join(' or ') : p ?? 'none'}`).join('; ')} · ${sc.tags.join(', ')}` : `Note: ${sc.note ? `“${sc.note}”` : '(none)'} · ${sc.tags.join(', ')}`, '');
    for (const mm of r.meta.models) {
      const x = r.runs.find(y => y.model === mm.id && y.scenario === sc.id && y.rep === 1);
      if (!x) continue;
      if (!x.shown) { lines.push(`- **${mm.label}**: ${x.outcome}${x.error ? ` (${x.error})` : ''}`); continue; }
      const what = x.shown.rest ? 'Rest' : x.shown.priorities.length ? x.shown.priorities.join('; ') : 'Nothing more today';
      lines.push(`- **${mm.label}**: ${what}. “${x.shown.explanation}”${x.shown.missing.length ? ` Missing: ${x.shown.missing.join('; ').replace(/\.$/, '')}.` : ''}${x.violations.length ? ` _(corrected: ${x.violations.map(v => (v === 'pressure-language' ? `tone flag${x.originalReply ? '' : ', unverified'}` : v)).join(', ')})_` : ''} — rating: __`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
