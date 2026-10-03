import { NotebookPen } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { noteName } from '../data/notes';
import type { MyDayData } from '../data/types';
import { newNote } from '../notes/route';

// Notes on Today: jot something down straight away, or open them all. The most recent note is shown so you can
// pick up where you left off.
export function NotesCard({ data }: { data: MyDayData }) {
  const items = data.notes.items;
  const latest = items.length ? items.reduce((a, b) => (b.updatedAt > a.updatedAt ? b : a)) : null;
  return (
    <Card aria-labelledby="notes-card-h" id="notesCard">
      <h3 id="notes-card-h" className="flex items-center gap-2"><NotebookPen size={18} aria-hidden="true" className="text-primary" /> Notes</h3>
      <p className="text-[15px] text-fg-2 m-0">
        {latest ? <>Latest: <a href={`#notes/${latest.id}`} className="text-primary font-semibold">{noteName(latest)}</a> · {items.length} note{items.length === 1 ? '' : 's'}</> : 'Somewhere for ideas and thoughts, sorted by category.'}
      </p>
      <div className="flex flex-wrap gap-2.5 mt-3">
        <Button inline data-action="note-new" onClick={() => newNote()}>New note</Button>
        <Button inline variant="ghost" data-action="notes-open" onClick={() => { location.hash = 'notes'; }}>All notes</Button>
      </div>
    </Card>
  );
}
