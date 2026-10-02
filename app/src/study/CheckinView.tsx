import { useRef } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CommitInput, Field, TextInput } from '../components/Field';
import { fmtDuration } from '../data/dates';
import { CLARITY } from '../data/study/common';
import { stIndex } from '../data/study/roadmap';
import { checkinConcepts, sessionMinutes, todayTaskFor } from '../data/study/sessions';
import type { Clarity, MyDayData } from '../data/types';
import { checkinAdd, checkinClarity, checkinConcept, checkinFinished, checkinTask, checkinText, tickToday } from './actions';
import { Choice, Choices, Eyebrow, NotFound, NoteLink, Note, Summary } from './parts';

// After a session: a quick, optional check-in. Each part saves as you go and is kept separate —
// the task's completion, how clear it felt, and the concepts you covered.
export function CheckinView({ data, id }: { data: MyDayData; id: string }) {
  const newRef = useRef<HTMLInputElement>(null);
  const st = data.study, s = st.sessions.find(x => x.id === id);
  if (!s || s.status !== 'done') return <NotFound title="Session not found" back="study" label="Back to Study" />;
  const ix = stIndex(st), t = s.taskId ? ix.task.get(s.taskId) : null;
  const ci = s.checkin || { conceptIds: [], clarity: null, takeaway: '', question: '', note: '' };
  const offered = checkinConcepts(st, s), todayT = todayTaskFor(data, s);

  function add() {
    const el = newRef.current;
    if (el && checkinAdd(s!.id, el.value)) { el.value = ''; el.focus(); }
  }

  return (
    <Card aria-labelledby="ci-h">
      <Eyebrow>Session finished · {fmtDuration(Math.max(1, sessionMinutes(s)))}</Eyebrow>
      <h2 id="ci-h">Quick check-in</h2>
      <Note>Everything here is optional, and it saves as you go. Skip it whenever you like.</Note>
      {t && (
        <>
          <h3 className="mt-4">Is “{t.node.title}” complete?</h3>
          <Choices label="Is the task complete?">
            <Choice on={s.taskDone === true} data-action="s-ci-task" data-v="1" onClick={() => checkinTask(s.id, true)}>Yes, it's complete</Choice>
            <Choice on={s.taskDone === false} data-action="s-ci-task" data-v="0" onClick={() => checkinTask(s.id, false)}>Not yet</Choice>
          </Choices>
        </>
      )}
      <h3 className="mt-4">What did you cover?</h3>
      {offered.length
        ? <div className="chip-row flex flex-wrap gap-2 mb-2.5">{offered.map(c => {
          const on = ci.conceptIds.includes(c.id);
          return <Choice key={c.id} on={on} className={`st-pick !flex-none !min-w-0 ${on ? 'on' : ''}`} data-action="s-ci-concept" data-id={c.id} onClick={() => checkinConcept(s.id, c.id)}>{c.title}</Choice>;
        })}</div>
        : <Note>No concepts linked to this yet.</Note>}
      <form className="inline-add flex gap-2 items-center" onSubmit={e => { e.preventDefault(); add(); }}>
        <label className="sr-only" htmlFor="ciNew">Add a concept</label>
        <TextInput ref={newRef} id="ciNew" type="text" maxLength={120} placeholder="Add a concept, e.g. DNS records" enterKeyHint="done" className="flex-1 min-w-0" />
        <Button inline type="submit" data-action="s-ci-add" className="flex-none">Add</Button>
      </form>
      <Note className="mt-2.5">Picking a concept just records that you covered it. Its revision question and answer are added separately — nothing is filled in for you.</Note>
      <h3 className="mt-4">How clear does it feel?</h3>
      <Choices label="How clear does it feel?">
        {(Object.keys(CLARITY) as Clarity[]).map(k => (
          <Choice key={k} on={ci.clarity === k} data-action="s-ci-clarity" data-v={k} onClick={() => checkinClarity(s.id, k)}>{CLARITY[k]}</Choice>
        ))}
      </Choices>
      <details open={!!(ci.takeaway || ci.question || ci.note) || undefined} className="group mb-3">
        <Summary>Add a takeaway, a question or a note link</Summary>
        <div className="grid gap-3 mt-1">
          <Field label="One-line takeaway" htmlFor="ciTake">
            <CommitInput key={'t' + ci.takeaway} id="ciTake" type="text" maxLength={500} data-s="ci-takeaway" data-id={s.id} defaultValue={ci.takeaway} onCommit={el => checkinText(s.id, 'takeaway', el.value)} />
          </Field>
          <Field label="Something still unclear" htmlFor="ciQ">
            <CommitInput key={'q' + ci.question} id="ciQ" type="text" maxLength={500} data-s="ci-question" data-id={s.id} defaultValue={ci.question} onCommit={el => checkinText(s.id, 'question', el.value)} />
          </Field>
          <Field label="Obsidian note (path in your vault)" htmlFor="ciNote">
            <CommitInput key={'n' + ci.note} id="ciNote" type="text" maxLength={300} data-s="ci-note" data-id={s.id} defaultValue={ci.note} placeholder="e.g. Networking/DNS" onCommit={el => checkinText(s.id, 'note', el.value)} />
          </Field>
          <NoteLink study={st} path={ci.note} />
        </div>
      </details>
      {todayT && (todayT.done || s.todayUid
        ? <p className="text-[15px]">“{todayT.title}” is ticked on today's plan.</p>
        : <Button className="mb-3" data-action="s-tick-today" data-id={s.id} onClick={() => tickToday(s.id)}>Also tick “{todayT.title}” on today's plan</Button>)}
      <div className="row2 grid grid-cols-2 gap-2.5">
        <Button variant="primary" data-action="s-ci-done" data-id={s.id} onClick={() => checkinFinished(s.id, true)}>Done</Button>
        <Button variant="ghost" data-action="s-ci-skip" data-id={s.id} onClick={() => checkinFinished(s.id, false)}>Skip</Button>
      </div>
    </Card>
  );
}
