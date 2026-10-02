import { ChefHat, Plus, RotateCw, SlidersHorizontal } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useConfirm } from '../../components/confirm';
import { Eyebrow, InlineLink, Meta, Note, TextLink } from '../../components/parts';
import { shortDate } from '../../data/dates';
import { getRecipe } from '../../data/food/mealdb';
import { recipeSteps } from '../../data/food/recipes';
import { EXCLUSIONS } from '../../data/food/words';
import type { MyDayData } from '../../data/types';
import { startCookingAsked } from './cookStart';
import { Grid, RecipeCard, Skeleton } from './RecipeCard';
import { SearchBox } from './SearchBox';
import { loadSuggestions, moreSuggestions, retrySuggestions, useFoodVisit } from './visit';

const BTN = 'btn inline-flex items-center justify-center gap-2 min-h-tap w-full rounded-btn bg-primary text-on-primary font-[650] shadow-raised';
const MDB_LINK = <a href="https://www.themealdb.com" target="_blank" rel="noopener" className="text-primary font-semibold">TheMealDB</a>;

// The one thing waiting: carry on cooking, the shopping list, or something you want to cook.
function NextCard({ data }: { data: MyDayData }) {
  const confirm = useConfirm();
  const f = data.health.food, toBuy = f.shopping.filter(x => !x.checked).length;
  if (f.cooking && f.recipes[f.cooking.recipeId]) {
    const r = f.recipes[f.cooking.recipeId];
    return (
      <Card tone="accent" className="next-card"><Eyebrow>Cooking</Eyebrow><h2>{r.title}</h2>
        <Note>Step {f.cooking.step + 1} of {Math.max(1, recipeSteps(r.instructions).length)}</Note>
        <a className={BTN} href="#health/food/cook">Resume cooking</a></Card>
    );
  }
  if (toBuy) {
    return (
      <Card tone="accent" className="next-card"><Eyebrow>Next step</Eyebrow><h2>Shopping list</h2>
        <Note>{toBuy} item{toBuy === 1 ? '' : 's'} to get{f.want.length ? ` for ${f.want.length} recipe${f.want.length === 1 ? '' : 's'}` : ''}.</Note>
        <a className={BTN} href="#health/food/shopping">Open shopping list</a></Card>
    );
  }
  const first = f.want[0] && getRecipe(f, f.want[0].recipeId);
  if (first) {
    return (
      <Card tone="accent" className="next-card"><Eyebrow>Want to cook</Eyebrow><h2>{first.title}</h2>
        <Button variant="primary" data-action="h-cook-start" data-id={first.id} onClick={() => startCookingAsked(confirm, first.id)}><ChefHat size={18} aria-hidden="true" /> Start cooking</Button></Card>
    );
  }
  return null;
}

// Your preferences (beside the main cards on wide screens) and where recipe ideas come from.
function SideCards({ data }: { data: MyDayData }) {
  const p = data.health.food.prefs, active = p.exclude.map(k => EXCLUSIONS[k]?.label).filter(Boolean).concat(p.dislikes.map(d => `not ${d}`));
  return (
    <>
      <Card aria-labelledby="fprefs-h">
        <h2 id="fprefs-h">Your preferences</h2>
        <p className="text-[15px]">{active.length ? active.join(' · ') : 'No filters set.'}{p.maxMinutes ? ` · up to ${p.maxMinutes} min` : ''}{p.batchOnly ? ' · batch cooking' : ''}</p>
        <a className="btn inline-flex items-center justify-center gap-2 min-h-11 w-full rounded-btn bg-tonal text-on-tonal font-[550] text-[15px]" href="#health/food/prefs"><SlidersHorizontal size={16} aria-hidden="true" /> Change preferences</a>
      </Card>
      <Card aria-labelledby="fabout-h">
        <h2 id="fabout-h">About recipe ideas</h2>
        <Note className="m-0">Ideas and photos come from {MDB_LINK}, using its free test key for personal and educational use. TheMealDB doesn't list servings, times or nutrition, so MyDay shows those as "not listed" rather than guessing.</Note>
      </Card>
    </>
  );
}

export function FoodHome({ data }: { data: MyDayData }) {
  const V = useFoodVisit(), s = V.suggest, f = data.health.food;
  // Ideas are fetched the first time Food opens this visit (and again after a preference changes).
  useEffect(() => { if (!s.loaded && !s.loading && !s.error) loadSuggestions(); }, [s.loaded, s.loading, s.error]);
  const shown = s.items.slice(0, s.shown);
  const seen = new Set<string>(), cooked = f.cooked.slice().reverse().filter(c => !seen.has(c.recipeId) && !!seen.add(c.recipeId)).slice(0, 5);
  const mine = Object.values(f.recipes).filter(r => r.source === 'manual');
  const favs = f.favourites.map(id => getRecipe(f, id)).filter(r => !!r);
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:gap-x-6 lg:items-start">
      <div className="min-w-0">
        <NextCard data={data} />
        <Card aria-label="Search and add">
          <SearchBox />
          <div className="row2 flex flex-wrap gap-x-5 mt-1"><TextLink href="#health/food/new"><Plus size={16} aria-hidden="true" /> Add my own recipe</TextLink><TextLink href="#health/food/prefs">Preferences</TextLink></div>
        </Card>
        <Card aria-labelledby="ideas-h">
          <h2 id="ideas-h">Ideas for you</h2>
          {s.error && (
            <>
              <p className="warn text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2">{s.error} Your saved recipes below still work.</p>
              <Button inline data-action="h-suggest-retry" onClick={retrySuggestions}><RotateCw size={16} aria-hidden="true" /> Try again</Button>
            </>
          )}
          <Grid>
            {shown.map(r => <RecipeCard key={r.id} r={r} />)}
            {s.loading && Array.from({ length: Math.max(1, s.shown - shown.length) }, (_, i) => <Skeleton key={'sk' + i} />)}
          </Grid>
          {s.loading && <Note className="mt-2.5 mb-0" ><span role="status">Finding ideas…</span></Note>}
          {s.hidden > 0 && <Note className="mt-2.5 mb-0">{s.hidden} idea{s.hidden === 1 ? '' : 's'} left out because of your preferences.</Note>}
          {s.loaded && !s.loading && !s.error && <Button inline className="mt-3" data-action="h-suggest-more" onClick={moreSuggestions}>Show more</Button>}
        </Card>
        {f.want.length > 0 && (
          <Card aria-labelledby="want-h">
            <h2 id="want-h">Want to cook</h2>
            <ul className="plain-list list-none p-0 my-2">
              {f.want.map(x => { const r = getRecipe(f, x.recipeId); return r && <li key={x.id} className="py-2 border-t border-outline first:border-t-0"><InlineLink href={`#health/food/recipe/${encodeURIComponent(r.id)}`}>{r.title}</InlineLink></li>; })}
            </ul>
            <TextLink href="#health/food/shopping">Shopping list</TextLink>
          </Card>
        )}
        {cooked.length > 0 && (
          <Card aria-labelledby="cooked-h">
            <h2 id="cooked-h">Recently cooked</h2>
            <ul className="plain-list list-none p-0 my-2">
              {cooked.map(c => { const r = getRecipe(f, c.recipeId); return <li key={c.id} className="py-2 border-t border-outline first:border-t-0">{r ? <InlineLink href={`#health/food/recipe/${encodeURIComponent(r.id)}`}>{r.title}</InlineLink> : c.title}<div><Meta>{shortDate(c.date)}</Meta></div></li>; })}
            </ul>
          </Card>
        )}
        {favs.length > 0 && <Card aria-labelledby="favs-h"><h2 id="favs-h">Favourites</h2><Grid>{favs.map(r => <RecipeCard key={r!.id} r={r!} />)}</Grid></Card>}
        {mine.length > 0 && <Card aria-labelledby="mine-h"><h2 id="mine-h">My recipes</h2><Grid>{mine.map(r => <RecipeCard key={r.id} r={r} />)}</Grid></Card>}
        <p className="attribution text-center text-[15px] text-fg-2 mt-1 mb-4">Recipe ideas and photos: {MDB_LINK}.</p>
      </div>
      <div className="min-w-0"><SideCards data={data} /></div>
    </div>
  );
}
