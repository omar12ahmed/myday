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
import { CARDS_LIMITS, checkCardsContext, readDraft, readVerdicts, type CardsCheckContext, type CardsContext } from '../_shared/ai/cards.ts';
import { checkNoteCardsContext, checkNoteCheckContext, readNoteDraft, type NoteCardsCheckContext, type NoteCardsContext } from '../_shared/ai/note-cards.ts';
import { checkExplainContext } from '../_shared/ai/explain.ts';
import { checkAnswerContext } from '../_shared/ai/check-answer.ts';
import { checkAskContext } from '../_shared/ai/ask.ts';
import { isCards, isNoteCards, type AiContext } from '../_shared/ai/prompt.ts';

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
  if (!body || !(checkContext(body.context) || checkTasksContext(body.context) || checkTutorContext(body.context) || checkConnectContext(body.context) || checkCardsContext(body.context) || checkNoteCheckContext(body.context) || checkNoteCardsContext(body.context) || checkExplainContext(body.context) || checkAnswerContext(body.context) || checkAskContext(body.context))) return reply(400, { ok: false, error: 'bad-request' }, 'bad-context');
  const ctx = body.context;

  // 3. The model for this job (and the other one, in case it can't answer), and the limits. Both models' worst cases
  //    are reserved up front, since both could be billed for this one request.
  const route = routeFor(deps.env, ctx);
  if ('error' in route) return reply(503, { ok: false, error: 'not-configured' }, 'not-configured');
  if (isCards(ctx as AiContext)) return cards(ctx as CardsContext, route, token, deps, reply, t0);
  if (isNoteCards(ctx as AiContext)) return noteCards(ctx as NoteCardsContext, route, token, deps, reply, t0);
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

// ---------- AI-written revision cards: a writer, then a checker (the other model) ----------
// One request, two model calls, both reserved up front. The writer drafts the cards; the checker judges each one. If
// there's no second model, or it can't answer, nothing is returned: a card no second model has checked never reaches
// the learner. The app then keeps only the cards the checker kept, and checks every card again itself. Used for a
// lesson's cards ("cards") and for cards from a note ("note-cards"); only what's read and sent differs.
const CARD_WRITER_TOKENS = 6000, CARD_CHECKER_TOKENS = 3000; // ten cards don't fit the other jobs' reply cap
type Route = Exclude<ReturnType<typeof routeFor>, { error: string }>;
type Reply = (status: number, body: Record<string, unknown>, outcome: string) => Response;
const LONGEST_CARD = { kind: 'choice' as const, prompt: 'x'.repeat(CARDS_LIMITS.promptChars), answer: 'x'.repeat(CARDS_LIMITS.answerChars), explanation: 'x'.repeat(CARDS_LIMITS.explanationChars),
  choices: Array.from({ length: CARDS_LIMITS.maxChoices }, () => 'x'.repeat(CARDS_LIMITS.choiceChars)), correct: 0 };
interface WriteAndCheck<C> {
  job: 'cards' | 'note-cards';
  ctx: AiContext;
  longestCheck: AiContext;                                   // the checker's worst case: ten cards of the longest allowed size
  read: (text: string) => { cards: C[]; leftOut: number } | null;
  checkCtx: (cards: C[]) => AiContext;
  output: (cards: C[], verdicts: ReturnType<typeof readVerdicts>, leftOut: number) => Record<string, unknown>;
}
async function writeAndCheck<C>(w: WriteAndCheck<C>, route: Route, token: string, deps: Deps, reply: Reply, t0: number): Promise<Response> {
  const num = (name: string, fallback: number) => { const n = Number(deps.env(name)); return Number.isFinite(n) && deps.env(name) !== undefined && deps.env(name) !== '' ? n : fallback; };
  if (!route.other) return reply(503, { ok: false, error: 'no-checker' }, `${w.job}-no-checker`);
  // The checker may think harder than the model does for other jobs (its CHECKER_EXTRA_BODY setting, if any).
  const { checkerExtraBody, ...otherCfg } = route.other.cfg;
  const writer = { ...route.primary.cfg, maxOutputTokens: CARD_WRITER_TOKENS }, checker = { ...otherCfg, maxOutputTokens: CARD_CHECKER_TOKENS, ...(checkerExtraBody ? { extraBody: checkerExtraBody } : {}) };
  const ww = worstCaseCostUsd(writer, w.ctx), wc = worstCaseCostUsd(checker, w.longestCheck);
  if (ww === null || wc === null) return reply(503, { ok: false, error: 'not-configured' }, 'no-prices');
  let gate: { ok: boolean; reason?: string };
  try {
    gate = await deps.begin(token, { perDay: num('AI_DAILY_LIMIT', 20), monthlyUsd: num('AI_MONTHLY_BUDGET_USD', 1), reserveUsd: Math.min(ww + wc, 1), minSeconds: num('AI_MIN_SECONDS_BETWEEN', 5) });
  } catch {
    return reply(503, { ok: false, error: 'unavailable' }, 'limits-unavailable');
  }
  if (!gate.ok) return reply(429, { ok: false, error: 'limit', reason: gate.reason || 'limit' }, `limit-${gate.reason}`);
  // Writing ten cards takes longer than other jobs: the app waits up to 95 s for this one.
  const deadline = t0 + Math.min(num('AI_CARDS_TOTAL_TIMEOUT_MS', 90000), 140000);
  const within = (cfg: ProviderConfig, longestMs: number): ProviderConfig => ({ ...cfg, timeoutMs: Math.max(1000, Math.min(longestMs, deadline - Date.now())) });
  let inputTokens = 0, outputTokens = 0;
  const done = async () => { await deps.finish(token, inputTokens, outputTokens).catch(() => {}); };
  const wr = await callModel(within(writer, num('AI_CARDS_WRITER_TIMEOUT_MS', 60000)), w.ctx, deps.fetchImpl);
  inputTokens += wr.inputTokens ?? 0; outputTokens += wr.outputTokens ?? 0;
  const draft = wr.ok ? w.read(wr.text) : null;
  if (!wr.ok || !draft || !draft.cards.length) { await done(); return reply(502, { ok: false, error: 'unavailable', detail: wr.ok ? 'unusable' : wr.error }, `${w.job}-writer-${wr.ok ? 'unusable' : wr.error}:${route.primary.slot}`); }
  if (deadline - Date.now() < 5000) { await done(); return reply(502, { ok: false, error: 'unavailable', detail: 'unchecked' }, `${w.job}-unchecked-time:${route.other.slot}`); }
  const c = await callModel(within(checker, deadline - Date.now()), w.checkCtx(draft.cards), deps.fetchImpl);
  inputTokens += c.inputTokens ?? 0; outputTokens += c.outputTokens ?? 0;
  const verdicts = c.ok ? readVerdicts(c.text, draft.cards.length) : null;
  await done();
  if (!c.ok || !verdicts) return reply(502, { ok: false, error: 'unavailable', detail: 'unchecked' }, `${w.job}-unchecked-${c.ok ? 'unusable' : c.error}:${route.other.slot}`);
  return reply(200, {
    ok: true,
    output: JSON.stringify(w.output(draft.cards, verdicts, draft.leftOut)),
    model: writer.label, checker: checker.label,
    usage: { inputTokens, outputTokens, costUsd: (costUsd(writer, wr.inputTokens, wr.outputTokens) ?? 0) + (costUsd(checker, c.inputTokens, c.outputTokens) ?? 0), latencyMs: Date.now() - t0 },
  }, `ok:${w.job}/${route.primary.slot}+${route.other.slot}`);
}
// A lesson's cards: the server supplies the lesson's outline; the checker gets it with the cards.
const cards = (ctx: CardsContext, route: Route, token: string, deps: Deps, reply: Reply, t0: number) => writeAndCheck({
  job: 'cards', ctx,
  longestCheck: { version: 1, action: 'cards-check', lessonId: ctx.lessonId, cards: Array.from({ length: CARDS_LIMITS.cards }, () => LONGEST_CARD) },
  read: text => readDraft(text, ctx.lessonId, ctx.count),
  checkCtx: (c): CardsCheckContext => ({ version: 1, action: 'cards-check', lessonId: ctx.lessonId, cards: c }),
  output: (c, verdicts, leftOut) => ({ lessonId: ctx.lessonId, cards: c, verdicts, leftOut }),
}, route, token, deps, reply, t0);
// Cards from a note: only the lines the person kept are sent; the checker gets the same lines with the cards.
const noteCards = (ctx: NoteCardsContext, route: Route, token: string, deps: Deps, reply: Reply, t0: number) => writeAndCheck({
  job: 'note-cards', ctx,
  longestCheck: { version: 1, action: 'note-cards-check', note: ctx.note, cards: Array.from({ length: CARDS_LIMITS.cards }, () => ({ ...LONGEST_CARD, from: [1, 2, 3] })) },
  read: text => readNoteDraft(text, ctx.count, ctx.note.lines.length),
  checkCtx: (c): NoteCardsCheckContext => ({ version: 1, action: 'note-cards-check', note: ctx.note, cards: c }),
  output: (c, verdicts, leftOut) => ({ cards: c, verdicts, leftOut }),
}, route, token, deps, reply, t0);

