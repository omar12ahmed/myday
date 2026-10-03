// The app's own AI code and the rules behind it, for Node (the evaluation and the tests). Bundled by Vite
// (see build.mjs), so it's exactly the code the app runs — not a copy.
//
// Node has no browser storage and its own clock, so this also provides an in-memory localStorage (nothing is ever
// written to disk, and real MyDay data is never read) and a settable clock for each synthetic scenario.
export { freshState, normalize } from '../app/src/data/normalize';
export { boot, getSnapshot, update } from '../app/src/data/storage';
export { todayKey } from '../app/src/data/dates';
export { blocksFor, freeSegments } from '../app/src/data/schedule';
export { buildContext, missingInfo, roomToday } from '../app/src/ai/context';
export { checkProposal, parseReply, type CheckedProposal, type Violation } from '../app/src/ai/validate';
export { applyAi, canUndo, planStamp, toReview, undoAi } from '../app/src/ai/apply';
export { mockPlanner } from '../supabase/functions/_shared/ai/mock.ts';
export { buildMessages, PROMPT_VERSION, SYSTEM_PROMPT } from '../supabase/functions/_shared/ai/prompt.ts';
export { callModel, costUsd, estimateTokens, reserveInputTokens, worstCaseCostUsd, type ProviderConfig } from '../supabase/functions/_shared/ai/providers.ts';
export type { PlanContext } from '../supabase/functions/_shared/ai/schema.ts';
// "Add what's on my mind" (the brain-dump action).
export { applyMind, buildTasksContext, checkTasksReply, sameTask, undoMind, type CheckedMind, type MindUndo } from '../app/src/ai/mind';
export { buildTaskMessages, checkTasksContext, mockTasks, TASKS_LIMITS, TASKS_PROMPT_VERSION, TASKS_SYSTEM_PROMPT, type TasksContext } from '../supabase/functions/_shared/ai/tasks.ts';
export { messagesFor } from '../supabase/functions/_shared/ai/prompt.ts';
export { chooseTasks } from '../app/src/data/plan';

// ---------- Memory-only storage ----------
export function useMemoryStorage() {
  const m = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: k => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    clear: () => m.clear(),
    key: i => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}

// ---------- A settable clock ----------
// The time in the time zone given by process.env.TZ (set it before anything uses dates), e.g. "2026-11-10T09:30".
const RealDate = Date;
let base = 0, started = 0;
class ClockDate extends RealDate {
  constructor(...a: unknown[]) {
    if (a.length) super(...(a as [number]));
    else super(base + (RealDate.now() - started));
  }
  static now() { return base + (RealDate.now() - started); }
}
export function setClock(local: string) {
  const [d, t] = local.split('T');
  const [y, mo, day] = d.split('-').map(Number), [h, mi] = t.split(':').map(Number);
  base = new RealDate(y, mo - 1, day, h, mi).getTime();
  started = RealDate.now();
  (globalThis as unknown as { Date: DateConstructor }).Date = ClockDate as unknown as DateConstructor;
}
