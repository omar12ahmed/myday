import { Card } from '../components/Card';
import { CommitInput, Field, Select } from '../components/Field';
import { isDateKey } from '../data/dates';
import { FREQ_LABEL, LOAN_LABEL, numIn, parseTaxCode } from '../data/pay';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { LoanPlan, MyDayData, PayFrequency, PaySettings } from '../data/types';

type NumKey = 'hourlyRate' | 'nightMultiplier' | 'overtimeMultiplier' | 'bankHolidayMultiplier' | 'sickPercent' | 'averageWeeklyEarnings';
const LIMITS: Record<NumKey, [number, number]> = { hourlyRate: [0, 1000], nightMultiplier: [1, 5], overtimeMultiplier: [1, 5], bankHolidayMultiplier: [1, 5], sickPercent: [0, 100], averageWeeklyEarnings: [0, 100000] };

// Your own pay rules. Nothing here changes by itself. Same choices and checks as the current MyDay.
export function PaySettingsCard({ data, onPeriodsChanged }: { data: MyDayData; onPeriodsChanged: () => void }) {
  const P = data.pay;
  const set = <K extends keyof PaySettings>(key: K, value: PaySettings[K]) => update(d => { d.pay[key] = value; });

  function saveNumber(el: HTMLInputElement, key: NumKey) {
    const [lo, hi] = LIMITS[key];
    if (el.value === '' && (key === 'hourlyRate' || key === 'averageWeeklyEarnings')) { set(key, null); return; }
    const n = numIn(el.value, lo, hi, null);
    if (n === null) { el.value = String(P[key] ?? ''); toast(`Please use a number from ${lo} to ${hi}.`); return; }
    set(key, n);
  }
  const num = (key: NumKey, label: string, step: string, extra: { placeholder?: string } = {}) => (
    <Field label={label} htmlFor={`pay-${key}`}>
      <CommitInput id={`pay-${key}`} key={key + String(P[key])} type="number" inputMode="decimal" data-pay={key} defaultValue={P[key] ?? ''}
        min={LIMITS[key][0]} max={LIMITS[key][1]} step={step} placeholder={extra.placeholder} onCommit={el => saveNumber(el, key)} />
    </Field>
  );
  const check = (key: string, label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <label className="check flex items-center gap-2.5 min-h-11 text-[15px]">
      <input type="checkbox" data-pay={key} className="size-[22px] accent-primary flex-none" checked={checked} onChange={e => onChange(e.target.checked)} /> {label}
    </label>
  );

  return (
    <Card aria-labelledby="pay-settings-h">
      <h2 id="pay-settings-h">Pay settings</h2>
      <p className="text-[15px] text-fg-2">These are your own pay rules. Nothing here changes automatically.</p>
      <div className="grid gap-3">
        {num('hourlyRate', 'Hourly rate (£)', '0.01', { placeholder: 'e.g. 12.60' })}
        <div className="grid grid-cols-2 gap-2.5">{num('nightMultiplier', 'Night shift ×', '0.05')}{num('overtimeMultiplier', 'Overtime ×', '0.05')}</div>
        <div className="grid grid-cols-2 gap-2.5">
          {num('bankHolidayMultiplier', 'Bank holiday ×', '0.05')}
          <Field label="Bank holiday hours" htmlFor="pay-bankHolidayHours">
            <Select id="pay-bankHolidayHours" data-pay="bankHolidayHours" value={P.bankHolidayHours} onChange={e => set('bankHolidayHours', e.target.value === 'shift' ? 'shift' : 'clock')}>
              <option value="clock">On the day</option><option value="shift">Whole shift</option>
            </Select>
          </Field>
        </div>
      </div>
      <p className="text-[15px] text-fg-2 mt-2">Where premiums overlap (e.g. overtime on a bank holiday), the higher rate applies — they don't stack.</p>
      {check('annualLeavePaid', 'Annual leave is paid (normal pay for the planned shift)', P.annualLeavePaid, v => set('annualLeavePaid', v))}
      {check('cancelledPaid', 'Cancelled shifts are still paid', P.cancelledPaid, v => set('cancelledPaid', v))}
      <div className="grid gap-3 mt-2">
        <Field label="Sick pay" htmlFor="pay-sickPay">
          <Select id="pay-sickPay" data-pay="sickPay" value={P.sickPay} onChange={e => set('sickPay', e.target.value as PaySettings['sickPay'])}>
            <option value="ssp">Statutory Sick Pay only</option><option value="full">Full pay (company sick pay)</option><option value="percent">Percentage of normal pay</option>
          </Select>
        </Field>
        {P.sickPay === 'percent' && num('sickPercent', 'Percentage of normal pay', '1')}
        {num('averageWeeklyEarnings', 'Average weekly earnings for SSP (£, optional)', '0.01', { placeholder: 'Estimated from your rota if blank' })}
      </div>

      <h4>Pay period</h4>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Paid" htmlFor="pay-frequency">
          <Select id="pay-frequency" data-pay="frequency" value={P.frequency} onChange={e => { set('frequency', e.target.value as PayFrequency); onPeriodsChanged(); }}>
            {(Object.keys(FREQ_LABEL) as PayFrequency[]).map(f => <option key={f} value={f}>{FREQ_LABEL[f]}</option>)}
          </Select>
        </Field>
        <Field label={P.frequency === 'monthly' ? 'A period starts on (day used)' : 'A period starts on'} htmlFor="pay-periodAnchor">
          <CommitInput id="pay-periodAnchor" key={'pa' + P.periodAnchor} type="date" data-pay="periodAnchor" defaultValue={P.periodAnchor}
            onCommit={el => { if (!isDateKey(el.value)) { el.value = P.periodAnchor; return; } set('periodAnchor', el.value); onPeriodsChanged(); }} />
        </Field>
      </div>

      <h4>Deductions</h4>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Tax code" htmlFor="pay-taxCode">
          <CommitInput id="pay-taxCode" key={'tc' + P.taxCode} type="text" data-pay="taxCode" defaultValue={P.taxCode} autoCapitalize="characters"
            onCommit={el => {
              const v = el.value.trim().toUpperCase();
              if (!v || parseTaxCode(v).error) toast(v ? parseTaxCode(v).error! : 'Please enter a tax code.');
              set('taxCode', v || '1257L');
            }} />
        </Field>
        <Field label="National Insurance" htmlFor="pay-niCategory">
          <Select id="pay-niCategory" data-pay="niCategory" value={P.niCategory} onChange={e => set('niCategory', e.target.value === 'X' ? 'X' : 'A')}>
            <option value="A">Category A (standard)</option><option value="X">None (e.g. over State Pension age)</option>
          </Select>
        </Field>
      </div>
      <p className="text-sm text-fg-2 mt-3 mb-1.5">Student loans</p>
      <div className="loans grid grid-cols-2 gap-x-2.5">
        {(Object.keys(P.studentLoans) as LoanPlan[]).map(k => check('sl-' + k, LOAN_LABEL[k], P.studentLoans[k], v => update(d => { d.pay.studentLoans[k] = v; })))}
      </div>
    </Card>
  );
}
