import { Minus, Play, Plus } from 'lucide-react';
import { Button } from '../components/Button';
import { suggestLength } from '../data/study/sessions';
import type { MyDayData, StudyCourse, StudyTask } from '../data/types';
import { startLearning } from './actions';

// Choosing a session length and starting: your choice this visit, or the suggestion (energy, free time). Used on
// Study's home and on each topic's page.
export function StartBlock({ data, course, task, lengths, setLength }: {
  data: MyDayData; course: StudyCourse; task: StudyTask | null; lengths: Record<string, number>; setLength: (key: string, m: number) => void;
}) {
  const base = task ? task.minutes : course.minutes;
  const sug = suggestLength(data, base), key = task ? task.id : course.id, m = lengths[key] || sug.minutes;
  return (
    <>
      <div className="st-len flex items-center justify-center gap-4 mt-3.5 mb-1.5" role="group" aria-label="Session length">
        <button type="button" className="size-12 rounded-full grid place-items-center bg-surface-2 border border-outline cursor-pointer disabled:opacity-40" data-action="s-len" data-d="-5" aria-label="5 minutes shorter" disabled={m <= 5} onClick={() => setLength(key, Math.max(5, m - 5))}><Minus size={20} aria-hidden="true" /></button>
        <span className="text-lg min-w-[4.5em] text-center"><strong id="stLen" className="text-[26px] tabular-nums">{m}</strong> min</span>
        <button type="button" className="size-12 rounded-full grid place-items-center bg-surface-2 border border-outline cursor-pointer disabled:opacity-40" data-action="s-len" data-d="5" aria-label="5 minutes longer" disabled={m >= 240} onClick={() => setLength(key, Math.min(240, m + 5))}><Plus size={20} aria-hidden="true" /></button>
      </div>
      <p className="text-[15px] text-fg-2 text-center mb-2.5">{lengths[key] ? 'Your choice.' : sug.why.length ? `Suggested: ${sug.why.join(' · ')}.` : `The ${task ? 'task' : 'course'}'s usual length.`} Change it if you like.</p>
      <div className="grid gap-2.5">
        <Button variant="primary" data-action="s-start" onClick={() => startLearning(course.id, task ? task.id : null, m, false)}><Play size={18} aria-hidden="true" /> Start learning · {m} min</Button>
        {m > 15 && <Button data-action="s-start" data-short="1" onClick={() => startLearning(course.id, task ? task.id : null, 15, true)}>Just 15 minutes</Button>}
      </div>
    </>
  );
}
