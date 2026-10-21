import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { exportText, update } from '../data/storage';
import { toast } from '../data/toast';
import { resetLearningProgress } from './resetProgress';
import { CommitInput, Field } from '../components/Field';
import type { MyDayData } from '../data/types';
import { setShowClock, setVault } from './actions';
import { BackLink, Note } from './parts';

export function StudySettings({ data }: { data: MyDayData }) {
  const st = data.study.settings;
  const confirm = useConfirm();
  const [backedUp, setBackedUp] = useState(false);
  function backup() {
    const file = exportText();
    const url = URL.createObjectURL(new Blob([file.text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = file.filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackedUp(true);
    toast('A full MyDay backup was requested. Check your downloads before resetting.');
  }
  async function reset() {
    if (!backedUp) return;
    if (!(await confirm({ title: 'Reset all Study progress?', body: 'Your saved Study sessions, completion marks, Arabic practice attempts, Cybersecurity attempts and revision history will be removed. Your curricula, lessons, notes, questions, learning resources and other MyDay sections will stay. This change may sync to your other devices. Check that your backup was downloaded before continuing.', confirmLabel: 'Reset Study progress', cancelLabel: 'Keep my progress' }))) return;
    if (update(d => { resetLearningProgress(d); })) {
      setBackedUp(false);
      toast('Study progress reset. Your learning paths and materials are still here.');
    }
  }
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
      <div className="mt-6 pt-4 border-t border-outline" data-s="reset-study-progress">
        <h3>Start learning again from the beginning</h3>
        <p className="text-sm text-fg-2">Reset your Study completion, session history, revision schedule, Arabic practice and Cybersecurity attempts. Your curricula, lessons, notes and other MyDay information are kept. The reset can synchronise to your other devices.</p>
        <p className="text-sm text-fg-2">First download and verify a complete backup. The reset remains disabled until you have requested one.</p>
        <div className="flex flex-wrap gap-2.5">
          <Button inline data-action="study-backup" onClick={backup}>Download MyDay backup</Button>
          <Button inline variant="ghost" data-action="study-reset" disabled={!backedUp} onClick={reset}>Reset Study progress…</Button>
        </div>
      </div>
    </Card>
  );
}
