import { Coins, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, Field, Select, TextInput } from '../components/Field';
import { Choice, Choices, LinkButton, Note } from '../components/parts';
import { changeMoney } from '../data/businessModel';
import {
  addLine, amountText, BASES, BASIS_LABEL, breakEven, breakEvenText, CURRENCIES, editLine, emptyMoney, fillForecast, forecast, monthText, MONEY_LIMITS, payback, realBesidePlan,
  removeLine, removeReal, saleWord, setFields, setForecastFrom, setForecastSales, setReal, sums, withCurrency, type MoneyChange, type MoneyList, type NewLine,
} from '../data/businessMoney';
import { todayKey } from '../data/dates';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { BusinessMoney, MoneyLine, Project } from '../data/types';

// A business idea's Money tab (specs/projects-business-tools.md): its numbers, each saying where it's from; the
// break-even and a 12-month forecast worked out from them as you type; and the real months beside the plan. The rules
// are in data/businessMoney.ts. Plans and plain numbers — never advice about whether it will work, and never part of
// your personal Finance. Never sent to AI.

const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
const numberOf = (v: string): number | null => { const t = v.trim().replace(/,/g, ''); if (!t) return null; const n = Number(t); return Number.isFinite(n) && n >= 0 ? n : null; };
const shown = (n: number | null) => (n === null ? '' : String(n));

export function MoneyView({ p }: { p: Project }) {
  const m = p.model?.money ?? emptyMoney();
  const change = (c: MoneyChange) => update(d => (changeMoney(d, p.id, c) ? undefined : false));
  return (
    <div data-s="money">
      <Card aria-labelledby="pjMoneyH" id="projectMoney">
        <h2 id="pjMoneyH" className="flex items-center gap-2"><Coins size={22} aria-hidden="true" className="text-primary" /> Money</h2>
        <Note className="mt-0">Your numbers in one place, each saying where it’s from. MyDay works out the rest as you type. A plan, not a prediction — and never part of your personal Finance.{m.currency ? ` Amounts in ${m.currency}.` : ''}</Note>
        <div className="grid gap-3 sm:grid-cols-3 mt-4" data-s="money-basics">
          <Field label="Currency" htmlFor="moneyCurrency">
            <CommitInput id="moneyCurrency" key={`c${m.currency}`} defaultValue={m.currency} list="moneyCurrencies" maxLength={MONEY_LIMITS.currency} placeholder="e.g. USD" autoCapitalize="characters"
              onCommit={el => change(setFields({ currency: el.value.toUpperCase() }))} />
            <datalist id="moneyCurrencies">{CURRENCIES.map(c => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="One sale is called" htmlFor="moneySale">
            <CommitInput id="moneySale" key={`s${m.sale}`} defaultValue={m.sale} maxLength={MONEY_LIMITS.sale} placeholder="e.g. order" onCommit={el => change(setFields({ sale: el.value }))} />
          </Field>
          <Field label={`Average value of one ${saleWord(m)}`} htmlFor="moneySaleValue">
            <CommitInput id="moneySaleValue" key={`v${m.saleValue}`} type="number" inputMode="decimal" min={0} step="any" defaultValue={shown(m.saleValue)} placeholder="e.g. 30"
              onCommit={el => change(setFields({ saleValue: numberOf(el.value) }))} />
          </Field>
        </div>
        <LinesSection m={m} list="perSale" change={change} title={`Each ${saleWord(m)}`}
          hint={`What one ${saleWord(m)} brings in and costs: an amount, or a share of its average value (a commission, card fees).`}
          total={s => `Each ${saleWord(m)} brings in ${withCurrency(m, s.perSaleIn, true)} and costs ${withCurrency(m, s.perSaleOut, true)} — ${s.leaves < 0 ? `loses ${withCurrency(m, -s.leaves, true)}` : `leaves ${withCurrency(m, s.leaves, true)}`}.`} />
        <LinesSection m={m} list="monthly" change={change} title="Each month" hint="What runs every month whatever you sell: rent, wages, the website (and any money in each month)."
          total={s => `Each month: ${withCurrency(m, s.monthlyOut)} out${s.monthlyIn ? `, ${withCurrency(m, s.monthlyIn)} in` : ''}.`} />
        <LinesSection m={m} list="startup" change={change} title="To start" hint="One-off costs before you begin: equipment, a deposit, the first stock (and any one-off money in)."
          total={s => `To start: ${withCurrency(m, s.startupNet)}.`} />
      </Card>
      <BreakEvenCard m={m} change={change} />
      <ForecastCard m={m} change={change} />
      <RealCard m={m} change={change} />
    </div>
  );
}

type Change = (c: MoneyChange) => boolean;
// A month's money in whole numbers (cents in a forecast are noise).
const whole = (n: number) => amountText(Math.round(n));
// The forecast's columns: month and sales on a phone (the sums on a line below), all five from a wider screen.
const GRID = 'grid grid-cols-[minmax(0,1fr)_7rem] sm:grid-cols-[8rem_7rem_1fr_1fr_1fr] gap-x-3';
type Sums = ReturnType<typeof sums>;

// One list of lines (each sale, each month, to start) with its total and a form to add one.
function LinesSection({ m, list, title, hint, total, change }: { m: BusinessMoney; list: MoneyList; title: string; hint: string; total: (s: Sums) => string; change: Change }) {
  const [adding, setAdding] = useState(false);
  const lines = m[list], full = lines.length >= MONEY_LIMITS[list];
  return (
    <section className="mt-6" aria-labelledby={`money-${list}-h`} data-s="money-lines" data-list={list}>
      <h3 id={`money-${list}-h`} className="font-semibold text-[17px] leading-snug m-0">{title}</h3>
      <p className="text-sm text-fg-2 m-0 mt-1">{hint}</p>
      {lines.length > 0 && <ul className="list-none p-0 m-0 mt-2" aria-label={title}>{lines.map(l => <LineRow key={l.id} m={m} list={list} l={l} change={change} />)}</ul>}
      {lines.length > 0 && <p className="m-0 mt-2 text-[15px] font-semibold" data-s="money-total">{total(sums(m))}</p>}
      {full ? <Note className="mb-0 mt-2">{MONEY_LIMITS[list]} lines is the most here.</Note>
        : adding ? <LineForm m={m} list={list} change={change} onDone={() => { setAdding(false); focusSoon(`money-${list}-add`); }} />
        : <Button inline variant="ghost" className="mt-2" id={`money-${list}-add`} data-action="money-line-add" data-list={list} onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" /> Add a line</Button>}
    </section>
  );
}
// One line: a single tap target that opens it to change (or remove).
function LineRow({ m, list, l, change }: { m: BusinessMoney; list: MoneyList; l: MoneyLine; change: Change }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  async function remove() {
    if (!(await confirm({ title: 'Remove this line?', body: `“${l.label}”`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (change(removeLine(list, l.id))) { toast('Removed.'); focusSoon(`money-${list}-add`); }
  }
  if (editing) return <li className="border-t border-outline first:border-t-0 py-2"><LineForm m={m} list={list} l={l} change={change} onDone={() => { setEditing(false); focusSoon(`ml-${l.id}`); }} onRemove={remove} /></li>;
  const amount = l.per === 'percent' ? `${amountText(l.amount)}%` : amountText(l.amount, list === 'perSale');
  return (
    <li className="border-t border-outline first:border-t-0" data-s="money-line" data-id={l.id} data-dir={l.dir}>
      <button type="button" id={`ml-${l.id}`} className="w-full min-h-11 py-2 flex items-start gap-3 text-left bg-transparent border-0 p-0 cursor-pointer rounded-tile hover:bg-surface-2 text-fg" data-action="money-line-edit"
        aria-label={`${l.label}: ${l.dir === 'in' ? 'money in' : 'money out'} ${amount}, ${BASIS_LABEL[l.basis] ?? l.basis}. Change`} onClick={() => setEditing(true)}>
        <span className="flex-1 min-w-0">
          <span className="block font-medium break-words">{l.label}</span>
          <span className="block text-sm text-fg-2 break-words">{BASIS_LABEL[l.basis] ?? l.basis}{l.note ? ` · ${l.note}` : ''}</span>
        </span>
        <span className={`tabular-nums font-semibold whitespace-nowrap ${l.dir === 'out' ? 'text-fg-2' : ''}`} data-s="money-amount">{l.dir === 'out' ? '−' : '+'}{amount}</span>
        <Pencil size={16} aria-hidden="true" className="mt-1 flex-none text-fg-3" />
      </button>
    </li>
  );
}
function LineForm({ m, list, l, change, onDone, onRemove }: { m: BusinessMoney; list: MoneyList; l?: MoneyLine; change: Change; onDone: () => void; onRemove?: () => void }) {
  const [label, setLabel] = useState(l?.label ?? ''), [dir, setDir] = useState<'in' | 'out'>(l?.dir ?? (list === 'perSale' ? 'in' : 'out'));
  const [amount, setAmount] = useState(l ? String(l.amount) : ''), [per, setPer] = useState<'fixed' | 'percent'>(l?.per ?? 'fixed');
  const [basis, setBasis] = useState(l?.basis ?? 'guess'), [note, setNote] = useState(l?.note ?? '');
  const idp = l ? `mlE-${l.id}` : `mlN-${list}`, n = numberOf(amount);
  function save() {
    const line: NewLine = { label, dir, amount: n ?? 0, per, basis, note };
    if (l) { change(editLine(list, l.id, line)); onDone(); return; }
    if (change(addLine(list, line))) { toast('Added.'); onDone(); }
  }
  return (
    <form className="grid gap-3 mt-2 rounded-tile bg-surface-2 border border-outline p-3" data-s="money-line-form" onSubmit={ev => { ev.preventDefault(); save(); }}>
      <Field label="What it is" htmlFor={`${idp}-label`}><TextInput id={`${idp}-label`} value={label} maxLength={MONEY_LIMITS.label} autoFocus placeholder={list === 'perSale' ? 'e.g. Delivery fee' : list === 'monthly' ? 'e.g. Rent' : 'e.g. Motorbike'} onChange={ev => setLabel(ev.target.value)} /></Field>
      <Choices label="Money in or out">
        <Choice on={dir === 'in'} data-action="money-dir" data-id="in" onClick={() => setDir('in')}>Money in</Choice>
        <Choice on={dir === 'out'} data-action="money-dir" data-id="out" onClick={() => setDir('out')}>Money out</Choice>
      </Choices>
      <div className="grid gap-3 grid-cols-2">
        <Field label={per === 'percent' ? 'Share (%)' : 'Amount'} htmlFor={`${idp}-amount`} className="min-w-0">
          <TextInput id={`${idp}-amount`} type="number" inputMode="decimal" min={0} max={per === 'percent' ? 100 : undefined} step="any" className="min-w-0" value={amount} onChange={ev => setAmount(ev.target.value)} />
        </Field>
        {list === 'perSale' ? (
          <Field label="As" htmlFor={`${idp}-per`} className="min-w-0">
            <Select id={`${idp}-per`} className="min-w-0" value={per} onChange={ev => setPer(ev.target.value as 'fixed' | 'percent')}>
              <option value="fixed">an amount</option><option value="percent">% of its average value</option>
            </Select>
          </Field>
        ) : (
          <Field label="Where it’s from" htmlFor={`${idp}-basis`} className="min-w-0">
            <Select id={`${idp}-basis`} className="min-w-0" value={basis} onChange={ev => setBasis(ev.target.value)}>{BASES.map(b => <option key={b} value={b}>{BASIS_LABEL[b]}</option>)}</Select>
          </Field>
        )}
      </div>
      {list === 'perSale' && (
        <Field label="Where it’s from" htmlFor={`${idp}-basis`}>
          <Select id={`${idp}-basis`} className="!w-auto" value={basis} onChange={ev => setBasis(ev.target.value)}>{BASES.map(b => <option key={b} value={b}>{BASIS_LABEL[b]}</option>)}</Select>
        </Field>
      )}
      {per === 'percent' && m.saleValue === null && <p className="m-0 text-sm text-fg-2">Add the average value of one {saleWord(m)} above to count this.</p>}
      <Field label="Note (optional)" htmlFor={`${idp}-note`}><TextInput id={`${idp}-note`} value={note} maxLength={MONEY_LIMITS.note} placeholder="e.g. the quote from Hodan’s garage" onChange={ev => setNote(ev.target.value)} /></Field>
      <div className="flex flex-wrap gap-2">
        <Button inline type="submit" variant="primary" data-action="money-line-save" disabled={!label.trim() || n === null}>{l ? 'Save' : 'Add'}</Button>
        <Button inline variant="ghost" onClick={onDone}>Cancel</Button>
        {onRemove && <Button inline variant="ghost" className="ml-auto" data-action="money-line-remove" onClick={onRemove}><Trash2 size={18} aria-hidden="true" /> Remove</Button>}
      </div>
    </form>
  );
}

// The break-even and how long to win back the start-up costs, in words.
function BreakEvenCard({ m, change }: { m: BusinessMoney; change: Change }) {
  const s = sums(m), b = breakEven(m), at = m.atSales ?? (b.kind === 'sales' ? b.n : null), pb = at === null ? null : payback(m, at);
  return (
    <Card aria-labelledby="pjBreakEvenH" id="projectBreakEven" data-s="money-break-even">
      <h3 id="pjBreakEvenH">Break-even</h3>
      <p className="m-0 text-[22px] font-bold leading-snug" data-s="break-even">{b.kind === 'sales' ? `${b.n.toLocaleString()} ${saleWord(m, b.n)} a month` : breakEvenText(m)}</p>
      {b.kind !== 'empty' && <p className="m-0 mt-1 text-[15px] text-fg-2">Each {saleWord(m)} {s.leaves < 0 ? `loses ${withCurrency(m, -s.leaves, true)}` : `leaves ${withCurrency(m, s.leaves, true)}`}; running costs are {withCurrency(m, s.monthlyNet)} a month.</p>}
      {s.needsSaleValue && <p className="m-0 mt-2 text-[15px]" data-s="money-needs-value">Add the average value of one {saleWord(m)} to count the percentages.</p>}
      {s.startupNet > 0 && b.kind !== 'empty' && (
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2 mt-4">
          <Field label={`${saleWord(m, 2)[0].toUpperCase()}${saleWord(m, 2).slice(1)} a month`} htmlFor="moneyAtSales">
            <CommitInput id="moneyAtSales" key={`a${m.atSales}`} type="number" inputMode="numeric" min={0} step={1} className="!w-32" defaultValue={shown(at)} onCommit={el => change(setFields({ atSales: numberOf(el.value) }))} />
          </Field>
          <p className="m-0 text-[15px] pb-3" data-s="payback">{!pb ? '' : pb.kind === 'months' ? `Start-up costs (${withCurrency(m, s.startupNet)}) back in about ${pb.n} ${pb.n === 1 ? 'month' : 'months'}.` : pb.kind === 'never' ? 'At that level the running costs aren’t covered, so the start-up costs don’t come back.' : ''}</p>
        </div>
      )}
      <Note className="mb-0 mt-3">Worked out from your numbers — as good as they are. Where each comes from is beside it.</Note>
    </Card>
  );
}

// The 12 months: sales you expect each month, and each month's money with the running total.
function ForecastCard({ m, change }: { m: BusinessMoney; change: Change }) {
  const f = forecast(m), [start, setStart] = useState(''), [step, setStep] = useState(''), [mode, setMode] = useState<'percent' | 'add'>('percent');
  const sales = saleWord(m, 2), real = new Map(m.actual.map(a => [a.month, a]));
  function fill() {
    const a = numberOf(start), b = Number(step.trim() || '0');
    if (a === null || !Number.isFinite(b)) return;
    if (change(fillForecast(a, b, mode))) toast('Filled — change any month by hand.');
  }
  return (
    <Card aria-labelledby="pjForecastH" id="projectForecast" data-s="money-forecast">
      <h3 id="pjForecastH">12-month forecast</h3>
      <Field label="First month" htmlFor="moneyFrom" className="max-w-[15rem]">
        <CommitInput id="moneyFrom" key={`f${m.forecast.from}`} type="month" defaultValue={m.forecast.from ?? ''} onCommit={el => change(setForecastFrom(el.value || null))} />
      </Field>
      {!f ? <Note className="mb-0 mt-3">Choose the first month to see each month’s money and the running total.</Note> : <>
        <form className="flex flex-wrap items-end gap-2 mt-4" data-s="money-fill" onSubmit={ev => { ev.preventDefault(); fill(); }}>
          <Field label={`Fill: start at (${sales})`} htmlFor="moneyFillStart"><TextInput id="moneyFillStart" type="number" inputMode="numeric" min={0} className="!w-28" value={start} onChange={ev => setStart(ev.target.value)} /></Field>
          <Field label="and add each month" htmlFor="moneyFillStep"><TextInput id="moneyFillStep" type="number" inputMode="decimal" className="!w-24" value={step} onChange={ev => setStep(ev.target.value)} /></Field>
          <Select aria-label="Add as" className="!w-auto" value={mode} onChange={ev => setMode(ev.target.value as 'percent' | 'add')}><option value="percent">%</option><option value="add">{sales}</option></Select>
          <Button inline type="submit" data-action="money-fill" disabled={numberOf(start) === null}>Fill</Button>
        </form>
        <p className="m-0 mt-4 text-[15px] tabular-nums" data-s="forecast-opening">Start: {withCurrency(m, Math.round(f.opening))}{f.opening < 0 ? ' (start-up costs)' : ''}</p>
        {/* A phone shows each month on two lines; a wider screen as a table, the column names once. */}
        <div className={`${GRID} hidden sm:grid text-sm text-fg-2 mt-2 pb-1`} aria-hidden="true">
          <span>Month</span><span>{sales[0].toUpperCase() + sales.slice(1)}</span><span className="text-right">Money in</span><span className="text-right">Money out</span><span className="text-right">Running total</span>
        </div>
        <ol className="list-none p-0 m-0" aria-label="Each month">
          {f.rows.map((r, i) => {
            const got = real.get(r.month);
            return (
              <li key={r.month} className={`${GRID} border-t border-outline py-2 items-center tabular-nums`} data-s="forecast-month" data-month={r.month}>
                <span className="font-medium">{monthText(r.month)}</span>
                <CommitInput aria-label={`${sales} in ${monthText(r.month)}`} key={`${r.month}-${r.sales}`} type="number" inputMode="numeric" min={0} step={1} defaultValue={shown(r.sales)} placeholder="0"
                  data-s="forecast-sales" onCommit={el => change(setForecastSales(i, numberOf(el.value)))} />
                <span className="col-span-2 sm:contents text-sm text-fg-2" data-s="forecast-sums">
                  <span className="sm:text-right sm:text-[15px] sm:text-fg"><span className="sm:sr-only">In </span>{whole(r.in)}</span><span className="sm:hidden"> · </span>
                  <span className="sm:text-right sm:text-[15px] sm:text-fg"><span className="sm:sr-only">Out </span>{whole(r.out)}</span><span className="sm:hidden"> · </span>
                  <span className={`sm:text-right sm:text-[15px] ${r.total < 0 ? 'sm:text-fg' : 'text-fg font-semibold'}`}><span className="sm:sr-only">Running total </span>{r.total < 0 ? '−' : ''}{whole(Math.abs(r.total))}</span>
                </span>
                {got && <span className="col-span-2 sm:col-span-5 text-sm" data-s="forecast-real">Real: {[got.sales !== null && `${got.sales} ${saleWord(m, got.sales)}`, got.in !== null && `in ${amountText(got.in)}`, got.out !== null && `out ${amountText(got.out)}`].filter(Boolean).join(' · ') || 'nothing entered yet'}</span>}
              </li>
            );
          })}
        </ol>
        <ul className="list-none p-0 m-0 mt-3 grid gap-1 text-[15px]" data-s="forecast-summary">
          <li>Lowest point: <span className="font-semibold tabular-nums">{withCurrency(m, Math.round(f.lowest.value))}</span>{f.lowest.month ? ` in ${monthText(f.lowest.month)}` : ' at the start'}</li>
          <li>{f.blackFrom ? `In the black from ${monthText(f.blackFrom)}` : 'Not in the black within these 12 months'}</li>
          {f.opening < 0 && <li>{f.backBy ? `Start-up costs back by ${monthText(f.backBy)}` : 'Start-up costs not back within these 12 months'}</li>}
        </ul>
      </>}
    </Card>
  );
}

// What really happened each month: totals you enter, beside that month's plan, never mixed into it.
function RealCard({ m, change }: { m: BusinessMoney; change: Change }) {
  const confirm = useConfirm();
  const [month, setMonth] = useState(todayKey().slice(0, 7));
  const rows = realBesidePlan(m), sales = saleWord(m, 2);
  function add() {
    if (m.actual.some(a => a.month === month)) { focusSoon(`real-${month}-sales`); return; }
    if (change(setReal(month, {}))) focusSoon(`real-${month}-sales`);
  }
  async function remove(mo: string) {
    if (!(await confirm({ title: `Remove ${monthText(mo)}?`, body: 'The plan stays as it is.', confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (change(removeReal(mo))) { toast('Removed.'); focusSoon('moneyRealMonth'); }
  }
  return (
    <Card aria-labelledby="pjRealH" id="projectReal" data-s="money-real">
      <h3 id="pjRealH">Real months</h3>
      <Note className="mt-0">What actually came in and went out — kept apart from the plan, and never part of your personal Finance.</Note>
      {rows.length > 0 && (
        <ul className="list-none p-0 m-0" aria-label="Real months">
          {rows.map(({ real, plan }) => (
            <li key={real.month} className="border-t border-outline first:border-t-0 py-3" data-s="real-month" data-month={real.month}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{monthText(real.month)}</span>
                <LinkButton className="text-[15px]" data-action="real-remove" onClick={() => remove(real.month)}>Remove</LinkButton>
              </div>
              <div className="grid gap-2 grid-cols-3 mt-1">
                <Field label={`Real ${sales}`} htmlFor={`real-${real.month}-sales`} className="min-w-0"><CommitInput id={`real-${real.month}-sales`} key={`s${real.sales}`} type="number" inputMode="numeric" min={0} className="min-w-0" defaultValue={shown(real.sales)} onCommit={el => change(setReal(real.month, { sales: numberOf(el.value) }))} /></Field>
                <Field label="Money in" htmlFor={`real-${real.month}-in`} className="min-w-0"><CommitInput id={`real-${real.month}-in`} key={`i${real.in}`} type="number" inputMode="decimal" min={0} step="any" className="min-w-0" defaultValue={shown(real.in)} onCommit={el => change(setReal(real.month, { in: numberOf(el.value) }))} /></Field>
                <Field label="Money out" htmlFor={`real-${real.month}-out`} className="min-w-0"><CommitInput id={`real-${real.month}-out`} key={`o${real.out}`} type="number" inputMode="decimal" min={0} step="any" className="min-w-0" defaultValue={shown(real.out)} onCommit={el => change(setReal(real.month, { out: numberOf(el.value) }))} /></Field>
              </div>
              <Field label="Note (optional)" htmlFor={`real-${real.month}-note`} className="mt-2"><CommitInput id={`real-${real.month}-note`} key={`n${real.note}`} maxLength={MONEY_LIMITS.note} defaultValue={real.note} onCommit={el => change(setReal(real.month, { note: el.value }))} /></Field>
              <p className="m-0 mt-1 text-sm text-fg-2 tabular-nums" data-s="real-plan">{plan ? `Plan: ${plan.sales ?? 0} ${saleWord(m, plan.sales ?? 0)} · in ${withCurrency(m, Math.round(plan.in))} · out ${withCurrency(m, Math.round(plan.out))}` : 'Not in the forecast’s 12 months.'}</p>
            </li>
          ))}
        </ul>
      )}
      {m.actual.length < MONEY_LIMITS.actual && (
        <form className="flex flex-wrap items-end gap-2 mt-3" onSubmit={ev => { ev.preventDefault(); add(); }}>
          <Field label="Month" htmlFor="moneyRealMonth"><TextInput id="moneyRealMonth" type="month" className="!w-auto" value={month} onChange={ev => setMonth(ev.target.value)} /></Field>
          <Button inline type="submit" data-action="real-add" disabled={!/^\d{4}-\d{2}$/.test(month)}><Plus size={18} aria-hidden="true" /> Add a real month</Button>
        </form>
      )}
    </Card>
  );
}
