import { Card } from '../../components/Card';
import { CommitInput, Field } from '../../components/Field';
import { BackLink, Note } from '../../components/parts';
import { EXCLUSIONS } from '../../data/food/words';
import type { MyDayData } from '../../data/types';
import { setBatchOnly, setDislikes, setExclude, setMaxMinutes } from './actions';

// Food preferences: used to leave out recipe ideas and search results. Saved as you change them.
export function PrefsView({ data }: { data: MyDayData }) {
  const p = data.health.food.prefs;
  return (
    <Card aria-labelledby="prefs-h">
      <BackLink to="health/food" label="Food" />
      <h2 id="prefs-h">Food preferences</h2>
      <Note>Used to leave out recipe ideas and search results. Saved as you change them.</Note>
      <h3 className="mt-4">Leave out</h3>
      <div className="loans grid min-[480px]:grid-cols-2 gap-x-4">
        {Object.keys(EXCLUSIONS).map(k => (
          <label key={k} className="check flex items-center gap-2.5 min-h-11 text-[15px] cursor-pointer">
            <input type="checkbox" data-h="pref-ex" data-key={k} className="size-[22px] accent-primary flex-none" checked={p.exclude.includes(k)} onChange={e => setExclude(k, e.target.checked)} /> {EXCLUSIONS[k].label}
          </label>
        ))}
      </div>
      <Note className="mt-2">These check ingredient names and the recipe's category only. They can't guarantee a recipe is free from an allergen — always check the original recipe and packaging.</Note>
      <div className="grid gap-3.5">
        <Field label="Ingredients you don't like (comma-separated)" htmlFor="prefDis">
          <CommitInput key={p.dislikes.join(', ')} id="prefDis" type="text" data-h="pref-dislikes" defaultValue={p.dislikes.join(', ')} placeholder="e.g. olives, coriander" onCommit={el => setDislikes(el.value)} />
        </Field>
        <Field label="Most time you want to spend (minutes)" htmlFor="prefMax">
          <CommitInput key={p.maxMinutes ?? ''} id="prefMax" type="number" inputMode="numeric" min={5} max={600} data-h="pref-max" defaultValue={p.maxMinutes ?? ''} placeholder="No limit" onCommit={el => setMaxMinutes(el.value)} />
        </Field>
      </div>
      <Note className="mt-1.5">Only applies to recipes that list a time — TheMealDB's don't, so they're never hidden by this.</Note>
      <label className="check flex items-center gap-2.5 min-h-11 text-[15px] cursor-pointer">
        <input type="checkbox" data-h="pref-batch" className="size-[22px] accent-primary flex-none" checked={p.batchOnly} onChange={e => setBatchOnly(e.target.checked)} /> Only show my recipes marked good for batch cooking
      </label>
      <Note className="m-0">Batch-cooking info only exists for recipes you add yourself.</Note>
    </Card>
  );
}
