// Arabic Fuṣḥā: the course map (loaded with the Arabic screen), each module's lessons and activities (loaded
// when you open the module) and the reference answers (loaded only when you ask to see one). Generated from
// content/arabic-fusha by app/scripts/prepare-arabic.mjs; nothing here is learner data.
import raw from './data/index.json';

export const course = raw.course, version = raw.curriculum_version;
export type Module = typeof raw.modules[number];
export type Path = typeof raw.paths[number];
export const modules = new Map(raw.modules.map(m => [m.id, m]));
export const moduleList = raw.modules;
export const paths = new Map(raw.paths.map(p => [p.id, p]));
export const topics = new Map(raw.topics.map(t => [t.id, t]));
export const resources = new Map(raw.resources.map(r => [r.id, r]));
export const projects = new Map(raw.projects.map(p => [p.id, p]));
// builds_on: the content skills a lesson needs (short names, checkpoints left out); checks: how many check questions;
// minutes / short / revision: its standard, short and revision sessions' lengths.
export const lessonIndex: Record<string, { title: string; module_id: string; topic_id: string; optional: boolean; stage_target: string; minutes: number; builds_on: string[]; checks: number; short: number; revision: number; practical: number }> = raw.lessons;
export const skills: Record<string, { name: string; module_id: string; taught_by_lesson_ids: string[] }> = raw.skills;
export const corePath = paths.get(raw.course.core_path_id)!;
export const short = (id: string) => id.split('.').pop()!;

// One module's content, as written in the package.
export interface Rubric { criterion: string; weight: number; pass_evidence?: string }
export interface Question { id: string; prompt: string; answer_key_id: string; response_type: string }
export interface Lesson {
  id: string; title: string; module_id: string; topic_id: string; optional: boolean; stage_target: string;
  estimated_duration_minutes: Record<string, number>; prerequisites: { all: string[] }; skill_ids: string[];
  learning_objectives: string[]; key_concepts: string[]; practical_task_id: string; knowledge_check_id: string; mini_challenge_id: string;
  resource_ids: string[]; starter_asset_ids: string[]; completion_criteria: string[];
  example?: { text_ar: string; meaning_en: string; register?: string; source?: string };
  input_requirements?: { modalities: string[]; audio_required: boolean; speaking_evidence_required?: boolean; audio_not_supplied?: boolean };
  variants: { mode: string; minutes: number; activity: string; evidence_scope: string }[];
}
export interface Exercise { id: string; lesson_id: string; kind: string; instruction: string; modalities: string[]; estimated_minutes: number; expected_evidence: string[]; rubric: Rubric[] }
export interface Lab { id: string; name: string; task: string; modalities: string[]; estimated_minutes: number; split_into_sessions?: boolean; deliverables?: string[]; starter_asset_ids?: string[]; resource_ids?: string[] }
export interface Assessment { id: string; lesson_id?: string; type: string; questions?: Question[]; task: string; modalities: string[]; estimated_minutes: number; pass_criteria: string[]; mastery_note?: string }
export interface ModuleContent { module_id: string; lessons: Lesson[]; exercises: Exercise[]; labs: Lab[]; assessments: Assessment[] }

const chunks = import.meta.glob<ModuleContent>('./data/modules/*.json', { import: 'default' });
export function loadModule(moduleId: string): Promise<ModuleContent> {
  const load = chunks[`./data/modules/${short(moduleId)}.json`];
  return load ? load() : Promise.reject(new Error('Unknown module ' + moduleId));
}
export type Answers = Record<string, { answer: string; variation: string }>;
export const loadAnswers = (): Promise<Answers> => import('./data/answers.json').then(m => m.default as Answers);
