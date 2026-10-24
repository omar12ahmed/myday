import type { JourneyStep } from '../../data/study/mastery';

// A step to open a lesson at, asked for by a link elsewhere (Progress's "Do the Try"): kept in memory only, and
// used once, by the next lesson page that opens for it.
let pending: { lessonId: string; step: JourneyStep } | null = null;
export const askStep = (lessonId: string, step: JourneyStep) => { pending = { lessonId, step }; };
export function takeStep(lessonId: string): JourneyStep | null {
  const step = pending?.lessonId === lessonId ? pending.step : null;
  pending = null;
  return step;
}
