import { X } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { CommitInput, CommitTextarea, Field, Select } from '../components/Field';
import { shortDate } from '../data/dates';
import { CLARITY, OUTCOME, RATING, STATUS_TEXT, SUPPORT } from '../data/study/common';
import { conceptEvidence, evidenceText, questionReady } from '../data/study/revision';
import { stIndex } from '../data/study/roadmap';
import type { Concept, MyDayData } from '../data/types';
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
        <h3 id="cph-h">History</h3>
        {ev.revs.length ? (
          <ul className="plain-list list-none p-0 my-2">
            {ev.revs.slice().reverse().map(x => (
              <li key={x.id} className="py-2 border-t border-outline first:border-t-0 text-[15px]">
                {shortDate(x.date)} · {x.outcome ? OUTCOME[x.outcome] : 'Not assessed'}{x.graded === 'self' ? ' (self-assessed)' : ''} · {SUPPORT[x.support]} · {RATING[x.rating]}
              </li>
            ))}
          </ul>
        ) : <Note>No revision yet.</Note>}
        {checks.length > 0 && <Note className="mt-2 mb-0">After learning: {checks.map(s => `${shortDate(s.date)}${s.checkin!.clarity ? ` — ${CLARITY[s.checkin!.clarity]}` : ''}`).join(' · ')}</Note>}
      </Card>
      <Card>
        <Button variant="ghost" data-action="s-cp-del" data-id={c.id} onClick={() => del(c)}>Remove this concept</Button>
        <Note className="mt-2 mb-0">Its past reviews stay in your study history.</Note>
      </Card>
    </>
  );
}
