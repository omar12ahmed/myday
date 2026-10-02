import { Check } from 'lucide-react';
import type { Task } from '../data/types';
import { TaskCard } from './TaskCard';

// A list of tasks, each with a round marker beside it: a tick once the task is done, and a green ring
// with a dot for the task that's up next. `joined` draws a line between the markers, for tasks that
// happen in time order.
// The layout is adapted from the "Process Timeline" component on 21st.dev (shadcnui-blocks/timeline-05).

function Marker({ done, next }: { done: boolean; next: boolean }) {
  const look = done ? 'bg-primary border-primary text-on-primary' : next ? 'bg-page border-primary' : 'bg-page border-outline-strong';
  return (
    <span aria-hidden="true" className={`flex-none grid place-items-center size-8 mt-2 rounded-full border-2 ${look}`}>
      {done && <Check size={18} strokeWidth={3} />}
      {next && <span className="size-2.5 rounded-full bg-primary" />}
    </span>
  );
}

export function TaskTimeline({ tasks, joined = false, nextUid = null }: { tasks: Task[]; joined?: boolean; nextUid?: string | null }) {
  const List = joined ? 'ol' : 'ul';
  return (
    <List className="space-y-3">
      {tasks.map((task, i) => (
        <li key={task.uid} className="relative flex gap-3.5 items-start">
          {/* The line down to the next marker: from just below this one (top-11) to just above the next (-bottom-4). */}
          {joined && i < tasks.length - 1 && (
            <span aria-hidden="true" className="absolute left-[15px] top-11 -bottom-4 w-0.5 rounded-full bg-track" />
          )}
          <Marker done={task.done} next={task.uid === nextUid} />
          <TaskCard task={task} next={task.uid === nextUid} />
        </li>
      ))}
    </List>
  );
}
