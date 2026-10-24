import type { JourneyStep } from '../../data/study/mastery';

// Moving around a lesson journey (Arabic: prefix "ar", Cybersecurity: "cy"): to a step's section, or to one small
// thing in it, with keyboard focus going along (a heading or a box gets focus quietly, without scrolling twice).
export const visible = (el: Element) => el.getClientRects().length > 0;
export function focusQuietly(el: HTMLElement) {
  if (!el.matches('textarea, button, input, select, a[href]')) el.tabIndex = -1;
  el.focus({ preventScroll: true });
}
// To a step's section (`${prefix}-step-${step}`), its heading taking focus. Waits a frame so a section that has just
// appeared is there.
export function toStep(prefix: string, step: JourneyStep, focus = true) {
  requestAnimationFrame(() => {
    const el = document.getElementById(`${prefix}-step-${step}`);
    if (!el) return;
    el.scrollIntoView({ block: 'start' });
    const heading = el.querySelector<HTMLElement>('h3');
    if (focus && heading) focusQuietly(heading);
  });
}

// "I got distracted — help me restart": one small thing per step, and where it is, first choice first (an empty
// answer box before one with an answer, then the question around it); only what's on screen counts.
export type Tiny = Record<JourneyStep, { label: string; targets: string[] }>;
export const ARABIC_TINY: Tiny = {
  warmup: { label: 'Answer one warm-up question', targets: ['#ar-step-warmup [data-ar-question]', '#ar-step-warmup h3'] },
  understand: { label: 'Read the example again', targets: ['#ar-step-understand [data-ar-example]', '#ar-step-understand h3'] },
  try: { label: 'Go back to your Try', targets: ['#ar-step-try [data-teaching-practice]', '#ar-step-try h3'] },
  check: { label: 'Answer one check', targets: ['#ar-step-check textarea[data-s="ar-answer"]', '#ar-step-check [data-ar-question]', '#ar-step-check h3'] },
  reflect: { label: 'Finish the session', targets: ['[data-action="ar-finish"]', '#ar-step-reflect h3'] },
};
export const CYBER_TINY: Tiny = {
  warmup: { label: 'Answer one warm-up question', targets: ['#cy-step-warmup [data-cy-question]', '#cy-step-warmup h3'] },
  understand: { label: 'Read the worked example again', targets: ['#cy-step-understand [data-teaching]', '#cy-step-understand h3'] },
  try: { label: 'Go back to your Try', targets: ['#cy-step-try [data-teaching-practice]', '#cy-step-try h3'] },
  check: { label: 'Answer one check', targets: ['#cy-step-check [data-cy-question]', '#cy-step-check h3'] },
  reflect: { label: 'Finish in your study session', targets: ['#cy-step-reflect a[href="#study/session"]', '#cy-step-reflect h3'] },
};
export function tinyTarget(tiny: Tiny, step: JourneyStep): HTMLElement | null {
  for (const t of tiny[step].targets) {
    const els = [...document.querySelectorAll<HTMLElement>(t)].filter(visible);
    const empty = els.find(e => e instanceof HTMLTextAreaElement && !e.value);
    if (empty || els[0]) return empty ?? els[0];
  }
  return null;
}
