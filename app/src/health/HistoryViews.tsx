import { Card } from '../components/Card';
import { LiveInput } from '../components/Field';
import { BackLink, InlineLink, Meta, Note, TextLink } from '../components/parts';
import { Button } from '../components/Button';
import { shortDate } from '../data/dates';
import type { MyDayData } from '../data/types';
import { EX_TYPE_LABEL, fmtSet } from '../data/workout/common';
import { exerciseRecords, exerciseSeries } from '../data/workout/history';
import { exById, finishedSessions } from '../data/workout/plans';
import { setsDone, setsTotal } from '../data/workout/sessions';
import { setExerciseName, toggleArchiveExercise } from './actions';
import { Chart } from './Chart';

// Every finished workout, newest first. Each opens its own record, where results can be corrected.
export function HistoryView({ data }: { data: MyDayData }) {
  const list = finishedSessions(data.health.workout).slice().reverse();
  return (
    <Card aria-labelledby="hist-h">
      <BackLink to="health/workout" label="Workout" />
      <h2 id="hist-h">Workout history</h2>
      {list.length ? (
        <ul className="plain-list list-none p-0 my-2">
          {list.map(s => (
            <li key={s.id} className="py-2 border-t border-outline first:border-t-0">
              <InlineLink href={`#health/workout/log/${s.id}`}>{s.templateName}</InlineLink>
              <div><Meta>{shortDate(s.date)} · {setsDone(s)} of {setsTotal(s)} sets · {s.status === 'short' ? 'shorter session' : 'full session'}{s.editedAt ? ' · corrected' : ''}</Meta></div>
            </li>
          ))}
        </ul>
      ) : <Note className="m-0">Nothing logged yet.</Note>}
    </Card>
  );
}

// Your exercises: rename, archive, and each one's history. The way an exercise is tracked can't change
// once it has been logged, so its history stays comparable.
export function ExercisesView({ data }: { data: MyDayData }) {
  const w = data.health.workout, list = w.exercises;
  const hasHistory = (id: string) => w.sessions.some(s => s.exercises.some(e => e.exerciseId === id));
  return (
    <Card aria-labelledby="exs-h">
      <BackLink to="health/workout" label="Workout" />
      <h2 id="exs-h">Exercises</h2>
      {list.length ? list.map(e => (
        <div key={e.id} className="tpl-item py-3 border-t border-outline first:border-t-0">
          <div className="grid gap-1.5">
            <label className="text-sm text-fg-2" htmlFor={`exn-${e.id}`}>Name</label>
            <LiveInput id={`exn-${e.id}`} type="text" maxLength={80} data-h="ex-name" data-id={e.id} value={e.name} asSaved={x => x.trim().slice(0, 80) || e.name} onSave={x => setExerciseName(e.id, x)} />
          </div>
          <div className="card-head flex justify-between items-center gap-2 flex-wrap mt-1">
            <span className="text-[15px] text-fg-2">{EX_TYPE_LABEL[e.type]}{hasHistory(e.id) ? ' · tracking type fixed once logged' : ''}{e.archived ? ' · archived' : ''}</span>
            <div className="c-actions flex items-center gap-2">
              <TextLink href={`#health/workout/exercise/${e.id}`}>History</TextLink>
              <Button inline data-action="h-ex-archive" data-id={e.id} onClick={() => toggleArchiveExercise(e.id)}>{e.archived ? 'Restore' : 'Archive'}</Button>
            </div>
          </div>
        </div>
      )) : <Note className="m-0">Exercises you create appear here.</Note>}
    </Card>
  );
}

// One exercise over time: a chart per comparable measure (with its unit), and every session as a table.
export function ExerciseHistory({ data, id }: { data: MyDayData; id: string }) {
  const w = data.health.workout, ex = exById(w, id);
  if (!ex) return <Card><h2>Exercise not found</h2><TextLink href="#health/workout/exercises">Back</TextLink></Card>;
  const recs = exerciseRecords(w, ex.id), series = exerciseSeries(ex.type, recs), charts = series.filter(s => s.points.length >= 3);
  return (
    <>
      <Card aria-labelledby="exh-h">
        <BackLink to="health/workout/exercises" label="Exercises" />
        <h2 id="exh-h">{ex.name}</h2>
        <Note>{EX_TYPE_LABEL[ex.type]} · {recs.length} logged session{recs.length === 1 ? '' : 's'}. MyDay never changes your targets for you.</Note>
        {charts.length ? charts.map(s => <Chart key={s.label} series={s} />)
          : <Note className="m-0">A progress chart appears once there are at least 3 comparable sessions{series.length > 1 ? ' of the same kind (bodyweight, added weight and assistance are kept apart)' : ''}.</Note>}
      </Card>
      <Card aria-labelledby="exs2-h">
        <h3 id="exs2-h">Every session</h3>
        {recs.length ? (
          <div className="overflow-x-auto">
            <table className="hist-table w-full border-collapse text-[15px]">
              <thead><tr className="text-xs uppercase tracking-[.08em] text-fg-3"><th scope="col" className="text-left py-2 px-1 border-b border-outline">Date</th><th scope="col" className="text-left py-2 px-1 border-b border-outline">Sets done</th></tr></thead>
              <tbody>
                {recs.slice().reverse().map(({ s, e }) => (
                  <tr key={s.id}>
                    <td className="py-2 px-1 border-b border-outline align-top whitespace-nowrap"><InlineLink href={`#health/workout/log/${s.id}`}>{shortDate(s.date)}</InlineLink></td>
                    <td className="py-2 px-1 border-b border-outline align-top tabular-nums">{e.sets.filter(x => x.done).map(x => fmtSet(e.type, x)).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Note className="m-0">Nothing logged yet.</Note>}
      </Card>
    </>
  );
}
