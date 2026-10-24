// Attached files (specs/files.md): each file is one record here (its name, type, size, SHA-256, area and state), and
// a project or a note lists the ids of its files (`fileIds`), so one file can belong to several places without copies.
// The bytes live privately in R2, reached through the files Edge Function (sync/files.ts). Removing a file from a
// place takes its id out of that list; a file nothing lists any more waits in Recently deleted for 30 days (Put back,
// or Delete now), then goes for good. Never sent to AI.
import { KEEP_DELETED_DAYS } from '../../../supabase/functions/_shared/files/rules';
import { isDateKey, shift, todayKey } from './dates';
import { PORTFOLIO_FILES } from './cybersecurity/types';
import type { DateKey, FileRecord, FilesData, MyDayData } from './types';
import { isObj, listOf, uid } from './util';

export const FILE_ID = /^fl[a-z0-9]{6,40}$/;
export const FILES_PER_PLACE = 50;
export const newFileId = () => 'fl' + uid();
export type Owner = { kind: 'project' | 'note' | 'portfolio'; id: string }; // a portfolio entry: cybersecurity.portfolio
type Place = { kind: string; id: string }; // an Owner, or a place a newer MyDay knows (kept, never found here)
export const emptyFiles = (): FilesData => ({ items: [] });
// The areas whose files this version can list, and so judge. A file of another area (a newer MyDay's gallery, say)
// is left exactly as it is: never sent to Recently deleted, healed, settled or deleted for good here, since whatever
// lists it is unknown to this version. The same goes for a file that a newer MyDay lets another kind of place list
// (`listedIn`, e.g. a task listing a project's file): only removing it from a project or note here takes that link out.
// (A record from a newer MyDay in a shape this version doesn't read is still tidied by normalizeFiles: a bad hash,
// day, area or state is replaced.)
export const LISTED_AREAS: readonly string[] = ['project', 'note', 'portfolio'];
const PLACE_KINDS: readonly string[] = ['project', 'note', 'portfolio'];
const listedHere = (f: FileRecord) => LISTED_AREAS.includes(f.area) && !(Array.isArray(f.listedIn) && f.listedIn.some(k => !PLACE_KINDS.includes(String(k))));

// Reading saved file records: one without an id, a name, a type or a size is counted, never kept half-read. Fields from
// a newer MyDay are kept; a state this version doesn't know is kept as it is (and such a file isn't opened).
export function normalizeFiles(raw: unknown, report: { dropped: number }): FilesData {
  if (!isObj(raw)) return emptyFiles();
  const out: FilesData = { ...raw, items: [] };
  for (const f of listOf(raw.items)) {
    if (!isObj(f) || typeof f.id !== 'string' || !FILE_ID.test(f.id) || typeof f.name !== 'string' || !f.name || typeof f.type !== 'string' || !Number.isInteger(f.size) || (f.size as number) < 0) { report.dropped++; continue; }
    if (out.items.some(x => x.id === f.id)) { report.dropped++; continue; }
    const item: FileRecord = {
      ...f, id: f.id, name: f.name, type: f.type, size: f.size as number,
      sha256: typeof f.sha256 === 'string' && /^[0-9a-f]{64}$/.test(f.sha256) ? f.sha256 : '',
      area: typeof f.area === 'string' && f.area ? f.area : 'project',
      state: typeof f.state === 'string' && f.state ? f.state : 'kept',
      addedOn: isDateKey(f.addedOn) ? f.addedOn : todayKey(),
    };
    if (isDateKey(f.deletedOn)) item.deletedOn = f.deletedOn; else delete item.deletedOn;
    const rf = f.removedFrom;
    if (isObj(rf) && typeof rf.kind === 'string' && rf.kind && typeof rf.id === 'string' && rf.id) item.removedFrom = { ...rf, kind: rf.kind, id: rf.id }; else delete item.removedFrom;
    out.items.push(item);
  }
  return out;
}
// A place's list of file ids, read: kept only when there are some (unique, in order).
export function normalizeFileIds(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const ids = [...new Set(raw.filter((x): x is string => typeof x === 'string' && FILE_ID.test(x)))];
  return ids.length ? ids : null;
}

// ---------- Places ----------
const place = (d: MyDayData, o: Place) => (o.kind === 'project' ? d.projects.items.find(p => p.id === o.id) : o.kind === 'note' ? d.notes.items.find(n => n.id === o.id)
  : o.kind === 'portfolio' ? d.cybersecurity.portfolio?.find(e => e.id === o.id) : undefined);
// How many files a place keeps: a portfolio entry 5, a project or a note 50.
export const filesPerPlace = (o: Place) => (o.kind === 'portfolio' ? PORTFOLIO_FILES : FILES_PER_PLACE);
export const placeExists = (d: MyDayData, o: Place) => !!place(d, o);
export const fileIdsOf = (d: MyDayData, o: Place): string[] => place(d, o)?.fileIds ?? [];
// The files a place lists, in its order (a record that's missing is simply not shown).
export const filesOf = (d: MyDayData, o: Owner): FileRecord[] => fileIdsOf(d, o).flatMap(id => d.files.items.filter(f => f.id === id));
// Every place that lists a file.
export function usedBy(d: MyDayData, fileId: string): Owner[] {
  return [...d.projects.items.filter(p => p.fileIds?.includes(fileId)).map(p => ({ kind: 'project' as const, id: p.id })),
    ...d.notes.items.filter(n => n.fileIds?.includes(fileId)).map(n => ({ kind: 'note' as const, id: n.id })),
    ...(d.cybersecurity.portfolio ?? []).filter(e => e.fileIds?.includes(fileId)).map(e => ({ kind: 'portfolio' as const, id: e.id }))];
}
function setIds(d: MyDayData, o: Place, ids: string[]) {
  const p = place(d, o);
  if (!p) return false;
  if (ids.length) p.fileIds = ids; else delete p.fileIds;
  return true;
}

// ---------- Changes ----------
// A new file, being added: its record (state 'uploading', and when it started) and its place in the project or note.
// False when the place isn't there or already has 50 files.
export interface NewFile { id: string; name: string; type: string; size: number; sha256: string; area: string }
export function addFileRecord(d: MyDayData, o: Owner, rec: NewFile, k: DateKey = todayKey(), now = Date.now()): boolean {
  const ids = fileIdsOf(d, o);
  if (!place(d, o) || ids.length >= filesPerPlace(o) || d.files.items.some(f => f.id === rec.id)) return false;
  d.files.items.push({ ...rec, state: 'uploading', addedOn: k, startedAt: now });
  return setIds(d, o, [...ids, rec.id]);
}
export function setFileState(d: MyDayData, id: string, state: 'kept' | 'failed', size?: number): boolean {
  const f = d.files.items.find(x => x.id === id);
  if (!f || (f.state === state && (size === undefined || f.size === size))) return false;
  f.state = state;
  if (size !== undefined) f.size = size;
  return true;
}
// Take a file out of a place. If nothing else lists it, it goes to Recently deleted ('deleted'); otherwise only this
// link goes ('removed'). False when the place doesn't list it.
export function removeFile(d: MyDayData, fileId: string, from: Owner, k: DateKey = todayKey()): 'removed' | 'deleted' | false {
  const ids = fileIdsOf(d, from);
  if (!ids.includes(fileId)) return false;
  setIds(d, from, ids.filter(x => x !== fileId));
  const f = d.files.items.find(x => x.id === fileId);
  if (usedBy(d, fileId).length || (f && !listedHere(f))) return 'removed';
  if (f) { f.deletedOn = k; f.removedFrom = from; }
  return 'deleted';
}
// A file the server refused while it was being added: its record goes, and its id comes off the place it was added to.
export function dropAdded(d: MyDayData, fileId: string, from: Owner) {
  d.files.items = d.files.items.filter(f => f.id !== fileId);
  const ids = fileIdsOf(d, from);
  if (ids.includes(fileId)) setIds(d, from, ids.filter(x => x !== fileId));
}
// Put a file back where it was removed from. False when it isn't in Recently deleted, or that place is gone.
export function putBack(d: MyDayData, fileId: string): boolean {
  const f = d.files.items.find(x => x.id === fileId);
  if (!f?.deletedOn || !f.removedFrom || !place(d, f.removedFrom)) return false;
  const ids = fileIdsOf(d, f.removedFrom);
  if (ids.length >= filesPerPlace(f.removedFrom)) return false;
  setIds(d, f.removedFrom, ids.includes(fileId) ? ids : [...ids, fileId]);
  delete f.deletedOn; delete f.removedFrom;
  return true;
}
// Forget file records once their bytes are gone from R2 (Delete now, or after 30 days).
export function forgetFiles(d: MyDayData, ids: string[]): boolean {
  const before = d.files.items.length;
  d.files.items = d.files.items.filter(f => !ids.includes(f.id));
  return d.files.items.length !== before;
}

// ---------- Reading ----------
// In Recently deleted: a file nothing lists any more. One that a place still lists (two devices' changes crossing, say)
// is in that place, never in Recently deleted, and never goes for good; healFiles clears its mark.
const deleted = (d: MyDayData, f: FileRecord) => listedHere(f) && !!f.deletedOn && !usedBy(d, f.id).length;
// In Recently deleted from this place (or anywhere), newest first.
export const recentlyDeleted = (d: MyDayData, from?: Owner) => d.files.items.filter(f => deleted(d, f) && (!from || (f.removedFrom?.kind === from.kind && f.removedFrom.id === from.id)))
  .sort((a, b) => (b.deletedOn ?? '').localeCompare(a.deletedOn ?? ''));
export const goneOn = (f: FileRecord) => (f.deletedOn ? shift(f.deletedOn, KEEP_DELETED_DAYS) : null);
// Those whose 30 days are over: their bytes can go from R2, then their records.
export const dueForPurge = (d: MyDayData, k: DateKey = todayKey()) => d.files.items.filter(f => deleted(d, f) && f.deletedOn! <= shift(k, -KEEP_DELETED_DAYS));
// A file still being added an hour after it started (or since an earlier day) won't finish: the device adding it was
// closed or lost its connection. Its bytes may or may not have arrived; the tidy asks the server.
export const unfinished = (f: FileRecord, now = Date.now(), k: DateKey = todayKey()) => listedHere(f) && f.state === 'uploading'
  && (typeof f.startedAt === 'number' ? now - f.startedAt > 60 * 60 * 1000 : f.addedOn < k);
// A file nothing lists and that isn't in Recently deleted (e.g. its place was deleted on a device that didn't know
// files): it goes to Recently deleted from the day it's noticed, so nothing is ever lost silently. A file still being
// added is left alone.
export const orphans = (d: MyDayData) => d.files.items.filter(f => listedHere(f) && !f.deletedOn && f.state !== 'uploading' && !usedBy(d, f.id).length);
export function markOrphans(d: MyDayData, k: DateKey = todayKey()): boolean {
  const list = orphans(d);
  for (const f of list) f.deletedOn = k;
  return list.length > 0;
}
// A file a place lists is never in Recently deleted: clear the mark (and where it was removed from).
export function healFiles(d: MyDayData): boolean {
  let changed = false;
  for (const f of d.files.items) if (listedHere(f) && (f.deletedOn || f.removedFrom) && usedBy(d, f.id).length) { delete f.deletedOn; delete f.removedFrom; changed = true; }
  return changed;
}
// When a project or note is deleted: its files that nothing else lists go to Recently deleted (from that place).
export function filesLeaving(d: MyDayData, from: Owner, k: DateKey = todayKey()) {
  for (const id of fileIdsOf(d, from)) {
    const f = d.files.items.find(x => x.id === id);
    if (f && listedHere(f) && !f.deletedOn && usedBy(d, id).every(o => o.kind === from.kind && o.id === from.id)) { f.deletedOn = k; f.removedFrom = from; }
  }
}
export const sizeLabel = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
