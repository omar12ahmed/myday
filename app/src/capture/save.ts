// What Capture can do with something you've typed — each only when you choose it, through the normal save path:
//   a note        to the Notes Inbox (or a collection)
//   an appointment on the Calendar, like one added there (30 minutes unless an end time was given)
//   a task        to your queue: a one-off task MyDay fits into a coming day (a date it mentions is kept in its name;
//                 tasks with their own dates arrive with the Tasks tab)
import { keyOf, pad, shortDate, todayKey } from '../data/dates';
import { addNote } from '../data/notes';
import { sortQueue } from '../data/plan';
import { updateSaved } from '../data/storage';
import type { Category, DateKey } from '../data/types';
import { uid } from '../data/util';

export function saveNote(text: string, collectionId = ''): boolean {
  return updateSaved(d => { addNote(d.notes, collectionId, text.trim()); }) === 'saved';
}

// "HH:MM" plus some minutes, as a date and a time (may run past midnight).
function later(date: DateKey, time: string, minutes: number): { date: DateKey; time: string } {
  const t = new Date(`${date}T${time}`);
  t.setMinutes(t.getMinutes() + minutes);
  return { date: keyOf(t), time: `${pad(t.getHours())}:${pad(t.getMinutes())}` };
}
export function appointmentEnd(date: DateKey, time: string, endTime: string | null): { date: DateKey; time: string } {
  if (endTime && endTime > time) return { date, time: endTime };
  return later(date, time, 30);
}
export function addAppointment(title: string, date: DateKey, time: string, endTime: string | null): boolean {
  const end = appointmentEnd(date, time, endTime);
  return updateSaved(d => { d.commitments.push({ id: 'c' + uid(), kind: 'appointment', title: title.trim().slice(0, 120) || 'Appointment', start: `${date}T${time}`, end: `${end.date}T${end.time}` }); }) === 'saved';
}

export const taskName = (title: string, date: DateKey | null) => (date ? `${title} — ${date === todayKey() ? 'today' : shortDate(date)}` : title);
export function addQueueTask(title: string, category: Category, minutes: number, date: DateKey | null): boolean {
  const name = taskName(title.trim(), date).slice(0, 120);
  if (!name) return false;
  return updateSaved(d => {
    d.queue.push({ qid: uid(), taskId: null, category, title: name, minutes: Math.max(5, Math.min(600, Math.round(minutes))), queuedOn: todayKey(), sourceUid: null });
    sortQueue(d.queue);
  }) === 'saved';
}
