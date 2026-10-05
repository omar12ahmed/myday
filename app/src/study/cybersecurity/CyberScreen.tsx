import { useState } from 'react';
import { BookOpen, FlaskConical, NotebookPen, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field, Select, TextInput } from '../../components/Field';
import { update } from '../../data/storage';
import type { MyDayData } from '../../data/types';
import { toast } from '../../data/toast';
import { curriculumTaskId, lessonHref } from '../../data/cybersecurity/types';
import { stIndex } from '../../data/study/roadmap';
import { activeStudy } from '../../data/study/sessions';
import { startLearning } from '../actions';
import { BackLink, Eyebrow, ExternalLink, InlineLink } from '../parts';
import { Lines, LinkButton } from './parts';
import { activities, curriculum, environments, lessons, modules, resources, selectedPath, skills, type Lesson } from './catalogue';
import { attemptsFor, importPath, nextLesson, prerequisiteGaps } from './learning';
import { ActivityView } from './Notebook';
import { TutorCard } from './TutorCard';
import { PracticeIndex, PracticeView, RelatedPractice } from './Practice';

export function ResourceLinks({ ids }: { ids: string[] }) {
  return <div className="grid gap-3">{ids.map(id => { const r = resources.get(id); return r && <div key={id}>
    <ExternalLink href={r.url}>{r.title}</ExternalLink>
    <p className="text-sm text-fg-2 m-0">{r.use_note}</p>
    <p className="text-xs text-fg-3 m-0 mt-1">Package checked: {r.verified_on}. Access and prices may change.</p>
  </div>; })}</div>;
}
export default function CyberScreen({ data, id }: { data: MyDayData; id: string }) {
  const lesson = lessons.get(id), module = modules.get(id), activity = activities.get(id);
  return <div className="cyber-workshop break-words">
    <nav className="flex flex-wrap gap-x-5 mb-3 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center" aria-label="Cybersecurity">
      <InlineLink href="#study">Study</InlineLink><InlineLink href="#study/cybersecurity">Learning map</InlineLink>
      <InlineLink href="#study/cybersecurity/practice">Practice</InlineLink>
      <InlineLink href="#study/cybersecurity/notebook">Lab notebook</InlineLink><InlineLink href="#study/cybersecurity/toolkit">Toolkit</InlineLink>
    </nav>
    {lesson ? <LessonView data={data} lesson={lesson} />
      : module ? <ModuleView data={data} id={id} />
      : activity?.practice ? <PracticeView key={id} data={data} activity={activity} />
      : activity ? <ActivityView key={id} data={data} activity={activity} />
      : id === 'practice' ? <PracticeIndex data={data} />
      : id === 'notebook' ? <NotebookIndex data={data} />
      : id === 'toolkit' ? <Toolkit />
      : id ? <Card><h2>This learning page isn’t here</h2><BackLink to="study/cybersecurity" label="Back to the learning map" /></Card>
      : <MapView data={data} />}
  </div>;
}
function MapView({ data }: { data: MyDayData }) {
  const path = selectedPath(data.cybersecurity.pathId), next = nextLesson(data);
  const [search, setSearch] = useState('');
  const visible = curriculum.modules.filter(m => path.required_module_ids.includes(m.id) || path.recommended_optional_module_ids.includes(m.id));
  const submitted = data.cybersecurity.attempts.filter(a => a.submittedAt).length;
  function add() {
    let count = 0;
    if (update(d => { count = importPath(d, path.id); })) toast(count ? `Added ${count} courses to your Study roadmap.` : 'This path is already in your roadmap. Your work is kept.');
  }
  return <>
    <Card tone="accent" className="next-card">
      <Eyebrow><ShieldCheck className="inline mr-1" size={18} aria-hidden="true" /> Cybersecurity workshop</Eyebrow>
      <h2>A little practice. Something you can show.</h2>
      <p>Follow the foundations, choose a specialism, and keep the evidence from each attempt. Pick up wherever you left off.</p>
      <p className="text-sm text-fg-2">{submitted ? `${submitted} submitted attempt${submitted === 1 ? '' : 's'} in your notebook` : 'Your notebook is ready for your first discovery'}. Reading and time spent do not award mastery.</p>
      <div className="rounded-tile bg-surface p-4 border border-outline mt-4">
        <Eyebrow>Your next small step</Eyebrow><h3>{next.lesson.title}</h3><p className="text-sm text-fg-2">{next.reason}.</p>
        <LinkButton to={'study/cybersecurity/' + next.lesson.id} primary>Open lesson</LinkButton>
      </div>
    </Card>
    <Card><h3>Something practical to try</h3><p>Free-first assignments on learning sites, plus small experiments that run inside MyDay.</p><LinkButton to="study/cybersecurity/practice">Find a practice activity</LinkButton></Card>
    <Card>
      <Field label="Your learning path" htmlFor="cyberPath"><Select id="cyberPath" value={path.id} onChange={e => update(d => { d.cybersecurity.pathId = e.target.value; })}>
        {curriculum.paths.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Select></Field>
      <p>{path.note}</p><p className="text-sm text-fg-2">{path.required_module_ids.length} required modules · estimated {path.estimated_hours.with_revision_minimum}–{path.estimated_hours.with_revision_maximum} hours including revision. Work at your own pace.</p>
      <Button data-action="cyber-import" onClick={add}>Add this path to my Study roadmap</Button>
      <p className="text-sm text-fg-2">Adds courses for sessions and check-ins. Existing courses, notes and progress stay as they are.</p>
      <Field label="Find a module or lesson" htmlFor="cyberSearch"><TextInput id="cyberSearch" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. networking, Linux, logs" /></Field>
    </Card>
    <section aria-label="Modules on your learning map" className="grid sm:grid-cols-2 gap-3 mb-4">
      {visible.filter(m => !search || [m.name, m.purpose, ...m.lesson_ids.map(id => lessons.get(id)!.title)].join(' ').toLowerCase().includes(search.toLowerCase())).map(m => {
        const touched = m.exercise_ids.some(id => attemptsFor(data, id).length);
        return <a key={m.id} href={lessonHref(m.id)} className="block no-underline text-fg rounded-card border border-outline bg-surface shadow-card p-4 hover:border-outline-strong focus-visible:outline-2 focus-visible:outline-primary">
          <span className="text-xs font-bold text-primary uppercase tracking-wide">{String(m.sequence).padStart(2, '0')} · {touched ? 'Exploring' : 'Unexplored'}{path.recommended_optional_module_ids.includes(m.id) ? ' · Optional' : ''}</span>
          <h3 className="mt-2 mb-1">{m.name}</h3><p className="text-sm text-fg-2 m-0">{m.purpose}</p><p className="text-sm text-fg-3 mb-0">{m.lesson_ids.length} lessons · {m.lab_ids.length} labs</p>
        </a>;
      })}
    </section>
    <Card><h3>Your path’s projects</h3><div className="grid gap-2">{path.required_project_ids.map(id => <InlineLink key={id} href={lessonHref(id)}>{curriculum.projects.find(p => p.id === id)!.name}</InlineLink>)}</div></Card>
    <p className="text-xs text-fg-3">Curriculum {curriculum.curriculum_version} · Proposed tutor policy kept separately. Self-study scores are provisional; verified mastery and automatic advancement are not yet enabled.</p>
  </>;
}
function ModuleView({ data, id }: { data: MyDayData; id: string }) {
  const m = modules.get(id)!;
  return <>
    <Card><Eyebrow>Module {m.sequence} · {m.path_class.replaceAll('_', ' ')}</Eyebrow><h2>{m.name}</h2><p>{m.purpose}</p><Lines items={m.learning_objectives} /></Card>
    <Card><h3><BookOpen className="inline mr-2" size={20} aria-hidden="true" />Lessons</h3>
      <ol className="list-none p-0 divide-y divide-outline">{m.lesson_ids.map(id => { const l = lessons.get(id)!; return <li key={id} className="py-3">
        <InlineLink href={lessonHref(id)}>{l.title}{l.optional ? ' (optional)' : ''}</InlineLink>
        <p className="text-sm text-fg-2 m-0">{l.estimated_duration_minutes.standard} min · {attemptsFor(data, l.practical_task_id).length ? 'Work in your notebook' : l.prerequisites.all.length ? `${l.prerequisites.all.length} prerequisite skills to check` : 'No prerequisite skills'}</p>
      </li>; })}</ol>
    </Card>
    <Card><h3><FlaskConical className="inline mr-2" size={20} aria-hidden="true" />At the lab bench</h3>
      <div className="grid gap-2">{[...m.lab_ids, m.assessment_id, ...m.project_ids].map(id => <InlineLink key={id} href={lessonHref(id)}>{activities.get(id)!.title}</InlineLink>)}</div>
      <h3>Common mistakes</h3><Lines items={m.common_mistakes} />
      <h3>Before progressing</h3><Lines items={m.understanding_before_progression} />
    </Card><RelatedPractice data={data} ids={m.lesson_ids} /><Card><h3>Resources</h3><ResourceLinks ids={m.resource_ids} /></Card>
  </>;
}
function LessonView({ data, lesson: l }: { data: MyDayData; lesson: Lesson }) {
  const gaps = prerequisiteGaps(l.id), task = stIndex(data.study).task.get(curriculumTaskId(l.id));
  const current = activeStudy(data.study);
  const [minutes, setMinutes] = useState(15);
  return <>
    <Card tone="accent"><BackLink to={'study/cybersecurity/' + l.module_id} label={modules.get(l.module_id)!.name} />
      <Eyebrow>Lesson · {l.estimated_duration_minutes.standard} min{l.optional ? ' · Optional extension' : ''}</Eyebrow><h2>{l.title}</h2>
      <Lines items={l.learning_objectives} /><p className="text-sm text-fg-2">Key concepts: {l.key_concepts.join(' · ')}</p>
      <details className="mt-3"><summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">Prerequisites {gaps.length ? `(${gaps.length})` : '— none'}</summary>
        {gaps.length ? <><p className="text-sm">These thresholds require demonstrated skill evidence. Your self-study scores do not unlock them automatically; you can still explore this lesson.</p>
          <ul className="list-disc pl-5">{gaps.map(g => <li key={g.skill_id}><InlineLink href={lessonHref(skills.get(g.skill_id)!.taught_by_lesson_ids[0])}>{skills.get(g.skill_id)!.name}</InlineLink> — readiness at least {g.min_mastery}/100; not verified here</li>)}</ul></> : <p>You can start here.</p>}
      </details>
      {current ? <LinkButton to="study/session">Return to your study session</LinkButton> : task ? <div className="grid gap-3 mt-3">
        <Field label="Time for this session" htmlFor="cyberMinutes"><Select id="cyberMinutes" value={minutes} onChange={e => setMinutes(Number(e.target.value))}>{[15,30,60,90].map(m => <option key={m} value={m}>{m} minutes</option>)}</Select></Field>
        <Button onClick={() => startLearning(task.course.id, task.node.id, minutes, minutes < l.estimated_duration_minutes.standard)}>Start a study session</Button>
      </div> : <p className="text-sm text-fg-2">You can do the activities below now. Add your path on the learning map to use the Study timer too.</p>}
    </Card>
    <Card><h3>Choose a manageable session</h3>{l.variants.map(v => <details key={v.mode}><summary className="min-h-11 py-2 cursor-pointer capitalize text-primary">{v.mode} · {v.minutes} min</summary><p>{v.activity}</p><p className="text-sm text-fg-2">{v.evidence_scope}</p></details>)}</Card>
    <Card><h3>Learn by doing</h3><div className="grid gap-3">{[l.practical_task_id, l.knowledge_check_id, l.mini_challenge_id].map(id => <LinkButton key={id} to={'study/cybersecurity/' + id}>{activities.get(id)!.title}</LinkButton>)}</div>
      <h3>Completion criteria</h3><Lines items={l.completion_criteria} /><p className="text-sm text-fg-2">A short session is a checkpoint. Marking a roadmap task complete records your choice, not verified mastery.</p>
    </Card>
    <RelatedPractice data={data} ids={[l.id]} />
    <TutorCard key={l.id} lesson={l} />
    <Card><h3>Read and explore</h3><ResourceLinks ids={l.resource_ids} /></Card>
  </>;
}
function NotebookIndex({ data }: { data: MyDayData }) {
  return <Card><Eyebrow><NotebookPen className="inline mr-1" size={18} aria-hidden="true" /> Lab notebook</Eyebrow><h2>Your attempts and discoveries</h2>
    <p>Unfinished work, errors and assisted attempts all belong here. Submitted attempts stay in your history; use a fresh attempt to make a correction.</p>
    {!data.cybersecurity.attempts.length && <p>Open a lesson and choose its practical task to make your first entry.</p>}
    <ul className="list-none p-0 divide-y divide-outline">{[...data.cybersecurity.attempts].reverse().map(a => <li key={a.id} className="py-3">
      <InlineLink href={lessonHref(a.activityId)}>{activities.get(a.activityId)?.practice ? activities.get(a.activityId)!.title : activities.get(a.activityId)?.instruction ?? a.activityId}</InlineLink>
      <p className="text-sm text-fg-2 m-0">{a.submittedAt ? 'Submitted' : 'In progress'} · {a.assistance} · {new Date(a.startedAt).toLocaleDateString('en-GB')} · curriculum {a.curriculumVersion}</p>
      {a.resumePoint && <p className="text-sm m-0">Next: {a.resumePoint}</p>}
    </li>)}</ul>
  </Card>;
}
function Toolkit() {
  return <>
    <Card><h2>Your toolkit</h2><p>These are environment specifications. Choose an authorised training instance or your own isolated lab before running tasks.</p>
      {[...environments.values()].map(e => <details key={e.id}><summary className="min-h-11 py-2 cursor-pointer text-primary font-semibold">{e.name}</summary>
        <p>{e.compute}</p><p>{e.cost_note}</p><p>{e.boundary}</p><p className="text-sm text-fg-2">Evidence limit: {e.evidence_limit}</p>
      </details>)}
    </Card>
    <Card><h3>Synthetic practice files</h3><p>Small, made-up logs for parsing and basic investigations. They are not native system exports or a realistic benchmark.</p>
      <div className="grid gap-2">{['README.md','synthetic_auth.csv','synthetic_web.jsonl','synthetic_host_events.json'].map(name => <a key={name} className="text-primary min-h-11 py-2 break-all" href={import.meta.env.BASE_URL + 'cybersecurity/' + name} download>{name}</a>)}</div>
    </Card>
    <Card><h3>Optional challenges</h3>{curriculum.challenge_series.map(c => <details key={c.id}><summary className="min-h-11 py-2 cursor-pointer text-primary font-semibold">{c.name}</summary><p>{c.task}</p><Lines items={c.evidence} /><p className="text-sm text-fg-2">{c.scoring_note}</p><ResourceLinks ids={c.resource_ids} /></details>)}</Card>
  </>;
}
