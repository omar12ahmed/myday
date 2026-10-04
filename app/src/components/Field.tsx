import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';

// Form fields with their styling in one place. Every field has a visible label (or an aria-label
// when the label is the text beside it), a 48px tap height and a clear focus ring (an orange border with a soft
// glow around it — see index.css).

const CONTROL = 'w-full min-h-12 px-3 py-2.5 rounded-xl bg-surface-3 text-fg border border-outline-strong';

// A label above its control, e.g. <Field label="Starts" htmlFor="cfStart"><TextInput id="cfStart" … /></Field>
export function Field({ label, htmlFor, children, className = '' }: { label: string; htmlFor: string; children: ReactNode; className?: string }) {
  return (
    <div className={`grid gap-1.5 content-start ${className}`}>
      <label className="text-sm text-fg-2" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

export function TextInput({ className = '', ...rest }: ComponentProps<'input'>) {
  return <input className={`${CONTROL} ${className}`} {...rest} />;
}

export function Select({ className = '', children, ...rest }: ComponentProps<'select'>) {
  return <select className={`${CONTROL} ${className}`} {...rest}>{children}</select>;
}

// A field whose value is used when you've finished with it: when you leave the field, press Enter, or
// pick from a time picker (the browser's "change" event) — not on every keystroke, so a half-typed
// value is never checked or saved. Give it a `defaultValue`, and a `key` that changes when the saved
// value changes, so it shows the new value.
// A `ref` passed in also receives the input (e.g. to put the cursor in it).
export function CommitInput({ onCommit, ref: outer, ...rest }: ComponentProps<'input'> & { onCommit: (el: HTMLInputElement) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const latest = useRef(onCommit);
  useEffect(() => { latest.current = onCommit; });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const done = () => latest.current(el);
    el.addEventListener('change', done);
    return () => el.removeEventListener('change', done);
  }, []);
  const both = (el: HTMLInputElement | null) => {
    ref.current = el;
    if (typeof outer === 'function') outer(el);
    else if (outer) outer.current = el;
  };
  return <TextInput ref={both} {...rest} />;
}

export function TextArea({ className = '', ...rest }: ComponentProps<'textarea'>) {
  return <textarea className={`${CONTROL} resize-y ${className}`} {...rest} />;
}

// CommitInput's partner for longer text: used when you leave the box, not on every keystroke.
export function CommitTextarea({ onCommit, ...rest }: ComponentProps<'textarea'> & { onCommit: (el: HTMLTextAreaElement) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const latest = useRef(onCommit);
  useEffect(() => { latest.current = onCommit; });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const done = () => latest.current(el);
    el.addEventListener('change', done);
    return () => el.removeEventListener('change', done);
  }, []);
  return <TextArea ref={ref} {...rest} />;
}

// A field saved as you type (every keystroke), for things you'd lose by leaving mid-way, like a set's reps
// during a workout. While you type it shows exactly what you typed; otherwise it shows the saved value.
// `asSaved` says how typed text would be saved, as text (e.g. "42.50" → "42.5"), so the field knows
// whether the saved value has since changed elsewhere (then it shows that instead).
export function LiveInput({ value, onSave, asSaved, onBlur, ...rest }: Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
  value: string; onSave: (text: string) => void; asSaved: (text: string) => string;
}) {
  const [draft, setDraft] = useState<{ text: string; saved: string } | null>(null);
  const shown = draft && draft.saved === value ? draft.text : value;
  return (
    <TextInput {...rest} value={shown}
      onChange={e => { const text = e.target.value; setDraft({ text, saved: asSaved(text) }); onSave(text); }}
      onBlur={e => { setDraft(null); onBlur?.(e); }} />
  );
}
