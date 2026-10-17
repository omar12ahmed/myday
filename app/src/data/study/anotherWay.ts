// An explanation "another way" that you kept on a revision card (AI roles step 4): the words, the model that wrote
// them, and the day you kept it. Kept by every version from 1.20.2 — on your concepts (both versions), Cybersecurity
// checks and Arabic cards — so going back never loses it. Anything unexpected and it's left off; the card stays.
import { isDateKey } from '../dates';
import { isObj } from '../util';
import type { AnotherWay, MyDayData } from '../types';

export const ANOTHER_WAY_CHARS = 1500;
export function cleanAnotherWay(raw: unknown): AnotherWay | null {
  if (!isObj(raw) || typeof raw.text !== 'string' || !raw.text.trim() || !isDateKey(raw.on)) return null;
  return { text: raw.text.trim().slice(0, ANOTHER_WAY_CHARS), by: typeof raw.by === 'string' ? raw.by.trim().slice(0, 60) : '', on: raw.on };
}

// The explanation kept on a revision card, whichever kind it is: one of your concepts, a Cybersecurity check or an
// Arabic card (their ids never overlap).
type Holder = { id: string; anotherWay?: AnotherWay };
const holderOf = (d: MyDayData, id: string): Holder | undefined =>
  d.study.concepts.find(c => c.id === id) ?? d.cybersecurity.cards.find(c => c.id === id) ?? d.arabic.cards.find(c => c.id === id);
export const anotherWayOf = (d: MyDayData, id: string): AnotherWay | null => holderOf(d, id)?.anotherWay ?? null;
// Keeps (or with null, removes) the explanation on that card; one per card, so keeping another replaces it.
export function keepAnotherWay(d: MyDayData, id: string, aw: AnotherWay | null): boolean {
  const h = holderOf(d, id);
  if (!h) return false;
  if (!aw) { if (!h.anotherWay) return false; delete h.anotherWay; return true; }
  const clean = cleanAnotherWay(aw);
  if (!clean) return false;
  h.anotherWay = clean;
  return true;
}
