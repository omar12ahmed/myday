import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { shortDate, todayKey } from '../data/dates';
import { update } from '../data/storage';
import { setWaiting, stopWaiting, TASK_LIMITS } from '../data/tasks';
import { toast } from '../data/toast';
import type { DateKey, MyDayData, TaskItem } from '../data/types';
import { ChaseIt } from './ChaseIt';

// Waiting on someone or something (1.50.0): who or what, and when you expect it. While it waits, MyDay doesn't pick
// it as a project's next step or offer it for Today. "Got it" ends the wait; "Chase it" adds one 5-minute follow-up.
// The rules are in data/tasks.ts. Never sent to AI.
export function WaitingCard({ data, t, asking = false, onClose }: { data: MyDayData; t: TaskItem; asking?: boolean; onClose: () => void }) {
  const [editing, setEditing] = useState(asking && !t.waiting);
  if (!t.waiting && !editing) return null;
  function done() {
    if (update(d => (stopWaiting(d.tasks, t.id) ? undefined : false))) { toast('No longer waiting.'); onClose(); }
  }
  return (
    <Card aria-labelledby="waiting-h" id="taskWaiting">
      <h3 id="waiting-h" className="m-0">Waiting on someone or something</h3>
      {/* However the form ends, the button that opened it is reset, so it never reopens by itself. */}
      {editing ? <WaitingForm t={t} onDone={() => { setEditing(false); onClose(); }} />
        : t.waiting && (
          <>
            <p className="text-[15px] m-0 mt-2 break-words" data-s="waiting-line">Waiting on {t.waiting.on} since {shortDate(t.waiting.since)}{t.waiting.until ? ` · expected ${shortDate(t.waiting.until)}` : ''}</p>
            <p className="text-sm text-fg-2 m-0 mt-1">While it waits, MyDay doesn't pick it as a project's next step or offer it for Today.</p>
            <div className="flex flex-wrap gap-2.5 mt-3">
              <Button inline variant="primary" data-action="wait-done" onClick={done}>Got it</Button>
              <Button inline variant="ghost" data-action="wait-change" onClick={() => setEditing(true)}>Change</Button>
              <ChaseIt data={data} t={t} />
            </div>
          </>
        )}
    </Card>
  );
}

// Who or what, and the day you expect it (optional). A failed save keeps what you typed.
function WaitingForm({ t, onDone }: { t: TaskItem; onDone: (saved: boolean) => void }) {
  const [on, setOn] = useState(t.waiting?.on ?? ''), [until, setUntil] = useState<string>(t.waiting?.until ?? '');
  function save() {
    const first = !t.waiting;
    if (on.trim() === t.waiting?.on && (until || null) === t.waiting?.until) { onDone(true); return; }
    if (update(d => (setWaiting(d.tasks, t.id, on, (until || null) as DateKey | null) ? undefined : false))) {
      toast(first ? `Waiting on ${on.trim()}. MyDay won’t pick it as a next step while you wait.` : 'Saved.');
      onDone(true);
    }
  }
  return (
    <form className="grid gap-3 mt-3" onSubmit={e => { e.preventDefault(); save(); }} data-s="waiting-form">
      <Field label="Who or what are you waiting on?" htmlFor="tWaitOn">
        <TextInput id="tWaitOn" autoFocus value={on} maxLength={TASK_LIMITS.waitingOn} placeholder="e.g. Priya, or the builder's quote" onChange={e => setOn(e.target.value)} />
      </Field>
      <Field label="Expected by (optional)" htmlFor="tWaitUntil">
        <TextInput id="tWaitUntil" type="date" className="!w-auto" min={todayKey()} value={until} onChange={e => setUntil(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2.5">
        <Button inline type="submit" variant="primary" data-action="wait-save" disabled={!on.trim()}>{t.waiting ? 'Save' : 'Mark as waiting'}</Button>
        <Button inline variant="ghost" data-action="wait-cancel" onClick={() => onDone(false)}>Cancel</Button>
      </div>
    </form>
  );
}
