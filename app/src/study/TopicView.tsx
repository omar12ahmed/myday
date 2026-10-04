import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { fmtDuration, todayKey } from '../data/dates';
import { completionText, stIndex, taskPath } from '../data/study/roadmap';
import { activeStudy } from '../data/study/sessions';
import { studiedText, topicGlance } from '../data/study/topics';
import type { MyDayData } from '../data/types';
import { setFocus } from './actions';
import { BackLink, Bar, Eyebrow, Note, TextLink } from './parts';
import { StartBlock } from './StartBlock';

// One topic's page (#study/topic/<id>): what's up next in it, ready to start, and its courses by stage. Editing the
// outline (stages, modules, sections, tasks) stays in the roadmap, opened on this topic.
export function TopicView({ data, id, lengths, setLength }: { data: MyDayData; id: string; lengths: Record<string, number>; setLength: (key: string, m: number) => void }) {
  const st = data.study, ix = stIndex(st), g = topicGlance(st, ix, id);
  if (!g) return <><BackLink to="study" label="Study" /><Card><h2>This topic isn't here</h2><Note className="m-0">It may have been removed, here or in another tab.</Note></Card></>;
  const roadmap = `#study/roadmap/${g.topic.id || 'main'}`, busy = !!activeStudy(st);
  const stages = [...new Map(g.courses.map(x => [x.stage.id, x.stage])).values()];
  return (
    <>
      <BackLink to="study" label="Study" />
      <Card aria-labelledby="topic-h" id="topicHead">
        <h2 id="topic-h" className="m-0">{g.topic.title}</h2>
        <p className="text-[15px] m-0 mt-1.5" data-s="topic-comp">{g.comp.total ? completionText(g.comp) : 'No tasks added yet'}</p>
        <Bar c={g.comp} />
        <p className="text-sm text-fg-3 m-0 mt-1" data-s="topic-last">{studiedText(g.lastStudied, todayKey())} · {g.courses.length} course{g.courses.length === 1 ? '' : 's'}</p>
      </Card>

      {g.next ? (
        <Card tone="accent" id="topicNext" className="next-card" aria-labelledby="tnext-h">
          <Eyebrow>{g.isFocus ? 'Your current focus' : `Up next in ${g.topic.title}`}</Eyebrow>
          <h2 id="tnext-h" className="st-course-title">{g.next.title}</h2>
          {busy ? <p className="text-[15px] m-0">A session is in progress — finish or resume it before starting another. <TextLink href="#study/session">Go to it</TextLink></p>
            : g.nextTask ? (
              <>
                <p className="st-path text-[13px] text-fg-3 m-0 mt-1">{taskPath(ix, g.nextTask.id)}</p>
                <p className="st-next text-[19px] font-[650] mt-1.5 mb-0.5">{g.nextTask.title}</p>
                <p className="text-[15px] text-fg-2 m-0">About {fmtDuration(g.nextTask.minutes)}{g.nextTask.kind === 'practical' ? ' · Practical' : ''}</p>
                <StartBlock data={data} course={g.next} task={g.nextTask} lengths={lengths} setLength={setLength} />
              </>
            ) : <p className="text-[15px] m-0">{(ix.courseTasks.get(g.next.id) ?? []).length ? 'Every task in this course is marked complete.' : 'This course has no sections or tasks yet — add them in the roadmap, or start a session anyway.'}</p>}
          {!g.isFocus && <Button inline className="mt-3" data-action="s-focus" data-id={g.next.id} onClick={() => setFocus(g.next!.id)}>Make this my focus</Button>}
        </Card>
      ) : (
        <Card tone="accent" id="topicNext">
          <h2>No courses in {g.topic.title} yet</h2>
          <p className="text-[15px] text-fg-2">Add its first course — a book, an app, a class or a YouTube series all work. You can add its sections as you go.</p>
          <a className="inline-flex items-center justify-center min-h-tap w-full rounded-btn bg-primary text-on-primary font-[650] shadow-raised no-underline" href={roadmap} data-action="topic-first-course">Add the first course</a>
        </Card>
      )}

      {g.courses.length > 0 && (
        <Card aria-labelledby="tcourses-h" id="topicCourses">
          <h3 id="tcourses-h">Courses</h3>
          {stages.map(sg => (
            <div key={sg.id} className="mt-2 first:mt-0">
              {stages.length > 1 && <p className="text-[13px] font-semibold text-fg-3 m-0 mt-3 mb-1">{sg.title}</p>}
              <ul className="list-none p-0 m-0">
                {g.courses.filter(x => x.stage === sg).map(({ course: c, comp }) => (
                  <li key={c.id} className="tc-row flex items-center justify-between gap-3 py-2.5 border-t border-outline first:border-t-0" data-id={c.id}>
                    <a href={`#study/course/${c.id}`} className="min-w-0 flex-1 min-h-11 text-fg no-underline">
                      <span className="block font-medium leading-snug break-words">{c.title}</span>
                      <span className="block text-sm text-fg-3 tabular-nums">{completionText(comp)}</span>
                    </a>
                    {g.isFocus && c === g.next ? <span className="flex-none text-xs font-bold tracking-[.06em] uppercase px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container">Focus</span>
                      : <Button inline variant="ghost" className="flex-none" data-action="s-focus" data-id={c.id} onClick={() => setFocus(c.id)}>Focus on this</Button>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {g.setAside > 0 && <Note className="mb-0 mt-2">{g.setAside} course{g.setAside === 1 ? '' : 's'} set aside — in the roadmap.</Note>}
        </Card>
      )}
      <Card aria-label={`Edit ${g.topic.title}`}>
        <TextLink href={roadmap}>Open {g.topic.title} in the roadmap</TextLink>
        <p className="text-[15px] text-fg-2 m-0 mt-1">Add courses, modules, sections and tasks, or rename this topic.</p>
      </Card>
    </>
  );
}
