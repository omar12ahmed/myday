// Remove learner progress only. Curriculum contents, paths, explanations, authored notes and
// revision-card questions remain; their schedules begin again. Sync can propagate removals.
import type { MyDayData } from '../data/types';

const freshReview = () => ({ reps: 0, interval: 0, lapses: 0, due: null });

export function resetLearningProgress(d: MyDayData): void {
  for (const stage of d.study.stages)
    for (const course of stage.courses)
      for (const module of course.modules)
        for (const section of module.sections)
          for (const task of section.tasks) { task.done = false; task.doneOn = null; }
  d.study.focusCourseId = null;
  d.study.activeId = null;
  d.study.sessions = [];
  d.study.reviews = [];
  for (const concept of d.study.concepts) concept.review = freshReview();
  d.arabic.attempts = [];
  d.cybersecurity.attempts = [];
  for (const card of d.arabic.cards) card.review = freshReview();
  for (const card of d.cybersecurity.cards) card.review = freshReview();
}
