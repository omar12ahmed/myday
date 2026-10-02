import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Banner } from '../components/Banner';
import { useConfirm } from '../components/confirm';
import { shift } from '../data/dates';
import { findTask, makeRestDay, releaseTask, setDone, toggleRoll } from '../data/plan';
import { acceptShrink, nudgeEligible, swapInLearning } from '../data/progress';
import { applyProposal, placeItems, proposeBuild, proposeReview, type Proposal } from '../data/proposal';
import { contextFor, ensureContext } from '../data/schedule';
import { getSnapshot, update } from '../data/storage';
import { startTimer, timerIsStale, timerTask } from '../data/timer';
import { toast } from '../data/toast';
import type { Commitment, Energy, MyDayData, Task } from '../data/types';
import { celebrate } from './celebrate';
import type { CommitForm } from './commitForm';
import { ContextCard } from './ContextCard';
import { EditListsView } from './EditListsView';
import { EveningView, YesterdayCard } from './EveningView';
import { GlanceCard } from './GlanceCard';
import { MorningCard } from './MorningCard';
import { NudgeCard } from './NudgeCard';
import { PlanCard } from './PlanCard';
import { GardenCard, StreakCard } from './ProgressCards';
import { ProposalCard, type ProposalActions } from './ProposalCard';
import { TimerCard, type TimerAction } from './TimerCard';
import { TodayFooter } from './TodayFooter';

// The Today section. Saved data comes in as `data`; everything else here (an open proposal, the
// evening check-in, the commitment form…) is kept only while the screen is open, as in the current
// MyDay. The App starts this screen afresh when the date changes. When another tab replaces the data
// (`generation` goes up), unsaved drafts are dropped, since they were based on the older data.

const scrollTo = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView?.({ block: 'start' }));

export function TodayScreen({ data, generation, k, canSave, motionAllowed, onExport, onImport }: {
  data: MyDayData; generation: number; k: string; canSave: boolean; motionAllowed: boolean; onExport: () => void; onImport: () => void;
}) {
  const confirm = useConfirm();
  const [view, setView] = useState<'auto' | 'evening' | 'edit'>('auto');
  const [eveningKey, setEveningKey] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [animateProposal, setAnimateProposal] = useState(false);
  // The gentle nudge: at most once a day, when it applies. Decided when the screen opens.
  const [nudge, setNudge] = useState(() => {
    const now = getSnapshot().data;
    return { visible: canSave && now.nudge.lastShownOn !== k && nudgeEligible(now, k), choosing: false };
  });
  const [form, setForm] = useState<CommitForm | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [justDoneUid, setJustDoneUid] = useState<string | null>(null);
  const [justLearned, setJustLearned] = useState(false);
  const d = data.days[k];

  // Data replaced from outside (another tab, an import): drop drafts made from the older data.
  const [seenGeneration, setSeenGeneration] = useState(generation);
  if (generation !== seenGeneration) { setSeenGeneration(generation); setProposal(null); setForm(null); }

  // Moving between screens (morning → plan, plan → evening…) fades the cards in, when animations are on.
  const mode = view !== 'auto' ? view : d ? 'plan' : 'morning';
  const [shownMode, setShownMode] = useState(mode);
  const [entering, setEntering] = useState(false);
  if (mode !== shownMode) { setShownMode(mode); setEntering(motionAllowed); }

  // Remember that the nudge was shown today, so it isn't shown again.
  useEffect(() => {
    if (nudge.visible) update(dr => { if (dr.nudge.lastShownOn === k) return false; dr.nudge.lastShownOn = k; });
  }, [nudge.visible, k]);

  // A timer left over from another day, or for a task that's gone or done, is cleared.
  useEffect(() => {
    if (timerIsStale(data)) update(dr => { dr.timer = null; });
  }, [data]);

  // One-off animation flags last one moment.
  useEffect(() => {
    if (!justDoneUid && !justLearned && !animateProposal && !entering) return;
    const id = setTimeout(() => { setJustDoneUid(null); setJustLearned(false); setAnimateProposal(false); setEntering(false); }, 1200);
    return () => clearTimeout(id);
  }, [justDoneUid, justLearned, animateProposal, entering]);

  // ---------- Proposals ----------
  // The day's context changed: refresh an open proposal, unless it was edited by hand (then say so).
  function contextChanged() {
    setProposal(p => {
      if (!p) return p;
      if (p.touched) return { ...p, stale: true };
      const now = getSnapshot().data, day = now.days[k];
      if (p.mode === 'build') return day ? null : proposeBuild(now, k, contextFor(now, k).energy || p.energy);
      return day && !day.rest ? proposeReview(now, k) : null;
    });
  }

  const act: ProposalActions = {
    change(fn, opts = {}) {
      setAnimateProposal(false); // the slide-in plays once, not on every edit
      setProposal(p => {
        if (!p) return p;
        const next = structuredClone(p);
        fn(next);
        if (opts.place) placeItems(getSnapshot().data, next);
        if (opts.touched !== false) next.touched = true;
        return next;
      });
    },
    apply() {
      if (!proposal) return;
      let message = '';
      update(dr => { const r = applyProposal(dr, proposal); message = r.message; if (!r.changed) return false; });
      setProposal(null);
      if (message) toast(message);
    },
    cancel: () => setProposal(null),
    refresh() {
      const now = getSnapshot().data, day = now.days[k];
      setProposal(p => (p && p.mode === 'review'
        ? (day && !day.rest ? proposeReview(now, k) : null)
        : (day ? null : proposeBuild(now, k, contextFor(now, k).energy || 3))));
    },
  };

  function build(energy: Energy) {
    if (getSnapshot().data.days[k]) return;
    update(dr => { ensureContext(dr, k).energy = energy; });
    setProposal(proposeBuild(getSnapshot().data, k, energy));
    setAnimateProposal(motionAllowed);
    scrollTo('proposalCard');
  }
  function review() {
    const now = getSnapshot().data;
    if (!now.days[k] || now.days[k].rest) return;
    setProposal(proposeReview(now, k));
    setAnimateProposal(motionAllowed);
    scrollTo('proposalCard');
  }

  // ---------- Ticking off ----------
  function toggle(dayKey: string, t: Task, done: boolean) {
    let celebrateNow = false;
    const ok = update(dr => {
      const task = findTask(dr, dayKey, t.uid);
      if (!task) return false;
      setDone(dr, task, done);
      if (!done) return;
      if (dr.timer && dr.timer.uid === task.uid) dr.timer = null;
      const day = dr.days[dayKey];
      if (dayKey === k && day && !day.rest && day.tasks.length && day.tasks.every(x => x.done) && dr.celebratedOn !== dayKey) {
        dr.celebratedOn = dayKey; // once a day, however often things are re-ticked
        celebrateNow = true;
      }
    });
    if (!ok || !done) return;
    setJustDoneUid(t.uid);
    if (t.category === 'learning') setJustLearned(true);
    toast(celebrateNow ? "That's the whole plan — lovely." : 'Nice. That counts.');
    if (celebrateNow) requestAnimationFrame(() => celebrate(motionAllowed));
  }

  // ---------- Focus timer ----------
  function timer(t: Task, kind: 'start' | 'focus') {
    const switching = !!data.timer && data.timer.uid !== t.uid;
    if (!update(dr => { const task = findTask(dr, k, t.uid); if (!task || task.done) return false; startTimer(dr, t.uid, kind, kind === 'start' ? 2 : task.minutes); })) return;
    if (switching) toast('Switched the timer to this task.');
    scrollTo('timerCard');
  }
  function timerAction(a: TimerAction) {
    const task = timerTask(data);
    if (a === 'done') {
      if (task && !task.done && data.timer) { toggle(data.timer.dayKey, task, true); return; }
      update(dr => { dr.timer = null; });
      return;
    }
    if (a === 'stop') { update(dr => { dr.timer = null; }); toast("Timer stopped — that's completely fine."); return; }
    update(dr => {
      const t = dr.timer;
      if (!t) return false;
      if (a === 'pause') { if (!t.startedAt || t.finished) return false; t.accumulatedMs += Date.now() - t.startedAt; t.startedAt = null; }
      if (a === 'resume') { if (t.startedAt || t.finished) return false; t.startedAt = Date.now(); }
      if (a === 'plus5') { t.accumulatedMs = Math.min(t.accumulatedMs, t.durationSec * 1000); t.durationSec += 300; t.finished = false; t.startedAt = Date.now(); }
      if (a === 'keep') { if (!task) return false; Object.assign(t, { kind: 'focus', durationSec: Math.max(5, task.minutes - 2) * 60, accumulatedMs: 0, startedAt: Date.now(), finished: false }); }
    });
  }

  // ---------- Changing the day ----------
  function skip() {
    if (getSnapshot().data.days[k]) return;
    setProposal(null);
    if (update(dr => makeRestDay(dr, k, null))) toast('Rest day it is. Your learning count is untouched.');
  }
  function swapRest() {
    const day = getSnapshot().data.days[k];
    if (!day || day.tasks.some(t => t.done)) return;
    setProposal(null);
    if (update(dr => makeRestDay(dr, k, day.energy))) toast('Rest day it is. Anything carried over is back in your queue.');
  }
  async function restart() {
    const day = getSnapshot().data.days[k];
    if (!day) return;
    const yes = await confirm({
      title: 'Start today over?',
      body: day.tasks.some(t => t.done)
        ? "Today's plan and its ticks will be cleared so you can choose your energy again."
        : "Today's plan will be cleared so you can choose your energy again.",
      confirmLabel: 'Start today over',
      cancelLabel: 'Keep my plan',
    });
    if (!yes) return;
    update(dr => { const dd = dr.days[k]; if (!dd) return false; dd.tasks.forEach(t => releaseTask(dr, t)); delete dr.days[k]; });
    setProposal(null);
  }
  async function deleteCommitment(c: Commitment) {
    if (!(await confirm({ title: `Remove “${c.title}”?`, confirmLabel: 'Remove' }))) return;
    update(dr => { dr.commitments = dr.commitments.filter(x => x.id !== c.id); });
    contextChanged();
  }

  // ---------- Nudge ----------
  const hideNudge = () => setNudge({ visible: false, choosing: false });
  function shrink() {
    let result: ReturnType<typeof acceptShrink> = 'choose';
    update(dr => { result = acceptShrink(dr, k); if (result === 'choose') return false; });
    if (result === 'choose') { setNudge({ visible: true, choosing: true }); return; }
    hideNudge();
    if (result === 'later') { contextChanged(); toast("Got it — when you build today's plan, learning will be just 15 minutes."); }
    else toast("Done — today's learning is just 15 minutes.");
  }
  function swapLearning(replaceUid: string | null) {
    let result: ReturnType<typeof swapInLearning> = { changed: false, message: null };
    update(dr => { result = swapInLearning(dr, k, replaceUid); if (!result.changed) return false; });
    if (result.changed) hideNudge();
    if (result.message) toast(result.message);
  }

  // ---------- Layout ----------
  const showNudge = nudge.visible && nudgeEligible(data, k);
  const proposalCard = proposal && <ProposalCard p={proposal} data={data} animate={animateProposal} act={act} />;
  const context = (
    <ContextCard data={data} k={k} open={contextOpen} onOpenChange={setContextOpen} form={form} setForm={setForm}
      onChanged={contextChanged} onReview={review} onDeleteCommitment={deleteCommitment} />
  );
  const yd = data.days[shift(k, -1)];
  const yesterdayOpen = !!yd && !yd.rest && !yd.checkedIn && yd.tasks.some(t => !t.done && !t.rolledQid);
  const notMoved = (data.health !== undefined || data.study !== undefined) && (
    <Banner icon={<Info size={18} />}>
      Not in the new app yet: the workout, cooking and study reminders the current MyDay shows on Today.
      Your Health and Study records are kept exactly as they are.
    </Banner>
  );

  // Phones: one column, in this order (as in the current MyDay) — so the timeline comes straight after
  // the plan. Wide screens: the timeline, count and garden move to a second column on the right.
  // `order` only matters on phones; `enter` fades the cards in after moving between screens.
  const slot = (order: string, node: React.ReactNode, id?: string) =>
    node ? <div id={id} className={`min-w-0 ${order} lg:order-none${entering ? ' enter' : ''}`}>{node}</div> : null;

  let main;
  if (view === 'edit') main = slot('order-1', <EditListsView data={data} onBack={() => setView('auto')} />);
  else if (view === 'evening' && eveningKey && data.days[eveningKey]) {
    main = slot('order-1',
      <EveningView data={data} k={eveningKey}
        onToggle={(t, done) => toggle(eveningKey, t, done)}
        onRoll={t => update(dr => { const task = findTask(dr, eveningKey, t.uid); if (!task) return false; toggleRoll(dr, eveningKey, task); })}
        onFinish={() => { update(dr => { const dd = dr.days[eveningKey]; if (!dd) return false; dd.checkedIn = true; }); setView('auto'); setEveningKey(null); toast('All saved. See you tomorrow.'); }} />,
    );
  } else if (d) {
    main = (
      <>
        {slot('order-1', data.timer && !timerIsStale(data) && <TimerCard data={data} onAction={timerAction} />)}
        {slot('order-1', <PlanCard data={data} k={k} justDoneUid={justDoneUid} onToggle={(t, done) => toggle(k, t, done)} onTimer={timer}
          onEvening={() => { setView('evening'); setEveningKey(k); }} onReview={review} onSwapRest={swapRest} onRestart={restart} />)}
        {slot('order-1', notMoved)}
        {slot('order-3', context, 'slot-context')}
        {slot('order-4', proposalCard)}
      </>
    );
  } else {
    const energy = (contextFor(data, k).energy || 3) as Energy;
    main = (
      <>
        {slot('order-1', <MorningCard key={energy} energy={energy} queue={data.queue}
          onEnergy={v => { update(dr => { ensureContext(dr, k).energy = v; }); contextChanged(); }} onBuild={build} onSkip={skip} />)}
        {slot('order-1', proposalCard)}
        {slot('order-2', context, 'slot-context')}
        {slot('order-3', notMoved)}
        {slot('order-4', yesterdayOpen && <YesterdayCard onOpen={() => { setView('evening'); setEveningKey(shift(k, -1)); }} />)}
      </>
    );
  }

  return (
    <div className="today-layout flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:gap-x-6 lg:items-start">
      <div className="contents lg:block lg:min-w-0 lg:[grid-area:main]">
        {slot('order-0', showNudge && view !== 'edit' && (
          <NudgeCard day={d} choosing={nudge.choosing} onShrink={shrink} onSwap={uid => swapLearning(uid)} onAdd={() => swapLearning(null)} onDismiss={hideNudge} />
        ))}
        {main}
      </div>
      {view !== 'edit' && (
        <aside className="contents lg:block lg:min-w-0 lg:[grid-area:side] lg:sticky lg:top-24" aria-label="More for today">
          {view === 'auto' && slot('order-2', <GlanceCard data={data} k={k} proposal={d ? null : proposal} />)}
          {slot('order-8', <StreakCard data={data} justLearned={justLearned} />)}
          {slot('order-8', <GardenCard data={data} justLearned={justLearned} />)}
        </aside>
      )}
      {view !== 'edit' && (
        <div className="min-w-0 order-9 lg:order-none lg:[grid-area:foot]">
          <TodayFooter data={data} canSave={canSave} onEdit={() => { setView('edit'); window.scrollTo(0, 0); }} onExport={onExport} onImport={onImport} />
        </div>
      )}
    </div>
  );
}
