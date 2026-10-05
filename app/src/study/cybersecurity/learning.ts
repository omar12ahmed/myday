import type { MyDayData, StudyCourse, StudyStage } from '../../data/types';
import { uid } from '../../data/util';
import { firstTopicName } from '../../data/study/topics';
import { stIndex } from '../../data/study/roadmap';
import { CYBER_VERSION, curriculumTaskId, type CyberAttempt } from '../../data/cybersecurity/types';
import { activities, curriculum, lessons, modules, selectedPath, type Activity } from './catalogue';
import { practiceProblem, setScenario } from './practiceRules';
import { practiceById } from './practiceCatalogue';

// Import is additive and repeatable. Stable content IDs preserve edits, completion and session links.
// It never writes to Today, removes an old path, or changes an existing course's contents.
export function importPath(data: MyDayData, pathId: string): number {
  const path = selectedPath(pathId), st = data.study;
  if (!st.topics?.length) {
    st.topics = [];
    if (st.stages.length) {
      const id = 'tp' + uid();
      st.topics.push({ id, title: firstTopicName(st) });
      st.stages.forEach(s => { s.topicId = id; });
    }
  }
  let topic = st.topics.find(t => t.title.toLowerCase() === 'cybersecurity');
  if (!topic) { topic = { id: 'tp' + uid(), title: 'Cybersecurity' }; st.topics.push(topic); }
  const ix = stIndex(st);
  let added = 0;
  for (const mid of path.required_module_ids) {
    const m = modules.get(mid)!;
    const courseId = curriculumTaskId(mid);
    if (ix.course.has(courseId)) continue;
    const stageId = curriculumTaskId('stage.' + m.path_class);
    let stage: StudyStage | undefined = st.stages.find(s => s.id === stageId);
    if (!stage) {
      stage = { id: stageId, title: m.path_class === 'core' ? 'Cybersecurity foundations' : 'Cybersecurity specialisms', topicId: topic.id, courses: [] };
      st.stages.push(stage);
    }
    const course: StudyCourse = { id: courseId, title: m.name, url: '', minutes: 30, listId: null, archived: false,
      modules: m.topic_ids.map(tid => {
        const t = curriculum.topics.find(x => x.id === tid)!;
        return { id: curriculumTaskId(tid), title: t.name, sections: [{ id: curriculumTaskId('section.' + tid), title: 'Lessons', tasks: t.lesson_ids.filter(lid => !ix.task.has(curriculumTaskId(lid))).map(lid => {
          const l = lessons.get(lid)!;
          return { id: curriculumTaskId(lid), title: l.title, minutes: l.estimated_duration_minutes.standard, url: '', kind: 'practical' as const,
            note: 'Open the curriculum lesson for instructions, prerequisites and evidence.', done: false, doneOn: null };
        }) }] };
      }) };
    stage.courses.push(course); added++;
  }
  data.cybersecurity.pathId = path.id;
  return added;
}

export function beginAttempt(data: MyDayData, activityId: string): string | null {
  const activity = activities.get(activityId);
  if (!activity) return null;
  const version = activity.version ?? CYBER_VERSION;
  const existing = data.cybersecurity.attempts.find(a => a.activityId === activityId && a.curriculumVersion === CYBER_VERSION && a.rubricVersion === version && !a.submittedAt);
  if (existing) return existing.id;
  const a: CyberAttempt = {
    id: 'ca' + uid(), activityId, curriculumVersion: CYBER_VERSION, rubricVersion: version,
    startedAt: new Date().toISOString(), submittedAt: null, inputVariant: '', environmentId: activity.environmentIds[0] ?? '',
    assistance: 'independent', evidence: '', answers: {}, rubricScores: activity.rubric.map(() => 0),
    criticalPassed: null, resumePoint: '', answerRevealed: false, assessor: 'self', verified: false,
  };
  if (activity.practice) a.inputVariant = activity.title;
  if (activity.practice?.kind === 'network') setScenario(a, 'dns');
  data.cybersecurity.attempts.push(a);
  return a.id;
}
export function submissionProblem(a: CyberAttempt, activity: Activity): string | null {
  if (a.curriculumVersion !== CYBER_VERSION || a.rubricVersion !== (activity.version ?? CYBER_VERSION)) return 'This attempt uses an earlier curriculum. Keep it and start a new attempt.';
  if (a.submittedAt) return 'This attempt has already been submitted.';
  if (!a.evidence.trim()) return 'Record what you observed, including any errors or incomplete work.';
  if (!a.inputVariant.trim()) return 'Name the input or scenario you tried.';
  if (activity.environmentIds.length && !activity.environmentIds.includes(a.environmentId)) return 'Choose an environment for this activity.';
  if (activity.questions.some(q => !a.answers[q.id]?.trim())) return 'Attempt each question first. “I do not know yet” is a valid answer.';
  if (a.criticalPassed === null) return 'Record whether the scope and evidence checks passed.';
  if (a.rubricScores.length !== activity.rubric.length) return 'Review each rubric row before submitting.';
  return activity.practice ? practiceProblem(a, activity.practice) : null;
}
export function submitAttempt(data: MyDayData, id: string): string | null {
  const a = data.cybersecurity.attempts.find(a => a.id === id), activity = a && activities.get(a.activityId);
  if (!a || !activity) return 'This activity is unavailable.';
  const problem = submissionProblem(a, activity);
  if (problem) return problem;
  a.submittedAt = new Date().toISOString();
  return null;
}
// Transparent task-rubric result, not a mastery score. Failed attempts are retained, and assistance is capped.
export function attemptScore(a: CyberAttempt, activity: Activity): number | null {
  if (!a.submittedAt || !activity.rubric.length || a.curriculumVersion !== CYBER_VERSION || a.rubricVersion !== CYBER_VERSION) return null;
  if (a.criticalPassed !== true) return 0;
  const score = activity.rubric.reduce((s, row, i) => s + row.weight * (a.rubricScores[i] ?? 0) / 100, 0);
  return Math.min(activity.practical && a.assistance !== 'independent' ? 60 : 100, score);
}
export function attemptsFor(data: MyDayData, activityId: string) {
  return data.cybersecurity.attempts.filter(a => a.activityId === activityId && a.curriculumVersion === CYBER_VERSION);
}
// The package's mastery policy is proposed. Self-study results cannot silently satisfy its verified gates.
// People may explore any lesson by choice; the workspace always names the exact unmet prerequisites.
export function prerequisiteGaps(lessonId: string) { return lessons.get(lessonId)?.prerequisites.all ?? []; }
export function nextLesson(data: MyDayData) {
  const path = selectedPath(data.cybersecurity.pathId);
  const ordered = path.required_module_ids.flatMap(id => modules.get(id)!.lesson_ids).map(id => lessons.get(id)!);
  const resume = data.cybersecurity.attempts.filter(a => !a.submittedAt && a.curriculumVersion === CYBER_VERSION).flatMap(a => ordered.filter(l =>
    [l.practical_task_id, l.knowledge_check_id, l.mini_challenge_id].includes(a.activityId) || practiceById.get(a.activityId)?.lessonIds.includes(l.id)))[0];
  if (resume) return { lesson: resume, reason: 'Resume your saved attempt', code: 'user_choice' };
  const lesson = ordered.find(l => !l.optional && !l.prerequisites.all.length && !attemptsFor(data, l.practical_task_id).some(a => a.submittedAt)) ?? ordered[0];
  return { lesson, reason: attemptsFor(data, lesson.practical_task_id).some(a => a.submittedAt)
    ? 'Review your foundation evidence, or choose another lesson to explore' : 'Start with a lesson that needs no prior skill evidence', code: 'ready_next_lesson' };
}
