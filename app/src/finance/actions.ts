// What each Finance button and field saves (through the store, like every other section).
import { todayKey } from '../data/dates';
import { parseAmount } from '../data/finance';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { Debt } from '../data/types';
import { uid } from '../data/util';

const AMOUNT_HELP = 'Enter an amount in pounds, e.g. 12.50.';

// Returns a message to show beside the form if something is missing, or null when it's been added.
export function addDebt(direction: Debt['direction'], person: string, amountText: string, note: string): string | null {
  const who = person.trim().slice(0, 60), amount = parseAmount(amountText);
  if (!who) return direction === 'owe' ? 'Who do you owe?' : 'Who owes you?';
  if (amount === null) return AMOUNT_HELP;
  update(d => { d.finance.debts.push({ id: 'd' + uid(), direction, person: who, amount, note: note.trim().slice(0, 200), since: todayKey() }); });
  return null;
}
export function setDebtAmount(id: string, el: HTMLInputElement, current: number) {
  const amount = parseAmount(el.value);
  if (amount === null) { el.value = current.toFixed(2); toast(AMOUNT_HELP + ' (When it\'s all paid, use "Settled".)'); return; }
  update(d => { const x = d.finance.debts.find(t => t.id === id); if (!x || x.amount === amount) return false; x.amount = amount; });
}
export const settleDebt = (id: string) => update(d => { const n = d.finance.debts.length; d.finance.debts = d.finance.debts.filter(t => t.id !== id); if (d.finance.debts.length === n) return false; });

export function addExpense(name: string, amountText: string): string | null {
  const what = name.trim().slice(0, 80), amount = parseAmount(amountText);
  if (!what) return 'What is the expense? (e.g. Rent)';
  if (amount === null) return AMOUNT_HELP;
  update(d => { d.finance.expenses.push({ id: 'e' + uid(), name: what, amount }); });
  return null;
}
export function renameExpense(id: string, el: HTMLInputElement, current: string) {
  const name = el.value.trim().slice(0, 80);
  if (!name) { el.value = current; return; }
  update(d => { const x = d.finance.expenses.find(t => t.id === id); if (!x || x.name === name) return false; x.name = name; });
}
export function setExpenseAmount(id: string, el: HTMLInputElement, current: number) {
  const amount = parseAmount(el.value);
  if (amount === null) { el.value = current.toFixed(2); toast(AMOUNT_HELP); return; }
  update(d => { const x = d.finance.expenses.find(t => t.id === id); if (!x || x.amount === amount) return false; x.amount = amount; });
}
export const removeExpense = (id: string) => update(d => { const n = d.finance.expenses.length; d.finance.expenses = d.finance.expenses.filter(t => t.id !== id); if (d.finance.expenses.length === n) return false; });
