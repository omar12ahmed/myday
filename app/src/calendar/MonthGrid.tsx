import { Card } from '../components/Card';
import { bankHolidayOn } from '../data/bankHolidays';
import { parseKey, shift, todayKey } from '../data/dates';
import { absenceOn, appointmentsOn, displayStatus, entriesOn, mod, overlapsOn } from '../data/rota';
import type { DateKey, MyDayData } from '../data/types';
import { BankHolidayBadge, OverlapMark, RotaChip } from './Chips';
import { describeDay, monthLabel } from './describe';

// The small marks at the bottom of a day: +OT, UA (part-shift absence), appointment count, ! (overlap).
function Marks({ data, d }: { data: MyDayData; d: DateKey }) {
  const ua = absenceOn(data, d);
  const appts = appointmentsOn(data, d).length;
  return (
    <span className="cal-marks flex flex-wrap gap-0.5 mt-auto">
      {entriesOn(data, d).some(e => e.kind === 'overtime') && <RotaChip data={data} kind="overtime" label="+OT" size="mini" />}
      {ua.any && !ua.whole && <RotaChip data={data} kind="unauthorised" label="UA" size="mini" />}
      {appts > 0 && <RotaChip data={data} kind="appointment" label={String(appts)} size="mini" />}
      {overlapsOn(data, d).length > 0 && <OverlapMark />}
    </span>
  );
}

// Six weeks from the Monday on or before the 1st, so every month has the same shape.
export function MonthGrid({ data, month, selected, onSelect }: { data: MyDayData; month: string; selected: DateKey; onSelect: (d: DateKey) => void }) {
  const first = month + '-01', k = todayKey();
  const gridStart = shift(first, -mod(parseKey(first).getDay() - 1, 7));
  const days = Array.from({ length: 42 }, (_, i) => shift(gridStart, i));
  return (
    <Card className="cal-card !px-1.5 !py-2.5 sm:!p-2.5">
      <div className="cal-grid grid grid-cols-7 gap-[3px] sm:gap-1" role="group" aria-label={monthLabel(month)}>
        {days.slice(0, 7).map(d => (
          <div key={'h' + d} aria-hidden="true" className="cal-dow text-center text-xs font-bold text-fg-3 py-1">
            {parseKey(d).toLocaleDateString(undefined, { weekday: 'narrow' })}
          </div>
        ))}
        {days.map(d => {
          const s = displayStatus(data, d), bh = bankHolidayOn(data, d);
          const out = d.slice(0, 7) !== month, isSel = d === selected, isToday = d === k;
          return (
            <button key={d} type="button" data-action="cal-select" data-date={d} aria-label={describeDay(data, d)} aria-pressed={isSel} onClick={() => onSelect(d)}
              className={`cal-cell${out ? ' out opacity-50' : ''}${isToday ? ' today' : ''}${isSel ? ' sel' : ''} w-full min-w-0 min-h-[70px] sm:min-h-[84px] px-0.5 py-1 sm:p-1.5 rounded-xl flex flex-col items-stretch gap-[3px] text-left font-medium cursor-pointer border
                ${isSel ? 'bg-surface-3 shadow-[inset_0_0_0_2px_var(--primary)] border-transparent' : isToday ? 'bg-surface-2 border-primary' : 'bg-surface-2 border-transparent hover:border-outline-strong'}`}>
              <span className="cal-num flex justify-between items-center gap-0.5 px-0.5 text-[13px] font-bold tabular-nums">
                {+d.slice(8)}{bh && <BankHolidayBadge title={bh} />}
              </span>
              {s.key && s.key !== 'off' ? <RotaChip data={data} kind={s.key} label={s.short} size="cell" />
                : s.key === 'off' ? <span className="cal-off text-[11px] text-fg-3 px-0.5">Off</span> : null}
              <Marks data={data} d={d} />
            </button>
          );
        })}
      </div>
    </Card>
  );
}
