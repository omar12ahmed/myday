import { CalendarPlus, Check, NotebookPen, Pause, Pencil, Play, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { addAppointment } from '../capture/save';
import { loadLibs, parseCapture, type CaptureLibs } from '../capture/parse';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CategoryChip } from '../components/CategoryChip';
import { useConfirm } from '../components/confirm';
import { CommitInput, CommitTextarea, Field, Select, TextInput } from '../components/Field';
import { BackLink, Eyebrow, Note, NotFound } from '../components/parts';
import { prettyDate, shortDate, todayKey } from '../data/dates';
import { addNote, noteName } from '../data/notes';
import { comingUp, deleteProject, editProject, lastActivity, linkNote, nextStep, PROJECT_LIMITS, projectById, projectNotes, projectTasks, setNextStep, STATUS_LABEL, unlinkAppointment } from '../data/projects';
import { update } from '../data/storage';
import { addTask, addToTodaysPlan, onTodaysPlan, planRoom, setTaskDone } from '../data/tasks';
import { toast } from '../data/toast';
import type { MyDayData, Project, TaskItem } from '../data/types';
import { bothMention, mightBelong } from '../data/understand';
import { dueText } from '../tasks/route';
import { TaskRow } from '../tasks/TasksScreen';
import { Progression } from './parts';

// One project (#projects/p/<id>): what it is, where it is on the progression, its one next step, and everything that
// belongs to it — tasks, notes, what's coming up (dated tasks and appointments) and how far it has come. On wide screens
// the doing (next step, tasks, notes) is on the left and the overview on the right.
export function ProjectView({ data, id }: { data: MyDayData; id: string }) {
  const p = projectById(data, id);
  if (!p) return <><BackLink to="projects" label="Projects" /><NotFound title="This project isn't here" back="projects" label="Back to your projects" /></>;
  return (
    <>
      <BackLink to="projects" label="Projects" />
      <ProjectHead p={p} />
      <div className="grid gap-x-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="min-w-0">
          <NextStepCard data={data} p={p} />
          <TasksCard data={data} p={p} />
          <NotesCard data={data} p={p} />
        </div>
        <div className="min-w-0">
          <ComingUpCard data={data} p={p} />
          <ProgressCard data={data} p={p} />
          <ManageCard p={p} />
        </div>
      </div>
    </>
  );
}

function ProjectHead({ p }: { p: Project }) {
  const [editing, setEditing] = useState(false);
  const save = (patch: Partial<Pick<Project, 'title' | 'summary' | 'stage'>>) => update(d => (editProject(d, p.id, patch) ? undefined : false));
  return (
    <Card aria-labelledby="projectTitle" id="projectHead">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {p.status !== 'active' && <Eyebrow>{STATUS_LABEL[p.status]}</Eyebrow>}
          <h2 id="projectTitle" className="text-[26px] tracking-[-.02em] m-0 break-words">{p.title}</h2>
        </div>
        <Button inline variant="ghost" className="flex-none" aria-expanded={editing} data-action="project-edit" onClick={() => setEditing(!editing)}><Pencil size={16} aria-hidden="true" /> {editing ? 'Done' : 'Edit'}</Button>
      </div>
      {editing ? (
        <div className="grid gap-3 mt-3">
          <Field label="Project" htmlFor="projectTitleInput"><CommitInput id="projectTitleInput" key={p.title} defaultValue={p.title} maxLength={PROJECT_LIMITS.title} onCommit={el => { if (!el.value.trim()) { el.value = p.title; return; } save({ title: el.value }); }} /></Field>
          <Field label="What is it, and why does it matter to you?" htmlFor="projectSummary"><CommitTextarea id="projectSummary" rows={4} key={p.summary} defaultValue={p.summary} maxLength={PROJECT_LIMITS.summary} onCommit={el => save({ summary: el.value })} /></Field>
        </div>
      ) : p.summary ? (
        <p className="text-[16px] text-fg-2 m-0 mt-2 whitespace-pre-line" data-s="project-summary">{p.summary}</p>
      ) : (
        <button type="button" className="min-h-11 mt-1 -mb-1 text-[15px] font-semibold text-primary bg-transparent border-0 p-0 cursor-pointer hover:underline underline-offset-4" data-action="project-why" onClick={() => setEditing(true)}>What is it, and why does it matter to you?</button>
      )}
      <div className="mt-5"><Progression stage={p.stage} onPick={stage => save({ stage })} /></div>
    </Card>
  );
}

// The one next step: what reaches Today. With none yet, it asks for the smallest one.
function NextStepCard({ data, p }: { data: MyDayData; p: Project }) {
  const [text, setText] = useState('');
  const step = nextStep(data, p), open = projectTasks(data, p).open, k = todayKey();
  function addStep() {
    const title = text.trim();
    if (!title) return;
    update(d => { const id = addTask(d.tasks, { title }); if (!id) return false; d.tasks.items.find(t => t.id === id)!.projectId = p.id; setNextStep(d, p.id, id); });
    setText('');
    toast('Next step set — it can go on Today whenever you like.');
  }
  return (
    <Card tone="accent" aria-labelledby="projectNextH" id="projectNext">
      <h3 id="projectNextH" className="!text-primary">Next step</h3>
      {step ? (
        <>
          <p className="text-[20px] font-bold leading-snug m-0 break-words" data-s="next-title">{step.title}</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 m-0 mt-1.5 text-sm text-fg-3 tabular-nums">
            {step.due && <span>{dueText(step, k)}</span>}<span>{step.minutes} min</span><CategoryChip kind={step.category} />
          </p>
          <div className="flex flex-wrap gap-2.5 mt-4">
            {onTodaysPlan(data, step, k) ? <span className="inline-flex items-center min-h-11 text-primary font-semibold">On today's plan</span>
              : <Button inline variant="primary" data-action="project-step-today" onClick={() => toToday(data, step)}>Add to today</Button>}
            <Button inline data-action="project-step-done" onClick={() => { if (update(d => (setTaskDone(d, step.id, true) ? undefined : false))) toast('Done — nice. The next one is ready when you are.'); }}><Check size={18} aria-hidden="true" /> Done</Button>
            <a href={`#today/tasks/${step.id}`} className="inline-flex items-center min-h-11 px-2 text-primary font-semibold text-[15px] no-underline hover:underline underline-offset-4">Open</a>
          </div>
          {open.length > 1 && (
            <Field label="Or choose another next step" htmlFor="projectNextPick" className="mt-4">
              <Select id="projectNextPick" value={step.id} onChange={e => update(d => (setNextStep(d, p.id, e.target.value) ? undefined : false))}>
                {open.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </Select>
            </Field>
          )}
        </>
      ) : (
        <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end" onSubmit={e => { e.preventDefault(); addStep(); }}>
          <Field label="What's the smallest next step?" htmlFor="projectNextNew">
            <TextInput id="projectNextNew" value={text} maxLength={120} onChange={e => setText(e.target.value)} placeholder="e.g. Write down three questions" />
          </Field>
          <Button inline type="submit" variant="primary" data-action="project-step-add" disabled={!text.trim()}>Set</Button>
        </form>
      )}
    </Card>
  );
}
function toToday(data: MyDayData, t: TaskItem) {
  const room = planRoom(data);
  let r = '' as ReturnType<typeof addToTodaysPlan> | '';
  update(d => { r = addToTodaysPlan(d, t.id); if (r !== 'added') return false; });
  toast(r === 'added' ? "Added to today's plan." : r === 'full' ? `Today's plan is full for your energy (${room.limit} task${room.limit === 1 ? '' : 's'}) — it'll keep.` : room.rest ? "Today is a rest day — it'll keep." : 'Build your day first, on Today — then add it.');
}

let libsOnce: Promise<CaptureLibs> | null = null;
function TasksCard({ data, p }: { data: MyDayData; p: Project }) {
  const [text, setText] = useState('');
  const [showDone, setShowDone] = useState(false);
  const { open, done } = projectTasks(data, p);
  async function add() {
    const words = text.trim();
    if (!words) return;
    // Dates and times in what you type are understood, as in Tasks ("call the bank Friday 10am").
    const libs = await (libsOnce ??= loadLibs()).catch(() => null);
    const c = libs ? parseCapture(words, new Date(), libs) : null;
    let ok = false;
    update(d => { const id = addTask(d.tasks, { title: c ? c.title : words, due: c?.date ?? null, time: c?.time ?? null, category: c?.category ?? 'admin' }); if (!id) return false; d.tasks.items.find(t => t.id === id)!.projectId = p.id; ok = true; });
    if (!ok) return;
    setText('');
    toast(c?.date ? `Added — ${prettyDate(c.date)}${c.time ? `, ${c.time}` : ''}.` : 'Added.');
  }
  return (
    <Card aria-labelledby="projectTasksH" id="projectTasks">
      <h3 id="projectTasksH">Tasks <span className="text-fg-3 font-normal tabular-nums">{open.length}</span></h3>
      {open.length > 0 ? <ul className="list-none p-0 m-0">{open.map(t => <TaskRow key={t.id} data={data} t={t} hideProject />)}</ul>
        : <Note className="mt-0">{done.length ? 'Everything here is done.' : 'No tasks yet. Break it into small steps when you\'re ready.'}</Note>}
      <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-3" onSubmit={e => { e.preventDefault(); add(); }}>
        <Field label="Add a task" htmlFor="projectTaskNew"><TextInput id="projectTaskNew" value={text} maxLength={200} onChange={e => setText(e.target.value)} placeholder="e.g. Ask Sam about suppliers on Friday" /></Field>
        <Button inline type="submit" data-action="project-task-add" disabled={!text.trim()}><Plus size={18} aria-hidden="true" /> Add</Button>
      </form>
      {done.length > 0 && (
        <>
          <button type="button" className="w-full flex justify-between items-center min-h-11 mt-2 bg-transparent border-0 p-0 text-fg-2 cursor-pointer" aria-expanded={showDone} data-action="project-done-toggle" onClick={() => setShowDone(!showDone)}>
            <span>Done <span className="tabular-nums">{done.length}</span></span><span className="text-primary font-semibold text-[15px]">{showDone ? 'Hide' : 'Show'}</span>
          </button>
          {showDone && <ul className="list-none p-0 m-0">{done.map(t => <TaskRow key={t.id} data={data} t={t} hideProject />)}</ul>}
        </>
      )}
    </Card>
  );
}

function NotesCard({ data, p }: { data: MyDayData; p: Project }) {
  const notes = projectNotes(data, p), maybe = mightBelong(data, p);
  const others = data.notes.items.filter(n => !n.projectId && (n.title.trim() || n.text.trim())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 40);
  function newNote() {
    let id = '';
    update(d => { id = addNote(d.notes); d.notes.items.find(n => n.id === id)!.projectId = p.id; });
    if (id) location.hash = `projects/notes/${id}`;
  }
  return (
    <Card aria-labelledby="projectNotesH" id="projectNotes">
      <h3 id="projectNotesH">Notes <span className="text-fg-3 font-normal tabular-nums">{notes.length}</span></h3>
      {notes.length > 0 ? (
        <ul className="list-none p-0 m-0">
          {notes.map(n => (
            <li key={n.id} className="border-t border-outline first:border-t-0">
              <a href={`#projects/notes/${n.id}`} className="flex justify-between gap-3 items-baseline min-h-11 py-2 text-fg no-underline hover:bg-surface-2 rounded-tile -mx-2 px-2" data-id={n.id} data-s="project-note">
                <span className="min-w-0 break-words font-medium">{noteName(n)}{n.linkedBy && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary align-middle" data-s="by-myday"><Sparkles size={12} aria-hidden="true" /> {n.linkedBy === 'ai' ? 'connected by AI' : 'connected by MyDay'}</span>}</span><span className="flex-none text-sm text-fg-3 tabular-nums">{shortDate(n.updatedAt.slice(0, 10))}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : <Note className="mt-0">Thoughts, research and anything you find out can live here. Notes that clearly belong here are added by themselves.</Note>}
      {maybe.length > 0 && (
        <div className="mt-3 rounded-tile bg-surface-2 border border-outline px-3 py-2" id="projectMaybe">
          <p className="text-sm font-semibold text-fg-2 m-0">Might belong here</p>
          <ul className="list-none p-0 m-0">
            {maybe.map(m => (
              <li key={m.note.id} className="flex flex-wrap items-center gap-x-2 border-t border-outline first:border-t-0" data-id={m.note.id} data-s="maybe">
                <a href={`#projects/notes/${m.note.id}`} className="flex-1 min-w-[10rem] min-h-11 py-1.5 text-fg no-underline"><span className="block break-words">{noteName(m.note)}</span><span className="block text-sm text-fg-3">{bothMention(m.why)}</span></a>
                <Button inline variant="ghost" className="!border-transparent !text-primary" data-action="maybe-add" data-id={m.note.id} onClick={() => { if (update(d => (linkNote(d, m.note.id, p.id) ? undefined : false))) toast('Note added to this project.'); }}>Add</Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2.5 mt-3">
        <Button inline data-action="project-note-new" onClick={newNote}><NotebookPen size={18} aria-hidden="true" /> New note</Button>
      </div>
      {others.length > 0 && (
        <Field label="Add a note you already have" htmlFor="projectNoteLink" className="mt-3">
          <Select id="projectNoteLink" value="" onChange={e => { const v = e.target.value; if (v && update(d => (linkNote(d, v, p.id) ? undefined : false))) toast('Note added to this project.'); }}>
            <option value="">Choose a note…</option>
            {others.map(n => <option key={n.id} value={n.id}>{noteName(n)}</option>)}
          </Select>
        </Field>
      )}
    </Card>
  );
}

// What's coming up: this project's dated tasks and appointments, in time order, and a way to add an appointment.
function ComingUpCard({ data, p }: { data: MyDayData; p: Project }) {
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ title: '', date: todayKey(), start: '', end: '' });
  const items = comingUp(data, p);
  function add() {
    if (!f.date || !f.start) return;
    if (addAppointment(f.title || p.title, f.date, f.start, f.end || null, p.id)) {
      toast('Appointment added — it\'s on your Calendar too.');
      setAdding(false); setF({ title: '', date: todayKey(), start: '', end: '' });
    }
  }
  return (
    <Card aria-labelledby="projectSoonH" id="projectSoon">
      <h3 id="projectSoonH">Coming up</h3>
      {items.length ? (
        <ul className="list-none p-0 m-0">
          {items.map(x => x.kind === 'task' ? (
            <li key={'t' + x.task.id} className="border-t border-outline first:border-t-0 py-2" data-s="soon-task">
              <a href={`#today/tasks/${x.task.id}`} className="block min-h-11 text-fg no-underline"><span className="block text-sm text-fg-3 tabular-nums">{prettyDate(x.task.due!)}{x.task.time ? ` · ${x.task.time}` : ''}</span><span className="font-medium break-words">{x.task.title}</span></a>
            </li>
          ) : (
            <li key={'a' + x.appt.id} className="border-t border-outline first:border-t-0 py-2 flex items-start justify-between gap-2" data-s="soon-appt">
              <span className="min-w-0"><span className="block text-sm text-fg-3 tabular-nums">{prettyDate(x.appt.start.slice(0, 10))} · {x.appt.start.slice(11)}–{x.appt.end.slice(11)}</span>
                <span className="font-medium break-words">{x.appt.title}</span> <span className="text-xs font-bold uppercase tracking-[.06em] px-1.5 py-0.5 rounded-md bg-appt-c text-appt">Appt</span></span>
              <Button inline variant="ghost" className="flex-none !px-3" aria-label={`Remove "${x.appt.title}" from this project (it stays on your Calendar)`} data-action="project-appt-unlink"
                onClick={() => { if (update(d => (unlinkAppointment(d, p.id, x.appt.id) ? undefined : false))) toast('Removed from the project — still on your Calendar.'); }}>Unlink</Button>
            </li>
          ))}
        </ul>
      ) : <Note className="mt-0">Nothing dated yet. Tasks with a date, and appointments, show here.</Note>}
      {adding ? (
        <form className="grid gap-3 mt-3" onSubmit={e => { e.preventDefault(); add(); }} id="projectApptForm">
          <Field label="Appointment" htmlFor="pjApptTitle"><TextInput id="pjApptTitle" value={f.title} maxLength={120} placeholder={p.title} onChange={e => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Date" htmlFor="pjApptDate"><TextInput id="pjApptDate" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts" htmlFor="pjApptStart" className="min-w-0"><TextInput id="pjApptStart" type="time" className="min-w-0" value={f.start} onChange={e => setF({ ...f, start: e.target.value })} /></Field>
            <Field label="Ends (optional)" htmlFor="pjApptEnd" className="min-w-0"><TextInput id="pjApptEnd" type="time" className="min-w-0" value={f.end} onChange={e => setF({ ...f, end: e.target.value })} /></Field>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button inline type="submit" variant="primary" data-action="project-appt-save" disabled={!f.date || !f.start}>Add appointment</Button>
            <Button inline variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      ) : <Button inline className="mt-3" data-action="project-appt-add" onClick={() => setAdding(true)}><CalendarPlus size={18} aria-hidden="true" /> Add an appointment</Button>}
    </Card>
  );
}

// How far it has come, in plain counts and small squares (done ones green) — never a percentage or a score.
function ProgressCard({ data, p }: { data: MyDayData; p: Project }) {
  const { open, done } = projectTasks(data, p), shown = Math.min(24, open.length + done.length);
  const dones = Math.min(done.length, shown);
  return (
    <Card aria-labelledby="projectProgressH" id="projectProgress">
      <h3 id="projectProgressH">How it's going</h3>
      {open.length + done.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-1.5" aria-hidden="true">
            {Array.from({ length: shown }, (_, i) => <span key={i} className={`size-4 rounded-[5px] ${i < dones ? 'bg-done' : 'bg-track'}`} />)}
          </div>
          <p className="text-[15px] m-0 mt-2" data-s="project-counts">{done.length} done · {open.length} to go</p>
        </>
      ) : <Note className="mt-0">Steps you finish will show here.</Note>}
      <p className="text-sm text-fg-3 m-0 mt-2 tabular-nums">Started {shortDate(p.createdAt.slice(0, 10))} · last worked on {shortDate(lastActivity(data, p).slice(0, 10))}</p>
    </Card>
  );
}

function ManageCard({ p }: { p: Project }) {
  const confirm = useConfirm();
  const status = (s: Project['status'], msg: string) => { if (update(d => (editProject(d, p.id, { status: s }) ? undefined : false))) toast(msg); };
  async function remove() {
    const yes = await confirm({ title: 'Delete this project?', body: 'Its notes, tasks and appointments stay where they are — they just won\'t be linked to a project any more.', confirmLabel: 'Delete project', cancelLabel: 'Keep it' });
    if (!yes) return;
    if (update(d => (deleteProject(d, p.id) ? undefined : false))) { toast('Project deleted. Its notes and tasks are still here.'); location.hash = 'projects'; }
  }
  return (
    <Card aria-label="Project status" id="projectManage">
      <div className="grid gap-2.5">
        {p.status === 'active' ? <Button inline variant="ghost" className="w-full" data-action="project-pause" onClick={() => status('paused', 'Paused — it\'ll be here when you come back to it.')}><Pause size={18} aria-hidden="true" /> Pause for now</Button>
          : <Button inline variant="ghost" className="w-full" data-action="project-resume" onClick={() => status('active', 'Back in your projects.')}><Play size={18} aria-hidden="true" /> {p.status === 'done' ? 'Open it again' : 'Pick it up again'}</Button>}
        {p.status !== 'done' && <Button inline variant="ghost" className="w-full" data-action="project-finish" onClick={() => status('done', 'Marked done — well done.')}><Check size={18} aria-hidden="true" /> Mark as done</Button>}
        <Button inline variant="ghost" className="w-full" data-action="project-delete" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Delete project</Button>
      </div>
    </Card>
  );
}
