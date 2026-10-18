import { CalendarClock, Files, Gavel, History, ListChecks, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, CommitTextarea, Field, Select, TextArea, TextInput } from '../components/Field';
import {
  addEntry, addEvidence, addIssue, CASE_LIMITS, caseCounts, editEntry, editEvidence, editIssue, EVIDENCE_STATUS_LABEL, ISSUE_STATUS_LABEL, issueLinks,
  KIND_LABEL, removeEntry, removeEvidence, removeIssue, SOURCE_LABEL, timelineInOrder, toggleLink, type LinkKind,
} from '../data/caseFile';
import { parseKey, shortDate, todayKey } from '../data/dates';
import { comingUp } from '../data/projects';
import { update } from '../data/storage';
import { addTask } from '../data/tasks';
import { toast } from '../data/toast';
import type { EvidenceItem, EvidenceKind, EvidenceStatus, IssueStatus, MyDayData, Project, TimelineEntry, TimelineSource } from '../data/types';
import { tabHref } from './planText';

// A case's Overview card and its Timeline, Evidence and Issues tabs (1.35.0). The rules are in data/caseFile.ts; this
// is only how they look and what the buttons do. Counts, never scores: MyDay organises, and never judges a claim.

const NOT_ADVICE = 'MyDay helps you organise your case. It doesn’t give legal advice or say whether a claim will succeed — ACAS or Citizens Advice can help with that.';
const BIG = 'This case is close to the most one project can hold when saved to your account — shorten some notes or details first.';
const said = (r: unknown, what: string, max: string) => { if (r === 'full') toast(`That's ${max} — the most a case can hold. Remove one to add another.`); else if (r === 'big') toast(BIG); else if (typeof r === 'string') toast(what); };
const chip = 'inline-flex items-center text-xs font-semibold rounded-full px-2 py-0.5 bg-surface-2 border border-outline text-fg-2';
const when = (t: TimelineEntry) => `${t.about ? 'About ' : ''}${shortDate(t.date)}`;

// ---------- On the Overview ----------
export function CaseCard({ data, p }: { data: MyDayData; p: Project }) {
  const g = caseCounts(p), next = comingUp(data, p)[0] ?? null, k = todayKey();
  const [adding, setAdding] = useState(false), [title, setTitle] = useState(''), [date, setDate] = useState('');
  function addDeadline() {
    let id = null as string | null;
    update(d => { id = addTask(d.tasks, { title, due: date, minutes: 15, category: 'admin' }); if (!id) return false; d.tasks.items.find(t => t.id === id)!.projectId = p.id; });
    if (id) { setTitle(''); setDate(''); setAdding(false); toast('Deadline added — it reaches Today on its day.'); }
  }
  const parts = [`${g.timeline} timeline ${g.timeline === 1 ? 'entry' : 'entries'}`, `${g.evidence} ${g.evidence === 1 ? 'piece' : 'pieces'} of evidence${g.toGet ? ` (${g.toGet} to get)` : ''}`, `${g.issues} ${g.issues === 1 ? 'issue' : 'issues'}`];
  return (
    <Card aria-labelledby="pjCaseCardH" id="projectCaseCard">
      <h3 id="pjCaseCardH" className="flex items-center gap-2"><Gavel size={18} aria-hidden="true" className="text-primary" /> Your case</h3>
      <p className="m-0 text-[15px]" data-s="case-next"><CalendarClock size={16} aria-hidden="true" className="inline -mt-0.5 mr-1.5 text-fg-3" />
        {next ? <><span className="font-semibold">Next date:</span> {shortDate((next.kind === 'task' ? next.task.due! : next.appt.start.slice(0, 10)))}{next.kind === 'appointment' ? `, ${next.appt.start.slice(11, 16)}` : ''} — {next.kind === 'task' ? next.task.title : next.appt.title}</>
          : 'No dates yet. A deadline is a dated task here — it reaches Today on its day.'}</p>
      {adding ? (
        <form className="grid gap-2 mt-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end" onSubmit={e => { e.preventDefault(); addDeadline(); }} data-s="case-deadline-form">
          <Field label="Deadline" htmlFor="caseDlTitle"><TextInput id="caseDlTitle" value={title} maxLength={120} placeholder="e.g. Send my witness statement" onChange={e => setTitle(e.target.value)} /></Field>
          <Field label="Date" htmlFor="caseDlDate"><TextInput id="caseDlDate" type="date" min={k} className="!w-auto" value={date} onChange={e => setDate(e.target.value)} /></Field>
          <Button inline type="submit" variant="primary" data-action="case-deadline-add" disabled={!title.trim() || !date}>Add</Button>
        </form>
      ) : <Button inline variant="ghost" className="mt-2" data-action="case-deadline" onClick={() => setAdding(true)}><Plus size={18} aria-hidden="true" /> Add a deadline</Button>}
      <a href={tabHref(p, 'evidence')} className="block min-h-11 py-2 mt-1 text-fg no-underline hover:underline underline-offset-4" data-s="case-summary">{parts.join(' · ')}</a>
      <p className="text-sm text-fg-3 m-0" data-s="case-not-advice">{NOT_ADVICE}</p>
    </Card>
  );
}

// ---------- Timeline ----------
export function TimelineView({ p }: { p: Project }) {
  const list = timelineInOrder(p), full = list.length >= CASE_LIMITS.timeline;
  const [open, setOpen] = useState(list.length === 0);
  const [n, setN] = useState({ date: '', about: false, title: '', details: '', source: 'mine' as TimelineSource });
  function add() {
    let r = null as ReturnType<typeof addEntry>;
    update(d => { r = addEntry(d, p.id, n); if (!r || r === 'full' || r === 'big') return false; });
    said(r, 'Added to the timeline.', String(CASE_LIMITS.timeline));
    if (typeof r === 'string' && r !== 'full' && r !== 'big') setN({ date: '', about: false, title: '', details: '', source: n.source });
  }
  // Grouped by month, in date order.
  const months: { key: string; label: string; items: TimelineEntry[] }[] = [];
  for (const t of list) { const key = t.date.slice(0, 7); if (months[months.length - 1]?.key !== key) months.push({ key, label: parseKey(t.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), items: [] }); months[months.length - 1].items.push(t); }
  return (
    <Card aria-labelledby="pjTlH" id="caseTimeline">
      <h2 id="pjTlH" className="flex items-center gap-2"><History size={22} aria-hidden="true" className="text-primary" /> Timeline</h2>
      <p className="text-[15px] text-fg-2 m-0">What happened, in date order. Each entry says where it comes from — your account, their account, or the evidence — so the three never blur.</p>
      {full ? <p className="text-[15px] text-fg-2 mt-3 mb-0" data-s="tl-full">That's {CASE_LIMITS.timeline} entries — the most a case can hold. Remove one to add another.</p>
        : !open ? <Button inline variant="primary" className="mt-3" data-action="tl-open" onClick={() => setOpen(true)}><Plus size={18} aria-hidden="true" /> Add to the timeline</Button> : (
        <form className="grid gap-3 mt-4 rounded-tile bg-surface-2 border border-outline p-3" onSubmit={e => { e.preventDefault(); add(); }} id="tlAddForm">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Date" htmlFor="tlDate"><TextInput id="tlDate" type="date" className="!w-auto" value={n.date} onChange={e => setN({ ...n, date: e.target.value })} /></Field>
            <label className="inline-flex items-center gap-2 min-h-11 text-[15px]"><input type="checkbox" className="size-5 accent-[var(--primary)]" checked={n.about} data-s="tl-about" onChange={e => setN({ ...n, about: e.target.checked })} /> About this date</label>
          </div>
          <Field label="What happened" htmlFor="tlTitle"><TextInput id="tlTitle" value={n.title} maxLength={CASE_LIMITS.title} placeholder="e.g. Meeting with my manager about my hours" onChange={e => setN({ ...n, title: e.target.value })} /></Field>
          <Field label="Details (optional)" htmlFor="tlDetails"><TextArea id="tlDetails" rows={3} value={n.details} maxLength={CASE_LIMITS.details} onChange={e => setN({ ...n, details: e.target.value })} /></Field>
          <SourcePick value={n.source} name="tlSource" onPick={source => setN({ ...n, source })} />
          <div className="flex gap-2.5"><Button inline type="submit" variant="primary" data-action="tl-add" disabled={!n.title.trim() || !n.date}>Add</Button>
            {list.length > 0 && <Button inline variant="ghost" onClick={() => setOpen(false)}>Close</Button>}</div>
        </form>
      )}
      {list.length === 0 ? <p className="text-[15px] text-fg-2 mt-4 mb-0" data-s="tl-empty">Start with whatever matters most — add the rest in any order; MyDay keeps them in date order.</p> : (
        <div className="mt-4">
          {months.map(m => (
            <section key={m.key} aria-label={m.label}>
              <h3 className="text-sm font-bold uppercase tracking-[.06em] text-fg-3 mt-4 mb-1">{m.label}</h3>
              <ol className="list-none p-0 m-0 border-l-2 border-outline pl-4">{m.items.map(t => <EntryRow key={t.id} p={p} t={t} />)}</ol>
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}
function SourcePick({ value, name, onPick }: { value: TimelineSource; name: string; onPick: (s: TimelineSource) => void }) {
  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="text-sm text-fg-2 mb-1.5">Where it comes from</legend>
      <div className="flex flex-wrap gap-2" data-s="tl-source">
        {(Object.keys(SOURCE_LABEL) as TimelineSource[]).map(s => (
          <label key={s} className="group relative inline-flex items-center gap-2 min-h-11 px-3 rounded-btn border border-outline text-[14px] font-semibold text-fg-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:text-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
            <input type="radio" name={name} value={s} className="absolute -inset-px m-0 opacity-0 cursor-pointer" checked={value === s} onChange={() => onPick(s)} />
            <span aria-hidden="true" className="grid place-items-center size-[18px] rounded-full border-2 border-outline-strong group-has-[:checked]:border-primary"><span className="hidden size-2 rounded-full bg-primary group-has-[:checked]:block" /></span>{SOURCE_LABEL[s]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function EntryRow({ p, t }: { p: Project; t: TimelineEntry }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const c = p.case!, ev = c.evidence.filter(e => t.evidenceIds.includes(e.id)), is = c.issues.filter(i => t.issueIds.includes(i.id));
  const save = (patch: Parameters<typeof editEntry>[3]) => { let r = false as boolean | 'big'; update(d => { r = editEntry(d, p.id, t.id, patch); if (r !== true) return false; }); if (r === 'big') toast(BIG); };
  async function remove() {
    if (!(await confirm({ title: 'Remove this from the timeline?', body: `“${t.title}”`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (update(d => (removeEntry(d, p.id, t.id) ? undefined : false))) toast('Removed from the timeline.');
  }
  return (
    <li className="py-2.5 relative" data-s="tl-entry" data-id={t.id} data-source={t.source}>
      <span aria-hidden="true" className="absolute -left-[23px] top-4 size-3 rounded-full bg-primary border-2 border-surface" />
      <p className="m-0 text-sm text-fg-3 flex flex-wrap items-center gap-x-2 gap-y-1"><span className="tabular-nums">{when(t)}</span><span className={chip} data-s="tl-source-chip">{SOURCE_LABEL[t.source]}</span></p>
      <p className="m-0 mt-0.5 font-semibold break-words leading-snug">{t.title}</p>
      {t.details && !editing && <p className="m-0 mt-1 text-[15px] text-fg-2 whitespace-pre-line break-words">{t.details}</p>}
      {(ev.length > 0 || is.length > 0) && !editing && <p className="m-0 mt-1.5 flex flex-wrap gap-1.5" data-s="tl-links">{ev.map(e => <span key={e.id} className={chip}><Files size={12} aria-hidden="true" className="mr-1" />{e.title}</span>)}{is.map(i => <span key={i.id} className={chip}><ListChecks size={12} aria-hidden="true" className="mr-1" />{i.title}</span>)}</p>}
      <Button inline variant="ghost" className="mt-1" data-action="tl-edit" aria-expanded={editing} onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit or link'}</Button>
      {editing && (
        <div className="grid gap-3 mt-2 rounded-tile bg-surface-2 border border-outline p-3" data-s="tl-editor">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Date" htmlFor={`tlD-${t.id}`}><CommitInput id={`tlD-${t.id}`} type="date" className="!w-auto" key={t.date} defaultValue={t.date} onCommit={el => { if (el.value) save({ date: el.value }); else el.value = t.date; }} /></Field>
            <label className="inline-flex items-center gap-2 min-h-11 text-[15px]"><input type="checkbox" className="size-5 accent-[var(--primary)]" checked={t.about} onChange={e => save({ about: e.target.checked })} /> About this date</label>
          </div>
          <Field label="What happened" htmlFor={`tlT-${t.id}`}><CommitInput id={`tlT-${t.id}`} key={t.title} defaultValue={t.title} maxLength={CASE_LIMITS.title} onCommit={el => { if (!el.value.trim()) { el.value = t.title; return; } save({ title: el.value }); }} /></Field>
          <Field label="Details (optional)" htmlFor={`tlX-${t.id}`}><CommitTextarea id={`tlX-${t.id}`} rows={3} key={t.details} defaultValue={t.details} maxLength={CASE_LIMITS.details} onCommit={el => save({ details: el.value })} /></Field>
          <SourcePick value={t.source} name={`tlS-${t.id}`} onPick={source => save({ source })} />
          <Links p={p} kind="entry-evidence" fromId={t.id} chosen={t.evidenceIds} options={c.evidence.map(e => ({ id: e.id, label: e.title }))} legend="Evidence it relates to" empty="No evidence added yet — add it on the Evidence tab." />
          <Links p={p} kind="entry-issue" fromId={t.id} chosen={t.issueIds} options={c.issues.map(i => ({ id: i.id, label: i.title }))} legend="Issues it relates to" empty="No issues added yet — add them on the Issues tab." />
          <div><Button inline variant="ghost" data-action="tl-remove" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Remove</Button></div>
        </div>
      )}
    </li>
  );
}
// Tick boxes to link (or unlink) one thing to others.
function Links({ p, kind, fromId, chosen, options, legend, empty }: { p: Project; kind: LinkKind; fromId: string; chosen: string[]; options: { id: string; label: string }[]; legend: string; empty: string }) {
  return (
    <fieldset className="border-0 p-0 m-0" data-s={`links-${kind}`}>
      <legend className="text-sm text-fg-2 mb-1">{legend}</legend>
      {!options.length ? <p className="text-sm text-fg-3 m-0">{empty}</p> : (
        <ul className="list-none p-0 m-0 grid gap-0.5">{options.map(o => (
          <li key={o.id}><label className="flex items-center gap-2.5 min-h-11 text-[15px] cursor-pointer">
            <input type="checkbox" className="size-5 flex-none accent-[var(--primary)]" checked={chosen.includes(o.id)} data-s="link-pick" data-id={o.id}
              onChange={() => { let r = false as boolean | 'full'; update(d => { r = toggleLink(d, p.id, kind, fromId, o.id); if (r !== true) return false; }); if (r === 'full') toast('That’s the most links for one — unlink one first.'); }} />
            <span className="break-words min-w-0">{o.label}</span></label></li>))}</ul>
      )}
    </fieldset>
  );
}

// ---------- Evidence ----------
const NEXT_STATUS: Partial<Record<EvidenceStatus, [EvidenceStatus, string]>> = { 'to-get': ['have', 'Got it'], have: ['reviewed', 'Reviewed'] };
export function EvidenceView({ p }: { p: Project }) {
  const list = p.case?.evidence ?? [], g = caseCounts(p), full = list.length >= CASE_LIMITS.evidence;
  const [show, setShow] = useState<'all' | EvidenceStatus>('all');
  const [open, setOpen] = useState(list.length === 0);
  const [n, setN] = useState({ title: '', kind: 'document' as EvidenceKind, date: '', where: '', status: 'have' as EvidenceStatus });
  function add() {
    let r = null as ReturnType<typeof addEvidence>;
    update(d => { r = addEvidence(d, p.id, n); if (!r || r === 'full' || r === 'big') return false; });
    said(r, 'Evidence added.', String(CASE_LIMITS.evidence));
    if (typeof r === 'string' && r !== 'full' && r !== 'big') setN({ ...n, title: '', date: '', where: '' });
  }
  const shown = show === 'all' ? list : list.filter(e => e.status === show);
  const filters: ['all' | EvidenceStatus, string, number][] = [['all', 'All', list.length], ['to-get', 'To get', g.toGet], ['have', 'Have it', g.have], ['reviewed', 'Reviewed', g.reviewed]];
  return (
    <Card aria-labelledby="pjEvH" id="caseEvidence">
      <h2 id="pjEvH" className="flex items-center gap-2"><Files size={22} aria-hidden="true" className="text-primary" /> Evidence</h2>
      <p className="text-[15px] text-fg-2 m-0">What could show what happened, and where it’s kept. MyDay doesn’t store the files themselves — just where to find them.</p>
      {full ? <p className="text-[15px] text-fg-2 mt-3 mb-0" data-s="ev-full">That's {CASE_LIMITS.evidence} — the most a case can hold. Remove one to add another.</p>
        : !open ? <Button inline variant="primary" className="mt-3" data-action="ev-open" onClick={() => setOpen(true)}><Plus size={18} aria-hidden="true" /> Add evidence</Button> : (
        <form className="grid gap-3 mt-4 rounded-tile bg-surface-2 border border-outline p-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); add(); }} id="evAddForm">
          <Field label="What it is" htmlFor="evTitle" className="sm:col-span-2"><TextInput id="evTitle" value={n.title} maxLength={CASE_LIMITS.title} placeholder="e.g. Payslips, March to June" onChange={e => setN({ ...n, title: e.target.value })} /></Field>
          <Field label="Kind" htmlFor="evKind"><Select id="evKind" value={n.kind} onChange={e => setN({ ...n, kind: e.target.value as EvidenceKind })}>{(Object.keys(KIND_LABEL) as EvidenceKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</Select></Field>
          <Field label="Do you have it?" htmlFor="evStatus"><Select id="evStatus" value={n.status} onChange={e => setN({ ...n, status: e.target.value as EvidenceStatus })}>{(Object.keys(EVIDENCE_STATUS_LABEL) as EvidenceStatus[]).map(s => <option key={s} value={s}>{EVIDENCE_STATUS_LABEL[s]}</option>)}</Select></Field>
          <Field label="Its date (optional)" htmlFor="evDate"><TextInput id="evDate" type="date" className="!w-auto" value={n.date} onChange={e => setN({ ...n, date: e.target.value })} /></Field>
          <Field label="Where it’s kept (optional)" htmlFor="evWhere"><TextInput id="evWhere" value={n.where} maxLength={CASE_LIMITS.where} placeholder="e.g. Email folder “Work”" onChange={e => setN({ ...n, where: e.target.value })} /></Field>
          <div className="flex gap-2.5 sm:col-span-2"><Button inline type="submit" variant="primary" data-action="ev-add" disabled={!n.title.trim()}>Add</Button>
            {list.length > 0 && <Button inline variant="ghost" onClick={() => setOpen(false)}>Close</Button>}</div>
        </form>
      )}
      {list.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4" role="group" aria-label="Show" data-s="ev-filter">
          {filters.map(([id, label, count]) => (
            <button key={id} type="button" aria-pressed={show === id} data-filter={id} onClick={() => setShow(id)}
              className={`inline-flex items-center gap-1.5 min-h-11 px-3 rounded-btn border text-[14px] font-semibold cursor-pointer ${show === id ? 'bg-primary-container text-on-primary-container border-transparent' : 'bg-transparent text-fg-2 border-outline hover:bg-surface-2'}`}>
              {label} <span className="tabular-nums">{count}</span></button>
          ))}
        </div>
      )}
      {list.length === 0 ? <p className="text-[15px] text-fg-2 mt-4 mb-0" data-s="ev-empty">Nothing here yet. Things you still need to get count too — mark them “To get”.</p>
        : !shown.length ? <p className="text-[15px] text-fg-2 mt-3 mb-0">Nothing here right now.</p> : (
        <ul className="list-none p-0 m-0 mt-2" aria-label="Evidence">{shown.map(e => <EvidenceRow key={e.id} p={p} e={e} />)}</ul>
      )}
    </Card>
  );
}
const isLink = (s: string) => /^https?:\/\/\S+$/i.test(s);
function EvidenceRow({ p, e }: { p: Project; e: EvidenceItem }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const is = p.case!.issues.filter(i => e.issueIds.includes(i.id)), next = NEXT_STATUS[e.status];
  const save = (patch: Parameters<typeof editEvidence>[3]) => { let r = false as boolean | 'big'; update(d => { r = editEvidence(d, p.id, e.id, patch); if (r !== true) return false; }); if (r === 'big') toast(BIG); };
  async function remove() {
    const used = (p.case?.timeline ?? []).filter(t => t.evidenceIds.includes(e.id)).length;
    if (!(await confirm({ title: 'Remove this evidence?', body: `“${e.title}”${used ? ` It comes off the ${used === 1 ? 'timeline entry' : `${used} timeline entries`} it’s linked to; those stay.` : ''}`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (update(d => (removeEvidence(d, p.id, e.id) ? undefined : false))) toast('Evidence removed.');
  }
  return (
    <li className="border-t border-outline first:border-t-0 py-3" data-s="evidence" data-id={e.id} data-status={e.status}>
      <p className="m-0 font-semibold break-words leading-snug">{e.title}</p>
      <p className="m-0 mt-0.5 text-sm text-fg-2 flex flex-wrap items-center gap-x-2 gap-y-1"><span>{KIND_LABEL[e.kind]}{e.date ? ` · ${shortDate(e.date)}` : ''}</span><span className={chip} data-s="ev-status">{EVIDENCE_STATUS_LABEL[e.status]}</span></p>
      {e.where && !editing && <p className="m-0 mt-1 text-sm text-fg-2 break-words" data-s="ev-where">Kept: {isLink(e.where) ? <a href={e.where} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{e.where}</a> : e.where}</p>}
      {e.notes && !editing && <p className="m-0 mt-1 text-[15px] text-fg-2 whitespace-pre-line break-words">{e.notes}</p>}
      {is.length > 0 && !editing && <p className="m-0 mt-1.5 flex flex-wrap gap-1.5">{is.map(i => <span key={i.id} className={chip}><ListChecks size={12} aria-hidden="true" className="mr-1" />{i.title}</span>)}</p>}
      <div className="flex flex-wrap gap-2 mt-2">
        {next && <Button inline variant="tonal" data-action="ev-next" onClick={() => { save({ status: next[0] }); toast(next[0] === 'have' ? 'Marked as got — nice.' : 'Marked as reviewed.'); }}>{next[1]}</Button>}
        <Button inline variant="ghost" data-action="ev-edit" aria-expanded={editing} onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit or link'}</Button>
      </div>
      {editing && (
        <div className="grid gap-3 mt-2 rounded-tile bg-surface-2 border border-outline p-3 sm:grid-cols-2" data-s="ev-editor">
          <Field label="What it is" htmlFor={`evT-${e.id}`} className="sm:col-span-2"><CommitInput id={`evT-${e.id}`} key={e.title} defaultValue={e.title} maxLength={CASE_LIMITS.title} onCommit={el => { if (!el.value.trim()) { el.value = e.title; return; } save({ title: el.value }); }} /></Field>
          <Field label="Kind" htmlFor={`evK-${e.id}`}><Select id={`evK-${e.id}`} value={e.kind} onChange={ev => save({ kind: ev.target.value as EvidenceKind })}>{(Object.keys(KIND_LABEL) as EvidenceKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}</Select></Field>
          <Field label="Do you have it?" htmlFor={`evS-${e.id}`}><Select id={`evS-${e.id}`} value={e.status} data-action="ev-status" onChange={ev => save({ status: ev.target.value as EvidenceStatus })}>{(Object.keys(EVIDENCE_STATUS_LABEL) as EvidenceStatus[]).map(s => <option key={s} value={s}>{EVIDENCE_STATUS_LABEL[s]}</option>)}</Select></Field>
          <Field label="Its date (optional)" htmlFor={`evD-${e.id}`}><CommitInput id={`evD-${e.id}`} type="date" className="!w-auto" key={`d${e.date}`} defaultValue={e.date ?? ''} onCommit={el => save({ date: el.value || null })} /></Field>
          <Field label="Where it’s kept" htmlFor={`evW-${e.id}`}><CommitInput id={`evW-${e.id}`} key={e.where} defaultValue={e.where} maxLength={CASE_LIMITS.where} onCommit={el => save({ where: el.value })} /></Field>
          <Field label="Notes (optional)" htmlFor={`evN-${e.id}`} className="sm:col-span-2"><CommitTextarea id={`evN-${e.id}`} rows={3} key={e.notes} defaultValue={e.notes} maxLength={CASE_LIMITS.notes} onCommit={el => save({ notes: el.value })} /></Field>
          <div className="sm:col-span-2"><Links p={p} kind="evidence-issue" fromId={e.id} chosen={e.issueIds} options={p.case!.issues.map(i => ({ id: i.id, label: i.title }))} legend="Issues it relates to" empty="No issues added yet — add them on the Issues tab." /></div>
          <div className="sm:col-span-2"><Button inline variant="ghost" data-action="ev-remove" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Remove</Button></div>
        </div>
      )}
    </li>
  );
}

// ---------- Issues ----------
export function IssuesView({ p }: { p: Project }) {
  const list = p.case?.issues ?? [], full = list.length >= CASE_LIMITS.issues;
  const [title, setTitle] = useState('');
  function add() {
    let r = null as ReturnType<typeof addIssue>;
    update(d => { r = addIssue(d, p.id, title); if (!r || r === 'full' || r === 'big') return false; });
    said(r, 'Issue added.', String(CASE_LIMITS.issues));
    if (typeof r === 'string' && r !== 'full' && r !== 'big') setTitle('');
  }
  return (
    <Card aria-labelledby="pjIsH" id="caseIssues">
      <h2 id="pjIsH" className="flex items-center gap-2"><ListChecks size={22} aria-hidden="true" className="text-primary" /> Issues</h2>
      <p className="text-[15px] text-fg-2 m-0">What you’re claiming or considering. Each shows the evidence and timeline entries you’ve linked to it — where nothing is linked yet is where to look next.</p>
      {list.length > 0 && <ul className="list-none p-0 m-0 mt-3" aria-label="Issues">{list.map(i => <IssueRow key={i.id} p={p} id={i.id} />)}</ul>}
      {full ? <p className="text-[15px] text-fg-2 mt-3 mb-0" data-s="is-full">That's {CASE_LIMITS.issues} — the most a case can hold. Remove one to add another.</p> : (
        <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-4" onSubmit={e => { e.preventDefault(); add(); }} id="isAddForm">
          <Field label={list.length ? 'Add another issue' : 'Add the first issue'} htmlFor="isNew"><TextInput id="isNew" value={title} maxLength={CASE_LIMITS.issueTitle} placeholder="e.g. Unpaid holiday pay" onChange={e => setTitle(e.target.value)} /></Field>
          <Button inline type="submit" variant="primary" data-action="is-add" disabled={!title.trim()}><Plus size={18} aria-hidden="true" /> Add</Button>
        </form>
      )}
      <p className="text-sm text-fg-3 mb-0 mt-3">{NOT_ADVICE}</p>
    </Card>
  );
}
function IssueRow({ p, id }: { p: Project; id: string }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const i = p.case!.issues.find(x => x.id === id)!, links = issueLinks(p, id);
  const save = (patch: Parameters<typeof editIssue>[3]) => { let r = false as boolean | 'big'; update(d => { r = editIssue(d, p.id, id, patch); if (r !== true) return false; }); if (r === 'big') toast(BIG); };
  async function remove() {
    const n = links.evidence.length + links.entries.length;
    if (!(await confirm({ title: 'Remove this issue?', body: `“${i.title}”${n ? ' It comes off the evidence and timeline entries linked to it; those stay.' : ''}`, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (update(d => (removeIssue(d, p.id, id) ? undefined : false))) toast('Issue removed.');
  }
  return (
    <li className="border-t border-outline first:border-t-0 py-3" data-s="issue" data-id={id} data-status={i.status}>
      <p className="m-0 font-semibold break-words leading-snug">{i.title}</p>
      <div className="flex flex-wrap items-center gap-2 mt-1.5">
        <label className="sr-only" htmlFor={`isS-${id}`}>Status of “{i.title}”</label>
        <Select id={`isS-${id}`} className="!w-auto" value={i.status} data-action="is-status" onChange={e => save({ status: e.target.value as IssueStatus })}>{(Object.keys(ISSUE_STATUS_LABEL) as IssueStatus[]).map(s => <option key={s} value={s}>{ISSUE_STATUS_LABEL[s]}</option>)}</Select>
        <Button inline variant="ghost" data-action="is-edit" aria-expanded={editing} onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</Button>
      </div>
      {i.notes && !editing && <p className="m-0 mt-1.5 text-[15px] text-fg-2 whitespace-pre-line break-words" data-s="is-notes"><span className="font-semibold text-fg">What I need to show:</span> {i.notes}</p>}
      <div className="mt-2 text-[15px]" data-s="is-links">
        {!links.evidence.length && !links.entries.length ? <p className="m-0 text-fg-3" data-s="is-nothing">Nothing linked yet — link evidence or timeline entries from their Edit.</p> : <>
          {links.evidence.length > 0 && <p className="m-0 text-sm text-fg-3 font-semibold mt-1">Evidence</p>}
          <ul className="list-none p-0 m-0">{links.evidence.map(e => <li key={e.id} className="flex flex-wrap gap-x-2 py-0.5"><span className="break-words">{e.title}</span><span className={chip}>{EVIDENCE_STATUS_LABEL[e.status]}</span></li>)}</ul>
          {links.entries.length > 0 && <p className="m-0 text-sm text-fg-3 font-semibold mt-1.5">Timeline</p>}
          <ul className="list-none p-0 m-0">{links.entries.map(t => <li key={t.id} className="py-0.5 break-words"><span className="text-fg-3 tabular-nums mr-1.5">{when(t)}</span>{t.title} <span className={chip}>{SOURCE_LABEL[t.source]}</span></li>)}</ul>
        </>}
      </div>
      {editing && (
        <div className="grid gap-3 mt-2 rounded-tile bg-surface-2 border border-outline p-3" data-s="is-editor">
          <Field label="Issue" htmlFor={`isT-${id}`}><CommitInput id={`isT-${id}`} key={i.title} defaultValue={i.title} maxLength={CASE_LIMITS.issueTitle} onCommit={el => { if (!el.value.trim()) { el.value = i.title; return; } save({ title: el.value }); }} /></Field>
          <Field label="What I need to show (optional)" htmlFor={`isN-${id}`}><CommitTextarea id={`isN-${id}`} rows={3} key={i.notes} defaultValue={i.notes} maxLength={CASE_LIMITS.issueNotes} onCommit={el => save({ notes: el.value })} /></Field>
          <div><Button inline variant="ghost" data-action="is-remove" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Remove</Button></div>
        </div>
      )}
    </li>
  );
}
