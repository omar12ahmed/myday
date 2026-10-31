import { ArrowRight, BookOpen, CalendarPlus, FileText, Flag, FolderKanban, ListChecks, ListPlus, Minus, NotebookPen, PencilLine, Plus, Scale, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { rememberAsk, undoNow } from '../ai/lastAsk';
import { addAskItems, applyAskChanges, applyAskEdit, checkAskReply, countWords, DAY_TOO_FAR, NEW_PROJECT, type AskChangeUndo, type AskChecked, type AskEdit, type AskProposal, type AskUndo } from '../ai/ask';
import { askContext, askPreview, askSlice } from '../ai/askContext';
import { dayLookup, decisionsLookup, lookupLine, projectLookup, searchLookup, studyLookup, waitingLookup, type LookupMore } from '../ai/lookup';
import type { AskLookup } from '../../../supabase/functions/_shared/ai/ask-shape.ts';
import { canAdjust, handOverToAdjust } from '../ai/handover';
import type { AskFocus } from './openCapture';
import { AI_MODE, askModel } from '../ai/request';
import { Button } from '../components/Button';
import { Select, TextArea, TextInput } from '../components/Field';
import { LinkButton } from '../components/parts';
import { prettyDate, todayKey } from '../data/dates';
import { CAT_LABEL } from '../data/plan';
import { catchUp, getSnapshot } from '../data/storage';
import { toast } from '../data/toast';
import type { Category, MyDayData } from '../data/types';
import { startLearning, startRevision } from '../study/actions';

// "Ask MyDay" in the + Capture sheet (the AI design's step 1): for what the on-device suggestions can't do — a question,
// a breakdown into steps, several things at once. Only on your tap; the "Sends:" line says exactly what goes with it
// (the page's slice, askContext.ts). What comes back is checked against your data (ai/ask.ts) and shown as cards:
// things to add (tick, rename, Add — one step of Undo), steps, changes to what's already saved (before → after, tick,
// Apply — Undo puts the old values back), a short answer with at most one action, or "can't do that here". One follow-up at most; nothing is kept of the conversation.
// A lookup (ai/lookup.ts): what was sent, and how many private things matched (that count stays here).
type Looked = { lookup: AskLookup; leftOut: number; hrefs?: Record<string, string>; more?: LookupMore; at?: Date }; // more and at: what didn't go, and when it was read, for its line; hrefs: where what it found opens (study's next steps, a look across MyDay's finds): the device's own
type Shown = Exclude<AskChecked, { kind: 'lookup' }>;
// MyDay's server keeps a few seconds between requests (AI_MIN_SECONDS_BETWEEN, 5 by default), so a lookup's second
// request waits out the rest of them — and once more if the server still says it's too soon.
const PACE_MS = 5500;
const clock = () => Date.now();
const pause = (ms: number, signal: AbortSignal) => new Promise<void>(done => {
  if (ms <= 0 || signal.aborted) { done(); return; }
  const t = setTimeout(done, ms);
  signal.addEventListener('abort', () => { clearTimeout(t); done(); }, { once: true });
});
type Phase =
  | { at: 'idle' }
  | { at: 'asking' }
  | { at: 'looking'; tool: 'day' | 'project' | 'decisions' | 'waiting' | 'study' | 'search'; query: string }
  | { at: 'shown'; r: Shown; model: string; followed: boolean; looked?: Looked }
  | { at: 'added'; undo: AskUndo; words: string; id: string } // id: how it's kept for Undo from + later (ai/lastAsk.ts)
  | { at: 'applied'; undo: AskChangeUndo; words: string; id: string }
  | { at: 'error'; message: string; looked?: Looked }; // looked: what a lookup found, so trying again doesn't look twice

const ICON: Record<AskProposal['type'], ReactNode> = {
  task: <ListPlus size={16} aria-hidden="true" />, note: <NotebookPen size={16} aria-hidden="true" />,
  appointment: <CalendarPlus size={16} aria-hidden="true" />, project: <FolderKanban size={16} aria-hidden="true" />, 'study-task': <BookOpen size={16} aria-hidden="true" />,
  change: <PencilLine size={16} aria-hidden="true" />,
  milestone: <Flag size={16} aria-hidden="true" />, pro: <Plus size={16} aria-hidden="true" />, con: <Minus size={16} aria-hidden="true" />, option: <Scale size={16} aria-hidden="true" />,
  'must-be-true': <FileText size={16} aria-hidden="true" />, step: <ListChecks size={16} aria-hidden="true" />,
};
const TYPE_WORD: Record<AskProposal['type'], string> = { task: 'Task', note: 'Note', appointment: 'Appointment', project: 'Project', 'study-task': 'Study task', change: 'Change', milestone: 'Milestone', pro: 'Pro', con: 'Con', option: 'Option', 'must-be-true': 'Must be true', step: 'Step' };

// The answer as it was shown, for the one follow-up.
function shownText(r: Shown): string {
  const parts = [r.message];
  if (r.kind === 'add' || r.kind === 'steps') parts.push(...r.items.map(i => `- ${TYPE_WORD[i.type]}: ${i.title}`));
  if (r.kind === 'change') parts.push(...r.changes.map(c => `- Change ${c.target} “${c.label}”: ${c.lines.map(l => `${l.field.toLowerCase()} ${l.before} → ${l.after}`).join('; ')}`));
  if (r.kind === 'answer' && r.action) parts.push(r.action.type === 'adjust-today' ? '(offered: Help me adjust today)' : r.action.type === 'start-revision' ? `(offered: revise ${r.action.count} cards)` : `(offered: start ${r.action.minutes} minutes on ${r.action.label})`);
  return parts.filter(Boolean).join('\n');
}

// After Undo the button that was focused goes, so focus goes back to the text field (a screen reader keeps its place).
const backToField = () => document.getElementById('captureText')?.focus();

export function AskPanel({ data, text, focus, onClose }: { data: MyDayData; text: string; focus?: AskFocus; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>({ at: 'idle' });
  const [picked, setPicked] = useState<boolean[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [edits, setEdits] = useState<Record<number, AskEdit>>({});
  const [editing, setEditing] = useState<number | null>(null);
  const [more, setMore] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const [slice] = useState(() => askSlice(data, location.hash, todayKey(), focus)); // the page the sheet was opened on (and what it's about)
  const [generation] = useState(() => getSnapshot().generation);
  const [opened] = useState(() => new Date());                    // for the preview's "when" (the request itself uses the time you tap)
  if (AI_MODE === 'off') return null;
  const k = todayKey();

  // Another tab, sync or a restore may have made something in this preview private. Require a fresh preview before
  // sending, showing a late reply, or applying it; catch up even if the browser's storage event hasn't arrived yet.
  function previewIsCurrent() {
    catchUp();
    if (getSnapshot().generation === generation) return true;
    setPhase({ at: 'error', message: 'MyDay changed in another tab or on another device. Close Capture and open it again to check what will be sent.' });
    return false;
  }
  // `prior`: the lookup behind the answer you're following up on (sent again; no new lookup for the same question).
  async function ask(followUp?: { previous: string; text: string }, prior?: Looked) {
    if (!previewIsCurrent()) return;
    request.current?.abort();
    const ctrl = new AbortController(); request.current = ctrl;
    setPhase({ at: 'asking' });
    const asked = [text, followUp?.text].filter(Boolean).join('\n');
    let looked = prior;
    const started = clock();
    let reply = await askModel(askContext(slice, text, k, undefined, followUp, looked?.lookup), ctrl.signal); // the time now (askContext reads the clock)
    if (ctrl.signal.aborted) return;
    if (!previewIsCurrent()) return;
    if (!reply.ok) { setPhase({ at: 'error', message: reply.message, ...(looked ? { looked } : {}) }); return; }
    let r = checkAskReply(reply.text, getSnapshot().data, slice, k, asked, looked?.lookup, looked?.hrefs);
    if (r?.kind === 'lookup') {
      // It needs something more: look on this device, through the privacy rules, and ask once more with what was found
      // (after the server's pause between requests; the newest data, checked again, is what's searched).
      // (While looking, a project is shown by its title.)
      const q = r.query;
      setPhase({ at: 'looking', tool: r.tool, query: r.tool === 'project' || ((r.tool === 'decisions' || r.tool === 'waiting') && q !== 'all') ? getSnapshot().data.projects.items.find(p => p.id === q)?.title ?? 'that project' : q });
      // (A look across MyDay loads the courses' titles only now — before the check below, so what's searched and sent is
      // the newest data, checked, however long they take to arrive.)
      const courses = r.tool === 'search' ? await import('../search/courseIndex').then(m => m.courseIndex()).catch(() => null) : null;
      if (AI_MODE === 'edge') await pause(PACE_MS - (clock() - started), ctrl.signal);
      if (ctrl.signal.aborted || !previewIsCurrent()) return;
      const now = getSnapshot().data;
      const found = r.tool === 'day' ? dayLookup(now, r.query, k) : r.tool === 'project' ? projectLookup(now, r.query) : r.tool === 'decisions' ? decisionsLookup(now, r.query) : r.tool === 'waiting' ? waitingLookup(now, r.query) : r.tool === 'study' ? studyLookup(now, k)
        : searchLookup(now, r.query, courses, k);
      if (!found) { setPhase({ at: 'error', message: r.tool === 'day' ? DAY_TOO_FAR : 'That project can’t be looked at now — it may have been finished or made private.' }); return; }
      looked = { ...found, at: new Date(clock()) };
      const again = () => askModel(askContext(slice, text, k, undefined, followUp, looked!.lookup), ctrl.signal);
      reply = await again();
      if (!reply.ok && reply.reason === 'too-fast') {
        await pause(PACE_MS, ctrl.signal);
        if (ctrl.signal.aborted || !previewIsCurrent()) return;
        reply = await again();
      }
      if (ctrl.signal.aborted) return;
      if (!previewIsCurrent()) return;
      if (!reply.ok) { setPhase({ at: 'error', message: reply.message, looked }); return; }
      r = checkAskReply(reply.text, getSnapshot().data, slice, k, asked, looked.lookup, looked.hrefs);
    }
    if (!r || r.kind === 'lookup') { setPhase({ at: 'error', message: "The answer that came back couldn't be used — nothing was added. Try again, or put it another way.", ...(looked ? { looked } : {}) }); return; }
    if (r.kind === 'add' || r.kind === 'steps') { setPicked(r.items.map(i => !i.already)); setTitles(r.items.map(i => i.title)); setEdits({}); setEditing(null); }
    if (r.kind === 'change') setPicked(r.changes.map(() => true));
    setMore('');
    setPhase({ at: 'shown', r, model: reply.model, followed: !!followUp, ...(looked ? { looked } : {}) });
  }
  function add(r: Extract<AskChecked, { kind: 'add' | 'steps' }>) {
    if (!previewIsCurrent()) return;
    const chosen = r.items.map((it, i) => ({ ...applyAskEdit(it, edits[i], k), title: titles[i]?.trim().slice(0, 120) || it.title })).filter((_, i) => picked[i]);
    if (!chosen.length) return;
    const undo = addAskItems(chosen);
    if (!undo) { toast("Couldn't save just now — nothing was added."); return; }
    const words = countWords(chosen);
    toast(`Added ${words}.`);
    const id = rememberAsk({ kind: 'added', undo, words }); // undoable from + until midnight, after this panel has closed
    setPhase({ at: 'added', undo, words, id });
  }
  function apply(r: Extract<AskChecked, { kind: 'change' }>) {
    if (!previewIsCurrent()) return;
    const chosen = r.changes.filter((_, i) => picked[i]);
    if (!chosen.length) return;
    const undo = applyAskChanges(chosen);
    if (!undo) { toast("Couldn't save just now — nothing was changed."); return; }
    const words = chosen.length === 1 ? `“${chosen[0].label}”` : `${chosen.length} things`;
    toast(`Changed ${words}.`);
    const id = rememberAsk({ kind: 'changed', undo, words });
    setPhase({ at: 'applied', undo, words, id });
  }

  const label = (model: string) => (AI_MODE === 'mock' ? 'Ask MyDay · practice helper (no AI)' : `Ask MyDay · AI-written by ${model} — check before adding`);
  return (
    <div className="mt-4 pt-4 border-t border-outline" data-s="ask-panel" data-phase={phase.at}>
      {(phase.at === 'idle' || phase.at === 'error') && <>
        <Button variant="tonal" data-action="ask-go" disabled={!text.trim()} onClick={() => { void ask(undefined, phase.at === 'error' ? phase.looked : undefined); }}><Sparkles size={18} aria-hidden="true" /> Ask MyDay</Button>
        {(() => { const pv = askPreview(askContext(slice, text, k, opened), slice.privateNote, slice.held); return (
          <div className="mt-2 text-xs text-fg-2" data-s="ask-sends">
            <p className="m-0 font-semibold text-fg-3">Sent to the AI with what you type:</p>
            <ul className="list-none p-0 m-0 mt-1 flex flex-wrap gap-1.5">{pv.short.map(x => <li key={x} className="bg-surface-2 rounded-full px-2.5 py-1">{x}</li>)}</ul>
            <details className="mt-1" data-s="ask-sends-all">
              <summary className="cursor-pointer text-primary font-semibold min-h-11 flex items-center">Show everything that’s sent</summary>
              {pv.all.map(sec => <div key={sec.label} className="mt-1.5"><p className="m-0 font-semibold text-fg">{sec.label}</p>
                <ul className="m-0 pl-4 list-disc">{sec.lines.map((l, i) => <li key={i} className="break-words">{l}</li>)}</ul></div>)}
            </details>
            <p className="m-0 text-fg-3">Nothing is saved or changed until you tap Add or Apply. <LinkButton data-action="ask-knows" className="text-xs" onClick={() => { onClose(); location.hash = 'knows'; window.scrollTo(0, 0); }}>What MyDay knows</LinkButton></p>
          </div>); })()}
      </>}
      {phase.at === 'error' && <p role="alert" className="text-[15px] bg-warn-c text-on-warn-c rounded-tile px-3 py-2 mt-2.5 mb-0">{phase.message}</p>}
      {phase.at === 'asking' && <p role="status" className="text-[15px] text-fg-2 flex items-center gap-2 my-1"><span className="size-3 rounded-full bg-primary motion-safe:animate-pulse flex-none" aria-hidden="true" /> Asking MyDay…</p>}
      {phase.at === 'looking' && <p role="status" className="text-[15px] text-fg-2 flex items-center gap-2 my-1" data-s="ask-looking"><span className="size-3 rounded-full bg-primary motion-safe:animate-pulse flex-none" aria-hidden="true" /> {phase.tool === 'day' ? `Looking at ${prettyDate(phase.query)}…` : phase.tool === 'project' ? `Looking at your project “${phase.query}”…` : phase.tool === 'decisions' ? (phase.query === 'all' ? 'Looking at your open decisions…' : `Looking at the open decisions in “${phase.query}”…`) : phase.tool === 'waiting' ? (phase.query === 'all' ? 'Looking at what you’re waiting on…' : `Looking at what you’re waiting on in “${phase.query}”…`) : phase.tool === 'study' ? 'Looking at what to study next…' : `Looking across MyDay for “${phase.query}”…`}</p>}
      {phase.at === 'added' && <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-s="ask-added">
        <p className="text-[15px] m-0">Added {phase.words}.</p>
        <LinkButton data-action="ask-undo" onClick={() => { const r = undoNow({ kind: 'added', undo: phase.undo, id: phase.id }); toast(r.message); if (r.done) { setPhase({ at: 'idle' }); backToField(); } }}>Undo</LinkButton>
        <LinkButton data-action="ask-close" className="ml-auto" onClick={onClose}>Close</LinkButton>
      </div>}
      {phase.at === 'applied' && <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-s="ask-applied">
        <p className="text-[15px] m-0">Changed {phase.words}.</p>
        <LinkButton data-action="ask-undo" onClick={() => {
          // Anything changed since (a tick on Today, your own edit) is yours, so it stays and the message says so.
          const r = undoNow({ kind: 'changed', undo: phase.undo, id: phase.id }); toast(r.message); if (r.done) { setPhase({ at: 'idle' }); backToField(); }
        }}>Undo</LinkButton>
        <LinkButton data-action="ask-close" className="ml-auto" onClick={onClose}>Close</LinkButton>
      </div>}
      {phase.at === 'shown' && (() => {
        const r = phase.r;
        return <div aria-live="polite">
          <p className="text-xs font-semibold text-fg-3 m-0 flex items-center gap-1.5"><Sparkles size={14} aria-hidden="true" /> {label(phase.model)}</p>
          {phase.looked && <p className="text-[13px] text-fg-2 m-0 mt-1" data-s="ask-looked">{lookupLine(phase.looked.lookup, phase.looked.leftOut, getSnapshot().data.projects.items.find(p => p.id === phase.looked!.lookup.query)?.title, { more: phase.looked.more, at: phase.looked.at })}
            {phase.looked.lookup.tool === 'project' && <> <a className="text-primary underline inline-flex items-center min-h-11 -my-3" href={`#projects/p/${encodeURIComponent(phase.looked.lookup.query)}`} onClick={onClose} data-s="ask-project">Open the project</a></>}</p>}
          {r.message && <p className="text-[15px] mt-1.5 mb-2 whitespace-pre-wrap" data-s="ask-message">{r.message}</p>}
          {(r.kind === 'answer' || r.kind === 'add' || r.kind === 'steps') && r.sources?.length ? (
            <p className="text-[13px] text-fg-2 m-0 mb-2" data-s="ask-sources">{phase.looked?.lookup.tool === 'decisions' ? 'From your decisions' : phase.looked?.lookup.tool === 'waiting' ? 'Waiting' : phase.looked?.lookup.tool === 'study' ? 'Open' : phase.looked?.lookup.tool === 'search' ? 'Found in MyDay' : 'From your notes'}: {r.sources.map((x, i) => <span key={x.id}>{i ? ', ' : ''}<a className="text-primary underline inline-flex items-center min-h-11 -my-3" href={x.href ?? `#projects/notes/${encodeURIComponent(x.id)}`} onClick={onClose} data-s="ask-source">{x.title}</a></span>)}</p>
          ) : null}
          {(r.kind === 'add' || r.kind === 'steps') && <>
            <ul className="list-none p-0 m-0 grid gap-2">
              {r.items.map((orig, i) => { const it = applyAskEdit(orig, edits[i], k), e = edits[i] ?? {}, set = (patch: AskEdit) => setEdits(x => ({ ...x, [i]: { ...x[i], ...patch } })); return (
                <li key={i} className="flex items-start gap-2.5 rounded-tile border border-outline px-3 py-2" data-s="ask-item" data-type={it.type}>
                  <input type="checkbox" className="mt-3.5 size-5 accent-[var(--primary)] flex-none" checked={!!picked[i]} data-s="ask-pick" aria-label={`Add ${it.title}`}
                    onChange={e => setPicked(p => p.map((x, j) => (j === i ? e.target.checked : x)))} />
                  <div className="min-w-0 flex-1">
                    <TextInput value={titles[i] ?? ''} maxLength={it.type === 'must-be-true' ? 110 : 120} data-s="ask-title" aria-label={`${TYPE_WORD[it.type]} title`} className="!min-h-11 !py-1.5"
                      onChange={e => setTitles(t => t.map((x, j) => (j === i ? e.target.value : x)))} />
                    <p className="text-[13px] text-fg-3 m-0 mt-1 flex flex-wrap items-center gap-x-1.5">
                      <span className="inline-flex items-center gap-1">{ICON[it.type]} {TYPE_WORD[it.type]}</span>
                      {it.date && <span>· {it.type === 'milestone' ? 'aiming for ' : ''}{prettyDate(it.date)}{it.time ? `, ${it.time}` : ''}</span>}
                      {(it.type === 'pro' || it.type === 'con') && <span>· for “{it.text}”</span>}
                      {it.type === 'must-be-true' && <span>· on your one page, not checked yet</span>}
                      {it.type === 'task' && <span>· {it.minutes} min · {CAT_LABEL[it.category]}</span>}
                      {it.study && <span>· {it.minutes} min · {it.study.kind === 'practical' ? 'Practical' : 'Learn'} · in {it.study.sectionId
                        ? `“${slice.context.course?.modules.flatMap(m => m.sections).find(x => x.id === it.study!.sectionId)?.title || 'this section'}”`
                        : `a new section “${it.study.section}”${it.study.module ? ` (new module “${it.study.module}”)` : ''}`}</span>}
                      {it.projectId && <span>· in “{it.projectId === NEW_PROJECT ? r.items.find(x => x.type === 'project')?.title : data.projects.items.find(p => p.id === it.projectId)?.title}”</span>}
                      {it.listId && <span>· list “{data.tasks.lists.find(l => l.id === it.listId)?.name}”</span>}
                      {it.already && <span>· {it.stepOf ? `already a step of “${it.stepOf}”` : 'already on your lists'}</span>}
                    </p>
                    {(it.type === 'note' || it.type === 'project') && it.text && it.text !== it.title && editing !== i && <p className="text-[13px] text-fg-2 m-0 mt-1 line-clamp-3">{it.text}</p>}
                    {editing === i ? (
                      <div className="grid grid-cols-2 gap-2 mt-2 min-w-0" data-s="ask-edit">
                        {(it.type === 'task' || it.type === 'appointment' || orig.type === 'appointment') && <>
                          <label className="text-xs text-fg-2 grid gap-1 min-w-0">Day<TextInput type="date" min={k} value={e.date ?? it.date ?? ''} data-f="ask-date" className="!min-h-11 !py-1.5 min-w-0 !px-2" onChange={ev => set({ date: ev.target.value })} /></label>
                          <label className="text-xs text-fg-2 grid gap-1 min-w-0">Time<TextInput type="time" value={e.time ?? it.time ?? ''} data-f="ask-time" disabled={!it.date} className="!min-h-11 !py-1.5 min-w-0 !px-2" onChange={ev => set({ time: ev.target.value })} /></label>
                        </>}
                        {it.type === 'task' && <>
                          <label className="text-xs text-fg-2 grid gap-1">Minutes<TextInput type="number" inputMode="numeric" min={5} max={120} value={e.minutes ?? String(it.minutes)} data-f="ask-minutes" className="!min-h-11 !py-1.5" onChange={ev => set({ minutes: ev.target.value })} /></label>
                          <label className="text-xs text-fg-2 grid gap-1">List<Select value={it.category} data-f="ask-list" className="!min-h-11 !py-1.5" onChange={ev => set({ category: ev.target.value as Category })}>
                            {(['learning', 'admin', 'health'] as Category[]).map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}</Select></label>
                        </>}
                        {it.type === 'study-task' && <>
                          <label className="text-xs text-fg-2 grid gap-1 min-w-0">Minutes<TextInput type="number" inputMode="numeric" min={5} max={120} value={e.minutes ?? String(it.minutes)} data-f="ask-minutes" className="!min-h-11 !py-1.5" onChange={ev => set({ minutes: ev.target.value })} /></label>
                          <label className="text-xs text-fg-2 grid gap-1 min-w-0">Kind<Select value={it.study?.kind ?? 'learn'} data-f="ask-kind" className="!min-h-11 !py-1.5" onChange={ev => set({ kind: ev.target.value as 'learn' | 'practical' })}>
                            <option value="learn">Learn</option><option value="practical">Practical</option></Select></label>
                        </>}
                        {(it.type === 'note' || it.type === 'project') && <label className="col-span-2 text-xs text-fg-2 grid gap-1">{it.type === 'note' ? 'Note' : 'What it’s about'}
                          <TextArea rows={3} maxLength={1000} value={e.text ?? it.text} data-f="ask-text" onChange={ev => set({ text: ev.target.value })} /></label>}
                        <LinkButton data-action="ask-edit-done" className="col-span-2 text-sm" onClick={() => setEditing(null)}>Done</LinkButton>
                      </div>
                    ) : it.plan ? null : <LinkButton data-action="ask-edit" className="text-sm" aria-label={`Edit ${titles[i] || it.title}`} onClick={() => setEditing(i)}>Edit</LinkButton>}
                  </div>
                </li>); })}
            </ul>
            {r.kind === 'steps' && slice.context.task && <p className="text-[13px] text-fg-3 m-0 mt-2" data-s="ask-steps-where">{r.items.some(i => i.type === 'step')
              ? <>They go into the checklist of “{slice.context.task.title}”, ticked off as you do them.</>
              : <>They go in the same list and project as “{slice.context.task.title}”, which stays as it is — tick it off once the steps are done.</>}</p>}
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <Button variant="primary" data-action="ask-add" disabled={!picked.some(Boolean)} onClick={() => add(r)}>Add {picked.filter(Boolean).length || ''}</Button>
              <Button variant="ghost" data-action="ask-dismiss" onClick={() => setPhase({ at: 'idle' })}>Dismiss</Button>
            </div>
          </>}
          {r.kind === 'change' && <>
            <ul className="list-none p-0 m-0 grid gap-2">
              {r.changes.map((c, i) => (
                <li key={`${c.target}:${c.id}`} className="flex items-start gap-2.5 rounded-tile border border-outline px-3 py-2" data-s="ask-change" data-target={c.target}>
                  <input type="checkbox" className="mt-1 size-5 accent-[var(--primary)] flex-none" checked={!!picked[i]} data-s="ask-pick" aria-label={`Change ${c.label}`}
                    onChange={e => setPicked(p => p.map((x, j) => (j === i ? e.target.checked : x)))} />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[15px] font-semibold break-words">{c.label}</p>
                    <p className="text-[13px] text-fg-3 m-0 flex items-center gap-1">{ICON[c.target]} {TYPE_WORD[c.target]}</p>
                    <ul className="list-none p-0 m-0 mt-1 grid gap-0.5 text-[14px]">
                      {c.lines.map(l => <li key={l.field} className="flex flex-wrap items-center gap-x-1.5 break-words" data-s="ask-change-line">
                        <span className="text-fg-2">{l.field}:</span> <s className="text-fg-3">{l.before}</s>
                        <ArrowRight size={14} aria-label="becomes" className="flex-none" /> <span className="font-semibold">{l.after}</span></li>)}
                    </ul>
                  </div>
                </li>))}
            </ul>
            <div className="grid grid-cols-2 gap-2.5 mt-3">
              <Button variant="primary" data-action="ask-apply" disabled={!picked.some(Boolean)} onClick={() => apply(r)}>Apply {picked.filter(Boolean).length || ''}</Button>
              <Button variant="ghost" data-action="ask-dismiss" onClick={() => setPhase({ at: 'idle' })}>Dismiss</Button>
            </div>
          </>}
          {r.kind === 'answer' && r.action?.type === 'start-study' && (() => { const a = r.action; return (
            <Button variant="primary" data-action="ask-action" onClick={() => { onClose(); startLearning(a.courseId, a.taskId, a.minutes, true); }}>Start {a.minutes} minutes on {a.label}</Button>); })()}
          {r.kind === 'answer' && r.action?.type === 'start-revision' && (() => { const a = r.action; return (
            <Button variant="primary" data-action="ask-action" onClick={() => { onClose(); startRevision(a.scope); }}>Revise {a.count === 1 ? '1 card' : `${a.count} cards`} now</Button>); })()}
          {r.kind === 'answer' && r.action?.type === 'adjust-today' && (canAdjust(getSnapshot().data, k)
            ? <Button variant="primary" data-action="ask-action" onClick={() => { onClose(); handOverToAdjust(text); }}>Open Help me adjust today</Button>
            : <p className="text-[15px] text-fg-2 m-0" data-s="ask-build-first">Today’s plan isn’t built yet — set your energy and tap Build my day on Today, then Help me adjust today can shape it. <LinkButton data-action="ask-today" onClick={() => { onClose(); location.hash = 'today'; }}>Go to Today</LinkButton></p>)}
          {r.changed.length > 0 && <ul className="list-none p-0 m-0 mt-2 text-xs text-fg-3" data-s="ask-changed">{r.changed.map((c, i) => <li key={i}>{c}</li>)}</ul>}
          {!phase.followed ? (
            <div className="flex gap-2 mt-3 items-start">
              <TextInput value={more} maxLength={300} placeholder="Not quite? Tell MyDay more…" aria-label="Not quite? Tell MyDay more" data-s="ask-more" onChange={e => setMore(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && more.trim()) { e.preventDefault(); void ask({ previous: shownText(r), text: more }, phase.looked); } }} />
              <Button inline variant="ghost" className="whitespace-nowrap" data-action="ask-again" disabled={!more.trim()} onClick={() => { void ask({ previous: shownText(r), text: more }, phase.looked); }}>Ask again</Button>
            </div>
          ) : r.kind !== 'add' && r.kind !== 'steps' && r.kind !== 'change' && <LinkButton data-action="ask-dismiss" onClick={() => setPhase({ at: 'idle' })}>Done</LinkButton>}
        </div>;
      })()}
    </div>
  );
}
