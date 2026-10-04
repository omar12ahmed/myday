import { Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, CommitTextarea, Field, Select } from '../components/Field';
import { BackLink, Choice, Choices, Note } from '../components/parts';
import { CAT_LABEL } from '../data/plan';
import { update } from '../data/storage';
import { addToTodaysPlan, editTask, isDone, moveToTomorrow, onTodaysPlan, planRoom, removeTask, setTaskDone, TASK_LIMITS } from '../data/tasks';
import { toast } from '../data/toast';
import type { Category, MyDayData } from '../data/types';

// One task: its words, list, date and time, length, which kind of task it is (for Today's plan), and notes. Each
// change is saved when you finish it.
export function TaskEditor({ data, id }: { data: MyDayData; id: string }) {
  const confirm = useConfirm();
  const t = data.tasks.items.find(x => x.id === id);
  if (!t) return <><BackLink to="inbox/tasks" label="Tasks" /><Card><h2>This task isn't here</h2><Note className="m-0">It may have been deleted, here or in another tab.</Note></Card></>;
  const save = (patch: Parameters<typeof editTask>[2]) => { if (update(d => (editTask(d.tasks, id, patch) ? undefined : false))) toast('Saved.'); };
  const done = isDone(data, t), planned = onTodaysPlan(data, t), room = planRoom(data);
  async function remove() {
    if (!(await confirm({ title: `Delete “${t!.title}”?`, body: planned ? 'It stays on today\'s plan; only this task goes.' : undefined, confirmLabel: 'Delete', cancelLabel: 'Keep it' }))) return;
    if (update(d => (removeTask(d.tasks, id) ? undefined : false))) toast('Task deleted.');
    location.hash = 'inbox/tasks';
  }
  function plan() {
    let r = '' as ReturnType<typeof addToTodaysPlan> | '';
    update(d => { r = addToTodaysPlan(d, id); if (r !== 'added') return false; });
    toast(r === 'added' ? 'Added to today\'s plan.' : r === 'full' ? `Today's plan is full for your energy (${room.limit} task${room.limit === 1 ? '' : 's'}).` : 'Build your day first, on Today.');
  }
  return (
    <>
      <BackLink to="inbox/tasks" label="Tasks" />
      <Card aria-label="Task" id="taskEditor">
        <div className="grid gap-3">
          <Field label="Task" htmlFor="tTitle"><CommitInput id="tTitle" type="text" key={t.title} defaultValue={t.title} maxLength={TASK_LIMITS.title} onCommit={el => { if (!el.value.trim()) { el.value = t.title; return; } save({ title: el.value }); }} /></Field>
          <Field label="List" htmlFor="tList">
            <Select id="tList" value={data.tasks.lists.some(l => l.id === t.listId) ? t.listId : ''} onChange={e => save({ listId: e.target.value })}>
              <option value="">No list</option>
              {data.tasks.lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date (optional)" htmlFor="tDue" className="min-w-0"><CommitInput id="tDue" type="date" className="min-w-0" key={`d${t.due}`} defaultValue={t.due ?? ''} onCommit={el => save({ due: el.value || null })} /></Field>
            <Field label="Time (optional)" htmlFor="tTime" className="min-w-0"><CommitInput id="tTime" type="time" className="min-w-0" key={`t${t.time}${t.due}`} defaultValue={t.time ?? ''} disabled={!t.due} onCommit={el => save({ time: el.value || null })} /></Field>
          </div>
          <Field label="About how long (minutes)" htmlFor="tMin"><CommitInput id="tMin" type="number" inputMode="numeric" min={5} max={600} key={`m${t.minutes}`} defaultValue={t.minutes} className="!w-28" onCommit={el => save({ minutes: Number(el.value) })} /></Field>
          <div><p className="text-sm font-semibold m-0 mb-1.5">Kind of task (for Today's plan)</p>
            <Choices label="Kind of task">{(['learning', 'admin', 'health'] as Category[]).map(c => <Choice key={c} on={t.category === c} data-s="task-cat" data-id={c} onClick={() => save({ category: c })}>{CAT_LABEL[c]}</Choice>)}</Choices></div>
          <Field label="Notes" htmlFor="tNotes"><CommitTextarea id="tNotes" rows={4} key={`n${t.notes}`} defaultValue={t.notes} maxLength={TASK_LIMITS.notes} onCommit={el => save({ notes: el.value })} /></Field>
        </div>
        <div className="flex flex-wrap gap-2.5 mt-4">
          <Button inline variant={done ? 'selected' : 'primary'} aria-pressed={done} data-action="task-toggle" onClick={() => { const v = !done; if (update(d => (setTaskDone(d, id, v) ? undefined : false))) toast(v ? 'Done — nice.' : 'Not done after all.'); }}>{done ? 'Done ✓' : 'Mark done'}</Button>
          {!done && !planned && <Button inline data-action="task-plan" disabled={!room.built || room.room <= 0} onClick={plan}>Add to today's plan</Button>}
          {!done && <Button inline variant="ghost" data-action="task-tomorrow" onClick={() => { if (update(d => (moveToTomorrow(d.tasks, id) ? undefined : false))) toast('Moved to tomorrow.'); }}>Tomorrow</Button>}
          <Button inline variant="ghost" data-action="task-delete" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Delete</Button>
        </div>
        {!done && !planned && (!room.built || room.room <= 0) && <p className="text-[15px] text-fg-2 mb-0 mt-2" data-s="plan-note">{!room.built ? 'To add it to today\'s plan, build your day on Today first.' : room.rest ? 'Today is a rest day — "Tomorrow" moves it on.' : `Today's plan is full for your energy (${room.limit} task${room.limit === 1 ? '' : 's'}) — "Tomorrow" moves it on.`}</p>}
        {planned && !done && <Note className="mb-0 mt-2">On today's plan — ticking it off there ticks it off here too.</Note>}
      </Card>
    </>
  );
}
