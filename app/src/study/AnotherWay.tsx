import { useEffect, useRef, useState } from 'react';
import { AI_MODE, askModel } from '../ai/request';
import { Button } from '../components/Button';
import { shortDate, todayKey } from '../data/dates';
import { update } from '../data/storage';
import { anotherWayOf, keepAnotherWay } from '../data/study/anotherWay';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';
import { EXPLAIN_LIMITS, readExplain, type ExplainContext } from '../../../supabase/functions/_shared/ai/explain-shape.ts';
import { LinkButton } from './parts';
import type { Asked } from './RevisionView';
import type { Round } from './round';

type Phase = { at: 'idle' } | { at: 'asking' } | { at: 'shown'; text: string; by: string } | { at: 'error'; message: string };
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

// "Explain it another way" (AI roles step 4), under any revision question once its answer is shown: on your tap, the
// question, its answer, the explanation you've seen and your own answer go to the AI, which explains it from a
// different angle. Shown labelled as AI-written; "Keep this explanation" saves it on the card (data/study/anotherWay.ts),
// where it shows next time, until you remove it. Your answer and the schedule are untouched.
export function AnotherWay({ data, q, r }: { data: MyDayData; q: Asked; r: Round }) {
  const [phase, setPhase] = useState<Phase>({ at: 'idle' });
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const kept = anotherWayOf(data, q.id);
  const canAsk = AI_MODE !== 'off' && !!q.explain;
  if (!kept && !canAsk) return null;

  async function ask() {
    if (!q.explain) return;
    request.current?.abort();
    const ctrl = new AbortController(); request.current = ctrl;
    setPhase({ at: 'asking' });
    const L = EXPLAIN_LIMITS;
    const yours = q.kind === 'choice' ? (r.chosen !== null ? q.choices[r.chosen] ?? '' : '') : r.typed;
    const ctx: ExplainContext = {
      version: 1, action: 'explain', ...q.explain,
      question: cut(q.explain.question, L.questionChars), answer: cut(q.explain.answer, L.answerChars), explanation: cut(q.explain.explanation, L.explanationChars),
      ...(q.kind === 'choice' && q.choices.filter(Boolean).length >= 2 ? { choices: q.choices.filter(Boolean).slice(0, L.choices).map(c => cut(c, L.choiceChars)) } : {}),
      yourAnswer: cut(yours.trim(), L.yourAnswerChars), outcome: r.outcome,
    };
    const reply = await askModel(ctx, ctrl.signal);
    if (ctrl.signal.aborted) return;
    if (!reply.ok) { setPhase({ at: 'error', message: reply.message }); return; }
    const text = readExplain(reply.text);
    setPhase(text ? { at: 'shown', text, by: reply.model } : { at: 'error', message: "The explanation that came back couldn't be used — try again." });
  }
  function keep(p: Extract<Phase, { at: 'shown' }>) {
    if (update(d => (keepAnotherWay(d, q.id, { text: p.text, by: p.by, on: todayKey() }) ? undefined : false))) {
      toast(kept ? 'Kept — it replaces the one you kept before.' : 'Kept — it will show here next time.');
      setPhase({ at: 'idle' });
    }
  }
  const remove = () => { if (update(d => (keepAnotherWay(d, q.id, null) ? undefined : false))) toast('Removed the kept explanation.'); };

  return <div data-s="another-way" data-phase={phase.at}>
    {kept && phase.at !== 'shown' && <div className="bg-surface-2 rounded-tile px-3.5 py-2.5 my-2.5" data-s="aw-kept">
      <span className="lbl text-sm text-fg-2">Your kept explanation · AI-written{kept.by ? ` by ${kept.by}` : ''}, kept {shortDate(kept.on)}</span>
      <p className="mt-1 mb-1 whitespace-pre-wrap">{kept.text}</p>
      <LinkButton data-action="aw-remove" onClick={remove}>Remove it</LinkButton>
    </div>}
    {canAsk && phase.at === 'idle' && <Button inline variant="ghost" className="mt-1" data-action="aw-ask" onClick={() => { void ask(); }}>{kept ? 'Explain it another way again' : 'Explain it another way'}</Button>}
    {phase.at === 'asking' && <p role="status" className="text-[15px] text-fg-2 flex items-center gap-2 my-2.5"><span className="size-3 rounded-full bg-primary motion-safe:animate-pulse flex-none" aria-hidden="true" /> Finding another way to explain it…</p>}
    {phase.at === 'shown' && <div className="rounded-tile border border-outline px-3.5 py-2.5 my-2.5" data-s="aw-shown">
      <span className="lbl text-sm text-fg-2">{AI_MODE === 'mock' ? 'Another way · practice helper (no AI)' : `Another way · AI-written by ${phase.by}, not checked by your course`}</span>
      <p className="mt-1 mb-2 whitespace-pre-wrap">{phase.text}</p>
      <div className="flex flex-wrap gap-2">
        <Button inline variant="tonal" data-action="aw-keep" onClick={() => keep(phase)}>{kept ? 'Keep this one instead' : 'Keep this explanation'}</Button>
        <Button inline variant="ghost" data-action="aw-close" onClick={() => setPhase({ at: 'idle' })}>Close</Button>
      </div>
    </div>}
    {phase.at === 'error' && <div className="my-2.5">
      <p role="alert" className="text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2 m-0 mb-2">{phase.message}</p>
      <Button inline variant="ghost" data-action="aw-ask" onClick={() => { void ask(); }}>Try again</Button>
    </div>}
    {canAsk && phase.at === 'idle' && !kept && <p className="text-xs text-fg-3 mt-1 mb-0">Sends this question, its answer and your answer — nothing else.</p>}
  </div>;
}
