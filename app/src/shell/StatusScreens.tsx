import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CURRENT_MYDAY_URL } from '../links';

// Saved data that can't be read (damaged, or from a newer MyDay). Saving is paused; nothing is deleted.
export function DamagedView({ reason, onDownload, onImport, onStartFresh }: { reason: string; onDownload: () => void; onImport: () => void; onStartFresh: () => void }) {
  return (
    <Card tone="notice" aria-labelledby="damaged-h">
      <h2 id="damaged-h">Your saved data couldn't be opened</h2>
      <p className="text-[15px]">{reason} Nothing has been deleted — it's still saved exactly as it was.</p>
      <p className="text-[15px]">You can download that copy to keep it safe, load a backup you exported earlier, or start fresh.</p>
      <div className="grid gap-2.5">
        <Button data-action="download-damaged" onClick={onDownload}>Download the saved copy</Button>
        <Button data-action="import" onClick={onImport}>Import a backup</Button>
        <Button variant="ghost" data-action="start-fresh" onClick={onStartFresh}>Start fresh</Button>
      </div>
    </Card>
  );
}

// Only data from an older MyDay: the current MyDay moves it to the new format (with its own checks) first.
export function OlderView() {
  return (
    <Card aria-labelledby="older-h">
      <h2 id="older-h">Your data needs a quick update first</h2>
      <p className="text-[15px] text-fg-2">
        It was saved by an older version of MyDay. Open the current MyDay once and it will update it safely, then come back here.
        Until then, the new app doesn't save anything, so your data stays exactly as it is.
      </p>
      {CURRENT_MYDAY_URL && <a className="inline-flex items-center min-h-11 px-4 py-2 rounded-btn bg-tonal text-on-tonal font-[550] text-[15px]" href={CURRENT_MYDAY_URL}>Open the current MyDay</a>}
    </Card>
  );
}
