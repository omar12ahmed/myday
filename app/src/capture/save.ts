// What Capture can do with something you've typed — each only when you choose it, through the normal save path:
//   a note        to the Notes Inbox (or a collection) — and to a project, when it clearly belongs to one (with Undo)
//   an appointment on the Calendar, like one added there (30 minutes unless an end time was given)
//   a task        to Tasks (on Today), with the date and time it mentions (a task due today then shows on Today)
//   a project     from an idea (see CaptureSheet)
import { keyOf, pad } from '../data/dates';
import { addNote } from '../data/notes';
import { addProject, linkAppointment, projectFromText } from '../data/projects';
import { connect } from '../data/understand';
import { updateSaved } from '../data/storage';
import { addTask } from '../data/tasks';
import type { Category, DateKey } from '../data/types';
import { uid } from '../data/util';

// Returns false if it couldn't be saved; otherwise the project it was connected to straight away (when it clearly
// belongs to one — see data/understand.ts), or null.
export function saveNote(text: string, collectionId = ''): false | string | null {
  let project: string | null = null;
  const r = updateSaved(d => {
    const id = addNote(d.notes, collectionId, text.trim());
    connect(d);
    const n = d.notes.items.find(x => x.id === id);
    project = n?.projectId ? d.projects.items.find(p => p.id === n.projectId)?.title ?? null : null;
  });
  return r === 'saved' ? project : false;
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
// With a project, the appointment is also listed on that project (the Calendar's record itself is the same as ever).
export function addAppointment(title: string, date: DateKey, time: string, endTime: string | null, projectId: string | null = null): boolean {
  const end = appointmentEnd(date, time, endTime);
  return updateSaved(d => {
    const id = 'c' + uid();
    d.commitments.push({ id, kind: 'appointment', title: title.trim().slice(0, 120) || 'Appointment', start: `${date}T${time}`, end: `${end.date}T${end.time}` });
    if (projectId) linkAppointment(d, projectId, id);
  }) === 'saved';
}

export function addCapturedTask(title: string, category: Category, date: DateKey | null, time: string | null): boolean {
  let ok = false;
  const r = updateSaved(d => { ok = addTask(d.tasks, { title, category, due: date, time }) !== null; if (!ok) return false; });
  return ok && r === 'saved';
}

// A new project from what you typed: the first line is its name, the rest what it's about. Returns its id.
export function startProject(text: string): string | null {
  const { title, summary } = projectFromText(text);
  let id: string | null = null;
  const r = updateSaved(d => { id = addProject(d, title, summary); if (!id) return false; });
  return r === 'saved' ? id : null;
}
