import { useEffect, useState } from 'react';
import type { MyDayData } from '../data/types';
import { CheckinView } from './CheckinView';
import { ConceptsView } from './ConceptsView';
import { ConceptView } from './ConceptView';
import { CourseDetails } from './CourseDetails';
import { Dashboard } from './Dashboard';
import { ProgressView } from './ProgressView';
import { RevisionView } from './RevisionView';
import { Roadmap } from './Roadmap';
import { studyRoute } from './route';
import { SessionView } from './SessionView';
import { StudySettings } from './StudySettings';
import { TaskDetails } from './TaskDetails';
import { TopicView } from './TopicView';
import { topicFromPath } from '../data/study/topics';

// Study: the home page first (what to do next, ready to start, and your topics), and everything else one tap away
// under #study/… — a topic's page, the roadmap, a session, the check-in, revision, concepts, progress and settings.
// Choices that only matter for this visit (edit mode, which parts of the roadmap are open, a session
// length you picked, showing all history) live here and aren't saved.
export function StudyScreen({ data, hash }: { data: MyDayData; hash: string }) {
  const { view, id } = studyRoute(hash);
  const [edit, setEdit] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [lengths, setLengths] = useState<Record<string, number>>({});
  const [historyAll, setHistoryAll] = useState(false);
  const setLength = (key: string, m: number) => setLengths(l => ({ ...l, [key]: m }));

  // Each Study screen starts at the top of the page.
  useEffect(() => { window.scrollTo(0, 0); }, [hash]);

  let screen;
  if (view === 'roadmap') screen = <Roadmap key={id} data={data} state={{ edit, setEdit, open, setOpen }} topic={id ? topicFromPath(id) : null} />;
  else if (view === 'topic') screen = <TopicView data={data} id={topicFromPath(id)} lengths={lengths} setLength={setLength} />;
  else if (view === 'course') screen = <CourseDetails data={data} id={id} />;
  else if (view === 'task') screen = <TaskDetails data={data} id={id} />;
  else if (view === 'session') screen = <SessionView data={data} />;
  else if (view === 'checkin') screen = <CheckinView key={id} data={data} id={id} />;
  else if (view === 'revise') screen = <RevisionView data={data} />;
  else if (view === 'concepts') screen = <ConceptsView data={data} />;
  else if (view === 'concept') screen = <ConceptView key={id} data={data} id={id} />;
  else if (view === 'settings') screen = <StudySettings data={data} />;
  else if (view === 'progress') screen = <ProgressView data={data} historyAll={historyAll} showAll={() => setHistoryAll(true)} />;
  else return <div className="st-view enter"><Dashboard data={data} lengths={lengths} setLength={setLength} /></div>;
  // The other screens are one column, kept to a comfortable reading width on wide screens.
  return <div className="st-view enter max-w-[720px] mx-auto">{screen}</div>;
}
