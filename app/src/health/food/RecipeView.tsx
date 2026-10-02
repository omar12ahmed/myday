import { ChefHat, ListPlus, Minus, Plus, RotateCw, Star } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useConfirm } from '../../components/confirm';
import { Field, TextInput } from '../../components/Field';
import { BackLink, Meta, Note, Summary, TextLink } from '../../components/parts';
import { getRecipe } from '../../data/food/mealdb';
import { scaledMeasure } from '../../data/food/quantities';
import { prefHits, recipeSteps, safeUrl } from '../../data/food/recipes';
import type { MyDayData, Recipe } from '../../data/types';
import { n1 } from '../../data/workout/common';
import { clearNutrition, deleteOwnRecipe, saveNutrition, setBaseServings, stepServings, toggleFavourite } from './actions';
import { startCookingAsked } from './cookStart';
import { Facts } from './RecipeCard';
import { loadRecipe, useFoodVisit } from './visit';

const ext = (href: string, text: string) => <a href={href} target="_blank" rel="noopener" className="text-primary font-semibold">{text}<span className="sr-only"> (opens in a new tab)</span></a>;

// A recipe that isn't saved and hasn't been fetched this visit (e.g. a link from Today): loaded from TheMealDB.
function NotLoaded({ id }: { id: string }) {
  const V = useFoodVisit(), load = V.loads[id], fromMdb = /^mdb-\d+$/.test(id || '');
  useEffect(() => { if (fromMdb && !V.loads[id]) loadRecipe(id); }, [fromMdb, id, V.loads]);
  const failed = load && load.error;
  return (
    <Card>
      <BackLink to="health/food" label="Food" />
      <h2>{failed ? "Couldn't load this recipe" : fromMdb ? 'Loading recipe…' : 'Recipe not found'}</h2>
      {failed && (
        <>
          <p className="warn text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2">{load.error}</p>
          <Button inline data-action="h-recipe-retry" data-id={id} onClick={() => loadRecipe(id)}><RotateCw size={16} aria-hidden="true" /> Try again</Button>
        </>
      )}
    </Card>
  );
}

// Nutrition per serving: only ever your own figures (TheMealDB lists none, and MyDay never estimates).
function NutritionCard({ r }: { r: Recipe }) {
  const refs = { kcal: useRef<HTMLInputElement>(null), protein: useRef<HTMLInputElement>(null), carbs: useRef<HTMLInputElement>(null), fat: useRef<HTMLInputElement>(null) };
  const nut = r.nutrition;
  const box = (k: keyof typeof refs, id: string, label: string) => (
    <Field label={label} htmlFor={id} className="min-w-0"><TextInput ref={refs[k]} id={id} type="number" inputMode="decimal" min={0} defaultValue={nut ? n1(nut[k]) : ''} key={nut ? String(nut[k]) : ''} /></Field>
  );
  const values = () => ({ kcal: refs.kcal.current?.value || '', protein: refs.protein.current?.value || '', carbs: refs.carbs.current?.value || '', fat: refs.fat.current?.value || '' });
  return (
    <Card aria-labelledby="nut-h">
      <h2 id="nut-h">Nutrition per serving</h2>
      {nut ? (
        <>
          <p className="text-[15px] tabular-nums">{[nut.kcal !== null ? `${n1(nut.kcal)} kcal` : '', nut.protein !== null ? `protein ${n1(nut.protein)} g` : '', nut.carbs !== null ? `carbs ${n1(nut.carbs)} g` : '', nut.fat !== null ? `fat ${n1(nut.fat)} g` : ''].filter(Boolean).join(' · ')}</p>
          <Note>Entered by you — not from the recipe source.</Note>
        </>
      ) : <Note>Not available from the source.</Note>}
      <details className="group">
        <Summary>{nut ? 'Change your figures' : 'Add your own figures'}</Summary>
        <div className="grid grid-cols-2 gap-3">{box('kcal', 'nKcal', 'kcal')}{box('protein', 'nPro', 'Protein (g)')}{box('carbs', 'nCarb', 'Carbs (g)')}{box('fat', 'nFat', 'Fat (g)')}</div>
        <div className="row2 flex flex-wrap gap-2.5 mt-3">
          <Button inline data-action="h-nutr-save" data-id={r.id} onClick={() => saveNutrition(r.id, values())}>Save</Button>
          {nut && <Button inline variant="ghost" data-action="h-nutr-clear" data-id={r.id} onClick={() => clearNutrition(r.id)}>Remove</Button>}
        </div>
      </details>
    </Card>
  );
}

export function RecipeView({ data, id }: { data: MyDayData; id: string }) {
  const V = useFoodVisit(), confirm = useConfirm();
  const baseRef = useRef<HTMLInputElement>(null);
  const f = data.health.food, r = getRecipe(f, id);
  if (!r) return <NotLoaded id={id} />;
  const fav = f.favourites.includes(r.id), want = f.want.some(x => x.recipeId === r.id);
  const base = r.servings, cur = base ? V.servings[r.id] || base : null, factor = base && cur ? cur / base : 1;
  const steps = recipeSteps(r.instructions), hits = prefHits(f.prefs, r);
  async function del() {
    if (await confirm({ title: `Delete "${r!.title}"?`, body: 'Your cooking history keeps its name.', confirmLabel: 'Delete it', cancelLabel: 'Keep it' })) deleteOwnRecipe(r!.id);
  }
  return (
    <>
      <Card className="recipe-head" aria-labelledby="rec-h">
        <BackLink to="health/food" label="Food" />
        {r.thumb && <img className="recipe-img w-full max-h-[260px] object-cover rounded-tile mt-1.5 mb-3 block" src={`${r.thumb}/medium`} alt={`Photo of ${r.title}`} loading="lazy" />}
        <h2 id="rec-h">{r.title}</h2>
        <Meta>{[r.category, r.area].concat(r.tags).filter(Boolean).join(' · ')}</Meta>
        <Facts r={r} />
        <div className="action-row grid grid-cols-2 gap-2 mt-3">
          <Button variant={fav ? 'selected' : 'tonal'} className={`!px-2 text-[15px] whitespace-nowrap${fav ? ' on' : ''}`} data-action="h-fav" data-id={r.id} aria-pressed={fav} onClick={() => toggleFavourite(r.id)}>
            <Star size={18} aria-hidden="true" fill={fav ? 'currentColor' : 'none'} /> Favourite
          </Button>
          <a className="btn inline-flex items-center justify-center gap-2 min-h-tap rounded-btn bg-tonal text-on-tonal font-[550] text-center px-2 text-[15px] whitespace-nowrap" href={`#health/food/want/${encodeURIComponent(r.id)}`}>
            <ListPlus size={18} aria-hidden="true" /> {want ? 'Want to cook ✓' : 'Want to cook'}
          </a>
          <Button variant="primary" className="col-span-2" data-action="h-cook-start" data-id={r.id} onClick={() => startCookingAsked(confirm, r.id)}><ChefHat size={18} aria-hidden="true" /> Start cooking</Button>
        </div>
        <Note className="mt-2.5 mb-0">Favourite saves it. Want to cook adds what you need to your shopping list. Cooking shows one step at a time. None of these records what you eat.</Note>
      </Card>
      {hits.length > 0 && <Card tone="notice"><p className="text-[15px] m-0">Heads up: {hits.map(h => `${h.what} (${h.why.toLowerCase()})`).join('; ')}.</p></Card>}
      <Card aria-labelledby="ing-h">
        <h2 id="ing-h">Ingredients</h2>
        {base && cur ? (
          <div className="serv-stepper flex items-center gap-3.5 mt-1.5 mb-2.5" role="group" aria-label="Servings">
            <button type="button" className="size-12 rounded-full grid place-items-center bg-surface-2 border border-outline cursor-pointer disabled:opacity-40" data-action="h-serv" data-id={r.id} data-d="-1" aria-label="Fewer servings" disabled={cur <= 1} onClick={() => stepServings(r, -1)}><Minus size={20} aria-hidden="true" /></button>
            <span className="text-lg"><strong id="servNow" className="text-[22px] tabular-nums">{cur}</strong> serving{cur === 1 ? '' : 's'}{r.servingsSource === 'user' && <Meta> (base set by you)</Meta>}</span>
            <button type="button" className="size-12 rounded-full grid place-items-center bg-surface-2 border border-outline cursor-pointer disabled:opacity-40" data-action="h-serv" data-id={r.id} data-d="1" aria-label="More servings" disabled={cur >= 100} onClick={() => stepServings(r, 1)}><Plus size={20} aria-hidden="true" /></button>
          </div>
        ) : (
          <>
            <Note>The source doesn't say how many this serves, so quantities are shown as written.</Note>
            <details className="group">
              <Summary>I know how many it serves</Summary>
              <div className="inline-add flex gap-2 items-center">
                <TextInput ref={baseRef} id="servBase" type="number" inputMode="numeric" min={1} max={100} placeholder="e.g. 4" aria-label="Servings" className="flex-1 min-w-0" />
                <Button inline className="flex-none" data-action="h-serv-base" data-id={r.id} onClick={() => setBaseServings(r.id, baseRef.current?.value || '')}>Save</Button>
              </div>
              <Note className="mt-2 mb-0">Saved as your own entry, then you can scale the quantities.</Note>
            </details>
          </>
        )}
        <ul className="ing-list list-none p-0 mt-2 mb-0">
          {r.ingredients.length ? r.ingredients.map((i, k) => {
            const m = scaledMeasure(i.measure, factor);
            return (
              <li key={k} className="py-2 border-t border-outline first:border-t-0">
                <span className="ing-qty font-semibold tabular-nums">{m.text || ''}{!m.scaled && <Meta> (as written)</Meta>}</span> <span>{i.name}</span>
              </li>
            );
          }) : <li className="text-fg-2">No ingredients listed.</li>}
        </ul>
        <Note className="mt-2.5 mb-0">MyDay only reads ingredient names — it can't confirm a recipe is free from any allergen. Check the original recipe and packaging.</Note>
      </Card>
      <Card aria-labelledby="meth-h">
        <h2 id="meth-h">Method</h2>
        {steps.length ? <ol className="steps list-decimal pl-6 my-2 marker:font-bold marker:text-primary">{steps.map((s, k) => <li key={k} className="mb-2.5 leading-relaxed pl-1">{s}</li>)}</ol> : <Note>No method text.</Note>}
        {r.instructions && (
          <details className="group">
            <Summary>Original text</Summary>
            <p className="orig whitespace-pre-wrap text-sm text-fg-2">{r.instructions}</p>
          </details>
        )}
      </Card>
      <NutritionCard r={r} />
      <Card aria-labelledby="src-h">
        <h2 id="src-h">Source</h2>
        {r.source === 'themealdb'
          ? <p className="text-[15px] m-0">From {ext(r.mealDbUrl, 'TheMealDB')}{r.sourceUrl && <> · {ext(r.sourceUrl, 'original recipe')}</>}{r.video && <> · {ext(r.video, 'video')}</>}. Photo: TheMealDB.</p>
          : (
            <>
              <p className="text-[15px]">Your recipe{r.sourceName ? ` · from ${r.sourceName}` : ''}{safeUrl(r.sourceUrl) && <> · {ext(r.sourceUrl, 'link')}</>}.</p>
              <div className="row2 grid grid-cols-2 gap-2.5">
                <TextLink href={`#health/food/edit/${encodeURIComponent(r.id)}`} className="btn justify-center rounded-btn bg-tonal !text-on-tonal">Edit</TextLink>
                <Button variant="ghost" data-action="h-recipe-delete" data-id={r.id} onClick={del}>Delete</Button>
              </div>
            </>
          )}
      </Card>
    </>
  );
}
