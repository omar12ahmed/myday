import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { ConfirmContext, type Ask, type ConfirmOptions } from './confirm';

// "Are you sure?" questions, asked in the page instead of the browser's pop-up.
// Use it from any component:  const confirm = useConfirm();  if (await confirm({ … })) { … }
// It's built on the browser's own <dialog> element, which keeps keyboard focus inside the dialog
// and closes on Escape (counted as "No").

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [question, setQuestion] = useState<(ConfirmOptions & { answer: (yes: boolean) => void }) | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  const ask = useCallback<Ask>(o => new Promise(resolve => setQuestion({ ...o, answer: resolve })), []);

  useEffect(() => {
    const d = ref.current;
    if (question && d && !d.open) d.showModal();
  }, [question]);

  function close(yes: boolean) {
    question?.answer(yes);
    ref.current?.close();
    setQuestion(null);
  }

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      <dialog
        ref={ref}
        aria-labelledby="dialog-title"
        onCancel={e => { e.preventDefault(); close(false); }}
        className="m-auto w-[min(440px,calc(100%-32px))] p-0 rounded-card border border-outline bg-surface text-fg shadow-card backdrop:bg-black/50"
      >
        {question && (
          <div className="p-5">
            <h2 id="dialog-title">{question.title}</h2>
            {question.body && <div className="text-[15px] text-fg-2 mb-4 [&_p]:mb-2">{question.body}</div>}
            <div className="grid gap-2.5">
              <Button variant="primary" data-action="dialog-confirm" onClick={() => close(true)}>{question.confirmLabel}</Button>
              <Button variant="ghost" data-action="dialog-cancel" onClick={() => close(false)}>{question.cancelLabel ?? 'Cancel'}</Button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
