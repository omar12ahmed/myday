import { useCallback, useEffect, useRef } from 'react';

// One reply in parts, shown one at a time as you ask (graduated help, specs/study-home-and-lessons.md §12): "Check my
// answer" and the Cybersecurity tutor (RevealParts.tsx shows them).
export interface Parts { hint: string; example: string; explanation: string; followUp: { question: string; answer: string } }
// The button for the next part, after each one: a hint first, then each one only when you ask for it.
export const NEXT_PART = ['Show an example', 'Show the explanation', 'Try a follow-up question', 'Show its answer'];

// Where focus goes once the panel has changed (the button pressed may be gone by then): the newest part (`part`), or
// back to the panel's starting button (`start`, a selector inside `root`). Call `moveTo` just before the change.
export function useMoveFocus(change: unknown, start: string) {
  const root = useRef<HTMLDivElement>(null), part = useRef<HTMLDivElement>(null), to = useRef<'part' | 'start' | null>(null);
  useEffect(() => {
    const where = to.current; to.current = null;
    if (where === 'part') part.current?.focus();
    else if (where === 'start') root.current?.querySelector<HTMLElement>(start)?.focus();
  }, [change, start]);
  const moveTo = useCallback((where: 'part' | 'start') => { to.current = where; }, []);
  return { root, part, moveTo };
}
