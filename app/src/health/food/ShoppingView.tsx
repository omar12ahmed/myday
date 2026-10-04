import { Pencil, Plus, X } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useConfirm } from '../../components/confirm';
import { Field, TextInput } from '../../components/Field';
import { BackLink, InlineLink, Meta, Note, Row, Summary } from '../../components/parts';
import { getRecipe } from '../../data/food/mealdb';
import { shopQty } from '../../data/food/shopping';
import { SHOP_CATEGORIES } from '../../data/food/words';
import type { MyDayData, ShoppingItem } from '../../data/types';
import { addManual, clearTicked, editItem, removeItem, removeWant, saveItem, tickItem, undoRemove } from './actions';
import { useFoodVisit } from './visit';

function EditRow({ x }: { x: ShoppingItem }) {
  const name = useRef<HTMLInputElement>(null), qty = useRef<HTMLInputElement>(null);
  return (
    <li className="shop-row editing py-2.5 border-t border-outline first:border-t-0">
      <div className="field-row grid grid-cols-2 gap-2.5">
        <Field label="Item" htmlFor="seName" className="min-w-0"><TextInput ref={name} id="seName" type="text" maxLength={80} defaultValue={x.name} /></Field>
        <Field label="Quantity" htmlFor="seQty" className="min-w-0"><TextInput ref={qty} id="seQty" type="text" maxLength={40} defaultValue={shopQty(x)} /></Field>
      </div>
      <div className="row2 flex gap-2.5 mt-2.5">
        <Button inline variant="primary" data-action="h-shop-edit-save" data-id={x.id} onClick={() => saveItem(x.id, name.current?.value || '', qty.current?.value || '')}>Save</Button>
        <Button inline variant="ghost" data-action="h-shop-edit-cancel" onClick={() => editItem(null)}>Cancel</Button>
      </div>
    </li>
  );
}

function ItemRow({ x }: { x: ShoppingItem }) {
  const q = shopQty(x);
  return (
    <li className={`shop-row flex justify-between items-center gap-2 py-1 border-t border-outline first:border-t-0${x.checked ? ' done' : ''}`}>
      <label className="check shop-check flex items-center gap-3 flex-1 min-w-0 min-h-[52px] cursor-pointer">
        <input type="checkbox" data-h="shop-check" data-id={x.id} className="size-[26px] accent-done flex-none" checked={x.checked} onChange={e => tickItem(x.id, e.target.checked)} />
        <span className="min-w-0">
          <strong className={x.checked ? 'line-through text-fg-2' : ''}>{x.name}</strong>
          {q && <> <span className="shop-qty tabular-nums text-fg-2">{q}</span></>}
          {x.recipes.length > 0 && <Meta> · for {x.recipes.join(', ')}</Meta>}
        </span>
      </label>
      <div className="c-actions flex gap-1 flex-none">
        <Button inline variant="ghost" className="!px-0 !w-11" data-action="h-shop-edit" data-id={x.id} aria-label={`Edit ${x.name}`} onClick={() => editItem(x.id)}><Pencil size={16} aria-hidden="true" /></Button>
        <Button inline variant="ghost" className="!px-0 !w-11" data-action="h-shop-remove" data-id={x.id} aria-label={`Remove ${x.name}`} onClick={() => removeItem(x.id)}><X size={18} aria-hidden="true" /></Button>
      </div>
    </li>
  );
}

// The shopping list, grouped by aisle and saved as you go. Ticked items move to their own list.
export function ShoppingView({ data }: { data: MyDayData }) {
  const V = useFoodVisit(), confirm = useConfirm();
  const addRef = useRef<HTMLInputElement>(null);
  const f = data.health.food, open = f.shopping.filter(x => !x.checked), got = f.shopping.filter(x => x.checked);
  const groups = SHOP_CATEGORIES.map(c => [c, open.filter(x => x.category === c)] as const).filter(([, l]) => l.length);
  const row = (x: ShoppingItem) => (V.editing === x.id ? <EditRow key={x.id} x={x} /> : <ItemRow key={x.id} x={x} />);
  function add() {
    const el = addRef.current;
    if (!el || !el.value.trim()) return;
    const text = el.value;
    el.value = ''; // cleared at once, so a second tap can't add it again
    addManual(text);
    el.focus();
  }
  async function clear() {
    if (await confirm({ title: `Clear ${got.length} ticked item${got.length === 1 ? '' : 's'}?`, confirmLabel: 'Clear them', cancelLabel: 'Keep them' })) clearTicked();
  }
  return (
    <>
      <Card aria-labelledby="shop-h">
        <BackLink to="health/food" label="Food" />
        <h2 id="shop-h">Shopping list</h2>
        <Note>{open.length} to get{got.length ? ` · ${got.length} ticked` : ''}. Saved as you go.</Note>
        <form className="inline-add flex gap-2 items-center" onSubmit={e => { e.preventDefault(); add(); }}>
          <label className="sr-only" htmlFor="shopAdd">Add an item</label>
          <TextInput ref={addRef} id="shopAdd" type="text" maxLength={80} placeholder="Add an item, e.g. 2 lemons" enterKeyHint="done" className="flex-1 min-w-0" />
          <Button inline type="submit" className="flex-none" data-action="h-shop-add"><Plus size={16} aria-hidden="true" /> Add</Button>
        </form>
        {V.undo && (
          <div className="undo-bar flex items-center justify-between gap-2.5 mt-2.5 px-3 py-2 rounded-xl bg-inverse text-on-inverse" role="status">
            <span>Removed {V.undo.item.name}.</span>
            <button type="button" className="min-h-11 px-4 rounded-btn border border-on-inverse bg-transparent text-on-inverse font-semibold cursor-pointer" data-action="h-shop-undo" onClick={undoRemove}>Undo</button>
          </div>
        )}
      </Card>
      {groups.length
        ? groups.map(([c, l]) => <Card key={c} aria-label={c}><h3>{c}</h3><ul className="shop-list list-none p-0 mt-1.5 mb-0">{l.map(row)}</ul></Card>)
        : <Card><Note className="m-0">Nothing to get right now.</Note></Card>}
      {got.length > 0 && (
        <Card aria-label="Ticked items">
          <details className="group"><Summary>Ticked ({got.length})</Summary><ul className="shop-list list-none p-0 mt-1.5 mb-0">{got.map(row)}</ul></details>
          <Button inline variant="ghost" className="mt-2" data-action="h-shop-clear" onClick={clear}>Clear ticked items</Button>
        </Card>
      )}
      {f.want.length > 0 && (
        <Card aria-label="Recipes on this list">
          <h3>Recipes on this list</h3>
          {f.want.map(w => { const r = getRecipe(f, w.recipeId); return r && (
            <Row key={w.id}>
              <InlineLink href={`#health/food/recipe/${encodeURIComponent(r.id)}`}>{r.title}</InlineLink>
              <Button inline variant="ghost" className="!px-0 !w-11 flex-none" data-action="h-want-remove" data-id={w.id} aria-label={`Remove ${r.title} from Want to cook`} onClick={() => removeWant(w.id)}><X size={18} aria-hidden="true" /></Button>
            </Row>
          ); })}
          <Note className="mt-2 mb-0">Removing a recipe here keeps its shopping items — tidy those yourself if you like.</Note>
        </Card>
      )}
    </>
  );
}
