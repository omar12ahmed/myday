// Sync's own notes on this device. They live in their own localStorage key, "myday.sync.v1", apart from
// MyDay's data, and only this file reads or writes that key. (MyDay's data is still only ever read and written
// by data/storage.ts.) Every change to the notes happens inside the sync lock (see engine.ts), so two tabs
// never write them at the same time.
import type { Content } from './records';

export const SYNC_KEY = 'myday.sync.v1';

// A change on its way to the cloud. It keeps its id until the cloud answers, so sending it again after a
// lost reply can never apply it twice.
export interface Outgoing {
  id: string;            // the change id (a UUID made here)
  base: number;          // the cloud version this change was made from (0 = the cloud doesn't have it yet)
  del: boolean;          // a deletion
  content: Content | null;
  f: string | null;      // the content's fingerprint
  tries: number;         // how many times it has been sent
}
// The cloud has a different version of a record that was also changed here. Nothing is overwritten
// until you choose which to keep.
export interface Conflict {
  v: number;             // the cloud's version
  del: boolean;          // deleted in the cloud
  content: Content | null;
  by: string | null;     // the device that saved it (its random id)
  at: string | null;     // when the cloud saved it
}
export interface Link {
  user: string;          // the account's id
  email: string;
  linkedAt: string;
  cursor: number;        // the account's change number this device has caught up to
  base: Record<string, { v: number; f: string | null }>; // each record's cloud version as last seen here (f null = deleted)
  out: Record<string, Outgoing>;
  conflicts: Record<string, Conflict>;
  rejected: Record<string, { f: string | null; reason: string }>; // changes the cloud refused (not sent again unless changed)
  review: null | 'import' | 'bulk'; // paused until the changes on this device are reviewed
  lastSynced: string | null;
}
// This device's version of a record, kept when the cloud's version replaced it (download it any time).
export interface Kept { key: string; label: string; content: Content | null; at: string; why: 'setup' | 'conflict' }
export interface SyncState {
  v: 1;
  device: string;
  link: Link | null;
  kept: Kept[];
  before: { email: string } | null; // the account this device synced with before (mentioned when setting up another)
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export const freshState = (): SyncState => ({ v: 1, device: 'd-' + newId().slice(0, 8), link: null, kept: [], before: null });
export const newLink = (user: string, email: string): Link => ({
  user, email, linkedAt: new Date().toISOString(), cursor: 0, base: {}, out: {}, conflicts: {}, rejected: {}, review: null, lastSynced: null,
});

const isObj = (o: unknown): o is Record<string, unknown> => !!o && typeof o === 'object' && !Array.isArray(o);

// The notes, or why they can't be used. 'blocked' = the browser doesn't allow storage at all.
export type Read = { ok: true; state: SyncState } | { ok: false; why: 'blocked' | 'damaged'; raw?: string };
export function readState(): Read {
  let raw: string | null;
  try { raw = localStorage.getItem(SYNC_KEY); } catch { return { ok: false, why: 'blocked' }; }
  if (raw === null) return { ok: true, state: freshState() };
  try {
    const s = JSON.parse(raw);
    if (!isObj(s) || s.v !== 1 || typeof s.device !== 'string' || !Array.isArray(s.kept)) throw new Error('shape');
    const l = s.link;
    if (l !== null && !(isObj(l) && typeof l.user === 'string' && typeof l.cursor === 'number' && isObj(l.base) && isObj(l.out) && isObj(l.conflicts))) throw new Error('shape');
    if (l && !isObj(l.rejected)) l.rejected = {};
    if (l && l.review === undefined) l.review = null;
    return { ok: true, state: s as unknown as SyncState };
  } catch {
    return { ok: false, why: 'damaged', raw };
  }
}

// Saves the notes. false = they couldn't be saved (storage full or blocked); nothing else changes then.
export function writeState(s: SyncState): boolean {
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(s)); return true; } catch { return false; }
}
