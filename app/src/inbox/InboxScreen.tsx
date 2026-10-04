import { Card } from '../components/Card';
import type { MyDayData } from '../data/types';
import { NotesScreen } from '../notes/NotesScreen';
import { TasksScreen } from '../tasks/TasksScreen';

// The Inbox: everything you capture that isn't on the Calendar — Tasks (#inbox, #inbox/tasks/…) and Notes
// (#inbox/notes/…; older #notes… links too). Ideas gets its own tab when it's ready (it isn't shown before then).
export function InboxScreen({ data, hash }: { data: MyDayData; hash: string }) {
  const parts = hash.replace('#', '').split('/');
  const tab = parts[0] === 'notes' || parts[1] === 'notes' ? 'notes' : 'tasks';
  const tabClass = (on: boolean) => `seg-link flex-1 inline-flex items-center justify-center gap-1.5 min-h-11 rounded-xl text-[15px] font-semibold no-underline ${on ? 'on bg-primary-container text-on-primary-container' : 'text-fg-2'}`;
  return (
    <div className="max-w-[720px] mx-auto">
      <Card className="inbox-tabs !p-2.5">
        <div className="seg flex gap-1.5" role="tablist" aria-label="Inbox sections">
          <a className={tabClass(tab === 'tasks')} href="#inbox/tasks" role="tab" aria-selected={tab === 'tasks'}>Tasks</a>
          <a className={tabClass(tab === 'notes')} href="#inbox/notes" role="tab" aria-selected={tab === 'notes'}>Notes</a>
        </div>
      </Card>
      {tab === 'tasks' ? <TasksScreen data={data} hash={hash} /> : <NotesScreen data={data} hash={hash} />}
    </div>
  );
}
