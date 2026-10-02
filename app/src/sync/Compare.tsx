import type { ReactNode } from 'react';
import { recordLines, recordSummary, type Content } from './records';

// Two versions of one record side by side (stacked on a phone): this device's and your account's.
export function Compare({ recordKey, here, cloud, hereLabel = 'On this device', cloudLabel = 'In your account' }: {
  recordKey: string; here: Content | null; cloud: Content | null; hereLabel?: string; cloudLabel?: string;
}) {
  return (
    <div className="compare grid gap-2.5 sm:grid-cols-2 my-2.5">
      <Version title={hereLabel} recordKey={recordKey} content={here} side="here" />
      <Version title={cloudLabel} recordKey={recordKey} content={cloud} side="cloud" />
    </div>
  );
}

function Version({ title, recordKey, content, side }: { title: string; recordKey: string; content: Content | null; side: string }): ReactNode {
  const lines = recordLines(recordKey, content);
  return (
    <div className="min-w-0 rounded-tile border border-outline bg-surface-2 text-fg px-3.5 py-3" data-side={side}>
      <p className="text-xs font-bold tracking-[.08em] uppercase text-fg-3 m-0">{title}</p>
      <p className="text-[15px] font-semibold mt-1 mb-0">{recordSummary(recordKey, content)}</p>
      {lines.length > 0 && (
        <ul className="list-none p-0 mt-1.5 mb-0 text-sm text-fg-2 grid gap-0.5">
          {lines.slice(0, 8).map((l, i) => <li key={i} className="break-words">{l}</li>)}
          {lines.length > 8 && <li>…and {lines.length - 8} more</li>}
        </ul>
      )}
    </div>
  );
}
