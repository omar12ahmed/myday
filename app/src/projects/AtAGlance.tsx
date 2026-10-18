import { ArrowRight, CalendarClock, LayoutDashboard, Lightbulb } from 'lucide-react';
import type { ReactNode } from 'react';
import { openCapture } from '../capture/openCapture';
import { Card } from '../components/Card';
import { isBusiness, isCase, modelProgress } from '../data/businessModel';
import { caseCounts, EVIDENCE_STATUS_LABEL, ISSUE_STATUS_LABEL } from '../data/caseFile';
import { parseKey, shortDate, todayKey } from '../data/dates';
import { issueGrid, nextDates, tiles, timelineByMonth, weeksDone, worthALook, type Week } from '../data/projectDashboard';
import { milestoneProgress } from '../data/projectPlan';
import type { MyDayData, Project } from '../data/types';
import { AiHelp } from './PlanViews';
import { tabHref } from './planText';

// "At a glance" (1.36.0): a project's dashboard at the top of its Overview — four tiles for its kind, pictures only when
// there's something to show, at most three gentle pointers, and "Summarise this" (Ask MyDay, only on your tap, never on
// a private project). The numbers are in data/projectDashboard.ts. Counts and places only; every picture has its words
// for screen readers, a hover or focus readout, and never relies on colour alone.
export function AtAGlance({ data, p }: { data: MyDayData; p: Project }) {
  const k = todayKey(), ts = tiles(data, p, k), weeks = weeksDone(data, p, k), pointers = worthALook(data, p, k);
  const ms = milestoneProgress(p), anyWeek = weeks.some(w => w.total > 0);
  const pics = [
    ms.total > 0 && <MilestoneRoute key="route" p={p} />,
    anyWeek && <WeekBars key="weeks" weeks={weeks} kase={isCase(p)} business={isBusiness(p)} />,
    isBusiness(p) && (p.model?.assumptions.length ?? 0) > 0 && <Beliefs key="beliefs" p={p} />,
    isCase(p) && (p.case?.evidence.length ?? 0) > 0 && <EvidenceBar key="evidence" p={p} />,
    isCase(p) && (p.case?.issues.length ?? 0) > 0 && <IssueTable key="issues" p={p} />,
    isCase(p) && (p.case?.timeline.length ?? 0) > 0 && <MonthBars key="months" p={p} />,
    isCase(p) && nextDates(data, p, k).length > 0 && <NextDates key="dates" data={data} p={p} />,
  ].filter(Boolean);
  return (
    <Card aria-labelledby="pjGlanceH" id="projectGlance">
      <h3 id="pjGlanceH" className="flex items-center gap-2"><LayoutDashboard size={18} aria-hidden="true" className="text-primary" /> At a glance</h3>
      <ul className="list-none p-0 m-0 grid grid-cols-2 lg:grid-cols-4 gap-2.5" data-s="glance-tiles">
        {ts.map(t => (
          <li key={t.key} className="min-w-0">
            <a href={t.href} className="flex flex-col h-full min-h-11 rounded-tile border border-outline bg-surface-3 px-3 py-2.5 text-fg no-underline hover:bg-surface-2 transition-colors" data-tile={t.key}>
              <span className="text-xs font-semibold text-fg-3">{t.label}</span>
              <span className="text-[17px] font-semibold leading-snug break-words line-clamp-2 mt-0.5">{t.value}</span>
              <span className="text-[13px] text-fg-2 leading-snug break-words line-clamp-2 mt-0.5">{t.sub}</span>
            </a>
          </li>
        ))}
      </ul>
      {pics.length > 0 && <div className="grid gap-x-6 lg:grid-cols-2" data-s="glance-pictures">{pics}</div>}
      {pointers.length > 0 && (
        <div className="mt-4" data-s="glance-pointers">
          <p className="m-0 text-sm font-semibold text-fg-2 flex items-center gap-1.5"><Lightbulb size={15} aria-hidden="true" /> Worth a look</p>
          <ul className="list-none p-0 m-0 mt-1">{pointers.map(x => (
            <li key={x.key}><a href={x.href} className="flex items-center justify-between gap-2 min-h-11 py-1.5 text-fg no-underline hover:underline underline-offset-4 break-words" data-pointer={x.key}>
              <span className="min-w-0">{x.text}</span><ArrowRight size={16} aria-hidden="true" className="flex-none text-fg-3" /></a></li>))}</ul>
        </div>
      )}
      <AiHelp p={p} action="glance-summary" label="Summarise this" onAsk={() => openCapture('Summarise where this project is, and the one next step')} />
    </Card>
  );
}

const Section = ({ title, s, children }: { title: string; s: string; children: ReactNode }) => (
  <section className="mt-5 min-w-0" aria-label={title} data-s={s}><h4 className="m-0 mb-2 text-sm font-semibold text-fg-2">{title}</h4>{children}</section>
);

// Milestones as stations on a line: reached (filled), the next one ("you are here"), and the ones still ahead.
function MilestoneRoute({ p }: { p: Project }) {
  const list = p.milestones ?? [], { reached, total, next } = milestoneProgress(p);
  const shown = list.slice(0, 12);
  return (
    <Section title="Milestones on the way" s="glance-route">
      <ol className="list-none p-0 m-0 relative flex items-center justify-between gap-1 h-6" aria-label={`${reached} of ${total} milestones reached`}>
        <span aria-hidden="true" className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 bg-track" />
        {shown.map(m => {
          const here = m === next;
          return <li key={m.id} className="relative z-[1]" title={`${m.title}${m.reachedOn ? ' — reached' : here ? ' — next' : ''}`}>
            <span className="sr-only">{m.title}{m.reachedOn ? ': reached' : here ? ': next' : ''}</span>
            <span aria-hidden="true" className={`block rounded-full border-2 border-surface ${m.reachedOn ? 'size-4 bg-primary' : here ? 'size-5 bg-surface ring-2 ring-primary' : 'size-3.5 bg-surface ring-2 ring-outline-strong'}`} />
          </li>;
        })}
      </ol>
      <p className="m-0 mt-2 text-[15px]">{reached} of {total} reached{list.length > shown.length ? ` (the first ${shown.length} shown)` : ''}{next ? <> · <span className="font-semibold">Next:</span> {next.title}</> : ''}</p>
    </Section>
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
function WeekBars({ weeks, kase, business }: { weeks: Week[]; kase: boolean; business: boolean }) {
  const detail = (w: Week) => [w.tasks && `${w.tasks} task${w.tasks === 1 ? '' : 's'} done`, w.milestones && `${w.milestones} milestone${w.milestones === 1 ? '' : 's'} reached`,
    w.decisions && `${w.decisions} decision${w.decisions === 1 ? '' : 's'} made`, business && w.found && `${w.found} found out`, kase && w.recorded && `${w.recorded} recorded`].filter(Boolean).join(', ') || 'nothing yet';
  const total = weeks.reduce((a, w) => a + w.total, 0);
  return (
    <Section title="What you did, week by week" s="glance-weeks">
      <Columns label="The last 8 weeks" ends={[`Week of ${shortDate(weeks[0].start).replace(/^\w+,? /, '')}`, 'This week']}
        items={weeks.map((w, i) => ({ key: w.start, label: i === weeks.length - 1 ? 'This week' : `Week of ${shortDate(w.start)}`, value: w.total, detail: detail(w) }))} />
      <p className="m-0 mt-1.5 text-sm text-fg-2">{total} in the last 8 weeks{kase ? ' (tasks, milestones, decisions and what you recorded)' : ''}.</p>
    </Section>
  );
}
function MonthBars({ p }: { p: Project }) {
  const months = timelineByMonth(p), word = (m: string) => parseKey(`${m}-01`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  return (
    <Section title="Timeline entries by month" s="glance-months">
      <Columns label="Timeline entries by month" ends={[word(months[0].month), months.length > 1 ? word(months[months.length - 1].month) : '']}
        items={months.map(m => ({ key: m.month, label: word(m.month), value: m.count, detail: `${m.count} ${m.count === 1 ? 'entry' : 'entries'}` }))} />
    </Section>
  );
}

// A business idea's beliefs by how they're turning out — three counts, each a link to the one page.
function Beliefs({ p }: { p: Project }) {
  const g = modelProgress(p), cells: [string, number][] = [['Not checked yet', g.open], ['Looks true', g.looksTrue], ['Doesn’t hold', g.doesntHold]];
  return (
    <Section title="What must be true" s="glance-beliefs">
      <ul className="list-none p-0 m-0 grid grid-cols-3 gap-2">{cells.map(([label, n]) => (
        <li key={label}><a href={tabHref(p, 'model')} className="flex flex-col items-center justify-center min-h-11 rounded-tile border border-outline py-2 px-1 text-fg no-underline hover:bg-surface-2 text-center">
          <span className="text-[20px] font-semibold tabular-nums">{n}</span><span className="text-xs text-fg-2 leading-tight">{label}</span></a></li>))}</ul>
    </Section>
  );
}

// A case's evidence by status: one bar in three ordered teal steps (to get → have it → reviewed), each part
// focusable with its count, and a legend that names and counts every part (so nothing rests on colour alone).
const STEP = { 'to-get': 'bg-seq-1', have: 'bg-seq-2', reviewed: 'bg-seq-3' } as const;
function EvidenceBar({ p }: { p: Project }) {
  const g = caseCounts(p), parts = ([['to-get', g.toGet], ['have', g.have], ['reviewed', g.reviewed]] as const);
  return (
    <Section title="Evidence" s="glance-evidence">
      <div className="flex gap-[2px] h-4 rounded-[4px] overflow-hidden" role="list" aria-label={`${g.evidence} pieces of evidence`}>
        {parts.filter(([, n]) => n > 0).map(([s, n]) => (
          <div key={s} role="listitem" tabIndex={0} title={`${EVIDENCE_STATUS_LABEL[s]}: ${n}`} aria-label={`${EVIDENCE_STATUS_LABEL[s]}: ${n}`} className={`${STEP[s]} focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`} style={{ flexGrow: n }} />
        ))}
      </div>
      <ul className="list-none p-0 m-0 mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-2" aria-hidden="true">
        {parts.map(([s, n]) => <li key={s} className="flex items-center gap-1.5"><span className={`inline-block size-3 rounded-[3px] ${STEP[s]}`} />{EVIDENCE_STATUS_LABEL[s]} <span className="font-semibold text-fg tabular-nums">{n}</span></li>)}
      </ul>
    </Section>
  );
}

// Each issue against what's linked to it — the gaps ("nothing linked yet") are where to look next.
function IssueTable({ p }: { p: Project }) {
  const rows = issueGrid(p);
  return (
    <Section title="Issues and what's linked" s="glance-issues">
      <table className="w-full text-[14px] border-collapse">
        <thead><tr className="text-left text-xs text-fg-3"><th className="font-semibold py-1 pr-2">Issue</th><th className="font-semibold py-1 px-2 text-right">Evidence</th><th className="font-semibold py-1 pl-2 text-right">Timeline</th></tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.id} className="border-t border-outline" data-issue={r.id}>
            <td className="py-1.5 pr-2 break-words"><a href={tabHref(p, 'issues')} className="text-fg no-underline hover:underline underline-offset-4">{r.title}</a>
              <span className="block text-xs text-fg-3">{ISSUE_STATUS_LABEL[r.status]}{!r.evidence && !r.entries ? ' · nothing linked yet' : ''}</span></td>
            <td className="py-1.5 px-2 text-right tabular-nums">{r.evidence}</td><td className="py-1.5 pl-2 text-right tabular-nums">{r.entries}</td>
          </tr>))}</tbody>
      </table>
    </Section>
  );
}

function NextDates({ data, p }: { data: MyDayData; p: Project }) {
  return (
    <Section title="Next dates" s="glance-dates">
      <ul className="list-none p-0 m-0">{nextDates(data, p).map((d, i) => (
        <li key={i}><a href={d.href} className="flex items-center gap-2 min-h-11 py-1 text-fg no-underline hover:underline underline-offset-4">
          <CalendarClock size={16} aria-hidden="true" className="flex-none text-fg-3" /><span className="tabular-nums text-fg-2 flex-none">{shortDate(d.day)}{d.time ? `, ${d.time}` : ''}</span><span className="min-w-0 break-words">{d.title}</span></a></li>))}</ul>
    </Section>
  );
}
