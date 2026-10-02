// What Food's buttons and fields do: each one changes saved data through the store (storage.ts update()),
// then moves to the right screen. Same behaviour, limits and messages as the current MyDay. Questions
// ("Delete this recipe?") are asked by the screens before these are called.
// Choosing, cooking and eating are kept apart: nothing here ever records food eaten or calories.
import { localStamp, todayKey } from '../../data/dates';
import { getRecipe, mdbCache } from '../../data/food/mealdb';
import { cleanRecipe } from '../../data/food/normalize';
import { parseIngredientLine } from '../../data/food/quantities';
import { keepRecipe, safeUrl, tidyRecipe } from '../../data/food/recipes';
import { addToShopping, shoppingFrom } from '../../data/food/shopping';
import { categoryFor, EXCLUSIONS } from '../../data/food/words';
import { getSnapshot, update } from '../../data/storage';
import { toast } from '../../data/toast';
import type { FoodData, Nutrition, Recipe } from '../../data/types';
import { numIn, uid } from '../../data/util';
import { go } from '../route';
import { changed, closeTypeahead, resetSuggestions, runSearch, V, type WantDraft } from './visit';

const F = () => getSnapshot().data.health.food;
function withFood(fn: (f: FoodData) => void | false) { return update(d => fn(d.health.food)); }
const optNum = (v: unknown, lo: number, hi: number) => numIn(v, lo, hi, null);
// A recipe let go from the saved ones stays viewable for the rest of this visit.
function tidy(f: FoodData, id: string) { const r = f.recipes[id]; if (r && tidyRecipe(f, id)) mdbCache.set(id, r); }

// ---------- Discovery ----------
export function search(text: string) {
  const q = text.trim();
  if (!q) return;
  closeTypeahead();
  V.typeahead.text = q;
  go('health/food/search');
  runSearch(q);
}

// ---------- A recipe ----------
export function toggleFavourite(id: string) {
  const r = getRecipe(F(), id);
  if (!r) return;
  let added = false as boolean;
  withFood(f => {
    if (f.favourites.includes(r.id)) { f.favourites = f.favourites.filter(x => x !== r.id); tidy(f, r.id); }
    else { keepRecipe(f, r, localStamp()); f.favourites.push(r.id); added = true; }
  });
  toast(added ? 'Saved to favourites.' : 'Removed from favourites.');
}
// Servings on a recipe page (this visit only): scales the quantities shown.
export function stepServings(r: Recipe, d: number) {
  if (!r.servings) return;
  V.servings[r.id] = Math.max(1, Math.min(100, (V.servings[r.id] || r.servings) + d));
  changed();
}
// "I know how many it serves": saved as your own entry for a TheMealDB recipe.
export function setBaseServings(id: string, text: string): boolean {
  const r = getRecipe(F(), id), n = optNum(text, 1, 100);
  if (!r || !n) { toast('Please enter how many it serves.'); return false; }
  withFood(f => { const kept = keepRecipe(f, r, localStamp()); kept.servings = Math.round(n); kept.servingsSource = 'user'; });
  toast('Saved as your own entry.');
  return true;
}
// Your own nutrition figures (per serving). They're always labelled as yours; MyDay never estimates them.
export function saveNutrition(id: string, v: { kcal: string; protein: string; carbs: string; fat: string }): boolean {
  const r = getRecipe(F(), id);
  const nut: Nutrition = { kcal: optNum(v.kcal, 0, 10000), protein: optNum(v.protein, 0, 10000), carbs: optNum(v.carbs, 0, 10000), fat: optNum(v.fat, 0, 10000) };
  if (!r || !Object.values(nut).some(x => x !== null)) { toast('Enter at least one figure.'); return false; }
  withFood(f => { const kept = keepRecipe(f, r, localStamp()); kept.nutrition = nut; kept.nutritionSource = 'user'; });
  toast('Saved — shown as your own figures.');
  return true;
}
export const clearNutrition = (id: string) => withFood(f => { const r = f.recipes[id]; if (!r) return false; r.nutrition = null; r.nutritionSource = null; tidy(f, id); });

// Your own recipe, from the form. Returns a message if it can't be saved.
export interface RecipeFormValues { title: string; servings: string; effort: string; prep: string; cook: string; batch: boolean; ingredients: string; method: string; kcal: string; protein: string; carbs: string; fat: string; sourceName: string; sourceUrl: string }
export function saveOwnRecipe(id: string | null, v: RecipeFormValues): string | null {
  const title = v.title.trim();
  if (!title) return 'Please give the recipe a name.';
  const nut = { kcal: optNum(v.kcal, 0, 10000), protein: optNum(v.protein, 0, 1000), carbs: optNum(v.carbs, 0, 1000), fat: optNum(v.fat, 0, 1000) };
  const hasNut = Object.values(nut).some(x => x !== null), serv = optNum(v.servings, 1, 100);
  const rec = cleanRecipe({
    id: id || 'r' + uid(), source: 'manual', title,
    servings: serv, servingsSource: serv ? 'recipe' : null,
    prepMin: optNum(v.prep, 0, 1440), cookMin: optNum(v.cook, 0, 1440), effort: v.effort || null, batch: v.batch,
    ingredients: v.ingredients.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(parseIngredientLine),
    instructions: v.method, sourceName: v.sourceName, sourceUrl: safeUrl(v.sourceUrl.trim()),
    nutrition: hasNut ? nut : null, nutritionSource: hasNut ? 'user' : null, savedAt: localStamp(),
  })!;
  withFood(f => { f.recipes[rec.id] = rec; });
  toast('Recipe saved.');
  go('health/food/recipe/' + encodeURIComponent(rec.id));
  return null;
}
// Deleting your own recipe. Your cooking history keeps its name.
export function deleteOwnRecipe(id: string) {
  withFood(f => {
    if (!f.recipes[id]) return false;
    delete f.recipes[id];
    f.favourites = f.favourites.filter(x => x !== id);
    f.want = f.want.filter(x => x.recipeId !== id);
    if (f.cooking && f.cooking.recipeId === id) f.cooking = null;
  });
  go('health/food');
}

// ---------- Want to cook → shopping list ----------
// The draft for a recipe's Want-to-cook page (servings, and what you already have).
export function wantDraft(r: Recipe): WantDraft {
  if (!V.want || V.want.recipeId !== r.id) {
    const existing = F().want.find(x => x.recipeId === r.id);
    V.want = { recipeId: r.id, servings: r.servings ? (existing && existing.servings) || V.servings[r.id] || r.servings : null, have: [], used: false };
  }
  return V.want;
}
export function wantServings(d: number) { const w = V.want; if (w && w.servings) { w.servings = Math.max(1, Math.min(100, w.servings + d)); changed(); } }
export function wantHave(i: number, on: boolean) { const w = V.want; if (!w) return; w.have = on ? [...new Set(w.have.concat(i))] : w.have.filter(x => x !== i); changed(); }
// Adds what you still need to the shopping list (combining only compatible items). A draft is used once,
// so a double tap can't add everything twice.
export function addWanted(draft: WantDraft) {
  const r = getRecipe(F(), draft.recipeId);
  if (!r || draft.used) return;
  draft.used = true;
  V.want = null;
  const factor = r.servings && draft.servings ? draft.servings / r.servings : 1;
  let n = 0;
  withFood(f => {
    keepRecipe(f, r, localStamp());
    r.ingredients.forEach((ing, i) => { if (!draft.have.includes(i)) { addToShopping(f, shoppingFrom(ing.name, ing.measure, factor, r.title)); n++; } });
    const ex = f.want.find(x => x.recipeId === r.id);
    if (ex) ex.servings = draft.servings; else f.want.push({ id: 'w' + uid(), recipeId: r.id, servings: draft.servings, addedOn: todayKey() });
  });
  toast(n ? `Added ${n} item${n === 1 ? '' : 's'} to your shopping list.` : 'Saved to Want to cook.');
  go(n ? 'health/food/shopping' : 'health/food');
}
// Taking a recipe off Want to cook keeps its shopping items.
export const removeWant = (wantId: string) => withFood(f => {
  const x = f.want.find(y => y.id === wantId);
  if (!x) return false;
  f.want = f.want.filter(y => y !== x);
  tidy(f, x.recipeId);
});

// ---------- The shopping list ----------
// A typed item ("2 lemons"), combined with a matching one when the units fit.
export function addManual(text: string) {
  const raw = text.trim();
  if (!raw) return;
  const p = parseIngredientLine(raw);
  withFood(f => { addToShopping(f, shoppingFrom(p.name, p.measure, 1, null)); });
  V.undo = null; changed();
}
export const tickItem = (id: string, on: boolean) => withFood(f => { const x = f.shopping.find(y => y.id === id); if (!x || x.checked === on) return false; x.checked = on; });
export function removeItem(id: string) {
  const i = F().shopping.findIndex(x => x.id === id);
  if (i < 0) return;
  V.undo = { item: F().shopping[i], index: i };
  withFood(f => { f.shopping.splice(f.shopping.findIndex(x => x.id === id), 1); });
  changed();
}
export function undoRemove() {
  const u = V.undo;
  if (!u) return;
  V.undo = null;
  withFood(f => { if (f.shopping.some(x => x.id === u.item.id)) return false; f.shopping.splice(Math.min(u.index, f.shopping.length), 0, u.item); });
  changed();
}
export function editItem(id: string | null) { V.editing = id; changed(); }
// A changed name or quantity. A quantity in a known unit can combine later; anything else stays as written.
export function saveItem(id: string, name: string, qty: string) {
  const x0 = F().shopping.find(y => y.id === id);
  if (!x0) return;
  const nm = name.trim() || x0.name, p = shoppingFrom(nm, qty.trim(), 1, null);
  withFood(f => { const x = f.shopping.find(y => y.id === id); if (!x) return false; Object.assign(x, { name: nm.slice(0, 80), family: p.family, amount: p.amount, unit: p.unit, text: p.text, category: categoryFor(nm) }); });
  V.editing = null; changed();
}
export function clearTicked() { withFood(f => { if (!f.shopping.some(x => x.checked)) return false; f.shopping = f.shopping.filter(x => !x.checked); }); V.undo = null; changed(); }

// ---------- Cooking ----------
// Start (or carry on with) cooking a recipe. The screen asks first if another recipe is being cooked.
export function startCooking(id: string) {
  const r = getRecipe(F(), id);
  if (!r) return;
  const cur = F().cooking;
  if (!cur || cur.recipeId !== r.id) {
    withFood(f => {
      const kept = keepRecipe(f, r, localStamp()), wanted = f.want.find(x => x.recipeId === kept.id);
      f.cooking = { recipeId: kept.id, step: 0, servings: kept.servings ? V.servings[kept.id] || (wanted && wanted.servings) || kept.servings : null, startedAt: localStamp(), timer: null };
    });
    V.timerDone = false; changed();
  }
  go('health/food/cook');
}
export function cookStep(d: number, steps: number) {
  withFood(f => { const c = f.cooking; if (!c) return false; const next = Math.max(0, Math.min(steps - 1, c.step + d)); if (next === c.step) return false; c.step = next; });
  V.timerDone = false; changed();
}
// Finished: saved to your cooking history only (never as food eaten), and off Want to cook.
export function finishCooking() {
  const c = F().cooking, r = c && getRecipe(F(), c.recipeId);
  if (!c || !r) return;
  withFood(f => {
    if (!f.cooking) return false;
    f.cooked.push({ id: 'c' + uid(), recipeId: r.id, title: r.title, date: todayKey(), servings: f.cooking.servings });
    f.cooking = null;
    f.want = f.want.filter(x => x.recipeId !== r.id);
  });
  V.timerDone = false; changed();
  toast('Cooked — saved to your cooking history.');
  go('health/food');
}
export function stopCooking() {
  withFood(f => { if (!f.cooking) return false; const id = f.cooking.recipeId; f.cooking = null; tidy(f, id); });
  go('health/food');
}
// Optional step timers, by the clock (a refresh or a sleeping phone keeps them right).
export function startTimer(sec: number, label: string) { withFood(f => { if (!f.cooking) return false; f.cooking.timer = { label: label.slice(0, 40), durationSec: sec, startedAt: Date.now(), accumulatedMs: 0, finished: false }; }); V.timerDone = false; changed(); }
export const pauseTimer = () => withFood(f => { const t = f.cooking && f.cooking.timer; if (!t || !t.startedAt) return false; t.accumulatedMs += Date.now() - t.startedAt; t.startedAt = null; });
export const resumeTimer = () => withFood(f => { const t = f.cooking && f.cooking.timer; if (!t || t.startedAt) return false; t.startedAt = Date.now(); });
export const stopTimer = () => withFood(f => { if (!f.cooking || !f.cooking.timer) return false; f.cooking.timer = null; });

// ---------- Preferences (saved as you change them; ideas start again) ----------
export function setExclude(key: string, on: boolean) {
  withFood(f => { const set = new Set(f.prefs.exclude); if (on) set.add(key); else set.delete(key); f.prefs.exclude = Object.keys(EXCLUSIONS).filter(x => set.has(x)); });
  resetSuggestions();
}
export function setDislikes(text: string) { withFood(f => { f.prefs.dislikes = text.split(',').map(x => x.trim().toLowerCase()).filter(Boolean).slice(0, 30); }); resetSuggestions(); }
export function setMaxMinutes(text: string) { withFood(f => { f.prefs.maxMinutes = optNum(text, 5, 600); }); resetSuggestions(); }
export function setBatchOnly(on: boolean) { withFood(f => { f.prefs.batchOnly = on; }); resetSuggestions(); }
