import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, Field, TextInput } from '../components/Field';
import { BackLink, Note } from '../components/parts';
import { update } from '../data/storage';
import { addList, moveList, removeList, renameList, TASK_LIMITS } from '../data/tasks';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';

// Your task lists (e.g. "Moving house"): add, rename, reorder, remove. Removing one never removes its tasks.
export function ListsView({ data }: { data: MyDayData }) {
  const confirm = useConfirm();
  const [name, setName] = useState('');
  const lists = data.tasks.lists;
  const count = (id: string) => data.tasks.items.filter(t => t.listId === id).length;
  function add() {
    let ok = false;
    update(d => { ok = addList(d.tasks, name) !== null; if (!ok) return false; });
    if (ok) { toast(`Made “${name.trim()}”.`); setName(''); } else toast(lists.length >= TASK_LIMITS.lists ? `That's the most lists (${TASK_LIMITS.lists}).` : 'That name is empty or already used.');
  }
  async function remove(id: string, label: string) {
    const n = count(id);
    if (!(await confirm({ title: `Remove “${label}”?`, body: n ? `${n === 1 ? 'Its task stays' : `Its ${n} tasks stay`}, with no list. No tasks are deleted.` : 'It has no tasks.', confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (update(d => (removeList(d.tasks, id).removed ? undefined : false))) toast('Removed.');
  }
  return (
    <>
      <BackLink to="today/tasks" label="Tasks" />
      <Card aria-labelledby="tl-h">
        <h2 id="tl-h">Your lists</h2>
        <Note className="mt-0">Group tasks however you like — "Moving house", "Car", "Work". Removing a list keeps its tasks. (Today's repeating Learning, Admin and Health lists are separate, in Your task lists on Today.)</Note>
        {lists.length > 0 && (
          <ul className="list-none p-0 m-0" id="taskLists">
            {lists.map((l, i) => (
              <li key={l.id} className="tl-row grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-center py-2.5 border-t border-outline first:border-t-0" data-id={l.id}>
                <CommitInput type="text" defaultValue={l.name} key={l.name} maxLength={TASK_LIMITS.listName} aria-label={`Name of ${l.name}`}
                  onCommit={el => { let ok = false; update(d => { ok = renameList(d.tasks, l.id, el.value); if (!ok) return false; }); if (!ok) el.value = l.name; else toast('Saved.'); }} />
                <span className="flex gap-1.5">
                  <Button inline className="!px-3" aria-label={`Move ${l.name} up`} disabled={i === 0} data-action="tl-up" onClick={() => update(d => (moveList(d.tasks, l.id, -1) ? undefined : false))}><ArrowUp size={18} aria-hidden="true" /></Button>
                  <Button inline className="!px-3" aria-label={`Move ${l.name} down`} disabled={i === lists.length - 1} data-action="tl-down" onClick={() => update(d => (moveList(d.tasks, l.id, 1) ? undefined : false))}><ArrowDown size={18} aria-hidden="true" /></Button>
                  <Button inline className="!px-3" aria-label={`Remove ${l.name}`} data-action="tl-remove" onClick={() => remove(l.id, l.name)}><X size={18} aria-hidden="true" /></Button>
                </span>
                <span className="col-span-2 text-sm text-fg-3 -mt-1">{count(l.id)} task{count(l.id) === 1 ? '' : 's'} · <a href={`#today/tasks/list/${l.id}`} className="text-primary font-semibold">Open</a></span>
              </li>
            ))}
          </ul>
        )}
        <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-3" onSubmit={e => { e.preventDefault(); add(); }}>
          <Field label="New list" htmlFor="tlNew"><TextInput id="tlNew" value={name} maxLength={TASK_LIMITS.listName} onChange={e => setName(e.target.value)} placeholder="e.g. Moving house" /></Field>
          <Button inline type="submit" data-action="tl-add" disabled={!name.trim()}>Add</Button>
        </form>
      </Card>
    </>
  );
}
