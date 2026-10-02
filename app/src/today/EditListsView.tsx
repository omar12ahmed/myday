import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CommitInput } from '../components/Field';
import { prettyDate } from '../data/dates';
import { cleanMinutes, clone, CATS, SEED, uid } from '../data/normalize';
import { CAT_LABEL, sessionCounts } from '../data/plan';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { Category, ListItem, MyDayData } from '../data/types';
import { useConfirm } from '../components/confirm';

// "Your task lists": rename, retime, reorder, add and remove the tasks MyDay picks from, and
// manage the queue. Changes save as you finish each field, as in the current MyDay.
export function EditListsView({ data, onBack }: { data: MyDayData; onBack: () => void }) {
  const confirm = useConfirm();
  const counts = sessionCounts(data);
  const focusNew = useRef<string | null>(null);

  // After "+ Add", put the cursor in the new task's name.
  useEffect(() => {
    if (!focusNew.current) return;
    const el = document.querySelector<HTMLInputElement>(`.edit-row[data-id="${focusNew.current}"] input.t`);
    focusNew.current = null;
    el?.focus();
    el?.select();
  });

  const editItem = (cat: Category, id: string, fn: (item: ListItem) => void) =>
    update(d => { const item = d.lists[cat].find(t => t.id === id); if (!item) return false; fn(item); });

  async function remove(cat: Category, item: ListItem) {
    if (!(await confirm({ title: `Remove “${item.title}”?`, body: 'Past days keep their history.', confirmLabel: 'Remove' }))) return;
    update(d => { d.lists[cat] = d.lists[cat].filter(t => t.id !== item.id); });
  }
  function move(cat: Category, i: number, dir: -1 | 1) {
    update(d => {
      const list = d.lists[cat], j = i + dir;
      if (j < 0 || j >= list.length) return false;
      [list[i], list[j]] = [list[j], list[i]];
    });
  }
  function add(cat: Category) {
    const id = cat[0] + uid();
    update(d => { d.lists[cat].push({ id, title: 'New task', minutes: 20 }); });
    focusNew.current = id;
  }

  return (
    <>
      <Card>
        <h2>Your task lists</h2>
        <p className="text-[15px] text-fg-2">Changes save automatically and apply from the next day you build.</p>
        <Button variant="primary" data-action="back" onClick={onBack}>Done</Button>
      </Card>
      {CATS.map(cat => (
        <Card key={cat} aria-labelledby={`list-${cat}`}>
          <h3 id={`list-${cat}`}>{CAT_LABEL[cat]}{cat === 'learning' ? ' — roadmap order, repeats after the last' : ''}</h3>
          {data.lists[cat].map((t, i) => (
            <div key={t.id} className="edit-row grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-2 gap-y-1.5 items-center py-3 border-t border-outline first:border-t-0" data-cat={cat} data-id={t.id}>
              <CommitInput className="t col-span-4" type="text" data-field="title" defaultValue={t.title} key={`t${t.title}`} aria-label="Task name"
                onCommit={el => { const v = el.value.trim(); if (!v) { el.value = t.title; return; } editItem(cat, t.id, item => { item.title = v; }); toast('Saved.'); }} />
              <div className="count text-sm text-fg-3">{cat === 'learning' ? 'Sessions completed' : 'Times done'}: {counts[t.id] || 0}</div>
              <span className="flex items-center gap-1.5 col-span-3 justify-self-end">
                <CommitInput className="m !w-20" data-field="minutes" type="number" inputMode="numeric" min={1} max={600} defaultValue={t.minutes} key={`m${t.minutes}`} aria-label="Minutes"
                  onCommit={el => { const m = cleanMinutes(el.value, null); if (!m) { el.value = String(t.minutes); return; } editItem(cat, t.id, item => { item.minutes = m; }); toast('Saved.'); }} />
                <span className="text-sm text-fg-3">min</span>
              </span>
              <div className="col-span-4 flex gap-2 justify-end">
                <Button inline className="!px-3" data-action="up" aria-label="Move up" disabled={i === 0} onClick={() => move(cat, i, -1)}><ArrowUp size={18} aria-hidden="true" /></Button>
                <Button inline className="!px-3" data-action="down" aria-label="Move down" disabled={i === data.lists[cat].length - 1} onClick={() => move(cat, i, 1)}><ArrowDown size={18} aria-hidden="true" /></Button>
                <Button inline className="!px-3" data-action="del" aria-label={`Remove ${t.title}`} onClick={() => remove(cat, t)}><X size={18} aria-hidden="true" /></Button>
              </div>
            </div>
          ))}
          <Button inline className="mt-2.5" data-action="add" data-cat={cat} onClick={() => add(cat)}>+ Add a {CAT_LABEL[cat].toLowerCase()} task</Button>
        </Card>
      ))}
      <Card aria-labelledby="queue-h">
        <h3 id="queue-h">Queue</h3>
        {data.queue.length ? data.queue.map(q => (
          <div key={q.qid} className="q-row flex items-center justify-between gap-2.5 py-2 border-t border-outline first:border-t-0">
            <span>{q.title} <span className="text-fg-2 text-[15px]">· from {prettyDate(q.queuedOn)}</span></span>
            <Button inline data-action="unqueue" data-qid={q.qid} onClick={() => update(d => { d.queue = d.queue.filter(x => x.qid !== q.qid); })}>Remove</Button>
          </div>
        )) : <p className="text-[15px] text-fg-2 m-0">Nothing waiting.</p>}
      </Card>
      <Button variant="ghost" data-action="reset-lists" onClick={async () => {
        if (!(await confirm({ title: 'Reset all three lists to the starter tasks?', body: 'Your history and queue stay as they are.', confirmLabel: 'Reset the lists' }))) return;
        update(d => { d.lists = clone(SEED); });
        toast('Lists reset.');
      }}>Reset to the starter lists</Button>
    </>
  );
}
