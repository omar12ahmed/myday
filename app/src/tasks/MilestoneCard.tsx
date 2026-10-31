import { Card } from '../components/Card';
import { Field, Select } from '../components/Field';
import { projectById } from '../data/projects';
import { update } from '../data/storage';
import { setMilestone } from '../data/tasks';
import { toast } from '../data/toast';
import type { MyDayData, TaskItem } from '../data/types';

// "Toward a milestone" (specs/projects-evidence-decisions.md): a project's task can count toward one of its
// milestones, which then shows "3 of 5 tasks done" and, once reached, what got you there. Shown when its project has
// milestones; a milestone removed reads as none.
export function MilestoneCard({ data, t }: { data: MyDayData; t: TaskItem }) {
  const p = projectById(data, t.projectId), list = p?.milestones ?? [];
  if (!p || !list.length) return null;
  const current = t.milestoneId && list.some(m => m.id === t.milestoneId) ? t.milestoneId : '';
  function pick(id: string) {
    if (update(d => (setMilestone(d, t.id, id || null) ? undefined : false))) toast(id ? 'It counts toward that milestone now.' : 'Toward no milestone now.');
  }
  return (
    <Card aria-labelledby="taskMsH" id="taskMilestone">
      <h3 id="taskMsH" className="m-0">Toward a milestone</h3>
      <Field label="Milestone" htmlFor="tMilestone" className="mt-3">
        <Select id="tMilestone" className="!w-auto max-w-full" value={current} onChange={e => pick(e.target.value)}>
          <option value="">None</option>
          {list.map(m => <option key={m.id} value={m.id}>{m.title}{m.reachedOn ? ' (reached)' : ''}</option>)}
        </Select>
      </Field>
    </Card>
  );
}
