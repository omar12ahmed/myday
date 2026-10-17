// Study → Reading: books you're reading, where you are in them, and your notes on each. Kept deliberately
// small — no shelves, ratings or wish lists. Reading never counts towards the learning streak.
import { isDateKey, todayKey } from './dates';
import type { Book, BookNote, ReadingData } from './types';
import { intIn, isObj, listOf, uid } from './util';

const str = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function emptyReading(): ReadingData {
  return { books: [] };
}

// Checks saved Reading data the way the rest of MyDay is checked: a book needs a title; pages are whole
// numbers in range (the current page never past the last); notes keep their page, text and day. Anything
// unreadable is dropped (and counted), never guessed.
export function normalizeReading(raw: unknown, report: { dropped: number }): ReadingData {
  const r: ReadingData = { ...(isObj(raw) ? raw : {}), books: [] };
  if (!isObj(raw)) return r;
  const seen = new Set<string>();
  for (const b of listOf(raw.books).slice(0, 200)) {
    if (!isObj(b) || !str(b.title)) { report.dropped++; continue; }
    const id = typeof b.id === 'string' && b.id && !seen.has(b.id) ? b.id : 'bk' + uid();
    seen.add(id);
    const pages = intIn(b.pages, 2, 50000, null);
    const page = Math.min(intIn(b.page, 0, 50000, 0), pages ?? 50000);
    const notes: BookNote[] = [];
    for (const n of listOf(b.notes).slice(0, 200)) {
      if (!isObj(n) || !str(n.text)) { report.dropped++; continue; }
      notes.push({
        id: typeof n.id === 'string' && n.id ? n.id : 'bn' + uid(),
        page: intIn(n.page, 1, pages ?? 50000, null), text: str(n.text, 2000),
        addedOn: isDateKey(n.addedOn) ? n.addedOn : todayKey(),
      });
    }
    r.books.push({
      id, title: str(b.title), author: str(b.author), pages, page, notes,
      addedOn: isDateKey(b.addedOn) ? b.addedOn : todayKey(),
      finishedOn: isDateKey(b.finishedOn) ? b.finishedOn : null,
    });
  }
  return r;
}

// ---------- Reading ----------
export const nowReading = (r: ReadingData) => r.books.filter(b => !b.finishedOn);
export const finishedBooks = (r: ReadingData) => r.books.filter(b => b.finishedOn).sort((a, b) => (a.finishedOn! < b.finishedOn! ? 1 : -1));
export const pctOf = (b: Book) => (b.pages ? Math.min(100, Math.round((b.page / b.pages) * 100)) : null);
export const bookById = (r: ReadingData, id: string) => r.books.find(b => b.id === id);
