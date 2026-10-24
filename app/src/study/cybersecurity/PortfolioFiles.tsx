import { useRef, useState, useSyncExternalStore } from 'react';
import { AREA_RULES, FILE_TYPES } from '../../../../supabase/functions/_shared/files/rules';
import { Button } from '../../components/Button';
import { LinkButton, Note } from '../../components/parts';
import { PORTFOLIO_FILES } from '../../data/cybersecurity/types';
import { filesOf, recentlyDeleted, removeFile, sizeLabel, unfinished, type Owner } from '../../data/files';
import { update } from '../../data/storage';
import { toast } from '../../data/toast';
import type { FileRecord, MyDayData } from '../../data/types';
import { addFiles, canRetry, getProgress, retry, subscribeFiles, WHY, type FilesResult } from '../../sync/files';
import { portfolioBytes } from './portfolioPages';
import { DeletedFiles } from '../../files/FilesCard';

// A portfolio entry's files (specs/study-home-and-lessons.md §10, through the shared files design, specs/files.md):
// screenshots, diagrams and PDFs, at most 5, each up to 2 MB. Opening one keeps a copy on this device, so it opens
// offline next time (data/fileCache.ts). Removing goes to Recently deleted for 30 days, as everywhere. Never sent to AI.
const RULE = AREA_RULES.portfolio;
const ACCEPT = RULE.types.flatMap(t => FILE_TYPES[t].ext.map(e => '.' + e)).join(',');
const why = (r: FilesResult) => (r === 'ok' ? '' : WHY[r]);

// Opens it in a new tab (opened straight away, so the browser allows it), from this device's copy when there is one.
async function openPortfolioFile(f: FileRecord): Promise<FilesResult> {
  const tab = window.open('about:blank', '_blank');
  if (!tab) return 'blocked';
  const r = await portfolioBytes(f);
  if (!r.ok) { tab.close(); return r.why; }
  const url = URL.createObjectURL(new Blob([r.c.bytes], { type: r.c.type }));
  tab.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'ok';
}

function Row({ f, owner }: { f: FileRecord; owner: Owner }) {
  const progress = useSyncExternalStore(subscribeFiles, getProgress).get(f.id);
  const label = FILE_TYPES[f.type]?.label ?? 'File';
  async function open() { const r = await openPortfolioFile(f); if (r !== 'ok') toast(why(r)); }
  function remove() { if (update(d => (removeFile(d, f.id, owner) ? undefined : false))) toast('Removed — it’s in Recently deleted for 30 days.'); }
  const status = f.state === 'uploading' ? (progress?.state === 'adding' ? 'Adding…' : unfinished(f) ? 'It wasn’t finished.' : 'Still being added.')
    : f.state === 'failed' ? (progress?.message || 'It couldn’t be added.') : `${label} · ${sizeLabel(f.size)}`;
  return <li className="border-t border-outline first:border-t-0 py-2" data-s="file" data-id={f.id} data-state={f.state}>
    <span className="block font-medium break-words">{f.name}</span>
    <span className={`block text-sm ${f.state === 'failed' ? 'text-on-warn-c' : 'text-fg-3'}`} data-s="file-status">{status}</span>
    <div className="flex flex-wrap gap-x-5">
      {f.state === 'kept' && <LinkButton className="text-[15px]" data-action="file-open" aria-label={`Open “${f.name}”`} onClick={open}>Open</LinkButton>}
      {f.state === 'failed' && canRetry(f.id) && <LinkButton className="text-[15px]" data-action="file-retry" onClick={() => { void retry(f.id).then(r => { if (r.refused) toast(`${f.name}: ${r.refused}`); }); }}>Try again</LinkButton>}
      {(f.state !== 'uploading' || progress?.state !== 'adding') && <LinkButton className="text-[15px]" data-action="file-remove" aria-label={`Remove “${f.name}”`} onClick={remove}>Remove</LinkButton>}
    </div>
  </li>;
}

export function PortfolioFiles({ data, entryId }: { data: MyDayData; entryId: string }) {
  const owner: Owner = { kind: 'portfolio', id: entryId };
  const files = filesOf(data, owner), deleted = recentlyDeleted(data, owner), room = PORTFOLIO_FILES - files.length;
  const [refused, setRefused] = useState<string[]>([]), [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  async function add(list: File[]) {
    if (!list.length) return;
    const extra = list.length > room ? [`An entry keeps at most ${PORTFOLIO_FILES} files: ${list.length - room === 1 ? 'one wasn’t' : `${list.length - room} weren’t`} added.`] : [];
    setRefused([]); setBusy(true);
    try {
      const r = await addFiles(owner, 'portfolio', list.slice(0, Math.max(0, room)));
      if (r.refused.length || extra.length) setRefused([...r.refused, ...extra]);
      if (r.kept) toast(r.kept === 1 ? 'File added.' : `${r.kept} files added.`);
    } finally { setBusy(false); }
  }
  return <div className="mt-2" data-cy-pf-files={files.length}>
    <h6 className="text-[15px] font-semibold m-0 mt-1">Files</h6>
    {files.length > 0 ? <ul className="list-none p-0 m-0">{files.map(f => <Row key={f.id} f={f} owner={owner} />)}</ul>
      : <Note className="mt-0">Screenshots, diagrams or PDFs: {RULE.summary.replace(/^Only /, '').replace(/\.$/, '')}, at most {PORTFOLIO_FILES}.</Note>}
    {refused.length > 0 && <div className="mt-2 text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2" role="alert" data-s="file-refused">{refused.map((x, i) => <p key={i} className="m-0">{x}</p>)}</div>}
    <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={e => { const l = Array.from(e.target.files ?? []); e.target.value = ''; void add(l); }} />
    {room > 0 && <Button inline variant="ghost" className="mt-1" data-action="file-add" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Adding…' : 'Add a file'}</Button>}
    <DeletedFiles list={deleted} />
  </div>;
}

// On the portfolio page: files from entries you've removed (they can't go back, only wait 30 days or be deleted now).
export function RemovedEntryFiles({ data }: { data: MyDayData }) {
  const ids = new Set((data.cybersecurity.portfolio ?? []).map(e => e.id));
  const list = recentlyDeleted(data).filter(f => f.area === 'portfolio' && (!f.removedFrom || f.removedFrom.kind !== 'portfolio' || !ids.has(f.removedFrom.id)));
  if (!list.length) return null;
  return <div data-s="files-homeless"><p className="text-sm text-fg-2 m-0 mt-3">Files from entries you’ve removed are kept for 30 days in case you need them, then they go for good.</p><DeletedFiles list={list} putBackable={false} /></div>;
}
