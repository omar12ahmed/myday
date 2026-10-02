// What Food keeps in memory for this visit only (never saved), as in the current MyDay: recipe ideas,
// search results, suggestions while you type, recipes being loaded, servings chosen on a recipe page,
// the Want-to-cook draft, and the shopping list's Undo and the item being edited.
// Screens read `V` through useFoodVisit(), which redraws them when it changes.
import { useSyncExternalStore } from 'react';
import { getSnapshot } from '../../data/storage';
import { fetchError, localMatches, mdbCache, mdbLookup, mdbRandom, mdbSearch, searchCached } from '../../data/food/mealdb';
import { passesPrefs } from '../../data/food/recipes';
import type { Recipe, ShoppingItem } from '../../data/types';

export interface WantDraft { recipeId: string; servings: number | null; have: number[]; used: boolean }
export const V = {
  suggest: { items: [] as Recipe[], shown: 3, loading: false, error: null as string | null, loaded: false, hidden: 0 },
  search: { q: '', items: [] as Recipe[], loading: false, error: null as string | null, done: false, hidden: 0 },
  typeahead: { text: '', q: '', open: false, local: [] as Recipe[], remote: [] as Recipe[], loading: false, error: null as string | null },
  loads: {} as Record<string, { loading: boolean; error: string | null }>,
  servings: {} as Record<string, number>,          // servings chosen on a recipe page
  want: null as WantDraft | null,
  undo: null as { item: ShoppingItem; index: number } | null,
  editing: null as string | null,                   // the shopping item being edited
  timerDone: false,                                  // "Timer done." after a cooking timer ends
};
let version = 0;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const changed = () => { version++; listeners.forEach(fn => fn()); };
export function useFoodVisit() { useSyncExternalStore(subscribe, () => version); return V; }

const food = () => getSnapshot().data.health.food;
const ok = (r: Recipe) => passesPrefs(food().prefs, r);

// ---------- Recipe ideas (random recipes, filtered by your preferences) ----------
export async function loadSuggestions() {
  const s = V.suggest;
  if (s.loading) return;
  s.loading = true; s.error = null; changed();
  try {
    const seen = new Set(s.items.map(r => r.id));
    let tries = 0;
    while (s.items.length < s.shown && tries < s.shown * 4) {
      const n = Math.min(3, s.shown - s.items.length);
      tries += n;
      const batch = await Promise.all(Array.from({ length: n }, () => mdbRandom()));
      for (const r of batch) {
        if (!r || seen.has(r.id)) continue;
        seen.add(r.id);
        mdbCache.set(r.id, r);
        if (ok(r)) s.items.push(r); else s.hidden++;
      }
    }
    s.loaded = true;
  } catch (e) {
    s.error = fetchError(e);
  } finally {
    s.loading = false; changed();
  }
}
export function moreSuggestions() { V.suggest.shown += 3; loadSuggestions(); }
export function retrySuggestions() { V.suggest.error = null; loadSuggestions(); }
// Preferences changed: ideas start again (shown next time Food opens).
export function resetSuggestions() { Object.assign(V.suggest, { items: [], shown: 3, loading: false, error: null, loaded: false, hidden: 0 }); changed(); }

// ---------- Search ----------
// Each search is numbered; a reply for an older search is ignored, so it can never replace newer results.
let searchSeq = 0;
export async function runSearch(q: string) {
  const seq = ++searchSeq, s = V.search;
  Object.assign(s, { q, items: [], error: null, done: false, hidden: 0, loading: true }); changed();
  const local = localMatches(food(), q);
  try {
    const remote = await mdbSearch(q, () => food().recipes);
    if (seq !== searchSeq) return;
    const all = local.concat(remote.filter(r => !food().recipes[r.id]));
    s.items = all.filter(ok);
    s.hidden = all.length - s.items.length;
  } catch (e) {
    if (seq !== searchSeq) return;
    s.error = fetchError(e);
    s.items = local.filter(ok);
    s.hidden = local.length - s.items.length;
  }
  s.loading = false; s.done = true; changed();
}

// ---------- Suggestions while typing ----------
// Your saved recipes show straight away; TheMealDB is asked once you pause typing (or at once if this
// visit already asked). Replies for anything typed earlier are ignored.
export const TYPEAHEAD_MIN = 2, TYPEAHEAD_MAX = 6, TYPEAHEAD_PAUSE = 300;
let typeSeq = 0, typeTimer: ReturnType<typeof setTimeout> | undefined;
export function onTyping(text: string) {
  const t = V.typeahead, q = text.trim();
  t.text = text;
  clearTimeout(typeTimer);
  const seq = ++typeSeq;
  if (q.length < TYPEAHEAD_MIN) { t.open = false; changed(); return; }
  Object.assign(t, { q, open: true, local: localMatches(food(), q), remote: [], loading: true, error: null });
  changed();
  typeTimer = setTimeout(async () => {
    try {
      const remote = await mdbSearch(q, () => food().recipes);
      if (seq !== typeSeq) return;
      t.remote = remote.filter(r => !food().recipes[r.id]);
    } catch (e) {
      if (seq !== typeSeq) return;
      t.error = fetchError(e);
    }
    t.loading = false; changed();
  }, searchCached(q) ? 0 : TYPEAHEAD_PAUSE);
}
// Moving to another screen: suggestions close, and an item being edited is let go (as in the current MyDay).
export function leftScreen() {
  clearTimeout(typeTimer);
  typeSeq++;
  if (!V.typeahead.open && !V.editing) return;
  V.typeahead.open = false; V.editing = null; changed();
}
export function closeTypeahead() {
  clearTimeout(typeTimer);
  typeSeq++;
  if (!V.typeahead.open) return;
  V.typeahead.open = false; changed();
}
export function typeaheadList() {
  const t = V.typeahead, all = t.local.concat(t.remote), good = all.filter(ok);
  return { list: good.slice(0, TYPEAHEAD_MAX), more: good.length > TYPEAHEAD_MAX, hidden: all.length - good.length };
}

// ---------- A recipe that isn't saved or in memory (e.g. opened from a link) ----------
export async function loadRecipe(id: string) {
  const cur = V.loads[id];
  if (cur && cur.loading) return;
  V.loads[id] = { loading: true, error: null }; changed();
  try { await mdbLookup(id); V.loads[id] = { loading: false, error: null }; }
  catch (e) { V.loads[id] = { loading: false, error: fetchError(e) }; }
  changed();
}
