import { taskMeta } from '../data/today';
import type { Category, Task } from '../data/types';
import { CategoryChip } from './CategoryChip';

// One task on a day's plan, with a coloured stripe for its category.
// For now it only shows the task; ticking it off comes when the new app can save.

const ROW = 'flex gap-3.5 items-start bg-surface-2 border border-outline border-l-4 rounded-tile py-3.5 pr-3.5 pl-3 min-h-16';

// Written out in full so Tailwind can find every class name.
const STRIPE: Record<Category, string> = {
  learning: 'border-l-learning',
  admin: 'border-l-admin',
  health: 'border-l-health',
};

function DoneBox({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex-none grid place-items-center size-[30px] mt-0.5 rounded-[10px] border-2 ${done ? 'bg-primary border-primary text-on-primary' : 'border-outline-strong'}`}
    >
      {done && (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )}
    </span>
  );
}

export function TaskCard({ task }: { task: Task }) {
  return (
    <div className={`${ROW} ${STRIPE[task.category]}`}>
      <DoneBox done={task.done} />
      <div>
        <CategoryChip kind={task.category} />
        <div className={task.done ? 'text-fg-2' : undefined}>
          <span className="sr-only">{task.done ? 'Done: ' : 'Not done yet: '}</span>
          {task.title}
        </div>
        <div className="text-sm text-fg-3 mt-0.5 tabular-nums">{taskMeta(task)}</div>
      </div>
    </div>
  );
}

// What a rest day shows in place of tasks.
export function RestDayCard() {
  return (
    <div className={`${ROW} border-l-rest`}>
      <span aria-hidden="true" className="flex-none size-[30px] mt-0.5 rounded-full border-2 border-rest bg-rest-c" />
      <div>
        <CategoryChip kind="rest" />
        <div>Rest. That's the whole plan.</div>
        <div className="text-sm text-fg-3 mt-0.5">Nothing to tick off today.</div>
      </div>
    </div>
  );
}
