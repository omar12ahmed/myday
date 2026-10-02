import { useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Choice, Choices, Chip, Note, Summary } from '../components/parts';
import { toast } from '../data/toast';
import { Compare } from './Compare';
import { applyReview, prepareReview, type Review, type ReviewItem } from './engine';
import { recordSummary } from './records';

// "Before syncing: here's what would change". Shown before this device first syncs with an account, and after a
// backup is restored (or lots changed at once). Nothing changes until you press "Start syncing".
export function ReviewPanel({ review, onDone, onCancel, onReplace }: {
  review: Review; onDone: () => void; onCancel: () => void; onReplace: (r: Review) => void;
}) {
  const initial: Record<string, 'here' | 'cloud'> = {};
  for (const i of review.items) if (i.action === 'differ' && i.suggest) initial[i.key] = i.suggest;
  const [choices, setChoices] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const by = (a: ReviewItem['action']) => review.items.filter(i => i.action === a);
  const down = by('download'), up = by('upload'), same = by('same'), differ = by('differ');
  const unchosen = differ.filter(i => !choices[i.key]).length;
  const chooseAll = (c: 'here' | 'cloud') => setChoices(Object.fromEntries(differ.map(i => [i.key, c])));

  async function start() {
    setBusy(true); setError('');
    const r = await applyReview(review, choices);
    if (r.ok) { setBusy(false); toast('Syncing has started.'); onDone(); return; }
    if (r.stale) {
      const again = await prepareReview();
      setBusy(false);
      if (again.ok) { onReplace(again.review); setError(r.message); return; }
      setError(again.message);
      return;
    }
    setBusy(false);
    setError(r.message);
  }

  return (
    <Card tone="accent" aria-labelledby="review-h" id="syncReview">
      <h3 id="review-h">Before syncing: here's what would change</h3>
      <p className="text-[15px] text-fg-2">Comparing this device with {review.account.email}. Nothing changes until you press <strong>Start syncing</strong>.</p>
      <div className="flex flex-wrap gap-1.5 mb-3" aria-label="Summary">
        {down.length > 0 && <Chip>{down.length} to save here</Chip>}
        {up.length > 0 && <Chip>{up.length} to send</Chip>}
        {differ.length > 0 && <Chip>{differ.length} to choose</Chip>}
        {same.length > 0 && <Chip>{same.length} already the same</Chip>}
      </div>
      {review.before && (
        <p className="warn text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2" data-note="before">
          This device used to sync with {review.before}. Records from that account are still on this device, and they're listed under
          “Sent from this device”. Start syncing only if you want them in {review.account.email} too.
        </p>
      )}

      {differ.length > 0 && (
        <section aria-labelledby="rv-differ" className="mt-4">
          <h4 id="rv-differ" className="text-base font-bold m-0">Different on each — choose one ({differ.length})</h4>
          <Note className="mt-1">The one you don't choose isn't lost: if it's this device's, it's kept aside here and you can download it.</Note>
          {differ.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-2">
              <Button inline variant="ghost" data-action="review-all-here" onClick={() => chooseAll('here')}>Keep all of this device's</Button>
              <Button inline variant="ghost" data-action="review-all-cloud" onClick={() => chooseAll('cloud')}>Use all of the account's</Button>
            </div>
          )}
          {differ.map(i => (
            <div key={i.key} className="review-item border-t border-outline pt-3 mt-3" data-key={i.key}>
              <p className="font-semibold m-0">{i.label}</p>
              <p className="text-sm text-fg-2 m-0">{i.why}</p>
              <Compare recordKey={i.key} here={i.here} cloud={i.cloud} cloudLabel={i.cloudDeleted ? 'In your account (deleted)' : 'In your account'} />
              <Choices label={`Which version of ${i.label}?`}>
                <Choice on={choices[i.key] === 'here'} data-action="review-here" data-key={i.key} onClick={() => setChoices({ ...choices, [i.key]: 'here' })}>Keep this device's</Choice>
                <Choice on={choices[i.key] === 'cloud'} data-action="review-cloud" data-key={i.key} onClick={() => setChoices({ ...choices, [i.key]: 'cloud' })}>{i.cloudDeleted ? 'Remove it here' : "Use the account's"}</Choice>
              </Choices>
            </div>
          ))}
        </section>
      )}

      <Group id="rv-down" title="Saved here from your account" items={down} empty="Nothing to save here." pick="cloud" />
      <Group id="rv-up" title="Sent from this device" items={up} empty="Nothing to send." pick="here" />
      {same.length > 0 && (
        <details className="group mt-3">
          <Summary>Already the same on both ({same.length})</Summary>
          <ul className="list-none p-0 m-0 text-[15px] text-fg-2">{same.map(i => <li key={i.key} className="py-1">{i.label}</li>)}</ul>
        </details>
      )}

      <Note className="mt-4">Only your task lists, queue, daily plans and day context take part. Everything else stays on this device.</Note>
      {error && <p role="alert" className="warn text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2">{error}</p>}
      <div className="grid gap-2.5 mt-2">
        <Button variant="primary" data-action="review-start" disabled={busy || unchosen > 0} onClick={start}>
          {busy ? 'Starting…' : unchosen ? `Choose a version for ${unchosen} more` : 'Start syncing'}
        </Button>
        <Button variant="ghost" data-action="review-cancel" disabled={busy} onClick={onCancel}>Not now</Button>
      </div>
    </Card>
  );
}

function Group({ id, title, items, empty, pick }: { id: string; title: string; items: ReviewItem[]; empty: string; pick: 'here' | 'cloud' }) {
  return (
    <section aria-labelledby={id} className="mt-4" data-group={id}>
      <h4 id={id} className="text-base font-bold m-0">{title} ({items.length})</h4>
      {items.length ? (
        <ul className="list-none p-0 mt-1 mb-0">
          {items.map(i => (
            <li key={i.key} className="py-2 border-t border-outline first:border-t-0" data-key={i.key}>
              <span className="font-semibold">{i.label}</span>
              <span className="block text-sm text-fg-2">{recordSummary(i.key, pick === 'cloud' ? i.cloud : i.here)} · {i.why}</span>
            </li>
          ))}
        </ul>
      ) : <Note className="mt-1 mb-0">{empty}</Note>}
    </section>
  );
}
