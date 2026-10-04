import { Minus, Play, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { nextTask } from '../data/today';
import type { DateKey, MyDayData, Task } from '../data/types';

// The focus timer, ready to start (Today's dashboard): pick one of today's open tasks (the one up next to begin
// with), choose how long, and start — MyDay's own focus timer then runs (TimerCard), with Pause, +5 and Tick it off.
export function FocusCard({ data, k, onStart }: { data: MyDayData; k: DateKey; onStart: (t: Task, minutes: number) => void }) {
  const d = data.days[k];
  const open = d && !d.rest ? d.tasks.filter(t => !t.done) : [];
  const first = d && !d.rest ? nextTask(k, d) : null;
  const [uid, setUid] = useState<string | null>(null);
  const [mins, setMins] = useState<Record<string, number>>({});
  const task = open.find(t => t.uid === uid) ?? first ?? open[0] ?? null;
  const m = task ? mins[task.uid] ?? task.minutes : 25;
  const change = (by: number) => task && setMins({ ...mins, [task.uid]: Math.min(240, Math.max(5, m + by)) });
  return (
    <Card aria-labelledby="focus-h" id="focusCard" className="focus-card relative overflow-hidden !bg-gradient-to-br from-primary-container to-surface">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="focus-h" className="m-0 mb-1">Focus timer</h3>
          {task && <p className="text-[15px] text-fg-2 m-0">One task, one timer — pick it and how long.</p>}
          {!task && <p className="text-[15px] text-fg-2 m-0">{!d ? 'Build your day, then focus on one task at a time.' : d.rest ? "It's a rest day — no timer needed." : 'Nothing left to focus on today — lovely.'}</p>}
        </div>
        <Hourglass />
      </div>
      {task && <>
        <label className="grid gap-1 text-sm text-fg-2 mt-1" htmlFor="focusTask">Task
          <select id="focusTask" className="min-h-11 rounded-tile border border-outline-strong bg-surface px-3 text-fg text-base min-w-0" value={task.uid} onChange={e => setUid(e.target.value)}>
            {open.map(t => <option key={t.uid} value={t.uid}>{t.title}</option>)}
          </select>
        </label>
        <div className="flex items-center justify-center gap-4 my-3" role="group" aria-label="How long">
          <button type="button" className="size-11 rounded-full grid place-items-center bg-surface border border-outline cursor-pointer disabled:opacity-40" aria-label="5 minutes shorter" data-action="focus-less" disabled={m <= 5} onClick={() => change(-5)}><Minus size={18} aria-hidden="true" /></button>
          <span className="text-center"><strong className="text-[28px] tabular-nums" id="focusMin">{m}</strong> <span className="text-fg-2">min</span></span>
          <button type="button" className="size-11 rounded-full grid place-items-center bg-surface border border-outline cursor-pointer disabled:opacity-40" aria-label="5 minutes longer" data-action="focus-more" disabled={m >= 240} onClick={() => change(5)}><Plus size={18} aria-hidden="true" /></button>
        </div>
        <Button variant="primary" className="w-full" data-action="focus-start" onClick={() => onStart(task, m)}><Play size={18} aria-hidden="true" /> Start</Button>
      </>}
    </Card>
  );
}

// A small hourglass, drawn (decorative).
function Hourglass() {
  return (
    <svg aria-hidden="true" width="44" height="56" viewBox="0 0 44 56" className="flex-none">
      <rect x="4" y="2" width="36" height="5" rx="2.5" className="fill-primary" />
      <rect x="4" y="49" width="36" height="5" rx="2.5" className="fill-primary" />
      <path d="M9 7 h26 c0 10 -9 14 -9 21 c0 7 9 11 9 21 h-26 c0 -10 9 -14 9 -21 c0 -7 -9 -11 -9 -21 Z" className="fill-surface stroke-primary-outline" strokeWidth="2" />
      <path d="M13 12 h18 c-1 6 -6 9 -9 13 c-3 -4 -8 -7 -9 -13 Z" className="fill-done" opacity=".85" />
      <path d="M22 30 v8" className="stroke-done" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 47 c2 -5 5 -7 8 -8 c3 1 6 3 8 8 Z" className="fill-done" opacity=".85" />
    </svg>
  );
}
