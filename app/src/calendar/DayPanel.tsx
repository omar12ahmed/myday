import { CalendarPlus, Clock, Repeat, UserX, X } from 'lucide-react';
import type { RefObject } from 'react';
import { CommitmentForm, CommitmentRows } from '../commitments/CommitmentForm';
import { appointmentOn, editForm, type CommitForm } from '../commitments/commitForm';
import { Button } from '../components/Button';
import { useConfirm } from '../components/confirm';
import { CommitInput, Field, Select, TextInput } from '../components/Field';
import { bankHolidayOn } from '../data/bankHolidays';
import { isTime, todayKey } from '../data/dates';
import { actualFor, addEntry, appointmentsOn, displayStatus, entriesTouching, fmtShiftRange, overlapsOn, plannedFor, rotaTypeOn, setOverride, STATUS_LABEL } from '../data/rota';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { ActualStatus, Commitment, DateKey, DateOverride, MyDayData, PlannedType, RotaEntry } from '../data/types';
import { newEntryForm, type EntryForm } from './forms';
import { BankHolidayBadge, RotaChip, WarnLine } from './Chips';
import { longDate } from './describe';

const block = 'border-t border-outline pt-4 mt-4';
const timeKey = (v: string | null | undefined) => v ?? '';

export function DayPanel({ data, d, entry, setEntry, appt, setAppt, onChangePattern, onDeleteCommitment, headingRef }: {
  data: MyDayData; d: DateKey;
  entry: EntryForm | null; setEntry: (f: EntryForm | null) => void;
  appt: CommitForm | null; setAppt: (f: CommitForm | null) => void;
  onChangePattern: () => void;
  onDeleteCommitment: (c: Commitment) => void;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}) {
  const confirm = useConfirm();
  const p = plannedFor(data, d), a = actualFor(data, d), ov: DateOverride = data.rota.overrides[d] || {}, bh = bankHolidayOn(data, d);
  const s = displayStatus(data, d);
  const plannedSel = ov.planned ? ov.planned.type : 'rota';
  const rotaType = rotaTypeOn(data, d);
  const actualSel = ov.actual ? ov.actual.status : 'planned';
  const isFuture = d > todayKey();
  const ents = entriesTouching(data, d);
  const appts = appointmentsOn(data, d);
  const overlaps = overlapsOn(data, d);
  const plannedText = p
    ? (p.works ? `${p.type === 'custom' ? p.label : STATUS_LABEL[p.type]} · ${fmtShiftRange(p.startDt!, p.endDt!, d)}` : p.type === 'custom' ? `${p.label} (no times)` : 'Off')
      + (p.source === 'changed' ? ' · changed for this date' : ' · from your rota')
    : 'No rota for this date';

  // ---------- This date only (the same rules as the current MyDay) ----------
  function setPlanned(v: string) {
    update(dr => setOverride(dr, d, 'planned', v === 'rota' ? null : v === 'custom' ? { type: 'custom', label: 'Custom', start: '09:00', end: '17:00' } : { type: v as PlannedType }));
  }
  function setPlannedField(el: HTMLInputElement, key: 'start' | 'end' | 'label', old: string) {
    const po: NonNullable<DateOverride['planned']> = { ...(ov.planned || { type: 'custom' }) };
    if (key === 'label') po.label = el.value.trim() || 'Custom';
    else {
      const t = el.value.slice(0, 5);
      if (!isTime(t)) { el.value = old; return; }
      po.start = key === 'start' ? t : (po.start || p?.start || '09:00');
      po.end = key === 'end' ? t : (po.end || p?.end || '17:00');
      if (po.start === po.end) { el.value = old; toast('Start and end need to be different.'); return; }
    }
    update(dr => setOverride(dr, d, 'planned', po));
  }
  function setActual(v: string) {
    update(dr => setOverride(dr, d, 'actual', v === 'planned' ? null : v === 'custom' ? { status: 'custom', label: 'Custom', paid: false } : { status: v as ActualStatus }));
  }
  function setActualField(el: HTMLInputElement, key: 'start' | 'end' | 'label' | 'paid', old: string) {
    const ao: NonNullable<DateOverride['actual']> = { ...(ov.actual || { status: 'worked' }) };
    if (key === 'label') ao.label = el.value.trim() || 'Custom';
    else if (key === 'paid') ao.paid = el.checked;
    else {
      const t = el.value.slice(0, 5);
      if (!isTime(t)) { el.value = old; return; }
      ao.start = key === 'start' ? t : (ao.start || p?.start || '09:00');
      ao.end = key === 'end' ? t : (ao.end || p?.end || '17:00');
      if (ao.start === ao.end) { el.value = old; toast('Start and end need to be different.'); return; }
    }
    update(dr => setOverride(dr, d, 'actual', ao));
  }
  async function resetDate() {
    if (!(await confirm({ title: 'Clear the changes for this date?', body: 'Overtime, absences and appointments stay.', confirmLabel: 'Clear changes' }))) return;
    update(dr => { delete dr.rota.overrides[d]; });
  }

  // ---------- Overtime and absence ----------
  function saveEntry() {
    if (!entry) return;
    let err: string | null = null;
    const ok = update(dr => { err = addEntry(dr, entry.type, entry.start.slice(0, 16), entry.end.slice(0, 16), entry.note.trim()); if (err) return false; });
    if (err) { setEntry({ ...entry, error: err }); return; }
    if (!ok) return; // another tab saved first; it says so
    setEntry(null);
    toast(entry.type === 'overtime' ? 'Overtime added.' : 'Absence recorded.');
  }
  async function deleteEntry(e: RotaEntry) {
    if (!(await confirm({ title: `Remove this ${STATUS_LABEL[e.kind].toLowerCase()}?`, confirmLabel: 'Remove' }))) return;
    update(dr => { dr.rota.entries = dr.rota.entries.filter(x => x.id !== e.id); });
  }

  const timeInput = (id: string, label: string, value: string | null | undefined, onCommit: (el: HTMLInputElement) => void) => (
    <Field label={label} htmlFor={id}><CommitInput id={id} key={id + timeKey(value)} type="time" defaultValue={value ?? ''} onCommit={onCommit} /></Field>
  );

  return (
    <section id="detailsCard" aria-labelledby="day-h" className="card details bg-surface border border-outline rounded-card p-5 mb-4 shadow-card scroll-mt-24">
      <h2 id="day-h" ref={headingRef} tabIndex={-1} className="text-lg outline-none scroll-mt-28">{longDate(d)}</h2>
      {bh && <p className="text-[15px] flex items-center gap-2 mb-2"><BankHolidayBadge /> Bank holiday: {bh}</p>}
      <p className="text-[15px] mb-0 flex flex-wrap items-center gap-2">
        {s.p && s.p.type && <RotaChip data={data} kind={s.p.type === 'custom' ? 'custom' : s.p.type} label={s.p.type === 'custom' ? s.p.label! : STATUS_LABEL[s.p.type]} />}
        <span>{plannedText}</span>
      </p>
      {s.key && s.p && s.key !== s.p.type && !s.a.assumed && (
        <p className="text-[15px] mt-1.5 mb-0 flex items-center gap-2">What happened: <RotaChip data={data} kind={s.key} label={s.label} /></p>
      )}
      {overlaps.map(o => <WarnLine key={o}>{o}</WarnLine>)}

      {/* Add something to this day: three clearly different actions. */}
      <div className={block}>
        <h3>Add to this day</h3>
        {appt ? <CommitmentForm form={appt} setForm={setAppt} onSaved={() => {}} />
          : entry ? (
            <div id="entryForm" className="c-form bg-surface-2 border border-outline rounded-tile p-4">
              <h4 className="mt-0">{entry.type === 'overtime' ? 'Add overtime' : 'Add unauthorised absence'}</h4>
              <div className="grid gap-3">
                <Field label="Starts" htmlFor="efStart"><TextInput id="efStart" type="datetime-local" value={entry.start} onChange={e => setEntry({ ...entry, start: e.target.value.slice(0, 16) })} /></Field>
                <Field label="Ends" htmlFor="efEnd"><TextInput id="efEnd" type="datetime-local" value={entry.end} onChange={e => setEntry({ ...entry, end: e.target.value.slice(0, 16) })} /></Field>
                <Field label="Note (optional)" htmlFor="efNote"><TextInput id="efNote" type="text" maxLength={80} value={entry.note} onChange={e => setEntry({ ...entry, note: e.target.value })} /></Field>
              </div>
              <p id="efError" role="alert" className={entry.error ? 'warn bg-warn-c text-on-warn-c rounded-lg px-2.5 py-1 text-sm mt-2' : 'sr-only'}>{entry.error ?? ''}</p>
              <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                <Button variant="primary" data-action="entry-save" onClick={saveEntry}>Save</Button>
                <Button variant="ghost" data-action="entry-cancel" onClick={() => setEntry(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
              <Button inline className="w-full" data-action="cal-appt" data-date={d} onClick={() => { setEntry(null); setAppt(appointmentOn(d)); }}><CalendarPlus size={18} aria-hidden="true" /> Appointment</Button>
              <Button inline className="w-full" data-action="entry-new" data-kind="overtime" onClick={() => { setAppt(null); setEntry(newEntryForm(data, d, 'overtime')); }}><Clock size={18} aria-hidden="true" /> Overtime</Button>
              <Button inline className="w-full" data-action="entry-new" data-kind="unauthorised" onClick={() => { setAppt(null); setEntry(newEntryForm(data, d, 'unauthorised')); }}><UserX size={18} aria-hidden="true" /> Absence</Button>
            </div>
          )}
      </div>

      <div className={block}>
        <h3>Appointments</h3>
        {appts.length ? <CommitmentRows list={appts} k={d} onEdit={c => { setEntry(null); setAppt(editForm(c)); }} onDelete={onDeleteCommitment} /> : <p className="text-[15px] text-fg-2 m-0">None.</p>}
        <h3 className="mt-4">Overtime &amp; absence</h3>
        {ents.length ? ents.map(e => (
          <div key={e.id} className="c-row flex justify-between items-center gap-2.5 py-2.5 border-t border-outline first:border-t-0">
            <div className="min-w-0">
              <RotaChip data={data} kind={e.kind} label={STATUS_LABEL[e.kind]} />
              <p className="meta m-0 mt-1 text-sm text-fg-3 tabular-nums">{fmtShiftRange(e.start, e.end, d)}{e.note ? ' · ' + e.note : ''}</p>
            </div>
            <Button inline data-action="entry-del" data-id={e.id} aria-label={`Remove ${STATUS_LABEL[e.kind]}`} onClick={() => deleteEntry(e)}><X size={18} aria-hidden="true" /></Button>
          </div>
        )) : <p className="text-[15px] text-fg-2 m-0">None.</p>}
      </div>

      {/* Change this one date. The repeating pattern itself never moves. */}
      <div className={`${block} -mx-5 px-5 pb-1 bg-surface-2/60`}>
        <h3>This date only</h3>
        <p className="text-[15px] text-fg-2">Changes here are for {longDate(d)} only. The rest of your rota doesn't move.</p>
        <Field label="Planned shift for this date" htmlFor="calPlanned">
          <Select id="calPlanned" data-cal="planned" value={plannedSel} onChange={e => setPlanned(e.target.value)}>
            <option value="rota">Follow the rota{rotaType ? ` (${STATUS_LABEL[rotaType]})` : ''}</option>
            <option value="day">Day shift</option><option value="night">Night shift</option><option value="off">Off</option><option value="custom">Custom</option>
          </Select>
        </Field>
        {plannedSel === 'custom' && (
          <div className="grid gap-3 mt-3">
            <Field label="Label" htmlFor="calPLabel"><CommitInput id="calPLabel" key={'pl' + (ov.planned?.label ?? '')} type="text" maxLength={40} data-cal="planned-label" defaultValue={ov.planned?.label || 'Custom'} onCommit={el => setPlannedField(el, 'label', ov.planned?.label || 'Custom')} /></Field>
            <div className="grid grid-cols-2 gap-2.5">
              {timeInput('calPStart', 'Starts', ov.planned?.start, el => setPlannedField(el, 'start', ov.planned?.start ?? ''))}
              {timeInput('calPEnd', 'Ends', ov.planned?.end, el => setPlannedField(el, 'end', ov.planned?.end ?? ''))}
            </div>
          </div>
        )}
        {(plannedSel === 'day' || plannedSel === 'night') && (
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {timeInput('calPStart', 'Starts', p?.start, el => setPlannedField(el, 'start', p?.start ?? ''))}
            {timeInput('calPEnd', 'Ends', p?.end, el => setPlannedField(el, 'end', p?.end ?? ''))}
          </div>
        )}
        <div className="mt-3">
          <Field label="What happened" htmlFor="calActual">
            <Select id="calActual" data-cal="actual" value={actualSel} onChange={e => setActual(e.target.value)}>
              <option value="planned">{isFuture ? 'As planned' : 'As planned (not marked)'}</option>
              <option value="worked">Worked — different hours</option><option value="sick">Sick</option><option value="annual_leave">Annual leave</option>
              <option value="cancelled">Cancelled</option><option value="off">Off instead</option><option value="custom">Custom</option>
            </Select>
          </Field>
        </div>
        {actualSel === 'worked' && (
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {timeInput('calAStart', 'Actually started', ov.actual?.start || p?.start, el => setActualField(el, 'start', ov.actual?.start || p?.start || ''))}
            {timeInput('calAEnd', 'Actually finished', ov.actual?.end || p?.end, el => setActualField(el, 'end', ov.actual?.end || p?.end || ''))}
          </div>
        )}
        {actualSel === 'custom' && (
          <div className="grid gap-3 mt-3">
            <Field label="Label" htmlFor="calALabel"><CommitInput id="calALabel" key={'al' + (ov.actual?.label ?? '')} type="text" maxLength={40} data-cal="actual-label" defaultValue={ov.actual?.label || 'Custom'} onCommit={el => setActualField(el, 'label', ov.actual?.label || 'Custom')} /></Field>
            <div className="grid grid-cols-2 gap-2.5">
              {timeInput('calAStart', 'Starts (optional)', ov.actual?.start, el => setActualField(el, 'start', ov.actual?.start ?? ''))}
              {timeInput('calAEnd', 'Ends', ov.actual?.end, el => setActualField(el, 'end', ov.actual?.end ?? ''))}
            </div>
            <label className="check flex items-center gap-2.5 min-h-11 text-[15px]">
              <input type="checkbox" data-cal="actual-paid" className="size-[22px] accent-primary flex-none" checked={!!ov.actual?.paid} onChange={e => setActualField(e.target, 'paid', '')} /> Paid
            </label>
          </div>
        )}
        {actualSel === 'sick' && <p className="text-[15px] text-fg-2 mt-2 mb-0">Your planned {p && p.works ? (p.type === 'custom' ? p.label : STATUS_LABEL[p.type]) : 'day'} is kept. For sick pay, mark every full day you were too unwell to work.</p>}
        {a.assumed && p && p.works && !isFuture && <p className="text-[15px] text-fg-2 mt-2 mb-0">Not marked yet — pay treats it as worked as planned.</p>}
        <div className="grid gap-2.5 mt-3 mb-3">
          {data.rota.overrides[d] && <Button variant="ghost" data-action="cal-reset-date" onClick={resetDate}>Clear changes for this date</Button>}
          <Button variant="ghost" data-action="pattern-new" data-from="day" onClick={onChangePattern}><Repeat size={18} aria-hidden="true" /> Change the repeating pattern instead</Button>
        </div>
      </div>
    </section>
  );
}
