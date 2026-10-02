import { RotateCcw } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { TextArea } from '../components/Field';
import { shortDate, todayKey } from '../data/dates';
import { update } from '../data/storage';
import { obsidianUrl, OUTCOME, RATING, ROUND_SIZE, safeUrl, SUPPORT } from '../data/study/common';
import { dueConcepts, nextGap, nextReviewDate, questionReady, rateConcept } from '../data/study/revision';
import type { Concept, MyDayData, Outcome, Rating, Support } from '../data/types';
import { startRevision } from './actions';
import { BackLink, Choice, Choices, Eyebrow, InlineLink, LinkButton, Note, NoteLink, Summary, TextLink } from './parts';
import { changeRound, nextQuestion, setTyped, useRound, type Round } from './round';

// Revision: one question at a time. The answer, explanation and hint aren't on the page until you ask
// for them, and nothing is saved until you choose when it should come back (Again / Hard / Good).
export function RevisionView({ data }: { data: MyDayData }) {
  const k = todayKey(), round = useRound();
  const st = data.study;
  // A round belongs to the day it started; tomorrow starts fresh.
  const r = round && round.day === k ? round : null;
  // The next question still in your concepts (one removed meanwhile is skipped).
  let at = -1, c: Concept | undefined;
  if (r) for (let i = r.i; i < r.ids.length; i++) { c = st.concepts.find(x => x.id === r.ids[i]); if (c) { at = i; break; } }
  if (!r || !c) return <RoundOver data={data} r={r} />;
  return <Question key={r.ids[at] + ':' + at} data={data} r={r} c={c} at={at} />;
}

function RoundOver({ data, r }: { data: MyDayData; r: Round | null }) {
  const k = todayKey(), st = data.study;
  const due = dueConcepts(st, k), nextDate = nextReviewDate(st, k), needQ = st.concepts.filter(c => !questionReady(c)).length;
  const done = r && r.results.length ? r.results : null;
  return (
    <>
      <Card>
        <BackLink to="study" label="Study" />
        <h2>Revision</h2>
        <Note className="m-0">Retrieving what you've learned, one question at a time. Rounds of {ROUND_SIZE} — stop whenever you like; nothing piles up.</Note>
      </Card>
      {done && (
        <Card tone="accent" className="next-card">
          <Eyebrow>Round finished</Eyebrow>
          <h2>{done.length} reviewed</h2>
          <p className="text-[15px] m-0">Recalled on your own: {done.filter(x => x.outcome === 'right' && x.support === 'own').length}. Each one is scheduled to come back when it's due.</p>
        </Card>
      )}
      <Card>
        {due.length ? (
          <>
            <p className="text-[15px]">{due.length > ROUND_SIZE ? `A round of ${ROUND_SIZE} is ready.` : `${due.length} ready to revise.`}</p>
            <Button variant="primary" data-action="s-rev-start" onClick={startRevision}><RotateCcw size={18} aria-hidden="true" /> {done ? 'Do another round' : 'Start revision'}</Button>
          </>
        ) : <p className="text-[15px] m-0">Nothing to revise right now.{nextDate ? ` The next review is on ${shortDate(nextDate)}.` : ''}</p>}
        {needQ > 0 && <Note className="mt-2.5 mb-0">{needQ} concept{needQ === 1 ? ' needs' : 's need'} a revision question before {needQ === 1 ? 'it' : 'they'} can come up. <InlineLink href="#study/concepts">Add questions</InlineLink></Note>}
      </Card>
      <Card>
        <details className="group">
          <Summary>How revision is scheduled</Summary>
          <p className="text-[15px]">First review: <strong>Again</strong> → tomorrow · <strong>Hard</strong> → in 2 days · <strong>Good</strong> → in 4 days.</p>
          <p className="text-[15px]">After that: Again → tomorrow (the gap starts over) · Hard → the last gap × 1.2 · Good → the last gap × 2.5. Gaps always grow by at least a day and stop at 180 days.</p>
          <Note className="m-0">Dates are saved on this device. Concepts never revised come after any that are due.</Note>
        </details>
      </Card>
    </>
  );
}

function Question({ data, r, c, at }: { data: MyDayData; r: Round; c: Concept; at: number }) {
  const st = data.study, shown = r.phase === 'shown', notes = obsidianUrl(st, c.note);
  const gapLabel = (rating: Rating) => { const g = nextGap(c.review.interval, rating); return g === 1 ? 'tomorrow' : `in ${g} days`; };

  // While asking: choose an answer, show it, say "not sure", or take a hint.
  const choose = (i: number) => changeRound(x => { x.chosen = i; x.outcome = i === c.correct ? 'right' : 'wrong'; x.phase = 'shown'; });
  const reveal = (outcome: Outcome | null) => changeRound(x => { if (outcome) x.outcome = outcome; x.phase = 'shown'; });
  const hint = () => changeRound(x => { x.hint = true; x.support = 'hint'; });
  // After the reveal: your own assessment, how you answered, then when it should come back (saved).
  const self = (o: Outcome) => changeRound(x => { x.outcome = o; });
  const support = (v: Support) => changeRound(x => { x.support = v; });
  function rate(rating: Rating) {
    const k = todayKey();
    const saved = update(d => { if (!rateConcept(d.study, c.id, k, { outcome: r.outcome, chosen: r.chosen, support: r.support }, rating)) return false; });
    if (!saved) return;
    nextQuestion({ id: c.id, outcome: r.outcome, support: r.support, rating }, at);
    window.scrollTo(0, 0);
  }

  return (
    <Card tone="accent" className="next-card st-q" aria-labelledby="q-h">
      <div className="card-head flex justify-between items-center gap-3">
        <Eyebrow>Question {at + 1} of {r.ids.length}</Eyebrow>
        <TextLink href="#study">Stop for now</TextLink>
      </div>
      <p className="st-path text-[13px] text-fg-3 m-0">{c.title}</p>
      <h2 id="q-h" className="st-prompt text-[21px] leading-snug mt-1.5 mb-3.5 whitespace-pre-wrap">{c.prompt}</h2>

      {c.kind === 'choice' ? (
        <div className="grid gap-2.5">
          {c.choices.map((text, i) => {
            if (!text) return null;
            if (!shown) return <button key={i} type="button" className="st-choice block w-full text-left min-h-14 px-4 py-3 rounded-tile bg-surface-2 text-fg border border-outline-strong font-medium cursor-pointer hover:shadow-raised active:scale-[.99] transition-[box-shadow,transform]" data-action="s-rev-choose" data-i={i} onClick={() => choose(i)}>{text}</button>;
            const right = i === c.correct, mine = i === r.chosen;
            return (
              <div key={i} className={`st-choice shown block w-full min-h-14 px-4 py-3 rounded-tile ${right ? 'right border-2 border-primary bg-primary-container text-on-primary-container font-[650]' : `bg-surface-2 text-fg border border-outline-strong font-medium${mine ? ' wrong border-dashed' : ''}`}`}>
                {right ? '✓ ' : mine ? '✗ ' : ''}{text}{mine && <span className="meta text-sm opacity-80 font-normal"> (your choice)</span>}
              </div>
            );
          })}
        </div>
      ) : shown ? (r.typed && <div className="st-yours bg-surface-2 rounded-tile px-3.5 py-2.5 my-2.5"><span className="lbl text-sm text-fg-2">Your answer</span><p className="mt-1 mb-0 whitespace-pre-wrap">{r.typed}</p></div>)
        : (
          <div className="grid gap-1.5">
            <label className="lbl text-sm text-fg-2" htmlFor="revTyped">Your answer (optional — you can just think it)</label>
            <TextArea id="revTyped" rows={3} data-s="rev-typed" defaultValue={r.typed} onInput={e => setTyped(e.currentTarget.value)} />
          </div>
        )}

      {!shown && c.hint && (r.hint
        ? <p className="st-hint bg-warn-c text-on-warn-c rounded-[10px] px-3 py-2 mt-3 text-[15px]">Hint: {c.hint}</p>
        : <LinkButton data-action="s-rev-hint" className="mt-1" onClick={hint}>Show a hint</LinkButton>)}

      {!shown ? (
        <>
          <div className="grid gap-2.5 mt-3">
            {c.kind === 'written' && <Button variant="primary" data-action="s-rev-show" onClick={() => reveal(null)}>Show the answer</Button>}
            <Button variant="ghost" data-action="s-rev-notsure" onClick={() => reveal('notsure')}>Not sure</Button>
          </div>
          {notes && <TextLink href={notes} data-rev-notes="1" onClick={() => support('notes')}>Check my notes in Obsidian</TextLink>}
        </>
      ) : (
        <>
          {c.kind === 'choice'
            ? <p className="st-verdict font-[650] mt-3 mb-1">{r.outcome === 'right' ? 'Correct — matches the stored answer.' : r.outcome === 'wrong' ? 'Not this time — the stored answer is marked ✓.' : 'Not sure — the stored answer is marked ✓.'}</p>
            : <div className="st-answer bg-surface-2 rounded-tile px-3.5 py-2.5 my-2.5"><span className="lbl text-sm text-fg-2">Answer</span><p className="mt-1 mb-0 whitespace-pre-wrap">{c.answer || '—'}</p></div>}
          {c.explanation && <div className="st-answer bg-surface-2 rounded-tile px-3.5 py-2.5 my-2.5"><span className="lbl text-sm text-fg-2">Explanation</span><p className="mt-1 mb-0 whitespace-pre-wrap">{c.explanation}</p></div>}
          {c.source && <Note>Source: {safeUrl(c.source) ? <InlineLink href={c.source} target="_blank" rel="noopener">{c.source}</InlineLink> : c.source}</Note>}
          <NoteLink study={st} path={c.note} />
          {c.kind === 'written' && r.outcome !== 'notsure' && (
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
