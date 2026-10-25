// A Case deadline that's done, noted on the case's timeline (specs/projects-deadlines.md): offered once, one tap, never
// by itself ("Done: Send my witness statement", on the day it was done, as your account).
import { isCase } from './businessModel';
import { addEntry } from './caseFile';
import { todayKey } from './dates';
import { isDone } from './tasks';
import type { MyDayData, TaskItem } from './types';

const caseOf = (data: MyDayData, t: TaskItem) => { const p = t.projectId ? data.projects.items.find(x => x.id === t.projectId) : undefined; return p && isCase(p) ? p : undefined; };
// Noted while the entry made from it is still on its case's timeline (one you removed isn't "noted" any more).
export function deadlineNoted(data: MyDayData, t: TaskItem): boolean {
  const noted = t.deadline?.noted;
  return !!noted && !!caseOf(data, t)?.case?.timeline.some(e => e.id === noted);
}
// Offered while it's a deadline of a Case, done, and not noted.
export function deadlineToNote(data: MyDayData, t: TaskItem): boolean {
  return !!t.deadline && !!caseOf(data, t) && isDone(data, t) && !deadlineNoted(data, t);
}
// Adds the timeline entry and remembers it on the deadline. Returns the entry's id, 'full' or 'big' (the case can't
// take it), or null when there's nothing to note.
export function noteDeadlineDone(d: MyDayData, taskId: string): ReturnType<typeof addEntry> {
  const t = d.tasks.items.find(x => x.id === taskId);
  if (!t || !deadlineToNote(d, t)) return null;
  const r = addEntry(d, t.projectId!, { date: t.doneOn ?? t.plannedOn ?? todayKey(), title: `Done: ${t.title}`, source: 'mine' });
  if (r && r !== 'full' && r !== 'big') t.deadline!.noted = r;
  return r;
}
