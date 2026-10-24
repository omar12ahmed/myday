import { JOURNEY, type JourneyStep } from '../data/study/mastery';

// Your place in a session on a lesson's journey (the step you were on), remembered on this device only, like the
// transliteration toggle: not part of your data, not synced, not exported. It belongs to that session (its attempt
// id), so a finished or discarded session leaves nothing behind for the next one; a lesson reopens at it while the
// session is open.
const KEY = 'myday.study.lessonStep';
const KEEP = 60; // sessions remembered; the oldest go first

function read(): Record<string, JourneyStep> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch { return {}; }
}
export function keptStep(attemptId: string): JourneyStep | null {
  const s = read()[attemptId];
  return JOURNEY.includes(s) ? s : null;
}
export function keepStep(attemptId: string, step: JourneyStep) {
  const all = read();
  delete all[attemptId];
  all[attemptId] = step;
  const ids = Object.keys(all);
  for (const id of ids.slice(0, Math.max(0, ids.length - KEEP))) delete all[id];
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* still works for this visit */ }
}
