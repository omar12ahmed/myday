import { Moon } from 'lucide-react';
import { taskDetails, taskTime } from '../data/today';
import type { Task } from '../data/types';
import { CategoryChip } from './CategoryChip';

// One task on a day's plan: its time (if it has one), title, category and length.
// Whether it's done is shown by the marker beside it (see TaskTimeline).
// For now it only shows the task; ticking it off comes when the new app can save.

export function TaskCard({ task }: { task: Task }) {
  const time = taskTime(task);
  return (
    <div className="flex-1 min-w-0 bg-surface border border-outline rounded-tile px-4 py-3.5">
      {time && <p className="m-0 mb-0.5 text-sm font-semibold text-fg-2 tabular-nums">{time}</p>}
      <p className={`m-0 font-medium leading-snug ${task.done ? 'text-fg-2' : ''}`}>
        <span className="sr-only">{task.done ? 'Done: ' : 'Not done yet: '}</span>
        {task.title}
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm text-fg-3 tabular-nums">
        <CategoryChip kind={task.category} />
        <span>{taskDetails(task)}</span>
      </div>
    </div>
  );
}

// What a rest day shows in place of tasks.
export function RestDayCard() {
  return (
    <div className="flex gap-3.5 items-start bg-rest-c rounded-tile p-4">
      <span aria-hidden="true" className="flex-none grid place-items-center size-9 rounded-full bg-surface text-rest">
        <Moon size={18} />
      </span>
      <div>
        <p className="m-0 font-medium">Rest. That's the whole plan.</p>
        <p className="m-0 mt-0.5 text-sm text-fg-2">Nothing to tick off today.</p>
      </div>
    </div>
  );
}
