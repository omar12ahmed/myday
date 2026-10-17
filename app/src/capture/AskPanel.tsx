import { CalendarPlus, FolderKanban, ListPlus, NotebookPen, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { addAskItems, checkAskReply, countWords, undoAsk, type AskChecked, type AskProposal, type AskUndo } from '../ai/ask';
import { askContext, askSlice } from '../ai/askContext';
import { canAdjust, handOverToAdjust } from '../ai/handover';
import { AI_MODE, askModel } from '../ai/request';
import { Button } from '../components/Button';
import { TextInput } from '../components/Field';
import { LinkButton } from '../components/parts';
import { prettyDate, todayKey } from '../data/dates';
import { CAT_LABEL } from '../data/plan';
import { getSnapshot } from '../data/storage';
import { toast } from '../data/toast';
import type { MyDayData } from '../data/types';
import { startLearning } from '../study/actions';

// "Ask MyDay" in the + Capture sheet (the AI design's step 1): for what the on-device suggestions can't do — a question,
// a breakdown into steps, several things at once. Only on your tap; the "Sends:" line says exactly what goes with it
// (the page's slice, askContext.ts). What comes back is checked against your data (ai/ask.ts) and shown as cards:
// things to add (tick, rename, Add — one step of Undo), steps, a short answer with at most one action, or "can't do
// that here". One follow-up at most; nothing is kept of the conversation.
type Phase =
  | { at: 'idle' }
  | { at: 'asking' }
  | { at: 'shown'; r: AskChecked; model: string; followed: boolean }
  | { at: 'added'; undo: AskUndo; words: string }
  | { at: 'error'; message: string };

const ICON: Record<AskProposal['type'], ReactNode> = {
  task: <ListPlus size={16} aria-hidden="true" />, note: <NotebookPen size={16} aria-hidden="true" />,
  appointment: <CalendarPlus size={16} aria-hidden="true" />, project: <FolderKanban size={16} aria-hidden="true" />,
};
const TYPE_WORD: Record<AskProposal['type'], string> = { task: 'Task', note: 'Note', appointment: 'Appointment', project: 'Project' };

// The answer as it was shown, for the one follow-up.
function shownText(r: AskChecked): string {
  const parts = [r.message];
  if (r.kind === 'add' || r.kind === 'steps') parts.push(...r.items.map(i => `- ${TYPE_WORD[i.type]}: ${i.title}`));
  if (r.kind === 'answer' && r.action) parts.push(r.action.type === 'adjust-today' ? '(offered: Help me adjust today)' : `(offered: start ${r.action.minutes} minutes on ${r.action.label})`);
  return parts.filter(Boolean).join('\n');
}

export function AskPanel({ data, text, onClose }: { data: MyDayData; text: string; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>({ at: 'idle' });
  const [picked, setPicked] = useState<boolean[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [more, setMore] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const [slice] = useState(() => askSlice(data, location.hash)); // the page the sheet was opened on
  if (AI_MODE === 'off') return null;
  const k = todayKey();

  async function ask(followUp?: { previous: string; text: string }) {
    request.current?.abort();
    const ctrl = new AbortController(); request.current = ctrl;
    setPhase({ at: 'asking' });
    const reply = await askModel(askContext(slice, text, k, new Date(), followUp), ctrl.signal);
    if (ctrl.signal.aborted) return;
    if (!reply.ok) { setPhase({ at: 'error', message: reply.message }); return; }
    const r = checkAskReply(reply.text, getSnapshot().data, slice, k);
    if (!r) { setPhase({ at: 'error', message: "The answer that came back couldn't be used — nothing was added. Try again, or put it another way." }); return; }
    if (r.kind === 'add' || r.kind === 'steps') { setPicked(r.items.map(i => !i.already)); setTitles(r.items.map(i => i.title)); }
    setMore('');
    setPhase({ at: 'shown', r, model: reply.model, followed: !!followUp });
  }
  function add(r: Extract<AskChecked, { kind: 'add' | 'steps' }>) {
    const chosen = r.items.map((it, i) => ({ ...it, title: titles[i]?.trim().slice(0, 120) || it.title })).filter((_, i) => picked[i]);
    if (!chosen.length) return;
    const undo = addAskItems(chosen);
    if (!undo) { toast("Couldn't save just now — nothing was added."); return; }
    const words = countWords(chosen);
    toast(`Added ${words}.`);
    setPhase({ at: 'added', undo, words });
  }

  const label = (model: string) => (AI_MODE === 'mock' ? 'Ask MyDay · practice helper (no AI)' : `Ask MyDay · AI-written by ${model} — check before adding`);
  return (
    <div className="mt-4 pt-4 border-t border-outline" data-s="ask-panel" data-phase={phase.at}>
      {(phase.at === 'idle' || phase.at === 'error') && <>
        <Button variant="tonal" data-action="ask-go" disabled={!text.trim()} onClick={() => { void ask(); }}><Sparkles size={18} aria-hidden="true" /> Ask MyDay</Button>
        <p className="text-xs text-fg-3 mt-1.5 mb-0" data-s="ask-sends">Sends: {slice.sends}. Nothing is saved until you tap Add.</p>
      </>}
      {phase.at === 'error' && <p role="alert" className="text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2 mt-2.5 mb-0">{phase.message}</p>}
      {phase.at === 'asking' && <p role="status" className="text-[15px] text-fg-2 flex items-center gap-2 my-1"><span className="size-3 rounded-full bg-primary motion-safe:animate-pulse flex-none" aria-hidden="true" /> Asking MyDay…</p>}
      {phase.at === 'added' && <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-s="ask-added">
        <p className="text-[15px] m-0">Added {phase.words}.</p>
        <LinkButton data-action="ask-undo" onClick={() => { if (undoAsk(phase.undo)) { toast('Taken back.'); setPhase({ at: 'idle' }); } }}>Undo</LinkButton>
        <LinkButton data-action="ask-close" className="ml-auto" onClick={onClose}>Close</LinkButton>
      </div>}
      {phase.at === 'shown' && (() => {
        const r = phase.r;
        return <div aria-live="polite">
          <p className="text-xs font-semibold text-fg-3 m-0 flex items-center gap-1.5"><Sparkles size={14} aria-hidden="true" /> {label(phase.model)}</p>
          {r.message && <p className="text-[15px] mt-1.5 mb-2 whitespace-pre-wrap" data-s="ask-message">{r.message}</p>}
          {(r.kind === 'add' || r.kind === 'steps') && <>
            <ul className="list-none p-0 m-0 grid gap-2">
              {r.items.map((it, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-tile border border-outline px-3 py-2" data-s="ask-item" data-type={it.type}>
                  <input type="checkbox" className="mt-3.5 size-5 accent-[var(--primary)] flex-none" checked={!!picked[i]} data-s="ask-pick" aria-label={`Add ${it.title}`}
                    onChange={e => setPicked(p => p.map((x, j) => (j === i ? e.target.checked : x)))} />
                  <div className="min-w-0 flex-1">
                    <TextInput value={titles[i] ?? ''} maxLength={120} data-s="ask-title" aria-label={`${TYPE_WORD[it.type]} title`} className="!min-h-11 !py-1.5"
                      onChange={e => setTitles(t => t.map((x, j) => (j === i ? e.target.value : x)))} />
                    <p className="text-[13px] text-fg-3 m-0 mt-1 flex flex-wrap items-center gap-x-1.5">
                      <span className="inline-flex items-center gap-1">{ICON[it.type]} {TYPE_WORD[it.type]}</span>
                      {it.date && <span>· {prettyDate(it.date)}{it.time ? `, ${it.time}` : ''}</span>}
                      {it.type === 'task' && <span>· {it.minutes} min · {CAT_LABEL[it.category]}</span>}
                      {it.projectId && <span>· in “{data.projects.items.find(p => p.id === it.projectId)?.title}”</span>}
                      {it.already && <span>· already on your lists</span>}
                    </p>
                    {it.type !== 'task' && it.text && it.text !== it.title && <p className="text-[13px] text-fg-2 m-0 mt-1 line-clamp-3">{it.text}</p>}
                  </div>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <Button variant="primary" data-action="ask-add" disabled={!picked.some(Boolean)} onClick={() => add(r)}>Add {picked.filter(Boolean).length || ''}</Button>
              <Button variant="ghost" data-action="ask-dismiss" onClick={() => setPhase({ at: 'idle' })}>Dismiss</Button>
            </div>
          </>}
          {r.kind === 'answer' && r.action?.type === 'start-study' && (() => { const a = r.action; return (
            <Button variant="primary" data-action="ask-action" onClick={() => { onClose(); startLearning(a.courseId, a.taskId, a.minutes, true); }}>Start {a.minutes} minutes on {a.label}</Button>); })()}
          {r.kind === 'answer' && r.action?.type === 'adjust-today' && (canAdjust(getSnapshot().data, k)
            ? <Button variant="primary" data-action="ask-action" onClick={() => { onClose(); handOverToAdjust(text); }}>Open Help me adjust today</Button>
            : <p className="text-[15px] text-fg-2 m-0" data-s="ask-build-first">Today’s plan isn’t built yet — set your energy and tap Build my day on Today, then Help me adjust today can shape it. <LinkButton data-action="ask-today" onClick={() => { onClose(); location.hash = 'today'; }}>Go to Today</LinkButton></p>)}
          {r.changed.length > 0 && <ul className="list-none p-0 m-0 mt-2 text-xs text-fg-3" data-s="ask-changed">{r.changed.map((c, i) => <li key={i}>{c}</li>)}</ul>}
          {!phase.followed ? (
            <div className="flex gap-2 mt-3 items-start">
              <TextInput value={more} maxLength={300} placeholder="Not quite? Tell MyDay more…" aria-label="Not quite? Tell MyDay more" data-s="ask-more" onChange={e => setMore(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && more.trim()) { e.preventDefault(); void ask({ previous: shownText(r), text: more }); } }} />
              <Button inline variant="ghost" className="whitespace-nowrap" data-action="ask-again" disabled={!more.trim()} onClick={() => { void ask({ previous: shownText(r), text: more }); }}>Ask again</Button>
            </div>
          ) : r.kind !== 'add' && r.kind !== 'steps' && <LinkButton data-action="ask-dismiss" onClick={() => setPhase({ at: 'idle' })}>Done</LinkButton>}
        </div>;
      })()}
    </div>
  );
}
