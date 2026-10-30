// The app's own AI code and the rules behind it, for Node (the evaluation and the tests). Bundled by Vite
// (see build.mjs), so it's exactly the code the app runs — not a copy.
//
// Node has no browser storage and its own clock, so this also provides an in-memory localStorage (nothing is ever
// written to disk, and real MyDay data is never read) and a settable clock for each synthetic scenario.
export { freshState, normalize } from '../app/src/data/normalize';
export { boot, getSnapshot, update, updateSaved } from '../app/src/data/storage';
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
export { applyMind, buildTasksContext, checkTasksReply, sameList, sameTask, undoMind, type CheckedMind, type ListChoice, type MindUndo } from '../app/src/ai/mind';
export { buildTaskMessages, checkTasksContext, mockTasks, TASKS_LIMITS, TASKS_PROMPT_VERSION, TASKS_SYSTEM_PROMPT, type TasksContext } from '../supabase/functions/_shared/ai/tasks.ts';
export { messagesFor } from '../supabase/functions/_shared/ai/prompt.ts';
// AI help with notes (understand & connect, part 2).
export { applyConnect, connectContext, fingerprintNote, notesForAi, readConnectReply } from '../app/src/ai/connect';
export { buildConnectMessages, checkConnectContext, CONNECT_LIMITS, CONNECT_PROMPT_VERSION, CONNECT_SYSTEM_PROMPT, mockConnect, type ConnectContext } from '../supabase/functions/_shared/ai/connect.ts';
export { chooseTasks } from '../app/src/data/plan';
// The Cybersecurity tutor (the learning job: AI roles, step 2).
export { buildTutorMessages, checkTutorContext, mockTutor, TUTOR_PROMPT_VERSION, type TutorContext } from '../supabase/functions/_shared/ai/tutor.ts';
export { tutorLessons } from '../supabase/functions/_shared/ai/tutor-lessons.ts';
export { tutorReply } from '../app/src/study/cybersecurity/tutorReply';
// AI-written revision cards: the writer and the checker (AI roles, step 3), and the app's side (checks, adding, Undo).
export { addAiCards, cardsContext, readCardsReply, removeAiCards } from '../app/src/ai/cards';
export { aiCyberCards, dueIds } from '../app/src/data/study/queue';
// Cards from your notes (part C): the shared shapes and the app's side.
export { checkNoteCardsContext, checkNoteCheckContext, NOTE_LIMITS, readFlags, readNoteDraft } from '../supabase/functions/_shared/ai/note-cards.ts';
export { addNoteCards, noteCardsContext, noteCheckContext, noteLines, readNoteCardsReply, readNoteCheck } from '../app/src/ai/noteCards';
// Explanations you keep on a revision card (step 4).
export { anotherWayOf, keepAnotherWay } from '../app/src/data/study/anotherWay';
export { CARDS_CHECK_PROMPT_VERSION, CARDS_LIMITS, CARDS_PROMPT_VERSION, checkCardsContext, cleanDraftCard, mockCards, mockCardsCheck, readDraft, readVerdicts, type CardsCheckContext, type CardsContext, type DraftCard } from '../supabase/functions/_shared/ai/cards.ts';

// Ask MyDay (the AI design's step 1): the shared shape and instructions, and the app's side (page slice, checks, adding).
export { ASK_LIMITS, ASK_PROMPT_VERSION, buildAskMessages, checkAskContext, mockAsk, readAsk, type AskContext } from '../supabase/functions/_shared/ai/ask.ts';
export { askContext, askPage, askPreview, askSlice, sendsFor } from '../app/src/ai/askContext';
// What of your MyDay may reach AI help: the privacy rules every request follows (one place).
export { aiReach } from '../app/src/ai/reach';
// Ask MyDay's lookups: searching your notes on the device (specs/ai-tools.md §3).
export { dayLookup, decisionsLookup, lookupLine, notesLookup, projectLookup, searchLookup, studyLookup, waitingLookup } from '../app/src/ai/lookup';
export { courseIndex } from '../app/src/search/courseIndex';
export { addAskItems, applyAskChanges, applyAskEdit, checkAskReply, countWords, takeBackAsk, undoAsk, undoAskChanges } from '../app/src/ai/ask';
export { forgetAsk, lastAsk, onLastAsk, rememberAsk, undoNow } from '../app/src/ai/lastAsk';

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

// ---------- "Check my answer" (graduated help) ----------
export { checkAnswerRequest } from '../app/src/ai/checkAnswer';
export { arabicCheckSource } from '../app/src/study/arabic/checkSource';
export { cyberCheckSource } from '../app/src/study/cybersecurity/checkSource';
export { loadAnswers as loadArabicAnswers, loadModule as loadArabicModule, moduleList as arabicModules } from '../app/src/study/arabic/catalogue';
export { activities as cyberActivities, lessons as cyberLessons } from '../app/src/study/cybersecurity/catalogue';
export { LIMITS as REQUEST_LIMITS } from '../supabase/functions/_shared/ai/schema.ts';
export { buildCheckAnswerMessages, checkAnswerContext, CHECK_ANSWER_LIMITS, mockCheckAnswer, readCheckAnswer } from '../supabase/functions/_shared/ai/check-answer.ts';
export { learningOptions } from '../app/src/study/nextLearning';
export { buildsOn, factsOf, pathIds } from '../app/src/study/cybersecurity/plan';
export { flagCyberRevisit, markCyberReady } from '../app/src/data/cybersecurity/lessons';
