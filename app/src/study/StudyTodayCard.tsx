import { Card } from '../components/Card';
import { learningOptions } from './nextLearning';
import { Button } from '../components/Button';
import { ROUND_SIZE } from '../data/study/common';
import { dueIds } from '../data/study/queue';
import { DAILY_ENOUGH, reviewedOn } from '../data/study/revision';
import { activeStudy, sessionMinutes } from '../data/study/sessions';
import type { DateKey, MyDayData } from '../data/types';
import { startRevision } from './actions';
import { Meta, Row, TextLink } from './parts';

// On Today: only what's waiting for you in Study — a session in progress, or revision that's ready.
// Nothing is added to the day's task list, and nothing shows when nothing is waiting.
export function StudyTodayCard({ data, k }: { data: MyDayData; k: DateKey }) {
  const cur = activeStudy(data.study), due = dueIds(data, k).length, today = reviewedOn(data.study, k);
  const options = learningOptions(data);
  if (!cur && !due && !options.length) return null;
  return (
    <Card aria-labelledby="study-card-h">
      <h2 id="study-card-h">Study</h2>
      {cur && (
        <Row>
          <div className="min-w-0"><strong>Study session {cur.runningSince ? 'in progress' : 'paused'}</strong><div><Meta>{cur.title} · {sessionMinutes(cur)} min so far</Meta></div></div>
          <TextLink href="#study/session" className="flex-none">Resume</TextLink>
        </Row>
      )}
      {!cur && options.length > 0 && <div className="grid gap-3 mb-3" data-s="study-next-lessons">
        <div><strong>Continue learning</strong><p className="text-sm text-fg-2 m-0">Your next lesson is ready — or choose another subject.</p></div>
        {options.map((option, i) => <div key={option.subject} className="rounded-tile border border-outline p-3" data-subject={option.subject}>
          <p className="text-xs text-fg-3 m-0">{option.label} · {option.minutes} min</p>
          <p className="font-semibold my-1">{option.title}</p>
          <p className="text-sm text-fg-2 mt-0 mb-2">{option.detail}</p>
          <a href={option.href} className={`inline-flex items-center justify-center min-h-11 rounded-btn px-4 font-semibold no-underline ${i === 0 ? 'bg-primary text-on-primary' : 'bg-surface-2 text-primary border border-outline'}`} data-action="continue-learning">{option.resume ? 'Resume lesson' : option.allComplete ? 'Revisit lesson' : 'Continue learning'}</a>
        </div>)}
        <a href="#study" className="text-primary font-semibold text-sm min-h-11 inline-flex items-center">Browse all courses and lessons</a>
      </div>}
      {due > 0 && today >= DAILY_ENOUGH && (
        <Row>
          <div className="min-w-0" data-s="today-rev-enough"><strong>Revision: {today} done today</strong><div><Meta>That’s plenty. The rest will keep for tomorrow.</Meta></div></div>
          <TextLink href="#study/revise" className="flex-none">More</TextLink>
        </Row>
      )}
      {due > 0 && today < DAILY_ENOUGH && (
        <Row>
          <div className="min-w-0"><strong>Revision ready</strong><div><Meta>{due > ROUND_SIZE ? `A round of ${ROUND_SIZE}` : `${due} question${due === 1 ? '' : 's'}`} — whenever suits you</Meta></div></div>
          <Button inline className="flex-none" data-action="s-rev-start" onClick={() => startRevision()}>Revise</Button>
        </Row>
      )}
    </Card>
  );
}
