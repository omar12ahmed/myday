// Tidy up, in Tasks (specs/today-learning-and-tidy.md §4; the owner's choice of 1 Nov 2026): your unfinished tasks that
// look old or unrelated, each with why, for you to let go of — one at a time or all together. Nothing here is deleted:
// letting go marks a task let go (as everywhere), so a project's links to it still work and your history stays. What
// counts as "its reason has gone" is read only from the records that point at the task, never from its title alone
// (myday-af's answers of 1 Nov 2026), except a Chase task, whose wait leaves no trace when it ends.
import { isApplication, interviewsOf, stageOf } from './career';
import { shift, shortDate } from './dates';
import { bugState, isBug } from './software';
import { inQueue, isDone, onTodaysPlan, taskOrder } from './tasks';
import type { DateKey, MyDayData } from './types';

export const OLD_AFTER_DAYS = 14;
export type TidyGroup = 'gone' | 'finished' | 'old' | 'old-in-project';
export const TIDY_GROUP_LABEL: Record<TidyGroup, string> = {
  gone: 'Its reason has gone', finished: 'From a finished project', old: 'From more than 2 weeks ago', 'old-in-project': 'In active projects',
};
export interface TidyItem { id: string; title: string; why: string; group: TidyGroup }

// Why each task MyDay made for you no longer has a reason, read once from what points at it: task id → why, or null when
// its record still gives it one. A task nothing points at isn't in the map (so this can't be told, except for Chase).
function reasonsGone(data: MyDayData, k: DateKey): Map<string, string | null> {
  const out = new Map<string, string | null>();
  for (const b of (data.software?.items ?? []).filter(isBug)) {
    if (!b.taskId || out.has(b.taskId)) continue;
    const st = bugState(b);
    out.set(b.taskId, st === 'fixed' ? 'its bug is fixed' : st === 'wontfix' ? 'its bug is marked won’t fix' : null);
  }
  for (const a of (data.career?.items ?? []).filter(isApplication)) {
    const stage = stageOf(a);
    if (a.followTaskId && !out.has(a.followTaskId)) out.set(a.followTaskId, stage === 'closed' ? 'the application is closed' : stage !== 'applied' ? 'the application has moved on' : null);
    for (const iv of interviewsOf(a)) {
      if (iv.taskId && !out.has(iv.taskId)) out.set(iv.taskId, stage === 'closed' ? 'the application is closed' : iv.on < k ? `the interview was on ${shortDate(iv.on)}` : null);
    }
  }
  return out;
}
// "Chase it" makes "Chase: …" and the wait points at it; when the wait ends ("Got it"), nothing does.
const chasedIds = (data: MyDayData) => new Set([...data.tasks.items.map(x => x.waiting?.chaseTaskId), ...data.projects.items.map(p => p.waiting?.chaseTaskId)].filter((x): x is string => !!x));

// What to offer, in Tasks' order: unfinished, not let go, not on today's plan and not waiting in the queue (those are
// in hand). `kept`: ones you chose to keep, on this device.
export function tidyCandidates(data: MyDayData, k: DateKey, kept: ReadonlySet<string> = new Set()): TidyItem[] {
  const before = shift(k, -OLD_AFTER_DAYS), out: TidyItem[] = [], reasons = reasonsGone(data, k), chased = chasedIds(data);
  for (const t of [...data.tasks.items].sort(taskOrder)) {
    if (kept.has(t.id) || isDone(data, t) || t.letGoOn || onTodaysPlan(data, t, k) || inQueue(data, t)) continue;
    const gone = reasons.has(t.id) ? reasons.get(t.id) : t.title.startsWith('Chase: ') && !chased.has(t.id) ? 'no wait points at it any more' : null;
    if (gone) { out.push({ id: t.id, title: t.title, why: gone[0].toUpperCase() + gone.slice(1), group: 'gone' }); continue; }
    const p = t.projectId ? data.projects.items.find(x => x.id === t.projectId) : undefined;
    if (p?.status === 'done') { out.push({ id: t.id, title: t.title, why: `${p.title} is finished`, group: 'finished' }); continue; }
    if (t.due && t.due < before) out.push({ id: t.id, title: t.title, why: `From ${shortDate(t.due)}`, group: p ? 'old-in-project' : 'old' });
  }
  return out;
}

// Let go of these (today), as "Let it go" does anywhere: the task is kept, marked let go. Returns the ones changed, for
// Undo.
export function letGoOf(data: MyDayData, ids: string[], k: DateKey): string[] {
  const done: string[] = [];
  for (const id of ids) {
    const t = data.tasks.items.find(x => x.id === id);
    if (!t || t.letGoOn || isDone(data, t)) continue;
    t.letGoOn = k;
    done.push(id);
  }
  return done;
}
// Undo: the ones let go here, today, are back as they were.
export function undoLetGo(data: MyDayData, ids: string[], k: DateKey): boolean {
  let changed = false;
  for (const id of ids) { const t = data.tasks.items.find(x => x.id === id); if (t?.letGoOn === k) { t.letGoOn = null; changed = true; } }
  return changed;
}

// On this device only (never synced): the tasks you chose to keep, and the day you said "Not now" (the card then rests
// for 7 days). Wrapped: storage may be unavailable, and then the card simply shows.
const KEY = 'myday.tidy';
export function tidyPrefs(): { kept: string[]; notNowOn: DateKey | null } {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || '{}') as { kept?: unknown; notNowOn?: unknown };
    return { kept: Array.isArray(o.kept) ? o.kept.filter((x): x is string => typeof x === 'string').slice(-500) : [], notNowOn: typeof o.notNowOn === 'string' ? o.notNowOn : null };
  } catch { return { kept: [], notNowOn: null }; }
}
export function saveTidyPrefs(p: { kept: string[]; notNowOn: DateKey | null }) {
  try { localStorage.setItem(KEY, JSON.stringify({ kept: p.kept.slice(-500), notNowOn: p.notNowOn })); } catch { /* storage unavailable: not remembered */ }
}
export const tidyResting = (notNowOn: DateKey | null, k: DateKey) => !!notNowOn && notNowOn > shift(k, -7);
