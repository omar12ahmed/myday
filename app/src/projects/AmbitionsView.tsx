import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, CommitTextarea, Field, Select, TextInput } from '../components/Field';
import { BackLink, LinkButton } from '../components/parts';
import {
  addAmbition, addLink, addStep, AMBITION_LIMITS, ambitionById, ambitionsInOrder, ambitionsOfProject, deleteAmbition, editAmbition, editStep, linkedProject,
  linksOf, linksWords, moveStep, removeLink, removeStep, stepsOf, stepsWords, tickStep, towardsLine, type LinkKind,
} from '../data/ambitions';
import { nextStep, projectsInOrder, stageOf } from '../data/projects';
import { completion, completionText, stIndex } from '../data/study/roadmap';
import { topicGlance, topicPath, topicsOf } from '../data/study/topics';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { Ambition, AmbitionLink, MyDayData, Project } from '../data/types';

// Ambitions (specs/projects-ambitions.md): the strip on the Projects home, an ambition's page, and a project's "A step
// towards …". The rules are in data/ambitions.ts. Nothing it links is moved; never sent to AI.
const enc = encodeURIComponent;
const ambitionHref = (id: string) => `#projects/a/${enc(id)}`;
const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
const save = (fn: (d: MyDayData) => boolean) => update(d => (fn(d) ? undefined : false));

// ---------- The Projects home's strip ----------
export function AmbitionsStrip({ data }: { data: MyDayData }) {
  const list = ambitionsInOrder(data), [adding, setAdding] = useState(false), [title, setTitle] = useState(''), [why, setWhy] = useState('');
  function add() {
    let id: string | null = null;
    if (!save(d => !!(id = addAmbition(d, title, why)))) { toast(data.ambitions.items.length >= AMBITION_LIMITS.items ? 'That’s 12 ambitions — plenty. Remove one to add another.' : 'Couldn’t add that just now.'); return; }
    setTitle(''); setWhy(''); setAdding(false); location.hash = ambitionHref(id!);
  }
  return (
    <section aria-labelledby="ambitionsH" className="mb-3" data-s="ambitions">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ambitionsH" className="m-0">Your ambitions</h2>
        {!adding && <LinkButton className="text-[15px]" data-action="ambition-new" onClick={() => { setAdding(true); focusSoon('ambitionNew'); }}><Plus size={16} aria-hidden="true" className="inline mr-1" />An ambition</LinkButton>}
      </div>
      {list.length === 0 && !adding && <p className="m-0 mt-1 text-[15px] text-fg-2" data-s="ambitions-none">What are your projects and learning steps towards? Name an ambition, and MyDay shows what moves it forward.</p>}
      {list.length > 0 && (
        <ul className="list-none p-0 m-0 mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(a => (
            <li key={a.id}>
              <a href={ambitionHref(a.id)} className="block rounded-card border border-outline bg-surface p-3 min-h-11 text-fg no-underline hover:bg-surface-2" data-s="ambition-card" data-id={a.id}>
                <span className="block font-semibold break-words">{a.title}</span>
                <span className="block text-sm text-fg-2">{[linksWords(a), stepsWords(a)].filter(Boolean).join(' · ') || 'Nothing linked yet'}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <form className="grid gap-2 mt-2 rounded-card border border-outline bg-surface p-3" onSubmit={e => { e.preventDefault(); add(); }} data-s="ambition-form">
          <Field label="An ambition" htmlFor="ambitionNew"><TextInput id="ambitionNew" value={title} maxLength={AMBITION_LIMITS.title} placeholder="e.g. Work in cybersecurity" onChange={e => setTitle(e.target.value)} /></Field>
          <Field label="Why it matters to you (optional)" htmlFor="ambitionWhy"><TextInput id="ambitionWhy" value={why} maxLength={AMBITION_LIMITS.why} onChange={e => setWhy(e.target.value)} /></Field>
          <p className="m-0 text-sm text-fg-2">One to three is plenty.</p>
          <div className="flex flex-wrap gap-2.5">
            <Button inline type="submit" variant="primary" data-action="ambition-add" disabled={!title.trim()}>Add</Button>
            <Button inline variant="ghost" data-action="ambition-cancel" onClick={() => { setAdding(false); focusSoon('ambitionsH'); }}>Cancel</Button>
          </div>
        </form>
      )}
    </section>
  );
}

// ---------- A project's line ----------
export function ProjectTowards({ data, p }: { data: MyDayData; p: Project }) {
  const list = ambitionsOfProject(data, p.id);
  if (!list.length) return null;
  return <a href={ambitionHref(list[0].id)} className="block mt-1 text-[15px] text-fg-2 no-underline hover:underline underline-offset-4 break-words" data-s="project-towards">{towardsLine(list)}</a>;
}

// ---------- Where a linked thing stands, in words ----------
// The Arabic and Cybersecurity catalogues are large: each loads only when an ambition's page shows its link.
type ArabicMod = typeof import('../study/arabic/plan');
type CyberMods = [typeof import('../study/cybersecurity/plan'), typeof import('../study/cybersecurity/catalogue')];
const cache: { arabic?: Promise<ArabicMod>; cyber?: Promise<CyberMods> } = {};
function useLoaded<T>(key: 'arabic' | 'cyber', load: () => Promise<T>, need: boolean): T | null | 'failed' {
  const [mod, setMod] = useState<T | null | 'failed'>(null);
  useEffect(() => {
    if (!need) return;
    let live = true;
    ((cache[key] as Promise<T> | undefined) ?? ((cache as Record<string, Promise<T>>)[key] = load())).then(m => { if (live) setMod(m); })
      .catch(() => { delete cache[key]; if (live) setMod('failed'); });
    return () => { live = false; };
  }, [key, load, need]);
  return mod;
}
const loadArabic = () => import('../study/arabic/plan');
const loadCyber = () => Promise.all([import('../study/cybersecurity/plan'), import('../study/cybersecurity/catalogue')]) as Promise<CyberMods>;

interface Shown { title: string; where: string; href: string | null; gone?: boolean }
function useLinkShown(data: MyDayData, l: AmbitionLink): Shown {
  const arabic = useLoaded('arabic', loadArabic, l.kind === 'arabic'), cyber = useLoaded('cyber', loadCyber, l.kind === 'cyber');
  if (l.kind === 'project') {
    const p = linkedProject(data, l);
    if (!p) return { title: 'A project', where: 'No longer in your projects', href: null, gone: true };
    const step = nextStep(data, p);
    return { title: p.title, where: [stageOf(p.stage).label, p.status === 'done' ? 'finished' : p.status === 'paused' ? 'paused' : step ? `next: ${step.title}` : 'no next step yet'].join(' · '), href: `#projects/p/${enc(p.id)}` };
  }
  if (l.kind === 'topic' || l.kind === 'course') {
    const ix = stIndex(data.study);
    if (l.kind === 'topic') {
      const g = topicGlance(data.study, ix, l.ref ?? '');
      return g ? { title: g.topic.title, where: [completionText(g.comp), g.next ? `next: ${g.next.title}` : ''].filter(Boolean).join(' · '), href: '#' + topicPath(g.topic.id) } : { title: 'A Study topic', where: 'No longer in Study', href: null, gone: true };
    }
    const c = ix.course.get(l.ref ?? '')?.node;
    return c ? { title: c.title, where: completionText(completion(ix.courseTasks.get(c.id) ?? [])), href: `#study/course/${enc(c.id)}` } : { title: 'A Study course', where: 'No longer in Study', href: null, gone: true };
  }
  if (l.kind === 'arabic') {
    if (!arabic || arabic === 'failed') return { title: 'The Arabic route', where: arabic === 'failed' ? 'Couldn’t load just now' : 'Loading…', href: '#study/arabic' };
    const r = arabic.arabicRoute(data), here = r.stages.find(s => s.state === 'here');
    return { title: `The Arabic route: ${r.goal}`, where: here ? `${here.label} · ${here.done} of ${here.lessons} lessons${here.can.length ? ` · then you can: ${here.can.slice(0, 2).join('; ')}` : ''}` : 'Every stage done', href: '#study/arabic' };
  }
  if (l.kind === 'cyber') {
    if (!cyber || cyber === 'failed') return { title: 'The Cybersecurity path', where: cyber === 'failed' ? 'Couldn’t load just now' : 'Loading…', href: '#study/cybersecurity' };
    const [plan, cat] = cyber, g = plan.cyberGlance(data), name = cat.selectedPath(data.cybersecurity.pathId).name;
    return { title: `The Cybersecurity path: ${name}`, where: `${g.done} of ${g.path} lessons done`, href: '#study/cybersecurity' };
  }
  return { title: 'Something from a newer MyDay', where: '', href: null };
}
function LinkRow({ data, a, l }: { data: MyDayData; a: Ambition; l: AmbitionLink }) {
  const s = useLinkShown(data, l);
  return (
    <li className="border-t border-outline first:border-t-0 py-2 flex flex-wrap items-center gap-x-2" data-s="ambition-link" data-kind={l.kind} data-id={l.id}>
      {s.href ? <a href={s.href} className="flex-1 min-w-[12rem] min-h-11 py-1 text-fg no-underline hover:underline underline-offset-4 break-words"><span className="block font-medium">{s.title}</span><span className="block text-sm text-fg-2" data-s="link-where">{s.where}</span></a>
        : <span className="flex-1 min-w-[12rem] py-1 break-words"><span className="block font-medium">{s.title}</span><span className="block text-sm text-fg-2" data-s="link-where">{s.where}</span></span>}
      <Button inline variant="ghost" aria-label={`Unlink ${s.title}`} data-action="link-remove" onClick={() => { if (save(d => removeLink(d, a.id, l.id))) toast('Unlinked — nothing else changed.'); }}>Unlink</Button>
    </li>
  );
}

// ---------- An ambition's page ----------
export function AmbitionPage({ data, id }: { data: MyDayData; id: string }) {
  const a = ambitionById(data, id), confirm = useConfirm();
  useEffect(() => { focusSoon('ambitionH'); }, [id]);
  if (!a) return <div className="max-w-[1000px] mx-auto"><Card><p className="m-0">That ambition isn’t here any more.</p><BackLink to="projects" label="Projects" /></Card></div>;
  async function remove() {
    if (!await confirm({ title: 'Delete this ambition?', body: 'Its steps go with it. Nothing it links is touched.', confirmLabel: 'Delete', cancelLabel: 'Keep it' })) return;
    if (save(d => deleteAmbition(d, a!.id))) { toast('Ambition deleted.'); location.hash = 'projects'; }
  }
  return (
    <div className="max-w-[1000px] mx-auto grid gap-3" data-s="ambition-page" data-id={a.id}>
      <BackLink to="projects" label="Projects" />
      <Card aria-labelledby="ambitionH">
        <p className="m-0 text-xs font-bold tracking-[.08em] uppercase text-primary">Ambition</p>
        <h2 id="ambitionH" tabIndex={-1} className="m-0 text-[24px] break-words">{a.title}</h2>
        {a.why && <p className="m-0 mt-1 text-[15px] text-fg-2 break-words" data-s="ambition-why">{a.why}</p>}
        <details className="mt-2"><summary className="cursor-pointer min-h-11 flex items-center text-primary font-semibold text-[15px]" data-action="ambition-edit">Edit</summary>
          <div className="grid gap-3 mt-2">
            <Field label="Ambition" htmlFor="ambitionTitle"><CommitInput id="ambitionTitle" key={a.title} defaultValue={a.title} maxLength={AMBITION_LIMITS.title} onCommit={el => { if (!el.value.trim()) { el.value = a.title; return; } save(d => editAmbition(d, a.id, { title: el.value })); }} /></Field>
            <Field label="Why it matters to you" htmlFor="ambitionWhyEdit"><CommitTextarea id="ambitionWhyEdit" key={a.why ?? ''} rows={2} defaultValue={a.why ?? ''} maxLength={AMBITION_LIMITS.why} onCommit={el => save(d => editAmbition(d, a.id, { why: el.value }))} /></Field>
          </div>
        </details>
      </Card>
      <StepsCard data={data} a={a} />
      <LinksCard data={data} a={a} />
      <div><Button inline variant="ghost" data-action="ambition-delete" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Delete ambition</Button></div>
    </div>
  );
}

// Its own steps: an ordered route, each pointing at one of its links if you like.
function StepsCard({ data, a }: { data: MyDayData; a: Ambition }) {
  const [text, setText] = useState(''), [linkId, setLinkId] = useState(''), steps = stepsOf(a), links = linksOf(a);
  function add() {
    if (!save(d => !!addStep(d, a.id, text, linkId || undefined))) return;
    setText(''); setLinkId(''); focusSoon('stepNew');
  }
  return (
    <Card aria-labelledby="stepsH" id="ambitionSteps">
      <h3 id="stepsH" className="m-0">Steps {steps.length > 0 && <span className="text-fg-3 font-normal tabular-nums">{steps.filter(s => s.done).length} of {steps.length}</span>}</h3>
      <p className="m-0 mt-1 text-sm text-fg-2">The route, in order — "Learn networking", "Security+", "A home lab", "Apply". Tick one when it's behind you.</p>
      {steps.length > 0 && (
        <ol className="list-decimal pl-6 m-0 mt-2">
          {steps.map((s, i) => (
            <li key={s.id} className="border-t border-outline first:border-t-0 py-1.5" data-s="ambition-step" data-id={s.id} data-done={s.done ? 'yes' : 'no'}>
              <div className="flex flex-wrap items-center gap-x-2">
                <label className="inline-grid place-items-center size-11 -my-1 cursor-pointer flex-none"><input type="checkbox" className="size-5 accent-[var(--primary)]" checked={!!s.done} aria-label={`Behind you: ${s.text}`} data-action="step-tick" onChange={() => save(d => tickStep(d, a.id, s.id))} /></label>
                <CommitInput aria-label={`Step: ${s.text}`} className="flex-1 min-w-[10rem]" key={s.text} defaultValue={s.text} maxLength={AMBITION_LIMITS.step} onCommit={el => { if (!el.value.trim()) { el.value = s.text; return; } save(d => editStep(d, a.id, s.id, { text: el.value })); }} />
                <Button inline variant="ghost" aria-label={`Move “${s.text}” up`} disabled={i === 0} data-action="step-up" onClick={() => save(d => moveStep(d, a.id, s.id, -1))}>↑</Button>
                <Button inline variant="ghost" aria-label={`Move “${s.text}” down`} disabled={i === steps.length - 1} data-action="step-down" onClick={() => save(d => moveStep(d, a.id, s.id, 1))}>↓</Button>
                <Button inline variant="ghost" aria-label={`Remove “${s.text}”`} data-action="step-remove" onClick={() => save(d => removeStep(d, a.id, s.id))}><Trash2 size={16} aria-hidden="true" /></Button>
              </div>
              {links.length > 0 && (
                <Field label="Points at" htmlFor={`stepLink-${s.id}`} className="mt-1 max-w-sm">
                  <Select id={`stepLink-${s.id}`} value={s.linkId ?? ''} onChange={e => save(d => editStep(d, a.id, s.id, { linkId: e.target.value || null }))}>
                    <option value="">Nothing in particular</option>
                    {links.map(l => <LinkOption key={l.id} data={data} l={l} />)}
                  </Select>
                </Field>
              )}
            </li>
          ))}
        </ol>
      )}
      <form className="flex flex-wrap items-end gap-2 mt-2" onSubmit={e => { e.preventDefault(); add(); }} data-s="step-form">
        <Field label="Add a step" htmlFor="stepNew" className="flex-1 min-w-[12rem]"><TextInput id="stepNew" value={text} maxLength={AMBITION_LIMITS.step} placeholder="e.g. Pass Security+" onChange={e => setText(e.target.value)} /></Field>
        {links.length > 0 && <Field label="Points at (optional)" htmlFor="stepNewLink"><Select id="stepNewLink" value={linkId} onChange={e => setLinkId(e.target.value)}><option value="">Nothing in particular</option>{links.map(l => <LinkOption key={l.id} data={data} l={l} />)}</Select></Field>}
        <Button inline type="submit" variant="tonal" data-action="step-add" aria-label="Add the step" disabled={!text.trim()}><Plus size={18} aria-hidden="true" /></Button>
      </form>
    </Card>
  );
}
function LinkOption({ data, l }: { data: MyDayData; l: AmbitionLink }) {
  const s = useLinkShown(data, l);
  return <option value={l.id}>{s.title}</option>;
}

// What it links: a project, a Study topic or course, the Cybersecurity path or the Arabic route — by reference.
function LinksCard({ data, a }: { data: MyDayData; a: Ambition }) {
  const [kind, setKind] = useState<LinkKind>('project'), [ref, setRef] = useState(''), links = linksOf(a);
  const ix = stIndex(data.study), projects = [...projectsInOrder(data, 'active'), ...projectsInOrder(data, 'paused')];
  const topics = topicsOf(data.study).filter(t => t.id), courses = [...ix.course.values()].map(x => x.node).filter(c => !c.archived);
  const choices = kind === 'project' ? projects.map(p => ({ id: p.id, title: p.title })) : kind === 'topic' ? topics.map(t => ({ id: t.id, title: t.title })) : kind === 'course' ? courses.map(c => ({ id: c.id, title: c.title })) : [];
  function link() {
    let r: ReturnType<typeof addLink> = null;
    if (!save(d => { r = addLink(d, a.id, kind, choices.length ? ref : undefined); return typeof r === 'string' && r !== 'already'; })) { toast(r === 'already' ? 'Already linked.' : 'Choose what to link.'); return; }
    setRef(''); toast('Linked — it stays where it is.');
  }
  return (
    <Card aria-labelledby="linksH" id="ambitionLinks">
      <h3 id="linksH" className="m-0">What it links</h3>
      <p className="m-0 mt-1 text-sm text-fg-2">Projects and learning that are steps towards it. They stay where they are; Today says what each task moves forward.</p>
      {links.length > 0 && <ul className="list-none p-0 m-0 mt-2">{links.map(l => <LinkRow key={l.id} data={data} a={a} l={l} />)}</ul>}
      <form className="grid gap-2 mt-3 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-end" onSubmit={e => { e.preventDefault(); link(); }} data-s="link-form">
        <Field label="Link" htmlFor="linkKind"><Select id="linkKind" value={kind} onChange={e => { setKind(e.target.value as LinkKind); setRef(''); }}>
          <option value="project">A project</option><option value="topic">A Study topic</option><option value="course">A Study course</option><option value="cyber">The Cybersecurity path</option><option value="arabic">The Arabic route</option>
        </Select></Field>
        {choices.length > 0 || kind === 'project' || kind === 'topic' || kind === 'course' ? (
          <Field label="Which" htmlFor="linkRef"><Select id="linkRef" value={ref} onChange={e => setRef(e.target.value)} disabled={!choices.length}>
            <option value="">{choices.length ? 'Choose…' : 'Nothing to choose yet'}</option>{choices.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </Select></Field>
        ) : <p className="m-0 text-sm text-fg-2 self-center">{kind === 'cyber' ? 'Whichever path you’ve chosen in Cybersecurity.' : 'Your Arabic goal, whichever you’ve chosen.'}</p>}
        <Button inline type="submit" variant="tonal" data-action="link-add" disabled={(kind === 'project' || kind === 'topic' || kind === 'course') && !ref}><Plus size={18} aria-hidden="true" /> Link</Button>
      </form>
    </Card>
  );
}
