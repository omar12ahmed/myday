// The shopping list: an ingredient becomes an item, and items combine only when they're the same thing in
// compatible units (grams with kilograms, teaspoons with tablespoons…). Anything ambiguous ("pinch",
// "1-2 cloves", "1 (400g) tin") is kept separate and as written, so you can edit it. Ported from the
// current MyDay.
import type { FoodData, ShoppingItem } from '../types';
import { uid } from '../util';
import { familyOf, fmtAmount, parseMeasure, scaledMeasure, UNIT_FAMILIES } from './quantities';
import { categoryFor } from './words';

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
// "Lemons" and "lemon" are the same item.
export const nameKey = (s: string) => { const k = s.toLowerCase().replace(/\s+/g, ' ').trim(); return k.length > 4 ? k.replace(/(es|s)$/, '') : k; };

// An item for an ingredient (`factor` scales a recipe's quantity; a manual item has no recipe).
export function shoppingFrom(name: string, measure: string, factor: number, recipeTitle: string | null): ShoppingItem {
  const p = parseMeasure(measure);
  const item: ShoppingItem = { id: 's' + uid(), name: str(name, 80), family: null, amount: null, unit: '', text: '', category: categoryFor(name), checked: false, recipes: recipeTitle ? [recipeTitle] : [], manual: !recipeTitle };
  if (p && !p.range) {
    const fam = familyOf(p.unit);
    if (fam && (fam !== 'count' || !/\(|\d/.test(p.extra))) {
      item.family = fam;
      item.amount = p.qty * factor * UNIT_FAMILIES[fam][p.unit];
      item.unit = fam === 'count' ? p.extra.toLowerCase() : '';
      return item;
    }
  }
  item.text = scaledMeasure(measure, factor).text; // kept as written: can't be combined safely
  return item;
}
// Adds an item, combining it with an unticked one only when the units are compatible.
export function addToShopping(f: FoodData, entry: ShoppingItem): ShoppingItem {
  if (entry.family) {
    const match = f.shopping.find(x => !x.checked && x.family === entry.family && x.unit === entry.unit && nameKey(x.name) === nameKey(entry.name));
    if (match) {
      match.amount = (match.amount || 0) + (entry.amount || 0);
      for (const t of entry.recipes) if (!match.recipes.includes(t)) match.recipes.push(t);
      return match;
    }
  }
  f.shopping.push(entry);
  return entry;
}
export const shopQty = (x: ShoppingItem) => (x.family ? fmtAmount(x.family, x.amount || 0, x.unit) : x.text);
