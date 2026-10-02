import { Eye, FileText, FolderOpen, Info } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Banner } from './components/Banner';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { prettyDate, todayKey } from './data/dates';
import { loadSaved, readBackup, type Loaded } from './data/storage';
import { TodayScreen } from './screens/TodayScreen';

export default function App() {
  const [loaded, setLoaded] = useState<Loaded>(loadSaved);
  const [backupName, setBackupName] = useState<string | null>(null); // set while showing a backup file
  const fileInput = useRef<HTMLInputElement>(null);

  // Use the theme from the data being shown (dark is the default, as in the current MyDay).
  const theme = loaded.status === 'ok' ? loaded.data.settings.theme : 'dark';
  useEffect(() => {
    if (theme === 'dark') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  async function openBackup(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // so choosing the same file again still works
    if (!file) return;
    const result = readBackup(await file.text());
    setLoaded(result);
    setBackupName(result.status === 'ok' ? file.name : null);
  }

  return (
    <>
      <header className="sticky top-0 z-20 bg-glass backdrop-blur-[18px] backdrop-saturate-[140%] border-b border-outline">
        <div className="max-w-[640px] mx-auto px-4 py-3 pt-[max(12px,env(safe-area-inset-top))]">
          <p className="text-xs font-bold tracking-[.14em] uppercase text-primary m-0">MyDay</p>
          <h1 className="text-[26px] font-bold tracking-[-.02em] leading-tight m-0">{prettyDate(todayKey())}</h1>
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-4 pt-5 pb-10">
        <Banner icon={<Eye size={18} />}>
          <strong className="font-semibold">A preview of the new MyDay.</strong> It shows your saved plan but can't change
          anything yet. Keep using the current MyDay to plan and tick things off.
        </Banner>

        {backupName && (
          <Banner tone="notice" icon={<FileText size={18} />}>
            Showing the backup file “{backupName}”. Nothing from it is saved.
          </Banner>
        )}

        {loaded.status === 'ok' && (
          <>
            {loaded.dropped > 0 && (
              <Banner tone="notice" icon={<Info size={18} />}>
                {loaded.dropped === 1 ? '1 entry' : `${loaded.dropped} entries`} couldn't be read, so {loaded.dropped === 1 ? "it isn't" : "they aren't"} shown here.
              </Banner>
            )}
            <TodayScreen data={loaded.data} />
          </>
        )}

        {loaded.status === 'empty' && (
          <Card>
            <h2>Nothing saved here yet</h2>
            <p className="text-[15px] text-fg-2 mb-0">
              There's no MyDay data in this browser at this address. To look at your own plan, choose “Export my data” in the
              current MyDay, then open that file here.
            </p>
          </Card>
        )}

        {loaded.status === 'older' && (
          <Card>
            <h2>Your data needs a quick update first</h2>
            <p className="text-[15px] text-fg-2 mb-0">
              It was saved by an older version of MyDay. Open the current MyDay once and it will update it, then come back here.
            </p>
          </Card>
        )}

        {loaded.status === 'problem' && (
          <Card tone="notice">
            <h2>This can't be shown</h2>
            <p className="text-[15px] mb-0">{loaded.message} Nothing has been changed.</p>
          </Card>
        )}

        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={openBackup} />
        <Button variant="ghost" inline onClick={() => fileInput.current?.click()}>
          <FolderOpen size={18} aria-hidden="true" />
          Open a backup file
        </Button>
      </main>
    </>
  );
}
