// Progress and history, in cautious words. Ported from the current MyDay.
import { dayDiff, parseKey, shift } from '../dates';
import type { DateKey, MyDayData, StudySession } from '../types';
import { conceptEvidence } from './revision';
import { completion, stIndex } from './roadmap';

const weekStart = (k: DateKey) => shift(k, -((parseKey(k).getDay() + 6) % 7)); // Monday

export function studyProgress(data: MyDayData, k: DateKey) {
  const st = data.study, ix = stIndex(st);
  // Completion by course (tasks marked complete)
  const courses = [...ix.course.values()].map(e => ({ c: e.node, stage: e.stage, comp: completion(ix.courseTasks.get(e.node.id)!) }));
  // Practical work, newest first
  const practical = [...ix.task.values()].filter(e => e.node.kind === 'practical' && e.node.done).sort((a, b) => ((a.node.doneOn || '') < (b.node.doneOn || '') ? 1 : -1));
  // After-learning check-ins in the last 30 days (your own report)
  const recent = st.sessions.filter(s => s.status === 'done' && s.checkin && s.checkin.clarity && dayDiff(k, s.date) < 30);
  // Recall over time: the last 8 weeks
  const weeks: { from: DateKey; total: number; own: number; help: number; notyet: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const from = shift(weekStart(k), -7 * i), to = shift(from, 6), rs = st.reviews.filter(r => r.date >= from && r.date <= to);
    weeks.push({
      from, total: rs.length, own: rs.filter(r => r.outcome === 'right' && r.support === 'own').length,
      help: rs.filter(r => (r.outcome === 'right' && r.support !== 'own') || r.outcome === 'partly').length,
      notyet: rs.filter(r => r.outcome === 'wrong' || r.outcome === 'notsure').length,
    });
  }
  const practice = st.concepts.map(c => ({ c, ev: conceptEvidence(st, c) })).filter(x => x.ev.status === 'practice');
  // History: finished sessions and revision days, newest first
  const revDays: Record<DateKey, number> = {};
  for (const r of st.reviews) revDays[r.date] = (revDays[r.date] || 0) + 1;
  type Item = { date: DateKey; at: string } & ({ kind: 'session'; s: StudySession } | { kind: 'revision'; count: number });
  const history: Item[] = [
    ...st.sessions.filter(s => s.status === 'done').map(s => ({ date: s.date, at: s.startedAt, kind: 'session' as const, s })),
    ...Object.keys(revDays).map(d => ({ date: d, at: d + 'T99', kind: 'revision' as const, count: revDays[d] })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));
  return { courses, practical, recent, weeks, practice, history };
}
