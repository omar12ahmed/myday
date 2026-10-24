import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { keyOf, shortDate } from '../data/dates';
import { useSync } from './engine';
import { dismissWiped, pendingFor, retryPendingWipe, wipedNotice } from './wipe';

// After Delete everything (specs/delete-everything.md): said once on whatever page opens next, until dismissed, on
// the device it was done on and on every other device as it clears itself. Files or backups still to delete say so.
export function WipedNotice() {
  const user = useSync().account?.id;
  const [w, setW] = useState(wipedNotice), [, setTick] = useState(0), [busy, setBusy] = useState(false);
  const left = pendingFor(user); // only the account that was wiped ever sees (or retries) what's left of it
  if (!w && !left.length) return null;
  const at = w ? new Date(w.at) : null, when = at && !isNaN(at.getTime()) ? shortDate(keyOf(at)) : '';
  async function again() { setBusy(true); await retryPendingWipe(); setBusy(false); setTick(t => t + 1); }
  return (
    <Card tone="notice" className="mb-4" data-s="wiped-notice" role="status">
      {w && <p className="m-0 text-[15px]">{w.from === 'here' ? 'Everything was deleted.' : `Everything was deleted from another device${when ? ` on ${when}` : ''}.`} MyDay is starting again from nothing; you’re still signed in.</p>}
      {left.length > 0 && <p className={`m-0 text-[15px] ${w ? 'mt-2' : ''}`}>Your {left.join(' and ')} couldn’t be deleted yet; MyDay will try again.</p>}
      <div className="flex flex-wrap gap-2 mt-3">
        {left.length > 0 && <Button inline data-action="wipe-retry" disabled={busy} onClick={again}>{busy ? 'Trying…' : 'Try again'}</Button>}
        {w && <Button inline variant="ghost" data-action="wiped-dismiss" onClick={() => { dismissWiped(); setW(null); }}>OK</Button>}
      </div>
    </Card>
  );
}
