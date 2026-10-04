import { Check, Eye, Play, Timer } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CategoryChip } from '../components/CategoryChip';
import { nextTask, taskDetails, taskTime } from '../data/today';
import type { DateKey, MyDayData, Task } from '../data/types';

// Focus mode (the switch in the top bar): Today shows only what's next — the task to do now, with its focus timer —
// and nothing else to look at. Everything else is still there: "Show everything" (or the switch) brings it back.
export function FocusView({ data, k, onToggle, onTimer, onShowAll, timerCard, morning, proposal }: {
  data: MyDayData; k: DateKey; onToggle: (t: Task, done: boolean) => void; onTimer: (t: Task, kind: 'start' | 'focus') => void; onShowAll: () => void;
  timerCard: ReactNode; morning: ReactNode; proposal: ReactNode;
}) {
  const d = data.days[k];
  const next = d && !d.rest ? nextTask(k, d) : null;
  const time = next ? taskTime(next) : null;
  return (
    <div className="max-w-[640px] mx-auto" id="focusView">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="m-0 min-w-0 text-[15px] text-fg-2">Focus mode — just what's next.</p>
        <Button inline variant="ghost" className="whitespace-nowrap flex-none" data-action="focus-show-all" onClick={onShowAll}><Eye size={18} aria-hidden="true" /> Show everything</Button>
      </div>
      {timerCard}
      {!d && <>{morning}{proposal}</>}
      {d && d.rest && <Card><h2 className="m-0">Today is a rest day</h2><p className="text-[15px] text-fg-2 m-0 mt-1">Nothing to focus on. Go gently.</p></Card>}
      {d && !d.rest && !next && <Card><h2 className="m-0">That's everything for today</h2><p className="text-[15px] text-fg-2 m-0 mt-1">Every task on today's plan is done — lovely.</p></Card>}
      {next && !timerCard && (
        <Card tone="accent" id="focusNext" aria-labelledby="focus-next-h" className="text-center !py-8">
          <span className="eyebrow block text-xs font-bold tracking-[.08em] uppercase text-primary">Up next{time ? ` · ${time}` : ''}</span>
          <h2 id="focus-next-h" className="text-[26px] lg:text-[30px] font-bold leading-snug mt-2 mb-2">{next.title}</h2>
          <p className="flex flex-wrap items-center justify-center gap-2 m-0 text-[15px] text-fg-2"><CategoryChip kind={next.category} /> <span>{taskDetails(next)}</span></p>
          <div className="grid gap-2.5 mt-6 max-w-[360px] mx-auto">
            <Button variant="primary" data-action="focus-next-start" onClick={() => onTimer(next, 'focus')}><Play size={18} aria-hidden="true" /> Start focus · {next.minutes} min</Button>
            <Button data-action="focus-next-just" onClick={() => onTimer(next, 'start')}><Timer size={18} aria-hidden="true" /> Just start · 2 min</Button>
            <Button variant="ghost" data-action="focus-next-done" onClick={() => onToggle(next, true)}><Check size={18} aria-hidden="true" /> Tick it off</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
