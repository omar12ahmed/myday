import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, Select, TextInput } from '../components/Field';
import { Choice, Choices, LinkButton, Note } from '../components/parts';
import { update } from '../data/storage';
import { stIndex } from '../data/study/roadmap';
import { addStudyLink, bookChoices, courseChoices, LINK_KIND_LABEL, LINK_KINDS, LINK_LIMITS, linkView, removeStudyLink, setStudyLinkWhy, type ArabicInfo, type LinkKind, type LinkView } from '../data/studyLinks';
import { toast } from '../data/toast';
import type { MyDayData, Project } from '../data/types';

// "Learning" (specs/projects-study-links.md): what you're learning for this project in Study — your courses, books and
// Arabic lessons — with Study's own status and why it matters. Unlinking never changes Study.

const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());

// The Arabic catalogue loads on demand, only when a project has an Arabic lesson or you choose to link one. Once
// loaded it's kept; if it can't load, the card says so and tries again next time it's needed.
type ArabicModule = typeof import('./learningArabic');
let arabicLoaded: ArabicModule | null = null;
let arabicLoading: Promise<ArabicModule> | null = null;
function useArabic(need: boolean): ArabicModule | null | 'failed' {
  const [mod, setMod] = useState<ArabicModule | null>(arabicLoaded);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!need || mod) return;
    let live = true;
    (arabicLoading ??= import('./learningArabic')).then(m => { arabicLoaded = m; if (live) setMod(m); })
      .catch(() => { arabicLoading = null; if (live) setFailed(true); });
    return () => { live = false; };
  }, [need, mod]);
  return mod ?? (failed ? 'failed' : null);
}

export function LearningCard({ data, p }: { data: MyDayData; p: Project }) {
  const links = p.studyLinks ?? [];
  const [adding, setAdding] = useState(false), [kind, setKind] = useState<LinkKind>('course');
  const ar = useArabic(links.some(l => l.kind === 'arabic') || (adding && kind === 'arabic'));
  const ix = useMemo(() => stIndex(data.study), [data.study]);
  const arabic = (id: string): ArabicInfo => (ar === 'failed' ? 'failed' : ar ? ar.arabicLesson(data, id) : undefined);
  const views = links.map(l => linkView(data, l, ix, l.kind === 'arabic' ? arabic(l.id) : undefined));
  return (
    <Card aria-labelledby="projectLearnH" id="projectLearning">
      <h3 id="projectLearnH">Learning</h3>
      {views.length > 0 && <ul className="list-none p-0 m-0">{views.map(v => <LinkRow key={`${v.link.kind}:${v.link.id}`} p={p} v={v} />)}</ul>}
      {views.length === 0 && !adding && <Note className="mt-0">Link a course, book or Arabic lesson you’re learning for this project.</Note>}
      {adding ? <LinkForm data={data} p={p} kind={kind} onKind={setKind} ar={ar} onDone={() => { setAdding(false); focusSoon('learningAdd'); }} />
        : links.length < LINK_LIMITS.links ? <Button inline id="learningAdd" className={views.length ? 'mt-3' : ''} data-action="learning-add" aria-expanded={false} onClick={() => { setAdding(true); focusSoon(`learningKind-${kind}`); }}>Link something</Button>
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
          <LinkButton className="text-[15px]" id={editId} data-action="learning-edit" aria-label={`${l.why ? 'Edit' : 'Add'} why “${v.title}” matters`} onClick={() => setWhy(l.why ?? '')}>{l.why ? 'Edit why' : 'Add why'}</LinkButton>
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

const NONE_LEFT: Record<LinkKind, string> = {
  course: 'No courses left to link. Add one on your Study roadmap.',
  book: 'No books left to link. Add one in Study → Reading.',
  arabic: 'No Arabic lessons left to link.',
};
function LinkForm({ data, p, kind, onKind, ar, onDone }: { data: MyDayData; p: Project; kind: LinkKind; onKind: (k: LinkKind) => void; ar: ArabicModule | null | 'failed'; onDone: () => void }) {
  const [id, setId] = useState(''), [why, setWhy] = useState('');
  const linked = (k: string, x: string) => !!p.studyLinks?.some(l => l.kind === k && l.id === x);
  const choices = kind === 'course' ? courseChoices(data, p) : kind === 'book' ? bookChoices(data, p)
    : ar && ar !== 'failed' ? ar.arabicChoices(data).filter(c => !linked('arabic', c.id)) : null;
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
      {choices === null ? <Note className="mt-0">{ar === 'failed' ? 'The Arabic lessons couldn’t load just now. Try again later.' : 'Loading the Arabic lessons…'}</Note>
        : choices.length ? (
          <Field label="Which one?" htmlFor="learningPick">
            <Select id="learningPick" value={id} onChange={e => setId(e.target.value)}>
              <option value="">Choose…</option>
              {choices.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
          </Field>
        ) : <Note className="mt-0">{NONE_LEFT[kind]}</Note>}
      <Field label="Why it matters (optional)" htmlFor="learningWhy">
        <TextInput id="learningWhy" value={why} maxLength={LINK_LIMITS.why} placeholder="e.g. To set up the shop’s Wi-Fi safely" onChange={e => setWhy(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2.5 -mt-1">
        <Button inline type="submit" variant="primary" data-action="learning-link" disabled={!picked}>Link</Button>
        <Button inline variant="ghost" data-action="learning-cancel" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}
