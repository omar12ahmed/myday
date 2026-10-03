import { Pin, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { BackLink, Note } from '../components/parts';
import { localStamp, shortDate } from '../data/dates';
import { categoryName, noteName, notesView, strayCount } from '../data/notes';
import type { MyDayData } from '../data/types';
import { CategoriesView } from './CategoriesView';
import { NoteEditor } from './NoteEditor';
import { newNote, notesRoute } from './route';

export function NotesScreen({ data, hash }: { data: MyDayData; hash: string }) {
  const route = notesRoute(hash);
  if (route.view === 'note') return <div className="max-w-[720px] mx-auto"><NoteEditor key={route.id} data={data} id={route.id} /></div>;
  if (route.view === 'categories') return <div className="max-w-[720px] mx-auto"><CategoriesView data={data} /></div>;
  return <div className="max-w-[720px] mx-auto"><NotesList data={data} /></div>;
}

function NotesList({ data }: { data: MyDayData }) {
  const [cat, setCat] = useState<string | null>(null); // null = all; '' = notes whose category has gone ("Other")
  const [query, setQuery] = useState('');
  const d = data.notes;
  const shown = notesView(d, cat, query);
  const strays = strayCount(d);
  const count = (id: string | null) => notesView(d, id, '').length;
  const chip = (id: string | null, label: string) => (
    <Button key={id ?? 'all'} inline variant={cat === id ? 'selected' : 'ghost'} aria-pressed={cat === id} data-s="note-cat" data-id={id ?? 'all'}
      className="!min-h-11" onClick={() => setCat(id)}>{label} <span className="text-fg-3 tabular-nums">{count(id)}</span></Button>
  );
  const today = localStamp().slice(0, 10);

  return (
    <>
      <BackLink to="today" label="Today" />
      <Card aria-labelledby="notes-h">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h2 id="notes-h" className="m-0">Notes</h2>
          <Button inline variant="primary" data-action="note-new" onClick={() => newNote(cat || null)}><Plus size={18} aria-hidden="true" /> New note</Button>
        </div>
        <Field label="Search your notes" htmlFor="noteSearch" className="mt-3">
          <TextInput id="noteSearch" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="A word from the title or the note" />
        </Field>
        <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Show notes in">
          {chip(null, 'All')}
          {d.categories.map(c => chip(c.id, c.name))}
          {strays > 0 && chip('', 'Other')}
        </div>
        <a href="#notes/categories" className="inline-flex items-center min-h-11 text-primary font-semibold text-[15px] mt-1" data-action="note-categories">Edit categories</a>
      </Card>

      <Card aria-label="Your notes">
        {shown.length ? (
          <ul className="list-none p-0 m-0" id="noteList">
            {shown.map(n => (
              <li key={n.id} className="border-t border-outline first:border-t-0">
                <a href={`#notes/${n.id}`} className="note-row block py-3 min-h-11 text-fg no-underline hover:bg-surface-2 rounded-tile -mx-2 px-2" data-id={n.id}>
                  <span className="flex items-center gap-1.5 font-semibold leading-snug">
                    {n.pinned && <Pin size={15} aria-label="Pinned" className="text-primary flex-none" />}
                    <span className="min-w-0 break-words">{noteName(n)}</span>
                  </span>
                  {n.title.trim() && n.text.trim() && <span className="block text-[15px] text-fg-2 mt-0.5 line-clamp-2 break-words">{n.text.trim()}</span>}
                  <span className="block text-sm text-fg-3 mt-1">{categoryName(d, n.categoryId)} · {n.updatedAt.slice(0, 10) === today ? `today ${n.updatedAt.slice(11)}` : shortDate(n.updatedAt.slice(0, 10))}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <Note className="m-0" >{query.trim() ? `No notes match “${query.trim()}”.` : cat === null ? 'Nothing here yet. Notes you write go here, sorted by category.' : 'No notes in this category yet.'}</Note>
        )}
      </Card>
      <Note className="text-sm">Notes are kept on this device and included in "Export my data". They aren't synced between devices yet.</Note>
    </>
  );
}
