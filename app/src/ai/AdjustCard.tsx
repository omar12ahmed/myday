import { Moon, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CategoryChip } from '../components/CategoryChip';
import { Field, TextArea } from '../components/Field';
import { LinkButton, Note } from '../components/parts';
import { getSnapshot } from '../data/storage';
import { toast } from '../data/toast';
import type { DateKey, MyDayData } from '../data/types';
import { LIMITS } from '../../../supabase/functions/_shared/ai/schema.ts';
import { applyAi, planStamp, type Undo } from './apply';
import { buildContext } from './context';
import { AI_MODE, askModel } from './request';
import { checkProposal, clockOf, type CheckedProposal } from './validate';

type Phase =
  | { at: 'ask' }
  | { at: 'thinking' }
  | { at: 'review'; p: CheckedProposal; stamp: string; model: string }
  | { at: 'error'; message: string };

// "Help me adjust today": an optional note, one request, then a suggestion to review. Nothing is saved until
// "Use this plan"; the suggestion is checked against MyDay's rules first (validate.ts) and again for staleness
// when you use it (apply.ts).
export function AdjustCard({ data, k, onClose, onApplied }: { data: MyDayData; k: DateKey; onClose: () => void; onApplied: (u: Undo) => void }) {
  const [phase, setPhase] = useState<Phase>({ at: 'ask' });
  const [note, setNote] = useState('');
  const seq = useRef(0);
  const ctrl = useRef<AbortController | null>(null);
  const categoryOf = (uid: string) => data.days[k]?.tasks.find(t => t.uid === uid)?.category ?? 'admin';

  async function ask() {
    const my = ++seq.current;
    ctrl.current = new AbortController();
    setPhase({ at: 'thinking' });
    const now = getSnapshot().data;
    const stamp = planStamp(now, k);
    const reply = await askModel(buildContext(now, k, note), ctrl.current.signal);
    if (my !== seq.current) return; // cancelled, or asked again
    if (!reply.ok) { setPhase({ at: 'error', message: reply.message }); return; }
    const checked = checkProposal(reply.text, getSnapshot().data, k);
    if (!checked.proposal) { setPhase({ at: 'error', message: "The suggestion that came back couldn't be used. Your plan hasn't changed — try again, or use Review my plan." }); return; }
    setPhase({ at: 'review', p: checked.proposal, stamp, model: reply.model });
  }
  function cancel() { seq.current++; ctrl.current?.abort(); onClose(); }
  function use(p: CheckedProposal, stamp: string) {
    const r = applyAi(k, stamp, p);
    if (!r.ok) {
      setPhase({ at: 'error', message: r.reason === 'stale'
        ? "Your plan changed since this suggestion, so it wasn't used. Ask again for a fresh one."
        : "Couldn't save just now — your plan is as it was. Please try again." });
      return;
    }
    toast(r.message);
    onApplied(r.undo);
  }

  return (
    <Card tone="accent" aria-labelledby="ai-h" id="aiCard" data-phase={phase.at}>
      <h2 id="ai-h" className="flex items-center gap-2"><Sparkles size={20} aria-hidden="true" className="text-primary" /> Help me adjust today</h2>

      {phase.at === 'ask' && (
        <>
          <p className="text-[15px] text-fg-2">I'll suggest what to focus on for the rest of today, around your energy, sleep, shifts and appointments. Nothing changes unless you choose it.</p>
          <Field label="Anything I should know? (optional)" htmlFor="aiNote">
            <TextArea id="aiNote" rows={2} maxLength={LIMITS.noteChars} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. I slept badly and only have 20 minutes" />
          </Field>
          <p className="text-sm text-fg-3 text-right m-0 mt-1 tabular-nums">{note.length}/{LIMITS.noteChars}</p>
          <div className="grid gap-2.5 mt-2">
            <Button variant="primary" data-action="ai-ask" onClick={ask}>Get a suggestion</Button>
            <Button variant="ghost" data-action="ai-cancel" onClick={cancel}>Cancel</Button>
          </div>
          <Note className="mt-3 mb-0 text-sm">{AI_MODE === 'mock'
            ? 'Practice mode: suggestions come from simple rules on this device, not AI. Nothing is sent anywhere.'
            : "Sent for this suggestion only: today's tasks, energy, sleep, busy times (not appointment names) and your note. Nothing is saved there."}</Note>
        </>
      )}

      {phase.at === 'thinking' && (
        <div role="status" aria-live="polite">
          <p className="text-[15px] text-fg-2 flex items-center gap-2"><span className="size-3 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden="true" /> Thinking about your day…</p>
          <Button variant="ghost" data-action="ai-cancel" onClick={cancel}>Cancel</Button>
        </div>
      )}

      {phase.at === 'error' && (
        <>
          <p role="alert" className="text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2">{phase.message}</p>
          <div className="grid gap-2.5">
            <Button data-action="ai-retry" onClick={() => setPhase({ at: 'ask' })}>Try again</Button>
            <Button variant="ghost" data-action="ai-cancel" onClick={cancel}>Close</Button>
          </div>
        </>
      )}

      {phase.at === 'review' && (() => {
        const { p, stamp, model } = phase;
        return (
          <>
            <p className="text-xs font-bold tracking-[.08em] uppercase text-fg-3 m-0 mb-2">A suggestion · not saved yet</p>
            {p.rest ? (
              <div className="flex gap-3 items-start bg-rest-c rounded-tile p-4" id="aiRest">
                <span aria-hidden="true" className="flex-none grid place-items-center size-9 rounded-full bg-surface text-rest"><Moon size={18} /></span>
                <div><p className="m-0 font-medium">Rest for the rest of today</p><p className="m-0 mt-0.5 text-sm text-fg-2">Nothing is lost: your tasks come round again on another day.</p></div>
              </div>
            ) : (
              <ol className="list-none p-0 m-0 grid gap-2.5" id="aiPriorities">
                {p.priorities.map(x => (
                  <li key={x.uid} className="ai-item bg-surface-2 rounded-tile p-3.5" data-uid={x.uid}>
                    <p className="m-0 mb-1 text-[15px] font-bold tabular-nums">{x.start !== null ? `${clockOf(x.start)}–${clockOf(x.start + x.minutes)}` : 'Any time today'}</p>
                    <p className="m-0 font-medium leading-snug">{x.title}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm text-fg-3 tabular-nums">
                      <CategoryChip kind={categoryOf(x.uid)} />
                      <span className="ai-minutes">{x.minutes} min{x.minutes !== x.currentMinutes ? ` (was ${x.currentMinutes})` : ''}</span>
                    </div>
                  </li>
                ))}
                {!p.priorities.length && <li className="text-[15px] text-fg-2">Nothing more today — that's fine.</li>}
              </ol>
            )}
            {p.later.length > 0 && <p className="text-sm text-fg-2 mt-3 mb-0" id="aiLater">Waits in your queue for another day: {p.later.map(x => x.title).join(', ')}.</p>}
            {p.explanation && <p className="text-[15px] mt-3 mb-0" id="aiExplanation">{p.explanation}</p>}
            {p.missing.length > 0 && (
              <div className="mt-3" id="aiMissing"><p className="text-sm font-semibold m-0">Good to know</p>
                <ul className="list-disc pl-5 m-0 mt-1 text-sm text-fg-2">{p.missing.map(m => <li key={m}>{m}</li>)}</ul></div>
            )}
            {p.adjusted.length > 0 && (
              <details className="mt-2" id="aiAdjusted"><summary className="text-sm text-fg-2 cursor-pointer min-h-11 flex items-center">Adjusted to fit MyDay's rules ({p.adjusted.length})</summary>
                <ul className="list-disc pl-5 m-0 text-sm text-fg-2">{p.adjusted.map(m => <li key={m}>{m}</li>)}</ul></details>
            )}
            <div className="grid gap-2.5 mt-4">
              <Button variant="primary" data-action="ai-use" onClick={() => use(p, stamp)}>{p.rest ? 'Rest for the rest of today' : 'Use this plan'}</Button>
              <Button variant="ghost" data-action="ai-cancel" onClick={cancel}>Not now</Button>
            </div>
            <div className="flex flex-wrap justify-between items-center gap-2 mt-1">
              <LinkButton data-action="ai-again" onClick={() => setPhase({ at: 'ask' })}>Ask again</LinkButton>
              <span className="text-xs text-fg-3">Suggested by {model}</span>
            </div>
          </>
        );
      })()}
    </Card>
  );
}
