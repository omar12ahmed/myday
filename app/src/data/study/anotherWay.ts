// An explanation "another way" that you kept on a revision card (AI roles step 4): the words, the model that wrote
// them, and the day you kept it. Kept by every version from 1.20.2 — on your concepts (both versions), Cybersecurity
// checks and Arabic cards — so going back never loses it. Anything unexpected and it's left off; the card stays.
import { isDateKey } from '../dates';
import { isObj } from '../util';
import type { AnotherWay } from '../types';

export const ANOTHER_WAY_CHARS = 1500;
export function cleanAnotherWay(raw: unknown): AnotherWay | null {
  if (!isObj(raw) || typeof raw.text !== 'string' || !raw.text.trim() || !isDateKey(raw.on)) return null;
  return { text: raw.text.trim().slice(0, ANOTHER_WAY_CHARS), by: typeof raw.by === 'string' ? raw.by.trim().slice(0, 60) : '', on: raw.on };
}
