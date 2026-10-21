import { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ExternalLink } from '../parts';
import { Mixed } from '../arabic/Ar';
import { MixedVoiceLabel } from '../arabic/Listen';

type Course = 'cybersecurity' | 'arabic-fusha';
interface Source { title: string; kind: string; url: string; checkedOn: string; access: string }
interface Teaching { explanation: string; example: string; practice: string; solution: string; resources: { sourceId: string; instruction: string }[] }
interface Companion { lessons: Record<string, Teaching>; sources: Record<string, Source> }
const loaders: Record<Course, () => Promise<{ default: Companion }>> = {
  cybersecurity: () => import('../../../../content/teaching/cybersecurity.json'),
  'arabic-fusha': () => import('../../../../content/teaching/arabic-fusha.json'),
};

// Text stays data: backticks become code; Arabic runs retain direction and language.
function Prose({ text, voice }: { text: string; voice?: string }) {
  return <>{text.split(/(`[^`]+`)/g).map((part, i) => part.startsWith('`')
    ? <code key={i} dir="ltr" className="rounded bg-surface-2 px-1 break-words">{part.slice(1, -1)}</code>
    : <Mixed key={i} text={part} voice={voice ? `${voice}:${i}` : undefined} />)}</>;
}

// A key at the call site resets reveal state on lesson navigation. No progress is written by reading.
export function TeachingLesson({ course, lessonId }: { course: Course; lessonId: string }) {
  const [book, setBook] = useState<Companion | null>(null);
  const [failed, setFailed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    let active = true;
    loaders[course]().then(m => { if (active) { setBook(m.default); setFailed(false); } })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [course]);
  const lesson = book?.lessons[lessonId];
  if (!lesson) return <Card aria-live="polite"><h3>Lesson reading</h3>
    {failed || book ? <><p>The teaching material could not be loaded. Your practical tasks are still below.</p><Button onClick={() => window.location.reload()}>Reload lesson</Button></>
      : <p>Loading the explanation and examples…</p>}
  </Card>;
  const solutionId = 'teaching-solution-' + lessonId.replaceAll('.', '-');
  const voice = course === 'arabic-fusha' ? `${lessonId}:teaching` : undefined;
  return <div data-teaching={lessonId} className="min-w-0 break-words">
    <Card aria-label="Lesson reading">
      <h3>Read this first</h3>
      <p className="text-sm text-fg-2">Short session: read, try, then compare. Continue with the assigned material when you have time.</p>
      <p className="leading-relaxed"><Prose text={lesson.explanation} voice={voice && `${voice}:explanation`} /></p>
      <h4>Worked example</h4><p className="leading-relaxed"><Prose text={lesson.example} voice={voice && `${voice}:example`} /></p>
      <h4>Try it</h4><p className="leading-relaxed" data-teaching-practice=""><Prose text={lesson.practice} voice={revealed && voice ? `${voice}:practice` : undefined} /></p>
      <Button aria-expanded={revealed} aria-controls={solutionId} onClick={() => setRevealed(v => !v)}>{revealed ? 'Hide explained answer' : 'Reveal explained answer'}</Button>
      {revealed && <div id={solutionId} data-teaching-solution="" className="mt-4 rounded-tile border border-outline p-4"><h4>Explained answer</h4><p className="leading-relaxed mb-0"><Prose text={lesson.solution} voice={voice && `${voice}:solution`} /></p></div>}
      {voice && <MixedVoiceLabel texts={[lesson.explanation, lesson.example, ...(revealed ? [lesson.practice, lesson.solution] : [])]} />}
    </Card>
    <Card aria-label="Assigned learning material"><h3>Read, watch and explore next</h3>
      <p className="text-sm text-fg-2">Start with the first assignment. A long lecture or chapter can span several sessions.</p>
      <ol className="list-decimal pl-5 grid gap-5">{lesson.resources.map(a => { const s = book!.sources[a.sourceId]; return <li key={a.sourceId} data-teaching-resource="">
        <p className="text-xs uppercase tracking-wide text-fg-2 mb-1">{s.kind === 'watch' ? 'Watch / listen' : s.kind}</p>
        <ExternalLink href={s.url}><Mixed text={s.title} /></ExternalLink>
        <p className="mt-2 mb-1"><Prose text={a.instruction} /></p>
        <p className="text-xs text-fg-2 m-0">{s.access}</p>
      </li>; })}</ol>
      <details className="mt-3"><summary className="cursor-pointer min-h-11 py-2 text-primary">About these resources</summary><p className="text-sm text-fg-2">Pages and topics checked on 16 October 2026. Videos play on their provider’s site; playback was not tested. If a player is unavailable, use its reading or transcript for a reading task and return to listening later. Reading a transcript does not establish unaided listening.</p></details>
    </Card>
  </div>;
}
