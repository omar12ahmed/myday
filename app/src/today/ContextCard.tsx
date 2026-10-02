import { Button } from '../components/Button';
import { CommitInput, Field, Select } from '../components/Field';
import { dtToMin, fmtDuration, fmtRange, isDateKey, isTime, relDay, shift, shortDate } from '../data/dates';
import { intIn } from '../data/util';
import { rotaWorkBlocks } from '../data/rota';
import { commitmentsOn, conflictsFor, contextFor, ensureContext } from '../data/schedule';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { Commitment, Energy, MyDayData } from '../data/types';
import { CommitmentForm, CommitmentRows } from '../commitments/CommitmentForm';
import { editForm, newCommitForm, type CommitForm } from '../commitments/commitForm';
import { EnergySlider } from './EnergySlider';

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
          {todays.length ? <CommitmentRows list={todays} k={k} onEdit={c => setForm(editForm(c))} onDelete={onDeleteCommitment} />
            : rotaToday.length ? null : <p className="text-[15px] text-fg-2 m-0">Nothing booked today.</p>}
          {rotaToday.length > 0 && (
            <p className="text-[15px] mt-2 mb-0">
              From your rota: {rotaToday.map(c => `${c.title} ${fmtRange(c.start, c.end, k)}`).join(', ')} · <a className="text-primary underline" href="#calendar">change it in Calendar</a>
            </p>
          )}
          {form ? (
            <CommitmentForm form={form} setForm={setForm} onSaved={onChanged} />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 mt-2.5">
              <Button inline className="w-full" data-action="commit-new" data-kind="work" onClick={() => setForm(newCommitForm('work'))}>+ Work shift</Button>
              <Button inline className="w-full" data-action="commit-new" data-kind="appointment" onClick={() => setForm(newCommitForm('appointment'))}>+ Appointment</Button>
            </div>
          )}
          {upcoming.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer min-h-11 flex items-center text-[15px] text-fg-2">Coming up on other days ({upcoming.length})</summary>
              <CommitmentRows list={upcoming} k={k} onEdit={c => setForm(editForm(c))} onDelete={onDeleteCommitment} />
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
