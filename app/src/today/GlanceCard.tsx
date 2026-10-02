import { Card } from '../components/Card';
import { dtToMin, fmtDuration, fmtRange, minToTime, rangeMin } from '../data/dates';
import { CAT_LABEL } from '../data/plan';
import type { Proposal } from '../data/proposal';
import { blocksFor, freeSegments, KIND_LABEL } from '../data/schedule';
import type { Category, MyDayData } from '../data/types';

// "Today at a glance": a vertical timeline of sleep, commitments, tasks and free time.
// Ported from the current MyDay.
type Row = { at: number; time: string; label: string; sub: string; kind: 'sleep' | 'commit' | 'task' | 'proposed' | 'free'; dot: string };

// Dot colours, written out in full so Tailwind can find every class name.
const DOT = {
  sleep: 'bg-rest', free: 'bg-surface border-2 border-primary',
  work: 'bg-work', appointment: 'bg-appt', workout: 'bg-health',
  learning: 'bg-learning', admin: 'bg-admin', health: 'bg-health',
};
const PROPOSED = { learning: 'border-learning', admin: 'border-admin', health: 'border-health' };

export function GlanceCard({ data, k, proposal }: { data: MyDayData; k: string; proposal: Proposal | null }) {
  const st = data.settings, d = data.days[k];
  let tasks: { start: number; end: number; title: string; sub: string; proposed: boolean; cat: Category }[] = [];
  if (d) {
    tasks = d.tasks.filter(t => t.scheduledStart).map(t => {
      const s = dtToMin(t.scheduledStart!, k);
      return { start: s, end: s + t.minutes, title: t.title, sub: t.done ? 'Done' : CAT_LABEL[t.category], proposed: false, cat: t.category };
    });
  } else if (proposal) {
    tasks = proposal.items.filter(i => i.status === 'today' && i.start !== null)
      .map(i => ({ start: i.start as number, end: (i.start as number) + i.minutes, title: i.task.title, sub: 'Proposed', proposed: true, cat: i.task.category }));
  }
  const rows: Row[] = [];
  for (const bl of blocksFor(data, k)) {
    if (bl.type === 'buffer' || bl.end <= 0 || bl.start >= 1440) continue;
    if (bl.type === 'sleep') {
      if (bl.start <= 0) rows.push({ at: bl.end, time: minToTime(bl.end), label: 'Woke up', sub: '', kind: 'sleep', dot: DOT.sleep });
      else rows.push({ at: bl.start, time: minToTime(bl.start), label: 'Sleep', sub: bl.end > 1440 ? 'until ' + minToTime(bl.end) + ' tomorrow' : 'until ' + minToTime(bl.end), kind: 'sleep', dot: DOT.sleep });
      continue;
    }
    const c = bl.c!;
    rows.push({
      at: Math.max(bl.start, 0), time: fmtRange(c.start, c.end, k), label: c.title, kind: 'commit', dot: DOT[c.kind],
      sub: (c.rota ? 'From your rota · ' : c.title === KIND_LABEL[c.kind] ? '' : KIND_LABEL[c.kind] + ' · ') + (st.bufferMinutes ? `${st.bufferMinutes} min prep/travel before and after` : 'No prep/travel time'),
    });
  }
  for (const t of tasks) {
    const dot = t.proposed ? `bg-surface border-2 border-dashed ${PROPOSED[t.cat]}` : DOT[t.cat];
    rows.push({ at: t.start, time: rangeMin(t.start, t.end), label: t.title, sub: t.sub, kind: t.proposed ? 'proposed' : 'task', dot });
  }
  for (const g of freeSegments(data, k, tasks)) {
    // Skip short gaps (e.g. the breathing room between tasks) to keep the timeline calm.
    if (g.end - g.start >= 15) rows.push({ at: g.start, time: rangeMin(g.start, g.end), label: 'Available', sub: fmtDuration(g.end - g.start), kind: 'free', dot: DOT.free });
  }
  rows.sort((a, b) => a.at - b.at);

  return (
    <Card id="slot-glance" aria-labelledby="glance-h">
      <h2 id="glance-h">Today at a glance</h2>
      {rows.length ? (
        <ul className="glance mt-3">
          {rows.map((r, i) => (
            <li key={i} className="grid grid-cols-[6.6em_20px_minmax(0,1fr)] gap-x-2.5 py-2">
              <div className="g-time text-right text-sm text-fg-2 tabular-nums pt-0.5">{r.time}</div>
              <div aria-hidden="true" className="relative flex justify-center">
                <span className={`absolute w-0.5 bg-outline ${i === 0 ? 'top-3' : '-top-2'} ${i === rows.length - 1 ? 'h-3' : '-bottom-2'}`} />
                <span className={`relative size-3 mt-[7px] rounded-full ring-3 ring-surface ${r.dot}`} />
              </div>
              <div>
                <p className={`g-label m-0 font-[550] ${r.kind === 'free' ? 'text-primary' : r.kind === 'proposed' ? 'text-fg-2 italic' : ''}`}>{r.label}</p>
                {r.sub && <p className="m-0 text-sm text-fg-3">{r.sub}</p>}
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-[15px] text-fg-2">No commitments, and no free time left in today's task window.</p>}
      <p className="text-[15px] text-fg-2 mt-3 mb-0">Tasks are suggested between {st.earliestTime} and {st.latestTime}{st.gapMinutes ? `, with ${st.gapMinutes} min breathing room between them` : ''}.</p>
    </Card>
  );
}
