import { Check, TriangleAlert } from 'lucide-react';
import { Button } from '../components/Button';
import { CategoryChip } from '../components/CategoryChip';
import { taskDetails, taskTime } from '../data/today';
import type { Task } from '../data/types';

// A day's tasks as a timeline: a round marker beside each task (a tick once it's done, a green ring
// with a dot for the task that's up next). The whole row is the checkbox, so tapping anywhere on a
// task ticks it off. `joined` draws a line between markers, for tasks that happen in time order.
// The layout is adapted from the "Process Timeline" component on 21st.dev (shadcnui-blocks/timeline-05).

export interface TaskListProps {
  tasks: Task[];
  dayKey: string;
  joined?: boolean;
  nextUid?: string | null;
  justDoneUid?: string | null;
  warnings?: Record<string, string>;      // task uid → overlap warning
  mode: 'plan' | 'evening';               // plan: timer buttons; evening: "Roll to tomorrow"
  onToggle: (t: Task, done: boolean) => void;
  onTimer?: (t: Task, kind: 'start' | 'focus') => void;
  onRoll?: (t: Task) => void;
}

function Marker({ done, next }: { done: boolean; next: boolean }) {
  const look = done ? 'bg-done border-done text-on-done' : next ? 'bg-surface border-primary' : 'bg-surface border-outline-strong';
  return (
    <span aria-hidden="true" className={`box flex-none grid place-items-center size-8 mt-2 rounded-full border-2 transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2 ${look}`}>
      {done && <Check size={18} strokeWidth={3} />}
      {next && !done && <span className="size-2.5 rounded-full bg-primary" />}
    </span>
  );
}

export function TaskList({ tasks, dayKey, joined = false, nextUid = null, justDoneUid = null, warnings = {}, mode, onToggle, onTimer, onRoll }: TaskListProps) {
  const List = joined ? 'ol' : 'ul';
  return (
    <List className="tasks space-y-3 mt-3.5">
      {tasks.map((t, i) => {
        const next = t.uid === nextUid && !t.done;
        const time = taskTime(t);
        return (
          <li key={t.uid} className="relative">
            {/* The line down to the next marker: from just below this one (top-11) to just above the next (-bottom-4). */}
            {joined && i < tasks.length - 1 && <span aria-hidden="true" className="absolute left-[15px] top-11 -bottom-4 w-0.5 rounded-full bg-track" />}
            <label className={`task cat-${t.category}${t.done ? ' done' : ''}${next ? ' next' : ''}${t.uid === justDoneUid ? ' just-done' : ''} flex gap-3.5 items-start cursor-pointer rounded-tile group`}>
              <input type="checkbox" className="peer sr-only" data-action="toggle" data-uid={t.uid} data-day={dayKey} checked={t.done} onChange={e => onToggle(t, e.target.checked)} />
              <Marker done={t.done} next={next} />
              <div className={`flex-1 min-w-0 rounded-tile border px-3.5 py-3 transition-colors ${next ? 'bg-surface border-primary shadow-card' : 'bg-surface-2 border-transparent group-hover:border-outline-strong'}`}>
                {(next || time) && (
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 m-0 mb-1 text-sm font-semibold text-fg-2 tabular-nums">
                    {next && <span className="text-xs font-bold tracking-[.06em] uppercase px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container">Up next</span>}
                    {time}
                  </p>
                )}
                <p className={`title m-0 font-medium leading-snug ${t.done ? 'text-fg-2' : ''}`}>{t.title}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm text-fg-3 tabular-nums">
                  <CategoryChip kind={t.category} />
                  <span className="meta">{taskDetails(t)}</span>
                </div>
                {warnings[t.uid] && (
                  <p className="warn flex gap-1.5 items-start m-0 mt-2 px-2.5 py-1 rounded-lg bg-warn-c text-on-warn-c text-sm w-fit">
                    <TriangleAlert size={16} className="flex-none mt-0.5" aria-hidden="true" />
                    {warnings[t.uid]}
                  </p>
                )}
              </div>
            </label>
            {mode === 'plan' && !t.done && onTimer && (
              <div className="task-actions flex flex-wrap gap-2 mt-2 ml-[46px]">
                <Button inline variant={next ? 'tonal' : 'ghost'} data-action="timer-start" data-uid={t.uid} onClick={() => onTimer(t, 'start')}>Just start · 2 min</Button>
                <Button inline variant="ghost" data-action="timer-focus" data-uid={t.uid} onClick={() => onTimer(t, 'focus')}>Focus · {t.minutes} min</Button>
              </div>
            )}
            {mode === 'evening' && !t.done && onRoll && (
              <div className="roll mt-2 ml-[46px]">
                <Button inline variant={t.rolledQid ? 'selected' : 'ghost'} aria-pressed={!!t.rolledQid} data-action="roll" data-uid={t.uid} data-day={dayKey} onClick={() => onRoll(t)}>
                  {t.rolledQid ? <><Check size={16} strokeWidth={3} aria-hidden="true" /> Rolling to tomorrow</> : 'Roll to tomorrow'}
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </List>
  );
}
