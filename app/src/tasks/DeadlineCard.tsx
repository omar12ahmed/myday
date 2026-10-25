import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CommitInput, Field } from '../components/Field';
import { Choice, Choices, Note } from '../components/parts';
import { deadlineNoted, deadlineToNote, noteDeadlineDone } from '../data/deadlines';
import { update } from '../data/storage';
import { isDone, setDeadline, TASK_LIMITS } from '../data/tasks';
import { toast } from '../data/toast';
import type { MyDayData, TaskItem } from '../data/types';

// Deadlines you can trust (specs/projects-deadlines.md): on a project's dated task, whether the date is a firm deadline
// or one to aim for, where it comes from, and who checked it and when. It stays a task, so Today, Coming up and Needs
// you keep working. Once a Case's deadline is done, one tap notes it on the case's timeline. Never sent to AI.
export function DeadlineCard({ data, t }: { data: MyDayData; t: TaskItem }) {
  const dl = t.deadline;
  // (A done or let-go task isn't asked whether its date is a deadline; one it has is still shown.)
  if (!t.projectId || !t.due || (!dl && (isDone(data, t) || t.letGoOn))) return null;
  const offer = deadlineToNote(data, t), noted = deadlineNoted(data, t);
  const save = (patch: Parameters<typeof setDeadline>[2], said?: string) => { if (update(d => (setDeadline(d.tasks, t.id, patch) ? undefined : false)) && said) toast(said); };
  function note() {
    let r = null as ReturnType<typeof noteDeadlineDone>;
    update(d => { r = noteDeadlineDone(d, t.id); if (!r || r === 'full' || r === 'big') return false; });
    // (The button goes with the offer, so the keyboard moves to the line that says it's noted.)
    if (r && r !== 'full' && r !== 'big') setTimeout(() => document.getElementById('deadlineNoted')?.focus(), 0);
    toast(r === 'full' ? 'The timeline is full — remove an entry to add this.' : r === 'big' ? 'This case is too large to add to. Nothing changed.' : r ? 'Noted on the timeline.' : 'Nothing to note.');
  }
  return (
    <Card aria-labelledby="deadline-h" id="taskDeadline">
      <h3 id="deadline-h" className="m-0">Deadline</h3>
      <div className="mt-3"><Choices label="Is this date a deadline?">
        <Choice on={dl?.kind === 'firm'} data-action="deadline-kind" data-id="firm" onClick={() => save({ kind: 'firm' }, 'Marked as a firm deadline.')}>Firm deadline</Choice>
        <Choice on={dl?.kind === 'aim'} data-action="deadline-kind" data-id="aim" onClick={() => save({ kind: 'aim' }, 'Marked as a date to aim for.')}>Date to aim for</Choice>
        <Choice on={!dl} data-action="deadline-kind" data-id="none" onClick={() => save(null, 'Just a date now.')}>Not a deadline</Choice>
      </Choices></div>
      {dl && (
        <div className="grid gap-3">
          <Field label="Where does this date come from? (optional)" htmlFor="tDlFrom">
            <CommitInput id="tDlFrom" key={`f${dl.from}`} defaultValue={dl.from} maxLength={TASK_LIMITS.deadlineFrom} placeholder="e.g. The tribunal's letter of 3 Oct" onCommit={el => save({ from: el.value }, 'Saved.')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Checked by (optional)" htmlFor="tDlBy" className="min-w-0"><CommitInput id="tDlBy" className="min-w-0" key={`b${dl.checkedBy}`} defaultValue={dl.checkedBy} maxLength={TASK_LIMITS.checkedBy} placeholder="e.g. Me" onCommit={el => save({ checkedBy: el.value }, 'Saved.')} /></Field>
            <Field label="Checked on (optional)" htmlFor="tDlOn" className="min-w-0"><CommitInput id="tDlOn" type="date" className="min-w-0" key={`o${dl.checkedOn}`} defaultValue={dl.checkedOn ?? ''} onCommit={el => save({ checkedOn: el.value || null }, 'Saved.')} /></Field>
          </div>
          <Note className="m-0">MyDay doesn't work out legal deadlines; it keeps the ones you enter.</Note>
        </div>
      )}
      {offer && (
        <div className="mt-3 rounded-tile bg-surface-2 border border-outline px-3.5 py-3" data-s="deadline-offer">
          <p className="m-0 font-semibold">It's done — note it on the case's timeline?</p>
          <p className="m-0 text-sm text-fg-2">“Done: {t.title}”, on the day it was done, as your account.</p>
          <Button inline variant="primary" className="mt-2" data-action="deadline-note" onClick={note}>Note it on the timeline</Button>
        </div>
      )}
      {noted && <p className="m-0 mt-3 text-sm text-fg-2" data-s="deadline-noted" id="deadlineNoted" tabIndex={-1}>Noted on the case's timeline.</p>}
    </Card>
  );
}
