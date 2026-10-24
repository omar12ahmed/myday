// Attached files on the device (specs/files.md): adding them (a record first, as 'uploading'; the bytes straight to R2
// on a short-lived link; the server's check; then 'kept'), a photo's preview, opening, Delete now, and the tidy (files
// in Recently deleted for 30 days go for good; a file nothing lists goes to Recently deleted; an upload that won't finish
// is settled). The rules for what may be kept are shared with the files function
// (supabase/functions/_shared/files/rules.ts). Never sent to AI.
import { cleanName, FILE_TYPES, looksLike, PREVIEWABLE, refusal, THUMB_MAX_BYTES, typeOfName } from '../../../supabase/functions/_shared/files/rules';
import { addFileRecord, dueForPurge, forgetFiles, healFiles, LISTED_AREAS, markOrphans, newFileId, setFileState, unfinished, type Owner } from '../data/files';
import { getSnapshot, update } from '../data/storage';
import type { FileRecord } from '../data/types';
import { currentSession } from './client';
import { SYNC } from './config';
import { getView } from './engine';

// ---------- MD5 (RFC 1321): only so R2 can check that an upload's bytes are the file's (Content-MD5) ----------
const SHIFT = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
export function md5(bytes: Uint8Array): Uint8Array {
  const len = bytes.length, total = Math.ceil((len + 9) / 64) * 64;
  const buf = new Uint8Array(total); buf.set(bytes); buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, (len * 8) >>> 0, true); dv.setUint32(total - 4, Math.floor(len / 0x20000000) >>> 0, true);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const M = new Uint32Array(16);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      const s = SHIFT[(i >> 4) * 4 + (i % 4)];
      B = (B + ((F << s) | (F >>> (32 - s)))) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  const out = new Uint8Array(16), ov = new DataView(out.buffer);
  ov.setUint32(0, a0, true); ov.setUint32(4, b0, true); ov.setUint32(8, c0, true); ov.setUint32(12, d0, true);
  return out;
}
const base64 = (b: Uint8Array) => btoa(Array.from(b, c => String.fromCharCode(c)).join(''));
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');

// ---------- Calling the files function ----------
export type FilesResult = 'ok' | 'not-configured' | 'signed-out' | 'offline' | 'not-allowed' | 'full' | 'not-found' | 'blocked' | 'failed';
const offlineNow = () => typeof navigator !== 'undefined' && navigator.onLine === false;
type Call<T> = { ok: true; data: T } | { ok: false; why: FilesResult; message?: string; error?: string };
async function call<T>(action: string, body: Record<string, unknown> = {}): Promise<Call<T>> {
  if (!SYNC.configured) return { ok: false, why: 'not-configured' };
  if (offlineNow()) return { ok: false, why: 'offline' };
  const { session, offline } = await currentSession();
  if (offline) return { ok: false, why: offlineNow() ? 'offline' : 'failed' };
  if (!session) return { ok: false, why: 'signed-out' };
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(`${SYNC.url}/functions/v1/files`, {
      method: 'POST', signal: ctrl.signal, body: JSON.stringify({ action, ...body }),
      headers: { apikey: SYNC.key, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    });
    let j: Record<string, unknown> = {};
    try { j = await res.json(); } catch { /* not JSON */ }
    if (res.ok && j.ok) return { ok: true, data: j as T };
    const error = typeof j.error === 'string' ? j.error : '', message = typeof j.message === 'string' ? j.message : undefined;
    return { ok: false, message, error, why: res.status === 401 ? 'signed-out' : error === 'not-allowed' ? 'not-allowed' : error === 'full' ? 'full' : error === 'not-found' ? 'not-found'
      : res.status === 404 || res.status === 503 || error === 'not-configured' ? 'not-configured' : 'failed' };
  } catch {
    return { ok: false, why: offlineNow() ? 'offline' : 'failed' };
  } finally { clearTimeout(timer); }
}
// A PUT straight to R2 on the short-lived link, with exactly the headers the server signed (the browser adds the length).
async function put(url: string, headers: Record<string, string>, body: Blob): Promise<boolean> {
  try { return (await fetch(url, { method: 'PUT', headers, body })).ok; } catch { return false; }
}

// ---------- Previews ----------
// A small WebP of a photo (at most 320 px), or null when this browser can't make one.
async function preview(file: Blob): Promise<Uint8Array | null> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 320 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * scale)); c.height = Math.max(1, Math.round(bmp.height * scale));
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    for (const q of [0.8, 0.6, 0.4]) {
      const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/webp', q));
      if (!blob || blob.type !== 'image/webp') return null;
      if (blob.size <= THUMB_MAX_BYTES) return new Uint8Array(await blob.arrayBuffer());
    }
    return null;
  } catch { return null; }
}

// ---------- Adding ----------
// What's happening to files being added on this device, for the cards to show ("Adding…", or why it didn't work).
export interface Progress { name: string; state: 'adding' | 'failed'; message: string }
const progress = new Map<string, Progress>(), pending = new Map<string, { owner: Owner; file: File; area: string }>();
const listeners = new Set<() => void>();
export const subscribeFiles = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
let progressSnapshot: ReadonlyMap<string, Progress> = new Map();
export const getProgress = () => progressSnapshot;
const notify = () => { for (const fn of listeners) fn(); };
function setProgress(id: string, p: Progress | null) {
  if (p) progress.set(id, p); else progress.delete(id);
  progressSnapshot = new Map(progress);
  notify();
}

// ---------- How much is used ----------
// The account's stored total (every file, Recently deleted included until they go) and its limit, from the files
// function: asked when a Files card appears (at most once a minute) and again after adding or deleting. null until
// known (signed out, offline, not set up).
export interface Usage { bytes: number; limit: number }
let usage: Usage | null = null, usageAt = 0, usageAsking: Promise<void> | null = null;
export const getUsage = () => usage;
export async function refreshUsage(force = false): Promise<void> {
  if (usageAsking) { await usageAsking; if (!force) return; }
  if (!force && usage && Date.now() - usageAt < 60_000) return;
  usageAsking = (async () => {
    const r = await call<Usage>('usage');
    if (r.ok && Number.isFinite(r.data.bytes) && Number.isFinite(r.data.limit) && r.data.limit > 0) { usage = { bytes: r.data.bytes, limit: r.data.limit }; usageAt = Date.now(); notify(); }
    else if (!r.ok && (r.why === 'signed-out' || r.why === 'not-configured') && usage) { usage = null; notify(); } // not this account's any more
  })();
  try { await usageAsking; } finally { usageAsking = null; }
}
export const WHY: Record<Exclude<FilesResult, 'ok'>, string> = {
  'not-configured': 'Files aren’t set up yet.',
  'signed-out': 'Adding and opening files needs your account. Sign in first.',
  offline: 'Adding and opening files needs a connection.',
  'not-allowed': 'That file can’t be kept.',
  full: 'Your files are full. Remove some to make room.',
  'not-found': 'That file isn’t stored any more.',
  blocked: 'Your browser blocked the new tab. Allow pop-ups for MyDay, then try again.',
  failed: 'That didn’t work just now. Try again.',
};

// Check one file before anything is saved: its name, size and first bytes. '' when it can be kept here.
export async function checkFile(area: string, file: File): Promise<string> {
  const why = refusal(area, file.name, file.size);
  if (why) return why;
  const type = typeOfName(file.name)!;
  const first = new Uint8Array(await file.slice(0, type.startsWith('text/') ? 1024 : 32).arrayBuffer());
  return looksLike(type, first) ? '' : refusal(area, '', 0) || 'That file isn’t what its name says.';
}

// Add files to a project or a note. Returns how many were kept; anything refused (here, or by the server: not what
// its name says, or no room left) says why in its card.
export async function addFiles(owner: Owner, area: string, files: File[]): Promise<{ kept: number; refused: string[] }> {
  const refused: string[] = [];
  let kept = 0;
  try { for (const file of files) {
    const why = await checkFile(area, file);
    if (why) { refused.push(`${cleanName(file.name)}: ${why}`); continue; }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const id = newFileId(), type = typeOfName(file.name)!;
    const sha256 = hex(await crypto.subtle.digest('SHA-256', bytes));
    if (!update(d => (addFileRecord(d, owner, { id, name: cleanName(file.name), type, size: file.size, sha256, area }) ? undefined : false))) { refused.push(`${cleanName(file.name)}: a project or note keeps at most 50 files.`); continue; }
    pending.set(id, { owner, file, area });
    const r = await send(id, area, file, bytes);
    if (r.kept) kept++; else if (r.refused) refused.push(`${cleanName(file.name)}: ${r.refused}`);
  } } finally { void refreshUsage(true); }
  return { kept, refused };
}
// The upload steps for one recorded file: kept, or not (with the server's reason when it refused the file, which then
// isn't kept at all). When its bytes are already stored (Try again after the server's check didn't answer), it goes
// straight to the check.
type Sent = { kept: boolean; refused?: string };
async function send(id: string, area: string, file: File, bytes?: Uint8Array): Promise<Sent> {
  const name = cleanName(file.name);
  setProgress(id, { name, state: 'adding', message: '' });
  const data = bytes ?? new Uint8Array(await file.arrayBuffer());
  const fail = (message: string, drop = false) => {
    if (drop) { const p = pending.get(id); update(d => { d.files.items = d.files.items.filter(f => f.id !== id); const place = p && (p.owner.kind === 'project' ? d.projects.items.find(x => x.id === p.owner.id) : d.notes.items.find(x => x.id === p.owner.id)); if (place?.fileIds) { place.fileIds = place.fileIds.filter(x => x !== id); if (!place.fileIds.length) delete place.fileIds; } }); pending.delete(id); }
    else update(d => (setFileState(d, id, 'failed') ? undefined : false));
    setProgress(id, drop ? null : { name, state: 'failed', message });
    return drop ? { kept: false, refused: message } : { kept: false };
  };
  const up = await call<{ url: string; headers: Record<string, string> }>('upload', { fileId: id, area, name, size: data.length, md5: base64(md5(data)) });
  if (!up.ok && up.error !== 'exists') return fail(up.message || WHY[up.why as Exclude<FilesResult, 'ok'>] || WHY.failed, up.why === 'not-allowed' || up.why === 'full');
  if (up.ok && !(await put(up.data.url, up.data.headers, file))) return fail(offlineNow() ? WHY.offline : WHY.failed);
  const ok = await call<{ size: number }>('confirm', { fileId: id, area, name });
  if (!ok.ok) return fail(ok.message || WHY[ok.why as Exclude<FilesResult, 'ok'>] || WHY.failed, ok.why === 'not-allowed');
  update(d => (setFileState(d, id, 'kept', ok.data.size) ? undefined : false));
  pending.delete(id);
  setProgress(id, null);
  if (PREVIEWABLE.includes(typeOfName(name) ?? '')) {
    const thumb = await preview(file);
    if (thumb) {
      const t = await call<{ url: string; headers: Record<string, string> }>('thumb', { fileId: id, area, size: thumb.length, md5: base64(md5(thumb)) });
      if (t.ok) await put(t.data.url, t.data.headers, new Blob([thumb as BlobPart], { type: 'image/webp' }));
    }
  }
  return { kept: true };
}
// Try a failed file again (while this page still has it).
export const canRetry = (id: string) => pending.has(id);
export async function retry(id: string): Promise<Sent> {
  const p = pending.get(id);
  if (!p) return { kept: false };
  update(d => { const f = d.files.items.find(x => x.id === id); if (!f || f.state === 'uploading') return false; f.state = 'uploading'; });
  try { return await send(id, p.area, p.file); } finally { void refreshUsage(true); }
}

// ---------- Opening ----------
const links = new Map<string, { url: string; until: number }>();
// A short-lived link to a file (or its preview); kept for a few minutes so a list of previews doesn't ask again.
export async function linkTo(f: Pick<FileRecord, 'id' | 'area'>, thumb = false): Promise<{ ok: true; url: string } | { ok: false; why: FilesResult }> {
  const key = `${f.id}${thumb ? '.thumb' : ''}`, cached = links.get(key);
  if (cached && cached.until > Date.now()) return { ok: true, url: cached.url };
  const r = await call<{ url: string; seconds: number }>('open', { fileId: f.id, area: f.area, thumb });
  if (!r.ok) return r;
  links.set(key, { url: r.data.url, until: Date.now() + Math.max(30, (r.data.seconds || 300) - 60) * 1000 });
  return { ok: true, url: r.data.url };
}
// Open a file: photos and PDFs in a new tab, anything else saved under its name. The tab is opened straight away (so
// the browser allows it) and pointed at the link once it's ready; if the browser blocks it, MyDay stays as it is. A
// document is fetched and then saved, so a failure is told here instead of replacing MyDay with an error page.
export async function openFile(f: FileRecord): Promise<FilesResult> {
  if (FILE_TYPES[f.type]?.inline) {
    const tab = window.open('about:blank', '_blank');
    if (!tab) return 'blocked';
    const r = await linkTo(f);
    if (!r.ok) { tab.close(); return r.why; }
    tab.opener = null; tab.location.href = r.url;
    return 'ok';
  }
  const r = await linkTo(f);
  if (!r.ok) return r.why;
  try {
    const res = await fetch(r.url);
    if (!res.ok) { links.delete(f.id); return res.status === 404 ? 'not-found' : 'failed'; }
    const href = URL.createObjectURL(await res.blob()), a = document.createElement('a');
    a.href = href; a.download = f.name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 60_000);
    return 'ok';
  } catch { return offlineNow() ? 'offline' : 'failed'; }
}

// ---------- Delete now, and the daily tidy ----------
export async function deleteNow(files: FileRecord[]): Promise<FilesResult> {
  if (!files.length) return 'ok';
  const r = await call('delete', { files: files.map(f => ({ fileId: f.id, area: f.area })) });
  if (r.ok) { update(d => (forgetFiles(d, files.map(f => f.id)) ? undefined : false)); void refreshUsage(true); }
  return r.ok ? 'ok' : r.why;
}
// Every file of this account, from R2 (the true wipe of "delete everything" must call this too). Records stay until
// the wipe clears the data.
export async function deleteAllFiles(): Promise<FilesResult> {
  const r = await call('delete-all');
  if (r.ok) void refreshUsage(true);
  return r.ok ? 'ok' : r.why;
}
// The tidy, every 10 minutes while this device is fully in step with your account (nothing waiting to go, no conflict,
// nothing refused), so a file is never judged on changes that have only half arrived: a file a place lists leaves
// Recently deleted; a file nothing lists goes there; an upload that won't finish (or failed, and isn't being retried
// here) is asked about: kept if its bytes arrived and pass the check, otherwise failed; then files whose 30 days are
// over go for good (50 at a time). Files of an area this version can't list are left alone (data/files.ts).
const TIDY_MS = 10 * 60 * 1000;
let tidyStarted = false, lastTidy = 0, tidying = false;
const asked = new Set<string>();
export async function tidyFiles(now = Date.now()) {
  if (tidying || now - lastTidy < TIDY_MS) return;
  const v = getView();
  if (v.phase !== 'linked' || v.status !== 'synced' || getSnapshot().status.kind !== 'ok') return;
  tidying = true; lastTidy = now;
  try {
    update(d => { const healed = healFiles(d), marked = markOrphans(d); return healed || marked ? undefined : false; });
    const check = getSnapshot().data.files.items.filter(f => LISTED_AREAS.includes(f.area) && !pending.has(f.id) && !asked.has(f.id) && (unfinished(f, now) || f.state === 'failed')).slice(0, 10);
    for (const f of check) {
      asked.add(f.id);
      const r = await call<{ size: number }>('confirm', { fileId: f.id, area: f.area, name: f.name });
      if (r.ok) update(d => (setFileState(d, f.id, 'kept', r.data.size) ? undefined : false));
      else if (r.why === 'not-found' || r.why === 'not-allowed') update(d => (setFileState(d, f.id, 'failed') ? undefined : false));
      else { asked.delete(f.id); break; } // offline, signed out…: ask next time
    }
    const due = dueForPurge(getSnapshot().data);
    if (due.length) await deleteNow(due.slice(0, 50));
  } finally { tidying = false; }
}
export function startFileTidy() {
  if (tidyStarted || !SYNC.configured) return;
  tidyStarted = true;
  setInterval(() => { if (document.visibilityState === 'visible') void tidyFiles(); }, 60_000);
}
