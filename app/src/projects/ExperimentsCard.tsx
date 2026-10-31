import { Check, FlaskConical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { Field, Select, TextArea, TextInput } from '../components/Field';
import { LinkButton, Note } from '../components/parts';
import { shortDate } from '../data/dates';
import {
  addExperiment, addExperimentTask, awaitingResult, editExperiment, experimentsLine, experimentsOf, experimentTask, findingOffered, recordResult, reopenExperiment,
  saveAsFinding, savedFinding, startExperiment, STATUS_LABEL, statusOf, testChoices, testedThings, testKey, type TestKind,
} from '../data/experiments';
import { nextStep } from '../data/projects';
import { hasResearch, removeResearch, RESEARCH_LIMITS, STANCES, type Stance } from '../data/research';
import { update } from '../data/storage';
import { isDone } from '../data/tasks';
import { toast } from '../data/toast';
import type { MyDayData, Project, ResearchExperiment } from '../data/types';
import { tabHref } from './planText';

// Experiments (specs/projects-business-tools.md): on a business idea's Model tab and on any Research tab — the same
// records either way. Planned → Running → Done only when you say so; a done one's result can be saved as a finding,
// which you weigh yourself. The rules are in data/experiments.ts. Never sent to AI.

const STANCE_WORD: Record<Stance, string> = { supports: 'Supports it', contradicts: 'Contradicts it', relates: 'Relates to it' };
const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
const apply = (fn: (d: MyDayData) => boolean) => update(d => (fn(d) ? undefined : false));
export type Test = { kind: TestKind; id: string };
// The card's form: closed (null), or open testing these things. The tab holds it, so "Plan an experiment" under a
// thing that must be true can open it.
export type Planning = { planning: Test[] | null; setPlanning: (t: Test[] | null) => void };

export function ExperimentsCard({ data, p, planning, setPlanning }: { data: MyDayData; p: Project } & Planning) {
  const list = experimentsOf(data, p.id);
  const full = list.length >= RESEARCH_LIMITS.experiments;
  return (
    <Card aria-labelledby="pjExperimentsH" id="projectExperiments" data-s="experiments">
      <h3 id="pjExperimentsH" className="flex items-center gap-2" tabIndex={-1}><FlaskConical size={20} aria-hidden="true" className="text-primary" /> Experiments</h3>
      <Note className="mt-0">{list.length ? experimentsLine(list) : 'Test something you believe before you build on it: what you’ll try, and what result would change your mind.'}</Note>
      {list.length > 0 && <ul className="list-none p-0 m-0" aria-label="Experiments">{list.map(e => <ExperimentRow key={e.id} data={data} p={p} e={e} />)}</ul>}
      {full ? <Note className="mb-0 mt-3">{RESEARCH_LIMITS.experiments} experiments is the most a project can have.</Note>
        : planning ? <div className="mt-3 rounded-tile bg-surface-2 border border-outline p-3"><ExperimentForm key={planning.map(testKey).join()} data={data} p={p} tests={planning} onDone={() => { setPlanning(null); focusSoon('experimentPlan'); }} /></div>
        : <Button inline className="mt-3" id="experimentPlan" data-action="experiment-plan" onClick={() => setPlanning([])}><FlaskConical size={18} aria-hidden="true" /> Plan an experiment</Button>}
    </Card>
  );
}

// Planning one (or changing what it is). Only what you'll try is needed.
function ExperimentForm({ data, p, e, tests, onDone, onRemove }: { data: MyDayData; p: Project; e?: ResearchExperiment; tests?: Test[]; onDone: () => void; onRemove?: () => void }) {
  // (What it already tests stays offered even when it no longer would be, e.g. a decision chosen since: never dropped by an edit.)
  const offered = testChoices(data, p), choices = [...offered, ...(e ? testedThings(data, e).filter(t => !offered.some(o => o.kind === t.kind && o.id === t.id)) : [])];
  const [title, setTitle] = useState(e?.title ?? ''), [how, setHow] = useState(e?.how ?? ''), [expect, setExpect] = useState(e?.expect ?? '');
  const [picked, setPicked] = useState<Test[]>(e ? e.tests.filter((t): t is Test => t.kind === 'assumption' || t.kind === 'question' || t.kind === 'option') : tests ?? []);
  const idp = e ? `exE-${e.id}` : 'exN', on = (t: Test) => picked.some(x => x.kind === t.kind && x.id === t.id);
  const toggle = (t: Test, yes: boolean) => setPicked(l => (yes ? [...l, t] : l.filter(x => !(x.kind === t.kind && x.id === t.id))));
  function save() {
    if (e) { apply(d => editExperiment(d, e.id, { title, tests: picked, how, expect })); onDone(); return; }
    const out: { r: ReturnType<typeof addExperiment> } = { r: { ok: false, why: '' } };
    update(d => { out.r = addExperiment(d, p.id, { title, tests: picked, how, expect }); return out.r.ok ? undefined : false; });
    if (!out.r.ok) { if (out.r.why) toast(out.r.why); return; }
    toast('Planned. Start it whenever you’re ready.');
    onDone();
  }
  return (
    <form className="grid gap-3" data-s="experiment-form" onSubmit={ev => { ev.preventDefault(); save(); }}>
      <Field label="What will you try?" htmlFor={`${idp}-title`}><TextInput id={`${idp}-title`} value={title} maxLength={RESEARCH_LIMITS.title} autoFocus placeholder="e.g. Ask 20 shops if they’d pay $5 a month" onChange={ev => setTitle(ev.target.value)} /></Field>
      {choices.length > 0 && (
        <fieldset className="border-0 p-0 m-0 grid gap-1">
          <legend className="text-sm text-fg-2 mb-1">What it tests</legend>
          {choices.map(t => (
            <label key={testKey(t)} className="flex items-start gap-2 min-h-11 py-2 text-[15px] cursor-pointer">
              <input type="checkbox" className="w-5 h-5 mt-0.5 flex-none" data-s="experiment-test" data-id={t.id} checked={on(t)} disabled={!on(t) && picked.length >= RESEARCH_LIMITS.testsPerExperiment} onChange={ev => toggle(t, ev.target.checked)} />
              <span className="break-words">{t.kind === 'assumption' ? 'Must be true: ' : t.kind === 'option' ? 'Option: ' : 'Question: '}{t.text}</span>
            </label>
          ))}
        </fieldset>
      )}
      <Field label="How will you run it? (optional)" htmlFor={`${idp}-how`}><TextArea id={`${idp}-how`} rows={2} value={how} maxLength={RESEARCH_LIMITS.text} placeholder="e.g. Visit on two market days; same three questions each time" onChange={ev => setHow(ev.target.value)} /></Field>
      <Field label="What result would change your mind? (optional)" htmlFor={`${idp}-expect`}><TextArea id={`${idp}-expect`} rows={2} value={expect} maxLength={RESEARCH_LIMITS.text} placeholder="e.g. Fewer than 5 say yes" onChange={ev => setExpect(ev.target.value)} /></Field>
      <div className="flex flex-wrap gap-2">
        <Button inline type="submit" variant="primary" data-action="experiment-save" disabled={!title.trim()}>{e ? 'Save' : 'Plan it'}</Button>
        <Button inline variant="ghost" data-action="experiment-cancel" onClick={onDone}>Cancel</Button>
        {onRemove && <Button inline variant="ghost" className="ml-auto" data-action="experiment-remove" onClick={onRemove}><Trash2 size={18} aria-hidden="true" /> Remove</Button>}
      </div>
    </form>
  );
}

function ExperimentRow({ data, p, e }: { data: MyDayData; p: Project; e: ResearchExperiment }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false), [recording, setRecording] = useState(false);
  const status = statusOf(e), tested = testedThings(data, e), task = experimentTask(data, e), waiting = awaitingResult(data, e), offered = findingOffered(data, e), saved = savedFinding(data, e);
  const when = status === 'running' ? (e.startedOn ? `Running since ${shortDate(e.startedOn)}` : 'Running') : status === 'done' ? `Done${e.doneOn ? ` · ${shortDate(e.doneOn)}` : ''}` : STATUS_LABEL.planned;
  function addTask() {
    const had = nextStep(data, p);
    if (apply(d => !!addExperimentTask(d, e.id))) toast(had ? 'Added to this project’s tasks. Your next step stays as it is.' : 'Added — it’s this project’s next step for now.');
  }
  async function remove() {
    if (!(await confirm({ title: 'Remove this experiment?', body: `“${e.title || 'This experiment'}” — its Test task and any finding saved from it stay.`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (apply(d => removeResearch(d, e.id))) { toast('Experiment removed.'); focusSoon('experimentPlan'); }
  }
  if (editing) return <li className="border-t border-outline first:border-t-0 py-3"><ExperimentForm data={data} p={p} e={e} onDone={() => { setEditing(false); focusSoon(`ex-${e.id}`); }} onRemove={remove} /></li>;
  return (
    <li className="border-t border-outline first:border-t-0 py-3" data-s="experiment" data-id={e.id} data-status={status}>
      <p className="m-0 font-semibold break-words leading-snug" id={`ex-${e.id}`} tabIndex={-1}>{e.title || 'An experiment'}</p>
      <p className="m-0 mt-0.5 text-sm text-fg-2" data-s="experiment-when">{status === 'done' && <Check size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 text-done" />}{when}</p>
      {tested.length > 0 && <p className="m-0 mt-1 text-sm text-fg-2 break-words" data-s="experiment-tests">Tests: {tested.map(t => `“${t.text}”`).join('; ')}</p>}
      {e.how && <p className="m-0 mt-1.5 text-[15px] break-words whitespace-pre-line"><span className="font-semibold">How:</span> {e.how}</p>}
      {e.expect && <p className="m-0 mt-1 text-[15px] break-words whitespace-pre-line"><span className="font-semibold">What would change my mind:</span> {e.expect}</p>}
      {status === 'done' && e.result && <p className="m-0 mt-1.5 text-[15px] break-words whitespace-pre-line" data-s="experiment-result"><span className="font-semibold">What happened:</span> {e.result}</p>}
      {status === 'done' && e.conclusion && <p className="m-0 mt-1 text-[15px] break-words whitespace-pre-line"><span className="font-semibold">What I conclude:</span> {e.conclusion}</p>}
      {waiting && !recording && <p className="m-0 mt-2 text-[15px] rounded-tile bg-surface-2 border border-outline px-3 py-2" data-s="experiment-waiting">Its Test task is done — what happened?</p>}
      {recording ? <RecordForm e={e} onDone={done => { setRecording(false); focusSoon(done ? `ex-${e.id}` : `exRecord-${e.id}`); }} /> : (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {status === 'planned' && <Button inline variant="tonal" data-action="experiment-start" onClick={() => { if (apply(d => startExperiment(d, e.id))) { toast('Started.'); focusSoon(`ex-${e.id}`); } }}>Start it</Button>}
          {status !== 'done' && <Button inline id={`exRecord-${e.id}`} variant={waiting ? 'primary' : 'ghost'} data-action="experiment-record" onClick={() => setRecording(true)}>Record what happened</Button>}
          {task ? <a href={`#today/tasks/${encodeURIComponent(task.id)}`} className="inline-flex items-center gap-1.5 min-h-11 px-1 text-primary font-semibold text-[15px] no-underline hover:underline underline-offset-4" data-s="experiment-task">
            {isDone(data, task) ? <><Check size={16} aria-hidden="true" /> Test task done</> : 'Test task added'}</a>
            : status !== 'done' && <Button inline variant="ghost" data-action="experiment-task" onClick={addTask}>Add a task to run it</Button>}
          <Button inline variant="ghost" data-action="experiment-edit" onClick={() => setEditing(true)}>Edit</Button>
          {status === 'done' && <Button inline variant="ghost" data-action="experiment-reopen" onClick={() => { if (apply(d => reopenExperiment(d, e.id))) { toast('Running again — change what happened whenever you like.'); focusSoon(`ex-${e.id}`); } }}>Reopen</Button>}
        </div>
      )}
      {offered && <FindingOffer data={data} p={p} e={e} />}
      {saved && <a href={tabHref(p, 'research')} className="inline-flex items-center min-h-11 text-[15px] text-primary font-semibold no-underline hover:underline underline-offset-4" data-s="experiment-finding">Saved as a finding — see Research</a>}
    </li>
  );
}

// What happened (needed) and what you conclude: done, today. What's typed so far counts.
function RecordForm({ e, onDone }: { e: ResearchExperiment; onDone: (done: boolean) => void }) {
  const [result, setResult] = useState(e.result), [conclusion, setConclusion] = useState(e.conclusion);
  function save() {
    if (apply(d => recordResult(d, e.id, result, conclusion))) { toast('Recorded — it’s done.'); onDone(true); }
  }
  return (
    <form className="grid gap-3 mt-2 rounded-tile bg-surface-2 border border-outline p-3" data-s="experiment-record-form" onSubmit={ev => { ev.preventDefault(); save(); }}>
      <Field label="What happened?" htmlFor={`exR-${e.id}`}><TextArea id={`exR-${e.id}`} rows={3} value={result} maxLength={RESEARCH_LIMITS.text} autoFocus placeholder="e.g. 7 of 20 said yes; most wanted to try a month free" onChange={ev => setResult(ev.target.value)} /></Field>
      <Field label="What do you conclude, and what will you do next? (optional)" htmlFor={`exC-${e.id}`}><TextArea id={`exC-${e.id}`} rows={2} value={conclusion} maxLength={RESEARCH_LIMITS.conclusion} onChange={ev => setConclusion(ev.target.value)} /></Field>
      <div className="flex flex-wrap gap-2">
        <Button inline type="submit" variant="primary" data-action="experiment-record-save" disabled={!result.trim()}>Save the result</Button>
        <Button inline variant="ghost" onClick={() => onDone(false)}>Cancel</Button>
      </div>
    </form>
  );
}

// "Save it as a finding?": for each thing it tested, how the result bears on it; one tap saves it (and switches
// Research on). You still mark the thing "looks true" or "doesn't hold" yourself.
function FindingOffer({ data, p, e }: { data: MyDayData; p: Project; e: ResearchExperiment }) {
  const tested = testedThings(data, e);
  const [stances, setStances] = useState<Record<string, Stance>>({});
  function save() {
    const wasOn = hasResearch(p), out: { r: ReturnType<typeof saveAsFinding> } = { r: { ok: false, why: '' } };
    update(d => { out.r = saveAsFinding(d, e.id, stances); return out.r.ok ? undefined : false; });
    if (!out.r.ok) { if (out.r.why) toast(out.r.why); return; }
    toast(wasOn ? 'Saved as a finding.' : 'Saved as a finding — Research is on now, with its own tab.');
    focusSoon(`ex-${e.id}`);
  }
  return (
    <div className="mt-3 rounded-tile bg-surface-2 border border-outline px-3.5 py-3 grid gap-2" data-s="experiment-offer">
      <p className="m-0 font-semibold">Save it as a finding?</p>
      <p className="m-0 text-sm text-fg-2">Its result becomes evidence in Research, from this experiment. Whether something looks true stays your call.</p>
      {tested.map(t => (
        <div key={testKey(t)} className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center">
          <span className="text-[15px] break-words">{t.kind === 'assumption' ? 'Must be true: ' : t.kind === 'option' ? 'Option: ' : 'Question: '}{t.text}</span>
          <Select aria-label={`How the result bears on “${t.text}”`} className="!w-auto" data-s="experiment-stance" data-id={t.id} value={stances[testKey(t)] ?? 'relates'} onChange={ev => setStances(s => ({ ...s, [testKey(t)]: ev.target.value as Stance }))}>
            {STANCES.map(s => <option key={s} value={s}>{STANCE_WORD[s]}</option>)}
          </Select>
        </div>
      ))}
      <div><Button inline variant="primary" data-action="experiment-finding" onClick={save}>Save as a finding</Button></div>
    </div>
  );
}

// Under a thing that must be true: its experiments in words, which go to the card, and "Plan an experiment".
export function AssumptionExperiments({ data, p, id, setPlanning }: { data: MyDayData; p: Project; id: string; setPlanning: Planning['setPlanning'] }) {
  const all = experimentsOf(data, p.id), list = all.filter(e => e.tests.some(t => t.kind === 'assumption' && t.id === id));
  const go = () => { const h = document.getElementById('pjExperimentsH'); h?.scrollIntoView({ block: 'start' }); h?.focus(); };
  const planFor = (t: Test) => { setPlanning([t]); requestAnimationFrame(() => document.getElementById('projectExperiments')?.scrollIntoView({ block: 'start' })); };
  return (
    <p className="m-0 mt-1 flex flex-wrap items-center gap-x-4 text-[15px]" data-s="as-experiments">
      {list.length > 0 && <LinkButton className="text-[15px]" data-action="as-experiments" onClick={go}>{experimentsLine(list)}</LinkButton>}
      {all.length < RESEARCH_LIMITS.experiments && <LinkButton className="text-[15px]" data-action="as-plan-experiment" onClick={() => planFor({ kind: 'assumption', id })}>Plan an experiment</LinkButton>}
    </p>
  );
}
