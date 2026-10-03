import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import type { MyDayData } from '../data/types';
import type { ProposedSession } from '../data/workout/propose';
import { FoodScreen } from './food/FoodScreen';
import { GoalView } from './GoalView';
import { leftScreen } from './food/visit';
import { ExerciseHistory, ExercisesView, HistoryView } from './HistoryViews';
import { healthRoute } from './route';
import { ScheduleView } from './ScheduleView';
import { ActiveSession, LoggedSession } from './SessionView';
import { TemplateEditor } from './TemplateEditor';
import { WorkoutHome } from './WorkoutHome';

// Health: Workout, Food and Goal, as three tabs. Choices that only matter for this visit (a workout proposal not
// yet confirmed, a missed session being moved) live here; Food's are in food/visit.ts. None are saved.
export function HealthScreen({ data, hash }: { data: MyDayData; hash: string }) {
  const { tab, view, id } = healthRoute(hash);
  const [proposal, setProposal] = useState<ProposedSession[] | null>(null);
  const [moving, setMoving] = useState<string | null>(null); // the missed session's date being moved
  // Each screen starts at the top; suggestions under the search box close, and an item being edited is let go.
  useEffect(() => { window.scrollTo(0, 0); leftScreen(); }, [hash]);

  let screen;
  if (tab === 'food') screen = <FoodScreen data={data} view={view} id={id} />;
  else if (tab === 'goal') screen = <GoalView data={data} />;
  else if (view === 'session') screen = <ActiveSession data={data} />;
  else if (view === 'log') screen = <LoggedSession key={id} data={data} id={id} />;
  else if (view === 'template') screen = <TemplateEditor key={id} data={data} id={id} />;
  else if (view === 'history') screen = <HistoryView data={data} />;
  else if (view === 'exercises') screen = <ExercisesView data={data} />;
  else if (view === 'exercise') screen = <ExerciseHistory key={id} data={data} id={id} />;
  else if (view === 'schedule') screen = <ScheduleView data={data} proposal={proposal} setProposal={setProposal} />;
  else screen = <WorkoutHome data={data} moving={moving} setMoving={setMoving} />;

  const tabClass = (on: boolean) => `seg-link flex-1 inline-flex items-center justify-center gap-1.5 min-h-11 rounded-xl text-[15px] font-semibold no-underline ${on ? 'on bg-primary-container text-on-primary-container' : 'text-fg-2'}`;
  return (
    <div className="hl-view enter">
      <Card className="health-tabs !p-2.5 max-w-[720px] mx-auto">
        <div className="seg flex gap-1.5" role="tablist" aria-label="Health sections">
          <a className={tabClass(tab === 'workout')} href="#health/workout" role="tab" aria-selected={tab === 'workout'}>Workout</a>
          <a className={tabClass(tab === 'food')} href="#health/food" role="tab" aria-selected={tab === 'food'}>Food</a>
          <a className={tabClass(tab === 'goal')} href="#health/goal" role="tab" aria-selected={tab === 'goal'}>Goal</a>
        </div>
      </Card>
      {view === 'home' && tab !== 'goal' ? screen : <div className="max-w-[720px] mx-auto">{screen}</div>}
    </div>
  );
}
