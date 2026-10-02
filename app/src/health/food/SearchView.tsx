import { Card } from '../../components/Card';
import { BackLink, Note } from '../../components/parts';
import { Grid, RecipeCard } from './RecipeCard';
import { SearchBox } from './SearchBox';
import { useFoodVisit } from './visit';

// Search results: your saved recipes and TheMealDB's. If TheMealDB can't be reached, your saved
// recipes still show.
export function SearchView() {
  const s = useFoodVisit().search;
  return (
    <>
      <Card aria-label="Search">
        <BackLink to="health/food" label="Food" />
        <SearchBox />
        {s.loading && <Note className="mt-2.5 mb-0"><span role="status">Searching…</span></Note>}
        {s.error && <p className="warn text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2 mt-2.5 mb-0">{s.error} Showing matches from your saved recipes only.</p>}
        {s.done && !s.items.length && <p className="text-[15px] mt-2.5 mb-0">No recipes found for "{s.q}".</p>}
        {s.hidden > 0 && <Note className="mt-2.5 mb-0">{s.hidden} result{s.hidden === 1 ? '' : 's'} left out because of your preferences.</Note>}
      </Card>
      {s.items.length > 0 && <Card aria-label={`Results for ${s.q}`}><Grid>{s.items.map(r => <RecipeCard key={r.id} r={r} />)}</Grid></Card>}
    </>
  );
}
