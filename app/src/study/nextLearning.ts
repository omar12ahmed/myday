// A read-only recommendation derived from the ordered curricula and saved learner progress.
// Content stays in each curriculum; there is no extra cursor to get out of sync.
import type { MyDayData } from '../data/types';
import { isDone, MODE_LABEL, modeOf } from '../data/study/mastery';
import { stIndex } from '../data/study/roadmap';
import { lessonIndex } from './arabic/catalogue';
import { arabicPlan, arabicState, pathLessons } from './arabic/plan';
import { roadmapOption, type LearningOption } from './courseOption';
import { nextLesson as nextCyberLesson, requiredCounts } from './cybersecurity/learning';

export type { LearningOption, LearningSubject } from './courseOption';

// An active general/Cyber study timer always takes priority over new lessons.
// A finished general Study session can keep its own course ahead of Today's pinned course.
export function learningOptions(data: MyDayData, generalCourseId = data.study.focusCourseId): LearningOption[] {
  const cyber = nextCyberLesson(data);
  const ix = stIndex(data.study);
  const ticked = (courseId: string) => !!ix.courseTasks.get(courseId)?.some(t => t.done);
  const cyberStarted = data.cybersecurity.attempts.length > 0 || data.study.sessions.some(s => !!s.courseId?.startsWith('cyber:1:'))
    || [...ix.course.keys()].some(id => id.startsWith('cyber:1:') && ticked(id));
  const cyberOption: LearningOption = {
    subject: 'cybersecurity', label: 'Cybersecurity', title: cyber.lesson.title,
    detail: cyber.code === 'user_choice' ? 'Resume your saved attempt'
      : cyber.allComplete ? 'Required lessons marked complete — revisit any lesson' : cyberStarted ? 'Next in your course' : 'The first lesson in your course',
    why: cyber.code === 'user_choice' ? 'You have a saved attempt on this lesson.'
      : cyber.allComplete ? 'Every required lesson on your path is marked complete. Revisit any lesson, or revise.'
      : cyberStarted ? 'The next lesson on your path you haven’t marked complete. Check its prerequisites before advanced work.'
      : 'The first lesson on your path.',
    href: '#study/cybersecurity/' + encodeURIComponent(cyber.lesson.id),
    minutes: cyber.lesson.estimated_duration_minutes.standard,
    resume: cyber.code === 'user_choice', allComplete: cyber.allComplete, started: cyberStarted,
  };

  // Arabic: the same adaptive next step as its learning map (study/arabic/plan.ts), with the length that suits today.
  const plan = arabicPlan(data)!, step = plan.step;
  const arabicStarted = data.arabic.attempts.length > 0 || !!data.arabic.lessons?.length;
  const shorter = step.kind !== 'resume' && plan.length.why.length ? ` A shorter session today: ${plan.length.why.join(', ')}.` : '';
  const arabicOption: LearningOption = {
    subject: 'arabic', label: 'Arabic Fuṣḥā', title: lessonIndex[step.lessonId].title,
    detail: step.kind === 'resume' ? 'Resume your open Arabic session'
      : step.kind === 'revisit' ? `Worth revisiting first: ${lessonIndex[step.because!].title} builds on it`
      : step.kind === 'revise' ? `Revision first (${step.due} ready in Arabic), then this lesson`
      : step.kind === 'complete' ? (!step.waiting ? 'Your path is ready to move on — revise, or revisit any lesson'
        : step.waiting === 1 ? 'Every other lesson on your path is ready — this one needs revision' : `${step.waiting} lessons on your path need revision — this is the first`)
      : step.state === 'practised' ? 'Practised — mark it ready when it clicks' : arabicStarted ? 'Next in your course' : 'The first lesson in your course',
    why: plan.reason + shorter,
    href: '#study/arabic/' + encodeURIComponent(step.lessonId),
    minutes: step.kind === 'resume' ? lessonIndex[step.lessonId].minutes : plan.length.minutes, resume: step.kind === 'resume', allComplete: plan.complete, started: arabicStarted,
    // As on the learning map: revision first when cards are back (or your path is ready and some are due).
    revise: step.kind === 'revise' || (step.kind === 'complete' && step.due > 0 && step.state !== 'needs-revision') ? 'arabic' : undefined,
    mode: step.kind === 'resume' ? undefined : MODE_LABEL[modeOf(plan.length.variant)], lessonId: step.lessonId,
  };

  // User-authored roadmap courses remain available, in the order of their stages and lessons.
  // Imported Cybersecurity lessons have their own dedicated option above.
  const general = roadmapOption(data, generalCourseId);
  const options: LearningOption[] = [cyberOption, arabicOption];
  if (general) options.push(general);

  // The learner's explicit choice wins over recent activity; default to fundamentals.
  const preferred = data.study.settings.primarySubject ?? 'cybersecurity';
  const pinned = options.find(o => o.subject === preferred);
  return pinned ? [pinned, ...options.filter(o => o !== pinned)] : options;
}

// For Study home: the options (your focus first, the same as Today's), and each guided subject's places in counts (never a percentage), the Arabic lessons
// that need revision and any session left open (for "Worth a look").
export interface LearningGlance {
  options: LearningOption[];
  arabic: { ready: number; needs: { id: string; title: string }[]; open: { id: string; title: string } | null };
  cyber: { done: number; total: number };
}
export function learningGlance(data: MyDayData): LearningGlance {
  const options = learningOptions(data), path = pathLessons(data.arabic.pathId), states = path.map(id => [id, arabicState(data, id)] as const);
  const open = data.arabic.attempts.filter(a => !a.finishedAt && lessonIndex[a.lessonId]).pop();
  return {
    options,
    arabic: {
      ready: states.filter(([, s]) => isDone(s)).length,
      needs: states.filter(([, s]) => s === 'needs-revision').map(([id]) => ({ id, title: lessonIndex[id].title })),
      open: open ? { id: open.lessonId, title: lessonIndex[open.lessonId].title } : null,
    },
    cyber: requiredCounts(data),
  };
}
