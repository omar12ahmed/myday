import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Note } from '../components/parts';
import { maybeFetchBankHolidays } from '../data/bankHolidayFetch';
import { expensesTotal, money, setYourRates, workPay } from '../data/finance';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';
import { ExpensesCard } from './ExpensesCard';
import { OwedCard } from './OwedCard';
import { RatesCard } from './RatesCard';
import { WorkPayCard } from './WorkPayCard';

// The Finance section (it replaced Pay): this month's work pay, what's left after monthly expenses,
// money owed either way, and your rates folded away at the bottom.
export function FinanceScreen({ data, canSave }: { data: MyDayData; canSave: boolean }) {
  const [offset, setOffset] = useState(0); // months from this one
  const f = data.finance;
  const w = workPay(data, offset);

  // The first time Finance opens, your rates are saved into the pay settings (once).
  useEffect(() => {
    if (f.ratesSetOn || !canSave) return;
    if (update(d => { if (d.finance.ratesSetOn) return false; setYourRates(d); })) {
      toast('Your rates are set: £13.85 an hour, bank holidays ×2, tax code 1241T, NI A, Plan 2. Change them under "Rates".');
    }
  }, [f.ratesSetOn, canSave]);
  // Bank holidays: load from gov.uk if the saved copy is missing or over a week old (tried once per visit).
  useEffect(() => { maybeFetchBankHolidays(data, canSave); }, [data, canSave]);

  const exp = expensesTotal(f);
  const known = w.hasRate && w.deductionsOk && w.taxOk;
  const left = Math.round((w.net - exp) * 100) / 100;

  return (
    <div className="finance-layout flex flex-col lg:grid lg:grid-cols-2 lg:gap-x-6 lg:items-start">
      <div className="min-w-0">
        <WorkPayCard w={w} pay={data.pay} offset={offset} onMove={setOffset} />
        <Card aria-labelledby="left-h" id="leftOver" tone={known && left < 0 ? 'notice' : 'plain'}>
          <h2 id="left-h">Left over (est.)</h2>
          <div className="text-[16px]">
            <div data-row="takeHome" className="flex justify-between gap-3 py-1"><span>Take-home (est.)</span><span className="tabular-nums">{known ? money(w.net) : '—'}</span></div>
            <div data-row="expenses" className="flex justify-between gap-3 py-1"><span>Monthly expenses</span><span className="tabular-nums">{money(-exp)}</span></div>
            <div data-row="left" className="flex justify-between gap-3 pt-2.5 mt-1 border-t border-outline font-bold text-[19px]"><span>Left over</span><span className="tabular-nums">{known ? money(left) : '—'}</span></div>
          </div>
          {known && left < 0 && <p className="text-[15px] mt-2 mb-0">Expenses are more than this month's estimated take-home.</p>}
          <Note className="mt-2 mb-0 text-sm">Money owed isn't included.</Note>
        </Card>
      </div>
      <div className="min-w-0 pb-2">
        <ExpensesCard f={f} />
        <OwedCard f={f} />
        <RatesCard pay={data.pay} />
      </div>
    </div>
  );
}
