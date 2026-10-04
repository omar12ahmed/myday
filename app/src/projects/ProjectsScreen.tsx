import { FolderKanban, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { shortDate } from '../data/dates';
import { addProject, lastActivity, nextStep, PROJECT_LIMITS, projectAppointments, projectNotes, projectsInOrder, projectTasks, stageOf } from '../data/projects';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData, Project } from '../data/types';
import { NotesScreen } from '../notes/NotesScreen';
import { Progression } from './parts';
import { ProjectView } from './ProjectView';

// Projects (called the Inbox until 1.12.0): your projects (#projects, one project at #projects/p/<id>) and your notes
// (#projects/notes…). A project gathers everything about one intention; notes are the raw material, linked to a project
// or not (yet).
export function ProjectsScreen({ data, hash }: { data: MyDayData; hash: string }) {
  const parts = hash.replace('#', '').split('/').map(decodeURIComponent);
  if (parts[1] === 'p' && parts[2]) return <div className="max-w-[1000px] mx-auto"><ProjectView key={parts[2]} data={data} id={parts[2]} /></div>;
  const tab = parts[1] === 'notes' ? 'notes' : 'projects';
  const tabClass = (on: boolean) => `seg-link flex-1 inline-flex items-center justify-center gap-1.5 min-h-11 rounded-xl text-[15px] font-semibold no-underline ${on ? 'on bg-primary-container text-on-primary-container' : 'text-fg-2'}`;
  return (
    <div className={tab === 'projects' ? 'max-w-[1000px] mx-auto' : 'max-w-[720px] mx-auto'}>
      <Card className="section-tabs !p-2.5 max-w-[720px] mx-auto">
        <div className="seg flex gap-1.5" role="tablist" aria-label="Projects and notes">
          <a className={tabClass(tab === 'projects')} href="#projects" role="tab" aria-selected={tab === 'projects'}>Projects</a>
          <a className={tabClass(tab === 'notes')} href="#projects/notes" role="tab" aria-selected={tab === 'notes'}>Notes</a>
        </div>
      </Card>
      {tab === 'notes' ? <NotesScreen data={data} hash={hash} /> : <ProjectsHome data={data} />}
    </div>
  );
}

function ProjectsHome({ data }: { data: MyDayData }) {
  const [text, setText] = useState('');
  const active = projectsInOrder(data, 'active'), paused = projectsInOrder(data, 'paused'), done = projectsInOrder(data, 'done');
  function start() {
    let id: string | null = null;
    update(d => { id = addProject(d, text); if (!id) return false; });
    if (!id) return;
    setText('');
    toast('Project started — everything about it can live here.');
    location.hash = `projects/p/${id}`;
  }
  return (
    <>
      <Card aria-labelledby="projects-h" id="projectsIntro" className="max-w-[720px] mx-auto">
        <h2 id="projects-h" className="flex items-center gap-2"><FolderKanban size={22} aria-hidden="true" className="text-primary" /> Your projects</h2>
        <p className="text-[15px] text-fg-2 m-0">One place for everything about one intention — from a vague idea to small steps on your days.</p>
        <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-4" onSubmit={e => { e.preventDefault(); start(); }}>
          <Field label="Start a project" htmlFor="projectNew">
            <TextInput id="projectNew" value={text} maxLength={PROJECT_LIMITS.title} onChange={e => setText(e.target.value)} placeholder="e.g. A coffee subscription for offices" />
          </Field>
          <Button inline type="submit" variant="primary" data-action="project-add" disabled={!text.trim()}><Plus size={18} aria-hidden="true" /> Start</Button>
        </form>
      </Card>
      {active.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4" id="projectList">
          {active.map(p => <ProjectCard key={p.id} data={data} p={p} />)}
        </div>
      ) : (
        <Card id="projectsEmpty" className="max-w-[720px] mx-auto">
          <p className="text-[15px] text-fg-2 m-0">No projects yet. Anything you'd like to make happen can be one — "Start a podcast", "Move house",
            "Arabic for travel". Start with just a name; the rest can come later.</p>
        </Card>
      )}
      {(paused.length > 0 || done.length > 0) && (
        <div className="max-w-[720px] mx-auto">
          {([['paused', 'Paused', paused], ['done', 'Done', done]] as [string, string, Project[]][]).map(([key, label, list]) => list.length > 0 && (
            <Card key={key} aria-labelledby={`pj-${key}`} id={`projects-${key}`}>
              <details>
                <summary className="flex justify-between items-center min-h-11 list-none"><h3 id={`pj-${key}`} className="m-0">{label} <span className="text-fg-3 font-normal tabular-nums">{list.length}</span></h3><span className="text-primary font-semibold text-[15px]">Show</span></summary>
                <ul className="list-none p-0 m-0 mt-1">
                  {list.map(p => (
                    <li key={p.id} className="border-t border-outline first:border-t-0"><a href={`#projects/p/${p.id}`} className="flex justify-between gap-3 items-center min-h-11 py-2 text-fg no-underline" data-id={p.id}>
                      <span className="font-medium">{p.title}</span><span className="text-sm text-fg-3">{stageOf(p.stage).label}</span></a></li>
                  ))}
                </ul>
              </details>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

// A project at a glance: its stage on the progression, its one next step, and what's in it.
function ProjectCard({ data, p }: { data: MyDayData; p: Project }) {
  const step = nextStep(data, p), t = projectTasks(data, p), notes = projectNotes(data, p).length, appts = projectAppointments(data, p).length;
  const bits = [notes && `${notes} note${notes === 1 ? '' : 's'}`, t.open.length && `${t.open.length} to do`, t.done.length && `${t.done.length} done`, appts && `${appts} appointment${appts === 1 ? '' : 's'}`].filter(Boolean);
  return (
    <a href={`#projects/p/${p.id}`} className="project-card group flex flex-col gap-3 rounded-card border border-outline bg-surface shadow-card p-5 text-fg no-underline transition-[translate,box-shadow] duration-150 hover:-translate-y-0.5" data-id={p.id}>
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-[.08em] uppercase text-primary" data-s="project-stage">{stageOf(p.stage).label}</span>
        <span className="text-xs text-fg-3 tabular-nums">{shortDate(lastActivity(data, p).slice(0, 10))}</span>
      </span>
      <span className="block text-[19px] font-bold leading-snug tracking-[-.01em] break-words">{p.title}</span>
      <Progression stage={p.stage} compact />
      <span className="block text-[15px] text-fg-2" data-s="project-next">{step ? <><span className="font-semibold text-fg">Next:</span> {step.title}</> : 'No next step yet — what\'s the smallest one?'}</span>
      {bits.length > 0 && <span className="block text-sm text-fg-3 mt-auto">{bits.join(' · ')}</span>}
    </a>
  );
}
