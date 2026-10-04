import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useSync } from './engine';
import { SyncScreen } from './SyncScreen';

// Sign in first (from 1.9.0). When sync is set up (the published app), a device that isn't signed in — a new one,
// or one you signed out on — shows this instead of MyDay, so what you see is always your own account's MyDay.
// After signing in, this device is combined with your account by itself (engine.ts: joinAccount) and MyDay opens.
// Signing out saves everything to your account, then clears this device (engine.ts: signOutHere).
// Once signed in, a device stays signed in. If your account can't be reached (offline, or the service is down),
// you can use MyDay with what's on this device until it's next opened, so you're never locked out of it.
// When it's needed: gate.ts.
function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

export function SignInGate({ onExport, onUseHere }: { onExport: () => void; onUseHere: () => void }) {
  const v = useSync();
  const online = useOnline();
  const [unreachable, setUnreachable] = useState(false);
  const [title, line] = v.phase === 'setup' ? ['Getting your MyDay', '']
    : v.phase === 'other-account' ? ['A different account', '']
    : v.linkedEmail ? ['Sign in to carry on', `Sign in as ${v.linkedEmail} to carry on — any changes made here are saved to your account then.`]
    : ['Welcome to MyDay', 'Your MyDay is kept with your account, so it\'s the same on your Mac and your phone — and only you can see it. Sign in to continue.'];
  return (
    <div className="max-w-[720px] mx-auto" id="signInGate" data-phase={v.phase}>
      <Card aria-labelledby="gate-h">
        <h2 id="gate-h" className="m-0">{title}</h2>
        {line && <p className="text-[15px] text-fg-2 m-0 mt-2">{line}</p>}
      </Card>
      <SyncScreen onExport={onExport} gate onUnreachable={() => setUnreachable(true)} />
      {(!online || unreachable) && (
        <Card tone="notice" aria-labelledby="gate-off-h" id="gateOffline">
          <h3 id="gate-off-h">Can't reach your account right now?</h3>
          <p className="text-[15px] m-0 mb-3">You can use MyDay with what's on this device. Your changes are saved here, and you'll be asked to sign in again next time you open MyDay.</p>
          <Button data-action="gate-use-here" onClick={onUseHere}>Use MyDay on this device for now</Button>
        </Card>
      )}
    </div>
  );
}
