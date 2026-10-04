import { FolderKanban, ListTodo } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CategoryChip } from '../components/CategoryChip';
import { stepsForToday } from '../data/projects';
import { update } from '../data/storage';
import { addToTodaysPlan, isDone, planRoom } from '../data/tasks';
import { toast } from '../data/toast';
import type { DateKey, MyDayData } from '../data/types';
import { dueText } from '../tasks/route';

// "From your projects": each active project's one next step (not already on today's plan or due today — those are
// under Due today). One tap adds it to today's plan while there's room for your energy — the same rule as Due today.
// Nothing is added by itself.
export function ProjectStepsCard({ data, k }: { data: MyDayData; k: DateKey }) {
  const steps = stepsForToday(data, k);
  if (!steps.length) return null;
  const room = planRoom(data, k);
  function plan(id: string) {
    let r = '';
    update(d => { r = addToTodaysPlan(d, id, k); if (r !== 'added') return false; });
    toast(r === 'added' ? "Added to today's plan." : r === 'full' ? "Today's plan is full for your energy." : 'Build your day first.');
  }
  return (
    <Card aria-labelledby="steps-h" id="projectSteps">
      <h3 id="steps-h" className="flex items-center gap-2"><FolderKanban size={18} aria-hidden="true" className="text-primary" /> From your projects</h3>
      <ul className="list-none p-0 m-0">
        {steps.map(({ project, task }) => (
          <li key={task.id} className="flex items-center gap-2 border-t border-outline first:border-t-0 py-2" data-id={task.id} data-s="project-step">
            <a href={`#projects/p/${project.id}`} className="flex-1 min-w-0 min-h-11 py-1 text-fg no-underline">
              <span className="block text-xs font-bold tracking-[.06em] uppercase text-fg-3 truncate">{project.title}</span>
              <span className="block font-medium leading-snug break-words">{task.title}</span>
              <span className="flex flex-wrap items-center gap-2 mt-0.5 text-sm text-fg-3 tabular-nums">
                {task.due && <span>{dueText(task, k)}</span>}<span>{task.minutes} min</span><CategoryChip kind={task.category} />
              </span>
            </a>
            {room.built && room.room > 0 && <Button inline data-action="step-plan" data-id={task.id} onClick={() => plan(task.id)}>Add to plan</Button>}
          </li>
        ))}
      </ul>
      {(!room.built || room.room <= 0) && (
        <p className="text-sm text-fg-2 m-0 mt-2" data-s="steps-note">
          {!room.built ? 'Build your day, then add any of these to it.' : room.rest ? "It's a rest day — these will keep." : "Today's plan is full for your energy — these will keep."}
        </p>
      )}
    </Card>
  );
}

// "Your tasks": one line to every one-off task (Tasks moved here from the Inbox in 1.12.0), always there — even on a day
// with nothing due.
export function TasksLink({ data }: { data: MyDayData }) {
  const open = data.tasks.items.filter(t => !isDone(data, t) && !t.letGoOn).length;
  return (
    <Card id="tasksLink" className="!py-1.5">
      <a href="#today/tasks" className="flex items-center gap-2.5 min-h-11 text-fg no-underline font-medium" data-action="tasks-open">
        <ListTodo size={20} aria-hidden="true" className="text-primary flex-none" />
        <span className="flex-1">Your tasks</span>
        <span className="text-fg-2 text-[15px] tabular-nums whitespace-nowrap">{open ? `${open} to do` : 'All done'} <span className="text-primary font-semibold">›</span></span>
      </a>
    </Card>
  );
}
