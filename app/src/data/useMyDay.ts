// Lets React components read the saved data and redraw when it changes (see storage.ts).
import { useSyncExternalStore } from 'react';
import { getSnapshot, subscribe } from './storage';

export function useMyDay() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
