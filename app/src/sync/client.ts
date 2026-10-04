// The connection to your Supabase project: signing in and out, and the two sync functions (see
// ../../../supabase/migrations). The Supabase library is only downloaded once sync is used, so MyDay opens as
// quickly as before for anyone who doesn't use it.
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { SYNC } from './config';

export const AUTH_KEY = 'myday.sync.auth'; // where the Supabase library keeps the sign-in session (this browser only)
const TIMEOUT_MS = 20000;

let clientP: Promise<SupabaseClient> | null = null;
export function client(): Promise<SupabaseClient> {
  if (!clientP) {
    clientP = import('@supabase/supabase-js').then(({ createClient }) => createClient(SYNC.url, SYNC.key, {
      auth: { storageKey: AUTH_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    }));
    clientP.catch(() => { clientP = null; }); // e.g. offline: try loading it again next time
  }
  return clientP;
}

// Was someone signed in here last time? (Read without downloading the library.)
export function hadSession(): boolean {
  try { return localStorage.getItem(AUTH_KEY) !== null; } catch { return false; }
}

export interface Account { id: string; email: string }
export const accountOf = (s: Session | null): Account | null => (s && s.user ? { id: s.user.id, email: s.user.email || '' } : null);

// Signing in: a friendly message if it didn't work.
export async function signIn(email: string, password: string): Promise<{ ok: true; account: Account } | { ok: false; message: string }> {
  try {
    const sb = await client();
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (!error && data.session) return { ok: true, account: accountOf(data.session)! };
    const status = error ? error.status : 0;
    if (error && (error.code === 'invalid_credentials' || status === 400)) return { ok: false, message: "That email and password don't match an account. Check them and try again." };
    if (error && status === 429) return { ok: false, message: 'Too many tries just now. Wait a minute, then try again.' };
    if (!status || status >= 500) return { ok: false, message: UNREACHABLE };
    return { ok: false, message: error ? error.message : "Couldn't sign in." };
  } catch {
    return { ok: false, message: UNREACHABLE };
  }
}
export const UNREACHABLE = "Couldn't reach your account. Check your connection and try again.";

// Signing out on this device only (other devices stay signed in). false = it didn't work (e.g. offline).
export async function signOut(): Promise<boolean> {
  try {
    const sb = await client();
    const { error } = await sb.auth.signOut({ scope: 'local' });
    return !error;
  } catch {
    return false;
  }
}

// The current session (refreshed by the library if it had expired), or null if nobody is signed in.
// `offline` = it couldn't be checked just now (e.g. refreshing it needs the network).
export async function currentSession(): Promise<{ session: Session | null; offline: boolean }> {
  try {
    const sb = await client();
    const { data, error } = await sb.auth.getSession();
    if (error && !data.session && (error.name === 'AuthRetryableFetchError' || !error.status)) return { session: null, offline: true };
    return { session: data.session, offline: false };
  } catch {
    return { session: null, offline: true };
  }
}

export type CallResult<T> =
  | { ok: true; data: T }
  | { ok: false; why: 'network' | 'auth' | 'server' | 'refused'; message: string };

// Calls sync_push or sync_pull with exactly this session's token (checked by the caller to be the right
// account), never whatever session happens to be current. The database also checks `account`.
export async function call<T>(fn: 'sync_push' | 'sync_pull', session: Session, args: Record<string, unknown>): Promise<CallResult<T>> {
  const sb = await client();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const { data, error, status } = await sb.rpc(fn, args).setHeader('Authorization', `Bearer ${session.access_token}`).abortSignal(ctrl.signal);
    if (!error) return { ok: true, data: data as T };
    const message = error.message || '';
    if (!status || /AbortError|Failed to fetch|NetworkError|Load failed|network/i.test(message)) return { ok: false, why: 'network', message };
    if (status === 401 || status === 403 || /JWT|42501/.test(message + error.code)) return { ok: false, why: 'auth', message };
    if (status >= 500) return { ok: false, why: 'server', message };
    return { ok: false, why: 'refused', message };
  } catch (e) {
    return { ok: false, why: 'network', message: String(e) };
  } finally {
    clearTimeout(timer);
  }
}
