import { useEffect, useRef, useState } from 'react';
import { AI_MODE } from '../ai/request';
import { aiReach } from '../ai/reach';
import { openCapture } from '../capture/openCapture';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { Choice, Choices, ExternalLink, LinkButton, Note, TextLink } from '../components/parts';
import { todayKey } from '../data/dates';
import { answerLabel, type Answer } from '../data/patterns/notice';
import { projectById } from '../data/projects';
import { update } from '../data/storage';
import { addToTodaysPlan, noteBlocker, notToday, onTodaysPlan, planRoom, TASK_LIMITS, tickStep, unstick } from '../data/tasks';
import { startTimer, timerIsStale } from '../data/timer';
import { toast } from '../data/toast';
import type { MyDayData, StartKind, TaskItem } from '../data/types';

// The starting answers it offers: the Stuck card's that are about beginning, and the three newer ones.
const ANSWERS: Answer[] = ['big', 'start', 'going', 'perfect', 'tired', 'pulled', 'boring'];
const KINDS: Answer[] = ['going', 'perfect', 'pulled'];
const URL_IN = /https?:\/\/[^\s<>"')]+/;
const linkIn = (notes: string) => URL_IN.exec(notes)?.[0].replace(/[.,;:!?]+$/, '') ?? null; // (not a full stop after it)

// "Help me start" (specs/help-me-start.md): a short card on a task's page that stands at the door with you — what's in
// the way (if you like), what to open, one small act, then your call. Two taps to the first action, every part
// skippable, no AI, and "not today" or "let it go" never counted against you. Your answer is kept with the task, as the
// Stuck card's are, once you act on it (so a mis-tap isn't).
// `onKeep`: told before an answer is kept, so the page can keep the Stuck card where it is (see TaskEditor).
// `focusOnOpen`: arrived from Today's Up next task, so focus starts on the card (its heading).
export function HelpMeStart({ data, t, onClose, onKeep, focusOnOpen = false }: { data: MyDayData; t: TaskItem; onClose: () => void; onKeep?: () => void; focusOnOpen?: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (focusOnOpen) { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'start' }); } }, [focusOnOpen]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [smaller, setSmaller] = useState(false), [piece, setPiece] = useState('');
  const k = todayKey();
  const project = projectById(data, t.projectId);
  const next = t.steps?.find(s => !s.done) ?? null;
  const link = linkIn(t.notes);
  const planned = onTodaysPlan(data, t), room = planRoom(data);
  const canTime = planned || (room.built && !room.rest && room.room > 0);
  const askable = AI_MODE !== 'off' && aiReach(data).task(t);
  // Keeps your answer (if you gave one) with the task, inside the change you're making; true if it was new today.
  const keep = (d: MyDayData) => !!answer && noteBlocker(d, t.id, KINDS.includes(answer) ? 'other' : answer as Exclude<Answer, StartKind>, k, KINDS.includes(answer) ? answer as StartKind : undefined);
  const act = () => { if (answer) onKeep?.(); };
  // Today draws the timer once it's there; until then, wait a few frames for it.
  const toTimer = (n = 0) => { const el = document.getElementById('timerCard'); if (el) el.scrollIntoView({ block: 'center' }); else if (n < 60) requestAnimationFrame(() => toTimer(n + 1)); };

  function fiveMinutes() {
    // As Today's own timer: on today's plan (added if there's room), and it says so if it takes the timer from another task.
    let how: 'started' | 'switched' | 'running' | 'full' | 'no-plan' | 'missing' = 'missing';
    act();
    update(d => {
      const task = d.tasks.items.find(x => x.id === t.id);
      if (!task) return false;
      if (!onTodaysPlan(d, task, k)) { const r = addToTodaysPlan(d, t.id, k); if (r !== 'added') { how = r; return false; } }
      if (!task.planUid) return false;
      const running = d.timer && !timerIsStale(d) && !d.timer.finished ? d.timer : null;
      if (running?.uid === task.planUid) { how = 'running'; return keep(d) ? undefined : false; } // its own timer's already going
      keep(d); startTimer(d, task.planUid, 'start', 5); how = running ? 'switched' : 'started';
    });
    if (how === 'missing') return;
    if (how === 'full' || how === 'no-plan') { toast(how === 'full' ? 'Today’s plan is full, so there’s no room for the timer today.' : 'The timer needs today’s plan: build your day on Today first.'); return; }
    toast(how === 'running' ? 'Its timer is already going.' : how === 'switched' ? 'Switched the timer to this task: five minutes. Stopping then is fine.' : 'Five minutes. Stopping then is fine — you’ve started.');
    location.hash = 'today';
    toTimer();
  }
  function tick() {
    if (!next) return;
    act();
    if (update(d => { keep(d); return tickStep(d.tasks, t.id, next.id, true) ? undefined : false; })) toast(`Ticked: ${next.text}. That’s a start.`);
  }
  function think(opener: HTMLElement) {
    act();
    update(d => (keep(d) ? undefined : false)); // (shown for "I don't know where to start", so that's the answer kept)
    openCapture("I don't know where to start with this", undefined, opener);
  }
  function carryOn() { act(); update(d => (keep(d) ? undefined : false)); toast('Good. Keep going as long as it helps.'); onClose(); }
  function later() {
    let msg: string | null = null;
    act();
    if (update(d => { keep(d); msg = notToday(d, t.id, k); if (!msg) return false; }) && msg) { toast(msg); onClose(); }
  }
  function letGo() {
    let msg: string | null = null;
    act();
    update(d => { keep(d); msg = unstick(d, t.id, { reason: 'notneeded', quiet: true }, k); if (!msg) return false; });
    if (msg) { toast(msg); onClose(); }
  }
  function smallerPiece() {
    let msg: string | null = null;
    act();
    update(d => { keep(d); msg = unstick(d, t.id, { reason: 'big', step: piece, quiet: true }, k); if (!msg) return false; });
    if (msg) { toast(msg); onClose(); }
  }

  return (
    <Card id="startCard" aria-labelledby="start-h">
      <h3 id="start-h" ref={heading} tabIndex={-1} className="m-0 outline-none">Let’s get started</h3>
      <p className="text-[15px] m-0 mt-1">You don’t need to finish anything right now.</p>

      <h4 className="m-0 mt-4 text-[15px]">What’s getting in the way? <span className="font-normal text-fg-2">(if you like)</span></h4>
      <div className="mt-2"><Choices label="What’s getting in the way?">
        {ANSWERS.map(a => <Choice key={a} on={answer === a} data-s="start-answer" data-id={a} onClick={() => setAnswer(answer === a ? null : a)}>{answerLabel(a)}</Choice>)}
      </Choices></div>

      <h4 className="m-0 mt-2 text-[15px]">Open it</h4>
      <ul className="list-none p-0 m-0 mt-1 grid gap-1 text-[15px]" data-s="start-open">
        {project && <li><TextLink href={`#projects/p/${project.id}`}>Open “{project.title}”</TextLink>
          {project.leftOff?.text && <span className="block text-fg-2">Last time you wrote: “{project.leftOff.text}”</span>}</li>}
        {link && <li><ExternalLink href={link}>Open the link in its notes</ExternalLink></li>}
        {t.notes.trim() && <li className="text-fg-2 whitespace-pre-wrap break-words" data-s="start-notes">{t.notes.trim().slice(0, 300)}{t.notes.trim().length > 300 ? '…' : ''}</li>}
        {next && <li data-s="start-next">Next step: {next.text}</li>}
        {!project && !link && !t.notes.trim() && !next && <li className="text-fg-2">Get out what you need for it — nothing more yet.</li>}
      </ul>

      <h4 className="m-0 mt-4 text-[15px]">One small act</h4>
      {answer === 'perfect' && <p className="text-[15px] m-0 mt-1" data-s="start-rough">A rough first try still counts as started.</p>}
      <div className="flex flex-wrap gap-2.5 mt-2">
        {next && (answer === 'start' || answer === 'big') && <Button inline variant="primary" className="max-w-full whitespace-normal break-words text-left" data-action="start-tick" onClick={tick}>Tick off: {next.text}</Button>}
        {canTime && <Button inline variant={next && (answer === 'start' || answer === 'big') ? 'tonal' : 'primary'} data-action="start-five" onClick={fiveMinutes}>Start for 5 minutes</Button>}
        {next && answer !== 'start' && answer !== 'big' && <Button inline variant="tonal" className="max-w-full whitespace-normal break-words text-left" data-action="start-tick" onClick={tick}>Tick off: {next.text}</Button>}
      </div>
      {!canTime && <p className="text-sm text-fg-2 m-0 mt-2" data-s="start-no-timer">{!room.built ? 'The five-minute timer needs today’s plan: build your day on Today first.' : room.rest ? 'Today is a rest day, so there’s no timer — maybe it can wait.' : 'Today’s plan is full, so there’s no room for the timer today.'}</p>}
      {answer === 'start' && askable && <p className="text-[15px] m-0 mt-2" data-s="start-ask">Not sure what the first step is? <LinkButton data-action="start-ask" onClick={e => think(e.currentTarget)}>Think it through with Ask MyDay</LinkButton></p>}

      <h4 className="m-0 mt-4 text-[15px]">Then decide</h4>
      <div className="flex flex-wrap gap-2.5 mt-2">
        <Button inline variant="tonal" data-action="start-carry-on" onClick={carryOn}>Carry on</Button>
        <Button inline variant="ghost" data-action="start-later" onClick={later}>Later</Button>
        <Button inline variant="ghost" aria-expanded={smaller} data-action="start-smaller" onClick={() => setSmaller(!smaller)}>Make it smaller</Button>
        <Button inline variant="ghost" data-action="start-let-go" onClick={letGo}>Let it go</Button>
      </div>
      {smaller && <form onSubmit={e => { e.preventDefault(); smallerPiece(); }}>
        <Field label="What’s a first 10-minute piece?" htmlFor="startPiece" className="mt-3">
          <TextInput id="startPiece" value={piece} maxLength={TASK_LIMITS.title} placeholder="e.g. clear just the desk" onChange={e => setPiece(e.target.value)} />
        </Field>
        <Button inline type="submit" variant="primary" className="mt-3" data-action="start-smaller-go" disabled={!piece.trim()}>Add it for today</Button>
      </form>}
      <Note className="mb-0 mt-3 text-sm">“Later” takes it off today without counting it as a move, and letting it go is a fine answer too (you can bring it back any time). If you say what’s in the way, it’s kept with the task, so MyDay can notice what usually gets in the way.</Note>
    </Card>
  );
}
