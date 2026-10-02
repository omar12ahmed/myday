import { Plus, X } from 'lucide-react';
import { Button } from '../components/Button';
import { useConfirm } from '../components/confirm';
import { Card } from '../components/Card';
import { CommitInput, Field, Select } from '../components/Field';
import { dayDiff, isDateKey, isTime, shift, shortDate, todayKey } from '../data/dates';
import { cycleOf, mod, savePatternVersion, SHIFT_TYPES, SHORT_LABEL, STATUS_LABEL } from '../data/rota';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData, ShiftType } from '../data/types';
import { clone, intIn, uid } from '../data/util';
import { RotaChip } from './Chips';
import type { PatternForm } from './forms';

// Setting up, or changing, the REPEATING pattern. A change starts on a chosen date and is saved as a new
// version: earlier dates, one-date changes and anything you've recorded stay exactly as they are.
export function PatternEditor({ data, form, setForm, onSaved }: { data: MyDayData; form: PatternForm; setForm: (f: PatternForm | null) => void; onSaved: () => void }) {
  const confirm = useConfirm();
  const f = form;
  const cycle = cycleOf(f.segments);
  const change = (fn: (x: PatternForm) => void) => { const x = clone(f); fn(x); delete x.error; setForm(x); };

  async function save() {
    const err = (m: string) => setForm({ ...f, error: m });
    if (!isDateKey(f.anchor)) return err('Please choose the first day of the cycle.');
    if (!cycle.length || cycle.length > 56) return err('The cycle needs between 1 and 56 days.');
    for (const t of ['day', 'night'] as const) if (f.times[t].start === f.times[t].end) return err(`The ${t} shift needs different start and end times.`);
    if (!f.first) {
      if (!isDateKey(f.effectiveFrom)) return err('Please choose when the change starts.');
      if (f.effectiveFrom < todayKey() && !(await confirm({
        title: `Change planned shifts from ${shortDate(f.effectiveFrom)}?`,
        body: "That date is in the past. Anything you've recorded (sickness, leave, overtime, actual hours) stays as it is.",
        confirmLabel: 'Change the pattern',
      }))) return;
    }
    const version = { id: 'p' + uid(), effectiveFrom: f.first ? null : f.effectiveFrom, anchor: f.anchor, cycle, times: clone(f.times), breaks: clone(f.breaks) };
    if (!update(d => savePatternVersion(d, version))) return;
    setForm(null);
    onSaved();
    toast(f.first ? 'Pattern saved — your calendar is filled in.' : `Pattern changes from ${shortDate(f.effectiveFrom)}.`);
  }

  // A preview of the next 28 days (or the whole cycle, if shorter).
  const from = f.first ? f.anchor : f.effectiveFrom;
  const preview = cycle.length && isDateKey(f.anchor) && isDateKey(from)
    ? Array.from({ length: Math.min(cycle.length, 28) }, (_, i) => { const d = shift(from, i); return { d, t: cycle[mod(dayDiff(d, f.anchor), cycle.length)] }; })
    : [];
  const time = (id: string, label: string, t: 'day' | 'night', which: 'start' | 'end') => (
    <Field label={label} htmlFor={id}>
      <CommitInput id={id} key={id + f.times[t][which]} type="time" data-pf={`${t}-${which}`} defaultValue={f.times[t][which]}
        onCommit={el => { const v = el.value.slice(0, 5); if (isTime(v)) change(x => { x.times[t][which] = v; }); else el.value = f.times[t][which]; }} />
    </Field>
  );

  return (
    <Card id="patternCard" tone="accent" aria-labelledby="pattern-h" className="scroll-mt-24">
      <h2 id="pattern-h">{f.first ? 'Set up your shift pattern' : 'Change your repeating pattern'}</h2>
      <p className="text-[15px] text-fg-2">
        {f.first ? 'Pick a date that was (or will be) the first day of your cycle.'
          : "This changes every date from the day you choose. Earlier dates, one-date changes and anything you've recorded stay as they are."}
      </p>
      <div className="grid gap-3">
        {!f.first && (
          <Field label="Change starts on" htmlFor="pfFrom">
            <CommitInput id="pfFrom" key={'f' + f.effectiveFrom} type="date" data-pf="effectiveFrom" defaultValue={f.effectiveFrom} onCommit={el => change(x => { x.effectiveFrom = el.value; })} />
          </Field>
        )}
        <Field label="First day of the cycle (anchor date)" htmlFor="pfAnchor">
          <CommitInput id="pfAnchor" key={'a' + f.anchor} type="date" data-pf="anchor" defaultValue={f.anchor} onCommit={el => change(x => { x.anchor = el.value; })} />
        </Field>
      </div>

      <h4>Repeating blocks</h4>
      <div className="grid gap-2">
        {f.segments.map((sg, i) => (
          <div key={i} className="seg-row grid grid-cols-[minmax(0,1fr)_76px_auto_48px] gap-2 items-center">
            <Select data-pf="seg-type" data-i={i} aria-label={`Block ${i + 1} type`} value={sg.type} onChange={e => change(x => { x.segments[i].type = e.target.value as ShiftType; })}>
              {SHIFT_TYPES.map(t => <option key={t} value={t}>{STATUS_LABEL[t]}</option>)}
            </Select>
            <CommitInput key={`c${i}-${sg.count}`} type="number" min={1} max={28} inputMode="numeric" data-pf="seg-count" data-i={i} defaultValue={sg.count} aria-label={`Block ${i + 1} days`}
              onCommit={el => change(x => { x.segments[i].count = intIn(el.value, 1, 28, x.segments[i].count); })} />
            <span className="text-sm text-fg-3">days</span>
            <Button inline className="!px-0 !w-12 !min-h-12" data-action="seg-remove" data-i={i} aria-label={`Remove block ${i + 1}`} disabled={f.segments.length === 1}
              onClick={() => change(x => { if (x.segments.length > 1) x.segments.splice(i, 1); })}><X size={18} aria-hidden="true" /></Button>
          </div>
        ))}
      </div>
      <Button inline className="mt-2" data-action="seg-add" disabled={f.segments.length >= 12} onClick={() => change(x => { if (x.segments.length < 12) x.segments.push({ type: 'off', count: 1 }); })}><Plus size={18} aria-hidden="true" /> Add a block</Button>
      <p id="pfCycle" className="text-[15px] text-fg-2 mt-2 mb-0">Cycle length: {cycle.length} days</p>

      <h4>Shift times</h4>
      <div className="grid grid-cols-2 gap-2.5">{time('pfDayS', 'Day starts', 'day', 'start')}{time('pfDayE', 'Day ends', 'day', 'end')}</div>
      <div className="grid grid-cols-2 gap-2.5 mt-2.5">{time('pfNightS', 'Night starts', 'night', 'start')}{time('pfNightE', 'Night ends', 'night', 'end')}</div>
      <p className="text-[15px] text-fg-2 mt-2">An end time earlier than the start means the shift finishes the next morning.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {(['day', 'night'] as const).map(t => (
          <Field key={t} label={`Unpaid break, ${t} (min)`} htmlFor={t === 'day' ? 'pfBD' : 'pfBN'}>
            <CommitInput id={t === 'day' ? 'pfBD' : 'pfBN'} key={t + f.breaks[t]} type="number" min={0} max={240} inputMode="numeric" data-pf={`break-${t}`} defaultValue={f.breaks[t]}
              onCommit={el => change(x => { x.breaks[t] = intIn(el.value, 0, 240, 0); })} />
          </Field>
        ))}
      </div>

      {preview.length > 0 && (
        <div id="pfPreview">
          <p className="text-sm text-fg-2 mt-3 mb-1.5">Preview from {shortDate(from)}</p>
          <div className="grid grid-cols-7 gap-1">
            {preview.map(({ d, t }) => (
              <div key={d} className="bg-surface-2 rounded-lg px-0.5 py-1 grid gap-0.5 text-center text-xs min-w-0">
                <span className="text-fg-3 font-bold">{+d.slice(8)}</span>
                {t === 'off' ? <span className="cal-off text-[11px] text-fg-3">Off</span> : <RotaChip data={data} kind={t} label={SHORT_LABEL[t]} size="cell" />}
              </div>
            ))}
          </div>
        </div>
      )}
      <p id="pfError" role="alert" className={f.error ? 'warn bg-warn-c text-on-warn-c rounded-lg px-2.5 py-1 text-sm mt-3' : 'sr-only'}>{f.error ?? ''}</p>
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <Button variant="primary" data-action="pattern-save" onClick={save}>Save pattern</Button>
        <Button variant="ghost" data-action="pattern-cancel" onClick={() => setForm(null)}>Cancel</Button>
      </div>
    </Card>
  );
}
