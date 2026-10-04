import { Download, FolderOpen, Lightbulb, ListTodo } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Button } from '../components/Button';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';
import { useSync } from '../sync/engine';
import { RELEASE } from '../version';

const reduceQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const deviceReducesMotion = () => !!reduceQuery?.matches;
const subscribeReduce = (fn: () => void) => { reduceQuery?.addEventListener('change', fn); return () => reduceQuery?.removeEventListener('change', fn); };

// The buttons at the bottom of every section, as in the current MyDay: task lists, backups and animations.
export function AppFooter({ data, canSave, onEdit, onExport, onImport }: {
  data: MyDayData; canSave: boolean; onEdit: () => void; onExport: () => void; onImport: () => void;
}) {
  const reduces = useSyncExternalStore(subscribeReduce, deviceReducesMotion);
  const sync = useSync();
  const off = data.settings.motion === 'off';
  return (
    <footer id="footer" className="pb-10">
      <div className="grid grid-cols-2 gap-2.5">
        <Button inline variant="ghost" className="w-full col-span-2" data-action="edit" onClick={onEdit}><ListTodo size={18} aria-hidden="true" /> Edit task lists</Button>
        <Button inline variant="ghost" className="w-full col-span-2" data-action="noticed" onClick={() => { location.hash = 'noticed'; window.scrollTo(0, 0); }}><Lightbulb size={18} aria-hidden="true" /> What MyDay has noticed</Button>
        <Button inline variant="ghost" className="w-full" data-action="export" onClick={onExport}><Download size={18} aria-hidden="true" /> Export my data</Button>
        <Button inline variant="ghost" className="w-full" data-action="import" onClick={onImport}><FolderOpen size={18} aria-hidden="true" /> Import my data</Button>
        <Button inline variant="ghost" className="w-full col-span-2" data-action="motion" aria-pressed={!off} onClick={() => {
          update(d => { d.settings.motion = d.settings.motion === 'off' ? 'auto' : 'off'; });
          toast(!off ? 'Animations off.' : reduces ? 'Animations on — but your device asks for less motion, so they stay off.' : 'Animations on.');
        }}>
          {off ? 'Animations: Off' : reduces ? 'Animations: Off (your device asks for less motion)' : 'Animations: On'}
        </Button>
      </div>
      <p className="storage-note text-center text-fg-3 text-[13px] mt-3.5">{!canSave ? 'Saving is unavailable in this browser.'
        : sync.phase === 'linked' ? 'Saved in this browser — and everything you enter syncs with your account.'
        : 'Saved only in this browser.'}</p>
      {/* Which release is loaded, to check after publishing. */}
      <p id="appVersion" className="app-version text-center text-fg-3 text-[13px] mt-1 tabular-nums">{RELEASE}</p>
    </footer>
  );
}
