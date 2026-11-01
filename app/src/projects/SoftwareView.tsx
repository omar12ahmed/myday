import { ArrowUpRight, Bug, ClipboardCheck, ListChecks, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, CommitTextarea, Field, Select, TextArea, TextInput } from '../components/Field';
import { Choice, Choices } from '../components/parts';
import { shortDate } from '../data/dates';
import { linkKindLabel, linkWhere, resourceName } from '../data/projectResources';
import {
  addBug, addCheck, addRequirement, BUG_STATES, bugState, bugStateLabel, bugsOf, bugTask, checklistWords, checksOf, checksWords, editBug, editCheck, editRequirement,
  fixIt, linksOfItem, markRelease, releaseChecklist, releaseOfMilestone, releasesOf, removeCheck, removeItem, REQUIREMENT_STATES, reqState, requirementsOf,
  requirementStateLabel, setBugState, setProof, SOFTWARE_LIMITS, softwareGlance, tickCheck, titleOf, toggleLink, unmarkRelease, type BugState, type RequirementState,
} from '../data/software';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { Milestone, MyDayData, Project, SoftwareBug, SoftwareCheck, SoftwareRelease, SoftwareRequirement } from '../data/types';
import { tabHref } from './planText';

// Software projects (specs/projects-software.md): the Overview's card, the Requirements and Bugs tabs, and a
// milestone's release checklist. The rules are in data/software.ts. Words and counts only; never sent to AI.
const enc = encodeURIComponent;
const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
const save = (fn: (d: MyDayData) => boolean) => update(d => (fn(d) ? undefined : false));
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

// ---------- The Overview ----------
export function SoftwareCard({ data, p }: { data: MyDayData; p: Project }) {
  const g = softwareGlance(data, p);
  return (
    <Card aria-labelledby="softwareH" data-s="software-card">
      <h3 id="softwareH" className="m-0 flex items-center gap-2"><ListChecks size={20} aria-hidden="true" className="text-primary" /> Software at a glance</h3>
      <ul className="list-none p-0 m-0 mt-2 grid gap-1 text-[15px]">
        <li data-s="sw-requirements"><a href={tabHref(p, 'requirements')} className="text-fg no-underline hover:underline underline-offset-4">{g.requirements ? `${plural(g.requirements, 'requirement')} · ${g.checks ? `${g.ticked} of ${g.checks} acceptance checks ticked` : 'no acceptance checks yet'}` : 'No requirements yet'}</a></li>
        <li data-s="sw-bugs"><a href={tabHref(p, 'bugs')} className="text-fg no-underline hover:underline underline-offset-4">{g.openBugs ? `${plural(g.openBugs, 'bug')} open` : 'No bugs open'}</a></li>
        <li data-s="sw-release"><a href={tabHref(p, 'milestones')} className="text-fg no-underline hover:underline underline-offset-4">{g.next ? `Next release: ${g.next.milestone.title} — ${checklistWords(g.next.checklist)}` : 'No release yet — any milestone can be one'}</a></li>
      </ul>
    </Card>
  );
}

// ---------- Checks: a requirement's acceptance checks, or a release's own ----------
// Ticking keeps the day and asks what proved it (a test run, a link); unticking clears both. `canAdd` false: listed
// only (a release shows its requirements' checks; they're added on the Requirements tab).
function ChecksList({ item, checks, label, canAdd = true }: { item: SoftwareRequirement | SoftwareRelease; checks: SoftwareCheck[]; label: string; canAdd?: boolean }) {
  const [text, setText] = useState(''), inputId = `checkNew-${item.id}`;
  const full = checks.length >= (item.type === 'release' ? SOFTWARE_LIMITS.releaseChecks : SOFTWARE_LIMITS.reqChecks);
  function add() {
    if (!save(d => !!addCheck(d, item.id, text))) { if (full) toast('That’s as many checks as one can hold.'); return; }
    setText(''); focusSoon(inputId);
  }
  return (
    <div className="mt-2">
      {checks.length > 0 && (
        <ul className="list-none p-0 m-0" aria-label={label} data-s="checks">
          {checks.map(c => (
            <li key={c.id} className="border-t border-outline first:border-t-0 py-1" data-s="check" data-id={c.id} data-done={c.done ? 'yes' : 'no'}>
              <div className="flex flex-wrap items-center gap-x-2">
                <label className="inline-grid place-items-center size-11 -my-1 cursor-pointer flex-none"><input type="checkbox" className="size-5 accent-[var(--primary)]" checked={!!c.done} aria-label={`Ticked: ${c.text}`} data-action="check-tick"
                  onChange={() => { if (save(d => tickCheck(d, item.id, c.id)) && !c.done) focusSoon(`proof-${c.id}`); }} /></label>
                {canAdd ? <CommitInput aria-label={`Check: ${c.text}`} className="flex-1 min-w-[10rem]" key={c.text} defaultValue={c.text} maxLength={SOFTWARE_LIMITS.check} onCommit={el => { if (!el.value.trim()) { el.value = c.text; return; } save(d => editCheck(d, item.id, c.id, el.value)); }} />
                  : <span className="flex-1 min-w-[10rem] py-2 break-words">{c.text}</span>}
                {canAdd && <Button inline variant="ghost" aria-label={`Remove the check “${c.text}”`} data-action="check-remove" onClick={() => { if (save(d => removeCheck(d, item.id, c.id))) focusSoon(inputId); }}><Trash2 size={16} aria-hidden="true" /></Button>}
              </div>
              {c.done && (
                <div className="pl-12 grid gap-1">
                  <p className="m-0 text-sm text-fg-2" data-s="check-on">{c.on ? `Ticked ${shortDate(c.on)}` : 'Ticked'}</p>
                  <CommitInput id={`proof-${c.id}`} aria-label={`What proved “${c.text}”`} key={c.proof ?? ''} defaultValue={c.proof ?? ''} maxLength={SOFTWARE_LIMITS.proof} placeholder="What proved it — a test run, a link" data-s="check-proof"
                    onCommit={el => save(d => setProof(d, item.id, c.id, el.value))} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {canAdd && (
        <form className="flex flex-wrap items-end gap-2 mt-1" onSubmit={e => { e.preventDefault(); add(); }} data-s="check-form">
          <Field label={item.type === 'release' ? 'Add a release check' : 'Add an acceptance check'} htmlFor={inputId} className="flex-1 min-w-[12rem]">
            <TextInput id={inputId} value={text} maxLength={SOFTWARE_LIMITS.check} placeholder={item.type === 'release' ? 'e.g. Backups exported' : 'e.g. Given a saved plan, when I reload, then it’s still there'} onChange={e => setText(e.target.value)} />
          </Field>
          <Button inline type="submit" variant="tonal" data-action="check-add" aria-label={item.type === 'release' ? 'Add the release check' : 'Add the acceptance check'} disabled={!text.trim() || full}><Plus size={18} aria-hidden="true" /></Button>
        </form>
      )}
    </div>
  );
}

// ---------- Which of the project's links an item points at ----------
function LinkPicker({ p, item }: { p: Project; item: SoftwareRequirement | SoftwareBug }) {
  const links = p.resources ?? [], on = new Set(linksOfItem(p, item).map(r => r.id));
  if (!links.length) return <p className="m-0 mt-2 text-sm text-fg-2" data-s="item-links-none">No links yet — keep the repository, issues and pull requests under Links on the Overview, then point this at them.</p>;
  return (
    <fieldset className="border-0 p-0 m-0 mt-2" data-s="item-links">
      <legend className="text-sm font-semibold mb-1">Points at</legend>
      <ul className="list-none p-0 m-0">
        {links.map(r => {
          const kind = linkKindLabel(r.kind);
          return (
            <li key={r.id} className="flex items-center gap-2 min-h-11">
              <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer py-1">
                <input type="checkbox" className="size-5 flex-none accent-[var(--primary)]" checked={on.has(r.id)} data-action="item-link" value={r.id}
                  onChange={() => { if (!save(d => toggleLink(d, item.id, r.id)) && !on.has(r.id)) toast('That’s as many links as one can point at.'); }} />
                <span className="min-w-0 break-words">{resourceName(r)}{kind && <span className="block text-sm text-fg-2">{kind} · {linkWhere(r.url)}</span>}</span>
              </label>
              {on.has(r.id) && <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex-none inline-grid place-items-center size-11 text-primary" aria-label={`Open ${resourceName(r)}`}><ArrowUpRight size={18} aria-hidden="true" /></a>}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

// Which release an item is in: one of the project's releases, or none.
function ReleaseField({ data, p, id, value, onPick }: { data: MyDayData; p: Project; id: string; value: string | undefined; onPick: (to: string | null) => void }) {
  const releases = releasesOf(data, p);
  if (!releases.length) return <p className="m-0 mt-2 text-sm text-fg-2">Mark a milestone as a release (on Milestones) to put this in it.</p>;
  return (
    <Field label="In the release" htmlFor={id} className="mt-2 max-w-sm">
      <Select id={id} value={releases.some(x => x.release.id === value) ? value : ''} onChange={e => onPick(e.target.value || null)}>
        <option value="">Not in a release</option>
        {releases.map(x => <option key={x.release.id} value={x.release.id}>{x.milestone.title}</option>)}
      </Select>
    </Field>
  );
}
const releaseName = (data: MyDayData, p: Project, id: string | undefined) => (id ? releasesOf(data, p).find(x => x.release.id === id)?.milestone.title : undefined);

// ---------- Requirements ----------
export function RequirementsView({ data, p }: { data: MyDayData; p: Project }) {
  const confirm = useConfirm(), all = requirementsOf(data, p.id), live = all.filter(r => reqState(r) !== 'dropped'), dropped = all.filter(r => reqState(r) === 'dropped');
  const [title, setTitle] = useState(''), [detail, setDetail] = useState(''), [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  const full = all.length >= SOFTWARE_LIMITS.requirements;
  function add() {
    let id: string | null = null;
    if (!save(d => !!(id = addRequirement(d, p.id, title, detail)))) { if (full) toast('That’s 200 requirements — as many as one project keeps.'); return; }
    setTitle(''); setDetail(''); setOpened(o => new Set([...o, id!])); focusSoon(`checkNew-${id}`);
  }
  async function remove(r: SoftwareRequirement) {
    if (!(await confirm({ title: 'Remove this requirement?', body: `“${titleOf(r)}” and its acceptance checks. To keep it out of the counts instead, mark it Dropped.`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (save(d => removeItem(d, r.id))) { toast('Requirement removed.'); focusSoon('reqH'); }
  }
  const row = (r: SoftwareRequirement) => {
    const cs = checksOf(r), rel = releaseName(data, p, r.releaseId);
    return (
      <li key={r.id} className="border-t border-outline first:border-t-0" data-s="requirement" data-id={r.id} data-state={reqState(r)}>
        <details open={opened.has(r.id)} onToggle={e => { const open = (e.currentTarget as HTMLDetailsElement).open; setOpened(o => { const n = new Set(o); if (open) n.add(r.id); else n.delete(r.id); return n; }); }}>
          <summary className="cursor-pointer min-h-11 py-2 flex flex-col justify-center" data-action="req-open">
            <span className="font-semibold break-words">{titleOf(r)}</span>
            <span className="text-sm text-fg-2" data-s="req-line">{[requirementStateLabel(reqState(r)), checksWords(cs), rel && `in ${rel}`].filter(Boolean).join(' · ')}</span>
          </summary>
          <div className="pb-3 grid gap-1">
            <Field label="Requirement" htmlFor={`reqTitle-${r.id}`}><CommitInput id={`reqTitle-${r.id}`} key={r.title} defaultValue={r.title} maxLength={SOFTWARE_LIMITS.title} onCommit={el => { if (!el.value.trim()) { el.value = r.title; return; } save(d => editRequirement(d, r.id, { title: el.value })); }} /></Field>
            <Field label="Detail (optional)" htmlFor={`reqDetail-${r.id}`} className="mt-2"><CommitTextarea id={`reqDetail-${r.id}`} rows={2} key={r.detail ?? ''} defaultValue={r.detail ?? ''} maxLength={SOFTWARE_LIMITS.detail} onCommit={el => save(d => editRequirement(d, r.id, { detail: el.value }))} /></Field>
            <Field label="Where it stands" htmlFor={`reqState-${r.id}`} className="mt-2 max-w-xs">
              <Select id={`reqState-${r.id}`} value={reqState(r)} onChange={e => save(d => editRequirement(d, r.id, { state: e.target.value as RequirementState }))}>
                {REQUIREMENT_STATES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </Select>
            </Field>
            <h4 className="m-0 mt-3 text-[15px]">Acceptance checks <span className="text-fg-3 font-normal">— how you’ll know it does what it should</span></h4>
            <ChecksList item={r} checks={cs} label={`Acceptance checks for “${titleOf(r)}”`} />
            <ReleaseField data={data} p={p} id={`reqRelease-${r.id}`} value={r.releaseId} onPick={to => save(d => editRequirement(d, r.id, { releaseId: to }))} />
            <LinkPicker p={p} item={r} />
            <div className="mt-2"><Button inline variant="ghost" data-action="req-remove" onClick={() => remove(r)}><Trash2 size={16} aria-hidden="true" /> Remove</Button></div>
          </div>
        </details>
      </li>
    );
  };
  return (
    <Card aria-labelledby="reqH" id="projectRequirements">
      <h2 id="reqH" tabIndex={-1} className="flex items-center gap-2"><ClipboardCheck size={22} aria-hidden="true" className="text-primary" /> Requirements {live.length > 0 && <span className="text-fg-3 font-normal tabular-nums text-[18px]">{live.length}</span>}</h2>
      <p className="m-0 text-[15px] text-fg-2">What it must do, each with acceptance checks you tick when they’re proven — and say what proved them.</p>
      <form className="grid gap-2 mt-3 rounded-card border border-outline bg-surface p-3" onSubmit={e => { e.preventDefault(); add(); }} data-s="req-form">
        <Field label="A requirement" htmlFor="reqNew"><TextInput id="reqNew" value={title} maxLength={SOFTWARE_LIMITS.title} placeholder="e.g. Your plan is still there after a reload" onChange={e => setTitle(e.target.value)} /></Field>
        <Field label="Detail (optional)" htmlFor="reqNewDetail"><TextArea id="reqNewDetail" rows={2} value={detail} maxLength={SOFTWARE_LIMITS.detail} onChange={e => setDetail(e.target.value)} /></Field>
        <div><Button inline type="submit" variant="primary" data-action="req-add" disabled={!title.trim() || full}><Plus size={18} aria-hidden="true" /> Add</Button></div>
      </form>
      {live.length > 0 ? <ul className="list-none p-0 m-0 mt-3" data-s="requirements">{live.map(row)}</ul>
        : <p className="m-0 mt-3 text-[15px] text-fg-2" data-s="req-none">No requirements yet.</p>}
      {dropped.length > 0 && (
        <details className="mt-3" data-s="req-dropped"><summary className="cursor-pointer min-h-11 flex items-center text-fg-2 font-semibold">Dropped ({dropped.length})</summary>
          <ul className="list-none p-0 m-0">{dropped.map(row)}</ul>
        </details>
      )}
    </Card>
  );
}

// ---------- Bugs ----------
export function BugsView({ data, p }: { data: MyDayData; p: Project }) {
  const confirm = useConfirm(), all = bugsOf(data, p.id), open = all.filter(b => bugState(b) === 'open'), closed = all.filter(b => bugState(b) !== 'open');
  const [title, setTitle] = useState(''), [happens, setHappens] = useState(''), [expected, setExpected] = useState(''), [steps, setSteps] = useState('');
  const full = all.length >= SOFTWARE_LIMITS.bugs;
  function add() {
    if (!save(d => !!addBug(d, p.id, title, { happens, expected, steps }))) { if (full) toast('That’s 500 bugs — as many as one project keeps.'); return; }
    setTitle(''); setHappens(''); setExpected(''); setSteps(''); toast('Bug added.'); focusSoon('bugNew');
  }
  async function remove(b: SoftwareBug) {
    if (!(await confirm({ title: 'Remove this bug?', body: `“${titleOf(b)}”. Its task, if it has one, stays.`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (save(d => removeItem(d, b.id))) { toast('Bug removed.'); focusSoon('bugsH'); }
  }
  function setState(b: SoftwareBug, to: BugState) {
    if (!save(d => setBugState(d, b.id, to))) return;
    toast(to === 'fixed' ? 'Marked fixed.' : to === 'wontfix' ? 'Marked won’t fix.' : 'Open again.');
    focusSoon('bugsH');
  }
  function fix(b: SoftwareBug) {
    let r: ReturnType<typeof fixIt> = null;
    if (save(d => { r = fixIt(d, b.id); return typeof r === 'string' && r !== 'already'; })) toast('Task added: Fix it.');
    else if (r === 'already') toast('It already has a task.');
  }
  const row = (b: SoftwareBug) => {
    const t = bugTask(data, b), rel = releaseName(data, p, b.releaseId), st = bugState(b);
    return (
      <li key={b.id} className="border-t border-outline first:border-t-0" data-s="bug" data-id={b.id} data-state={st}>
        <details>
          <summary className="cursor-pointer min-h-11 py-2 flex flex-col justify-center" data-action="bug-open">
            <span className="font-semibold break-words">{titleOf(b)}</span>
            <span className="text-sm text-fg-2" data-s="bug-line">{[bugStateLabel(st) + (b.closedOn && st !== 'open' ? ` ${shortDate(b.closedOn)}` : ''), t && (t.done ? 'its task is done' : 'has a task'), rel && `in ${rel}`].filter(Boolean).join(' · ')}</span>
          </summary>
          <div className="pb-3 grid gap-2">
            <Field label="Bug" htmlFor={`bugTitle-${b.id}`}><CommitInput id={`bugTitle-${b.id}`} key={b.title} defaultValue={b.title} maxLength={SOFTWARE_LIMITS.title} onCommit={el => { if (!el.value.trim()) { el.value = b.title; return; } save(d => editBug(d, b.id, { title: el.value })); }} /></Field>
            <Field label="What happens" htmlFor={`bugHappens-${b.id}`}><CommitTextarea id={`bugHappens-${b.id}`} rows={2} key={b.happens ?? ''} defaultValue={b.happens ?? ''} maxLength={SOFTWARE_LIMITS.detail} onCommit={el => save(d => editBug(d, b.id, { happens: el.value }))} /></Field>
            <Field label="What should happen" htmlFor={`bugExpected-${b.id}`}><CommitTextarea id={`bugExpected-${b.id}`} rows={2} key={b.expected ?? ''} defaultValue={b.expected ?? ''} maxLength={SOFTWARE_LIMITS.detail} onCommit={el => save(d => editBug(d, b.id, { expected: el.value }))} /></Field>
            <Field label="Steps to repeat it" htmlFor={`bugSteps-${b.id}`}><CommitTextarea id={`bugSteps-${b.id}`} rows={3} key={b.steps ?? ''} defaultValue={b.steps ?? ''} maxLength={SOFTWARE_LIMITS.steps} onCommit={el => save(d => editBug(d, b.id, { steps: el.value }))} /></Field>
            <Choices label={`Where “${titleOf(b)}” stands`}>
              {BUG_STATES.map(s => <Choice key={s.id} on={st === s.id} data-action="bug-state" data-state={s.id} onClick={() => setState(b, s.id)}>{s.label}</Choice>)}
            </Choices>
            {t ? <p className="m-0 text-sm text-fg-2" data-s="bug-task">Its task: <a href={`#today/tasks/${enc(t.task.id)}`} className="text-primary underline-offset-4 hover:underline">{t.task.title}</a>{t.done ? ' — done' : ''}</p>
              : st === 'open' && <div><Button inline variant="tonal" data-action="bug-fix" onClick={() => fix(b)}>Fix it — make a task</Button></div>}
            <ReleaseField data={data} p={p} id={`bugRelease-${b.id}`} value={b.releaseId} onPick={to => save(d => editBug(d, b.id, { releaseId: to }))} />
            <LinkPicker p={p} item={b} />
            <div><Button inline variant="ghost" data-action="bug-remove" onClick={() => remove(b)}><Trash2 size={16} aria-hidden="true" /> Remove</Button></div>
          </div>
        </details>
      </li>
    );
  };
  return (
    <Card aria-labelledby="bugsH" id="projectBugs">
      <h2 id="bugsH" tabIndex={-1} className="flex items-center gap-2"><Bug size={22} aria-hidden="true" className="text-primary" /> Bugs {open.length > 0 && <span className="text-fg-3 font-normal text-[18px]">{open.length} open</span>}</h2>
      <form className="grid gap-2 mt-3 rounded-card border border-outline bg-surface p-3" onSubmit={e => { e.preventDefault(); add(); }} data-s="bug-form">
        <Field label="A bug" htmlFor="bugNew"><TextInput id="bugNew" value={title} maxLength={SOFTWARE_LIMITS.title} placeholder="e.g. The timer stops when the phone locks" onChange={e => setTitle(e.target.value)} /></Field>
        <Field label="What happens (optional)" htmlFor="bugNewHappens"><TextArea id="bugNewHappens" rows={2} value={happens} maxLength={SOFTWARE_LIMITS.detail} onChange={e => setHappens(e.target.value)} /></Field>
        <Field label="What should happen (optional)" htmlFor="bugNewExpected"><TextArea id="bugNewExpected" rows={2} value={expected} maxLength={SOFTWARE_LIMITS.detail} onChange={e => setExpected(e.target.value)} /></Field>
        <Field label="Steps to repeat it (optional)" htmlFor="bugNewSteps"><TextArea id="bugNewSteps" rows={2} value={steps} maxLength={SOFTWARE_LIMITS.steps} onChange={e => setSteps(e.target.value)} /></Field>
        <div><Button inline type="submit" variant="primary" data-action="bug-add" disabled={!title.trim() || full}><Plus size={18} aria-hidden="true" /> Add</Button></div>
      </form>
      {open.length > 0 ? <ul className="list-none p-0 m-0 mt-3" data-s="bugs-open">{open.map(row)}</ul>
        : <p className="m-0 mt-3 text-[15px] text-fg-2" data-s="bugs-none">No bugs open.</p>}
      {closed.length > 0 && (
        <details className="mt-3" data-s="bugs-closed"><summary className="cursor-pointer min-h-11 flex items-center text-fg-2 font-semibold">Fixed and won’t fix ({closed.length})</summary>
          <ul className="list-none p-0 m-0">{closed.map(row)}</ul>
        </details>
      )}
    </Card>
  );
}

// ---------- A milestone's release checklist (on Milestones) ----------
export function ReleaseBlock({ data, p, m }: { data: MyDayData; p: Project; m: Milestone }) {
  const r = releaseOfMilestone(data, p.id, m.id);
  if (!r) return <div className="mt-2"><Button inline variant="ghost" data-action="release-mark" onClick={() => { if (save(d => !!markRelease(d, p.id, m.id))) toast('A release now — its checklist is here.'); }}><ClipboardCheck size={16} aria-hidden="true" /> Make this a release</Button></div>;
  const c = releaseChecklist(data, r);
  return (
    <section className="mt-3 rounded-tile border border-outline p-3" aria-label={`Release checklist for ${m.title}`} data-s="release" data-id={r.id}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="m-0 text-[15px]">Release checklist</h4>
        <p className={`m-0 text-sm font-semibold ${c.ready ? 'text-done' : 'text-fg-2'}`} data-s="release-ready" data-ready={c.ready ? 'yes' : 'no'}>{checklistWords(c)}</p>
      </div>
      {c.requirements.length > 0 ? c.requirements.map(x => (
        <div key={x.requirement.id} className="mt-2" data-s="release-req" data-id={x.requirement.id}>
          <p className="m-0 font-medium break-words"><a href={tabHref(p, 'requirements')} className="text-fg no-underline hover:underline underline-offset-4">{titleOf(x.requirement)}</a></p>
          {x.checks.length ? <ChecksList item={x.requirement} checks={x.checks} label={`Acceptance checks for “${titleOf(x.requirement)}”`} canAdd={false} /> : <p className="m-0 text-sm text-fg-2">No acceptance checks yet — add them on Requirements.</p>}
        </div>
      )) : <p className="m-0 mt-2 text-sm text-fg-2">No requirements in it yet — put them in it on Requirements.</p>}
      <h5 className="m-0 mt-3 text-sm font-semibold">Your release checks</h5>
      <ChecksList item={r} checks={c.own} label={`Release checks for ${m.title}`} />
      {c.openBugs.length > 0 && (
        <div className="mt-2" data-s="release-bugs">
          <p className="m-0 text-sm font-semibold">Still open in it</p>
          <ul className="m-0 pl-5">{c.openBugs.map(b => <li key={b.id}><a href={tabHref(p, 'bugs')} className="text-fg underline-offset-4 hover:underline">{titleOf(b)}</a></li>)}</ul>
        </div>
      )}
      <div className="mt-2"><Button inline variant="ghost" data-action="release-unmark" onClick={() => { if (save(d => unmarkRelease(d, r.id))) toast('No longer a release — its own checks are kept, out of sight.'); }}>Not a release</Button></div>
    </section>
  );
}
