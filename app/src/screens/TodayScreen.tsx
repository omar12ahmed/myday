import { Card } from '../components/Card';
import { RestDayCard, TaskCard } from '../components/TaskCard';
import { todayKey } from '../data/dates';
import { energyLine, sortedTasks } from '../data/today';
import type { MyDayData, Task } from '../data/types';

function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="mt-3.5 space-y-2.5">
      {tasks.map(t => <li key={t.uid}><TaskCard task={t} /></li>)}
    </ul>
  );
}

export function TodayScreen({ data }: { data: MyDayData }) {
  const day = data.days[todayKey()];

  if (!day) {
    return (
      <Card>
        <h2>Today isn't planned yet</h2>
        <p className="text-[15px] text-fg-2 mb-0">When you build your day in the current MyDay, it will show up here too.</p>
      </Card>
    );
  }

  const { timed, untimed } = sortedTasks(day);
  return (
    <Card>
      <h2>{day.rest ? 'Today is a rest day' : "Here's your day"}</h2>
      <p className="text-[15px] text-fg-2">{energyLine(day)}</p>
      {day.rest ? (
        <div className="mt-3.5"><RestDayCard /></div>
      ) : day.tasks.length === 0 ? (
        <p className="text-[15px] text-fg-2">Nothing on today's list — everything is waiting in your queue.</p>
      ) : (
        <>
          {timed.length > 0 && <TaskList tasks={timed} />}
          {untimed.length > 0 && (
            <>
              {timed.length > 0 && <h4>Any time today</h4>}
              <TaskList tasks={untimed} />
            </>
          )}
        </>
      )}
    </Card>
  );
}
