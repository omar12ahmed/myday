// The contract between MyDay and its AI planner: what the app sends (PlanContext) and what the model must send
// back (ModelProposal). The app, the Edge Function and the evaluation all use this one file, so they always agree.
// No imports and no runtime-specific code: Deno (the Edge Function), Node (tests, evaluation) and Vite (the app)
// all load it as it is.

export const CONTRACT_VERSION = 1;

// Size limits, checked by the Edge Function before anything is sent to a model.
export const LIMITS = {
  noteChars: 200,        // the optional message, e.g. "I slept badly and only have 20 minutes"
  tasks: 12,
  titleChars: 120,
  busy: 40,
  free: 24,
  bodyBytes: 16_000,     // the whole request
  explanationChars: 280, // longer explanations are shortened by the app
  missingItems: 4,
  missingChars: 90,
};

// "Small" for a low-energy day (energy 1–2, or energy not recorded).
export const SMALL_MINUTES = 20;

export type Clock = string;    // "HH:MM", today
export type LocalTime = string; // "YYYY-MM-DDTHH:MM" in the device's time zone (wall-clock), for times that may cross midnight

export interface ContextTask {
  id: string;             // the task's id on today's plan
  title: string;
  category: 'learning' | 'admin' | 'health';
  minutes: number;        // as currently planned today
  plannedMinutes: number; // the task's full length (never suggest longer)
  done: boolean;
  start: Clock | null;    // its time today, if it has one
}

// Time that's taken. Labels are left out on purpose (an appointment is just "appointment").
export interface ContextBlock {
  kind: 'work' | 'appointment' | 'workout' | 'sleep' | 'prep';
  start: LocalTime;
  end: LocalTime;
}

export interface Sleep { start: LocalTime | null; end: LocalTime | null; hours: number | null }

export interface PlanContext {
  version: 1;
  date: string;            // YYYY-MM-DD, today on this device
  weekday: string;         // e.g. "Saturday"
  now: Clock;              // the time now
  timezone: string;        // the device's time zone, e.g. "Europe/London" (MyDay has no time zone setting of its own)
  energy: number | null;   // 1–5 as rated today; null = not recorded
  maxPriorities: number;   // more tasks today has room for: the energy rule (1 for energy 1–2 or unknown, 2 for 3,
                           // 3 for 4–5) minus tasks already done; 0 = nothing more today
  smallOnly: boolean;      // true for energy 1–2 or unknown: one small task only
  smallMinutes: number;    // what "small" means, in minutes
  restDay: boolean;        // today is already a rest day
  sleep: { lastNight: Sleep | null; tonight: Sleep | null };
  tasks: ContextTask[];
  busy: ContextBlock[];    // shifts, appointments, workouts, sleep and prep/travel time around today
  free: { start: Clock; end: Clock }[]; // today's free time where tasks may go (from now on)
  window: { earliest: Clock; latest: Clock }; // the part of the day for tasks
  revisionDue: number;     // Study items due for revision today (for information)
  note: string | null;     // what you wrote, if anything
}

// What the model must return (JSON only).
export interface ModelProposal {
  rest: boolean;
  priorities: { taskId: string; minutes: number; start: Clock | null }[];
  explanation: string;
  missing: string[];
}

// The same, as a JSON schema (in the instructions, and for anyone checking the contract).
export const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['rest', 'priorities', 'explanation', 'missing'],
  properties: {
    rest: { type: 'boolean' },
    priorities: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['taskId', 'minutes', 'start'],
        properties: {
          taskId: { type: 'string' },
          minutes: { type: 'integer', minimum: 5 },
          start: { type: ['string', 'null'], pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
        },
      },
    },
    explanation: { type: 'string', maxLength: LIMITS.explanationChars },
    missing: { type: 'array', maxItems: LIMITS.missingItems, items: { type: 'string', maxLength: LIMITS.missingChars } },
  },
} as const;
