import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../components/Card';
import { LinkButton } from '../components/parts';
import { money, periodLabel, type WorkPay } from '../data/finance';
import { LOAN_LABEL } from '../data/pay';
import type { LoanPlan, PaySettings } from '../data/types';

const Row = ({ id, label, value, strong, minus }: { id: string; label: string; value: string; strong?: boolean; minus?: boolean }) => (
  <div data-row={id} className={`flex justify-between gap-3 py-1.5 ${strong ? 'font-bold text-[17px] border-t border-outline mt-1 pt-2.5' : ''} ${minus ? 'text-fg-2 text-[15px] pl-3' : ''}`}>
    <span>{label}</span><span className="tabular-nums whitespace-nowrap">{value}</span>
  </div>
);

// Work pay for one month: worked out from the shifts on your Calendar (including overtime and cancelled
// shifts), so it changes by itself when they do.
export function WorkPayCard({ w, pay, offset, onMove }: { w: WorkPay; pay: PaySettings; offset: number; onMove: (n: number) => void }) {
  const navBtn = 'size-12 flex-none rounded-full grid place-items-center bg-surface-2 border border-outline cursor-pointer';
  const known = w.hasRate && w.deductionsOk;
  const m = (n: number) => (w.hasRate ? money(n) : '—');
  const d = (n: number) => (known ? money(n ? -n : 0) : '—');
  const loans = (Object.keys(pay.studentLoans) as LoanPlan[]).filter(k => k !== 'postgrad' && pay.studentLoans[k]);
  const shiftsLabel = w.when === 'future' ? 'Shifts planned' : 'Shifts worked';
  const shiftsValue = w.when === 'future' ? String(w.toCome) : String(w.worked);
  return (
    <Card aria-labelledby="workPay-h" id="workPay">
      <h2 id="workPay-h">Work pay</h2>
      <div className="flex items-center justify-between gap-2">
        <button type="button" className={navBtn} data-action="fin-prev" aria-label="Previous month" onClick={() => onMove(offset - 1)}><ChevronLeft size={24} aria-hidden="true" /></button>
        <div className="text-center">
          <p id="finPeriod" className="text-[19px] font-bold m-0" aria-live="polite">{periodLabel(w)}</p>
          <p className="text-sm text-fg-2 m-0">{offset === 0 ? 'This month' : 'Pay month'}</p>
        </div>
        <button type="button" className={navBtn} data-action="fin-next" aria-label="Next month" onClick={() => onMove(offset + 1)}><ChevronRight size={24} aria-hidden="true" /></button>
      </div>
      {offset !== 0 && <div className="text-center"><LinkButton data-action="fin-now" onClick={() => onMove(0)}>Back to this month</LinkButton></div>}

      <div className="mt-3 text-[16px]">
        <Row id="shifts" label={shiftsLabel} value={shiftsValue} />
        {w.when === 'current' && w.toCome > 0 && <p data-row="toCome" className="text-sm text-fg-2 m-0 -mt-1 mb-1">+ {w.toCome} more planned this month (included below)</p>}
        {w.overtime > 0 && <p data-row="overtime" className="text-sm text-fg-2 m-0 -mt-0.5 mb-1">including {w.overtime} overtime</p>}
        <Row id="gross" label="Gross pay" value={m(w.gross)} />
        <Row id="tax" label="Income Tax" value={w.taxOk ? d(w.tax) : '—'} minus />
        <Row id="ni" label="National Insurance" value={d(w.ni)} minus />
        {loans.length > 0 && <Row id="sl" label={`Student loan (${loans.map(k => LOAN_LABEL[k]).join(', ')})`} value={d(w.sl)} minus />}
        {pay.studentLoans.postgrad && <Row id="pgl" label="Postgraduate loan" value={d(w.pgl)} minus />}
        <Row id="net" label="Take-home (est.)" value={known && w.taxOk ? money(w.net) : '—'} strong />
      </div>
      <ul className="fin-notes list-none p-0 mt-2.5 mb-0 grid gap-1 text-sm text-fg-2">
        {w.notes.map(n => <li key={n}>{n}</li>)}
        {w.taxYear && <li>Estimate for this month on its own, using {w.taxYear} tax rules from gov.uk. Your payslip may differ slightly.</li>}
      </ul>
    </Card>
  );
}
