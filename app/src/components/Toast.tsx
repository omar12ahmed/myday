import { useEffect, useState } from 'react';
import { onToast } from '../data/toast';

// The short message that slides up at the bottom of the screen for 3 seconds (e.g. "Saved.").
// Screen readers announce it without moving focus.
export function Toast() {
  const [message, setMessage] = useState('');
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const off = onToast(m => {
      setMessage(m);
      setShown(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShown(false), 3000);
    });
    return () => { off(); clearTimeout(timer); };
  }, []);

  return (
    <div
      id="toast"
      role="status"
      aria-live="polite"
      className={`toast fixed left-1/2 z-30 max-w-[calc(100%-32px)] px-[18px] py-3 rounded-xl bg-inverse text-on-inverse text-[15px] shadow-raised pointer-events-none transition-[opacity,translate] duration-200 -translate-x-1/2 ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
    >
      {message}
    </div>
  );
}
