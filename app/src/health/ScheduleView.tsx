import { AlertTriangle, CalendarPlus, Pencil, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CommitInput, Field, Select, TextInput } from '../components/Field';
import { BackLink, Chip, Eyebrow, LinkButton, Meta, Note, Row, Summary } from '../components/parts';
import { isDateKey, isTime, shortDate, timeToMin, todayKey } from '../data/dates';
import { conflictsFor } from '../data/schedule';
import type { DateKey, MyDayData } from '../data/types';
import { WEEKDAYS, weekdayName } from '../data/workout/common';
import { sessionPlanFor, tplById } from '../data/workout/plans';
import { proposeSessions, type ProposedSession } from '../data/workout/propose';
import { applyProposed, planRemove, planSession, seqAdd, seqNext, seqRemove, setRestDays, setScheduleMode, setWeekday } from './actions';

// Warnings for a session on `date` at `time`, from the same overlap check Today and Calendar use
// (shifts, appointments and their prep time, sleep, your task window). The session's own old plan is
// left out, so it doesn't warn about itself.
function planWarnings(data: MyDayData, date: string, time: string, tplId: string, from: DateKey | null): string[] {
  const w = data.health.workout, t = tplById(w, tplId), out: string[] = [];
  if (!isDateKey(date) || !t) return out;
  const replaced = w.planned[date] && w.planned[date].status === 'planned' && date !== from ? tplById(w, w.planned[date].templateId) : null;
  if (replaced) out.push(`This replaces ${replaced.name}, already planned for ${shortDate(date)}.`);
  else if (date !== from) {
    const sched = sessionPlanFor(w, date);
    if (sched && !sched.explicit && sched.templateId !== tplId) out.push(`Your weekday schedule has ${tplById(w, sched.templateId)!.name} on ${shortDate(date)} — this replaces it for that day only.`);
  }
  if (isTime(time)) {
    const planned = { ...w.planned };
    delete planned[date];
    if (from) delete planned[from];
    const probe = { ...data, health: { ...data.health, workout: { ...w, planned } } };
    out.push(...conflictsFor(probe, date, timeToMin(time), t.minutes, [], true));
  }
  return out;
}

// Plan one session on a date — or, with `from`, change one planned session (date, time or workout).
// Templates and the repeating schedule are never changed from here.
function PlanForm({ data, from, start, onDone }: { data: MyDayData; from: DateKey | null; start: { date: string; time: string; tplId: string }; onDone: () => void }) {
  const live = data.health.workout.templates.filter(t => !t.archived), k = todayKey();
  const [f, setF] = useState(start);
  const warnings = planWarnings(data, f.date, f.time, f.tplId, from);
  const id = from ? 'chg' : 'plan';
  return (
    <div className={`${from ? 'plan-change' : 'plan-add'} grid gap-3 mt-2`}>
      <div className="field-row grid grid-cols-2 gap-2.5">
        <Field label="Date" htmlFor={`${id}Date`} className="min-w-0"><TextInput id={`${id}Date`} type="date" min={k} className="min-w-0 !px-2" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Time (optional)" htmlFor={`${id}Time`} className="min-w-0"><TextInput id={`${id}Time`} type="time" className="min-w-0 !px-2" value={f.time} onChange={e => setF({ ...f, time: e.target.value.slice(0, 5) })} /></Field>
      </div>
      <Field label="Workout" htmlFor={`${id}Tpl`}>
        <Select id={`${id}Tpl`} value={f.tplId} onChange={e => setF({ ...f, tplId: e.target.value })}>
          {live.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Field>
      {warnings.length > 0 && (
        <ul className="plan-warnings list-none p-0 m-0 grid gap-1.5" aria-live="polite">
          {warnings.map(x => <li key={x} className="flex gap-2 items-start text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2"><AlertTriangle size={16} className="flex-none mt-1" aria-hidden="true" />{x}</li>)}
        </ul>
      )}
      <div className="flex gap-2.5 flex-wrap">
        <Button inline variant="primary" data-action={from ? 'h-plan-change-save' : 'h-plan-add'} disabled={!isDateKey(f.date) || f.date < k || !tplById(data.health.workout, f.tplId)}
          onClick={() => { if (planSession(f.date, f.time, f.tplId, from)) onDone(); }}>
          {from ? 'Save this change' : warnings.length ? 'Add anyway' : 'Add'}
        </Button>
        {from && <Button inline variant="ghost" data-action="h-plan-change-cancel" onClick={onDone}>Cancel</Button>}
      </div>
    </div>
  );
}

export function ScheduleView({ data, proposal, setProposal }: { data: MyDayData; proposal: ProposedSession[] | null; setProposal: (p: ProposedSession[] | null) => void }) {
  const seqRef = useRef<HTMLSelectElement>(null);
  const [changing, setChanging] = useState<DateKey | null>(null);
  const [planKey, setPlanKey] = useState(0); // a fresh "plan a session" form after each one is added
  const w = data.health.workout, s = w.schedule, live = w.templates.filter(t => !t.archived), k = todayKey();
  const planned = Object.keys(w.planned).filter(d => d >= k && w.planned[d].status === 'planned').sort();
  const canPropose = s.mode === 'sequence' ? s.sequence.length > 0 : live.length > 0;
  const name = (id: string) => (tplById(w, id) || { name: 'Removed workout' }).name;

  return (
    <>
      <Card aria-labelledby="schv-h">
        <BackLink to="health/workout" label="Workout" />
        <h2 id="schv-h">Schedule</h2>
        <div className="grid gap-3.5">
          <Field label="How you schedule" htmlFor="schMode">
            <Select id="schMode" data-h="sch-mode" value={s.mode} onChange={e => { setScheduleMode(e.target.value); setProposal(null); }}>
              <option value="off">No schedule</option>
              <option value="weekdays">By weekday</option>
              <option value="sequence">Repeating sequence (fits rotating shifts)</option>
            </Select>
          </Field>
          {s.mode === 'weekdays' && WEEKDAYS.map(d => (
            <div key={d} className="field-row wd-row grid grid-cols-[7.5em_minmax(0,1fr)] gap-3 items-center">
              <span className="text-[15px]">{weekdayName(d)}</span>
              <Select data-h="sch-weekday" data-dow={d} aria-label={weekdayName(d)} value={s.weekdays[d] || ''} onChange={e => setWeekday(d, e.target.value)}>
                <option value="">Rest day</option>
                {live.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
          ))}
          {s.mode === 'sequence' && (
            <div>
              <Note>Do these in order, on whichever days suit you — it doesn't follow weekdays.</Note>
              {s.sequence.map((id, i) => (
                <div key={i} className="seq-row flex items-center gap-2.5 py-2 border-t border-outline first:border-t-0">
                  <span className="set-num w-6 text-center font-bold text-fg-2 tabular-nums">{i + 1}</span>
                  <span className="title flex-1 min-w-0">{name(id)}</span>
                  {i === s.next % Math.max(1, s.sequence.length) ? <Chip>Next</Chip> : <LinkButton data-action="h-seq-next" data-i={i} onClick={() => seqNext(i)}>Make next</LinkButton>}
                  <Button inline variant="ghost" className="!px-0 !w-11 flex-none" data-action="h-seq-remove" data-i={i} aria-label="Remove from sequence" onClick={() => seqRemove(i)}><X size={18} aria-hidden="true" /></Button>
                </div>
              ))}
              {live.length ? (
                <div className="inline-add flex gap-2 items-center mt-2">
                  <Select ref={seqRef} id="seqAdd" aria-label="Workout to add" className="flex-1 min-w-0">{live.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
                  <Button inline className="flex-none" data-action="h-seq-add" onClick={() => seqRef.current && seqAdd(seqRef.current.value)}>Add to sequence</Button>
                </div>
              ) : <Note>Create a workout first.</Note>}
            </div>
          )}
          {s.mode !== 'off' && (
            <>
              <Field label="Rest days between proposed sessions" htmlFor="schRest">
                <CommitInput key={s.restDays} id="schRest" type="number" inputMode="numeric" min={0} max={6} data-h="sch-rest" defaultValue={s.restDays} onCommit={setRestDays} />
              </Field>
              <Button data-action="h-propose" disabled={!canPropose} onClick={() => setProposal(proposeSessions(data))}><CalendarPlus size={18} aria-hidden="true" /> Propose dates around my shifts</Button>
            </>
          )}
        </div>
      </Card>

      {proposal && (
        <Card tone="accent" id="wsProposal" className="proposal" aria-labelledby="prop-h">
          <Eyebrow>Not saved yet</Eyebrow>
          <h2 id="prop-h">Proposed workout dates</h2>
          <Note>Fitted around your shifts, appointments and task window. Untick anything you don't want.</Note>
          {proposal.length ? proposal.map((p, i) => (
            <label key={p.date + i} className="check prop-check flex items-start gap-2.5 min-h-11 py-1.5 text-[15px] cursor-pointer">
              <input type="checkbox" data-h="prop-pick" data-i={i} className="size-[22px] accent-primary flex-none mt-0.5" checked={p.pick} disabled={p.kind === 'nofit'}
                onChange={e => setProposal(proposal.map((x, j) => (j === i ? { ...x, pick: e.target.checked } : x)))} />
              <span><strong>{shortDate(p.date)}</strong>{p.time ? ' · ' + p.time : ''} — {name(p.templateId)}
                <Meta>{p.kind === 'move' ? ` (moved from ${shortDate(p.from!)} — no room that day)` : p.kind === 'nofit' ? ' — no free slot that day or nearby; leave it or move it yourself' : ''}</Meta></span>
            </label>
          )) : <p className="text-[15px]">No free slots found in the next few weeks with your current rest-day setting.</p>}
          <div className="row2 grid grid-cols-2 gap-2.5 mt-2">
            <Button variant="primary" data-action="h-prop-apply" disabled={!proposal.some(p => p.pick && p.kind !== 'nofit')} onClick={() => { applyProposed(proposal); setProposal(null); }}>Add to my plan</Button>
            <Button variant="ghost" data-action="h-prop-cancel" onClick={() => setProposal(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      <Card aria-labelledby="planned-h">
        <h2 id="planned-h">Planned sessions</h2>
        <Note>Changing one planned session here leaves your workouts and your repeating schedule as they are.</Note>
        {planned.length ? planned.map(d => (
          <div key={d}>
            <Row>
              <div className="min-w-0"><strong>{shortDate(d)}</strong>{w.planned[d].time ? ' · ' + w.planned[d].time : ''}<div><Meta>{name(w.planned[d].templateId)}</Meta></div></div>
              <div className="c-actions flex gap-1 flex-none">
                <Button inline variant="ghost" data-action="h-plan-change" data-date={d} aria-label={`Change the session on ${shortDate(d)}`} aria-expanded={changing === d} onClick={() => setChanging(changing === d ? null : d)}><Pencil size={16} aria-hidden="true" /> Change</Button>
                <Button inline variant="ghost" className="!px-0 !w-11" data-action="h-plan-remove" data-date={d} aria-label={`Remove plan for ${shortDate(d)}`} onClick={() => planRemove(d)}><X size={18} aria-hidden="true" /></Button>
              </div>
            </Row>
            {changing === d && live.length > 0 && (
              <div className="pb-3">
                <PlanForm key={d} data={data} from={d} start={{ date: d, time: w.planned[d].time || '', tplId: tplById(w, w.planned[d].templateId) && !tplById(w, w.planned[d].templateId)!.archived ? w.planned[d].templateId : live[0].id }} onDone={() => setChanging(null)} />
              </div>
            )}
          </div>
        )) : <Note className="m-0">Nothing planned on specific dates.</Note>}
        {live.length > 0 && (
          <details className="group mt-2">
            <Summary>Plan a session on a date</Summary>
            <PlanForm key={planKey} data={data} from={null} start={{ date: k, time: '', tplId: live[0].id }} onDone={() => setPlanKey(n => n + 1)} />
          </details>
        )}
      </Card>
    </>
  );
}
