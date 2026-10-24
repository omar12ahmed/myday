import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { BookOpen, FlaskConical, NotebookPen, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field, Select, TextInput } from '../../components/Field';
import { getSnapshot, update, updateSaved } from '../../data/storage';
import type { MyDayData } from '../../data/types';
import { toast } from '../../data/toast';
import { curriculumTaskId, lessonHref } from '../../data/cybersecurity/types';
import { stIndex } from '../../data/study/roadmap';
import { activeStudy, startStudySession } from '../../data/study/sessions';
import { startLearning } from '../actions';
import { go } from '../route';
import { BackLink, Eyebrow, ExternalLink, InlineLink } from '../parts';
import { Lines, LinkButton } from './parts';
import { activities, curriculum, environments, lessons, modules, resources, selectedPath, skills, type Lesson } from './catalogue';
import { attemptsFor, cyberJourney, cyberSteps, importPath, nextLesson, prerequisiteGaps, sessionMode, suggestedSession, warmUpLesson } from './learning';
import { ActivityView } from './Notebook';
import { AiCards } from './AiCards';
import { TutorCard } from './TutorCard';
import { PracticeIndex, PracticeView, RelatedPractice } from './Practice';
import { CheckRevision, CyberRevisionGlance } from './CheckRevision';
import { TeachingMaterial, TeachingRead, TeachingTry, TeachingWaiting } from '../teaching/TeachingLesson';
import { useTeaching } from '../teaching/useTeaching';
import { MODE_LABEL, modeOf, STEP_LABEL, type JourneyStep, type Mode } from '../../data/study/mastery';
import { RestartOffer, StepBar } from '../journey/Journey';
import { CYBER_TINY } from '../journey/dom';
import { useJourney } from '../journey/useJourney';
import { keepSessionMode, keptSessionMode } from '../lessonStep';
import { ForYourProject } from '../../projects/ForYourProject';

export function ResourceLinks({ ids }: { ids: string[] }) {
  return <div className="grid gap-3">{ids.map(id => { const r = resources.get(id); return r && <div key={id}>
    <ExternalLink href={r.url}>{r.title}</ExternalLink>
    <p className="text-sm text-fg-2 m-0">{r.use_note}</p>
    <p className="text-xs text-fg-3 m-0 mt-1">Package checked: {r.verified_on}. Access and prices may change.</p>
  </div>; })}</div>;
}
export default function CyberScreen({ data, id }: { data: MyDayData; id: string }) {
  const lesson = lessons.get(id), module = modules.get(id), activity = activities.get(id);
  const activeTab = activity?.practice || id === 'practice' ? 'practice' : id === 'notebook' || id === 'toolkit' ? id : 'map';
  return <div className="cyber-workshop break-words">
    <nav className="workspace-tabs" aria-label="Cybersecurity">
      <a href="#study">‹ Study</a>
      {[['map', 'Learning map', ''], ['practice', 'Practice', '/practice'], ['notebook', 'Lab notebook', '/notebook'], ['toolkit', 'Toolkit', '/toolkit']].map(([key, label, path]) => <a key={key} href={'#study/cybersecurity' + path} aria-current={activeTab === key ? 'page' : undefined}>{label}</a>)}
    </nav>
    {lesson ? <LessonView key={lesson.id} data={data} lesson={lesson} />
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
    <Card className="next-card cyber-map-intro">
      <Eyebrow><ShieldCheck className="inline mr-1" size={18} aria-hidden="true" /> Cybersecurity workshop</Eyebrow>
      <h2 className="text-[28px] lg:text-[34px]">Build skills through practice.</h2>
      <p>Follow the foundations, choose a specialism, and keep the evidence from each attempt. Pick up wherever you left off.</p>
      <p className="text-sm text-fg-2">{submitted ? `${submitted} submitted attempt${submitted === 1 ? '' : 's'} in your notebook` : 'Your notebook is ready for your first discovery'}. Reading and time spent do not award mastery.</p>
      <div className="rounded-tile bg-surface p-4 border border-outline mt-4">
        <Eyebrow>Your next small step</Eyebrow><h3>{next.lesson.title}</h3><p className="text-sm text-fg-2">{next.reason}.</p>
        <div className="grid sm:grid-cols-2 gap-3"><LinkButton to={'study/cybersecurity/' + next.lesson.id} primary>Open lesson</LinkButton><LinkButton to="study/cybersecurity/practice">Explore practice activities</LinkButton></div>
      </div>
      <CyberRevisionGlance data={data} />
    </Card>
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
// A lesson as one page in steps (specs/study-home-and-lessons.md §5), as for Arabic: Warm-up (the last lesson's
// knowledge check, from memory), Understand, Try (Learn by doing, more practice and the tutor), Check (its knowledge
// check: compare here, keep your answers in the lab notebook) and Reflect (while its Study timer runs: finish in the
// session). The session you choose, Light, Normal or Deep over the lesson's own lengths, sets the timer and which
// steps come first; the rest stay one tap away.
const MODES: { mode: Mode; lengths: string[] }[] = [{ mode: 'light', lengths: ['revision', 'short'] }, { mode: 'normal', lengths: ['practical'] }, { mode: 'deep', lengths: ['standard', 'extended'] }];
const cap = (x: string) => x[0].toUpperCase() + x.slice(1);
const CY_SCROLL = 'scroll-mt-20 lg:scroll-mt-[160px]';
function LessonView({ data, lesson: l }: { data: MyDayData; lesson: Lesson }) {
  const gaps = prerequisiteGaps(l.id), task = stIndex(data.study).task.get(curriculumTaskId(l.id));
  const current = activeStudy(data.study), running = current && current.taskId === curriculumTaskId(l.id) ? current : null;
  const teaching = useTeaching('cybersecurity', l.id);
  const [revealed, setRevealed] = useState(false);
  const [suggested] = useState(() => suggestedSession(data, l));
  const [chosen, setChosen] = useState<string>(suggested.mode);
  const mode = running ? sessionMode(l, running, keptSessionMode(running.id)) : chosen, variant = l.variants.find(v => v.mode === chosen);
  const minutes = variant?.minutes ?? 15;
  const shown = cyberJourney(data, l.id, mode, !!running);
  const runningHere = () => { const c = activeStudy(getSnapshot().data.study); return c && c.taskId === curriculumTaskId(l.id) ? c.id : null; };
  // The teaching loads after the page: reopening at your step waits for it, so the page doesn't move under you.
  const { step: kept, current: step, jump: jumpTo, remember, hush } = useJourney({ prefix: 'cy', shown, loaded: !!teaching.lesson || teaching.missing, sessionId: runningHere });
  const [checking, setChecking] = useState(() => kept === 'check'); // you went to Check: the explanation folds away
  const [explain, setExplain] = useState(false); // …until you ask for it again
  const jump = (x: JourneyStep) => { setChecking(x === 'check'); jumpTo(x); };
  const folded = checking && step === 'check' && shown.includes('understand') && !explain;
  // The session you chose for the timer, remembered on this device (its minutes alone can't always tell).
  const rememberMode = () => { const id = runningHere(); if (id) keepSessionMode(id, chosen); };
  const rest = cyberSteps(data, l.id).filter(x => !shown.includes(x)), prev = warmUpLesson(data, l.id);
  const check = activities.get(l.knowledge_check_id), qs = check?.questions ?? [];
  const choice = <>
    <Field label="Your session" htmlFor="cyberMinutes"><Select id="cyberMinutes" value={chosen} onChange={e => setChosen(e.target.value)}>
      {MODES.map(g => <optgroup key={g.mode} label={MODE_LABEL[g.mode]}>{g.lengths.map(m => l.variants.find(v => v.mode === m)).filter(Boolean).map(v => <option key={v!.mode} value={v!.mode}>{cap(v!.mode)} · {v!.minutes} min</option>)}</optgroup>)}
    </Select></Field>
    {variant && (() => { const first = cyberJourney(data, l.id, variant.mode, false); return <p className="text-sm text-fg-2 m-0" data-cy-session-note="">{MODE_LABEL[modeOf(variant.mode)]}: {variant.activity.replace(/[.;]?$/, '.')}
      {suggested.mode === chosen && suggested.why.length ? ` Suits today (${suggested.why.join(', ')}).` : ''} <span className="text-fg-3">Evidence: {variant.evidence_scope}.</span>
      <span className="block text-fg-3 mt-0.5">Shows {first.map(x => STEP_LABEL[x]).join(', ')}{first.length < cyberSteps(data, l.id).length ? ' first; the rest stay one tap away' : ''}.</span></p>; })()}
  </>;

  const sections: Record<JourneyStep, () => ReactNode> = {
    warmup: () => <Card id="cy-step-warmup" className={CY_SCROLL} data-cy-step="warmup"><Eyebrow>Warm-up · 2–3 minutes</Eyebrow>
      <h3>From the last lesson, from memory</h3>
      <p className="text-sm text-fg-2">Before anything new: answer in your head or on paper, then compare. Nothing here is saved.</p>
      {prev && <><p className="text-sm m-0 mb-2">From <InlineLink href={lessonHref(prev)}>{lessons.get(prev)!.title}</InlineLink>:</p>
        <ol className="list-decimal pl-5 grid gap-4">{(activities.get(lessons.get(prev)!.knowledge_check_id)?.questions ?? []).slice(0, 2).map(q => <li key={q.id}><CheckPrompt q={q} /></li>)}</ol></>}
    </Card>,
    understand: () => <>
      <Card id="cy-step-understand" className={CY_SCROLL} data-cy-step="understand"><Eyebrow>Understand</Eyebrow>
        <h3>Read it, and see it worked</h3>
        {folded ? <><p className="text-[15px] text-fg-2" data-cy-folded="">The explanation is folded away while you check yourself, so the answers come from memory.</p>
            <Button inline variant="ghost" data-action="cy-explain-again" onClick={() => setExplain(true)}>Show the explanation again</Button></>
          : <>
            <p className="text-sm text-fg-2">Key concepts: {l.key_concepts.join(' · ')}</p>
            {teaching.lesson ? <div data-teaching={l.id} className="min-w-0 break-words"><TeachingRead t={teaching} /></div> : <TeachingWaiting missing={teaching.missing} bare />}
          </>}
      </Card>
      {teaching.lesson && !folded && <TeachingMaterial t={teaching} />}
    </>,
    try: () => <div id="cy-step-try" className={CY_SCROLL} data-cy-step="try">
      <Card><Eyebrow>Try</Eyebrow><h3>Apply it, then compare</h3>
        {teaching.lesson && <div data-teaching={l.id} className="min-w-0 break-words"><TeachingTry t={teaching} lessonId={l.id} revealed={revealed} setRevealed={setRevealed} /></div>}
        <h4>Learn by doing</h4>
        <p className="text-sm text-fg-2 mt-0">Each opens in your lab notebook, where your evidence is kept.</p>
        <div className="grid gap-3">{[l.practical_task_id, l.mini_challenge_id].map(id => <LinkButton key={id} to={'study/cybersecurity/' + id}>{activities.get(id)!.title}</LinkButton>)}</div>
      </Card>
      <AiCards key={'cards-' + l.id} data={data} lesson={l} coursePrompts={qs.map(q => q.prompt)} />
      <RelatedPractice data={data} ids={[l.id]} />
      <TutorCard key={l.id} lesson={l} />
    </div>,
    check: () => { const short = mode === 'short' && shown.includes('check');
      return <Card id="cy-step-check" className={CY_SCROLL} data-cy-step="check" data-cy-check=""><Eyebrow>Check</Eyebrow><h3>Check your understanding</h3>
        <p className="text-sm text-fg-2">Answer first, in your head or on paper, then compare. The guide is for self-study after your own attempt; looking isn’t a pass. To keep your answers, answer in your lab notebook, and if you looked first, say so there.</p>
        <ol className="list-decimal pl-5 grid gap-4">{(short ? qs.slice(0, 1) : qs).map(q => <li key={q.id}><CheckPrompt q={q} /></li>)}</ol>
        {short && qs.length > 1 && <details className="mt-3" data-cy-more-checks=""><summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">{qs.length === 2 ? 'The other question' : `The other ${qs.length - 1} questions`}</summary>
          <ol start={2} className="list-decimal pl-5 grid gap-4">{qs.slice(1).map(q => <li key={q.id}><CheckPrompt q={q} /></li>)}</ol></details>}
        {check && <div className="mt-3"><LinkButton to={'study/cybersecurity/' + check.id} primary>Answer in your lab notebook</LinkButton></div>}
        <CheckRevision data={data} ids={qs.map(q => q.id)} />
      </Card>; },
    reflect: () => <Card id="cy-step-reflect" className={CY_SCROLL} data-cy-step="reflect"><Eyebrow>Reflect</Eyebrow><h3>Before you finish</h3>
      <h4>Completion criteria</h4><Lines items={l.completion_criteria} />
      <p className="text-sm text-fg-2">A short session is a checkpoint. Marking a roadmap task complete records your choice, not verified mastery.</p>
      <LinkButton to="study/session" primary>Finish in your study session</LinkButton>
    </Card>,
  };

  return <>
    <Card tone="accent"><BackLink to={'study/cybersecurity/' + l.module_id} label={modules.get(l.module_id)!.name} />
      <Eyebrow>Lesson · {l.estimated_duration_minutes.standard} min{l.optional ? ' · Optional extension' : ''}</Eyebrow><h2>{l.title}</h2>
      <ForYourProject data={data} kind="cyber" id={l.id} className="-mt-1 mb-2" />
      <Lines items={l.learning_objectives} />
      {current ? <LinkButton to="study/session">Return to your study session</LinkButton> : task ? <div className="grid gap-3 mt-3">
        {choice}
        <Button onClick={() => { startLearning(task.course.id, task.node.id, minutes, minutes < l.estimated_duration_minutes.standard); rememberMode(); }}>Start a study session</Button>
      </div> : selectedPath(data.cybersecurity.pathId).required_module_ids.includes(l.module_id) ? <div className="grid gap-3 mt-3">
        <p className="text-sm text-fg-2 m-0">Start from this lesson. MyDay will add your selected curriculum path to the roadmap without changing existing work.</p>
        {choice}
        <Button data-action="cyber-start-direct" onClick={() => {
          let resume = false;
          const saved = updateSaved(d => {
            if (activeStudy(d.study)) { resume = true; return false; }
            if (!selectedPath(d.cybersecurity.pathId).required_module_ids.includes(l.module_id)) return false;
            importPath(d, d.cybersecurity.pathId);
            const entry = stIndex(d.study).task.get(curriculumTaskId(l.id));
            if (!entry || !startStudySession(d.study, entry.course.id, entry.node.id, minutes, minutes < l.estimated_duration_minutes.standard)) return false;
          });
          if (saved === 'saved') rememberMode();
          if (saved === 'saved' || resume) go('study/session');
          else if (saved === 'unchanged') toast('Choose this curriculum path on the learning map to start its timer.');
          else toast("Couldn't save the lesson. Your existing work is unchanged.");
        }}>Start this lesson</Button>
      </div> : <p className="text-sm text-fg-2">You can explore the activities below now. Add this lesson’s path on the learning map to use the Study timer.</p>}
    </Card>
    <StepBar prefix="cy" steps={shown} current={step} onPick={jump} />
    {running && <RestartOffer prefix="cy" tiny={CYBER_TINY} step={step} onGo={x => { hush(); remember(x); setChecking(x === 'check'); }} />}
    {shown.map(x => <Fragment key={x}>{sections[x]()}</Fragment>)}
    {rest.length > 0 && <div className="mb-4" data-cy-rest={rest.join(' ')}><details>
      <summary className="flex items-center min-h-12 px-5 rounded-card border border-outline bg-surface text-primary font-semibold cursor-pointer">The rest of this lesson: {rest.map(x => STEP_LABEL[x]).join(', ')}</summary>
      <div className="mt-4">{rest.map(x => <Fragment key={x}>{sections[x]()}</Fragment>)}</div>
    </details></div>}
    <Card data-cy-more=""><details>
      <summary className="cursor-pointer min-h-11 py-2 text-primary font-semibold">More about this lesson</summary>
      <h3>Prerequisites {gaps.length ? `(${gaps.length})` : '— none'}</h3>
      {gaps.length ? <><p className="text-sm">These thresholds require demonstrated skill evidence. Your self-study scores do not unlock them automatically; you can still explore this lesson.</p>
        <ul className="list-disc pl-5">{gaps.map(g => <li key={g.skill_id}><InlineLink href={lessonHref(skills.get(g.skill_id)!.taught_by_lesson_ids[0])}>{skills.get(g.skill_id)!.name}</InlineLink> — readiness at least {g.min_mastery}/100; not verified here</li>)}</ul></> : <p>You can start here.</p>}
      <h3>Completion criteria</h3><Lines items={l.completion_criteria} /><p className="text-sm text-fg-2">A short session is a checkpoint. Marking a roadmap task complete records your choice, not verified mastery.</p>
      <h3>Sessions for this lesson</h3>{l.variants.map(v => <p key={v.mode} className="text-sm"><strong>{cap(v.mode)} · {v.minutes} min</strong> ({MODE_LABEL[modeOf(v.mode)]}): {v.activity} <span className="text-fg-2">{v.evidence_scope}</span></p>)}
      <h3>Module reference library</h3><ResourceLinks ids={l.resource_ids} />
    </details></Card>
  </>;
}
// A knowledge-check question with its answer guide behind a button (the guide loads on first use). Focus moves to the
// guide as it opens, and it's announced when it arrives; if it can't load, the button comes back to try again.
function CheckPrompt({ q }: { q: { id: string; prompt: string } }) {
  const [open, setOpen] = useState(false), [answers, setAnswers] = useState<Record<string, string> | null>(null), [failed, setFailed] = useState(false);
  const guide = useRef<HTMLDivElement>(null), live = useRef(true);
  useEffect(() => () => { live.current = false; }, []);
  const reveal = () => {
    setOpen(true); setFailed(false);
    requestAnimationFrame(() => guide.current?.focus({ preventScroll: true }));
    import('./answers.json').then(x => { if (live.current) setAnswers(x.default); }).catch(() => { if (live.current) { setFailed(true); setOpen(false); } });
  };
  return <div data-cy-question={q.id}>
    <p className="mb-1.5">{q.prompt}</p>
    {failed && <p role="alert" className="text-sm text-fg-2 mb-1">Couldn’t load the guide. Try again in a moment.</p>}
    {!open ? <Button inline variant="ghost" data-action="cy-reveal" onClick={reveal}>Show the answer guide</Button>
      : <div ref={guide} tabIndex={-1} className="bg-surface-2 rounded-tile px-3.5 py-2.5" data-cy-answer=""><span className="text-sm text-fg-2">Answer guide</span>
        <p className="mt-1 mb-0" role="status">{answers ? answers[q.id] : 'Opening…'}</p></div>}
  </div>;
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
