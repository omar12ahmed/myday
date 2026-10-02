// The store: the only place that reads and writes MyDay's saved data.
// Ported from the current MyDay (boot, persist and reloadFromStorage), with the same protections:
//
// 1. Nothing is saved until the saved data has been loaded and checked. If it can't be read, or it
//    came from a newer version of MyDay, saving stops and the saved copy is left exactly as it was.
// 2. Never save over another tab's newer data. Before each save, the saved text is compared with
//    what this tab last read or wrote. If another tab (or the current MyDay) changed it, this tab
//    shows the newer data instead, and says that its own change wasn't saved.
// 3. localStorage has no locking, so two tabs that save at the same moment can both pass check 2,
//    and the later write wins. That can't be prevented; it is detected instead: every save is
//    numbered and signed by the tab that made it, the last few signatures travel with the data,
//    and a tab whose signature is missing from newer data says its change was replaced.
//
// Components read the data with useMyDay() (see useMyDay.ts) and change it with update().
import { localStamp, todayKey } from './dates';
import { CATS, freshState, isObj, normalize, SAVE_LOG, SCHEMA_VERSION, uid } from './normalize';
import { toast } from './toast';
import type { MyDayData } from './types';

export const STORAGE_KEY = 'myday.data.v4'; // the same key the current MyDay uses
const EXPORT_FORMAT = 'myday-export';
// Data from older versions of MyDay. The current MyDay moves it to the key above when it opens.
const OLDER_KEYS = ['myday.data.v3', 'myday.data.v2', 'myday.tasks', 'myday.days', 'myday.nudge', 'myday.meta'];

export type Status =
  | { kind: 'ok' }
  | { kind: 'unavailable' }                       // the browser blocks storage: changes last until the page closes
  | { kind: 'older' }                             // only data from an older MyDay: the current MyDay updates it first
  | { kind: 'damaged'; raw: string; reason: string }; // saved data can't be read here: saving is paused

export interface Snapshot {
  data: MyDayData;
  status: Status;
  generation: number; // goes up whenever the data is replaced from outside (another tab, an import)
}

const TAB_ID = uid();
let snapshot: Snapshot = { data: freshState(), status: { kind: 'ok' }, generation: 0 };
let lastSaved: string | null = null;              // the exact text this tab last read or wrote
let mySave: { seq: number; id: string } | null = null; // this tab's last save, until it's seen to be kept
let bootNotice = '';
const listeners = new Set<() => void>();

function set(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  for (const fn of listeners) fn();
}
export const getSnapshot = () => snapshot;
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// ---------- Loading ----------
function readKey(key: string): string | null {
  return localStorage.getItem(key); // may throw if the browser blocks storage
}

// Turns saved text into data, or explains why it can't be used.
function parseSaved(raw: string, newerReason: string): { data: MyDayData; dropped: number } | { reason: string } {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return { reason: "It looks damaged and can't be read." }; }
  if (!isObj(parsed)) return { reason: "It looks damaged and can't be read." };
  const v = parsed.schemaVersion;
  if (typeof v === 'number' && v > SCHEMA_VERSION) return { reason: newerReason };
  if (![2, 3, SCHEMA_VERSION].includes(v as number)) return { reason: "It's in a format this version doesn't recognise." };
  const report = { dropped: 0 };
  try { return { data: normalize(parsed, report), dropped: report.dropped }; } catch { return { reason: "It looks damaged and can't be read." }; }
}

// Saved entries that couldn't be read when MyDay started (left out, and gone after the next save), with the
// saved text exactly as it was, so you can download a copy first. See LoadIssue.tsx.
let loadIssue: { dropped: number; raw: string } | null = null;
export const getLoadIssue = () => loadIssue;
export const dismissLoadIssue = () => { loadIssue = null; };

// Loads the saved data. Called once, when the app starts.
export function boot() {
  let raw: string | null;
  try { raw = readKey(STORAGE_KEY); } catch {
    set({ data: freshState(), status: { kind: 'unavailable' } });
    bootNotice = "This browser isn't letting MyDay save, so changes won't be kept after closing.";
    return;
  }
  if (raw !== null) {
    lastSaved = raw;
    const r = parseSaved(raw, 'It was saved by a newer version of MyDay.');
    set('data' in r ? { data: r.data, status: { kind: 'ok' } } : { data: freshState(), status: { kind: 'damaged', raw, reason: r.reason } });
    if ('data' in r && r.dropped) loadIssue = { dropped: r.dropped, raw };
    return;
  }
  let older = false;
  try { older = OLDER_KEYS.some(k => readKey(k) !== null); } catch { /* treated as nothing saved */ }
  if (older) {
    // Moving older data to the current format is the current MyDay's job (with its own checks), so
    // this app doesn't save anything until that has happened. Saving here first would hide that data.
    set({ data: freshState(), status: { kind: 'older' } });
    return;
  }
  // Nothing saved yet: start fresh, as the current MyDay does.
  set({ data: freshState(), status: { kind: 'ok' } });
  persist(snapshot.data);
}

// A message to show once the app has started, if any.
export function takeBootNotice(): string {
  const m = bootNotice;
  bootNotice = '';
  return m;
}

// ---------- Saving ----------
// Did another tab (or the current MyDay) save since this tab last read or wrote?
function savedElsewhere(): boolean {
  try { const now = localStorage.getItem(STORAGE_KEY); return now !== null && lastSaved !== null && now !== lastSaved; }
  catch { return false; }
}

// Was this tab's last save replaced by another tab's save? (Unknowable after SAVE_LOG later saves.)
function lostMySave(saved: unknown): boolean {
  if (!mySave) return false;
  const saves = isObj(saved) && isObj(saved.saves) ? saved.saves : null;
  const log = saves && Array.isArray(saves.log) ? saves.log : [];
  const later = saves ? Number(saves.seq) - mySave.seq : 0;
  const lost = !log.includes(mySave.id) && !(later >= SAVE_LOG);
  mySave = null;
  return lost;
}

// Writes data, numbered and signed by this tab. Returns false if it couldn't be written.
function persist(data: MyDayData): boolean {
  if (snapshot.status.kind === 'unavailable') return false;
  try {
    const prev = isObj(data.saves) ? data.saves : { seq: 0, log: [] };
    const seq = prev.seq + 1, id = seq + '.' + TAB_ID;
    data.saves = { seq, log: prev.log.concat(id).slice(-SAVE_LOG) };
    const text = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, text);
    lastSaved = text;
    mySave = { seq, id };
    return true;
  } catch {
    toast("Couldn't save just now — storage may be full or blocked.");
    return false;
  }
}

// Change the data and save it. `change` gets a copy of the data to change; it may return false to
// mean "nothing changed", and then nothing is saved. Returns false if the change wasn't made.
export function update(change: (draft: MyDayData) => void | false): boolean {
  const st = snapshot.status.kind;
  if (st === 'damaged' || st === 'older') return false;
  if (savedElsewhere()) { reloadFromStorage(true); return false; } // keep the newer save; this change is not written
  const draft = structuredClone(snapshot.data);
  if (change(draft) === false) return false;
  persist(draft);
  set({ data: draft });
  return true;
}

// Replace everything (an import, or starting fresh after unreadable data). Saving starts again.
export function replaceAll(data: MyDayData): boolean {
  set({ data, status: snapshot.status.kind === 'unavailable' ? snapshot.status : { kind: 'ok' }, generation: snapshot.generation + 1 });
  if (snapshot.status.kind === 'unavailable') return true;
  return persist(snapshot.data);
}

// ---------- Another tab saved ----------
// Show what another tab saved instead of this tab's older data. `dropped` = a change here wasn't saved.
function reloadFromStorage(dropped: boolean) {
  let raw: string | null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch { return; }
  if (raw === null || raw === lastSaved) return;
  lastSaved = raw;
  let parsed: unknown = null;
  try { parsed = JSON.parse(raw); } catch { /* handled below */ }
  const lost = lostMySave(parsed);
  const newer = 'It was saved by a newer version of MyDay in another tab. Reload this page to use it.';
  const r = parseSaved(raw, newer);
  if ('data' in r) set({ data: r.data, status: { kind: 'ok' }, generation: snapshot.generation + 1 });
  else {
    const reason = r.reason === newer ? newer : "It was changed in another tab and can't be read here.";
    set({ data: freshState(), status: { kind: 'damaged', raw, reason }, generation: snapshot.generation + 1 });
  }
  setTimeout(() => toast(dropped && lost
    ? "Another tab replaced your recent changes here, and this last one wasn't saved. Showing the latest — please check and redo them."
    : dropped ? "MyDay was changed in another tab, so that last change wasn't saved. Showing the latest — please try it again."
    : lost ? 'Another tab replaced your last change here. Showing the latest — please check it and redo it if needed.'
    : 'Updated with changes from another tab.'), 0);
}

// Keeps this tab up to date with other tabs. Called once, when the app starts.
export function listenForOtherTabs() {
  window.addEventListener('storage', e => { if (e.key === STORAGE_KEY && savedElsewhere()) reloadFromStorage(false); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && savedElsewhere()) reloadFromStorage(false); });
  window.addEventListener('pageshow', e => { if (e.persisted && savedElsewhere()) reloadFromStorage(false); });
}

// ---------- Export and import ----------
// The whole of the saved data (every section, including any this version doesn't know) as a backup file.
export function exportText(): { filename: string; text: string } {
  const payload = { format: EXPORT_FORMAT, schemaVersion: SCHEMA_VERSION, exportedAt: localStamp(), data: snapshot.data };
  return { filename: `myday-export-${todayKey()}.json`, text: JSON.stringify(payload, null, 2) };
}

// Reads a backup made with "Export my data" (in either version). Throws an Error with a friendly message.
export function parseImport(text: string): { data: MyDayData; dropped: number; summary: string } {
  let obj: unknown;
  try { obj = JSON.parse(text); } catch { throw new Error("That file isn't readable JSON."); }
  if (!isObj(obj)) throw new Error("That file isn't a MyDay export.");
  if (obj.format !== EXPORT_FORMAT) {
    if (OLDER_KEYS.slice(2).some(k => k in obj)) throw new Error('That backup is from the first version of MyDay. Import it in the current MyDay instead.');
    throw new Error("That file isn't a MyDay export.");
  }
  const v = obj.schemaVersion as number;
  if (v > SCHEMA_VERSION) throw new Error('That file came from a newer version of MyDay.');
  if (![2, 3, 4].includes(v)) throw new Error("That file's version isn't supported.");
  const data = obj.data;
  if (!isObj(data) || data.schemaVersion !== v || !isObj(data.lists) || !isObj(data.days)) throw new Error('That file is missing parts MyDay needs.');
  const report = { dropped: 0 };
  const s = normalize(data, report);
  s.timer = null; // a running timer from another device doesn't make sense here
  const n = (x: number, word: string) => `${x} ${word}${x === 1 ? '' : 's'}`;
  const days = Object.keys(s.days).length;
  const summary = `It has ${days} day${days === 1 ? '' : 's'} of history, ${n(s.queue.length, 'queued task')}, ${n(CATS.reduce((a, c) => a + s.lists[c].length, 0), 'task')} in your lists and ${n(s.commitments.length, 'commitment')}.`;
  return { data: s, dropped: report.dropped, summary };
}

