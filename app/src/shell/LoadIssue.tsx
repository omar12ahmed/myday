import { Download, Info } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

// Shown when some saved entries couldn't be read as MyDay started. They're left out (as the current MyDay
// also does) and will be gone from this browser after the next save — so this says so plainly, and offers
// a copy of the saved data exactly as it was, including what couldn't be read.
export function LoadIssue({ dropped, onDownload, onDismiss }: { dropped: number; onDownload: () => void; onDismiss: () => void }) {
  const one = dropped === 1;
  return (
    <Card tone="notice" className="load-issue" role="status" aria-labelledby="load-issue-h">
      <div className="flex gap-2.5 items-start">
        <Info size={20} className="flex-none mt-0.5" aria-hidden="true" />
        <div className="min-w-0">
          <h2 id="load-issue-h" className="!text-lg">{dropped} saved {one ? 'entry' : 'entries'} couldn't be read</h2>
          <p className="text-[15px]">MyDay is leaving {one ? 'it' : 'them'} out, and {one ? "it'll" : "they'll"} be gone from this browser the next time MyDay saves. If you might want {one ? 'it' : 'them'}, download a copy of your saved data as it is now — it includes everything, even what couldn't be read.</p>
          <div className="flex flex-wrap gap-2.5">
            <Button inline variant="primary" data-action="load-issue-download" onClick={onDownload}><Download size={18} aria-hidden="true" /> Download a copy</Button>
            <Button inline variant="ghost" data-action="load-issue-dismiss" onClick={onDismiss}>OK</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
