import { useEffect } from 'react';
import { update } from '../data/storage';
import type { MyDayData } from '../data/types';
import { connect, connections } from '../data/understand';

// The note you have open, if any (#projects/notes/<id>): it's left alone until you've left it.
function openNote(hash: string): string | null {
  const p = hash.replace('#', '').split('/');
  return p[0] === 'projects' && p[1] === 'notes' && p[2] && p[2] !== 'in' && p[2] !== 'collections' ? decodeURIComponent(p[2]) : null;
}

// MyDay connects notes to projects by itself (1.13.0): a moment after anything changes, a note that clearly belongs to
// a project is linked to it (see data/understand.ts) — and listed under "MyDay connected these" with Undo and Keep.
// Only links: nothing you wrote is changed, and nothing is added to your days or your Calendar.
export function useAutoConnect(data: MyDayData, canSave: boolean, hash: string) {
  useEffect(() => {
    if (!canSave || !connections(data, openNote(hash)).length) return;
    const t = window.setTimeout(() => update(d => (connect(d, openNote(location.hash)) ? undefined : false)), 1500);
    return () => window.clearTimeout(t);
  }, [data, canSave, hash]);
}
