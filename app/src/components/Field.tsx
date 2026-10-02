import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';

// Form fields with their styling in one place. Every field has a visible label (or an aria-label
// when the label is the text beside it), a 48px tap height and a clear focus ring.

const CONTROL =
  'w-full min-h-12 px-3 py-2.5 rounded-xl bg-surface-3 text-fg border border-outline-strong ' +
  'focus-visible:outline-3 focus-visible:outline-primary focus-visible:outline-offset-0 focus-visible:border-primary';

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
export function CommitInput({ onCommit, ...rest }: ComponentProps<'input'> & { onCommit: (el: HTMLInputElement) => void }) {
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
  return <TextInput ref={ref} {...rest} />;
}
