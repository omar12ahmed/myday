import { ArrowLeft, ArrowRight, CalendarHeart, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { AI_MODE } from '../ai/request';
import { openCapture } from '../capture/openCapture';
import { Button } from '../components/Button';
import { Saying } from '../components/Saying';
import { Card } from '../components/Card';
import { Field, Select, TextArea } from '../components/Field';
import { LinkButton } from '../components/parts';
import { shift, shortDate, todayKey } from '../data/dates';
import { editProject, projectsInOrder } from '../data/projects';
import { update } from '../data/storage';
import { unstick } from '../data/tasks';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';
import { finishReview, inFocus, lastReviewDay, REVIEW_LIMITS, reviewDay, setReviewDay, studiedIn, whatMoved, whatsWaiting, type Waiting } from '../data/weekReview';

// The weekly review (#review, milestone 6 — Reflect, 1.37.0): four short steps, one at a time — what moved, what's
// waiting, next week's focus, and a line or two if you like. Nothing changes until you tap; nothing is judged.
const STEPS = ['What moved', 'What needs you', "Next week's focus", 'A line or two'] as const; // "What needs you" since 1.50.0, so "waiting" only means waiting on someone
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function ReviewScreen({ data }: { data: MyDayData }) {
  const k = todayKey(), week = whatMoved(data, k), start = shift(k, 1);
  const active = projectsInOrder(data, 'active');
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState<Set<string>>(new Set()); // "leave it for now", for this review only
  const [focus, setFocus] = useState<string[]>(() => active.filter(p => inFocus(p, k) || inFocus(p, start)).map(p => p.id).slice(0, REVIEW_LIMITS.focus));
  const [went, setWent] = useState(''), [easier, setEasier] = useState('');
  const [gotEasier, setGotEasier] = useState(''), [stillHard, setStillHard] = useState(''); // only in a week with Study
  const studied = studiedIn(data, week.from, week.to);
  const [done, setDone] = useState<{ names: string[]; note: boolean } | null>(null);
  const waiting = whatsWaiting(data, k).filter(w => !left.has(w.key));
  function finish() {
    let r: { noteId: string | null } = { noteId: null };
    if (!update(d => { r = finishReview(d, { day: lastReviewDay(d, k), from: week.from, start, focus, went, easier, gotEasier, stillHard }); })) return;
    const names = active.filter(p => focus.includes(p.id)).map(p => p.title);
    setDone({ names, note: !!r.noteId });
    toast('Week looked back on — thank you for taking the time.');
  }
  const head = (
    <Card aria-labelledby="reviewH" id="reviewTop">
      <h2 id="reviewH" className="flex items-center gap-2"><CalendarHeart size={22} aria-hidden="true" className="text-primary" /> Your week</h2>
      <p className="text-[15px] text-fg-2 m-0">The last seven days, {shortDate(week.from)} to {shortDate(week.to)}. About five minutes — skip anything you like.</p>
      <Saying place="review" className="mt-3" />
      {!done && <ol className="list-none p-0 m-0 mt-3 flex flex-wrap gap-1.5" aria-label="Steps">
        {STEPS.map((s, i) => <li key={s} aria-current={i === step ? 'step' : undefined} className={`text-xs font-semibold rounded-full px-2.5 py-1 ${i === step ? 'bg-primary-container text-on-primary-container' : i < step ? 'bg-surface-2 text-fg-2' : 'border border-outline text-fg-3'}`}>{i + 1}. {s}</li>)}
      </ol>}
    </Card>
  );
  if (done) return (
    <div className="max-w-[720px] mx-auto">{head}
      <Card id="reviewDone" aria-labelledby="reviewDoneH">
        <h3 id="reviewDoneH" className="flex items-center gap-2"><Check size={18} aria-hidden="true" className="text-done" /> All done</h3>
        <p className="text-[15px] m-0" data-s="review-focus-done">{done.names.length ? <>Your focus from {shortDate(start)}: {done.names.join(', ')}. Their next steps lead “From your projects” on Today.</> : 'No focus chosen this time — that’s fine.'}</p>
        {done.note && <p className="text-[15px] text-fg-2 m-0 mt-2">Your reflection is in Notes, as “Week of {shortDate(week.from)}”.</p>}
        <a href="#today" className="inline-flex items-center min-h-11 mt-2 text-primary font-semibold no-underline hover:underline underline-offset-4">Back to Today</a>
      </Card>
    </div>
  );
  return (
    <div className="max-w-[720px] mx-auto">
      {head}
      <Card id="reviewStep" aria-labelledby="reviewStepH" data-step={step}>
        <h3 id="reviewStepH">{STEPS[step]}</h3>
        {step === 0 && <Moved data={data} />}
        {step === 1 && (waiting.length ? (
          <ul className="list-none p-0 m-0" data-s="review-waiting">{waiting.map(w => <WaitingRow key={w.key} w={w} k={k} onLeave={() => setLeft(new Set([...left, w.key]))} />)}</ul>
        ) : <p className="text-[15px] text-fg-2 m-0" data-s="review-nothing-waiting">Nothing needs you right now — lovely.</p>)}
        {step === 2 && (active.length ? <>
          <p className="text-[15px] text-fg-2 m-0">Up to three projects for the week from {shortDate(start)}. Fewer is fine — their next steps lead on Today.</p>
          <ul className="list-none p-0 m-0 mt-2" data-s="review-focus">{active.map(p => {
            const on = focus.includes(p.id), full = !on && focus.length >= REVIEW_LIMITS.focus;
            return <li key={p.id}><label className={`flex items-center gap-3 min-h-11 py-1 text-[15px] ${full ? 'text-fg-3' : 'cursor-pointer'}`}>
              <input type="checkbox" className="size-5 flex-none accent-[var(--primary)]" checked={on} disabled={full} data-s="focus-pick" data-id={p.id}
                onChange={() => setFocus(on ? focus.filter(x => x !== p.id) : [...focus, p.id])} />
              <span className="min-w-0 break-words">{p.title}</span></label></li>;
          })}</ul>
          {focus.length >= REVIEW_LIMITS.focus && <p className="text-sm text-fg-3 m-0 mt-1" data-s="focus-full">That’s three — plenty for one week.</p>}
        </> : <p className="text-[15px] text-fg-2 m-0">No active projects right now — nothing to choose.</p>)}
        {step === 3 && <div className="grid gap-3">
          <p className="text-[15px] text-fg-2 m-0">Only if you’d like to. It’s kept as a note, “Week of {shortDate(week.from)}”, in your Notes.</p>
          <Field label="What went well?" htmlFor="reviewWent"><TextArea id="reviewWent" rows={3} maxLength={REVIEW_LIMITS.answer} value={went} onChange={e => setWent(e.target.value)} /></Field>
          <Field label="What would make next week easier?" htmlFor="reviewEasier"><TextArea id="reviewEasier" rows={3} maxLength={REVIEW_LIMITS.answer} value={easier} onChange={e => setEasier(e.target.value)} /></Field>
          {studied && <fieldset className="grid gap-3 border-0 border-t border-outline pt-3 m-0 p-0 min-w-0" data-s="review-study">
            <legend className="text-[15px] text-fg-2 p-0 mb-1">You studied this week. If you like, two more for the same note:</legend>
            <Field label="What got easier?" htmlFor="reviewGotEasier"><TextArea id="reviewGotEasier" rows={2} maxLength={REVIEW_LIMITS.answer} value={gotEasier} onChange={e => setGotEasier(e.target.value)} /></Field>
            <Field label="What still feels hard?" htmlFor="reviewStillHard"><TextArea id="reviewStillHard" rows={2} maxLength={REVIEW_LIMITS.answer} value={stillHard} onChange={e => setStillHard(e.target.value)} /></Field>
          </fieldset>}
        </div>}
        <div className="flex flex-wrap justify-between gap-2.5 mt-5">
          {step > 0 ? <Button inline variant="ghost" data-action="review-back" onClick={() => setStep(step - 1)}><ArrowLeft size={18} aria-hidden="true" /> Back</Button> : <span />}
          {step < STEPS.length - 1 ? <Button inline variant="primary" data-action="review-next" onClick={() => setStep(step + 1)}>Next <ArrowRight size={18} aria-hidden="true" /></Button>
            : <Button inline variant="primary" data-action="review-finish" onClick={finish}><Check size={18} aria-hidden="true" /> Finish the review</Button>}
        </div>
      </Card>
      <p className="text-sm text-fg-3 text-center mt-2">
        <label htmlFor="reviewDay">Your review day: </label>
        <Select id="reviewDay" className="!w-auto !inline-block !min-h-11 !py-1" value={reviewDay(data)} onChange={e => { if (update(d => (setReviewDay(d, Number(e.target.value)) ? undefined : false))) toast('Review day changed.'); }}>
          {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
        </Select>
      </p>
    </div>
  );
}

function Moved({ data }: { data: MyDayData }) {
  const w = whatMoved(data), bits = (m: ReturnType<typeof whatMoved>['projects'][number]) => [
    m.tasks && `${m.tasks} task${m.tasks === 1 ? '' : 's'} done`, m.milestones && `${m.milestones} milestone${m.milestones === 1 ? '' : 's'} reached`,
    m.decisions && `${m.decisions} decision${m.decisions === 1 ? '' : 's'} made`, m.found && `${m.found} found out`, m.recorded && `${m.recorded} recorded`].filter(Boolean).join(' · ');
  const quiet = !w.projects.length && !w.otherTasks && !w.studySessions && !w.workouts;
  return <>
    {quiet ? <p className="text-[15px] text-fg-2 m-0" data-s="review-quiet">A quiet week — that’s allowed. Rest counts too.</p> : <>
      {w.projects.length > 0 && <ul className="list-none p-0 m-0" data-s="review-moved">{w.projects.map(m => (
        <li key={m.project.id} className="border-t border-outline first:border-t-0 py-2.5" data-id={m.project.id}>
          <a href={`#projects/p/${encodeURIComponent(m.project.id)}`} className="font-semibold text-fg no-underline hover:underline underline-offset-4 break-words">{m.project.title}</a>
          <p className="m-0 text-sm text-fg-2">{bits(m)}</p>
          {m.done.length > 0 && <p className="m-0 mt-0.5 text-sm text-fg-3 break-words">{m.done.join(' · ')}</p>}
        </li>))}</ul>}
      <ul className="list-none p-0 m-0 mt-2 grid gap-1 text-[15px]" data-s="review-other">
        {w.otherTasks > 0 && <li>{w.otherTasks} other task{w.otherTasks === 1 ? '' : 's'} done</li>}
        {w.studySessions > 0 && <li>Study: {w.studySessions} session{w.studySessions === 1 ? '' : 's'}, {w.studyMinutes} min</li>}
        {w.workouts > 0 && <li>{w.workouts} workout{w.workouts === 1 ? '' : 's'}</li>}
      </ul>
    </>}
    {AI_MODE !== 'off' && !quiet && <Button inline variant="tonal" className="mt-3" data-action="review-pattern" onClick={() => openCapture('What pattern do you see in my week?')}><Sparkles size={18} aria-hidden="true" /> See the pattern</Button>}
  </>;
}

// One thing that's waiting, and what you could do about it — nothing changes until you tap.
function WaitingRow({ w, k, onLeave }: { w: Waiting; k: string; onLeave: () => void }) {
  return (
    <li className="border-t border-outline first:border-t-0 py-2.5" data-s="waiting" data-kind={w.kind}>
      <p className="m-0 text-[15px] break-words">{w.text}</p>
      <div className="flex flex-wrap items-center gap-2 mt-1.5">
        <a href={w.href} className="inline-flex items-center min-h-11 px-1 text-primary font-semibold text-[15px] no-underline hover:underline underline-offset-4" data-action="waiting-open">
          {w.kind === 'quiet' ? 'Pick a next step' : w.kind === 'stuck' ? 'What’s in the way?' : 'Open it'}</a>
        {w.kind === 'quiet' && w.projectId && <Button inline variant="ghost" data-action="waiting-pause" onClick={() => { if (update(d => (editProject(d, w.projectId!, { status: 'paused' }) ? undefined : false))) { toast('Paused — it’ll keep.'); onLeave(); } }}>Pause it</Button>}
        {w.kind === 'stuck' && w.taskId && <Button inline variant="ghost" data-action="waiting-let-go" onClick={() => { let r: string | null = null; update(d => { r = unstick(d, w.taskId!, { reason: 'notneeded' }, k); if (!r) return false; }); if (r) { toast(r); onLeave(); } }}>Let it go</Button>}
        <LinkButton data-action="waiting-leave" onClick={onLeave}>Leave it for now</LinkButton>
      </div>
    </li>
  );
}
