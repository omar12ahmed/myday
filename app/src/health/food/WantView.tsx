import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { BackLink, Eyebrow, Meta, Note } from '../../components/parts';
import { getRecipe } from '../../data/food/mealdb';
import { scaledMeasure } from '../../data/food/quantities';
import type { MyDayData } from '../../data/types';
import { addWanted, wantDraft, wantHave, wantServings } from './actions';
import { RecipeView } from './RecipeView';
import { useFoodVisit } from './visit';

// Want to cook: 1 · choose servings, 2 · tick what you already have, 3 · add the rest to your shopping list.
export function WantView({ data, id }: { data: MyDayData; id: string }) {
  useFoodVisit();
  const r = getRecipe(data.health.food, id);
  if (!r) return <RecipeView data={data} id={id} />;
  const draft = wantDraft(r);
  const factor = r.servings && draft.servings ? draft.servings / r.servings : 1;
  const need = r.ingredients.filter((_, i) => !draft.have.includes(i)).length;
  return (
    <Card aria-labelledby="want-h">
      <BackLink to={`health/food/recipe/${encodeURIComponent(id)}`} label={r.title} />
      <Eyebrow>Want to cook</Eyebrow>
      <h2 id="want-h">{r.title}</h2>
      <h3 className="mt-4">1 · Servings</h3>
      {r.servings && draft.servings ? (
        <div className="serv-stepper flex items-center gap-3.5 mt-1.5 mb-2.5" role="group" aria-label="Servings">
          <button type="button" className="size-12 rounded-full grid place-items-center bg-surface-2 border border-outline cursor-pointer disabled:opacity-40" data-action="h-want-serv" data-d="-1" aria-label="Fewer servings" disabled={draft.servings <= 1} onClick={() => wantServings(-1)}><Minus size={20} aria-hidden="true" /></button>
          <span className="text-lg"><strong className="text-[22px] tabular-nums">{draft.servings}</strong> serving{draft.servings === 1 ? '' : 's'}</span>
          <button type="button" className="size-12 rounded-full grid place-items-center bg-surface-2 border border-outline cursor-pointer disabled:opacity-40" data-action="h-want-serv" data-d="1" aria-label="More servings" disabled={draft.servings >= 100} onClick={() => wantServings(1)}><Plus size={20} aria-hidden="true" /></button>
        </div>
      ) : <Note>Servings aren't listed, so quantities stay as written.</Note>}
      <h3 className="mt-4">2 · Tick what you already have</h3>
      <ul className="have-list list-none p-0 mt-1.5 mb-0">
        {r.ingredients.map((ing, i) => (
          <li key={i} className="border-t border-outline first:border-t-0">
            <label className="check flex items-center gap-3 min-h-[52px] cursor-pointer">
              <input type="checkbox" data-h="want-have" data-i={i} className="size-[24px] accent-primary flex-none" checked={draft.have.includes(i)} onChange={e => wantHave(i, e.target.checked)} />
              <span><strong>{ing.name}</strong> <Meta>{scaledMeasure(ing.measure, factor).text}</Meta></span>
            </label>
          </li>
        ))}
      </ul>
      <h3 className="mt-4">3 · Add the rest to your list</h3>
      <Note>Items combine with what's already on your list only when they're the same thing in compatible units. Anything else is kept as written, so you can edit it.</Note>
      <Button variant="primary" data-action="h-want-add" onClick={() => addWanted(draft)}><ShoppingCart size={18} aria-hidden="true" /> {need ? `Add ${need} item${need === 1 ? '' : 's'} to my shopping list` : 'Save — I have everything'}</Button>
    </Card>
  );
}
