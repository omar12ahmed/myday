import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { Choice, Choices, Note } from '../components/parts';
import { shortDate, todayKey } from '../data/dates';
import { BLOCKER_LABEL } from '../data/patterns/notice';
import { update } from '../data/storage';
import { nextDayOff, setWaiting, TASK_LIMITS, unstick } from '../data/tasks';
import { toast } from '../data/toast';
import type { Blocker, DateKey, MyDayData, TaskItem } from '../data/types';

// "Waiting on someone or something" (1.50.0) sits among the reasons but isn't kept as one: it marks the task as waiting
// (data/tasks.ts setWaiting), so an older MyDay, which drops reasons it doesn't know, loses nothing.
type Reason = Blocker | 'waiting';
const REASONS: Reason[] = ['big', 'start', 'boring', 'tired', 'info', 'waiting', 'notneeded', 'other'];
const WAITING_LABEL = "I'm waiting on someone or something";

// "What's getting in the way?" for a task that keeps moving (or whenever you ask). Each answer changes the task so
// it's easier to start — it never just says "try again". See unstick() in data/tasks.ts.
export function StuckCard({ data, t, stuck }: { data: MyDayData; t: TaskItem; stuck: boolean }) {
  const [reason, setReason] = useState<Reason | null>(null);
  const [text, setText] = useState(''), [until, setUntil] = useState('');
  const k = todayKey(), off = nextDayOff(data, k);
  const intro = !stuck ? null
    : t.postponed >= 3 ? `This one has moved ${t.postponed} times.` : t.due ? `This one was planned for ${shortDate(t.due)}.` : null;
  function go() {
    if (!reason) return;
    if (reason === 'waiting') {
      if (update(d => (setWaiting(d.tasks, t.id, text, (until || null) as DateKey | null, k) ? undefined : false))) toast(`Waiting on ${text.trim()}. MyDay won’t pick it as a next step while you wait.`);
      return;
    }
    let msg: string | null = null;
    update(d => { msg = unstick(d, t.id, { reason, step: text, need: text }, k); if (!msg) return false; });
    if (msg) { toast(msg); setReason(null); setText(''); }
  }
  const field = (label: string, placeholder: string) => (
    <Field label={label} htmlFor="stuckText" className="mt-3">
      <TextInput id="stuckText" value={text} maxLength={TASK_LIMITS.title} placeholder={placeholder} onChange={e => setText(e.target.value)} />
    </Field>
  );
  const action: Record<Reason, { label: string; body?: React.ReactNode; needsText?: boolean }> = {
    big: { label: 'Add it for today', body: field("What's a first 10-minute piece?", 'e.g. clear just the desk'), needsText: true },
    start: { label: "Make that today's task", body: field("What's the very first step?", 'e.g. find the letter'), needsText: true },
    boring: { label: 'Make it 10 minutes today', body: <p className="text-[15px] m-0 mt-3">A 10-minute version, for today. Stopping after 10 minutes is fine.</p> },
    tired: { label: `Move it to ${shortDate(off.date)}`, body: <p className="text-[15px] m-0 mt-3">To {off.label}, when there may be more energy for it.</p> },
    info: { label: 'Note it, and keep it for later', body: field('What do you need? (optional)', 'e.g. the account number') },
    waiting: { label: 'Mark it as waiting', needsText: true, body: <>
      {field('Who or what are you waiting on?', "e.g. Priya, or the builder's quote")}
      <Field label="Expected by (optional)" htmlFor="stuckUntil" className="mt-3"><TextInput id="stuckUntil" type="date" className="!w-auto" min={k} value={until} onChange={e => setUntil(e.target.value)} /></Field>
    </> },
    notneeded: { label: 'Let it go', body: <p className="text-[15px] m-0 mt-3">It moves to Done as “let go”. You can bring it back any time by unticking it.</p> },
    other: { label: 'Just note it' },
  };
  const a = reason ? action[reason] : null;
  return (
    <Card id="stuckCard" aria-labelledby="stuck-h" tone={stuck ? 'accent' : 'plain'}>
      <h3 id="stuck-h" className="m-0">What's getting in the way?</h3>
      {intro && <p className="text-[15px] m-0 mt-1" data-s="stuck-intro">{intro} That's useful to know, not a problem — let's change the task, not push harder.</p>}
      <div className="mt-3"><Choices label="What's getting in the way?">
        {REASONS.map(r => <Choice key={r} on={reason === r} data-s="blocker" data-id={r} onClick={() => { setReason(r); setText(''); setUntil(''); }}>{r === 'waiting' ? WAITING_LABEL : BLOCKER_LABEL[r]}</Choice>)}
      </Choices></div>
      {a && (
        <form onSubmit={e => { e.preventDefault(); go(); }}>
          {a.body}
          <Button inline type="submit" variant="primary" className="mt-3" data-action="unstick" disabled={a.needsText && !text.trim()}>{a.label}</Button>
        </form>
      )}
      {reason !== 'waiting' && <Note className="mb-0 mt-3 text-sm">Your answer is kept with the task, so MyDay can notice what usually gets in the way.</Note>}
    </Card>
  );
}
