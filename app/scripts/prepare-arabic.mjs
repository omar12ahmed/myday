// Arabic Fuṣḥā: validate the supplied package, then split it for the app. The course map is small and loads
// with the Arabic screen; each module's lessons and activities are a separate file, loaded when you open it;
// the reference answers are another file, loaded only when you ask to see one; the lesson checks as revision
// shows them are one more, loaded only when a revision round reaches one. Self-study, not an exam
// boundary: anything shipped to the browser can be read.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../../content/arabic-fusha/', import.meta.url));
const target = fileURLToPath(new URL('../src/study/arabic/data/', import.meta.url));

// The validator writes a timestamped report next to the files it checks, so it runs on a copy: building
// never changes the package in the repository.
const copy = mkdtempSync(join(tmpdir(), 'myday-arabic-'));
try {
  cpSync(source, copy, { recursive: true });
  execFileSync('python3', ['-I', join(copy, 'validate_arabic_curriculum.py'), copy], { stdio: ['ignore', 'ignore', 'inherit'] });
  const report = JSON.parse(readFileSync(join(copy, 'MyDay_Arabic_Validation_Report.json'), 'utf8'));
  if (report.status !== 'pass' || report.errors.length) throw new Error('Arabic package failed validation: ' + JSON.stringify(report.errors).slice(0, 400));
} finally {
  rmSync(copy, { recursive: true, force: true });
}

const c = JSON.parse(readFileSync(source + 'MyDay_Arabic_Fusha_Curriculum.json', 'utf8'));
const keys = JSON.parse(readFileSync(source + 'MyDay_Arabic_Assessment_Keys.json', 'utf8'));
const fail = message => { throw new Error('Arabic package: ' + message); };
if (c.package_type !== 'myday.language-curriculum') fail('unexpected package type');
if (keys.curriculum_version !== c.curriculum_version) fail('answer keys are for another curriculum version');
// Answers live only in the keys file; refuse a package that also puts them in the learner-facing course.
if (/"expected_answer"/.test(JSON.stringify(c))) fail('reference answers inside the course file');

const short = id => id.split('.').pop();
const byModule = (items, key = 'module_id') => id => items.filter(x => x[key] === id);
const lessonsOf = byModule(c.lessons), exercisesOf = byModule(c.exercises), labsOf = byModule(c.labs), assessmentsOf = byModule(c.assessments);

// The map: everything needed to choose where to go, without any lesson content.
const index = {
  curriculum_version: c.curriculum_version, course: c.course, paths: c.paths, milestones: c.milestones, resources: c.resources,
  topics: c.topics, modules: c.modules,
  lessons: Object.fromEntries(c.lessons.map(l => [l.id, { title: l.title, module_id: l.module_id, topic_id: l.topic_id, optional: l.optional, stage_target: l.stage_target, minutes: l.estimated_duration_minutes.standard }])),
  skills: Object.fromEntries(c.skills.map(s => [s.id, { name: s.name, module_id: s.module_id, taught_by_lesson_ids: s.taught_by_lesson_ids }])),
  projects: c.projects,
};
rmSync(target, { recursive: true, force: true });
mkdirSync(target + 'modules', { recursive: true });
writeFileSync(target + 'index.json', JSON.stringify(index));
for (const m of c.modules) {
  writeFileSync(target + 'modules/' + short(m.id) + '.json', JSON.stringify({
    module_id: m.id, lessons: lessonsOf(m.id), exercises: exercisesOf(m.id), labs: labsOf(m.id), assessments: assessmentsOf(m.id),
  }));
}
writeFileSync(target + 'texts.json', JSON.stringify({ assets: c.assets, lexicon: c.lexicon_seed }));
// The lesson checks as revision shows them (loaded only when a round reaches one): the question and its lesson's
// title, by question id. A check's answer has the question's own id (revision relies on it).
const lessonTitle = Object.fromEntries(c.lessons.map(l => [l.id, l.title]));
const checks = c.assessments.filter(a => a.type === 'knowledge_check').flatMap(a => a.questions.map(q => ({ q, lesson: a.lesson_id })));
if (checks.some(({ q }) => q.answer_key_id !== q.id)) fail('a lesson check whose answer has another id');
writeFileSync(target + 'checks.json', JSON.stringify(Object.fromEntries(checks.map(({ q, lesson }) => [q.id, { prompt: q.prompt, lesson: lessonTitle[lesson] }]))));
writeFileSync(target + 'answers.json', JSON.stringify(Object.fromEntries(keys.answer_keys.map(k => [k.id, { answer: k.expected_answer, variation: k.acceptable_variation }]))));
console.log(`Arabic package ${c.curriculum_version}: ${c.modules.length} modules, ${c.lessons.length} lessons, ${keys.answer_keys.length} reference answers, validated.`);
