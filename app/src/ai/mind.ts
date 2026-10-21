// "Add what's on my mind" (the brain-dump action), the app's side: what's sent, the checks on the reply, and saving
// only the tasks you tick. The contract, instructions and practice version are shared with the server and the
// evaluation (supabase/functions/_shared/ai/tasks.ts).
//
// Where tasks go:
//   one-off    the queue, as a task with no list of its own — MyDay fits it into a coming day (oldest first, within
//              the day's energy rule), and once it's done it's gone
//   one-off,   into Tasks, in that list (1.40.0) — one of your Tasks lists, or a new one the reply suggested and you
//   with a list  kept. It waits under "Your tasks" until you pick it or give it a date.
//   repeating  the end of that category's list, like a task added in "Your task lists"
// A suggested list is matched to your own Tasks lists here on the device (the names are never sent). Only additions:
// nothing is changed or removed. One step of Undo takes back exactly what was added (and a list it made, if that list
// is still empty and unrenamed), unless you've changed a task since or it's already on a day's plan (then it stays).
import { TASKS_CONTRACT_VERSION, TASKS_LIMITS, type TasksContext } from '../../../supabase/functions/_shared/ai/tasks.ts';
import { parseKey, todayKey } from '../data/dates';
import { uid } from '../data/normalize';
import { CAT_LABEL, sortQueue } from '../data/plan';
import { catchUp, updateSaved } from '../data/storage';
import { addList, addTask, TASK_LIMITS } from '../data/tasks';
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
// The same list in other words: capitals, spaces and punctuation, a leading "my" or "the", and a plural "s" don't
// count ("Errand" is your "Errands"; "my moving house" is "Moving house").
export const sameList = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/^(my|the)\s+/, '').replace(/s$/, '');
const findList = (data: MyDayData, name: string) => data.tasks.lists.find(l => sameList(l.name) === sameList(name)) ?? null;

export interface MindItem {
  key: string;                       // for the screen only
  title: string;
  category: Category;
  minutes: number;
  repeat: boolean;
  already: string | null;            // where it already is ("your Admin list", "your queue"), if anywhere
  list: string | null;               // a suggested list for a one-off task (1.40.0), checked
  listId: string | null;             // …which is this one of your Tasks lists, if it matches one
}
export interface CheckedMind { items: MindItem[]; notTasks: string[]; explanation: string; adjusted: string[] }
export type MindCode = 'not-json' | 'bad-shape' | 'too-many' | 'bad-item' | 'long-title' | 'bad-category' | 'bad-minutes' | 'bad-repeat'
  | 'repeated-item' | 'bad-not-tasks' | 'long-explanation' | 'pressure-language' | 'bad-list' | 'too-many-lists';
export interface MindChecked { proposal: CheckedMind | null; violations: { code: MindCode; detail: string }[] }

// Where a task with this title already is, if anywhere.
function whereAlready(data: MyDayData, title: string): string | null {
  const t = sameTask(title);
  for (const c of CATS) if (data.lists[c].some(x => sameTask(x.title) === t)) return `your ${CAT_LABEL[c]} list`;
  if (data.queue.some(q => sameTask(q.title) === t)) return 'your queue';
  if (data.tasks.items.some(x => !x.done && !x.letGoOn && sameTask(x.title) === t)) return 'your tasks';
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
    // A suggested list: plain words, its name short enough for a Tasks list, never for a repeating task, never pushy.
    let list: string | null = null;
    if (x.list !== undefined && x.list !== '') {
      const name = typeof x.list === 'string' ? x.list.replace(/\s+/g, ' ').trim() : '';
      if (repeat) adjusted.push(`"${title}" repeats, so it goes on your ${CAT_LABEL[category]} list, not in “${shorten(name, 30)}”.`);
      else if (!/\p{L}/u.test(name) || /\p{Extended_Pictographic}/u.test(name) || PRESSURE.test(name)) add('bad-list', `"${title}": ${name.slice(0, 20)}`);
      else list = shorten(name, Math.min(TASKS_LIMITS.listChars, TASK_LIMITS.listName));
    }
    items.push({ key: `m${items.length}`, title, category, minutes, repeat: repeat as boolean, already: whereAlready(data, title), list, listId: list ? findList(data, list)?.id ?? null : null });
  }
  // At most two new lists per reply: a third new name is dropped (its task stays, without a list).
  const newNames: string[] = [];
  for (const i of items) {
    if (!i.list || i.listId) continue;
    const k = sameList(i.list), known = newNames.find(n => sameList(n) === k);
    if (known) { i.list = known; continue; }
    if (newNames.length >= TASKS_LIMITS.newLists) { add('too-many-lists', i.list); adjusted.push(`"${i.title}" has no list: one suggestion makes at most ${TASKS_LIMITS.newLists} new lists.`); i.list = null; continue; }
    newNames.push(i.list);
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
// `inList`: for a one-off task, the Tasks list it goes in — one of yours (by id) or a new one (by name); none = the queue.
export type ListChoice = { id: string } | { name: string } | null;
export interface MindChoice { title: string; category: Category; minutes: number; repeat: boolean; inList?: ListChoice }
export interface MindUndo {
  list: { category: Category; id: string; title: string; minutes: number }[];
  queue: { qid: string; title: string; minutes: number }[];
  tasks?: { id: string; title: string; minutes: number }[];       // put into Tasks (1.40.0)
  lists?: { id: string; name: string }[];                         // Tasks lists this Add made
}

export function applyMind(choices: MindChoice[]): { ok: true; undo: MindUndo; message: string } | { ok: false; reason: 'nothing' | 'not-saved' } {
  if (!choices.length) return { ok: false, reason: 'nothing' };
  catchUp(); // the newest saved data (another tab, or a change synced from another device)
  const undo: MindUndo = { list: [], queue: [], tasks: [], lists: [] };
  const into = new Map<string, { name: string; n: number }>(); // per Tasks list: its name and how many went in
  let skipped = 0, full = 0;
  const r = updateSaved(d => {
    const k = todayKey();
    for (const c of choices) {
      if (whereAlready(d, c.title)) { skipped++; continue; } // added meanwhile (here or on another device)
      // A one-off task with a list goes into Tasks. A new list is made once, unless one of that name exists by now.
      let listId: string | null = null;
      if (!c.repeat && c.inList) {
        if ('id' in c.inList) listId = d.tasks.lists.some(l => l.id === (c.inList as { id: string }).id) ? c.inList.id : null;
        else {
          const existing = findList(d, c.inList.name);
          if (existing) listId = existing.id;
          else {
            listId = addList(d.tasks, c.inList.name);
            if (listId) undo.lists!.push({ id: listId, name: d.tasks.lists.find(l => l.id === listId)!.name });
            else full++; // 30 lists already: it goes in the queue instead
          }
        }
      }
      if (listId) {
        const id = addTask(d.tasks, { title: c.title, listId, category: c.category, minutes: c.minutes });
        if (id) {
          const t = d.tasks.items.find(x => x.id === id)!;
          undo.tasks!.push({ id, title: t.title, minutes: t.minutes });
          const name = d.tasks.lists.find(l => l.id === listId)!.name;
          into.set(listId, { name, n: (into.get(listId)?.n ?? 0) + 1 });
        }
        continue;
      }
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
    if (!undo.list.length && !undo.queue.length && !undo.tasks!.length) return false;
    sortQueue(d.queue);
  });
  if (r === 'unchanged') return { ok: false, reason: 'nothing' };
  if (r !== 'saved') return { ok: false, reason: 'not-saved' };
  const made = new Set(undo.lists!.map(l => l.id));
  const inLists = [...into].map(([id, l]) => `${l.n} to “${l.name}”${made.has(id) ? ' (a new list in Tasks)' : ' in Tasks'}`);
  const parts = [...inLists, undo.queue.length && `${undo.queue.length} to your queue`, undo.list.length && `${undo.list.length} to your lists`].filter(Boolean);
  const n = undo.queue.length + undo.list.length + undo.tasks!.length;
  return { ok: true, undo, message: `Added ${n} task${n === 1 ? '' : 's'}: ${parts.join(', ')}.${skipped ? ` ${skipped} ${skipped === 1 ? 'was' : 'were'} already there.` : ''}${full ? ` Tasks has ${TASK_LIMITS.lists} lists already, so ${full === 1 ? 'one' : full} went to your queue instead.` : ''}` };
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
    // Tasks put into a list: only if still as added, not done and not on a day's plan.
    for (const x of u.tasks ?? []) {
      const i = d.tasks.items.findIndex(t => t.id === x.id), t = d.tasks.items[i];
      if (t && t.title === x.title && t.minutes === x.minutes && !t.done && !t.plannedOn) { d.tasks.items.splice(i, 1); removed++; } else kept++;
    }
    // A list this Add made goes too, if it's now empty and still has the name it was given.
    for (const l of u.lists ?? []) {
      const i = d.tasks.lists.findIndex(x => x.id === l.id);
      if (i >= 0 && d.tasks.lists[i].name === l.name && !d.tasks.items.some(t => t.listId === l.id)) { d.tasks.lists.splice(i, 1); removed++; }
    }
    if (!removed) return false;
  });
  if (r === 'not-saved') return { result: 'not-saved', kept };
  return { result: kept ? 'partly' : 'undone', kept };
}
