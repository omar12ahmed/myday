// Words for a calendar date, for screen readers and the agenda. Ported from the current MyDay.
import { parseKey } from '../data/dates';
import { bankHolidayOn } from '../data/bankHolidays';
import { absenceOn, displayStatus, entriesOn, overlapsOn, STATUS_LABEL } from '../data/rota';
import type { DateKey, MyDayData } from '../data/types';

export const longDate = (d: DateKey) => parseKey(d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const monthLabel = (ym: string) => parseKey(ym + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

// e.g. "Monday 2 November 2026, Day shift 07:00–19:00, bank holiday: Christmas Day, overtime, 1 overlap"
export function describeDay(data: MyDayData, d: DateKey): string {
  const s = displayStatus(data, d), bh = bankHolidayOn(data, d), parts = [longDate(d)];
  if (s.key) parts.push(s.label + (s.p && s.p.works && s.key !== 'off' && s.key === s.p.type ? ` ${s.p.start}–${s.p.end}` : ''));
  if (s.a && !s.a.assumed && s.p && s.key !== s.p.type && s.p.type !== 'off') parts.push(`planned ${STATUS_LABEL[s.p.type] || s.p.label}`);
  if (bh) parts.push(`bank holiday: ${bh}`);
  if (entriesOn(data, d).some(e => e.kind === 'overtime')) parts.push('overtime');
  if (absenceOn(data, d).any) parts.push('unauthorised absence');
  const o = overlapsOn(data, d).length;
  if (o) parts.push(`${o} overlap${o === 1 ? '' : 's'}`);
  return parts.join(', ');
}
