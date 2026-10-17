// The shape of MyDay's saved data: localStorage key "myday.data.v4", schemaVersion 4.
// It must match the current MyDay (../index.html) exactly, because both versions use the same saved data.
// If a field is added or changed, the current MyDay needs the same change and a new schemaVersion (see CLAUDE.md).

import type { CyberData } from './cybersecurity/types';
import type { ArabicData } from './arabic/types';

export type DateKey = string;  // "YYYY-MM-DD" in the device's local time
export type DateTime = string; // "YYYY-MM-DDTHH:MM" in the device's local time (never a UTC ISO string)

export type Category = 'learning' | 'admin' | 'health';
export type Energy = 1 | 2 | 3 | 4 | 5;
export type Theme = 'dark' | 'light' | 'auto';

// One entry in a task list (Settings → Your task lists).
export interface ListItem {
  id: string;
  title: string;
  minutes: number;
}

// A task waiting for a later day.
export interface QueueItem {
  qid: string;
  taskId: string | null;    // the ListItem it came from, if any
  category: Category;
  title: string;
  minutes: number;
  queuedOn: DateKey;
  sourceUid: string | null; // the Task it was rolled from, if any
}

// A task on one day's plan.
export interface Task {
  uid: string;
  taskId: string | null;
  category: Category;
  title: string;
  minutes: number;          // may be shorter than baseMinutes on a low-energy day
  baseMinutes: number;
  done: boolean;
  shrunk: boolean;          // shown as "just 15 min"
  fromQueue: QueueItem | null;
  rolledQid: string | null; // set while it's marked to roll to tomorrow
  scheduledStart: DateTime | null;
  scheduledEnd: DateTime | null;
}

export interface Day {
  energy: Energy | null;
  rest: boolean;
  builtAt: string;
  checkedIn: boolean;
  tasks: Task[];
}

export interface Commitment {
  id: string;
  kind: 'work' | 'appointment';
  title: string;
  start: DateTime;
  end: DateTime;
}

export interface DayContext {
  energy: Energy | null;
  sleep: { start: DateTime | null; end: DateTime | null; estimatedHours: number | null };
}

export interface Settings {
  bufferMinutes: number;
  earliestTime: string; // "HH:MM"
  latestTime: string;   // "HH:MM"
  gapMinutes: number;
  theme: Theme;
  motion: 'auto' | 'off';
}

export interface FocusTimer {
  uid: string;
  dayKey: DateKey;
  kind: 'focus' | 'start';
  durationSec: number;
  startedAt: number | null;
  accumulatedMs: number;
  finished: boolean;
}

export interface MyDayData {
  schemaVersion: 4;
  createdOn: DateKey;
  lists: Record<Category, ListItem[]>;
  queue: QueueItem[];
  days: Record<DateKey, Day>;
  nudge: { lastShownOn: DateKey | null; shrinkOn: DateKey | null };
  settings: Settings;
  commitments: Commitment[];
  context: Record<DateKey, DayContext>;
  timer: FocusTimer | null;
  celebratedOn: DateKey | null;
  saves: { seq: number; log: string[] }; // signatures that let a tab notice its save was replaced by another tab's

  // Calendar and Pay (added in schemaVersion 4).
  rota: Rota;
  pay: PaySettings;
  bankHolidays: BankHolidays;

  // Study (added in schemaVersion 4).
  study: StudyData;
  cybersecurity: CyberData; // learner evidence only; classic MyDay preserves this top-level section unread
  arabic: ArabicData; // Arabic Fuṣḥā sessions only (added after 1.15.0); classic MyDay preserves it unread too

  // Health: Workout and Food (described below).
  health: HealthData;

  // Finance: money owed, monthly expenses (added by the new app; the classic MyDay keeps it as it is, unread).
  finance: FinanceData;

  // Notes, grouped by category (added by the new app in 1.3.0; the classic MyDay keeps them as they are, unread).
  notes: NotesData;

  // Health → Goal: your fitness goal and answers (added by the new app in 1.3.0; the classic MyDay keeps it, unread).
  fitness: FitnessData;

  // Inbox → Tasks: one-off tasks with dates and your own lists (added by the new app in 1.5.0; the classic MyDay
  // keeps it unread). Today's repeating lists are `lists` above.
  tasks: TasksData;

  // What MyDay has noticed: your preferences and your answers to the patterns it found (added by the new app in
  // 1.6.0; the classic MyDay keeps it unread). The patterns themselves aren't saved: they're worked out from history.
  patterns: PatternsData;

  // Projects: everything about one intention in one place (added by the new app in 1.12.0; the classic MyDay keeps it
  // unread). Notes and tasks say which project they belong to (`projectId`); appointments are listed on the project.
  projects: ProjectsData;

  // Study → Reading: books you're reading, where you are, and your notes on each (added in 1.24.0; the classic
  // MyDay keeps it unread). Reading never counts towards the learning streak.
  reading: ReadingData;

  // Anything else (e.g. a section added by a newer MyDay) is kept as it was, never dropped.
  [other: string]: unknown;
}

// ---------- Projects (see data/projects.ts) ----------
// Where a project is on MyDay's progression: capture → understand → organise → explore → decide → act → reflect.
export type ProjectStage = 'capture' | 'understand' | 'organise' | 'explore' | 'decide' | 'act' | 'reflect';
export type ProjectStatus = 'active' | 'paused' | 'done';
export interface Project {
  id: string;
  title: string;
  summary: string;            // what it is and why it matters, in your words
  stage: ProjectStage;
  status: ProjectStatus;
  nextTaskId: string | null;  // the one next step (a task); none chosen → the first task still to do
  commitmentIds: string[];    // Calendar appointments that belong to it (listed here, so the Calendar's own records —
                              // shared with the classic MyDay — don't change)
  createdAt: DateTime;
  updatedAt: DateTime;
  // From 1.31.0 (optional; absent = none, so a project without them is saved exactly as before): see data/projectPlan.ts.
  milestones?: Milestone[];
  decisions?: Decision[];
  // From 1.32.0 (optional; absent = not private): you made it private, so Ask MyDay sends nothing of it. AI help with
  // notes may still offer its name and summary as a place to link notes (your choice, 17 Oct 2026).
  private?: true;
  // From 1.33.0 (optional; absent = a general project): the kind of project you chose, and — for a business idea —
  // its one page (see data/businessModel.ts). Switching back to general keeps the one page, just out of sight. A kind
  // this version doesn't know (from a newer MyDay) is kept as it is.
  template?: string;
  model?: BusinessModel;
}
export interface ProjectsData { items: Project[]; [other: string]: unknown }

// A milestone: a big marker on the way, in your order. `aim` is a date to aim for (guidance, never "late");
// `reachedOn` the day you ticked it reached.
export interface Milestone { id: string; title: string; aim: DateKey | null; reachedOn: DateKey | null; createdAt: DateTime; [other: string]: unknown }
// A decision: a question, 1–4 options each with its own pros and cons (no scores), and — once you choose — the chosen
// option, your reasons and the day. "Think again" clears the choice but keeps everything else, and remembers the last
// choice in `lastChoice`.
export interface DecisionOption { id: string; text: string; pros: string[]; cons: string[]; [other: string]: unknown }
export interface Decision {
  id: string; question: string; options: DecisionOption[];
  chosen: string | null; why: string; decidedOn: DateKey | null;
  lastChoice?: { text: string; on: DateKey };
  createdAt: DateTime; updatedAt: DateTime;
  [other: string]: unknown;
}
// A business idea on one page (1.33.0): four simple questions in your words. The fourth, what must be true, is a list
// of things you believe but haven't checked yet; each can be found out (a task in the project) and marked as it turns
// out — never by itself. Room to open out into a Lean Canvas later (unknown fields are kept).
export type AssumptionState = 'open' | 'looks-true' | 'doesnt-hold';
export interface Assumption {
  id: string; text: string; state: AssumptionState;
  found: string;              // what you found (optional)
  checkedOn: DateKey | null;  // the day you marked it (null while it's not checked yet)
  taskId: string | null;      // its "Find out" task, once you've added one
  createdAt: DateTime;
  [other: string]: unknown;
}
export interface BusinessModel { problem: string; who: string; how: string; assumptions: Assumption[]; [other: string]: unknown }

// ---------- Calendar: the shift rota ----------
export type ShiftType = 'day' | 'night' | 'off';
export type PlannedType = ShiftType | 'custom';
export type ActualStatus = 'worked' | 'sick' | 'annual_leave' | 'cancelled' | 'off' | 'custom';
export type EntryKind = 'overtime' | 'unauthorised';
export type ColourKey = 'day' | 'night' | 'off' | 'sick' | 'unauthorised' | 'annual_leave' | 'cancelled' | 'custom' | 'overtime' | 'appointment';

// One version of the repeating pattern. A change "from a date" adds a new version; earlier ones are kept.
export interface PatternVersion {
  id: string;
  effectiveFrom: DateKey | null;  // null = from the start
  anchor: DateKey;                // a date that is day 1 of the cycle
  cycle: ShiftType[];             // e.g. 4 × day, 4 × off, 4 × night, 4 × off
  times: Record<'day' | 'night', { start: string; end: string }>; // "HH:MM"; an end before the start = next day
  breaks: Record<'day' | 'night', number>;                         // unpaid break, minutes
}

// A change for one date only, stored apart from the pattern (the pattern itself never moves).
export interface DateOverride {
  planned?: { type: PlannedType; start?: string; end?: string; label?: string; breakMin?: number };
  actual?: { status: ActualStatus; start?: string; end?: string; label?: string; paid?: boolean };
}

// Overtime or unauthorised absence: its own start and end, separate from shifts.
export interface RotaEntry { id: string; kind: EntryKind; start: DateTime; end: DateTime; note: string }

export interface Rota {
  patterns: PatternVersion[];
  overrides: Record<DateKey, DateOverride>;
  entries: RotaEntry[];
  colours: Record<ColourKey, string>; // "#rrggbb"
}

// ---------- Pay ----------
export type PayFrequency = 'weekly' | 'fortnightly' | 'four_weekly' | 'monthly';
export type LoanPlan = 'plan1' | 'plan2' | 'plan4' | 'plan5' | 'postgrad';
export interface PaySettings {
  hourlyRate: number | null;
  nightMultiplier: number;
  overtimeMultiplier: number;
  bankHolidayMultiplier: number;
  bankHolidayHours: 'clock' | 'shift'; // hours falling on the day, or the whole shift starting that day
  annualLeavePaid: boolean;
  cancelledPaid: boolean;
  sickPay: 'ssp' | 'full' | 'percent';
  sickPercent: number;
  averageWeeklyEarnings: number | null;
  frequency: PayFrequency;
  periodAnchor: DateKey;
  taxCode: string;
  niCategory: 'A' | 'X';
  studentLoans: Record<LoanPlan, boolean>;
}

// ---------- Bank holidays (cached from gov.uk) ----------
export type BankHolidayRegion = 'england-and-wales' | 'scotland' | 'northern-ireland';
export interface BankHolidays {
  region: BankHolidayRegion;
  fetchedAt: DateTime | null;
  divisions: Record<BankHolidayRegion, { date: DateKey; title: string }[]> | null;
}

// ---------- Study ----------
// The roadmap is a nested outline: Stage → Course → Module → Section → Task.
// Completion only counts tasks you've marked complete — it isn't mastery.
export interface StudyTask { id: string; title: string; minutes: number; url: string; kind: 'learn' | 'practical'; note: string; done: boolean; doneOn: DateKey | null }
export interface StudySection { id: string; title: string; tasks: StudyTask[] }
export interface StudyModule { id: string; title: string; sections: StudySection[] }
export interface StudyCourse { id: string; title: string; url: string; minutes: number; listId: string | null; archived: boolean; modules: StudyModule[] }
export interface StudyStage { id: string; title: string; topicId?: string; courses: StudyCourse[] } // topicId: its Study topic (none = the first)
// A subject you study (e.g. Cybersecurity, Spanish), each with its own stages. Added in 1.3.0; data without topics is
// one roadmap, and the classic MyDay keeps topics as they are (it shows every stage).
export interface StudyTopic { id: string; title: string }

// Concepts are shared by learning (check-ins) and revision.
export interface Concept {
  id: string; title: string; taskIds: string[]; createdOn: DateKey;
  kind: 'written' | 'choice'; prompt: string; answer: string; explanation: string; choices: string[]; correct: number | null;
  hint: string; source: string; note: string; // note = a path in your Obsidian vault (never read by MyDay)
  review: { reps: number; interval: number; lapses: number; due: DateKey | null };
  origin?: ConceptOrigin; // absent for concepts you wrote
  anotherWay?: AnotherWay; // an explanation you kept (from 1.20.2)
}
// An explanation "another way" you kept on a revision card: the words, the model that wrote them, the day you kept it
// (data/study/anotherWay.ts). Concepts, Cybersecurity checks and Arabic cards can each hold one.
export interface AnotherWay { text: string; by: string; on: DateKey }
// A card an AI wrote and a second AI checked, that you kept (added in 1.19.0; both versions keep it). Its `source`
// says the same in words, so a version that doesn't know this field still shows where the card came from.
// subject 'cybersecurity': from a lesson (lessonId). From 1.19.1 both versions also keep origins for other subjects
// (e.g. a note), as short plain values, so cards from later sources survive a device or version that predates them.
export interface ConceptOrigin {
  by: 'ai'; subject: string;
  lessonId?: string;               // subject 'cybersecurity': the lesson
  writer: string; checker: string; // the models' names, as the server gave them
  edited: boolean;                 // you changed it before keeping it
  [other: string]: string | number | boolean | undefined;
}
export type Clarity = 'understand' | 'partly' | 'notyet';
export interface Checkin { conceptIds: string[]; clarity: Clarity | null; takeaway: string; question: string; note: string }
// A learning session. Time is by the clock, so it keeps counting while the phone sleeps.
export interface StudySession {
  id: string; courseId: string | null; taskId: string | null; title: string; date: DateKey; startedAt: string;
  plannedMin: number; short: boolean; status: 'active' | 'done'; runningSince: number | null; activeMs: number; endedAt: string | null;
  checkin: Checkin | null;
  taskDone: boolean | null; // your answer to "is the task complete?" (separate from how clear it felt)
  todayUid: string | null;  // the Today learning task ticked from this session, if any
}
export type Outcome = 'right' | 'partly' | 'wrong' | 'notsure';
export type Support = 'own' | 'hint' | 'notes';
export type Rating = 'again' | 'hard' | 'good';
// One answered revision question (kept even if the concept is later removed).
export interface Review {
  id: string; conceptId: string; title: string; date: DateKey; at: string; kind: 'written' | 'choice';
  outcome: Outcome | null; graded: 'auto' | 'self' | null; chosen: number | null; support: Support; rating: Rating; gap: number; due: DateKey | null;
}
export interface StudyData {
  stages: StudyStage[];
  topics?: StudyTopic[];        // absent until you add a topic (see data/study/topics.ts)
  focusCourseId: string | null; // the course on the dashboard (otherwise the first one with work left)
  concepts: Concept[];
  sessions: StudySession[];
  activeId: string | null;      // the session in progress, if any (only ever one)
  reviews: Review[];
  settings: { vault: string; showClock: boolean };
}

// ---------- Study → Reading ----------
// A book you're reading: where you are (page), and your notes on it. Total pages are optional — without
// them there's just the page number and no bar (never a percentage). Reaching the last page finishes the book.
export interface BookNote {
  id: string;
  page: number | null;   // the page the note is about, if given
  text: string;
  addedOn: DateKey;
}
export interface Book {
  id: string;
  title: string;
  author: string;        // may be ""
  pages: number | null;  // total pages, if you know them
  page: number;          // where you are (0 = not started; never past `pages`)
  notes: BookNote[];
  addedOn: DateKey;
  finishedOn: DateKey | null; // set when you reach the last page (or finish it yourself); the book folds away
}
export interface ReadingData {
  books: Book[];
  [other: string]: unknown;    // anything a newer MyDay adds here is kept
}

// ---------- Health: Workout ----------
// Same shape as the current MyDay saves it.
export type ExType = 'strength' | 'bodyweight' | 'cardio';
// Bodyweight exercises: just your body, with weight added (e.g. a belt), or with assistance (e.g. a band).
export type LoadMode = 'none' | 'added' | 'assisted';
export interface Exercise { id: string; name: string; type: ExType; archived: boolean }
// The numbers for one set. Which ones are used depends on the exercise type:
// strength: reps and weight (kg) · bodyweight: reps, plus load (kg) when added or assisted · cardio: minutes and km.
export interface SetValues {
  reps: number | null;
  weight: number | null;
  loadMode: LoadMode;
  load: number | null;
  durationMin: number | null;
  distanceKm: number | null;
}
// One exercise in a workout template, with its planned values.
export interface TemplateItem extends SetValues { id: string; exerciseId: string; sets: number; restSec: number }
export interface WorkoutTemplate { id: string; name: string; minutes: number; archived: boolean; items: TemplateItem[] }
export type ScheduleMode = 'off' | 'weekdays' | 'sequence';
export interface WorkoutSchedule {
  mode: ScheduleMode;
  weekdays: Record<number, string>; // 0 = Sunday … 6 = Saturday → template id
  sequence: string[];               // template ids, done in order on whichever days suit you
  next: number;                     // position in the sequence
  restDays: number;                 // rest days between proposed sessions
  since: DateKey | null;            // when the weekday schedule started (earlier days are never "missed")
}
// One date's workout: planned, or what became of a missed one (skipped / moved / continued).
export interface WorkoutPlan { templateId: string; time: string | null; status: 'planned' | 'skipped' | 'moved' | 'continued'; source: 'proposal' | 'manual' }
export interface LoggedSet extends SetValues { done: boolean }
// An exercise inside a logged session: a snapshot of the plan at the time, kept apart from what you did.
export interface SessionExercise {
  key: string;
  exerciseId: string | null;
  name: string;
  type: ExType;
  plan: { sets: number; restSec: number } & SetValues;
  prefill: 'last' | 'plan';
  sets: LoggedSet[];
}
export interface WorkoutSession {
  id: string;
  date: DateKey;
  templateId: string | null;
  templateName: string;
  startedAt: string;
  finishedAt: string | null;
  status: 'active' | 'done' | 'short'; // short = finished with some sets not done
  plannedDate: DateKey | null;
  editedAt: string | null;             // when a logged result was last corrected
  exercises: SessionExercise[];
}
export interface WorkoutData {
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  schedule: WorkoutSchedule;
  planned: Record<DateKey, WorkoutPlan>;
  sessions: WorkoutSession[];
  activeId: string | null;
  restTimer: { enabled: boolean; seconds: number };
  rest: { startedAt: number; durationSec: number } | null; // a running rest countdown
}
// ---------- Inbox → Tasks (see data/tasks.ts) ----------
export interface TaskList { id: string; name: string }
export interface TaskItem {
  id: string;
  title: string;
  listId: string;             // one of your lists, or '' for none
  category: Category;         // Learning / Admin / Health (for Today's plan)
  minutes: number;            // roughly how long
  due: DateKey | null;        // a date, if it has one
  time: string | null;        // "HH:MM" on that date, if it has one
  notes: string;
  done: boolean;
  doneOn: DateKey | null;
  plannedOn: DateKey | null;  // the day it was added to that day's plan…
  planUid: string | null;     // …as this task there (ticking either one off ticks both)
  createdAt: DateTime;
  // Added in 1.6.0 (absent before → 0, none, null):
  postponed: number;          // times you moved its date later ("Tomorrow", or a later date)
  blockers: { reason: Blocker; on: DateKey }[]; // your answers to "What's getting in the way?"
  letGoOn: DateKey | null;    // you decided it doesn't matter any more ("Let it go")
  projectId?: string;         // the project it belongs to (1.12.0; absent → none)
}
export type Blocker = 'big' | 'start' | 'boring' | 'tired' | 'info' | 'notneeded' | 'other';
export interface TasksData { lists: TaskList[]; items: TaskItem[]; [other: string]: unknown }

// ---------- What MyDay has noticed (see data/patterns/) ----------
// A preference: something you chose, or a pattern you said was right and asked MyDay to use.
export interface Pref { value: number; on: DateKey; from: string | null; why: string }
export interface PatternAnswer { said: 'yes' | 'no'; on: DateKey; examples: number; title: string }
export interface PatternsData {
  // name: what MyDay calls you (from 1.11.0); aiNotes: you let AI help place notes in projects (1.15.0; absent = off)
  prefs: { maxMinutes: Record<Category, Pref | null>; maxTasks: Pref | null; name?: string; aiNotes?: true; [other: string]: unknown };
  answers: Record<string, PatternAnswer>; // by pattern id, e.g. "size:learning"
  [other: string]: unknown;
}

// ---------- Health → Goal (see data/goals.ts) ----------
export type GoalKind = 'lose' | 'gain' | 'recomp' | 'maintain' | 'health';
export type Sex = 'female' | 'male' | 'unsaid';
export type Activity = 'sitting' | 'some' | 'onFeet' | 'hard';
export type Experience = 'new' | 'some' | 'experienced';
export type Equipment = 'gym' | 'home' | 'none';
export type Pace = 'gentle' | 'steady';
export type Condition = 'diabetes' | 'kidney' | 'heart' | 'other';

export interface GoalAnswers {
  goal: GoalKind;
  age: number;          // years
  sex: Sex;             // only used in the calorie formula
  heightCm: number;
  weightKg: number;
  activity: Activity;
  experience: Experience;
  days: number;         // days a week you could train (1–7)
  equipment: Equipment;
  pace: Pace;           // for losing or gaining
  pregnant: boolean;    // pregnant or breastfeeding
  eatingDisorder: 'no' | 'yes' | 'unsaid';
  conditions: Condition[];
}
export interface FitnessData {
  units: 'metric' | 'imperial';
  answers: GoalAnswers | null;
  setOn: DateKey | null;
  [other: string]: unknown; // anything a newer MyDay adds here is kept
}

// ---------- Notes ----------
// Your own categories (Lifestyle, Business ideas…), renamed, added or removed as you like.
export interface NoteCategory { id: string; name: string }
export interface Note {
  id: string;
  categoryId: string;   // one of the categories (a note whose category has gone shows under "Other")
  title: string;
  text: string;
  pinned: boolean;
  createdAt: DateTime;  // "YYYY-MM-DDTHH:MM" on this device
  updatedAt: DateTime;
  projectId?: string;   // the project it belongs to (1.12.0; absent → none)
  // Added in 1.13.0 (each absent unless set):
  linkedBy?: 'rules' | 'ai'; // MyDay put it in that project by itself (absent: you did) — listed with Undo / Keep
  linkWhy?: string;          // why, in a few words ("coffee · offices")
  notProjects?: string[];    // projects you took it out of: MyDay never puts it back in those
  private?: true;            // never sent to AI help (it still syncs with your own account)
  // Added in 1.15.0, when AI help has looked at the note (each absent until then):
  aiKind?: 'idea' | 'task' | 'question' | 'reference' | 'journal' | 'other'; // what kind of note it seemed to be
  aiSeen?: string;           // a fingerprint of the words it saw, so it's asked again only if you change them
}
export interface NotesData {
  categories: NoteCategory[];
  items: Note[];
  [other: string]: unknown;    // anything a newer MyDay adds here is kept
}

// ---------- Finance ----------
// Money you owe someone, or someone owes you. Amounts are in pounds (2 decimal places).
export interface Debt {
  id: string;
  direction: 'owe' | 'owed';  // owe = you owe them; owed = they owe you
  person: string;
  amount: number;
  note: string;
  since: DateKey;
}
// Something you pay every month (rent, phone, subscriptions…).
export interface Expense {
  id: string;
  name: string;
  amount: number;              // per month
}
export interface FinanceData {
  ratesSetOn: DateKey | null;  // when your pay rates were first set from Finance (done once; see data/finance.ts)
  debts: Debt[];
  expenses: Expense[];
  [other: string]: unknown;    // anything a newer MyDay adds here is kept
}

export interface HealthData {
  workout: WorkoutData;
  food: FoodData;
  daily: DailyData;
  [other: string]: unknown;
}

// ---------- Health: Daily exercises ----------
// Everyday movements with a daily target and a set size ("150 push-ups, in sets of 25"). One tap on
// Today logs one set; each tap's reps are kept so a mis-tap can be undone. Missed days cost nothing:
// every morning starts from the full target again, and changes apply from today (history stays as it was).
export interface DailyExercise {
  id: string;
  name: string;
  target: number;    // reps to do each day (1–1000)
  set: number;       // reps per tap (1–500, never more than target)
  archived: boolean; // archived: off Today and the count, history kept
}
export interface DailyData {
  exercises: DailyExercise[];
  log: Record<DateKey, Record<string, number[]>>; // day → exercise id → each tap's reps, in order
}

// ---------- Health: Food ----------
// Same shape as the current MyDay saves it. Recipe ideas come from TheMealDB, which lists no servings,
// times or nutrition: those stay null ("not listed") unless you enter them yourself.
export interface Nutrition { kcal: number | null; protein: number | null; carbs: number | null; fat: number | null } // per serving
export interface Recipe {
  id: string;                          // "mdb-<TheMealDB id>" or "r…" for your own
  source: 'themealdb' | 'manual';
  title: string;
  sourceUrl: string;                   // the original recipe's web page (or your own link)
  sourceName: string;                  // your recipe: where it's from
  mealDbUrl: string;                   // TheMealDB's page for it
  video: string;
  thumb: string;                       // photo address (TheMealDB); only the address is saved, never the image
  category: string;
  area: string;
  tags: string[];
  ingredients: { name: string; measure: string }[];
  instructions: string;                // the original method, kept exactly
  servings: number | null;
  servingsSource: 'user' | 'recipe' | null; // "user": you entered it for a TheMealDB recipe
  prepMin: number | null;
  cookMin: number | null;
  effort: 'easy' | 'medium' | 'hard' | null;
  batch: boolean | null;               // null = not known
  nutrition: Nutrition | null;
  nutritionSource: 'user' | null;      // only ever entered by you; MyDay never estimates nutrition
  savedAt: string;
}
export interface FoodPrefs { exclude: string[]; dislikes: string[]; maxMinutes: number | null; batchOnly: boolean }
export interface WantItem { id: string; recipeId: string; servings: number | null; addedOn: DateKey }
// Cooking history: a recipe you finished cooking. It is never a record of food eaten.
export interface CookedItem { id: string; recipeId: string; title: string; date: DateKey; servings: number | null }
export type UnitFamily = 'g' | 'ml' | 'tsp' | 'cup' | 'oz' | 'count';
// A shopping-list item. With a unit family, `amount` is in its base unit (g, ml, tsp, cup, oz, or a count
// of `unit`) and items with the same family, unit and name combine. Otherwise `text` keeps the quantity
// exactly as written (e.g. "pinch", "1-2"), and it's never combined.
export interface ShoppingItem {
  id: string;
  name: string;
  family: UnitFamily | null;
  amount: number | null;
  unit: string;
  text: string;
  category: string;
  checked: boolean;
  recipes: string[];                   // titles of the recipes it's for
  manual: boolean;
}
export interface CookTimer { label: string; durationSec: number; startedAt: number | null; accumulatedMs: number; finished: boolean }
// The recipe being cooked, and where you are in it.
export interface Cooking { recipeId: string; step: number; servings: number | null; startedAt: string; timer: CookTimer | null }
export interface FoodData {
  prefs: FoodPrefs;
  recipes: Record<string, Recipe>;     // your own recipes, plus TheMealDB recipes you saved, favourited, planned or cooked
  favourites: string[];
  want: WantItem[];
  cooked: CookedItem[];
  shopping: ShoppingItem[];
  cooking: Cooking | null;
}
