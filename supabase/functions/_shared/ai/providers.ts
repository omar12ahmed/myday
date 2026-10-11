// The model adapter: one function, callModel(), whatever the provider. Everything specific to a model (its
// address, name, key, prices, extra request fields such as switching "thinking" off) lives in a ProviderConfig,
// never in the app or the planning rules. Two kinds today:
//   openai-compatible  any provider with an OpenAI-style /chat/completions API (e.g. Alibaba Cloud Model Studio
//                      for Qwen, Z.ai for GLM, Google's Gemini API). Their differences (address, thinking switches,
//                      the reply-length field, JSON mode) are settings, see ai-eval/models.json.
//   mock               the rule-based stand-in in mock.ts (no key, no network)
// Which model does which job (routeFor, at the end) is configuration too.
import { mockPlanner, type MockVariant } from './mock.ts';
import { isConnect, isTasks, isTutor, messagesFor, type AiContext } from './prompt.ts';
import { mockConnect, type ConnectMockVariant } from './connect.ts';
import { mockTutor } from './tutor.ts';
import { mockTasks, type TasksMockVariant } from './tasks.ts';

export interface ProviderConfig {
  provider: 'openai-compatible' | 'mock';
  label: string;                 // shown in results, e.g. "Qwen3.7 Plus"
  model: string;                 // the provider's model id, or for mock: "mock:good", "mock:sloppy", "mock:invalid", "mock:rest", "mock:error", "mock:slow", "mock:truncated", "mock:partial"
  baseUrl?: string;              // e.g. https://dashscope-intl.aliyuncs.com/compatible-mode/v1
  apiKey?: string;               // server-side only (Edge Function secret, or an environment variable for the evaluation)
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
  extraBody?: Record<string, unknown>; // model-specific request fields (e.g. switching thinking off, or its effort)
  maxTokensField?: 'max_tokens' | 'max_completion_tokens'; // the reply-length field this provider expects (default max_tokens)
  jsonMode?: boolean;            // ask for JSON output (response_format json_object); default true
  priceInPerMTok: number | null;  // US$ per million input tokens (null = not known)
  priceOutPerMTok: number | null; // US$ per million output tokens
  mockDelayMs?: number;
}

// A successful generation: the model finished normally ("stop") with some final text. Anything else — cut off at
// the length limit, filtered, a provider-side failure, or nothing in the final content (e.g. only reasoning) — is
// unsuccessful, and the plan stays as it was. Token counts are kept either way, because they are billed.
export type ModelResult =
  | { ok: true; text: string; inputTokens: number | null; outputTokens: number | null; reasoningTokens: number | null; finishReason: string | null; latencyMs: number }
  | { ok: false; error: 'timeout' | 'network' | 'http' | 'empty' | 'truncated' | 'filtered' | 'incomplete' | 'config'; status?: number; detail?: string;
      inputTokens?: number | null; outputTokens?: number | null; reasoningTokens?: number | null; finishReason?: string | null; latencyMs: number };

// A rough token count (about 3.5 characters a token for this kind of text), for the mock's figures.
export const estimateTokens = (s: string) => Math.ceil(s.length / 3.5);
// For budgets, deliberately on the high side: 3 characters a token, plus a quarter.
export const RESERVE_CHARS_PER_TOKEN = 3;
export const RESERVE_MARGIN = 1.25;
export const reserveInputTokens = (ctx: AiContext) => Math.ceil((messagesFor(ctx).map(m => m.content).join('\n').length / RESERVE_CHARS_PER_TOKEN) * RESERVE_MARGIN);

// The most one request could cost: the whole input (counted generously), plus the longest reply allowed — which
// includes any reasoning, since providers count reasoning as output. null = prices not known.
export function worstCaseCostUsd(cfg: ProviderConfig, ctx: AiContext): number | null {
  if (cfg.provider === 'mock') return 0;
  if (cfg.priceInPerMTok === null || cfg.priceOutPerMTok === null) return null;
  return (reserveInputTokens(ctx) * cfg.priceInPerMTok + cfg.maxOutputTokens * cfg.priceOutPerMTok) / 1e6;
}

// A provider's error message, shortened, with the key (or anything key-like) blanked out.
function errorDetail(body: string, apiKey: string | undefined): string {
  let d = body;
  try {
    const j = JSON.parse(body);
    const e = j && (j.error || j);
    d = [e.code, e.type, e.message || e.msg].filter(Boolean).join(': ') || body;
  } catch { /* not JSON: keep the text */ }
  if (apiKey) d = d.split(apiKey).join('***');
  return d.replace(/\b(sk-|sb_secret_)[A-Za-z0-9_-]{6,}/g, '***').slice(0, 240);
}
export function costUsd(cfg: ProviderConfig, inputTokens: number | null, outputTokens: number | null): number | null {
  if (cfg.provider === 'mock') return 0;
  if (cfg.priceInPerMTok === null || cfg.priceOutPerMTok === null || inputTokens === null || outputTokens === null) return null;
  return (inputTokens * cfg.priceInPerMTok + outputTokens * cfg.priceOutPerMTok) / 1e6;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function callModel(cfg: ProviderConfig, ctx: AiContext, fetchImpl: typeof fetch = fetch): Promise<ModelResult> {
  const t0 = Date.now();
  if (cfg.provider === 'mock') {
    const variant = cfg.model.replace(/^mock:/, '');
    if (variant === 'error') return { ok: false, error: 'http', status: 503, latencyMs: Date.now() - t0 };
    if (variant === 'truncated') return { ok: false, error: 'truncated', finishReason: 'length', inputTokens: 900, outputTokens: cfg.maxOutputTokens, latencyMs: Date.now() - t0 };
    await sleep(variant === 'slow' ? cfg.timeoutMs + 50 : cfg.mockDelayMs ?? 0);
    if (variant === 'slow') return { ok: false, error: 'timeout', latencyMs: Date.now() - t0 };
    const full = isConnect(ctx) ? mockConnect(ctx, (['good', 'sloppy', 'invalid'].includes(variant) ? variant : 'good') as ConnectMockVariant) : isTutor(ctx) ? mockTutor(ctx, variant === 'sloppy' ? 'sloppy' : 'good') : isTasks(ctx)
      ? mockTasks(ctx, (['good', 'sloppy', 'invalid'].includes(variant) ? variant : 'good') as TasksMockVariant)
      : mockPlanner(ctx, (['good', 'sloppy', 'invalid', 'rest'].includes(variant) ? variant : 'good') as MockVariant);
    const text = variant === 'partial' ? full.slice(0, Math.floor(full.length / 2)) : full; // JSON that stops half-way
    return { ok: true, text, inputTokens: estimateTokens(messagesFor(ctx).map(m => m.content).join('\n')), outputTokens: estimateTokens(text), reasoningTokens: null, finishReason: 'stop', latencyMs: Date.now() - t0 };
  }
  if (!cfg.baseUrl || !cfg.apiKey || !cfg.model) return { ok: false, error: 'config', latencyMs: 0 };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
  try {
    const res = await fetchImpl(cfg.baseUrl.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: cfg.model,
        messages: messagesFor(ctx),
        temperature: cfg.temperature,
        [cfg.maxTokensField || 'max_tokens']: cfg.maxOutputTokens,
        ...(cfg.jsonMode === false ? {} : { response_format: { type: 'json_object' } }),
        ...(cfg.extraBody || {}),
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: 'http', status: res.status, detail: errorDetail(body, cfg.apiKey), latencyMs: Date.now() - t0 };
    }
    const json = await res.json();
    const choice = json && Array.isArray(json.choices) ? json.choices[0] : null;
    const text = choice && choice.message ? choice.message.content : null;
    const usage = (json && json.usage) || {};
    // Output (billed) = completion tokens, which include any reasoning; if the total says more, the total is trusted.
    const input = Number.isFinite(usage.prompt_tokens) ? usage.prompt_tokens : null;
    const output = Number.isFinite(usage.completion_tokens) ? usage.completion_tokens : null;
    const fromTotal = input !== null && Number.isFinite(usage.total_tokens) ? usage.total_tokens - input : null;
    const counts = {
      inputTokens: input,
      outputTokens: output !== null && fromTotal !== null ? Math.max(output, fromTotal) : output,
      reasoningTokens: Number.isFinite(usage.completion_tokens_details && usage.completion_tokens_details.reasoning_tokens) ? usage.completion_tokens_details.reasoning_tokens : null,
      finishReason: choice && typeof choice.finish_reason === 'string' ? choice.finish_reason : null,
    };
    const latencyMs = Date.now() - t0;
    const fr = counts.finishReason;
    if (fr === 'length' || fr === 'model_context_window_exceeded') return { ok: false, error: 'truncated', ...counts, latencyMs };
    if (fr === 'sensitive' || fr === 'content_filter') return { ok: false, error: 'filtered', ...counts, latencyMs };
    if (fr === 'network_error') return { ok: false, error: 'network', ...counts, latencyMs };
    if (fr && fr !== 'stop') return { ok: false, error: 'incomplete', ...counts, latencyMs };
    if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'empty', ...counts, latencyMs };
    return { ok: true, text, ...counts, latencyMs };
  } catch (e) {
    const err = e as { name?: string; cause?: { code?: string; message?: string } };
    const aborted = err.name === 'AbortError';
    // Why the connection failed, e.g. ENOTFOUND (no address lookup) or UND_ERR_CONNECT_TIMEOUT, to tell a network
    // problem on this side from the provider's.
    const cause = err.cause && (err.cause.code || err.cause.message);
    return { ok: false, error: aborted ? 'timeout' : 'network', ...(cause ? { detail: errorDetail(String(cause), cfg.apiKey) } : {}), latencyMs: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}

// The most any reply may use, whatever the settings say (2048: GLM-5.3-Flash's evaluated cap, reasoning included).
export const MAX_OUTPUT_TOKENS_CAP = 2048;

// A model from the Edge Function's secrets (environment variables): the main one from the AI_… settings, the learning
// one from the same settings starting AI_LEARN_… (see routeFor). Returns why not, if it isn't usable.
export function configFromEnv(env: (name: string) => string | undefined, prefix = 'AI_'): ProviderConfig | { error: string } {
  const get = (name: string) => env(prefix + name);
  const num = (name: string, fallback: number | null) => { const v = get(name); if (v === undefined || v === '') return fallback; const n = Number(v); return Number.isFinite(n) ? n : fallback; };
  const provider = (get('PROVIDER') || '').trim();
  if (provider !== 'openai-compatible' && provider !== 'mock') return { error: `${prefix}PROVIDER must be "openai-compatible" or "mock".` };
  let extraBody: Record<string, unknown> | undefined;
  const extra = get('EXTRA_BODY');
  if (extra) { try { extraBody = JSON.parse(extra); } catch { return { error: `${prefix}EXTRA_BODY is not valid JSON.` }; } }
  const cfg: ProviderConfig = {
    provider,
    label: get('LABEL') || get('MODEL') || provider,
    model: get('MODEL') || (provider === 'mock' ? 'mock:good' : ''),
    baseUrl: get('BASE_URL'),
    apiKey: get('API_KEY'),
    temperature: num('TEMPERATURE', 0.2) as number,
    maxOutputTokens: Math.min(num('MAX_OUTPUT_TOKENS', 600) as number, MAX_OUTPUT_TOKENS_CAP),
    timeoutMs: Math.min(num('TIMEOUT_MS', 25000) as number, 60000),
    extraBody,
    maxTokensField: get('MAX_TOKENS_FIELD') === 'max_completion_tokens' ? 'max_completion_tokens' : 'max_tokens',
    jsonMode: get('JSON_MODE') !== 'false',
    priceInPerMTok: num('PRICE_IN_PER_MTOK', null),
    priceOutPerMTok: num('PRICE_OUT_PER_MTOK', null),
    mockDelayMs: num('MOCK_DELAY_MS', 300) as number,
  };
  if (provider === 'openai-compatible') {
    if (!cfg.baseUrl || !cfg.model || !cfg.apiKey) return { error: `${prefix}BASE_URL, ${prefix}MODEL and ${prefix}API_KEY are needed.` };
    if (cfg.priceInPerMTok === null || cfg.priceOutPerMTok === null) return { error: `${prefix}PRICE_IN_PER_MTOK and ${prefix}PRICE_OUT_PER_MTOK are needed, so spending can be limited.` };
  }
  return cfg;
}

// ---------- Which model does which job ----------
// Two models can be set up: the main one (AI_… settings) and, optionally, a learning specialist (AI_LEARN_…
// settings). AI_ROUTES names the jobs that go to the learning one, e.g. {"tutor": "learn"}; any job not named goes to
// the main one, and so does a job routed to a learning model that isn't set up. If the chosen model can't answer
// (no connection, no answer in time, a provider error, nothing in its reply), the other gets one try, unless
// AI_FALLBACK=off. A reply the app then finds unusable isn't retried: the app says so instead.
export type Job = 'adjust' | 'tasks' | 'connect' | 'tutor';
export type Slot = 'main' | 'learn';
export const JOBS: Job[] = ['adjust', 'tasks', 'connect', 'tutor'];
export const jobOf = (ctx: AiContext): Job => (isConnect(ctx) ? 'connect' : isTutor(ctx) ? 'tutor' : isTasks(ctx) ? 'tasks' : 'adjust');
// The model failures worth trying the other model for: it couldn't be reached or gave nothing. (A reply cut short,
// filtered or unfinished cost tokens and says something about the request, so it isn't passed on.)
export const fallsBack = (r: ModelResult) => !r.ok && ['timeout', 'network', 'http', 'config', 'empty'].includes(r.error);

export interface Route { job: Job; primary: { slot: Slot; cfg: ProviderConfig }; fallback: { slot: Slot; cfg: ProviderConfig } | null }
export function routeFor(env: (name: string) => string | undefined, ctx: AiContext): Route | { error: string } {
  let routes: Record<string, unknown> = {};
  const raw = env('AI_ROUTES');
  if (raw) {
    try { routes = JSON.parse(raw); } catch { return { error: 'AI_ROUTES is not valid JSON.' }; }
    if (!routes || typeof routes !== 'object' || Array.isArray(routes)) return { error: 'AI_ROUTES must be like {"tutor": "learn"}.' };
    for (const [job, slot] of Object.entries(routes)) {
      if (!JOBS.includes(job as Job)) return { error: `AI_ROUTES names an unknown job "${job}" (known: ${JOBS.join(', ')}).` };
      if (slot !== 'main' && slot !== 'learn') return { error: `AI_ROUTES: "${job}" must go to "main" or "learn".` };
    }
  }
  const main = configFromEnv(env, 'AI_');
  if ('error' in main) return main;
  let learn: ProviderConfig | null = null;
  if ((env('AI_LEARN_PROVIDER') || '').trim()) {
    const l = configFromEnv(env, 'AI_LEARN_');
    if ('error' in l) return l; // set up, but wrongly: say so rather than quietly using the main model
    learn = l;
  }
  const job = jobOf(ctx);
  const slot: Slot = routes[job] === 'learn' && learn ? 'learn' : 'main';
  const primary = { slot, cfg: slot === 'learn' ? learn! : main };
  const other = slot === 'learn' ? { slot: 'main' as Slot, cfg: main } : learn ? { slot: 'learn' as Slot, cfg: learn } : null;
  return { job, primary, fallback: env('AI_FALLBACK') === 'off' ? null : other };
}
