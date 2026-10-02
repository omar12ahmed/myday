import { Card } from '../components/Card';
import { CommitInput, Field } from '../components/Field';
import type { MyDayData } from '../data/types';
import { setShowClock, setVault } from './actions';
import { BackLink, Note } from './parts';

export function StudySettings({ data }: { data: MyDayData }) {
  const st = data.study.settings;
  return (
    <Card aria-labelledby="sts-h">
      <BackLink to="study" label="Study" />
      <h2 id="sts-h">Study settings</h2>
      <Field label="Obsidian vault name (optional)" htmlFor="stVault">
        <CommitInput key={st.vault} id="stVault" type="text" maxLength={100} data-s="vault" defaultValue={st.vault} placeholder="e.g. Notes" onCommit={el => setVault(el.value)} />
      </Field>
      <Note className="mt-2.5">With a vault name, note paths on concepts and check-ins get an “Open in Obsidian” link. Obsidian opens the note itself — MyDay can't read or change anything in your vault, and Study works fine without it.</Note>
      <label className="check flex items-center gap-2.5 min-h-11 text-[15px] cursor-pointer">
        <input type="checkbox" data-s="show-clock" className="size-[22px] accent-primary flex-none" checked={st.showClock} onChange={e => setShowClock(e.target.checked)} /> Show the clock during learning sessions
      </label>
    </Card>
  );
}
