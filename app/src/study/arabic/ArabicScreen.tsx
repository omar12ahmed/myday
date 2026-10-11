import { useEffect, useState } from 'react';
import { BookOpen, FlaskConical, Languages, Library, VolumeOff } from 'lucide-react';
import '@fontsource-variable/noto-naskh-arabic';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field, TextInput } from '../../components/Field';
import { BackLink, Eyebrow, ExternalLink, InlineLink } from '../parts';
import { Lines, LinkButton } from '../cybersecurity/parts';
import { Ar, Mixed } from './Ar';
import texts from './data/texts.json';
import {
  corePath, lessonIndex, loadAnswers, loadModule, moduleList, modules, projects, resources, short, skills, topics, version,
  type Answers, type ModuleContent, type Question,
} from './catalogue';

// Arabic Fuṣḥā in Study: the learning map, modules, lessons, the original reading texts and the starter
// vocabulary. Reading only for now: nothing here is saved, and nothing awards a level.
const href = (id: string) => '#study/arabic/' + id;
const STAGES = ['Pre-A1', 'A1', 'A2', 'B1', 'B2'] as const;
type Asset = (typeof texts.assets)[number];
const assets = new Map<string, Asset>(texts.assets.map(a => [a.id, a]));

export default function ArabicScreen({ id }: { id: string }) {
  const tab = id === 'texts' || id.startsWith('asset.') ? 'texts' : id === 'vocabulary' ? 'vocabulary' : 'map';
  return <div className="arabic-study break-words">
    <nav className="workspace-tabs" aria-label="Arabic">
      <a href="#study">‹ Study</a>
      {([['map', 'Learning map', ''], ['texts', 'Reading texts', '/texts'], ['vocabulary', 'Vocabulary', '/vocabulary']] as const).map(([key, label, path]) =>
        <a key={key} href={'#study/arabic' + path} aria-current={tab === key ? 'page' : undefined}>{label}</a>)}
    </nav>
    {modules.has(id) ? <ModuleView key={id} id={id} />
      : lessonIndex[id] ? <LessonView key={id} id={id} />
      : assets.has(id) ? <TextView key={id} asset={assets.get(id)!} />
      : id === 'texts' ? <TextsIndex />
      : id === 'vocabulary' ? <Vocabulary />
      : id ? <Card><h2>This page isn’t here</h2><BackLink to="study/arabic" label="Back to the learning map" /></Card>
      : <MapView />}
  </div>;
}

function MapView() {
  const [search, setSearch] = useState('');
  const first = moduleList[0].lesson_ids[0];
  const match = (m: (typeof moduleList)[number]) => !search || [m.name, m.purpose, ...m.lesson_ids.map(l => lessonIndex[l].title)].join(' ').toLowerCase().includes(search.toLowerCase());
  const core = moduleList.filter(m => m.path_class === 'core' && match(m)), extensions = moduleList.filter(m => m.path_class !== 'core' && match(m));
  return <>
    <Card className="next-card">
      <Eyebrow><Languages className="inline mr-1" size={18} aria-hidden="true" /> Arabic Fuṣḥā</Eyebrow>
      <h2 className="text-[28px] lg:text-[34px] mb-1">From first sounds to independent use.</h2>
      <Ar block className="text-[26px] text-fg-2 mt-0">العربية الفصحى</Ar>
      <p>Modern Standard Arabic, one small session at a time: script and sounds first, then sentences, reading, listening and writing.</p>
      <p className="text-sm text-fg-2 flex gap-2 items-start"><VolumeOff size={18} className="flex-none mt-0.5" aria-hidden="true" />No recordings are included yet. For listening and speaking, use a verified recording or a fluent speaker; typed work never stands in for them.</p>
      <div className="rounded-tile bg-surface p-4 border border-outline mt-4">
        <Eyebrow>Your first small step</Eyebrow>
        <h3>{lessonIndex[first].title}</h3>
        <p className="text-sm text-fg-2">The first lesson of the course. Short sessions count: ten focused minutes is a real step.</p>
        <div className="grid sm:grid-cols-2 gap-3"><LinkButton to={'study/arabic/' + first} primary>Open lesson</LinkButton><LinkButton to="study/arabic/texts">Read a short text</LinkButton></div>
      </div>
    </Card>
    <Card>
      <Field label="Find a module or lesson" htmlFor="arSearch"><TextInput id="arSearch" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. script, past tense, reading" /></Field>
      <p className="text-sm text-fg-2 mb-0">The core course has {corePath.required_module_ids.length} modules, about {corePath.estimated_hours.minimum}–{corePath.estimated_hours.maximum} hours including revision. Levels are design targets, not certificates.</p>
    </Card>
    {STAGES.map(stage => {
      const list = core.filter(m => m.stage_target === stage);
      return list.length > 0 && <section key={stage} aria-labelledby={`ar-stage-${stage}`} className="mb-4" data-ar-stage={stage}>
        <h3 id={`ar-stage-${stage}`} className="text-sm font-bold uppercase tracking-wide text-fg-2 mb-2">{stage === 'B2' ? 'B2 target' : stage}</h3>
        <div className="grid sm:grid-cols-2 gap-3">{list.map(m => <ModuleTile key={m.id} m={m} />)}</div>
      </section>;
    })}
    {extensions.length > 0 && <section aria-labelledby="ar-extensions" className="mb-4" data-ar-stage="extensions">
      <h3 id="ar-extensions" className="text-sm font-bold uppercase tracking-wide text-fg-2 mb-2">Optional extensions</h3>
      <div className="grid sm:grid-cols-2 gap-3">{extensions.map(m => <ModuleTile key={m.id} m={m} />)}</div>
    </section>}
    {!core.length && !extensions.length && <Card><p className="m-0">Nothing matches “{search}”.</p></Card>}
    <p className="text-xs text-fg-3">Curriculum {version}. Checked when MyDay is built: structure, references and answer keys. That isn’t an Arabic teacher’s proofreading.</p>
  </>;
}

function ModuleTile({ m }: { m: (typeof moduleList)[number] }) {
  return <a href={href(m.id)} data-ar-module={short(m.id)} className="block no-underline text-fg rounded-card border border-outline bg-surface shadow-card p-4 hover:border-outline-strong focus-visible:outline-2 focus-visible:outline-primary">
    <span className="text-xs font-bold text-primary uppercase tracking-wide">{String(m.sequence).padStart(2, '0')} · {m.stage_target.replace('-extension', ' extension')}</span>
    <h4 className="mt-2 mb-1 text-[17px]">{m.name}</h4>
    <p className="text-sm text-fg-2 m-0">{m.purpose}</p>
    <p className="text-sm text-fg-3 mb-0 mt-2">{m.lesson_ids.length} lessons · about {m.estimated_hours.total_minimum}–{m.estimated_hours.total_maximum} hours</p>
  </a>;
}

// A module's lessons and activities load when you open it.
function useModule(moduleId: string) {
  const [content, setContent] = useState<ModuleContent | null>(null), [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    loadModule(moduleId).then(c => { if (live) setContent(c); }, () => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [moduleId]);
  return { content, failed };
}
function Loading({ failed }: { failed: boolean }) {
  return <Card><p role="status" className="m-0">{failed ? 'This part of the course couldn’t be opened. Check your connection and try again.' : 'Opening…'}</p></Card>;
}

function ModuleView({ id }: { id: string }) {
  const m = modules.get(id)!, { content, failed } = useModule(id);
  const lab = (labId: string) => content?.labs.find(l => l.id === labId);
  const check = content?.assessments.find(a => a.id === m.assessment_id);
  return <>
    <Card>
      <BackLink to="study/arabic" label="Learning map" />
      <Eyebrow>Module {m.sequence} · {m.stage_target.replace('-extension', ' extension')} · about {m.estimated_hours.total_minimum}–{m.estimated_hours.total_maximum} hours</Eyebrow>
      <h2>{m.name}</h2><p>{m.purpose}</p><Lines items={m.learning_objectives} />
    </Card>
    <Card><h3><BookOpen className="inline mr-2" size={20} aria-hidden="true" />Lessons</h3>
      {m.topic_ids.map(t => { const topic = topics.get(t)!; return <div key={t} className="mb-3">
        <h4 className="text-sm font-bold text-fg-2 mb-1">{topic.name}</h4>
        <ol className="list-none p-0 m-0 divide-y divide-outline">{topic.lesson_ids.map(l => <li key={l} className="py-2.5">
          <InlineLink href={href(l)}>{lessonIndex[l].title}{lessonIndex[l].optional ? ' (optional)' : ''}</InlineLink>
          <p className="text-sm text-fg-2 m-0">{lessonIndex[l].minutes} min</p>
        </li>)}</ol>
      </div>; })}
    </Card>
    {!content ? <Loading failed={failed} /> : <Card><h3><FlaskConical className="inline mr-2" size={20} aria-hidden="true" />Practice</h3>
      {m.lab_ids.map(l => { const x = lab(l); return x && <details key={l} className="mb-2"><summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">{x.name} · {x.estimated_minutes} min</summary>
        <p><Mixed text={x.task} /></p>{x.split_into_sessions && <p className="text-sm text-fg-2">Split it across sessions if that suits you.</p>}
        {x.deliverables && <Lines items={x.deliverables} />}
      </details>; })}
      {check && <><h4 className="mt-3">Module check</h4><p><Mixed text={check.task} /></p></>}
      {m.project_ids.map(p => { const pr = projects.get(p); return pr && <div key={p}><h4 className="mt-3">Project: {pr.name}</h4><p className="mb-1"><Mixed text={pr.goal} /></p></div>; })}
    </Card>}
    <Card><h3>Common mistakes</h3><Lines items={m.common_mistakes} />
      <h3>Before moving on</h3><Lines items={m.understanding_before_progression} />
      <h3>By the end you can</h3><Lines items={m.completion_capabilities} />
    </Card>
    {m.starter_asset_ids.length > 0 && <Card><h3>Reading texts for this module</h3><div className="grid gap-2">{m.starter_asset_ids.map(a => assets.get(a) && <InlineLink key={a} href={href(a)}>{assets.get(a)!.title}</InlineLink>)}</div></Card>}
    <Card><h3>Resources</h3><ResourceLinks ids={m.resource_ids} /></Card>
  </>;
}

function LessonView({ id }: { id: string }) {
  const entry = lessonIndex[id], { content, failed } = useModule(entry.module_id);
  const l = content?.lessons.find(x => x.id === id);
  if (!content || !l) return <><Card><BackLink to={'study/arabic/' + entry.module_id} label={modules.get(entry.module_id)!.name} /><h2>{entry.title}</h2></Card><Loading failed={failed} /></>;
  const task = content.exercises.find(e => e.id === l.practical_task_id), challenge = content.exercises.find(e => e.id === l.mini_challenge_id);
  const check = content.assessments.find(a => a.id === l.knowledge_check_id);
  const needsVoice = l.input_requirements?.modalities.some(m => m === 'listening' || m === 'speaking');
  return <>
    <Card tone="accent">
      <BackLink to={'study/arabic/' + l.module_id} label={modules.get(l.module_id)!.name} />
      <Eyebrow>Lesson · {l.estimated_duration_minutes.standard} min · {l.stage_target}{l.optional ? ' · optional' : ''}</Eyebrow>
      <h2>{l.title}</h2><Lines items={l.learning_objectives} />
      <p className="text-sm text-fg-2">Key ideas: {l.key_concepts.map((k, i) => <span key={i}>{i > 0 && ' · '}<Mixed text={k} /></span>)}</p>
      {l.example && <div className="rounded-tile bg-surface border border-outline px-4 py-3 mt-3" data-ar-example="">
        <Ar block className="text-[28px] m-0">{l.example.text_ar}</Ar>
        <p className="text-sm text-fg-2 m-0">{l.example.meaning_en}</p>
      </div>}
      {needsVoice && <p className="text-sm text-fg-2 flex gap-2 items-start mt-3 mb-0"><VolumeOff size={18} className="flex-none mt-0.5" aria-hidden="true" />This lesson uses listening or speaking. No recording is included: use a verified recording or a fluent speaker.</p>}
      {l.prerequisites.all.length > 0 && <details className="mt-3"><summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">Builds on {l.prerequisites.all.length} earlier skill{l.prerequisites.all.length === 1 ? '' : 's'}</summary>
        <ul className="list-disc pl-5">{l.prerequisites.all.map(s => skills[s] && <li key={s}><InlineLink href={href(skills[s].taught_by_lesson_ids[0])}>{skills[s].name}</InlineLink></li>)}</ul>
        <p className="text-sm text-fg-2">You can still explore this lesson.</p>
      </details>}
    </Card>
    <Card><h3>Choose a manageable session</h3>{l.variants.map(v => <details key={v.mode}><summary className="min-h-11 py-2 cursor-pointer text-primary">{v.mode[0].toUpperCase() + v.mode.slice(1)} · {v.minutes} min</summary><p><Mixed text={v.activity} /></p><p className="text-sm text-fg-2">{v.evidence_scope}</p></details>)}</Card>
    {task && <Card><h3>Practical task · {task.estimated_minutes} min</h3><p><Mixed text={task.instruction} /></p>
      <h4>What to produce</h4><Lines items={task.expected_evidence} />
      <details><summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">How it’s judged</summary><ul className="list-disc pl-5">{task.rubric.map(r => <li key={r.criterion}>{r.criterion} ({r.weight}): <Mixed text={r.pass_evidence || ''} /></li>)}</ul></details>
    </Card>}
    {check?.questions && <Card data-ar-check=""><h3>Check your understanding</h3>
      <p className="text-sm text-fg-2">Answer first, in your head or on paper, then compare. Note anything you needed help with.</p>
      <ol className="list-decimal pl-5 grid gap-4">{check.questions.map(q => <li key={q.id}><CheckQuestion q={q} /></li>)}</ol>
    </Card>}
    {challenge && <Card><h3>Mini challenge · {challenge.estimated_minutes} min</h3><p className="mb-0"><Mixed text={challenge.instruction} /></p></Card>}
    <Card><h3>When the lesson is done</h3><Lines items={l.completion_criteria} /><p className="text-sm text-fg-2 mb-0">One full attempt is a step, not mastery: a fresh task on another day tells you more.</p></Card>
    {l.starter_asset_ids.length > 0 && <Card><h3>Read alongside</h3><div className="grid gap-2">{l.starter_asset_ids.map(a => assets.get(a) && <InlineLink key={a} href={href(a)}>{assets.get(a)!.title}</InlineLink>)}</div></Card>}
    <Card><h3>Read and explore</h3><ResourceLinks ids={l.resource_ids} /></Card>
  </>;
}

// A question with its reference answer behind a button. The answers load on first use; they are for
// self-study, so anyone with the app could read them — answer first for your own sake.
function CheckQuestion({ q }: { q: Question | { id: string; prompt: string; answer_key_id: string } }) {
  const [answers, setAnswers] = useState<Answers | null>(null), [open, setOpen] = useState(false), [failed, setFailed] = useState(false);
  async function show() {
    setOpen(true);
    try { setAnswers(await loadAnswers()); } catch { setFailed(true); }
  }
  const a = answers?.[q.answer_key_id];
  return <div data-ar-question={q.id}>
    <p className="mb-1.5"><Mixed text={q.prompt} /></p>
    {!open ? <Button inline variant="ghost" data-action="ar-reveal" onClick={show}>Show the reference answer</Button>
      : a ? <div className="bg-surface-2 rounded-tile px-3.5 py-2.5" data-ar-answer="">
        <span className="text-sm text-fg-2">Reference answer</span><p className="mt-1 mb-1"><Mixed text={a.answer} /></p>
        <p className="text-sm text-fg-2 m-0">What also counts: <Mixed text={a.variation} /></p>
      </div>
      : <p role="status" className="text-sm text-fg-2">{failed ? 'The answers couldn’t be opened. Check your connection and try again.' : 'Opening…'}</p>}
  </div>;
}

function ResourceLinks({ ids }: { ids: string[] }) {
  return <div className="grid gap-3">{ids.map(rid => { const r = resources.get(rid); return r && <div key={rid}>
    <ExternalLink href={r.url}>{r.title}</ExternalLink>
    <p className="text-sm text-fg-2 m-0">{r.use_note}</p>
    <p className="text-xs text-fg-3 m-0 mt-1">Checked {r.verified_on}. Access and prices may change.</p>
  </div>; })}</div>;
}

function TextsIndex() {
  return <>
    <Card><Eyebrow><Library className="inline mr-1" size={18} aria-hidden="true" /> Reading texts</Eyebrow><h2>Short texts written for this course</h2>
      <p className="mb-0">Original, fictional texts from beginner to intermediate. Early texts carry full vowel marks; later ones are written as Arabic usually is, without them. No recordings yet.</p>
    </Card>
    <div className="grid sm:grid-cols-2 gap-3 mb-4">{texts.assets.map(a => <a key={a.id} href={href(a.id)} data-ar-text={short(a.id)} className="block no-underline text-fg rounded-card border border-outline bg-surface shadow-card p-4 hover:border-outline-strong focus-visible:outline-2 focus-visible:outline-primary">
      <span className="text-xs font-bold text-primary uppercase tracking-wide">{a.stage_target} · {a.type === 'original_text' ? 'Text' : a.type === 'structured_data' ? 'Timetable' : 'Sound pairs'}</span>
      <h3 className="mt-2 mb-1 text-[17px]">{a.title}</h3>
      {'text_ar' in a && a.text_ar && <Ar block className="text-[17px] text-fg-2 m-0 line-clamp-2">{a.text_ar}</Ar>}
    </a>)}</div>
  </>;
}

function TextView({ asset: a }: { asset: Asset }) {
  const plain = 'text_unvowelled' in a ? a.text_unvowelled : null, full = 'text_ar' in a ? a.text_ar : null;
  const [vowels, setVowels] = useState(true);
  const shown = vowels || !plain ? full : plain;
  const questions = 'comprehension_questions' in a ? (a.comprehension_questions ?? []) : [];
  return <>
    <Card>
      <BackLink to="study/arabic/texts" label="Reading texts" />
      <Eyebrow>{a.stage_target} · {a.type === 'original_text' ? 'Reading text' : a.type === 'structured_data' ? 'Timetable' : 'Sound pairs'}</Eyebrow>
      <h2>{a.title}</h2>
      {full && plain && full !== plain && <div className="flex gap-2 mb-3" role="group" aria-label="Vowel marks">
        <Button inline variant={vowels ? 'primary' : 'ghost'} aria-pressed={vowels} data-action="ar-vowels" onClick={() => setVowels(true)}>With vowel marks</Button>
        <Button inline variant={!vowels ? 'primary' : 'ghost'} aria-pressed={!vowels} data-action="ar-no-vowels" onClick={() => setVowels(false)}>Without</Button>
      </div>}
      {shown && <div className="rounded-tile bg-surface-2 px-4 py-3" data-ar-reading="">{shown.split('\n').map((line, i) => <Ar key={i} block className="text-[24px] my-1">{line}</Ar>)}</div>}
      {'rows' in a && a.rows && <div className="overflow-x-auto"><table className="w-full text-left border-collapse mt-2">
        <thead><tr className="border-b border-outline"><th className="py-2 pr-3">Day</th><th className="py-2 pr-3">Time</th><th className="py-2 pr-3">Activity</th><th className="py-2">Place</th></tr></thead>
        <tbody>{a.rows.map((r, i) => <tr key={i} className="border-b border-outline"><td className="py-2 pr-3"><Ar>{r.day_ar}</Ar></td><td className="py-2 pr-3 tabular-nums">{r.time}</td><td className="py-2 pr-3"><Ar>{r.activity_ar}</Ar></td><td className="py-2"><Ar>{r.place_ar}</Ar></td></tr>)}</tbody>
      </table></div>}
      {'pairs' in a && a.pairs && <ul className="list-none p-0 grid sm:grid-cols-2 gap-2 mt-2">{a.pairs.map((p, i) => <li key={i} className="rounded-tile bg-surface-2 px-3.5 py-2.5 flex items-center justify-between gap-3">
        <span><Ar className="text-[24px]">{p.a}</Ar> <span className="text-sm text-fg-2">{p.meaning_a}</span></span>
        <span className="text-fg-3" aria-hidden="true">/</span>
        <span><Ar className="text-[24px]">{p.b}</Ar> <span className="text-sm text-fg-2">{p.meaning_b}</span></span>
      </li>)}</ul>}
      {'task' in a && a.task && <p className="mt-3"><Mixed text={a.task} /></p>}
      {a.use_note && <p className="text-sm text-fg-2"><Mixed text={a.use_note} /></p>}
      <p className="text-sm text-fg-2 flex gap-2 items-start mb-0"><VolumeOff size={18} className="flex-none mt-0.5" aria-hidden="true" />No recording included. Read it aloud yourself, or ask a fluent speaker to.</p>
    </Card>
    {questions.length > 0 && <Card><h3>Questions about the text</h3><ol className="list-decimal pl-5 grid gap-4">{questions.map(q => <li key={q.id}><CheckQuestion q={q} /></li>)}</ol></Card>}
  </>;
}

function Vocabulary() {
  return <>
    <Card><Eyebrow>Vocabulary</Eyebrow><h2>Starter words</h2>
      <p className="mb-0">{texts.lexicon.length} first words, each with an example sentence. A seed, not the whole vocabulary: lessons and texts add more as you go.</p>
    </Card>
    <Card><ul className="list-none p-0 m-0 divide-y divide-outline" data-ar-vocabulary="">{texts.lexicon.map(w => <li key={w.id} className="py-3 grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-4 items-baseline">
      <div><Ar block className="text-[26px] font-medium m-0">{w.form_ar}</Ar><p className="text-sm text-fg-2 m-0">{w.meaning_en} · {w.part_of_speech.replace('_', ' ')}</p></div>
      <div><Ar block className="text-[20px] m-0">{w.example_ar}</Ar><p className="text-sm text-fg-2 m-0">{w.example_meaning_en}</p></div>
    </li>)}</ul></Card>
  </>;
}

