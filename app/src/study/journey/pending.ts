import type { JourneyStep } from '../../data/study/mastery';

// A step to open a lesson at, asked for by a link elsewhere (Progress's "Do the Try"): kept in memory only, used
// once by the next lesson page that opens for it, and only within a few seconds of the tap (so a later visit is
// never taken somewhere you didn't ask for).
const FRESH_MS = 5000;
let pending: { lessonId: string; step: JourneyStep; at: number } | null = null;
export const askStep = (lessonId: string, step: JourneyStep) => { pending = { lessonId, step, at: Date.now() }; };
export function takeStep(lessonId: string): JourneyStep | null {
  const step = pending?.lessonId === lessonId && Date.now() - pending.at < FRESH_MS ? pending.step : null;
  pending = null;
  return step;
}
