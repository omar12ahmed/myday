// Clear learning history, including check-ins and attempt evidence. Course contents, paths,
// concept questions, the words you kept, the Cybersecurity portfolio (its entries keep their own copy of the evidence)
// and separate notes remain; review schedules begin again. The words you kept
// go too only if you choose (`removeWords`). Sync propagates removals.
import type { MyDayData } from '../data/types';

const freshReview = () => ({ reps: 0, interval: 0, lapses: 0, due: null });

export function resetLearningProgress(d: MyDayData, { removeWords = false } = {}): void {
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
  // Your place on each Arabic lesson (marks, Ready to move on, Needs revision) is learning history too, and so is
  // Practise again (the days you did a lesson's Try and mini challenge, and its place in revision).
  if (d.arabic.lessons) d.arabic.lessons = [];
  if (d.arabic.practice) d.arabic.practice = [];
  d.cybersecurity.attempts = [];
  for (const card of d.arabic.cards) card.review = freshReview();
  for (const card of d.cybersecurity.cards) card.review = freshReview();
  if (d.arabic.words) {
    if (removeWords) d.arabic.words = [];
    else for (const w of d.arabic.words) { w.recognise = freshReview(); if (w.write) w.write = freshReview(); }
  }
}
