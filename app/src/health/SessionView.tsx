import { Check, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { BackLink, Chip, Eyebrow, LinkButton, Note, TextLink } from '../components/parts';
import { longDate } from '../calendar/describe';
import { shortDate } from '../data/dates';
import { update } from '../data/storage';
import { fmtClock } from '../data/timer';
import type { MyDayData, SessionExercise, WorkoutSession } from '../data/types';
import { EX_TYPE_LABEL, fmtSet, planText } from '../data/workout/common';
import { activeWorkout } from '../data/workout/plans';
import { lastResultFor, restRemaining, setsDone, setsTotal } from '../data/workout/sessions';
import { addSet, deleteSession, discardActive, finishActive, prefill, removeLastSet, setRestEnabled, setSetField, skipRest, toggleSet } from './actions';
import { ResultFields } from './SetFields';

// The optional rest countdown after a set. It runs by the clock (a refresh or a sleeping phone keeps it
// right), and when it ends it says so gently.
function RestBar({ data, done, setDone }: { data: MyDayData; done: boolean; setDone: (v: boolean) => void }) {
  const w = data.health.workout, rest = w.rest;
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!rest) return;
    const id = setInterval(() => {
      if (restRemaining(w) <= 0) {
        update(d => { if (!d.health.workout.rest) return false; d.health.workout.rest = null; });
        setDone(true);
        try { navigator.vibrate?.(120); } catch { /* not supported */ }
      } else setTick(n => n + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [rest, w, setDone]);
  if (rest) {
    return (
      <div className="rest-bar flex items-center gap-3 mt-2.5 px-3.5 py-2.5 rounded-tile bg-primary-container text-on-primary-container" role="status">
        <span>Rest</span>
        <strong id="restTime" role="timer" className="text-[22px] tabular-nums flex-1">{fmtClock(restRemaining(w))}</strong>
        <Button inline data-action="h-rest-skip" onClick={() => { skipRest(); setDone(false); }}>Skip rest</Button>
      </div>
    );
  }
  if (done) return <div className="rest-bar done mt-2.5 px-3.5 py-2.5 rounded-tile bg-primary-container text-on-primary-container" role="status">Rest done — go when you're ready.</div>;
  return null;
}

// One set: its number, the result boxes, and a big Done button.
function SetRow({ s, e, i, onTicked }: { s: WorkoutSession; e: SessionExercise; i: number; onTicked: (restStarted: boolean) => void }) {
  const x = e.sets[i];
  return (
    <div className={`set-row grid grid-cols-[28px_minmax(0,1fr)_64px] gap-2 items-end py-2 border-t border-outline${x.done ? ' done' : ''}`}>
      <span className="set-num self-center text-center font-bold text-fg-2 tabular-nums">{i + 1}</span>
      <div className={x.done ? 'opacity-75' : ''}>
        <ResultFields type={e.type} set={x} label={`Set ${i + 1}`}
          attrs={f => ({ 'data-h': 'set', 'data-ex': e.key, 'data-set': i, 'data-field': f })}
          onSave={(f, v) => setSetField(s.id, e.key, i, f, v)} />
      </div>
      <button type="button" data-action="h-set-done" data-ex={e.key} data-set={i} aria-pressed={x.done}
        aria-label={`Set ${i + 1} ${x.done ? 'done — tap to undo' : 'mark done'}`}
        className={`set-done w-16 min-h-14 rounded-tile font-bold border-2 cursor-pointer grid place-items-center transition-colors ${x.done ? 'on bg-primary text-on-primary border-primary' : 'bg-surface-2 text-fg border-outline-strong'}`}
        onClick={() => onTicked(toggleSet(s.id, e.key, i))}>
        {x.done ? <Check size={26} strokeWidth={3} aria-hidden="true" /> : 'Done'}
      </button>
    </div>
  );
}

// One exercise: the plan, last time's result, and a row per set.
function ExerciseBlock({ data, s, e, active, onTicked }: { data: MyDayData; s: WorkoutSession; e: SessionExercise; active: boolean; onTicked: (restStarted: boolean) => void }) {
  const confirm = useConfirm();
  const last = lastResultFor(data.health.workout, e.exerciseId, s.id);
  async function removeLast() {
    const x = e.sets[e.sets.length - 1];
    if (!x) return;
    if (x.done && !(await confirm({ title: 'Remove the last set?', body: 'It was marked done.', confirmLabel: 'Remove it', cancelLabel: 'Keep it' }))) return;
    removeLastSet(s.id, e.key);
  }
  return (
    <Card className="ex-block" aria-label={e.name}>
      <div className="card-head flex justify-between items-center gap-3 mb-1">
        <h3 className="ex-name !text-[17px] !normal-case !tracking-normal !text-fg !m-0">{e.name}</h3>
        <Chip>{EX_TYPE_LABEL[e.type]}</Chip>
      </div>
      <p className="text-[15px] text-fg-2 mb-1">Plan: {planText(e.type, e.plan)}</p>
      <p className="text-[15px] text-fg-2 mb-2">{last ? `Last time (${shortDate(last.session.date)}): ${last.ex.sets.filter(x => x.done).map(x => fmtSet(e.type, x)).join(', ')}` : 'No previous result yet.'}</p>
      {active && (
        <div className="mb-1">
          <p className="text-[15px] text-fg-2 m-0">Prefilled from {e.prefill === 'last' ? 'last time' : 'your plan'} — change anything.</p>
          {e.prefill === 'last'
            ? <LinkButton data-action="h-prefill" data-ex={e.key} data-from="plan" onClick={() => prefill(e.key, 'plan')}>Use plan values</LinkButton>
            : last && <LinkButton data-action="h-prefill" data-ex={e.key} data-from="last" onClick={() => prefill(e.key, 'last')}>Use last time's values</LinkButton>}
        </div>
      )}
      {e.sets.map((_, i) => <SetRow key={i} s={s} e={e} i={i} onTicked={onTicked} />)}
      <div className="row2 grid grid-cols-2 gap-2.5 mt-2.5">
        <Button inline data-action="h-set-add" data-ex={e.key} onClick={() => addSet(s.id, e.key)}><Plus size={16} aria-hidden="true" /> Add set</Button>
        <Button inline variant="ghost" data-action="h-set-remove" data-ex={e.key} disabled={!e.sets.length} onClick={removeLast}><Minus size={16} aria-hidden="true" /> Remove last set</Button>
      </div>
    </Card>
  );
}

// The workout in progress. Every tap and number is saved straight away, so you can leave and come back.
export function ActiveSession({ data }: { data: MyDayData }) {
  const confirm = useConfirm();
  const [restDone, setRestDone] = useState(false);
  const w = data.health.workout, s = activeWorkout(w);
  if (!s) {
    return <Card><h2>No workout in progress</h2><Note>Start one from your workouts.</Note><TextLink href="#health/workout">Back to Workout</TextLink></Card>;
  }
  const done = setsDone(s), total = setsTotal(s);
  async function finish() {
    if (done < total && !(await confirm({ title: 'Finish now?', body: `You've done ${done} of ${total} sets — a shorter session still counts.`, confirmLabel: 'Finish', cancelLabel: 'Keep going' }))) return;
    finishActive();
  }
  async function cancel() {
    if (await confirm({ title: 'Cancel this workout?', body: 'Nothing has been logged yet.', confirmLabel: 'Cancel workout', cancelLabel: 'Keep it' })) discardActive();
  }
  return (
    <>
      <Card tone="accent" className="session-head lg:sticky lg:top-24 lg:z-[5]" aria-labelledby="ws-h">
        <Eyebrow>Workout in progress</Eyebrow>
        <h2 id="ws-h">{s.templateName}</h2>
        <p id="wsProgress" className="text-[15px] text-fg-2 mb-1">{done} of {total} sets done · saved as you go</p>
        <label className="check flex items-center gap-2.5 min-h-11 text-[15px] cursor-pointer">
          <input type="checkbox" data-h="rest-enabled" className="size-[22px] accent-primary flex-none" checked={w.restTimer.enabled} onChange={e => { setRestEnabled(e.target.checked); setRestDone(false); }} /> Rest timer after each set
        </label>
        <div id="restBar"><RestBar data={data} done={restDone} setDone={setRestDone} /></div>
      </Card>
      {s.exercises.length ? s.exercises.map(e => <ExerciseBlock key={e.key} data={data} s={s} e={e} active onTicked={started => { if (started) setRestDone(false); }} />)
        : <Card><Note className="m-0">This workout has no exercises.</Note></Card>}
      <Card>
        <div className="grid gap-2.5">
          <Button variant="primary" data-action="h-ws-finish" onClick={finish}>Finish workout</Button>
          <a className="btn inline-flex items-center justify-center min-h-tap w-full rounded-btn bg-tonal text-on-tonal font-[550]" href="#health/workout">Leave for now — I'll come back</a>
          {done === 0 && <Button variant="ghost" data-action="h-ws-discard" onClick={cancel}>Cancel this workout</Button>}
        </div>
      </Card>
    </>
  );
}

// A finished workout, where you can correct anything logged wrongly. Templates aren't affected.
export function LoggedSession({ data, id }: { data: MyDayData; id: string }) {
  const confirm = useConfirm();
  const s = data.health.workout.sessions.find(x => x.id === id);
  if (!s || s.status === 'active') {
    return <Card><h2>Workout not found</h2><Note>It may have been deleted.</Note><TextLink href="#health/workout">Back to Workout</TextLink></Card>;
  }
  const done = setsDone(s), total = setsTotal(s);
  async function del() {
    if (await confirm({ title: 'Delete this workout from your history?', body: "This can't be undone.", confirmLabel: 'Delete it', cancelLabel: 'Keep it' })) deleteSession(s!.id);
  }
  return (
    <>
      <Card aria-labelledby="log-h">
        <BackLink to="health/workout/history" label="All history" />
        <h2 id="log-h">{s.templateName}</h2>
        <Note>{longDate(s.date)} · {done} of {total} sets · {s.status === 'short' ? 'shorter session' : 'full session'}{s.editedAt ? ` · corrected ${shortDate(s.editedAt.slice(0, 10))}` : ''}</Note>
        <Note className="m-0">Fix anything that was logged wrongly — changes save as you go. Your workout templates aren't affected.</Note>
      </Card>
      {s.exercises.map(e => <ExerciseBlock key={e.key} data={data} s={s} e={e} active={false} onTicked={() => {}} />)}
      <Card><Button variant="ghost" data-action="h-ws-delete" data-id={s.id} onClick={del}>Delete this workout from history</Button></Card>
    </>
  );
}
