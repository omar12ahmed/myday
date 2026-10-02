// Checks saved Food data exactly as normalizeHealth() in the current MyDay checks it: damaged entries are
// dropped (and counted), numbers are kept in range, and favourites / want-to-cook / cooking only point at
// recipes that are saved.
import { isDateKey, todayKey } from '../dates';
import type { FoodData, Nutrition, Recipe, UnitFamily } from '../types';
import { intIn, isObj, numIn, uid } from '../util';
import { UNIT_FAMILIES } from './quantities';
import { EXCLUSIONS, SHOP_CATEGORIES } from './words';

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const optNum = (v: unknown, lo: number, hi: number) => numIn(v, lo, hi, null);

export function emptyFood(): FoodData {
  return { prefs: { exclude: [], dislikes: [], maxMinutes: null, batchOnly: false }, recipes: {}, favourites: [], want: [], cooked: [], shopping: [], cooking: null };
}

export function cleanRecipe(o: unknown): Recipe | null {
  if (!isObj(o) || typeof o.id !== 'string' || !o.id || typeof o.title !== 'string' || !o.title.trim()) return null;
  const n = isObj(o.nutrition) ? o.nutrition : null;
  return {
    id: o.id, source: o.source === 'themealdb' ? 'themealdb' : 'manual', title: str(o.title, 120),
    sourceUrl: str(o.sourceUrl, 400), sourceName: str(o.sourceName, 80), mealDbUrl: str(o.mealDbUrl, 200), video: str(o.video, 300),
    thumb: /^https:\/\//.test(typeof o.thumb === 'string' ? o.thumb : '') ? str(o.thumb, 300) : '',
    category: str(o.category, 40), area: str(o.area, 40), tags: Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === 'string').slice(0, 10).map(t => t.slice(0, 30)) : [],
    ingredients: (Array.isArray(o.ingredients) ? o.ingredients : []).filter(i => isObj(i) && typeof i.name === 'string' && i.name.trim()).slice(0, 60).map(i => ({ name: str(i.name, 80), measure: str(i.measure, 60) })),
    instructions: typeof o.instructions === 'string' ? o.instructions.slice(0, 20000) : '',
    servings: optNum(o.servings, 1, 100), servingsSource: o.servingsSource === 'user' ? 'user' : o.servingsSource === 'recipe' ? 'recipe' : null,
    prepMin: optNum(o.prepMin, 0, 1440), cookMin: optNum(o.cookMin, 0, 1440),
    effort: o.effort === 'easy' || o.effort === 'medium' || o.effort === 'hard' ? o.effort : null, batch: o.batch === true ? true : o.batch === false ? false : null, // null = not known
    nutrition: n ? { kcal: optNum(n.kcal, 0, 10000), protein: optNum(n.protein, 0, 1000), carbs: optNum(n.carbs, 0, 1000), fat: optNum(n.fat, 0, 1000) } as Nutrition : null,
    nutritionSource: o.nutritionSource === 'user' ? 'user' : null,
    savedAt: str(o.savedAt, 20),
  };
}

export function normalizeFood(raw: unknown, report: { dropped: number }): FoodData {
  const hf = emptyFood(), f = isObj(raw) ? raw : {};
  if (isObj(f.prefs)) {
    hf.prefs.exclude = Array.isArray(f.prefs.exclude) ? f.prefs.exclude.filter((x): x is string => typeof x === 'string' && !!EXCLUSIONS[x]) : [];
    hf.prefs.dislikes = Array.isArray(f.prefs.dislikes) ? f.prefs.dislikes.map(x => str(x, 40).toLowerCase()).filter(Boolean).slice(0, 30) : [];
    hf.prefs.maxMinutes = optNum(f.prefs.maxMinutes, 5, 600);
    hf.prefs.batchOnly = f.prefs.batchOnly === true;
  }
  if (isObj(f.recipes)) for (const id of Object.keys(f.recipes)) { const r = cleanRecipe(f.recipes[id]); if (r && r.id === id) hf.recipes[id] = r; else report.dropped++; }
  if (Array.isArray(f.favourites)) hf.favourites = [...new Set(f.favourites.filter((id): id is string => typeof id === 'string' && !!hf.recipes[id]))];
  if (Array.isArray(f.want)) for (const x of f.want) if (isObj(x) && typeof x.recipeId === 'string' && hf.recipes[x.recipeId]) hf.want.push({ id: typeof x.id === 'string' ? x.id : 'w' + uid(), recipeId: x.recipeId, servings: optNum(x.servings, 1, 100), addedOn: isDateKey(x.addedOn) ? x.addedOn : todayKey() });
  if (Array.isArray(f.cooked)) for (const x of f.cooked) if (isObj(x) && typeof x.recipeId === 'string' && isDateKey(x.date)) hf.cooked.push({ id: typeof x.id === 'string' ? x.id : 'c' + uid(), recipeId: x.recipeId, title: str(x.title, 120), date: x.date, servings: optNum(x.servings, 1, 100) });
  if (Array.isArray(f.shopping)) for (const x of f.shopping) {
    if (!isObj(x) || !str(x.name)) { report.dropped++; continue; }
    const family = typeof x.family === 'string' && UNIT_FAMILIES[x.family as UnitFamily] && optNum(x.amount, 0, 1e6) !== null ? (x.family as UnitFamily) : null;
    hf.shopping.push({ id: typeof x.id === 'string' && x.id ? x.id : 's' + uid(), name: str(x.name, 80), family, amount: family ? optNum(x.amount, 0, 1e6) : null, unit: family === 'count' ? str(x.unit, 30) : '', text: family ? '' : str(x.text, 60), category: SHOP_CATEGORIES.includes(x.category as string) ? (x.category as string) : 'Other', checked: x.checked === true, recipes: Array.isArray(x.recipes) ? x.recipes.filter((t): t is string => typeof t === 'string').slice(0, 10) : [], manual: x.manual === true });
  }
  if (isObj(f.cooking) && typeof f.cooking.recipeId === 'string' && hf.recipes[f.cooking.recipeId]) {
    const c = f.cooking, t = isObj(c.timer) ? c.timer : null;
    hf.cooking = {
      recipeId: c.recipeId as string, step: intIn(c.step, 0, 500, 0), servings: optNum(c.servings, 1, 100), startedAt: str(c.startedAt, 20),
      timer: t && Number.isInteger(t.durationSec) && Number.isFinite(t.accumulatedMs) ? { label: str(t.label, 40), durationSec: t.durationSec as number, startedAt: Number.isFinite(t.startedAt) ? (t.startedAt as number) : null, accumulatedMs: t.accumulatedMs as number, finished: t.finished === true } : null,
    };
  }
  return hf;
}
