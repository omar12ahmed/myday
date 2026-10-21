import { useEffect, useState } from 'react';
import { BookOpen, Check, FlaskConical, Languages, Library, NotebookPen, RotateCcw, VolumeOff } from 'lucide-react';
import '@fontsource-variable/noto-naskh-arabic';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useConfirm } from '../../components/confirm';
import { CommitTextarea, Field, Select, TextInput } from '../../components/Field';
import { shortDate, todayKey } from '../../data/dates';
import { update } from '../../data/storage';
import { dueIds, nextDueDate } from '../../data/study/queue';
import { understanding, UNDERSTANDING } from '../../data/study/revision';
import type { MyDayData } from '../../data/types';
import { addCards, cardOf, cardRef, nextWords, removeCards, wordCard, wordInRevision, wordsAddedOn } from '../../data/arabic/cards';
import { ADD_A_FEW, MODALITIES, NEW_WORDS_A_DAY, type ArabicAttempt, type Help, type Variant } from '../../data/arabic/types';
import { beginSession, changeSession, discardSession, finishSession, lessonDone, markRevealed, nextStep, openSession, placeOf, sessionsFor, writeFirstAnswer, type Place } from '../../data/arabic/sessions';
import { startRevision } from '../actions';
import { BackLink, Choice, Choices, Eyebrow, ExternalLink, InlineLink } from '../parts';
import { Lines, LinkButton } from '../cybersecurity/parts';
import { Ar, Mixed } from './Ar';
import { familyOf } from './families';
import { Root, WordFamilies } from './WordFamilies';
import { PlayButton, VoiceLabel, VoiceNote } from './Listen';
import { hasVoice } from './voice';
import { Pronunciation, PronunciationControls } from './Pronunciation';
import { TeachingLesson } from '../teaching/TeachingLesson';
import texts from './data/texts.json';
import passageReadings from '../../../../content/teaching/pronunciation/passages.json';
import {
  corePath, lessonIndex, loadAnswers, loadModule, moduleList, modules, paths, projects, resources, short, skills, topics, version,
  type Answers, type Lesson, type ModuleContent, type Question,
} from './catalogue';

// Arabic Fuṣḥā in Study: the learning map, modules, lessons, the original reading texts, the starter vocabulary
// and your sessions. What's saved is what you did (sessions) and what you chose to revise (starter words and lesson
// checks, as cards in Study's revision); nothing here scores you or awards a level.
const href = (id: string) => '#study/arabic/' + id;
const STAGES = ['Pre-A1', 'A1', 'A2', 'B1', 'B2'] as const;
type Asset = (typeof texts.assets)[number];
const assets = new Map<string, Asset>(texts.assets.map(a => [a.id, a]));

export default function ArabicScreen({ data, id }: { data: MyDayData; id: string }) {
  const tab = id === 'texts' || id.startsWith('asset.') ? 'texts' : id === 'vocabulary' || id === 'sessions' ? id : 'map';
  return <Pronunciation><div className="arabic-study break-words">
    <nav className="workspace-tabs" aria-label="Arabic">
      <a href="#study">‹ Study</a>
      {([['map', 'Learning map', ''], ['texts', 'Reading texts', '/texts'], ['vocabulary', 'Vocabulary', '/vocabulary'], ['sessions', 'Your sessions', '/sessions']] as const).map(([key, label, path]) =>
        <a key={key} href={'#study/arabic' + path} aria-current={tab === key ? 'page' : undefined}>{label}</a>)}
    </nav>
    <PronunciationControls />
    {modules.has(id) ? <ModuleView key={id} data={data} id={id} />
      : lessonIndex[id] ? <LessonView key={id} data={data} id={id} />
      : assets.has(id) ? <TextView key={id} asset={assets.get(id)!} />
      : id === 'texts' ? <TextsIndex />
      : id === 'vocabulary' ? <Vocabulary data={data} />
      : id === 'sessions' ? <SessionsView data={data} />
      : id ? <Card><h2>This page isn’t here</h2><BackLink to="study/arabic" label="Back to the learning map" /></Card>
      : <MapView data={data} />}
  </div></Pronunciation>;
}

// Your path's lessons in course order (optional lessons aside): where "the next small step" comes from.
function pathLessons(pathId: string): string[] {
  const path = paths.get(pathId) ?? corePath;
  return moduleList.filter(m => path.required_module_ids.includes(m.id)).flatMap(m => m.lesson_ids.filter(l => !lessonIndex[l].optional));
}
const coreLessons = (m: (typeof moduleList)[number]) => m.lesson_ids.filter(l => !lessonIndex[l].optional);
const PLACE: Record<Place, string> = { unexplored: 'Unexplored', exploring: 'Exploring', visited: 'Visited' };

function MapView({ data }: { data: MyDayData }) {
  const [search, setSearch] = useState('');
  const path = paths.get(data.arabic.pathId) ?? corePath;
  const step = nextStep(data, pathLessons(path.id)), started = data.arabic.attempts.length > 0;
  const match = (m: (typeof moduleList)[number]) => !search || [m.name, m.purpose, ...m.lesson_ids.map(l => lessonIndex[l].title)].join(' ').toLowerCase().includes(search.toLowerCase());
  const core = moduleList.filter(m => m.path_class === 'core' && match(m)), extensions = moduleList.filter(m => m.path_class !== 'core' && match(m));
  const tile = (m: (typeof moduleList)[number]) => <ModuleTile key={m.id} m={m} place={placeOf(data, m.lesson_ids, coreLessons(m))} inPath={path.required_module_ids.includes(m.id)} />;
  return <>
    <Card className="next-card">
      <Eyebrow><Languages className="inline mr-1" size={18} aria-hidden="true" /> Arabic Fuṣḥā</Eyebrow>
      <h2 className="text-[28px] lg:text-[34px] mb-1">From first sounds to independent use.</h2>
      <Ar block className="text-[26px] text-fg-2 mt-0">العربية الفصحى</Ar>
      <p>Modern Standard Arabic, one small session at a time: script and sounds first, then sentences, reading, listening and writing.</p>
      <p className="text-sm text-fg-2 flex gap-2 items-start"><VolumeOff size={18} className="flex-none mt-0.5" aria-hidden="true" />{hasVoice ? 'The starter words (in Vocabulary) and each lesson’s example have a synthesised voice to copy; the reading texts and the rest of each lesson have no recordings yet. ' : 'No recordings are included yet. '}For listening and speaking, use a verified recording or a fluent speaker; typed work never stands in for them.</p>
      <div className="rounded-tile bg-surface p-4 border border-outline mt-4" data-ar-next={step.resume ? 'resume' : 'next'}>
        <Eyebrow>{step.resume ? 'Pick up where you left off' : started ? 'Your next small step' : 'Your first small step'}</Eyebrow>
        <h3>{lessonIndex[step.lessonId].title}</h3>
        <p className="text-sm text-fg-2">{step.resume ? 'A session on this lesson is still open.' : started ? 'The next lesson on your path you haven’t finished yet.' : 'The first lesson of the course.'} Short sessions count: ten focused minutes is a real step.</p>
        <div className="grid sm:grid-cols-2 gap-3"><LinkButton to={'study/arabic/' + step.lessonId} primary>{step.resume ? 'Continue' : 'Open lesson'}</LinkButton><LinkButton to="study/arabic/texts">Read a short text</LinkButton></div>
      </div>
    </Card>
    <RevisionGlance data={data} />
    <Card>
      <Field label="Your goal" htmlFor="arPath"><Select id="arPath" data-s="ar-path" value={path.id} onChange={e => update(d => { d.arabic.pathId = e.target.value; })}>
        {[...paths.values()].map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Select></Field>
      <p className="text-sm text-fg-2">{path.required_module_ids.length} modules · about {path.estimated_hours.minimum}–{path.estimated_hours.maximum} hours from the start, including revision. Levels are design targets, not certificates.</p>
      <Field label="Find a module or lesson" htmlFor="arSearch"><TextInput id="arSearch" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. script, past tense, reading" /></Field>
    </Card>
    {STAGES.map(stage => {
      const list = core.filter(m => m.stage_target === stage);
      return list.length > 0 && <section key={stage} aria-labelledby={`ar-stage-${stage}`} className="mb-4" data-ar-stage={stage}>
        <h3 id={`ar-stage-${stage}`} className="text-sm font-bold uppercase tracking-wide text-fg-2 mb-2">{stage === 'B2' ? 'B2 target' : stage}</h3>
        <div className="grid sm:grid-cols-2 gap-3">{list.map(tile)}</div>
      </section>;
    })}
    {extensions.length > 0 && <section aria-labelledby="ar-extensions" className="mb-4" data-ar-stage="extensions">
      <h3 id="ar-extensions" className="text-sm font-bold uppercase tracking-wide text-fg-2 mb-2">Optional extensions</h3>
      <div className="grid sm:grid-cols-2 gap-3">{extensions.map(tile)}</div>
    </section>}
    {!core.length && !extensions.length && <Card><p className="m-0">Nothing matches “{search}”.</p></Card>}
    <p className="text-xs text-fg-3">Curriculum {version}. Checked when MyDay is built: structure, references and answer keys. That isn’t an Arabic teacher’s proofreading.</p>
  </>;
}

// A module on the map, shown as a place: unexplored (quiet), being explored, or visited.
function ModuleTile({ m, place, inPath }: { m: (typeof moduleList)[number]; place: Place; inPath: boolean }) {
  return <a href={href(m.id)} data-ar-module={short(m.id)} data-place={place} className={`block no-underline text-fg rounded-card border bg-surface shadow-card p-4 hover:border-outline-strong focus-visible:outline-2 focus-visible:outline-primary ${place === 'unexplored' ? 'border-outline' : 'border-primary/60'}`}>
    <span className="text-xs font-bold text-primary uppercase tracking-wide">{String(m.sequence).padStart(2, '0')} · {m.stage_target.replace('-extension', ' extension')} · {PLACE[place]}{inPath ? '' : ' · not on your path'}</span>
    <h4 className="mt-2 mb-1 text-[17px] flex items-center gap-2">{place === 'visited' && <Check size={18} className="text-done flex-none" aria-hidden="true" />}{m.name}</h4>
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

function ModuleView({ data, id }: { data: MyDayData; id: string }) {
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
          <p className="text-sm text-fg-2 m-0" data-ar-lesson-state={lessonDone(data, l) ? 'done' : openSession(data, l) ? 'open' : 'new'}>{lessonIndex[l].minutes} min{lessonDone(data, l) ? ' · finished' : openSession(data, l) ? ' · session open' : ''}</p>
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

function LessonView({ data, id }: { data: MyDayData; id: string }) {
  const entry = lessonIndex[id], { content, failed } = useModule(entry.module_id);
  const [finished, setFinished] = useState(false); // just finished a session here: offer its checks for revision
  const l = content?.lessons.find(x => x.id === id);
  if (!content || !l) return <><Card><BackLink to={'study/arabic/' + entry.module_id} label={modules.get(entry.module_id)!.name} /><h2>{entry.title}</h2></Card><Loading failed={failed} /></>;
  const task = content.exercises.find(e => e.id === l.practical_task_id), challenge = content.exercises.find(e => e.id === l.mini_challenge_id);
  const check = content.assessments.find(a => a.id === l.knowledge_check_id);
  const needsVoice = l.input_requirements?.modalities.some(m => m === 'listening' || m === 'speaking');
  const session = openSession(data, l.id), checkIds = check?.questions?.map(q => q.id) ?? [];
  return <>
    <Card tone="accent">
      <BackLink to={'study/arabic/' + l.module_id} label={modules.get(l.module_id)!.name} />
      <Eyebrow>Lesson · {l.estimated_duration_minutes.standard} min · {l.stage_target}{l.optional ? ' · optional' : ''}</Eyebrow>
      <h2>{l.title}</h2><Lines items={l.learning_objectives} />
      <p className="text-sm text-fg-2">Key ideas: {l.key_concepts.map((k, i) => <span key={i}>{i > 0 && ' · '}<Mixed text={k} /></span>)}</p>
      {l.example && <div className="rounded-tile bg-surface border border-outline px-4 py-3 mt-3" data-ar-example="">
        <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><Ar block className="text-[28px] m-0">{l.example.text_ar}</Ar></div>
          <PlayButton text={l.example.text_ar} name={`${l.id}:example`} label="the lesson’s example" /></div>
        <p className="text-sm text-fg-2 m-0">{l.example.meaning_en}</p>
        <VoiceLabel text={l.example.text_ar} />
      </div>}
      {needsVoice && <p className="text-sm text-fg-2 flex gap-2 items-start mt-3 mb-0"><VolumeOff size={18} className="flex-none mt-0.5" aria-hidden="true" />This lesson uses listening or speaking. Use the assigned listening material below where provided, or a fluent speaker. External recordings open on the provider’s site.</p>}
      {l.prerequisites.all.length > 0 && <details className="mt-3"><summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">Builds on {l.prerequisites.all.length} earlier skill{l.prerequisites.all.length === 1 ? '' : 's'}</summary>
        <ul className="list-disc pl-5">{l.prerequisites.all.map(s => skills[s] && <li key={s}><InlineLink href={href(skills[s].taught_by_lesson_ids[0])}>{skills[s].name}</InlineLink></li>)}</ul>
        <p className="text-sm text-fg-2">You can still explore this lesson.</p>
      </details>}
    </Card>
    <TeachingLesson key={'teaching-' + l.id} course="arabic-fusha" lessonId={l.id} />
    {finished && <FinishedCard data={data} checkIds={checkIds} onClose={() => setFinished(false)} />}
    <SessionCard data={data} lesson={l} onFinished={() => setFinished(true)} />
    {task && <Card><h3>Practical task · {task.estimated_minutes} min</h3><p><Mixed text={task.instruction} /></p>
      <h4>What to produce</h4><Lines items={task.expected_evidence} />
      <details><summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">How it’s judged</summary><ul className="list-disc pl-5">{task.rubric.map(r => <li key={r.criterion}>{r.criterion} ({r.weight}): <Mixed text={r.pass_evidence || ''} /></li>)}</ul></details>
    </Card>}
    {check?.questions && <Card data-ar-check=""><h3>Check your understanding</h3>
      <p className="text-sm text-fg-2">{session ? 'Write your first answer, then compare. Once you’ve looked, your first answer stays as you wrote it.' : 'Answer first, in your head or on paper, then compare. Start a session to keep your answers.'}</p>
      <ol className="list-decimal pl-5 grid gap-4">{check.questions.map(q => <li key={q.id}>{session ? <SessionQuestion session={session} q={q} /> : <CheckQuestion q={q} />}</li>)}</ol>
      <ChecksInRevision data={data} ids={checkIds} />
    </Card>}
    {challenge && <Card><h3>Mini challenge · {challenge.estimated_minutes} min</h3><p className="mb-0"><Mixed text={challenge.instruction} /></p></Card>}
    <Card><h3>When the lesson is done</h3><Lines items={l.completion_criteria} /><p className="text-sm text-fg-2 mb-0">One full attempt is a step, not mastery: a fresh task on another day tells you more.</p></Card>
    <LessonHistory data={data} lesson={l} />
    {l.starter_asset_ids.length > 0 && <Card><h3>Read alongside</h3><div className="grid gap-2">{l.starter_asset_ids.map(a => assets.get(a) && <InlineLink key={a} href={href(a)}>{assets.get(a)!.title}</InlineLink>)}</div></Card>}
    <Card><details><summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">Module reference library</summary><ResourceLinks ids={l.resource_ids} /></details></Card>
  </>;
}

// A question with its reference answer behind a button. The answers load on first use; they are for
// self-study, so anyone with the app could read them — answer first for your own sake.
function CheckQuestion({ q }: { q: Question | { id: string; prompt: string; answer_key_id: string } }) {
  const [open, setOpen] = useState(false);
  return <div data-ar-question={q.id}>
    <p className="mb-1.5"><Mixed text={q.prompt} /></p>
    {open ? <Reference keyId={q.answer_key_id} /> : <Button inline variant="ghost" data-action="ar-reveal" onClick={() => setOpen(true)}>Show the reference answer</Button>}
  </div>;
}
function Reference({ keyId }: { keyId: string }) {
  const [answers, setAnswers] = useState<Answers | null>(null), [failed, setFailed] = useState(false);
  useEffect(() => { let live = true; loadAnswers().then(a => { if (live) setAnswers(a); }, () => { if (live) setFailed(true); }); return () => { live = false; }; }, []);
  const a = answers?.[keyId];
  return a ? <div className="bg-surface-2 rounded-tile px-3.5 py-2.5" data-ar-answer="">
    <span className="text-sm text-fg-2">Reference answer</span><p className="mt-1 mb-1"><Mixed text={a.answer} /></p>
    <p className="text-sm text-fg-2 m-0">What also counts: <Mixed text={a.variation} /></p>
  </div> : <p role="status" className="text-sm text-fg-2">{failed ? 'The answers couldn’t be opened. Check your connection and try again.' : 'Opening…'}</p>;
}

// ---------- Sessions: what you did, saved as you go ----------
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const HELP: Record<Help, string> = { independent: 'On my own', hint: 'With a hint', guided: 'Guided' };
const when = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

function SessionCard({ data, lesson: l, onFinished }: { data: MyDayData; lesson: Lesson; onFinished: () => void }) {
  const confirm = useConfirm();
  const open = openSession(data, l.id);
  const [variant, setVariant] = useState<Variant>('standard');
  if (!open) return <Card data-ar-session="none">
    <h3>Start a session</h3>
    <p className="text-sm text-fg-2">Choose a length. Any of them counts, and you can finish early.</p>
    <div className="grid gap-2" role="radiogroup" aria-label="Session length">{l.variants.map(v => <label key={v.mode} className="flex gap-3 items-start rounded-tile border border-outline px-3.5 py-3 cursor-pointer has-[:checked]:border-primary">
      <input type="radio" name="arVariant" data-s="ar-variant" value={v.mode} className="mt-1 size-5 flex-none accent-primary" checked={variant === v.mode} onChange={() => setVariant(v.mode as Variant)} />
      <span><strong>{cap(v.mode)} · {v.minutes} min</strong><span className="block text-sm text-fg-2"><Mixed text={v.activity} /></span></span>
    </label>)}</div>
    <Button variant="primary" className="mt-3" data-action="ar-begin" onClick={() => update(d => { beginSession(d, l.id, variant); })}>Start a {variant} session</Button>
  </Card>;
  const change = (fn: (a: ArabicAttempt) => void) => update(d => { if (!changeSession(d, open.id, fn)) return false; });
  const v = l.variants.find(x => x.mode === open.variant);
  async function discard() {
    if (await confirm({ title: 'Discard this session?', body: 'Its answers and note will be removed. Your other sessions stay as they are.', confirmLabel: 'Discard', cancelLabel: 'Keep it' })) update(d => { if (!discardSession(d, open!.id)) return false; });
  }
  return <Card tone="accent" data-ar-session="open">
    <Eyebrow><NotebookPen className="inline mr-1" size={16} aria-hidden="true" /> Session in progress · {cap(open.variant)}{v ? ` · ${v.minutes} min` : ''} · started {when(open.startedAt)}</Eyebrow>
    {v && <p className="text-sm text-fg-2"><Mixed text={v.activity} /></p>}
    <h4 className="mb-1">What did you practise?</h4>
    <p className="text-sm text-fg-2 mt-0">Tick only what you actually did. Listening and speaking need a recording or a person.</p>
    <Choices label="What did you practise?">{MODALITIES.map(m => <Choice key={m} on={open.practised.includes(m)} data-action="ar-practised" data-v={m} onClick={() => change(a => { a.practised = a.practised.includes(m) ? a.practised.filter(x => x !== m) : [...a.practised, m]; })}>{cap(m)}</Choice>)}</Choices>
    <h4 className="mb-1">How much help did you use?</h4>
    <Choices label="How much help did you use?">{(Object.keys(HELP) as Help[]).map(h => <Choice key={h} on={open.help === h} data-action="ar-help" data-v={h} onClick={() => change(a => { a.help = h; })}>{HELP[h]}</Choice>)}</Choices>
    <Field label="What to revisit next time" htmlFor="arRevisit"><CommitTextarea key={open.id} id="arRevisit" rows={2} dir="auto" className="ar-input" data-s="ar-revisit" defaultValue={open.revisit} placeholder="e.g. when to use مِن and when في" onCommit={el => change(a => { a.revisit = el.value.slice(0, 1000); })} /></Field>
    <div className="grid sm:grid-cols-2 gap-3 mt-3">
      <Button variant="primary" data-action="ar-finish" onClick={() => { if (update(d => { if (!finishSession(d, open.id)) return false; })) onFinished(); }}>Finish this session</Button>
      <Button variant="ghost" data-action="ar-discard" onClick={discard}>Discard</Button>
    </div>
    <p className="text-sm text-fg-2 mt-3 mb-0">Saved as you go. Finishing records what you did, not a score.</p>
  </Card>;
}

// A check question during a session: your first answer is kept; once you look, it stays as you wrote it.
function SessionQuestion({ session, q }: { session: ArabicAttempt; q: Question }) {
  const revealed = session.revealed.includes(q.id), first = session.answers[q.id] ?? '';
  const change = (fn: (a: ArabicAttempt) => void) => update(d => { if (!changeSession(d, session.id, fn)) return false; });
  return <div data-ar-question={q.id}>
    <p className="mb-1.5"><Mixed text={q.prompt} /></p>
    {revealed
      ? (first ? <div className="rounded-tile border border-outline px-3.5 py-2.5 mb-2" data-ar-first=""><span className="text-sm text-fg-2">Your first answer</span><p dir="auto" className="ar-input mt-1 mb-0 whitespace-pre-wrap">{first}</p></div>
        : <p className="text-sm text-fg-2 mb-2">You looked before answering. That’s fine, and it’s noted.</p>)
      : <CommitTextarea key={session.id + q.id} rows={2} dir="auto" className="ar-input mb-2" aria-label="Your first answer" data-s="ar-answer" data-q={q.id} defaultValue={first} placeholder="Your answer, in Arabic or English" onCommit={el => change(a => writeFirstAnswer(a, q.id, el.value))} />}
    {revealed ? <Reference keyId={q.answer_key_id} /> : <Button inline variant="ghost" data-action="ar-reveal" onClick={() => change(a => markRevealed(a, q.id))}>Show the reference answer</Button>}
  </div>;
}

function SessionSummary({ a, withLesson = false }: { a: ArabicAttempt; withLesson?: boolean }) {
  const written = Object.keys(a.answers).length;
  return <div>
    {withLesson && <InlineLink href={href(a.lessonId)}>{lessonIndex[a.lessonId]?.title ?? a.lessonId}</InlineLink>}
    <p className="text-sm m-0">{a.finishedAt ? when(a.finishedAt) : 'In progress'} · {cap(a.variant)} · {HELP[a.help]}{a.practised.length ? ' · ' + a.practised.map(cap).join(', ') : ''}</p>
    {(written > 0 || a.revealed.length > 0) && <p className="text-sm text-fg-2 m-0">{written} answer{written === 1 ? '' : 's'} written first · {a.revealed.length} compared</p>}
    {a.revisit && <p className="text-sm m-0 mt-1">Revisit: <span dir="auto" className="ar-input">{a.revisit}</span></p>}
  </div>;
}

function LessonHistory({ data, lesson }: { data: MyDayData; lesson: Lesson }) {
  const done = sessionsFor(data, lesson.id).filter(a => a.finishedAt).reverse();
  return done.length > 0 && <Card data-ar-history=""><h3>Your sessions on this lesson</h3>
    <ul className="list-none p-0 m-0 divide-y divide-outline">{done.map(a => <li key={a.id} className="py-3"><SessionSummary a={a} /></li>)}</ul>
  </Card>;
}

function SessionsView({ data }: { data: MyDayData }) {
  const all = [...data.arabic.attempts].sort((x, y) => (y.finishedAt ?? '9').localeCompare(x.finishedAt ?? '9') || y.startedAt.localeCompare(x.startedAt));
  return <Card><Eyebrow><NotebookPen className="inline mr-1" size={18} aria-hidden="true" /> Your sessions</Eyebrow><h2>What you’ve done so far</h2>
    <p>Every session you’ve started, newest first. Short ones count. Nothing here is a score.</p>
    {!all.length && <p className="mb-0">Open a lesson and start a session to see it here.</p>}
    <ul className="list-none p-0 m-0 divide-y divide-outline" data-ar-sessions="">{all.map(a => <li key={a.id} className="py-3"><SessionSummary a={a} withLesson /></li>)}</ul>
  </Card>;
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
      {'text_ar' in a && a.text_ar && <Ar block showReading={false} className="text-[17px] text-fg-2 m-0 line-clamp-2">{a.text_ar}</Ar>}
    </a>)}</div>
  </>;
}

function TextView({ asset: a }: { asset: Asset }) {
  const plain = 'text_unvowelled' in a ? a.text_unvowelled : null, full = 'text_ar' in a ? a.text_ar : null;
  const [vowels, setVowels] = useState(true);
  const shown = vowels || !plain ? full : plain;
  const questions = 'comprehension_questions' in a ? (a.comprehension_questions ?? []) : [];
  const prepared = (passageReadings as Record<string, { latin: string; style: string }>)[a.id];
  return <>
    <Card>
      <BackLink to="study/arabic/texts" label="Reading texts" />
      <Eyebrow>{a.stage_target} · {a.type === 'original_text' ? 'Reading text' : a.type === 'structured_data' ? 'Timetable' : 'Sound pairs'}</Eyebrow>
      <h2>{a.title}</h2>
      {full && plain && full !== plain && <div className="flex gap-2 mb-3" role="group" aria-label="Vowel marks">
        <Button inline variant={vowels ? 'primary' : 'ghost'} aria-pressed={vowels} data-action="ar-vowels" onClick={() => setVowels(true)}>With vowel marks</Button>
        <Button inline variant={!vowels ? 'primary' : 'ghost'} aria-pressed={!vowels} data-action="ar-no-vowels" onClick={() => setVowels(false)}>Without</Button>
      </div>}
      {shown && <div className="rounded-tile bg-surface-2 px-4 py-3" data-ar-reading="">{shown.split('\n').map((line, i) => <Ar key={i} block className="text-[24px] my-1" reading={prepared?.latin.split('\n')[i]}>{line}</Ar>)}</div>}
      {prepared?.style.startsWith('word-by-word') && <p className="text-xs text-fg-2">The prepared transliteration is a word-by-word reading, generally without noun case endings. Use a recording for connected speech.</p>}
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

// ---------- Revision: starter words and lesson checks you bring back (part 3) ----------
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const addToRevision = (ids: string[]) => update(d => { if (!addCards(d, ids, todayKey())) return false; });
const outOfRevision = (ids: string[]) => update(d => { if (!removeCards(d, ids)) return false; });
// When something in revision comes back: "ready now" once it's due, otherwise the day.
const backOn = (due: string | null, first = false) => (!due ? '' : due <= todayKey() ? 'ready now' : `${first ? 'first' : 'back'} on ${shortDate(due)}`);
// A card's place in revision, in words: how it went last time and when it comes back. Never a score.
function cardState(data: MyDayData, id: string): string | null {
  const c = cardOf(data, id);
  if (!c) return null;
  const how = UNDERSTANDING[understanding(data.study, c)].label, when = backOn(c.review.due, !c.review.reps);
  return when ? `${how} · ${when}` : how;
}

// On the map: what's in your Arabic revision, and a round of just Arabic when some is ready.
function RevisionGlance({ data }: { data: MyDayData }) {
  const k = todayKey(), refs = data.arabic.cards.map(c => cardRef(c.id));
  const due = dueIds(data, k, 'arabic').length, next = nextDueDate(data, k, 'arabic');
  const words = new Set(refs.flatMap(r => (r.kind === 'word' ? [r.lexemeId] : []))).size, checks = refs.filter(r => r.kind === 'check').length;
  return <Card data-ar-revision={due ? 'due' : refs.length ? 'later' : 'none'}>
    <h3 className="flex items-center gap-2 mt-0"><RotateCcw size={20} aria-hidden="true" />Revision</h3>
    {refs.length
      ? <p className="text-[15px]">In your revision: {[words && plural(words, 'starter word'), checks && plural(checks, 'lesson check')].filter(Boolean).join(' and ')}. {due ? `${due} ready now.` : next ? `Next back on ${shortDate(next)}.` : ''}</p>
      : <p className="text-[15px]">Bring words and lesson checks back at growing gaps, so they stay with you. Add them from <InlineLink href="#study/arabic/vocabulary">Vocabulary</InlineLink> or a lesson’s checks.</p>}
    {due > 0 && <Button variant="primary" data-action="ar-revise" onClick={() => startRevision('arabic')}>Revise Arabic</Button>}
  </Card>;
}

// After finishing a session: an offer to bring the lesson's checks back in revision (nothing is added by itself).
function FinishedCard({ data, checkIds, onClose }: { data: MyDayData; checkIds: string[]; onClose: () => void }) {
  const missing = checkIds.filter(id => !cardOf(data, id)), them = checkIds.length === 1 ? 'it' : 'them';
  return <Card tone="accent" data-ar-finished="">
    <h3 className="mt-0">Session finished</h3>
    <p className="text-[15px]">Saved: what you did, not a score.{checkIds.length === 0 ? '' : missing.length
      ? ` Bring this lesson’s ${checkIds.length === 1 ? 'check' : plural(checkIds.length, 'check')} back in revision? ${them === 'it' ? 'It’d' : 'They’d'} first come back tomorrow, then at growing gaps.`
      : ` This lesson’s ${checkIds.length === 1 ? 'check is' : 'checks are'} in your revision.`}</p>
    <div className="grid sm:grid-cols-2 gap-3">
      {missing.length > 0 && <Button variant="primary" data-action="ar-finished-add" onClick={() => addToRevision(missing)}>Add {them} to revision</Button>}
      <Button variant="ghost" data-action="ar-finished-close" onClick={onClose}>{missing.length ? 'Not now' : 'Close'}</Button>
    </div>
  </Card>;
}

// Under a lesson's checks: bring them back in revision, or see when they come back (and take them out).
function ChecksInRevision({ data, ids }: { data: MyDayData; ids: string[] }) {
  const confirm = useConfirm();
  if (!ids.length) return null;
  const inRev = ids.filter(id => cardOf(data, id)), missing = ids.filter(id => !cardOf(data, id));
  const next = inRev.map(id => cardOf(data, id)!.review.due).filter((d): d is string => !!d).sort()[0];
  async function takeOut() {
    if (await confirm({ title: 'Take these checks out of revision?', body: 'Your past answers stay in your history. If you bring them back, they start afresh.', confirmLabel: 'Take them out', cancelLabel: 'Keep them' })) outOfRevision(inRev);
  }
  return <div className="border-t border-outline pt-3 mt-4" data-ar-checks={inRev.length ? 'in' : 'out'}>
    {inRev.length > 0 && <p className="text-sm m-0 mb-2">{missing.length ? `${inRev.length} of these checks are` : 'These checks are'} in your revision{next ? `: ${backOn(next).replace('back on', 'next back on')}` : ''}.</p>}
    {!inRev.length && <p className="text-sm text-fg-2 m-0 mb-2">Want them to come back? In revision they return tomorrow, then at growing gaps.</p>}
    <div className="flex flex-wrap gap-2">
      {missing.length > 0 && <Button inline variant={inRev.length ? 'ghost' : 'tonal'} data-action="ar-checks-add" onClick={() => addToRevision(missing)}>{inRev.length ? 'Add the rest' : 'Bring these checks back in revision'}</Button>}
      {inRev.length > 0 && <Button inline variant="ghost" data-action="ar-checks-remove" onClick={takeOut}>Take them out of revision</Button>}
    </div>
  </div>;
}

// The starter words, each with its example, and your choice of which come back in revision: recognising a word
// first (Arabic → meaning), writing it from memory when you want to. Each word and example has a play button once
// its synthesised clip has been listened to (Listen.tsx); listening and speaking still aren't tested.
function Vocabulary({ data }: { data: MyDayData }) {
  const confirm = useConfirm();
  const k = todayKey(), ids = texts.lexicon.map(w => w.id), next = nextWords(data, ids, ADD_A_FEW), today = wordsAddedOn(data, k);
  const inRev = ids.filter(id => wordInRevision(data, id)).length, plenty = today >= NEW_WORDS_A_DAY;
  async function takeOut(w: (typeof texts.lexicon)[number]) {
    if (await confirm({ title: 'Take this word out of revision?', body: `“${w.meaning_en}”: your past answers stay in your history. If you add it again, it starts afresh.`, confirmLabel: 'Take it out', cancelLabel: 'Keep it' }))
      outOfRevision([wordCard(w.id, 'recognise'), wordCard(w.id, 'write')]);
  }
  return <>
    <Card><Eyebrow>Vocabulary</Eyebrow><h2>Starter words</h2>
      <p>{texts.lexicon.length} first words, each with an example sentence. A seed, not the whole vocabulary: lessons and texts add more as you go.</p>
      <h3>Bring them back in revision</h3>
      <p className="text-[15px]" data-ar-words-in={inRev}>{inRev ? `${plural(inRev, 'word')} of ${texts.lexicon.length} in your revision.` : 'None in your revision yet.'} Words you add first come back tomorrow, then at growing gaps. A few new ones a day is plenty: the course suggests 3 to 8, and a day with none is fine.</p>
      {plenty && <p className="text-[15px]" data-ar-plenty="">That’s {today} new words today, which is plenty. The rest will keep for another day.</p>}
      {next.length > 0 && <Button variant={plenty ? 'ghost' : 'primary'} data-action="ar-words-add" onClick={() => addToRevision(next.map(id => wordCard(id, 'recognise')))}>Add the next {next.length === 1 ? 'word' : plural(next.length, 'word')} to revision</Button>}
      {hasVoice ? <VoiceNote /> : <p className="text-sm text-fg-2 flex gap-2 items-start mt-3 mb-0"><VolumeOff size={18} className="flex-none mt-0.5" aria-hidden="true" />Revision covers reading and writing. Without recordings, listening and speaking stay untested.</p>}
    </Card>
    <WordFamilies />
    <Card><ul className="list-none p-0 m-0 divide-y divide-outline" data-ar-vocabulary="">{texts.lexicon.map(w => {
      const recognise = cardState(data, wordCard(w.id, 'recognise')), write = cardState(data, wordCard(w.id, 'write')), fam = familyOf(w.id);
      return <li key={w.id} data-ar-word={w.id} tabIndex={-1} data-in={recognise || write ? 'yes' : 'no'} className="py-3 grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-4 items-baseline focus:outline-2 focus:outline-primary focus:outline-offset-4 rounded-sm">
        <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><Ar block className="text-[26px] font-medium m-0">{w.form_ar}</Ar><p className="text-sm text-fg-2 m-0">{w.meaning_en} · {w.part_of_speech.replace('_', ' ')}</p>
          {fam && <p className="text-xs text-fg-2 m-0 mt-1" data-ar-family-badge={fam.id}><span className="inline-flex items-center gap-1 rounded-full bg-surface-2 border border-outline px-2 py-0.5"><Root f={fam} reading={false} /> family</span></p>}</div>
          <PlayButton text={w.form_ar} name={`${w.id}:word`} label={w.form_ar} /></div>
        <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><Ar block className="text-[20px] m-0">{w.example_ar}</Ar><p className="text-sm text-fg-2 m-0">{w.example_meaning_en}</p></div>
          <PlayButton text={w.example_ar} name={`${w.id}:example`} label={`the example for ${w.form_ar}`} /></div>
        <div className="sm:col-span-2 mt-1">
          {(recognise || write) && <p className="text-sm m-0 mb-1.5">{recognise && <span className="block">Recognising it: {recognise}</span>}{write && <span className="block">Writing it: {write}</span>}</p>}
          <div className="flex flex-wrap gap-2">
            {!recognise && <Button inline variant="ghost" data-action="ar-word-add" onClick={() => addToRevision([wordCard(w.id, 'recognise')])}>Add to revision</Button>}
            {recognise && !write && <Button inline variant="ghost" data-action="ar-word-write" onClick={() => addToRevision([wordCard(w.id, 'write')])}>Also practise writing it</Button>}
            {(recognise || write) && <Button inline variant="ghost" data-action="ar-word-remove" onClick={() => takeOut(w)}>Take it out</Button>}
          </div>
        </div>
      </li>;
    })}</ul></Card>
  </>;
}

