import { Card } from '../components/Card';
import { CommitInput, Field, Select } from '../components/Field';
import { Summary } from '../components/parts';
import { pad, todayKey } from '../data/dates';
import { money } from '../data/finance';
import { LOAN_LABEL, numIn, parseTaxCode } from '../data/pay';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { LoanPlan, PaySettings } from '../data/types';

const UNDERGRAD: LoanPlan[] = ['plan1', 'plan2', 'plan4', 'plan5'];
const ordinal = (n: number) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
const times = (n: number) => (n === 1 ? 'Normal rate' : `×${n} (${n === 2 ? 'double' : n === 1.5 ? 'time and a half' : 'custom'})`);

// Your rates, folded away at the bottom of Finance. Open it only when something changes (a pay rise, a new tax
// code). Everything else about pay (sick pay, leave, nights) keeps the settings it already has.
export function RatesCard({ pay }: { pay: PaySettings }) {
  const set = <K extends keyof PaySettings>(key: K, value: PaySettings[K]) => update(d => { d.pay[key] = value; });
  const loan = UNDERGRAD.find(k => pay.studentLoans[k]) || 'none';
  const choices = (cur: number) => [...new Set([1, 1.5, 2, cur])].sort((a, b) => a - b);
  const day = Number(pay.periodAnchor.slice(8, 10));
  const summary = [pay.hourlyRate !== null ? `${money(pay.hourlyRate)} an hour` : 'no hourly rate', `tax code ${pay.taxCode}`, `NI ${pay.niCategory}`, loan === 'none' ? 'no student loan' : LOAN_LABEL[loan]].join(' · ');
  return (
    <Card id="ratesCard" aria-label="Rates">
      <details className="group" id="rates">
        <Summary><span><strong className="text-fg">Rates</strong> · {summary}</span></Summary>
        <div className="grid gap-3 pt-2">
          <Field label="Hourly rate (£)" htmlFor="rate-hourly">
            <CommitInput id="rate-hourly" key={'h' + pay.hourlyRate} type="text" inputMode="decimal" defaultValue={pay.hourlyRate ?? ''}
              onCommit={el => {
                const n = numIn(el.value.replace(/[£\s]/g, ''), 0.01, 1000, null);
                if (n === null) { el.value = String(pay.hourlyRate ?? ''); toast('Please enter your hourly rate in pounds, e.g. 13.85.'); return; }
                set('hourlyRate', n);
              }} />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Overtime" htmlFor="rate-overtime">
              <Select id="rate-overtime" value={pay.overtimeMultiplier} onChange={e => set('overtimeMultiplier', Number(e.target.value))}>
                {choices(pay.overtimeMultiplier).map(n => <option key={n} value={n}>{times(n)}</option>)}
              </Select>
            </Field>
            <Field label="Bank holidays" htmlFor="rate-bh">
              <Select id="rate-bh" value={pay.bankHolidayMultiplier} onChange={e => set('bankHolidayMultiplier', Number(e.target.value))}>
                {choices(pay.bankHolidayMultiplier).map(n => <option key={n} value={n}>{times(n)}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Tax code" htmlFor="rate-taxCode">
              <CommitInput id="rate-taxCode" key={'t' + pay.taxCode} type="text" autoCapitalize="characters" defaultValue={pay.taxCode}
                onCommit={el => {
                  const v = el.value.trim().toUpperCase();
                  if (!v) { el.value = pay.taxCode; return; }
                  if (parseTaxCode(v).error) toast(parseTaxCode(v).error!);
                  set('taxCode', v.slice(0, 12));
                }} />
            </Field>
            <Field label="National Insurance" htmlFor="rate-ni">
              <Select id="rate-ni" value={pay.niCategory} onChange={e => set('niCategory', e.target.value === 'X' ? 'X' : 'A')}>
                <option value="A">Category A</option><option value="X">None</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Student loan" htmlFor="rate-loan">
              <Select id="rate-loan" value={loan} onChange={e => update(d => { for (const k of UNDERGRAD) d.pay.studentLoans[k] = k === e.target.value; })}>
                <option value="none">None</option>
                {UNDERGRAD.map(k => <option key={k} value={k}>{LOAN_LABEL[k]}</option>)}
              </Select>
            </Field>
            <Field label="Pay month starts on the" htmlFor="rate-periodDay">
              <Select id="rate-periodDay" value={pay.frequency === 'monthly' ? day : 1}
                onChange={e => update(d => { d.pay.frequency = 'monthly'; d.pay.periodAnchor = todayKey().slice(0, 8) + pad(Number(e.target.value)); })}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{ordinal(n)}</option>)}
              </Select>
            </Field>
          </div>
        </div>
      </details>
    </Card>
  );
}
