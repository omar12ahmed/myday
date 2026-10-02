// Proposed workout dates, fitted around your shifts, appointments, sleep and task window (the same free
// time Today uses). A proposal is only a suggestion: nothing is saved until you confirm it.
// Ported from the current MyDay.
import { dayDiff, minToTime, shift, todayKey } from '../dates';
import { freeSegments } from '../schedule';
import type { DateKey, MyDayData, WorkoutData } from '../types';
import { completedOn, finishedSessions, sessionPlanFor, tplById } from './plans';

export interface ProposedSession {
  date: DateKey;
  templateId: string;
  time: string | null;
  kind: 'new' | 'fits' | 'move' | 'nofit'; // new: next in the sequence · fits: the weekday plan fits · move: moved nearby · nofit: no room
  from?: DateKey;                          // for "move": the date it was planned for
  pick: boolean;                           // ticked to be added
}

// The start of the first free stretch on date d long enough for `minutes`, or null.
export function slotFor(data: MyDayData, d: DateKey, minutes: number): string | null {
  const seg = freeSegments(data, d, []).find(g => g.end - g.start >= minutes);
  return seg ? minToTime(seg.start) : null;
}

export function proposeSessions(data: MyDayData, k: DateKey = todayKey()): ProposedSession[] {
  const w = data.health.workout, s = w.schedule, out: ProposedSession[] = [];
  const busy = new Set(Object.keys(w.planned).filter(d => w.planned[d].status === 'planned'));
  finishedSessions(w).forEach(x => busy.add(x.date));
  const farEnough = (d: DateKey) => [...busy].every(b => Math.abs(dayDiff(d, b)) > s.restDays);
  if (s.mode === 'sequence') {
    let idx = s.next;
    for (let i = 0; i < 21 && out.length < 4; i++) {
      const d = shift(k, i), t = tplById(w, s.sequence[idx % s.sequence.length]);
      if (!t || busy.has(d) || !farEnough(d)) continue;
      const time = slotFor(data, d, t.minutes);
      if (!time) continue;
      out.push({ date: d, templateId: t.id, time, kind: 'new', pick: true });
      busy.add(d);
      idx++;
    }
  } else if (s.mode === 'weekdays') {
    for (let i = 0; i < 14; i++) {
      const d = shift(k, i), p = sessionPlanFor(w, d);
      if (!p || p.explicit || completedOn(w, d)) continue;
      const t = tplById(w, p.templateId)!, time = slotFor(data, d, t.minutes);
      if (time) { out.push({ date: d, templateId: t.id, time, kind: 'fits', pick: true }); continue; }
      let alt: { date: DateKey; time: string } | null = null;
      for (const off of [1, -1, 2, -2]) {
        const a = shift(d, off);
        if (a < k || sessionPlanFor(w, a) || completedOn(w, a)) continue;
        const at = slotFor(data, a, t.minutes);
        if (at) { alt = { date: a, time: at }; break; }
      }
      out.push(alt ? { date: alt.date, from: d, templateId: t.id, time: alt.time, kind: 'move', pick: true } : { date: d, templateId: t.id, time: null, kind: 'nofit', pick: false });
    }
  }
  return out;
}
// Saves the ticked proposals. Each date holds one plan, so applying twice can't make duplicates.
export function applyProposal(w: WorkoutData, items: ProposedSession[]): number {
  let n = 0;
  for (const p of items) {
    if (!p.pick || p.kind === 'nofit') continue;
    if (p.kind === 'move' && p.from) w.planned[p.from] = { templateId: p.templateId, time: null, status: 'moved', source: 'proposal' };
    w.planned[p.date] = { templateId: p.templateId, time: p.time, status: 'planned', source: 'proposal' };
    n++;
  }
  return n;
}
