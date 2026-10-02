import { Search } from 'lucide-react';
import { useRef, type KeyboardEvent } from 'react';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/Field';
import { getSnapshot } from '../../data/storage';
import type { Recipe } from '../../data/types';
import { search } from './actions';
import { closeTypeahead, onTyping, typeaheadList, useFoodVisit } from './visit';

// Bold the part of a title that matches what you typed.
function Marked({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<strong className="text-primary font-bold">{text.slice(i, i + q.length)}</strong>{text.slice(i + q.length)}</>;
}

// The search box, with suggestions underneath while you type: your saved recipes straight away, then
// TheMealDB's once you pause. ↓ / ↑ move through them, Escape closes them, Enter runs a full search.
export function SearchBox() {
  const V = useFoodVisit(), t = V.typeahead;
  const box = useRef<HTMLInputElement>(null), wrap = useRef<HTMLDivElement>(null);
  const saved = getSnapshot().data.health.food.recipes;
  const { list, more, hidden } = t.open ? typeaheadList() : { list: [] as Recipe[], more: false, hidden: 0 };
  const ql = t.q.toLowerCase();
  const notes: string[] = [];
  if (t.open) {
    if (t.loading) notes.push('Looking on TheMealDB…');
    if (t.error) notes.push(`${t.error} Showing your saved recipes only.`);
    if (!t.loading && !list.length) notes.push(`No suggestions for “${t.q}”.`);
    if (hidden) notes.push(`${hidden} left out because of your preferences.`);
    if (more) notes.push('Press Search to see them all.');
  }
  function keys(e: KeyboardEvent) {
    if (e.key === 'Enter' && e.target === box.current) { e.preventDefault(); search(box.current.value); return; }
    if (!t.open) return;
    const items = [...(wrap.current?.querySelectorAll<HTMLAnchorElement>('.ta-item') || [])], i = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === 'Escape') { e.preventDefault(); closeTypeahead(); box.current?.focus(); }
    else if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); items[Math.min(i + 1, items.length - 1)].focus(); }
    else if (e.key === 'ArrowUp' && i >= 0) { e.preventDefault(); (i === 0 ? box.current : items[i - 1])?.focus(); }
  }
  return (
    <div className="food-search" ref={wrap} onKeyDown={keys}>
      <form className="search-row flex gap-2" role="search" onSubmit={e => { e.preventDefault(); search(box.current?.value || ''); }}>
        <label className="sr-only" htmlFor="foodQ">Search recipes</label>
        <TextInput ref={box} id="foodQ" type="search" placeholder="Search recipes" value={t.text} enterKeyHint="search" autoComplete="off" aria-controls="foodSuggest"
          className="flex-1 min-w-0" onChange={e => onTyping(e.target.value)} />
        <Button inline type="submit" data-action="h-food-search" className="flex-none"><Search size={16} aria-hidden="true" /> Search</Button>
      </form>
      <div id="foodSuggest">
        {list.length > 0 && (
          <ul className="ta-list list-none p-0 mt-2 mb-0 bg-surface-2 border border-outline rounded-tile overflow-hidden" aria-label="Suggestions">
            {list.map(r => {
              const own = !!saved[r.id];
              const ing = r.title.toLowerCase().includes(ql) ? null : r.ingredients.find(i => i.name.toLowerCase().includes(ql));
              const meta = [own ? (r.source === 'manual' ? 'Your recipe' : 'Saved') : [r.category, r.area].filter(Boolean).join(' · '), ing ? `has ${ing.name}` : ''].filter(Boolean).join(' · ');
              return (
                <li key={r.id} className="border-t border-outline first:border-t-0">
                  <a className="ta-item grid gap-0.5 content-center min-h-[52px] px-3.5 py-2 text-fg no-underline hover:bg-surface-3 focus-visible:outline-offset-[-3px]" href={`#health/food/recipe/${encodeURIComponent(r.id)}`} onClick={() => closeTypeahead()}>
                    <span className="ta-title"><Marked text={r.title} q={t.q} /></span>
                    {meta && <span className="meta text-sm text-fg-3">{meta}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        {notes.length > 0 && <p className="ta-note text-[15px] text-fg-2 mt-2 mb-0">{notes.join(' ')}</p>}
      </div>
      <p className="sr-only" id="foodSuggestCount" role="status">{!t.open || (t.loading && !list.length) ? '' : list.length ? `${list.length} suggestion${list.length === 1 ? '' : 's'}` : 'No suggestions'}</p>
    </div>
  );
}
