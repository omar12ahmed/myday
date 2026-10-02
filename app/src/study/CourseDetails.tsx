import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CommitInput, Field, Select } from '../components/Field';
import { completion, completionText, focusCourse, stIndex } from '../data/study/roadmap';
import type { MyDayData } from '../data/types';
import { moveCourseTo, saveItemText, setArchived, setFocus } from './actions';
import { go } from './route';
import { BackLink, Bar, Note } from './parts';
import { useRemove } from './useRemove';

// One course: its name, link, usual session length and stage. Saved as you leave each field.
export function CourseDetails({ data, id }: { data: MyDayData; id: string }) {
  const remove = useRemove();
  const st = data.study, ix = stIndex(st), e = ix.course.get(id);
  if (!e) return <Card><h2>Course not found</h2><BackLink to="study/roadmap" label="Back to the roadmap" /></Card>;
  const c = e.node, comp = completion(ix.courseTasks.get(id)!), fc = focusCourse(st, ix);
  const listItem = c.listId ? data.lists.learning.find(l => l.id === c.listId) : null;
  return (
    <Card aria-labelledby="co-h">
      <BackLink to="study/roadmap" label="Roadmap" />
      <h2 id="co-h">{c.title}</h2>
      <p className="text-[15px] m-0">{completionText(comp)}</p>
      <Bar c={comp} />
      <div className="grid gap-3.5 mt-3">
        <Field label="Name" htmlFor="coTitle">
          <CommitInput key={c.title} id="coTitle" type="text" maxLength={120} data-s="title" data-id={c.id} defaultValue={c.title} onCommit={el => saveItemText(c.id, 'title', el)} />
        </Field>
        <Field label="Course link (optional)" htmlFor="coUrl">
          <CommitInput key={c.url} id="coUrl" type="url" maxLength={400} data-s="url" data-id={c.id} defaultValue={c.url} placeholder="https://" onCommit={el => saveItemText(c.id, 'url', el)} />
        </Field>
        <Field label="Usual session length (minutes)" htmlFor="coMin">
          <CommitInput key={c.minutes} id="coMin" type="number" inputMode="numeric" min={5} max={600} data-s="minutes" data-id={c.id} defaultValue={c.minutes} onCommit={el => saveItemText(c.id, 'minutes', el)} />
        </Field>
        <Field label="Stage" htmlFor="coStage">
          <Select id="coStage" data-s="course-stage" data-id={c.id} value={e.stage.id} onChange={ev => moveCourseTo(c.id, ev.target.value)}>
            {st.stages.map(sg => <option key={sg.id} value={sg.id}>{sg.title}</option>)}
          </Select>
        </Field>
      </div>
      <label className="check flex items-center gap-2.5 min-h-11 mt-2 text-[15px] cursor-pointer">
        <input type="checkbox" data-s="archived" data-id={c.id} className="size-[22px] accent-primary flex-none" checked={c.archived} onChange={ev => setArchived(c.id, ev.target.checked)} /> Archived — keep it, but leave it off the dashboard
      </label>
      {listItem && <Note>Made from “{listItem.title}” in your Today learning list. That list is unchanged.</Note>}
      <div className="grid gap-2.5 mt-3">
        {fc && fc.id === c.id ? <p className="text-[15px] m-0">This is your current focus.</p>
          : !c.archived && <Button data-action="s-focus" data-id={c.id} onClick={() => setFocus(c.id)}>Make this my focus</Button>}
        <Button variant="ghost" data-action="s-del" data-id={c.id} onClick={() => remove(c.id, () => go('study/roadmap'))}>Remove this course</Button>
      </div>
    </Card>
  );
}
