import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ROUND_SIZE } from '../data/study/common';
import { dueConcepts } from '../data/study/revision';
import { activeStudy, sessionMinutes } from '../data/study/sessions';
import type { DateKey, MyDayData } from '../data/types';
import { startRevision } from './actions';
import { Meta, Row, TextLink } from './parts';

// On Today: only what's waiting for you in Study — a session in progress, or revision that's ready.
// Nothing is added to the day's task list, and nothing shows when nothing is waiting.
export function StudyTodayCard({ data, k }: { data: MyDayData; k: DateKey }) {
  const cur = activeStudy(data.study), due = dueConcepts(data.study, k).length;
  if (!cur && !due) return null;
  return (
    <Card aria-labelledby="study-card-h">
      <h2 id="study-card-h">Study</h2>
      {cur && (
        <Row>
          <div className="min-w-0"><strong>Study session {cur.runningSince ? 'in progress' : 'paused'}</strong><div><Meta>{cur.title} · {sessionMinutes(cur)} min so far</Meta></div></div>
          <TextLink href="#study/session" className="flex-none">Resume</TextLink>
        </Row>
      )}
      {due > 0 && (
        <Row>
          <div className="min-w-0"><strong>Revision ready</strong><div><Meta>{due > ROUND_SIZE ? `A round of ${ROUND_SIZE}` : `${due} question${due === 1 ? '' : 's'}`} — whenever suits you</Meta></div></div>
          <Button inline className="flex-none" data-action="s-rev-start" onClick={startRevision}>Revise</Button>
        </Row>
      )}
    </Card>
  );
}
