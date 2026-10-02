// Checks saved data and fills in anything missing, the same way as normalize() in the current MyDay.
// Bad entries are dropped and counted rather than crashing the app. Sections not described in types.ts
// yet (health, study…) and anything unknown are kept exactly as they were.
import { normalizeBankHolidays } from './bankHolidays';
import { isDateKey, isDateTime, isTime, todayKey } from './dates';
import { normalizePay, defaultPay } from './pay';
import { emptyRota, normalizeRota } from './rota';
import type { Category, Commitment, DayContext, Energy, ListItem, MyDayData, QueueItem, Settings, Task, Theme } from './types';
import { clone, intIn, isObj, listOf, uid, cleanMinutes } from './util';

// The small helpers live in util.ts; they're re-exported here for the files that already use them.
export { clone, intIn, isObj, listOf, uid, cleanMinutes };

export const SCHEMA_VERSION = 4;
export const SAVE_LOG = 20; // how many recent save signatures travel with the data (see storage.ts)
export const CATS: Category[] = ['learning', 'admin', 'health'];
const THEMES: Theme[] = ['dark', 'light', 'auto'];
export const DEFAULT_SETTINGS: Settings = { bufferMinutes: 30, earliestTime: '08:00', latestTime: '21:00', gapMinutes: 10, theme: 'dark', motion: 'auto' };

// The starter task lists, used when a list is missing.
export const SEED: Record<Category, ListItem[]> = {
  learning: [
    { id: 'l1', title: 'TryHackMe: Pre-Security path — one section', minutes: 30 },
    { id: 'l2', title: 'OverTheWire Bandit — one level', minutes: 20 },
    { id: 'l3', title: 'HTB Academy: Networking module — one section', minutes: 30 },
    { id: 'l4', title: 'HTB Academy: Web Requests module — one section', minutes: 30 },
  ],
  admin: [
    { id: 'a1', title: 'Laundry', minutes: 15 },
    { id: 'a2', title: 'Bulk cook 2 meals', minutes: 60 },
    { id: 'a3', title: 'Clean room (10 min timer)', minutes: 10 },
    { id: 'a4', title: 'Groceries', minutes: 30 },
  ],
  health: [
    { id: 'h1', title: 'Gym', minutes: 60 },
    { id: 'h2', title: 'Meal prep', minutes: 45 },
    { id: 'h3', title: '20-min walk', minutes: 20 },
  ],
};

const isCategory = (v: unknown): v is Category => CATS.includes(v as Category);
const isEnergy = (v: unknown): v is Energy => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5;
const idOr = (v: unknown, fallback: () => string) => (typeof v === 'string' && v ? v : fallback());
const stringOrNull = (v: unknown) => (typeof v === 'string' ? v : null);

export function freshState(): MyDayData {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdOn: todayKey(),
    lists: clone(SEED),
    queue: [],
    days: {},
    nudge: { lastShownOn: null, shrinkOn: null },
    settings: { ...DEFAULT_SETTINGS },
    commitments: [],
    context: {},
    timer: null,
    celebratedOn: null,
    rota: emptyRota(),
    pay: defaultPay(),
    bankHolidays: { region: 'england-and-wales', fetchedAt: null, divisions: null },
    saves: { seq: 0, log: [] },
  };
}

function cleanListItem(o: unknown): ListItem | null {
  if (!isObj(o) || typeof o.title !== 'string' || !o.title.trim()) return null;
  return { id: idOr(o.id, () => 'x' + uid()), title: o.title.trim(), minutes: cleanMinutes(o.minutes, 20) };
}

function cleanQueueItem(o: unknown): QueueItem | null {
  if (!isObj(o) || !isCategory(o.category) || typeof o.title !== 'string' || !o.title.trim()) return null;
  return {
    qid: idOr(o.qid, uid),
    taskId: stringOrNull(o.taskId),
    category: o.category,
    title: o.title.trim(),
    minutes: cleanMinutes(o.minutes, 20),
    queuedOn: isDateKey(o.queuedOn) ? o.queuedOn : todayKey(),
    sourceUid: stringOrNull(o.sourceUid),
  };
}

function cleanTask(o: unknown): Task | null {
  if (!isObj(o) || !isCategory(o.category) || typeof o.title !== 'string' || !o.title.trim()) return null;
  const base = cleanMinutes(o.baseMinutes, cleanMinutes(o.minutes, 20));
  let s = isDateTime(o.scheduledStart) ? o.scheduledStart : null;
  let e = isDateTime(o.scheduledEnd) ? o.scheduledEnd : null;
  if (!s || !e || e <= s) { s = null; e = null; }
  return {
    uid: idOr(o.uid, uid),
    taskId: stringOrNull(o.taskId),
    category: o.category,
    title: o.title.trim(),
    minutes: cleanMinutes(o.minutes, base),
    baseMinutes: base,
    done: o.done === true,
    shrunk: o.shrunk === true,
    fromQueue: o.fromQueue ? cleanQueueItem(o.fromQueue) : null,
    rolledQid: stringOrNull(o.rolledQid),
    scheduledStart: s,
    scheduledEnd: e,
  };
}

function cleanCommitment(o: unknown): Commitment | null {
  if (!isObj(o) || !isDateTime(o.start) || !isDateTime(o.end) || o.end <= o.start) return null;
  const kind = o.kind === 'work' ? 'work' : 'appointment';
  const title = typeof o.title === 'string' && o.title.trim() ? o.title.trim() : kind === 'work' ? 'Work shift' : 'Appointment';
  return { id: idOr(o.id, () => 'c' + uid()), kind, title, start: o.start, end: o.end };
}

function cleanContext(o: unknown): DayContext | null {
  if (!isObj(o)) return null;
  const sl = isObj(o.sleep) ? o.sleep : {};
  const est = Number(sl.estimatedHours);
  return {
    energy: isEnergy(o.energy) ? o.energy : null,
    sleep: {
      start: isDateTime(sl.start) ? sl.start : null,
      end: isDateTime(sl.end) ? sl.end : null,
      estimatedHours: sl.estimatedHours !== null && sl.estimatedHours !== undefined && est > 0 && est <= 24 ? Math.round(est * 4) / 4 : null,
    },
  };
}

// Turns anything roughly the right shape (version 2, 3 or 4) into valid version-4 data.
// Throws only if the input isn't an object at all; otherwise drops bad entries and counts them.
export function normalize(raw: unknown, report = { dropped: 0 }): MyDayData {
  if (!isObj(raw)) throw new Error('Not a MyDay data object.');
  const s = freshState();

  if (isObj(raw.lists)) {
    for (const cat of CATS) {
      const list = raw.lists[cat];
      if (!Array.isArray(list)) { s.lists[cat] = clone(SEED[cat]); continue; }
      const seen = new Set<string>();
      s.lists[cat] = [];
      for (const item of list) {
        const c = cleanListItem(item);
        if (!c) { report.dropped++; continue; }
        if (seen.has(c.id)) c.id = cat[0] + uid();
        seen.add(c.id);
        s.lists[cat].push(c);
      }
    }
  }

  if (isObj(raw.days)) {
    for (const k of Object.keys(raw.days)) {
      const d = raw.days[k];
      if (!isDateKey(k) || !isObj(d)) { report.dropped++; continue; }
      const tasks: Task[] = [];
      for (const t of listOf(d.tasks)) { const c = cleanTask(t); if (c) tasks.push(c); else report.dropped++; }
      const energy = isEnergy(d.energy) ? d.energy : null;
      const rest = d.rest === true || (!tasks.length && energy === null);
      s.days[k] = {
        energy,
        rest,
        builtAt: typeof d.builtAt === 'string' ? d.builtAt : '',
        checkedIn: d.checkedIn === true,
        tasks: rest ? [] : tasks,
      };
    }
  }

  const seenQ = new Set<string>(), seenTask = new Set<string>();
  for (const q of listOf(raw.queue)) {
    const c = cleanQueueItem(q);
    if (!c) { report.dropped++; continue; }
    if (seenQ.has(c.qid) || (c.taskId && seenTask.has(c.taskId))) continue; // never keep duplicates
    seenQ.add(c.qid);
    if (c.taskId) seenTask.add(c.taskId);
    s.queue.push(c);
  }
  s.queue.sort((a, b) => (a.queuedOn < b.queuedOn ? -1 : a.queuedOn > b.queuedOn ? 1 : 0));

  if (isDateKey(raw.createdOn)) s.createdOn = raw.createdOn;
  else { const first = Object.keys(s.days).sort()[0]; if (first) s.createdOn = first; }

  if (isObj(raw.nudge)) {
    if (isDateKey(raw.nudge.lastShownOn)) s.nudge.lastShownOn = raw.nudge.lastShownOn;
    if (isDateKey(raw.nudge.shrinkOn)) s.nudge.shrinkOn = raw.nudge.shrinkOn;
  }

  // ---- Added in version 3 (absent in version 2, so defaults apply) ----
  if (isObj(raw.settings)) {
    const st = raw.settings;
    s.settings.bufferMinutes = intIn(st.bufferMinutes, 0, 240, DEFAULT_SETTINGS.bufferMinutes);
    s.settings.gapMinutes = intIn(st.gapMinutes, 0, 60, DEFAULT_SETTINGS.gapMinutes);
    if (THEMES.includes(st.theme as Theme)) s.settings.theme = st.theme as Theme;
    if (st.motion === 'off' || st.motion === 'auto') s.settings.motion = st.motion;
    if (isTime(st.earliestTime) && isTime(st.latestTime) && st.earliestTime < st.latestTime) {
      s.settings.earliestTime = st.earliestTime;
      s.settings.latestTime = st.latestTime;
    }
  }
  const seenC = new Set<string>();
  for (const c of listOf(raw.commitments)) {
    const cc = cleanCommitment(c);
    if (!cc) { report.dropped++; continue; }
    if (seenC.has(cc.id)) cc.id = 'c' + uid();
    seenC.add(cc.id);
    s.commitments.push(cc);
  }
  s.commitments.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  if (isDateKey(raw.celebratedOn)) s.celebratedOn = raw.celebratedOn;
  if (isObj(raw.timer)) {
    const t = raw.timer;
    if (typeof t.uid === 'string' && isDateKey(t.dayKey) && (t.kind === 'focus' || t.kind === 'start') &&
        Number.isInteger(t.durationSec) && (t.durationSec as number) >= 60 && (t.durationSec as number) <= 36000 &&
        Number.isFinite(t.accumulatedMs) && (t.accumulatedMs as number) >= 0 && (t.startedAt === null || Number.isFinite(t.startedAt))) {
      s.timer = {
        uid: t.uid, dayKey: t.dayKey, kind: t.kind, durationSec: t.durationSec as number,
        startedAt: t.startedAt as number | null, accumulatedMs: t.accumulatedMs as number, finished: t.finished === true,
      };
    }
  }
  if (isObj(raw.context)) {
    for (const k of Object.keys(raw.context)) {
      const c = isDateKey(k) ? cleanContext(raw.context[k]) : null;
      if (c) s.context[k] = c; else report.dropped++;
    }
  }

  // ---- Added in version 4 ----
  s.rota = normalizeRota(raw.rota, report);
  s.pay = normalizePay(raw.pay);
  s.bankHolidays = normalizeBankHolidays(raw.bankHolidays);
  if (isObj(raw.saves)) {
    s.saves = { seq: intIn(raw.saves.seq, 0, 1e12, 0), log: listOf(raw.saves.log).filter(x => typeof x === 'string').slice(-SAVE_LOG) };
  }
  // Keep everything else exactly as it was: the sections not described in types.ts yet (health,
  // study) and anything added by a newer MyDay.
  for (const key of Object.keys(raw)) {
    if (!(key in s) && !['__proto__', 'constructor', 'prototype'].includes(key)) s[key] = raw[key];
  }
  return s;
}
