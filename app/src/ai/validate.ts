// Every suggestion is checked here, against MyDay's own rules, before you see it — whatever the model said:
//   - only tasks on today's plan that aren't done, each once, by their id;
//   - energy 1–2 (or not recorded): at most one small task (20 minutes or less); energy 3: two; energy 4–5: three;
//   - never longer than the task's usual length, never under 5 minutes;
//   - a time only if the whole task fits in today's free time: not over shifts (overnight ones and clock changes
//     included), appointments, workouts, prep/travel, sleep, finished tasks or another suggestion;
//   - rest is always allowed; missing information stays unknown (the app adds what it knows is missing).
// Anything that breaks a rule is dropped or reduced to fit, and recorded as a violation (counted by the
// evaluation). A reply that isn't the JSON asked for gives no suggestion at all.
import { LIMITS, SMALL_MINUTES } from '../../../supabase/functions/_shared/ai/schema.ts';
import { dtToMin, minToTime } from '../data/dates';
import { conflictsFor, freeSegments, type Segment } from '../data/schedule';
import type { DateKey, MyDayData } from '../data/types';
import { isObj } from '../data/util';
import { doneBusy, energyOf, missingInfo, roomToday } from './context';

export type ViolationCode =
  | 'not-json' | 'bad-shape' | 'no-plan'
  | 'unknown-task' | 'done-task' | 'repeated-task' | 'too-many'
  | 'not-small' | 'too-long' | 'too-short'
  | 'bad-time' | 'time-conflict'
  | 'rest-and-tasks' | 'long-explanation' | 'pressure-language' | 'bad-missing';
export interface Violation { code: ViolationCode; detail: string }

export interface Priority {
  uid: string;
  title: string;
  minutes: number;         // suggested
  currentMinutes: number;  // as on the plan now
  plannedMinutes: number;  // the task's usual length
  start: number | null;    // minutes from midnight, or null for any time
  wasStart: number | null; // its time on the plan now
}
export interface CheckedProposal {
  rest: boolean;
  priorities: Priority[];
  later: { uid: string; title: string }[]; // open tasks that would wait in the queue
  explanation: string;
  missing: string[];
  adjusted: string[];                       // what the app changed to fit the rules (shown, in plain words)
}
export interface Checked { proposal: CheckedProposal | null; violations: Violation[] }

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_WORDS = 45;
// Pressure, guilt or blame have no place in MyDay. A model that slips into it gets a plain explanation instead.
const PRESSURE = /\b(you (really )?(should|must|have to|need to)|push (yourself|through)|fall(ing)? behind|no excuses?|lazy|failure|failing|wasted?|disappoint\w*|be more productive)\b/i;
const toMin = (c: string) => Number(c.slice(0, 2)) * 60 + Number(c.slice(3, 5));

// The JSON object in a reply (also if a model wraps it in ```json fences or adds a sentence around it).
export function parseReply(text: string): unknown {
  let t = String(text || '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try { return JSON.parse(t); } catch { /* try the outermost braces below */ }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* not JSON */ } }
  return undefined;
}

// Text cut to at most `max` characters: at the end of a sentence if there's one in the second half, otherwise at a
// word, with "…". `wasCut` = it has already been cut short (e.g. to a number of words).
function shorten(s: string, max: number, wasCut = false): string {
  if (s.length <= max && !wasCut) return s;
  const cut = s.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), /[.!]$/.test(cut) ? cut.length - 1 : -1);
  if (end > cut.length * 0.5) return cut.slice(0, end + 1);
  return (cut.length < s.length ? cut.slice(0, cut.lastIndexOf(' ')) : cut).replace(/[,;:\s]+$/, '') + '…';
}

export function checkProposal(text: string, data: MyDayData, k: DateKey): Checked {
  const violations: Violation[] = [];
  const add = (code: ViolationCode, detail: string) => violations.push({ code, detail });
  const raw = parseReply(text);
  if (!isObj(raw)) return { proposal: null, violations: [{ code: 'not-json', detail: "The reply wasn't the JSON that was asked for." }] };
  if ((raw.priorities !== undefined && !Array.isArray(raw.priorities)) || (raw.explanation !== undefined && typeof raw.explanation !== 'string') || (raw.rest !== undefined && typeof raw.rest !== 'boolean')) {
    return { proposal: null, violations: [{ code: 'bad-shape', detail: "The reply didn't have the expected parts." }] };
  }
  const d = data.days[k];
  if (!d) return { proposal: null, violations: [{ code: 'no-plan', detail: "There's no plan for today to adjust." }] };
  const adjusted: string[] = [];

  const energy = energyOf(data, k);
  const limit = roomToday(data, k); // more tasks today has room for, counting what's done
  const small = energy === null || energy <= 2;

  // The explanation: short and plain.
  let explanation = typeof raw.explanation === 'string' ? raw.explanation.trim().replace(/\s+/g, ' ') : '';
  if (PRESSURE.test(explanation)) {
    add('pressure-language', explanation.match(PRESSURE)![0]);
    explanation = 'A suggestion that fits the rest of today. Doing less is completely fine.';
    adjusted.push('The explanation was replaced: it sounded pushy, and MyDay keeps things gentle.');
  }
  const wordCount = explanation ? explanation.split(' ').length : 0;
  if (explanation.length > LIMITS.explanationChars || wordCount > MAX_WORDS) {
    add('long-explanation', `${wordCount} words`);
    explanation = shorten(explanation.split(' ').slice(0, MAX_WORDS).join(' '), LIMITS.explanationChars, wordCount > MAX_WORDS);
  }

  // Missing information: what the app knows first, then anything else the model noticed.
  const missing = missingInfo(data, k);
  if (raw.missing !== undefined && !Array.isArray(raw.missing)) add('bad-missing', 'not a list');
  for (const m of Array.isArray(raw.missing) ? raw.missing : []) {
    if (typeof m !== 'string' || !m.trim()) continue;
    const s = shorten(m.trim(), LIMITS.missingChars);
    const topic = /energy/i.test(s) ? 'energy' : /sleep|slept/i.test(s) ? 'sleep' : null;
    if (topic && missing.some(x => new RegExp(topic, 'i').test(x))) continue; // already said
    if (missing.length < LIMITS.missingItems) missing.push(s);
  }

  const items = Array.isArray(raw.priorities) ? raw.priorities : [];
  const rest = raw.rest === true || d.rest;
  if (rest && items.length) add('rest-and-tasks', `${items.length} task(s) alongside rest`);

  const priorities: Priority[] = [];
  if (!rest) {
    const seen = new Set<string>();
    const busy: Segment[] = doneBusy(data, k);
    const others: { start: number; end: number; label: string }[] = [];
    const gap = data.settings.gapMinutes;
    let extra = 0;
    for (const it of items) {
      if (!isObj(it) || typeof it.taskId !== 'string') { add('unknown-task', 'a priority without a task id'); continue; }
      const t = d.tasks.find(x => x.uid === it.taskId);
      if (!t) { add('unknown-task', `"${String(it.taskId).slice(0, 40)}" isn't on today's plan`); continue; }
      if (t.done) { add('done-task', `"${t.title}" is already done`); continue; }
      if (seen.has(t.uid)) { add('repeated-task', `"${t.title}" twice`); continue; }
      if (priorities.length >= limit) { extra++; continue; }
      seen.add(t.uid);
      const planned = t.baseMinutes || t.minutes;
      let minutes = typeof it.minutes === 'number' && Number.isFinite(it.minutes) ? Math.round(it.minutes) : t.minutes;
      if (minutes > planned) { add('too-long', `"${t.title}": ${minutes} of ${planned} min`); minutes = planned; adjusted.push(`"${t.title}" kept to its usual ${planned} minutes.`); }
      if (minutes < 5) { add('too-short', `"${t.title}": ${minutes} min`); minutes = Math.min(5, planned); }
      if (small && minutes > SMALL_MINUTES) {
        add('not-small', `"${t.title}": ${minutes} min with ${energy === null ? 'energy not recorded' : `energy ${energy}`}`);
        minutes = Math.min(SMALL_MINUTES, planned);
        adjusted.push(`"${t.title}" shortened to ${minutes} minutes, to keep today small.`);
      }
      let start: number | null = null;
      if (it.start !== null && it.start !== undefined) {
        if (typeof it.start !== 'string' || !CLOCK.test(it.start)) {
          add('bad-time', `"${t.title}": ${JSON.stringify(it.start).slice(0, 20)}`);
          adjusted.push(`"${t.title}" has no set time (the suggested time wasn't a time).`);
        } else {
          const s = toMin(it.start);
          const fits = freeSegments(data, k, busy).some(g => g.start <= s && s + minutes <= g.end);
          if (fits) {
            start = s;
            busy.push({ start: s, end: s + minutes + gap });
            others.push({ start: s, end: s + minutes, label: `"${t.title}"` });
          } else {
            const why = conflictsFor(data, k, s, minutes, others, true)[0] || "it's outside your free time";
            add('time-conflict', `"${t.title}" at ${it.start}: ${why}`);
            adjusted.push(`"${t.title}" has no set time — ${it.start} ${why.charAt(0).toLowerCase() + why.slice(1)}.`);
          }
        }
      }
      priorities.push({ uid: t.uid, title: t.title, minutes, currentMinutes: t.minutes, plannedMinutes: planned, start, wasStart: t.scheduledStart ? dtToMin(t.scheduledStart, k) : null });
    }
    if (extra) {
      add('too-many', `${limit + extra} suggested; ${limit} allowed`);
      const done = d.tasks.filter(t => t.done).length;
      adjusted.push(limit === 0
        ? `Nothing more added: ${done === 1 ? 'one task is' : `${done} tasks are`} already done, which is what ${energy === null ? 'a day with energy not recorded' : `energy ${energy}`} allows.`
        : `Only ${limit === 1 ? 'one task' : `${limit} tasks`} kept: that's what ${energy === null ? 'a day with energy not recorded' : `energy ${energy}`} allows${done ? ', counting what\'s already done' : ''}.`);
    }
  }
  const chosen = new Set(priorities.map(p => p.uid));
  const later = d.tasks.filter(t => !t.done && !chosen.has(t.uid)).map(t => ({ uid: t.uid, title: t.title }));
  return { proposal: { rest, priorities, later, explanation, missing, adjusted }, violations };
}

export const clockOf = (m: number | null) => (m === null ? null : minToTime(m));
