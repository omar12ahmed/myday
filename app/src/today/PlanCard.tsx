import { Check, Moon, Sparkles, WandSparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EnergyMeter } from '../components/EnergyMeter';
import { energyLine, nextTask, planWarnings, progressNote, sortedTasks } from '../data/today';
import type { Day, MyDayData, Task } from '../data/types';
import { QueueNote } from './QueueNote';
import { TaskList } from './TaskList';

// What a rest day shows in place of tasks.
export function RestDayCard() {
  return (
    <div className="flex gap-3.5 items-start bg-rest-c rounded-tile p-4 mt-3.5">
      <span aria-hidden="true" className="flex-none grid place-items-center size-9 rounded-full bg-surface text-rest"><Moon size={18} /></span>
      <div>
        <p className="title m-0 font-medium">Rest. That's the whole plan.</p>
        <p className="m-0 mt-0.5 text-sm text-fg-2">Nothing to tick off today.</p>
      </div>
    </div>
  );
}

// The day's tasks: timed ones joined in time order, then "Any time today".
export function DayTasks({ data, k, d, mode, justDoneUid, onToggle, onTimer, onRoll }: {
  data: MyDayData; k: string; d: Day; mode: 'plan' | 'evening'; justDoneUid?: string | null;
  onToggle: (t: Task, done: boolean) => void; onTimer?: (t: Task, kind: 'start' | 'focus') => void; onRoll?: (t: Task) => void;
}) {
  const { timed, untimed } = sortedTasks(d);
  const nextUid = mode === 'plan' ? nextTask(k, d)?.uid ?? null : null;
  const warnings = mode === 'plan' ? planWarnings(data, k, d) : {};
  const common = { dayKey: k, nextUid, justDoneUid, warnings, mode, onToggle, onTimer, onRoll };
  return (
    <>
      {timed.length > 0 && <TaskList tasks={timed} joined {...common} />}
      {untimed.length > 0 && (
        <>
          {timed.length > 0 && <h3 className="mt-6">Any time today</h3>}
          <TaskList tasks={untimed} {...common} />
        </>
      )}
    </>
  );
}

export function PlanCard({ data, k, justDoneUid, onToggle, onTimer, onEvening, onReview, onSwapRest, onRestart, onAdjust }: {
  data: MyDayData; k: string; justDoneUid: string | null;
  onToggle: (t: Task, done: boolean) => void; onTimer: (t: Task, kind: 'start' | 'focus') => void;
  onEvening: () => void; onReview: () => void; onSwapRest: () => void; onRestart: () => void;
  onAdjust?: () => void; // "Help me adjust today" (only when AI help is set up)
}) {
  const d = data.days[k];
  const progress = progressNote(d);
  const anyDone = d.tasks.some(t => t.done);
  return (
    <Card id="slot-plan" aria-labelledby="plan-h">
      <h2 id="plan-h">{d.rest ? 'Today is a rest day' : "Here's your day"}</h2>
      <div className="space-y-3">
        <p className="flex items-start gap-2.5 m-0 text-[15px] text-fg-2">
          {!d.rest && d.energy !== null && <EnergyMeter level={d.energy} />}
          {energyLine(d)}
        </p>
        {progress && (
          <p className="flex w-fit items-center gap-2 m-0 px-3 py-1 rounded-full bg-tonal text-on-tonal text-sm font-semibold">
            {progress.all ? <Sparkles size={16} aria-hidden="true" /> : <Check size={16} strokeWidth={3} aria-hidden="true" />}
            {progress.text}
          </p>
        )}
      </div>
      {d.rest ? <RestDayCard />
        : d.tasks.length ? <DayTasks data={data} k={k} d={d} mode="plan" justDoneUid={justDoneUid} onToggle={onToggle} onTimer={onTimer} />
        : <p className="text-[15px] text-fg-2 mt-3">Nothing on today's list — everything is waiting in your queue.</p>}
      {!d.rest && <Button variant="primary" className="mt-5" data-action="evening" onClick={onEvening}>Evening check-in</Button>}
      {onAdjust && <Button inline className="w-full mt-2.5" data-action="ai-open" onClick={onAdjust}><WandSparkles size={18} aria-hidden="true" /> Help me adjust today</Button>}
      <div className="grid grid-cols-2 gap-2.5 mt-2.5">
        {!d.rest && <Button inline variant="ghost" className="w-full" data-action="review" onClick={onReview}>Review my plan</Button>}
        {!d.rest && !anyDone && <Button inline variant="ghost" className="w-full" data-action="swap-rest" onClick={onSwapRest}>Swap for a rest day</Button>}
        {/* Full width when it would otherwise sit alone in a row (an odd number of buttons). */}
        <Button inline variant="ghost" className={`w-full ${d.rest || !anyDone ? 'col-span-2' : ''}`} data-action="restart" onClick={onRestart}>Start today over</Button>
      </div>
      <QueueNote queue={data.queue} prefix={d.rest ? 'Your queue is waiting safely for another day:' : 'Still waiting in your queue for a later day:'} />
    </Card>
  );
}
