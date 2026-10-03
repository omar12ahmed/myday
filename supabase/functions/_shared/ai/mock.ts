// A stand-in for a real model, for development without credentials and for tests. It reads the same context and
// replies in the same JSON shape. It is simple rules, not AI:
//   good    a sensible, rule-following suggestion
//   sloppy  breaks rules on purpose (too many tasks, an unknown id, too long, a time on top of a shift, a long
//           explanation), to show the app catches them
//   invalid not JSON at all
//   rest    always suggests rest
import { SMALL_MINUTES, type PlanContext } from './schema.ts';

export type MockVariant = 'good' | 'sloppy' | 'invalid' | 'rest';

const toMin = (c: string) => Number(c.slice(0, 2)) * 60 + Number(c.slice(3, 5));
const toClock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export function mockPlanner(ctx: PlanContext, variant: MockVariant = 'good'): string {
  if (variant === 'invalid') return 'Sure! Here is a lovely plan for you: start with the laundry, then relax.';
  const open = ctx.tasks.filter(t => !t.done);
  const missing: string[] = [];
  if (ctx.energy === null) missing.push("Today's energy isn't recorded");
  if (!ctx.sleep.lastNight || (ctx.sleep.lastNight.hours === null && !ctx.sleep.lastNight.start)) missing.push("Last night's sleep isn't recorded");

  if (variant === 'sloppy') {
    const busy = ctx.busy.find(b => b.kind === 'work' || b.kind === 'appointment');
    return JSON.stringify({
      rest: false,
      priorities: [
        ...open.map(t => ({ taskId: t.id, minutes: t.plannedMinutes + 30, start: busy ? busy.start.slice(11) : '09:00' })),
        { taskId: 'made-up-task', minutes: 30, start: null },
      ],
      explanation: 'You should really push through today and get everything done, because getting all of these finished will make you feel so much better and more productive, and it is important not to fall behind on your goals this week or things will pile up.',
      missing: [],
    });
  }

  const free = ctx.free.map(f => ({ start: toMin(f.start), end: toMin(f.end) })).filter(f => f.end - f.start >= 10);
  const roomLeft = free.reduce((a, f) => a + f.end - f.start, 0);
  const wantsRest = /\brest\b|day off|can't today|cannot today/i.test(ctx.note || '');
  if (variant === 'rest' || ctx.restDay || !open.length || wantsRest || roomLeft < 10) {
    return JSON.stringify({
      rest: true, priorities: [],
      explanation: ctx.restDay ? "Today's already a rest day, and that's the plan." : roomLeft < 10 && open.length ? "There isn't real room left today, so resting is the kind choice. Nothing is lost; it waits for another day." : "Rest is a good plan today. Nothing is lost; your tasks wait for another day.",
      missing,
    });
  }

  // Short on sleep, or a time limit in the note ("only have 20 minutes"): keep it small.
  const lowSleep = (ctx.sleep.lastNight && ctx.sleep.lastNight.hours !== null && ctx.sleep.lastNight.hours < 6) || /slept badly|tired|exhausted|no sleep/i.test(ctx.note || '');
  const noteLimit = (ctx.note || '').match(/(\d+)\s*(?:min|minutes)\b/i);
  let budget = noteLimit ? Number(noteLimit[1]) : Infinity;
  const count = Math.min(ctx.maxPriorities, ctx.smallOnly || lowSleep || noteLimit ? 1 : ctx.maxPriorities);
  const order = ctx.smallOnly || lowSleep ? [...open].sort((a, b) => a.plannedMinutes - b.plannedMinutes) : open;
  const priorities: { taskId: string; minutes: number; start: string | null }[] = [];
  for (const t of order) {
    if (priorities.length >= count || budget < 5) break;
    let minutes = Math.min(t.minutes, budget);
    if (ctx.smallOnly || lowSleep) minutes = Math.min(minutes, ctx.smallMinutes || SMALL_MINUTES, 15);
    minutes = Math.max(5, Math.floor(minutes / 5) * 5);
    const slot = free.find(f => f.end - f.start >= minutes);
    if (!slot) continue;
    priorities.push({ taskId: t.id, minutes, start: toClock(slot.start) });
    slot.start += minutes + 10;
    budget -= minutes;
  }
  if (!priorities.length) {
    return JSON.stringify({ rest: true, priorities: [], explanation: "Nothing fits comfortably in the time left, so resting is a fine plan. Your tasks wait for another day.", missing });
  }
  const explanation = ctx.smallOnly || lowSleep
    ? 'One small thing is plenty today. Starting gently still counts.'
    : priorities.length === 1 ? 'One clear focus for the time you have.' : 'These fit around your day with room to breathe.';
  return JSON.stringify({ rest: false, priorities, explanation, missing });
}
