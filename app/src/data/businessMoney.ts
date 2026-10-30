// A business idea's money (specs/projects-business-tools.md): its numbers in one place — what each sale brings in and
// costs (an amount, or a share of the average sale), what runs each month, what it takes to start — each saying where
// it's from (a guess, a quote, measured). From those MyDay works out what each sale leaves, the sales a month to break
// even, how long to win back the start-up costs, and a 12-month forecast. Real months sit beside the plan, never mixed
// into it, and nothing here touches your personal Finance. Saved inside the one page (`project.model.money`), so it
// syncs with it. The sums are worked out each time, never saved. Plain numbers and words: no scores, no advice about
// whether the idea will work. Never sent to AI.
import { tidyText } from './projectResources';
import type { BusinessMoney, MoneyLine, MoneyMonth } from './types';
import { isObj, listOf, uid } from './util';

export const MONEY_LIMITS = { perSale: 12, monthly: 20, startup: 20, months: 12, actual: 60, label: 80, note: 200, currency: 8, sale: 24, max: 1_000_000_000 };
export type MoneyList = 'perSale' | 'monthly' | 'startup';
export const LISTS: MoneyList[] = ['perSale', 'monthly', 'startup'];
export const CURRENCIES = ['USD', 'GBP', 'EUR', 'SOS', 'ETB', 'KES', 'AED', 'SAR'];
export const BASIS_LABEL: Record<string, string> = { guess: 'a guess', quote: 'a quote', measured: 'measured' };
export const BASES = ['guess', 'quote', 'measured'] as const;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
export const isMonth = (v: unknown): v is string => typeof v === 'string' && MONTH.test(v);

// ---------- Reading ----------
const num = (v: unknown, max = MONEY_LIMITS.max): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(v, max) : null);
export const emptyMoney = (): BusinessMoney => ({ currency: '', sale: '', saleValue: null, perSale: [], monthly: [], startup: [], atSales: null, forecast: { from: null, sales: [] }, actual: [] });
function readLines(raw: unknown, list: MoneyList, report: { dropped: number }): MoneyLine[] {
  if (raw !== undefined && !Array.isArray(raw)) report.dropped++;
  const out: MoneyLine[] = [], seen = new Set<string>();
  for (const l of listOf(raw)) {
    // A line needs an id and a direction; anything a newer MyDay keeps on it stays.
    if (!isObj(l) || typeof l.id !== 'string' || !l.id || seen.has(l.id) || (l.dir !== 'in' && l.dir !== 'out')) { report.dropped++; continue; }
    seen.add(l.id);
    const percent = list === 'perSale' && l.per === 'percent';
    out.push({ ...l, id: l.id, label: typeof l.label === 'string' ? tidyText(l.label, MONEY_LIMITS.label) : '', dir: l.dir, amount: num(l.amount, percent ? 100 : MONEY_LIMITS.max) ?? 0,
      per: percent ? 'percent' : 'fixed', basis: typeof l.basis === 'string' && l.basis ? l.basis : 'guess', note: typeof l.note === 'string' ? tidyText(l.note, MONEY_LIMITS.note) : '' });
  }
  return out;
}
// Reading a saved money plan: what can't be read is counted, never half-kept; fields from a newer MyDay are kept.
export function normalizeMoney(raw: unknown, report: { dropped: number }): BusinessMoney | undefined {
  if (raw === undefined) return undefined;
  if (!isObj(raw)) { report.dropped++; return undefined; }
  const f = isObj(raw.forecast) ? raw.forecast : {};
  const sales = listOf(f.sales).slice(0, MONEY_LIMITS.months).map(v => num(v));
  const actual: MoneyMonth[] = [], months = new Set<string>();
  for (const a of listOf(raw.actual)) {
    if (!isObj(a) || !isMonth(a.month) || months.has(a.month)) { report.dropped++; continue; }
    months.add(a.month);
    actual.push({ ...a, month: a.month, sales: num(a.sales), in: num(a.in), out: num(a.out), note: typeof a.note === 'string' ? tidyText(a.note, MONEY_LIMITS.note) : '' });
  }
  actual.sort((a, b) => a.month.localeCompare(b.month));
  const m: BusinessMoney = {
    ...raw, currency: typeof raw.currency === 'string' ? tidyText(raw.currency, MONEY_LIMITS.currency) : '', sale: typeof raw.sale === 'string' ? tidyText(raw.sale, MONEY_LIMITS.sale) : '',
    saleValue: num(raw.saleValue), perSale: readLines(raw.perSale, 'perSale', report), monthly: readLines(raw.monthly, 'monthly', report), startup: readLines(raw.startup, 'startup', report),
    atSales: num(raw.atSales), forecast: { ...f, from: isMonth(f.from) ? f.from : null, sales }, actual: actual.slice(-MONEY_LIMITS.actual),
  };
  report.dropped += actual.length - m.actual.length;
  return moneyIsEmpty(m) ? undefined : m;
}
const OWN = ['currency', 'sale', 'saleValue', 'perSale', 'monthly', 'startup', 'atSales', 'forecast', 'actual'];
// Nothing in it worth keeping (and nothing a newer MyDay added): the one page is saved as if it never had one.
export const moneyIsEmpty = (m: BusinessMoney) => !m.currency && !m.sale && !m.perSale.length && !m.monthly.length && !m.startup.length && !m.actual.length && m.saleValue === null && m.atSales === null
  && !m.forecast.from && m.forecast.sales.every(v => v === null) && Object.keys(m).every(k => OWN.includes(k)) && Object.keys(m.forecast).every(k => k === 'from' || k === 'sales');

// ---------- Working it out ----------
const round2 = (n: number) => Math.round(n * 100) / 100;
export const lineValue = (l: MoneyLine, saleValue: number | null) => (l.per === 'percent' ? ((saleValue ?? 0) * l.amount) / 100 : l.amount);
const total = (lines: MoneyLine[], dir: 'in' | 'out', saleValue: number | null) => lines.filter(l => l.dir === dir).reduce((s, l) => s + lineValue(l, saleValue), 0);
export interface MoneySums { perSaleIn: number; perSaleOut: number; leaves: number; monthlyIn: number; monthlyOut: number; monthlyNet: number; startupNet: number; needsSaleValue: boolean }
export function sums(m: BusinessMoney): MoneySums {
  const perSaleIn = total(m.perSale, 'in', m.saleValue), perSaleOut = total(m.perSale, 'out', m.saleValue), monthlyIn = total(m.monthly, 'in', null), monthlyOut = total(m.monthly, 'out', null);
  return { perSaleIn, perSaleOut, leaves: round2(perSaleIn - perSaleOut), monthlyIn, monthlyOut, monthlyNet: round2(monthlyOut - monthlyIn),
    startupNet: round2(total(m.startup, 'out', null) - total(m.startup, 'in', null)), needsSaleValue: m.saleValue === null && m.perSale.some(l => l.per === 'percent') };
}
// The sales a month that cover the running costs: none to work out yet; never (each sale loses money, or leaves
// nothing); already covered (the month's own income covers it); or a number of sales.
export type BreakEven = { kind: 'empty' } | { kind: 'never'; loses: number } | { kind: 'covered' } | { kind: 'sales'; n: number };
export function breakEven(m: BusinessMoney): BreakEven {
  const s = sums(m);
  if (!m.perSale.length) return { kind: 'empty' };
  if (s.monthlyNet <= 0) return { kind: 'covered' };
  if (s.leaves <= 0) return { kind: 'never', loses: -s.leaves };
  return { kind: 'sales', n: Math.ceil(s.monthlyNet / s.leaves - 1e-9) };
}
// At a number of sales a month, the months to win back the start-up costs: nothing to win back; never at that level
// (`even`: the month only just covers its running costs); or a number of months.
export type Payback = { kind: 'none' } | { kind: 'never'; even: boolean } | { kind: 'months'; n: number };
export function payback(m: BusinessMoney, perMonth: number): Payback {
  const s = sums(m), profit = round2(perMonth * s.leaves - s.monthlyNet);
  if (s.startupNet <= 0) return { kind: 'none' };
  if (profit <= 0) return { kind: 'never', even: profit === 0 };
  return { kind: 'months', n: Math.ceil(s.startupNet / profit - 1e-9) };
}
export const addMonths = (month: string, n: number) => { const [y, mo] = month.split('-').map(Number), i = y * 12 + mo - 1 + n; return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`; };
export interface ForecastRow { month: string; sales: number | null; in: number; out: number; net: number; total: number }
export interface Forecast { opening: number; rows: ForecastRow[]; lowest: { value: number; month: string | null }; blackFrom: string | null; backBy: string | null }
// The 12 months from the first one: each month's money in and out from its sales and the running costs, and the running
// total, starting below zero by the start-up costs. The lowest point, the first month that's in the black, and the
// month the start-up costs are back (null when that isn't within these months). Null without a first month.
export function forecast(m: BusinessMoney): Forecast | null {
  if (!m.forecast.from) return null;
  const s = sums(m), opening = -s.startupNet, rows: ForecastRow[] = [];
  let run = opening, lowest = { value: opening, month: null as string | null }, blackFrom: string | null = null, backBy: string | null = null;
  for (let i = 0; i < MONEY_LIMITS.months; i++) {
    const sales = m.forecast.sales[i] ?? null, n = sales ?? 0, month = addMonths(m.forecast.from, i);
    const inn = round2(n * s.perSaleIn + s.monthlyIn), out = round2(n * s.perSaleOut + s.monthlyOut), net = round2(inn - out);
    run = round2(run + net);
    rows.push({ month, sales, in: inn, out, net, total: run });
    if (run < lowest.value) lowest = { value: run, month };
    if (!blackFrom && net > 0) blackFrom = month;
    if (!backBy && opening < 0 && run >= 0) backBy = month;
  }
  return { opening, rows, lowest, blackFrom, backBy };
}
// "Start at 100, add 20% a month" (or add a number a month): the 12 months' sales, whole numbers.
export function fillSales(start: number, step: number, mode: 'percent' | 'add'): number[] {
  return Array.from({ length: MONEY_LIMITS.months }, (_, i) => Math.min(MONEY_LIMITS.max, Math.max(0, Math.round(mode === 'percent' ? start * (1 + step / 100) ** i : start + step * i))));
}
// A real month beside its plan (when that month is in the forecast).
export function realBesidePlan(m: BusinessMoney): { real: MoneyMonth; plan: ForecastRow | null }[] {
  const rows = forecast(m)?.rows ?? [];
  return m.actual.map(real => ({ real, plan: rows.find(r => r.month === real.month) ?? null }));
}

// ---------- Changes (each made through changeMoney in data/businessModel.ts, which keeps the one page tidy) ----------
export type MoneyChange = (m: BusinessMoney) => boolean;
type Change = MoneyChange;
const amount = (v: number | null, max = MONEY_LIMITS.max) => (v === null || !Number.isFinite(v) ? null : Math.min(Math.max(0, v), max));
export interface MoneyFields { currency?: string; sale?: string; saleValue?: number | null; atSales?: number | null }
export const setFields = (patch: MoneyFields): Change => m => {
  const next = {
    currency: patch.currency === undefined ? m.currency : tidyText(patch.currency, MONEY_LIMITS.currency),
    sale: patch.sale === undefined ? m.sale : tidyText(patch.sale, MONEY_LIMITS.sale),
    saleValue: patch.saleValue === undefined ? m.saleValue : amount(patch.saleValue),
    atSales: patch.atSales === undefined ? m.atSales : amount(patch.atSales),
  };
  if (next.currency === m.currency && next.sale === m.sale && next.saleValue === m.saleValue && next.atSales === m.atSales) return false;
  Object.assign(m, next);
  return true;
};
export interface NewLine { label: string; dir: 'in' | 'out'; amount: number; per?: 'fixed' | 'percent'; basis?: string; note?: string }
const LIMIT: Record<MoneyList, number> = { perSale: MONEY_LIMITS.perSale, monthly: MONEY_LIMITS.monthly, startup: MONEY_LIMITS.startup };
// Adds a line (it needs a name); false when the list is full or there's nothing to add.
export const addLine = (list: MoneyList, l: NewLine, made: { id?: string } = {}): Change => m => {
  const label = tidyText(l.label, MONEY_LIMITS.label), percent = list === 'perSale' && l.per === 'percent';
  if (!label || m[list].length >= LIMIT[list]) return false;
  const id = 'ml' + uid();
  m[list].push({ id, label, dir: l.dir === 'in' ? 'in' : 'out', amount: amount(l.amount, percent ? 100 : MONEY_LIMITS.max) ?? 0, per: percent ? 'percent' : 'fixed',
    basis: BASES.includes(l.basis as typeof BASES[number]) ? l.basis! : 'guess', note: tidyText(l.note ?? '', MONEY_LIMITS.note) });
  made.id = id;
  return true;
};
export const editLine = (list: MoneyList, id: string, patch: Partial<NewLine>): Change => m => {
  const l = m[list].find(x => x.id === id);
  if (!l) return false;
  const per = list === 'perSale' ? (patch.per ?? l.per) : 'fixed';
  const next = {
    label: patch.label === undefined ? l.label : tidyText(patch.label, MONEY_LIMITS.label) || l.label,
    dir: patch.dir === undefined ? l.dir : patch.dir === 'in' ? 'in' as const : 'out' as const,
    amount: patch.amount === undefined ? (per === 'percent' ? Math.min(l.amount, 100) : l.amount) : amount(patch.amount, per === 'percent' ? 100 : MONEY_LIMITS.max) ?? 0,
    per, basis: patch.basis === undefined ? l.basis : BASES.includes(patch.basis as typeof BASES[number]) ? patch.basis : l.basis,
    note: patch.note === undefined ? l.note : tidyText(patch.note, MONEY_LIMITS.note),
  };
  if (next.label === l.label && next.dir === l.dir && next.amount === l.amount && next.per === l.per && next.basis === l.basis && next.note === l.note) return false;
  Object.assign(l, next);
  return true;
};
export const removeLine = (list: MoneyList, id: string): Change => m => {
  if (!m[list].some(x => x.id === id)) return false;
  m[list] = m[list].filter(x => x.id !== id);
  return true;
};
export const setForecastFrom = (month: string | null): Change => m => {
  const from = isMonth(month) ? month : null;
  if (from === m.forecast.from) return false;
  m.forecast.from = from;
  return true;
};
export const setForecastSales = (i: number, v: number | null): Change => m => {
  if (!Number.isInteger(i) || i < 0 || i >= MONEY_LIMITS.months) return false;
  const sales = Array.from({ length: MONEY_LIMITS.months }, (_, j) => m.forecast.sales[j] ?? null), n = amount(v);
  if (sales[i] === (n === null ? null : Math.round(n))) return false;
  sales[i] = n === null ? null : Math.round(n);
  while (sales.length && sales[sales.length - 1] === null) sales.pop();
  m.forecast.sales = sales;
  return true;
};
export const fillForecast = (start: number, step: number, mode: 'percent' | 'add'): Change => m => {
  const sales = fillSales(amount(start) ?? 0, Number.isFinite(step) ? step : 0, mode);
  if (JSON.stringify(sales) === JSON.stringify(m.forecast.sales)) return false;
  m.forecast.sales = sales;
  return true;
};
// A real month: added, or changed when it's there. Its numbers are totals you enter; null is "not entered".
export interface RealPatch { sales?: number | null; in?: number | null; out?: number | null; note?: string }
export const setReal = (month: string, patch: RealPatch): Change => m => {
  if (!isMonth(month)) return false;
  let r = m.actual.find(x => x.month === month), added = false;
  if (!r) {
    if (m.actual.length >= MONEY_LIMITS.actual) return false;
    r = { month, sales: null, in: null, out: null, note: '' }; added = true;
    m.actual = [...m.actual, r].sort((a, b) => a.month.localeCompare(b.month));
  }
  const next = { sales: patch.sales === undefined ? r.sales : amount(patch.sales), in: patch.in === undefined ? r.in : amount(patch.in), out: patch.out === undefined ? r.out : amount(patch.out),
    note: patch.note === undefined ? r.note : tidyText(patch.note, MONEY_LIMITS.note) };
  const same = JSON.stringify(next) === JSON.stringify({ sales: r.sales, in: r.in, out: r.out, note: r.note });
  Object.assign(r, next);
  return added || !same;
};
export const removeReal = (month: string): Change => m => {
  if (!m.actual.some(x => x.month === month)) return false;
  m.actual = m.actual.filter(x => x.month !== month);
  return true;
};

// ---------- Words ----------
// Amounts as plain numbers: whole when they are, otherwise two decimals ("1,365", "1.80"); with `cents`, always two
// (a sale's small amounts side by side: "costs 2.00 — leaves 1.90").
export function amountText(n: number, cents = false): string {
  const r = round2(n), d = cents || !Number.isInteger(r) ? 2 : 0;
  return r.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}
export const withCurrency = (m: BusinessMoney, n: number, cents = false) => `${m.currency ? `${m.currency} ` : ''}${n < 0 ? '−' : ''}${amountText(Math.abs(n), cents)}`;
export const monthText = (month: string) => { const [y, mo] = month.split('-').map(Number); return new Date(y, mo - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }); };
// "order"/"orders"; "delivery"/"deliveries"; "box"/"boxes".
export const saleWord = (m: BusinessMoney, n = 1) => {
  const w = m.sale || 'sale';
  return n === 1 ? w : /[^aeiou]y$/i.test(w) ? `${w.slice(0, -1)}ies` : /(s|x|z|ch|sh)$/i.test(w) ? `${w}es` : `${w}s`;
};
// The break-even in words, for the Money tab and At a glance.
export function breakEvenText(m: BusinessMoney): string {
  const b = breakEven(m), s = sums(m);
  if (b.kind === 'empty') return 'Add what each sale brings in and costs to see your break-even.';
  if (b.kind === 'never' && s.needsSaleValue && s.leaves <= 0) return `Add the average value of one ${saleWord(m)} to count the percentages.`;
  if (b.kind === 'never') return s.leaves === 0 ? `Each ${saleWord(m)} leaves nothing — no number of ${saleWord(m, 2)} breaks even.` : `Each ${saleWord(m)} loses ${withCurrency(m, b.loses, true)} — no number of ${saleWord(m, 2)} breaks even.`;
  if (b.kind === 'covered') return 'The running costs are covered without any sales.';
  return `Break-even: ${b.n.toLocaleString()} ${saleWord(m, b.n)} a month`;
}
