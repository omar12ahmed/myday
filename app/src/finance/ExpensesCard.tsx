import { X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, Field, TextInput } from '../components/Field';
import { Note } from '../components/parts';
import { expensesTotal, money } from '../data/finance';
import type { Expense, FinanceData } from '../data/types';
import { addExpense, removeExpense, renameExpense, setExpenseAmount } from './actions';

// What you pay every month. Names and amounts save when you finish each field.
export function ExpensesCard({ f }: { f: FinanceData }) {
  const confirm = useConfirm();
  const [error, setError] = useState('');
  const name = useRef<HTMLInputElement>(null), amount = useRef<HTMLInputElement>(null);

  function add(e: FormEvent) {
    e.preventDefault();
    const n = name.current!, a = amount.current!;
    if (!n.value.trim() && !a.value.trim()) return;
    const problem = addExpense(n.value, a.value);
    setError(problem || '');
    if (problem) return;
    n.value = ''; a.value = '';
    n.focus();
  }
  async function remove(x: Expense) {
    if (await confirm({ title: `Remove “${x.name}”?`, body: `${money(x.amount)} a month.`, confirmLabel: 'Remove', cancelLabel: 'Keep it' })) removeExpense(x.id);
  }

  return (
    <Card aria-labelledby="exp-h" id="expensesCard">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="exp-h">Monthly expenses</h2>
        <span className="font-bold tabular-nums whitespace-nowrap" data-total="expenses">{money(expensesTotal(f))} a month</span>
      </div>
      {f.expenses.length ? f.expenses.map(x => (
        <div key={x.id} className="exp-row grid grid-cols-[minmax(0,1fr)_6.5rem_auto] gap-2 items-center py-2 border-t border-outline first:border-t-0" data-id={x.id}>
          <CommitInput className="name" type="text" maxLength={80} aria-label="Expense" defaultValue={x.name} key={'n' + x.name} onCommit={el => renameExpense(x.id, el, x.name)} />
          <CommitInput className="amount text-right tabular-nums" type="text" inputMode="decimal" aria-label={`Amount a month, ${x.name}`} defaultValue={x.amount.toFixed(2)} key={'a' + x.amount}
            onCommit={el => setExpenseAmount(x.id, el, x.amount)} />
          <Button inline variant="ghost" className="!px-3" data-action="exp-remove" data-id={x.id} aria-label={`Remove ${x.name}`} onClick={() => remove(x)}><X size={18} aria-hidden="true" /></Button>
        </div>
      )) : <Note className="m-0">Nothing added yet — e.g. rent, phone, travel, subscriptions.</Note>}
      <form className="grid gap-3 mt-4 pt-3 border-t border-outline" onSubmit={add} id="expForm" noValidate>
        <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2.5">
          <Field label="Expense" htmlFor="expName"><TextInput ref={name} id="expName" maxLength={80} autoComplete="off" placeholder="e.g. Rent" /></Field>
          <Field label="£ a month" htmlFor="expAmount"><TextInput ref={amount} id="expAmount" inputMode="decimal" placeholder="0.00" autoComplete="off" /></Field>
        </div>
        {error && <p role="alert" id="expError" className="text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2 m-0">{error}</p>}
        <Button type="submit" data-action="exp-add">Add</Button>
      </form>
    </Card>
  );
}
