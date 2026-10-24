import { ArrowDown, ArrowUp, Check, Flag, Minus, Plus, Scale, Sparkles, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { AI_MODE } from '../ai/request';
import { openCapture } from '../capture/openCapture';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, Field, TextArea, TextInput } from '../components/Field';
import { LinkButton, Note, Summary } from '../components/parts';
import { parseKey, shortDate, todayKey } from '../data/dates';
import { editProject } from '../data/projects';
import {
  addDecision, addMilestone, addOption, addPoint, chosenOption, decide, decisionHistory, decisionsInOrder, editMilestone, editOption, editPoint, editQuestion,
  milestoneProgress, moveMilestone, PLAN_LIMITS, removeDecision, removeMilestone, removeOption, setReached, thinkAgain, type Side,
} from '../data/projectPlan';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { DateKey, Decision, DecisionOption, Milestone, MyDayData, Project } from '../data/types';
import { aimText } from './planText';

// A project's Milestones and Decisions tabs (1.31.0); their summaries are in At a glance. The rules are in
// data/projectPlan.ts; this is only how they look and what the buttons do. No scores, no "late": dates are guidance.

// What you've typed but not added yet stays while you move between tabs (in memory, until MyDay is closed).
const drafts = new Map<string, string>();
function useDraft(key: string): [string, (v: string) => void] {
  const [v, setV] = useState(() => drafts.get(key) ?? '');
  return [v, x => { if (x) drafts.set(key, x); else drafts.delete(key); setV(x); }];
}


// ---------- Milestones ----------
export function MilestonesView({ p }: { p: Project }) {
  const confirm = useConfirm();
  const list = p.milestones ?? [], { reached, total, next } = milestoneProgress(p), k = todayKey();
  const [title, setTitle] = useDraft(`ms-title:${p.id}`), [aim, setAim] = useDraft(`ms-aim:${p.id}`);
  const [editing, setEditing] = useState<string | null>(null);
  const full = total >= PLAN_LIMITS.milestones;
  function add() {
    let r: string | null = null;
    const saved = update(d => { r = addMilestone(d, p.id, title, (aim || null) as DateKey | null); if (!r || r === 'full') return false; });
    if (!saved && r && r !== 'full') return;
    if (r && r !== 'full') { setTitle(''); setAim(''); toast('Milestone added.'); }
  }
  async function remove(m: Milestone) {
    if (!(await confirm({ title: 'Remove this milestone?', body: `“${m.title}”`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    setEditing(null);
    if (update(d => (removeMilestone(d, p.id, m.id) ? undefined : false))) toast('Milestone removed.');
  }
  return (
    <Card aria-labelledby="pjMsH" id="projectMilestones">
      <h2 id="pjMsH" className="flex items-center gap-2"><Flag size={22} aria-hidden="true" className="text-primary" /> Milestones</h2>
      <p className="text-[15px] text-fg-2 m-0" data-s="ms-progress">{total ? `${reached} of ${total} reached` : 'The big markers on the way — not tasks, just the places you\'d like to get to.'}</p>
      {total > 0 && (
        <ol className="list-none p-0 m-0 mt-3" aria-label="Milestones, in order">
          {list.map((m, i) => (
            <li key={m.id} className="border-t border-outline first:border-t-0 py-3 flex gap-3" data-s="milestone" data-id={m.id} data-reached={m.reachedOn ? 'yes' : 'no'}>
              <span aria-hidden="true" className={`flex-none grid place-items-center size-8 rounded-full text-[13px] font-bold tabular-nums ${m.reachedOn ? 'bg-done text-on-done' : m === next ? 'bg-primary text-on-primary' : 'bg-surface-2 text-fg-3 border border-outline'}`}>
                {m.reachedOn ? <Check size={16} strokeWidth={3} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 font-semibold break-words leading-snug">
                  <span className="sr-only">{m.reachedOn ? 'Reached: ' : `${i + 1}. `}</span>{m.title}
                  {m === next && <span className="ml-2 inline-block align-middle text-xs font-bold uppercase tracking-[.06em] px-1.5 py-0.5 rounded-md bg-primary-container text-on-primary-container" data-s="ms-next">Next</span>}
                </p>
                {(m.reachedOn || m.aim) && <p className="m-0 mt-0.5 text-sm text-fg-2" data-s="ms-when">{m.reachedOn ? `Reached ${shortDate(m.reachedOn)}` : aimText(m.aim!, k)}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {m.reachedOn
                    ? <Button inline variant="ghost" data-action="ms-unreach" onClick={() => { if (update(d => (setReached(d, p.id, m.id, false) ? undefined : false))) toast('Back to not reached yet.'); }}>Not yet</Button>
                    : <Button inline variant={m === next ? 'primary' : 'tonal'} data-action="ms-reach" onClick={() => { if (update(d => (setReached(d, p.id, m.id, true) ? undefined : false))) toast('Milestone reached — lovely.'); }}><Check size={18} aria-hidden="true" /> Reached</Button>}
                  <Button inline variant="ghost" data-action="ms-edit" aria-expanded={editing === m.id} onClick={() => setEditing(editing === m.id ? null : m.id)}>{editing === m.id ? 'Done' : 'Edit'}</Button>
                </div>
                {editing === m.id && (
                  <div className="grid gap-3 mt-3 rounded-tile bg-surface-2 border border-outline p-3" data-s="ms-editor">
                    <Field label="Milestone" htmlFor={`msT-${m.id}`}><CommitInput id={`msT-${m.id}`} key={m.title} defaultValue={m.title} maxLength={PLAN_LIMITS.milestoneTitle} onCommit={el => { if (!el.value.trim()) { el.value = m.title; return; } update(d => (editMilestone(d, p.id, m.id, { title: el.value }) ? undefined : false)); }} /></Field>
                    <Field label="Aiming for (optional)" htmlFor={`msA-${m.id}`}><CommitInput id={`msA-${m.id}`} type="date" className="!w-auto" key={`a${m.aim}`} defaultValue={m.aim ?? ''} onCommit={el => update(d => (editMilestone(d, p.id, m.id, { aim: (el.value || null) as DateKey | null }) ? undefined : false))} /></Field>
                    <div className="flex flex-wrap gap-2.5">
                      <Button inline variant="ghost" data-action="ms-up" aria-label={`Move “${m.title}” up`} disabled={i === 0} onClick={() => update(d => (moveMilestone(d, p.id, m.id, -1) ? undefined : false))}><ArrowUp size={18} aria-hidden="true" /> Up</Button>
                      <Button inline variant="ghost" data-action="ms-down" aria-label={`Move “${m.title}” down`} disabled={i === list.length - 1} onClick={() => update(d => (moveMilestone(d, p.id, m.id, 1) ? undefined : false))}><ArrowDown size={18} aria-hidden="true" /> Down</Button>
                      {m.aim && <Button inline variant="ghost" data-action="ms-clear-aim" onClick={() => update(d => (editMilestone(d, p.id, m.id, { aim: null }) ? undefined : false))}>Clear the date</Button>}
                      <Button inline variant="ghost" data-action="ms-remove" onClick={() => remove(m)}><Trash2 size={18} aria-hidden="true" /> Remove</Button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      {!full && <AiHelp p={p} action="ms-ask" label="Suggest milestones" onAsk={() => openCapture('Suggest milestones for this project')} />}
      {full ? <p className="text-[15px] text-fg-2 mb-0 mt-3" data-s="ms-full">That's 30 — plenty to steer by. Remove one to add another.</p> : (
        <form className="grid gap-3 mt-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end" onSubmit={e => { e.preventDefault(); add(); }} id="msAddForm">
          <Field label={total ? 'Add a milestone' : 'Add the first milestone'} htmlFor="msNew"><TextInput id="msNew" value={title} maxLength={PLAN_LIMITS.milestoneTitle} placeholder="e.g. Shortlist three flats" onChange={e => setTitle(e.target.value)} /></Field>
          <Field label="Aiming for (optional)" htmlFor="msNewAim"><TextInput id="msNewAim" type="date" className="!w-auto" value={aim} onChange={e => setAim(e.target.value)} /></Field>
          <Button inline type="submit" variant="primary" data-action="ms-add" disabled={!title.trim()}><Plus size={18} aria-hidden="true" /> Add</Button>
        </form>
      )}
    </Card>
  );
}

// ---------- Decisions ----------
export function DecisionsView({ p }: { p: Project }) {
  const list = decisionsInOrder(p), full = (p.decisions?.length ?? 0) >= PLAN_LIMITS.decisions;
  const [q, setQ] = useDraft(`dc-q:${p.id}`);
  function add() {
    let r: string | null = null;
    const saved = update(d => { r = addDecision(d, p.id, q); if (!r || r === 'full') return false; });
    if (!saved && r && r !== 'full') return;
    if (r && r !== 'full') { setQ(''); toast('Decision added — now the options.'); }
  }
  return (
    <>
      <Card aria-labelledby="pjDcH" id="projectDecisions">
        <h2 id="pjDcH" className="flex items-center gap-2"><Scale size={22} aria-hidden="true" className="text-primary" /> Decisions</h2>
        <p className="text-[15px] text-fg-2 m-0" data-s="dc-hint">Two or three options are plenty. Pros and cons, no scores — choose when it feels clear enough; it can change later.</p>
        {full ? <p className="text-[15px] text-fg-2 mb-0 mt-3" data-s="dc-full">That's 12 decisions — plenty for one project. Remove one to add another.</p> : (
          <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-4" onSubmit={e => { e.preventDefault(); add(); }} id="dcAddForm">
            <Field label="Add a decision" htmlFor="dcNew"><TextInput id="dcNew" value={q} maxLength={PLAN_LIMITS.question} placeholder="e.g. Which area?" onChange={e => setQ(e.target.value)} /></Field>
            <Button inline type="submit" variant="primary" data-action="dc-add" disabled={!q.trim()}><Plus size={18} aria-hidden="true" /> Add</Button>
          </form>
        )}
      </Card>
      {list.map(x => <DecisionCard key={x.id} p={p} x={x} />)}
    </>
  );
}

function DecisionCard({ p, x }: { p: Project; x: Decision }) {
  const confirm = useConfirm();
  const [choosing, setChoosing] = useState<string | null>(null);
  const [why, setWhy] = useState('');
  const [editingQ, setEditingQ] = useState(false);
  const [opt, setOpt] = useDraft(`dc-opt:${p.id}:${x.id}`);
  const chosen = chosenOption(x), decided = !!chosen, history = decisionHistory(x);
  const tooBig = () => toast('This decision is too large to save that change. Nothing changed. Export a backup before removing content.');
  // update() keeps the previous choice when the browser can't save, and still works in memory when saving is blocked.
  function saveChoice(change: (d: MyDayData) => boolean | 'big') {
    let r = false as boolean | 'big';
    const saved = update(d => { r = change(d); if (r !== true) return false; });
    if (r === 'big') tooBig();
    return saved;
  }
  function addOpt() {
    let r: string | null = null;
    const saved = update(d => { r = addOption(d, p.id, x.id, opt); if (!r || r === 'full') return false; });
    if (!saved && r && r !== 'full') return;
    if (r && r !== 'full') setOpt('');
  }
  async function removeOpt(o: DecisionOption) {
    if (!(await confirm({ title: 'Remove this option?', body: `“${o.text}” and its pros and cons.`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    let r: ReturnType<typeof removeOption> = null;
    const saved = update(d => { r = removeOption(d, p.id, x.id, o.id); if (!r || r === 'big') return false; });
    if (r === 'big') tooBig();
    else if (saved) toast(r === 'reopened' ? 'Option removed — it was your choice, so this decision is open again.' : 'Option removed.');
  }
  async function remove() {
    if (!(await confirm({ title: 'Remove this decision?', body: 'Its options, pros, cons and previous choices go with it.', confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (update(d => (removeDecision(d, p.id, x.id) ? undefined : false))) toast('Decision removed.');
  }
  function startChoosing(o: DecisionOption) { setChoosing(o.id); setWhy(x.why); }
  function confirmChoice() {
    if (!choosing) return;
    if (saveChoice(d => decide(d, p.id, x.id, choosing, why))) { setChoosing(null); toast('Decided. It can change later.'); }
  }
  return (
    <Card aria-labelledby={`dcQ-${x.id}`} data-s="decision" data-id={x.id} data-state={decided ? 'decided' : 'open'}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className={`inline-block text-xs font-bold uppercase tracking-[.06em] px-1.5 py-0.5 rounded-md ${decided ? 'bg-done-c text-on-done-c' : 'bg-surface-2 text-fg-2 border border-outline'}`} data-s="dc-state">{decided ? `Decided ${shortDate(x.decidedOn!)}` : 'Open'}</span>
          {editingQ
            ? <Field label="The question" htmlFor={`dcQe-${x.id}`} className="mt-2"><CommitInput id={`dcQe-${x.id}`} key={x.question} defaultValue={x.question} maxLength={PLAN_LIMITS.question} onCommit={el => { if (!el.value.trim()) { el.value = x.question; return; } update(d => (editQuestion(d, p.id, x.id, el.value) ? undefined : false)); }} /></Field>
            : <h3 id={`dcQ-${x.id}`} className="m-0 mt-1.5 text-[19px] break-words">{x.question}</h3>}
        </div>
        <div className="flex gap-1">
          <Button inline variant="ghost" data-action="dc-edit-q" aria-expanded={editingQ} onClick={() => setEditingQ(!editingQ)}>{editingQ ? 'Done' : 'Edit'}</Button>
          <Button inline variant="ghost" className="!px-3" data-action="dc-remove" aria-label={`Remove the decision “${x.question}”`} onClick={remove}><Trash2 size={18} aria-hidden="true" /></Button>
        </div>
      </div>

      {decided && (
        <div className="mt-3 rounded-tile bg-done-c text-on-done-c px-3 py-2.5" data-s="dc-decided">
          <p className="m-0 font-semibold break-words">Decided {shortDate(x.decidedOn!)}: {chosen!.text}</p>
          {x.why && <p className="m-0 mt-1 text-[15px] whitespace-pre-line break-words" data-s="dc-why">{x.why}</p>}
          <div className="flex flex-wrap gap-2.5 mt-2">
            <Button inline variant="ghost" className="!border-on-done-c !text-on-done-c" data-action="dc-again" onClick={() => { if (saveChoice(d => thinkAgain(d, p.id, x.id))) toast('Open again — your options, pros, cons and reasons are all still here.'); }}>Think again</Button>
          </div>
          {p.stage === 'decide' && (
            <p className="m-0 mt-2 flex flex-wrap items-center gap-x-2 text-[15px]" data-s="dc-to-doing">Move this project to Doing?
              <LinkButton className="!text-on-done-c underline" data-action="dc-to-doing" onClick={() => { if (update(d => (editProject(d, p.id, { stage: 'act' }) ? undefined : false))) toast('Moved to Doing.'); }}>Move it</LinkButton></p>
          )}
        </div>
      )}
      {!decided && x.lastChoice && (
        <Note className="mb-0 mt-3"><span data-s="dc-last">Last time you chose “{x.lastChoice.text}” ({shortDate(x.lastChoice.on)}).{x.why ? ' Your reasons are kept — they\'ll be there when you choose again.' : ''}</span></Note>
      )}

      {history.length > 0 && (
        <details className="group mt-3" data-s="dc-history">
          <Summary>Previous choices ({history.length})</Summary>
          <ol className="list-none m-0 p-0 divide-y divide-outline" aria-label="Previous choices, newest first">
            {[...history].reverse().map(h => (
              <li key={h.id} className="py-3 break-words" data-s="dc-history-entry">
                <p className="m-0 font-semibold">{h.text}</p>
                <time className="text-sm text-fg-2" dateTime={h.on}>{parseKey(h.on).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
                <p className="m-0 mt-1 text-[15px] whitespace-pre-line">{h.why === null ? 'The reason for this older choice was not saved.' : h.why || 'No reason given.'}</p>
              </li>
            ))}
          </ol>
        </details>
      )}

      {x.options.length > 0 ? (
        <div className="grid gap-3 mt-4 sm:grid-cols-2">
          {x.options.map(o => (
            <div key={o.id} className={`min-w-0 rounded-tile p-3 border ${o.id === x.chosen ? 'border-2 border-primary bg-surface' : decided ? 'border-dashed border-outline bg-surface-2' : 'border-outline bg-surface'}`} data-s="option" data-id={o.id} data-chosen={o.id === x.chosen ? 'yes' : 'no'}>
              <div className="flex items-start gap-1">
                <CommitInput aria-label={`Option: ${o.text}`} key={o.text} defaultValue={o.text} maxLength={PLAN_LIMITS.optionText} className="!min-h-11 !font-semibold !border-transparent hover:!border-outline focus:!border-outline !bg-transparent !px-2 flex-1 min-w-0"
                  onCommit={el => { if (!el.value.trim()) { el.value = o.text; return; } update(d => (editOption(d, p.id, x.id, o.id, el.value) ? undefined : false)); }} />
                <Button inline variant="ghost" className="!px-3 flex-none !border-transparent" data-action="opt-remove" aria-label={`Remove the option “${o.text}”`} onClick={() => removeOpt(o)}><X size={18} aria-hidden="true" /></Button>
              </div>
              {o.id === x.chosen && <p className="m-0 ml-2 text-xs font-bold uppercase tracking-[.06em] text-primary" data-s="opt-chosen">Chosen</p>}
              {decided && o.id !== x.chosen && <p className="m-0 ml-2 text-xs text-fg-3" data-s="opt-not">Not chosen</p>}
              <Points p={p} x={x} o={o} side="pros" />
              <Points p={p} x={x} o={o} side="cons" />
              {!decided && choosing !== o.id && <Button inline variant="tonal" className="mt-3 w-full" data-action="opt-choose" onClick={() => startChoosing(o)}>Choose this</Button>}
              {choosing === o.id && (
                <div className="grid gap-2.5 mt-3" data-s="dc-choosing">
                  <Field label="Why this one? (optional)" htmlFor={`dcWhy-${x.id}`}><TextArea id={`dcWhy-${x.id}`} rows={3} maxLength={PLAN_LIMITS.why} value={why} onChange={e => setWhy(e.target.value)} /></Field>
                  <div className="flex flex-wrap gap-2.5">
                    <Button inline variant="primary" data-action="dc-decide" onClick={confirmChoice}>Decide</Button>
                    <Button inline variant="ghost" data-action="dc-cancel" onClick={() => setChoosing(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : <Note className="mb-0 mt-3">No options yet. Add one — or just one, for a yes or no.</Note>}

      {!decided && x.options.some(o => o.pros.length + o.cons.length > 0) && (
        <AiHelp p={p} action="dc-ask" label="What am I missing?" onAsk={() => openCapture(`What am I missing in “${x.question}”?`, { decisionId: x.id })} />
      )}
      {x.options.length < PLAN_LIMITS.options ? (
        <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-4" onSubmit={e => { e.preventDefault(); addOpt(); }} data-s="opt-add-form">
          <Field label={x.options.length ? 'Add an option' : 'Add the first option'} htmlFor={`dcOpt-${x.id}`}><TextInput id={`dcOpt-${x.id}`} value={opt} maxLength={PLAN_LIMITS.optionText} placeholder="e.g. Near the station" onChange={e => setOpt(e.target.value)} /></Field>
          <Button inline type="submit" data-action="opt-add" disabled={!opt.trim()}><Plus size={18} aria-hidden="true" /> Add</Button>
        </form>
      ) : <p className="text-sm text-fg-3 mb-0 mt-3" data-s="opt-full">Four options — plenty to weigh.</p>}
    </Card>
  );
}

// One option's pros or cons: each line editable in place (a blank line goes), a × to remove it, and "+ Pro" / "+ Con".
function Points({ p, x, o, side }: { p: Project; x: Decision; o: DecisionOption; side: Side }) {
  const [line, setLine] = useDraft(`dc-pt:${p.id}:${x.id}:${o.id}:${side}`);
  const [adding, setAdding] = useState(false);
  const word = side === 'pros' ? 'pro' : 'con', Label = side === 'pros' ? 'Pros' : 'Cons';
  const list = o[side], full = list.length >= PLAN_LIMITS.points;
  function add() {
    let r = false as boolean | 'full';
    const saved = update(d => { r = addPoint(d, p.id, x.id, o.id, side, line); if (r !== true) return false; });
    if (!saved && r && r !== 'full') return;
    if (r === true) setLine('');
  }
  return (
    <div className="mt-2" data-s={side}>
      <p className="m-0 ml-2 text-sm font-semibold text-fg-2">{Label}</p>
      {list.length > 0 && (
        <ul className="list-none p-0 m-0">
          {list.map((t, i) => (
            <li key={`${i}:${t}`} className="flex items-center gap-1" data-s="point">
              {side === 'pros' ? <Plus size={14} aria-hidden="true" className="flex-none text-done ml-2" /> : <Minus size={14} aria-hidden="true" className="flex-none text-fg-3 ml-2" />}
              <CommitInput aria-label={`${Label.slice(0, -1)} ${i + 1} of “${o.text}”`} defaultValue={t} maxLength={PLAN_LIMITS.point} className="!min-h-11 !border-transparent hover:!border-outline focus:!border-outline !bg-transparent !px-1.5 flex-1 min-w-0 !text-[15px]"
                onCommit={el => update(d => (editPoint(d, p.id, x.id, o.id, side, i, el.value) ? undefined : false))} />
              <Button inline variant="ghost" className="!px-3 flex-none !border-transparent" aria-label={`Remove this ${word}`} data-action="point-remove" onClick={() => update(d => (editPoint(d, p.id, x.id, o.id, side, i, '') ? undefined : false))}><X size={16} aria-hidden="true" /></Button>
            </li>
          ))}
        </ul>
      )}
      {full ? <p className="m-0 ml-2 text-xs text-fg-3" data-s="points-full">Ten {word}s — plenty. Remove one to add another.</p>
        : adding ? (
          <form className="flex gap-1.5 items-center mt-1" onSubmit={e => { e.preventDefault(); add(); }}>
            <TextInput aria-label={`A ${word} of “${o.text}”`} autoFocus value={line} maxLength={PLAN_LIMITS.point} onChange={e => setLine(e.target.value)} className="!min-h-11 flex-1 min-w-0" />
            <Button inline type="submit" variant="tonal" className="!px-3" data-action={`${word}-save`} disabled={!line.trim()}>Add</Button>
            <Button inline variant="ghost" className="!px-3" data-action={`${word}-close`} aria-label="Close" onClick={() => setAdding(false)}><X size={16} aria-hidden="true" /></Button>
          </form>
        ) : <LinkButton className="ml-2 text-[15px]" data-action={`${word}-add`} onClick={() => setAdding(true)}>+ {word.charAt(0).toUpperCase() + word.slice(1)}</LinkButton>}
    </div>
  );
}

// Ask MyDay's help for this project (1.32.0): only on your tap, through + (which shows exactly what's sent first);
// suggestions come back to tick. Not offered for a project you made private.
export function AiHelp({ p, action, label, onAsk }: { p: Project; action: string; label: string; onAsk: () => void }) {
  if (AI_MODE === 'off') return null;
  if (p.private) return <p className="text-sm text-fg-3 mb-0 mt-3" data-s="ai-private">Private project — AI help isn't offered here.</p>;
  return <Button inline variant="tonal" className="mt-3" data-action={action} onClick={onAsk}><Sparkles size={18} aria-hidden="true" /> {label}</Button>;
}
