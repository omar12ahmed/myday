import { ArrowDown, ArrowUp, ChevronRight, Plus, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CommitInput } from '../components/Field';
import { getSnapshot, update } from '../data/storage';
import type { Level } from '../data/study/common';
import { addStudyItem, completion, completionText, focusCourse, moveStudyItem, nextTaskIn, stFind, stIndex, tasksUnder, type StudyIndex } from '../data/study/roadmap';
import { activeStudy, suggestLength } from '../data/study/sessions';
import type { MyDayData, StudyCourse, StudyModule, StudySection, StudyStage, StudyTask } from '../data/types';
import { saveItemText, setDoneFor, setFocus, startLearning } from './actions';
import { focusIfWaiting, focusSoon } from './focus';
import { useRemove } from './useRemove';
import { SetupCard } from './Dashboard';
import { Bar, Chip, ExternalLink, Meta, Note, TextLink } from './parts';

export interface RoadmapState {
  edit: boolean; setEdit: (on: boolean) => void;
  open: Record<string, boolean>; setOpen: (fn: (o: Record<string, boolean>) => Record<string, boolean>) => void;
}

// The whole outline: Stage → Course → Module → Section → Task, with an Edit mode for names and order.
export function Roadmap({ data, state }: { data: MyDayData; state: RoadmapState }) {
  const { edit, setEdit, open, setOpen } = state;
  const remove = useRemove();
  const st = data.study;
  const head = (
    <Card>
      <div className="card-head flex justify-between items-center gap-3">
        <h2 className="m-0">Roadmap</h2>
        <Button inline variant={edit ? 'primary' : 'tonal'} data-action="s-edit" aria-pressed={edit} onClick={() => setEdit(!edit)}>{edit ? 'Done editing' : 'Edit'}</Button>
      </div>
      <Note className="mt-1.5 mb-0">Stage → course → module → section → task. Completion counts tasks marked complete; it isn't a measure of mastery.</Note>
    </Card>
  );
  if (!st.stages.length) return <>{head}<SetupCard data={data} /></>;

  const ix = stIndex(st), fc = focusCourse(st, ix), next = fc ? nextTaskIn(ix, fc) : null, nextE = next ? ix.task.get(next.id) : null;
  const busy = !!activeStudy(st);
  const isOpen = (id: string, byDefault: boolean) => (id in open ? open[id] : byDefault);
  // Remember only what you opened or closed yourself.
  const onToggle = (id: string, byDefault: boolean) => (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const now = e.currentTarget.open;
    if (now !== isOpen(id, byDefault)) setOpen(o => ({ ...o, [id]: now }));
  };
  function add(level: Level, parentId: string) {
    let id = null as string | null;
    update(d => { id = addStudyItem(d.study, level, parentId); if (!id) return false; });
    if (!id) return;
    // Open the item and everything around it, so the new name box is visible.
    const e = stFind(stIndex(getSnapshot().data.study), id);
    const ids = [id, parentId, e?.module?.id, e?.course?.id].filter((x): x is string => !!x);
    setOpen(o => ({ ...o, ...Object.fromEntries(ids.map(x => [x, true])) }));
    focusSoon(id);
  }

  const addBtn = (level: Level, parentId: string) => (
    <Button inline variant="ghost" className="st-add mt-2" data-action="s-add" data-level={level} data-parent={parentId} onClick={() => add(level, parentId)}>
      <Plus size={16} aria-hidden="true" /> Add a {level}
    </Button>
  );
  // In edit mode every item gets a name box and move/remove buttons.
  const editBits = (level: Level, n: { id: string; title: string }, i: number, len: number) => (
    <div className="st-edit flex gap-2 items-center flex-wrap my-1.5 w-full">
      <CommitInput key={n.title} type="text" maxLength={120} data-s="title" data-id={n.id} defaultValue={n.title} aria-label={`${level} name`} className="flex-[1_1_160px] min-w-0"
        ref={focusIfWaiting(n.id)}
        onCommit={el => saveItemText(n.id, 'title', el)} />
      <div className="c-actions flex gap-1.5">
        <Button inline variant="ghost" className="!px-0 !w-11" data-action="s-move" data-id={n.id} data-d="-1" aria-label={`Move ${n.title} up`} disabled={i === 0} onClick={() => update(d => { if (!moveStudyItem(d.study, n.id, -1)) return false; })}><ArrowUp size={18} aria-hidden="true" /></Button>
        <Button inline variant="ghost" className="!px-0 !w-11" data-action="s-move" data-id={n.id} data-d="1" aria-label={`Move ${n.title} down`} disabled={i === len - 1} onClick={() => update(d => { if (!moveStudyItem(d.study, n.id, 1)) return false; })}><ArrowDown size={18} aria-hidden="true" /></Button>
        <Button inline variant="ghost" className="!px-0 !w-11" data-action="s-del" data-id={n.id} aria-label={`Remove ${n.title}`} onClick={() => remove(n.id)}><X size={18} aria-hidden="true" /></Button>
      </div>
    </div>
  );
  const node = (id: string, byDefault: boolean, summary: ReactNode, body: ReactNode) => (
    <details className="st-node group border-t border-outline mt-2" data-node={id} open={isOpen(id, byDefault)} onToggle={onToggle(id, byDefault)}>
      <summary className="flex items-start gap-2 min-h-[52px] py-1.5 list-none [&::-webkit-details-marker]:hidden">
        <ChevronRight size={18} aria-hidden="true" className="flex-none mt-1 text-fg-3 transition-transform group-open:rotate-90" />
        <span className="min-w-0">{summary}</span>
      </summary>
      <div className="st-body pb-2 pl-3.5 ml-2 border-l-2 border-outline">{body}</div>
    </details>
  );

  const taskRow = (t: StudyTask, i: number, s: StudySection) => edit ? (
    <li key={t.id} className="st-task border-t border-outline first:border-t-0">{editBits('task', t, i, s.tasks.length)}<TextLink href={`#study/task/${t.id}`}>Details</TextLink></li>
  ) : (
    <li key={t.id} className={`st-task flex items-center justify-between gap-2 flex-wrap border-t border-outline first:border-t-0${t.done ? ' done' : ''}`}>
      <label className="check flex items-center gap-2.5 flex-[1_1_13em] min-w-0 min-h-[52px] cursor-pointer">
        <input type="checkbox" data-s="task-done" data-id={t.id} className="size-[22px] accent-primary flex-none" checked={t.done} onChange={e => setDoneFor(t.id, e.target.checked)} />
        <span className="min-w-0"><span className={`title ${t.done ? 'text-fg-2' : ''}`}>{t.title}</span><Meta> · {t.minutes} min{t.kind === 'practical' ? ' · Practical' : ''}</Meta></span>
      </label>
      <span className="c-actions ml-auto flex items-center gap-2">
        {!t.done && !busy && <Button inline data-action="s-start" aria-label={`Start ${t.title}`} onClick={() => startLearning(ix.task.get(t.id)!.course.id, t.id, suggestLength(data, t.minutes).minutes, false)}>Start</Button>}
        <TextLink href={`#study/task/${t.id}`} aria-label={`Details for ${t.title}`}>Details</TextLink>
      </span>
    </li>
  );
  const sectionHtml = (s: StudySection, i: number, m: StudyModule) => (
    <div key={s.id} className="st-section">
      {edit ? editBits('section', s, i, m.sections.length) : <h4 className="mt-3 mb-0.5">{s.title}</h4>}
      <ul className="st-tasks list-none p-0 m-0">{s.tasks.map((t, j) => taskRow(t, j, s))}</ul>
      {!s.tasks.length && !edit && <Note className="m-0">No tasks yet.</Note>}
      {edit && addBtn('task', s.id)}
    </div>
  );
  const moduleHtml = (m: StudyModule, i: number, c: StudyCourse) => {
    const comp = completion(tasksUnder('module', m)), byDefault = !!(nextE && nextE.module === m);
    return (
      <div key={m.id}>
        {node(m.id, byDefault, <>{m.title}<Meta className="st-sum block">{completionText(comp)}</Meta></>, (
          <>
            {edit && editBits('module', m, i, c.modules.length)}
            {m.sections.length ? m.sections.map((s, j) => sectionHtml(s, j, m)) : <Note className="m-0">No sections yet.</Note>}
            {edit && addBtn('section', m.id)}
          </>
        ))}
      </div>
    );
  };
  const courseHtml = (c: StudyCourse, i: number, sg: StudyStage, ix: StudyIndex) => {
    const comp = completion(ix.courseTasks.get(c.id)!), isFocus = !!fc && c.id === fc.id;
    return (
      <div key={c.id}>
        {node(c.id, isFocus, (
          <><strong>{c.title}</strong>{isFocus && <> <Chip>Current focus</Chip></>}{c.archived && <> <Chip>Archived</Chip></>}<Meta className="st-sum block">{completionText(comp)}</Meta></>
        ), (
          <>
            {edit && editBits('course', c, i, sg.courses.length)}
            <Bar c={comp} />
            <div className="st-actions flex flex-wrap gap-x-3.5 gap-y-1 items-center my-1">
              {!isFocus && !c.archived && !edit && <Button inline data-action="s-focus" data-id={c.id} onClick={() => setFocus(c.id)}>Make this my focus</Button>}
              {c.url && !edit && <ExternalLink href={c.url}>Course link</ExternalLink>}
              <TextLink href={`#study/course/${c.id}`}>Course details</TextLink>
            </div>
            {c.modules.length ? c.modules.map((m, j) => moduleHtml(m, j, c)) : <Note className="m-0">No modules yet. Add the course's own modules and sections as you reach them.</Note>}
            {edit && addBtn('module', c.id)}
          </>
        ))}
      </div>
    );
  };

  return (
    <>
      {head}
      {st.stages.map((sg, i) => {
        const comp = completion(tasksUnder('stage', sg));
        return (
          <Card key={sg.id}>
            {edit ? editBits('stage', sg, i, st.stages.length) : <h2>{sg.title}</h2>}
            {comp.total > 0 && <Note className="m-0">{completionText(comp)}</Note>}
            {sg.courses.length ? sg.courses.map((c, j) => courseHtml(c, j, sg, ix)) : <Note className="mt-1.5 mb-0">No courses in this stage yet.</Note>}
            {edit && addBtn('course', sg.id)}
          </Card>
        );
      })}
      {edit && <Card>{addBtn('stage', '')}</Card>}
    </>
  );
}
