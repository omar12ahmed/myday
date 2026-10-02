// Bank holidays from gov.uk. Ported from the current MyDay (same rules):
// cached in saved data, refreshed weekly, never invented, and they never change shifts or rates
// (the pay view applies your bank holiday multiplier).
import { isDateKey } from './dates';
import { isObj } from './util';
import type { BankHolidayRegion, BankHolidays, DateKey, MyDayData } from './types';

export const BH_URL = 'https://www.gov.uk/bank-holidays.json';
export const BH_REGIONS: Record<BankHolidayRegion, string> = { 'england-and-wales': 'England and Wales', scotland: 'Scotland', 'northern-ireland': 'Northern Ireland' };
const REGION_KEYS = Object.keys(BH_REGIONS) as BankHolidayRegion[];
export type Events = NonNullable<BankHolidays['divisions']>;

export function normalizeBankHolidays(raw: unknown): BankHolidays {
  const b: BankHolidays = { region: 'england-and-wales', fetchedAt: null, divisions: null };
  if (!isObj(raw)) return b;
  if (BH_REGIONS[raw.region as BankHolidayRegion]) b.region = raw.region as BankHolidayRegion;
  const div = raw.divisions;
  if (isObj(div) && REGION_KEYS.every(k => Array.isArray(div[k]))) {
    b.divisions = {} as Events;
    for (const k of REGION_KEYS) b.divisions[k] = (div[k] as unknown[]).filter(e => isObj(e) && isDateKey(e.date) && typeof e.title === 'string').map(e => ({ date: (e as { date: string }).date, title: (e as { title: string }).title }));
    if (typeof raw.fetchedAt === 'string') b.fetchedAt = raw.fetchedAt;
  }
  return b;
}

// gov.uk's feed → { region: [{ date, title }] }. Anything unexpected is rejected, not stored.
export function parseFeed(json: unknown): Events {
  if (!isObj(json)) throw new Error('gov.uk sent something unexpected.');
  const out = {} as Events;
  for (const k of REGION_KEYS) {
    const r = json[k];
    if (!isObj(r) || !Array.isArray(r.events)) throw new Error('gov.uk sent something unexpected.');
    out[k] = r.events.filter(e => isObj(e) && isDateKey(e.date) && typeof e.title === 'string').map(e => ({ date: e.date as string, title: e.title as string }));
  }
  return out;
}

// The bank holiday on date d in the chosen region, or null.
let index: { key: string; divisions: unknown; map: Map<string, string> } | null = null;
export function bankHolidayOn(data: MyDayData, d: DateKey): string | null {
  const b = data.bankHolidays;
  if (!b.divisions) return null;
  const key = b.region + '|' + b.fetchedAt;
  if (!index || index.key !== key || index.divisions !== b.divisions) {
    index = { key, divisions: b.divisions, map: new Map((b.divisions[b.region] || []).map(e => [e.date, e.title])) };
  }
  return index.map.get(d) || null;
}
