import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { fmtDuration, parseKey, shift, shortDate, todayKey } from '../data/dates';
import { windowDays } from '../data/progress';
import { CLARITY } from '../data/study/common';
import { evidenceText } from '../data/study/revision';
import { completionText } from '../data/study/roadmap';
import { studyProgress } from '../data/study/progress';
import { sessionMinutes } from '../data/study/sessions';
import type { Clarity, MyDayData } from '../data/types';
import { BackLink, Bar, InlineLink, Meta, Note, Row } from './parts';

// Progress and history: what happened, in cautious words. Time spent isn't treated as proof of
// understanding, and nothing here is ever taken away by a quieter day.
export function ProgressView({ data, historyAll, showAll }: { data: MyDayData; historyAll: boolean; showAll: () => void }) {
  const k = todayKey(), st = data.study;
  const days = windowDays(data, k), n = days.filter(Boolean).length;
  const { courses, practical, recent, weeks, practice, history } = studyProgress(data, k);
  const clarityCount = (Object.keys(CLARITY) as Clarity[]).map(c => `${CLARITY[c]}: ${recent.filter(s => s.checkin!.clarity === c).length}`).join(' · ');
  const shown = historyAll ? history : history.slice(0, 12);
  return (
    <>
      <Card>
        <BackLink to="study" label="Study" />
        <h2>Progress &amp; history</h2>
        <Note className="m-0">What you've done and how it went, in cautious terms. Time spent isn't treated as proof of understanding, and nothing here is ever taken away by a quieter day.</Note>
      </Card>
      <Card aria-labelledby="pg-days">
        <h3 id="pg-days">Learning days in the last 7: {n}</h3>
        <div className="week grid grid-cols-7 gap-1.5 my-3.5" aria-hidden="true">
          {days.map((on, i) => {
            const date = parseKey(shift(k, i - 6)), isToday = i === 6;
            return (
              <div key={i} className={`wd grid justify-items-center gap-1.5 text-xs text-fg-3${on ? ' on' : ''}${isToday ? ' today' : ''}`}>
                <span className={`pip w-full max-w-[38px] aspect-square rounded-xl grid place-items-center font-bold text-learning border ${on ? 'bg-learning-c border-learning' : 'bg-surface-2 border-outline'}`}>{on ? '✓' : ''}</span>
                <span className={isToday ? 'text-fg font-bold' : ''}>{date.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
              </div>
            );
          })}
        </div>
        <Note className="m-0">A day counts once if you finished a Study session or ticked a learning task on Today. The same count as on Today.</Note>
      </Card>
      <Card aria-labelledby="pg-comp">
        <h3 id="pg-comp">Completion</h3>
        {courses.length ? courses.map(x => (
          <div key={x.c.id} className="st-prog py-2 border-t border-outline first:border-t-0">
            <div><strong>{x.c.title}</strong><Meta> · {x.stage.title}</Meta></div>
            <div className="text-[15px]">{completionText(x.comp)}</div>
            <Bar c={x.comp} />
          </div>
        )) : <Note className="m-0">No courses yet.</Note>}
        <Note className="mt-2 mb-0">Tasks marked complete, out of the tasks you've added. Not a measure of how well you know them.</Note>
      </Card>
      <Card aria-labelledby="pg-prac">
        <h3 id="pg-prac">Practical work completed ({practical.length})</h3>
        {practical.length ? (
          <ul className="plain-list list-none p-0 my-2">
            {practical.map(e => <li key={e.node.id} className="py-2 border-t border-outline first:border-t-0">{e.node.title}<div><Meta>{e.course.title}{e.node.doneOn ? ` · ${shortDate(e.node.doneOn)}` : ''}</Meta></div></li>)}
          </ul>
        ) : <Note className="m-0">None marked complete yet. Tasks set to “Practical” appear here when done.</Note>}
      </Card>
      <Card aria-labelledby="pg-clar">
        <h3 id="pg-clar">How clear it felt after learning</h3>
        {recent.length ? <p className="text-[15px] m-0">Last 30 days — {clarityCount}</p> : <Note className="m-0">No check-ins with a rating in the last 30 days.</Note>}
        <Note className="mt-1.5 mb-0">Your own report after a session — separate from how revision went.</Note>
      </Card>
      <Card aria-labelledby="pg-recall">
        <h3 id="pg-recall">Recall over time</h3>
        {st.reviews.length ? (
          <>
            <div className="table-wrap overflow-x-auto">
              <table className="hist-table st-recall w-full border-collapse text-[15px] tabular-nums">
                <thead>
                  <tr className="text-xs uppercase tracking-[.08em] text-fg-3">
                    {['Week of', 'Reviewed', 'On your own', 'With help', 'Not yet'].map((h, i) => <th key={h} scope="col" className={`py-2 px-1 border-b border-outline font-bold whitespace-nowrap ${i ? 'text-right' : 'text-left'}`}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map(w => (
                    <tr key={w.from}>
                      {[shortDate(w.from), w.total || '—', w.total ? w.own : '—', w.total ? w.help : '—', w.total ? w.notyet : '—'].map((v, i) => <td key={i} className={`py-2 px-1 border-b border-outline whitespace-nowrap ${i ? 'text-right' : 'text-left'}`}>{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Note className="mt-1.5 mb-0">“On your own”: right without a hint or notes. Written answers are self-assessed; multiple choice is checked against the answer you stored.</Note>
          </>
        ) : <Note className="m-0">No revision yet, so there isn't enough evidence to show recall.</Note>}
      </Card>
      <Card aria-labelledby="pg-prac2">
        <h3 id="pg-prac2">Might benefit from more practice ({practice.length})</h3>
        {practice.length ? practice.map(x => (
          <Row key={x.c.id}><div className="min-w-0"><InlineLink href={`#study/concept/${x.c.id}`}>{x.c.title}</InlineLink><div><Meta>{evidenceText(x.ev)}</Meta></div></div></Row>
        )) : <Note className="m-0">Nothing flagged right now.</Note>}
      </Card>
      <Card aria-labelledby="pg-hist">
        <h3 id="pg-hist">Study history</h3>
        {history.length ? (
          <>
            <ul className="plain-list list-none p-0 my-2">
              {shown.map(x => x.kind === 'session' ? (
                <li key={'s' + x.s.id} className="py-2 border-t border-outline first:border-t-0">
                  <strong>{shortDate(x.date)}</strong> · {x.s.title}
                  <div><Meta>{fmtDuration(Math.max(1, sessionMinutes(x.s)))}{x.s.short ? ' · short session' : ''}{x.s.checkin && x.s.checkin.clarity ? ` · felt: ${CLARITY[x.s.checkin.clarity]}` : ''}{x.s.taskDone ? ' · task completed' : ''} · <InlineLink href={`#study/checkin/${x.s.id}`}>check-in</InlineLink></Meta></div>
                </li>
              ) : (
                <li key={'r' + x.date} className="py-2 border-t border-outline first:border-t-0">
                  <strong>{shortDate(x.date)}</strong> · Revision
                  <div><Meta>{x.count} question{x.count === 1 ? '' : 's'} reviewed</Meta></div>
                </li>
              ))}
            </ul>
            {history.length > 12 && !historyAll && <Button inline data-action="s-history-all" onClick={showAll}>Show all {history.length}</Button>}
          </>
        ) : <Note className="m-0">Finished sessions and revision days appear here.</Note>}
      </Card>
    </>
  );
}
