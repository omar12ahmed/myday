import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { Field, TextInput } from '../components/Field';
import { BackLink, LinkButton, Note, Summary } from '../components/parts';
import { getSnapshot } from '../data/storage';
import { toast } from '../data/toast';
import { Compare } from './Compare';
import { clearKept, dismissRejected, doSignIn, doSignOut, keptFile, prepareReview, resolveConflicts, STATUS_LABEL, stopSyncing, syncNow, useSync, type Review, type View } from './engine';
import { localRecords, recordLabel } from './records';
import { ReviewPanel } from './ReviewPanel';
import { readState } from './state';

// When something last synced, e.g. "today at 10:42" or "Fri 2 Oct at 10:42".
function when(iso: string): string {
  const d = new Date(iso), now = new Date();
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === now.toDateString() ? `today at ${time}` : `${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} at ${time}`;
}
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// The line under the status, in plain words.
function statusLine(v: View): string {
  if (v.phase === 'signed-out') return v.linkedEmail ? `Signed out. Changes stay on this device and are sent when you sign in to ${v.linkedEmail} again.` : 'Everything is saved on this device. Sign in to sync it with your other devices.';
  if (v.phase === 'starting') return 'Getting ready…';
  if (v.phase === 'setup') return "Signed in. This device hasn't started syncing yet.";
  if (v.phase === 'other-account') return 'Signed in to a different account from the one this device syncs with.';
  if (v.phase === 'unavailable') return "This browser isn't letting MyDay save, so sync can't keep track of changes here.";
  if (v.phase === 'notes-damaged') return "Sync's notes on this device couldn't be read. Your MyDay data is fine.";
  if (v.status === 'syncing') return 'Sending and fetching changes…';
  if (v.problem === 'paused') return "Sync is paused until MyDay can read this device's saved data (see Today).";
  if (v.review) return 'Sync is paused until you check what it would change.';
  if (v.problem === 'auth' || v.problem === 'not-ready' || v.problem === 'storage') return v.message;
  if (v.conflicts.length) return `${plural(v.conflicts.length, 'record was', 'records were')} changed here and on another device. Nothing has been overwritten — choose which to keep.`;
  const retry = v.retryAt ? ` Trying again at ${new Date(v.retryAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}.` : '';
  if (v.problem) return `${v.message} ${v.pending ? `${plural(v.pending, 'change is', 'changes are')} saved on this device and will be sent when it can.` : 'Everything here is saved on this device.'}${retry}`;
  if (v.pending) return `${plural(v.pending, 'change is', 'changes are')} saved on this device, waiting to be sent.`;
  return v.lastSynced ? `Everything here is in your account. Last synced ${when(v.lastSynced)}.` : 'Ready to sync.';
}

export function SyncScreen({ onExport }: { onExport: () => void }) {
  const v = useSync();
  const confirm = useConfirm();
  const [reviewState, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  // A review belongs to the account it was made for (it's dropped if you sign out or switch account).
  const review = reviewState && v.account && v.account.id === reviewState.account.id ? reviewState : null;

  async function openReview() {
    setBusy('review'); setError('');
    const r = await prepareReview();
    setBusy('');
    if (r.ok) setReview(r.review); else setError(r.message);
  }
  async function signOut() {
    setBusy('signout');
    const ok = await doSignOut();
    setBusy('');
    if (!ok) { toast("Couldn't sign out just now. Check your connection and try again."); return; }
    setReview(null);
    toast('Signed out on this device. Your data here stays as it is.');
  }
  async function stop() {
    const pendingNote = v.pending ? ` ${plural(v.pending, 'change made here hasn\'t', 'changes made here haven\'t')} been sent yet: ${v.pending === 1 ? 'it stays' : 'they stay'} on this device, but won't be sent.` : '';
    const yes = await confirm({
      title: `Stop syncing with ${v.linkedEmail} on this device?`,
      body: `Everything on this device stays exactly as it is, and nothing is deleted from your account. This device just stops sending and fetching changes.${pendingNote} You can start again later (you'll see what would change first).`,
      confirmLabel: 'Stop syncing here',
      cancelLabel: 'Keep syncing',
    });
    if (!yes) return;
    await stopSyncing();
    toast('This device has stopped syncing. Your data here is unchanged.');
  }

  return (
    <div className="max-w-[720px] mx-auto" id="syncScreen" data-phase={v.phase}>
      <Card aria-labelledby="sync-h">
        <BackLink to="today" label="Today" />
        <h2 id="sync-h">Sync between devices</h2>
        <p className="flex items-center gap-2 m-0">
          <span id="syncStatus" data-status={v.status} className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold border ${v.status === 'attention' ? 'bg-warn-c text-on-warn-c border-transparent' : v.status === 'synced' ? 'text-primary border-primary-outline' : 'text-fg-2 border-outline-strong'}`}>
            {STATUS_LABEL[v.status]}
          </span>
        </p>
        <p id="syncLine" className="text-[15px] text-fg-2 mt-2">{statusLine(v)}</p>
        {v.phase === 'linked' && (
          <Button inline data-action="sync-now" disabled={v.status === 'syncing' || !!v.review || v.problem === 'paused'} onClick={() => { void syncNow(); }}>
            <RefreshCw size={16} aria-hidden="true" /> Sync now
          </Button>
        )}
        <details className="group mt-2">
          <Summary>What syncs, and what stays on this device</Summary>
          <div className="text-[15px] text-fg-2 grid gap-2 pb-1">
            <p className="m-0"><strong className="text-fg">Syncs:</strong> everything you enter — Today (your task lists, the queue, each day's plan and context), the Calendar (your work pattern, shifts, appointments, pay rates and bank-holiday region), Finance, Inbox (tasks and notes), Study, Health (workouts, food, the shopping list and your goal), What MyDay has noticed, and your planning settings.</p>
            <p className="m-0">Notes, tasks, appointments, sessions, workouts and recipes sync one by one, so something added on each device is simply kept on both. If the same thing was changed on two devices before they synced, you choose which to keep.</p>
            <p className="m-0"><strong className="text-fg">Stays on this device:</strong> the theme and animations, a running focus timer or rest countdown, and the bank holidays downloaded from gov.uk.</p>
            <p className="m-0">Everything is saved on this device first, so MyDay works just the same offline. Changes are sent when it can reach your account, and fetched whenever you come back to MyDay.</p>
          </div>
        </details>
      </Card>

      {error && <Card tone="notice"><p role="alert" className="m-0 text-[15px]">{error}</p></Card>}

      {v.phase === 'signed-out' && <SignInCard linkedEmail={v.linkedEmail} />}

      {v.phase === 'setup' && v.account && !review && (
        <Card aria-labelledby="setup-h">
          <h3 id="setup-h">Start syncing on this device</h3>
          <p className="text-[15px] text-fg-2">Signed in as <strong className="text-fg">{v.account.email}</strong>.</p>
          <ol className="grid gap-3 pl-5 my-3 text-[15px]">
            <li><strong>Download a backup of this device first.</strong> It's a copy of everything here, just in case.
              <div className="mt-2"><Button inline data-action="export" onClick={onExport}>Download a backup</Button></div></li>
            <li><strong>See what would change.</strong> MyDay compares this device with your account and shows you everything before anything is saved or sent.
              <div className="mt-2"><Button inline variant="primary" data-action="sync-review" disabled={busy === 'review'} onClick={openReview}>{busy === 'review' ? 'Comparing…' : 'See what would change'}</Button></div></li>
          </ol>
          <LinkButton data-action="sync-signout" onClick={signOut}>Sign out</LinkButton>
        </Card>
      )}

      {review && <ReviewPanel review={review} onDone={() => setReview(null)} onCancel={() => setReview(null)} onReplace={setReview} />}

      {v.phase === 'other-account' && v.account && (
        <Card tone="notice" aria-labelledby="other-h">
          <h3 id="other-h">This device syncs with another account</h3>
          <p className="text-[15px]">This device syncs with <strong>{v.linkedEmail}</strong>, but you're signed in as <strong>{v.account.email}</strong>. Nothing is sent to or fetched from {v.account.email}'s account, and this device's records stay as they are.</p>
          <div className="grid gap-2.5">
            <Button data-action="sync-signout" onClick={signOut}>Sign out</Button>
            <Button variant="ghost" data-action="sync-stop" onClick={stop}>Stop syncing with {v.linkedEmail} here</Button>
          </div>
        </Card>
      )}

      {v.phase === 'linked' && <LinkedCards v={v} onReview={openReview} reviewOpen={!!review} busy={busy} />}

      {v.phase === 'notes-damaged' && (
        <Card tone="notice">
          <h3>Start sync again on this device</h3>
          <p className="text-[15px]">Your MyDay data here is fine. Sync just needs to compare this device with your account again, and you'll see what would change first.</p>
          <Button data-action="sync-stop" onClick={async () => { await stopSyncing(); }}>Start again</Button>
        </Card>
      )}

      {(v.phase === 'linked' || v.phase === 'setup' || v.phase === 'other-account') && v.account && (
        <Card aria-labelledby="acct-h">
          <h3 id="acct-h">Account</h3>
          <p className="text-[15px] text-fg-2">Signed in as <strong className="text-fg" id="syncEmail">{v.account.email}</strong>{v.phase === 'linked' ? ' · this device syncs with this account' : ''}.</p>
          <div className="grid gap-2.5">
            {v.phase === 'linked' && <Button variant="ghost" data-action="sync-signout" disabled={busy === 'signout'} onClick={signOut}>Sign out on this device</Button>}
            {v.phase === 'linked' && <Button variant="ghost" data-action="sync-stop" onClick={stop}>Stop syncing on this device</Button>}
          </div>
          <Note className="mt-3 mb-0">Signing out keeps everything on this device. Changes made while signed out are sent when you sign back in to the same account.</Note>
        </Card>
      )}
      {v.kept > 0 && <KeptCard count={v.kept} />}
    </div>
  );
}

function SignInCard({ linkedEmail }: { linkedEmail: string | null }) {
  const [email, setEmail] = useState(linkedEmail || '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setBusy(true); setError('');
    const msg = await doSignIn(email, password);
    setBusy(false);
    if (msg) setError(msg);
    else { setPassword(''); toast('Signed in.'); }
  }
  return (
    <Card aria-labelledby="signin-h">
      <h3 id="signin-h">Sign in</h3>
      <form className="grid gap-3" onSubmit={submit} noValidate>
        <Field label="Email" htmlFor="syncEmailInput">
          <TextInput id="syncEmailInput" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} value={email} onChange={e => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="syncPassword">
          <div className="flex gap-2">
            <TextInput id="syncPassword" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="flex-1 min-w-0" />
            <Button inline variant="ghost" className="flex-none !min-h-12" aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'} data-action="sync-show-password" onClick={() => setShow(!show)}>
              {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </Button>
          </div>
        </Field>
        {error && <p role="alert" id="signinError" className="warn text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2 m-0">{error}</p>}
        <Button type="submit" variant="primary" data-action="sync-signin" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <Note className="mt-3 mb-0">Use the account set up in your Supabase project. Signing in doesn't send or change anything: you'll see what would change first.</Note>
    </Card>
  );
}

function LinkedCards({ v, onReview, reviewOpen, busy }: { v: View; onReview: () => void; reviewOpen: boolean; busy: string }) {
  const [working, setWorking] = useState(false);
  // The cloud's versions of the records in conflict, as noted on this device.
  const read = readState();
  const notes = read.ok && read.state.link ? read.state.link : null;
  const local = localRecords(getSnapshot().data);
  async function resolve(keys: string[], choice: 'here' | 'cloud') {
    setWorking(true);
    const ok = await resolveConflicts(keys, choice);
    setWorking(false);
    if (!ok) { toast("Couldn't save that just now. Please try again."); return; }
    toast(choice === 'here' ? "Keeping this device's version — sending it now." : "Using your account's version. This device's version is kept below.");
  }
  return (
    <>
      {v.review && !reviewOpen && (
        <Card tone="notice" aria-labelledby="needs-review-h">
          <h3 id="needs-review-h">{v.review === 'import' ? 'You restored a backup' : 'A lot changed on this device at once'}</h3>
          <p className="text-[15px]">{v.review === 'import'
            ? 'Before your account gets any of it, check what it would change there.'
            : 'That can happen after restoring a backup, a long time offline, or the first time MyDay syncs more of your data (Calendar, Finance, Study, Health, Inbox…). Before your account gets any of it, check what it would change there.'} Sync is paused until then; everything stays saved on this device.</p>
          <Button data-action="sync-review" disabled={busy === 'review'} onClick={onReview}>{busy === 'review' ? 'Comparing…' : 'See what would change'}</Button>
        </Card>
      )}
      {v.problem === 'auth' && (
        <Card tone="notice"><p className="text-[15px] m-0 mb-3">Your sign-in has run out. Sign in again to carry on syncing — your changes are safe on this device.</p>
          <Button data-action="sync-signout" onClick={async () => { if (!(await doSignOut())) toast("Couldn't sign out just now. Check your connection and try again."); }}>Sign in again</Button></Card>
      )}
      {v.conflicts.length > 0 && notes && (
        <Card tone="notice" aria-labelledby="conflicts-h" id="syncConflicts">
          <h3 id="conflicts-h">{plural(v.conflicts.length, 'record needs', 'records need')} your choice</h3>
          <p className="text-[15px]">These were changed on this device and on another one before they could sync. Nothing has been overwritten.</p>
          {v.conflicts.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Button inline variant="ghost" disabled={working} data-action="conflict-all-here" onClick={() => resolve(v.conflicts, 'here')}>Keep all of this device's</Button>
              <Button inline variant="ghost" disabled={working} data-action="conflict-all-cloud" onClick={() => resolve(v.conflicts, 'cloud')}>Use all of the account's</Button>
            </div>
          )}
          {v.conflicts.map(k => {
            const c = notes.conflicts[k];
            if (!c) return null;
            return (
              <div key={k} className="conflict border-t border-[color-mix(in_srgb,currentColor_25%,transparent)] pt-3 mt-3" data-key={k}>
                <p className="font-semibold m-0">{recordLabel(k)}</p>
                <Compare recordKey={k} here={local.get(k) ?? null} cloud={c.content} cloudLabel={c.del ? 'In your account (deleted)' : 'In your account'} />
                <div className="grid grid-cols-2 gap-2">
                  <Button inline disabled={working} data-action="conflict-here" data-key={k} onClick={() => resolve([k], 'here')}>Keep this device's</Button>
                  <Button inline disabled={working} data-action="conflict-cloud" data-key={k} onClick={() => resolve([k], 'cloud')}>{c.del ? 'Remove it here' : "Use the account's"}</Button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
      {v.rejected.length > 0 && (
        <Card tone="notice" aria-labelledby="rejected-h">
          <h3 id="rejected-h">{plural(v.rejected.length, 'change wasn\'t', 'changes weren\'t')} accepted by your account</h3>
          <p className="text-[15px]">{v.rejected.length === 1 ? 'It stays' : 'They stay'} on this device. If you change {v.rejected.length === 1 ? 'it' : 'them'} again, MyDay will try again.</p>
          {v.rejected.map(r => (
            <div key={r.key} className="flex items-center justify-between gap-2 border-t border-[color-mix(in_srgb,currentColor_25%,transparent)] py-2">
              <span className="min-w-0"><strong>{recordLabel(r.key)}</strong><span className="block text-sm break-words">{r.reason}</span></span>
              <Button inline variant="ghost" data-action="rejected-ok" data-key={r.key} onClick={() => { void dismissRejected(r.key); }}>OK</Button>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function KeptCard({ count }: { count: number }) {
  const confirm = useConfirm();
  function download() {
    const f = keptFile();
    if (!f) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([f.text], { type: 'application/json' }));
    a.download = f.filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  return (
    <Card aria-labelledby="kept-h" id="syncKept">
      <h3 id="kept-h">This device's earlier versions</h3>
      <p className="text-[15px] text-fg-2">{plural(count, "record from this device was", 'records from this device were')} replaced by your account's version. {count === 1 ? "It's" : "They're"} kept here, just in case.</p>
      <div className="flex flex-wrap gap-2">
        <Button inline data-action="kept-download" onClick={download}>Download {count === 1 ? 'it' : 'them'}</Button>
        <Button inline variant="ghost" data-action="kept-clear" onClick={async () => {
          if (await confirm({ title: 'Clear the earlier versions?', body: 'Download them first if you might want them. This doesn\'t change anything else.', confirmLabel: 'Clear them', cancelLabel: 'Keep them' })) await clearKept();
        }}>Clear…</Button>
      </div>
    </Card>
  );
}
