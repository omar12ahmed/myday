// The shape of "Ask MyDay" (the AI design's step 1, 17 Oct 2026): limits, what's sent and what comes back — kept apart
// from ask.ts (the instructions), so the app can load it without them. The model only proposes; the app checks every
// proposal against your own data again (app/src/ai/ask.ts) and saves nothing until you tap.
export const ASK_LIMITS = {
  textChars: 600,          // what you typed
  followUpChars: 300,      // one "Not quite: …"
  previousChars: 1500,     // the answer you're following up on, as it was shown
  list: 20,                // items in any list of the page's context (tasks, projects, notes, appointments)
  titleChars: 120,         // any title sent or proposed
  summaryChars: 600,       // a project's summary
  noteTextChars: 3000,     // the open note's text (never a private one)
  projectNotesChars: 3000, // a project's notes' text together (only with "AI help with notes" on)
  taskNotesChars: 500,
  items: 8,                // things proposed at most
  itemTextChars: 1000,     // a proposed note's text or a project's summary
  messageChars: 700,       // the answer or the sentence above the proposals
  minMinutes: 5, maxMinutes: 120,
  // A course's outline (Study → a course): sent in full up to these sizes; up to 12 study tasks proposed for it.
  courseModules: 12, courseSections: 30, courseTasks: 80, studyItems: 12,
};
export const ASK_PAGES = ['today', 'tasks', 'task', 'calendar', 'projects', 'project', 'notes', 'note', 'study', 'course', 'health', 'finance', 'other'] as const;
export type AskPage = typeof ASK_PAGES[number];
export const ASK_KINDS = ['add', 'steps', 'answer', 'cannot'] as const;
export const ASK_ITEM_TYPES = ['task', 'note', 'appointment', 'project', 'study-task'] as const;
export const ASK_CATEGORIES = ['learning', 'admin', 'health'] as const;
export const ASK_STAGES = ['capture', 'understand', 'organise', 'explore', 'decide', 'act', 'reflect'] as const;

interface Ref { id: string; title: string }
// The slice of the page you're on (only what's listed here is ever sent; the app shows it before you tap).
export interface AskPageContext {
  projects?: Ref[];                                                     // open projects' names (to file things into)
  today?: { energy: number | null; freeMinutes: number | null; plan: { id: string; title: string; minutes: number; done: boolean }[]; dueToday: Ref[] };
  study?: { course: Ref | null; nextTask: Ref | null; topics: string[]; revisionDue: number; energy?: number | null; freeMinutes?: number | null }; // energy and free time today, to fit a session to them
  project?: { id: string; title: string; summary: string; stage: typeof ASK_STAGES[number]; tasks: (Ref & { done: boolean })[]; notes: string[]; notesText?: string };
  note?: { id: string; title: string; text: string };
  task?: { id: string; title: string; due: string | null; minutes: number; notes: string };
  calendar?: { day: string; appointments: { title: string; time: string }[] };
  // A course on your Study roadmap, as an outline (titles, lengths, kinds, done or not — no links, notes or concepts).
  course?: { id: string; title: string; minutes: number; modules: { id: string; title: string; sections: { id: string; title: string; tasks: { id: string; title: string; minutes: number; kind: 'learn' | 'practical'; done: boolean }[] }[] }[] };
}

export interface AskContext {
  version: 1; action: 'ask';
  date: string;      // YYYY-MM-DD on this device
  weekday: string;   // e.g. "Saturday"
  time: string;      // HH:MM now
  page: AskPage;
  text: string;      // what you typed
  followUp?: { previous: string; text: string }; // one follow-up: the answer as it was shown, and what you added
  context: AskPageContext;
}

// What the model returns (JSON only). The app checks it all again.
export interface AskItem {
  type: typeof ASK_ITEM_TYPES[number];
  title: string;
  date?: string | null; time?: string | null;  // a task's due date (and time); an appointment's date and time
  minutes?: number | null;                      // a task's length
  category?: typeof ASK_CATEGORIES[number] | null;
  projectId?: string | null;                    // one of the projects sent
  text?: string | null;                         // a note's text, or a project's summary
  // A study task for the course on the page: into one of its sections (sectionId), or a new section (section) —
  // in one of its modules (moduleId) or a new module (module).
  kind?: 'learn' | 'practical' | null;
  sectionId?: string | null; section?: string | null; moduleId?: string | null; module?: string | null;
}
export type AskAction = { type: 'start-study'; courseId: string; taskId: string | null; minutes: number } | { type: 'adjust-today' };
export interface AskReply { kind: typeof ASK_KINDS[number]; message: string; items: AskItem[]; action: AskAction | null }

const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, max: number, empty = true) => typeof v === 'string' && v.length <= max && (empty || v.trim().length > 0);
const isDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isTime = (v: unknown) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const refs = (v: unknown, extra?: (x: Record<string, unknown>) => boolean) =>
  Array.isArray(v) && v.length <= ASK_LIMITS.list && v.every(x => obj(x) && str(x.id, 64, false) && str(x.title, ASK_LIMITS.titleChars) && (!extra || extra(x)));
const only = (o: Record<string, unknown>, keys: string[]) => Object.keys(o).every(k => keys.includes(k));

// The server's check of what arrives (the app builds it; anything else is refused before a model is called).
export function checkAskContext(raw: unknown): raw is AskContext {
  if (!obj(raw)) return false;
  const L = ASK_LIMITS, c = raw;
  if (!only(c, ['version', 'action', 'date', 'weekday', 'time', 'page', 'text', 'followUp', 'context'])) return false;
  if (c.version !== 1 || c.action !== 'ask' || !isDate(c.date) || !str(c.weekday, 12, false) || !isTime(c.time)) return false;
  if (!ASK_PAGES.includes(c.page as AskPage) || !str(c.text, L.textChars, false)) return false;
  if (c.followUp !== undefined && !(obj(c.followUp) && only(c.followUp, ['previous', 'text']) && str(c.followUp.previous, L.previousChars) && str(c.followUp.text, L.followUpChars, false))) return false;
  if (!obj(c.context)) return false;
  const x = c.context;
  if (!only(x, ['projects', 'today', 'study', 'project', 'note', 'task', 'calendar', 'course'])) return false;
  if (x.course !== undefined) {
    const co = x.course;
    if (!obj(co) || !only(co, ['id', 'title', 'minutes', 'modules']) || !str(co.id, 64, false) || !str(co.title, L.titleChars, false) || !Number.isInteger(co.minutes) || !Array.isArray(co.modules) || co.modules.length > L.courseModules) return false;
    let sections = 0, tasks = 0;
    for (const m of co.modules) {
      if (!obj(m) || !only(m, ['id', 'title', 'sections']) || !str(m.id, 64, false) || !str(m.title, L.titleChars) || !Array.isArray(m.sections)) return false;
      for (const sc of m.sections) {
        if (!obj(sc) || !only(sc, ['id', 'title', 'tasks']) || !str(sc.id, 64, false) || !str(sc.title, L.titleChars) || !Array.isArray(sc.tasks)) return false;
        sections++; tasks += sc.tasks.length;
        if (!sc.tasks.every(t => obj(t) && only(t, ['id', 'title', 'minutes', 'kind', 'done']) && str(t.id, 64, false) && str(t.title, L.titleChars) && Number.isInteger(t.minutes) && (t.kind === 'learn' || t.kind === 'practical') && typeof t.done === 'boolean')) return false;
      }
    }
    if (sections > L.courseSections || tasks > L.courseTasks) return false;
  }
  if (x.projects !== undefined && !refs(x.projects)) return false;
  if (x.today !== undefined) {
    const t = x.today;
    if (!obj(t) || !only(t, ['energy', 'freeMinutes', 'plan', 'dueToday'])) return false;
    if (!(t.energy === null || (Number.isInteger(t.energy) && (t.energy as number) >= 1 && (t.energy as number) <= 5))) return false;
    if (!(t.freeMinutes === null || (Number.isInteger(t.freeMinutes) && (t.freeMinutes as number) >= 0 && (t.freeMinutes as number) <= 1440))) return false;
    if (!refs(t.plan, p => Number.isInteger(p.minutes) && typeof p.done === 'boolean') || !refs(t.dueToday)) return false;
  }
  if (x.study !== undefined) {
    const s = x.study;
    if (!obj(s) || !only(s, ['course', 'nextTask', 'topics', 'revisionDue', 'energy', 'freeMinutes'])) return false;
    if (s.energy !== undefined && !(s.energy === null || (Number.isInteger(s.energy) && (s.energy as number) >= 1 && (s.energy as number) <= 5))) return false;
    if (s.freeMinutes !== undefined && !(s.freeMinutes === null || (Number.isInteger(s.freeMinutes) && (s.freeMinutes as number) >= 0 && (s.freeMinutes as number) <= 1440))) return false;
    if (!(s.course === null || refs([s.course])) || !(s.nextTask === null || refs([s.nextTask]))) return false;
    if (!Array.isArray(s.topics) || s.topics.length > L.list || !s.topics.every(t => str(t, L.titleChars, false)) || !(Number.isInteger(s.revisionDue) && (s.revisionDue as number) >= 0)) return false;
  }
  if (x.project !== undefined) {
    const p = x.project;
    if (!obj(p) || !only(p, ['id', 'title', 'summary', 'stage', 'tasks', 'notes', 'notesText'])) return false;
    if (!str(p.id, 64, false) || !str(p.title, L.titleChars, false) || !str(p.summary, L.summaryChars) || !ASK_STAGES.includes(p.stage as typeof ASK_STAGES[number])) return false;
    if (!refs(p.tasks, t => typeof t.done === 'boolean') || !Array.isArray(p.notes) || p.notes.length > L.list || !p.notes.every(n => str(n, L.titleChars, false))) return false;
    if (p.notesText !== undefined && !str(p.notesText, L.projectNotesChars)) return false;
  }
  if (x.note !== undefined && !(obj(x.note) && only(x.note, ['id', 'title', 'text']) && str(x.note.id, 64, false) && str(x.note.title, L.titleChars) && str(x.note.text, L.noteTextChars))) return false;
  if (x.task !== undefined && !(obj(x.task) && only(x.task, ['id', 'title', 'due', 'minutes', 'notes']) && str(x.task.id, 64, false) && str(x.task.title, L.titleChars, false)
    && (x.task.due === null || isDate(x.task.due)) && Number.isInteger(x.task.minutes) && str(x.task.notes, L.taskNotesChars))) return false;
  if (x.calendar !== undefined && !(obj(x.calendar) && only(x.calendar, ['day', 'appointments']) && isDate(x.calendar.day) && Array.isArray(x.calendar.appointments)
    && x.calendar.appointments.length <= L.list && x.calendar.appointments.every(a => obj(a) && str(a.title, L.titleChars) && isTime(a.time)))) return false;
  return true;
}

// The reply's shape only (JSON, the kind, field types and sizes). Whether ids exist, dates make sense and items are new
// is the app's check, against your data (app/src/ai/ask.ts). Returns null when it isn't usable at all.
export function readAsk(textIn: string): AskReply | null {
  let raw: unknown;
  try { raw = JSON.parse(textIn); } catch { return null; }
  if (!obj(raw) || !ASK_KINDS.includes(raw.kind as AskReply['kind']) || !str(raw.message, ASK_LIMITS.messageChars)) return null;
  const items = raw.items === undefined || raw.items === null ? [] : raw.items;
  if (!Array.isArray(items)) return null;
  const out: AskItem[] = [];
  for (const it of items.slice(0, Math.max(ASK_LIMITS.items, ASK_LIMITS.studyItems))) {
    if (!obj(it) || !ASK_ITEM_TYPES.includes(it.type as AskItem['type']) || !str(it.title, ASK_LIMITS.titleChars, false)) continue;
    out.push({
      type: it.type as AskItem['type'], title: (it.title as string).trim(),
      date: isDate(it.date) ? it.date as string : null, time: isTime(it.time) ? it.time as string : null,
      minutes: Number.isFinite(it.minutes) ? Math.round(it.minutes as number) : null,
      category: ASK_CATEGORIES.includes(it.category as typeof ASK_CATEGORIES[number]) ? it.category as AskItem['category'] : null,
      projectId: typeof it.projectId === 'string' && it.projectId ? it.projectId : null,
      text: typeof it.text === 'string' ? it.text.slice(0, ASK_LIMITS.itemTextChars) : null,
      kind: it.kind === 'learn' || it.kind === 'practical' ? it.kind : null,
      sectionId: typeof it.sectionId === 'string' && it.sectionId ? it.sectionId : null,
      section: typeof it.section === 'string' && it.section.trim() ? it.section.trim().slice(0, ASK_LIMITS.titleChars) : null,
      moduleId: typeof it.moduleId === 'string' && it.moduleId ? it.moduleId : null,
      module: typeof it.module === 'string' && it.module.trim() ? it.module.trim().slice(0, ASK_LIMITS.titleChars) : null,
    });
  }
  let action: AskAction | null = null;
  const a = raw.action;
  if (obj(a) && a.type === 'adjust-today') action = { type: 'adjust-today' };
  else if (obj(a) && a.type === 'start-study' && typeof a.courseId === 'string' && a.courseId) {
    action = { type: 'start-study', courseId: a.courseId, taskId: typeof a.taskId === 'string' && a.taskId ? a.taskId : null, minutes: Number.isFinite(a.minutes) ? Math.round(a.minutes as number) : 15 };
  }
  return { kind: raw.kind as AskReply['kind'], message: (raw.message as string).trim(), items: out, action };
}
