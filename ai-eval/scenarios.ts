// 20 synthetic MyDay days for evaluating "Help me adjust today". Everything here is made up: no real records,
// tasks, sleep or health information. Each scenario sets the clock (Europe/London), builds saved data from the
// app's defaults, and says what a useful suggestion would do (checked automatically; see run.ts).
import type { Category, MyDayData, Task } from '../app/src/data/types';

export interface Expect {
  restExpected?: boolean;   // rest, or nothing more today, is the right answer
  maxTotalMinutes?: number; // the suggestion should fit within this many minutes
  minPriorities?: number;   // a useful suggestion has at least this many tasks (and isn't rest)
  missing?: ('energy' | 'sleep')[]; // the model should say this information is missing
  nothingTimedIn?: [string, string]; // no suggested time in this window (e.g. a shift), "HH:MM"
}
export interface Scenario {
  id: string;
  title: string;
  tags: string[];        // low-energy, poor-sleep, shift, appointments, little-time, revision, rest, missing-info
  now: string;           // "YYYY-MM-DDTHH:MM" (Europe/London)
  note: string;          // the optional message
  build: (s: MyDayData) => void;
  expect: Expect;
}

// ---------- Helpers for made-up data ----------
const task = (uid: string, title: string, category: Category, minutes: number, extra: Partial<Task> = {}): Task => ({
  uid, taskId: null, category, title, minutes, baseMinutes: minutes, done: false, shrunk: false, fromQueue: null, rolledQid: null, scheduledStart: null, scheduledEnd: null, ...extra,
});
const LEARN = (m = 30, x: Partial<Task> = {}) => task('u-learn', 'Networking course — one section', 'learning', m, x);
const ADMIN = (m = 45, x: Partial<Task> = {}) => task('u-admin', 'Batch cook two meals', 'admin', m, x);
const HEALTH = (m = 60, x: Partial<Task> = {}) => task('u-health', 'Gym session', 'health', m, x);
const SMALL = (m = 15) => task('u-small', 'Laundry', 'admin', m);
function plan(s: MyDayData, k: string, energy: 1 | 2 | 3 | 4 | 5 | null, tasks: Task[]) {
  s.days[k] = { energy, rest: false, builtAt: `${k}T08:00`, checkedIn: false, tasks };
  if (energy !== null) s.context[k] = { energy, sleep: s.context[k] ? s.context[k].sleep : { start: null, end: null, estimatedHours: null } };
}
function sleep(s: MyDayData, k: string, start: string | null, end: string | null, hours: number | null = null) {
  const c = s.context[k] || { energy: null, sleep: { start: null, end: null, estimatedHours: null } };
  c.sleep = { start, end, estimatedHours: hours };
  s.context[k] = c;
}
function shifts(s: MyDayData, anchor: string, cycle: ('day' | 'night' | 'off')[]) {
  s.rota.patterns = [{ id: 'p1', effectiveFrom: null, anchor, cycle, times: { day: { start: '07:00', end: '19:00' }, night: { start: '19:00', end: '07:00' } }, breaks: { day: 30, night: 30 } }];
}
const appt = (s: MyDayData, id: string, start: string, end: string) => s.commitments.push({ id, kind: 'appointment', title: 'Appointment', start, end });
const D = '2026-11-10'; // a Tuesday with no clock change

export const SCENARIOS: Scenario[] = [
  { id: 's01-energy-1', title: 'Energy 1 with three tasks left from a better morning', tags: ['low-energy'], now: `${D}T10:00`, note: '',
    build: s => { plan(s, D, 4, [LEARN(), ADMIN(), HEALTH()]); s.context[D].energy = 1; sleep(s, D, '2026-11-09T23:30', `${D}T06:30`); },
    expect: { maxTotalMinutes: 20 } },
  { id: 's02-energy-2-20min', title: 'Energy 2 and only 20 minutes', tags: ['low-energy', 'little-time'], now: `${D}T15:00`, note: 'I only have 20 minutes today',
    build: s => { plan(s, D, 2, [LEARN(), ADMIN()]); sleep(s, D, '2026-11-09T23:00', `${D}T06:00`); },
    expect: { maxTotalMinutes: 20 } },
  { id: 's03-poor-sleep', title: 'Energy 3 after 3½ hours of sleep', tags: ['poor-sleep'], now: `${D}T09:00`, note: 'I slept badly',
    build: s => { plan(s, D, 3, [LEARN(), ADMIN()]); sleep(s, D, `${D}T00:30`, `${D}T04:00`); },
    expect: { maxTotalMinutes: 45 } },
  { id: 's04-good-day', title: 'Energy 5, slept well, a clear day', tags: ['baseline'], now: `${D}T09:00`, note: '',
    build: s => { plan(s, D, 5, [LEARN(), ADMIN(), HEALTH()]); sleep(s, D, '2026-11-09T22:30', `${D}T06:30`); },
    expect: { minPriorities: 2 } },
  { id: 's05-day-shift-morning', title: 'Before a 07:00–19:00 day shift', tags: ['shift', 'little-time'], now: `${D}T05:45`, note: '',
    build: s => { shifts(s, D, ['day']); plan(s, D, 3, [LEARN(), SMALL()]); sleep(s, D, '2026-11-09T21:30', `${D}T05:15`); s.settings.earliestTime = '05:30'; },
    expect: { nothingTimedIn: ['06:30', '19:30'] } },
  { id: 's06-day-shift-evening', title: 'After a day shift, energy 2', tags: ['shift', 'low-energy'], now: `${D}T19:40`, note: '',
    build: s => { shifts(s, D, ['day']); plan(s, D, 2, [LEARN(), ADMIN()]); sleep(s, D, '2026-11-09T22:00', `${D}T05:30`); },
    expect: { maxTotalMinutes: 20, nothingTimedIn: ['06:30', '19:30'] } },
  { id: 's07-night-shift-tonight', title: 'A night shift tonight (19:00–07:00)', tags: ['shift'], now: `${D}T10:00`, note: '',
    build: s => { shifts(s, D, ['night', 'off']); plan(s, D, 3, [LEARN(), ADMIN(), HEALTH()]); sleep(s, D, '2026-11-09T23:00', `${D}T07:00`); },
    expect: { minPriorities: 1, nothingTimedIn: ['18:30', '23:59'] } },
  { id: 's08-after-night-shift', title: 'Woke at 14:00 after a night shift, energy 2, an appointment 16:00–16:30', tags: ['shift', 'poor-sleep', 'low-energy', 'appointments'], now: `${D}T14:30`, note: '',
    build: s => { shifts(s, '2026-11-09', ['night', 'off']); appt(s, 'c1', `${D}T16:00`, `${D}T16:30`); plan(s, D, 2, [LEARN(), ADMIN()]); sleep(s, D, `${D}T08:00`, `${D}T14:00`); },
    expect: { maxTotalMinutes: 20, nothingTimedIn: ['15:30', '16:30'] } },
  { id: 's09-clocks-go-back', title: 'After a 13-hour night shift as the clocks go back, sleep not recorded', tags: ['shift', 'missing-info'], now: '2026-10-25T08:30', note: '',
    build: s => { shifts(s, '2026-10-24', ['night', 'off']); plan(s, '2026-10-25', 2, [LEARN(), SMALL()]); },
    expect: { maxTotalMinutes: 20, missing: ['sleep'], nothingTimedIn: ['00:00', '07:30'] } },
  { id: 's10-appointment', title: 'An appointment 11:00–12:00, energy 4', tags: ['appointments'], now: `${D}T09:00`, note: '',
    build: s => { appt(s, 'c1', `${D}T11:00`, `${D}T12:00`); plan(s, D, 4, [LEARN(), ADMIN(), HEALTH()]); sleep(s, D, '2026-11-09T23:00', `${D}T07:00`); },
    expect: { minPriorities: 1, nothingTimedIn: ['10:30', '12:30'] } },
  { id: 's11-busy-afternoon', title: 'Three appointments, finishing by 18:00', tags: ['appointments', 'little-time'], now: `${D}T09:30`, note: '',
    build: s => { appt(s, 'c1', `${D}T10:00`, `${D}T11:00`); appt(s, 'c2', `${D}T13:00`, `${D}T14:30`); appt(s, 'c3', `${D}T16:00`, `${D}T17:00`); s.settings.latestTime = '18:00';
      plan(s, D, 3, [LEARN(), ADMIN(), HEALTH()]); sleep(s, D, '2026-11-09T23:00', `${D}T07:00`); },
    expect: { minPriorities: 1 } },
  { id: 's12-evening-45min', title: '20:15, with 45 minutes until the end of the day', tags: ['little-time'], now: `${D}T20:15`, note: '',
    build: s => { plan(s, D, 4, [LEARN(), ADMIN(), HEALTH()]); sleep(s, D, '2026-11-09T23:00', `${D}T07:00`); },
    expect: { maxTotalMinutes: 45 } },
  { id: 's13-too-late', title: '21:30, after the latest time for tasks', tags: ['little-time', 'rest'], now: `${D}T21:30`, note: '',
    build: s => { plan(s, D, 3, [LEARN(), ADMIN()]); sleep(s, D, '2026-11-09T23:00', `${D}T07:00`); },
    expect: { restExpected: true } },
  { id: 's14-revision-due', title: 'Three Study items due for revision', tags: ['revision'], now: `${D}T10:00`, note: '',
    build: s => { plan(s, D, 3, [LEARN(), SMALL()]); sleep(s, D, '2026-11-09T23:00', `${D}T07:00`);
      for (let i = 1; i <= 3; i++) s.study.concepts.push({ id: `cn${i}`, title: `Concept ${i}`, taskIds: [], createdOn: '2026-11-01', kind: 'written', prompt: `Question ${i}?`, answer: 'An answer', explanation: '', choices: [], correct: null, hint: '', source: '', note: '', review: { reps: 1, interval: 2, lapses: 0, due: '2026-11-09' } }); },
    expect: { minPriorities: 1 } },
  { id: 's15-rest-requested', title: 'Asks for a rest day', tags: ['rest'], now: `${D}T09:30`, note: 'I need a rest day today',
    build: s => { plan(s, D, 3, [LEARN(), ADMIN()]); sleep(s, D, '2026-11-09T23:00', `${D}T07:00`); },
    expect: { restExpected: true } },
  { id: 's16-already-rest', title: 'Today is already a rest day', tags: ['rest'], now: `${D}T11:00`, note: '',
    build: s => { s.days[D] = { energy: 2, rest: true, builtAt: `${D}T08:00`, checkedIn: false, tasks: [] }; s.context[D] = { energy: 2, sleep: { start: '2026-11-09T23:00', end: `${D}T07:00`, estimatedHours: null } }; },
    expect: { restExpected: true } },
  { id: 's17-energy-missing', title: "Energy and sleep aren't recorded", tags: ['missing-info'], now: `${D}T11:00`, note: '',
    build: s => { plan(s, D, null, [LEARN(), ADMIN()]); },
    expect: { maxTotalMinutes: 20, missing: ['energy', 'sleep'] } },
  { id: 's18-sleep-missing', title: "Tired, and last night's sleep isn't recorded", tags: ['missing-info', 'poor-sleep'], now: `${D}T10:30`, note: 'feeling tired',
    build: s => { plan(s, D, 3, [LEARN(), ADMIN()]); },
    expect: { missing: ['sleep'] } },
  { id: 's19-one-done', title: 'Energy 3, one task already done', tags: ['baseline'], now: `${D}T11:00`, note: '',
    build: s => { plan(s, D, 3, [LEARN(30, { done: true, scheduledStart: `${D}T09:00`, scheduledEnd: `${D}T09:30` }), ADMIN(), HEALTH()]); sleep(s, D, '2026-11-09T23:00', `${D}T07:00`); },
    expect: { minPriorities: 1, nothingTimedIn: ['09:00', '09:30'] } },
  { id: 's20-long-tasks-low-energy', title: 'Energy 2 and only long tasks', tags: ['low-energy'], now: `${D}T10:00`, note: '',
    build: s => { plan(s, D, 2, [ADMIN(60), HEALTH(90)]); sleep(s, D, '2026-11-09T23:00', `${D}T07:00`); },
    expect: { maxTotalMinutes: 20 } },
];
