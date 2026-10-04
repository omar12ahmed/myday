// Notes: what's in them, how they're read from saved data, and every change to them. Only the new app shows Notes;
// the classic MyDay keeps this section exactly as it is (it keeps any section it doesn't know). Notes sync with
// your account one by one (see sync/records.ts) and are included in "Export my data".
//
// A note without a collection is in the Inbox: you never have to file anything. Collections ("categories" in the
// saved data) are optional places to file notes later; a note whose collection has gone is back in the Inbox.
import { isDateTime, localStamp } from './dates';
import type { Note, NoteCategory, NotesData } from './types';
import { isObj, listOf, uid } from './util';

export const NOTE_LIMITS = { categories: 30, categoryName: 40, title: 120, text: 20000 };
export const DEFAULT_CATEGORIES = ['Lifestyle', 'Business ideas', 'Health & fitness', 'Money', 'Study & career', 'Personal'];
export const INBOX = 'Inbox'; // notes with no collection (or one that's gone)

export function emptyNotes(): NotesData {
  return { categories: DEFAULT_CATEGORIES.map(name => ({ id: 'nc' + uid(), name })), items: [] };
}

// Reading saved notes: anything unreadable is counted (never dropped silently); unknown fields are kept.
export function normalizeNotes(raw: unknown, report: { dropped: number }): NotesData {
  if (!isObj(raw)) return emptyNotes();
  const out: NotesData = { ...raw, categories: [], items: [] };
  const seenC = new Set<string>();
  for (const c of listOf(raw.categories)) {
    if (!isObj(c) || typeof c.id !== 'string' || typeof c.name !== 'string' || !c.name.trim()) { report.dropped++; continue; }
    const cat: NoteCategory = { ...c, id: seenC.has(c.id) ? 'nc' + uid() : c.id, name: c.name.slice(0, NOTE_LIMITS.categoryName) };
    seenC.add(cat.id);
    out.categories.push(cat);
  }
  const seenN = new Set<string>();
  for (const n of listOf(raw.items)) {
    if (!isObj(n) || typeof n.id !== 'string') { report.dropped++; continue; }
    const now = localStamp();
    const note: Note = {
      ...n,
      id: seenN.has(n.id) ? 'nt' + uid() : n.id,
      categoryId: typeof n.categoryId === 'string' ? n.categoryId : '',
      title: typeof n.title === 'string' ? n.title.slice(0, NOTE_LIMITS.title) : '',
      text: typeof n.text === 'string' ? n.text.slice(0, NOTE_LIMITS.text) : '',
      pinned: n.pinned === true,
      createdAt: isDateTime(n.createdAt) ? n.createdAt : now,
      updatedAt: isDateTime(n.updatedAt) ? n.updatedAt : isDateTime(n.createdAt) ? n.createdAt : now,
    };
    if (typeof note.projectId !== 'string' || !note.projectId) delete note.projectId; // a project link (1.12.0), or none
    seenN.add(note.id);
    out.items.push(note);
  }
  return out;
}

// ---------- Reading ----------
export const isBlank = (n: Note) => !n.title.trim() && !n.text.trim();
// A note's name in lists: its title, otherwise its first line.
export const noteName = (n: Note) => n.title.trim() || n.text.trim().split('\n')[0].slice(0, 80) || 'Untitled note';
export const categoryName = (d: NotesData, id: string) => d.categories.find(c => c.id === id)?.name ?? INBOX;
export const inInbox = (d: NotesData, n: Note) => !d.categories.some(c => c.id === n.categoryId);

// The notes to show: in one collection, the Inbox ('') or all (null), matching a search (title or text, any case),
// pinned first, then the most recently changed.
export function notesView(d: NotesData, categoryId: string | null, query: string): Note[] {
  const q = query.trim().toLowerCase();
  const known = new Set(d.categories.map(c => c.id));
  return d.items
    .filter(n => categoryId === null || (categoryId === '' ? !known.has(n.categoryId) : n.categoryId === categoryId))
    .filter(n => !q || n.title.toLowerCase().includes(q) || n.text.toLowerCase().includes(q))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}
export const inboxCount = (d: NotesData) => { const known = new Set(d.categories.map(c => c.id)); return d.items.filter(n => !known.has(n.categoryId)).length; };

// ---------- Changes (each used inside update(), so it goes through the checked save path) ----------
// A new note — in the Inbox unless a collection is given.
export function addNote(d: NotesData, categoryId = '', text = ''): string {
  const id = 'nt' + uid(), now = localStamp();
  d.items.push({ id, categoryId, title: '', text: text.slice(0, NOTE_LIMITS.text), pinned: false, createdAt: now, updatedAt: now });
  return id;
}
// Filing a note in a collection (or back to the Inbox, '') — not counted as changing the note.
export function fileNote(d: NotesData, id: string, categoryId: string): boolean {
  const n = d.items.find(x => x.id === id);
  if (!n || n.categoryId === categoryId) return false;
  n.categoryId = categoryId;
  return true;
}
// Returns false if nothing changed (so nothing is saved).
export function editNote(d: NotesData, id: string, patch: Partial<Pick<Note, 'title' | 'text' | 'categoryId' | 'pinned'>>): boolean {
  const n = d.items.find(x => x.id === id);
  if (!n) return false;
  const next = {
    title: patch.title !== undefined ? patch.title.slice(0, NOTE_LIMITS.title) : n.title,
    text: patch.text !== undefined ? patch.text.slice(0, NOTE_LIMITS.text) : n.text,
    categoryId: patch.categoryId ?? n.categoryId,
    pinned: patch.pinned ?? n.pinned,
  };
  if (next.title === n.title && next.text === n.text && next.categoryId === n.categoryId && next.pinned === n.pinned) return false;
  const wordsSame = next.title === n.title && next.text === n.text;
  Object.assign(n, next);
  if (!wordsSame) n.updatedAt = localStamp(); // pinning or filing doesn't count as changing the note
  return true;
}
export function removeNote(d: NotesData, id: string): boolean {
  const i = d.items.findIndex(x => x.id === id);
  if (i < 0) return false;
  d.items.splice(i, 1);
  return true;
}

export function addCategory(d: NotesData, name: string): string | null {
  const clean = name.trim().slice(0, NOTE_LIMITS.categoryName);
  if (!clean || d.categories.length >= NOTE_LIMITS.categories) return null;
  if (d.categories.some(c => c.name.toLowerCase() === clean.toLowerCase())) return null;
  const id = 'nc' + uid();
  d.categories.push({ id, name: clean });
  return id;
}
export function renameCategory(d: NotesData, id: string, name: string): boolean {
  const c = d.categories.find(x => x.id === id), clean = name.trim().slice(0, NOTE_LIMITS.categoryName);
  if (!c || !clean || clean === c.name) return false;
  if (d.categories.some(x => x.id !== id && x.name.toLowerCase() === clean.toLowerCase())) return false;
  c.name = clean;
  return true;
}
export function moveCategory(d: NotesData, id: string, dir: -1 | 1): boolean {
  const i = d.categories.findIndex(c => c.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= d.categories.length) return false;
  [d.categories[i], d.categories[j]] = [d.categories[j], d.categories[i]];
  return true;
}
// Removing a collection never removes notes: its notes go back to the Inbox.
export function removeCategory(d: NotesData, id: string): { removed: boolean; moved: number } {
  const i = d.categories.findIndex(c => c.id === id);
  if (i < 0) return { removed: false, moved: 0 };
  const notes = d.items.filter(n => n.categoryId === id);
  d.categories.splice(i, 1);
  for (const n of notes) n.categoryId = '';
  return { removed: true, moved: notes.length };
}
