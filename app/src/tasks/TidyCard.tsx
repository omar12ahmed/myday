import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { todayKey } from '../data/dates';
import { update } from '../data/storage';
import { letGoOf, saveTidyPrefs, TIDY_GROUP_LABEL, tidyCandidates, tidyPrefs, tidyResting, undoLetGo, type TidyGroup, type TidyItem } from '../data/tidy';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';

// At the top of Tasks: your unfinished tasks that look old or unrelated, by reason, each with Let go and Keep, and Let
// go of all these (with Undo). Nothing is deleted. Tasks in an active project are folded apart, left to you (the
// project's own next steps). Keep and Not now are remembered on this device only (specs/today-learning-and-tidy.md §4).
export function TidyCard({ data }: { data: MyDayData }) {
  const k = todayKey();
  const [prefs, setPrefs] = useState(tidyPrefs);
  const [undo, setUndo] = useState<string[] | null>(null);
  const items = tidyCandidates(data, k, new Set(prefs.kept));
  const main = items.filter(i => i.group !== 'old-in-project'), inProjects = items.filter(i => i.group === 'old-in-project');
  const remember = (p: typeof prefs) => { setPrefs(p); saveTidyPrefs(p); };

  if (undo) return (
    <Card aria-labelledby="tidy-h" data-s="tidy-undo">
      <h2 id="tidy-h" className="m-0">Tidy up</h2>
      <p className="m-0 mt-2" role="status">Let go of {undo.length === 1 ? 'one task' : `${undo.length} tasks`}. They’re kept under Done.</p>
      <div className="flex flex-wrap gap-2 mt-3">
        <Button inline variant="ghost" data-action="tidy-undo" onClick={() => { if (update(d => { if (!undoLetGo(d, undo, k)) return false; })) toast('Back as they were.'); setUndo(null); }}>Undo</Button>
        <Button inline variant="quiet" data-action="tidy-undo-close" onClick={() => setUndo(null)}>Done</Button>
      </div>
    </Card>
  );
  if (!main.length || tidyResting(prefs.notNowOn, k)) return null;

  const letGo = (ids: string[]) => {
    let changed: string[] = [];
    if (!update(d => { changed = letGoOf(d, ids, k); if (!changed.length) return false; })) return;
    if (ids.length > 1) setUndo(changed);
    else toast('Let go. It’s kept under Done.');
  };
  const rows = (list: TidyItem[]) => (
    <ul className="m-0 mt-1 p-0 list-none grid gap-2">
      {list.map(i => (
        <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-tile bg-surface-2 px-3 py-2" data-s="tidy-item" data-id={i.id}>
          <div className="flex-1 min-w-48">
            <a href={`#today/tasks/${i.id}`} className="text-fg font-medium break-words">{i.title}</a>
            <p className="m-0 text-sm text-fg-2">{i.why}</p>
          </div>
          <span className="flex gap-2">
            <Button inline variant="ghost" data-action="tidy-let-go" aria-label={`Let go: ${i.title}`} onClick={() => letGo([i.id])}>Let go</Button>
            <Button inline variant="quiet" data-action="tidy-keep" aria-label={`Keep: ${i.title}`} onClick={() => remember({ ...prefs, kept: [...prefs.kept, i.id] })}>Keep</Button>
          </span>
        </li>
      ))}
    </ul>
  );
  const groups: TidyGroup[] = ['gone', 'finished', 'old'];
  return (
    <Card aria-labelledby="tidy-h" data-s="tidy">
      <h2 id="tidy-h" className="m-0">Tidy up</h2>
      <p className="m-0 mt-2 text-fg-2">{main.length === 1 ? 'One task looks' : `${main.length} tasks look`} old or unrelated. Let go of any you no longer need: they’re kept under Done, and nothing is deleted.</p>
      {groups.map(g => {
        const list = main.filter(i => i.group === g);
        return list.length ? <section key={g} className="mt-3" data-s="tidy-group" data-group={g}><h3 className="m-0 text-[15px]">{TIDY_GROUP_LABEL[g]}</h3>{rows(list)}</section> : null;
      })}
      {inProjects.length > 0 && (
        <details className="mt-3" data-s="tidy-in-projects">
          <summary className="cursor-pointer min-h-11 flex items-center text-primary font-semibold">{TIDY_GROUP_LABEL['old-in-project']} ({inProjects.length}) — left to you</summary>
          <p className="m-0 text-sm text-fg-2">From more than 2 weeks ago, but still one of a project’s next steps.</p>
          {rows(inProjects)}
        </details>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {main.length > 1 && <Button inline variant="tonal" data-action="tidy-all" onClick={() => letGo(main.map(i => i.id))}>Let go of all these ({main.length})</Button>}
        <Button inline variant="quiet" data-action="tidy-not-now" onClick={() => remember({ ...prefs, notNowOn: k })}>Not now</Button>
      </div>
    </Card>
  );
}
