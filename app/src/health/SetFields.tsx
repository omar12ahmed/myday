import type { ReactNode } from 'react';
import { CommitInput, LiveInput, Select } from '../components/Field';
import type { ExType, SetValues } from '../data/types';
import { numIn } from '../data/util';
import { LOAD_LABEL, LOAD_MODES, n1 } from '../data/workout/common';
import { fieldLabel, fieldsFor, LIMIT, STEP, type Field } from './fields';

// The number boxes for one set, with their units in the labels. The same fields are used for planned
// values (in a template) and for what you actually did (in a session), but they're saved separately.
//   strength: Reps, kg · bodyweight: Reps, Load (bodyweight / + added / assisted) and kg · cardio: Min, km

// Each box shares the row; on bodyweight exercises the Load choice gets the room it needs to show
// "Bodyweight" / "Assisted" in full, and Reps stays compact.
const SIZE: Partial<Record<string, string>> = { loadMode: 'flex-[1_1_8rem] min-w-[8rem]' };
const Box = ({ label, field, compact = false, children }: { label: string; field: string; compact?: boolean; children: ReactNode }) => (
  <label className={`set-field grid gap-0.5 ${SIZE[field] ?? (compact ? 'flex-[0_0_4rem] min-w-0' : 'flex-[1_1_72px] min-w-16')}`}><span className="lbl text-xs text-fg-2">{label}</span>{children}</label>
);
const NUM = '!min-h-12 !px-2 tabular-nums';

// A set's results during (or after) a workout: saved as you type, so leaving mid-way loses nothing.
export function ResultFields({ type, set, attrs, label, onSave }: {
  type: ExType; set: SetValues; attrs: (field: keyof SetValues) => Record<string, string | number>; label: string;
  onSave: (field: keyof SetValues, value: string) => void;
}) {
  return (
    <div className="set-fields flex flex-wrap gap-2 min-w-0">
      {fieldsFor(type, set.loadMode).map(f => f === 'loadMode' ? (
        <Box key={f} field={f} label="Load">
          <Select {...attrs(f)} className={`${NUM} !text-[15px]`} aria-label={`${label} load type`} value={set.loadMode} onChange={e => onSave('loadMode', e.target.value)}>
            {LOAD_MODES.map(m => <option key={m} value={m}>{LOAD_LABEL[m]}</option>)}
          </Select>
        </Box>
      ) : (
        <Box key={f} field={f} compact={type === 'bodyweight' && f === 'reps'} label={fieldLabel(f, set.loadMode)}>
          <LiveInput {...attrs(f)} type="number" inputMode="decimal" min={0} step={STEP[f]} className={NUM} aria-label={`${label} ${fieldLabel(f, set.loadMode)}`}
            value={n1(set[f] as number | null)} asSaved={t => n1(numIn(t, 0, LIMIT[f] ?? 1000, null))} onSave={v => onSave(f, v)} />
        </Box>
      ))}
    </div>
  );
}

// A template's planned values: saved when you finish with each box.
export function PlanFields({ type, item, attrs, label, onSave }: {
  type: ExType; item: SetValues & { sets: number; restSec: number }; attrs: (field: Field) => Record<string, string | number>; label: string;
  onSave: (field: Field, value: string, el?: HTMLInputElement) => void;
}) {
  const num = (f: Field, extra: { min?: number; max?: number } = {}) => (
    <Box key={f} field={f} compact={type === 'bodyweight' && (f === 'reps' || f === 'sets')} label={fieldLabel(f, item.loadMode)}>
      <CommitInput key={String(item[f as keyof typeof item])} {...attrs(f)} type="number" inputMode="decimal" min={extra.min ?? 0} max={extra.max} step={STEP[f]} className={NUM}
        aria-label={`${label} ${fieldLabel(f, item.loadMode)}`} defaultValue={n1(item[f as keyof typeof item] as number | null)} onCommit={el => onSave(f, el.value, el)} />
    </Box>
  );
  return (
    <div className="set-fields flex flex-wrap gap-2 min-w-0">
      {num('sets', { min: 1, max: 20 })}
      {fieldsFor(type, item.loadMode).map(f => f === 'loadMode' ? (
        <Box key={f} field={f} label="Load">
          <Select {...attrs(f)} className={`${NUM} !text-[15px]`} aria-label={`${label} load type`} value={item.loadMode} onChange={e => onSave('loadMode', e.target.value)}>
            {LOAD_MODES.map(m => <option key={m} value={m}>{LOAD_LABEL[m]}</option>)}
          </Select>
        </Box>
      ) : num(f))}
      {num('restSec', { max: 900 })}
    </div>
  );
}
