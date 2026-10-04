// Cloud sync: keeps this device's MyDay data in step with your account (records.ts says which parts, and how).
// Local first: MyDay never waits for the cloud, and everything is saved on this device before it's sent.
//
// 1. Noticing changes. Sync keeps a fingerprint of each record as it was when last in step with the cloud
//    (state.ts: link.base). Any record whose content differs now was changed here — in this app, another tab
//    or the classic MyDay. So the changes waiting to be sent are simply this device's saved data: they survive
//    reloads, going offline and closing the browser.
// 2. Sending. Each changed record goes with the cloud version it was based on and a change id. The cloud applies
//    it only if nobody changed that record since; otherwise nothing is overwritten and you choose (a conflict).
//    A change is noted (state.ts: link.out) before it's sent and keeps its id until the cloud answers, so if a
//    reply is lost, sending it again can't apply it twice.
// 3. Receiving. Then it asks what changed since last time, by the account's change numbers (never device clocks),
//    and saves those records here — unless the record was also changed here, which is a conflict for you to decide.
//    Deletions arrive as deletions, so deleted plans don't come back.
// Everything sync notes is kept per account; a device syncs with one account at a time, and nothing is sent or
// fetched while a different account is signed in. The cloud checks that too.
import { useSyncExternalStore } from 'react';
import { todayKey } from '../data/dates';
import { catchUp, getSnapshot, subscribe as onData, updateSaved } from '../data/storage';
import { toast } from '../data/toast';
import { accountOf, call, client, currentSession, hadSession, signIn, signOut, type Account } from './client';
import { SYNC } from './config';
import { ALL_KINDS, cleanRecord, fingerprint, isStarter, keyOf, localRecords, putRecord, recordLabel, sortKeys, splitKey, type Content, type Kind } from './records';
import { freshState, newId, newLink, readState, SYNC_KEY, writeState, type Conflict, type Link, type SyncState } from './state';

const KINDS: Kind[] = ALL_KINDS;
const BATCH = 100;           // changes per request (the cloud accepts up to 100)
const PAGE = 500;            // records per "what changed" request
const BULK = 30;             // this many changed records at once (e.g. after restoring a backup) are reviewed first
const RETRY = [5, 15, 30, 60, 120, 300]; // seconds to wait after a failed try, then every 5 minutes
const REFRESH_MS = 5 * 60 * 1000;          // check the cloud this often while MyDay is open

// ---------- What the screens show ----------
export type Phase =
  | 'off'            // sync isn't set up in this copy of MyDay
  | 'starting'
  | 'signed-out'
  | 'setup'          // signed in; this device hasn't started syncing with this account yet
  | 'other-account'  // signed in to a different account from the one this device syncs with
  | 'linked'
  | 'unavailable'    // this browser doesn't allow storage
  | 'notes-damaged'; // sync's notes on this device can't be read
export type Status = 'local' | 'syncing' | 'synced' | 'attention';
export const STATUS_LABEL: Record<Status, string> = { local: 'Saved locally', syncing: 'Syncing', synced: 'Synced', attention: 'Needs attention' };
export type Problem = null | 'offline' | 'server' | 'auth' | 'storage' | 'paused' | 'not-ready';
export interface View {
  phase: Phase;
  status: Status;
  settled: Status;              // the status, leaving out "Syncing" in between (what screen readers hear)
  account: Account | null;      // signed in as
  linkedEmail: string | null;   // the account this device syncs with
  pending: number;              // records changed here that aren't in the cloud yet
  conflicts: string[];
  rejected: { key: string; reason: string }[];
  review: null | 'import' | 'bulk';
  problem: Problem;
  message: string;              // more about the problem, if any
  retryAt: number | null;
  lastSynced: string | null;
  kept: number;
  before: string | null;        // the account this device synced with before
}

let view: View = {
  phase: SYNC.configured ? 'starting' : 'off', status: 'local', settled: 'local', account: null, linkedEmail: null, pending: 0, conflicts: [], rejected: [],
  review: null, problem: null, message: '', retryAt: null, lastSynced: null, kept: 0, before: null,
};
const listeners = new Set<() => void>();
const subscribeView = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const getView = () => view;
export function useSync(): View { return useSyncExternalStore(subscribeView, getView); }

let syncing = false, showSyncing = false; // "Syncing" is only shown if it takes a moment, so it doesn't flicker
let lastPullAt = 0;
let account: Account | null = null;
let authKnown = false; // false until the sign-in library has said who (if anyone) is signed in
let problem: Problem = null, message = '', retryAt: number | null = null, failures = 0;

// Records changed here since they were last in step with the cloud (not counting undecided conflicts).
function changedKeys(link: Link, local: Map<string, Content>): string[] {
  const keys = new Set([...local.keys(), ...Object.keys(link.base)]);
  const out: string[] = [];
  for (const key of keys) {
    if (!KINDS.includes(splitKey(key).kind)) continue;
    const f = fingerprint(local.get(key));
    if (f === (link.base[key] ? link.base[key].f : null)) continue;
    if (link.conflicts[key]) continue;
    const rej = link.rejected[key];
    if (rej && rej.f === f) continue; // refused by the cloud: not sent again unless it changes
    out.push(key);
  }
  return out;
}

// Works out what to show from sync's notes and this device's data.
function publish(phaseOverride?: Phase) {
  if (!SYNC.configured) return;
  const read = readState();
  const st = read.ok ? read.state : null;
  const link = st && st.link;
  let phase: Phase = phaseOverride
    || (!read.ok ? (read.why === 'blocked' ? 'unavailable' : 'notes-damaged')
    : !account ? (authKnown || !hadSession() ? 'signed-out' : 'starting')
    : !link ? 'setup'
    : link.user !== account.id ? 'other-account'
    : 'linked');
  const snap = getSnapshot();
  const pending = link && snap.status.kind === 'ok' ? new Set([...changedKeys(link, localRecords(snap.data)), ...Object.keys(link.out)]).size : 0;
  const conflicts = link ? sortKeys(Object.keys(link.conflicts)) : [];
  const rejected = link ? Object.entries(link.rejected).map(([key, r]) => ({ key, reason: r.reason })) : [];
  const review = link ? link.review : null;
  const paused = phase === 'linked' && snap.status.kind !== 'ok';
  const p: Problem = paused ? 'paused' : problem;
  let status: Status;
  if (phase === 'linked') {
    status = syncing && showSyncing ? 'syncing'
      : conflicts.length || rejected.length || review || p === 'auth' || p === 'storage' || p === 'paused' || p === 'not-ready' ? 'attention'
      : pending || p ? 'local'
      : link && link.lastSynced ? 'synced' : 'local';
  } else status = phase === 'other-account' || phase === 'unavailable' || phase === 'notes-damaged' ? 'attention' : 'local';
  view = {
    phase, status, settled: status === 'syncing' ? view.settled : status, account, linkedEmail: link ? link.email : null, pending, conflicts, rejected, review,
    problem: phase === 'linked' ? p : null, message: phase === 'linked' ? message : '', retryAt: phase === 'linked' ? retryAt : null,
    lastSynced: link ? link.lastSynced : null, kept: st ? st.kept.length : 0, before: st && st.before ? st.before.email : null,
  };
  for (const fn of listeners) fn();
}

// ---------- One sync at a time (across tabs too) ----------
let tabChain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request('myday-sync', () => fn()) as Promise<T>;
  const run = tabChain.then(fn, fn);
  tabChain = run.catch(() => {});
  return run;
}

// ---------- Scheduling ----------
// Why a sync runs. 'change' = something was saved on this device: if none of it is a synced record and the
// cloud was checked recently, there's nothing to do (so typing a Study note doesn't keep asking the cloud).
type Reason = 'change' | 'check';
let timer: ReturnType<typeof setTimeout> | undefined, timerReason: Reason = 'change';
let running = false, again: Reason | null = null, applying = false;
function schedule(ms: number, reason: Reason = 'check') {
  if (timer !== undefined && timerReason === 'check') reason = 'check'; // a waiting full check isn't downgraded
  clearTimeout(timer);
  timerReason = reason;
  timer = setTimeout(() => { timer = undefined; void run(reason); }, ms);
}
const mayConnect = () => { const r = readState(); return (r.ok && !!r.state.link) || hadSession(); };
export async function run(reason: Reason = 'check'): Promise<void> {
  if (!SYNC.configured) return;
  if (!connected) {
    if (!mayConnect()) { publish(); return; } // nobody has signed in here: the sign-in library isn't even loaded
    await connect();
    if (!connected) return;
  }
  if (running) { again = again === 'check' || reason === 'check' ? 'check' : 'change'; return; }
  running = true;
  const show = setTimeout(() => { showSyncing = true; if (syncing) publish(); }, 600);
  try {
    await withLock(() => runLocked(reason));
  } catch (e) {
    problem = 'server'; message = String(e);
  } finally {
    clearTimeout(show);
    running = false;
    syncing = false;
    showSyncing = false;
    publish();
    if (again) { const r = again; again = null; schedule(300, r); }
  }
}

function failed(why: 'network' | 'auth' | 'server' | 'refused', msg: string) {
  if (why === 'auth') { problem = 'auth'; message = 'Please sign in again to keep syncing.'; retryAt = null; return; }
  if (why === 'refused') {
    problem = 'not-ready';
    message = /PGRST202|Could not find the function/i.test(msg)
      ? "Your Supabase project isn't set up for MyDay yet (its database changes haven't been applied)."
      : `The cloud refused the request: ${msg}`;
    retryAt = null;
    return;
  }
  problem = why === 'network' ? 'offline' : 'server';
  message = why === 'network' ? "Couldn't reach your account." : 'Your account had a problem answering.';
  const wait = RETRY[Math.min(failures, RETRY.length - 1)];
  failures++;
  retryAt = Date.now() + wait * 1000;
  schedule(wait * 1000);
}

function succeeded() { problem = null; message = ''; retryAt = null; failures = 0; }

interface Row { kind: Kind; record_id: string; version: number; deleted: boolean; data: unknown; seq: number; updated_at: string | null; updated_by: string | null }
interface Result { change_id: string; status: 'applied' | 'conflict' | 'rejected'; version?: number; deleted?: boolean; data?: unknown; reason?: string }

async function runLocked(reason: Reason) {
  catchUp(); // work from the latest saved data, never an older copy
  const read = readState();
  if (!read.ok) return;
  const st = read.state;
  const { session, offline } = await currentSession();
  if (offline) { failed('network', ''); return; }
  account = accountOf(session);
  authKnown = true;
  if (!account || !session) return;
  const link = st.link;
  if (!link || link.user !== account.id) return; // set up, or a different account: nothing is sent or fetched
  if (getSnapshot().status.kind !== 'ok') return;  // saving is paused on this device: sync waits too
  if (link.review) return;                         // waiting for you to review the changes first

  // 1. Note the changes made here (before sending anything). A lot at once (e.g. a backup restored in the
  // classic MyDay) is reviewed first, so one device's whole copy is never sent over the account's by surprise.
  const local = localRecords(getSnapshot().data);
  const changed = changedKeys(link, local).filter(k => !link.out[k]);
  if (changed.length > BULK) {
    link.review = 'bulk';
    writeState(st);
    return;
  }
  noteOutgoing(link, local, changed);
  if (reason === 'change' && !Object.keys(link.out).length && Date.now() - lastPullAt < 2 * 60 * 1000) return;
  syncing = true;
  publish();

  // 2. Send them, a batch at a time. Each is noted as sent before it goes.
  const keys = sortKeys(Object.keys(link.out));
  for (let i = 0; i < keys.length; i += BATCH) {
    const batch = keys.slice(i, i + BATCH);
    for (const k of batch) link.out[k].tries++;
    if (!writeState(st)) { problem = 'storage'; message = "This device's storage is full, so changes can't be sent safely."; return; }
    const changes = batch.map(k => {
      const o = link.out[k], { kind, id } = splitKey(k);
      return { change_id: o.id, kind, record_id: id, base_version: o.base, deleted: o.del, data: o.del ? null : o.content };
    });
    const res = await call<Result[]>('sync_push', session, { account: link.user, changes, device: st.device });
    if (!res.ok) { failed(res.why, res.message); writeState(st); return; } // the changes stay noted, and are sent again with the same ids
    catchUp();
    const now = localRecords(getSnapshot().data);
    for (const r of res.data) {
      const key = batch.find(k => link.out[k] && link.out[k].id === r.change_id);
      if (!key) continue;
      const o = link.out[key];
      delete link.out[key];
      if (r.status === 'applied') {
        link.base[key] = { v: r.version!, f: o.f };
        delete link.rejected[key];
      } else if (r.status === 'conflict') {
        noteCloudVersion(link, key, now.get(key) ?? null, { v: r.version!, del: !!r.deleted, content: r.deleted ? null : cleanRecord(key, r.data), by: null, at: null });
      } else {
        link.rejected[key] = { f: o.f, reason: r.reason || 'Not accepted.' };
      }
    }
    if (!writeState(st)) { problem = 'storage'; message = "This device's storage is full."; return; }
  }

  // 3. Fetch what changed in the cloud since last time, and save it here.
  for (;;) {
    const res = await call<Row[]>('sync_pull', session, { account: link.user, since: link.cursor, max_rows: PAGE });
    if (!res.ok) { failed(res.why, res.message); return; }
    const rows = res.data.filter(r => KINDS.includes(r.kind));
    if (res.data.length) {
      const ok = await applyRows(st, link, rows, res.data[res.data.length - 1].seq);
      if (!ok) { schedule(1500); return; } // couldn't save just now (e.g. another tab saved first): try again shortly
    }
    if (res.data.length < PAGE) break;
  }
  lastPullAt = Date.now();
  link.lastSynced = new Date().toISOString();
  writeState(st);
  succeeded();
}

// Notes changes as on their way, each with a new change id and the cloud version it was based on.
function noteOutgoing(link: Link, local: Map<string, Content>, keys: string[]) {
  for (const key of keys) {
    const content = local.get(key) ?? null;
    link.out[key] = { id: newId(), base: link.base[key] ? link.base[key].v : 0, del: !content, content, f: fingerprint(content), tries: 0 };
  }
}

// The cloud has version `cloud` of a record whose content here is `here`. Equal → nothing to decide; else a conflict.
function noteCloudVersion(link: Link, key: string, here: Content | null, cloud: Conflict) {
  const cf = fingerprint(cloud.content);
  if (fingerprint(here) === cf) { link.base[key] = { v: cloud.v, f: cf }; delete link.conflicts[key]; return; }
  link.conflicts[key] = cloud;
}

// Saves records from the cloud here, in one save. Sync's notes change only if that save worked.
async function applyRows(st: SyncState, link: Link, rows: Row[], lastSeq: number): Promise<boolean> {
  catchUp();
  const next: Link = structuredClone(link);
  const today = todayKey();
  let touchesToday = false;
  applying = true;
  let result: ReturnType<typeof updateSaved>;
  try {
    result = updateSaved(draft => {
      const local = localRecords(draft);
      let changed = false;
      for (const row of rows) {
        const key = keyOf(row.kind, row.record_id);
        const known = next.base[key];
        if (known && row.version <= known.v) continue; // already have this version (e.g. it was sent from here)
        if (next.out[key]) continue;                    // a change from here is still on its way: sorted out next time
        const clean = row.deleted ? null : cleanRecord(key, row.data);
        if (!row.deleted && !clean) continue;           // nothing usable in it
        const cloud: Conflict = { v: row.version, del: row.deleted, content: clean, by: row.updated_by, at: row.updated_at };
        const here = local.get(key) ?? null;
        if (next.conflicts[key]) { noteCloudVersion(next, key, here, cloud); continue; } // still undecided: keep the newest cloud version
        if (fingerprint(here) === (known ? known.f : null)) {
          // Unchanged here since last in step, so the cloud's newer version simply replaces it.
          putRecord(draft, key, clean);
          next.base[key] = { v: row.version, f: fingerprint(clean) };
          changed = true;
          if (key === keyOf('day', today) || key === keyOf('context', today)) touchesToday = true;
        } else {
          noteCloudVersion(next, key, here, cloud); // changed in both places: you decide
        }
      }
      if (!changed) return false;
    }, () => touchesToday); // today's plan changed: anything you were in the middle of on Today was based on the older one
  } finally {
    applying = false;
  }
  if (result === 'not-saved') return false;
  if (touchesToday) toast('Updated with changes from your other device.');
  next.cursor = Math.max(next.cursor, lastSeq);
  Object.assign(link, next); // link is st.link
  return writeState(st);
}

// ---------- Starting ----------
let started = false;
export function startSync() {
  if (!SYNC.configured || started) return;
  started = true;
  const read = readState();
  const linked = read.ok && read.state.link;
  // The Supabase library is only loaded now if this device syncs or someone signed in here before.
  if (linked || hadSession()) void connect();
  else publish('signed-out');
  let pendingTimer: ReturnType<typeof setTimeout> | undefined;
  onData(() => {
    if (applying) return;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => { publish(); schedule(1500, 'change'); }, 300);
  });
  const back = () => { if (document.visibilityState === 'visible') schedule(0); };
  document.addEventListener('visibilitychange', back);
  window.addEventListener('online', () => schedule(0));
  window.addEventListener('pageshow', e => { if (e.persisted) schedule(0); });
  window.addEventListener('storage', e => { if (e.key === SYNC_KEY) publish(); });
  setInterval(() => { if (document.visibilityState === 'visible' && view.phase === 'linked') void run(); }, REFRESH_MS);
}

let connected: Promise<void> | null = null;
function connect(): Promise<void> {
  if (!connected) {
    connected = client().then(sb => {
      // Sign-ins, sign-outs and refreshed sessions, here or in another tab. (Nothing else may run inside this
      // callback, so the current session is read again just after.)
      sb.auth.onAuthStateChange(() => { setTimeout(() => { void refreshAccount(); }, 0); });
    }).catch(() => { connected = null; problem = 'offline'; message = "Couldn't load sync. It will try again when you're back online."; publish(); });
  }
  return connected;
}
async function refreshAccount() {
  const { session, offline } = await currentSession();
  if (!offline) {
    const next = accountOf(session);
    if ((next && next.id) !== (account && account.id)) succeeded();
    account = next;
    authKnown = true;
  }
  publish();
  void run();
}

// ---------- Actions from the sync screen ----------
export async function syncNow() { failures = 0; await connect(); await run(); }

export async function doSignIn(email: string, password: string): Promise<string | null> {
  await connect();
  const r = await signIn(email, password);
  if (!r.ok) return r.message;
  account = r.account;
  authKnown = true;
  succeeded();
  publish();
  void run();
  return null;
}

export async function doSignOut(): Promise<boolean> {
  if (!(await signOut())) return false;
  account = null;
  succeeded();
  publish('signed-out');
  return true;
}

// Stop syncing on this device: its data stays exactly as it is; sync's notes for that account are forgotten.
export async function stopSyncing() {
  await withLock(async () => {
    const read = readState();
    const st = read.ok ? read.state : freshState();
    if (st.link) st.before = { email: st.link.email };
    st.link = null;
    writeState(st);
  });
  succeeded();
  publish();
}

// After importing a backup: sync waits until you've reviewed what it would change in your account.
export async function noteImported() {
  if (!SYNC.configured) return;
  await withLock(async () => {
    const read = readState();
    if (!read.ok || !read.state.link) return;
    read.state.link.review = 'import';
    writeState(read.state);
  });
  publish();
}

// A conflict: keep this device's version (sent to the cloud) or use the cloud's (this device's is kept aside).
export async function resolveConflicts(keys: string[], choice: 'here' | 'cloud'): Promise<boolean> {
  let ok = true;
  await withLock(async () => {
    catchUp();
    const read = readState();
    if (!read.ok || !read.state.link) { ok = false; return; }
    const st = read.state, link = st.link!;
    const todo = keys.filter(k => link.conflicts[k]);
    if (choice === 'cloud') {
      const local = localRecords(getSnapshot().data);
      const at = new Date().toISOString();
      const keep = todo.filter(k => local.get(k));
      for (const k of keep) st.kept.push({ key: k, label: recordLabel(k), content: local.get(k)!, at, why: 'conflict' });
      if (!writeState(st)) { ok = false; return; } // this device's versions are kept before anything is replaced
      const touchesToday = todo.some(k => k === keyOf('day', todayKey()) || k === keyOf('context', todayKey()));
      applying = true;
      let r: ReturnType<typeof updateSaved>;
      try { r = updateSaved(draft => { for (const k of todo) putRecord(draft, k, link.conflicts[k].content); }, touchesToday); }
      finally { applying = false; }
      if (r === 'not-saved') { st.kept.splice(st.kept.length - keep.length, keep.length); writeState(st); ok = false; return; }
    }
    for (const k of todo) {
      const c = link.conflicts[k];
      link.base[k] = { v: c.v, f: c.del ? null : fingerprint(c.content) };
      delete link.conflicts[k];
    }
    writeState(st);
  });
  publish();
  void run();
  return ok;
}

// Forget a refused change (it isn't sent again unless the record changes).
export async function dismissRejected(key: string) {
  await withLock(async () => {
    const read = readState();
    if (!read.ok || !read.state.link) return;
    const link = read.state.link;
    const rej = link.rejected[key];
    if (rej) link.base[key] = { v: link.base[key] ? link.base[key].v : 0, f: rej.f };
    delete link.rejected[key];
    writeState(read.state);
  });
  publish();
}

// This device's versions that the cloud's replaced, as a file to keep.
export function keptFile(): { filename: string; text: string } | null {
  const read = readState();
  if (!read.ok || !read.state.kept.length) return null;
  const payload = { format: 'myday-sync-kept', note: "This device's versions of records that were replaced by your account's versions.", items: read.state.kept };
  return { filename: `myday-replaced-${todayKey()}.json`, text: JSON.stringify(payload, null, 2) };
}
export async function clearKept() {
  await withLock(async () => { const read = readState(); if (read.ok) { read.state.kept = []; writeState(read.state); } });
  publish();
}

// ---------- Reviewing before syncing (the first time, or after a backup was imported) ----------
export interface ReviewItem {
  key: string;
  label: string;
  here: Content | null;   // this device's version (null = not here)
  cloud: Content | null;  // the account's version (null = not there, or deleted)
  cloudDeleted: boolean;
  // download: the account's version will be saved here · upload: this device's will be sent · same: nothing to do
  // differ: both have a version and they're different — you choose
  action: 'download' | 'upload' | 'same' | 'differ';
  suggest: 'here' | 'cloud' | null;
  why: string;
}
export interface Review {
  account: Account;
  items: ReviewItem[];
  cursor: number;                          // the account's latest change number when the review was made
  rows: Record<string, { v: number; f: string | null }>; // every record in the account
  localF: Record<string, string | null>;   // this device's records when the review was made
  before: string | null;                   // the account this device synced with before, if different
}

async function fetchAll(session: NonNullable<Awaited<ReturnType<typeof currentSession>>['session']>, user: string): Promise<{ rows: Row[]; cursor: number } | { error: string }> {
  const rows: Row[] = [];
  let since = 0;
  for (;;) {
    const res = await call<Row[]>('sync_pull', session, { account: user, since, max_rows: PAGE });
    if (!res.ok) {
      return { error: res.why === 'network' ? "Couldn't reach your account. Check your connection and try again."
        : res.why === 'refused' && /PGRST202|Could not find the function/i.test(res.message) ? "Your Supabase project isn't set up for MyDay yet (its database changes haven't been applied)."
        : res.why === 'auth' ? 'Please sign in again.' : 'Your account had a problem answering. Please try again.' };
    }
    rows.push(...res.data);
    if (res.data.length) since = res.data[res.data.length - 1].seq;
    if (res.data.length < PAGE) return { rows, cursor: since };
  }
}

export async function prepareReview(): Promise<{ ok: true; review: Review } | { ok: false; message: string }> {
  await connect();
  const { session } = await currentSession();
  const acct = accountOf(session);
  if (!session || !acct) return { ok: false, message: 'Please sign in first.' };
  const read = readState();
  const st = read.ok ? read.state : freshState();
  if (st.link && st.link.user !== acct.id) return { ok: false, message: 'This device syncs with a different account. Stop syncing with it first.' };
  const all = await fetchAll(session, acct.id);
  if ('error' in all) return { ok: false, message: all.error };
  catchUp();
  const snap = getSnapshot();
  if (snap.status.kind !== 'ok') return { ok: false, message: "This device's saved data needs sorting out first (see Today)." };
  const local = localRecords(snap.data);
  const base = st.link ? st.link.base : {};
  const cloud = new Map<string, Row>();
  for (const r of all.rows) if (KINDS.includes(r.kind)) cloud.set(keyOf(r.kind, r.record_id), r);
  const rows: Review['rows'] = {};
  const items: ReviewItem[] = [];
  const localF: Review['localF'] = {};
  for (const key of new Set([...local.keys(), ...cloud.keys()])) {
    const here = local.get(key) ?? null, row = cloud.get(key);
    const cloudContent = row && !row.deleted ? cleanRecord(key, row.data) : null;
    const hf = fingerprint(here), cf = fingerprint(cloudContent);
    localF[key] = hf;
    if (row) rows[key] = { v: row.version, f: cf };
    if (!here && !cloudContent) continue;
    const item: ReviewItem = { key, label: recordLabel(key), here, cloud: cloudContent, cloudDeleted: !!row && row.deleted, action: 'same', suggest: null, why: '' };
    if (hf === cf) item.action = 'same';
    else if (!row) { item.action = 'upload'; item.why = 'Only on this device'; }
    else if (!here) { item.action = 'download'; item.why = 'Only in your account'; }
    else {
      const b = base[key];
      if (b && hf === b.f && row.version > b.v) { item.action = 'download'; item.why = row.deleted ? 'Deleted on another device' : 'Changed on another device'; }
      else if (b && row.version === b.v) { item.action = 'upload'; item.why = 'Changed on this device'; }
      else {
        item.action = 'differ';
        item.why = row.deleted ? 'Deleted in your account, still on this device' : 'Different on this device and in your account';
        if (isStarter(key, here) && !row.deleted) { const kind = splitKey(key).kind; item.suggest = 'cloud'; item.why += kind === 'list' ? ' (this device still has the starter list)' : kind === 'queue' ? ' (nothing waiting on this device)' : " (this device still has a new MyDay's)"; }
      }
    }
    items.push(item);
  }
  const order = sortKeys(items.map(i => i.key));
  items.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  const before = !st.link && st.before && st.before.email !== acct.email ? st.before.email : null;
  return { ok: true, review: { account: acct, items, cursor: all.cursor, rows, localF, before } };
}

// Applies a review once you've confirmed it. `choices` says which version to keep for each 'differ' item.
export async function applyReview(review: Review, choices: Record<string, 'here' | 'cloud'>): Promise<{ ok: true } | { ok: false; message: string; stale?: boolean }> {
  if (review.items.some(i => i.action === 'differ' && !choices[i.key])) return { ok: false, message: 'Choose a version for each record that differs.' };
  const out = await withLock(async (): Promise<{ ok: true } | { ok: false; message: string; stale?: boolean }> => {
    const { session } = await currentSession();
    const acct = accountOf(session);
    if (!session || !acct || acct.id !== review.account.id) return { ok: false, message: 'You were signed out, or another account signed in. Please review again.', stale: true };
    // Nothing may have changed on this device or in the account since the review was made.
    catchUp();
    const snap = getSnapshot();
    if (snap.status.kind !== 'ok') return { ok: false, message: "This device's saved data can't be changed just now." };
    const local = localRecords(snap.data);
    const nowKeys = new Set([...local.keys(), ...Object.keys(review.localF)]);
    for (const k of nowKeys) if (fingerprint(local.get(k)) !== (review.localF[k] ?? null)) return { ok: false, message: 'Something changed on this device while you were looking. Here is the review again.', stale: true };
    const check = await call<Row[]>('sync_pull', session, { account: acct.id, since: review.cursor, max_rows: 1 });
    if (!check.ok) return { ok: false, message: check.why === 'network' ? "Couldn't reach your account. Nothing has changed — try again." : 'Your account had a problem answering. Nothing has changed — try again.' };
    if (check.data.length) return { ok: false, message: 'Something changed in your account while you were looking. Here is the review again.', stale: true };

    const read = readState();
    const st = read.ok ? read.state : freshState();
    if (st.link && st.link.user !== acct.id) return { ok: false, message: 'This device syncs with a different account.' };
    const take = review.items.filter(i => i.action === 'download' || (i.action === 'differ' && choices[i.key] === 'cloud'));
    // 1. This device's versions that are about to be replaced are kept first.
    const at = new Date().toISOString();
    const keep = take.filter(i => i.here && i.action === 'differ');
    for (const i of keep) st.kept.push({ key: i.key, label: i.label, content: i.here, at, why: 'setup' });
    if (keep.length && !writeState(st)) return { ok: false, message: "This device's storage is full, so nothing was changed." };
    // 2. The account's versions are saved here.
    if (take.length) {
      applying = true;
      let r: ReturnType<typeof updateSaved>;
      try { r = updateSaved(draft => { for (const i of take) putRecord(draft, i.key, i.cloud); }, true); }
      finally { applying = false; }
      if (r === 'not-saved') {
        if (keep.length) { st.kept.splice(st.kept.length - keep.length, keep.length); writeState(st); }
        return { ok: false, message: "Couldn't save on this device just now, so nothing was changed. Please try again.", stale: true };
      }
    }
    // 3. Then this device starts syncing with the account, and the records you chose to send from here are noted
    // as on their way (so they're sent even if this is interrupted, and aren't mistaken for a surprise bulk change).
    const link = newLink(acct.id, acct.email);
    link.cursor = review.cursor;
    for (const [k, b] of Object.entries(review.rows)) link.base[k] = { v: b.v, f: b.f };
    if (st.link && st.link.lastSynced) link.lastSynced = st.link.lastSynced;
    const nowLocal = localRecords(getSnapshot().data);
    noteOutgoing(link, nowLocal, changedKeys(link, nowLocal));
    st.link = link;
    st.before = null;
    if (!writeState(st)) return { ok: false, message: "This device's storage is full, so syncing couldn't start." };
    return { ok: true };
  });
  succeeded();
  publish();
  if (out.ok) await run();
  return out;
}
