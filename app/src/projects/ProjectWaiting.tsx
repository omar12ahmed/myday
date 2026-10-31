import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { shortDate, todayKey } from '../data/dates';
import { PROJECT_LIMITS } from '../data/projects';
import { isProjectWaiting, setProjectWaiting, stopProjectWaiting, waitOffer } from '../data/projectWaiting';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { DateKey, MyDayData, Project } from '../data/types';
import { ChaseIt } from '../tasks/ChaseIt';

// A whole project waiting on someone or something (specs/projects-project-waiting.md): the Overview's card while it
// waits, the form (from Manage, or the nudge), and the nudge itself. The rules are in data/projectWaiting.ts. Never
// sent to AI.
// (Focus goes to the first of these that's there.)
const focusSoon = (...ids: string[]) => requestAnimationFrame(() => ids.map(id => document.getElementById(id)).find(Boolean)?.focus());

// While it waits: whom, since when and the day to check back, with Got it, Change and Chase it.
export function ProjectWaitingCard({ data, p }: { data: MyDayData; p: Project }) {
  const [editing, setEditing] = useState(false);
  if (!isProjectWaiting(p)) return null;
  const w = p.waiting;
  function done() {
    if (update(d => (stopProjectWaiting(d, p.id) ? undefined : false))) { toast('No longer waiting.'); focusSoon('projectTitle'); }
  }
  return (
    <Card aria-labelledby="projectWaitingH" id="projectWaiting">
      <h3 id="projectWaitingH" tabIndex={-1} className="m-0">Waiting on someone or something</h3>
      {editing ? <ProjectWaitForm p={p} onDone={() => { setEditing(false); focusSoon('projectWaitingH'); }} /> : (
        <>
          <p className="text-[15px] m-0 mt-2 break-words" data-s="project-waiting-line">Waiting on {w.on} since {shortDate(w.since)}{w.until ? ` · check back ${shortDate(w.until)}` : ''}</p>
          <p className="text-sm text-fg-2 m-0 mt-1">While it waits, MyDay won’t call it quiet or nudge you about it. Its tasks work as usual.</p>
          <div className="flex flex-wrap gap-2.5 mt-3">
            <Button inline variant="primary" data-action="pwait-done" onClick={done}>Got it</Button>
            <Button inline variant="ghost" data-action="pwait-change" onClick={() => setEditing(true)}>Change</Button>
            <ChaseIt data={data} p={p} />
          </div>
        </>
      )}
    </Card>
  );
}

// Who or what, and the day to check back (optional); filled in from the nudge when it can be. A failed save keeps
// what you typed.
export function ProjectWaitForm({ p, start, onDone }: { p: Project; start?: { on: string; until: DateKey | null }; onDone: (saved: boolean) => void }) {
  const [on, setOn] = useState(p.waiting?.on ?? start?.on ?? ''), [until, setUntil] = useState<string>(p.waiting?.until ?? start?.until ?? '');
  function save() {
    const first = !p.waiting;
    if (on.trim() === p.waiting?.on && (until || null) === (p.waiting?.until ?? null)) { onDone(true); return; }
    if (update(d => (setProjectWaiting(d, p.id, on, (until || null) as DateKey | null) ? undefined : false))) {
      toast(first ? `Waiting on ${on.trim()}. MyDay won’t call it quiet while you wait.` : 'Saved.');
      onDone(true);
    }
  }
  return (
    <form className="grid gap-3 mt-3 text-left" onSubmit={e => { e.preventDefault(); save(); }} data-s="project-wait-form">
      <Field label="Who or what is it waiting on?" htmlFor="pWaitOn">
        <TextInput id="pWaitOn" autoFocus value={on} maxLength={PROJECT_LIMITS.waitingOn} placeholder="e.g. the landlord, or the visa office" onChange={e => setOn(e.target.value)} />
      </Field>
      <Field label="Check back on (optional)" htmlFor="pWaitUntil">
        <TextInput id="pWaitUntil" type="date" className="!w-auto" min={todayKey()} value={until} onChange={e => setUntil(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2.5">
        <Button inline type="submit" variant="primary" data-action="pwait-save" disabled={!on.trim()}>{p.waiting ? 'Save' : 'Mark as waiting'}</Button>
        <Button inline variant="ghost" data-action="pwait-cancel" onClick={() => onDone(false)}>Cancel</Button>
      </div>
    </form>
  );
}

// The nudge: every open task is waiting, and the project isn't — offered once on this device for that set of waiting
// tasks (`myday.projects.waitOffer`: project id → the set it was offered for).
const OFFER_KEY = 'myday.projects.waitOffer';
const offered = (): Record<string, string> => { try { const v = JSON.parse(localStorage.getItem(OFFER_KEY) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch { return {}; } };
const putAway = (id: string, sig: string) => { try { localStorage.setItem(OFFER_KEY, JSON.stringify({ ...offered(), [id]: sig })); } catch { /* kept away for this visit */ } };
export function WaitOfferLine({ data, p }: { data: MyDayData; p: Project }) {
  const [asking, setAsking] = useState(false), [away, setAway] = useState('');
  const offer = waitOffer(data, p);
  if (!offer || away === offer.sig || offered()[p.id] === offer.sig) return null;
  const close = (saved: boolean) => { setAsking(false); if (saved) { putAway(p.id, offer.sig); focusSoon('projectWaitingH'); } else focusSoon('pwaitOfferYes'); };
  return (
    <div className="mt-3 pt-3 border-t border-outline" data-s="pwait-offer">
      {asking ? <ProjectWaitForm p={p} start={offer} onDone={close} /> : (
        <>
          <p className="m-0 text-[15px]">Everything here is waiting — mark the project as waiting?</p>
          <div className="flex flex-wrap gap-2.5 mt-2">
            <Button inline variant="tonal" id="pwaitOfferYes" data-action="pwait-offer-yes" onClick={() => setAsking(true)}>Mark as waiting</Button>
            <Button inline variant="ghost" data-action="pwait-offer-no" onClick={() => { putAway(p.id, offer.sig); setAway(offer.sig); focusSoon('projectNextNew', 'projectNextPick'); }}>Not now</Button>
          </div>
        </>
      )}
    </div>
  );
}
