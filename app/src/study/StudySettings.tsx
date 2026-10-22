import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useConfirm } from '../components/confirm';
import { exportText, getSnapshot, updateSaved } from '../data/storage';
import { toast } from '../data/toast';
import { resetLearningProgress } from './resetProgress';
import { CommitInput, Field, Select } from '../components/Field';
import type { MyDayData } from '../data/types';
import { setShowClock, setVault } from './actions';
import { BackLink, Note } from './parts';

export function StudySettings({ data }: { data: MyDayData }) {
  const st = data.study.settings;
  const confirm = useConfirm();
  const [backupData, setBackupData] = useState<MyDayData | null>(null);
  const [verifiedBackup, setVerifiedBackup] = useState(false);
  const mounted = useRef(true), confirming = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const freshBackup = backupData === data;
  const canReset = freshBackup && verifiedBackup && getSnapshot().status.kind === 'ok';
  function backup() {
    const snapshot = getSnapshot();
    const file = exportText();
    const url = URL.createObjectURL(new Blob([file.text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = file.filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupData(snapshot.data);
    setVerifiedBackup(false);
    toast('A full MyDay backup was requested. Check your downloads before resetting.');
  }
  async function reset() {
    const backedUp = backupData;
    if (!canReset || confirming.current || getSnapshot().data !== backedUp) return;
    confirming.current = true;
    try {
      if (!(await confirm({ title: 'Reset all Study progress?', body: 'This removes completion marks, Study sessions and their check-ins, Arabic answers and practice attempts, Cybersecurity notebook attempts and evidence, and revision history. Your course outline, concept questions, separate notes and other MyDay sections stay. The reset can reach your other devices. Your checked backup is the way to recover the removed work.', confirmLabel: 'Reset Study progress', cancelLabel: 'Keep my progress' })) || !mounted.current) return;
      if (getSnapshot().data !== backedUp) {
        setBackupData(null); setVerifiedBackup(false);
        toast('MyDay changed since that backup. Download and check a fresh backup before resetting.');
        return;
      }
      if (updateSaved(d => { resetLearningProgress(d); }) === 'saved') {
        setBackupData(null); setVerifiedBackup(false);
        toast('Study progress reset. Your learning paths and materials are still here.');
      } else toast("Couldn't save the reset. Your Study progress is unchanged.");
    } finally { confirming.current = false; }
  }
  return (
    <Card aria-labelledby="sts-h">
      <BackLink to="study" label="Study" />
      <h2 id="sts-h">Study settings</h2>
      <Field label="Default learning subject" htmlFor="studyPrimarySubject">
        <Select id="studyPrimarySubject" data-s="study-primary-subject" value={st.primarySubject} onChange={e => updateSaved(d => { d.study.settings.primarySubject = e.target.value as MyDayData['study']['settings']['primarySubject']; })}>
          <option value="cybersecurity">Cybersecurity</option>
          <option value="arabic">Arabic Fuṣḥā</option>
          <option value="roadmap">My other courses</option>
        </Select>
      </Field>
      <Note>Your selected subject stays the default on Today until you change it. Choosing another subject from Today changes this preference too.</Note>
      <Field label="Obsidian vault name (optional)" htmlFor="stVault">
        <CommitInput key={st.vault} id="stVault" type="text" maxLength={100} data-s="vault" defaultValue={st.vault} placeholder="e.g. Notes" onCommit={el => setVault(el.value)} />
      </Field>
      <Note className="mt-2.5">With a vault name, note paths on concepts and check-ins get an “Open in Obsidian” link. Obsidian opens the note itself — MyDay can't read or change anything in your vault, and Study works fine without it.</Note>
      <label className="check flex items-center gap-2.5 min-h-11 text-[15px] cursor-pointer">
        <input type="checkbox" data-s="show-clock" className="size-[22px] accent-primary flex-none" checked={st.showClock} onChange={e => setShowClock(e.target.checked)} /> Show the clock during learning sessions
      </label>
      <div className="mt-6 pt-4 border-t border-outline" data-s="reset-study-progress">
        <h3>Start learning again from the beginning</h3>
        <p className="text-sm text-fg-2">Reset completion marks, Study sessions and check-ins, revision history, Arabic answers and attempts, and Cybersecurity notebook attempts and evidence. Your course outline, concept questions, separate notes and other MyDay information are kept. The reset can synchronise to your other devices.</p>
        <p className="text-sm text-fg-2">First download and check a complete backup. If MyDay changes afterwards, you will need a fresh backup.</p>
        {backupData && !freshBackup && <p role="status" className="text-sm text-fg-2">MyDay changed since that backup. Download and check a fresh one.</p>}
        {backupData && freshBackup && <label className="check flex items-center gap-2.5 min-h-11 text-[15px] mb-3">
          <input type="checkbox" data-action="study-backup-verified" className="size-[22px] accent-primary flex-none" checked={verifiedBackup} onChange={e => setVerifiedBackup(e.target.checked)} /> I saved and checked the backup file.
        </label>}
        <div className="flex flex-wrap gap-2.5">
          <Button inline data-action="study-backup" onClick={backup}>Download MyDay backup</Button>
          <Button inline variant="ghost" data-action="study-reset" disabled={!canReset} onClick={reset}>Reset Study progress…</Button>
        </div>
      </div>
    </Card>
  );
}
