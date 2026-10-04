import { Card } from '../components/Card';
import { parseKey } from '../data/dates';
import { thisWeek, todayProgress } from '../data/dashboard';
import type { DateKey, MyDayData } from '../data/types';

// Two small cards on Today's dashboard, side by side: today's plan as a ring ("2 of 3 done") and this week as bars.
// Green, plain counts, no percentages or scores — just what you did, never what you didn't.
export function TodayRing({ data, k }: { data: MyDayData; k: DateKey }) {
  const p = todayProgress(data, k);
  const r = 34, c = 2 * Math.PI * r, part = p.total ? p.done / p.total : 0;
  const words = !p.built ? 'Not planned yet' : p.rest ? 'Rest day' : !p.total ? 'Nothing planned' : p.done === p.total ? 'All done — lovely' : `${p.done} of ${p.total} done`;
  return (
    <Card aria-labelledby="ring-h" id="todayRing" className="!p-4 flex flex-col items-center text-center">
      <h3 id="ring-h" className="m-0 mb-2 self-start">Today</h3>
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="10" className="stroke-track" />
        {part > 0 && <circle cx="48" cy="48" r={r} fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-done" strokeDasharray={c} strokeDashoffset={c * (1 - part)} />}
      </svg>
      <p className="m-0 mt-2 text-[15px] font-semibold" data-s="ring-words">{words}</p>
    </Card>
  );
}

export function WeekCard({ data, k }: { data: MyDayData; k: DateKey }) {
  const week = thisWeek(data, k), most = Math.max(1, ...week.map(w => w.n)), total = week.reduce((a, w) => a + w.n, 0);
  return (
    <Card aria-labelledby="week-h" id="weekCard" className="!p-4">
      <h3 id="week-h" className="m-0 mb-2">This week</h3>
      <div className="grid grid-cols-7 gap-1.5 items-end h-[84px]" aria-hidden="true">
        {week.map(w => (
          <div key={w.day} className="flex flex-col items-center justify-end h-full">
            <span className={`w-full max-w-[18px] rounded-full ${w.n ? 'bg-done' : 'bg-track'} ${w.today ? 'ring-2 ring-primary-outline' : ''}`} style={{ height: `${w.future ? 6 : Math.max(6, (w.n / most) * 72)}px` }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 mt-1 text-center" aria-hidden="true">
        {week.map(w => <span key={w.day} className={`text-[11px] font-bold ${w.today ? 'text-primary' : 'text-fg-3'}`}>{parseKey(w.day).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>)}
      </div>
      <p className="m-0 mt-2 text-sm text-fg-2" data-s="week-words">{total ? `${total} thing${total === 1 ? '' : 's'} done this week` : 'Nothing ticked off yet this week — that\'s fine.'}</p>
      <ul className="sr-only">{week.filter(w => !w.future).map(w => <li key={w.day}>{parseKey(w.day).toLocaleDateString(undefined, { weekday: 'long' })}: {w.n} done</li>)}</ul>
    </Card>
  );
}
