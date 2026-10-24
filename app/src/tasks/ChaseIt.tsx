import { useState } from 'react';
import { Button } from '../components/Button';
import { Field, TextInput } from '../components/Field';
import { Choice, Choices } from '../components/parts';
import { isDateKey, shift, shortDate, todayKey } from '../data/dates';
import { update } from '../data/storage';
import { chaseTask, chaseWaiting } from '../data/tasks';
import { toast } from '../data/toast';
import type { DateKey, MyDayData, TaskItem } from '../data/types';

// "Chase it" (1.50.0): one 5-minute follow-up for a wait, on the day you choose — today, tomorrow, a day you pick, or
// no date (owner's choice). A dated one reaches Today on its day like any dated task. The rules are in data/tasks.ts.
type When = 'today' | 'tomorrow' | 'day' | 'none';
const WHEN: [When, string][] = [['today', 'Today'], ['tomorrow', 'Tomorrow'], ['day', 'Pick a day'], ['none', 'No date']];
export function ChaseIt({ data, t, primary = false, inProject = true }: { data: MyDayData; t: TaskItem; primary?: boolean; inProject?: boolean }) {
  const [open, setOpen] = useState(false), [when, setWhen] = useState<When>('today'), [day, setDay] = useState('');
  const where = inProject && t.projectId ? 'this project’s tasks' : 'your tasks';
  if (chaseTask(data, t)) return <span className="inline-flex items-center min-h-11 text-[15px] text-fg-2" data-s="chase-added">A task to chase it is in {where}.</span>;
  if (!open) return <Button inline variant={primary ? 'primary' : 'ghost'} data-action="chase" aria-expanded={false} onClick={() => setOpen(true)}>Chase it</Button>;
  const k = todayKey(), due: DateKey | null = when === 'today' ? k : when === 'tomorrow' ? shift(k, 1) : when === 'day' && isDateKey(day) ? day : null;
  function add() {
    let r = null as ReturnType<typeof chaseWaiting>;
    if (update(d => { r = chaseWaiting(d, t.id, due); if (!r || r === 'already') return false; })) {
      toast(`Added “Chase: ${t.title}” (5 min) ${due ? `for ${due === k ? 'today' : shortDate(due)}` : 'with no date'} — it’s in ${where}.`);
      setOpen(false);
    }
  }
  return (
    <div className="w-full mt-1" data-s="chase-when">
      <p className="text-sm font-semibold m-0 mb-1.5" id={`chaseWhen-${t.id}`}>When would you like to chase it?</p>
      <Choices label="When would you like to chase it?">
        {WHEN.map(([v, label]) => <Choice key={v} on={when === v} data-s="chase-when-choice" data-id={v} onClick={() => setWhen(v)}>{label}</Choice>)}
      </Choices>
      {when === 'day' && <Field label="Which day?" htmlFor={`chaseDay-${t.id}`} className="-mt-2 mb-3"><TextInput id={`chaseDay-${t.id}`} type="date" className="!w-auto" min={k} value={day} onChange={e => setDay(e.target.value)} /></Field>}
      <div className="flex flex-wrap gap-2.5">
        <Button inline variant="primary" data-action="chase-add" disabled={when === 'day' && !isDateKey(day)} onClick={add}>Add chase task</Button>
        <Button inline variant="ghost" data-action="chase-cancel" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
