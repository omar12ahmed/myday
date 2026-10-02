import type { MyDayData } from '../../data/types';
import { CookView } from './CookView';
import { FoodHome } from './FoodHome';
import { PrefsView } from './PrefsView';
import { RecipeForm } from './RecipeForm';
import { RecipeView } from './RecipeView';
import { SearchView } from './SearchView';
import { ShoppingView } from './ShoppingView';
import { WantView } from './WantView';

// Food's screens, from the address: #health/food · …/search · …/recipe/<id> · …/want/<id> · …/shopping
// · …/cook · …/prefs · …/new · …/edit/<id>.
export function FoodScreen({ data, view, id }: { data: MyDayData; view: string; id: string }) {
  if (view === 'recipe') return <RecipeView key={id} data={data} id={id} />;
  if (view === 'want') return <WantView key={id} data={data} id={id} />;
  if (view === 'shopping') return <ShoppingView data={data} />;
  if (view === 'cook') return <CookView data={data} />;
  if (view === 'search') return <SearchView />;
  if (view === 'prefs') return <PrefsView data={data} />;
  if (view === 'new' || view === 'edit') return <RecipeForm key={view + id} data={data} id={view === 'edit' ? id : null} />;
  return <FoodHome data={data} />;
}
