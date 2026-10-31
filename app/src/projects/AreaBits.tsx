import { CommitInput, Field } from '../components/Field';
import { areaOfProject, areasOf, areaVar, setArea, type AreaColour } from '../data/areas';
import { PROJECT_LIMITS } from '../data/projects';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData, Project } from '../data/types';

// Areas on screen (specs/projects-areas-archive.md): a soft colour dot always beside the area's name — never colour
// alone. The rules are in data/areas.ts.
export const AreaDot = ({ colour }: { colour: AreaColour }) => <span aria-hidden="true" className="inline-block flex-none size-2.5 rounded-full" style={{ background: areaVar(colour) }} />;
export function AreaLabel({ name, colour, className = '' }: { name: string; colour: AreaColour; className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`} data-s="area-label"><AreaDot colour={colour} /><span className="break-words">{name}</span></span>;
}
// A project's area, shown where it has one.
export function ProjectArea({ data, p, className }: { data: MyDayData; p: Project; className?: string }) {
  const a = areaOfProject(data, p);
  return a ? <AreaLabel name={a.name} colour={a.colour} className={className} /> : null;
}
// Choosing it (About it → Edit): type a name, or pick one already used; empty is none.
export function AreaField({ data, p }: { data: MyDayData; p: Project }) {
  const areas = areasOf(data);
  function commit(el: HTMLInputElement) {
    let made = '';
    if (update(d => { if (!setArea(d, p.id, el.value || null)) return false; made = d.projects.items.find(x => x.id === p.id)?.area ?? ''; })) toast(made ? `In “${made}” now.` : 'No area now.');
  }
  return (
    <Field label="Area (optional)" htmlFor="projectArea">
      <CommitInput id="projectArea" key={p.area ?? ''} defaultValue={p.area ?? ''} list="projectAreas" maxLength={PROJECT_LIMITS.area} placeholder="e.g. Home, Work, Study" autoComplete="off" onCommit={commit} />
      <datalist id="projectAreas">{areas.map(a => <option key={a.name} value={a.name} />)}</datalist>
    </Field>
  );
}
