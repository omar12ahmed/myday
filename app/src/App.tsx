import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent } from 'react';
import { exploreRoute, projectHref } from './explore/route';
import { ExploreBoundary } from './explore/ExploreBoundary';
import { Card } from './components/Card';
import { useConfirm } from './components/confirm';
import { ConfirmProvider } from './components/Dialog';
import { Toast } from './components/Toast';
import { prettyDate, todayKey } from './data/dates';
import { freshState } from './data/normalize';
import { dismissLoadIssue, exportText, getLoadIssue, parseImport, replaceAll, takeBootNotice, update } from './data/storage';
import { toast } from './data/toast';
import type { Theme } from './data/types';
import { useMyDay } from './data/useMyDay';
import { Nav } from './shell/Nav';
import { AccountChip, FocusSwitch } from './shell/TopBar';
import { barSection, SECTIONS, sectionFromHash, type SectionId } from './shell/sections';
import { NoticedScreen } from './patterns/NoticedScreen';
import { KnowsScreen } from './knows/KnowsScreen';
import { ReviewScreen } from './review/ReviewScreen';
import { ProjectsScreen } from './projects/ProjectsScreen';
import { useAiConnect } from './shell/aiConnect';
import { useAutoConnect } from './shell/autoConnect';
import { fixLegacyHash } from './shell/legacyLinks';
import { TasksScreen } from './tasks/TasksScreen';
import { CaptureButton } from './capture/CaptureSheet';
import { CalendarScreen } from './calendar/CalendarScreen';
import { FinanceScreen } from './finance/FinanceScreen';
import { StudyScreen } from './study/StudyScreen';
import { HealthScreen } from './health/HealthScreen';
import { AppFooter } from './shell/AppFooter';
import { LoadIssue } from './shell/LoadIssue';
import { DamagedView, OlderView } from './shell/StatusScreens';
import { ThemeButton } from './shell/ThemeButton';
import { TodayScreen } from './today/TodayScreen';
import { SYNC } from './sync/config';
import { noteImported } from './sync/engine';
import { SyncBadge } from './sync/SyncBadge';
import { SyncScreen } from './sync/SyncScreen';
import { signInRequired } from './sync/gate';
import { SignInGate } from './sync/SignInGate';
import { useSync } from './sync/engine';

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
// Older links (#inbox…, #notes…) are rewritten to where those screens are now, before anything reads the address.
fixLegacyHash();
const subscribeHash = (fn: () => void) => {
  const on = () => { fixLegacyHash(); fn(); };
  window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on);
};
const getHash = () => window.location.hash;

const reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const ExploreScreen = lazy(() => import('./explore/ExploreScreen'));

function Shell() {
  const { data, status, generation } = useMyDay();
  const confirm = useConfirm();
  const hash = useSyncExternalStore(subscribeHash, getHash);
  const section: SectionId = sectionFromHash(hash);
  const [k, setK] = useState(todayKey);
  const fileInput = useRef<HTMLInputElement>(null);
  const [loadIssue, setLoadIssue] = useState(getLoadIssue);
  const sync = useSync();
  const [useHere, setUseHere] = useState(false); // "Use MyDay on this device for now" (until it's next opened)
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
    const updateBar = () => {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
    };
    updateBar();
    // The installed app's status bar must follow an OS theme change while Match device is selected.
    const device = theme === 'auto' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    device?.addEventListener('change', updateBar);
    return () => device?.removeEventListener('change', updateBar);
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
          <p>{sync.phase === 'linked' ? 'Your current MyDay will be replaced — on this device and in your account, so on all your devices.' : 'Your current data on this device will be overwritten.'} You might want to export it first.</p>
        </>
      ),
      confirmLabel: 'Replace my data',
      cancelLabel: 'Cancel',
    });
    if (!yes) { toast('Import cancelled. Nothing was changed.'); return; }
    if (replaceAll(result.data)) {
      toast('Imported.');
      void noteImported(); // signed in: it's saved to your account, like any change
    }
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
  // The screen's name, above the date (on wide screens MyDay's own name is at the top of the side menu).
  const screenName = hash.startsWith('#sync') ? 'Your account' : hash.startsWith('#noticed') ? 'What MyDay has noticed' : hash.startsWith('#knows') ? 'What MyDay knows' : hash.startsWith('#review') ? 'Your week' : hash.startsWith('#today/tasks') ? 'Tasks' : SECTIONS.find(x => x.id === section)?.label ?? 'MyDay';
  // Sign in first (when sync is set up): see sync/SignInGate.tsx.
  const gate = !blocked && signInRequired(sync) && !useHere;
  const todayHome = !blocked && !gate && section === 'today' && !/^#(?:sync|noticed|knows|review|today\/tasks)/.test(hash);
  const explore = exploreRoute(hash);
  const immersive = !!explore && !blocked && !gate;
  // Notes that clearly belong to a project are connected to it by themselves (with Undo): see shell/autoConnect.ts.
  useAutoConnect(data, status.kind === 'ok' && !gate && !immersive, hash);
  // …and, once you've switched it on, AI help places the ones the device can't (shell/aiConnect.ts).
  useAiConnect(data, status.kind === 'ok' && !gate && !immersive, hash);
  let content;
  if (status.kind === 'damaged') {
    content = <DamagedView reason={status.reason} onImport={() => fileInput.current?.click()} onStartFresh={startFresh}
      onDownload={() => download(`myday-unreadable-${todayKey()}.json`, status.raw)} />;
  } else if (status.kind === 'older') content = <OlderView />;
  else if (hash.startsWith('#noticed')) content = <NoticedScreen data={data} />;
  else if (hash.startsWith('#knows')) content = <KnowsScreen data={data} />;
  else if (hash.startsWith('#review')) content = <ReviewScreen data={data} />;
  else if (hash.startsWith('#sync')) {
    content = SYNC.configured ? <SyncScreen onExport={exportData} /> : (
      <div className="max-w-[720px] mx-auto"><Card>
        <h2>Your account</h2><p className="text-[15px] text-fg-2">Sync isn't set up in this copy of MyDay. Everything is saved only in this browser.</p>
      </Card></div>
    );
  } else if (section === 'today' && hash.startsWith('#today/tasks')) {
    // Tasks (moved here from the Inbox in 1.12.0): every one-off task, by date and in your own lists.
    content = <div className="max-w-[720px] mx-auto"><TasksScreen data={data} hash={hash} /></div>;
  } else if (section === 'today') {
    content = <TodayScreen key={k} data={data} generation={generation} k={k} canSave={status.kind === 'ok'} motionAllowed={motionAllowed}
      onExport={exportData} onImport={() => fileInput.current?.click()} />;
  } else if (section === 'calendar') content = <CalendarScreen data={data} canSave={status.kind === 'ok'} motionAllowed={motionAllowed} />;
  else if (section === 'finance') content = <FinanceScreen data={data} canSave={status.kind === 'ok'} />;
  else if (section === 'study') content = <StudyScreen data={data} hash={hash} />;
  else if (explore) content = <ExploreBoundary key={hash} fallback={<div className="p-8"><p>Explore could not be loaded. Your project is safe.</p><a href={projectHref(explore.projectId)}>Return to project</a></div>}><Suspense fallback={<div className="p-8"><p>Opening Explore…</p><a href={projectHref(explore.projectId)}>Return to project</a></div>}><ExploreScreen key={`${explore.projectId}:${explore.example}`} data={data} projectId={explore.projectId} example={explore.example} /></Suspense></ExploreBoundary>;
  else if (section === 'projects') content = <ProjectsScreen data={data} hash={hash} />;
  else content = <HealthScreen data={data} hash={hash} />;
  if (gate) content = <SignInGate onExport={exportData} onUseHere={() => { setUseHere(true); toast('Using what\'s on this device. Sign in next time to sync.'); }} />;

  return (
    <>
      <a className="skip-link" href="#app" onClick={e => { e.preventDefault(); document.getElementById('app')?.focus(); }}>Skip to content</a>
      {!immersive && <header className="appbar">
        <div className="appbar-card">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {todayHome ? <p className="screen-name screen-context" id="screenName">Today</p>
                : <h1 className="screen-name" id="screenName">{blocked || gate ? 'MyDay' : screenName}</h1>}
              {!blocked && !gate && <SyncBadge />}
            </div>
            <p id="date" className="screen-date">{prettyDate(k)}</p>
          </div>
          <div className="flex items-center gap-2 lg:gap-3 flex-none">
            {!blocked && !gate && section === 'today' && !hash.startsWith('#today/tasks') && !hash.startsWith('#noticed') && !hash.startsWith('#knows') && !hash.startsWith('#review') && !hash.startsWith('#sync') && <FocusSwitch />}
            {!blocked && !gate && <AccountChip data={data} sync={sync} />}
            {!blocked && !gate && status.kind === 'ok' && <CaptureButton data={data} />}
            <ThemeButton theme={theme} motionAllowed={motionAllowed} onChange={next => update(d => { d.settings.theme = next; })} />
          </div>
        </div>
      </header>}
      {!immersive && !blocked && !gate && <Nav current={barSection(section)} />}
      <main id="app" tabIndex={-1} className={immersive ? 'explore-main focus:outline-none' : 'workspace-main focus:outline-none'}>
        {loadIssue && !blocked && (
          <LoadIssue dropped={loadIssue.dropped}
            onDownload={() => download(`myday-saved-copy-${todayKey()}.json`, loadIssue.raw)}
            onDismiss={() => { dismissLoadIssue(); setLoadIssue(null); }} />
        )}
        {content}
        {/* Today has these at the bottom of its own layout; every other screen (Tasks under Today too) gets them here. */}
        {!immersive && !blocked && !gate && (section !== 'today' || hash.startsWith('#noticed') || hash.startsWith('#knows') || hash.startsWith('#review') || hash.startsWith('#today/tasks')) && !hash.startsWith('#sync') && (
          <div className="max-w-[720px] mx-auto mt-6">
            <AppFooter data={data} canSave={status.kind === 'ok'} onEdit={() => { location.hash = 'today/edit'; }} onExport={exportData} onImport={() => fileInput.current?.click()} />
          </div>
        )}
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
