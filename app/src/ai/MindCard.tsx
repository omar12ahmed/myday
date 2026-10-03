import { ListPlus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CategoryChip } from '../components/CategoryChip';
import { Field, TextArea } from '../components/Field';
import { Choice, LinkButton, Note } from '../components/parts';
import { CAT_LABEL } from '../data/plan';
import { getSnapshot } from '../data/storage';
import { TASKS_LIMITS } from '../../../supabase/functions/_shared/ai/tasks.ts';
import { applyMind, buildTasksContext, checkTasksReply, type CheckedMind, type MindItem, type MindUndo } from './mind';
import { AI_MODE, askModel } from './request';

type Phase =
  | { at: 'write' }
  | { at: 'thinking' }
  | { at: 'review'; p: CheckedMind; model: string }
  | { at: 'error'; message: string };

// "Add what's on my mind": write anything, get small tasks back, tick the ones you want. Nothing is added until
// "Add"; the reply is checked first (mind.ts), and tasks already on your lists or queue start unticked.
export function MindCard({ onClose, onAdded }: { onClose: () => void; onAdded: (u: MindUndo, message: string) => void }) {
  const [phase, setPhase] = useState<Phase>({ at: 'write' });
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [repeat, setRepeat] = useState<Record<string, boolean>>({});
  const seq = useRef(0);
  const ctrl = useRef<AbortController | null>(null);

  async function ask() {
    if (!text.trim()) return;
    const my = ++seq.current;
    ctrl.current = new AbortController();
    setPhase({ at: 'thinking' });
    const reply = await askModel(buildTasksContext(text), ctrl.current.signal);
    if (my !== seq.current) return; // cancelled, or asked again
    if (!reply.ok) { setPhase({ at: 'error', message: reply.message }); return; }
    const checked = checkTasksReply(reply.text, getSnapshot().data);
    if (!checked.proposal) { setPhase({ at: 'error', message: "The suggestions that came back couldn't be used. Nothing was added — try again." }); return; }
    const p = checked.proposal;
    setPicked(Object.fromEntries(p.items.map(i => [i.key, !i.already])));
    setRepeat(Object.fromEntries(p.items.map(i => [i.key, i.repeat])));
    setPhase({ at: 'review', p, model: reply.model });
  }
  function cancel() { seq.current++; ctrl.current?.abort(); onClose(); }
  function add(items: MindItem[]) {
    const chosen = items.filter(i => picked[i.key]).map(i => ({ title: i.title, category: i.category, minutes: i.minutes, repeat: !!repeat[i.key] }));
    const r = applyMind(chosen);
    if (!r.ok) {
      setPhase({ at: 'error', message: r.reason === 'nothing' ? 'Those are all on your lists or queue already, so nothing was added.' : "Couldn't save just now — nothing was added. Please try again." });
      return;
    }
    onAdded(r.undo, r.message);
  }

  return (
    <Card tone="accent" aria-labelledby="mind-h" id="mindCard" data-phase={phase.at}>
      <h2 id="mind-h" className="flex items-center gap-2"><ListPlus size={20} aria-hidden="true" className="text-primary" /> Add what's on my mind</h2>

      {phase.at === 'write' && (
        <>
          <p className="text-[15px] text-fg-2">Write it however it comes out. I'll suggest small first steps; you choose which to add.</p>
          <Field label="What's on your mind?" htmlFor="mindText">
            <TextArea id="mindText" rows={5} maxLength={TASKS_LIMITS.textChars} value={text} onChange={e => setText(e.target.value)}
              placeholder="e.g. car insurance renewal, call the GP, revise subnetting, stretch every morning" />
          </Field>
          <p className="text-sm text-fg-3 text-right m-0 mt-1 tabular-nums">{text.length}/{TASKS_LIMITS.textChars}</p>
          <div className="grid gap-2.5 mt-2">
            <Button variant="primary" data-action="mind-ask" disabled={!text.trim()} onClick={ask}>Suggest tasks</Button>
            <Button variant="ghost" data-action="mind-cancel" onClick={cancel}>Cancel</Button>
          </div>
          <Note className="mt-3 mb-0 text-sm">{AI_MODE === 'mock'
            ? 'Practice mode: suggestions come from simple rules on this device, not AI. Nothing is sent anywhere.'
            : 'Sent for this suggestion only: what you write here and today\'s date — not your lists, plan or anything else. Nothing is saved there.'}</Note>
        </>
      )}

      {phase.at === 'thinking' && (
        <div role="status" aria-live="polite">
          <p className="text-[15px] text-fg-2 flex items-center gap-2"><span className="size-3 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden="true" /> Turning it into small steps…</p>
          <Button variant="ghost" data-action="mind-cancel" onClick={cancel}>Cancel</Button>
        </div>
      )}

      {phase.at === 'error' && (
        <>
          <p role="alert" className="text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2">{phase.message}</p>
          <div className="grid gap-2.5">
            <Button data-action="mind-retry" onClick={() => setPhase({ at: 'write' })}>Try again</Button>
            <Button variant="ghost" data-action="mind-cancel" onClick={cancel}>Close</Button>
          </div>
        </>
      )}

      {phase.at === 'review' && (() => {
        const { p, model } = phase;
        const n = p.items.filter(i => picked[i.key]).length;
        return (
          <>
            <p className="text-xs font-bold tracking-[.08em] uppercase text-fg-3 m-0 mb-2">Suggestions · nothing added yet</p>
            {p.items.length ? (
              <ul className="list-none p-0 m-0 grid gap-2.5" id="mindItems">
                {p.items.map(i => (
                  <li key={i.key} className="mind-item bg-surface-2 rounded-tile p-3.5" data-key={i.key}>
                    <label className="flex items-start gap-3 cursor-pointer min-h-11">
                      <input type="checkbox" className="size-[22px] accent-primary flex-none mt-0.5" data-s="mind-pick" checked={!!picked[i.key]}
                        onChange={e => setPicked(s => ({ ...s, [i.key]: e.target.checked }))} />
                      <span className="min-w-0">
                        <span className="block font-medium leading-snug">{i.title}</span>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-sm text-fg-3 tabular-nums">
                          <CategoryChip kind={i.category} /> <span className="mind-minutes">{i.minutes} min</span>
                        </span>
                        {i.already && <span className="mind-already block text-sm text-fg-2 mt-1">Already on {i.already}.</span>}
                      </span>
                    </label>
                    {picked[i.key] && (
                      <div className="mt-2.5">
                        <div className="flex flex-wrap gap-2" role="group" aria-label={`How often: ${i.title}`}>
                          <Choice on={!repeat[i.key]} data-s="mind-once" onClick={() => setRepeat(s => ({ ...s, [i.key]: false }))}>One-off</Choice>
                          <Choice on={!!repeat[i.key]} data-s="mind-repeat" onClick={() => setRepeat(s => ({ ...s, [i.key]: true }))}>Repeating</Choice>
                        </div>
                        <p className="text-sm text-fg-2 m-0 mt-1.5">{repeat[i.key]
                          ? `Added to your ${CAT_LABEL[i.category]} list, so it comes round regularly.`
                          : 'Goes in your queue; MyDay fits it into a coming day.'}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="text-[15px] text-fg-2" id="mindNone">No tasks in that — nothing to add.</p>}
            {p.notTasks.length > 0 && (
              <div className="mt-3" id="mindNotTasks"><p className="text-sm font-semibold m-0">Not turned into tasks</p>
                <ul className="list-disc pl-5 m-0 mt-1 text-sm text-fg-2">{p.notTasks.map(m => <li key={m}>{m}</li>)}</ul></div>
            )}
            {p.explanation && <p className="text-[15px] mt-3 mb-0" id="mindExplanation">{p.explanation}</p>}
            {p.adjusted.length > 0 && (
              <details className="mt-2" id="mindAdjusted"><summary className="text-sm text-fg-2 cursor-pointer min-h-11 flex items-center">Adjusted to fit MyDay's rules ({p.adjusted.length})</summary>
                <ul className="list-disc pl-5 m-0 text-sm text-fg-2">{p.adjusted.map(m => <li key={m}>{m}</li>)}</ul></details>
            )}
            <div className="grid gap-2.5 mt-4">
              <Button variant="primary" data-action="mind-add" disabled={!n} onClick={() => add(p.items)}>{n ? `Add ${n} task${n === 1 ? '' : 's'}` : 'Tick the tasks to add'}</Button>
              <Button variant="ghost" data-action="mind-cancel" onClick={cancel}>Not now</Button>
            </div>
            <div className="flex flex-wrap justify-between items-center gap-2 mt-1">
              <LinkButton data-action="mind-again" onClick={() => setPhase({ at: 'write' })}>Change what I wrote</LinkButton>
              <span className="text-xs text-fg-3">Suggested by {model}</span>
            </div>
          </>
        );
      })()}
    </Card>
  );
}
