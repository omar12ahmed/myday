import type { QueueItem } from '../data/types';

// The tasks waiting in the queue for a later day, under a short heading. Nothing if the queue is empty.
export function QueueNote({ queue, prefix }: { queue: QueueItem[]; prefix: string }) {
  if (!queue.length) return null;
  return (
    <>
      <p className="text-[15px] text-fg-2 mt-3 mb-1">{prefix}</p>
      <ul className="queue-list m-0 pl-5 text-fg-2 text-[15px] list-disc">
        {queue.map(q => <li key={q.qid}>{q.title}</li>)}
      </ul>
    </>
  );
}
