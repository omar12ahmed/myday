import { CalendarDays, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { CategoryChip } from '../components/CategoryChip';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { BackLink, Note } from '../components/parts';
import { prettyDate } from '../data/dates';
import { CAT_LABEL } from '../data/plan';
import { update } from '../data/storage';
import { addTask, GROUP_LABEL, isDone, isStuck, listName, onTodaysPlan, setTaskDone, tasksView, type Group } from '../data/tasks';
import { toast } from '../data/toast';
import type { MyDayData, TaskItem } from '../data/types';
import { loadLibs, parseCapture, type CaptureLibs } from '../capture/parse';
import { ListsView } from './ListsView';
import { dueText, tasksRoute } from './route';
import { TaskEditor } from './TaskEditor';

export function TasksScreen({ data, hash }: { data: MyDayData; hash: string }) {
  const r = tasksRoute(hash);
  if (r.view === 'task') return <TaskEditor key={r.id} data={data} id={r.id} />;
  if (r.view === 'lists') return <ListsView data={data} />;
  return <TasksHome data={data} listId={r.view === 'list' ? r.id : null} />;
}

export function TaskRow({ data, t }: { data: MyDayData; t: TaskItem }) {
  const done = isDone(data, t) || !!t.letGoOn, list = listName(data.tasks, t.listId);
  return (
    <li className="task-li flex items-start gap-1 border-t border-outline first:border-t-0 py-2" data-id={t.id}>
      <label className="tick flex-none grid place-items-center size-11 -ml-2.5 mt-0.5 cursor-pointer">
        <input type="checkbox" className="size-[22px] accent-done m-0 cursor-pointer" data-s="task-done" data-id={t.id} checked={done} aria-label={`Done: ${t.title}`}
          onChange={e => { const v = e.target.checked; if (update(d => (setTaskDone(d, t.id, v) ? undefined : false)) && v) toast('Done — nice.'); }} />
      </label>
      <a href={`#inbox/tasks/${t.id}`} className="task-row flex-1 min-w-0 block py-1.5 min-h-11 text-fg no-underline hover:bg-surface-2 rounded-tile -mx-1 px-1" data-id={t.id}>
        <span className={`block font-medium leading-snug break-words ${done ? 'line-through text-fg-3' : ''}`}>{t.title}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm text-fg-3 tabular-nums">
          {t.due && <span className="inline-flex items-center gap-1" data-s="task-due"><CalendarDays size={14} aria-hidden="true" /> {dueText(t)}</span>}
          {list && <span>{list}</span>}
          <span>{t.minutes} min</span>
          <CategoryChip kind={t.category} />
          {onTodaysPlan(data, t) && !done && <span className="text-primary font-semibold">On today's plan</span>}
          {t.letGoOn && <span data-s="let-go">Let go</span>}
          {!done && isStuck(data, t) && <span className="text-primary font-semibold" data-s="stuck">Something in the way?</span>}
        </span>
      </a>
    </li>
  );
}

let libsOnce: Promise<CaptureLibs> | null = null;

function TasksHome({ data, listId }: { data: MyDayData; listId: string | null }) {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [showDone, setShowDone] = useState(false);
  const d = data.tasks, list = listId ? d.lists.find(l => l.id === listId) : null;
  const groups = tasksView(data, listId, query);

  // Adding: dates and times are read from what you type, as in Capture ("pay rent by Friday" is due Friday).
  async function add() {
    const words = text.trim();
    if (!words) return;
    const libs = await (libsOnce ??= loadLibs()).catch(() => null);
    const c = libs ? parseCapture(words, new Date(), libs) : null;
    let id: string | null = null;
    update(x => { id = addTask(x.tasks, { title: c ? c.title : words, due: c?.date ?? null, time: c?.time ?? null, category: c?.category ?? 'admin', listId: listId ?? '' }); if (!id) return false; });
    if (!id) return;
    setText('');
    toast(c?.date ? `Added — ${c.time ? `${prettyDate(c.date)}, ${c.time}` : prettyDate(c.date)}.` : 'Added.');
  }
  const section = (g: Group) => groups[g].length > 0 && (
    <Card key={g} aria-labelledby={`tg-${g}`} id={`tasks-${g}`}>
      <h3 id={`tg-${g}`} className="flex items-center gap-2">{GROUP_LABEL[g]} <span className="text-fg-3 font-normal tabular-nums">{groups[g].length}</span></h3>
      {g === 'earlier' && <Note className="mt-0">Still to do from before — no rush; change the date if it suits better.</Note>}
      <ul className="list-none p-0 m-0">{groups[g].map(t => <TaskRow key={t.id} data={data} t={t} />)}</ul>
    </Card>
  );
  const open = groups.earlier.length + groups.today.length + groups.upcoming.length + groups.anytime.length;
  return (
    <>
      {list && <BackLink to="inbox/tasks" label="All tasks" />}
      <Card aria-labelledby="tasks-h">
        <h2 id="tasks-h" className="m-0">{list ? list.name : 'Tasks'}</h2>
        <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-3" onSubmit={e => { e.preventDefault(); add(); }}>
          <Field label="Add a task" htmlFor="taskNew">
            <TextInput id="taskNew" value={text} maxLength={200} onChange={e => setText(e.target.value)} placeholder="e.g. pay rent by Friday" />
          </Field>
          <Button inline type="submit" variant="primary" data-action="task-add" disabled={!text.trim()}><Plus size={18} aria-hidden="true" /> Add</Button>
        </form>
        {!list && (
          <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Lists">
            <Button inline variant="selected" aria-pressed className="!min-h-11" data-s="task-list" data-id="all">All</Button>
            {d.lists.map(l => <Button key={l.id} inline variant="ghost" className="!min-h-11" data-s="task-list" data-id={l.id} onClick={() => { location.hash = `inbox/tasks/list/${l.id}`; }}>{l.name}</Button>)}
            <a href="#inbox/tasks/lists" className="inline-flex items-center min-h-11 px-2 text-primary font-semibold text-[15px]" data-action="task-lists">{d.lists.length ? 'Edit lists' : '+ Make a list'}</a>
          </div>
        )}
        {d.items.length > 4 && (
          <Field label="Search tasks" htmlFor="taskSearch" className="mt-3">
            <TextInput id="taskSearch" type="search" value={query} onChange={e => setQuery(e.target.value)} />
          </Field>
        )}
      </Card>
      {(['earlier', 'today', 'upcoming', 'anytime'] as Group[]).map(section)}
      {!open && <Card><p className="text-[15px] text-fg-2 m-0" id="tasksEmpty">{query.trim() ? `No tasks match “${query.trim()}”.` : list ? 'Nothing in this list yet.' : 'Nothing to do here. Add a task above, or use + from any screen.'}</p></Card>}
      {groups.done.length > 0 && (
        <Card aria-labelledby="tg-done" id="tasks-done">
          <button type="button" className="w-full flex justify-between items-center min-h-11 bg-transparent border-0 p-0 text-fg cursor-pointer" aria-expanded={showDone} data-action="tasks-done-toggle" onClick={() => setShowDone(!showDone)}>
            <h3 id="tg-done" className="m-0">Done <span className="text-fg-3 font-normal tabular-nums">{groups.done.length}</span></h3><span className="text-primary font-semibold text-[15px]">{showDone ? 'Hide' : 'Show'}</span>
          </button>
          {showDone && <ul className="list-none p-0 m-0">{groups.done.slice(0, 50).map(t => <TaskRow key={t.id} data={data} t={t} />)}</ul>}
        </Card>
      )}
      {!list && (
        <Card aria-labelledby="tq-h" id="tasks-queue">
          <h3 id="tq-h">Also on your plate</h3>
          {data.queue.length > 0 && <>
            <p className="text-[15px] m-0 mb-1">Waiting in your queue — MyDay fits these into coming days:</p>
            <ul className="list-disc pl-5 m-0 text-[15px]" data-s="queue-list">{data.queue.map(q => <li key={q.qid}>{q.title} <span className="text-fg-3 text-sm">· {CAT_LABEL[q.category]}</span></li>)}</ul>
          </>}
          <Note className="mb-0">Your repeating tasks (the Learning, Admin and Health lists Today picks from) are in <a href="#today/edit" className="text-primary font-semibold">Your task lists</a>.</Note>
        </Card>
      )}
      <Note className="text-sm">Tasks are saved on this device and in "Export my data" — and with your account on every device, if you use sync.</Note>
    </>
  );
}
