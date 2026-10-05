// Asking for a suggestion. The app never talks to a model directly and never holds an AI key:
//   edge  the "ai-plan" Supabase Edge Function (signed-in accounts only; it holds the key and the limits)
//   mock  the practice planner (rules, not AI), for working on MyDay without any credentials
//   off   no AI help (the button isn't shown) — the default, unless the app is built with VITE_AI
// Whatever happens here, nothing is saved: the reply is only checked and shown (see validate.ts and apply.ts).
import type { AiContext } from '../../../supabase/functions/_shared/ai/prompt.ts';
import { currentSession } from '../sync/client';
import { SYNC } from '../sync/config';

export type AiMode = 'off' | 'mock' | 'edge';
const wanted = String(import.meta.env.VITE_AI || '').trim();
export const AI_MODE: AiMode = wanted === 'mock' ? 'mock' : wanted === 'edge' && SYNC.configured ? 'edge' : 'off';
const MOCK_VARIANT = String(import.meta.env.VITE_AI_MOCK || 'good');

export type AiReply =
  | { ok: true; text: string; model: string }
  | { ok: false; reason: 'signed-out' | 'daily' | 'budget' | 'too-fast' | 'not-set-up' | 'unavailable' | 'offline'; message: string };

type Reason = Exclude<AiReply, { ok: true }>['reason'];
const MESSAGES: Record<Reason, string> = {
  'signed-out': 'Sign in to use AI help (tap the status at the top).',
  daily: "That's all the AI suggestions for today.",
  budget: "This month's AI budget is used up.",
  'too-fast': 'Just a moment between requests — try again in a few seconds.',
  'not-set-up': "AI help isn't set up on the server yet.",
  unavailable: "Couldn't get a suggestion just now.",
  offline: "Couldn't reach the AI — check your connection.",
};
// What stays as it was, said after each message (except "just a moment").
const SAME = { adjust: " Your plan hasn't changed, and Review my plan still works.", tasks: ' Nothing was added.', tutor: ' Your learning work is saved separately; the lesson still works.' };

export async function askModel(ctx: AiContext, signal?: AbortSignal): Promise<AiReply> {
  const tasks = (ctx as { action?: string }).action === 'tasks';
  const tutor = (ctx as { action?: string }).action === 'tutor';
  const fail = (reason: Reason): AiReply => ({ ok: false, reason, message: MESSAGES[reason] + (reason === 'too-fast' ? '' : SAME[tutor ? 'tutor' : tasks ? 'tasks' : 'adjust']) });
  if (AI_MODE === 'mock') {
    await new Promise(r => setTimeout(r, 600));
    if (MOCK_VARIANT === 'error') return fail('unavailable');
    if (tutor) {
      const { mockTutor } = await import('../../../supabase/functions/_shared/ai/tutor.ts');
      return { ok: true, text: mockTutor(ctx as Parameters<typeof mockTutor>[0]), model: 'practice helper (no AI)' };
    }
    if (tasks) {
      const { mockTasks } = await import('../../../supabase/functions/_shared/ai/tasks.ts');
      return { ok: true, text: mockTasks(ctx as Parameters<typeof mockTasks>[0], MOCK_VARIANT as 'good'), model: 'practice helper (no AI)' };
    }
    const { mockPlanner } = await import('../../../supabase/functions/_shared/ai/mock.ts');
    return { ok: true, text: mockPlanner(ctx as Parameters<typeof mockPlanner>[0], MOCK_VARIANT as 'good'), model: 'practice planner (no AI)' };
  }
  if (AI_MODE !== 'edge') return fail('not-set-up');
  if (signal?.aborted) return fail('unavailable');
  const { session, offline } = await currentSession();
  if (offline) return fail('offline');
  if (!session) return fail('signed-out');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 40000);
  const abort = () => ctrl.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) ctrl.abort();
  try {
    const res = await fetch(`${SYNC.url}/functions/v1/ai-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SYNC.key, Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ context: ctx }),
      signal: ctrl.signal,
    });
    let body: { ok?: boolean; output?: string; model?: string; error?: string; reason?: string } = {};
    try { body = await res.json(); } catch { /* handled below */ }
    if (res.ok && body.ok && typeof body.output === 'string') return { ok: true, text: body.output, model: body.model || 'AI' };
    if (res.status === 401) return fail('signed-out');
    if (res.status === 429) return fail(body.reason === 'daily' ? 'daily' : body.reason === 'budget' ? 'budget' : 'too-fast');
    if (res.status === 404 || body.error === 'not-configured') return fail('not-set-up');
    return fail('unavailable');
  } catch {
    return fail(ctrl.signal.aborted && !(signal && signal.aborted) ? 'unavailable' : 'offline');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
