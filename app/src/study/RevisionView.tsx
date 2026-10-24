import { lazy, Suspense, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { TextArea } from '../components/Field';
import { cardOf, cardRef } from '../data/arabic/cards';
import { cyberCardOf, lessonOfCheck } from '../data/cybersecurity/cards';
import { lessonHref } from '../data/cybersecurity/types';
import { shortDate, todayKey } from '../data/dates';
import { update } from '../data/storage';
import { obsidianUrl, OUTCOME, RATING, ROUND_SIZE, safeUrl, SUPPORT } from '../data/study/common';
import { dueIds, nextDueDate, type Scope } from '../data/study/queue';
import { conceptEvidence, DAILY_ENOUGH, nextGap, questionReady, rateConcept, repeatedWrongChoice, reviewedOn, type Answered } from '../data/study/revision';
import type { Concept, DateKey, MyDayData, Outcome, Rating, StudyData, Support } from '../data/types';
import { startRevision } from './actions';
import { AnotherWay } from './AnotherWay';
import { aiReach } from '../ai/reach';
import type { ExplainContext } from '../../../supabase/functions/_shared/ai/explain-shape.ts';
import { BackLink, Choice, Choices, Eyebrow, InlineLink, LinkButton, Note, NoteLink, Summary, TextLink } from './parts';
import { changeRound, nextQuestion, setTyped, useRound, type Round } from './round';

// A course's cards load their questions only when a round reaches one.
const ArabicQuestion = lazy(() => import('./arabic/ArabicQuestion'));
const CyberQuestion = lazy(() => import('./cybersecurity/CyberQuestion'));
// Where a round of one course's cards belongs.
const SCOPES: Record<Scope, { to: string; label: string; title: string }> = {
  all: { to: 'study', label: 'Study', title: 'Revision' },
  arabic: { to: 'study/arabic', label: 'Arabic', title: 'Arabic revision' },
  cybersecurity: { to: 'study/cybersecurity', label: 'Cybersecurity', title: 'Cybersecurity revision' },
};

// What a revision question shows. Your concepts and Arabic cards both become one of these, so they're asked,
// answered and scheduled the same way.
export interface Asked {
  id: string;
  kind: Concept['kind'];
  title: string;                 // its name in your history and in the round's summary (may hold the answer)
  path?: string;                 // the small line above the question, when the title would give the answer away
  prompt: ReactNode;
  choices: string[]; correct: number | null;
  hint: string;
  answer: ReactNode; answerLabel: string;                 // written questions: shown after "Show the answer"
  explanation: ReactNode | null; explanationLabel: string;
  after?: ReactNode;             // below the answer: its source, your notes, its lesson
  notesUrl: string;              // "Check my notes in Obsidian" ('' = none)
  notYet?: ReactNode;            // what to do when it hasn't clicked yet (otherwise: ideas at the end of the round)
  arabic?: boolean;              // your typed answer may be Arabic (typed right to left when it is)
  interval: number;              // the last gap in its schedule, for the Again / Hard / Good labels
  // "Explain it another way" (AnotherWay.tsx): the question in plain words for the AI (your answer is added on the tap).
  explain?: Pick<ExplainContext, 'subject' | 'lessonId' | 'question' | 'answer' | 'explanation'>;
  save(d: MyDayData, k: DateKey, a: Answered, rating: Rating): boolean;
}

function conceptAsked(st: StudyData, c: Concept, explainable = true): Asked {
  return {
    id: c.id, kind: c.kind, title: c.title, prompt: c.prompt, choices: c.choices, correct: c.correct, hint: c.hint,
    answer: c.answer || '—', answerLabel: 'Answer', explanation: c.explanation || null, explanationLabel: 'Explanation',
    after: <>
      {c.source && <Note>Source: {safeUrl(c.source) ? <InlineLink href={c.source} target="_blank" rel="noopener">{c.source}</InlineLink> : c.source}</Note>}
      {c.origin?.subject === 'cybersecurity' && c.origin.lessonId && <Note><InlineLink href={lessonHref(c.origin.lessonId)}>Open the lesson</InlineLink></Note>}
      <NoteLink study={st} path={c.note} />
    </>,
    notesUrl: obsidianUrl(st, c.note), interval: c.review.interval,
    // An AI-written card from a Cybersecurity lesson is explained as Cybersecurity (with its lesson); others as your own.
    // Not for a card made from a note that is now private, or in a private project (ai/reach.ts).
    explain: !explainable ? undefined : { ...(c.origin?.subject === 'cybersecurity' && c.origin.lessonId ? { subject: 'cybersecurity', lessonId: c.origin.lessonId } : { subject: 'study' }),
      question: c.prompt, answer: c.kind === 'choice' && c.correct !== null ? c.choices[c.correct] : c.answer, explanation: c.explanation },
    save: (d, k, a, rating) => rateConcept(d.study, c.id, k, a, rating),
  };
}

// In your history and the round's summary: a concept goes to its page; a course's card to where you met it.
function described(data: MyDayData, id: string): { title: string; href: string; concept: boolean } | null {
  const c = data.study.concepts.find(x => x.id === id);
  if (c) return { title: c.title, href: `#study/concept/${c.id}`, concept: true };
  const last = data.study.reviews.filter(r => r.conceptId === id).pop();
  if (cyberCardOf(data, id)) return { title: last?.title || 'Cybersecurity', href: '#study/cybersecurity/' + lessonOfCheck(id), concept: false };
  if (!cardOf(data, id)) return null;
  const ref = cardRef(id);
  return { title: last?.title || 'Arabic', href: ref.kind === 'check' ? '#study/arabic/' + ref.lessonId : '#study/arabic/vocabulary', concept: false };
}
const inRevision = (d: MyDayData, id: string) => d.study.concepts.some(c => c.id === id) || !!cardOf(d, id) || !!cyberCardOf(d, id);
const opening = <Card><p role="status" className="m-0">Opening…</p></Card>;

// Revision: one question at a time. The answer, explanation and hint aren't on the page until you ask
// for them, and nothing is saved until you choose when it should come back (Again / Hard / Good).
export function RevisionView({ data }: { data: MyDayData }) {
  const k = todayKey(), round = useRound();
  const st = data.study;
  // A round belongs to the day it started; tomorrow starts fresh.
  const r = round && round.day === k ? round : null;
  // The next question still in revision (one removed meanwhile is skipped).
  let at = -1;
  if (r) for (let i = r.i; i < r.ids.length; i++) if (inRevision(data, r.ids[i])) { at = i; break; }
  if (!r || at < 0) return <RoundOver data={data} r={r} />;
  const id = r.ids[at], c = st.concepts.find(x => x.id === id), key = id + ':' + at;
  if (c) return <Question key={key} data={data} r={r} at={at} q={conceptAsked(st, c, c.origin?.subject !== 'note' || aiReach(data).fromNote(c.origin.noteId))} />;
  const cyber = cyberCardOf(data, id);
  if (cyber) return <Suspense fallback={opening}><CyberQuestion key={key} data={data} r={r} at={at} card={cyber} /></Suspense>;
  return <Suspense fallback={opening}><ArabicQuestion key={key} data={data} r={r} at={at} card={cardOf(data, id)!} /></Suspense>;
}

function RoundOver({ data, r }: { data: MyDayData; r: Round | null }) {
  const k = todayKey(), st = data.study, scope: Scope = r?.scope ?? 'all';
  const due = dueIds(data, k, scope), nextDate = nextDueDate(data, k, scope), needQ = scope === 'all' ? st.concepts.filter(c => !questionReady(c)).length : 0;
  const done = r && r.results.length ? r.results : null;
  // From this round: answers that weren't right, told apart by whether you'd recalled them on your own before.
  const struggled = (done || []).filter(x => x.outcome === 'wrong' || x.outcome === 'notsure' || x.rating === 'again')
    .map(x => { const d = described(data, x.id); return d && { ...d, id: x.id, own: conceptEvidence(st, x).own }; }).filter((x): x is NonNullable<typeof x> => !!x);
  const notYet = struggled.filter(x => !x.own), slipped = struggled.filter(x => x.own > 0);
  const today = reviewedOn(st, k);
  return (
    <>
      <Card>
        <BackLink to={SCOPES[scope].to} label={SCOPES[scope].label} />
        <h2>{SCOPES[scope].title}</h2>
        <Note className="m-0">Retrieving what you've learned, one question at a time. Rounds of {ROUND_SIZE} — stop whenever you like; nothing piles up.</Note>
      </Card>
      {done && (
        <Card tone="accent" className="next-card">
          <Eyebrow>Round finished</Eyebrow>
          <h2>{done.length} reviewed</h2>
          <p className="text-[15px] m-0">Recalled on your own: {done.filter(x => x.outcome === 'right' && x.support === 'own').length}. Each one is scheduled to come back when it's due.</p>
        </Card>
      )}
      {notYet.length > 0 && (
        <Card data-s="rev-not-yet">
          <h3 className="mt-0">Hasn’t clicked yet</h3>
          <p className="text-[15px]">Repeating {notYet.length === 1 ? 'this one' : 'these'} will help less than learning {notYet.length === 1 ? 'it' : 'them'} a different way. {notYet.every(x => x.concept) ? 'Each page has ideas.' : 'Each link goes back to where you can learn it again.'}</p>
          <ul className="list-none p-0 m-0 grid gap-1.5">{notYet.map(x => <li key={x.id}><InlineLink href={x.href}>{x.title}</InlineLink></li>)}</ul>
        </Card>
      )}
      {slipped.length > 0 && <p className="text-[15px] text-fg-2" data-s="rev-slipped">Slipped: {slipped.map(x => x.title).join(', ')}. You’ve recalled {slipped.length === 1 ? 'it' : 'them'} on your own before, so {slipped.length === 1 ? 'it’s' : 'they’re'} in there. Seeing {slipped.length === 1 ? 'it' : 'them'} again soon will bring {slipped.length === 1 ? 'it' : 'them'} back.</p>}
      <Card>
        {due.length ? (
          <>
            {today >= DAILY_ENOUGH && <p className="text-[15px]" data-s="rev-enough">That’s {today} reviewed today, which is plenty. The rest will keep; carry on only if you want to.</p>}
            <p className="text-[15px]">{due.length > ROUND_SIZE ? `A round of ${ROUND_SIZE} is ready.` : `${due.length} ready to revise.`}</p>
            <Button variant="primary" data-action="s-rev-start" onClick={() => startRevision(scope)}><RotateCcw size={18} aria-hidden="true" /> {done ? 'Do another round' : 'Start revision'}</Button>
          </>
        ) : <p className="text-[15px] m-0">Nothing to revise right now.{nextDate ? ` The next review is on ${shortDate(nextDate)}.` : ''}</p>}
        {needQ > 0 && <Note className="mt-2.5 mb-0">{needQ} concept{needQ === 1 ? ' needs' : 's need'} a revision question before {needQ === 1 ? 'it' : 'they'} can come up. <InlineLink href="#study/concepts">Add questions</InlineLink></Note>}
      </Card>
      <Card>
        <details className="group">
          <Summary>How revision is scheduled</Summary>
          <p className="text-[15px]">First review: <strong>Again</strong> → tomorrow · <strong>Hard</strong> → in 2 days · <strong>Good</strong> → in 4 days.</p>
          <p className="text-[15px]">After that: Again → tomorrow (the gap starts over) · Hard → the last gap × 1.2 · Good → the last gap × 2.5. Gaps always grow by at least a day and stop at 180 days.</p>
          <Note className="m-0">Dates are saved on this device. Concepts never revised come after any that are due. Arabic words and checks, and Cybersecurity checks, that you add first come back the next day.</Note>
        </details>
      </Card>
    </>
  );
}

export function Question({ data, r, q, at }: { data: MyDayData; r: Round; q: Asked; at: number }) {
  const shown = r.phase === 'shown';
  const gapLabel = (rating: Rating) => { const g = nextGap(q.interval, rating); return g === 1 ? 'tomorrow' : `in ${g} days`; };

  // While asking: choose an answer, show it, say "not sure", or take a hint.
  const choose = (i: number) => changeRound(x => { x.chosen = i; x.outcome = i === q.correct ? 'right' : 'wrong'; x.phase = 'shown'; });
  const reveal = (outcome: Outcome | null) => changeRound(x => { if (outcome) x.outcome = outcome; x.phase = 'shown'; });
  const hint = () => changeRound(x => { x.hint = true; x.support = 'hint'; });
  // After the reveal: your own assessment, how you answered, then when it should come back (saved).
  const self = (o: Outcome) => changeRound(x => { x.outcome = o; });
  const support = (v: Support) => changeRound(x => { x.support = v; });
  function rate(rating: Rating) {
    const k = todayKey();
    const saved = update(d => { if (!q.save(d, k, { outcome: r.outcome, chosen: r.chosen, support: r.support }, rating)) return false; });
    if (!saved) return;
    nextQuestion({ id: q.id, outcome: r.outcome, support: r.support, rating }, at);
    window.scrollTo(0, 0);
  }

  return (
    <Card tone="accent" className="next-card st-q" aria-labelledby="q-h">
      <div className="card-head flex justify-between items-center gap-3">
        <Eyebrow>Question {at + 1} of {r.ids.length}</Eyebrow>
        <TextLink href={'#' + SCOPES[r.scope].to}>Stop for now</TextLink>
      </div>
      <p className="st-path text-[13px] text-fg-3 m-0">{q.path ?? q.title}</p>
      <h2 id="q-h" className="st-prompt text-[21px] leading-snug mt-1.5 mb-3.5 whitespace-pre-wrap">{q.prompt}</h2>

      {q.kind === 'choice' ? (
        <div className="grid gap-2.5">
          {q.choices.map((text, i) => {
            if (!text) return null;
            if (!shown) return <button key={i} type="button" className="st-choice block w-full text-left min-h-14 px-4 py-3 rounded-tile bg-surface-2 text-fg border border-outline-strong font-medium cursor-pointer hover:shadow-raised active:scale-[.99] transition-[box-shadow,transform]" data-action="s-rev-choose" data-i={i} onClick={() => choose(i)}>{text}</button>;
            const right = i === q.correct, mine = i === r.chosen;
            return (
              <div key={i} className={`st-choice shown block w-full min-h-14 px-4 py-3 rounded-tile ${right ? 'right border-2 border-primary bg-primary-container text-on-primary-container font-[650]' : `bg-surface-2 text-fg border border-outline-strong font-medium${mine ? ' wrong border-dashed' : ''}`}`}>
                {right ? '✓ ' : mine ? '✗ ' : ''}{text}{mine && <span className="meta text-sm opacity-80 font-normal"> (your choice)</span>}
              </div>
            );
          })}
        </div>
      ) : shown ? (r.typed && <div className="st-yours bg-surface-2 rounded-tile px-3.5 py-2.5 my-2.5"><span className="lbl text-sm text-fg-2">Your answer</span><p dir={q.arabic ? 'auto' : undefined} className={`mt-1 mb-0 whitespace-pre-wrap${q.arabic ? ' ar-input' : ''}`}>{r.typed}</p></div>)
        : (
          <div className="grid gap-1.5">
            <label className="lbl text-sm text-fg-2" htmlFor="revTyped">Your answer (optional — you can just think it)</label>
            <TextArea id="revTyped" rows={3} data-s="rev-typed" defaultValue={r.typed} dir={q.arabic ? 'auto' : undefined} className={q.arabic ? 'ar-input' : ''} onInput={e => setTyped(e.currentTarget.value)} />
          </div>
        )}

      {!shown && q.hint && (r.hint
        ? <p className="st-hint bg-warn-c text-on-warn-c rounded-[10px] px-3 py-2 mt-3 text-[15px]">Hint: {q.hint}</p>
        : <LinkButton data-action="s-rev-hint" className="mt-1" onClick={hint}>Show a hint</LinkButton>)}

      {!shown ? (
        <>
          <div className="grid gap-2.5 mt-3">
            {q.kind === 'written' && <Button variant="primary" data-action="s-rev-show" onClick={() => reveal(null)}>Show the answer</Button>}
            <Button variant="ghost" data-action="s-rev-notsure" onClick={() => reveal('notsure')}>Not sure</Button>
          </div>
          {q.notesUrl && <TextLink href={q.notesUrl} data-rev-notes="1" onClick={() => support('notes')}>Check my notes in Obsidian</TextLink>}
        </>
      ) : (
        <>
          {q.kind === 'choice'
            ? <p className="st-verdict font-[650] mt-3 mb-1">{r.outcome === 'right' ? 'Correct — matches the stored answer.' : r.outcome === 'wrong' ? 'Not this time — the stored answer is marked ✓.' : 'Not sure — the stored answer is marked ✓.'}</p>
            : <div className="st-answer bg-surface-2 rounded-tile px-3.5 py-2.5 my-2.5"><span className="lbl text-sm text-fg-2">{q.answerLabel}</span><p className="mt-1 mb-0 whitespace-pre-wrap">{q.answer}</p></div>}
          {q.explanation && <div className="st-answer bg-surface-2 rounded-tile px-3.5 py-2.5 my-2.5"><span className="lbl text-sm text-fg-2">{q.explanationLabel}</span><p className="mt-1 mb-0 whitespace-pre-wrap">{q.explanation}</p></div>}
          {q.after}
          <AnotherWay data={data} q={q} r={r} />
          {(r.outcome === 'wrong' || r.outcome === 'notsure') && <Struggle data={data} q={q} chosen={r.chosen} />}
          {q.kind === 'written' && r.outcome !== 'notsure' && (
            <>
              <h3 className="mt-4">How did your answer compare?</h3>
              <Choices label="How did your answer compare?">
                {(['right', 'partly', 'wrong'] as const).map(o => <Choice key={o} on={r.outcome === o} data-action="s-rev-self" data-v={o} onClick={() => self(o)}>{OUTCOME[o]}</Choice>)}
              </Choices>
              <Note className="-mt-2">Self-assessed — MyDay doesn't mark written answers.</Note>
            </>
          )}
          <h3 className="mt-4">How did you answer?</h3>
          <Choices label="How did you answer?">
            {(Object.keys(SUPPORT) as Support[]).map(o => <Choice key={o} on={r.support === o} data-action="s-rev-support" data-v={o} onClick={() => support(o)}>{SUPPORT[o]}</Choice>)}
          </Choices>
          <h3>When should it come back?</h3>
          <div className="st-rate grid grid-cols-3 gap-2">
            {(Object.keys(RATING) as Rating[]).map(o => (
              <Button key={o} variant={o === 'good' ? 'primary' : 'tonal'} className="!grid !gap-0.5 !px-1.5 !py-2.5" data-action="s-rev-rate" data-v={o} onClick={() => rate(o)}>
                {RATING[o]}<span className="meta text-xs opacity-85 font-medium">{gapLabel(o)}</span>
              </Button>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

// After an answer that wasn't right: a slip needs nothing more than coming back sooner; something that
// hasn't clicked yet is better learned a different way (ideas are on its page after the round).
function Struggle({ data, q, chosen }: { data: MyDayData; q: Asked; chosen: number | null }) {
  const st = data.study, before = conceptEvidence(st, q).own > 0, repeat = repeatedWrongChoice(st, q);
  const again = repeat && chosen === repeat.choice ? repeat.times + 1 : null;
  return (
    <div className="bg-surface-2 rounded-tile px-3.5 py-2.5 my-2.5 text-[15px]" data-s="rev-struggle" data-v={before ? 'slipped' : 'not-yet'}>
      {before
        ? <>You’ve recalled this on your own before, so it slipped rather than went. <strong>Again</strong> brings it back tomorrow.</>
        : q.notYet ?? <>This one hasn’t clicked yet, which is normal for something new. Read the explanation once more, slowly; at the end of the round you’ll find ideas for learning it a different way.</>}
      {again && <p className="mt-1.5 mb-0">You’ve picked this answer {again} times now. Working out why it seems right is often what makes it click.</p>}
    </div>
  );
}
