import { TriangleAlert } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CategoryChip } from '../components/CategoryChip';
import { CommitInput, Field } from '../components/Field';
import { Why } from '../components/Why';
import { isTime, minToTime, rangeMin, timeToMin } from '../data/dates';
import { intIn } from '../data/normalize';
import { taskLimit } from '../data/patterns/adapt';
import { minutesLabel } from '../data/plan';
import { propChanges, type Proposal, type ProposalItem } from '../data/proposal';
import { conflictsFor } from '../data/schedule';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';

// The suggested plan ("Not saved yet"). Every change here only edits the proposal in memory;
// nothing is saved until "Apply". `change` edits a copy of the proposal and redraws it.
export interface ProposalActions {
  change: (fn: (p: Proposal) => void, opts?: { place?: boolean; touched?: boolean }) => void;
  apply: () => void;
  cancel: () => void;
  refresh: () => void;
}

function changeText(it: ProposalItem): string {
  if (it.done) return 'Done — kept exactly as it is.';
  if (it.isNew) return it.status === 'today' ? `New — ${it.note || 'added to today'}.` : '';
  if (it.status === 'later') return '';
  const o = it.orig!;
  if (o.start === it.start && o.minutes === it.minutes) return 'No change.';
  const was = o.start !== null ? rangeMin(o.start, o.start + o.minutes) : 'no set time';
  return `Was ${was}${o.minutes !== it.minutes ? ` (${o.minutes} min)` : ''}.`;
}

function Row({ it, p, data, placed, index, animate, act }: { it: ProposalItem; p: Proposal; data: MyDayData; placed: ProposalItem[]; index: number; animate: boolean; act: ProposalActions }) {
  const t = it.task;
  const when = it.status === 'later' ? 'Later'
    : it.start !== null ? rangeMin(it.start, it.start + it.minutes)
    : it.done ? 'Done' : it.anytime ? 'Any time today' : 'No time yet';
  const bits = [minutesLabel(it.minutes, t.baseMinutes, t.shrunk && it.minutes === t.minutes)];
  if (t.fromQueue) bits.push('carried over');
  const change = p.mode === 'review' ? changeText(it) : '';
  const others = placed.filter(o => o !== it).map(o => ({ start: o.start as number, end: (o.start as number) + o.minutes, label: o.task.title }));
  const warns = it.status === 'today' && it.start !== null && !it.done ? conflictsFor(data, p.dayKey, it.start, it.minutes, others, true) : [];
  const unplaced = it.status === 'today' && it.start === null && !it.done && !it.anytime && it.reason;
  const editable = !it.done && it.status === 'today';
  const find = (q: Proposal) => q.items.find(x => x.uid === it.uid)!;

  return (
    <li
      className={`prop-item${it.status === 'later' ? ' later border-dashed border-outline bg-transparent' : ' bg-surface-2 border-transparent'}${animate ? ' stagger' : ''} border rounded-tile p-3.5`}
      style={animate ? ({ '--i': index } as React.CSSProperties) : undefined}
    >
      <p className="prop-when m-0 mb-1.5 text-[15px] font-bold tabular-nums">{when}</p>
      <p className="title m-0 font-medium leading-snug">{t.title}</p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm text-fg-3 tabular-nums">
        <CategoryChip kind={t.category} />
        <span className="meta">{bits.join(' · ')}</span>
      </div>
      {change && <p className="change m-0 mt-1 text-sm font-semibold text-primary">{change}</p>}
      {p.mode === 'build' && it.why && it.status === 'today' && <Why className="mt-2" note={it.note} why={it.why} />}
      {warns.map(w => (
        <p key={w} className="warn flex gap-1.5 items-start m-0 mt-2 px-2.5 py-1 rounded-lg bg-warn-c text-on-warn-c text-sm w-fit">
          <TriangleAlert size={16} className="flex-none mt-0.5" aria-hidden="true" />{w}
        </p>
      ))}
      {unplaced && (
        <>
          <p className="why text-sm text-fg-2 mt-2 mb-0">Unscheduled: {it.reason}</p>
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            {it.maxFit && <Button inline className="w-full" data-action="prop-shorten" data-uid={it.uid} onClick={() => act.change(q => { const x = find(q); x.minutes = x.maxFit!; x.start = null; }, { place: true })}>Shorten to {it.maxFit} min</Button>}
            <Button inline className="w-full" data-action="prop-later" data-uid={it.uid} onClick={() => act.change(q => { const x = find(q); x.status = 'later'; x.start = null; x.anytime = false; })}>Leave for later</Button>
          </div>
        </>
      )}
      {it.anytime && it.status === 'today' && !it.done && <p className="why text-sm text-fg-2 mt-2 mb-0">No set time — do it whenever suits you today.</p>}
      {it.status === 'later' && (
        <>
          <p className="why text-sm text-fg-2 mt-2 mb-2">{it.note ? it.note + ' ' : ''}It'll wait in your queue for another day.</p>
          <Button inline data-action="prop-keep" data-uid={it.uid} onClick={() => act.change(q => { const x = find(q); x.status = 'today'; x.note = null; x.start = null; }, { place: true })}>Keep it today</Button>
        </>
      )}
      {p.editing && editable && (
        <div className="edit-ctl mt-3 pt-3 border-t border-outline">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Start" htmlFor={`pt-${it.uid}`}>
              <CommitInput key={`t${it.start}`} id={`pt-${it.uid}`} type="time" data-action="prop-time" data-uid={it.uid} defaultValue={it.start !== null ? minToTime(it.start) : ''}
                onCommit={el => {
                  const v = el.value.slice(0, 5);
                  act.change(q => { const x = find(q); x.start = isTime(v) ? timeToMin(v) : null; x.anytime = !isTime(v); });
                }} />
            </Field>
            <Field label="Minutes" htmlFor={`pm-${it.uid}`}>
              <CommitInput key={`m${it.minutes}`} id={`pm-${it.uid}`} type="number" inputMode="numeric" min={5} max={600} step={5} data-action="prop-minutes" data-uid={it.uid} defaultValue={it.minutes}
                onCommit={el => {
                  const m = intIn(el.value, 5, 600, null);
                  if (m === null) { el.value = String(it.minutes); toast('Please use 5 to 600 minutes.'); return; }
                  if (m !== it.minutes) act.change(q => { find(q).minutes = m; });
                }} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            <Button inline className="w-full" data-action="prop-anytime" data-uid={it.uid} onClick={() => act.change(q => { const x = find(q); x.start = null; x.anytime = true; x.reason = null; })}>No set time</Button>
            <Button inline className="w-full" data-action="prop-later" data-uid={it.uid} onClick={() => act.change(q => { const x = find(q); x.status = 'later'; x.start = null; x.anytime = false; })}>Leave for later</Button>
          </div>
        </div>
      )}
    </li>
  );
}

export function ProposalCard({ p, data, animate, act }: { p: Proposal; data: MyDayData; animate: boolean; act: ProposalActions }) {
  const isReview = p.mode === 'review', limit = taskLimit(data, p.energy);
  const order = (it: ProposalItem) => (it.status !== 'today' ? 3e6 : it.start !== null ? it.start : it.done ? -1 : 2e6);
  const items = p.items.slice().sort((a, b) => order(a) - order(b));
  const placed = p.items.filter(i => i.status === 'today' && i.start !== null);
  const empty = !p.items.length;
  return (
    <Card tone="accent" id="proposalCard" aria-labelledby="proposal-h" className="scroll-mt-24">
      <span className="eyebrow block text-xs font-bold tracking-[.08em] uppercase text-primary mb-0.5">Not saved yet</span>
      <h2 id="proposal-h">{isReview ? 'Proposed changes' : 'Proposed plan'}</h2>
      <p className="text-[15px] text-fg-2">Energy {p.energy} · room for {limit} task{limit === 1 ? '' : 's'}. Nothing is saved until you {isReview ? 'apply the changes' : 'apply it'}.</p>
      {p.fewer && <Why className="mb-3" note={p.fewer.note} why={p.fewer.why} />}
      {p.stale && (
        <div className="stale bg-warn-c text-on-warn-c rounded-tile px-3.5 py-3 mb-3">
          <p className="text-[15px] mb-2">Your context changed after you edited this proposal.</p>
          <Button inline data-action="prop-refresh" onClick={act.refresh}>Start a fresh proposal</Button>
        </div>
      )}
      {isReview && !propChanges(p) && <p className="text-[15px]">Everything still fits — nothing needs to change.</p>}
      {empty && <p className="text-[15px] text-fg-2">There's nothing to suggest — your task lists are empty. Applying makes today a rest day.</p>}
      <ul className="space-y-2.5 mt-3.5">
        {items.map((it, i) => <Row key={it.uid + (p.editing ? '-e' : '')} it={it} p={p} data={data} placed={placed} index={i} animate={animate} act={act} />)}
      </ul>
      <div className="grid gap-2.5 mt-3.5">
        {p.editing ? (
          <>
            <Button variant="primary" data-action="prop-done-edit" onClick={() => act.change(q => { q.editing = false; }, { touched: false })}>Done editing</Button>
            <Button data-action="prop-resuggest" onClick={() => act.change(q => { q.items.forEach(it => { if (!it.done && it.status === 'today') { it.start = null; it.anytime = false; } }); }, { place: true })}>Re-suggest all times</Button>
          </>
        ) : (
          <>
            <Button variant="primary" data-action="prop-apply" onClick={act.apply}>{isReview ? 'Apply changes' : 'Apply this plan'}</Button>
            {!empty && <Button data-action="prop-edit" onClick={() => act.change(q => { q.editing = true; }, { touched: false })}>Edit</Button>}
          </>
        )}
        <Button variant="ghost" data-action="prop-cancel" onClick={act.cancel}>{isReview ? 'Cancel — keep my plan as it is' : 'Cancel'}</Button>
      </div>
    </Card>
  );
}
