import { useEffect, useRef, useState } from 'react';
import type { JourneyStep } from '../../data/study/mastery';
import { keepStep, keptStep } from '../lessonStep';
import { toStep } from './dom';

// Your step on a lesson journey: it follows you as you read and jump; with a session open it's kept on this device
// for that session (lessonStep.ts), and arriving with that session open takes you back to it, once. `sessionId` is
// read when needed (the open session's id, or null). Sections are `${prefix}-step-${step}` with data-${prefix}-step;
// the folded "rest" is data-${prefix}-rest.
export function useJourney({ prefix, shown, loaded, sessionId }: { prefix: string; shown: JourneyStep[]; loaded: boolean; sessionId: () => string | null }) {
  const [step, setStep] = useState<JourneyStep | null>(() => { const id = sessionId(); return id ? keptStep(id) : null; });
  const current = step && shown.includes(step) ? step : shown[0];
  const session = useRef(sessionId);
  useEffect(() => { session.current = sessionId; });
  const quiet = useRef(0); // after a jump, scrolling there doesn't move your step again
  const hush = () => { quiet.current = Date.now() + 900; };
  const remember = (s: JourneyStep) => { setStep(s); const id = session.current(); if (id) keepStep(id, s); };
  const jump = (s: JourneyStep) => { hush(); remember(s); toStep(prefix, s); };
  // Reading down the page moves your step to the section in view.
  const stepsKey = shown.join(' ');
  useEffect(() => {
    if (!loaded || typeof IntersectionObserver === 'undefined') return;
    let timer = 0;
    const io = new IntersectionObserver(entries => {
      const hit = entries.find(e => e.isIntersecting)?.target as HTMLElement | undefined;
      if (!hit || Date.now() < quiet.current) return;
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        const s = hit.getAttribute(`data-${prefix}-step`) as JourneyStep, id = session.current();
        setStep(s); if (id) keepStep(id, s);
      }, 300);
    }, { rootMargin: '-30% 0px -65% 0px' });
    document.querySelectorAll(`[data-${prefix}-step]`).forEach(el => { if (!el.closest(`[data-${prefix}-rest]`)) io.observe(el); });
    return () => { io.disconnect(); clearTimeout(timer); };
  }, [loaded, stepsKey, prefix]);
  // Arriving with a session open: back to the step you were on, once (after the page has gone to the top). Starting a
  // session on the page doesn't jump anywhere.
  const reopened = useRef(!sessionId());
  useEffect(() => {
    if (!loaded || reopened.current) return;
    reopened.current = true;
    if (!step) return;
    hush();
    const timer = setTimeout(() => document.getElementById(`${prefix}-step-${current}`)?.scrollIntoView({ block: 'start' }), 120);
    return () => clearTimeout(timer);
  }, [loaded, step, current, prefix]);
  return { step, setStep, current, remember, jump, hush };
}
