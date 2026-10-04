import { shift, shortDate, todayKey } from '../data/dates';
import type { TaskItem } from '../data/types';

// Tasks live under Today (from 1.12.0; before, in the Inbox — older links are rewritten, see shell/legacyLinks.ts):
// #today/tasks, #today/tasks/list/<id>, #today/tasks/lists, #today/tasks/<id>.
export type TasksView = { view: 'home' } | { view: 'list'; id: string } | { view: 'lists' } | { view: 'task'; id: string };
export const TASKS = 'today/tasks';
export function tasksRoute(hash: string): TasksView {
  const p = hash.replace('#', '').split('/').map(decodeURIComponent);
  if (p[1] !== 'tasks') return { view: 'home' };
  if (p[2] === 'lists') return { view: 'lists' };
  if (p[2] === 'list' && p[3]) return { view: 'list', id: p[3] };
  return p[2] ? { view: 'task', id: p[2] } : { view: 'home' };
}

// When a task is due, in plain words: "today 10:00", "tomorrow", "Fri 16 Oct".
export function dueText(t: TaskItem, k = todayKey()) {
  if (!t.due) return '';
  const day = t.due === k ? 'today' : t.due === shift(k, 1) ? 'tomorrow' : shortDate(t.due);
  return t.time ? `${day} ${t.time}` : day;
}
