import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { todayKey } from '../data/dates';
import { update } from '../data/storage';
import { letGoOf, oldStarters, removeOldStarters, restoreOldStarters, saveTidyPrefs, TIDY_GROUP_LABEL, tidyCandidates, tidyPrefs, tidyResting, undoLetGo, type TidyGroup, type TidyItem, type TidyPrefs } from '../data/tidy';
import { toast } from '../data/toast';
import type { DateKey, ListItem, MyDayData } from '../data/types';

type Undo = { kind: 'tasks'; ids: string[]; day: DateKey } | { kind: 'starters'; removed: { item: ListItem; at: number }[] };
// After an action takes away what had focus: to the card's heading, or the Tasks heading when the card has gone.
const focusSoon = (id: string) => requestAnimationFrame(() => (document.getElementById(id) ?? document.getElementById('tasks-h'))?.focus());

// At the top of Tasks: your unfinished tasks that look old or unrelated, by reason, each with Let go and Keep, and Let
// go of all these (with Undo); and the old learning starters, which you can remove. Nothing is deleted but those, and
// only when you choose. Tasks in a project you haven't finished are folded apart, left to you (they're its next steps).
// Keep and Not now are remembered on this device only (specs/today-learning-and-tidy.md §4).
export function TidyCard({ data }: { data: MyDayData }) {
  const k = todayKey();
  const [prefs, setPrefs] = useState(tidyPrefs);
  const [undo, setUndo] = useState<Undo | null>(null);
  // After letting go of several (or removing the starters), focus goes to Undo, so it's heard and one key away.
  useEffect(() => { if (undo) document.querySelector<HTMLElement>('[data-action=tidy-undo]')?.focus(); }, [undo]);
  const items = tidyCandidates(data, k, new Set(prefs.kept)), starters = prefs.keptStarters ? [] : oldStarters(data);
  const main = items.filter(i => i.group !== 'old-in-project'), inProjects = items.filter(i => i.group === 'old-in-project');
  const remember = (p: TidyPrefs) => { setPrefs(p); saveTidyPrefs(p); };

  if (undo) {
    const n = undo.kind === 'tasks' ? undo.ids.length : undo.removed.length;
    const doUndo = () => {
      if (update(d => { if (!(undo.kind === 'tasks' ? undoLetGo(d, undo.ids, undo.day) : restoreOldStarters(d, undo.removed))) return false; })) toast('Back as they were.');
      setUndo(null); focusSoon('tidy-h');
    };
    return (
      <Card aria-labelledby="tidy-h" data-s="tidy-undo">
        <h2 id="tidy-h" tabIndex={-1} className="m-0">Tidy up</h2>
        <p className="m-0 mt-2">{undo.kind === 'tasks'
          ? `${n === 1 ? 'One task' : `${n} tasks`} let go — they’re kept under Done.`
          : `${n === 1 ? 'One starter item' : `${n} starter items`} removed from your Learning list.`}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button inline variant="ghost" data-action="tidy-undo" onClick={doUndo}>Undo</Button>
          <Button inline variant="quiet" data-action="tidy-undo-close" onClick={() => { setUndo(null); focusSoon('tidy-h'); }}>Done</Button>
        </div>
      </Card>
    );
  }
  if ((!main.length && !starters.length) || tidyResting(prefs.notNowOn, k)) return null;

  const letGo = (ids: string[]) => {
    let changed: string[] = [];
    if (!update(d => { changed = letGoOf(d, ids, k); if (!changed.length) return false; })) return;
    if (ids.length > 1) setUndo({ kind: 'tasks', ids: changed, day: k });
    else { toast('Let go. It’s kept under Done.'); focusSoon('tidy-h'); }
  };
  const removeStarters = () => {
    let removed: { item: ListItem; at: number }[] = [];
    if (update(d => { removed = removeOldStarters(d); if (!removed.length) return false; })) setUndo({ kind: 'starters', removed });
  };
  const rows = (list: TidyItem[]) => (
    <ul className="m-0 mt-1 p-0 list-none grid gap-2">
      {list.map(i => (
        <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-tile bg-surface-2 px-3 py-2" data-s="tidy-item" data-id={i.id}>
          <div className="flex-1 min-w-48">
            <a href={`#today/tasks/${i.id}`} className="inline-flex items-center min-h-11 text-fg font-medium break-words">{i.title}</a>
            <p className="m-0 text-sm text-fg-2">{i.why}</p>
          </div>
          <span className="flex gap-2">
            <Button inline variant="ghost" data-action="tidy-let-go" aria-label={`Let go: ${i.title}`} onClick={() => letGo([i.id])}>Let go</Button>
            <Button inline variant="quiet" data-action="tidy-keep" aria-label={`Keep: ${i.title}`} onClick={() => { remember({ ...prefs, kept: [...prefs.kept, i.id] }); toast('Kept. It won’t be suggested here again.'); focusSoon('tidy-h'); }}>Keep</Button>
          </span>
        </li>
      ))}
    </ul>
  );
  const groups: TidyGroup[] = ['gone', 'finished', 'old'];
  return (
    <Card aria-labelledby="tidy-h" data-s="tidy">
      <h2 id="tidy-h" tabIndex={-1} className="m-0">Tidy up</h2>
      {main.length > 0 && <p className="m-0 mt-2 text-fg-2">{main.length === 1 ? 'One task looks' : `${main.length} tasks look`} old or unrelated. Let go of any you no longer need: they’re kept under Done, and nothing is deleted.</p>}
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
      {main.length > 1 && <div className="mt-3"><Button inline variant="tonal" data-action="tidy-all" onClick={() => letGo(main.map(i => i.id))}>Let go of all these ({main.length})</Button></div>}
      {starters.length > 0 && (
        <section className="mt-4" data-s="tidy-starters">
          <h3 className="m-0 text-[15px]">Starter items MyDay added</h3>
          <p className="m-0 mt-1 text-sm text-fg-2">Your Learning list still has {starters.length === 1 ? 'one item' : `${starters.length} items`} MyDay added when you started: {starters.map(i => i.title).join('; ')}. Today’s learning now comes from Study, so {starters.length === 1 ? 'it isn’t' : 'they aren’t'} used. Remove {starters.length === 1 ? 'it' : 'them'}?</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button inline variant="ghost" data-action="tidy-starters-remove" onClick={removeStarters}>Remove {starters.length === 1 ? 'it' : 'them'}</Button>
            <Button inline variant="quiet" data-action="tidy-starters-keep" onClick={() => { remember({ ...prefs, keptStarters: true }); focusSoon('tidy-h'); }}>Keep {starters.length === 1 ? 'it' : 'them'}</Button>
          </div>
        </section>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        <Button inline variant="quiet" data-action="tidy-not-now" onClick={() => { remember({ ...prefs, notNowOn: k }); focusSoon('tasks-h'); }}>Not now</Button>
      </div>
    </Card>
  );
}
