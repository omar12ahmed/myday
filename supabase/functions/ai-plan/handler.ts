// The ai-plan Edge Function's logic: one bounded model request for "Help me adjust today".
//
//   1. Only signed-in MyDay accounts (the user's own sign-in token is checked).
//   2. The request is small and of the right shape: "Help me adjust today" (PlanContext, ../_shared/ai/schema.ts) or
//      "Add what's on my mind" (TasksContext, ../_shared/ai/tasks.ts). Both share the same limits.
//   3. Request, spending and pace limits are checked (and the worst-case cost reserved) before the model is called.
//   4. One model call, with a time limit and a cap on the reply's length — to the model set up for that job (the main
//      one, or the learning one: see routeFor in providers.ts). Only if it can't answer at all does the other model
//      get one try, inside the same time limit and the same reservation. The model can't write anything anywhere:
//      the reply goes back to the app, which checks every rule and only saves after you confirm.
//   5. Nothing about the request's content is logged (no tasks, notes or sleep): only an outcome and timings.
//
// Everything specific to Deno or Supabase is passed in (Deps), so the same code runs in tests. index.ts wires it up.
import { callModel, costUsd, fallsBack, routeFor, worstCaseCostUsd, type ProviderConfig } from '../_shared/ai/providers.ts';
import { CONTRACT_VERSION, LIMITS, type PlanContext } from '../_shared/ai/schema.ts';
import { checkTasksContext } from '../_shared/ai/tasks.ts';
import { checkTutorContext } from '../_shared/ai/tutor.ts';
import { checkConnectContext } from '../_shared/ai/connect.ts';

export interface Deps {
  env: (name: string) => string | undefined;
  verifyUser: (token: string) => Promise<string | null>; // the account's id, or null if the token isn't valid
  begin: (token: string, limits: { perDay: number; monthlyUsd: number; reserveUsd: number; minSeconds: number }) => Promise<{ ok: boolean; reason?: string }>;
  finish: (token: string, inputTokens: number, outputTokens: number) => Promise<void>;
  fetchImpl?: typeof fetch;
  log?: (line: string) => void;
}

const DEFAULT_ORIGINS = 'https://omar12ahmed.github.io,http://localhost:5173,http://127.0.0.1:5500';

function cors(req: Request, env: Deps['env']): Record<string, string> {
  const origin = req.headers.get('Origin');
  const allowed = (env('AI_ALLOWED_ORIGINS') || DEFAULT_ORIGINS).split(',').map(s => s.trim()).filter(Boolean);
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
  if (origin && allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

const isClock = (v: unknown) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const isLocal = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(v);

// The shape check: enough to keep requests small and well-formed. (The app builds the context; the rules about
// what a good plan is are checked by the app on the reply.)
export function checkContext(c: unknown): c is PlanContext {
  if (!c || typeof c !== 'object') return false;
  const x = c as Record<string, unknown>;
  if ('action' in x) return false; // Named actions have their own strict validators; never dispatch them as plans.
  if (x.version !== CONTRACT_VERSION || typeof x.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(x.date) || !isClock(x.now)) return false;
  if (typeof x.timezone !== 'string' || x.timezone.length > 64 || typeof x.weekday !== 'string' || x.weekday.length > 12) return false;
  if (!(x.energy === null || (Number.isInteger(x.energy) && (x.energy as number) >= 1 && (x.energy as number) <= 5))) return false;
  if (![0, 1, 2, 3].includes(x.maxPriorities as number) || typeof x.smallOnly !== 'boolean' || typeof x.restDay !== 'boolean') return false;
  if (!Array.isArray(x.tasks) || x.tasks.length > LIMITS.tasks) return false;
  for (const t of x.tasks as Record<string, unknown>[]) {
    if (!t || typeof t.id !== 'string' || t.id.length > 64 || typeof t.title !== 'string' || t.title.length > LIMITS.titleChars) return false;
    if (!['learning', 'admin', 'health'].includes(t.category as string) || typeof t.done !== 'boolean') return false;
    if (!Number.isFinite(t.minutes) || !Number.isFinite(t.plannedMinutes) || !(t.start === null || isClock(t.start))) return false;
  }
  if (!Array.isArray(x.busy) || x.busy.length > LIMITS.busy) return false;
  for (const b of x.busy as Record<string, unknown>[]) if (!b || !['work', 'appointment', 'workout', 'sleep', 'prep'].includes(b.kind as string) || !isLocal(b.start) || !isLocal(b.end)) return false;
  if (!Array.isArray(x.free) || x.free.length > LIMITS.free) return false;
  for (const f of x.free as Record<string, unknown>[]) if (!f || !isClock(f.start) || !isClock(f.end)) return false;
  if (!(x.note === null || (typeof x.note === 'string' && x.note.length <= LIMITS.noteChars))) return false;
  return true;
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  const t0 = Date.now();
  const log = deps.log || (() => {});
  const h = { ...cors(req, deps.env), 'Content-Type': 'application/json' };
  const reply = (status: number, body: Record<string, unknown>, outcome: string) => {
    log(`ai-plan ${outcome} ${status} ${Date.now() - t0}ms`); // an outcome and a time only, never content
    return new Response(JSON.stringify(body), { status, headers: h });
  };
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
  if (req.method !== 'POST') return reply(405, { ok: false, error: 'method' }, 'method');

  // 1. Who's asking.
  // A user's sign-in token is a JWT (three dot-separated parts). The publishable or secret keys are not: Supabase's
  // platform check lets them through in the Authorization header, so they're refused here, before anything else.
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const looksLikeJwt = /^[\w-]+\.[\w-]+\.[\w-]+$/.test(token) && !/^sb_/.test(token);
  const user = looksLikeJwt ? await deps.verifyUser(token).catch(() => null) : null;
  if (!user) return reply(401, { ok: false, error: 'auth' }, 'auth');

  // 2. A small, well-formed request.
  const raw = await req.text();
  if (raw.length > LIMITS.bodyBytes) return reply(413, { ok: false, error: 'bad-request' }, 'too-large');
  let body: { context?: unknown };
  try { body = JSON.parse(raw); } catch { return reply(400, { ok: false, error: 'bad-request' }, 'not-json'); }
  if (!body || !(checkContext(body.context) || checkTasksContext(body.context) || checkTutorContext(body.context) || checkConnectContext(body.context))) return reply(400, { ok: false, error: 'bad-request' }, 'bad-context');
  const ctx = body.context;

  // 3. The model for this job (and the other one, in case it can't answer), and the limits. Both models' worst cases
  //    are reserved up front, since both could be billed for this one request.
  const route = routeFor(deps.env, ctx);
  if ('error' in route) return reply(503, { ok: false, error: 'not-configured' }, 'not-configured');
  const worst = worstCaseCostUsd(route.primary.cfg, ctx), worstFallback = route.fallback ? worstCaseCostUsd(route.fallback.cfg, ctx) : 0;
  if (worst === null || worstFallback === null) return reply(503, { ok: false, error: 'not-configured' }, 'no-prices');
  const reserve = worst + worstFallback;
  const num = (name: string, fallback: number) => { const n = Number(deps.env(name)); return Number.isFinite(n) && deps.env(name) !== undefined && deps.env(name) !== '' ? n : fallback; };
  let gate: { ok: boolean; reason?: string };
  try {
    gate = await deps.begin(token, { perDay: num('AI_DAILY_LIMIT', 20), monthlyUsd: num('AI_MONTHLY_BUDGET_USD', 1), reserveUsd: Math.min(reserve, 1), minSeconds: num('AI_MIN_SECONDS_BETWEEN', 5) });
  } catch {
    return reply(503, { ok: false, error: 'unavailable' }, 'limits-unavailable');
  }
  if (!gate.ok) return reply(429, { ok: false, error: 'limit', reason: gate.reason || 'limit' }, `limit-${gate.reason}`);

  // 4. The model call — and, only if that model can't answer, the other one, in what's left of the time the app
  //    waits (40 s; this stays under it, AI_TOTAL_TIMEOUT_MS, 38 s by default).
  const deadline = t0 + Math.min(num('AI_TOTAL_TIMEOUT_MS', 38000), 39000);
  const within = (cfg: ProviderConfig): ProviderConfig => ({ ...cfg, timeoutMs: Math.max(1000, Math.min(cfg.timeoutMs, deadline - Date.now())) });
  let used = route.primary, result = await callModel(within(used.cfg), ctx, deps.fetchImpl);
  let inputTokens = result.inputTokens ?? 0, outputTokens = result.outputTokens ?? 0, fellBack = false;
  const firstError = result.ok ? null : result.error;
  if (fallsBack(result) && route.fallback && deadline - Date.now() >= 5000) {
    fellBack = true;
    const second = await callModel(within(route.fallback.cfg), ctx, deps.fetchImpl);
    inputTokens += second.inputTokens ?? 0; outputTokens += second.outputTokens ?? 0;
    if (second.ok) used = route.fallback;
    result = second;
  }
  // Billed tokens are recorded whether or not the generation was usable.
  await deps.finish(token, inputTokens, outputTokens).catch(() => {});
  // Logged with the outcome (no content): the job and the model slot, e.g. "tutor/main,after-learn-timeout".
  const last = fellBack && route.fallback ? route.fallback.slot : route.primary.slot; // the model tried last
  const via = `${route.job}/${last}${fellBack ? `,after-${route.primary.slot}-${firstError}` : ''}`;
  if (!result.ok) return reply(502, { ok: false, error: 'unavailable', detail: result.error }, `model-${result.error}:${via}`);
  return reply(200, {
    ok: true,
    output: result.text.slice(0, 8000),
    model: used.cfg.label,
    ...(fellBack ? { fallback: true } : {}),
    usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens, costUsd: costUsd(used.cfg, result.inputTokens, result.outputTokens), latencyMs: result.latencyMs },
  }, fellBack ? `ok:${via}` : 'ok');
}
