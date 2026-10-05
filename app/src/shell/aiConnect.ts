import { useEffect } from 'react';
import { applyConnect, connectContext, readConnectReply } from '../ai/connect';
import { AI_MODE, askModel } from '../ai/request';
import { todayKey } from '../data/dates';
import { update } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';

// AI help placing notes, by itself (1.15.0): once you've switched it on, a few seconds after things settle, MyDay asks
// about the notes it couldn't place on the device (see ai/connect.ts) — at most twice a day on each device, so the
// day's AI requests stay free for what you ask yourself. If AI help isn't available (signed out, today's limit, the
// month's budget), it stops trying until tomorrow. The count is kept on this device only ('myday.ai.connect').
const KEY = 'myday.ai.connect';
export const AI_CONNECT_PER_DAY = 2;
const WAIT_MS = 4000;
let running = false;

function usedToday(): number {
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && v.day === todayKey() ? Number(v.count) || 0 : 0; } catch { return AI_CONNECT_PER_DAY; }
}
function setUsed(count: number) {
  try { localStorage.setItem(KEY, JSON.stringify({ day: todayKey(), count })); } catch { /* storage blocked: it just won't run */ }
}

export function useAiConnect(data: MyDayData, canSave: boolean) {
  const on = !!data.patterns.prefs.aiNotes;
  useEffect(() => {
    if (!canSave || !on || AI_MODE === 'off' || running || usedToday() >= AI_CONNECT_PER_DAY || !connectContext(data)) return;
    const t = window.setTimeout(async () => {
      const plan = connectContext(data);
      if (!plan || running || usedToday() >= AI_CONNECT_PER_DAY) return;
      running = true;
      setUsed(usedToday() + 1);
      try {
        const reply = await askModel(plan.ctx);
        if (!reply.ok) { if (reply.reason !== 'too-fast' && reply.reason !== 'offline') setUsed(AI_CONNECT_PER_DAY); return; }
        const { answers } = readConnectReply(reply.text, plan.ctx);
        let linked = 0;
        update(d => { linked = applyConnect(d, plan.seen, answers); });
        if (linked) toast(`AI help put ${linked} note${linked === 1 ? '' : 's'} in your projects — see Notes to keep or undo.`);
      } finally { running = false; }
    }, WAIT_MS);
    return () => window.clearTimeout(t);
  }, [data, canSave, on]);
}
