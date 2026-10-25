import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CommitInput, Field, TextInput } from '../components/Field';
import { LinkButton, Note } from '../components/parts';
import { update } from '../data/storage';
import { addStep, allStepsDone, editStep, isDone, moveStep, removeStep, setTaskDone, stepsText, TASK_LIMITS, tickStep } from '../data/tasks';
import { toast } from '../data/toast';
import type { MyDayData, TaskItem } from '../data/types';

// Steps inside a task (specs/projects-steps.md): a short checklist ("Measure the wall", "Order the boards"). Tick them
// as you go; "Change steps" edits, reorders and removes them. The task stays the one thing you plan. Once every step
// is ticked it offers to mark the task done: one tap, never by itself. The rules are in data/tasks.ts; saved and
// synced with the task, and not sent to AI.
export function StepsCard({ data, t }: { data: MyDayData; t: TaskItem }) {
  const [text, setText] = useState(''), [changing, setChanging] = useState(false);
  const steps = t.steps ?? [], done = isDone(data, t) || !!t.letGoOn, full = steps.length >= TASK_LIMITS.steps;
  const focusSoon = (id: string) => setTimeout(() => document.getElementById(id)?.focus(), 0);
  function add() {
    if (!update(d => (addStep(d.tasks, t.id, text) ? undefined : false))) return;
    setText('');
  }
  function remove(i: number) {
    if (!update(d => (removeStep(d.tasks, t.id, steps[i].id) ? undefined : false))) return;
    toast('Step removed.');
    const next = steps[i + 1] ?? steps[i - 1];
    focusSoon(next ? `step-${next.id}` : 'stepNew');
    if (steps.length === 1) setChanging(false);
  }
  function markDone() {
    if (update(d => (setTaskDone(d, t.id, true) ? undefined : false))) toast('Done — nice.');
  }
  return (
    <Card aria-labelledby="steps-h" id="taskSteps">
      <div className="flex flex-wrap justify-between items-baseline gap-x-3">
        <h3 id="steps-h" className="m-0">Steps{steps.length > 0 && <span className="text-fg-3 font-normal text-[15px] tabular-nums ml-2" data-s="steps-count">{stepsText(t)}</span>}</h3>
        {steps.length > 0 && <LinkButton className="text-[15px]" aria-pressed={changing} data-action="steps-change" onClick={() => setChanging(!changing)}>{changing ? 'Done changing' : 'Change steps'}</LinkButton>}
      </div>
      {!steps.length && <Note className="mt-1 mb-0">If it helps, break it into small steps. The task stays the one thing you plan.</Note>}
      {steps.length > 0 && (
        <ul className="list-none p-0 m-0 mt-1" data-s="steps">
          {steps.map((st, i) => changing ? (
            <li key={st.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-center py-2 border-t border-outline first:border-t-0" data-s="step" data-id={st.id}>
              <CommitInput id={`step-${st.id}`} type="text" defaultValue={st.text} key={st.text} maxLength={TASK_LIMITS.step} aria-label={`Step ${i + 1}`}
                onCommit={el => { if (!update(d => (editStep(d.tasks, t.id, st.id, el.value) ? undefined : false))) el.value = st.text; }} />
              <span className="flex gap-1.5">
                <Button inline className="!px-3" aria-label={`Move “${st.text}” up`} disabled={i === 0} data-action="step-up" onClick={() => update(d => (moveStep(d.tasks, t.id, st.id, -1) ? undefined : false))}><ArrowUp size={18} aria-hidden="true" /></Button>
                <Button inline className="!px-3" aria-label={`Move “${st.text}” down`} disabled={i === steps.length - 1} data-action="step-down" onClick={() => update(d => (moveStep(d.tasks, t.id, st.id, 1) ? undefined : false))}><ArrowDown size={18} aria-hidden="true" /></Button>
                <Button inline className="!px-3" aria-label={`Remove “${st.text}”`} data-action="step-remove" onClick={() => remove(i)}><X size={18} aria-hidden="true" /></Button>
              </span>
            </li>
          ) : (
            <li key={st.id} className="border-t border-outline first:border-t-0" data-s="step" data-id={st.id} data-done={st.done ? 'yes' : 'no'}>
              <label className="flex items-start gap-3 min-h-11 py-2.5 cursor-pointer">
                <input type="checkbox" id={`step-${st.id}`} className="size-[22px] accent-done m-0 mt-px flex-none cursor-pointer" data-s="step-done" checked={st.done}
                  onChange={e => { const v = e.target.checked; update(d => (tickStep(d.tasks, t.id, st.id, v) ? undefined : false)); }} />
                <span className={`min-w-0 break-words leading-snug ${st.done ? 'line-through text-fg-3' : ''}`}>{st.text}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {/* Said once every step is ticked, while the task is still to do; it's your tap that marks it done. */}
      <div aria-live="polite">
        {allStepsDone(t) && !done && (
          <div className="mt-3 rounded-tile bg-surface-2 border border-outline px-3.5 py-3" data-s="steps-all-done">
            <p className="m-0 font-semibold">{steps.length === 1 ? 'Its step is done' : `All ${steps.length} steps done`} — mark the task done?</p>
            <Button inline variant="primary" className="mt-2" data-action="steps-mark-done" onClick={markDone}>Mark the task done</Button>
          </div>
        )}
      </div>
      {!changing && (full ? <Note className="mb-0 mt-3">{TASK_LIMITS.steps} steps is the most a task can have.</Note> : (
        <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-3" onSubmit={e => { e.preventDefault(); add(); }}>
          <Field label="Add a step" htmlFor="stepNew"><TextInput id="stepNew" value={text} maxLength={TASK_LIMITS.step} placeholder="e.g. Measure the wall" onChange={e => setText(e.target.value)} /></Field>
          <Button inline type="submit" data-action="step-add" disabled={!text.trim()}>Add</Button>
        </form>
      ))}
    </Card>
  );
}
