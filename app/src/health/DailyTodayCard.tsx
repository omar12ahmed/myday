import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { LinkButton, Meta, TextLink } from '../components/parts';
import { dayDone, liveExercises, repsDone, repsLeft, tapsOn } from '../data/health/daily';
import type { DateKey, MyDayData } from '../data/types';
import { tapSet, undoTap } from './dailyActions';

// Daily exercises on Today, kept lean: a countdown of what's left, a slim bar, one tap per set, and a
// quiet undo for a mis-tap. Finished exercises fold away to a tick. Targets and new exercises live in
// Health → Workout. Missed days cost nothing — the target starts fresh each morning.
export function DailyTodayCard({ data, k }: { data: MyDayData; k: DateKey }) {
  const d = data.health.daily, exs = liveExercises(d);
  if (!exs.length) return null;
  const open = exs.filter(e => !dayDone(e, d, k)), done = exs.filter(e => dayDone(e, d, k));
  return (
    <Card aria-labelledby="daily-h">
      <div className="card-head flex justify-between items-center gap-3">
        <h2 id="daily-h" className="m-0">Daily exercises</h2>
        <TextLink href="#health/workout">Change in Health</TextLink>
      </div>
      {open.map(e => {
        const left = repsLeft(e, d, k), did = repsDone(d, k, e.id), pct = Math.min(100, Math.round((did / e.target) * 100));
        return (
          <div key={e.id} className="daily-row py-3 border-t border-dashed border-outline first-of-type:border-t-0">
            <div className="flex justify-between items-baseline gap-3">
              <span className="font-[800]">{e.name}</span>
              <span className="font-[800] tabular-nums text-health">{left} left</span>
            </div>
            <div className="h-2 rounded-full bg-track overflow-hidden my-2" role="img" aria-label={`${did} of ${e.target} done`}>
              <i className="block h-full rounded-full bg-health" style={{ width: pct + '%' }} />
            </div>
            <div className="flex items-center gap-4">
              <Button inline variant="primary" data-action="daily-tap" data-id={e.id} onClick={() => tapSet(e.id)}>+ a set of {Math.min(e.set, left)}</Button>
              {tapsOn(d, k, e.id).length > 0 && <LinkButton data-action="daily-undo" data-id={e.id} className="!min-h-0 text-sm" onClick={() => undoTap(e.id)}>undo</LinkButton>}
            </div>
          </div>
        );
      })}
      {done.map(e => (
        <div key={e.id} className="daily-row py-2.5 border-t border-dashed border-outline first-of-type:border-t-0 flex items-center gap-2.5">
          <span className="inline-grid place-items-center w-[22px] h-[22px] rounded-full bg-health-c text-health text-[13px] font-[800] flex-none" aria-hidden="true">✓</span>
          <span className="font-semibold text-fg-2 min-w-0">{e.name}</span>
          <Meta className="ml-auto flex-none">done for today</Meta>
        </div>
      ))}
    </Card>
  );
}
