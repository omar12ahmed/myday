import { useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field, Select, TextArea, TextInput } from '../../components/Field';
import { BackLink, Summary, TextLink } from '../../components/parts';
import type { MyDayData } from '../../data/types';
import { n1 } from '../../data/workout/common';
import { saveOwnRecipe, type RecipeFormValues } from './actions';

// Adding (or editing) your own recipe. Everything except the name is optional; nutrition is only ever
// your own figures, and is labelled that way.
export function RecipeForm({ data, id }: { data: MyDayData; id: string | null }) {
  const form = useRef<HTMLFormElement>(null);
  const [error, setError] = useState('');
  const r = id ? data.health.food.recipes[id] : null;
  if (id && (!r || r.source !== 'manual')) return <Card><h2>Recipe not found</h2><TextLink href="#health/food">Back</TextLink></Card>;
  const nut = r && r.nutrition;
  const val = (k: string) => ((form.current?.elements.namedItem(k) as HTMLInputElement | null)?.value || '');
  function save() {
    const v: RecipeFormValues = {
      title: val('rfTitle'), servings: val('rfServ'), effort: val('rfEffort'), prep: val('rfPrep'), cook: val('rfCook'),
      batch: !!(form.current?.elements.namedItem('rfBatch') as HTMLInputElement | null)?.checked,
      ingredients: val('rfIng'), method: val('rfMethod'), kcal: val('rfKcal'), protein: val('rfPro'), carbs: val('rfCarb'), fat: val('rfFat'), sourceName: val('rfSrc'), sourceUrl: val('rfUrl'),
    };
    setError(saveOwnRecipe(id, v) || '');
  }
  const num = (name: string, label: string, value: number | null | undefined, extra: { step?: string; max?: number } = {}) => (
    <Field label={label} htmlFor={name} className="min-w-0"><TextInput id={name} name={name} type="number" inputMode={extra.step ? 'decimal' : 'numeric'} min={0} max={extra.max} defaultValue={value === null || value === undefined ? '' : n1(value)} /></Field>
  );
  return (
    <Card aria-labelledby="rf-h">
      <BackLink to="health/food" label="Food" />
      <h2 id="rf-h">{r ? 'Edit recipe' : 'Add your own recipe'}</h2>
      <form ref={form} className="grid gap-3.5" onSubmit={e => { e.preventDefault(); save(); }}>
        <Field label="Name" htmlFor="rfTitle"><TextInput id="rfTitle" name="rfTitle" type="text" maxLength={120} defaultValue={r ? r.title : ''} /></Field>
        <div className="field-row grid grid-cols-2 gap-3">
          {num('rfServ', 'Serves (optional)', r && r.servings, { max: 100 })}
          <Field label="Effort (optional)" htmlFor="rfEffort" className="min-w-0">
            <Select id="rfEffort" name="rfEffort" defaultValue={r && r.effort ? r.effort : ''}>
              {['', 'easy', 'medium', 'hard'].map(e => <option key={e} value={e}>{e ? e[0].toUpperCase() + e.slice(1) : 'Not set'}</option>)}
            </Select>
          </Field>
        </div>
        <div className="field-row grid grid-cols-2 gap-3">
          {num('rfPrep', 'Prep minutes (optional)', r && r.prepMin)}
          {num('rfCook', 'Cooking minutes (optional)', r && r.cookMin)}
        </div>
        <label className="check flex items-center gap-2.5 min-h-11 text-[15px] cursor-pointer">
          <input id="rfBatch" name="rfBatch" type="checkbox" className="size-[22px] accent-primary flex-none" defaultChecked={!!(r && r.batch)} /> Good for batch cooking
        </label>
        <Field label={'Ingredients — one per line, e.g. "200 g pasta"'} htmlFor="rfIng"><TextArea id="rfIng" name="rfIng" rows={7} defaultValue={r ? r.ingredients.map(i => [i.measure, i.name].filter(Boolean).join(' ')).join('\n') : ''} /></Field>
        <Field label="Method — one step per line" htmlFor="rfMethod"><TextArea id="rfMethod" name="rfMethod" rows={7} defaultValue={r ? r.instructions : ''} /></Field>
        <details className="group" open={!!nut || undefined}>
          <Summary>Nutrition per serving (optional, your own figures)</Summary>
          <div className="grid grid-cols-2 gap-3">
            {num('rfKcal', 'kcal', nut && nut.kcal, { step: 'any' })}{num('rfPro', 'Protein (g)', nut && nut.protein, { step: 'any' })}
            {num('rfCarb', 'Carbs (g)', nut && nut.carbs, { step: 'any' })}{num('rfFat', 'Fat (g)', nut && nut.fat, { step: 'any' })}
          </div>
        </details>
        <div className="field-row grid grid-cols-2 gap-3">
          <Field label="Where it's from (optional)" htmlFor="rfSrc" className="min-w-0"><TextInput id="rfSrc" name="rfSrc" type="text" maxLength={80} defaultValue={r ? r.sourceName : ''} /></Field>
          <Field label="Link (optional)" htmlFor="rfUrl" className="min-w-0"><TextInput id="rfUrl" name="rfUrl" type="url" maxLength={400} defaultValue={r ? r.sourceUrl : ''} /></Field>
        </div>
        <p className="warn empty:hidden text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2 m-0" id="rfError" role="alert">{error}</p>
        <div className="row2 grid grid-cols-2 gap-2.5">
          <Button type="submit" variant="primary" data-action="h-recipe-save" data-id={id || ''}>Save recipe</Button>
          <a className="btn inline-flex items-center justify-center min-h-tap rounded-btn border border-outline text-fg-2 font-[550]" href="#health/food">Cancel</a>
        </div>
      </form>
    </Card>
  );
}
