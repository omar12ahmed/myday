import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { todayKey } from '../data/dates';
import { eveningSummary } from '../data/today';
import type { MyDayData, Task } from '../data/types';
import { DayTasks, RestDayCard } from './PlanCard';

// The evening check-in (today's, or yesterday's if it was left open): tick what got done,
// roll anything else to tomorrow, then "All set".
export function EveningView({ data, k, onToggle, onRoll, onFinish }: {
  data: MyDayData; k: string;
  onToggle: (t: Task, done: boolean) => void; onRoll: (t: Task) => void; onFinish: () => void;
}) {
  const d = data.days[k];
  return (
    <Card aria-labelledby="evening-h">
      <h2 id="evening-h">{k === todayKey() ? 'Evening check-in' : "Yesterday's check-in"}</h2>
      <p className="text-[15px] text-fg-2">Tick what got done. Anything else can simply roll forward.</p>
      {d.rest ? <RestDayCard /> : <DayTasks data={data} k={k} d={d} mode="evening" onToggle={onToggle} onRoll={onRoll} />}
      <p className="summary bg-primary-container text-on-primary-container rounded-tile px-4 py-3.5 my-3.5">{eveningSummary(d)}</p>
      <Button variant="primary" data-action="finish-evening" onClick={onFinish}>All set</Button>
    </Card>
  );
}

// Shown on a morning when yesterday's check-in was never finished.
export function YesterdayCard({ onOpen }: { onOpen: () => void }) {
  return (
    <Card id="slot-yesterday">
      <p className="text-[15px] text-fg-2">Yesterday's check-in is still open, if you'd like to tick things off or roll them forward first.</p>
      <Button data-action="evening-yesterday" onClick={onOpen}>Open yesterday's check-in</Button>
    </Card>
  );
}
