import { CloudAlert, CloudCheck, HardDrive, RefreshCw } from 'lucide-react';
import { STATUS_LABEL, useSync, type Status } from './engine';

const ICON = { local: HardDrive, syncing: RefreshCw, synced: CloudCheck, attention: CloudAlert };
const LOOK: Record<Status, string> = {
  local: 'text-fg-2 border-outline-strong',
  syncing: 'text-fg-2 border-outline-strong',
  synced: 'text-primary border-primary-outline',
  attention: 'bg-warn-c text-on-warn-c border-transparent',
};

// The sync status beside "MyDay" at the top of every screen. Tap it for the sync screen.
// Only shown when sync is set up in this copy of MyDay.
export function SyncBadge() {
  const v = useSync();
  if (v.phase === 'off') return null;
  const Icon = ICON[v.status];
  return (
    <>
      <a href="#sync" id="syncBadge" data-status={v.status} aria-label={`Sync: ${STATUS_LABEL[v.status]}. Open sync.`}
        className={`relative inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[12px] font-semibold leading-4 no-underline whitespace-nowrap before:absolute before:-inset-x-1 before:-inset-y-3 before:content-[''] ${LOOK[v.status]}`}>
        <Icon size={13} aria-hidden="true" className={v.status === 'syncing' ? 'motion-safe:animate-spin' : ''} />
        {STATUS_LABEL[v.status]}
      </a>
      {/* Screen readers hear settled states only, not every "Syncing" in between. */}
      <span className="sr-only" role="status" aria-atomic="true">Sync: {STATUS_LABEL[v.settled]}</span>
    </>
  );
}
