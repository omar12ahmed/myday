import { X } from 'lucide-react';
import { Button } from '../components/Button';
import { CommitInput, Field, Select, TextInput } from '../components/Field';
import { dtToMin, fmtDuration, fmtRange, isDateKey, isDateTime, isTime, relDay, shift, shortDate } from '../data/dates';
import { intIn, uid } from '../data/normalize';
import { rotaWorkBlocks } from '../data/rota';
import { commitmentsOn, conflictsFor, contextFor, ensureContext, KIND_LABEL } from '../data/schedule';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { Commitment, Energy, MyDayData } from '../data/types';
import { CURRENT_MYDAY_URL } from '../links';
import { newCommitForm, type CommitForm } from './commitForm';
import { EnergySlider } from './EnergySlider';

// Saves the form, or returns why it can't be saved.
function saveCommitment(f: CommitForm): string | null {
  const kind = f.kind === 'work' ? 'work' : 'appointment';
  if (!isDateTime(f.start) || !isDateTime(f.end)) return 'Please add a start and an end, each with a date and time.';
  if (f.end <= f.start) return 'The end needs to be after the start. For a night shift, set the end to the next day.';
  if (dtToMin(f.end, f.start.slice(0, 10)) - dtToMin(f.start, f.start.slice(0, 10)) > 7 * 1440) return "That's longer than a week — please check the dates.";
  const title = f.title.trim() || KIND_LABEL[kind];
  update(d => {
    const c = f.id ? d.commitments.find(x => x.id === f.id) : null;
    if (c) Object.assign(c, { kind, title, start: f.start, end: f.end });
    else d.commitments.push({ id: 'c' + uid(), kind, title, start: f.start, end: f.end });
    d.commitments.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  });
  return null;
}

function sleepSummary(data: MyDayData, k: string): string {
  const sl = contextFor(data, k).sleep;
  if (sl.start && sl.end) {
    if (sl.end <= sl.start) return 'The wake-up time needs to be after the time you fell asleep — check the days.';
    const m = dtToMin(sl.end, k) - dtToMin(sl.start, k);
    if (m > 1440) return "That's more than 24 hours — check the days.";
    const at = (dt: string) => `${relDay(dt.slice(0, 10), k) || 'today'} ${dt.slice(11)}`;
    return `${fmtDuration(m)} of sleep (${at(sl.start)} → ${at(sl.end)}). Tasks won't be suggested while you were asleep.`;
  }
  if (sl.start || sl.end) return 'Add both times to use them — or just give a rough estimate below.';
  if (sl.estimatedHours) return `About ${sl.estimatedHours} h of sleep (your estimate).`;
  return 'Optional. Just for your own record, and so tasks are never suggested while you were asleep.';
}

function reviewHint(data: MyDayData, k: string): string {
  const d = data.days[k];
  if (!d || d.rest) return '';
  const ctx = contextFor(data, k), bits: string[] = [];
  if (ctx.energy && d.energy && ctx.energy !== d.energy) bits.push(`Your energy is now ${ctx.energy} (the plan was made for ${d.energy}).`);
  if (d.tasks.some(t => !t.done && t.scheduledStart && conflictsFor(data, k, dtToMin(t.scheduledStart, k), t.minutes, [], false).length)) {
    bits.push("Something on today's plan now overlaps your commitments.");
  }
  return bits.length ? bits.join(' ') + ' Tap “Review my plan” to see suggested changes.' : '';
}

function CommitmentRows({ list, k, onEdit, onDelete }: { list: Commitment[]; k: string; onEdit: (c: Commitment) => void; onDelete: (c: Commitment) => void }) {
  return list.map(c => (
    <div key={c.id} className="c-row flex justify-between items-center gap-2.5 py-2.5 border-t border-outline first:border-t-0">
      <div className="min-w-0">
        <span className={`chip inline-flex text-xs font-bold tracking-[.04em] uppercase px-[9px] py-0.5 rounded-full ${c.kind === 'work' ? 'bg-work-c text-work' : 'bg-appt-c text-appt'}`}>{KIND_LABEL[c.kind]}</span>
        <p className="title m-0 mt-1">{c.title}</p>
        <p className="meta m-0 text-sm text-fg-3 tabular-nums">{fmtRange(c.start, c.end, k)}</p>
      </div>
      <div className="flex gap-1.5 flex-none">
        <Button inline data-action="commit-edit" data-id={c.id} onClick={() => onEdit(c)}>Edit</Button>
        <Button inline data-action="commit-del" data-id={c.id} aria-label={`Remove ${c.title}`} onClick={() => onDelete(c)}><X size={18} aria-hidden="true" /></Button>
      </div>
    </div>
  ));
}

export function ContextCard({ data, k, open, onOpenChange, form, setForm, onChanged, onReview, onDeleteCommitment }: {
  data: MyDayData; k: string; open: boolean; onOpenChange: (open: boolean) => void;
  form: CommitForm | null; setForm: (f: CommitForm | null) => void;
  onChanged: () => void;            // the context changed: refresh any open proposal
  onReview: () => void;
  onDeleteCommitment: (c: Commitment) => void;
}) {
  const ctx = contextFor(data, k), sl = ctx.sleep, st = data.settings, y = shift(k, -1);
  const d = data.days[k];
  const todays = commitmentsOn(data, k);
  const rotaToday = rotaWorkBlocks(data, k).filter(c => dtToMin(c.end, k) > 0 && dtToMin(c.start, k) < 1440);
  const upcoming = data.commitments.filter(c => !todays.includes(c) && c.start.slice(0, 10) > k);
  const dateOpts = (sel: string) => {
    const opts = [y, k];
    if (sel && !opts.includes(sel)) opts.unshift(sel);
    return opts.map(x => <option key={x} value={x}>{x === y ? 'Yesterday' : x === k ? 'Today' : shortDate(x)}</option>);
  };

  // Sleep: read all five fields and save them together (as the current MyDay does).
  function saveSleep() {
    const v = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
    const stTime = v('sst').slice(0, 5), etTime = v('set').slice(0, 5), est = v('sest'), n = Number(est);
    let bad = false;
    update(dr => {
      const c = ensureContext(dr, k);
      c.sleep.start = isTime(stTime) && isDateKey(v('ssd')) ? `${v('ssd')}T${stTime}` : null;
      c.sleep.end = isTime(etTime) && isDateKey(v('sed')) ? `${v('sed')}T${etTime}` : null;
      if (est === '') c.sleep.estimatedHours = null;
      else if (n > 0 && n <= 24) c.sleep.estimatedHours = Math.round(n * 4) / 4;
      else bad = true;
    });
    if (bad) {
      const el = document.getElementById('sest') as HTMLInputElement | null;
      if (el) el.value = sl.estimatedHours === null ? '' : String(sl.estimatedHours); // put back the saved value
      toast('A sleep estimate needs to be between 0 and 24 hours.');
    }
    onChanged();
  }

  // Scheduling settings. Invalid values are put back, with a message saying why.
  function saveMinutes(el: HTMLInputElement, key: 'bufferMinutes' | 'gapMinutes') {
    const max = key === 'bufferMinutes' ? 240 : 60;
    const n = intIn(el.value, 0, max, null);
    if (n === null) { el.value = String(st[key]); toast(`Please use a number from 0 to ${max}.`); return; }
    update(dr => { dr.settings[key] = n; });
    onChanged();
  }
  function saveTime(el: HTMLInputElement, key: 'earliestTime' | 'latestTime') {
    const t = el.value.slice(0, 5);
    const ok = isTime(t) && (key === 'earliestTime' ? t < st.latestTime : t > st.earliestTime);
    if (!ok) { el.value = st[key]; toast('The earliest task time needs to be before the finish time.'); return; }
    update(dr => { dr.settings[key] = t; });
    onChanged();
  }

  const hint = reviewHint(data, k);
  const booked = todays.length + rotaToday.length;
  const brief = [booked ? `${booked} booked today` : 'Nothing booked today', sl.start && sl.end ? 'sleep recorded' : '', `${st.bufferMinutes} min prep/travel`].filter(Boolean).join(' · ');
  const block = 'ctx-block border-t border-outline pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0';

  return (
    <details id="ctxDetails" open={open || !!form} onToggle={e => onOpenChange((e.target as HTMLDetailsElement).open)}
      className="card group/ctx bg-surface border border-outline rounded-card p-5 mb-4 shadow-card">
      <summary className="flex justify-between items-center gap-3 min-h-11 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span>
          <h2 className="m-0">My day's context</h2>
          {!d && <span className="meta block text-sm text-fg-3">{brief}</span>}
        </span>
        <span className="flex-none text-sm font-semibold rounded-full px-3.5 py-1.5 bg-tonal text-on-tonal">
          <span className="group-open/ctx:hidden">Show</span><span className="hidden group-open/ctx:inline">Hide</span>
        </span>
      </summary>
      <div className="mt-3">
        {!d && <p className="text-[15px] text-fg-2">Optional: sleep, shifts, appointments and prep time. Building your day plans around whatever is here.</p>}

        <div className={block}>
          <h3>Sleep</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="grid gap-1.5 content-start">
              <label className="text-sm text-fg-2" htmlFor="ssd">Fell asleep</label>
              <Select id="ssd" key={`ssd${sl.start}`} defaultValue={sl.start ? sl.start.slice(0, 10) : y} onChange={saveSleep}>{dateOpts(sl.start ? sl.start.slice(0, 10) : y)}</Select>
              <CommitInput id="sst" key={`sst${sl.start}`} type="time" aria-label="Time you fell asleep" defaultValue={sl.start ? sl.start.slice(11) : ''} onCommit={saveSleep} />
            </div>
            <div className="grid gap-1.5 content-start">
              <label className="text-sm text-fg-2" htmlFor="sed">Woke up</label>
              <Select id="sed" key={`sed${sl.end}`} defaultValue={sl.end ? sl.end.slice(0, 10) : k} onChange={saveSleep}>{dateOpts(sl.end ? sl.end.slice(0, 10) : k)}</Select>
              <CommitInput id="set" key={`set${sl.end}`} type="time" aria-label="Time you woke up" defaultValue={sl.end ? sl.end.slice(11) : ''} onCommit={saveSleep} />
            </div>
          </div>
          <Field className="mt-3" label="Don't know the times? A rough estimate in hours (optional)" htmlFor="sest">
            <CommitInput id="sest" key={`sest${sl.estimatedHours}`} type="number" inputMode="decimal" min={0} max={24} step={0.25} defaultValue={sl.estimatedHours ?? ''} onCommit={saveSleep} />
          </Field>
          <p id="sleepSummary" className="text-[15px] text-fg-2 mt-2 mb-0">{sleepSummary(data, k)}</p>
        </div>

        {d && (
          <div className={block}>
            <h3>Energy</h3>
            <EnergySlider key={`${ctx.energy || d.energy || 3}`} initial={(ctx.energy || d.energy || 3) as Energy}
              onCommit={v => { update(dr => { ensureContext(dr, k).energy = v; }); onChanged(); }} />
          </div>
        )}

        <div className={block}>
          <h3>Work &amp; appointments today</h3>
          {todays.length ? <CommitmentRows list={todays} k={k} onEdit={c => setForm({ key: uid(), id: c.id, kind: c.kind, title: c.title, start: c.start, end: c.end })} onDelete={onDeleteCommitment} />
            : rotaToday.length ? null : <p className="text-[15px] text-fg-2 m-0">Nothing booked today.</p>}
          {rotaToday.length > 0 && (
            <p className="text-[15px] mt-2 mb-0">
              From your rota: {rotaToday.map(c => `${c.title} ${fmtRange(c.start, c.end, k)}`).join(', ')}
              {CURRENT_MYDAY_URL && <> · <a className="text-primary underline" href={`${CURRENT_MYDAY_URL}#calendar`}>change it in the current MyDay's Calendar</a></>}
            </p>
          )}
          {form ? (
            <div id="cForm" className="c-form bg-surface-2 border border-outline rounded-tile p-4 mt-2.5" data-key={form.key}>
              <h4 className="mt-0">{form.id ? 'Edit commitment' : form.kind === 'work' ? 'New work shift' : 'New appointment'}</h4>
              <div className="grid gap-3">
                <Field label="Type" htmlFor="cfKind">
                  <Select id="cfKind" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value === 'work' ? 'work' : 'appointment' })}>
                    <option value="work">Work shift</option><option value="appointment">Appointment</option>
                  </Select>
                </Field>
                <Field label="Title" htmlFor="cfTitle">
                  <TextInput id="cfTitle" type="text" value={form.title} placeholder={form.kind === 'work' ? 'Work shift' : 'e.g. Dentist'} autoFocus onChange={e => setForm({ ...form, title: e.target.value })} />
                </Field>
                <Field label="Starts" htmlFor="cfStart">
                  <TextInput id="cfStart" type="datetime-local" value={form.start} onChange={e => setForm({ ...form, start: e.target.value.slice(0, 16) })} />
                </Field>
                <Field label="Ends" htmlFor="cfEnd">
                  <TextInput id="cfEnd" type="datetime-local" value={form.end} onChange={e => setForm({ ...form, end: e.target.value.slice(0, 16) })} />
                </Field>
              </div>
              <p className="text-[15px] text-fg-2 mt-2">A night shift can end the next day — just pick the next date.</p>
              <p id="cfError" role="alert" className={form.error ? 'warn bg-warn-c text-on-warn-c rounded-lg px-2.5 py-1 text-sm' : 'sr-only'}>{form.error ?? ''}</p>
              <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                <Button variant="primary" data-action="commit-save" onClick={() => {
                  const err = saveCommitment(form);
                  if (err) { setForm({ ...form, error: err }); return; }
                  setForm(null); onChanged(); toast('Saved.');
                }}>Save</Button>
                <Button variant="ghost" data-action="commit-cancel" onClick={() => setForm(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 mt-2.5">
              <Button inline className="w-full" data-action="commit-new" data-kind="work" onClick={() => setForm(newCommitForm('work'))}>+ Work shift</Button>
              <Button inline className="w-full" data-action="commit-new" data-kind="appointment" onClick={() => setForm(newCommitForm('appointment'))}>+ Appointment</Button>
            </div>
          )}
          {upcoming.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer min-h-11 flex items-center text-[15px] text-fg-2">Coming up on other days ({upcoming.length})</summary>
              <CommitmentRows list={upcoming} k={k} onEdit={c => setForm({ key: uid(), id: c.id, kind: c.kind, title: c.title, start: c.start, end: c.end })} onDelete={onDeleteCommitment} />
            </details>
          )}
        </div>

        <div className={block}>
          <h3>Prep &amp; travel</h3>
          <div className="flex items-center gap-2.5">
            <CommitInput id="bufferMinutes" key={`b${st.bufferMinutes}`} className="!w-24 flex-none" type="number" inputMode="numeric" min={0} max={240} step={5} data-setting="bufferMinutes"
              defaultValue={st.bufferMinutes} aria-label="Prep and travel minutes" onCommit={el => saveMinutes(el, 'bufferMinutes')} />
            <span className="text-[15px]">min before and after each commitment</span>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer min-h-11 flex items-center text-[15px] text-fg-2">More scheduling settings</summary>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Earliest task time" htmlFor="earliestTime">
                <CommitInput id="earliestTime" key={`e${st.earliestTime}`} type="time" data-setting="earliestTime" defaultValue={st.earliestTime} onCommit={el => saveTime(el, 'earliestTime')} />
              </Field>
              <Field label="Finish tasks by" htmlFor="latestTime">
                <CommitInput id="latestTime" key={`l${st.latestTime}`} type="time" data-setting="latestTime" defaultValue={st.latestTime} onCommit={el => saveTime(el, 'latestTime')} />
              </Field>
            </div>
            <div className="flex items-center gap-2.5 mt-3">
              <CommitInput id="gapMinutes" key={`g${st.gapMinutes}`} className="!w-24 flex-none" type="number" inputMode="numeric" min={0} max={60} step={5} data-setting="gapMinutes"
                defaultValue={st.gapMinutes} aria-label="Breathing room minutes" onCommit={el => saveMinutes(el, 'gapMinutes')} />
              <span className="text-[15px]">min breathing room between tasks</span>
            </div>
          </details>
        </div>

        {d && !d.rest && (
          <div className={block}>
            {hint && <p id="reviewHint" className="text-[15px]">{hint}</p>}
            <Button variant="primary" data-action="review" onClick={onReview}>Review my plan</Button>
          </div>
        )}
      </div>
    </details>
  );
}
