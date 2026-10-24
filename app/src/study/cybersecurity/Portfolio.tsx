import { useId, useState } from 'react';
import { BriefcaseBusiness, Download } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useConfirm } from '../../components/confirm';
import { Field, TextArea, TextInput } from '../../components/Field';
import { shortDate, todayKey } from '../../data/dates';
import { addEntry, editEntry, entriesFrom, EVIDENCE_MAX, NOTE_MAX, notYet, PRIVACY_CHECKS, removeEntry, TITLE_MAX, type EntryText } from '../../data/cybersecurity/portfolio';
import type { CyberAttempt, PortfolioEntry } from '../../data/cybersecurity/types';
import { lessonHref } from '../../data/cybersecurity/types';
import { update } from '../../data/storage';
import { toast } from '../../data/toast';
import type { MyDayData } from '../../data/types';
import { BackLink, Eyebrow, InlineLink } from '../parts';
import { modules } from './catalogue';
import { exportPortfolio, grouped } from './portfolioPages';

// The Cybersecurity portfolio (specs/study-home-and-lessons.md §10): work from your lab notebook you chose to keep, by
// module and lesson. Self-study evidence in your own words, never a credential, and never sent to AI.

export function PortfolioView({ data }: { data: MyDayData }) {
  const entries = data.cybersecurity.portfolio ?? [];
  return <>
    <Card data-cy-portfolio={entries.length}>
      <BackLink to="study/cybersecurity/notebook" label="Lab notebook" />
      <Eyebrow><BriefcaseBusiness className="inline mr-1" size={18} aria-hidden="true" /> Portfolio</Eyebrow>
      <h2>Your portfolio</h2>
      <p>Work from your lab notebook that you’ve chosen to keep: its evidence as you left it, your note and its files. It’s your own record of self-study, not a credential, and it’s never sent to AI.</p>
      {entries.length
        ? <><p className="text-[15px]">{entries.length === 1 ? '1 entry' : `${entries.length} entries`}.</p>
          <Button inline variant="tonal" data-action="cy-pf-export" onClick={() => exportPortfolio(data)}><Download size={18} aria-hidden="true" /> Export portfolio</Button>
          <p className="text-sm text-fg-2 mt-2 mb-0">Downloads a zip: a page you can open in any browser, with every entry. “Download a copy” (your backup) lists the entries but not their files.</p></>
        : <p className="mb-0">Nothing yet. In your <InlineLink href="#study/cybersecurity/notebook">lab notebook</InlineLink>, a handed-in attempt has “Add to portfolio”.</p>}
    </Card>
    {grouped(entries).map(g => <Card key={g.moduleId ?? 'other'} aria-label={g.moduleId ? modules.get(g.moduleId)?.name : 'Other work'}>
      <h3 className="mt-0">{g.moduleId ? modules.get(g.moduleId)?.name ?? g.moduleId : 'Other work'}</h3>
      {[...g.places.values()].map(p => <section key={p.lessonId ?? p.label} className="border-t border-outline first-of-type:border-t-0 pt-3 mt-3 first-of-type:mt-0">
        <h4 className="mt-0 mb-1">{p.lessonId ? <InlineLink href={lessonHref(p.lessonId)}>{p.label}</InlineLink> : p.label}</h4>
        {p.entries.map(e => <EntryCard key={e.id} entry={e} />)}
      </section>)}
    </Card>)}
  </>;
}

function EntryCard({ entry: e }: { entry: PortfolioEntry }) {
  const [editing, setEditing] = useState(false);
  const confirm = useConfirm();
  async function remove() {
    if (!(await confirm({ title: 'Remove this entry?', body: `“${e.title}” leaves your portfolio. Its attempt stays in your lab notebook.`, confirmLabel: 'Remove it', cancelLabel: 'Keep it' }))) return;
    if (update(d => { if (!removeEntry(d, e.id)) return false; })) toast('Removed from your portfolio.');
  }
  if (editing) return <EntryForm initial={{ title: e.title, evidence: e.evidence, note: e.note }} submitLabel="Save changes" onCancel={() => setEditing(false)}
    onSave={(t, checked) => { if (update(d => { if (!editEntry(d, e.id, t, checked, todayKey())) return false; })) setEditing(false); }} />;
  return <article className="rounded-tile border border-outline bg-surface px-4 py-3 my-2.5" data-cy-pf-entry={e.id}>
    <h5 className="text-[17px] font-semibold m-0">{e.title}</h5>
    <p className="text-sm text-fg-2 m-0 mt-0.5">Reviewed {shortDate(e.reviewedOn)} · self-study evidence</p>
    {e.evidence && <p className="whitespace-pre-wrap text-[15px] mt-2 mb-0" data-cy-pf-evidence="">{e.evidence}</p>}
    {e.note && <p className="text-[15px] mt-2 mb-0"><strong>Note:</strong> <span className="whitespace-pre-wrap">{e.note}</span></p>}
    <div className="flex flex-wrap gap-2 mt-2">
      <Button inline variant="ghost" data-action="cy-pf-edit" onClick={() => setEditing(true)}>Edit</Button>
      <Button inline variant="ghost" data-action="cy-pf-remove" onClick={remove}>Remove</Button>
    </div>
  </article>;
}

// Under a handed-in attempt in the notebook: "Add to portfolio", and where it already is.
export function AddToPortfolio({ data, attempt, title }: { data: MyDayData; attempt: CyberAttempt; title: string }) {
  const [open, setOpen] = useState(false);
  const existing = entriesFrom(data, attempt.id);
  if (!open) return <div className="border-t border-outline pt-3 mt-3" data-cy-pf-from={existing.length}>
    {existing.length > 0 && <p className="text-sm m-0 mb-1">In your <InlineLink href="#study/cybersecurity/portfolio">portfolio</InlineLink>: {existing.map(e => e.title).join(', ')}.</p>}
    <Button inline variant="ghost" data-action="cy-pf-open" onClick={() => setOpen(true)}>{existing.length ? 'Add it to your portfolio again' : 'Add to portfolio'}</Button>
  </div>;
  return <EntryForm initial={{ title: title.slice(0, TITLE_MAX), evidence: attempt.evidence.slice(0, EVIDENCE_MAX), note: '' }} submitLabel="Add to portfolio" onCancel={() => setOpen(false)}
    onSave={(t, checked) => { let id: string | null = null; if (update(d => { id = addEntry(d, attempt.id, t, checked, todayKey()); if (!id) return false; }) && id) { setOpen(false); toast('Added to your portfolio.'); } }} />;
}

// The entry's text and the privacy check. Text that looks like a secret is pointed out and has to change first.
function EntryForm({ initial, submitLabel, onSave, onCancel }: { initial: EntryText; submitLabel: string; onSave: (t: EntryText, checked: boolean) => void; onCancel: () => void }) {
  const id = useId();
  const [t, setT] = useState<EntryText>(initial), [ticks, setTicks] = useState<boolean[]>(PRIVACY_CHECKS.map(() => false));
  const problem = notYet(t), checked = ticks.every(Boolean);
  return <form className="rounded-tile border border-outline bg-surface px-4 py-3 my-3 grid gap-3" data-cy-pf-form="" onSubmit={e => { e.preventDefault(); if (!problem && checked) onSave(t, checked); }}>
    <Field label="Title" htmlFor={id + 't'}><TextInput id={id + 't'} data-s="cy-pf-title" maxLength={TITLE_MAX} required value={t.title} onChange={e => setT({ ...t, title: e.target.value })} /></Field>
    <Field label="Evidence (from your attempt; redact anything you shouldn’t keep)" htmlFor={id + 'e'}><TextArea id={id + 'e'} data-s="cy-pf-evidence" rows={6} maxLength={EVIDENCE_MAX} value={t.evidence} onChange={e => setT({ ...t, evidence: e.target.value })} /></Field>
    <Field label="A note (optional)" htmlFor={id + 'n'}><TextArea id={id + 'n'} data-s="cy-pf-note" rows={2} maxLength={NOTE_MAX} value={t.note} onChange={e => setT({ ...t, note: e.target.value })} /></Field>
    <fieldset className="border border-outline rounded-tile p-3 m-0 grid gap-1 min-w-0" data-cy-pf-privacy="">
      <legend className="px-1 font-semibold">Before it’s kept: check what’s in it</legend>
      {PRIVACY_CHECKS.map((c, i) => <label key={c} className="flex items-start gap-3 min-h-11 py-1 text-[15px] cursor-pointer">
        <input type="checkbox" data-s="cy-pf-check" data-i={i} className="size-[22px] mt-0.5 flex-none accent-primary" checked={ticks[i]} onChange={e => setTicks(ticks.map((x, j) => (j === i ? e.target.checked : x)))} /> {c}
      </label>)}
      <p className="text-sm text-fg-2 m-0">Pictures and PDFs can’t be checked automatically, so the tick is yours.</p>
    </fieldset>
    {problem && t.title.trim() && <p role="alert" className="text-[15px] m-0" data-cy-pf-problem="">{problem}</p>}
    <div className="flex flex-wrap gap-2">
      <Button inline type="submit" variant="primary" data-action="cy-pf-save" disabled={!!problem || !checked}>{submitLabel}</Button>
      <Button inline variant="ghost" onClick={onCancel}>Cancel</Button>
    </div>
  </form>;
}
