import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { BookOpen, Check, FlaskConical, Languages, Library, NotebookPen, RotateCcw, VolumeOff } from 'lucide-react';
import '@fontsource-variable/noto-naskh-arabic';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useConfirm } from '../../components/confirm';
import { CommitTextarea, Field, Select, TextInput } from '../../components/Field';
import { shift, shortDate, todayKey } from '../../data/dates';
import { getSnapshot, update } from '../../data/storage';
import { dueIds, nextDueDate } from '../../data/study/queue';
import { understanding, UNDERSTANDING } from '../../data/study/revision';
import type { MyDayData } from '../../data/types';
import { addCards, cardOf, cardRef, nextWords, removeCards, wordCard, wordInRevision, wordsAddedOn } from '../../data/arabic/cards';
import { ADD_A_FEW, MODALITIES, NEW_WORDS_A_DAY, type ArabicAttempt, type Help, type PracticeStep, type Variant } from '../../data/arabic/types';
import { beginSession, changeSession, discardSession, finishSession, markRevealed, openSession, sessionsFor, writeFirstAnswer } from '../../data/arabic/sessions';
import { bringBackNotYet, bringBackPractice, clearRevisit, discardMarks, flagRevisit, lessonRecord, markCheck, markReady, marksIn, practisedUnmarked, unmarkReady } from '../../data/arabic/lessons';
import { discardTicks, practiceCardId, practiceCards, practiceOf, tickStep, ticksIn } from '../../data/arabic/practice';
import { looksReady, MODE_LABEL, modeOf, STATE_LABEL, STEP_LABEL, type JourneyStep, type LessonState, type Mode, type StepKind } from '../../data/study/mastery';
import { OUTCOME, SUPPORT } from '../../data/study/common';
import type { Outcome, Support } from '../../data/types';
import { arabicPlan, arabicState, checksOf, journeyFor, lessonLength, lessonSteps, moduleProgress, warmUpFrom, type ArabicPlan, type Place } from './plan';
import { startRevision } from '../actions';
import { BackLink, Choice, Choices, Eyebrow, ExternalLink, InlineLink } from '../parts';
import { Lines, LinkButton } from '../cybersecurity/parts';
import { Ar, Mixed } from './Ar';
import { familyOf } from './families';
import { Root, WordFamilies } from './WordFamilies';
import { MixedVoiceLabel, PlayButton, VoiceLabel, VoiceNote } from './Listen';
import { clipFor, hasReadingVoice, hasVoice } from './voice';
import { ReadingVoice } from './ReadingVoice';
import { Pronunciation, PronunciationControls } from './Pronunciation';
import { TeachingMaterial, TeachingRead, TeachingTry, TeachingWaiting } from '../teaching/TeachingLesson';
import { useTeaching } from '../teaching/useTeaching';
import { RestartOffer, StepBar } from '../journey/Journey';
import { AR_MAX, editWord, keepWord, keptCardId, keptWord, MEANING_MAX, NOTE_MAX, practiseWriting, removeWord, sentencesIn } from '../../data/arabic/words';
import { KeepAWord } from './KeepAWord';
import { starterFor } from './starter';
import { ARABIC_TINY, toStep } from '../journey/dom';
import { useJourney } from '../journey/useJourney';
import texts from './data/texts.json';
import passageReadings from '../../../../content/teaching/pronunciation/passages.json';
import {
  corePath, lessonIndex, loadAnswers, loadModule, moduleList, modules, paths, projects, resources, short, skills, topics, version,
  type Answers, type Lesson, type ModuleContent, type Question,
} from './catalogue';

// Arabic Fuṣḥā in Study: the learning map, modules, lessons, the original reading texts, the starter vocabulary
// and your sessions. What's saved is what you did (sessions), what you chose to revise (starter words and lesson
// checks, as cards in Study's revision) and your place on each lesson (adaptive Study: how a check went, Ready to move
// on, Needs revision); nothing here scores you or awards a level.
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
      : assets.has(id) ? <TextView key={id} data={data} asset={assets.get(id)!} />
      : id === 'texts' ? <TextsIndex />
      : id === 'vocabulary' ? <Vocabulary data={data} />
      : id === 'sessions' ? <SessionsView data={data} />
      : id ? <Card><h2>This page isn’t here</h2><BackLink to="study/arabic" label="Back to the learning map" /></Card>
      : <MapView data={data} />}
  </div></Pronunciation>;
}

const PLACE: Record<Place, string> = { unexplored: 'Unexplored', exploring: 'Exploring', visited: 'Visited' };

function MapView({ data }: { data: MyDayData }) {
  const [search, setSearch] = useState('');
  const path = paths.get(data.arabic.pathId) ?? corePath;
  const plan = arabicPlan(data), started = data.arabic.attempts.length > 0;
  const match = (m: (typeof moduleList)[number]) => !search || [m.name, m.purpose, ...m.lesson_ids.map(l => lessonIndex[l].title)].join(' ').toLowerCase().includes(search.toLowerCase());
  const core = moduleList.filter(m => m.path_class === 'core' && match(m)), extensions = moduleList.filter(m => m.path_class !== 'core' && match(m));
  const tile = (m: (typeof moduleList)[number]) => <ModuleTile key={m.id} m={m} progress={moduleProgress(data, m.lesson_ids)} inPath={path.required_module_ids.includes(m.id)} />;
  return <>
    <Card className="next-card">
      <Eyebrow><Languages className="inline mr-1" size={18} aria-hidden="true" /> Arabic Fuṣḥā</Eyebrow>
      <h2 className="text-[28px] lg:text-[34px] mb-1">From first sounds to independent use.</h2>
      <Ar block className="text-[26px] text-fg-2 mt-0">العربية الفصحى</Ar>
      <p>Modern Standard Arabic, one small session at a time: script and sounds first, then sentences, reading, listening and writing.</p>
      <p className="text-sm text-fg-2 flex gap-2 items-start"><VolumeOff size={18} className="flex-none mt-0.5" aria-hidden="true" />{hasVoice ? 'The starter words, lesson examples and some teaching and reading texts have a synthesised voice to copy. Look for a play button; some Arabic has no recording. ' : 'No recordings are included yet. '}For listening and speaking, use a verified recording or a fluent speaker; typed work never stands in for them.</p>
      {plan && <NextStep plan={plan} started={started} />}
    </Card>
    <ReadyOffer data={data} />
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

// The one next step, worked out on the device (study/arabic/plan.ts), with why it's this one and how long a session
// suits today. Nothing is locked: any lesson on the map still opens.
const STEP_EYEBROW: Record<Exclude<StepKind, 'lesson'>, string> = {
  resume: 'Pick up where you left off', revisit: 'Worth revisiting first', revise: 'Revision first', complete: 'Your path is ready to move on',
};
function NextStep({ plan, started }: { plan: ArabicPlan; started: boolean }) {
  const { step, reason, length } = plan, title = lessonIndex[step.lessonId].title;
  const eyebrow = step.kind === 'lesson' ? (started ? 'Your next small step' : 'Your first small step')
    : step.kind === 'complete' && step.waiting ? (step.waiting === 1 ? 'One lesson needs revision' : `${step.waiting} lessons need revision`) : STEP_EYEBROW[step.kind];
  const revise = step.kind === 'revise' || (step.kind === 'complete' && step.due > 0 && step.state !== 'needs-revision');
  return <div className="rounded-tile bg-surface p-4 border border-outline mt-4" data-ar-next={step.kind}>
    <Eyebrow>{eyebrow}</Eyebrow>
    <h3>{revise ? 'Revise Arabic' : title}</h3>
    <p className="text-sm text-fg-2">{revise ? `${step.due} ready now, then: ${title}` : step.kind === 'resume' ? 'A session on this lesson is still open.' : `${STATE_LABEL[step.state]} · ${MODE_LABEL[modeOf(length.variant)]} · about ${length.minutes} min suits today`}</p>
    <details className="mb-3" data-ar-why=""><summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">Why this?</summary>
      <p className="text-sm text-fg-2 mt-0">{reason}</p>
      {step.kind !== 'resume' && length.why.length > 0 && <p className="text-sm text-fg-2 mb-0">A shorter session today: {length.why.join(', ')}. The full lesson is always there.</p>}
    </details>
    <div className="grid sm:grid-cols-2 gap-3">
      {revise ? <Button variant="primary" data-action="ar-revise" onClick={() => startRevision('arabic')}>Revise Arabic</Button>
        : <LinkButton to={'study/arabic/' + step.lessonId} primary>{step.kind === 'resume' ? 'Continue' : 'Open lesson'}</LinkButton>}
      {revise ? <LinkButton to={'study/arabic/' + step.lessonId}>Go to the lesson</LinkButton> : <LinkButton to="study/arabic/texts">Read a short text</LinkButton>}
    </div>
  </div>;
}

// Once, for sessions finished before adaptive Study: they count as practice now, and you can say which lessons
// you're ready to move on from. Remembered on this device only (myday.arabic.readyOffer), like the transliteration toggle.
const OFFER_KEY = 'myday.arabic.readyOffer';
function ReadyOffer({ data }: { data: MyDayData }) {
  const [gone, setGone] = useState(() => { try { return localStorage.getItem(OFFER_KEY) === 'done'; } catch { return false; } });
  const [ticked, setTicked] = useState<string[]>([]);
  const ids = practisedUnmarked(data).filter(id => lessonIndex[id]);
  if (gone || !ids.length) return null;
  const close = () => { try { localStorage.setItem(OFFER_KEY, 'done'); } catch { /* still closes for this visit */ } setGone(true); };
  const markTicked = () => { const k = todayKey(); if (update(d => { for (const id of ticked) markReady(d, id, checksOf(id), k); })) close(); };
  return <Card data-ar-ready-offer="">
    <h3 className="mt-0">Lessons you’ve practised</h3>
    <p className="text-[15px]">You’ve finished sessions on {plural(ids.length, 'lesson')} without saying yet whether you’re ready to move on. A finished session counts as practice, so your next step stays on a lesson until you do. Mark any you’re ready to move on from; their checks come back in a week.</p>
    <div className="grid gap-1 mb-3">{ids.map(id => <label key={id} className="flex gap-3 items-center min-h-11 cursor-pointer">
      <input type="checkbox" className="size-5 flex-none accent-primary" data-s="ar-offer-lesson" value={id} checked={ticked.includes(id)} onChange={e => setTicked(t => e.target.checked ? [...t, id] : t.filter(x => x !== id))} />
      <span>{lessonIndex[id].title}</span></label>)}</div>
    <div className="flex flex-wrap gap-2">
      <Button variant="primary" data-action="ar-offer-ready" disabled={!ticked.length} onClick={markTicked}>Mark {ticked.length ? plural(ticked.length, 'lesson') : 'them'} ready</Button>
      <Button variant="ghost" data-action="ar-offer-close" onClick={close}>Not now</Button>
    </div>
  </Card>;
}

// A module on the map, shown as a place: unexplored (quiet), being explored, or visited (every core lesson ready).
function ModuleTile({ m, progress, inPath }: { m: (typeof moduleList)[number]; progress: ReturnType<typeof moduleProgress>; inPath: boolean }) {
  const { place, ready, needs } = progress;
  return <a href={href(m.id)} data-ar-module={short(m.id)} data-place={place} className={`block no-underline text-fg rounded-card border bg-surface shadow-card p-4 hover:border-outline-strong focus-visible:outline-2 focus-visible:outline-primary ${place === 'unexplored' ? 'border-outline' : 'border-primary/60'}`}>
    <span className="text-xs font-bold text-primary uppercase tracking-wide">{String(m.sequence).padStart(2, '0')} · {m.stage_target.replace('-extension', ' extension')} · {PLACE[place]}{inPath ? '' : ' · not on your path'}</span>
    <h4 className="mt-2 mb-1 text-[17px] flex items-center gap-2">{place === 'visited' && <Check size={18} className="text-done flex-none" aria-hidden="true" />}{m.name}</h4>
    <p className="text-sm text-fg-2 m-0">{m.purpose}</p>
    <p className="text-sm text-fg-3 mb-0 mt-2" data-ar-module-counts="">{m.lesson_ids.length} lessons{ready ? ` · ${ready} ready` : ''}{needs ? ` · ${needs} ${needs === 1 ? 'needs' : 'need'} revision` : ''} · about {m.estimated_hours.total_minimum}–{m.estimated_hours.total_maximum} hours</p>
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
          {(() => { const state = arabicState(data, l), open = !!openSession(data, l); return <p className="text-sm text-fg-2 m-0" data-ar-lesson-state={state} data-ar-session-open={open ? 'yes' : undefined}>
            {lessonIndex[l].minutes} min{state === 'new' ? '' : ` · ${STATE_LABEL[state]}`}{open ? ' · session open' : ''}</p>; })()}
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

// A lesson as one page in steps (specs/study-home-and-lessons.md §5): Warm-up, Understand, Try, Check and Reflect.
// The session's length decides which steps show first; the rest stay one tap away under "The rest of this lesson",
// and everything about the lesson that isn't a step is under "More about this lesson". Your step follows you as you
// read and jump; with a session open it's kept on this device for that session (lessonStep.ts), so the lesson
// reopens there.
function LessonView({ data, id }: { data: MyDayData; id: string }) {
  const entry = lessonIndex[id], { content, failed } = useModule(entry.module_id);
  const [finished, setFinished] = useState<Finished | null>(null); // just finished a session here: what happens next
  const teaching = useTeaching('arabic-fusha', id);
  const [revealed, setRevealed] = useState(false); // Try's explained answer
  const session = openSession(data, id);
  // The length that suits today (energy and free time) starts the choice; a lesson that needs revision gets the
  // revision session. Always yours to change.
  const [suggested] = useState(() => lessonLength(data, id, arabicState(data, id) === 'needs-revision'));
  const [chosen, setChosen] = useState<Variant>(suggested.variant);
  const l = content?.lessons.find(x => x.id === id), loaded = !!l;
  // A just-finished session keeps its steps while its card shows.
  const length: Variant = session ? session.variant : finished ? finished.variant : l && !l.variants.some(v => v.mode === chosen) ? 'standard' : chosen;
  const shown = journeyFor(data, id, length, !!session || !!finished);
  const { step, setStep, current, remember, jump: jumpTo, hush } = useJourney({ prefix: 'ar', shown, loaded, sessionId: () => openSession(getSnapshot().data, id)?.id ?? null });
  const [checking, setChecking] = useState(() => step === 'check'); // you went to Check (or reopened there): the explanation folds away
  const [explain, setExplain] = useState(false); // …until you ask for it again
  const jump = (s: JourneyStep) => { setChecking(s === 'check'); jumpTo(s); };
  if (!content || !l) return <><Card><BackLink to={'study/arabic/' + entry.module_id} label={modules.get(entry.module_id)!.name} /><h2>{entry.title}</h2></Card><Loading failed={failed} /></>;
  const task = content.exercises.find(e => e.id === l.practical_task_id), challenge = content.exercises.find(e => e.id === l.mini_challenge_id);
  const check = content.assessments.find(a => a.id === l.knowledge_check_id);
  const needsVoice = l.input_requirements?.modalities.some(m => m === 'listening' || m === 'speaking');
  const checkIds = check?.questions?.map(q => q.id) ?? [];
  // Where the finish card points: the path's next step (it moves on once you mark this lesson ready), never back here.
  const plan = arabicPlan(data)?.step;
  const next: UpNext = !plan ? null : plan.kind === 'complete' ? { kind: 'complete' } : plan.lessonId !== l.id ? { kind: plan.kind, id: plan.lessonId } : null;
  const prev = warmUpFrom(data, l.id);
  const rest = lessonSteps(data, l.id).filter(s => !shown.includes(s));
  const folded = checking && current === 'check' && shown.includes('understand') && !explain;
  const transfer = length === 'extended' ? l.variants.find(v => v.mode === 'extended') : undefined;
  const heading = (text: string) => <h3>{text}</h3>;

  const sections: Record<JourneyStep, () => ReactNode> = {
    warmup: () => <Card id="ar-step-warmup" className={STEP_SCROLL} data-ar-step="warmup"><Eyebrow>Warm-up · 2–3 minutes</Eyebrow>
      {heading('From the last lesson, from memory')}
      <p className="text-sm text-fg-2">Before anything new: answer in your head or on paper, then compare. Nothing here is saved.</p>
      {prev && <WarmUp lessonId={prev} />}</Card>,
    understand: () => <>
      <Card id="ar-step-understand" className={STEP_SCROLL} data-ar-step="understand"><Eyebrow>Understand</Eyebrow>
        {heading('Read it, and see it worked')}
        {folded ? <><p className="text-[15px] text-fg-2" data-ar-folded="">The explanation is folded away while you check yourself, so the answers come from memory.</p>
            <Button inline variant="ghost" data-action="ar-explain-again" onClick={() => setExplain(true)}>Show the explanation again</Button></>
          : <>
            <p className="text-sm text-fg-2">Key ideas: {l.key_concepts.map((k, i) => <span key={i}>{i > 0 && ' · '}<Mixed text={k} /></span>)}</p>
            {l.example && <div className="rounded-tile bg-surface border border-outline px-4 py-3 my-3" data-ar-example="">
              <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><Ar block className="text-[28px] m-0">{l.example.text_ar}</Ar></div>
                <PlayButton text={l.example.text_ar} name={`${l.id}:example`} label="the lesson’s example" /></div>
              <p className="text-sm text-fg-2 m-0">{l.example.meaning_en}</p>
              <VoiceLabel text={l.example.text_ar} />
            </div>}
            {teaching.lesson ? <div data-teaching={l.id} className="min-w-0 break-words"><TeachingRead t={teaching} /></div> : <TeachingWaiting missing={teaching.missing} bare />}
            <KeepAWord data={data} from={l.id} sentences={[l.example?.text_ar ?? '', ...arabicRuns(teaching.lesson?.example ?? '')]} />
          </>}
      </Card>
      {teaching.lesson && !folded && <TeachingMaterial t={teaching} />}
    </>,
    try: () => <Card id="ar-step-try" className={STEP_SCROLL} data-ar-step="try"><Eyebrow>Try</Eyebrow>
      {heading('Apply it, then compare')}
      {teaching.lesson && <div data-teaching={l.id} className="min-w-0 break-words"><TeachingTry t={teaching} lessonId={l.id} revealed={revealed} setRevealed={setRevealed} /></div>}
      {needsVoice && l.example && <div className="border-t border-outline pt-3 mt-4" data-ar-say-aloud="">
        <h4 className="mt-0">Say it aloud, then compare</h4>
        <p className="text-sm text-fg-2">Say the example aloud, then compare with its voice, a recording or a fluent speaker.</p>
        <div className="flex items-center gap-2"><Ar className="text-[22px]">{l.example.text_ar}</Ar><PlayButton text={l.example.text_ar} name={`${l.id}:example:try`} label="the lesson’s example" /></div>
        <VoiceLabel text={l.example.text_ar} />
      </div>}
      {task && <div className="border-t border-outline pt-3 mt-4" data-ar-task=""><h4 className="mt-0">Practical task · {task.estimated_minutes} min</h4><p><Mixed text={task.instruction} /></p>
        <h4>What to produce</h4><Lines items={task.expected_evidence} />
        <details><summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">How it’s judged</summary><ul className="list-disc pl-5">{task.rubric.map(r => <li key={r.criterion}>{r.criterion} ({r.weight}): <Mixed text={r.pass_evidence || ''} /></li>)}</ul></details>
      </div>}
      {challenge && <div className="border-t border-outline pt-3 mt-4" data-ar-challenge=""><h4 className="mt-0">Mini challenge · {challenge.estimated_minutes} min</h4><p className="mb-0"><Mixed text={challenge.instruction} /></p></div>}
      {transfer && <div className="border-t border-outline pt-3 mt-4" data-ar-transfer=""><h4 className="mt-0">For an extended session</h4><p className="mb-0"><Mixed text={transfer.activity} /></p></div>}
    </Card>,
    check: () => { const qs = check?.questions ?? [], short = length === 'short' && shown.includes('check');
      const one = (q: Question) => session ? <SessionQuestion data={data} session={session} q={q} /> : <CheckQuestion q={q} />;
      return <Card id="ar-step-check" className={STEP_SCROLL} data-ar-step="check" data-ar-check=""><Eyebrow>Check</Eyebrow>{heading('Check your understanding')}
        <p className="text-sm text-fg-2">{session ? 'Write your first answer, then compare. Once you’ve looked, your first answer stays as you wrote it.' : 'Answer first, in your head or on paper, then compare. Start a session to keep your answers.'}</p>
        <ol className="list-decimal pl-5 grid gap-4">{(short ? qs.slice(0, 1) : qs).map(q => <li key={q.id}>{one(q)}</li>)}</ol>
        {short && qs.length > 1 && <details className="mt-3" data-ar-more-checks=""><summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">{qs.length === 2 ? 'The other question' : `The other ${qs.length - 1} questions`}</summary>
          <ol start={2} className="list-decimal pl-5 grid gap-4">{qs.slice(1).map(q => <li key={q.id}>{one(q)}</li>)}</ol></details>}
        <ChecksInRevision data={data} ids={checkIds} />
      </Card>; },
    reflect: () => <div id="ar-step-reflect" className={STEP_SCROLL} data-ar-step="reflect">
      {finished && <FinishedCard data={data} lessonId={l.id} checks={checkIds} finished={finished} next={next} onClose={() => setFinished(null)} />}
      {session && <SessionFinish data={data} lesson={l} session={session} steps={[...(teaching.lesson ? ['try' as const] : []), ...(challenge ? ['challenge' as const] : [])]}
        onFinished={f => { setFinished(f); setStep('reflect'); toStep('ar', 'reflect'); }} />}
    </div>,
  };

  return <>
    <Card tone="accent">
      <BackLink to={'study/arabic/' + l.module_id} label={modules.get(l.module_id)!.name} />
      <Eyebrow>Lesson · {l.estimated_duration_minutes.standard} min · {l.stage_target}{l.optional ? ' · optional' : ''}</Eyebrow>
      <h2>{l.title}</h2>
      <LessonPlace data={data} lessonId={l.id} checks={checkIds} />
      <Lines items={l.learning_objectives} />
      {needsVoice && <p className="text-sm text-fg-2 flex gap-2 items-start mt-3 mb-0"><VolumeOff size={18} className="flex-none mt-0.5" aria-hidden="true" />This lesson uses listening or speaking. Use the assigned listening material where provided, or a fluent speaker. External recordings open on the provider’s site.</p>}
    </Card>
    {!session && <SessionChoice data={data} lesson={l} suggested={suggested} chosen={chosen} setChosen={setChosen} onBegin={() => { setStep(null); setChecking(false); setFinished(null); }} />}
    <StepBar prefix="ar" steps={shown} current={current} onPick={jump} />
    {session && <RestartOffer prefix="ar" tiny={ARABIC_TINY} step={current} onGo={s => { hush(); remember(s); setChecking(s === 'check'); }} />}
    {shown.map(s => <Fragment key={s}>{sections[s]()}</Fragment>)}
    {rest.length > 0 && <div className="mb-4" data-ar-rest={rest.join(' ')}><details>
      <summary className="flex items-center min-h-12 px-5 rounded-card border border-outline bg-surface text-primary font-semibold cursor-pointer">The rest of this lesson: {rest.map(s => STEP_LABEL[s]).join(', ')}</summary>
      <div className="mt-4">{rest.map(s => <Fragment key={s}>{sections[s]()}</Fragment>)}</div>
    </details></div>}
    <Card data-ar-more=""><details>
      <summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">More about this lesson</summary>
      {l.prerequisites.all.length > 0 && <><h3>Builds on {plural(l.prerequisites.all.length, 'earlier skill')}</h3>
        <ul className="list-disc pl-5">{l.prerequisites.all.map(s => skills[s] && <li key={s}><InlineLink href={href(skills[s].taught_by_lesson_ids[0])}>{skills[s].name}</InlineLink></li>)}</ul>
        <p className="text-sm text-fg-2">You can still explore this lesson.</p></>}
      <h3>When the lesson is done</h3><Lines items={l.completion_criteria} /><p className="text-sm text-fg-2">One full attempt is a step, not mastery: a fresh task on another day tells you more.</p>
      <LessonHistory data={data} lesson={l} />
      {l.starter_asset_ids.length > 0 && <><h3>Read alongside</h3><div className="grid gap-2">{l.starter_asset_ids.map(a => assets.get(a) && <InlineLink key={a} href={href(a)}>{assets.get(a)!.title}</InlineLink>)}</div></>}
      <h3>Module reference library</h3><ResourceLinks ids={l.resource_ids} />
    </details></Card>
  </>;
}

// The Arabic in a teaching text (its runs between the English), for Keep a word.
const arabicRuns = (text: string) => text.match(/[\u0600-\u06FF]+(?:[ \u00A0]+[\u0600-\u06FF]+)*/g) ?? [];

// A step's section stops below the step bar when you jump to it (and the header too, on wide screens).
const STEP_SCROLL = 'scroll-mt-20 lg:scroll-mt-[160px]';

function WarmUp({ lessonId }: { lessonId: string }) {
  const { content, failed } = useModule(lessonIndex[lessonId].module_id);
  const l = content?.lessons.find(x => x.id === lessonId), check = l && content!.assessments.find(a => a.id === l.knowledge_check_id);
  if (!check?.questions) return <p role="status" className="text-sm text-fg-2 m-0">{failed ? 'The last lesson’s questions couldn’t be opened just now.' : 'Opening…'}</p>;
  return <>
    <p className="text-sm m-0 mb-2">From <InlineLink href={href(lessonId)}>{lessonIndex[lessonId].title}</InlineLink>:</p>
    <ol className="list-decimal pl-5 grid gap-4">{check.questions.slice(0, 2).map(q => <li key={q.id}><CheckQuestion q={q} /></li>)}</ol>
  </>;
}

// A question with its reference answer behind a button. The answers load on first use; they are for
// self-study, so anyone with the app could read them — answer first for your own sake.
function CheckQuestion({ q }: { q: Question | { id: string; prompt: string; answer_key_id: string } }) {
  const [open, setOpen] = useState(false);
  const [referenceReady, setReferenceReady] = useState(false);
  return <div data-ar-question={q.id}>
    <p className="mb-1.5"><Mixed text={q.prompt} voice={open && referenceReady ? `${q.id}:prompt` : undefined} /></p>
    {open && referenceReady && <MixedVoiceLabel texts={[q.prompt]} />}
    {open ? <Reference keyId={q.answer_key_id} onReady={setReferenceReady} /> : <Button inline variant="ghost" data-action="ar-reveal" onClick={() => setOpen(true)}>Show the reference answer</Button>}
  </div>;
}
function Reference({ keyId, onReady }: { keyId: string; onReady?: (ready: boolean) => void }) {
  const [answers, setAnswers] = useState<Answers | null>(null), [failed, setFailed] = useState(false);
  useEffect(() => { let live = true; loadAnswers().then(a => { if (live) setAnswers(a); }, () => { if (live) setFailed(true); }); return () => { live = false; }; }, []);
  const a = answers?.[keyId];
  useEffect(() => { onReady?.(!!a); }, [a, onReady]);
  return a ? <div className="bg-surface-2 rounded-tile px-3.5 py-2.5" data-ar-answer="">
    <span className="text-sm text-fg-2">Reference answer</span><p className="mt-1 mb-1"><Mixed text={a.answer} voice={`${keyId}:answer`} /></p>
    <MixedVoiceLabel texts={[a.answer]} />
    <p className="text-sm text-fg-2 m-0">What also counts: <Mixed text={a.variation} /></p>
  </div> : <p role="status" className="text-sm text-fg-2">{failed ? 'The answers couldn’t be opened. Check your connection and try again.' : 'Opening…'}</p>;
}

// ---------- Sessions: what you did, saved as you go ----------
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const HELP: Record<Help, string> = { independent: 'On my own', hint: 'With a hint', guided: 'Guided' };
const when = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

// Just finished: which session, the checks that haven't clicked yet that came back by themselves, and the day the
// lesson comes back to practise again, when it joined revision just now.
interface Finished { attemptId: string; notYet: { id: string; due: string }[]; variant: Variant; practice: string | null }

// Before a session: choose a length, grouped as Light, Normal and Deep (three names over the lesson's own sessions).
// The suggestion comes from energy and free time; any of them counts, and you can finish early.
const MODE_GROUPS: { mode: Mode; lengths: Variant[] }[] = [{ mode: 'light', lengths: ['revision', 'short'] }, { mode: 'normal', lengths: ['practical'] }, { mode: 'deep', lengths: ['standard', 'extended'] }];
const span = (minutes: number[]) => { const lo = Math.min(...minutes), hi = Math.max(...minutes); return lo === hi ? `${lo} min` : `${lo}–${hi} min`; };
function SessionChoice({ data, lesson: l, suggested, chosen, setChosen, onBegin }: { data: MyDayData; lesson: Lesson; suggested: ReturnType<typeof lessonLength>; chosen: Variant; setChosen: (v: Variant) => void; onBegin: () => void }) {
  const all = lessonSteps(data, l.id);
  const mode = modeOf(suggested.variant);
  return <Card data-ar-session="none">
    <h3>Start a session</h3>
    <p className="text-sm text-fg-2">Choose how you want to study now. Any of them counts, and you can finish early.{suggested.variant !== 'standard' ? ` ${MODE_LABEL[mode]} (${suggested.variant}) suits today${suggested.why.length ? ` (${suggested.why.join(', ')})` : ''}; the whole lesson is still here.` : ''}</p>
    <div className="grid gap-3" role="radiogroup" aria-label="Session length">{MODE_GROUPS.map(g => {
      const vs = g.lengths.map(m => l.variants.find(v => v.mode === m)).filter((v): v is Lesson['variants'][number] => !!v);
      return vs.length > 0 && <div key={g.mode} data-ar-mode={g.mode} role="group" aria-labelledby={'ar-mode-' + g.mode}>
        <p id={'ar-mode-' + g.mode} className="text-sm font-bold m-0 mb-1.5">{MODE_LABEL[g.mode]} <span className="font-normal text-fg-3">· {span(vs.map(v => v.minutes))}</span></p>
        <div className="grid gap-2">{vs.map(v => <label key={v.mode} className="flex gap-3 items-start rounded-tile border border-outline px-3.5 py-3 cursor-pointer has-[:checked]:border-primary">
          <input type="radio" name="arVariant" data-s="ar-variant" value={v.mode} className="mt-1 size-5 flex-none accent-primary" checked={chosen === v.mode} onChange={() => setChosen(v.mode as Variant)} />
          <span><strong>{cap(v.mode)} · {v.minutes} min</strong><span className="block text-sm text-fg-2"><Mixed text={v.activity} /></span>
            {(() => { const first = journeyFor(data, l.id, v.mode, false); return <span className="block text-xs text-fg-3 mt-0.5">Shows: {first.map(s => STEP_LABEL[s]).join(', ')}{first.length < all.length ? '; the rest stay one tap away' : ''}.</span>; })()}</span>
        </label>)}</div>
      </div>; })}</div>
    <Button variant="primary" className="mt-3" data-action="ar-begin" onClick={() => { if (update(d => { beginSession(d, l.id, chosen); })) onBegin(); }}>Start a {chosen} session</Button>
  </Card>;
}

// Reflect, while a session is open: what you practised, whether you did its Try it and mini challenge, how much
// help, what to revisit, then finish (or discard).
const DID: Record<PracticeStep, string> = { try: 'Its Try it', challenge: 'Its mini challenge' };
function SessionFinish({ data, lesson: l, session: open, steps, onFinished }: { data: MyDayData; lesson: Lesson; session: ArabicAttempt; steps: PracticeStep[]; onFinished: (f: Finished) => void }) {
  const confirm = useConfirm();
  const change = (fn: (a: ArabicAttempt) => void) => update(d => { if (!changeSession(d, open.id, fn)) return false; });
  const v = l.variants.find(x => x.mode === open.variant);
  async function discard() {
    if (await confirm({ title: 'Discard this session?', body: 'Its answers, marks and note will be removed. Your other sessions stay as they are.', confirmLabel: 'Discard', cancelLabel: 'Keep it' })) update(d => { discardMarks(d, open.id, l.id); discardTicks(d, open.id, l.id); if (!discardSession(d, open.id)) return false; });
  }
  // Finishing saves the session and brings back, from tomorrow, the checks you marked Not right or Not sure; what you
  // ticked of its Try it and mini challenge is saved, and the first time the lesson comes back to practise again.
  function finish() {
    let notYet: Finished['notYet'] = [], practice: string | null = null;
    const k = todayKey();
    if (update(d => { if (!finishSession(d, open.id)) return false; notYet = bringBackNotYet(d, open.id, l.id, k); practice = bringBackPractice(d, open.id, l.id, k); }))
      onFinished({ attemptId: open.id, notYet, variant: open.variant, practice });
  }
  const did = ticksIn(data, open.id, l.id);
  return <Card tone="accent" data-ar-session="open">
    <Eyebrow><NotebookPen className="inline mr-1" size={16} aria-hidden="true" /> {MODE_LABEL[modeOf(open.variant)]} · {cap(open.variant)}{v ? ` · ${v.minutes} min` : ''} · started {when(open.startedAt)}</Eyebrow>
    <h3>Reflect</h3>
    {v && v.mode !== 'extended' && <p className="text-sm text-fg-2"><Mixed text={v.activity} /></p>}
    <h4 className="mb-1">What did you practise?</h4>
    <p className="text-sm text-fg-2 mt-0">Tick only what you actually did. Listening and speaking need a recording or a person.</p>
    <Choices label="What did you practise?">{MODALITIES.map(m => <Choice key={m} on={open.practised.includes(m)} data-action="ar-practised" data-v={m} onClick={() => change(a => { a.practised = a.practised.includes(m) ? a.practised.filter(x => x !== m) : [...a.practised, m]; })}>{cap(m)}</Choice>)}</Choices>
    {steps.length > 0 && <div data-ar-did={did.join(' ') || 'none'}>
      <h4 className="mb-1">Did you do {steps.length === 2 ? 'its Try it or mini challenge' : steps[0] === 'try' ? 'its Try it' : 'its mini challenge'}?</h4>
      <p className="text-sm text-fg-2 mt-0">Tick what you did in this session. The first time, the lesson comes back to practise again, about a week later.</p>
      <Choices label="Did you do them?">{steps.map(s => <Choice key={s} on={did.includes(s)} data-action="ar-did" data-v={s} onClick={() => update(d => { if (!tickStep(d, open.id, s, !did.includes(s))) return false; })}>{DID[s]}</Choice>)}</Choices>
    </div>}
    <h4 className="mb-1">How much help did you use?</h4>
    <Choices label="How much help did you use?">{(Object.keys(HELP) as Help[]).map(h => <Choice key={h} on={open.help === h} data-action="ar-help" data-v={h} onClick={() => change(a => { a.help = h; })}>{HELP[h]}</Choice>)}</Choices>
    <Field label="What to revisit next time" htmlFor="arRevisit"><CommitTextarea key={open.id} id="arRevisit" rows={2} dir="auto" className="ar-input" data-s="ar-revisit" defaultValue={open.revisit} placeholder="e.g. when to use مِن and when في" onCommit={el => change(a => { a.revisit = el.value.slice(0, 1000); })} /></Field>
    <div className="grid sm:grid-cols-2 gap-3 mt-3">
      <Button variant="primary" data-action="ar-finish" onClick={finish}>Finish this session</Button>
      <Button variant="ghost" data-action="ar-discard" onClick={discard}>Discard</Button>
    </div>
    <p className="text-sm text-fg-2 mt-3 mb-0">Saved as you go. Finishing records what you did, not a score.</p>
  </Card>;
}

// A check question during a session: your first answer is kept; once you look, it stays as you wrote it. Then,
// optionally, how it went, in revision's own words: that's what "looks ready" and the checks that come back use.
function SessionQuestion({ data, session, q }: { data: MyDayData; session: ArabicAttempt; q: Question }) {
  const revealed = session.revealed.includes(q.id), first = session.answers[q.id] ?? '';
  const [referenceReady, setReferenceReady] = useState(false);
  const change = (fn: (a: ArabicAttempt) => void) => update(d => { if (!changeSession(d, session.id, fn)) return false; });
  return <div data-ar-question={q.id}>
    <p className="mb-1.5"><Mixed text={q.prompt} voice={revealed && referenceReady ? `${q.id}:prompt` : undefined} /></p>
    {revealed && referenceReady && <MixedVoiceLabel texts={[q.prompt]} />}
    {revealed
      ? (first ? <div className="rounded-tile border border-outline px-3.5 py-2.5 mb-2" data-ar-first=""><span className="text-sm text-fg-2">Your first answer</span><p dir="auto" className="ar-input mt-1 mb-0 whitespace-pre-wrap">{first}</p></div>
        : <p className="text-sm text-fg-2 mb-2">You looked before answering. That’s fine, and it’s noted.</p>)
      : <CommitTextarea key={session.id + q.id} rows={2} dir="auto" className="ar-input mb-2" aria-label="Your first answer" data-s="ar-answer" data-q={q.id} defaultValue={first} placeholder="Your answer, in Arabic or English" onCommit={el => change(a => writeFirstAnswer(a, q.id, el.value))} />}
    {revealed ? <Reference keyId={q.answer_key_id} onReady={setReferenceReady} /> : <Button inline variant="ghost" data-action="ar-reveal" onClick={() => change(a => markRevealed(a, q.id))}>Show the reference answer</Button>}
    {revealed && referenceReady && <MarkAnswer data={data} session={session} q={q} />}
  </div>;
}

const OUTCOMES = Object.keys(OUTCOME) as Outcome[], SUPPORTS = Object.keys(SUPPORT) as Support[];
function MarkAnswer({ data, session, q }: { data: MyDayData; session: ArabicAttempt; q: Question }) {
  const mark = lessonRecord(data, session.lessonId)?.marks?.[q.id];
  const mine = mark?.attemptId === session.id ? mark : null;
  const set = (outcome: Outcome, support: Support) => update(d => { if (!markCheck(d, session.id, q.id, outcome, support, todayKey())) return false; });
  return <div className="mt-2" data-ar-mark={mine ? `${mine.outcome}:${mine.support}` : 'none'}>
    <p className="text-sm text-fg-2 m-0 mb-1">How did it go? <span className="text-fg-3">(optional)</span></p>
    <Choices label="How did it go?">{OUTCOMES.map(o => <Choice key={o} on={mine?.outcome === o} data-action="ar-mark" data-v={o} onClick={() => set(o, mine?.support ?? 'own')}>{OUTCOME[o]}</Choice>)}</Choices>
    {mine && <Choices label="With how much help?">{SUPPORTS.map(s => <Choice key={s} on={mine.support === s} data-action="ar-mark-support" data-v={s} onClick={() => set(mine.outcome, s)}>{SUPPORT[s]}</Choice>)}</Choices>}
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
  return done.length > 0 && <div data-ar-history=""><h3>Your sessions on this lesson</h3>
    <ul className="list-none p-0 m-0 divide-y divide-outline">{done.map(a => <li key={a.id} className="py-3"><SessionSummary a={a} /></li>)}</ul>
  </div>;
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
      <p className="mb-0">Original, fictional texts from beginner to intermediate. Early texts carry full vowel marks; later ones are written as Arabic usually is, without them. {hasReadingVoice ? 'Tap a sentence where a voice is available to hear it.' : 'No recordings yet.'}</p>
    </Card>
    <div className="grid sm:grid-cols-2 gap-3 mb-4">{texts.assets.map(a => <a key={a.id} href={href(a.id)} data-ar-text={short(a.id)} className="block no-underline text-fg rounded-card border border-outline bg-surface shadow-card p-4 hover:border-outline-strong focus-visible:outline-2 focus-visible:outline-primary">
      <span className="text-xs font-bold text-primary uppercase tracking-wide">{a.stage_target} · {a.type === 'original_text' ? 'Text' : a.type === 'structured_data' ? 'Timetable' : 'Sound pairs'}</span>
      <h3 className="mt-2 mb-1 text-[17px]">{a.title}</h3>
      {'text_ar' in a && a.text_ar && <Ar block showReading={false} className="text-[17px] text-fg-2 m-0 line-clamp-2">{a.text_ar}</Ar>}
    </a>)}</div>
  </>;
}

function TextView({ data, asset: a }: { data: MyDayData; asset: Asset }) {
  const plain = 'text_unvowelled' in a ? a.text_unvowelled : null, full = 'text_ar' in a ? a.text_ar : null;
  const [vowels, setVowels] = useState(true);
  const shown = vowels || !plain ? full : plain;
  const questions = 'comprehension_questions' in a ? (a.comprehension_questions ?? []) : [];
  const prepared = (passageReadings as Record<string, { latin: string; style: string }>)[a.id];
  const pairs = 'pairs' in a ? a.pairs : null;
  const hasPairVoice = pairs?.some(p => clipFor(p.a) || clipFor(p.b));
  return <>
    <Card>
      <BackLink to="study/arabic/texts" label="Reading texts" />
      <Eyebrow>{a.stage_target} · {a.type === 'original_text' ? 'Reading text' : a.type === 'structured_data' ? 'Timetable' : 'Sound pairs'}</Eyebrow>
      <h2>{a.title}</h2>
      {full && plain && full !== plain && <div className="flex gap-2 mb-3" role="group" aria-label="Vowel marks">
        <Button inline variant={vowels ? 'primary' : 'ghost'} aria-pressed={vowels} data-action="ar-vowels" onClick={() => setVowels(true)}>With vowel marks</Button>
        <Button inline variant={!vowels ? 'primary' : 'ghost'} aria-pressed={!vowels} data-action="ar-no-vowels" onClick={() => setVowels(false)}>Without</Button>
      </div>}
      {shown && <ReadingVoice id={a.id} full={full ?? shown} plain={plain ?? null} vowels={vowels} prepared={prepared?.latin} />}
      {full && <KeepAWord data={data} from={a.id} sentences={sentencesIn(full)} />}
      {prepared?.style.startsWith('word-by-word') && <p className="text-xs text-fg-2">The prepared transliteration is a word-by-word reading, generally without noun case endings. Use a recording for connected speech.</p>}
      {'rows' in a && a.rows && <div className="overflow-x-auto"><table className="w-full text-left border-collapse mt-2">
        <thead><tr className="border-b border-outline"><th className="py-2 pr-3">Day</th><th className="py-2 pr-3">Time</th><th className="py-2 pr-3">Activity</th><th className="py-2">Place</th></tr></thead>
        <tbody>{a.rows.map((r, i) => <tr key={i} className="border-b border-outline"><td className="py-2 pr-3"><Ar>{r.day_ar}</Ar></td><td className="py-2 pr-3 tabular-nums">{r.time}</td><td className="py-2 pr-3"><Ar>{r.activity_ar}</Ar></td><td className="py-2"><Ar>{r.place_ar}</Ar></td></tr>)}</tbody>
      </table></div>}
      {'pairs' in a && a.pairs && <ul className="list-none p-0 grid sm:grid-cols-2 gap-2 mt-2">{a.pairs.map((p, i) => <li key={i} className="rounded-tile bg-surface-2 px-3.5 py-2.5 flex items-center justify-between gap-3">
        <span><Ar className="text-[24px]">{p.a}</Ar> <span className="text-sm text-fg-2">{p.meaning_a}</span><PlayButton text={p.a} name={`${a.id}:pair:${i}:a`} label={p.a} /></span>
        <span className="text-fg-3" aria-hidden="true">/</span>
        <span><Ar className="text-[24px]">{p.b}</Ar> <span className="text-sm text-fg-2">{p.meaning_b}</span><PlayButton text={p.b} name={`${a.id}:pair:${i}:b`} label={p.b} /></span>
      </li>)}</ul>}
      {'task' in a && a.task && <p className="mt-3"><Mixed text={a.task} /></p>}
      {a.use_note && <p className="text-sm text-fg-2">{pairs && <strong>From the course’s recording brief: </strong>}<Mixed text={a.use_note} /></p>}
      {hasPairVoice && <p className="text-sm text-fg-2">The play buttons are synthesised models to copy. The course’s listening task still needs a fluent speaker’s recording.</p>}
      {hasPairVoice && pairs ? <MixedVoiceLabel texts={pairs.flatMap(p => [p.a, p.b])} />
        : !shown && <p className="text-sm text-fg-2 flex gap-2 items-start mb-0"><VolumeOff size={18} className="flex-none mt-0.5" aria-hidden="true" />No recording included. Read it aloud yourself, or ask a fluent speaker to.</p>}
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
  const kept = data.arabic.words?.length ?? 0, practice = practiceCards(data).length, any = refs.length + kept + practice;
  return <Card data-ar-revision={due ? 'due' : any ? 'later' : 'none'}>
    <h3 className="flex items-center gap-2 mt-0"><RotateCcw size={20} aria-hidden="true" />Revision</h3>
    {any
      ? <p className="text-[15px]">In your revision: {[words && plural(words, 'starter word'), kept && plural(kept, 'word') + ' you kept', checks && plural(checks, 'lesson check'), practice && plural(practice, 'lesson') + ' to practise again'].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1')}. {due ? `${due} ready now.` : next ? `Next back on ${shortDate(next)}.` : ''}</p>
      : <p className="text-[15px]">Bring words and lesson checks back at growing gaps, so they stay with you. Add them from <InlineLink href="#study/arabic/vocabulary">Vocabulary</InlineLink> or a lesson’s checks.</p>}
    {due > 0 && <Button variant="primary" data-action="ar-revise" onClick={() => startRevision('arabic')}>Revise Arabic</Button>}
  </Card>;
}

// When cards that joined by themselves first come back: "tomorrow", "on Thu 30 Oct", or "from Sat 26 Oct" when the
// 8-a-day limit spread them over several days.
function backWhen(days: string[]): string {
  const sorted = [...new Set(days)].sort();
  if (sorted.length > 1) return `from ${shortDate(sorted[0])}`;
  return sorted[0] === shift(todayKey(), 1) ? 'tomorrow' : `on ${shortDate(sorted[0])}`;
}

// After finishing a session: whether it looks ready to move on (from your marks), the checks that haven't clicked yet
// (already back in revision from tomorrow, with a way out), and your choice. Nothing is decided for you.
type UpNext = { kind: 'complete' } | { kind: Exclude<StepKind, 'complete'>; id: string } | null;
const UP_NEXT: Record<Exclude<StepKind, 'complete'>, string> = { resume: 'Pick up where you left off', revisit: 'Revisit first', revise: 'Revise Arabic first, then', lesson: 'Next lesson' };
function UpNextLink({ next }: { next: UpNext }) {
  const cls = 'inline-flex items-center min-h-11 text-primary font-semibold';
  return <p className="mt-2 mb-0" data-s="arabic-up-next">{!next ? <a className={cls} href="#study/arabic">Back to the Arabic learning map</a>
    : next.kind === 'complete' ? <a className={cls} href="#study/arabic">Every lesson on your path is ready to move on: back to the learning map</a>
    : <a className={cls} href={href(next.id)}>{UP_NEXT[next.kind]}: {lessonIndex[next.id].title}</a>}</p>;
}
function FinishedCard({ data, lessonId, checks, finished, next, onClose }: { data: MyDayData; lessonId: string; checks: string[]; finished: Finished; next: UpNext; onClose: () => void }) {
  const [back, setBack] = useState(finished.notYet), [readyNote, setReadyNote] = useState<string | null>(null), [asking, setAsking] = useState(false);
  const state = arabicState(data, lessonId), ready = looksReady(checks, marksIn(data, finished.attemptId, lessonId)), flagged = !!lessonRecord(data, lessonId)?.revisit;
  const done = state === 'ready' || state === 'holding';
  const markIt = () => { let added: { id: string; due: string }[] = []; const k = todayKey(); if (update(d => { added = markReady(d, lessonId, checks, k); })) setReadyNote(added.length ? `Its ${plural(added.length, 'check')} will come back ${backWhen(added.map(a => a.due))}.` : 'Its checks are already in your revision.'); };
  const keepOut = () => { const ids = back.map(b => b.id); if (update(d => { if (!removeCards(d, ids)) return false; })) setBack([]); };
  const [practice, setPractice] = useState(finished.practice);
  const practiceOut = () => { if (update(d => { if (!removeCards(d, [practiceCardId(lessonId)])) return false; })) setPractice(null); };
  return <Card tone="accent" data-ar-finished={ready ? 'looks-ready' : 'practised'}>
    <h3 className="mt-0">{done ? 'Ready to move on' : ready ? 'Looks ready to move on.' : 'Practised. Come back to it when you like.'}</h3>
    <p className="text-[15px]">Saved: what you did, not a score.{readyNote ? ` ${readyNote}` : ''}</p>
    {back.length > 0 && <div className="border-t border-outline pt-3 mb-3" data-ar-not-yet={back.length}>
      <p className="text-[15px] mt-0">{back.length === 1 ? '1 check that hasn’t clicked yet will' : `${back.length} checks that haven’t clicked yet will`} come back {backWhen(back.map(b => b.due))}.</p>
      <Button inline variant="ghost" data-action="ar-not-yet-out" onClick={keepOut}>Don’t bring {back.length === 1 ? 'it' : 'them'} back</Button>
    </div>}
    {practice && <div className="border-t border-outline pt-3 mb-3" data-ar-practice-back={practice}>
      <p className="text-[15px] mt-0">You’ll practise it again on {shortDate(practice)}: its Try it and mini challenge, from memory, in revision.</p>
      <Button inline variant="ghost" data-action="ar-practice-out" onClick={practiceOut}>Don’t bring it back</Button>
    </div>}
    {!done && !asking && <div className="flex flex-wrap gap-2">
      <Button variant={ready ? 'primary' : 'ghost'} data-action="ar-ready" onClick={markIt}>{ready ? 'Ready to move on' : 'Ready anyway'}</Button>
      {ready ? <Button variant="ghost" data-action="ar-not-yet" onClick={onClose}>Not yet</Button>
        : <>{flagged ? <Button variant="ghost" data-action="ar-finished-revisited" onClick={() => update(d => { if (!clearRevisit(d, lessonId)) return false; })}>Done revisiting</Button>
            : <Button variant="ghost" data-action="ar-needs-revision" onClick={() => setAsking(true)}>Needs revision…</Button>}<Button variant="ghost" data-action="ar-finished-close" onClick={onClose}>Close</Button></>}
    </div>}
    {asking && <RevisitForm lessonId={lessonId} onDone={() => setAsking(false)} />}
    <UpNextLink next={next} />
  </Card>;
}

// "Needs revision…": what needs work, in a few words (a word, a grammar point, a skill). It stays until you clear it.
function RevisitForm({ lessonId, onDone }: { lessonId: string; onDone: () => void }) {
  const [what, setWhat] = useState('');
  const save = () => { const k = todayKey(); if (update(d => { flagRevisit(d, lessonId, what, k); })) onDone(); };
  return <div className="grid gap-2 mt-2" data-ar-revisit-form="">
    <Field label="What needs work?" htmlFor="arRevisitWhat"><TextInput id="arRevisitWhat" dir="auto" maxLength={300} value={what} onChange={e => setWhat(e.target.value)} placeholder="e.g. the jussive after لم" /></Field>
    <div className="flex flex-wrap gap-2"><Button variant="primary" data-action="ar-revisit-save" onClick={save}>Mark it to revisit</Button><Button variant="ghost" onClick={onDone}>Cancel</Button></div>
  </div>;
}

// Under a lesson's title: where it stands, in words, with your choices. Holding never claims more than its checks
// show, and the line says so.
function LessonPlace({ data, lessonId, checks }: { data: MyDayData; lessonId: string; checks: string[] }) {
  const [asking, setAsking] = useState(false), [note, setNote] = useState<string | null>(null);
  const state: LessonState = arabicState(data, lessonId), rec = lessonRecord(data, lessonId);
  const sessions = sessionsFor(data, lessonId).filter(a => a.finishedAt).length;
  // When its checks really come back: the earliest due day among them (the 8-a-day limit and earlier schedules included).
  const nextBack = checks.map(id => cardOf(data, id)?.review.due).filter((x): x is string => !!x).sort()[0];
  const practice = practiceOf(data, lessonId), did = [practice?.tried && `its Try it on ${shortDate(practice.tried)}`, practice?.challenged && `its mini challenge on ${shortDate(practice.challenged)}`].filter(Boolean);
  const line = state === 'new' ? 'New: no session yet.'
    : state === 'practised' ? `Practised: ${plural(sessions, 'session')}. Mark it ready to move on when it clicks.`
    : state === 'ready' ? `Ready to move on since ${shortDate(rec!.readyOn!)}.${nextBack ? ` Its checks are in your revision: the next is ${backOn(nextBack)}.` : ''}`
    : state === 'holding' ? 'Holding: you recalled its checks on your own a week or more after marking it ready.'
    : rec?.revisit ? `Needs revision${rec.revisit.what ? `: ${rec.revisit.what}` : ''}.` : 'Needs revision: one of its checks slipped after you marked it ready. Recalling it on your own clears this.';
  const ready = () => { let added: { id: string; due: string }[] = []; const k = todayKey(); if (update(d => { added = markReady(d, lessonId, checks, k); })) setNote(added.length ? `Its ${plural(added.length, 'check')} will come back ${backWhen(added.map(a => a.due))}.` : null); };
  return <div className="rounded-tile bg-surface border border-outline px-4 py-3 my-3" data-ar-place={state}>
    <p className="m-0 font-semibold"><span dir="auto">{line}</span></p>
    {note && <p className="text-sm text-fg-2 m-0 mt-1" data-ar-place-note="">{note}</p>}
    {practice && (did.length > 0 || practice.review) && <p className="text-sm text-fg-2 m-0 mt-1" data-ar-place-practice={practice.review?.due ?? 'out'}>
      {did.length > 0 && `You last did ${did.join(' and ')}.`}{practice.review?.due && ` Practise again: ${backOn(practice.review.due, !practice.review.reps)}.`}</p>}
    {checks.length > 0 && <p className="text-sm text-fg-2 m-0 mt-1">{STATE_LABEL.holding} means its {plural(checks.length, 'written check')} came back right on your own a week or more after Ready. Listening and speaking aren’t part of them.</p>}
    {!asking && <div className="flex flex-wrap gap-2 mt-2">
      {state !== 'ready' && state !== 'holding' && <Button inline variant="ghost" data-action="ar-place-ready" onClick={ready}>Ready to move on</Button>}
      {rec?.readyOn && <Button inline variant="ghost" data-action="ar-place-unready" onClick={() => update(d => { if (!unmarkReady(d, lessonId)) return false; })}>Not ready after all</Button>}
      {rec?.revisit ? <Button inline variant="ghost" data-action="ar-place-revisited" onClick={() => update(d => { if (!clearRevisit(d, lessonId)) return false; })}>Done revisiting</Button>
        : <Button inline variant="ghost" data-action="ar-place-revisit" onClick={() => setAsking(true)}>Needs revision…</Button>}
    </div>}
    {asking && <RevisitForm lessonId={lessonId} onDone={() => setAsking(false)} />}
  </div>;
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
// The words you kept (Keep a word): add one by typing it, see each one's place in revision both ways, practise writing
// it too, change your meaning or note, or remove it (asked first). Your words stay yours: never sent to AI.
function YourWords({ data }: { data: MyDayData }) {
  const confirm = useConfirm();
  const words = data.arabic.words ?? [];
  const [adding, setAdding] = useState(false), [ar, setAr] = useState(''), [meaning, setMeaning] = useState(''), [note, setNote] = useState('');
  const [editing, setEditing] = useState<string | null>(null), [editMeaning, setEditMeaning] = useState(''), [editNote, setEditNote] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const starter = ar.trim() ? starterFor(ar) : null, already = ar.trim() ? keptWord(data, ar) : null;
  const add = () => {
    const k = todayKey(); let res: { id: string; added: boolean } | null = null;
    if (update(d => { res = keepWord(d, { ar, meaning, note }, k); if (!res?.added) return false; })) { setMsg(`Kept ${ar.trim()}. It comes back in revision from tomorrow.`); setAr(''); setMeaning(''); setNote(''); setAdding(false); }
  };
  const fromLabel = (from?: string) => !from ? null : from.startsWith('lesson.') ? lessonIndex[from]?.title : assets.get(from)?.title;
  async function remove(id: string, word: string) {
    if (await confirm({ title: 'Remove this word?', body: `${word}: it leaves your words and your revision. Your past answers stay in your history.`, confirmLabel: 'Remove it', cancelLabel: 'Keep it' }))
      update(d => { if (!removeWord(d, id)) return false; });
  }
  return <Card data-ar-your-words={words.length}><Eyebrow>Vocabulary</Eyebrow><h2>Your words</h2>
    <p className="text-[15px]">{words.length ? `${plural(words.length, 'word')} you kept, each with your meaning.` : 'None yet. Keep a word from a lesson’s examples or a reading text, or add one here.'} A word you keep comes back in revision from the next day, Arabic → meaning; writing it from memory is your choice.</p>
    {msg && <p role="status" className="text-[15px]">{msg}</p>}
    {!adding ? <Button inline variant="ghost" data-action="ar-word-own" onClick={() => { setAdding(true); setMsg(null); }}>Add your own word</Button>
      : <form className="grid gap-3 rounded-tile border border-outline px-4 py-3" onSubmit={e => { e.preventDefault(); add(); }} data-ar-own-word="">
        <Field label="The word in Arabic" htmlFor="arOwnWord"><TextInput id="arOwnWord" data-s="ar-own-ar" dir="rtl" lang="ar" className="ar-input" maxLength={AR_MAX} value={ar} onChange={e => setAr(e.target.value)} placeholder="بَيْت" /></Field>
        {already && <p className="text-sm m-0" data-ar-keep-already="">Already in your words: {already.meaning}.</p>}
        {starter && !already && <p className="text-sm text-fg-2 m-0">One of the starter words: “{starter.meaning_en}”. <button type="button" className="text-primary font-semibold underline-offset-2 hover:underline bg-transparent border-0 p-0 cursor-pointer min-h-11" onClick={() => setMeaning(starter.meaning_en)}>Use the course’s meaning</button></p>}
        <Field label="Your meaning" htmlFor="arOwnMeaning"><TextInput id="arOwnMeaning" data-s="ar-own-meaning" maxLength={MEANING_MAX} value={meaning} onChange={e => setMeaning(e.target.value)} placeholder="e.g. house" /></Field>
        <Field label="A note (optional)" htmlFor="arOwnNote"><TextInput id="arOwnNote" data-s="ar-own-note" maxLength={NOTE_MAX} value={note} onChange={e => setNote(e.target.value)} /></Field>
        <div className="flex flex-wrap gap-2"><Button inline type="submit" variant="primary" data-action="ar-own-save" disabled={!ar.trim() || !meaning.trim() || !!already}>Keep it</Button><Button inline variant="ghost" onClick={() => setAdding(false)}>Cancel</Button></div>
      </form>}
    {words.length > 0 && <ul className="list-none p-0 m-0 mt-3 divide-y divide-outline" data-ar-kept-words="">{[...words].reverse().map(w => {
      const recognise = cardState(data, keptCardId(w.id, 'recognise')), write = w.write ? cardState(data, keptCardId(w.id, 'write')) : null, from = fromLabel(w.from);
      return <li key={w.id} className="py-3" data-ar-kept={w.id}>
        <Ar block className="text-[26px] font-medium m-0">{w.ar}</Ar>
        {editing === w.id ? <form className="grid gap-2 mt-2" onSubmit={e => { e.preventDefault(); update(d => { if (!editWord(d, w.id, { meaning: editMeaning, note: editNote })) return false; }); setEditing(null); }}>
            <Field label="Your meaning" htmlFor={'arEditM' + w.id}><TextInput id={'arEditM' + w.id} maxLength={MEANING_MAX} value={editMeaning} onChange={e => setEditMeaning(e.target.value)} /></Field>
            <Field label="A note (optional)" htmlFor={'arEditN' + w.id}><TextInput id={'arEditN' + w.id} maxLength={NOTE_MAX} value={editNote} onChange={e => setEditNote(e.target.value)} /></Field>
            <div className="flex flex-wrap gap-2"><Button inline type="submit" variant="primary" data-action="ar-kept-save" disabled={!editMeaning.trim()}>Save</Button><Button inline variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
          </form>
          : <><p className="text-[15px] m-0">{w.meaning}</p>{w.note && <p className="text-sm text-fg-2 m-0" dir="auto">{w.note}</p>}</>}
        <p className="text-sm text-fg-3 m-0 mt-1">{from ? <>From <InlineLink href={'#study/arabic/' + w.from}>{from}</InlineLink> · </> : ''}kept {shortDate(w.addedOn)}</p>
        <p className="text-sm m-0 mt-1">{recognise && <span className="block">Recognising it: {recognise}</span>}{write && <span className="block">Writing it: {write}</span>}</p>
        {editing !== w.id && <div className="flex flex-wrap gap-2 mt-1.5">
          {!w.write ? <Button inline variant="ghost" data-action="ar-kept-write" onClick={() => update(d => { if (!practiseWriting(d, w.id, true, todayKey())) return false; })}>Also practise writing it</Button>
            : <Button inline variant="ghost" data-action="ar-kept-unwrite" onClick={() => update(d => { if (!practiseWriting(d, w.id, false, todayKey())) return false; })}>Stop practising writing it</Button>}
          <Button inline variant="ghost" data-action="ar-kept-edit" onClick={() => { setEditing(w.id); setEditMeaning(w.meaning); setEditNote(w.note ?? ''); }}>Change your meaning</Button>
          <Button inline variant="ghost" data-action="ar-kept-remove" onClick={() => remove(w.id, w.ar)}>Remove</Button>
        </div>}
      </li>;
    })}</ul>}
  </Card>;
}

function Vocabulary({ data }: { data: MyDayData }) {
  const confirm = useConfirm();
  const k = todayKey(), ids = texts.lexicon.map(w => w.id), next = nextWords(data, ids, ADD_A_FEW), today = wordsAddedOn(data, k);
  const inRev = ids.filter(id => wordInRevision(data, id)).length, plenty = today >= NEW_WORDS_A_DAY;
  async function takeOut(w: (typeof texts.lexicon)[number]) {
    if (await confirm({ title: 'Take this word out of revision?', body: `“${w.meaning_en}”: your past answers stay in your history. If you add it again, it starts afresh.`, confirmLabel: 'Take it out', cancelLabel: 'Keep it' }))
      outOfRevision([wordCard(w.id, 'recognise'), wordCard(w.id, 'write')]);
  }
  return <>
    <YourWords data={data} />
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

