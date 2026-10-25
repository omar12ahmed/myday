import { useEffect, useRef, useState, useSyncExternalStore, type DragEvent } from 'react';
import { amountLabel, FILE_TYPES, PREVIEWABLE } from '../../../supabase/functions/_shared/files/rules';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { LinkButton, Note } from '../components/parts';
import { shortDate } from '../data/dates';
import { filesOf, goneOn, placeExists, putBack, recentlyDeleted, removeFile, sizeLabel, unfinished, type Owner } from '../data/files';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { FileRecord, MyDayData } from '../data/types';
import { useSync } from '../sync/engine';
import { addFiles, canRetry, checkUnlisted, deleteNow, deleteUnlisted, getProgress, getUnlisted, getUsage, linkTo, openFile, refreshUsage, retry, subscribeFiles, WHY, type FilesResult } from '../sync/files';

// "Files" (specs/files.md): the files attached to a project (a card on its Overview) or a note (a section in its
// editor). Add (or drop) photos, PDFs and documents; Open; Remove (to Recently deleted for 30 days, unless something else
// still uses the file); Put back or Delete now. The bytes are in R2; opening needs a connection. Never sent to AI.

const ACCEPT = Object.values(FILE_TYPES).flatMap(t => t.ext.map(e => '.' + e)).join(',');
const why = (r: FilesResult) => (r === 'ok' ? '' : WHY[r]);

function Preview({ f }: { f: FileRecord }) {
  const [url, setUrl] = useState<string | null>(null);
  const canPreview = f.state === 'kept' && PREVIEWABLE.includes(f.type);
  useEffect(() => {
    if (!canPreview) return;
    let live = true;
    linkTo(f, true).then(r => { if (live && r.ok) setUrl(r.url); });
    return () => { live = false; };
  }, [f, canPreview]);
  return url ? <img src={url} alt="" className="w-12 h-12 rounded-tile object-cover flex-none bg-surface-2" onError={() => setUrl(null)} />
    : <span className="w-12 h-12 rounded-tile flex-none grid place-items-center bg-surface-2 text-[11px] font-bold text-fg-2 uppercase" aria-hidden="true">{FILE_TYPES[f.type]?.label ?? 'File'}</span>;
}

function FileRow({ f, owner }: { f: FileRecord; owner: Owner }) {
  const progress = useSyncExternalStore(subscribeFiles, getProgress).get(f.id);
  const label = FILE_TYPES[f.type]?.label ?? 'File';
  async function open() { const r = await openFile(f); if (r !== 'ok') toast(why(r)); }
  function remove() {
    let r = false as ReturnType<typeof removeFile>;
    if (update(d => { r = removeFile(d, f.id, owner); return r ? undefined : false; }))
      toast(r === 'removed' ? 'Removed from here — it’s still used elsewhere.' : 'Removed — it’s in Recently deleted for 30 days.');
  }
  const status = f.state === 'uploading' ? (progress?.state === 'adding' ? 'Adding…' : unfinished(f) ? 'It wasn’t finished.' : 'Still being added.')
    : f.state === 'failed' ? (progress?.message || 'It couldn’t be added.') : `${label} · ${sizeLabel(f.size)}`;
  return (
    <li className="flex items-start gap-3 border-t border-outline first:border-t-0 py-2" data-s="file" data-id={f.id} data-state={f.state}>
      <Preview f={f} />
      <div className="min-w-0 flex-1">
        <span className="block font-medium break-words">{f.name}</span>
        <span className={`block text-sm ${f.state === 'failed' ? 'text-on-warn-c' : 'text-fg-3'}`} data-s="file-status">{status}</span>
        <div className="flex flex-wrap gap-x-5">
          {f.state === 'kept' && <LinkButton className="text-[15px]" data-action="file-open" aria-label={`Open “${f.name}”`} onClick={open}>Open</LinkButton>}
          {f.state === 'failed' && canRetry(f.id) && <LinkButton className="text-[15px]" data-action="file-retry" onClick={() => { void retry(f.id).then(r => { if (r.refused) toast(`${f.name}: ${r.refused}`); }); }}>Try again</LinkButton>}
          {(f.state !== 'uploading' || progress?.state !== 'adding') && <LinkButton className="text-[15px]" data-action="file-remove" aria-label={`Remove “${f.name}”`} onClick={remove}>Remove</LinkButton>}
        </div>
      </div>
    </li>
  );
}

// Recently deleted: Put back (unless its place is gone: the Projects home's list) and Delete now.
export function DeletedFiles({ list, putBackable = true }: { list: FileRecord[]; putBackable?: boolean }) {
  const confirm = useConfirm();
  if (!list.length) return null;
  async function now(f: FileRecord) {
    if (!(await confirm({ title: `Delete “${f.name}” for good?`, body: 'It can’t be brought back.', confirmLabel: 'Delete for good', cancelLabel: 'Keep it' }))) return;
    const r = await deleteNow([f]);
    toast(r === 'ok' ? 'Deleted for good.' : why(r));
  }
  return (
    <details className="mt-3" data-s="files-deleted">
      <summary className="cursor-pointer min-h-11 flex items-center text-primary font-semibold text-[15px]">Recently deleted ({list.length})</summary>
      <ul className="list-none p-0 m-0">{list.map(f => (
        <li key={f.id} className="border-t border-outline first:border-t-0 py-2" data-s="file-deleted" data-id={f.id}>
          <span className="block font-medium break-words">{f.name}</span>
          <span className="block text-sm text-fg-3">Goes for good on {shortDate(goneOn(f)!)}</span>
          <div className="flex flex-wrap gap-x-5">
            {putBackable && f.removedFrom && <LinkButton className="text-[15px]" data-action="file-put-back" onClick={() => { if (update(d => (putBack(d, f.id) ? undefined : false))) toast('Put back.'); else toast('It can’t go back there — that place is gone.'); }}>Put back</LinkButton>}
            <LinkButton className="text-[15px]" data-action="file-delete-now" onClick={() => now(f)}>Delete now</LinkButton>
          </div>
        </li>))}
      </ul>
    </details>
  );
}

// How much of your storage is used and what's left (every file of the account, so the same on every card). Shown
// once the files function has said (signed in, online); files in Recently deleted are still stored until they go.
// Last in the card, so its arriving late never moves what's above it. Used and left are rounded down.
function StorageLine({ anyDeleted }: { anyDeleted: boolean }) {
  const u = useSyncExternalStore(subscribeFiles, getUsage), account = useSync().account, extra = useSyncExternalStore(subscribeFiles, getUnlisted);
  const confirm = useConfirm();
  useEffect(() => { void refreshUsage(); void checkUnlisted(); }, [account?.id]);
  async function clearExtra() {
    const n = extra?.length ?? 0, size = amountLabel((extra ?? []).reduce((t, f) => t + f.size, 0));
    if (!n || !(await confirm({ title: `Delete ${n} stored file${n === 1 ? '' : 's'} nothing in your MyDay lists?`,
      body: `They take ${size}. If another of your devices added files while offline and hasn’t synced since, open it first. They can’t be brought back.`, confirmLabel: 'Delete them', cancelLabel: 'Keep them' }))) return;
    const r = await deleteUnlisted();
    toast(r === 'ok' ? 'Deleted. That space is free again.' : WHY[r]);
  }
  if (!u || u.user !== account?.id) return null;
  const left = Math.max(0, u.limit - u.bytes), pct = Math.min(100, (u.bytes / u.limit) * 100), of = amountLabel(u.limit);
  return (
    <div className="mt-3" data-s="files-storage">
      <div className="h-2 rounded-full bg-track overflow-hidden" aria-hidden="true"><span className="block h-full bg-primary rounded-full" style={{ width: `${u.bytes ? Math.max(1, pct) : 0}%` }} /></div>
      <p className="m-0 mt-1 text-sm text-fg-3">
        {u.bytes ? `Your files: ${amountLabel(u.bytes, Math.floor)} used, ${amountLabel(left, Math.floor)} left of ${of}.` : `Your files: nothing stored yet, ${of} left.`}
        {anyDeleted ? ' Files in Recently deleted count until they go.' : ''}
      </p>
      {!!extra?.length && (
        <p className="m-0 mt-1 text-sm text-fg-2 flex flex-wrap items-center gap-x-3" data-s="files-unlisted">
          {extra.length} stored file{extra.length === 1 ? '' : 's'} ({amountLabel(extra.reduce((t, f) => t + f.size, 0), Math.ceil)}) {extra.length === 1 ? 'isn’t' : 'aren’t'} in your MyDay any more, left by importing an older backup, say.
          <LinkButton className="text-[15px]" data-action="files-unlisted-delete" onClick={clearExtra}>Delete them…</LinkButton>
        </p>
      )}
    </div>
  );
}

export function FilesCard({ data, owner, area }: { data: MyDayData; owner: Owner; area: 'project' | 'note' }) {
  const files = filesOf(data, owner), deleted = recentlyDeleted(data, owner);
  const [refused, setRefused] = useState<string[]>([]), [busy, setBusy] = useState(false), [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null), hid = `filesH-${owner.kind}-${owner.id}`;
  async function add(list: File[]) {
    if (!list.length) return;
    setRefused([]); setBusy(true);
    try {
      const r = await addFiles(owner, area, list);
      if (r.refused.length) setRefused(r.refused);
      if (r.kept) toast(r.kept === 1 ? 'File added.' : `${r.kept} files added.`);
    } finally { setBusy(false); }
  }
  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); void add(Array.from(e.dataTransfer.files)); };
  const what = owner.kind === 'project' ? 'project' : 'note';
  const body = (<>
    {files.length > 0 ? <ul className="list-none p-0 m-0">{files.map(f => <FileRow key={f.id} f={f} owner={owner} />)}</ul>
      : <Note className="mt-0">Keep photos, PDFs and documents with this {what}.</Note>}
    {refused.length > 0 && <div className="mt-2 text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2" role="alert" data-s="file-refused">{refused.map((r, i) => <p key={i} className="m-0">{r}</p>)}</div>}
    <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={e => { const l = Array.from(e.target.files ?? []); e.target.value = ''; void add(l); }} />
    <Button inline className="mt-3" data-action="file-add" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Adding…' : 'Add a file'}</Button>
    <DeletedFiles list={deleted} />
    <StorageLine anyDeleted={recentlyDeleted(data).length > 0} />
  </>);
  return (
    <Card aria-labelledby={hid} id={`files-${owner.kind}`} className={over ? 'outline outline-2 outline-primary' : ''} data-s="files-card"
      onDragOver={(e: DragEvent) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}>
      <h3 id={hid}>Files</h3>
      {body}
    </Card>
  );
}

// On the Projects home: files in Recently deleted whose project or note is gone (they can't be put back, only kept for
// 30 days or deleted now), so a file is never lost without a trace. The portfolio's show on its own page.
export function HomelessDeletedFiles({ data }: { data: MyDayData }) {
  const list = recentlyDeleted(data).filter(f => f.area !== 'portfolio' && (!f.removedFrom || !placeExists(data, f.removedFrom))); // the portfolio's are on its page
  if (!list.length) return null;
  return (
    <Card aria-labelledby="homelessFilesH" data-s="files-homeless">
      <h3 id="homelessFilesH">Files from deleted projects and notes</h3>
      <Note className="mt-0">They’re kept for 30 days in case you need them, then they go for good.</Note>
      <DeletedFiles list={list} putBackable={false} />
    </Card>
  );
}
