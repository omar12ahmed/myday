import { Card } from '../../components/Card';
import { ExploreBoundary } from '../../explore/ExploreBoundary';
import type { Modality } from '../../data/arabic/types';
import { shortDate } from '../../data/dates';
import type { MyDayData } from '../../data/types';
import { askStep } from '../journey/pending';
import { Note } from '../parts';
import { lessonIndex } from './catalogue';
import { arabicProgress, arabicSkills, type ArabicProgress as Progress, type ArabicSkill, type NeedsRevision } from './plan';

// The opening of Progress for Arabic (specs/study-home-and-lessons.md §11): what's done, what you can do on your
// own, what needs revision and why, with a link straight to the step that helps, and the next milestone; then the four
// skills (§12). Words and counts only: no percentages, no streaks. Loaded with Progress only when you've begun Arabic.
const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const LINK = 'inline-flex items-center min-h-11 text-primary font-semibold underline-offset-2 hover:underline';

export default function ArabicProgress({ data }: { data: MyDayData }) {
  const p = arabicProgress(data);
  if (!p.started) return null;
  return <>
    <Card aria-labelledby="pg-arabic" data-pg-arabic="" className="break-words">
      <h3 id="pg-arabic">Arabic: where you stand</h3>
      <dl className="grid gap-2.5 m-0 text-[15px]">
        <div data-pg="done"><dt className="font-semibold inline">Done: </dt><dd className="inline m-0">{p.done} of the {plural(p.path, 'lesson')} on your path (ready to move on or holding).</dd></div>
        <div data-pg="own"><dt className="font-semibold inline">On your own: </dt><dd className="inline m-0">{plural(p.holding, 'lesson')} holding · {plural(p.ownChecks, 'check')} recalled on your own.</dd></div>
        <div data-pg="needs"><dt className="font-semibold inline">Needs revision: </dt><dd className="inline m-0">{p.needs.length ? plural(p.needs.length, 'lesson') + '.' : 'none.'}</dd></div>
      </dl>
      {p.needs.length > 0 && <ul className="list-none p-0 m-0 mt-2 divide-y divide-outline" data-pg-needs={p.needs.length}>{p.needs.map(n => <Needs key={n.lessonId} n={n} />)}</ul>}
      {p.milestones > 0 && <p className="text-[15px] mt-3 mb-0" data-pg="milestone"><strong>Next milestone: </strong>{p.milestone
        ? <>{p.milestone.stage}, {plural(p.milestone.toGo, 'lesson')} to go, up to and including “{p.milestone.last}”.</>
        : 'every milestone on your path is behind you.'}</p>}
      <Note className="mt-2 mb-0">Built from your answers and marks. Holding needs a lesson’s checks recalled on your own a week or more after Ready; listening and speaking aren’t part of them.</Note>
    </Card>
    <ExploreBoundary><FourSkills data={data} progress={p} /></ExploreBoundary>
  </>;
}

// Reading, writing, speaking and listening, each on its own (study/arabic/plan.ts arabicSkills): what you ticked in
// finished sessions, how far your path's lessons that ask for it go, the next one, and what the next milestone asks.
const LABEL: Record<Modality, string> = { reading: 'Reading', writing: 'Writing', speaking: 'Speaking', listening: 'Listening' };
const ABOUT: Partial<Record<Modality, string>> = {
  listening: 'This is what you ticked. MyDay’s clips play beside their text, so it shows listening on its own only when you understood without reading along.',
  speaking: 'MyDay can’t hear you, so this is what you ticked. A teacher or a fluent listener can tell you about your pronunciation.',
};
function FourSkills({ data, progress }: { data: MyDayData; progress: Progress }) {
  const { skills, writeWords } = arabicSkills(data, progress);
  return <Card aria-labelledby="pg-arabic-skills" data-pg-arabic-skills="" className="break-words">
    <h3 id="pg-arabic-skills">Arabic: four skills</h3>
    <ul className="list-none p-0 m-0 grid sm:grid-cols-2 gap-x-6">{skills.map(s => <Skill key={s.modality} s={s} words={s.modality === 'writing' ? writeWords : 0} />)}</ul>
    <Note className="mt-2 mb-0">Your own record of what you practised in the sessions you finished, each skill on its own. Not a level: the course’s stages (A1, A2 …) are targets informed by the CEFR, not a level you’ve reached or a qualification.</Note>
  </Card>;
}
function Skill({ s, words }: { s: ArabicSkill; words: number }) {
  const title = s.next ? lessonIndex[s.next]?.title ?? s.next : null;
  const own = s.own === s.sessions ? (s.sessions === 1 ? 'without help' : 'all without help') : s.own ? `${s.own} without help` : 'none without help';
  return <li className="py-2.5 border-t border-outline" data-pg-skill={s.modality}>
    <h4 className="m-0">{LABEL[s.modality]}</h4>
    <p className="text-[15px] m-0 mt-1" data-pg-skill-done="">{s.sessions && s.last ? `Practised in ${plural(s.sessions, 'session')} (${own}), last on ${shortDate(s.last)}.` : 'Not ticked in a finished session yet.'}
      {words ? ` ${plural(words, 'kept word')} ${words === 1 ? 'is' : 'are'} in your revision to write from memory.` : ''}</p>
    <p className="text-[15px] m-0 mt-1" data-pg-skill-path="">{!s.asks ? 'No lesson on your path asks for it.'
      : s.practisedIn === s.asks ? `You’ve practised it in every lesson on your path that asks for it (${s.asks}).`
      : `Your path asks for it in ${plural(s.asks, 'lesson')}; you’ve practised it in ${s.practisedIn ? `${s.practisedIn} of those` : 'none of those yet'}.`}</p>
    {title && <a href={'#study/arabic/' + s.next} className={LINK} data-action="pg-skill-next" data-v={s.modality}><span className="sr-only">{LABEL[s.modality]}, </span>Not yet ticked in: {title}</a>}
    {s.guide && <p className="text-sm text-fg-2 m-0 mt-1" data-pg-skill-guide="">The course’s {s.guide.stage} milestone asks for: {s.guide.task}.</p>}
    {ABOUT[s.modality] && <p className="text-sm text-fg-2 m-0 mt-1">{ABOUT[s.modality]}</p>}
  </li>;
}

// What your answers show, in a sentence: sessions, checks on your own now (your latest answer), and the Try.
function shows(n: NeedsRevision): string {
  const checks = plural(n.checks, 'check'), noTry = n.tried ? '' : 'its Try isn’t done yet';
  if (n.sessions && n.own) return `You’ve practised it (${plural(n.sessions, 'session')}) and answered ${n.own} of its ${checks} on your own${n.tried ? '.' : ', but haven’t done its Try yet.'}`;
  const parts = [n.sessions ? `You’ve practised it (${plural(n.sessions, 'session')})` : 'No session on it yet', n.own ? `${n.own} of its ${checks} on your own` : `none of its ${checks} on your own yet`, noTry].filter(Boolean);
  return parts.join('; ') + '.';
}
// One lesson that needs revision: why (your flag, or a check that slipped), what your answers show, and the step to do.
// The link asks the lesson page for that step only on a plain click (not one that opens a new tab).
function Needs({ n }: { n: NeedsRevision }) {
  const title = lessonIndex[n.lessonId]?.title ?? n.lessonId, href = '#study/arabic/' + n.lessonId;
  return <li className="py-2.5" data-pg-lesson={n.lessonId} data-pg-next={n.next}>
    <strong className="block">{title}</strong>
    <p className="text-[15px] m-0 mt-1">{n.flag !== null ? <>You marked it to revisit{n.flag ? <>: <bdi>{n.flag}</bdi></> : null}.</> : 'One of its checks slipped after you marked it ready.'} {shows(n)}</p>
    <a href={href} className={LINK} data-action="pg-step" data-v={n.next}
      onClick={e => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) askStep(n.lessonId, n.next); }}>
      {n.next === 'try' ? 'Do the Try' : 'Answer its checks'}: {title}</a>
  </li>;
}
