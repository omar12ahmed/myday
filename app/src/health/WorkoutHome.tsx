import { Play, Plus } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Field, TextInput } from '../components/Field';
import { Eyebrow, InlineLink, Meta, Note, Summary, TextLink } from '../components/parts';
import { shortDate, todayKey } from '../data/dates';
import type { DateKey, MyDayData } from '../data/types';
import { activeWorkout, completedOn, finishedSessions, missedSession, nextInSequence, sessionPlanFor, tplById, upcomingPlans } from '../data/workout/plans';
import { setsDone, setsTotal } from '../data/workout/sessions';
import { continueMissed, moveMissed, newTemplate, skipMissed, startWorkoutFrom, toggleArchiveTemplate } from './actions';

const BTN = 'btn inline-flex items-center justify-center gap-2 min-h-tap w-full rounded-btn bg-primary text-on-primary font-[650] shadow-raised';

// The one thing to do next: resume, create a first workout, decide about a missed one, today's
// workout, or what's coming up. Missed sessions never pile up: only the latest is offered.
function NextAction({ data, moving, setMoving }: { data: MyDayData; moving: DateKey | null; setMoving: (d: DateKey | null) => void }) {
  const moveRef = useRef<HTMLInputElement>(null);
  const w = data.health.workout, k = todayKey(), cur = activeWorkout(w);
  if (cur) {
    return (
      <Card tone="accent" className="next-card"><Eyebrow>In progress</Eyebrow><h2>{cur.templateName}</h2>
        <Note>{setsDone(cur)} of {setsTotal(cur)} sets done · started {cur.startedAt.slice(11)}</Note>
        <a className={BTN} href="#health/workout/session">Resume workout</a></Card>
    );
  }
  if (!w.templates.some(t => !t.archived)) {
    return (
      <Card tone="accent" className="next-card"><Eyebrow>Next step</Eyebrow><h2>Create your first workout</h2>
        <Note>A workout is a list of exercises you do together, like "Chest" or "Home workout".</Note>
        <Button variant="primary" data-action="h-tpl-new" onClick={newTemplate}><Plus size={18} aria-hidden="true" /> Create a workout</Button></Card>
    );
  }
  const missed = missedSession(w, k);
  if (missed) {
    const t = tplById(w, missed.templateId)!, seq = w.schedule.mode === 'sequence';
    return (
      <Card tone="accent" className="next-card">
        <Eyebrow>From {shortDate(missed.date)}</Eyebrow>
        <h2>{t.name} didn't happen — that's okay</h2>
        <Note>What would you like to do with it?</Note>
        {moving === missed.date ? (
          <>
            <Field label="Move it to" htmlFor="wsMoveDate" className="mb-3"><TextInput ref={moveRef} id="wsMoveDate" type="date" min={k} defaultValue={k} /></Field>
            <div className="row2 grid grid-cols-2 gap-2.5">
              <Button variant="primary" data-action="h-missed-move-save" onClick={() => { if (moveMissed(moveRef.current?.value || '')) setMoving(null); }}>Move</Button>
              <Button variant="ghost" data-action="h-missed-move-cancel" onClick={() => setMoving(null)}>Cancel</Button>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-2.5">
              <Button data-action="h-missed-move" onClick={() => setMoving(missed.date)}>Move to another day</Button>
              <Button data-action="h-missed-skip" onClick={skipMissed}>Skip it</Button>
              {seq && <Button data-action="h-missed-continue" onClick={continueMissed}>Continue with next session</Button>}
            </div>
            <Note className="mt-2.5 mb-0">{seq ? 'Skip keeps it next in your sequence. Continue moves on to the following session.' : 'Skipping just lets it go — nothing piles up.'}</Note>
          </>
        )}
      </Card>
    );
  }
  const today = sessionPlanFor(w, k);
  if (today && !completedOn(w, k)) {
    const t = tplById(w, today.templateId)!;
    return (
      <Card tone="accent" className="next-card"><Eyebrow>Today</Eyebrow><h2>{t.name}</h2>
        <Note>About {t.minutes} min{today.time ? ` · planned for ${today.time}` : ''} · {t.items.length} exercise{t.items.length === 1 ? '' : 's'}</Note>
        <Button variant="primary" data-action="h-ws-start" data-tpl={t.id} data-planned={k} onClick={() => startWorkoutFrom(t.id, k)}><Play size={18} aria-hidden="true" /> Start workout</Button></Card>
    );
  }
  const up = upcomingPlans(w, 21, k)[0];
  const seqNext = w.schedule.mode === 'sequence' ? nextInSequence(w) : null;
  const t = up ? tplById(w, up.templateId) : seqNext;
  return (
    <Card tone="accent" className="next-card">
      <Eyebrow>{up ? 'Next planned' : seqNext ? 'Next in your sequence' : 'Whenever you like'}</Eyebrow>
      <h2>{t ? t.name : 'No workout planned'}</h2>
      <Note>{up ? `${shortDate(up.date)}${up.time ? ' at ' + up.time : ''}` : completedOn(w, k) ? 'Already moved today — nice.' : 'Rest days count too.'}</Note>
      {t && <Button data-action="h-ws-start" data-tpl={t.id} onClick={() => startWorkoutFrom(t.id, null)}><Play size={18} aria-hidden="true" /> Start {t.name} now</Button>}
    </Card>
  );
}

// Recent workouts (beside the main cards on wide screens, below them on phones).
function RecentCard({ data }: { data: MyDayData }) {
  const recent = finishedSessions(data.health.workout).slice(-3).reverse();
  return (
    <Card aria-labelledby="recent-h">
      <h2 id="recent-h">Recent workouts</h2>
      {recent.length ? (
        <ul className="plain-list list-none p-0 my-2">
          {recent.map(s => (
            <li key={s.id} className="py-2 border-t border-outline first:border-t-0">
              <InlineLink href={`#health/workout/log/${s.id}`}>{s.templateName}</InlineLink>
              <div><Meta>{shortDate(s.date)} · {setsDone(s)} sets{s.status === 'short' ? ' · shorter session' : ''}</Meta></div>
            </li>
          ))}
        </ul>
      ) : <Note>Nothing logged yet.</Note>}
      <div className="row2 flex flex-wrap gap-x-5"><TextLink href="#health/workout/history">All history</TextLink><TextLink href="#health/workout/exercises">Exercises</TextLink></div>
    </Card>
  );
}

export function WorkoutHome({ data, moving, setMoving }: { data: MyDayData; moving: DateKey | null; setMoving: (d: DateKey | null) => void }) {
  const w = data.health.workout, live = w.templates.filter(t => !t.archived), archived = w.templates.filter(t => t.archived);
  const busy = !!activeWorkout(w), up = upcomingPlans(w, 14).slice(0, 5);
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:gap-x-6 lg:items-start">
      <div className="min-w-0">
        <NextAction data={data} moving={moving} setMoving={setMoving} />
        <Card aria-labelledby="tpls-h">
          <div className="card-head flex justify-between items-center gap-3">
            <h2 id="tpls-h" className="m-0">Your workouts</h2>
            <Button inline data-action="h-tpl-new" onClick={newTemplate}><Plus size={16} aria-hidden="true" /> New</Button>
          </div>
          {live.length ? (
            <ul className="tpl-list list-none p-0 mt-2 mb-0">
              {live.map(t => (
                <li key={t.id} className="tpl-row flex justify-between items-center gap-2.5 py-2.5 border-t border-outline first:border-t-0">
                  <div className="min-w-0"><div className="title font-semibold">{t.name}</div><Meta>{t.items.length} exercise{t.items.length === 1 ? '' : 's'} · about {t.minutes} min</Meta></div>
                  <div className="c-actions flex items-center gap-2 flex-none">
                    <TextLink href={`#health/workout/template/${t.id}`}>Edit</TextLink>
                    <Button inline data-action="h-ws-start" data-tpl={t.id} disabled={busy} onClick={() => startWorkoutFrom(t.id, null)}>Start</Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <Note className="mt-2">No workouts yet.</Note>}
          {archived.length > 0 && (
            <details className="group mt-1">
              <Summary>Archived ({archived.length})</Summary>
              <ul className="tpl-list list-none p-0 m-0">
                {archived.map(t => (
                  <li key={t.id} className="tpl-row flex justify-between items-center gap-2.5 py-2.5 border-t border-outline first:border-t-0">
                    <div className="title min-w-0">{t.name}</div>
                    <Button inline data-action="h-tpl-archive" data-tpl={t.id} onClick={() => toggleArchiveTemplate(t.id)}>Restore</Button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Card>
        <Card aria-labelledby="sch-h">
          <div className="card-head flex justify-between items-center gap-3">
            <h2 id="sch-h" className="m-0">Schedule</h2>
            <TextLink href="#health/workout/schedule">Change</TextLink>
          </div>
          <p className="text-[15px] mt-1">{w.schedule.mode === 'weekdays' ? 'By weekday.' : w.schedule.mode === 'sequence' ? `A repeating sequence — next up: ${(nextInSequence(w) || { name: '—' }).name}.` : 'No schedule — start whenever you like.'}</p>
          {up.length > 0 && (
            <ul className="plain-list list-none p-0 m-0">
              {up.map(p => <li key={p.date} className="py-2 border-t border-outline first:border-t-0 text-[15px]">{shortDate(p.date)}{p.time ? ' · ' + p.time : ''} — {tplById(w, p.templateId)!.name}</li>)}
            </ul>
          )}
        </Card>
      </div>
      <div className="min-w-0"><RecentCard data={data} /></div>
    </div>
  );
}
