import { CalendarDays, ChevronLeft, ChevronRight, List, Repeat } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CommitForm } from '../commitments/commitForm';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { maybeFetchBankHolidays } from '../data/bankHolidayFetch';
import { shift, shortDate, todayKey } from '../data/dates';
import { shiftMonth } from '../data/pay';
import { update } from '../data/storage';
import type { Commitment, MyDayData } from '../data/types';
import { AgendaList } from './AgendaList';
import { DayPanel } from './DayPanel';
import { monthLabel } from './describe';
import { newPatternForm, type EntryForm, type PatternForm } from './forms';
import { MonthGrid } from './MonthGrid';
import { PatternEditor } from './PatternEditor';
import { BankHolidayCard, ColoursCard, LegendCard, RotaCard } from './SideCards';

// The Calendar section. Saved data comes in as `data`; the month shown, the selected date and any open
// form are kept only while the screen is open, as in the current MyDay.
export function CalendarScreen({ data, canSave, motionAllowed }: { data: MyDayData; canSave: boolean; motionAllowed: boolean }) {
  const confirm = useConfirm();
  const k = todayKey();
  const [month, setMonth] = useState(k.slice(0, 7));
  const [selected, setSelected] = useState(k);
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [agendaStart, setAgendaStart] = useState(k);
  const [pattern, setPattern] = useState<PatternForm | null>(null);
  const [entry, setEntry] = useState<EntryForm | null>(null);
  const [appt, setAppt] = useState<CommitForm | null>(null);
  const dayHeading = useRef<HTMLHeadingElement>(null);
  const focusDay = useRef(false);
  const hasRota = data.rota.patterns.length > 0;

  // Bank holidays: load from gov.uk if the saved copy is missing or over a week old.
  // (It only ever tries once per visit, as in the current MyDay.)
  useEffect(() => { maybeFetchBankHolidays(data, canSave); }, [data, canSave]);

  // After choosing a date, bring its details into view and move focus there (for keyboards and screen readers).
  useEffect(() => {
    if (!focusDay.current) return;
    focusDay.current = false;
    const h = dayHeading.current;
    h?.scrollIntoView?.({ block: 'start', behavior: motionAllowed ? 'smooth' : 'auto' });
    h?.focus({ preventScroll: true });
  });

  function select(d: string) {
    setSelected(d);
    setEntry(null);
    setAppt(null);
    if (view === 'month' && d.slice(0, 7) !== month) setMonth(d.slice(0, 7));
    focusDay.current = true;
  }
  function move(dir: 1 | -1) {
    if (view === 'month') setMonth(shiftMonth(month + '-01', dir).slice(0, 7));
    else setAgendaStart(shift(agendaStart, dir * 28));
  }
  function openPattern() {
    setPattern(newPatternForm(data));
    requestAnimationFrame(() => document.getElementById('patternCard')?.scrollIntoView?.({ block: 'start', behavior: motionAllowed ? 'smooth' : 'auto' }));
  }
  async function deleteCommitment(c: Commitment) {
    if (!(await confirm({ title: `Remove “${c.title}”?`, confirmLabel: 'Remove' }))) return;
    update(d => { d.commitments = d.commitments.filter(x => x.id !== c.id); });
  }

  const day = (
    <DayPanel data={data} d={selected} entry={entry} setEntry={setEntry} appt={appt} setAppt={setAppt}
      onChangePattern={openPattern} onDeleteCommitment={deleteCommitment} headingRef={dayHeading} />
  );
  const title = view === 'month' ? monthLabel(month) : `${shortDate(agendaStart)} – ${shortDate(shift(agendaStart, 27))}`;
  const segBtn = (on: boolean) => `flex-1 min-h-11 px-3 py-2 rounded-full text-[15px] font-[550] border cursor-pointer inline-flex items-center justify-center gap-1.5 ${on ? 'bg-primary-container text-on-primary-container border-primary-outline' : 'bg-transparent text-fg-2 border-outline hover:bg-surface-2'}`;

  // Phones: one column in this order (`order-*`). Wide screens: the month (or agenda) and legend on the
  // left; the selected day, your pattern, bank holidays and colours beside it on the right.
  return (
    <div className="cal-layout flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:gap-x-6 lg:items-start">
      <div className="contents lg:block lg:min-w-0">
        <div className="order-1">
          <Card aria-labelledby="cal-title">
            <div className="flex items-center justify-between gap-2">
              <button type="button" data-action="cal-prev" aria-label={`Previous ${view === 'month' ? 'month' : 'four weeks'}`} onClick={() => move(-1)}
                className="size-12 flex-none rounded-full grid place-items-center bg-surface-2 border border-outline cursor-pointer"><ChevronLeft size={24} aria-hidden="true" /></button>
              <h2 id="cal-title" className="cal-title m-0 text-center text-[19px]" aria-live="polite">{title}</h2>
              <button type="button" data-action="cal-next" aria-label={`Next ${view === 'month' ? 'month' : 'four weeks'}`} onClick={() => move(1)}
                className="size-12 flex-none rounded-full grid place-items-center bg-surface-2 border border-outline cursor-pointer"><ChevronRight size={24} aria-hidden="true" /></button>
            </div>
            <div className="flex gap-1.5 mt-3" role="group" aria-label="Calendar view">
              <button type="button" className={segBtn(view === 'month')} data-action="cal-view" data-v="month" aria-pressed={view === 'month'} onClick={() => setView('month')}><CalendarDays size={18} aria-hidden="true" /> Month</button>
              <button type="button" className={segBtn(view === 'agenda')} data-action="cal-view" data-v="agenda" aria-pressed={view === 'agenda'}
                onClick={() => { setView('agenda'); setAgendaStart(month === k.slice(0, 7) ? k : month + '-01'); }}><List size={18} aria-hidden="true" /> Agenda</button>
              <button type="button" className={segBtn(false)} data-action="cal-today" onClick={() => { setMonth(k.slice(0, 7)); setSelected(k); setAgendaStart(k); }}>Today</button>
            </div>
            {!hasRota && <p className="text-[15px] text-fg-2 mt-3 mb-0">No shift pattern yet — set one up below to fill the calendar.</p>}
          </Card>
        </div>
        {pattern && <div className="order-1"><PatternEditor data={data} form={pattern} setForm={setPattern} onSaved={() => {}} /></div>}
        {!hasRota && !pattern && (
          <div className="order-1">
            <Card aria-labelledby="setup-h">
              <h2 id="setup-h">Set up your shift pattern</h2>
              <p className="text-[15px] text-fg-2">Tell MyDay how your rota repeats. You can change it later from any date without rewriting the past.</p>
              <Button variant="primary" data-action="pattern-new" onClick={openPattern}><Repeat size={18} aria-hidden="true" /> Set up my pattern</Button>
            </Card>
          </div>
        )}
        <div className="order-1">
          {view === 'month'
            ? <MonthGrid data={data} month={month} selected={selected} onSelect={select} />
            : <AgendaList data={data} from={agendaStart} selected={selected} onSelect={select} details={day} />}
        </div>
        <div className="order-3"><LegendCard data={data} /></div>
      </div>
      <aside className="contents lg:block lg:min-w-0" aria-label="The selected day and your rota">
        {view === 'month' && <div className="order-2">{day}</div>}
        <div className="order-4"><RotaCard data={data} onChange={openPattern} /></div>
        <div className="order-4"><BankHolidayCard data={data} /></div>
        <div className="order-4 pb-10"><ColoursCard data={data} /></div>
      </aside>
    </div>
  );
}
