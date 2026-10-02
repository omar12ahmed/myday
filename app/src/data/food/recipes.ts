// Recipes: your preferences, what's listed (and what isn't), the method split into steps, and timers
// named in a step. Ported from the current MyDay.
import type { FoodData, FoodPrefs, Recipe } from '../types';
import { cleanRecipe } from './normalize';
import { EXCLUSIONS, NOT_DAIRY, wordsRe } from './words';

export const safeUrl = (u: string) => (/^https?:\/\//i.test(u || '') ? u : '');
export const totalMinutes = (r: Recipe) => (r.prepMin !== null || r.cookMin !== null ? (r.prepMin || 0) + (r.cookMin || 0) : null);

// Which of your exclusions or dislikes a recipe's ingredient names or category trip.
export function prefHits(p: FoodPrefs, r: Recipe): { why: string; what: string }[] {
  const hits: { why: string; what: string }[] = [];
  for (const key of p.exclude) {
    const x = EXCLUSIONS[key];
    if (!x) continue;
    if (r.category && x.cats.includes(r.category)) hits.push({ why: x.label, what: `category: ${r.category}` });
    for (const ing of r.ingredients) {
      if (x.dairy && NOT_DAIRY.test(ing.name)) continue; // e.g. coconut milk, peanut butter
      if (x.re.test(ing.name)) { hits.push({ why: x.label, what: ing.name }); break; }
    }
  }
  for (const d of p.dislikes) {
    const re = wordsRe([d]);
    const ing = r.ingredients.find(i => re.test(i.name));
    if (ing) hits.push({ why: `You don't like ${d}`, what: ing.name });
  }
  return hits;
}
// Only filters the data can support: ingredient names/category for everything; time and batch only where a recipe lists them.
export function passesPrefs(p: FoodPrefs, r: Recipe): boolean {
  if (prefHits(p, r).length) return false;
  if ((p.exclude.length || p.dislikes.length) && !r.ingredients.length) return false;
  const t = totalMinutes(r);
  if (p.maxMinutes && t !== null && t > p.maxMinutes) return false;
  if (p.batchOnly && r.source === 'manual' && !r.batch) return false;
  return true;
}

// What a recipe lists, and what it doesn't ("Time, servings, nutrition not listed") — nothing is guessed.
export function recipeFacts(r: Recipe): { bits: string[]; missing: string } {
  const bits: string[] = [], t = totalMinutes(r);
  if (t !== null) bits.push(`${t} min`);
  if (r.servings) bits.push(`Serves ${r.servings}${r.servingsSource === 'user' ? ' (your entry)' : ''}`);
  if (r.effort) bits.push(`${r.effort[0].toUpperCase()}${r.effort.slice(1)} effort`);
  if (r.nutrition && r.nutrition.kcal !== null) bits.push(`${String(Math.round(r.nutrition.kcal * 100) / 100)} kcal per serving (your entry)`);
  if (r.batch) bits.push('Good for batch cooking');
  const missing = [t === null ? 'time' : '', !r.servings ? 'servings' : '', !r.nutrition ? 'nutrition' : ''].filter(Boolean).join(', ');
  return { bits, missing: missing ? missing.replace(/^./, c => c.toUpperCase()) + ' not listed' : '' };
}

// Splits the original method on its own line breaks only. Lines that are just "STEP 1" headings are
// dropped; no sentence is ever split. The original text itself is kept unchanged.
export function recipeSteps(text: string): string[] {
  const out: string[] = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const l = raw.trim();
    if (!l || /^(step\s*)?\d+[.:)]?$/i.test(l)) continue;
    out.push(l.replace(/^(step\s*\d+\s*[:.)-]?\s*|\d+\s*[.)]\s+)/i, ''));
  }
  return out;
}
// Durations written in a step, e.g. "simmer for 10 minutes" → a 10-minute timer (at most 3 per step).
export function stepTimers(text: string): { sec: number; label: string }[] {
  const out: { sec: number; label: string }[] = [], re = /(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && out.length < 3) {
    const n = +m[1], u = m[3].toLowerCase();
    const sec = Math.round(u.startsWith('h') ? n * 3600 : u.startsWith('s') ? n : n * 60);
    if (sec >= 10 && sec <= 6 * 3600) out.push({ sec, label: m[0].trim() });
  }
  return out;
}

// A TheMealDB meal as a recipe. Their data has no servings, times or nutrition, so those stay "not listed".
export function fromMealDb(m: unknown): Recipe | null {
  const x = m as Record<string, unknown>;
  if (!x || typeof x !== 'object' || !/^\d+$/.test(String(x.idMeal || '')) || typeof x.strMeal !== 'string') return null;
  const ingredients: { name: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = String(x['strIngredient' + i] || '').trim();
    if (name) ingredients.push({ name, measure: String(x['strMeasure' + i] || '').trim() });
  }
  return cleanRecipe({
    id: 'mdb-' + x.idMeal, source: 'themealdb', title: x.strMeal, category: x.strCategory || '', area: x.strArea || '',
    tags: String(x.strTags || '').split(',').map(t => t.trim()).filter(Boolean), thumb: x.strMealThumb || '',
    instructions: x.strInstructions || '', sourceUrl: safeUrl(String(x.strSource || '')), video: safeUrl(String(x.strYoutube || '')),
    mealDbUrl: `https://www.themealdb.com/meal/${x.idMeal}`, ingredients, servings: null, prepMin: null, cookMin: null, effort: null, batch: null, nutrition: null,
  });
}

// Saves a recipe the first time you use it (favourite, want to cook, cook, your own servings or
// nutrition). Returns the saved copy.
export function keepRecipe(f: FoodData, r: Recipe, stamp: string): Recipe {
  if (!f.recipes[r.id]) f.recipes[r.id] = { ...r, savedAt: stamp };
  return f.recipes[r.id];
}
// A saved TheMealDB recipe that nothing refers to any more can be let go (keeps storage small).
// Returns true if it was removed from the saved recipes.
export function tidyRecipe(f: FoodData, id: string): boolean {
  const r = f.recipes[id];
  if (!r || r.source !== 'themealdb') return false;
  const used = f.favourites.includes(id) || f.want.some(x => x.recipeId === id) || f.cooked.some(x => x.recipeId === id) || (!!f.cooking && f.cooking.recipeId === id) || r.servingsSource === 'user' || r.nutritionSource === 'user';
  if (used) return false;
  delete f.recipes[id];
  return true;
}
