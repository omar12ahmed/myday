import { Lock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Select } from '../components/Field';
import { LinkButton } from '../components/parts';
import { GROUP_LABEL, type Need, type NeedGroup } from '../data/attention';
import { isBusiness, isCase } from '../data/businessModel';
import { nextStep, projectById, projectsInOrder, stageOf } from '../data/projects';
import type { MyDayData, Project } from '../data/types';
import { inFocus } from '../data/weekReview';
import { ChaseIt } from '../tasks/ChaseIt';
import { awayFor, awayWords, isAway } from '../data/welcomeBack';
import { isProjectWaiting, waitLine } from '../data/projectWaiting';
import { areasOf, sameArea, type Area } from '../data/areas';
import { AreaLabel } from './AreaBits';

// "Needs you" (specs/projects-attention.md): what needs you across your active projects, at the top of the Projects
// home. Each line says what and why, and opens the thing itself; the five that matter soonest, then "Show N more".
// Filter by reason, or by project. Nothing is saved (the filters aren't either) and nothing is sent anywhere; the
// rules are in data/attention.ts (worked out once by the Projects home and passed in as `all`).
const SHOWN = 5;
const GROUPS: NeedGroup[] = ['dates', 'waiting', 'stuck', 'decisions', 'tools'];
export function NeedsYouCard({ data, all }: { data: MyDayData; all: Need[] }) {
  const [chosen, setChosen] = useState<NeedGroup | null>(null), [pid, setPid] = useState(''), [more, setMore] = useState(false);
  const projects = projectsInOrder(data, 'active').filter(p => all.some(n => n.projectId === p.id)).map(p => [p.id, p.title] as const);
  const project = projects.some(([id]) => id === pid) ? pid : '';
  const inProject = project ? all.filter(n => n.projectId === project) : all;
  const groups = GROUPS.filter(g => inProject.some(n => n.group === g)), group = chosen && groups.includes(chosen) ? chosen : null;
  const list = group ? inProject.filter(n => n.group === group) : inProject, shown = more ? list : list.slice(0, SHOWN);
  // A choice whose reason or project has nothing left is let go (adjusted while rendering), so it can't come back by
  // itself later when something of that reason or project turns up again.
  if (chosen !== group) setChosen(group);
  if (pid !== project) setPid(project);
  const pick = (g: NeedGroup | null) => { setChosen(g); setMore(false); };
  return (
    <Card aria-labelledby="needs-h" id="needsYou">
      <h2 id="needs-h" className="flex items-baseline gap-2 m-0">Needs you{all.length > 0 && <>{' '}<span className="text-fg-3 font-normal tabular-nums" data-s="needs-count">{all.length}</span></>}</h2>
      {!all.length ? <p className="text-[15px] text-fg-2 m-0 mt-2" data-s="needs-none">Nothing needs you right now.</p> : <>
        {(groups.length > 1 || projects.length > 1) && (
          <div className="flex flex-wrap items-center gap-2 mt-3" data-s="needs-filters">
            {groups.length > 1 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Show only">
                <Button inline variant={!group ? 'selected' : 'ghost'} aria-pressed={!group} className="!min-h-11" data-s="needs-filter" data-id="all" onClick={() => pick(null)}>All <span className="tabular-nums">{inProject.length}</span></Button>
                {groups.map(g => { const n = inProject.filter(x => x.group === g).length; return (
                  <Button key={g} inline variant={group === g ? 'selected' : 'ghost'} aria-pressed={group === g} className="!min-h-11" data-s="needs-filter" data-id={g} onClick={() => pick(g)}>{GROUP_LABEL[g]} <span className="tabular-nums">{n}</span></Button>); })}
              </div>
            )}
            {projects.length > 1 && (
              <Select id="needsProject" aria-label="Which project" className="!w-auto max-w-full sm:ml-auto" value={project} onChange={e => { setPid(e.target.value); setChosen(null); setMore(false); }}>
                <option value="">All projects</option>
                {projects.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
              </Select>
            )}
          </div>
        )}
        <ul className="list-none p-0 m-0 mt-2" data-s="needs-list">{shown.map(n => <NeedRow key={n.key} data={data} n={n} />)}</ul>
        {list.length > SHOWN && <LinkButton className="text-[15px]" aria-expanded={more} data-action="needs-more" onClick={() => setMore(!more)}>{more ? 'Show fewer' : `Show ${list.length - SHOWN} more`}</LinkButton>}
      </>}
    </Card>
  );
}

// One line: what (in ink), then why and which project (in grey); a wait that's due offers Chase it under it.
function NeedRow({ data, n }: { data: MyDayData; n: Need }) {
  const p = projectById(data, n.projectId), c = n.chase, t = c && 'taskId' in c ? data.tasks.items.find(x => x.id === c.taskId) : null;
  return (
    <li className="border-t border-outline first:border-t-0" data-s="need" data-reason={n.reason} data-id={n.key}>
      <a href={n.href} className="block py-2 min-h-11 text-fg no-underline hover:underline underline-offset-4 break-words" data-s="need-link">
        <span className="block font-medium leading-snug">{n.title}</span>
        <span className="block text-sm text-fg-2 mt-0.5">{n.why} · {n.project}{p?.private && <Lock size={12} aria-label="Private" className="inline ml-1 align-[-1px]" />}</span>
      </a>
      {t && <div className="pb-2"><ChaseIt data={data} t={t} /></div>}
      {c && 'projectId' in c && p && <div className="pb-2"><ChaseIt data={data} p={p} /></div>}
    </li>
  );
}

// Your active projects as a list (the Board · List choice): one row each, most recently worked on first, with its
// stage, its next step and how many things need you there.
// With areas (specs/projects-areas-archive.md): only the area you're showing, or — showing all — grouped by area, in
// name order, "No area" last.
export function ProjectList({ data, all, fits = () => true, grouped = false }: { data: MyDayData; all: Need[]; fits?: (p: Project) => boolean; grouped?: boolean }) {
  const count = new Map<string, number>();
  for (const n of all) count.set(n.projectId, (count.get(n.projectId) ?? 0) + 1);
  const list = projectsInOrder(data, 'active').filter(fits);
  const groups: { area: Area | null; items: Project[] }[] = grouped
    ? [...areasOf(data).map(a => ({ area: a, items: list.filter(p => !!p.area && sameArea(p.area, a.name)) })), { area: null, items: list.filter(p => !p.area) }].filter(g => g.items.length)
    : [{ area: null, items: list }];
  return (
    <Card id="projectsList" aria-label="Your active projects">
      {groups.map((g, gi) => (
      <section key={g.area?.name ?? 'none'} aria-label={grouped ? g.area?.name ?? 'No area' : undefined} data-s="list-group" data-id={g.area?.name ?? ''}>
      {grouped && <h3 className={`flex items-center gap-2 m-0 text-[15px] ${gi ? 'mt-4' : ''}`} data-s="list-group-head">{g.area ? <AreaLabel name={g.area.name} colour={g.area.colour} /> : 'No area'} <span className="text-fg-3 font-normal tabular-nums">{g.items.length}</span></h3>}
      <ul className="list-none p-0 m-0">{g.items.map(p => {
        const step = nextStep(data, p), n = count.get(p.id) ?? 0;
        // (Away a week or more: specs/projects-welcome-back.md — or, instead, waiting: specs/projects-project-waiting.md.)
        const about = [stageOf(p.stage).label, isCase(p) ? 'Case' : isBusiness(p) ? 'Business idea' : null, inFocus(p) ? 'This week’s focus' : null,
          isProjectWaiting(p) ? waitLine(p.waiting) : isAway(data, p) ? `Away ${awayWords(awayFor(data, p))}` : null].filter(Boolean).join(' · ');
        return (
          <li key={p.id} className="border-t border-outline first:border-t-0" data-s="project-row" data-id={p.id}>
            <a href={`#projects/p/${p.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 items-center py-2.5 min-h-11 text-fg no-underline hover:underline underline-offset-4">
              <span className="min-w-0 break-words">
                <span className="block font-semibold leading-snug">{p.title}{p.private && <Lock size={13} aria-label="Private" className="inline ml-1.5 text-fg-3 align-[-1px]" />}</span>
                <span className="block text-sm text-fg-2 mt-0.5">{about} · {step ? `Next: ${step.title}` : 'No next step yet'}</span>
              </span>
              <span className="text-sm tabular-nums text-right" data-s="project-needs">{n ? `${n} need${n === 1 ? 's' : ''} you` : ''}</span>
            </a>
          </li>
        );
      })}</ul>
      </section>
      ))}
    </Card>
  );
}
