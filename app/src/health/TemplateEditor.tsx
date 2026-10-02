import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CommitInput, Field, LiveInput, Select, TextInput } from '../components/Field';
import { BackLink, Chip, InlineLink, Note, Summary, TextLink } from '../components/parts';
import type { ExType, MyDayData } from '../data/types';
import { COMMON_EXERCISES, EX_TYPE_HINT, EX_TYPE_LABEL, EX_TYPES } from '../data/workout/common';
import { exById, tplById } from '../data/workout/plans';
import { focusIfWaiting } from '../study/focus';
import { addCommon, addItem, createExercise, moveItem, removeItem, setItemField, setTemplateMinutes, setTemplateName, toggleArchiveTemplate } from './actions';
import { PlanFields } from './SetFields';

// Editing a workout template: its name, length and exercises with their planned values.
// This changes the workout for next time only — every past workout keeps exactly what you did, and one
// planned date is changed in Schedule instead.
export function TemplateEditor({ data, id }: { data: MyDayData; id: string }) {
  const addRef = useRef<HTMLSelectElement>(null), nameRef = useRef<HTMLInputElement>(null), typeRef = useRef<HTMLSelectElement>(null);
  const [error, setError] = useState('');
  const w = data.health.workout, t = tplById(w, id);
  if (!t) return <Card><h2>Workout not found</h2><TextLink href="#health/workout">Back</TextLink></Card>;
  const usable = w.exercises.filter(e => !e.archived), used = new Set(t.items.map(i => i.exerciseId));
  const addable = usable.filter(e => !used.has(e.id));
  const common = COMMON_EXERCISES.filter(c => !w.exercises.some(e => e.name.toLowerCase() === c.name.toLowerCase()));

  function create() {
    const msg = createExercise(t!.id, nameRef.current?.value || '', typeRef.current?.value || 'strength');
    setError(msg || '');
    if (!msg && nameRef.current) nameRef.current.value = '';
  }

  return (
    <>
      <Card aria-labelledby="tpl-h">
        <BackLink to="health/workout" label="Workout" />
        <h2 id="tpl-h">Edit workout</h2>
        <Note>Changes save automatically and apply from your next session. Past workouts keep exactly what you did. To change one planned date instead, use <InlineLink href="#health/workout/schedule">Schedule</InlineLink>.</Note>
        <div className="grid gap-3.5">
          <Field label="Name" htmlFor="tplName">
            <LiveInput id="tplName" type="text" maxLength={80} data-h="tpl-name" data-tpl={t.id} value={t.name}
              ref={focusIfWaiting('tplName:' + t.id)} asSaved={x => x.trim().slice(0, 80) || t.name} onSave={x => setTemplateName(t.id, x)} />
          </Field>
          <Field label="Usual length (minutes)" htmlFor="tplMin">
            <CommitInput key={t.minutes} id="tplMin" type="number" inputMode="numeric" min={5} max={300} data-h="tpl-minutes" data-tpl={t.id} defaultValue={t.minutes} onCommit={el => setTemplateMinutes(t.id, el)} />
          </Field>
        </div>
      </Card>
      <Card aria-labelledby="tpl-ex-h">
        <h2 id="tpl-ex-h">Exercises</h2>
        {t.items.length ? t.items.map((it, i) => {
          const ex = exById(w, it.exerciseId);
          if (!ex) return null;
          return (
            <div key={it.id} className="tpl-item py-3 border-t border-outline first:border-t-0">
              <div className="card-head flex justify-between items-center gap-2 mb-1.5">
                <div className="min-w-0"><strong>{ex.name}</strong> <Chip>{EX_TYPE_LABEL[ex.type]}</Chip></div>
                <div className="c-actions flex gap-1 flex-none">
                  <Button inline variant="ghost" className="!px-0 !w-11" data-action="h-item-move" data-tpl={t.id} data-item={it.id} data-dir="-1" aria-label={`Move ${ex.name} up`} disabled={i === 0} onClick={() => moveItem(t.id, it.id, -1)}><ArrowUp size={18} aria-hidden="true" /></Button>
                  <Button inline variant="ghost" className="!px-0 !w-11" data-action="h-item-move" data-tpl={t.id} data-item={it.id} data-dir="1" aria-label={`Move ${ex.name} down`} disabled={i === t.items.length - 1} onClick={() => moveItem(t.id, it.id, 1)}><ArrowDown size={18} aria-hidden="true" /></Button>
                  <Button inline variant="ghost" className="!px-0 !w-11" data-action="h-item-remove" data-tpl={t.id} data-item={it.id} aria-label={`Remove ${ex.name}`} onClick={() => removeItem(t.id, it.id)}><X size={18} aria-hidden="true" /></Button>
                </div>
              </div>
              <PlanFields type={ex.type} item={it} label={ex.name}
                attrs={f => ({ 'data-h': 'tpl-item', 'data-tpl': t.id, 'data-item': it.id, 'data-field': f })}
                onSave={(f, v, el) => setItemField(t.id, it.id, f, v, el)} />
            </div>
          );
        }) : <Note>No exercises yet — add one below.</Note>}
        <h4>Add an exercise</h4>
        {addable.length > 0 && (
          <div className="inline-add flex gap-2 items-center">
            <Select ref={addRef} id="tplAddEx" aria-label="Exercise to add" className="flex-1 min-w-0">
              {addable.map(e => <option key={e.id} value={e.id}>{e.name} ({EX_TYPE_LABEL[e.type]})</option>)}
            </Select>
            <Button inline className="flex-none" data-action="h-item-add" data-tpl={t.id} onClick={() => addRef.current && addItem(t.id, addRef.current.value)}>Add</Button>
          </div>
        )}
        <details className="group mt-2" open={!usable.length || undefined}>
          <Summary>Create a new exercise</Summary>
          <div className="grid gap-3">
            <Field label="Name" htmlFor="newExName"><TextInput ref={nameRef} id="newExName" type="text" maxLength={80} placeholder="e.g. Kettlebell swings" /></Field>
            <Field label="How you track it" htmlFor="newExType">
              <Select ref={typeRef} id="newExType" defaultValue="strength">
                {EX_TYPES.map(x => <option key={x} value={x}>{EX_TYPE_LABEL[x]} — {EX_TYPE_HINT[x]}</option>)}
              </Select>
            </Field>
            <p id="newExError" role="alert" className="warn text-[15px] text-on-warn-c empty:hidden bg-warn-c rounded-tile px-3 py-2 m-0">{error}</p>
            <div><Button inline data-action="h-ex-create" data-tpl={t.id} onClick={create}><Plus size={16} aria-hidden="true" /> Create and add</Button></div>
          </div>
          {common.length > 0 && (
            <>
              <p className="lbl text-sm text-fg-2 mt-3 mb-1.5">Or quick-add a common one</p>
              <div className="chip-row flex flex-wrap gap-2">
                {common.map(c => <Button key={c.name} inline data-action="h-ex-common" data-tpl={t.id} data-name={c.name} data-type={c.type} onClick={() => addCommon(t.id, c.name, c.type as ExType)}>{c.name}</Button>)}
              </div>
            </>
          )}
        </details>
      </Card>
      <Card>
        <Button variant="ghost" data-action="h-tpl-archive" data-tpl={t.id} onClick={() => toggleArchiveTemplate(t.id)}>{t.archived ? 'Restore this workout' : 'Archive this workout'}</Button>
        <Note className="mt-2 mb-0">Archiving hides it from your lists and schedule. Its history stays.</Note>
      </Card>
    </>
  );
}
