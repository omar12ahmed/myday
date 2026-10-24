import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, Select, TextInput } from '../components/Field';
import { Choice, Choices, LinkButton, Note } from '../components/parts';
import { update } from '../data/storage';
import { stIndex } from '../data/study/roadmap';
import { addStudyLink, bookChoices, courseChoices, isLessonKind, LINK_KIND_LABEL, LINK_KINDS, LINK_LIMITS, linkView, removeStudyLink, setStudyLinkWhy, type LessonInfo, type LessonKind, type LinkKind, type LinkView } from '../data/studyLinks';
import { toast } from '../data/toast';
import type { MyDayData, Project } from '../data/types';

// "Learning" (specs/projects-study-links.md): what you're learning for this project in Study — your courses, books and
// Arabic and Cybersecurity lessons — with Study's own status and why it matters. Unlinking never changes Study.

const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());

// The lesson catalogues are large, so each loads on demand, only when a project has one of its lessons or you choose
// to link one. Once loaded it's kept; if it can't load, the card says so, and opening the form or "Try again" tries again.
type LessonModule = typeof import('./learningArabic'); // learningCyber.ts has the same shape
type Lessons = LessonModule | null | 'failed';
const LOAD: Record<LessonKind, () => Promise<LessonModule>> = { arabic: () => import('./learningArabic'), cyber: () => import('./learningCyber') };
const LESSONS_NAME: Record<LessonKind, string> = { arabic: 'Arabic', cyber: 'Cybersecurity' };
const cache: Record<LessonKind, { mod: LessonModule | null; loading: Promise<LessonModule> | null }> = { arabic: { mod: null, loading: null }, cyber: { mod: null, loading: null } };
function useLessons(kind: LessonKind, need: boolean): [Lessons, () => void] {
  const c = cache[kind];
  const [mod, setMod] = useState<LessonModule | null>(c.mod);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!need || mod || failed) return;
    let live = true;
    (c.loading ??= LOAD[kind]()).then(m => { c.mod = m; if (live) setMod(m); })
      .catch(() => { c.loading = null; if (live) setFailed(true); });
    return () => { live = false; };
  }, [kind, c, need, mod, failed]);
  return [mod ?? (failed ? 'failed' : null), () => setFailed(false)];
}

export function LearningCard({ data, p }: { data: MyDayData; p: Project }) {
  const links = p.studyLinks ?? [];
  const [adding, setAdding] = useState(false), [kind, setKind] = useState<LinkKind>('course');
  const need = (k: LessonKind) => links.some(l => l.kind === k) || (adding && kind === k);
  const [arabic, retryArabic] = useLessons('arabic', need('arabic')), [cyber, retryCyber] = useLessons('cyber', need('cyber'));
  const lessons: Record<LessonKind, Lessons> = { arabic, cyber }, retry: Record<LessonKind, () => void> = { arabic: retryArabic, cyber: retryCyber };
  const ix = useMemo(() => stIndex(data.study), [data.study]);
  const info = (k: LessonKind, id: string): LessonInfo => { const m = lessons[k]; return m === 'failed' ? 'failed' : m ? m.lesson(data, id) : undefined; };
  const views = links.map(l => linkView(data, l, ix, isLessonKind(l.kind) ? info(l.kind, l.id) : undefined));
  return (
    <Card aria-labelledby="projectLearnH" id="projectLearning">
      <h3 id="projectLearnH">Learning</h3>
      {views.length > 0 && <ul className="list-none p-0 m-0">{views.map(v => <LinkRow key={`${v.link.kind}:${v.link.id}`} p={p} v={v} />)}</ul>}
      {views.length === 0 && !adding && <Note className="mt-0">Link a course, book or lesson you’re learning for this project.</Note>}
      {adding ? <LinkForm data={data} p={p} kind={kind} onKind={setKind} lessons={lessons} retry={retry} onDone={() => { setAdding(false); focusSoon('learningAdd'); }} />
        : links.length < LINK_LIMITS.links ? <Button inline id="learningAdd" className={views.length ? 'mt-3' : ''} data-action="learning-add" onClick={() => { setAdding(true); retryArabic(); retryCyber(); focusSoon(`learningKind-${kind}`); }}>Link something</Button>
        : <Note className="mb-0 mt-3">{LINK_LIMITS.links} links is the most a project can have.</Note>}
    </Card>
  );
}

function LinkRow({ p, v }: { p: Project; v: LinkView }) {
  const [why, setWhy] = useState<string | null>(null); // the why being edited, or null
  const { link: l } = v, id = `learningWhy-${l.kind}-${l.id}`, editId = `learningEdit-${l.kind}-${l.id}`;
  const stop = () => { setWhy(null); focusSoon(editId); };
  const text = <>
    <span className="block text-sm text-fg-3">{v.label}</span>
    <span className="block font-medium break-words">{v.title}</span>
    {v.status && <span className="block text-sm text-fg-2 break-words" data-s="learning-status">{v.status}</span>}
  </>;
  function save() {
    if (why === null) return;
    if (update(d => (setStudyLinkWhy(d, p.id, l.kind, l.id, why) ? undefined : false))) toast('Saved.');
    stop();
  }
  return (
    <li className="border-t border-outline first:border-t-0 py-2" data-s="learning-link" data-kind={l.kind} data-id={l.id} data-gone={v.gone || undefined}>
      {v.href ? <a href={v.href} className="block min-h-11 py-1 text-fg no-underline hover:bg-surface-2 rounded-tile -mx-2 px-2">{text}</a> : <div className="py-1">{text}</div>}
      {why === null ? (<>
        {l.why && <p className="m-0 mt-1 text-[15px] text-fg-2 break-words" data-s="learning-why">Why: {l.why}</p>}
        <div className="flex flex-wrap gap-x-5">
          {!v.gone && <LinkButton className="text-[15px]" id={editId} data-action="learning-edit" aria-label={`${l.why ? 'Edit' : 'Add'} why “${v.title}” matters`} onClick={() => setWhy(l.why ?? '')}>{l.why ? 'Edit why' : 'Add why'}</LinkButton>}
          <LinkButton className="text-[15px]" data-action="learning-unlink" aria-label={`Unlink “${v.title}” from this project (it stays in Study)`}
            onClick={() => { if (update(d => (removeStudyLink(d, p.id, l.kind, l.id) ? undefined : false))) { toast('Unlinked — it’s still in Study.'); focusSoon('learningAdd'); } }}>Unlink</LinkButton>
        </div>
      </>) : (
        <form className="mt-2" onSubmit={e => { e.preventDefault(); save(); }}>
          <Field label="Why it matters" htmlFor={id}>
            <TextInput id={id} value={why} maxLength={LINK_LIMITS.why} autoFocus onChange={e => setWhy(e.target.value)} onKeyDown={e => { if (e.key === 'Escape' && !e.nativeEvent.isComposing) stop(); }} />
          </Field>
          <div className="flex flex-wrap gap-2.5 -mt-1">
            <Button inline type="submit" variant="primary" data-action="learning-why-save">Save</Button>
            <Button inline variant="ghost" data-action="learning-why-cancel" onClick={stop}>Cancel</Button>
          </div>
        </form>
      )}
    </li>
  );
}

// Choices in order, gathered under their group (an Arabic lesson's module); courses and books have none.
type Pick = { id: string; title: string; group?: string; optional?: boolean };
const option = (c: Pick) => <option key={c.id} value={c.id}>{c.title}{c.optional ? ' (optional)' : ''}</option>;
function groups(list: Pick[]): [string, Pick[]][] {
  const out: [string, Pick[]][] = [];
  for (const c of list) { const g = c.group ?? '', last = out[out.length - 1]; if (last && last[0] === g) last[1].push(c); else out.push([g, [c]]); }
  return out;
}
const NONE_LEFT: Record<LinkKind, string> = {
  course: 'No courses left to link. Add one on your Study roadmap.',
  book: 'No books left to link. Add one in Study → Reading.',
  arabic: 'No Arabic lessons left to link.',
  cyber: 'No Cybersecurity lessons left to link.',
};
function LinkForm({ data, p, kind, onKind, lessons, retry, onDone }: { data: MyDayData; p: Project; kind: LinkKind; onKind: (k: LinkKind) => void; lessons: Record<LessonKind, Lessons>; retry: Record<LessonKind, () => void>; onDone: () => void }) {
  const [id, setId] = useState(''), [why, setWhy] = useState('');
  const linked = (k: string, x: string) => !!p.studyLinks?.some(l => l.kind === k && l.id === x);
  const mod = isLessonKind(kind) ? lessons[kind] : null;
  const choices = kind === 'course' ? courseChoices(data, p) : kind === 'book' ? bookChoices(data, p)
    : mod && mod !== 'failed' ? mod.choices(data).filter(c => !linked(kind, c.id)) : null;
  const picked = choices?.find(c => c.id === id);
  function link() {
    if (!picked) return;
    if (update(d => (addStudyLink(d, p.id, { kind, id: picked.id, title: picked.title }, why) ? undefined : false))) { toast(`Linked “${picked.title}”.`); onDone(); }
  }
  return (
    <form className="mt-3" data-s="learning-form" onSubmit={e => { e.preventDefault(); link(); }}>
      <p className="text-sm font-semibold m-0 mb-1.5">What are you learning for it?</p>
      <Choices label="What are you learning for it?">
        {LINK_KINDS.map(k => <Choice key={k} id={`learningKind-${k}`} on={kind === k} data-s="learning-kind" data-id={k} onClick={() => { onKind(k); setId(''); }}>{LINK_KIND_LABEL[k]}</Choice>)}
      </Choices>
      <div className="grid gap-3 mb-3">
      {choices === null ? (mod === 'failed' && isLessonKind(kind)
        ? <p className="text-[15px] text-fg-2 m-0" data-s="learning-lessons-failed">The {LESSONS_NAME[kind]} lessons couldn’t load just now. <LinkButton className="text-[15px]" data-action="learning-retry" onClick={retry[kind]}>Try again</LinkButton></p>
        : <Note className="m-0">Loading the {LESSONS_NAME[kind as LessonKind]} lessons…</Note>)
        : choices.length ? (
          <Field label="Which one?" htmlFor="learningPick">
            <Select id="learningPick" value={id} onChange={e => setId(e.target.value)}>
              <option value="">Choose…</option>
              {groups(choices).map(([group, list]) => group
                ? <optgroup key={group} label={group}>{list.map(option)}</optgroup>
                : list.map(option))}
            </Select>
          </Field>
        ) : <Note className="m-0">{NONE_LEFT[kind]}</Note>}
      <Field label="Why it matters (optional)" htmlFor="learningWhy">
        <TextInput id="learningWhy" value={why} maxLength={LINK_LIMITS.why} placeholder="e.g. To set up the shop’s Wi-Fi safely" onChange={e => setWhy(e.target.value)} />
      </Field>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button inline type="submit" variant="primary" data-action="learning-link" disabled={!picked}>Link</Button>
        <Button inline variant="ghost" data-action="learning-cancel" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}
