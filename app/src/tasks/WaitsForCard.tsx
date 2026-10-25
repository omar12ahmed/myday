import { useState } from 'react';
import { Card } from '../components/Card';
import { LinkButton } from '../components/parts';
import { projectById } from '../data/projects';
import { update } from '../data/storage';
import { isDone, setWaitsFor, TASK_LIMITS, waitChoices, waitsFor } from '../data/tasks';
import { toast } from '../data/toast';
import type { MyDayData, TaskItem } from '../data/types';

// "Waits for" (specs/projects-steps.md): the tasks of its project this one can't start before. Until they're done (or
// let go) MyDay doesn't pick it as the project's next step, and it says so where it's listed; you can still do it any
// time. Only the project's other tasks still to do are offered, never one that waits for this one (no circles). The
// rules are in data/tasks.ts; saved and synced with the task, and not sent to AI.
export function WaitsForCard({ data, t }: { data: MyDayData; t: TaskItem }) {
  const [choosing, setChoosing] = useState(false);
  const project = projectById(data, t.projectId);
  if (!project || isDone(data, t) || t.letGoOn) return null;
  const now = waitsFor(data, t), choices = waitChoices(data, t), chosen = new Set(t.after ?? []);
  if (!now.length && !choices.length) return null; // nothing else in the project it could wait for
  function toggle(id: string, on: boolean) {
    const out: { r: boolean | 'full' } = { r: false };
    update(d => { out.r = setWaitsFor(d, t.id, id, on); if (out.r !== true) return false; });
    if (out.r === 'full') toast(`A task can wait for ${TASK_LIMITS.after} others at most.`);
  }
  return (
    <Card aria-labelledby="waitsfor-h" id="taskWaitsFor">
      <div className="flex flex-wrap justify-between items-baseline gap-x-3">
        <h3 id="waitsfor-h" className="m-0">Waits for</h3>
        {choices.length > 0 && <LinkButton className="text-[15px]" aria-expanded={choosing} data-action="waitsfor-choose" onClick={() => setChoosing(!choosing)}>{choosing ? 'Done' : now.length ? 'Change' : 'Choose tasks'}</LinkButton>}
      </div>
      <p className="text-[15px] m-0 mt-1 break-words" data-s="waitsfor-line">{now.length ? `It waits for ${now.map(x => `“${x.title}”`).join(', ')}.` : 'Nothing: it can start any time.'}</p>
      <p className="text-sm text-fg-2 m-0 mt-1">{now.length ? 'Until then MyDay doesn’t pick it as the project’s next step. You can still do it any time.'
        : `If it can’t start before another task of ${project.title}, choose that task here.`}</p>
      {choosing && (
        <fieldset className="border-0 p-0 m-0 mt-2 grid" data-s="waitsfor-choices">
          <legend className="sr-only">Tasks of {project.title} it waits for</legend>
          {choices.map(c => (
            <label key={c.id} className="flex items-start gap-3 min-h-11 py-2.5 cursor-pointer border-t border-outline first:border-t-0">
              <input type="checkbox" className="size-[22px] accent-done m-0 mt-px flex-none cursor-pointer" data-s="waitsfor-choice" data-id={c.id} checked={chosen.has(c.id)} onChange={e => toggle(c.id, e.target.checked)} />
              <span className="min-w-0 break-words leading-snug">{c.title}</span>
            </label>
          ))}
        </fieldset>
      )}
    </Card>
  );
}
