import { Check, Sparkles } from 'lucide-react';
import { Card } from '../components/Card';
import { EnergyMeter } from '../components/EnergyMeter';
import { RestDayCard } from '../components/TaskCard';
import { TaskTimeline } from '../components/TaskTimeline';
import { todayKey } from '../data/dates';
import { energyLine, nextTask, progressNote, sortedTasks } from '../data/today';
import type { MyDayData } from '../data/types';

export function TodayScreen({ data }: { data: MyDayData }) {
  const k = todayKey();
  const day = data.days[k];

  if (!day) {
    return (
      <Card>
        <h2>Today isn't planned yet</h2>
        <p className="text-[15px] text-fg-2 mb-0">When you build your day in the current MyDay, it will show up here too.</p>
      </Card>
    );
  }

  const { timed, untimed } = sortedTasks(day);
  const nextUid = nextTask(k, day)?.uid ?? null;
  const progress = progressNote(day);
  return (
    <section aria-labelledby="today-heading" className="mb-8">
      <h2 id="today-heading">{day.rest ? 'Today is a rest day' : "Here's your day"}</h2>
      <div className="mb-5 space-y-3">
        <p className="flex items-start gap-2.5 m-0 text-[15px] text-fg-2">
          {!day.rest && day.energy !== null && <EnergyMeter level={day.energy} />}
          {energyLine(day)}
        </p>
        {progress && (
          <p className="flex w-fit items-center gap-2 m-0 px-3 py-1 rounded-full bg-tonal text-on-tonal text-sm font-semibold">
            {progress.all ? <Sparkles size={16} aria-hidden="true" /> : <Check size={16} strokeWidth={3} aria-hidden="true" />}
            {progress.text}
          </p>
        )}
      </div>
      {day.rest ? (
        <RestDayCard />
      ) : day.tasks.length === 0 ? (
        <p className="text-[15px] text-fg-2">Nothing on today's list — everything is waiting in your queue.</p>
      ) : (
        <>
          {timed.length > 0 && <TaskTimeline tasks={timed} joined nextUid={nextUid} />}
          {untimed.length > 0 && (
            <>
              {timed.length > 0 && <h3 className="mt-7">Any time today</h3>}
              <TaskTimeline tasks={untimed} nextUid={nextUid} />
            </>
          )}
        </>
      )}
    </section>
  );
}
