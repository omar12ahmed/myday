import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Note } from '../components/parts';
import { isBusiness, isCase } from '../data/businessModel';
import { matchCount, SEARCH_KIND_LABEL, type SearchHit } from '../data/projectSearch';
import type { Project } from '../data/types';

// "Search this project": what was found, in a fixed order by kind (data/projectSearch.ts). Shown above the tab, which
// stays as it was but hidden; Clear (or Escape) brings it back, and opening a result goes to the item itself.
export function SearchResults({ p, hits, query, onClear, onPick }: { p: Project; hits: SearchHit[]; query: string; onClear: () => void; onPick: (h: SearchHit) => void }) {
  const parts = ['what it’s about', 'its tasks', 'notes', 'milestones', 'decisions', ...(isBusiness(p) ? ['its one page'] : []), ...(isCase(p) ? ['its timeline, evidence and issues'] : [])];
  const where = `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return (
    <Card aria-labelledby="pjSearchH" id="projectSearchResults">
      <div className="flex items-start justify-between gap-3">
        <h3 id="pjSearchH" className="m-0 min-w-0 flex-1 break-words">{matchCount(hits.length, query)}</h3>
        <Button inline variant="ghost" className="flex-none -mt-2" data-action="search-clear" onClick={onClear}>Clear</Button>
      </div>
      {hits.length > 0 ? (
        <ul className="list-none p-0 m-0 mt-2">{hits.map(h => (
          <li key={`${h.kind}:${h.id}`} className="border-t border-outline first:border-t-0" data-s="search-hit" data-kind={h.kind}>
            <a href={h.href} onClick={e => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) onPick(h); }}
              className="block min-h-11 py-2.5 text-fg no-underline hover:bg-surface-2 rounded-tile -mx-2 px-2">
              <span className="block text-sm text-fg-2">{SEARCH_KIND_LABEL[h.kind]}{h.done ? ` · ${h.done === 'done' ? 'Done' : 'Let go'}` : ''}{h.private ? ' · Private' : ''}</span>
              <span className="block font-medium break-words">{h.title}</span>
              {h.excerpt && <span className="block text-sm text-fg-2 break-words mt-0.5" data-s="search-excerpt">{h.excerpt}</span>}
            </a>
          </li>))}
        </ul>
      ) : <Note className="mb-0 mt-2">It looks at {where}. Every word you type has to be there, in any order.</Note>}
    </Card>
  );
}
