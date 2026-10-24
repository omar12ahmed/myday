import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { LinkButton, Note } from '../components/parts';
import { shortDate, todayKey } from '../data/dates';
import { toast } from '../data/toast';
import { backUpNow, deleteAllBackups, fetchBackup, listBackups, readState, saveFile, storageBlocked, subscribeBackups, type BackupInfo, type BackupResult } from '../sync/backup';

// "Your backups" (#backups; specs/automatic-backups.md): this device's last backup, Back up now, every backup of your
// account with Download and Restore (through Import's own checks and question), and Delete all backups.

const WHY: Record<Exclude<BackupResult, 'ok'>, string> = {
  'not-configured': 'Automatic backups aren’t set up yet.',
  'signed-out': 'Sign in to keep backups.',
  offline: 'You’re offline — backups will carry on when you’re back.',
  'too-fast': 'That was backed up a moment ago.',
  'too-large': 'Your data is too large for one backup file (over 10 MB). Export my data still works.',
  'too-many-devices': 'Backups are kept for up to 10 devices. Delete all backups to start again with the devices you use now.',
  'not-found': 'That backup isn’t there any more.',
  unsupported: 'This browser can’t make or open backups (it’s too old). Export my data still works.',
  'storage-blocked': 'Backups need this browser to allow saving, and it’s blocked here.',
  failed: 'That didn’t work just now. Try again later.',
};
const size = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
const time = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
const dayOf = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function BackupsView({ onRestore }: { onRestore: (text: string) => Promise<void> | void }) {
  const confirm = useConfirm();
  const me = useSyncExternalStore(subscribeBackups, readState), blocked = storageBlocked();
  const [list, setList] = useState<BackupInfo[] | null>(null), [problem, setProblem] = useState<string>(''), [busy, setBusy] = useState(false);
  const [round, setRound] = useState(0); // a new round loads the list again (after Delete all)
  const show = useCallback((r: Awaited<ReturnType<typeof listBackups>>) => {
    if (r.ok) { setList(r.backups); setProblem(''); } else { setList([]); setProblem(WHY[r.why as Exclude<BackupResult, 'ok'>] ?? WHY.failed); }
  }, []);
  useEffect(() => {
    let live = true;
    listBackups().then(r => { if (live) show(r); });
    return () => { live = false; };
  }, [show, me, round]);

  async function now() {
    setBusy(true);
    let r: BackupResult = 'failed';
    try { r = await backUpNow(); } finally { setBusy(false); }
    if (r === 'ok') toast('Backed up.'); else toast(WHY[r]);
  }
  async function download(b: BackupInfo) {
    const r = await fetchBackup(b.key);
    if (!r.ok) { toast(WHY[r.why as Exclude<BackupResult, 'ok'>] ?? WHY.failed); return; }
    saveFile(`myday-backup-${b.day}-${b.label.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.json`, r.text);
  }
  // Restore keeps a copy of your MyDay as it is now first (today's backup from this device), so a restore can be undone.
  async function restore(b: BackupInfo) {
    const r = await fetchBackup(b.key);
    if (!r.ok) { toast(WHY[r.why as Exclude<BackupResult, 'ok'>] ?? WHY.failed); return; }
    const copy = await backUpNow();
    if (copy !== 'ok' && copy !== 'too-fast') { toast('MyDay couldn’t keep a copy of your data as it is now, so nothing was restored. ' + WHY[copy]); return; }
    await onRestore(r.text);
  }
  async function deleteAll() {
    if (!(await confirm({ title: 'Delete all your backups?', body: 'Every backup from every device goes, and can’t be brought back. Your MyDay itself isn’t changed.', confirmLabel: 'Delete all backups', cancelLabel: 'Keep them' }))) return;
    const r = await deleteAllBackups();
    if (r === 'ok') { toast('All backups deleted.'); setRound(n => n + 1); } else toast(WHY[r]);
  }

  const k = todayKey();
  const last = me.lastAt ? (me.lastDay === k ? `Backed up today at ${time(me.lastAt)} from this device.` : `Last backed up from this device on ${shortDate(dayOf(me.lastAt) || me.lastDay || k)}.`) : 'Not backed up yet on this device.';
  return (
    <>
      <Card aria-labelledby="backupsH" id="backups">
        <h2 id="backupsH">Your backups</h2>
        <p className="m-0 text-[15px] text-fg-2">Once a day, while MyDay is open and you’re signed in, each device keeps a copy of everything — the same file as Export my data — privately in your own storage. They’re kept for 14 days, plus one a month for a year. They hold everything, private notes and projects too, and are never sent to AI. Restoring one first keeps a copy of your MyDay as it is now, so it can be undone.</p>
        <p className="m-0 mt-3 font-medium" data-s="backup-last">{last}</p>
        {me.failedDays >= 3 && <p className="m-0 mt-2 text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2" role="status" data-s="backup-failing">The daily backup hasn’t worked for {me.failedDays} days. MyDay keeps trying; Export my data still works.</p>}
        {blocked ? <p className="m-0 mt-3 text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2" role="status" data-s="backup-blocked">{WHY['storage-blocked']}</p>
          : <Button inline className="mt-3" data-action="backup-now" disabled={busy} onClick={now}>{busy ? 'Backing up…' : 'Back up now'}</Button>}
      </Card>
      <Card aria-labelledby="backupsListH">
        <h3 id="backupsListH">Backups</h3>
        {list === null ? <Note className="m-0">Loading your backups…</Note>
          : problem ? <Note className="m-0">{problem}</Note>
          : list.length === 0 ? <Note className="m-0">No backups yet. The first one is made today, or press Back up now.</Note>
          : <ul className="list-none p-0 m-0">{list.map(b => (
            <li key={b.key} className="border-t border-outline first:border-t-0 py-2" data-s="backup" data-key={b.key}>
              <span className="block font-medium">{shortDate(b.day)}{b.at && dayOf(b.at) === b.day ? ` · ${time(b.at)}` : ''}</span>
              <span className="block text-sm text-fg-3">{b.device === me.device ? 'This device' : b.label} · {size(b.size)}</span>
              <div className="flex flex-wrap gap-x-5">
                <LinkButton className="text-[15px]" data-action="backup-download" aria-label={`Download the backup of ${shortDate(b.day)} from ${b.device === me.device ? 'this device' : b.label}`} onClick={() => download(b)}>Download</LinkButton>
                <LinkButton className="text-[15px]" data-action="backup-restore" aria-label={`Restore the backup of ${shortDate(b.day)} from ${b.device === me.device ? 'this device' : b.label}`} onClick={() => restore(b)}>Restore</LinkButton>
              </div>
            </li>))}
          </ul>}
        {!!list?.length && <Button inline variant="ghost" className="mt-3" data-action="backup-delete-all" onClick={deleteAll}>Delete all backups</Button>}
      </Card>
    </>
  );
}
