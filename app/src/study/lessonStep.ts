import { JOURNEY, type JourneyStep } from '../data/study/mastery';

// Your place on a lesson's journey (the step you were on), remembered on this device only, like the transliteration
// toggle: not part of your data, not synced, not exported. A lesson with a session open reopens at it.
const KEY = 'myday.study.lessonStep';
const KEEP = 60; // lessons remembered; the oldest go first

function read(): Record<string, JourneyStep> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch { return {}; }
}
export function keptStep(lessonId: string): JourneyStep | null {
  const s = read()[lessonId];
  return JOURNEY.includes(s) ? s : null;
}
export function keepStep(lessonId: string, step: JourneyStep) {
  const all = read();
  delete all[lessonId];
  all[lessonId] = step;
  const ids = Object.keys(all);
  for (const id of ids.slice(0, Math.max(0, ids.length - KEEP))) delete all[id];
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* still works for this visit */ }
}
