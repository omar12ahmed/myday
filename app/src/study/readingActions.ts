// What the Reading tab's buttons do (Study → Reading): each one changes saved data through the store
// (storage.ts update()). Reaching the last page finishes the book; a finished book can be reopened.
import { todayKey } from '../data/dates';
import { bookById } from '../data/reading';
import { getSnapshot, update } from '../data/storage';
import { toast } from '../data/toast';
import type { ReadingData } from '../data/types';
import { intIn, uid } from '../data/util';

const R = () => getSnapshot().data.reading;
function withReading(fn: (r: ReadingData) => void | false) { return update(dr => fn(dr.reading)); }
function withBook(id: string, fn: (b: NonNullable<ReturnType<typeof bookById>>, r: ReadingData) => void | false) {
  return withReading(r => { const b = bookById(r, id); if (!b) return false; return fn(b, r); });
}

// Adds a book (a title is required; the author and total pages can come later — or never). Returns a
// message if it can't.
export function addBook(title: string, author: string, pages: string): string | null {
  const t = title.trim();
  if (!t) return 'Please give the book a title.';
  if (R().books.some(b => b.title.toLowerCase() === t.toLowerCase())) return 'That book is already on your reading list.';
  const p = intIn(pages, 2, 50000, null);
  if (pages.trim() && p === null) return 'Total pages should be a whole number (or leave it empty).';
  withReading(r => { r.books.push({ id: 'bk' + uid(), title: t.slice(0, 120), author: author.trim().slice(0, 120), pages: p, page: 0, notes: [], addedOn: todayKey(), finishedOn: null }); });
  toast(`“${t.slice(0, 60)}” added — happy reading.`);
  return null;
}

// The page stepper: one page at a time, never below 0 and never past the last page. Reaching the last
// page finishes the book (it folds away with a tick).
export function stepPage(id: string, dir: 1 | -1) {
  let finished: string | null = null;
  withBook(id, b => {
    if (b.finishedOn) return false;
    const next = Math.min(Math.max(0, b.page + dir), b.pages ?? 50000);
    if (next === b.page) return false;
    b.page = next;
    if (b.pages && b.page >= b.pages) { b.finishedOn = todayKey(); finished = b.title; }
  });
  if (finished) toast(`Finished “${finished}” — nice. It's shelved below.`);
}

// Marks a book finished yourself (for a book with no total pages, or one you stopped early — that's fine).
export function finishBook(id: string) {
  let title = '';
  if (!withBook(id, b => { if (b.finishedOn) return false; b.finishedOn = todayKey(); title = b.title; })) return;
  toast(`Finished “${title}” — shelved below.`);
}

// A finished book you're reading again (or marked finished by mistake).
export function reopenBook(id: string) {
  if (!withBook(id, b => { if (!b.finishedOn) return false; b.finishedOn = null; if (b.pages && b.page >= b.pages) b.page = b.pages - 1; })) return;
  toast('Back on your reading list.');
}

// Removes a book and its notes (the screen asks first).
export function removeBook(id: string) {
  let title = '';
  if (!withReading(r => { const b = bookById(r, id); if (!b) return false; title = b.title; r.books = r.books.filter(x => x.id !== id); })) return;
  toast(`“${title}” removed, notes and all.`);
}

// A note on the book you're reading: the page is optional. Returns a message if it can't.
export function addNote(bookId: string, page: string, text: string): string | null {
  const t = text.trim();
  if (!t) return 'Please write the note first.';
  const b = bookById(R(), bookId);
  const p = intIn(page, 1, b?.pages ?? 50000, null);
  if (page.trim() && p === null) return 'The page should be a whole number (or leave it empty).';
  let ok = false;
  withBook(bookId, bb => { bb.notes.push({ id: 'bn' + uid(), page: p, text: t.slice(0, 2000), addedOn: todayKey() }); ok = true; });
  return ok ? null : 'Couldn\'t save just now.';
}

export function removeNote(bookId: string, noteId: string) {
  withBook(bookId, b => { if (!b.notes.some(n => n.id === noteId)) return false; b.notes = b.notes.filter(n => n.id !== noteId); });
}
