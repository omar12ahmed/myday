// Attached files on the device (specs/files.md): adding them (a record first, as 'uploading'; the bytes straight to R2
// on a short-lived link; the server's check; then 'kept'), a photo's preview, opening, Delete now, and the tidy (files
// in Recently deleted for 30 days go for good; a file nothing lists goes to Recently deleted; an upload that won't finish
// is settled). The rules for what may be kept are shared with the files function
// (supabase/functions/_shared/files/rules.ts). Never sent to AI.
import { cleanName, FILE_TYPES, looksLike, PART_BYTES, PREVIEWABLE, refusal, SINGLE_PUT_MAX, THUMB_MAX_BYTES, typeOfName, VIDEOS } from '../../../supabase/functions/_shared/files/rules';
import { addFileRecord, dropAdded, dueForPurge, forgetFiles, healFiles, LISTED_AREAS, markOrphans, newFileId, setFileState, unfinished, type Owner } from '../data/files';
import { PORTFOLIO_FILES } from '../data/cybersecurity/types';
import { clearFileCache, forgetCached, forgetCachedExcept } from '../data/fileCache';
import { getSnapshot, update } from '../data/storage';
import type { FileRecord } from '../data/types';
import { currentSession } from './client';
import { SYNC } from './config';
import { checkedThisLoad, getView, syncNow } from './engine';
import { knownEpoch } from './state';

// ---------- MD5 (RFC 1321): only so R2 can check that an upload's bytes are the file's (Content-MD5) ----------
const SHIFT = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
export function md5(bytes: Uint8Array): Uint8Array {
  const st = Uint32Array.of(0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476);
  return md5End(st, bytes, bytes.length);
}
// A big upload's part (specs/projects-content.md): read and hashed 4 MB at a time, so the part is never held whole and
// the page keeps responding between reads.
export async function md5Of(blob: Blob): Promise<Uint8Array> {
  const st = Uint32Array.of(0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476), CHUNK = 4 * 1024 * 1024; // (a multiple of 64)
  let off = 0;
  for (;;) {
    const chunk = new Uint8Array(await blob.slice(off, Math.min(off + CHUNK, blob.size)).arrayBuffer());
    off += chunk.length;
    if (off >= blob.size) return md5End(st, chunk, blob.size);
    md5Blocks(st, new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength), chunk.length);
  }
}
// The last bytes (fewer than a whole number of blocks is fine), padded with the whole length, and the digest.
function md5End(st: Uint32Array, last: Uint8Array, len: number): Uint8Array {
  const whole = last.length - (last.length % 64);
  if (whole) md5Blocks(st, new DataView(last.buffer, last.byteOffset, whole), whole);
  const rest = last.subarray(whole), total = Math.ceil((rest.length + 9) / 64) * 64;
  const buf = new Uint8Array(total); buf.set(rest); buf[rest.length] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, (len * 8) >>> 0, true); dv.setUint32(total - 4, Math.floor(len / 0x20000000) >>> 0, true);
  md5Blocks(st, dv, total);
  const out = new Uint8Array(16), ov = new DataView(out.buffer);
  ov.setUint32(0, st[0], true); ov.setUint32(4, st[1], true); ov.setUint32(8, st[2], true); ov.setUint32(12, st[3], true);
  return out;
}
function md5Blocks(st: Uint32Array, dv: DataView, total: number) {
  let a0 = st[0], b0 = st[1], c0 = st[2], d0 = st[3];
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
  st[0] = a0; st[1] = b0; st[2] = c0; st[3] = d0;
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
      headers: { apikey: SYNC.key, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json', 'x-myday-epoch': String(knownEpoch()) },
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
export interface Progress { name: string; state: 'adding' | 'failed'; message: string; done?: number; of?: number } // done/of: parts sent, for a big file
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
// Kept with the account it's for, so another account signing in never sees it; only the answer to the latest question
// counts (an older one may be from before a delete).
export interface Usage { bytes: number; limit: number; user: string }
let usage: Usage | null = null, usageAt = 0, usageAsks = 0, usageAsking: Promise<void> | null = null;
export const getUsage = () => usage;
export async function refreshUsage(force = false): Promise<void> {
  const user = (await currentSession()).session?.user?.id ?? '';
  if (usage && usage.user !== user) { usage = null; notify(); }
  if (!force && (usageAsking || (usage && Date.now() - usageAt < 60_000))) return usageAsking ?? undefined;
  const n = ++usageAsks;
  const asking = (async () => {
    const r = await call<Omit<Usage, 'user'>>('usage');
    if (n !== usageAsks) return;
    if (r.ok && Number.isFinite(r.data.bytes) && Number.isFinite(r.data.limit) && r.data.limit > 0) { usage = { bytes: r.data.bytes, limit: r.data.limit, user }; usageAt = Date.now(); notify(); }
    else if (!r.ok && (r.why === 'signed-out' || r.why === 'not-configured') && usage) { usage = null; notify(); }
  })();
  usageAsking = asking;
  try { await asking; } finally { if (usageAsking === asking) usageAsking = null; }
}
export const WHY: Record<Exclude<FilesResult, 'ok'>, string> = {
  'not-configured': 'Files aren’t set up yet.',
  'signed-out': 'Adding and opening files needs your account. Sign in first.',
  offline: 'Adding and opening files needs a connection.',
  'not-allowed': 'That file can’t be kept.',
  full: 'Your files are full. To make room, remove files you don’t need, then use Delete now in Recently deleted.',
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
  let kept = 0, sent = false;
  try { for (const file of files) {
    const why = await checkFile(area, file);
    if (why) { refused.push(`${cleanName(file.name)}: ${why}`); continue; }
    // (A big file is never read whole: it goes up in parts, with no hash of the whole file — specs/projects-content.md.)
    const big = file.size > SINGLE_PUT_MAX, bytes = big ? undefined : new Uint8Array(await file.arrayBuffer());
    const id = newFileId(), type = typeOfName(file.name)!;
    const sha256 = bytes ? hex(await crypto.subtle.digest('SHA-256', bytes)) : '';
    if (!update(d => (addFileRecord(d, owner, { id, name: cleanName(file.name), type, size: file.size, sha256, area }) ? undefined : false))) { refused.push(`${cleanName(file.name)}: ${owner.kind === 'portfolio' ? `a portfolio entry keeps at most ${PORTFOLIO_FILES} files` : 'a project or note keeps at most 50 files'}.`); continue; }
    pending.set(id, { owner, file, area });
    sent = true;
    const r = await send(id, area, file, bytes);
    if (r.kept) kept++; else if (r.refused) refused.push(`${cleanName(file.name)}: ${r.refused}`);
  } } finally { if (sent) void refreshUsage(true); }
  return { kept, refused };
}
// The upload steps for one recorded file: kept, or not (with the server's reason when it refused the file, which then
// isn't kept at all). When its bytes are already stored (Try again after the server's check didn't answer), it goes
// straight to the check.
type Sent = { kept: boolean; refused?: string };
async function send(id: string, area: string, file: File, bytes?: Uint8Array): Promise<Sent> {
  const name = cleanName(file.name);
  setProgress(id, { name, state: 'adding', message: '' });
  const fail = (message: string, drop = false) => {
    if (drop) { const p = pending.get(id); update(d => { if (p) dropAdded(d, id, p.owner); else d.files.items = d.files.items.filter(f => f.id !== id); }); pending.delete(id); }
    else update(d => (setFileState(d, id, 'failed') ? undefined : false));
    setProgress(id, drop ? null : { name, state: 'failed', message });
    return drop ? { kept: false, refused: message } : { kept: false };
  };
  if (file.size > SINGLE_PUT_MAX) return sendInParts(id, area, file, name, fail);
  let data: Uint8Array;
  try { data = bytes ?? new Uint8Array(await file.arrayBuffer()); } catch { return fail('That file can’t be read any more. Remove it and add it again.'); }
  const up = await call<{ url: string; headers: Record<string, string> }>('upload', { fileId: id, area, name, size: data.length, md5: base64(md5(data)) });
  if (!up.ok && up.error !== 'exists') return fail(up.message || WHY[up.why as Exclude<FilesResult, 'ok'>] || WHY.failed, up.why === 'not-allowed' || up.why === 'full');
  if (up.ok && !(await put(up.data.url, up.data.headers, file))) return fail(offlineNow() ? WHY.offline : WHY.failed);
  const ok = await call<{ size: number }>('confirm', { fileId: id, area, name });
  if (!ok.ok) return fail(ok.message || WHY[ok.why as Exclude<FilesResult, 'ok'>] || WHY.failed, ok.why === 'not-allowed');
  return kept(id, area, file, name, ok.data.size);
}
// Kept: its record says so, and a photo or video gets its small preview (a video's: a frame from it).
async function kept(id: string, area: string, file: File, name: string, size: number): Promise<Sent> {
  update(d => (setFileState(d, id, 'kept', size) ? undefined : false));
  pending.delete(id);
  setProgress(id, null);
  const type = typeOfName(name) ?? '';
  if (PREVIEWABLE.includes(type) || VIDEOS.includes(type)) {
    const thumb = VIDEOS.includes(type) ? await videoFrame(file) : await preview(file);
    if (thumb) {
      const t = await call<{ url: string; headers: Record<string, string> }>('thumb', { fileId: id, area, size: thumb.length, md5: base64(md5(thumb)) });
      if (t.ok) await put(t.data.url, t.data.headers, new Blob([thumb as BlobPart], { type: 'image/webp' }));
    }
  }
  return { kept: true };
}

// ---------- In parts (specs/projects-content.md) ----------
// A file over 64 MB goes up in 64 MB parts, one read at a time (never the whole file), each on its own signed link
// with its MD5. Where it has got to is kept on this device (`myday.files.parts`: the upload, and each part's ETag),
// so a dropped connection, Try again, or picking the same file again after a reload carries on from there.
const PARTS_KEY = 'myday.files.parts';
interface Sending { uploadId: string; size: number; name: string; etags: Record<string, string> }
const sendings = (): Record<string, Sending> => { try { const v = JSON.parse(localStorage.getItem(PARTS_KEY) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch { return {}; } };
function keepSending(id: string, s: Sending | null) {
  try { const all = sendings(); if (s) all[id] = s; else delete all[id]; localStorage.setItem(PARTS_KEY, JSON.stringify(all)); } catch { /* it starts again next time */ }
}
// A big upload this device started and can carry on, given the same file again.
export const carryingOn = (id: string) => !!sendings()[id];
// Removing an unfinished big upload drops what was sent (R2 would after 7 days anyway) and where it had got to.
export async function dropSending(id: string, area: string) {
  const s = sendings()[id];
  if (!s) return;
  keepSending(id, null);
  await call('mp-abort', { fileId: id, area, uploadId: s.uploadId });
}
async function putPart(url: string, headers: Record<string, string>, body: Blob): Promise<string | null> {
  for (let tries = 0; tries < 3; tries++) {
    try {
      const res = await fetch(url, { method: 'PUT', headers, body });
      if (res.ok) return res.headers.get('ETag');
      if (res.status === 403) return null; // its link has run out: asked for again next time
    } catch { if (offlineNow()) return null; }
    await new Promise(r => setTimeout(r, 1000 * (tries + 1)));
  }
  return null;
}
async function sendInParts(id: string, area: string, file: File, name: string, fail: (message: string, drop?: boolean) => Sent, again = false): Promise<Sent> {
  const count = Math.ceil(file.size / PART_BYTES), sentWords = (n: number) => `${Math.floor((n * 100) / count)}% sent`;
  let s: Sending | undefined = sendings()[id];
  if (s && (s.size !== file.size || s.name !== name)) return fail('That isn’t the same file — pick the one you started with.');
  if (s) {
    // Carrying on: R2 says which parts it has (a part sent but not noted here counts too).
    const l = await call<{ parts: { n: number; etag: string }[] }>('mp-list', { fileId: id, area, uploadId: s.uploadId });
    if (!l.ok && l.why === 'not-found') { keepSending(id, null); if (!again) return sendInParts(id, area, file, name, fail, true); s = undefined; }
    else if (!l.ok) return fail(l.message || WHY[l.why as Exclude<FilesResult, 'ok'>] || WHY.failed);
    else { s.etags = Object.fromEntries(l.data.parts.map(p => [String(p.n), p.etag])); keepSending(id, s); }
  }
  if (!s) {
    const r = await call<{ uploadId: string }>('mp-begin', { fileId: id, area, name, size: file.size });
    if (!r.ok && r.error === 'exists') {
      // Already all there (finished from another try): the usual check.
      const ok = await call<{ size: number }>('confirm', { fileId: id, area, name });
      return ok.ok ? kept(id, area, file, name, ok.data.size) : fail(ok.message || WHY.failed, ok.why === 'not-allowed');
    }
    if (!r.ok) return fail(r.message || WHY[r.why as Exclude<FilesResult, 'ok'>] || WHY.failed, r.why === 'not-allowed' || r.why === 'full');
    s = { uploadId: r.data.uploadId, size: file.size, name, etags: {} };
    keepSending(id, s);
    // (Its 7 days start now, so another device doesn't take a fresh start for an old one.)
    update(d => { const f = d.files.items.find(x => x.id === id); if (!f) return false; f.startedAt = Date.now(); });
  }
  const sending = s;
  for (let n = 1; n <= count; n++) {
    if (sending.etags[String(n)]) continue;
    setProgress(id, { name, state: 'adding', message: sentWords(Object.keys(sending.etags).length), done: Object.keys(sending.etags).length, of: count });
    const part = file.slice((n - 1) * PART_BYTES, Math.min(n * PART_BYTES, file.size));
    let digest: string;
    try { digest = base64(await md5Of(part)); } catch { return fail('That file can’t be read any more. Pick it again to carry on.'); }
    const link = await call<{ parts: { n: number; url: string; headers: Record<string, string> }[] }>('mp-parts', { fileId: id, area, uploadId: sending.uploadId, size: file.size, parts: [{ n, md5: digest }] });
    if (!link.ok) return fail(link.message || WHY[link.why as Exclude<FilesResult, 'ok'>] || WHY.failed);
    const etag = await putPart(link.data.parts[0].url, link.data.parts[0].headers, part);
    if (!etag) return fail(`${offlineNow() ? 'The connection dropped' : 'It stopped'} at ${sentWords(Object.keys(sending.etags).length)}. Try again carries on from there.`);
    sending.etags[String(n)] = etag;
    keepSending(id, sending);
  }
  setProgress(id, { name, state: 'adding', message: 'Finishing…', done: count, of: count });
  const parts = Array.from({ length: count }, (_, i) => ({ n: i + 1, etag: sending.etags[String(i + 1)] }));
  const r = await call<{ size: number }>('mp-done', { fileId: id, area, uploadId: sending.uploadId, name, parts });
  if (!r.ok) {
    const drop = r.why === 'not-allowed' || r.why === 'full';
    if (drop) keepSending(id, null);
    return fail(r.message || WHY[r.why as Exclude<FilesResult, 'ok'>] || WHY.failed, drop);
  }
  keepSending(id, null);
  return kept(id, area, file, name, r.data.size);
}
// A video's preview: a frame a second in (or its first), at most 320 px, as WebP; null when this browser can't.
async function videoFrame(file: File): Promise<Uint8Array | null> {
  const src = URL.createObjectURL(file), v = document.createElement('video'), timers: ReturnType<typeof setTimeout>[] = [];
  const within = (ms: number) => new Promise<never>((_, no) => { timers.push(setTimeout(() => no(new Error('slow')), ms)); });
  try {
    // (preload "auto": a phone may never load a frame for "metadata" alone.)
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = src;
    await Promise.race([new Promise<void>((ok, no) => { v.onloadeddata = () => ok(); v.onerror = () => no(new Error('video')); }), within(15_000)]);
    v.currentTime = Math.min(1, (v.duration || 2) / 2);
    await Promise.race([new Promise<void>(ok => { v.onseeked = () => ok(); }), within(15_000)]);
    const scale = Math.min(1, 320 / Math.max(v.videoWidth, v.videoHeight, 1)), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(v.videoWidth * scale)); c.height = Math.max(1, Math.round(v.videoHeight * scale));
    c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>(ok => c.toBlob(ok, 'image/webp', 0.7));
    const out = blob ? new Uint8Array(await blob.arrayBuffer()) : null;
    return out && out.length <= THUMB_MAX_BYTES ? out : null;
  } catch { return null; } finally { timers.forEach(clearTimeout); URL.revokeObjectURL(src); v.removeAttribute('src'); }
}
// Try a failed file again (while this page still has it).
export const canRetry = (id: string) => pending.has(id);
// After a reload, a big upload carries on once you pick the same file again (it's checked: same name and size).
export async function carryOn(owner: Owner, id: string, area: string, file: File): Promise<Sent> {
  if (pending.has(id)) return retry(id);
  pending.set(id, { owner, file, area });
  return retry(id);
}
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

// ---------- Stored files nothing lists (specs/files.md) ----------
// Files in your storage that no record names, e.g. left by importing an older backup: they count towards what's used
// but nothing shows them. The server leaves out any file a record in your account still names; this device also leaves
// out any it has a record of, any in an area it doesn't know, and any stored less than a week ago by the server's
// clock (another device's upload whose record hasn't been sent yet). Asked only while this device is fully in step,
// at most every 10 minutes, and kept with the account it's for. Deleting asks first, and looks again at that moment.
export interface Unlisted { fileId: string; area: string; size: number }
const WEEK = 7 * 24 * 60 * 60 * 1000;
let unlisted: { user: string; files: Unlisted[] } | null = null, unlistedAt = 0;
export const getUnlisted = () => unlisted;
async function lookForUnlisted(): Promise<{ user: string; files: Unlisted[] } | null> {
  const user = (await currentSession()).session?.user?.id;
  const r = await call<{ files: { fileId: string; area: string; size: number; modified: string | null }[]; now?: string }>('stored');
  if (!user || !r.ok || !Array.isArray(r.data.files)) return null;
  const known = new Set(getSnapshot().data.files.items.map(f => f.id)), now = Date.parse(r.data.now ?? '') || Date.now();
  return { user, files: r.data.files.filter(f => LISTED_AREAS.includes(f.area) && !known.has(f.fileId) && !!f.modified && now - Date.parse(f.modified) > WEEK)
    .map(f => ({ fileId: f.fileId, area: f.area, size: f.size })) };
}
const inStep = () => { const v = getView(); return checkedThisLoad() && v.phase === 'linked' && v.status === 'synced'; };
export async function checkUnlisted(now = Date.now()): Promise<void> {
  if (!inStep() || now - unlistedAt < 10 * 60 * 1000) return;
  unlistedAt = now;
  const found = await lookForUnlisted();
  if (!found) { unlistedAt = 0; return; }
  unlisted = found; notify();
}
// Deletes those you were shown, if they're still unlisted once this device has synced again (a record may have
// arrived since): 'ok' with how many went, and how many turned out to be named after all.
export async function deleteUnlisted(shown: Unlisted[]): Promise<{ result: FilesResult; deleted: number; kept: number }> {
  await syncNow();
  if (!inStep()) return { result: 'failed', deleted: 0, kept: shown.length };
  const fresh = await lookForUnlisted();
  if (!fresh) return { result: 'failed', deleted: 0, kept: shown.length };
  const still = shown.filter(f => fresh.files.some(x => x.fileId === f.fileId));
  for (let i = 0; i < still.length; i += 100) {
    const r = await call('delete', { files: still.slice(i, i + 100).map(f => ({ fileId: f.fileId, area: f.area })), knows: LISTED_AREAS });
    if (!r.ok) return { result: r.why, deleted: i, kept: shown.length - still.length };
  }
  unlisted = { user: fresh.user, files: fresh.files.filter(f => !still.some(x => x.fileId === f.fileId)) }; unlistedAt = Date.now(); notify();
  void refreshUsage(true);
  return { result: 'ok', deleted: still.length, kept: shown.length - still.length };
}

// ---------- Delete now, and the daily tidy ----------
export async function deleteNow(files: FileRecord[]): Promise<FilesResult> {
  if (!files.length) return 'ok';
  const r = await call('delete', { files: files.map(f => ({ fileId: f.id, area: f.area })), knows: LISTED_AREAS });
  if (r.ok) { update(d => (forgetFiles(d, files.map(f => f.id)) ? undefined : false)); void forgetCached(files.map(f => f.id)); void refreshUsage(true); }
  return r.ok ? 'ok' : r.why;
}
// Every file of this account, from R2 (the true wipe of "delete everything" must call this too). Records stay until
// the wipe clears the data.
export async function deleteAllFiles(): Promise<FilesResult> {
  const r = await call('delete-all');
  if (r.ok) { void clearFileCache(); void refreshUsage(true); }
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
  if (!checkedThisLoad() || v.phase !== 'linked' || v.status !== 'synced' || getSnapshot().status.kind !== 'ok') return;
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
    // A portfolio file deleted for good on another device: its copy on this device goes too.
    await forgetCachedExcept(new Set(getSnapshot().data.files.items.map(f => f.id)));
  } finally { tidying = false; }
}
export function startFileTidy() {
  if (tidyStarted || !SYNC.configured) return;
  tidyStarted = true;
  setInterval(() => { if (document.visibilityState === 'visible') void tidyFiles(); }, 60_000);
}
