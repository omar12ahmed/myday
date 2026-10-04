import { useSyncExternalStore } from 'react';

// Focus mode (the switch in the top bar): Today shows only what's next — the task to do now and the focus timer.
// A choice for this device only, kept in the browser as 'myday.focus' ("1" when on): it isn't part of your MyDay
// data (myday.data.v4), isn't synced and isn't exported. If the browser blocks storage it simply lasts until reload.
const KEY = 'myday.focus';
let on = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();
const listeners = new Set<() => void>();
const tell = () => { for (const fn of listeners) fn(); };
if (typeof window !== 'undefined') window.addEventListener('storage', e => { if (e.key === KEY) { on = e.newValue === '1'; tell(); } });
export function setFocusMode(value: boolean) {
  on = value;
  try { if (value) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch { /* lasts until reload */ }
  tell();
}
export const useFocusMode = () => useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => on);
