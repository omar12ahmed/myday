import { shift, shortDate, todayKey } from '../data/dates';
import type { TaskItem } from '../data/types';

// Inbox → Tasks: #inbox (or #inbox/tasks), #inbox/tasks/list/<id>, #inbox/tasks/lists, #inbox/tasks/<id>.
export type TasksView = { view: 'home' } | { view: 'list'; id: string } | { view: 'lists' } | { view: 'task'; id: string };
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
