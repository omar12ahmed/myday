import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent } from 'react';
import { useConfirm } from './components/confirm';
import { ConfirmProvider } from './components/Dialog';
import { Toast } from './components/Toast';
import { prettyDate, todayKey } from './data/dates';
import { freshState } from './data/normalize';
import { exportText, parseImport, replaceAll, takeBootNotice, update } from './data/storage';
import { toast } from './data/toast';
import type { Theme } from './data/types';
import { useMyDay } from './data/useMyDay';
import { Nav } from './shell/Nav';
import { sectionFromHash, type SectionId } from './shell/sections';
import { CalendarScreen } from './calendar/CalendarScreen';
import { PayScreen } from './pay/PayScreen';
import { StudyScreen } from './study/StudyScreen';
import { NotMovedYet } from './shell/NotMovedYet';
import { DamagedView, OlderView } from './shell/StatusScreens';
import { ThemeButton } from './shell/ThemeButton';
import { TodayScreen } from './today/TodayScreen';

// Saves text as a file the browser downloads (backups and the unreadable-data copy).
function download(filename: string, text: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// The section in the address (#today, #calendar…), kept in step with the browser's back button.
const subscribeHash = (fn: () => void) => { window.addEventListener('hashchange', fn); return () => window.removeEventListener('hashchange', fn); };
const getHash = () => window.location.hash;

const reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

function Shell() {
  const { data, status, generation } = useMyDay();
  const confirm = useConfirm();
  const hash = useSyncExternalStore(subscribeHash, getHash);
  const section: SectionId = sectionFromHash(hash);
  const [k, setK] = useState(todayKey);
  const fileInput = useRef<HTMLInputElement>(null);
  const theme: Theme = data.settings.theme;
  const motionAllowed = data.settings.motion !== 'off' && !reduceQuery?.matches;

  // Keep the date honest: check every 30 seconds (covers midnight) and when the app comes back into view.
  useEffect(() => {
    const check = () => setK(todayKey());
    const id = setInterval(check, 30000);
    document.addEventListener('visibilitychange', check);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', check); };
  }, []);

  // A message from start-up (e.g. storage is blocked), shown once.
  useEffect(() => { const m = takeBootNotice(); if (m) toast(m); }, []);

  // Theme and animations: set on the page so the colours and motion follow straight away.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-motion', data.settings.motion === 'off' ? 'off' : 'auto');
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
  }, [theme, data.settings.motion]);

  // Moving between sections starts at the top of the page.
  useEffect(() => { window.scrollTo(0, 0); }, [section]);

  function exportData() {
    const { filename, text } = exportText();
    download(filename, text);
    toast('Exported.');
  }

  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // so choosing the same file again still works
    if (!file) return;
    let text: string;
    try { text = await file.text(); } catch { toast("Couldn't open that file."); return; }
    let result: ReturnType<typeof parseImport>;
    try { result = parseImport(text); } catch (err) { toast((err as Error).message + ' Nothing was changed.'); return; }
    const yes = await confirm({
      title: 'Replace your saved MyDay data with this file?',
      body: (
        <>
          <p>{result.summary}</p>
          {result.dropped > 0 && <p>{result.dropped} unreadable entr{result.dropped === 1 ? 'y' : 'ies'} will be skipped.</p>}
          <p>Your current data on this device will be overwritten. You might want to export it first.</p>
        </>
      ),
      confirmLabel: 'Replace my data',
      cancelLabel: 'Cancel',
    });
    if (!yes) { toast('Import cancelled. Nothing was changed.'); return; }
    if (replaceAll(result.data)) toast('Imported.');
  }

  async function startFresh() {
    const yes = await confirm({
      title: 'Start fresh?',
      body: 'The unreadable saved data will be replaced. Download it first if you might want it later.',
      confirmLabel: 'Start fresh',
    });
    if (yes) replaceAll(freshState());
  }

  const blocked = status.kind === 'damaged' || status.kind === 'older';
  let content;
  if (status.kind === 'damaged') {
    content = <DamagedView reason={status.reason} onImport={() => fileInput.current?.click()} onStartFresh={startFresh}
      onDownload={() => download(`myday-unreadable-${todayKey()}.json`, status.raw)} />;
  } else if (status.kind === 'older') content = <OlderView />;
  else if (section === 'today') {
    content = <TodayScreen key={k} data={data} generation={generation} k={k} canSave={status.kind === 'ok'} motionAllowed={motionAllowed}
      onExport={exportData} onImport={() => fileInput.current?.click()} />;
  } else if (section === 'calendar') content = <CalendarScreen data={data} canSave={status.kind === 'ok'} motionAllowed={motionAllowed} />;
  else if (section === 'pay') content = <PayScreen data={data} canSave={status.kind === 'ok'} />;
  else if (section === 'study') content = <StudyScreen data={data} hash={hash} />;
  else content = <NotMovedYet section={section} />;

  return (
    <>
      <header className="appbar sticky top-0 z-20 bg-glass backdrop-blur-[18px] backdrop-saturate-[140%] border-b border-outline">
        <div className="max-w-[640px] lg:max-w-[1120px] mx-auto px-4 lg:px-6 py-3 pt-[max(12px,env(safe-area-inset-top))] flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[.14em] uppercase text-primary m-0">MyDay</p>
            <h1 id="date" className="text-[26px] lg:text-[28px] font-bold tracking-[-.02em] leading-tight m-0">{prettyDate(k)}</h1>
          </div>
          <ThemeButton theme={theme} motionAllowed={motionAllowed} onChange={next => update(d => { d.settings.theme = next; })} />
        </div>
      </header>
      {!blocked && <Nav current={section} />}
      <main id="app" className="max-w-[640px] lg:max-w-[1120px] mx-auto px-4 lg:px-6 pt-4 lg:pt-6">
        {content}
      </main>
      <input ref={fileInput} id="importFile" type="file" accept="application/json,.json" hidden onChange={importFile} />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <ConfirmProvider>
      <Shell />
    </ConfirmProvider>
  );
}
