// The shape of "Ask MyDay" (the AI design's step 1, 17 Oct 2026): limits, what's sent and what comes back — kept apart
// from ask.ts (the instructions), so the app can load it without them. The model only proposes; the app checks every
// proposal against your own data again (app/src/ai/ask.ts) and saves nothing until you tap.
export const ASK_LIMITS = {
  textChars: 600,          // what you typed
  followUpChars: 300,      // one "Not quite: …"
  previousChars: 1500,     // the answer you're following up on, as it was shown
  // A longer conversation (v25): what came before the newest message, oldest first, at most this much in all.
  conversationChars: 4000, conversationTurns: 12, conversationLeftOut: 500,
  // How you work (v26): what you've confirmed about yourself, sent only when you let Ask MyDay use it.
  howLines: 8, howChars: 120,
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
  // A project's milestones and the one decision you asked about ("What am I missing?"), from 1.32.0.
  milestones: 30, decisionOptions: 4, decisionPoints: 6, pointChars: 160, questionChars: 200,
  // A business idea's one page, sent only from its Model tab (1.34.0): three answers and what must be true so far.
  answerChars: 1000, beliefs: 12, beliefChars: 110,
  // The weekly review (1.37.0): what moved per project, what's waiting, next week's focus.
  reviewProjects: 20, reviewWaiting: 5, reviewWaitingChars: 200, reviewFocus: 3,
  // A lookup (specs/ai-tools.md §3): the words to search, up to 8 notes found, each with a short snippet at most.
  lookupQueryChars: 60, lookupNotes: 8, lookupSnippetChars: 200, lookupSources: 8, lookupDecisions: 8, lookupBeliefs: 8, lookupWaiting: 8, lookupStudy: 3, studyWhyChars: 400, studyDetailChars: 200,
  taskSteps: 30, stepChars: 120, projectTaskSteps: 10, projectSteps: 40, taskAfter: 5, // a task's checklist and what it starts after (v23)
  lookupSearch: 12, searchWhereChars: 120, // "Look across MyDay" (v24): up to 12 things found, each with where it is
  // "Your day" (v18): one day's plan, what's due, busy and free times — capped like the rest of a page's slice.
  dayTasks: 20, dayBusy: 40, dayFree: 24,
};
export const ASK_PAGES = ['today', 'tasks', 'task', 'calendar', 'projects', 'project', 'notes', 'note', 'study', 'course', 'health', 'finance', 'review', 'other'] as const;
export type AskPage = typeof ASK_PAGES[number];
export const ASK_KINDS = ['add', 'steps', 'answer', 'cannot', 'change', 'lookup'] as const;
// What a lookup can look in: your notes (v17), one day (v18), a project (v19), open decisions (v20), what you're
// waiting on (v21), what to study next (v22), or across MyDay (v24; it stands in for "notes" in the app from then).
// The app says what it can look in with `can`.
export const ASK_TOOLS = ['notes', 'day', 'project', 'decisions', 'waiting', 'study', 'search'] as const;
export const DAY_KINDS = ['work', 'appointment', 'workout', 'sleep', 'prep'] as const;
export const ASK_ITEM_TYPES = ['task', 'note', 'appointment', 'project', 'study-task', 'change', 'milestone', 'pro', 'con', 'option', 'must-be-true', 'step'] as const;
export const BELIEF_STATES = ['open', 'looks-true', 'doesnt-hold'] as const;
export const ASK_TARGETS = ['task', 'appointment', 'note'] as const;
export const ASK_CATEGORIES = ['learning', 'admin', 'health'] as const;
export const ASK_STAGES = ['capture', 'understand', 'organise', 'explore', 'decide', 'act', 'reflect'] as const;

interface Ref { id: string; title: string }
// The slice of the page you're on (only what's listed here is ever sent; the app shows it before you tap).
export interface AskPageContext {
  projects?: Ref[];                                                     // open projects' names (to file things into)
  // minutesLeft: the minutes of the plan's tasks sent that aren't done (v18; an older app doesn't send it).
  today?: { energy: number | null; freeMinutes: number | null; plan: { id: string; title: string; minutes: number; done: boolean }[]; minutesLeft?: number; dueToday: Ref[]; revisionDue?: number };
  study?: { course: Ref | null; nextTask: Ref | null; topics: string[]; revisionDue: number; energy?: number | null; freeMinutes?: number | null }; // energy and free time today, to fit a session to them
  project?: {
    // A task's checklist (v23, the owner's choice: its steps' words, done or not, in order — at most 10 a task and 40 in
    // all, with stepsTotal when more) and the project's tasks it starts after, by title.
    id: string; title: string; summary: string; stage: typeof ASK_STAGES[number]; tasks: (Ref & { done: boolean; steps?: { text: string; done: boolean }[]; stepsTotal?: number; after?: string[] })[]; notes: string[]; notesText?: string;
    milestones?: { id: string; title: string; reached: boolean; aim: string | null }[];   // its milestones (1.32.0)
    decision?: { id: string; question: string; options: { id: string; text: string; pros: string[]; cons: string[] }[] }; // the one you asked about
    // A business idea's one page, only from its Model tab (1.34.0): what problem, for whom, how it works and pays, and
    // what must be true so far with how each is turning out (not what you found).
    onePage?: { problem: string; who: string; how: string; mustBeTrue: { text: string; state: typeof BELIEF_STATES[number] }[] };
  };
  note?: { id: string; title: string; text: string };
  task?: { id: string; title: string; due: string | null; minutes: number; notes: string; steps?: { text: string; done: boolean }[] }; // steps: its checklist (v23; an older app sends none)
  calendar?: { day: string; appointments: { id?: string; title: string; time: string }[] }; // id: so a change can name one
  // A course on your Study roadmap, as an outline (titles, lengths, kinds, done or not — no links, notes or concepts).
  // The weekly review (#review, 1.37.0): the last seven days in counts, what's waiting and the focus — never anything of
  // a private project.
  review?: { from: string; to: string; moved: { project: string; tasks: number; milestones: number; decisions: number; found: number; recorded: number }[];
    otherTasks: number; studySessions: number; studyMinutes: number; workouts: number; waiting: string[]; focus: string[] };
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
  conversation?: AskConversation;                  // v25: what came before the newest message (never with followUp)
  howYouWork?: string[];                           // v26: what they've confirmed about how they work (only when they've let Ask use it)
  context: AskPageContext;
  can?: typeof ASK_TOOLS[number][];                // what this app can look up for an answer (absent: nothing)
  lookup?: AskLookup;                              // what it found, the second time round (one lookup per question)
}
// A longer conversation while Ask MyDay's panel is open (v25, specs/ask-conversation.md): "text" is the newest message;
// "earlier" is what came before, oldest first — each message as typed and the answer as it was shown: the first always,
// then the newest that fit; "leftOut", how many exchanges in between were left out; "lookupFromEarlier", that the
// lookup sent was made for an earlier message, so the newest may look once more. Older apps send one "followUp" instead.
export interface AskConversation { earlier: { asked: string; answered: string }[]; leftOut: number; lookupFromEarlier?: true }
// What a lookup found, on the device and through the privacy rules (app/src/ai/lookup.ts): the words searched, up to 8
// notes that may reach AI (title, its project's name, a short snippet only with "AI help with notes" on), how many such
// notes matched in all, and whether only titles were searched. Nothing about private notes — not even how many matched.
export interface AskNotesLookup {
  tool: 'notes'; query: string;
  notes: { id: string; title: string; project: string | null; snippet: string | null }[];
  found: number; titlesOnly: boolean;
}
// "Your day" (v18): the day asked about (query: its date), as the app sees it — its plan (a private project's tasks left
// out), tasks due that day that aren't on it, busy times by kind only (never an appointment's name), free time, energy.
export interface AskDayLookup {
  tool: 'day'; query: string; weekday: string; planned: boolean; rest: boolean; energy: number | null;
  tasks: { title: string; minutes: number; done: boolean; time: string | null }[];
  minutesLeft: number; // of those tasks, the minutes not done
  freeMinutes?: number; // the free time added up (from v25's app; older apps don't send it)
  due: string[];
  busy: { kind: typeof DAY_KINDS[number]; start: string; end: string }[];
  free: { start: string; end: string }[];
}
// "A project's context" (v19): one of your open projects you asked about by name (query: its id from "projects"), as
// its own page sends it — never a private one; its decisions and one page stay on its page.
export interface AskProjectLookup { tool: 'project'; query: string; project: Omit<NonNullable<AskPageContext['project']>, 'decision' | 'onePage'> }
// "Open decisions" (v20): across your open projects (query "all") or one (its id), the decisions with nothing chosen
// yet — the question, its options' text, which options have no pros or no cons yet ("gaps", worked out in the app: the
// model misread counts), the day it was opened and whether it was reopened — and what a business idea must have true
// that isn't checked yet (its text only, never what you found). Never what a pro or con says; never a private
// project's; never your reasons or earlier choices.
export interface AskDecisionsLookup {
  tool: 'decisions'; query: string;
  decisions: { id: string; projectId: string; project: string; question: string; options: string[]; gaps: string[]; since: string; reopened: boolean }[];
  mustBeTrue: { id: string; projectId: string; project: string; text: string }[];
  found: { decisions: number; mustBeTrue: number }; // how many in all (the lists carry the oldest few)
}
// "What you're waiting on" (v21): tasks marked as waiting (not done or let go), the oldest wait first, across your tasks
// ("all") or one open project's (its id) — the title, its project, since when, when you expect it, and whether its
// "Chase:" task is there and still to do. Never who or what it waits on (`waiting.on`); never a private project's.
export interface AskWaitingLookup {
  tool: 'waiting'; query: string;
  tasks: { id: string; title: string; projectId: string | null; project: string | null; since: string; until: string | null; chased: boolean }[];
  found: number; // how many are waiting in all (the list carries the oldest few)
}
// "What to study next" (v22): the same next steps as Today's Study card (the app's learningOptions), your focus first —
// each subject's lesson or task, its detail line and "Why this?", the suggested minutes and length, whether it's begun,
// a session to resume, revision first, or the whole path ready — and how much revision is due. No ids or links go.
export const STUDY_SUBJECTS = ['cybersecurity', 'arabic', 'roadmap'] as const;
export interface AskStudyLookup {
  tool: 'study'; query: string; // "all"
  options: { subject: typeof STUDY_SUBJECTS[number]; label: string; title: string; detail: string; why: string; minutes: number; mode: string | null; started: boolean; resume: boolean; reviseFirst: boolean; allComplete: boolean }[];
  revisionDue: number;
}
// "Look across MyDay" (v24, the owner's choices of 25 Oct 2026): what Search everywhere finds of the words, through the
// privacy rules and only in what may be sent (app/src/ai/lookup.ts) — each thing's kind, name, where it is and whether
// it's done, paused or past, with a reference ("r1"…) the answer cites; never its text, and never an id or a link (they
// stay on the device). "total": how many that may be sent matched in all; "titlesOnly": notes searched by title only.
export const SEARCH_KINDS = ['task', 'project', 'milestone', 'decision', 'note', 'appointment', 'work', 'course', 'study task', 'topic', 'book', 'lesson', 'module', 'course word'] as const;
export const SEARCH_STATES = ['done', 'let go', 'paused', 'past', 'archived', 'finished'] as const;
export interface AskSearchLookup {
  tool: 'search'; query: string;
  found: { ref: string; kind: typeof SEARCH_KINDS[number]; title: string; where: string | null; state: typeof SEARCH_STATES[number] | null }[];
  total: number; titlesOnly: boolean;
}
export type AskLookup = AskNotesLookup | AskDayLookup | AskProjectLookup | AskDecisionsLookup | AskWaitingLookup | AskStudyLookup | AskSearchLookup;

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
  // A change to something already saved (kind "change"): what it is and its id; the other fields are the new values.
  target?: typeof ASK_TARGETS[number] | null; targetId?: string | null;
  // A pro or con for one of the decision's options (types "pro" / "con"): which option.
  optionId?: string | null;
}
export const ASK_SCOPES = ['all', 'arabic', 'cybersecurity'] as const;
export type AskAction = { type: 'start-study'; courseId: string; taskId: string | null; minutes: number } | { type: 'adjust-today' } | { type: 'start-revision'; scope: typeof ASK_SCOPES[number] };
export interface AskReply {
  kind: typeof ASK_KINDS[number]; message: string; items: AskItem[]; action: AskAction | null;
  lookup?: { tool: typeof ASK_TOOLS[number]; query: string }; // kind "lookup": what to look in, and the words (or the day)
  sources?: string[];                                          // after a lookup: the ids of the notes the answer used
}

const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, max: number, empty = true) => typeof v === 'string' && v.length <= max && (empty || v.trim().length > 0);
// The most minutes a plan can have left: 20 tasks (a day lookup's limit) of 600 minutes, the most a task can be.
const MOST_MINUTES_LEFT = 20 * 600;
// A real calendar date (not 31 November).
const isDate = (v: unknown) => {
  const t = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? Date.parse(`${v}T00:00:00Z`) : NaN;
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === v;
};
const isTime = (v: unknown) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const refs = (v: unknown, extra?: (x: Record<string, unknown>) => boolean) =>
  Array.isArray(v) && v.length <= ASK_LIMITS.list && v.every(x => obj(x) && str(x.id, 64, false) && str(x.title, ASK_LIMITS.titleChars) && (!extra || extra(x)));
const only = (o: Record<string, unknown>, keys: string[]) => Object.keys(o).every(k => keys.includes(k));
// A model sometimes writes the word "null" (or "none") for no value.
const word = (v: unknown, max: number) => (typeof v === 'string' && v.trim() && !/^(null|none|undefined|n\/a)$/i.test(v.trim()) ? v.trim().slice(0, max) : null);

// A task's checklist as it's sent: its steps' words and done, nothing more.
const stepsOk = (v: unknown, max: number) => Array.isArray(v) && v.length <= max && v.every(st => obj(st) && only(st, ['text', 'done']) && str(st.text, ASK_LIMITS.stepChars, false) && typeof st.done === 'boolean');

// A project as its page sends it (the page's own, or one looked up); `focus`: the decision asked about and the one page
// may come too (only from its own page).
function checkProject(p: unknown, focus: boolean): boolean {
  const L = ASK_LIMITS;
  if (!obj(p) || !only(p, ['id', 'title', 'summary', 'stage', 'tasks', 'notes', 'notesText', 'milestones', ...(focus ? ['decision', 'onePage'] : [])])) return false;
  if (!str(p.id, 64, false) || !str(p.title, L.titleChars, false) || !str(p.summary, L.summaryChars) || !ASK_STAGES.includes(p.stage as typeof ASK_STAGES[number])) return false;
  if (!refs(p.tasks, t => typeof t.done === 'boolean' && only(t, ['id', 'title', 'done', 'steps', 'stepsTotal', 'after']) && (t.steps === undefined || stepsOk(t.steps, L.projectTaskSteps))
    && (t.stepsTotal === undefined || (Number.isInteger(t.stepsTotal) && (t.stepsTotal as number) >= 0 && (t.stepsTotal as number) <= L.taskSteps))
    && (t.after === undefined || (Array.isArray(t.after) && t.after.length <= L.taskAfter && t.after.every(a => str(a, L.titleChars, false)))))
    || ((p.tasks as { steps?: unknown[] }[]).reduce((m, t) => m + (t.steps?.length ?? 0), 0) > L.projectSteps) || !Array.isArray(p.notes) || p.notes.length > L.list || !p.notes.every(n => str(n, L.titleChars, false))) return false;
  if (p.notesText !== undefined && !str(p.notesText, L.projectNotesChars)) return false;
  if (p.milestones !== undefined && !(Array.isArray(p.milestones) && p.milestones.length <= L.milestones && p.milestones.every(m => obj(m) && only(m, ['id', 'title', 'reached', 'aim'])
    && str(m.id, 64, false) && str(m.title, L.titleChars, false) && typeof m.reached === 'boolean' && (m.aim === null || isDate(m.aim))))) return false;
  if (p.decision !== undefined) {
    const dc = p.decision, pts = (v: unknown) => Array.isArray(v) && v.length <= L.decisionPoints && v.every(t => str(t, L.pointChars, false));
    if (!(obj(dc) && only(dc, ['id', 'question', 'options']) && str(dc.id, 64, false) && str(dc.question, L.questionChars, false) && Array.isArray(dc.options) && dc.options.length <= L.decisionOptions
      && dc.options.every(o => obj(o) && only(o, ['id', 'text', 'pros', 'cons']) && str(o.id, 64, false) && str(o.text, L.titleChars, false) && pts(o.pros) && pts(o.cons)))) return false;
  }
  if (p.onePage !== undefined) {
    const op = p.onePage;
    if (!(obj(op) && only(op, ['problem', 'who', 'how', 'mustBeTrue']) && str(op.problem, L.answerChars) && str(op.who, L.answerChars) && str(op.how, L.answerChars)
      && Array.isArray(op.mustBeTrue) && op.mustBeTrue.length <= L.beliefs
      && op.mustBeTrue.every(b => obj(b) && only(b, ['text', 'state']) && str(b.text, L.beliefChars, false) && BELIEF_STATES.includes(b.state as typeof BELIEF_STATES[number])))) return false;
  }
  return true;
}

// The server's check of what arrives (the app builds it; anything else is refused before a model is called).
export function checkAskContext(raw: unknown): raw is AskContext {
  if (!obj(raw)) return false;
  const L = ASK_LIMITS, c = raw;
  if (!only(c, ['version', 'action', 'date', 'weekday', 'time', 'page', 'text', 'followUp', 'conversation', 'howYouWork', 'context', 'can', 'lookup'])) return false;
  if (c.howYouWork !== undefined && !(Array.isArray(c.howYouWork) && c.howYouWork.length >= 1 && c.howYouWork.length <= L.howLines && c.howYouWork.every(h => str(h, L.howChars, false)))) return false;
  if (c.can !== undefined && !(Array.isArray(c.can) && c.can.length <= ASK_TOOLS.length && c.can.every(t => ASK_TOOLS.includes(t as typeof ASK_TOOLS[number])))) return false;
  if (c.lookup !== undefined) {
    const lk = c.lookup, n = (v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 100000;
    if (!obj(lk)) return false;
    if (lk.tool === 'notes') {
      if (!(only(lk, ['tool', 'query', 'notes', 'found', 'titlesOnly']) && str(lk.query, L.lookupQueryChars, false)
        && Array.isArray(lk.notes) && lk.notes.length <= L.lookupNotes && lk.notes.every(x => obj(x) && only(x, ['id', 'title', 'project', 'snippet']) && str(x.id, 64, false) && str(x.title, L.titleChars, false)
          && (x.project === null || str(x.project, L.titleChars, false)) && (x.snippet === null || str(x.snippet, L.lookupSnippetChars)))
        && n(lk.found) && typeof lk.titlesOnly === 'boolean')) return false;
    } else if (lk.tool === 'search') {
      const refs = Array.isArray(lk.found) ? lk.found.map(x => obj(x) ? x.ref : null) : [];
      if (!(only(lk, ['tool', 'query', 'found', 'total', 'titlesOnly']) && str(lk.query, L.lookupQueryChars, false) && n(lk.total) && typeof lk.titlesOnly === 'boolean'
        && Array.isArray(lk.found) && lk.found.length <= L.lookupSearch && (lk.total as number) >= lk.found.length && new Set(refs).size === refs.length
        && lk.found.every(x => obj(x) && only(x, ['ref', 'kind', 'title', 'where', 'state']) && typeof x.ref === 'string' && /^r\d{1,2}$/.test(x.ref)
          && SEARCH_KINDS.includes(x.kind as typeof SEARCH_KINDS[number]) && str(x.title, L.titleChars, false) && (x.where === null || str(x.where, L.searchWhereChars, false))
          && (x.state === null || SEARCH_STATES.includes(x.state as typeof SEARCH_STATES[number]))))) return false;
    } else if (lk.tool === 'study') {
      if (!(only(lk, ['tool', 'query', 'options', 'revisionDue']) && lk.query === 'all' && n(lk.revisionDue) && Array.isArray(lk.options) && lk.options.length <= L.lookupStudy
        && lk.options.every(o => obj(o) && only(o, ['subject', 'label', 'title', 'detail', 'why', 'minutes', 'mode', 'started', 'resume', 'reviseFirst', 'allComplete'])
          && STUDY_SUBJECTS.includes(o.subject as typeof STUDY_SUBJECTS[number]) && str(o.label, L.titleChars, false) && str(o.title, L.titleChars, false) && str(o.detail, L.studyDetailChars)
          && str(o.why, L.studyWhyChars) && Number.isInteger(o.minutes) && (o.minutes as number) >= 0 && (o.minutes as number) <= 600 && (o.mode === null || str(o.mode, 20, false))
          && typeof o.started === 'boolean' && typeof o.resume === 'boolean' && typeof o.reviseFirst === 'boolean' && typeof o.allComplete === 'boolean'))) return false;
    } else if (lk.tool === 'waiting') {
      if (!(only(lk, ['tool', 'query', 'tasks', 'found']) && str(lk.query, 64, false) && n(lk.found) && Array.isArray(lk.tasks) && lk.tasks.length <= L.lookupWaiting && (lk.found as number) >= lk.tasks.length
        && lk.tasks.every(t => obj(t) && only(t, ['id', 'title', 'projectId', 'project', 'since', 'until', 'chased']) && str(t.id, 64, false) && str(t.title, L.titleChars, false)
          && (t.projectId === null ? t.project === null : str(t.projectId, 64, false) && str(t.project, L.titleChars, false)) && isDate(t.since) && (t.until === null || isDate(t.until)) && typeof t.chased === 'boolean')
        && (lk.query === 'all' || lk.tasks.every(t => (t as { projectId: unknown }).projectId === lk.query)))) return false;
    } else if (lk.tool === 'decisions') {
      const ref = (x: Record<string, unknown>) => str(x.id, 64, false) && str(x.projectId, 64, false) && str(x.project, L.titleChars, false);
      if (!(only(lk, ['tool', 'query', 'decisions', 'mustBeTrue', 'found']) && str(lk.query, 64, false)
        && Array.isArray(lk.decisions) && lk.decisions.length <= L.lookupDecisions && lk.decisions.every(d => obj(d) && only(d, ['id', 'projectId', 'project', 'question', 'options', 'gaps', 'since', 'reopened']) && ref(d)
          && str(d.question, L.questionChars, false) && isDate(d.since) && typeof d.reopened === 'boolean' && Array.isArray(d.options) && d.options.length <= L.decisionOptions
          && d.options.every(o => str(o, L.titleChars, false)) && Array.isArray(d.gaps) && d.gaps.length <= L.decisionOptions * 2 && d.gaps.every(g => str(g, L.titleChars + 20, false)))
        && Array.isArray(lk.mustBeTrue) && lk.mustBeTrue.length <= L.lookupBeliefs && lk.mustBeTrue.every(b => obj(b) && only(b, ['id', 'projectId', 'project', 'text']) && ref(b) && str(b.text, L.beliefChars, false))
        && obj(lk.found) && only(lk.found, ['decisions', 'mustBeTrue']) && n(lk.found.decisions) && n(lk.found.mustBeTrue)
        && (lk.found.decisions as number) >= lk.decisions.length && (lk.found.mustBeTrue as number) >= lk.mustBeTrue.length
        && (lk.query === 'all' || [...lk.decisions, ...lk.mustBeTrue].every(x => (x as { projectId: unknown }).projectId === lk.query)))) return false;
    } else if (lk.tool === 'project') {
      if (!(only(lk, ['tool', 'query', 'project']) && str(lk.query, 64, false) && checkProject(lk.project, false) && (lk.project as { id: unknown }).id === lk.query)) return false;
    } else if (lk.tool === 'day') {
      const dt = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(v);
      if (!(only(lk, ['tool', 'query', 'weekday', 'planned', 'rest', 'energy', 'tasks', 'minutesLeft', 'freeMinutes', 'due', 'busy', 'free']) && isDate(lk.query) && str(lk.weekday, 12, false)
        && (lk.freeMinutes === undefined || (Number.isInteger(lk.freeMinutes) && (lk.freeMinutes as number) >= 0 && (lk.freeMinutes as number) <= 1440))
        && typeof lk.planned === 'boolean' && typeof lk.rest === 'boolean' && (lk.energy === null || (Number.isInteger(lk.energy) && (lk.energy as number) >= 1 && (lk.energy as number) <= 5))
        && Array.isArray(lk.tasks) && lk.tasks.length <= L.dayTasks && lk.tasks.every(t => obj(t) && only(t, ['title', 'minutes', 'done', 'time']) && str(t.title, L.titleChars, false) && Number.isInteger(t.minutes) && typeof t.done === 'boolean' && (t.time === null || isTime(t.time)))
        && Number.isInteger(lk.minutesLeft) && (lk.minutesLeft as number) >= 0 && (lk.minutesLeft as number) <= MOST_MINUTES_LEFT
        && Array.isArray(lk.due) && lk.due.length <= L.dayTasks && lk.due.every(t => str(t, L.titleChars, false))
        && Array.isArray(lk.busy) && lk.busy.length <= L.dayBusy && lk.busy.every(x => obj(x) && only(x, ['kind', 'start', 'end']) && DAY_KINDS.includes(x.kind as typeof DAY_KINDS[number]) && dt(x.start) && dt(x.end))
        && Array.isArray(lk.free) && lk.free.length <= L.dayFree && lk.free.every(x => obj(x) && only(x, ['start', 'end']) && isTime(x.start) && isTime(x.end)))) return false;
    } else return false;
  }

  if (c.version !== 1 || c.action !== 'ask' || !isDate(c.date) || !str(c.weekday, 12, false) || !isTime(c.time)) return false;
  if (!ASK_PAGES.includes(c.page as AskPage) || !str(c.text, L.textChars, false)) return false;
  if (c.followUp !== undefined && !(obj(c.followUp) && only(c.followUp, ['previous', 'text']) && str(c.followUp.previous, L.previousChars) && str(c.followUp.text, L.followUpChars, false))) return false;
  if (c.conversation !== undefined) {
    const v = c.conversation;
    if (c.followUp !== undefined || !(obj(v) && only(v, ['earlier', 'leftOut', 'lookupFromEarlier']) && Array.isArray(v.earlier) && v.earlier.length >= 1 && v.earlier.length <= L.conversationTurns
      && v.earlier.every(e => obj(e) && only(e, ['asked', 'answered']) && str(e.asked, L.textChars, false) && str(e.answered, L.previousChars))
      && v.earlier.reduce((m, e) => m + (e.asked as string).length + (e.answered as string).length, 0) <= L.conversationChars
      && Number.isInteger(v.leftOut) && (v.leftOut as number) >= 0 && (v.leftOut as number) <= L.conversationLeftOut
      && (v.lookupFromEarlier === undefined || (v.lookupFromEarlier === true && c.lookup !== undefined)))) return false;
  }
  if (!obj(c.context)) return false;
  const x = c.context;
  if (!only(x, ['projects', 'today', 'study', 'project', 'note', 'task', 'calendar', 'course', 'review'])) return false;
  if (x.review !== undefined) {
    const r = x.review, n = (v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 100000;
    if (!(obj(r) && only(r, ['from', 'to', 'moved', 'otherTasks', 'studySessions', 'studyMinutes', 'workouts', 'waiting', 'focus']) && isDate(r.from) && isDate(r.to)
      && Array.isArray(r.moved) && r.moved.length <= L.reviewProjects && r.moved.every(m => obj(m) && only(m, ['project', 'tasks', 'milestones', 'decisions', 'found', 'recorded']) && str(m.project, L.titleChars, false) && n(m.tasks) && n(m.milestones) && n(m.decisions) && n(m.found) && n(m.recorded))
      && n(r.otherTasks) && n(r.studySessions) && n(r.studyMinutes) && n(r.workouts)
      && Array.isArray(r.waiting) && r.waiting.length <= L.reviewWaiting && r.waiting.every(w => str(w, L.reviewWaitingChars, false))
      && Array.isArray(r.focus) && r.focus.length <= L.reviewFocus && r.focus.every(f => str(f, L.titleChars, false)))) return false;
  }
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
    if (!obj(t) || !only(t, ['energy', 'freeMinutes', 'plan', 'minutesLeft', 'dueToday', 'revisionDue'])) return false;
    if (t.minutesLeft !== undefined && !(Number.isInteger(t.minutesLeft) && (t.minutesLeft as number) >= 0 && (t.minutesLeft as number) <= MOST_MINUTES_LEFT)) return false;
    if (t.revisionDue !== undefined && !(Number.isInteger(t.revisionDue) && (t.revisionDue as number) >= 0)) return false;
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
  if (x.project !== undefined && !checkProject(x.project, true)) return false;
  if (x.note !== undefined && !(obj(x.note) && only(x.note, ['id', 'title', 'text']) && str(x.note.id, 64, false) && str(x.note.title, L.titleChars) && str(x.note.text, L.noteTextChars))) return false;
  if (x.task !== undefined && !(obj(x.task) && only(x.task, ['id', 'title', 'due', 'minutes', 'notes', 'steps']) && (x.task.steps === undefined || stepsOk(x.task.steps, L.taskSteps)) && str(x.task.id, 64, false) && str(x.task.title, L.titleChars, false)
    && (x.task.due === null || isDate(x.task.due)) && Number.isInteger(x.task.minutes) && str(x.task.notes, L.taskNotesChars))) return false;
  if (x.calendar !== undefined && !(obj(x.calendar) && only(x.calendar, ['day', 'appointments']) && isDate(x.calendar.day) && Array.isArray(x.calendar.appointments)
    && x.calendar.appointments.length <= L.list && x.calendar.appointments.every(a => obj(a) && only(a, ['id', 'title', 'time']) && (a.id === undefined || str(a.id, 64, false)) && str(a.title, L.titleChars) && isTime(a.time)))) return false;
  return true;
}

// The reply's shape only (JSON, the kind, field types and sizes). Whether ids exist, dates make sense and items are new
// is the app's check, against your data (app/src/ai/ask.ts). Returns null when it isn't usable at all.
export function readAsk(textIn: string): AskReply | null {
  let raw: unknown;
  try { raw = JSON.parse(textIn); } catch { return null; }
  if (!obj(raw) || !ASK_KINDS.includes(raw.kind as AskReply['kind']) || !str(raw.message, ASK_LIMITS.messageChars)) return null;
  // A lookup: only what to look in and the words; nothing else in it is used.
  if (raw.kind === 'lookup') {
    const lk = obj(raw.lookup) ? raw.lookup : raw, query = word(lk.query ?? lk.day, ASK_LIMITS.lookupQueryChars);
    const tool = lk.tool === undefined ? 'notes' : ASK_TOOLS.includes(lk.tool as typeof ASK_TOOLS[number]) ? lk.tool as typeof ASK_TOOLS[number] : null; // nothing else can be looked in
    if (tool === 'day' && !isDate(query)) return null; // a day is a date the model worked out
    if ((tool === 'project' || tool === 'decisions' || tool === 'waiting') && !/^[\w-]{1,64}$/.test(query ?? '')) return null; // a project by its id, from "projects" (or "all")
    if (tool === 'study') return { kind: 'lookup', message: (raw.message as string).trim(), items: [], action: null, lookup: { tool, query: 'all' } }; // what to study next: always all of it
    return query && tool ? { kind: 'lookup', message: (raw.message as string).trim(), items: [], action: null, lookup: { tool, query } } : null;
  }
  const sources = Array.isArray(raw.sources) ? raw.sources.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length <= 64).slice(0, ASK_LIMITS.lookupSources) : [];
  const items = raw.items === undefined || raw.items === null ? [] : raw.items;
  if (!Array.isArray(items)) return null;
  const out: AskItem[] = [];
  for (const it of items.slice(0, Math.max(ASK_LIMITS.items, ASK_LIMITS.studyItems))) {
    // A change needs a target and an id; its title is only a new title (it may be absent).
    if (obj(it) && it.type === 'change') {
      const target = ASK_TARGETS.includes(it.target as typeof ASK_TARGETS[number]) ? it.target as typeof ASK_TARGETS[number] : null, targetId = word(it.targetId, 64);
      if (!target || !targetId) continue;
      out.push({ type: 'change', title: word(it.title, ASK_LIMITS.titleChars) ?? '', target, targetId,
        date: isDate(it.date) ? it.date as string : null, time: isTime(it.time) ? it.time as string : null,
        minutes: Number.isFinite(it.minutes) ? Math.round(it.minutes as number) : null,
        category: ASK_CATEGORIES.includes(it.category as typeof ASK_CATEGORIES[number]) ? it.category as AskItem['category'] : null,
        projectId: word(it.projectId, 64) });
      continue;
    }
    // A step with no type is a task (a study task when it says where in a course it goes): steps are nothing else.
    const type = obj(it) && it.type === undefined && raw.kind === 'steps' ? (it.sectionId || it.section || it.moduleId || it.module ? 'study-task' : 'task') : obj(it) ? it.type : null;
    // A milestone, pro, con, option or belief whose words came in "text" rather than "title" is read the same.
    const title = obj(it) && !str(it.title, ASK_LIMITS.titleChars, false) && ['milestone', 'pro', 'con', 'option', 'must-be-true', 'step'].includes(type as string) && str(it.text, ASK_LIMITS.titleChars, false) ? it.text : obj(it) ? it.title : null;
    if (!obj(it) || !ASK_ITEM_TYPES.includes(type as AskItem['type']) || type === 'change' || !str(title, ASK_LIMITS.titleChars, false)) continue;
    out.push({
      type: type as AskItem['type'], title: (title as string).trim(),
      date: isDate(it.date) ? it.date as string : null, time: isTime(it.time) ? it.time as string : null,
      minutes: Number.isFinite(it.minutes) ? Math.round(it.minutes as number) : null,
      category: ASK_CATEGORIES.includes(it.category as typeof ASK_CATEGORIES[number]) ? it.category as AskItem['category'] : null,
      projectId: word(it.projectId, 64),
      text: typeof it.text === 'string' ? it.text.slice(0, ASK_LIMITS.itemTextChars) : null,
      kind: it.kind === 'learn' || it.kind === 'practical' ? it.kind : null,
      sectionId: word(it.sectionId, 64),
      section: word(it.section, ASK_LIMITS.titleChars),
      moduleId: word(it.moduleId, 64),
      optionId: word(it.optionId, 64),
      module: word(it.module, ASK_LIMITS.titleChars),
    });
  }
  let action: AskAction | null = null;
  // A model sometimes puts its action among the items: it's taken as the action (only when there's no action already).
  const stray = !obj(raw.action) ? items.find(x => obj(x) && (x.type === 'start-study' || x.type === 'adjust-today' || x.type === 'start-revision')) : undefined;
  const a = obj(raw.action) ? raw.action : stray;
  if (obj(a) && a.type === 'adjust-today') action = { type: 'adjust-today' };
  else if (obj(a) && a.type === 'start-revision') action = { type: 'start-revision', scope: ASK_SCOPES.includes(a.scope as typeof ASK_SCOPES[number]) ? a.scope as typeof ASK_SCOPES[number] : 'all' };
  else if (obj(a) && a.type === 'start-study' && typeof a.courseId === 'string' && a.courseId) {
    action = { type: 'start-study', courseId: a.courseId, taskId: typeof a.taskId === 'string' && a.taskId ? a.taskId : null, minutes: Number.isFinite(a.minutes) ? Math.round(a.minutes as number) : 15 };
  }
  return { kind: raw.kind as AskReply['kind'], message: (raw.message as string).trim(), items: out, action, ...(sources.length ? { sources } : {}) };
}
