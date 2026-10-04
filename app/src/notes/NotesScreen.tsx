import { Pin, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, Select, TextInput } from '../components/Field';
import { BackLink, Note } from '../components/parts';
import { localStamp, shortDate } from '../data/dates';
import { categoryName, fileNote, INBOX, inInbox, noteName, notesView } from '../data/notes';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData, Note as NoteT, NotesData } from '../data/types';
import { suggestCollection } from '../capture/parse';
import { CategoriesView } from './CategoriesView';
import { NoteEditor } from './NoteEditor';
import { newNote, notesRoute } from './route';

// Notes: an Inbox you can dump anything into (nothing has to be filed), collections to file things in later if you
// like, and a search across everything.
export function NotesScreen({ data, hash }: { data: MyDayData; hash: string }) {
  const route = notesRoute(hash);
  if (route.view === 'note') return <NoteEditor key={route.id} data={data} id={route.id} />;
  if (route.view === 'collections') return <CategoriesView data={data} />;
  if (route.view === 'collection') return <CollectionView data={data} id={route.id} />;
  return <NotesHome data={data} />;
}

function move(d: NotesData, n: NoteT, to: string) {
  if (update(x => (fileNote(x.notes, n.id, to) ? undefined : false))) toast(to ? `Filed in “${categoryName(d, to)}”.` : 'Back in your Inbox.');
}

// One note in a list: its name, the start of its text, where it is and when it changed — and, in the Inbox, where it
// might go.
function NoteRow({ d, n, where, filing }: { d: NotesData; n: NoteT; where: boolean; filing: boolean }) {
  const today = localStamp().slice(0, 10);
  const hint = filing ? suggestCollection(`${n.title} ${n.text}`, d.categories) : null;
  return (
    <li className="note-li border-t border-outline first:border-t-0 py-2" data-id={n.id}>
      <a href={`#inbox/notes/${n.id}`} className="note-row block py-1 min-h-11 text-fg no-underline hover:bg-surface-2 rounded-tile -mx-2 px-2" data-id={n.id}>
        <span className="flex items-center gap-1.5 font-semibold leading-snug">
          {n.pinned && <Pin size={15} aria-label="Pinned" className="text-primary flex-none" />}
          <span className="min-w-0 break-words">{noteName(n)}</span>
        </span>
        {n.title.trim() && n.text.trim() && <span className="block text-[15px] text-fg-2 mt-0.5 line-clamp-2 break-words">{n.text.trim()}</span>}
        <span className="block text-sm text-fg-3 mt-1">{where ? `${categoryName(d, n.categoryId)} · ` : ''}{n.updatedAt.slice(0, 10) === today ? `today ${n.updatedAt.slice(11)}` : shortDate(n.updatedAt.slice(0, 10))}</span>
      </a>
      {filing && d.categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {hint && <Button inline data-action="note-file" data-id={n.id} data-to={hint} onClick={() => move(d, n, hint)}>File in {categoryName(d, hint)}</Button>}
          <Select aria-label={`Move “${noteName(n)}” to`} data-s="note-move" data-id={n.id} value="" className="!w-auto" onChange={e => e.target.value !== '' && move(d, n, e.target.value === '-' ? '' : e.target.value)}>
            <option value="">{hint ? 'Somewhere else…' : 'File it…'}</option>
            {!inInbox(d, n) && <option value="-">Back to the Inbox</option>}
            {d.categories.filter(c => c.id !== n.categoryId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      )}
    </li>
  );
}

function NotesHome({ data }: { data: MyDayData }) {
  const [query, setQuery] = useState('');
  const d = data.notes;
  const found = query.trim() ? notesView(d, null, query) : null;
  const inbox = notesView(d, '', '');
  return (
    <>
      <Card aria-labelledby="notes-h">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h2 id="notes-h" className="m-0">Notes</h2>
          <Button inline variant="primary" data-action="note-new" onClick={() => newNote()}><Plus size={18} aria-hidden="true" /> New note</Button>
        </div>
        <Field label="Search all your notes" htmlFor="noteSearch" className="mt-3">
          <TextInput id="noteSearch" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="A word from a note" />
        </Field>
      </Card>

      {found ? (
        <Card aria-label="Search results" id="noteResults">
          {found.length ? <ul className="list-none p-0 m-0">{found.map(n => <NoteRow key={n.id} d={d} n={n} where filing={false} />)}</ul>
            : <Note className="m-0">No notes match “{query.trim()}”.</Note>}
        </Card>
      ) : (
        <>
          <Card aria-labelledby="inbox-h" id="noteInbox">
            <h3 id="inbox-h" className="flex items-center gap-2">{INBOX} <span className="text-fg-3 font-normal tabular-nums">{inbox.length}</span></h3>
            {inbox.length ? <ul className="list-none p-0 m-0" id="noteList">{inbox.map(n => <NoteRow key={n.id} d={d} n={n} where={false} filing />)}</ul>
              : <Note className="m-0">{d.items.length ? 'Your Inbox is clear.' : 'Anything you jot down lands here first — no need to file it. Use + to capture from any screen.'}</Note>}
          </Card>
          <Card aria-labelledby="cols-h" id="noteCollections">
            <h3 id="cols-h">Collections</h3>
            {d.categories.length ? (
              <ul className="list-none p-0 m-0">
                {d.categories.map(c => (
                  <li key={c.id} className="border-t border-outline first:border-t-0">
                    <a href={`#inbox/notes/in/${c.id}`} className="ncol-row flex justify-between items-center min-h-11 py-2 text-fg no-underline" data-id={c.id}>
                      <span className="font-medium">{c.name}</span><span className="text-fg-3 tabular-nums">{notesView(d, c.id, '').length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : <Note className="m-0">No collections yet.</Note>}
            <a href="#inbox/notes/collections" className="inline-flex items-center min-h-11 text-primary font-semibold text-[15px] mt-1" data-action="note-categories">Edit collections</a>
          </Card>
        </>
      )}
      <Note className="text-sm">Notes are kept on this device and included in "Export my data". They aren't synced between devices yet.</Note>
    </>
  );
}

function CollectionView({ data, id }: { data: MyDayData; id: string }) {
  const d = data.notes, c = d.categories.find(x => x.id === id);
  if (!c) return <><BackLink to="inbox" label="Notes" /><Card><h2>This collection isn't here</h2><Note className="m-0">It may have been removed; its notes are in your Inbox.</Note></Card></>;
  const list = notesView(d, id, '');
  return (
    <>
      <BackLink to="inbox" label="Notes" />
      <Card aria-labelledby="col-h" id="noteCollection">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h2 id="col-h" className="m-0">{c.name}</h2>
          <Button inline data-action="note-new" onClick={() => newNote(id)}><Plus size={18} aria-hidden="true" /> New note here</Button>
        </div>
        {list.length ? <ul className="list-none p-0 m-0 mt-2" id="noteList">{list.map(n => <NoteRow key={n.id} d={d} n={n} where={false} filing />)}</ul>
          : <Note className="mb-0">Nothing here yet.</Note>}
      </Card>
    </>
  );
}
