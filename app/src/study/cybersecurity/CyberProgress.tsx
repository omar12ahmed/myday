import { Card } from '../../components/Card';
import type { MyDayData } from '../../data/types';
import { askStep } from '../journey/pending';
import { Note } from '../parts';
import { cyberGlance, type CyberNeeds } from './plan';

// The opening of Progress for Cybersecurity, as for Arabic (specs/study-home-and-lessons.md §11): what's done, what you
// recall on your own, and what needs revision and why, with a link straight to its checks. Words and counts only: no
// percentages, no streaks. Loaded with Progress; shown only once you've begun Cybersecurity.
const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const LINK = 'inline-flex items-center min-h-11 text-primary font-semibold underline-offset-2 hover:underline';

export default function CyberProgress({ data }: { data: MyDayData }) {
  const p = cyberGlance(data);
  if (!p.started) return null;
  return (
    <Card aria-labelledby="pg-cyber" data-pg-cyber="" className="break-words">
      <h3 id="pg-cyber">Cybersecurity: where you stand</h3>
      <dl className="grid gap-2.5 m-0 text-[15px]">
        <div data-pg="done"><dt className="font-semibold inline">Done: </dt><dd className="inline m-0">{p.done} of the {plural(p.path, 'required lesson')} on your path (ready to move on or holding).</dd></div>
        <div data-pg="own"><dt className="font-semibold inline">On your own: </dt><dd className="inline m-0">{plural(p.holding, 'lesson')} holding · {plural(p.ownChecks, 'check')} recalled on your own.</dd></div>
        <div data-pg="needs"><dt className="font-semibold inline">Needs revision: </dt><dd className="inline m-0">{p.needs.length ? plural(p.needs.length, 'lesson') + '.' : 'none.'}</dd></div>
      </dl>
      {p.needs.length > 0 && <ul className="list-none p-0 m-0 mt-2 divide-y divide-outline" data-pg-needs={p.needs.length}>{p.needs.map(n => <Needs key={n.id} n={n} />)}</ul>}
      <Note className="mt-2 mb-0">Built from your notebook and your revision answers. Holding needs a lesson’s knowledge checks recalled on your own a week or more after Ready. Your own record, not verified mastery.</Note>
    </Card>
  );
}

// One lesson that needs revision: why (your flag, or a check that slipped), what your answers show, and its checks.
// The link asks the lesson page for Check only on a plain click (not one that opens a new tab).
function Needs({ n }: { n: CyberNeeds }) {
  const href = '#study/cybersecurity/' + n.id, checks = plural(n.checks, 'check');
  const shows = [n.practised ? `you’ve practised it (${plural(n.practised, 'attempt or session', 'attempts or sessions')})` : 'nothing handed in or studied on it yet',
    n.own ? `${n.own} of its ${checks} on your own` : `none of its ${checks} on your own yet`].join('; ');
  return <li className="py-2.5" data-pg-lesson={n.id}>
    <strong className="block">{n.title}</strong>
    <p className="text-[15px] m-0 mt-1">{n.flag !== null ? <>You marked it to revisit{n.flag ? <>: <bdi>{n.flag}</bdi></> : null}.</> : 'One of its checks slipped after you marked it ready.'} {shows[0].toUpperCase() + shows.slice(1)}.</p>
    <a href={href} className={LINK} data-action="pg-step" data-v="check"
      onClick={e => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) askStep(n.id, 'check'); }}>
      Answer its checks: {n.title}</a>
  </li>;
}
