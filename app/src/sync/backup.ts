// Automatic backups (specs/automatic-backups.md): once a day per device, while MyDay is open and signed in, the same
// file "Export my data" makes, compressed, is kept privately in your own R2 bucket through the "backup" Edge Function
// (supabase/functions/backup). "Your backups" (shell/BackupsView.tsx) lists them, downloads one, restores one through
// Import's own checks and question, backs up now, or deletes them all (which the true wipe of "delete everything" will
// call too). The device's id, label and last result are kept on this device only (myday.backup.v1): they're not part
// of your data, not synced and not exported. Never sent to AI.
import { exportText, getSnapshot } from '../data/storage';
import { todayKey } from '../data/dates';
import { APP_VERSION } from '../version';
import { currentSession } from './client';
import { SYNC } from './config';
import { getView } from './engine';

const KEY = 'myday.backup.v1', DUE_AFTER_MS = 30_000, WAIT_MS = 60_000;
export interface BackupState { device: string; label: string; lastDay: string | null; lastAt: string | null; failedDays: number; lastFailDay: string | null }
export interface BackupInfo { key: string; device: string; label: string; day: string; size: number; at: string }
export type BackupResult = 'ok' | 'not-configured' | 'signed-out' | 'offline' | 'too-fast' | 'too-large' | 'too-many-devices' | 'not-found'
  | 'unsupported' | 'storage-blocked' | 'failed';

// This device's name, from the browser: enough to tell your devices apart in the list, nothing more.
export function deviceLabel(ua = typeof navigator === 'undefined' ? '' : navigator.userAgent, touch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1): string {
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touch)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Macintosh|Mac OS X/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Linux|CrOS/.test(ua)) return 'Linux';
  return 'This browser';
}
const newDevice = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => (b % 36).toString(36)).join('');

// This device's state, read once and then kept here (one object until it changes), so the page sees a steady value —
// also when the browser blocks storage, which would otherwise make up a new device on every read.
let cached: BackupState | null = null;
export const storageBlocked = () => { try { localStorage.setItem(KEY + '.probe', '1'); localStorage.removeItem(KEY + '.probe'); return false; } catch { return true; } };
export function readState(): BackupState {
  if (cached) return cached;
  let s: Partial<BackupState> = {};
  try { const raw = localStorage.getItem(KEY); if (raw) s = JSON.parse(raw); } catch { /* fresh below */ }
  cached = {
    device: typeof s.device === 'string' && /^[a-z0-9]{8,40}$/.test(s.device) ? s.device : newDevice(),
    label: deviceLabel(), lastDay: typeof s.lastDay === 'string' ? s.lastDay : null, lastAt: typeof s.lastAt === 'string' ? s.lastAt : null,
    failedDays: typeof s.failedDays === 'number' && s.failedDays >= 0 ? Math.floor(s.failedDays) : 0, lastFailDay: typeof s.lastFailDay === 'string' ? s.lastFailDay : null,
  };
  if (cached.device !== s.device) writeState(cached);
  return cached;
}
function writeState(s: BackupState) { cached = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked: kept for this visit */ } }

// Whether today's automatic backup is due: signed in and syncing, the saved data readable, and none yet today here.
export const backupDue = (s: Pick<BackupState, 'lastDay'>, k: string, linked: boolean, readable: boolean) => linked && readable && s.lastDay !== k;

const canCompress = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
async function gzip(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function gunzip(bytes: ArrayBuffer): Promise<string> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

type Call = { ok: true; res: Response } | { ok: false; why: BackupResult };
// "Offline" only when the browser says so; anything else that goes wrong (a timeout, a refused request) is a failure.
const offlineNow = () => typeof navigator !== 'undefined' && navigator.onLine === false;
async function call(method: string, query = '', body?: Uint8Array, extra: Record<string, string> = {}): Promise<Call> {
  if (!SYNC.configured) return { ok: false, why: 'not-configured' };
  if (offlineNow()) return { ok: false, why: 'offline' };
  const { session, offline } = await currentSession();
  if (offline) return { ok: false, why: offlineNow() ? 'offline' : 'failed' };
  if (!session) return { ok: false, why: 'signed-out' };
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), WAIT_MS);
  try {
    const res = await fetch(`${SYNC.url}/functions/v1/backup${query}`, {
      method, signal: ctrl.signal, body: body as BodyInit | undefined,
      headers: { apikey: SYNC.key, Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/gzip' } : {}), ...extra },
    });
    if (res.ok) return { ok: true, res };
    let error = '';
    try { error = (await res.json()).error ?? ''; } catch { /* not JSON */ }
    return { ok: false, why: res.status === 401 ? 'signed-out' : error === 'not-found' ? 'not-found' : res.status === 404 || res.status === 503 || error === 'not-configured' ? 'not-configured'
      : res.status === 429 ? 'too-fast' : res.status === 413 ? 'too-large' : error === 'too-many-devices' ? 'too-many-devices' : 'failed' };
  } catch {
    return { ok: false, why: offlineNow() ? 'offline' : 'failed' };
  } finally { clearTimeout(timer); }
}

// Back up now: this device's whole saved data, as "Export my data" makes it.
export async function backUpNow(k: string = todayKey()): Promise<BackupResult> {
  if (getSnapshot().status.kind !== 'ok') return 'failed';
  if (storageBlocked()) return 'storage-blocked';
  if (!canCompress()) return 'unsupported';
  const s = readState();
  let body: Uint8Array;
  try { body = await gzip(exportText().text); } catch { return 'failed'; }
  const r = await call('PUT', `?day=${k}&device=${s.device}`, body, { 'x-myday-device-label': s.label, 'x-myday-version': APP_VERSION });
  const next = readState();
  if (r.ok) writeState({ ...next, lastDay: k, lastAt: new Date().toISOString(), failedDays: 0, lastFailDay: null });
  else if (r.why === 'failed' || r.why === 'too-large' || r.why === 'too-many-devices') writeState({ ...next, failedDays: next.lastFailDay === k ? next.failedDays : next.failedDays + 1, lastFailDay: k });
  emit();
  return r.ok ? 'ok' : r.why;
}

export async function listBackups(): Promise<{ ok: true; backups: BackupInfo[] } | { ok: false; why: BackupResult }> {
  const r = await call('GET');
  if (!r.ok) return r;
  try { const body = await r.res.json(); return { ok: true, backups: Array.isArray(body.backups) ? body.backups : [] }; } catch { return { ok: false, why: 'failed' }; }
}
// One backup's text (the same JSON as an export), or why not.
export async function fetchBackup(key: string): Promise<{ ok: true; text: string } | { ok: false; why: BackupResult }> {
  if (!canCompress()) return { ok: false, why: 'unsupported' };
  const r = await call('GET', '', undefined, { 'x-myday-key': key }); // in a header, so it isn't in request addresses
  if (!r.ok) return r;
  try { return { ok: true, text: await gunzip(await r.res.arrayBuffer()) }; } catch { return { ok: false, why: 'failed' }; }
}
// Every backup of this account, from every device. The true wipe of "delete everything" must call this too.
export async function deleteAllBackups(): Promise<BackupResult> {
  const r = await call('DELETE');
  if (r.ok) { const s = readState(); writeState({ ...s, lastDay: null, lastAt: null, failedDays: 0, lastFailDay: null }); emit(); }
  return r.ok ? 'ok' : r.why;
}

// A file to save on this device (as Export does).
export function saveFile(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Changes to this device's backup state, for the page to show.
const listeners = new Set<() => void>();
export const subscribeBackups = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
function emit() { for (const fn of listeners) fn(); }

// The daily backup: checked about 30 seconds after MyDay opens or comes back to the screen.
let started = false, timer: ReturnType<typeof setTimeout> | null = null, running = false;
export function startDailyBackups() {
  if (started || !SYNC.configured) return;
  started = true;
  const check = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      timer = null;
      if (running || document.visibilityState !== 'visible') return;
      if (!backupDue(readState(), todayKey(), getView().phase === 'linked', getSnapshot().status.kind === 'ok')) return;
      running = true;
      try { await backUpNow(); } finally { running = false; }
    }, DUE_AFTER_MS);
  };
  check();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
}
