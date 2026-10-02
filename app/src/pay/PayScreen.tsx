import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { maybeFetchBankHolidays } from '../data/bankHolidayFetch';
import { BH_REGIONS } from '../data/bankHolidays';
import { shortDate } from '../data/dates';
import { computePeriod, FREQ_LABEL, periodAt, TAX_YEARS, taxYearOf, type Totals } from '../data/pay';
import type { LoanPlan, MyDayData } from '../data/types';
import { PaySettingsCard } from './PaySettingsCard';

const money = (n: number) => n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
const hrs = (h: number) => `${(Math.round(h * 100) / 100).toLocaleString('en-GB')} h`;

// The Pay section: one pay period's hours and pay, scheduled (what the rota says) next to actual (what
// happened), with estimated deductions. Ported from the current MyDay: same calculation, same notes.
export function PayScreen({ data, canSave }: { data: MyDayData; canSave: boolean }) {
  const [offset, setOffset] = useState(0); // pay periods from the current one
  const P = data.pay;
  const per = periodAt(P, offset);
  const r = computePeriod(data, per), S = r.sched, A = r.act;
  const hasRate = P.hourlyRate !== null;

  // Bank holidays: load from gov.uk if the saved copy is missing or over a week old (tried once per visit).
  useEffect(() => { maybeFetchBankHolidays(data, canSave); }, [data, canSave]);

  const m = (t: Totals, k: keyof Totals) => (hasRate ? money(t[k] as number) : '—');
  const d = (t: Totals, k: 'tax' | 'ni' | 'sl' | 'pgl') => (hasRate && t.ded!.ok ? money(-t.ded![k]).replace('-£', '−£') : '—');
  const showIf = (k: keyof Totals) => !!(S[k] || A[k]);
  const anyLoan = (Object.keys(P.studentLoans) as LoanPlan[]).some(k => k !== 'postgrad' && P.studentLoans[k]);

  const bh = data.bankHolidays;
  const notes: string[] = [];
  if (!data.rota.patterns.length) notes.push('No shift pattern yet — set one up in Calendar to see scheduled hours.');
  if (!hasRate) notes.push('Add your hourly rate in Pay settings to see money as well as hours.');
  if (r.notes.assumedPast) notes.push(`${r.notes.assumedPast} past shift${r.notes.assumedPast === 1 ? '' : 's'} not marked yet — counted as worked as planned.`);
  if (r.notes.assumedFuture) notes.push(`${r.notes.assumedFuture} upcoming shift${r.notes.assumedFuture === 1 ? '' : 's'} included as planned, so "actual" will change as the period goes on.`);
  notes.push(bh.divisions
    ? `Bank holidays: ${BH_REGIONS[bh.region]}, from gov.uk (updated ${bh.fetchedAt ? shortDate(bh.fetchedAt.slice(0, 10)) : 'date unknown'}). Hours on them are paid at ×${P.bankHolidayMultiplier}${P.bankHolidayHours === 'clock' ? ' (hours falling on the day)' : ' (whole shift starting on the day)'}.`
    : "Bank holidays aren't loaded, so no bank holiday pay is included. Update them in Calendar.");
  if (A.sickDays) {
    notes.push(P.sickPay === 'ssp'
      ? "Sick days are paid Statutory Sick Pay: from 6 April 2026 it's paid from the first full day off sick, at £123.25 a week or 80% of average weekly earnings if that's lower, split across the days you normally work that week."
      : P.sickPay === 'full' ? 'Sick days are paid at full normal pay (company sick pay), never less than SSP.' : `Sick days are paid at ${P.sickPercent}% of normal pay, never less than SSP.`);
    const si = r.sspInfo;
    if (si) notes.push(`SSP used: ${money(si.weekly!)} a week (${si.basis}${si.awe && si.awe.value !== null ? `; average weekly earnings ${money(si.awe.value)}, ${si.awe.source}` : '; average weekly earnings unknown, so the flat rate is used'}).`);
    for (const n of r.notes.ssp) notes.push('SSP — ' + n);
  }
  const ty = TAX_YEARS[taxYearOf(per.end)];
  for (const n of A.ded!.notes) if (!notes.includes(n)) notes.push(n);
  if (ty) notes.push(`Deductions are estimates using ${ty.label} rates from gov.uk and your tax code ${P.taxCode}, worked out for this period on its own. Your payslip may differ slightly.`);

  const row = (key: string, label: string, sv: string | number, av: string | number, kind?: 'strong' | 'minus') => (
    <tr data-row={key} className={kind === 'strong' ? 'font-bold border-t border-outline' : kind === 'minus' ? 'text-fg-2' : ''}>
      <th scope="row" className="text-left font-normal py-1.5 pr-3">{label}</th>
      <td className="sched text-right py-1.5 pl-3 tabular-nums whitespace-nowrap">{sv}</td>
      <td className="act text-right py-1.5 pl-3 tabular-nums whitespace-nowrap">{av}</td>
    </tr>
  );
  const navBtn = 'size-12 flex-none rounded-full grid place-items-center bg-surface-2 border border-outline cursor-pointer';

  return (
    <div className="pay-layout flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:gap-x-6 lg:items-start">
      <div className="min-w-0">
        <Card aria-labelledby="payPeriod">
          <div className="flex items-center justify-between gap-2">
            <button type="button" className={navBtn} data-action="pay-prev" aria-label="Previous pay period" onClick={() => setOffset(o => o - 1)}><ChevronLeft size={24} aria-hidden="true" /></button>
            <div className="text-center">
              <h2 id="payPeriod" className="cal-title m-0 text-[19px]" aria-live="polite">{shortDate(per.start)} – {shortDate(per.end)}</h2>
              <p className="text-[15px] text-fg-2 m-0">{FREQ_LABEL[P.frequency]} pay period{offset === 0 ? ' · this period' : ''}</p>
            </div>
            <button type="button" className={navBtn} data-action="pay-next" aria-label="Next pay period" onClick={() => setOffset(o => o + 1)}><ChevronRight size={24} aria-hidden="true" /></button>
          </div>
          {offset !== 0 && <Button inline variant="ghost" className="w-full mt-3" data-action="pay-now" onClick={() => setOffset(0)}>Back to this period</Button>}
        </Card>
        <Card aria-labelledby="hours-h">
          <h2 id="hours-h">Hours and pay</h2>
          <p className="text-[15px] text-fg-2"><strong>Scheduled</strong> is what your rota says. <strong>Actual</strong> is what happened: sickness, leave, absence, overtime and changed hours. All money figures are estimates.</p>
          <div className="overflow-x-auto">
            <table className="pay-table w-full border-collapse text-[15px]">
              <thead><tr className="text-sm text-fg-2"><th scope="col"><span className="sr-only">Item</span></th><th scope="col" className="text-right font-semibold pb-1">Scheduled</th><th scope="col" className="text-right font-semibold pb-1">Actual</th></tr></thead>
              <tbody>
                {row('shifts', 'Shifts', S.shifts, A.shifts)}
                {row('hours', 'Paid hours', hrs(S.paidHours), hrs(A.paidHours))}
                {showIf('nightHours') && row('nightHours', 'of which night', hrs(S.nightHours), hrs(A.nightHours))}
                {row('overtimeHours', 'Overtime hours', hrs(S.overtimeHours), hrs(A.overtimeHours))}
                {row('bhHours', 'Bank holiday hours', hrs(S.bhHours), hrs(A.bhHours))}
                {showIf('leaveHours') && row('leaveHours', 'Annual leave hours', hrs(S.leaveHours), hrs(A.leaveHours))}
                {showIf('sickDays') && row('sickDays', 'Sick days (SSP days)', S.sickDays, `${A.sickDays} (${A.sspDays})`)}
                <tr aria-hidden="true"><td colSpan={3} className="h-2" /></tr>
                {row('basic', 'Basic pay', m(S, 'basic'), m(A, 'basic'))}
                {showIf('nightPremium') && row('nightPremium', 'Night premium', m(S, 'nightPremium'), m(A, 'nightPremium'))}
                {row('overtimePay', 'Overtime', m(S, 'overtimePay'), m(A, 'overtimePay'))}
                {row('bhPremium', 'Bank holiday extra', m(S, 'bhPremium'), m(A, 'bhPremium'))}
                {showIf('leavePay') && row('leavePay', 'Annual leave pay', m(S, 'leavePay'), m(A, 'leavePay'))}
                {showIf('sickPay') && row('sickPay', P.sickPay === 'ssp' ? 'Statutory Sick Pay' : 'Sick pay', m(S, 'sickPay'), m(A, 'sickPay'))}
                {showIf('otherPay') && row('otherPay', 'Other paid time', m(S, 'otherPay'), m(A, 'otherPay'))}
                {row('gross', 'Gross pay', m(S, 'gross'), m(A, 'gross'), 'strong')}
                {row('tax', 'Income Tax (est.)', d(S, 'tax'), d(A, 'tax'), 'minus')}
                {row('ni', 'National Insurance (est.)', d(S, 'ni'), d(A, 'ni'), 'minus')}
                {anyLoan && row('sl', 'Student loan (est.)', d(S, 'sl'), d(A, 'sl'), 'minus')}
                {P.studentLoans.postgrad && row('pgl', 'Postgraduate loan (est.)', d(S, 'pgl'), d(A, 'pgl'), 'minus')}
                {row('net', 'Take-home (est.)', hasRate && A.ded!.ok ? money(S.net!) : '—', hasRate && A.ded!.ok ? money(A.net!) : '—', 'strong')}
              </tbody>
            </table>
          </div>
          <ul className="pay-notes list-disc pl-5 mt-3 mb-0 grid gap-1.5 text-[15px] text-fg-2">{notes.map(n => <li key={n}>{n}</li>)}</ul>
        </Card>
      </div>
      <aside className="min-w-0 pb-10" aria-label="Pay settings"><PaySettingsCard data={data} onPeriodsChanged={() => setOffset(0)} /></aside>
    </div>
  );
}
