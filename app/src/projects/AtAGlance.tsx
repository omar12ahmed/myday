import { ArrowRight, LayoutDashboard, Lightbulb } from 'lucide-react';
import type { ReactNode } from 'react';
import { openCapture } from '../capture/openCapture';
import { Card } from '../components/Card';
import { isBusiness, isCase, modelProgress } from '../data/businessModel';
import { caseCounts, EVIDENCE_STATUS_LABEL, ISSUE_STATUS_LABEL, timelineInOrder } from '../data/caseFile';
import { parseKey, shortDate, todayKey } from '../data/dates';
import { issueGrid, timelineByMonth, weeksDone, type Pointer, type Week } from '../data/projectDashboard';
import { chosenOption, decisionsInOrder, milestoneProgress } from '../data/projectPlan';
import { lastActivity, projectTasks } from '../data/projects';
import type { MyDayData, Project } from '../data/types';
import { NOT_ADVICE } from './CaseViews';
import { AiHelp } from './PlanViews';
import { aimText, tabHref } from './planText';

// "At a glance" (1.36.0): a project's summary on its Overview, one row per tool, each fact said once and each row
// opening its tab: a business idea's one page and what must be true, a case's evidence, issues and timeline, then
// milestones, decisions and what you did. "Summarise this" (Ask MyDay, only on your tap, never on a private project)
// closes it. The numbers are in data/projectDashboard.ts. Counts and places only; every picture has its words for
// screen readers, a hover or focus readout, and never relies on colour alone. "Worth a look" sits beside the next step.
export function AtAGlance({ data, p }: { data: MyDayData; p: Project }) {
  return (
    <Card aria-labelledby="pjGlanceH" id="projectGlance">
      <h3 id="pjGlanceH" className="flex items-center gap-2"><LayoutDashboard size={18} aria-hidden="true" className="text-primary" /> At a glance</h3>
      <div className="divide-y divide-outline" data-s="glance-rows">
        {isBusiness(p) && <OnePage p={p} />}
        {isBusiness(p) && <Beliefs p={p} />}
        {isCase(p) && <EvidenceBar p={p} />}
        {isCase(p) && <IssueTable p={p} />}
        {isCase(p) && <MonthBars p={p} />}
        <MilestoneRoute p={p} />
        <Decisions p={p} />
        <WhatYouDid data={data} p={p} />
      </div>
      {isCase(p) && <p className="text-sm text-fg-3 m-0 mt-3" data-s="case-not-advice">{NOT_ADVICE}</p>}
      <AiHelp p={p} action="glance-summary" label="Summarise this" onAsk={() => openCapture('Summarise where this project is, and the one next step')} />
    </Card>
  );
}

// "Worth a look": at most three gentle pointers from real data (data/projectDashboard.ts), beside the next step.
export function WorthALook({ pointers }: { pointers: Pointer[] }) {
  return (
    <Card aria-labelledby="pjWorthH" id="projectWorth" data-s="glance-pointers">
      <h3 id="pjWorthH" className="flex items-center gap-2"><Lightbulb size={18} aria-hidden="true" className="text-primary" /> Worth a look</h3>
      <ul className="list-none p-0 m-0">{pointers.map(x => (
        <li key={x.key} className="border-t border-outline first:border-t-0"><a href={x.href} className="flex items-center justify-between gap-2 min-h-11 py-2 text-fg no-underline hover:underline underline-offset-4 break-words" data-pointer={x.key}>
          <span className="min-w-0">{x.text}</span><ArrowRight size={16} aria-hidden="true" className="flex-none text-fg-3" /></a></li>))}</ul>
    </Card>
  );
}

// One row: its name on the left on wide screens (above it on phones), opening its tab when it has one.
function Row({ title, href, s, children }: { title: string; href?: string; s: string; children: ReactNode }) {
  return (
    <section className="grid gap-x-6 sm:grid-cols-[10rem_minmax(0,1fr)] py-3 first:pt-0 last:pb-0 min-w-0" aria-label={title} data-s={s}>
      <h4 className="m-0 text-sm font-semibold">
        {href ? <a href={href} className="block min-h-11 py-2.5 text-fg-2 no-underline hover:underline underline-offset-4">{title}</a>
          : <span className="block py-2.5 text-fg-2">{title}</span>}
      </h4>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
const lineClass = 'block min-h-11 py-2 text-[15px] text-fg no-underline hover:underline underline-offset-4 break-words';
const Empty = ({ href, s, children }: { href: string; s?: string; children: ReactNode }) => (
  <a href={href} className="inline-flex items-center min-h-11 py-2 text-[15px] text-primary font-semibold no-underline hover:underline underline-offset-4" data-s={s}>{children}</a>
);

// Milestones as stations on a line: reached (filled), the next one ("you are here"), and the ones still ahead.
function MilestoneRoute({ p }: { p: Project }) {
  const list = p.milestones ?? [], { reached, total, next } = milestoneProgress(p), href = tabHref(p, 'milestones');
  const shown = list.slice(0, 12);
  return (
    <Row title="Milestones" href={href} s="glance-route">
      {total ? <>
        <a href={href} className={lineClass} data-s="ms-summary">
          {!next ? `All ${total} milestones reached${list.length > shown.length ? ` (the first ${shown.length} shown)` : ''}.`
            : <>{reached} of {total} milestones reached{list.length > shown.length ? ` (the first ${shown.length} shown)` : ''} · <span className="font-semibold">Next:</span> {next.title}{next.aim ? ` (${aimText(next.aim, todayKey(), true).replace(' — change it whenever it suits', '')})` : ''}</>}
        </a>
        <ol className="list-none p-0 m-0 mt-1 mb-2 max-w-xl relative flex items-center justify-between gap-1 h-6" aria-label={`${reached} of ${total} milestones reached`}>
          <span aria-hidden="true" className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 bg-track" />
          {shown.map(m => {
            const here = m === next;
            return <li key={m.id} className="relative z-[1]" title={`${m.title}${m.reachedOn ? ' — reached' : here ? ' — next' : ''}`}>
              <span className="sr-only">{m.title}{m.reachedOn ? ': reached' : here ? ': next' : ''}</span>
              <span aria-hidden="true" className={`block rounded-full border-2 border-surface ${m.reachedOn ? 'size-4 bg-primary' : here ? 'size-5 bg-surface ring-2 ring-primary' : 'size-3.5 bg-surface ring-2 ring-outline-strong'}`} />
            </li>;
          })}
        </ol>
      </> : <Empty href={href} s="ms-summary">Milestones are the big markers on the way — add the first one</Empty>}
    </Row>
  );
}

// Up to three open questions, or the latest choice when none are open.
function Decisions({ p }: { p: Project }) {
  const list = decisionsInOrder(p), open = list.filter(x => !x.chosen), last = list.find(x => x.chosen), href = tabHref(p, 'decisions');
  return (
    <Row title="Decisions" href={href} s="glance-decisions">
      {open.length ? (
        <ul className="list-none p-0 m-0" data-s="dc-open">
          {open.slice(0, 3).map(x => <li key={x.id}><a href={href} className={lineClass}>{x.question}</a></li>)}
          {open.length > 3 && <li className="text-sm text-fg-3 pb-2">and {open.length - 3} more</li>}
        </ul>
      ) : last ? <a href={href} className={lineClass} data-s="dc-summary">Decided {shortDate(last.decidedOn!)}: {chosenOption(last)?.text}</a>
        : <Empty href={href} s="dc-summary">Is there a choice to make? Add a decision</Empty>}
    </Row>
  );
}

// What you did, week by week, with the plain counts: never a percentage or a score.
function WhatYouDid({ data, p }: { data: MyDayData; p: Project }) {
  const weeks = weeksDone(data, p, todayKey()), total = weeks.reduce((a, w) => a + w.total, 0);
  const { open, done } = projectTasks(data, p), kase = isCase(p), business = isBusiness(p);
  const detail = (w: Week) => [w.tasks && `${w.tasks} task${w.tasks === 1 ? '' : 's'} done`, w.milestones && `${w.milestones} milestone${w.milestones === 1 ? '' : 's'} reached`,
    w.decisions && `${w.decisions} decision${w.decisions === 1 ? '' : 's'} made`, business && w.found && `${w.found} found out`, kase && w.recorded && `${w.recorded} recorded`].filter(Boolean).join(', ') || 'nothing yet';
  return (
    <Row title="What you did" s="glance-weeks">
      {open.length + done.length > 0 ? <p className="m-0 py-2 text-[15px]" data-s="project-counts">{done.length} done · {open.length} to go</p>
        : <p className="m-0 py-2 text-[15px] text-fg-2">Steps you finish will show here.</p>}
      {total > 0 && <>
        <div className="max-w-xl mt-1">
          <Columns label="The last 8 weeks" ends={[`Week of ${shortDate(weeks[0].start).replace(/^\w+,? /, '')}`, 'This week']}
            items={weeks.map((w, i) => ({ key: w.start, label: i === weeks.length - 1 ? 'This week' : `Week of ${shortDate(w.start)}`, value: w.total, detail: detail(w) }))} />
        </div>
        <p className="m-0 mt-1.5 text-sm text-fg-2">{total} in the last 8 weeks{kase ? ' (tasks, milestones, decisions and what you recorded)' : ''}.</p>
      </>}
      <p className="text-sm text-fg-3 m-0 mt-1.5 pb-1 tabular-nums">Started {shortDate(p.createdAt.slice(0, 10))} · last worked on {shortDate(lastActivity(data, p).slice(0, 10))}</p>
    </Row>
  );
}

// A small column chart (one series, so no legend): each column is focusable and shows its value on hover or focus;
// the words for screen readers list every value.
function Columns({ items, label, ends }: { items: { key: string; label: string; value: number; detail: string }[]; label: string; ends: [string, string] }) {
  const max = Math.max(1, ...items.map(i => i.value));
  return (
    <div>
      <div className="flex items-end gap-1.5 h-20 border-b border-outline" role="list" aria-label={label}>
        {items.map(i => (
          <div key={i.key} role="listitem" tabIndex={0} className="group relative flex-1 flex flex-col justify-end items-center h-full outline-none focus-visible:outline-2 focus-visible:outline-primary rounded-sm" aria-label={`${i.label}: ${i.detail}`} data-value={i.value}>
            <span aria-hidden="true" className="w-full max-w-6 rounded-t-[4px] bg-primary" style={{ height: i.value ? `${Math.max(6, (i.value / max) * 100)}%` : '2px', opacity: i.value ? 1 : 0.35 }} />
            <span role="tooltip" className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-fg text-surface text-xs px-2 py-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity z-10">
              <strong>{i.value}</strong> · {i.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-2 mt-1 text-xs text-fg-3 tabular-nums" aria-hidden="true"><span>{ends[0]}</span><span>{ends[1]}</span></div>
    </div>
  );
}

// A business idea's one page: how many of its four questions are answered.
function OnePage({ p }: { p: Project }) {
  const g = modelProgress(p), href = tabHref(p, 'model');
  return (
    <Row title="Your one page" href={href} s="glance-onepage">
      {g.answered ? <a href={href} className={lineClass} data-s="model-summary">{g.answered === 4 ? 'All four questions answered' : `${g.answered} of 4 questions answered`}</a>
        : <Empty href={href} s="model-summary">Four simple questions put your idea on one page — start with the first</Empty>}
    </Row>
  );
}

// What it depends on, by how it's turning out — three counts, each a link to the one page.
function Beliefs({ p }: { p: Project }) {
  const g = modelProgress(p), href = tabHref(p, 'model'), cells: [string, number][] = [['Not checked yet', g.open], ['Looks true', g.looksTrue], ['Doesn’t hold', g.doesntHold]];
  return (
    <Row title="What must be true" href={href} s="glance-beliefs">
      {g.assumptions ? <ul className="list-none p-0 m-0 py-1 grid grid-cols-3 gap-2 max-w-xl">{cells.map(([label, n]) => (
        <li key={label}><a href={href} className="flex flex-col items-center justify-center min-h-11 rounded-tile border border-outline py-2 px-1 text-fg no-underline hover:bg-surface-2 text-center">
          <span className="text-[20px] font-semibold tabular-nums">{n}</span><span className="text-xs text-fg-2 leading-tight">{label}</span></a></li>))}</ul>
        : <Empty href={href}>What does it depend on? Add what must be true</Empty>}
    </Row>
  );
}

// A case's evidence by status: one bar in three ordered teal steps (to get → have it → reviewed), each part
// focusable with its count, and a legend that names and counts every part (so nothing rests on colour alone).
const STEP = { 'to-get': 'bg-seq-1', have: 'bg-seq-2', reviewed: 'bg-seq-3' } as const;
function EvidenceBar({ p }: { p: Project }) {
  const g = caseCounts(p), parts = ([['to-get', g.toGet], ['have', g.have], ['reviewed', g.reviewed]] as const), href = tabHref(p, 'evidence');
  return (
    <Row title="Evidence" href={href} s="glance-evidence">
      {g.evidence ? <div className="py-2 max-w-xl">
        <div className="flex gap-[2px] h-4 rounded-[4px] overflow-hidden" role="list" aria-label={`${g.evidence} pieces of evidence`}>
          {parts.filter(([, n]) => n > 0).map(([s, n]) => (
            <div key={s} role="listitem" tabIndex={0} title={`${EVIDENCE_STATUS_LABEL[s]}: ${n}`} aria-label={`${EVIDENCE_STATUS_LABEL[s]}: ${n}`} className={`${STEP[s]} focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`} style={{ flexGrow: n }} />
          ))}
        </div>
        <ul className="list-none p-0 m-0 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-2" aria-hidden="true">
          {parts.map(([s, n]) => <li key={s} className="flex items-center gap-1.5"><span className={`inline-block size-3 rounded-[3px] ${STEP[s]}`} />{EVIDENCE_STATUS_LABEL[s]} <span className="font-semibold text-fg tabular-nums">{n}</span></li>)}
        </ul>
      </div> : <Empty href={href}>What could show what happened? Add evidence</Empty>}
    </Row>
  );
}

// Each issue against what's linked to it — the gaps ("nothing linked yet") are where to look next.
function IssueTable({ p }: { p: Project }) {
  const rows = issueGrid(p), href = tabHref(p, 'issues');
  return (
    <Row title="Issues and what's linked" href={href} s="glance-issues">
      {rows.length ? <table className="w-full max-w-2xl text-[14px] border-collapse">
        <thead><tr className="text-left text-xs text-fg-3"><th className="font-semibold py-1 pr-2">Issue</th><th className="font-semibold py-1 px-2 text-right">Evidence</th><th className="font-semibold py-1 pl-2 text-right">Timeline</th></tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.id} className="border-t border-outline" data-issue={r.id}>
            <td className="py-1.5 pr-2 break-words"><a href={href} className="text-fg no-underline hover:underline underline-offset-4">{r.title}</a>
              <span className="block text-xs text-fg-3">{ISSUE_STATUS_LABEL[r.status]}{!r.evidence && !r.entries ? ' · nothing linked yet' : ''}</span></td>
            <td className="py-1.5 px-2 text-right tabular-nums">{r.evidence}</td><td className="py-1.5 pl-2 text-right tabular-nums">{r.entries}</td>
          </tr>))}</tbody>
      </table> : <Empty href={href}>What are you claiming or considering? Add an issue</Empty>}
    </Row>
  );
}

// The timeline: how many entries, the latest, and entries by month.
function MonthBars({ p }: { p: Project }) {
  const months = timelineByMonth(p), entries = timelineInOrder(p), href = tabHref(p, 'timeline');
  const word = (m: string) => parseKey(`${m}-01`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  return (
    <Row title="Timeline" href={href} s="glance-months">
      {entries.length ? <>
        <a href={href} className={lineClass} data-s="timeline-summary">{entries.length} {entries.length === 1 ? 'entry' : 'entries'} · latest {shortDate(entries.at(-1)!.date)}</a>
        <div className="max-w-xl mt-1 pb-1">
          <Columns label="Timeline entries by month" ends={[word(months[0].month), months.length > 1 ? word(months[months.length - 1].month) : '']}
            items={months.map(m => ({ key: m.month, label: word(m.month), value: m.count, detail: `${m.count} ${m.count === 1 ? 'entry' : 'entries'}` }))} />
        </div>
      </> : <Empty href={href}>What happened, in date order? Add the first entry</Empty>}
    </Row>
  );
}
