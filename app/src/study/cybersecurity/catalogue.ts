import raw from './catalogue.json';
import { practiceActivities, practiceVersion, type Practice } from './practiceCatalogue';

export const curriculum = raw;
export type Lesson = typeof raw.lessons[number];
export type Module = typeof raw.modules[number];
export type Path = typeof raw.paths[number];
export interface RubricRow { criterion: string; weight: number; pass_evidence?: string }
export interface Activity {
  id: string; title: string; instruction: string; skillIds: string[]; environmentIds: string[];
  expected: string[]; critical: string[]; rubric: RubricRow[];
  questions: { id: string; prompt: string }[];
  practical: boolean;
  practice?: Practice;
  version?: string;
}
const index = <T extends { id: string }>(items: T[]) => new Map(items.map(x => [x.id, x]));
export const lessons = index(raw.lessons), modules = index(raw.modules), skills = index(raw.skills);
export const resources = index(raw.resources), environments = index(raw.environments);
export const paths = index(raw.paths);
export const activities = new Map<string, Activity>();
for (const e of raw.exercises) activities.set(e.id, {
  id: e.id, title: e.kind === 'guided_practice' ? 'Practical task' : 'Transfer challenge', instruction: e.instruction,
  skillIds: e.skill_ids, environmentIds: e.environment_ids, expected: e.expected_evidence,
  critical: e.critical_checks, rubric: e.rubric, questions: [], practical: true,
});
for (const a of raw.assessments) activities.set(a.id, {
  id: a.id, title: a.type === 'knowledge_check' ? 'Knowledge check' : 'Module assessment', instruction: a.task,
  skillIds: a.skill_ids, environmentIds: [], expected: a.pass_criteria,
  critical: ['Authorised scope and authentic evidence; assistance declared'], rubric: a.rubric, questions: a.questions, practical: false,
});
for (const l of raw.labs) activities.set(l.id, {
  id: l.id, title: l.name, instruction: l.scenario, skillIds: l.skill_ids, environmentIds: l.environment_ids,
  expected: l.expected_evidence, critical: l.pass_criteria, rubric: [], questions: [], practical: true,
});
for (const p of raw.projects) activities.set(p.id, {
  id: p.id, title: p.name, instruction: p.goal, skillIds: p.required_skills.map(s => s.skill_id), environmentIds: p.environment_ids,
  expected: p.deliverables, critical: p.critical_checks, rubric: p.assessment_criteria, questions: [], practical: true,
});
for (const p of practiceActivities) activities.set(p.id, {
  id: p.id, title: p.title, instruction: p.instruction, skillIds: [], environmentIds: [],
  expected: p.evidence, critical: [p.boundary, 'Record your own observations and declare assistance.'],
  rubric: [], questions: [], practical: true, practice: p, version: practiceVersion,
});
export function selectedPath(id: string) { return paths.get(id) ?? paths.get(raw.course.core_path_id)!; }
