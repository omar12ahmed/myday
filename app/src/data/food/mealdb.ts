// TheMealDB (https://www.themealdb.com), with its free test key "1", documented for development and
// educational use — the same provider and key as the current MyDay. Recipes fetched here are kept in
// memory for this visit only; one is saved when you use it (favourite, want to cook, cook…).
import type { FoodData, Recipe } from '../types';
import { isObj } from '../util';
import { fromMealDb } from './recipes';

const MDB = 'https://www.themealdb.com/api/json/v1/1/';
export const mdbCache = new Map<string, Recipe>();        // recipes fetched this visit
const searchCache = new Map<string, Promise<Recipe[]>>();  // lower-case search → results (this visit)

// A saved recipe, or one fetched this visit.
export const getRecipe = (f: FoodData, id: string): Recipe | null => f.recipes[id] || mdbCache.get(id) || null;

async function mdbGet(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(MDB + path);
  if (!res.ok) throw new Error(`TheMealDB replied with an error (${res.status}).`);
  let j: unknown;
  try { j = await res.json(); } catch { throw new Error("TheMealDB sent something that isn't valid data."); }
  if (!isObj(j)) throw new Error('TheMealDB sent something unexpected.');
  return j;
}
// A friendly message for a failed request.
export const fetchError = (e: unknown) => (e instanceof TypeError ? "Couldn't reach TheMealDB — you may be offline." : (e instanceof Error && e.message) || 'Something went wrong.');

export async function mdbRandom(): Promise<Recipe | null> {
  const j = await mdbGet('random.php');
  return Array.isArray(j.meals) ? fromMealDb(j.meals[0]) : null;
}
export async function mdbLookup(id: string): Promise<Recipe> {
  const j = await mdbGet('lookup.php?i=' + encodeURIComponent(id.replace(/^mdb-/, '')));
  const r = Array.isArray(j.meals) ? fromMealDb(j.meals[0]) : null;
  if (!r) throw new Error("TheMealDB doesn't have that recipe any more.");
  mdbCache.set(r.id, r);
  return r;
}
// TheMealDB recipes whose name contains the text. Remembered for this visit, so typing back and forth,
// or pressing Search after seeing suggestions, doesn't ask again. A failed request can be tried again.
export function mdbSearch(q: string, saved: () => Record<string, Recipe>): Promise<Recipe[]> {
  const key = q.toLowerCase();
  if (!searchCache.has(key)) {
    const req = mdbGet('search.php?s=' + encodeURIComponent(q)).then(j => {
      const list = (Array.isArray(j.meals) ? j.meals : []).map(fromMealDb).filter((r): r is Recipe => !!r);
      list.forEach(r => mdbCache.set(r.id, saved()[r.id] || r));
      return list;
    });
    req.catch(() => searchCache.delete(key));
    searchCache.set(key, req);
    if (searchCache.size > 30) searchCache.delete(searchCache.keys().next().value!); // keep memory small
  }
  return searchCache.get(key)!;
}
export const searchCached = (q: string) => searchCache.has(q.toLowerCase());

// Your saved recipes whose name or ingredients contain the text.
export function localMatches(f: FoodData, q: string): Recipe[] {
  const ql = q.toLowerCase();
  return Object.values(f.recipes).filter(r => r.title.toLowerCase().includes(ql) || r.ingredients.some(i => i.name.toLowerCase().includes(ql)));
}
