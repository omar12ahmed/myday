import { Card } from '../../components/Card';
import type { MyDayData } from '../../data/types';
import { askStep } from '../journey/pending';
import { Note } from '../parts';
import { lessonIndex } from './catalogue';
import { arabicProgress, type NeedsRevision } from './plan';

// The opening of Progress for Arabic (specs/study-home-and-lessons.md §11): what's done, what you can do on your
// own, what needs revision and why, with a link straight to the step that helps, and the next milestone. Words and
// counts only: no percentages, no streaks. Loaded with Progress only when you've begun Arabic.
const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const LINK = 'inline-flex items-center min-h-11 text-primary font-semibold underline-offset-2 hover:underline';

export default function ArabicProgress({ data }: { data: MyDayData }) {
  const p = arabicProgress(data);
  if (!p.started) return null;
  return (
    <Card aria-labelledby="pg-arabic" data-pg-arabic="">
      <h3 id="pg-arabic">Arabic: where you stand</h3>
      <dl className="grid gap-2.5 m-0 text-[15px]">
        <div data-pg="done"><dt className="font-semibold inline">Done: </dt><dd className="inline m-0">{p.done} of the {plural(p.path, 'lesson')} on your path (ready to move on or holding).</dd></div>
        <div data-pg="own"><dt className="font-semibold inline">On your own: </dt><dd className="inline m-0">{plural(p.holding, 'lesson')} holding · {plural(p.ownChecks, 'check')} recalled on your own.</dd></div>
        <div data-pg="needs"><dt className="font-semibold inline">Needs revision: </dt><dd className="inline m-0">{p.needs.length ? plural(p.needs.length, 'lesson') + '.' : 'none.'}</dd></div>
      </dl>
      {p.needs.length > 0 && <ul className="list-none p-0 m-0 mt-2 divide-y divide-outline" data-pg-needs={p.needs.length}>{p.needs.map(n => <Needs key={n.lessonId} n={n} />)}</ul>}
      <p className="text-[15px] mt-3 mb-0" data-pg="milestone"><strong>Next milestone: </strong>{p.milestone
        ? <>{p.milestone.stage}, {plural(p.milestone.toGo, 'lesson')} to go{p.milestone.last ? <>, up to and including “{p.milestone.last}”</> : null}.</>
        : 'every milestone on your path is behind you.'}</p>
      <Note className="mt-2 mb-0">Built from your answers and marks. Holding needs a lesson’s checks recalled on your own a week or more after Ready; listening and speaking aren’t part of them.</Note>
    </Card>
  );
}

// One lesson that needs revision: why (your flag, or a check that slipped), what your answers show, and the step to do.
function Needs({ n }: { n: NeedsRevision }) {
  const title = lessonIndex[n.lessonId]?.title ?? n.lessonId, href = '#study/arabic/' + n.lessonId;
  const why = n.flag !== null ? `You marked it to revisit${n.flag ? `: ${n.flag}` : ''}.` : 'One of its checks slipped after you marked it ready.';
  const shown = `${n.sessions ? `You’ve practised it (${plural(n.sessions, 'session')}) and answered` : 'You’ve answered'} ${n.own} of its ${plural(n.checks, 'check')} on your own${n.tried ? '.' : ', but haven’t done its Try yet.'}`;
  return <li className="py-2.5" data-pg-lesson={n.lessonId} data-pg-next={n.next}>
    <a href={href} className="font-semibold text-fg">{title}</a>
    <p className="text-[15px] m-0 mt-1"><span dir="auto">{why}</span> {shown}</p>
    <a href={href} className={LINK} data-action="pg-step" data-v={n.next} onClick={() => askStep(n.lessonId, n.next)}>{n.next === 'try' ? 'Do the Try' : 'Answer its checks'}</a>
  </li>;
}
