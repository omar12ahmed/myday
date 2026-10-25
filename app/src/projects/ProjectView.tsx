import { ArrowUpRight, CalendarPlus, Check, Lock, NotebookPen, Pause, Pencil, Play, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { exploreHref, rememberExploreEntry, restoreExploreEntry } from '../explore/route';
import { addAppointment } from '../capture/save';
import { loadLibs, parseCapture, type CaptureLibs } from '../capture/parse';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CategoryChip } from '../components/CategoryChip';
import { useConfirm } from '../components/confirm';
import { CommitInput, CommitTextarea, Field, Select, TextArea, TextInput } from '../components/Field';
import { BackLink, Eyebrow, LinkButton, Note, NotFound } from '../components/parts';
import { Switch } from '../components/Switch';
import { prettyDate, relDay, shortDate, todayKey } from '../data/dates';
import { addNote, noteName } from '../data/notes';
import { isBusiness, isCase, isResearchKind, knownTemplate, setTemplate, TEMPLATES, type TemplateChoice } from '../data/businessModel';
import { hasResearch, setResearch } from '../data/research';
import { worthALook } from '../data/projectDashboard';
import { arrived, arriving, hiddenWords, isHidden, overviewSections, SECTIONS, setHidden, type HiddenWith, type Section } from '../data/projectSections';
import { comingUp, deleteProject, editProject, heldBack, setProjectPrivate, linkNote, nextStep, PROJECT_LIMITS, projectById, projectNotes, projectTasks, recently, setLeftOff, setNextStep, STATUS_LABEL, stillOpen, unlinkAppointment, whyNext } from '../data/projects';
import { update } from '../data/storage';
import { addTask, addToTodaysPlan, deadlineLabel, onTodaysPlan, planRoom, setTaskDone, stepsText, startsAfterText } from '../data/tasks';
import { toast } from '../data/toast';
import type { MyDayData, Project, TaskItem } from '../data/types';
import { bothMention, mightBelong } from '../data/understand';
import { ChaseIt } from '../tasks/ChaseIt';
import { dueText, waitingText } from '../tasks/route';
import { TaskRow } from '../tasks/TasksScreen';
import { Progression } from './parts';
import { AddDeadline, EvidenceView, IssuesView, TimelineView } from './CaseViews';
import { AtAGlance, WorthALook } from './AtAGlance';
import { ModelView } from './ModelView';
import { ResearchView } from './ResearchView';
import { DecisionsView, MilestonesView } from './PlanViews';
import { matchCount, searchProject, type SearchHit } from '../data/projectSearch';
import { LearningCard } from './LearningCard';
import { ResourcesCard } from './ResourcesCard';
import { FilesCard } from '../files/FilesCard';
import { SearchResults } from './SearchResults';
import { tabHref } from './planText';

// One project (#projects/p/<id>). Its Overview answers "what can I do next, and does anything need me?" first: the
// one next step beside Worth a look, then At a glance (each tool's summary, once), what it is and where it is on the
// progression, and everything that belongs to it — tasks and notes on the left on wide screens; what's coming up
// (including tasks still open after their date), what happened recently and its status on the right.
export type ProjectTab = 'overview' | 'model' | 'milestones' | 'decisions' | 'timeline' | 'evidence' | 'issues' | 'research';
const CASE_TABS: ProjectTab[] = ['timeline', 'evidence', 'issues'];
export function ProjectView({ data, id, tab: asked = 'overview' }: { data: MyDayData; id: string; tab?: ProjectTab }) {
  useEffect(() => { restoreExploreEntry(id); }, [id]);
  // "Search this project" (specs/projects-search.md): only on this page, never saved. ProjectsScreen keys this view by
  // the project, so another project starts empty; it belongs to the tab too, so choosing another tab ends it.
  const [search, setSearch] = useState({ tab: asked, q: '' });
  const query = search.tab === asked ? search.q : '', setQuery = (q: string) => setSearch({ tab: asked, q });
  const shown = useDeferredValue(query); // typing stays smooth in a big project
  const clear = () => { setQuery(''); focusSoon('projectSearch'); };
  // Opening a result ends the search and puts the keyboard on the item itself, once its tab is showing.
  // Optional Overview sections opened on this visit (from "Add to this project", or a search result inside one), shown
  // whatever else applies (specs/projects-sections.md).
  const [opened, setOpened] = useState<ReadonlySet<Section>>(() => new Set(arriving(id)));
  useEffect(() => { arrived(id); }, [id]); // (openOnArrival is used once, on arrival)
  const open = (s: Section) => setOpened(o => new Set([...o, s]));
  const pick = (h: SearchHit) => { setQuery(''); if (h.kind === 'resource') open('resources'); if (h.kind !== 'task' && h.kind !== 'note') focusItem(h); };
  const p = projectById(data, id);
  if (!p) return <><BackLink to="projects" label="Projects" /><NotFound title="This project isn't here" back="projects" label="Back to your projects" /></>;
  // The Model tab is a business idea's, and Timeline, Evidence and Issues a case's; anywhere else their address shows the
  // Overview.
  const tab = (asked === 'model' && !isBusiness(p)) || (CASE_TABS.includes(asked) && !isCase(p)) || (asked === 'research' && !hasResearch(p)) ? 'overview' : asked;
  const hits = shown.trim() ? searchProject(data, p, shown) : [];
  const sec = overviewSections(data, p, opened);
  return (
    <>
      <BackLink to="projects" label="Projects" />
      <ProjectTop p={p} tab={tab} query={query} onQuery={setQuery} status={query.trim() ? matchCount(hits.length, query) : ''} />
      {query.trim() && <SearchResults p={p} hits={hits} query={query} onClear={clear} onPick={pick} />}
      {/* The tab stays as it was while results show (hidden), so nothing you were typing there is lost. */}
      <div hidden={!!query.trim()} data-s="project-tab">
      {tab === 'research' ? <ResearchView data={data} p={p} /> : tab === 'timeline' ? <TimelineView p={p} /> : tab === 'evidence' ? <EvidenceView p={p} /> : tab === 'issues' ? <IssuesView p={p} />
        : tab === 'model' ? <ModelView data={data} p={p} /> : tab === 'milestones' ? <MilestonesView p={p} /> : tab === 'decisions' ? <DecisionsView p={p} /> : <>
      <LeftOffCard p={p} />
      <OverviewTop data={data} p={p} />
      <AtAGlance data={data} p={p} />
      <ProjectHead p={p} onHide={s => setOpened(o => { const n = new Set(o); n.delete(s); return n; })} />
      <div className="grid gap-x-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="min-w-0">
          <TasksCard data={data} p={p} />
          {sec.show.has('notes') && <NotesCard data={data} p={p} />}
        </div>
        <div className="min-w-0">
          <ComingUpCard data={data} p={p} />
          {sec.show.has('recently') && <RecentlyCard data={data} p={p} />}
          {sec.show.has('learning') && <LearningCard data={data} p={p} />}
          {sec.show.has('resources') && <ResourcesCard p={p} />}
          {sec.show.has('files') && <FilesCard data={data} owner={{ kind: 'project', id: p.id }} area="project" />}
          <MoreCard p={p} fold={sec.fold} hiddenWith={sec.hiddenWith} onOpen={s => { open(s); startAdding(s); }} />
          <ManageCard p={p} />
        </div>
      </div>
      </>}
      </div>
    </>
  );
}

// Opened from "Add to this project": its own first step — a link's or a lesson's form opens; a note's and a file's
// buttons get the keyboard (a file picker opens only on your own tap).
function startAdding(s: Section) {
  setTimeout(() => {
    if (s === 'resources' || s === 'learning') document.getElementById(s === 'resources' ? 'resourceAdd' : 'learningAdd')?.click();
    else document.querySelector<HTMLElement>(s === 'notes' ? '[data-action=project-note-new]' : '#files-project [data-action=file-add]')?.focus();
  }, 0);
}

// What's folded or hidden on the Overview (specs/projects-sections.md): "Add to this project: a note · …" for the
// optional cards with nothing in them, and "Hidden here: Files (3)" for hidden ones that hold something — one tap
// from each. Nothing when there's neither.
const CARD_ID: Record<Section, string> = { notes: 'projectNotes', recently: 'projectRecent', learning: 'projectLearning', resources: 'projectResources', files: 'files-project' };
function MoreCard({ p, fold, hiddenWith, onOpen }: { p: Project; fold: Section[]; hiddenWith: HiddenWith[]; onOpen: (s: Section) => void }) {
  if (!fold.length && !hiddenWith.length) return null;
  // Shown again: the keyboard goes to the card itself (the button you pressed goes with the line).
  function show(s: Section, label: string) {
    if (!update(d => (setHidden(d, p.id, s, false) ? undefined : false))) return;
    toast(`${label} shown again.`);
    requestAnimationFrame(() => { const el = document.getElementById(CARD_ID[s]); if (el) { el.tabIndex = -1; el.focus(); } });
  }
  const first = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  return (
    <Card aria-labelledby={[fold.length ? 'projectMoreH' : '', hiddenWith.length ? 'projectHiddenH' : ''].filter(Boolean).join(' ')} id="projectMore">
      {fold.length > 0 && <>
        <h3 id="projectMoreH" className="m-0">Add to this project</h3>
        <div className="flex flex-wrap gap-x-5" data-s="sections-fold">
          {fold.map(s => <LinkButton key={s} className="text-[15px] min-w-11 justify-center" data-action="section-open" data-id={s} onClick={() => onOpen(s)}>{first(SECTIONS.find(x => x.id === s)!.add!)}</LinkButton>)}
        </div>
      </>}
      {hiddenWith.length > 0 && <>
        <h3 id="projectHiddenH" className={`m-0 ${fold.length ? 'mt-3' : ''}`}>Hidden here</h3>
        <div className="flex flex-wrap gap-x-5" data-s="sections-hidden">
          {hiddenWith.map(h => <LinkButton key={h.id} className="text-[15px] min-w-11 justify-center" aria-label={`Show ${hiddenWords(h)} on the Overview`} data-action="section-show" data-id={h.id} onClick={() => show(h.id, h.label)}>Show {hiddenWords(h)}</LinkButton>)}
        </div>
      </>}
    </Card>
  );
}

// After opening a search result: its item on the tab (or the Overview's About it, or the one page), in view and focused.
function focusItem(h: SearchHit) {
  const sel = h.kind === 'about' ? '#projectHead' : h.kind === 'model' && h.id === 'answers' ? '#pjModelH' : `[data-id="${CSS.escape(h.id)}"]`;
  let tries = 0;
  const look = () => {
    const el = document.querySelector<HTMLElement>(sel);
    if (!el) { if (++tries < 60) requestAnimationFrame(look); return; }
    if (!el.hasAttribute('tabindex') && !el.matches('a, button, input, select, textarea')) el.tabIndex = -1;
    el.scrollIntoView({ block: 'center' });
    el.focus({ preventScroll: true });
  };
  requestAnimationFrame(look);
}

// The project's name and its sections: Overview · Milestones · Decisions, with Model after Overview for a business idea
// (each its own address, so Back works).
function ProjectTop({ p, tab, query, onQuery, status }: { p: Project; tab: ProjectTab; query: string; onQuery: (q: string) => void; status: string }) {
  const tabClass = (on: boolean) => `seg-link flex-1 inline-flex items-center justify-center min-h-11 rounded-xl text-[15px] font-semibold no-underline ${on ? 'on bg-primary-container text-on-primary-container' : 'text-fg-2'}`;
  return (
    <Card aria-labelledby="projectTitle" id="projectTop" className="!pb-2.5">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          {p.status !== 'active' && <Eyebrow>{STATUS_LABEL[p.status]}</Eyebrow>}
          <h2 id="projectTitle" className="text-[26px] tracking-[-.02em] m-0 break-words">{p.title}</h2>
          {p.outcome && <p className="m-0 mt-1 text-[15px] text-fg-2 break-words" data-s="project-outcome"><span className="font-semibold text-fg">Aiming for:</span> {p.outcome}</p>}
        </div>
        {/* Private (your choice): Ask MyDay sends nothing of this project. */}
        <Switch on={!!p.private} data-action="project-private" icon={<Lock size={16} aria-hidden="true" />}
          onChange={on => { if (update(d => (setProjectPrivate(d, p.id, on) ? undefined : false))) toast(on ? 'Private — Ask MyDay won’t send anything of this project.' : 'No longer private.'); }}>Private</Switch>
      </div>
      {p.private && <p className="text-sm text-fg-2 m-0 mt-2" data-s="project-private-hint">Ask MyDay sends nothing of this project. AI help with notes can still suggest it as a place for a note (its name and summary only).</p>}
      <nav className="seg flex gap-1.5 mt-3" role="tablist" aria-label="Project sections" data-s="project-tabs">
        <a className={tabClass(tab === 'overview')} href={`#projects/p/${encodeURIComponent(p.id)}`} role="tab" aria-selected={tab === 'overview'} data-tab="overview">Overview</a>
        {isBusiness(p) && <a className={tabClass(tab === 'model')} href={tabHref(p, 'model')} role="tab" aria-selected={tab === 'model'} data-tab="model">Model</a>}
        {isCase(p) ? <>
          {/* A case's own tabs (only four fit on a phone): its milestones and decisions open from their At a glance rows. */}
          <a className={tabClass(tab === 'timeline')} href={tabHref(p, 'timeline')} role="tab" aria-selected={tab === 'timeline'} data-tab="timeline">Timeline</a>
          <a className={tabClass(tab === 'evidence')} href={tabHref(p, 'evidence')} role="tab" aria-selected={tab === 'evidence'} data-tab="evidence">Evidence</a>
          <a className={tabClass(tab === 'issues')} href={tabHref(p, 'issues')} role="tab" aria-selected={tab === 'issues'} data-tab="issues">Issues</a>
        </> : <>
          <a className={tabClass(tab === 'milestones')} href={tabHref(p, 'milestones')} role="tab" aria-selected={tab === 'milestones'} data-tab="milestones">Milestones</a>
          <a className={tabClass(tab === 'decisions')} href={tabHref(p, 'decisions')} role="tab" aria-selected={tab === 'decisions'} data-tab="decisions">Decisions</a>
        </>}
        {hasResearch(p) && <a className={tabClass(tab === 'research')} href={tabHref(p, 'research')} role="tab" aria-selected={tab === 'research'} data-tab="research">Research</a>}
      </nav>
      {/* Enter just puts the keyboard away on a phone; results show as you type. */}
      <form role="search" className="mt-3" onSubmit={e => { e.preventDefault(); (document.activeElement as HTMLElement | null)?.blur(); }} data-s="project-search">
        <label htmlFor="projectSearch" className="sr-only">Search this project</label>
        <div className="relative max-w-xl">
          <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 pointer-events-none" />
          <TextInput id="projectSearch" type="search" value={query} maxLength={120} placeholder="Search this project" className="!pl-10" autoComplete="off" enterKeyHint="search"
            onChange={e => onQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape' && !e.nativeEvent.isComposing) onQuery(''); }} />
        </div>
        <p role="status" className="sr-only" data-s="search-status">{status}</p>
      </form>
    </Card>
  );
}

// `onHide`: a card you switch off leaves the page now, even one you opened on this visit.
function ProjectHead({ p, onHide }: { p: Project; onHide: (s: Section) => void }) {
  const [editing, setEditing] = useState(false), [noting, setNoting] = useState(false);
  const save = (patch: Partial<Pick<Project, 'title' | 'summary' | 'stage' | 'outcome' | 'finishedWhen'>>) => update(d => (editProject(d, p.id, patch) ? undefined : false));
  // A business idea has a one page (the Model tab). Back to general keeps it, out of sight.
  function changeKind(to: TemplateChoice) {
    if (!update(d => (setTemplate(d, p.id, to) ? undefined : false))) return;
    // What the old kind had stays, out of sight, until you switch back.
    const kept = [p.template === 'business' && p.model && 'its one page', p.template === 'case' && p.case && 'its timeline, evidence and issues'].filter(Boolean)[0];
    const now = to === 'business' ? 'Now a business idea — its one page is on the Model tab.' : to === 'case' ? 'Now a case — its timeline, evidence and issues each have a tab.' : to === 'research' ? 'Now a research project — its questions, findings and sources are on the Research tab.' : 'Now a general project.';
    toast(kept ? `${now} ${kept.charAt(0).toUpperCase() + kept.slice(1)} ${kept.includes('and') ? 'are' : 'is'} kept, out of sight — switch back any time.` : now);
  }
  return (
    <Card aria-label="About this project" id="projectHead">
      <div className="flex items-start justify-between gap-3">
        <h3 className="m-0 text-[15px] text-fg-2 font-semibold">About it</h3>
        <Button inline variant="ghost" className="flex-none -mt-2" aria-expanded={editing} data-action="project-edit" onClick={() => setEditing(!editing)}><Pencil size={16} aria-hidden="true" /> {editing ? 'Done' : 'Edit'}</Button>
      </div>
      {editing ? (
        <div className="grid gap-3 mt-3">
          <Field label="Project" htmlFor="projectTitleInput"><CommitInput id="projectTitleInput" key={p.title} defaultValue={p.title} maxLength={PROJECT_LIMITS.title} onCommit={el => { if (!el.value.trim()) { el.value = p.title; return; } save({ title: el.value }); }} /></Field>
          <Field label="What is it, and why does it matter to you?" htmlFor="projectSummary"><CommitTextarea id="projectSummary" rows={4} key={p.summary} defaultValue={p.summary} maxLength={PROJECT_LIMITS.summary} onCommit={el => save({ summary: el.value })} /></Field>
          <Field label="What are you aiming for?" htmlFor="projectOutcome"><CommitInput id="projectOutcome" key={p.outcome ?? ''} defaultValue={p.outcome ?? ''} maxLength={PROJECT_LIMITS.outcome} placeholder="A result, e.g. a quiet corner I read in every evening" onCommit={el => save({ outcome: el.value })} /></Field>
          <Field label="What would count as finished?" htmlFor="projectFinished"><CommitTextarea id="projectFinished" rows={2} key={p.finishedWhen ?? ''} defaultValue={p.finishedWhen ?? ''} maxLength={PROJECT_LIMITS.finishedWhen} onCommit={el => save({ finishedWhen: el.value })} /></Field>
          {knownTemplate(p) && (
            <Field label="Kind of project" htmlFor="projectKind">
              <Select id="projectKind" className="!w-auto" value={isBusiness(p) ? 'business' : isCase(p) ? 'case' : isResearchKind(p) ? 'research' : 'general'} onChange={e => changeKind(e.target.value as TemplateChoice)}>
                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            </Field>
          )}
          {/* Research as a tool on any kind of project (specs/projects-research.md); a research project always has it. */}
          {!isResearchKind(p) && (
            <Switch on={hasResearch(p)} data-action="project-research"
              onChange={on => { if (update(d => (setResearch(d, p.id, on) ? undefined : false))) toast(on ? 'Research is on — it has its own tab.' : 'Research is off. Everything in it is kept; switch it on to see it again.'); }}>Research</Switch>
          )}
          {/* Optional Overview cards (specs/projects-sections.md): empty ones fold away by themselves; any can be hidden here. */}
          <fieldset className="border-0 p-0 m-0" data-s="sections-shown">
            <legend className="text-sm font-semibold mb-1.5">Show on the Overview</legend>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map(x => <Switch key={x.id} on={!isHidden(p, x.id)} data-action={`section-${x.id}`}
                onChange={on => { if (!update(d => (setHidden(d, p.id, x.id, !on) ? undefined : false))) return; if (!on) onHide(x.id); toast(on ? `${x.label} shown again.` : `${x.label} hidden on this project.`); }}>{x.label}</Switch>)}
            </div>
            <p className="text-sm text-fg-3 m-0 mt-1.5">Ones with nothing in them fold away by themselves.</p>
          </fieldset>
        </div>
      ) : p.summary ? (
        <p className="text-[16px] text-fg-2 m-0 mt-2 whitespace-pre-line" data-s="project-summary">{p.summary}</p>
      ) : (
        <button type="button" className="min-h-11 mt-1 -mb-1 text-[15px] font-semibold text-primary bg-transparent border-0 p-0 cursor-pointer hover:underline underline-offset-4" data-action="project-why" onClick={() => setEditing(true)}>What is it, and why does it matter to you?</button>
      )}
      {!editing && p.finishedWhen && <p className="text-[15px] m-0 mt-3 whitespace-pre-line break-words" data-s="project-finished"><span className="font-semibold">Finished when:</span> {p.finishedWhen}</p>}
      {!p.leftOff && (noting ? <LeftOffEditor p={p} onDone={r => { setNoting(false); focusSoon(r === 'saved' ? 'pjLeftOffH' : 'projectLeftOffNew'); }} />
        : <button type="button" id="projectLeftOffNew" className="block min-h-11 mt-2 text-[15px] font-semibold text-primary bg-transparent border-0 p-0 cursor-pointer hover:underline underline-offset-4" data-action="leftoff-new" onClick={() => setNoting(true)}>Leave a note for next time</button>)}
      <div className="mt-5"><Progression stage={p.stage} onPick={stage => save({ stage })} /></div>
      {!isCase(p) && <a id="projectExplore" href={exploreHref(p.id)} onClick={() => rememberExploreEntry(p.id)} data-action="project-explore" className="inline-flex items-center gap-2 min-h-11 mt-3 text-primary font-semibold text-[15px] no-underline hover:underline underline-offset-4">Explore this idea <ArrowUpRight size={17} aria-hidden="true" /></a>}
    </Card>
  );
}

// Where you left off (1.48.0): your note for next time, at the top of the Overview once written, with its day.
// When the editor closes, the keyboard focus goes back to where you'd carry on (never left on the page itself).
const focusSoon = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());
function LeftOffCard({ p }: { p: Project }) {
  const [editing, setEditing] = useState(false);
  if (!p.leftOff) return null;
  return (
    <Card aria-labelledby="pjLeftOffH" id="projectLeftOff">
      <div className="flex items-start justify-between gap-3">
        <h3 id="pjLeftOffH" tabIndex={-1} className="m-0">Where I left off <span className="text-sm font-normal text-fg-2 tabular-nums" data-s="leftoff-day">· {shortDate(p.leftOff.at.slice(0, 10))}</span></h3>
        {!editing && <Button inline variant="ghost" id="projectLeftOffEdit" className="flex-none -mt-2" data-action="leftoff-edit" onClick={() => setEditing(true)}><Pencil size={16} aria-hidden="true" /> Edit</Button>}
      </div>
      {editing ? <LeftOffEditor p={p} onDone={r => { setEditing(false); focusSoon(r === 'cleared' ? 'projectLeftOffNew' : 'projectLeftOffEdit'); }} />
        : <p className="text-[16px] m-0 mt-2 whitespace-pre-line break-words" data-s="leftoff-text">{p.leftOff.text}</p>}
    </Card>
  );
}
// Writing it: the draft stays while you type and if saving fails (nothing is announced, and the previous note stays).
function LeftOffEditor({ p, onDone }: { p: Project; onDone: (r: 'saved' | 'cleared' | 'cancelled') => void }) {
  const confirm = useConfirm();
  const [text, setText] = useState(p.leftOff?.text ?? '');
  function save() {
    if (!text.trim()) return;
    if (text.trim().slice(0, PROJECT_LIMITS.leftOff) === p.leftOff?.text) { onDone('saved'); return; }
    if (update(d => (setLeftOff(d, p.id, text) ? undefined : false))) { toast('Saved — it’ll be here when you come back.'); onDone('saved'); }
  }
  async function clear() {
    if (!(await confirm({ title: 'Clear this note?', body: 'Where you left off will be empty again.', confirmLabel: 'Clear', cancelLabel: 'Keep it' }))) return;
    if (update(d => (setLeftOff(d, p.id, '') ? undefined : false))) { toast('Note cleared.'); onDone('cleared'); }
  }
  return (
    <form className="mt-3" onSubmit={e => { e.preventDefault(); save(); }} onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); onDone('cancelled'); } }} data-s="leftoff-form">
      <Field label="Where I left off" htmlFor="projectLeftOffText">
        <TextArea id="projectLeftOffText" rows={4} autoFocus value={text} maxLength={PROJECT_LIMITS.leftOff} onChange={e => setText(e.target.value)}
          placeholder="What was happening, what’s unresolved, the next useful thing, and anything you’ll need to pick it up again" />
      </Field>
      <div className="flex flex-wrap gap-2.5 mt-3">
        <Button inline type="submit" variant="primary" data-action="leftoff-save" disabled={!text.trim()}>Save note</Button>
        <Button inline variant="ghost" data-action="leftoff-cancel" onClick={() => onDone('cancelled')}>Cancel</Button>
        {p.leftOff && <Button inline variant="ghost" data-action="leftoff-clear" onClick={() => void clear()}>Clear note</Button>}
      </div>
    </form>
  );
}

// The first row: the one next step, with Worth a look beside it when there's something to point at (otherwise the
// next step has the full width).
function OverviewTop({ data, p }: { data: MyDayData; p: Project }) {
  const pointers = worthALook(data, p);
  return (
    // Side by side, the two cards share a bottom edge.
    <div className={`grid gap-x-5 ${pointers.length ? 'lg:grid-cols-[minmax(0,1fr)_340px]' : ''}`} data-s="overview-top">
      <div className="min-w-0 flex flex-col *:flex-1"><NextStepCard data={data} p={p} /></div>
      {pointers.length > 0 && <div className="min-w-0 flex flex-col *:flex-1"><WorthALook data={data} pointers={pointers} /></div>}
    </div>
  );
}

// The one next step: what reaches Today. With none yet, it asks for the smallest one. "Why this?" says why it's this
// one, and "Let MyDay pick" hands a choice back (specs/projects-next-why.md).
function NextStepCard({ data, p }: { data: MyDayData; p: Project }) {
  const [text, setText] = useState('');
  const step = nextStep(data, p), open = projectTasks(data, p).open, k = todayKey(), chosen = !!step && step.id === p.nextTaskId;
  const waits = step ? startsAfterText(data, step) : '';
  function addStep() {
    const title = text.trim();
    if (!title) return;
    if (!update(d => { const id = addTask(d.tasks, { title }); if (!id) return false; d.tasks.items.find(t => t.id === id)!.projectId = p.id; setNextStep(d, p.id, id); })) return;
    setText('');
    toast('Next step set — it can go on Today whenever you like.');
  }
  // Choosing a task makes it yours; "Let MyDay pick" hands the choice back and says what MyDay picks.
  function pick(id: string | null) {
    if (!update(d => (setNextStep(d, p.id, id) ? undefined : false)) || id) return;
    const auto = open.find(t => !heldBack(data, t));
    toast(auto ? `MyDay’s pick: “${auto.title}”.` : open.every(t => t.waiting) ? 'Everything here is waiting, so MyDay has no next step to pick.'
      : 'Nothing here can start yet, so MyDay has no next step to pick.');
  }
  return (
    <Card tone="accent" aria-labelledby="projectNextH" id="projectNext">
      <h3 id="projectNextH" className="!text-primary">Next step</h3>
      {step ? (
        <>
          <p className="text-[20px] font-bold leading-snug m-0 break-words" data-s="next-title">{step.title}</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 m-0 mt-1.5 text-sm text-fg-3 tabular-nums">
            {step.due && (step.due < k && !heldBack(data, step) ? <span data-s="next-still-open">Still open · was {step.deadline?.kind === 'aim' ? 'aimed for' : 'due'} {shortDate(step.due)}</span> : <span>{dueText(step, k)}</span>)}{step.deadline && !(step.due && step.due < k && !heldBack(data, step)) && <span data-s="next-deadline">{deadlineLabel(step.deadline)}</span>}<span>{step.minutes} min</span><CategoryChip kind={step.category} />
            {stepsText(step) && <span data-s="next-steps">{stepsText(step)}</span>}
          </p>
          {/* A waiting step you chose stays chosen (1.50.0); it can't be done today, so it isn't offered for Today. */}
          {step.waiting && <p className="m-0 mt-2 text-[15px] text-fg-2 break-words" data-s="next-waiting">{waitingText(step)}{open.length > 1 ? ' — while you wait, you could choose another next step below.' : '.'}</p>}
          {/* A step you chose that starts after another task stays chosen too; you can still do it any time. */}
          {waits && <p className="m-0 mt-2 text-[15px] text-fg-2 break-words" data-s="next-starts-after">{waits}. You can still do it any time.</p>}
          <div className="flex flex-wrap gap-2.5 mt-4">
            {step.waiting ? (step.waiting.until && step.waiting.until <= k && <ChaseIt data={data} t={step} primary />) : onTodaysPlan(data, step, k) ? <span className="inline-flex items-center min-h-11 text-primary font-semibold">On today's plan</span>
              : <Button inline variant="primary" data-action="project-step-today" onClick={() => toToday(data, step)}>Add to today</Button>}
            <Button inline data-action="project-step-done" onClick={() => { if (update(d => (setTaskDone(d, step.id, true) ? undefined : false))) toast('Done — nice. The next one is ready when you are.'); }}><Check size={18} aria-hidden="true" /> Done</Button>
            <a href={`#today/tasks/${step.id}`} className="inline-flex items-center min-h-11 px-2 text-primary font-semibold text-[15px] no-underline hover:underline underline-offset-4">Open</a>
          </div>
          <details className="mt-2 mb-1" data-s="next-why"><summary className="cursor-pointer min-h-11 flex items-center text-primary font-semibold text-[15px]">Why this?</summary>
            <p className="text-[15px] text-fg-2 mt-0 mb-1 break-words" data-s="next-why-text">{whyNext(data, p).join(' ')}</p></details>
          {(open.length > 1 || (chosen && heldBack(data, step))) && (
            <Field label="Or choose another next step" htmlFor="projectNextPick" className="mt-2">
              <Select id="projectNextPick" value={chosen ? step.id : ''} onChange={e => pick(e.target.value || null)}>
                <option value="">Let MyDay pick</option>
                {open.map(t => <option key={t.id} value={t.id}>{t.title}{t.waiting ? ' (waiting)' : heldBack(data, t) ? ' (starts after another task)' : ''}</option>)}
              </Select>
            </Field>
          )}
        </>
      ) : (<>
        {open.length > 0 && <p className="m-0 mb-3 text-[15px]" data-s="next-all-waiting">{open.every(t => t.waiting) ? 'Everything here is waiting on someone or something.' : 'Nothing here can start yet: each task is waiting on someone or something, or starts after another task.'} Is there another small step you could take?</p>}
        <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end" onSubmit={e => { e.preventDefault(); addStep(); }}>
          <Field label="What's the smallest next step?" htmlFor="projectNextNew">
            <TextInput id="projectNextNew" value={text} maxLength={120} onChange={e => setText(e.target.value)} placeholder="e.g. Write down three questions" />
          </Field>
          <Button inline type="submit" variant="primary" data-action="project-step-add" disabled={!text.trim()}>Set</Button>
        </form>
      </>)}
    </Card>
  );
}
function toToday(data: MyDayData, t: TaskItem) {
  const room = planRoom(data);
  let r = '' as ReturnType<typeof addToTodaysPlan> | '';
  const saved = update(d => { r = addToTodaysPlan(d, t.id); if (r !== 'added') return false; });
  if (!saved && r === 'added') return;
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
    const saved = update(d => { const id = addTask(d.tasks, { title: c ? c.title : words, due: c?.date ?? null, time: c?.time ?? null, category: c?.category ?? 'admin' }); if (!id) return false; d.tasks.items.find(t => t.id === id)!.projectId = p.id; ok = true; });
    if (!saved || !ok) return;
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
    const saved = update(d => { id = addNote(d.notes); d.notes.items.find(n => n.id === id)!.projectId = p.id; });
    if (saved && id) location.hash = `projects/notes/${id}`;
  }
  return (
    <Card aria-labelledby="projectNotesH" id="projectNotes">
      <h3 id="projectNotesH">Notes <span className="text-fg-3 font-normal tabular-nums">{notes.length}</span></h3>
      {notes.length > 0 ? (
        <ul className="list-none p-0 m-0">
          {notes.map(n => (
            <li key={n.id} className="border-t border-outline first:border-t-0">
              <a href={`#projects/notes/${n.id}`} className="flex justify-between gap-3 items-baseline min-h-11 py-2 text-fg no-underline hover:bg-surface-2 rounded-tile -mx-2 px-2" data-id={n.id} data-s="project-note">
                <span className="min-w-0 break-words font-medium">{noteName(n)}{n.private && <Lock size={13} aria-label="Private" className="inline ml-1.5 text-fg-3 align-[-1px]" data-s="note-row-private" />}{n.linkedBy && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary align-middle" data-s="by-myday"><Sparkles size={12} aria-hidden="true" /> {n.linkedBy === 'ai' ? 'connected by AI' : 'connected by MyDay'}</span>}</span><span className="flex-none text-sm text-fg-3 tabular-nums">{shortDate(n.updatedAt.slice(0, 10))}</span>
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

// What's coming up: tasks still open after their date first ("Still open · was due …", never "late"), then this
// project's dated tasks and appointments in time order, and ways to add an appointment (and, for a case, a deadline).
function ComingUpCard({ data, p }: { data: MyDayData; p: Project }) {
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ title: '', date: todayKey(), start: '', end: '' });
  const k = todayKey(), items = comingUp(data, p, k), open = stillOpen(data, p, k);
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
      {items.length || open.length ? (
        <ul className="list-none p-0 m-0">
          {open.map(t => (
            <li key={'o' + t.id} className="border-t border-outline first:border-t-0 py-2" data-s="soon-open">
              <a href={`#today/tasks/${t.id}`} className="block min-h-11 text-fg no-underline"><span className="block text-sm text-fg-2 tabular-nums">Still open · was {t.deadline?.kind === 'aim' ? 'aimed for' : 'due'} {shortDate(t.due!)}</span><span className="font-medium break-words">{t.title}</span></a>
            </li>
          ))}
          {items.map(x => x.kind === 'task' ? (
            <li key={'t' + x.task.id} className="border-t border-outline first:border-t-0 py-2" data-s="soon-task">
              <a href={`#today/tasks/${x.task.id}`} className="block min-h-11 text-fg no-underline"><span className="block text-sm text-fg-3 tabular-nums">{prettyDate(x.task.due!)}{x.task.time ? ` · ${x.task.time}` : ''}{x.task.deadline ? <span data-s="soon-deadline"> · {deadlineLabel(x.task.deadline)}</span> : null}</span><span className="font-medium break-words">{x.task.title}</span></a>
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
      ) : <Note className="mt-0">{isCase(p) ? 'No dates yet. A deadline is a dated task here — it reaches Today on its day.' : 'Nothing dated yet. Tasks with a date, and appointments, show here.'}</Note>}
      <div className="flex flex-wrap gap-x-2.5">
      {adding ? (
        <form className="grid gap-3 mt-3 w-full" onSubmit={e => { e.preventDefault(); add(); }} id="projectApptForm">
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
      {isCase(p) && <AddDeadline p={p} />}
      </div>
    </Card>
  );
}

// What happened lately, newest first (tasks added or done, notes written or changed) — each opens what it's about.
const HAPPENED = { added: 'Added', done: 'Done', note: 'Note', 'note-changed': 'Note changed', milestone: 'Milestone reached', decided: 'Decided', checked: 'Found out' } as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function RecentlyCard({ data, p }: { data: MyDayData; p: Project }) {
  const list = recently(data, p), k = todayKey();
  if (!list.length) return null;
  return (
    <Card aria-labelledby="projectRecentH" id="projectRecent">
      <h3 id="projectRecentH">Recently</h3>
      <ul className="list-none p-0 m-0">
        {list.map((h, i) => (
          <li key={i} className="border-t border-outline first:border-t-0" data-s="recent" data-what={h.what}>
            <a href={h.href} className="block min-h-11 py-2 text-fg no-underline hover:bg-surface-2 rounded-tile -mx-2 px-2">
              <span className="block text-sm text-fg-3 tabular-nums">{cap(relDay(h.at.slice(0, 10), k) || 'today')} · {HAPPENED[h.what]}</span>
              <span className="block break-words">{h.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ManageCard({ p }: { p: Project }) {
  const confirm = useConfirm();
  const status = (s: Project['status'], msg: string) => { if (update(d => (editProject(d, p.id, { status: s }) ? undefined : false))) toast(msg); };
  async function remove() {
    const yes = await confirm({ title: 'Delete this project?', body: `Its ${p.case ? 'timeline, evidence and issues, ' : ''}${p.model ? 'one page, ' : ''}milestones and decisions go with it; its notes, tasks and appointments stay.`, confirmLabel: 'Delete project', cancelLabel: 'Keep it' });
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
