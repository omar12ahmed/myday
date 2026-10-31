import { useEffect, useState } from 'react';
import { LinkButton } from '../components/parts';
import { LAST_ASK_KEY, lastAsk, onLastAsk, undoNow } from '../ai/lastAsk';
import { forgetConversation } from '../ai/keptConversation';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';

// At the top of +: the last thing Ask MyDay added or changed today, with Undo (ai/lastAsk.ts) — so it can still be taken
// back after its panel has closed. Once Ask adds or changes something else here, or it's undone, the line goes (the
// panel below offers its own Undo for what it has just done). Undo here also forgets today's kept conversation, as the
// panel's own Undo does: it would say the things were added.
export function LastAskLine({ data }: { data: MyDayData }) {
  const [last, setLast] = useState(() => lastAsk(data));
  useEffect(() => onLastAsk(() => setLast(null)), []);
  // Another tab of MyDay keeping or undoing one: this line stops offering what may no longer be the last.
  useEffect(() => { const on = (e: StorageEvent) => { if (e.key === LAST_ASK_KEY || e.key === null) setLast(null); }; window.addEventListener('storage', on); return () => window.removeEventListener('storage', on); }, []);
  if (!last) return null;
  return (
    <p className="text-[15px] text-fg-2 m-0 mb-3 flex flex-wrap items-center gap-x-3" data-s="ask-last">
      <span>Last from Ask MyDay, at {last.at}: {last.kind === 'added' ? 'added' : 'changed'} {last.words}.</span>
      <LinkButton data-action="ask-last-undo" className="min-w-11" onClick={() => { const r = undoNow(last); toast(r.message); if (r.done) { setLast(null); forgetConversation(); document.getElementById('captureText')?.focus(); } }}>Undo</LinkButton>
    </p>
  );
}
