// Tidy up, in Tasks (specs/today-learning-and-tidy.md §4; the owner's choice of 1 Nov 2026): your unfinished tasks that
// look old or unrelated, each with why, for you to let go of — one at a time or all together. Nothing here is deleted:
// letting go marks a task let go (as everywhere), so a project's links to it still work and your history stays. What
// counts as "its reason has gone" is read only from the records that point at the task (myday-af's answers of 1 Nov
// 2026). A Chase task's wait leaves no trace when it ends, so one is matched to the task or project it chases instead,
// never by its "Chase: " alone. The old learning starters are offered here too (removing them is yours to choose).
import { isApplication, interviewsOf, stageOf } from './career';
import { shift, shortDate } from './dates';
import { bugState, isBug } from './software';
import { inQueue, isDone, onTodaysPlan, taskOrder } from './tasks';
import { OLD_LEARNING_STARTERS } from './normalize';
import type { DateKey, ListItem, MyDayData } from './types';

export const OLD_AFTER_DAYS = 14;
export type TidyGroup = 'gone' | 'finished' | 'old' | 'old-in-project';
export const TIDY_GROUP_LABEL: Record<TidyGroup, string> = {
  gone: 'Its reason has gone', finished: 'From a finished project', old: 'From more than 2 weeks ago', 'old-in-project': 'In projects you haven’t finished',
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
    // "Heard back?" is answered once the application is past Applied (Interviewing, Offer) or closed.
    const moved = stage === 'interviewing' || stage === 'offer';
    if (a.followTaskId && !out.has(a.followTaskId)) out.set(a.followTaskId, stage === 'closed' ? 'the application is closed' : moved ? 'the application has moved on' : null);
    for (const iv of interviewsOf(a)) {
      if (iv.taskId && !out.has(iv.taskId)) out.set(iv.taskId, stage === 'closed' ? 'the application is closed' : iv.on < k ? `the interview was on ${shortDate(iv.on)}` : null);
    }
  }
  return out;
}
// "Chase it" makes "Chase: <the task>" (or "Chase: <the project>"), and the wait points at it; when the wait ends ("Got
// it"), nothing does. So a Chase task whose wait has ended is one titled for a task (in the same project) or a project
// that's no longer waiting, which nothing points at. A task you wrote yourself that happens to start "Chase: " isn't
// one, unless it names such a task or project exactly.
function waitsEnded(data: MyDayData): Map<string, string> {
  const pointed = new Set([...data.tasks.items.map(x => x.waiting?.chaseTaskId), ...data.projects.items.map(p => p.waiting?.chaseTaskId)].filter(Boolean));
  const ended = new Map<string, string>();
  for (const x of data.tasks.items) if (!x.waiting) ended.set(`${x.projectId ?? ''}\n${x.title}`, 'its wait has ended');
  for (const p of data.projects.items) if (!p.waiting) ended.set(`${p.id}\n${p.title}`, 'the project’s wait has ended');
  const out = new Map<string, string>();
  for (const t of data.tasks.items) {
    if (!t.title.startsWith('Chase: ') || pointed.has(t.id)) continue;
    const of = t.title.slice('Chase: '.length), why = ended.get(`${t.projectId ?? ''}\n${of}`);
    if (why) out.set(t.id, why);
  }
  return out;
}

// What to offer, in Tasks' order: unfinished, not let go, not on today's plan and not waiting in the queue (those are
// in hand). `kept`: ones you chose to keep, on this device.
export function tidyCandidates(data: MyDayData, k: DateKey, kept: ReadonlySet<string> = new Set()): TidyItem[] {
  const before = shift(k, -OLD_AFTER_DAYS), out: TidyItem[] = [], reasons = reasonsGone(data, k), chases = waitsEnded(data);
  for (const t of [...data.tasks.items].sort(taskOrder)) {
    if (kept.has(t.id) || isDone(data, t) || t.letGoOn || onTodaysPlan(data, t, k) || inQueue(data, t)) continue;
    const gone = reasons.has(t.id) ? reasons.get(t.id) : chases.get(t.id) ?? null;
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

// On this device only (never synced): the tasks you chose to keep, the day you said "Not now" (the card then rests for
// 7 days), and whether you chose to keep the old starters. Wrapped: storage may be unavailable, and then the card simply shows.
const KEY = 'myday.tidy';
export interface TidyPrefs { kept: string[]; notNowOn: DateKey | null; keptStarters: boolean }
export function tidyPrefs(): TidyPrefs {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || '{}') as { kept?: unknown; notNowOn?: unknown; keptStarters?: unknown };
    return { kept: Array.isArray(o.kept) ? o.kept.filter((x): x is string => typeof x === 'string').slice(-500) : [], notNowOn: typeof o.notNowOn === 'string' ? o.notNowOn : null, keptStarters: o.keptStarters === true };
  } catch { return { kept: [], notNowOn: null, keptStarters: false }; }
}
export function saveTidyPrefs(p: TidyPrefs) {
  try { localStorage.setItem(KEY, JSON.stringify({ kept: p.kept.slice(-500), notNowOn: p.notNowOn, keptStarters: p.keptStarters })); } catch { /* storage unavailable: not remembered */ }
}
export const tidyResting = (notNowOn: DateKey | null, k: DateKey) => !!notNowOn && notNowOn > shift(k, -7);

// The old learning starters still in your Learning list exactly as MyDay added them (same id, title and minutes), and
// not made into one of your Study courses: Today's learning now comes from Study, so Tidy up offers to remove them.
export function oldStarters(data: MyDayData): ListItem[] {
  const linked = new Set(data.study.stages.flatMap(g => g.courses.map(c => c.listId)).filter(Boolean));
  return data.lists.learning.filter(i => !linked.has(i.id) && OLD_LEARNING_STARTERS.some(x => x.id === i.id && x.title === i.title && x.minutes === i.minutes));
}
// Remove them (your choice): returns each with where it was, for Undo. Nothing else changes (anything queued stays).
export function removeOldStarters(data: MyDayData): { item: ListItem; at: number }[] {
  const ids = new Set(oldStarters(data).map(i => i.id)), out: { item: ListItem; at: number }[] = [];
  data.lists.learning.forEach((item, at) => { if (ids.has(item.id)) out.push({ item: { ...item }, at }); });
  data.lists.learning = data.lists.learning.filter(i => !ids.has(i.id));
  return out;
}
// Undo: back where they were (unless one of the same id is there again).
export function restoreOldStarters(data: MyDayData, removed: { item: ListItem; at: number }[]): boolean {
  let changed = false;
  for (const r of [...removed].sort((a, b) => a.at - b.at)) {
    if (data.lists.learning.some(i => i.id === r.item.id)) continue;
    data.lists.learning.splice(Math.min(r.at, data.lists.learning.length), 0, { ...r.item });
    changed = true;
  }
  return changed;
}
