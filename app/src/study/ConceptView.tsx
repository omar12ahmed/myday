import { X } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, CommitTextarea, Field, Select } from '../components/Field';
import { shortDate } from '../data/dates';
import { CLARITY, OUTCOME, RATING, STATUS_TEXT, SUPPORT } from '../data/study/common';
import { conceptEvidence, evidenceText, questionReady, repeatedWrongChoice, slips, understanding, UNDERSTANDING } from '../data/study/revision';
import { stIndex } from '../data/study/roadmap';
import type { Concept, MyDayData, Review } from '../data/types';
import { linkConcept, removeConcept, saveChoice, saveConceptText, saveConceptTitle, setConceptKind, setCorrect, unlinkConcept, type ConceptText } from './actions';
import { focusIfWaiting } from './focus';
import { BackLink, Chip, Meta, Note, NoteLink, Row, Summary } from './parts';

// One concept: its revision question and answer (written by you — MyDay never fills these in), the
// tasks it belongs to, and its history.
export function ConceptView({ data, id }: { data: MyDayData; id: string }) {
  const confirm = useConfirm();
  const linkRef = useRef<HTMLSelectElement>(null);
  const st = data.study, c = st.concepts.find(x => x.id === id);
  if (!c) return <Card><h2>Concept not found</h2><BackLink to="study/concepts" label="Back to concepts" /></Card>;
  const ix = stIndex(st), ev = conceptEvidence(st, c), ready = questionReady(c);
  const linked = c.taskIds.map(t => ix.task.get(t)).filter(x => !!x), others = [...ix.task.values()].filter(e => !c.taskIds.includes(e.node.id));
  const checks = st.sessions.filter(s => s.checkin && s.checkin.conceptIds.includes(c.id));
  const state = understanding(st, c), wrongChoice = repeatedWrongChoice(st, c), slipped = slips(st, c);

  // A text field saved when you leave it; `rows` makes it a larger box.
  const field = (key: ConceptText, label: string, rows = 0, placeholder?: string) => (
    <Field label={label} htmlFor={`cp-${key}`}>
      {rows
        ? <CommitTextarea key={c[key]} id={`cp-${key}`} rows={rows} data-s={`cp-${key}`} data-id={c.id} defaultValue={c[key]} placeholder={placeholder} onCommit={el => saveConceptText(c.id, key, el.value)} />
        : <CommitInput key={c[key]} id={`cp-${key}`} type="text" maxLength={400} data-s={`cp-${key}`} data-id={c.id} defaultValue={c[key]} placeholder={placeholder} onCommit={el => saveConceptText(c.id, key, el.value)} />}
    </Field>
  );
  async function del(x: Concept) {
    if (await confirm({ title: `Remove “${x.title}”?`, body: 'Its past reviews stay in your study history.', confirmLabel: 'Remove', cancelLabel: 'Keep it' })) removeConcept(x.id);
  }

  return (
    <>
      <Card aria-labelledby="cp-h">
        <BackLink to="study/concepts" label="Concepts" />
        <h2 id="cp-h">{c.title}</h2>
        <p className="text-[15px]"><Chip>{STATUS_TEXT[ev.status]}</Chip> {evidenceText(ev)}</p>
        {!ready && <p className="stale text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3.5 py-2.5">Needs a revision question: add a question, plus an answer or explanation (or the choices for multiple choice). MyDay won't write these for you.</p>}
        <div className="grid gap-3.5">
          <Field label="Name" htmlFor="cp-title">
            <CommitInput key={c.title} id="cp-title" type="text" maxLength={120} data-s="cp-title" data-id={c.id} defaultValue={c.title}
              ref={focusIfWaiting(c.id)}
              onCommit={el => saveConceptTitle(c.id, el)} />
          </Field>
          <Field label="Question type" htmlFor="cp-kind">
            <Select id="cp-kind" data-s="cp-kind" data-id={c.id} value={c.kind} onChange={e => setConceptKind(c.id, e.target.value)}>
              <option value="written">Written answer (you check it yourself)</option>
              <option value="choice">Multiple choice (checked against the answer you mark)</option>
            </Select>
          </Field>
          {field('prompt', 'Revision question', 2)}
          {c.kind === 'written' ? field('answer', 'Answer', 3) : (
            <fieldset className="st-choices border-0 p-0 m-0 min-w-0">
              <legend className="lbl text-sm text-fg-2 mb-0.5">Choices — mark the correct one</legend>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="st-choice-edit flex items-center gap-2.5 mt-2">
                  <input type="radio" name="cpCorrect" data-s="cp-correct" data-id={c.id} value={i} className="size-6 accent-primary flex-none" checked={c.correct === i}
                    aria-label={`Choice ${i + 1} is correct`} onChange={() => setCorrect(c.id, i)} />
                  <CommitInput key={c.choices[i] || ''} type="text" maxLength={200} data-s="cp-choice" data-i={i} data-id={c.id} defaultValue={c.choices[i] || ''}
                    aria-label={`Choice ${i + 1}`} className="flex-1 min-w-0" onCommit={el => saveChoice(c.id, i, el.value)} />
                </div>
              ))}
            </fieldset>
          )}
          {field('explanation', 'Explanation', 3)}
        </div>
        <details open={!!(c.hint || c.source || c.note) || undefined} className="group mt-3">
          <Summary>Hint, source and notes</Summary>
          <div className="grid gap-3.5 mt-1">
            {field('hint', 'Hint (optional)')}
            {field('source', 'Source (optional — a link or a book/course name)')}
            {field('note', 'Obsidian note (path in your vault)', 0, 'e.g. Networking/DNS')}
          </div>
          <NoteLink study={st} path={c.note} />
        </details>
      </Card>
      <Card aria-labelledby="cpl-h">
        <h3 id="cpl-h">Linked learning tasks</h3>
        {linked.length ? linked.map(e => (
          <Row key={e.node.id}>
            <div className="min-w-0">{e.node.title}<div><Meta>{e.course.title}</Meta></div></div>
            <Button inline variant="ghost" className="!px-0 !w-11 flex-none" data-action="s-cp-unlink" data-id={c.id} data-task={e.node.id} aria-label={`Unlink ${e.node.title}`} onClick={() => unlinkConcept(c.id, e.node.id)}><X size={18} aria-hidden="true" /></Button>
          </Row>
        )) : <Note className="m-0">Not linked to a task.</Note>}
        {others.length > 0 && (
          <div className="inline-add flex gap-2 items-center mt-2.5">
            <Select ref={linkRef} id="cpLink" aria-label="Task to link" className="flex-1 min-w-0">
              {others.map(e => <option key={e.node.id} value={e.node.id}>{`${e.course.title} › ${e.node.title}`}</option>)}
            </Select>
            <Button inline className="flex-none" data-action="s-cp-link" data-id={c.id} onClick={() => linkRef.current && linkConcept(c.id, linkRef.current.value)}>Link</Button>
          </div>
        )}
      </Card>
      <Card aria-labelledby="cph-h">
        <h3 id="cph-h">Learning record</h3>
        <p className="text-[15px]" data-s="cp-understanding" data-v={state}><strong>{UNDERSTANDING[state].label}.</strong> {UNDERSTANDING[state].text}</p>
        {state === 'not-yet' && (
          <div className="bg-surface-2 rounded-tile px-3.5 py-3 mb-3" data-s="cp-another-way">
            <p className="text-[15px] font-[650] m-0">Try it a different way</p>
            <ul className="list-disc text-[15px] mt-1.5 mb-0 pl-5 grid gap-1">
              {(c.source || linked.length > 0) && <li>Go back to {c.source ? 'the source' : 'the lesson'} and look for the step that didn’t make sense.</li>}
              <li>Rewrite the explanation above in your own words, as if teaching someone.</li>
              <li>Add a hint that would have helped you get there.</li>
            </ul>
          </div>
        )}
        {wrongChoice && <p className="text-[15px] text-fg-2" data-s="cp-wrong-choice">You’ve chosen “{c.choices[wrongChoice.choice]}” {wrongChoice.times} times. Working out why it seems right is often what makes it click.</p>}
        <dl className="grid grid-cols-3 gap-2 my-3 text-[15px]">
          <div className="bg-surface-2 rounded-tile px-3 py-2.5"><dt className="text-sm text-fg-2">Comes back</dt><dd className="m-0 font-[650]">{c.review.due ? shortDate(c.review.due) : 'Not scheduled'}</dd></div>
          <div className="bg-surface-2 rounded-tile px-3 py-2.5"><dt className="text-sm text-fg-2">On your own</dt><dd className="m-0 font-[650]">{ev.own} time{ev.own === 1 ? '' : 's'}</dd></div>
          <div className="bg-surface-2 rounded-tile px-3 py-2.5"><dt className="text-sm text-fg-2">Slipped</dt><dd className="m-0 font-[650]">{slipped} time{slipped === 1 ? '' : 's'}</dd></div>
        </dl>
        {ev.revs.length > 0 && (
          <>
            <ol className="list-none p-0 m-0 flex flex-wrap gap-1.5 items-center" aria-label="Your answers so far, oldest first" data-s="cp-trail">
              {ev.revs.map(x => <li key={x.id} className={`size-3.5 ${trailTone(x)}`} title={trailText(x)}><span className="sr-only">{trailText(x)}</span></li>)}
            </ol>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-2 mt-2 mb-0">
              <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-done" aria-hidden="true" />on your own</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-[3px] bg-primary" aria-hidden="true" />with help or partly</span>
              <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full border-2 border-outline-strong" aria-hidden="true" />not yet right</span>
            </p>
          </>
        )}
        <details className="group mt-2">
          <Summary>Every answer</Summary>
          {ev.revs.length ? (
            <ul className="plain-list list-none p-0 my-2">
              {ev.revs.slice().reverse().map(x => (
                <li key={x.id} className="py-2 border-t border-outline first:border-t-0 text-[15px]">
                  {shortDate(x.date)} · {x.outcome ? OUTCOME[x.outcome] : 'Not assessed'}{x.graded === 'self' ? ' (self-assessed)' : ''} · {SUPPORT[x.support]} · {RATING[x.rating]}
                </li>
              ))}
            </ul>
          ) : <Note>No revision yet.</Note>}
        </details>
        {checks.length > 0 && <Note className="mt-2 mb-0">After learning: {checks.map(s => `${shortDate(s.date)}${s.checkin!.clarity ? ` — ${CLARITY[s.checkin!.clarity]}` : ''}`).join(' · ')}</Note>}
      </Card>
      <Card>
        <Button variant="ghost" data-action="s-cp-del" data-id={c.id} onClick={() => del(c)}>Remove this concept</Button>
        <Note className="mt-2 mb-0">Its past reviews stay in your study history.</Note>
      </Card>
    </>
  );
}

// One mark per answer, told apart by shape as well as colour: a filled circle when recalled on your own,
// a square with help or partly right, an outlined ring when not yet right.
function trailTone(x: Review) {
  if (x.outcome === 'right' && x.support === 'own') return 'rounded-full bg-done';
  if (x.outcome === 'right' || x.outcome === 'partly') return 'rounded-[3px] bg-primary';
  return 'rounded-full border-2 border-outline-strong';
}
const trailText = (x: Review) => `${shortDate(x.date)}: ${x.outcome ? OUTCOME[x.outcome] : 'Not assessed'}, ${SUPPORT[x.support].toLowerCase()}`;
