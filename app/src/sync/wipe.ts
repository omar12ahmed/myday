// Delete everything (specs/delete-everything.md): your account's data (records, deletion markers, the change log,
// the pre-1.44.0 project copies), this device (everything but the sign-in), every file and every backup. In that
// order: the account first, so every other device hears of it at its next sync and nothing comes back from them; then
// this device; then the files and backups in R2, which are tried again (on every open, and from the page) until
// they're gone, only ever for the account that was wiped. Never sent to AI.
import { deleteAllBackups, forgetBackupState } from './backup';
import { currentSession } from './client';
import { wipeAccount, WIPED_KEY } from './engine';
import { deleteAllFiles } from './files';
import { setWiping } from './wiping';

export type WipeStep = 'account' | 'files' | 'backups';
type Store = 'files' | 'backups';
export type WipeResult =
  | { ok: true }
  | { ok: false; at: 'account'; why: 'offline' | 'signed-out' | 'not-linked' | 'failed' }
  | { ok: false; at: 'device' | 'storage'; left: Store[] };

// What's still to delete in R2, and for which account (never another account signed in here later).
const PENDING_KEY = 'myday.wipe.pending';
interface Pending { user: string; left: Store[] }
function readPending(): Pending | null {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
    if (!v || typeof v !== 'object' || typeof (v as Pending).user !== 'string' || !Array.isArray((v as Pending).left)) return null;
    const left = (v as Pending).left.filter((x): x is Store => x === 'files' || x === 'backups');
    return left.length ? { user: (v as Pending).user, left } : null;
  } catch { return null; }
}
function setPending(user: string, left: Store[]) {
  try { if (left.length) localStorage.setItem(PENDING_KEY, JSON.stringify({ user, left })); else localStorage.removeItem(PENDING_KEY); } catch { /* tried again from the page */ }
}
// For the account signed in now (its id), what's still to delete.
export const pendingFor = (user: string | null | undefined): Store[] => { const p = readPending(); return p && user && p.user === user ? p.left : []; };

export async function deleteEverything(onStep?: (s: WipeStep) => void): Promise<WipeResult> {
  setWiping(true);
  try {
    onStep?.('account');
    const w = await wipeAccount();
    if (!w.ok) return { ok: false, at: 'account', why: w.why };
    setPending(w.user, ['files', 'backups']); // noted first, so an interrupted page still finishes them
    const r = await finishStorage(w.user, ['files', 'backups'], onStep);
    // This device couldn't be cleared (its storage is full or blocked): the next sync tries again; say so.
    return w.here ? r : { ok: false, at: 'device', left: r.ok ? [] : r.at === 'storage' ? r.left : [] };
  } finally { setWiping(false); }
}
// Files and backups in R2, only while the account that was wiped is the one signed in. Not set up means there's
// nothing there.
async function finishStorage(user: string, left: Store[], onStep?: (s: WipeStep) => void): Promise<WipeResult> {
  if ((await currentSession()).session?.user?.id !== user) return { ok: false, at: 'storage', left };
  const still: Store[] = [];
  for (const what of left) {
    onStep?.(what);
    const r = what === 'files' ? await deleteAllFiles() : await deleteAllBackups();
    if (r !== 'ok' && r !== 'not-configured') still.push(what);
    else if (what === 'backups') forgetBackupState();
  }
  setPending(user, still);
  return still.length ? { ok: false, at: 'storage', left: still } : { ok: true };
}
export async function retryPendingWipe(): Promise<WipeResult> {
  const p = readPending();
  return p ? finishStorage(p.user, p.left) : { ok: true };
}

// The notice after a wipe: here, or on another device (when).
export interface Wiped { at: string; from: 'here' | 'elsewhere' }
export function wipedNotice(): Wiped | null {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(WIPED_KEY) || 'null');
    return v && typeof v === 'object' && typeof (v as Wiped).at === 'string' && ((v as Wiped).from === 'here' || (v as Wiped).from === 'elsewhere') ? (v as Wiped) : null;
  } catch { return null; }
}
export function dismissWiped() { try { localStorage.removeItem(WIPED_KEY); } catch { /* it shows again next time */ } }

// On each open: finish deleting files and backups left from a wipe here, once that account is signed in.
let retrying = false, busy = false;
export function startWipeRetry() {
  if (retrying || !readPending()) return;
  retrying = true;
  const go = async () => {
    if (busy || !readPending() || navigator.onLine === false) return;
    busy = true;
    try { await retryPendingWipe(); } finally { busy = false; }
  };
  setTimeout(() => { void go(); }, 10_000);
  window.addEventListener('online', () => { void go(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void go(); });
}
