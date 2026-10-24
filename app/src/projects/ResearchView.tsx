import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitTextarea, Field, Select, TextArea, TextInput } from '../components/Field';
import { LinkButton, Note } from '../components/parts';
import { isBusiness } from '../data/businessModel';
import { isDateKey, shortDate, todayKey } from '../data/dates';
import { filesOf } from '../data/files';
import { noteName } from '../data/notes';
import {
  addFinding, addQuestion, addSource, answerQuestion, editFinding, editQuestion, editSource, findingsAbout, questionOrder, removeResearch, reopenQuestion,
  RESEARCH_LIMITS, researchOf, sourceInfo, STANCES, type NewFinding, type Stance,
} from '../data/research';
import { resourceName } from '../data/projectResources';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData, Project, ResearchFinding, ResearchQuestion, ResearchSource } from '../data/types';
import { openFile, WHY } from '../sync/files';

// The Research tab (specs/projects-research.md): what you want to find out (questions, open first), what you found
// (findings: from which sources, the day, how far to trust it, and what it bears on), and where it came from (sources:
// a link, file or note you already have, or typed). Deciding what's true stays yours. Never sent to AI.

const STANCE_WORD: Record<Stance, string> = { supports: 'Supports', contradicts: 'Contradicts', relates: 'Relates to' };
const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
const apply = (fn: (d: MyDayData) => boolean) => update(d => (fn(d) ? undefined : false));

export function ResearchView({ data, p }: { data: MyDayData; p: Project }) {
  const r = researchOf(data, p.id);
  return (
    <div className="grid gap-4" data-s="research">
      <QuestionsCard data={data} p={p} questions={r.questions} />
      <FindingsCard data={data} p={p} findings={r.findings} />
      <SourcesCard data={data} p={p} sources={r.sources} findings={r.findings} />
    </div>
  );
}

// ---------- Questions ----------
function QuestionsCard({ data, p, questions }: { data: MyDayData; p: Project; questions: ResearchQuestion[] }) {
  const [text, setText] = useState('');
  function add() {
    const out: { r: ReturnType<typeof addQuestion> } = { r: { ok: false, why: '' } };
    update(d => { out.r = addQuestion(d, p.id, text); return out.r.ok ? undefined : false; });
    const r = out.r;
    if (r.ok) { setText(''); focusSoon('researchQuestionNew'); } else if (r.why) toast(r.why);
  }
  const open = questions.filter(q => !q.answeredOn).length;
  return (
    <Card aria-labelledby="researchQuestionsH" data-s="research-questions">
      <h3 id="researchQuestionsH">Questions</h3>
      <Note className="mt-0">{questions.length ? `${open} open, ${questions.length - open} answered.` : 'What do you want to find out? Each question gathers its findings, and what you concluded.'}</Note>
      {questions.length > 0 && <ul className="list-none p-0 m-0">{questionOrder(questions).map(q => <QuestionRow key={q.id} data={data} p={p} q={q} />)}</ul>}
      {questions.length < RESEARCH_LIMITS.questions && (
        <form className="flex flex-wrap gap-2 mt-3" onSubmit={e => { e.preventDefault(); add(); }}>
          <label htmlFor="researchQuestionNew" className="sr-only">A question to find out</label>
          <TextInput id="researchQuestionNew" className="flex-1 min-w-[12rem]" value={text} maxLength={RESEARCH_LIMITS.text} placeholder="e.g. Who sells this in Hargeisa now?" onChange={e => setText(e.target.value)} />
          <Button inline type="submit" data-action="research-question-add" disabled={!text.trim()}>Add a question</Button>
        </form>
      )}
    </Card>
  );
}
function QuestionRow({ data, p, q }: { data: MyDayData; p: Project; q: ResearchQuestion }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const e = findingsAbout(data, p.id, 'question', q.id);
  async function remove() {
    if (!(await confirm({ title: 'Remove this question?', body: 'Its findings stay; they just stop pointing at it.', confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (apply(d => removeResearch(d, q.id))) toast('Question removed.');
  }
  return (
    <li className="border-t border-outline first:border-t-0 py-3" data-s="research-question" data-id={q.id} data-state={q.answeredOn ? 'answered' : 'open'}>
      {editing ? (
        <TextInput aria-label="The question" defaultValue={q.text} maxLength={RESEARCH_LIMITS.text} autoFocus
          onBlur={ev => { apply(d => editQuestion(d, q.id, { text: ev.target.value })); setEditing(false); }} onKeyDown={ev => { if (ev.key === 'Enter') (ev.target as HTMLInputElement).blur(); }} />
      ) : <p className="m-0 font-semibold break-words">{q.text}</p>}
      <p className="m-0 text-sm text-fg-3">{q.answeredOn ? `Answered ${shortDate(q.answeredOn)}` : 'Open'}</p>
      <FindingsList data={data} groups={e} empty="No findings yet." />
      <Field label="What you concluded" htmlFor={`rqC-${q.id}`} className="mt-2">
        <CommitTextarea id={`rqC-${q.id}`} rows={2} key={q.conclusion} defaultValue={q.conclusion} maxLength={RESEARCH_LIMITS.conclusion} placeholder="Your answer, in your words, once you have one"
          onCommit={el => { apply(d => editQuestion(d, q.id, { conclusion: el.value })); }} />
      </Field>
      <div className="flex flex-wrap gap-x-5 mt-1">
        {q.answeredOn ? <LinkButton className="text-[15px]" data-action="research-question-reopen" onClick={() => { if (apply(d => reopenQuestion(d, q.id))) toast('Open again.'); }}>Reopen</LinkButton>
          : <LinkButton className="text-[15px]" data-action="research-question-answer" disabled={!q.conclusion}
            onClick={() => { if (apply(d => answerQuestion(d, q.id))) toast('Answered.'); }}>{q.conclusion ? 'Mark answered' : 'Write what you concluded to mark it answered'}</LinkButton>}
        <LinkButton className="text-[15px]" data-action="research-question-edit" onClick={() => setEditing(true)}>Edit</LinkButton>
        <LinkButton className="text-[15px]" data-action="research-question-remove" onClick={remove}>Remove</LinkButton>
      </div>
    </li>
  );
}
// The findings about something, by how they bear on it.
export function FindingsList({ data, groups, empty }: { data: MyDayData; groups: Record<Stance, ResearchFinding[]>; empty: string }) {
  const any = STANCES.some(s => groups[s].length);
  if (!any) return <p className="m-0 mt-1 text-sm text-fg-3">{empty}</p>;
  return (
    <div className="mt-1 grid gap-1">
      {STANCES.filter(s => groups[s].length).map(s => (
        <div key={s} data-s={`research-${s}`}>
          <p className="m-0 text-sm font-semibold text-fg-2">{STANCE_WORD[s]} ({groups[s].length})</p>
          <ul className="list-disc pl-5 m-0">{groups[s].map(f => <li key={f.id} className="text-[15px] break-words">{f.text}{f.sourceIds.length ? <span className="text-fg-3"> — {f.sourceIds.map(id => sourceName(data, id)).join(', ')}</span> : null}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}
function sourceName(data: MyDayData, id: string) { const s = data.research.items.find(x => x.id === id) as ResearchSource | undefined; return s ? sourceInfo(data, s).name : 'a source'; }

// ---------- Findings ----------
function FindingsCard({ data, p, findings }: { data: MyDayData; p: Project; findings: ResearchFinding[] }) {
  const [adding, setAdding] = useState(false);
  const list = [...findings].sort((a, b) => (b.on ?? '').localeCompare(a.on ?? '') || b.createdAt.localeCompare(a.createdAt));
  return (
    <Card aria-labelledby="researchFindingsH" data-s="research-findings">
      <h3 id="researchFindingsH">Findings</h3>
      {list.length ? <ul className="list-none p-0 m-0">{list.map(f => <FindingRow key={f.id} data={data} p={p} f={f} />)}</ul>
        : !adding && <Note className="mt-0">What you found out, where it came from, and how far to trust it.</Note>}
      {adding ? <FindingForm data={data} p={p} onDone={() => { setAdding(false); focusSoon('researchFindingAdd'); }} />
        : findings.length < RESEARCH_LIMITS.findings && <Button inline id="researchFindingAdd" className={list.length ? 'mt-3' : ''} data-action="research-finding-add" onClick={() => setAdding(true)}>Add a finding</Button>}
    </Card>
  );
}
function FindingRow({ data, p, f }: { data: MyDayData; p: Project; f: ResearchFinding }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const what = (a: { kind: string; id: string }) => {
    if (a.kind === 'question') return (data.research.items.find(x => x.id === a.id) as ResearchQuestion | undefined)?.text ?? 'a question';
    return p.model?.assumptions.find(x => x.id === a.id)?.text ?? 'something that must be true';
  };
  async function remove() {
    if (!(await confirm({ title: 'Remove this finding?', body: 'Its sources stay.', confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (apply(d => removeResearch(d, f.id))) toast('Finding removed.');
  }
  if (editing) return <li className="border-t border-outline first:border-t-0 py-3"><FindingForm data={data} p={p} f={f} onDone={() => setEditing(false)} /></li>;
  return (
    <li className="border-t border-outline first:border-t-0 py-3" data-s="research-finding" data-id={f.id}>
      <p className="m-0 break-words whitespace-pre-line">{f.text}</p>
      <p className="m-0 text-sm text-fg-3">{[f.on && `Found ${shortDate(f.on)}`, f.sourceIds.length ? `From ${f.sourceIds.map(id => sourceName(data, id)).join(', ')}` : 'No source yet'].filter(Boolean).join(' · ')}</p>
      {f.limits && <p className="m-0 text-sm text-fg-2 break-words" data-s="research-limits"><span className="font-semibold">Limits:</span> {f.limits}</p>}
      {f.about.length > 0 && <ul className="list-none p-0 m-0 mt-1">{f.about.map(a => <li key={a.kind + a.id} className="text-sm text-fg-2 break-words">{STANCE_WORD[(STANCES as readonly string[]).includes(a.stance) ? a.stance as Stance : 'relates']} “{what(a)}”</li>)}</ul>}
      <div className="flex flex-wrap gap-x-5 mt-1">
        <LinkButton className="text-[15px]" data-action="research-finding-edit" onClick={() => setEditing(true)}>Edit</LinkButton>
        <LinkButton className="text-[15px]" data-action="research-finding-remove" onClick={remove}>Remove</LinkButton>
      </div>
    </li>
  );
}
type About = NonNullable<NewFinding['about']>[number];
function FindingForm({ data, p, f, onDone }: { data: MyDayData; p: Project; f?: ResearchFinding; onDone: () => void }) {
  const r = researchOf(data, p.id);
  const [text, setText] = useState(f?.text ?? ''), [limits, setLimits] = useState(f?.limits ?? ''), [on, setOn] = useState(f?.on ?? todayKey());
  const [sources, setSources] = useState<string[]>(f?.sourceIds ?? []);
  const [about, setAbout] = useState<About[]>((f?.about ?? []).filter(a => (a.kind === 'question' || a.kind === 'assumption') && (STANCES as readonly string[]).includes(a.stance)) as About[]);
  const [newSource, setNewSource] = useState(false);
  const targets: { kind: 'question' | 'assumption'; id: string; text: string }[] = [
    ...questionOrder(r.questions).map(q => ({ kind: 'question' as const, id: q.id, text: q.text })),
    ...(isBusiness(p) ? (p.model?.assumptions ?? []).map(a => ({ kind: 'assumption' as const, id: a.id, text: a.text })) : []),
  ];
  const stanceOf = (t: { kind: string; id: string }) => about.find(a => a.kind === t.kind && a.id === t.id)?.stance ?? '';
  const setStance = (t: { kind: 'question' | 'assumption'; id: string }, s: string) => setAbout(list => [...list.filter(a => !(a.kind === t.kind && a.id === t.id)), ...(s ? [{ kind: t.kind, id: t.id, stance: s as Stance }] : [])]);
  const idp = f ? `rfE-${f.id}` : 'rfN';
  function save() {
    const finding: NewFinding = { text, limits, on: isDateKey(on) ? on : null, sourceIds: sources, about };
    if (f) { apply(d => editFinding(d, f.id, finding)); onDone(); return; }
    const out: { r: ReturnType<typeof addFinding> } = { r: { ok: false, why: '' } };
    update(d => { out.r = addFinding(d, p.id, finding); return out.r.ok ? undefined : false; });
    const r = out.r;
    if (!r.ok) { if (r.why) toast(r.why); return; }
    toast('Finding added.');
    onDone();
  }
  return (
    <form className="grid gap-3" data-s="research-finding-form" onSubmit={e => { e.preventDefault(); save(); }}>
      <Field label="What you found" htmlFor={`${idp}-text`}><TextArea id={`${idp}-text`} rows={3} value={text} maxLength={RESEARCH_LIMITS.text} autoFocus onChange={e => setText(e.target.value)} /></Field>
      <fieldset className="border-0 p-0 m-0 grid gap-1.5">
        <legend className="text-sm text-fg-2 mb-1">Where it came from</legend>
        {r.sources.length === 0 && <p className="m-0 text-sm text-fg-3">No sources yet.</p>}
        {r.sources.map(s => (
          <label key={s.id} className="flex items-center gap-2 min-h-11 text-[15px] cursor-pointer">
            <input type="checkbox" className="w-5 h-5" checked={sources.includes(s.id)} onChange={e => setSources(l => (e.target.checked ? [...l, s.id] : l.filter(x => x !== s.id)))} />
            <span className="break-words">{sourceInfo(data, s).name}</span>
          </label>
        ))}
        {newSource ? <SourceForm data={data} p={p} onDone={id => { setNewSource(false); if (id) setSources(l => [...l, id]); }} />
          : <LinkButton className="text-[15px] justify-self-start" data-action="research-finding-new-source" onClick={() => setNewSource(true)}>Add a source</LinkButton>}
      </fieldset>
      {targets.length > 0 && (
        <fieldset className="border-0 p-0 m-0 grid gap-2">
          <legend className="text-sm text-fg-2 mb-1">What it bears on</legend>
          {targets.map(t => (
            <div key={t.kind + t.id} className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center">
              <span className="text-[15px] break-words">{t.kind === 'assumption' ? 'Must be true: ' : ''}{t.text}</span>
              <Select aria-label={`How it bears on “${t.text}”`} className="!w-auto" value={stanceOf(t)} onChange={e => setStance(t, e.target.value)}>
                <option value="">—</option>
                {STANCES.map(s => <option key={s} value={s}>{STANCE_WORD[s]}</option>)}
              </Select>
            </div>
          ))}
        </fieldset>
      )}
      <Field label="Limits: how far to trust it (optional)" htmlFor={`${idp}-limits`}><TextInput id={`${idp}-limits`} value={limits} maxLength={RESEARCH_LIMITS.limits} placeholder="e.g. one shop’s view; asked in the dry season" onChange={e => setLimits(e.target.value)} /></Field>
      <Field label="Found on" htmlFor={`${idp}-on`}><TextInput id={`${idp}-on`} type="date" className="!w-auto" value={on ?? ''} onChange={e => setOn(e.target.value)} /></Field>
      <div className="flex flex-wrap gap-2">
        <Button inline type="submit" variant="primary" data-action="research-finding-save" disabled={!text.trim()}>{f ? 'Save' : 'Add the finding'}</Button>
        <Button inline variant="ghost" data-action="research-finding-cancel" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

// ---------- Sources ----------
function SourcesCard({ data, p, sources, findings }: { data: MyDayData; p: Project; sources: ResearchSource[]; findings: ResearchFinding[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <Card aria-labelledby="researchSourcesH" data-s="research-sources">
      <h3 id="researchSourcesH">Sources</h3>
      {sources.length ? <ul className="list-none p-0 m-0">{sources.map(s => <SourceRow key={s.id} data={data} s={s} used={findings.filter(f => f.sourceIds.includes(s.id)).length} />)}</ul>
        : !adding && <Note className="mt-0">A link, file or note you already have here, or one you type: a book, a conversation, an interview.</Note>}
      {adding ? <SourceForm data={data} p={p} onDone={() => { setAdding(false); focusSoon('researchSourceAdd'); }} />
        : sources.length < RESEARCH_LIMITS.sources && <Button inline id="researchSourceAdd" className={sources.length ? 'mt-3' : ''} data-action="research-source-add" onClick={() => setAdding(true)}>Add a source</Button>}
    </Card>
  );
}
function SourceRow({ data, s, used }: { data: MyDayData; s: ResearchSource; used: number }) {
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const info = sourceInfo(data, s);
  async function remove() {
    const body = `${used ? `It comes out of ${used} finding${used === 1 ? '' : 's'}, which keep their words. ` : ''}${s.ref ? 'The link, file or note itself stays where it is.' : ''}`.trim() || 'It can’t be brought back.';
    if (!(await confirm({ title: 'Remove this source?', body, confirmLabel: 'Remove', cancelLabel: 'Keep it' }))) return;
    if (apply(d => removeResearch(d, s.id))) toast('Source removed.');
  }
  async function openIt() {
    if (s.ref?.kind === 'file') { const f = data.files.items.find(x => x.id === s.ref!.id); if (f) { const r = await openFile(f); if (r !== 'ok') toast(WHY[r]); } }
  }
  if (editing && !s.ref) return <li className="border-t border-outline first:border-t-0 py-3"><SourceForm data={data} p={data.projects.items.find(x => x.id === s.projectId)!} s={s} onDone={() => setEditing(false)} /></li>;
  return (
    <li className="border-t border-outline first:border-t-0 py-3" data-s="research-source" data-id={s.id} data-ref={s.ref?.kind ?? 'typed'}>
      {info.href ? <a className="font-semibold text-primary break-words" href={info.href} {...(s.ref?.kind === 'resource' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{info.name}</a>
        : <span className="block font-semibold break-words">{info.name}</span>}
      <p className="m-0 text-sm text-fg-3">{[info.detail, used ? `Used by ${used} finding${used === 1 ? '' : 's'}` : 'Not used yet'].filter(Boolean).join(' · ')}</p>
      <div className="flex flex-wrap gap-x-5 mt-1">
        {s.ref?.kind === 'file' && !info.gone && <LinkButton className="text-[15px]" data-action="research-source-open" onClick={openIt}>Open</LinkButton>}
        {!s.ref && <LinkButton className="text-[15px]" data-action="research-source-edit" onClick={() => setEditing(true)}>Edit</LinkButton>}
        <LinkButton className="text-[15px]" data-action="research-source-remove" onClick={remove}>Remove</LinkButton>
      </div>
    </li>
  );
}
// A new source (one of this project's links, files or notes, or typed), or editing a typed one.
function SourceForm({ data, p, s, onDone }: { data: MyDayData; p: Project; s?: ResearchSource; onDone: (id?: string) => void }) {
  const have = researchOf(data, p.id).sources;
  const used = (kind: string, id: string) => have.some(x => x.ref?.kind === kind && x.ref.id === id);
  const options = [
    ...(p.resources ?? []).filter(r => !used('resource', r.id)).map(r => ({ value: `resource:${r.id}`, label: `Link: ${resourceName(r)}` })),
    ...filesOf(data, { kind: 'project', id: p.id }).filter(f => !used('file', f.id)).map(f => ({ value: `file:${f.id}`, label: `File: ${f.name}` })),
    ...data.notes.items.filter(n => n.projectId === p.id && !used('note', n.id)).map(n => ({ value: `note:${n.id}`, label: `Note: ${noteName(n)}` })),
  ];
  const [pick, setPick] = useState(s ? '' : options.length ? options[0].value : ''), [typed, setTyped] = useState(!!s || !options.length);
  const [title, setTitle] = useState(s?.title ?? ''), [from, setFrom] = useState(s?.from ?? ''), [on, setOn] = useState(s?.on ?? '');
  const idp = s ? `rsE-${s.id}` : 'rsN';
  function save() {
    if (s) { apply(d => editSource(d, s.id, { title, from, on: isDateKey(on) ? on : null })); onDone(s.id); return; }
    const out: { r: ReturnType<typeof addSource> } = { r: { ok: false, why: '' } };
    const [kind, id] = typed ? ['', ''] : pick.split(':');
    const label = options.find(o => o.value === pick)?.label.replace(/^(Link|File|Note): /, '') ?? '';
    update(d => { out.r = addSource(d, p.id, typed ? { title, from, on: isDateKey(on) ? on : null } : { ref: { kind: kind as 'resource' | 'file' | 'note', id }, title: label }); return out.r.ok ? undefined : false; });
    const r = out.r;
    if (!r.ok) { if (r.why) toast(r.why); return; }
    toast('Source added.');
    onDone(r.id);
  }
  return (
    <div className="grid gap-3 mt-2" data-s="research-source-form">
      {!s && options.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Kind of source">
          <Button inline variant={typed ? 'ghost' : 'selected'} aria-pressed={!typed} data-action="research-source-mine" onClick={() => setTyped(false)}>One of this project’s</Button>
          <Button inline variant={typed ? 'selected' : 'ghost'} aria-pressed={typed} data-action="research-source-typed" onClick={() => setTyped(true)}>Type one</Button>
        </div>
      )}
      {!typed ? (
        <Field label="Link, file or note" htmlFor={`${idp}-pick`}>
          <Select id={`${idp}-pick`} value={pick} onChange={e => setPick(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
        </Field>
      ) : <>
        <Field label="Title" htmlFor={`${idp}-title`}><TextInput id={`${idp}-title`} value={title} maxLength={RESEARCH_LIMITS.title} placeholder="e.g. A talk with a shop owner" onChange={e => setTitle(e.target.value)} /></Field>
        <Field label="Who or where it’s from (optional)" htmlFor={`${idp}-from`}><TextInput id={`${idp}-from`} value={from} maxLength={RESEARCH_LIMITS.from} placeholder="e.g. a market stall, a book’s author" onChange={e => setFrom(e.target.value)} /></Field>
        <Field label="Its date (optional)" htmlFor={`${idp}-on`}><TextInput id={`${idp}-on`} type="date" className="!w-auto" value={on ?? ''} onChange={e => setOn(e.target.value)} /></Field>
      </>}
      <div className="flex flex-wrap gap-2">
        <Button inline variant="primary" data-action="research-source-save" disabled={typed ? !title.trim() : !pick} onClick={save}>{s ? 'Save' : 'Add the source'}</Button>
        <Button inline variant="ghost" data-action="research-source-cancel" onClick={() => onDone()}>Cancel</Button>
      </div>
    </div>
  );
}
