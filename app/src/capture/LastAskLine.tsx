import { useEffect, useState } from 'react';
import { LinkButton } from '../components/parts';
import { lastAsk, onLastAsk, undoNow } from '../ai/lastAsk';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';

// At the top of +: the last thing Ask MyDay added or changed today, with Undo (ai/lastAsk.ts) — so it can still be taken
// back after its panel has closed. Once Ask adds or changes something else here, or it's undone, the line goes (the
// panel below offers its own Undo for what it has just done).
export function LastAskLine({ data }: { data: MyDayData }) {
  const [last, setLast] = useState(() => lastAsk(data));
  useEffect(() => onLastAsk(() => setLast(null)), []);
  if (!last) return null;
  return (
    <p className="text-[15px] text-fg-2 m-0 mb-3 flex flex-wrap items-center gap-x-3" data-s="ask-last">
      <span>Last from Ask MyDay, at {last.at}: {last.kind === 'added' ? 'added' : 'changed'} {last.words}.</span>
      <LinkButton data-action="ask-last-undo" onClick={() => { const r = undoNow(last); toast(r.message); if (r.done) setLast(null); }}>Undo</LinkButton>
    </p>
  );
}
