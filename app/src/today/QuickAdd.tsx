import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CAT_LABEL } from '../data/plan';
import { update } from '../data/storage';
import { addTask, addToTodaysPlan } from '../data/tasks';
import { toast } from '../data/toast';
import type { Category, DateKey } from '../data/types';

// "Add a task for today", under today's plan. It's saved as a task due today (Inbox → Tasks) and, if today's plan
// has room for your energy, added to the plan straight away — the same rules as "Due today", nothing more.
export function QuickAdd({ k }: { k: DateKey }) {
  const [text, setText] = useState('');
  const [cat, setCat] = useState<Category>('admin');
  function add() {
    const title = text.trim();
    if (!title) return;
    let result = null as 'added' | 'full' | 'no-plan' | 'missing' | null;
    update(d => {
      const id = addTask(d.tasks, { title, category: cat, due: k });
      if (!id) return false;
      result = addToTodaysPlan(d, id, k);
    });
    if (!result) return;
    setText('');
    toast(result === 'added' ? "Added to today's plan." : result === 'full' ? "Added — it's under Due today (today's plan is full for your energy)." : "Added — it's under Due today. Build your day to add it to the plan.");
  }
  return (
    <Card aria-label="Add a task for today" id="quickAdd" className="!py-3">
      <form className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2 items-center" onSubmit={e => { e.preventDefault(); add(); }}>
        <input id="quickText" className="min-h-11 min-w-0 rounded-tile border border-outline bg-surface-2 px-3 text-fg text-base" placeholder="Add a task…" aria-label="Add a task for today"
          value={text} maxLength={120} onChange={e => setText(e.target.value)} />
        <select id="quickCat" className="min-h-11 rounded-tile border border-outline bg-surface-2 px-2 text-fg text-[15px]" aria-label="Kind of task" value={cat} onChange={e => setCat(e.target.value as Category)}>
          {(['learning', 'admin', 'health'] as Category[]).map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
        </select>
        <Button inline type="submit" variant="primary" className="!px-3" aria-label="Add" data-action="quick-add" disabled={!text.trim()}><Plus size={20} aria-hidden="true" /></Button>
      </form>
    </Card>
  );
}
