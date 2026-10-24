import { JOURNEY, type JourneyStep } from '../data/study/mastery';

// Your place in a session on a lesson's journey (the step you were on), remembered on this device only, like the
// transliteration toggle: not part of your data, not synced, not exported. It belongs to that session (an Arabic
// session's id, or the Study timer's for a Cybersecurity lesson), so a finished or discarded session leaves nothing
// behind for the next one; a lesson reopens at it while the session is open.
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

// Which of a lesson's sessions you started the Study timer for (Cybersecurity: its minutes alone can't tell a 45-minute
// practical session from a 45-minute standard one). The same rules: this device only, by session id.
const MODE_KEY = 'myday.study.sessionLength';
function readModes(): Record<string, string> {
  try { const raw = JSON.parse(localStorage.getItem(MODE_KEY) ?? '{}'); return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}; } catch { return {}; }
}
export const keptSessionMode = (sessionId: string): string | null => (typeof readModes()[sessionId] === 'string' ? readModes()[sessionId] : null);
export function keepSessionMode(sessionId: string, mode: string) {
  const all = readModes();
  delete all[sessionId]; all[sessionId] = mode;
  const ids = Object.keys(all);
  for (const id of ids.slice(0, Math.max(0, ids.length - KEEP))) delete all[id];
  try { localStorage.setItem(MODE_KEY, JSON.stringify(all)); } catch { /* still works for this visit */ }
}
