import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Note } from '../components/parts';
import type { MyDayData } from '../data/types';
import type { ProposedSession } from '../data/workout/propose';
import { CURRENT_MYDAY_URL } from '../links';
import { ExerciseHistory, ExercisesView, HistoryView } from './HistoryViews';
import { healthRoute } from './route';
import { ScheduleView } from './ScheduleView';
import { ActiveSession, LoggedSession } from './SessionView';
import { TemplateEditor } from './TemplateEditor';
import { WorkoutHome } from './WorkoutHome';

// Food hasn't moved yet. It says so plainly (its records are kept exactly as they are) and links to it.
function FoodNotMoved() {
  return (
    <Card aria-labelledby="food-h">
      <h2 id="food-h">Food hasn't moved to the new MyDay yet</h2>
      <Note>Your recipes, favourites, cooking history and shopping list are saved and kept exactly as they are — the new app never changes them. For now, use Food in the current MyDay.</Note>
      {CURRENT_MYDAY_URL
        ? <a className="inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-btn bg-tonal text-on-tonal font-[550] text-[15px]" href={`${CURRENT_MYDAY_URL}#health/food`}>
            <ExternalLink size={18} aria-hidden="true" /> Open Food in the current MyDay
          </a>
        : <Note className="m-0">(The development server doesn't include the current MyDay. Open it with Live Server instead.)</Note>}
    </Card>
  );
}

// Health: Workout (in the new app) and Food (not yet), as two tabs. Choices that only matter for this
// visit (a proposal not yet confirmed, a missed session being moved) live here and aren't saved.
export function HealthScreen({ data, hash }: { data: MyDayData; hash: string }) {
  const { tab, view, id } = healthRoute(hash);
  const [proposal, setProposal] = useState<ProposedSession[] | null>(null);
  const [moving, setMoving] = useState<string | null>(null); // the missed session's date being moved
  useEffect(() => { window.scrollTo(0, 0); }, [hash]);

  let screen;
  if (tab === 'food') screen = <FoodNotMoved />;
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
          <a className={tabClass(tab === 'food')} href="#health/food" role="tab" aria-selected={tab === 'food'} aria-label="Food (not in the new app yet)">Food</a>
        </div>
      </Card>
      {tab === 'workout' && view === 'home' ? screen : <div className="max-w-[720px] mx-auto">{screen}</div>}
    </div>
  );
}
