// Finance: a month's work pay (worked out from the Calendar by data/pay.ts, unchanged), money owed either way,
// monthly expenses, and what's left over. Every money figure about pay is an ESTIMATE, and says so on screen
// with the tax year and the source of the rules (gov.uk).
import { isDateKey, parseKey, shortDate, todayKey } from './dates';
import { computePeriod, parseTaxCode, periodAt, round2, TAX_YEARS, taxYearOf, type Period } from './pay';
import type { DateKey, Debt, Expense, FinanceData, MyDayData } from './types';
import { isObj, listOf, uid } from './util';

export const emptyFinance = (): FinanceData => ({ ratesSetOn: null, debts: [], expenses: [] });

export const money = (n: number) => n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' }).replace('-£', '−£');

// ---------- Your rates ----------
// The rates you gave (3 Oct 2026). They're saved into the pay settings the first time Finance opens (once:
// `ratesSetOn` remembers it), replacing what was there. After that, change them under "Rates" in Finance.
// Pay is worked out per calendar month; overtime is paid at the normal rate; bank holidays at double.
export function setYourRates(d: MyDayData) {
  const p = d.pay;
  p.hourlyRate = 13.85;
  p.overtimeMultiplier = 1;
  p.bankHolidayMultiplier = 2;
  p.nightMultiplier = 1;
  p.taxCode = '1241T';
  p.niCategory = 'A';
  p.studentLoans = { plan1: false, plan2: true, plan4: false, plan5: false, postgrad: false };
  p.frequency = 'monthly';
  p.periodAnchor = todayKey().slice(0, 8) + '01';
  p.annualLeavePaid = true;
  p.cancelledPaid = false;
  p.sickPay = 'ssp';
  d.finance.ratesSetOn = todayKey();
}

// ---------- Amounts ----------
// An amount typed in (e.g. "12.50", "£1,200"), or null if it isn't a positive amount in pounds and pence.
export function parseAmount(v: string): number | null {
  const s = v.replace(/[£,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$|^\.\d{1,2}$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n <= 10_000_000 ? round2(n) : null;
}
const savedAmount = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 10_000_000 ? round2(v) : null);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// ---------- Checking saved Finance data (when MyDay opens or a backup is imported) ----------
function cleanDebt(o: unknown): Debt | null {
  if (!isObj(o) || (o.direction !== 'owe' && o.direction !== 'owed')) return null;
  const person = text(o.person, 60), amount = savedAmount(o.amount);
  if (!person || amount === null) return null;
  return { id: typeof o.id === 'string' && o.id ? o.id : 'd' + uid(), direction: o.direction, person, amount, note: text(o.note, 200), since: isDateKey(o.since) ? o.since : todayKey() };
}
function cleanExpense(o: unknown): Expense | null {
  if (!isObj(o)) return null;
  const name = text(o.name, 80), amount = savedAmount(o.amount);
  if (!name || amount === null) return null;
  return { id: typeof o.id === 'string' && o.id ? o.id : 'e' + uid(), name, amount };
}
// Bad entries are dropped and counted (never silently); anything unknown in the section is kept as it was.
export function normalizeFinance(raw: unknown, report: { dropped: number }): FinanceData {
  if (!isObj(raw)) return emptyFinance();
  const out: FinanceData = { ...raw, ...emptyFinance() };
  if (isDateKey(raw.ratesSetOn)) out.ratesSetOn = raw.ratesSetOn;
  for (const [key, clean, prefix] of [['debts', cleanDebt, 'd'], ['expenses', cleanExpense, 'e']] as const) {
    if (raw[key] !== undefined && !Array.isArray(raw[key])) report.dropped++;
    const seen = new Set<string>();
    for (const x of listOf(raw[key])) {
      const c = clean(x);
      if (!c) { report.dropped++; continue; }
      if (seen.has(c.id)) c.id = prefix + uid();
      seen.add(c.id);
      (out[key] as (Debt | Expense)[]).push(c);
    }
  }
  return out;
}

// ---------- A month's work pay ----------
export interface WorkPay {
  period: Period;
  when: 'past' | 'current' | 'future';
  worked: number;   // shifts worked so far (marked worked, or planned and already past), overtime included
  toCome: number;   // shifts still planned in the period
  overtime: number; // of all those, overtime shifts
  gross: number; tax: number; ni: number; sl: number; pgl: number; net: number;
  hasRate: boolean;
  deductionsOk: boolean;  // false if there are no tax rates for the tax year
  taxOk: boolean;         // false if the tax code isn't one MyDay can work out (then tax and take-home show "—")
  taxYear: string | null; // e.g. "2026/27"
  notes: string[];        // only what you'd need to know
}
export function workPay(data: MyDayData, offset: number): WorkPay {
  const per = periodAt(data.pay, offset), today: DateKey = todayKey();
  const r = computePeriod(data, per), A = r.act;
  const ot = data.rota.entries.filter(x => x.kind === 'overtime' && x.start.slice(0, 10) >= per.start && x.start.slice(0, 10) <= per.end);
  const otDone = ot.filter(x => x.start.slice(0, 10) <= today).length;
  const ded = A.ded!;
  const notes: string[] = [];
  if (!data.rota.patterns.length && !ot.length) notes.push('Add your shift pattern in Calendar to see your pay here.');
  if (!data.bankHolidays.divisions) notes.push("Bank holidays haven't loaded yet, so any bank holiday pay isn't included. They load when you're online.");
  for (const n of ded.notes) notes.push(n);
  const ty = TAX_YEARS[taxYearOf(per.end)];
  return {
    period: per,
    when: per.end < today ? 'past' : per.start > today ? 'future' : 'current',
    worked: A.shifts - r.notes.assumedFuture + otDone,
    toCome: r.notes.assumedFuture + ot.length - otDone,
    overtime: ot.length,
    gross: A.gross, tax: ded.tax, ni: ded.ni, sl: ded.sl, pgl: ded.pgl, net: A.net!,
    hasRate: data.pay.hourlyRate !== null,
    deductionsOk: ded.ok,
    taxOk: ded.ok && !parseTaxCode(data.pay.taxCode).error,
    taxYear: ty ? ty.label : null,
    notes,
  };
}

// "October 2026" for a calendar month, otherwise the dates, e.g. "26 Oct – 25 Nov".
export function periodLabel(w: WorkPay): string {
  const { start, end } = w.period;
  if (start.endsWith('-01') && start.slice(0, 7) === end.slice(0, 7)) return parseKey(start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  return `${shortDate(start)} – ${shortDate(end)}`;
}

// ---------- Totals ----------
const sum = (xs: number[]) => round2(xs.reduce((a, b) => a + b, 0));
export const debtTotals = (f: FinanceData) => ({
  owe: sum(f.debts.filter(d => d.direction === 'owe').map(d => d.amount)),
  owed: sum(f.debts.filter(d => d.direction === 'owed').map(d => d.amount)),
});
export const expensesTotal = (f: FinanceData) => sum(f.expenses.map(e => e.amount));
