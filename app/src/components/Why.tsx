import { useId, useState } from 'react';

// A short note about something MyDay changed for you, with a "Why?" that shows what it was based on.
export function Why({ note, why, className = '' }: { note?: string | null; why: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={`why-note text-sm text-fg-2 ${className}`}>
      <p className="m-0">
        {note && <span className="mr-1">{note}</span>}
        <button type="button" className="inline-flex items-center justify-center min-h-11 min-w-11 -my-3 px-1 bg-transparent border-0 text-primary font-semibold underline underline-offset-2 cursor-pointer"
          aria-expanded={open} aria-controls={id} data-action="why" onClick={() => setOpen(!open)}>{open ? 'Hide why' : 'Why?'}</button>
      </p>
      <p id={id} className="why-text m-0 mt-1 text-fg-2" hidden={!open}>{why}</p>
    </div>
  );
}
