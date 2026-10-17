import { ArrowUpRight, Check, FileText, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AI_MODE } from '../ai/request';
import { openCapture } from '../capture/openCapture';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, CommitTextarea, Field, Select, TextInput } from '../components/Field';
import {
  addAssumption, assumptionTask, awaitingAnswer, editAnswer, editAssumption, editFound, findOut, MODEL_LIMITS, modelProgress,
  MUST_BE_TRUE, QUESTIONS, removeAssumption, setAssumptionState, STATE_LABEL,
} from '../data/businessModel';
import { shortDate } from '../data/dates';
import { nextStep } from '../data/projects';
import { update } from '../data/storage';
import { isDone } from '../data/tasks';
import { toast } from '../data/toast';
import type { Assumption, AssumptionState, MyDayData, Project } from '../data/types';
import { exploreHref, rememberExploreEntry } from '../explore/route';
import { AiHelp } from './PlanViews';
import { progressLine, tabHref } from './planText';

// A business idea's one page (1.33.0): the Model tab, and its small card on the Overview. The rules are in
// data/businessModel.ts; this is only how it looks and what the buttons do. Counts, never percentages or scores.

// ---------- On the Overview ----------
export function ModelCard({ data, p }: { data: MyDayData; p: Project }) {
  const g = modelProgress(p), waiting = (p.model?.assumptions ?? []).filter(a => awaitingAnswer(data, a)).length;
  return (
    <Card aria-labelledby="pjModelCardH" id="projectModelCard">
      <h3 id="pjModelCardH" className="flex items-center gap-2"><FileText size={18} aria-hidden="true" className="text-primary" /> Your one page</h3>
      <a href={tabHref(p, 'model')} className="block min-h-11 py-1 text-fg no-underline hover:underline underline-offset-4" data-s="model-summary">
        {g.answered ? progressLine(p) : <span className="text-primary font-semibold">Four simple questions put your idea on one page — start with the first</span>}
      </a>
      {waiting > 0 && <p className="text-sm text-fg-2 m-0 mt-1" data-s="model-waiting">{waiting === 1 ? 'A Find out task is done' : `${waiting} Find out tasks are done`} — what did you find?</p>}
    </Card>
  );
}

// ---------- The Model tab ----------
export function ModelView({ data, p }: { data: MyDayData; p: Project }) {
  const m = p.model, list = m?.assumptions ?? [];
  const [text, setText] = useState('');
  const full = list.length >= MODEL_LIMITS.assumptions;
  // AI help (1.34.0, only on your tap): once the first three questions are answered, Ask MyDay can suggest what else must
  // be true — sending this one page (never what you found), and never saying whether the idea will work.
  const answered = !!m && !!m.problem.trim() && !!m.who.trim() && !!m.how.trim();
  function add() {
    let r: string | null = null;
    update(d => { r = addAssumption(d, p.id, text); if (!r || r === 'full') return false; });
    if (r && r !== 'full') { setText(''); toast('Added. Find out whenever you’re ready.'); }
  }
  return (
    <Card aria-labelledby="pjModelH" id="projectModel">
      <h2 id="pjModelH" className="flex items-center gap-2"><FileText size={22} aria-hidden="true" className="text-primary" /> Your business on one page</h2>
      <p className="text-[15px] text-fg-2 m-0" data-s="model-progress">{modelProgress(p).answered ? progressLine(p) : 'Four simple questions, in your words. Rough is fine — change it whenever your thinking moves on.'}</p>
      <div className="grid gap-5 mt-5">
        {QUESTIONS.map((q, i) => (
          <div key={q.key} className="grid gap-1.5" data-s="model-question" data-key={q.key}>
            <label htmlFor={`model-${q.key}`} className="font-semibold text-[17px] leading-snug"><span className="text-fg-3 tabular-nums mr-1.5">{i + 1}</span>{q.label}</label>
            <p id={`model-${q.key}-hint`} className="text-sm text-fg-2 m-0">{q.hint}</p>
            <CommitTextarea id={`model-${q.key}`} aria-describedby={`model-${q.key}-hint`} rows={3} key={m?.[q.key] ?? ''} defaultValue={m?.[q.key] ?? ''} maxLength={MODEL_LIMITS.answer}
              onCommit={el => update(d => (editAnswer(d, p.id, q.key, el.value) ? undefined : false))} />
          </div>
        ))}
        <section aria-labelledby="model-musts-h" data-s="model-musts">
          <h3 id="model-musts-h" className="font-semibold text-[17px] leading-snug m-0"><span className="text-fg-3 tabular-nums mr-1.5">4</span>{MUST_BE_TRUE.label}</h3>
          <p className="text-sm text-fg-2 m-0 mt-1.5">{MUST_BE_TRUE.hint}</p>
          {list.length > 0 && (
            <ul className="list-none p-0 m-0 mt-3" aria-label="What must be true">
              {list.map(a => <AssumptionRow key={a.id} data={data} p={p} a={a} />)}
            </ul>
          )}
          {!full && AI_MODE !== 'off' && (answered || p.private
            ? <AiHelp p={p} action="model-ask" label="Suggest what must be true" onAsk={() => openCapture('Suggest what must be true for this idea to work')} />
            : <p className="text-sm text-fg-3 mb-0 mt-3" data-s="model-ai-wait">Once the first three questions are answered, Ask MyDay can suggest what must be true.</p>)}
          {full ? <p className="text-[15px] text-fg-2 mb-0 mt-3" data-s="model-full">That's 12 — plenty to test. Remove one to add another.</p> : (
            <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-3" onSubmit={e => { e.preventDefault(); add(); }} id="modelAddForm">
              <Field label={list.length ? 'Add something else that must be true' : 'Add the first thing that must be true'} htmlFor="modelNew">
                <TextInput id="modelNew" value={text} maxLength={MODEL_LIMITS.assumption} placeholder="e.g. Shops would pay to be listed" onChange={e => setText(e.target.value)} />
              </Field>
              <Button inline type="submit" variant="primary" data-action="model-add" disabled={!text.trim()}><Plus size={18} aria-hidden="true" /> Add</Button>
            </form>
          )}
        </section>
      </div>
      <a href={exploreHref(p.id)} onClick={() => rememberExploreEntry(p.id)} data-action="model-explore" className="inline-flex items-center gap-2 min-h-11 mt-4 text-primary font-semibold text-[15px] no-underline hover:underline underline-offset-4">See it as a story: Explore this idea <ArrowUpRight size={17} aria-hidden="true" /></a>
    </Card>
  );
}

const STATE_TOAST: Record<AssumptionState, string> = { open: 'Back to not checked yet.', 'looks-true': 'Looks true — good to know.', 'doesnt-hold': 'Doesn’t hold — worth knowing early. Your idea can change with it.' };
// One belief: how it's turning out, its "Find out" task, and — while it's not checked yet — one tap to mark it. Changing
// a marked one (or back to not checked yet) is in Edit, so each row stays short on a phone.
function AssumptionRow({ data, p, a }: { data: MyDayData; p: Project; a: Assumption }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const task = assumptionTask(data, a), waiting = awaitingAnswer(data, a);
  const mark = (s: AssumptionState) => { if (update(d => (setAssumptionState(d, p.id, a.id, s) ? undefined : false))) toast(STATE_TOAST[s]); };
  function find() {
    let id: string | null = null;
    const had = nextStep(data, p);
    update(d => { id = findOut(d, p.id, a.id); if (!id) return false; });
    // With no next step yet, the project's first task to do becomes it (as always); otherwise yours stays.
    if (id) toast(had ? 'Added to this project’s tasks. Your next step stays as it is.' : 'Added — it’s this project’s next step for now.');
  }
  async function remove() {
    if (!(await confirm({ title: 'Remove this?', body: `“${a.text}”${task ? ' Its Find out task stays in your tasks.' : ''}`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    setEditing(false);
    if (update(d => (removeAssumption(d, p.id, a.id) ? undefined : false))) toast('Removed.');
  }
  return (
    <li className="border-t border-outline first:border-t-0 py-3" data-s="assumption" data-id={a.id} data-state={a.state}>
      <p className="m-0 font-semibold break-words leading-snug">{a.text}</p>
      <p className="m-0 mt-0.5 text-sm text-fg-2" data-s="as-state">{a.state === 'looks-true' && <Check size={14} aria-hidden="true" className="inline -mt-0.5 mr-1 text-done" />}{STATE_LABEL[a.state]}{a.checkedOn ? ` · ${shortDate(a.checkedOn)}` : ''}</p>
      {a.found && !editing && <p className="m-0 mt-1.5 text-[15px] text-fg-2 whitespace-pre-line break-words" data-s="as-found"><span className="font-semibold text-fg">What I found:</span> {a.found}</p>}
      {waiting && <p className="m-0 mt-2 text-[15px] rounded-tile bg-surface-2 border border-outline px-3 py-2" data-s="as-waiting">Its Find out task is done — what did you find?</p>}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {task ? (
          <a href={`#today/tasks/${encodeURIComponent(task.id)}`} className="inline-flex items-center gap-1.5 min-h-11 px-1 mr-1 text-primary font-semibold text-[15px] no-underline hover:underline underline-offset-4" data-s="as-task">
            {isDone(data, task) ? <><Check size={16} aria-hidden="true" /> Find out task done</> : 'Find out task added'}
          </a>
        ) : a.state === 'open' && <Button inline variant="tonal" data-action="as-find-out" onClick={find}><Search size={17} aria-hidden="true" /> Find out</Button>}
        {a.state === 'open' && <>
          <Button inline variant={waiting ? 'primary' : 'ghost'} data-action="as-mark" data-state="looks-true" onClick={() => mark('looks-true')}>Looks true</Button>
          <Button inline variant={waiting ? 'primary' : 'ghost'} data-action="as-mark" data-state="doesnt-hold" onClick={() => mark('doesnt-hold')}>Doesn’t hold</Button>
        </>}
        <Button inline variant="ghost" data-action="as-edit" aria-expanded={editing} onClick={() => setEditing(!editing)}>{editing ? 'Done' : a.state !== 'open' && !a.found ? 'Add what I found' : 'Edit'}</Button>
      </div>
      {editing && (
        <div className="grid gap-3 mt-2 rounded-tile bg-surface-2 border border-outline p-3" data-s="as-editor">
          <Field label="What must be true" htmlFor={`asT-${a.id}`}><CommitInput id={`asT-${a.id}`} key={a.text} defaultValue={a.text} maxLength={MODEL_LIMITS.assumption} onCommit={el => { if (!el.value.trim()) { el.value = a.text; return; } update(d => (editAssumption(d, p.id, a.id, el.value) ? undefined : false)); }} /></Field>
          <Field label="How it’s turning out" htmlFor={`asS-${a.id}`}>
            <Select id={`asS-${a.id}`} className="!w-auto" value={a.state} data-action="as-state" onChange={e => mark(e.target.value as AssumptionState)}>
              {(Object.keys(STATE_LABEL) as AssumptionState[]).map(s => <option key={s} value={s}>{STATE_LABEL[s]}</option>)}
            </Select>
          </Field>
          <Field label="What I found (optional)" htmlFor={`asF-${a.id}`}><CommitTextarea id={`asF-${a.id}`} rows={3} key={a.found} defaultValue={a.found} maxLength={MODEL_LIMITS.found} onCommit={el => update(d => (editFound(d, p.id, a.id, el.value) ? undefined : false))} /></Field>
          <div><Button inline variant="ghost" data-action="as-remove" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Remove</Button></div>
        </div>
      )}
    </li>
  );
}
