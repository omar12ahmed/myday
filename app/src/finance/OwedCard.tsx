import { useRef, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, Field, TextInput } from '../components/Field';
import { Choice, Choices, Chip, LinkButton, Note } from '../components/parts';
import { shortDate } from '../data/dates';
import { debtTotals, money } from '../data/finance';
import type { Debt, FinanceData } from '../data/types';
import { addDebt, setDebtAmount, settleDebt } from './actions';

// Money you owe someone, and money someone owes you. Change an amount after a part-payment; "Settled" when it's done.
export function OwedCard({ f }: { f: FinanceData }) {
  const confirm = useConfirm();
  const [direction, setDirection] = useState<Debt['direction']>('owe');
  const [error, setError] = useState('');
  const who = useRef<HTMLInputElement>(null), amount = useRef<HTMLInputElement>(null), note = useRef<HTMLInputElement>(null);
  const t = debtTotals(f);

  function add(e: FormEvent) {
    e.preventDefault();
    const w = who.current!, a = amount.current!, n = note.current!;
    if (!w.value.trim() && !a.value.trim()) return; // an empty form (e.g. a second tap) does nothing
    const problem = addDebt(direction, w.value, a.value, n.value);
    setError(problem || '');
    if (problem) return;
    w.value = ''; a.value = ''; n.value = ''; // cleared straight away, so a quick second tap can't add it twice
  }
  async function settle(d: Debt) {
    const yes = await confirm({
      title: d.direction === 'owe' ? `Paid back ${money(d.amount)} to ${d.person}?` : `${d.person} paid back ${money(d.amount)}?`,
      body: 'It will be taken off the list.', confirmLabel: 'Yes, settled', cancelLabel: 'Not yet',
    });
    if (yes) settleDebt(d.id);
  }
  const list = (dir: Debt['direction']) => {
    const items = f.debts.filter(d => d.direction === dir);
    return items.length ? items.map(d => (
      <div key={d.id} className="debt-row grid grid-cols-[minmax(0,1fr)_6.5rem] gap-x-2.5 items-center py-2.5 border-t border-outline first:border-t-0" data-id={d.id}>
        <p className="font-semibold m-0 break-words">{d.person}</p>
        <CommitInput className="amount text-right tabular-nums" type="text" inputMode="decimal" aria-label={`Amount, ${d.person}`}
          defaultValue={d.amount.toFixed(2)} key={'a' + d.amount} onCommit={el => setDebtAmount(d.id, el, d.amount)} />
        <p className="text-sm text-fg-2 m-0 break-words">{[d.note, `since ${shortDate(d.since)}`].filter(Boolean).join(' · ')}</p>
        <LinkButton className="justify-self-end" data-action="debt-settle" data-id={d.id} onClick={() => settle(d)}>Settled</LinkButton>
      </div>
    )) : <Note className="m-0 py-1">{dir === 'owe' ? "You don't owe anyone." : 'Nobody owes you anything.'}</Note>;
  };

  return (
    <Card aria-labelledby="owed-h" id="owedCard">
      <h2 id="owed-h">Money owed</h2>
      <div className="flex flex-wrap gap-1.5 mb-1"><Chip><span data-total="owe">You owe {money(t.owe)}</span></Chip><Chip><span data-total="owed">You're owed {money(t.owed)}</span></Chip></div>
      <h3 className="mt-3">I owe</h3>
      <div data-list="owe">{list('owe')}</div>
      <h3 className="mt-4">Owed to me</h3>
      <div data-list="owed">{list('owed')}</div>
      <form className="grid gap-3 mt-4 pt-3 border-t border-outline" onSubmit={add} id="debtForm" noValidate>
        <Choices label="Who owes who">
          <Choice on={direction === 'owe'} data-action="debt-owe" onClick={() => setDirection('owe')}>I owe</Choice>
          <Choice on={direction === 'owed'} data-action="debt-owed" onClick={() => setDirection('owed')}>Owed to me</Choice>
        </Choices>
        <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-2.5">
          <Field label={direction === 'owe' ? 'Who to' : 'Who from'} htmlFor="debtWho"><TextInput ref={who} id="debtWho" maxLength={60} autoComplete="off" /></Field>
          <Field label="Amount (£)" htmlFor="debtAmount"><TextInput ref={amount} id="debtAmount" inputMode="decimal" placeholder="0.00" autoComplete="off" /></Field>
        </div>
        <Field label="Note (optional)" htmlFor="debtNote"><TextInput ref={note} id="debtNote" maxLength={200} autoComplete="off" placeholder="e.g. concert tickets" /></Field>
        {error && <p role="alert" id="debtError" className="text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2 m-0">{error}</p>}
        <Button type="submit" data-action="debt-add">Add</Button>
      </form>
    </Card>
  );
}
