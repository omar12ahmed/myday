import { useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ExternalLink } from '../parts';
import { Mixed } from '../arabic/Ar';
import { MixedVoiceLabel } from '../arabic/Listen';

import { useTeaching, type Course, type TeachingParts } from './useTeaching';

// Text stays data: backticks become code; Arabic runs retain direction and language.
function Prose({ text, voice }: { text: string; voice?: string }) {
  return <>{text.split(/(`[^`]+`)/g).map((part, i) => part.startsWith('`')
    ? <code key={i} dir="ltr" className="rounded bg-surface-2 px-1 break-words">{part.slice(1, -1)}</code>
    : <Mixed key={i} text={part} voice={voice ? `${voice}:${i}` : undefined} />)}</>;
}

// While the teaching loads (or if it can't): on its own card, or `bare` inside one already there.
export function TeachingWaiting({ missing, bare = false }: { missing: boolean; bare?: boolean }) {
  const body = missing ? <><p>The teaching material could not be loaded. Your practical tasks are still below.</p><Button onClick={() => window.location.reload()}>Reload lesson</Button></>
    : <p>Loading the explanation and examples…</p>;
  return bare ? <div aria-live="polite">{body}</div> : <Card aria-live="polite"><h3>Lesson reading</h3>{body}</Card>;
}
// Read and see it worked: the explanation and the worked example.
export function TeachingRead({ t, label = true }: { t: TeachingParts; label?: boolean }) {
  const { lesson, voice } = t;
  if (!lesson) return null;
  return <>
    <p className="leading-relaxed"><Prose text={lesson.explanation} voice={voice && `${voice}:explanation`} /></p>
    <h4>Worked example</h4><p className="leading-relaxed"><Prose text={lesson.example} voice={voice && `${voice}:example`} /></p>
    {label && voice && <MixedVoiceLabel texts={[lesson.explanation, lesson.example]} />}
  </>;
}
// Try it, with the explained answer hidden until you ask. `revealed` is the caller's, so it can stay open as you move.
export function TeachingTry({ t, lessonId, revealed, setRevealed, label = true }: { t: TeachingParts; lessonId: string; revealed: boolean; setRevealed: (v: boolean) => void; label?: boolean }) {
  const { lesson, voice } = t;
  if (!lesson) return null;
  const solutionId = 'teaching-solution-' + lessonId.replaceAll('.', '-');
  return <>
    <h4>Try it</h4><p className="leading-relaxed" data-teaching-practice=""><Prose text={lesson.practice} voice={revealed && voice ? `${voice}:practice` : undefined} /></p>
    <Button aria-expanded={revealed} aria-controls={solutionId} onClick={() => setRevealed(!revealed)}>{revealed ? 'Hide explained answer' : 'Reveal explained answer'}</Button>
    {revealed && <div id={solutionId} data-teaching-solution="" className="mt-4 rounded-tile border border-outline p-4"><h4>Explained answer</h4><p className="leading-relaxed mb-0"><Prose text={lesson.solution} voice={voice && `${voice}:solution`} /></p></div>}
    {label && revealed && voice && <MixedVoiceLabel texts={[lesson.practice, lesson.solution]} />}
  </>;
}
// The assigned material to read, watch and explore next.
export function TeachingMaterial({ t }: { t: TeachingParts }) {
  const { lesson, sources } = t;
  if (!lesson) return null;
  return <Card aria-label="Assigned learning material"><h3>Read, watch and explore next</h3>
    <p className="text-sm text-fg-2">Start with the first assignment. A long lecture or chapter can span several sessions.</p>
    <ol className="list-decimal pl-5 grid gap-5">{lesson.resources.map(a => { const s = sources[a.sourceId]; return <li key={a.sourceId} data-teaching-resource="">
      <p className="text-xs uppercase tracking-wide text-fg-2 mb-1">{s.kind === 'watch' ? 'Watch / listen' : s.kind}</p>
      <ExternalLink href={s.url}><Mixed text={s.title} /></ExternalLink>
      <p className="mt-2 mb-1"><Prose text={a.instruction} /></p>
      <p className="text-xs text-fg-2 m-0">{s.access}</p>
    </li>; })}</ol>
    <details className="mt-3"><summary className="cursor-pointer min-h-11 py-2 text-primary">About these resources</summary><p className="text-sm text-fg-2">Pages and topics checked on 16 October 2026. Videos play on their provider’s site; playback was not tested. If a player is unavailable, use its reading or transcript for a reading task and return to listening later. Reading a transcript does not establish unaided listening.</p></details>
  </Card>;
}

// The whole teaching in one place (the Cybersecurity lesson page). A key at the call site resets reveal state on
// lesson navigation.
export function TeachingLesson({ course, lessonId }: { course: Course; lessonId: string }) {
  const t = useTeaching(course, lessonId);
  const [revealed, setRevealed] = useState(false);
  const { lesson, voice } = t;
  if (!lesson) return <TeachingWaiting missing={t.missing} />;
  return <div data-teaching={lessonId} className="min-w-0 break-words">
    <Card aria-label="Lesson reading">
      <h3>Read this first</h3>
      <p className="text-sm text-fg-2">Short session: read, try, then compare. Continue with the assigned material when you have time.</p>
      <TeachingRead t={t} label={false} />
      <TeachingTry t={t} lessonId={lessonId} revealed={revealed} setRevealed={setRevealed} label={false} />
      {voice && <MixedVoiceLabel texts={[lesson.explanation, lesson.example, ...(revealed ? [lesson.practice, lesson.solution] : [])]} />}
    </Card>
    <TeachingMaterial t={t} />
  </div>;
}
