import type { ReactNode } from 'react';
import { Card } from '../components/Card';
import { bankHolidayOn } from '../data/bankHolidays';
import { parseKey, shift } from '../data/dates';
import { displayStatus, entriesOn, fmtShiftRange, overlapsOn, STATUS_LABEL } from '../data/rota';
import type { DateKey, MyDayData } from '../data/types';
import { BankHolidayBadge, OverlapMark, RotaChip } from './Chips';
import { describeDay } from './describe';

// 28 days as a list: each day's shift, overtime, absences and appointments. The selected day opens
// its details right underneath (`details`).
export function AgendaList({ data, from, selected, onSelect, details }: { data: MyDayData; from: DateKey; selected: DateKey; onSelect: (d: DateKey) => void; details: ReactNode }) {
  const Time = ({ children }: { children: ReactNode }) => <span className="ag-time text-sm text-fg-2 tabular-nums">{children}</span>;
  return (
    <Card>
      <ul className="agenda list-none m-0 p-0">
        {Array.from({ length: 28 }, (_, i) => shift(from, i)).map(d => {
          const s = displayStatus(data, d), bh = bankHolidayOn(data, d), date = parseKey(d);
          const appts = data.commitments.filter(c => c.start.slice(0, 10) === d);
          const items: ReactNode[] = [];
          if (s.key) {
            items.push(<span key="s"><RotaChip data={data} kind={s.key} label={s.label} />{s.p && s.p.works && (s.key === s.p.type || s.key === 'custom') && s.p.start && <> <Time>{s.p.start}–{s.p.end}</Time></>}</span>);
          }
          if (s.a && !s.a.assumed && s.p && s.p.works && s.key !== s.p.type) items.push(<Time key="p">planned {s.p.type === 'custom' ? s.p.label : STATUS_LABEL[s.p.type]} {s.p.start}–{s.p.end}</Time>);
          for (const e of entriesOn(data, d)) items.push(<span key={e.id}><RotaChip data={data} kind={e.kind} label={STATUS_LABEL[e.kind]} /> <Time>{fmtShiftRange(e.start, e.end, d)}</Time></span>);
          for (const c of appts) items.push(<span key={c.id}><RotaChip data={data} kind="appointment" label={c.title} /> <Time>{fmtShiftRange(c.start, c.end, d)}</Time></span>);
          return (
            <li key={d} className={`ag-row border-t border-outline first:border-t-0${d === selected ? ' sel' : ''}`}>
              <button type="button" data-action="cal-select" data-date={d} aria-label={describeDay(data, d)} aria-pressed={d === selected} onClick={() => onSelect(d)}
                className={`ag-btn w-full grid grid-cols-[5.4em_minmax(0,1fr)] gap-2.5 items-center text-left rounded-xl px-1.5 py-2.5 min-h-14 cursor-pointer ${d === selected ? 'bg-surface-2' : 'hover:bg-surface-2'}`}>
                <span className="text-[15px]"><strong>{date.toLocaleDateString(undefined, { weekday: 'short' })}</strong> {date.getDate()} {date.toLocaleDateString(undefined, { month: 'short' })}</span>
                <span className="flex flex-wrap gap-1.5 items-center min-w-0">
                  {bh && <><BankHolidayBadge /> <Time>{bh}</Time></>}
                  {items.length ? items : <Time>Nothing planned</Time>}
                  {overlapsOn(data, d).length > 0 && <OverlapMark />}
                </span>
              </button>
              {d === selected && <div className="ag-details mt-2 mb-3">{details}</div>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
