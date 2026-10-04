import type { MyDayData } from '../data/types';
import { NotesScreen } from '../notes/NotesScreen';

// The Inbox: everything you capture that isn't on the Calendar. For now it holds Notes; Tasks and Ideas get their own
// tabs here when they're ready (they aren't shown before then).
export function InboxScreen({ data, hash }: { data: MyDayData; hash: string }) {
  return <div className="max-w-[720px] mx-auto"><NotesScreen data={data} hash={hash} /></div>;
}
