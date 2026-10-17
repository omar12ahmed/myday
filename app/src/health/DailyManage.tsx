import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { LinkButton, Meta, Note, Summary } from '../components/parts';
import { parseKey, todayKey } from '../data/dates';
import { liveExercises, weekBars } from '../data/health/daily';
import type { DailyExercise, MyDayData } from '../data/types';
import { addDailyExercise, stepDaily, toggleDailyArchived } from './dailyActions';

// A − value + stepper for a daily target or set size (small steps under 10, steps of 5 above).
function Stepper({ e, field, label }: { e: DailyExercise; field: 'target' | 'set'; label: string }) {
  return (
    <div className="flex items-center gap-1 text-[13px] font-semibold text-fg-3" role="group" aria-label={`${e.name} ${label}`}>
      <span className="mr-0.5">{label}</span>
      <Button inline variant="ghost" className="!min-h-9 !px-2.5" data-action={`daily-${field}`} data-id={e.id} data-dir="-1" aria-label={`${label} down`} onClick={() => stepDaily(e.id, field, -1)}>−</Button>
      <b className="min-w-9 text-center text-fg tabular-nums">{e[field]}</b>
      <Button inline variant="ghost" className="!min-h-9 !px-2.5" data-action={`daily-${field}`} data-id={e.id} data-dir="1" aria-label={`${label} up`} onClick={() => stepDaily(e.id, field, 1)}>+</Button>
    </div>
  );
}

// Daily exercises in Health → Workout: adjust a target or set size, add an exercise, archive one.
// Changes apply from today — days already logged stay exactly as they were.
export function DailyManage({ data }: { data: MyDayData }) {
  const d = data.health.daily, live = liveExercises(d), archived = d.exercises.filter(e => e.archived);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null), targetRef = useRef<HTMLInputElement>(null), setRef = useRef<HTMLInputElement>(null);
  const bars = weekBars(d, todayKey());
  function add() {
    const msg = addDailyExercise(nameRef.current?.value || '', targetRef.current?.value || '', setRef.current?.value || '');
    setError(msg);
    if (!msg) setAdding(false);
  }
  return (
    <Card aria-labelledby="daily-mg-h">
      <h2 id="daily-mg-h">Daily exercises</h2>
      {live.length === 0 && !adding && (
        <Note className="mt-1">Everyday movements with a daily target — like 150 push-ups, in sets of 25. They count down on Today, one tap per set.</Note>
      )}
      {live.map(e => (
        <div key={e.id} className="daily-mg-row py-3 border-t border-dashed border-outline first-of-type:border-t-0">
          <div className="flex justify-between items-center gap-3">
            <div className="min-w-0"><div className="font-bold">{e.name}</div><Meta>daily target {e.target} · in sets of {e.set}</Meta></div>
            <LinkButton data-action="daily-archive" data-id={e.id} className="flex-none !min-h-0 text-sm" onClick={() => toggleDailyArchived(e.id)}>Archive</LinkButton>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2">
            <Stepper e={e} field="target" label="target" />
            <Stepper e={e} field="set" label="set" />
          </div>
        </div>
      ))}
      {adding ? (
        <div className="mt-3">
          <Field label="Exercise" htmlFor="dailyName"><TextInput ref={nameRef} id="dailyName" maxLength={80} placeholder="Push-ups" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Daily target" htmlFor="dailyTarget"><TextInput ref={targetRef} id="dailyTarget" type="number" min={1} max={1000} placeholder="150" /></Field>
            <Field label="In sets of" htmlFor="dailySet"><TextInput ref={setRef} id="dailySet" type="number" min={1} max={500} placeholder="25" /></Field>
          </div>
          {error && <Note className="!text-[14px] mb-2"><span role="alert">{error}</span></Note>}
          <div className="row2 grid grid-cols-2 gap-2.5">
            <Button variant="primary" data-action="daily-add-save" onClick={add}>Add</Button>
            <Button variant="ghost" data-action="daily-add-cancel" onClick={() => { setAdding(false); setError(null); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" data-action="daily-add" className="mt-2 border-dashed" onClick={() => setAdding(true)}><Plus size={16} aria-hidden="true" /> Add an exercise</Button>
      )}
      {archived.length > 0 && (
        <details className="group mt-1">
          <Summary>Archived ({archived.length})</Summary>
          <ul className="list-none p-0 m-0">
            {archived.map(e => (
              <li key={e.id} className="flex justify-between items-center gap-2.5 py-2.5 border-t border-outline first:border-t-0">
                <div className="title min-w-0">{e.name}</div>
                <Button inline data-action="daily-archive" data-id={e.id} onClick={() => toggleDailyArchived(e.id)}>Restore</Button>
              </li>
            ))}
          </ul>
        </details>
      )}
      {bars.some(b => b.state !== 'none') && (
        <div className="mt-3 pt-3 border-t border-outline">
          <Meta>This week</Meta>
          <div className="flex gap-1.5 mt-2" role="img" aria-label="This week: a bar for each day, full when every exercise was finished">
            {bars.map(b => (
              <span key={b.day} className="flex-1 text-center text-[11px] font-bold text-fg-3">
                <i className={`block h-2 rounded mb-1 border ${b.state === 'full' ? 'bg-health border-health' : b.state === 'part' ? 'bg-health-c border-health' : 'bg-surface-2 border-outline'}`} />
                {parseKey(b.day).toLocaleDateString(undefined, { weekday: 'narrow' })}
              </span>
            ))}
          </div>
          <Note className="mt-2 mb-0 !text-[13px]">A full bar is a day you finished every exercise; a soft bar is some. Empty is simply a quieter day.</Note>
        </div>
      )}
    </Card>
  );
}
