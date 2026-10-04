import { Check } from 'lucide-react';
import { Field, Select } from '../components/Field';
import { STAGES } from '../data/projects';
import type { MyDayData, ProjectStage } from '../data/types';

// Where a project is on MyDay's progression (capture → understand → organise → explore → decide → act → reflect).
//   compact – seven short bars, for a project's card (the steps passed are filled, the current one strongest)
//   full    – seven steps you can tap to move the project, with what the current step means underneath
// Each step is a full 44 px tap target even on a narrow phone (the row uses some of the card's padding there; the dot
// inside is smaller).
export function Progression({ stage, onPick, compact = false }: { stage: ProjectStage; onPick?: (s: ProjectStage) => void; compact?: boolean }) {
  const at = STAGES.findIndex(s => s.id === stage), now = STAGES[at];
  if (compact) {
    return (
      <span className="flex items-center gap-1" role="img" aria-label={`Stage: ${now.label} (${at + 1} of ${STAGES.length})`} data-s="progression-mini">
        {STAGES.map((s, i) => <span key={s.id} className={`h-1.5 flex-1 rounded-full ${i < at ? 'bg-primary-outline' : i === at ? 'bg-primary' : 'bg-track'}`} />)}
      </span>
    );
  }
  return (
    <div className="progression" data-stage={stage}>
      <ol className="relative flex list-none p-0 m-0 -mx-3 sm:mx-0" aria-label="Where this project is">
        <span aria-hidden="true" className="absolute left-[7%] right-[7%] top-[22px] h-0.5 -translate-y-1/2 bg-outline" />
        {STAGES.map((s, i) => (
          <li key={s.id} className="relative flex-1 min-w-0">
            <button type="button" className="w-full h-11 grid place-items-center bg-transparent border-0 p-0 cursor-pointer disabled:cursor-default" aria-label={s.label}
              aria-current={i === at ? 'step' : undefined} data-s="stage" data-id={s.id} disabled={!onPick} onClick={() => onPick?.(s.id)}>
              <span className={`grid place-items-center rounded-full font-bold tabular-nums transition-[background-color,transform] duration-150 ${i === at
                ? 'size-9 text-[14px] bg-linear-to-b from-primary to-primary-2 text-on-primary shadow-cta'
                : i < at ? 'size-7 text-[12px] bg-primary-container text-on-primary-container' : 'size-7 text-[12px] bg-surface-2 text-fg-3 border border-outline'}`}>
                {i < at ? <Check size={14} aria-hidden="true" /> : i + 1}
              </span>
            </button>
            <span aria-hidden="true" className={`hidden sm:block text-center text-xs mt-0.5 truncate ${i === at ? 'text-primary font-bold' : 'text-fg-3'}`}>{s.label}</span>
          </li>
        ))}
      </ol>
      <p className="m-0 mt-2 text-[15px] text-center" data-s="stage-now"><strong className="text-primary">{now.label}</strong> <span className="text-fg-2">— {now.hint}</span></p>
    </div>
  );
}

// Which project a note or task belongs to. Hidden while there are no projects to choose (and it isn't in one).
export function ProjectPicker({ data, id, value, onPick }: { data: MyDayData; id: string; value: string | undefined; onPick: (projectId: string | null) => void }) {
  const known = !!value && data.projects.items.some(p => p.id === value);
  const list = data.projects.items.filter(p => p.status !== 'done' || p.id === value);
  if (!list.length && !known) return null;
  return (
    <Field label="Project" htmlFor={id}>
      <Select id={id} value={known ? value : ''} onChange={e => onPick(e.target.value || null)} data-s="project-pick">
        <option value="">No project</option>
        {list.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
      </Select>
    </Field>
  );
}
