import { useEffect, useState } from 'react';
import { useConfirm } from '../components/confirm';
import { shift } from '../data/dates';
import { clearDay, findTask, makeRestDay, setDone, toggleRoll } from '../data/plan';
import { acceptShrink, nudgeEligible, swapInLearning } from '../data/progress';
import { applyProposal, placeItems, proposeBuild, proposeReview, type Proposal } from '../data/proposal';
import { contextFor, ensureContext } from '../data/schedule';
import { getSnapshot, update } from '../data/storage';
import { startTimer, timerIsStale, timerTask } from '../data/timer';
import { toast } from '../data/toast';
import type { Commitment, Energy, MyDayData, Task } from '../data/types';
import { celebrate } from './celebrate';
import type { CommitForm } from '../commitments/commitForm';
import { ContextCard } from './ContextCard';
import { EditListsView } from './EditListsView';
import { EveningView, YesterdayCard } from './EveningView';
import { GlanceCard } from './GlanceCard';
import { MorningCard } from './MorningCard';
import { NudgeCard } from './NudgeCard';
import { PlanCard } from './PlanCard';
import { StreakCard } from './ProgressCards';
import { ProposalCard, type ProposalActions } from './ProposalCard';
import { TimerCard, type TimerAction } from './TimerCard';
import { AppFooter } from '../shell/AppFooter';
import { activeStudy } from '../data/study/sessions';
import { StudyTodayCard } from '../study/StudyTodayCard';
import { HealthTodayCard } from '../health/HealthTodayCard';
import { DailyTodayCard } from '../health/DailyTodayCard';
import { healthReminders } from '../health/reminders';
import { liveExercises } from '../data/health/daily';
import { AdjustCard } from '../ai/AdjustCard';
import { hasAdjustNote, onHandover } from '../ai/handover';
import { MindCard } from '../ai/MindCard';
import { DueTodayCard } from './DueTodayCard';
import { ProjectStepsCard, TasksLink } from './ProjectCards';
import { ReviewCard } from './ReviewCard';
import { NoticedLink } from '../patterns/NoticedScreen';
import { undoMind, type MindUndo } from '../ai/mind';
import { canUndo, undoAi, type Undo } from '../ai/apply';
import { AI_MODE } from '../ai/request';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { GreetingCard } from './GreetingCard';
import { FocusCard } from './FocusCard';
import { QuickAdd } from './QuickAdd';
import { TodayRing, WeekCard } from './DashboardCards';
import { FocusView } from './FocusView';
import { setFocusMode, useFocusMode } from '../shell/focusMode';
import { useSayings } from '../shell/sayingsMode';
import { todayPlace } from '../data/sayings';
import { Saying } from '../components/Saying';
import { markOffer, sayNotNow, startOfferTask, todaysOffer } from '../data/offers';
import { noticed } from '../data/patterns/notice';
import { setStartOffers } from '../data/patterns/saved';
import { StartOfferCard } from './StartOfferCard';
import { studyDoneAs, studyNow, studyPick } from '../study/todayStudy';
import { loadNextLearning, nextLearningNow } from '../study/useNextLearning';
import type { StudyPick } from '../data/plan';

// Study's next step for the learning task, once the Study catalogues are in (specs/today-learning-and-tidy.md §2).
function studyOf(now: MyDayData): StudyPick | null {
  const m = nextLearningNow();
  try { return m ? studyPick(m, now) : null; } catch (e) { console.error('MyDay: the next step could not be worked out', e); return null; }
}
// Building waits for them (they're usually in already: Today's Study card loads them), so the plan never falls back to
// your own list just because they hadn't loaded yet.
const withStudy = (go: () => void) => { if (nextLearningNow()) go(); else loadNextLearning().then(go, go); };

// The Today section. Saved data comes in as `data`; everything else here (an open proposal, the
// evening check-in, the commitment form…) is kept only while the screen is open, as in the current
// MyDay. The App starts this screen afresh when the date changes. When another tab replaces the data
// (`generation` goes up), unsaved drafts are dropped, since they were based on the older data.

const scrollTo = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView?.({ block: 'start' }));

export function TodayScreen({ data, generation, k, canSave, motionAllowed, onExport, onImport }: {
  data: MyDayData; generation: number; k: string; canSave: boolean; motionAllowed: boolean; onExport: () => void; onImport: () => void;
}) {
  const confirm = useConfirm();
  // "Edit task lists" from another section opens Today at #today/edit.
  const [view, setView] = useState<'auto' | 'evening' | 'edit'>(() => (location.hash === '#today/edit' ? 'edit' : 'auto'));
  useEffect(() => { if (location.hash === '#today/edit') history.replaceState(null, '', '#today'); }, []);
  const [eveningKey, setEveningKey] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [aiOpen, setAiOpen] = useState(false);          // "Help me adjust today" is open
  const [adjustKey, setAdjustKey] = useState(0);        // a new one when Ask MyDay hands "plan my day" over (it starts with what you typed)
  const [aiUndo, setAiUndo] = useState<Undo | null>(null); // the last AI suggestion used (one step of Undo)
  const [mindOpen, setMindOpen] = useState(false);            // "Add what's on my mind" is open
  const [mindUndo, setMindUndo] = useState<MindUndo | null>(null); // the tasks it last added (one step of Undo)
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
  // Ask MyDay handed "plan my day" over: open Help me adjust today with what was typed (when today has a plan).
  const canTakeOver = AI_MODE !== 'off' && !!d && !d.rest;
  useEffect(() => {
    const open = () => { if (hasAdjustNote() && canTakeOver) { setProposal(null); setAdjustKey(x => x + 1); setAiOpen(true); scrollTo('aiCard'); } };
    open();
    return onHandover(open);
  }, [canTakeOver]);

  // Data replaced from outside (another tab, an import): drop drafts made from the older data.
  const [seenGeneration, setSeenGeneration] = useState(generation);
  if (generation !== seenGeneration) { setSeenGeneration(generation); setProposal(null); setForm(null); }

  // Moving between screens (morning → plan, plan → evening…) fades the cards in, when animations are on.
  const mode = view !== 'auto' ? view : d ? 'plan' : 'morning';
  const [shownMode, setShownMode] = useState(mode);
  const [entering, setEntering] = useState(false);
  if (mode !== shownMode) { setShownMode(mode); setEntering(motionAllowed); }


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
      if (p.mode === 'build') return day ? null : proposeBuild(now, k, contextFor(now, k).energy || p.energy, studyOf(now));
      return day && !day.rest ? proposeReview(now, k, studyOf(now)) : null;
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
        ? (day && !day.rest ? proposeReview(now, k, studyOf(now)) : null)
        : (day ? null : proposeBuild(now, k, contextFor(now, k).energy || 3, studyOf(now)))));
    },
  };

  function build(energy: Energy) {
    if (getSnapshot().data.days[k]) return;
    update(dr => { ensureContext(dr, k).energy = energy; });
    withStudy(() => {
      const now = getSnapshot().data;
      if (now.days[k]) return;
      setProposal(proposeBuild(now, k, energy, studyOf(now)));
      setAnimateProposal(motionAllowed);
      scrollTo('proposalCard');
    });
  }
  function review() {
    withStudy(() => {
      const now = getSnapshot().data;
      if (!now.days[k] || now.days[k].rest) return;
      setProposal(proposeReview(now, k, studyOf(now)));
      setAnimateProposal(motionAllowed);
      scrollTo('proposalCard');
    });
  }

  // ---------- Ticking off ----------
  function toggle(dayKey: string, t: Task, done: boolean) {
    let celebrateNow = false;
    // A Study entry ticked by hand keeps the lesson it was ("Arabic Fuṣḥā: The Fuṣḥā register"), for your history.
    const m = nextLearningNow(), now = done && t.study && m ? studyNow(m.learningOptions(getSnapshot().data), t) : null;
    const ok = update(dr => {
      const task = findTask(dr, dayKey, t.uid);
      if (!task) return false;
      setDone(dr, task, done);
      if (!done) return;
      if (now && task.study) { const as = studyDoneAs(now); task.title = as.title; if (as.lessonId) task.study = { ...task.study, lessonId: as.lessonId }; }
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
  function timer(t: Task, kind: 'start' | 'focus', minutes?: number) {
    const switching = !!data.timer && data.timer.uid !== t.uid;
    if (!update(dr => { const task = findTask(dr, k, t.uid); if (!task || task.done) return false; startTimer(dr, t.uid, kind, kind === 'start' ? 2 : minutes ?? task.minutes); })) return;
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
      if (a === 'keep') { if (!task) return false; Object.assign(t, { kind: 'focus', durationSec: Math.max(5, task.minutes - Math.round(t.durationSec / 60)) * 60, accumulatedMs: 0, startedAt: Date.now(), finished: false }); }
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
    const now = getSnapshot().data, day = now.days[k];
    if (!day) return;
    // A tick on a task from Your tasks is kept there (see clearDay), so say so rather than "its ticks will be cleared".
    const ticked = day.tasks.filter(t => t.done), kept = ticked.filter(t => now.tasks.items.some(x => x.plannedOn === k && x.planUid === t.uid)).length;
    const yes = await confirm({
      title: 'Start today over?',
      body: !ticked.length ? "Today's plan will be cleared so you can choose your energy again."
        : !kept ? "Today's plan and its ticks will be cleared so you can choose your energy again."
        : `${kept < ticked.length ? "Today's plan and its other ticks will be cleared" : "Today's plan will be cleared"} so you can choose your energy again. Anything from Your tasks that you ticked off stays done there.`,
      confirmLabel: 'Start today over',
      cancelLabel: 'Keep my plan',
    });
    if (!yes) return;
    update(dr => clearDay(dr, k));
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
    const study = studyOf(getSnapshot().data);
    update(dr => { result = swapInLearning(dr, k, replaceUid, study); if (!result.changed) return false; });
    if (result.changed) hideNudge();
    if (result.message) toast(result.message);
  }

  // ---------- Layout ----------
  const showNudge = nudge.visible && nudgeEligible(data, k);
  // One unprompted offer today, at most (data/offers.ts; the owner's choices of 1 Nov 2026): a task that keeps moving, the
  // learning nudge, or what MyDay noticed — and none the rest of a day you said "Not now", or the day after.
  const startTask = canSave ? startOfferTask(data, k) : null;
  const offer = todaysOffer(data.nudge, k, { start: !!startTask, nudge: showNudge, noticed: noticed(data, k).fresh.length > 0 });
  // Noted once it's actually shown (not in Focus mode, or while editing lists): today's offer, so nothing else comes today,
  // and the nudge's own once a day. MyDay's own notes on this device, so this never writes your synced data.
  const focusMode = useFocusMode();
  const shown = view === 'edit' || (focusMode && view === 'auto') ? null : offer;
  useEffect(() => {
    if (!shown || !canSave) return;
    update(dr => { let changed = markOffer(dr.nudge, k, shown); if (shown === 'nudge' && dr.nudge.lastShownOn !== k) { dr.nudge.lastShownOn = k; changed = true; } return changed ? undefined : false; });
  }, [shown, k, canSave]);
  // The card goes, so focus goes to the page rather than nowhere.
  const toPage = () => requestAnimationFrame(() => document.getElementById('app')?.focus({ preventScroll: true }));
  const notNow = (taskId?: string) => update(dr => (sayNotNow(dr.nudge, k, taskId) ? undefined : false));
  function notNowStart() { if (notNow(startTask?.id)) { toast('Not now, then. No suggestions today or tomorrow.'); toPage(); } }
  function noMoreStartOffers() {
    if (update(dr => (setStartOffers(dr.patterns, false) ? undefined : false))) { toast('No more offers to help you start. Switch them back on in What MyDay has noticed.'); toPage(); }
  }
  const proposalCard = proposal && <ProposalCard p={proposal} data={data} animate={animateProposal} act={act} />;
  const context = (
    <ContextCard data={data} k={k} open={contextOpen} onOpenChange={setContextOpen} form={form} setForm={setForm}
      onChanged={contextChanged} onReview={review} onDeleteCommitment={deleteCommitment} />
  );
  const yd = data.days[shift(k, -1)];
  const yesterdayOpen = !!yd && !yd.rest && !yd.checkedIn && yd.tasks.some(t => !t.done && !t.rolledQid);
  // Health: only what's waiting (a workout, cooking, the shopping list). Nothing goes on the task list.
  const healthCard = healthReminders(data, k).length > 0 && <HealthTodayCard data={data} k={k} />;
  // Daily exercises: a countdown on Today, one tap per set (managed in Health → Workout).
  const dailyCard = liveExercises(data.health.daily).length > 0 && <DailyTodayCard data={data} k={k} />;
  // Study: the next lesson, a session to resume or revision ready. Nothing goes on the task list.
  // An active or paused session belongs next to the plan; otherwise the card stays with the other reminders.
  const currentStudy = activeStudy(data.study);
  const studyCard = <StudyTodayCard data={data} k={k} />; // always available: the next lesson appears even without an active session or due revision

  // Phones: one column, with the plan and any resumable Study before the supporting timeline.
  // Wide screens: the timeline and learning count move to a second column on the right.
  // `order` only matters on phones; entrance classes remain for compatibility, without workspace animation.
  // One quiet saying under the plan, or under Build my day before there is one (so Build my day stays in view on
  // phones), after a running or paused Study session, which stays right beside your day: gentler on a rest day or a
  // low-energy day (today's energy, including a change made after building).
  const sayingsOn = useSayings();
  const saying = (rest: boolean, energy: number | null | undefined) => sayingsOn && <Saying place={todayPlace(rest, energy)} day={k} />;
  const slot = (order: string, node: React.ReactNode, id?: string) =>
    node ? <div id={id} className={`min-w-0 ${order} lg:order-none${entering ? ' enter' : ''}`}>{node}</div> : null;

  // "Add what's on my mind": the card, then (after adding) one step of Undo.
  function openMind() { setMindOpen(true); scrollTo('mindCard'); }
  const mindSlots = (
    <>
      {slot('order-1', mindOpen && <MindCard onClose={() => setMindOpen(false)} onAdded={(u, message) => { setMindOpen(false); setMindUndo(u); toast(message); }} />)}
      {slot('order-1', mindUndo && (
        <Card id="mindUndo" className="!py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="m-0 text-[15px]">Tasks added from what's on your mind.</p>
            <Button inline variant="ghost" data-action="mind-undo" onClick={() => {
              const r = undoMind(mindUndo!);
              setMindUndo(null);
              toast(r.result === 'undone' ? 'Taken back.' : r.result === 'partly' ? `Taken back, except ${r.kept} you've changed or that's already on a day's plan.` : "Couldn't save just now.");
            }}>Undo</Button>
          </div>
        </Card>
      ))}
    </>
  );

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
        {slot('order-1', currentStudy && studyCard, 'slot-study')}
        {slot('order-1', <PlanCard data={data} k={k} justDoneUid={justDoneUid} onToggle={(t, done) => toggle(k, t, done)} onTimer={timer}
          onEvening={() => { setView('evening'); setEveningKey(k); }} onReview={review} onSwapRest={swapRest} onRestart={restart}
          onAdjust={AI_MODE !== 'off' && !d.rest ? () => { setProposal(null); setAiOpen(true); scrollTo('aiCard'); } : undefined}
          onMind={AI_MODE !== 'off' ? openMind : undefined} />)}
        {slot('order-1', saying(d.rest, contextFor(data, k).energy || d.energy), 'slot-saying')}
        {slot('order-1', aiOpen && <AdjustCard key={adjustKey} data={data} k={k} onClose={() => setAiOpen(false)} onApplied={u => { setAiOpen(false); setAiUndo(u); }} />)}
        {slot('order-1', canUndo(data, aiUndo) && (
          <Card id="aiUndo" className="!py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-[15px]">Plan adjusted with AI help.</p>
              <Button inline variant="ghost" data-action="ai-undo" onClick={() => {
                const r = undoAi(aiUndo!);
                setAiUndo(null);
                toast(r === 'undone' ? 'Put back as it was.' : r === 'changed' ? "Your plan has changed since, so it can't be undone." : "Couldn't save just now.");
              }}>Undo</Button>
            </div>
          </Card>
        ))}
        {mindSlots}
        {slot('order-1', <QuickAdd k={k} />, 'slot-quick')}
        {slot('order-1', <ReviewCard data={data} k={k} />, 'slot-review')}
        {slot('order-1', <DueTodayCard data={data} k={k} />, 'slot-due')}
        {slot('order-1', <ProjectStepsCard data={data} k={k} />, 'slot-steps')}
        {slot('order-1', <TasksLink data={data} />, 'slot-tasks')}
        {slot('order-1', healthCard, 'slot-health')}
        {slot('order-1', dailyCard, 'slot-daily')}
        {slot('order-1', !currentStudy && studyCard, 'slot-study')}
        {slot('order-3', context, 'slot-context')}
        {slot('order-4', proposalCard)}
        {slot('order-4', offer === 'noticed' && <NoticedLink data={data} k={k} />, 'slot-noticed')}
      </>
    );
  } else {
    const energy = (contextFor(data, k).energy || 3) as Energy;
    main = (
      <>
        {slot('order-1', <MorningCard key={energy} energy={energy} queue={data.queue}
          onEnergy={v => { update(dr => { ensureContext(dr, k).energy = v; }); contextChanged(); }} onBuild={build} onSkip={skip}
          onMind={AI_MODE !== 'off' ? openMind : undefined} />)}
        {slot('order-1', currentStudy && studyCard, 'slot-study')}
        {slot('order-1', saying(false, energy), 'slot-saying')}
        {mindSlots}
        {slot('order-1', proposalCard)}
        {slot('order-1', <QuickAdd k={k} />, 'slot-quick')}
        {slot('order-1', <ReviewCard data={data} k={k} />, 'slot-review')}
        {slot('order-1', <DueTodayCard data={data} k={k} />, 'slot-due')}
        {slot('order-1', <ProjectStepsCard data={data} k={k} />, 'slot-steps')}
        {slot('order-1', <TasksLink data={data} />, 'slot-tasks')}
        {slot('order-2', context, 'slot-context')}
        {slot('order-3', healthCard, 'slot-health')}
        {slot('order-3', dailyCard, 'slot-daily')}
        {slot('order-3', !currentStudy && studyCard, 'slot-study')}
        {slot('order-4', yesterdayOpen && <YesterdayCard onOpen={() => { setView('evening'); setEveningKey(shift(k, -1)); }} />)}
        {slot('order-4', offer === 'noticed' && <NoticedLink data={data} k={k} />, 'slot-noticed')}
      </>
    );
  }

  // Focus mode (the switch in the top bar): only what's next — the task to do now and the focus timer.
  if (focusMode && view === 'auto') {
    return (
      <FocusView data={data} k={k} onToggle={(t, done) => toggle(k, t, done)} onTimer={(t, kind) => timer(t, kind)} onShowAll={() => setFocusMode(false)}
        timerCard={data.timer && !timerIsStale(data) ? <TimerCard data={data} onAction={timerAction} /> : null}
        morning={!d ? <MorningCard key={(contextFor(data, k).energy || 3) as Energy} energy={(contextFor(data, k).energy || 3) as Energy} queue={data.queue}
          onEnergy={v => { update(dr => { ensureContext(dr, k).energy = v; }); contextChanged(); }} onBuild={build} onSkip={skip} /> : null}
        proposal={proposalCard || null} />
    );
  }

  // Wide screens: a dashboard — the greeting above your day on the left; the focus timer, today and this week, the
  // timeline and your progress in the side column on the right, starting level with the greeting. Phones: one column, in a sensible order.
  return (
    <div className="today-layout flex flex-col lg:grid lg:items-start">
      {view !== 'auto' && <h1 className="sr-only">Today</h1>}
      {view === 'auto' && (
        <div className="today-hero contents lg:block lg:min-w-0">
          {slot('order-0', <GreetingCard data={data} k={k} onGo={() => scrollTo(d ? 'slot-plan' : 'slot-energy')} />, 'slot-greeting')}
        </div>
      )}
      <div className="today-main contents lg:block lg:min-w-0">
        {slot('order-0', offer === 'start' && startTask && view !== 'edit' && <StartOfferCard t={startTask} onNotNow={notNowStart} onNever={noMoreStartOffers} />)}
        {slot('order-0', showNudge && offer === 'nudge' && view !== 'edit' && (
          <NudgeCard day={d} choosing={nudge.choosing} onShrink={shrink} onSwap={uid => swapLearning(uid)} onAdd={() => swapLearning(null)} onDismiss={() => { if (!nudge.choosing) notNow(); hideNudge(); }} />
        ))}
        {main}
      </div>
      {view !== 'edit' && (
        <aside className="today-aside contents lg:block lg:min-w-0" aria-label="More for today">
          {view === 'auto' && slot('order-1', !(data.timer && !timerIsStale(data)) && <FocusCard data={data} k={k} onStart={(t, m) => timer(t, 'focus', m)} />, 'slot-focus')}
          {view === 'auto' && slot('order-2', <div className="day-record"><TodayRing data={data} k={k} /><WeekCard data={data} k={k} /></div>, 'slot-week')}
          {view === 'auto' && slot('order-2', <GlanceCard data={data} k={k} proposal={d ? null : proposal} />)}
          {slot('order-8', <StreakCard data={data} justLearned={justLearned} />)}
        </aside>
      )}
      {view !== 'edit' && (
        <div className="today-footer min-w-0 order-9 lg:order-none">
          <AppFooter data={data} canSave={canSave} onEdit={() => { setView('edit'); window.scrollTo(0, 0); }} onExport={onExport} onImport={onImport} />
        </div>
      )}
    </div>
  );
}
