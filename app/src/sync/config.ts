// Is cloud sync set up in this copy of MyDay? It's set when the app is built (see ../../../supabase/README.md):
//   VITE_SUPABASE_URL              https://<project-ref>.supabase.co
//   VITE_SUPABASE_PUBLISHABLE_KEY  sb_publishable_…   (meant to be public: Row Level Security protects the data)
// Without both, MyDay works exactly as before: everything is saved only in this browser, and nothing about
// sync is shown.
//
// Every VITE_ variable is included in the app that browsers download, so a secret key must never be one.
// vite.config.ts refuses to build with one; this is a second check, so a secret key is never used here.
const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

function isSecretKey(k: string): boolean {
  if (k.startsWith('sb_secret_')) return true;
  const parts = k.split('.');
  if (parts.length !== 3) return false;
  try { return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role'; } catch { return false; }
}
// https only (or http on this computer, for testing).
const urlOk = /^https:\/\/[^/]+$/.test(url) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url);

export const SYNC = {
  url,
  key,
  configured: !!url && !!key && urlOk && !isSecretKey(key),
};
