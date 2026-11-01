import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { update } from '../data/storage';
import { touchTask } from '../data/tasks';
import { fmtClock, timerRemainingMs, timerTask } from '../data/timer';
import type { MyDayData } from '../data/types';

const RING_C = 2 * Math.PI * 52; // the ring's circumference (radius 52)

export type TimerAction = 'pause' | 'resume' | 'done' | 'stop' | 'keep' | 'plus5';

// The focus timer ("Just start" for 2 minutes, or "Focus" for the task's full time).
export function TimerCard({ data, onAction }: { data: MyDayData; onAction: (a: TimerAction) => void }) {
  const t = data.timer!, task = timerTask(data)!;
  const [, setTick] = useState(0);

  // Redraw every second while running. When time's up, save that it finished (once).
  useEffect(() => {
    if (!t.startedAt || t.finished) return;
    const id = setInterval(() => {
      if (timerRemainingMs(t) <= 0) {
        update(draft => {
          const dt = draft.timer;
          if (!dt || dt.finished || dt.uid !== t.uid) return false;
          dt.finished = true;
          dt.accumulatedMs = dt.durationSec * 1000;
          dt.startedAt = null;
          // Run to the end while you were here: the task it's for was touched today (Help me start learns from it,
          // specs/help-me-start.md §6). Not when MyDay is opened again later, so reopening never edits a task on its own.
          const item = draft.tasks.items.find(x => x.planUid === dt.uid && x.plannedOn === dt.dayKey);
          const pastEnd = t.accumulatedMs + (t.startedAt ? Date.now() - t.startedAt : 0) - t.durationSec * 1000;
          if (item && pastEnd < 60000) touchTask(item, dt.dayKey);
        });
        try { navigator.vibrate?.(120); } catch { /* not supported */ }
      }
      setTick(n => n + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [t]);

  const rem = timerRemainingMs(t), total = t.durationSec * 1000;
  const paused = !t.startedAt && !t.finished;
  const isStart = t.kind === 'start';
  // A start's length: two minutes from Today, five from Help me start (specs/help-me-start.md).
  const startMin = Math.max(1, Math.round(t.durationSec / 60)), startWords = startMin === 2 ? 'two' : startMin === 5 ? 'five' : String(startMin);
  const btn = (a: TimerAction, label: string, variant: 'primary' | 'tonal' | 'ghost' = 'tonal') =>
    <Button variant={variant} data-action={`timer-${a}`} onClick={() => onAction(a)}>{label}</Button>;

  return (
    <Card id="timerCard" tone="accent" className={`timer-card cat-${task.category} text-center`} aria-labelledby="timer-h">
      <span id="timer-h" className="eyebrow block text-xs font-bold tracking-[.08em] uppercase text-primary mb-0.5">{isStart ? 'Just start' : 'Focus'}</span>
      <div className="relative w-[200px] max-w-[70%] aspect-square mx-auto mt-2 mb-3">
        <svg className="w-full h-full -rotate-90 block" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--track)" strokeWidth="10" />
          <circle id="ringFill" cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round" className="ring-fill"
            strokeDasharray={RING_C.toFixed(2)} style={{ strokeDashoffset: (RING_C * (1 - rem / total)).toFixed(2) }} />
        </svg>
        <div className="absolute inset-0 grid place-content-center">
          <div id="timerTime" role="timer" className="text-[40px] font-bold tabular-nums tracking-[-.02em] leading-tight">{fmtClock(rem)}</div>
          <div className="ring-sub text-sm text-fg-2">{t.finished ? 'done' : paused ? 'paused' : 'left'}</div>
        </div>
      </div>
      <p className="title m-0 font-semibold">{task.title}</p>
      <p className="text-[15px] text-fg-2 mt-1 mb-3.5">{isStart ? `Just ${startWords} minutes. You can stop after — starting is the hard part.` : 'One thing at a time. Stopping early is completely fine.'}</p>
      {t.finished && isStart ? (
        <>
          <p className="timer-msg bg-primary-container text-on-primary-container rounded-tile px-3.5 py-3 text-left">{startWords.charAt(0).toUpperCase() + startWords.slice(1)} minutes done — you started, and that's the hardest part.</p>
          <div className="grid gap-2.5 mt-3">
            {btn('keep', `Keep going · ${Math.max(5, task.minutes - startMin)} min`, 'primary')}
            <div className="grid grid-cols-2 gap-2.5">{btn('done', 'Tick it off')}{btn('stop', 'Stop here', 'ghost')}</div>
          </div>
        </>
      ) : t.finished ? (
        <>
          <p className="timer-msg bg-primary-container text-on-primary-container rounded-tile px-3.5 py-3 text-left">Time's up — nice focus. Tick it off, or keep going if you like.</p>
          <div className="grid gap-2.5 mt-3">
            {btn('done', 'Tick it off', 'primary')}
            <div className="grid grid-cols-2 gap-2.5">{btn('plus5', '+5 minutes')}{btn('stop', 'Stop timer', 'ghost')}</div>
          </div>
        </>
      ) : (
        <div className="grid gap-2.5">
          {paused ? btn('resume', 'Resume', 'primary') : btn('pause', 'Pause', 'primary')}
          <div className="grid grid-cols-2 gap-2.5">{btn('done', 'Tick it off')}{btn('stop', 'Stop', 'ghost')}</div>
        </div>
      )}
    </Card>
  );
}
