// Pay estimates: hours, gross pay and estimated take-home for a pay period. Ported line for line from
// the current MyDay — same rules, same rates, same rounding. Rates were checked on gov.uk ("Rates and
// thresholds for employers"); tax-year keys are the year the tax year starts (6 April).
// Everything here is an ESTIMATE, labelled as such on screen with the tax year used.
import { dayDiff, isDateKey, keyOf, pad, parseKey, shift, shortDate, todayKey } from './dates';
import { isObj, numIn } from './util';
export { numIn };
import { bankHolidayOn } from './bankHolidays';
import { actualFor, dtToDate, msBetween, overlapMs, plannedFor, type Planned } from './rota';
import type { DateKey, LoanPlan, MyDayData, PayFrequency, PaySettings } from './types';

type Bands = [number, number][];
interface TaxYear { label: string; ruk: Bands; scot: Bands; ni: { ptW: number; uelW: number; ptM: number; uelM: number }; sl: Record<LoanPlan, number | null>; ssp: { weekly: number; lel: number | null } }
export const TAX_YEARS: Record<number, TaxYear> = {
  2025: {
    label: '2025/26',
    ruk: [[37700, 0.20], [125140, 0.40], [Infinity, 0.45]],
    scot: [[2827, 0.19], [14921, 0.20], [31092, 0.21], [62430, 0.42], [125140, 0.45], [Infinity, 0.48]],
    ni: { ptW: 242, uelW: 967, ptM: 1048, uelM: 4189 },
    sl: { plan1: 26065, plan2: 28470, plan4: 32745, plan5: null, postgrad: 21000 },
    ssp: { weekly: 118.75, lel: 125 },
  },
  2026: {
    label: '2026/27',
    ruk: [[37700, 0.20], [125140, 0.40], [Infinity, 0.45]],
    scot: [[3967, 0.19], [16956, 0.20], [31092, 0.21], [62430, 0.42], [125140, 0.45], [Infinity, 0.48]],
    ni: { ptW: 242, uelW: 967, ptM: 1048, uelM: 4189 },
    sl: { plan1: 26900, plan2: 29385, plan4: 33795, plan5: 25000, postgrad: 21000 },
    ssp: { weekly: 123.25, lel: null },
  },
};
// From this date: SSP is paid from the first full day, with no lower earnings limit, at the lower of
// the flat rate or 80% of average weekly earnings.
const SSP_REFORM = '2026-04-06';
export const LOAN_LABEL: Record<LoanPlan, string> = { plan1: 'Plan 1', plan2: 'Plan 2', plan4: 'Plan 4', plan5: 'Plan 5', postgrad: 'Postgraduate' };
export const FREQ_LABEL: Record<PayFrequency, string> = { weekly: 'Weekly', fortnightly: 'Fortnightly', four_weekly: 'Every 4 weeks', monthly: 'Monthly' };
const FREQ_DAYS: Record<Exclude<PayFrequency, 'monthly'>, number> = { weekly: 7, fortnightly: 14, four_weekly: 28 };

export function defaultPay(): PaySettings {
  return {
    hourlyRate: null, nightMultiplier: 1, overtimeMultiplier: 1.5, bankHolidayMultiplier: 2, bankHolidayHours: 'clock',
    annualLeavePaid: true, cancelledPaid: false, sickPay: 'ssp', sickPercent: 50, averageWeeklyEarnings: null,
    frequency: 'monthly', periodAnchor: todayKey().slice(0, 8) + '01',
    taxCode: '1257L', niCategory: 'A', studentLoans: { plan1: false, plan2: false, plan4: false, plan5: false, postgrad: false },
  };
}
// Checks saved pay settings exactly as normalizePay() in the current MyDay does.
export function normalizePay(raw: unknown): PaySettings {
  const p = defaultPay();
  if (!isObj(raw)) return p;
  p.hourlyRate = numIn(raw.hourlyRate, 0, 1000, null);
  p.nightMultiplier = numIn(raw.nightMultiplier, 1, 5, 1);
  p.overtimeMultiplier = numIn(raw.overtimeMultiplier, 1, 5, 1.5);
  p.bankHolidayMultiplier = numIn(raw.bankHolidayMultiplier, 1, 5, 2);
  p.bankHolidayHours = raw.bankHolidayHours === 'shift' ? 'shift' : 'clock';
  p.annualLeavePaid = raw.annualLeavePaid !== false;
  p.cancelledPaid = raw.cancelledPaid === true;
  p.sickPay = raw.sickPay === 'full' || raw.sickPay === 'percent' ? raw.sickPay : 'ssp';
  p.sickPercent = numIn(raw.sickPercent, 0, 100, 50);
  p.averageWeeklyEarnings = numIn(raw.averageWeeklyEarnings, 0, 100000, null);
  p.frequency = FREQ_LABEL[raw.frequency as PayFrequency] ? (raw.frequency as PayFrequency) : 'monthly';
  if (isDateKey(raw.periodAnchor)) p.periodAnchor = raw.periodAnchor;
  if (typeof raw.taxCode === 'string' && raw.taxCode.trim()) p.taxCode = raw.taxCode.trim().toUpperCase().slice(0, 12);
  p.niCategory = raw.niCategory === 'X' ? 'X' : 'A';
  if (isObj(raw.studentLoans)) for (const k of Object.keys(p.studentLoans) as LoanPlan[]) p.studentLoans[k] = raw.studentLoans[k] === true;
  return p;
}

// ---------- Pay periods ----------
export function shiftMonth(k: DateKey, n: number): DateKey { const [y, m, d] = k.split('-').map(Number); return keyOf(new Date(y, m - 1 + n, d, 12)); }
export interface Period { start: DateKey; end: DateKey }
export function periodContaining(pay: PaySettings, x: DateKey): Period {
  if (pay.frequency === 'monthly') {
    const day = Math.min(28, Number(pay.periodAnchor.slice(8, 10)));
    let start = x.slice(0, 8) + pad(day);
    if (start > x) start = shiftMonth(start, -1);
    return { start, end: shift(shiftMonth(start, 1), -1) };
  }
  const len = FREQ_DAYS[pay.frequency];
  const n = Math.floor(dayDiff(x, pay.periodAnchor) / len);
  const start = shift(pay.periodAnchor, n * len);
  return { start, end: shift(start, len - 1) };
}
// The pay period `offset` periods from the current one (0 = this period).
export function periodAt(pay: PaySettings, offset: number): Period {
  const cur = periodContaining(pay, todayKey());
  if (pay.frequency === 'monthly') return periodContaining(pay, shiftMonth(cur.start, offset));
  return periodContaining(pay, shift(cur.start, offset * FREQ_DAYS[pay.frequency]));
}
export function taxYearOf(d: DateKey) { const y = +d.slice(0, 4); return d >= `${y}-04-06` ? y : y - 1; }

// ---------- Deductions ----------
type TaxCode = { scottish?: boolean; noTax?: boolean; flatRate?: number; allowance?: number; error?: string };
export function parseTaxCode(raw: string): TaxCode {
  let c = String(raw || '').toUpperCase().replace(/\s+/g, '').replace(/(W1|M1|X)$/, '');
  let scottish = false;
  if (c.startsWith('S')) { scottish = true; c = c.slice(1); } else if (c.startsWith('C')) c = c.slice(1);
  if (c === 'NT') return { scottish, noTax: true };
  if (c === 'BR') return { scottish, flatRate: 0.20 };
  if (scottish && /^D[0-3]$/.test(c)) return { scottish, flatRate: [0.21, 0.42, 0.45, 0.48][+c[1]] };
  if (!scottish && /^D[01]$/.test(c)) return { scottish, flatRate: [0.40, 0.45][+c[1]] };
  const m = c.match(/^(\d{1,5})[LMNT]$/);
  if (m) return { scottish, allowance: Number(m[1]) === 0 ? 0 : Number(m[1]) * 10 + 9 };
  if (/^K\d+$/.test(c)) return { error: "K tax codes aren't supported yet, so tax isn't estimated." };
  return { error: "That tax code isn't recognised, so tax isn't estimated." };
}

const floor2 = (n: number) => Math.floor(n * 100 + 1e-9) / 100;
export const round2 = (n: number) => Math.round(n * 100) / 100;

export interface Deductions { tax: number; ni: number; sl: number; pgl: number; notes: string[]; ok: boolean }
// Estimated deductions for one pay period on its own (non-cumulative, like a "Week 1/Month 1" code).
export function deductionsFor(pay: PaySettings, gross: number, freq: PayFrequency, taxYear: number): Deductions {
  const R = TAX_YEARS[taxYear], out: Deductions = { tax: 0, ni: 0, sl: 0, pgl: 0, notes: [], ok: !!R };
  if (!R) { out.notes.push(`No tax rates are stored for the ${taxYear}/${String(taxYear + 1).slice(2)} tax year, so deductions aren't estimated.`); return out; }
  const per = freq === 'monthly' ? 0 : FREQ_DAYS[freq] / 7;
  const frac = freq === 'monthly' ? 1 / 12 : per / 52;
  const code = parseTaxCode(pay.taxCode);
  if (code.error) out.notes.push(code.error);
  else if (code.noTax) out.tax = 0;
  else if (code.flatRate) out.tax = floor2(gross * code.flatRate);
  else {
    const taxable = Math.floor(Math.max(0, gross - code.allowance! * frac));
    let tax = 0, prev = 0;
    for (const [limit, rate] of (code.scottish ? R.scot : R.ruk)) {
      const lim = limit * frac;
      const part = Math.min(taxable, lim) - prev;
      if (part > 0) tax += part * rate;
      prev = lim;
      if (taxable <= lim) break;
    }
    out.tax = floor2(tax);
  }
  if (pay.niCategory === 'A') {
    const pt = freq === 'monthly' ? R.ni.ptM : R.ni.ptW * per, uel = freq === 'monthly' ? R.ni.uelM : R.ni.uelW * per;
    out.ni = round2(Math.max(0, Math.min(gross, uel) - pt) * 0.08 + Math.max(0, gross - uel) * 0.02);
  }
  const perThreshold = (annual: number) => (freq === 'monthly' ? floor2(annual / 12) : floor2(annual / 52) * per);
  const ug = (['plan1', 'plan2', 'plan4', 'plan5'] as LoanPlan[]).filter(k => pay.studentLoans[k]);
  const usable = ug.filter(k => R.sl[k] !== null);
  if (ug.length > usable.length) out.notes.push(`${ug.filter(k => R.sl[k] === null).map(k => LOAN_LABEL[k]).join(', ')} repayments don't apply in ${R.label}.`);
  if (usable.length) {
    const th = Math.min(...usable.map(k => R.sl[k] as number));
    out.sl = Math.floor(Math.max(0, gross - perThreshold(th)) * 0.09);
    if (usable.length > 1) out.notes.push('With more than one undergraduate loan, this uses the lowest threshold — your employer splits it between plans.');
  }
  if (pay.studentLoans.postgrad) out.pgl = Math.floor(Math.max(0, gross - perThreshold(R.sl.postgrad as number)) * 0.06);
  return out;
}

// ---------- Hours and money for one working interval ----------
export interface Totals {
  shifts: number; paidHours: number; nightHours: number; overtimeHours: number; bhHours: number; leaveHours: number; sickDays: number; sspDays: number;
  basic: number; nightPremium: number; overtimePay: number; bhPremium: number; leavePay: number; sickPay: number; otherPay: number; gross: number;
  ded?: Deductions; net?: number;
}
const blankTotals = (): Totals => ({ shifts: 0, paidHours: 0, nightHours: 0, overtimeHours: 0, bhHours: 0, leaveHours: 0, sickDays: 0, sspDays: 0,
  basic: 0, nightPremium: 0, overtimePay: 0, bhPremium: 0, leavePay: 0, sickPay: 0, otherPay: 0, gross: 0 });

// Bank holiday time within [sMs, eMs): hours falling on the day, or the whole shift if it starts on one.
function bankHolidayMs(data: MyDayData, sMs: number, eMs: number, startDate: DateKey) {
  if (data.pay.bankHolidayHours === 'shift') return bankHolidayOn(data, startDate) ? eMs - sMs : 0;
  let ms = 0;
  for (let d = shift(startDate, -1); d <= keyOf(new Date(eMs)); d = shift(d, 1)) {
    if (!bankHolidayOn(data, d)) continue;
    ms += overlapMs(sMs, eMs, +dtToDate(d + 'T00:00'), +dtToDate(shift(d, 1) + 'T00:00'));
  }
  return ms;
}
// Splits paid hours into normal and bank-holiday hours. The unpaid break is taken proportionally.
// Where premiums overlap (e.g. overtime on a bank holiday), the higher rate applies — they don't stack.
type Segs = [number, number][] & { fullMs?: number };
function payInterval(data: MyDayData, acc: Totals, segs: Segs, breakMin: number, startDate: DateKey, typeMult: number, kind: 'day' | 'night' | 'overtime') {
  const rate = data.pay.hourlyRate || 0, bhMult = data.pay.bankHolidayMultiplier;
  const totalMs = segs.reduce((a, s) => a + (s[1] - s[0]), 0);
  if (totalMs <= 0) return 0;
  const shiftMs = segs.fullMs || totalMs;
  const ratio = Math.max(0, shiftMs - breakMin * 60000) / shiftMs;
  const hours = (totalMs / 3600000) * ratio;
  const bhHours = (segs.reduce((a, s) => a + bankHolidayMs(data, s[0], s[1], startDate), 0) / 3600000) * ratio;
  const bhPremium = bhHours * rate * Math.max(0, Math.max(bhMult, typeMult) - typeMult);
  acc.bhHours += bhHours;
  acc.bhPremium += bhPremium;
  if (kind === 'overtime') { acc.overtimeHours += hours; acc.overtimePay += hours * rate * typeMult; }
  else {
    acc.paidHours += hours;
    acc.basic += hours * rate;
    if (kind === 'night') { acc.nightHours += hours; acc.nightPremium += hours * rate * (typeMult - 1); }
  }
  return hours * rate * typeMult + bhPremium;
}
// What a planned shift would normally pay (used for leave, cancelled-but-paid, and company sick pay).
function plannedValue(data: MyDayData, p: Planned | null) {
  if (!p || !p.works) return { hours: 0, pay: 0 };
  const ms = msBetween(p.startDt!, p.endDt!);
  const hours = Math.max(0, ms - p.breakMin * 60000) / 3600000;
  const mult = p.type === 'night' ? data.pay.nightMultiplier : 1;
  return { hours, pay: hours * (data.pay.hourlyRate || 0) * mult };
}

// ---------- Statutory Sick Pay ----------
const isQualifyingDay = (data: MyDayData, d: DateKey) => { const p = plannedFor(data, d); return !!(p && p.works); };
function qualifyingDaysInWeek(data: MyDayData, d: DateKey) {
  const sunday = shift(d, -parseKey(d).getDay());
  let n = 0;
  for (let i = 0; i < 7; i++) if (isQualifyingDay(data, shift(sunday, i))) n++;
  return n;
}
type AWE = { value: number | null; source: 'entered' | 'estimated' | 'unknown' };
function estimatedAWE(data: MyDayData, before: DateKey): AWE {
  if (data.pay.averageWeeklyEarnings !== null) return { value: data.pay.averageWeeklyEarnings, source: 'entered' };
  if (!data.pay.hourlyRate) return { value: null, source: 'unknown' };
  let sum = 0;
  for (let i = 1; i <= 56; i++) sum += plannedValue(data, plannedFor(data, shift(before, -i))).pay;
  return { value: round2(sum / 8), source: 'estimated' };
}
type SspDay = { amount: number; note?: string; weekly?: number; qds?: number; basis?: string; awe?: AWE };
// SSP for every sick qualifying day.
function sspSchedule(data: MyDayData): Record<DateKey, SspDay> {
  const ov = data.rota.overrides;
  const sick = Object.keys(ov).filter(d => ov[d].actual && ov[d].actual!.status === 'sick').sort();
  const runs: DateKey[][] = [];
  for (const d of sick) {
    const last = runs[runs.length - 1];
    if (last && shift(last[last.length - 1], 1) === d) last.push(d); else runs.push([d]);
  }
  // Days that count as part of a period of incapacity for work (PIW).
  const piwDays = runs.map(run => run.filter(d => d >= SSP_REFORM || run.length >= 4)).filter(r => r.length);
  // Link PIWs that are 8 weeks (56 days) or less apart.
  const chains: DateKey[][] = [];
  for (const r of piwDays) {
    const last = chains[chains.length - 1];
    if (last && dayDiff(r[0], last[last.length - 1]) <= 57) last.push(...r); else chains.push(r.slice());
  }
  const out: Record<DateKey, SspDay> = {};
  for (const chain of chains) {
    let waiting = 3, weeksPaid = 0;
    const awe = estimatedAWE(data, chain[0]);
    for (const d of chain) {
      if (!isQualifyingDay(data, d)) continue;
      const R = TAX_YEARS[taxYearOf(d)];
      if (!R) { out[d] = { amount: 0, note: 'no SSP rate stored for this tax year' }; continue; }
      const qds = qualifyingDaysInWeek(data, d);
      if (d < SSP_REFORM) {
        if (waiting > 0) { waiting--; out[d] = { amount: 0, note: 'waiting day (rules before 6 April 2026)' }; continue; }
        if (awe.value !== null && R.ssp.lel && awe.value < R.ssp.lel) { out[d] = { amount: 0, note: 'earnings below the lower earnings limit (before 6 April 2026)' }; continue; }
      }
      let weekly = R.ssp.weekly, basis = 'flat rate';
      if (d >= SSP_REFORM && awe.value !== null && awe.value * 0.8 < weekly) { weekly = round2(awe.value * 0.8); basis = '80% of average weekly earnings'; }
      if (weeksPaid + 1 / qds > 28 + 1e-9) { out[d] = { amount: 0, note: '28-week limit reached' }; continue; }
      weeksPaid += 1 / qds;
      out[d] = { amount: weekly / qds, weekly, qds, basis, awe };
    }
  }
  return out;
}

// ---------- One pay period: scheduled (rota only) vs actual (what happened) ----------
export interface PeriodResult { sched: Totals; act: Totals; notes: { assumedPast: number; assumedFuture: number; ssp: string[] }; sspInfo: SspDay | null }
export function computePeriod(data: MyDayData, per: Period): PeriodResult {
  const pay = data.pay, sched = blankTotals(), act = blankTotals();
  const notes = { assumedPast: 0, assumedFuture: 0, ssp: [] as string[] };
  const ssp = sspSchedule(data);
  const today = todayKey();
  for (let d = per.start; d <= per.end; d = shift(d, 1)) {
    const p = plannedFor(data, d);
    if (p && p.works) {
      sched.shifts++;
      const segs: Segs = [[+dtToDate(p.startDt!), +dtToDate(p.endDt!)]];
      payInterval(data, sched, segs, p.breakMin, d, p.type === 'night' ? pay.nightMultiplier : 1, p.type === 'night' ? 'night' : 'day');
    }
    const a = actualFor(data, d);
    if (a.works && (a.status === 'worked' || (a.status === 'custom' && a.paidCustom))) {
      if (a.assumed) { if (d > today) notes.assumedFuture++; else notes.assumedPast++; }
      act.shifts++;
      const s = +dtToDate(a.startDt!), e = +dtToDate(a.endDt!);
      // Take unauthorised absence out of the worked time.
      let segs: Segs = [[s, e]];
      for (const x of data.rota.entries) {
        if (x.kind !== 'unauthorised') continue;
        const xs = +dtToDate(x.start), xe = +dtToDate(x.end), next: Segs = [];
        for (const [a1, a2] of segs) {
          if (xe <= a1 || xs >= a2) { next.push([a1, a2]); continue; }
          if (xs > a1) next.push([a1, xs]);
          if (xe < a2) next.push([xe, a2]);
        }
        segs = next;
      }
      segs.fullMs = e - s;
      const isNight = a.status === 'worked' && !!p && p.type === 'night';
      payInterval(data, act, segs, a.breakMin || 0, d, isNight ? pay.nightMultiplier : 1, isNight ? 'night' : 'day');
    } else if (a.status === 'sick' && !a.assumed) {
      act.sickDays++;
      const v = plannedValue(data, p), s = ssp[d];
      const sspAmt = s ? s.amount : 0;
      if (s && s.amount > 0) act.sspDays++;
      if (s && s.note) notes.ssp.push(`${shortDate(d)}: ${s.note}`);
      act.sickPay += pay.sickPay === 'full' ? Math.max(v.pay, sspAmt) : pay.sickPay === 'percent' ? Math.max(v.pay * pay.sickPercent / 100, sspAmt) : sspAmt;
    } else if (a.status === 'annual_leave' && !a.assumed) {
      const v = plannedValue(data, p);
      if (pay.annualLeavePaid) { act.leaveHours += v.hours; act.leavePay += v.pay; }
    } else if (a.status === 'cancelled' && !a.assumed) {
      if (pay.cancelledPaid) act.otherPay += plannedValue(data, p).pay;
    }
  }
  for (const x of data.rota.entries) {
    if (x.kind !== 'overtime' || x.start.slice(0, 10) < per.start || x.start.slice(0, 10) > per.end) continue;
    payInterval(data, act, [[+dtToDate(x.start), +dtToDate(x.end)]], 0, x.start.slice(0, 10), pay.overtimeMultiplier, 'overtime');
  }
  for (const t of [sched, act]) {
    for (const k of ['basic', 'nightPremium', 'overtimePay', 'bhPremium', 'leavePay', 'sickPay', 'otherPay'] as const) t[k] = round2(t[k]);
    t.gross = round2(t.basic + t.nightPremium + t.overtimePay + t.bhPremium + t.leavePay + t.sickPay + t.otherPay);
    const ty = taxYearOf(per.end);
    t.ded = deductionsFor(pay, t.gross, pay.frequency, ty);
    t.net = round2(t.gross - t.ded.tax - t.ded.ni - t.ded.sl - t.ded.pgl);
  }
  const firstSick = Object.values(ssp).find(v => v.weekly) || null;
  return { sched, act, notes, sspInfo: firstSick };
}
