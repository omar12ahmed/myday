import { useRef } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CommitInput, Field, Select, TextInput } from '../components/Field';
import { shortDate } from '../data/dates';
import { STATUS_TEXT } from '../data/study/common';
import { conceptEvidence, questionReady } from '../data/study/revision';
import { stIndex } from '../data/study/roadmap';
import type { MyDayData } from '../data/types';
import { addTaskConcept, moveTaskTo, saveItemText, setDoneFor, setTaskKind } from './actions';
import { go } from './route';
import { BackLink, ExternalLink, InlineLink, Meta, Note } from './parts';
import { useRemove } from './useRemove';
import { lessonFromTask, lessonHref } from '../data/cybersecurity/types';

// One task: complete or not, its estimate, type, resource link and section, plus the concepts it covers.
export function TaskDetails({ data, id }: { data: MyDayData; id: string }) {
  const remove = useRemove();
  const conceptRef = useRef<HTMLInputElement>(null);
  const st = data.study, ix = stIndex(st), e = ix.task.get(id);
  if (!e) return <Card><h2>Task not found</h2><BackLink to="study/roadmap" label="Back to the roadmap" /></Card>;
  const t = e.node, concepts = st.concepts.filter(c => c.taskIds.includes(t.id)), sections = [...ix.section.values()];
  function addConcept() {
    const el = conceptRef.current;
    if (el && addTaskConcept(t.id, el.value)) { el.value = ''; el.focus(); }
  }
  return (
    <>
      <Card aria-labelledby="tk-h">
        <BackLink to="study/roadmap" label="Roadmap" />
        <p className="st-path text-[13px] text-fg-3 m-0">{e.course.title} › {e.module.title} › {e.section.title}</p>
        <h2 id="tk-h">{t.title}</h2>
        {lessonFromTask(t.id) && <p><InlineLink href={lessonHref(lessonFromTask(t.id)!)}>Open curriculum lesson and lab notebook</InlineLink></p>}
        <label className="check flex items-center gap-2.5 min-h-11 text-[15px] cursor-pointer">
          <input type="checkbox" data-s="task-done" data-id={t.id} className="size-[22px] accent-primary flex-none" checked={t.done} onChange={ev => setDoneFor(t.id, ev.target.checked)} />
          Complete{t.done && t.doneOn && <Meta> ({shortDate(t.doneOn)})</Meta>}
        </label>
        <div className="grid gap-3.5 mt-2">
          <Field label="Name" htmlFor="tkTitle">
            <CommitInput key={t.title} id="tkTitle" type="text" maxLength={120} data-s="title" data-id={t.id} defaultValue={t.title} onCommit={el => saveItemText(t.id, 'title', el)} />
          </Field>
          <div className="field-row grid grid-cols-2 gap-3">
            <Field label="Estimated minutes" htmlFor="tkMin">
              <CommitInput key={t.minutes} id="tkMin" type="number" inputMode="numeric" min={5} max={600} data-s="minutes" data-id={t.id} defaultValue={t.minutes} onCommit={el => saveItemText(t.id, 'minutes', el)} />
            </Field>
            <Field label="Type" htmlFor="tkKind">
              <Select id="tkKind" data-s="kind" data-id={t.id} value={t.kind} onChange={ev => setTaskKind(t.id, ev.target.value)}>
                <option value="learn">Learning</option><option value="practical">Practical</option>
              </Select>
            </Field>
          </div>
          <Field label="Resource link (optional)" htmlFor="tkUrl">
            <CommitInput key={t.url} id="tkUrl" type="url" maxLength={400} data-s="url" data-id={t.id} defaultValue={t.url} placeholder="https://" onCommit={el => saveItemText(t.id, 'url', el)} />
          </Field>
          {t.url && <div className="-mt-2"><ExternalLink href={t.url}>Open the resource</ExternalLink></div>}
          <Field label="Section" htmlFor="tkSec">
            <Select id="tkSec" data-s="task-section" data-id={t.id} value={e.section.id} onChange={ev => moveTaskTo(t.id, ev.target.value)}>
              {sections.map(x => <option key={x.node.id} value={x.node.id}>{`${x.course.title} › ${x.module.title} › ${x.node.title}`}</option>)}
            </Select>
          </Field>
        </div>
        <Button variant="ghost" className="mt-3" data-action="s-del" data-id={t.id} onClick={() => remove(t.id, () => go('study/roadmap'))}>Remove this task</Button>
      </Card>
      <Card aria-labelledby="tkc-h">
        <h3 id="tkc-h">Linked concepts</h3>
        {concepts.length
          ? <ul className="plain-list list-none p-0 my-2">{concepts.map(c => (
            <li key={c.id} className="py-2 border-t border-outline first:border-t-0">
              <InlineLink href={`#study/concept/${c.id}`}>{c.title}</InlineLink>
              <div><Meta>{questionReady(c) ? STATUS_TEXT[conceptEvidence(st, c).status] : 'Needs a revision question'}</Meta></div>
            </li>
          ))}</ul>
          : <Note className="m-0">None yet.</Note>}
        <form className="inline-add flex gap-2 items-center mt-2.5" onSubmit={ev => { ev.preventDefault(); addConcept(); }}>
          <label className="sr-only" htmlFor="tkConcept">Add a concept</label>
          <TextInput ref={conceptRef} id="tkConcept" type="text" maxLength={120} placeholder="Add a concept" enterKeyHint="done" className="flex-1 min-w-0" />
          <Button inline type="submit" data-action="s-task-concept" data-id={t.id} className="flex-none">Add</Button>
        </form>
      </Card>
    </>
  );
}
