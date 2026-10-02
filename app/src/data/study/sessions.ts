// Learning sessions and the check-in after them. Ported from the current MyDay.
// Time is by the clock (not by counting ticks), so it stays right while the phone sleeps or the page reloads.
// A session is only ever created by startStudySession() — from a button press — and only if no other
// session is in progress, so a double tap or a re-render can never make two.
import { dtToMin, fmtDuration, localStamp, nowMin, pad, timeToMin, todayKey } from '../dates';
import { blocksFor, contextFor, freeSegments } from '../schedule';
import { uid } from '../util';
import type { DateKey, MyDayData, StudyData, StudySession } from '../types';
import { stIndex } from './roadmap';

export const activeStudy = (st: StudyData) => (st.activeId ? st.sessions.find(s => s.id === st.activeId) || null : null);
export const sessionMs = (s: StudySession) => s.activeMs + (s.runningSince ? Date.now() - s.runningSince : 0);
export const sessionMinutes = (s: StudySession) => Math.round(sessionMs(s) / 60000);
export const fmtElapsed = (ms: number) => {
  const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60);
  return (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(t % 60);
};

// A suggested length for right now: the estimate, trimmed for low energy and to fit the free time before
// your next shift, appointment or planned task (from Today and the Calendar). Always yours to change.
export function suggestLength(data: MyDayData, base: number): { minutes: number; why: string[] } {
  const k = todayKey(), why: string[] = [];
  let m = base;
  const energy = contextFor(data, k).energy || (data.days[k] && data.days[k].energy) || null;
  const cap = energy ? ({ 1: 15, 2: 20, 3: 30 } as Record<number, number>)[energy] : undefined;
  if (cap && m > cap) { m = cap; why.push(`energy ${energy} today`); }
  const d = data.days[k], now = nowMin(k);
  const busy = d ? d.tasks.filter(t => t.scheduledStart && !t.done).map(t => { const s = dtToMin(t.scheduledStart!, k); return { start: s, end: s + t.minutes }; }) : [];
  const seg = freeSegments(data, k, busy).find(g => g.start <= now + 5 && g.end > now);
  if (seg) {
    const free = seg.end - Math.max(now, seg.start);
    const next = blocksFor(data, k).find(b => b.start === seg.end);
    const before = next ? next.label.replace(/^Prep\/travel for /, '') : seg.end === timeToMin(data.settings.latestTime) ? `${data.settings.latestTime}, your usual finish time` : 'your next plan';
    if (free < m) { m = Math.max(10, Math.floor(free / 5) * 5); why.push(`${fmtDuration(free)} free before ${before}`); }
  }
  return { minutes: Math.max(5, Math.round(m / 5) * 5 || 5), why };
}

// Starts a session for a course (and task, if any). Returns the session in progress — the existing one
// if there already is one — or null if the course doesn't exist.
export function startStudySession(st: StudyData, courseId: string, taskId: string | null, minutes: number, short: boolean): StudySession | null {
  const cur = activeStudy(st);
  if (cur) return cur;
  const ix = stIndex(st), c = ix.course.get(courseId), t = taskId ? ix.task.get(taskId) : null;
  if (!c) return null;
  const s: StudySession = {
    id: 'ss' + uid(), courseId, taskId: t ? taskId : null, title: t ? `${c.node.title} · ${t.node.title}` : c.node.title,
    date: todayKey(), startedAt: localStamp(), plannedMin: minutes, short, status: 'active', runningSince: Date.now(), activeMs: 0,
    endedAt: null, checkin: null, taskDone: null, todayUid: null,
  };
  st.sessions.push(s);
  st.activeId = s.id;
  return s;
}
export function pauseStudy(s: StudySession): boolean { if (!s.runningSince) return false; s.activeMs += Date.now() - s.runningSince; s.runningSince = null; return true; }
export function resumeStudy(s: StudySession): boolean { if (s.runningSince) return false; s.runningSince = Date.now(); return true; }
export function finishStudy(st: StudyData, s: StudySession) {
  pauseStudy(s);
  s.status = 'done';
  s.endedAt = localStamp();
  st.activeId = null;
}

// A finished session makes that day a learning day. Days are counted once, however many sessions.
export const studiedOn = (data: MyDayData, k: DateKey) => data.study.sessions.some(s => s.status === 'done' && s.date === k);
// Finished sessions that didn't also tick a Today task (so the garden counts each once).
export const studyOnlySessions = (data: MyDayData) => data.study.sessions.filter(s => s.status === 'done' && !s.todayUid).length;

// ---------- Check-in after a session (every part optional) ----------
export function ensureCheckin(s: StudySession) {
  if (!s.checkin) s.checkin = { conceptIds: [], clarity: null, takeaway: '', question: '', note: '' };
  return s.checkin;
}
// Concepts offered in a check-in: the ones linked to this task (or this course), plus any already picked.
export function checkinConcepts(st: StudyData, s: StudySession) {
  const ix = stIndex(st), ids = s.taskId ? [s.taskId] : (ix.courseTasks.get(s.courseId || '') || []).map(t => t.id);
  const picked = s.checkin ? s.checkin.conceptIds : [];
  return st.concepts.filter(c => picked.includes(c.id) || c.taskIds.some(t => ids.includes(t)));
}
// The learning task on today's plan that matches this course (via your learning list), if any.
export function todayTaskFor(data: MyDayData, s: StudySession) {
  const c = stIndex(data.study).course.get(s.courseId || ''), d = data.days[s.date];
  if (!c || !c.node.listId || !d || d.rest || s.date !== todayKey()) return null;
  return d.tasks.find(t => t.category === 'learning' && t.taskId === c.node.listId) || null;
}
