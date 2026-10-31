import { ArrowLeft, ArrowRight, FolderKanban, Hourglass, Lock, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { Saying } from '../components/Saying';
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
import { HomelessDeletedFiles } from '../files/FilesCard';
import { NeedsYouCard, ProjectList } from './NeedsYou';
import { needsYou } from '../data/attention';
import { awayFor, awayWords, isAway } from '../data/welcomeBack';
import { isProjectWaiting, waitLine } from '../data/projectWaiting';
import { archive, AREA_COLOURS, areaOfProject, areasOf, areaVar, COLOUR_LABEL, finishedLabel, recolourArea, renameArea, sameArea, tidyArea, type Area } from '../data/areas';
import { editProject } from '../data/projects';
import { CommitInput } from '../components/Field';
import { AreaDot, AreaLabel } from './AreaBits';

// Projects (called the Inbox until 1.12.0): your projects (#projects, one project at #projects/p/<id>), your notes
// (#projects/notes…) and how they connect (#projects/connections, the knowledge graph). A project gathers everything
// about one intention; notes are the raw material, linked to a project or not (yet).
export function ProjectsScreen({ data, hash }: { data: MyDayData; hash: string }) {
  const parts = hash.replace('#', '').split('/').map(decodeURIComponent);
  if (parts[1] === 'p' && parts[2]) return <div className="max-w-[1000px] mx-auto"><ProjectView key={parts[2]} data={data} id={parts[2]} tab={['model', 'money', 'milestones', 'decisions', 'timeline', 'evidence', 'issues', 'research', 'videos'].includes(parts[3]) ? parts[3] as ProjectTab : 'overview'} sub={parts[3] === 'videos' ? parts[4] : undefined} /></div>;
  const tab = parts[1] === 'notes' ? 'notes' : parts[1] === 'connections' ? 'connections' : 'projects';
  const tabClass = (on: boolean) => `seg-link flex-1 inline-flex items-center justify-center gap-1.5 min-h-11 rounded-xl text-[15px] font-semibold no-underline ${on ? 'on bg-primary-container text-on-primary-container' : 'text-fg-2'}`;
  return (
    <div className={tab === 'notes' ? 'max-w-[720px] mx-auto' : 'projects-workspace'}>
      <Card className="section-tabs max-w-[720px] mx-auto">
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

// The Projects home's Board · List choice, kept on this device (`myday.projects.view`; anything else reads as the board).
const VIEW_KEY = 'myday.projects.view';
const savedView = (): 'board' | 'list' => { try { return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'board'; } catch { return 'board'; } };
// The area shown (specs/projects-areas-archive.md), likewise kept on this device (`myday.projects.area`): 'all', 'none'
// or an area's name; an area no longer used reads as all.
const AREA_KEY = 'myday.projects.area';
const savedArea = () => { try { return localStorage.getItem(AREA_KEY) || 'all'; } catch { return 'all'; } };
// Puts focus back after a change took away what had it (and only then: a change made by moving on leaves focus be).
const refocus = (find: () => HTMLElement | null | undefined) => requestAnimationFrame(() => { if (!document.activeElement || document.activeElement === document.body) find()?.focus(); });
function ProjectsHome({ data }: { data: MyDayData }) {
  const [text, setText] = useState('');
  const [kind, setKind] = useState<TemplateChoice>('general');
  const [view, setView] = useState<'board' | 'list'>(savedView);
  const [areaPick, setAreaPick] = useState(savedArea), [managing, setManaging] = useState(false);
  const areas = areasOf(data), pick = areaPick === 'all' || areaPick === 'none' || areas.some(a => sameArea(a.name, areaPick)) ? areaPick : 'all';
  const fits = (p: Project) => (pick === 'all' ? true : pick === 'none' ? !p.area : !!p.area && sameArea(p.area, pick));
  const showArea = (a: string) => { setAreaPick(a); try { localStorage.setItem(AREA_KEY, a); } catch { /* kept for this visit */ } };
  const allActive = projectsInOrder(data, 'active'), active = allActive.filter(fits), paused = projectsInOrder(data, 'paused').filter(fits), done = archive(data);
  const noArea = allActive.filter(p => !p.area).length;
  const needs = useMemo(() => needsYou(data), [data]); // once per change of your data, for the card and the list
  const show = (v: 'board' | 'list') => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* storage unavailable: kept for this visit */ } };
  function start() {
    let id: string | null = null;
    const saved = update(d => { id = addProject(d, text); if (!id) return false; if (kind !== 'general') setTemplate(d, id, kind); });
    if (!saved) return;
    if (!id) return;
    setText(''); setKind('general');
    // A business idea opens on its one page: the four questions are where it starts.
    toast(kind === 'business' ? 'Business idea started — four simple questions put it on one page.' : kind === 'case' ? 'Case started — its timeline, evidence and issues each have a tab.' : 'Project started — everything about it can live here.');
    location.hash = kind === 'business' ? `projects/p/${id}/model` : `projects/p/${id}`;
  }
  return (
    <>
      {active.length > 0 && <NeedsYouCard data={data} all={needs} />}
      <Card aria-labelledby="projects-h" id="projectsIntro" className="max-w-[720px] mx-auto">
        <div className="projects-intro-copy">
          <h2 id="projects-h" className="flex items-center gap-2"><FolderKanban size={22} aria-hidden="true" className="text-primary" /> Your projects</h2>
          <p className="text-[15px] text-fg-2 m-0">One place for everything about one intention — from a vague idea to small steps on your days.</p>
          <Saying place="projects" className="mt-3" />
          <a href="#review" className="inline-flex items-center min-h-11 text-primary font-semibold text-[15px] no-underline hover:underline underline-offset-4" data-action="open-review">Look back at your week</a>
        </div>
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
      {areas.length > 0 && (
        // Areas (specs/projects-areas-archive.md): show one, kept on this device; each with its dot and count.
        <div className="mb-2" data-s="project-areas">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Show an area">
            <Button inline variant={pick === 'all' ? 'selected' : 'ghost'} aria-pressed={pick === 'all'} className="!min-h-11" data-action="area-pick" data-id="all" onClick={() => showArea('all')}>All <span className="tabular-nums text-fg-2">{allActive.length}</span></Button>
            {areas.map(a => (
              <Button key={a.name} inline variant={pick !== 'all' && pick !== 'none' && sameArea(pick, a.name) ? 'selected' : 'ghost'} aria-pressed={pick !== 'all' && pick !== 'none' && sameArea(pick, a.name)} className="!min-h-11" data-action="area-pick" data-id={a.name} onClick={() => showArea(a.name)}>
                <AreaDot colour={a.colour} /> {a.name} <span className="tabular-nums text-fg-2">{a.count}</span>
              </Button>
            ))}
            {noArea > 0 && <Button inline variant={pick === 'none' ? 'selected' : 'ghost'} aria-pressed={pick === 'none'} className="!min-h-11" data-action="area-pick" data-id="none" onClick={() => showArea('none')}>No area <span className="tabular-nums text-fg-2">{noArea}</span></Button>}
            <Button inline variant="ghost" className="!min-h-11" aria-expanded={managing} data-action="areas-manage" onClick={() => setManaging(!managing)}>Areas…</Button>
          </div>
          {managing && <AreasPanel areas={areas} />}
        </div>
      )}
      {allActive.length > 0 && (
        // Board or List, remembered on this device only (not your data, not synced).
        <div className="flex flex-wrap gap-2 mb-1" role="group" aria-label="Show your projects as" data-s="projects-view">
          {(['board', 'list'] as const).map(v => <Button key={v} inline variant={view === v ? 'selected' : 'ghost'} aria-pressed={view === v} className="!min-h-11" data-action="projects-view" data-id={v} onClick={() => show(v)}>{v === 'board' ? 'Board' : 'List'}</Button>)}
        </div>
      )}
      {allActive.length > 0 && !active.length && <Card className="max-w-[720px] mx-auto" data-s="area-empty"><p className="m-0 text-[15px] text-fg-2">{pick === 'none' ? 'No active projects without an area right now.' : `No active projects in “${pick}” right now.`}</p></Card>}
      {active.length > 0 ? (view === 'list' ? <ProjectList data={data} all={needs} fits={fits} grouped={pick === 'all' && areas.length > 0} /> : <Board data={data} fits={fits} />) : allActive.length > 0 ? null : (
        <Card id="projectsEmpty" className="max-w-[720px] mx-auto">
          <h3>No projects yet</h3>
          <p className="text-[15px] text-fg-2 m-0">Anything you'd like to make happen can be one — "Start a podcast", "Move house",
            "Arabic for travel". Start with just a name; the rest can come later.</p>
        </Card>
      )}
      {(paused.length > 0 || done.length > 0) && (
        <div className="max-w-[720px] mx-auto">
          {done.length > 0 && <ArchiveCard data={data} list={done} />}
          {([['paused', 'Paused', paused]] as [string, string, Project[]][]).map(([key, label, list]) => list.length > 0 && (
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
      <div className="max-w-[720px] mx-auto"><HomelessDeletedFiles data={data} /></div>
    </>
  );
}

// Your active projects as a board (it takes the place of an idea wall elsewhere): Ideas · Exploring · Doing, by stage.
// One tap moves a project to the next or previous column. Past your own rule of thumb (three being explored, two being
// done), the column says so, gently — nothing is stopped. Columns stack on phones, sit side by side on wide screens.
const moved = (to: BoardColumn) => COLUMNS.find(c => c.id === to)!.label;
// The archive (specs/projects-areas-archive.md): finished projects, the most recently finished first, each with its
// area and how it ended; one tap brings one back.
function ArchiveCard({ data, list }: { data: MyDayData; list: Project[] }) {
  function back(p: Project, i: number) {
    if (!update(d => (editProject(d, p.id, { status: 'active' }) ? undefined : false))) return;
    toast(`“${p.title}” is back in your projects.`);
    // Focus stays in the archive (the next one along, or its heading's toggle), or goes to the project brought back.
    refocus(() => { const rest = document.querySelectorAll<HTMLElement>('#projects-archive [data-action=archive-back]');
      return rest[Math.min(i, rest.length - 1)] ?? document.querySelector<HTMLElement>('#projects-archive summary') ?? document.querySelector<HTMLElement>(`.project-card[data-id="${p.id}"] a`); });
  }
  return (
    <Card aria-labelledby="pj-archive" id="projects-archive">
      <details>
        <summary className="flex justify-between items-center min-h-11 list-none"><h3 id="pj-archive" className="m-0">Archive <span className="text-fg-3 font-normal tabular-nums">{list.length}</span></h3><span className="text-primary font-semibold text-[15px]">Show</span></summary>
        <ul className="list-none p-0 m-0 mt-1">
          {list.map((p, i) => {
            const a = areaOfProject(data, p);
            return (
              <li key={p.id} className="border-t border-outline first:border-t-0 flex flex-wrap items-center gap-x-3 py-1" data-s="archive-row" data-id={p.id}>
                <a href={`#projects/p/${p.id}`} className="flex-1 min-w-[12rem] min-h-11 py-1.5 text-fg no-underline">
                  <span className="block font-medium break-words">{p.title}{p.private && <Lock size={13} aria-label="Private" className="inline ml-1.5 text-fg-3 align-[-1px]" />}</span>
                  <span className="flex flex-wrap items-center gap-x-2 text-sm text-fg-2">{a && <AreaLabel name={a.name} colour={a.colour} />}<span data-s="archive-how">{finishedLabel(p)}{p.finished?.on ? ` · ${shortDate(p.finished.on)}` : ''}</span></span>
                </a>
                <Button inline variant="ghost" data-action="archive-back" aria-label={`Bring back “${p.title}”`} onClick={() => back(p, i)}>Bring back</Button>
              </li>
            );
          })}
        </ul>
      </details>
    </Card>
  );
}

// Renaming an area (to one already used: the two become one) and choosing its colour.
function AreasPanel({ areas }: { areas: Area[] }) {
  return (
    <ul className="list-none p-0 m-0 mt-3 grid gap-3 rounded-tile bg-surface-2 border border-outline p-3" data-s="areas-panel" aria-label="Your areas">
      {areas.map((a, i) => (
        <li key={a.name} className="grid gap-2 sm:grid-cols-[minmax(0,18rem)_1fr] sm:items-end sm:gap-x-4" data-s="area-row" data-id={a.name}>
          <Field label={`Area: ${a.name}`} htmlFor={`area-${i}`}>
            <CommitInput id={`area-${i}`} key={a.name} defaultValue={a.name} maxLength={PROJECT_LIMITS.area}
              onCommit={el => { const to = tidyArea(el.value); if (!to) { el.value = a.name; return; } const into = areas.find(x => sameArea(x.name, to) && !sameArea(x.name, a.name));
                if (!update(d => (renameArea(d, a.name, to) ? undefined : false))) return;
                toast(into ? `Merged into “${into.name}”.` : `Renamed to “${to}”.`);
                // (the row is drawn again under its new name: focus goes back to its name)
                refocus(() => [...document.querySelectorAll<HTMLElement>('[data-s=area-row]')].find(r => sameArea(r.dataset.id ?? '', into?.name ?? to))?.querySelector('input')); }} />
          </Field>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Colour for ${a.name}`}>
            {AREA_COLOURS.map(c => (
              <button key={c} type="button" aria-pressed={a.colour === c} aria-label={COLOUR_LABEL[c]} title={COLOUR_LABEL[c]} data-action="area-colour" data-id={c}
                className={`size-11 grid place-items-center rounded-full border-2 cursor-pointer bg-transparent ${a.colour === c ? 'border-fg' : 'border-transparent'}`}
                onClick={() => update(d => (recolourArea(d, a.name, c) ? undefined : false))}>
                <span aria-hidden="true" className="block size-6 rounded-full" style={{ background: areaVar(c) }} />
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Board({ data, fits }: { data: MyDayData; fits: (p: Project) => boolean }) {
  const all = board(data), cols = { ideas: all.ideas.filter(fits), exploring: all.exploring.filter(fits), doing: all.doing.filter(fits) };
  // (Your rule of thumb is for you, not for each area: shown one area, a column still counts all of them.)
  function move(p: Project, to: BoardColumn) {
    if (!update(d => (moveToColumn(d, p.id, to) ? undefined : false))) return;
    const col = COLUMNS.find(c => c.id === to)!, n = all[to].length + 1;
    toast(col.most && n > col.most ? `Moved to ${moved(to)} — that's ${n} there now. ${col.most === 3 ? 'Three' : 'Two'} at a time is plenty; pausing one is fine.` : `Moved to ${moved(to)}.`);
  }
  return (
    <div className="grid gap-x-4 gap-y-2 lg:grid-cols-3 items-start mb-4" id="projectList">
      {COLUMNS.map((c, i) => {
        const list = cols[c.id], total = all[c.id].length, many = c.most !== null && total > c.most;
        return (
          <section key={c.id} aria-labelledby={`col-${c.id}`} className="min-w-0" data-column={c.id}>
            <h3 id={`col-${c.id}`} className="flex items-baseline gap-2 m-0 mt-2">{c.label} <span className="text-fg-3 font-normal tabular-nums">{list.length}</span></h3>
            <p className="text-sm text-fg-3 m-0 mb-2.5">{c.hint}</p>
            {many && <p className="text-sm rounded-tile bg-surface-2 border border-outline px-3 py-2 m-0 mb-2.5" data-s="column-many">{total} here at once{total > list.length ? ' across your areas' : ''}. Your rule of thumb is {c.most === 3 ? 'three' : 'two'} at a time — pausing one is fine, it'll keep.</p>}
            {list.length ? (
              <div className="project-cards grid gap-3">
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
  const area = areaOfProject(data, p); // (its area: a soft edge and its name — specs/projects-areas-archive.md)
  const step = nextStep(data, p), t = projectTasks(data, p), notes = projectNotes(data, p).length, appts = projectAppointments(data, p).length;
  const bits = [notes && `${notes} note${notes === 1 ? '' : 's'}`, t.open.length && `${t.open.length} to do`, t.done.length && `${t.done.length} done`, appts && `${appts} appointment${appts === 1 ? '' : 's'}`].filter(Boolean);
  return (
    <div className="project-card flex flex-col rounded-card border border-outline bg-surface shadow-card text-fg" data-id={p.id} data-area={area?.name ?? ''} style={area ? { borderLeft: `5px solid ${areaVar(area.colour)}` } : undefined}>
    <a href={`#projects/p/${p.id}`} className="group flex flex-col gap-3 p-5 pb-3 text-fg no-underline rounded-t-card hover:bg-surface-2 transition-colors">
      <span className="flex items-center justify-between gap-2">
        <span className="flex flex-wrap items-baseline gap-x-2 min-w-0"><span className="text-xs font-bold tracking-[.08em] uppercase text-primary" data-s="project-stage">{stageOf(p.stage).label}</span>{(isBusiness(p) || isCase(p)) && <span className="text-xs text-fg-3" data-s="project-kind-label">{isCase(p) ? 'Case' : 'Business idea'}</span>}{inFocus(p) && <span className="text-xs font-semibold text-primary" data-s="project-focus">This week’s focus</span>}</span>
        <span className="flex items-center gap-1.5 text-xs text-fg-3 tabular-nums">{p.private && <Lock size={13} aria-label="Private" data-s="project-private" />}{isAway(data, p) && !isProjectWaiting(p) ? <span data-s="project-away">Away {awayWords(awayFor(data, p))}</span> : shortDate(lastActivity(data, p).slice(0, 10))}</span>
      </span>
      <span className="block text-[19px] font-bold leading-snug tracking-[-.01em] break-words">{p.title}</span>
      {area && <AreaLabel name={area.name} colour={area.colour} className="-mt-1.5 text-sm font-semibold text-fg-2" />}
      {/* Waiting on someone or something as a whole (specs/projects-project-waiting.md): said instead of "Away". */}
      {isProjectWaiting(p) && <span className="flex items-start gap-1.5 -mt-1 text-sm font-semibold text-fg-2 break-words" data-s="project-waiting"><Hourglass size={15} aria-hidden="true" className="flex-none mt-0.5" />{waitLine(p.waiting)}</span>}
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
