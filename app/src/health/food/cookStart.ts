import type { Ask } from '../../components/confirm';
import { getRecipe } from '../../data/food/mealdb';
import { getSnapshot } from '../../data/storage';
import { startCooking } from './actions';

// Start cooking a recipe. If another one is being cooked, ask first (its place would be lost).
export async function startCookingAsked(confirm: Ask, id: string) {
  const f = getSnapshot().data.health.food, cur = f.cooking && getRecipe(f, f.cooking.recipeId);
  if (cur && cur.id !== id && !(await confirm({ title: `Stop cooking ${cur.title} and start this instead?`, body: "Your place in it won't be kept.", confirmLabel: 'Start this instead', cancelLabel: 'Keep cooking' }))) return;
  startCooking(id);
}
