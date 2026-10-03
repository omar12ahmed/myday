// Notes, reached from Today (not in the bar): #notes (the list), #notes/<id> (one note), #notes/categories.
import { addNote } from '../data/notes';
import { update } from '../data/storage';

export function notesRoute(hash: string): { view: 'list' | 'note' | 'categories'; id: string } {
  const parts = hash.replace('#', '').split('/').map(decodeURIComponent);
  if (parts[1] === 'categories') return { view: 'categories', id: '' };
  return parts[1] ? { view: 'note', id: parts[1] } : { view: 'list', id: '' };
}

// Make a new, empty note (in that category, or the first one) and open it. A note left empty is removed when you
// leave it, so trying "New note" leaves nothing behind.
export function newNote(categoryId?: string | null) {
  let id = '';
  update(d => { const cat = categoryId ?? d.notes.categories[0]?.id ?? ''; id = addNote(d.notes, cat); });
  if (id) location.hash = `notes/${id}`;
}
