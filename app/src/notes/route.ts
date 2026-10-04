// Notes live in the Projects section (called the Inbox until 1.12.0): #projects/notes (the Notes home: search, Inbox,
// collections), #projects/notes/<id> (one note), #projects/notes/in/<collection id>, #projects/notes/collections.
// Older #inbox/notes… and #notes… links are rewritten to these (see shell/legacyLinks.ts).
import { addNote } from '../data/notes';
import { update } from '../data/storage';

export type NotesView = { view: 'home' } | { view: 'note'; id: string } | { view: 'collection'; id: string } | { view: 'collections' };
export function notesRoute(hash: string): NotesView {
  const parts = hash.replace('#', '').split('/').map(decodeURIComponent);
  const rest = parts[0] === 'notes' ? parts.slice(1) : parts[1] === 'notes' ? parts.slice(2) : [];
  if (rest[0] === 'categories' || rest[0] === 'collections') return { view: 'collections' };
  if (rest[0] === 'in' && rest[1]) return { view: 'collection', id: rest[1] };
  return rest[0] ? { view: 'note', id: rest[0] } : { view: 'home' };
}

// Make a new, empty note (in the Inbox, or a collection) and open it. A note left empty is removed when you leave it.
export function newNote(categoryId = '') {
  let id = '';
  update(d => { id = addNote(d.notes, categoryId); });
  if (id) location.hash = `projects/notes/${id}`;
}
