// Delete everything (specs/delete-everything.md): your account's data (records, deletion markers, the change log,
// the pre-1.44.0 project copies), this device (everything but the sign-in), every file and every backup. In that
// order: the account first, so every other device hears of it at its next sync and nothing comes back from them; then
// this device; then the files and backups in R2, which are tried again (on every open, and from the page) until
// they're gone. Never sent to AI.
import { deleteAllBackups } from './backup';
import { wipeAccount, WIPED_KEY } from './engine';
import { deleteAllFiles } from './files';

export type WipeStep = 'account' | 'files' | 'backups';
type Store = 'files' | 'backups';
export type WipeResult =
  | { ok: true }
  | { ok: false; at: 'account'; why: 'offline' | 'signed-out' | 'not-linked' | 'failed' }
  | { ok: false; at: 'storage'; left: Store[] };

const PENDING_KEY = 'myday.wipe.pending';
export function pendingWipe(): Store[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x): x is Store => x === 'files' || x === 'backups') : [];
  } catch { return []; }
}
function setPending(left: Store[]) {
  try { if (left.length) localStorage.setItem(PENDING_KEY, JSON.stringify(left)); else localStorage.removeItem(PENDING_KEY); } catch { /* tried again from the page */ }
}

export async function deleteEverything(onStep?: (s: WipeStep) => void): Promise<WipeResult> {
  onStep?.('account');
  const w = await wipeAccount();
  if (!w.ok) return { ok: false, at: 'account', why: w.why };
  setPending(['files', 'backups']); // noted first, so an interrupted page still finishes them
  return finishStorage(['files', 'backups'], onStep);
}
// Files and backups in R2. Not set up means there's nothing there.
async function finishStorage(left: Store[], onStep?: (s: WipeStep) => void): Promise<WipeResult> {
  const still: Store[] = [];
  for (const what of left) {
    onStep?.(what);
    const r = what === 'files' ? await deleteAllFiles() : await deleteAllBackups();
    if (r !== 'ok' && r !== 'not-configured') still.push(what);
  }
  setPending(still);
  return still.length ? { ok: false, at: 'storage', left: still } : { ok: true };
}
export const retryPendingWipe = (): Promise<WipeResult> => (pendingWipe().length ? finishStorage(pendingWipe()) : Promise.resolve({ ok: true }));

// The notice after a wipe: here, or on another device (when).
export interface Wiped { at: string; from: 'here' | 'elsewhere' }
export function wipedNotice(): Wiped | null {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(WIPED_KEY) || 'null');
    return v && typeof v === 'object' && typeof (v as Wiped).at === 'string' && ((v as Wiped).from === 'here' || (v as Wiped).from === 'elsewhere') ? (v as Wiped) : null;
  } catch { return null; }
}
export function dismissWiped() { try { localStorage.removeItem(WIPED_KEY); } catch { /* it shows again next time */ } }

// On each open: finish deleting files and backups left from a wipe here, once signed in.
let retrying = false;
export function startWipeRetry() {
  if (retrying || !pendingWipe().length) return;
  retrying = true;
  const go = async () => { if (pendingWipe().length && navigator.onLine !== false) await retryPendingWipe(); };
  setTimeout(() => { void go(); }, 10_000);
  window.addEventListener('online', () => { void go(); });
}
