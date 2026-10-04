import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { Choice, Choices, Note } from '../components/parts';
import { shortDate, todayKey } from '../data/dates';
import { BLOCKER_LABEL } from '../data/patterns/notice';
import { update } from '../data/storage';
import { nextDayOff, TASK_LIMITS, unstick } from '../data/tasks';
import { toast } from '../data/toast';
import type { Blocker, MyDayData, TaskItem } from '../data/types';

const REASONS: Blocker[] = ['big', 'start', 'boring', 'tired', 'info', 'notneeded', 'other'];

// "What's getting in the way?" for a task that keeps moving (or whenever you ask). Each answer changes the task so
// it's easier to start — it never just says "try again". See unstick() in data/tasks.ts.
export function StuckCard({ data, t, stuck }: { data: MyDayData; t: TaskItem; stuck: boolean }) {
  const [reason, setReason] = useState<Blocker | null>(null);
  const [text, setText] = useState('');
  const k = todayKey(), off = nextDayOff(data, k);
  const intro = !stuck ? null
    : t.postponed >= 3 ? `This one has moved ${t.postponed} times.` : t.due ? `This one has been waiting since ${shortDate(t.due)}.` : null;
  function go() {
    if (!reason) return;
    let msg: string | null = null;
    update(d => { msg = unstick(d, t.id, { reason, step: text, need: text }, k); if (!msg) return false; });
    if (msg) { toast(msg); setReason(null); setText(''); }
  }
  const field = (label: string, placeholder: string) => (
    <Field label={label} htmlFor="stuckText" className="mt-3">
      <TextInput id="stuckText" value={text} maxLength={TASK_LIMITS.title} placeholder={placeholder} onChange={e => setText(e.target.value)} />
    </Field>
  );
  const action: Record<Blocker, { label: string; body?: React.ReactNode; needsText?: boolean }> = {
    big: { label: 'Add it for today', body: field("What's a first 10-minute piece?", 'e.g. clear just the desk'), needsText: true },
    start: { label: "Make that today's task", body: field("What's the very first step?", 'e.g. find the letter'), needsText: true },
    boring: { label: 'Make it 10 minutes today', body: <p className="text-[15px] m-0 mt-3">A 10-minute version, for today. Stopping after 10 minutes is fine.</p> },
    tired: { label: `Move it to ${shortDate(off.date)}`, body: <p className="text-[15px] m-0 mt-3">To {off.label}, when there may be more energy for it.</p> },
    info: { label: 'Note it, and keep it for later', body: field('What do you need? (optional)', 'e.g. the account number') },
    notneeded: { label: 'Let it go', body: <p className="text-[15px] m-0 mt-3">It moves to Done as “let go”. You can bring it back any time by unticking it.</p> },
    other: { label: 'Just note it' },
  };
  const a = reason ? action[reason] : null;
  return (
    <Card id="stuckCard" aria-labelledby="stuck-h" tone={stuck ? 'accent' : 'plain'}>
      <h3 id="stuck-h" className="m-0">What's getting in the way?</h3>
      {intro && <p className="text-[15px] m-0 mt-1" data-s="stuck-intro">{intro} That's useful to know, not a problem — let's change the task, not push harder.</p>}
      <div className="mt-3"><Choices label="What's getting in the way?">
        {REASONS.map(r => <Choice key={r} on={reason === r} data-s="blocker" data-id={r} onClick={() => { setReason(r); setText(''); }}>{BLOCKER_LABEL[r]}</Choice>)}
      </Choices></div>
      {a && (
        <form onSubmit={e => { e.preventDefault(); go(); }}>
          {a.body}
          <Button inline type="submit" variant="primary" className="mt-3" data-action="unstick" disabled={a.needsText && !text.trim()}>{a.label}</Button>
        </form>
      )}
      <Note className="mb-0 mt-3 text-sm">Your answer is kept with the task, so MyDay can notice what usually gets in the way.</Note>
    </Card>
  );
}
