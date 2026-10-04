import { useSyncExternalStore } from 'react';

// "Install MyDay": when the browser offers to install MyDay as an app (Chrome on Android, Chrome or Edge on a
// computer), it tells the page first. MyDay keeps that offer so the button in the footer can show it — and shows
// nothing if it's already installed or the browser doesn't offer it (e.g. Safari: use Share → Add to Home Screen).
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let offer: InstallPrompt | null = null;
const listeners = new Set<() => void>();
const changed = () => { for (const fn of listeners) fn(); };
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); offer = e as InstallPrompt; changed(); });
  window.addEventListener('appinstalled', () => { offer = null; changed(); });
}
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const useInstallOffer = () => useSyncExternalStore(subscribe, () => offer !== null);
export async function install(): Promise<boolean> {
  if (!offer) return false;
  const o = offer;
  await o.prompt();
  const { outcome } = await o.userChoice;
  offer = null; changed();
  return outcome === 'accepted';
}
