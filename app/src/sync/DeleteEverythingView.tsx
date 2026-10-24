import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { BackLink, Note } from '../components/parts';
import { useSync } from './engine';
import { deleteEverything, pendingFor, retryPendingWipe, type WipeStep } from './wipe';

// Delete everything (#delete-everything; specs/delete-everything.md): what goes and what stays, a copy first, the
// phrase to type, then the steps as they finish. Afterwards MyDay starts again from nothing (still signed in), and
// Today says so.
const PHRASE = 'delete everything';
const STEPS: { id: WipeStep; label: string }[] = [
  { id: 'account', label: 'Your account’s data, and this device' },
  { id: 'files', label: 'Your files' },
  { id: 'backups', label: 'Your backups' },
];
const WHY = {
  offline: 'Deleting everything needs a connection. Nothing was deleted.',
  'signed-out': 'Deleting everything needs your account. Sign in first. Nothing was deleted.',
  'not-linked': 'This device isn’t syncing with your account yet, so its data and your account’s can’t be deleted together. Nothing was deleted.',
  failed: 'That didn’t work just now. Nothing was deleted. Try again.',
};

export function DeleteEverythingView({ onExport }: { onExport: () => void }) {
  const v = useSync();
  const [typed, setTyped] = useState(''), [step, setStep] = useState<WipeStep | null>(null), [done, setDone] = useState<WipeStep[]>([]);
  const [problem, setProblem] = useState(''), [busy, setBusy] = useState(false);
  const pending = pendingFor(v.account?.id);
  const ready = v.phase === 'linked' && !!v.account;
  const matches = typed.trim().toLowerCase() === PHRASE;
  async function go() {
    if (!matches || busy) return;
    setBusy(true); setProblem(''); setDone([]);
    const r = await deleteEverything(s => { setStep(s); setDone(STEPS.slice(0, STEPS.findIndex(x => x.id === s)).map(x => x.id)); });
    if (!r.ok && r.at === 'account') { setBusy(false); setStep(null); setProblem(WHY[r.why]); return; }
    if (!r.ok && r.at === 'device') { setBusy(false); setStep(null); setProblem('Your account’s data is deleted, but this device couldn’t be cleared: its storage is full or blocked. MyDay will try again the next time it syncs.'); return; }
    // The data here is gone: start again from nothing in memory too (Today has the notice, and any files or backups
    // still to delete are tried again).
    location.hash = 'today';
    location.reload();
  }
  async function again() {
    setBusy(true);
    const r = await retryPendingWipe();
    setBusy(false);
    setProblem(r.ok ? '' : 'Your files and backups still couldn’t be deleted. MyDay will keep trying.');
  }
  return (
    <div className="grid gap-4" data-s="delete-everything">
      <BackLink to="sync" label="Your account" />
      <Card aria-labelledby="wipeH">
        <h2 id="wipeH" className="mt-0">Delete everything</h2>
        <p className="text-[15px]">This deletes your MyDay everywhere: on this device, on your other devices and in your account. Your plans, tasks, projects, notes, study, money, health and everything else go, along with what you deleted before, your files and your backups.</p>
        <p className="text-[15px]">Your sign-in stays, so you can start again straight away. It can’t be undone.</p>
        <Button inline variant="ghost" data-action="wipe-export" onClick={onExport}>Download a copy first</Button>
        <Note className="mt-2 mb-0">The same file as Export my data, saved on this device.</Note>
      </Card>
      {pending.length > 0 && !busy && (
        <Card tone="notice" data-s="wipe-pending">
          <p className="m-0 text-[15px]">Your data is deleted. Your {pending.join(' and ')} couldn’t be deleted yet; MyDay will try again.</p>
          <Button inline className="mt-3" data-action="wipe-retry" onClick={again}>Try again</Button>
        </Card>
      )}
      <Card aria-labelledby="wipeConfirmH">
        <h3 id="wipeConfirmH" className="mt-0">Confirm</h3>
        {!ready && <p className="text-[15px] m-0 mb-3" data-s="wipe-unready">{v.phase === 'signed-out' || !v.account ? WHY['signed-out'].replace(' Nothing was deleted.', '') : WHY['not-linked'].replace(' Nothing was deleted.', '')}</p>}
        <Field label={`Type “${PHRASE}” to confirm`} htmlFor="wipePhrase">
          <TextInput id="wipePhrase" autoComplete="off" autoCapitalize="off" spellCheck={false} value={typed} disabled={busy || !ready} onChange={e => setTyped(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void go(); }} />
        </Field>
        <Button className="mt-3" variant="primary" data-action="wipe-go" disabled={!matches || busy || !ready} onClick={go}>{busy ? 'Deleting…' : 'Delete everything'}</Button>
        {busy && (
          <ol className="list-none p-0 m-0 mt-3 grid gap-1" aria-live="polite" data-s="wipe-steps">
            {STEPS.map(x => <li key={x.id} className="text-[15px]" data-done={done.includes(x.id) ? '1' : '0'}>{done.includes(x.id) ? '✓ ' : x.id === step ? '… ' : '· '}{x.label}</li>)}
          </ol>
        )}
        {problem && <p className="m-0 mt-3 text-[15px] text-on-warn-c" role="alert" data-s="wipe-problem">{problem}</p>}
      </Card>
    </div>
  );
}
