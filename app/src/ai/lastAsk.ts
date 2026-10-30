import { todayKey } from '../data/dates';
import type { DateKey, MyDayData } from '../data/types';
import { takeBackAsk, undoAskChanges, type AskChangeUndo, type AskUndo } from './ask';

// The last thing Ask MyDay added or changed, kept so it can be undone from + after the panel has closed (the owner's
// choices of 30 Oct 2026): until midnight, or until Ask adds or changes something else (one step of Undo). Remembered
// on this device only, like the lesson step: not part of your data, not synced, not exported; Delete everything clears
// it with the other device-only keys. Undo still takes back only what's as Ask left it (ai/ask.ts).
const KEY = 'myday.ask.lastUndo';
export type LastAsk = ({ kind: 'added'; undo: AskUndo } | { kind: 'changed'; undo: AskChangeUndo }) & { words: string; on: DateKey; at: string };

const listeners = new Set<() => void>();
// Told when the last one is replaced or forgotten (so a line offering it stops offering it).
export function onLastAsk(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }
const told = () => { for (const fn of listeners) fn(); };

export function rememberAsk(x: { kind: 'added'; undo: AskUndo; words: string } | { kind: 'changed'; undo: AskChangeUndo; words: string }, now = new Date()) {
  const at = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  try { localStorage.setItem(KEY, JSON.stringify({ ...x, on: todayKey(), at })); } catch { /* still undoable while + is open */ }
  told();
}
export function forgetAsk() {
  try { localStorage.removeItem(KEY); } catch { /* nothing to forget */ }
  told();
}

// Undo it now (from the panel, or later from +): what's as Ask left it goes back, anything you've changed since stays,
// and the message says which. `done` when there's nothing more to undo (so it's forgotten); not when saving failed.
export function undoNow(x: { kind: 'added'; undo: AskUndo } | { kind: 'changed'; undo: AskChangeUndo }): { message: string; done: boolean } {
  const r = x.kind === 'added' ? takeBackAsk(x.undo) : undoAskChanges(x.undo);
  if (r.result === 'not-saved') return { message: "Couldn't save just now.", done: false };
  const [all, some, none] = x.kind === 'added' ? ['Taken back.', 'Taken back', "Nothing taken back — you've changed it since."] : ['Put back as it was.', 'Put back', "Nothing put back — you've changed it since."];
  const message = r.result === 'undone' ? all : r.result === 'partly' ? `${some}, except ${r.kept === 1 ? 'one thing' : `${r.kept} things`} you've changed since.` : none;
  forgetAsk();
  return { message, done: true };
}

// Is anything it added or changed still here to take back? (A sign-in to another account, or your own deletions, can
// leave nothing.)
function stillHere(data: MyDayData, x: LastAsk): boolean {
  const has = <T extends { id: string }>(list: T[], ids: string[]) => ids.some(id => list.some(y => y.id === id));
  if (x.kind === 'changed') {
    const u = x.undo;
    return has(data.tasks.items, u.tasks.map(t => t.id)) || has(data.notes.items, u.notes.map(n => n.id)) || has(data.commitments, u.commitments.map(c => c.id));
  }
  const u = x.undo, stepTasks = (u.steps ?? []).map(s => s.taskId), planProjects = (u.plan ?? []).map(p => p.projectId);
  const studyTasks = new Set(data.study.stages.flatMap(sg => sg.courses.flatMap(c => c.modules.flatMap(m => m.sections.flatMap(sc => sc.tasks.map(t => t.id))))));
  return has(data.tasks.items, [...u.tasks, ...stepTasks]) || has(data.notes.items, u.notes) || has(data.commitments, u.appointments) || has(data.projects.items, [...u.projects, ...planProjects])
    || (u.study?.tasks ?? []).some(id => studyTasks.has(id));
}

// Today's, if there's still something of it to take back; otherwise nothing (and it's forgotten).
export function lastAsk(data: MyDayData, today: DateKey = todayKey()): LastAsk | null {
  let x: LastAsk | null = null;
  try { x = JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; }
  if (!x) return null;
  const shaped = typeof x === 'object' && (x.kind === 'added' || x.kind === 'changed') && typeof x.words === 'string' && typeof x.on === 'string' && typeof x.at === 'string' && !!x.undo && typeof x.undo === 'object'
    && Array.isArray((x.undo as { tasks?: unknown }).tasks) && Array.isArray((x.undo as { notes?: unknown }).notes);
  if (!shaped || x.on !== today || !stillHere(data, x)) { try { localStorage.removeItem(KEY); } catch { /* gone anyway */ } return null; }
  return x;
}
