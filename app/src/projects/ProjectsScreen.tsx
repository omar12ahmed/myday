import { ArrowLeft, ArrowRight, FolderKanban, Lock, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { isBusiness, isCase, setTemplate, TEMPLATES, type TemplateChoice } from '../data/businessModel';
import { inFocus } from '../data/weekReview';
import { shortDate } from '../data/dates';
import { addProject, board, COLUMNS, lastActivity, moveToColumn, nextStep, PROJECT_LIMITS, projectAppointments, projectNotes, projectsInOrder, projectTasks, stageOf, type BoardColumn } from '../data/projects';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData, Project } from '../data/types';
import { NotesScreen } from '../notes/NotesScreen';
import { ConnectionsView } from './ConnectionsView';
import { Progression } from './parts';
import { ProjectView, type ProjectTab } from './ProjectView';

// Projects (called the Inbox until 1.12.0): your projects (#projects, one project at #projects/p/<id>), your notes
// (#projects/notes…) and how they connect (#projects/connections, the knowledge graph). A project gathers everything
// about one intention; notes are the raw material, linked to a project or not (yet).
export function ProjectsScreen({ data, hash }: { data: MyDayData; hash: string }) {
  const parts = hash.replace('#', '').split('/').map(decodeURIComponent);
  if (parts[1] === 'p' && parts[2]) return <div className="max-w-[1000px] mx-auto"><ProjectView key={parts[2]} data={data} id={parts[2]} tab={['model', 'milestones', 'decisions', 'timeline', 'evidence', 'issues'].includes(parts[3]) ? parts[3] as ProjectTab : 'overview'} /></div>;
  const tab = parts[1] === 'notes' ? 'notes' : parts[1] === 'connections' ? 'connections' : 'projects';
  const tabClass = (on: boolean) => `seg-link flex-1 inline-flex items-center justify-center gap-1.5 min-h-11 rounded-xl text-[15px] font-semibold no-underline ${on ? 'on bg-primary-container text-on-primary-container' : 'text-fg-2'}`;
  return (
    <div className={tab === 'notes' ? 'max-w-[720px] mx-auto' : 'max-w-[1000px] mx-auto'}>
      <Card className="section-tabs !p-2.5 max-w-[720px] mx-auto">
        <div className="seg flex gap-1.5" role="tablist" aria-label="Projects, notes and connections">
          <a className={tabClass(tab === 'projects')} href="#projects" role="tab" aria-selected={tab === 'projects'}>Projects</a>
          <a className={tabClass(tab === 'notes')} href="#projects/notes" role="tab" aria-selected={tab === 'notes'}>Notes</a>
          <a className={tabClass(tab === 'connections')} href="#projects/connections" role="tab" aria-selected={tab === 'connections'}>Connections</a>
        </div>
      </Card>
      {tab === 'notes' ? <NotesScreen data={data} hash={hash} /> : tab === 'connections' ? <ConnectionsView data={data} /> : <ProjectsHome data={data} />}
    </div>
  );
}

function ProjectsHome({ data }: { data: MyDayData }) {
  const [text, setText] = useState('');
  const [kind, setKind] = useState<TemplateChoice>('general');
  const active = projectsInOrder(data, 'active'), paused = projectsInOrder(data, 'paused'), done = projectsInOrder(data, 'done');
  function start() {
    let id: string | null = null;
    update(d => { id = addProject(d, text); if (!id) return false; if (kind !== 'general') setTemplate(d, id, kind); });
    if (!id) return;
    setText(''); setKind('general');
    // A business idea opens on its one page: the four questions are where it starts.
    toast(kind === 'business' ? 'Business idea started — four simple questions put it on one page.' : kind === 'case' ? 'Case started — its timeline, evidence and issues each have a tab.' : 'Project started — everything about it can live here.');
    location.hash = kind === 'business' ? `projects/p/${id}/model` : `projects/p/${id}`;
  }
  return (
    <>
      <Card aria-labelledby="projects-h" id="projectsIntro" className="max-w-[720px] mx-auto">
        <h2 id="projects-h" className="flex items-center gap-2"><FolderKanban size={22} aria-hidden="true" className="text-primary" /> Your projects</h2>
        <p className="text-[15px] text-fg-2 m-0">One place for everything about one intention — from a vague idea to small steps on your days.</p>
        <a href="#review" className="inline-flex items-center min-h-11 text-primary font-semibold text-[15px] no-underline hover:underline underline-offset-4" data-action="open-review">Look back at your week</a>
        <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-4" onSubmit={e => { e.preventDefault(); start(); }}>
          <Field label="Start a project" htmlFor="projectNew">
            <TextInput id="projectNew" value={text} maxLength={PROJECT_LIMITS.title} onChange={e => setText(e.target.value)} placeholder="e.g. A coffee subscription for offices" />
          </Field>
          <Button inline type="submit" variant="primary" data-action="project-add" disabled={!text.trim()}><Plus size={18} aria-hidden="true" /> Start</Button>
          <div className="col-span-2 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Kind of project" data-s="project-kind">
            {TEMPLATES.map(t => (
              // The radio itself covers its whole label, border included (a 44 px tap target), and is drawn as the dot beside the words.
              <label key={t.id} className="group relative inline-flex items-center gap-2 min-h-11 px-3 rounded-btn border border-outline text-[14px] font-semibold text-fg-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:text-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
                <input type="radio" name="projectKind" value={t.id} className="absolute -inset-px m-0 opacity-0 cursor-pointer" checked={kind === t.id} onChange={() => setKind(t.id)} data-action="project-kind" />
                <span aria-hidden="true" className="grid place-items-center size-[18px] rounded-full border-2 border-outline-strong group-has-[:checked]:border-primary"><span className="hidden size-2 rounded-full bg-primary group-has-[:checked]:block" /></span>{t.label}
              </label>
            ))}
          </div>
        </form>
      </Card>
      {active.length > 0 ? <Board data={data} /> : (
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
                      <span className="font-medium">{p.title}{p.private && <Lock size={13} aria-label="Private" className="inline ml-1.5 text-fg-3 align-[-1px]" />}</span><span className="text-sm text-fg-3">{stageOf(p.stage).label}</span></a></li>
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

// Your active projects as a board (it takes the place of an idea wall elsewhere): Ideas · Exploring · Doing, by stage.
// One tap moves a project to the next or previous column. Past your own rule of thumb (three being explored, two being
// done), the column says so, gently — nothing is stopped. Columns stack on phones, sit side by side on wide screens.
const moved = (to: BoardColumn) => COLUMNS.find(c => c.id === to)!.label;
function Board({ data }: { data: MyDayData }) {
  const cols = board(data);
  function move(p: Project, to: BoardColumn) {
    if (!update(d => (moveToColumn(d, p.id, to) ? undefined : false))) return;
    const col = COLUMNS.find(c => c.id === to)!, n = cols[to].length + 1;
    toast(col.most && n > col.most ? `Moved to ${moved(to)} — that's ${n} there now. ${col.most === 3 ? 'Three' : 'Two'} at a time is plenty; pausing one is fine.` : `Moved to ${moved(to)}.`);
  }
  return (
    <div className="grid gap-x-4 gap-y-2 lg:grid-cols-3 items-start mb-4" id="projectList">
      {COLUMNS.map((c, i) => {
        const list = cols[c.id], many = c.most !== null && list.length > c.most;
        return (
          <section key={c.id} aria-labelledby={`col-${c.id}`} className="min-w-0" data-column={c.id}>
            <h3 id={`col-${c.id}`} className="flex items-baseline gap-2 m-0 mt-2">{c.label} <span className="text-fg-3 font-normal tabular-nums">{list.length}</span></h3>
            <p className="text-sm text-fg-3 m-0 mb-2.5">{c.hint}</p>
            {many && <p className="text-sm rounded-tile bg-surface-2 border border-outline px-3 py-2 m-0 mb-2.5" data-s="column-many">{list.length} here at once. Your rule of thumb is {c.most === 3 ? 'three' : 'two'} at a time — pausing one is fine, it'll keep.</p>}
            {list.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {list.map(p => <ProjectCard key={p.id} data={data} p={p} back={i > 0 ? COLUMNS[i - 1].id : null} on={i < COLUMNS.length - 1 ? COLUMNS[i + 1].id : null} onMove={to => move(p, to)} />)}
              </div>
            ) : <p className="text-sm text-fg-3 m-0 mb-3 rounded-tile border border-dashed border-outline px-3 py-3" data-s="column-empty">Nothing here right now.</p>}
          </section>
        );
      })}
    </div>
  );
}

// A project at a glance: its stage on the progression, its one next step, and what's in it — and the board's moves.
function ProjectCard({ data, p, back, on, onMove }: { data: MyDayData; p: Project; back: BoardColumn | null; on: BoardColumn | null; onMove: (to: BoardColumn) => void }) {
  const step = nextStep(data, p), t = projectTasks(data, p), notes = projectNotes(data, p).length, appts = projectAppointments(data, p).length;
  const bits = [notes && `${notes} note${notes === 1 ? '' : 's'}`, t.open.length && `${t.open.length} to do`, t.done.length && `${t.done.length} done`, appts && `${appts} appointment${appts === 1 ? '' : 's'}`].filter(Boolean);
  return (
    <div className="project-card flex flex-col rounded-card border border-outline bg-surface shadow-card text-fg" data-id={p.id}>
    <a href={`#projects/p/${p.id}`} className="group flex flex-col gap-3 p-5 pb-3 text-fg no-underline rounded-t-card hover:bg-surface-2 transition-colors">
      <span className="flex items-center justify-between gap-2">
        <span className="flex flex-wrap items-baseline gap-x-2 min-w-0"><span className="text-xs font-bold tracking-[.08em] uppercase text-primary" data-s="project-stage">{stageOf(p.stage).label}</span>{(isBusiness(p) || isCase(p)) && <span className="text-xs text-fg-3" data-s="project-kind-label">{isCase(p) ? 'Case' : 'Business idea'}</span>}{inFocus(p) && <span className="text-xs font-semibold text-primary" data-s="project-focus">This week’s focus</span>}</span>
        <span className="flex items-center gap-1.5 text-xs text-fg-3 tabular-nums">{p.private && <Lock size={13} aria-label="Private" data-s="project-private" />}{shortDate(lastActivity(data, p).slice(0, 10))}</span>
      </span>
      <span className="block text-[19px] font-bold leading-snug tracking-[-.01em] break-words">{p.title}</span>
      <Progression stage={p.stage} compact />
      <span className="block text-[15px] text-fg-2" data-s="project-next">{step ? <><span className="font-semibold text-fg">Next:</span> {step.title}</> : 'No next step yet — what\'s the smallest one?'}</span>
      {bits.length > 0 && <span className="block text-sm text-fg-3">{bits.join(' · ')}</span>}
    </a>
    <div className="flex flex-wrap justify-between gap-2 px-3 pb-3 mt-auto" data-s="project-moves">
      {back ? <Button inline variant="ghost" className="!px-3 !text-[14px]" data-action="project-back" aria-label={`Move “${p.title}” back to ${moved(back)}`} onClick={() => onMove(back)}><ArrowLeft size={16} aria-hidden="true" /> {moved(back)}</Button> : <span />}
      {on && <Button inline variant="ghost" className="!px-3 !text-[14px]" data-action="project-on" aria-label={`Move “${p.title}” on to ${moved(on)}`} onClick={() => onMove(on)}>{moved(on)} <ArrowRight size={16} aria-hidden="true" /></Button>}
    </div>
    </div>
  );
}
