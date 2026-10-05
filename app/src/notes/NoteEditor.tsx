import { Lock, Pin, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { Field, Select, TextArea, TextInput } from '../components/Field';
import { BackLink, Note } from '../components/parts';
import { shortDate } from '../data/dates';
import { editNote, INBOX, isBlank, NOTE_LIMITS, noteName, removeNote, setPrivate } from '../data/notes';
import { linkNote, projectById } from '../data/projects';
import { ProjectPicker } from '../projects/parts';
import { bothMention, keepLink, projectMatches, relatedNotes, unlink } from '../data/understand';
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
      if (location.hash === `#projects/notes/${id}` || location.hash === `#notes/${id}`) return;
      const n = getSnapshot().data.notes.items.find(x => x.id === id);
      if (n && isBlank(n)) update(d => (removeNote(d.notes, id) ? undefined : false));
    };
    // flush reads refs only, so it's safe to keep the first one
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!note) {
    return (
      <>
        <BackLink to="projects/notes" label="Notes" />
        <Card><h2>This note isn't here</h2><Note className="m-0">It may have been deleted, here or in another tab.</Note></Card>
      </>
    );
  }
  const known = data.notes.categories.some(c => c.id === note.categoryId), project = projectById(data, note.projectId);
  // Understanding it (data/understand.ts): a project it might belong in (when it isn't in one), and related notes.
  const maybe = !project ? projectMatches(data, note)[0] ?? null : null;
  const related = relatedNotes(data, note);

  async function remove() {
    if (!(await confirm({ title: 'Delete this note?', body: 'This can\'t be undone (a backup made with "Export my data" still has it).', confirmLabel: 'Delete', cancelLabel: 'Keep it' }))) return;
    window.clearTimeout(timer.current);
    pending.current = false;
    if (update(d => (removeNote(d.notes, id) ? undefined : false))) toast('Note deleted.');
    location.hash = project ? `projects/p/${project.id}` : 'projects/notes';
  }

  return (
    <>
      {project ? <BackLink to={`projects/p/${project.id}`} label={project.title} /> : <BackLink to="projects/notes" label="Notes" />}
      <Card aria-label="Note" id="noteEditor">
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Where it's kept" htmlFor="noteCat">
              <Select id="noteCat" value={known ? note.categoryId : ''} onChange={e => { flush(); update(d => (editNote(d.notes, id, { categoryId: e.target.value }) ? undefined : false)); }}>
                <option value="">{INBOX}</option>
                {data.notes.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <ProjectPicker data={data} id="noteProject" value={note.projectId} onPick={v => { flush(); if (update(d => (linkNote(d, id, v) ? undefined : false))) toast(v ? 'Added to the project.' : 'No longer in a project.'); }} />
          </div>
          {project && note.linkedBy && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-tile bg-primary-container text-on-primary-container pl-3 pr-1 py-1" data-s="note-linked">
              <Sparkles size={16} aria-hidden="true" className="flex-none" />
              <span className="flex-1 min-w-[12rem] text-[15px] py-1.5">MyDay connected this to “{project.title}”{note.linkWhy ? ` — ${bothMention(note.linkWhy)}` : ''}.</span>
              <span className="flex">
                <Button inline variant="ghost" className="!border-transparent !text-on-primary-container" data-action="note-link-keep" onClick={() => { if (update(d => (keepLink(d, id) ? undefined : false))) toast('Kept.'); }}>Keep</Button>
                <Button inline variant="ghost" className="!border-transparent !text-on-primary-container" data-action="note-link-undo" onClick={() => { flush(); if (update(d => (unlink(d, id) ? undefined : false))) toast('Taken out — MyDay won\'t put it back in that project.'); }}>Undo</Button>
              </span>
            </div>
          )}
          {maybe && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-tile bg-surface-2 border border-outline pl-3 pr-1 py-1" data-s="note-maybe">
              <span className="flex-1 min-w-[12rem] text-[15px] text-fg-2 py-1.5">{maybe.sure ? 'Looks like it belongs in' : 'Might belong in'} “{maybe.project.title}” — {bothMention(maybe.why)}.{maybe.sure ? ' MyDay will add it there once you leave this note.' : ''}</span>
              <Button inline variant="ghost" className="!border-transparent !text-primary" data-action="note-maybe-add" onClick={() => { flush(); if (update(d => (linkNote(d, id, maybe.project.id) ? undefined : false))) toast('Added to the project.'); }}>Add to it</Button>
            </div>
          )}
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
          <Button inline variant={note.private ? 'selected' : 'tonal'} aria-pressed={!!note.private} data-action="note-private"
            onClick={() => { flush(); if (update(d => (setPrivate(d.notes, id, !note.private) ? undefined : false))) toast(note.private ? 'No longer private.' : 'Private — AI help will never read this note.'); }}>
            <Lock size={18} aria-hidden="true" /> {note.private ? 'Private' : 'Keep private'}
          </Button>
          <Button inline variant="ghost" data-action="note-delete" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Delete</Button>
          {status === 'failed' && <Button inline data-action="note-retry" onClick={() => { pending.current = true; flush(); }}>Try saving again</Button>}
        </div>
        {note.private && <Note className="mb-0 mt-3">Private: AI help never reads this note. It's still saved to your account, like all your notes, so it's on your other devices.</Note>}
      </Card>
      {related.length > 0 && (
        <Card aria-labelledby="noteRelatedH" id="noteRelated">
          <h3 id="noteRelatedH">Related notes</h3>
          <ul className="list-none p-0 m-0">
            {related.map(r => (
              <li key={r.note.id} className="border-t border-outline first:border-t-0">
                <a href={`#projects/notes/${r.note.id}`} className="block min-h-11 py-2 text-fg no-underline hover:bg-surface-2 rounded-tile -mx-2 px-2" data-s="related-note" data-id={r.note.id}>
                  <span className="block font-medium break-words">{noteName(r.note)}</span>
                  <span className="block text-sm text-fg-3">{bothMention(r.why)}{projectById(data, r.note.projectId) ? ` · in “${projectById(data, r.note.projectId)!.title}”` : ''}</span>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
