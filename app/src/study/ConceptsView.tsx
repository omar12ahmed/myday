import { Plus } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { shortDate } from '../data/dates';
import { STATUS_TEXT } from '../data/study/common';
import { conceptEvidence, questionReady } from '../data/study/revision';
import type { Concept, MyDayData } from '../data/types';
import { newConceptAndOpen } from './actions';
import { focusSoon } from './focus';
import { BackLink, InlineLink, Meta, Note, Row } from './parts';

// Every concept, shared by learning and revision. The ones without a revision question come first.
export function ConceptsView({ data }: { data: MyDayData }) {
  const st = data.study, list = st.concepts, needQ = list.filter(c => !questionReady(c));
  const row = (c: Concept) => {
    const ev = conceptEvidence(st, c);
    return (
      <Row key={c.id}>
        <div className="min-w-0">
          <InlineLink href={`#study/concept/${c.id}`}><strong>{c.title}</strong></InlineLink>
          <div><Meta>{STATUS_TEXT[ev.status]}{questionReady(c) && c.review.due ? ` · next review ${shortDate(c.review.due)}` : ''}</Meta></div>
        </div>
      </Row>
    );
  };
  return (
    <>
      <Card>
        <BackLink to="study" label="Study" />
        <div className="card-head flex justify-between items-center gap-3">
          <h2 className="m-0">Concepts</h2>
          <Button inline data-action="s-concept-new" onClick={() => focusSoon(newConceptAndOpen())}><Plus size={16} aria-hidden="true" /> New</Button>
        </div>
        <Note className="mt-1.5 mb-0">Shared by learning and revision. Labels are cautious — one good answer isn't mastery.</Note>
      </Card>
      {needQ.length > 0 && (
        <Card aria-labelledby="needq-h">
          <h3 id="needq-h">Need a revision question ({needQ.length})</h3>
          <Note>Add a question and an answer or explanation, and they'll come up in revision. Nothing is written for you.</Note>
          {needQ.map(row)}
        </Card>
      )}
      <Card aria-labelledby="allc-h">
        <h3 id="allc-h">All concepts ({list.length})</h3>
        {list.length ? list.map(row) : <Note className="m-0">Concepts you add after a session, or here, appear in this list.</Note>}
      </Card>
    </>
  );
}
