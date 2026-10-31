import { useEffect, useState } from 'react';
import { keptConversation, onKeptConversation } from '../ai/keptConversation';
import { KEPT_CONVERSATION_KEY } from '../ai/lastAskKey';
import { LinkButton } from '../components/parts';
import type { MyDayData } from '../data/types';

// At the top of +: today's Ask MyDay conversation, kept on this device, with Carry on (ai/keptConversation.ts), so it can
// go on after its panel has closed. It goes once Ask is in use here (`hidden`: carried on, or a new question), or when
// one is kept or forgotten here or in another tab.
export function KeptConversationLine({ data, hidden, onCarryOn }: { data: MyDayData; hidden: boolean; onCarryOn: () => boolean }) {
  const [kept, setKept] = useState(() => keptConversation(data));
  useEffect(() => onKeptConversation(() => setKept(null)), []);
  useEffect(() => { const on = (e: StorageEvent) => { if (e.key === KEPT_CONVERSATION_KEY || e.key === null) setKept(null); }; window.addEventListener('storage', on); return () => window.removeEventListener('storage', on); }, []);
  if (!kept || hidden) return null;
  const n = kept.turns.length;
  return (
    <p className="text-[15px] text-fg-2 m-0 mb-3 flex flex-wrap items-center gap-x-3" data-s="ask-kept">
      <span>Your Ask MyDay conversation from {kept.at} ({n === 1 ? 'one message' : `${n} messages`}).</span>
      <LinkButton data-action="ask-carry-on" className="min-w-11" onClick={() => { if (!onCarryOn()) setKept(null); }}>Carry on</LinkButton>
    </p>
  );
}
