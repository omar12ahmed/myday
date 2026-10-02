import { minToDt, nowMin, todayKey } from '../data/dates';
import { uid } from '../data/normalize';

// The form for adding or editing a commitment, while it's open.
export interface CommitForm { key: string; id: string | null; kind: 'work' | 'appointment'; title: string; start: string; end: string; error?: string }

export function newCommitForm(kind: 'work' | 'appointment'): CommitForm {
  // The next whole hour; late in the evening, tomorrow morning instead.
  const k = todayKey();
  let s = Math.ceil((nowMin(k) + 1) / 60) * 60;
  if (s > 1380) s = 1440 + 9 * 60;
  const len = kind === 'work' ? 480 : 60;
  return { key: uid(), id: null, kind, title: kind === 'work' ? 'Work shift' : '', start: minToDt(s, k), end: minToDt(s + len, k) };
}
