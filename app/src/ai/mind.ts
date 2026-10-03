// "Add what's on my mind" (the brain-dump action), the app's side: what's sent, the checks on the reply, and saving
// only the tasks you tick. The contract, instructions and practice version are shared with the server and the
// evaluation (supabase/functions/_shared/ai/tasks.ts).
//
// Where tasks go:
//   one-off    the queue, as a task with no list of its own — MyDay fits it into a coming day (oldest first, within
//              the day's energy rule), and once it's done it's gone
//   repeating  the end of that category's list, like a task added in "Your task lists"
// Only additions: nothing is changed or removed. One step of Undo takes back exactly what was added, unless you've
// changed it since or it's already on a day's plan (then it stays).
import { TASKS_CONTRACT_VERSION, TASKS_LIMITS, type TasksContext } from '../../../supabase/functions/_shared/ai/tasks.ts';
import { parseKey, todayKey } from '../data/dates';
import { uid } from '../data/normalize';
import { CAT_LABEL, sortQueue } from '../data/plan';
import { catchUp, updateSaved } from '../data/storage';
import type { Category, MyDayData } from '../data/types';
import { MAX_WORDS, parseReply, PRESSURE, shorten } from './validate';

const CATS: Category[] = ['learning', 'admin', 'health'];
const GENTLE = 'Here are some small first steps — pick the ones you want.';

export function buildTasksContext(text: string): TasksContext {
  const k = todayKey();
  return {
    version: TASKS_CONTRACT_VERSION, action: 'tasks', date: k,
    weekday: parseKey(k).toLocaleDateString('en-GB', { weekday: 'long' }),
    text: text.trim().slice(0, TASKS_LIMITS.textChars), maxItems: TASKS_LIMITS.items,
  };
}

// The same task in other words: lower case, letters and digits only.
export const sameTask = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export interface MindItem {
  key: string;                       // for the screen only
  title: string;
  category: Category;
  minutes: number;
  repeat: boolean;
  already: string | null;            // where it already is ("your Admin list", "your queue"), if anywhere
}
export interface CheckedMind { items: MindItem[]; notTasks: string[]; explanation: string; adjusted: string[] }
export type MindCode = 'not-json' | 'bad-shape' | 'too-many' | 'bad-item' | 'long-title' | 'bad-category' | 'bad-minutes' | 'bad-repeat'
  | 'repeated-item' | 'bad-not-tasks' | 'long-explanation' | 'pressure-language';
export interface MindChecked { proposal: CheckedMind | null; violations: { code: MindCode; detail: string }[] }

// Where a task with this title already is, if anywhere.
function whereAlready(data: MyDayData, title: string): string | null {
  const t = sameTask(title);
  for (const c of CATS) if (data.lists[c].some(x => sameTask(x.title) === t)) return `your ${CAT_LABEL[c]} list`;
  if (data.queue.some(q => sameTask(q.title) === t)) return 'your queue';
  return null;
}

// Every rule, on the model's reply. Anything that breaks one is corrected (and listed) or left out; nothing the model
// sends can be saved without these checks and your choice.
export function checkTasksReply(text: string, data: MyDayData): MindChecked {
  const violations: MindChecked['violations'] = [];
  const add = (code: MindCode, detail: string) => violations.push({ code, detail });
  const raw = parseReply(text);
  if (raw === undefined) { add('not-json', 'the reply is not JSON'); return { proposal: null, violations }; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Array.isArray((raw as Record<string, unknown>).items)) {
    add('bad-shape', 'no list of tasks'); return { proposal: null, violations };
  }
  const r = raw as Record<string, unknown>;
  const adjusted: string[] = [];
  const items: MindItem[] = [];
  const notTasks: string[] = [];
  const seen = new Set<string>();
  for (const it of r.items as unknown[]) {
    if (!it || typeof it !== 'object') { add('bad-item', 'not a task'); continue; }
    const x = it as Record<string, unknown>;
    let title = typeof x.title === 'string' ? x.title.replace(/^[\s\-*•\d.)]+/, '').replace(/\s+/g, ' ').trim() : '';
    if (title.length < 2) { add('bad-item', 'a task without a name'); continue; }
    if (title.length > TASKS_LIMITS.titleChars) { add('long-title', `${title.length} characters`); title = shorten(title, TASKS_LIMITS.titleChars); adjusted.push(`"${title}" shortened.`); }
    if (seen.has(sameTask(title))) { add('repeated-item', `"${title}" twice`); continue; }
    seen.add(sameTask(title));
    if (items.length >= TASKS_LIMITS.items) { add('too-many', `more than ${TASKS_LIMITS.items}`); notTasks.push(title); continue; }
    let category = x.category as Category;
    if (!CATS.includes(category)) { add('bad-category', `"${title}": ${String(x.category).slice(0, 20)}`); category = 'admin'; adjusted.push(`"${title}" put in Admin (the suggested list isn't one of MyDay's).`); }
    let minutes = Number(x.minutes);
    if (!Number.isFinite(minutes) || minutes < TASKS_LIMITS.minMinutes || minutes > TASKS_LIMITS.maxMinutes || !Number.isInteger(minutes)) {
      add('bad-minutes', `"${title}": ${String(x.minutes).slice(0, 12)}`);
      minutes = Number.isFinite(minutes) ? Math.min(TASKS_LIMITS.maxMinutes, Math.max(TASKS_LIMITS.minMinutes, Math.round(minutes))) : 15;
      adjusted.push(`"${title}" set to ${minutes} minutes.`);
    }
    let repeat = x.repeat;
    if (typeof repeat !== 'boolean') { add('bad-repeat', `"${title}"`); repeat = false; }
    items.push({ key: `m${items.length}`, title, category, minutes, repeat: repeat as boolean, already: whereAlready(data, title) });
  }
  if (r.notTasks !== undefined && !Array.isArray(r.notTasks)) add('bad-not-tasks', 'not a list');
  for (const n of Array.isArray(r.notTasks) ? r.notTasks : []) {
    if (typeof n === 'string' && n.trim()) notTasks.push(shorten(n.trim(), TASKS_LIMITS.notTaskChars));
  }
  let explanation = typeof r.explanation === 'string' ? r.explanation.trim() : '';
  if (PRESSURE.test(explanation)) { add('pressure-language', explanation.match(PRESSURE)![0]); explanation = GENTLE; adjusted.push('The explanation was replaced: it sounded pushy, and MyDay keeps things gentle.'); }
  const words = explanation.split(/\s+/).filter(Boolean);
  if (words.length > MAX_WORDS) { add('long-explanation', `${words.length} words`); explanation = shorten(words.slice(0, MAX_WORDS).join(' '), TASKS_LIMITS.explanationChars, true); }
  explanation = shorten(explanation, TASKS_LIMITS.explanationChars);
  return { proposal: { items, notTasks: notTasks.slice(0, 10), explanation, adjusted }, violations };
}

// ---------- Saving what you ticked ----------
export interface MindChoice { title: string; category: Category; minutes: number; repeat: boolean }
export interface MindUndo { list: { category: Category; id: string; title: string; minutes: number }[]; queue: { qid: string; title: string; minutes: number }[] }

export function applyMind(choices: MindChoice[]): { ok: true; undo: MindUndo; message: string } | { ok: false; reason: 'nothing' | 'not-saved' } {
  if (!choices.length) return { ok: false, reason: 'nothing' };
  catchUp(); // the newest saved data (another tab, or a change synced from another device)
  const undo: MindUndo = { list: [], queue: [] };
  let skipped = 0;
  const r = updateSaved(d => {
    const k = todayKey();
    for (const c of choices) {
      if (whereAlready(d, c.title)) { skipped++; continue; } // added meanwhile (here or on another device)
      if (c.repeat) {
        const id = c.category[0] + uid();
        d.lists[c.category].push({ id, title: c.title, minutes: c.minutes });
        undo.list.push({ category: c.category, id, title: c.title, minutes: c.minutes });
      } else {
        const qid = uid();
        d.queue.push({ qid, taskId: null, category: c.category, title: c.title, minutes: c.minutes, queuedOn: k, sourceUid: null });
        undo.queue.push({ qid, title: c.title, minutes: c.minutes });
      }
    }
    if (!undo.list.length && !undo.queue.length) return false;
    sortQueue(d.queue);
  });
  if (r === 'unchanged') return { ok: false, reason: 'nothing' };
  if (r !== 'saved') return { ok: false, reason: 'not-saved' };
  const parts = [undo.queue.length && `${undo.queue.length} to your queue`, undo.list.length && `${undo.list.length} to your lists`].filter(Boolean);
  const n = undo.queue.length + undo.list.length;
  return { ok: true, undo, message: `Added ${n} task${n === 1 ? '' : 's'}: ${parts.join(', ')}.${skipped ? ` ${skipped} ${skipped === 1 ? 'was' : 'were'} already there.` : ''}` };
}

// Take back exactly what was added — but never a task you've changed since, or one already taken onto a day's plan.
export function undoMind(u: MindUndo): { result: 'undone' | 'partly' | 'not-saved'; kept: number } {
  catchUp();
  let kept = 0;
  const r = updateSaved(d => {
    let removed = 0;
    for (const x of u.list) {
      const i = d.lists[x.category].findIndex(t => t.id === x.id);
      if (i >= 0 && d.lists[x.category][i].title === x.title && d.lists[x.category][i].minutes === x.minutes) { d.lists[x.category].splice(i, 1); removed++; } else kept++;
    }
    for (const x of u.queue) {
      const i = d.queue.findIndex(q => q.qid === x.qid);
      if (i >= 0 && d.queue[i].title === x.title && d.queue[i].minutes === x.minutes) { d.queue.splice(i, 1); removed++; } else kept++;
    }
    if (!removed) return false;
  });
  if (r === 'not-saved') return { result: 'not-saved', kept };
  return { result: kept ? 'partly' : 'undone', kept };
}
