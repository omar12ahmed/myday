import { useState } from 'react';
import { Button } from '../../components/Button';
import { Field, TextInput } from '../../components/Field';
import { shortDate, todayKey } from '../../data/dates';
import { clearCyberRevisit, cyberLessonRecord, flagCyberRevisit, markCyberReady, readyDay, READY_LONG_AGO, unmarkCyberReady } from '../../data/cybersecurity/lessons';
import { cyberCardOf } from '../../data/cybersecurity/cards';
import { curriculumTaskId } from '../../data/cybersecurity/types';
import { STATE_LABEL } from '../../data/study/mastery';
import { update } from '../../data/storage';
import type { MyDayData } from '../../data/types';
import { cyberState, factsOf } from './plan';

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const back = (due: string) => (due <= todayKey() ? 'ready now' : `on ${shortDate(due)}`);

// Under a Cybersecurity lesson's title: where it stands, in words (never a score), with your choices — Ready to move on
// (its knowledge checks come back about a week later), Not ready after all, Needs revision… and Done revisiting
// (data/cybersecurity/lessons.ts). Holding never claims more than its checks show, and the line says so.
export function CyberPlace({ data, lessonId }: { data: MyDayData; lessonId: string }) {
  const [asking, setAsking] = useState(false), [note, setNote] = useState<string | null>(null);
  const facts = factsOf(lessonId), state = cyberState(data, lessonId), rec = cyberLessonRecord(data, lessonId), day = readyDay(data, lessonId);
  const handedIn = data.cybersecurity.attempts.filter(a => a.submittedAt && facts.activityIds.includes(a.activityId)).length;
  const sessions = data.study.sessions.filter(s => s.taskId === curriculumTaskId(lessonId) && s.status === 'done').length;
  const did = [handedIn ? plural(handedIn, 'handed-in attempt') : '', sessions ? plural(sessions, 'study session') : ''].filter(Boolean).join(' and ');
  const nextBack = facts.checks.map(id => cyberCardOf(data, id)?.review.due).filter((x): x is string => !!x).sort()[0];
  const line = state === 'new' ? 'New: nothing handed in or studied yet.'
    : state === 'practised' ? `Practised: ${did}. Mark it ready to move on when it clicks.`
    : state === 'ready' ? `Ready to move on${day && day !== READY_LONG_AGO ? ` since ${shortDate(day)}` : ''}.${nextBack ? ` Its checks are in your revision: the next is ${back(nextBack)}.` : ''}`
    : state === 'holding' ? 'Holding: you recalled its checks on your own a week or more after marking it ready.'
    : rec?.revisit ? `Needs revision${rec.revisit.what ? `: ${rec.revisit.what}` : ''}.` : 'Needs revision: one of its checks slipped after you marked it ready. Recalling it on your own clears this.';
  const ready = () => {
    let added: { id: string; due: string }[] = [];
    if (update(d => { added = markCyberReady(d, facts); })) setNote(added.length ? `Its ${plural(added.length, 'check')} will come back from ${shortDate(added.map(a => a.due).sort()[0])}.`
      : facts.checks.length ? 'Its checks are already in your revision.' : null);
  };
  return <div className="rounded-tile bg-surface border border-outline px-4 py-3 my-3" data-cy-place={state}>
    <p className="m-0 font-semibold">{line}</p>
    {note && <p className="text-sm text-fg-2 m-0 mt-1" data-cy-place-note="">{note}</p>}
    {facts.checks.length > 0 && <p className="text-sm text-fg-2 m-0 mt-1">{STATE_LABEL.holding} means its {plural(facts.checks.length, 'knowledge-check question')} came back right on your own in revision a week or more after Ready. It’s your own record, not verified mastery.</p>}
    {!asking && <div className="flex flex-wrap gap-2 mt-2">
      {state !== 'ready' && state !== 'holding' && <Button inline variant="ghost" data-action="cy-place-ready" onClick={ready}>Ready to move on</Button>}
      {day && <Button inline variant="ghost" data-action="cy-place-unready" onClick={() => { setNote(null); update(d => { if (!unmarkCyberReady(d, lessonId)) return false; }); }}>Not ready after all</Button>}
      {rec?.revisit ? <Button inline variant="ghost" data-action="cy-place-revisited" onClick={() => update(d => { if (!clearCyberRevisit(d, lessonId)) return false; })}>Done revisiting</Button>
        : <Button inline variant="ghost" data-action="cy-place-revisit" onClick={() => setAsking(true)}>Needs revision…</Button>}
    </div>}
    {asking && <RevisitForm lessonId={lessonId} onDone={() => setAsking(false)} />}
  </div>;
}

function RevisitForm({ lessonId, onDone }: { lessonId: string; onDone: () => void }) {
  const [what, setWhat] = useState('');
  const save = () => { if (update(d => { flagCyberRevisit(d, lessonId, what); })) onDone(); };
  return <div className="grid gap-2 mt-2" data-cy-revisit-form="">
    <Field label="What needs work?" htmlFor="cyRevisitWhat"><TextInput id="cyRevisitWhat" maxLength={300} value={what} onChange={e => setWhat(e.target.value)} placeholder="e.g. reading a subnet mask" /></Field>
    <div className="flex flex-wrap gap-2"><Button variant="primary" data-action="cy-revisit-save" onClick={save}>Mark it to revisit</Button><Button variant="ghost" onClick={onDone}>Cancel</Button></div>
  </div>;
}
