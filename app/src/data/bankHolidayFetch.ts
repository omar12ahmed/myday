// Loading bank holidays from gov.uk, with a status the Calendar shows ("Checking gov.uk…", errors).
// Kept apart from bankHolidays.ts because it saves (through the store).
import { BH_URL, parseFeed } from './bankHolidays';
import { dayDiff, localStamp, todayKey } from './dates';
import { update } from './storage';
import { toast } from './toast';
import type { MyDayData } from './types';

// ---------- Loading from gov.uk (status shown on the Calendar) ----------
export interface BhStatus { loading: boolean; error: string | null; tried: boolean }
let status: BhStatus = { loading: false, error: null, tried: false };
const listeners = new Set<() => void>();
const setStatus = (s: Partial<BhStatus>) => { status = { ...status, ...s }; listeners.forEach(fn => fn()); };
export const getBhStatus = () => status;
export function subscribeBhStatus(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }

export async function fetchBankHolidays(manual: boolean) {
  if (status.loading) return;
  setStatus({ loading: true, error: null, tried: true });
  try {
    const res = await fetch(BH_URL);
    if (!res.ok) throw new Error(`gov.uk replied with an error (${res.status}).`);
    let json: unknown;
    try { json = await res.json(); } catch { throw new Error("gov.uk sent something that isn't valid JSON."); }
    const divisions = parseFeed(json);
    update(d => { d.bankHolidays.divisions = divisions; d.bankHolidays.fetchedAt = localStamp(); });
    if (manual) toast('Bank holidays updated from gov.uk.');
    setStatus({ loading: false });
  } catch (e) {
    setStatus({
      loading: false,
      error: e instanceof TypeError
        ? "Couldn't reach gov.uk — you may be offline, or this browser blocked the request."
        : (e instanceof Error && e.message) || 'Something went wrong.',
    });
  }
}

// Load once per visit when the saved copy is missing or more than a week old.
export function maybeFetchBankHolidays(data: MyDayData, canSave: boolean) {
  const b = data.bankHolidays;
  const stale = !b.divisions || !b.fetchedAt || dayDiff(todayKey(), b.fetchedAt.slice(0, 10)) >= 7;
  if (stale && !status.tried && canSave) fetchBankHolidays(false);
}
