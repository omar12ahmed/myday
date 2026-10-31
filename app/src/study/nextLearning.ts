// A read-only recommendation derived from the ordered curricula and saved learner progress.
// Content stays in each curriculum; there is no extra cursor to get out of sync.
import type { MyDayData } from '../data/types';
import { isDone, MODE_LABEL, modeOf } from '../data/study/mastery';
import { stIndex } from '../data/study/roadmap';
import { lessonIndex } from './arabic/catalogue';
import { arabicPlan, arabicState, journeyFor, pathLessons, stepTowards } from './arabic/plan';
import { roadmapOption, type LearningOption } from './courseOption';
import { lessons as cyberLessons } from './cybersecurity/catalogue';
import { cyberGlance, cyberPlan } from './cybersecurity/plan';

export type { LearningOption, LearningSubject } from './courseOption';

// An active general/Cyber study timer always takes priority over new lessons.
// A finished general Study session can keep its own course ahead of Today's pinned course.
export function learningOptions(data: MyDayData, generalCourseId = data.study.focusCourseId): LearningOption[] {
  // Cybersecurity: the same adaptive next step as its learning map (study/cybersecurity/plan.ts), with the length
  // that suits today; resuming means a notebook attempt still open.
  const ix = stIndex(data.study);
  const ticked = (courseId: string) => !!ix.courseTasks.get(courseId)?.some(t => t.done);
  const cyberStarted = data.cybersecurity.attempts.length > 0 || data.study.sessions.some(s => !!s.courseId?.startsWith('cyber:1:'))
    || [...ix.course.keys()].some(id => id.startsWith('cyber:1:') && ticked(id)) || !!data.cybersecurity.lessons?.length;
  const cp = cyberPlan(data)!, cs = cp.step, cyberTitle = (id: string) => cyberLessons.get(id)?.title ?? id;
  const shorterOf = (why: string[]) => (why.length ? ` A shorter session today: ${why.join(', ')}.` : '');
  const cyberShorter = cs.kind !== 'resume' ? shorterOf(cp.length.why) : '', cyberShorterAi = cs.kind !== 'resume' ? shorterOf(cp.length.plain) : '';
  const cyberOption: LearningOption = {
    subject: 'cybersecurity', label: 'Cybersecurity', title: cyberTitle(cs.lessonId),
    detail: cs.kind === 'resume' ? 'Resume your saved attempt'
      : cs.kind === 'revisit' ? `Worth revisiting first: ${cyberTitle(cs.because!)} builds on it`
      : cs.kind === 'revise' ? `Revision first (${cs.due} ready in Cybersecurity), then this lesson`
      : cs.kind === 'complete' ? (!cs.waiting ? 'Your path is ready to move on — revise, or revisit any lesson'
        : cs.waiting === 1 ? 'Every other lesson on your path is ready — this one needs revision' : `${cs.waiting} lessons on your path need revision — this is the first`)
      : cs.state === 'practised' ? 'Practised — mark it ready when it clicks' : cyberStarted ? 'Next in your course' : 'The first lesson in your course',
    why: cs.kind === 'resume' ? 'You have a saved attempt on this lesson.' : cp.reason + cyberShorter,
    aiWhy: cs.kind === 'resume' ? 'You have a saved attempt on this lesson.' : cp.aiReason + cyberShorterAi,
    href: '#study/cybersecurity/' + encodeURIComponent(cs.lessonId),
    minutes: cs.kind === 'resume' ? cyberLessons.get(cs.lessonId)?.estimated_duration_minutes.standard ?? cp.length.minutes : cp.length.minutes,
    resume: cs.kind === 'resume', allComplete: cp.complete, started: cyberStarted,
    revise: cs.kind === 'revise' || (cs.kind === 'complete' && cs.due > 0 && cs.state !== 'needs-revision') ? 'cybersecurity' : undefined,
    mode: cs.kind === 'resume' ? undefined : MODE_LABEL[modeOf(cp.length.mode)], lessonId: cs.lessonId,
  };

  // Arabic: the same adaptive next step as its learning map (study/arabic/plan.ts), with the length that suits today.
  const plan = arabicPlan(data)!, step = plan.step;
  const open = step.kind === 'resume' ? data.arabic.attempts.filter(a => !a.finishedAt && a.lessonId === step.lessonId).pop() : undefined;
  const arabicStarted = data.arabic.attempts.length > 0 || !!data.arabic.lessons?.length;
  const shorter = step.kind !== 'resume' ? shorterOf(plan.length.why) : '', shorterAi = step.kind !== 'resume' ? shorterOf(plan.length.plain) : '';
  const arabicOption: LearningOption = {
    subject: 'arabic', label: 'Arabic Fuṣḥā', title: lessonIndex[step.lessonId].title,
    detail: step.kind === 'resume' ? 'Resume your open Arabic session'
      : step.kind === 'revisit' ? `Worth revisiting first: ${lessonIndex[step.because!].title} builds on it`
      : step.kind === 'revise' ? `Revision first (${step.due} ready in Arabic), then this lesson`
      : step.kind === 'complete' ? (!step.waiting ? 'Your path is ready to move on — revise, or revisit any lesson'
        : step.waiting === 1 ? 'Every other lesson on your path is ready — this one needs revision' : `${step.waiting} lessons on your path need revision — this is the first`)
      : step.state === 'practised' ? 'Practised — mark it ready when it clicks' : arabicStarted ? 'Next in your course' : 'The first lesson in your course',
    why: plan.reason + shorter, aiWhy: plan.aiReason + shorterAi,
    href: '#study/arabic/' + encodeURIComponent(step.lessonId),
    minutes: step.kind === 'resume' ? lessonIndex[step.lessonId].minutes : plan.length.minutes, resume: step.kind === 'resume', allComplete: plan.complete, started: arabicStarted,
    // As on the learning map: revision first when cards are back (or your path is ready and some are due).
    revise: step.kind === 'revise' || (step.kind === 'complete' && step.due > 0 && step.state !== 'needs-revision') ? 'arabic' : undefined,
    mode: step.kind === 'resume' ? undefined : MODE_LABEL[modeOf(plan.length.variant)], lessonId: step.lessonId,
    attemptId: open?.id, steps: open ? journeyFor(data, step.lessonId, open.variant, true) : undefined,
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
  arabic: { ready: number; needs: { id: string; title: string }[]; open: { id: string; title: string } | null; towards: ReturnType<typeof stepTowards> };
  cyber: { done: number; total: number; needs: { id: string; title: string }[] };
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
      // What Arabic's next lesson is a step towards, for Study home's Arabic card (specs/arabic-route.md).
      // Not for a revision round, or a path that's all ready (its step then points back at the first lesson); the map's
      // next-step card follows the same rule.
      towards: (() => { const o = options.find(x => x.subject === 'arabic'); return o?.lessonId && !o.revise && (!o.allComplete || o.resume) ? stepTowards(data, o.lessonId) : null; })(),
    },
    cyber: (() => { const g = cyberGlance(data); return { done: g.done, total: g.path, needs: g.needs.map(n => ({ id: n.id, title: n.title })) }; })(),
  };
}
