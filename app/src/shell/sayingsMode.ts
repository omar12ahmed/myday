import { useSyncExternalStore } from 'react';

// Sayings (the footer's "Sayings: On/Off"): one quiet line per screen. On unless switched off. A choice for this device
// only, kept in the browser as 'myday.sayings' ("off" when off): it isn't part of your MyDay data (myday.data.v4),
// isn't synced and isn't exported. If the browser blocks storage it simply lasts until reload.
const KEY = 'myday.sayings';
let on = (() => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } })();
const listeners = new Set<() => void>();
const tell = () => { for (const fn of listeners) fn(); };
if (typeof window !== 'undefined') window.addEventListener('storage', e => { if (e.key === KEY) { on = e.newValue !== 'off'; tell(); } });
export function setSayings(value: boolean) {
  on = value;
  try { if (value) localStorage.removeItem(KEY); else localStorage.setItem(KEY, 'off'); } catch { /* lasts until reload */ }
  tell();
}
export const useSayings = () => useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => on);
