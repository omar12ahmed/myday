import { CalendarPlus, ListPlus, NotebookPen, Plus, Sparkles, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { CategoryChip } from '../components/CategoryChip';
import { Field, TextArea } from '../components/Field';
import { Note } from '../components/parts';
import { prettyDate } from '../data/dates';
import { categoryName } from '../data/notes';
import { CAT_LABEL } from '../data/plan';
import { toast } from '../data/toast';
import type { Category, MyDayData } from '../data/types';
import { loadLibs, parseCapture, type Capture, type CaptureLibs } from './parse';
import { addAppointment, addCapturedTask, appointmentEnd, saveNote } from './save';

// "+ Capture", on every screen: phones get a round button above the bar (easy to reach), wide screens one beside
// the theme button.
export function CaptureButton({ data }: { data: MyDayData }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="capture-btn" data-action="capture-open" aria-label="Capture: a note, task or appointment" onClick={() => setOpen(true)}>
        <Plus size={24} aria-hidden="true" /><span className="capture-label">Capture</span>
      </button>
      {open && <CaptureSheet data={data} onClose={() => setOpen(false)} />}
    </>
  );
}

let libsOnce: Promise<CaptureLibs> | null = null; // loaded the first time Capture opens, then kept

// Type anything; MyDay suggests what it looks like (a time → the Calendar, an action → a task, an idea, or just a
// note) — and does only what you tap. Nothing is spotted or sent anywhere but on this device.
export function CaptureSheet({ data, onClose }: { data: MyDayData; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState('');
  const [libs, setLibs] = useState<CaptureLibs | null>(null);
  const [cat, setCat] = useState<Category | null>(null); // a list you chose for the task (otherwise the guess)
  const [now] = useState(() => new Date());               // "tomorrow" means from when Capture opened
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    (libsOnce ??= loadLibs()).then(setLibs, () => setLibs(null));
  }, []);
  const c: Capture | null = libs && text.trim() ? parseCapture(text, now, libs, data.notes.categories) : null;
  const close = onClose; // the sheet (and its dialog) goes when it's closed
  const done = (ok: boolean, message: string) => { if (ok) { toast(message); close(); } else toast("Couldn't save just now — your text is still here."); };
  const taskCat = cat ?? c?.category ?? 'admin';

  const note = () => done(saveNote(text, c?.kind === 'idea' || c?.kind === 'note' ? c?.collection ?? '' : ''), c?.collection && (c.kind === 'idea' || c.kind === 'note') ? `Saved in “${categoryName(data.notes, c.collection)}”.` : 'Saved to your Notes inbox.');
  const inboxNote = () => done(saveNote(text, ''), 'Saved to your Notes inbox.');
  const calendar = () => c && c.date && c.time && done(addAppointment(c.title, c.date, c.time, c.endTime), `Added to your Calendar: ${c.title}, ${prettyDate(c.date)} at ${c.time}.`);
  const when = c && c.date ? `${prettyDate(c.date)}${c.time ? `, ${c.time}` : ''}` : '';
  const task = () => c && done(addCapturedTask(c.title, taskCat, c.date, c.time), `Added to your tasks: ${c.title}${when ? ` — ${when}` : ''}.`);

  // The suggestion first (primary), then the other choices.
  const end = c && c.date && c.time ? appointmentEnd(c.date, c.time, c.endTime) : null;
  const options: { key: string; label: string; icon: React.ReactNode; run: () => void }[] = [];
  if (c && c.date && c.time) options.push({ key: 'calendar', label: `Add to Calendar — ${prettyDate(c.date)}, ${c.time}–${end!.time}`, icon: <CalendarPlus size={18} aria-hidden="true" />, run: calendar });
  if (c) options.push({ key: 'task', label: `Add as a task — ${when ? `${when} · ` : ''}${CAT_LABEL[taskCat]}`, icon: <ListPlus size={18} aria-hidden="true" />, run: task });
  if (c && c.collection && (c.kind === 'note' || c.kind === 'idea')) options.push({ key: 'collection', label: `Save in ${categoryName(data.notes, c.collection)}`, icon: <Sparkles size={18} aria-hidden="true" />, run: note });
  options.push({ key: 'note', label: 'Save to Notes inbox', icon: <NotebookPen size={18} aria-hidden="true" />, run: inboxNote });
  const first = !c ? 'note' : c.kind === 'appointment' ? 'calendar' : c.kind === 'task' ? 'task' : c.collection ? 'collection' : 'note';
  const ordered = [...options.filter(o => o.key === first), ...options.filter(o => o.key !== first)];

  return (
    <dialog ref={ref} aria-labelledby="capture-h" id="captureSheet" onCancel={e => { e.preventDefault(); close(); }}
      className="m-auto mt-[max(16px,env(safe-area-inset-top))] w-[min(560px,calc(100%-24px))] p-0 rounded-card border border-outline bg-surface text-fg shadow-card backdrop:bg-black/50">
      <form className="p-5" onSubmit={e => { e.preventDefault(); if (text.trim()) ordered[0].run(); }}>
        <h2 id="capture-h" className="flex items-center gap-2"><Plus size={20} aria-hidden="true" className="text-primary" /> Capture</h2>
        <Field label="Anything on your mind — a task, a time, an idea or a thought" htmlFor="captureText">
          <TextArea id="captureText" rows={3} autoFocus value={text} maxLength={2000} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (text.trim()) ordered[0].run(); } }}
            placeholder="e.g. call GP tomorrow at 10am" />
        </Field>
        {c && (c.when || c.people.length > 0 || c.kind === 'task') && (
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-fg-2" id="captureSpotted" aria-live="polite">
            <span className="font-semibold">Spotted:</span>
            {c.when && <span className="inline-flex items-center gap-1 bg-surface-2 rounded-full px-2.5 py-1" data-s="spotted-when"><CalendarPlus size={14} aria-hidden="true" /> {prettyDate(c.date!)}{c.time ? `, ${c.time}${c.endTime ? `–${c.endTime}` : ''}` : ''}</span>}
            {c.people.map(p => <span key={p} className="inline-flex items-center gap-1 bg-surface-2 rounded-full px-2.5 py-1"><User size={14} aria-hidden="true" /> {p}</span>)}
            {(c.kind === 'task' || (c.date && !c.time)) && <CategoryChip kind={taskCat} />}
          </div>
        )}
        {c && options.some(o => o.key === 'task') && (
          <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="Which list, if it's a task">
            {(['learning', 'admin', 'health'] as Category[]).map(x => (
              <Button key={x} inline variant={taskCat === x ? 'selected' : 'ghost'} aria-pressed={taskCat === x} data-s="capture-cat" data-id={x} className="!min-h-11" onClick={() => setCat(x)}>{CAT_LABEL[x]}</Button>
            ))}
          </div>
        )}
        <div className="grid gap-2.5 mt-4" id="captureChoices">
          {text.trim() && !libs && <p className="text-sm text-fg-3 m-0" role="status">Getting ready…</p>}
          {ordered.map((o, i) => (
            <Button key={o.key} type={i === 0 ? 'submit' : 'button'} variant={i === 0 ? 'primary' : 'tonal'} data-action={`capture-${o.key}`} disabled={!text.trim()}
              className="!justify-start !text-left" onClick={i === 0 ? undefined : o.run}>{o.icon} <span className="min-w-0">{o.label}</span></Button>
          ))}
          <Button variant="ghost" data-action="capture-cancel" onClick={close}>Cancel</Button>
        </div>
        <Note className="mt-3 mb-0 text-sm">Everything is worked out on this device — nothing you type is sent anywhere.</Note>
      </form>
    </dialog>
  );
}
