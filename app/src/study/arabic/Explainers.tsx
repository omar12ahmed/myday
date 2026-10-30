import { useEffect, useRef, useState } from 'react';
import { askExplainer, takeExplainer, useExplainers, type Explainer } from './explainerData';
import { Ar } from './Ar';
import { MixedVoiceLabel, PlayButton } from './Listen';
import { WordNote } from './WordNote';
import { Root } from './WordFamilies';
import { arabicRuns } from './arabic-runs.mjs';
import { InlineLink } from '../parts';
import { askStep } from '../journey/pending';

// Explainers (specs/arabic-explainers.md): one family of forms at a time, explained in short steps, with the family as
// a table, short sentences broken down word by word, the natural "why" and three questions to test yourself (the data:
// explainerData.ts). They sit in a lesson's Understand step, so they fold away with it while you check yourself, and a
// course word links to the one that explains it. Nothing here is saved.
const anchor = (id: string) => 'ar-explainer-' + id.replaceAll('.', '-');
// Open an explainer on this page and bring it into view; false if it isn't here.
function openHere(id: string) {
  const el = document.getElementById(anchor(id)) as HTMLDetailsElement | null;
  if (!el) return false;
  el.open = true;
  el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  el.querySelector('summary')?.focus({ preventScroll: true });
  return true;
}

// Under a course word: a link to the explainer for it. On its lesson's page it opens there; elsewhere it opens the
// lesson at its Understand step, with the explainer open.
export function ExplainerLink({ found, verb }: { found: { lessonId: string; e: Explainer } | null; verb: boolean }) {
  if (!found) return null;
  const { lessonId, e } = found;
  return <p className="m-0"><InlineLink href={'#study/arabic/' + lessonId} data-ar-explainer-link={e.id} className="inline-flex items-center min-h-11 text-primary font-semibold underline-offset-2 hover:underline"
    onClick={ev => {
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      if (openHere(e.id)) { ev.preventDefault(); return; }
      askStep(lessonId, 'understand');
      askExplainer(e.id);
    }}>{verb ? 'How this verb works' : 'How it works'}, step by step</InlineLink></p>;
}

// A lesson's explainers, in its Understand step. `ready` is when the lesson page has settled (its teaching is here),
// so an explainer a link asked for opens after the page has gone to the step.
export function LessonExplainers({ lessonId, ready }: { lessonId: string; ready: boolean }) {
  const b = useExplainers(), list = b?.[lessonId] ?? [];
  useEffect(() => {
    const id = ready ? takeExplainer((b?.[lessonId] ?? []).map(e => e.id)) : null;
    if (!id) return;
    const timer = setTimeout(() => openHere(id), 400); // after the page's own jump to the step (useJourney)
    return () => clearTimeout(timer);
  }, [ready, b, lessonId]);
  if (!list.length) return null;
  return <section className="mt-5" data-ar-explainers={list.length} aria-labelledby={`ar-explainers-${lessonId}`}>
    <h4 id={`ar-explainers-${lessonId}`} className="mb-1">How it works</h4>
    <p className="text-sm text-fg-2 mt-0 mb-2">Each one takes a family of forms step by step, with three questions to test yourself at the end. Nothing here is saved.</p>
    {list.map(e => <ExplainerCard key={e.id} e={e} />)}
  </section>;
}

const H = ({ children }: { children: string }) => <h5 className="text-[15px] font-semibold mt-5 mb-2">{children}</h5>;
// The voice, where a clip has been listened to (only then does a play button show), for the forms, the sentences and
// the Arabic in the steps (the owner's choice, 30 October 2026). The word-by-word pieces, the "why" and the questions
// stay silent.
function ExplainerCard({ e }: { e: Explainer }) {
  const voice = e.id;
  return <details id={anchor(e.id)} data-ar-explainer={e.id} className="mt-3 rounded-tile border border-outline bg-surface px-4 py-2 scroll-mt-20">
    <summary className="cursor-pointer min-h-11 py-2 font-semibold text-primary"><WordNote text={e.title_en} /></summary>
    <p className="text-sm text-fg-2 mt-1 mb-0">{e.family_en}{e.root_ar && <>. Root: <Root f={{ root_ar: e.root_ar, root_reading: e.root_reading ?? '' }} /></>}</p>

    <H>The family</H>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse" data-ar-explainer-table="">
        <thead><tr className="border-b border-outline text-sm text-fg-2">
          <th scope="col" className="py-2 pr-3 font-semibold hidden sm:table-cell">Form</th>
          <th scope="col" className="py-2 pr-3 font-semibold">Arabic</th>
          <th scope="col" className="py-2 font-semibold">Meaning</th>
        </tr></thead>
        <tbody>{e.table.map((r, i) => <tr key={i} className="border-b border-outline align-top" data-ar-explainer-row={r.ar}>
          <td className="py-2 pr-3 text-sm text-fg-2 hidden sm:table-cell">{r.form_en}</td>
          <td className="py-2 pr-3"><div className="flex items-start gap-2"><div className="min-w-0"><Ar block className="text-[22px] m-0">{r.ar}</Ar></div>
            <PlayButton text={r.ar} name={`${voice}:form:${i}`} label={r.ar} /></div></td>
          <td className="py-2 text-[15px]">{r.en}<span className="block text-sm text-fg-2 sm:hidden">{r.form_en}</span></td>
        </tr>)}</tbody>
      </table>
    </div>

    <H>Step by step</H>
    <ol className="list-decimal pl-5 grid gap-2 m-0">{e.steps.map((s, i) => <li key={i} className="leading-relaxed" data-ar-explainer-step={i}><WordNote text={s} voice={`${voice}:step:${i}`} /></li>)}</ol>

    <H>In sentences</H>
    <div className="grid gap-3">{e.examples.map((x, i) => <div key={i} className="rounded-tile bg-surface-2 px-4 py-3" data-ar-explainer-sentence={i}>
      <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><Ar block className="text-[24px] m-0">{x.ar}</Ar></div>
        <PlayButton text={x.ar} name={`${voice}:sentence:${i}`} label={x.ar} /></div>
      <p className="text-[15px] mt-1 mb-2">{x.en}</p>
      <p className="text-sm text-fg-2 m-0">Word by word:</p>
      <ul className="list-none p-0 m-0 grid gap-1">{x.words.map((w, j) => <li key={j} className="text-[15px]"><Ar className="text-[20px]">{w.ar}</Ar> <span className="text-fg-2">{w.en}</span></li>)}</ul>
    </div>)}</div>

    <H>Why?</H>
    <p className="font-semibold mb-1"><WordNote text={e.why.q_en} /></p>
    <p className="leading-relaxed mt-0"><WordNote text={e.why.a_en} /></p>

    <H>Test yourself</H>
    <ol className="list-none p-0 m-0 grid gap-4">{e.selftest.map((q, i) => <SelfTest key={i} q={q} n={i + 1} />)}</ol>
    <MixedVoiceLabel texts={[...e.table.map(r => r.ar), ...e.examples.map(x => x.ar), ...e.steps]} />
  </details>;
}

// One question: tap a choice and its answer shows, with why (focus moves there, as the choices stop being buttons).
// Kept only while the page is open.
const onePiece = (s: string) => { const r = arabicRuns(s); return r.length === 1 && s.replace(r[0].text, '').replace(/[.!?]/g, '').trim() === ''; };
function Choice({ text }: { text: string }) {
  return onePiece(text) ? <Ar className="text-[22px]">{text}</Ar> : <WordNote text={text} />;
}
function SelfTest({ q, n }: { q: Explainer['selftest'][number]; n: number }) {
  const [chosen, setChosen] = useState<string | null>(null);
  const why = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (chosen !== null) why.current?.focus(); }, [chosen]);
  const right = chosen === q.answer;
  return <li data-ar-explainer-q={n} data-state={chosen === null ? 'open' : right ? 'right' : 'wrong'}>
    <p className="mt-0 mb-2"><span className="font-semibold">{n}. </span><WordNote text={q.q_en} /></p>
    <div className="grid gap-2">{q.choices.map(c => {
      if (chosen === null) return <button key={c} type="button" data-action="ar-explainer-choose" onClick={() => setChosen(c)}
        className="block w-full text-left min-h-11 px-4 py-2 rounded-tile bg-surface-2 text-fg border border-outline-strong font-medium cursor-pointer hover:shadow-raised active:scale-[.99] transition-[box-shadow,transform]"><Choice text={c} /></button>;
      const isRight = c === q.answer, mine = c === chosen;
      return <div key={c} data-ar-explainer-choice={isRight ? 'right' : mine ? 'wrong' : 'other'}
        className={`block w-full min-h-11 px-4 py-2 rounded-tile ${isRight ? 'border-2 border-primary bg-primary-container text-on-primary-container font-[650]' : `bg-surface-2 text-fg border border-outline-strong font-medium${mine ? ' border-dashed' : ''}`}`}>
        {isRight ? '✓ ' : mine ? '✗ ' : ''}<Choice text={c} />{mine && <span className="text-sm opacity-80 font-normal"> (your choice)</span>}
      </div>;
    })}</div>
    {chosen !== null && <p ref={why} tabIndex={-1} className="text-[15px] mt-2 mb-0 focus:outline-2 focus:outline-primary focus:outline-offset-4 rounded-sm" data-ar-explainer-why="">
      <span className="font-semibold">{right ? 'Right. ' : 'Not quite. '}</span><WordNote text={q.why_en} /></p>}
  </li>;
}
