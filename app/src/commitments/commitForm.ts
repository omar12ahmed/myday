// Commitments (work shifts and appointments): the open form, and saving it. Used by Today's context
// card and by the Calendar. Same rules and wording as the current MyDay.
import { dtToMin, isDateTime, minToDt, nowMin, todayKey } from '../data/dates';
import { uid } from '../data/util';
import { KIND_LABEL } from '../data/schedule';
import type { Commitment, MyDayData } from '../data/types';

// The form for adding or editing a commitment, while it's open.
export interface CommitForm { key: string; id: string | null; kind: 'work' | 'appointment'; title: string; start: string; end: string; error?: string }

// A new form starting at the next whole hour (late in the evening: tomorrow morning instead).
export function newCommitForm(kind: 'work' | 'appointment'): CommitForm {
  const k = todayKey();
  let s = Math.ceil((nowMin(k) + 1) / 60) * 60;
  if (s > 1380) s = 1440 + 9 * 60;
  const len = kind === 'work' ? 480 : 60;
  return { key: uid(), id: null, kind, title: kind === 'work' ? 'Work shift' : '', start: minToDt(s, k), end: minToDt(s + len, k) };
}

// A new appointment on a chosen date, 09:00–10:00 (from the Calendar).
export const appointmentOn = (d: string): CommitForm => ({ key: uid(), id: null, kind: 'appointment', title: '', start: d + 'T09:00', end: d + 'T10:00' });

// Why the form can't be saved, or null if it can.
export function checkCommitment(f: CommitForm): string | null {
  if (!isDateTime(f.start) || !isDateTime(f.end)) return 'Please add a start and an end, each with a date and time.';
  if (f.end <= f.start) return 'The end needs to be after the start. For a night shift, set the end to the next day.';
  if (dtToMin(f.end, f.start.slice(0, 10)) - dtToMin(f.start, f.start.slice(0, 10)) > 7 * 1440) return "That's longer than a week — please check the dates.";
  return null;
}

// Adds or updates the commitment in the draft (call checkCommitment first).
export function applyCommitment(data: MyDayData, f: CommitForm) {
  const kind = f.kind === 'work' ? 'work' : 'appointment';
  const title = f.title.trim() || KIND_LABEL[kind];
  const c = f.id ? data.commitments.find(x => x.id === f.id) : null;
  if (c) Object.assign(c, { kind, title, start: f.start, end: f.end });
  else data.commitments.push({ id: 'c' + uid(), kind, title, start: f.start, end: f.end });
  data.commitments.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}

// The form's contents for editing an existing commitment.
export const editForm = (c: Commitment): CommitForm => ({ key: uid(), id: c.id, kind: c.kind, title: c.title, start: c.start, end: c.end });
