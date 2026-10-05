import { Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { noteName } from '../data/notes';
import { projectById } from '../data/projects';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';
import { bothMention, keepLink, madeByMyDay, unlink } from '../data/understand';

const SHOWN = 8;

// "MyDay connected these": the notes MyDay put in a project by itself, each with why, and Keep (it's yours now) or
// Undo (out of that project, and never put back in it). Nothing MyDay links is hidden from you.
export function ConnectedCard({ data }: { data: MyDayData }) {
  const made = madeByMyDay(data);
  if (!made.length) return null;
  const keepAll = () => { if (update(d => { let n = 0; for (const x of madeByMyDay(d)) if (keepLink(d, x.id)) n++; if (!n) return false; })) toast('All kept.'); };
  return (
    <Card aria-labelledby="connected-h" id="noteConnected">
      <h3 id="connected-h" className="flex items-center gap-2"><Sparkles size={18} aria-hidden="true" className="text-primary" /> MyDay connected these <span className="text-fg-3 font-normal tabular-nums">{made.length}</span></h3>
      <ul className="list-none p-0 m-0">
        {made.slice(0, SHOWN).map(n => {
          const p = projectById(data, n.projectId);
          return (
            <li key={n.id} className="flex flex-wrap items-center gap-x-2 border-t border-outline first:border-t-0 py-1.5" data-id={n.id} data-s="connected">
              <a href={`#projects/notes/${n.id}`} className="flex-1 min-w-[12rem] min-h-11 py-1 text-fg no-underline">
                <span className="block font-medium break-words">{noteName(n)}</span>
                <span className="block text-sm text-fg-2">→ {p?.title ?? 'a project'}{n.linkWhy ? <span className="text-fg-3"> · {bothMention(n.linkWhy)}</span> : null}</span>
              </a>
              <span className="flex">
                <Button inline variant="ghost" className="!border-transparent" data-action="connected-keep" data-id={n.id} onClick={() => { if (update(d => (keepLink(d, n.id) ? undefined : false))) toast('Kept.'); }}>Keep</Button>
                <Button inline variant="ghost" className="!border-transparent" data-action="connected-undo" data-id={n.id} onClick={() => { if (update(d => (unlink(d, n.id) ? undefined : false))) toast('Taken out — MyDay won\'t put it back in that project.'); }}>Undo</Button>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-fg-2 m-0 mt-2 flex flex-wrap items-center justify-between gap-2">
        <span>{made.length > SHOWN ? `And ${made.length - SHOWN} more. ` : ''}Only links: nothing you wrote was changed.</span>
        {made.length > 1 && <Button inline variant="ghost" data-action="connected-keep-all" onClick={keepAll}>Keep all</Button>}
      </p>
    </Card>
  );
}
