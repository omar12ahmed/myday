import { SYNC } from './config';
import type { View } from './engine';
import { readState } from './state';

// Does this device need to sign in before MyDay opens? Only when sync is set up (the published app) and this device
// isn't signed in: never signed in, signed out, signed in but not yet syncing (the review), or signed in to an account
// other than the one it syncs with. A device that syncs opens straight away, even before sign-in is confirmed (so
// it's never held up offline). See SignInGate.tsx.
export function signInRequired(v: View): boolean {
  if (!SYNC.configured) return false;
  if (v.phase === 'signed-out' || v.phase === 'setup' || v.phase === 'other-account') return true;
  if (v.phase === 'starting') { const r = readState(); return !(r.ok && r.state.link); } // a device that syncs opens straight away
  return false;
}
