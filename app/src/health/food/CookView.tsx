import { ChevronLeft, ChevronRight, Pause, Play, Square, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useConfirm } from '../../components/confirm';
import { BackLink, Eyebrow, Note, Summary, TextLink } from '../../components/parts';
import { getRecipe } from '../../data/food/mealdb';
import { scaledMeasure } from '../../data/food/quantities';
import { recipeSteps, stepTimers } from '../../data/food/recipes';
import { update } from '../../data/storage';
import { fmtClock } from '../../data/timer';
import type { CookTimer, MyDayData } from '../../data/types';
import { cookStep, finishCooking, pauseTimer, resumeTimer, startTimer, stopCooking, stopTimer } from './actions';
import { changed, useFoodVisit, V } from './visit';

const remaining = (t: CookTimer) => Math.max(0, t.durationSec * 1000 - (t.accumulatedMs + (t.startedAt ? Date.now() - t.startedAt : 0)));

// A step's timer, by the clock (a refresh or a sleeping phone keeps it right). When it ends it says so.
function TimerBar({ timer }: { timer: CookTimer | null }) {
  const [, setTick] = useState(0);
  const running = timer && timer.startedAt;
  useEffect(() => {
    if (!running || !timer) return;
    const id = setInterval(() => {
      if (remaining(timer) <= 0) {
        update(d => { const c = d.health.food.cooking; if (!c || !c.timer) return false; c.timer = null; });
        V.timerDone = true; changed();
        try { navigator.vibrate?.(120); } catch { /* not supported */ }
      } else setTick(n => n + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running, timer]);
  if (!timer) return V.timerDone ? <div className="rest-bar done mt-3 px-3.5 py-2.5 rounded-tile bg-primary-container text-on-primary-container" role="status">Timer done.</div> : null;
  return (
    <div className="rest-bar flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 px-3.5 py-2.5 rounded-tile bg-primary-container text-on-primary-container" role="status">
      <span>{timer.label}</span>
      <strong id="cookTime" role="timer" className="text-[22px] tabular-nums flex-1">{fmtClock(remaining(timer))}</strong>
      <span className="flex gap-2">
        {timer.startedAt
          ? <Button inline data-action="h-ctimer-pause" onClick={pauseTimer}><Pause size={16} aria-hidden="true" /> Pause</Button>
          : <Button inline data-action="h-ctimer-resume" onClick={resumeTimer}><Play size={16} aria-hidden="true" /> Resume</Button>}
        <Button inline variant="ghost" data-action="h-ctimer-stop" aria-label="Stop the timer" onClick={stopTimer}><Square size={14} aria-hidden="true" /> Stop</Button>
      </span>
    </div>
  );
}

// Cooking: one step at a time, in the recipe's own words, with the step number large and clear.
// Your place is saved, so you can leave and come back to the same step.
export function CookView({ data }: { data: MyDayData }) {
  useFoodVisit();
  const confirm = useConfirm();
  const f = data.health.food, c = f.cooking, r = c && getRecipe(f, c.recipeId);
  if (!c || !r) return <Card><h2>Nothing cooking right now</h2><TextLink href="#health/food">Back to Food</TextLink></Card>;
  const steps = recipeSteps(r.instructions), n = steps.length;
  const i = Math.min(c.step, Math.max(0, n - 1)), step = steps[i] || '';
  const factor = r.servings && c.servings ? c.servings / r.servings : 1;
  const timers = stepTimers(step);
  async function stop() {
    if (await confirm({ title: 'Stop cooking?', body: "Your place in the recipe won't be kept.", confirmLabel: 'Stop cooking', cancelLabel: 'Keep cooking' })) stopCooking();
  }
  return (
    <>
      <Card tone="accent" className="cook-view" aria-labelledby="cook-h">
        <BackLink to={`health/food/recipe/${encodeURIComponent(r.id)}`} label={r.title} />
        <div className="flex items-center gap-3 mt-1">
          {n > 0 && <span className="step-num size-12 flex-none rounded-full bg-primary text-on-primary grid place-items-center text-[22px] font-bold tabular-nums" aria-hidden="true">{i + 1}</span>}
          <span id="cook-h"><Eyebrow>{n ? `Step ${i + 1} of ${n}` : 'Cooking'}</Eyebrow></span>
        </div>
        <p className="cook-step text-[22px] leading-normal mt-2.5 mb-4" id="cookStep">{n ? step : 'This recipe has no method text — use the ingredients below.'}</p>
        {timers.length > 0 && (
          <div className="chip-row flex flex-wrap gap-2">
            {timers.map(t => <Button key={t.label} inline data-action="h-ctimer" data-sec={t.sec} data-label={t.label} onClick={() => startTimer(t.sec, t.label)}><Timer size={16} aria-hidden="true" /> Start timer · {t.label}</Button>)}
          </div>
        )}
        <div id="cookTimer"><TimerBar timer={c.timer} /></div>
        <div className="cook-nav grid grid-cols-2 gap-2.5 mt-3.5">
          <Button className="!min-h-16 text-lg" data-action="h-cook-step" data-d="-1" disabled={i === 0} onClick={() => cookStep(-1, n)}><ChevronLeft size={20} aria-hidden="true" /> Previous</Button>
          {i < n - 1
            ? <Button variant="primary" className="!min-h-16 text-lg" data-action="h-cook-step" data-d="1" onClick={() => cookStep(1, n)}>Next <ChevronRight size={20} aria-hidden="true" /></Button>
            : <Button variant="primary" className="!min-h-16 text-lg" data-action="h-cook-finish" onClick={finishCooking}>Finished cooking</Button>}
        </div>
      </Card>
      <Card aria-label="Ingredients and full method">
        <details className="group">
          <Summary>Ingredients{factor !== 1 ? ` (for ${c.servings} servings)` : ''}</Summary>
          <ul className="ing-list list-none p-0 mt-1 mb-0">{r.ingredients.map((x, k) => <li key={k} className="py-2 border-t border-outline first:border-t-0"><span className="ing-qty font-semibold tabular-nums">{scaledMeasure(x.measure, factor).text}</span> {x.name}</li>)}</ul>
        </details>
        <details className="group">
          <Summary>Full method</Summary>
          <ol className="steps list-decimal pl-6 my-2 marker:font-bold marker:text-primary">{steps.map((s, k) => <li key={k} className={`mb-2.5 leading-relaxed pl-1${k === i ? ' current font-[650]' : ''}`} aria-current={k === i ? 'step' : undefined}>{s}</li>)}</ol>
        </details>
      </Card>
      <Card>
        <div className="grid gap-2.5">
          <a className="btn inline-flex items-center justify-center min-h-tap w-full rounded-btn bg-tonal text-on-tonal font-[550]" href="#health/food">Leave — I'll come back to this step</a>
          <Button variant="ghost" data-action="h-cook-stop" onClick={stop}>Stop cooking</Button>
        </div>
        <Note className="mt-2.5 mb-0">"Finished cooking" saves it to your cooking history. It doesn't record what you eat.</Note>
      </Card>
    </>
  );
}
