import { Pin, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { Field, Select, TextArea, TextInput } from '../components/Field';
import { BackLink, Note } from '../components/parts';
import { shortDate } from '../data/dates';
import { editNote, INBOX, isBlank, NOTE_LIMITS, removeNote } from '../data/notes';
import { getSnapshot, update, updateSaved } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';

const PAUSE_MS = 600; // saved this long after you stop typing (and straight away when you leave the box or the app)

// One note. It's saved as you type (after a short pause), when you leave a box, and when you switch away from
// MyDay — so a thought isn't lost if the phone locks mid-sentence.
export function NoteEditor({ data, id }: { data: MyDayData; id: string }) {
  const confirm = useConfirm();
  const note = data.notes.items.find(n => n.id === id);
  const [draft, setDraft] = useState(() => (note ? { title: note.title, text: note.text } : { title: '', text: '' }));
  const [status, setStatus] = useState<'saved' | 'waiting' | 'failed'>('saved');
  const pending = useRef(false);
  const latest = useRef(draft);
  const timer = useRef<number | undefined>(undefined);
  latest.current = draft;

  function flush() {
    window.clearTimeout(timer.current);
    if (!pending.current) return;
    pending.current = false;
    const r = updateSaved(d => (editNote(d.notes, id, latest.current) ? undefined : false));
    setStatus(r === 'not-saved' ? 'failed' : 'saved');
  }
  function change(patch: Partial<typeof draft>) {
    setDraft(x => ({ ...x, ...patch }));
    pending.current = true;
    setStatus('waiting');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, PAUSE_MS);
  }
  // Save when you switch away (another app, the phone locking) and when you leave the note. An empty note is removed.
  useEffect(() => {
    const away = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', away);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', away);
      window.removeEventListener('pagehide', flush);
      flush();
      // Only once you've really left the note (React's development mode also takes a screen down and up again).
      if (location.hash === `#inbox/notes/${id}` || location.hash === `#notes/${id}`) return;
      const n = getSnapshot().data.notes.items.find(x => x.id === id);
      if (n && isBlank(n)) update(d => (removeNote(d.notes, id) ? undefined : false));
    };
    // flush reads refs only, so it's safe to keep the first one
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!note) {
    return (
      <>
        <BackLink to="inbox/notes" label="Notes" />
        <Card><h2>This note isn't here</h2><Note className="m-0">It may have been deleted, here or in another tab.</Note></Card>
      </>
    );
  }
  const known = data.notes.categories.some(c => c.id === note.categoryId);

  async function remove() {
    if (!(await confirm({ title: 'Delete this note?', body: 'This can\'t be undone (a backup made with "Export my data" still has it).', confirmLabel: 'Delete', cancelLabel: 'Keep it' }))) return;
    window.clearTimeout(timer.current);
    pending.current = false;
    if (update(d => (removeNote(d.notes, id) ? undefined : false))) toast('Note deleted.');
    location.hash = 'inbox/notes';
  }

  return (
    <>
      <BackLink to="inbox/notes" label="Notes" />
      <Card aria-label="Note" id="noteEditor">
        <div className="grid gap-3">
          <Field label="Where it's kept" htmlFor="noteCat">
            <Select id="noteCat" value={known ? note.categoryId : ''} onChange={e => { flush(); update(d => (editNote(d.notes, id, { categoryId: e.target.value }) ? undefined : false)); }}>
              <option value="">{INBOX}</option>
              {data.notes.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Title (optional)" htmlFor="noteTitle">
            <TextInput id="noteTitle" value={draft.title} maxLength={NOTE_LIMITS.title} onChange={e => change({ title: e.target.value })} onBlur={flush} />
          </Field>
          <Field label="Note" htmlFor="noteText">
            <TextArea id="noteText" rows={12} value={draft.text} maxLength={NOTE_LIMITS.text} onChange={e => change({ text: e.target.value })} onBlur={flush}
              autoFocus={!note.title && !note.text} placeholder="Write it down before it slips away…" />
          </Field>
        </div>
        <p className="text-sm m-0 mt-2 flex justify-between gap-2" aria-live="polite">
          <span className={status === 'failed' ? 'text-on-warn-c bg-warn-c rounded-tile px-2 py-0.5' : 'text-fg-3'} data-s="note-status">
            {status === 'failed' ? "Couldn't save just now (storage full, or changed in another tab) — your text is still here; try again." : status === 'waiting' ? 'Saving…' : 'Saved'}
          </span>
          <span className="text-fg-3 tabular-nums">Changed {shortDate(note.updatedAt.slice(0, 10))} {note.updatedAt.slice(11)}</span>
        </p>
        <div className="flex flex-wrap gap-2.5 mt-4">
          <Button inline variant={note.pinned ? 'selected' : 'tonal'} aria-pressed={note.pinned} data-action="note-pin"
            onClick={() => update(d => (editNote(d.notes, id, { pinned: !note.pinned }) ? undefined : false))}>
            <Pin size={18} aria-hidden="true" /> {note.pinned ? 'Pinned' : 'Pin to the top'}
          </Button>
          <Button inline variant="ghost" data-action="note-delete" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Delete</Button>
          {status === 'failed' && <Button inline data-action="note-retry" onClick={() => { pending.current = true; flush(); }}>Try saving again</Button>}
        </div>
      </Card>
    </>
  );
}
