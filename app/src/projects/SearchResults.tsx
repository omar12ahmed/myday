import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Note } from '../components/parts';
import { isBusiness, isCase } from '../data/businessModel';
import { searchProject, SEARCH_KIND_LABEL } from '../data/projectSearch';
import type { MyDayData, Project } from '../data/types';

// "Search this project": what was found, in a fixed order by kind, each opening its item (data/projectSearch.ts).
// Shown instead of the tab while there's something in the search field; Clear (or Escape) brings the tab back.
export function SearchResults({ data, p, query, onClear }: { data: MyDayData; p: Project; query: string; onClear: () => void }) {
  const hits = searchProject(data, p, query), q = query.trim();
  const where = ['its tasks', 'notes', 'milestones', 'decisions', isBusiness(p) && 'one page', isCase(p) && 'timeline, evidence and issues'].filter(Boolean).join(', ');
  return (
    <Card aria-labelledby="pjSearchH" id="projectSearchResults">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 id="pjSearchH" className="m-0 min-w-0 break-words" aria-live="polite">
          {hits.length ? `${hits.length} ${hits.length === 1 ? 'match' : 'matches'} for “${q}”` : `Nothing in this project matches “${q}”`}
        </h3>
        <Button inline variant="ghost" className="flex-none -mt-2" data-action="search-clear" onClick={onClear}>Clear</Button>
      </div>
      {hits.length > 0 ? (
        <ul className="list-none p-0 m-0 mt-2">{hits.map(h => (
          <li key={`${h.kind}:${h.id}`} className="border-t border-outline first:border-t-0" data-s="search-hit" data-kind={h.kind}>
            <a href={h.href} onClick={onClear} className="block min-h-11 py-2.5 text-fg no-underline hover:bg-surface-2 rounded-tile -mx-2 px-2">
              <span className="block text-sm text-fg-2">{SEARCH_KIND_LABEL[h.kind]}{h.done ? ` · ${h.done === 'done' ? 'Done' : 'Let go'}` : ''}</span>
              <span className="block font-medium break-words">{h.title}</span>
              {h.excerpt && <span className="block text-sm text-fg-2 break-words mt-0.5" data-s="search-excerpt">{h.excerpt}</span>}
            </a>
          </li>))}
        </ul>
      ) : <Note className="mb-0 mt-2">It looks at what the project is about and {where}. Every word you type has to be there, in any order.</Note>}
    </Card>
  );
}
