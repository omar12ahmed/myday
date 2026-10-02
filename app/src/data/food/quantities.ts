// Reading and scaling ingredient quantities ("1 1/2 cups", "200g", "½ tsp"). Ported from the current
// MyDay. Ranges ("1-2") and words ("pinch", "to taste") can't be scaled, so they're kept as written.
import type { UnitFamily } from '../types';

const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };
export const UNIT_ALIASES: Record<string, string> = {
  g: 'g', gr: 'g', gram: 'g', grams: 'g', kg: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml', l: 'l', litre: 'l', litres: 'l', liter: 'l', liters: 'l',
  tsp: 'tsp', tsps: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', tbsp: 'tbsp', tbsps: 'tbsp', tbs: 'tbsp', tblsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  cup: 'cup', cups: 'cup', oz: 'oz', ounce: 'oz', ounces: 'oz', lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
};
// Units only combine within a family (never e.g. grams with cups). Each unit's size in the family's base unit.
export const UNIT_FAMILIES: Record<UnitFamily, Record<string, number>> = { g: { g: 1, kg: 1000 }, ml: { ml: 1, l: 1000 }, tsp: { tsp: 1, tbsp: 3 }, cup: { cup: 1 }, oz: { oz: 1, lb: 16 }, count: { '': 1 } };
export const familyOf = (unit: string): UnitFamily | null => (Object.keys(UNIT_FAMILIES) as UnitFamily[]).find(f => unit in UNIT_FAMILIES[f]) || null;
export const NUM_RE = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?\s*[½¼¾⅓⅔⅛]|\d+(?:\.\d+)?|[½¼¾⅓⅔⅛])/;

function numVal(s: string): number {
  s = s.trim();
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/); if (m) return +m[1] + +m[2] / +m[3];
  m = s.match(/^(\d+)\/(\d+)$/); if (m) return +m[1] / +m[2];
  m = s.match(/^(\d+(?:\.\d+)?)?\s*([½¼¾⅓⅔⅛])$/); if (m) return (m[1] ? +m[1] : 0) + FRACTIONS[m[2]];
  return +s;
}
export type Measure = { range: true } | { range?: false; qty: number; unit: string; unitText: string; extra: string };
// "1 1/2 cups" → { qty: 1.5, unit: 'cup', unitText: 'cups', extra: '' }. Ranges and words like "pinch" can't be scaled.
export function parseMeasure(text: string): Measure | null {
  const t = String(text || '').trim();
  const m = t.match(NUM_RE);
  if (!m) return null;
  const rest = t.slice(m[0].length).trim();
  if (/^(-|–|to\b)\s*\d/i.test(rest)) return { range: true };
  const qty = numVal(m[0]);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  const um = rest.match(/^([A-Za-z]+)\.?(?=\s|$|[^A-Za-z])/);
  const unit = um && UNIT_ALIASES[um[1].toLowerCase()] ? UNIT_ALIASES[um[1].toLowerCase()] : '';
  const after = unit ? rest.slice(um![0].length).trim() : rest;
  return { qty, unit, unitText: unit ? um![1] : '', extra: after.replace(/^of\s+/i, '') };
}
export const fmtQty = (n: number) => String(Math.round(n * 100) / 100);
// A quantity for `factor` times the servings. `scaled: false` means it was kept as written.
export function scaledMeasure(measure: string, factor: number): { text: string; scaled: boolean } {
  if (factor === 1) return { text: measure, scaled: true };
  const p = parseMeasure(measure);
  if (!p || p.range) return { text: measure, scaled: false };
  return { text: [fmtQty(p.qty * factor), p.unitText, p.extra].filter(Boolean).join(' '), scaled: true };
}
// A combined amount in a sensible unit: 1500 g → "1.5 kg", 12 tsp → "4 tbsp".
export function fmtAmount(family: UnitFamily, amount: number, unit: string): string {
  if (family === 'g') return amount >= 1000 ? `${fmtQty(amount / 1000)} kg` : `${fmtQty(amount)} g`;
  if (family === 'ml') return amount >= 1000 ? `${fmtQty(amount / 1000)} l` : `${fmtQty(amount)} ml`;
  if (family === 'tsp') return amount >= 3 && Math.abs(amount / 3 - Math.round(amount / 3)) < 1e-9 ? `${fmtQty(amount / 3)} tbsp` : `${fmtQty(amount)} tsp`;
  if (family === 'cup') return `${fmtQty(amount)} cup${amount === 1 ? '' : 's'}`;
  if (family === 'oz') return amount >= 16 ? `${fmtQty(amount / 16)} lb` : `${fmtQty(amount)} oz`;
  return `${fmtQty(amount)}${unit ? ' ' + unit : ''}`;
}
// "200 g pasta" → { measure: '200 g', name: 'pasta' }; anything without a leading number stays as the name.
// A range stays together as the quantity ("1-2 cloves garlic" → '1-2', 'cloves garlic'), so it's kept as
// written on the shopping list rather than read as "1". (The current MyDay reads it as 1 × "-2 cloves garlic".)
export function parseIngredientLine(line: string): { measure: string; name: string } {
  const t = line.trim();
  const m = t.match(NUM_RE);
  if (!m) return { measure: '', name: t };
  let rest = t.slice(m[0].length).trim(), measure = m[0].trim();
  const range = rest.match(/^(?:-|–|to\b)\s*\d+(?:\.\d+)?/i);
  if (range) { measure = t.slice(0, t.length - rest.length + range[0].length).trim(); rest = rest.slice(range[0].length).trim(); } // exactly as typed
  const um = rest.match(/^([A-Za-z]+)\.?(?=\s)/);
  if (um && UNIT_ALIASES[um[1].toLowerCase()]) { measure += ' ' + um[1]; rest = rest.slice(um[0].length).trim(); }
  rest = rest.replace(/^of\s+/i, '');
  return rest ? { measure, name: rest } : { measure: '', name: t };
}
