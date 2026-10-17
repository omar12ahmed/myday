import { BookOpen, Minus, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { Field, TextInput } from '../components/Field';
import { LinkButton, Meta, Note, Summary } from '../components/parts';
import { shortDate } from '../data/dates';
import { finishedBooks, nowReading, pctOf } from '../data/reading';
import type { Book, MyDayData } from '../data/types';
import { addBook, addNote, editBook, finishBook, removeBook, removeNote, reopenBook, setPage, stepPage } from './readingActions';
import { StudyTabs } from './StudyTabs';

// A note on a book: its page (if given), the text, and a way to remove it (asked first — it's your writing).
function NoteRow({ b, n }: { b: Book; n: Book['notes'][number] }) {
  const confirm = useConfirm();
  return (
    <div className="flex items-start gap-2.5 py-1.5 border-t border-dashed border-outline first-of-type:border-t-0">
      {n.page !== null && <span className="flex-none text-[11px] font-[800] text-primary bg-primary-container rounded-md px-2 py-0.5 tabular-nums mt-2.5">p. {n.page}</span>}
      <span className="min-w-0 flex-1 text-[15px] py-2">{n.text}</span>
      <button type="button" data-action="read-note-del" data-book={b.id} data-id={n.id} aria-label="Remove this note" className="flex-none inline-grid place-items-center min-w-11 min-h-11 text-fg-3 hover:text-fg cursor-pointer bg-transparent border-0"
        onClick={async () => { if (await confirm({ title: 'Remove this note?', body: n.text.length > 120 ? n.text.slice(0, 117) + '…' : n.text, confirmLabel: 'Remove' })) removeNote(b.id, n.id); }}><X size={16} /></button>
    </div>
  );
}

// Where you are: − / + a page at a time, or type the page you're on (saved when you leave the box or press Enter).
function PageControl({ b }: { b: Book }) {
  const [msg, setMsg] = useState<string | null>(null);
  const commit = (el: HTMLInputElement) => { const m = setPage(b.id, el.value); setMsg(m); if (m) el.value = String(b.page); };
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-fg-3" role="group" aria-label={`${b.title}: the page you're on`}>
        <span className="mr-0.5">page</span>
        <Button inline variant="ghost" className="!min-h-11 !min-w-11 !px-2.5" data-action="read-page" data-id={b.id} data-dir="-1" aria-label="One page back" disabled={b.page <= 0} onClick={() => stepPage(b.id, -1)}><Minus size={14} aria-hidden="true" /></Button>
        <TextInput key={b.page} type="number" inputMode="numeric" min={0} max={b.pages ?? 50000} defaultValue={b.page} data-f="read-page-at" data-id={b.id}
          aria-label={`Page you're on${b.pages ? `, of ${b.pages}` : ''}`} className="!w-[4.5rem] !min-h-11 !px-2 text-center font-bold tabular-nums"
          onBlur={e => commit(e.currentTarget)} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
        {b.pages !== null && <span className="text-fg-2 tabular-nums">of {b.pages}</span>}
        <Button inline variant="ghost" className="!min-h-11 !min-w-11 !px-2.5" data-action="read-page" data-id={b.id} data-dir="1" aria-label="One page on" disabled={b.pages !== null && b.page >= b.pages} onClick={() => stepPage(b.id, 1)}><Plus size={14} aria-hidden="true" /></Button>
      </div>
      {msg && <Note className="!text-[14px] mt-1 mb-0"><span role="alert">{msg}</span></Note>}
    </div>
  );
}

// A book's details, changed in place: title, author, total pages — or remove it (a mis-add), asked first.
function EditBook({ b, onDone }: { b: Book; onDone: () => void }) {
  const confirm = useConfirm();
  const titleRef = useRef<HTMLInputElement>(null), authorRef = useRef<HTMLInputElement>(null), pagesRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  function save() {
    const msg = editBook(b.id, titleRef.current?.value || '', authorRef.current?.value || '', pagesRef.current?.value || '');
    setError(msg);
    if (!msg) onDone();
  }
  return (
    <div className="mt-2" data-s="read-edit">
      <Field label="Title" htmlFor={`bkT-${b.id}`}><TextInput ref={titleRef} id={`bkT-${b.id}`} maxLength={120} defaultValue={b.title} /></Field>
      <div className="grid grid-cols-2 gap-2.5 mt-2.5">
        <Field label="Author (optional)" htmlFor={`bkA-${b.id}`}><TextInput ref={authorRef} id={`bkA-${b.id}`} maxLength={120} defaultValue={b.author} /></Field>
        <Field label="Total pages (optional)" htmlFor={`bkP-${b.id}`}><TextInput ref={pagesRef} id={`bkP-${b.id}`} type="number" inputMode="numeric" min={2} max={50000} defaultValue={b.pages ?? ''} /></Field>
      </div>
      {error && <Note className="!text-[14px] mt-2 mb-2"><span role="alert">{error}</span></Note>}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <Button variant="primary" data-action="read-edit-save" onClick={save}>Save</Button>
        <Button variant="ghost" data-action="read-edit-cancel" onClick={onDone}>Cancel</Button>
      </div>
      <LinkButton data-action="read-remove" data-id={b.id} className="text-sm mt-1"
        onClick={async () => { if (await confirm({ title: `Remove “${b.title}”?`, body: b.notes.length ? `Its ${b.notes.length === 1 ? 'note goes' : b.notes.length + ' notes go'} with it.` : 'It has no notes yet.', confirmLabel: 'Remove' })) removeBook(b.id); }}>Remove this book</LinkButton>
    </div>
  );
}

// One book being read: title and author, a slim bar when the total is known (no percentage — where you are is the
// page), the page control, its notes one tap away, Edit and Mark as finished.
function BookRow({ b, open, onToggle }: { b: Book; open: boolean; onToggle: () => void }) {
  const pct = pctOf(b);
  const pageRef = useRef<HTMLInputElement>(null), noteRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  function add() {
    const msg = addNote(b.id, pageRef.current?.value || '', noteRef.current?.value || '');
    setError(msg);
    if (!msg && noteRef.current) { noteRef.current.value = ''; if (pageRef.current) pageRef.current.value = ''; }
  }
  return (
    <div className="book-row py-3 border-t border-dashed border-outline first-of-type:border-t-0" data-id={b.id}>
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0"><div className="font-[800]">{b.title}</div>{b.author && <Meta>{b.author}</Meta>}</div>
        {!editing && <LinkButton data-action="read-edit" data-id={b.id} className="flex-none text-sm px-1" aria-label={`Edit ${b.title}`} onClick={() => setEditing(true)}>Edit</LinkButton>}
      </div>
      {editing ? <EditBook b={b} onDone={() => setEditing(false)} /> : <>
        {pct !== null && <div className="h-2 rounded-full bg-track overflow-hidden my-2" role="img" aria-label={`page ${b.page} of ${b.pages}`}><i className="block h-full rounded-full bg-primary" style={{ width: pct + '%' }} /></div>}
        <PageControl b={b} />
        <div className="flex items-center gap-x-4 flex-wrap">
          <LinkButton data-action="read-notes" data-id={b.id} aria-expanded={open} className="text-sm" onClick={onToggle}>notes{b.notes.length ? ` (${b.notes.length})` : ''}</LinkButton>
          <LinkButton data-action="read-finish" data-id={b.id} className="text-sm ml-auto" onClick={() => finishBook(b.id)}>Mark as finished</LinkButton>
        </div>
        {open && (
          <div className="mt-1">
            {b.notes.map(n => <NoteRow key={n.id} b={b} n={n} />)}
            {b.notes.length === 0 && <Note className="!text-[14px] my-1">No notes yet.</Note>}
            <div className="flex gap-2 mt-2 items-start">
              <TextInput ref={pageRef} data-f="read-note-page" type="number" inputMode="numeric" min={1} max={b.pages ?? 50000} placeholder="p." aria-label="Page (optional)" className="!w-20 flex-none" />
              <TextInput ref={noteRef} data-f="read-note-text" maxLength={2000} placeholder="Add a note…" aria-label="Note" onKeyDown={e => { if (e.key === 'Enter') add(); }} />
              <Button inline variant="primary" data-action="read-note-add" data-id={b.id} onClick={add}>Add</Button>
            </div>
            {error && <Note className="!text-[14px] mt-2 mb-0"><span role="alert">{error}</span></Note>}
          </div>
        )}
      </>}
    </div>
  );
}

// Study → Reading: the books you're reading, where you are, and your notes on each. Kept small on
// purpose — no shelves, ratings or wish lists. Reading never counts towards the learning streak.
export function ReadingView({ data }: { data: MyDayData }) {
  const confirm = useConfirm();
  const live = nowReading(data.reading), done = finishedBooks(data.reading);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openNotes, setOpenNotes] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null), authorRef = useRef<HTMLInputElement>(null), pagesRef = useRef<HTMLInputElement>(null);
  function add() {
    const msg = addBook(titleRef.current?.value || '', authorRef.current?.value || '', pagesRef.current?.value || '');
    setError(msg);
    if (!msg) setAdding(false);
  }
  return (
    <div>
      <StudyTabs on="reading" />
      <Card aria-labelledby="reading-h">
        <h2 id="reading-h">Now reading</h2>
        {live.length === 0 && !adding && (
          <Note className="mt-1">No books on the go. Add one — a title is all it needs; the author and total pages can come later.</Note>
        )}
        {live.map(b => <BookRow key={b.id} b={b} open={openNotes === b.id} onToggle={() => setOpenNotes(openNotes === b.id ? null : b.id)} />)}
        {adding ? (
          <div className="mt-3">
            <Field label="Title" htmlFor="bkTitle"><TextInput ref={titleRef} id="bkTitle" maxLength={120} placeholder="The Pragmatic Programmer" autoFocus /></Field>
            <div className="grid grid-cols-2 gap-2.5 mt-2.5">
              <Field label="Author (optional)" htmlFor="bkAuthor"><TextInput ref={authorRef} id="bkAuthor" maxLength={120} placeholder="Hunt & Thomas" /></Field>
              <Field label="Total pages (optional)" htmlFor="bkPages"><TextInput ref={pagesRef} id="bkPages" type="number" min={2} max={50000} placeholder="320" /></Field>
            </div>
            {error && <Note className="!text-[14px] mt-2 mb-2"><span role="alert">{error}</span></Note>}
            <div className="row2 grid grid-cols-2 gap-2.5 mt-3">
              <Button variant="primary" data-action="read-add-save" onClick={add}>Add</Button>
              <Button variant="ghost" data-action="read-add-cancel" onClick={() => { setAdding(false); setError(null); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" data-action="read-add" className="mt-2 border-dashed" onClick={() => setAdding(true)}><Plus size={16} aria-hidden="true" /> Add a book</Button>
        )}
      </Card>
      {done.length > 0 && (
        <Card aria-labelledby="read-fin-h">
          <details className="group" open={done.length <= 3}>
            <Summary><span id="read-fin-h" className="font-semibold">Finished ({done.length})</span></Summary>
            {done.map(b => (
              <div key={b.id} className="flex flex-wrap items-center gap-x-2.5 py-1.5 border-t border-dashed border-outline first-of-type:border-t-0">
                <span className="inline-grid place-items-center w-[22px] h-[22px] rounded-full bg-primary-container text-primary text-[13px] font-[800] flex-none" aria-hidden="true">✓</span>
                <span className="font-semibold text-fg-2 min-w-0">{b.title}</span>
                <Meta className="flex-none">{shortDate(b.finishedOn!)}</Meta>
                <span className="ml-auto flex-none flex gap-3">
                  <LinkButton data-action="read-reopen" data-id={b.id} className="text-sm" onClick={() => reopenBook(b.id)}>Read again</LinkButton>
                  <LinkButton data-action="read-remove" data-id={b.id} className="text-sm" onClick={async () => { if (await confirm({ title: `Remove “${b.title}”?`, body: 'Its notes go with it.', confirmLabel: 'Remove' })) removeBook(b.id); }}>Remove</LinkButton>
                </span>
              </div>
            ))}
          </details>
        </Card>
      )}
      <p className="text-[13px] text-fg-3 px-1 flex items-center gap-1.5"><BookOpen size={14} aria-hidden="true" /> Reading is its own quiet thing — it doesn't count towards your learning streak.</p>
    </div>
  );
}
