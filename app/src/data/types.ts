// The shape of MyDay's saved data: localStorage key "myday.data.v4", schemaVersion 4.
// It must match the current MyDay (../index.html) exactly, because both versions use the same saved data.
// If a field is added or changed, the current MyDay needs the same change and a new schemaVersion (see CLAUDE.md).

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

  // Anything else (e.g. a section added by a newer MyDay) is kept as it was, never dropped.
  [other: string]: unknown;
}

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
}
export type Blocker = 'big' | 'start' | 'boring' | 'tired' | 'info' | 'notneeded' | 'other';
export interface TasksData { lists: TaskList[]; items: TaskItem[]; [other: string]: unknown }

// ---------- What MyDay has noticed (see data/patterns/) ----------
// A preference: something you chose, or a pattern you said was right and asked MyDay to use.
export interface Pref { value: number; on: DateKey; from: string | null; why: string }
export interface PatternAnswer { said: 'yes' | 'no'; on: DateKey; examples: number; title: string }
export interface PatternsData {
  prefs: { maxMinutes: Record<Category, Pref | null>; maxTasks: Pref | null; name?: string; [other: string]: unknown }; // name: what MyDay calls you (from 1.11.0)
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
  [other: string]: unknown;
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
