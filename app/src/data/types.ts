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

  // Not described yet: kept exactly as saved until their screens move to the new app.
  rota?: unknown;
  pay?: unknown;
  bankHolidays?: unknown;
  health?: unknown;
  study?: unknown;

  // Anything else (e.g. a section added by a newer MyDay) is kept as it was, never dropped.
  [other: string]: unknown;
}
